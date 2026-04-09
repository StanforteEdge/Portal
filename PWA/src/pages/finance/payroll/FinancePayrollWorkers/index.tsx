import { useEffect, useMemo, useState } from "react";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import Table from "@/components/Base/Table";
import TomSelect from "@/components/Base/TomSelect";
import { Dialog } from "@/components/Base/Headless";
import { FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import AllocationRowsEditor, { type AllocationRowValue } from "@/components/Payroll/AllocationRowsEditor";
import { listOrganizations } from "@/services/organizations";
import { listProjects } from "@/services/projects";
import { listTeams } from "@/services/teams";
import { listUsers } from "@/services/users";
import { listFinanceFunds, listFinanceGrants } from "@/services/financeAccounting";
import { createPayrollWorker, deletePayrollWorker, listPayrollComponents, listPayrollTaxTables, listPayrollWorkers, updatePayrollWorker } from "@/services/payroll";

const emptyAllocation: AllocationRowValue = {
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
  pay_basis: "monthly_fixed",
  allocation_mode: "fixed",
  hybrid_fixed_percent: "0",
  standard_hours_per_day: "8",
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
  tax_table_id: "",
  bank_name: "",
  bank_account_name: "",
  bank_account_number: "",
  tax_identifier: "",
  pension_identifier: "",
  apply_tax: true,
  apply_pension: true,
  employer_covers_paye: false,
  pension_rate: "",
  withholding_rate: "",
  consultant_pension_rate: "",
  start_date: "",
  end_date: "",
  notes: "",
  base_amount: "",
  effective_from: "",
  payment_mode: "bank_transfer",
  profile_components: [] as Array<{ component_id: string; amount: string; rate: string; formula: string }>,
  allocations: [emptyAllocation],
};

const workerSteps = [
  { id: "identity", title: "Identity" },
  { id: "pay", title: "Pay Profile" },
  { id: "allocation", title: "Allocation" },
  { id: "compliance", title: "Compliance & Bank" },
] as const;

type WorkerStep = (typeof workerSteps)[number]["id"];

type NameOption = { id: string | number; name: string };

function FinancePayrollWorkersPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [components, setComponents] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [funds, setFunds] = useState<any[]>([]);
  const [grants, setGrants] = useState<any[]>([]);
  const [taxTables, setTaxTables] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [search, setSearch] = useState("");
  const [workerType, setWorkerType] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [editorStep, setEditorStep] = useState<WorkerStep>("identity");
  const [form, setForm] = useState(emptyForm);

  const readSettledValue = <T,>(result: PromiseSettledResult<T>, fallback: T): T =>
    result.status === "fulfilled" ? result.value : fallback;

  const load = async () => {
    try {
      setLoading(true);
      const [workerRes, componentRows, orgRows, teamRows, projectRows, fundRows, grantRows, userRows, taxTableRows] = await Promise.allSettled([
        listPayrollWorkers({
          page: 1,
          per_page: 200,
          search: search || undefined,
          worker_type: workerType || undefined,
          status: statusFilter || undefined,
        }),
        listPayrollComponents({ is_active: true }),
        listOrganizations({ is_active: true }),
        listTeams({ active_only: true }),
        listProjects({ active_only: false }),
        listFinanceFunds(),
        listFinanceGrants(),
        listUsers({ page: 1, per_page: 200, status: "active" }),
        listPayrollTaxTables({ status: "active" }),
      ]);

      if (workerRes.status !== "fulfilled") {
        throw workerRes.reason;
      }

      setRows(workerRes.value.data ?? []);
      setComponents(readSettledValue(componentRows, []));
      setOrganizations(readSettledValue(orgRows, []));
      setTeams(readSettledValue(teamRows, []));
      setProjects(readSettledValue(projectRows, []));
      setFunds(readSettledValue(fundRows, []));
      setGrants(readSettledValue(grantRows, []));
      setProfiles(
        readSettledValue(userRows, {
          data: [],
          meta: { page: 1, per_page: 200, total: 0, last_page: 1 },
        }).data ?? []
      );
      setTaxTables(readSettledValue(taxTableRows, []));
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
        id: String(row.id),
        label: [row.firstName, row.lastName].filter(Boolean).join(" ").trim() || row.username || row.email,
        email: row.email,
      })),
    [profiles]
  );

  const labelMaps = useMemo(() => {
    const buildMap = (items: NameOption[]) => new Map(items.map((item) => [String(item.id), item.name]));
    return {
      organization: buildMap(organizations),
      team: buildMap(teams),
      project: buildMap(projects),
      fund: buildMap(funds),
      grant: buildMap(grants),
      component: buildMap(components.map((row) => ({ id: row.id, name: row.name }))),
    };
  }, [organizations, teams, projects, funds, grants, components]);

  const componentMap = useMemo(
    () => new Map(components.map((component) => [String(component.id), component])),
    [components]
  );

  const summary = useMemo(
    () => ({
      total: rows.length,
      employees: rows.filter((row) => row.worker_type === "employee").length,
      consultants: rows.filter((row) => row.worker_type === "consultant").length,
      linkedProfiles: rows.filter((row) => row.profile_id).length,
    }),
    [rows]
  );

  const allocationTotal = useMemo(
    () => (form.allocations || []).reduce((sum, row) => sum + Number(row.allocation_percent || 0), 0),
    [form.allocations]
  );
  const busy = loading || saving || Boolean(actionLoading);

  const resetForm = () => {
    setEditingId("");
    setForm(emptyForm);
    setEditorStep("identity");
    setShowEditor(true);
  };

  const openEdit = (row: any) => {
    const latestProfile = row.profiles?.[0] || null;
    setEditingId(row.id);
    setEditorStep("identity");
    setForm({
      profile_id: row.profile_id || "",
      worker_type: row.worker_type || "employee",
      pay_basis: row.pay_basis || "monthly_fixed",
      allocation_mode: row.allocation_mode || "fixed",
      hybrid_fixed_percent: row.hybrid_fixed_percent != null ? String(row.hybrid_fixed_percent) : "0",
      standard_hours_per_day: row.standard_hours_per_day != null ? String(row.standard_hours_per_day) : "8",
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
      tax_table_id: row.tax_table_id || row.metadata?.tax_table_id || "",
      bank_name: row.bank_name || "",
      bank_account_name: row.bank_account_name || "",
      bank_account_number: row.bank_account_number || "",
      tax_identifier: row.tax_identifier || "",
      pension_identifier: row.pension_identifier || "",
      apply_tax: row.metadata?.apply_tax !== false,
      apply_pension: row.metadata?.apply_pension !== false,
      employer_covers_paye: row.metadata?.employer_covers_paye === true,
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
          rate: componentRow.rate != null ? String(componentRow.rate) : "",
          formula: componentRow.formula || "",
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
        .filter((row: any) => row.component_id)
        .map((row: any) => ({
          component_id: row.component_id,
          amount: row.amount !== "" ? Number(row.amount || 0) : undefined,
          rate: row.rate !== "" ? Number(row.rate || 0) : undefined,
          formula: row.formula?.trim() || undefined,
        }))
        .filter((row: any) => row.amount !== undefined || row.rate !== undefined || row.formula);
      const payload = {
        profile_id: form.profile_id || undefined,
        worker_type: form.worker_type,
        pay_basis: form.pay_basis,
        allocation_mode: form.allocation_mode,
        hybrid_fixed_percent: Number(form.hybrid_fixed_percent || 0),
        standard_hours_per_day: Number(form.standard_hours_per_day || 8),
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
        tax_table_id: form.tax_table_id || undefined,
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
          employer_covers_paye: form.employer_covers_paye,
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
      if (editingId) await updatePayrollWorker(editingId, payload);
      else await createPayrollWorker(payload);
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

  const scopeSummary = (row: any) => {
    const parts = [
      row.organization?.name || labelMaps.organization.get(String(row.organization_id || "")),
      labelMaps.team.get(String(row.team_id || "")),
      labelMaps.project.get(String(row.project_id || "")),
    ].filter(Boolean);
    return parts.length ? parts.join(" • ") : "No default scope";
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
          <Button variant="primary" onClick={resetForm} disabled={busy}>
            <Lucide icon="Plus" className="w-4 h-4 mr-1" />
            New Worker
          </Button>
        </div>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="grid grid-cols-1 gap-4 mt-5 xl:grid-cols-4">
        <div className="box p-5">
          <div className="text-sm text-slate-500">Workers</div>
          <div className="mt-2 text-2xl font-semibold">{summary.total}</div>
        </div>
        <div className="box p-5">
          <div className="text-sm text-slate-500">Employees</div>
          <div className="mt-2 text-2xl font-semibold">{summary.employees}</div>
        </div>
        <div className="box p-5">
          <div className="text-sm text-slate-500">Consultants</div>
          <div className="mt-2 text-2xl font-semibold">{summary.consultants}</div>
        </div>
        <div className="box p-5">
          <div className="text-sm text-slate-500">Linked to staff profiles</div>
          <div className="mt-2 text-2xl font-semibold">{summary.linkedProfiles}</div>
        </div>
      </div>

      <div className="box p-5 mt-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="font-medium">Worker setup guide</div>
            <div className="text-sm text-slate-500">Create the worker record, add recurring pay, then define where payroll cost should land in reports.</div>
          </div>
          <div className="grid gap-2 text-xs text-slate-500 md:grid-cols-4">
            {workerSteps.map((step, index) => (
              <div key={step.id} className="rounded border px-3 py-2">
                <div className="font-medium text-slate-700">{index + 1}. {step.title}</div>
                <div>{step.id === "identity" ? "Link the staff profile or create a standalone consultant." : step.id === "pay" ? "Add recurring salary or consultancy lines." : step.id === "allocation" ? "Split cost across org, project, fund, or grant." : "Capture statutory overrides and bank details."}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

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
        <div className="col-span-12 md:col-span-3">
          <FormLabel>Status</FormLabel>
          <FormSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="">All</option>
          </FormSelect>
        </div>
        <div className="col-span-12 md:col-span-12 lg:col-span-3 flex items-end">
          <Button variant="primary" className="w-full" onClick={() => void load()} disabled={loading}>
            <Lucide icon="Search" className="w-4 h-4 mr-1" />
            {loading ? "Loading..." : "Apply Filters"}
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
              <Table.Th>Profile</Table.Th>
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
                <Table.Td>
                  <div className="capitalize">{row.worker_type}</div>
                  <div className="text-xs text-slate-500 capitalize">{row.status || "active"}</div>
                  <div className="text-xs text-slate-500">{String(row.pay_basis || "monthly_fixed").replaceAll("_", " ")}</div>
                  <div className="text-xs text-slate-500">{String(row.allocation_mode || "fixed").replaceAll("_", " ")}</div>
                </Table.Td>
                <Table.Td>
                  <div>{scopeSummary(row)}</div>
                </Table.Td>
                <Table.Td>
                  <div>{peopleOptions.find((entry) => entry.id === String(row.profile_id || ""))?.label || "Standalone"}</div>
                </Table.Td>
                <Table.Td>
                  <div>{row.default_fund?.name || labelMaps.fund.get(String(row.default_fund_id || "")) || "-"}</div>
                  <div className="text-xs text-slate-500">{row.default_grant?.name || labelMaps.grant.get(String(row.default_grant_id || "")) || "No default grant"}</div>
                </Table.Td>
                <Table.Td className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline-secondary" onClick={() => openEdit(row)} disabled={busy}>
                      {actionLoading === `edit-worker-${row.id}` ? "Opening..." : <Lucide icon="FilePenLine" className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      disabled={busy}
                      onClick={async () => {
                        if (!window.confirm(`Delete payroll worker "${row.full_name}"? Workers with payroll history will be marked inactive instead.`)) return;
                        try {
                          setActionLoading(`delete-worker-${row.id}`);
                          const result = await deletePayrollWorker(row.id);
                          setNotice({
                            tone: "success",
                            message:
                              result.action === "deleted"
                                ? "Payroll worker deleted."
                                : `Payroll worker marked inactive because they have payroll history${statusFilter === "active" ? ". The row will drop out of the active list after refresh." : "."}`,
                          });
                          await load();
                        } catch (error: any) {
                          setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to delete payroll worker." });
                        } finally {
                          setActionLoading("");
                        }
                      }}
                    >
                      {actionLoading === `delete-worker-${row.id}` ? "Deleting..." : <Lucide icon="Trash2" className="w-4 h-4" />}
                    </Button>
                  </div>
                </Table.Td>
              </Table.Tr>
            ))}
            {!rows.length ? (
              <Table.Tr>
                <Table.Td colSpan={6} className="text-center text-slate-500 py-10">No payroll workers found.</Table.Td>
              </Table.Tr>
            ) : null}
          </Table.Tbody>
        </Table>
      </div>

      <Dialog open={showEditor} onClose={() => setShowEditor(false)} size="xl">
        <Dialog.Panel className="max-h-[92vh] overflow-y-auto">
          <Dialog.Title>
            <div className="mr-auto">
              <h2 className="text-base font-medium">{editingId ? "Edit Payroll Worker" : "New Payroll Worker"}</h2>
              <div className="text-xs text-slate-500 mt-1">Move left to right: identity, pay setup, allocation, then compliance details.</div>
            </div>
          </Dialog.Title>
          <Dialog.Description>
            <div className="mb-4 flex flex-wrap gap-2">
              {workerSteps.map((step, index) => (
                <Button
                  key={step.id}
                  size="sm"
                  variant={editorStep === step.id ? "primary" : "outline-secondary"}
                  onClick={() => setEditorStep(step.id)}
                >
                  {index + 1}. {step.title}
                </Button>
              ))}
            </div>

            {editorStep === "identity" ? (
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 md:col-span-4">
                  <FormLabel>Worker Type</FormLabel>
                  <FormSelect value={form.worker_type} onChange={(e) => setForm((prev: any) => ({ ...prev, worker_type: e.target.value }))}>
                    <option value="employee">Employee</option>
                    <option value="consultant">Consultant</option>
                  </FormSelect>
                </div>
                <div className="col-span-12 md:col-span-8">
                  <FormLabel>Linked Staff Profile</FormLabel>
                  <TomSelect
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
                    options={{ placeholder: "Search staff profile", maxOptions: 200 }}
                    className="w-full"
                  >
                    <option value="">Standalone worker</option>
                    {peopleOptions.map((row) => (
                      <option key={row.id} value={row.id}>{row.label}</option>
                    ))}
                  </TomSelect>
                </div>
                <div className="col-span-12 md:col-span-6">
                  <FormLabel>Full Name</FormLabel>
                  <FormInput value={form.full_name} onChange={(e) => setForm((prev: any) => ({ ...prev, full_name: e.target.value }))} />
                </div>
                <div className="col-span-12 md:col-span-6">
                  <FormLabel>Email</FormLabel>
                  <FormInput value={form.email} onChange={(e) => setForm((prev: any) => ({ ...prev, email: e.target.value }))} />
                </div>
                <div className="col-span-12 md:col-span-3">
                  <FormLabel>Staff Code</FormLabel>
                  <FormInput value={form.staff_code} onChange={(e) => setForm((prev: any) => ({ ...prev, staff_code: e.target.value }))} />
                </div>
                <div className="col-span-12 md:col-span-3">
                  <FormLabel>Status</FormLabel>
                  <FormSelect value={form.status} onChange={(e) => setForm((prev: any) => ({ ...prev, status: e.target.value }))}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </FormSelect>
                </div>
                <div className="col-span-12 md:col-span-3">
                  <FormLabel>Currency</FormLabel>
                  <FormInput value={form.currency} onChange={(e) => setForm((prev: any) => ({ ...prev, currency: e.target.value }))} maxLength={3} />
                </div>
                <div className="col-span-12 md:col-span-3">
                  <FormLabel>Start Date</FormLabel>
                  <FormInput type="date" value={form.start_date} onChange={(e) => setForm((prev: any) => ({ ...prev, start_date: e.target.value }))} />
                </div>
                <div className="col-span-12 md:col-span-4">
                  <FormLabel>Organization</FormLabel>
                  <FormSelect value={form.organization_id} onChange={(e) => setForm((prev: any) => ({ ...prev, organization_id: e.target.value }))}>
                    <option value="">Select organization</option>
                    {organizations.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
                  </FormSelect>
                </div>
                <div className="col-span-12 md:col-span-4">
                  <FormLabel>Team</FormLabel>
                  <FormSelect value={form.team_id} onChange={(e) => setForm((prev: any) => ({ ...prev, team_id: e.target.value }))}>
                    <option value="">Select team</option>
                    {teams.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
                  </FormSelect>
                </div>
                <div className="col-span-12 md:col-span-4">
                  <FormLabel>Project</FormLabel>
                  <TomSelect value={form.project_id} onChange={(e) => setForm((prev: any) => ({ ...prev, project_id: e.target.value }))}>
                    <option value="">Select project</option>
                    {projects.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
                  </TomSelect>
                </div>
              </div>
            ) : null}

            {editorStep === "pay" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-4 rounded border p-4">
                  <div className="col-span-12 md:col-span-3">
                    <FormLabel>Pay Basis</FormLabel>
                    <FormSelect value={form.pay_basis} onChange={(e) => setForm((prev: any) => ({ ...prev, pay_basis: e.target.value }))}>
                      <option value="monthly_fixed">Monthly Fixed Salary</option>
                      <option value="hourly_timesheet">Hourly From Timesheet</option>
                      <option value="daily_rate">Daily Rate</option>
                      <option value="retainer">Monthly Retainer</option>
                      <option value="manual">Manual Figure</option>
                    </FormSelect>
                  </div>
                  <div className="col-span-12 md:col-span-4">
                    <FormLabel>{form.pay_basis === "hourly_timesheet" ? "Hourly Rate" : form.pay_basis === "daily_rate" ? "Daily Rate" : "Base Amount"}</FormLabel>
                    <FormInput type="number" value={form.base_amount} onChange={(e) => setForm((prev: any) => ({ ...prev, base_amount: e.target.value }))} />
                  </div>
                  <div className="col-span-12 md:col-span-3">
                    <FormLabel>Effective From</FormLabel>
                    <FormInput type="date" value={form.effective_from} onChange={(e) => setForm((prev: any) => ({ ...prev, effective_from: e.target.value }))} />
                  </div>
                  <div className="col-span-12 md:col-span-2">
                    <FormLabel>Payment Mode</FormLabel>
                    <FormSelect value={form.payment_mode} onChange={(e) => setForm((prev: any) => ({ ...prev, payment_mode: e.target.value }))}>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                    </FormSelect>
                  </div>
                  <div className="col-span-12 md:col-span-4">
                    <FormLabel>Standard Hours Per Day</FormLabel>
                    <FormInput type="number" value={form.standard_hours_per_day} onChange={(e) => setForm((prev: any) => ({ ...prev, standard_hours_per_day: e.target.value }))} />
                  </div>
                </div>

                <div className="rounded border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">Recurring Components</div>
                      <div className="text-xs text-slate-500">Add allowances, deductions, or consultancy fees that should repeat every run.</div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      onClick={() =>
                        setForm((prev: any) => ({
                          ...prev,
                          profile_components: [...(prev.profile_components || []), { component_id: "", amount: "", rate: "", formula: "" }],
                        }))
                      }
                    >
                      <Lucide icon="Plus" className="w-4 h-4 mr-1" />
                      Add Component
                    </Button>
                  </div>
                  <div className="mt-3 space-y-3">
                    {(form.profile_components || []).map((row: any, index: number) => (
                      <div key={`component-${index}`} className="grid grid-cols-12 gap-3 rounded border p-3">
                        {(() => {
                          const selectedComponent = componentMap.get(String(row.component_id));
                          const calculationType = String(selectedComponent?.calculation_type || "fixed");
                          const showAmount = calculationType === "fixed";
                          const showRate = calculationType === "percentage";
                          const showFormula = calculationType === "formula";

                          return (
                            <>
                        <div className="col-span-12 md:col-span-8">
                          <FormLabel>Component</FormLabel>
                          <TomSelect
                            value={row.component_id}
                            onChange={(e) => setForm((prev: any) => ({
                              ...prev,
                              profile_components: (prev.profile_components || []).map((entry: any, entryIndex: number) => entryIndex === index ? { ...entry, component_id: e.target.value } : entry),
                            }))}
                          >
                            <option value="">Select component</option>
                            {components.map((component) => <option key={component.id} value={component.id}>{component.name}</option>)}
                          </TomSelect>
                          {row.component_id ? (
                            <div className="mt-2 text-xs text-slate-500">
                              {String(selectedComponent?.component_type || "earning").replaceAll("_", " ")}
                              {" · "}
                              {calculationType.replaceAll("_", " ")}
                            </div>
                          ) : null}
                        </div>
                        <div className="col-span-2 md:col-span-1 flex items-end md:order-last">
                          <Button variant="outline-danger" className="w-full" onClick={() => setForm((prev: any) => ({ ...prev, profile_components: (prev.profile_components || []).filter((_: unknown, entryIndex: number) => entryIndex !== index) }))}>
                            <Lucide icon="Trash2" className="w-4 h-4" />
                          </Button>
                        </div>
                        {showAmount ? (
                        <div className="col-span-10 md:col-span-3">
                          <FormLabel>Amount</FormLabel>
                          <FormInput type="number" value={row.amount} onChange={(e) => setForm((prev: any) => ({
                            ...prev,
                            profile_components: (prev.profile_components || []).map((entry: any, entryIndex: number) => entryIndex === index ? { ...entry, amount: e.target.value } : entry),
                          }))} />
                        </div>
                        ) : null}
                        {showRate ? (
                        <div className="col-span-10 md:col-span-3">
                          <FormLabel>Rate / %</FormLabel>
                          <FormInput
                            type="number"
                            value={row.rate}
                            onChange={(e) =>
                              setForm((prev: any) => ({
                                ...prev,
                                profile_components: (prev.profile_components || []).map((entry: any, entryIndex: number) =>
                                  entryIndex === index ? { ...entry, rate: e.target.value } : entry
                                ),
                              }))
                            }
                            placeholder="e.g. 10"
                          />
                        </div>
                        ) : null}
                        {showFormula ? (
                        <div className="col-span-10 md:col-span-11">
                          <FormLabel>Formula</FormLabel>
                          <FormInput
                            value={row.formula}
                            onChange={(e) =>
                              setForm((prev: any) => ({
                                ...prev,
                                profile_components: (prev.profile_components || []).map((entry: any, entryIndex: number) =>
                                  entryIndex === index ? { ...entry, formula: e.target.value } : entry
                                ),
                              }))
                            }
                            placeholder="Optional formula expression"
                          />
                        </div>
                        ) : null}
                        {!row.component_id ? (
                        <div className="col-span-10 md:col-span-3">
                          <FormLabel>Amount</FormLabel>
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
                        ) : null}
                            </>
                          );
                        })()}
                      </div>
                    ))}
                    {!form.profile_components.length ? <div className="text-sm text-slate-500">No recurring components yet. You can still save a worker with only a base amount.</div> : null}
                  </div>
                </div>
              </div>
            ) : null}

            {editorStep === "allocation" ? (
              <div className="space-y-4">
                <div className="rounded border p-4">
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 md:col-span-4">
                      <FormLabel>Allocation Mode</FormLabel>
                      <FormSelect value={form.allocation_mode} onChange={(e) => setForm((prev: any) => ({ ...prev, allocation_mode: e.target.value }))}>
                        <option value="fixed">Fixed Allocation</option>
                        <option value="timesheet">Timesheet Driven</option>
                        <option value="hybrid">Hybrid Fixed + Timesheet</option>
                      </FormSelect>
                    </div>
                    {form.allocation_mode === "hybrid" ? (
                      <div className="col-span-12 md:col-span-4">
                        <FormLabel>Fixed Allocation Share %</FormLabel>
                        <FormInput type="number" value={form.hybrid_fixed_percent} onChange={(e) => setForm((prev: any) => ({ ...prev, hybrid_fixed_percent: e.target.value }))} />
                      </div>
                    ) : null}
                    <div className="col-span-12 md:col-span-8">
                      <div className="rounded bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        Fixed uses the worker allocation rows directly. Timesheet reads approved project/fund/grant time splits on the payroll run. Hybrid blends both using the fixed share above.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded border p-4">
                  <div className="font-medium">Default Fund & Grant</div>
                  <div className="mt-1 text-xs text-slate-500">These defaults help with quick payroll setup before line-by-line allocations are added.</div>
                  <div className="mt-4 grid grid-cols-12 gap-4">
                    <div className="col-span-12 md:col-span-6">
                      <FormLabel>Default Fund</FormLabel>
                      <TomSelect value={form.default_fund_id} onChange={(e) => setForm((prev: any) => ({ ...prev, default_fund_id: e.target.value }))}>
                        <option value="">No default fund</option>
                        {funds.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
                      </TomSelect>
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <FormLabel>Default Grant</FormLabel>
                      <TomSelect value={form.default_grant_id} onChange={(e) => setForm((prev: any) => ({ ...prev, default_grant_id: e.target.value }))}>
                        <option value="">No default grant</option>
                        {grants.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
                      </TomSelect>
                    </div>
                  </div>
                </div>

                <AllocationRowsEditor
                  rows={form.allocations || []}
                  organizations={organizations}
                  teams={teams}
                  projects={projects}
                  funds={funds}
                  grants={grants}
                  onChange={(rows) => setForm((prev: any) => ({ ...prev, allocations: rows }))}
                />
              </div>
            ) : null}

            {editorStep === "compliance" ? (
              <div className="space-y-4">
                <div className="rounded border p-4">
                  <div className="font-medium">Statutory Overrides</div>
                  <div className="mt-1 text-xs text-slate-500">Only change these when a worker should not use the global payroll settings.</div>
                  <div className="mt-4 grid grid-cols-12 gap-4">
                    <label className="col-span-12 md:col-span-3 inline-flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form.apply_tax} onChange={(e) => setForm((prev: any) => ({ ...prev, apply_tax: e.target.checked }))} />
                      Apply Tax
                    </label>
                    <label className="col-span-12 md:col-span-3 inline-flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form.apply_pension} onChange={(e) => setForm((prev: any) => ({ ...prev, apply_pension: e.target.checked }))} />
                      Apply Pension
                    </label>
                    <label className="col-span-12 md:col-span-3 inline-flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form.employer_covers_paye} onChange={(e) => setForm((prev: any) => ({ ...prev, employer_covers_paye: e.target.checked }))} />
                      Employer Covers PAYE
                    </label>
                    <div className="col-span-12 md:col-span-4">
                      <FormLabel>PAYE Tax Table Override</FormLabel>
                      <TomSelect value={form.tax_table_id} onChange={(e) => setForm((prev: any) => ({ ...prev, tax_table_id: e.target.value }))}>
                        <option value="">Use payroll default</option>
                        {taxTables
                          .filter((row) => ["employee", "all"].includes(String(row.worker_type || "employee")))
                          .map((row) => (
                            <option key={row.id} value={row.id}>
                              {row.name}
                            </option>
                          ))}
                      </TomSelect>
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

                <div className="grid grid-cols-12 gap-4 rounded border p-4">
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
                </div>
              </div>
            ) : null}
          </Dialog.Description>
          <Dialog.Footer className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-500">Allocation total: {allocationTotal}%</div>
            <div className="flex gap-2">
              <Button variant="outline-secondary" onClick={() => setShowEditor(false)} disabled={saving}>Cancel</Button>
              <Button variant="outline-secondary" onClick={() => setEditorStep(workerSteps[Math.max(0, workerSteps.findIndex((step) => step.id === editorStep) - 1)].id)} disabled={editorStep === "identity" || saving}>Previous</Button>
              {editorStep !== "compliance" ? (
                <Button variant="primary" onClick={() => setEditorStep(workerSteps[Math.min(workerSteps.length - 1, workerSteps.findIndex((step) => step.id === editorStep) + 1)].id)} disabled={saving}>Next</Button>
              ) : null}
              <Button variant="primary" onClick={() => void saveWorker()} disabled={saving}>{saving ? "Saving..." : "Save Worker"}</Button>
            </div>
          </Dialog.Footer>
        </Dialog.Panel>
      </Dialog>
    </>
  );
}

export default FinancePayrollWorkersPage;
