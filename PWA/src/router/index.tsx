import { lazy, Suspense } from "react";
import { Navigate, useRoutes } from "react-router-dom";

import Layout from "../themes";

import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import PublicOnlyRoute from "@/components/Auth/PublicOnlyRoute";
import PermissionRoute from "@/components/Auth/PermissionRoute";
import AnyPermissionRoute from "@/components/Auth/AnyPermissionRoute";
import ModuleRoute from "@/components/Auth/ModuleRoute";
import PageGuide from "@/components/Help/PageGuide";

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
const MyPayslipsPage = lazy(() => import("../pages/profile/MyPayslips"));
const MyTimesheetsPage = lazy(() => import("../pages/profile/MyTimesheets"));
const MyWorkPage = lazy(() => import("../pages/profile/MyWork"));
const PerformanceOverviewPage = lazy(
  () => import("../pages/work/PerformanceOverview")
);
const HelpHomePage = lazy(() => import("../pages/help/HelpHome"));
const FinanceHelpPage = lazy(() => import("../pages/help/FinanceHelp"));
const FinanceSettings = lazy(
  () => import("../pages/finance/settings/FinanceSettings")
);
const FinanceRequestTypeEditor = lazy(
  () => import("../pages/finance/settings/RequestTypeEditor")
);
const UserManagement = lazy(() => import("../pages/admin/users/UserManagement"));
const UserCreatePage = lazy(() => import("../pages/admin/users/UserCreate"));
const UserEditPage = lazy(() => import("../pages/admin/users/UserEdit"));
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
const FinancePaymentVouchersPage = lazy(
  () => import("../pages/finance/payment-vouchers/FinancePaymentVouchers")
);
const FinanceAssetsPage = lazy(
  () => import("../pages/finance/assets/FinanceAssets")
);
const FinanceAssetEditorPage = lazy(
  () => import("../pages/finance/assets/FinanceAssetEditor")
);
const FinanceAssetDetailPage = lazy(
  () => import("../pages/finance/assets/FinanceAssetDetail")
);
const FinanceAssetDisposalsPage = lazy(
  () => import("../pages/finance/assets/FinanceAssetDisposals")
);
const FinanceBudgetsPage = lazy(
  () => import("../pages/finance/budgets/FinanceBudgets")
);
const FinanceReportsDashboardPage = lazy(
  () => import("../pages/finance/reports/FinanceReportsDashboard")
);
const FinanceStatementActivitiesPage = lazy(
  () => import("../pages/finance/reports/FinanceStatementActivities")
);
const FinanceStatementPositionPage = lazy(
  () => import("../pages/finance/reports/FinanceStatementPosition")
);
const FinanceBudgetVsActualPage = lazy(
  () => import("../pages/finance/reports/FinanceBudgetVsActual")
);
const FinanceGrantUtilizationPage = lazy(
  () => import("../pages/finance/reports/FinanceGrantUtilization")
);
const FinanceAgedReceivablesPage = lazy(
  () => import("../pages/finance/reports/FinanceAgedReceivables")
);
const FinanceChartAccountsPage = lazy(
  () => import("../pages/finance/settings/FinanceChartAccounts")
);
const FinanceReportingPeriodsPage = lazy(
  () => import("../pages/finance/settings/FinanceReportingPeriods")
);
const FinancePartiesPage = lazy(
  () => import("../pages/finance/settings/FinanceParties")
);
const FinanceNonprofitSettingsPage = lazy(
  () => import("../pages/finance/settings/FinanceNonprofitSettings")
);
const FinanceReceivablesPage = lazy(
  () => import("../pages/finance/receivables/FinanceReceivables")
);
const FinanceInvoiceDetailPage = lazy(
  () => import("../pages/finance/receivables/FinanceInvoiceDetail")
);
const FinancePayablesPage = lazy(
  () => import("../pages/finance/payables/FinancePayables")
);
const FinancePayrollDashboardPage = lazy(
  () => import("../pages/finance/payroll/FinancePayrollDashboard")
);
const FinancePayrollInboxPage = lazy(
  () => import("../pages/finance/payroll/FinancePayrollInbox")
);
const FinancePayrollNotificationPreferencesPage = lazy(
  () => import("../pages/finance/payroll/FinancePayrollNotificationPreferences")
);
const FinancePayrollWorkersPage = lazy(
  () => import("../pages/finance/payroll/FinancePayrollWorkers")
);
const FinancePayrollComponentsPage = lazy(
  () => import("../pages/finance/payroll/FinancePayrollComponents")
);
const FinancePayrollLoansPage = lazy(
  () => import("../pages/finance/payroll/FinancePayrollLoans")
);
const FinancePayrollTimesheetsPage = lazy(
  () => import("../pages/finance/payroll/FinancePayrollTimesheets")
);
const FinancePayrollRunsPage = lazy(
  () => import("../pages/finance/payroll/FinancePayrollRuns")
);
const FinancePayrollApprovalsPage = lazy(
  () => import("../pages/finance/payroll/FinancePayrollApprovals")
);
const FinancePayrollSettingsPage = lazy(
  () => import("../pages/finance/payroll/FinancePayrollSettings")
);
const FinancePayrollImportPage = lazy(
  () => import("../pages/finance/payroll/FinancePayrollImport")
);
const FinancePayrollReportsPage = lazy(
  () => import("../pages/finance/payroll/FinancePayrollReports")
);
const FinancePayrollTemplatesPage = lazy(
  () => import("../pages/finance/payroll/FinancePayrollTemplates")
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
const HrWorkManagementPage = lazy(
  () => import("../pages/hr/work/HrWorkManagement")
);
const HrSettingsPage = lazy(() => import("../pages/hr/settings/HrSettings"));
const HrLeaveSettingsPage = lazy(
  () => import("../pages/hr/settings/HrLeaveSettings")
);
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

function financePage(pageKey: string, element: JSX.Element) {
  return page(
    <>
      <PageGuide pageKey={pageKey} />
      {element}
    </>
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
          path: "profile/payslips",
          element: (
            <ModuleRoute moduleKey="finance">
              {page(<MyPayslipsPage />)}
            </ModuleRoute>
          ),
        },
        {
          path: "profile/timesheets",
          element: (
            <ModuleRoute moduleKey="finance">
              {page(<MyTimesheetsPage />)}
            </ModuleRoute>
          ),
        },
        {
          path: "work",
          element: (
            <PermissionRoute requiredPermissions={["work.view"]}>
              {page(<MyWorkPage />)}
            </PermissionRoute>
          ),
        },
        {
          path: "work/performance",
          element: (
            <PermissionRoute requiredPermissions={["work.view"]}>
              {page(<PerformanceOverviewPage />)}
            </PermissionRoute>
          ),
        },
        {
          path: "profile/payroll-notifications",
          element: (
            <ModuleRoute moduleKey="finance">
              {page(<FinancePayrollNotificationPreferencesPage />)}
            </ModuleRoute>
          ),
        },
        {
          path: "onboarding",
          element: (
            <ModuleRoute moduleKey="hr">
              {page(<OnboardingPage />)}
            </ModuleRoute>
          ),
        },
        {
          path: "media",
          element: (
            <ModuleRoute moduleKey="media">
              {page(<MediaLibraryPage />)}
            </ModuleRoute>
          ),
        },
        {
          path: "documents",
          element: (
            <ModuleRoute moduleKey="documents">
              {page(<DocumentsPage />)}
            </ModuleRoute>
          ),
        },
        {
          path: "help",
          element: page(<HelpHomePage />),
        },
        {
          path: "help/finance",
          element: (
            <ModuleRoute moduleKey="finance">
              {page(<FinanceHelpPage />)}
            </ModuleRoute>
          ),
        },
        {
          path: "requests",
          element: (
            <ModuleRoute moduleKey="finance">
              {page(<RequestsPage />)}
            </ModuleRoute>
          ),
        },
        {
          path: "requests/finance",
          element: (
            <ModuleRoute moduleKey="finance">
              {page(<RequestsPage />)}
            </ModuleRoute>
          ),
        },
        {
          path: "requests/new",
          element: (
            <ModuleRoute moduleKey="finance">
              {page(<RequestsCreatePage />)}
            </ModuleRoute>
          ),
        },
        {
          path: "requests/finance/new",
          element: (
            <ModuleRoute moduleKey="finance">
              {page(<RequestsCreatePage />)}
            </ModuleRoute>
          ),
        },
        {
          path: "requests/leave/new",
          element: (
            <ModuleRoute moduleKey="leave">
              {page(<RequestsCreatePage />)}
            </ModuleRoute>
          ),
        },
        {
          path: "requests/create",
          element: <Navigate to="/app/requests/new" replace />,
        },
        {
          path: "requests/request/:id",
          element: (
            <ModuleRoute moduleKey="finance">
              {page(<RequestDetailPage />)}
            </ModuleRoute>
          ),
        },
        {
          path: "requests/:id",
          element: (
            <ModuleRoute moduleKey="finance">
              {page(<RequestDetailPage />)}
            </ModuleRoute>
          ),
        },
        {
          path: "approvals",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["requests.approve"]}>
                {page(<RequestApprovalsPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "approvals/:id",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["requests.approve"]}>
                {page(<RequestDetailPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "requests/approvals",
          element: <Navigate to="/app/approvals" replace />,
        },
        {
          path: "requests/approvals/:id",
          element: <Navigate to="/app/approvals" replace />,
        },
        {
          path: "requests/attendance",
          element: (
            <ModuleRoute moduleKey="attendance">
              {page(<StaffAttendancePage />)}
            </ModuleRoute>
          ),
        },
        {
          path: "requests/leave",
          element: (
            <ModuleRoute moduleKey="leave">
              {page(<StaffLeaveTrackerPage />)}
            </ModuleRoute>
          ),
        },
        {
          path: "finance",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["finance.view"]}>
                {financePage("dashboard", <FinanceDashboardPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/requests",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["finance.view"]}>
                {financePage("requests", <FinanceRequestsPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/requests/new",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["requests.manage"]}>
                {financePage("manual-entry", <FinanceManualEntryPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/requests/request/:id",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["finance.view"]}>
                {financePage("requests", <FinanceRequestDetailPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/requests/:id",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["finance.view"]}>
                {financePage("requests", <FinanceRequestDetailPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/settings",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["finance.view"]}>
                {financePage("settings", <FinanceSettings />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/settings/request-types/new",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["finance.view"]}>
                {financePage("settings", <FinanceRequestTypeEditor />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/settings/request-types/:id",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["finance.view"]}>
                {financePage("settings", <FinanceRequestTypeEditor />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/manual-entry",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["requests.manage"]}>
                {financePage("manual-entry", <FinanceManualEntryPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/accounts",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["finance.view"]}>
                {financePage("accounts", <FinanceAccountsPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/accounts/:id",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["finance.view"]}>
                {financePage("accounts", <FinanceAccountDetailPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/ledger",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["finance.view"]}>
                {financePage("ledger", <FinanceLedgerPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/payment-vouchers",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["finance.view"]}>
                {financePage("payment-vouchers", <FinancePaymentVouchersPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/assets",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["finance.view"]}>
                {financePage("assets", <FinanceAssetsPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/assets/new",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["requests.manage"]}>
                {financePage("assets", <FinanceAssetEditorPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/assets/disposals",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["finance.view"]}>
                {financePage("assets", <FinanceAssetDisposalsPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/assets/:id",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["finance.view"]}>
                {financePage("assets", <FinanceAssetDetailPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/assets/:id/edit",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["requests.manage"]}>
                {financePage("assets", <FinanceAssetEditorPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/budgets",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["finance.view"]}>
                {financePage("budgets", <FinanceBudgetsPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/reports",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["finance.view"]}>
                {financePage("reports", <FinanceReportsDashboardPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/reports/activities",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["finance.view"]}>
                {financePage("reports", <FinanceStatementActivitiesPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/reports/position",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["finance.view"]}>
                {financePage("reports", <FinanceStatementPositionPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/reports/budget-vs-actual",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["finance.view"]}>
                {financePage("reports", <FinanceBudgetVsActualPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/reports/grant-utilization",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["finance.view"]}>
                {financePage("reports", <FinanceGrantUtilizationPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/reports/aged-receivables",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["finance.view"]}>
                {financePage("reports", <FinanceAgedReceivablesPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/receivables",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["finance.view"]}>
                {financePage("receivables", <FinanceReceivablesPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/receivables/:id",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["finance.view"]}>
                {financePage("receivables", <FinanceInvoiceDetailPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/payables",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["finance.view"]}>
                {financePage("payables", <FinancePayablesPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/payroll",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["finance.view"]}>
                {financePage("payroll", <FinancePayrollDashboardPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/payroll/workers",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["finance.manage"]}>
                {financePage("payroll", <FinancePayrollWorkersPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/payroll/inbox",
          element: (
            <ModuleRoute moduleKey="finance">
              <AnyPermissionRoute requiredPermissions={["requests.approve", "finance.manage"]}>
                {financePage("payroll", <FinancePayrollInboxPage />)}
              </AnyPermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/payroll/notification-preferences",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["finance.view"]}>
                {financePage("payroll", <FinancePayrollNotificationPreferencesPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/payroll/components",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["finance.manage"]}>
                {financePage("payroll", <FinancePayrollComponentsPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/payroll/timesheets",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["finance.manage"]}>
                {financePage("payroll", <FinancePayrollTimesheetsPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/payroll/loans",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["finance.manage"]}>
                {financePage("payroll", <FinancePayrollLoansPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/payroll/runs",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["finance.view"]}>
                {financePage("payroll", <FinancePayrollRunsPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/payroll/approvals",
          element: (
            <ModuleRoute moduleKey="finance">
              <AnyPermissionRoute requiredPermissions={["requests.approve", "finance.manage"]}>
                {financePage("payroll", <FinancePayrollApprovalsPage />)}
              </AnyPermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/payroll/settings",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["finance.manage"]}>
                {financePage("payroll", <FinancePayrollSettingsPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/payroll/reports",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["finance.view"]}>
                {financePage("payroll", <FinancePayrollReportsPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/payroll/import",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["finance.manage"]}>
                {financePage("payroll", <FinancePayrollImportPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/payroll/templates",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["finance.view"]}>
                {financePage("payroll", <FinancePayrollTemplatesPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/settings/chart-accounts",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["finance.view"]}>
                {financePage("settings", <FinanceChartAccountsPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/settings/reporting-periods",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["finance.view"]}>
                {financePage("settings", <FinanceReportingPeriodsPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/settings/parties",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["finance.view"]}>
                {financePage("settings", <FinancePartiesPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "finance/settings/nonprofit",
          element: (
            <ModuleRoute moduleKey="finance">
              <PermissionRoute requiredPermissions={["finance.view"]}>
                {financePage("settings", <FinanceNonprofitSettingsPage />)}
              </PermissionRoute>
            </ModuleRoute>
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
            <ModuleRoute moduleKey="admin">
              <PermissionRoute requiredPermissions={["users.manage"]}>
                {page(<UserManagement />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "admin/users/new",
          element: (
            <ModuleRoute moduleKey="admin">
              <PermissionRoute requiredPermissions={["users.manage"]}>
                {page(<UserCreatePage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "admin/users/:id/edit",
          element: (
            <ModuleRoute moduleKey="admin">
              <PermissionRoute requiredPermissions={["users.manage"]}>
                {page(<UserEditPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "admin/users/:id/roles",
          element: (
            <ModuleRoute moduleKey="admin">
              <PermissionRoute requiredPermissions={["roles.manage"]}>
                {page(<UserRolesPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "admin/users/list",
          element: <Navigate to="/app/admin/users" replace />,
        },
        {
          path: "admin/settings",
          element: (
            <ModuleRoute moduleKey="admin">
              <PermissionRoute requiredPermissions={["settings.manage"]}>
                {page(<AdminSettingsPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "admin/files",
          element: (
            <ModuleRoute moduleKey="admin">
              <PermissionRoute requiredPermissions={["settings.manage"]}>
                {page(<AdminFilesPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "admin/projects",
          element: (
            <ModuleRoute moduleKey="admin">
              <PermissionRoute requiredPermissions={["projects.manage"]}>
                {page(<AdminProjectsPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "admin/documents",
          element: (
            <ModuleRoute moduleKey="admin">
              <PermissionRoute requiredPermissions={["settings.manage"]}>
                {page(<AdminDocumentsPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "admin/documents/new",
          element: (
            <ModuleRoute moduleKey="admin">
              <PermissionRoute requiredPermissions={["settings.manage"]}>
                {page(<AdminDocumentEditorPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "admin/documents/:id",
          element: (
            <ModuleRoute moduleKey="admin">
              <PermissionRoute requiredPermissions={["settings.manage"]}>
                {page(<AdminDocumentEditorPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "admin/roles",
          element: (
            <ModuleRoute moduleKey="admin">
              <PermissionRoute requiredPermissions={["roles.manage"]}>
                {page(<AdminRolesPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "admin/policies",
          element: (
            <ModuleRoute moduleKey="admin">
              <PermissionRoute requiredPermissions={["settings.manage"]}>
                {page(<AdminPoliciesPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "admin/forms",
          element: (
            <ModuleRoute moduleKey="admin">
              <PermissionRoute requiredPermissions={["settings.manage"]}>
                {page(<AdminFormsPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "admin/forms/new",
          element: (
            <ModuleRoute moduleKey="admin">
              <PermissionRoute requiredPermissions={["settings.manage"]}>
                {page(<AdminFormEditorPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "admin/forms/:id",
          element: (
            <ModuleRoute moduleKey="admin">
              <PermissionRoute requiredPermissions={["settings.manage"]}>
                {page(<AdminFormEditorPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "hr",
          element: (
            <ModuleRoute moduleKey="hr">
              <PermissionRoute requiredPermissions={["users.manage"]}>
                {page(<HrDashboardPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "hr/employees",
          element: (
            <ModuleRoute moduleKey="hr">
              <PermissionRoute requiredPermissions={["users.manage"]}>
                {page(<HrEmployeesPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "hr/employees/new",
          element: (
            <ModuleRoute moduleKey="hr">
              <PermissionRoute requiredPermissions={["users.manage"]}>
                {page(<HrEmployeeEditorPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "hr/employees/employee",
          element: <Navigate to="/app/hr/employees/new" replace />,
        },
        {
          path: "hr/employees/:id",
          element: (
            <ModuleRoute moduleKey="hr">
              <PermissionRoute requiredPermissions={["users.manage"]}>
                {page(<HrEmployeeEditorPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "hr/onboarding",
          element: (
            <ModuleRoute moduleKey="hr">
              <PermissionRoute requiredPermissions={["users.manage"]}>
                {page(<HrOnboardingPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "hr/attendance",
          element: (
            <ModuleRoute moduleKey="hr">
              <PermissionRoute requiredPermissions={["users.manage"]}>
                {page(<HrAttendancePage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "hr/work",
          element: (
            <ModuleRoute moduleKey="hr">
              <PermissionRoute requiredPermissions={["work.manage"]}>
                {page(<HrWorkManagementPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "hr/leave",
          element: (
            <ModuleRoute moduleKey="hr">
              <PermissionRoute requiredPermissions={["users.manage"]}>
                {page(<HrLeaveTrackerPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "hr/leave/requests",
          element: (
            <ModuleRoute moduleKey="hr">
              <PermissionRoute requiredPermissions={["users.manage"]}>
                {page(<HrLeaveRequestsPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "hr/settings",
          element: (
            <ModuleRoute moduleKey="hr">
              <PermissionRoute requiredPermissions={["users.manage"]}>
                {page(<HrSettingsPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "hr/settings/leave",
          element: (
            <ModuleRoute moduleKey="hr">
              <PermissionRoute requiredPermissions={["users.manage"]}>
                {page(<HrLeaveSettingsPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "hr/settings/request-types/new",
          element: (
            <ModuleRoute moduleKey="hr">
              <PermissionRoute requiredPermissions={["users.manage"]}>
                {page(<HrRequestTypeEditorPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "hr/settings/request-types/:id",
          element: (
            <ModuleRoute moduleKey="hr">
              <PermissionRoute requiredPermissions={["users.manage"]}>
                {page(<HrRequestTypeEditorPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "hr/onboarding/new",
          element: (
            <ModuleRoute moduleKey="hr">
              <PermissionRoute requiredPermissions={["users.manage"]}>
                {page(<HrOnboardingEditorPage />)}
              </PermissionRoute>
            </ModuleRoute>
          ),
        },
        {
          path: "hr/onboarding/:id",
          element: (
            <ModuleRoute moduleKey="hr">
              <PermissionRoute requiredPermissions={["users.manage"]}>
                {page(<HrOnboardingEditorPage />)}
              </PermissionRoute>
            </ModuleRoute>
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
