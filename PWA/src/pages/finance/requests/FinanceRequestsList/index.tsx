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
import { listMyOrganizations } from "@/services/organizations";
import type { RequestRecord } from "@/services/requests";
import { formatDisplayDate, formatMoney, formatPersonName, formatRequestNumber, statusBadgeClass } from "@/utils/formatting";

function FinanceRequestsPage() {
  const [allRequests, setAllRequests] = useState<RequestRecord[]>([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [project, setProject] = useState("");
  const [team, setTeam] = useState("");
  const [organization, setOrganization] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  const [projectOptions, setProjectOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [organizationOptions, setOrganizationOptions] = useState<Array<{ id: string; name: string }>>([]);

  const filteredRequests = useMemo(() => {
    const searchText = search.trim().toLowerCase();
    return allRequests.filter((req) => {
      const data = (req.data || {}) as Record<string, unknown>;
      const requestDueDate = typeof data.due_date === "string" ? data.due_date.slice(0, 10) : "";
      const requestProject = String(data.project || "");
      const requestTeam = String(data.team || "");
      const requestOrganization = String(data.organization || "");
      const requestPurpose = String(data.purpose || "");

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

      return searchOk && statusOk && dueDateOk && projectOk && teamOk && orgOk;
    });
  }, [allRequests, search, status, dueDate, project, team, organization]);

  const teamOptions = useMemo(() => {
    const teams = new Set<string>();
    for (const req of allRequests) {
      const teamValue = String(((req.data || {}) as Record<string, unknown>).team || "").trim();
      if (teamValue) teams.add(teamValue);
    }
    return Array.from(teams);
  }, [allRequests]);

  const clearedCount = useMemo(() => filteredRequests.filter((req) => req.status === "cleared").length, [filteredRequests]);
  const disbursedCount = useMemo(
    () => filteredRequests.filter((req) => req.status === "disbursed").length,
    [filteredRequests]
  );
  const retiredCount = useMemo(() => filteredRequests.filter((req) => req.status === "retired").length, [filteredRequests]);

  const pageData = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredRequests.slice(start, start + perPage);
  }, [filteredRequests, currentPage, perPage]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / perPage));

  const load = async () => {
    try {
      setLoading(true);
      const [response, projects, orgs] = await Promise.all([
        listFinanceRequests({ per_page: 100 }),
        listProjects().catch(() => []),
        listMyOrganizations().catch(() => []),
      ]);
      setAllRequests(Array.isArray(response.data) ? response.data : []);
      setProjectOptions(projects.map((project) => ({ id: project.id, name: project.name })));
      setOrganizationOptions(orgs.map((row) => ({ id: row.organization.id, name: row.organization.name })));
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
  }, [search, status, dueDate, project, team, organization, perPage]);

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
                  <option key={option.id} value={option.name}>
                    {option.name}
                  </option>
                ))}
              </FormSelect>
            </div>
            {teamOptions.length > 1 ? (
              <div className="w-auto">
                <FormLabel>Team</FormLabel>
                <FormSelect value={team} onChange={(e) => setTeam(e.target.value)}>
                  <option value="">All teams</option>
                  {teamOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </FormSelect>
              </div>
            ) : null}
            {organizationOptions.length > 1 ? (
              <div className="w-auto">
                <FormLabel>Organization</FormLabel>
                <FormSelect value={organization} onChange={(e) => setOrganization(e.target.value)}>
                  <option value="">All organizations</option>
                  {organizationOptions.map((option) => (
                    <option key={option.id} value={option.name}>
                      {option.name}
                    </option>
                  ))}
                </FormSelect>
              </div>
            ) : null}
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
                      <Table.Td>
                        <Link className="font-semibold text-primary hover:underline" to={`/app/finance/requests/request/${req.id}`}>
                          {formatRequestNumber(req.request_number)}
                        </Link>
                      </Table.Td>
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
            Showing {pageData.length} of {filteredRequests.length} finance requests
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

export default FinanceRequestsPage;
