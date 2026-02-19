import { useEffect, useMemo, useState } from "react";
import Button from "@/components/Base/Button";
import { Dialog } from "@/components/Base/Headless";
import Table from "@/components/Base/Table";
import { FormInput, FormLabel } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { listFileAssets, uploadFileAsset, type FileAssetRecord } from "@/services/files";

type MediaPickerModalProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (files: FileAssetRecord[]) => void;
  title?: string;
  multiple?: boolean;
  selectedIds?: string[];
};

function formatBytes(value?: number | null) {
  if (!value || value <= 0) return "-";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function getFilePreviewUrl(file: FileAssetRecord) {
  if (file.public_url) return file.public_url;
  if (!file.storage_path) return null;
  const apiBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/v1").replace(/\/+$/, "");
  const root = apiBase.endsWith("/v1") ? apiBase.slice(0, -3) : apiBase;
  return `${root}/${file.storage_path.replace(/^\/+/, "")}`;
}

function getUploadMaxBytes() {
  const mb = Number(import.meta.env.VITE_UPLOAD_MAX_MB || 10);
  return Math.max(1, mb) * 1024 * 1024;
}

function getAllowedUploadMimeTypes() {
  const raw = String(import.meta.env.VITE_UPLOAD_ALLOWED_TYPES || "").trim();
  if (!raw) return null;
  return raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function MediaPickerModal({
  open,
  onClose,
  onSelect,
  title = "Media Library",
  multiple = false,
  selectedIds = [],
}: MediaPickerModalProps) {
  const [items, setItems] = useState<FileAssetRecord[]>([]);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  const selectedRows = useMemo(() => items.filter((item) => selected.includes(item.id)), [items, selected]);

  const load = async (term?: string) => {
    try {
      setBusy(true);
      const rows = await listFileAssets({
        include_usage: true,
        per_page: 200,
        search: term?.trim() || undefined,
      });
      setItems(rows);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load media files." });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setSelected(selectedIds);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const togglePick = (id: string) => {
    setSelected((prev) => {
      if (!multiple) {
        return prev[0] === id ? [] : [id];
      }
      return prev.includes(id) ? prev.filter((row) => row !== id) : [...prev, id];
    });
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      setBusy(true);
      const allowed = getAllowedUploadMimeTypes();
      const maxBytes = getUploadMaxBytes();
      const list = Array.from(files);
      for (const file of list) {
        if (file.size > maxBytes) {
          setNotice({ tone: "warning", message: `${file.name} exceeds max upload size.` });
          return;
        }
        if (allowed && allowed.length > 0 && !allowed.includes(String(file.type || "").toLowerCase())) {
          setNotice({ tone: "warning", message: `${file.name} has unsupported file type.` });
          return;
        }
      }
      for (const file of list) {
        await uploadFileAsset(file, { metadata: { source: "media_picker" } });
      }
      setNotice({ tone: "success", message: `${files.length} file(s) uploaded.` });
      await load(search);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Upload failed." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} size="xl">
      <Dialog.Panel>
        <div className="p-5 space-y-4">
          <div className="text-lg font-medium">{title}</div>
          {notice ? <AppNotice tone={notice.tone} message={notice.message} /> : null}

          <div className="grid grid-cols-12 gap-3 items-end">
            <div className="col-span-12 md:col-span-6">
              <FormLabel>Search existing files</FormLabel>
              <FormInput
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name..."
              />
            </div>
            <div className="col-span-12 md:col-span-2">
              <Button variant="outline-secondary" onClick={() => void load(search)} disabled={busy}>
                Find
              </Button>
            </div>
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Upload new file</FormLabel>
              <FormInput
                type="file"
                multiple={multiple}
                onChange={(event) => {
                  void uploadFiles(event.target.files);
                  event.target.value = "";
                }}
                disabled={busy}
              />
            </div>
          </div>

          <div className="border rounded-md max-h-[420px] overflow-auto">
            <Table className="table-report w-full" striped hover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th className="w-10"></Table.Th>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Size</Table.Th>
                  <Table.Th>Preview</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {items.map((item) => (
                  <Table.Tr key={item.id} onClick={() => togglePick(item.id)} className="cursor-pointer">
                    <Table.Td>
                      <input
                        type={multiple ? "checkbox" : "radio"}
                        checked={selected.includes(item.id)}
                        onChange={() => togglePick(item.id)}
                        onClick={(event) => event.stopPropagation()}
                      />
                    </Table.Td>
                    <Table.Td>
                      <div className="font-medium">{item.file_name}</div>
                      <div className="text-xs text-slate-500">{item.storage_path}</div>
                    </Table.Td>
                    <Table.Td>{item.mime_type || "-"}</Table.Td>
                    <Table.Td>{formatBytes(item.file_size)}</Table.Td>
                    <Table.Td>
                      {getFilePreviewUrl(item) ? (
                        <a
                          href={getFilePreviewUrl(item)!}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline"
                          onClick={(event) => event.stopPropagation()}
                        >
                          View
                        </a>
                      ) : (
                        "-"
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
                {!busy && items.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={5} className="text-slate-500">
                      No files found.
                    </Table.Td>
                  </Table.Tr>
                ) : null}
              </Table.Tbody>
            </Table>
          </div>

          {selectedRows.length > 0 ? (
            <div className="text-xs text-slate-500">
              Selected: {selectedRows.map((item) => item.file_name).join(", ")}
            </div>
          ) : null}
        </div>
        <div className="px-5 pb-5 flex justify-end gap-2">
          <Button variant="outline-secondary" onClick={onClose}>
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
      </Dialog.Panel>
    </Dialog>
  );
}

export default MediaPickerModal;
