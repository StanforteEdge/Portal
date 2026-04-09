import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Icon } from "../ui/Icon";

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
};

export function Sidebar({ navigation, activeLabel, collapsed = false }: SidebarProps) {
  const activeParentLabel =
    navigation.find((item) => item.label === activeLabel || item.children?.some((child) => child.label === activeLabel))
      ?.label ?? null;
  const [openItem, setOpenItem] = useState<string | null>(activeParentLabel);

  useEffect(() => {
    if (!collapsed) {
      setOpenItem(activeParentLabel);
    }
  }, [activeParentLabel, collapsed]);

  return (
    <aside className={[collapsed ? "w-20 px-3" : "w-64 p-4", "fixed left-0 top-16 z-40 hidden h-[calc(100vh-64px)] flex-col overflow-hidden border-r border-outline-variant bg-surface-container-low text-sm font-semibold transition-all duration-300 lg:flex"].join(" ")}>
      <nav className="flex-1 space-y-1 overflow-y-auto pb-4 pt-4 pr-1">
        {navigation.map((item, index) => {
          const hasChildren = Array.isArray(item.children) && item.children.length > 0;
          const childActive = hasChildren
            ? item.children!.some((child) => child.label === activeLabel)
            : false;
          const active = item.label === activeLabel || childActive;
          const previousSection = index > 0 ? navigation[index - 1]?.section : undefined;
          const showSectionLabel = !collapsed && item.section && item.section !== previousSection;
          return (
            <div key={item.label} className="space-y-1">
              {showSectionLabel ? (
                <div className="px-4 pt-3 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-slate-400">
                  {item.section}
                </div>
              ) : null}
              {hasChildren && !collapsed ? (
                <button
                  type="button"
                  className={[
                    "flex w-full items-center rounded-lg py-3 text-left transition",
                    collapsed ? "justify-center px-2" : "gap-3 px-4",
                    active
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "text-slate-600 hover:bg-slate-200/50",
                  ].join(" ")}
                  title={collapsed ? item.label : undefined}
                  aria-haspopup="menu"
                  aria-expanded={openItem === item.label}
                  onClick={() => setOpenItem((current) => (current === item.label ? null : item.label))}
                >
                  <Icon name={item.icon} fill={active} />
                  <span className="flex-1 text-left">{item.label}</span>
                  <Icon
                    name={openItem === item.label ? "expand_less" : "expand_more"}
                    className={active ? "text-white" : "text-slate-400"}
                  />
                </button>
              ) : (
                <div
                  className={[
                    "flex w-full items-center rounded-lg py-3 text-left transition",
                    collapsed ? "justify-center px-2" : "gap-3 px-4",
                    active
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "text-slate-600 hover:bg-slate-200/50",
                  ].join(" ")}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon name={item.icon} fill={active} />
                  {item.path ? (
                    <NavLink to={item.path} className={collapsed ? "" : "flex-1"}>
                      {collapsed ? <span className="sr-only">{item.label}</span> : item.label}
                    </NavLink>
                  ) : (
                    collapsed ? <span className="sr-only">{item.label}</span> : <span>{item.label}</span>
                  )}
                </div>
              )}

              {hasChildren && !collapsed && openItem === item.label ? (
                <div className="ml-4 space-y-1 border-l border-slate-200 pl-3">
                  {item.children!.map((child) => {
                    const childIsActive = child.label === activeLabel;
                    return (
                      <div
                        key={`${item.label}-${child.label}`}
                        className={[
                          "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-semibold transition",
                          childIsActive
                            ? "bg-brand-900/10 text-brand-900"
                            : "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
                        ].join(" ")}
                      >
                        {child.icon ? <Icon name={child.icon} className="text-[14px]" /> : null}
                        {child.path ? (
                          <NavLink to={child.path} className="flex-1">
                            {child.label}
                          </NavLink>
                        ) : (
                          <span>{child.label}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-slate-200/50 pt-4">
        <NavLink
          to="/help"
          className={({ isActive }) =>
            [
              "flex w-full items-center rounded-lg py-3 text-left transition",
              isActive ? "bg-brand-900/10 text-brand-900" : "text-slate-600 hover:bg-slate-200/50",
              collapsed ? "justify-center px-2" : "gap-3 px-4",
            ].join(" ")
          }
          title={collapsed ? "Support" : undefined}
        >
          <Icon name="help_outline" />
          {collapsed ? <span className="sr-only">Support</span> : <span>Support</span>}
        </NavLink>
        <button
          type="button"
          className={["flex w-full items-center rounded-lg py-3 text-left text-danger transition hover:bg-danger/5", collapsed ? "justify-center px-2" : "gap-3 px-4"].join(" ")}
          title={collapsed ? "Sign Out" : undefined}
        >
          <Icon name="logout" />
          {collapsed ? <span className="sr-only">Sign Out</span> : <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
