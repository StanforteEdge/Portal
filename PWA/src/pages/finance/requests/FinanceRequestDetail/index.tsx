import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import { FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/Base/Form";
import { Dialog } from "@/components/Base/Headless";
import Table from "@/components/Base/Table";
import clsx from "clsx";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import {
  approveFinanceRequestPaymentVoucherCorrection,
  disburseFinanceRequest,
  listFinanceAccounts,
  listFinanceRequestPaymentVouchers,
  rejectFinanceRequestPaymentVoucherCorrection,
  updateFinanceRequestPaymentVoucher,
  type FinanceAccountRecord,
} from "@/services/finance";
import {
  approveRequest,
  completeRequest,
  generateFullRequestDocument,
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
import { listEntityTags, listManagedTaxonomies, type TagTerm } from "@/services/taxonomy";
import type { FileAssetRecord } from "@/services/files";
import {
  formatDisplayDate,
  formatMoney,
  formatPaymentMethod,
  formatPersonName,
  formatRequestNumber,
  statusBadgeClass,
} from "@/utils/formatting";
import { buildRequestWorkflowSteps } from "@/utils/requestWorkflow";
import MediaPickerModal from "@/components/Media/MediaPickerModal";
import { useAppSelector } from "@/stores/hooks";
import { selectAuthState } from "@/stores/authSlice";

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

type PreviewFile = {
  file_name: string;
  mime_type: string | null;
  public_url: string | null;
};

type PaymentVoucherRecord = {
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
  paid_from_account: { id: string; name: string; code: string | null; account_type: string } | null;
  disbursed_at: string;
  retired_at: string | null;
  verified_at: string | null;
  evidence_file: { id: string; file_name: string; mime_type: string | null; public_url: string | null } | null;
  evidence_files: Array<{ id: string; file_name: string; mime_type: string | null; public_url: string | null }>;
  retirement_files: Array<{ id: string; file_name: string; mime_type: string | null; public_url: string | null }>;
  pending_correction: {
    id: string;
    status: string;
    reason: string | null;
    created_at: string;
    proposed_by: { id: string; name: string; email: string | null };
    proposed_snapshot: {
      amount: number;
      paid_from_account_id: string | null;
      disbursed_at: string | null;
      method: string | null;
      transaction_ref: string | null;
      note: string | null;
      evidence_file_ids: string[];
    };
  } | null;
};

function canPreviewInline(file: PreviewFile | null) {
  const mime = String(file?.mime_type || "").toLowerCase();
  return mime.startsWith("image/") || mime === "application/pdf" || mime.startsWith("text/");
}

function toDateInputValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function FinanceRequestDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const auth = useAppSelector(selectAuthState);

  const [request, setRequest] = useState<RequestRecord | null>(null);
  const [actions, setActions] = useState<string[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [financeAccounts, setFinanceAccounts] = useState<FinanceAccountRecord[]>([]);
  const [categoryTermMap, setCategoryTermMap] = useState<Record<string, string>>({});
  const [requestTags, setRequestTags] = useState<TagTerm[]>([]);
  const [paymentVouchers, setPaymentVouchers] = useState<PaymentVoucherRecord[]>([]);

  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<PaymentVoucherRecord | null>(null);

  const [showDisburseModal, setShowDisburseModal] = useState(false);
  const [showEvidencePicker, setShowEvidencePicker] = useState(false);
  const [showVoucherEvidencePicker, setShowVoucherEvidencePicker] = useState(false);
  const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null);
  const [disburseForm, setDisburseForm] = useState({
    method: "bank_transfer",
    custom_method: "",
    transaction_ref: "",
    amount: "",
    note: "",
    evidence_file_id: "",
    evidence_file_ids: [] as string[],
    evidence_file_names: [] as string[],
    paid_from_account_id: "",
  });
  const [voucherEditForm, setVoucherEditForm] = useState({
    amount: "",
    paid_from_account_id: "",
    disbursed_at: "",
    method: "",
    transaction_ref: "",
    note: "",
    correction_reason: "",
    evidence_file_id: "",
    evidence_file_ids: [] as string[],
    evidence_file_names: [] as string[],
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
    const projectId = String(data.project_id || "").trim();
    if (projectId) return projects.find((project) => project.id === projectId)?.name || projectId;
    const projectLabel = String(data.project_name || "").trim();
    return projectLabel || "-";
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
  const permissionSet = useMemo(
    () => new Set((auth.permissions ?? []).map((permission) => String(permission).toLowerCase())),
    [auth.permissions]
  );
  const canManageFinance = permissionSet.has("*") || permissionSet.has("finance.manage");
  const canCorrectCompletedFinance = permissionSet.has("*") || permissionSet.has("finance.correct_completed");
  const completedRequestVoucherEditLocked = request?.status === "completed" && !canCorrectCompletedFinance;
  const canEditVoucher = canManageFinance;

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
      const [req, actionList, teamsData, orgData, projectData, taxonomies, pvs, tagPayload, accounts] = await Promise.all([
        getRequest(id),
        getRequestActions(id),
        listTeams({ active_only: false }).catch(() => []),
        listOrganizations({ is_active: true }).catch(() => []),
        listProjects({ active_only: false }).catch(() => []),
        listManagedTaxonomies({ include_inactive: false }).catch(() => []),
        listFinanceRequestPaymentVouchers(id).catch(() => []),
        listEntityTags("request", id, "request_tags").catch(() => ({ tags: [] as TagTerm[] })),
        listFinanceAccounts({ is_active: true }).catch(() => []),
      ]);
      setRequest(req);
      setActions(actionList);
      setTeams(teamsData);
      setOrganizations(orgData);
      setProjects(projectData);
      setPaymentVouchers(pvs);
      setFinanceAccounts(accounts);
      setRequestTags(tagPayload?.tags || []);

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

  useEffect(() => {
    const voucherId = searchParams.get("voucher_id");
    if (!voucherId || paymentVouchers.length === 0) return;
    const matched = paymentVouchers.find((voucher) => voucher.id === voucherId);
    if (!matched) return;
    setSelectedVoucher(matched);
    setVoucherEditForm({
      amount: String(matched.amount ?? ""),
      paid_from_account_id: matched.paid_from_account?.id || "",
      disbursed_at: toDateInputValue(matched.disbursed_at),
      method: matched.method || "",
      transaction_ref: matched.transaction_ref || "",
      note: matched.note || "",
      correction_reason: matched.pending_correction?.reason || "",
      evidence_file_id: matched.evidence_files[0]?.id || matched.evidence_file?.id || "",
      evidence_file_ids: matched.evidence_files.map((file) => file.id),
      evidence_file_names: matched.evidence_files.map((file) => file.file_name),
    });
  }, [paymentVouchers, searchParams]);

  const openDisburse = () => {
    setDisburseForm({
      method: "bank_transfer",
      custom_method: "",
      transaction_ref: "",
      amount: remainingRequestBalance > 0 ? String(remainingRequestBalance) : "",
      note: "",
      evidence_file_id: "",
      evidence_file_ids: [],
      evidence_file_names: [],
      paid_from_account_id: financeAccounts[0]?.id || "",
    });
    setShowDisburseModal(true);
  };

  const openVoucher = (voucher: PaymentVoucherRecord) => {
    setSelectedVoucher(voucher);
    setVoucherEditForm({
      amount: String(voucher.amount ?? ""),
      paid_from_account_id: voucher.paid_from_account?.id || "",
      disbursed_at: toDateInputValue(voucher.disbursed_at),
      method: voucher.method || "",
      transaction_ref: voucher.transaction_ref || "",
      note: voucher.note || "",
      correction_reason: voucher.pending_correction?.reason || "",
      evidence_file_id: voucher.evidence_files[0]?.id || voucher.evidence_file?.id || "",
      evidence_file_ids: voucher.evidence_files.map((file) => file.id),
      evidence_file_names: voucher.evidence_files.map((file) => file.file_name),
    });
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("voucher_id", voucher.id);
      return next;
    });
  };

  const applyEvidenceFile = (files: FileAssetRecord[]) => {
    if (!files.length) return;
    setDisburseForm((prev) => ({
      ...prev,
      evidence_file_id: files[0]?.id || "",
      evidence_file_ids: files.map((file) => file.id),
      evidence_file_names: files.map((file) => file.file_name),
    }));
  };

  const applyVoucherEvidenceFile = (files: FileAssetRecord[]) => {
    if (!files.length) return;
    setVoucherEditForm((prev) => ({
      ...prev,
      evidence_file_id: files[0]?.id || "",
      evidence_file_ids: files.map((file) => file.id),
      evidence_file_names: files.map((file) => file.file_name),
    }));
  };

  const disburse = async () => {
    if (financeAccounts.length > 0 && !disburseForm.paid_from_account_id) {
      setNotice({ tone: "warning", message: "Please select a Paid From account." });
      return;
    }
    try {
      setBusyAction("disburse");
      const method = disburseForm.method === "other" ? disburseForm.custom_method.trim() : disburseForm.method;
      await disburseFinanceRequest(id, {
        note: disburseForm.note.trim() || undefined,
        method: method || undefined,
        transaction_ref: disburseForm.transaction_ref.trim() || undefined,
        amount: disburseForm.amount.trim() ? Number(disburseForm.amount) : undefined,
        evidence_file_id: disburseForm.evidence_file_ids[0] || disburseForm.evidence_file_id || undefined,
        evidence_file_ids: disburseForm.evidence_file_ids,
        paid_from_account_id: disburseForm.paid_from_account_id || undefined,
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
      const availableActions: string[] = await getRequestActions(id).catch(() => []);
      if (!availableActions.includes("approve")) {
        await load();
        setNotice({
          tone: "error",
          message: "This request is no longer awaiting your approval. We refreshed the page for you.",
        });
        return;
      }
      const comment = window.prompt("Approval comment (optional):", "") || undefined;
      await approveRequest(id, comment);
      setNotice({ tone: "success", message: "Request approved." });
      await load();
    } catch (error: any) {
      if (String(error?.response?.data?.error?.message || "").includes("not an allowed approver")) {
        await load();
      }
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Approval failed." });
    } finally {
      setBusyAction("");
    }
  };

  const reject = async () => {
    try {
      setBusyAction("reject");
      const availableActions: string[] = await getRequestActions(id).catch(() => []);
      if (!availableActions.includes("reject")) {
        await load();
        setNotice({
          tone: "error",
          message: "This request is no longer awaiting your review. We refreshed the page for you.",
        });
        return;
      }
      const comment = window.prompt("Rejection reason:", "") || undefined;
      await rejectRequest(id, comment);
      setNotice({ tone: "success", message: "Request rejected." });
      await load();
    } catch (error: any) {
      if (String(error?.response?.data?.error?.message || "").includes("not an allowed approver")) {
        await load();
      }
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

  const runFullDocument = async () => {
    try {
      setBusyAction("full_document");
      const file = await generateFullRequestDocument(id);
      downloadBase64File(file.file_name, file.mime_type, file.content_base64);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to generate full document." });
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

  const saveVoucherEdit = async () => {
    if (!selectedVoucher) return;
    if (!canEditVoucher) {
      setNotice({
        tone: "error",
        message: "You do not have permission to edit this payment voucher.",
      });
      return;
    }
    const parsedAmount = Number(voucherEditForm.amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setNotice({ tone: "error", message: "Enter a valid voucher amount greater than zero." });
      return;
    }
    try {
      setBusyAction("save_voucher");
      const result = await updateFinanceRequestPaymentVoucher(id, selectedVoucher.id, {
        amount: parsedAmount,
        paid_from_account_id: voucherEditForm.paid_from_account_id || undefined,
        disbursed_at: voucherEditForm.disbursed_at ? new Date(`${voucherEditForm.disbursed_at}T12:00:00`).toISOString() : undefined,
        method: voucherEditForm.method.trim() || undefined,
        transaction_ref: voucherEditForm.transaction_ref.trim() || undefined,
        note: voucherEditForm.note.trim() || undefined,
        correction_reason: voucherEditForm.correction_reason.trim() || undefined,
        evidence_file_id: voucherEditForm.evidence_file_ids[0] || voucherEditForm.evidence_file_id || undefined,
        evidence_file_ids: voucherEditForm.evidence_file_ids,
      });
      const updated = result.voucher;
      setSelectedVoucher(updated);
      setVoucherEditForm({
        amount: String(updated.amount ?? ""),
        paid_from_account_id: updated.paid_from_account?.id || "",
        disbursed_at: toDateInputValue(updated.disbursed_at),
        method: updated.method || "",
        transaction_ref: updated.transaction_ref || "",
        note: updated.note || "",
        correction_reason: updated.pending_correction?.reason || "",
        evidence_file_id: updated.evidence_files[0]?.id || updated.evidence_file?.id || "",
        evidence_file_ids: updated.evidence_files.map((file) => file.id),
        evidence_file_names: updated.evidence_files.map((file) => file.file_name),
      });
      setNotice({
        tone: "success",
        message:
          result.mode === "pending_approval"
            ? `Correction for voucher ${updated.voucher_number} submitted for approval.`
            : `Voucher ${updated.voucher_number} updated.`,
      });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to update payment voucher." });
    } finally {
      setBusyAction("");
    }
  };

  const approvePendingCorrection = async () => {
    const pending = selectedVoucher?.pending_correction;
    if (!selectedVoucher || !pending) return;
    try {
      setBusyAction("approve_voucher_correction");
      await approveFinanceRequestPaymentVoucherCorrection(id, selectedVoucher.id, pending.id);
      setNotice({ tone: "success", message: `Correction for voucher ${selectedVoucher.voucher_number} approved.` });
      await load();
      const refreshed = await listFinanceRequestPaymentVouchers(id).then((rows) => rows.find((row) => row.id === selectedVoucher.id) || null);
      setSelectedVoucher(refreshed);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to approve correction." });
    } finally {
      setBusyAction("");
    }
  };

  const rejectPendingCorrection = async () => {
    const pending = selectedVoucher?.pending_correction;
    if (!selectedVoucher || !pending) return;
    const comment = window.prompt("Reason for rejecting this correction (optional):", "") || undefined;
    try {
      setBusyAction("reject_voucher_correction");
      await rejectFinanceRequestPaymentVoucherCorrection(id, selectedVoucher.id, pending.id, { comment });
      setNotice({ tone: "success", message: `Correction for voucher ${selectedVoucher.voucher_number} rejected.` });
      await load();
      const refreshed = await listFinanceRequestPaymentVouchers(id).then((rows) => rows.find((row) => row.id === selectedVoucher.id) || null);
      setSelectedVoucher(refreshed);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to reject correction." });
    } finally {
      setBusyAction("");
    }
  };

  const openPreview = (file?: PreviewFile | null, event?: { stopPropagation?: () => void }) => {
    event?.stopPropagation?.();
    if (!file?.public_url) return;
    setPreviewFile(file);
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
          <div className="animate-pulse space-y-3">
            <div className="h-6 w-56 rounded bg-slate-200"></div>
            <div className="h-24 rounded bg-slate-100"></div>
          </div>
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
                    <div className="text-xs text-slate-500">Tags</div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {requestTags.length > 0 ? (
                        requestTags.map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                          >
                            {tag.label}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </div>
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
                        <span className="text-slate-500">- {item.owner}</span>
                        {item.actor ? (
                          <span className="text-slate-500 font-medium" title={item.actor}>
                            Approved by {item.actor}
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
                    <Table.Th>File</Table.Th>
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
                      <Table.Td>
                        {item.files?.length ? (
                          <div className="flex flex-col gap-2">
                            {item.files.map((file) => (
                              <div key={file.id} className="flex flex-wrap gap-2">
                                <Button size="sm" variant="outline-secondary" onClick={(event: any) => openPreview(file, event)}>
                                  View
                                </Button>
                                <a href={file.public_url || "#"} target="_blank" rel="noreferrer" className="inline-flex items-center text-sm text-primary hover:underline">
                                  {file.file_name}
                                </a>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </Table.Td>
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
                      <Table.Th>Paid From</Table.Th>
                      <Table.Th>Staff Confirmed</Table.Th>
                      <Table.Th>File</Table.Th>
                      <Table.Th className="text-right">PV</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {paymentVouchers.map((pv) => (
                      <Table.Tr
                        key={pv.id}
                        className="cursor-pointer"
                        onClick={() => openVoucher(pv)}
                      >
                        <Table.Td className="font-medium text-primary">{pv.voucher_number}</Table.Td>
                        <Table.Td>{formatMoney(pv.amount, "-", request.currency || "NGN")}</Table.Td>
                        <Table.Td>{formatMoney(pv.voucher_balance, "-", request.currency || "NGN")}</Table.Td>
                        <Table.Td>{retirementStatusLabel(pv.retirement_status)}</Table.Td>
                        <Table.Td>{pv.paid_from_account?.name || "-"}</Table.Td>
                        <Table.Td>{staffConfirmationLabel}</Table.Td>
                        <Table.Td>
                          {pv.evidence_files?.length ? (
                            <div className="flex flex-wrap gap-2">
                              {pv.evidence_files.map((file) => (
                                <Button key={file.id} size="sm" variant="outline-secondary" onClick={(event: any) => openPreview(file, event)}>
                                  View
                                </Button>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </Table.Td>
                        <Table.Td className="text-right">
                          <Button
                            size="sm"
                            variant="outline-secondary"
                            onClick={(e: any) => {
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
                <Button variant="outline-secondary" onClick={() => void runFullDocument()} disabled={busyAction === "full_document"}>
                  {busyAction === "full_document" ? "Generating..." : "Download Full Document"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={showDisburseModal} onClose={() => setShowDisburseModal(false)} staticBackdrop>
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
                <FormLabel>Paid From Account</FormLabel>
                <FormSelect
                  value={disburseForm.paid_from_account_id}
                  onChange={(e) => setDisburseForm((prev) => ({ ...prev, paid_from_account_id: e.target.value }))}
                >
                  <option value="">Select account</option>
                  {financeAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} {account.code ? `(${account.code})` : ""}
                    </option>
                  ))}
                </FormSelect>
              </div>
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
                <Button variant="outline-secondary" onClick={() => setShowEvidencePicker(true)}>
                  {disburseForm.evidence_file_names.length ? "Change Evidence Files" : "Pick Evidence Files"}
                </Button>
                <div className="text-xs text-slate-500 mt-1">
                  {disburseForm.evidence_file_names.length ? `Attached: ${disburseForm.evidence_file_names.join(", ")}` : "Optional"}
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
            <Button variant="primary" onClick={() => void disburse()} disabled={busyAction === "disburse"}>
              {busyAction === "disburse" ? "Disbursing..." : "Disburse"}
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>
      <MediaPickerModal
        open={showEvidencePicker}
        onClose={() => setShowEvidencePicker(false)}
        title="Select Disbursement Evidence"
        multiple
        selectedIds={disburseForm.evidence_file_ids.length ? disburseForm.evidence_file_ids : (disburseForm.evidence_file_id ? [disburseForm.evidence_file_id] : [])}
        onSelect={applyEvidenceFile}
      />

      <Dialog
        open={Boolean(selectedVoucher)}
        onClose={() => {
          setSelectedVoucher(null);
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.delete("voucher_id");
            return next;
          });
        }}
        staticBackdrop
      >
        <Dialog.Panel>
          <div className="p-5 space-y-2">
            <div className="text-lg font-medium">Payment Voucher Details</div>
            {selectedVoucher ? (
              <>
                <div className="text-sm"><span className="text-slate-500">PV Number:</span> {selectedVoucher.voucher_number}</div>
                <div className="text-sm"><span className="text-slate-500">Amount:</span> {formatMoney(selectedVoucher.amount, "-", request?.currency || "NGN")}</div>
                <div className="text-sm"><span className="text-slate-500">Paid From:</span> {selectedVoucher.paid_from_account?.name || "-"}</div>
                <div className="text-sm"><span className="text-slate-500">Disbursed At:</span> {formatDisplayDate(selectedVoucher.disbursed_at)}</div>
                {completedRequestVoucherEditLocked ? (
                  <AppNotice
                    className="mt-2"
                    tone="warning"
                    message="This request is completed. Your changes will be submitted for approval and only take effect after a finance.correct_completed user approves them."
                  />
                ) : null}
                {selectedVoucher.pending_correction ? (
                  <AppNotice
                    className="mt-2"
                    tone="warning"
                    message={`A correction is already pending approval from ${selectedVoucher.pending_correction.proposed_by.name}.`}
                  />
                ) : null}
                <div className="grid grid-cols-12 gap-3 pt-2">
                  <div className="col-span-12 md:col-span-6">
                    <FormLabel>Amount</FormLabel>
                    <FormInput
                      type="number"
                      min="0"
                      step="0.01"
                      value={voucherEditForm.amount}
                      onChange={(e) => setVoucherEditForm((prev) => ({ ...prev, amount: e.target.value }))}
                      disabled={!canEditVoucher}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-6">
                    <FormLabel>Paid From Account</FormLabel>
                    <FormSelect
                      value={voucherEditForm.paid_from_account_id}
                      onChange={(e) => setVoucherEditForm((prev) => ({ ...prev, paid_from_account_id: e.target.value }))}
                      disabled={!canEditVoucher}
                    >
                      <option value="">Select account</option>
                      {financeAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name} {account.code ? `(${account.code})` : ""}
                        </option>
                      ))}
                    </FormSelect>
                  </div>
                  <div className="col-span-12 md:col-span-6">
                    <FormLabel>Disbursed Date</FormLabel>
                    <FormInput
                      type="date"
                      value={voucherEditForm.disbursed_at}
                      onChange={(e) => setVoucherEditForm((prev) => ({ ...prev, disbursed_at: e.target.value }))}
                      disabled={!canEditVoucher}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-6">
                    <FormLabel>Method</FormLabel>
                    <FormInput
                      value={voucherEditForm.method}
                      onChange={(e) => setVoucherEditForm((prev) => ({ ...prev, method: e.target.value }))}
                      placeholder={formatPaymentMethod(selectedVoucher.method)}
                      disabled={!canEditVoucher}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-6">
                    <FormLabel>Transaction Ref</FormLabel>
                    <FormInput
                      value={voucherEditForm.transaction_ref}
                      onChange={(e) => setVoucherEditForm((prev) => ({ ...prev, transaction_ref: e.target.value }))}
                      disabled={!canEditVoucher}
                    />
                  </div>
                  <div className="col-span-12">
                    <FormLabel>Note</FormLabel>
                    <FormTextarea
                      rows={3}
                      value={voucherEditForm.note}
                      onChange={(e) => setVoucherEditForm((prev) => ({ ...prev, note: e.target.value }))}
                      disabled={!canEditVoucher}
                    />
                  </div>
                  {completedRequestVoucherEditLocked ? (
                    <div className="col-span-12">
                      <FormLabel>Reason For Correction</FormLabel>
                      <FormTextarea
                        rows={2}
                        value={voucherEditForm.correction_reason}
                        onChange={(e) => setVoucherEditForm((prev) => ({ ...prev, correction_reason: e.target.value }))}
                        placeholder="Explain why this completed voucher needs correction."
                        disabled={!canEditVoucher}
                      />
                    </div>
                  ) : null}
                  <div className="col-span-12">
                    <FormLabel>Evidence Files</FormLabel>
                    <Button variant="outline-secondary" onClick={() => setShowVoucherEvidencePicker(true)} disabled={!canEditVoucher}>
                      {voucherEditForm.evidence_file_names.length ? "Change Attached Files" : "Attach Files"}
                    </Button>
                    <div className="mt-1 text-xs text-slate-500">
                      {voucherEditForm.evidence_file_names.length ? voucherEditForm.evidence_file_names.join(", ") : "No evidence file attached yet."}
                    </div>
                  </div>
                </div>
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
                {selectedVoucher.evidence_files.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {selectedVoucher.evidence_files.map((file) => (
                      <div key={file.id} className="flex flex-wrap gap-3">
                        <button type="button" className="text-sm text-primary hover:underline" onClick={() => openPreview(file)}>
                          {file.file_name}
                        </button>
                        <a href={file.public_url || "#"} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
                          Open in New Tab
                        </a>
                      </div>
                    ))}
                  </div>
                ) : null}
                {selectedVoucher.retirement_files.length > 0 ? (
                  <div className="pt-2 mt-2 border-t">
                    <div className="text-sm font-medium mb-1">Retirement Files</div>
                    <div className="space-y-1">
                      {selectedVoucher.retirement_files.map((file) => (
                        <div key={file.id}>
                          {file.public_url ? (
                            <div className="flex flex-wrap gap-3">
                              <button type="button" className="text-sm text-primary hover:underline" onClick={() => openPreview(file)}>
                                {file.file_name}
                              </button>
                              <a
                                href={file.public_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm text-primary hover:underline"
                              >
                                Open
                              </a>
                            </div>
                          ) : (
                            <span className="text-sm">{file.file_name}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {selectedVoucher.pending_correction ? (
                  <div className="pt-2 mt-2 border-t">
                    <div className="text-sm font-medium mb-1">Pending Correction</div>
                    <div className="text-sm"><span className="text-slate-500">Requested By:</span> {selectedVoucher.pending_correction.proposed_by.name}</div>
                    <div className="text-sm"><span className="text-slate-500">Requested At:</span> {formatDisplayDate(selectedVoucher.pending_correction.created_at)}</div>
                    <div className="text-sm"><span className="text-slate-500">Proposed Amount:</span> {formatMoney(selectedVoucher.pending_correction.proposed_snapshot.amount, "-", request?.currency || "NGN")}</div>
                    <div className="text-sm"><span className="text-slate-500">Proposed Date:</span> {formatDisplayDate(selectedVoucher.pending_correction.proposed_snapshot.disbursed_at)}</div>
                    <div className="text-sm"><span className="text-slate-500">Proposed Method:</span> {formatPaymentMethod(selectedVoucher.pending_correction.proposed_snapshot.method)}</div>
                    <div className="text-sm"><span className="text-slate-500">Proposed Ref:</span> {selectedVoucher.pending_correction.proposed_snapshot.transaction_ref || "-"}</div>
                    <div className="text-sm"><span className="text-slate-500">Reason:</span> {selectedVoucher.pending_correction.reason || "-"}</div>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
          <div className="px-5 pb-5 flex justify-end gap-2">
            {selectedVoucher?.pending_correction && canCorrectCompletedFinance ? (
              <>
                <Button
                  variant="outline-secondary"
                  onClick={() => void rejectPendingCorrection()}
                  disabled={busyAction === "reject_voucher_correction"}
                >
                  {busyAction === "reject_voucher_correction" ? "Rejecting..." : "Reject Correction"}
                </Button>
                <Button
                  variant="primary"
                  onClick={() => void approvePendingCorrection()}
                  disabled={busyAction === "approve_voucher_correction"}
                >
                  {busyAction === "approve_voucher_correction" ? "Approving..." : "Approve Correction"}
                </Button>
              </>
            ) : null}
            <Button variant="primary" onClick={() => void saveVoucherEdit()} disabled={busyAction === "save_voucher" || !canEditVoucher}>
              {busyAction === "save_voucher" ? "Saving..." : completedRequestVoucherEditLocked ? "Submit Correction" : "Save Changes"}
            </Button>
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
      <MediaPickerModal
        open={showVoucherEvidencePicker}
        onClose={() => setShowVoucherEvidencePicker(false)}
        title="Select Voucher Evidence"
        multiple
        selectedIds={voucherEditForm.evidence_file_ids.length ? voucherEditForm.evidence_file_ids : (voucherEditForm.evidence_file_id ? [voucherEditForm.evidence_file_id] : [])}
        onSelect={applyVoucherEvidenceFile}
      />

      <Dialog open={Boolean(previewFile)} onClose={() => setPreviewFile(null)}>
        <Dialog.Panel className="h-screen w-screen max-w-none rounded-none bg-black/95 shadow-none">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-4 px-6 py-4 text-white">
              <div>
                <div className="text-lg font-medium">File Preview</div>
                <div className="text-sm text-slate-300">{previewFile?.file_name || "-"}</div>
              </div>
              <div className="flex items-center gap-4">
                {previewFile?.public_url ? (
                  <a href={previewFile.public_url} target="_blank" rel="noreferrer" className="text-sm text-white/90 hover:text-white hover:underline">
                    Open in New Tab
                  </a>
                ) : null}
                <button
                  type="button"
                  aria-label="Close file preview"
                  title="Close file preview"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                  onClick={() => setPreviewFile(null)}
                >
                  <Lucide icon="XCircle" className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 px-4 pb-4 pt-2">
              {previewFile?.public_url ? (
                canPreviewInline(previewFile) ? (
                  String(previewFile.mime_type || "").toLowerCase().startsWith("image/") ? (
                    <div className="flex h-full items-center justify-center">
                      <img src={previewFile.public_url} alt={previewFile.file_name} className="max-h-full max-w-full object-contain" />
                    </div>
                  ) : (
                    <iframe title={previewFile.file_name} src={previewFile.public_url} className="h-full w-full bg-white" />
                  )
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-300">
                    This file cannot be previewed inline. Use Open in New Tab.
                  </div>
                )
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-300">No preview available.</div>
              )}
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    </>
  );
}

export default FinanceRequestDetailPage;
