import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "@/stores/hooks";
import { selectAuthState } from "@/stores/authSlice";

type RoleRouteProps = {
  children: ReactNode;
  allowedRoles: string[];
};

function RoleRoute({ children, allowedRoles }: RoleRouteProps) {
  const location = useLocation();
  const auth = useAppSelector(selectAuthState);
  const roles = (auth.roles ?? []).map((role) => String(role).toLowerCase());
  const allowed = allowedRoles.map((role) => role.toLowerCase());

  if (roles.includes("admin")) return <>{children}</>;
  if (allowed.some((role) => roles.includes(role))) return <>{children}</>;

  return <Navigate to="/app/dashboard" replace state={{ from: location.pathname }} />;
}

export default RoleRoute;
