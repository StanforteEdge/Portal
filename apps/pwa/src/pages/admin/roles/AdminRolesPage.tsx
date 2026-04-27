import { useEffect, useState } from "react";
import {
  Button,
  Chip,
  EmptyState,
  Icon,
  PageHeader,
  SectionCard,
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
  listRoles,
  deleteRole,
  listPermissions,
  type Role,
  type RolePermission,
} from "./admin-roles-api";
import AdminRoleSlideOver from "./AdminRoleSlideOver";
import AdminPermissionSlideOver from "./AdminPermissionSlideOver";

type ActiveTab = "roles" | "permissions";

export default function AdminRolesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const { data: profile } = useCachedQuery(
    "admin:profile",
    () => getWorkspaceProfile(),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const [activeTab, setActiveTab] = useState<ActiveTab>("roles");
  const [search, setSearch] = useState("");
  const [listKey, setListKey] = useState(0);
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null | boolean>(false);
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null);
  const [viewingPermission, setViewingPermission] = useState<RolePermission | null>(null);

  const { data: rolesData, loading: rolesLoading } = useCachedQuery(
    `admin:roles:${listKey}:${search}`,
    () => listRoles({ search: search || undefined, per_page: 100 }),
    { ttlMs: 1000 * 30, storage: "memory" },
  );

  const { data: permissionsData, loading: permissionsLoading } = useCachedQuery(
    `admin:permissions:${listKey}`,
    () => listPermissions(),
    { ttlMs: 1000 * 30, storage: "memory" },
  );

  const roles: Role[] = Array.isArray(rolesData) ? rolesData : [];
  const permissions: RolePermission[] = Array.isArray(permissionsData) ? permissionsData : [];

  const userName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.email ||
    "Admin";

  const tabItems = [
    { id: "roles" as ActiveTab, label: "Roles", icon: "admin_panel_settings" },
    { id: "permissions" as ActiveTab, label: "Permissions", icon: "key" },
  ];

  async function handleDeleteRole(role: Role) {
    if (!window.confirm(`Delete role "${role.name}"? This cannot be undone.`)) {
      return;
    }
    try {
      setDeletingRoleId(role.id);
      await deleteRole(role.id);
      showToast({ tone: "success", title: "Deleted", message: `Role "${role.name}" has been removed.` });
      setListKey((k) => k + 1);
    } catch (err) {
      showToast({
        tone: "danger",
        title: "Delete failed",
        message: err instanceof Error ? err.message : "Unable to delete role.",
      });
    } finally {
      setDeletingRoleId(null);
    }
  }

  const groupedPermissions = permissions.reduce(
    (acc, perm) => {
      const module = perm.module || "Other";
      if (!acc[module]) acc[module] = [];
      acc[module].push(perm);
      return acc;
    },
    {} as Record<string, RolePermission[]>
  );

  return (
    <AppShell
      navigation={buildAppNavigation()}
      activeLabel="admin-roles"
      user={{
        name: userName,
        role: profile?.employee_profile?.job_title || "Admin",
      }}
      mobileNav={buildAppMobileNav("Dashboard")}
    >
      <PageHeader
        breadcrumbs={[{ label: "Administration", path: "/admin/users" }, { label: "Roles & Permissions" }]}
        title="Roles & Permissions"
        description="Manage user roles and their access permissions."
      />

      <div className="mt-6 space-y-6">
        {/* Top Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200">
          {tabItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                activeTab === item.id
                  ? "border-brand-900 text-brand-900"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="min-w-0">
          {activeTab === "roles" && (
            <div className="space-y-6">
              <SectionCard>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">All Roles</h3>
                    <p className="text-sm text-slate-500 mt-1">Search or filter roles.</p>
                  </div>
                  <Button className="gap-2" onClick={() => setShowCreateRole(true)}>
                    <Icon name="add" className="text-[18px]" />
                    Add Role
                  </Button>
                </div>

                <div className="mb-4">
                  <TextField
                    label="Search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search roles..."
                  />
                </div>

                {rolesLoading ? (
                  <div className="text-sm text-slate-500">Loading roles...</div>
                ) : (
                  <Table>
                    <TableHead>
                      <TableHeaderRow>
                        <TableHeaderCell>Name</TableHeaderCell>
                        <TableHeaderCell>Slug</TableHeaderCell>
                        <TableHeaderCell>Permissions</TableHeaderCell>
                        <TableHeaderCell>Users</TableHeaderCell>
                        <TableHeaderCell>Status</TableHeaderCell>
                        <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                      </TableHeaderRow>
                    </TableHead>
                    <TableBody>
                      {roles.map((role) => (
                        <TableRow key={role.id}>
                          <TableCell>
                            <p className="font-semibold text-slate-900">{role.name}</p>
                            {role.description && (
                              <p className="text-xs text-slate-500 mt-0.5">{role.description}</p>
                            )}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                              {role.slug}
                            </code>
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {role.permissions?.length ?? 0}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {role.users?.length ?? 0}
                          </TableCell>
                          <TableCell>
                            <Chip variant={role.is_active ? "success" : "neutral"}>
                              {role.is_active ? "Active" : "Inactive"}
                            </Chip>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingRole(role)}
                              >
                                <Icon name="edit" />
                              </Button>
                              {role.slug !== "admin" && role.slug !== "staff" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-danger hover:bg-danger/5"
                                  disabled={deletingRoleId === role.id}
                                  onClick={() => void handleDeleteRole(role)}
                                >
                                  <Icon name="delete" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!roles.length ? (
                        <TableRow>
                          <TableCell colSpan={6} className="py-10 text-center">
                            <EmptyState
                              title="No roles found"
                              description="Roles will appear here once created."
                            />
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                )}
              </SectionCard>
            </div>
          )}

          {activeTab === "permissions" && (
            <div className="space-y-6">
              <SectionCard>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">All Permissions</h3>
                    <p className="text-sm text-slate-500 mt-1">System-defined permissions grouped by module.</p>
                  </div>
                </div>

                {permissionsLoading ? (
                  <div className="text-sm text-slate-500">Loading permissions...</div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupedPermissions).map(([module, perms]) => (
                      <div key={module}>
                        <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500 mb-2">
                          {module}
                        </h4>
                        <Table>
                          <TableHead>
                            <TableHeaderRow>
                              <TableHeaderCell>Name</TableHeaderCell>
                              <TableHeaderCell>Slug</TableHeaderCell>
                              <TableHeaderCell>Description</TableHeaderCell>
                            </TableHeaderRow>
                          </TableHead>
                          <TableBody>
                            {perms.map((perm) => (
<TableRow key={perm.id} className="cursor-pointer" onClick={() => setViewingPermission(perm)}>
                                 <TableCell className="font-medium text-slate-900">{perm.name}</TableCell>
                                 <TableCell>
                                   <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                     {perm.slug}
                                   </code>
                                 </TableCell>
                                 <TableCell className="text-slate-500">{perm.description || "-"}</TableCell>
                               </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                    {!permissions.length ? (
                      <div className="py-10 text-center">
                        <EmptyState
                          title="No permissions found"
                          description="Permissions will appear here once defined."
                        />
                      </div>
                    ) : null}
                  </div>
                )}
              </SectionCard>
            </div>
          )}
        </div>
      </div>

      {/* Role SlideOvers */}
      {showCreateRole && (
        <AdminRoleSlideOver
          onClose={() => setShowCreateRole(false)}
          onSaved={() => {
            setShowCreateRole(false);
            setListKey((k) => k + 1);
          }}
        />
      )}
      {editingRole !== false && (
        <AdminRoleSlideOver
          role={typeof editingRole === "object" ? editingRole : null}
          onClose={() => setEditingRole(false)}
          onSaved={() => {
            setEditingRole(false);
            setListKey((k) => k + 1);
          }}
        />
      )}

      {/* Permission SlideOvers */}
      {viewingPermission && (
        <AdminPermissionSlideOver
          permission={viewingPermission}
          onClose={() => setViewingPermission(null)}
        />
      )}
    </AppShell>
  );
}
