import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import Table from "@/components/Base/Table";
import Lucide from "@/components/Base/Lucide";
import { listRequests, listApprovals, type RequestRecord } from "@/services/requests";
import { getFinanceSummary, type FinanceSummary } from "@/services/finance";
import { listUsers } from "@/services/users";
import { listRbacRoles } from "@/services/rbac";
import { formatDisplayDate, formatMoney } from "@/utils/formatting";
import { useAppSelector } from "@/stores/hooks";

function statusLabel(status: string) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function StatCard({
  label,
  value,
  icon,
  iconClass,
}: {
  label: string;
  value: string | number;
  icon: string;
  iconClass: string;
}) {
  return (
    <div className="col-span-12 md:col-span-3 intro-y">
      <div className="relative zoom-in before:box before:absolute before:inset-x-3 before:mt-3 before:h-full before:bg-slate-50 before:content-['']">
        <div className="p-5 box">
          <div className="flex">
            <Lucide icon={icon as any} className={`w-[28px] h-[28px] ${iconClass}`} />
          </div>
          <div className="mt-4 text-slate-500 text-sm">{label}</div>
          <div className="text-2xl font-semibold mt-1">{value}</div>
        </div>
      </div>
    </div>
  );
}

function PortalDashboardPage() {
  const auth = useAppSelector((state) => state.auth);
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [approvals, setApprovals] = useState<RequestRecord[]>([]);
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary | null>(null);
  const [adminSummary, setAdminSummary] = useState<{ users: number; roles: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  const roles = (auth.user?.roles ?? []).map((role) => String(role).toLowerCase());
  const canSeeAdmin = roles.some((role) => ["admin", "super-admin"].includes(role));
  const canSeeFinance = roles.some((role) =>
    ["accountant", "finance_manager", "finance-manager", "admin", "super-admin"].includes(role)
  );
  const canApprove = roles.some((role) => ["team_lead", "coo", "ed", "admin", "super-admin"].includes(role));

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [requestRows, approvalRows, summary, usersData, rolesData] = await Promise.all([
          listRequests({ per_page: 50 }).catch(() => []),
          listApprovals({ per_page: 50 }).catch(() => []),
          canSeeFinance ? getFinanceSummary().catch(() => null) : Promise.resolve(null),
          canSeeAdmin ? listUsers({ page: 1, per_page: 1 }).catch(() => null) : Promise.resolve(null),
          canSeeAdmin ? listRbacRoles(true).catch(() => null) : Promise.resolve(null),
        ]);
        setRequests(requestRows);
        setApprovals(approvalRows);
        setFinanceSummary(summary);
        setAdminSummary(
          canSeeAdmin
            ? {
                users: Number(usersData?.meta?.total ?? 0),
                roles: Array.isArray(rolesData) ? rolesData.length : 0,
              }
            : null
        );
      } catch (error: any) {
        setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load dashboard data." });
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [canSeeAdmin, canSeeFinance]);

  const requestStats = useMemo(() => {
    const pendingMine = requests.filter((item) => ["draft", "sent", "approval", "cleared", "disbursed", "confirmed", "retired"].includes(item.status)).length;
    const completedMine = requests.filter((item) => item.status === "completed").length;
    return {
      total: requests.length,
      pendingMine,
      completedMine,
      draftMine: requests.filter((item) => item.status === "draft").length,
      pendingApprovals: approvals.filter((item) => item.approval_view_status === "pending").length,
      approvedByMe: approvals.filter((item) => item.approval_view_status === "approved").length,
    };
  }, [requests, approvals]);

  const recentRequests = useMemo(() => requests.slice(0, 6), [requests]);

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Dashboard</h2>
      </div>
      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="grid grid-cols-12 gap-5 mt-5">
        <StatCard label="My Requests" value={loading ? "..." : requestStats.total} icon="FileText" iconClass="text-primary" />
        <StatCard label="Drafts" value={loading ? "..." : requestStats.draftMine} icon="FilePenLine" iconClass="text-slate-500" />
        <StatCard label="Pending (My Queue)" value={loading ? "..." : requestStats.pendingMine} icon="Clock3" iconClass="text-warning" />
        {canApprove ? (
          <StatCard label="Awaiting My Approval" value={loading ? "..." : requestStats.pendingApprovals} icon="CheckCheck" iconClass="text-pending" />
        ) : (
          <StatCard label="Approved By Me" value={loading ? "..." : requestStats.approvedByMe} icon="BadgeCheck" iconClass="text-pending" />
        )}
        <StatCard label="Completed" value={loading ? "..." : requestStats.completedMine} icon="BadgeCheck" iconClass="text-success" />
      </div>

      {canSeeFinance ? (
        <div className="grid grid-cols-12 gap-5 mt-5">
          <div className="col-span-12 md:col-span-4 intro-y">
            <div className="relative zoom-in before:box before:absolute before:inset-x-3 before:mt-3 before:h-full before:bg-slate-50 before:content-['']">
              <div className="p-5 box">
                <Lucide icon="Wallet" className="w-[28px] h-[28px] text-primary" />
                <div className="mt-4 text-slate-500 text-sm">Finance Total Requests</div>
                <div className="text-2xl font-semibold mt-1">{financeSummary?.total_requests ?? 0}</div>
              </div>
            </div>
          </div>
          <div className="col-span-12 md:col-span-4 intro-y">
            <div className="relative zoom-in before:box before:absolute before:inset-x-3 before:mt-3 before:h-full before:bg-slate-50 before:content-['']">
              <div className="p-5 box">
                <Lucide icon="CircleDollarSign" className="w-[28px] h-[28px] text-success" />
                <div className="mt-4 text-slate-500 text-sm">Finance Total Amount</div>
                <div className="text-2xl font-semibold mt-1">{formatMoney(Number(financeSummary?.total_amount ?? 0), "NGN")}</div>
              </div>
            </div>
          </div>
          <div className="col-span-12 md:col-span-4 intro-y">
            <div className="relative zoom-in before:box before:absolute before:inset-x-3 before:mt-3 before:h-full before:bg-slate-50 before:content-['']">
              <div className="p-5 box">
                <Lucide icon="TrendingUp" className="w-[28px] h-[28px] text-warning" />
                <div className="mt-4 text-slate-500 text-sm">Finance Average Amount</div>
                <div className="text-2xl font-semibold mt-1">{formatMoney(Number(financeSummary?.average_amount ?? 0), "NGN")}</div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {canSeeAdmin ? (
        <div className="grid grid-cols-12 gap-5 mt-5">
          <div className="col-span-12 md:col-span-6 intro-y">
            <div className="relative zoom-in before:box before:absolute before:inset-x-3 before:mt-3 before:h-full before:bg-slate-50 before:content-['']">
              <div className="p-5 box">
                <Lucide icon="UsersRound" className="w-[28px] h-[28px] text-primary" />
                <div className="mt-4 text-slate-500 text-sm">Total Users</div>
                <div className="text-2xl font-semibold mt-1">{adminSummary?.users ?? 0}</div>
              </div>
            </div>
          </div>
          <div className="col-span-12 md:col-span-6 intro-y">
            <div className="relative zoom-in before:box before:absolute before:inset-x-3 before:mt-3 before:h-full before:bg-slate-50 before:content-['']">
              <div className="p-5 box">
                <Lucide icon="ShieldCheck" className="w-[28px] h-[28px] text-success" />
                <div className="mt-4 text-slate-500 text-sm">Configured Roles</div>
                <div className="text-2xl font-semibold mt-1">{adminSummary?.roles ?? 0}</div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-12 gap-5 mt-5">
        <div className="col-span-12 lg:col-span-8 box p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Recent Requests</h3>
            <Link to="/app/requests" className="text-primary text-sm">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <Table className="table-report w-full" striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Request No</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Total</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Date</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {recentRequests.map((row) => (
                  <Table.Tr key={row.id}>
                    <Table.Td>
                      <Link to={`/app/requests/request/${row.id}`} className="font-semibold text-primary">
                        {row.request_number}
                      </Link>
                    </Table.Td>
                    <Table.Td>{row.request_type?.name || "-"}</Table.Td>
                    <Table.Td>{formatMoney(Number(row.total_amount || 0), row.currency || "NGN")}</Table.Td>
                    <Table.Td>{statusLabel(row.status)}</Table.Td>
                    <Table.Td>{formatDisplayDate(row.created_at)}</Table.Td>
                  </Table.Tr>
                ))}
                {!loading && recentRequests.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={5} className="text-slate-500">
                      No requests yet.
                    </Table.Td>
                  </Table.Tr>
                ) : null}
              </Table.Tbody>
            </Table>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 box p-5">
          <h3 className="font-medium mb-3">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-2">
            <Link to="/app/requests/new" className="btn btn-primary">Create Request</Link>
            <Link to="/app/requests/approvals" className="btn btn-outline-secondary">My Approvals</Link>
            {canSeeFinance ? <Link to="/app/finance/requests" className="btn btn-outline-secondary">Finance Requests</Link> : null}
            {canSeeFinance ? <Link to="/app/finance" className="btn btn-outline-secondary">Finance Dashboard</Link> : null}
            {canSeeAdmin ? <Link to="/app/admin/users" className="btn btn-outline-secondary">Manage Users</Link> : null}
            {canSeeAdmin ? <Link to="/app/admin/roles" className="btn btn-outline-secondary">Manage RBAC</Link> : null}
          </div>
        </div>
      </div>
    </>
  );
}

export default PortalDashboardPage;
