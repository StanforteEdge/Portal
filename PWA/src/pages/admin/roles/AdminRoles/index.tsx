import { useEffect, useMemo, useState } from "react";
import Button from "@/components/Base/Button";
import { FormInput, FormLabel, FormTextarea } from "@/components/Base/Form";
import Table from "@/components/Base/Table";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import {
  createRbacRole,
  listRbacPermissions,
  listRbacRoles,
  setRbacRolePermissions,
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

function AdminRolesPage() {
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [permissions, setPermissions] = useState<PermissionRecord[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  const selectedRole = useMemo(() => roles.find((row) => row.id === selectedRoleId), [roles, selectedRoleId]);

  const groupedPermissions = useMemo(() => {
    const filtered = permissions.filter((permission) => {
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return permission.name.toLowerCase().includes(q) || permission.slug.toLowerCase().includes(q);
    });
    const groups = new Map<string, PermissionRecord[]>();
    for (const item of filtered) {
      const key = item.module || "general";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [permissions, search]);

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

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Roles & Permissions</h2>
      </div>
      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="grid grid-cols-12 gap-5 mt-5">
        <div className="col-span-12 lg:col-span-5 box p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Roles</h3>
            <Button
              variant="outline-primary"
              onClick={() => {
                setSelectedRoleId("");
                setForm(emptyForm);
                setSelectedPermissions([]);
              }}
            >
              New Role
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table className="table-report w-full" striped hover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Slug</Table.Th>
                  <Table.Th>Status</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {roles.map((role) => (
                  <Table.Tr
                    key={role.id}
                    onClick={() => setSelectedRoleId(role.id)}
                    className={role.id === selectedRoleId ? "bg-primary/10" : ""}
                    style={{ cursor: "pointer" }}
                  >
                    <Table.Td>{role.name}</Table.Td>
                    <Table.Td>{role.slug}</Table.Td>
                    <Table.Td className={role.is_active ? "text-success" : "text-slate-500"}>
                      {role.is_active ? "Active" : "Inactive"}
                    </Table.Td>
                  </Table.Tr>
                ))}
                {!loading && roles.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={3} className="text-slate-500">
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
              <select
                className="form-select"
                value={form.is_active ? "true" : "false"}
                onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.value === "true" }))}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
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
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="font-medium">Permissions</div>
              <div className="flex gap-2">
                <FormInput
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
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
    </>
  );
}

export default AdminRolesPage;
