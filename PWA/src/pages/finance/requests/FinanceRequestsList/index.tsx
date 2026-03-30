import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import Lucide from "@/components/Base/Lucide";
import { FormInput, FormLabel, FormSelect } from "@/components/Base/Form";
import Pagination from "@/components/Base/Pagination";
import Table from "@/components/Base/Table";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { listFinanceRequests } from "@/services/finance";
import { listProjects } from "@/services/projects";
import { listOrganizations } from "@/services/organizations";
import { listTeams } from "@/services/teams";
import { listUsers } from "@/services/users";
import type { RequestRecord } from "@/services/requests";
import { formatDisplayDate, formatMoney, formatPersonName, formatRequestNumber, statusBadgeClass } from "@/utils/formatting";

type SortBy = "created_at" | "request_number" | "total_amount" | "status" | "request_type";

function FinanceRequestsPage() {
  const [allRequests, setAllRequests] = useState<RequestRecord[]>([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [project, setProject] = useState("");
  const [team, setTeam] = useState("");
  const [organization, setOrganization] = useState("");
  const [staff, setStaff] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [dueDate, setDueDate] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  const [projectOptions, setProjectOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [teamOptions, setTeamOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [organizationOptions, setOrganizationOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [staffOptions, setStaffOptions] = useState<Array<{ id: string; name: string }>>([]);

  const filteredRequests = useMemo(() => {
    const searchText = search.trim().toLowerCase();
    return allRequests.filter((req) => {
      const data = (req.data || {}) as Record<string, unknown>;
      const requestDueDate = typeof data.due_date === "string" ? data.due_date.slice(0, 10) : "";
      const requestProject = String(data.project_id || "");
      const requestTeam = String(data.team_id || data.team || "").trim();
      const requestOrganization = String(data.organization_id || data.organization || "").trim();
      const requestPurpose = String(data.purpose || "");
      const requestCreatorId = String(req.creator?.id || "");

      const searchOk =
        !searchText ||
        req.request_number.toLowerCase().includes(searchText) ||
        String(req.request_type?.name || "").toLowerCase().includes(searchText) ||
        requestPurpose.toLowerCase().includes(searchText) ||
        String(req.creator?.email || "").toLowerCase().includes(searchText);
      const statusOk = !status || req.status === status;
      const dueDateOk = !dueDate || requestDueDate === dueDate;
      const projectOk = !project || requestProject === project;
      const teamOk = !team || requestTeam === team;
      const orgOk = !organization || requestOrganization === organization;
      const staffOk = !staff || requestCreatorId === staff;

      return searchOk && statusOk && dueDateOk && projectOk && teamOk && orgOk && staffOk;
    });
  }, [allRequests, search, status, dueDate, project, team, organization, staff]);

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

  const clearedCount = useMemo(() => filteredRequests.filter((req) => req.status === "cleared").length, [filteredRequests]);
  const disbursedCount = useMemo(
    () => filteredRequests.filter((req) => req.status === "disbursed").length,
    [filteredRequests]
  );
  const retiredCount = useMemo(() => filteredRequests.filter((req) => req.status === "retired").length, [filteredRequests]);

  const pageData = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return sortedRequests.slice(start, start + perPage);
  }, [sortedRequests, currentPage, perPage]);

  const totalPages = Math.max(1, Math.ceil(sortedRequests.length / perPage));
  const visiblePages = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
    const pages = new Set<number>([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
    return Array.from(pages)
      .filter((page) => page >= 1 && page <= totalPages)
      .sort((first, second) => first - second);
  }, [currentPage, totalPages]);

  const load = async () => {
    try {
      setLoading(true);
      const [response, projects, teams, orgs, usersResponse] = await Promise.all([
        listFinanceRequests({ per_page: 500 }),
        listProjects().catch(() => []),
        listTeams({ active_only: false }).catch(() => []),
        listOrganizations({ is_active: true }).catch(() => []),
        listUsers({ page: 1, per_page: 500 }).catch(() => ({ data: [], meta: { page: 1, per_page: 500, total: 0, last_page: 1 } })),
      ]);
      setAllRequests(Array.isArray(response.data) ? response.data : []);
      setProjectOptions(projects.map((project) => ({ id: project.id, name: project.name })));
      setTeamOptions(teams.map((row) => ({ id: row.id, name: row.name })));
      setOrganizationOptions(orgs.map((row) => ({ id: row.id, name: row.name })));
      setStaffOptions(
        usersResponse.data.map((user) => ({
          id: user.id,
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || user.email,
        }))
      );
    } catch (error: any) {
      setNotice({
        tone: "error",
        message: error?.response?.data?.error?.message || "Unable to load finance requests.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, status, dueDate, project, team, organization, staff, sortBy, sortOrder, perPage]);

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Finance Requests</h2>
      </div>

      <div className="grid grid-cols-12 gap-6 mt-5">
        {[
          { label: "Total", value: filteredRequests.length, icon: "Wallet", color: "text-primary" },
          { label: "Cleared", value: clearedCount, icon: "CheckCircle2", color: "text-success" },
          { label: "Disbursed", value: disbursedCount, icon: "Send", color: "text-pending" },
          { label: "Retired", value: retiredCount, icon: "Undo2", color: "text-warning" },
        ].map((card) => (
          <div key={card.label} className="col-span-12 xs:col-span-6 md:col-span-3 intro-y">
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
              <FormLabel>Per Page</FormLabel>
              <FormSelect value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </FormSelect>
            </div>
            <div className="w-auto">
              <FormLabel>Status</FormLabel>
              <FormSelect value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All statuses</option>
                <option value="cleared">cleared</option>
                <option value="disbursed">disbursed</option>
                <option value="confirmed">confirmed</option>
                <option value="retired">retired</option>
                <option value="completed">completed</option>
              </FormSelect>
            </div>
            <div className="w-auto">
              <FormLabel>Due Date</FormLabel>
              <FormInput type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="w-auto">
              <FormLabel>Project</FormLabel>
              <FormSelect value={project} onChange={(e) => setProject(e.target.value)}>
                <option value="">All projects</option>
                {projectOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </FormSelect>
            </div>
            <div className="w-auto">
              <FormLabel>Team</FormLabel>
              <FormSelect value={team} onChange={(e) => setTeam(e.target.value)}>
                <option value="">All teams</option>
                {teamOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </FormSelect>
            </div>
            <div className="w-auto">
              <FormLabel>Organization</FormLabel>
              <FormSelect value={organization} onChange={(e) => setOrganization(e.target.value)}>
                <option value="">All organizations</option>
                {organizationOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </FormSelect>
            </div>
            <div className="w-auto">
              <FormLabel>Staff</FormLabel>
              <FormSelect value={staff} onChange={(e) => setStaff(e.target.value)}>
                <option value="">All staff</option>
                {staffOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </FormSelect>
            </div>
            <div className="w-auto">
              <FormLabel>Order By</FormLabel>
              <FormSelect value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}>
                <option value="created_at">Created Date</option>
                <option value="request_number">Request Number</option>
                <option value="total_amount">Total Amount</option>
                <option value="status">Status</option>
                <option value="request_type">Request Type</option>
              </FormSelect>
            </div>
            <div className="w-auto">
              <FormLabel>Order</FormLabel>
              <FormSelect value={sortOrder} onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}>
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </FormSelect>
            </div>
            <div className="w-auto">
              <FormLabel>Search</FormLabel>
              <FormInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Request no, type, purpose, requester"
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
                  <Table.Th>Requester</Table.Th>
                  <Table.Th>Due Date</Table.Th>
                  <Table.Th>Status</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {pageData.map((req) => {
                  const data = (req.data || {}) as Record<string, unknown>;
                  return (
                    <Table.Tr key={req.id}>
                      <Table.RowHeader>
                        <Link className="font-semibold text-primary hover:underline" to={`/app/finance/requests/request/${req.id}`}>
                          {formatRequestNumber(req.request_number)}
                        </Link>
                      </Table.RowHeader>
                      <Table.Td>{req.request_type?.name || "-"}</Table.Td>
                      <Table.Td>{formatMoney(req.total_amount)}</Table.Td>
                      <Table.Td>
                        <div className="font-medium">{formatPersonName(req.creator)}</div>
                        <div className="text-xs text-slate-500">{req.creator?.email || "-"}</div>
                      </Table.Td>
                      <Table.Td>
                        {formatDisplayDate(typeof data.due_date === "string" ? data.due_date : null)}
                      </Table.Td>
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
            Showing {pageData.length} of {sortedRequests.length} finance requests
          </div>
          <Pagination>
            <Pagination.Link onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}>
              <Lucide icon="ChevronLeft" className="w-4 h-4" />
            </Pagination.Link>
            {visiblePages.map((page, index) => (
              <span key={page} className="flex items-center">
                {index > 0 && page - visiblePages[index - 1] > 1 ? (
                  <span className="px-2 text-slate-400">...</span>
                ) : null}
                <Pagination.Link active={page === currentPage} onClick={() => setCurrentPage(page)}>
                  {page}
                </Pagination.Link>
              </span>
            ))}
            <Pagination.Link onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}>
              <Lucide icon="ChevronRight" className="w-4 h-4" />
            </Pagination.Link>
          </Pagination>
        </div>
      </div>
    </>
  );
}

export default FinanceRequestsPage;
