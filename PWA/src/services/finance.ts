import apiClient from "@/utils/httpClient";
import type { RequestRecord } from "./requests";

export type FinanceSummary = {
  total_requests: number;
  total_amount: number | null;
  average_amount: number | null;
  by_status: Array<{ status: string; count: number; total_amount: number | null }>;
};

export async function getFinanceSummary(params?: Record<string, unknown>) {
  const response = await apiClient.get("/finance/summary", { params });
  return response.data?.data as FinanceSummary;
}

export async function listFinanceRequests(params?: Record<string, unknown>) {
  const response = await apiClient.get("/finance/requests", { params });
  const raw = response.data?.data;
  const payload = Array.isArray(raw)
    ? { data: raw, meta: response.data?.meta ?? {} }
    : raw && typeof raw === "object"
      ? (raw as { data?: RequestRecord[]; meta?: { page: number; per_page: number; total: number; last_page: number } })
      : { data: [], meta: {} };
  const normalized = ((payload.data ?? []) as any[]).map((item) => {
    const createdAt = item.created_at ?? item.createdAt;
    const year = createdAt ? new Date(createdAt).getFullYear() : new Date().getFullYear();
    const codePrefix = String(item.requestType?.codePrefix ?? item.requestType?.code_prefix ?? "REQ").toUpperCase();
    const derivedRequestNumber = `${codePrefix}/${year}/${String(item.id)}`;
    return {
      id: String(item.id),
      status: String(item.status ?? ""),
      request_number: String(item.request_number ?? derivedRequestNumber),
      voucher_number: item.data?.voucher_number ?? null,
      total_amount:
        item.total_amount !== undefined && item.total_amount !== null
          ? Number(item.total_amount)
          : item.totalAmount !== undefined && item.totalAmount !== null
            ? Number(item.totalAmount)
            : null,
      currency: String(item.currency ?? "NGN"),
      created_at: createdAt,
      updated_at: item.updated_at ?? item.updatedAt,
      data: item.data ?? null,
      request_type: item.requestType
        ? {
            id: String(item.requestType.id),
            name: String(item.requestType.name ?? ""),
            code_prefix: String(item.requestType.codePrefix ?? item.requestType.code_prefix ?? ""),
          }
        : item.request_type,
      creator: item.creator
        ? {
            id: String(item.creator.id),
            email: String(item.creator.email ?? ""),
            username: String(item.creator.username ?? ""),
            first_name: item.creator.firstName ?? null,
            last_name: item.creator.lastName ?? null,
          }
        : item.creator,
      items: Array.isArray(item.items) ? item.items : [],
      approvals: item.approvals ?? undefined,
    };
  }) as RequestRecord[];

  return {
    data: normalized,
    meta: payload.meta as { page: number; per_page: number; total: number; last_page: number },
  };
}

export async function disburseFinanceRequest(
  id: string,
  payload: { note?: string; method?: string; transaction_ref?: string; amount?: number; evidence_file_id?: string }
) {
  const response = await apiClient.post(`/finance/requests/${id}/disburse`, payload);
  return response.data?.data as RequestRecord;
}

export async function listFinanceRequestPaymentVouchers(id: string) {
  const response = await apiClient.get(`/finance/requests/${id}/payment-vouchers`);
  return (response.data?.data ?? []) as Array<{
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
    disbursed_at: string;
    retired_at: string | null;
    verified_at: string | null;
    evidence_file: { id: string; file_name: string; mime_type: string | null; public_url: string | null } | null;
    retirement_files: Array<{ id: string; file_name: string; mime_type: string | null; public_url: string | null }>;
  }>;
}
