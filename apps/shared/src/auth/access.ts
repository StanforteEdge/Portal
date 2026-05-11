import type { AuthUser } from "./types";

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

  const permissionSet = new Set((user?.permissions ?? []).map((entry) => String(entry).trim().toLowerCase()));
  const enabledModules = new Set((user?.enabled_modules ?? []).map((entry) => String(entry).trim().toLowerCase()));

  if (permissionSet.has("*")) return true;

  if (enabledModules.has("*") || enabledModules.has(module)) return true;

  if (STAFF_MODULES.has(module)) {
    return true;
  }

  if (enabledModules.size === 0) {
    return true;
  }

  return false;
}

export function hasApprovalAccess(user: Pick<AuthUser, "permissions"> | null | undefined) {
  return hasAnyPermission(user, ["requests.approve"]);
}
