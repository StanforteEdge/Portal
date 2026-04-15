import {
    Chip,
    EmptyState,
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
import { Link } from "react-router-dom";
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import { hrApi, useCachedQuery } from "@/shared/lib/core";
import { type HrSummary, type EmployeeSummary } from "@stanforte/shared";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";

function humanize(value: string) {
    return String(value || "")
        .replaceAll("_", " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

import { formatDate } from "@/shared/lib/format-utils";

export default function HrDashboardPage() {
    const { user } = useAuth();
    const { data: profile } = useCachedQuery(
        "hr:profile",
        () => getWorkspaceProfile(),
        { ttlMs: 1000 * 60, storage: "memory" },
    );

    const { data: summaryData, loading, error } = useCachedQuery(
        "hr:summary",
        () => hrApi.getSummary(),
        { ttlMs: 1000 * 30, storage: "memory" },
    );

    const summary = summaryData as HrSummary | undefined;
    const recentHires = summary?.recent_hires ?? [];

    const userName =
        `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
        user?.email ||
        "HR Staff";

    return (
        <AppShell
            navigation={buildAppNavigation()}
            activeLabel="hr-dashboard"
            user={{
                name: userName,
                role: profile?.employee_profile?.job_title || "HR Staff",
            }}
            mobileNav={buildAppMobileNav("HR")}
        >
            <PageHeader
                breadcrumbs={[{ label: "Dashboard", path: "/" }, { label: "HR" }]}
                title="HR Overview"
                description="Monitor headcount stats and manage employee records."
                actions={
                    <Link to="/hr/employees/new" className="inline-flex">
                        <button className="inline-flex items-center gap-2 rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
                            <Icon name="add" className="text-[18px]" />
                            Add Employee
                        </button>
                    </Link>
                }
            />

            <div className="grid gap-6">
                {/* Stat cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <StatCard label="Total Employees" value={String(summary?.total ?? 0)} tone="neutral" icon="group" />
                    <StatCard label="Active" value={String(summary?.active ?? 0)} tone="success" icon="check_circle" />
                    <StatCard label="Draft" value={String(summary?.draft ?? 0)} tone="pending" icon="edit_note" />
                    <StatCard label="Suspended/Exited" value={String((summary?.suspended ?? 0) + (summary?.exited ?? 0))} tone="danger" icon="block" />
                </div>

                {/* Employment type breakdown */}
                <div className="grid gap-4 md:grid-cols-4">
                    {(['full_time', 'contract', 'intern', 'consultant'] as const).map((type) => (
                        <StatCard
                            key={type}
                            label={humanize(type)}
                            value={String(summary?.by_employment_type?.[type] ?? 0)}
                            tone="neutral"
                            icon="badge"
                        />
                    ))}
                </div>

                {/* Recent Hires */}
                <SectionCard
                    title="Recent Hires"
                    description="Latest employees added to the organization."
                    action={
                        <Link
                            to="/hr/employees"
                            className="text-sm font-semibold text-brand-900 transition hover:underline"
                        >
                            View all
                        </Link>
                    }
                >
                    {loading ? (
                        <div className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">
                            Loading HR summary...
                        </div>
                    ) : error ? (
                        <div className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-4 text-sm text-danger">
                            {error}
                        </div>
                    ) : recentHires.length ? (
                        <div className="rounded-[22px] border border-slate-200 bg-white">
                            <Table caption="Recent hires">
                                <TableHead>
                                    <TableHeaderRow>
                                        <TableHeaderCell>Name</TableHeaderCell>
                                        <TableHeaderCell>Job Title</TableHeaderCell>
                                        <TableHeaderCell>Hire Date</TableHeaderCell>
                                        <TableHeaderCell>Status</TableHeaderCell>
                                    </TableHeaderRow>
                                </TableHead>
                                <TableBody>
                                    {recentHires.map((employee: EmployeeSummary) => (
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
                                                {employee.job_title || "-"}
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-700">
                                                {formatDate(employee.hire_date ?? undefined)}
                                            </TableCell>
                                            <TableCell className="rounded-r-2xl">
                                                <Chip variant={
                                                    employee.employment_status === 'active' ? 'success' :
                                                        employee.employment_status === 'draft' ? 'pending' :
                                                            employee.employment_status === 'suspended' ? 'danger' :
                                                                'neutral'
                                                }>
                                                    {humanize(employee.employment_status || "draft")}
                                                </Chip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <EmptyState
                            title="No recent hires"
                            description="Newly added employees will appear here."
                        />
                    )}
                </SectionCard>
            </div>
        </AppShell>
    );
}
