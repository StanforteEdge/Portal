import { Button, Chip, EmptyState, Icon, PageHeader, SectionCard } from "@/shared";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import { hrApi, useCachedQuery } from "@/shared/lib/core";
import { type EmployeeDetail } from "@stanforte/shared";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import EmployeeProfileTab from "@/modules/hr/employees/tabs/EmployeeProfileTab";
import EmployeeJobTab from "@/modules/hr/employees/tabs/EmployeeJobTab";
import EmployeeOrgsTeamsTab from "@/modules/hr/employees/tabs/EmployeeOrgsTeamsTab";
import EmployeeActionsTab from "@/modules/hr/employees/tabs/EmployeeActionsTab";
import EmployeeAttendanceTab from "@/modules/hr/employees/tabs/EmployeeAttendanceTab";


function humanize(value: string) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const tabs = [
  { key: 'profile', label: 'Profile' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'job', label: 'Job & Employment' },
  { key: 'orgs', label: 'Orgs & Teams' },
  { key: 'actions', label: 'Actions' },
] as const;

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

  const activeTab = (searchParams.get("tab") as any) || "profile";

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
          activeTab === 'profile' ? "Personal information and contact details" :
            activeTab === 'attendance' ? "Individual attendance performance and history" :
              activeTab === 'job' ? "Job details, employment type, and dates" :
                activeTab === 'orgs' ? "Organization and team assignments" :
                  "Status actions: activate, suspend, or exit"
        }
      >
        {activeTab === 'profile' && <EmployeeProfileTab employee={employee} onSaved={handleSaved} />}
        {activeTab === 'attendance' && <EmployeeAttendanceTab employeeId={employee.id} />}
        {activeTab === 'job' && <EmployeeJobTab employee={employee} onSaved={handleSaved} />}
        {activeTab === 'orgs' && <EmployeeOrgsTeamsTab employee={employee} onSaved={handleSaved} />}
        {activeTab === 'actions' && <EmployeeActionsTab employee={employee} onSaved={handleSaved} />}
      </SectionCard>
    </AppShell>
  );
}
