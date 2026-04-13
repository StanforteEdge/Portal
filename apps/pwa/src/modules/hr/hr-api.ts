import { httpRequest } from "@/shared/lib/core";

export type EmploymentType = 'full_time' | 'contract' | 'intern' | 'consultant';
export type EmploymentStatus = 'draft' | 'active' | 'suspended' | 'exited';
export type WorkMode = 'onsite' | 'hybrid' | 'remote';
export type EmployeeAction = 'activate' | 'suspend' | 'exit';

export type EmployeeSummary = {
  id: string;
  user_id: string;
  username: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone?: string | null;
  status: string;
  type: string;
  employee_code?: string | null;
  job_title?: string | null;
  employment_type?: EmploymentType | null;
  employment_status?: EmploymentStatus | null;
  work_mode?: WorkMode | null;
  primary_organization?: { id: string; name: string; code?: string } | null;
  primary_team?: { id: string; name: string; type?: string } | null;
  hire_date?: string | null;
  organizations?: Array<{ id: string; name: string; code?: string; is_primary?: boolean }>;
  teams?: Array<{ id: string; name: string; type?: string; role?: string }>;
  roles?: Array<{ id: string; slug: string; name: string; is_primary: boolean }>;
};

export type EmployeeDetail = {
  id: string;
  user_id: string;
  username: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone?: string | null;
  status: string;
  type: string;
  employee_code?: string | null;
  job_title?: string | null;
  employment_type?: EmploymentType | null;
  employment_status?: EmploymentStatus | null;
  work_mode?: WorkMode | null;
  primary_organization?: { id: string; name: string; code?: string } | null;
  primary_team?: { id: string; name: string; type?: string } | null;
  hire_date?: string | null;
  job_description?: string | null;
  manager?: { id: string; first_name?: string; last_name?: string; firstName?: string; lastName?: string; email: string | null } | null;
  confirmation_date?: string | null;
  exit_date?: string | null;
  organizations: Array<{ id: string; name: string; code?: string; is_primary: boolean }>;
  teams: Array<{ id: string; name: string; type?: string; role?: string }>;
  roles: string[];
  metadata?: Record<string, unknown>;
};

export type HrSummary = {
  total: number;
  active: number;
  draft: number;
  suspended: number;
  exited: number;
  by_employment_type: Record<EmploymentType, number>;
  recent_hires: EmployeeSummary[];
};

export type EmployeeListResponse = {
  data: EmployeeSummary[];
  meta: { page: number; per_page: number; total: number; last_page: number };
};

/**
 * Normalize backend employee response (nested employee_profile) to flattened EmployeeSummary
 */
function normalizeEmployee(raw: any): EmployeeSummary {
  const profile = raw?.employee_profile;
  return {
    id: raw?.id,
    user_id: raw?.id,
    username: raw?.username,
    email: raw?.email,
    first_name: raw?.first_name,
    last_name: raw?.last_name,
    phone: raw?.phone,
    status: raw?.status,
    type: raw?.type,
    employee_code: profile?.employeeCode ?? profile?.employee_code,
    job_title: profile?.jobTitle ?? profile?.job_title,
    employment_type: profile?.employment_type,
    employment_status: profile?.employmentStatus ?? profile?.employment_status,
    work_mode: profile?.work_mode,
    hire_date: profile?.hireDate ?? profile?.hire_date,
    primary_organization: profile?.primaryOrganization ?? profile?.primary_organization,
    primary_team: profile?.primaryTeam ?? profile?.primary_team,
    organizations: raw?.organizations,
    teams: raw?.teams,
    roles: raw?.roles,
  };
}

/**
 * Normalize backend response to EmployeeDetail
 */
function normalizeEmployeeDetail(raw: any): EmployeeDetail {
  const base = normalizeEmployee(raw);
  const profile = raw?.employee_profile;
  const manager = profile?.manager;
  
  return {
    ...base,
    phone: base.phone,
    username: base.username,
    job_description: profile?.jobDescription ?? profile?.job_description,
    manager: manager ? {
      id: manager.id,
      first_name: manager.firstName ?? manager.first_name,
      last_name: manager.lastName ?? manager.last_name,
      email: manager.email,
    } : undefined,
    confirmation_date: profile?.confirmationDate ?? profile?.confirmation_date,
    exit_date: profile?.exitDate ?? profile?.exit_date,
    organizations: (base.organizations ?? []).map(org => ({
      id: org.id,
      name: org.name,
      is_primary: org.is_primary ?? false,
    })),
    teams: (base.teams ?? []).map(team => ({
      id: team.id,
      name: team.name,
      type: team.type,
      role: team.role,
    })),
    roles: (base.roles ?? []).map(r => r.slug),
    metadata: profile?.meta,
  };
}

export async function getHrSummary(): Promise<HrSummary> {
  return httpRequest<HrSummary>('/hr/summary');
}

export async function listEmployees(params?: Record<string, unknown>): Promise<EmployeeListResponse> {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      query.set(key, String(value));
    });
  }
  const suffix = query.toString() ? `?${query.toString()}` : '';
  const response = await httpRequest<any>(`/hr/employees${suffix}`);
  
  // Handle both array and {data: [], meta: {}} responses
  if (Array.isArray(response)) {
    return {
      data: response.map(normalizeEmployee),
      meta: { page: 1, per_page: response.length, total: response.length, last_page: 1 },
    };
  }
  
  return {
    data: Array.isArray(response?.data) ? response.data.map(normalizeEmployee) : [],
    meta: response?.meta ?? { page: 1, per_page: 0, total: 0, last_page: 1 },
  };
}

export async function getEmployee(id: string): Promise<EmployeeDetail> {
  const raw = await httpRequest<any>(`/hr/employees/${id}`);
  return normalizeEmployeeDetail(raw);
}

export async function createEmployee(dto: {
  first_name: string;
  last_name: string;
  email: string;
  job_title: string;
  employment_type: EmploymentType;
  hire_date: string;
  primary_organization_id: string;
}): Promise<EmployeeDetail> {
  return httpRequest<EmployeeDetail>('/hr/employees', {
    method: 'POST',
    body: dto,
  });
}

export async function updateEmployee(id: string, dto: Record<string, unknown>): Promise<EmployeeDetail> {
  return httpRequest<EmployeeDetail>(`/hr/employees/${id}`, {
    method: 'PATCH',
    body: dto,
  });
}

export async function runEmployeeAction(
  id: string,
  dto: { action: EmployeeAction; effective_date?: string; notes?: string }
): Promise<EmployeeDetail> {
  return httpRequest<EmployeeDetail>(`/hr/employees/${id}/action`, {
    method: 'PATCH',
    body: dto,
  });
}

export async function addEmployeeOrganization(
  id: string,
  dto: { organization_id: string; is_primary?: boolean }
): Promise<void> {
  return httpRequest<void>(`/hr/employees/${id}/organizations`, {
    method: 'POST',
    body: dto,
  });
}

export async function removeEmployeeOrganization(id: string, orgId: string): Promise<void> {
  return httpRequest<void>(`/hr/employees/${id}/organizations/${orgId}`, {
    method: 'DELETE',
  });
}

export async function addEmployeeTeam(
  id: string,
  dto: { team_id: string; role?: 'member' | 'lead' | 'manager' }
): Promise<void> {
  return httpRequest<void>(`/hr/employees/${id}/teams`, {
    method: 'POST',
    body: dto,
  });
}

export async function removeEmployeeTeam(id: string, teamId: string): Promise<void> {
  return httpRequest<void>(`/hr/employees/${id}/teams/${teamId}`, {
    method: 'DELETE',
  });
}
