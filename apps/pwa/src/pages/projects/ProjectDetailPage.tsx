import { useState } from "react";
import {
  Button,
  Chip,
  Icon,
  PageHeader,
  SectionCard,
  StatCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  useToast,
} from "@/shared";
import { formatCurrency, formatDate } from "@stanforte/shared";
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import { useCachedQuery } from "@/shared/lib/core";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import { resourceApi } from "@/shared/lib/core";
import { useParams } from "react-router";
import BudgetWorkspace from "@/features/budgets/BudgetWorkspace";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();

  const { data: profile } = useCachedQuery(
    "user:profile",
    () => getWorkspaceProfile(),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const { data: project, loading } = useCachedQuery(
    `project:detail:${id}`,
    () => id ? resourceApi.getProject(id) : Promise.resolve(null),
    { ttlMs: 1000 * 60 * 5, storage: "memory" },
  );

  const userName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.email ||
    "User";

  if (loading) {
    return (
      <AppShell
        navigation={buildAppNavigation()}
        activeLabel="projects"
        user={{ name: userName, role: profile?.employee_profile?.job_title || "Staff" }}
        mobileNav={buildAppMobileNav("Dashboard")}
      >
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Loading project...</p>
        </div>
      </AppShell>
    );
  }

  if (!project) {
    return (
      <AppShell
        navigation={buildAppNavigation()}
        activeLabel="projects"
        user={{ name: userName, role: profile?.employee_profile?.job_title || "Staff" }}
        mobileNav={buildAppMobileNav("Dashboard")}
      >
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-slate-500">Project not found.</p>
          <Button variant="secondary" onClick={() => window.location.href = "/projects"}>
            Back to Projects
          </Button>
        </div>
      </AppShell>
    );
  }

  const status = project.governance?.governance_status || (project.isActive ? "active" : "archived");

  return (
    <AppShell
      navigation={buildAppNavigation()}
      activeLabel="projects"
      user={{
        name: userName,
        role: profile?.employee_profile?.job_title || "Staff",
      }}
      mobileNav={buildAppMobileNav("Dashboard")}
    >
      <PageHeader
        breadcrumbs={[
          { label: "Projects", path: "/projects" },
          { label: project.name },
        ]}
        title={project.name}
        description={project.governance?.project_code || `Project ID: ${project.id}`}
      />

      <div className="space-y-6">
        {/* Status & Quick Info */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Status" value={status.replace("_", " ")} tone={status === "active" ? "success" : "neutral"} />
          <StatCard label="Start Date" value={formatDate(project.governance?.start_date) || "TBD"} tone="neutral" />
          <StatCard label="End Date" value={formatDate(project.governance?.end_date) || "TBD"} tone="neutral" />
          <StatCard label="Owner" value={project.governance?.owner_user_id ? "Assigned" : "Unassigned"} tone="neutral" />
        </div>

        {/* Description */}
        {project.description && (
          <SectionCard title="Description">
            <p className="text-slate-600">{project.description}</p>
          </SectionCard>
        )}

        {/* Budget Workspace */}
        <SectionCard title="Budgets" description="Project-scoped budgets, revisions, and submissions.">
          <BudgetWorkspace context={{ scopeType: "project", scopeId: id, mode: "owner" }} layout="embedded" />
        </SectionCard>

        {/* Team Members - Placeholder */}
        <SectionCard
          title="Team Members"
          description="Project team and responsibilities"
        >
          <div className="text-slate-500 text-sm py-4 text-center">
            Team members will appear here once the project team is configured.
          </div>
        </SectionCard>

        {/* Activity - Placeholder */}
        <SectionCard
          title="Recent Activity"
          description="Latest project updates"
        >
          <div className="text-slate-500 text-sm py-4 text-center">
            No recent activity recorded.
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
