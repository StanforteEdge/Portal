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
    subMenu: [
      {
        icon: "List",
        pathname: "/app/requests",
        title: "All Requests",
      },
      {
        icon: "CheckCheck",
        pathname: "/app/requests/approvals",
        title: "Approvals",
      },
    ],
  },
  {
    icon: "Wallet",
    title: "Finance",
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
    title: "Profile",
    pathname: "/app/profile",
  },
  {
    icon: "Users",
    title: "Admin",
    subMenu: [
      {
        icon: "UserCog",
        pathname: "/app/admin/users/list",
        title: "Users",
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
