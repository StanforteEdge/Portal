import { type Menu } from "@/stores/menuSlice";

const menu: Array<Menu | "divider"> = [
  {
    icon: "Home",
    title: "Dashboard",
    pathname: "/appOld/dashboard",
  },
  {
    icon: "Wallet",
    title: "Requests",
    moduleKey: "finance",
    subMenu: [
      {
        icon: "List",
        pathname: "/appOld/requests/finance",
        title: "Requests",
      },
      {
        icon: "Plus",
        pathname: "/appOld/requests/finance/new",
        title: "New Request",
      },
    ],
  },
  {
    icon: "CheckCheck",
    pathname: "/appOld/approvals",
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
        pathname: "/appOld/requests/leave/new",
        title: "New Leave Request",
      },
      {
        icon: "ClipboardList",
        pathname: "/appOld/requests/leave",
        title: "Leave Tracker",
      },
    ],
  },
  {
    icon: "Clock3",
    pathname: "/appOld/requests/attendance",
    title: "Attendance",
    moduleKey: "attendance",
  },
  {
    icon: "ListChecks",
    title: "Work",
    subMenu: [
      {
        icon: "BarChart2",
        pathname: "/appOld/work/performance",
        title: "Performance",
        permissions: ["work.view"],
      },
      {
        icon: "ListChecks",
        pathname: "/appOld/work",
        title: "Tracker",
        permissions: ["work.view"],
      },
      {
        icon: "ClipboardList",
        pathname: "/appOld/hr/work",
        title: "Planner",
        permissions: ["work.manage"],
      },
    ],
  },
  {
    icon: "User",
    title: "Profile",
    subMenu: [
      {
        icon: "User",
        title: "Profile",
        pathname: "/appOld/profile",
      },
      {
        icon: "ListChecks",
        title: "Onboarding",
        pathname: "/appOld/onboarding",
      },
      {
        icon: "FileText",
        title: "Payslips",
        pathname: "/appOld/profile/payslips",
        moduleKey: "finance",
      },
      {
        icon: "Clock3",
        title: "Timesheets",
        pathname: "/appOld/profile/timesheets",
        moduleKey: "finance",
      },
      {
        icon: "FolderOpen",
        title: "Media",
        pathname: "/appOld/media",
        moduleKey: "media",
      },
      {
        icon: "BookOpen",
        title: "Documents",
        pathname: "/appOld/documents",
        moduleKey: "documents",
      },
    ],
  },
  {
    icon: "Settings",
    title: "Settings",
    subMenu: [
      {
        icon: "Lock",
        title: "Security",
        pathname: "/appOld/settings/security",
      },
      {
        icon: "Bell",
        title: "Payroll Notifications",
        pathname: "/appOld/profile/payroll-notifications",
        moduleKey: "finance",
      },
    ],
  },
  {
    icon: "HelpCircle",
    title: "Help",
    pathname: "/appOld/help",
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
        pathname: "/appOld/finance",
        title: "Dashboard",
      },
      {
        icon: "List",
        title: "Operations",
        subMenu: [
          {
            icon: "List",
            pathname: "/appOld/finance/requests",
            title: "Requests",
            matchSubPaths: true,
          },
          {
            icon: "Clipboard",
            pathname: "/appOld/finance/manual-entry",
            title: "Manual Entry",
            permissions: ["requests.manage"],
          },
          {
            icon: "FileText",
            pathname: "/appOld/finance/payment-vouchers",
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
            pathname: "/appOld/finance/accounts",
            title: "Accounts",
            matchSubPaths: true,
          },
          {
            icon: "List",
            pathname: "/appOld/finance/ledger",
            title: "Ledger",
          },
          {
            icon: "FileText",
            pathname: "/appOld/finance/receivables",
            title: "Receivables",
            matchSubPaths: true,
          },
          {
            icon: "ListChecks",
            pathname: "/appOld/finance/payables",
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
            pathname: "/appOld/finance/budgets",
            title: "Budgets",
          },
          {
            icon: "Clipboard",
            pathname: "/appOld/finance/assets",
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
            pathname: "/appOld/finance/payroll",
            title: "Dashboard",
            matchSubPaths: true,
          },
          {
            icon: "Inbox",
            pathname: "/appOld/finance/payroll/inbox",
            title: "Inbox",
          },
          {
            icon: "Wallet",
            pathname: "/appOld/finance/payroll/runs",
            title: "Runs",
          },
          {
            icon: "BarChart2",
            pathname: "/appOld/finance/payroll/reports",
            title: "Reports",
          },
          {
            icon: "Users",
            pathname: "/appOld/finance/payroll/workers",
            title: "Workers",
            permissions: ["finance.manage"],
          },
          {
            icon: "ListChecks",
            pathname: "/appOld/finance/payroll/components",
            title: "Components",
            permissions: ["finance.manage"],
          },
          {
            icon: "Clock3",
            pathname: "/appOld/finance/payroll/timesheets",
            title: "Timesheets",
            permissions: ["finance.manage"],
          },
          {
            icon: "CircleDollarSign",
            pathname: "/appOld/finance/payroll/loans",
            title: "Advances & Loans",
            permissions: ["finance.manage"],
          },
          {
            icon: "Bell",
            pathname: "/appOld/finance/payroll/notification-preferences",
            title: "Notification Preferences",
          },
          {
            icon: "FileText",
            pathname: "/appOld/finance/payroll/import",
            title: "Import",
            permissions: ["finance.manage"],
          },
          {
            icon: "FileText",
            pathname: "/appOld/finance/payroll/templates",
            title: "Templates",
          },
          {
            icon: "Settings",
            pathname: "/appOld/finance/payroll/settings",
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
            pathname: "/appOld/finance/reports",
            title: "Dashboard",
          },
          {
            icon: "TrendingUp",
            pathname: "/appOld/finance/reports/activities",
            title: "Statement of Activities",
          },
          {
            icon: "Wallet",
            pathname: "/appOld/finance/reports/position",
            title: "Financial Position",
          },
          {
            icon: "BarChart2",
            pathname: "/appOld/finance/reports/budget-vs-actual",
            title: "Budget vs Actual",
          },
          {
            icon: "CircleDollarSign",
            pathname: "/appOld/finance/reports/grant-utilization",
            title: "Grant Utilization",
          },
          {
            icon: "FileText",
            pathname: "/appOld/finance/reports/aged-receivables",
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
            pathname: "/appOld/finance/settings",
            title: "Finance Settings",
            permissions: ["finance.manage"],
          },
          {
            icon: "BookOpen",
            pathname: "/appOld/finance/settings/chart-accounts",
            title: "Chart Accounts",
          },
          {
            icon: "Clock3",
            pathname: "/appOld/finance/settings/reporting-periods",
            title: "Reporting Periods",
          },
          {
            icon: "UsersRound",
            pathname: "/appOld/finance/settings/parties",
            title: "Customers & Vendors",
          },
          {
            icon: "BookOpen",
            pathname: "/appOld/finance/settings/nonprofit",
            title: "Funds & Grants",
          },
        ],
      },
    ],
  },
  {
    icon: "UserCheck",
    title: "People",
    moduleKey: "hr",
    subMenu: [
      {
        icon: "LayoutDashboard",
        pathname: "/appOld/hr",
        title: "Dashboard",
      },
      {
        icon: "Users",
        pathname: "/appOld/hr/employees",
        title: "Employees",
      },
      {
        icon: "Clock3",
        pathname: "/appOld/hr/attendance",
        title: "Attendance",
      },
      {
        icon: "ClipboardList",
        title: "Leave",
        subMenu: [
          {
            icon: "ClipboardList",
            pathname: "/appOld/hr/leave",
            title: "Leave Tracker",
          },
          {
            icon: "CheckCheck",
            pathname: "/appOld/hr/leave/requests",
            title: "Leave Requests",
          },
        ],
      },
      {
        icon: "ClipboardList",
        pathname: "/appOld/hr/onboarding",
        title: "Onboarding",
      },
      {
        icon: "Settings",
        title: "Settings",
        subMenu: [
          {
            icon: "Clock3",
            pathname: "/appOld/hr/settings",
            title: "Attendance Settings",
          },
          {
            icon: "BookOpen",
            pathname: "/appOld/hr/settings/leave",
            title: "Leave Settings",
          },
        ],
      },
    ],
  },
  {
    icon: "ShieldCheck",
    title: "Admin",
    moduleKey: "admin",
    subMenu: [
      {
        icon: "UserCog",
        pathname: "/appOld/admin/users",
        title: "Users",
        matchSubPaths: true,
        permissions: ["users.manage"],
      },
      {
        icon: "ShieldCheck",
        pathname: "/appOld/admin/roles",
        title: "Roles & Permissions",
        permissions: ["roles.manage"],
      },
      {
        icon: "Users",
        pathname: "/appOld/admin/groups",
        title: "Groups",
        permissions: ["groups.manage"],
      },
      {
        icon: "Folder",
        pathname: "/appOld/admin/files",
        title: "Media",
        permissions: ["admin.manage"],
      },
      {
        icon: "Kanban",
        pathname: "/appOld/admin/projects",
        title: "Projects",
        permissions: ["projects.manage"],
      },
      {
        icon: "BookOpen",
        pathname: "/appOld/admin/documents",
        title: "Documents",
        permissions: ["admin.manage"],
      },
      {
        icon: "ClipboardList",
        pathname: "/appOld/admin/forms",
        title: "Forms",
        permissions: ["admin.manage"],
      },
      {
        icon: "Settings2",
        pathname: "/appOld/admin/policies",
        title: "Policies",
        permissions: ["admin.manage"],
      },
      {
        icon: "Settings2",
        pathname: "/appOld/admin/settings",
        title: "Settings",
        permissions: ["admin.manage"],
      },
    ],
  },
];

export default menu;
