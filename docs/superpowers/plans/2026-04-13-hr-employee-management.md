# HR Employee Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the HR admin module — dashboard, employee directory, create wizard, and tabbed employee editor — wired to the existing backend API.

**Architecture:** All new pages live under `apps/pwa/src/modules/hr/`, reorganised into `attendance/`, `leave/`, and `employees/` sub-folders. A new `hr-api.ts` at the module root owns all typed API calls. Pages follow the same `AppShell` + `useCachedQuery` pattern used by Finance and Requests.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, React Router v6, `httpRequest` / `useCachedQuery` from `@/shared/lib/core`, shared UI from `@/shared`.

---

## File Map

| Action | Path |
|--------|------|
| Move | `modules/hr/AttendancePage.tsx` → `modules/hr/attendance/AttendancePage.tsx` |
| Move | `modules/hr/attendance-api.ts` → `modules/hr/attendance/attendance-api.ts` |
| Move | `modules/hr/attendance-data.ts` → `modules/hr/attendance/attendance-data.ts` |
| Move | `modules/hr/LeavePage.tsx` → `modules/hr/leave/LeavePage.tsx` |
| Move | `modules/hr/LeaveRequestFormPage.tsx` → `modules/hr/leave/LeaveRequestFormPage.tsx` |
| Move | `modules/hr/LeaveRequestDetailsPage.tsx` → `modules/hr/leave/LeaveRequestDetailsPage.tsx` |
| Create | `modules/hr/hr-api.ts` |
| Create | `modules/hr/hr-data.ts` |
| Create | `modules/hr/HrDashboardPage.tsx` |
| Create | `modules/hr/employees/HrEmployeesPage.tsx` |
| Create | `modules/hr/employees/HrEmployeeCreatePage.tsx` |
| Create | `modules/hr/employees/tabs/EmployeeProfileTab.tsx` |
| Create | `modules/hr/employees/tabs/EmployeeJobTab.tsx` |
| Create | `modules/hr/employees/tabs/EmployeeOrgsTeamsTab.tsx` |
| Create | `modules/hr/employees/tabs/EmployeeActionsTab.tsx` |
| Create | `modules/hr/employees/HrEmployeeDetailPage.tsx` |
| Modify | `apps/pwa/src/App.tsx` |

---

## Task 1: Reorganise HR sub-folders

**Files:**
- Move: `apps/pwa/src/modules/hr/AttendancePage.tsx` → `apps/pwa/src/modules/hr/attendance/AttendancePage.tsx`
- Move: `apps/pwa/src/modules/hr/attendance-api.ts` → `apps/pwa/src/modules/hr/attendance/attendance-api.ts`
- Move: `apps/pwa/src/modules/hr/attendance-data.ts` → `apps/pwa/src/modules/hr/attendance/attendance-data.ts`
- Move: `apps/pwa/src/modules/hr/LeavePage.tsx` → `apps/pwa/src/modules/hr/leave/LeavePage.tsx`
- Move: `apps/pwa/src/modules/hr/LeaveRequestFormPage.tsx` → `apps/pwa/src/modules/hr/leave/LeaveRequestFormPage.tsx`
- Move: `apps/pwa/src/modules/hr/LeaveRequestDetailsPage.tsx` → `apps/pwa/src/modules/hr/leave/LeaveRequestDetailsPage.tsx`
- Modify: `apps/pwa/src/App.tsx`

- [ ] **Step 1: Create sub-folders and move files**

```bash
cd apps/pwa/src/modules/hr
mkdir -p attendance leave
mv AttendancePage.tsx attendance/
mv attendance-api.ts attendance/
mv attendance-data.ts attendance/
mv LeavePage.tsx leave/
mv LeaveRequestFormPage.tsx leave/
mv LeaveRequestDetailsPage.tsx leave/
```

- [ ] **Step 2: Fix relative imports inside moved attendance files**

`attendance/AttendancePage.tsx` — change any `../` imports that pointed to files now at the same level. Open the file and check for imports referencing `./attendance-api` or `./attendance-data` — these are now correct as-is since the files moved together. Check for any `@/modules/hr/attendance-api` style imports and leave them (they use aliases). No change needed if all imports use `@/` aliases.

Run: `grep -n "from '\.\." apps/pwa/src/modules/hr/attendance/AttendancePage.tsx`  
Expected: no relative imports that cross folder boundaries, or fix any that do.

- [ ] **Step 3: Fix relative imports inside moved leave files**

Same check for each leave file:
```bash
grep -n "from '\.\." apps/pwa/src/modules/hr/leave/LeavePage.tsx
grep -n "from '\.\." apps/pwa/src/modules/hr/leave/LeaveRequestFormPage.tsx
grep -n "from '\.\." apps/pwa/src/modules/hr/leave/LeaveRequestDetailsPage.tsx
```
Fix any `../` imports that now resolve incorrectly. Imports using `@/` aliases need no change.

- [ ] **Step 4: Update App.tsx imports for moved files**

In `apps/pwa/src/App.tsx`, update these four import lines:

```ts
// Before:
import AttendancePage from "@/modules/hr/AttendancePage";
import LeavePage from "@/modules/hr/LeavePage";
import LeaveRequestFormPage from "@/modules/hr/LeaveRequestFormPage";
import LeaveRequestDetailsPage from "@/modules/hr/LeaveRequestDetailsPage";

// After:
import AttendancePage from "@/modules/hr/attendance/AttendancePage";
import LeavePage from "@/modules/hr/leave/LeavePage";
import LeaveRequestFormPage from "@/modules/hr/leave/LeaveRequestFormPage";
import LeaveRequestDetailsPage from "@/modules/hr/leave/LeaveRequestDetailsPage";
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal/apps/pwa
npx tsc --noEmit
```
Expected: 0 errors. Fix any path-resolution errors before continuing.

- [ ] **Step 6: Commit**

```bash
git add apps/pwa/src/modules/hr apps/pwa/src/App.tsx
git commit -m "refactor(hr): reorganise module into attendance/ leave/ sub-folders"
```

---

## Task 2: Create `hr-api.ts` and `hr-data.ts`

**Files:**
- Create: `apps/pwa/src/modules/hr/hr-api.ts`
- Create: `apps/pwa/src/modules/hr/hr-data.ts`

- [ ] **Step 1: Create `hr-api.ts`**

```ts
// apps/pwa/src/modules/hr/hr-api.ts
import { httpRequest } from "@/shared/lib/core";

export type EmploymentType = "full_time" | "contract" | "intern" | "consultant";
export type EmploymentStatus = "draft" | "active" | "suspended" | "exited";
export type WorkMode = "onsite" | "hybrid" | "remote";
export type EmployeeAction = "activate" | "suspend" | "exit";

export type EmployeeSummary = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  employee_code?: string | null;
  job_title?: string | null;
  employment_type?: EmploymentType | null;
  employment_status?: EmploymentStatus | null;
  work_mode?: WorkMode | null;
  hire_date?: string | null;
  primary_organization?: { id: string; name: string } | null;
  primary_team?: { id: string; name: string } | null;
};

export type EmployeeDetail = EmployeeSummary & {
  phone?: string | null;
  username?: string | null;
  job_description?: string | null;
  manager?: { id: string; first_name: string; last_name: string } | null;
  manager_user_id?: string | null;
  confirmation_date?: string | null;
  exit_date?: string | null;
  organizations: Array<{ id: string; name: string; is_primary: boolean }>;
  teams: Array<{ id: string; name: string; is_primary: boolean }>;
  roles: string[];
  metadata?: Record<string, unknown> | null;
};

export type HrSummary = {
  total: number;
  active: number;
  draft: number;
  suspended: number;
  exited: number;
  by_employment_type: Partial<Record<EmploymentType, number>>;
  recent_hires: EmployeeSummary[];
};

export type EmployeeListResponse = {
  data: EmployeeSummary[];
  meta: { page: number; per_page: number; total: number; last_page: number };
};

function buildQuery(params: Record<string, unknown>): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function getHrSummary(): Promise<HrSummary> {
  return httpRequest<HrSummary>("/hr/summary");
}

export async function listEmployees(
  params: Record<string, unknown> = {},
): Promise<EmployeeListResponse> {
  const payload = await httpRequest<EmployeeListResponse | EmployeeSummary[]>(
    `/hr/employees${buildQuery(params)}`,
  );
  if (Array.isArray(payload)) {
    return {
      data: payload,
      meta: { page: 1, per_page: payload.length, total: payload.length, last_page: 1 },
    };
  }
  return payload as EmployeeListResponse;
}

export async function getEmployee(id: string): Promise<EmployeeDetail> {
  return httpRequest<EmployeeDetail>(`/hr/employees/${id}`);
}

export async function createEmployee(
  dto: Record<string, unknown>,
): Promise<EmployeeDetail> {
  return httpRequest<EmployeeDetail>("/hr/employees", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export async function updateEmployee(
  id: string,
  dto: Record<string, unknown>,
): Promise<EmployeeDetail> {
  return httpRequest<EmployeeDetail>(`/hr/employees/${id}`, {
    method: "PATCH",
    body: JSON.stringify(dto),
  });
}

export async function runEmployeeAction(
  id: string,
  dto: { action: EmployeeAction; effective_date?: string; notes?: string },
): Promise<EmployeeDetail> {
  return httpRequest<EmployeeDetail>(`/hr/employees/${id}/action`, {
    method: "PATCH",
    body: JSON.stringify(dto),
  });
}

export async function addEmployeeOrganization(
  id: string,
  dto: { organization_id: string },
): Promise<void> {
  await httpRequest(`/hr/employees/${id}/organizations`, {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export async function removeEmployeeOrganization(
  id: string,
  organizationId: string,
): Promise<void> {
  await httpRequest(`/hr/employees/${id}/organizations/${organizationId}`, {
    method: "DELETE",
  });
}

export async function addEmployeeTeam(
  id: string,
  dto: { team_id: string },
): Promise<void> {
  await httpRequest(`/hr/employees/${id}/teams`, {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export async function removeEmployeeTeam(
  id: string,
  teamId: string,
): Promise<void> {
  await httpRequest(`/hr/employees/${id}/teams/${teamId}`, {
    method: "DELETE",
  });
}

export async function setPrimaryOrganization(
  id: string,
  organizationId: string,
): Promise<void> {
  await httpRequest(`/hr/employees/${id}/primary-organization`, {
    method: "POST",
    body: JSON.stringify({ organization_id: organizationId }),
  });
}
```

- [ ] **Step 2: Create `hr-data.ts`**

```ts
// apps/pwa/src/modules/hr/hr-data.ts
import type { SidebarItem } from "@/shared";

export const hrNavigation: SidebarItem[] = [
  { label: "Overview", icon: "dashboard", path: "/hr" },
  { label: "Employees", icon: "group", path: "/hr/employees" },
  { label: "Attendance", icon: "pending_actions", path: "/attendance" },
  { label: "Leave", icon: "event_available", path: "/leave" },
];

export const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  full_time: "Full-time",
  contract: "Contract",
  intern: "Intern",
  consultant: "Consultant",
};

export const EMPLOYMENT_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  active: "Active",
  suspended: "Suspended",
  exited: "Exited",
};

export const WORK_MODE_LABELS: Record<string, string> = {
  onsite: "On-site",
  hybrid: "Hybrid",
  remote: "Remote",
};

export type StatusTone = "success" | "warning" | "danger" | "neutral";

export function statusTone(status?: string | null): StatusTone {
  switch (status) {
    case "active": return "success";
    case "draft": return "warning";
    case "suspended": return "danger";
    case "exited": return "neutral";
    default: return "neutral";
  }
}

export function formatEmployeeName(e: { first_name: string; last_name: string }) {
  return `${e.first_name} ${e.last_name}`.trim();
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal/apps/pwa && npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add apps/pwa/src/modules/hr/hr-api.ts apps/pwa/src/modules/hr/hr-data.ts
git commit -m "feat(hr): add hr-api and hr-data helpers"
```

---

## Task 3: HrDashboardPage

**Files:**
- Create: `apps/pwa/src/modules/hr/HrDashboardPage.tsx`

- [ ] **Step 1: Create the file**

```tsx
// apps/pwa/src/modules/hr/HrDashboardPage.tsx
import { Link } from "react-router-dom";
import {
  AppShell,
  Button,
  EmptyState,
  Icon,
  PageHeader,
  SectionCard,
  StatCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
  Chip,
} from "@/shared";
import { useAuth } from "@/shared/context/AuthProvider";
import { useCachedQuery } from "@/shared/lib/core";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import {
  getHrSummary,
  type EmployeeSummary,
} from "./hr-api";
import {
  hrNavigation,
  EMPLOYMENT_TYPE_LABELS,
  EMPLOYMENT_STATUS_LABELS,
  statusTone,
  formatEmployeeName,
} from "./hr-data";

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function HrDashboardPage() {
  const { user } = useAuth();
  const { data: profile } = useCachedQuery(
    "hr:shell:profile",
    () => getWorkspaceProfile(),
    { ttlMs: 60_000, storage: "memory" },
  );
  const { data: summary, loading, error } = useCachedQuery(
    "hr:summary",
    () => getHrSummary(),
    { ttlMs: 30_000, storage: "memory" },
  );

  const recentHires: EmployeeSummary[] = summary?.recent_hires ?? [];

  return (
    <AppShell
      navigation={hrNavigation}
      activeLabel="Overview"
      user={{
        name: profile?.name ?? user?.name ?? "—",
        role: profile?.primary_role ?? "HR",
      }}
    >
      <PageHeader
        title="HR Overview"
        description="Headcount summary and recent activity."
        actions={
          <Button asChild>
            <Link to="/hr/employees/new">
              <Icon name="person_add" className="mr-2 text-[18px]" />
              Add Employee
            </Link>
          </Button>
        }
      />

      {error ? (
        <EmptyState
          icon="error"
          title="Could not load summary"
          description="Check your connection and refresh."
        />
      ) : (
        <>
          {/* Headcount stats */}
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Total" value={loading ? "—" : String(summary?.total ?? 0)} icon="group" />
            <StatCard label="Active" value={loading ? "—" : String(summary?.active ?? 0)} icon="check_circle" tone="success" />
            <StatCard label="Draft" value={loading ? "—" : String(summary?.draft ?? 0)} icon="draft" tone="warning" />
            <StatCard label="Suspended / Exited" value={loading ? "—" : String((summary?.suspended ?? 0) + (summary?.exited ?? 0))} icon="person_off" tone="danger" />
          </div>

          {/* By employment type */}
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {(["full_time", "contract", "intern", "consultant"] as const).map((type) => (
              <SectionCard key={type}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {EMPLOYMENT_TYPE_LABELS[type]}
                </p>
                <p className="mt-1 text-2xl font-bold text-on-surface">
                  {loading ? "—" : String(summary?.by_employment_type?.[type] ?? 0)}
                </p>
              </SectionCard>
            ))}
          </div>

          {/* Recent hires */}
          <SectionCard>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-on-surface">Recent Hires</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/hr/employees">View all</Link>
              </Button>
            </div>
            {recentHires.length === 0 && !loading ? (
              <p className="text-sm text-slate-500">No recent hires.</p>
            ) : (
              <Table>
                <TableHead>
                  <TableHeaderRow>
                    <TableHeaderCell>Name</TableHeaderCell>
                    <TableHeaderCell>Job Title</TableHeaderCell>
                    <TableHeaderCell>Type</TableHeaderCell>
                    <TableHeaderCell>Hire Date</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                  </TableHeaderRow>
                </TableHead>
                <TableBody>
                  {recentHires.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell>
                        <Link
                          to={`/hr/employees/${emp.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {formatEmployeeName(emp)}
                        </Link>
                        <p className="text-xs text-slate-500">{emp.email}</p>
                      </TableCell>
                      <TableCell>{emp.job_title ?? "—"}</TableCell>
                      <TableCell>
                        {emp.employment_type
                          ? EMPLOYMENT_TYPE_LABELS[emp.employment_type]
                          : "—"}
                      </TableCell>
                      <TableCell>{formatDate(emp.hire_date)}</TableCell>
                      <TableCell>
                        <Chip tone={statusTone(emp.employment_status)}>
                          {EMPLOYMENT_STATUS_LABELS[emp.employment_status ?? ""] ?? "—"}
                        </Chip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </SectionCard>
        </>
      )}
    </AppShell>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal/apps/pwa && npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/modules/hr/HrDashboardPage.tsx
git commit -m "feat(hr): add HR dashboard page"
```

---

## Task 4: HrEmployeesPage (directory)

**Files:**
- Create: `apps/pwa/src/modules/hr/employees/HrEmployeesPage.tsx`

- [ ] **Step 1: Create the file**

```tsx
// apps/pwa/src/modules/hr/employees/HrEmployeesPage.tsx
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AppShell,
  Button,
  Chip,
  EmptyState,
  FilterBar,
  Icon,
  PageHeader,
  PaginationControls,
  SectionCard,
  SelectField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
} from "@/shared";
import { useAuth } from "@/shared/context/AuthProvider";
import { useCachedQuery } from "@/shared/lib/core";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import { listEmployees, type EmployeeSummary } from "../hr-api";
import {
  hrNavigation,
  EMPLOYMENT_TYPE_LABELS,
  EMPLOYMENT_STATUS_LABELS,
  WORK_MODE_LABELS,
  statusTone,
  formatEmployeeName,
} from "../hr-data";

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function HrEmployeesPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [type, setType] = useState(searchParams.get("type") ?? "");
  const [workMode, setWorkMode] = useState(searchParams.get("work_mode") ?? "");
  const [page, setPage] = useState(Number(searchParams.get("page") ?? 1));

  const { data: profile } = useCachedQuery(
    "hr:shell:profile",
    () => getWorkspaceProfile(),
    { ttlMs: 60_000, storage: "memory" },
  );

  const queryKey = `hr:employees:${search}:${status}:${type}:${workMode}:${page}`;
  const { data, loading, error } = useCachedQuery(
    queryKey,
    () =>
      listEmployees({
        search: search || undefined,
        employment_status: status || undefined,
        employment_type: type || undefined,
        work_mode: workMode || undefined,
        page,
        per_page: 20,
      }),
    { ttlMs: 30_000, storage: "memory" },
  );

  // Sync filters to URL
  useEffect(() => {
    const p: Record<string, string> = {};
    if (search) p.search = search;
    if (status) p.status = status;
    if (type) p.type = type;
    if (workMode) p.work_mode = workMode;
    if (page > 1) p.page = String(page);
    setSearchParams(p, { replace: true });
  }, [search, status, type, workMode, page, setSearchParams]);

  const employees: EmployeeSummary[] = data?.data ?? [];
  const meta = data?.meta;

  function resetPage() {
    setPage(1);
  }

  return (
    <AppShell
      navigation={hrNavigation}
      activeLabel="Employees"
      user={{
        name: profile?.name ?? user?.name ?? "—",
        role: profile?.primary_role ?? "HR",
      }}
    >
      <PageHeader
        title="Employees"
        description="Browse, search, and manage all staff records."
        actions={
          <Button asChild>
            <Link to="/hr/employees/new">
              <Icon name="person_add" className="mr-2 text-[18px]" />
              Add Employee
            </Link>
          </Button>
        }
      />

      <SectionCard className="mb-4 p-0">
        <FilterBar searchPlaceholder="Search by name or email">
          {/* The FilterBar's built-in search input is decorative; we control state manually below */}
          <SelectField
            label=""
            aria-label="Status"
            value={status}
            onChange={(e) => { setStatus(e.target.value); resetPage(); }}
          >
            <option value="">All Statuses</option>
            {Object.entries(EMPLOYMENT_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </SelectField>
          <SelectField
            label=""
            aria-label="Employment type"
            value={type}
            onChange={(e) => { setType(e.target.value); resetPage(); }}
          >
            <option value="">All Types</option>
            {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </SelectField>
          <SelectField
            label=""
            aria-label="Work mode"
            value={workMode}
            onChange={(e) => { setWorkMode(e.target.value); resetPage(); }}
          >
            <option value="">All Work Modes</option>
            {Object.entries(WORK_MODE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </SelectField>
        </FilterBar>

        {/* Search input (controlled, outside FilterBar's internal input) */}
        <div className="border-t border-slate-100 px-4 py-3">
          <div className="relative max-w-sm">
            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input-base h-10 pl-10"
              type="search"
              placeholder="Search by name or email"
              value={search}
              onChange={(e) => { setSearch(e.target.value); resetPage(); }}
            />
          </div>
        </div>
      </SectionCard>

      {error ? (
        <EmptyState icon="error" title="Could not load employees" description="Check your connection and refresh." />
      ) : employees.length === 0 && !loading ? (
        <EmptyState icon="group" title="No employees found" description="Try adjusting your filters." />
      ) : (
        <SectionCard className="p-0">
          <Table>
            <TableHead>
              <TableHeaderRow>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Code</TableHeaderCell>
                <TableHeaderCell>Job Title</TableHeaderCell>
                <TableHeaderCell>Type</TableHeaderCell>
                <TableHeaderCell>Work Mode</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Hire Date</TableHeaderCell>
                <TableHeaderCell />
              </TableHeaderRow>
            </TableHead>
            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell>
                    <p className="font-medium text-on-surface">{formatEmployeeName(emp)}</p>
                    <p className="text-xs text-slate-500">{emp.email}</p>
                  </TableCell>
                  <TableCell>{emp.employee_code ?? "—"}</TableCell>
                  <TableCell>{emp.job_title ?? "—"}</TableCell>
                  <TableCell>
                    {emp.employment_type ? EMPLOYMENT_TYPE_LABELS[emp.employment_type] : "—"}
                  </TableCell>
                  <TableCell>
                    {emp.work_mode ? WORK_MODE_LABELS[emp.work_mode] : "—"}
                  </TableCell>
                  <TableCell>
                    <Chip tone={statusTone(emp.employment_status)}>
                      {EMPLOYMENT_STATUS_LABELS[emp.employment_status ?? ""] ?? "—"}
                    </Chip>
                  </TableCell>
                  <TableCell>{formatDate(emp.hire_date)}</TableCell>
                  <TableCell>
                    <Link
                      to={`/hr/employees/${emp.id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      <Icon name="open_in_new" className="text-[16px]" />
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {meta && meta.last_page > 1 ? (
            <div className="border-t border-slate-100 px-4 py-3">
              <PaginationControls
                page={meta.page}
                lastPage={meta.last_page}
                total={meta.total}
                onPageChange={setPage}
              />
            </div>
          ) : null}
        </SectionCard>
      )}
    </AppShell>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal/apps/pwa && npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/modules/hr/employees/HrEmployeesPage.tsx
git commit -m "feat(hr): add employee directory page"
```

---

## Task 5: HrEmployeeCreatePage (two-step wizard)

**Files:**
- Create: `apps/pwa/src/modules/hr/employees/HrEmployeeCreatePage.tsx`

- [ ] **Step 1: Create the file**

```tsx
// apps/pwa/src/modules/hr/employees/HrEmployeeCreatePage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppShell,
  Button,
  Icon,
  PageHeader,
  SectionCard,
  SelectField,
  TextField,
  WorkflowStepper,
} from "@/shared";
import { useAuth } from "@/shared/context/AuthProvider";
import { useCachedQuery } from "@/shared/lib/core";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import { useToast } from "@/shared";
import { createEmployee } from "../hr-api";
import { hrNavigation, EMPLOYMENT_TYPE_LABELS } from "../hr-data";

type Step1Fields = {
  first_name: string;
  last_name: string;
  email: string;
  job_title: string;
  employment_type: string;
  hire_date: string;
};

const EMPTY: Step1Fields = {
  first_name: "",
  last_name: "",
  email: "",
  job_title: "",
  employment_type: "",
  hire_date: "",
};

export default function HrEmployeeCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const { data: profile } = useCachedQuery(
    "hr:shell:profile",
    () => getWorkspaceProfile(),
    { ttlMs: 60_000, storage: "memory" },
  );

  const [fields, setFields] = useState<Step1Fields>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set(key: keyof Step1Fields) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setFields((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fields.first_name.trim() || !fields.last_name.trim()) {
      setError("First and last name are required.");
      return;
    }
    if (!fields.email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!fields.job_title.trim()) {
      setError("Job title is required.");
      return;
    }
    if (!fields.employment_type) {
      setError("Employment type is required.");
      return;
    }

    setLoading(true);
    try {
      const employee = await createEmployee({
        first_name: fields.first_name.trim(),
        last_name: fields.last_name.trim(),
        email: fields.email.trim(),
        job_title: fields.job_title.trim(),
        employment_type: fields.employment_type,
        hire_date: fields.hire_date || undefined,
      });
      addToast({
        title: "Employee created",
        description: `${fields.first_name} ${fields.last_name} has been added. An invite has been sent to ${fields.email}.`,
        tone: "success",
      });
      navigate(`/hr/employees/${employee.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create employee.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell
      navigation={hrNavigation}
      activeLabel="Employees"
      user={{
        name: profile?.name ?? user?.name ?? "—",
        role: profile?.primary_role ?? "HR",
      }}
    >
      <PageHeader
        breadcrumbs={[
          { label: "Employees", href: "/hr/employees" },
          { label: "Add Employee" },
        ]}
        title="Add Employee"
        description="Create a new employee record and send a portal invite."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <SectionCard>
          <h2 className="mb-5 text-base font-semibold text-on-surface">
            Basic Information
          </h2>

          {error ? (
            <div
              role="alert"
              className="mb-5 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger"
            >
              {error}
            </div>
          ) : null}

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                label="First Name"
                required
                value={fields.first_name}
                onChange={set("first_name")}
                placeholder="Jane"
              />
              <TextField
                label="Last Name"
                required
                value={fields.last_name}
                onChange={set("last_name")}
                placeholder="Smith"
              />
            </div>

            <TextField
              label="Work Email"
              type="email"
              required
              value={fields.email}
              onChange={set("email")}
              placeholder="jane@stanforteedge.com"
            />

            <TextField
              label="Job Title"
              required
              value={fields.job_title}
              onChange={set("job_title")}
              placeholder="e.g. Programme Officer"
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <SelectField
                label="Employment Type"
                required
                value={fields.employment_type}
                onChange={set("employment_type")}
              >
                <option value="">Select type…</option>
                {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </SelectField>

              <TextField
                label="Hire Date"
                type="date"
                value={fields.hire_date}
                onChange={set("hire_date")}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating…" : "Create & Send Invite"}
                {!loading ? (
                  <Icon name="arrow_forward" className="ml-2 text-[18px]" />
                ) : null}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate("/hr/employees")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </SectionCard>

        {/* Side stepper */}
        <aside>
          <SectionCard>
            <h3 className="mb-4 text-sm font-semibold text-on-surface">
              What happens next
            </h3>
            <WorkflowStepper
              steps={[
                {
                  label: "Add basic details",
                  detail: "Name, email, job title, type.",
                  status: "current",
                },
                {
                  label: "Portal invite sent",
                  detail: "Employee receives a link to set their password.",
                  status: "upcoming",
                },
                {
                  label: "Complete the profile",
                  detail: "Add org, team, JD, and other details.",
                  status: "upcoming",
                },
              ]}
            />
          </SectionCard>
        </aside>
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal/apps/pwa && npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/modules/hr/employees/HrEmployeeCreatePage.tsx
git commit -m "feat(hr): add employee create wizard"
```

---

## Task 6: EmployeeProfileTab and EmployeeJobTab

**Files:**
- Create: `apps/pwa/src/modules/hr/employees/tabs/EmployeeProfileTab.tsx`
- Create: `apps/pwa/src/modules/hr/employees/tabs/EmployeeJobTab.tsx`

- [ ] **Step 1: Create EmployeeProfileTab**

```tsx
// apps/pwa/src/modules/hr/employees/tabs/EmployeeProfileTab.tsx
import { useState } from "react";
import { Button, TextField, SectionCard } from "@/shared";
import { useToast } from "@/shared";
import { updateEmployee, type EmployeeDetail } from "../../hr-api";

type Props = {
  employee: EmployeeDetail;
  onSaved: (updated: EmployeeDetail) => void;
};

export function EmployeeProfileTab({ employee, onSaved }: Props) {
  const { addToast } = useToast();
  const [fields, setFields] = useState({
    first_name: employee.first_name ?? "",
    last_name: employee.last_name ?? "",
    email: employee.email ?? "",
    phone: employee.phone ?? "",
    username: employee.username ?? "",
    employee_code: employee.employee_code ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(key: keyof typeof fields) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setFields((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const updated = await updateEmployee(employee.id, {
        first_name: fields.first_name.trim(),
        last_name: fields.last_name.trim(),
        email: fields.email.trim(),
        phone: fields.phone.trim() || undefined,
        username: fields.username.trim() || undefined,
        employee_code: fields.employee_code.trim() || undefined,
      });
      onSaved(updated);
      addToast({ title: "Profile saved", tone: "success" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save profile.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionCard>
      <h2 className="mb-5 text-base font-semibold text-on-surface">Profile</h2>
      {error ? (
        <div role="alert" className="mb-5 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : null}
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="First Name" required value={fields.first_name} onChange={set("first_name")} />
          <TextField label="Last Name" required value={fields.last_name} onChange={set("last_name")} />
        </div>
        <TextField label="Email" type="email" required value={fields.email} onChange={set("email")} />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Phone" type="tel" value={fields.phone} onChange={set("phone")} placeholder="+234 800 000 0000" />
          <TextField label="Username" value={fields.username} onChange={set("username")} placeholder="janesmith" />
        </div>
        <TextField label="Employee Code" value={fields.employee_code} onChange={set("employee_code")} placeholder="EMP-001" />
        <div className="pt-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Save Profile"}
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}
```

- [ ] **Step 2: Create EmployeeJobTab**

```tsx
// apps/pwa/src/modules/hr/employees/tabs/EmployeeJobTab.tsx
import { useState } from "react";
import { Button, SelectField, TextField, TextAreaField, SectionCard } from "@/shared";
import { useToast } from "@/shared";
import { updateEmployee, type EmployeeDetail } from "../../hr-api";
import { EMPLOYMENT_TYPE_LABELS, WORK_MODE_LABELS, EMPLOYMENT_STATUS_LABELS } from "../../hr-data";

type Props = {
  employee: EmployeeDetail;
  onSaved: (updated: EmployeeDetail) => void;
};

export function EmployeeJobTab({ employee, onSaved }: Props) {
  const { addToast } = useToast();
  const [fields, setFields] = useState({
    job_title: employee.job_title ?? "",
    job_description: employee.job_description ?? "",
    employment_type: employee.employment_type ?? "",
    work_mode: employee.work_mode ?? "",
    hire_date: employee.hire_date?.slice(0, 10) ?? "",
    confirmation_date: employee.confirmation_date?.slice(0, 10) ?? "",
    exit_date: employee.exit_date?.slice(0, 10) ?? "",
    manager_user_id: employee.manager_user_id ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField(key: keyof typeof fields) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setFields((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const updated = await updateEmployee(employee.id, {
        job_title: fields.job_title.trim() || undefined,
        job_description: fields.job_description.trim() || undefined,
        employment_type: fields.employment_type || undefined,
        work_mode: fields.work_mode || undefined,
        hire_date: fields.hire_date || undefined,
        confirmation_date: fields.confirmation_date || undefined,
        exit_date: fields.exit_date || undefined,
        manager_user_id: fields.manager_user_id.trim() || undefined,
      });
      onSaved(updated);
      addToast({ title: "Job details saved", tone: "success" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save job details.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionCard>
      <h2 className="mb-5 text-base font-semibold text-on-surface">Job &amp; Employment</h2>
      {error ? (
        <div role="alert" className="mb-5 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : null}
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <TextField label="Job Title" value={fields.job_title} onChange={setField("job_title")} placeholder="e.g. Programme Officer" />
        <TextAreaField label="Job Description" value={fields.job_description} onChange={setField("job_description")} rows={6} placeholder="Describe key responsibilities…" />

        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField label="Employment Type" value={fields.employment_type} onChange={setField("employment_type")}>
            <option value="">Select…</option>
            {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </SelectField>
          <SelectField label="Work Mode" value={fields.work_mode} onChange={setField("work_mode")}>
            <option value="">Select…</option>
            {Object.entries(WORK_MODE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </SelectField>
        </div>

        <div className="rounded-2xl bg-surface-container-low px-4 py-3">
          <p className="text-xs font-semibold text-slate-500">Employment Status</p>
          <p className="mt-1 text-sm font-medium text-on-surface">
            {EMPLOYMENT_STATUS_LABELS[employee.employment_status ?? ""] ?? "—"}
            <span className="ml-2 text-xs text-slate-500">(change via Actions tab)</span>
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <TextField label="Hire Date" type="date" value={fields.hire_date} onChange={setField("hire_date")} />
          <TextField label="Confirmation Date" type="date" value={fields.confirmation_date} onChange={setField("confirmation_date")} />
          <TextField label="Exit Date" type="date" value={fields.exit_date} onChange={setField("exit_date")} />
        </div>

        <TextField
          label="Manager (User ID)"
          value={fields.manager_user_id}
          onChange={setField("manager_user_id")}
          placeholder="Enter manager's user ID"
          description={employee.manager ? `Current: ${employee.manager.first_name} ${employee.manager.last_name}` : undefined}
        />

        <div className="pt-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Save Job Details"}
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal/apps/pwa && npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add apps/pwa/src/modules/hr/employees/tabs/
git commit -m "feat(hr): add employee profile and job tabs"
```

---

## Task 7: EmployeeOrgsTeamsTab and EmployeeActionsTab

**Files:**
- Create: `apps/pwa/src/modules/hr/employees/tabs/EmployeeOrgsTeamsTab.tsx`
- Create: `apps/pwa/src/modules/hr/employees/tabs/EmployeeActionsTab.tsx`

- [ ] **Step 1: Create EmployeeOrgsTeamsTab**

```tsx
// apps/pwa/src/modules/hr/employees/tabs/EmployeeOrgsTeamsTab.tsx
import { useState } from "react";
import { Button, Icon, SectionCard, TextField } from "@/shared";
import { useToast } from "@/shared";
import {
  addEmployeeOrganization,
  removeEmployeeOrganization,
  setPrimaryOrganization,
  addEmployeeTeam,
  removeEmployeeTeam,
  type EmployeeDetail,
} from "../../hr-api";

type Props = {
  employee: EmployeeDetail;
  onSaved: (updated: EmployeeDetail) => void;
};

export function EmployeeOrgsTeamsTab({ employee, onSaved }: Props) {
  const { addToast } = useToast();
  const [orgs, setOrgs] = useState(employee.organizations ?? []);
  const [teams, setTeams] = useState(employee.teams ?? []);
  const [newOrgId, setNewOrgId] = useState("");
  const [newTeamId, setNewTeamId] = useState("");
  const [orgLoading, setOrgLoading] = useState(false);
  const [teamLoading, setTeamLoading] = useState(false);

  async function handleAddOrg() {
    if (!newOrgId.trim()) return;
    setOrgLoading(true);
    try {
      await addEmployeeOrganization(employee.id, { organization_id: newOrgId.trim() });
      setOrgs((prev) => [...prev, { id: newOrgId.trim(), name: newOrgId.trim(), is_primary: false }]);
      setNewOrgId("");
      addToast({ title: "Organisation added", tone: "success" });
    } catch (err) {
      addToast({ title: err instanceof Error ? err.message : "Failed to add organisation", tone: "danger" });
    } finally {
      setOrgLoading(false);
    }
  }

  async function handleRemoveOrg(orgId: string) {
    try {
      await removeEmployeeOrganization(employee.id, orgId);
      setOrgs((prev) => prev.filter((o) => o.id !== orgId));
      addToast({ title: "Organisation removed", tone: "success" });
    } catch (err) {
      addToast({ title: err instanceof Error ? err.message : "Failed to remove organisation", tone: "danger" });
    }
  }

  async function handleSetPrimaryOrg(orgId: string) {
    try {
      await setPrimaryOrganization(employee.id, orgId);
      setOrgs((prev) => prev.map((o) => ({ ...o, is_primary: o.id === orgId })));
      addToast({ title: "Primary organisation updated", tone: "success" });
    } catch (err) {
      addToast({ title: err instanceof Error ? err.message : "Failed to update primary", tone: "danger" });
    }
  }

  async function handleAddTeam() {
    if (!newTeamId.trim()) return;
    setTeamLoading(true);
    try {
      await addEmployeeTeam(employee.id, { team_id: newTeamId.trim() });
      setTeams((prev) => [...prev, { id: newTeamId.trim(), name: newTeamId.trim(), is_primary: false }]);
      setNewTeamId("");
      addToast({ title: "Team added", tone: "success" });
    } catch (err) {
      addToast({ title: err instanceof Error ? err.message : "Failed to add team", tone: "danger" });
    } finally {
      setTeamLoading(false);
    }
  }

  async function handleRemoveTeam(teamId: string) {
    try {
      await removeEmployeeTeam(employee.id, teamId);
      setTeams((prev) => prev.filter((t) => t.id !== teamId));
      addToast({ title: "Team removed", tone: "success" });
    } catch (err) {
      addToast({ title: err instanceof Error ? err.message : "Failed to remove team", tone: "danger" });
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Organisations */}
      <SectionCard>
        <h2 className="mb-4 text-base font-semibold text-on-surface">Organisations</h2>
        <ul className="mb-4 space-y-2">
          {orgs.length === 0 ? (
            <li className="text-sm text-slate-500">No organisations assigned.</li>
          ) : orgs.map((org) => (
            <li key={org.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2">
              <div>
                <span className="text-sm font-medium text-on-surface">{org.name}</span>
                {org.is_primary ? (
                  <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">Primary</span>
                ) : null}
              </div>
              <div className="flex gap-2">
                {!org.is_primary ? (
                  <button
                    type="button"
                    className="text-xs font-medium text-primary hover:underline"
                    onClick={() => handleSetPrimaryOrg(org.id)}
                  >
                    Set primary
                  </button>
                ) : null}
                <button
                  type="button"
                  className="text-slate-400 hover:text-danger"
                  onClick={() => handleRemoveOrg(org.id)}
                  aria-label="Remove organisation"
                >
                  <Icon name="close" className="text-[18px]" />
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <TextField
            label=""
            aria-label="Organisation ID"
            value={newOrgId}
            onChange={(e) => setNewOrgId(e.target.value)}
            placeholder="Organisation ID"
          />
          <Button type="button" variant="secondary" size="sm" disabled={orgLoading || !newOrgId.trim()} onClick={handleAddOrg}>
            Add
          </Button>
        </div>
      </SectionCard>

      {/* Teams */}
      <SectionCard>
        <h2 className="mb-4 text-base font-semibold text-on-surface">Teams</h2>
        <ul className="mb-4 space-y-2">
          {teams.length === 0 ? (
            <li className="text-sm text-slate-500">No teams assigned.</li>
          ) : teams.map((team) => (
            <li key={team.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2">
              <div>
                <span className="text-sm font-medium text-on-surface">{team.name}</span>
                {team.is_primary ? (
                  <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">Primary</span>
                ) : null}
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-danger"
                onClick={() => handleRemoveTeam(team.id)}
                aria-label="Remove team"
              >
                <Icon name="close" className="text-[18px]" />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <TextField
            label=""
            aria-label="Team ID"
            value={newTeamId}
            onChange={(e) => setNewTeamId(e.target.value)}
            placeholder="Team ID"
          />
          <Button type="button" variant="secondary" size="sm" disabled={teamLoading || !newTeamId.trim()} onClick={handleAddTeam}>
            Add
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}
```

- [ ] **Step 2: Create EmployeeActionsTab**

```tsx
// apps/pwa/src/modules/hr/employees/tabs/EmployeeActionsTab.tsx
import { useState } from "react";
import { Button, Icon, SectionCard, TextField } from "@/shared";
import { useToast } from "@/shared";
import { runEmployeeAction, type EmployeeDetail, type EmployeeAction } from "../../hr-api";

type Props = {
  employee: EmployeeDetail;
  onSaved: (updated: EmployeeDetail) => void;
};

type ActionConfig = {
  action: EmployeeAction;
  label: string;
  icon: string;
  description: string;
  buttonLabel: string;
  tone: "success" | "warning" | "danger";
  disabledWhen: string[];
};

const ACTIONS: ActionConfig[] = [
  {
    action: "activate",
    label: "Activate",
    icon: "check_circle",
    description: "Set this employee as active. They will regain full access to the portal.",
    buttonLabel: "Activate Employee",
    tone: "success",
    disabledWhen: ["active"],
  },
  {
    action: "suspend",
    label: "Suspend",
    icon: "block",
    description: "Temporarily suspend access. The employee record is retained.",
    buttonLabel: "Suspend Employee",
    tone: "warning",
    disabledWhen: ["suspended", "exited"],
  },
  {
    action: "exit",
    label: "Exit",
    icon: "logout",
    description: "Mark this employee as exited. This action records a formal departure.",
    buttonLabel: "Exit Employee",
    tone: "danger",
    disabledWhen: ["exited"],
  },
];

const toneClasses: Record<string, string> = {
  success: "border-success/20 bg-success/5",
  warning: "border-warning/20 bg-warning/5",
  danger: "border-danger/20 bg-danger/5",
};

const buttonVariants: Record<string, "primary" | "secondary" | "danger"> = {
  success: "primary",
  warning: "secondary",
  danger: "danger",
};

export function EmployeeActionsTab({ employee, onSaved }: Props) {
  const { addToast } = useToast();
  const [activeAction, setActiveAction] = useState<EmployeeAction | null>(null);
  const [effectiveDate, setEffectiveDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRun(action: EmployeeAction) {
    setError(null);
    setLoading(true);
    try {
      const updated = await runEmployeeAction(employee.id, {
        action,
        effective_date: effectiveDate || undefined,
        notes: notes.trim() || undefined,
      });
      onSaved(updated);
      setActiveAction(null);
      setEffectiveDate("");
      setNotes("");
      addToast({ title: `Employee ${action}d successfully`, tone: "success" });
    } catch (err) {
      setError(err instanceof Error ? err.message : `Unable to ${action} employee.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div role="alert" className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : null}

      {ACTIONS.map((cfg) => {
        const isDisabled = cfg.disabledWhen.includes(employee.employment_status ?? "");
        const isOpen = activeAction === cfg.action;

        return (
          <SectionCard key={cfg.action} className={`border ${toneClasses[cfg.tone]}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <Icon name={cfg.icon} className="mt-0.5 text-[22px] text-on-surface-variant" />
                <div>
                  <h3 className="text-sm font-semibold text-on-surface">{cfg.label}</h3>
                  <p className="mt-0.5 text-sm text-slate-500">{cfg.description}</p>
                </div>
              </div>
              <Button
                type="button"
                variant={buttonVariants[cfg.tone]}
                size="sm"
                disabled={isDisabled || loading}
                onClick={() => setActiveAction(isOpen ? null : cfg.action)}
              >
                {cfg.buttonLabel}
              </Button>
            </div>

            {isOpen ? (
              <div className="mt-4 space-y-4 border-t border-slate-200 pt-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="Effective Date (optional)"
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                  />
                  <TextField
                    label="Notes (optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Reason or context…"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant={buttonVariants[cfg.tone]}
                    disabled={loading}
                    onClick={() => handleRun(cfg.action)}
                  >
                    {loading ? "Processing…" : `Confirm ${cfg.label}`}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setActiveAction(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : null}
          </SectionCard>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal/apps/pwa && npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add apps/pwa/src/modules/hr/employees/tabs/EmployeeOrgsTeamsTab.tsx apps/pwa/src/modules/hr/employees/tabs/EmployeeActionsTab.tsx
git commit -m "feat(hr): add orgs/teams and actions tabs"
```

---

## Task 8: HrEmployeeDetailPage (tabbed shell)

**Files:**
- Create: `apps/pwa/src/modules/hr/employees/HrEmployeeDetailPage.tsx`

- [ ] **Step 1: Create the file**

```tsx
// apps/pwa/src/modules/hr/employees/HrEmployeeDetailPage.tsx
import { useCallback, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  AppShell,
  Chip,
  EmptyState,
  PageHeader,
} from "@/shared";
import { useAuth } from "@/shared/context/AuthProvider";
import { useCachedQuery } from "@/shared/lib/core";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import { getEmployee, type EmployeeDetail } from "../hr-api";
import {
  hrNavigation,
  EMPLOYMENT_STATUS_LABELS,
  statusTone,
  formatEmployeeName,
} from "../hr-data";
import { EmployeeProfileTab } from "./tabs/EmployeeProfileTab";
import { EmployeeJobTab } from "./tabs/EmployeeJobTab";
import { EmployeeOrgsTeamsTab } from "./tabs/EmployeeOrgsTeamsTab";
import { EmployeeActionsTab } from "./tabs/EmployeeActionsTab";

type Tab = "profile" | "job" | "orgs" | "actions";

const TABS: { key: Tab; label: string }[] = [
  { key: "profile", label: "Profile" },
  { key: "job", label: "Job & Employment" },
  { key: "orgs", label: "Org & Teams" },
  { key: "actions", label: "Actions" },
];

export default function HrEmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const activeTab = (searchParams.get("tab") as Tab) ?? "profile";

  const { data: profile } = useCachedQuery(
    "hr:shell:profile",
    () => getWorkspaceProfile(),
    { ttlMs: 60_000, storage: "memory" },
  );

  const { data: employee, loading, error, refetch } = useCachedQuery(
    `hr:employee:${id}`,
    () => getEmployee(id!),
    { ttlMs: 30_000, storage: "memory" },
  );

  // Local state so tabs can optimistically update without a full refetch
  const [localEmployee, setLocalEmployee] = useState<EmployeeDetail | null>(null);
  const resolved = localEmployee ?? employee ?? null;

  const handleSaved = useCallback((updated: EmployeeDetail) => {
    setLocalEmployee(updated);
  }, []);

  function setTab(tab: Tab) {
    setSearchParams({ tab }, { replace: true });
  }

  if (error) {
    return (
      <AppShell
        navigation={hrNavigation}
        activeLabel="Employees"
        user={{ name: profile?.name ?? user?.name ?? "—", role: "HR" }}
      >
        <EmptyState
          icon="error"
          title="Employee not found"
          description="This record may have been removed or you don't have access."
          action={<Link to="/hr/employees" className="text-sm font-medium text-primary hover:underline">Back to Employees</Link>}
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      navigation={hrNavigation}
      activeLabel="Employees"
      user={{
        name: profile?.name ?? user?.name ?? "—",
        role: profile?.primary_role ?? "HR",
      }}
    >
      <PageHeader
        breadcrumbs={[
          { label: "Employees", href: "/hr/employees" },
          { label: resolved ? formatEmployeeName(resolved) : "Loading…" },
        ]}
        title={resolved ? formatEmployeeName(resolved) : "—"}
        eyebrow={resolved?.employee_code ?? undefined}
        description={resolved?.job_title ?? undefined}
        actions={
          resolved ? (
            <Chip tone={statusTone(resolved.employment_status)}>
              {EMPLOYMENT_STATUS_LABELS[resolved.employment_status ?? ""] ?? "—"}
            </Chip>
          ) : null
        }
      />

      {/* Tab nav */}
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={[
              "shrink-0 border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              activeTab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-on-surface",
            ].join(" ")}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading || !resolved ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <>
          {activeTab === "profile" && (
            <EmployeeProfileTab employee={resolved} onSaved={handleSaved} />
          )}
          {activeTab === "job" && (
            <EmployeeJobTab employee={resolved} onSaved={handleSaved} />
          )}
          {activeTab === "orgs" && (
            <EmployeeOrgsTeamsTab employee={resolved} onSaved={handleSaved} />
          )}
          {activeTab === "actions" && (
            <EmployeeActionsTab employee={resolved} onSaved={handleSaved} />
          )}
        </>
      )}
    </AppShell>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal/apps/pwa && npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/modules/hr/employees/HrEmployeeDetailPage.tsx
git commit -m "feat(hr): add employee detail tabbed page"
```

---

## Task 9: Wire routes in App.tsx and update migration map

**Files:**
- Modify: `apps/pwa/src/App.tsx`
- Modify: `docs/pwa-migration-map.md`

- [ ] **Step 1: Add new imports to App.tsx**

Add these imports after the existing HR imports (around line 3-6):

```ts
import HrDashboardPage from "@/modules/hr/HrDashboardPage";
import HrEmployeesPage from "@/modules/hr/employees/HrEmployeesPage";
import HrEmployeeCreatePage from "@/modules/hr/employees/HrEmployeeCreatePage";
import HrEmployeeDetailPage from "@/modules/hr/employees/HrEmployeeDetailPage";
```

- [ ] **Step 2: Add new routes inside the `<ProtectedRoute>` block**

Inside the `<Route element={<ProtectedRoute />}>` block, add a `ModuleRoute` block for HR, after the existing payroll/finance blocks:

```tsx
<Route element={<ModuleRoute moduleKey="hr" />}>
  <Route path="/hr" element={<HrDashboardPage />} />
  <Route path="/hr/employees" element={<HrEmployeesPage />} />
  <Route path="/hr/employees/new" element={<HrEmployeeCreatePage />} />
  <Route path="/hr/employees/:id" element={<HrEmployeeDetailPage />} />
</Route>
```

- [ ] **Step 3: Update migration map status**

In `docs/pwa-migration-map.md`, update the HR Module section rows:

```markdown
| `/appOld/hr` | `hr/dashboard/HrDashboard` | `/hr` | `modules/hr/HrDashboardPage` | ✅ | Stats + quick actions |
| `/appOld/hr/employees` | `hr/employees/HrEmployees` | `/hr/employees` | `modules/hr/employees/HrEmployeesPage` | ✅ | Full filter bar + table |
| `/appOld/hr/employees/:id` | `hr/employees/HrEmployeeEditor` | `/hr/employees/:id` | `modules/hr/employees/HrEmployeeDetailPage` | ✅ | Tabbed editor |
```

Also update the Staff — Other section for payslips:
```markdown
| `/appOld/profile/payslips` | `profile/MyPayslips` | `/profile/payslips` | `pages/system/PayslipsPage` | ✅ | Under payroll module guard |
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal/apps/pwa && npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/App.tsx docs/pwa-migration-map.md
git commit -m "feat(hr): wire HR routes and update migration map"
```

---

## Self-Review Notes

**Spec coverage check:**
- ✅ HrDashboardPage — stats + quick actions + recent hires
- ✅ HrEmployeesPage — filter bar (status, type, work mode, search), paginated table
- ✅ HrEmployeeCreatePage — two-step wizard (form + WorkflowStepper sidebar)
- ✅ EmployeeProfileTab — name, email, phone, username, employee_code
- ✅ EmployeeJobTab — title, JD, type, work mode, status (read-only), dates, manager
- ✅ EmployeeOrgsTeamsTab — add/remove/primary for orgs and teams
- ✅ EmployeeActionsTab — activate/suspend/exit with effective_date + notes
- ✅ HrEmployeeDetailPage — tabbed shell with URL param, breadcrumbs, status chip
- ✅ Routes wired under `ModuleRoute moduleKey="hr"`
- ✅ File reorganisation (attendance/, leave/ sub-folders)
- ✅ `hr-api.ts` — all 10 functions with typed responses
- ✅ `hr-data.ts` — navigation, label maps, statusTone, formatEmployeeName

**Type consistency:** All tasks reference `EmployeeDetail` from `hr-api.ts`. All tab components take `employee: EmployeeDetail` and `onSaved: (updated: EmployeeDetail) => void`. All `updateEmployee` / `runEmployeeAction` calls match the signatures in Task 2.
