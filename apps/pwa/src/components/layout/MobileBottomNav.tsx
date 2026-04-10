import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { Button, Icon } from "@stanforte/shared";
import type { SidebarItem } from "./Sidebar";

type MobileNavItem = {
  label: string;
  icon: string;
  path?: string;
  active?: boolean;
  onClick?: () => void;
};

type MobileBottomNavProps = {
  items: MobileNavItem[];
  navigation: SidebarItem[];
  activeLabel: string;
  user: {
    name: string;
    title?: string;
  };
  onSignOut: () => void | Promise<void>;
};

type DrawerEntry = {
  label: string;
  icon: string;
  path?: string;
  active: boolean;
  section?: string;
  children?: Array<{
    label: string;
    icon: string;
    path?: string;
    active: boolean;
  }>;
};

export function MobileBottomNav({
  items,
  navigation,
  activeLabel,
  user,
  onSignOut,
}: MobileBottomNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (menuOpen) {
      closeButtonRef.current?.focus();
    }
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        return;
      }

      if (event.key !== "Tab" || !menuRef.current) return;
      const focusables = Array.from(
        menuRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((node) => !node.hasAttribute("disabled"));
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  const drawerEntries = useMemo<DrawerEntry[]>(() => {
    return [
      ...navigation.map((item) => ({
        label: item.label,
        icon: item.icon,
        path: item.path,
        active:
          item.label === activeLabel ||
          Boolean(item.children?.some((child) => child.label === activeLabel)),
        section: item.section,
        children: item.children?.map((child) => ({
          label: child.label,
          icon: child.icon || item.icon,
          path: child.path,
          active: child.label === activeLabel,
        })),
      })),
      {
        label: "Support",
        icon: "help_outline",
        path: "/help",
        active: activeLabel === "Support",
      },
    ];
  }, [activeLabel, navigation]);

  return (
    <>
      <nav className="fixed bottom-0 z-50 flex w-full items-center justify-around border-t border-outline-variant bg-surface/95 px-2 py-2 backdrop-blur-md lg:hidden">
        {items.map((item) => {
          const active = item.active;
          const classes = [
            "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10",
            active ? "text-primary" : "text-on-surface-variant",
          ].join(" ");

          const content = (
            <>
              <span
                className={[
                  "flex h-8 w-8 items-center justify-center rounded-full",
                  active ? "bg-primary text-white" : "bg-transparent",
                ].join(" ")}
              >
                <Icon name={item.icon} fill={active} />
              </span>
              <span className="truncate">{item.label}</span>
            </>
          );

          if (item.path) {
            return (
              <NavLink key={item.label} to={item.path} className={classes}>
                {content}
              </NavLink>
            );
          }

          return (
            <button
              key={item.label}
              type="button"
              className={classes}
              onClick={() => {
                if (item.onClick) item.onClick();
                else setMenuOpen((value) => !value);
              }}
              aria-label={item.label}
              aria-haspopup={item.label === "More" ? "dialog" : undefined}
              aria-expanded={item.label === "More" ? menuOpen : undefined}
              aria-controls={item.label === "More" ? "mobile-full-menu" : undefined}
            >
              {content}
            </button>
          );
        })}
      </nav>

      {menuOpen ? (
        <>
          <button
            type="button"
            aria-label="Close full menu"
            className="fixed inset-0 z-[59] bg-slate-950/40 lg:hidden"
            onClick={() => setMenuOpen(false)}
          />
          <div
            ref={menuRef}
            id="mobile-full-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Full menu"
            className="fixed inset-x-0 bottom-0 z-[60] max-h-[82dvh] overflow-y-auto rounded-t-[28px] border-t border-outline-variant bg-surface-container-lowest px-5 pb-8 pt-5 shadow-card lg:hidden"
          >
            <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-slate-200" />
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-slate-500">Full Menu</p>
                <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-950">{user.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{user.title || "Staff"}</p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10"
                aria-label="Close menu"
              >
                <Icon name="close" />
              </button>
            </div>

            <div className="space-y-2">
              {drawerEntries.map((entry, index) => {
                const previousSection =
                  index > 0 ? drawerEntries[index - 1]?.section : undefined;
                const showSectionLabel =
                  entry.section && entry.section !== previousSection;
                const hasChildren = Array.isArray(entry.children) && entry.children.length > 0;

                return (
                  <div key={entry.label} className="space-y-2">
                    {showSectionLabel ? (
                      <div className="px-1 pt-3 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-slate-400">
                        {entry.section}
                      </div>
                    ) : null}
                    <div className="rounded-[24px] border border-slate-100 bg-white p-4">
                      {entry.path ? (
                        <NavLink
                          to={entry.path}
                          onClick={() => setMenuOpen(false)}
                          className={[
                            "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10",
                            entry.active
                              ? "bg-brand-900 text-white"
                              : "bg-slate-50 text-slate-700 hover:bg-slate-100",
                          ].join(" ")}
                        >
                          <Icon name={entry.icon} fill={entry.active} />
                          <span className="flex-1">{entry.label}</span>
                          <Icon name="chevron_right" className="text-[18px]" />
                        </NavLink>
                      ) : (
                        <div className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900">
                          <Icon name={entry.icon} fill={entry.active} />
                          <span className="flex-1">{entry.label}</span>
                        </div>
                      )}

                      {hasChildren ? (
                        <div className="mt-4 space-y-2 border-l border-slate-200 pl-4">
                          {entry.children!.map((child) =>
                            child.path ? (
                              <NavLink
                                key={`${entry.label}-${child.label}`}
                                to={child.path}
                                onClick={() => setMenuOpen(false)}
                                className={[
                                  "flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10",
                                  child.active
                                    ? "bg-brand-900/10 text-brand-900"
                                    : "text-slate-600 hover:bg-slate-50",
                                ].join(" ")}
                              >
                                <Icon name={child.icon} className="text-[16px]" />
                                <span>{child.label}</span>
                              </NavLink>
                            ) : null,
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6">
              <Button
                variant="danger"
                className="w-full justify-center"
                onClick={() => {
                  setMenuOpen(false);
                  void onSignOut();
                }}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
