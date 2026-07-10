# Navigation IA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize the PWA navigation and workspace structure so staff use `Requests`, `Tasks`, `Attendance`, `Workspace`, and `Profile`, while specialist users access `Finance`, `HR`, `Administration`, and `System Settings` with procurement moved under Administration.

**Architecture:** Update the shared navigation builder first, then align route placement and page shells to the new IA. Reuse the existing `AppShell`, permission gates, workspace profile APIs, and request engine; keep the group data model unified and make the new `Workspace -> Groups` and `Workspace -> Projects` structure type-aware rather than introducing separate backend entities.

**Tech Stack:** React, TypeScript, React Router, existing `AppShell`/sidebar navigation, cached workspace/profile APIs, NestJS-backed request/procurement APIs.

---

## File Structure

- Modify: `apps/pwa/src/shared/navigation.ts`
  - Central navigation tree and labels for top-level/staff/specialist modules.
- Modify: `apps/pwa/src/App.tsx`
  - Route placement and permission gating for procurement, staff, admin, and settings surfaces.
- Modify: `apps/pwa/src/pages/requests/requests-data.ts`
  - Request-page helper navigation exports that depend on shared nav labels.
- Modify: `apps/pwa/src/pages/teams/TeamsPage.tsx`
  - Convert current team list into `Workspace -> Groups` list surface.
- Modify: `apps/pwa/src/pages/teams/TeamDetailPage.tsx`
  - Convert current team detail into dynamic group detail tabs.
- Modify: `apps/pwa/src/pages/projects/ProjectsPage.tsx`
  - Make projects a staff-visible workspace discovery page.
- Modify: `apps/pwa/src/pages/projects/ProjectDetailPage.tsx`
  - Add public vs internal tab visibility rules.
- Modify: `apps/pwa/src/pages/account/ProfilePage.tsx`
  - Ensure Leave and personal records placement is coherent with `Profile`.
- Modify: `apps/pwa/src/pages/hr/leave/LeavePage.tsx`
  - Ensure leave remains reachable from profile-oriented navigation.
- Modify: `apps/pwa/src/pages/procurement/*.tsx`
  - Keep procurement shells/labels aligned under Administration-facing navigation.
- Modify: `api/scripts/seed-request-categories.js`
  - Seed procurement request category/type records if not already present.
- Modify: `api/src/modules/requests/*` and/or supporting seed files as needed
  - Ensure procurement request type metadata supports the request engine UX.

### Task 1: Rebuild Shared Navigation Tree

**Files:**
- Modify: `apps/pwa/src/shared/navigation.ts`
- Test: `apps/pwa/src/App.tsx`

- [ ] **Step 1: Write the failing shell smoke expectation as a checklist note**

Expected navigation after implementation:

```ts
// Staff core
Dashboard
Requests
Tasks
Attendance
Workspace
Profile

// Specialist
Finance
HR
Administration
System Settings
```

- [ ] **Step 2: Update the top-level nav tree**

Replace the current staff/admin mix with a structure like:

```ts
return [
  { label: "Dashboard", icon: "grid_view", path: "/", section: "Staff" },
  {
    label: "Requests",
    icon: "format_list_bulleted",
    section: "Staff",
    children: [
      { label: "My Requests", icon: "list_alt", path: "/requests" },
      { label: "Approvals", icon: "task_alt", path: "/requests/approvals", permissions: ["requests.approve"], requiresTeamLeadAssignment: true },
      { label: "New Request", icon: "add_circle", path: "/requests/new" },
    ],
  },
  { key: "my-tasks", label: "Tasks", icon: "checklist", path: "/tasks", section: "Staff" },
  { label: "Attendance", icon: "pending_actions", path: "/attendance", section: "Staff" },
  {
    label: "Workspace",
    icon: "workspaces",
    section: "Staff",
    children: [
      { key: "workspace-groups", label: "Groups", icon: "groups", path: "/teams" },
      { key: "workspace-projects", label: "Projects", icon: "assignment", path: "/projects" },
    ],
  },
  {
    label: "Profile",
    icon: "person",
    section: "Staff",
    children: [
      { label: "My Profile", icon: "person", path: "/profile" },
      { label: "Payslips", icon: "receipt_long", path: "/profile/payslips" },
      { label: "Leave", icon: "event_available", path: "/leave" },
      { label: "Settings", icon: "settings", path: "/settings" },
    ],
  },
];
```

- [ ] **Step 3: Move procurement under Administration in navigation**

Add an Administration child like:

```ts
{ key: "admin-procurement", label: "Procurement", icon: "shopping_cart", path: "/procurement", permissions: ["procurement.view", "procurement.manage"] }
```

And remove procurement from the Staff section.

- [ ] **Step 4: Add a separate System Settings top-level section**

Split system config from Administration:

```ts
{
  label: "System Settings",
  icon: "settings_applications",
  section: "Admin",
  permissions: ["admin.manage"],
  children: [
    { key: "system-settings", label: "Platform Settings", icon: "settings", path: "/admin/settings", permissions: ["admin.manage"] },
  ],
}
```

- [ ] **Step 5: Run PWA typecheck**

Run: `npx tsc --noEmit --project apps/pwa/tsconfig.json`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/pwa/src/shared/navigation.ts
git commit -m "refactor(nav): reorganize top-level IA"
```

### Task 2: Align Route Placement With The New IA

**Files:**
- Modify: `apps/pwa/src/App.tsx`
- Test: `apps/pwa/src/App.tsx`

- [ ] **Step 1: Write the route checklist**

Required route groupings:

```ts
// Staff core
/requests
/tasks
/attendance
/teams
/projects
/profile
/leave

// Specialist
/finance/*
/hr/*
/procurement/*
/admin/*
```

- [ ] **Step 2: Keep staff routes under the protected staff tree**

Ensure routes like these remain available to all authenticated staff:

```tsx
<Route path="/tasks" element={<TasksPage />} />
<Route path="/attendance" element={<AttendancePage />} />
<Route path="/teams" element={<TeamsPage />} />
<Route path="/teams/:id" element={<TeamDetailPage />} />
<Route path="/projects" element={<ProjectsPage />} />
<Route path="/projects/:id" element={<ProjectDetailPage />} />
<Route path="/leave" element={<LeavePage />} />
```

- [ ] **Step 3: Keep procurement routes permission-gated but conceptually under Administration**

Leave route paths stable for now, but keep them behind procurement permissions only:

```tsx
<Route element={<PermissionRoute requiredPermissions={["procurement.view", "procurement.manage", "procurement.orders.manage", "procurement.grn.manage"]} any />}>
  <Route path="/procurement" element={<ProcurementIndex />} />
  <Route path="/procurement/:id" element={<PrDetail />} />
  <Route path="/procurement/orders" element={<PoIndex />} />
  <Route path="/procurement/orders/create" element={<CreatePo />} />
  <Route path="/procurement/orders/:id" element={<PoDetail />} />
</Route>
```

- [ ] **Step 4: Keep `/admin/settings` as the backing route for System Settings**

Do not move the path yet; only move the navigation label.

- [ ] **Step 5: Run PWA build**

Run: `npm run build -w apps/pwa`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/pwa/src/App.tsx
git commit -m "refactor(routes): align IA route groups"
```

### Task 3: Convert Teams Into Workspace Groups

**Files:**
- Modify: `apps/pwa/src/pages/teams/TeamsPage.tsx`
- Modify: `apps/pwa/src/pages/teams/TeamDetailPage.tsx`
- Test: `apps/pwa/src/shared/api/workspace-api.ts`

- [ ] **Step 1: Update the groups landing page labels**

Adjust the page header to reflect the new workspace meaning:

```tsx
<PageHeader
  breadcrumbs={[{ label: "Workspace" }, { label: "Groups" }]}
  title="Groups"
  description="Browse your departments, teams, committees, clubs, and other shared work groups."
/>
```

- [ ] **Step 2: Group the current flat list by type**

Add a simple grouping layer:

```ts
const grouped = teams.reduce<Record<string, any[]>>((acc, team) => {
  const type = String(team.type || "other");
  acc[type] ??= [];
  acc[type].push(team);
  return acc;
}, {});
```

Render one section per type.

- [ ] **Step 3: Add organization and role badges to each card**

Show basic metadata inline:

```tsx
<span>{team.type}</span>
<span>{team.role}</span>
<span>{team.organization?.name ?? team.organization_name ?? ""}</span>
```

- [ ] **Step 4: Reorder group detail tabs to the new workspace pattern**

Use a base tab list like:

```ts
const tabs = ["overview", "tasks", "members", "requests", "budgets", "projects"];
```

Then hide unsupported tabs by group type/role instead of always rendering all of them.

- [ ] **Step 5: Keep Requests and Budgets tabs role-aware**

Use simple visibility rules first:

```ts
const role = String(team?.role || "member").toLowerCase();
const canSeeAllRequests = ["lead", "moderator", "manager", "admin"].includes(role);
const canWorkBudgets = team?.type === "department" && canSeeAllRequests;
```

- [ ] **Step 6: Add placeholder Tasks and Projects tabs if needed**

If the full task/project embedding is not ready yet, render shells:

```tsx
<SectionCard title="Tasks" description="Shared tasks for this group will appear here." />
<SectionCard title="Projects" description="Projects related to this group will appear here." />
```

- [ ] **Step 7: Run PWA typecheck**

Run: `npx tsc --noEmit --project apps/pwa/tsconfig.json`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add apps/pwa/src/pages/teams/TeamsPage.tsx apps/pwa/src/pages/teams/TeamDetailPage.tsx
git commit -m "feat(workspace): reshape teams as groups"
```

### Task 4: Make Projects Public-First With Internal Tabs

**Files:**
- Modify: `apps/pwa/src/pages/projects/ProjectsPage.tsx`
- Modify: `apps/pwa/src/pages/projects/ProjectDetailPage.tsx`

- [ ] **Step 1: Update the projects index labels to live under Workspace**

Use:

```tsx
<PageHeader
  breadcrumbs={[{ label: "Workspace" }, { label: "Projects" }]}
  title="Projects"
  description="Discover projects across the organization and open the ones relevant to your work."
/>
```

- [ ] **Step 2: Ensure all staff can browse project basics**

Keep the list page readable to general staff and avoid requiring specialist permissions.

- [ ] **Step 3: Split project detail into public vs internal tabs**

Introduce a minimal distinction:

```ts
const publicTabs = ["overview", "activities"];
const internalTabs = ["tasks", "members", "requests", "budgets", "funds", "partners", "donors"];
```

Render internal tabs only for scoped users.

- [ ] **Step 4: Add a scoped-user guard**

Use a simple starter rule:

```ts
const canSeeInternalProjectTabs = Boolean(project?.isMember || project?.isLead || project?.can_manage || project?.can_view_internal);
```

Fallback to public tabs only.

- [ ] **Step 5: Keep Activities visible to everyone**

If no activities tab exists yet, create a placeholder section:

```tsx
<SectionCard title="Activities" description="Project updates and recent visible activity." />
```

- [ ] **Step 6: Run PWA build**

Run: `npm run build -w apps/pwa`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/pwa/src/pages/projects/ProjectsPage.tsx apps/pwa/src/pages/projects/ProjectDetailPage.tsx
git commit -m "feat(workspace): add public and internal project views"
```

### Task 5: Reorganize Profile And Leave Placement

**Files:**
- Modify: `apps/pwa/src/pages/account/ProfilePage.tsx`
- Modify: `apps/pwa/src/pages/hr/leave/LeavePage.tsx`
- Modify: `apps/pwa/src/shared/navigation.ts`

- [ ] **Step 1: Keep Leave under Profile navigation**

Verify the profile submenu contains:

```ts
{ label: "My Profile", icon: "person", path: "/profile" },
{ label: "Payslips", icon: "receipt_long", path: "/profile/payslips" },
{ label: "Leave", icon: "event_available", path: "/leave" },
{ label: "Settings", icon: "settings", path: "/settings" },
```

- [ ] **Step 2: Make Profile the home for employee-facing outcomes**

In `ProfilePage`, add or preserve cards/links for:

```tsx
<SupportCard title="Payslips" ... />
<SupportCard title="Leave" ... />
```

If a support-card pattern does not exist, use the local profile summary pattern already in the file.

- [ ] **Step 3: Keep leave route intact but stop presenting it as a top-level staff bucket in nav**

No route rename is required in this task.

- [ ] **Step 4: Run PWA typecheck**

Run: `npx tsc --noEmit --project apps/pwa/tsconfig.json`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/pages/account/ProfilePage.tsx apps/pwa/src/pages/hr/leave/LeavePage.tsx apps/pwa/src/shared/navigation.ts
git commit -m "refactor(profile): move leave into profile IA"
```

### Task 6: Keep Procurement Under Administration And Seed Procurement Request Types

**Files:**
- Modify: `apps/pwa/src/shared/navigation.ts`
- Modify: `api/scripts/seed-request-categories.js`
- Modify: `docs/superpowers/specs/2026-07-05-procurement-usage-manual.md`

- [ ] **Step 1: Add procurement under Administration navigation**

Use:

```ts
{ key: "admin-procurement", label: "Procurement", icon: "shopping_cart", path: "/procurement", permissions: ["procurement.view", "procurement.manage"] }
```

- [ ] **Step 2: Seed a Procurement request category if not present**

In the request category seed script, add a category entry like:

```js
{
  code: "PROCUREMENT",
  name: "Procurement",
  description: "Request goods, services, works, and procurement-related approvals.",
}
```

- [ ] **Step 3: Seed procurement request types under that category**

Add at least:

```js
[
  { name: "Goods Purchase", workflow_type: "procurement" },
  { name: "Service Procurement", workflow_type: "procurement" },
  { name: "Works Request", workflow_type: "procurement" },
]
```

Match the existing seed script’s object shape exactly.

- [ ] **Step 4: Update the procurement usage manual to match Administration placement**

Replace staff-facing procurement menu references with:

```md
- Staff starts from `Requests -> New Request`
- Procurement officers work from `Administration -> Procurement -> Intake`
```

- [ ] **Step 5: Run API build**

Run: `npm run build -w api`
Expected: PASS

- [ ] **Step 6: Run PWA build**

Run: `npm run build -w apps/pwa`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/pwa/src/shared/navigation.ts api/scripts/seed-request-categories.js docs/superpowers/specs/2026-07-05-procurement-usage-manual.md
git commit -m "feat(procurement): align IA and seed request types"
```

### Task 7: Reorganize Finance Navigation Buckets

**Files:**
- Modify: `apps/pwa/src/shared/navigation.ts`
- Test: `apps/pwa/src/App.tsx`

- [ ] **Step 1: Replace the current Finance submenus with role-based buckets**

Target shape:

```ts
Financial
  Dashboard
  Workflows
  Accounting
  Receivables
  Payables
  Assets
  Payroll
  Setup
```

- [ ] **Step 2: Move Budgets and Statutory Deductions under Workflows**

Use children like:

```ts
{ key: "finance-requests", label: "Requests", ... }
{ key: "finance-vouchers", label: "Payment Vouchers", ... }
{ key: "finance-budgets", label: "Budgets", ... }
{ key: "finance-statutory-deductions", label: "Statutory Deductions", ... }
```

- [ ] **Step 3: Move Deduction Types under Payroll**

Use:

```ts
{ key: "finance-deduction-types", label: "Deduction Types", icon: "percent", path: "/finance/deduction-types", permissions: ["finance.manage"] }
```

- [ ] **Step 4: Reduce Setup to master-data/config that is not workflow-heavy**

Keep Setup small:

```ts
Products & Services
Finance Settings
```

- [ ] **Step 5: Run PWA typecheck**

Run: `npx tsc --noEmit --project apps/pwa/tsconfig.json`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/pwa/src/shared/navigation.ts
git commit -m "refactor(finance): regroup finance navigation"
```

### Task 8: Verification and IA Documentation Alignment

**Files:**
- Modify: `docs/superpowers/specs/2026-07-05-navigation-ia-design.md` only if implementation differs materially

- [ ] **Step 1: Run API build**

Run: `npm run build -w api`
Expected: PASS

- [ ] **Step 2: Run PWA build**

Run: `npm run build -w apps/pwa`
Expected: PASS

- [ ] **Step 3: Manual navigation verification**

Check manually:

- staff sees `Dashboard`, `Requests`, `Tasks`, `Attendance`, `Workspace`, `Profile`
- staff no longer sees Procurement in staff menu
- procurement user sees `Administration -> Procurement`
- leave is reachable through Profile navigation
- Workspace shows `Groups` and `Projects`
- Group detail shows the new tab order and hides unsupported tabs
- Projects show public tabs to ordinary staff
- Finance shows regrouped submenu buckets

- [ ] **Step 4: Align the IA spec if needed**

If implementation diverged from the approved spec, update:

```bash
git add docs/superpowers/specs/2026-07-05-navigation-ia-design.md
git commit -m "docs(nav): align IA spec with implementation"
```

## Spec Coverage Check

- Staff-facing core navigation: covered in Tasks 1, 2, and 5.
- Workspace as real shared surface: covered in Tasks 3 and 4.
- Unified typed group model: covered in Task 3.
- Project public/internal split: covered in Task 4.
- Procurement under Administration: covered in Task 6.
- Procurement request type seeding: covered in Task 6.
- Finance regrouping: covered in Task 7.
- Profile/leave/payslip placement: covered in Task 5.
- Role-based visibility and tab behavior: covered in Tasks 3 and 4.
