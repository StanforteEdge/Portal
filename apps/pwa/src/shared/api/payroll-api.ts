import { httpRequest } from "@/shared/lib/core";

export type PayslipDistribution = {
  id: string;
  status: string;
  sent_at?: string | null;
  created_at?: string | null;
};

export type PayslipRow = {
  id: string;
  run_id: string;
  run_name: string;
  year: number;
  month: number;
  status: string;
  gross_pay: number;
  total_deductions: number;
  net_pay: number;
  payment_status?: string | null;
  payment_reference?: string | null;
  latest_distribution?: PayslipDistribution | null;
};

export type PayslipDetail = PayslipRow & {
  currency: string;
  worker_name: string;
  worker_type?: string | null;
  organization_name?: string | null;
  employer_cost?: number;
  earnings: Array<{ label: string; amount: number }>;
  deductions: Array<{ label: string; amount: number }>;
  employer_costs: Array<{ label: string; amount: number }>;
};

export type PayslipListResponse = {
  data: PayslipRow[];
  meta: { page: number; per_page: number; total: number; last_page: number };
};

export async function listMyPayslips(params?: { page?: number; per_page?: number }) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.per_page) query.set("per_page", String(params.per_page));
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const payload = await httpRequest<any>(`/payroll/my/payslips${suffix}`);
  if (Array.isArray(payload)) {
    const perPage = params?.per_page ?? payload.length;
    return {
      data: payload as PayslipRow[],
      meta: {
        page: params?.page ?? 1,
        per_page: perPage,
        total: payload.length,
        last_page: 1,
      },
    } satisfies PayslipListResponse;
  }
  if (payload?.data && Array.isArray(payload.data)) {
    return payload as PayslipListResponse;
  }
  return { data: [], meta: { page: 1, per_page: 0, total: 0, last_page: 1 } };
}

export async function getMyPayslipDetails(runId: string, itemId: string) {
  return httpRequest<PayslipDetail>(`/payroll/my/payslips/${runId}/${itemId}`);
}

export async function downloadMyPayslip(runId: string, itemId: string) {
  return httpRequest<{ file_name: string; mime_type: string; content_base64: string }>(
    `/payroll/my/payslips/${runId}/${itemId}`,
    { method: "POST" },
  );
}
