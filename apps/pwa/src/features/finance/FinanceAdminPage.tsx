import { useMemo, useState } from "react";
import {
  Button,
  Chip,
  EmptyState,
  Icon,
  PageHeader,
  SelectField,
  SectionCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
  StatCard,
  TextField,
  formatCurrency,
} from "@stanforte/shared";
import { Link, useLocation } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/features/auth/AuthProvider";
import { buildAppMobileNav, buildRequestsNavigation } from "@/features/requests/requests-data";
import { formatDisplayDate, formatPersonName, formatRequestStatus, requestStatusTone } from "@/features/requests/request-helpers";
import type { RequestRecord } from "@/features/requests/requests-api";
import { getWorkspaceProfile } from "@/features/system/workspace-api";
import { useCachedQuery } from "@/lib/core";
import { listFinanceRequests } from "./finance-api";

function toTitleCase(value: string) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function requestTotal(entry: any) {
  const raw = Number(entry?.total_amount ?? 0);
  if (raw > 0) return raw;
  if (!Array.isArray(entry?.items)) return 0;
  return entry.items.reduce(
    (sum: number, item: any) =>
      sum + Number(item?.amount ?? 0) * Number(item?.quantity ?? 1),
    0,
  );
}

export default function FinanceAdminPage() {
  const location = useLocation();
  const { user } = useAuth();
  const { data: profile } = useCachedQuery("finance-admin:profile", () => getWorkspaceProfile(), {
    ttlMs: 1000 * 60,
    storage: "memory",
  });
  const { data: financeRequests, loading, error } = useCachedQuery("finance-admin:requests", () => listFinanceRequests(), {
    ttlMs: 1000 * 30,
    storage: "memory",
  });

  const queue: RequestRecord[] = Array.isArray(financeRequests)
    ? financeRequests
    : Array.isArray((financeRequests as any)?.data)
      ? (financeRequests as any).data
      : [];
  const isRequestsView = location.pathname === "/finance/requests";
  const [statusFilter, setStatusFilter] = useState<"all" | "cleared" | "disbursed" | "confirmed" | "retired" | "completed">("all");
  const [staffFilter, setStaffFilter] = useState("");
  const [dueDateFilter, setDueDateFilter] = useState("");
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [selectedOrganization, setSelectedOrganization] = useState("all");
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const cleared = queue.filter((entry: RequestRecord) => String(entry.status || "").toLowerCase() === "cleared").length;
  const disbursed = queue.filter((entry: RequestRecord) => String(entry.status || "").toLowerCase() === "disbursed").length;
  const confirmed = queue.filter((entry: RequestRecord) => String(entry.status || "").toLowerCase() === "confirmed").length;
  const completed = queue.filter((entry: RequestRecord) => ["retired", "completed", "confirmed"].includes(String(entry.status || "").toLowerCase())).length;
  const awaitingRetirement = queue.filter((entry: RequestRecord) => ["disbursed", "confirmed"].includes(String(entry.status || "").toLowerCase())).length;
  const userName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.email || "Staff";
  const projectOptions = useMemo(
    () =>
      Array.from(
        new Map(
          queue
            .map((entry: RequestRecord) => {
              const data = entry?.data && typeof entry.data === "object" ? entry.data : {};
              const id = String((data as any).project_id || "").trim();
              const name = String((data as any).project_name || "").trim();
              return id || name ? [id || name, name || id] : null;
            })
            .filter(Boolean) as Array<[string, string]>,
        ).entries(),
      ),
    [queue],
  );
  const groupOptions = useMemo(
    () =>
      Array.from(
        new Map(
          queue
            .map((entry: RequestRecord) => {
              const data = entry?.data && typeof entry.data === "object" ? entry.data : {};
              const id = String((data as any).team_id || "").trim();
              const name = String(
                (data as any).team_name || (data as any).team || "",
              ).trim();
              return id || name ? [id || name, name || id] : null;
            })
            .filter(Boolean) as Array<[string, string]>,
        ).entries(),
      ),
    [queue],
  );
  const organizationOptions = useMemo(
    () =>
      Array.from(
        new Map(
          queue
            .map((entry: RequestRecord) => {
              const data = entry?.data && typeof entry.data === "object" ? entry.data : {};
              const id = String((data as any).organization_id || "").trim();
              const name = String((data as any).organization_name || "").trim();
              return id || name ? [id || name, name || id] : null;
            })
            .filter(Boolean) as Array<[string, string]>,
        ).entries(),
      ),
    [queue],
  );
  const filteredQueue = queue.filter((entry: RequestRecord) => {
    const statusMatch =
      statusFilter === "all" ||
      String(entry.status || "").toLowerCase() === statusFilter;
    const data = entry?.data && typeof entry.data === "object" ? entry.data : {};
    const creatorName = formatPersonName(entry.creator).toLowerCase();
    const dueDate = String((data as any).due_date || "").slice(0, 10);
    const projectId = String((data as any).project_id || "").trim();
    const projectName = String((data as any).project_name || "").trim();
    const groupId = String((data as any).team_id || "").trim();
    const groupName = String((data as any).team_name || (data as any).team || "").trim();
    const organizationId = String((data as any).organization_id || "").trim();
    const organizationName = String((data as any).organization_name || "").trim();
    const staffMatch =
      !staffFilter ||
      creatorName.includes(staffFilter.trim().toLowerCase()) ||
      String(entry.request_number || "").toLowerCase().includes(staffFilter.trim().toLowerCase());
    const dueDateMatch = !dueDateFilter || dueDate === dueDateFilter;
    const projectMatch =
      selectedProject === "all" ||
      projectId === selectedProject ||
      projectName === selectedProject;
    const groupMatch =
      selectedGroup === "all" ||
      groupId === selectedGroup ||
      groupName === selectedGroup;
    const organizationMatch =
      selectedOrganization === "all" ||
      organizationId === selectedOrganization ||
      organizationName === selectedOrganization;
    return (
      statusMatch &&
      staffMatch &&
      dueDateMatch &&
      projectMatch &&
      groupMatch &&
      organizationMatch
    );
  });
  const queueRows = isRequestsView ? filteredQueue : filteredQueue.slice(0, 8);

  return (
    <AppShell
      navigation={buildRequestsNavigation()}
      activeLabel={isRequestsView ? "Finance Requests" : "Finance Dashboard"}
      user={{ name: userName, role: profile?.employee_profile?.job_title || "Staff" }}
      mobileNav={buildAppMobileNav("Dashboard")}
    >
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Finance", path: "/finance" },
          ...(isRequestsView ? [{ label: "Requests" }] : []),
        ]}
        title={isRequestsView ? "Finance Requests" : "Finance Admin"}
        description={
          isRequestsView
            ? "Manage the finance request queue from cleared approval through disbursement, confirmation, retirement, and completion."
            : "Monitor the live finance workflow and move cleared requests through payout and closure."
        }
      />

      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Finance Queue" value={String(queue.length)} tone="neutral" />
          <StatCard label="Ready To Disburse" value={String(cleared)} tone="warning" />
          <StatCard label="Awaiting Retirement" value={String(awaitingRetirement)} tone="pending" />
          <StatCard label="Completed" value={String(completed)} tone="success" />
        </div>

        <SectionCard
          title={isRequestsView ? "Finance Request Queue" : "Priority Finance Queue"}
          description={
            isRequestsView
              ? "Use this queue to process requests through disbursement, receipt confirmation, retirement review, and completion."
              : "Start with the requests that are ready for finance action right now."
          }
          action={
            !isRequestsView ? (
              <Link to="/finance/requests" className="text-sm font-semibold text-brand-900 transition hover:underline">
                View full queue
              </Link>
            ) : undefined
          }
        >
          <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_180px_auto]">
            <SelectField
              label="Status"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as typeof statusFilter)
              }
            >
              <option value="all">All statuses</option>
              <option value="approval">Approval</option>
              <option value="cleared">Cleared</option>
              <option value="disbursed">Disbursed</option>
              <option value="confirmed">Confirmed</option>
              <option value="retired">Retired</option>
              <option value="completed">Completed</option>
            </SelectField>
            <TextField
              label="Staff"
              value={staffFilter}
              onChange={(event) => setStaffFilter(event.target.value)}
              placeholder="Search by staff or request no"
            />
            <TextField
              label="Due Date"
              type="date"
              value={dueDateFilter}
              onChange={(event) => setDueDateFilter(event.target.value)}
            />
            <div className="flex items-end">
              <Button
                type="button"
                variant="secondary"
                className="w-full justify-center lg:w-auto"
                onClick={() => setMoreFiltersOpen((current) => !current)}
              >
                {moreFiltersOpen ? "Hide More Filters" : "More Filters"}
              </Button>
            </div>
          </div>

          {moreFiltersOpen ? (
            <div className="mb-4 grid gap-3 rounded-[22px] border border-slate-200 bg-slate-50 p-4 lg:grid-cols-3">
              <SelectField
                label="Project"
                value={selectedProject}
                onChange={(event) => setSelectedProject(event.target.value)}
              >
                <option value="all">All projects</option>
                {projectOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </SelectField>
              <SelectField
                label="Group"
                value={selectedGroup}
                onChange={(event) => setSelectedGroup(event.target.value)}
              >
                <option value="all">All groups</option>
                {groupOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </SelectField>
              <SelectField
                label="Organization"
                value={selectedOrganization}
                onChange={(event) => setSelectedOrganization(event.target.value)}
              >
                <option value="all">All organizations</option>
                {organizationOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </SelectField>
            </div>
          ) : null}

          {loading ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">Loading finance requests...</div>
          ) : error ? (
            <div className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-4 text-sm text-danger">{error}</div>
          ) : queueRows.length ? (
            <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white">
              <Table caption="Finance requests">
                <TableHead>
                  <TableHeaderRow>
                    <TableHeaderCell>Request No</TableHeaderCell>
                    <TableHeaderCell>Request</TableHeaderCell>
                    <TableHeaderCell>Staff</TableHeaderCell>
                    <TableHeaderCell>Due Date</TableHeaderCell>
                    <TableHeaderCell>Total</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell className="text-right">Action</TableHeaderCell>
                  </TableHeaderRow>
                </TableHead>
                <TableBody>
                  {queueRows.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <p className="text-sm font-semibold text-slate-950">
                          {entry.request_number || entry.id}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-semibold text-slate-950">
                          {entry.request_type?.name || "Untitled request"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {String(
                            ((entry.data as Record<string, unknown> | null) || {})
                              ?.purpose || "",
                          ) || "No summary"}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm text-slate-700">
                        {formatPersonName(entry.creator)}
                      </TableCell>
                      <TableCell className="text-sm text-slate-700">
                        {formatDisplayDate(
                          String(
                            ((entry.data as Record<string, unknown> | null) || {})
                              ?.due_date || "",
                          ),
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-slate-700">
                        {formatCurrency(
                          requestTotal(entry),
                          entry.currency || "NGN",
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip variant={requestStatusTone(entry.status)}>
                          {toTitleCase(formatRequestStatus(entry.status))}
                        </Chip>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-3">
                          <Link
                            to={`/requests/details?id=${entry.id}&view=finance`}
                            className="text-sm font-semibold text-brand-900 transition hover:underline"
                          >
                            Open
                          </Link>
                          {String(entry.status || "").toLowerCase() === "disbursed" ? (
                            <Link
                              to="/finance/payment-vouchers"
                              className="text-sm font-semibold text-slate-600 transition hover:underline"
                            >
                              Vouchers
                            </Link>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState
              title="No finance requests yet"
              description="Once cleared requests reach finance, they’ll appear here for disbursement and voucher handling."
            />
          )}
        </SectionCard>

        {!isRequestsView ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard
              title="Workflow Coverage"
              description="The shared request details page now follows the full finance lifecycle for finance viewers."
            >
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                {[
                  "Cleared",
                  "Disbursed",
                  "Confirmed",
                  "Retired",
                  "Completed",
                ].map((step) => (
                  <div key={step} className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-slate-400">
                      Step
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">{step}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <section className="section-card bg-brand-900 p-5 text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-white/70">
                    Finance Tools
                  </p>
                  <h3 className="mt-3 text-xl font-semibold tracking-tight">
                    Payment voucher workspace
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-white/85">
                    Review disbursements, monitor retirements, and confirm voucher closure from one place.
                  </p>
                </div>
                <Icon name="payments" className="text-[26px] text-white/70" />
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link to="/finance/payment-vouchers" className="inline-flex">
                  <Button className="bg-white text-brand-900 hover:bg-slate-100">
                    Open Vouchers
                  </Button>
                </Link>
                <Link to="/finance/requests" className="inline-flex">
                  <Button variant="secondary" className="border-white/20 bg-white/10 text-white hover:bg-white/15">
                    Review Queue
                  </Button>
                </Link>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
