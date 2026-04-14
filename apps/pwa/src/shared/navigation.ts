import type { SidebarItem } from "@/shared";

export type MobileNavItem = {
  label: string;
  icon: string;
  path?: string;
  active?: boolean;
};

/**
 * Build the main application navigation sidebar.
 * All modules (Staff, Finance, HR) are registered here.
 */
export function buildAppNavigation(options?: {
  includeRequestDetails?: boolean;
  requestDetailsPath?: string;
  requestDetailsParent?: "requests" | "finance";
}): SidebarItem[] {
  const includeDetails = options?.includeRequestDetails ?? false;
  const detailsParent = options?.requestDetailsParent ?? "requests";
  const detailsPath =
    options?.requestDetailsPath ??
    (detailsParent === "finance"
      ? "/finance/requests/details"
      : "/requests/details");

  const requestDetailsItem = {
    label: "Request Details",
    icon: "description",
    path: detailsPath,
  };

  const financeRequestDetailsItem = {
    key: "finance-request-details",
    label: "Request Details",
    icon: "description",
    path: detailsPath,
  };

  return [
    // Staff section
    { label: "Dashboard", icon: "grid_view", path: "/", section: "Staff" },
    { label: "Attendance", icon: "pending_actions", path: "/attendance", section: "Staff" },
    { label: "Leave", icon: "event_available", path: "/leave", section: "Staff" },
    {
      label: "Requests",
      icon: "format_list_bulleted",
      section: "Staff",
      children: [
        { label: "My Requests", icon: "list_alt", path: "/requests" },
        { label: "Approvals", icon: "task_alt", path: "/requests/approvals", permissions: ["requests.approve"], requiresTeamLeadAssignment: true },
        { label: "New Request", icon: "add_circle", path: "/requests/new" },
        ...(includeDetails && detailsParent === "requests"
          ? [requestDetailsItem]
          : []),
      ],
    },
    {
      label: "Profile",
      icon: "person",
      section: "Staff",
      children: [
        { label: "Profile", icon: "person", path: "/profile" },
        { label: "Settings", icon: "settings", path: "/settings" },
        { label: "Payslips", icon: "receipt_long", path: "/profile/payslips" },
      ],
    },

    // Admin section
    {
      label: "Finance",
      icon: "account_balance_wallet",
      section: "Admin",
      moduleKey: "finance",
      children: [
        { key: "finance-dashboard", label: "Dashboard", icon: "grid_view", path: "/finance" },
        { key: "finance-requests", label: "Requests", icon: "receipt_long", path: "/finance/requests" },
        { key: "finance-vouchers", label: "Payment Vouchers", icon: "payments", path: "/finance/payment-vouchers" },
        ...(includeDetails && detailsParent === "finance"
          ? [financeRequestDetailsItem]
          : []),
      ],
    },
    {
      label: "HR",
      icon: "people",
      section: "Admin",
      moduleKey: "hr",
      children: [
        { key: "hr-dashboard", label: "Overview", icon: "dashboard", path: "/hr" },
        { key: "hr-employees", label: "Employees", icon: "group", path: "/hr/employees" },
        { key: "hr-attendance", label: "Attendance", icon: "pending_actions", path: "/hr/attendance" },
        { key: "hr-leave", label: "Leave", icon: "event_available", path: "/hr/leave" },
        { key: "hr-settings", label: "Settings", icon: "settings", path: "/hr/settings" },
      ],
    },
    {
      label: "Administration",
      icon: "manage_accounts",
      section: "Admin",
      moduleKey: "admin",
      children: [
        { key: "admin-users", label: "Users", icon: "people", path: "/admin/users" },
      ],
    },
  ];
}

/**
 * Build mobile bottom navigation.
 */
export function buildAppMobileNav(activeLabel: "Requests" | "Attendance" | "Leave" | "Dashboard" | "Finance" | "HR" | "Employees" = "Requests"): MobileNavItem[] {
  return [
    { label: "Dashboard", icon: "grid_view", path: "/", active: activeLabel === "Dashboard" },
    { label: "Attendance", icon: "pending_actions", path: "/attendance", active: activeLabel === "Attendance" },
    {
      label: activeLabel === "Finance" ? "Finance" : activeLabel === "HR" || activeLabel === "Employees" ? "HR" : "Requests",
      icon: activeLabel === "Finance" ? "account_balance_wallet" : activeLabel === "HR" || activeLabel === "Employees" ? "people" : "format_list_bulleted",
      path: activeLabel === "Finance" ? "/finance" : activeLabel === "HR" || activeLabel === "Employees" ? "/hr" : "/requests",
      active: activeLabel === "Requests" || activeLabel === "Finance" || activeLabel === "HR" || activeLabel === "Employees",
    },
    { label: "Leave", icon: "event_available", path: "/leave", active: activeLabel === "Leave" },
  ];
}
