import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import {
  initializeAuth,
  selectAuthState,
  selectIsAuthenticated,
} from "@/stores/authSlice";
import { getStoredSession } from "@/utils/authStorage";

type ProtectedRouteProps = {
  children: ReactNode;
};

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const auth = useAppSelector(selectAuthState);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const { accessToken, refreshToken } = getStoredSession();
  const hasStoredSession = Boolean(accessToken && refreshToken);

  useEffect(() => {
    if (hasStoredSession && !auth.initialized && auth.status === "idle") {
      dispatch(initializeAuth());
    }
  }, [auth.initialized, auth.status, dispatch, hasStoredSession]);

  if (!hasStoredSession && !isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  // Keep current URL while auth rehydrates from stored session.
  // This prevents role routes from redirecting to dashboard before roles are available.
  if (hasStoredSession && (!auth.initialized || auth.status === "checking")) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return <>{children}</>;
}

export default ProtectedRoute;
