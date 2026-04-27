import { useState } from "react";
import {
  Button,
  SectionCard,
  TextField,
  SelectField,
  useToast,
} from "@/shared";
import { SlideOver, SlideOverHeader, SlideOverContent, SlideOverFooter } from "@/shared/components/ui/SlideOver";
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
    <SlideOver open={true} onClose={onClose} size="md">
      <SlideOverHeader
        title={requestType ? "Edit Request Type" : "Add Request Type"}
        subtitle={requestType ? "Edit Type" : "New Type"}
        onClose={onClose}
      />
      <SlideOverContent>
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
      </SlideOverContent>
      <SlideOverFooter>
        <Button onClick={() => void handleSubmit()} disabled={saving}>
          {saving ? "Saving..." : requestType ? "Update Type" : "Create Type"}
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </SlideOverFooter>
    </SlideOver>
  );
}