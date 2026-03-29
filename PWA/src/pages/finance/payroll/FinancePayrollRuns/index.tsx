import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import Table from "@/components/Base/Table";
import { Dialog } from "@/components/Base/Headless";
import { FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import AllocationRowsEditor, { type AllocationRowValue } from "@/components/Payroll/AllocationRowsEditor";
import { listFinanceAccounts } from "@/services/finance";
import { listOrganizations } from "@/services/organizations";
import { listProjects } from "@/services/projects";
import { listTeams } from "@/services/teams";
import { listFinanceFunds, listFinanceGrants } from "@/services/financeAccounting";
import {
  approvePayrollRun,
  closePayrollRun,
  createPayrollRun,
  distributePayrollRunPayslips,
  generatePayrollBankSchedule,
  generatePayrollRun,
  generatePayrollRunItemPayslip,
  generatePayrollRunPayslipsPackage,
  getPayrollRun,
  listPayrollRuns,
  payPayrollRun,
  rejectPayrollRun,
  reopenPayrollRun,
  reviewPayrollRun,
  submitPayrollRun,
  updatePayrollRun,
  updatePayrollRunAllocations,
  updatePayrollRunItem,
  updatePayrollRunWorkerTimesheetAllocations,
} from "@/services/payroll";
import { formatDisplayDate, formatMoney, statusBadgeClass } from "@/utils/formatting";

const emptyAllocation: AllocationRowValue = {
  organization_id: "",
  team_id: "",
  project_id: "",
  fund_id: "",
  grant_id: "",
  allocation_percent: "100",
};

const emptyForm = {
  name: "",
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  period_start: "",
  period_end: "",
  currency: "NGN",
  notes: "",
  paid_from_account_id: "",
};

const runGuideSteps = [
  "Create the run and check the payment account.",
  "Generate payroll items from active workers and profiles.",
  "Review amounts, allocations, and payment status.",
  "Submit for review and complete approval.",
  "Mark paid, export bank schedule, then distribute payslips.",
];

const detailTabs = [
  { id: "overview", title: "Overview" },
  { id: "workers", title: "Workers" },
  { id: "history", title: "History" },
  { id: "delivery", title: "Distribution" },
] as const;

type DetailTab = (typeof detailTabs)[number]["id"];
type ItemEditorStep = "pay" | "allocation";

function monthBoundary(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

const downloadBase64File = (fileName: string, mimeType: string, contentBase64: string) => {
  const bytes = atob(contentBase64);
  const array = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) array[i] = bytes.charCodeAt(i);
  const blob = new Blob([array], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

function FinancePayrollRunsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [funds, setFunds] = useState<any[]>([]);
  const [grants, setGrants] = useState<any[]>([]);
  const [detail, setDetail] = useState<any | null>(null);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showItemEditor, setShowItemEditor] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");
  const [itemEditorStep, setItemEditorStep] = useState<ItemEditorStep>("pay");
  const [form, setForm] = useState(() => {
    const { start, end } = monthBoundary(new Date().getFullYear(), new Date().getMonth() + 1);
    return { ...emptyForm, period_start: start, period_end: end };
  });

  const readSettledValue = <T,>(result: PromiseSettledResult<T>, fallback: T): T =>
    result.status === "fulfilled" ? result.value : fallback;

  const closeDetail = () => {
    setShowDetail(false);
    setDetailTab("overview");
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("run_id");
      return next;
    });
  };

  const load = async () => {
    try {
      setLoading(true);
      const [runRes, accountRes, organizationRows, teamRows, projectRows, fundRows, grantRows] = await Promise.allSettled([
        listPayrollRuns({ page: 1, per_page: 100, status: statusFilter || undefined }),
        listFinanceAccounts({ is_active: true }),
        listOrganizations({ is_active: true }),
        listTeams({ active_only: true }),
        listProjects({ active_only: false }),
        listFinanceFunds(),
        listFinanceGrants(),
      ]);

      if (runRes.status !== "fulfilled") {
        throw runRes.reason;
      }

      const lookupFailures = [accountRes, organizationRows, teamRows, projectRows, fundRows, grantRows].filter(
        (result) => result.status === "rejected"
      ).length;

      setRows(runRes.value.data ?? []);
      setAccounts(readSettledValue(accountRes, []));
      setOrganizations(readSettledValue(organizationRows, []));
      setTeams(readSettledValue(teamRows, []));
      setProjects(readSettledValue(projectRows, []));
      setFunds(readSettledValue(fundRows, []));
      setGrants(readSettledValue(grantRows, []));

      if (lookupFailures > 0) {
        setNotice({
          tone: "warning",
          message: `Payroll runs loaded with ${lookupFailures} supporting lookup${lookupFailures === 1 ? "" : "s"} unavailable.`,
        });
      }
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load payroll runs." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [statusFilter]);

  useEffect(() => {
    const runId = searchParams.get("run_id");
    if (!runId) return;
    void openDetail(runId);
  }, [searchParams]);

  const totals = useMemo(
    () => rows.reduce((acc, row) => ({ gross: acc.gross + Number(row.totals?.gross || 0), net: acc.net + Number(row.totals?.net || 0) }), { gross: 0, net: 0 }),
    [rows]
  );

  const itemAllocationTotal = useMemo(
    () => (editingItem?.allocations || []).reduce((sum: number, row: any) => sum + Number(row.allocation_percent || 0), 0),
    [editingItem]
  );
  const itemTimesheetAllocationTotal = useMemo(
    () => (editingItem?.timesheet_allocations || []).reduce((sum: number, row: any) => sum + Number(row.allocation_percent || 0), 0),
    [editingItem]
  );

  const openCreate = () => {
    const now = new Date();
    const { start, end } = monthBoundary(now.getFullYear(), now.getMonth() + 1);
    setEditingId("");
    setForm({ ...emptyForm, year: now.getFullYear(), month: now.getMonth() + 1, period_start: start, period_end: end });
    setShowEditor(true);
  };

  const openEdit = (row: any) => {
    setEditingId(row.id);
    setForm({
      name: row.name || "",
      year: row.year,
      month: row.month,
      period_start: row.period_start ? String(row.period_start).slice(0, 10) : "",
      period_end: row.period_end ? String(row.period_end).slice(0, 10) : "",
      currency: row.currency || "NGN",
      notes: row.notes || "",
      paid_from_account_id: row.paid_from_account?.id || "",
    });
    setShowEditor(true);
  };

  const openDetail = async (id: string) => {
    try {
      setShowDetail(true);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("run_id", id);
        return next;
      });
      setDetail(await getPayrollRun(id));
    } catch (error: any) {
      setShowDetail(false);
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load payroll run detail." });
    }
  };

  const openItemEditor = (item: any) => {
    setEditingItem({
      ...item,
      gross_pay: String(item.gross_pay ?? ""),
      total_deductions: String(item.total_deductions ?? ""),
      employer_cost_total: String(item.employer_cost_total ?? ""),
      computed_net_pay: String(item.computed_net_pay ?? item.net_pay ?? ""),
      actual_net_pay: String(item.actual_net_pay ?? item.net_pay ?? ""),
      net_adjustment_reason: item.net_adjustment_reason || "",
      net_pay: String(item.net_pay ?? ""),
      allocations: (item.allocations || []).length
        ? item.allocations.map((row: any) => ({
            organization_id: row.organization_id || "",
            team_id: row.team_id || "",
            project_id: row.project_id || "",
            fund_id: row.fund_id || "",
            grant_id: row.grant_id || "",
            allocation_percent: String(row.allocation_percent ?? "0"),
          }))
        : [emptyAllocation],
      timesheet_allocations: (item.timesheet_allocations || []).length
        ? item.timesheet_allocations.map((row: any) => ({
            organization_id: row.organization_id || "",
            team_id: row.team_id || "",
            project_id: row.project_id || "",
            fund_id: row.fund_id || "",
            grant_id: row.grant_id || "",
            allocation_percent: String(row.allocation_percent ?? "0"),
            hours: String(row.hours ?? ""),
            notes: row.notes || "",
          }))
        : [emptyAllocation],
    });
    setItemEditorStep("pay");
    setShowItemEditor(true);
  };

  const saveRun = async () => {
    try {
      setSaving(true);
      const payload = { ...form, paid_from_account_id: form.paid_from_account_id || undefined };
      if (editingId) await updatePayrollRun(editingId, payload);
      else await createPayrollRun(payload);
      setShowEditor(false);
      setEditingId("");
      setNotice({ tone: "success", message: `Payroll run ${editingId ? "updated" : "created"} successfully.` });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save payroll run." });
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (action: () => Promise<any>, successMessage: string) => {
    try {
      await action();
      setNotice({ tone: "success", message: successMessage });
      await load();
      if (detail?.id) setDetail(await getPayrollRun(detail.id));
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Action failed." });
    }
  };

  const downloadBankSchedule = async (id: string) => {
    try {
      const response = await generatePayrollBankSchedule(id);
      downloadBase64File(response.file_name, response.mime_type, response.content_base64);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to generate bank schedule." });
    }
  };

  const downloadPayslipPackage = async (id: string) => {
    try {
      const response = await generatePayrollRunPayslipsPackage(id);
      downloadBase64File(response.file_name, response.mime_type, response.content_base64);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to generate payslip package." });
    }
  };

  const downloadPayslip = async (runId: string, itemId: string) => {
    try {
      const response = await generatePayrollRunItemPayslip(runId, itemId);
      downloadBase64File(response.file_name, response.mime_type, response.content_base64);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to generate payslip." });
    }
  };

  const saveItem = async () => {
    if (!detail?.id || !editingItem?.id) return;
    try {
      await updatePayrollRunItem(detail.id, editingItem.id, {
        gross_pay: Number(editingItem.gross_pay || 0),
        total_deductions: Number(editingItem.total_deductions || 0),
        employer_cost_total: Number(editingItem.employer_cost_total || 0),
        net_pay: Number(editingItem.computed_net_pay || 0),
        actual_net_pay: Number(editingItem.actual_net_pay || 0),
        net_adjustment_reason: editingItem.net_adjustment_reason || undefined,
        payment_status: editingItem.payment_status,
        payment_reference: editingItem.payment_reference || undefined,
      });
      await updatePayrollRunAllocations(detail.id, editingItem.id, {
        allocations: (editingItem.allocations || []).map((row: any) => ({
          organization_id: row.organization_id || undefined,
          team_id: row.team_id || undefined,
          project_id: row.project_id || undefined,
          fund_id: row.fund_id || undefined,
          grant_id: row.grant_id || undefined,
          allocation_percent: Number(row.allocation_percent || 0),
        })),
      });
      await updatePayrollRunWorkerTimesheetAllocations(detail.id, editingItem.worker_id, {
        allocations: (editingItem.timesheet_allocations || []).map((row: any) => ({
          organization_id: row.organization_id || undefined,
          team_id: row.team_id || undefined,
          project_id: row.project_id || undefined,
          fund_id: row.fund_id || undefined,
          grant_id: row.grant_id || undefined,
          allocation_percent: Number(row.allocation_percent || 0),
          hours: Number(row.hours || 0),
          notes: row.notes || undefined,
        })),
      });
      setDetail(await getPayrollRun(detail.id));
      setShowItemEditor(false);
      setEditingItem(null);
      setNotice({ tone: "success", message: "Payroll run item updated." });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to update payroll run item." });
    }
  };

  const distributePayslips = async (id: string) => {
    try {
      const response = await distributePayrollRunPayslips(id);
      setNotice({ tone: "success", message: `Payslips distributed. Sent: ${response.sent}. Skipped: ${response.skipped}. Failed: ${response.failed}.` });
      if (detail?.id) setDetail(await getPayrollRun(detail.id));
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to distribute payslips." });
    }
  };

  const workflowState = (status?: string) => {
    const current = status || "draft";
    const stateSet = new Set<string>();
    if (["generated", "under_review", "approved", "paid", "closed"].includes(current)) stateSet.add("generated");
    if (["under_review", "approved", "paid", "closed"].includes(current)) stateSet.add("review");
    if (["approved", "paid", "closed"].includes(current)) stateSet.add("approved");
    if (["paid", "closed"].includes(current)) stateSet.add("paid");
    if (["closed"].includes(current)) stateSet.add("closed");
    return stateSet;
  };

  const currentWorkflow = workflowState(detail?.status);
  const nextAction = !detail ? null : detail.status === "draft" ? { label: "Generate", action: () => runAction(() => generatePayrollRun(detail.id), "Payroll run generated.") } : detail.status === "generated" ? { label: "Submit", action: () => runAction(() => submitPayrollRun(detail.id), "Payroll run submitted for review.") } : detail.status === "under_review" ? { label: "Approve", action: () => runAction(() => approvePayrollRun(detail.id), "Payroll run approved.") } : detail.status === "approved" ? { label: "Mark Paid", action: () => runAction(() => payPayrollRun(detail.id, { paid_from_account_id: detail.paid_from_account?.id }), "Payroll run marked as paid.") } : detail.status === "paid" ? { label: "Close Run", action: () => runAction(() => closePayrollRun(detail.id), "Payroll run closed.") } : null;

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Payroll Runs</h2>
        <div className="flex gap-2">
          <Button variant="outline-secondary" onClick={() => void load()} disabled={loading}>
            <Lucide icon="Undo2" className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button variant="primary" onClick={openCreate}>
            <Lucide icon="Plus" className="w-4 h-4 mr-1" />
            New Run
          </Button>
        </div>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="box p-5 mt-5">
        <div className="font-medium">Monthly payroll flow</div>
        <div className="mt-3 grid gap-3 md:grid-cols-5">
          {runGuideSteps.map((step, index) => (
            <div key={step} className="rounded border px-3 py-3 text-xs text-slate-600">
              <div className="mb-1 font-medium text-slate-700">Step {index + 1}</div>
              {step}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 mt-5 md:grid-cols-4">
        <div className="box p-5"><div className="text-slate-500 text-sm">Runs</div><div className="text-2xl font-semibold mt-2">{rows.length}</div></div>
        <div className="box p-5"><div className="text-slate-500 text-sm">Gross</div><div className="text-2xl font-semibold mt-2">{formatMoney(totals.gross)}</div></div>
        <div className="box p-5"><div className="text-slate-500 text-sm">Net</div><div className="text-2xl font-semibold mt-2">{formatMoney(totals.net)}</div></div>
        <div className="box p-5"><div className="text-slate-500 text-sm">Paid Runs</div><div className="text-2xl font-semibold mt-2">{rows.filter((row) => row.status === "paid").length}</div></div>
      </div>

      <div className="grid grid-cols-12 gap-4 mt-5 box p-5">
        <div className="col-span-12 md:col-span-4">
          <FormLabel>Status</FormLabel>
          <FormSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="generated">Generated</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
            <option value="closed">Closed</option>
          </FormSelect>
        </div>
        <div className="col-span-12 md:col-span-8 flex items-end justify-end text-xs text-slate-500">
          Use the run detail view to review worker items, export bank schedules, and distribute payslips.
        </div>
      </div>

      <div className="box p-5 mt-5">
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Run</Table.Th>
              <Table.Th>Period</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th className="text-right">Net Pay</Table.Th>
              <Table.Th className="text-right">Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((row) => (
              <Table.Tr key={row.id}>
                <Table.Td>
                  <div className="font-medium">{row.name}</div>
                  <div className="text-xs text-slate-500">{row.item_count || 0} workers</div>
                </Table.Td>
                <Table.Td>{formatDisplayDate(row.period_start)} - {formatDisplayDate(row.period_end)}</Table.Td>
                <Table.Td><span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize ${statusBadgeClass(row.status)}`}>{String(row.status || "draft").replaceAll("_", " ")}</span></Table.Td>
                <Table.Td className="text-right">{formatMoney(row.totals?.net || 0)}</Table.Td>
                <Table.Td className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline-primary" onClick={() => void openDetail(row.id)}><Lucide icon="Eye" className="w-4 h-4" /></Button>
                    <Button size="sm" variant="outline-secondary" onClick={() => openEdit(row)}><Lucide icon="FilePenLine" className="w-4 h-4" /></Button>
                    <Button size="sm" variant="primary" onClick={() => void runAction(() => generatePayrollRun(row.id), "Payroll run generated.")}>Generate</Button>
                  </div>
                </Table.Td>
              </Table.Tr>
            ))}
            {!rows.length ? <Table.Tr><Table.Td colSpan={5} className="text-center text-slate-500 py-10">No payroll runs found.</Table.Td></Table.Tr> : null}
          </Table.Tbody>
        </Table>
      </div>

      <Dialog open={showEditor} onClose={() => setShowEditor(false)}>
        <Dialog.Panel>
          <Dialog.Title><h2 className="mr-auto text-base font-medium">{editingId ? "Edit Payroll Run" : "New Payroll Run"}</h2></Dialog.Title>
          <Dialog.Description className="grid grid-cols-12 gap-4">
            <div className="col-span-12"><FormLabel>Name</FormLabel><FormInput value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-3"><FormLabel>Year</FormLabel><FormInput type="number" value={form.year} onChange={(e) => { const year = Number(e.target.value || new Date().getFullYear()); const { start, end } = monthBoundary(year, form.month); setForm((prev) => ({ ...prev, year, period_start: start, period_end: end })); }} /></div>
            <div className="col-span-12 md:col-span-3"><FormLabel>Month</FormLabel><FormInput type="number" min={1} max={12} value={form.month} onChange={(e) => { const month = Number(e.target.value || 1); const { start, end } = monthBoundary(form.year, month); setForm((prev) => ({ ...prev, month, period_start: start, period_end: end })); }} /></div>
            <div className="col-span-12 md:col-span-3"><FormLabel>Period Start</FormLabel><FormInput type="date" value={form.period_start} onChange={(e) => setForm((prev) => ({ ...prev, period_start: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-3"><FormLabel>Period End</FormLabel><FormInput type="date" value={form.period_end} onChange={(e) => setForm((prev) => ({ ...prev, period_end: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-6"><FormLabel>Payment Account</FormLabel><FormSelect value={form.paid_from_account_id} onChange={(e) => setForm((prev) => ({ ...prev, paid_from_account_id: e.target.value }))}><option value="">Select account</option>{accounts.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</FormSelect></div>
            <div className="col-span-12 md:col-span-6"><FormLabel>Currency</FormLabel><FormInput value={form.currency} onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))} /></div>
            <div className="col-span-12"><FormLabel>Notes</FormLabel><FormTextarea value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} /></div>
          </Dialog.Description>
          <Dialog.Footer>
            <Button variant="outline-secondary" onClick={() => setShowEditor(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => void saveRun()} disabled={saving}>{saving ? "Saving..." : "Save Run"}</Button>
          </Dialog.Footer>
        </Dialog.Panel>
      </Dialog>

      <Dialog open={showDetail} onClose={closeDetail} size="xl">
        <Dialog.Panel className="max-h-[92vh] overflow-y-auto">
          <Dialog.Title>
            <div className="mr-auto flex w-full items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-medium">{detail?.name || "Payroll Run Detail"}</h2>
                <div className="mt-1 text-xs text-slate-500">{detail ? `${formatDisplayDate(detail.period_start)} - ${formatDisplayDate(detail.period_end)}` : "Loading run detail..."}</div>
              </div>
              {detail ? <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize ${statusBadgeClass(detail.status)}`}>{String(detail.status || "draft").replaceAll("_", " ")}</span> : null}
            </div>
          </Dialog.Title>
          <Dialog.Description>
            {detail ? (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div className="rounded border p-3"><div className="text-xs text-slate-500">Workers</div><div className="font-medium">{detail.items?.length || 0}</div></div>
                  <div className="rounded border p-3"><div className="text-xs text-slate-500">Gross</div><div className="font-medium">{formatMoney(detail.totals.gross)}</div></div>
                  <div className="rounded border p-3"><div className="text-xs text-slate-500">Deductions</div><div className="font-medium">{formatMoney(detail.totals.deductions)}</div></div>
                  <div className="rounded border p-3"><div className="text-xs text-slate-500">Net</div><div className="font-medium">{formatMoney(detail.totals.net)}</div></div>
                </div>

                <div className="mt-5 rounded border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="font-medium">Workflow</div>
                      <div className="text-xs text-slate-500">Move the run from generation to payment and closeout.</div>
                    </div>
                    {nextAction ? <Button variant="primary" onClick={() => void nextAction.action()}>{nextAction.label}</Button> : null}
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-5">
                    {[{ id: "generated", label: "Generated" }, { id: "review", label: "Under Review" }, { id: "approved", label: "Approved" }, { id: "paid", label: "Paid" }, { id: "closed", label: "Closed" }].map((step) => (
                      <div key={step.id} className={`rounded border px-3 py-3 text-xs ${currentWorkflow.has(step.id) ? "border-success/30 bg-success/5 text-success" : "text-slate-500"}`}>
                        <div className="font-medium">{step.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Button variant="primary" onClick={() => void runAction(() => generatePayrollRun(detail.id), "Payroll run generated.")}>Generate</Button>
                  <Button variant="outline-primary" onClick={() => void runAction(() => submitPayrollRun(detail.id), "Payroll run submitted for review.")}>Submit</Button>
                  <Button variant="outline-primary" onClick={() => void runAction(() => reviewPayrollRun(detail.id), "Payroll run moved to review.")}>Review</Button>
                  <Button variant="outline-primary" onClick={() => void runAction(() => approvePayrollRun(detail.id), "Payroll run approved.")}>Approve</Button>
                  <Button variant="outline-danger" onClick={() => void runAction(() => rejectPayrollRun(detail.id), "Payroll run rejected.")}>Reject</Button>
                  <Button variant="outline-secondary" onClick={() => void runAction(() => reopenPayrollRun(detail.id), "Payroll run reopened.")}>Reopen</Button>
                  <Button variant="outline-success" onClick={() => void runAction(() => payPayrollRun(detail.id, { paid_from_account_id: detail.paid_from_account?.id }), "Payroll run marked as paid.")}>Mark Paid</Button>
                  <Button variant="outline-secondary" onClick={() => void downloadPayslipPackage(detail.id)}>Payslip Package</Button>
                  <Button variant="outline-secondary" onClick={() => void distributePayslips(detail.id)}>Email Payslips</Button>
                  <Button variant="outline-secondary" onClick={() => void downloadBankSchedule(detail.id)}>Bank Schedule</Button>
                  <Button variant="outline-secondary" onClick={() => void runAction(() => closePayrollRun(detail.id), "Payroll run closed.")}>Close Run</Button>
                </div>

                {detail.notes ? <div className="mt-4 rounded border p-3"><div className="text-xs text-slate-500 uppercase">Run Notes</div><pre className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{detail.notes}</pre></div> : null}

                <div className="mt-5 flex flex-wrap gap-2 border-b pb-3">
                  {detailTabs.map((tab) => (
                    <Button key={tab.id} size="sm" variant={detailTab === tab.id ? "primary" : "outline-secondary"} onClick={() => setDetailTab(tab.id)}>{tab.title}</Button>
                  ))}
                </div>

                {detailTab === "overview" ? (
                  <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="rounded border p-4">
                      <div className="font-medium">Run summary</div>
                      <dl className="mt-3 space-y-2 text-sm">
                        <div className="flex justify-between gap-4"><dt className="text-slate-500">Payment account</dt><dd>{detail.paid_from_account?.name || "Not set"}</dd></div>
                        <div className="flex justify-between gap-4"><dt className="text-slate-500">Currency</dt><dd>{detail.currency || "NGN"}</dd></div>
                        <div className="flex justify-between gap-4"><dt className="text-slate-500">Prepared by</dt><dd>{detail.prepared_by_user?.full_name || "-"}</dd></div>
                        <div className="flex justify-between gap-4"><dt className="text-slate-500">Approved by</dt><dd>{detail.approved_by_user?.full_name || "-"}</dd></div>
                      </dl>
                    </div>
                    <div className="rounded border p-4">
                      <div className="font-medium">Delivery summary</div>
                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded bg-slate-50 p-3"><div className="text-slate-500">Distributions</div><div className="mt-1 text-lg font-medium">{detail.payslip_distributions?.length || 0}</div></div>
                        <div className="rounded bg-slate-50 p-3"><div className="text-slate-500">Failed</div><div className="mt-1 text-lg font-medium">{(detail.payslip_distributions || []).filter((row: any) => row.status === "failed").length}</div></div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {detailTab === "workers" ? (
                  <div className="mt-4 max-h-[420px] overflow-auto rounded border">
                    <Table>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Worker</Table.Th>
                          <Table.Th>Type</Table.Th>
                          <Table.Th className="text-right">Gross</Table.Th>
                          <Table.Th className="text-right">Deductions</Table.Th>
                          <Table.Th className="text-right">Net</Table.Th>
                          <Table.Th>Status</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {(detail.items || []).map((item: any) => (
                          <Table.Tr key={item.id}>
                            <Table.Td>
                              <div className="font-medium">{item.worker?.fullName || item.worker?.full_name || item.worker_id}</div>
                              <div className="text-xs text-slate-500">{item.worker?.staffCode || item.worker?.staff_code || item.worker?.email || "-"}</div>
                              <div className="text-xs text-slate-500">{String(item.pay_basis || "monthly_fixed").replaceAll("_", " ")} · {String(item.allocation_source || "fixed").replaceAll("_", " ")}</div>
                            </Table.Td>
                            <Table.Td className="capitalize">{item.worker_type}</Table.Td>
                            <Table.Td className="text-right">{formatMoney(item.gross_pay)}</Table.Td>
                            <Table.Td className="text-right">{formatMoney(item.total_deductions)}</Table.Td>
                          <Table.Td className="text-right">{formatMoney(item.net_pay)}</Table.Td>
                            <Table.Td>
                              <div className="flex items-center justify-between gap-2">
                                <span className="capitalize">{String(item.payment_status || "pending").replaceAll("_", " ")}</span>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline-secondary" onClick={() => openItemEditor(item)}><Lucide icon="FilePenLine" className="w-4 h-4" /></Button>
                                  <Button size="sm" variant="outline-secondary" onClick={() => void downloadPayslip(detail.id, item.id)}><Lucide icon="FileText" className="w-4 h-4" /></Button>
                                </div>
                              </div>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </div>
                ) : null}

                {detailTab === "history" ? (
                  detail.events?.length ? (
                    <div className="mt-4 rounded border p-3">
                      <div className="space-y-3 max-h-80 overflow-auto">
                        {detail.events.map((event: any) => (
                          <div key={event.id} className="border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-sm font-medium capitalize">{String(event.event_type || "").replaceAll("_", " ")}</div>
                              <div className="text-xs text-slate-500">{formatDisplayDate(event.created_at)}</div>
                            </div>
                            <div className="text-xs text-slate-500 mt-1">{event.actor?.name || "System"}</div>
                            {event.note ? <div className="text-sm text-slate-700 mt-1">{event.note}</div> : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : <div className="mt-4 text-sm text-slate-500">No run history yet.</div>
                ) : null}

                {detailTab === "delivery" ? (
                  detail.payslip_distributions?.length ? (
                    <div className="mt-4 max-h-80 overflow-auto rounded border">
                      <Table>
                        <Table.Thead><Table.Tr><Table.Th>Worker</Table.Th><Table.Th>Email</Table.Th><Table.Th>Status</Table.Th><Table.Th>Sent</Table.Th><Table.Th>Error</Table.Th></Table.Tr></Table.Thead>
                        <Table.Tbody>
                          {detail.payslip_distributions.map((row: any) => (
                            <Table.Tr key={row.id}>
                              <Table.Td>{row.worker?.full_name || "-"}</Table.Td>
                              <Table.Td>{row.recipient_email || "-"}</Table.Td>
                              <Table.Td className="capitalize">{String(row.status || "").replaceAll("_", " ")}</Table.Td>
                              <Table.Td>{row.sent_at ? formatDisplayDate(row.sent_at) : "-"}</Table.Td>
                              <Table.Td className="text-xs text-slate-500">{row.error_message || "-"}</Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    </div>
                  ) : <div className="mt-4 text-sm text-slate-500">No payslip distributions yet.</div>
                ) : null}
              </>
            ) : <div className="text-sm text-slate-500">Loading run detail...</div>}
          </Dialog.Description>
          <Dialog.Footer><Button variant="outline-secondary" onClick={closeDetail}>Close</Button></Dialog.Footer>
        </Dialog.Panel>
      </Dialog>

      <Dialog open={showItemEditor} onClose={() => setShowItemEditor(false)} size="xl">
        <Dialog.Panel className="max-h-[92vh] overflow-y-auto">
          <Dialog.Title>
            <div className="mr-auto">
              <h2 className="text-base font-medium">Edit Payroll Run Item</h2>
              <div className="mt-1 text-xs text-slate-500">First confirm pay figures, then review allocations before saving.</div>
            </div>
          </Dialog.Title>
          <Dialog.Description>
            <div className="mb-4 flex gap-2">
              <Button size="sm" variant={itemEditorStep === "pay" ? "primary" : "outline-secondary"} onClick={() => setItemEditorStep("pay")}>1. Pay</Button>
              <Button size="sm" variant={itemEditorStep === "allocation" ? "primary" : "outline-secondary"} onClick={() => setItemEditorStep("allocation")}>2. Allocation</Button>
            </div>

            {itemEditorStep === "pay" ? (
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 md:col-span-3"><FormLabel>Gross Pay</FormLabel><FormInput type="number" value={editingItem?.gross_pay || ""} onChange={(e) => setEditingItem((prev: any) => ({ ...prev, gross_pay: e.target.value }))} /></div>
                <div className="col-span-12 md:col-span-3"><FormLabel>Deductions</FormLabel><FormInput type="number" value={editingItem?.total_deductions || ""} onChange={(e) => setEditingItem((prev: any) => ({ ...prev, total_deductions: e.target.value }))} /></div>
                <div className="col-span-12 md:col-span-3"><FormLabel>Employer Cost</FormLabel><FormInput type="number" value={editingItem?.employer_cost_total || ""} onChange={(e) => setEditingItem((prev: any) => ({ ...prev, employer_cost_total: e.target.value }))} /></div>
                <div className="col-span-12 md:col-span-3"><FormLabel>Computed Net Pay</FormLabel><FormInput type="number" value={editingItem?.computed_net_pay || ""} onChange={(e) => setEditingItem((prev: any) => ({ ...prev, computed_net_pay: e.target.value }))} /></div>
                <div className="col-span-12 md:col-span-3"><FormLabel>Actual Net Pay</FormLabel><FormInput type="number" value={editingItem?.actual_net_pay || ""} onChange={(e) => setEditingItem((prev: any) => ({ ...prev, actual_net_pay: e.target.value, net_pay: e.target.value }))} /></div>
                <div className="col-span-12 md:col-span-6"><FormLabel>Payment Status</FormLabel><FormSelect value={editingItem?.payment_status || "pending"} onChange={(e) => setEditingItem((prev: any) => ({ ...prev, payment_status: e.target.value }))}><option value="pending">Pending</option><option value="paid">Paid</option><option value="failed">Failed</option></FormSelect></div>
                <div className="col-span-12 md:col-span-6"><FormLabel>Payment Reference</FormLabel><FormInput value={editingItem?.payment_reference || ""} onChange={(e) => setEditingItem((prev: any) => ({ ...prev, payment_reference: e.target.value }))} /></div>
                <div className="col-span-12"><FormLabel>Net Adjustment Reason</FormLabel><FormTextarea rows={2} value={editingItem?.net_adjustment_reason || ""} onChange={(e) => setEditingItem((prev: any) => ({ ...prev, net_adjustment_reason: e.target.value }))} placeholder="Why does actual payout differ from the computed payroll net?" /></div>
                <div className="col-span-12">
                  <div className="rounded bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    Pay basis: {String(editingItem?.pay_basis || "monthly_fixed").replaceAll("_", " ")}. Allocation source: {String(editingItem?.allocation_source || "fixed").replaceAll("_", " ")}.
                  </div>
                </div>
              </div>
            ) : null}

            {itemEditorStep === "allocation" ? (
              <div className="space-y-4">
                <AllocationRowsEditor
                  rows={editingItem?.allocations || []}
                  organizations={organizations}
                  teams={teams}
                  projects={projects}
                  funds={funds}
                  grants={grants}
                  onChange={(rows) => setEditingItem((prev: any) => ({ ...prev, allocations: rows }))}
                  title="Accounting Allocations"
                  description="These are the final cost splits that will hit journals and reports."
                />
                <AllocationRowsEditor
                  rows={editingItem?.timesheet_allocations || []}
                  organizations={organizations}
                  teams={teams}
                  projects={projects}
                  funds={funds}
                  grants={grants}
                  onChange={(rows) => setEditingItem((prev: any) => ({ ...prev, timesheet_allocations: rows }))}
                  title="Approved Timesheet Splits"
                  description="Capture project or grant time coverage here. Payroll generation uses these rows when the worker allocation mode is timesheet or hybrid."
                  addLabel="Add Timesheet Row"
                  showHours
                />
              </div>
            ) : null}
          </Dialog.Description>
          <Dialog.Footer className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-500">Allocation total: {itemAllocationTotal}% · Timesheet total: {itemTimesheetAllocationTotal}%</div>
            <div className="flex gap-2">
              <Button variant="outline-secondary" onClick={() => setShowItemEditor(false)}>Cancel</Button>
              <Button variant="outline-secondary" onClick={() => setItemEditorStep("pay")} disabled={itemEditorStep === "pay"}>Previous</Button>
              <Button variant="primary" onClick={() => itemEditorStep === "pay" ? setItemEditorStep("allocation") : void saveItem()}>{itemEditorStep === "pay" ? "Next" : "Save Item"}</Button>
            </div>
          </Dialog.Footer>
        </Dialog.Panel>
      </Dialog>
    </>
  );
}

export default FinancePayrollRunsPage;
