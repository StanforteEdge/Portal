import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/Base/Button";
import Table from "@/components/Base/Table";
import { FormInput } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { listFormsForManagement, type FormRecord } from "@/services/forms";

function AdminFormsPage() {
  const navigate = useNavigate();
  const [forms, setForms] = useState<FormRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await listFormsForManagement({ search: search || undefined, include_inactive: true });
      setForms(data);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load forms." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [search]);

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Forms Management</h2>
        <Button variant="primary" onClick={() => navigate("/app/admin/forms/new")}>Create Form</Button>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="mt-5 intro-y box p-5">
        <div className="mb-4">
          <FormInput type="text" placeholder="Search forms" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="overflow-auto max-h-[70vh]">
          <Table className="table-report w-full" striped hover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Module</Table.Th>
                <Table.Th>Storage</Table.Th>
                <Table.Th>Fields</Table.Th>
                <Table.Th>Assignments</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th className="text-right">Action</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {forms.map((form) => (
                <Table.Tr key={form.id}>
                  <Table.Td>
                    <div className="font-medium">{form.name}</div>
                    <div className="text-xs text-slate-500">{form.description || "No description"}</div>
                  </Table.Td>
                  <Table.Td>{form.module}</Table.Td>
                  <Table.Td>{form.storage_type || "json"}</Table.Td>
                  <Table.Td>{form.fields?.length || 0}</Table.Td>
                  <Table.Td>{form.assignments?.length || 0}</Table.Td>
                  <Table.Td className={form.is_active ? "text-success" : "text-slate-500"}>
                    {form.is_active ? "Active" : "Inactive"}
                  </Table.Td>
                  <Table.Td className="text-right">
                    <Button size="sm" variant="outline-primary" onClick={() => navigate(`/app/admin/forms/${form.id}`)}>
                      Open
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
              {!loading && forms.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={7} className="text-center text-slate-500">No forms found.</Table.Td>
                </Table.Tr>
              ) : null}
            </Table.Tbody>
          </Table>
        </div>
      </div>
    </>
  );
}

export default AdminFormsPage;
