import type { ReactNode } from "react";

type NavItem = {
  id: string;
  label: string;
  icon: string;
};

type SidebarTabsProps = {
  items: NavItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  children?: ReactNode;
};

export function SidebarTabs({ items, activeTab, onTabChange, children }: SidebarTabsProps) {
  return (
    <div className="flex flex-col md:flex-row gap-8">
      <aside className="w-full md:w-56 flex flex-col gap-1 shrink-0">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${
              activeTab === item.id
                ? "bg-brand-900 text-white shadow-lg shadow-brand-900/20"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </aside>

      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
