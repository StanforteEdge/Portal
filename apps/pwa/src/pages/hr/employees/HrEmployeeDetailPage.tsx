import { Button, Chip, EmptyState, Icon, PageHeader, SectionCard } from "@/shared";
import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import { hrApi, useCachedQuery } from "@/shared/lib/core";
import { type EmployeeDetail } from "@stanforte/shared";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import EmployeeActionsTab from "@/pages/hr/employees/tabs/EmployeeActionsTab";
import EmployeeAttendanceTab from "@/pages/hr/employees/tabs/EmployeeAttendanceTab";
import { formatDate } from "@stanforte/shared";


function humanize(value: string) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'work', label: 'Work & Employment' },
  { key: 'orgs', label: 'Organizations & Teams' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'actions', label: 'Actions' },
] as const;

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">
        {value || "-"}
      </p>
    </div>
  );
}

function employeeFullName(employee: EmployeeDetail) {
  return `${employee.first_name || ""} ${employee.last_name || ""}`.trim() || employee.username || "Unknown Employee";
}

function employeeInitials(employee: EmployeeDetail) {
  const fullName = employeeFullName(employee);
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function employeeManagerName(employee: EmployeeDetail) {
  if (!employee.manager) return "-";
  const name = `${employee.manager.first_name || ""} ${employee.manager.last_name || ""}`.trim();
  return name || employee.manager.email || "-";
}

function EmployeeOverviewTab({ employee }: { employee: EmployeeDetail }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Personal Details</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <DetailField label="First Name" value={employee.first_name || "-"} />
          <DetailField label="Last Name" value={employee.last_name || "-"} />
          <DetailField label="Email" value={employee.email || "-"} />
          <DetailField label="Phone" value={employee.phone || "-"} />
          <DetailField label="Username" value={employee.username || "-"} />
          <DetailField label="Employee Code" value={employee.employee_code || "-"} />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Current Assignment</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <DetailField label="Job Title" value={employee.job_title || "-"} />
          <DetailField label="Primary Organization" value={employee.primary_organization?.name || "-"} />
          <DetailField label="Primary Team" value={employee.primary_team?.name || "-"} />
          <DetailField label="Status" value={humanize(employee.employment_status || "draft")} />
          <DetailField label="Employment Type" value={humanize(employee.employment_type || "-")} />
          <DetailField label="Work Mode" value={humanize(employee.work_mode || "-")} />
        </div>
      </div>
    </div>
  );
}

function EmployeeWorkEmploymentTab({ employee }: { employee: EmployeeDetail }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <DetailField label="Job Title" value={employee.job_title || "-"} />
        <DetailField label="Employment Type" value={humanize(employee.employment_type || "-")} />
        <DetailField label="Work Mode" value={humanize(employee.work_mode || "-")} />
        <DetailField label="Hire Date" value={formatDate(employee.hire_date)} />
        <DetailField label="Confirmation Date" value={formatDate(employee.confirmation_date)} />
        <DetailField label="Exit Date" value={formatDate(employee.exit_date)} />
        <DetailField label="Manager" value={employeeManagerName(employee)} />
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-slate-500">
          Job Description
        </p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
          {employee.job_description || "-"}
        </p>
      </div>
    </div>
  );
}

function EmployeeOrgsTeamsOverviewTab({ employee }: { employee: EmployeeDetail }) {
  const organizations = Array.isArray(employee.organizations) ? employee.organizations : [];
  const teams = Array.isArray(employee.teams) ? employee.teams : [];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">Organizations</h3>
        {organizations.length ? organizations.map((organization: any) => (
          <div
            key={String(organization.id || organization.organization_id || organization.name)}
            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
          >
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {organization.name || organization.organization?.name || "-"}
              </p>
              <p className="text-xs text-slate-500">
                {organization.code || organization.organization?.code || ""}
              </p>
            </div>
            {organization.is_primary ? (
              <Chip variant="success">Primary</Chip>
            ) : null}
          </div>
        )) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            No organization assignments.
          </div>
        )}
      </div>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">Teams</h3>
        {teams.length ? teams.map((team: any) => (
          <div
            key={String(team.id || team.team_id || team.name)}
            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
          >
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {team.name || team.team?.name || "-"}
              </p>
              <p className="text-xs text-slate-500">
                {humanize(team.role || "member")}
              </p>
            </div>
            {team.group_type ? (
              <Chip variant="neutral">{humanize(String(team.group_type))}</Chip>
            ) : null}
          </div>
        )) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            No team assignments.
          </div>
        )}
      </div>
    </div>
  );
}

export default function HrEmployeeDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: profile } = useCachedQuery(
    "hr:profile:detail",
    () => getWorkspaceProfile(),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const activeTab = (searchParams.get("tab") as any) || "overview";

  const { data, loading, error, refetch } = useCachedQuery(
    `hr:employee:${id}:${refreshKey}`,
    () => hrApi.getEmployee(id!),
    { ttlMs: 1000 * 30, storage: "memory" },
  );

  const employee = data as EmployeeDetail | undefined;

  useEffect(() => {
    if (error && !loading) {
      const statusText = String(error || "").toLowerCase();
      if (statusText.includes("404") || statusText.includes("not found")) {
        navigate("/hr/employees", { replace: true });
      }
    }
  }, [error, loading, navigate]);

  const userName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.email ||
    "HR Staff";

  if (loading) {
    return (
      <AppShell
        navigation={buildAppNavigation()}
        activeLabel="hr-employees"
        user={{ name: userName, role: profile?.employee_profile?.job_title || "HR Staff" }}
        mobileNav={buildAppMobileNav("Employees")}
      >
        <div className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">Loading employee...</div>
      </AppShell>
    );
  }

  if (error || !employee) {
    return (
      <AppShell
        navigation={buildAppNavigation()}
        activeLabel="hr-employees"
        user={{ name: userName, role: profile?.employee_profile?.job_title || "HR Staff" }}
        mobileNav={buildAppMobileNav("Employees")}
      >
        <EmptyState
          title="Employee not found"
          description="The employee you're looking for doesn't exist or has been removed."
        />
      </AppShell>
    );
  }

  function handleTabChange(tab: string) {
    setSearchParams({ tab });
  }

  function handleSaved() {
    void refetch();
    setRefreshKey(k => k + 1);
  }

  const statusTone =
    employee.employment_status === 'active' ? 'success' :
        employee.employment_status === 'draft' ? 'pending' :
            employee.employment_status === 'suspended' ? 'danger' :
                'neutral';

  return (
    <AppShell
      navigation={buildAppNavigation()}
      activeLabel="hr-employees"
      user={{
        name: userName,
        role: profile?.employee_profile?.job_title || "HR Staff",
      }}
      mobileNav={buildAppMobileNav("Employees")}
    >
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "HR", path: "/hr" },
          { label: "Employees", path: "/hr/employees" },
          { label: `${employee.first_name} ${employee.last_name}` },
        ]}
        title={`${employee.first_name} ${employee.last_name}`}
        description={employee.email}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => navigate(`/hr/employees/${id}/edit`)}
              className="gap-2"
            >
              <Icon name="edit" className="text-[18px]" />
              Edit Profile
            </Button>
            <Chip variant={statusTone}>
              {humanize(employee.employment_status || "draft")}
            </Chip>
          </div>
        }
      />

      <section className="mb-6 rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-900 text-xl font-semibold text-white">
                {employeeInitials(employee)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-slate-950">
                  {employeeFullName(employee)}
                </p>
                <p className="truncate text-xs text-slate-500">{employee.email || "-"}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-xs text-slate-600">
              <p><span className="font-semibold text-slate-900">Code:</span> {employee.employee_code || "-"}</p>
              <p><span className="font-semibold text-slate-900">Phone:</span> {employee.phone || "-"}</p>
              <p><span className="font-semibold text-slate-900">Manager:</span> {employeeManagerName(employee)}</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <DetailField label="Job Title" value={employee.job_title || "-"} />
            <DetailField label="Status" value={humanize(employee.employment_status || "draft")} />
            <DetailField label="Primary Organization" value={employee.primary_organization?.name || "-"} />
            <DetailField label="Primary Team" value={employee.primary_team?.name || "-"} />
            <DetailField label="Employment Type" value={humanize(employee.employment_type || "-")} />
            <DetailField label="Work Mode" value={humanize(employee.work_mode || "-")} />
            <DetailField label="Hire Date" value={formatDate(employee.hire_date)} />
            <DetailField label="Roles" value={Array.isArray(employee.roles) && employee.roles.length ? employee.roles.map((role) => humanize(String(role))).join(", ") : "-"} />
          </div>
        </div>
      </section>

      {/* Tab navigation */}
      <nav className="mb-6 flex items-center gap-3 border-b border-slate-200 pb-3 text-sm font-semibold text-slate-500">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleTabChange(tab.key)}
            className={[
              "rounded-full px-4 py-2 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10",
              activeTab === tab.key
                ? "bg-brand-900 text-white"
                : "bg-slate-100 text-slate-600 hover:text-slate-900",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab content */}
      <SectionCard
        title={tabs.find((t) => t.key === activeTab)?.label || "Profile"}
        description={
          activeTab === 'overview' ? "Read-only employee profile and assignment snapshot." :
            activeTab === 'work' ? "Employment records, dates, manager, and job details." :
            activeTab === 'attendance' ? "Individual attendance performance and history" :
              activeTab === 'orgs' ? "Organization and team memberships for this employee." :
                  "Status actions: activate, suspend, or exit"
        }
      >
        {activeTab === 'overview' && <EmployeeOverviewTab employee={employee} />}
        {activeTab === 'work' && <EmployeeWorkEmploymentTab employee={employee} />}
        {activeTab === 'attendance' && <EmployeeAttendanceTab employeeId={employee.id} />}
        {activeTab === 'orgs' && <EmployeeOrgsTeamsOverviewTab employee={employee} />}
        {activeTab === 'actions' && <EmployeeActionsTab employee={employee} onSaved={handleSaved} />}
      </SectionCard>
    </AppShell>
  );
}
