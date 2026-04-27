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
  TableRow,
} from "@/shared";
import { AppShell } from "@/shared/components/layout/AppShell";
import { formatDate } from "@/shared/lib/formatting";
import { useAuth } from "@/shared/context/AuthProvider";
import { useCachedQuery } from "@/shared/lib/core";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import { resourceApi } from "@/shared/lib/core";

export default function ProjectsPage() {
  const { user } = useAuth();

  const { data: profile } = useCachedQuery(
    "user:profile",
    () => getWorkspaceProfile(),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const [listKey, setListKey] = useState(0);

  const { data: projectsData, loading: projectsLoading, refetch: refetchProjects } = useCachedQuery(
    `user:projects:${listKey}`,
    () => resourceApi.listProjects({ active_only: true }),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const projects = Array.isArray(projectsData) ? projectsData : [];
  const userName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.email ||
    "User";

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
        breadcrumbs={[{ label: "Projects" }]}
        title="My Projects"
        description="View and manage your project assignments."
      />

      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Active Projects"
            value={String(projects.length)}
            tone="neutral"
          />
          <StatCard
            label="As Owner"
            value="0"
            tone="success"
          />
          <StatCard
            label="As Member"
            value="0"
            tone="neutral"
          />
        </div>

        {/* Projects List */}
        <SectionCard
          title="All Projects"
          description="Projects you are assigned to or own."
        >
          {projectsLoading ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">
              Loading projects...
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[22px] border border-slate-200 bg-white">
              <Table>
                <TableHead>
                  <TableHeaderRow>
                    <TableHeaderCell>Project</TableHeaderCell>
                    <TableHeaderCell>Code</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Start Date</TableHeaderCell>
                    <TableHeaderCell>End Date</TableHeaderCell>
                    <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                  </TableHeaderRow>
                </TableHead>
                <TableBody>
                  {projects.map((project: any) => {
                    const status = project.governance?.governance_status || (project.isActive ? "active" : "archived");
                    return (
                      <TableRow key={project.id}>
                        <TableCell className="rounded-l-2xl font-semibold text-slate-900">
                          {project.name}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                            {project.governance?.project_code || "-"}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Chip variant={status === "active" ? "success" : status === "archived" ? "neutral" : "warning"}>
                            {status.replace("_", " ")}
                          </Chip>
                        </TableCell>
                        <TableCell>{formatDate(project.governance?.start_date) || "-"}</TableCell>
                        <TableCell>{formatDate(project.governance?.end_date) || "-"}</TableCell>
                        <TableCell className="rounded-r-2xl text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              window.location.href = `/projects/${project.id}`;
                            }}
                          >
                            <Icon name="visibility" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!projects.length ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center">
                        <p className="text-slate-500">No projects found.</p>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
