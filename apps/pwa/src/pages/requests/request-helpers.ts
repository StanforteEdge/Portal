import { formatCurrency } from "@stanforte/shared";
import type { RequestRecord, RequestTypeOption } from "@/pages/requests/requests-api";
import type { WorkflowStep, WorkflowStepStatus } from "@/shared";

export type RequestFamily = "financial" | "leave" | "other";

export function classifyRequestFamily(categoryKey?: string | null, requestTypeName?: string | null): RequestFamily {
  const category = String(categoryKey || "").toLowerCase();
  const name = String(requestTypeName || "").toLowerCase();

  if (category) {
    if (category.includes("leave")) return "leave";
    if (
      category.includes("finance") ||
      category.includes("payment") ||
      category.includes("expense") ||
      category.includes("reimbursement") ||
      category.includes("procurement")
    ) {
      return "financial";
    }
    return "other";
  }

  if (name.includes("leave")) return "leave";

  if (name.includes("cash") || name.includes("expense") || name.includes("financial") || name.includes("reimbursement") || name.includes("procurement")) {
    return "financial";
  }

  return "other";
}

export function requestFamilyLabel(family: RequestFamily) {
  if (family === "leave") return "Leave";
  if (family === "financial") return "Financial";
  return "Other";
}

export function requestFamilyFromType(type?: RequestTypeOption | null): RequestFamily {
  return classifyRequestFamily(type?.categoryKey ?? type?.category_key, type?.name);
}

export function requestFamilyFromRecord(request?: RequestRecord | null): RequestFamily {
  return classifyRequestFamily(request?.request_type?.category_key, request?.request_type?.name);
}

export function formatRequestStatus(status?: string | null) {
  return String(status || "draft").replaceAll("_", " ");
}

export function formatViewerRequestStatus(
  status?: string | null,
  actions: string[] = [],
  pendingStep?: string | null
) {
  const normalizedActions = actions.map((entry) => entry.toLowerCase());
  if (normalizedActions.includes("approve") || normalizedActions.includes("reject")) {
    return "Awaiting Your Approval";
  }
  if (normalizedActions.includes("submit")) {
    return "Draft";
  }
  if (normalizedActions.includes("confirm")) {
    return "Awaiting Your Confirmation";
  }
  if (normalizedActions.includes("retire")) {
    return "Retirement Required";
  }
  if (normalizedActions.includes("complete")) {
    return "Ready to Close";
  }
  if (pendingStep && ["approval", "submitted", "sent", "under_review", "review"].includes(String(status || "").toLowerCase())) {
    return `Awaiting ${pendingStep}`;
  }
  return formatRequestStatus(status);
}

export function requestStatusTone(status?: string | null): "success" | "warning" | "pending" | "danger" | "neutral" {
  const key = String(status || "").toLowerCase();
  if (["approved", "completed", "paid", "disbursed", "confirmed"].includes(key)) return "success";
  if (["rejected", "cancelled", "voided"].includes(key)) return "danger";
  if (["under_review", "review", "draft", "prepared"].includes(key)) return "warning";
  if (["pending", "sent", "approval", "submitted"].includes(key)) return "pending";
  return "neutral";
}

export function formatDisplayDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatPersonName(person?: {
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  email?: string | null;
} | null) {
  const name = `${person?.first_name ?? ""} ${person?.last_name ?? ""}`.trim();
  if (name) return name;
  return person?.username || person?.email || "Unknown requester";
}

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

export function buildWorkflow(
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

export function buildLeaveWorkflow(
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

export function deriveRequestWorkflowStatus(request: any) {
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

export function requestHasDraftHistory(request: any) {
  const stateEvents = Array.isArray(request?.data?.state_events)
    ? request.data.state_events
    : [];
  return stateEvents.some(
    (event: Record<string, unknown>) =>
      String(event.from || "").toLowerCase() === "draft" ||
      String(event.to || "").toLowerCase() === "draft",
  );
}

export const DEFAULT_CERTIFICATE_REASON =
  "No supporting receipt is available for the full amount because the expense was settled without a formal receipt or the receipt could not be obtained in time for retirement.";
