import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Chip } from "../ui/Chip";
import { Icon } from "../ui/Icon";

type TopBarProps = {
  user: {
    name: string;
    role: string;
  };
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
};

export function DesktopTopBar({ user, sidebarCollapsed = false, onToggleSidebar }: TopBarProps) {
  const location = useLocation();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const iconButtonClass = (active: boolean) =>
    [
      "relative flex h-10 w-10 items-center justify-center rounded-full transition-colors",
      active ? "bg-brand-900/10 text-brand-900" : "hover:bg-surface-container-high",
    ].join(" ");

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!notificationRef.current) return;
      if (!notificationRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const quickNotifications = [
    {
      title: "Request approved",
      description: "PC/2025/001 has moved forward in the workflow.",
      time: "Just now",
    },
    {
      title: "Attendance reminder",
      description: "You are scheduled onsite tomorrow.",
      time: "Today",
    },
    {
      title: "Profile update",
      description: "Confirm your organization assignment.",
      time: "Today",
    },
  ];

  return (
    <header className="fixed top-0 z-50 hidden h-16 w-full items-center justify-between border-b border-outline-variant bg-surface-container-lowest/95 backdrop-blur-md transition-all duration-300 lg:flex">
      <div className={[sidebarCollapsed ? "w-20 px-4" : "w-64 px-6", "flex items-center gap-3 transition-all duration-300"].join(" ")}>
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-container-high"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Icon name={sidebarCollapsed ? "menu_open" : "menu"} />
        </button>
        <div className="flex cursor-pointer items-center gap-1 text-xl font-bold tracking-tighter text-primary">
          <span className="font-extrabold">Stanforte</span>
          {!sidebarCollapsed ? <span className="font-normal opacity-90">Edge</span> : null}
        </div>
      </div>

      <div className="flex flex-1 items-center justify-end gap-4 px-8">
        <div className="w-full max-w-md">
          <div className="relative group">
            <Icon
              name="search"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-on-surface-variant transition-colors group-focus-within:text-primary"
            />
            <input
              className="input-base h-10 rounded-full border-0 bg-surface-container-low pl-11 pr-4 text-sm"
              placeholder="Search operations..."
              type="search"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 px-6">
        <div className="mr-4 flex items-center gap-1 border-r border-outline-variant pr-4 text-on-surface-variant">
          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              className={iconButtonClass(location.pathname === "/notifications" || notificationsOpen)}
              onClick={() => setNotificationsOpen((value) => !value)}
              aria-label="Open notifications"
            >
              <Icon name="notifications" />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-danger ring-2 ring-surface-container-lowest" />
            </button>

            {notificationsOpen ? (
              <div className="absolute right-0 top-[calc(100%+0.75rem)] w-[360px] rounded-[24px] border border-slate-200 bg-white p-4 shadow-card">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Notifications</p>
                    <p className="mt-1 text-xs text-slate-500">Quick updates from your workspace.</p>
                  </div>
                  <Chip variant="pending">3 new</Chip>
                </div>
                <div className="mt-4 space-y-3">
                  {quickNotifications.map((item) => (
                    <div key={item.title} className="rounded-[18px] border border-slate-100 bg-slate-50 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                          {item.time}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
                    </div>
                  ))}
                </div>
                <NavLink
                  to="/notifications"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-900"
                  onClick={() => setNotificationsOpen(false)}
                >
                  See more
                  <Icon name="arrow_forward" className="text-[18px]" />
                </NavLink>
              </div>
            ) : null}
          </div>
          <NavLink to="/help" className={iconButtonClass(location.pathname === "/help")}>
            <Icon name="help" />
          </NavLink>
          <NavLink to="/settings" className={iconButtonClass(location.pathname === "/settings")}>
            <Icon name="settings" />
          </NavLink>
        </div>

        <NavLink
          to="/profile"
          className={[
            "flex cursor-pointer items-center gap-3 rounded-full py-1 pl-2 pr-1 transition-colors group",
            location.pathname === "/profile" ? "bg-brand-900/10" : "hover:bg-surface-container-high",
          ].join(" ")}
        >
          <div className="hidden flex-col items-end sm:flex">
            <span className="font-headline text-sm font-bold text-on-surface">
              {user.name}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              {user.role}
            </span>
          </div>
          <div className="relative">
            <img
              alt="User profile"
              className="h-10 w-10 rounded-full object-cover ring-2 ring-surface-variant group-hover:ring-primary"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBcoNhvOt-GUZkPMQeUBdmlfONJ2qyrlakMHezuxW8XASGhvdfudzsS5XFT0m7gGzwEe_9uf5cpF1_7gSdm1bP9vJRrpw7EuujkQpQ3FiSMo0UTsZBkkFY7XJAWzSXlAZjAnlKQ6Z6zWKrMazaq8VfAmvRdZn8JB8UqRVol078fLrEps0zOc41g_RBXRLM1y5H2ZmWJ1d9eMkFHRxWshrJf7kHkDMGew26LCshf_Uvr3RQoAUKvIlglC7e8LCs5p9-P6VWpu1QsjLQ8"
            />
          </div>
        </NavLink>
      </div>
    </header>
  );
}

export function MobileTopBar({ user }: TopBarProps) {
  const location = useLocation();
  return (
    <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between bg-surface/80 px-6 backdrop-blur-[24px] lg:hidden">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary-fixed">
          <img
            alt="Staff Profile"
            className="h-full w-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCOPNtlHIad3cDeI_zmEW_McJwfs0Xse9dEKgbkZvOCekttM07L3lMR0U0RMHkB6EQNnuV4xSkmooq4gbuOhawcfkjxmQSrCB4Hj-Z7dFSKh3vbJUqMAO2aLdW6HePzSVQJeuSLw6q0YrqUofuV5g7T0QXCmu4tgCGt5kn01KmW16LR9mT0pxhck6D-lNnqLm5CisqJfVTDZR6h8SYrCIQ68_c0UwkN2E9U2gefeWTod5AlGbwioZFQGxt7WedAv-KLD_BfhsoCAc7U"
          />
        </div>
        <span className="font-headline text-xl font-bold text-[#034785]">
          Stanforte Edge
        </span>
      </div>
      <NavLink
        to="/notifications"
        className={[
          "rounded-full p-2 transition-all active:scale-95 active:opacity-80",
          location.pathname === "/notifications" ? "bg-brand-900/10 text-brand-900" : "",
        ].join(" ")}
      >
        <Icon name="notifications" />
      </NavLink>
    </header>
  );
}
