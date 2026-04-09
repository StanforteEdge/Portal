import { Navigate, Route, Routes } from "react-router-dom";
import AttendancePage from "@/features/attendance/AttendancePage";
import DashboardPage from "@/features/dashboard/DashboardPage";
import FinanceAdminPage from "@/features/finance/FinanceAdminPage";
import FinancePaymentVouchersPage from "@/features/finance/FinancePaymentVouchersPage";
import { ProtectedRoute, PublicOnlyRoute } from "@/features/auth/components/RouteGuards";
import AcceptInvitePage from "@/features/auth/pages/AcceptInvitePage";
import ForgotPasswordPage from "@/features/auth/pages/ForgotPasswordPage";
import LoginPage from "@/features/auth/pages/LoginPage";
import ResetPasswordPage from "@/features/auth/pages/ResetPasswordPage";
import SessionReauthPage from "@/features/auth/pages/SessionReauthPage";
import RequestDetailsPage from "@/features/requests/RequestDetailsPage";
import RequestFormPage from "@/features/requests/RequestFormPage";
import RequestTypePage from "@/features/requests/RequestTypePage";
import RequestsListPage from "@/features/requests/RequestsListPage";
import { HelpPage, NotificationsPage, ProfilePage, SettingsPage } from "@/features/system";

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
        <Route path="/finance" element={<FinanceAdminPage />} />
        <Route path="/finance/requests" element={<FinanceAdminPage />} />
        <Route path="/finance/payment-vouchers" element={<FinancePaymentVouchersPage />} />
        <Route path="/requests" element={<RequestsListPage scope="mine" />} />
        <Route path="/requests/approvals" element={<RequestsListPage scope="approvals" />} />
        <Route path="/requests/new" element={<RequestTypePage />} />
        <Route path="/requests/new/form" element={<RequestFormPage />} />
        <Route path="/requests/details" element={<RequestDetailsPage />} />
        <Route path="/requests/financial" element={<RequestFormPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
