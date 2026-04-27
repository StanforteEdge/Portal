import {
  ActivityFeed,
  Button,
  Chip,
  EmptyState,
  Icon,
  MediaPickerModal,
  PageHeader,
  RightRail,
  SelectField,
  SectionCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
  StatCard,
  TextField,
  TextAreaField,
  useToast,
  WorkflowStepper,
  type WorkflowStep,
  type WorkflowStepStatus,
} from "@/shared";
import { formatCurrency } from "@stanforte/shared";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import { cacheStore, useCachedQuery } from "@/shared/lib/core";
import {
  buildAppMobileNav,
  buildRequestsNavigation,
  requestsMobileNav,
} from "@/features/requests/requests-data";
import {
  approveRequest,
  deleteRequest,
  downloadRequestArtifact,
  completeRequest,
  confirmRequest,
  disburseRequest,
  getRequest,
  getRequestActions,
  listMyOrganizations,
  listProjects,
  rejectRequest,
  returnRequest,
  listGroups,
  retireRequest,
  submitRequest,
} from "@/features/requests/requests-api";
import { listEntityTags, listManagedTaxonomies } from "@/features/taxonomy/taxonomy-api";
import { listFileAssets, uploadFileAsset } from "@/features/files/files-api";
import { financeApi } from "@/shared/lib/core";
import type { FinancePaymentVoucherRecord } from "@/shared";
import { downloadBase64File } from "@/shared/lib/download";
import { formatDisplayDate } from "@stanforte/shared";
import {
  formatPersonName,
  formatRequestStatus,
  formatViewerRequestStatus,
  requestFamilyFromRecord,
  requestStatusTone,
} from "@/features/requests/request-helpers";

function normalizeWorkflowLabel(step: Record<string, any>, index: number) {
  const role = String(
    step.role || step.approver?.value || step.approver_id || "",
  ).toLowerCase();
  const approverType = String(
    step.approver?.type || step.approver_type || "",
  ).toLowerCase();
  if (
    role.includes("team_lead_or_manager") ||
    step.approver?.value === "requester_team_lead_or_manager"
  ) {
    return index === 0 ? "Team Lead Approval" : "Manager Approval";
  }
  if (
    role.includes("team_lead") ||
    step.approver?.value === "requester_team_lead"
  ) {
    return "Team Lead Approval";
  }
  if (
    role.includes("accountant") ||
    step.approver?.value === "finance.approve" ||
    approverType === "permission"
  ) {
    return "Accountant Clears";
  }
  if (role.includes("hr")) return "HR Approval";
  if (role.includes("coo")) return "COO Approval";
  if (role.includes("ed")) return "ED Approval";
  if (role.includes("board")) return "Board Member Approval";
  return String(step.step || step.name || `Approval ${index + 1}`);
}

function buildWorkflow(
  request: any,
  pendingSteps: Array<{ step: string }>,
  paymentVouchers: Array<{
    amount?: number;
    retired_amount?: number;
    retirement_status?: string;
  }>,
  options?: { showDraftStep?: boolean },
): WorkflowStep[] {
  const status = deriveRequestWorkflowStatus(request);
  const stateEvents = Array.isArray(request?.data?.state_events)
    ? request.data.state_events
    : [];
  const doneEntries = Array.isArray(request?.approvals?.done)
    ? request.approvals.done
    : [];
  const requestTypeSteps = Array.isArray(
    request?.request_type?.approval_flow_json?.steps,
  )
    ? request.request_type.approval_flow_json.steps
    : [];
  const approvalStepsSource = requestTypeSteps.length
    ? requestTypeSteps
    : [{ role: "team_lead" }, { role: "accountant" }];
  const approvalLabels = approvalStepsSource.map(
    (step: Record<string, any>, index: number) =>
      normalizeWorkflowLabel(step, index),
  );
  const total = Number(request?.total_amount || 0);
  const disbursedTotal = paymentVouchers.reduce(
    (sum, voucher) => sum + Number(voucher.amount || 0),
    0,
  );
  const retiredTotal = paymentVouchers.reduce(
    (sum, voucher) => sum + Number(voucher.retired_amount || 0),
    0,
  );
  const requestComplete = status === "completed";
  const approvalDoneCount = Math.min(doneEntries.length, approvalLabels.length);
  const approvalCurrentIndex =
    pendingSteps.length > 0
      ? Math.min(approvalDoneCount, Math.max(0, approvalLabels.length - 1))
      : -1;
  const financeCurrent =
    status === "cleared" ||
    (status === "disbursed" && total > 0 && disbursedTotal < total);
  const confirmCurrent =
    status === "disbursed" && !(total > 0 && disbursedTotal < total);
  const retireCurrent = status === "confirmed";
  const completeCurrent = status === "retired" || requestComplete;

  const showDraftStep = options?.showDraftStep ?? true;
  const draftedStatus: WorkflowStepStatus =
    showDraftStep &&
      (status === "draft" ||
        stateEvents.some(
          (event: Record<string, unknown>) =>
            String(event.from || "").toLowerCase() === "draft",
        )) &&
      !approvalDoneCount &&
      disbursedTotal === 0 &&
      retiredTotal === 0
      ? "current"
      : "complete";
  const approvalSteps: WorkflowStep[] = approvalLabels.map(
    (label: string, index: number) => {
      const done =
        index < approvalDoneCount ||
        requestComplete ||
        status === "cleared" ||
        status === "disbursed" ||
        status === "confirmed" ||
        status === "retired";
      const isCurrent =
        approvalCurrentIndex === index &&
        ["approval", "sent", "under_review", "review"].includes(status);
      return {
        label,
        detail: isCurrent
          ? `Waiting on ${label}.`
          : done
            ? `${label} completed.`
            : `Awaiting ${label}.`,
        status:
          done && !isCurrent ? "complete" : isCurrent ? "current" : "upcoming",
      } satisfies WorkflowStep;
    },
  );

  const financeSteps: WorkflowStep[] = [
    {
      label: "Disbursement",
      detail:
        total > 0
          ? `${formatCurrency(disbursedTotal, request?.currency)} / ${formatCurrency(total, request?.currency)}`
          : "Funds/payment voucher issued by finance.",
      status: financeCurrent
        ? "current"
        : confirmCurrent || retireCurrent || completeCurrent
          ? "complete"
          : "upcoming",
    },
    {
      label: "Confirmation",
      detail: "Requester confirms receipt after disbursement.",
      status: confirmCurrent
        ? "current"
        : retireCurrent || completeCurrent
          ? "complete"
          : "upcoming",
    },
    {
      label: "Retirement",
      detail:
        total > 0
          ? `${formatCurrency(retiredTotal, request?.currency)} / ${formatCurrency(total, request?.currency)}`
          : "Retirement support submitted for verification.",
      status: retireCurrent
        ? "current"
        : completeCurrent || requestComplete || retiredTotal >= total
          ? "complete"
          : "upcoming",
    },
    {
      label: "Completed",
      detail: "Finance verifies the retirement and closes the request.",
      status: completeCurrent
        ? "current"
        : requestComplete
          ? "complete"
          : "upcoming",
    },
  ];

  const steps: WorkflowStep[] = [
    ...(showDraftStep
      ? [
        {
          label: "Drafted",
          detail: "Request initialized and saved.",
          status: draftedStatus,
        } satisfies WorkflowStep,
      ]
      : []),
    ...approvalSteps,
    ...financeSteps,
  ];

  let currentMarked = false;
  return steps.map((step) => {
    if (step.status !== "upcoming") return step;
    if (!currentMarked && !requestComplete) {
      currentMarked = true;
      return { ...step, status: "current" as const };
    }
    return step;
  });
}

function buildLeaveWorkflow(
  request: any,
  pendingSteps: Array<{ step: string }>,
  options?: { showDraftStep?: boolean },
): WorkflowStep[] {
  const status = deriveRequestWorkflowStatus(request);
  const doneEntries = Array.isArray(request?.approvals?.done)
    ? request.approvals.done
    : [];
  const requestTypeSteps = Array.isArray(
    request?.request_type?.approval_flow_json?.steps,
  )
    ? request.request_type.approval_flow_json.steps
    : [];
  const approvalStepsSource = requestTypeSteps.length
    ? requestTypeSteps
    : [{ role: "team_lead" }, { role: "hr" }];
  const approvalLabels = approvalStepsSource.map(
    (step: Record<string, any>, index: number) =>
      normalizeWorkflowLabel(step, index),
  );
  const approvalDoneCount = Math.min(doneEntries.length, approvalLabels.length);
  const approvalCurrentIndex =
    pendingSteps.length > 0
      ? Math.min(approvalDoneCount, Math.max(0, approvalLabels.length - 1))
      : -1;
  const requestComplete = ["approved", "completed"].includes(String(status));
  const requestRejected = String(status) === "rejected";
  const showDraftStep = options?.showDraftStep ?? true;

  const draftStep = showDraftStep
    ? [
      {
        label: "Drafted",
        detail: "Leave request initialized and saved.",
        status:
          status === "draft" && approvalDoneCount === 0
            ? ("current" as const)
            : ("complete" as const),
      } satisfies WorkflowStep,
    ]
    : [];

  const approvalSteps: WorkflowStep[] = approvalLabels.map((label: string, index: number) => {
    const done = index < approvalDoneCount || requestComplete || requestRejected;
    const isCurrent =
      approvalCurrentIndex === index &&
      ["approval", "sent", "under_review", "review"].includes(String(status));
    return {
      label,
      detail: isCurrent
        ? `Waiting on ${label}.`
        : done
          ? `${label} completed.`
          : `Awaiting ${label}.`,
      status:
        done && !isCurrent ? "complete" : isCurrent ? "current" : "upcoming",
    } satisfies WorkflowStep;
  });

  const finalStep: WorkflowStep = {
    label: requestRejected ? "Rejected" : "Approved",
    detail: requestRejected
      ? "Leave request was rejected."
      : requestComplete
        ? "Leave request approved and closed."
        : "Awaiting final decision.",
    status: requestRejected || requestComplete ? "complete" : "upcoming",
  };

  return [...draftStep, ...approvalSteps, finalStep];
}

function deriveRequestWorkflowStatus(request: any) {
  const rawStatus = String(request?.status || "").toLowerCase();
  const stateEvents = Array.isArray(request?.data?.state_events)
    ? request.data.state_events
    : [];
  const latestWorkflowEvent = [...stateEvents]
    .reverse()
    .find((event: Record<string, unknown>) => {
      const action = String(event.action || "").toLowerCase();
      const to = String(event.to || "").toLowerCase();
      return ["return", "reject", "approve", "submit", "resubmit"].includes(action)
        || ["returned", "returned_for_edit", "rejected", "approval", "sent"].includes(to);
    }) as Record<string, unknown> | undefined;
  const latestAction = String(latestWorkflowEvent?.action || "").toLowerCase();
  const latestTo = String(latestWorkflowEvent?.to || "").toLowerCase();

  if (rawStatus === "rejected") {
    return "rejected";
  }

  if (rawStatus === "returned" || rawStatus === "returned_for_edit") {
    return "returned";
  }

  if (
    rawStatus === "draft" &&
    (latestAction === "return" || latestTo === "returned" || latestTo === "returned_for_edit")
  ) {
    return "returned";
  }

  if (
    rawStatus === "draft" &&
    (latestAction === "reject" || latestTo === "rejected")
  ) {
    return "rejected";
  }

  const hasSubmitted =
    stateEvents.some((event: Record<string, unknown>) => {
      const action = String(event.action || "").toLowerCase();
      const to = String(event.to || "").toLowerCase();
      return (
        action === "submit" ||
        action === "workflow_start" ||
        action === "workflow_auto_approved" ||
        to === "sent" ||
        to === "approval"
      );
    }) ||
    (Array.isArray(request?.approvals?.pending) &&
      request.approvals.pending.length > 0) ||
    (Array.isArray(request?.approvals?.done) &&
      request.approvals.done.length > 0);

  if (rawStatus === "draft" && hasSubmitted) {
    return "approval";
  }

  return rawStatus;
}

function requestHasDraftHistory(request: any) {
  const stateEvents = Array.isArray(request?.data?.state_events)
    ? request.data.state_events
    : [];
  return stateEvents.some(
    (event: Record<string, unknown>) =>
      String(event.from || "").toLowerCase() === "draft" ||
      String(event.to || "").toLowerCase() === "draft",
  );
}

function formatCertificateCurrency(amount: number, currency?: string | null) {
  const value = Number.isFinite(amount) ? amount : 0;
  const formatted = new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  const prefix = currency ? String(currency).toUpperCase() : "NGN";
  return `${prefix} ${formatted}`;
}

async function buildCertificateOfHonorPdf(input: {
  requestLabel: string;
  voucherNumber: string;
  staffName: string;
  amountLabel: string;
  declaration: string;
  reason: string;
  issuedAt: string;
}) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const marginX = 48;
  let y = 792;

  const write = (
    text: string,
    size = 11,
    isBold = false,
    indent = 0,
    lineGap = 18,
  ) => {
    if (y < 72) y = 792;
    page.drawText(text, {
      x: marginX + indent,
      y,
      size,
      font: isBold ? bold : regular,
    });
    y -= lineGap;
  };

  write("CERTIFICATE OF HONOR", 20, true);
  write("Cash Advance Retirement Declaration", 12, true);
  y -= 12;
  write(`Request: ${input.requestLabel}`, 11, true);
  write(`Payment Voucher: ${input.voucherNumber}`);
  write(`Staff Member: ${input.staffName}`);
  write(`Amount: ${input.amountLabel}`);
  write(`Date: ${input.issuedAt}`);
  y -= 8;
  write("Declaration", 13, true);
  [
    input.declaration ||
    "I hereby certify that the cash advance and/or disbursed funds referenced above were used for official purposes.",
    "Supporting receipts are not available for the full amount because:",
    input.reason || "No additional explanation provided.",
  ].forEach((line) => write(line, 11, false, 12, 16));
  y -= 10;
  write(
    "I accept responsibility for the accuracy of this declaration and understand it will",
    11,
    false,
    12,
    16,
  );
  write(
    "form part of the retirement record for this request.",
    11,
    false,
    12,
    16,
  );
  y -= 18;
  write("Signature: ____________________________", 11, false);
  write("Name: ________________________________", 11, false);

  const bytes = await pdf.save();
  const byteArrayBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
  return new File(
    [byteArrayBuffer],
    `Certificate_of_Honor_${input.requestLabel.replace(/[\\/]+/g, "-")}.pdf`,
    {
      type: "application/pdf",
    },
  );
}

function DownloadDropdown(props: {
  actionBusy: string;
  onDownloadRequestPdf: () => void;
  onDownloadFullDocument: () => void;
  includeFullDocument?: boolean;
}) {
  const {
    actionBusy,
    onDownloadRequestPdf,
    onDownloadFullDocument,
    includeFullDocument = true,
  } = props;
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={menuRef} className="relative w-full">
      <Button
        variant="secondary"
        className="w-full justify-between"
        onClick={() => setOpen((current) => !current)}
        disabled={actionBusy !== ""}
      >
        <span className="inline-flex items-center gap-2">
          <Icon name="download" className="text-[18px]" />
          Download
        </span>
        <Icon
          name={open ? "expand_less" : "expand_more"}
          className="text-[18px]"
        />
      </Button>
      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-full min-w-[240px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <button
            type="button"
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            onClick={() => {
              setOpen(false);
              onDownloadRequestPdf();
            }}
          >
            <Icon name="description" className="text-[18px]" />
            Request PDF
          </button>
          {includeFullDocument ? (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              onClick={() => {
                setOpen(false);
                onDownloadFullDocument();
              }}
            >
              <Icon name="folder_zip" className="text-[18px]" />
              Full Document
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

type RequestDetailsView = "mine" | "approvals" | "finance";

export function RequestDetailsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [actionComment, setActionComment] = useState("");
  const [actionBusy, setActionBusy] = useState<string>("");
  const [showDisburseDialog, setShowDisburseDialog] = useState(false);
  const [showRetireDialog, setShowRetireDialog] = useState(false);
  const [showVoucherPreviewDialog, setShowVoucherPreviewDialog] =
    useState(false);
  const [previewVoucher, setPreviewVoucher] =
    useState<FinancePaymentVoucherRecord | null>(null);
  const [voucherFilePreview, setVoucherFilePreview] = useState<{
    name: string;
    url: string;
    mime_type: string | null;
  } | null>(null);
  const [disburseMode, setDisburseMode] = useState<"create" | "edit">("create");
  const [editingVoucherId, setEditingVoucherId] = useState<string>("");
  const [disburseForm, setDisburseForm] = useState({
    amount: "",
    method: "bank_transfer",
    transaction_ref: "",
    paid_from_account_id: "",
    note: "",
    disbursed_at: new Date().toISOString().slice(0, 10),
  });
  const [disburseFiles, setDisburseFiles] = useState<
    Array<{ id: string; file_name: string }>
  >([]);
  const [showDisbursementMediaPicker, setShowDisbursementMediaPicker] =
    useState(false);
  const [showRetirementMediaPicker, setShowRetirementMediaPicker] =
    useState(false);
  const [retireForm, setRetireForm] = useState({
    voucher_id: "",
    retired_amount: "",
    notes: "",
    retirement_file_ids: [] as string[],
    refund_amount: "",
    refund_method: "bank_transfer",
    refund_reference: "",
    refund_date: new Date().toISOString().slice(0, 10),
  });
  const [showCertificateHonorForm, setShowCertificateHonorForm] =
    useState(false);
  const [retirementCertificateForm, setRetirementCertificateForm] = useState({
    declaration:
      "I hereby certify that the disbursed funds referenced above were used for official purposes in line with the approved request.",
    reason:
      "No supporting receipt is available for the full amount because the expense was settled without a formal receipt or the receipt could not be obtained in time for retirement.",
  });
  const defaultCertificateReason =
    "No supporting receipt is available for the full amount because the expense was settled without a formal receipt or the receipt could not be obtained in time for retirement.";
  const id = searchParams.get("id") || "";
  const detailView = (searchParams.get("view") || "mine") as RequestDetailsView;
  const { user } = useAuth();
  const currentUserId = user?.id ? String(user.id) : undefined;
  const { showToast } = useToast();

  const {
    data: request,
    loading,
    error,
    refetch,
  } = useCachedQuery(
    `requests:detail:${id || "none"}`,
    () => {
      if (!id) return Promise.resolve(null);
      return getRequest(id);
    },
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const { data: requestActions, refetch: refetchRequestActions } =
    useCachedQuery(
      `requests:actions:${id || "none"}`,
      () => {
        if (!id) return Promise.resolve([]);
        return getRequestActions(id);
      },
      { ttlMs: 1000 * 60, storage: "memory" },
    );
  const { data: projects } = useCachedQuery(
    "requests:projects",
    () => listProjects(),
    {
      ttlMs: 1000 * 60 * 10,
      storage: "memory",
    },
  );
  const { data: organizations } = useCachedQuery(
    "requests:my-organizations",
    () => listMyOrganizations(),
    {
      ttlMs: 1000 * 60 * 10,
      storage: "memory",
    },
  );
  const { data: teams } = useCachedQuery("requests:groups", () => listGroups(), {
    ttlMs: 1000 * 60 * 10,
    storage: "memory",
  });
  const { data: managedTaxonomies } = useCachedQuery(
    "requests:taxonomies",
    () => listManagedTaxonomies({ include_inactive: false }),
    { ttlMs: 1000 * 60 * 10, storage: "memory" },
  );
  const { data: tagsResponse } = useCachedQuery(
    `requests:detail:tags:${id || "none"}`,
    () =>
      id
        ? listEntityTags("request", id, "request_tags")
        : Promise.resolve({ taxonomy: null, tags: [] }),
    { ttlMs: 1000 * 60, storage: "memory" },
  );
  const { data: financeAccounts } = useCachedQuery(
    "finance:accounts:options",
    () => financeApi.listAccounts({ is_active: true }),
    { ttlMs: 1000 * 60 * 10, storage: "memory" },
  );
  const { data: paymentVouchers, refetch: refetchPaymentVouchers } =
    useCachedQuery(
      `requests:detail:payment-vouchers:${id || "none"}`,
      () => (id ? financeApi.listRequestPaymentVouchers(id) : Promise.resolve([])),
      { ttlMs: 1000 * 60, storage: "memory" },
    );

  const family = requestFamilyFromRecord(request || undefined);
  const workflowStatus = deriveRequestWorkflowStatus(request);
  const statusTone = requestStatusTone(workflowStatus);
  const requestData =
    request?.data && typeof request.data === "object" ? request.data : {};
  const categoryTaxonomyKey = String(request?.request_type?.category_key || "");
  const categoryTaxonomy = managedTaxonomies?.find(
    (taxonomy) => taxonomy.key === categoryTaxonomyKey,
  );
  const categoryName =
    categoryTaxonomy?.terms?.find(
      (entry) => entry.id === String(requestData.category_id || ""),
    )?.label ||
    String(requestData.category_name || requestData.category_id || "-");
  const requestTags = tagsResponse?.tags ?? [];
  const projectName =
    projects?.find((entry) => entry.id === String(requestData.project_id || ""))
      ?.name ||
    String(requestData.project_name || requestData.project_id || "-");
  const teamName =
    teams?.find((entry) => entry.id === String(requestData.team_id || ""))
      ?.name || String(requestData.team_name || requestData.team_id || "-");
  const handoverUserId = String(requestData.handover_user_id || "");
  const handoverColleagueName = useMemo(() => {
    if (!handoverUserId) return "-";
    for (const team of teams ?? []) {
      for (const member of team.members ?? []) {
        const memberId = String(member.userId || member.user.id || "");
        if (memberId !== handoverUserId) continue;
        return (
          `${member.user.firstName ?? ""} ${member.user.lastName ?? ""}`.trim() ||
          member.user.username ||
          member.user.email ||
          handoverUserId
        );
      }
    }
    return handoverUserId;
  }, [handoverUserId, teams]);
  const organizationName =
    organizations?.find(
      (entry) =>
        entry.organization.id === String(requestData.organization_id || ""),
    )?.organization.name ||
    String(requestData.organization_name || requestData.organization_id || "-");
  const lineItems = request?.items ?? [];
  const documents = lineItems.flatMap((item) => item.files ?? []);
  const requestTotal = Number(request?.total_amount || 0);
  const disbursedTotal = useMemo(
    () =>
      (paymentVouchers ?? []).reduce(
        (sum, voucher) => sum + Number(voucher.amount || 0),
        0,
      ),
    [paymentVouchers],
  );
  const retiredTotal = useMemo(
    () =>
      (paymentVouchers ?? []).reduce(
        (sum, voucher) => sum + Number(voucher.retired_amount || 0),
        0,
      ),
    [paymentVouchers],
  );
  const remainingDisbursement = Math.max(0, requestTotal - disbursedTotal);
  const defaultFinanceAccountId = financeAccounts?.[0]?.id ?? "";
  const pendingApprovals = request?.approvals?.pending ?? [];
  const completedApprovals = request?.approvals?.done ?? [];
  const workflow =
    family === "leave"
      ? buildLeaveWorkflow(request, pendingApprovals, {
        showDraftStep:
          detailView === "mine" &&
          workflowStatus === "draft" &&
          requestHasDraftHistory(request),
      })
      : buildWorkflow(
        request,
        pendingApprovals,
        paymentVouchers ?? [],
        {
          showDraftStep:
            detailView === "mine" &&
            workflowStatus === "draft" &&
            requestHasDraftHistory(request),
        },
      );
  const parentPath =
    detailView === "mine" && family === "leave"
      ? "/leave"
      : detailView === "approvals"
        ? "/requests/approvals"
        : detailView === "finance"
          ? "/finance/requests"
          : "/requests";
  const parentLabel =
    detailView === "mine" && family === "leave"
      ? "Leave Tracker"
      : detailView === "approvals"
        ? "Approvals"
        : detailView === "finance"
          ? "Finance Requests"
          : "My Requests";
  const detailActiveLabel =
    detailView === "finance"
      ? "Finance Requests"
      : detailView === "approvals"
        ? "Approvals"
        : "Request Details";
  const detailMobileNav =
    detailView === "finance" ? buildAppMobileNav("Finance") : requestsMobileNav;
  const canSubmit =
    (requestActions ?? []).includes("submit") &&
    ["draft", "returned"].includes(workflowStatus);
  const canEditRequest = ["draft", "returned"].includes(workflowStatus);
  const roles = (user?.roles ?? []).map((entry) =>
    String(entry).trim().toLowerCase(),
  );
  const permissions = (user?.permissions ?? []).map((entry) =>
    String(entry).trim().toLowerCase(),
  );
  const availableActions = requestActions ?? [];
  const requestStatus = workflowStatus;
  const approvalActionsVisible =
    availableActions.includes("approve") ||
    availableActions.includes("reject") ||
    availableActions.includes("return");
  const financeActionsVisible = detailView === "finance";
  const ownerActionsVisible = detailView === "mine";
  const viewerStatus = useMemo(() => {
    if (!request)
      return { label: "Loading", hint: "", tone: "neutral" as const };
    if (approvalActionsVisible) {
      return {
        label: formatViewerRequestStatus(
          workflowStatus,
          availableActions,
          pendingApprovals[0]?.step,
        ),
        hint: financeActionsVisible
          ? "Finance is the current approver for this request. Clear it here for disbursement or the next finance step."
          : "You are the current approver for this step.",
        tone: "warning" as const,
      };
    }
    if (ownerActionsVisible && availableActions.includes("submit")) {
      return {
        label: formatViewerRequestStatus(
          workflowStatus,
          availableActions,
          pendingApprovals[0]?.step,
        ),
        hint: "You can still revise this before submission.",
        tone: "neutral" as const,
      };
    }
    if (financeActionsVisible && availableActions.includes("disburse")) {
      return {
        label: "Ready for Disbursement",
        hint: "Finance can now disburse the request and start voucher handling.",
        tone: "success" as const,
      };
    }
    if (ownerActionsVisible && availableActions.includes("confirm")) {
      return {
        label: formatViewerRequestStatus(
          workflowStatus,
          availableActions,
          pendingApprovals[0]?.step,
        ),
        hint: "Finance has disbursed this request. Confirm receipt here once the funds or voucher reach you.",
        tone: "warning" as const,
      };
    }
    if (ownerActionsVisible && availableActions.includes("retire")) {
      return {
        label: formatViewerRequestStatus(
          workflowStatus,
          availableActions,
          pendingApprovals[0]?.step,
        ),
        hint: "After spending the disbursed amount, submit retirement details and receipt support here.",
        tone: "warning" as const,
      };
    }
    if (financeActionsVisible && availableActions.includes("complete")) {
      return {
        label: formatViewerRequestStatus(
          workflowStatus,
          availableActions,
          pendingApprovals[0]?.step,
        ),
        hint: "Finance can verify the retirement and complete this request.",
        tone: "warning" as const,
      };
    }
    if (requestStatus === "approval") {
      const financeViewer =
        roles.some(
          (role) => role.includes("finance") || role === "accountant",
        ) || permissions.some((permission) => permission === "finance.approve");
      return {
        label: financeViewer ? "In Approval Workflow" : "In Review",
        hint: financeViewer
          ? "This request is progressing through the approval chain."
          : "Your request is currently under review.",
        tone: "warning" as const,
      };
    }
    if (requestStatus === "cleared") {
      return {
        label: "Ready for Disbursement",
        hint: "Finance can now prepare disbursement and voucher handling.",
        tone: "success" as const,
      };
    }
    return {
      label: formatViewerRequestStatus(
        workflowStatus,
        availableActions,
        pendingApprovals[0]?.step,
      ),
      hint: "This reflects the current workflow state for your view.",
      tone: statusTone,
    };
  }, [
    approvalActionsVisible,
    availableActions,
    financeActionsVisible,
    ownerActionsVisible,
    pendingApprovals,
    permissions,
    request,
    requestStatus,
    workflowStatus,
    roles,
    statusTone,
  ]);

  const financeProgress = useMemo(() => {
    if (!request) return { label: "", hint: "" };
    if (requestStatus === "cleared") {
      return {
        label: "Ready for Disbursement",
        hint: "Finance can release the first payment voucher or split the request across multiple vouchers.",
      };
    }
    if (requestStatus === "disbursed") {
      if (requestTotal > 0 && disbursedTotal < requestTotal) {
        return {
          label: "Partially Disbursed",
          hint: `${formatCurrency(remainingDisbursement, request.currency)} remains to be disbursed before requester confirmation.`,
        };
      }
      return {
        label: "Awaiting Confirmation",
        hint: "The disbursement is complete. The requester should confirm receipt before retirement.",
      };
    }
    if (requestStatus === "confirmed") {
      return {
        label: "Awaiting Retirement",
        hint: "The requester has confirmed receipt. Retirement support can now be submitted.",
      };
    }
    if (requestStatus === "retired") {
      return {
        label: "Awaiting Verification",
        hint: "Finance should verify the retirement records before the request can close.",
      };
    }
    if (requestStatus === "completed") {
      return {
        label: "Completed",
        hint: "The finance workflow has been fully closed.",
      };
    }
    return { label: "", hint: "" };
  }, [
    disbursedTotal,
    remainingDisbursement,
    request,
    requestStatus,
    requestTotal,
  ]);

  const disbursementButtonLabel =
    requestStatus === "disbursed" &&
      requestTotal > 0 &&
      disbursedTotal < requestTotal
      ? "Disburse More"
      : "Disburse Request";

  useEffect(() => {
    if (!showDisburseDialog) return;
    if (disburseMode !== "create") return;
    if (disburseForm.paid_from_account_id || !defaultFinanceAccountId) return;

    setDisburseForm((current) => ({
      ...current,
      paid_from_account_id: defaultFinanceAccountId,
    }));
  }, [
    defaultFinanceAccountId,
    disburseForm.paid_from_account_id,
    disburseMode,
    showDisburseDialog,
  ]);

  const retireableVoucher = useMemo(
    () =>
      (paymentVouchers ?? []).find(
        (voucher) => Number(voucher.voucher_balance || 0) > 0,
      ) ||
      (paymentVouchers ?? [])[0] ||
      null,
    [paymentVouchers],
  );
  const selectedRetirementVoucher = useMemo(
    () =>
      (paymentVouchers ?? []).find(
        (voucher) => voucher.id === retireForm.voucher_id,
      ) || null,
    [paymentVouchers, retireForm.voucher_id],
  );
  const retirementAmountValue = Number(retireForm.retired_amount || 0);
  const retirementShortfall = selectedRetirementVoucher
    ? Math.max(0, Number(selectedRetirementVoucher.amount || 0) - retirementAmountValue)
    : 0;
  const canShowNudge =
    !availableActions.length &&
    Boolean(request) &&
    !["completed", "cancelled", "rejected"].includes(requestStatus);
  const nudgeHeadline = pendingApprovals[0]?.step
    ? `Waiting on ${pendingApprovals[0].step}`
    : "Request waiting on review";
  const nudgeMessage = useMemo(() => {
    if (!request) return "";
    const requestLabel = request.request_number || `Request #${request.id}`;
    const link =
      typeof window !== "undefined"
        ? detailView === "finance"
          ? `${window.location.origin}/finance/requests/details?id=${request.id}`
          : `${window.location.origin}/requests/details?id=${request.id}&view=${detailView}`
        : "";
    return [
      `Hi, please take a look at ${requestLabel}.`,
      link ? `Open: ${link}` : "",
      `Current status: ${formatViewerRequestStatus(request.status, availableActions, pendingApprovals[0]?.step)}`,
    ]
      .filter(Boolean)
      .join("\n");
  }, [availableActions, detailView, pendingApprovals, request]);

  function openVoucherEditor(voucher: FinancePaymentVoucherRecord) {
    setDisburseMode("edit");
    setEditingVoucherId(voucher.id);
    setDisburseFiles(
      voucher.evidence_files?.map((file) => ({
        id: file.id,
        file_name: file.file_name,
      })) ?? [],
    );
    setDisburseForm((current) => ({
      ...current,
      amount: String(voucher.amount ?? ""),
      method: voucher.method || current.method,
      transaction_ref: voucher.transaction_ref || current.transaction_ref,
      paid_from_account_id:
        voucher.paid_from_account?.id || current.paid_from_account_id,
      note: voucher.note || current.note,
      disbursed_at: voucher.disbursed_at
        ? String(voucher.disbursed_at).slice(0, 10)
        : current.disbursed_at,
    }));
    setShowDisbursementMediaPicker(false);
    setShowDisburseDialog(true);
  }

  function canEditVoucher(voucher: FinancePaymentVoucherRecord) {
    const hasRetirement =
      Number(voucher.retired_amount || 0) > 0 || Boolean(voucher.retired_at);
    return financeActionsVisible && !hasRetirement;
  }

  function openVoucherPreview(voucher: FinancePaymentVoucherRecord) {
    setPreviewVoucher(voucher);
    setShowVoucherPreviewDialog(true);
  }

  function openVoucherEvidence(file: {
    id: string;
    file_name: string;
    mime_type: string | null;
    public_url: string | null;
  }) {
    if (!file.public_url) {
      showToast({
        tone: "warning",
        title: "File unavailable",
        message: "This file has no preview URL yet.",
      });
      return;
    }
    setVoucherFilePreview({
      name: file.file_name,
      url: file.public_url,
      mime_type: file.mime_type,
    });
  }

  function openRetireDialog(voucher?: FinancePaymentVoucherRecord | null) {
    setRetireForm((current) => ({
      ...current,
      voucher_id: voucher?.id || retireableVoucher?.id || current.voucher_id,
      retired_amount:
        voucher || retireableVoucher
          ? String(
            voucher?.voucher_balance ||
            voucher?.amount ||
            retireableVoucher?.voucher_balance ||
            retireableVoucher?.amount ||
            "",
          )
          : current.retired_amount,
      refund_amount: "",
      refund_method: "bank_transfer",
      refund_reference: "",
      refund_date: new Date().toISOString().slice(0, 10),
    }));
    setShowCertificateHonorForm(false);
    setShowRetireDialog(true);
  }

  function closeDisburseDialog() {
    setShowDisburseDialog(false);
    setDisburseMode("create");
    setEditingVoucherId("");
  }

  async function handleDownloadArtifact(
    action: "request_pdf" | "full_document" | "pv_pdf",
    voucherId?: string,
  ) {
    if (!id) return;
    const busyKey =
      action === "request_pdf"
        ? "download_request_pdf"
        : action === "full_document"
          ? "download_full_document"
          : `download_pv:${voucherId || "default"}`;
    try {
      setActionBusy(busyKey);
      const file = await downloadRequestArtifact(id, {
        action,
        voucher_id: voucherId,
      });
      downloadBase64File(file.file_name, file.mime_type, file.content_base64);
      showToast({
        title: "Download ready",
        message:
          action === "request_pdf"
            ? "The request PDF has been downloaded."
            : action === "full_document"
              ? "The full request document has been downloaded."
              : "The payment voucher has been downloaded.",
        tone: "success",
      });
    } catch (error) {
      showToast({
        title: "Download failed",
        message:
          error instanceof Error
            ? error.message
            : "We couldn't generate that download right now.",
        tone: "danger",
      });
    } finally {
      setActionBusy("");
    }
  }

  async function handleDeleteDraft() {
    if (!id) return;
    const shouldDelete =
      typeof window === "undefined"
        ? false
        : window.confirm("Delete this draft request? This cannot be undone.");
    if (!shouldDelete) return;
    try {
      setActionBusy("delete");
      await deleteRequest(id);
      cacheStore.invalidateCache("requests:list:mine");
      cacheStore.invalidateCache(`requests:detail:${id}`);
      cacheStore.invalidateCache(`requests:actions:${id}`);
      showToast({
        title: "Draft deleted",
        message: "The request draft has been removed.",
        tone: "success",
      });
      navigate(parentPath, { replace: true });
    } catch (error) {
      showToast({
        title: "Delete failed",
        message:
          error instanceof Error
            ? error.message
            : "We couldn't delete the draft right now.",
        tone: "danger",
      });
    } finally {
      setActionBusy("");
    }
  }

  const summaryCards = useMemo(() => {
    if (!request) return [];
    if (family === "leave") {
      return [
        {
          label: "Leave Dates",
          value: `${formatDisplayDate(String(requestData.start_date || ""))} - ${formatDisplayDate(String(requestData.end_date || ""))}`,
          tone: "neutral" as const,
        },
        {
          label: "Days Requested",
          value: String(requestData.days_requested || "-"),
          tone: "warning" as const,
        },
        {
          label: "Organization",
          value: organizationName,
          tone: "neutral" as const,
        },
      ];
    }

    return [
      {
        label: "Total Amount",
        value: formatCurrency(request.total_amount, request.currency),
        tone: "neutral" as const,
      },
      {
        label: "Due Date",
        value: formatDisplayDate(String(requestData.due_date || "")),
        tone: "neutral" as const,
      },
      {
        label: "Current Step",
        value:
          pendingApprovals[0]?.step ||
          formatViewerRequestStatus(request.status, availableActions),
        tone: "neutral" as const,
      },
    ];
  }, [
    availableActions,
    family,
    organizationName,
    pendingApprovals,
    request,
    requestData,
  ]);

  const activityItems = useMemo(() => {
    type ActivityItem = {
      title: string;
      description: string;
      time: string;
      tone: "neutral" | "success" | "warning" | "pending" | "danger";
      icon: string;
    };

    const created: ActivityItem[] =
      detailView === "mine" && request?.created_at
        ? [
          {
            title: "Request created",
            description: "The request was saved into the workflow.",
            time: formatDisplayDate(request.created_at),
            tone: "neutral",
            icon: "add_task",
          },
        ]
        : [];

    const done: ActivityItem[] = completedApprovals.map((entry) => ({
      title: `${entry.step} ${entry.action}`,
      description: entry.comment || "Workflow action completed.",
      time: formatDisplayDate(entry.at),
      tone: entry.action === "reject" ? "danger" : "success",
      icon: entry.action === "reject" ? "cancel" : "task_alt",
    }));

    const pending: ActivityItem[] = pendingApprovals.map((entry) => ({
      title: `${entry.step} pending`,
      description: `Waiting on ${entry.approver_type.replaceAll("_", " ")} action.`,
      time: "Pending",
      tone: "pending",
      icon: "schedule",
    }));

    const stateEvents = Array.isArray(request?.data?.state_events)
      ? request.data.state_events
      : [];

    const stateActivity: ActivityItem[] = stateEvents
      .filter((event: Record<string, unknown>) =>
        [
          "disburse",
          "retire",
          "retire_partial",
          "confirm",
          "complete",
        ].includes(String(event.action || "").toLowerCase()),
      )
      .map((event: Record<string, unknown>) => {
        const action = String(event.action || "").toLowerCase();
        const to = String(event.to || "").toLowerCase();
        return {
          title:
            action === "disburse"
              ? "Request disbursed"
              : action === "confirm"
                ? "Receipt confirmed"
                : action === "complete"
                  ? "Request completed"
                  : "Retirement updated",
          description: String(event.comment || "Workflow state updated."),
          time: formatDisplayDate(String(event.at || "")),
          tone:
            to === "disbursed" || to === "completed" ? "success" : "warning",
          icon:
            action === "disburse"
              ? "payments"
              : action === "confirm"
                ? "task_alt"
                : action === "complete"
                  ? "verified"
                  : "receipt_long",
        };
      });

    const voucherActivity: ActivityItem[] = (paymentVouchers ?? []).flatMap(
      (voucher) => {
        const items: ActivityItem[] = [
          {
            title: `${voucher.voucher_number} disbursed`,
            description: [
              formatCurrency(voucher.amount, request?.currency),
              voucher.method
                ? `via ${formatRequestStatus(voucher.method)}`
                : null,
              voucher.note || null,
            ]
              .filter(Boolean)
              .join(" • "),
            time: formatDisplayDate(voucher.disbursed_at),
            tone: "success",
            icon: "payments",
          },
        ];
        if (voucher.retired_at) {
          items.push({
            title: `${voucher.voucher_number} retired`,
            description:
              voucher.retired_amount > 0
                ? `Retired ${formatCurrency(voucher.retired_amount, request?.currency)}`
                : "Retirement submitted.",
            time: formatDisplayDate(voucher.retired_at),
            tone:
              voucher.retirement_status === "verified" ? "success" : "warning",
            icon:
              voucher.retirement_status === "verified"
                ? "verified"
                : "receipt_long",
          });
        }
        if (voucher.verified_at) {
          items.push({
            title: `${voucher.voucher_number} verified`,
            description:
              "Finance verified the retirement and closed the voucher.",
            time: formatDisplayDate(voucher.verified_at),
            tone: "success",
            icon: "task_alt",
          });
        }
        return items;
      },
    );

    return [
      ...created,
      ...done,
      ...pending.filter(
        (entry) =>
          !completedApprovals.some(
            (doneEntry) =>
              String(doneEntry.step || "")
                .trim()
                .toLowerCase() ===
              entry.title
                .replace(/ pending$/i, "")
                .trim()
                .toLowerCase(),
          ),
      ),
      ...stateActivity,
      ...voucherActivity,
    ];
  }, [
    completedApprovals,
    detailView,
    pendingApprovals,
    paymentVouchers,
    request?.created_at,
    request?.currency,
    request?.data,
  ]);

  async function handleWorkflowAction(
    action:
      | "submit"
      | "approve"
      | "reject"
      | "return"
      | "disburse"
      | "confirm"
      | "retire"
      | "complete",
  ) {
    if (!id) return;
    try {
      setActionBusy(action);
      if (action === "submit") {
        await submitRequest(id, actionComment.trim() || undefined);
      } else if (action === "approve") {
        await approveRequest(id, actionComment.trim() || undefined);
      } else if (action === "reject") {
        await rejectRequest(id, actionComment.trim() || undefined);
      } else if (action === "return") {
        const reason = actionComment.trim();
        if (!reason) {
          showToast({
            tone: "warning",
            title: "Return note required",
            message:
              "Please add a reason so the requester knows what to correct before resubmitting.",
          });
          return;
        }
        await returnRequest(id, reason);
      } else if (action === "disburse") {
        const traceId =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `trace_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        const disbursePayload = {
          amount: Number(disburseForm.amount || request?.total_amount || 0),
          method: disburseForm.method || undefined,
          transaction_ref: disburseForm.transaction_ref.trim() || undefined,
          paid_from_account_id: disburseForm.paid_from_account_id || undefined,
          note: disburseForm.note.trim() || undefined,
          disbursed_at: disburseForm.disbursed_at
            ? `${disburseForm.disbursed_at}T00:00:00.000Z`
            : undefined,
          evidence_file_id: disburseFiles[0]?.id,
          evidence_file_ids: disburseFiles.map((file) => file.id),
        };
        if (disburseMode === "edit" && editingVoucherId) {
          await financeApi.updatePaymentVoucher(
            id,
            editingVoucherId,
            disbursePayload,
          );
        } else {
          await disburseRequest(id, disbursePayload, { traceId });
        }
      } else if (action === "confirm") {
        await confirmRequest(id);
      } else if (action === "retire") {
        const selectedVoucher =
          (paymentVouchers ?? []).find(
            (voucher) => voucher.id === retireForm.voucher_id,
          ) || null;
        const retiredAmount = retireForm.retired_amount.trim()
          ? Number(retireForm.retired_amount)
          : undefined;
        const shortfall = selectedVoucher
          ? Math.max(0, Number(selectedVoucher.amount || 0) - Number(retiredAmount || 0))
          : 0;
        const refundAmount = retireForm.refund_amount.trim()
          ? Number(retireForm.refund_amount)
          : 0;
        const hasRefundDetails =
          refundAmount >= shortfall &&
          Boolean(retireForm.refund_method.trim()) &&
          Boolean(retireForm.refund_reference.trim());
        const hasRefundEvidence = retireForm.retirement_file_ids.length > 0;

        if (shortfall > 0 && !hasRefundDetails && !hasRefundEvidence) {
          showToast({
            title: "Refund evidence required",
            message:
              "You retired less than disbursed. Add refund details or upload refund evidence before submitting.",
            tone: "warning",
          });
          return;
        }

        await retireRequest(id, {
          voucher_id: retireForm.voucher_id || undefined,
          retired_amount: retiredAmount,
          notes: retireForm.notes.trim() || actionComment.trim() || undefined,
          retirement_file_ids: retireForm.retirement_file_ids.length
            ? retireForm.retirement_file_ids
            : undefined,
          breakdown:
            shortfall > 0
              ? {
                  refund: {
                    required_amount: shortfall,
                    refund_amount: refundAmount || undefined,
                    refund_method: retireForm.refund_method || undefined,
                    refund_reference:
                      retireForm.refund_reference.trim() || undefined,
                    refund_date: retireForm.refund_date || undefined,
                    evidence_file_ids: retireForm.retirement_file_ids,
                  },
                }
              : undefined,
        });
      } else if (action === "complete") {
        await completeRequest(id);
      }
      setActionComment("");
      setShowDisburseDialog(false);
      setShowRetireDialog(false);
      setDisburseMode("create");
      setEditingVoucherId("");
      setDisburseForm({
        amount: "",
        method: "bank_transfer",
        transaction_ref: "",
        paid_from_account_id: "",
        note: "",
        disbursed_at: new Date().toISOString().slice(0, 10),
      });
      setDisburseFiles([]);
      setRetireForm({
        voucher_id: "",
        retired_amount: "",
        notes: "",
        retirement_file_ids: [],
        refund_amount: "",
        refund_method: "bank_transfer",
        refund_reference: "",
        refund_date: new Date().toISOString().slice(0, 10),
      });
      setShowCertificateHonorForm(false);
      setRetirementCertificateForm({
        declaration:
          "I hereby certify that the disbursed funds referenced above were used for official purposes in line with the approved request.",
        reason:
          "No supporting receipt is available for the full amount because the expense was settled without a formal receipt or the receipt could not be obtained in time for retirement.",
      });
      [
        "requests:list:mine",
        "requests:list:approvals",
        "finance-admin:requests",
        "finance-vouchers:list",
        `requests:detail:${id}`,
        `requests:actions:${id}`,
        `requests:detail:payment-vouchers:${id}`,
      ].forEach((key) => cacheStore.invalidateCache(key));
      await Promise.allSettled([
        refetch(),
        refetchRequestActions(),
        refetchPaymentVouchers(),
      ]);
      showToast({
        title: "Request updated",
        message:
          action === "submit"
            ? "The request has been submitted into workflow."
            : action === "approve"
              ? financeActionsVisible
                ? "The request has been cleared for disbursement or the next finance step."
                : "Your approval has been recorded."
              : action === "reject"
                ? "Your rejection has been recorded."
                : action === "disburse"
                  ? disburseMode === "edit"
                    ? "The payment voucher has been updated."
                    : "The request has been marked as disbursed."
                  : action === "confirm"
                    ? "Receipt confirmation has been recorded."
                    : action === "retire"
                      ? "Retirement details have been submitted."
                      : "The request has been completed.",
        tone: "success",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "We couldn't complete that action just now.";
      const staleActionState = [
        "workflow instance is not active",
        "workflow instance not found",
        "request is not pending approval",
      ].some((snippet) => errorMessage.toLowerCase().includes(snippet));

      if (staleActionState && id) {
        [
          "requests:list:mine",
          "requests:list:approvals",
          "finance-admin:requests",
          "finance-vouchers:list",
          `requests:detail:${id}`,
          `requests:actions:${id}`,
          `requests:detail:payment-vouchers:${id}`,
        ].forEach((key) => cacheStore.invalidateCache(key));

        await Promise.allSettled([
          refetch(),
          refetchRequestActions(),
          refetchPaymentVouchers(),
        ]);

        showToast({
          title: "Request already updated",
          message:
            "The action was applied, and this view has been refreshed to show the latest status.",
          tone: "warning",
        });
        return;
      }

      showToast({
        title: "Action failed",
        message: errorMessage,
        tone: "danger",
      });
    } finally {
      setActionBusy("");
    }
  }

  async function copyNudge() {
    try {
      await navigator.clipboard.writeText(nudgeMessage);
      showToast({
        title: "Reminder copied",
        message: "You can paste the nudge into chat or email.",
        tone: "success",
      });
    } catch {
      showToast({
        title: "Copy failed",
        message: "We couldn't copy the reminder text right now.",
        tone: "danger",
      });
    }
  }

  if (!id) {
    return (
      <AppShell
        navigation={buildRequestsNavigation()}
        activeLabel="My Requests"
        user={{ name: "Alex Sterling", role: "Fleet Operations" }}
        mobileNav={requestsMobileNav}
      >
        <div className="shell-panel flex flex-col items-center justify-center gap-4 px-6 py-10 text-center">
          <EmptyState
            title="No request selected"
            description="Open a request from the list so we can show its details."
          />
          <Link
            to={parentPath}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10"
          >
            Back to {parentLabel}
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      navigation={buildRequestsNavigation({
        includeRequestDetails: detailView !== "finance",
        requestDetailsPath: `/requests/details?id=${id}&view=${detailView}`,
        requestDetailsParent: detailView === "finance" ? "finance" : "requests",
      })}
      activeLabel={detailActiveLabel}
      user={{ name: "Alex Sterling", role: "Fleet Operations" }}
      mobileNav={detailMobileNav}
    >
      <div className="hidden lg:block">
        <PageHeader
          breadcrumbs={
            detailView === "finance"
              ? [
                { label: "Finance", path: "/finance" },
                { label: parentLabel, path: parentPath },
                { label: request?.request_number || "Details" },
              ]
              : [
                { label: "Requests", path: parentPath },
                { label: parentLabel, path: parentPath },
                { label: request?.request_number || "Details" },
              ]
          }
          title={
            request?.request_number ||
            (loading ? "Loading request..." : "Request details")
          }
          description={
            request
              ? `${request?.request_type?.name || requestFamilyFromRecord(request)} • ${formatPersonName(request.creator)} • ${formatDisplayDate(request.created_at)}`
              : "Review the request details, activity, and next step."
          }
          actions={
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to={parentPath}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10"
              >
                <Icon name="arrow_back" className="text-[18px]" />
                Back to {parentLabel}
              </Link>
              {canEditRequest ? (
                <Link
                  to={`${family === "leave" ? "/leave/new/form" : "/requests/new/form"}?edit=${id}&typeId=${request?.request_type?.id || ""}`}
                  className="inline-flex items-center gap-2 rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10"
                >
                  <Icon name="edit" className="text-[18px]" />
                  {workflowStatus === "returned" ? "Edit Returned Request" : "Edit Draft"}
                </Link>
              ) : null}
            </div>
          }
        />

        {loading ? (
          <div className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">
            Loading request details...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-4 text-sm text-danger">
            {error}
          </div>
        ) : request ? (
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-8">
              <SectionCard
                title="Request Summary"
                action={
                  <Chip variant={viewerStatus.tone}>{viewerStatus.label}</Chip>
                }
              >
                <p className="max-w-3xl text-sm leading-7 text-slate-600">
                  {String(
                    requestData.purpose ||
                    requestData.leave_reason ||
                    "No summary provided.",
                  )}
                </p>
                {family !== "leave" ? (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {categoryName && categoryName !== "-" ? (
                      <Chip variant="neutral">Category: {categoryName}</Chip>
                    ) : null}
                    {requestTags.map((tag) => (
                      <Chip key={tag.id} variant="pending">
                        #{tag.label}
                      </Chip>
                    ))}
                  </div>
                ) : null}

                <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {summaryCards.map((card) => (
                    <StatCard
                      key={card.label}
                      label={card.label}
                      value={card.value}
                      tone={card.tone}
                    />
                  ))}
                </div>
              </SectionCard>

              {family !== "leave" ? (
                <SectionCard
                  title="Work Context"
                  description="The workstream and ownership context for this request."
                >
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <StatCard
                      label="Project"
                      value={projectName}
                      tone="neutral"
                    />
                    <StatCard label="Team" value={teamName} tone="neutral" />
                    <StatCard
                      label="Organization"
                      value={organizationName}
                      tone="neutral"
                    />
                  </div>
                </SectionCard>
              ) : null}

              {family === "leave" ? (
                <SectionCard
                  title="Leave Coverage"
                  description="Leave-specific dates and handover details."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <StatCard
                      label="Start Date"
                      value={formatDisplayDate(
                        String(requestData.start_date || ""),
                      )}
                      tone="neutral"
                    />
                    <StatCard
                      label="End Date"
                      value={formatDisplayDate(
                        String(requestData.end_date || ""),
                      )}
                      tone="neutral"
                    />
                    <StatCard
                      label="Days Requested"
                      value={String(requestData.days_requested || "-")}
                      tone="warning"
                    />
                    <StatCard
                      label="Handover Colleague"
                      value={handoverColleagueName}
                      tone="neutral"
                    />
                  </div>
                  <div className="mt-4 rounded-[18px] border border-slate-100 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                    Handover acknowledgement:
                    {" "}
                    {String(requestData.handover_ack_status || "Pending acknowledgement")}
                    . Team lead/workflow approvers make the leave decision.
                  </div>
                  <div className="mt-4 rounded-[18px] border border-slate-100 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                    {String(
                      requestData.handover_notes ||
                      "No handover notes captured.",
                    )}
                  </div>
                </SectionCard>
              ) : (
                <SectionCard
                  title="Request Items"
                  description="Itemized request costs and supporting notes."
                  action={
                    <Chip variant="neutral">
                      {lineItems.length} item{lineItems.length === 1 ? "" : "s"}
                    </Chip>
                  }
                >
                  {lineItems.length ? (
                    <div className="rounded-[22px] border border-slate-200 bg-white">
                      <Table caption="Request items">
                        <TableHead>
                          <TableHeaderRow>
                            <TableHeaderCell>Item</TableHeaderCell>
                            <TableHeaderCell>Qty</TableHeaderCell>
                            <TableHeaderCell>Unit Price</TableHeaderCell>
                            <TableHeaderCell>Total</TableHeaderCell>
                          </TableHeaderRow>
                        </TableHead>
                        <TableBody>
                          {lineItems.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold text-slate-950">
                                      {item.description || "Untitled item"}
                                    </p>
                                    {(item.files?.length ?? 0) > 0 ? (
                                      <span
                                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-900/10 text-brand-900"
                                        title={`${item.files?.length} attachment${item.files?.length === 1 ? "" : "s"}`}
                                      >
                                        <Icon
                                          name="attach_file"
                                          className="text-[16px]"
                                        />
                                      </span>
                                    ) : null}
                                  </div>
                                  <p className="mt-1 text-xs leading-5 text-slate-500">
                                    {item.notes || ""}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm font-semibold text-slate-700">
                                {item.quantity ?? 1}
                              </TableCell>
                              <TableCell className="text-sm font-semibold text-slate-700">
                                {formatCurrency(item.amount, request.currency)}
                              </TableCell>
                              <TableCell className="text-sm font-semibold text-slate-700">
                                {formatCurrency(
                                  (item.amount ?? 0) * (item.quantity ?? 1),
                                  request.currency,
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <EmptyState
                      title="No line items"
                      description="This request does not include any itemized costs."
                    />
                  )}
                </SectionCard>
              )}

              {family !== "leave" ? (
                <SectionCard
                  title="Disbursements (Payment Vouchers)"
                  description="Track what finance has paid, what remains, and what still needs confirmation or retirement."
                  action={
                    <Chip variant="neutral">
                      {formatCurrency(remainingDisbursement, request.currency)}
                    </Chip>
                  }
                >
                  {(paymentVouchers ?? []).length ? (
                    <div className="overflow-x-auto rounded-[22px] border border-slate-200 bg-white">
                      <Table caption="Payment vouchers">
                        <TableHead>
                          <TableHeaderRow>
                            <TableHeaderCell>PV</TableHeaderCell>
                            <TableHeaderCell>Amount</TableHeaderCell>
                            <TableHeaderCell>Retirement</TableHeaderCell>
                            <TableHeaderCell className="text-right">
                              Action
                            </TableHeaderCell>
                          </TableHeaderRow>
                        </TableHead>
                        <TableBody>
                          {(paymentVouchers ?? []).map((voucher) => (
                            <TableRow key={voucher.id}>
                              <TableCell>
                                <button
                                  type="button"
                                  className="text-left text-sm font-semibold text-brand-900 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10"
                                  onClick={() =>
                                    canEditVoucher(voucher)
                                      ? openVoucherEditor(voucher)
                                      : openVoucherPreview(voucher)
                                  }
                                >
                                  <span className="inline-flex items-center gap-2">
                                    {voucher.evidence_files?.length ? (
                                      <Icon
                                        name="attach_file"
                                        className="text-[15px] text-brand-900"
                                      />
                                    ) : null}
                                    <span>{voucher.voucher_number}</span>
                                  </span>
                                </button>
                                <div className="mt-1 text-xs text-slate-500">
                                  {formatDisplayDate(voucher.disbursed_at)}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm font-semibold text-slate-700">
                                {formatCurrency(
                                  voucher.amount,
                                  request.currency,
                                )}
                              </TableCell>
                              <TableCell className="text-sm font-semibold text-slate-700">
                                {Number(voucher.retired_amount || 0) > 0 ? (
                                  <button
                                    type="button"
                                    className="inline-flex items-center gap-2 text-left hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10"
                                    onClick={() => openVoucherPreview(voucher)}
                                  >
                                    <Icon
                                      name={
                                        voucher.retirement_status === "verified"
                                          ? "verified"
                                          : "receipt_long"
                                      }
                                      className="text-[18px] text-brand-900"
                                    />
                                    <span>
                                      {formatCurrency(
                                        voucher.retired_amount,
                                        request.currency,
                                      )}
                                      <span className="ml-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                        {formatRequestStatus(
                                          voucher.retirement_status,
                                        )}
                                      </span>
                                    </span>
                                  </button>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="inline-flex flex-wrap justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() =>
                                      canEditVoucher(voucher)
                                        ? openVoucherEditor(voucher)
                                        : openVoucherPreview(voucher)
                                    }
                                  >
                                    {canEditVoucher(voucher)
                                      ? "View / Edit"
                                      : "View"}
                                  </Button>
                                  {ownerActionsVisible &&
                                    availableActions.includes("retire") &&
                                    Number(voucher.voucher_balance || 0) > 0 &&
                                    Number(voucher.retired_amount || 0) <= 0 ? (
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => openRetireDialog(voucher)}
                                      disabled={actionBusy !== ""}
                                    >
                                      Retire
                                    </Button>
                                  ) : null}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <EmptyState
                      title="No payment vouchers yet"
                      description="Once finance disburses, payment vouchers will appear here."
                    />
                  )}
                </SectionCard>
              ) : null}

              <SectionCard title="Supporting Documents">
                {documents.length ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {documents.map((doc) => (
                      <article
                        key={doc.id}
                        className="flex items-start gap-3 rounded-[18px] border border-slate-100 bg-slate-50 px-4 py-4"
                      >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-900/10 text-brand-900">
                          <Icon name="description" className="text-[20px]" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-950">
                            {doc.file_name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {doc.mime_type || "Document"}
                          </p>
                        </div>
                        {doc.public_url ? (
                          <a
                            href={doc.public_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex"
                          >
                            <Button variant="secondary" size="sm">
                              Open
                            </Button>
                          </a>
                        ) : null}
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No supporting documents"
                    description="No files are attached to this request yet."
                  />
                )}
              </SectionCard>

              <SectionCard title="Activity">
                <ActivityFeed
                  items={activityItems}
                  emptyState="No activity recorded for this request yet."
                  limit={3}
                />
              </SectionCard>
            </div>

            <RightRail className="lg:col-span-4">
              <section className="section-card bg-brand-900 p-5 text-white">
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-white/70">
                  {family === "leave" ? "Request Type" : "Current Total"}
                </p>
                {family === "leave" ? (
                  <h3 className="mt-3 text-[1.65rem] font-semibold tracking-tight">
                    {request.request_type?.name || requestFamilyFromRecord(request)}
                  </h3>
                ) : (
                  <div className="mt-3 flex items-baseline gap-2">
                    <h3 className="text-[1.65rem] font-semibold tracking-tight">
                      {formatCurrency(request.total_amount, request.currency)}
                    </h3>
                    {disbursedTotal > 0 ? (
                      <span className="text-xs font-bold uppercase tracking-[0.12em] text-white/60">
                        / {formatCurrency(disbursedTotal, request.currency)} disbursed
                      </span>
                    ) : null}
                  </div>
                )}
                <p className="mt-3 text-sm leading-6 text-white/85">
                  {family === "leave"
                    ? "This request follows the leave workflow and approval sequence."
                    : "This total is calculated from the submitted request items and their supporting attachments."}
                </p>
              </section>

              <section className="section-card bg-brand-900 p-5 text-white">
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-white/70">
                  Status For You
                </p>
                <h3 className="mt-3 text-sm font-semibold uppercase tracking-[0.08em] text-white/70">
                  {viewerStatus.label}
                </h3>
                <p className="mt-2 text-sm leading-6 text-white/85">
                  {viewerStatus.hint}
                </p>
                {financeActionsVisible && financeProgress.label ? (
                  <div className="mt-4 rounded-[18px] bg-white/10 px-4 py-3">
                    <div className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-white/60">
                      Finance Progress
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {financeProgress.label}
                    </div>
                    <div className="mt-1 text-sm leading-6 text-white/75">
                      {financeProgress.hint}
                    </div>
                  </div>
                ) : null}
                {approvalActionsVisible &&
                  availableActions.some((action) =>
                    ["approve", "reject", "return"].includes(action),
                  ) ? (
                  <div className="mt-4 space-y-3">
                    <TextAreaField
                      label="Decision note"
                      helpText={
                        availableActions.includes("return")
                          ? "Required for Return. Optional for Approve/Reject."
                          : "Optional context for the requester and audit trail."
                      }
                      value={actionComment}
                      onChange={(event) => setActionComment(event.target.value)}
                      rows={3}
                      className="border-white/20 bg-white/10 text-white placeholder:text-white/50"
                    />
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Button
                        variant="secondary"
                        className="w-full justify-center"
                        onClick={() => void handleWorkflowAction("approve")}
                        disabled={actionBusy !== ""}
                      >
                        {actionBusy === "approve"
                          ? financeActionsVisible
                            ? "Clearing..."
                            : "Approving..."
                          : financeActionsVisible
                            ? "Clear Request"
                            : "Approve "}
                      </Button>
                      <Button
                        variant="danger"
                        className="w-full justify-center"
                        onClick={() => void handleWorkflowAction("reject")}
                        disabled={actionBusy !== ""}
                      >
                        {actionBusy === "reject" ? "Rejecting..." : "Reject "}
                      </Button>
                      {availableActions.includes("return") ? (
                        <Button
                          variant="secondary"
                          className="w-full justify-center"
                          onClick={() => void handleWorkflowAction("return")}
                          disabled={actionBusy !== ""}
                        >
                          {actionBusy === "return"
                            ? "Returning..."
                            : "Return for Edit"}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ) : null}
                {ownerActionsVisible && canSubmit ? (
                  <Button
                    variant="secondary"
                    className="mt-4 w-full justify-center"
                    onClick={() => void handleWorkflowAction("submit")}
                    disabled={actionBusy !== ""}
                  >
                    {actionBusy === "submit"
                      ? "Submitting..."
                      : workflowStatus === "returned"
                        ? "Resubmit Request"
                        : "Submit Request"}
                  </Button>
                ) : null}
                {financeActionsVisible &&
                  (requestStatus === "cleared" ||
                    (requestStatus === "disbursed" &&
                      requestTotal > disbursedTotal)) ? (
                  <Button
                    variant="secondary"
                    className="mt-4 w-full justify-center"
                    onClick={() => setShowDisburseDialog(true)}
                    disabled={actionBusy !== ""}
                  >
                    {actionBusy === "disburse"
                      ? "Disbursing..."
                      : disbursementButtonLabel}
                  </Button>
                ) : null}
                {ownerActionsVisible && availableActions.includes("confirm") ? (
                  <Button
                    variant="secondary"
                    className="mt-4 w-full justify-center"
                    onClick={() => void handleWorkflowAction("confirm")}
                    disabled={actionBusy !== ""}
                  >
                    {actionBusy === "confirm"
                      ? "Confirming..."
                      : "Confirm Receipt"}
                  </Button>
                ) : null}
                {ownerActionsVisible && availableActions.includes("retire") ? (
                  <Button
                    variant="secondary"
                    className="mt-4 w-full justify-center"
                    onClick={() => openRetireDialog()}
                    disabled={actionBusy !== ""}
                  >
                    {actionBusy === "retire" ? "Preparing..." : "Retire"}
                  </Button>
                ) : null}
                {financeActionsVisible &&
                  availableActions.includes("complete") ? (
                  <Button
                    variant="secondary"
                    className="mt-4 w-full justify-center"
                    onClick={() => void handleWorkflowAction("complete")}
                    disabled={actionBusy !== ""}
                  >
                    {actionBusy === "complete"
                      ? "Completing..."
                      : "Complete Request"}
                  </Button>
                ) : null}
              </section>

              <SectionCard title="Downloads & Draft">
                <div className="space-y-3">
                  <DownloadDropdown
                    actionBusy={actionBusy}
                    onDownloadRequestPdf={() =>
                      void handleDownloadArtifact("request_pdf")
                    }
                    onDownloadFullDocument={() =>
                      void handleDownloadArtifact("full_document")
                    }
                    includeFullDocument={family !== "leave"}
                  />
                  {workflowStatus === "draft" ? (
                    <Button
                      variant="danger"
                      className="w-full justify-center"
                      onClick={() => void handleDeleteDraft()}
                      disabled={actionBusy !== ""}
                    >
                      {actionBusy === "delete" ? "Deleting..." : "Delete Draft"}
                    </Button>
                  ) : null}
                </div>
              </SectionCard>

              {canShowNudge ? (
                <section className="section-card p-5">
                  <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-slate-500">
                    Need a nudge?
                  </p>
                  <h3 className="mt-3 text-sm font-semibold text-slate-950">
                    {nudgeHeadline}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    You do not have an action right now, but you can still
                    remind the next reviewer to move this forward.
                  </p>
                  <div className="mt-4 rounded-[18px] bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    {viewerStatus.hint}
                  </div>
                  <Button
                    className="mt-4 w-full justify-center"
                    variant="secondary"
                    onClick={() => void copyNudge()}
                  >
                    Copy reminder
                  </Button>
                </section>
              ) : null}

              <SectionCard title="Approval Workflow">
                <WorkflowStepper steps={workflow} />
              </SectionCard>
            </RightRail>
          </div>
        ) : null}
      </div>

      <div className="space-y-4 lg:hidden">
        <div className="pt-1">
          <button
            type="button"
            onClick={() => navigate(parentPath)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10"
          >
            <Icon name="arrow_back" className="text-[16px]" />
            Back to {parentLabel}
          </button>

          <div className="mt-3 flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-slate-500">
                {parentLabel}
              </p>
              <h1 className="page-title mt-2 text-[clamp(1.7rem,7vw,2.2rem)]">
                {request?.request_number || "Request details"}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                {request
                  ? `${request.request_type?.name || requestFamilyFromRecord(request)} • ${formatPersonName(request.creator)} • ${formatDisplayDate(request.created_at)}`
                  : "Loading..."}
              </p>
            </div>
            {request ? (
              <Chip variant={viewerStatus.tone}>{viewerStatus.label}</Chip>
            ) : null}
          </div>
        </div>

        {request ? (
          <>
            <section className="section-card bg-brand-900 p-5 text-white">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-white/70">
                Status For You
              </p>
              <h2 className="mt-3 text-base font-semibold uppercase tracking-[0.08em] text-white/70">
                {viewerStatus.label}
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/85">
                {viewerStatus.hint}
              </p>
            </section>

            <SectionCard title="Summary">
              <p className="text-sm leading-6 text-slate-600">
                {String(
                  requestData.purpose ||
                  requestData.leave_reason ||
                  "No summary provided.",
                )}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {summaryCards.map((card) => (
                  <StatCard
                    key={card.label}
                    label={card.label}
                    value={card.value}
                    tone={card.tone}
                  />
                ))}
              </div>
            </SectionCard>

            {family !== "leave" ? (
              <SectionCard title="Request Items">
                {lineItems.length ? (
                  <div className="rounded-[22px] border border-slate-200 bg-white">
                    <Table caption="Request items">
                      <TableHead>
                        <TableHeaderRow>
                          <TableHeaderCell>Item</TableHeaderCell>
                          <TableHeaderCell>Qty</TableHeaderCell>
                          <TableHeaderCell>Total</TableHeaderCell>
                        </TableHeaderRow>
                      </TableHead>
                      <TableBody>
                        {lineItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold text-slate-950">
                                    {item.description || "Untitled item"}
                                  </p>
                                  {(item.files?.length ?? 0) > 0 ? (
                                    <Icon
                                      name="attach_file"
                                      className="text-[15px] text-brand-900"
                                    />
                                  ) : null}
                                </div>
                                {item.notes ? (
                                  <p className="mt-1 text-xs leading-5 text-slate-500">
                                    {item.notes}
                                  </p>
                                ) : null}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm font-semibold text-slate-700">
                              {item.quantity ?? 1}
                            </TableCell>
                            <TableCell className="text-sm font-semibold text-slate-700">
                              {formatCurrency(
                                (item.amount ?? 0) * (item.quantity ?? 1),
                                request.currency,
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <EmptyState
                    title="No line items"
                    description="This request does not include any itemized costs."
                  />
                )}
              </SectionCard>
            ) : null}

            {(paymentVouchers ?? []).length ? (
              <SectionCard title="Payment Vouchers">
                <div className="rounded-[22px] border border-slate-200 bg-white">
                  <Table caption="Payment vouchers">
                    <TableHead>
                      <TableHeaderRow>
                        <TableHeaderCell>PV</TableHeaderCell>
                        <TableHeaderCell>Amount</TableHeaderCell>
                        <TableHeaderCell>Retirement</TableHeaderCell>
                      </TableHeaderRow>
                    </TableHead>
                    <TableBody>
                      {(paymentVouchers ?? []).map((voucher) => (
                        <TableRow key={voucher.id}>
                          <TableCell>
                            <button
                              type="button"
                              className="text-left text-sm font-semibold text-brand-900 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10"
                              onClick={() => openVoucherPreview(voucher)}
                            >
                              {voucher.voucher_number}
                            </button>
                          </TableCell>
                          <TableCell className="text-sm text-slate-700">
                            {formatCurrency(voucher.amount, request.currency)}
                          </TableCell>
                          <TableCell className="text-sm text-slate-700">
                            {Number(voucher.retired_amount || 0) > 0
                              ? (
                                <button
                                  type="button"
                                  className="font-semibold text-brand-900 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10"
                                  onClick={() => openVoucherPreview(voucher)}
                                >
                                  {formatCurrency(
                                    voucher.retired_amount,
                                    request.currency,
                                  )}
                                </button>
                              )
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </SectionCard>
            ) : null}

            <SectionCard title="Approval Workflow">
              <WorkflowStepper steps={workflow} />
            </SectionCard>

            <SectionCard title="Actions">
              <DownloadDropdown
                actionBusy={actionBusy}
                onDownloadRequestPdf={() =>
                  void handleDownloadArtifact("request_pdf")
                }
                onDownloadFullDocument={() =>
                  void handleDownloadArtifact("full_document")
                }
                includeFullDocument={family !== "leave"}
              />
              {workflowStatus === "draft" ? (
                <Button
                  variant="danger"
                  className="mb-4 w-full justify-center"
                  onClick={() => void handleDeleteDraft()}
                  disabled={actionBusy !== ""}
                >
                  {actionBusy === "delete" ? "Deleting..." : "Delete Draft"}
                </Button>
              ) : null}
              {approvalActionsVisible &&
                availableActions.some(
                  (action) =>
                    action === "approve" ||
                    action === "reject" ||
                    action === "return",
                ) ? (
                <>
                  <TextAreaField
                    label="Decision note"
                    helpText={
                      availableActions.includes("return")
                        ? "Required for Return. Optional for Approve/Reject."
                        : "Optional context for the requester and audit trail."
                    }
                    value={actionComment}
                    onChange={(event) => setActionComment(event.target.value)}
                    rows={3}
                  />
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <Button
                      variant="secondary"
                      className="w-full justify-center"
                      onClick={() => void handleWorkflowAction("approve")}
                      disabled={actionBusy !== ""}
                    >
                      {actionBusy === "approve"
                        ? financeActionsVisible
                          ? "Clearing..."
                          : "Approving..."
                        : financeActionsVisible
                          ? "Clear Request"
                          : "Approve Request"}
                    </Button>
                    <Button
                      variant="danger"
                      className="w-full justify-center"
                      onClick={() => void handleWorkflowAction("reject")}
                      disabled={actionBusy !== ""}
                    >
                      {actionBusy === "reject"
                        ? "Rejecting..."
                        : "Reject Request"}
                    </Button>
                    {availableActions.includes("return") ? (
                      <Button
                        variant="secondary"
                        className="w-full justify-center"
                        onClick={() => void handleWorkflowAction("return")}
                        disabled={actionBusy !== ""}
                      >
                        {actionBusy === "return"
                          ? "Returning..."
                          : "Return for Edit"}
                      </Button>
                    ) : null}
                  </div>
                </>
              ) : null}
              {ownerActionsVisible && availableActions.includes("submit") ? (
                <Button
                  className="mt-4 w-full justify-center"
                  onClick={() => void handleWorkflowAction("submit")}
                  disabled={actionBusy !== ""}
                >
                  {actionBusy === "submit"
                    ? "Submitting..."
                    : workflowStatus === "returned"
                      ? "Resubmit Request"
                      : "Submit Request"}
                </Button>
              ) : null}
              {financeActionsVisible &&
                (requestStatus === "cleared" ||
                  (requestStatus === "disbursed" &&
                    requestTotal > disbursedTotal)) ? (
                <Button
                  variant="secondary"
                  className="mt-4 w-full justify-center"
                  onClick={() => setShowDisburseDialog(true)}
                  disabled={actionBusy !== ""}
                >
                  {actionBusy === "disburse"
                    ? "Disbursing..."
                    : disbursementButtonLabel}
                </Button>
              ) : null}
              {ownerActionsVisible && availableActions.includes("confirm") ? (
                <Button
                  variant="secondary"
                  className="mt-4 w-full justify-center"
                  onClick={() => void handleWorkflowAction("confirm")}
                  disabled={actionBusy !== ""}
                >
                  {actionBusy === "confirm"
                    ? "Confirming..."
                    : "Confirm Receipt"}
                </Button>
              ) : null}
              {ownerActionsVisible && availableActions.includes("retire") ? (
                <Button
                  variant="secondary"
                  className="mt-4 w-full justify-center"
                  onClick={() => openRetireDialog()}
                  disabled={actionBusy !== ""}
                >
                  {actionBusy === "retire" ? "Preparing..." : "Retire PV"}
                </Button>
              ) : null}
              {financeActionsVisible &&
                availableActions.includes("complete") ? (
                <Button
                  variant="secondary"
                  className="mt-4 w-full justify-center"
                  onClick={() => void handleWorkflowAction("complete")}
                  disabled={actionBusy !== ""}
                >
                  {actionBusy === "complete"
                    ? "Completing..."
                    : "Complete Request"}
                </Button>
              ) : null}
            </SectionCard>

            {canShowNudge ? (
              <SectionCard title="Need a nudge?">
                <p className="text-sm leading-6 text-slate-600">
                  {nudgeHeadline}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  You do not have an action right now, but you can still remind
                  the next reviewer to move this forward.
                </p>
                <div className="mt-4 rounded-[18px] bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {viewerStatus.hint}
                </div>
                <Button
                  className="mt-4 w-full justify-center"
                  variant="secondary"
                  onClick={() => void copyNudge()}
                >
                  Copy reminder
                </Button>
              </SectionCard>
            ) : null}

            <SectionCard title="Activity">
              <ActivityFeed
                items={activityItems}
                emptyState="No activity recorded yet."
                limit={3}
              />
            </SectionCard>
          </>
        ) : null}
      </div>

      {showDisburseDialog ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 px-4">
          <button
            type="button"
            aria-label="Close disbursement dialog"
            className="absolute inset-0"
            onClick={() => closeDisburseDialog()}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="disburse-request-title"
            className="relative z-[81] flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-card"
          >
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-slate-500">
                    Finance Action
                  </p>
                  <h2
                    id="disburse-request-title"
                    className="mt-2 text-2xl font-semibold tracking-tight text-slate-950"
                  >
                    {disburseMode === "edit"
                      ? "Edit Payment Voucher"
                      : "Disburse Request"}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {disburseMode === "edit"
                      ? "Update the existing payment voucher without creating a new disbursement."
                      : "Capture the disbursement record, finance account, transaction reference, and supporting evidence."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => closeDisburseDialog()}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200"
                >
                  <Icon name="close" />
                </button>
              </div>
              {financeProgress.label ? (
                <div className="mt-4 rounded-[18px] border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900">
                  <div className="font-semibold">{financeProgress.label}</div>
                  <div className="mt-1 text-brand-900/75">
                    {financeProgress.hint}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label="Amount"
                  type="number"
                  min="0"
                  value={disburseForm.amount}
                  onChange={(event) =>
                    setDisburseForm((current) => ({
                      ...current,
                      amount: event.target.value,
                    }))
                  }
                  placeholder={String(request?.total_amount ?? "")}
                />
                <SelectField
                  label="Method"
                  value={disburseForm.method}
                  onChange={(event) =>
                    setDisburseForm((current) => ({
                      ...current,
                      method: event.target.value,
                    }))
                  }
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="cheque">Cheque</option>
                  <option value="other">Other</option>
                </SelectField>
                <TextField
                  label="Transaction Reference"
                  value={disburseForm.transaction_ref}
                  onChange={(event) =>
                    setDisburseForm((current) => ({
                      ...current,
                      transaction_ref: event.target.value,
                    }))
                  }
                  placeholder="Bank reference / voucher ref"
                />
                <TextField
                  label="Disbursement Date"
                  type="date"
                  value={disburseForm.disbursed_at}
                  onChange={(event) =>
                    setDisburseForm((current) => ({
                      ...current,
                      disbursed_at: event.target.value,
                    }))
                  }
                />
                <SelectField
                  label="Paid From Account"
                  value={disburseForm.paid_from_account_id}
                  onChange={(event) =>
                    setDisburseForm((current) => ({
                      ...current,
                      paid_from_account_id: event.target.value,
                    }))
                  }
                >
                  <option value="">Select finance account</option>
                  {(financeAccounts ?? []).map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                      {account.code ? ` (${account.code})` : ""}
                    </option>
                  ))}
                </SelectField>
                {!financeAccounts?.length ? (
                  <p className="mt-1 text-xs text-amber-700">
                    No active finance account is available. Disbursement cannot
                    continue until one is configured.
                  </p>
                ) : null}
              </div>

              <div className="mt-4">
                <TextAreaField
                  label="Disbursement Note"
                  helpText="Optional context for the payment voucher and finance trail."
                  value={disburseForm.note}
                  onChange={(event) =>
                    setDisburseForm((current) => ({
                      ...current,
                      note: event.target.value,
                    }))
                  }
                  rows={4}
                />
              </div>

              <div className="mt-4 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      Evidence Upload
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Attach transfer proof, voucher support, or any
                      disbursement evidence.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => setShowDisbursementMediaPicker(true)}
                  >
                    {disburseFiles.length
                      ? "Change Evidence Files"
                      : "Pick Evidence Files"}
                  </Button>
                </div>
                {disburseFiles.length ? (
                  <div className="mt-3 space-y-2">
                    {disburseFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm text-slate-700"
                      >
                        <Icon
                          name="attach_file"
                          className="text-[16px] text-brand-900"
                        />
                        <span className="flex-1 truncate">
                          {file.file_name}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-slate-500">
                    You can select existing uploads or add new evidence here.
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 px-6 py-4">
              <div className="flex flex-wrap justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => closeDisburseDialog()}
                  disabled={actionBusy !== ""}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => void handleWorkflowAction("disburse")}
                  disabled={
                    actionBusy !== "" ||
                    (!financeAccounts?.length
                      ? true
                      : !disburseForm.paid_from_account_id)
                  }
                >
                  {actionBusy === "disburse"
                    ? disburseMode === "edit"
                      ? "Saving..."
                      : "Disbursing..."
                    : disburseMode === "edit"
                      ? "Save Changes"
                      : "Confirm Disbursement"}
                </Button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
      {showVoucherPreviewDialog && previewVoucher ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 px-4 py-6">
          <button
            type="button"
            aria-label="Close payment voucher preview"
            className="absolute inset-0"
            onClick={() => setShowVoucherPreviewDialog(false)}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="voucher-preview-title"
            className="relative z-[81] flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-card"
          >
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-slate-500">
                    Payment Voucher
                  </p>
                  <h2
                    id="voucher-preview-title"
                    className="mt-2 text-2xl font-semibold tracking-tight text-slate-950"
                  >
                    {previewVoucher.voucher_number}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Read-only voucher details for the requester view.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowVoucherPreviewDialog(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200"
                >
                  <Icon name="close" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Amount
                  </div>
                  <div className="mt-1 text-lg font-semibold text-slate-950">
                    {formatCurrency(previewVoucher.amount, request?.currency)}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Retirement
                  </div>
                  <div className="mt-1 text-lg font-semibold text-slate-950">
                    {formatCurrency(
                      previewVoucher.retired_amount || 0,
                      request?.currency,
                    )}
                  </div>
                </div>
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-white p-4 space-y-2">
                <div className="text-sm text-slate-700">
                  <span className="font-semibold text-slate-950">Method:</span>{" "}
                  {previewVoucher.method || "-"}
                </div>
                <div className="text-sm text-slate-700">
                  <span className="font-semibold text-slate-950">
                    Disbursed:
                  </span>{" "}
                  {formatDisplayDate(previewVoucher.disbursed_at)}
                </div>
                <div className="text-sm text-slate-700">
                  <span className="font-semibold text-slate-950">
                    Retirement status:
                  </span>{" "}
                  {formatRequestStatus(previewVoucher.retirement_status)}
                </div>
                <div className="text-sm text-slate-700">
                  <span className="font-semibold text-slate-950">Note:</span>{" "}
                  {previewVoucher.note || "-"}
                </div>
              </div>
              {previewVoucher.evidence_files?.length ? (
                <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-slate-950">
                    Evidence files
                  </div>
                  <div className="mt-3 space-y-2">
                    {previewVoucher.evidence_files.map((file) => (
                      <button
                        type="button"
                        key={file.id}
                        className="flex w-full items-center justify-between gap-2 rounded-2xl bg-white px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10"
                        onClick={() => openVoucherEvidence(file)}
                        disabled={!file.public_url}
                      >
                        <span className="truncate">{file.file_name}</span>
                        <span className="text-xs font-semibold text-brand-900">
                          {file.public_url ? "View" : "Unavailable"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              {previewVoucher.retirement_files?.length ? (
                <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-slate-950">
                    Retirement files
                  </div>
                  <div className="mt-3 space-y-2">
                    {previewVoucher.retirement_files.map((file) => (
                      <button
                        type="button"
                        key={file.id}
                        className="flex w-full items-center justify-between gap-2 rounded-2xl bg-white px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10"
                        onClick={() => openVoucherEvidence(file)}
                        disabled={!file.public_url}
                      >
                        <span className="truncate">{file.file_name}</span>
                        <span className="text-xs font-semibold text-brand-900">
                          {file.public_url ? "View" : "Unavailable"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              {(() => {
                const requestData = request?.data as Record<string, unknown> | null;
                const retirement = typeof requestData?.retirement === "object" && requestData.retirement ? (requestData.retirement as Record<string, unknown>) : null;
                const breakdown = typeof retirement?.breakdown === "object" && retirement.breakdown ? (retirement.breakdown as Record<string, unknown>) : null;
                const refund = typeof breakdown?.refund === "object" && breakdown.refund ? (breakdown.refund as Record<string, unknown>) : null;
                const refundAmount = typeof refund?.refund_amount === "number" ? refund.refund_amount : null;
                if (!refund || !refundAmount) return null;
                return (
                  <div className="rounded-[22px] border border-amber-200 bg-amber-50 p-4">
                    <div className="text-sm font-semibold text-amber-900">
                      Refund
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-amber-800">
                      <p>
                        <span className="font-medium">Amount:</span>{" "}
                        {formatCurrency(refundAmount, request?.currency)}
                      </p>
                      {refund.refund_method ? (
                        <p>
                          <span className="font-medium">Method:</span>{" "}
                          {String(refund.refund_method)}
                        </p>
                      ) : null}
                      {refund.refund_reference ? (
                        <p>
                          <span className="font-medium">Reference:</span>{" "}
                          {String(refund.refund_reference)}
                        </p>
                      ) : null}
                      {refund.refund_date ? (
                        <p>
                          <span className="font-medium">Date:</span>{" "}
                          {formatDisplayDate(String(refund.refund_date))}
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="border-t border-slate-100 px-6 py-4">
              <div className="flex flex-wrap justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() =>
                    void handleDownloadArtifact("pv_pdf", previewVoucher.id)
                  }
                  disabled={actionBusy !== ""}
                >
                  {actionBusy === `download_pv:${previewVoucher.id}`
                    ? "Downloading..."
                    : "Download PV"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowVoucherPreviewDialog(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
      {voucherFilePreview ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/55 px-4 py-6">
          <button
            type="button"
            aria-label="Close file preview"
            className="absolute inset-0"
            onClick={() => setVoucherFilePreview(null)}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="voucher-file-preview-title"
            className="relative z-[91] flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-card"
          >
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div className="min-w-0">
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-slate-500">
                  File Preview
                </p>
                <h2
                  id="voucher-file-preview-title"
                  className="mt-2 truncate text-lg font-semibold text-slate-950"
                >
                  {voucherFilePreview.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setVoucherFilePreview(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200"
              >
                <Icon name="close" />
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-slate-100 p-4">
              {voucherFilePreview.mime_type?.startsWith("image/") ? (
                <img
                  src={voucherFilePreview.url}
                  alt={voucherFilePreview.name}
                  className="mx-auto max-h-[70vh] rounded-2xl border border-slate-200 bg-white object-contain"
                />
              ) : (
                <iframe
                  src={voucherFilePreview.url}
                  title={voucherFilePreview.name}
                  className="h-[70vh] w-full rounded-2xl border border-slate-200 bg-white"
                />
              )}
            </div>
            <div className="border-t border-slate-100 px-6 py-4">
              <div className="flex flex-wrap justify-end gap-3">
                <a href={voucherFilePreview.url} target="_blank" rel="noreferrer">
                  <Button variant="secondary">Open in new tab</Button>
                </a>
                <Button
                  variant="secondary"
                  onClick={() => setVoucherFilePreview(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
      <MediaPickerModal
        open={showDisbursementMediaPicker}
        onClose={() => setShowDisbursementMediaPicker(false)}
        title="Select Disbursement Evidence"
        multiple
        selectedIds={disburseFiles.map((file) => file.id)}
        loadFiles={async (search) =>
          listFileAssets({
            include_usage: true,
            per_page: 200,
            search,
            uploaded_by: currentUserId,
          })
        }
        uploadFiles={async (files, onProgress) => {
          const total = files.length;
          let uploadedCount = 0;
          for (const file of Array.from(files)) {
            onProgress?.({
              uploaded: uploadedCount,
              total,
              current_file_name: file.name,
            });
            const uploaded = await uploadFileAsset(file, {
              organization_id:
                String(requestData.organization_id || "") || undefined,
              metadata: { source: "request_disbursement", request_id: id },
            });
            uploadedCount += 1;
            onProgress?.({
              uploaded: uploadedCount,
              total,
              current_file_name: file.name,
            });
            setDisburseFiles((current) => {
              if (current.some((row) => row.id === uploaded.id)) return current;
              return [
                ...current,
                { id: uploaded.id, file_name: uploaded.file_name },
              ];
            });
          }
        }}
        onSelect={(files) => {
          setDisburseFiles(
            files.map((file) => ({ id: file.id, file_name: file.file_name })),
          );
        }}
      />
      <MediaPickerModal
        open={showRetirementMediaPicker}
        onClose={() => setShowRetirementMediaPicker(false)}
        title="Select Retirement Files"
        multiple
        selectedIds={retireForm.retirement_file_ids}
        loadFiles={async (search) =>
          listFileAssets({
            include_usage: true,
            per_page: 200,
            search,
            uploaded_by: currentUserId,
          })
        }
        uploadFiles={async (files, onProgress) => {
          const total = files.length;
          let uploadedCount = 0;
          for (const file of Array.from(files)) {
            onProgress?.({
              uploaded: uploadedCount,
              total,
              current_file_name: file.name,
            });
            const uploaded = await uploadFileAsset(file, {
              organization_id:
                String(requestData.organization_id || "") || undefined,
              metadata: { source: "request_retirement", request_id: id },
            });
            uploadedCount += 1;
            onProgress?.({
              uploaded: uploadedCount,
              total,
              current_file_name: file.name,
            });
            setRetireForm((current) => ({
              ...current,
              retirement_file_ids: Array.from(
                new Set([...current.retirement_file_ids, uploaded.id]),
              ),
            }));
          }
        }}
        onSelect={(files) => {
          setRetireForm((current) => ({
            ...current,
            retirement_file_ids: files.map((file) => file.id),
          }));
        }}
      />

      {showRetireDialog ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 px-4 py-6">
          <button
            type="button"
            aria-label="Close retirement dialog"
            className="absolute inset-0"
            onClick={() => setShowRetireDialog(false)}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="retire-request-title"
            className="relative z-[81] flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-card"
          >
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-slate-500">
                    Requester Action
                  </p>
                  <h2
                    id="retire-request-title"
                    className="mt-2 text-2xl font-semibold tracking-tight text-slate-950"
                  >
                    Submit Retirement
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Attach receipts and confirm how the disbursed amount was
                    used.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRetireDialog(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200"
                >
                  <Icon name="close" />
                </button>
              </div>
              {retireableVoucher ? (
                <div className="mt-4 rounded-[18px] border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900">
                  <div className="font-semibold">
                    Voucher {retireableVoucher.voucher_number}
                  </div>
                  <div className="mt-1 text-brand-900/75">
                    Disbursed{" "}
                    {formatCurrency(
                      retireableVoucher.amount,
                      request?.currency,
                    )}{" "}
                    • Remaining{" "}
                    {formatCurrency(
                      retireableVoucher.voucher_balance,
                      request?.currency,
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <SelectField
                label="Payment Voucher"
                value={retireForm.voucher_id}
                onChange={(event) => {
                  const next = (paymentVouchers ?? []).find(
                    (voucher) => voucher.id === event.target.value,
                  );
                  setRetireForm((current) => ({
                    ...current,
                    voucher_id: event.target.value,
                    retired_amount: next
                      ? String(next.voucher_balance || next.amount || "")
                      : current.retired_amount,
                    retirement_file_ids: next
                      ? current.retirement_file_ids
                      : current.retirement_file_ids,
                  }));
                }}
              >
                <option value="">Select voucher</option>
                {(paymentVouchers ?? []).map((voucher) => (
                  <option key={voucher.id} value={voucher.id}>
                    {voucher.voucher_number} (
                    {formatCurrency(voucher.voucher_balance, request?.currency)}{" "}
                    remaining)
                  </option>
                ))}
              </SelectField>

              <TextField
                label="Retirement Amount"
                type="number"
                min="0"
                value={retireForm.retired_amount}
                onChange={(event) =>
                  setRetireForm((current) => ({
                    ...current,
                    retired_amount: event.target.value,
                  }))
                }
                placeholder={
                  retireableVoucher
                    ? String(
                      retireableVoucher.voucher_balance ||
                      retireableVoucher.amount ||
                      "",
                    )
                    : ""
                }
              />

              {retirementShortfall > 0 ? (
                <div className="rounded-[22px] border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-900">
                    Refund Required: {formatCurrency(retirementShortfall, request?.currency)}
                  </p>
                  <p className="mt-1 text-xs text-amber-800">
                    You retired less than disbursed. Provide refund details below or upload refund evidence in Retirement Files.
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <TextField
                      label="Refund Amount"
                      type="number"
                      min="0"
                      value={retireForm.refund_amount}
                      onChange={(event) =>
                        setRetireForm((current) => ({
                          ...current,
                          refund_amount: event.target.value,
                        }))
                      }
                      placeholder={String(retirementShortfall)}
                    />
                    <SelectField
                      label="Refund Method"
                      value={retireForm.refund_method}
                      onChange={(event) =>
                        setRetireForm((current) => ({
                          ...current,
                          refund_method: event.target.value,
                        }))
                      }
                    >
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash_deposit">Cash Deposit</option>
                      <option value="cash_handin">Cash Hand-in</option>
                    </SelectField>
                    <TextField
                      label="Refund Reference"
                      value={retireForm.refund_reference}
                      onChange={(event) =>
                        setRetireForm((current) => ({
                          ...current,
                          refund_reference: event.target.value,
                        }))
                      }
                      placeholder="Txn ref / teller / receipt no"
                    />
                    <TextField
                      label="Refund Date"
                      type="date"
                      value={retireForm.refund_date}
                      onChange={(event) =>
                        setRetireForm((current) => ({
                          ...current,
                          refund_date: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              ) : null}

              <TextAreaField
                label="Retirement Notes"
                helpText="Add receipts context, what was spent, and any important explanation."
                value={retireForm.notes}
                onChange={(event) => {
                  const nextNotes = event.target.value;
                  setRetireForm((current) => ({
                    ...current,
                    notes: nextNotes,
                  }));
                  setRetirementCertificateForm((current) => {
                    const currentReason = current.reason.trim();
                    const shouldMirrorNotes =
                      !currentReason ||
                      currentReason === defaultCertificateReason;
                    return shouldMirrorNotes
                      ? {
                        ...current,
                        reason: nextNotes.trim() || defaultCertificateReason,
                      }
                      : current;
                  });
                }}
                rows={4}
              />

              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      Retirement Files
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Attach receipts, invoices, and proof of expenditure.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => setShowRetirementMediaPicker(true)}
                  >
                    {retireForm.retirement_file_ids.length
                      ? "Manage Retirement Files"
                      : "Pick Retirement Files"}
                  </Button>
                </div>
                {retireForm.retirement_file_ids.length ? (
                  <div className="mt-3 text-xs text-slate-500">
                    {retireForm.retirement_file_ids.length} file(s) selected
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-slate-500">
                    No retirement files selected yet.
                  </div>
                )}
                <div className="mt-4 rounded-[18px] border border-brand-200 bg-brand-50 px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-brand-950">
                        Certificate of Honor
                      </p>
                      <p className="mt-1 text-sm leading-6 text-brand-900/80">
                        Use this when receipts are unavailable. Add it only if
                        the retirement needs a declaration or explanation.
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        setShowCertificateHonorForm((current) => !current)
                      }
                    >
                      {showCertificateHonorForm
                        ? "Hide Certificate"
                        : "Add Certificate"}
                    </Button>
                  </div>
                  {showCertificateHonorForm ? (
                    <div className="mt-4 grid gap-4">
                      <TextAreaField
                        label="Certificate declaration"
                        helpText="This statement will be printed into the generated certificate."
                        value={retirementCertificateForm.declaration}
                        onChange={(event) =>
                          setRetirementCertificateForm((current) => ({
                            ...current,
                            declaration: event.target.value,
                          }))
                        }
                        rows={4}
                      />
                      <TextAreaField
                        label="Why receipts are unavailable"
                        helpText="Explain the cash-advance, discount, missing receipt, or other reason for honoring the retirement without full receipt support."
                        value={retirementCertificateForm.reason}
                        onChange={(event) =>
                          setRetirementCertificateForm((current) => ({
                            ...current,
                            reason: event.target.value,
                          }))
                        }
                        rows={4}
                      />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[18px] border border-brand-200 bg-white px-4 py-3 text-sm text-slate-700">
                          <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                            Prepared by
                          </div>
                          <div className="mt-1 font-semibold text-slate-950">
                            {formatPersonName(user)}
                          </div>
                        </div>
                        <div className="rounded-[18px] border border-brand-200 bg-white px-4 py-3 text-sm text-slate-700">
                          <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                            Certificate status
                          </div>
                          <div className="mt-1 font-semibold text-slate-950">
                            {retireForm.retirement_file_ids.length
                              ? "Attached to retirement"
                              : "Not yet attached"}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            if (!retireForm.voucher_id) {
                              showToast({
                                title: "Select a voucher first",
                                message:
                                  "Choose the payment voucher before generating the certificate.",
                                tone: "danger",
                              });
                              return;
                            }
                            void (async () => {
                              try {
                                setActionBusy("certificate_honor");
                                const selectedVoucher =
                                  (paymentVouchers ?? []).find(
                                    (voucher) =>
                                      voucher.id === retireForm.voucher_id,
                                  ) || retireableVoucher;
                                if (!selectedVoucher) {
                                  throw new Error(
                                    "Select a payment voucher first.",
                                  );
                                }
                                const file = await buildCertificateOfHonorPdf({
                                  requestLabel:
                                    request?.request_number || `Request ${id}`,
                                  voucherNumber: selectedVoucher.voucher_number,
                                  staffName: formatPersonName(user),
                                  amountLabel: formatCertificateCurrency(
                                    Number(
                                      retireForm.retired_amount ||
                                      selectedVoucher.voucher_balance ||
                                      selectedVoucher.amount ||
                                      0,
                                    ),
                                    request?.currency,
                                  ),
                                  declaration:
                                    retirementCertificateForm.declaration.trim(),
                                  reason:
                                    retirementCertificateForm.reason.trim() ||
                                    retireForm.notes.trim() ||
                                    defaultCertificateReason,
                                  issuedAt: new Date()
                                    .toISOString()
                                    .slice(0, 10),
                                });
                                const uploaded = await uploadFileAsset(file, {
                                  organization_id:
                                    String(requestData.organization_id || "") ||
                                    undefined,
                                  metadata: {
                                    source: "request_retirement_certificate",
                                    request_id: id,
                                    voucher_id: selectedVoucher.id,
                                  },
                                });
                                setRetireForm((current) => ({
                                  ...current,
                                  retirement_file_ids: Array.from(
                                    new Set([
                                      ...current.retirement_file_ids,
                                      uploaded.id,
                                    ]),
                                  ),
                                }));
                                showToast({
                                  title: "Certificate attached",
                                  message:
                                    "The Certificate of Honor has been generated and added to the retirement files.",
                                  tone: "success",
                                });
                              } catch (error) {
                                showToast({
                                  title: "Certificate generation failed",
                                  message:
                                    error instanceof Error
                                      ? error.message
                                      : "We couldn't generate the certificate right now.",
                                  tone: "danger",
                                });
                              } finally {
                                setActionBusy("");
                              }
                            })();
                          }}
                          disabled={actionBusy !== "" || !retireForm.voucher_id}
                        >
                          {actionBusy === "certificate_honor"
                            ? "Generating..."
                            : "Generate & Attach Certificate"}
                        </Button>
                      </div>
                      <p className="text-xs leading-5 text-brand-900/75">
                        The generated certificate will be downloadable with the
                        request and can still sit alongside any scanned signed
                        copy you upload manually.
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 px-6 py-4">
              <div className="flex flex-wrap justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowRetireDialog(false)}
                  disabled={actionBusy !== ""}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => void handleWorkflowAction("retire")}
                  disabled={actionBusy !== "" || !retireForm.voucher_id}
                >
                  {actionBusy === "retire"
                    ? "Submitting..."
                    : "Submit Retirement"}
                </Button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}

export default RequestDetailsPage;
