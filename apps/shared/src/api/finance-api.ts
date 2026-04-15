import type { HttpRequest } from "../auth/http-client";

function toQuery(params?: Record<string, unknown>) {
  const query = new URLSearchParams();
  if (!params) return "";
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, String(value));
  });
  const raw = query.toString();
  return raw ? `?${raw}` : "";
}

export type FinanceLedgerEntry = {
  id: string;
  entry_date?: string;
  date?: string;
  direction?: "in" | "out" | string;
  amount?: number;
  currency?: string;
  reference?: string | null;
  description?: string | null;
  account_name?: string | null;
  source_type?: string | null;
  status?: string | null;
  [key: string]: unknown;
};

export type FinanceBudgetRecord = {
  id: string;
  year?: number;
  month?: number | null;
  quarter?: number | null;
  status?: string;
  currency?: string;
  total_budget?: number;
  total_actual?: number;
  variance_amount?: number;
  title?: string | null;
  [key: string]: unknown;
};

export type FinanceInvoiceRecord = {
  id: string;
  invoice_number?: string | null;
  customer_name?: string | null;
  issue_date?: string | null;
  due_date?: string | null;
  total_amount?: number;
  paid_amount?: number;
  outstanding_amount?: number;
  status?: string;
  currency?: string;
  [key: string]: unknown;
};

export type FinanceBillRecord = {
  id: string;
  bill_number?: string | null;
  vendor_name?: string | null;
  bill_date?: string | null;
  due_date?: string | null;
  total_amount?: number;
  paid_amount?: number;
  outstanding_amount?: number;
  status?: string;
  currency?: string;
  [key: string]: unknown;
};

export type FinanceAssetRecord = {
  id: string;
  asset_id?: string | null;
  asset_description?: string | null;
  asset_code?: string | null;
  asset_name?: string | null;
  category?: string | null;
  status?: string | null;
  condition?: string | null;
  location_project?: string | null;
  serial_tag_no?: string | null;
  assigned_to_user_id?: string | null;
  assigned_to_name?: string | null;
  purchase_date?: string | null;
  purchase_cost?: number | null;
  useful_life_years?: number | null;
  salvage_value?: number | null;
  supplier?: string | null;
  disposed_at?: string | null;
  disposal_method?: string | null;
  disposal_proceeds?: number | null;
  current_value?: number | null;
  location?: string | null;
  currency?: string | null;
  [key: string]: unknown;
};

export type FinanceChartAccountRecord = {
  id: string;
  code: string;
  name: string;
  type?: string;
  category?: string;
  normal_balance?: string;
  is_active?: boolean;
  [key: string]: unknown;
};

export type FinanceAccountRecord = {
  id: string;
  name: string;
  code?: string | null;
  account_type?: string;
  bank_name?: string | null;
  account_name?: string | null;
  account_number?: string | null;
  branch_name?: string | null;
  currency?: string;
  opening_balance?: number;
  current_balance?: number;
  is_active?: boolean;
  [key: string]: unknown;
};

export type FinanceReportingPeriodRecord = {
  id: string;
  year: number;
  month?: number | null;
  quarter?: number | null;
  label?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  [key: string]: unknown;
};

export type FinancePartyRecord = {
  id: string;
  name?: string;
  code?: string | null;
  email?: string | null;
  phone?: string | null;
  is_active?: boolean;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  [key: string]: unknown;
};

export type CustomerRecord = FinancePartyRecord & {
  outstanding_amount?: number;
  credit_limit?: number;
  pan?: string | null;
  tpin?: string | null;
};

export type VendorRecord = FinancePartyRecord & {
  outstanding_amount?: number;
  opening_balance?: number;
  tax_id?: string | null;
};

export type PartyTransaction = {
  id: string;
  date: string;
  type: "invoice" | "payment" | "credit_note" | "receipt";
  reference: string;
  amount: number;
  balance: number;
  status?: string;
};

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

export type RequestRecord = {
  id: string;
  number: string;
  status: string;
  type: string;
  type_label?: string;
  creator?: { id: string; first_name?: string; last_name?: string; email: string };
  created_at: string;
  updated_at: string;
  total_amount?: number;
  currency?: string;
  [key: string]: unknown;
};

export function createFinanceApi(httpRequest: HttpRequest) {
  return {
    listRequests(params?: Record<string, unknown>) {
      const suffix = toQuery(params);
      return httpRequest<RequestRecord[]>(`/finance/requests${suffix}`);
    },

    listPaymentVouchers(params?: Record<string, unknown>) {
      const suffix = toQuery(params);
      return httpRequest<FinancePaymentVoucherRecord[]>(`/finance/payment-vouchers${suffix}`);
    },

    listRequestPaymentVouchers(requestId: string) {
      return httpRequest<FinancePaymentVoucherRecord[]>(`/finance/requests/${requestId}/payment-vouchers`);
    },

    updatePaymentVoucher(requestId: string, voucherId: string, payload: Record<string, unknown>) {
      return httpRequest(`/finance/requests/${requestId}/payment-vouchers/${voucherId}`, {
        method: "POST",
        body: payload,
      });
    },

    listAccounts(params?: Record<string, unknown>) {
      const suffix = toQuery(params);
      return httpRequest<FinanceAccountRecord[]>(`/finance/accounts${suffix}`);
    },

    getAccount(id: string) {
      return httpRequest<FinanceAccountRecord>(`/finance/accounts/${id}`);
    },

    listLedger(params?: Record<string, unknown>) {
      return httpRequest<FinanceLedgerEntry[]>(`/finance/ledger${toQuery(params)}`);
    },

    listManualEntries(params?: Record<string, unknown>) {
      return httpRequest<{ data: Record<string, unknown>[]; meta?: Record<string, unknown> }>(`/finance/manual-entry${toQuery(params)}`);
    },

    createManualEntry(payload: Record<string, unknown>) {
      return httpRequest<Record<string, unknown>>(`/finance/manual-entry`, {
        method: "POST",
        body: payload,
      });
    },

    listBudgets(params?: Record<string, unknown>) {
      return httpRequest<FinanceBudgetRecord[]>(`/finance/budgets${toQuery(params)}`);
    },

    getBudget(id: string) {
      return httpRequest<FinanceBudgetRecord>(`/finance/budgets/${id}`);
    },

    listSalesInvoices(params?: Record<string, unknown>) {
      return httpRequest<FinanceInvoiceRecord[]>(`/finance/sales-invoices${toQuery(params)}`);
    },

    getSalesInvoice(id: string) {
      return httpRequest<FinanceInvoiceRecord>(`/finance/sales-invoices/${id}`);
    },

    listBills(params?: Record<string, unknown>) {
      return httpRequest<FinanceBillRecord[]>(`/finance/bills${toQuery(params)}`);
    },

    getBill(id: string) {
      return httpRequest<FinanceBillRecord>(`/finance/bills/${id}`);
    },

    listAssets(params?: Record<string, unknown>) {
      return httpRequest<FinanceAssetRecord[]>(`/finance/assets${toQuery(params)}`);
    },

    getAsset(id: string) {
      return httpRequest<FinanceAssetRecord>(`/finance/assets/${id}`);
    },

    listAssetDisposals(params?: Record<string, unknown>) {
      return httpRequest<FinanceAssetRecord[]>(`/finance/assets/disposals${toQuery(params)}`);
    },

    createAsset(payload: Record<string, unknown>) {
      return httpRequest<FinanceAssetRecord>(`/finance/assets`, {
        method: "POST",
        body: payload,
      });
    },

    updateAsset(id: string, payload: Record<string, unknown>) {
      return httpRequest<FinanceAssetRecord>(`/finance/assets/${id}`, {
        method: "POST",
        body: payload,
      });
    },

    verifyAsset(id: string, payload: Record<string, unknown>) {
      return httpRequest<FinanceAssetRecord>(`/finance/assets/${id}/verify`, {
        method: "POST",
        body: payload,
      });
    },

    disposeAsset(id: string, payload: Record<string, unknown>) {
      return httpRequest<FinanceAssetRecord>(`/finance/assets/${id}/dispose`, {
        method: "POST",
        body: payload,
      });
    },

    listChartAccounts(params?: Record<string, unknown>) {
      return httpRequest<FinanceChartAccountRecord[]>(`/finance/chart-accounts${toQuery(params)}`);
    },

    listReportingPeriods(params?: Record<string, unknown>) {
      return httpRequest<FinanceReportingPeriodRecord[]>(`/finance/reporting-periods${toQuery(params)}`);
    },

    listCustomers(params?: Record<string, unknown>) {
      return httpRequest<CustomerRecord[]>(`/finance/customers${toQuery(params)}`);
    },

    getCustomer(id: string) {
      return httpRequest<CustomerRecord>(`/finance/customers/${id}`);
    },

    getCustomerTransactions(id: string) {
      return httpRequest<PartyTransaction[]>(`/finance/customers/${id}/transactions`);
    },

    listVendors(params?: Record<string, unknown>) {
      return httpRequest<VendorRecord[]>(`/finance/vendors${toQuery(params)}`);
    },

    getVendor(id: string) {
      return httpRequest<VendorRecord>(`/finance/vendors/${id}`);
    },

    getVendorTransactions(id: string) {
      return httpRequest<PartyTransaction[]>(`/finance/vendors/${id}/transactions`);
    },

    listDonors(params?: Record<string, unknown>) {
      return httpRequest<FinancePartyRecord[]>(`/finance/donors${toQuery(params)}`);
    },

    listFunds(params?: Record<string, unknown>) {
      return httpRequest<FinancePartyRecord[]>(`/finance/funds${toQuery(params)}`);
    },

    listGrants(params?: Record<string, unknown>) {
      return httpRequest<FinancePartyRecord[]>(`/finance/grants${toQuery(params)}`);
    },

    getSettings() {
      return httpRequest<Record<string, unknown>>("/finance/settings");
    },

    getExecutiveSummary(params?: Record<string, unknown>) {
      return httpRequest<Record<string, unknown>>(`/finance/reports/executive-summary${toQuery(params)}`);
    },

    getIncomeSummary(params?: Record<string, unknown>) {
      return httpRequest<Record<string, unknown>>(`/finance/reports/income-summary${toQuery(params)}`);
    },

    getExpenseSummary(params?: Record<string, unknown>) {
      return httpRequest<Record<string, unknown>>(`/finance/reports/expense-summary${toQuery(params)}`);
    },

    getProfitLoss(params?: Record<string, unknown>) {
      return httpRequest<Record<string, unknown>>(`/finance/reports/profit-loss${toQuery(params)}`);
    },

    getBalancesReport(params?: Record<string, unknown>) {
      return httpRequest<Record<string, unknown>>(`/finance/reports/balances${toQuery(params)}`);
    },

    getReceivablesReport(params?: Record<string, unknown>) {
      return httpRequest<Record<string, unknown>>(`/finance/reports/receivables${toQuery(params)}`);
    },

    getPayablesReport(params?: Record<string, unknown>) {
      return httpRequest<Record<string, unknown>>(`/finance/reports/payables${toQuery(params)}`);
    },

    getBudgetVsActualReport(params?: Record<string, unknown>) {
      return httpRequest<Record<string, unknown>>(`/finance/reports/budget-vs-actual${toQuery(params)}`);
    },

    getGrantUtilizationReport(params?: Record<string, unknown>) {
      return httpRequest<Record<string, unknown>>(`/finance/reports/grant-utilization${toQuery(params)}`);
    },
  };
}

export type FinanceApi = ReturnType<typeof createFinanceApi>;
