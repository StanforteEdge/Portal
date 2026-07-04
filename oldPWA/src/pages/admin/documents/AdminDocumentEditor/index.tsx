import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/Base/Button";
import Table from "@/components/Base/Table";
import Lucide from "@/components/Base/Lucide";
import { Dialog } from "@/components/Base/Headless";
import { FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { createDocument, getDocument, listDocumentAcknowledgements, updateDocument } from "@/services/documents";
import { listFileAssets, type FileAssetRecord } from "@/services/files";
import { listEntityTags, replaceEntityTags, type TagTerm } from "@/services/taxonomy";
import TagPicker from "@/components/Tags/TagPicker";
import MediaPickerModal from "@/components/Media/MediaPickerModal";

type PreviewFile = {
  file_name: string;
  mime_type: string | null;
  public_url: string | null;
};

function canPreviewInline(file: PreviewFile | null) {
  const mime = String(file?.mime_type || "").toLowerCase();
  return mime.startsWith("image/") || mime === "application/pdf" || mime.startsWith("text/");
}

function AdminDocumentEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isCreate = !id;
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [files, setFiles] = useState<FileAssetRecord[]>([]);
  const [acks, setAcks] = useState<any[]>([]);
  const [tags, setTags] = useState<TagTerm[]>([]);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    category: "policy",
    status: "draft",
    version: "1.0",
    effective_date: "",
    content_html: "",
    file_id: "",
    require_acknowledgement: true,
  });

  const load = async () => {
    try {
      setLoading(true);
      const filesRes = await listFileAssets({ per_page: 200, file_type: "documents" });
      setFiles(filesRes || []);

      if (!id) return;
      const doc = await getDocument(id);
      setForm({
        title: doc.title || "",
        slug: doc.slug || "",
        category: doc.category || "policy",
        status: doc.status || "draft",
        version: doc.version || "1.0",
        effective_date: doc.effective_date ? String(doc.effective_date).slice(0, 10) : "",
        content_html: doc.content_html || "",
        file_id: doc.file?.id || "",
        require_acknowledgement: Boolean(doc.require_acknowledgement),
      });
      const ackRes = await listDocumentAcknowledgements(id, { per_page: 100 });
      setAcks(ackRes.data || []);
      const tagPayload = await listEntityTags("document", id, "document_tags").catch(() => ({ tags: [] as TagTerm[] }));
      setTags(tagPayload.tags || []);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load document." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  const onSave = async () => {
    try {
      setSaving(true);
      setNotice(null);
      if (!form.title.trim()) {
        setNotice({ tone: "warning", message: "Title is required." });
        return;
      }
      if (!form.content_html && !form.file_id) {
        setNotice({ tone: "warning", message: "Add content_html or select a document file." });
        return;
      }

      const payload = {
        ...form,
        slug: form.slug || undefined,
        effective_date: form.effective_date || undefined,
        content_html: form.content_html || undefined,
        file_id: form.file_id || undefined,
      };

      const saved = isCreate ? await createDocument(payload) : await updateDocument(id!, payload);
      const existingTermIds = tags.filter((tag) => !String(tag.id).startsWith("new:")).map((tag) => tag.id);
      const newLabels = tags.filter((tag) => String(tag.id).startsWith("new:")).map((tag) => tag.label);
      await replaceEntityTags("document", saved.id, "document_tags", {
        term_ids: existingTermIds,
        labels: newLabels,
      }).catch(() => undefined);
      setNotice({ tone: "success", message: "Document saved." });
      if (isCreate) navigate(`/appOld/admin/documents/${saved.id}`, { replace: true });
      else await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save document." });
    } finally {
      setSaving(false);
    }
  };

  const selectedFile = files.find((file) => file.id === form.file_id) || null;

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">{isCreate ? "Create Document" : "Edit Document"}</h2>
        <Button variant="outline-secondary" onClick={() => navigate("/appOld/admin/documents")}>Back</Button>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="p-5 mt-5 intro-y box">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div><FormLabel>Title</FormLabel><FormInput value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} /></div>
          <div><FormLabel>Slug</FormLabel><FormInput value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} placeholder="auto if blank" /></div>
          <div><FormLabel>Category</FormLabel><FormSelect value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}><option value="policy">Policy</option><option value="handbook">Handbook</option><option value="guideline">Guideline</option><option value="notice">Notice</option></FormSelect></div>
          <div><FormLabel>Status</FormLabel><FormSelect value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></FormSelect></div>
          <div><FormLabel>Version</FormLabel><FormInput value={form.version} onChange={(e) => setForm((p) => ({ ...p, version: e.target.value }))} /></div>
          <div><FormLabel>Effective Date</FormLabel><FormInput type="date" value={form.effective_date} onChange={(e) => setForm((p) => ({ ...p, effective_date: e.target.value }))} /></div>
          <div className="md:col-span-2">
            <FormLabel>Attached File (optional)</FormLabel>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline-primary" onClick={() => setShowMediaPicker(true)}>
                <Lucide icon="FolderOpen" className="w-4 h-4 mr-1" /> Media Library
              </Button>
              {selectedFile?.public_url ? (
                <Button
                  variant="outline-secondary"
                  onClick={() =>
                    setPreviewFile({
                      file_name: selectedFile.file_name,
                      mime_type: selectedFile.mime_type,
                      public_url: selectedFile.public_url,
                    })
                  }
                >
                  <Lucide icon="Eye" className="w-4 h-4 mr-1" /> Preview
                </Button>
              ) : null}
              {form.file_id ? (
                <Button variant="soft-danger" onClick={() => setForm((p) => ({ ...p, file_id: "" }))}>
                  <Lucide icon="XCircle" className="w-4 h-4 mr-1" /> Clear
                </Button>
              ) : null}
            </div>
            <div className="mt-3 rounded-md border p-3 text-sm">
              {selectedFile ? (
                <>
                  <div className="font-medium">{selectedFile.file_name}</div>
                  <div className="text-slate-500">{selectedFile.mime_type || "Unknown type"}</div>
                  {selectedFile.public_url ? (
                    <a href={selectedFile.public_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-primary hover:underline">
                      Open in New Tab
                    </a>
                  ) : null}
                </>
              ) : (
                <div className="text-slate-500">No file selected.</div>
              )}
            </div>
          </div>
          <div className="md:col-span-2"><FormLabel>HTML Content (optional)</FormLabel><FormTextarea rows={8} value={form.content_html} onChange={(e) => setForm((p) => ({ ...p, content_html: e.target.value }))} /></div>
          <div><FormLabel>Acknowledgement Required</FormLabel><FormSelect value={form.require_acknowledgement ? "true" : "false"} onChange={(e) => setForm((p) => ({ ...p, require_acknowledgement: e.target.value === "true" }))}><option value="true">Yes</option><option value="false">No</option></FormSelect></div>
          <div className="md:col-span-2">
            <FormLabel>Tags</FormLabel>
            <TagPicker taxonomyKey="document_tags" value={tags} onChange={setTags} placeholder="Type a tag and press Enter" />
          </div>
        </div>

        <div className="mt-4">
          <Button variant="primary" onClick={() => void onSave()} disabled={saving || loading}>{saving ? "Saving..." : "Save Document"}</Button>
        </div>
      </div>

      {!isCreate ? (
        <div className="p-5 mt-5 intro-y box">
          <h3 className="mb-3 text-base font-medium">Acknowledgements</h3>
          <div className="overflow-auto">
            <Table className="table-report w-full" striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>User</Table.Th>
                  <Table.Th>Version</Table.Th>
                  <Table.Th>Acknowledged At</Table.Th>
                  <Table.Th>IP</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {acks.map((row) => (
                  <Table.Tr key={row.id}>
                    <Table.Td>{`${row.user?.first_name || ""} ${row.user?.last_name || ""}`.trim() || row.user?.email || row.user_id}</Table.Td>
                    <Table.Td>{row.version}</Table.Td>
                    <Table.Td>{row.acknowledged_at ? String(row.acknowledged_at).slice(0, 19).replace("T", " ") : "-"}</Table.Td>
                    <Table.Td>{row.ip_address || "-"}</Table.Td>
                  </Table.Tr>
                ))}
                {acks.length === 0 ? (
                  <Table.Tr><Table.Td colSpan={4} className="text-center text-slate-500">No acknowledgements yet.</Table.Td></Table.Tr>
                ) : null}
              </Table.Tbody>
            </Table>
          </div>
        </div>
      ) : null}

      <MediaPickerModal
        open={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(selected) => {
          const file = selected[0];
          if (!file) return;
          setFiles((prev) => {
            const exists = prev.some((row) => row.id === file.id);
            return exists ? prev : [file, ...prev];
          });
          setForm((p) => ({ ...p, file_id: file.id }));
        }}
        title="Select Document File"
        multiple={false}
        selectedIds={form.file_id ? [form.file_id] : []}
      />

      <Dialog open={Boolean(previewFile)} onClose={() => setPreviewFile(null)}>
        <Dialog.Panel className="h-screen w-screen max-w-none rounded-none bg-black/95 shadow-none">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-4 px-6 py-4 text-white">
              <div>
                <div className="text-lg font-medium">File Preview</div>
                <div className="text-sm text-slate-300">{previewFile?.file_name || "-"}</div>
              </div>
              <div className="flex items-center gap-4">
                {previewFile?.public_url ? (
                  <a href={previewFile.public_url} target="_blank" rel="noreferrer" className="text-sm text-white/90 hover:text-white hover:underline">
                    Open in New Tab
                  </a>
                ) : null}
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                  onClick={() => setPreviewFile(null)}
                >
                  <Lucide icon="XCircle" className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 px-4 pb-4 pt-2">
              {previewFile?.public_url ? (
                canPreviewInline(previewFile) ? (
                  String(previewFile.mime_type || "").toLowerCase().startsWith("image/") ? (
                    <div className="flex h-full items-center justify-center">
                      <img src={previewFile.public_url} alt={previewFile.file_name} className="max-h-full max-w-full object-contain" />
                    </div>
                  ) : (
                    <iframe title={previewFile.file_name} src={previewFile.public_url} className="h-full w-full bg-white" />
                  )
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-300">
                    This file cannot be previewed inline. Use Open in New Tab.
                  </div>
                )
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-300">No preview available.</div>
              )}
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    </>
  );
}

export default AdminDocumentEditorPage;
