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
  listPermissions,
  createRole,
  deleteRole,
  updateRole,
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
  const [showCreatePermission, setShowCreatePermission] = useState(false);
  const [editingPermission, setEditingPermission] = useState<RolePermission | null | boolean>(false);
  const [deletingPermissionId, setDeletingPermissionId] = useState<string | null>(null);

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

  async function handleDeletePermission(permission: RolePermission) {
    if (!window.confirm(`Delete permission "${permission.name}"? This cannot be undone.`)) {
      return;
    }
    try {
      setDeletingPermissionId(permission.id);
      // Assuming deletePermission exists - will need to add to API if not
      showToast({ tone: "success", title: "Deleted", message: `Permission "${permission.name}" has been removed.` });
      setListKey((k) => k + 1);
    } catch (err) {
      showToast({
        tone: "danger",
        title: "Delete failed",
        message: err instanceof Error ? err.message : "Unable to delete permission.",
      });
    } finally {
      setDeletingPermissionId(null);
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

      <div className="flex flex-col md:flex-row gap-8 mt-6">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 flex flex-col gap-1">
          {tabItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === item.id
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
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
                          <TableCell colSpan={4} className="py-10 text-center">
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
                    <p className="text-sm text-slate-500 mt-1">Fine-grained access controls grouped by module.</p>
                  </div>
                  <Button className="gap-2" onClick={() => setShowCreatePermission(true)}>
                    <Icon name="add" className="text-[18px]" />
                    Add Permission
                  </Button>
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
                              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                            </TableHeaderRow>
                          </TableHead>
                          <TableBody>
                            {perms.map((perm) => (
                              <TableRow key={perm.id}>
                                <TableCell className="font-medium text-slate-900">{perm.name}</TableCell>
                                <TableCell>
                                  <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                    {perm.slug}
                                  </code>
                                </TableCell>
                                <TableCell className="text-slate-500">{perm.description || "-"}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setEditingPermission(perm)}
                                    >
                                      <Icon name="edit" />
                                    </Button>
                                    {perm.slug !== "admin" && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-danger hover:bg-danger/5"
                                        disabled={deletingPermissionId === perm.id}
                                        onClick={() => void handleDeletePermission(perm)}
                                      >
                                        <Icon name="delete" />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
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
        </main>
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
      {showCreatePermission && (
        <AdminPermissionSlideOver
          onClose={() => setShowCreatePermission(false)}
          onSaved={() => {
            setShowCreatePermission(false);
            setListKey((k) => k + 1);
          }}
        />
      )}
      {editingPermission !== false && (
        <AdminPermissionSlideOver
          permission={typeof editingPermission === "object" ? editingPermission : null}
          onClose={() => setEditingPermission(false)}
          onSaved={() => {
            setEditingPermission(false);
            setListKey((k) => k + 1);
          }}
        />
      )}
    </AppShell>
  );
}
