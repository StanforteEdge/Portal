const roleRedirectMap: Array<{ roles: string[]; path: string }> = [
  { roles: ["super-admin", "admin", "it-admin"], path: "/appOld/dashboard" },
  { roles: ["hr-admin", "hr-manager", "hr"], path: "/appOld/hr" },
  {
    roles: ["finance-officer", "finance-manager", "finance_manager", "accountant"],
    path: "/appOld/dashboard",
  },
];

export function resolveRedirectPath(roles: string[] = [], onboardingStatus?: string | null): string {
  if (
    onboardingStatus &&
    ["invited", "accepted", "profile_pending", "forms_pending", "hr_review"].includes(
      onboardingStatus
    )
  ) {
    return "/appOld/onboarding";
  }

  const normalizedRoles = roles.map((role) => role.toLowerCase());

  for (const entry of roleRedirectMap) {
    if (entry.roles.some((role) => normalizedRoles.includes(role))) {
      return entry.path;
    }
  }

  return "/appOld/dashboard";
}
