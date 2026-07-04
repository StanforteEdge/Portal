import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "@/stores/hooks";
import { selectAuthState } from "@/stores/authSlice";

const MODULE_GATE: Record<string, string> = {
  finance: "finance.view",
  hr: "hr.view",
  admin: "admin.view",
  payroll: "payroll.manage",
  attendance: "attendance.clock",
  leave: "leave.view",
  media: "admin.view",
  documents: "admin.view",
};

type ModuleRouteProps = {
  children: ReactNode;
  moduleKey: string;
};

function ModuleRoute({ children, moduleKey }: ModuleRouteProps) {
  const location = useLocation();
  const auth = useAppSelector(selectAuthState);
  const permissionSet = new Set((auth.permissions ?? []).map((permission) => String(permission).toLowerCase()));
  if (permissionSet.has("*")) return <>{children}</>;

  const gate = MODULE_GATE[String(moduleKey).toLowerCase()];
  if (!gate || permissionSet.has(gate.toLowerCase())) {
    return <>{children}</>;
  }

  return <Navigate to="/appOld/dashboard" replace state={{ from: location.pathname }} />;
}

export default ModuleRoute;
