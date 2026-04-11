import { useEffect, useMemo, useState } from "react";
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
import { Link } from "react-router-dom";
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import {
  buildAppMobileNav,
  buildRequestsNavigation,
} from "@/features/requests/requests-data";
import {
  formatDisplayDate,
  formatPersonName,
  formatRequestStatus,
  requestStatusTone,
} from "@/features/requests/request-helpers";
import type { RequestRecord } from "@/features/requests/requests-api";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import { useCachedQuery } from "@/shared/lib/core";
import {
  listFinanceRequests,
  type FinanceRequestListResponse,
} from "@/modules/finance/finance-api";

function toTitleCase(value: string) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function requestTotal(entry: any) {
  const raw = Number(entry?.request_total_amount ?? entry?.total_amount ?? 0);
  if (raw > 0) return raw;
  if (!Array.isArray(entry?.items)) return 0;
  return entry.items.reduce(
    (sum: number, item: any) =>
      sum + Number(item?.amount ?? 0) * Number(item?.quantity ?? 1),
    0,
  );
}

function capitalizeWords(value: string) {
  return String(value || "")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

type SortBy =
  | "created_at"
  | "request_number"
  | "total_amount"
  | "status"
  | "request_type";
type SortDir = "asc" | "desc";
export default function FinanceDashboardPage() {
  const { user } = useAuth();
  const { data: profile } = useCachedQuery(
    "finance-admin:profile",
    () => getWorkspaceProfile(),
    {
      ttlMs: 1000 * 60,
      storage: "memory",
    },
  );
  const [statusFilter, setStatusFilter] = useState<
    | "all"
    | "approval"
    | "cleared"
    | "disbursed"
    | "confirmed"
    | "retired"
    | "completed"
  >("all");
  const [staffFilter, setStaffFilter] = useState("");
  const [dueDateFilter, setDueDateFilter] = useState("");
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [selectedOrganization, setSelectedOrganization] = useState("all");
  const [sortBy, setSortBy] = useState<SortBy>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const isRequestsView = false;

  useEffect(() => {
    setPage(1);
  }, [
    statusFilter,
    staffFilter,
    dueDateFilter,
    selectedProject,
    selectedGroup,
    selectedOrganization,
    sortBy,
    sortDir,
    perPage,
  ]);

  const financeRequestQuery = useMemo(
    () => ({
      page,
      per_page: perPage,
      order_by: sortBy,
      order_dir: sortDir,
      status: statusFilter !== "all" ? statusFilter : undefined,
      q: staffFilter.trim() || undefined,
      due_date: dueDateFilter || undefined,
      project: selectedProject !== "all" ? selectedProject : undefined,
      group: selectedGroup !== "all" ? selectedGroup : undefined,
      organization:
        selectedOrganization !== "all" ? selectedOrganization : undefined,
    }),
    [
      page,
      perPage,
      sortBy,
      sortDir,
      statusFilter,
      staffFilter,
      dueDateFilter,
      selectedProject,
      selectedGroup,
      selectedOrganization,
    ],
  );

  const {
    data: financeRequests,
    loading,
    error,
  } = useCachedQuery(
    `finance-admin:requests:${JSON.stringify(financeRequestQuery)}`,
    () => listFinanceRequests(financeRequestQuery),
    {
      ttlMs: 1000 * 30,
      storage: "memory",
    },
  );

  const requestResponse = financeRequests as
    | FinanceRequestListResponse
    | undefined;
  const queue: RequestRecord[] = Array.isArray(requestResponse?.data)
    ? requestResponse.data
    : [];
  const total = requestResponse?.meta?.total ?? queue.length;
  const lastPage = requestResponse?.meta?.last_page ?? 1;
  const userName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.email ||
    "Staff";
  const optionsQuery = useCachedQuery(
    "finance-admin:requests-options",
    () =>
      listFinanceRequests({
        page: 1,
        per_page: 100,
        order_by: "created_at",
        order_dir: "desc",
      }),
    {
      ttlMs: 1000 * 30,
      storage: "memory",
    },
  );
  const optionsQueue: RequestRecord[] = Array.isArray(
    (optionsQuery.data as FinanceRequestListResponse | undefined)?.data,
  )
    ? ((optionsQuery.data as FinanceRequestListResponse).data ?? [])
    : [];
  const statsQueue = optionsQueue.length ? optionsQueue : queue;
  const cleared = statsQueue.filter(
    (entry: RequestRecord) =>
      String(entry.status || "").toLowerCase() === "cleared",
  ).length;
  const disbursed = statsQueue.filter(
    (entry: RequestRecord) =>
      String(entry.status || "").toLowerCase() === "disbursed",
  ).length;
  const confirmed = statsQueue.filter(
    (entry: RequestRecord) =>
      String(entry.status || "").toLowerCase() === "confirmed",
  ).length;
  const completed = statsQueue.filter((entry: RequestRecord) =>
    ["retired", "completed", "confirmed"].includes(
      String(entry.status || "").toLowerCase(),
    ),
  ).length;
  const awaitingRetirement = statsQueue.filter((entry: RequestRecord) =>
    ["disbursed", "confirmed"].includes(
      String(entry.status || "").toLowerCase(),
    ),
  ).length;
  const projectOptions = useMemo(
    () =>
      Array.from(
        new Set(
          optionsQueue
            .map((entry) => {
              const data =
                entry?.data && typeof entry.data === "object" ? entry.data : {};
              return String((data as any).project_name || "").trim();
            })
            .filter(Boolean),
        ),
      ),
    [optionsQueue],
  );
  const groupOptions = useMemo(
    () =>
      Array.from(
        new Set(
          optionsQueue
            .map((entry) => {
              const data =
                entry?.data && typeof entry.data === "object" ? entry.data : {};
              return String(
                (data as any).team_name || (data as any).team || "",
              ).trim();
            })
            .filter(Boolean),
        ),
      ),
    [optionsQueue],
  );
  const organizationOptions = useMemo(
    () =>
      Array.from(
        new Set(
          optionsQueue
            .map((entry) => {
              const data =
                entry?.data && typeof entry.data === "object" ? entry.data : {};
              return String((data as any).organization_name || "").trim();
            })
            .filter(Boolean),
        ),
      ),
    [optionsQueue],
  );
  const queueRows = isRequestsView ? queue : queue.slice(0, 8);

  return (
    <AppShell
      navigation={buildRequestsNavigation()}
      activeLabel={isRequestsView ? "Finance Requests" : "Finance Dashboard"}
      user={{
        name: userName,
        role: profile?.employee_profile?.job_title || "Staff",
      }}
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
          <StatCard
            label="Finance Queue"
            value={String(total)}
            tone="neutral"
            icon="folder_open"
          />
          <StatCard
            label="Ready To Disburse"
            value={String(cleared)}
            tone="warning"
            icon="payments"
          />
          <StatCard
            label="Awaiting Retirement"
            value={String(awaitingRetirement)}
            tone="pending"
            icon="receipt_long"
          />
          <StatCard
            label="Completed"
            value={String(completed)}
            tone="success"
            icon="task_alt"
          />
        </div>

        <SectionCard
          title={
            isRequestsView ? "Finance Request Queue" : "Priority Finance Queue"
          }
          description={
            isRequestsView
              ? "Use this queue to process requests through disbursement, receipt confirmation, retirement review, and completion."
              : "Start with the requests that are ready for finance action right now."
          }
          action={
            !isRequestsView ? (
              <Link
                to="/finance/requests"
                className="text-sm font-semibold text-brand-900 transition hover:underline"
              >
                View full queue
              </Link>
            ) : undefined
          }
        >
          <div className="mb-4 flex flex-wrap items-start gap-3">
            <SelectField
              label="Status"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as typeof statusFilter)
              }
              className="min-w-[180px] flex-1 lg:flex-none"
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
            <SelectField
              label="Sort By"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortBy)}
              className="min-w-[180px] flex-1 lg:flex-none"
            >
              <option value="created_at">Date Created</option>
              <option value="request_number">Request No</option>
              <option value="request_type">Request Type</option>
              <option value="status">Status</option>
              <option value="total_amount">Total Amount</option>
            </SelectField>
            <SelectField
              label="Order"
              value={sortDir}
              onChange={(event) => setSortDir(event.target.value as SortDir)}
              className="min-w-[160px] flex-1 lg:flex-none"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </SelectField>
            <SelectField
              label="Per Page"
              value={String(perPage)}
              onChange={(event) => setPerPage(Number(event.target.value) || 10)}
              className="min-w-[140px] flex-1 lg:flex-none"
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </SelectField>
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
            <div className="mb-4 flex flex-wrap gap-3 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <SelectField
                label="Project"
                value={selectedProject}
                onChange={(event) => setSelectedProject(event.target.value)}
                className="min-w-[220px] flex-1 lg:flex-none"
              >
                <option value="all">All projects</option>
                {projectOptions.map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </SelectField>
              <SelectField
                label="Group"
                value={selectedGroup}
                onChange={(event) => setSelectedGroup(event.target.value)}
                className="min-w-[220px] flex-1 lg:flex-none"
              >
                <option value="all">All groups</option>
                {groupOptions.map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </SelectField>
              <SelectField
                label="Organization"
                value={selectedOrganization}
                onChange={(event) =>
                  setSelectedOrganization(event.target.value)
                }
                className="min-w-[220px] flex-1 lg:flex-none"
              >
                <option value="all">All organizations</option>
                {organizationOptions.map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </SelectField>
            </div>
          ) : null}

          {loading ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">
              Loading finance requests...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-4 text-sm text-danger">
              {error}
            </div>
          ) : queueRows.length ? (
            <>
              <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white">
                <Table caption="Finance requests">
                  <TableHead>
                    <TableHeaderRow>
                      <TableHeaderCell>Request No</TableHeaderCell>
                      <TableHeaderCell>Team</TableHeaderCell>
                      <TableHeaderCell>Staff</TableHeaderCell>
                      <TableHeaderCell>Due Date</TableHeaderCell>
                      <TableHeaderCell>Total</TableHeaderCell>
                      <TableHeaderCell>Status</TableHeaderCell>
                      <TableHeaderCell className="text-right">
                        Action
                      </TableHeaderCell>
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
                        <TableCell className="text-sm text-slate-700">
                          {String(
                            (
                              (entry.data as Record<string, unknown> | null) ||
                              {}
                            )?.team_name ||
                              (
                                (entry.data as Record<
                                  string,
                                  unknown
                                > | null) || {}
                              )?.team ||
                              "-",
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-slate-700">
                          {capitalizeWords(formatPersonName(entry.creator))}
                        </TableCell>
                        <TableCell className="text-sm text-slate-700">
                          {formatDisplayDate(
                            String(
                              (
                                (entry.data as Record<
                                  string,
                                  unknown
                                > | null) || {}
                              )?.due_date || "",
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
                              to={`/finance/requests/details?id=${entry.id}`}
                              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-900 transition hover:underline"
                            >
                              <Icon
                                name="arrow_forward"
                                className="text-[16px]"
                              />
                              Open
                            </Link>
                            {String(entry.status || "").toLowerCase() ===
                            "disbursed" ? (
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
              {isRequestsView ? (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">
                    Page {page} of {lastPage} • {total} request
                    {total === 1 ? "" : "s"}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setPage((current) => Math.max(1, current - 1))
                      }
                      disabled={page <= 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setPage((current) => Math.min(lastPage, current + 1))
                      }
                      disabled={page >= lastPage}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <EmptyState
              title="No finance requests yet"
              description="Once cleared requests reach finance, they'll appear here for disbursement and voucher handling."
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
                  <div
                    key={step}
                    className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-slate-400">
                      Step
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {step}
                    </p>
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
                    Review disbursements, monitor retirements, and confirm
                    voucher closure from one place.
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
                  <Button
                    variant="secondary"
                    className="border-white/20 bg-white/10 text-white hover:bg-white/15"
                  >
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
