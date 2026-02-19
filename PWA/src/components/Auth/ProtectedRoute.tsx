import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import {
  initializeAuth,
  selectAuthState,
  selectIsAuthenticated,
} from "@/stores/authSlice";

type ProtectedRouteProps = {
  children: ReactNode;
};

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const auth = useAppSelector(selectAuthState);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  useEffect(() => {
    if (!auth.initialized && auth.status === "idle") {
      dispatch(initializeAuth());
    }
  }, [auth.initialized, auth.status, dispatch]);

  if (!auth.initialized || auth.status === "checking") {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-600">
        Loading...
      </div>
    );
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
