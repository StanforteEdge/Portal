import { useEffect } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { onDeepLink } from "@/lib/tauri-bridge";
import AttendancePage from "@/modules/hr/attendance/AttendancePage";
import LeavePage from "@/modules/hr/leave/LeavePage";
import LeaveRequestFormPage from "@/modules/hr/leave/LeaveRequestFormPage";
import LeaveRequestDetailsPage from "@/modules/hr/leave/LeaveRequestDetailsPage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import FinanceDashboardPage from "@/modules/finance/FinanceDashboardPage";
import FinanceRequestDetailsPage from "@/modules/finance/FinanceRequestDetailsPage";
import FinancePaymentVouchersPage from "@/modules/finance/FinancePaymentVouchersPage";
import FinanceRequestsPage from "@/modules/finance/FinanceRequestsPage";
import FinanceLedgerPage from "@/modules/finance/FinanceLedgerPage";
import FinanceBudgetsPage from "@/modules/finance/FinanceBudgetsPage";
import FinanceReceivablesPage from "@/modules/finance/FinanceReceivablesPage";
import FinancePayablesPage from "@/modules/finance/FinancePayablesPage";
import FinanceAssetsPage from "@/modules/finance/FinanceAssetsPage";
import FinanceAssetEditorPage from "@/modules/finance/FinanceAssetEditorPage";
import FinanceAssetDisposalsPage from "@/modules/finance/FinanceAssetDisposalsPage";
import FinanceReportsPage from "@/modules/finance/FinanceReportsPage";
import FinanceReportDetailPage from "@/modules/finance/FinanceReportDetailPage";
import FinanceSettingsPage from "@/modules/finance/FinanceSettingsPage";
import FinanceDeductionTypesPage from "@/modules/finance/FinanceDeductionTypesPage";
import FinanceChartAccountsPage from "@/modules/finance/FinanceChartAccountsPage";
import FinanceCustomersPage from "@/modules/finance/customers";
import FinanceVendorsPage from "@/modules/finance/vendors";
import FinanceContactsPage from "@/modules/finance/contacts";
import FinanceAccountsPage from "@/modules/finance/FinanceAccountsPage";
import FinanceAccountDetailPage from "@/modules/finance/FinanceAccountDetailPage";
import FinanceItemsPage from "@/modules/finance/FinanceItemsPage";
import FinanceExpensesPage from "@/modules/finance/FinanceExpensesPage";
import FinanceIncomePage from "@/modules/finance/FinanceIncomePage";
import FinanceBillsPage from "@/modules/finance/FinanceBillsPage";
import FinanceSalesInvoicesPage from "@/modules/finance/FinanceSalesInvoicesPage";
import FinanceManualEntryPage from "@/modules/finance/FinanceManualEntryPage";
import AdminRolesPage from "@/admin/roles/AdminRolesPage";
import HrDashboardPage from "@/modules/hr/HrDashboardPage";
import HrLeavePage from "@/modules/hr/leave/HrLeavePage";
import HrEmployeesPage from "@/modules/hr/employees/HrEmployeesPage";
import HrEmployeeCreatePage from "@/modules/hr/employees/HrEmployeeCreatePage";
import HrEmployeeDetailPage from "@/modules/hr/employees/HrEmployeeDetailPage";
import HrEmployeeEditPage from "@/modules/hr/employees/HrEmployeeEditPage";
import HrAttendancePage from "@/modules/hr/attendance/HrAttendancePage";
import HrSettingsPage from "@/modules/hr/settings/HrSettingsPage";
import AdminUsersPage from "@/admin/users/AdminUsersPage";
import AdminUserDetailPage from "@/admin/users/AdminUserDetailPage";
import AdminSettingsPage from "@/admin/settings/AdminSettingsPage";
import AdminGroupsPage from "@/admin/groups/AdminGroupsPage";
import AdminProjectsPage from "@/admin/projects/AdminProjectsPage";
import AdminFilesPage from "@/admin/files/AdminFilesPage";
import ProjectsPage from "@/pages/projects/ProjectsPage";
import ProjectDetailPage from "@/pages/projects/ProjectDetailPage";
import FilesPage from "@/pages/files/FilesPage";
import {
  ProtectedRoute,
  PublicOnlyRoute,
} from "@/shared/components/auth/RouteGuards";
import {
  ApprovalRoute,
  ModuleRoute,
} from "@/shared/components/auth/AccessRoute";
import AcceptInvitePage from "@/auth/AcceptInvitePage";
import ForgotPasswordPage from "@/auth/ForgotPasswordPage";
import LoginPage from "@/auth/LoginPage";
import ResetPasswordPage from "@/auth/ResetPasswordPage";
import SessionReauthPage from "@/auth/SessionReauthPage";
import RequestDetailsPage from "@/requests/RequestDetailsPage";
import RequestFormPage from "@/requests/new/RequestFormPage";
import RequestTypePage from "@/requests/new/RequestTypePage";
import ApprovalsPage from "@/requests/ApprovalsPage";
import RequestsListPage from "@/requests/RequestsListPage";
import {
  DownloadPage,
  HelpPage,
  NotificationsPage,
  PayslipsPage,
  TimesheetsPage,
  ProfilePage,
  SettingsPage,
} from "@/account";

export default function App() {
  const navigate = useNavigate();
  useEffect(() => {
    const unlisten = onDeepLink((url) => {
      try {
        const path = new URL(url).pathname || "/";
        navigate(path);
      } catch {
        // ignore malformed URLs
      }
    });
    return unlisten;
  }, [navigate]);

  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/accept-invite" element={<AcceptInvitePage />} />
        <Route path="/reauth" element={<SessionReauthPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/leave" element={<LeavePage />} />
        <Route path="/leave/new/form" element={<LeaveRequestFormPage />} />
        <Route path="/leave/details" element={<LeaveRequestDetailsPage />} />
        <Route path="/requests" element={<RequestsListPage />} />
        <Route element={<ApprovalRoute />}>
          <Route path="/requests/approvals" element={<ApprovalsPage />} />
        </Route>
        <Route path="/requests/new" element={<RequestTypePage />} />
        <Route path="/requests/new/form" element={<RequestFormPage />} />
        <Route path="/requests/details" element={<RequestDetailsPage />} />
        <Route path="/requests/financial" element={<RequestFormPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/download" element={<DownloadPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route element={<ModuleRoute moduleKey="payroll" />}>
          <Route path="/profile/payslips" element={<PayslipsPage />} />
          <Route path="/profile/timesheets" element={<TimesheetsPage />} />
        </Route>
        <Route element={<ModuleRoute moduleKey="finance" />}>
          <Route path="/finance" element={<FinanceDashboardPage />} />
          <Route path="/finance/requests" element={<FinanceRequestsPage />} />
          <Route
            path="/finance/requests/details"
            element={<FinanceRequestDetailsPage />}
          />
          <Route
            path="/finance/payment-vouchers"
            element={<FinancePaymentVouchersPage />}
          />
          <Route path="/finance/ledger" element={<FinanceLedgerPage />} />
          <Route path="/finance/chart-accounts" element={<FinanceChartAccountsPage />} />
          <Route path="/finance/accounts" element={<FinanceAccountsPage />} />
          <Route path="/finance/accounts/:id" element={<FinanceAccountDetailPage />} />
          <Route path="/finance/manual-entry" element={<FinanceManualEntryPage />} />
          <Route path="/finance/items" element={<FinanceItemsPage />} />
          <Route path="/finance/expenses" element={<FinanceExpensesPage />} />
          <Route path="/finance/income" element={<FinanceIncomePage />} />
          <Route path="/finance/bills" element={<FinanceBillsPage />} />
          <Route path="/finance/sales-invoices" element={<FinanceSalesInvoicesPage />} />
          <Route path="/finance/budgets" element={<FinanceBudgetsPage />} />
          <Route path="/finance/receivables" element={<FinanceReceivablesPage />} />
          <Route path="/finance/receivables/:id" element={<FinanceReceivablesPage />} />
          <Route path="/finance/payables" element={<FinancePayablesPage />} />
          <Route path="/finance/assets" element={<FinanceAssetsPage />} />
          <Route path="/finance/assets/new" element={<FinanceAssetEditorPage />} />
          <Route path="/finance/assets/:id" element={<FinanceAssetEditorPage />} />
          <Route path="/finance/assets/disposals" element={<FinanceAssetDisposalsPage />} />
          <Route path="/finance/reports" element={<FinanceReportsPage />} />
          <Route path="/finance/reports/:reportKey" element={<FinanceReportDetailPage />} />
          <Route path="/finance/settings" element={<FinanceSettingsPage />} />
          <Route path="/finance/deduction-types" element={<FinanceDeductionTypesPage />} />
          <Route path="/finance/customers" element={<FinanceCustomersPage />} />
          <Route path="/finance/vendors" element={<FinanceVendorsPage />} />
          <Route path="/finance/contacts" element={<FinanceContactsPage />} />
        </Route>
        <Route element={<ModuleRoute moduleKey="hr" />}>
          <Route path="/hr" element={<HrDashboardPage />} />
          <Route path="/hr/employees" element={<HrEmployeesPage />} />
          <Route path="/hr/employees/new" element={<HrEmployeeCreatePage />} />
          <Route path="/hr/employees/:id" element={<HrEmployeeDetailPage />} />
          <Route path="/hr/employees/:id/edit" element={<HrEmployeeEditPage />} />
          <Route path="/hr/attendance" element={<HrAttendancePage />} />
          <Route path="/hr/leave" element={<HrLeavePage />} />
          <Route path="/hr/settings" element={<HrSettingsPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/leave" element={<LeavePage />} />
          <Route path="/leave/new/form" element={<LeaveRequestFormPage />} />
          <Route path="/leave/details" element={<LeaveRequestDetailsPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/files" element={<FilesPage />} />
        </Route>
        <Route element={<ModuleRoute moduleKey="admin" />}>
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
          <Route path="/admin/roles" element={<AdminRolesPage />} />
          <Route path="/admin/groups" element={<AdminGroupsPage />} />
          <Route path="/admin/projects" element={<AdminProjectsPage />} />
          <Route path="/admin/files" element={<AdminFilesPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
