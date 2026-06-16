import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import clsx from "clsx";
import Table from "@/components/Base/Table";
import { Dialog } from "@/components/Base/Headless";
import { FormInput, FormLabel, FormTextarea } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import NewPortalNotice from "@/components/NewPortalNotice";
import { listFinanceRequestPaymentVouchers } from "@/services/finance";
import type { FileAssetRecord } from "@/services/files";
import {
  approveRequest,
  completeRequest,
  confirmRequestVoucher,
  deleteRequest as deleteRequestApi,
  generateFullRequestDocument,
  generateRequestPdf,
  generateRequestPvByVoucher,
  getRequest,
  getRequestActions,
  rejectRequest,
  retireRequest,
  submitRequest,
  type RequestRecord,
} from "@/services/requests";
import { listTeams, type TeamOption } from "@/services/teams";
import { listOrganizations, type OrganizationRecord } from "@/services/organizations";
import { listProjects, type ProjectOption } from "@/services/projects";
import { listEntityTags, listManagedTaxonomies, type TagTerm } from "@/services/taxonomy";
import { formatDisplayDate, formatMoney, formatPaymentMethod, formatPersonName, formatRequestNumber, statusBadgeClass } from "@/utils/formatting";
import { buildRequestWorkflowSteps } from "@/utils/requestWorkflow";
import MediaPickerModal from "@/components/Media/MediaPickerModal";
import { useAppSelector } from "@/stores/hooks";

function downloadBase64File(fileName: string, mimeType: string, contentBase64: string) {
  const bytes = atob(contentBase64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) arr[i] = bytes.charCodeAt(i);
  const blob = new Blob([arr], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function RequestDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState<RequestRecord | null>(null);
  const [actions, setActions] = useState<string[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [categoryTermMap, setCategoryTermMap] = useState<Record<string, string>>({});
  const [paymentVouchers, setPaymentVouchers] = useState<
    Array<{
      id: string;
      voucher_number: string;
      amount: number;
      retired_amount: number;
      voucher_balance: number;
      request_balance: number;
      retirement_status: string;
      method: string | null;
      transaction_ref: string | null;
      note: string | null;
      disbursed_at: string;
      retired_at: string | null;
      verified_at: string | null;
      evidence_file: { id: string; file_name: string; mime_type: string | null; public_url: string | null } | null;
      evidence_files: Array<{ id: string; file_name: string; mime_type: string | null; public_url: string | null }>;
      retirement_files: Array<{ id: string; file_name: string; mime_type: string | null; public_url: string | null }>;
    }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<{
    id: string;
    voucher_number: string;
    amount: number;
    retired_amount: number;
    voucher_balance: number;
    request_balance: number;
    retirement_status: string;
    method: string | null;
    transaction_ref: string | null;
    note: string | null;
    disbursed_at: string;
    retired_at: string | null;
    verified_at: string | null;
    evidence_file: { id: string; file_name: string; mime_type: string | null; public_url: string | null } | null;
    evidence_files: Array<{ id: string; file_name: string; mime_type: string | null; public_url: string | null }>;
    retirement_files: Array<{ id: string; file_name: string; mime_type: string | null; public_url: string | null }>;
  } | null>(null);
  const [showRetireModal, setShowRetireModal] = useState(false);
  const [retireTargetVoucher, setRetireTargetVoucher] = useState<{
    id: string;
    voucher_number: string;
    amount: number;
    retired_amount: number;
    voucher_balance: number;
    request_balance: number;
    retirement_status: string;
    method: string | null;
    transaction_ref: string | null;
    note: string | null;
    disbursed_at: string;
    retired_at: string | null;
    verified_at: string | null;
    evidence_file: { id: string; file_name: string; mime_type: string | null; public_url: string | null } | null;
    evidence_files: Array<{ id: string; file_name: string; mime_type: string | null; public_url: string | null }>;
    retirement_files: Array<{ id: string; file_name: string; mime_type: string | null; public_url: string | null }>;
  } | null>(null);
  const [retireForm, setRetireForm] = useState({
    amount: "",
    notes: "",
    retirement_file_ids: [] as string[],
    uploaded_files: [] as string[],
  });
  const [showRetirementPicker, setShowRetirementPicker] = useState(false);
  const [requestTags, setRequestTags] = useState<TagTerm[]>([]);
  const authUserId = useAppSelector((state) => String(state.auth.user?.id ?? ""));

  const load = async () => {
    try {
      setLoading(true);
      const [req, actionList, teamsData, orgData, projectData, taxonomies, pvs, tagPayload] = await Promise.all([
        getRequest(id),
        getRequestActions(id),
        listTeams({ active_only: false }).catch(() => []),
        listOrganizations({ is_active: true }).catch(() => []),
        listProjects({ active_only: false }).catch(() => []),
        listManagedTaxonomies({ include_inactive: false }).catch(() => []),
        listFinanceRequestPaymentVouchers(id).catch(() => []),
        listEntityTags("request", id, "request_tags").catch(() => ({ tags: [] as TagTerm[] })),
      ]);
      setRequest(req);
      setActions(actionList);
      setTeams(teamsData);
      setOrganizations(orgData);
      setProjects(projectData);
      setPaymentVouchers(pvs);
      setRequestTags(tagPayload?.tags || []);
      const termMap: Record<string, string> = {};
      for (const taxonomy of taxonomies) {
        for (const term of taxonomy.terms || []) termMap[String(term.id)] = String(term.label);
      }
      setCategoryTermMap(termMap);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load request." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const isAccountantStep = request?.approvals?.pending?.some(
    (p) => p.approver_type === "permission" && p.approver_id === "finance.approve"
  ) ?? false;

  const getActionLabel = (action: string) => {
    if (action === "approve") return isAccountantStep ? "Clear" : "Approve";
    return action;
  };

  const run = async (action: string) => {
    try {
      setBusyAction(action);
      setNotice(null);

      if (action === "delete") {
        const shouldDelete = window.confirm("Delete this draft request?");
        if (!shouldDelete) return;
        await deleteRequestApi(id);
        navigate("/appOld/requests");
        return;
      }
      if (action === "submit") await submitRequest(id);
      if (action === "approve" || action === "reject") {
        const availableActions: string[] = await getRequestActions(id).catch(() => []);
        if (!availableActions.includes(action)) {
          await load();
          setNotice({
            tone: "error",
            message: "This request is no longer awaiting your approval. We refreshed the page for you.",
          });
          return;
        }
      }
      if (action === "approve") await approveRequest(id, window.prompt(`${getActionLabel(action)} comment (optional):`) || undefined);
      if (action === "reject") await rejectRequest(id, window.prompt("Rejection reason:") || undefined);
      if (action === "complete") await completeRequest(id);

      setNotice({ tone: "success", message: `Action '${action}' completed.` });
      await load();
    } catch (error: any) {
      if (String(error?.response?.data?.error?.message || "").includes("not an allowed approver")) {
        await load();
      }
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || `Action '${action}' failed.` });
    } finally {
      setBusyAction("");
    }
  };

  const runPdf = async () => {
    try {
      setBusyAction("pdf");
      const file = await generateRequestPdf(id);
      downloadBase64File(file.file_name, file.mime_type, file.content_base64);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to generate request PDF." });
    } finally {
      setBusyAction("");
    }
  };

  const runFullDocument = async () => {
    try {
      setBusyAction("full_document");
      const file = await generateFullRequestDocument(id);
      downloadBase64File(file.file_name, file.mime_type, file.content_base64);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to generate full request document." });
    } finally {
      setBusyAction("");
    }
  };

  const runPv = async () => {
    if (!selectedVoucher) return;
    try {
      setBusyAction("pv");
      const file = await generateRequestPvByVoucher(id, selectedVoucher.id);
      downloadBase64File(file.file_name, file.mime_type, file.content_base64);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to generate PV." });
    } finally {
      setBusyAction("");
    }
  };

  const progressSteps = buildRequestWorkflowSteps(request, paymentVouchers);
  const canEditDraft =
    Boolean(request) &&
    String(request?.status || "").toLowerCase() === "draft" &&
    String(request?.creator?.id || "") === authUserId;

  const requestData = (request?.data || {}) as Record<string, unknown>;
  const teamName = (() => {
    const idValue = String(requestData.team_id || "").trim();
    if (!idValue) return "-";
    return teams.find((team) => team.id === idValue)?.name || idValue;
  })();
  const organizationName = (() => {
    const directName = String((request as any)?.organization?.name || "").trim();
    if (directName) return directName;
    const rawValue = String(requestData.organization_name || requestData.organization || requestData.organization_id || "").trim();
    if (!rawValue) return "-";
    if (!/^\d+$/.test(rawValue)) return rawValue;
    return organizations.find((org) => org.id === rawValue)?.name || rawValue;
  })();
  const purposeText = String(requestData.purpose || requestData.leave_reason || "").trim();
  const projectName = (() => {
    const projectId = String(requestData.project_id || "").trim();
    if (projectId) return projects.find((project) => project.id === projectId)?.name || projectId;
    const projectLabel = String(requestData.project_name || "").trim();
    return projectLabel || "-";
  })();
  const categoryName = (() => {
    const idValue = String(requestData.category_id || "").trim();
    if (!idValue) return "-";
    return categoryTermMap[idValue] || idValue;
  })();
  const retirementStatusLabel = (value: string) => {
    const key = String(value || "").toLowerCase();
    if (key === "verified") return "Confirmed";
    if (key === "partial") return "Partial";
    if (key === "retired") return "Retired";
    return "Pending";
  };

  const openRetireModal = (voucher: NonNullable<typeof retireTargetVoucher>) => {
    setRetireTargetVoucher(voucher);
    setRetireForm({
      amount: voucher.voucher_balance > 0 ? String(voucher.voucher_balance) : "",
      notes: "",
      retirement_file_ids: [],
      uploaded_files: [],
    });
    setShowRetireModal(true);
  };

  const applyRetirementFiles = (files: FileAssetRecord[]) => {
    if (!files.length) return;
    setRetireForm((prev) => ({
      ...prev,
      retirement_file_ids: Array.from(new Set([...prev.retirement_file_ids, ...files.map((file) => file.id)])),
      uploaded_files: Array.from(new Set([...prev.uploaded_files, ...files.map((file) => file.file_name)])),
    }));
  };

  const submitRetirement = async () => {
    if (!retireTargetVoucher) return;
    try {
      setBusyAction("retire");
      const retiredAmount = retireForm.amount.trim() ? Number(retireForm.amount) : undefined;
      if (retiredAmount !== undefined && retiredAmount > retireTargetVoucher.voucher_balance) {
        setNotice({ tone: "warning", message: "Retirement amount cannot exceed selected PV balance." });
        setBusyAction("");
        return;
      }
      await retireRequest(id, {
        voucher_id: retireTargetVoucher.id,
        notes: retireForm.notes.trim() || undefined,
        retired_amount: retiredAmount,
        retirement_file_ids: retireForm.retirement_file_ids.length ? retireForm.retirement_file_ids : undefined,
      });
      setShowRetireModal(false);
      setRetireTargetVoucher(null);
      setNotice({ tone: "success", message: "Retirement submitted." });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to submit retirement." });
    } finally {
      setBusyAction("");
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Request Detail</h2>
        <Button variant="outline-secondary" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>
      <div className="mt-5 intro-y">
        <NewPortalNotice />
      </div>
      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}
      <div className="box mt-5 p-5">
        {loading || !request ? (
          <div className="animate-pulse space-y-3">
            <div className="h-6 w-56 rounded bg-slate-200"></div>
            <div className="h-24 rounded bg-slate-100"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 rounded-md border p-4 md:grid-cols-3">
              <div>
                <div className="text-xs text-slate-500">Request No</div>
                <div className="mt-1 text-2xl font-bold text-primary">{formatRequestNumber(request.request_number)}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-500">Total</div>
                <div className="mt-1 text-xl font-semibold">{formatMoney(request.total_amount)}</div>
              </div>
              <div className="text-end">
                <div className="text-xs text-slate-500">Status</div>
                <span className={clsx("mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold capitalize", statusBadgeClass(request.status))}>
                  {request.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-md border p-4">
                <h3 className="mb-3 text-lg font-medium">Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-slate-500">Request Type</div>
                    <div>{request.request_type?.name || "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Due Date</div>
                    <div>{formatDisplayDate(typeof request.data?.due_date === "string" ? request.data.due_date : null)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Created At</div>
                    <div>{formatDisplayDate(request.created_at)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Team</div>
                    <div>{teamName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Organization</div>
                    <div>{organizationName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Project</div>
                    <div>{projectName}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs text-slate-500">Purpose</div>
                    <div>{purposeText || "-"}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs text-slate-500">Tags</div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {requestTags.length > 0 ? (
                        requestTags.map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                          >
                            {tag.label}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Category</div>
                    <div>{categoryName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Created By</div>
                    <div>{formatPersonName(request.creator)}</div>
                  </div>
                </div>
              </div>
              <div className="rounded-md border p-4">
                <h3 className="mb-3 font-medium text-lg ">Workflow Progress</h3>
                <div className="space-y-2">
                  {progressSteps.length === 0 ? (
                    <div className="text-slate-500">No workflow steps available.</div>
                  ) : (
                    progressSteps.map((item) => (
                      <div key={item.key} className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-medium">{item.title}</span>
                        <span className="text-slate-500">- {item.owner}</span>
                        {item.actor ? <span className="text-slate-500 font-medium">Approved by {item.actor}</span> : null}
                        {item.note ? <span className="text-xs text-slate-500">({item.note})</span> : null}
                        {item.state === "done" ? (
                          <Lucide icon="CheckCircle2" className="w-4 h-4 text-success" />
                        ) : item.state === "cancelled" ? (
                          <Lucide icon="XCircle" className="w-4 h-4 text-danger" />
                        ) : item.state === "pending" ? (
                          <Lucide icon="MoreHorizontal" className="w-4 h-4 text-warning" />
                        ) : (
                          <Lucide icon="Minus" className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-md border p-4">
              <h3 className="font-medium mb-2">Items</h3>
              <Table className="table-report" striped hover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th className="w-2/3">Item</Table.Th>
                    <Table.Th>Qty</Table.Th>
                    <Table.Th>Price</Table.Th>
                    <Table.Th>Amount</Table.Th>
                    <Table.Th>Files</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {request.items.map((item) => (
                    <Table.Tr key={item.id}>
                      <Table.Td><div>{item.description}</div><span className="text-xs">{item.notes || ""}</span></Table.Td>
                      <Table.Td>{item.quantity}</Table.Td>
                      <Table.Td>{formatMoney(item.amount)}</Table.Td>
                      <Table.Td>{formatMoney(Number(item.amount) * Number(item.quantity || 1))}</Table.Td>
                      <Table.Td>
                        {item.files?.length ? (
                          <div className="flex flex-col gap-1">
                            {item.files.map((file) => (
                              <a key={file.id} href={file.public_url || "#"} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
                                {file.file_name}
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>

            <div className="rounded-md border p-4">
              <div className="mb-2 font-medium">Disbursements (Payment Vouchers)</div>
              <div className="overflow-x-auto">
                {paymentVouchers.length === 0 ? (
                  <div className="text-slate-500">No disbursement yet.</div>
                ) : (
                  <Table className="table-report" striped hover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>PV</Table.Th>
                        <Table.Th>Amount</Table.Th>
                        <Table.Th>Retired</Table.Th>
                        <Table.Th>Balance</Table.Th>
                        <Table.Th>Retirement</Table.Th>
                        <Table.Th className="text-right">Action</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {paymentVouchers.map((pv) => (
                        <Table.Tr key={pv.id} className="cursor-pointer" onClick={() => setSelectedVoucher(pv)}>
                          <Table.Td className="font-medium text-primary">{pv.voucher_number}</Table.Td>
                          <Table.Td>{formatMoney(pv.amount, "-")}</Table.Td>
                          <Table.Td>{formatMoney(pv.retired_amount, "-")}</Table.Td>
                          <Table.Td>{formatMoney(pv.voucher_balance, "-")}</Table.Td>
                          <Table.Td>{retirementStatusLabel(pv.retirement_status)}</Table.Td>
                          <Table.Td className="text-right">
                            <div className="flex justify-end gap-2">
                              {request.status === "disbursed" ? (
                                <Button
                                  size="sm"
                                  onClick={(e: any) => {
                                    e.stopPropagation();
                                    void (async () => {
                                      try {
                                        setBusyAction("confirm");
                                        await confirmRequestVoucher(id, pv.id);
                                        setNotice({ tone: "success", message: "Disbursement confirmed." });
                                        await load();
                                      } catch (error: any) {
                                        setNotice({
                                          tone: "error",
                                          message: error?.response?.data?.error?.message || "Unable to confirm disbursement.",
                                        });
                                      } finally {
                                        setBusyAction("");
                                      }
                                    })();
                                  }}
                                  disabled={busyAction === "confirm"}
                                >
                                  {busyAction === "confirm" ? "..." : "Confirm"}
                                </Button>
                              ) : null}
                              {request.status === "confirmed" ? (
                                <Button
                                  size="sm"
                                  variant="outline-secondary"
                                  onClick={(e: any) => {
                                    e.stopPropagation();
                                    openRetireModal(pv);
                                  }}
                                  disabled={busyAction === "retire"}
                                >
                                  {busyAction === "retire" ? "..." : "Retire"}
                                </Button>
                              ) : null}
                              {!["disbursed", "confirmed"].includes(request.status) ? (
                                <Button
                                  size="sm"
                                  variant="outline-secondary"
                                  onClick={(e: any) => {
                                    e.stopPropagation();
                                    setSelectedVoucher(pv);
                                  }}
                                >
                                  View
                                </Button>
                              ) : null}
                            </div>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {canEditDraft ? (
                <Button
                  variant="outline-primary"
                  onClick={() => navigate(`/appOld/requests/new?edit=${request?.id}`)}
                >
                  <Lucide icon="FilePenLine" className="w-4 h-4 mr-1" />
                  Edit Draft
                </Button>
              ) : null}
              {canEditDraft ? (
                <Button
                  variant="outline-danger"
                  onClick={() => {
                    void run("delete");
                  }}
                  disabled={busyAction === "delete"}
                >
                  <Lucide icon="Trash2" className="w-4 h-4 mr-1" />
                  {busyAction === "delete" ? "Deleting..." : "Delete Draft"}
                </Button>
              ) : null}
              {actions.filter((action) => action !== "confirm" && action !== "retire").map((action) => (
                <Button className="capitalize"
                  key={action}
                  variant={action === "reject" ? "outline-danger" : "primary"}
                  onClick={() => {
                    void run(action);
                  }}
                  disabled={busyAction === action}
                >
                  {busyAction === action ? "Working..." : getActionLabel(action)}
                </Button>
              ))}
              <Button variant="outline-secondary" onClick={() => void runPdf()} disabled={busyAction === "pdf"}>
                {busyAction === "pdf" ? "Generating..." : "Download Request"}
              </Button>
              <Button variant="outline-secondary" onClick={() => void runFullDocument()} disabled={busyAction === "full_document"}>
                {busyAction === "full_document" ? "Generating..." : "Download Full Document"}
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={showRetireModal} onClose={() => setShowRetireModal(false)}>
        <Dialog.Panel>
          <div className="p-5 space-y-4">
            <div className="text-lg font-medium">Submit Retirement</div>
            {retireTargetVoucher ? (
              <>
                <div className="text-sm rounded border p-3 bg-slate-50">
                  <div><span className="text-slate-500">Voucher:</span> {retireTargetVoucher.voucher_number}</div>
                  <div><span className="text-slate-500">Disbursed:</span> {formatMoney(retireTargetVoucher.amount, "-")}</div>
                  <div><span className="text-slate-500">Already Retired:</span> {formatMoney(retireTargetVoucher.retired_amount, "-")}</div>
                  <div><span className="text-slate-500">Remaining:</span> {formatMoney(retireTargetVoucher.voucher_balance, "-")}</div>
                  {retireTargetVoucher.evidence_file?.public_url ? (
                    <a
                      href={retireTargetVoucher.evidence_file.public_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      View Disbursement Receipt
                    </a>
                  ) : null}
                </div>
                <div>
                  <FormLabel>Retirement Amount</FormLabel>
                  <FormInput
                    type="number"
                    min="0"
                    max={String(retireTargetVoucher.voucher_balance)}
                    value={retireForm.amount}
                    onChange={(e) => setRetireForm((prev) => ({ ...prev, amount: e.target.value }))}
                  />
                  <div className="text-xs text-slate-500 mt-1">You can retire partially or fully.</div>
                </div>
                <div>
                  <FormLabel>Retirement Notes</FormLabel>
                  <FormTextarea
                    rows={3}
                    value={retireForm.notes}
                    onChange={(e) => setRetireForm((prev) => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
                <div>
                  <FormLabel>Retirement Files</FormLabel>
                  <Button variant="outline-secondary" onClick={() => setShowRetirementPicker(true)}>
                    {retireForm.uploaded_files.length ? "Manage Retirement Files" : "Pick Retirement Files"}
                  </Button>
                  <div className="text-xs text-slate-500 mt-1">
                    {retireForm.uploaded_files.length
                      ? `Attached: ${retireForm.uploaded_files.join(", ")}`
                      : "Attach receipts/invoices/proofs"}
                  </div>
                </div>
              </>
            ) : null}
          </div>
          <div className="px-5 pb-5 flex justify-end gap-2">
            <Button variant="outline-secondary" onClick={() => setShowRetireModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => void submitRetirement()}
              disabled={busyAction === "retire"}
            >
              {busyAction === "retire" ? "Submitting..." : "Submit Retirement"}
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>
      <MediaPickerModal
        open={showRetirementPicker}
        onClose={() => setShowRetirementPicker(false)}
        title="Select Retirement Files"
        multiple
        selectedIds={retireForm.retirement_file_ids}
        onSelect={applyRetirementFiles}
      />

      <Dialog open={Boolean(selectedVoucher)} onClose={() => setSelectedVoucher(null)}>
        <Dialog.Panel>
          <div className="p-5 space-y-3">
            <div className="text-lg font-medium">Disbursement Details</div>
            {selectedVoucher ? (
              <>
                <div className="text-sm"><span className="text-slate-500">Voucher:</span> {selectedVoucher.voucher_number}</div>
                <div className="text-sm"><span className="text-slate-500">Amount:</span> {formatMoney(selectedVoucher.amount, "-")}</div>
                <div className="text-sm"><span className="text-slate-500">Retired Amount:</span> {formatMoney(selectedVoucher.retired_amount, "-")}</div>
                <div className="text-sm"><span className="text-slate-500">PV Balance:</span> {formatMoney(selectedVoucher.voucher_balance, "-")}</div>
                <div className="text-sm"><span className="text-slate-500">Request Balance:</span> {formatMoney(selectedVoucher.request_balance, "-")}</div>
                <div className="text-sm"><span className="text-slate-500">Method:</span> {formatPaymentMethod(selectedVoucher.method)}</div>
                <div className="text-sm"><span className="text-slate-500">Transaction Ref:</span> {selectedVoucher.transaction_ref || "-"}</div>
                <div className="text-sm"><span className="text-slate-500">Note:</span> {selectedVoucher.note || "-"}</div>
                <div className="text-sm"><span className="text-slate-500">Disbursed At:</span> {formatDisplayDate(selectedVoucher.disbursed_at)}</div>
                <div className="text-sm"><span className="text-slate-500">Retirement Status:</span> {selectedVoucher.retirement_status.replaceAll("_", " ")}</div>
                <div className="text-sm"><span className="text-slate-500">Retired At:</span> {formatDisplayDate(selectedVoucher.retired_at)}</div>
                <div className="text-sm"><span className="text-slate-500">Verified At:</span> {formatDisplayDate(selectedVoucher.verified_at)}</div>
                {selectedVoucher.evidence_files?.length ? (
                  <div className="flex flex-col gap-1">
                    {selectedVoucher.evidence_files.map((file) => (
                      <a
                        key={file.id}
                        href={file.public_url || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {file.file_name}
                      </a>
                    ))}
                  </div>
                ) : null}
                {selectedVoucher.retirement_files.length > 0 ? (
                  <div className="pt-2 mt-2 border-t">
                    <div className="text-sm font-medium mb-1">Retirement Files</div>
                    <div className="space-y-1">
                      {selectedVoucher.retirement_files.map((file) => (
                        <div key={file.id}>
                          {file.public_url ? (
                            <a
                              href={file.public_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              {file.file_name}
                            </a>
                          ) : (
                            <span className="text-sm">{file.file_name}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
          <div className="px-5 pb-5 flex justify-end">
            <Button
              variant="outline-secondary"
              onClick={() => void runPv()}
              disabled={busyAction === "pv" || !selectedVoucher}
              className="mr-2"
            >
              {busyAction === "pv" ? "Downloading..." : "Download PV"}
            </Button>
            <Button variant="outline-secondary" onClick={() => setSelectedVoucher(null)}>
              Close
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>
    </>
  );
}

export default RequestDetailPage;
