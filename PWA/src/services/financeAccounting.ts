import apiClient from "@/utils/httpClient";

export async function listFinanceChartAccounts(params?: Record<string, unknown>) {
  const response = await apiClient.get("/finance/chart-accounts", { params });
  return (response.data?.data ?? []) as Array<{
    id: string;
    organization: { id: string; name: string; code: string } | null;
    finance_account: { id: string; name: string; code: string | null; account_type: string } | null;
    code: string;
    name: string;
    type: string;
    category: string;
    normal_balance: string;
    is_control_account: boolean;
    is_active: boolean;
    metadata: Record<string, unknown> | null;
  }>;
}

export async function createFinanceChartAccount(payload: Record<string, unknown>) {
  const response = await apiClient.post("/finance/chart-accounts", payload);
  return response.data?.data;
}

export async function updateFinanceChartAccount(id: string, payload: Record<string, unknown>) {
  const response = await apiClient.post(`/finance/chart-accounts/${id}`, payload);
  return response.data?.data;
}

export async function listFinanceReportingPeriods(params?: Record<string, unknown>) {
  const response = await apiClient.get("/finance/reporting-periods", { params });
  return (response.data?.data ?? []) as Array<{
    id: string;
    year: number;
    month: number;
    quarter: number;
    label: string;
    start_date: string;
    end_date: string;
    status: string;
    notes: string | null;
  }>;
}

export async function createFinanceReportingPeriod(payload: Record<string, unknown>) {
  const response = await apiClient.post("/finance/reporting-periods", payload);
  return response.data?.data;
}

export async function updateFinanceReportingPeriod(id: string, payload: Record<string, unknown>) {
  const response = await apiClient.post(`/finance/reporting-periods/${id}`, payload);
  return response.data?.data;
}

export async function closeFinanceReportingPeriod(id: string) {
  const response = await apiClient.post(`/finance/reporting-periods/${id}/close`);
  return response.data?.data;
}

export async function reopenFinanceReportingPeriod(id: string) {
  const response = await apiClient.post(`/finance/reporting-periods/${id}/reopen`);
  return response.data?.data;
}

export async function listFinanceCustomers(params?: Record<string, unknown>) {
  const response = await apiClient.get("/finance/customers", { params });
  return (response.data?.data ?? []) as any[];
}

export async function createFinanceCustomer(payload: Record<string, unknown>) {
  const response = await apiClient.post("/finance/customers", payload);
  return response.data?.data;
}

export async function updateFinanceCustomer(id: string, payload: Record<string, unknown>) {
  const response = await apiClient.post(`/finance/customers/${id}`, payload);
  return response.data?.data;
}

export async function listFinanceVendors(params?: Record<string, unknown>) {
  const response = await apiClient.get("/finance/vendors", { params });
  return (response.data?.data ?? []) as any[];
}

export async function createFinanceVendor(payload: Record<string, unknown>) {
  const response = await apiClient.post("/finance/vendors", payload);
  return response.data?.data;
}

export async function updateFinanceVendor(id: string, payload: Record<string, unknown>) {
  const response = await apiClient.post(`/finance/vendors/${id}`, payload);
  return response.data?.data;
}

export async function listFinanceDonors(params?: Record<string, unknown>) {
  const response = await apiClient.get("/finance/donors", { params });
  return (response.data?.data ?? []) as any[];
}

export async function createFinanceDonor(payload: Record<string, unknown>) {
  const response = await apiClient.post("/finance/donors", payload);
  return response.data?.data;
}

export async function updateFinanceDonor(id: string, payload: Record<string, unknown>) {
  const response = await apiClient.post(`/finance/donors/${id}`, payload);
  return response.data?.data;
}

export async function listFinanceFunds(params?: Record<string, unknown>) {
  const response = await apiClient.get("/finance/funds", { params });
  return (response.data?.data ?? []) as any[];
}

export async function createFinanceFund(payload: Record<string, unknown>) {
  const response = await apiClient.post("/finance/funds", payload);
  return response.data?.data;
}

export async function updateFinanceFund(id: string, payload: Record<string, unknown>) {
  const response = await apiClient.post(`/finance/funds/${id}`, payload);
  return response.data?.data;
}

export async function listFinanceGrants(params?: Record<string, unknown>) {
  const response = await apiClient.get("/finance/grants", { params });
  return (response.data?.data ?? []) as any[];
}

export async function createFinanceGrant(payload: Record<string, unknown>) {
  const response = await apiClient.post("/finance/grants", payload);
  return response.data?.data;
}

export async function updateFinanceGrant(id: string, payload: Record<string, unknown>) {
  const response = await apiClient.post(`/finance/grants/${id}`, payload);
  return response.data?.data;
}

export async function listFinanceSalesInvoices(params?: Record<string, unknown>) {
  const response = await apiClient.get("/finance/sales-invoices", { params });
  return (response.data?.data ?? []) as any[];
}

export async function getFinanceSalesInvoice(id: string) {
  const response = await apiClient.get(`/finance/sales-invoices/${id}`);
  return response.data?.data;
}

export async function createFinanceSalesInvoice(payload: Record<string, unknown>) {
  const response = await apiClient.post("/finance/sales-invoices", payload);
  return response.data?.data;
}

export async function sendFinanceSalesInvoice(id: string) {
  const response = await apiClient.post(`/finance/sales-invoices/${id}/send`);
  return response.data?.data;
}

export async function remindFinanceSalesInvoice(id: string) {
  const response = await apiClient.post(`/finance/sales-invoices/${id}/remind`);
  return response.data?.data;
}

export async function voidFinanceSalesInvoice(id: string) {
  const response = await apiClient.post(`/finance/sales-invoices/${id}/void`);
  return response.data?.data;
}

export async function generateFinanceSalesInvoicePdf(id: string) {
  const response = await apiClient.post(`/finance/sales-invoices/${id}/pdf`);
  return response.data?.data as { file_name: string; mime_type: string; content_base64: string };
}

export async function listFinanceBills(params?: Record<string, unknown>) {
  const response = await apiClient.get("/finance/bills", { params });
  return (response.data?.data ?? []) as any[];
}

export async function createFinanceBill(payload: Record<string, unknown>) {
  const response = await apiClient.post("/finance/bills", payload);
  return response.data?.data;
}

export async function createFinanceReceipt(payload: Record<string, unknown>) {
  const response = await apiClient.post("/finance/receipts", payload);
  return response.data?.data;
}

export async function getFinanceCustomerStatement(id: string, params?: Record<string, unknown>) {
  const response = await apiClient.get(`/finance/customers/${id}/statement`, { params });
  return response.data?.data;
}

export async function createFinanceVendorPayment(payload: Record<string, unknown>) {
  const response = await apiClient.post("/finance/vendor-payments", payload);
  return response.data?.data;
}

export async function listFinanceBudgets(params?: Record<string, unknown>) {
  const response = await apiClient.get("/finance/budgets", { params });
  return (response.data?.data ?? []) as any[];
}

export async function getFinanceBudget(id: string) {
  const response = await apiClient.get(`/finance/budgets/${id}`);
  return response.data?.data;
}

export async function createFinanceBudget(payload: Record<string, unknown>) {
  const response = await apiClient.post("/finance/budgets", payload);
  return response.data?.data;
}

export async function updateFinanceBudget(id: string, payload: Record<string, unknown>) {
  const response = await apiClient.post(`/finance/budgets/${id}`, payload);
  return response.data?.data;
}

export async function approveFinanceBudget(id: string) {
  const response = await apiClient.post(`/finance/budgets/${id}/approve`);
  return response.data?.data;
}

export async function reopenFinanceBudget(id: string) {
  const response = await apiClient.post(`/finance/budgets/${id}/reopen`);
  return response.data?.data;
}

export async function recalculateFinanceBudget(id: string) {
  const response = await apiClient.post(`/finance/budgets/${id}/recalculate`);
  return response.data?.data;
}
