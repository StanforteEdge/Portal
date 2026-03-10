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
  payload: {
    note?: string;
    method?: string;
    transaction_ref?: string;
    amount?: number;
    evidence_file_id?: string;
    paid_from_account_id?: string;
  }
) {
  const response = await apiClient.post(`/finance/requests/${id}/disburse`, payload);
  return response.data?.data as RequestRecord;
}

export type FinanceAccountRecord = {
  id: string;
  organization_id: string | null;
  name: string;
  code: string | null;
  account_type: string;
  bank_name: string | null;
  account_name: string | null;
  account_number: string | null;
  branch_name: string | null;
  currency: string;
  opening_balance: number;
  current_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export async function listFinanceAccounts(params?: Record<string, unknown>) {
  const response = await apiClient.get("/finance/accounts", { params });
  return (response.data?.data ?? []) as FinanceAccountRecord[];
}

export async function getFinanceAccount(id: string) {
  const response = await apiClient.get(`/finance/accounts/${id}`);
  return response.data?.data as FinanceAccountRecord;
}

export async function createFinanceAccount(payload: {
  name: string;
  code?: string;
  account_type?: "bank" | "cash" | "wallet" | "other";
  bank_name?: string;
  account_name?: string;
  account_number?: string;
  branch_name?: string;
  currency?: string;
  opening_balance?: number;
  is_active?: boolean;
  metadata?: Record<string, unknown>;
}) {
  const response = await apiClient.post("/finance/accounts", payload);
  return response.data?.data as FinanceAccountRecord;
}

export async function updateFinanceAccount(
  id: string,
  payload: {
    name: string;
    code?: string;
    account_type?: "bank" | "cash" | "wallet" | "other";
    bank_name?: string;
    account_name?: string;
    account_number?: string;
    branch_name?: string;
    currency?: string;
    opening_balance?: number;
    is_active?: boolean;
    metadata?: Record<string, unknown>;
  }
) {
  const response = await apiClient.post(`/finance/accounts/${id}`, payload);
  return response.data?.data as FinanceAccountRecord;
}

export type FinanceLedgerRecord = {
  id: string;
  account_id: string;
  account_name: string;
  account_code: string | null;
  account_type: string;
  direction: "in" | "out" | "transfer";
  amount: number;
  currency: string;
  entry_date: string;
  description: string | null;
  source_type: string | null;
  source_id: string | null;
  created_at: string;
};

export async function listFinanceLedger(params?: Record<string, unknown>) {
  const response = await apiClient.get("/finance/ledger", { params });
  return (response.data?.data ?? []) as FinanceLedgerRecord[];
}

export type FinanceIncomeRecord = {
  id: string;
  account_id: string;
  amount: number;
  currency: string;
  received_at: string;
  reference: string | null;
  payer: string | null;
  notes: string | null;
  file_id: string | null;
  created_at: string;
};

export async function createFinanceIncome(payload: {
  account_id: string;
  amount: number;
  currency?: string;
  received_at?: string;
  reference?: string;
  payer?: string;
  notes?: string;
  file_id?: string;
}) {
  const response = await apiClient.post("/finance/income", payload);
  return response.data?.data as FinanceIncomeRecord;
}

export async function listFinanceIncome(params?: Record<string, unknown>) {
  const response = await apiClient.get("/finance/income", { params });
  return (response.data?.data ?? []) as Array<
    FinanceIncomeRecord & {
      account_name: string;
      account_code: string | null;
      file: { id: string; file_name: string; public_url: string | null } | null;
    }
  >;
}

export async function createFinanceTransfer(payload: {
  from_account_id: string;
  to_account_id: string;
  amount: number;
  currency?: string;
  reference?: string;
  note?: string;
  transfer_at?: string;
}) {
  const response = await apiClient.post("/finance/transfers", payload);
  return response.data?.data as {
    success: boolean;
    source_id: string;
    from_account_id: string;
    to_account_id: string;
    amount: number;
    currency: string;
    transferred_at: string;
  };
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
    paid_from_account: { id: string; name: string; code: string | null; account_type: string } | null;
    disbursed_at: string;
    retired_at: string | null;
    verified_at: string | null;
    evidence_file: { id: string; file_name: string; mime_type: string | null; public_url: string | null } | null;
    retirement_files: Array<{ id: string; file_name: string; mime_type: string | null; public_url: string | null }>;
  }>;
}

export type FinancePaymentVoucherListRecord = {
  id: string;
  request_id: string;
  request_number: string;
  request_status: string;
  request_type: string;
  request_creator_name: string;
  request_total_amount: number;
  voucher_number: string;
  amount: number;
  retired_amount: number;
  voucher_balance: number;
  retirement_status: string;
  method: string | null;
  transaction_ref: string | null;
  note: string | null;
  disbursed_at: string;
  retired_at: string | null;
  verified_at: string | null;
  paid_from_account: { id: string; name: string; code: string | null; account_type: string } | null;
  evidence_file: { id: string; file_name: string; mime_type: string | null; public_url: string | null } | null;
};

export async function listFinancePaymentVouchers(params?: Record<string, unknown>) {
  const response = await apiClient.get("/finance/payment-vouchers", { params });
  const payload = response.data?.data ?? { data: [], meta: {} };
  return payload as {
    data: FinancePaymentVoucherListRecord[];
    meta: { page: number; per_page: number; total: number; last_page: number };
  };
}
