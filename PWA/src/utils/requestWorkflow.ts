import type { RequestRecord } from "@/services/requests";

export type WorkflowStepState = "done" | "pending" | "waiting" | "cancelled";

export type WorkflowStep = {
  key: string;
  title: string;
  owner: string;
  state: WorkflowStepState;
  actor?: string;
  note?: string;
};

type WorkflowStepDraft = {
  key: string;
  title: string;
  owner: string;
  done: boolean;
  actor?: string;
  note?: string;
};

type PaymentVoucherLike = {
  amount: number;
  retired_amount: number;
  retirement_status: string;
};

const STATUS_RANK: Record<string, number> = {
  draft: 0,
  sent: 1,
  approval: 2,
  cleared: 3,
  disbursed: 4,
  confirmed: 5,
  retired: 6,
  completed: 7,
  rejected: -1,
  cancelled: -1,
};

const ROLE_LABELS: Record<string, string> = {
  team_lead: "Team Lead",
  accountant: "Accountant",
  finance_manager: "Finance Manager",
  coo: "COO",
  ed: "ED",
};

const roleLabel = (role: string) =>
  ROLE_LABELS[role] || role.replaceAll("_", " ").replace(/\b\w/g, (m) => m.toUpperCase());

const pickActor = (entry: Record<string, any>) =>
  entry.performed_by_name ||
  entry.approver_name ||
  entry.user_name ||
  entry.actor_name ||
  entry.actor?.name ||
  entry.approved_by_name ||
  undefined;

function hasMatchingApproval(done: Array<Record<string, any>>, role: string) {
  return done.some((entry) => {
    const step = String(entry.step || "").toLowerCase();
    return String(entry.action || "").toLowerCase() === "approve" && step.includes(role.toLowerCase());
  });
}

function findMatchingApprovalActor(done: Array<Record<string, any>>, role: string) {
  const entry = done.find((item) => {
    const step = String(item.step || "").toLowerCase();
    return String(item.action || "").toLowerCase() === "approve" && step.includes(role.toLowerCase());
  });
  return entry ? pickActor(entry) : undefined;
}

function hasStateEvent(data: Record<string, unknown>, toState: string, actionText: string) {
  const stateEvents = Array.isArray(data.state_events) ? (data.state_events as Array<Record<string, unknown>>) : [];
  return stateEvents.some((event) => {
    const to = String(event.to || "").toLowerCase();
    const action = String(event.action || "").toLowerCase();
    return to === toState || action.includes(actionText);
  });
}

export function buildRequestWorkflowSteps(
  request: RequestRecord | null,
  paymentVouchers: PaymentVoucherLike[] = []
): WorkflowStep[] {
  if (!request) return [];

  const requestData = (request.data || {}) as Record<string, unknown>;
  const doneEntries = (request.approvals?.done || []) as Array<Record<string, any>>;
  const amount = Number(request.total_amount || 0);
  const currentRank = STATUS_RANK[String(request.status || "").toLowerCase()] ?? 0;
  const terminalRejected = request.status === "rejected" || request.status === "cancelled";
  const requestTotal = Number(request.total_amount || 0);
  const disbursedTotal = paymentVouchers.reduce((sum, voucher) => sum + Number(voucher.amount || 0), 0);
  const retiredTotal = paymentVouchers.reduce((sum, voucher) => sum + Number(voucher.retired_amount || 0), 0);
  const allRetirementsConfirmed =
    paymentVouchers.length > 0 &&
    paymentVouchers.every((voucher) => String(voucher.retirement_status || "").toLowerCase() === "verified");

  const flowSteps = ((request.request_type?.approval_flow_json as any)?.steps || []) as Array<{
    role?: string;
    min_amount?: number;
  }>;
  const normalizedFlow = flowSteps.length > 0 ? flowSteps : [{ role: "team_lead" }, { role: "accountant" }];

  const approvalSteps: WorkflowStepDraft[] = normalizedFlow.reduce<WorkflowStepDraft[]>((acc, step, index) => {
    const role = String(step.role || `step_${index + 1}`).trim();
    const minAmount = step.min_amount ? Number(step.min_amount) : null;
    const skippedByThreshold = minAmount !== null && amount < minAmount;
    if (skippedByThreshold) return acc;
    const forcedDoneByStatus = currentRank >= 3;
    const done = forcedDoneByStatus || hasMatchingApproval(doneEntries, role);
    const actor = done ? findMatchingApprovalActor(doneEntries, role) : undefined;
    acc.push({
      key: `approval_${role}_${index}`,
      title: role === "accountant" ? "Cleared for Disbursement" : "Approved",
      owner: roleLabel(role),
      done,
      actor,
    });
    return acc;
  }, []);

  const financeBase: WorkflowStepDraft[] = [
    {
      key: "disbursed",
      title: "Disbursement Completed",
      owner: "Accountant",
      done:
        (requestTotal > 0 && disbursedTotal >= requestTotal) ||
        (currentRank >= 4 && requestTotal <= 0) ||
        hasStateEvent(requestData, "disbursed", "disburs"),
      note: requestTotal > 0 ? `${disbursedTotal}/${requestTotal}` : undefined,
    },
    {
      key: "confirmed",
      title: "Disbursement Confirmed",
      owner: "Requester",
      done:
        ((requestTotal > 0 && disbursedTotal >= requestTotal) &&
          (currentRank >= 5 || hasStateEvent(requestData, "confirmed", "confirm"))) ||
        (requestTotal <= 0 && (currentRank >= 5 || hasStateEvent(requestData, "confirmed", "confirm"))),
    },
    {
      key: "retired",
      title: "Retirement Completed",
      owner: "Requester",
      done:
        (requestTotal > 0 && retiredTotal >= requestTotal) ||
        (currentRank >= 6 && requestTotal <= 0) ||
        hasStateEvent(requestData, "retired", "retire"),
      note: requestTotal > 0 ? `${retiredTotal}/${requestTotal}` : undefined,
    },
    {
      key: "completed",
      title: "Completed",
      owner: "Accountant",
      done:
        (requestTotal > 0 &&
          disbursedTotal >= requestTotal &&
          retiredTotal >= requestTotal &&
          allRetirementsConfirmed &&
          (currentRank >= 7 || hasStateEvent(requestData, "completed", "complete"))) ||
        (requestTotal <= 0 && (currentRank >= 7 || hasStateEvent(requestData, "completed", "complete"))),
    },
  ];

  const all = [...approvalSteps, ...financeBase];
  let pendingAssigned = false;

  return all.map((step) => {
    let state: WorkflowStepState = "waiting";
    if (step.done) {
      state = "done";
    } else if (terminalRejected) {
      state = "cancelled";
    } else if (!pendingAssigned) {
      state = "pending";
      pendingAssigned = true;
    }
    return {
      key: step.key,
      title: step.title,
      owner: step.owner,
      actor: step.actor,
      note: step.note,
      state,
    };
  });
}
