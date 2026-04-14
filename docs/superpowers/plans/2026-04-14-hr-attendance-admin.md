# HR Attendance Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the self-service attendance page at `/hr/attendance` with an HR admin view showing today's snapshot stats, a filterable staff attendance table with per-staff drill-in, and a correction requests manager with inline approve/reject.

**Architecture:** Three new files — `hr-attendance-api.ts` (admin API types/functions), `StaffAttendanceSlideOver.tsx` (drill-in panel), and `HrAttendancePage.tsx` (main page) — plus route and navigation wiring in `App.tsx` and `hr-data.ts`. The existing `AttendancePage.tsx` (staff self-service) is left untouched on its `/attendance` route.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, React Router v6, `useCachedQuery` (returns `{ data, loading, error }`), shared UI components from `@/shared`

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `apps/pwa/src/modules/hr/attendance/hr-attendance-api.ts` | Admin-side types + API functions |
| Create | `apps/pwa/src/modules/hr/attendance/StaffAttendanceSlideOver.tsx` | Slide-over panel for one staff member's detail |
| Create | `apps/pwa/src/modules/hr/attendance/HrAttendancePage.tsx` | Main HR admin attendance page |
| Modify | `apps/pwa/src/modules/hr/hr-data.ts` | Update Attendance nav path to `/hr/attendance` |
| Modify | `apps/pwa/src/App.tsx` | Add `/hr/attendance` route inside HR module guard |

---

## Codebase Context (read before starting)

**Pattern to follow — `HrDashboardPage.tsx`:**
```tsx
import { AppShell } from "@/shared/components/layout/AppShell";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import { useCachedQuery } from "@/shared/lib/core";
import { useAuth } from "@/shared/context/AuthProvider";

// In JSX:
<AppShell
  navigation={buildAppNavigation()}
  activeLabel="Attendance"   // must match a label in the generated nav
  user={{ name: userName, role: profile?.employee_profile?.job_title || "HR Staff" }}
  mobileNav={buildAppMobileNav("HR")}
>
  <PageHeader breadcrumbs={[{ label: "HR", path: "/hr" }, { label: "Attendance" }]} title="..." description="..." />
  ...
</AppShell>
```

**`useCachedQuery` signature:**
```ts
const { data, loading, error } = useCachedQuery(
  "cache-key",
  () => apiFn(),
  { ttlMs: 1000 * 30, storage: "memory" },
);
// Note: NO refetch property.
```

**Shared components available from `@/shared`:**
`AppShell`, `Button`, `Chip`, `EmptyState`, `Icon`, `PageHeader`, `SectionCard`, `SelectField`, `StatCard`, `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeaderCell`, `TableHeaderRow`, `TableRow`, `TextField`, `useToast`

- `SectionCard` requires `title` prop (not optional). Optional: `description`, `action`.
- `EmptyState` accepts only `title`, `description`, `actionLabel`. No `icon` or `action` prop.
- `Button` variants: `primary` | `secondary` | `ghost` | `danger`. No `asChild`.
- `useToast` returns `{ showToast }`. Usage: `showToast({ tone: "success"|"danger"|"warning", title, message })`.
- `Chip` variants: `success` | `warning` | `danger` | `neutral` | `pending`.
- `StatCard` props: `label`, `value` (string), `tone`, optional `icon` (Material icon name), optional `hint`.
- `SelectField` props: `label`, `value`, `onChange`, `options: Array<{ label: string; value: string }>`.
- `TextField` props: `label`, `value`, `onChange`, optional `type` (e.g. `"date"`), optional `readOnly`.
- `TableHeaderCell` must have children — use `<TableHeaderCell>{""}</TableHeaderCell>` for empty header cells.

**Existing attendance types (from `attendance-api.ts`):**
```ts
type AttendanceDaily = {
  id: string; user_id: string; work_date: string; status: string;
  attendance_mode?: string | null; first_in_at: string | null; last_out_at: string | null;
  worked_minutes: number; late_minutes: number; overtime_minutes: number;
  scheduled_minutes: number; computed_at: string;
};
type AttendanceEntry = {
  id: string; user_id: string; entry_type: string; entry_at: string;
  work_date: string; attendance_mode?: string | null; source: string; created_at: string;
};
```

**Existing App.tsx HR routes (lines 103–111):**
```tsx
<Route element={<ModuleRoute moduleKey="hr" />}>
  <Route path="/hr" element={<HrDashboardPage />} />
  <Route path="/hr/employees" element={<HrEmployeesPage />} />
  <Route path="/hr/employees/new" element={<HrEmployeeCreatePage />} />
  <Route path="/hr/employees/:id" element={<HrEmployeeDetailPage />} />
  <Route path="/attendance" element={<AttendancePage />} />   {/* self-service — keep */}
  <Route path="/leave" element={<LeavePage />} />
  <Route path="/leave/new/form" element={<LeaveRequestFormPage />} />
  <Route path="/leave/details" element={<LeaveRequestDetailsPage />} />
</Route>
```

**Existing hr-data.ts navigation (the path to update):**
```ts
{ label: "Attendance", icon: "pending_actions", path: "/attendance" },
// Change to:
{ label: "Attendance", icon: "pending_actions", path: "/hr/attendance" },
```

---

## Task 1: Admin API Layer

**Files:**
- Create: `apps/pwa/src/modules/hr/attendance/hr-attendance-api.ts`

- [ ] **Step 1: Create the file with all types and API functions**

```ts
// apps/pwa/src/modules/hr/attendance/hr-attendance-api.ts
import { httpRequest } from "@/shared/lib/core";
import type { AttendanceDaily, AttendanceEntry } from "./attendance-api";

export type { AttendanceDaily, AttendanceEntry };

export type StaffDailyRow = {
  user_id: string;
  user_name: string;
  email: string;
  work_date: string;
  status: string;
  attendance_mode: string | null;
  first_in_at: string | null;
  last_out_at: string | null;
  worked_minutes: number;
  late_minutes: number;
};

export type AttendanceTodayStats = {
  total_staff: number;
  clocked_in: number;
  late: number;
  absent: number;
};

export type AdminCorrectionRow = {
  id: string;
  user_id: string;
  user_name: string;
  email: string;
  request_type: string;
  status: string;
  work_date: string;
  reason: string;
  proposed_at: string | null;
  proposed_mode: string | null;
  requested_at: string;
  reviewed_at: string | null;
  review_notes: string | null;
};

export type StaffAttendanceDetail = {
  daily: AttendanceDaily[];
  entries: AttendanceEntry[];
};

export type HrAttendanceListResponse = {
  data: StaffDailyRow[];
  total: number;
};

export type HrCorrectionsResponse = {
  data: AdminCorrectionRow[];
};

export async function getHrAttendanceStats(date: string): Promise<AttendanceTodayStats> {
  return httpRequest<AttendanceTodayStats>(`/hr/attendance/stats?date=${date}`);
}

export async function listHrAttendance(params: {
  from: string;
  to: string;
  user_id?: string;
  org_id?: string;
  status?: string;
}): Promise<HrAttendanceListResponse> {
  const query = new URLSearchParams();
  query.set("from", params.from);
  query.set("to", params.to);
  if (params.user_id) query.set("user_id", params.user_id);
  if (params.org_id) query.set("org_id", params.org_id);
  if (params.status) query.set("status", params.status);
  return httpRequest<HrAttendanceListResponse>(`/hr/attendance/staff?${query.toString()}`);
}

export async function getStaffAttendance(
  userId: string,
  params: { from: string; to: string },
): Promise<StaffAttendanceDetail> {
  const query = new URLSearchParams({ from: params.from, to: params.to });
  return httpRequest<StaffAttendanceDetail>(
    `/hr/attendance/staff/${userId}?${query.toString()}`,
  );
}

export async function listHrCorrections(params?: {
  status?: string;
}): Promise<HrCorrectionsResponse> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return httpRequest<HrCorrectionsResponse>(`/hr/attendance/corrections${suffix}`);
}

export async function reviewCorrection(
  id: string,
  payload: { status: "approved" | "rejected"; review_notes?: string },
): Promise<void> {
  return httpRequest<void>(`/hr/attendance/corrections/${id}/review`, {
    method: "PATCH",
    body: payload,
  });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd apps/pwa && npx tsc --noEmit 2>&1 | grep "hr-attendance-api"
```

Expected: no output (no errors in the new file).

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/modules/hr/attendance/hr-attendance-api.ts
git commit -m "feat(hr): add admin attendance API types and functions"
```

---

## Task 2: Staff Attendance Slide-Over

**Files:**
- Create: `apps/pwa/src/modules/hr/attendance/StaffAttendanceSlideOver.tsx`

- [ ] **Step 1: Create the slide-over component**

```tsx
// apps/pwa/src/modules/hr/attendance/StaffAttendanceSlideOver.tsx
import {
  Button,
  Chip,
  SectionCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
} from "@/shared";
import { useCachedQuery } from "@/shared/lib/core";
import {
  getStaffAttendance,
  type AttendanceDaily,
} from "./hr-attendance-api";

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

const statusVariant: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  present: "success",
  late: "warning",
  absent: "danger",
};

type Props = {
  userId: string;
  userName: string;
  from: string;
  to: string;
  onClose: () => void;
};

export default function StaffAttendanceSlideOver({
  userId,
  userName,
  from,
  to,
  onClose,
}: Props) {
  const { data, loading, error } = useCachedQuery(
    `hr:attendance:staff:${userId}:${from}:${to}`,
    () => getStaffAttendance(userId, { from, to }),
    { ttlMs: 1000 * 30, storage: "memory" },
  );

  const daily: AttendanceDaily[] = data?.daily ?? [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40">
      <div className="flex h-full w-full max-w-2xl flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Attendance Detail
            </p>
            <h2 className="text-xl font-semibold text-slate-950">{userName}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {from} → {to}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {loading ? (
            <div className="text-sm text-slate-500">Loading...</div>
          ) : error ? (
            <div className="text-sm text-danger">{error}</div>
          ) : (
            <SectionCard title="Daily Records">
              <Table>
                <TableHead>
                  <TableHeaderRow>
                    <TableHeaderCell>Date</TableHeaderCell>
                    <TableHeaderCell>Clock In</TableHeaderCell>
                    <TableHeaderCell>Clock Out</TableHeaderCell>
                    <TableHeaderCell>Worked</TableHeaderCell>
                    <TableHeaderCell>Late</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                  </TableHeaderRow>
                </TableHead>
                <TableBody>
                  {daily.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.work_date}</TableCell>
                      <TableCell>{formatTime(row.first_in_at)}</TableCell>
                      <TableCell>{formatTime(row.last_out_at)}</TableCell>
                      <TableCell>{formatMins(row.worked_minutes)}</TableCell>
                      <TableCell>
                        {row.late_minutes > 0 ? formatMins(row.late_minutes) : "-"}
                      </TableCell>
                      <TableCell>
                        <Chip variant={statusVariant[row.status] ?? "neutral"}>
                          {row.status}
                        </Chip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!daily.length ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-8 text-center text-slate-500"
                      >
                        No records in this period.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify no TS errors in the new file**

```bash
cd apps/pwa && npx tsc --noEmit 2>&1 | grep "StaffAttendanceSlideOver"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/modules/hr/attendance/StaffAttendanceSlideOver.tsx
git commit -m "feat(hr): add StaffAttendanceSlideOver drill-in panel"
```

---

## Task 3: HR Attendance Admin Page

**Files:**
- Create: `apps/pwa/src/modules/hr/attendance/HrAttendancePage.tsx`

- [ ] **Step 1: Create the page**

```tsx
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
      activeLabel="Attendance"
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
              options={[
                { label: "All statuses", value: "" },
                { label: "Present", value: "present" },
                { label: "Late", value: "late" },
                { label: "Absent", value: "absent" },
              ]}
            />
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
```

- [ ] **Step 2: Verify no TS errors in the new file**

```bash
cd apps/pwa && npx tsc --noEmit 2>&1 | grep "HrAttendancePage"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/modules/hr/attendance/HrAttendancePage.tsx
git commit -m "feat(hr): add HR admin attendance page with stats, table, and correction review"
```

---

## Task 4: Wire Routes and Navigation

**Files:**
- Modify: `apps/pwa/src/modules/hr/hr-data.ts`
- Modify: `apps/pwa/src/App.tsx`

- [ ] **Step 1: Update attendance nav path in `hr-data.ts`**

In `apps/pwa/src/modules/hr/hr-data.ts`, find:
```ts
{ label: "Attendance", icon: "pending_actions", path: "/attendance" },
```

Replace with:
```ts
{ label: "Attendance", icon: "pending_actions", path: "/hr/attendance" },
```

- [ ] **Step 2: Add the new route in `App.tsx`**

In `apps/pwa/src/App.tsx`, add the import at the top with the other HR imports:
```ts
import HrAttendancePage from "@/modules/hr/attendance/HrAttendancePage";
```

Then inside `<Route element={<ModuleRoute moduleKey="hr" />}>`, add after the `/hr/employees/:id` route:
```tsx
<Route path="/hr/attendance" element={<HrAttendancePage />} />
```

The existing `<Route path="/attendance" element={<AttendancePage />} />` inside the HR block stays as-is (staff self-service).

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/modules/hr/hr-data.ts apps/pwa/src/App.tsx
git commit -m "feat(hr): wire /hr/attendance route to HR admin attendance page"
```

---

## Task 5: Build Verification

- [ ] **Step 1: Run the full build**

```bash
npm run build:pwa2
```

Expected: `✓ built in Xs` with no TypeScript errors. If errors appear, fix them before proceeding.

- [ ] **Step 2: Commit fix if needed, then final commit**

If build errors appear, fix the specific file reported, then:
```bash
git add <fixed-file>
git commit -m "fix(hr): resolve TS build errors in attendance admin"
```

- [ ] **Step 3: Push to development**

```bash
git push origin development
```

---

## Codex Prompt

Use the following prompt to dispatch this plan to Codex:

---

**Task: Implement the HR Attendance Admin page for the Stanforte Edge PWA.**

You are working in the monorepo at the root of this project. The PWA app is at `apps/pwa/`. The plan is at `docs/superpowers/plans/2026-04-14-hr-attendance-admin.md`.

**Read the plan fully before starting.** It contains:
- Full codebase context (patterns, component APIs, existing types)
- Exact file paths for every file to create or modify
- Complete, copy-paste-ready code for each file
- Exact build verification commands

**Execute every task in order, top to bottom. Do not skip steps.**

Key rules:
- Do not add features not in the plan
- Do not modify `AttendancePage.tsx` — that is the staff self-service page and must stay untouched
- After completing all tasks, run `npm run build:pwa2` and fix any TypeScript errors before pushing
- Commit after each task as specified in the plan
- Push to the `development` branch when done

Start with Task 1.
