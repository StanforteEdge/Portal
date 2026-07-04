import { useState } from "react";
import { useParams } from "react-router-dom";
import { AppShell, PageHeader, SectionCard, Button } from "@/shared";
import { useAuth } from "@/shared/context/AuthProvider";
import { useCachedQuery } from "@/shared/lib/core";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import BudgetWorkspace from "@/features/budgets/BudgetWorkspace";

const tabBtn = (active: boolean): React.CSSProperties => ({
  padding: "8px 16px",
  fontSize: "13px",
  fontWeight: 600,
  border: "none",
  background: "none",
  cursor: "pointer",
  borderBottom: active ? "2px solid #2563eb" : "2px solid transparent",
  color: active ? "#2563eb" : "#64748b",
});

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const userName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.email ||
    "Staff";

  const [activeTab, setActiveTab] = useState("overview");

  const { data: profile } = useCachedQuery(
    "user:profile",
    () => getWorkspaceProfile(),
    { ttlMs: 60_000, storage: "memory" },
  );

  const allTeams = profile?.teams ?? profile?.groups ?? [];
  const team = allTeams.find((t: any) => t.id === id);
  const teamName = team?.name || "Team";

  return (
    <AppShell
      navigation={buildAppNavigation()}
      activeLabel="teams"
      user={{ name: userName, role: profile?.employee_profile?.job_title || "Staff" }}
      mobileNav={buildAppMobileNav("Dashboard")}
    >
      <PageHeader
        breadcrumbs={[
          { label: "Teams", path: "/teams" },
          { label: teamName },
        ]}
        title={teamName}
        description={team?.type ? `Type: ${team.type}` : "Team details"}
      />

      <div style={{ display: "flex", gap: "4px", borderBottom: "1px solid #e2e8f0", marginBottom: "16px" }}>
        {["overview", "members", "budgets"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={tabBtn(activeTab === tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <SectionCard title="Overview" description="Team information and quick stats.">
          <div style={{ padding: "12px 0", color: "#64748b", fontSize: "14px" }}>
            <p><strong>Name:</strong> {teamName}</p>
            <p><strong>Type:</strong> {team?.type || "Unspecified"}</p>
          <p><strong>Role:</strong> {team?.role || "Member"}</p>
          {(team as any)?.is_primary ? <p><strong>Primary Team</strong></p> : null}
          </div>
        </SectionCard>
      )}

      {activeTab === "members" && (
        <SectionCard title="Members" description="Team members will appear here.">
          <div style={{ textAlign: "center", padding: "24px", color: "#94a3b8", fontSize: "14px" }}>
            Team member list coming soon.
          </div>
        </SectionCard>
      )}

      {activeTab === "budgets" && (
        <SectionCard title="Budgets" description="Team-scoped budgets, revisions, and submissions.">
          <BudgetWorkspace context={{ scopeType: "team", scopeId: id, mode: "owner" }} layout="embedded" />
        </SectionCard>
      )}
    </AppShell>
  );
}
