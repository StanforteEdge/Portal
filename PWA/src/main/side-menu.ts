import { type Menu } from "@/stores/menuSlice";

const menu: Array<Menu | "divider"> = [
  {
    icon: "Home",
    title: "Dashboard",
    pathname: "/app/dashboard",
  },
  {
    icon: "Wallet",
    title: "Finance",
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
      {
        icon: "CheckCheck",
        pathname: "/app/requests/approvals",
        title: "Approvals",
        permissions: ["requests.approve"],
      },
    ],
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
  {
    icon: "Trello",
    title: "Profile",
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
    ],
  },
  "divider",
  {
    icon: "Wallet",
    title: "Finance Admin",
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
        pathname: "/app/finance/requests",
        title: "Requests",
      },
      {
        icon: "FileText",
        pathname: "/app/finance/requests/request/:id",
        title: "Request",
      },
      {
        icon: "Settings",
        pathname: "/app/finance/settings",
        title: "Settings",
        permissions: ["settings.manage"],
      },
      {
        icon: "Clipboard",
        pathname: "/app/finance/manual-entry",
        title: "Manual Entry",
        permissions: ["requests.manage"],
      },
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
        pathname: "/app/finance/payment-vouchers",
        title: "Payment Vouchers",
      },
    ],
  },
  {
    icon: "UserCheck",
    title: "HR Admin",
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
    icon: "Users",
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
        icon: "ShieldCheck",
        pathname: "/app/admin/roles",
        title: "Roles & Permissions",
        permissions: ["roles.manage"],
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
