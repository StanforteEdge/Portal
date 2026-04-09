import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import clsx from "clsx";
import Lucide from "@/components/Base/Lucide";
import Button from "@/components/Base/Button";
import { FormInput, FormLabel, FormSelect } from "@/components/Base/Form";
import Pagination from "@/components/Base/Pagination";
import Table from "@/components/Base/Table";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { listRequests, type RequestRecord } from "@/services/requests";
import { listProjects } from "@/services/projects";
import { listMyOrganizations } from "@/services/organizations";
import { listTeams } from "@/services/teams";
import { formatDisplayDate, formatMoney, formatRequestNumber, statusBadgeClass } from "@/utils/formatting";

type SortBy = "created_at" | "request_number" | "total_amount" | "status" | "request_type";

function getRequestTeamId(req: RequestRecord) {
  const record = req as RequestRecord & { team_id?: string | null };
  const data = (req.data || {}) as Record<string, unknown>;
  return String(data.team_id || record.team_id || "").trim();
}

function getRequestTeamName(req: RequestRecord, teamsById: Record<string, string>) {
  const data = (req.data || {}) as Record<string, unknown>;
  const fromDataName = String(data.team_name || data.team || "").trim();
  if (fromDataName && !/^\d+$/.test(fromDataName)) return fromDataName;
  const teamId = getRequestTeamId(req) || fromDataName;
  return teamId ? teamsById[teamId] || teamId : "";
}

function getRequestOrganizationId(req: RequestRecord) {
  const record = req as RequestRecord & { organization_id?: string | null };
  const data = (req.data || {}) as Record<string, unknown>;
  return String(data.organization_id || record.organization_id || "").trim();
}

function getRequestOrganizationName(req: RequestRecord, orgsById: Record<string, string>) {
  const record = req as RequestRecord & { organization?: { id?: string; name?: string } | null };
  const data = (req.data || {}) as Record<string, unknown>;
  const fromDataName = String(data.organization_name || data.organization || "").trim();
  if (fromDataName && !/^\d+$/.test(fromDataName)) return fromDataName;
  if (record.organization?.name) return record.organization.name;
  const orgId = getRequestOrganizationId(req) || record.organization?.id || fromDataName;
  return orgId ? orgsById[orgId] || orgId : "";
}

function RequestsPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const pathKind = location.pathname.includes("/requests/finance")
    ? "financial"
    : location.pathname.includes("/requests/leave")
      ? "leave"
      : "all";
  const kind = (searchParams.get("kind") || pathKind || "all").toLowerCase();
  const [allRequests, setAllRequests] = useState<RequestRecord[]>([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [project, setProject] = useState("");
  const [team, setTeam] = useState("");
  const [organization, setOrganization] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  const [projectOptions, setProjectOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [teamOptions, setTeamOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [organizationOptions, setOrganizationOptions] = useState<Array<{ id: string; name: string }>>([]);

  const organizationsById = useMemo(() => {
    return organizationOptions.reduce<Record<string, string>>((acc, row) => {
      acc[row.id] = row.name;
      return acc;
    }, {});
  }, [organizationOptions]);

  const teamsById = useMemo(() => {
    return teamOptions.reduce<Record<string, string>>((acc, row) => {
      acc[row.id] = row.name;
      return acc;
    }, {});
  }, [teamOptions]);

  const availableTeamOptions = useMemo(() => {
    const seen = new Set<string>();
    const rows: Array<{ id: string; name: string }> = [];
    for (const req of allRequests) {
      const id = getRequestTeamId(req);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      rows.push({ id, name: teamsById[id] || getRequestTeamName(req, teamsById) || id });
    }
    return rows;
  }, [allRequests, teamsById]);

  const showTeamFilterAndColumn = availableTeamOptions.length > 1;
  const showOrganizationFilterAndColumn = organizationOptions.length > 1;

  const filteredRequests = useMemo(() => {
    return allRequests.filter((req) => {
      const data = (req.data || {}) as Record<string, unknown>;
      const categoryKey = String(req.request_type?.category_key || "").toLowerCase();
      const typeName = String(req.request_type?.name || "").toLowerCase();
      const isLeave = categoryKey.includes("leave") || typeName.includes("leave");
      const requestDueDate = typeof data.due_date === "string" ? data.due_date.slice(0, 10) : "";
      const requestProject = String(data.project_id || "");
      const requestTeam = getRequestTeamId(req);
      const requestOrganization = getRequestOrganizationId(req);
      const requestPurpose = String(data.purpose || "");
      const requestType = String(req.request_type?.name || "");
      const searchText = search.trim().toLowerCase();

      const searchOk =
        !searchText ||
        req.request_number.toLowerCase().includes(searchText) ||
        requestType.toLowerCase().includes(searchText) ||
        requestPurpose.toLowerCase().includes(searchText);
      const statusOk = !status || req.status === status;
      const dueDateOk = !dueDate || requestDueDate === dueDate;
      const projectOk = !project || requestProject === project;
      const teamOk = !team || requestTeam === team;
      const orgOk = !organization || requestOrganization === organization;
      const kindOk = kind === "all" ? true : kind === "leave" ? isLeave : !isLeave;

      return searchOk && statusOk && dueDateOk && projectOk && teamOk && orgOk && kindOk;
    });
  }, [allRequests, search, status, dueDate, project, team, organization, kind]);

  const sortedRequests = useMemo(() => {
    const rows = [...filteredRequests];
    const direction = sortOrder === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      if (sortBy === "created_at") {
        const first = new Date(a.created_at || 0).getTime();
        const second = new Date(b.created_at || 0).getTime();
        return (first - second) * direction;
      }
      if (sortBy === "request_number") {
        return a.request_number.localeCompare(b.request_number, undefined, { numeric: true }) * direction;
      }
      if (sortBy === "total_amount") {
        return ((a.total_amount ?? 0) - (b.total_amount ?? 0)) * direction;
      }
      if (sortBy === "status") {
        return a.status.localeCompare(b.status) * direction;
      }
      return (a.request_type?.name || "").localeCompare(b.request_type?.name || "") * direction;
    });
    return rows;
  }, [filteredRequests, sortBy, sortOrder]);

  const pendingCount = useMemo(
    () => filteredRequests.filter((req) => req.status === "sent" || req.status === "approval").length,
    [filteredRequests]
  );
  const completedCount = useMemo(
    () => filteredRequests.filter((req) => req.status === "completed").length,
    [filteredRequests]
  );
  const rejectedCount = useMemo(
    () => filteredRequests.filter((req) => req.status === "rejected").length,
    [filteredRequests]
  );
  const pendingRetirementCount = useMemo(
    () => filteredRequests.filter((req) => req.status === "disbursed" || req.status === "confirmed").length,
    [filteredRequests]
  );

  const pageData = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return sortedRequests.slice(start, start + perPage);
  }, [sortedRequests, currentPage, perPage]);

  const totalPages = Math.max(1, Math.ceil(sortedRequests.length / perPage));

  const loadData = async () => {
    try {
      setLoading(true);
      const [reqs, projects, teams, orgs] = await Promise.all([
        listRequests({ only_mine: "true" }),
        listProjects().catch(() => []),
        listTeams({ active_only: false }).catch(() => []),
        listMyOrganizations().catch(() => []),
      ]);

      setAllRequests(reqs);
      setProjectOptions(projects.map((project) => ({ id: project.id, name: project.name })));
      setTeamOptions(teams.map((row) => ({ id: row.id, name: row.name })));
      setOrganizationOptions(
        orgs.map((row) => ({ id: row.organization.id, name: row.organization.name }))
      );
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load requests." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, status, dueDate, project, team, organization, sortBy, sortOrder, perPage]);

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">
          {kind === "leave" ? "Leave Requests" : kind === "financial" ? "Financial Requests" : "Requests"}
        </h2>
        <Link to={`/app/requests/new${kind === "all" ? "" : `?kind=${kind}`}`}>
          <Button variant="primary">
            <Lucide icon="Plus" className="w-4 h-4 mr-2" />
            {kind === "leave" ? "Create Leave Request" : "Create Request"}
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-12 gap-6 mt-5">
        {[
          { label: "Total", value: filteredRequests.length, icon: "FileText", color: "text-primary" },
          { label: "Pending", value: pendingCount, icon: "Clock3", color: "text-warning" },
          { label: "Pending Retirement", value: pendingRetirementCount, icon: "CircleDollarSign", color: "text-pending" },
          { label: "Completed", value: completedCount, icon: "CheckCircle2", color: "text-success" },
          { label: "Rejected", value: rejectedCount, icon: "XCircle", color: "text-danger" },
        ].map((card) => (
          <div key={card.label} className="col-span-6 md:col-span-4 xl:col-span-2 intro-y">
            <div
              className={clsx([
                "relative zoom-in",
                "before:box before:absolute before:inset-x-3 before:mt-3 before:h-full before:bg-slate-50 before:content-['']",
              ])}
            >
              <div className="p-5 box">
                <div className="flex">
                  <Lucide icon={card.icon as any} className={clsx("w-[28px] h-[28px]", card.color)} />
                </div>
                <div className="mt-6 text-3xl font-medium leading-8">{card.value}</div>
                <div className="mt-1 text-base text-slate-500">{card.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="box mt-5">
        <div className="p-5 border-b border-slate-200/60 dark:border-darkmode-400">
          <div className="flex flex-wrap items-end justify-center gap-3">
            <div className="w-auto">
              <FormLabel className="sr-only">Items per page</FormLabel>
              <FormSelect className="w-auto" value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </FormSelect>
            </div>
            <div className="w-auto">
              <FormLabel className="sr-only">Due date</FormLabel>
              <FormInput className="w-auto" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="w-auto">
              <FormLabel className="sr-only">Project</FormLabel>
              <FormSelect className="w-auto" value={project} onChange={(e) => setProject(e.target.value)}>
                <option value="">All projects</option>
                {projectOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </FormSelect>
            </div>
            {showTeamFilterAndColumn ? (
              <div className="min-w-[190px]">
                <FormLabel className="sr-only">Team</FormLabel>
                <FormSelect className="w-auto" value={team} onChange={(e) => setTeam(e.target.value)}>
                  <option value="">All teams</option>
                  {availableTeamOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </FormSelect>
              </div>
            ) : null}
            {showOrganizationFilterAndColumn ? (
              <div className="min-w-[190px]">
                <FormLabel className="sr-only">Organization</FormLabel>
                <FormSelect className="w-auto" value={organization} onChange={(e) => setOrganization(e.target.value)}>
                  <option value="">All organizations</option>
                  {organizationOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </FormSelect>
              </div>
            ) : null}
            <div className="w-auto">
              <FormLabel className="sr-only">Order by</FormLabel>
              <FormSelect className="w-auto" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}>
                <option value="">Order by</option>
                <option value="created_at">Created Date</option>
                <option value="request_number">Request Number</option>
                <option value="total_amount">Total Amount</option>
                <option value="status">Status</option>
                <option value="request_type">Request Type</option>
              </FormSelect>
            </div>
            <div className="w-auto">
              <FormLabel className="sr-only">Sort order</FormLabel>
              <FormSelect className="w-auto" value={sortOrder} onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}>
                <option value="">Order</option>
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </FormSelect>
            </div>
            <div className="w-auto">
              <FormLabel className="sr-only">Request status</FormLabel>
              <FormSelect className="w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All statuses</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="approval">Approval</option>
                <option value="cleared">Cleared</option>
                <option value="disbursed">Disbursed</option>
                <option value="confirmed">Confirmed</option>
                <option value="retired">Retired</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </FormSelect>
            </div>
            <div className="w-auto">
              <FormLabel className="sr-only">Search requests</FormLabel>
              <FormInput className="w-auto"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Request no, type, purpose"
              />
            </div>
          </div>
        </div>

        <div className="p-5 overflow-x-auto">
          {loading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-4 rounded bg-slate-200"></div>
              <div className="h-4 rounded bg-slate-100"></div>
              <div className="h-4 rounded bg-slate-100"></div>
            </div>
          ) : (
            <Table className="table-report" striped hover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Request No</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Total</Table.Th>
                  <Table.Th>Project</Table.Th>
                  {showTeamFilterAndColumn ? <Table.Th>Team</Table.Th> : null}
                  {showOrganizationFilterAndColumn ? <Table.Th>Organization</Table.Th> : null}
                  <Table.Th>Due Date</Table.Th>
                  <Table.Th>Status</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {pageData.map((req) => {
                  const data = (req.data || {}) as Record<string, unknown>;
                  return (
                    <Table.Tr key={req.id}>
                      <Table.Td>
                        <Link className="font-semibold text-primary hover:underline" to={`/app/requests/request/${req.id}`}>
                          {formatRequestNumber(req.request_number)}
                        </Link>
                      </Table.Td>
                      <Table.Td>{req.request_type?.name || "-"}</Table.Td>
                      <Table.Td>{formatMoney(req.total_amount)}</Table.Td>
                      <Table.Td>
                        {(() => {
                          const projectId = String(data.project_id || "").trim();
                          if (projectId) return projectOptions.find((option) => option.id === projectId)?.name || projectId;
                          return String(data.project_name || "-");
                        })()}
                      </Table.Td>
                      {showTeamFilterAndColumn ? <Table.Td>{getRequestTeamName(req, teamsById) || "-"}</Table.Td> : null}
                      {showOrganizationFilterAndColumn ? (
                        <Table.Td>{getRequestOrganizationName(req, organizationsById) || "-"}</Table.Td>
                      ) : null}
                      <Table.Td>{formatDisplayDate(typeof data.due_date === "string" ? data.due_date : null)}</Table.Td>
                      <Table.Td>
                        <span className={clsx("inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize", statusBadgeClass(req.status))}>
                          {req.status}
                        </span>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between p-5 border-t border-slate-200/60 dark:border-darkmode-400">
          <div className="text-slate-500 text-sm">
            Showing {pageData.length} of {sortedRequests.length} requests
          </div>
          <Pagination>
            <Pagination.Link onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}>
              <Lucide icon="ChevronLeft" className="w-4 h-4" />
            </Pagination.Link>
            <Pagination.Link active>{currentPage}</Pagination.Link>
            <Pagination.Link onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}>
              <Lucide icon="ChevronRight" className="w-4 h-4" />
            </Pagination.Link>
          </Pagination>
        </div>
      </div>
    </>
  );
}

export default RequestsPage;
