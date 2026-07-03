import { useState, useEffect } from "react";
import { Dialog } from "@/components/Base/Headless";
import Button from "@/components/Base/Button";
import { FormTextarea } from "@/components/Base/Form";

interface ActionCommentModalProps {
  open: boolean;
  title: string;
  suggestion: string;
  confirmLabel?: string;
  confirmVariant?: "primary" | "outline-danger" | "outline-warning";
  busy?: boolean;
  onClose: () => void;
  onConfirm: (comment: string) => void;
}

function ActionCommentModal({
  open,
  title,
  suggestion,
  confirmLabel = "Confirm",
  confirmVariant = "primary",
  busy = false,
  onClose,
  onConfirm,
}: ActionCommentModalProps) {
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (open) setComment("");
  }, [open]);

  const handleConfirm = () => {
    const trimmed = comment.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <Dialog.Panel>
        <div className="p-5 space-y-4">
          <div className="text-lg font-medium">{title}</div>
          <div>
            <FormTextarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Type your comment..."
              className="w-full"
            />
            <button
              type="button"
              onClick={() => setComment(suggestion)}
              className="mt-2 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <span className="text-slate-400">Use:</span>
              <span className="italic">{suggestion}</span>
            </button>
          </div>
        </div>
        <div className="px-5 pb-5 flex justify-end gap-2">
          <Button variant="outline-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant={confirmVariant}
            onClick={handleConfirm}
            disabled={!comment.trim() || busy}
          >
            {busy ? "Working..." : confirmLabel}
          </Button>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}

export default ActionCommentModal;
