import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import Table from "@/components/Base/Table";
import { Dialog } from "@/components/Base/Headless";
import { FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
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
  updatePayrollRunAllocations,
  updatePayrollRunItem,
  updatePayrollRun,
} from "@/services/payroll";
import { formatDisplayDate, formatMoney } from "@/utils/formatting";

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

function monthBoundary(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

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
  const [showEditor, setShowEditor] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showItemEditor, setShowItemEditor] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [form, setForm] = useState(() => {
    const { start, end } = monthBoundary(new Date().getFullYear(), new Date().getMonth() + 1);
    return { ...emptyForm, period_start: start, period_end: end };
  });

  const closeDetail = () => {
    setShowDetail(false);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("run_id");
      return next;
    });
  };

  const load = async () => {
    try {
      setLoading(true);
      const [runRes, accountRes, organizationRows, teamRows, projectRows, fundRows, grantRows] = await Promise.all([
        listPayrollRuns({ page: 1, per_page: 100 }),
        listFinanceAccounts({ is_active: true }).catch(() => []),
        listOrganizations({ is_active: true }).catch(() => []),
        listTeams({ active_only: true }).catch(() => []),
        listProjects({ active_only: false }).catch(() => []),
        listFinanceFunds().catch(() => []),
        listFinanceGrants().catch(() => []),
      ]);
      setRows(runRes.data ?? []);
      setAccounts(accountRes ?? []);
      setOrganizations(organizationRows ?? []);
      setTeams(teamRows ?? []);
      setProjects(projectRows ?? []);
      setFunds(fundRows ?? []);
      setGrants(grantRows ?? []);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load payroll runs." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const runId = searchParams.get("run_id");
    if (!runId) return;
    void openDetail(runId);
  }, [searchParams]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => {
          acc.gross += Number(row.totals?.gross || 0);
          acc.net += Number(row.totals?.net || 0);
          return acc;
        },
        { gross: 0, net: 0 }
      ),
    [rows]
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
      net_pay: String(item.net_pay ?? ""),
      allocations: (item.allocations || []).map((row: any) => ({
        organization_id: row.organization_id || "",
        team_id: row.team_id || "",
        project_id: row.project_id || "",
        fund_id: row.fund_id || "",
        grant_id: row.grant_id || "",
        allocation_percent: String(row.allocation_percent ?? "0"),
      })),
    });
    setShowItemEditor(true);
  };

  const saveRun = async () => {
    try {
      setSaving(true);
      const payload = {
        ...form,
        paid_from_account_id: form.paid_from_account_id || undefined,
      };
      if (editingId) {
        await updatePayrollRun(editingId, payload);
      } else {
        await createPayrollRun(payload);
      }
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
      if (detail?.id) {
        setDetail(await getPayrollRun(detail.id));
      }
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
        net_pay: Number(editingItem.net_pay || 0),
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
      setNotice({
        tone: "success",
        message: `Payslips distributed. Sent: ${response.sent}. Skipped: ${response.skipped}. Failed: ${response.failed}${response.skipped_workers?.length ? ` | skipped: ${response.skipped_workers.join(", ")}` : ""}${response.failed_workers?.length ? ` | failed: ${response.failed_workers.map((row) => row.worker).join(", ")}` : ""}`,
      });
      if (detail?.id) {
        setDetail(await getPayrollRun(detail.id));
      }
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to distribute payslips." });
    }
  };

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

      <div className="grid grid-cols-1 gap-4 mt-5 md:grid-cols-4">
        <div className="box p-5">
          <div className="text-slate-500 text-sm">Runs</div>
          <div className="text-2xl font-semibold mt-2">{rows.length}</div>
        </div>
        <div className="box p-5">
          <div className="text-slate-500 text-sm">Gross</div>
          <div className="text-2xl font-semibold mt-2">{formatMoney(totals.gross)}</div>
        </div>
        <div className="box p-5">
          <div className="text-slate-500 text-sm">Net</div>
          <div className="text-2xl font-semibold mt-2">{formatMoney(totals.net)}</div>
        </div>
        <div className="box p-5">
          <div className="text-slate-500 text-sm">Paid Runs</div>
          <div className="text-2xl font-semibold mt-2">{rows.filter((row) => row.status === "paid").length}</div>
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
                <Table.Td>
                  {formatDisplayDate(row.period_start)} - {formatDisplayDate(row.period_end)}
                </Table.Td>
                <Table.Td className="capitalize">{row.status.replaceAll("_", " ")}</Table.Td>
                <Table.Td className="text-right">{formatMoney(row.totals?.net || 0)}</Table.Td>
                <Table.Td className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline-primary" onClick={() => void openDetail(row.id)}>
                      <Lucide icon="Eye" className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline-secondary" onClick={() => openEdit(row)}>
                      <Lucide icon="FilePenLine" className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="primary" onClick={() => void runAction(() => generatePayrollRun(row.id), "Payroll run generated.")}>
                      Generate
                    </Button>
                  </div>
                </Table.Td>
              </Table.Tr>
            ))}
            {!rows.length ? (
              <Table.Tr>
                <Table.Td colSpan={5} className="text-center text-slate-500 py-10">
                  No payroll runs found.
                </Table.Td>
              </Table.Tr>
            ) : null}
          </Table.Tbody>
        </Table>
      </div>

      <Dialog open={showEditor} onClose={() => setShowEditor(false)}>
        <Dialog.Panel>
          <Dialog.Title>
            <h2 className="mr-auto text-base font-medium">{editingId ? "Edit Payroll Run" : "New Payroll Run"}</h2>
          </Dialog.Title>
          <Dialog.Description className="grid grid-cols-12 gap-4">
            <div className="col-span-12">
              <FormLabel>Name</FormLabel>
              <FormInput value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-3">
              <FormLabel>Year</FormLabel>
              <FormInput
                type="number"
                value={form.year}
                onChange={(e) => {
                  const year = Number(e.target.value || new Date().getFullYear());
                  const { start, end } = monthBoundary(year, form.month);
                  setForm((prev) => ({ ...prev, year, period_start: start, period_end: end }));
                }}
              />
            </div>
            <div className="col-span-12 md:col-span-3">
              <FormLabel>Month</FormLabel>
              <FormInput
                type="number"
                min={1}
                max={12}
                value={form.month}
                onChange={(e) => {
                  const month = Number(e.target.value || 1);
                  const { start, end } = monthBoundary(form.year, month);
                  setForm((prev) => ({ ...prev, month, period_start: start, period_end: end }));
                }}
              />
            </div>
            <div className="col-span-12 md:col-span-3">
              <FormLabel>Period Start</FormLabel>
              <FormInput type="date" value={form.period_start} onChange={(e) => setForm((prev) => ({ ...prev, period_start: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-3">
              <FormLabel>Period End</FormLabel>
              <FormInput type="date" value={form.period_end} onChange={(e) => setForm((prev) => ({ ...prev, period_end: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-6">
              <FormLabel>Payment Account</FormLabel>
              <FormSelect value={form.paid_from_account_id} onChange={(e) => setForm((prev) => ({ ...prev, paid_from_account_id: e.target.value }))}>
                <option value="">Select account</option>
                {accounts.map((row) => (
                  <option key={row.id} value={row.id}>{row.name}</option>
                ))}
              </FormSelect>
            </div>
            <div className="col-span-12 md:col-span-6">
              <FormLabel>Currency</FormLabel>
              <FormInput value={form.currency} onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))} />
            </div>
            <div className="col-span-12">
              <FormLabel>Notes</FormLabel>
              <FormTextarea value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} />
            </div>
          </Dialog.Description>
          <Dialog.Footer>
            <Button variant="outline-secondary" onClick={() => setShowEditor(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => void saveRun()} disabled={saving}>
              {saving ? "Saving..." : "Save Run"}
            </Button>
          </Dialog.Footer>
        </Dialog.Panel>
      </Dialog>

      <Dialog open={showDetail} onClose={closeDetail} size="xl">
        <Dialog.Panel>
          <Dialog.Title>
            <h2 className="mr-auto text-base font-medium">{detail?.name || "Payroll Run Detail"}</h2>
          </Dialog.Title>
          <Dialog.Description>
            {detail ? (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div className="rounded border p-3">
                    <div className="text-xs text-slate-500">Status</div>
                    <div className="font-medium capitalize">{detail.status.replaceAll("_", " ")}</div>
                  </div>
                  <div className="rounded border p-3">
                    <div className="text-xs text-slate-500">Gross</div>
                    <div className="font-medium">{formatMoney(detail.totals.gross)}</div>
                  </div>
                  <div className="rounded border p-3">
                    <div className="text-xs text-slate-500">Deductions</div>
                    <div className="font-medium">{formatMoney(detail.totals.deductions)}</div>
                  </div>
                  <div className="rounded border p-3">
                    <div className="text-xs text-slate-500">Net</div>
                    <div className="font-medium">{formatMoney(detail.totals.net)}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-5">
                  <Button variant="primary" onClick={() => void runAction(() => generatePayrollRun(detail.id), "Payroll run generated.")}>
                    Generate
                  </Button>
                  <Button variant="outline-primary" onClick={() => void runAction(() => submitPayrollRun(detail.id), "Payroll run submitted for review.")}>
                    Submit
                  </Button>
                  <Button variant="outline-primary" onClick={() => void runAction(() => reviewPayrollRun(detail.id), "Payroll run moved to review.")}>
                    Review
                  </Button>
                  <Button variant="outline-primary" onClick={() => void runAction(() => approvePayrollRun(detail.id), "Payroll run approved.")}>
                    Approve
                  </Button>
                  <Button variant="outline-danger" onClick={() => void runAction(() => rejectPayrollRun(detail.id), "Payroll run rejected.")}>
                    Reject
                  </Button>
                  <Button variant="outline-secondary" onClick={() => void runAction(() => reopenPayrollRun(detail.id), "Payroll run reopened.")}>
                    Reopen
                  </Button>
                  <Button
                    variant="outline-success"
                    onClick={() =>
                      void runAction(
                        () => payPayrollRun(detail.id, { paid_from_account_id: detail.paid_from_account?.id }),
                        "Payroll run marked as paid."
                      )
                    }
                  >
                    Mark Paid
                  </Button>
                  <Button variant="outline-secondary" onClick={() => void downloadPayslipPackage(detail.id)}>
                    Payslip Package
                  </Button>
                  <Button variant="outline-secondary" onClick={() => void distributePayslips(detail.id)}>
                    Email Payslips
                  </Button>
                  <Button variant="outline-secondary" onClick={() => void downloadBankSchedule(detail.id)}>
                    Bank Schedule
                  </Button>
                  <Button variant="outline-secondary" onClick={() => void runAction(() => closePayrollRun(detail.id), "Payroll run closed.")}>
                    Close Run
                  </Button>
                </div>

                {detail.notes ? (
                  <div className="mt-4 rounded border p-3">
                    <div className="text-xs text-slate-500 uppercase">Run Notes</div>
                    <pre className="mt-2 text-sm whitespace-pre-wrap text-slate-700">{detail.notes}</pre>
                  </div>
                ) : null}

                {detail.events?.length ? (
                  <div className="mt-4 rounded border p-3">
                    <div className="text-xs text-slate-500 uppercase">Run History</div>
                    <div className="mt-3 space-y-3 max-h-56 overflow-auto">
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
                ) : null}

                {detail.payslip_distributions?.length ? (
                  <div className="mt-4 rounded border p-3">
                    <div className="text-xs text-slate-500 uppercase">Payslip Distribution</div>
                    <div className="mt-3 max-h-64 overflow-auto rounded border">
                      <Table>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>Worker</Table.Th>
                            <Table.Th>Email</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th>Sent</Table.Th>
                            <Table.Th>Error</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
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
                  </div>
                ) : null}

                <div className="mt-5 max-h-[420px] overflow-auto rounded border">
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
                          <Table.Td>{item.worker?.fullName || item.worker?.full_name || item.worker_id}</Table.Td>
                          <Table.Td className="capitalize">{item.worker_type}</Table.Td>
                          <Table.Td className="text-right">{formatMoney(item.gross_pay)}</Table.Td>
                          <Table.Td className="text-right">{formatMoney(item.total_deductions)}</Table.Td>
                          <Table.Td className="text-right">{formatMoney(item.net_pay)}</Table.Td>
                          <Table.Td>
                            <div className="flex items-center justify-between gap-2">
                              <span className="capitalize">{item.payment_status.replaceAll("_", " ")}</span>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline-secondary" onClick={() => openItemEditor(item)}>
                                  <Lucide icon="FilePenLine" className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="outline-secondary" onClick={() => void downloadPayslip(detail.id, item.id)}>
                                  <Lucide icon="FileText" className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </div>
              </>
            ) : (
              <div className="text-sm text-slate-500">Loading run detail...</div>
            )}
          </Dialog.Description>
          <Dialog.Footer>
            <Button variant="outline-secondary" onClick={closeDetail}>
              Close
            </Button>
          </Dialog.Footer>
        </Dialog.Panel>
      </Dialog>

      <Dialog open={showItemEditor} onClose={() => setShowItemEditor(false)} size="xl">
        <Dialog.Panel>
          <Dialog.Title>
            <h2 className="mr-auto text-base font-medium">Edit Payroll Run Item</h2>
          </Dialog.Title>
          <Dialog.Description className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-3">
              <FormLabel>Gross Pay</FormLabel>
              <FormInput type="number" value={editingItem?.gross_pay || ""} onChange={(e) => setEditingItem((prev: any) => ({ ...prev, gross_pay: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-3">
              <FormLabel>Deductions</FormLabel>
              <FormInput type="number" value={editingItem?.total_deductions || ""} onChange={(e) => setEditingItem((prev: any) => ({ ...prev, total_deductions: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-3">
              <FormLabel>Employer Cost</FormLabel>
              <FormInput type="number" value={editingItem?.employer_cost_total || ""} onChange={(e) => setEditingItem((prev: any) => ({ ...prev, employer_cost_total: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-3">
              <FormLabel>Net Pay</FormLabel>
              <FormInput type="number" value={editingItem?.net_pay || ""} onChange={(e) => setEditingItem((prev: any) => ({ ...prev, net_pay: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-6">
              <FormLabel>Payment Status</FormLabel>
              <FormSelect value={editingItem?.payment_status || "pending"} onChange={(e) => setEditingItem((prev: any) => ({ ...prev, payment_status: e.target.value }))}>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
              </FormSelect>
            </div>
            <div className="col-span-12 md:col-span-6">
              <FormLabel>Payment Reference</FormLabel>
              <FormInput value={editingItem?.payment_reference || ""} onChange={(e) => setEditingItem((prev: any) => ({ ...prev, payment_reference: e.target.value }))} />
            </div>
            <div className="col-span-12">
              <div className="flex items-center justify-between">
                <FormLabel>Allocations</FormLabel>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => setEditingItem((prev: any) => ({
                    ...prev,
                    allocations: [...(prev.allocations || []), { organization_id: "", team_id: "", project_id: "", fund_id: "", grant_id: "", allocation_percent: "0" }],
                  }))}
                >
                  <Lucide icon="Plus" className="w-4 h-4 mr-1" />
                  Add Allocation
                </Button>
              </div>
              <div className="space-y-3 mt-2">
                {(editingItem?.allocations || []).map((row: any, index: number) => (
                  <div key={`item-allocation-${index}`} className="grid grid-cols-12 gap-3 rounded border p-3">
                    <div className="col-span-12 md:col-span-2">
                      <FormLabel>Organization</FormLabel>
                      <FormSelect value={row.organization_id} onChange={(e) => setEditingItem((prev: any) => ({ ...prev, allocations: prev.allocations.map((entry: any, entryIndex: number) => entryIndex === index ? { ...entry, organization_id: e.target.value } : entry) }))}>
                        <option value="">None</option>
                        {organizations.map((entry) => (
                          <option key={entry.id} value={entry.id}>{entry.name}</option>
                        ))}
                      </FormSelect>
                    </div>
                    <div className="col-span-12 md:col-span-2">
                      <FormLabel>Team</FormLabel>
                      <FormSelect value={row.team_id} onChange={(e) => setEditingItem((prev: any) => ({ ...prev, allocations: prev.allocations.map((entry: any, entryIndex: number) => entryIndex === index ? { ...entry, team_id: e.target.value } : entry) }))}>
                        <option value="">None</option>
                        {teams.map((entry) => (
                          <option key={entry.id} value={entry.id}>{entry.name}</option>
                        ))}
                      </FormSelect>
                    </div>
                    <div className="col-span-12 md:col-span-2">
                      <FormLabel>Project</FormLabel>
                      <FormSelect value={row.project_id} onChange={(e) => setEditingItem((prev: any) => ({ ...prev, allocations: prev.allocations.map((entry: any, entryIndex: number) => entryIndex === index ? { ...entry, project_id: e.target.value } : entry) }))}>
                        <option value="">None</option>
                        {projects.map((entry) => (
                          <option key={entry.id} value={entry.id}>{entry.name}</option>
                        ))}
                      </FormSelect>
                    </div>
                    <div className="col-span-12 md:col-span-2">
                      <FormLabel>Fund</FormLabel>
                      <FormSelect value={row.fund_id} onChange={(e) => setEditingItem((prev: any) => ({ ...prev, allocations: prev.allocations.map((entry: any, entryIndex: number) => entryIndex === index ? { ...entry, fund_id: e.target.value } : entry) }))}>
                        <option value="">None</option>
                        {funds.map((entry) => (
                          <option key={entry.id} value={entry.id}>{entry.name}</option>
                        ))}
                      </FormSelect>
                    </div>
                    <div className="col-span-12 md:col-span-2">
                      <FormLabel>Grant</FormLabel>
                      <FormSelect value={row.grant_id} onChange={(e) => setEditingItem((prev: any) => ({ ...prev, allocations: prev.allocations.map((entry: any, entryIndex: number) => entryIndex === index ? { ...entry, grant_id: e.target.value } : entry) }))}>
                        <option value="">None</option>
                        {grants.map((entry) => (
                          <option key={entry.id} value={entry.id}>{entry.name}</option>
                        ))}
                      </FormSelect>
                    </div>
                    <div className="col-span-10 md:col-span-1">
                      <FormLabel>%</FormLabel>
                      <FormInput type="number" value={row.allocation_percent} onChange={(e) => setEditingItem((prev: any) => ({ ...prev, allocations: prev.allocations.map((entry: any, entryIndex: number) => entryIndex === index ? { ...entry, allocation_percent: e.target.value } : entry) }))} />
                    </div>
                    <div className="col-span-2 md:col-span-1 flex items-end">
                      <Button variant="outline-danger" className="w-full" onClick={() => setEditingItem((prev: any) => ({ ...prev, allocations: prev.allocations.filter((_: any, entryIndex: number) => entryIndex !== index) }))}>
                        <Lucide icon="Trash2" className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Dialog.Description>
          <Dialog.Footer>
            <Button variant="outline-secondary" onClick={() => setShowItemEditor(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => void saveItem()}>
              Save Item
            </Button>
          </Dialog.Footer>
        </Dialog.Panel>
      </Dialog>
    </>
  );
}

export default FinancePayrollRunsPage;
