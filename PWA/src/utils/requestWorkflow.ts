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

type FlowStepConfig = {
  role?: string;
  min_amount?: number;
  approver_type?: string;
  approver_id?: string;
  approver?: {
    type?: string;
    value?: string;
  };
};

type NormalizedFlowStep = {
  approverType: string;
  approverId: string;
  role?: string;
  minAmount: number | null;
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

const APPROVER_LABELS: Record<string, string> = {
  "relation:requester_team_lead": "Team Lead",
  "relation:requester_team_lead_or_manager": "Team Lead or Manager",
  "permission:finance.approve": "Finance",
  "permission:hr.approve": "HR",
  "permission:payroll.approve": "Payroll",
  "office:coo": "COO",
  "office:ed": "ED",
};

const roleLabel = (role: string) =>
  ROLE_LABELS[role] || role.replaceAll("_", " ").replace(/\b\w/g, (m) => m.toUpperCase());

function normalizeFlowStep(step: FlowStepConfig): NormalizedFlowStep {
  const approverType = String(step.approver?.type ?? step.approver_type ?? "")
    .trim()
    .toLowerCase();
  const approverId = String(step.approver?.value ?? step.approver_id ?? "")
    .trim()
    .toLowerCase();
  const role = String(step.role ?? "")
    .trim()
    .toLowerCase();

  if (approverType && approverId) {
    return {
      approverType,
      approverId,
      role: role || undefined,
      minAmount: step.min_amount ? Number(step.min_amount) : null,
    };
  }

  if (role === "team_lead") {
    return { approverType: "relation", approverId: "requester_team_lead", role, minAmount: step.min_amount ? Number(step.min_amount) : null };
  }
  if (role === "manager" || role === "team_lead_or_manager") {
    return { approverType: "relation", approverId: "requester_team_lead_or_manager", role, minAmount: step.min_amount ? Number(step.min_amount) : null };
  }
  if (role === "accountant") {
    return { approverType: "permission", approverId: "finance.approve", role, minAmount: step.min_amount ? Number(step.min_amount) : null };
  }
  if (role === "hr") {
    return { approverType: "permission", approverId: "hr.approve", role, minAmount: step.min_amount ? Number(step.min_amount) : null };
  }
  if (role === "coo" || role === "ed") {
    return { approverType: "office", approverId: role, role, minAmount: step.min_amount ? Number(step.min_amount) : null };
  }
  if (role.includes(".")) {
    return { approverType: "permission", approverId: role, role, minAmount: step.min_amount ? Number(step.min_amount) : null };
  }

  return {
    approverType: role ? "role" : "permission",
    approverId: role || "requests.approve",
    role: role || undefined,
    minAmount: step.min_amount ? Number(step.min_amount) : null,
  };
}

function approverLabel(step: NormalizedFlowStep) {
  return (
    APPROVER_LABELS[`${step.approverType}:${step.approverId}`] ||
    (step.role ? roleLabel(step.role) : roleLabel(step.approverId))
  );
}

function approvalTitle(step: NormalizedFlowStep) {
  if (step.approverType === "permission" && step.approverId === "finance.approve") return "Cleared for Disbursement";
  return "Approved";
}

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

function normalizeText(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function findApprovalEntry(done: Array<Record<string, any>>, step: NormalizedFlowStep, index: number) {
  const label = normalizeText(approverLabel(step));
  const legacyRole = normalizeText(step.role);
  const candidates = done.filter((entry) => normalizeText(entry.action) === "approve");

  return (
    candidates.find((entry) => normalizeText(entry.step) === label) ||
    candidates.find((entry) => normalizeText(entry.step).includes(label)) ||
    (legacyRole
      ? candidates.find((entry) => normalizeText(entry.step).includes(legacyRole))
      : undefined) ||
    candidates[index]
  );
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

  const flowSteps = ((request.request_type?.approval_flow_json as any)?.steps || []) as FlowStepConfig[];
  const normalizedFlow = (flowSteps.length > 0 ? flowSteps : [{ role: "team_lead" }, { role: "accountant" }]).map(normalizeFlowStep);

  const approvalSteps: WorkflowStepDraft[] = normalizedFlow.reduce<WorkflowStepDraft[]>((acc, step, index) => {
    const skippedByThreshold = step.minAmount !== null && amount < step.minAmount;
    if (skippedByThreshold) return acc;
    const forcedDoneByStatus = currentRank >= 3;
    const matchedEntry = findApprovalEntry(doneEntries, step, acc.length);
    const done = forcedDoneByStatus || Boolean(matchedEntry);
    const actor = done ? (matchedEntry ? pickActor(matchedEntry) : step.approverType === "permission" && step.approverId === "finance.approve" ? findMatchingApprovalActor(doneEntries, "accountant") : undefined) : undefined;
    acc.push({
      key: `approval_${step.approverType}_${step.approverId}_${index}`,
      title: approvalTitle(step),
      owner: approverLabel(step),
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
