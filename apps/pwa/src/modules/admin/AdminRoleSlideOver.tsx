import { useEffect, useState } from "react";
import {
  Button,
  SectionCard,
  TextField,
  useToast,
  Icon,
} from "@/shared";
import { createRole, updateRole, listPermissions, getRole, type Role, type RolePermission } from "./admin-roles-api";

type Props = {
  role?: Role | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function AdminRoleSlideOver({ role, onClose, onSaved }: Props) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  const [name, setName] = useState(role?.name || "");
  const [slug, setSlug] = useState(role?.slug || "");
  const [description, setDescription] = useState(role?.description || "");
  const [isActive, setIsActive] = useState(role?.is_active ?? true);

  useEffect(() => {
    async function load() {
      setLoadingPermissions(true);
      try {
        const [perms, roleData] = await Promise.all([
          listPermissions(),
          role ? getRole(role.id) : Promise.resolve(null),
        ]);
        setPermissions(perms);
        if (roleData?.permissions) {
          setSelectedPermissions(roleData.permissions.map((p) => p.slug));
        }
      } catch {
        setPermissions([]);
      } finally {
        setLoadingPermissions(false);
      }
    }
    void load();
  }, [role?.id]);

  function togglePermission(permSlug: string) {
    setSelectedPermissions((prev) =>
      prev.includes(permSlug) ? prev.filter((s) => s !== permSlug) : [...prev, permSlug]
    );
  }

  const slugFromName = (n: string) =>
    n.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");

  function handleNameChange(value: string) {
    setName(value);
    if (!role) {
      setSlug(slugFromName(value));
    }
  }

  async function handleSubmit() {
    if (!name.trim()) {
      showToast({ tone: "warning", title: "Name required", message: "Please enter a role name." });
      return;
    }
    if (!slug.trim() && !role) {
      showToast({ tone: "warning", title: "Slug required", message: "Please enter a role slug." });
      return;
    }
    try {
      setSaving(true);
      const permission_ids = permissions
        .filter((permission) => selectedPermissions.includes(permission.slug))
        .map((permission) => permission.id);
      if (role) {
        await updateRole(role.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          is_active: isActive,
          permission_ids,
        });
        showToast({ tone: "success", title: "Role updated", message: `"${name}" has been updated.` });
      } else {
        await createRole({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || undefined,
          permission_ids,
        });
        showToast({ tone: "success", title: "Role created", message: `"${name}" has been created.` });
      }
      onSaved();
    } catch (err) {
      showToast({
        tone: "danger",
        title: "Save failed",
        message: err instanceof Error ? err.message : "Unable to save role.",
      });
    } finally {
      setSaving(false);
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
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40">
      <div className="flex h-full w-full max-w-lg flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {role ? "Edit Role" : "New Role"}
            </p>
            <h2 className="text-xl font-semibold text-slate-950">
              {role ? "Edit Role" : "Add Role"}
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <SectionCard title="Basic Info">
            <div className="grid gap-4">
              <TextField
                label="Role Name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Finance Manager"
              />
              <div>
                <TextField
                  label="Slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g., finance_manager"
                  disabled={!!role}
                />
                {!role && (
                  <p className="text-xs text-slate-400 mt-1">Auto-generated from name if left empty</p>
                )}
              </div>
              <TextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this role's purpose"
              />
              {role && (
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <label htmlFor="is_active" className="text-sm text-slate-700">
                    Active
                  </label>
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Permissions">
            {loadingPermissions ? (
              <div className="text-sm text-slate-500">Loading permissions...</div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-500">
                  Select which permissions this role should have.
                </p>
                {Object.entries(groupedPermissions).map(([module, perms]) => (
                  <div key={module} className="border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 mb-2">
                      {module}
                    </p>
                    <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                      {perms.map((perm) => (
                        <label key={perm.slug} className="flex cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(perm.slug)}
                            onChange={() => togglePermission(perm.slug)}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300"
                          />
                          <span>
                            <span className="text-sm text-slate-700 block">{perm.name}</span>
                            {perm.description && (
                              <span className="text-xs text-slate-400">{perm.description}</span>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="border-t border-slate-200 px-6 py-4">
          <div className="flex gap-3">
            <Button onClick={() => void handleSubmit()} disabled={saving}>
              {saving ? "Saving..." : role ? "Update Role" : "Create Role"}
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
