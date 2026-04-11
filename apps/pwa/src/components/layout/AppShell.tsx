import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  hasAnyPermission,
  hasApprovalAccess,
  hasModuleAccess,
  roleLabel,
  sortRoles,
} from "@stanforte/shared";
import { useAuth } from "@/context/AuthProvider";
import { useCachedQuery } from "@/lib/core";
import {
  getWorkspaceProfile,
  getWorkspaceUnreadNotificationCount,
  listWorkspaceNotifications,
  markAllWorkspaceNotificationsRead,
  markWorkspaceNotificationRead,
} from "@/features/system/workspace-api";
import { MobileBottomNav } from "./MobileBottomNav";
import { Sidebar, type SidebarItem } from "./Sidebar";
import { DesktopTopBar, MobileTopBar } from "./TopBar";

type UserInfo = {
  name: string;
  role: string;
};

type MobileNavItem = {
  label: string;
  icon: string;
  path?: string;
  active?: boolean;
  onClick?: () => void;
};

type AppShellProps = {
  children: ReactNode;
  navigation: SidebarItem[];
  activeLabel: string;
  user: UserInfo;
  mobileNav?: MobileNavItem[];
};

export function AppShell({
  children,
  navigation,
  activeLabel,
  user,
  mobileNav,
}: AppShellProps) {
  const { signOut, user: authUser } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { data: profile } = useCachedQuery(
    "workspace:profile:shell",
    () => getWorkspaceProfile(),
    {
      ttlMs: 1000 * 60,
      storage: "memory",
    },
  );
  const { data: notifications, refetch: refetchNotifications } = useCachedQuery(
    "workspace:notifications:preview",
    () => listWorkspaceNotifications(),
    {
      ttlMs: 1000 * 30,
      storage: "memory",
    },
  );
  const { data: unreadCount, refetch: refetchUnreadCount } = useCachedQuery(
    "workspace:notifications:unread-count",
    () => getWorkspaceUnreadNotificationCount(),
    {
      ttlMs: 1000 * 30,
      storage: "memory",
    },
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("se:pwa:sidebar-collapsed");
    if (stored === "true") {
      setSidebarCollapsed(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      "se:pwa:sidebar-collapsed",
      sidebarCollapsed ? "true" : "false",
    );
  }, [sidebarCollapsed]);

  const topNotifications = useMemo(
    () => (notifications ?? []).slice(0, 6),
    [notifications],
  );
  const visibleNavigation = useMemo(
    () =>
      navigation.reduce<SidebarItem[]>((acc, item) => {
        const teamLeadAssigned = Boolean(
          [
            ...(profile?.groups ?? []),
            ...(profile?.teams ?? []),
            ...(profile?.projects ?? []),
          ].some((group) =>
            String(group?.role ?? "")
              .toLowerCase()
              .includes("lead"),
          ),
        );
        const canAccessItem =
          (!item.moduleKey || hasModuleAccess(authUser, item.moduleKey)) &&
          (!item.permissions?.length ||
            hasAnyPermission(authUser, item.permissions) ||
            (item.requiresTeamLeadAssignment && hasApprovalAccess(authUser))) &&
          (!item.requiresTeamLeadAssignment ||
            teamLeadAssigned ||
            hasApprovalAccess(authUser));

        const children = Array.isArray(item.children)
          ? item.children.filter((child) => {
              const canAccessChild =
                (!child.permissions?.length ||
                  hasAnyPermission(authUser, child.permissions) ||
                  (child.requiresTeamLeadAssignment &&
                    hasApprovalAccess(authUser))) &&
                (!item.moduleKey ||
                  hasModuleAccess(authUser, item.moduleKey)) &&
                (!child.requiresTeamLeadAssignment ||
                  teamLeadAssigned ||
                  hasApprovalAccess(authUser));
              return canAccessChild;
            })
          : undefined;

        if (canAccessItem || (children?.length ?? 0) > 0) {
          acc.push({ ...item, children });
        }
        return acc;
      }, []),
    [authUser, navigation, profile?.groups, profile?.projects, profile?.teams],
  );
  const shellUser = useMemo(() => {
    const profileTitle = profile?.employee_profile?.job_title?.trim() || "";
    const profileDisplayName =
      `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim();
    const authDisplayName =
      `${authUser?.first_name ?? ""} ${authUser?.last_name ?? ""}`.trim() ||
      authUser?.username ||
      authUser?.email ||
      "";
    const roles = sortRoles(
      Array.from(
        new Set(
          (authUser?.roles?.length
            ? authUser.roles
            : String(user.role || "").split("|")
          )
            .map((entry) => String(entry).trim().toLowerCase())
            .filter(Boolean),
        ),
      ),
    );
    const primaryRole = roles[0] ? roleLabel(roles[0]) : "Staff";
    const extraRoles = roles.slice(1).map(roleLabel);

    return {
      name: profileDisplayName || authDisplayName || user.name,
      title: profileTitle || primaryRole,
    };
  }, [
    authUser?.email,
    authUser?.first_name,
    authUser?.last_name,
    authUser?.roles,
    authUser?.username,
    profile?.employee_profile?.job_title,
    profile?.first_name,
    profile?.last_name,
    profile?.projects,
    profile?.teams,
    user.name,
    user.role,
  ]);

  async function handleMarkNotificationRead(id: string) {
    await markWorkspaceNotificationRead(id);
    await Promise.all([refetchNotifications(), refetchUnreadCount()]);
  }

  async function handleMarkAllNotificationsRead() {
    await markAllWorkspaceNotificationsRead();
    await Promise.all([refetchNotifications(), refetchUnreadCount()]);
  }

  return (
    <div className="app-shell min-h-[max(884px,100dvh)]">
      <DesktopTopBar
        user={shellUser}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
        notifications={topNotifications}
        unreadCount={unreadCount ?? 0}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onSignOut={() => signOut()}
      />
      <MobileTopBar
        user={shellUser}
        unreadCount={unreadCount ?? 0}
        onSignOut={() => signOut()}
      />
      <Sidebar
        navigation={visibleNavigation}
        activeLabel={activeLabel}
        collapsed={sidebarCollapsed}
        onSignOut={() => signOut()}
      />

      <div
        className={[
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-64",
          "min-h-screen pb-24 pt-24 transition-[margin] duration-300 lg:pb-12",
        ].join(" ")}
      >
        <main className="px-4 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>

      {mobileNav ? (
        <MobileBottomNav
          items={mobileNav}
          navigation={visibleNavigation}
          activeLabel={activeLabel}
          user={shellUser}
          onSignOut={() => signOut()}
        />
      ) : null}
    </div>
  );
}
