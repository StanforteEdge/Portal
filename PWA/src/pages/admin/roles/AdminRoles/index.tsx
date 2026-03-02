import { type MouseEvent, useEffect, useMemo, useState } from "react";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import { FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/Base/Form";
import Table from "@/components/Base/Table";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import {
  createRbacPermission,
  createRbacRole,
  deleteRbacPermission,
  deleteRbacPermissionWithReplacement,
  deleteRbacRole,
  deleteRbacRoleWithReplacement,
  getRbacPermissionDeleteImpact,
  getRbacRoleDeleteImpact,
  listRbacPermissions,
  listRbacRoles,
  setRbacRolePermissions,
  updateRbacPermission,
  updateRbacRole,
  type PermissionRecord,
  type RoleRecord,
} from "@/services/rbac";

const emptyForm = {
  id: "",
  name: "",
  slug: "",
  description: "",
  is_active: true,
};

const emptyPermissionForm = {
  id: "",
  name: "",
  slug: "",
  module: "",
  description: "",
};

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
}

function AdminRolesPage() {
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [permissions, setPermissions] = useState<PermissionRecord[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [permissionSearch, setPermissionSearch] = useState("");
  const [roleSearch, setRoleSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [permissionForm, setPermissionForm] = useState(emptyPermissionForm);
  const [savingPermission, setSavingPermission] = useState(false);
  const [deletingRoleId, setDeletingRoleId] = useState("");
  const [deletingPermissionId, setDeletingPermissionId] = useState("");
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  const selectedRole = useMemo(() => roles.find((row) => row.id === selectedRoleId), [roles, selectedRoleId]);

  const groupedPermissions = useMemo(() => {
    const filtered = permissions.filter((permission) => {
      if (!permissionSearch.trim()) return true;
      const q = permissionSearch.trim().toLowerCase();
      return permission.name.toLowerCase().includes(q) || permission.slug.toLowerCase().includes(q);
    });
    const groups = new Map<string, PermissionRecord[]>();
    for (const item of filtered) {
      const key = item.module || "general";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [permissions, permissionSearch]);

  const filteredRoles = useMemo(
    () =>
      roles.filter((role) => {
        if (statusFilter === "active" && !role.is_active) return false;
        if (statusFilter === "inactive" && role.is_active) return false;
        if (!roleSearch.trim()) return true;
        const q = roleSearch.trim().toLowerCase();
        return (
          role.name.toLowerCase().includes(q) ||
          role.slug.toLowerCase().includes(q) ||
          (role.description || "").toLowerCase().includes(q)
        );
      }),
    [roles, roleSearch, statusFilter]
  );

  const stats = useMemo(() => {
    const totalRoles = roles.length;
    const activeRoles = roles.filter((role) => role.is_active).length;
    const totalPermissions = permissions.length;
    const roleAssignments = roles.reduce((sum, role) => sum + (role.users?.length ?? 0), 0);
    return { totalRoles, activeRoles, totalPermissions, roleAssignments };
  }, [roles, permissions]);

  const permissionMatrix = useMemo(
    () =>
      permissions.map((permission) => {
        const assignedRoleIds = roles
          .filter((role) => (role.permissions || []).some((assignedPermission) => assignedPermission.id === permission.id))
          .map((role) => role.id);
        return { permission, assignedRoleIds };
      }),
    [permissions, roles]
  );

  const load = async () => {
    try {
      setLoading(true);
      const [rolesData, permissionsData] = await Promise.all([listRbacRoles(true), listRbacPermissions()]);
      setRoles(rolesData);
      setPermissions(permissionsData);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load roles and permissions." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!selectedRole) {
      setForm(emptyForm);
      setSelectedPermissions([]);
      return;
    }
    setForm({
      id: selectedRole.id,
      name: selectedRole.name,
      slug: selectedRole.slug,
      description: selectedRole.description || "",
      is_active: selectedRole.is_active,
    });
    setSelectedPermissions((selectedRole.permissions || []).map((item) => item.id));
  }, [selectedRole]);

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId) ? prev.filter((id) => id !== permissionId) : [...prev, permissionId]
    );
  };

  const addPermissions = (permissionIds: string[]) => {
    setSelectedPermissions((prev) => Array.from(new Set([...prev, ...permissionIds])));
  };

  const removePermissions = (permissionIds: string[]) => {
    const blocked = new Set(permissionIds);
    setSelectedPermissions((prev) => prev.filter((id) => !blocked.has(id)));
  };

  const saveRoleMeta = async () => {
    if (!form.name.trim()) {
      setNotice({ tone: "warning", message: "Role name is required." });
      return;
    }
    try {
      setSaving(true);
      setNotice(null);
      if (!form.id) {
        const created = await createRbacRole({
          name: form.name.trim(),
          slug: form.slug.trim() || undefined,
          description: form.description.trim() || undefined,
          is_active: form.is_active,
          permission_ids: selectedPermissions,
        });
        setSelectedRoleId(created.id);
      } else {
        await updateRbacRole(form.id, {
          name: form.name.trim(),
          slug: form.slug.trim() || undefined,
          description: form.description.trim() || undefined,
          is_active: form.is_active,
        });
        await setRbacRolePermissions(form.id, selectedPermissions);
      }
      await load();
      setNotice({ tone: "success", message: "Role saved." });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save role." });
    } finally {
      setSaving(false);
    }
  };

  const createPermission = async () => {
    if (!permissionForm.name.trim()) {
      setNotice({ tone: "warning", message: "Permission name is required." });
      return;
    }
    try {
      setSavingPermission(true);
      setNotice(null);
      if (permissionForm.id) {
        const updated = await updateRbacPermission(permissionForm.id, {
          name: permissionForm.name.trim(),
          slug: permissionForm.slug.trim() || undefined,
          module: permissionForm.module.trim() || undefined,
          description: permissionForm.description.trim() || undefined,
        });
        setPermissions((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      } else {
        const created = await createRbacPermission({
          name: permissionForm.name.trim(),
          slug: permissionForm.slug.trim() || undefined,
          module: permissionForm.module.trim() || undefined,
          description: permissionForm.description.trim() || undefined,
        });
        setPermissions((prev) => [...prev, created]);
      }
      setPermissionForm(emptyPermissionForm);
      setNotice({ tone: "success", message: permissionForm.id ? "Permission updated." : "Permission created." });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save permission." });
    } finally {
      setSavingPermission(false);
    }
  };

  const onEditPermission = (permission: PermissionRecord) => {
    setPermissionForm({
      id: permission.id,
      name: permission.name,
      slug: permission.slug,
      module: permission.module || "",
      description: permission.description || "",
    });
  };

  const onDeleteRole = async (role: RoleRecord) => {
    if (!window.confirm(`Delete role "${role.name}"?`)) return;
    try {
      setDeletingRoleId(role.id);
      setNotice(null);
      const impact = await getRbacRoleDeleteImpact(role.id);
      if (impact.usage.assignment_count > 0) {
        const candidates = roles.filter((item) => item.id !== role.id && item.is_active);
        if (candidates.length === 0) {
          setNotice({
            tone: "warning",
            message: `Role "${role.name}" is assigned to ${impact.usage.assignment_count} user-role records. Create another active role first.`,
          });
          return;
        }
        const optionsText = candidates.map((item) => `${item.id}: ${item.name} (${item.slug})`).join("\n");
        const chosen = window.prompt(
          `Role "${role.name}" is in use by ${impact.usage.assignment_count} assignment(s).\nEnter replacement role ID:\n\n${optionsText}`,
          candidates[0]?.id || ""
        );
        if (!chosen) return;
        await deleteRbacRoleWithReplacement(role.id, chosen.trim());
      } else {
        await deleteRbacRole(role.id);
      }
      if (selectedRoleId === role.id) {
        setSelectedRoleId("");
      }
      await load();
      setNotice({ tone: "success", message: "Role deleted." });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to delete role." });
    } finally {
      setDeletingRoleId("");
    }
  };

  const onDeletePermission = async (permission: PermissionRecord) => {
    if (!window.confirm(`Delete permission "${permission.name}"?`)) return;
    try {
      setDeletingPermissionId(permission.id);
      setNotice(null);
      const impact = await getRbacPermissionDeleteImpact(permission.id);
      if (impact.usage.role_count > 0) {
        const candidates = permissions.filter((item) => item.id !== permission.id);
        if (candidates.length === 0) {
          setNotice({
            tone: "warning",
            message: `Permission "${permission.name}" is used by ${impact.usage.role_count} role(s). Create another permission first.`,
          });
          return;
        }
        const optionsText = candidates
          .map((item) => `${item.id}: ${item.name} (${item.slug})`)
          .join("\n");
        const chosen = window.prompt(
          `Permission "${permission.name}" is assigned to ${impact.usage.role_count} role(s).\nEnter replacement permission ID:\n\n${optionsText}`,
          candidates[0]?.id || ""
        );
        if (!chosen) return;
        await deleteRbacPermissionWithReplacement(permission.id, chosen.trim());
      } else {
        await deleteRbacPermission(permission.id);
      }
      setPermissions((prev) => prev.filter((item) => item.id !== permission.id));
      setSelectedPermissions((prev) => prev.filter((id) => id !== permission.id));
      if (permissionForm.id === permission.id) {
        setPermissionForm(emptyPermissionForm);
      }
      await load();
      setNotice({ tone: "success", message: "Permission deleted." });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to delete permission." });
    } finally {
      setDeletingPermissionId("");
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Roles & Permissions</h2>
      </div>
      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="grid grid-cols-12 gap-6 mt-5">
        <div className="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
          <div className="box p-5">
            <div className="flex">
              <Lucide icon="ShieldCheck" className="w-5 h-5 text-primary" />
            </div>
            <div className="mt-6 text-2xl font-semibold">{stats.totalRoles}</div>
            <div className="mt-1 text-slate-500">Total Roles</div>
          </div>
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
          <div className="box p-5">
            <div className="flex">
              <Lucide icon="Users" className="w-5 h-5 text-success" />
            </div>
            <div className="mt-6 text-2xl font-semibold">{stats.roleAssignments}</div>
            <div className="mt-1 text-slate-500">Role Assignments</div>
          </div>
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
          <div className="box p-5">
            <div className="flex">
              <Lucide icon="Lock" className="w-5 h-5 text-warning" />
            </div>
            <div className="mt-6 text-2xl font-semibold">{stats.totalPermissions}</div>
            <div className="mt-1 text-slate-500">Total Permissions</div>
          </div>
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
          <div className="box p-5">
            <div className="flex">
              <Lucide icon="ShieldCheck" className="w-5 h-5 text-info" />
            </div>
            <div className="mt-6 text-2xl font-semibold">{stats.activeRoles}</div>
            <div className="mt-1 text-slate-500">Active Roles</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5 mt-5">
        <div className="col-span-12 lg:col-span-5 box p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Roles Management</h3>
            <Button
              variant="primary"
              onClick={() => {
                setSelectedRoleId("");
                setForm(emptyForm);
                setSelectedPermissions([]);
              }}
            >
              <Lucide icon="Plus" className="w-4 h-4 mr-2" />
              Create Role
            </Button>
          </div>
          <div className="grid grid-cols-12 gap-2 mb-4">
            <div className="col-span-12 md:col-span-8">
              <FormInput value={roleSearch} onChange={(event) => setRoleSearch(event.target.value)} placeholder="Search roles..." />
            </div>
            <div className="col-span-12 md:col-span-4">
              <FormSelect value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | "active" | "inactive")}>
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </FormSelect>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table className="table-report w-full" striped hover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th className="text-center">Users</Table.Th>
                  <Table.Th className="text-center">Permissions</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th className="text-right">Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredRoles.map((role) => (
                  <Table.Tr
                    key={role.id}
                    onClick={() => setSelectedRoleId(role.id)}
                    className={role.id === selectedRoleId ? "bg-primary/10" : ""}
                    style={{ cursor: "pointer" }}
                  >
                    <Table.Td>
                      <div className="font-medium">{role.name}</div>
                      <div className="text-xs text-slate-500">{role.slug}</div>
                    </Table.Td>
                    <Table.Td className="text-center">{role.users?.length ?? 0}</Table.Td>
                    <Table.Td className="text-center">{role.permissions?.length ?? 0}</Table.Td>
                    <Table.Td className={role.is_active ? "text-success" : "text-slate-500"}>
                      {role.is_active ? "Active" : "Inactive"}
                    </Table.Td>
                    <Table.Td>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={(event: MouseEvent<HTMLButtonElement>) => {
                            event.stopPropagation();
                            setSelectedRoleId(role.id);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          disabled={deletingRoleId === role.id}
                          onClick={(event: MouseEvent<HTMLButtonElement>) => {
                            event.stopPropagation();
                            void onDeleteRole(role);
                          }}
                        >
                          {deletingRoleId === role.id ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {!loading && filteredRoles.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={5} className="text-slate-500">
                      No roles found.
                    </Table.Td>
                  </Table.Tr>
                ) : null}
              </Table.Tbody>
            </Table>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-7 box p-4 space-y-4">
          <h3 className="font-medium">{form.id ? "Edit Role" : "Create Role"}</h3>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-5">
              <FormLabel>Name</FormLabel>
              <FormInput value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Slug</FormLabel>
              <FormInput value={form.slug} onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-3">
              <FormLabel>Status</FormLabel>
              <FormSelect
                value={form.is_active ? "true" : "false"}
                onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.value === "true" }))}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </FormSelect>
            </div>
            <div className="col-span-12">
              <FormLabel>Description</FormLabel>
              <FormTextarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="rounded-md border p-4 mb-4">
              <div className="font-medium mb-3">{permissionForm.id ? "Edit Permission" : "Create Permission"}</div>
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-12 md:col-span-4">
                  <FormLabel>Name</FormLabel>
                  <FormInput
                    value={permissionForm.name}
                    onChange={(e) =>
                      setPermissionForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                        slug: prev.slug ? prev.slug : normalizeSlug(e.target.value),
                      }))
                    }
                    placeholder="e.g. View Leave Requests"
                  />
                </div>
                <div className="col-span-12 md:col-span-4">
                  <FormLabel>Slug</FormLabel>
                  <FormInput
                    value={permissionForm.slug}
                    onChange={(e) => setPermissionForm((prev) => ({ ...prev, slug: normalizeSlug(e.target.value) }))}
                    placeholder="e.g. leave.view"
                  />
                </div>
                <div className="col-span-12 md:col-span-4">
                  <FormLabel>Module</FormLabel>
                  <FormInput
                    value={permissionForm.module}
                    onChange={(e) => setPermissionForm((prev) => ({ ...prev, module: e.target.value.toLowerCase() }))}
                    placeholder="e.g. hr"
                  />
                </div>
                <div className="col-span-12">
                  <FormLabel>Description</FormLabel>
                  <FormTextarea
                    rows={2}
                    value={permissionForm.description}
                    onChange={(e) => setPermissionForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description"
                  />
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                {permissionForm.id ? (
                  <Button
                    variant="outline-secondary"
                    className="mr-2"
                    onClick={() => setPermissionForm(emptyPermissionForm)}
                  >
                    Cancel
                  </Button>
                ) : null}
                <Button onClick={() => void createPermission()} disabled={savingPermission}>
                  <Lucide icon={permissionForm.id ? "CheckCircle2" : "Plus"} className="w-4 h-4 mr-2" />
                  {savingPermission ? "Saving..." : permissionForm.id ? "Save Permission" : "Create Permission"}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="font-medium">Permissions</div>
              <div className="flex gap-2">
                <FormInput
                  value={permissionSearch}
                  onChange={(e) => setPermissionSearch(e.target.value)}
                  placeholder="Search permissions..."
                  className="max-w-xs"
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => addPermissions(groupedPermissions.flatMap(([, items]) => items.map((item) => item.id)))}
                >
                  Select Visible
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={() => removePermissions(groupedPermissions.flatMap(([, items]) => items.map((item) => item.id)))}
                >
                  Clear Visible
                </Button>
              </div>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-auto pr-1">
              {groupedPermissions.map(([module, items]) => (
                <div key={module} className="border rounded-md p-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="font-medium capitalize">{module.replaceAll("_", " ")}</div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        onClick={() => addPermissions(items.map((item) => item.id))}
                      >
                        Select All
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        onClick={() => removePermissions(items.map((item) => item.id))}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-12 gap-2">
                    {items.map((permission) => (
                      <label key={permission.id} className="col-span-12 md:col-span-6 flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(permission.id)}
                          onChange={() => togglePermission(permission.id)}
                        />
                        <span>{permission.name}</span>
                        <span className="text-xs text-slate-500">{permission.slug}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => void saveRoleMeta()} disabled={saving}>
              {saving ? "Saving..." : "Save Role"}
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-5 box p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">Permission Matrix</h3>
          <Button variant="outline-secondary" onClick={() => void load()}>
            <Lucide icon="Undo2" className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table className="table-report w-full" striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Permission</Table.Th>
                <Table.Th>Module</Table.Th>
                <Table.Th>Assigned Roles</Table.Th>
                <Table.Th className="text-right">Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {permissionMatrix.map((row) => (
                <Table.Tr key={row.permission.id}>
                  <Table.Td>
                    <div className="font-medium">{row.permission.name}</div>
                    <div className="text-xs text-slate-500">{row.permission.slug}</div>
                  </Table.Td>
                  <Table.Td className="capitalize">{(row.permission.module || "general").replaceAll("_", " ")}</Table.Td>
                  <Table.Td>
                    <div className="flex flex-wrap gap-2">
                      {roles
                        .filter((role) => row.assignedRoleIds.includes(role.id))
                        .map((role) => (
                          <span key={`${row.permission.id}-${role.id}`} className="px-2 py-1 rounded bg-slate-100 text-xs">
                            {role.name}
                          </span>
                        ))}
                      {row.assignedRoleIds.length === 0 ? <span className="text-slate-500 text-xs">Not assigned</span> : null}
                    </div>
                  </Table.Td>
                  <Table.Td>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => onEditPermission(row.permission)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        disabled={deletingPermissionId === row.permission.id}
                        onClick={() => void onDeletePermission(row.permission)}
                      >
                        {deletingPermissionId === row.permission.id ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      </div>
    </>
  );
}

export default AdminRolesPage;
