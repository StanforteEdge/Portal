import { useState } from "react";
import { AppShell, PageHeader, SectionCard, SidebarTabs } from "@/shared";
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

      <SidebarTabs items={navItems} activeTab={activeTab} onTabChange={(id) => setActiveTab(id as typeof activeTab)}>
        <SectionCard title={navItems.find((i) => i.id === activeTab)?.label || "Settings"}>
          {activeTab === "attendance" && <AttendanceSettingsTab />}
          {activeTab === "leave" && <LeaveSettingsTab />}
          {activeTab === "locations" && <OfficeLocationsTab />}
        </SectionCard>
      </SidebarTabs>
    </AppShell>
  );
}
