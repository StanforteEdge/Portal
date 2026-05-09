import { useState } from "react";
import {
  Button,
  Chip,
  Icon,
  SelectField,
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
import { useAuth } from "@/shared/context/AuthProvider";
import { useCachedQuery } from "@/shared/lib/core";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import { resourceApi } from "@/shared/lib/core";
import AdminProjectSlideOver from "./AdminProjectSlideOver";

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  organizationId: string | null;
  governance: {
    project_code?: string | null;
    owner_user_id?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    governance_status?: string | null;
  } | null;
};

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "planned", label: "Planned" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

export default function AdminProjectsPage() {
  const { user } = useAuth();

  const { data: profile } = useCachedQuery(
    "admin:profile",
    () => getWorkspaceProfile(),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [listKey, setListKey] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectRow | null>(null);

  const { data: projectsData, loading: projectsLoading, refetch: refetchProjects } = useCachedQuery(
    `admin:projects:${listKey}:${search}:${statusFilter}`,
    () => resourceApi.listProjects({
      search: search || undefined,
      active_only: statusFilter === "archived" ? false : undefined,
    }),
    { ttlMs: 0, storage: "memory" },
  );

  const projects: ProjectRow[] = Array.isArray((projectsData as any)?.data?.items) 
    ? (projectsData as any).data.items 
    : Array.isArray(projectsData) ? projectsData : [];
  const activeProjects = projects.filter((p) => p.isActive && p.governance?.governance_status !== "archived").length;
  const archivedProjects = projects.filter((p) => !p.isActive || p.governance?.governance_status === "archived").length;

  const userName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.email ||
    "Admin";

  const filteredProjects = projects.filter((p) => {
    if (statusFilter !== "all") {
      const projectStatus = p.governance?.governance_status || (p.isActive ? "active" : "archived");
      if (projectStatus !== statusFilter) return false;
    }
    if (search) {
      const s = search.toLowerCase();
      if (!p.name.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  return (
    <AppShell
      navigation={buildAppNavigation()}
      activeLabel="admin-projects"
      user={{
        name: userName,
        role: profile?.employee_profile?.job_title || "Admin",
      }}
      mobileNav={buildAppMobileNav("Dashboard")}
    >
      <PageHeader
        breadcrumbs={[{ label: "Administration", path: "/admin/users" }, { label: "Projects" }]}
        title="Projects"
        description="Manage project governance, timelines, and ownership."
      />

      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Total Projects" value={String(projects.length)} tone="neutral" />
          <StatCard label="Active" value={String(activeProjects)} tone="success" />
          <StatCard label="Archived" value={String(archivedProjects)} tone="neutral" />
        </div>

        {/* Filters */}
        <section className="section-card p-4 sm:p-5">
          <div className="flex flex-wrap items-start gap-3">
            <SelectField
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="min-w-[130px] flex-1 lg:flex-none"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </SelectField>
            <label className="grid gap-1.5 text-sm">
              <span className="font-semibold text-slate-700">Search</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects..."
                className="rounded-2xl border border-slate-200 bg-white px-4 py-[0.6rem] text-sm font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-brand-900/10"
              />
            </label>
            <div className="flex items-end">
              <Button variant="secondary" size="sm" onClick={() => void refetchProjects()}>
                <Icon name="refresh" className="text-[16px]" />
                Refresh
              </Button>
            </div>
          </div>
        </section>

        {/* Table */}
        <SectionCard
          title="All Projects"
          description="Manage project details and governance."
          action={
            <Button className="gap-2" onClick={() => setShowCreate(true)}>
              <Icon name="add" className="text-[18px]" />
              Add Project
            </Button>
          }
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
                    <TableHeaderCell>Name</TableHeaderCell>
                    <TableHeaderCell>Code</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Start Date</TableHeaderCell>
                    <TableHeaderCell>End Date</TableHeaderCell>
                    <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                  </TableHeaderRow>
                </TableHead>
                <TableBody>
                  {filteredProjects.map((project) => {
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
                        <TableCell>{project.governance?.start_date || "-"}</TableCell>
                        <TableCell>{project.governance?.end_date || "-"}</TableCell>
                        <TableCell className="rounded-r-2xl text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingProject(project)}
                          >
                            <Icon name="edit" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!filteredProjects.length ? (
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

      {/* SlideOvers */}
      {showCreate && (
        <AdminProjectSlideOver
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            setShowCreate(false);
            setListKey((k) => k + 1);
          }}
        />
      )}

      {editingProject && (
        <AdminProjectSlideOver
          project={{
            id: editingProject.id,
            name: editingProject.name,
            description: editingProject.description ?? undefined,
            projectCode: editingProject.governance?.project_code ?? undefined,
            organizationId: editingProject.organizationId ?? undefined,
            ownerId: editingProject.governance?.owner_user_id ?? undefined,
            status: editingProject.governance?.governance_status ?? (editingProject.isActive ? "active" : "archived"),
            startDate: editingProject.governance?.start_date ?? undefined,
            endDate: editingProject.governance?.end_date ?? undefined,
          }}
          onClose={() => setEditingProject(null)}
          onSaved={() => {
            setEditingProject(null);
            setListKey((k) => k + 1);
          }}
        />
      )}
    </AppShell>
  );
}
