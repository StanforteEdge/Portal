import { ReactNode, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import {
  initializeAuth,
  selectAuthState,
  selectIsAuthenticated,
} from "@/stores/authSlice";
import { resolveRedirectPath } from "@/utils/resolveRedirectPath";

type PublicOnlyRouteProps = {
  children: ReactNode;
};

function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(selectAuthState);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  useEffect(() => {
    if (!auth.initialized && auth.status === "idle") {
      dispatch(initializeAuth());
    }
  }, [auth.initialized, auth.status, dispatch]);

  if (auth.status === "checking") {
    return <>{children}</>;
  }

  if (isAuthenticated) {
    return (
      <Navigate
        to={resolveRedirectPath(auth.roles, (auth.user?.onboarding_status as string | undefined) ?? null)}
        replace
      />
    );
  }

  return <>{children}</>;
}

export default PublicOnlyRoute;
