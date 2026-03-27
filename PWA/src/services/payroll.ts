import apiClient from "@/utils/httpClient";

export type PayrollSummary = {
  workers: number;
  active_workers: number;
  consultants: number;
  active_components: number;
  runs: number;
  latest_run: {
    id: string;
    name: string;
    year: number;
    month: number;
    status: string;
    totals: { gross: number; deductions: number; employer_cost: number; net: number };
  } | null;
};

export async function getPayrollSummary() {
  const response = await apiClient.get("/payroll/summary");
  return response.data?.data as PayrollSummary;
}

export async function listMyPayrollPayslips(params?: Record<string, unknown>) {
  const response = await apiClient.get("/payroll/my/payslips", { params });
  return response.data?.data as { data: any[]; meta: { page: number; per_page: number; total: number; last_page: number } };
}

export async function downloadMyPayrollPayslip(runId: string, itemId: string) {
  const response = await apiClient.post(`/payroll/my/payslips/${runId}/${itemId}`);
  return response.data?.data as { file_name: string; mime_type: string; content_base64: string };
}

export async function getPayrollInbox() {
  const response = await apiClient.get("/payroll/inbox");
  return response.data?.data;
}

export async function getPayrollNotificationPreferences() {
  const response = await apiClient.get("/payroll/notification-preferences");
  return response.data?.data;
}

export async function updatePayrollNotificationPreferences(payload: Record<string, unknown>) {
  const response = await apiClient.post("/payroll/notification-preferences", payload);
  return response.data?.data;
}

export async function getPayrollReportsOverview(params?: Record<string, unknown>) {
  const response = await apiClient.get("/payroll/reports/overview", { params });
  return response.data?.data;
}

export async function getPayrollSettings(params?: Record<string, unknown>) {
  const response = await apiClient.get("/payroll/settings", { params });
  return response.data?.data;
}

export async function updatePayrollSettings(payload: Record<string, unknown>) {
  const response = await apiClient.post("/payroll/settings", payload);
  return response.data?.data;
}

export async function listPayrollWorkers(params?: Record<string, unknown>) {
  const response = await apiClient.get("/payroll/workers", { params });
  return response.data?.data as { data: any[]; meta: { page: number; per_page: number; total: number; last_page: number } };
}

export async function getPayrollWorker(id: string) {
  const response = await apiClient.get(`/payroll/workers/${id}`);
  return response.data?.data;
}

export async function createPayrollWorker(payload: Record<string, unknown>) {
  const response = await apiClient.post("/payroll/workers", payload);
  return response.data?.data;
}

export async function updatePayrollWorker(id: string, payload: Record<string, unknown>) {
  const response = await apiClient.post(`/payroll/workers/${id}`, payload);
  return response.data?.data;
}

export async function listPayrollComponents(params?: Record<string, unknown>) {
  const response = await apiClient.get("/payroll/components", { params });
  return (response.data?.data ?? []) as any[];
}

export async function createPayrollComponent(payload: Record<string, unknown>) {
  const response = await apiClient.post("/payroll/components", payload);
  return response.data?.data;
}

export async function updatePayrollComponent(id: string, payload: Record<string, unknown>) {
  const response = await apiClient.post(`/payroll/components/${id}`, payload);
  return response.data?.data;
}

export async function listPayrollRuns(params?: Record<string, unknown>) {
  const response = await apiClient.get("/payroll/runs", { params });
  return response.data?.data as { data: any[]; meta: { page: number; per_page: number; total: number; last_page: number } };
}

export async function getPayrollRun(id: string) {
  const response = await apiClient.get(`/payroll/runs/${id}`);
  return response.data?.data;
}

export async function createPayrollRun(payload: Record<string, unknown>) {
  const response = await apiClient.post("/payroll/runs", payload);
  return response.data?.data;
}

export async function updatePayrollRun(id: string, payload: Record<string, unknown>) {
  const response = await apiClient.post(`/payroll/runs/${id}`, payload);
  return response.data?.data;
}

export async function generatePayrollRun(id: string) {
  const response = await apiClient.post(`/payroll/runs/${id}/generate`);
  return response.data?.data;
}

export async function submitPayrollRun(id: string) {
  const response = await apiClient.post(`/payroll/runs/${id}/submit`);
  return response.data?.data;
}

export async function reviewPayrollRun(id: string, payload?: Record<string, unknown>) {
  const response = await apiClient.post(`/payroll/runs/${id}/review`, payload || {});
  return response.data?.data;
}

export async function approvePayrollRun(id: string, payload?: Record<string, unknown>) {
  const response = await apiClient.post(`/payroll/runs/${id}/approve`, payload || {});
  return response.data?.data;
}

export async function rejectPayrollRun(id: string, payload?: Record<string, unknown>) {
  const response = await apiClient.post(`/payroll/runs/${id}/reject`, payload || {});
  return response.data?.data;
}

export async function reopenPayrollRun(id: string, payload?: Record<string, unknown>) {
  const response = await apiClient.post(`/payroll/runs/${id}/reopen`, payload || {});
  return response.data?.data;
}

export async function closePayrollRun(id: string, payload?: Record<string, unknown>) {
  const response = await apiClient.post(`/payroll/runs/${id}/close`, payload || {});
  return response.data?.data;
}

export async function payPayrollRun(id: string, payload: Record<string, unknown>) {
  const response = await apiClient.post(`/payroll/runs/${id}/pay`, payload);
  return response.data?.data;
}

export async function generatePayrollRunItemPayslip(id: string, itemId: string) {
  const response = await apiClient.post(`/payroll/runs/${id}/payslips/${itemId}`);
  return response.data?.data as { file_name: string; mime_type: string; content_base64: string };
}

export async function generatePayrollRunPayslipsPackage(id: string) {
  const response = await apiClient.post(`/payroll/runs/${id}/payslips-package`);
  return response.data?.data as { file_name: string; mime_type: string; content_base64: string };
}

export async function distributePayrollRunPayslips(id: string) {
  const response = await apiClient.post(`/payroll/runs/${id}/distribute-payslips`);
  return response.data?.data as {
    success: boolean;
    sent: number;
    skipped: number;
    failed: number;
    skipped_workers: string[];
    failed_workers: Array<{ worker: string; error: string }>;
  };
}

export async function generatePayrollBankSchedule(id: string) {
  const response = await apiClient.post(`/payroll/runs/${id}/bank-schedule`);
  return response.data?.data as { file_name: string; mime_type: string; content_base64: string };
}

export async function updatePayrollRunItem(id: string, itemId: string, payload: Record<string, unknown>) {
  const response = await apiClient.post(`/payroll/runs/${id}/items/${itemId}`, payload);
  return response.data?.data;
}

export async function updatePayrollRunAllocations(id: string, itemId: string, payload: Record<string, unknown>) {
  const response = await apiClient.post(`/payroll/runs/${id}/items/${itemId}/allocations`, payload);
  return response.data?.data;
}

export async function validatePayrollImport(payload: Record<string, unknown>) {
  const response = await apiClient.post("/payroll/import/validate", payload);
  return response.data?.data;
}

export async function listPayrollImportJobs(params?: Record<string, unknown>) {
  const response = await apiClient.get("/payroll/import/jobs", { params });
  return response.data?.data as { data: any[]; meta: { page: number; per_page: number; total: number; last_page: number } };
}

export async function getPayrollImportJob(id: string) {
  const response = await apiClient.get(`/payroll/import/jobs/${id}`);
  return response.data?.data;
}

export async function commitPayrollImport(payload: Record<string, unknown>) {
  const response = await apiClient.post("/payroll/import/commit", payload);
  return response.data?.data;
}

export async function retryFailedPayrollImport(id: string) {
  const response = await apiClient.post(`/payroll/import/jobs/${id}/retry-failed`);
  return response.data?.data;
}

export async function generatePayrollPayslipTemplate(payload: Record<string, unknown>) {
  const response = await apiClient.post("/payroll/templates/payslip", payload);
  return response.data?.data as { file_name: string; mime_type: string; content_base64: string };
}

export async function generatePayrollSummaryTemplate(payload: Record<string, unknown>) {
  const response = await apiClient.post("/payroll/templates/summary", payload);
  return response.data?.data as { file_name: string; mime_type: string; content_base64: string };
}
