import apiClient from "@/utils/httpClient";

export async function listTeamGoals(params?: Record<string, unknown>) {
  const response = await apiClient.get("/work/goals", { params });
  return (response.data?.data ?? []) as any[];
}

export async function createTeamGoal(payload: Record<string, unknown>) {
  const response = await apiClient.post("/work/goals", payload);
  return response.data?.data;
}

export async function updateTeamGoal(id: string, payload: Record<string, unknown>) {
  const response = await apiClient.post(`/work/goals/${id}`, payload);
  return response.data?.data;
}

export async function listTeamObjectives(params?: Record<string, unknown>) {
  const response = await apiClient.get("/work/objectives", { params });
  return (response.data?.data ?? []) as any[];
}

export async function createTeamObjective(payload: Record<string, unknown>) {
  const response = await apiClient.post("/work/objectives", payload);
  return response.data?.data;
}

export async function updateTeamObjective(id: string, payload: Record<string, unknown>) {
  const response = await apiClient.post(`/work/objectives/${id}`, payload);
  return response.data?.data;
}

export async function listTeamKpis(params?: Record<string, unknown>) {
  const response = await apiClient.get("/work/kpis", { params });
  return (response.data?.data ?? []) as any[];
}

export async function createTeamKpi(payload: Record<string, unknown>) {
  const response = await apiClient.post("/work/kpis", payload);
  return response.data?.data;
}

export async function updateTeamKpi(id: string, payload: Record<string, unknown>) {
  const response = await apiClient.post(`/work/kpis/${id}`, payload);
  return response.data?.data;
}

export async function listMyWorkItems(params?: Record<string, unknown>) {
  const response = await apiClient.get("/work/my/items", { params });
  return (response.data?.data ?? []) as any[];
}

export async function listTeamWorkItems(params?: Record<string, unknown>) {
  const response = await apiClient.get("/work/team/items", { params });
  return (response.data?.data ?? []) as any[];
}

export async function createWorkItem(payload: Record<string, unknown>) {
  const response = await apiClient.post("/work/items", payload);
  return response.data?.data;
}

export async function updateWorkItem(id: string, payload: Record<string, unknown>) {
  const response = await apiClient.post(`/work/items/${id}`, payload);
  return response.data?.data;
}

export async function listMyWorkLogs(params?: Record<string, unknown>) {
  const response = await apiClient.get("/work/my/logs", { params });
  return (response.data?.data ?? []) as any[];
}

export async function listTeamWorkLogs(params?: Record<string, unknown>) {
  const response = await apiClient.get("/work/team/logs", { params });
  return (response.data?.data ?? []) as any[];
}

export async function createWorkLog(payload: Record<string, unknown>) {
  const response = await apiClient.post("/work/logs", payload);
  return response.data?.data;
}

export async function updateWorkLog(id: string, payload: Record<string, unknown>) {
  const response = await apiClient.post(`/work/logs/${id}`, payload);
  return response.data?.data;
}

export async function submitWorkLog(id: string) {
  const response = await apiClient.post(`/work/logs/${id}/submit`);
  return response.data?.data;
}

export async function approveWorkLog(id: string) {
  const response = await apiClient.post(`/work/logs/${id}/approve`);
  return response.data?.data;
}

export async function rejectWorkLog(id: string) {
  const response = await apiClient.post(`/work/logs/${id}/reject`);
  return response.data?.data;
}

export async function getMyWorkTimesheetSummary(params?: Record<string, unknown>) {
  const response = await apiClient.get("/work/my/timesheet-summary", { params });
  return (response.data?.data ?? []) as any[];
}
