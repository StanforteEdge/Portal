import { useState } from "react";
import {
  Button,
  SectionCard,
  TextField,
  SelectField,
  useToast,
} from "@/shared";
import type { RolePermission } from "./admin-roles-api";

type Props = {
  permission?: RolePermission | null;
  onClose: () => void;
  onSaved: () => void;
};

const MODULES = [
  { value: "", label: "Select module..." },
  { value: "hr", label: "HR" },
  { value: "finance", label: "Finance" },
  { value: "requests", label: "Requests" },
  { value: "admin", label: "Admin" },
  { value: "attendance", label: "Attendance" },
  { value: "payroll", label: "Payroll" },
  { value: "documents", label: "Documents" },
  { value: "Other", label: "Other" },
];

export default function AdminPermissionSlideOver({ permission, onClose, onSaved }: Props) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(permission?.name || "");
  const [slug, setSlug] = useState(permission?.slug || "");
  const [description, setDescription] = useState(permission?.description || "");
  const [module, setModule] = useState(permission?.module || "");

  const slugFromName = (n: string) =>
    n.toLowerCase().replace(/\s+/g, ".").replace(/[^a-z0-9.]/g, "");

  function handleNameChange(value: string) {
    setName(value);
    if (!permission) {
      setSlug(slugFromName(value));
    }
  }

  async function handleSubmit() {
    if (!name.trim()) {
      showToast({ tone: "warning", title: "Name required", message: "Please enter a permission name." });
      return;
    }
    if (!slug.trim() && !permission) {
      showToast({ tone: "warning", title: "Slug required", message: "Please enter a permission slug." });
      return;
    }
    try {
      setSaving(true);
      // TODO: Implement createPermission and updatePermission in API
      showToast({ tone: "success", title: "Success", message: "Permission saved (API not yet implemented)." });
      onSaved();
    } catch (err) {
      showToast({
        tone: "danger",
        title: "Save failed",
        message: err instanceof Error ? err.message : "Unable to save permission.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-end">
      <div className="absolute inset-0 top-16 bg-slate-950/40" onClick={onClose} />
      <div className="relative w-full max-w-lg flex flex-col bg-white shadow-xl max-h-[calc(100vh-4rem)]">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {permission ? "Edit Permission" : "New Permission"}
            </p>
            <h2 className="text-xl font-semibold text-slate-950">
              {permission ? "Edit Permission" : "Add Permission"}
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
                label="Permission Name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., View Employee Records"
              />
              <div>
                <TextField
                  label="Slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g., hr.employees.view"
                  disabled={!!permission}
                />
                {permission ? null : (
                  <p className="text-xs text-slate-400 mt-1">Auto-generated from name if left empty</p>
                )}
              </div>
              <SelectField
                label="Module"
                value={module}
                onChange={(e) => setModule(e.target.value)}
              >
                {MODULES.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </SelectField>
              <TextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this permission"
              />
            </div>
          </SectionCard>
        </div>

        <div className="border-t border-slate-200 px-6 py-4">
          <div className="flex gap-3">
            <Button onClick={() => void handleSubmit()} disabled={saving}>
              {saving ? "Saving..." : permission ? "Update Permission" : "Create Permission"}
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
