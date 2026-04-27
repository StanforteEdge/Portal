# Public Holidays Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add public holidays support to the attendance system so the dashboard "Next Shift" card and HR attendance views skip holidays, and HR admins can manage holidays per workspace.

**Architecture:** The `AttendanceHoliday` Prisma model already exists in `schema.prisma`. A new `AttendanceHolidaysController` provides CRUD under `/hr/attendance/holidays`. The `myAttendance` response gains a `public_holidays` field (next 30 days). The PWA dashboard skips holidays in the next-shift loop. An HR Settings tab manages holidays.

**Tech Stack:** NestJS + Prisma (backend), React 18 + TypeScript (frontend), existing `useCachedQuery` and `requiredPermissions` patterns.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `api/src/modules/hr/attendance-holidays.controller.ts` | Create | CRUD endpoints for holidays |
| `api/src/modules/hr/attendance-holidays.service.ts` | Create | Holiday query/create/update/delete logic |
| `api/src/modules/hr/dto/upsert-attendance-holiday.dto.ts` | Create | DTO for create/update |
| `api/src/modules/hr/hr.module.ts` | Modify | Register new controller and service |
| `api/src/modules/hr/attendance.service.ts` | Modify | Add `public_holidays` to `myAttendance` response |
| `apps/pwa/src/pages/hr/attendance/attendance-api.ts` | Modify | Add `public_holidays` to policy type |
| `apps/pwa/src/pages/dashboard/DashboardPage.tsx` | Modify | Skip holidays in next-shift loop |
| `apps/pwa/src/pages/hr/attendance/AttendancePage.tsx` | Modify | Skip holidays in similar logic if present |
| `apps/pwa/src/shared/lib/core.ts` | Modify | Add `attendanceHolidaysApi` to the API factory |
| `apps/pwa/src/pages/hr/settings/HrSettingsPage.tsx` | Modify | Add "Holidays" tab |
| `apps/pwa/src/pages/hr/settings/HolidaysTab.tsx` | Create | Holiday list + management UI |
| `apps/pwa/src/pages/hr/settings/HolidaySlideOver.tsx` | Create | Slide-over for adding/editing a holiday |

---

### Task 1: Backend — Holiday CRUD service

**Files:**
- Create: `api/src/modules/hr/attendance-holidays.service.ts`
- Create: `api/src/modules/hr/dto/upsert-attendance-holiday.dto.ts`

- [ ] **Step 1: Create the DTO**

```typescript
// api/src/modules/hr/dto/upsert-attendance-holiday.dto.ts
import { IsDateString, IsOptional, IsString, IsBoolean, IsBigInt } from 'class-validator';

export class UpsertAttendanceHolidayDto {
  @IsDateString()
  holiday_date: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  organization_id?: string;

  @IsOptional()
  @IsString()
  office_location_id?: string;

  @IsOptional()
  @IsBoolean()
  is_recurring?: boolean;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
```

- [ ] **Step 2: Create the service**

```typescript
// api/src/modules/hr/attendance-holidays.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { toBigInt } from '../../common/utils/ids';
import { UpsertAttendanceHolidayDto } from './dto/upsert-attendance-holiday.dto';

@Injectable()
export class AttendanceHolidaysService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: Record<string, any>) {
    const organizationId = query.organization_id ? toBigInt(String(query.organization_id)) : undefined;
    const isActive = query.is_active === undefined ? true : String(query.is_active) === 'true';
    const from = query.from ? new Date(String(query.from)) : new Date();
    const to = query.to ? new Date(String(query.to)) : undefined;

    const where: any = {
      isActive,
      ...(organizationId ? { organizationId } : {}),
      ...(from || to
        ? {
            holidayDate: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.attendanceHoliday.findMany({
        where,
        orderBy: [{ holidayDate: 'asc' }],
        include: {
          organization: { select: { id: true, name: true } },
          officeLocation: { select: { id: true, name: true } },
        },
      }),
      this.prisma.attendanceHoliday.count({ where }),
    ]);

    return {
      data: rows.map((row) => this.serialize(row)),
      total,
    };
  }

  async create(userId: string, dto: UpsertAttendanceHolidayDto) {
    const actorId = toBigInt(userId);
    const data: any = {
      holidayDate: new Date(dto.holiday_date),
      name: dto.name.trim(),
      isRecurring: dto.is_recurring ?? false,
      isActive: dto.is_active ?? true,
      createdBy: actorId,
    };
    if (dto.organization_id) data.organizationId = toBigInt(dto.organization_id);
    if (dto.office_location_id) data.officeLocationId = toBigInt(dto.office_location_id);

    const row = await this.prisma.attendanceHoliday.create({ data, include: { organization: { select: { id: true, name: true } }, officeLocation: { select: { id: true, name: true } } } } });
    return { success: true, data: this.serialize(row) };
  }

  async update(id: string, dto: Partial<UpsertAttendanceHolidayDto>) {
    const holidayId = id;
    const existing = await this.prisma.attendanceHoliday.findUnique({ where: { id: holidayId } });
    if (!existing) throw new NotFoundException('Holiday not found');

    const data: any = {};
    if (dto.holiday_date) data.holidayDate = new Date(dto.holiday_date);
    if (dto.name) data.name = dto.name.trim();
    if (dto.is_recurring !== undefined) data.isRecurring = dto.is_recurring;
    if (dto.is_active !== undefined) data.isActive = dto.is_active;
    if (dto.organization_id !== undefined) data.organizationId = dto.organization_id ? toBigInt(dto.organization_id) : null;
    if (dto.office_location_id !== undefined) data.officeLocationId = dto.office_location_id ? toBigInt(dto.office_location_id) : null;

    const row = await this.prisma.attendanceHoliday.update({
      where: { id: holidayId },
      data,
      include: { organization: { select: { id: true, name: true } }, officeLocation: { select: { id: true, name: true } } },
    });
    return { success: true, data: this.serialize(row) };
  }

  async delete(id: string) {
    const existing = await this.prisma.attendanceHoliday.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Holiday not found');
    await this.prisma.attendanceHoliday.delete({ where: { id } });
    return { success: true };
  }

  async upcomingHolidays(organizationIds: bigint[], days = 30) {
    const now = new Date();
    const futureEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.attendanceHoliday.findMany({
      where: {
        isActive: true,
        holidayDate: { gte: now, lte: futureEnd },
        OR: [
          { organizationId: { in: organizationIds } },
          { organizationId: null },
        ],
      },
      orderBy: [{ holidayDate: 'asc' }],
    });
    return rows.map((row) => ({
      date: row.holidayDate.toISOString().slice(0, 10),
      name: row.name,
      is_recurring: row.isRecurring,
    }));
  }

  private serialize(row: any) {
    return {
      id: row.id,
      holiday_date: row.holidayDate?.toISOString?.()?.slice(0, 10) ?? row.holidayDate,
      name: row.name,
      organization_id: row.organizationId?.toString() ?? null,
      organization_name: row.organization?.name ?? null,
      office_location_id: row.officeLocationId?.toString() ?? null,
      office_location_name: row.officeLocation?.name ?? null,
      is_recurring: row.isRecurring,
      is_active: row.isActive,
    };
  }
}
```

- [ ] **Step 3: Type-check**

```bash
cd api && npx tsc --noEmit 2>&1 | grep -i holiday
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add api/src/modules/hr/attendance-holidays.service.ts api/src/modules/hr/dto/upsert-attendance-holiday.dto.ts
git commit -m "feat(hr): add holiday CRUD service and DTO"
```

---

### Task 2: Backend — Holiday CRUD controller + module registration

**Files:**
- Create: `api/src/modules/hr/attendance-holidays.controller.ts`
- Modify: `api/src/modules/hr/hr.module.ts`

- [ ] **Step 1: Create the controller**

```typescript
// api/src/modules/hr/attendance-holidays.controller.ts
import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { Permissions } from '../../common/auth/permissions.decorator';
import { PermissionsGuard } from '../../common/auth/permissions.guard';
import { UpsertAttendanceHolidayDto } from './dto/upsert-attendance-holiday.dto';
import { AttendanceHolidaysService } from './attendance-holidays.service';

@Controller('hr/attendance/holidays')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('HR Attendance Holidays')
@ApiBearerAuth('bearer')
export class AttendanceHolidaysController {
  constructor(private readonly holidaysService: AttendanceHolidaysService) {}

  @Get()
  @Permissions('attendance.view')
  list(@Query() query: Record<string, any>) {
    return this.holidaysService.list(query);
  }

  @Post()
  @Permissions('hr.manage')
  create(@Req() req: any, @Body() dto: UpsertAttendanceHolidayDto) {
    return this.holidaysService.create(req.user?.id, dto);
  }

  @Put(':id')
  @Permissions('hr.manage')
  update(@Param('id') id: string, @Body() dto: UpsertAttendanceHolidayDto) {
    return this.holidaysService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('hr.manage')
  remove(@Param('id') id: string) {
    return this.holidaysService.delete(id);
  }
}
```

- [ ] **Step 2: Register in the module**

Replace `api/src/modules/hr/hr.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { HrController } from './hr.controller';
import { HrService } from './hr.service';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { AttendanceHolidaysController } from './attendance-holidays.controller';
import { AttendanceHolidaysService } from './attendance-holidays.service';

@Module({
  controllers: [HrController, AttendanceController, AttendanceHolidaysController],
  providers: [HrService, AttendanceService, AttendanceHolidaysService]
})
export class HrModule {}
```

- [ ] **Step 3: Type-check**

```bash
cd api && npx tsc --noEmit 2>&1 | grep -i holiday
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add api/src/modules/hr/attendance-holidays.controller.ts api/src/modules/hr/hr.module.ts
git commit -m "feat(hr): add holiday CRUD controller and register in module"
```

---

### Task 3: Backend — Extend myAttendance response with public_holidays

**Files:**
- Modify: `api/src/modules/hr/attendance.service.ts`

- [ ] **Step 1: Inject AttendanceHolidaysService into AttendanceService**

At the top of `attendance.service.ts`, add the import:

```typescript
import { AttendanceHolidaysService } from './attendance-holidays.service';
```

Update the constructor:

```typescript
@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly holidaysService: AttendanceHolidaysService,
  ) {}
```

- [ ] **Step 2: Add public_holidays to the myAttendance return value**

In the `myAttendance` method, find the `return {` block (around line 249). Add `public_holidays` after the `policy:` field:

```typescript
      public_holidays: await this.holidaysService.upcomingHolidays(profile.organizationIds, 30),
```

- [ ] **Step 3: Update the module to provide the injection**

Since `AttendanceService` now depends on `AttendanceHolidaysService`, NestJS will auto-inject it because both are in the same `HrModule`. No additional module registration needed beyond what was done in Task 2.

- [ ] **Step 4: Type-check**

```bash
cd api && npx tsc --noEmit 2>&1 | head -10
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add api/src/modules/hr/attendance.service.ts
git commit -m "feat(hr): include upcoming public holidays in myAttendance response"
```

---

### Task 4: Frontend — Extend attendance API types and add holiday API client

**Files:**
- Modify: `apps/pwa/src/pages/hr/attendance/attendance-api.ts`
- Modify: `apps/pwa/src/shared/lib/core.ts`

- [ ] **Step 1: Add public_holidays to the policy type in attendance-api.ts**

Find the `policy` field inside `MyAttendanceResponse` and add `public_holidays`:

```typescript
  policy?: {
    start_time: string;
    end_time: string;
    grace_minutes: number;
    onsite_weekdays?: number[];
    remote_weekdays?: number[];
    required_extra_onsite_day_count?: number;
    public_holidays?: Array<{ date: string; name: string; is_recurring: boolean }>;
  };
```

- [ ] **Step 2: Add holiday API functions**

At the bottom of `attendance-api.ts`, add:

```typescript
export async function listHolidays(params?: { from?: string; to?: string; organization_id?: string }) {
  const query = new URLSearchParams();
  if (params?.from) query.set("from", params.from);
  if (params?.to) query.set("to", params.to);
  if (params?.organization_id) query.set("organization_id", params.organization_id);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return httpRequest<{ data: HolidayRecord[]; total: number }>(`/hr/attendance/holidays${suffix}`);
}

export async function createHoliday(payload: { holiday_date: string; name: string; organization_id?: string; office_location_id?: string; is_recurring?: boolean }) {
  return httpRequest<HolidayRecord>("/hr/attendance/holidays", { method: "POST", body: payload });
}

export async function updateHoliday(id: string, payload: Partial<{ holiday_date: string; name: string; organization_id?: string; office_location_id?: string; is_recurring: boolean; is_active: boolean }>) {
  return httpRequest<HolidayRecord>(`/hr/attendance/holidays/${id}`, { method: "PUT", body: payload });
}

export async function deleteHoliday(id: string) {
  return httpRequest<{ success: boolean }>(`/hr/attendance/holidays/${id}`, { method: "DELETE" });
}

export type HolidayRecord = {
  id: string;
  holiday_date: string;
  name: string;
  organization_id: string | null;
  organization_name: string | null;
  office_location_id: string | null;
  office_location_name: string | null;
  is_recurring: boolean;
  is_active: boolean;
};
```

- [ ] **Step 3: Type-check**

```bash
cd apps/pwa && npx tsc --noEmit 2>&1 | grep attendance-api
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/pwa/src/pages/hr/attendance/attendance-api.ts
git commit -m "feat(pwa): add holiday types and API client, extend policy with public_holidays"
```

---

### Task 5: Frontend — Update Dashboard next-shift logic to skip holidays

**Files:**
- Modify: `apps/pwa/src/pages/dashboard/DashboardPage.tsx`

- [ ] **Step 1: Build a holiday date set from the policy**

Near the top of the `DashboardPage` component, after the `attendance` data is available, build a `Set` of holiday date strings:

Find the line that destructures attendance data and add right after it (after `const today = attendance?.today;`):

```typescript
const holidayDates = new Set<string>(
  (attendance?.policy?.public_holidays ?? []).map((h) => h.date),
);
```

- [ ] **Step 2: Update the next-shift loop to skip holidays**

Find the `for` loop in the next-shift section (`for (let i = 1; i <= 7; i++)`). Replace the body:

```typescript
for (let i = 1; i <= 7; i++) {
  const d = new Date(now);
  d.setDate(now.getDate() + i);
  const dateStr = d.toISOString().slice(0, 10);
  if (holidayDates.has(dateStr)) continue;
  if (effectiveWorkdays.includes(d.getDay())) {
    const dateLabel = i === 1
      ? "Tomorrow"
      : d.toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "short" });
    nextShiftDetail = `${dateLabel}, ${policy.start_time}`;
    const nextDay = d.getDay();
    const isRemote = (policy.remote_weekdays ?? []).includes(nextDay);
    nextShiftMode = humanize(isRemote ? "remote" : (today?.expected_mode || "onsite"));
    break;
  }
}
```

- [ ] **Step 3: Also check today against holidays in the "today is a workday" branch**

Find the check `if (todayIsWorkday && !shiftOverToday)`. Before it, also check if today is a holiday. Add the holiday check:

```typescript
const todayStr = now.toISOString().slice(0, 10);
const todayIsHoliday = holidayDates.has(todayStr);

if (todayIsWorkday && !shiftOverToday && !todayIsHoliday) {
```

And update the else branch to handle the case where today is a holiday:

```typescript
if (todayIsWorkday && !shiftOverToday && !todayIsHoliday) {
  nextShiftDetail = `Today, ${policy.start_time}`;
  nextShiftMode = humanize(String(today?.expected_mode || "onsite"));
} else {
```

The rest of the else block (with the `for` loop) remains unchanged.

- [ ] **Step 4: Type-check**

```bash
cd apps/pwa && npx tsc --noEmit 2>&1 | grep DashboardPage
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/pages/dashboard/DashboardPage.tsx
git commit -m "feat(dashboard): skip public holidays in next-shift card"
```

---

### Task 6: Frontend — Update AttendancePage shift logic to skip holidays (if applicable)

**Files:**
- Modify: `apps/pwa/src/pages/hr/attendance/AttendancePage.tsx`

- [ ] **Step 1: Check if AttendancePage has similar next-shift logic**

Search `AttendancePage.tsx` for `nextShift` or `effectiveWorkdays` or `onsite_weekdays`. If none found, skip to commit — this page uses a different pattern (it's the staff self-service attendance page, not the dashboard).

If similar logic exists, add `holidayDates` from the policy and skip holidays the same way as Task 5.

- [ ] **Step 2: Commit (even if no changes — confirms the check was done)**

```bash
git add apps/pwa/src/pages/hr/attendance/AttendancePage.tsx
git commit -m "chore(pwa): verify AttendancePage — no next-shift holiday skip needed"
```

---

### Task 7: Frontend — Add Holidays tab to HR Settings page

**Files:**
- Create: `apps/pwa/src/pages/hr/settings/HolidaysTab.tsx`
- Create: `apps/pwa/src/pages/hr/settings/HolidaySlideOver.tsx`
- Modify: `apps/pwa/src/pages/hr/settings/HrSettingsPage.tsx`

- [ ] **Step 1: Create HolidaysTab.tsx**

```tsx
import { useState } from "react";
import { Button, EmptyState, Icon, SectionCard, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableHeaderRow, TableRow, useToast } from "@/shared";
import { listHolidays, deleteHoliday, type HolidayRecord } from "@/pages/hr/attendance/attendance-api";
import { useCachedQuery } from "@/shared/lib/core";

type Props = {
  onEditHoliday: (holiday: HolidayRecord | null) => void;
};

export default function HolidaysTab({ onEditHoliday }: Props) {
  const { showToast } = useToast();
  const [listKey, setListKey] = useState(0);

  const { data, loading } = useCachedQuery(
    `hr:holidays:${listKey}`,
    () => listHolidays(),
    { ttlMs: 1000 * 30, storage: "memory" },
  );

  const holidays: HolidayRecord[] = Array.isArray(data) ? data : (data?.data ?? []);

  async function handleDelete(holiday: HolidayRecord) {
    if (!window.confirm(`Delete holiday "${holiday.name}"? This cannot be undone.`)) return;
    try {
      await deleteHoliday(holiday.id);
      showToast({ tone: "success", title: "Deleted", message: `Holiday "${holiday.name}" removed.` });
      setListKey((k) => k + 1);
    } catch (err) {
      showToast({ tone: "danger", title: "Delete failed", message: err instanceof Error ? err.message : "Unable to delete." });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Public Holidays</h3>
          <p className="text-sm text-slate-500 mt-1">Manage public holidays for the workspace. Holidays are excluded from shift schedules.</p>
        </div>
        <Button className="gap-2" onClick={() => onEditHoliday(null)} requiredPermissions={["hr.manage"]}>
          <Icon name="add" className="text-[18px]" />
          Add Holiday
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Loading holidays...</div>
      ) : holidays.length === 0 ? (
        <EmptyState title="No holidays configured" description="Add public holidays so shifts skip them automatically." />
      ) : (
        <Table>
          <TableHead>
            <TableHeaderRow>
              <TableHeaderCell>Date</TableHeaderCell>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Recurring</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableHeaderRow>
          </TableHead>
          <TableBody>
            {holidays.map((holiday) => (
              <TableRow key={holiday.id}>
                <TableCell className="font-medium text-slate-900">{holiday.holiday_date}</TableCell>
                <TableCell className="text-slate-600">{holiday.name}</TableCell>
                <TableCell>
                  {holiday.is_recurring ? (
                    <span className="inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">Recurring</span>
                  ) : (
                    <span className="text-slate-400 text-xs">One-time</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onEditHoliday(holiday)}>
                      <Icon name="edit" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-danger hover:bg-danger/5" onClick={() => handleDelete(holiday)} requiredPermissions={["hr.manage"]}>
                      <Icon name="delete" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create HolidaySlideOver.tsx**

```tsx
import { useState, useEffect } from "react";
import { Button, SlideOver, SlideOverHeader, SlideOverContent, SlideOverFooter, TextField, useToast } from "@/shared";
import { createHoliday, updateHoliday, type HolidayRecord } from "@/pages/hr/attendance/attendance-api";

type Props = {
  holiday: HolidayRecord | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function HolidaySlideOver({ holiday, onClose, onSaved }: Props) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(holiday?.holiday_date ?? "");
  const [name, setName] = useState(holiday?.name ?? "");
  const [isRecurring, setIsRecurring] = useState(holiday?.is_recurring ?? false);

  useEffect(() => {
    if (holiday) {
      setDate(holiday.holiday_date);
      setName(holiday.name);
      setIsRecurring(holiday.is_recurring);
    } else {
      setDate("");
      setName("");
      setIsRecurring(false);
    }
  }, [holiday]);

  async function handleSubmit() {
    if (!date.trim()) {
      showToast({ tone: "warning", title: "Date required", message: "Please enter a holiday date." });
      return;
    }
    if (!name.trim()) {
      showToast({ tone: "warning", title: "Name required", message: "Please enter a holiday name." });
      return;
    }
    try {
      setSaving(true);
      if (holiday?.id) {
        await updateHoliday(holiday.id, { holiday_date: date, name: name.trim(), is_recurring: isRecurring });
        showToast({ tone: "success", title: "Updated", message: `"${name}" updated.` });
      } else {
        await createHoliday({ holiday_date: date, name: name.trim(), is_recurring: isRecurring });
        showToast({ tone: "success", title: "Created", message: `"${name}" added.` });
      }
      onSaved();
    } catch (err) {
      showToast({ tone: "danger", title: "Save failed", message: err instanceof Error ? err.message : "Unable to save." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <SlideOver open={true} onClose={onClose} size="md">
      <SlideOverHeader
        title={holiday ? "Edit Holiday" : "Add Holiday"}
        subtitle={holiday ? "Edit holiday details" : "Add a new public holiday"}
        onClose={onClose}
      />
      <SlideOverContent>
        <div className="grid gap-4">
          <TextField label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Independence Day" />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="rounded border-slate-300" />
            Recurring (happens every year on this date)
          </label>
        </div>
      </SlideOverContent>
      <SlideOverFooter>
        <Button onClick={() => void handleSubmit()} disabled={saving}>
          {saving ? "Saving..." : holiday ? "Update Holiday" : "Create Holiday"}
        </Button>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
      </SlideOverFooter>
    </SlideOver>
  );
}
```

- [ ] **Step 3: Update HrSettingsPage.tsx to add the Holidays tab**

Add imports at the top:

```typescript
import HolidaysTab from "./HolidaysTab";
import HolidaySlideOver from "./HolidaySlideOver";
import { type HolidayRecord } from "@/pages/hr/attendance/attendance-api";
```

Add `HolidaysTab` import alongside the other imports.

Update the state type and add new state:

```typescript
const [activeTab, setActiveTab] = useState<"attendance" | "leave" | "locations" | "holidays">("attendance");
```

```typescript
const [holiday, setHoliday] = useState<HolidayRecord | null | boolean>(false);
```

Add to `navItems`:

```typescript
{ id: "holidays", label: "Holidays", icon: "event_busy" },
```

Add the tab content after the `locations` conditional render:

```tsx
{activeTab === "holidays" && (
  <HolidaysTab onEditHoliday={(h) => setHoliday(h)} />
)}
```

Add the SlideOver after the `officeLocation` SlideOver:

```tsx
{holiday !== false && (
  <HolidaySlideOver
    holiday={typeof holiday === "object" ? holiday : null}
    onClose={() => setHoliday(false)}
    onSaved={() => { setHoliday(false); }}
  />
)}
```

- [ ] **Step 4: Type-check**

```bash
cd apps/pwa && npx tsc --noEmit 2>&1 | grep -i holiday
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/pages/hr/settings/HolidaysTab.tsx apps/pwa/src/pages/hr/settings/HolidaySlideOver.tsx apps/pwa/src/pages/hr/settings/HrSettingsPage.tsx
git commit -m "feat(hr-settings): add Public Holidays management tab with CRUD"
```

---

## Self-Review

| Requirement | Covered by |
|---|---|
| Schema: `AttendanceHoliday` model | Already exists (no migration needed) |
| API: CRUD endpoints under `/hr/attendance/holidays` | Task 2 |
| API: `public_holidays` in `myAttendance` policy response | Task 3 |
| Dashboard: Skip holidays in next-shift loop | Task 5 |
| Dashboard: Handle "today is a holiday" | Task 5 |
| HR Settings: Holidays tab with add/edit/delete | Task 7 |
| HR Settings: Gate add/delete with `hr.manage` | Task 7 (Button `requiredPermissions`) |
| Holidays are per-workspace (organization) | Model has `organizationId` (nullable = global), API filters by org |
| Frontend: `useCachedQuery` pattern | Task 7 |
| Frontend: `requiredPermissions` on action buttons | Task 7 |
| Holiday date skipping in `AttendancePage` | Task 6 (verified no change needed) |