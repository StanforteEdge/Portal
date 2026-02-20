import apiClient from "@/utils/httpClient";

export type RequestItemInput = {
  description: string;
  amount: number;
  quantity?: number;
  notes?: string;
  file_id?: string;
};

export type ManualDisbursementInput = {
  voucher_number: string;
  amount: number;
  method?: string;
  transaction_ref?: string;
  note?: string;
  disbursed_at?: string;
  evidence_file_id?: string;
  retired_amount?: number;
  retirement_status?: string;
  retirement_file_ids?: string[];
};

export type RequestRecord = {
  id: string;
  status: string;
  request_number: string;
  voucher_number: string | null;
  total_amount: number | null;
  currency: string;
  created_at: string;
  updated_at: string;
  data?: Record<string, unknown> | null;
  request_type?: {
    id: string;
    name: string;
    code_prefix: string;
    category_key?: string | null;
    approval_flow_json?: Record<string, unknown> | null;
    form_schema?: Record<string, unknown> | null;
  };
  creator?: { id: string; email: string; username: string; first_name: string | null; last_name: string | null };
  items: Array<{
    id: string;
    description: string;
    amount: number;
    quantity: number;
    notes: string | null;
    file_id: string | null;
  }>;
  approvals?: {
    done: Array<{ action: string; step: string; comment: string | null; at: string }>;
    pending: Array<{ step: string; approver_type: string; approver_id: string | null }>;
  };
  approval_view_status?: "pending" | "approved" | "rejected" | "none";
};

export type RequestGroupOption = {
  id: string;
  name: string;
  code: string;
  is_active?: boolean;
};

export type RequestTypeOption = {
  id: string;
  group_id: string;
  name: string;
  code_prefix: string;
  category_key?: string | null;
  form_schema?: Record<string, unknown> | null;
  description?: string | null;
  approval_limit?: number | null;
  approval_flow_json?: Record<string, unknown> | null;
  is_active: boolean;
};

function toRequestTypeOption(item: any): RequestTypeOption {
  return {
    id: String(item.id),
    group_id: String(item.group_id ?? item.groupId ?? ""),
    name: String(item.name ?? ""),
    code_prefix: String(item.code_prefix ?? item.codePrefix ?? ""),
    category_key: item.category_key ?? item.categoryKey ?? null,
    form_schema: (item.form_schema ?? item.formSchema ?? null) as Record<string, unknown> | null,
    description: item.description ?? null,
    approval_limit:
      item.approval_limit !== undefined && item.approval_limit !== null
        ? Number(item.approval_limit)
        : item.approvalLimit !== undefined && item.approvalLimit !== null
          ? Number(item.approvalLimit)
          : null,
    approval_flow_json: (item.approval_flow_json ?? item.approvalFlowJson ?? null) as Record<string, unknown> | null,
    is_active: Boolean(item.is_active ?? item.isActive ?? true),
  };
}

export async function listRequestGroups() {
  const response = await apiClient.get("/requests/groups");
  const data = (response.data?.data ?? []) as any[];
  return data.map((item) => ({
    id: String(item.id),
    name: String(item.name),
    code: String(item.code),
    is_active: Boolean(item.is_active ?? item.isActive ?? true),
  })) as RequestGroupOption[];
}

export async function listRequestTypes(params?: { group_id?: string; include_inactive?: boolean }) {
  const response = await apiClient.get("/requests/types", {
    params: {
      ...(params?.group_id ? { group_id: params.group_id } : {}),
      ...(params?.include_inactive ? { include_inactive: "true" } : {}),
    },
  });
  return ((response.data?.data ?? []) as any[]).map(toRequestTypeOption);
}

export async function createRequestType(payload: {
  group_id: string;
  name: string;
  code_prefix: string;
  category_key?: string;
  form_schema?: Record<string, unknown>;
  description?: string;
  approval_limit?: number;
  approval_flow_json?: Record<string, unknown>;
  is_active?: boolean;
}) {
  const response = await apiClient.post("/requests/types", payload);
  return toRequestTypeOption(response.data?.data ?? {});
}

export async function updateRequestType(
  id: string,
  payload: {
    name?: string;
    code_prefix?: string;
    category_key?: string;
    form_schema?: Record<string, unknown>;
    description?: string;
    approval_limit?: number;
    approval_flow_json?: Record<string, unknown>;
    is_active?: boolean;
  }
) {
  const response = await apiClient.post(`/requests/types/${id}`, payload);
  return toRequestTypeOption(response.data?.data ?? {});
}

export async function listRequests(params?: Record<string, unknown>) {
  const response = await apiClient.get("/requests", { params });
  return (response.data?.data ?? []) as RequestRecord[];
}

export async function listApprovals(params?: Record<string, unknown>) {
  const response = await apiClient.get("/requests/approvals", { params });
  return (response.data?.data ?? []) as RequestRecord[];
}

export async function getRequest(id: string) {
  const response = await apiClient.get(`/requests/${id}`);
  return response.data?.data as RequestRecord;
}

export async function getRequestActions(id: string) {
  const response = await apiClient.get(`/requests/${id}/actions`);
  return (response.data?.data ?? []) as string[];
}

export async function createRequest(payload: {
  request_type_id: string;
  team_id?: string;
  currency?: string;
  data?: Record<string, unknown>;
  items: RequestItemInput[];
}) {
  const response = await apiClient.post("/requests", payload);
  return response.data?.data as RequestRecord;
}

export async function submitRequest(id: string, comment?: string) {
  const response = await apiClient.post(`/requests/${id}/submit`, { comment: comment || undefined });
  return response.data?.data as RequestRecord;
}

export async function approveRequest(id: string, comment?: string) {
  const response = await apiClient.post(`/requests/${id}/approve`, { action: "approve", comment: comment || undefined });
  return response.data?.data as RequestRecord;
}

export async function rejectRequest(id: string, comment?: string) {
  const response = await apiClient.post(`/requests/${id}/reject`, { action: "reject", comment: comment || undefined });
  return response.data?.data as RequestRecord;
}

export async function confirmRequest(id: string) {
  const response = await apiClient.post(`/requests/${id}/confirm`);
  return response.data?.data as RequestRecord;
}

export async function confirmRequestVoucher(id: string, voucherId: string) {
  const response = await apiClient.post(`/requests/${id}/payment-vouchers/${voucherId}/confirm`);
  return response.data?.data as RequestRecord;
}

export async function completeRequest(id: string) {
  const response = await apiClient.post(`/requests/${id}/complete`);
  return response.data?.data as RequestRecord;
}

export async function retireRequest(
  id: string,
  payload: { voucher_id?: string; notes?: string; retired_amount?: number; retirement_file_ids?: string[] }
) {
  const response = await apiClient.post(`/requests/${id}/retire`, payload);
  return response.data?.data as RequestRecord;
}

export async function generateRequestPdf(id: string) {
  const response = await apiClient.post(`/requests/${id}/download`, { action: "request_pdf" });
  return response.data?.data as { file_name: string; mime_type: string; content_base64: string };
}

export async function generateRequestPv(id: string) {
  const response = await apiClient.post(`/requests/${id}/download`, { action: "pv_pdf" });
  return response.data?.data as { file_name: string; mime_type: string; content_base64: string };
}

export async function generateRequestPvByVoucher(id: string, voucherId: string) {
  const response = await apiClient.post(`/requests/${id}/download`, {
    action: "pv_pdf",
    voucher_id: voucherId,
  });
  return response.data?.data as { file_name: string; mime_type: string; content_base64: string };
}

export async function createManualRequestEntry(payload: {
  request_type_id: string;
  staff_id: string;
  request_id?: string;
  team_id?: string;
  organization_id?: string;
  status?: string;
  created_at?: string;
  currency?: string;
  total_amount?: number;
  data?: Record<string, unknown>;
  approvals?: Array<{ role: string; name?: string; date?: string; done?: boolean }>;
  items?: RequestItemInput[];
  disbursements?: ManualDisbursementInput[];
}) {
  const response = await apiClient.post("/requests/manual-entry", payload);
  return response.data?.data as RequestRecord;
}

export async function updateManualRequestEntry(
  id: string,
  payload: {
    request_type_id: string;
    staff_id: string;
    request_id?: string;
    team_id?: string;
    organization_id?: string;
    status?: string;
    created_at?: string;
    currency?: string;
    total_amount?: number;
    data?: Record<string, unknown>;
    approvals?: Array<{ role: string; name?: string; date?: string; done?: boolean }>;
    items?: RequestItemInput[];
    disbursements?: ManualDisbursementInput[];
  }
) {
  const response = await apiClient.post(`/requests/${id}/manual-entry`, payload);
  return response.data?.data as RequestRecord;
}

export async function deleteManualRequestEntry(id: string) {
  const response = await apiClient.delete(`/requests/${id}/manual-entry`);
  return response.data?.data ?? { success: true };
}

export async function checkManualRequestNumber(
  requestId: string,
  params?: { request_type_id?: string; exclude_id?: string }
) {
  const response = await apiClient.get("/requests/manual-entry/check-number", {
    params: {
      request_id: requestId,
      ...(params?.request_type_id ? { request_type_id: params.request_type_id } : {}),
      ...(params?.exclude_id ? { exclude_id: params.exclude_id } : {}),
    },
  });
  return (response.data?.data ?? { exists: false, request_id: null }) as { exists: boolean; request_id: string | null };
}

export async function generateFullRequestPackage(
  id: string,
  payload?: { delivery?: "download" | "email"; email_to?: string }
) {
  const response = await apiClient.post(`/requests/${id}/download`, {
    action: "full_package",
    ...(payload ?? {}),
  });
  return response.data?.data as {
    file_name: string;
    mime_type?: string;
    content_base64?: string;
    delivery?: "email" | "download";
  };
}

export async function generateRequestPackageWithAttachments(id: string) {
  const response = await apiClient.post(`/requests/${id}/download`, {
    action: "request_with_attachments",
  });
  return response.data?.data as { file_name: string; mime_type: string; content_base64: string };
}

export async function generateVoucherPackageWithAttachments(id: string, voucherId: string) {
  const response = await apiClient.post(`/requests/${id}/download`, {
    action: "pv_with_attachments",
    voucher_id: voucherId,
  });
  return response.data?.data as { file_name: string; mime_type: string; content_base64: string };
}
