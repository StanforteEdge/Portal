import { useEffect, useId, useMemo, useState } from "react";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { TextField } from "../ui/fields";

export type MediaPickerItem = {
  id: string;
  file_name: string;
  mime_type: string | null;
  file_size?: number | null;
  storage_path?: string;
  public_url?: string | null;
  usage?: {
    attached: boolean;
    request_items: number;
    pv_evidence: number;
    retirement_refs: number;
  };
};

export type MediaPickerModalProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (files: MediaPickerItem[]) => void;
  loadFiles: (search?: string) => Promise<MediaPickerItem[]>;
  uploadFiles?: (files: FileList) => Promise<void>;
  title?: string;
  multiple?: boolean;
  selectedIds?: string[];
  previewUrl?: (file: MediaPickerItem) => string | null;
  emptyMessage?: string;
};

function formatBytes(value?: number | null) {
  if (!value || value <= 0) return "-";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaPickerModal({
  open,
  onClose,
  onSelect,
  loadFiles,
  uploadFiles,
  title = "Media Library",
  multiple = false,
  selectedIds = [],
  previewUrl,
  emptyMessage = "No files found.",
}: MediaPickerModalProps) {
  const searchId = useId();
  const uploadId = useId();
  const [items, setItems] = useState<MediaPickerItem[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>("");

  const selectedRows = useMemo(() => items.filter((item) => selected.includes(item.id)), [items, selected]);

  async function load(term?: string) {
    try {
      setBusy(true);
      setError("");
      const rows = await loadFiles(term?.trim() || undefined);
      setItems(rows);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load files.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    setSelected(selectedIds);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleUpload(files: FileList | null) {
    if (!files?.length || !uploadFiles) return;
    try {
      setBusy(true);
      setError("");
      await uploadFiles(files);
      await load(search);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  function togglePick(id: string) {
    setSelected((prev) => {
      if (!multiple) return prev[0] === id ? [] : [id];
      return prev.includes(id) ? prev.filter((row) => row !== id) : [...prev, id];
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 px-4 py-6">
      <button type="button" aria-label="Close media picker" className="absolute inset-0" onClick={onClose} />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="media-picker-title"
        className="relative z-[91] flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-card"
      >
        <div className="border-b border-slate-100 px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-slate-500">Media Library</p>
              <h2 id="media-picker-title" className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Search existing uploads, upload new files, and reselect previously uploaded assets.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200"
            >
              <Icon name="close" />
            </button>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <TextField
                label="Search existing files"
                id={searchId}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name..."
              />
            </div>
            <div className="flex items-end gap-3 lg:col-span-7">
              <Button variant="secondary" onClick={() => void load(search)} disabled={busy}>
                Find
              </Button>
              {uploadFiles ? (
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-brand-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
                  <Icon name="upload" className="text-[18px]" />
                  Upload new
                  <input
                    id={uploadId}
                    type="file"
                    className="sr-only"
                    multiple={multiple}
                    onChange={(event) => {
                      void handleUpload(event.target.files);
                      event.target.value = "";
                    }}
                    disabled={busy}
                  />
                </label>
              ) : null}
            </div>
          </div>

          {error ? <div className="mt-4 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div> : null}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {items.length ? (
            <div className="grid gap-3">
              {items.map((item) => {
                const isSelected = selected.includes(item.id);
                const preview = previewUrl?.(item) || item.public_url || null;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => togglePick(item.id)}
                    className={`flex w-full items-center gap-4 rounded-[22px] border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10 ${
                      isSelected ? "border-brand-300 bg-brand-50" : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        isSelected ? "border-brand-900 bg-brand-900 text-white" : "border-slate-300 bg-white"
                      }`}
                    >
                      {isSelected ? <Icon name="check" className="text-[14px]" /> : null}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-950">{item.file_name}</p>
                        {item.usage?.attached ? (
                          <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-warning">
                            Attached
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 truncate text-xs text-slate-500">{item.storage_path || item.mime_type || "-"}</p>
                    </div>
                    <div className="hidden text-right text-xs text-slate-500 md:block">
                      <div>{item.mime_type || "-"}</div>
                      <div>{formatBytes(item.file_size)}</div>
                    </div>
                    <div className="shrink-0">
                      {preview ? (
                        <a
                          href={preview}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Icon name="visibility" className="text-[14px]" />
                          View
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-[240px] items-center justify-center">
              <div className="max-w-md text-center text-sm text-slate-500">{busy ? "Loading files..." : emptyMessage}</div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Selected: {selectedRows.length ? selectedRows.map((item) => item.file_name).join(", ") : "None"}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  onSelect(selectedRows);
                  onClose();
                }}
                disabled={selectedRows.length === 0}
              >
                Use Selected
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
