import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Icon } from "@stanforte/shared";

export type SidebarItem = {
  label: string;
  icon: string;
  path?: string;
  section?: string;
  children?: Array<{
    label: string;
    icon?: string;
    path?: string;
  }>;
};

type SidebarProps = {
  navigation: SidebarItem[];
  activeLabel: string;
  collapsed?: boolean;
  onSignOut: () => void | Promise<void>;
};

export function Sidebar({
  navigation,
  activeLabel,
  collapsed = false,
  onSignOut,
}: SidebarProps) {
  const activeParentLabel =
    navigation.find(
      (item) =>
        item.label === activeLabel ||
        item.children?.some((child) => child.label === activeLabel),
    )?.label ?? null;
  const [openItem, setOpenItem] = useState<string | null>(activeParentLabel);

  useEffect(() => {
    if (!collapsed) {
      setOpenItem(activeParentLabel);
    }
  }, [activeParentLabel, collapsed]);

  return (
    <aside
      className={[
        collapsed ? "w-20 px-3" : "w-64 p-4",
        "fixed left-0 top-16 z-40 hidden h-[calc(100vh-64px)] flex-col overflow-hidden border-r border-outline-variant bg-surface-container-low text-sm font-semibold transition-all duration-300 lg:flex",
      ].join(" ")}
    >
      <nav className="flex-1 space-y-1 overflow-y-auto pb-4 pt-4 pr-1">
        {navigation.map((item, index) => {
          const hasChildren =
            Array.isArray(item.children) && item.children.length > 0;
          const childActive = hasChildren
            ? item.children!.some((child) => child.label === activeLabel)
            : false;
          const active = item.label === activeLabel || childActive;
          const previousSection =
            index > 0 ? navigation[index - 1]?.section : undefined;
          const showSectionLabel =
            !collapsed && item.section && item.section !== previousSection;
          const itemClasses = [
            "flex w-full items-center rounded-lg py-3 text-left transition",
            collapsed ? "justify-center px-2" : "gap-3 px-4",
            active
              ? "bg-primary text-white shadow-lg shadow-primary/20"
              : "text-slate-600 hover:bg-slate-200/50",
          ].join(" ");

          return (
            <div key={item.label} className="group relative space-y-1">
              {showSectionLabel ? (
                <div className="px-4 pt-3 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-slate-400">
                  {item.section}
                </div>
              ) : null}
              {hasChildren && !collapsed ? (
                <button
                  type="button"
                  className={itemClasses}
                  title={collapsed ? item.label : undefined}
                  aria-haspopup="menu"
                  aria-expanded={openItem === item.label}
                  onClick={() =>
                    setOpenItem((current) =>
                      current === item.label ? null : item.label,
                    )
                  }
                >
                  <Icon name={item.icon} fill={active} />
                  <span className="flex-1 text-left">{item.label}</span>
                  <Icon
                    name={
                      openItem === item.label ? "expand_less" : "expand_more"
                    }
                    className={active ? "text-white" : "text-slate-400"}
                  />
                </button>
              ) : item.path ? (
                <NavLink
                  to={item.path}
                  className={itemClasses}
                  title={collapsed ? item.label : undefined}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon name={item.icon} fill={active} />
                  {collapsed ? (
                    <span className="sr-only">{item.label}</span>
                  ) : (
                    <span>{item.label}</span>
                  )}
                </NavLink>
              ) : (
                <button
                  type="button"
                  className={itemClasses}
                  title={collapsed ? item.label : undefined}
                  aria-haspopup={hasChildren ? "menu" : undefined}
                  aria-expanded={hasChildren ? active : undefined}
                >
                  <Icon name={item.icon} fill={active} />
                  {collapsed ? (
                    <span className="sr-only">{item.label}</span>
                  ) : (
                    <span>{item.label}</span>
                  )}
                </button>
              )}

              {hasChildren && !collapsed && openItem === item.label ? (
                <div className="ml-4 space-y-1 border-l border-slate-200 pl-3">
                  {item.children!.map((child) => {
                    const childIsActive = child.label === activeLabel;
                    return (
                      <NavLink
                        key={`${item.label}-${child.label}`}
                        className={[
                          "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10",
                          childIsActive
                            ? "bg-brand-900/10 text-brand-900"
                            : "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
                        ].join(" ")}
                        to={child.path || "#"}
                        aria-current={childIsActive ? "page" : undefined}
                      >
                        {child.icon ? (
                          <Icon name={child.icon} className="text-[14px]" />
                        ) : null}
                        <span className="flex-1">{child.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              ) : null}

              {hasChildren && collapsed ? (
                <div
                  className={[
                    "invisible absolute left-full top-0 z-50 min-w-[14rem] pl-2 opacity-0 transition duration-150",
                    "group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100",
                  ].join(" ")}
                >
                  <div className="pointer-events-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-card">
                    <div className="mb-1 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                      {item.label}
                    </div>
                    <div className="space-y-1">
                      {item.children!.map((child) => {
                        const childIsActive = child.label === activeLabel;
                        return (
                          <NavLink
                            key={`${item.label}-${child.label}-collapsed`}
                            className={[
                              "pointer-events-auto flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10",
                              childIsActive
                                ? "bg-brand-900/10 text-brand-900"
                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                            ].join(" ")}
                            to={child.path || "#"}
                            aria-current={childIsActive ? "page" : undefined}
                          >
                            {child.icon ? (
                              <Icon name={child.icon} className="text-[14px]" />
                            ) : null}
                            <span className="flex-1">{child.label}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      <div className="space-y-1  border-t border-slate-200/50 pt-4">
        {" "}
        <button
          type="button"
          onClick={() => void onSignOut()}
          className={[
            "flex w-full items-center rounded-lg py-3 text-left text-danger transition hover:bg-danger/5",
            collapsed ? "justify-center px-2" : "gap-3 px-4",
          ].join(" ")}
          title={collapsed ? "Sign Out" : undefined}
        >
          <Icon name="logout" />
          {collapsed ? (
            <span className="sr-only">Sign Out</span>
          ) : (
            <span>Sign Out</span>
          )}
        </button>
      </div>
    </aside>
  );
}
