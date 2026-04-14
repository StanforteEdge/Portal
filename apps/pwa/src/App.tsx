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
import HrDashboardPage from "@/modules/hr/HrDashboardPage";
import HrLeavePage from "@/modules/hr/leave/HrLeavePage";
import HrEmployeesPage from "@/modules/hr/employees/HrEmployeesPage";
import HrEmployeeCreatePage from "@/modules/hr/employees/HrEmployeeCreatePage";
import HrEmployeeDetailPage from "@/modules/hr/employees/HrEmployeeDetailPage";
import HrAttendancePage from "@/modules/hr/attendance/HrAttendancePage";
import AdminUsersPage from "@/modules/admin/AdminUsersPage";
import AdminUserDetailPage from "@/modules/admin/AdminUserDetailPage";
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
import RequestDetailsPage from "@/features/requests/pages/RequestDetailsPage";
import RequestFormPage from "@/features/requests/pages/new/RequestFormPage";
import RequestTypePage from "@/features/requests/pages/new/RequestTypePage";
import ApprovalsPage from "@/features/requests/pages/ApprovalsPage";
import RequestsListPage from "@/features/requests/pages/RequestsListPage";
import {
  DownloadPage,
  HelpPage,
  NotificationsPage,
  PayslipsPage,
  ProfilePage,
  SettingsPage,
} from "@/pages/system";

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
        </Route>
        <Route element={<ModuleRoute moduleKey="hr" />}>
          <Route path="/hr" element={<HrDashboardPage />} />
          <Route path="/hr/employees" element={<HrEmployeesPage />} />
          <Route path="/hr/employees/new" element={<HrEmployeeCreatePage />} />
          <Route path="/hr/employees/:id" element={<HrEmployeeDetailPage />} />
          <Route path="/hr/attendance" element={<HrAttendancePage />} />
          <Route path="/hr/leave" element={<HrLeavePage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/leave" element={<LeavePage />} />
          <Route path="/leave/new/form" element={<LeaveRequestFormPage />} />
          <Route path="/leave/details" element={<LeaveRequestDetailsPage />} />
        </Route>
        <Route element={<ModuleRoute moduleKey="admin" />}>
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
