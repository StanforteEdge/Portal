import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "@/stores/hooks";
import { selectAuthState } from "@/stores/authSlice";

type ModuleRouteProps = {
  children: ReactNode;
  moduleKey: string;
};

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

function ModuleRoute({ children, moduleKey }: ModuleRouteProps) {
  const location = useLocation();
  const auth = useAppSelector(selectAuthState);
  const permissionSet = new Set((auth.permissions ?? []).map((permission) => String(permission).toLowerCase()));
  if (permissionSet.has("*")) return <>{children}</>;

  const module = String(moduleKey).toLowerCase();
  const prefixes = MODULE_PREFIXES[module];
  if (!prefixes) return <Navigate to="/appOld/dashboard" replace state={{ from: location.pathname }} />;

  const manageOnly = MANAGE_ONLY_PREFIXES[module] ?? new Set();
  const hasAccess = prefixes.some((prefix) => hasPrefixAccess(permissionSet, prefix, manageOnly.has(prefix)));

  if (hasAccess) return <>{children}</>;
  return <Navigate to="/appOld/dashboard" replace state={{ from: location.pathname }} />;
}

export default ModuleRoute;
