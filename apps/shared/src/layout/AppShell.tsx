import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { MobileBottomNav, type MobileNavItem } from "./MobileBottomNav";
import { MobileMenuSheet } from "./MobileMenuSheet";
import { Sidebar, type SidebarItem } from "./Sidebar";
import { DesktopTopBar, MobileTopBar } from "./TopBar";

type UserInfo = {
  name: string;
  role: string;
  title?: string;
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("se:pwa:sidebar-collapsed");
    if (stored === "true") {
      setSidebarCollapsed(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("se:pwa:sidebar-collapsed", sidebarCollapsed ? "true" : "false");
  }, [sidebarCollapsed]);

  return (
    <div className="app-shell min-h-[max(884px,100dvh)]">
      <DesktopTopBar
        user={user}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
        onSignOut={() => {
          // handled by the PWA auth layer in the future; keep shell resilient
        }}
      />
      <MobileTopBar user={user} />
      <Sidebar navigation={navigation} activeLabel={activeLabel} collapsed={sidebarCollapsed} />

      <div className={[sidebarCollapsed ? "lg:ml-20" : "lg:ml-64", "pt-24 min-h-screen pb-24 lg:pb-12 transition-[margin] duration-300"].join(" ")}>
        <main className="px-4 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>

      {mobileNav ? (
        <MobileBottomNav
          items={mobileNav.map((item) =>
            item.label === "More"
              ? { ...item, onClick: () => setMobileMenuOpen(true) }
              : item
          )}
        />
      ) : null}

      <MobileMenuSheet
        open={mobileMenuOpen}
        navigation={navigation}
        activeLabel={activeLabel}
        user={{ name: user.name, title: user.title || user.role }}
        onClose={() => setMobileMenuOpen(false)}
      />
    </div>
  );
}
