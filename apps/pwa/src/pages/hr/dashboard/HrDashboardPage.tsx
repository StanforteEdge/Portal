import {
    Button,
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
import { hrApi, attendanceApi, useCachedQuery } from "@/shared/lib/core";
import { type HrSummary, type EmployeeSummary } from "@stanforte/shared";
import { type AttendanceTodayStats } from "@stanforte/shared/src/api/attendance-api";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import { listHrLeaveRequests } from "../leave/hr-leave-api";

function humanize(value: string) {
    return String(value || "")
        .replaceAll("_", " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

import { formatDate } from "@stanforte/shared";

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

    const today = new Date().toISOString().slice(0, 10);
    const { data: attendanceStats } = useCachedQuery(
        `hr:attendance:stats:${today}`,
        () => attendanceApi.getStats(today),
        { ttlMs: 1000 * 60, storage: "memory" },
    );

    const { data: pendingLeave } = useCachedQuery(
        "hr:leave:pending",
        () => listHrLeaveRequests({ status: "pending" }),
        { ttlMs: 1000 * 60, storage: "memory" },
    );

    const stats = attendanceStats as AttendanceTodayStats | undefined;
    const summary = summaryData as HrSummary | undefined;
    const recentHires = summary?.recent_hires ?? [];
    const pendingLeaveCount = Array.isArray(pendingLeave) ? pendingLeave.length : 0;

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
                description="Monitor headcount, attendance, and leave across the organisation."
            />

            <div className="grid gap-6">
                {/* Stat cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <StatCard label="Total Employees" value={String(summary?.total ?? 0)} tone="neutral" icon="group" />
                    <StatCard label="Active" value={String(summary?.active ?? 0)} tone="success" icon="check_circle" />
                    <StatCard label="Draft" value={String(summary?.draft ?? 0)} tone="pending" icon="edit_note" />
                    <StatCard label="Suspended/Exited" value={String((summary?.suspended ?? 0) + (summary?.exited ?? 0))} tone="danger" icon="block" />
                </div>

                {/* Quick Actions */}
                <SectionCard title="Quick Actions">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <Link to="/hr/employees/new" className="block">
                            <Button variant="secondary" className="w-full justify-start gap-2">
                                <Icon name="person_add" />
                                Add Employee
                            </Button>
                        </Link>
                        <Link to="/hr/attendance" className="block">
                            <Button variant="secondary" className="w-full justify-start gap-2">
                                <Icon name="login" />
                                View Attendance
                            </Button>
                        </Link>
                        <Link to="/hr/corrections" className="block">
                            <Button variant="secondary" className="w-full justify-start gap-2">
                                <Icon name="rate_review" />
                                Review Corrections
                            </Button>
                        </Link>
                        <Link to="/hr/employees" className="block">
                            <Button variant="secondary" className="w-full justify-start gap-2">
                                <Icon name="group" />
                                Manage Employees
                            </Button>
                        </Link>
                    </div>
                </SectionCard>

                {/* Cross-domain stats: attendance + leave */}
                <div className="grid gap-4 md:grid-cols-4">
                    <StatCard label="Clocked In Today" value={String(stats?.clocked_in ?? 0)} tone="success" icon="login" />
                    <StatCard label="Late Today" value={String(stats?.late ?? 0)} tone="warning" icon="schedule" />
                    <StatCard label="Absent Today" value={String(stats?.absent ?? 0)} tone="danger" icon="person_off" />
                    <StatCard label="Pending Leave" value={String(pendingLeaveCount)} tone="pending" icon="event_available" />
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
