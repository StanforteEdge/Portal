import apiClient from "@/utils/httpClient";

export type UserListItem = {
  id: string;
  username: string;
  email: string;
  type: string;
  status: string;
  firstName?: string | null;
  lastName?: string | null;
  createdAt?: string;
};

export type RoleOption = {
  id: string;
  slug: string;
  name: string;
};

type UsersListResponse = {
  data: UserListItem[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
};

export async function listUsers(params?: {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  type?: string;
}) {
  const response = await apiClient.get("/users", { params });
  const {
    data: { data, meta },
  }: { data: { data: UsersListResponse["data"]; meta: UsersListResponse["meta"] } } =
    response;
  return { data, meta };
}

export async function createUser(payload: {
  username: string;
  email: string;
  password?: string;
  set_password?: boolean;
  status?: "active" | "pending";
  send_invite?: boolean;
  send_welcome_email?: boolean;
  first_name?: string;
  last_name?: string;
  type?: string;
  roles?: string[];
  primary_organization_id?: string;
}) {
  const response = await apiClient.post("/users", payload);
  const {
    data: { data },
  }: { data: { data: UserListItem } } = response;
  return data;
}

export async function getUserRoles(userId: string) {
  const response = await apiClient.get(`/users/${userId}/roles`);
  const {
    data: { data },
  }: {
    data: {
      data: {
        user: { id: string; email: string; username: string };
        roles: Array<{ id: string; slug: string; name: string; is_primary: boolean }>;
      };
    };
  } = response;
  return data;
}

export async function setUserRoles(userId: string, roles: string[]) {
  const response = await apiClient.post(`/users/${userId}/roles`, { roles });
  const {
    data: { data },
  }: { data: { data: unknown } } = response;
  return data;
}

export async function inviteUser(userId: string, message?: string) {
  const response = await apiClient.post(`/users/${userId}/invite`, {
    message: message || undefined,
  });
  const {
    data: { data },
  }: { data: { data: { success: boolean; expires_at: string } } } = response;
  return data;
}

export async function listRoleOptions(): Promise<RoleOption[]> {
  try {
    const response = await apiClient.get("/admin/rbac/roles");
    const {
      data: { data },
    }: { data: { data: Array<{ id: string; slug: string; name: string }> } } = response;
    return data.map((role) => ({ id: role.id, slug: role.slug, name: role.name }));
  } catch {
    return [
      { id: "staff", slug: "staff", name: "Staff" },
      { id: "accountant", slug: "accountant", name: "Accountant" },
      { id: "finance_manager", slug: "finance_manager", name: "Finance Manager" },
      { id: "admin", slug: "admin", name: "Admin" },
    ];
  }
}
