import { useEffect, useMemo, useState } from "react";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import Table from "@/components/Base/Table";
import { Dialog } from "@/components/Base/Headless";
import { FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { listOrganizations } from "@/services/organizations";
import { listProjects } from "@/services/projects";
import { listTeams } from "@/services/teams";
import { listUsers } from "@/services/users";
import { listFinanceFunds, listFinanceGrants } from "@/services/financeAccounting";
import { createPayrollWorker, listPayrollComponents, listPayrollWorkers, updatePayrollWorker } from "@/services/payroll";

const emptyAllocation = {
  organization_id: "",
  team_id: "",
  project_id: "",
  fund_id: "",
  grant_id: "",
  allocation_percent: "100",
};

const emptyForm = {
  profile_id: "",
  worker_type: "employee",
  full_name: "",
  email: "",
  staff_code: "",
  currency: "NGN",
  status: "active",
  organization_id: "",
  team_id: "",
  project_id: "",
  default_fund_id: "",
  default_grant_id: "",
  bank_name: "",
  bank_account_name: "",
  bank_account_number: "",
  tax_identifier: "",
  pension_identifier: "",
  apply_tax: true,
  apply_pension: true,
  tax_rate: "",
  pension_rate: "",
  withholding_rate: "",
  consultant_pension_rate: "",
  start_date: "",
  end_date: "",
  notes: "",
  base_amount: "",
  effective_from: "",
  payment_mode: "bank_transfer",
  profile_components: [] as Array<{ component_id: string; amount: string }>,
  allocations: [emptyAllocation],
};

function FinancePayrollWorkersPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [components, setComponents] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [funds, setFunds] = useState<any[]>([]);
  const [grants, setGrants] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [search, setSearch] = useState("");
  const [workerType, setWorkerType] = useState("");
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    try {
      setLoading(true);
      const [workerRes, componentRows, orgRows, teamRows, projectRows, fundRows, grantRows, userRows] = await Promise.all([
        listPayrollWorkers({ page: 1, per_page: 200, search: search || undefined, worker_type: workerType || undefined }),
        listPayrollComponents({ is_active: true }),
        listOrganizations({ is_active: true }).catch(() => []),
        listTeams({ active_only: true }).catch(() => []),
        listProjects({ active_only: false }).catch(() => []),
        listFinanceFunds().catch(() => []),
        listFinanceGrants().catch(() => []),
        listUsers({ page: 1, per_page: 200, status: "active" }).catch(() => ({ data: [], meta: null })),
      ]);
      setRows(workerRes.data ?? []);
      setComponents(componentRows ?? []);
      setOrganizations(orgRows);
      setTeams(teamRows);
      setProjects(projectRows);
      setFunds(fundRows);
      setGrants(grantRows);
      setProfiles(userRows.data ?? []);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load payroll workers." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const peopleOptions = useMemo(
    () =>
      profiles.map((row) => ({
        id: row.id,
        label: [row.firstName, row.lastName].filter(Boolean).join(" ").trim() || row.username || row.email,
        email: row.email,
      })),
    [profiles]
  );

  const resetForm = () => {
    setEditingId("");
    setForm(emptyForm);
    setShowEditor(true);
  };

  const openEdit = (row: any) => {
    const latestProfile = row.profiles?.[0] || null;
    setEditingId(row.id);
    setForm({
      profile_id: row.profile_id || "",
      worker_type: row.worker_type || "employee",
      full_name: row.full_name || "",
      email: row.email || "",
      staff_code: row.staff_code || "",
      currency: row.currency || "NGN",
      status: row.status || "active",
      organization_id: row.organization_id || "",
      team_id: row.team_id || "",
      project_id: row.project_id || "",
      default_fund_id: row.default_fund_id || "",
      default_grant_id: row.default_grant_id || "",
      bank_name: row.bank_name || "",
      bank_account_name: row.bank_account_name || "",
      bank_account_number: row.bank_account_number || "",
      tax_identifier: row.tax_identifier || "",
      pension_identifier: row.pension_identifier || "",
      apply_tax: row.metadata?.apply_tax !== false,
      apply_pension: row.metadata?.apply_pension !== false,
      tax_rate: row.metadata?.tax_rate != null ? String(row.metadata.tax_rate) : "",
      pension_rate: row.metadata?.pension_rate != null ? String(row.metadata.pension_rate) : "",
      withholding_rate: row.metadata?.withholding_rate != null ? String(row.metadata.withholding_rate) : "",
      consultant_pension_rate: row.metadata?.consultant_pension_rate != null ? String(row.metadata.consultant_pension_rate) : "",
      start_date: row.start_date ? String(row.start_date).slice(0, 10) : "",
      end_date: row.end_date ? String(row.end_date).slice(0, 10) : "",
      notes: row.notes || "",
      base_amount: latestProfile ? String(latestProfile.base_amount ?? "") : "",
      effective_from: latestProfile?.effective_from ? String(latestProfile.effective_from).slice(0, 10) : "",
      payment_mode: latestProfile?.payment_mode || "bank_transfer",
      profile_components:
        latestProfile?.components?.map((componentRow: any) => ({
          component_id: componentRow.component_id,
          amount: String(componentRow.amount ?? ""),
        })) || [],
      allocations:
        row.allocations?.length > 0
          ? row.allocations.map((allocation: any) => ({
              organization_id: allocation.organization_id || "",
              team_id: allocation.team_id || "",
              project_id: allocation.project_id || "",
              fund_id: allocation.fund_id || "",
              grant_id: allocation.grant_id || "",
              allocation_percent: String(allocation.allocation_percent ?? "0"),
            }))
          : [emptyAllocation],
    });
    setShowEditor(true);
  };

  const saveWorker = async () => {
    try {
      setSaving(true);
      const componentRows = (form.profile_components || [])
        .filter((row: any) => row.component_id && Number(row.amount || 0) > 0)
        .map((row: any) => ({
          component_id: row.component_id,
          amount: Number(row.amount || 0),
        }));
      const payload = {
        profile_id: form.profile_id || undefined,
        worker_type: form.worker_type,
        full_name: form.full_name,
        email: form.email || undefined,
        staff_code: form.staff_code || undefined,
        currency: form.currency || "NGN",
        status: form.status || "active",
        organization_id: form.organization_id || undefined,
        team_id: form.team_id || undefined,
        project_id: form.project_id || undefined,
        default_fund_id: form.default_fund_id || undefined,
        default_grant_id: form.default_grant_id || undefined,
        bank_name: form.bank_name || undefined,
        bank_account_name: form.bank_account_name || undefined,
        bank_account_number: form.bank_account_number || undefined,
        tax_identifier: form.tax_identifier || undefined,
        pension_identifier: form.pension_identifier || undefined,
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
        notes: form.notes || undefined,
        metadata: {
          apply_tax: form.apply_tax,
          apply_pension: form.apply_pension,
          tax_rate: form.tax_rate ? Number(form.tax_rate) : undefined,
          pension_rate: form.pension_rate ? Number(form.pension_rate) : undefined,
          withholding_rate: form.withholding_rate ? Number(form.withholding_rate) : undefined,
          consultant_pension_rate: form.consultant_pension_rate ? Number(form.consultant_pension_rate) : undefined,
        },
        profile:
          form.effective_from || Number(form.base_amount || 0) > 0 || componentRows.length
            ? {
                effective_from: form.effective_from || new Date().toISOString().slice(0, 10),
                pay_frequency: "monthly",
                base_amount: Number(form.base_amount || 0),
                payment_mode: form.payment_mode || "bank_transfer",
                components: componentRows,
              }
            : undefined,
        allocations: (form.allocations || []).map((row: any) => ({
          organization_id: row.organization_id || undefined,
          team_id: row.team_id || undefined,
          project_id: row.project_id || undefined,
          fund_id: row.fund_id || undefined,
          grant_id: row.grant_id || undefined,
          allocation_percent: Number(row.allocation_percent || 0),
        })),
      };
      if (editingId) {
        await updatePayrollWorker(editingId, payload);
      } else {
        await createPayrollWorker(payload);
      }
      setNotice({ tone: "success", message: `Payroll worker ${editingId ? "updated" : "created"} successfully.` });
      setShowEditor(false);
      setEditingId("");
      setForm(emptyForm);
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save payroll worker." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Payroll Workers</h2>
        <div className="flex gap-2">
          <Button variant="outline-secondary" onClick={() => void load()} disabled={loading}>
            <Lucide icon="Undo2" className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button variant="primary" onClick={resetForm}>
            <Lucide icon="Plus" className="w-4 h-4 mr-1" />
            New Worker
          </Button>
        </div>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="grid grid-cols-12 gap-4 mt-5 box p-5">
        <div className="col-span-12 md:col-span-6">
          <FormLabel>Search</FormLabel>
          <FormInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, email, or staff code" />
        </div>
        <div className="col-span-12 md:col-span-3">
          <FormLabel>Worker Type</FormLabel>
          <FormSelect value={workerType} onChange={(e) => setWorkerType(e.target.value)}>
            <option value="">All</option>
            <option value="employee">Employee</option>
            <option value="consultant">Consultant</option>
          </FormSelect>
        </div>
        <div className="col-span-12 md:col-span-3 flex items-end">
          <Button variant="primary" className="w-full" onClick={() => void load()}>
            <Lucide icon="Search" className="w-4 h-4 mr-1" />
            Apply Filters
          </Button>
        </div>
      </div>

      <div className="box p-5 mt-5">
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Worker</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Scope</Table.Th>
              <Table.Th>Default Funding</Table.Th>
              <Table.Th className="text-right">Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((row) => (
              <Table.Tr key={row.id}>
                <Table.Td>
                  <div className="font-medium">{row.full_name}</div>
                  <div className="text-xs text-slate-500">{row.email || row.staff_code || "-"}</div>
                </Table.Td>
                <Table.Td className="capitalize">{row.worker_type}</Table.Td>
                <Table.Td>
                  <div>{row.organization?.name || "-"}</div>
                  <div className="text-xs text-slate-500">Team {row.team_id || "-"} • Project {row.project_id || "-"}</div>
                </Table.Td>
                <Table.Td>
                  <div>{row.default_fund?.name || "-"}</div>
                  <div className="text-xs text-slate-500">{row.default_grant?.name || "-"}</div>
                </Table.Td>
                <Table.Td className="text-right">
                  <Button size="sm" variant="outline-secondary" onClick={() => openEdit(row)}>
                    <Lucide icon="FilePenLine" className="w-4 h-4" />
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
            {!rows.length ? (
              <Table.Tr>
                <Table.Td colSpan={5} className="text-center text-slate-500 py-10">
                  No payroll workers found.
                </Table.Td>
              </Table.Tr>
            ) : null}
          </Table.Tbody>
        </Table>
      </div>

      <Dialog open={showEditor} onClose={() => setShowEditor(false)} size="xl">
        <Dialog.Panel>
          <Dialog.Title>
            <h2 className="mr-auto text-base font-medium">{editingId ? "Edit Payroll Worker" : "New Payroll Worker"}</h2>
          </Dialog.Title>
          <Dialog.Description className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Worker Type</FormLabel>
              <FormSelect value={form.worker_type} onChange={(e) => setForm((prev: any) => ({ ...prev, worker_type: e.target.value }))}>
                <option value="employee">Employee</option>
                <option value="consultant">Consultant</option>
              </FormSelect>
            </div>
            <div className="col-span-12 md:col-span-8">
              <FormLabel>Linked Staff Profile</FormLabel>
              <FormSelect
                value={form.profile_id}
                onChange={(e) => {
                  const selected = peopleOptions.find((row) => row.id === e.target.value);
                  setForm((prev: any) => ({
                    ...prev,
                    profile_id: e.target.value,
                    full_name: prev.full_name || selected?.label || "",
                    email: prev.email || selected?.email || "",
                  }));
                }}
              >
                <option value="">Standalone worker</option>
                {peopleOptions.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.label}
                  </option>
                ))}
              </FormSelect>
            </div>
            <div className="col-span-12 md:col-span-6">
              <FormLabel>Full Name</FormLabel>
              <FormInput value={form.full_name} onChange={(e) => setForm((prev: any) => ({ ...prev, full_name: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-6">
              <FormLabel>Email</FormLabel>
              <FormInput value={form.email} onChange={(e) => setForm((prev: any) => ({ ...prev, email: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Staff Code</FormLabel>
              <FormInput value={form.staff_code} onChange={(e) => setForm((prev: any) => ({ ...prev, staff_code: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Status</FormLabel>
              <FormSelect value={form.status} onChange={(e) => setForm((prev: any) => ({ ...prev, status: e.target.value }))}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </FormSelect>
            </div>
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Currency</FormLabel>
              <FormInput value={form.currency} onChange={(e) => setForm((prev: any) => ({ ...prev, currency: e.target.value }))} maxLength={3} />
            </div>
            <div className="col-span-12">
              <div className="font-medium">Statutory Overrides</div>
              <div className="grid grid-cols-12 gap-4 mt-2 rounded border p-3">
                <label className="col-span-12 md:col-span-3 inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.apply_tax} onChange={(e) => setForm((prev: any) => ({ ...prev, apply_tax: e.target.checked }))} />
                  Apply Tax
                </label>
                <label className="col-span-12 md:col-span-3 inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.apply_pension} onChange={(e) => setForm((prev: any) => ({ ...prev, apply_pension: e.target.checked }))} />
                  Apply Pension
                </label>
                <div className="col-span-12 md:col-span-3">
                  <FormLabel>Tax Rate Override</FormLabel>
                  <FormInput value={form.tax_rate} onChange={(e) => setForm((prev: any) => ({ ...prev, tax_rate: e.target.value }))} placeholder="0.08" />
                </div>
                <div className="col-span-12 md:col-span-3">
                  <FormLabel>Pension Rate Override</FormLabel>
                  <FormInput value={form.pension_rate} onChange={(e) => setForm((prev: any) => ({ ...prev, pension_rate: e.target.value }))} placeholder="0.08" />
                </div>
                {form.worker_type === "consultant" ? (
                  <>
                    <div className="col-span-12 md:col-span-3">
                      <FormLabel>Withholding Rate Override</FormLabel>
                      <FormInput value={form.withholding_rate} onChange={(e) => setForm((prev: any) => ({ ...prev, withholding_rate: e.target.value }))} placeholder="0.05" />
                    </div>
                    <div className="col-span-12 md:col-span-3">
                      <FormLabel>Consultant Pension Override</FormLabel>
                      <FormInput value={form.consultant_pension_rate} onChange={(e) => setForm((prev: any) => ({ ...prev, consultant_pension_rate: e.target.value }))} placeholder="0.00" />
                    </div>
                  </>
                ) : null}
              </div>
            </div>
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Organization</FormLabel>
              <FormSelect value={form.organization_id} onChange={(e) => setForm((prev: any) => ({ ...prev, organization_id: e.target.value }))}>
                <option value="">Select organization</option>
                {organizations.map((row) => (
                  <option key={row.id} value={row.id}>{row.name}</option>
                ))}
              </FormSelect>
            </div>
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Team</FormLabel>
              <FormSelect value={form.team_id} onChange={(e) => setForm((prev: any) => ({ ...prev, team_id: e.target.value }))}>
                <option value="">Select team</option>
                {teams.map((row) => (
                  <option key={row.id} value={row.id}>{row.name}</option>
                ))}
              </FormSelect>
            </div>
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Project</FormLabel>
              <FormSelect value={form.project_id} onChange={(e) => setForm((prev: any) => ({ ...prev, project_id: e.target.value }))}>
                <option value="">Select project</option>
                {projects.map((row) => (
                  <option key={row.id} value={row.id}>{row.name}</option>
                ))}
              </FormSelect>
            </div>
            <div className="col-span-12 md:col-span-6">
              <FormLabel>Default Fund</FormLabel>
              <FormSelect value={form.default_fund_id} onChange={(e) => setForm((prev: any) => ({ ...prev, default_fund_id: e.target.value }))}>
                <option value="">No default fund</option>
                {funds.map((row) => (
                  <option key={row.id} value={row.id}>{row.name}</option>
                ))}
              </FormSelect>
            </div>
            <div className="col-span-12 md:col-span-6">
              <FormLabel>Default Grant</FormLabel>
              <FormSelect value={form.default_grant_id} onChange={(e) => setForm((prev: any) => ({ ...prev, default_grant_id: e.target.value }))}>
                <option value="">No default grant</option>
                {grants.map((row) => (
                  <option key={row.id} value={row.id}>{row.name}</option>
                ))}
              </FormSelect>
            </div>
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Base Amount</FormLabel>
              <FormInput type="number" value={form.base_amount} onChange={(e) => setForm((prev: any) => ({ ...prev, base_amount: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Effective From</FormLabel>
              <FormInput type="date" value={form.effective_from} onChange={(e) => setForm((prev: any) => ({ ...prev, effective_from: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Payment Mode</FormLabel>
              <FormSelect value={form.payment_mode} onChange={(e) => setForm((prev: any) => ({ ...prev, payment_mode: e.target.value }))}>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
              </FormSelect>
            </div>

            <div className="col-span-12">
              <div className="flex items-center justify-between">
                <FormLabel>Recurring Components</FormLabel>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() =>
                    setForm((prev: any) => ({
                      ...prev,
                      profile_components: [...(prev.profile_components || []), { component_id: "", amount: "" }],
                    }))
                  }
                >
                  <Lucide icon="Plus" className="w-4 h-4 mr-1" />
                  Add Component
                </Button>
              </div>
              <div className="space-y-3 mt-2">
                {(form.profile_components || []).map((row: any, index: number) => (
                  <div key={`component-${index}`} className="grid grid-cols-12 gap-3">
                    <div className="col-span-12 md:col-span-8">
                      <FormSelect
                        value={row.component_id}
                        onChange={(e) =>
                          setForm((prev: any) => ({
                            ...prev,
                            profile_components: (prev.profile_components || []).map((entry: any, entryIndex: number) =>
                              entryIndex === index ? { ...entry, component_id: e.target.value } : entry
                            ),
                          }))
                        }
                      >
                        <option value="">Select component</option>
                        {components.map((component) => (
                          <option key={component.id} value={component.id}>{component.name}</option>
                        ))}
                      </FormSelect>
                    </div>
                    <div className="col-span-10 md:col-span-3">
                      <FormInput
                        type="number"
                        value={row.amount}
                        onChange={(e) =>
                          setForm((prev: any) => ({
                            ...prev,
                            profile_components: (prev.profile_components || []).map((entry: any, entryIndex: number) =>
                              entryIndex === index ? { ...entry, amount: e.target.value } : entry
                            ),
                          }))
                        }
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <Button
                        variant="outline-danger"
                        className="w-full"
                        onClick={() =>
                          setForm((prev: any) => ({
                            ...prev,
                            profile_components: (prev.profile_components || []).filter((_: unknown, entryIndex: number) => entryIndex !== index),
                          }))
                        }
                      >
                        <Lucide icon="Trash2" className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-12">
              <div className="flex items-center justify-between">
                <FormLabel>Allocations</FormLabel>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => setForm((prev: any) => ({ ...prev, allocations: [...(prev.allocations || []), emptyAllocation] }))}
                >
                  <Lucide icon="Plus" className="w-4 h-4 mr-1" />
                  Add Allocation
                </Button>
              </div>
              <div className="space-y-3 mt-2">
                {(form.allocations || []).map((row: any, index: number) => (
                  <div key={`allocation-${index}`} className="grid grid-cols-12 gap-3 rounded border p-3">
                    <div className="col-span-12 md:col-span-3">
                      <FormLabel>Organization</FormLabel>
                      <FormSelect
                        value={row.organization_id}
                        onChange={(e) =>
                          setForm((prev: any) => ({
                            ...prev,
                            allocations: (prev.allocations || []).map((entry: any, entryIndex: number) =>
                              entryIndex === index ? { ...entry, organization_id: e.target.value } : entry
                            ),
                          }))
                        }
                      >
                        <option value="">None</option>
                        {organizations.map((entry) => (
                          <option key={entry.id} value={entry.id}>{entry.name}</option>
                        ))}
                      </FormSelect>
                    </div>
                    <div className="col-span-12 md:col-span-2">
                      <FormLabel>Team</FormLabel>
                      <FormSelect
                        value={row.team_id}
                        onChange={(e) =>
                          setForm((prev: any) => ({
                            ...prev,
                            allocations: (prev.allocations || []).map((entry: any, entryIndex: number) =>
                              entryIndex === index ? { ...entry, team_id: e.target.value } : entry
                            ),
                          }))
                        }
                      >
                        <option value="">None</option>
                        {teams.map((entry) => (
                          <option key={entry.id} value={entry.id}>{entry.name}</option>
                        ))}
                      </FormSelect>
                    </div>
                    <div className="col-span-12 md:col-span-2">
                      <FormLabel>Project</FormLabel>
                      <FormSelect
                        value={row.project_id}
                        onChange={(e) =>
                          setForm((prev: any) => ({
                            ...prev,
                            allocations: (prev.allocations || []).map((entry: any, entryIndex: number) =>
                              entryIndex === index ? { ...entry, project_id: e.target.value } : entry
                            ),
                          }))
                        }
                      >
                        <option value="">None</option>
                        {projects.map((entry) => (
                          <option key={entry.id} value={entry.id}>{entry.name}</option>
                        ))}
                      </FormSelect>
                    </div>
                    <div className="col-span-12 md:col-span-2">
                      <FormLabel>Fund</FormLabel>
                      <FormSelect
                        value={row.fund_id}
                        onChange={(e) =>
                          setForm((prev: any) => ({
                            ...prev,
                            allocations: (prev.allocations || []).map((entry: any, entryIndex: number) =>
                              entryIndex === index ? { ...entry, fund_id: e.target.value } : entry
                            ),
                          }))
                        }
                      >
                        <option value="">None</option>
                        {funds.map((entry) => (
                          <option key={entry.id} value={entry.id}>{entry.name}</option>
                        ))}
                      </FormSelect>
                    </div>
                    <div className="col-span-12 md:col-span-2">
                      <FormLabel>Grant</FormLabel>
                      <FormSelect
                        value={row.grant_id}
                        onChange={(e) =>
                          setForm((prev: any) => ({
                            ...prev,
                            allocations: (prev.allocations || []).map((entry: any, entryIndex: number) =>
                              entryIndex === index ? { ...entry, grant_id: e.target.value } : entry
                            ),
                          }))
                        }
                      >
                        <option value="">None</option>
                        {grants.map((entry) => (
                          <option key={entry.id} value={entry.id}>{entry.name}</option>
                        ))}
                      </FormSelect>
                    </div>
                    <div className="col-span-10 md:col-span-1">
                      <FormLabel>%</FormLabel>
                      <FormInput
                        type="number"
                        value={row.allocation_percent}
                        onChange={(e) =>
                          setForm((prev: any) => ({
                            ...prev,
                            allocations: (prev.allocations || []).map((entry: any, entryIndex: number) =>
                              entryIndex === index ? { ...entry, allocation_percent: e.target.value } : entry
                            ),
                          }))
                        }
                      />
                    </div>
                    <div className="col-span-2 md:col-span-12 flex md:justify-end md:items-end">
                      <Button
                        variant="outline-danger"
                        className="w-full md:w-auto"
                        onClick={() =>
                          setForm((prev: any) => ({
                            ...prev,
                            allocations: (prev.allocations || []).filter((_: unknown, entryIndex: number) => entryIndex !== index),
                          }))
                        }
                      >
                        <Lucide icon="Trash2" className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-12 md:col-span-4">
              <FormLabel>Bank Name</FormLabel>
              <FormInput value={form.bank_name} onChange={(e) => setForm((prev: any) => ({ ...prev, bank_name: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Account Name</FormLabel>
              <FormInput value={form.bank_account_name} onChange={(e) => setForm((prev: any) => ({ ...prev, bank_account_name: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Account Number</FormLabel>
              <FormInput value={form.bank_account_number} onChange={(e) => setForm((prev: any) => ({ ...prev, bank_account_number: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-6">
              <FormLabel>Tax Identifier</FormLabel>
              <FormInput value={form.tax_identifier} onChange={(e) => setForm((prev: any) => ({ ...prev, tax_identifier: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-6">
              <FormLabel>Pension Identifier</FormLabel>
              <FormInput value={form.pension_identifier} onChange={(e) => setForm((prev: any) => ({ ...prev, pension_identifier: e.target.value }))} />
            </div>
            <div className="col-span-12">
              <FormLabel>Notes</FormLabel>
              <FormTextarea value={form.notes} onChange={(e) => setForm((prev: any) => ({ ...prev, notes: e.target.value }))} />
            </div>
          </Dialog.Description>
          <Dialog.Footer>
            <Button variant="outline-secondary" onClick={() => setShowEditor(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => void saveWorker()} disabled={saving}>
              {saving ? "Saving..." : "Save Worker"}
            </Button>
          </Dialog.Footer>
        </Dialog.Panel>
      </Dialog>
    </>
  );
}

export default FinancePayrollWorkersPage;
