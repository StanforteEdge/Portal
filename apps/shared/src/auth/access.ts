import type { AuthUser } from "./types";

const MODULE_PREFIXES: Record<string, string[]> = {
  requests: ["requests"],
  attendance: ["attendance"],
  leave: ["leave"],
  work: ["work"],
  hr: ["hr"],
  admin: ["users", "groups", "projects", "admin", "settings", "roles", "audit", "workflow", "organizations"],
  finance: ["finance"],
};

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

export function hasModuleAccess(user: Pick<AuthUser, "permissions"> | null | undefined, moduleKey: string) {
  const module = String(moduleKey || "").trim().toLowerCase();
  if (!module) return false;

  const permissionSet = new Set((user?.permissions ?? []).map((entry) => String(entry).trim().toLowerCase()));
  if (permissionSet.has("*")) return true;

  const prefixes = MODULE_PREFIXES[module];
  if (!prefixes) return false;

  return prefixes.some((prefix) =>
    permissionSet.has(`${prefix}.*`) ||
    Array.from(permissionSet).some((p) => p.startsWith(`${prefix}.`)),
  );
}

export function hasApprovalAccess(user: Pick<AuthUser, "permissions"> | null | undefined) {
  return hasAnyPermission(user, ["requests.approve"]);
}
