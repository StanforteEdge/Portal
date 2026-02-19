import { lazy, Suspense } from "react";
import { Navigate, useRoutes } from "react-router-dom";

import Layout from "../themes";

import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import PublicOnlyRoute from "@/components/Auth/PublicOnlyRoute";
import RoleRoute from "@/components/Auth/RoleRoute";

const Login = lazy(() => import("../pages/Login"));
const Register = lazy(() => import("../pages/Register"));
const ForgotPassword = lazy(() => import("../pages/ForgotPassword"));
const ResetPassword = lazy(() => import("../pages/ResetPassword"));
const AcceptInvite = lazy(() => import("../pages/AcceptInvite"));
const ErrorPage = lazy(() => import("../pages/ErrorPage"));
const PortalDashboardPage = lazy(() => import("../pages/PortalDashboard"));
const UpdateProfile = lazy(() => import("../pages/UpdateProfile"));
const ChangePassword = lazy(() => import("../pages/ChangePassword"));
const FinanceSettings = lazy(() => import("../pages/FinanceSettings"));
const UserManagement = lazy(() => import("../pages/UserManagement"));
const RequestsPage = lazy(() => import("../pages/Requests"));
const RequestsCreatePage = lazy(() => import("../pages/RequestsCreate"));
const RequestDetailPage = lazy(() => import("../pages/RequestDetail"));
const RequestApprovalsPage = lazy(() => import("../pages/RequestApprovals"));
const FinanceDashboardPage = lazy(() => import("../pages/FinanceDashboard"));
const FinanceRequestsPage = lazy(() => import("../pages/FinanceRequests"));
const FinanceRequestDetailPage = lazy(() => import("../pages/FinanceRequestDetail"));
const AdminSettingsPage = lazy(() => import("../pages/AdminSettings"));
const FinanceManualEntryPage = lazy(() => import("../pages/FinanceManualEntry"));
const AdminFilesPage = lazy(() => import("../pages/AdminFiles"));
const AdminProjectsPage = lazy(() => import("../pages/AdminProjects"));
const AdminDocumentsPage = lazy(() => import("../pages/AdminDocuments"));
const AdminDocumentEditorPage = lazy(() => import("../pages/AdminDocumentEditor"));
const AdminRolesPage = lazy(() => import("../pages/AdminRoles"));
const MediaLibraryPage = lazy(() => import("../pages/MediaLibrary"));
const DocumentsPage = lazy(() => import("../pages/Documents"));
const OnboardingPage = lazy(() => import("../pages/Onboarding"));
const HrEmployeesPage = lazy(() => import("../pages/HrEmployees"));
const HrDashboardPage = lazy(() => import("../pages/HrDashboard"));
const HrOnboardingPage = lazy(() => import("../pages/HrOnboarding"));
const AdminFormsPage = lazy(() => import("../pages/AdminForms"));
const AdminFormEditorPage = lazy(() => import("../pages/AdminFormEditor"));
const HrEmployeeEditorPage = lazy(() => import("../pages/HrEmployeeEditor"));

function page(element: JSX.Element) {
  return (
    <Suspense fallback={<div className="p-6 text-slate-500">Loading...</div>}>
      {element}
    </Suspense>
  );
}

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
          element: page(<PortalDashboardPage />),
        },
        {
          path: "profile",
          element: page(<UpdateProfile />),
        },
        {
          path: "settings/security",
          element: page(<ChangePassword />),
        },
        {
          path: "onboarding",
          element: page(<OnboardingPage />),
        },
        {
          path: "media",
          element: page(<MediaLibraryPage />),
        },
        {
          path: "documents",
          element: page(<DocumentsPage />),
        },
        {
          path: "requests",
          element: page(<RequestsPage />),
        },
        {
          path: "requests/create",
          element: page(<RequestsCreatePage />),
        },
        {
          path: "requests/request/:id",
          element: page(<RequestDetailPage />),
        },
        {
          path: "requests/approvals",
          element: page(<RequestApprovalsPage />),
        },
        {
          path: "requests/approvals/:id",
          element: page(<RequestDetailPage />),
        },
        {
          path: "finance",
          element: (
            <RoleRoute allowedRoles={["accountant", "finance_manager"]}>
              {page(<FinanceDashboardPage />)}
            </RoleRoute>
          ),
        },
        {
          path: "finance/requests",
          element: (
            <RoleRoute allowedRoles={["accountant", "finance_manager"]}>
              {page(<FinanceRequestsPage />)}
            </RoleRoute>
          ),
        },
        {
          path: "finance/requests/request/:id",
          element: (
            <RoleRoute allowedRoles={["accountant", "finance_manager"]}>
              {page(<FinanceRequestDetailPage />)}
            </RoleRoute>
          ),
        },
        {
          path: "finance/settings",
          element: (
            <RoleRoute allowedRoles={["accountant", "finance_manager"]}>
              {page(<FinanceSettings />)}
            </RoleRoute>
          ),
        },
        {
          path: "finance/manualentry",
          element: (
            <RoleRoute allowedRoles={["finance_manager"]}>
              {page(<FinanceManualEntryPage />)}
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
              {page(<UserManagement />)}
            </RoleRoute>
          ),
        },
        {
          path: "admin/settings",
          element: (
            <RoleRoute allowedRoles={["admin"]}>
              {page(<AdminSettingsPage />)}
            </RoleRoute>
          ),
        },
        {
          path: "admin/files",
          element: (
            <RoleRoute allowedRoles={["admin"]}>
              {page(<AdminFilesPage />)}
            </RoleRoute>
          ),
        },
        {
          path: "admin/projects",
          element: (
            <RoleRoute allowedRoles={["admin"]}>
              {page(<AdminProjectsPage />)}
            </RoleRoute>
          ),
        },
        {
          path: "admin/documents",
          element: (
            <RoleRoute allowedRoles={["admin"]}>
              {page(<AdminDocumentsPage />)}
            </RoleRoute>
          ),
        },
        {
          path: "admin/documents/new",
          element: (
            <RoleRoute allowedRoles={["admin"]}>
              {page(<AdminDocumentEditorPage />)}
            </RoleRoute>
          ),
        },
        {
          path: "admin/documents/:id",
          element: (
            <RoleRoute allowedRoles={["admin"]}>
              {page(<AdminDocumentEditorPage />)}
            </RoleRoute>
          ),
        },
        {
          path: "admin/roles",
          element: (
            <RoleRoute allowedRoles={["admin"]}>
              {page(<AdminRolesPage />)}
            </RoleRoute>
          ),
        },
        {
          path: "admin/forms",
          element: (
            <RoleRoute allowedRoles={["admin"]}>
              {page(<AdminFormsPage />)}
            </RoleRoute>
          ),
        },
        {
          path: "admin/forms/new",
          element: (
            <RoleRoute allowedRoles={["admin"]}>
              {page(<AdminFormEditorPage />)}
            </RoleRoute>
          ),
        },
        {
          path: "admin/forms/:id",
          element: (
            <RoleRoute allowedRoles={["admin"]}>
              {page(<AdminFormEditorPage />)}
            </RoleRoute>
          ),
        },
        {
          path: "hr",
          element: (
            <RoleRoute allowedRoles={["hr"]}>
              {page(<HrDashboardPage />)}
            </RoleRoute>
          ),
        },
        {
          path: "hr/employees",
          element: (
            <RoleRoute allowedRoles={["hr"]}>
              {page(<HrEmployeesPage />)}
            </RoleRoute>
          ),
        },
        {
          path: "hr/employees/employee",
          element: (
            <RoleRoute allowedRoles={["hr"]}>
              {page(<HrEmployeeEditorPage />)}
            </RoleRoute>
          ),
        },
        {
          path: "hr/employees/:id",
          element: (
            <RoleRoute allowedRoles={["hr"]}>
              {page(<HrEmployeeEditorPage />)}
            </RoleRoute>
          ),
        },
        {
          path: "hr/onboarding",
          element: (
            <RoleRoute allowedRoles={["hr"]}>
              {page(<HrOnboardingPage />)}
            </RoleRoute>
          ),
        },
      ],
    },
    {
      path: "/login",
      element: (
        <PublicOnlyRoute>
          {page(<Login />)}
        </PublicOnlyRoute>
      ),
    },
    {
      path: "/register",
      element: (
        <PublicOnlyRoute>
          {page(<Register />)}
        </PublicOnlyRoute>
      ),
    },
    {
      path: "/forgot-password",
      element: (
        <PublicOnlyRoute>
          {page(<ForgotPassword />)}
        </PublicOnlyRoute>
      ),
    },
    {
      path: "/reset-password",
      element: (
        <PublicOnlyRoute>
          {page(<ResetPassword />)}
        </PublicOnlyRoute>
      ),
    },
    {
      path: "/accept-invite",
      element: (
        <PublicOnlyRoute>
          {page(<AcceptInvite />)}
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
      element: page(<ErrorPage />),
    },
    {
      path: "*",
      element: page(<ErrorPage />),
    },
  ];

  return useRoutes(routes);
}

export default Router;
