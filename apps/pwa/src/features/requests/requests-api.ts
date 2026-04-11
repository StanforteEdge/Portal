import { httpRequest } from "@/shared/lib/core";

export type RequestRecord = {
  id: string;
  status: string;
  request_number?: string;
  request_total_amount?: number | null;
  total_amount?: number | null;
  currency?: string | null;
  created_at?: string;
  updated_at?: string;
  data?: Record<string, unknown> | null;
  request_type?: {
    id: string;
    name: string;
    code_prefix?: string | null;
    category_key?: string | null;
    form_schema?: Record<string, unknown> | null;
    approval_flow_json?: Record<string, unknown> | null;
  } | null;
  group?: {
    id: string;
    name?: string | null;
    code?: string | null;
  } | null;
  team_name?: string | null;
  creator?: {
    id: string;
    email?: string;
    username?: string;
    first_name?: string | null;
    last_name?: string | null;
  } | null;
  items?: Array<{
    id: string;
    description?: string;
    amount?: number;
    quantity?: number;
    notes?: string | null;
    file_id?: string | null;
    files?: Array<{
      id: string;
      file_name: string;
      mime_type?: string | null;
      public_url?: string | null;
    }>;
  }>;
  approvals?: {
    done: Array<{ action: string; step: string; comment: string | null; at: string }>;
    pending: Array<{ step: string; approver_type: string; approver_id: string | null }>;
  };
};

export type RequestTypeOption = {
  id: string;
  groupId?: string | null;
  name: string;
  description?: string | null;
  codePrefix?: string | null;
  code_prefix?: string | null;
  categoryKey?: string | null;
  category_key?: string | null;
  formSchema?: Record<string, unknown> | null;
  form_schema?: Record<string, unknown> | null;
  approvalFlowJson?: Record<string, unknown> | null;
  approval_flow_json?: Record<string, unknown> | null;
};

export type RequestItemInput = {
  description: string;
  amount: number;
  quantity?: number;
  notes?: string;
  file_id?: string;
  file_ids?: string[];
};

export type ProjectOption = {
  id: string;
  name: string;
};

export type TeamOption = {
  id: string;
  name: string;
  members?: Array<{
    userId: string;
    user: {
      id: string;
      email: string;
      username: string;
      firstName?: string | null;
      lastName?: string | null;
    };
  }>;
};

export type MyOrganization = {
  is_primary: boolean;
  organization: {
    id: string;
    name: string;
    code: string;
  };
};

export type LeaveBalanceSummary = {
  leave_type_key: string;
  entitled_days: number;
  ledger_delta_days: number;
  available_days: number;
};

export async function listRequests(params?: Record<string, unknown>) {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      query.set(key, String(value));
    });
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return httpRequest<RequestRecord[]>(`/requests${suffix}`);
}

export async function listApprovals(params?: Record<string, unknown>) {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      query.set(key, String(value));
    });
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return httpRequest<RequestRecord[]>(`/requests/approvals${suffix}`);
}

export async function listRequestTypes() {
  return httpRequest<RequestTypeOption[]>("/requests/types");
}

export async function getRequest(id: string) {
  return httpRequest<RequestRecord>(`/requests/${id}`);
}

export async function getRequestActions(id: string) {
  return httpRequest<string[]>(`/requests/${id}/actions`);
}

export async function createRequest(payload: {
  request_type_id: string;
  team_id?: string;
  currency?: string;
  data?: Record<string, unknown>;
  items: RequestItemInput[];
}) {
  return httpRequest<RequestRecord>("/requests", {
    method: "POST",
    body: payload,
  });
}

export async function updateRequest(
  id: string,
  payload: {
    team_id?: string;
    currency?: string;
    total_amount?: number;
    data?: Record<string, unknown>;
    items?: RequestItemInput[];
  }
) {
  return httpRequest<RequestRecord>(`/requests/${id}`, {
    method: "POST",
    body: payload,
  });
}

export async function submitRequest(id: string, comment?: string) {
  return httpRequest<RequestRecord>(`/requests/${id}/submit`, {
    method: "POST",
    body: { comment: comment || undefined },
  });
}

export async function deleteRequest(id: string) {
  return httpRequest<{ success: boolean }>(`/requests/${id}`, {
    method: "DELETE",
  });
}

export async function approveRequest(id: string, comment?: string) {
  return httpRequest<RequestRecord>(`/requests/${id}/approve`, {
    method: "POST",
    body: { action: "approve", comment: comment || undefined },
  });
}

export async function rejectRequest(id: string, comment?: string) {
  return httpRequest<RequestRecord>(`/requests/${id}/reject`, {
    method: "POST",
    body: { action: "reject", comment: comment || undefined },
  });
}

export async function confirmRequest(id: string) {
  return httpRequest<RequestRecord>(`/requests/${id}/confirm`, {
    method: "POST",
  });
}

export async function completeRequest(id: string) {
  return httpRequest<RequestRecord>(`/requests/${id}/complete`, {
    method: "POST",
  });
}

export const confirmRequestDisbursement = confirmRequest;

export type RequestDownloadAction =
  | "request_pdf"
  | "pv_pdf"
  | "request_with_attachments"
  | "pv_with_attachments"
  | "full_package"
  | "full_document";

export type DownloadedRequestFile = {
  file_name: string;
  mime_type: string;
  content_base64: string;
  generated_at?: string;
  request_id?: string;
  voucher_no?: string;
  voucher_number?: string;
  total_amount?: number;
};

export async function downloadRequestArtifact(
  id: string,
  payload: {
    action: RequestDownloadAction;
    voucher_id?: string;
    delivery?: "download" | "email";
    email_to?: string;
  },
) {
  return httpRequest<DownloadedRequestFile>(`/requests/${id}/download`, {
    method: "POST",
    body: {
      action: payload.action,
      voucher_id: payload.voucher_id || undefined,
      delivery: payload.delivery || undefined,
      email_to: payload.email_to || undefined,
    },
  });
}

export async function retireRequest(
  id: string,
  payload?: {
    notes?: string;
    voucher_id?: string;
    retired_amount?: number;
    retirement_file_ids?: string[];
    breakdown?: Record<string, unknown>;
  }
) {
  return httpRequest<RequestRecord>(`/requests/${id}/retire`, {
    method: "POST",
    body: {
      notes: payload?.notes || undefined,
      voucher_id: payload?.voucher_id || undefined,
      retired_amount: payload?.retired_amount ?? undefined,
      retirement_file_ids: payload?.retirement_file_ids?.length ? payload.retirement_file_ids : undefined,
      breakdown: payload?.breakdown || undefined,
    },
  });
}

export async function disburseRequest(
  id: string,
  payload?: {
    note?: string;
    amount?: number;
    method?: string;
    transaction_ref?: string;
    evidence_file_id?: string;
    evidence_file_ids?: string[];
    paid_from_account_id?: string;
    disbursed_at?: string;
  },
  options?: {
    traceId?: string;
  }
) {
  return httpRequest<RequestRecord>(`/finance/requests/${id}/disburse`, {
    method: "POST",
    body: payload ?? {},
    headers: options?.traceId ? { "x-trace-id": options.traceId } : undefined,
  });
}

export async function listProjects() {
  return httpRequest<ProjectOption[]>("/projects?active_only=true");
}

export async function listMyOrganizations() {
  return httpRequest<MyOrganization[]>("/organizations/my");
}

export async function listTeams(params?: { active_only?: boolean }) {
  const query = new URLSearchParams();
  query.set("active_only", params?.active_only === false ? "false" : "true");
  return httpRequest<TeamOption[]>(`/teams?${query.toString()}`);
}

export async function getMyLeaveBalance(params?: { year?: number; leave_type_key?: string }) {
  const query = new URLSearchParams();
  if (params?.year) query.set("year", String(params.year));
  if (params?.leave_type_key) query.set("leave_type_key", params.leave_type_key);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return httpRequest<{
    summary: LeaveBalanceSummary[];
  }>(`/requests/leave/balance${suffix}`);
}
