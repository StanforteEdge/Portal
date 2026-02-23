import { lazy, Suspense } from "react";
import { Navigate, useRoutes } from "react-router-dom";

import Layout from "../themes";

import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import PublicOnlyRoute from "@/components/Auth/PublicOnlyRoute";
import PermissionRoute from "@/components/Auth/PermissionRoute";

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
const FinanceAccountDetailPage = lazy(
  () => import("../pages/finance/accounts/FinanceAccountDetail")
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
const AdminPoliciesPage = lazy(() => import("../pages/admin/policies/AdminPolicies"));
const MediaLibraryPage = lazy(() => import("../pages/staff/media/MediaLibrary"));
const DocumentsPage = lazy(() => import("../pages/staff/documents/Documents"));
const OnboardingPage = lazy(() => import("../pages/staff/onboarding/Onboarding"));
const StaffAttendancePage = lazy(() => import("../pages/staff/attendance/StaffAttendance"));
const StaffLeaveTrackerPage = lazy(() => import("../pages/staff/leave/StaffLeaveTracker"));
const HrEmployeesPage = lazy(() => import("../pages/hr/employees/HrEmployees"));
const HrDashboardPage = lazy(() => import("../pages/hr/dashboard/HrDashboard"));
const HrOnboardingPage = lazy(() => import("../pages/hr/onboarding/HrOnboarding"));
const HrAttendancePage = lazy(() => import("../pages/hr/attendance/HrAttendance"));
const HrLeaveTrackerPage = lazy(() => import("../pages/hr/leave/HrLeaveTracker"));
const HrLeaveRequestsPage = lazy(() => import("../pages/hr/leave/HrLeaveRequests"));
const HrSettingsPage = lazy(() => import("../pages/hr/settings/HrSettings"));
const HrRequestTypeEditorPage = lazy(
  () => import("../pages/hr/settings/HrRequestTypeEditor")
);
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
          path: "requests/finance",
          element: page(<RequestsPage />),
        },
        {
          path: "requests/new",
          element: page(<RequestsCreatePage />),
        },
        {
          path: "requests/finance/new",
          element: page(<RequestsCreatePage />),
        },
        {
          path: "requests/leave/new",
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
          path: "requests/attendance",
          element: page(<StaffAttendancePage />),
        },
        {
          path: "requests/leave",
          element: page(<StaffLeaveTrackerPage />),
        },
        {
          path: "finance",
          element: (
            <PermissionRoute requiredPermissions={["finance.view"]}>
              {page(<FinanceDashboardPage />)}
            </PermissionRoute>
          ),
        },
        {
          path: "finance/requests",
          element: (
            <PermissionRoute requiredPermissions={["finance.view"]}>
              {page(<FinanceRequestsPage />)}
            </PermissionRoute>
          ),
        },
        {
          path: "finance/requests/new",
          element: (
            <PermissionRoute requiredPermissions={["requests.manage"]}>
              {page(<FinanceManualEntryPage />)}
            </PermissionRoute>
          ),
        },
        {
          path: "finance/requests/request/:id",
          element: (
            <PermissionRoute requiredPermissions={["finance.view"]}>
              {page(<FinanceRequestDetailPage />)}
            </PermissionRoute>
          ),
        },
        {
          path: "finance/requests/:id",
          element: (
            <PermissionRoute requiredPermissions={["finance.view"]}>
              {page(<FinanceRequestDetailPage />)}
            </PermissionRoute>
          ),
        },
        {
          path: "finance/settings",
          element: (
            <PermissionRoute requiredPermissions={["finance.view"]}>
              {page(<FinanceSettings />)}
            </PermissionRoute>
          ),
        },
        {
          path: "finance/settings/request-types/new",
          element: (
            <PermissionRoute requiredPermissions={["finance.view"]}>
              {page(<FinanceRequestTypeEditor />)}
            </PermissionRoute>
          ),
        },
        {
          path: "finance/settings/request-types/:id",
          element: (
            <PermissionRoute requiredPermissions={["finance.view"]}>
              {page(<FinanceRequestTypeEditor />)}
            </PermissionRoute>
          ),
        },
        {
          path: "finance/manual-entry",
          element: (
            <PermissionRoute requiredPermissions={["requests.manage"]}>
              {page(<FinanceManualEntryPage />)}
            </PermissionRoute>
          ),
        },
        {
          path: "finance/accounts",
          element: (
            <PermissionRoute requiredPermissions={["finance.view"]}>
              {page(<FinanceAccountsPage />)}
            </PermissionRoute>
          ),
        },
        {
          path: "finance/accounts/:id",
          element: (
            <PermissionRoute requiredPermissions={["finance.view"]}>
              {page(<FinanceAccountDetailPage />)}
            </PermissionRoute>
          ),
        },
        {
          path: "finance/ledger",
          element: (
            <PermissionRoute requiredPermissions={["finance.view"]}>
              {page(<FinanceLedgerPage />)}
            </PermissionRoute>
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
            <PermissionRoute requiredPermissions={["users.manage"]}>
              {page(<UserManagement />)}
            </PermissionRoute>
          ),
        },
        {
          path: "admin/users/new",
          element: (
            <PermissionRoute requiredPermissions={["users.manage"]}>
              {page(<UserCreatePage />)}
            </PermissionRoute>
          ),
        },
        {
          path: "admin/users/:id/roles",
          element: (
            <PermissionRoute requiredPermissions={["roles.manage"]}>
              {page(<UserRolesPage />)}
            </PermissionRoute>
          ),
        },
        {
          path: "admin/users/list",
          element: <Navigate to="/app/admin/users" replace />,
        },
        {
          path: "admin/settings",
          element: (
            <PermissionRoute requiredPermissions={["settings.manage"]}>
              {page(<AdminSettingsPage />)}
            </PermissionRoute>
          ),
        },
        {
          path: "admin/files",
          element: (
            <PermissionRoute requiredPermissions={["settings.manage"]}>
              {page(<AdminFilesPage />)}
            </PermissionRoute>
          ),
        },
        {
          path: "admin/projects",
          element: (
            <PermissionRoute requiredPermissions={["settings.manage"]}>
              {page(<AdminProjectsPage />)}
            </PermissionRoute>
          ),
        },
        {
          path: "admin/documents",
          element: (
            <PermissionRoute requiredPermissions={["settings.manage"]}>
              {page(<AdminDocumentsPage />)}
            </PermissionRoute>
          ),
        },
        {
          path: "admin/documents/new",
          element: (
            <PermissionRoute requiredPermissions={["settings.manage"]}>
              {page(<AdminDocumentEditorPage />)}
            </PermissionRoute>
          ),
        },
        {
          path: "admin/documents/:id",
          element: (
            <PermissionRoute requiredPermissions={["settings.manage"]}>
              {page(<AdminDocumentEditorPage />)}
            </PermissionRoute>
          ),
        },
        {
          path: "admin/roles",
          element: (
            <PermissionRoute requiredPermissions={["roles.manage"]}>
              {page(<AdminRolesPage />)}
            </PermissionRoute>
          ),
        },
        {
          path: "admin/policies",
          element: (
            <PermissionRoute requiredPermissions={["settings.manage"]}>
              {page(<AdminPoliciesPage />)}
            </PermissionRoute>
          ),
        },
        {
          path: "admin/forms",
          element: (
            <PermissionRoute requiredPermissions={["settings.manage"]}>
              {page(<AdminFormsPage />)}
            </PermissionRoute>
          ),
        },
        {
          path: "admin/forms/new",
          element: (
            <PermissionRoute requiredPermissions={["settings.manage"]}>
              {page(<AdminFormEditorPage />)}
            </PermissionRoute>
          ),
        },
        {
          path: "admin/forms/:id",
          element: (
            <PermissionRoute requiredPermissions={["settings.manage"]}>
              {page(<AdminFormEditorPage />)}
            </PermissionRoute>
          ),
        },
        {
          path: "hr",
          element: (
            <PermissionRoute requiredPermissions={["users.manage"]}>
              {page(<HrDashboardPage />)}
            </PermissionRoute>
          ),
        },
        {
          path: "hr/employees",
          element: (
            <PermissionRoute requiredPermissions={["users.manage"]}>
              {page(<HrEmployeesPage />)}
            </PermissionRoute>
          ),
        },
        {
          path: "hr/employees/new",
          element: (
            <PermissionRoute requiredPermissions={["users.manage"]}>
              {page(<HrEmployeeEditorPage />)}
            </PermissionRoute>
          ),
        },
        {
          path: "hr/employees/employee",
          element: <Navigate to="/app/hr/employees/new" replace />,
        },
        {
          path: "hr/employees/:id",
          element: (
            <PermissionRoute requiredPermissions={["users.manage"]}>
              {page(<HrEmployeeEditorPage />)}
            </PermissionRoute>
          ),
        },
        {
          path: "hr/onboarding",
          element: (
            <PermissionRoute requiredPermissions={["users.manage"]}>
              {page(<HrOnboardingPage />)}
            </PermissionRoute>
          ),
        },
        {
          path: "hr/attendance",
          element: (
            <PermissionRoute requiredPermissions={["users.manage"]}>
              {page(<HrAttendancePage />)}
            </PermissionRoute>
          ),
        },
        {
          path: "hr/leave",
          element: (
            <PermissionRoute requiredPermissions={["users.manage"]}>
              {page(<HrLeaveTrackerPage />)}
            </PermissionRoute>
          ),
        },
        {
          path: "hr/leave/requests",
          element: (
            <PermissionRoute requiredPermissions={["users.manage"]}>
              {page(<HrLeaveRequestsPage />)}
            </PermissionRoute>
          ),
        },
        {
          path: "hr/settings",
          element: (
            <PermissionRoute requiredPermissions={["users.manage"]}>
              {page(<HrSettingsPage />)}
            </PermissionRoute>
          ),
        },
        {
          path: "hr/settings/request-types/new",
          element: (
            <PermissionRoute requiredPermissions={["users.manage"]}>
              {page(<HrRequestTypeEditorPage />)}
            </PermissionRoute>
          ),
        },
        {
          path: "hr/settings/request-types/:id",
          element: (
            <PermissionRoute requiredPermissions={["users.manage"]}>
              {page(<HrRequestTypeEditorPage />)}
            </PermissionRoute>
          ),
        },
        {
          path: "hr/onboarding/new",
          element: (
            <PermissionRoute requiredPermissions={["users.manage"]}>
              {page(<HrOnboardingEditorPage />)}
            </PermissionRoute>
          ),
        },
        {
          path: "hr/onboarding/:id",
          element: (
            <PermissionRoute requiredPermissions={["users.manage"]}>
              {page(<HrOnboardingEditorPage />)}
            </PermissionRoute>
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
