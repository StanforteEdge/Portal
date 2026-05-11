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

const MANAGE_ONLY_PREFIXES: Record<string, Set<string>> = {
  admin: new Set(["groups", "projects", "workflow"]),
};

function hasPrefixAccess(permissionSet: Set<string>, prefix: string, manageOnly: boolean): boolean {
  if (permissionSet.has(`${prefix}.*`)) return true;
  if (manageOnly) {
    return Array.from(permissionSet).some((p) => p === `${prefix}.manage`);
  }
  return Array.from(permissionSet).some((p) => p.startsWith(`${prefix}.`));
}

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

  const manageOnly = MANAGE_ONLY_PREFIXES[module] ?? new Set();

  return prefixes.some((prefix) => hasPrefixAccess(permissionSet, prefix, manageOnly.has(prefix)));
}

export function hasApprovalAccess(user: Pick<AuthUser, "permissions"> | null | undefined) {
  return hasAnyPermission(user, ["requests.approve"]);
}
