import { useEffect, useMemo, useState } from "react";
import Button from "@/components/Base/Button";
import Table from "@/components/Base/Table";
import { Dialog } from "@/components/Base/Headless";
import { FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { listDocuments, type PortalDocument } from "@/services/documents";
import { createPolicy, listPolicies, type PolicyRecord, resolvePolicy, updatePolicy } from "@/services/policies";
import { formatDisplayDate } from "@/utils/formatting";

const emptyForm = {
  id: "",
  module: "",
  policy_key: "",
  scope_type: "global",
  scope_id: "",
  priority: "100",
  is_active: true,
  document_id: "",
  document_version: "",
  require_acknowledgement: false,
  effective_from: "",
  effective_to: "",
  config_json: "{\n  \n}",
};

function AdminPoliciesPage() {
  const [rows, setRows] = useState<PolicyRecord[]>([]);
  const [documents, setDocuments] = useState<PortalDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [resolveForm, setResolveForm] = useState({
    module: "",
    policy_key: "",
    organization_id: "",
    team_id: "",
    staff_type: "",
    user_id: "",
  });
  const [resolveResult, setResolveResult] = useState<null | { merged_config: Record<string, unknown>; applied_count: number }>(
    null
  );

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => row.module.toLowerCase().includes(q) || row.policy_key.toLowerCase().includes(q));
  }, [rows, search]);

  const load = async () => {
    try {
      setLoading(true);
      const [policiesRes, docsRes] = await Promise.all([
        listPolicies({ per_page: 200 }),
        listDocuments({ per_page: 100, status: "published" }),
      ]);
      setRows(policiesRes.data ?? []);
      setDocuments(docsRes.data ?? []);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load policies." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (row: PolicyRecord) => {
    setForm({
      id: row.id,
      module: row.module,
      policy_key: row.policy_key,
      scope_type: row.scope_type,
      scope_id: row.scope_id ?? "",
      priority: String(row.priority),
      is_active: row.is_active,
      document_id: row.document_id ?? "",
      document_version: row.document_version ?? "",
      require_acknowledgement: row.require_acknowledgement,
      effective_from: row.effective_from ? row.effective_from.slice(0, 10) : "",
      effective_to: row.effective_to ? row.effective_to.slice(0, 10) : "",
      config_json: JSON.stringify(row.config_json ?? {}, null, 2),
    });
    setShowForm(true);
  };

  const savePolicy = async () => {
    let configJson: Record<string, unknown> = {};
    try {
      configJson = JSON.parse(form.config_json || "{}");
    } catch {
      setNotice({ tone: "warning", message: "Config JSON is invalid." });
      return;
    }

    if (!form.module.trim() || !form.policy_key.trim()) {
      setNotice({ tone: "warning", message: "Module and policy key are required." });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        module: form.module.trim().toLowerCase(),
        policy_key: form.policy_key.trim().toLowerCase(),
        scope_type: form.scope_type,
        scope_id: form.scope_id.trim() || undefined,
        priority: Number(form.priority || 100),
        is_active: form.is_active,
        document_id: form.document_id || undefined,
        document_version: form.document_version.trim() || undefined,
        require_acknowledgement: form.require_acknowledgement,
        effective_from: form.effective_from || undefined,
        effective_to: form.effective_to || undefined,
        config_json: configJson,
      };

      if (form.id) await updatePolicy(form.id, payload);
      else await createPolicy(payload);

      setShowForm(false);
      setNotice({ tone: "success", message: form.id ? "Policy updated." : "Policy created." });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save policy." });
    } finally {
      setSaving(false);
    }
  };

  const runResolve = async () => {
    if (!resolveForm.module.trim() || !resolveForm.policy_key.trim()) {
      setNotice({ tone: "warning", message: "Module and policy key are required for resolve." });
      return;
    }
    try {
      const result = await resolvePolicy({
        module: resolveForm.module.trim().toLowerCase(),
        policy_key: resolveForm.policy_key.trim().toLowerCase(),
        context: {
          organization_id: resolveForm.organization_id || undefined,
          team_id: resolveForm.team_id || undefined,
          staff_type: resolveForm.staff_type || undefined,
          user_id: resolveForm.user_id || undefined,
        },
      });
      setResolveResult({
        merged_config: result.merged_config ?? {},
        applied_count: result.applied?.length ?? 0,
      });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to resolve policy." });
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Policies</h2>
        <div className="flex gap-2">
          <Button variant="primary" onClick={openCreate}>New Policy</Button>
          <Button variant="outline-secondary" onClick={() => void load()} disabled={loading}>Refresh</Button>
        </div>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="box p-5 mt-5">
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-4">
            <FormLabel>Search</FormLabel>
            <FormInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="module or policy key" />
          </div>
          <div className="col-span-12 md:col-span-8">
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-12 md:col-span-4">
                <FormLabel>Resolve Module</FormLabel>
                <FormInput value={resolveForm.module} onChange={(e) => setResolveForm((p) => ({ ...p, module: e.target.value }))} />
              </div>
              <div className="col-span-12 md:col-span-4">
                <FormLabel>Resolve Key</FormLabel>
                <FormInput value={resolveForm.policy_key} onChange={(e) => setResolveForm((p) => ({ ...p, policy_key: e.target.value }))} />
              </div>
              <div className="col-span-12 md:col-span-4 flex items-end">
                <Button variant="outline-primary" onClick={() => void runResolve()}>Resolve</Button>
              </div>
            </div>
          </div>
        </div>

        {resolveResult ? (
          <div className="mt-4 text-sm bg-slate-100 rounded p-3">
            <div>Applied policies: {resolveResult.applied_count}</div>
            <pre className="text-xs mt-2 overflow-auto">{JSON.stringify(resolveResult.merged_config, null, 2)}</pre>
          </div>
        ) : null}
      </div>

      <div className="box p-5 mt-5 overflow-x-auto">
        <Table className="table-report" striped hover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Module</Table.Th>
              <Table.Th>Policy Key</Table.Th>
              <Table.Th>Scope</Table.Th>
              <Table.Th>Priority</Table.Th>
              <Table.Th>Document</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Updated</Table.Th>
              <Table.Th className="text-right">Action</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredRows.map((row) => (
              <Table.Tr key={row.id}>
                <Table.Td>{row.module}</Table.Td>
                <Table.Td>{row.policy_key}</Table.Td>
                <Table.Td>{row.scope_type}{row.scope_id ? `:${row.scope_id}` : ""}</Table.Td>
                <Table.Td>{row.priority}</Table.Td>
                <Table.Td>{row.document?.title || "-"}</Table.Td>
                <Table.Td className={row.is_active ? "text-success" : "text-slate-500"}>{row.is_active ? "Active" : "Inactive"}</Table.Td>
                <Table.Td>{formatDisplayDate(row.updated_at)}</Table.Td>
                <Table.Td className="text-right">
                  <Button size="sm" variant="outline-secondary" onClick={() => openEdit(row)}>Edit</Button>
                </Table.Td>
              </Table.Tr>
            ))}
            {!loading && filteredRows.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={8} className="text-center text-slate-500 py-6">No policies found.</Table.Td>
              </Table.Tr>
            ) : null}
          </Table.Tbody>
        </Table>
      </div>

      <Dialog open={showForm} onClose={() => setShowForm(false)}>
        <Dialog.Panel className="max-w-3xl">
          <div className="p-5 space-y-3">
            <div className="text-lg font-medium">{form.id ? "Edit Policy" : "Create Policy"}</div>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-12 md:col-span-4">
                <FormLabel>Module</FormLabel>
                <FormInput value={form.module} onChange={(e) => setForm((p) => ({ ...p, module: e.target.value }))} />
              </div>
              <div className="col-span-12 md:col-span-4">
                <FormLabel>Policy Key</FormLabel>
                <FormInput value={form.policy_key} onChange={(e) => setForm((p) => ({ ...p, policy_key: e.target.value }))} />
              </div>
              <div className="col-span-12 md:col-span-4">
                <FormLabel>Priority</FormLabel>
                <FormInput type="number" value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-12 md:col-span-4">
                <FormLabel>Scope Type</FormLabel>
                <FormSelect value={form.scope_type} onChange={(e) => setForm((p) => ({ ...p, scope_type: e.target.value }))}>
                  <option value="global">global</option>
                  <option value="organization">organization</option>
                  <option value="team">team</option>
                  <option value="staff_type">staff_type</option>
                  <option value="user">user</option>
                </FormSelect>
              </div>
              <div className="col-span-12 md:col-span-4">
                <FormLabel>Scope ID</FormLabel>
                <FormInput value={form.scope_id} onChange={(e) => setForm((p) => ({ ...p, scope_id: e.target.value }))} />
              </div>
              <div className="col-span-12 md:col-span-4">
                <FormLabel>Status</FormLabel>
                <FormSelect value={form.is_active ? "true" : "false"} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.value === "true" }))}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </FormSelect>
              </div>
            </div>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-12 md:col-span-4">
                <FormLabel>Document</FormLabel>
                <FormSelect value={form.document_id} onChange={(e) => setForm((p) => ({ ...p, document_id: e.target.value }))}>
                  <option value="">None</option>
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.title}
                    </option>
                  ))}
                </FormSelect>
              </div>
              <div className="col-span-12 md:col-span-4">
                <FormLabel>Document Version</FormLabel>
                <FormInput value={form.document_version} onChange={(e) => setForm((p) => ({ ...p, document_version: e.target.value }))} />
              </div>
              <div className="col-span-12 md:col-span-4">
                <FormLabel>Require Ack</FormLabel>
                <FormSelect
                  value={form.require_acknowledgement ? "true" : "false"}
                  onChange={(e) => setForm((p) => ({ ...p, require_acknowledgement: e.target.value === "true" }))}
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </FormSelect>
              </div>
            </div>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-12 md:col-span-6">
                <FormLabel>Effective From</FormLabel>
                <FormInput type="date" value={form.effective_from} onChange={(e) => setForm((p) => ({ ...p, effective_from: e.target.value }))} />
              </div>
              <div className="col-span-12 md:col-span-6">
                <FormLabel>Effective To</FormLabel>
                <FormInput type="date" value={form.effective_to} onChange={(e) => setForm((p) => ({ ...p, effective_to: e.target.value }))} />
              </div>
            </div>
            <div>
              <FormLabel>Config JSON</FormLabel>
              <FormTextarea rows={10} value={form.config_json} onChange={(e) => setForm((p) => ({ ...p, config_json: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline-secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => void savePolicy()} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    </>
  );
}

export default AdminPoliciesPage;
