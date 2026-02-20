import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
import { formatDisplayDate, formatMoney, formatRequestNumber, statusBadgeClass } from "@/utils/formatting";

function RequestsPage() {
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
    return allRequests.filter((req) => {
      const data = (req.data || {}) as Record<string, unknown>;
      const requestDueDate = typeof data.due_date === "string" ? data.due_date.slice(0, 10) : "";
      const requestProject = String(data.project_id || "");
      const requestTeam = String(data.team || "");
      const requestOrganization = String(data.organization || "");
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
    return filteredRequests.slice(start, start + perPage);
  }, [filteredRequests, currentPage, perPage]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / perPage));

  const loadData = async () => {
    try {
      setLoading(true);
      const [reqs, projects, orgs] = await Promise.all([
        listRequests({ only_mine: "true" }),
        listProjects().catch(() => []),
        listMyOrganizations().catch(() => []),
      ]);

      setAllRequests(reqs);
      setProjectOptions(projects.map((project) => ({ id: project.id, name: project.name })));
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
  }, [search, status, dueDate, project, team, organization, perPage]);

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Requests</h2>
        <Link to="/app/requests/new">
          <Button variant="primary">
            <Lucide icon="Plus" className="w-4 h-4 mr-2" />
            Create Request
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
              <FormSelect className="w-auto" value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </FormSelect>
            </div>
            <div className="w-auto">
              <FormInput className="w-auto" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="w-auto">
              <FormSelect className="w-auto" value={project} onChange={(e) => setProject(e.target.value)}>
                <option value="">All projects</option>
                {projectOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </FormSelect>
            </div>
            {teamOptions.length > 1 ? (
              <div className="min-w-[190px]">
                <FormSelect className="w-auto" value={team} onChange={(e) => setTeam(e.target.value)}>
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
              <div className="min-w-[190px]">
                <FormSelect className="w-auto" value={organization} onChange={(e) => setOrganization(e.target.value)}>
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
                  {teamOptions.length > 1 ? <Table.Th>Team</Table.Th> : null}
                  {organizationOptions.length > 1 ? <Table.Th>Organization</Table.Th> : null}
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
                      {teamOptions.length > 1 ? <Table.Td>{String(data.team || "-")}</Table.Td> : null}
                      {organizationOptions.length > 1 ? (
                        <Table.Td>{String(data.organization || "-")}</Table.Td>
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
            Showing {pageData.length} of {filteredRequests.length} requests
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
