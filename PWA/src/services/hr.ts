import apiClient from "@/utils/httpClient";

export type HrEmployee = {
  id: string;
  username: string;
  email: string;
  status: string;
  type: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  organizations?: Array<{ id: string; name: string; code: string; is_primary?: boolean }>;
  teams?: Array<{ id: string; name: string; type: string; role: string }>;
  projects?: Array<{ id: string; name: string; type: string; role: string }>;
  roles: Array<{ id: string; slug: string; name: string; is_primary: boolean }>;
  employee_profile: {
    id: string;
    employeeCode?: string | null;
    employee_code?: string | null;
    jobTitle?: string | null;
    job_title?: string | null;
    employmentStatus?: string | null;
    employment_status?: string | null;
    employment_type?: string | null;
    work_mode?: string | null;
    job_description?: string | null;
    manager?: { id: string; firstName?: string | null; first_name?: string | null; lastName?: string | null; last_name?: string | null; email: string | null } | null;
    meta?: Record<string, unknown>;
  } | null;
  onboarding_progress: {
    status: string;
    currentStep?: string | null;
    current_step?: string | null;
  } | null;
  created_at: string;
};

export async function getHrSummary() {
  const response = await apiClient.get("/hr/summary");
  return response.data.data as {
    total: number;
    active: number;
    inactive: number;
    onboarding_pending: number;
  };
}

export async function listHrEmployees(params?: Record<string, string | number | undefined>) {
  const response = await apiClient.get("/hr/employees", { params });
  const payload = response.data.data as any;
  if (Array.isArray(payload)) {
    return {
      data: payload as HrEmployee[],
      meta: { page: 1, per_page: payload.length, total: payload.length, last_page: 1 },
    };
  }
  return {
    data: Array.isArray(payload?.data) ? (payload.data as HrEmployee[]) : [],
    meta: payload?.meta ?? { page: 1, per_page: 0, total: 0, last_page: 1 },
  };
}

export async function getHrEmployee(id: string) {
  const response = await apiClient.get(`/hr/employees/${id}`);
  return response.data.data as HrEmployee;
}

export async function createHrEmployee(payload: Record<string, unknown>) {
  const response = await apiClient.post("/hr/employees", payload);
  return response.data.data as HrEmployee;
}

export async function updateHrEmployee(id: string, payload: Record<string, unknown>) {
  const response = await apiClient.patch(`/hr/employees/${id}`, payload);
  return response.data.data as HrEmployee;
}

export async function runHrEmployeeAction(
  id: string,
  payload: { action: "activate" | "suspend" | "exit"; effective_date?: string; notes?: string }
) {
  const response = await apiClient.patch(`/hr/employees/${id}/action`, payload);
  return response.data.data as HrEmployee;
}

export async function addEmployeeOrganization(
  id: string,
  payload: { organization_id: string; is_primary?: boolean }
) {
  const response = await apiClient.post(`/hr/employees/${id}/organizations`, payload);
  return response.data.data as HrEmployee;
}

export async function removeEmployeeOrganization(id: string, organizationId: string) {
  const response = await apiClient.delete(`/hr/employees/${id}/organizations/${organizationId}`);
  return response.data.data as HrEmployee;
}

export async function addEmployeeTeam(
  id: string,
  payload: { team_id: string; role?: "member" | "lead" | "manager" }
) {
  const response = await apiClient.post(`/hr/employees/${id}/teams`, payload);
  return response.data.data as HrEmployee;
}

export async function removeEmployeeTeam(id: string, teamId: string) {
  const response = await apiClient.delete(`/hr/employees/${id}/teams/${teamId}`);
  return response.data.data as HrEmployee;
}

export type HrFormAssignment = {
  id: string;
  form_id: string;
  form_name: string;
  module: string;
  assigned_to_role: string | null;
  assigned_to_profile_id: string | null;
  due_date: string | null;
  created_at: string;
};

export async function listHrOnboardingFormAssignments(params?: {
  form_id?: string;
  profile_id?: string;
  role_slug?: string;
}) {
  const response = await apiClient.get("/hr/onboarding/forms", { params });
  const payload = response.data.data as any;
  return (Array.isArray(payload) ? payload : []) as HrFormAssignment[];
}

export async function assignHrOnboardingForm(payload: {
  form_id: string;
  profile_id?: string;
  role_slug?: string;
  due_date?: string;
}) {
  const response = await apiClient.post("/hr/onboarding/forms/assign", payload);
  return response.data.data as Record<string, unknown>;
}

export async function deleteHrOnboardingFormAssignment(id: string) {
  const response = await apiClient.delete(`/hr/onboarding/forms/assignments/${id}`);
  return response.data.data as { success: boolean };
}

export async function updateHrOnboardingFormAssignment(
  id: string,
  payload: {
    form_id?: string;
    profile_id?: string;
    role_slug?: string;
    due_date?: string;
  }
) {
  const response = await apiClient.patch(`/hr/onboarding/forms/assignments/${id}`, payload);
  return response.data.data as Record<string, unknown>;
}
