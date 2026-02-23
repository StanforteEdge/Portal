import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "@/stores/hooks";
import { selectAuthState } from "@/stores/authSlice";

type PermissionRouteProps = {
  children: ReactNode;
  requiredPermissions: string[];
};

function PermissionRoute({ children, requiredPermissions }: PermissionRouteProps) {
  const location = useLocation();
  const auth = useAppSelector(selectAuthState);
  const permissionSet = new Set((auth.permissions ?? []).map((permission) => String(permission).toLowerCase()));
  if (permissionSet.has("*")) return <>{children}</>;

  const required = requiredPermissions.map((permission) => String(permission).toLowerCase());
  if (required.every((permission) => permissionSet.has(permission))) {
    return <>{children}</>;
  }

  return <Navigate to="/app/dashboard" replace state={{ from: location.pathname }} />;
}

export default PermissionRoute;
