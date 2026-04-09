import { NavLink } from "react-router-dom";
import { Icon } from "@stanforte/shared";

export type SidebarItem = {
  label: string;
  icon: string;
  path?: string;
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

export function Sidebar({ navigation, activeLabel, collapsed = false, onSignOut }: SidebarProps) {
  return (
    <aside
      className={[
        collapsed ? "w-20 px-3" : "w-64 p-4",
        "fixed left-0 top-16 z-40 hidden h-[calc(100vh-64px)] flex-col border-r border-outline-variant bg-surface-container-low text-sm font-semibold transition-all duration-300 lg:flex",
      ].join(" ")}
    >
      <nav className="flex-1 space-y-1 pt-4">
        {navigation.map((item) => {
          const hasChildren = Array.isArray(item.children) && item.children.length > 0;
          const childActive = hasChildren ? item.children!.some((child) => child.label === activeLabel) : false;
          const active = item.label === activeLabel || childActive;
          const itemClasses = [
            "flex w-full items-center rounded-lg py-3 text-left transition",
            collapsed ? "justify-center px-2" : "gap-3 px-4",
            active ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-600 hover:bg-slate-200/50",
          ].join(" ");

          return (
            <div key={item.label} className="group relative space-y-1">
              {item.path ? (
                <NavLink
                  to={item.path}
                  className={itemClasses}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon name={item.icon} fill={active} />
                  {collapsed ? <span className="sr-only">{item.label}</span> : <span>{item.label}</span>}
                </NavLink>
              ) : (
                <button
                  type="button"
                  className={itemClasses}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon name={item.icon} fill={active} />
                  {collapsed ? <span className="sr-only">{item.label}</span> : <span>{item.label}</span>}
                </button>
              )}

              {hasChildren && !collapsed ? (
                <div className="ml-4 space-y-1 border-l border-slate-200 pl-3">
                  {item.children!.map((child) => {
                    const childIsActive = child.label === activeLabel;
                    return (
                      <div
                        key={`${item.label}-${child.label}`}
                        className={[
                          "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-semibold transition",
                          childIsActive ? "bg-brand-900/10 text-brand-900" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
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

              {hasChildren && collapsed ? (
                <div className="invisible absolute left-full top-0 z-50 min-w-[14rem] pl-2 opacity-0 transition duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  <div className="pointer-events-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-card">
                  <div className="mb-1 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                    {item.label}
                  </div>
                  <div className="space-y-1">
                    {item.children!.map((child) => {
                      const childIsActive = child.label === activeLabel;
                      return (
                        <div
                          key={`${item.label}-${child.label}-collapsed`}
                          className={[
                            "pointer-events-auto flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold transition",
                            childIsActive ? "bg-brand-900/10 text-brand-900" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
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
                  </div>
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
          onClick={() => void onSignOut()}
          className={[
            "flex w-full items-center rounded-lg py-3 text-left text-danger transition hover:bg-danger/5",
            collapsed ? "justify-center px-2" : "gap-3 px-4",
          ].join(" ")}
          title={collapsed ? "Sign Out" : undefined}
        >
          <Icon name="logout" />
          {collapsed ? <span className="sr-only">Sign Out</span> : <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
