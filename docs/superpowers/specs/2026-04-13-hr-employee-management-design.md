# HR Employee Management Design

**Date:** 2026-04-13  
**Scope:** HR Dashboard, Employee Directory, Employee Create (wizard), Employee Detail (tabbed editor)  
**Module guard:** `moduleKey="hr"` (permission: `users.manage`)

---

## Goals

Port the HR admin employee management flow into the new portal UI:
- HR staff can view headcount stats and quick-action from a dashboard
- HR staff can browse, search, and filter all employees from a directory
- HR staff can create a new employee (creates portal account + sends invite) in two steps
- HR staff can view and edit any employee's profile, job details, org/team assignments, and run status actions

Admin user creation for other user types is out of scope — handled by a future Admin module.

---

## File Structure

```
apps/pwa/src/modules/hr/
  hr-api.ts                          ← new: all HR admin API calls + types
  HrDashboardPage.tsx                ← new
  attendance/
    AttendancePage.tsx               ← moved from hr/ root
    attendance-api.ts                ← moved from hr/ root
    attendance-data.ts               ← moved from hr/ root
  leave/
    LeavePage.tsx                    ← moved from hr/ root
    LeaveRequestFormPage.tsx         ← moved from hr/ root
    LeaveRequestDetailsPage.tsx      ← moved from hr/ root
  employees/
    HrEmployeesPage.tsx              ← new: directory list
    HrEmployeeCreatePage.tsx         ← new: two-step wizard
    HrEmployeeDetailPage.tsx         ← new: tabbed editor shell
    tabs/
      EmployeeProfileTab.tsx         ← name, email, phone, username, employee code
      EmployeeJobTab.tsx             ← title, JD, type, work mode, status, dates, manager
      EmployeeOrgsTeamsTab.tsx       ← org + team assignments
      EmployeeActionsTab.tsx         ← activate / suspend / exit
```

**Imports updated in `App.tsx`** for moved attendance and leave files.

---

## Routes

All new routes added under `<ModuleRoute moduleKey="hr" />` in `App.tsx`:

```
/hr                        → HrDashboardPage
/hr/employees              → HrEmployeesPage
/hr/employees/new          → HrEmployeeCreatePage
/hr/employees/:id          → HrEmployeeDetailPage  (default tab: Profile)
/hr/employees/:id?tab=job  → HrEmployeeDetailPage  (Job & Employment tab)
```

Existing routes updated to reflect new file paths (no URL changes):
```
/attendance   → modules/hr/attendance/AttendancePage
/leave        → modules/hr/leave/LeavePage
/leave/new/form   → modules/hr/leave/LeaveRequestFormPage
/leave/details    → modules/hr/leave/LeaveRequestDetailsPage
```

---

## `hr-api.ts`

Typed API client over existing backend endpoints. All calls use `httpRequest` from `@/shared/lib/core`.

```ts
// Types
export type EmploymentType = 'full_time' | 'contract' | 'intern' | 'consultant';
export type EmploymentStatus = 'draft' | 'active' | 'suspended' | 'exited';
export type WorkMode = 'onsite' | 'hybrid' | 'remote';
export type EmployeeAction = 'activate' | 'suspend' | 'exit';

export type EmployeeSummary = {
  id: string; user_id: string; first_name: string; last_name: string;
  email: string; employee_code?: string; job_title?: string;
  employment_type?: EmploymentType; employment_status?: EmploymentStatus;
  work_mode?: WorkMode; primary_organization?: { id: string; name: string };
  primary_team?: { id: string; name: string }; hire_date?: string;
};

export type EmployeeDetail = EmployeeSummary & {
  phone?: string; username?: string; job_description?: string;
  manager?: { id: string; first_name: string; last_name: string };
  confirmation_date?: string; exit_date?: string;
  organizations: Array<{ id: string; name: string; is_primary: boolean }>;
  teams: Array<{ id: string; name: string; is_primary: boolean }>;
  roles: string[]; metadata?: Record<string, unknown>;
};

export type HrSummary = {
  total: number; active: number; draft: number;
  suspended: number; exited: number;
  by_employment_type: Record<EmploymentType, number>;
  recent_hires: EmployeeSummary[];
};

export type EmployeeListResponse = {
  data: EmployeeSummary[];
  meta: { page: number; per_page: number; total: number; last_page: number };
};

// Functions
export async function getHrSummary(): Promise<HrSummary>
export async function listEmployees(params): Promise<EmployeeListResponse>
export async function getEmployee(id: string): Promise<EmployeeDetail>
export async function createEmployee(dto): Promise<EmployeeDetail>
export async function updateEmployee(id: string, dto): Promise<EmployeeDetail>
export async function runEmployeeAction(id: string, dto): Promise<EmployeeDetail>
export async function addEmployeeOrganization(id: string, dto): Promise<void>
export async function removeEmployeeOrganization(id: string, orgId: string): Promise<void>
export async function addEmployeeTeam(id: string, dto): Promise<void>
export async function removeEmployeeTeam(id: string, teamId: string): Promise<void>
```

---

## Pages

### HrDashboardPage (`/hr`)

Uses `AppShell` + `useCachedQuery("hr:summary", getHrSummary)`.

**Layout:**
- `PageHeader`: "HR Overview" + "Add Employee" button (→ `/hr/employees/new`)
- Stat cards row: Total Employees, Active, Draft, Suspended/Exited
- Secondary row: breakdown by employment type (Full-time, Contract, Intern, Consultant)
- Recent Hires section: table of last 5 hires (name, title, hire date, status chip) with "View all" → `/hr/employees`

Navigation sidebar items for HR module:
```
Overview       → /hr
Employees      → /hr/employees
Attendance     → /attendance
Leave          → /leave
```

---

### HrEmployeesPage (`/hr/employees`)

Full-width table with filter bar (matches `RequestsListPage` pattern).

**Filter bar:** search (name/email), status (all/active/draft/suspended/exited), employment type, work mode. Pagination controls at bottom.

**Table columns:** Name + email, Employee Code, Job Title, Type, Work Mode, Status chip, Hire Date, Actions (view icon → detail page).

Data: `useCachedQuery("hr:employees:{params}", () => listEmployees(params))` — re-fetches when filters change.

---

### HrEmployeeCreatePage (`/hr/employees/new`)

Two-step `WorkflowStepper`:

**Step 1 — Basics**
Fields: First Name, Last Name, Email, Job Title, Employment Type (select), Hire Date.
Submit calls `createEmployee(dto)`. On success → navigate to `/hr/employees/:id` (the new employee's detail page) with a success toast.

**Step 2** is implicit — user lands on the full tabbed editor to complete remaining details.

Validation: all Step 1 fields required. Email must be unique (show API error inline).

---

### HrEmployeeDetailPage (`/hr/employees/:id`)

Fetches employee via `useCachedQuery("hr:employee:{id}", () => getEmployee(id))`.

Shell: `PageHeader` with employee name + status chip + breadcrumb (`Employees → {name}`). Four tabs using URL search param `?tab=profile|job|orgs|actions` (default: `profile`).

Each tab is a self-contained form component that:
1. Receives `employee: EmployeeDetail` as prop
2. Manages its own local form state (dirty tracking)
3. Has its own Save button — calls `updateEmployee` on submit
4. Shows inline success/error feedback (no full-page reload)

#### EmployeeProfileTab
Fields: First Name, Last Name, Email, Phone, Username, Employee Code.

#### EmployeeJobTab
Fields: Job Title, Job Description (textarea, multiline), Employment Type (select), Work Mode (select), Employment Status (read-only display — changed via Actions tab), Hire Date, Confirmation Date, Exit Date, Manager (text input for manager_user_id, display manager name if resolved).

#### EmployeeOrgsTeamsTab
Two sections side-by-side (stacked on mobile):
- **Organizations:** list of assigned orgs with primary badge + remove button. "Add org" inline input. "Set as primary" button per row.
- **Teams:** same pattern for teams.

Each add/remove calls the API immediately (no batch save). Optimistic update with rollback on error.

#### EmployeeActionsTab
Three action cards: **Activate**, **Suspend**, **Exit**.
Each card: description of what the action does, Effective Date field (optional), Notes field (optional), action button.
Active card is highlighted based on current `employment_status` (e.g. if active, Activate is disabled).
Calls `runEmployeeAction(id, { action, effective_date, notes })`. On success: refetch employee + show toast.

---

## Navigation

The HR sidebar (built in `HrDashboardPage` and passed to `AppShell`) follows the same `SidebarItem[]` pattern used by Finance and Requests pages:

```ts
const hrNavigation: SidebarItem[] = [
  { label: 'Overview', icon: 'dashboard', path: '/hr' },
  { label: 'Employees', icon: 'group', path: '/hr/employees' },
  { label: 'Attendance', icon: 'pending_actions', path: '/attendance' },
  { label: 'Leave', icon: 'event_available', path: '/leave' },
];
```

All HR pages use this same navigation array.

---

## Error Handling

- API errors shown inline (not toast) on form saves
- List page shows `EmptyState` on empty results or fetch error
- Detail page shows error state if employee not found (404 → redirect to `/hr/employees`)

---

## What's Not In Scope

- Leave balance management (separate HR admin feature)
- Onboarding form assignments (separate feature)
- HR attendance admin view (separate from staff attendance)
- HR leave admin view (separate from staff leave)
