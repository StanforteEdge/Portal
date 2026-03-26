import { useEffect, useMemo, useState } from "react";
import Button from "@/components/Base/Button";
import Table from "@/components/Base/Table";
import Lucide from "@/components/Base/Lucide";
import { Dialog } from "@/components/Base/Headless";
import { FormHelp, FormInput, FormLabel, FormSelect } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { listDocuments, type PortalDocument } from "@/services/documents";
import { listOrganizations, type OrganizationRecord } from "@/services/organizations";
import { createPolicy, listPolicies, type PolicyRecord, resolvePolicy, updatePolicy } from "@/services/policies";
import { listTeams, type TeamOption } from "@/services/teams";
import { listUsers, type UserListItem } from "@/services/users";
import { formatDisplayDate, formatPersonName } from "@/utils/formatting";

const MODULE_SUGGESTIONS = [
  "attendance",
  "documents",
  "finance",
  "hr",
  "leave",
  "media",
  "onboarding",
  "requests",
  "security",
];

const emptyForm = {
  id: "",
  module: "finance",
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
};

type ConfigEntry = {
  id: string;
  key: string;
  value: string;
  value_type: "text" | "number" | "boolean";
};

function makeEntry(partial?: Partial<ConfigEntry>): ConfigEntry {
  return {
    id: partial?.id || Math.random().toString(36).slice(2, 10),
    key: partial?.key || "",
    value: partial?.value || "",
    value_type: partial?.value_type || "text",
  };
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120);
}

function formatScopeLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function entriesFromConfig(config: Record<string, unknown> | null | undefined): ConfigEntry[] {
  const entries = Object.entries(config || {}).map(([key, raw]) => {
    if (typeof raw === "boolean") return makeEntry({ key, value: raw ? "true" : "false", value_type: "boolean" });
    if (typeof raw === "number") return makeEntry({ key, value: String(raw), value_type: "number" });
    return makeEntry({ key, value: raw == null ? "" : String(raw), value_type: "text" });
  });
  return entries.length ? entries : [makeEntry()];
}

function configFromEntries(entries: ConfigEntry[]) {
  return entries.reduce<Record<string, unknown>>((acc, entry) => {
    const key = entry.key.trim();
    if (!key) return acc;
    if (entry.value_type === "boolean") acc[key] = entry.value === "true";
    else if (entry.value_type === "number") acc[key] = Number(entry.value || 0);
    else acc[key] = entry.value;
    return acc;
  }, {});
}

function describeScopeTarget(scopeType: string) {
  if (scopeType === "organization") return "This policy will apply only to one organization.";
  if (scopeType === "team") return "This policy will apply only to one team.";
  if (scopeType === "staff_type") return "This policy will apply only to one staff type.";
  if (scopeType === "user") return "This policy will apply only to one user.";
  return "Global policies apply everywhere unless a more specific override exists.";
}

function AdminPoliciesPage() {
  const [rows, setRows] = useState<PolicyRecord[]>([]);
  const [documents, setDocuments] = useState<PortalDocument[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [configEntries, setConfigEntries] = useState<ConfigEntry[]>([makeEntry()]);
  const [policyKeyTouched, setPolicyKeyTouched] = useState(false);

  const [resolveForm, setResolveForm] = useState({
    module: "finance",
    policy_key: "",
    organization_id: "",
    team_id: "",
    staff_type: "",
    user_id: "",
  });
  const [resolveResult, setResolveResult] = useState<null | { merged_config: Record<string, unknown>; applied_count: number }>(null);

  const moduleOptions = useMemo(() => {
    return Array.from(new Set([...MODULE_SUGGESTIONS, ...rows.map((row) => row.module)])).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const staffTypeOptions = useMemo(() => {
    return Array.from(new Set(users.map((user) => String(user.type || "").trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }, [users]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => row.module.toLowerCase().includes(q) || row.policy_key.toLowerCase().includes(q));
  }, [rows, search]);

  const selectedDocument = useMemo(
    () => documents.find((doc) => doc.id === form.document_id) || null,
    [documents, form.document_id]
  );

  const selectedScopeLabel =
    form.scope_type === "organization"
      ? organizations.find((row) => row.id === form.scope_id)?.name
      : form.scope_type === "team"
        ? teams.find((row) => row.id === form.scope_id)?.name
        : form.scope_type === "user"
          ? formatPersonName(users.find((row) => row.id === form.scope_id))
          : form.scope_type === "staff_type"
            ? formatScopeLabel(form.scope_id)
            : "Global";

  const syncGeneratedPolicyKey = (nextModule: string, nextDocumentId: string) => {
    if (policyKeyTouched || form.id) return;
    const sourceTitle = documents.find((doc) => doc.id === nextDocumentId)?.title || nextModule || "policy";
    setForm((prev) => ({ ...prev, policy_key: slugify(sourceTitle) || "policy" }));
  };

  const load = async () => {
    try {
      setLoading(true);
      const [policiesRes, docsRes, orgRes, teamRes, usersRes] = await Promise.all([
        listPolicies({ per_page: 200 }),
        listDocuments({ per_page: 100, status: "published" }),
        listOrganizations({ is_active: true }).catch(() => []),
        listTeams({ active_only: true }).catch(() => []),
        listUsers({ page: 1, per_page: 500 }).catch(() => ({ data: [], meta: { page: 1, per_page: 500, total: 0, last_page: 1 } })),
      ]);
      setRows(policiesRes.data ?? []);
      setDocuments(docsRes.data ?? []);
      setOrganizations(orgRes);
      setTeams(teamRes);
      setUsers(usersRes.data ?? []);
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
    setPolicyKeyTouched(false);
    setForm(emptyForm);
    setConfigEntries([makeEntry()]);
    setShowForm(true);
  };

  const openEdit = (row: PolicyRecord) => {
    setPolicyKeyTouched(true);
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
    });
    setConfigEntries(entriesFromConfig(row.config_json));
    setShowForm(true);
  };

  const savePolicy = async () => {
    if (!form.module.trim() || !form.policy_key.trim()) {
      setNotice({ tone: "warning", message: "Module and policy key are required." });
      return;
    }

    if (form.scope_type !== "global" && !form.scope_id.trim()) {
      setNotice({ tone: "warning", message: "Select a scope target before saving." });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        module: form.module.trim().toLowerCase(),
        policy_key: form.policy_key.trim().toLowerCase(),
        scope_type: form.scope_type,
        scope_id: form.scope_type === "global" ? undefined : form.scope_id.trim() || undefined,
        priority: Number(form.priority || 100),
        is_active: form.is_active,
        document_id: form.document_id || undefined,
        document_version: form.document_version.trim() || undefined,
        require_acknowledgement: form.require_acknowledgement,
        effective_from: form.effective_from || undefined,
        effective_to: form.effective_to || undefined,
        config_json: configFromEntries(configEntries),
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
      <div className="mt-8 flex items-center intro-y">
        <h2 className="mr-auto text-lg font-medium">Policies</h2>
        <div className="flex gap-2">
          <Button variant="primary" onClick={openCreate}>New Policy</Button>
          <Button variant="outline-secondary" onClick={() => void load()} disabled={loading}>Refresh</Button>
        </div>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="box mt-5 p-5">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Policies control system rules by module and scope. Pick a module, attach a document where relevant, choose whether the rule is global or limited to one organization, team, staff type, or user, then enter friendly config fields instead of raw JSON.
        </div>
        <div className="mt-4 grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-4">
            <FormLabel>Search</FormLabel>
            <FormInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="module or policy key" />
          </div>
          <div className="col-span-12 md:col-span-8">
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-12 md:col-span-4">
                <FormLabel>Resolve Module</FormLabel>
                <FormInput list="policy-modules" value={resolveForm.module} onChange={(e) => setResolveForm((p) => ({ ...p, module: e.target.value }))} />
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
          <div className="mt-4 rounded-lg bg-slate-100 p-3 text-sm">
            <div>Applied policies: {resolveResult.applied_count}</div>
            <pre className="mt-2 overflow-auto text-xs">{JSON.stringify(resolveResult.merged_config, null, 2)}</pre>
          </div>
        ) : null}
      </div>

      <div className="box mt-5 overflow-x-auto p-5">
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
                <Table.Td>{formatScopeLabel(row.scope_type)}{row.scope_id ? `: ${row.scope_id}` : ""}</Table.Td>
                <Table.Td>{row.priority}</Table.Td>
                <Table.Td>
                  <div>{row.document?.title || "-"}</div>
                  {documents.find((doc) => doc.id === row.document?.id)?.file?.public_url ? (
                    <a
                      href={documents.find((doc) => doc.id === row.document?.id)?.file?.public_url || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      View file
                    </a>
                  ) : null}
                </Table.Td>
                <Table.Td className={row.is_active ? "text-success" : "text-slate-500"}>{row.is_active ? "Active" : "Inactive"}</Table.Td>
                <Table.Td>{formatDisplayDate(row.updated_at)}</Table.Td>
                <Table.Td className="text-right">
                  <Button size="sm" variant="outline-secondary" onClick={() => openEdit(row)}>Edit</Button>
                </Table.Td>
              </Table.Tr>
            ))}
            {!loading && filteredRows.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={8} className="py-6 text-center text-slate-500">No policies found.</Table.Td>
              </Table.Tr>
            ) : null}
          </Table.Tbody>
        </Table>
      </div>

      <Dialog open={showForm} onClose={() => setShowForm(false)}>
        <Dialog.Panel className="max-w-4xl">
          <div className="space-y-4 p-5">
            <div className="flex items-center gap-2 text-lg font-medium">
              <Lucide icon="ShieldCheck" className="h-5 w-5 text-primary" />
              {form.id ? "Edit Policy" : "Create Policy"}
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Choose the module first. The policy key is auto-generated from the selected document or module name, but you can still edit it if you need a shared key for overrides.
            </div>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-12 md:col-span-4">
                <FormLabel>Module</FormLabel>
                <FormInput
                  list="policy-modules"
                  value={form.module}
                  onChange={(e) => {
                    const nextModule = e.target.value;
                    setForm((p) => ({ ...p, module: nextModule }));
                    syncGeneratedPolicyKey(nextModule, form.document_id);
                  }}
                />
                <FormHelp>Use the feature area this policy belongs to, such as finance, leave, or attendance.</FormHelp>
              </div>
              <div className="col-span-12 md:col-span-4">
                <FormLabel>Policy Key</FormLabel>
                <FormInput
                  value={form.policy_key}
                  onChange={(e) => {
                    setPolicyKeyTouched(true);
                    setForm((p) => ({ ...p, policy_key: slugify(e.target.value) }));
                  }}
                />
                <FormHelp>Auto-generated for new policies. Use a stable key if you want scoped overrides to resolve together.</FormHelp>
              </div>
              <div className="col-span-12 md:col-span-4">
                <FormLabel>Priority</FormLabel>
                <FormInput type="number" value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))} />
                <FormHelp>Higher priority wins when two policies share the same module, key, and scope rank.</FormHelp>
              </div>
            </div>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-12 md:col-span-4">
                <FormLabel>Scope Type</FormLabel>
                <FormSelect
                  value={form.scope_type}
                  onChange={(e) => {
                    const nextScopeType = e.target.value;
                    setForm((p) => ({ ...p, scope_type: nextScopeType, scope_id: "" }));
                  }}
                >
                  <option value="global">Global</option>
                  <option value="organization">Organization</option>
                  <option value="team">Team</option>
                  <option value="staff_type">Staff Type</option>
                  <option value="user">User</option>
                </FormSelect>
                <FormHelp>{describeScopeTarget(form.scope_type)}</FormHelp>
              </div>
              <div className="col-span-12 md:col-span-4">
                <FormLabel>{form.scope_type === "global" ? "Scope Target" : formatScopeLabel(form.scope_type)}</FormLabel>
                {form.scope_type === "global" ? (
                  <FormInput value="Global" disabled />
                ) : form.scope_type === "organization" ? (
                  <FormSelect value={form.scope_id} onChange={(e) => setForm((p) => ({ ...p, scope_id: e.target.value }))}>
                    <option value="">Select organization</option>
                    {organizations.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
                  </FormSelect>
                ) : form.scope_type === "team" ? (
                  <FormSelect value={form.scope_id} onChange={(e) => setForm((p) => ({ ...p, scope_id: e.target.value }))}>
                    <option value="">Select team</option>
                    {teams.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
                  </FormSelect>
                ) : form.scope_type === "staff_type" ? (
                  <FormSelect value={form.scope_id} onChange={(e) => setForm((p) => ({ ...p, scope_id: e.target.value }))}>
                    <option value="">Select staff type</option>
                    {staffTypeOptions.map((row) => <option key={row} value={row}>{formatScopeLabel(row)}</option>)}
                  </FormSelect>
                ) : (
                  <FormSelect value={form.scope_id} onChange={(e) => setForm((p) => ({ ...p, scope_id: e.target.value }))}>
                    <option value="">Select user</option>
                    {users.map((row) => <option key={row.id} value={row.id}>{formatPersonName(row)}</option>)}
                  </FormSelect>
                )}
                <FormHelp>{selectedScopeLabel ? `Current target: ${selectedScopeLabel}` : "Choose the exact record this policy should apply to."}</FormHelp>
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
                <FormSelect
                  value={form.document_id}
                  onChange={(e) => {
                    const nextDocumentId = e.target.value;
                    setForm((p) => ({
                      ...p,
                      document_id: nextDocumentId,
                      document_version: nextDocumentId ? documents.find((doc) => doc.id === nextDocumentId)?.version || p.document_version : p.document_version,
                    }));
                    syncGeneratedPolicyKey(form.module, nextDocumentId);
                  }}
                >
                  <option value="">None</option>
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.title}
                    </option>
                  ))}
                </FormSelect>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedDocument ? (
                    <>
                      <Button size="sm" variant="outline-secondary" onClick={() => window.open(`/app/admin/documents/${selectedDocument.id}`, "_blank")}>Open Document</Button>
                      {selectedDocument.file?.public_url ? (
                        <a href={selectedDocument.file.public_url} target="_blank" rel="noreferrer" className="inline-flex items-center text-sm text-primary hover:underline">
                          View Attached File
                        </a>
                      ) : null}
                    </>
                  ) : (
                    <Button size="sm" variant="outline-primary" onClick={() => window.open("/app/admin/documents/new", "_blank")}>Create Document</Button>
                  )}
                </div>
              </div>
              <div className="col-span-12 md:col-span-4">
                <FormLabel>Document Version</FormLabel>
                <FormInput value={form.document_version} onChange={(e) => setForm((p) => ({ ...p, document_version: e.target.value }))} />
                <FormHelp>Usually the linked document version. Leave the auto-filled value unless you are applying a different document revision.</FormHelp>
              </div>
              <div className="col-span-12 md:col-span-4">
                <FormLabel>Require Acknowledgement</FormLabel>
                <FormSelect value={form.require_acknowledgement ? "true" : "false"} onChange={(e) => setForm((p) => ({ ...p, require_acknowledgement: e.target.value === "true" }))}>
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
              <div className="flex items-center justify-between gap-3">
                <div>
                  <FormLabel>Policy Configuration</FormLabel>
                  <FormHelp>Enter the rule values as simple key/value rows. The system will convert them to config JSON for storage.</FormHelp>
                </div>
                <Button variant="outline-primary" onClick={() => setConfigEntries((prev) => [...prev, makeEntry()])}>Add Setting</Button>
              </div>
              <div className="mt-3 space-y-3">
                {configEntries.map((entry) => (
                  <div key={entry.id} className="grid grid-cols-12 gap-3 rounded-lg border border-slate-200 p-3">
                    <div className="col-span-12 md:col-span-4">
                      <FormLabel>Key</FormLabel>
                      <FormInput value={entry.key} onChange={(e) => setConfigEntries((prev) => prev.map((row) => row.id === entry.id ? { ...row, key: slugify(e.target.value) } : row))} placeholder="e.g. approval_limit" />
                    </div>
                    <div className="col-span-12 md:col-span-3">
                      <FormLabel>Type</FormLabel>
                      <FormSelect value={entry.value_type} onChange={(e) => setConfigEntries((prev) => prev.map((row) => row.id === entry.id ? { ...row, value_type: e.target.value as ConfigEntry["value_type"], value: e.target.value === "boolean" ? "false" : row.value } : row))}>
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="boolean">Yes / No</option>
                      </FormSelect>
                    </div>
                    <div className="col-span-12 md:col-span-4">
                      <FormLabel>Value</FormLabel>
                      {entry.value_type === "boolean" ? (
                        <FormSelect value={entry.value || "false"} onChange={(e) => setConfigEntries((prev) => prev.map((row) => row.id === entry.id ? { ...row, value: e.target.value } : row))}>
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </FormSelect>
                      ) : (
                        <FormInput type={entry.value_type === "number" ? "number" : "text"} value={entry.value} onChange={(e) => setConfigEntries((prev) => prev.map((row) => row.id === entry.id ? { ...row, value: e.target.value } : row))} />
                      )}
                    </div>
                    <div className="col-span-12 md:col-span-1 flex items-end justify-end">
                      <Button variant="soft-danger" onClick={() => setConfigEntries((prev) => prev.length === 1 ? [makeEntry()] : prev.filter((row) => row.id !== entry.id))}>Remove</Button>
                    </div>
                  </div>
                ))}
              </div>
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

      <datalist id="policy-modules">
        {moduleOptions.map((option) => <option key={option} value={option} />)}
      </datalist>
    </>
  );
}

export default AdminPoliciesPage;
