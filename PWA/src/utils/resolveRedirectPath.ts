const roleRedirectMap: Array<{ roles: string[]; path: string }> = [
  { roles: ["super-admin", "admin", "it-admin"], path: "/admin/dashboard" },
  { roles: ["hr-admin", "hr-manager", "hr"], path: "/hr/dashboard" },
  {
    roles: ["finance-officer", "finance-manager", "accountant"],
    path: "/finance/dashboard",
  },
];

export function resolveRedirectPath(roles: string[] = []): string {
  const normalizedRoles = roles.map((role) => role.toLowerCase());

  for (const entry of roleRedirectMap) {
    if (entry.roles.some((role) => normalizedRoles.includes(role))) {
      return entry.path;
    }
  }

  return "/dashboard";
}
