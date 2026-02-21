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

export type AttendanceEntry = {
  id: string;
  user_id: string;
  entry_type: "clock_in" | "clock_out" | string;
  entry_at: string;
  work_date: string;
  source: string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
};

export type AttendanceDaily = {
  id: string;
  user_id: string;
  work_date: string;
  status: string;
  scheduled_minutes: number;
  worked_minutes: number;
  late_minutes: number;
  overtime_minutes: number;
  first_in_at: string | null;
  last_out_at: string | null;
  computed_at: string;
};

export async function clockIn(payload?: { source?: string; at?: string }) {
  const response = await apiClient.post("/hr/attendance/clock-in", payload ?? {});
  return response.data.data as { success: boolean; daily: AttendanceDaily };
}

export async function clockOut(payload?: { source?: string; at?: string }) {
  const response = await apiClient.post("/hr/attendance/clock-out", payload ?? {});
  return response.data.data as { success: boolean; daily: AttendanceDaily };
}

export async function getMyAttendance(params?: { from?: string; to?: string }) {
  const response = await apiClient.get("/hr/attendance/me", { params });
  return response.data.data as {
    entries: AttendanceEntry[];
    daily: AttendanceDaily[];
    current_state: {
      is_clocked_in: boolean;
      last_clock_in_at: string | null;
      can_clock_in?: boolean;
      can_clock_out?: boolean;
      reason?: string | null;
    };
    today?: AttendanceDaily | null;
    policy?: { start_time: string; end_time: string; grace_minutes: number };
  };
}

export async function getAttendanceSummary(params?: { from?: string; to?: string }) {
  const response = await apiClient.get("/hr/attendance/summary", { params });
  return response.data.data as {
    from: string;
    to: string;
    by_status: Record<string, number>;
  };
}

export async function getAttendanceRecords(params?: {
  from?: string;
  to?: string;
  status?: string;
  user_id?: string;
  search?: string;
}) {
  const response = await apiClient.get("/hr/attendance/records", { params });
  return response.data.data as {
    from: string;
    to: string;
    data: Array<
      AttendanceDaily & {
        profile: {
          id: string;
          email: string | null;
          username: string | null;
          first_name: string | null;
          last_name: string | null;
        } | null;
      }
    >;
  };
}

export type LeaveBalanceRow = {
  user_id: string;
  leave_type_key: string;
  entitled: number;
  used: number;
  adjustments: number;
  available: number;
};

export async function getLeaveBalances(params?: { user_id?: string; year?: number }) {
  const response = await apiClient.get("/hr/leave/balance", { params });
  return response.data.data as {
    year: number;
    data: LeaveBalanceRow[];
  };
}

export async function adjustLeaveBalance(payload: {
  user_id: string;
  leave_type_key: string;
  period_year: number;
  delta_days: number;
  entry_type?: string;
  notes?: string;
}) {
  const response = await apiClient.post("/hr/leave/balance/adjust", payload);
  return response.data.data as {
    id: string;
    user_id: string;
    leave_type_key: string;
    period_year: number;
    delta_days: number;
    entry_type: string;
    notes: string | null;
    created_at: string;
  };
}
