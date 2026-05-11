import type { AuthUser } from "./types";

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

export function hasApprovalAccess(user: Pick<AuthUser, "permissions"> | null | undefined) {
  return hasAnyPermission(user, ["requests.approve"]);
}
