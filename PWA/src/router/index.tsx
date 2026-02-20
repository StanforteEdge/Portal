import { lazy, Suspense } from "react";
import { Navigate, useRoutes } from "react-router-dom";

import Layout from "../themes";

import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import PublicOnlyRoute from "@/components/Auth/PublicOnlyRoute";
import RoleRoute from "@/components/Auth/RoleRoute";

const Login = lazy(() => import("../pages/auth/Login"));
const Register = lazy(() => import("../pages/auth/Register"));
const ForgotPassword = lazy(() => import("../pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("../pages/auth/ResetPassword"));
const AcceptInvite = lazy(() => import("../pages/auth/AcceptInvite"));
const ErrorPage = lazy(() => import("../pages/shared/ErrorPage"));
const PortalDashboardPage = lazy(
  () => import("../pages/staff/dashboard/PortalDashboard")
);
const UpdateProfile = lazy(() => import("../pages/staff/profile/UpdateProfile"));
const ChangePassword = lazy(() => import("../pages/staff/security/ChangePassword"));
const FinanceSettings = lazy(
  () => import("../pages/finance/settings/FinanceSettings")
);
const FinanceRequestTypeEditor = lazy(
  () => import("../pages/finance/settings/RequestTypeEditor")
);
const UserManagement = lazy(() => import("../pages/admin/users/UserManagement"));
const UserCreatePage = lazy(() => import("../pages/admin/users/UserCreate"));
const UserRolesPage = lazy(() => import("../pages/admin/users/UserRoles"));
const RequestsPage = lazy(() => import("../pages/staff/requests/RequestsList"));
const RequestsCreatePage = lazy(
  () => import("../pages/staff/requests/RequestsCreate")
);
const RequestDetailPage = lazy(() => import("../pages/staff/requests/RequestDetail"));
const RequestApprovalsPage = lazy(
  () => import("../pages/staff/requests/RequestApprovals")
);
const FinanceDashboardPage = lazy(
  () => import("../pages/finance/dashboard/FinanceDashboard")
);
const FinanceRequestsPage = lazy(
  () => import("../pages/finance/requests/FinanceRequestsList")
);
const FinanceRequestDetailPage = lazy(
  () => import("../pages/finance/requests/FinanceRequestDetail")
);
const AdminSettingsPage = lazy(
  () => import("../pages/admin/settings/AdminSettings")
);
const FinanceManualEntryPage = lazy(
  () => import("../pages/finance/manual-entry/FinanceManualEntry")
);
const FinanceAccountsPage = lazy(
  () => import("../pages/finance/accounts/FinanceAccounts")
);
const FinanceLedgerPage = lazy(
  () => import("../pages/finance/ledger/FinanceLedger")
);
const AdminFilesPage = lazy(() => import("../pages/admin/files/AdminFiles"));
const AdminProjectsPage = lazy(
  () => import("../pages/admin/projects/AdminProjects")
);
const AdminDocumentsPage = lazy(
  () => import("../pages/admin/documents/AdminDocuments")
);
const AdminDocumentEditorPage = lazy(
  () => import("../pages/admin/documents/AdminDocumentEditor")
);
const AdminRolesPage = lazy(() => import("../pages/admin/roles/AdminRoles"));
const MediaLibraryPage = lazy(() => import("../pages/staff/media/MediaLibrary"));
const DocumentsPage = lazy(() => import("../pages/staff/documents/Documents"));
const OnboardingPage = lazy(() => import("../pages/staff/onboarding/Onboarding"));
const HrEmployeesPage = lazy(() => import("../pages/hr/employees/HrEmployees"));
const HrDashboardPage = lazy(() => import("../pages/hr/dashboard/HrDashboard"));
const HrOnboardingPage = lazy(() => import("../pages/hr/onboarding/HrOnboarding"));
const HrOnboardingEditorPage = lazy(
  () => import("../pages/hr/onboarding/HrOnboardingEditor")
);
const AdminFormsPage = lazy(() => import("../pages/admin/forms/AdminForms"));
const AdminFormEditorPage = lazy(
  () => import("../pages/admin/forms/AdminFormEditor")
);
const HrEmployeeEditorPage = lazy(
  () => import("../pages/hr/employees/HrEmployeeEditor")
);

function page(element: JSX.Element) {
  return (
    <Suspense
      fallback={
        <div className="p-6 animate-pulse">
          <div className="h-6 w-40 rounded bg-slate-200 mb-4"></div>
          <div className="h-24 rounded bg-slate-100"></div>
        </div>
      }
    >
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
          path: "requests/new",
          element: page(<RequestsCreatePage />),
        },
        {
          path: "requests/create",
          element: <Navigate to="/app/requests/new" replace />,
        },
        {
          path: "requests/request/:id",
          element: page(<RequestDetailPage />),
        },
        {
          path: "requests/:id",
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
          path: "finance/requests/new",
          element: (
            <RoleRoute allowedRoles={["finance_manager"]}>
              {page(<FinanceManualEntryPage />)}
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
          path: "finance/requests/:id",
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
          path: "finance/settings/request-types/new",
          element: (
            <RoleRoute allowedRoles={["accountant", "finance_manager"]}>
              {page(<FinanceRequestTypeEditor />)}
            </RoleRoute>
          ),
        },
        {
          path: "finance/settings/request-types/:id",
          element: (
            <RoleRoute allowedRoles={["accountant", "finance_manager"]}>
              {page(<FinanceRequestTypeEditor />)}
            </RoleRoute>
          ),
        },
        {
          path: "finance/manual-entry",
          element: (
            <RoleRoute allowedRoles={["finance_manager"]}>
              {page(<FinanceManualEntryPage />)}
            </RoleRoute>
          ),
        },
        {
          path: "finance/accounts",
          element: (
            <RoleRoute allowedRoles={["accountant", "finance_manager"]}>
              {page(<FinanceAccountsPage />)}
            </RoleRoute>
          ),
        },
        {
          path: "finance/ledger",
          element: (
            <RoleRoute allowedRoles={["accountant", "finance_manager"]}>
              {page(<FinanceLedgerPage />)}
            </RoleRoute>
          ),
        },
        {
          path: "finance/manualentry",
          element: <Navigate to="/app/finance/manual-entry" replace />,
        },
        {
          path: "finance/settings/signatories",
          element: <Navigate to="/app/finance/settings" replace />,
        },
        {
          path: "admin/users",
          element: (
            <RoleRoute allowedRoles={["admin"]}>
              {page(<UserManagement />)}
            </RoleRoute>
          ),
        },
        {
          path: "admin/users/new",
          element: (
            <RoleRoute allowedRoles={["admin"]}>
              {page(<UserCreatePage />)}
            </RoleRoute>
          ),
        },
        {
          path: "admin/users/:id/roles",
          element: (
            <RoleRoute allowedRoles={["admin"]}>
              {page(<UserRolesPage />)}
            </RoleRoute>
          ),
        },
        {
          path: "admin/users/list",
          element: <Navigate to="/app/admin/users" replace />,
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
          path: "hr/employees/new",
          element: (
            <RoleRoute allowedRoles={["hr"]}>
              {page(<HrEmployeeEditorPage />)}
            </RoleRoute>
          ),
        },
        {
          path: "hr/employees/employee",
          element: <Navigate to="/app/hr/employees/new" replace />,
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
        {
          path: "hr/onboarding/new",
          element: (
            <RoleRoute allowedRoles={["hr"]}>
              {page(<HrOnboardingEditorPage />)}
            </RoleRoute>
          ),
        },
        {
          path: "hr/onboarding/:id",
          element: (
            <RoleRoute allowedRoles={["hr"]}>
              {page(<HrOnboardingEditorPage />)}
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
      element: <Navigate to="/app/admin/users" replace />,
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
