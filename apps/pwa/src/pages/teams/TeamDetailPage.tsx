import { useState } from "react";
import { useParams } from "react-router-dom";
import { AppShell, PageHeader, SectionCard } from "@/shared";
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
  const groupName = team?.name || "Group";
  const groupType = String(team?.type || "other").toLowerCase();
  const role = String(team?.role || "member").toLowerCase();
  const canSeeAllRequests = ["lead", "moderator", "manager", "admin"].includes(role);
  const canWorkBudgets = groupType === "department" && canSeeAllRequests;
  const availableTabs = [
    "overview",
    "tasks",
    "members",
    "requests",
    ...(canWorkBudgets ? ["budgets"] : []),
    "projects",
  ];

  return (
    <AppShell
      navigation={buildAppNavigation()}
      activeLabel="workspace-groups"
      user={{ name: userName, role: profile?.employee_profile?.job_title || "Staff" }}
      mobileNav={buildAppMobileNav("Workspace")}
    >
      <PageHeader
        breadcrumbs={[
          { label: "Workspace" },
          { label: "Groups", path: "/teams" },
          { label: groupName },
        ]}
        title={groupName}
        description={team?.type ? `Type: ${team.type}` : "Group details"}
      />

      <div style={{ display: "flex", gap: "4px", borderBottom: "1px solid #e2e8f0", marginBottom: "16px" }}>
        {availableTabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={tabBtn(activeTab === tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <SectionCard title="Overview" description="Team information and quick stats.">
          <div style={{ padding: "12px 0", color: "#64748b", fontSize: "14px" }}>
            <p><strong>Name:</strong> {groupName}</p>
            <p><strong>Type:</strong> {team?.type || "Unspecified"}</p>
            <p><strong>Role:</strong> {team?.role || "Member"}</p>
            {(team as any)?.is_primary ? <p><strong>Primary Group</strong></p> : null}
          </div>
        </SectionCard>
      )}

      {activeTab === "tasks" && (
        <SectionCard title="Tasks" description="Shared tasks for this group will appear here.">
          <div style={{ textAlign: "center", padding: "24px", color: "#94a3b8", fontSize: "14px" }}>
            Group tasks workspace coming soon.
          </div>
        </SectionCard>
      )}

      {activeTab === "members" && (
        <SectionCard title="Members" description="Group members will appear here.">
          <div style={{ textAlign: "center", padding: "24px", color: "#94a3b8", fontSize: "14px" }}>
            Group member list coming soon.
          </div>
        </SectionCard>
      )}

      {activeTab === "requests" && (
        <SectionCard
          title="Requests"
          description={canSeeAllRequests ? "All requests for this group will appear here." : "Your requests for this group will appear here."}
        >
          <div style={{ textAlign: "center", padding: "24px", color: "#94a3b8", fontSize: "14px" }}>
            {canSeeAllRequests ? "Full group request queue coming soon." : "Your group-scoped requests will appear here."}
          </div>
        </SectionCard>
      )}

      {activeTab === "budgets" && (
        <SectionCard title="Budgets" description="Group-scoped budgets, revisions, and submissions.">
          <BudgetWorkspace context={{ scopeType: "team", scopeId: id, mode: "owner" }} layout="embedded" />
        </SectionCard>
      )}

      {activeTab === "projects" && (
        <SectionCard title="Projects" description="Projects related to this group will appear here.">
          <div style={{ textAlign: "center", padding: "24px", color: "#94a3b8", fontSize: "14px" }}>
            Linked projects workspace coming soon.
          </div>
        </SectionCard>
      )}
    </AppShell>
  );
}
