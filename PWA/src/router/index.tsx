import { Navigate, useRoutes } from "react-router-dom";

import Layout from "../themes";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import AcceptInvite from "../pages/AcceptInvite";
import ErrorPage from "../pages/ErrorPage";
import DashboardOverview1 from "../pages/DashboardOverview1";
import UpdateProfile from "../pages/UpdateProfile";
import ChangePassword from "../pages/ChangePassword";
import FinanceSettings from "../pages/FinanceSettings";
import UserManagement from "../pages/UserManagement";
import RequestsPage from "../pages/Requests";
import RequestsCreatePage from "../pages/RequestsCreate";
import RequestDetailPage from "../pages/RequestDetail";
import RequestApprovalsPage from "../pages/RequestApprovals";
import FinanceDashboardPage from "../pages/FinanceDashboard";
import FinanceRequestsPage from "../pages/FinanceRequests";
import FinanceRequestDetailPage from "../pages/FinanceRequestDetail";
import AdminSettingsPage from "../pages/AdminSettings";

import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import PublicOnlyRoute from "@/components/Auth/PublicOnlyRoute";

function Router() {
  const routes = [
    {
      path: "/",
      element: <Navigate to="/app/dashboard" replace />,
    },
    {
      path: "/app",
      element: (
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      ),
      children: [
        {
          path: "",
          element: <Navigate to="dashboard" replace />,
        },
        {
          path: "dashboard",
          element: <DashboardOverview1 />,
        },
        {
          path: "profile",
          element: <UpdateProfile />,
        },
        {
          path: "requests",
          element: <RequestsPage />,
        },
        {
          path: "requests/create",
          element: <RequestsCreatePage />,
        },
        {
          path: "requests/request/:id",
          element: <RequestDetailPage />,
        },
        {
          path: "requests/approvals",
          element: <RequestApprovalsPage />,
        },
        {
          path: "requests/approvals/:id",
          element: <RequestDetailPage />,
        },
        {
          path: "finance",
          element: <FinanceDashboardPage />,
        },
        {
          path: "finance/requests",
          element: <FinanceRequestsPage />,
        },
        {
          path: "finance/requests/request/:id",
          element: <FinanceRequestDetailPage />,
        },
        {
          path: "finance/settings",
          element: <FinanceSettings />,
        },
        {
          path: "finance/settings/signatories",
          element: <Navigate to="/app/finance/settings" replace />,
        },
        {
          path: "admin/users/list",
          element: <UserManagement />,
        },
        {
          path: "admin/settings",
          element: <AdminSettingsPage />,
        },
      ],
    },

    {
      path: "/login",
      element: (
        <PublicOnlyRoute>
          <Login />
        </PublicOnlyRoute>
      ),
    },
    {
      path: "/register",
      element: (
        <PublicOnlyRoute>
          <Register />
        </PublicOnlyRoute>
      ),
    },
    {
      path: "/forgot-password",
      element: (
        <PublicOnlyRoute>
          <ForgotPassword />
        </PublicOnlyRoute>
      ),
    },
    {
      path: "/reset-password",
      element: (
        <PublicOnlyRoute>
          <ResetPassword />
        </PublicOnlyRoute>
      ),
    },
    {
      path: "/accept-invite",
      element: (
        <PublicOnlyRoute>
          <AcceptInvite />
        </PublicOnlyRoute>
      ),
    },
    {
      path: "/auth/login",
      element: <Navigate to="/login" replace />,
    },
    {
      path: "/auth/register",
      element: <Navigate to="/register" replace />,
    },
    {
      path: "/auth/forgot/password",
      element: <Navigate to="/forgot-password" replace />,
    },
    {
      path: "/auth/reset/password",
      element: <Navigate to="/reset-password" replace />,
    },
    {
      path: "/auth/invite/accept",
      element: <Navigate to="/accept-invite" replace />,
    },
    {
      path: "/update-profile",
      element: <Navigate to="/app/profile" replace />,
    },
    {
      path: "/change-password",
      element: (
        <ProtectedRoute>
          <ChangePassword />
        </ProtectedRoute>
      ),
    },
    {
      path: "/finance-settings",
      element: <Navigate to="/app/finance/settings" replace />,
    },
    {
      path: "/user-management",
      element: <Navigate to="/app/admin/users/list" replace />,
    },
    {
      path: "/app/profile/view",
      element: <Navigate to="/app/profile" replace />,
    },
    {
      path: "/app/profile/edit",
      element: <Navigate to="/app/profile" replace />,
    },
    {
      path: "/app/profile/password",
      element: <Navigate to="/change-password" replace />,
    },
    {
      path: "/app/requests/list",
      element: <Navigate to="/app/requests" replace />,
    },

    {
      path: "/error-page",
      element: <ErrorPage />,
    },
    {
      path: "*",
      element: <ErrorPage />,
    },
  ];

  return useRoutes(routes);
}

export default Router;
