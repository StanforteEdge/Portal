import { type Menu } from "@/stores/menuSlice";

const menu: Array<Menu | "divider"> = [
  {
    icon: "Home",
    title: "Dashboard",
    pathname: "/app/dashboard",
  },
  {
    icon: "FileText",
    title: "Requests",
    moduleKey: "finance",
    subMenu: [
      {
        icon: "List",
        pathname: "/app/requests",
        title: "Requests",
      },
      {
        icon: "CheckCheck",
        pathname: "/app/approvals",
        title: "Approvals",
        permissions: ["requests.approve"],
      },
    ],
  },
  {
    icon: "Wallet",
    title: "Finance",
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
        icon: "Settings",
        pathname: "/app/finance/settings",
        title: "Settings",
      },
    ],
  },
  {
    icon: "Trello",
    title: "Work",
    permissions: ["work.view"],
    subMenu: [
      {
        icon: "BarChart2",
        pathname: "/app/work/performance",
        title: "Performance",
      },
      {
        icon: "ListChecks",
        pathname: "/app/work",
        title: "Tracker",
      },
    ],
  },
  {
    icon: "User",
    title: "Profile",
    pathname: "/app/profile",
  },
  {
    icon: "Users",
    title: "Admin",
    moduleKey: "admin",
    subMenu: [
      {
        icon: "UserCog",
        pathname: "/app/admin/users",
        title: "Users",
        matchSubPaths: true,
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
