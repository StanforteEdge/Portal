import {
  ActivityFeed,
  Button,
  Chip,
  EmptyState,
  Icon,
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
} from "@/shared";
import { formatCurrency } from "@stanforte/shared";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import { cacheStore, useCachedQuery } from "@/shared/lib/core";
import {
  buildAppMobileNav,
  buildRequestsNavigation,
  requestsMobileNav,
} from "@/pages/requests/requests-data";
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
} from "@/pages/requests/requests-api";
import { listEntityTags, listManagedTaxonomies } from "@/pages/requests/taxonomy-api";
import type { MyOrganization, ProjectOption, TeamOption } from "@/pages/requests/requests-api";
import { financeApi } from "@/shared/lib/core";
import { downloadBase64File } from "@/shared/lib/download";
import { formatDisplayDate } from "@stanforte/shared";
import {
  buildLeaveWorkflow,
  buildWorkflow,
  deriveRequestWorkflowStatus,
  formatPersonName,
  formatRequestStatus,
  formatViewerRequestStatus,
  requestHasDraftHistory,
  requestFamilyFromRecord,
  requestStatusTone,
} from "@/pages/requests/request-helpers";
import { useFinanceRequest } from "./hooks/useFinanceRequest";
import { LeaveRequestBody } from "./bodies/LeaveRequestBody";
import { FinanceRequestBody } from "./bodies/FinanceRequestBody";
import { buildFinanceProgress, buildFinanceViewerStatus } from "./status/financeStatus";
import { buildLeaveViewerStatus } from "./status/leaveStatus";

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

export type RequestDetailsView = "mine" | "approvals" | "finance" | "hr";

type RequestDetailsPageProps = {
  detailView?: RequestDetailsView;
};

function detailPathForView(view: RequestDetailsView, id: string) {
  if (view === "finance") return `/finance/requests/${id}`;
  if (view === "approvals") return `/requests/approvals/${id}`;
  if (view === "hr") return `/hr/requests/${id}`;
  return `/requests/${id}`;
}

export function RequestDetailsPage(props: RequestDetailsPageProps = {}) {
  const navigate = useNavigate();
  const { id: routeId } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const [actionComment, setActionComment] = useState("");
  const [actionBusy, setActionBusy] = useState<string>("");
  const id = routeId || searchParams.get("id") || "";
  const detailView = props.detailView ?? "mine";
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
    projects?.find((entry: ProjectOption) => entry.id === String(requestData.project_id || ""))
      ?.name ||
    String(requestData.project_name || requestData.project_id || "-");
  const teamName =
    teams?.find((entry: TeamOption) => entry.id === String(requestData.team_id || ""))
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
      (entry: MyOrganization) =>
        entry.organization.id === String(requestData.organization_id || ""),
    )?.organization.name ||
    String(requestData.organization_name || requestData.organization_id || "-");
  const lineItems = request?.items ?? [];
  const documents = lineItems.flatMap((item) => item.files ?? []);
  const requestTotal = Number(request?.total_amount || 0);
  const availableActions = requestActions ?? [];
  const finance = useFinanceRequest(id, requestTotal, availableActions);
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
        finance.paymentVouchers ?? [],
        {
          showDraftStep:
            detailView === "mine" &&
            workflowStatus === "draft" &&
            requestHasDraftHistory(request),
        },
      );
  const parentPath =
    detailView === "hr"
      ? "/hr/leave"
      : detailView === "mine" && family === "leave"
      ? "/leave"
      : detailView === "approvals"
        ? "/requests/approvals"
        : detailView === "finance"
          ? "/finance/requests"
          : "/requests";
  const parentLabel =
    detailView === "hr"
      ? "HR Requests"
      : detailView === "mine" && family === "leave"
      ? "Leave Tracker"
      : detailView === "approvals"
        ? "Approvals"
        : detailView === "finance"
          ? "Finance Requests"
          : "My Requests";
  const detailActiveLabel =
    detailView === "hr"
      ? "hr-leave"
      : detailView === "finance"
      ? "Finance Requests"
      : detailView === "approvals"
        ? "Approvals"
        : "Request Details";
  const detailMobileNav =
    detailView === "finance"
      ? buildAppMobileNav("Finance")
      : detailView === "hr"
        ? buildAppMobileNav("HR")
        : requestsMobileNav;
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
  const requestStatus = workflowStatus;
  const approvalActionsVisible =
    availableActions.includes("approve") ||
    availableActions.includes("reject") ||
    availableActions.includes("return");
  // Finance clearing uses "approve" action key — hide approve/reject/return buttons
  // in the team lead approvals view when the pending step belongs to Finance.
  // Finance users must act from /finance/requests/:id instead.
  const isFinancePendingStep = pendingApprovals.some(
    (p: any) =>
      p?.approver_id === "finance.approve" || p?.approver_id === "accountant",
  );
  const financeActionsVisible = detailView === "finance";
  const ownerActionsVisible = detailView === "mine";
  const viewerStatus = useMemo(() => {
    if (!request) {
      return { label: "Loading", hint: "", tone: "neutral" as const };
    }
    const pendingStep = pendingApprovals[0]?.step;
    if (family === "leave") {
      return buildLeaveViewerStatus({
        approvalActionsVisible,
        ownerActionsVisible,
        requestStatus,
        workflowStatus,
        availableActions,
        pendingStep,
        statusTone,
      });
    }
    return buildFinanceViewerStatus({
      approvalActionsVisible,
      ownerActionsVisible,
      financeActionsVisible,
      requestStatus,
      workflowStatus,
      availableActions,
      pendingStep,
      roles,
      permissions,
      statusTone,
    });
  }, [
    approvalActionsVisible,
    availableActions,
    family,
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
    if (!request || family === "leave") return { label: "", hint: "" };
    return buildFinanceProgress({
      requestStatus,
      requestTotal,
      disbursedTotal: finance.disbursedTotal,
      remainingDisbursement: finance.remainingDisbursement,
      currency: request.currency,
    });
  }, [
    finance.disbursedTotal,
    finance.remainingDisbursement,
    family,
    request,
    requestStatus,
    requestTotal,
  ]);

  const disbursementButtonLabel =
    requestStatus === "disbursed" &&
      requestTotal > 0 &&
      finance.disbursedTotal < requestTotal
      ? "Disburse More"
      : "Disburse Request";
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
        ? `${window.location.origin}${detailPathForView(detailView, request.id)}`
        : "";
    return [
      `Hi, please take a look at ${requestLabel}.`,
      link ? `Open: ${link}` : "",
      `Current status: ${formatViewerRequestStatus(request.status, availableActions, pendingApprovals[0]?.step)}`,
    ]
      .filter(Boolean)
      .join("\n");
  }, [availableActions, detailView, pendingApprovals, request]);

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

    const voucherActivity: ActivityItem[] = (finance.paymentVouchers ?? []).flatMap(
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
    finance.paymentVouchers,
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
          amount: Number(finance.disburseForm.amount || request?.total_amount || 0),
          method: finance.disburseForm.method || undefined,
          transaction_ref: finance.disburseForm.transaction_ref.trim() || undefined,
          paid_from_account_id: finance.disburseForm.paid_from_account_id || undefined,
          note: finance.disburseForm.note.trim() || undefined,
          disbursed_at: finance.disburseForm.disbursed_at
            ? `${finance.disburseForm.disbursed_at}T00:00:00.000Z`
            : undefined,
          evidence_file_id: finance.disburseFiles[0]?.id,
          evidence_file_ids: finance.disburseFiles.map((file) => file.id),
        };
        if (finance.disburseMode === "edit" && finance.editingVoucherId) {
          await financeApi.updatePaymentVoucher(
            id,
            finance.editingVoucherId,
            disbursePayload,
          );
        } else {
          await disburseRequest(id, disbursePayload, { traceId });
        }
      } else if (action === "confirm") {
        await confirmRequest(id);
      } else if (action === "retire") {
        const selectedVoucher =
          (finance.paymentVouchers ?? []).find(
            (voucher) => voucher.id === finance.retireForm.voucher_id,
          ) || null;
        const retiredAmount = finance.retireForm.retired_amount.trim()
          ? Number(finance.retireForm.retired_amount)
          : undefined;
        const shortfall = selectedVoucher
          ? Math.max(0, Number(selectedVoucher.amount || 0) - Number(retiredAmount || 0))
          : 0;
        const refundAmount = finance.retireForm.refund_amount.trim()
          ? Number(finance.retireForm.refund_amount)
          : 0;
        const hasRefundDetails =
          refundAmount >= shortfall &&
          Boolean(finance.retireForm.refund_method.trim()) &&
          Boolean(finance.retireForm.refund_reference.trim());
        const hasRefundEvidence = finance.retireForm.retirement_file_ids.length > 0;

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
          voucher_id: finance.retireForm.voucher_id || undefined,
          retired_amount: retiredAmount,
          notes: finance.retireForm.notes.trim() || actionComment.trim() || undefined,
          retirement_file_ids: finance.retireForm.retirement_file_ids.length
            ? finance.retireForm.retirement_file_ids
            : undefined,
          breakdown:
            shortfall > 0
              ? {
                  refund: {
                    required_amount: shortfall,
                    refund_amount: refundAmount || undefined,
                    refund_method: finance.retireForm.refund_method || undefined,
                    refund_reference:
                      finance.retireForm.refund_reference.trim() || undefined,
                    refund_date: finance.retireForm.refund_date || undefined,
                    evidence_file_ids: finance.retireForm.retirement_file_ids,
                  },
                }
              : undefined,
        });
      } else if (action === "complete") {
        await completeRequest(id);
      }
      setActionComment("");
      finance.closeDisburseDialog();
      finance.closeRetireDialog();
      finance.setDisburseForm({
        amount: "",
        method: "bank_transfer",
        transaction_ref: "",
        paid_from_account_id: "",
        note: "",
        disbursed_at: new Date().toISOString().slice(0, 10),
      });
      finance.setDisburseFiles([]);
      finance.setRetireForm({
        voucher_id: "",
        retired_amount: "",
        notes: "",
        retirement_file_ids: [],
        refund_amount: "",
        refund_method: "bank_transfer",
        refund_reference: "",
        refund_date: new Date().toISOString().slice(0, 10),
      });
      finance.setShowCertificateHonorForm(false);
      finance.setRetirementCertificateForm({
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
        finance.refetchPaymentVouchers(),
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
                  ? finance.disburseMode === "edit"
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
          finance.refetchPaymentVouchers(),
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
        includeRequestDetails:
          detailView === "mine" || detailView === "approvals",
        requestDetailsPath: detailPathForView(detailView, id),
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
              : detailView === "hr"
                ? [
                  { label: "HR", path: "/hr" },
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

              {family === "leave" ? (
                <LeaveRequestBody
                  requestData={requestData}
                  handoverColleagueName={handoverColleagueName}
                />
              ) : (
                <FinanceRequestBody
                  request={request}
                  requestData={requestData}
                  categoryName={categoryName}
                  projectName={projectName}
                  teamName={teamName}
                  organizationName={organizationName}
                  requestTags={requestTags}
                  lineItems={lineItems}
                  currentUserId={currentUserId}
                  ownerActionsVisible={ownerActionsVisible}
                  availableActions={availableActions}
                  actionBusy={actionBusy}
                  finance={finance}
                  financeProgress={financeProgress}
                  onHandleDisburse={() => handleWorkflowAction("disburse")}
                  onHandleRetire={() => handleWorkflowAction("retire")}
                  onHandleDownloadArtifact={async (action, voucherId) => {
                    await handleDownloadArtifact(action, voucherId);
                  }}
                />
              )}

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
                    {finance.disbursedTotal > 0 ? (
                      <span className="text-xs font-bold uppercase tracking-[0.12em] text-white/60">
                        / {formatCurrency(finance.disbursedTotal, request.currency)} disbursed
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
                {!isFinancePendingStep && approvalActionsVisible &&
                  availableActions.some((action: string) =>
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
                {isFinancePendingStep && approvalActionsVisible ? (
                  <p className="mt-4 text-sm text-white/75">
                    This step requires Finance clearance.{" "}
                    <Link
                      to={`/finance/requests/${id}`}
                      className="font-medium text-white underline"
                    >
                      Open in Finance
                    </Link>
                  </p>
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
                      requestTotal > finance.disbursedTotal)) ? (
                  <Button
                    variant="secondary"
                    className="mt-4 w-full justify-center"
                    onClick={() => finance.openDisburseDialog()}
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
                    onClick={() => finance.openRetireDialog()}
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

            {family === "leave" ? (
              <LeaveRequestBody
                requestData={requestData}
                handoverColleagueName={handoverColleagueName}
              />
            ) : (
              <FinanceRequestBody
                request={request}
                requestData={requestData}
                categoryName={categoryName}
                projectName={projectName}
                teamName={teamName}
                organizationName={organizationName}
                requestTags={requestTags}
                lineItems={lineItems}
                currentUserId={currentUserId}
                ownerActionsVisible={ownerActionsVisible}
                availableActions={availableActions}
                actionBusy={actionBusy}
                finance={finance}
                financeProgress={financeProgress}
                onHandleDisburse={() => handleWorkflowAction("disburse")}
                onHandleRetire={() => handleWorkflowAction("retire")}
                onHandleDownloadArtifact={async (action, voucherId) => {
                  await handleDownloadArtifact(action, voucherId);
                }}
              />
            )}

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
              {!isFinancePendingStep && approvalActionsVisible &&
                availableActions.some(
                  (action: string) =>
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
              {isFinancePendingStep && approvalActionsVisible ? (
                <p className="mt-4 text-sm text-slate-600">
                  This step requires Finance clearance.{" "}
                  <Link
                    to={`/finance/requests/${id}`}
                    className="font-medium text-brand-700 underline"
                  >
                    Open in Finance
                  </Link>
                </p>
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
                    requestTotal > finance.disbursedTotal)) ? (
                <Button
                  variant="secondary"
                  className="mt-4 w-full justify-center"
                  onClick={() => finance.openDisburseDialog()}
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
                  onClick={() => finance.openRetireDialog()}
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

    </AppShell>
  );
}

export default RequestDetailsPage;
