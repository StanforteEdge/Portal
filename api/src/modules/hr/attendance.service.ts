import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { toBigInt } from '../../common/utils/ids';

type AttendancePolicy = {
  start_time: string;
  end_time: string;
  grace_minutes: number;
  max_future_minutes: number;
  max_past_days: number;
  allow_multiple_open_sessions: boolean;
  earliest_clock_in_minutes_before_start: number;
  latest_clock_out_minutes_after_end: number;
};

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async clockIn(userId: string, req: any, payload?: { source?: string; at?: string }) {
    const actorId = toBigInt(userId);
    const at = payload?.at ? new Date(payload.at) : new Date();
    if (Number.isNaN(at.getTime())) throw new BadRequestException('Invalid attendance time');
    const policy = await this.resolveAttendancePolicy(actorId);
    this.assertTimestampAllowed(at, policy, payload?.source);

    const workDate = this.toWorkDate(at);
    const entries = await this.prisma.attendanceEntry.findMany({
      where: { userId: actorId, workDate },
      orderBy: { entryAt: 'asc' }
    });
    const openClockIn = this.getOpenClockIn(entries);
    if (openClockIn && !policy.allow_multiple_open_sessions) {
      throw new BadRequestException('You are already clocked in for this day');
    }
    const earliestClockIn = new Date(this.atTime(workDate, policy.start_time).getTime() - policy.earliest_clock_in_minutes_before_start * 60000);
    if ((payload?.source ?? 'web') !== 'import' && at < earliestClockIn) {
      throw new BadRequestException('Clock in is too early for this schedule');
    }

    await this.prisma.attendanceEntry.create({
      data: {
        userId: actorId,
        entryType: 'clock_in',
        entryAt: at,
        workDate,
        source: payload?.source ?? 'web',
        createdBy: actorId,
        metadata: {
          ip: this.getIp(req),
          user_agent: this.getUserAgent(req)
        } as Prisma.InputJsonValue
      }
    });

    const daily = await this.recomputeDay(actorId, workDate);
    return { success: true, daily };
  }

  async clockOut(userId: string, req: any, payload?: { source?: string; at?: string }) {
    const actorId = toBigInt(userId);
    const at = payload?.at ? new Date(payload.at) : new Date();
    if (Number.isNaN(at.getTime())) throw new BadRequestException('Invalid attendance time');
    const policy = await this.resolveAttendancePolicy(actorId);
    this.assertTimestampAllowed(at, policy, payload?.source);
    const workDate = this.toWorkDate(at);

    const entries = await this.prisma.attendanceEntry.findMany({
      where: { userId: actorId, workDate },
      orderBy: { entryAt: 'asc' }
    });
    let openClockIns = 0;
    for (const entry of entries) {
      if (entry.entryType === 'clock_in') openClockIns += 1;
      if (entry.entryType === 'clock_out' && openClockIns > 0) openClockIns -= 1;
    }
    if (openClockIns <= 0) {
      throw new BadRequestException('No open clock-in found for this day');
    }
    const latestClockOut = new Date(this.atTime(workDate, policy.end_time).getTime() + policy.latest_clock_out_minutes_after_end * 60000);
    if ((payload?.source ?? 'web') !== 'import' && at > latestClockOut) {
      throw new BadRequestException('Clock out exceeds allowed window for this schedule');
    }

    await this.prisma.attendanceEntry.create({
      data: {
        userId: actorId,
        entryType: 'clock_out',
        entryAt: at,
        workDate,
        source: payload?.source ?? 'web',
        createdBy: actorId,
        metadata: {
          ip: this.getIp(req),
          user_agent: this.getUserAgent(req)
        } as Prisma.InputJsonValue
      }
    });

    const daily = await this.recomputeDay(actorId, workDate);
    return { success: true, daily };
  }

  async myAttendance(userId: string, query: Record<string, any>) {
    const actorId = toBigInt(userId);
    const from = query.from ? new Date(String(query.from)) : new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
    const to = query.to ? new Date(String(query.to)) : new Date();
    const fromDate = this.toWorkDate(from);
    const toDate = this.toWorkDate(to);

    const [entries, daily, policy] = await Promise.all([
      this.prisma.attendanceEntry.findMany({
        where: {
          userId: actorId,
          workDate: { gte: fromDate, lte: toDate }
        },
        orderBy: [{ workDate: 'desc' }, { entryAt: 'asc' }]
      }),
      this.prisma.attendanceDaily.findMany({
        where: {
          userId: actorId,
          workDate: { gte: fromDate, lte: toDate }
        },
        orderBy: { workDate: 'desc' }
      }),
      this.resolveAttendancePolicy(actorId)
    ]);

    const openClockIn = this.getOpenClockIn(entries);
    const action = this.resolveCurrentAction({ entries, policy, now: new Date() });
    const todayWorkDate = this.toWorkDate(new Date()).getTime();
    const todayDaily = daily.find((row) => this.toWorkDate(row.workDate).getTime() === todayWorkDate);
    return {
      entries: entries.map((row) => this.serializeEntry(row)),
      daily: daily.map((row) => this.serializeDaily(row)),
      current_state: {
        is_clocked_in: Boolean(openClockIn),
        last_clock_in_at: openClockIn?.entryAt ?? null,
        can_clock_in: action.canClockIn,
        can_clock_out: action.canClockOut,
        reason: action.reason
      },
      today: todayDaily ? this.serializeDaily(todayDaily) : null,
      policy: {
        start_time: policy.start_time,
        end_time: policy.end_time,
        grace_minutes: policy.grace_minutes
      }
    };
  }

  async summary(query: Record<string, any>) {
    const from = query.from ? new Date(String(query.from)) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const to = query.to ? new Date(String(query.to)) : new Date();
    const fromDate = this.toWorkDate(from);
    const toDate = this.toWorkDate(to);

    const rows = await this.prisma.attendanceDaily.groupBy({
      by: ['status'],
      where: { workDate: { gte: fromDate, lte: toDate } },
      _count: { _all: true }
    });

    const summary: Record<string, number> = {};
    for (const row of rows) summary[row.status] = row._count._all;
    return {
      from: fromDate,
      to: toDate,
      by_status: summary
    };
  }

  async records(query: Record<string, any>) {
    const from = query.from ? new Date(String(query.from)) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const to = query.to ? new Date(String(query.to)) : new Date();
    const fromDate = this.toWorkDate(from);
    const toDate = this.toWorkDate(to);
    const status = query.status ? String(query.status).trim().toLowerCase() : '';
    const userId = query.user_id ? toBigInt(String(query.user_id)) : null;
    const search = query.search ? String(query.search).trim().toLowerCase() : '';

    const dailyRows = await this.prisma.attendanceDaily.findMany({
      where: {
        workDate: { gte: fromDate, lte: toDate },
        ...(status ? { status } : {}),
        ...(userId ? { userId } : {})
      },
      orderBy: [{ workDate: 'desc' }, { userId: 'asc' }]
    });
    if (dailyRows.length === 0) {
      return { from: fromDate, to: toDate, data: [] };
    }

    const userIds = Array.from(new Set(dailyRows.map((row) => row.userId.toString())));
    const profiles = await this.prisma.profile.findMany({
      where: { id: { in: userIds.map((id) => toBigInt(id)) } },
      select: { id: true, email: true, username: true, firstName: true, lastName: true }
    });
    const profileMap = new Map(
      profiles.map((profile) => [
        profile.id.toString(),
        {
          id: profile.id.toString(),
          email: profile.email,
          username: profile.username,
          first_name: profile.firstName,
          last_name: profile.lastName
        }
      ])
    );

    const rows = dailyRows
      .map((row) => ({
        ...this.serializeDaily(row),
        profile: profileMap.get(row.userId.toString()) ?? null
      }))
      .filter((row) => {
        if (!search) return true;
        const name = `${row.profile?.first_name ?? ''} ${row.profile?.last_name ?? ''}`.trim().toLowerCase();
        return (
          name.includes(search) ||
          String(row.profile?.email ?? '').toLowerCase().includes(search) ||
          String(row.profile?.username ?? '').toLowerCase().includes(search)
        );
      });

    return {
      from: fromDate,
      to: toDate,
      data: rows
    };
  }

  private async recomputeDay(userId: bigint, workDate: Date) {
    const [entries, policy] = await Promise.all([
      this.prisma.attendanceEntry.findMany({
        where: { userId, workDate },
        orderBy: { entryAt: 'asc' }
      }),
      this.resolveAttendancePolicy(userId)
    ]);

    let firstInAt: Date | null = null;
    let lastOutAt: Date | null = null;
    let openIn: Date | null = null;
    let workedMinutes = 0;

    for (const entry of entries) {
      if (entry.entryType === 'clock_in') {
        if (!firstInAt) firstInAt = entry.entryAt;
        openIn = entry.entryAt;
      } else if (entry.entryType === 'clock_out') {
        if (openIn && entry.entryAt > openIn) {
          workedMinutes += Math.floor((entry.entryAt.getTime() - openIn.getTime()) / 60000);
          lastOutAt = entry.entryAt;
        }
        openIn = null;
      }
    }

    const scheduledMinutes = this.diffMinutesOnDay(workDate, policy.start_time, policy.end_time);
    let lateMinutes = 0;
    if (firstInAt) {
      const expectedStart = this.atTime(workDate, policy.start_time);
      const graceStart = new Date(expectedStart.getTime() + policy.grace_minutes * 60000);
      if (firstInAt > graceStart) {
        lateMinutes = Math.floor((firstInAt.getTime() - graceStart.getTime()) / 60000);
      }
    }

    const overtimeMinutes = Math.max(0, workedMinutes - scheduledMinutes);
    const status = !firstInAt ? 'absent' : lateMinutes > 0 ? 'late' : 'present';

    const daily = await this.prisma.attendanceDaily.upsert({
      where: {
        unique_attendance_daily: { userId, workDate }
      },
      update: {
        status,
        scheduledMinutes,
        workedMinutes,
        lateMinutes,
        overtimeMinutes,
        firstInAt,
        lastOutAt,
        policySnapshot: policy as Prisma.InputJsonValue,
        computedAt: new Date()
      },
      create: {
        userId,
        workDate,
        status,
        scheduledMinutes,
        workedMinutes,
        lateMinutes,
        overtimeMinutes,
        firstInAt,
        lastOutAt,
        policySnapshot: policy as Prisma.InputJsonValue,
        computedAt: new Date()
      }
    });

    return this.serializeDaily(daily);
  }

  private async resolveAttendancePolicy(userId: bigint): Promise<AttendancePolicy> {
    const defaultPolicy: AttendancePolicy = {
      start_time: '09:00',
      end_time: '17:00',
      grace_minutes: 15,
      max_future_minutes: 5,
      max_past_days: 7,
      allow_multiple_open_sessions: false,
      earliest_clock_in_minutes_before_start: 240,
      latest_clock_out_minutes_after_end: 720
    };

    const profile = await this.prisma.profile.findUnique({
      where: { id: userId },
      include: {
        employeeProfile: { select: { primaryOrganizationId: true, primaryTeamId: true, employmentType: true } }
      }
    });

    const orgId = profile?.employeeProfile?.primaryOrganizationId?.toString();
    const teamId = profile?.employeeProfile?.primaryTeamId?.toString();
    const staffType = profile?.employeeProfile?.employmentType ?? undefined;

    const now = new Date();
    const policies = await this.prisma.policy.findMany({
      where: {
        module: 'attendance',
        policyKey: 'schedule',
        isActive: true,
        OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: now } }],
        AND: [{ OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }] }]
      }
    });

    const matched = policies
      .filter((row) => {
        if (row.scopeType === 'global') return true;
        if (row.scopeType === 'organization') return orgId && row.scopeId === orgId;
        if (row.scopeType === 'team') return teamId && row.scopeId === teamId;
        if (row.scopeType === 'staff_type') return staffType && row.scopeId === staffType;
        if (row.scopeType === 'user') return row.scopeId === userId.toString();
        return false;
      })
      .sort((a, b) => {
        const rank = this.scopeRank(a.scopeType) - this.scopeRank(b.scopeType);
        if (rank !== 0) return rank;
        return a.priority - b.priority;
      });

    const merged = matched.reduce<Record<string, unknown>>((acc, row) => {
      const cfg =
        row.configJson && typeof row.configJson === 'object' && !Array.isArray(row.configJson)
          ? (row.configJson as Record<string, unknown>)
          : {};
      return { ...acc, ...cfg };
    }, defaultPolicy as unknown as Record<string, unknown>);

    return {
      start_time: typeof merged.start_time === 'string' ? merged.start_time : defaultPolicy.start_time,
      end_time: typeof merged.end_time === 'string' ? merged.end_time : defaultPolicy.end_time,
      grace_minutes:
        typeof merged.grace_minutes === 'number'
          ? merged.grace_minutes
          : Number(merged.grace_minutes ?? defaultPolicy.grace_minutes),
      max_future_minutes:
        typeof merged.max_future_minutes === 'number'
          ? merged.max_future_minutes
          : Number(merged.max_future_minutes ?? defaultPolicy.max_future_minutes),
      max_past_days:
        typeof merged.max_past_days === 'number'
          ? merged.max_past_days
          : Number(merged.max_past_days ?? defaultPolicy.max_past_days),
      allow_multiple_open_sessions:
        typeof merged.allow_multiple_open_sessions === 'boolean'
          ? merged.allow_multiple_open_sessions
          : String(merged.allow_multiple_open_sessions ?? defaultPolicy.allow_multiple_open_sessions) === 'true',
      earliest_clock_in_minutes_before_start:
        typeof merged.earliest_clock_in_minutes_before_start === 'number'
          ? merged.earliest_clock_in_minutes_before_start
          : Number(merged.earliest_clock_in_minutes_before_start ?? defaultPolicy.earliest_clock_in_minutes_before_start),
      latest_clock_out_minutes_after_end:
        typeof merged.latest_clock_out_minutes_after_end === 'number'
          ? merged.latest_clock_out_minutes_after_end
          : Number(merged.latest_clock_out_minutes_after_end ?? defaultPolicy.latest_clock_out_minutes_after_end)
    };
  }

  private resolveCurrentAction(input: { entries: Array<{ entryType: string; entryAt: Date }>; policy: AttendancePolicy; now: Date }) {
    const { entries, policy, now } = input;
    const openClockIn = this.getOpenClockIn(entries);
    const today = this.toWorkDate(now);
    const earliestClockIn = new Date(this.atTime(today, policy.start_time).getTime() - policy.earliest_clock_in_minutes_before_start * 60000);
    const latestClockOut = new Date(this.atTime(today, policy.end_time).getTime() + policy.latest_clock_out_minutes_after_end * 60000);

    if (openClockIn) {
      if (now > latestClockOut) {
        return { canClockIn: false, canClockOut: false, reason: 'Clock out window closed for today' };
      }
      return { canClockIn: false, canClockOut: true, reason: null };
    }

    if (now < earliestClockIn) {
      return { canClockIn: false, canClockOut: false, reason: 'Clock in is not open yet' };
    }
    if (now > latestClockOut) {
      return { canClockIn: false, canClockOut: false, reason: 'Clock window closed for today' };
    }

    return { canClockIn: true, canClockOut: false, reason: null };
  }

  private assertTimestampAllowed(at: Date, policy: AttendancePolicy, source?: string) {
    if ((source ?? 'web') === 'import') return;

    const now = new Date();
    const maxFuture = new Date(now.getTime() + policy.max_future_minutes * 60000);
    if (at > maxFuture) {
      throw new BadRequestException('Attendance time cannot be in the future');
    }

    const maxPast = new Date(now.getTime() - policy.max_past_days * 24 * 60 * 60000);
    if (at < maxPast) {
      throw new BadRequestException(`Attendance backdate exceeds ${policy.max_past_days} day limit`);
    }
  }

  private scopeRank(scopeType: string) {
    if (scopeType === 'global') return 0;
    if (scopeType === 'organization') return 1;
    if (scopeType === 'team') return 2;
    if (scopeType === 'staff_type') return 3;
    if (scopeType === 'user') return 4;
    return 99;
  }

  private serializeEntry(row: any) {
    return {
      id: row.id,
      user_id: row.userId.toString(),
      entry_type: row.entryType,
      entry_at: row.entryAt,
      work_date: row.workDate,
      source: row.source,
      metadata: row.metadata,
      created_at: row.createdAt
    };
  }

  private serializeDaily(row: any) {
    return {
      id: row.id,
      user_id: row.userId.toString(),
      work_date: row.workDate,
      status: row.status,
      scheduled_minutes: row.scheduledMinutes,
      worked_minutes: row.workedMinutes,
      late_minutes: row.lateMinutes,
      overtime_minutes: row.overtimeMinutes,
      first_in_at: row.firstInAt,
      last_out_at: row.lastOutAt,
      computed_at: row.computedAt
    };
  }

  private getOpenClockIn(entries: Array<{ entryType: string; entryAt: Date }>) {
    let open: { entryType: string; entryAt: Date } | null = null;
    for (const entry of entries.sort((a, b) => a.entryAt.getTime() - b.entryAt.getTime())) {
      if (entry.entryType === 'clock_in') open = entry;
      if (entry.entryType === 'clock_out') open = null;
    }
    return open;
  }

  private toWorkDate(value: Date) {
    const date = new Date(value);
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  }

  private atTime(workDate: Date, hhmm: string) {
    const [hh, mm] = hhmm.split(':').map((v) => Number(v));
    return new Date(Date.UTC(workDate.getUTCFullYear(), workDate.getUTCMonth(), workDate.getUTCDate(), hh || 0, mm || 0, 0));
  }

  private diffMinutesOnDay(workDate: Date, start: string, end: string) {
    const s = this.atTime(workDate, start);
    const e = this.atTime(workDate, end);
    return Math.max(0, Math.floor((e.getTime() - s.getTime()) / 60000));
  }

  private getIp(req: any): string | null {
    return (req?.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req?.ip ?? null;
  }

  private getUserAgent(req: any): string | null {
    return (req?.headers?.['user-agent'] as string) ?? null;
  }
}
