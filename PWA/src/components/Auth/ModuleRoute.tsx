import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "@/stores/hooks";
import { selectAuthState } from "@/stores/authSlice";

type ModuleRouteProps = {
  children: ReactNode;
  moduleKey: string;
};

function ModuleRoute({ children, moduleKey }: ModuleRouteProps) {
  const location = useLocation();
  const auth = useAppSelector(selectAuthState);
  const permissionSet = new Set((auth.permissions ?? []).map((permission) => String(permission).toLowerCase()));
  if (permissionSet.has("*")) return <>{children}</>;

  const enabledModules = new Set((auth.enabledModules ?? []).map((entry) => String(entry).toLowerCase()));
  if (enabledModules.size === 0 || enabledModules.has(String(moduleKey).toLowerCase())) {
    return <>{children}</>;
  }

  return <Navigate to="/appOld/dashboard" replace state={{ from: location.pathname }} />;
}

export default ModuleRoute;
