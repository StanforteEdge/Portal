import type { AuthUser } from "./types";

const FINANCE_ROLES = new Set([
  "finance_manager",
  "finance_officer",
  "finance_auditor",
  "accountant",
  "admin",
  "administrator",
]);

const APPROVAL_ROLES = new Set([
  "team_lead",
  "manager",
  "finance_manager",
  "finance_officer",
  "finance_auditor",
  "accountant",
  "admin",
  "administrator",
  "coo",
  "ed",
]);

const STAFF_MODULES = new Set([
  "dashboard",
  "requests",
  "attendance",
  "profile",
  "leave",
  "work",
]);

export function hasPermission(user: Pick<AuthUser, "permissions"> | null | undefined, permission: string) {
  const permissionSet = new Set((user?.permissions ?? []).map((entry) => String(entry).trim().toLowerCase()));
  if (permissionSet.has("*")) return true;
  return permissionSet.has(String(permission).trim().toLowerCase());
}

export function hasAnyPermission(
  user: Pick<AuthUser, "permissions"> | null | undefined,
  permissions: string[],
) {
  const permissionSet = new Set((user?.permissions ?? []).map((entry) => String(entry).trim().toLowerCase()));
  if (permissionSet.has("*")) return true;
  return permissions.some((permission) => permissionSet.has(String(permission).trim().toLowerCase()));
}

export function hasModuleAccess(user: Pick<AuthUser, "roles" | "permissions" | "enabled_modules"> | null | undefined, moduleKey: string) {
  const module = String(moduleKey || "").trim().toLowerCase();
  if (!module) return false;

  const roleSet = new Set((user?.roles ?? []).map((entry) => String(entry).trim().toLowerCase()));
  const permissionSet = new Set((user?.permissions ?? []).map((entry) => String(entry).trim().toLowerCase()));
  const enabledModules = new Set((user?.enabled_modules ?? []).map((entry) => String(entry).trim().toLowerCase()));

  if (permissionSet.has("*")) return true;

  if (module === "finance") {
    const hasFinancePermission = Array.from(permissionSet).some(
      (permission) => permission === "finance.*" || permission.startsWith("finance."),
    );
    return Array.from(roleSet).some((role) => FINANCE_ROLES.has(role)) || hasFinancePermission;
  }

  if (module === "admin") {
    return roleSet.has("administrator") || roleSet.has("admin") || hasAnyPermission(user, ["users.manage", "roles.manage", "settings.manage"]);
  }

  if (enabledModules.has("*") || enabledModules.has(module)) return true;

  if (STAFF_MODULES.has(module)) {
    return true;
  }

  if (enabledModules.size === 0) {
    return true;
  }

  return enabledModules.has(module);
}

export function hasApprovalAccess(user: Pick<AuthUser, "roles" | "permissions"> | null | undefined) {
  if (hasAnyPermission(user, ["requests.approve"])) return true;
  const roleSet = new Set((user?.roles ?? []).map((entry) => String(entry).trim().toLowerCase()));
  return Array.from(roleSet).some((role) => APPROVAL_ROLES.has(role));
}
