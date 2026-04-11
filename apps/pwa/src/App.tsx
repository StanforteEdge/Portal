import { Navigate, Route, Routes } from "react-router-dom";
import AttendancePage from "@/modules/hr/AttendancePage";
import LeavePage from "@/modules/hr/LeavePage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import FinanceDashboardPage from "@/modules/finance/FinanceDashboardPage";
import FinanceRequestDetailsPage from "@/modules/finance/FinanceRequestDetailsPage";
import FinancePaymentVouchersPage from "@/modules/finance/FinancePaymentVouchersPage";
import FinanceRequestsPage from "@/modules/finance/FinanceRequestsPage";
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
  ProfilePage,
  SettingsPage,
} from "@/pages/system";

export default function App() {
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
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
