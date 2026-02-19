const roleRedirectMap: Array<{ roles: string[]; path: string }> = [
  { roles: ["super-admin", "admin", "it-admin"], path: "/app/dashboard" },
  { roles: ["hr-admin", "hr-manager", "hr"], path: "/app/hr" },
  {
    roles: ["finance-officer", "finance-manager", "finance_manager", "accountant"],
    path: "/app/dashboard",
  },
];

export function resolveRedirectPath(roles: string[] = [], onboardingStatus?: string | null): string {
  if (
    onboardingStatus &&
    ["invited", "accepted", "profile_pending", "forms_pending", "hr_review"].includes(
      onboardingStatus
    )
  ) {
    return "/app/onboarding";
  }

  const normalizedRoles = roles.map((role) => role.toLowerCase());

  for (const entry of roleRedirectMap) {
    if (entry.roles.some((role) => normalizedRoles.includes(role))) {
      return entry.path;
    }
  }

  return "/app/dashboard";
}
