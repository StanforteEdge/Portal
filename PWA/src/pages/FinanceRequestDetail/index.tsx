import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import { FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/Base/Form";
import { Dialog } from "@/components/Base/Headless";
import Table from "@/components/Base/Table";
import clsx from "clsx";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { disburseFinanceRequest, listFinanceRequestPaymentVouchers } from "@/services/finance";
import {
  approveRequest,
  completeRequest,
  generateRequestPdf,
  generateRequestPvByVoucher,
  getRequest,
  getRequestActions,
  rejectRequest,
  type RequestRecord,
} from "@/services/requests";
import { listTeams, type TeamOption } from "@/services/teams";
import { listOrganizations, type OrganizationRecord } from "@/services/organizations";
import { listProjects, type ProjectOption } from "@/services/projects";
import { listManagedTaxonomies } from "@/services/taxonomy";
import { attachFileAsset } from "@/services/files";
import {
  formatDisplayDate,
  formatMoney,
  formatPaymentMethod,
  formatPersonName,
  formatRequestNumber,
  statusBadgeClass,
} from "@/utils/formatting";
import { buildRequestWorkflowSteps } from "@/utils/requestWorkflow";

function downloadBase64File(fileName: string, mimeType: string, contentBase64: string) {
  const bytes = atob(contentBase64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) arr[i] = bytes.charCodeAt(i);
  const blob = new Blob([arr], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function FinanceRequestDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState<RequestRecord | null>(null);
  const [actions, setActions] = useState<string[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [categoryTermMap, setCategoryTermMap] = useState<Record<string, string>>({});
  const [paymentVouchers, setPaymentVouchers] = useState<
    Array<{
      id: string;
      voucher_number: string;
      amount: number;
      retired_amount: number;
      voucher_balance: number;
      request_balance: number;
      retirement_status: string;
      method: string | null;
      transaction_ref: string | null;
      note: string | null;
      disbursed_at: string;
      retired_at: string | null;
      verified_at: string | null;
      evidence_file: { id: string; file_name: string; mime_type: string | null; public_url: string | null } | null;
      retirement_files: Array<{ id: string; file_name: string; mime_type: string | null; public_url: string | null }>;
    }>
  >([]);

  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<{
    id: string;
    voucher_number: string;
    amount: number;
    retired_amount: number;
    voucher_balance: number;
    request_balance: number;
    retirement_status: string;
    method: string | null;
    transaction_ref: string | null;
    note: string | null;
    disbursed_at: string;
    retired_at: string | null;
    verified_at: string | null;
    evidence_file: { id: string; file_name: string; mime_type: string | null; public_url: string | null } | null;
    retirement_files: Array<{ id: string; file_name: string; mime_type: string | null; public_url: string | null }>;
  } | null>(null);

  const [showDisburseModal, setShowDisburseModal] = useState(false);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [disburseForm, setDisburseForm] = useState({
    method: "bank_transfer",
    custom_method: "",
    transaction_ref: "",
    amount: "",
    note: "",
    evidence_file_id: "",
    evidence_file_name: "",
  });

  const data = useMemo(() => ((request?.data || {}) as Record<string, unknown>), [request]);

  const teamName = useMemo(() => {
    const idValue = String(data.team_id || "").trim();
    if (!idValue) return "-";
    return teams.find((team) => team.id === idValue)?.name || idValue;
  }, [data, teams]);

  const organizationName = useMemo(() => {
    const idValue = String(data.organization_id || "").trim();
    if (!idValue) return "-";
    return organizations.find((org) => org.id === idValue)?.name || idValue;
  }, [data, organizations]);

  const projectName = useMemo(() => {
    const value = String(data.project || "").trim();
    if (!value) return "-";
    return projects.find((project) => project.id === value)?.name || value;
  }, [data, projects]);

  const categoryName = useMemo(() => {
    const idValue = String(data.category_id || "").trim();
    if (!idValue) return "-";
    return categoryTermMap[idValue] || idValue;
  }, [data, categoryTermMap]);

  const progressSteps = useMemo(() => buildRequestWorkflowSteps(request, paymentVouchers), [request, paymentVouchers]);
  const remainingRequestBalance = useMemo(() => {
    const total = Number(request?.total_amount || 0);
    const disbursed = paymentVouchers.reduce((sum, pv) => sum + Number(pv.amount || 0), 0);
    return Math.max(0, total - disbursed);
  }, [request?.total_amount, paymentVouchers]);
  const totalDisbursed = useMemo(
    () => paymentVouchers.reduce((sum, pv) => sum + Number(pv.amount || 0), 0),
    [paymentVouchers]
  );

  const retirementStatusLabel = (value: string) => {
    const key = String(value || "").toLowerCase();
    if (key === "verified") return "Confirmed";
    if (key === "partial") return "Partial";
    if (key === "retired") return "Retired";
    return "Pending";
  };

  const staffConfirmationLabel = useMemo(() => {
    const status = String(request?.status || "").toLowerCase();
    return ["confirmed", "retired", "completed"].includes(status) ? "Confirmed" : "Pending";
  }, [request?.status]);

  const load = async () => {
    try {
      setLoading(true);
      const [req, actionList, teamsData, orgData, projectData, taxonomies, pvs] = await Promise.all([
        getRequest(id),
        getRequestActions(id),
        listTeams({ active_only: false }).catch(() => []),
        listOrganizations({ is_active: true }).catch(() => []),
        listProjects({ active_only: false }).catch(() => []),
        listManagedTaxonomies({ include_inactive: false }).catch(() => []),
        listFinanceRequestPaymentVouchers(id).catch(() => []),
      ]);
      setRequest(req);
      setActions(actionList);
      setTeams(teamsData);
      setOrganizations(orgData);
      setProjects(projectData);
      setPaymentVouchers(pvs);

      const termMap: Record<string, string> = {};
      for (const taxonomy of taxonomies) {
        for (const term of taxonomy.terms || []) termMap[String(term.id)] = String(term.label);
      }
      setCategoryTermMap(termMap);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load request." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const openDisburse = () => {
    setDisburseForm({
      method: "bank_transfer",
      custom_method: "",
      transaction_ref: "",
      amount: remainingRequestBalance > 0 ? String(remainingRequestBalance) : "",
      note: "",
      evidence_file_id: "",
      evidence_file_name: "",
    });
    setShowDisburseModal(true);
  };

  const uploadEvidence = async (file: File | null) => {
    if (!file) return;
    try {
      setUploadingEvidence(true);
      const attached = await attachFileAsset({
        storage_path: `uploads/disbursements/${Date.now()}-${file.name}`,
        file_name: file.name,
        mime_type: file.type || "application/octet-stream",
        file_size: file.size,
        metadata: { source: "disbursement_evidence", request_id: id },
      });
      setDisburseForm((prev) => ({
        ...prev,
        evidence_file_id: attached.id,
        evidence_file_name: file.name,
      }));
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to upload evidence metadata." });
    } finally {
      setUploadingEvidence(false);
    }
  };

  const disburse = async () => {
    try {
      setBusyAction("disburse");
      const method = disburseForm.method === "other" ? disburseForm.custom_method.trim() : disburseForm.method;
      await disburseFinanceRequest(id, {
        note: disburseForm.note.trim() || undefined,
        method: method || undefined,
        transaction_ref: disburseForm.transaction_ref.trim() || undefined,
        amount: disburseForm.amount.trim() ? Number(disburseForm.amount) : undefined,
        evidence_file_id: disburseForm.evidence_file_id || undefined,
      });
      setShowDisburseModal(false);
      setNotice({ tone: "success", message: "Request disbursed." });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Disbursement failed." });
    } finally {
      setBusyAction("");
    }
  };

  const approve = async () => {
    try {
      setBusyAction("approve");
      const comment = window.prompt("Approval comment (optional):", "") || undefined;
      await approveRequest(id, comment);
      setNotice({ tone: "success", message: "Request approved." });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Approval failed." });
    } finally {
      setBusyAction("");
    }
  };

  const reject = async () => {
    try {
      setBusyAction("reject");
      const comment = window.prompt("Rejection reason:", "") || undefined;
      await rejectRequest(id, comment);
      setNotice({ tone: "success", message: "Request rejected." });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Rejection failed." });
    } finally {
      setBusyAction("");
    }
  };

  const complete = async () => {
    try {
      setBusyAction("complete");
      await completeRequest(id);
      setNotice({ tone: "success", message: "Retirement verified and request completed." });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Completion failed." });
    } finally {
      setBusyAction("");
    }
  };

  const runPdf = async () => {
    try {
      setBusyAction("pdf");
      const file = await generateRequestPdf(id);
      downloadBase64File(file.file_name, file.mime_type, file.content_base64);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to generate PDF." });
    } finally {
      setBusyAction("");
    }
  };

  const runPv = async (voucherId?: string) => {
    if (!voucherId) return;
    try {
      setBusyAction("pv");
      const file = await generateRequestPvByVoucher(id, voucherId);
      downloadBase64File(file.file_name, file.mime_type, file.content_base64);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to generate PV." });
    } finally {
      setBusyAction("");
    }
  };

  const downloadVoucher = async (voucherNumber?: string, event?: { stopPropagation?: () => void }) => {
    if (event?.stopPropagation) event.stopPropagation();
    const voucherId = paymentVouchers.find((pv) => pv.voucher_number === voucherNumber)?.id || selectedVoucher?.id;
    await runPv(voucherId);
    if (voucherNumber) {
      setNotice({ tone: "success", message: `Voucher ${voucherNumber} downloaded.` });
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Finance Request Detail</h2>
        <Button variant="outline-secondary" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>
      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="box mt-5 p-5">
        {loading || !request ? (
          <div className="text-slate-500">Loading request...</div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4 rounded-md border p-4 md:grid-cols-3">
              <div>
                <div className="text-xs text-slate-500">Request No</div>
                <div className="font-semibold text-lg">{formatRequestNumber(request.request_number)}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-500">Total<span className="text-slate-400">/Disbursed</span></div>
                <div className="font-semibold text-lg">{formatMoney(request.total_amount, "-", request.currency || "NGN")}<span className="text-xs text-slate-400 mt-1">/{formatMoney(totalDisbursed, "-", request.currency || "NGN")}
                </span></div>
              </div>
              <div className="text-end">
                <div className="text-xs text-slate-500">Status</div>
                <span className={clsx("mt-1 inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize", statusBadgeClass(request.status))}>
                  {request.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-2">
              <div className="rounded-md border p-4">
                <h3 className="mb-3 font-medium text-lg">Request Details</h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <div className="text-xs text-slate-500">Requester</div>
                    <div className="font-medium">{formatPersonName(request.creator)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Type</div>
                    <div>{request.request_type?.name || "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Due Date</div>
                    <div>{formatDisplayDate(typeof data.due_date === "string" ? data.due_date : null)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Reimbursement</div>
                    <div>{Boolean(data.reimbursement) ? "Yes" : "No"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Team</div>
                    <div>{teamName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Organization</div>
                    <div>{organizationName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Project</div>
                    <div>{projectName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Category</div>
                    <div>{categoryName}</div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-xs text-slate-500">Purpose</div>
                    <div>{String(data.purpose || "-")}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-md border p-4">
                <h3 className="mb-3 font-medium text-lg">Workflow</h3>
                <div className="space-y-2">
                  {progressSteps.length === 0 ? (
                    <div className="text-slate-500">No workflow steps available.</div>
                  ) : (
                    progressSteps.map((item) => (
                      <div key={item.key} className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-medium">{item.title}</span>
                        <span className="text-slate-500" title={item.actor || undefined}>
                          - {item.owner}
                        </span>
                        {item.actor ? (
                          <span className="text-slate-500" title={item.actor}>
                            (by {item.actor})
                          </span>
                        ) : null}
                        {item.note ? <span className="text-xs text-slate-500">({item.note})</span> : null}
                        {item.state === "done" ? (
                          <Lucide icon="CheckCircle2" className="w-4 h-4 text-success" />
                        ) : item.state === "cancelled" ? (
                          <Lucide icon="XCircle" className="w-4 h-4 text-danger" />
                        ) : item.state === "pending" ? (
                          <Lucide icon="MoreHorizontal" className="w-4 h-4 text-warning" />
                        ) : (
                          <Lucide icon="Minus" className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Items</h3>
              <Table className="table-report" striped hover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th className="w-1/2">Item</Table.Th>
                    <Table.Th>Qty</Table.Th>
                    <Table.Th>Price</Table.Th>
                    <Table.Th>Amount</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {request.items.map((item) => (
                    <Table.Tr key={item.id}>
                      <Table.Td>
                        <div>{item.description}</div>
                        <div className="text-xs text-slate-500">{item.notes || ""}</div>
                      </Table.Td>
                      <Table.Td>{item.quantity}</Table.Td>
                      <Table.Td>{formatMoney(item.amount, "-", request.currency || "NGN")}</Table.Td>
                      <Table.Td>{formatMoney(Number(item.amount) * Number(item.quantity || 1), "-", request.currency || "NGN")}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>

            <div className="rounded-md border p-4">
              <div className="mb-2 font-medium">Disbursements (Payment Vouchers)</div>
              <div className="text-xs text-slate-500 mb-3">
                Remaining request balance: {formatMoney(remainingRequestBalance, "-", request.currency || "NGN")}
              </div>
              {paymentVouchers.length === 0 ? (
                <div className="text-slate-500 text-sm">No voucher generated yet.</div>
              ) : (
                <Table className="table-report" striped hover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>PV</Table.Th>
                      <Table.Th>Amount</Table.Th>
                      <Table.Th>Balance</Table.Th>
                      <Table.Th>Retirement Status</Table.Th>
                      <Table.Th>Staff Confirmed</Table.Th>
                      <Table.Th className="text-right">PV</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {paymentVouchers.map((pv) => (
                      <Table.Tr
                        key={pv.id}
                        className="cursor-pointer"
                        onClick={() => setSelectedVoucher(pv)}
                      >
                        <Table.Td className="font-medium text-primary">{pv.voucher_number}</Table.Td>
                        <Table.Td>{formatMoney(pv.amount, "-", request.currency || "NGN")}</Table.Td>
                        <Table.Td>{formatMoney(pv.voucher_balance, "-", request.currency || "NGN")}</Table.Td>
                        <Table.Td>{retirementStatusLabel(pv.retirement_status)}</Table.Td>
                        <Table.Td>{staffConfirmationLabel}</Table.Td>
                        <Table.Td className="text-right">
                          <Button
                            size="sm"
                            variant="outline-secondary"
                            onClick={(e) => {
                              void downloadVoucher(pv.voucher_number, e);
                            }}
                            disabled={busyAction === "pv"}
                          >
                            {busyAction === "pv" ? "Downloading..." : "Download"}
                          </Button>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </div>

            <div className="border-t pt-4">
              <div className="mb-2 font-medium">Finance Actions</div>
              <div className="flex flex-wrap gap-2">
                {actions.includes("approve") ? (
                  <Button onClick={() => void approve()} disabled={busyAction === "approve"}>
                    {busyAction === "approve" ? "Working..." : "Approve"}
                  </Button>
                ) : null}
                {actions.includes("reject") ? (
                  <Button variant="outline-danger" onClick={() => void reject()} disabled={busyAction === "reject"}>
                    {busyAction === "reject" ? "Working..." : "Reject"}
                  </Button>
                ) : null}
                {(request.status === "cleared" || request.status === "disbursed") ? (
                  <Button onClick={openDisburse} disabled={busyAction === "disburse"}>
                    {busyAction === "disburse" ? "Working..." : "Disburse"}
                  </Button>
                ) : null}
                {request.status === "retired" ? (
                  <Button onClick={() => void complete()} disabled={busyAction === "complete"}>
                    {busyAction === "complete" ? "Working..." : "Verify Retirement"}
                  </Button>
                ) : null}
                <Button variant="outline-secondary" onClick={() => void runPdf()} disabled={busyAction === "pdf"}>
                  {busyAction === "pdf" ? "Generating..." : "Download Request PDF"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={showDisburseModal} onClose={() => setShowDisburseModal(false)}>
        <Dialog.Panel>
          <div className="p-5 space-y-4">
            <div className="text-lg font-medium">Disburse Request</div>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-12 md:col-span-6">
                <FormLabel>Method</FormLabel>
                <FormSelect
                  value={disburseForm.method}
                  onChange={(e) => setDisburseForm((prev) => ({ ...prev, method: e.target.value }))}
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="cheque">Cheque</option>
                  <option value="other">Other</option>
                </FormSelect>
              </div>
              {disburseForm.method === "other" ? (
                <div className="col-span-12 md:col-span-6">
                  <FormLabel>Custom Method</FormLabel>
                  <FormInput
                    value={disburseForm.custom_method}
                    onChange={(e) => setDisburseForm((prev) => ({ ...prev, custom_method: e.target.value }))}
                    placeholder="Enter method"
                  />
                </div>
              ) : null}
              <div className="col-span-12 md:col-span-6">
                <FormLabel>Transaction Ref</FormLabel>
                <FormInput
                  value={disburseForm.transaction_ref}
                  onChange={(e) => setDisburseForm((prev) => ({ ...prev, transaction_ref: e.target.value }))}
                  placeholder="TRX-2026-..."
                />
              </div>
              <div className="col-span-12 md:col-span-6">
                <FormLabel>Amount</FormLabel>
                <FormInput
                  type="number"
                  value={disburseForm.amount}
                  onChange={(e) => setDisburseForm((prev) => ({ ...prev, amount: e.target.value }))}
                />
              </div>
              <div className="col-span-12">
                <FormLabel>Evidence (receipt / transfer receipt)</FormLabel>
                <FormInput
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    void uploadEvidence(file);
                  }}
                  disabled={uploadingEvidence}
                />
                <div className="text-xs text-slate-500 mt-1">
                  {uploadingEvidence
                    ? "Attaching evidence..."
                    : disburseForm.evidence_file_name
                      ? `Attached: ${disburseForm.evidence_file_name}`
                      : "Optional"}
                </div>
              </div>
              <div className="col-span-12">
                <FormLabel>Note</FormLabel>
                <FormTextarea
                  rows={3}
                  value={disburseForm.note}
                  onChange={(e) => setDisburseForm((prev) => ({ ...prev, note: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <div className="px-5 pb-5 flex justify-end gap-2">
            <Button variant="outline-secondary" onClick={() => setShowDisburseModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => void disburse()} disabled={busyAction === "disburse" || uploadingEvidence}>
              {busyAction === "disburse" ? "Disbursing..." : "Disburse"}
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>

      <Dialog open={Boolean(selectedVoucher)} onClose={() => setSelectedVoucher(null)}>
        <Dialog.Panel>
          <div className="p-5 space-y-2">
            <div className="text-lg font-medium">Payment Voucher Details</div>
            {selectedVoucher ? (
              <>
                <div className="text-sm"><span className="text-slate-500">PV Number:</span> {selectedVoucher.voucher_number}</div>
                <div className="text-sm"><span className="text-slate-500">Amount:</span> {formatMoney(selectedVoucher.amount, "-", request?.currency || "NGN")}</div>
                <div className="text-sm"><span className="text-slate-500">Method:</span> {formatPaymentMethod(selectedVoucher.method)}</div>
                <div className="text-sm"><span className="text-slate-500">Transaction Ref:</span> {selectedVoucher.transaction_ref || "-"}</div>
                <div className="text-sm"><span className="text-slate-500">Disbursed At:</span> {formatDisplayDate(selectedVoucher.disbursed_at)}</div>
                <div className="pt-2 mt-2 border-t">
                  <div className="text-sm font-medium mb-1">Retirement</div>
                  <div className="text-sm"><span className="text-slate-500">Status:</span> {retirementStatusLabel(selectedVoucher.retirement_status)}</div>
                  <div className="text-sm"><span className="text-slate-500">Retired Amount:</span> {formatMoney(selectedVoucher.retired_amount, "-", request?.currency || "NGN")}</div>
                  <div className="text-sm"><span className="text-slate-500">PV Balance:</span> {formatMoney(selectedVoucher.voucher_balance, "-", request?.currency || "NGN")}</div>
                  <div className="text-sm"><span className="text-slate-500">Retired At:</span> {formatDisplayDate(selectedVoucher.retired_at)}</div>
                  <div className="text-sm"><span className="text-slate-500">Confirmed At:</span> {formatDisplayDate(selectedVoucher.verified_at)}</div>
                </div>
                <div className="text-sm"><span className="text-slate-500">Staff Confirmation:</span> {staffConfirmationLabel}</div>
                <div className="text-sm"><span className="text-slate-500">Note:</span> {selectedVoucher.note || "-"}</div>
                {selectedVoucher.evidence_file?.public_url ? (
                  <a
                    href={selectedVoucher.evidence_file.public_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    View Disbursement File
                  </a>
                ) : null}
                {selectedVoucher.retirement_files.length > 0 ? (
                  <div className="pt-2 mt-2 border-t">
                    <div className="text-sm font-medium mb-1">Retirement Files</div>
                    <div className="space-y-1">
                      {selectedVoucher.retirement_files.map((file) => (
                        <div key={file.id}>
                          {file.public_url ? (
                            <a
                              href={file.public_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              {file.file_name}
                            </a>
                          ) : (
                            <span className="text-sm">{file.file_name}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
          <div className="px-5 pb-5 flex justify-end gap-2">
            <Button
              variant="outline-secondary"
              onClick={() => {
                void downloadVoucher(selectedVoucher?.voucher_number);
              }}
              disabled={busyAction === "pv"}
            >
              {busyAction === "pv" ? "Downloading..." : "Download PV"}
            </Button>
            <Button variant="outline-secondary" onClick={() => setSelectedVoucher(null)}>
              Close
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>
    </>
  );
}

export default FinanceRequestDetailPage;
