# Permission System Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every page and action in the PWA gated by a specific system-seeded permission, with a `requiredPermissions` prop on UI components so pages don't need manual wrapper logic.

**Architecture:** Permissions are seeded by code (never created via UI), roles are user-managed bundles of those permissions. A `usePermission(required, any?)` hook is the single check source; `Button`, `StatCard`, and `SectionCard` accept `requiredPermissions` and self-hide. `PermissionRoute` (already built in `AccessRoute.tsx`) wraps individual routes inside the existing `ModuleRoute` groups in `App.tsx`.

**Tech Stack:** NestJS + Prisma (backend seed), React 18 + TypeScript + React Router v6 (frontend), `hasAnyPermission` from `@stanforte/shared`.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `api/prisma/seed.ts` | Create | Upsert all canonical permissions |
| `api/package.json` | Modify | Add prisma seed command |
| `api/src/modules/rbac/rbac.controller.ts` | Modify | Remove `POST /permissions` and `DELETE /permissions/:id` endpoints |
| `apps/pwa/src/shared/hooks/usePermission.ts` | Create | Single-source permission check hook |
| `apps/pwa/src/shared/components/ui/Button.tsx` | Modify | Add `requiredPermissions` prop |
| `apps/pwa/src/shared/components/ui/StatCard.tsx` | Modify | Add `requiredPermissions` prop |
| `apps/pwa/src/shared/components/layout/SectionCard.tsx` | Modify | Add `requiredPermissions` prop |
| `apps/pwa/src/App.tsx` | Modify | Add `PermissionRoute` wrappers inside HR, Admin, Finance route groups |
| `apps/pwa/src/shared/navigation.ts` | Modify | Add `permissions` fields to HR and Admin nav items |
| `apps/pwa/src/pages/admin/roles/AdminPermissionSlideOver.tsx` | Modify | Strip to read-only (no create/delete) |
| `apps/pwa/src/pages/admin/roles/AdminRolesPage.tsx` | Modify | Remove create/edit permission state and "New Permission" button |
| `apps/pwa/src/pages/hr/attendance/HrAttendancePage.tsx` | Modify | Gate Approve/Review buttons with `requiredPermissions` |

---

## Canonical Permission List

The following permissions are seeded by code. No others exist. Admins only assign these to roles.

```
attendance.clock          — clock in and out (any staff)
attendance.view_self      — view own attendance records
attendance.view_team      — view team attendance records
attendance.manage         — manage attendance records and settings
attendance.approve        — approve/reject attendance correction requests
attendance.correct        — submit attendance corrections (staff)

leave.view                — view leave requests in HR admin
leave.manage              — manage leave types, balances, and policy
leave.approve             — approve and reject leave requests

hr.view                   — access the /hr admin section at all
hr.manage                 — manage HR-wide settings

finance.view              — view finance pages and reports
finance.manage            — create and manage financial transactions
finance.approve           — Finance clearing step (Accountant Clears)
finance.correct_completed — correct completed financial records

requests.view             — view all requests (approval/admin)
requests.create           — submit new requests
requests.approve          — approve/reject requests in workflow
requests.manage           — full admin access to all requests
requests.retire           — retire requests

work.view                 — view work management pages (HR side)
work.manage               — manage work items, KPIs, and goals
work.approve              — approve daily logs

users.view                — view user list (read-only)
users.manage              — create, edit, and deactivate users

admin.view                — access the /admin section at all
roles.manage              — manage roles and assign permissions
groups.view               — view groups and teams
groups.manage             — create and manage groups
projects.view             — view projects
projects.manage           — create and manage projects
settings.manage           — workspace-level settings
audit.view                — view audit logs
audit.manage              — manage audit settings

workflow.view             — view workflow configurations
workflow.manage           — manage workflow configurations

send_notifications        — send notifications to users
```

---

### Task 1: Seed canonical permissions

**Files:**
- Create: `api/prisma/seed.ts`
- Modify: `api/package.json`

- [ ] **Step 1: Create seed file**

```typescript
// api/prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PERMISSIONS = [
  { name: 'attendance.clock',      module: 'attendance', description: 'Clock in and out' },
  { name: 'attendance.view_self',  module: 'attendance', description: 'View own attendance records' },
  { name: 'attendance.view_team',  module: 'attendance', description: 'View team attendance records' },
  { name: 'attendance.manage',     module: 'attendance', description: 'Manage attendance records and settings' },
  { name: 'attendance.approve',    module: 'attendance', description: 'Approve attendance corrections' },
  { name: 'attendance.correct',    module: 'attendance', description: 'Submit attendance corrections' },

  { name: 'leave.view',    module: 'leave', description: 'View leave requests in HR admin' },
  { name: 'leave.manage',  module: 'leave', description: 'Manage leave types, balances, and policy' },
  { name: 'leave.approve', module: 'leave', description: 'Approve and reject leave requests' },

  { name: 'hr.view',   module: 'hr', description: 'Access the HR admin section' },
  { name: 'hr.manage', module: 'hr', description: 'Manage HR-wide settings' },

  { name: 'finance.view',              module: 'finance', description: 'View finance pages and reports' },
  { name: 'finance.manage',            module: 'finance', description: 'Create and manage financial transactions' },
  { name: 'finance.approve',           module: 'finance', description: 'Finance clearing step (Accountant Clears)' },
  { name: 'finance.correct_completed', module: 'finance', description: 'Correct completed financial records' },

  { name: 'requests.view',    module: 'requests', description: 'View all requests' },
  { name: 'requests.create',  module: 'requests', description: 'Submit new requests' },
  { name: 'requests.approve', module: 'requests', description: 'Approve requests in workflow' },
  { name: 'requests.manage',  module: 'requests', description: 'Full admin access to all requests' },
  { name: 'requests.retire',  module: 'requests', description: 'Retire requests' },

  { name: 'work.view',    module: 'work', description: 'View work management pages' },
  { name: 'work.manage',  module: 'work', description: 'Manage work items, KPIs, and goals' },
  { name: 'work.approve', module: 'work', description: 'Approve daily logs' },

  { name: 'users.view',   module: 'users', description: 'View user list (read-only)' },
  { name: 'users.manage', module: 'users', description: 'Create, edit, and deactivate users' },

  { name: 'admin.view',      module: 'admin',    description: 'Access the admin section' },
  { name: 'roles.manage',    module: 'roles',    description: 'Manage roles and assign permissions' },
  { name: 'groups.view',     module: 'groups',   description: 'View groups and teams' },
  { name: 'groups.manage',   module: 'groups',   description: 'Create and manage groups' },
  { name: 'projects.view',   module: 'projects', description: 'View projects' },
  { name: 'projects.manage', module: 'projects', description: 'Create and manage projects' },
  { name: 'settings.manage', module: 'settings', description: 'Workspace-level settings' },
  { name: 'audit.view',      module: 'audit',    description: 'View audit logs' },
  { name: 'audit.manage',    module: 'audit',    description: 'Manage audit settings' },

  { name: 'workflow.view',   module: 'workflow',       description: 'View workflow configurations' },
  { name: 'workflow.manage', module: 'workflow',       description: 'Manage workflow configurations' },
  { name: 'send_notifications', module: 'notifications', description: 'Send notifications to users' },
];

async function main() {
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: { description: perm.description, module: perm.module },
      create: { name: perm.name, description: perm.description, module: perm.module },
    });
  }
  console.log(`Seeded ${PERMISSIONS.length} permissions.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Add seed command to `api/package.json`**

In the `"scripts"` section, add:
```json
"db:seed": "ts-node prisma/seed.ts"
```

Also add a `"prisma"` section at the top level so `prisma db seed` works:
```json
"prisma": {
  "seed": "ts-node prisma/seed.ts"
}
```

- [ ] **Step 3: Run the seed**

```bash
cd api && npm run db:seed
```

Expected output:
```
Seeded 38 permissions.
```

- [ ] **Step 4: Verify in DB**

```bash
cd api && npx prisma studio
```

Open `Permission` table — confirm 38 rows, including `hr.view`, `admin.view`, `finance.approve`, `leave.view`, `leave.manage`, `leave.approve`.

- [ ] **Step 5: Commit**

```bash
git add api/prisma/seed.ts api/package.json
git commit -m "feat(rbac): seed canonical permissions"
```

---

### Task 2: Remove createPermission / deletePermission endpoints

**Files:**
- Modify: `api/src/modules/rbac/rbac.controller.ts`

- [ ] **Step 1: Read the file**

```bash
cat api/src/modules/rbac/rbac.controller.ts
```

Note the line numbers for `createPermission` and `deletePermission` handlers.

- [ ] **Step 2: Remove both handlers**

Delete the `@Post('permissions')` handler (`createPermission`) and the `@Delete('permissions/:id')` handler (`deletePermission`) from the controller. Also remove their `CreatePermissionDto` import if it becomes unused.

The remaining permission endpoints to keep:
- `GET /permissions` — `listPermissions` (read-only list)
- `GET /permissions/:id/impact` — `getPermissionDeleteImpact` (can keep for info, remove if unused)
- `POST /roles` — `createRole`
- `PUT /roles/:id` — `updateRole`
- `DELETE /roles/:id` — `deleteRole`
- `POST /roles/:id/permissions` — `setRolePermissions`
- `GET /roles`, `GET /roles/:id` — list/get roles

- [ ] **Step 3: Type-check**

```bash
cd api && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add api/src/modules/rbac/rbac.controller.ts
git commit -m "feat(rbac): remove create/delete permission endpoints — permissions are system-seeded"
```

---

### Task 3: `usePermission` hook

**Files:**
- Create: `apps/pwa/src/shared/hooks/usePermission.ts`

- [ ] **Step 1: Create the hook**

```typescript
// apps/pwa/src/shared/hooks/usePermission.ts
import { hasAnyPermission } from "@stanforte/shared";
import { useAuth } from "@/shared/context/AuthProvider";

/**
 * Returns true if the current user holds at least one of `required` permissions
 * (when any=true, the default) or all of them (when any=false).
 * Returns true when required is empty — no restriction.
 */
export function usePermission(required: string[], any = true): boolean {
  const { user } = useAuth();
  if (!required.length) return true;
  if (any) return hasAnyPermission(user, required);
  return required.every((p) => hasAnyPermission(user, [p]));
}
```

- [ ] **Step 2: Export from shared index**

In `apps/pwa/src/shared/index.ts`, add:
```typescript
export { usePermission } from "./hooks/usePermission";
```

- [ ] **Step 3: Type-check**

```bash
cd apps/pwa && npx tsc --noEmit 2>&1 | grep usePermission
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/pwa/src/shared/hooks/usePermission.ts apps/pwa/src/shared/index.ts
git commit -m "feat(pwa): add usePermission hook"
```

---

### Task 4: `requiredPermissions` prop on UI components

**Files:**
- Modify: `apps/pwa/src/shared/components/ui/Button.tsx`
- Modify: `apps/pwa/src/shared/components/ui/StatCard.tsx`
- Modify: `apps/pwa/src/shared/components/layout/SectionCard.tsx`

Components return `null` when the user lacks the required permissions. Components without the prop behave exactly as before.

- [ ] **Step 1: Update Button.tsx**

Replace the entire file:

```typescript
// apps/pwa/src/shared/components/ui/Button.tsx
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { hasAnyPermission } from "@stanforte/shared";
import { useAuth } from "@/shared/context/AuthProvider";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  requiredPermissions?: string[];
};

const base = "inline-flex items-center justify-center rounded-full font-semibold transition focus:outline-none focus:ring-4 focus:ring-brand-900/10 disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary:   "bg-brand-900 text-white shadow-soft hover:bg-brand-700 hover:shadow-card",
  secondary: "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
  ghost:     "bg-transparent text-slate-700 hover:bg-slate-100",
  danger:    "bg-danger text-white hover:opacity-90",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-3 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  requiredPermissions,
  ...props
}: ButtonProps) {
  const { user } = useAuth();
  if (requiredPermissions?.length && !hasAnyPermission(user, requiredPermissions)) {
    return null;
  }
  return (
    <button
      className={[base, variants[variant], sizes[size], className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 2: Update StatCard.tsx**

Replace the entire file:

```typescript
// apps/pwa/src/shared/components/ui/StatCard.tsx
import { Chip } from "./Chip";
import { Icon } from "./Icon";
import { hasAnyPermission } from "@stanforte/shared";
import { useAuth } from "@/shared/context/AuthProvider";

type StatCardProps = {
  label: string;
  value: string;
  delta?: string;
  tone?: "neutral" | "success" | "warning" | "pending" | "danger";
  hint?: string;
  icon?: string;
  requiredPermissions?: string[];
};

export function StatCard({
  label,
  value,
  delta,
  tone = "neutral",
  hint,
  icon,
  requiredPermissions,
}: StatCardProps) {
  const { user } = useAuth();
  if (requiredPermissions?.length && !hasAnyPermission(user, requiredPermissions)) {
    return null;
  }
  return (
    <article className="stat-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {icon ? <Icon name={icon} className="text-slate-400" /> : null}
          {delta ? <Chip variant={tone}>{delta}</Chip> : null}
        </div>
      </div>
      {hint ? <p className="field-help mt-4">{hint}</p> : null}
    </article>
  );
}
```

- [ ] **Step 3: Update SectionCard.tsx**

Replace the entire file:

```typescript
// apps/pwa/src/shared/components/layout/SectionCard.tsx
import type { ReactNode } from "react";
import { hasAnyPermission } from "@stanforte/shared";
import { useAuth } from "@/shared/context/AuthProvider";

type SectionCardProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
  requiredPermissions?: string[];
};

export function SectionCard({
  title,
  description,
  action,
  className,
  children,
  requiredPermissions,
}: SectionCardProps) {
  const { user } = useAuth();
  if (requiredPermissions?.length && !hasAnyPermission(user, requiredPermissions)) {
    return null;
  }
  return (
    <section className={["section-card p-5 sm:p-6 mt-6", className].filter(Boolean).join(" ")}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          {title ? (
            <>
              <h2 className="font-headline text-lg font-semibold tracking-tight text-slate-950">
                {title}
              </h2>
              {description ? (
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  {description}
                </p>
              ) : null}
            </>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
```

- [ ] **Step 4: Type-check**

```bash
cd apps/pwa && npx tsc --noEmit 2>&1 | grep -E "Button|StatCard|SectionCard"
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/shared/components/ui/Button.tsx \
        apps/pwa/src/shared/components/ui/StatCard.tsx \
        apps/pwa/src/shared/components/layout/SectionCard.tsx
git commit -m "feat(pwa): add requiredPermissions prop to Button, StatCard, SectionCard"
```

---

### Task 5: Wire HR routes with PermissionRoute in App.tsx

**Files:**
- Modify: `apps/pwa/src/App.tsx`

Replace the HR `<ModuleRoute moduleKey="hr">` block with permission-level sub-routes. `hr.view` is the entry gate; each page group has its own permissions.

- [ ] **Step 1: Add `PermissionRoute` to the import from `AccessRoute`**

At the top of `App.tsx`, confirm `PermissionRoute` is imported:
```typescript
import {
  ApprovalRoute,
  ModuleRoute,
  PermissionRoute,
} from "@/shared/components/auth/AccessRoute";
```

- [ ] **Step 2: Replace the HR route block**

Find and replace the existing HR block:

```tsx
{/* BEFORE */}
<Route element={<ModuleRoute moduleKey="hr" />}>
  <Route path="/hr" element={<HrDashboardPage />} />
  <Route path="/hr/employees" element={<HrEmployeesPage />} />
  <Route path="/hr/employees/new" element={<HrEmployeeCreatePage />} />
  <Route path="/hr/employees/:id" element={<HrEmployeeDetailPage />} />
  <Route path="/hr/employees/:id/edit" element={<HrEmployeeEditPage />} />
  <Route path="/hr/attendance" element={<HrAttendancePage />} />
  <Route path="/hr/leave" element={<HrLeavePage />} />
  <Route path="/hr/settings" element={<HrSettingsPage />} />
</Route>
```

```tsx
{/* AFTER */}
<Route element={<ModuleRoute moduleKey="hr" />}>
  {/* hr.view is the base gate — without it the entire /hr section is inaccessible */}
  <Route element={<PermissionRoute requiredPermissions={["hr.view"]} any />}>
    <Route path="/hr" element={<HrDashboardPage />} />

    <Route element={<PermissionRoute requiredPermissions={["users.manage", "hr.manage"]} any />}>
      <Route path="/hr/employees" element={<HrEmployeesPage />} />
      <Route path="/hr/employees/new" element={<HrEmployeeCreatePage />} />
      <Route path="/hr/employees/:id" element={<HrEmployeeDetailPage />} />
      <Route path="/hr/employees/:id/edit" element={<HrEmployeeEditPage />} />
    </Route>

    <Route element={<PermissionRoute requiredPermissions={["attendance.view", "attendance.manage", "attendance.approve"]} any />}>
      <Route path="/hr/attendance" element={<HrAttendancePage />} />
    </Route>

    <Route element={<PermissionRoute requiredPermissions={["leave.view", "leave.manage", "leave.approve"]} any />}>
      <Route path="/hr/leave" element={<HrLeavePage />} />
    </Route>

    <Route element={<PermissionRoute requiredPermissions={["hr.manage", "settings.manage"]} any />}>
      <Route path="/hr/settings" element={<HrSettingsPage />} />
    </Route>
  </Route>
</Route>
```

- [ ] **Step 3: Type-check**

```bash
cd apps/pwa && npx tsc --noEmit 2>&1 | grep "App.tsx"
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/pwa/src/App.tsx
git commit -m "feat(pwa): gate HR routes by permission (hr.view + sub-permissions)"
```

---

### Task 6: Wire Admin routes with PermissionRoute in App.tsx

**Files:**
- Modify: `apps/pwa/src/App.tsx`

- [ ] **Step 1: Replace the Admin route block**

Find and replace the existing admin block:

```tsx
{/* BEFORE */}
<Route element={<ModuleRoute moduleKey="admin" />}>
  <Route path="/admin/users" element={<AdminUsersPage />} />
  <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
  <Route path="/admin/roles" element={<AdminRolesPage />} />
  <Route path="/admin/groups" element={<AdminGroupsPage />} />
  <Route path="/admin/projects" element={<AdminProjectsPage />} />
  <Route path="/admin/files" element={<AdminFilesPage />} />
  <Route path="/admin/settings" element={<AdminSettingsPage />} />
</Route>
```

```tsx
{/* AFTER */}
<Route element={<ModuleRoute moduleKey="admin" />}>
  {/* admin.view is the base gate */}
  <Route element={<PermissionRoute requiredPermissions={["admin.view"]} any />}>
    <Route element={<PermissionRoute requiredPermissions={["users.view", "users.manage"]} any />}>
      <Route path="/admin/users" element={<AdminUsersPage />} />
      <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
    </Route>

    <Route element={<PermissionRoute requiredPermissions={["roles.manage"]} any />}>
      <Route path="/admin/roles" element={<AdminRolesPage />} />
    </Route>

    <Route element={<PermissionRoute requiredPermissions={["groups.view", "groups.manage"]} any />}>
      <Route path="/admin/groups" element={<AdminGroupsPage />} />
    </Route>

    <Route element={<PermissionRoute requiredPermissions={["projects.view", "projects.manage"]} any />}>
      <Route path="/admin/projects" element={<AdminProjectsPage />} />
    </Route>

    <Route element={<PermissionRoute requiredPermissions={["settings.manage"]} any />}>
      <Route path="/admin/settings" element={<AdminSettingsPage />} />
    </Route>

    {/* Files: visible to anyone in the admin section */}
    <Route path="/admin/files" element={<AdminFilesPage />} />
  </Route>
</Route>
```

- [ ] **Step 2: Type-check**

```bash
cd apps/pwa && npx tsc --noEmit 2>&1 | grep "App.tsx"
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/App.tsx
git commit -m "feat(pwa): gate Admin routes by permission (admin.view + sub-permissions)"
```

---

### Task 7: Wire Finance sub-permission routes in App.tsx

**Files:**
- Modify: `apps/pwa/src/App.tsx`

Finance already has `<ModuleRoute moduleKey="finance">`. Add a sub-gate so `finance.settings` requires `finance.manage` and all finance pages require at least `finance.view`.

- [ ] **Step 1: Wrap finance routes with a base permission gate**

Inside the existing `<Route element={<ModuleRoute moduleKey="finance" />}>` block, add a wrapping `PermissionRoute` and a specific one for settings:

```tsx
<Route element={<ModuleRoute moduleKey="finance" />}>
  <Route element={<PermissionRoute requiredPermissions={["finance.view", "finance.manage", "finance.approve"]} any />}>
    <Route path="/finance" element={<FinanceDashboardPage />} />
    <Route path="/finance/requests" element={<FinanceRequestsPage />} />
    <Route path="/finance/requests/details" element={<FinanceRequestDetailsPage />} />
    <Route path="/finance/payment-vouchers" element={<FinancePaymentVouchersPage />} />
    <Route path="/finance/ledger" element={<FinanceLedgerPage />} />
    <Route path="/finance/chart-accounts" element={<FinanceChartAccountsPage />} />
    <Route path="/finance/accounts" element={<FinanceAccountsPage />} />
    <Route path="/finance/accounts/:id" element={<FinanceAccountDetailPage />} />
    <Route path="/finance/manual-entry" element={<FinanceManualEntryPage />} />
    <Route path="/finance/items" element={<FinanceItemsPage />} />
    <Route path="/finance/expenses" element={<FinanceExpensesPage />} />
    <Route path="/finance/income" element={<FinanceIncomePage />} />
    <Route path="/finance/bills" element={<FinanceBillsPage />} />
    <Route path="/finance/sales-invoices" element={<FinanceSalesInvoicesPage />} />
    <Route path="/finance/budgets" element={<FinanceBudgetsPage />} />
    <Route path="/finance/receivables" element={<FinanceReceivablesPage />} />
    <Route path="/finance/receivables/:id" element={<FinanceReceivablesPage />} />
    <Route path="/finance/payables" element={<FinancePayablesPage />} />
    <Route path="/finance/assets" element={<FinanceAssetsPage />} />
    <Route path="/finance/assets/new" element={<FinanceAssetEditorPage />} />
    <Route path="/finance/assets/:id" element={<FinanceAssetEditorPage />} />
    <Route path="/finance/assets/disposals" element={<FinanceAssetDisposalsPage />} />
    <Route path="/finance/reports" element={<FinanceReportsPage />} />
    <Route path="/finance/reports/:reportKey" element={<FinanceReportDetailPage />} />
    <Route path="/finance/deduction-types" element={<FinanceDeductionTypesPage />} />
    <Route path="/finance/customers" element={<FinanceCustomersPage />} />
    <Route path="/finance/vendors" element={<FinanceVendorsPage />} />
    <Route path="/finance/contacts" element={<FinanceContactsPage />} />

    {/* Settings require manage permission */}
    <Route element={<PermissionRoute requiredPermissions={["finance.manage"]} any />}>
      <Route path="/finance/settings" element={<FinanceSettingsPage />} />
    </Route>
  </Route>
</Route>
```

- [ ] **Step 2: Type-check**

```bash
cd apps/pwa && npx tsc --noEmit 2>&1 | grep "App.tsx"
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/App.tsx
git commit -m "feat(pwa): gate Finance routes by permission (finance.view/manage/approve)"
```

---

### Task 8: Add permission fields to navigation items

**Files:**
- Modify: `apps/pwa/src/shared/navigation.ts`

`AppShell` already calls `hasAnyPermission(authUser, child.permissions)` to filter nav items. Adding `permissions` to HR and Admin items will hide inaccessible pages from the sidebar automatically.

- [ ] **Step 1: Update HR nav items**

Find the HR nav items block (around the `moduleKey: "hr"` section) and add `permissions` to each item:

```typescript
// HR nav items — add permissions to each
{ key: "hr-dashboard",   label: "Overview",    icon: "dashboard",        path: "/hr",             permissions: ["hr.view"] },
{ key: "hr-employees",   label: "Employees",   icon: "group",            path: "/hr/employees",   permissions: ["users.manage", "hr.manage"] },
{ key: "hr-attendance",  label: "Attendance",  icon: "pending_actions",  path: "/hr/attendance",  permissions: ["attendance.view", "attendance.manage", "attendance.approve"] },
{ key: "hr-leave",       label: "Leave",       icon: "event_available",  path: "/hr/leave",       permissions: ["leave.view", "leave.manage", "leave.approve"] },
{ key: "hr-settings",    label: "Settings",    icon: "settings",         path: "/hr/settings",    permissions: ["hr.manage", "settings.manage"] },
```

- [ ] **Step 2: Update Admin nav items**

Find the Admin nav items block (around the `moduleKey: "admin"` section) and add `permissions`:

```typescript
// Admin nav items — add permissions to each
{ key: "admin-users",     label: "Users",           icon: "people",                path: "/admin/users",     permissions: ["users.view", "users.manage"] },
{ key: "admin-roles",     label: "Roles",           icon: "admin_panel_settings",  path: "/admin/roles",     permissions: ["roles.manage"] },
{ key: "admin-groups",    label: "Groups",          icon: "groups",                path: "/admin/groups",    permissions: ["groups.view", "groups.manage"] },
{ key: "admin-projects",  label: "Projects",        icon: "assignment",            path: "/admin/projects",  permissions: ["projects.view", "projects.manage"] },
{ key: "admin-files",     label: "Files",           icon: "folder",                path: "/admin/files",     permissions: ["admin.view"] },
{ key: "admin-settings",  label: "System Settings", icon: "settings",              path: "/admin/settings",  permissions: ["settings.manage"] },
```

- [ ] **Step 3: Type-check**

```bash
cd apps/pwa && npx tsc --noEmit 2>&1 | grep "navigation.ts"
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/pwa/src/shared/navigation.ts
git commit -m "feat(pwa): add permission fields to HR and Admin navigation items"
```

---

### Task 9: Clean up AdminPermissionSlideOver — read-only

**Files:**
- Modify: `apps/pwa/src/pages/admin/roles/AdminPermissionSlideOver.tsx`
- Modify: `apps/pwa/src/pages/admin/roles/AdminRolesPage.tsx`

Permissions are now system-seeded. The slide-over should display a permission's details (name, module, description, assigned roles) but not allow creating or deleting.

- [ ] **Step 1: Read both files**

```bash
cat apps/pwa/src/pages/admin/roles/AdminPermissionSlideOver.tsx
cat apps/pwa/src/pages/admin/roles/AdminRolesPage.tsx
```

- [ ] **Step 2: Rewrite AdminPermissionSlideOver to read-only**

Replace the file content. Remove `createPermission`, `deletePermission` imports and all related state/handlers. The slide-over now only displays the permission detail:

```tsx
// apps/pwa/src/pages/admin/roles/AdminPermissionSlideOver.tsx
import { SlideOver, SlideOverHeader, SlideOverContent } from "@/shared";
import type { RolePermission } from "./admin-roles-types"; // adjust import to match existing type

type Props = {
  permission: RolePermission;
  onClose: () => void;
};

export default function AdminPermissionSlideOver({ permission, onClose }: Props) {
  return (
    <SlideOver onClose={onClose}>
      <SlideOverHeader title={permission.name} subtitle={permission.module} onClose={onClose} />
      <SlideOverContent>
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="font-medium text-slate-500">Name</dt>
            <dd className="mt-1 font-mono text-slate-900">{permission.name}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Module</dt>
            <dd className="mt-1 text-slate-900 capitalize">{permission.module}</dd>
          </div>
          {permission.description ? (
            <div>
              <dt className="font-medium text-slate-500">Description</dt>
              <dd className="mt-1 text-slate-900">{permission.description}</dd>
            </div>
          ) : null}
        </dl>
        <p className="mt-6 text-xs text-slate-400">
          Permissions are system-defined. Assign them to roles from the Roles tab.
        </p>
      </SlideOverContent>
    </SlideOver>
  );
}
```

Check the existing file to confirm the correct import paths for `SlideOver`, `SlideOverHeader`, `SlideOverContent`, and the `RolePermission` type — use whatever paths are already in the file.

- [ ] **Step 3: Update AdminRolesPage — remove create permission button and state**

In `AdminRolesPage.tsx`:
- Remove `editingPermission` state (`useState<RolePermission | null | boolean>(false)`)
- Remove the `setEditingPermission(false)` second `AdminPermissionSlideOver` (the "new permission" one at line ~348)
- Remove the `"+ New Permission"` button that calls `setEditingPermission(null)`
- Keep the `AdminPermissionSlideOver` that opens when a permission row is clicked (read-only view)
- Update the `onClick` on permission rows to pass the permission object and just open the slide-over for viewing

The remaining pattern should be: clicking a permission row opens the read-only slide-over. The `onSaved` prop on the slide-over should be removed since there's nothing to save.

- [ ] **Step 4: Type-check**

```bash
cd apps/pwa && npx tsc --noEmit 2>&1 | grep -E "AdminPermission|AdminRoles"
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/pages/admin/roles/AdminPermissionSlideOver.tsx \
        apps/pwa/src/pages/admin/roles/AdminRolesPage.tsx
git commit -m "feat(pwa): make permissions read-only in admin UI — system-seeded only"
```

---

### Task 10: HR page action gating

**Files:**
- Modify: `apps/pwa/src/pages/hr/attendance/HrAttendancePage.tsx`

Add `requiredPermissions` to action buttons and approve-only sections. An HR Officer with `attendance.view` can see the page and the table but not the Approve/Review buttons.

- [ ] **Step 1: Gate the "Review" button in the Correction Requests section**

In `HrAttendancePage.tsx`, find the Review button (inside the Correction Requests table). Add `requiredPermissions`:

```tsx
{/* BEFORE */}
{c.status === "pending" ? (
  <Button size="sm" variant="ghost" onClick={() => setReviewingItem(c)}>
    Review
  </Button>
) : null}

{/* AFTER */}
{c.status === "pending" ? (
  <Button
    size="sm"
    variant="ghost"
    requiredPermissions={["attendance.approve"]}
    onClick={() => setReviewingItem(c)}
  >
    Review
  </Button>
) : null}
```

- [ ] **Step 2: Gate the "Detail" button (optional — all viewers with attendance.view can open details)**

The Detail button in the Staff Attendance table opens a read-only drill-down. This does NOT need a permission gate — anyone with `attendance.view` can see it. Leave it ungated.

- [ ] **Step 3: Type-check**

```bash
cd apps/pwa && npx tsc --noEmit 2>&1 | grep "HrAttendancePage"
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/pwa/src/pages/hr/attendance/HrAttendancePage.tsx
git commit -m "feat(pwa): gate attendance correction Review button by attendance.approve"
```

---

## Self-Review

**Spec coverage check:**

| Requirement | Covered by |
|---|---|
| Permissions system-seeded, not user-created | Task 1 (seed) + Task 2 (remove endpoints) + Task 9 (admin UI) |
| `hr.view` base gate for HR section | Task 5 |
| Individual HR pages by sub-permission | Task 5 |
| `admin.view` base gate for Admin section | Task 6 |
| Individual Admin pages by sub-permission | Task 6 |
| Finance sub-permission gates | Task 7 |
| `finance.approve` permission added | Task 1 (seeded) |
| `leave.view/manage/approve` added | Task 1 (seeded) |
| `admin.view`, `users.view`, `hr.view` added | Task 1 (seeded) |
| `requiredPermissions` on Button | Task 4 |
| `requiredPermissions` on StatCard | Task 4 |
| `requiredPermissions` on SectionCard | Task 4 |
| Nav items hide inaccessible pages | Task 8 |
| Admin permission UI read-only | Task 9 |
| HR action buttons gated | Task 10 |

**Gaps not covered (future tasks):**
- `HrLeavePage` action gating (`leave.approve` on Approve/Reject buttons) — follow same pattern as Task 10
- Finance action gating (Disburse/Complete buttons — `finance.manage`) — follow Task 4 pattern: add `requiredPermissions={["finance.manage"]}` to those buttons
- Dashboard widgets — add `requiredPermissions` to `StatCard` instances on `HrDashboardPage` once the page is built
- Backend: `getActions` endpoint still returns post-approval actions to all authenticated users (separate backend hardening task)
