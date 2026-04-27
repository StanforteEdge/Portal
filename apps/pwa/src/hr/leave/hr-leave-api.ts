// apps/pwa/src/modules/hr/leave/hr-leave-api.ts
import { httpRequest } from "@/shared/lib/core";
import {
  listRequests,
  listApprovals,
  approveRequest,
  rejectRequest,
  type RequestRecord,
} from "@/requests/requests-api";
import { requestFamilyFromRecord } from "@/requests/request-helpers";

export type { RequestRecord };

export type HrLeaveBalance = {
  user_id: string;
  user_name: string;
  email: string;
  year: number;
  balances: Array<{
    leave_type_key: string;
    leave_type_name: string;
    entitled_days: number;
    used_days: number;
    available_days: number;
  }>;
};

export type HrLeaveBalancesResponse = {
  data: HrLeaveBalance[];
};

// All staff leave requests (admin view — no only_mine filter)
export async function listHrLeaveRequests(params?: {
  status?: string;
  user_id?: string;
  from?: string;
  to?: string;
}): Promise<RequestRecord[]> {
  const query: Record<string, unknown> = { family: "leave" };
  if (params?.status) query.status = params.status;
  if (params?.user_id) query.user_id = params.user_id;
  if (params?.from) query.from = params.from;
  if (params?.to) query.to = params.to;
  const requests = await listRequests(query);
  return requests.filter((record) => requestFamilyFromRecord(record) === "leave");
}

// Leave requests pending HR approval
export async function listHrLeaveApprovals(): Promise<RequestRecord[]> {
  const approvals = await listApprovals({ family: "leave" });
  return approvals.filter((record) => requestFamilyFromRecord(record) === "leave");
}

// Per-staff leave balances — HR-specific endpoint
export async function getHrLeaveBalances(params?: {
  year?: number;
}): Promise<HrLeaveBalancesResponse> {
  const query = new URLSearchParams();
  if (params?.year) query.set("year", String(params.year));
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return httpRequest<HrLeaveBalancesResponse>(`/hr/leave/balances${suffix}`);
}

// Re-export for use in the page without additional imports
export { approveRequest, rejectRequest };
