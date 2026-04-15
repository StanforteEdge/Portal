import { useState } from "react";
import {
  Button,
  SectionCard,
  TextField,
  TextAreaField,
  useToast,
} from "@/shared";

type Props = {
  type: { id: string; name: string; slug: string; description: string };
  onClose: () => void;
  onSaved: (type: { id: string; name: string; slug: string; description: string }) => void;
};

export default function AdminGroupTypeSlideOver({ type, onClose, onSaved }: Props) {
  const { showToast } = useToast();
  const [name, setName] = useState(type.name);
  const [slug, setSlug] = useState(type.slug);
  const [description, setDescription] = useState(type.description);

  const slugFromName = (n: string) =>
    n.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");

  function handleNameChange(value: string) {
    setName(value);
    if (!type.id) {
      setSlug(slugFromName(value));
    }
  }

  function handleSubmit() {
    if (!name.trim()) {
      showToast({ tone: "warning", title: "Name required", message: "Please enter a type name." });
      return;
    }
    if (!slug.trim() && !type.id) {
      showToast({ tone: "warning", title: "Slug required", message: "Please enter a type slug." });
      return;
    }
    onSaved({
      id: type.id || slug.trim(),
      name: name.trim(),
      slug: slug.trim() || slugFromName(name.trim()),
      description: description.trim(),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40">
      <div className="flex h-full w-full max-w-lg flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {type.id ? "Edit Type" : "New Type"}
            </p>
            <h2 className="text-xl font-semibold text-slate-950">
              {type.id ? "Edit Type" : "Add Type"}
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <SectionCard title="Type Info">
            <div className="grid gap-4">
              <TextField
                label="Name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Team"
              />
              <div>
                <TextField
                  label="Slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g., team"
                  disabled={!!type.id}
                />
                {!type.id && (
                  <p className="text-xs text-slate-400 mt-1">Auto-generated from name if left empty</p>
                )}
              </div>
              <TextAreaField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this type"
                rows={3}
              />
            </div>
          </SectionCard>
        </div>

        <div className="border-t border-slate-200 px-6 py-4">
          <div className="flex gap-3">
            <Button onClick={handleSubmit}>
              {type.id ? "Update Type" : "Create Type"}
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
