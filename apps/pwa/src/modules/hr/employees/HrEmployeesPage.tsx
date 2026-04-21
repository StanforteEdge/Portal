import {
  Button,
  Chip,
  EmptyState,
  Icon,
  PaginationControls,
  PageHeader,
  SectionCard,
  SelectField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
} from "@/shared";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import { hrApi, resourceApi, useCachedQuery } from "@/shared/lib/core";
import { type EmployeeSummary } from "@stanforte/shared";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import type { OrganizationItem } from "@/shared";


function humanize(value: string) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

import { formatDate } from "@stanforte/shared";

export default function HrEmployeesPage() {
  const { user } = useAuth();
  const { data: profile } = useCachedQuery(
    "hr:profile:directory",
    () => getWorkspaceProfile(),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const { data: orgsData } = useCachedQuery(
    "hr:organizations",
    () => resourceApi.listOrganizations(),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const organizations: OrganizationItem[] = Array.isArray(orgsData) ? orgsData : [];
  const orgMap = new Map(organizations.map(o => [o.id, o]));

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [orgFilter, setOrgFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [refreshKey, setRefreshKey] = useState(0);

  const params = useMemo(() => {
    const p: Record<string, unknown> = { page: currentPage, per_page: perPage };
    if (search.trim()) p.search = search.trim();
    if (status) p.status = status;
    if (employmentType) p.employment_type = employmentType;
    if (orgFilter) p.organization_id = orgFilter;
    return p;
  }, [search, status, employmentType, orgFilter, currentPage, perPage, refreshKey]);

  const { data, loading, error, refetch } = useCachedQuery(
    `hr:employees:${JSON.stringify(params)}:${refreshKey}`,
    () => hrApi.listEmployees(params),
    { ttlMs: 1000 * 30, storage: "memory" },
  );

  const employees = (data as any)?.data ?? [];
  const meta = (data as any)?.meta ?? { page: 1, per_page: 10, total: 0, last_page: 1 };

  useEffect(() => {
    setCurrentPage(1);
  }, [search, status, employmentType, orgFilter]);

  const userName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.email ||
    "HR Staff";

  const totalPages = Math.max(1, meta.last_page || 1);
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = meta.total === 0 ? 0 : (safePage - 1) * perPage + 1;
  const pageEnd = meta.total === 0 ? 0 : Math.min(meta.total, safePage * perPage);

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
        breadcrumbs={[{ label: "Dashboard", path: "/" }, { label: "HR" }, { label: "Employees" }]}
        title="Employee Directory"
        description="Browse, search, and manage all employees."
        actions={
          <Link to="/hr/employees/new" className="inline-flex">
            <button className="inline-flex items-center gap-2 rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
              <Icon name="add" className="text-[18px]" />
              Add Employee
            </button>
          </Link>
        }
      />

      {/* Filter bar */}
      <section className="section-card p-4 sm:p-5 mb-6" aria-label="Employee filters">
        <div className="flex flex-wrap items-start gap-3">
          <label className="grid gap-1.5 text-sm flex-1 min-w-[200px]">
            <span className="font-semibold text-slate-700">Search</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name or email"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-[0.6rem] text-sm font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-brand-900/10"
            />
          </label>

          <SelectField
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="min-w-[130px] flex-1 lg:flex-none"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="suspended">Suspended</option>
            <option value="exited">Exited</option>
          </SelectField>

          <SelectField
            label="Employment Type"
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
            className="min-w-[140px] flex-1 lg:flex-none"
          >
            <option value="">All types</option>
            <option value="full_time">Full-time</option>
            <option value="contract">Contract</option>
            <option value="intern">Intern</option>
            <option value="consultant">Consultant</option>
          </SelectField>

          <SelectField
            label="Organization"
            value={orgFilter}
            onChange={(e) => setOrgFilter(e.target.value)}
            className="min-w-[160px] flex-1 lg:flex-none"
          >
            <option value="">All organizations</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </SelectField>
        </div>
      </section>

      {/* Table */}
      <SectionCard
        title="Employees"
        description={`${meta.total} employee${meta.total === 1 ? "" : "s"} total`}
        action={
          <div className="flex items-center gap-2">
            <Chip variant="neutral">
              Showing {pageStart}-{pageEnd} of {meta.total}
            </Chip>
            <Button variant="ghost" size="sm" onClick={() => setRefreshKey(k => k + 1)}>
              <Icon name="refresh" className="text-[18px]" />
            </Button>
          </div>
        }
      >
        {loading ? (
          <div className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">
            Loading employees...
          </div>
        ) : error ? (
          <div className="mb-4 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-4 text-sm text-danger">
            {error}
            <button type="button" onClick={() => void refetch()} className="ml-3 font-semibold underline">
              Retry
            </button>
          </div>
        ) : employees.length === 0 ? (
          <EmptyState
            title="No employees found"
            description="Try adjusting your filters or add a new employee."
          />
        ) : (
          <>
            <div className="overflow-x-auto rounded-[22px] border border-slate-200 bg-white">
              <Table caption="Employee directory">
                <TableHead>
                  <TableHeaderRow>
                    <TableHeaderCell>Name</TableHeaderCell>
                    <TableHeaderCell>Employee Code</TableHeaderCell>
                    <TableHeaderCell>Job Title</TableHeaderCell>
                    <TableHeaderCell>Organization</TableHeaderCell>
                    <TableHeaderCell>Type</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Hire Date</TableHeaderCell>
                    <TableHeaderCell>Actions</TableHeaderCell>
                  </TableHeaderRow>
                </TableHead>
                <TableBody>
                  {employees.map((employee: EmployeeSummary) => {
                    const org = employee.primary_organization ? orgMap.get(employee.primary_organization.id) : null;
                    return (
                      <TableRow key={employee.id}>
                        <TableCell className="rounded-l-2xl">
                          <Link
                            to={`/hr/employees/${employee.id}`}
                            className="text-sm font-semibold text-brand-900 transition hover:underline"
                          >
                            {employee.first_name} {employee.last_name}
                          </Link>
                          <div className="mt-1 text-xs text-slate-500">
                            {employee.email}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-700">
                          {employee.employee_code || "-"}
                        </TableCell>
                        <TableCell className="text-sm text-slate-700">
                          {employee.job_title || "-"}
                        </TableCell>
                        <TableCell className="text-sm text-slate-700">
                          {org ? org.name : (employee.primary_organization?.name || "-")}
                        </TableCell>
                        <TableCell>
                          <Chip variant="neutral">{humanize(employee.employment_type || "draft")}</Chip>
                        </TableCell>
                        <TableCell>
                          <Chip variant={
                            employee.employment_status === 'active' ? 'success' :
                                employee.employment_status === 'draft' ? 'pending' :
                                    employee.employment_status === 'suspended' ? 'danger' :
                                        employee.employment_status === 'exited' ? 'neutral' :
                                            'neutral'
                          }>
                            {humanize(employee.employment_status || "draft")}
                          </Chip>
                        </TableCell>
                        <TableCell className="text-sm text-slate-700">
                          {formatDate(employee.hire_date ?? undefined)}
                        </TableCell>
                        <TableCell className="rounded-r-2xl">
                          <Link to={`/hr/employees/${employee.id}`}>
                            <Icon name="open_in_new" className="text-[18px] text-brand-900" />
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <SelectField
                label=""
                value={String(perPage)}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className="w-[110px]"
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </SelectField>
              <PaginationControls
                page={safePage}
                totalPages={totalPages}
                totalCount={meta.total}
                itemLabel="employee"
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        )}
      </SectionCard>
    </AppShell>
  );
}
