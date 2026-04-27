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
  tax_number?: string | null;
  contact_type?: "customer" | "vendor" | "both";
  sub_type?: "individual" | "business";
  company_name?: string | null;
  contact_persons?: ContactPersonRecord[];
};

export type ContactPersonRecord = {
  id: string;
  salutation?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  designation?: string | null;
  department?: string | null;
  is_primary: boolean;
};

export type ContactRecord = FinancePartyRecord & {
  contact_type: "customer" | "vendor" | "both";
  sub_type: "individual" | "business";
  company_name?: string | null;
  legal_name?: string | null;
  billing_address?: Record<string, unknown> | null;
  shipping_address?: Record<string, unknown> | null;
  tax_number?: string | null;
  is_taxable?: boolean;
  payment_terms?: number | null;
  credit_limit?: number | null;
  opening_balance?: number | null;
  website?: string | null;
  notes?: string | null;
  primary_contact_id?: string | null;
  contact_persons: ContactPersonRecord[];
  outstanding_amount?: number;
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
  retirement_files?: Array<{ id: string; file_name: string; mime_type: string | null; public_url: string | null }>;
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

type PaginatedResponse<T> = {
  result: T[];
  total: number;
  total_result: number;
  per_page: number;
  page: number;
  pages: number;
};

type DownloadedFile = {
  file_name: string;
  mime_type: string;
  content_base64: string;
};

function asPaginatedResponse<T>(
  response: unknown,
  endpoint: string,
) {
  if (!response || typeof response !== "object" || Array.isArray(response)) {
    throw new Error(`${endpoint} must return a paginated response object.`);
  }

  const payload = response as {
    result?: unknown;
    total?: unknown;
    total_result?: unknown;
    per_page?: unknown;
    page?: unknown;
    pages?: unknown;
  };
  if (!Array.isArray(payload.result)) {
    throw new Error(`${endpoint} response is missing result[].`);
  }
  const page = Number(payload.page);
  const perPage = Number(payload.per_page);
  const total = Number(payload.total);
  const totalResult = Number(payload.total_result);
  const pages = Number(payload.pages);

  if (
    !Number.isFinite(page) ||
    !Number.isFinite(perPage) ||
    !Number.isFinite(total) ||
    !Number.isFinite(totalResult) ||
    !Number.isFinite(pages)
  ) {
    throw new Error(
      `${endpoint} response must include numeric total, total_result, per_page, page, and pages.`,
    );
  }

  return {
    result: payload.result as T[],
    total: Math.max(0, Math.trunc(total)),
    total_result: Math.max(0, Math.trunc(totalResult)),
    per_page: Math.max(1, Math.trunc(perPage)),
    page: Math.max(1, Math.trunc(page)),
    pages: Math.max(1, Math.trunc(pages)),
  };
}

export function createFinanceApi(httpRequest: HttpRequest) {
  return {
    async listRequests(params?: Record<string, unknown>) {
      const suffix = toQuery(params);
      const response = await httpRequest<any>(`/finance/requests${suffix}`);
      const paged = asPaginatedResponse<RequestRecord>(response, "/finance/requests");
      return paged.result;
    },

    async listRequestsPaged(params?: Record<string, unknown>) {
      const suffix = toQuery(params);
      const response = await httpRequest<any>(`/finance/requests${suffix}`);
      return asPaginatedResponse<RequestRecord>(response, "/finance/requests");
    },

    listPaymentVouchers(params?: Record<string, unknown>) {
      const suffix = toQuery(params);
      return httpRequest<PaginatedResponse<FinancePaymentVoucherRecord>>(
        `/finance/payment-vouchers${suffix}`,
      ).then((response) =>
        asPaginatedResponse<FinancePaymentVoucherRecord>(response, "/finance/payment-vouchers").result,
      );
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
      return httpRequest<PaginatedResponse<FinanceLedgerEntry>>(`/finance/ledger${toQuery(params)}`).then(
        (response) => asPaginatedResponse<FinanceLedgerEntry>(response, "/finance/ledger").result,
      );
    },

    async listLedgerPaged(params?: Record<string, unknown>) {
      const response = await httpRequest<PaginatedResponse<FinanceLedgerEntry>>(
        `/finance/ledger${toQuery(params)}`,
      );
      return asPaginatedResponse<FinanceLedgerEntry>(response, "/finance/ledger");
    },

    exportLedger(params?: Record<string, unknown>) {
      return httpRequest<DownloadedFile>(`/finance/ledger/export${toQuery(params)}`);
    },

    listManualEntries(params?: Record<string, unknown>) {
      return httpRequest<{
        result: Record<string, unknown>[];
        total: number;
        total_result: number;
        per_page: number;
        page: number;
        pages: number;
      }>(`/finance/manual-entry${toQuery(params)}`);
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
      return httpRequest<PaginatedResponse<FinanceInvoiceRecord>>(
        `/finance/sales-invoices${toQuery(params)}`,
      ).then((response) =>
        asPaginatedResponse<FinanceInvoiceRecord>(response, "/finance/sales-invoices").result,
      );
    },

    getSalesInvoice(id: string) {
      return httpRequest<FinanceInvoiceRecord>(`/finance/sales-invoices/${id}`);
    },

    listBills(params?: Record<string, unknown>) {
      return httpRequest<PaginatedResponse<FinanceBillRecord>>(`/finance/bills${toQuery(params)}`).then(
        (response) => asPaginatedResponse<FinanceBillRecord>(response, "/finance/bills").result,
      );
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
      return httpRequest<any>(`/finance/chart-accounts${toQuery(params)}`).then((response) => {
        const rows = Array.isArray(response?.result) ? response.result : Array.isArray(response) ? response : [];
        return {
          result: rows,
          total: Number(response?.total ?? response?.total_result ?? rows.length),
          total_result: Number(response?.total_result ?? response?.total ?? rows.length),
          per_page: Number(response?.per_page ?? 20),
          page: Number(response?.page ?? 1),
          pages: Number(response?.pages ?? 1)
        };
      });
    },

    listReportingPeriods(params?: Record<string, unknown>) {
      return httpRequest<FinanceReportingPeriodRecord[]>(`/finance/reporting-periods${toQuery(params)}`);
    },

    listCustomers(params?: Record<string, unknown>) {
      return httpRequest<any>(`/finance/customers${toQuery(params)}`).then((response) => {
        const rows = Array.isArray(response?.result) ? response.result : Array.isArray(response) ? response : [];
        return {
          result: rows,
          total: Number(response?.total ?? response?.total_result ?? rows.length),
          total_result: Number(response?.total_result ?? response?.total ?? rows.length),
          per_page: Number(response?.per_page ?? 20),
          page: Number(response?.page ?? 1),
          pages: Number(response?.pages ?? 1)
        };
      });
    },

    getCustomer(id: string) {
      return httpRequest<CustomerRecord>(`/finance/customers/${id}`);
    },

    createCustomer(payload: Record<string, unknown>) {
      return httpRequest<CustomerRecord>("/finance/customers", { method: "POST", body: payload });
    },

    updateCustomer(id: string, payload: Record<string, unknown>) {
      return httpRequest<CustomerRecord>(`/finance/customers/${id}`, { method: "POST", body: payload });
    },

    getCustomerTransactions(id: string) {
      return httpRequest<PartyTransaction[]>(`/finance/customers/${id}/transactions`);
    },

    listVendors(params?: Record<string, unknown>) {
      return httpRequest<any>(`/finance/vendors${toQuery(params)}`).then((response) => {
        const rows = Array.isArray(response?.result) ? response.result : Array.isArray(response) ? response : [];
        return {
          result: rows,
          total: Number(response?.total ?? response?.total_result ?? rows.length),
          total_result: Number(response?.total_result ?? response?.total ?? rows.length),
          per_page: Number(response?.per_page ?? 20),
          page: Number(response?.page ?? 1),
          pages: Number(response?.pages ?? 1)
        };
      });
    },

    getVendor(id: string) {
      return httpRequest<VendorRecord>(`/finance/vendors/${id}`);
    },

    createVendor(payload: Record<string, unknown>) {
      return httpRequest<VendorRecord>("/finance/vendors", { method: "POST", body: payload });
    },

    updateVendor(id: string, payload: Record<string, unknown>) {
      return httpRequest<VendorRecord>(`/finance/vendors/${id}`, { method: "POST", body: payload });
    },

    getVendorTransactions(id: string) {
      return httpRequest<PartyTransaction[]>(`/finance/vendors/${id}/transactions`);
    },

    listContacts(params?: Record<string, unknown>) {
      return httpRequest<any>(`/finance/contacts${toQuery(params)}`).then((response) => {
        const rows = Array.isArray(response?.result) ? response.result : Array.isArray(response) ? response : [];
        return {
          result: rows,
          total: Number(response?.total ?? response?.total_result ?? rows.length),
          total_result: Number(response?.total_result ?? response?.total ?? rows.length),
          per_page: Number(response?.per_page ?? 20),
          page: Number(response?.page ?? 1),
          pages: Number(response?.pages ?? 1)
        };
      });
    },

    getContact(id: string) {
      return httpRequest<ContactRecord>(`/finance/contacts/${id}`);
    },

    createContact(payload: Record<string, unknown>) {
      return httpRequest<ContactRecord>("/finance/contacts", { method: "POST", body: payload });
    },

    updateContact(id: string, payload: Record<string, unknown>) {
      return httpRequest<ContactRecord>(`/finance/contacts/${id}`, { method: "POST", body: payload });
    },

    getContactTransactions(id: string) {
      return httpRequest<PartyTransaction[]>(`/finance/contacts/${id}/transactions`);
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

    // ── Deduction Types ────────────────────────────────────────────────────

    listDeductionTypes(params?: Record<string, unknown>) {
      return httpRequest<Record<string, unknown>[]>(`/finance/deduction-types${toQuery(params)}`);
    },

    createDeductionType(body: Record<string, unknown>) {
      return httpRequest<Record<string, unknown>>('/finance/deduction-types', { method: 'POST', body });
    },

    updateDeductionType(id: string, body: Record<string, unknown>) {
      return httpRequest<Record<string, unknown>>(`/finance/deduction-types/${id}`, { method: 'POST', body });
    },

    // ── PV Deductions ──────────────────────────────────────────────────────

    listPVDeductions(pvId: string) {
      return httpRequest<Record<string, unknown>[]>(`/finance/payment-vouchers/${pvId}/deductions`);
    },

    applyPVDeductions(pvId: string, body: Record<string, unknown>) {
      return httpRequest<Record<string, unknown>>(`/finance/payment-vouchers/${pvId}/deductions`, { method: 'POST', body });
    },

    // ── Vendor WHT Accruals ────────────────────────────────────────────────

    listVendorWHTAccruals(vendorId: string, params?: Record<string, unknown>) {
      return httpRequest<Record<string, unknown>[]>(`/finance/vendors/${vendorId}/wht-accruals${toQuery(params)}`);
    },

    // ── WHT Remittances ────────────────────────────────────────────────────

    listWHTRemittances(params?: Record<string, unknown>) {
      return httpRequest<Record<string, unknown>[]>(`/finance/wht-remittances${toQuery(params)}`);
    },

    getWHTRemittance(id: string) {
      return httpRequest<Record<string, unknown>>(`/finance/wht-remittances/${id}`);
    },

    createWHTRemittance(body: Record<string, unknown>) {
      return httpRequest<Record<string, unknown>>('/finance/wht-remittances', { method: 'POST', body });
    },
  };
}

export type FinanceApi = ReturnType<typeof createFinanceApi>;
