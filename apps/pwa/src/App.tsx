import { useEffect } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { onDeepLink } from "@/lib/tauri-bridge";
import AttendancePage from "@/pages/hr/attendance/AttendancePage";
import LeavePage from "@/pages/hr/leave/LeavePage";
import LeaveRequestFormPage from "@/pages/hr/leave/LeaveRequestFormPage";
import LeaveRequestDetailsPage from "@/pages/hr/leave/LeaveRequestDetailsPage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import FinanceDashboardPage from "@/pages/finance/dashboard/FinanceDashboardPage";
import FinanceRequestDetailsPage from "@/pages/finance/requests/FinanceRequestDetailsPage";
import FinancePaymentVouchersPage from "@/pages/finance/payment-vouchers/FinancePaymentVouchersPage";
import FinanceRequestsPage from "@/pages/finance/requests/FinanceRequestsPage";
import FinanceLedgerPage from "@/pages/finance/ledger/FinanceLedgerPage";
import FinanceBudgetsPage from "@/pages/finance/budgets/FinanceBudgetsPage";
import FinanceReceivablesPage from "@/pages/finance/receivables/FinanceReceivablesPage";
import FinancePayablesPage from "@/pages/finance/payables/FinancePayablesPage";
import FinanceAssetsPage from "@/pages/finance/assets/FinanceAssetsPage";
import FinanceAssetEditorPage from "@/pages/finance/assets/FinanceAssetEditorPage";
import FinanceAssetDisposalsPage from "@/pages/finance/assets/FinanceAssetDisposalsPage";
import FinanceReportsPage from "@/pages/finance/reports/FinanceReportsPage";
import FinanceReportDetailPage from "@/pages/finance/reports/FinanceReportDetailPage";
import FinanceSettingsPage from "@/pages/finance/settings/FinanceSettingsPage";
import FinanceDeductionTypesPage from "@/pages/finance/deductions/FinanceDeductionTypesPage";
import FinanceChartAccountsPage from "@/pages/finance/accounts/FinanceChartAccountsPage";
import FinanceCustomersPage from "@/pages/finance/customers";
import FinanceVendorsPage from "@/pages/finance/vendors";
import FinanceContactsPage from "@/pages/finance/contacts";
import FinanceAccountsPage from "@/pages/finance/accounts/FinanceAccountsPage";
import FinanceAccountDetailPage from "@/pages/finance/accounts/FinanceAccountDetailPage";
import FinanceItemsPage from "@/pages/finance/items/FinanceItemsPage";
import FinanceExpensesPage from "@/pages/finance/expenses/FinanceExpensesPage";
import FinanceIncomePage from "@/pages/finance/income/FinanceIncomePage";
import FinanceBillsPage from "@/pages/finance/bills/FinanceBillsPage";
import FinanceSalesInvoicesPage from "@/pages/finance/invoices/FinanceSalesInvoicesPage";
import FinanceManualEntryPage from "@/pages/finance/ledger/FinanceManualEntryPage";
import AdminRolesPage from "@/pages/admin/roles/AdminRolesPage";
import HrDashboardPage from "@/pages/hr/dashboard/HrDashboardPage";
import HrLeavePage from "@/pages/hr/leave/HrLeavePage";
import HrEmployeesPage from "@/pages/hr/employees/HrEmployeesPage";
import HrEmployeeCreatePage from "@/pages/hr/employees/HrEmployeeCreatePage";
import HrEmployeeDetailPage from "@/pages/hr/employees/HrEmployeeDetailPage";
import HrEmployeeEditPage from "@/pages/hr/employees/HrEmployeeEditPage";
import HrAttendancePage from "@/pages/hr/attendance/HrAttendancePage";
import HrSettingsPage from "@/pages/hr/settings/HrSettingsPage";
import AdminUsersPage from "@/pages/admin/users/AdminUsersPage";
import AdminUserDetailPage from "@/pages/admin/users/AdminUserDetailPage";
import AdminSettingsPage from "@/pages/admin/settings/AdminSettingsPage";
import AdminGroupsPage from "@/pages/admin/groups/AdminGroupsPage";
import AdminProjectsPage from "@/pages/admin/projects/AdminProjectsPage";
import AdminFilesPage from "@/pages/admin/files/AdminFilesPage";
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
import AcceptInvitePage from "@/pages/auth/AcceptInvitePage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import LoginPage from "@/pages/auth/LoginPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import SessionReauthPage from "@/pages/auth/SessionReauthPage";
import RequestDetailsPage from "@/pages/requests/RequestDetailsPage";
import RequestFormPage from "@/pages/requests/new/RequestFormPage";
import RequestTypePage from "@/pages/requests/new/RequestTypePage";
import ApprovalsPage from "@/pages/requests/ApprovalsPage";
import RequestsListPage from "@/pages/requests/RequestsListPage";
import {
  DownloadPage,
  HelpPage,
  NotificationsPage,
  PayslipsPage,
  TimesheetsPage,
  ProfilePage,
  SettingsPage,
} from "@/pages/account";

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
