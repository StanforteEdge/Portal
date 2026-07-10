import { useState, useEffect } from "react";
import { Button, TextField, TextAreaField, SelectField, useToast } from "@/shared";
import { SlideOver, SlideOverHeader, SlideOverContent, SlideOverFooter } from "@/shared/components/ui/SlideOver";
import { documentApi } from "@/shared/lib/core";
import { useAuth } from "@/shared/context/AuthProvider";

type Props = {
  documentRecord?: any; // true for create, or object for edit
  onClose: () => void;
  onSaved: () => void;
};

export default function DocumentSlideOver({ documentRecord, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [contentHtml, setContentHtml] = useState("");
  const [requireAcknowledgement, setRequireAcknowledgement] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isEdit = typeof documentRecord === "object" && documentRecord !== null;

  // Enforce HR/Admin constraints
  const userPerms = user?.permissions ?? [];
  const isHrOrAdmin = userPerms.includes('*') || userPerms.includes('hr.manage') || userPerms.includes('settings.manage');

  useEffect(() => {
    if (isEdit) {
      setTitle(documentRecord.title || "");
      setCategory(documentRecord.category || "general");
      setContentHtml(documentRecord.content_html || "");
      setRequireAcknowledgement(documentRecord.require_acknowledgement || false);
    } else {
      setTitle("");
      setCategory("general");
      setContentHtml("");
      setRequireAcknowledgement(false);
    }
  }, [documentRecord]);

  async function handleSave() {
    if (!title.trim()) {
      showToast({ tone: "warning", title: "Validation", message: "Title is required." });
      return;
    }
    if (!contentHtml.trim()) {
      showToast({ tone: "warning", title: "Validation", message: "Document content is required." });
      return;
    }

    try {
      setSubmitting(true);
      const payload: any = {
        title: title.trim(),
        category,
        content_html: contentHtml,
        require_acknowledgement: requireAcknowledgement,
      };

      if (isEdit) {
        await documentApi.update(documentRecord.id, payload);
        showToast({ tone: "success", title: "Saved", message: "Document updated successfully." });
      } else {
        await documentApi.create(payload);
        showToast({ tone: "success", title: "Created", message: "Document created successfully." });
      }
      onSaved();
    } catch (err: any) {
      showToast({ tone: "danger", title: "Failed", message: err?.message || "Failed to save document" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SlideOver open={documentRecord !== false} onClose={onClose}>
      <SlideOverHeader onClose={onClose}>
        <h2 className="text-lg font-semibold text-slate-900">
          {isEdit ? `Edit Document: ${documentRecord.title}` : "Create Document"}
        </h2>
      </SlideOverHeader>
      <SlideOverContent className="space-y-4">
        <TextField
          label="Document Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Q3 Dev Workflow Guide"
          required
        />
        
        <SelectField
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="general">General</option>
          <option value="wiki">Wiki / Guide</option>
          <option value="handbook">Handbook</option>
          {isHrOrAdmin && <option value="policy">Policy (Official)</option>}
        </SelectField>

        {isHrOrAdmin && (
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="requireAcknowledgement"
              checked={requireAcknowledgement}
              onChange={(e) => setRequireAcknowledgement(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            />
            <label htmlFor="requireAcknowledgement" className="text-sm font-medium text-slate-700 select-none cursor-pointer">
              Require Staff Read Acknowledgement
            </label>
          </div>
        )}

        <TextAreaField
          label="Content (Markdown/HTML supported)"
          value={contentHtml}
          onChange={(e) => setContentHtml(e.target.value)}
          placeholder="Write the document content here..."
          rows={12}
          required
        />
      </SlideOverContent>
      <SlideOverFooter>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={submitting}>
            {submitting ? "Saving..." : "Save Document"}
          </Button>
        </div>
      </SlideOverFooter>
    </SlideOver>
  );
}
