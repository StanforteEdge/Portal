import { useEffect, useRef, useState, type RefObject } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Chip } from "../ui/Chip";
import { Icon } from "../ui/Icon";
import stanforteIcon from "../../assets/brand/Stanforteedge Identity_Stanforteedge Icon.svg";
import stanforteLogo from "../../assets/brand/Stanforteedge Identity_Stanforteedge Logo.svg";

type WorkspaceNotification = {
  id: string;
  title: string;
  message: string;
  status?: "read" | "unread";
  createdAt?: string | null;
};

type TopBarProps = {
  user: {
    name: string;
    role: string;
    title?: string;
  };
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  notifications?: WorkspaceNotification[];
  unreadCount?: number;
  onMarkNotificationRead?: (id: string) => void | Promise<void>;
  onMarkAllNotificationsRead?: () => void | Promise<void>;
  onSignOut?: () => void;
};

function formatRelativeTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const tense = diffMs >= 0 ? "ago" : "from now";
  const diff = Math.abs(diffMs);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "Just now";
  if (diff < hour) {
    const count = Math.round(diff / minute);
    return `${count} minute${count === 1 ? "" : "s"} ${tense}`;
  }
  if (diff < day) {
    const count = Math.round(diff / hour);
    return `${count} hour${count === 1 ? "" : "s"} ${tense}`;
  }
  const count = Math.round(diff / day);
  return `${count} day${count === 1 ? "" : "s"} ${tense}`;
}

function useOutsideClose(ref: RefObject<HTMLElement>, close: () => void, open: boolean) {
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(event.target as Node)) {
        close();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [close, open, ref]);
}

export function DesktopTopBar({
  user,
  sidebarCollapsed = false,
  onToggleSidebar,
  notifications = [],
  unreadCount = 0,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onSignOut,
}: TopBarProps) {
  const location = useLocation();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [busyId, setBusyId] = useState<string>("");
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);
  useOutsideClose(notificationRef, () => setNotificationsOpen(false), notificationsOpen);
  useOutsideClose(profileRef, () => setProfileOpen(false), profileOpen);

  const iconButtonClass = (active: boolean) =>
    [
      "relative flex h-10 w-10 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10",
      active ? "bg-brand-900/10 text-brand-900" : "hover:bg-surface-container-high",
    ].join(" ");

  async function handleMarkRead(id: string) {
    if (!onMarkNotificationRead) return;
    try {
      setBusyId(id);
      await onMarkNotificationRead(id);
    } finally {
      setBusyId("");
    }
  }

  async function handleMarkAllRead() {
    if (!onMarkAllNotificationsRead) return;
    try {
      setBusyId("all");
      await onMarkAllNotificationsRead();
    } finally {
      setBusyId("");
    }
  }

  return (
    <header className="fixed top-0 z-50 hidden h-16 w-full items-center justify-between border-b border-outline-variant bg-surface-container-lowest/95 backdrop-blur-md transition-all duration-300 lg:flex">
      <div className={[sidebarCollapsed ? "w-20 px-4" : "w-64 px-6", "flex items-center gap-3 transition-all duration-300"].join(" ")}>
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Icon name={sidebarCollapsed ? "menu_open" : "menu"} />
        </button>
        <NavLink to="/" className="flex items-center" aria-label="Go to dashboard">
          <img
            src={sidebarCollapsed ? stanforteIcon : stanforteLogo}
            alt="Stanforte Edge"
            className={sidebarCollapsed ? "h-7 w-7 object-contain" : "h-8 w-auto object-contain"}
          />
        </NavLink>
      </div>

      <div className="flex flex-1 items-center justify-end gap-4 px-8">
        <div className="w-full max-w-md">
          <div className="relative group">
            <label htmlFor="workspace-search" className="sr-only">Search the workspace</label>
            <Icon
              name="search"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-on-surface-variant transition-colors group-focus-within:text-primary"
            />
            <input
              id="workspace-search"
              className="input-base h-10 rounded-full border-0 bg-surface-container-low pl-11 pr-4 text-sm"
              placeholder="Search operations..."
              type="search"
              aria-label="Search the workspace"
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
              aria-label={unreadCount > 0 ? `Open notifications, ${unreadCount} unread` : "Open notifications"}
              aria-haspopup="menu"
              aria-expanded={notificationsOpen}
              aria-controls="workspace-notifications-menu"
            >
              <Icon name="notifications" />
              {unreadCount > 0 ? <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-danger ring-2 ring-surface-container-lowest" /> : null}
            </button>

            {notificationsOpen ? (
              <div
                id="workspace-notifications-menu"
                role="menu"
                aria-label="Notifications"
                className="absolute right-0 top-[calc(100%+0.75rem)] w-[360px] rounded-[24px] border border-slate-200 bg-white p-4 shadow-card"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Notifications</p>
                    <p className="mt-1 text-xs text-slate-500">Quick updates from your workspace.</p>
                  </div>
                  <Chip variant="pending">{unreadCount > 0 ? `${unreadCount} new` : "All read"}</Chip>
                </div>
                <div className="mt-4 space-y-3">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-slate-500">No notifications yet.</p>
                  ) : (
                    notifications.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        role="menuitem"
                        className="w-full rounded-[18px] border border-slate-100 bg-slate-50 px-4 py-3 text-left transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10"
                        onClick={() => void handleMarkRead(item.id)}
                        disabled={busyId === item.id}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                            {formatRelativeTime(item.createdAt)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-500">{item.message}</p>
                      </button>
                    ))
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    className="text-sm font-semibold text-brand-900 transition hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10"
                    onClick={() => setNotificationsOpen(false)}
                  >
                    Close
                  </button>
                  {unreadCount > 0 ? (
                    <button
                      type="button"
                      className="text-sm font-semibold text-brand-900 transition hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10"
                      onClick={() => void handleMarkAllRead()}
                      disabled={busyId === "all"}
                    >
                      Mark all read
                    </button>
                  ) : null}
                  <NavLink
                    to="/notifications"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-brand-900"
                    onClick={() => setNotificationsOpen(false)}
                  >
                    See more
                    <Icon name="arrow_forward" className="text-[18px]" />
                  </NavLink>
                </div>
              </div>
            ) : null}
          </div>
          <NavLink to="/help" className={iconButtonClass(location.pathname === "/help")} aria-label="Open support">
            <Icon name="help" />
          </NavLink>
          <NavLink to="/settings" className={iconButtonClass(location.pathname === "/settings")} aria-label="Open settings">
            <Icon name="settings" />
          </NavLink>
        </div>

        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((value) => !value)}
            className={[
              "flex cursor-pointer items-center gap-3 rounded-full py-1 pl-2 pr-1 transition-colors group focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10",
              location.pathname === "/profile" ? "bg-brand-900/10" : "hover:bg-surface-container-high",
            ].join(" ")}
            aria-haspopup="menu"
            aria-expanded={profileOpen}
            aria-controls="workspace-user-menu"
          >
            <div className="hidden flex-col items-end sm:flex">
              <span className="font-headline text-sm font-bold text-on-surface">{user.name}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                {user.title || user.role}
              </span>
            </div>
            <div className="relative">
              <img
                alt="User profile"
                className="h-10 w-10 rounded-full object-cover ring-2 ring-surface-variant group-hover:ring-primary"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBcoNhvOt-GUZkPMQeUBdmlfONJ2qyrlakMHezuxW8XASGhvdfudzsS5XFT0m7gGzwEe_9uf5cpF1_7gSdm1bP9vJRrpw7EuujkQpQ3FiSMo0UTsZBkkFY7XJAWzSXlAZjAnlKQ6Z6zWKrMazaq8VfAmvRdZn8JB8UqRVol078fLrEps0zOc41g_RBXRLM1y5H2ZmWJ1d9eMkFHRxWshrJf7kHkDMGew26LCshf_Uvr3RQoAUKvIlglC7e8LCs5p9-P6VWpu1QsjLQ8"
              />
            </div>
          </button>

          {profileOpen ? (
            <div
              id="workspace-user-menu"
              role="menu"
              aria-label="User menu"
              className="absolute right-0 top-[calc(100%+0.75rem)] w-[320px] overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-card"
            >
              <div className="border-b border-slate-100 px-5 py-4">
                <p className="text-sm font-semibold text-slate-950">{user.name}</p>
                <p className="mt-1 text-xs text-slate-500">{user.title || user.role}</p>
              </div>
              <div className="p-2">
                <NavLink
                  to="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  role="menuitem"
                >
                  <Icon name="person" />
                  Profile
                </NavLink>
                <NavLink
                  to="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  role="menuitem"
                >
                  <Icon name="settings" />
                  Settings
                </NavLink>
                <NavLink
                  to="/help"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  role="menuitem"
                >
                  <Icon name="help" />
                  Support
                </NavLink>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    onSignOut?.();
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-danger transition hover:bg-danger/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-danger/10"
                  role="menuitem"
                >
                  <Icon name="logout" />
                  Sign Out
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export function MobileTopBar({ user, unreadCount = 0, onSignOut }: TopBarProps) {
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);
  useOutsideClose(profileRef, () => setProfileOpen(false), profileOpen);

  return (
    <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between bg-surface/80 px-6 backdrop-blur-[24px] lg:hidden">
      <NavLink to="/" className="flex items-center" aria-label="Go to dashboard">
        <img src={stanforteLogo} alt="Stanforte Edge" className="h-8 w-auto object-contain" />
      </NavLink>
      <div className="flex items-center gap-2">
        <NavLink
          to="/notifications"
          className={[
            "relative rounded-full p-2 transition-all active:scale-95 active:opacity-80 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10",
            location.pathname === "/notifications" ? "bg-brand-900/10 text-brand-900" : "",
          ].join(" ")}
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        >
          <Icon name="notifications" />
          {unreadCount > 0 ? <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-danger" /> : null}
        </NavLink>
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((value) => !value)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary ring-2 ring-transparent transition hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10"
            aria-label="Open user menu"
            aria-haspopup="menu"
            aria-expanded={profileOpen}
          >
            {user.name?.charAt(0)?.toUpperCase() || "U"}
          </button>
          {profileOpen ? (
            <div role="menu" aria-label="User menu" className="absolute right-0 top-[calc(100%+0.75rem)] w-[280px] overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-card">
              <div className="border-b border-slate-100 px-4 py-4">
                <p className="text-sm font-semibold text-slate-950">{user.name}</p>
                <p className="mt-1 text-xs text-slate-500">{user.title || user.role}</p>
              </div>
              <div className="p-2">
                <NavLink to="/profile" className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => setProfileOpen(false)}>
                  <Icon name="person" />
                  Profile
                </NavLink>
                <NavLink to="/settings" className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => setProfileOpen(false)}>
                  <Icon name="settings" />
                  Settings
                </NavLink>
                <NavLink to="/help" className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => setProfileOpen(false)}>
                  <Icon name="help" />
                  Support
                </NavLink>
                {onSignOut ? (
                  <button type="button" onClick={() => { setProfileOpen(false); onSignOut(); }} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-danger transition hover:bg-danger/5">
                    <Icon name="logout" />
                    Sign Out
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
