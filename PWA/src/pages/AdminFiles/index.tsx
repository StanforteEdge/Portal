import { useEffect, useState } from "react";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import { FormInput, FormLabel } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { deleteFileAsset, listFileAssets, uploadFileAsset } from "@/services/files";

function AdminFilesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      setBusy(true);
      const data = await listFileAssets({ search: search || undefined, include_usage: true, per_page: 200 });
      setItems(data || []);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load files." });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onUpload = async (file: File | null) => {
    if (!file) return;
    try {
      setBusy(true);
      await uploadFileAsset(file, { metadata: { source: "media_library" } });
      setNotice({ tone: "success", message: "File uploaded." });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Upload failed." });
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (id: string) => {
    try {
      setBusy(true);
      await deleteFileAsset(id);
      setNotice({ tone: "success", message: "File deleted." });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Cannot delete this file." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Media Library</h2>
      </div>
      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="box mt-5 p-5 space-y-4">
        <div className="grid grid-cols-12 gap-4 items-end">
          <div className="col-span-12 md:col-span-6">
            <FormLabel>Search Files</FormLabel>
            <FormInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by file name..." />
          </div>
          <div className="col-span-12 md:col-span-3">
            <Button onClick={() => void load()} disabled={busy}>
              <Lucide icon="Search" className="w-4 h-4 mr-1" />
              Find
            </Button>
          </div>
          <div className="col-span-12 md:col-span-3">
            <FormLabel>Upload New</FormLabel>
            <input type="file" onChange={(e) => void onUpload(e.target.files?.[0] || null)} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Storage Path</th>
                <th>Usage</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-slate-500">
                    No files found.
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.id}>
                    <td>{row.fileName || row.file_name}</td>
                    <td>{row.mimeType || row.mime_type || "-"}</td>
                    <td className="text-xs">{row.storagePath || row.storage_path}</td>
                    <td>
                      {row.usage?.attached
                        ? `Attached (${row.usage.request_items || 0} request, ${row.usage.pv_evidence || 0} pv, ${row.usage.retirement_refs || 0} retirement)`
                        : "Not attached"}
                    </td>
                    <td>
                      <Button
                        variant="danger"
                        onClick={() => void onDelete(row.id)}
                        disabled={busy || Boolean(row.usage?.attached)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default AdminFilesPage;

