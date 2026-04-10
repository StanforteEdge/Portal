import { type Menu } from "@/stores/menuSlice";

const menu: Array<Menu | "divider"> = [
  {
    icon: "Home",
    title: "Dashboard",
    pathname: "/appOld/dashboard",
  },
  {
    icon: "FileText",
    title: "Requests",
    moduleKey: "finance",
    subMenu: [
      {
        icon: "List",
        pathname: "/appOld/requests",
        title: "Requests",
      },
      {
        icon: "CheckCheck",
        pathname: "/appOld/approvals",
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
        pathname: "/appOld/finance",
        title: "Dashboard",
      },
      {
        icon: "List",
        pathname: "/appOld/finance/requests",
        title: "Requests",
      },
      {
        icon: "Settings",
        pathname: "/appOld/finance/settings",
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
        pathname: "/appOld/work/performance",
        title: "Performance",
      },
      {
        icon: "ListChecks",
        pathname: "/appOld/work",
        title: "Tracker",
      },
    ],
  },
  {
    icon: "User",
    title: "Profile",
    pathname: "/appOld/profile",
  },
  {
    icon: "Users",
    title: "Admin",
    moduleKey: "admin",
    subMenu: [
      {
        icon: "UserCog",
        pathname: "/appOld/admin/users",
        title: "Users",
        matchSubPaths: true,
      },
      {
        icon: "Settings2",
        pathname: "/appOld/admin/settings",
        title: "Settings",
      },
    ],
  },
];

export default menu;
