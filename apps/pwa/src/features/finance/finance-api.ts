import { httpRequest } from "@/lib/core";
import type { RequestRecord } from "@/features/requests/requests-api";

export async function listFinanceRequests(params?: Record<string, unknown>) {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      query.set(key, String(value));
    });
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return httpRequest<RequestRecord[]>(`/finance/requests${suffix}`);
}

export type FinanceAccountOption = {
  id: string;
  name: string;
  code: string | null;
  account_type: string;
  currency?: string;
  is_active?: boolean;
};

export async function listFinanceAccounts(params?: Record<string, unknown>) {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      query.set(key, String(value));
    });
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return httpRequest<FinanceAccountOption[]>(`/finance/accounts${suffix}`);
}

export type FinancePaymentVoucherRecord = {
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
  evidence_files?: Array<{ id: string; file_name: string; mime_type: string | null; public_url: string | null }>;
};

export async function listFinancePaymentVouchers(params?: Record<string, unknown>) {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      query.set(key, String(value));
    });
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return httpRequest<FinancePaymentVoucherRecord[]>(`/finance/payment-vouchers${suffix}`);
}

export async function listRequestPaymentVouchers(requestId: string) {
  return httpRequest<FinancePaymentVoucherRecord[]>(`/finance/requests/${requestId}/payment-vouchers`);
}
