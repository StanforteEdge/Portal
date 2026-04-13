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
import {
  getHrAttendanceStats,
  listHrAttendance,
  listHrCorrections,
  reviewCorrection,
  type AdminCorrectionRow,
  type StaffDailyRow,
} from "./hr-attendance-api";
import StaffAttendanceSlideOver from "./StaffAttendanceSlideOver";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function formatTime(value: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function formatMins(mins: number) {
  if (!mins) return "0h";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

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

  const [dateFrom, setDateFrom] = useState(daysAgo(6));
  const [dateTo, setDateTo] = useState(today());
  const [statusFilter, setStatusFilter] = useState("");
  const [slideOver, setSlideOver] = useState<{
    userId: string;
    userName: string;
  } | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  const todayStr = today();

  const { data: stats } = useCachedQuery(
    `hr:attendance:stats:${todayStr}`,
    () => getHrAttendanceStats(todayStr),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const { data: attendanceData, loading: attLoading } = useCachedQuery(
    `hr:attendance:list:${dateFrom}:${dateTo}:${statusFilter}`,
    () =>
      listHrAttendance({
        from: dateFrom,
        to: dateTo,
        status: statusFilter || undefined,
      }),
    { ttlMs: 1000 * 30, storage: "memory" },
  );

  const { data: correctionsData, loading: corrLoading } = useCachedQuery(
    "hr:attendance:corrections",
    () => listHrCorrections(),
    { ttlMs: 1000 * 30, storage: "memory" },
  );

  const rows: StaffDailyRow[] = attendanceData?.data ?? [];
  const corrections: AdminCorrectionRow[] = correctionsData?.data ?? [];

  const userName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.email ||
    "HR Staff";

  async function handleReview(id: string, status: "approved" | "rejected") {
    try {
      setReviewLoading(true);
      await reviewCorrection(id, {
        status,
        review_notes: reviewNotes || undefined,
      });
      showToast({
        tone: "success",
        title: "Correction reviewed",
        message: `Marked as ${status}.`,
      });
      setReviewingId(null);
      setReviewNotes("");
    } catch (err) {
      showToast({
        tone: "danger",
        title: "Review failed",
        message:
          err instanceof Error ? err.message : "Unable to submit review.",
      });
    } finally {
      setReviewLoading(false);
    }
  }

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
                    <TableCell>{row.work_date}</TableCell>
                    <TableCell>{formatTime(row.first_in_at)}</TableCell>
                    <TableCell>{formatTime(row.last_out_at)}</TableCell>
                    <TableCell>{formatMins(row.worked_minutes)}</TableCell>
                    <TableCell>
                      {row.late_minutes > 0
                        ? formatMins(row.late_minutes)
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
                      <TableCell>{c.work_date}</TableCell>
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
                        {c.status === "pending" && reviewingId !== c.id ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setReviewingId(c.id)}
                          >
                            Review
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );

                  if (reviewingId !== c.id) return [mainRow];

                  const reviewRow = (
                    <TableRow key={`${c.id}-review`}>
                      <TableCell
                        colSpan={6}
                        className="bg-slate-50 px-4 py-3"
                      >
                        <div className="flex flex-wrap items-end gap-3">
                          <div className="flex-1">
                            <TextField
                              label="Review notes (optional)"
                              value={reviewNotes}
                              onChange={(e) => setReviewNotes(e.target.value)}
                            />
                          </div>
                          <Button
                            size="sm"
                            onClick={() =>
                              void handleReview(c.id, "approved")
                            }
                            disabled={reviewLoading}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() =>
                              void handleReview(c.id, "rejected")
                            }
                            disabled={reviewLoading}
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setReviewingId(null);
                              setReviewNotes("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );

                  return [mainRow, reviewRow];
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
    </AppShell>
  );
}
