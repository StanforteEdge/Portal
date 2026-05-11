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

function ModuleRoute({ children, moduleKey }: ModuleRouteProps) {
  const location = useLocation();
  const auth = useAppSelector(selectAuthState);
  const permissionSet = new Set((auth.permissions ?? []).map((permission) => String(permission).toLowerCase()));
  if (permissionSet.has("*")) return <>{children}</>;

  const prefixes = MODULE_PREFIXES[String(moduleKey).toLowerCase()];
  if (!prefixes) return <Navigate to="/appOld/dashboard" replace state={{ from: location.pathname }} />;

  const hasAccess = prefixes.some((prefix) =>
    permissionSet.has(`${prefix}.*`) ||
    Array.from(permissionSet).some((p) => p.startsWith(`${prefix}.`)),
  );

  if (hasAccess) return <>{children}</>;
  return <Navigate to="/appOld/dashboard" replace state={{ from: location.pathname }} />;
}

export default ModuleRoute;
