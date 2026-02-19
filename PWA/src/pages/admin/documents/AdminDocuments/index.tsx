import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/Base/Button";
import Table from "@/components/Base/Table";
import { FormInput, FormSelect } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { listDocuments, type PortalDocument } from "@/services/documents";

function humanize(value?: string | null) {
  if (!value) return "-";
  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function AdminDocumentsPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<PortalDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const res = await listDocuments({
        search: search || undefined,
        category: category || undefined,
        status: status || undefined,
        per_page: 200,
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

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Documents Management</h2>
        <Button variant="primary" onClick={() => navigate("/app/admin/documents/new")}>Create Document</Button>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="mt-5 intro-y box p-5">
        <div className="grid grid-cols-1 gap-3 mb-4 md:grid-cols-4">
          <FormInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title/slug" />
          <FormSelect value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            <option value="policy">Policy</option>
            <option value="handbook">Handbook</option>
            <option value="guideline">Guideline</option>
          </FormSelect>
          <FormSelect value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </FormSelect>
          <Button variant="outline-primary" onClick={() => void load()} disabled={loading}>
            {loading ? "Loading..." : "Apply"}
          </Button>
        </div>

        <div className="overflow-auto max-h-[70vh]">
          <Table className="table-report w-full" striped hover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Title</Table.Th>
                <Table.Th>Category</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Version</Table.Th>
                <Table.Th>Ack Required</Table.Th>
                <Table.Th className="text-right">Action</Table.Th>
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
                  <Table.Td>{humanize(doc.status)}</Table.Td>
                  <Table.Td>{doc.version}</Table.Td>
                  <Table.Td>{doc.require_acknowledgement ? "Yes" : "No"}</Table.Td>
                  <Table.Td className="text-right">
                    <Button size="sm" variant="outline-primary" onClick={() => navigate(`/app/admin/documents/${doc.id}`)}>
                      Open
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
              {!loading && documents.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6} className="text-center text-slate-500">No documents found.</Table.Td>
                </Table.Tr>
              ) : null}
            </Table.Tbody>
          </Table>
        </div>
      </div>
    </>
  );
}

export default AdminDocumentsPage;
