# HR Leave Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the self-service leave page at `/hr/leave` with an HR admin view showing a pending-approvals queue with inline approve/reject, a full filterable staff leave history table, and a "currently on leave" summary panel.

**Architecture:** Three new files — `hr-leave-api.ts` (admin API layer), `StaffLeaveSlideOver.tsx` (per-staff detail panel), and `HrLeavePage.tsx` (main page) — plus route and navigation wiring in `App.tsx` and `hr-data.ts`. The existing `LeavePage.tsx` (staff self-service at `/leave`) is left untouched.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, React Router v6, `useCachedQuery` (returns `{ data, loading, error }` — no refetch), shared UI from `@/shared`, existing `approveRequest`/`rejectRequest` from `@/features/requests/requests-api`.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `apps/pwa/src/modules/hr/leave/hr-leave-api.ts` | Admin API types + functions |
| Create | `apps/pwa/src/modules/hr/leave/StaffLeaveSlideOver.tsx` | Per-staff leave detail + balance slide-over |
| Create | `apps/pwa/src/modules/hr/leave/HrLeavePage.tsx` | Main HR admin leave page |
| Modify | `apps/pwa/src/modules/hr/hr-data.ts` | Update Leave nav path to `/hr/leave` |
| Modify | `apps/pwa/src/App.tsx` | Add `/hr/leave` route inside HR module guard |

---

## Codebase Context (read before starting)

**Pattern — HR admin page shell (from `HrDashboardPage.tsx`):**
```tsx
import { AppShell } from "@/shared/components/layout/AppShell";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import { useCachedQuery } from "@/shared/lib/core";
import { useAuth } from "@/shared/context/AuthProvider";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";

<AppShell
  navigation={buildAppNavigation()}
  activeLabel="Leave"
  user={{ name: userName, role: profile?.employee_profile?.job_title || "HR Staff" }}
  mobileNav={buildAppMobileNav("HR")}
>
  <PageHeader breadcrumbs={[{ label: "HR", path: "/hr" }, { label: "Leave" }]} title="..." description="..." />
</AppShell>
```

**`useCachedQuery` — NO refetch property:**
```ts
const { data, loading, error } = useCachedQuery("key", () => fn(), { ttlMs: 1000 * 30, storage: "memory" });
```

**Shared components from `@/shared`:**
`AppShell`, `Button`, `Chip`, `EmptyState`, `PageHeader`, `SectionCard`, `SelectField`, `StatCard`, `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeaderCell`, `TableHeaderRow`, `TableRow`, `TextField`, `useToast`

- `SectionCard` — required `title` prop. Optional: `description`, `action`.
- `EmptyState` — accepts only `title`, `description`, `actionLabel`. No `icon` or `action` prop.
- `Button` — variants: `primary` | `secondary` | `ghost` | `danger`.
- `useToast` — `const { showToast } = useToast()`. Call: `showToast({ tone: "success"|"danger"|"warning", title, message })`.
- `Chip` — variants: `success` | `warning` | `danger` | `neutral` | `pending`.
- `StatCard` — props: `label`, `value` (string), `tone`, optional `icon` (Material icon name), optional `hint`.
- `SelectField` — Use `<option>` children, NOT an `options` prop:
  ```tsx
  <SelectField label="Status" value={val} onChange={(e) => setVal(e.target.value)}>
    <option value="">All</option>
    <option value="pending">Pending</option>
  </SelectField>
  ```
- `TableHeaderCell` — must have children: `<TableHeaderCell>{""}</TableHeaderCell>` for empty cells.

**Existing request API functions (from `apps/pwa/src/features/requests/requests-api.ts`):**
```ts
// Types
type RequestRecord = {
  id: string;
  status: string;
  request_number?: string;
  created_at?: string;
  data?: Record<string, unknown> | null;
  request_type?: { id: string; name: string; category_key?: string | null } | null;
  creator?: { id: string; email?: string; first_name?: string | null; last_name?: string | null } | null;
  approvals?: { done: Array<{ action: string; step: string; comment: string | null; at: string }>; pending: Array<...> };
};

// Functions (already exist — import directly, do NOT redefine)
listRequests(params?: Record<string, unknown>): Promise<RequestRecord[]>
listApprovals(params?: Record<string, unknown>): Promise<RequestRecord[]>
approveRequest(id: string, comment?: string): Promise<RequestRecord>
rejectRequest(id: string, comment?: string): Promise<RequestRecord>
```

**Extracting leave data from RequestRecord.data:**
```ts
const data = record.data ?? {};
const startDate = String(data.start_date ?? "");
const endDate = String(data.end_date ?? "");
const daysRequested = Number(data.days_requested ?? 0);
const leaveType = String(data.leave_type_name ?? data.leave_type_key ?? "Leave");
```

**Existing `requestStatusTone` helper (from `apps/pwa/src/features/requests/request-helpers.ts`):**
```ts
import { requestStatusTone } from "@/features/requests/request-helpers";
// Returns: "success" | "warning" | "pending" | "danger" | "neutral"
requestStatusTone(record.status) // maps status strings to Chip tone
```

**Existing App.tsx HR block (lines 103–111):**
```tsx
<Route element={<ModuleRoute moduleKey="hr" />}>
  <Route path="/hr" element={<HrDashboardPage />} />
  <Route path="/hr/employees" element={<HrEmployeesPage />} />
  <Route path="/hr/employees/new" element={<HrEmployeeCreatePage />} />
  <Route path="/hr/employees/:id" element={<HrEmployeeDetailPage />} />
  <Route path="/hr/attendance" element={<HrAttendancePage />} />   {/* already added */}
  <Route path="/attendance" element={<AttendancePage />} />         {/* staff self-service — keep */}
  <Route path="/leave" element={<LeavePage />} />                   {/* staff self-service — keep */}
  <Route path="/leave/new/form" element={<LeaveRequestFormPage />} />
  <Route path="/leave/details" element={<LeaveRequestDetailsPage />} />
</Route>
```

**hr-data.ts Leave nav entry to update:**
```ts
// Current:
{ label: "Leave", icon: "event_available", path: "/leave" },
// Change to:
{ label: "Leave", icon: "event_available", path: "/hr/leave" },
```

---

## Task 1: Admin Leave API Layer

**Files:**
- Create: `apps/pwa/src/modules/hr/leave/hr-leave-api.ts`

- [ ] **Step 1: Create the file**

```ts
// apps/pwa/src/modules/hr/leave/hr-leave-api.ts
import { httpRequest } from "@/shared/lib/core";
import {
  listRequests,
  listApprovals,
  approveRequest,
  rejectRequest,
  type RequestRecord,
} from "@/features/requests/requests-api";

export type { RequestRecord };

export type HrLeaveBalance = {
  user_id: string;
  user_name: string;
  email: string;
  year: number;
  balances: Array<{
    leave_type_key: string;
    leave_type_name: string;
    entitled_days: number;
    used_days: number;
    available_days: number;
  }>;
};

export type HrLeaveBalancesResponse = {
  data: HrLeaveBalance[];
};

// All staff leave requests (admin view — no only_mine filter)
export async function listHrLeaveRequests(params?: {
  status?: string;
  user_id?: string;
  from?: string;
  to?: string;
}): Promise<RequestRecord[]> {
  const query: Record<string, unknown> = { family: "leave" };
  if (params?.status) query.status = params.status;
  if (params?.user_id) query.user_id = params.user_id;
  if (params?.from) query.from = params.from;
  if (params?.to) query.to = params.to;
  return listRequests(query);
}

// Leave requests pending HR approval
export async function listHrLeaveApprovals(): Promise<RequestRecord[]> {
  return listApprovals({ family: "leave" });
}

// Per-staff leave balances — HR-specific endpoint
export async function getHrLeaveBalances(params?: {
  year?: number;
}): Promise<HrLeaveBalancesResponse> {
  const query = new URLSearchParams();
  if (params?.year) query.set("year", String(params.year));
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return httpRequest<HrLeaveBalancesResponse>(`/hr/leave/balances${suffix}`);
}

// Re-export for use in the page without additional imports
export { approveRequest, rejectRequest };
```

- [ ] **Step 2: Verify TS compiles cleanly**

```bash
cd apps/pwa && npx tsc --noEmit 2>&1 | grep "hr-leave-api"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/modules/hr/leave/hr-leave-api.ts
git commit -m "feat(hr): add admin leave API layer"
```

---

## Task 2: Staff Leave Slide-Over

**Files:**
- Create: `apps/pwa/src/modules/hr/leave/StaffLeaveSlideOver.tsx`

- [ ] **Step 1: Create the component**

```tsx
// apps/pwa/src/modules/hr/leave/StaffLeaveSlideOver.tsx
import { Button, Chip, SectionCard, StatCard, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableHeaderRow, TableRow } from "@/shared";
import { useCachedQuery } from "@/shared/lib/core";
import { requestStatusTone } from "@/features/requests/request-helpers";
import { listHrLeaveRequests, getHrLeaveBalances, type RequestRecord } from "./hr-leave-api";

function formatDate(value?: string) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function creatorName(record: RequestRecord) {
  if (!record.creator) return "-";
  return `${record.creator.first_name ?? ""} ${record.creator.last_name ?? ""}`.trim() || record.creator.email || "-";
}

type Props = {
  userId: string;
  userName: string;
  year: number;
  onClose: () => void;
};

export default function StaffLeaveSlideOver({ userId, userName, year, onClose }: Props) {
  const { data: requestsData, loading: reqLoading } = useCachedQuery(
    `hr:leave:staff:${userId}:${year}`,
    () => listHrLeaveRequests({ user_id: userId }),
    { ttlMs: 1000 * 30, storage: "memory" },
  );

  const { data: balancesData, loading: balLoading } = useCachedQuery(
    `hr:leave:balances:${userId}:${year}`,
    () => getHrLeaveBalances({ year }),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const requests: RequestRecord[] = requestsData ?? [];
  const staffBalance = balancesData?.data.find((b) => b.user_id === userId);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40">
      <div className="flex h-full w-full max-w-2xl flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Leave Detail
            </p>
            <h2 className="text-xl font-semibold text-slate-950">{userName}</h2>
            <p className="mt-1 text-sm text-slate-500">{year} leave year</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {/* Balance summary */}
          {!balLoading && staffBalance ? (
            <SectionCard title="Leave Balances">
              <div className="grid gap-3 md:grid-cols-3">
                {staffBalance.balances.map((b) => (
                  <StatCard
                    key={b.leave_type_key}
                    label={b.leave_type_name}
                    value={`${b.available_days}d`}
                    tone={b.available_days <= 2 ? "danger" : "success"}
                    hint={`${b.used_days}d used of ${b.entitled_days}d`}
                  />
                ))}
              </div>
              {!staffBalance.balances.length ? (
                <p className="text-sm text-slate-500">No balance data available.</p>
              ) : null}
            </SectionCard>
          ) : balLoading ? (
            <div className="text-sm text-slate-500">Loading balances...</div>
          ) : null}

          {/* Leave history */}
          <SectionCard title="Leave Requests">
            {reqLoading ? (
              <div className="text-sm text-slate-500">Loading requests...</div>
            ) : (
              <Table>
                <TableHead>
                  <TableHeaderRow>
                    <TableHeaderCell>Type</TableHeaderCell>
                    <TableHeaderCell>Dates</TableHeaderCell>
                    <TableHeaderCell>Days</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                  </TableHeaderRow>
                </TableHead>
                <TableBody>
                  {requests.map((r) => {
                    const d = r.data ?? {};
                    const start = formatDate(String(d.start_date ?? ""));
                    const end = formatDate(String(d.end_date ?? ""));
                    const days = Number(d.days_requested ?? 0);
                    return (
                      <TableRow key={r.id}>
                        <TableCell>{r.request_type?.name ?? "Leave"}</TableCell>
                        <TableCell>
                          {start} – {end}
                        </TableCell>
                        <TableCell>{days > 0 ? `${days}d` : "-"}</TableCell>
                        <TableCell>
                          <Chip variant={requestStatusTone(r.status)}>{r.status}</Chip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!requests.length ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-slate-500">
                        No leave requests found.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TS**

```bash
cd apps/pwa && npx tsc --noEmit 2>&1 | grep "StaffLeaveSlideOver"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/modules/hr/leave/StaffLeaveSlideOver.tsx
git commit -m "feat(hr): add StaffLeaveSlideOver per-staff detail panel"
```

---

## Task 3: HR Leave Admin Page

**Files:**
- Create: `apps/pwa/src/modules/hr/leave/HrLeavePage.tsx`

- [ ] **Step 1: Create the page**

```tsx
// apps/pwa/src/modules/hr/leave/HrLeavePage.tsx
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
import { requestStatusTone } from "@/features/requests/request-helpers";
import {
  listHrLeaveRequests,
  listHrLeaveApprovals,
  approveRequest,
  rejectRequest,
  type RequestRecord,
} from "./hr-leave-api";
import StaffLeaveSlideOver from "./StaffLeaveSlideOver";

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function creatorName(record: RequestRecord) {
  if (!record.creator) return "-";
  return (
    `${record.creator.first_name ?? ""} ${record.creator.last_name ?? ""}`.trim() ||
    record.creator.email ||
    "-"
  );
}

function isCurrentlyOnLeave(record: RequestRecord): boolean {
  const d = record.data ?? {};
  const start = String(d.start_date ?? "");
  const end = String(d.end_date ?? "");
  if (!start || !end) return false;
  const now = new Date();
  const startD = new Date(start);
  const endD = new Date(end);
  return (
    record.status === "approved" &&
    now >= startD &&
    now <= endD
  );
}

export default function HrLeavePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const currentYear = new Date().getFullYear();

  const { data: profile } = useCachedQuery(
    "hr:profile",
    () => getWorkspaceProfile(),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const [statusFilter, setStatusFilter] = useState("");
  const [slideOver, setSlideOver] = useState<{
    userId: string;
    userName: string;
  } | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  const { data: approvals, loading: appLoading } = useCachedQuery(
    "hr:leave:approvals",
    () => listHrLeaveApprovals(),
    { ttlMs: 1000 * 30, storage: "memory" },
  );

  const { data: allLeave, loading: allLoading } = useCachedQuery(
    `hr:leave:all:${statusFilter}`,
    () => listHrLeaveRequests({ status: statusFilter || undefined }),
    { ttlMs: 1000 * 30, storage: "memory" },
  );

  const pendingApprovals: RequestRecord[] = approvals ?? [];
  const allLeaveRequests: RequestRecord[] = allLeave ?? [];

  const currentlyOnLeave = allLeaveRequests.filter(isCurrentlyOnLeave);

  const userName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.email ||
    "HR Staff";

  async function handleApprove(id: string) {
    try {
      setReviewLoading(true);
      await approveRequest(id, reviewComment || undefined);
      showToast({ tone: "success", title: "Leave approved", message: "Request has been approved." });
      setReviewingId(null);
      setReviewComment("");
    } catch (err) {
      showToast({
        tone: "danger",
        title: "Approval failed",
        message: err instanceof Error ? err.message : "Unable to approve.",
      });
    } finally {
      setReviewLoading(false);
    }
  }

  async function handleReject(id: string) {
    try {
      setReviewLoading(true);
      await rejectRequest(id, reviewComment || undefined);
      showToast({ tone: "success", title: "Leave rejected", message: "Request has been rejected." });
      setReviewingId(null);
      setReviewComment("");
    } catch (err) {
      showToast({
        tone: "danger",
        title: "Rejection failed",
        message: err instanceof Error ? err.message : "Unable to reject.",
      });
    } finally {
      setReviewLoading(false);
    }
  }

  return (
    <AppShell
      navigation={buildAppNavigation()}
      activeLabel="Leave"
      user={{
        name: userName,
        role: profile?.employee_profile?.job_title || "HR Staff",
      }}
      mobileNav={buildAppMobileNav("HR")}
    >
      <PageHeader
        breadcrumbs={[{ label: "HR", path: "/hr" }, { label: "Leave" }]}
        title="Leave"
        description="Review pending leave requests, track staff leave history, and see who is currently on leave."
      />

      <div className="grid gap-6">
        {/* Summary stat cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Pending Approval"
            value={String(pendingApprovals.length)}
            tone="warning"
            icon="pending_actions"
          />
          <StatCard
            label="Currently on Leave"
            value={String(currentlyOnLeave.length)}
            tone="neutral"
            icon="beach_access"
          />
          <StatCard
            label="Total Leave Requests"
            value={String(allLeaveRequests.length)}
            tone="neutral"
            icon="event_available"
          />
        </div>

        {/* Currently on leave */}
        {currentlyOnLeave.length > 0 ? (
          <SectionCard
            title="Currently on Leave"
            description="Staff with approved leave that overlaps with today."
          >
            <div className="flex flex-wrap gap-3">
              {currentlyOnLeave.map((r) => {
                const d = r.data ?? {};
                const end = formatDate(String(d.end_date ?? ""));
                const name = creatorName(r);
                return (
                  <div
                    key={r.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-slate-900">{name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {r.request_type?.name ?? "Leave"} · returns {end}
                    </p>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        ) : null}

        {/* Pending approvals queue */}
        <SectionCard
          title="Pending Approvals"
          description="Leave requests awaiting your approval."
        >
          {appLoading ? (
            <div className="text-sm text-slate-500">Loading approvals...</div>
          ) : pendingApprovals.length ? (
            <Table>
              <TableHead>
                <TableHeaderRow>
                  <TableHeaderCell>Staff</TableHeaderCell>
                  <TableHeaderCell>Type</TableHeaderCell>
                  <TableHeaderCell>Dates</TableHeaderCell>
                  <TableHeaderCell>Days</TableHeaderCell>
                  <TableHeaderCell>Submitted</TableHeaderCell>
                  <TableHeaderCell>{""}</TableHeaderCell>
                </TableHeaderRow>
              </TableHead>
              <TableBody>
                {pendingApprovals.flatMap((r) => {
                  const d = r.data ?? {};
                  const start = formatDate(String(d.start_date ?? ""));
                  const end = formatDate(String(d.end_date ?? ""));
                  const days = Number(d.days_requested ?? 0);
                  const name = creatorName(r);

                  const mainRow = (
                    <TableRow key={r.id}>
                      <TableCell>
                        <p className="font-semibold text-slate-900">{name}</p>
                        <p className="text-xs text-slate-500">
                          {r.creator?.email ?? ""}
                        </p>
                      </TableCell>
                      <TableCell>{r.request_type?.name ?? "Leave"}</TableCell>
                      <TableCell>
                        {start} – {end}
                      </TableCell>
                      <TableCell>{days > 0 ? `${days}d` : "-"}</TableCell>
                      <TableCell>{formatDate(r.created_at)}</TableCell>
                      <TableCell>
                        {reviewingId !== r.id ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setReviewingId(r.id)}
                          >
                            Review
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );

                  if (reviewingId !== r.id) return [mainRow];

                  const reviewRow = (
                    <TableRow key={`${r.id}-review`}>
                      <TableCell colSpan={6} className="bg-slate-50 px-4 py-3">
                        <div className="flex flex-wrap items-end gap-3">
                          <div className="flex-1">
                            <TextField
                              label="Comment (optional)"
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                            />
                          </div>
                          <Button
                            size="sm"
                            onClick={() => void handleApprove(r.id)}
                            disabled={reviewLoading}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => void handleReject(r.id)}
                            disabled={reviewLoading}
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setReviewingId(null);
                              setReviewComment("");
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
              title="No pending approvals"
              description="All leave requests are up to date."
            />
          )}
        </SectionCard>

        {/* Full leave history */}
        <SectionCard
          title="Leave History"
          description="All staff leave requests across the organisation."
        >
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <SelectField
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="draft">Draft</option>
            </SelectField>
          </div>

          {allLoading ? (
            <div className="text-sm text-slate-500">Loading leave history...</div>
          ) : (
            <Table>
              <TableHead>
                <TableHeaderRow>
                  <TableHeaderCell>Staff</TableHeaderCell>
                  <TableHeaderCell>Type</TableHeaderCell>
                  <TableHeaderCell>From</TableHeaderCell>
                  <TableHeaderCell>To</TableHeaderCell>
                  <TableHeaderCell>Days</TableHeaderCell>
                  <TableHeaderCell>Submitted</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>{""}</TableHeaderCell>
                </TableHeaderRow>
              </TableHead>
              <TableBody>
                {allLeaveRequests.map((r) => {
                  const d = r.data ?? {};
                  const days = Number(d.days_requested ?? 0);
                  const name = creatorName(r);
                  const userId = r.creator?.id ?? "";
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <p className="font-semibold text-slate-900">{name}</p>
                        <p className="text-xs text-slate-500">
                          {r.creator?.email ?? ""}
                        </p>
                      </TableCell>
                      <TableCell>{r.request_type?.name ?? "Leave"}</TableCell>
                      <TableCell>{formatDate(String(d.start_date ?? ""))}</TableCell>
                      <TableCell>{formatDate(String(d.end_date ?? ""))}</TableCell>
                      <TableCell>{days > 0 ? `${days}d` : "-"}</TableCell>
                      <TableCell>{formatDate(r.created_at)}</TableCell>
                      <TableCell>
                        <Chip variant={requestStatusTone(r.status)}>
                          {r.status}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        {userId ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setSlideOver({ userId, userName: name })
                            }
                          >
                            Detail
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!allLeaveRequests.length ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-10 text-center text-slate-500"
                    >
                      No leave requests found.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          )}
        </SectionCard>
      </div>

      {slideOver ? (
        <StaffLeaveSlideOver
          userId={slideOver.userId}
          userName={slideOver.userName}
          year={currentYear}
          onClose={() => setSlideOver(null)}
        />
      ) : null}
    </AppShell>
  );
}
```

- [ ] **Step 2: Verify TS**

```bash
cd apps/pwa && npx tsc --noEmit 2>&1 | grep "HrLeavePage"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/modules/hr/leave/HrLeavePage.tsx
git commit -m "feat(hr): add HR admin leave page with approvals queue and history"
```

---

## Task 4: Wire Routes and Navigation

**Files:**
- Modify: `apps/pwa/src/modules/hr/hr-data.ts`
- Modify: `apps/pwa/src/App.tsx`

- [ ] **Step 1: Update leave nav path in `hr-data.ts`**

In `apps/pwa/src/modules/hr/hr-data.ts`, find:
```ts
{ label: "Leave", icon: "event_available", path: "/leave" },
```
Replace with:
```ts
{ label: "Leave", icon: "event_available", path: "/hr/leave" },
```

- [ ] **Step 2: Add route in `App.tsx`**

Add import at the top with other HR imports:
```ts
import HrLeavePage from "@/modules/hr/leave/HrLeavePage";
```

Inside `<Route element={<ModuleRoute moduleKey="hr" />}>`, add after the `/hr/attendance` route:
```tsx
<Route path="/hr/leave" element={<HrLeavePage />} />
```

The existing `<Route path="/leave" element={<LeavePage />} />` stays untouched.

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/modules/hr/hr-data.ts apps/pwa/src/App.tsx
git commit -m "feat(hr): wire /hr/leave route to HR admin leave page"
```

---

## Task 5: Build Verification

- [ ] **Step 1: Run the full build**

```bash
npm run build:pwa2
```

Expected: `✓ built in Xs` with no TypeScript errors. If errors appear, fix the specific file reported.

- [ ] **Step 2: Push**

```bash
git push origin development
```

---

## Codex Prompt

Use the following prompt to dispatch this plan to Codex:

---

**Task: Implement the HR Leave Admin page for the Stanforte Edge PWA.**

You are working in the monorepo root. The PWA is at `apps/pwa/`. The plan is at `docs/superpowers/plans/2026-04-14-hr-leave-admin.md`.

**Read the plan fully before starting.** It contains:
- Full codebase context (component APIs, existing types, import paths)
- Exact file paths for every file to create or modify
- Complete, copy-paste-ready code for each file
- Exact build/verify commands

**Execute every task in order. Do not skip steps.**

Key rules:
- `SelectField` uses `<option>` children — NOT an `options` prop. This was a known issue in the previous task; follow the pattern in the plan exactly.
- Do NOT modify `LeavePage.tsx` — staff self-service page, keep as-is at `/leave`.
- `approveRequest(id, comment?)` and `rejectRequest(id, comment?)` already exist in `@/features/requests/requests-api` — import and re-export them from `hr-leave-api.ts`, do not redefine them.
- After all tasks, run `npm run build:pwa2` and fix any TypeScript errors before pushing.
- Commit after each task as specified in the plan.
- Push to the `development` branch when done.

Start with Task 1.
