import { Navigate, useRoutes } from "react-router-dom";

import Layout from "../themes";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import AcceptInvite from "../pages/AcceptInvite";
import ErrorPage from "../pages/ErrorPage";
import PortalDashboardPage from "../pages/PortalDashboard";
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
import FinanceManualEntryPage from "../pages/FinanceManualEntry";
import AdminFilesPage from "../pages/AdminFiles";
import AdminProjectsPage from "../pages/AdminProjects";
import AdminDocumentsPage from "../pages/AdminDocuments";
import AdminDocumentEditorPage from "../pages/AdminDocumentEditor";
import AdminRolesPage from "../pages/AdminRoles";
import MediaLibraryPage from "../pages/MediaLibrary";
import DocumentsPage from "../pages/Documents";
import OnboardingPage from "../pages/Onboarding";
import HrEmployeesPage from "../pages/HrEmployees";
import HrDashboardPage from "../pages/HrDashboard";
import HrOnboardingPage from "../pages/HrOnboarding";
import AdminFormsPage from "../pages/AdminForms";
import AdminFormEditorPage from "../pages/AdminFormEditor";
import HrEmployeeEditorPage from "../pages/HrEmployeeEditor";

import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import PublicOnlyRoute from "@/components/Auth/PublicOnlyRoute";
import RoleRoute from "@/components/Auth/RoleRoute";

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
          element: <PortalDashboardPage />,
        },
        {
          path: "profile",
          element: <UpdateProfile />,
        },
        {
          path: "settings/security",
          element: <ChangePassword />,
        },
        {
          path: "onboarding",
          element: <OnboardingPage />,
        },
        {
          path: "media",
          element: <MediaLibraryPage />,
        },
        {
          path: "documents",
          element: <DocumentsPage />,
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
          element: (
            <RoleRoute allowedRoles={["accountant", "finance_manager"]}>
              <FinanceDashboardPage />
            </RoleRoute>
          ),
        },
        {
          path: "finance/requests",
          element: (
            <RoleRoute allowedRoles={["accountant", "finance_manager"]}>
              <FinanceRequestsPage />
            </RoleRoute>
          ),
        },
        {
          path: "finance/requests/request/:id",
          element: (
            <RoleRoute allowedRoles={["accountant", "finance_manager"]}>
              <FinanceRequestDetailPage />
            </RoleRoute>
          ),
        },
        {
          path: "finance/settings",
          element: (
            <RoleRoute allowedRoles={["accountant", "finance_manager"]}>
              <FinanceSettings />
            </RoleRoute>
          ),
        },
        {
          path: "finance/manualentry",
          element: (
            <RoleRoute allowedRoles={["finance_manager"]}>
              <FinanceManualEntryPage />
            </RoleRoute>
          ),
        },
        {
          path: "finance/settings/signatories",
          element: <Navigate to="/app/finance/settings" replace />,
        },
        {
          path: "admin/users/list",
          element: (
            <RoleRoute allowedRoles={["admin"]}>
              <UserManagement />
            </RoleRoute>
          ),
        },
        {
          path: "admin/settings",
          element: (
            <RoleRoute allowedRoles={["admin"]}>
              <AdminSettingsPage />
            </RoleRoute>
          ),
        },
        {
          path: "admin/files",
          element: (
            <RoleRoute allowedRoles={["admin"]}>
              <AdminFilesPage />
            </RoleRoute>
          ),
        },
        {
          path: "admin/projects",
          element: (
            <RoleRoute allowedRoles={["admin"]}>
              <AdminProjectsPage />
            </RoleRoute>
          ),
        },
        {
          path: "admin/documents",
          element: (
            <RoleRoute allowedRoles={["admin"]}>
              <AdminDocumentsPage />
            </RoleRoute>
          ),
        },
        {
          path: "admin/documents/new",
          element: (
            <RoleRoute allowedRoles={["admin"]}>
              <AdminDocumentEditorPage />
            </RoleRoute>
          ),
        },
        {
          path: "admin/documents/:id",
          element: (
            <RoleRoute allowedRoles={["admin"]}>
              <AdminDocumentEditorPage />
            </RoleRoute>
          ),
        },
        {
          path: "admin/roles",
          element: (
            <RoleRoute allowedRoles={["admin"]}>
              <AdminRolesPage />
            </RoleRoute>
          ),
        },
        {
          path: "admin/forms",
          element: (
            <RoleRoute allowedRoles={["admin"]}>
              <AdminFormsPage />
            </RoleRoute>
          ),
        },
        {
          path: "admin/forms/new",
          element: (
            <RoleRoute allowedRoles={["admin"]}>
              <AdminFormEditorPage />
            </RoleRoute>
          ),
        },
        {
          path: "admin/forms/:id",
          element: (
            <RoleRoute allowedRoles={["admin"]}>
              <AdminFormEditorPage />
            </RoleRoute>
          ),
        },
        {
          path: "hr",
          element: (
            <RoleRoute allowedRoles={["hr"]}>
              <HrDashboardPage />
            </RoleRoute>
          ),
        },
        {
          path: "hr/employees",
          element: (
            <RoleRoute allowedRoles={["hr"]}>
              <HrEmployeesPage />
            </RoleRoute>
          ),
        },
        {
          path: "hr/employees/employee",
          element: (
            <RoleRoute allowedRoles={["hr"]}>
              <HrEmployeeEditorPage />
            </RoleRoute>
          ),
        },
        {
          path: "hr/employees/:id",
          element: (
            <RoleRoute allowedRoles={["hr"]}>
              <HrEmployeeEditorPage />
            </RoleRoute>
          ),
        },
        {
          path: "hr/onboarding",
          element: (
            <RoleRoute allowedRoles={["hr"]}>
              <HrOnboardingPage />
            </RoleRoute>
          ),
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
      element: <Navigate to="/app/settings/security" replace />,
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
      element: <Navigate to="/app/settings/security" replace />,
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
