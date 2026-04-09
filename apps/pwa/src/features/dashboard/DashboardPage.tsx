import {
  Button,
  Chip,
  PageHeader,
  SectionCard,
  StatCard,
  humanize,
  userDisplayName,
} from "@stanforte/shared";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/features/auth/AuthProvider";
import { getMyAttendance } from "@/features/attendance/attendance-api";
import { buildAppMobileNav, buildRequestsNavigation } from "@/features/requests/requests-data";
import { listApprovals, listRequests } from "@/features/requests/requests-api";
import { formatDisplayDate, formatRequestStatus, requestStatusTone } from "@/features/requests/request-helpers";
import { getWorkspaceProfile } from "@/features/system/workspace-api";
import { useCachedQuery } from "@/lib/core";

function greeting(now = new Date()) {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatTodayLong(now = new Date()) {
  return now.toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: profile } = useCachedQuery("dashboard:profile", () => getWorkspaceProfile(), {
    ttlMs: 1000 * 60,
    storage: "memory",
  });
  const { data: requests, loading: loadingRequests } = useCachedQuery("dashboard:requests", () => listRequests(), {
    ttlMs: 1000 * 30,
    storage: "memory",
  });
  const { data: approvals } = useCachedQuery("dashboard:approvals", () => listApprovals(), {
    ttlMs: 1000 * 30,
    storage: "memory",
  });
  const { data: attendance } = useCachedQuery("dashboard:attendance", () => getMyAttendance(), {
    ttlMs: 1000 * 30,
    storage: "memory",
  });

  const myRequests = requests ?? [];
  const myApprovals = approvals ?? [];
  const pendingMine = myRequests.filter((item) =>
    ["draft", "sent", "approval", "submitted", "under_review", "review", "prepared"].includes(
      String(item.status || "").toLowerCase()
    )
  ).length;
  const completedMine = myRequests.filter((item) =>
    ["approved", "completed", "disbursed", "confirmed"].includes(String(item.status || "").toLowerCase())
  ).length;
  const pendingApprovals = myApprovals.filter((item) =>
    ["sent", "approval", "submitted", "under_review", "review", "prepared"].includes(
      String(item.status || "").toLowerCase()
    )
  ).length;
  const today = attendance?.today;
  const organization = profile?.organizations?.find((item) => item.is_primary) || profile?.organizations?.[0];
  const primaryTeam = profile?.teams?.[0];
  const recentRequests = myRequests.slice(0, 5);

  return (
    <AppShell
      navigation={buildRequestsNavigation()}
      activeLabel="Dashboard"
      user={{ name: userDisplayName(user), role: profile?.employee_profile?.job_title || "Staff" }}
      mobileNav={buildAppMobileNav("Dashboard")}
    >
      <div className="hidden lg:block">
        <PageHeader
          breadcrumbs={[{ label: "Dashboard" }]}
          title={`${greeting()}, ${profile?.first_name || userDisplayName(user)}`}
          description={`${formatTodayLong()} • ${organization?.name || "No primary organization"}${primaryTeam ? ` • ${primaryTeam.name}` : ""}`}
          actions={
            <Link to="/requests/new" className="inline-flex">
              <Button className="gap-2">
                <span className="material-symbols-outlined text-[18px]">add</span>
                New Request
              </Button>
            </Link>
          }
        />

        <div className="grid gap-6 xl:grid-cols-12">
          <div className="space-y-6 xl:col-span-8">
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard label="My Requests" value={String(myRequests.length)} tone="neutral" />
              <StatCard label="Pending" value={String(pendingMine)} tone="warning" />
              <StatCard label="Approvals" value={String(pendingApprovals)} tone="pending" />
              <StatCard label="Completed" value={String(completedMine)} tone="success" />
            </div>

            <SectionCard title="Recent Requests" action={<Link to="/requests" className="text-sm font-semibold text-brand-900">View all</Link>}>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead>
                    <tr className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-slate-400">
                      <th className="px-4 py-3">Request</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRequests.map((row) => (
                      <tr key={row.id} className="border-t border-slate-100">
                        <td className="px-4 py-4">
                          <Link to={`/requests/details?id=${row.id}`} className="font-semibold text-brand-900 hover:underline">
                            {row.request_number || row.id}
                          </Link>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700">{row.request_type?.name || "-"}</td>
                        <td className="px-4 py-4">
                          <Chip variant={requestStatusTone(row.status)}>{formatRequestStatus(row.status)}</Chip>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600">{formatDisplayDate(row.created_at)}</td>
                      </tr>
                    ))}
                    {!loadingRequests && recentRequests.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                          No requests yet.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>

          <div className="space-y-6 xl:col-span-4">
            <section className="section-card bg-brand-900 p-5 text-white">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-white/70">Today’s Attendance</p>
              <h3 className="mt-3 text-3xl font-semibold tracking-tight">
                {today ? humanize(today.status) : "Not started"}
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/85">
                {today
                  ? `${humanize(String(today.attendance_mode || today.expected_mode || "onsite"))} • First in ${today.first_in_at ? formatDisplayDate(today.first_in_at) : "—"}`
                  : "No attendance record yet today."}
              </p>
              <Link to="/attendance" className="mt-4 inline-flex">
                <Button variant="secondary">Open Attendance</Button>
              </Link>
            </section>

            <SectionCard title="Quick Actions">
              <div className="grid gap-3">
                <Link to="/requests/new" className="inline-flex">
                  <Button className="w-full justify-center">Create Request</Button>
                </Link>
                <Link to="/requests/approvals" className="inline-flex">
                  <Button variant="secondary" className="w-full justify-center">My Approvals</Button>
                </Link>
                <Link to="/profile" className="inline-flex">
                  <Button variant="secondary" className="w-full justify-center">Profile</Button>
                </Link>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>

      <div className="space-y-4 lg:hidden">
        <div className="pt-1">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-slate-500">Dashboard</p>
          <h1 className="page-title mt-2 text-[clamp(1.7rem,7vw,2.2rem)]">{greeting()}</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">{formatTodayLong()}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Requests" value={String(myRequests.length)} tone="neutral" />
          <StatCard label="Approvals" value={String(pendingApprovals)} tone="pending" />
          <StatCard label="Pending" value={String(pendingMine)} tone="warning" />
          <StatCard label="Completed" value={String(completedMine)} tone="success" />
        </div>

        <SectionCard title="Today’s Attendance">
          <p className="text-sm leading-6 text-slate-600">
            {today ? `${humanize(today.status)} • ${humanize(String(today.attendance_mode || today.expected_mode || "onsite"))}` : "No attendance record yet today."}
          </p>
          <Link to="/attendance" className="mt-4 inline-flex">
            <Button variant="secondary" className="w-full justify-center">Open Attendance</Button>
          </Link>
        </SectionCard>

        <SectionCard title="Quick Actions">
          <div className="grid gap-3">
            <Link to="/requests/new" className="inline-flex">
              <Button className="w-full justify-center">New Request</Button>
            </Link>
            <Link to="/requests" className="inline-flex">
              <Button variant="secondary" className="w-full justify-center">My Requests</Button>
            </Link>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
