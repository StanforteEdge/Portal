import { NavLink } from "react-router-dom";
import { Icon } from "../ui/Icon";

export type MobileNavItem = {
  label: string;
  icon: string;
  active?: boolean;
  path?: string;
  onClick?: () => void;
};

type MobileBottomNavProps = {
  items: MobileNavItem[];
};

export function MobileBottomNav({ items }: MobileBottomNavProps) {
  return (
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
            <NavLink key={item.label} to={item.path} className={classes} aria-label={item.label}>
              {content}
            </NavLink>
          );
        }

        return (
          <button
            key={item.label}
            type="button"
            onClick={item.onClick}
            className={classes}
            aria-label={item.label}
          >
            {content}
          </button>
        );
      })}
    </nav>
  );
}
