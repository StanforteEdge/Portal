import { Navigate, Outlet, useLocation } from "react-router-dom";
import { hasAnyPermission, hasApprovalAccess, hasModuleAccess } from "@stanforte/shared";
import { useAuth } from "@/features/auth/AuthProvider";

type ModuleRouteProps = {
  moduleKey: string;
};

type PermissionRouteProps = {
  requiredPermissions: string[];
  any?: boolean;
};

export function ModuleRoute({ moduleKey }: ModuleRouteProps) {
  const { status, initialized, user } = useAuth();
  const location = useLocation();

  if (!initialized || status === "checking") return null;
  if (status !== "authenticated") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (hasModuleAccess(user, moduleKey)) {
    return <Outlet />;
  }

  return <Navigate to="/" replace state={{ from: location.pathname }} />;
}

export function PermissionRoute({ requiredPermissions, any = false }: PermissionRouteProps) {
  const { status, initialized, user } = useAuth();
  const location = useLocation();

  if (!initialized || status === "checking") return null;
  if (status !== "authenticated") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const allowed = any
    ? hasAnyPermission(user, requiredPermissions)
    : requiredPermissions.every((permission) =>
        hasAnyPermission(user, [permission]),
      );

  if (allowed) {
    return <Outlet />;
  }

  return <Navigate to="/" replace state={{ from: location.pathname }} />;
}

export function ApprovalRoute() {
  const { status, initialized, user } = useAuth();
  const location = useLocation();

  if (!initialized || status === "checking") return null;
  if (status !== "authenticated") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (hasApprovalAccess(user)) {
    return <Outlet />;
  }

  return <Navigate to="/requests" replace state={{ from: location.pathname }} />;
}
