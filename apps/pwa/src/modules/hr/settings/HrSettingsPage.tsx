import { useState } from "react";
import { AppShell, PageHeader, SectionCard, Button } from "@/shared";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import { useAuth } from "@/shared/context/AuthProvider";
import { useCachedQuery } from "@/shared/lib/core";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import AttendanceSettingsTab from "./AttendanceSettingsTab";
import LeaveSettingsTab from "./LeaveSettingsTab";
import OfficeLocationsTab from "./OfficeLocationsTab";

export default function HrSettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"attendance" | "leave" | "locations">("attendance");

  const { data: profile } = useCachedQuery(
    "hr:profile",
    () => getWorkspaceProfile(),
    { ttlMs: 1000 * 60, storage: "memory" }
  );

  const navItems = [
    { id: "attendance", label: "Attendance", icon: "schedule" },
    { id: "leave", label: "Leave Management", icon: "beach_access" },
    { id: "locations", label: "Office Locations", icon: "location_on" },
  ];

  const userName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.email || "HR Admin";

  return (
    <AppShell
      navigation={buildAppNavigation()}
      activeLabel="hr-settings"
      user={{
        name: userName,
        role: profile?.employee_profile?.job_title || "HR Administrator",
      }}
      mobileNav={buildAppMobileNav("HR")}
    >
      <PageHeader
        breadcrumbs={[{ label: "HR", path: "/hr" }, { label: "Settings" }]}
        title="HR Settings"
        description="Manage organization-wide attendance rules, leave entitlements, and office geofences."
      />

      <div className="flex flex-col md:flex-row gap-8 mt-6">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 flex flex-col gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === item.id
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          <SectionCard title={navItems.find(i => i.id === activeTab)?.label || "Settings"}>
            {activeTab === "attendance" && <AttendanceSettingsTab />}
            {activeTab === "leave" && <LeaveSettingsTab />}
            {activeTab === "locations" && <OfficeLocationsTab />}
          </SectionCard>
        </main>
      </div>
    </AppShell>
  );
}
