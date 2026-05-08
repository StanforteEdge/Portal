import { formatCurrency } from "@stanforte/shared";
import { formatViewerRequestStatus } from "@/pages/requests/request-helpers";
import type { FinanceProgress, StatusTone, ViewerStatus } from "./types";

type BuildFinanceViewerStatusInput = {
  approvalActionsVisible: boolean;
  ownerActionsVisible: boolean;
  financeActionsVisible: boolean;
  requestStatus: string;
  workflowStatus: string;
  availableActions: string[];
  pendingStep?: string | null;
  roles: string[];
  permissions: string[];
  statusTone: StatusTone;
};

type BuildFinanceProgressInput = {
  requestStatus: string;
  requestTotal: number;
  disbursedTotal: number;
  remainingDisbursement: number;
  currency?: string | null;
};

export function buildFinanceViewerStatus(
  input: BuildFinanceViewerStatusInput,
): ViewerStatus {
  const {
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
  } = input;

  if (approvalActionsVisible) {
    return {
      label: formatViewerRequestStatus(
        workflowStatus,
        availableActions,
        pendingStep,
      ),
      hint: financeActionsVisible
        ? "Finance is the current approver for this request. Clear it here for disbursement or the next finance step."
        : "You are the current approver for this step.",
      tone: "warning",
    };
  }

  if (ownerActionsVisible && availableActions.includes("submit")) {
    return {
      label: formatViewerRequestStatus(
        workflowStatus,
        availableActions,
        pendingStep,
      ),
      hint: "You can still revise this before submission.",
      tone: "neutral",
    };
  }

  if (financeActionsVisible && availableActions.includes("disburse")) {
    return {
      label: "Ready for Disbursement",
      hint: "Finance can now disburse the request and start voucher handling.",
      tone: "success",
    };
  }

  if (ownerActionsVisible && availableActions.includes("confirm")) {
    return {
      label: formatViewerRequestStatus(
        workflowStatus,
        availableActions,
        pendingStep,
      ),
      hint: "Finance has disbursed this request. Confirm receipt here once the funds or voucher reach you.",
      tone: "warning",
    };
  }

  if (ownerActionsVisible && availableActions.includes("retire")) {
    return {
      label: formatViewerRequestStatus(
        workflowStatus,
        availableActions,
        pendingStep,
      ),
      hint: "After spending the disbursed amount, submit retirement details and receipt support here.",
      tone: "warning",
    };
  }

  if (financeActionsVisible && availableActions.includes("complete")) {
    return {
      label: formatViewerRequestStatus(
        workflowStatus,
        availableActions,
        pendingStep,
      ),
      hint: "Finance can verify the retirement and complete this request.",
      tone: "warning",
    };
  }

  if (requestStatus === "approval") {
    const financeViewer =
      roles.some((role) => role.includes("finance") || role === "accountant") ||
      permissions.some((permission) => permission === "finance.approve");
    return {
      label: financeViewer ? "In Approval Workflow" : "In Review",
      hint: financeViewer
        ? "This request is progressing through the approval chain."
        : "Your request is currently under review.",
      tone: "warning",
    };
  }

  if (requestStatus === "cleared") {
    return {
      label: "Ready for Disbursement",
      hint: "Finance can now prepare disbursement and voucher handling.",
      tone: "success",
    };
  }

  return {
    label: formatViewerRequestStatus(workflowStatus, availableActions, pendingStep),
    hint: "This reflects the current workflow state for your view.",
    tone: statusTone,
  };
}

export function buildFinanceProgress(
  input: BuildFinanceProgressInput,
): FinanceProgress {
  const {
    requestStatus,
    requestTotal,
    disbursedTotal,
    remainingDisbursement,
    currency,
  } = input;

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
        hint: `${formatCurrency(remainingDisbursement, currency)} remains to be disbursed before requester confirmation.`,
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
}
