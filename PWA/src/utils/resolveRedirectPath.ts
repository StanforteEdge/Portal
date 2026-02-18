const roleRedirectMap: Array<{ roles: string[]; path: string }> = [
  { roles: ["super-admin", "admin", "it-admin"], path: "/app/dashboard" },
  { roles: ["hr-admin", "hr-manager", "hr"], path: "/app/dashboard" },
  {
    roles: ["finance-officer", "finance-manager", "finance_manager", "accountant"],
    path: "/app/dashboard",
  },
];

export function resolveRedirectPath(roles: string[] = []): string {
  const normalizedRoles = roles.map((role) => role.toLowerCase());

  for (const entry of roleRedirectMap) {
    if (entry.roles.some((role) => normalizedRoles.includes(role))) {
      return entry.path;
    }
  }

  return "/app/dashboard";
}
