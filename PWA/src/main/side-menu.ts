import { type Menu } from "@/stores/menuSlice";

const menu: Array<Menu | "divider"> = [
  {
    icon: "Home",
    title: "Dashboard",
    pathname: "/app/dashboard",
  },
  {
    icon: "Wallet",
    title: "Requests",
    moduleKey: "finance",
    subMenu: [
      {
        icon: "List",
        pathname: "/app/requests/finance",
        title: "Requests",
      },
      {
        icon: "Plus",
        pathname: "/app/requests/finance/new",
        title: "New Request",
      },
    ],
  },
  {
    icon: "CheckCheck",
    pathname: "/app/approvals",
    title: "Approvals",
    permissions: ["requests.approve"],
  },
  {
    icon: "ClipboardList",
    title: "Leave",
    moduleKey: "leave",
    subMenu: [
      {
        icon: "Plus",
        pathname: "/app/requests/leave/new",
        title: "New Leave Request",
      },
      {
        icon: "ClipboardList",
        pathname: "/app/requests/leave",
        title: "Leave Tracker",
      },
    ],
  },
  {
    icon: "Clock3",
    pathname: "/app/requests/attendance",
    title: "Attendance",
    moduleKey: "attendance",
  },
  {
    icon: "Trello",
    title: "Workspace",
    subMenu: [
      {
        icon: "User",
        title: "My Profile",
        pathname: "/app/profile",
      },
      {
        icon: "ListChecks",
        title: "Onboarding",
        pathname: "/app/onboarding",
      },
      {
        icon: "Lock",
        title: "Security",
        pathname: "/app/settings/security",
      },
      {
        icon: "FileText",
        title: "My Payslips",
        pathname: "/app/profile/payslips",
        moduleKey: "finance",
      },
      {
        icon: "Clock3",
        title: "My Timesheets",
        pathname: "/app/profile/timesheets",
        moduleKey: "finance",
      },
      {
        icon: "Bell",
        title: "Payroll Notifications",
        pathname: "/app/profile/payroll-notifications",
        moduleKey: "finance",
      },
      {
        icon: "FolderOpen",
        title: "My Media",
        pathname: "/app/media",
        moduleKey: "media",
      },
      {
        icon: "BookOpen",
        title: "Documents",
        pathname: "/app/documents",
        moduleKey: "documents",
      },
    ],
  },
  {
    icon: "HelpCircle",
    title: "Help",
    pathname: "/app/help",
  },
  "divider",
  {
    icon: "Minus",
    title: "Admin",
    isSectionLabel: true,
    permissions: ["finance.view"],
  },
  {
    icon: "Wallet",
    title: "Finance",
    permissions: ["finance.view"],
    moduleKey: "finance",
    subMenu: [
      {
        icon: "LayoutDashboard",
        pathname: "/app/finance",
        title: "Dashboard",
      },
      {
        icon: "List",
        title: "Operations",
        subMenu: [
          {
            icon: "List",
            pathname: "/app/finance/requests",
            title: "Requests",
            matchSubPaths: true,
          },
          {
            icon: "Clipboard",
            pathname: "/app/finance/manual-entry",
            title: "Manual Entry",
            permissions: ["requests.manage"],
          },
          {
            icon: "FileText",
            pathname: "/app/finance/payment-vouchers",
            title: "Payment Vouchers",
          },
        ],
      },
      {
        icon: "CircleDollarSign",
        title: "Money Flow",
        subMenu: [
          {
            icon: "CircleDollarSign",
            pathname: "/app/finance/accounts",
            title: "Accounts",
            matchSubPaths: true,
          },
          {
            icon: "List",
            pathname: "/app/finance/ledger",
            title: "Ledger",
          },
          {
            icon: "FileText",
            pathname: "/app/finance/receivables",
            title: "Receivables",
            matchSubPaths: true,
          },
          {
            icon: "ListChecks",
            pathname: "/app/finance/payables",
            title: "Payables",
          },
        ],
      },
      {
        icon: "Wallet",
        title: "Planning",
        subMenu: [
          {
            icon: "Wallet",
            pathname: "/app/finance/budgets",
            title: "Budgets",
          },
          {
            icon: "Clipboard",
            pathname: "/app/finance/assets",
            title: "Assets",
            matchSubPaths: true,
          },
        ],
      },
      {
        icon: "Wallet",
        title: "Payroll",
        subMenu: [
          {
            icon: "LayoutDashboard",
            pathname: "/app/finance/payroll",
            title: "Dashboard",
            matchSubPaths: true,
          },
          {
            icon: "Inbox",
            pathname: "/app/finance/payroll/inbox",
            title: "Inbox",
          },
          {
            icon: "Wallet",
            pathname: "/app/finance/payroll/runs",
            title: "Runs",
          },
          {
            icon: "BarChart2",
            pathname: "/app/finance/payroll/reports",
            title: "Reports",
          },
          {
            icon: "Users",
            pathname: "/app/finance/payroll/workers",
            title: "Workers",
            permissions: ["finance.manage"],
          },
          {
            icon: "ListChecks",
            pathname: "/app/finance/payroll/components",
            title: "Components",
            permissions: ["finance.manage"],
          },
          {
            icon: "Clock3",
            pathname: "/app/finance/payroll/timesheets",
            title: "Timesheets",
            permissions: ["finance.manage"],
          },
          {
            icon: "CircleDollarSign",
            pathname: "/app/finance/payroll/loans",
            title: "Advances & Loans",
            permissions: ["finance.manage"],
          },
          {
            icon: "Bell",
            pathname: "/app/finance/payroll/notification-preferences",
            title: "Notification Preferences",
          },
          {
            icon: "FileText",
            pathname: "/app/finance/payroll/import",
            title: "Import",
            permissions: ["finance.manage"],
          },
          {
            icon: "FileText",
            pathname: "/app/finance/payroll/templates",
            title: "Templates",
          },
          {
            icon: "Settings",
            pathname: "/app/finance/payroll/settings",
            title: "Settings",
            permissions: ["finance.manage"],
          },
        ],
      },
      {
        icon: "BarChart2",
        title: "Reports",
        subMenu: [
          {
            icon: "LayoutDashboard",
            pathname: "/app/finance/reports",
            title: "Dashboard",
          },
          {
            icon: "TrendingUp",
            pathname: "/app/finance/reports/activities",
            title: "Statement of Activities",
          },
          {
            icon: "Wallet",
            pathname: "/app/finance/reports/position",
            title: "Financial Position",
          },
          {
            icon: "BarChart2",
            pathname: "/app/finance/reports/budget-vs-actual",
            title: "Budget vs Actual",
          },
          {
            icon: "CircleDollarSign",
            pathname: "/app/finance/reports/grant-utilization",
            title: "Grant Utilization",
          },
          {
            icon: "FileText",
            pathname: "/app/finance/reports/aged-receivables",
            title: "Aged Receivables",
          },
        ],
      },
      {
        icon: "Settings2",
        title: "Setup",
        subMenu: [
          {
            icon: "Settings",
            pathname: "/app/finance/settings",
            title: "Finance Settings",
            permissions: ["finance.manage"],
          },
          {
            icon: "BookOpen",
            pathname: "/app/finance/settings/chart-accounts",
            title: "Chart Accounts",
          },
          {
            icon: "Clock3",
            pathname: "/app/finance/settings/reporting-periods",
            title: "Reporting Periods",
          },
          {
            icon: "UsersRound",
            pathname: "/app/finance/settings/parties",
            title: "Customers & Vendors",
          },
          {
            icon: "BookOpen",
            pathname: "/app/finance/settings/nonprofit",
            title: "Funds & Grants",
          },
        ],
      },
    ],
  },
  {
    icon: "UserCheck",
    title: "People",
    permissions: ["users.manage"],
    moduleKey: "hr",
    subMenu: [
      {
        icon: "LayoutDashboard",
        pathname: "/app/hr",
        title: "Dashboard",
      },
      {
        icon: "Users",
        pathname: "/app/hr/employees",
        title: "Employees",
      },
      {
        icon: "Clock3",
        pathname: "/app/hr/attendance",
        title: "Attendance",
      },
      {
        icon: "ClipboardList",
        title: "Leave",
        subMenu: [
          {
            icon: "ClipboardList",
            pathname: "/app/hr/leave",
            title: "Leave Tracker",
          },
          {
            icon: "CheckCheck",
            pathname: "/app/hr/leave/requests",
            title: "Leave Requests",
          },
        ],
      },
      {
        icon: "ClipboardList",
        pathname: "/app/hr/onboarding",
        title: "Onboarding",
      },
      {
        icon: "Settings",
        title: "Settings",
        subMenu: [
          {
            icon: "Clock3",
            pathname: "/app/hr/settings",
            title: "Attendance Settings",
          },
          {
            icon: "BookOpen",
            pathname: "/app/hr/settings/leave",
            title: "Leave Settings",
          },
        ],
      },
    ],
  },
  {
    icon: "ShieldCheck",
    title: "Admin",
    permissions: ["settings.manage"],
    moduleKey: "admin",
    subMenu: [
      {
        icon: "UserCog",
        pathname: "/app/admin/users",
        title: "Users",
        matchSubPaths: true,
        permissions: ["users.manage"],
      },
      {
        icon: "ShieldCheck",
        pathname: "/app/admin/roles",
        title: "Roles & Permissions",
        permissions: ["roles.manage"],
      },
      {
        icon: "Folder",
        pathname: "/app/admin/files",
        title: "Media",
      },
      {
        icon: "Kanban",
        pathname: "/app/admin/projects",
        title: "Projects",
      },
      {
        icon: "BookOpen",
        pathname: "/app/admin/documents",
        title: "Documents",
      },
      {
        icon: "ClipboardList",
        pathname: "/app/admin/forms",
        title: "Forms",
      },
      {
        icon: "Settings2",
        pathname: "/app/admin/policies",
        title: "Policies",
      },
      {
        icon: "Settings2",
        pathname: "/app/admin/settings",
        title: "Settings",
      },
    ],
  },
];

export default menu;
