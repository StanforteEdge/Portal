import { Navigate, Route, Routes } from "react-router-dom";
import AttendancePage from "@/features/attendance/AttendancePage";
import DashboardPage from "@/features/dashboard/DashboardPage";
import FinanceDashboardPage from "@/features/finance/requests/FinanceDashboardPage";
import FinanceRequestDetailsPage from "@/features/finance/requests/FinanceRequestDetailsPage";
import FinancePaymentVouchersPage from "@/features/finance/requests/FinancePaymentVouchersPage";
import FinanceRequestsPage from "@/features/finance/requests/FinanceRequestsPage";
import { ProtectedRoute, PublicOnlyRoute } from "@/components/auth/RouteGuards";
import { ApprovalRoute, ModuleRoute } from "@/components/auth/AccessRoute";
import AcceptInvitePage from "@/features/auth/AcceptInvitePage";
import ForgotPasswordPage from "@/features/auth/ForgotPasswordPage";
import LoginPage from "@/features/auth/LoginPage";
import ResetPasswordPage from "@/features/auth/ResetPasswordPage";
import SessionReauthPage from "@/features/auth/SessionReauthPage";
import RequestDetailsPage from "@/features/requests/RequestDetailsPage";
import RequestFormPage from "@/features/requests/new/RequestFormPage";
import RequestTypePage from "@/features/requests/new/RequestTypePage";
import RequestsListPage from "@/features/requests/RequestsListPage";
import {
  HelpPage,
  NotificationsPage,
  ProfilePage,
  SettingsPage,
} from "@/features/system";

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
        <Route path="/requests" element={<RequestsListPage scope="mine" />} />
        <Route element={<ApprovalRoute />}>
          <Route
            path="/requests/approvals"
            element={<RequestsListPage scope="approvals" />}
          />
        </Route>
        <Route path="/requests/new" element={<RequestTypePage />} />
        <Route path="/requests/new/form" element={<RequestFormPage />} />
        <Route path="/requests/details" element={<RequestDetailsPage />} />
        <Route path="/requests/financial" element={<RequestFormPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/help" element={<HelpPage />} />
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
