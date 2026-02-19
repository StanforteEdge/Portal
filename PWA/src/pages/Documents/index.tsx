import { useEffect, useState } from "react";
import Button from "@/components/Base/Button";
import Table from "@/components/Base/Table";
import { FormInput, FormSelect } from "@/components/Base/Form";
import { Dialog } from "@/components/Base/Headless";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import {
  acknowledgeDocument,
  getDocument,
  listDocuments,
  type PortalDocument,
} from "@/services/documents";

function humanize(value?: string | null) {
  if (!value) return "-";
  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function DocumentsPage() {
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<PortalDocument[]>([]);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [category, setCategory] = useState("policy");
  const [status, setStatus] = useState("published");
  const [search, setSearch] = useState("");
  const [activeDocument, setActiveDocument] = useState<PortalDocument | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [reviewChecked, setReviewChecked] = useState(false);
  const [acknowledging, setAcknowledging] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await listDocuments({
        category: category || undefined,
        status: status || undefined,
        search: search || undefined,
        per_page: 100,
      });
      setDocuments(res.data);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load documents." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [category, status]);

  const onAcknowledge = async (doc: PortalDocument) => {
    try {
      setAcknowledging(true);
      await acknowledgeDocument(doc.id, { version: doc.version });
      setNotice({ tone: "success", message: `Acknowledged: ${doc.title}` });
      await load();
      if (activeDocument?.id === doc.id) {
        const fresh = await getDocument(doc.id);
        setActiveDocument(fresh);
      }
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to acknowledge document." });
    } finally {
      setAcknowledging(false);
    }
  };

  const openDocument = async (doc: PortalDocument) => {
    try {
      const fresh = await getDocument(doc.id);
      setActiveDocument(fresh);
      setReviewChecked(Boolean(fresh.my_acknowledgement));
      setOpenDialog(true);
    } catch (error: any) {
      setNotice({
        tone: "error",
        message: error?.response?.data?.error?.message || "Unable to open document.",
      });
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Documents</h2>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="p-4 mt-5 intro-y box">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <FormSelect value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            <option value="policy">Policy</option>
            <option value="handbook">Handbook</option>
            <option value="guideline">Guideline</option>
          </FormSelect>
          <FormSelect value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </FormSelect>
          <FormInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or slug"
          />
          <Button variant="outline-primary" onClick={() => void load()} disabled={loading}>
            {loading ? "Loading..." : "Apply"}
          </Button>
        </div>
      </div>

      <div className="p-5 mt-5 intro-y box">
        <div className="overflow-auto">
          <Table className="table-report w-full" striped hover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Title</Table.Th>
                <Table.Th>Category</Table.Th>
                <Table.Th>Version</Table.Th>
                <Table.Th>Effective Date</Table.Th>
                <Table.Th>Acknowledgement</Table.Th>
                <Table.Th>Action</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {documents.map((doc) => (
                <Table.Tr key={doc.id}>
                  <Table.Td>
                    <div className="font-medium">{doc.title}</div>
                    <div className="text-xs text-slate-500">{doc.slug}</div>
                  </Table.Td>
                  <Table.Td>{humanize(doc.category)}</Table.Td>
                  <Table.Td>{doc.version}</Table.Td>
                  <Table.Td>{doc.effective_date ? String(doc.effective_date).slice(0, 10) : "-"}</Table.Td>
                  <Table.Td>
                    {doc.require_acknowledgement
                      ? doc.my_acknowledgement
                        ? `Done (${String(doc.my_acknowledgement.acknowledged_at).slice(0, 10)})`
                        : "Pending"
                      : "Not required"}
                  </Table.Td>
                  <Table.Td>
                    <div className="flex gap-2">
                      {doc.file?.public_url ? (
                        <a className="btn btn-sm btn-outline-secondary" href={doc.file.public_url} target="_blank" rel="noreferrer">
                          View File
                        </a>
                      ) : null}
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        onClick={() => void openDocument(doc)}
                      >
                        Open
                      </Button>
                      {doc.require_acknowledgement && doc.my_acknowledgement ? (
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          onClick={() => void onAcknowledge(doc)}
                          disabled={acknowledging}
                        >
                          Re-acknowledge
                        </Button>
                      ) : null}
                    </div>
                  </Table.Td>
                </Table.Tr>
              ))}
              {!loading && documents.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6} className="text-center text-slate-500">
                    No documents found.
                  </Table.Td>
                </Table.Tr>
              ) : null}
            </Table.Tbody>
          </Table>
        </div>
      </div>

      <Dialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setActiveDocument(null);
          setReviewChecked(false);
        }}
        size="xl"
      >
        <Dialog.Panel>
          <Dialog.Title className="text-base font-medium">
            {activeDocument?.title || "Document"}
          </Dialog.Title>
          <Dialog.Description className="mt-3 space-y-4 max-h-[65vh] overflow-auto">
            {activeDocument?.content_html ? (
              <div
                className="prose max-w-none text-sm"
                dangerouslySetInnerHTML={{ __html: activeDocument.content_html }}
              />
            ) : null}
            {activeDocument?.file?.public_url ? (
              <div>
                <div className="mb-2 text-xs text-slate-500">
                  Attached file: {activeDocument.file.file_name}
                </div>
                <iframe
                  src={activeDocument.file.public_url}
                  title={activeDocument.file.file_name}
                  className="w-full h-[420px] rounded border border-slate-200"
                />
                <a
                  className="inline-block mt-2 text-primary text-sm hover:underline"
                  href={activeDocument.file.public_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open file in new tab
                </a>
              </div>
            ) : null}
            {!activeDocument?.content_html && !activeDocument?.file?.public_url ? (
              <div className="text-sm text-slate-500">No document body or attachment found.</div>
            ) : null}
          </Dialog.Description>
          <Dialog.Footer className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={reviewChecked}
                onChange={(e) => setReviewChecked(e.target.checked)}
              />
              I have reviewed this document
            </label>
            <div className="flex gap-2">
              <Button
                variant="outline-secondary"
                onClick={() => {
                  setOpenDialog(false);
                  setActiveDocument(null);
                  setReviewChecked(false);
                }}
              >
                Close
              </Button>
              {activeDocument?.require_acknowledgement ? (
                <Button
                  variant={activeDocument.my_acknowledgement ? "outline-secondary" : "primary"}
                  disabled={!reviewChecked || acknowledging}
                  onClick={() => activeDocument && void onAcknowledge(activeDocument)}
                >
                  {acknowledging
                    ? "Saving..."
                    : activeDocument.my_acknowledgement
                    ? "Re-acknowledge"
                    : "Acknowledge"}
                </Button>
              ) : null}
            </div>
          </Dialog.Footer>
        </Dialog.Panel>
      </Dialog>
    </>
  );
}

export default DocumentsPage;
