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
 * Permission-based filtering happens in AppShell using hasAnyPermission / hasModuleAccess.
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
    { key: "my-tasks", label: "My Tasks", icon: "checklist", path: "/tasks", section: "Staff" },
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
    { label: "Leave", icon: "event_available", path: "/leave", section: "Staff" },
    { label: "Projects", icon: "assignment", path: "/projects", section: "Staff" },
    { label: "Files", icon: "folder", path: "/files", section: "Staff" },
    {
      label: "Profile",
      icon: "person",
      section: "Staff",
      children: [
        { label: "My Profile", icon: "person", path: "/profile" },
        { label: "Settings", icon: "settings", path: "/settings" },
        { label: "Payslips", icon: "receipt_long", path: "/profile/payslips" },
      ],
    },

    // Finance section - filtered by AppShell using permissions/m-moduleKey
    {
      label: "Financial",
      icon: "account_balance_wallet",
      section: "Admin",
      moduleKey: "finance",
      children: [
        { key: "finance-dashboard", label: "Dashboard", icon: "grid_view", path: "/finance" },
        {
          key: "finance-group-operations",
          label: "Operations",
          icon: "build",
          children: [
            { key: "finance-requests", label: "Requests", icon: "receipt_long", path: "/finance/requests" },
            { key: "finance-ledger", label: "Ledger", icon: "book", path: "/finance/ledger" },
            { key: "finance-reports", label: "Reports", icon: "insights", path: "/finance/reports" },
            { key: "finance-manual-entry", label: "Journal Entry", icon: "edit_note", path: "/finance/manual-entry" },
            ...(includeDetails && detailsParent === "finance"
              ? [financeRequestDetailsItem]
              : []),
          ],
        },
        {
          key: "finance-group-money-in",
          label: "Money In",
          icon: "trending_up",
          children: [
            { key: "finance-sales-invoices", label: "Sales Invoices", icon: "request_quote", path: "/finance/sales-invoices" },
            { key: "finance-income", label: "Income", icon: "payments", path: "/finance/income" },
            { key: "finance-receivables", label: "Receivables", icon: "request_quote", path: "/finance/receivables" },
            { key: "finance-customers", label: "Customers", icon: "person", path: "/finance/customers" },
          ],
        },
        {
          key: "finance-group-money-out",
          label: "Money Out",
          icon: "trending_down",
          children: [
            { key: "finance-bills", label: "Bills", icon: "receipt_long", path: "/finance/bills" },
            { key: "finance-expenses", label: "Expenses", icon: "receipt", path: "/finance/expenses" },
            { key: "finance-payables", label: "Payables", icon: "payments", path: "/finance/payables" },
            { key: "finance-vendors", label: "Vendors", icon: "local_shipping", path: "/finance/vendors" },
            { key: "finance-contacts", label: "All Contacts", icon: "contacts", path: "/finance/contacts" },
            { key: "finance-vouchers", label: "Payment Vouchers", icon: "payments", path: "/finance/payment-vouchers" },
          ],
        },
        {
          key: "finance-group-fixed-assets",
          label: "Fixed Assets",
          icon: "inventory_2",
          children: [
            { key: "finance-assets", label: "Asset Register", icon: "inventory_2", path: "/finance/assets" },
            { key: "finance-assets-disposals", label: "Disposals", icon: "delete_sweep", path: "/finance/assets/disposals" },
          ],
        },
        {
          key: "finance-group-setup",
          label: "Setup",
          icon: "settings",
          children: [
            { key: "finance-chart-accounts", label: "Chart of Accounts", icon: "account_balance", path: "/finance/chart-accounts" },
            { key: "finance-accounts", label: "Bank & Cash", icon: "account_balance_wallet", path: "/finance/accounts" },
            { key: "finance-items", label: "Products & Services", icon: "inventory", path: "/finance/items" },
            { key: "finance-budgets", label: "Budgets", icon: "savings", path: "/finance/budgets" },
            { key: "finance-settings", label: "Settings", icon: "settings", path: "/finance/settings" },
            { key: "finance-deduction-types", label: "Deduction Types", icon: "percent", path: "/finance/deduction-types" },
          ],
        },
      ],
    },

    // HR section - filtered by AppShell using moduleKey
    {
      label: "HR",
      icon: "people",
      section: "Admin",
      moduleKey: "hr",
      children: [
        { key: "hr-dashboard", label: "Overview", icon: "dashboard", path: "/hr", permissions: ["hr.view"] },
        { key: "hr-employees", label: "Employees", icon: "group", path: "/hr/employees", permissions: ["hr.manage", "hr.employees"] },
        { key: "hr-attendance", label: "Attendance", icon: "pending_actions", path: "/hr/attendance", permissions: ["attendance.view", "attendance.manage", "attendance.approve"] },
        { key: "hr-leave", label: "Leave", icon: "event_available", path: "/hr/leave", permissions: ["leave.view", "leave.manage", "leave.approve"] },
        { key: "hr-settings", label: "Settings", icon: "settings", path: "/hr/settings", permissions: ["hr.manage", "settings.manage"] },
      ],
    },

    // Administration section - filtered by AppShell using moduleKey/permissions
    {
      label: "Administration",
      icon: "manage_accounts",
      section: "Admin",
      moduleKey: "admin",
      children: [
{ key: "admin-users", label: "Users", icon: "people", path: "/admin/users", permissions: ["users.view", "users.manage"] },
        { key: "admin-roles", label: "Roles", icon: "admin_panel_settings", path: "/admin/roles", permissions: ["roles.manage"] },
        { key: "admin-groups", label: "Groups", icon: "groups", path: "/admin/groups", permissions: ["groups.view", "groups.manage"] },
        { key: "admin-projects", label: "Projects", icon: "assignment", path: "/admin/projects", permissions: ["projects.view", "projects.manage"] },
        { key: "admin-files", label: "Files", icon: "folder", path: "/admin/files", permissions: ["admin.view"] },
        { key: "admin-settings", label: "System Settings", icon: "settings", path: "/admin/settings", permissions: ["settings.manage"] },
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
    { label: "More", icon: "menu", active: false },
  ];
}
