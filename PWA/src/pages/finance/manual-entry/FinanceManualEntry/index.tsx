import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import { FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { useAppSelector } from "@/stores/hooks";
import { listUsers } from "@/services/users";
import { listRequestGroups, listRequestTypes, createManualRequestEntry, updateManualRequestEntry, deleteManualRequestEntry, checkManualRequestNumber, getRequest, generateRequestPdf, generateRequestPv, generateFullRequestPackage, generateRequestPackageWithAttachments, generateVoucherPackageWithAttachments, type RequestItemInput } from "@/services/requests";
import { listTeams } from "@/services/teams";
import { listOrganizations } from "@/services/organizations";
import { listProjects } from "@/services/projects";
import { listManagedTaxonomies, type ManagedTaxonomy } from "@/services/taxonomy";
import { formatMoney } from "@/utils/formatting";
import { uploadFileAsset } from "@/services/files";
import { listFinanceRequestPaymentVouchers } from "@/services/finance";

type Option = { id: string; name: string };
type RequestTypeOption = Option & { categoryKey?: string | null };

type ManualItem = RequestItemInput;
type ManualDisbursement = {
  voucher_number: string;
  amount: number;
  method: string;
  transaction_ref: string;
  note: string;
  disbursed_at: string;
  evidence_file_id?: string;
  retired_amount?: number;
  retirement_status?: string;
  retirement_file_ids_text?: string;
};

const downloadBase64File = (fileName: string, mimeType: string, contentBase64: string) => {
  const bytes = atob(contentBase64);
  const array = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) array[i] = bytes.charCodeAt(i);
  const blob = new Blob([array], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

function FinanceManualEntryPage() {
  const navigate = useNavigate();
  const auth = useAppSelector((s) => s.auth);
  const roles = (auth.user?.roles ?? []).map((r) => String(r).toLowerCase());
  const allowed = roles.some((r) => ["finance_manager", "finance-manager", "admin", "super-admin", "accountant"].includes(r));

  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string>("");
  const [voucherId, setVoucherId] = useState<string>("");
  const [lookupId, setLookupId] = useState<string>("");
  const [editingId, setEditingId] = useState<string>("");
  const [checkingNumber, setCheckingNumber] = useState(false);
  const [numberExists, setNumberExists] = useState<{ exists: boolean; requestId: string | null }>({
    exists: false,
    requestId: null,
  });

  const [staffOptions, setStaffOptions] = useState<Option[]>([]);
  const [typeOptions, setTypeOptions] = useState<RequestTypeOption[]>([]);
  const [teamOptions, setTeamOptions] = useState<Option[]>([]);
  const [organizationOptions, setOrganizationOptions] = useState<Option[]>([]);
  const [projectOptions, setProjectOptions] = useState<Option[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<Option[]>([]);
  const [taxonomyOptions, setTaxonomyOptions] = useState<ManagedTaxonomy[]>([]);

  const [form, setForm] = useState({
    request_type_id: "",
    staff_id: "",
    request_id: "",
    team_id: "",
    organization_id: "",
    project_id: "",
    category_id: "",
    status: "completed",
    created_at: "",
    due_date: "",
    purpose: "",
    currency: "NGN",
    approvals: {
      team_lead_name: "",
      team_lead_date: "",
      accountant_name: "",
      accountant_date: "",
      coo_name: "",
      coo_date: "",
      ed_name: "",
      ed_date: "",
      include_ed: false,
    },
  });

  const [items, setItems] = useState<ManualItem[]>([
    { description: "", amount: 0, quantity: 1, notes: "", file_id: "" },
  ]);
  const [disbursements, setDisbursements] = useState<ManualDisbursement[]>([
    {
      voucher_number: "",
      amount: 0,
      method: "bank_transfer",
      transaction_ref: "",
      note: "",
      disbursed_at: "",
      evidence_file_id: "",
      retired_amount: 0,
      retirement_status: "not_retired",
      retirement_file_ids_text: "",
    },
  ]);

  const itemsTotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.amount || 0) * Number(item.quantity || 1), 0),
    [items]
  );

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [users, groups, teams, orgs, projects, taxonomies] = await Promise.all([
          listUsers({ page: 1, per_page: 200 }),
          listRequestGroups(),
          listTeams({ active_only: false }),
          listOrganizations({ is_active: true }),
          listProjects({ active_only: false }),
          listManagedTaxonomies({ module: "finance", include_inactive: false }),
        ]);
        setStaffOptions(
          users.data.map((u) => ({
            id: u.id,
            name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username || u.email,
          }))
        );
        const financeGroup = groups.find((g) => g.code?.toLowerCase() === "fin" || g.name?.toLowerCase() === "finance");
        const requestTypes = await listRequestTypes(financeGroup ? { group_id: financeGroup.id } : undefined);
        setTypeOptions(requestTypes.map((t) => ({ id: t.id, name: t.name, categoryKey: t.category_key })));
        setTeamOptions(teams.map((t) => ({ id: t.id, name: t.name })));
        setOrganizationOptions(orgs.map((o) => ({ id: o.id, name: o.name })));
        setProjectOptions(projects.map((p) => ({ id: p.id, name: p.name })));
        setTaxonomyOptions(taxonomies);
      } catch (error: any) {
        setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load manual entry options." });
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    const manualNumber = String(form.request_id || "").trim();
    if (!manualNumber) {
      setNumberExists({ exists: false, requestId: null });
      return;
    }
    if (!/^\d+$/.test(manualNumber)) {
      setNumberExists({ exists: true, requestId: null });
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setCheckingNumber(true);
        const result = await checkManualRequestNumber(manualNumber, {
          request_type_id: form.request_type_id || undefined,
          exclude_id: editingId || undefined,
        });
        setNumberExists({ exists: Boolean(result.exists), requestId: result.request_id });
      } catch {
        setNumberExists({ exists: false, requestId: null });
      } finally {
        setCheckingNumber(false);
      }
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [form.request_id, form.request_type_id, editingId]);

  useEffect(() => {
    const selectedType = typeOptions.find((item) => item.id === form.request_type_id);
    const preferredTaxonomyKey = selectedType?.categoryKey || "finance_request_category";
    const preferred = taxonomyOptions.find((item) => item.key === preferredTaxonomyKey);
    const fallback = taxonomyOptions.find((item) => item.key === "finance_request_category") ?? taxonomyOptions[0];
    const activeTaxonomy = preferred ?? fallback;
    const options = (activeTaxonomy?.terms ?? []).map((term) => ({ id: term.id, name: term.label }));
    setCategoryOptions(options);
    if (form.category_id && !options.some((option) => option.id === form.category_id)) {
      setForm((prev) => ({ ...prev, category_id: "" }));
    }
  }, [form.request_type_id, form.category_id, typeOptions, taxonomyOptions]);

  const saveManualRequest = async () => {
    if (!form.request_type_id || !form.staff_id) {
      setNotice({ tone: "warning", message: "Request type and staff are required." });
      return;
    }
    if (form.request_id && !/^\d+$/.test(form.request_id)) {
      setNotice({ tone: "warning", message: "Request ID must be digits only (e.g. 25)." });
      return;
    }
    if (numberExists.exists && numberExists.requestId && numberExists.requestId !== editingId) {
      setNotice({ tone: "warning", message: `Request ID already exists (Request ID ${numberExists.requestId}).` });
      return;
    }
    try {
      setSaving(true);
      setNotice(null);
      const approvals = [
        { role: "team_lead", name: form.approvals.team_lead_name, date: form.approvals.team_lead_date, done: !!form.approvals.team_lead_name },
        { role: "accountant", name: form.approvals.accountant_name, date: form.approvals.accountant_date, done: !!form.approvals.accountant_name },
        { role: "coo", name: form.approvals.coo_name, date: form.approvals.coo_date, done: !!form.approvals.coo_name },
        ...(form.approvals.include_ed
          ? [{ role: "ed", name: form.approvals.ed_name, date: form.approvals.ed_date, done: !!form.approvals.ed_name }]
          : []),
      ];
      const selectedProjectName =
        projectOptions.find((project) => project.id === form.project_id)?.name || undefined;

      const payload = {
        request_type_id: form.request_type_id,
        staff_id: form.staff_id,
        request_id: form.request_id || undefined,
        team_id: form.team_id || undefined,
        organization_id: form.organization_id || undefined,
        status: form.status,
        created_at: form.created_at || undefined,
        currency: form.currency,
        total_amount: itemsTotal,
        data: {
          purpose: form.purpose || undefined,
          due_date: form.due_date || undefined,
          category_id: form.category_id || undefined,
          project_name: selectedProjectName,
          project_id: form.project_id || undefined,
          team_id: form.team_id || undefined,
          organization_id: form.organization_id || undefined,
        },
        approvals,
        items: items.map((item) => ({
          description: item.description,
          amount: Number(item.amount || 0),
          quantity: Number(item.quantity || 1),
          notes: item.notes,
          file_id: item.file_id || undefined,
        })),
        disbursements: disbursements
          .filter((d) => d.voucher_number && Number(d.amount) > 0)
          .map((d) => ({
            voucher_number: d.voucher_number,
            amount: Number(d.amount),
            method: d.method || undefined,
            transaction_ref: d.transaction_ref || undefined,
            note: d.note || undefined,
            disbursed_at: d.disbursed_at || undefined,
            evidence_file_id: d.evidence_file_id || undefined,
            retired_amount: Number(d.retired_amount || 0),
            retirement_status: d.retirement_status || undefined,
            retirement_file_ids: (d.retirement_file_ids_text || "")
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean),
          })),
      };
      const created = editingId
        ? await updateManualRequestEntry(editingId, payload)
        : await createManualRequestEntry(payload);

      setRequestId(created.id);
      setEditingId(created.id);
      const firstVoucher = (created as any)?.payment_vouchers?.[0]?.id || "";
      setVoucherId(firstVoucher);
      setNotice({ tone: "success", message: editingId ? "Manual request updated successfully." : "Manual request saved successfully." });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save manual request." });
    } finally {
      setSaving(false);
    }
  };

  const loadForEdit = async () => {
    if (!lookupId.trim()) return;
    try {
      setLoading(true);
      const req = await getRequest(lookupId.trim());
      const pvs = await listFinanceRequestPaymentVouchers(lookupId.trim()).catch(() => []);
      const data = (req.data || {}) as Record<string, any>;
      const manualApprovals = Array.isArray(data.manual_approvals) ? data.manual_approvals : [];
      const findApproval = (role: string) =>
        manualApprovals.find((row: any) => String(row.role || "").toLowerCase() === role);

      setEditingId(req.id);
      setRequestId(req.id);
      setForm((prev) => ({
        ...prev,
        request_type_id: req.request_type?.id || "",
        staff_id: req.creator?.id || "",
        request_id: String(req.id || "").trim(),
        team_id: String(data.team_id || ""),
        organization_id: String(data.organization_id || ""),
        project_id: String(data.project_id || ""),
        category_id: String(data.category_id || ""),
        status: req.status || "completed",
        created_at: req.created_at ? String(req.created_at).slice(0, 10) : "",
        due_date: data.due_date ? String(data.due_date).slice(0, 10) : "",
        purpose: String(data.purpose || ""),
        currency: req.currency || "NGN",
        approvals: {
          team_lead_name: findApproval("team_lead")?.name || "",
          team_lead_date: findApproval("team_lead")?.date ? String(findApproval("team_lead").date).slice(0, 10) : "",
          accountant_name: findApproval("accountant")?.name || "",
          accountant_date: findApproval("accountant")?.date ? String(findApproval("accountant").date).slice(0, 10) : "",
          coo_name: findApproval("coo")?.name || "",
          coo_date: findApproval("coo")?.date ? String(findApproval("coo").date).slice(0, 10) : "",
          ed_name: findApproval("ed")?.name || "",
          ed_date: findApproval("ed")?.date ? String(findApproval("ed").date).slice(0, 10) : "",
          include_ed: Boolean(findApproval("ed")),
        },
      }));

      setItems(
        (req.items || []).map((item) => ({
          description: item.description,
          amount: Number(item.amount || 0),
          quantity: Number(item.quantity || 1),
          notes: item.notes || "",
          file_id: item.file_id || "",
        }))
      );
      setDisbursements(
        pvs.map((pv) => ({
          voucher_number: pv.voucher_number,
          amount: Number(pv.amount || 0),
          method: pv.method || "bank_transfer",
          transaction_ref: pv.transaction_ref || "",
          note: pv.note || "",
          disbursed_at: pv.disbursed_at ? String(pv.disbursed_at).slice(0, 10) : "",
          evidence_file_id: pv.evidence_file?.id || "",
          retired_amount: Number(pv.retired_amount || 0),
          retirement_status: pv.retirement_status || "not_retired",
          retirement_file_ids_text: (pv.retirement_files || []).map((f) => f.id).join(", "),
        }))
      );
      setNotice({ tone: "success", message: `Loaded request ${req.id} for edit.` });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to find request by ID." });
    } finally {
      setLoading(false);
    }
  };

  const onDeleteManual = async () => {
    if (!editingId) return;
    const ok = window.confirm(`Delete manual request ${editingId}? This cannot be undone.`);
    if (!ok) return;
    try {
      setSaving(true);
      await deleteManualRequestEntry(editingId);
      setNotice({ tone: "success", message: "Manual request deleted." });
      setEditingId("");
      setRequestId("");
      setLookupId("");
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to delete request." });
    } finally {
      setSaving(false);
    }
  };

  const uploadForItem = async (index: number, file: File | null) => {
    if (!file) return;
    try {
      setUploading(`item-${index}`);
      const asset = await uploadFileAsset(file, { metadata: { source: "manual_request_item" } });
      setItems((prev) => prev.map((row, i) => (i === index ? { ...row, file_id: asset.id } : row)));
      setNotice({ tone: "success", message: `Uploaded ${file.name}` });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to upload file." });
    } finally {
      setUploading(null);
    }
  };

  const uploadForPvEvidence = async (index: number, file: File | null) => {
    if (!file) return;
    try {
      setUploading(`pv-${index}`);
      const asset = await uploadFileAsset(file, { metadata: { source: "manual_pv_evidence" } });
      setDisbursements((prev) => prev.map((row, i) => (i === index ? { ...row, evidence_file_id: asset.id } : row)));
      setNotice({ tone: "success", message: `Uploaded ${file.name}` });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to upload file." });
    } finally {
      setUploading(null);
    }
  };

  const uploadForRetirement = async (index: number, file: File | null) => {
    if (!file) return;
    try {
      setUploading(`ret-${index}`);
      const asset = await uploadFileAsset(file, { metadata: { source: "manual_retirement_file" } });
      setDisbursements((prev) =>
        prev.map((row, i) => {
          if (i !== index) return row;
          const existing = (row.retirement_file_ids_text || "")
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean);
          return { ...row, retirement_file_ids_text: Array.from(new Set([...existing, asset.id])).join(", ") };
        })
      );
      setNotice({ tone: "success", message: `Uploaded ${file.name}` });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to upload file." });
    } finally {
      setUploading(null);
    }
  };

  if (!allowed) {
    return (
      <div className="mt-8">
        <AppNotice tone="error" message="This page is restricted to Finance Manager role." />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Finance Legacy Manual Entry</h2>
        <Button variant="outline-secondary" onClick={() => navigate("/app/finance")}>
          <Lucide icon="ChevronLeft" className="w-4 h-4 mr-1" />
          Back
        </Button>
      </div>
      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="box mt-5 p-5 space-y-6">
        <div className="grid grid-cols-12 gap-3 rounded-md border p-3">
          <div className="col-span-12 md:col-span-6">
            <FormLabel>Search Existing Request by ID</FormLabel>
            <FormInput
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="e.g. 3001"
            />
          </div>
          <div className="col-span-12 md:col-span-6 flex items-end gap-2">
            <Button variant="outline-primary" onClick={() => void loadForEdit()} disabled={!lookupId || loading}>
              Search & Load
            </Button>
            {editingId ? (
              <Button variant="danger" onClick={() => void onDeleteManual()} disabled={saving}>
                Delete
              </Button>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-4"><FormLabel>Request Type</FormLabel><FormSelect value={form.request_type_id} onChange={(e) => setForm((p) => ({ ...p, request_type_id: e.target.value }))}><option value="">Select</option>{typeOptions.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</FormSelect></div>
          <div className="col-span-12 md:col-span-4"><FormLabel>Staff</FormLabel><FormSelect value={form.staff_id} onChange={(e) => setForm((p) => ({ ...p, staff_id: e.target.value }))}><option value="">Select</option>{staffOptions.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</FormSelect></div>
          <div className="col-span-12 md:col-span-4">
            <FormLabel>Request ID (Digits)</FormLabel>
            <FormInput
              type="number"
              value={form.request_id}
              onChange={(e) => setForm((p) => ({ ...p, request_id: e.target.value.replace(/[^\d]/g, "") }))}
              placeholder="25"
            />
            <div className="mt-1 text-xs text-slate-500">
              {checkingNumber
                ? "Checking number..."
                : numberExists.exists
                  ? numberExists.requestId
                    ? `Already exists (Request ID ${numberExists.requestId})`
                    : "Invalid request number"
                  : "Available"}
            </div>
          </div>
          <div className="col-span-12 md:col-span-3"><FormLabel>Status</FormLabel><FormSelect value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}><option value="completed">Completed</option><option value="retired">Retired</option><option value="confirmed">Confirmed</option><option value="disbursed">Disbursed</option><option value="cleared">Cleared</option><option value="approval">Approval</option></FormSelect></div>
          <div className="col-span-12 md:col-span-3"><FormLabel>Created At</FormLabel><FormInput type="date" value={form.created_at} onChange={(e) => setForm((p) => ({ ...p, created_at: e.target.value }))} /></div>
          <div className="col-span-12 md:col-span-3"><FormLabel>Due Date</FormLabel><FormInput type="date" value={form.due_date} onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))} /></div>
          <div className="col-span-12 md:col-span-3"><FormLabel>Currency</FormLabel><FormInput value={form.currency} onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value.toUpperCase() }))} /></div>
          <div className="col-span-12 md:col-span-4"><FormLabel>Organization</FormLabel><FormSelect value={form.organization_id} onChange={(e) => setForm((p) => ({ ...p, organization_id: e.target.value }))}><option value="">Select</option>{organizationOptions.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</FormSelect></div>
          <div className="col-span-12 md:col-span-4"><FormLabel>Department / Team</FormLabel><FormSelect value={form.team_id} onChange={(e) => setForm((p) => ({ ...p, team_id: e.target.value }))}><option value="">Select</option>{teamOptions.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</FormSelect></div>
          <div className="col-span-12 md:col-span-4"><FormLabel>Project</FormLabel><FormSelect value={form.project_id} onChange={(e) => setForm((p) => ({ ...p, project_id: e.target.value }))}><option value="">Select</option>{projectOptions.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</FormSelect></div>
          <div className="col-span-12 md:col-span-4"><FormLabel>Category</FormLabel><FormSelect value={form.category_id} onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}><option value="">Select</option>{categoryOptions.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</FormSelect></div>
          <div className="col-span-12 md:col-span-8"><FormLabel>Purpose</FormLabel><FormTextarea rows={2} value={form.purpose} onChange={(e) => setForm((p) => ({ ...p, purpose: e.target.value }))} /></div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2"><h4 className="font-medium">Items</h4><Button variant="outline-secondary" onClick={() => setItems((p) => [...p, { description: "", amount: 0, quantity: 1, notes: "", file_id: "" }])}>Add Item</Button></div>
          {items.map((item, idx) => (
            <div key={`item-${idx}`} className="grid grid-cols-12 gap-3 mb-3">
              <div className="col-span-12 md:col-span-4"><FormInput placeholder="Item" value={item.description} onChange={(e) => setItems((p) => p.map((row, i) => i === idx ? { ...row, description: e.target.value } : row))} /></div>
              <div className="col-span-6 md:col-span-2"><FormInput type="number" placeholder="Qty" value={item.quantity as number} onChange={(e) => setItems((p) => p.map((row, i) => i === idx ? { ...row, quantity: Number(e.target.value || 1) } : row))} /></div>
              <div className="col-span-6 md:col-span-2"><FormInput type="number" placeholder="Price" value={item.amount} onChange={(e) => setItems((p) => p.map((row, i) => i === idx ? { ...row, amount: Number(e.target.value || 0) } : row))} /></div>
              <div className="col-span-12 md:col-span-3">
                <FormInput placeholder="Invoice file_id" value={item.file_id || ""} onChange={(e) => setItems((p) => p.map((row, i) => i === idx ? { ...row, file_id: e.target.value } : row))} />
                <div className="mt-2">
                  <input type="file" onChange={(e) => void uploadForItem(idx, e.target.files?.[0] || null)} />
                  {uploading === `item-${idx}` ? <div className="text-xs text-slate-500 mt-1">Uploading...</div> : null}
                </div>
              </div>
              <div className="col-span-12 md:col-span-1"><Button variant="danger" onClick={() => setItems((p) => p.filter((_, i) => i !== idx))}>×</Button></div>
            </div>
          ))}
          <div className="text-right font-medium">Items Total: {formatMoney(itemsTotal, form.currency || "NGN")}</div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2"><h4 className="font-medium">Disbursement / Retirement</h4><Button variant="outline-secondary" onClick={() => setDisbursements((p) => [...p, { voucher_number: "", amount: 0, method: "bank_transfer", transaction_ref: "", note: "", disbursed_at: "", evidence_file_id: "", retired_amount: 0, retirement_status: "not_retired", retirement_file_ids_text: "" }])}>Add PV</Button></div>
          {disbursements.map((row, idx) => (
            <div key={`pv-${idx}`} className="grid grid-cols-12 gap-3 mb-4 p-3 border rounded">
              <div className="col-span-12 md:col-span-3"><FormLabel>Voucher No</FormLabel><FormInput value={row.voucher_number} onChange={(e) => setDisbursements((p) => p.map((x, i) => i === idx ? { ...x, voucher_number: e.target.value } : x))} /></div>
              <div className="col-span-6 md:col-span-2"><FormLabel>Amount</FormLabel><FormInput type="number" value={row.amount} onChange={(e) => setDisbursements((p) => p.map((x, i) => i === idx ? { ...x, amount: Number(e.target.value || 0) } : x))} /></div>
              <div className="col-span-6 md:col-span-2"><FormLabel>Method</FormLabel><FormSelect value={row.method} onChange={(e) => setDisbursements((p) => p.map((x, i) => i === idx ? { ...x, method: e.target.value } : x))}><option value="bank_transfer">Bank Transfer</option><option value="cash">Cash</option><option value="cheque">Cheque</option></FormSelect></div>
              <div className="col-span-12 md:col-span-3"><FormLabel>Transaction Ref</FormLabel><FormInput value={row.transaction_ref} onChange={(e) => setDisbursements((p) => p.map((x, i) => i === idx ? { ...x, transaction_ref: e.target.value } : x))} /></div>
              <div className="col-span-12 md:col-span-2"><FormLabel>Date</FormLabel><FormInput type="date" value={row.disbursed_at} onChange={(e) => setDisbursements((p) => p.map((x, i) => i === idx ? { ...x, disbursed_at: e.target.value } : x))} /></div>
              <div className="col-span-12 md:col-span-3"><FormLabel>PV evidence file_id</FormLabel><FormInput value={row.evidence_file_id || ""} onChange={(e) => setDisbursements((p) => p.map((x, i) => i === idx ? { ...x, evidence_file_id: e.target.value } : x))} />
                <div className="mt-2">
                  <input type="file" onChange={(e) => void uploadForPvEvidence(idx, e.target.files?.[0] || null)} />
                  {uploading === `pv-${idx}` ? <div className="text-xs text-slate-500 mt-1">Uploading...</div> : null}
                </div>
              </div>
              <div className="col-span-6 md:col-span-2"><FormLabel>Retired Amount</FormLabel><FormInput type="number" value={row.retired_amount || 0} onChange={(e) => setDisbursements((p) => p.map((x, i) => i === idx ? { ...x, retired_amount: Number(e.target.value || 0) } : x))} /></div>
              <div className="col-span-6 md:col-span-2"><FormLabel>Retirement Status</FormLabel><FormSelect value={row.retirement_status || "not_retired"} onChange={(e) => setDisbursements((p) => p.map((x, i) => i === idx ? { ...x, retirement_status: e.target.value } : x))}><option value="not_retired">Pending</option><option value="partial">Partial</option><option value="retired">Retired</option><option value="verified">Confirmed</option></FormSelect></div>
              <div className="col-span-12 md:col-span-5"><FormLabel>Retirement file ids (comma separated)</FormLabel><FormInput value={row.retirement_file_ids_text || ""} onChange={(e) => setDisbursements((p) => p.map((x, i) => i === idx ? { ...x, retirement_file_ids_text: e.target.value } : x))} />
                <div className="mt-2">
                  <input type="file" onChange={(e) => void uploadForRetirement(idx, e.target.files?.[0] || null)} />
                  {uploading === `ret-${idx}` ? <div className="text-xs text-slate-500 mt-1">Uploading...</div> : null}
                </div>
              </div>
              <div className="col-span-12 md:col-span-12"><FormLabel>Note</FormLabel><FormInput value={row.note} onChange={(e) => setDisbursements((p) => p.map((x, i) => i === idx ? { ...x, note: e.target.value } : x))} /></div>
            </div>
          ))}
        </div>

        <div>
          <h4 className="font-medium mb-2">Manual Approvals</h4>
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-6 md:col-span-3"><FormLabel>Team Lead Name</FormLabel><FormInput value={form.approvals.team_lead_name} onChange={(e) => setForm((p) => ({ ...p, approvals: { ...p.approvals, team_lead_name: e.target.value } }))} /></div>
            <div className="col-span-6 md:col-span-3"><FormLabel>Team Lead Date</FormLabel><FormInput type="date" value={form.approvals.team_lead_date} onChange={(e) => setForm((p) => ({ ...p, approvals: { ...p.approvals, team_lead_date: e.target.value } }))} /></div>
            <div className="col-span-6 md:col-span-3"><FormLabel>Accountant Name</FormLabel><FormInput value={form.approvals.accountant_name} onChange={(e) => setForm((p) => ({ ...p, approvals: { ...p.approvals, accountant_name: e.target.value } }))} /></div>
            <div className="col-span-6 md:col-span-3"><FormLabel>Accountant Date</FormLabel><FormInput type="date" value={form.approvals.accountant_date} onChange={(e) => setForm((p) => ({ ...p, approvals: { ...p.approvals, accountant_date: e.target.value } }))} /></div>
            <div className="col-span-6 md:col-span-3"><FormLabel>COO Name</FormLabel><FormInput value={form.approvals.coo_name} onChange={(e) => setForm((p) => ({ ...p, approvals: { ...p.approvals, coo_name: e.target.value } }))} /></div>
            <div className="col-span-6 md:col-span-3"><FormLabel>COO Date</FormLabel><FormInput type="date" value={form.approvals.coo_date} onChange={(e) => setForm((p) => ({ ...p, approvals: { ...p.approvals, coo_date: e.target.value } }))} /></div>
            <div className="col-span-12 md:col-span-3 flex items-end"><label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.approvals.include_ed} onChange={(e) => setForm((p) => ({ ...p, approvals: { ...p.approvals, include_ed: e.target.checked } }))} /><span>Include ED</span></label></div>
            {form.approvals.include_ed ? (
              <>
                <div className="col-span-6 md:col-span-3"><FormLabel>ED Name</FormLabel><FormInput value={form.approvals.ed_name} onChange={(e) => setForm((p) => ({ ...p, approvals: { ...p.approvals, ed_name: e.target.value } }))} /></div>
                <div className="col-span-6 md:col-span-3"><FormLabel>ED Date</FormLabel><FormInput type="date" value={form.approvals.ed_date} onChange={(e) => setForm((p) => ({ ...p, approvals: { ...p.approvals, ed_date: e.target.value } }))} /></div>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button disabled={loading || saving} onClick={saveManualRequest}>
            {saving ? "Saving..." : editingId ? "Update Manual Request" : "Save Manual Request"}
          </Button>
          <Button variant="outline-primary" disabled={!requestId} onClick={async () => {
            if (!requestId) return;
            const file = await generateRequestPdf(requestId);
            downloadBase64File(file.file_name, file.mime_type, file.content_base64);
          }}>
            Download Request PDF
          </Button>
          <Button variant="outline-primary" disabled={!requestId} onClick={async () => {
            if (!requestId) return;
            const file = await generateRequestPv(requestId);
            downloadBase64File(file.file_name, file.mime_type, file.content_base64);
          }}>
            Download PV PDF
          </Button>
          <Button variant="outline-secondary" disabled={!requestId} onClick={async () => {
            if (!requestId) return;
            const zip = await generateRequestPackageWithAttachments(requestId);
            downloadBase64File(zip.file_name, zip.mime_type, zip.content_base64);
          }}>
            Request + Attachments
          </Button>
          <Button variant="outline-secondary" disabled={!requestId || !voucherId} onClick={async () => {
            if (!requestId || !voucherId) return;
            const zip = await generateVoucherPackageWithAttachments(requestId, voucherId);
            downloadBase64File(zip.file_name, zip.mime_type, zip.content_base64);
          }}>
            PV + Retirement Attachments
          </Button>
          <Button variant="outline-secondary" disabled={!requestId} onClick={async () => {
            if (!requestId) return;
            const pkg = await generateFullRequestPackage(requestId, { delivery: "download" });
            if (pkg.content_base64 && pkg.mime_type) {
              downloadBase64File(pkg.file_name, pkg.mime_type, pkg.content_base64);
            }
          }}>
            Full Package ZIP
          </Button>
        </div>
        {requestId ? <div className="text-slate-600 text-sm">Saved Request ID: {requestId}. For PV attachment ZIP, enter a voucher id below if needed.</div> : null}
        {requestId ? (
          <div className="max-w-md">
            <FormLabel>Voucher ID (for PV ZIP download)</FormLabel>
            <FormInput value={voucherId} onChange={(e) => setVoucherId(e.target.value)} placeholder="Paste voucher UUID" />
          </div>
        ) : null}
      </div>
    </>
  );
}

export default FinanceManualEntryPage;
