// apps/pwa/src/modules/hr/attendance/HrAttendancePage.tsx
import { useState } from "react";
import {
  Button,
  Chip,
  EmptyState,
  PageHeader,
  SectionCard,
  SelectField,
  StatCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
  TextField,
  useToast,
} from "@/shared";
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import { useCachedQuery } from "@/shared/lib/core";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import { attendanceApi } from "@/shared/lib/core";
import { 
  type AdminCorrectionRow, 
  type StaffDailyRow 
} from "@stanforte/shared";
import StaffAttendanceSlideOver from "./StaffAttendanceSlideOver";
import CorrectionReviewSlideOver from "./CorrectionReviewSlideOver";
import { formatDate, formatTime, formatTimeNextDay, formatDuration } from "@stanforte/shared";

// Local test function for 12-hour time
const testFormatTime = (date: string | Date | null | undefined): string => {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
};

const rowStatusVariant: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  present: "success",
  late: "warning",
  absent: "danger",
};

const corrStatusVariant: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

export default function HrAttendancePage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const { data: profile } = useCachedQuery(
    "hr:profile",
    () => getWorkspaceProfile(),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
  const [statusFilter, setStatusFilter] = useState("");
  const [slideOver, setSlideOver] = useState<{
    userId: string;
    userName: string;
  } | null>(null);
  const [reviewingItem, setReviewingItem] = useState<AdminCorrectionRow | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);

  const { data: stats } = useCachedQuery(
    `hr:attendance:stats:${todayStr}`,
    () => attendanceApi.getStats(todayStr),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const { data: attendanceData, loading: attLoading } = useCachedQuery(
    `hr:attendance:list:${dateFrom}:${dateTo}:${statusFilter}`,
    () =>
      attendanceApi.listRecords({
        from: dateFrom,
        to: dateTo,
        status: statusFilter || undefined,
      }),
    { ttlMs: 1000 * 30, storage: "memory" },
  );

  const { data: correctionsData, loading: corrLoading } = useCachedQuery(
    "hr:attendance:corrections",
    () => attendanceApi.listCorrections(),
    { ttlMs: 1000 * 30, storage: "memory" },
  );

  const rows: StaffDailyRow[] = (attendanceData || []) as any;
  const corrections: AdminCorrectionRow[] = (correctionsData || []) as any;

  const userName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.email ||
    "HR Staff";

  return (
    <AppShell
      navigation={buildAppNavigation()}
      activeLabel="hr-attendance"
      user={{
        name: userName,
        role: profile?.employee_profile?.job_title || "HR Staff",
      }}
      mobileNav={buildAppMobileNav("HR")}
    >
      <PageHeader
        breadcrumbs={[{ label: "HR", path: "/hr" }, { label: "Attendance" }]}
        title="Attendance"
        description="Monitor daily attendance, worked hours, and manage correction requests."
      />

      {/* TEST: Current time */}
      <div className="rounded-xl bg-blue-100 p-4 text-center">
        <p className="text-sm text-blue-800">Test Local Time: {testFormatTime(new Date().toISOString())}</p>
        <p className="text-xs text-blue-600">Test 19:44: {testFormatTime("2026-04-21T19:44:00Z")}</p>
      </div>

      <div className="grid gap-6">
        {/* Today's snapshot */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            label="Total Staff"
            value={String(stats?.total_staff ?? 0)}
            tone="neutral"
            icon="group"
          />
          <StatCard
            label="Clocked In"
            value={String(stats?.clocked_in ?? 0)}
            tone="success"
            icon="login"
          />
          <StatCard
            label="Late"
            value={String(stats?.late ?? 0)}
            tone="warning"
            icon="schedule"
          />
          <StatCard
            label="Absent / Not In"
            value={String(stats?.absent ?? 0)}
            tone="danger"
            icon="person_off"
          />
        </div>

        {/* Staff Attendance Table */}
        <SectionCard
          title="Staff Attendance"
          description="Records for the selected date range."
        >
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <TextField
              label="From"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <TextField
              label="To"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
            <SelectField
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
            </SelectField>
          </div>

          {attLoading ? (
            <div className="text-sm text-slate-500">Loading attendance...</div>
          ) : (
            <Table>
              <TableHead>
                <TableHeaderRow>
                  <TableHeaderCell>Staff</TableHeaderCell>
                  <TableHeaderCell>Date</TableHeaderCell>
                  <TableHeaderCell>Clock In</TableHeaderCell>
                  <TableHeaderCell>Clock Out</TableHeaderCell>
                  <TableHeaderCell>Worked</TableHeaderCell>
                  <TableHeaderCell>Late</TableHeaderCell>
                  <TableHeaderCell>Mode</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>{""}</TableHeaderCell>
                </TableHeaderRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={`${row.user_id}-${row.work_date}`}>
                    <TableCell>
                      <p className="font-semibold text-slate-900">
                        {row.user_name}
                      </p>
                      <p className="text-xs text-slate-500">{row.email}</p>
                    </TableCell>
                    <TableCell>{formatDate(row.work_date)}</TableCell>
                    <TableCell>{formatTime(row.first_in_at)}</TableCell>
                    <TableCell>{formatTimeNextDay(row.last_out_at, row.first_in_at)}</TableCell>
                    <TableCell>{formatDuration(row.worked_minutes)}</TableCell>
                    <TableCell>
                      {row.late_minutes > 0
                        ? formatDuration(row.late_minutes)
                        : "-"}
                    </TableCell>
                    <TableCell className="capitalize">
                      {row.attendance_mode ?? "-"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        variant={rowStatusVariant[row.status] ?? "neutral"}
                      >
                        {row.status}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setSlideOver({
                            userId: row.user_id,
                            userName: row.user_name,
                          })
                        }
                      >
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!rows.length ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="py-10 text-center text-slate-500"
                    >
                      No attendance records for this period.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          )}
        </SectionCard>

        {/* Correction Requests */}
        <SectionCard
          title="Correction Requests"
          description="Pending and recent attendance corrections submitted by staff."
        >
          {corrLoading ? (
            <div className="text-sm text-slate-500">
              Loading corrections...
            </div>
          ) : corrections.length ? (
            <Table>
              <TableHead>
                <TableHeaderRow>
                  <TableHeaderCell>Staff</TableHeaderCell>
                  <TableHeaderCell>Date</TableHeaderCell>
                  <TableHeaderCell>Type</TableHeaderCell>
                  <TableHeaderCell>Reason</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>{""}</TableHeaderCell>
                </TableHeaderRow>
              </TableHead>
              <TableBody>
                {corrections.flatMap((c) => {
                  const mainRow = (
                    <TableRow key={c.id}>
                      <TableCell>
                        <p className="font-semibold text-slate-900">
                          {c.user_name}
                        </p>
                        <p className="text-xs text-slate-500">{c.email}</p>
                      </TableCell>
                      <TableCell>{formatDate(c.work_date)}</TableCell>
                      <TableCell className="capitalize">
                        {c.request_type.replace(/_/g, " ")}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {c.reason}
                      </TableCell>
                      <TableCell>
                        <Chip
                          variant={corrStatusVariant[c.status] ?? "neutral"}
                        >
                          {c.status}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        {c.status === "pending" ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setReviewingItem(c)}
                          >
                            Review
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );

                  return [mainRow];
                })}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              title="No correction requests"
              description="Staff correction requests will appear here."
            />
          )}
        </SectionCard>
      </div>

      {slideOver ? (
        <StaffAttendanceSlideOver
          userId={slideOver.userId}
          userName={slideOver.userName}
          from={dateFrom}
          to={dateTo}
          onClose={() => setSlideOver(null)}
        />
      ) : null}

      {reviewingItem ? (
        <CorrectionReviewSlideOver 
          correction={reviewingItem}
          onClose={() => setReviewingItem(null)}
          onReviewed={() => {
            setReviewingItem(null);
            // Quick fix to refresh data after review
            window.location.reload(); 
          }}
        />
      ) : null}
    </AppShell>
  );
}
