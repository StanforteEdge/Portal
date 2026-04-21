import { useState } from "react";
import {
  Button,
  SectionCard,
  TextField,
  SelectField,
  useToast,
} from "@/shared";
import { requestApi } from "@/shared/lib/core";
import type { RequestType } from "@stanforte/shared";

type Props = {
  requestType?: RequestType | null;
  onClose: () => void;
  onSaved: () => void;
};

const CATEGORIES = [
  { value: "", label: "Select category..." },
  { value: "financial", label: "Financial" },
  { value: "leave", label: "Leave" },
  { value: "attendance", label: "Attendance" },
  { value: "hr", label: "HR" },
  { value: "procurement", label: "Procurement" },
  { value: "general", label: "General" },
];

export default function RequestTypeSlideOver({ requestType, onClose, onSaved }: Props) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(requestType?.name || "");
  const [slug, setSlug] = useState(requestType?.slug || "");
  const [category, setCategory] = useState(requestType?.category || "");
  const [isActive, setIsActive] = useState(requestType?.is_active ?? true);

  const slugFromName = (n: string) =>
    n.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");

  function handleNameChange(value: string) {
    setName(value);
    if (!requestType) {
      setSlug(slugFromName(value));
    }
  }

  async function handleSubmit() {
    if (!name.trim()) {
      showToast({ tone: "warning", title: "Name required", message: "Please enter a type name." });
      return;
    }
    if (!slug.trim() && !requestType) {
      showToast({ tone: "warning", title: "Slug required", message: "Please enter a type slug." });
      return;
    }
    try {
      setSaving(true);
      await requestApi.saveType(
        {
          name: name.trim(),
          slug: slug.trim(),
          category: category || undefined,
          is_active: isActive,
        },
        requestType?.id,
      );
      showToast({
        tone: "success",
        title: requestType ? "Updated" : "Created",
        message: `${name} has been ${requestType ? "updated" : "created"}.`,
      });
      onSaved();
    } catch (err) {
      showToast({
        tone: "danger",
        title: "Save failed",
        message: err instanceof Error ? err.message : "Unable to save request type.",
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
              {requestType ? "Edit Type" : "New Type"}
            </p>
            <h2 className="text-xl font-semibold text-slate-950">
              {requestType ? "Edit Request Type" : "Add Request Type"}
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
                label="Type Name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Equipment Request"
              />
              <div>
                <TextField
                  label="Slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g., equipment_request"
                  disabled={!!requestType}
                />
                {!requestType && (
                  <p className="text-xs text-slate-400 mt-1">Auto-generated from name if left empty</p>
                )}
              </div>
              <SelectField
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </SelectField>
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
            </div>
          </SectionCard>
        </div>

        <div className="border-t border-slate-200 px-6 py-4">
          <div className="flex gap-3">
            <Button onClick={() => void handleSubmit()} disabled={saving}>
              {saving ? "Saving..." : requestType ? "Update Type" : "Create Type"}
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
