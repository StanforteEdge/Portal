import apiClient from "@/utils/httpClient";

export type Signatory = {
  name: string;
  title: string;
};

export type FinanceSettings = {
  prepared_by: Signatory;
  reviewed_by: Signatory;
  approved_by: Signatory;
  meta?: Record<string, unknown>;
};

export async function getFinanceSettings() {
  const response = await apiClient.get("/finance/settings");
  const {
    data: { data },
  }: { data: { data: FinanceSettings } } = response;
  return data;
}

export async function updateFinanceSettings(payload: FinanceSettings) {
  const response = await apiClient.post("/finance/settings", payload);
  const {
    data: { data },
  }: { data: { data: FinanceSettings } } = response;
  return data;
}
