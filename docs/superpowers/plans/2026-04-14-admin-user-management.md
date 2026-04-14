# Admin User Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Admin Users section — a paginated, searchable user list with a create-user slide-over (email, name, type, roles, org, send invite), a user detail page for editing roles/status/resending invites, and navigation wiring. Admin creates the system account; HR completes the employee profile separately.

**Architecture:** New `apps/pwa/src/modules/admin/` directory containing `admin-users-api.ts`, `AdminUsersPage.tsx`, `AdminUserCreateSlideOver.tsx`, and `AdminUserDetailPage.tsx`. Routes at `/admin/users` and `/admin/users/:id` added inside a `ModuleRoute moduleKey="admin"` guard. Navigation updated in `shared/navigation.ts`.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, React Router v6, `useCachedQuery` (returns `{ data, loading, error }` — no refetch), `httpRequest` from `@/shared/lib/core`, shared UI from `@/shared`.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `apps/pwa/src/modules/admin/admin-users-api.ts` | All admin user API types + functions |
| Create | `apps/pwa/src/modules/admin/AdminUsersPage.tsx` | User list + stat cards + filter bar |
| Create | `apps/pwa/src/modules/admin/AdminUserCreateSlideOver.tsx` | Create user slide-over panel |
| Create | `apps/pwa/src/modules/admin/AdminUserDetailPage.tsx` | User detail — edit, roles, invite, status |
| Modify | `apps/pwa/src/shared/navigation.ts` | Add Administration section to nav |
| Modify | `apps/pwa/src/App.tsx` | Add `/admin/users` and `/admin/users/:id` routes |

---

## Codebase Context (read before starting)

**Page shell pattern — follow `HrDashboardPage.tsx`:**
```tsx
import { AppShell } from "@/shared/components/layout/AppShell";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import { useCachedQuery } from "@/shared/lib/core";
import { useAuth } from "@/shared/context/AuthProvider";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";

<AppShell
  navigation={buildAppNavigation()}
  activeLabel="Users"
  user={{ name: userName, role: profile?.employee_profile?.job_title || "Admin" }}
  mobileNav={buildAppMobileNav("Dashboard")}
>
  <PageHeader breadcrumbs={[{ label: "Admin", path: "/admin/users" }, { label: "Users" }]} title="Users" description="..." />
</AppShell>
```

**`useCachedQuery` — NO refetch:**
```ts
const { data, loading, error } = useCachedQuery("key", () => fn(), { ttlMs: 1000 * 30, storage: "memory" });
```

**`httpRequest` for mutations (not useCachedQuery):**
```ts
import { httpRequest } from "@/shared/lib/core";
await httpRequest<ReturnType>("/path", { method: "POST", body: payload });
```

**Shared components from `@/shared`:**
- `SelectField` — use `<option>` children, NOT an `options` prop
- `TableHeaderCell` — must have children: `<TableHeaderCell>{""}</TableHeaderCell>` for empty cells
- `EmptyState` — only props: `title`, `description`, `actionLabel`
- `Button` variants: `primary` | `secondary` | `ghost` | `danger`
- `useToast` → `const { showToast } = useToast()` → `showToast({ tone, title, message })`
- `Chip` variants: `success` | `warning` | `danger` | `neutral` | `pending`

**Backend API routes (from `admin.controller.ts` and old PWA `users.ts`):**
```
GET  /admin/users                — list users (params: page, per_page, search, status, type)
GET  /admin/users/:id            — get one user
POST /admin/users                — create user
POST /admin/users/:id            — update user
POST /admin/users/:id/status     — update user status { status, reason? }
GET  /users/:id/roles            — get user roles → { user, roles: [{id,slug,name,is_primary}] }
POST /users/:id/roles            — set user roles → { roles: string[] }
POST /users/:id/invite           — send/resend invite
GET  /admin/rbac/roles           — list available roles → [{ id, slug, name }]
```

**User types** (pass as `type` field): `"staff"` | `"vendor"` | `"client"` | `"board_member"`

**Role slugs** from old PWA fallback: `"staff"` | `"accountant"` | `"finance_manager"` | `"hr_manager"` | `"admin"`

**Note on employee profiles:** When admin creates a user with type `"staff"` and role `"staff"`, the backend auto-creates a draft employee profile. HR then sees it in `/hr/employees` as `draft` and can complete it. No frontend action needed for this — it is backend-handled.

**Existing App.tsx structure to follow:**
```tsx
<Route element={<ModuleRoute moduleKey="hr" />}>
  <Route path="/hr" element={<HrDashboardPage />} />
  ...
</Route>
```
Add similarly:
```tsx
<Route element={<ModuleRoute moduleKey="admin" />}>
  <Route path="/admin/users" element={<AdminUsersPage />} />
  <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
</Route>
```

**Navigation addition (in `shared/navigation.ts` `buildAppNavigation()`):**

Add after the HR block inside the `return [...]`:
```ts
{
  label: "Administration",
  icon: "manage_accounts",
  section: "Admin",
  moduleKey: "admin",
  children: [
    { key: "admin-users", label: "Users", icon: "people", path: "/admin/users" },
  ],
},
```

---

## Task 1: Admin Users API Layer

**Files:**
- Create: `apps/pwa/src/modules/admin/admin-users-api.ts`

- [ ] **Step 1: Create the file**

```ts
// apps/pwa/src/modules/admin/admin-users-api.ts
import { httpRequest } from "@/shared/lib/core";

export type AdminUser = {
  id: string;
  username: string;
  email: string;
  type: string;
  status: string;
  first_name?: string | null;
  last_name?: string | null;
  created_at?: string;
};

export type AdminUserRole = {
  id: string;
  slug: string;
  name: string;
  is_primary: boolean;
};

export type AdminUserDetail = AdminUser & {
  primary_organization_id?: string | null;
  roles?: AdminUserRole[];
};

export type AdminUsersResponse = {
  data: AdminUser[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
};

export type RoleOption = {
  id: string;
  slug: string;
  name: string;
};

export async function listAdminUsers(params?: {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  type?: string;
}): Promise<AdminUsersResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.per_page) query.set("per_page", String(params.per_page));
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);
  if (params?.type) query.set("type", params.type);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return httpRequest<AdminUsersResponse>(`/admin/users${suffix}`);
}

export async function getAdminUser(id: string): Promise<AdminUserDetail> {
  return httpRequest<AdminUserDetail>(`/admin/users/${id}`);
}

export async function createAdminUser(payload: {
  email: string;
  first_name?: string;
  last_name?: string;
  type?: string;
  status?: string;
  primary_organization_id?: string;
}): Promise<AdminUser> {
  return httpRequest<AdminUser>("/admin/users", {
    method: "POST",
    body: payload,
  });
}

export async function updateAdminUser(
  id: string,
  payload: {
    email?: string;
    first_name?: string;
    last_name?: string;
    type?: string;
    primary_organization_id?: string;
  },
): Promise<AdminUser> {
  return httpRequest<AdminUser>(`/admin/users/${id}`, {
    method: "POST",
    body: payload,
  });
}

export async function updateAdminUserStatus(
  id: string,
  payload: { status: string; reason?: string },
): Promise<AdminUser> {
  return httpRequest<AdminUser>(`/admin/users/${id}/status`, {
    method: "POST",
    body: payload,
  });
}

export async function getAdminUserRoles(id: string): Promise<{
  user: { id: string; email: string };
  roles: AdminUserRole[];
}> {
  return httpRequest(`/users/${id}/roles`);
}

export async function setAdminUserRoles(
  id: string,
  roles: string[],
): Promise<void> {
  return httpRequest<void>(`/users/${id}/roles`, {
    method: "POST",
    body: { roles },
  });
}

export async function sendUserInvite(id: string): Promise<{
  success: boolean;
  expires_at: string;
}> {
  return httpRequest(`/users/${id}/invite`, { method: "POST", body: {} });
}

export async function listRoleOptions(): Promise<RoleOption[]> {
  try {
    const data = await httpRequest<{ data: RoleOption[] }>("/admin/rbac/roles");
    return Array.isArray(data) ? data : (data as any).data ?? [];
  } catch {
    return [
      { id: "staff", slug: "staff", name: "Staff" },
      { id: "hr_manager", slug: "hr_manager", name: "HR Manager" },
      { id: "accountant", slug: "accountant", name: "Accountant" },
      { id: "finance_manager", slug: "finance_manager", name: "Finance Manager" },
      { id: "admin", slug: "admin", name: "Admin" },
    ];
  }
}
```

- [ ] **Step 2: Verify TS**

```bash
cd apps/pwa && npx tsc --noEmit 2>&1 | grep "admin-users-api"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/modules/admin/admin-users-api.ts
git commit -m "feat(admin): add admin users API layer"
```

---

## Task 2: Create User Slide-Over

**Files:**
- Create: `apps/pwa/src/modules/admin/AdminUserCreateSlideOver.tsx`

- [ ] **Step 1: Create the component**

```tsx
// apps/pwa/src/modules/admin/AdminUserCreateSlideOver.tsx
import { useEffect, useState } from "react";
import {
  Button,
  SectionCard,
  SelectField,
  TextField,
  useToast,
} from "@/shared";
import { listOrganizations, type OrganizationRecord } from "@/shared/api/organization-api";
import {
  createAdminUser,
  setAdminUserRoles,
  sendUserInvite,
  listRoleOptions,
  type RoleOption,
} from "./admin-users-api";

type Props = {
  onClose: () => void;
  onCreated: () => void;
};

export default function AdminUserCreateSlideOver({ onClose, onCreated }: Props) {
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [type, setType] = useState("staff");
  const [selectedRole, setSelectedRole] = useState("staff");
  const [orgId, setOrgId] = useState("");
  const [sendInvite, setSendInvite] = useState(true);
  const [saving, setSaving] = useState(false);

  const [orgs, setOrgs] = useState<OrganizationRecord[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);

  useEffect(() => {
    listOrganizations({ is_active: true }).then(setOrgs).catch(() => setOrgs([]));
    listRoleOptions().then(setRoles).catch(() => setRoles([]));
  }, []);

  async function handleSubmit() {
    if (!email.trim()) {
      showToast({ tone: "warning", title: "Email required", message: "Please enter a valid email address." });
      return;
    }
    try {
      setSaving(true);
      const user = await createAdminUser({
        email: email.trim(),
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
        type,
        status: "pending",
        primary_organization_id: orgId || undefined,
      });
      if (selectedRole) {
        await setAdminUserRoles(user.id, [selectedRole]);
      }
      if (sendInvite) {
        await sendUserInvite(user.id);
      }
      showToast({
        tone: "success",
        title: "User created",
        message: sendInvite
          ? `Invite sent to ${user.email}.`
          : `${user.email} created. Send invite when ready.`,
      });
      onCreated();
    } catch (err) {
      showToast({
        tone: "danger",
        title: "Create failed",
        message: err instanceof Error ? err.message : "Unable to create user.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40">
      <div className="flex h-full w-full max-w-lg flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              New User
            </p>
            <h2 className="text-xl font-semibold text-slate-950">Add User</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <SectionCard title="Identity">
            <div className="grid gap-4">
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <TextField
                  label="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Access">
            <div className="grid gap-4">
              <SelectField
                label="User Type"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="staff">Staff / Employee</option>
                <option value="vendor">Vendor</option>
                <option value="client">Client</option>
                <option value="board_member">Board Member</option>
              </SelectField>

              <SelectField
                label="Role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="">No role</option>
                {roles.map((r) => (
                  <option key={r.slug} value={r.slug}>
                    {r.name}
                  </option>
                ))}
              </SelectField>

              <SelectField
                label="Primary Organisation"
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
              >
                <option value="">Select organisation…</option>
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} {o.code ? `(${o.code})` : ""}
                  </option>
                ))}
              </SelectField>
            </div>
          </SectionCard>

          <SectionCard title="Invite">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={sendInvite}
                onChange={(e) => setSendInvite(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              <span className="text-sm text-slate-700">
                Send invitation email immediately
              </span>
            </label>
            <p className="mt-2 text-xs text-slate-500">
              The user will receive a link to set their password. If unchecked, you
              can send the invite later from their profile.
            </p>
            {type === "staff" ? (
              <p className="mt-3 rounded-2xl bg-brand-50 px-4 py-3 text-xs text-brand-900">
                A draft employee profile will be created in HR for HR to complete.
              </p>
            ) : null}
          </SectionCard>
        </div>

        <div className="border-t border-slate-200 px-6 py-4">
          <div className="flex gap-3">
            <Button onClick={() => void handleSubmit()} disabled={saving}>
              {saving ? "Creating…" : "Create User"}
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TS**

```bash
cd apps/pwa && npx tsc --noEmit 2>&1 | grep "AdminUserCreateSlideOver"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/modules/admin/AdminUserCreateSlideOver.tsx
git commit -m "feat(admin): add create user slide-over"
```

---

## Task 3: Admin Users List Page

**Files:**
- Create: `apps/pwa/src/modules/admin/AdminUsersPage.tsx`

- [ ] **Step 1: Create the page**

```tsx
// apps/pwa/src/modules/admin/AdminUsersPage.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  Chip,
  EmptyState,
  Icon,
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
} from "@/shared";
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import { useCachedQuery } from "@/shared/lib/core";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import { listAdminUsers, type AdminUser } from "./admin-users-api";
import AdminUserCreateSlideOver from "./AdminUserCreateSlideOver";

function formatDate(value?: string) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const statusVariant: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  active: "success",
  pending: "warning",
  suspended: "danger",
  inactive: "neutral",
};

const typeLabel: Record<string, string> = {
  staff: "Staff",
  vendor: "Vendor",
  client: "Client",
  board_member: "Board Member",
};

export default function AdminUsersPage() {
  const { user } = useAuth();

  const { data: profile } = useCachedQuery(
    "admin:profile",
    () => getWorkspaceProfile(),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [listKey, setListKey] = useState(0); // bump to refresh

  const { data, loading } = useCachedQuery(
    `admin:users:${listKey}:${search}:${typeFilter}:${statusFilter}`,
    () =>
      listAdminUsers({
        search: search || undefined,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
        per_page: 100,
      }),
    { ttlMs: 1000 * 30, storage: "memory" },
  );

  const users: AdminUser[] = data?.data ?? [];
  const total = data?.meta?.total ?? users.length;
  const active = users.filter((u) => u.status === "active").length;
  const pending = users.filter((u) => u.status === "pending").length;
  const suspended = users.filter((u) => u.status === "suspended").length;

  const userName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.email ||
    "Admin";

  return (
    <AppShell
      navigation={buildAppNavigation()}
      activeLabel="Users"
      user={{
        name: userName,
        role: profile?.employee_profile?.job_title || "Admin",
      }}
      mobileNav={buildAppMobileNav("Dashboard")}
    >
      <PageHeader
        breadcrumbs={[{ label: "Administration" }, { label: "Users" }]}
        title="Users"
        description="Manage all portal accounts — staff, vendors, clients, and board members."
        actions={
          <Button
            className="gap-2"
            onClick={() => setShowCreate(true)}
          >
            <Icon name="person_add" className="text-[18px]" />
            Add User
          </Button>
        }
      />

      <div className="grid gap-6">
        {/* Stat cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Total Users" value={String(total)} tone="neutral" icon="group" />
          <StatCard label="Active" value={String(active)} tone="success" icon="check_circle" />
          <StatCard label="Pending Invite" value={String(pending)} tone="warning" icon="mail" />
          <StatCard label="Suspended" value={String(suspended)} tone="danger" icon="block" />
        </div>

        {/* Filter bar + table */}
        <SectionCard
          title="All Users"
          description="Search or filter to find a specific user."
        >
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <TextField
              label="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <SelectField
              label="Type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All types</option>
              <option value="staff">Staff</option>
              <option value="vendor">Vendor</option>
              <option value="client">Client</option>
              <option value="board_member">Board Member</option>
            </SelectField>
            <SelectField
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </SelectField>
          </div>

          {loading ? (
            <div className="text-sm text-slate-500">Loading users...</div>
          ) : (
            <Table>
              <TableHead>
                <TableHeaderRow>
                  <TableHeaderCell>Name</TableHeaderCell>
                  <TableHeaderCell>Email</TableHeaderCell>
                  <TableHeaderCell>Type</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Created</TableHeaderCell>
                  <TableHeaderCell>{""}</TableHeaderCell>
                </TableHeaderRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <p className="font-semibold text-slate-900">
                        {[u.first_name, u.last_name].filter(Boolean).join(" ") || "-"}
                      </p>
                      <p className="text-xs text-slate-500">{u.username || ""}</p>
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{typeLabel[u.type] ?? u.type}</TableCell>
                    <TableCell>
                      <Chip variant={statusVariant[u.status] ?? "neutral"}>
                        {u.status}
                      </Chip>
                    </TableCell>
                    <TableCell>{formatDate(u.created_at)}</TableCell>
                    <TableCell>
                      <Link to={`/admin/users/${u.id}`}>
                        <Button size="sm" variant="ghost">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {!users.length ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center">
                      <EmptyState
                        title="No users found"
                        description="Try adjusting your filters or add a new user."
                      />
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          )}
        </SectionCard>
      </div>

      {showCreate ? (
        <AdminUserCreateSlideOver
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            setListKey((k) => k + 1);
          }}
        />
      ) : null}
    </AppShell>
  );
}
```

- [ ] **Step 2: Verify TS**

```bash
cd apps/pwa && npx tsc --noEmit 2>&1 | grep "AdminUsersPage"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/modules/admin/AdminUsersPage.tsx
git commit -m "feat(admin): add admin users list page"
```

---

## Task 4: User Detail Page

**Files:**
- Create: `apps/pwa/src/modules/admin/AdminUserDetailPage.tsx`

- [ ] **Step 1: Create the page**

```tsx
// apps/pwa/src/modules/admin/AdminUserDetailPage.tsx
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Button,
  Chip,
  Icon,
  PageHeader,
  SectionCard,
  SelectField,
  StatCard,
  TextField,
  useToast,
} from "@/shared";
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import { useCachedQuery } from "@/shared/lib/core";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import {
  getAdminUser,
  getAdminUserRoles,
  updateAdminUser,
  updateAdminUserStatus,
  setAdminUserRoles,
  sendUserInvite,
  listRoleOptions,
  type AdminUserRole,
  type RoleOption,
} from "./admin-users-api";

const statusVariant: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  active: "success",
  pending: "warning",
  suspended: "danger",
};

const typeLabel: Record<string, string> = {
  staff: "Staff",
  vendor: "Vendor",
  client: "Client",
  board_member: "Board Member",
};

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();

  const { data: profile } = useCachedQuery(
    "admin:profile",
    () => getWorkspaceProfile(),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const { data: adminUser, loading: userLoading } = useCachedQuery(
    `admin:users:${id ?? ""}`,
    () => getAdminUser(id!),
    { ttlMs: 1000 * 30, storage: "memory" },
  );

  const { data: rolesData, loading: rolesLoading } = useCachedQuery(
    `admin:users:${id ?? ""}:roles`,
    () => getAdminUserRoles(id!),
    { ttlMs: 1000 * 30, storage: "memory" },
  );

  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [roleSaving, setRoleSaving] = useState(false);
  const [inviteSending, setInviteSending] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);

  // Edit form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [infoSaving, setInfoSaving] = useState(false);

  useEffect(() => {
    listRoleOptions().then(setRoleOptions).catch(() => setRoleOptions([]));
  }, []);

  useEffect(() => {
    if (adminUser) {
      setFirstName(adminUser.first_name ?? "");
      setLastName(adminUser.last_name ?? "");
    }
  }, [adminUser]);

  useEffect(() => {
    const currentRoles: AdminUserRole[] = rolesData?.roles ?? [];
    const primary = currentRoles.find((r) => r.is_primary);
    if (primary) setSelectedRole(primary.slug);
  }, [rolesData]);

  const userName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.email ||
    "Admin";

  const displayName =
    [adminUser?.first_name, adminUser?.last_name].filter(Boolean).join(" ") ||
    adminUser?.email ||
    "-";

  async function handleSaveInfo() {
    try {
      setInfoSaving(true);
      await updateAdminUser(id!, {
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
      });
      showToast({ tone: "success", title: "Saved", message: "User details updated." });
    } catch (err) {
      showToast({ tone: "danger", title: "Save failed", message: err instanceof Error ? err.message : "Unable to save." });
    } finally {
      setInfoSaving(false);
    }
  }

  async function handleSaveRole() {
    try {
      setRoleSaving(true);
      await setAdminUserRoles(id!, selectedRole ? [selectedRole] : []);
      showToast({ tone: "success", title: "Role updated", message: "User role has been updated." });
    } catch (err) {
      showToast({ tone: "danger", title: "Role update failed", message: err instanceof Error ? err.message : "Unable to update role." });
    } finally {
      setRoleSaving(false);
    }
  }

  async function handleSendInvite() {
    try {
      setInviteSending(true);
      await sendUserInvite(id!);
      showToast({ tone: "success", title: "Invite sent", message: `Invitation email sent to ${adminUser?.email}.` });
    } catch (err) {
      showToast({ tone: "danger", title: "Invite failed", message: err instanceof Error ? err.message : "Unable to send invite." });
    } finally {
      setInviteSending(false);
    }
  }

  async function handleStatusChange(status: "active" | "suspended") {
    try {
      setStatusSaving(true);
      await updateAdminUserStatus(id!, { status });
      showToast({ tone: "success", title: "Status updated", message: `User is now ${status}.` });
    } catch (err) {
      showToast({ tone: "danger", title: "Status update failed", message: err instanceof Error ? err.message : "Unable to update status." });
    } finally {
      setStatusSaving(false);
    }
  }

  return (
    <AppShell
      navigation={buildAppNavigation()}
      activeLabel="Users"
      user={{
        name: userName,
        role: profile?.employee_profile?.job_title || "Admin",
      }}
      mobileNav={buildAppMobileNav("Dashboard")}
    >
      <PageHeader
        breadcrumbs={[
          { label: "Administration" },
          { label: "Users", path: "/admin/users" },
          { label: displayName },
        ]}
        title={displayName}
        description={adminUser?.email ?? ""}
      />

      {userLoading ? (
        <div className="text-sm text-slate-500">Loading user...</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            {/* Identity */}
            <SectionCard title="Identity">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <TextField
                  label="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
                <TextField label="Email" value={adminUser?.email ?? ""} readOnly />
                <TextField
                  label="Type"
                  value={typeLabel[adminUser?.type ?? ""] ?? adminUser?.type ?? "-"}
                  readOnly
                />
              </div>
              <Button
                className="mt-4"
                onClick={() => void handleSaveInfo()}
                disabled={infoSaving}
              >
                {infoSaving ? "Saving..." : "Save Details"}
              </Button>
            </SectionCard>

            {/* Roles */}
            <SectionCard title="Role">
              {rolesLoading ? (
                <div className="text-sm text-slate-500">Loading roles...</div>
              ) : (
                <>
                  <SelectField
                    label="Assigned Role"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  >
                    <option value="">No role</option>
                    {roleOptions.map((r) => (
                      <option key={r.slug} value={r.slug}>
                        {r.name}
                      </option>
                    ))}
                  </SelectField>
                  <Button
                    className="mt-4"
                    onClick={() => void handleSaveRole()}
                    disabled={roleSaving}
                  >
                    {roleSaving ? "Saving..." : "Update Role"}
                  </Button>
                </>
              )}
            </SectionCard>
          </div>

          <div className="space-y-6 lg:col-span-4">
            {/* Status card */}
            <SectionCard title="Account Status">
              <div className="mb-4">
                <Chip variant={statusVariant[adminUser?.status ?? ""] ?? "neutral"}>
                  {adminUser?.status ?? "-"}
                </Chip>
              </div>
              <div className="flex flex-col gap-2">
                {adminUser?.status !== "active" ? (
                  <Button
                    onClick={() => void handleStatusChange("active")}
                    disabled={statusSaving}
                  >
                    Activate
                  </Button>
                ) : null}
                {adminUser?.status === "active" ? (
                  <Button
                    variant="danger"
                    onClick={() => void handleStatusChange("suspended")}
                    disabled={statusSaving}
                  >
                    Suspend
                  </Button>
                ) : null}
              </div>
            </SectionCard>

            {/* Invite */}
            <SectionCard title="Invitation">
              <p className="mb-4 text-sm text-slate-600">
                {adminUser?.status === "pending"
                  ? "This user has not accepted their invite yet."
                  : "Resend if the user needs a new login link."}
              </p>
              <Button
                variant="secondary"
                onClick={() => void handleSendInvite()}
                disabled={inviteSending}
              >
                <Icon name="mail" className="mr-2 text-[18px]" />
                {inviteSending ? "Sending..." : "Send / Resend Invite"}
              </Button>
            </SectionCard>

            {/* Link to HR profile for staff */}
            {adminUser?.type === "staff" ? (
              <SectionCard title="Employee Profile">
                <p className="mb-3 text-sm text-slate-600">
                  This user has a staff account. HR can complete their employee
                  profile.
                </p>
                <Link to="/hr/employees">
                  <Button variant="ghost">
                    <Icon name="person" className="mr-2 text-[18px]" />
                    View in HR
                  </Button>
                </Link>
              </SectionCard>
            ) : null}
          </div>
        </div>
      )}
    </AppShell>
  );
}
```

- [ ] **Step 2: Verify TS**

```bash
cd apps/pwa && npx tsc --noEmit 2>&1 | grep "AdminUserDetailPage"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/modules/admin/AdminUserDetailPage.tsx
git commit -m "feat(admin): add admin user detail page with roles, invite, and status"
```

---

## Task 5: Wire Routes and Navigation

**Files:**
- Modify: `apps/pwa/src/shared/navigation.ts`
- Modify: `apps/pwa/src/App.tsx`

- [ ] **Step 1: Add Administration section to `navigation.ts`**

In `apps/pwa/src/shared/navigation.ts`, inside `buildAppNavigation()` `return [...]`, add after the closing `}` of the HR block (before the closing `]`):

```ts
    {
      label: "Administration",
      icon: "manage_accounts",
      section: "Admin",
      moduleKey: "admin",
      children: [
        { key: "admin-users", label: "Users", icon: "people", path: "/admin/users" },
      ],
    },
```

- [ ] **Step 2: Add routes to `App.tsx`**

Add imports at the top with other page imports:
```ts
import AdminUsersPage from "@/modules/admin/AdminUsersPage";
import AdminUserDetailPage from "@/modules/admin/AdminUserDetailPage";
```

Add a new route block after the HR block:
```tsx
<Route element={<ModuleRoute moduleKey="admin" />}>
  <Route path="/admin/users" element={<AdminUsersPage />} />
  <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
</Route>
```

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/shared/navigation.ts apps/pwa/src/App.tsx
git commit -m "feat(admin): wire /admin/users routes and add Administration nav section"
```

---

## Task 6: Build Verification

- [ ] **Step 1: Run full build**

```bash
npm run build:pwa2
```

Expected: `✓ built in Xs` with no TypeScript errors. Fix any errors before proceeding.

- [ ] **Step 2: Push**

```bash
git push origin development
```

---

## Codex Prompt

Use the following prompt to dispatch this plan to Codex:

---

**Task: Implement the Admin User Management pages for the Stanforte Edge PWA.**

You are working in the monorepo root. The PWA is at `apps/pwa/`. The plan is at `docs/superpowers/plans/2026-04-14-admin-user-management.md`.

**Read the plan fully before starting.** It contains codebase context, all types, complete code for every file, and exact build commands.

**Architecture:** Admin creates user accounts (for staff, vendors, clients, board members), assigns roles, sends invites. HR separately completes employee profiles. The admin user page lives at `/admin/users` and `/admin/users/:id`.

**Key rules:**
- `SelectField` uses `<option>` children — NOT an `options` prop.
- `TableHeaderCell` for empty column headers must have children: `<TableHeaderCell>{""}</TableHeaderCell>`.
- `EmptyState` accepts only `title`, `description`, `actionLabel` — no `icon` prop.
- For the `listKey` refresh pattern in `AdminUsersPage`, bumping the key forces `useCachedQuery` to re-fetch using a new cache key — this is intentional.
- Do NOT modify any existing HR pages or the staff self-service pages.
- After all tasks, run `npm run build:pwa2` and fix TypeScript errors before pushing.
- Commit after each task as specified.
- Push to `development` branch when done.

Start with Task 1.
