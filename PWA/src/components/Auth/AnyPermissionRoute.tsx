import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "@/stores/hooks";
import { selectAuthState } from "@/stores/authSlice";

type AnyPermissionRouteProps = {
  children: ReactNode;
  requiredPermissions: string[];
};

function AnyPermissionRoute({ children, requiredPermissions }: AnyPermissionRouteProps) {
  const location = useLocation();
  const auth = useAppSelector(selectAuthState);
  const permissionSet = new Set((auth.permissions ?? []).map((permission) => String(permission).toLowerCase()));
  if (permissionSet.has("*")) return <>{children}</>;

  const required = requiredPermissions.map((permission) => String(permission).toLowerCase());
  if (required.some((permission) => permissionSet.has(permission))) {
    return <>{children}</>;
  }

  return <Navigate to="/appOld/dashboard" replace state={{ from: location.pathname }} />;
}

export default AnyPermissionRoute;
