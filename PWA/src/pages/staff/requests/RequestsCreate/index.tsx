import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import { FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import NewPortalNotice from "@/components/NewPortalNotice";
import {
  createRequest,
  getMyLeaveBalance,
  getRequest,
  listRequestTypes,
  submitRequest,
  updateRequest,
  type RequestItemInput,
  type RequestTypeOption,
} from "@/services/requests";
import { listProjects } from "@/services/projects";
import { listMyOrganizations } from "@/services/organizations";
import type { FileAssetRecord } from "@/services/files";
import { listTeams, type TeamOption } from "@/services/teams";
import { listEntityTags, listManagedTaxonomies, replaceEntityTags, type TagTerm } from "@/services/taxonomy";
import { getMyProfile } from "@/services/profile";
import { formatMoney } from "@/utils/formatting";
import MediaPickerModal from "@/components/Media/MediaPickerModal";
import TagPicker from "@/components/Tags/TagPicker";

type CategoryTermOption = { id: string; value: string; label: string };

type CreateItemState = RequestItemInput & {
  unit_price?: number;
  category?: string;
  file_names?: string[];
};

type CreateFormState = {
  request_type_id: string;
  reimbursement: boolean;
  purpose: string;
  category_id: string;
  leave_start_date: string;
  leave_end_date: string;
  leave_days_requested: string;
  leave_handover_user_id: string;
  leave_handover_notes: string;
  project_id: string;
  team_id: string;
  organization_id: string;
  due_date: string;
  items: CreateItemState[];
};

const defaultItem: CreateItemState = {
  description: "",
  unit_price: 0,
  amount: 0,
  quantity: 1,
  notes: "",
  file_id: undefined,
  file_ids: [],
  file_names: [],
};

const defaultForm: CreateFormState = {
  request_type_id: "",
  reimbursement: false,
  purpose: "",
  category_id: "",
  leave_start_date: "",
  leave_end_date: "",
  leave_days_requested: "",
  leave_handover_user_id: "",
  leave_handover_notes: "",
  project_id: "",
  team_id: "",
  organization_id: "",
  due_date: "",
  items: [{ ...defaultItem }],
};

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off", ""].includes(normalized)) return false;
  }
  return Boolean(value);
}

function RequestsCreatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const pathKind = location.pathname.includes("/requests/finance/new")
    ? "financial"
    : location.pathname.includes("/requests/leave/new")
      ? "leave"
      : "all";
  const kind = (searchParams.get("kind") || pathKind || "all").toLowerCase();
  const editId = searchParams.get("edit") || "";
  const [types, setTypes] = useState<RequestTypeOption[]>([]);
  const [projectOptions, setProjectOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [organizationOptions, setOrganizationOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [teamOptions, setTeamOptions] = useState<TeamOption[]>([]);
  const [taxonomyMap, setTaxonomyMap] = useState<Record<string, CategoryTermOption[]>>({});
  const [categoryOptions, setCategoryOptions] = useState<CategoryTermOption[]>([]);

  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateFormState>(defaultForm);
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);
  const [tags, setTags] = useState<TagTerm[]>([]);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [myUserId, setMyUserId] = useState("");
  const [editingRequestId, setEditingRequestId] = useState("");

  const selectedRequestType = useMemo(
    () => types.find((type) => type.id === form.request_type_id),
    [types, form.request_type_id]
  );
  const isLeaveType = (type: RequestTypeOption) => {
    const categoryKey = String(type.category_key || "").toLowerCase();
    const typeName = String(type.name || "").toLowerCase();
    const schema = (type.form_schema || {}) as Record<string, unknown>;
    const schemaLeaveTypeKey = String(schema.leave_type_key || "").trim().toLowerCase();
    return categoryKey.includes("leave") || typeName.includes("leave") || schemaLeaveTypeKey.length > 0;
  };
  const filteredTypeOptions = useMemo(() => {
    if (kind === "all") return types;
    return types.filter((type) => (kind === "leave" ? isLeaveType(type) : !isLeaveType(type)));
  }, [types, kind]);

  const projectRequired = useMemo(() => {
    return Boolean((selectedRequestType?.form_schema as any)?.project_required);
  }, [selectedRequestType]);
  const selectedProjectName = useMemo(() => {
    if (!form.project_id) return "";
    return projectOptions.find((project) => project.id === form.project_id)?.name || "";
  }, [form.project_id, projectOptions]);
  const isLeaveRequest = useMemo(() => {
    if (kind === "leave") return true;
    return selectedRequestType ? isLeaveType(selectedRequestType) : false;
  }, [selectedRequestType, kind]);
  const selectedLeaveTypeKey = useMemo(() => {
    const schema = (selectedRequestType?.form_schema || {}) as Record<string, unknown>;
    const fromSchema = String(schema.leave_type_key || "").trim().toLowerCase();
    if (fromSchema) return fromSchema;
    const fallbackName = String(selectedRequestType?.name || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    return fallbackName || "annual_leave";
  }, [selectedRequestType]);
  const leaveRules = useMemo(() => {
    const schema = (selectedRequestType?.form_schema || {}) as Record<string, unknown>;
    const minNoticeDays = Number(schema.min_notice_days ?? 0);
    const maxDaysPerRequest = Number(schema.max_days_per_request ?? 0);
    return {
      minNoticeDays: Number.isFinite(minNoticeDays) && minNoticeDays > 0 ? minNoticeDays : 0,
      maxDaysPerRequest: Number.isFinite(maxDaysPerRequest) && maxDaysPerRequest > 0 ? maxDaysPerRequest : 0,
    };
  }, [selectedRequestType]);

  const [leaveBalance, setLeaveBalance] = useState<number | null>(null);
  const requestedLeaveDays = useMemo(() => {
    if (!form.leave_start_date || !form.leave_end_date) return 0;
    const start = new Date(form.leave_start_date);
    const end = new Date(form.leave_end_date);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) return 0;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  }, [form.leave_start_date, form.leave_end_date]);
  const handoverColleagueOptions = useMemo(() => {
    const sourceMembers = form.team_id
      ? (teamOptions.find((option) => option.id === form.team_id)?.members ?? [])
      : teamOptions.flatMap((option) => option.members ?? []);
    const byId = new Map<string, { id: string; name: string }>();
    for (const member of sourceMembers) {
      if (String(member.userId) === myUserId) continue;
      const id = String(member.userId);
      if (byId.has(id)) continue;
      byId.set(id, {
        id,
        name:
          `${member.user.firstName ?? ""} ${member.user.lastName ?? ""}`.trim() ||
          member.user.username ||
          member.user.email,
      });
    }
    return Array.from(byId.values());
  }, [form.team_id, teamOptions, myUserId]);

  const shouldShowTeamSelect = useMemo(() => teamOptions.length > 1, [teamOptions]);
  const shouldShowOrganizationSelect = useMemo(() => organizationOptions.length > 1, [organizationOptions]);
  const grandTotal = useMemo(
    () => form.items.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [form.items]
  );

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [typeData, projects, orgs, teams, taxonomies] = await Promise.all([
          listRequestTypes(),
          listProjects().catch(() => []),
          listMyOrganizations().catch(() => []),
          listTeams({ active_only: false }).catch(() => []),
          listManagedTaxonomies({ include_inactive: false }).catch(() => []),
        ]);

        const onlyMatching = kind === "all"
          ? typeData
          : typeData.filter((type) => {
              const categoryKey = String(type.category_key || "").toLowerCase();
              const typeName = String(type.name || "").toLowerCase();
              const schema = (type.form_schema || {}) as Record<string, unknown>;
              const schemaLeaveTypeKey = String(schema.leave_type_key || "").trim().toLowerCase();
              const isLeave = categoryKey.includes("leave") || typeName.includes("leave") || schemaLeaveTypeKey.length > 0;
              return kind === "leave" ? isLeave : !isLeave;
            });
        setTypes(onlyMatching);
        setProjectOptions(projects.map((project) => ({ id: project.id, name: project.name })));
        const myProfile = await getMyProfile().catch(() => null);
        const myUserId = myProfile?.id ? String(myProfile.id) : "";
        setMyUserId(myUserId);

        const myOrgOptions = orgs.map((row) => ({ id: row.organization.id, name: row.organization.name }));
        setOrganizationOptions(myOrgOptions);

        const allTeams = teams || [];
        const myTeams =
          myUserId.length > 0
            ? allTeams.filter((team) => (team.members || []).some((member) => String(member.userId) === myUserId))
            : [];
        setTeamOptions(myTeams);

        const nextTaxonomyMap: Record<string, CategoryTermOption[]> = {};
        for (const taxonomy of taxonomies || []) {
          const key = String(taxonomy.key || "").trim();
          const taxonomyId = String(taxonomy.id || "").trim();
          if (!key) continue;
          const options = (taxonomy.terms || [])
            .map((term) => ({
              id: String(term.id || "").trim(),
              value: String(term.value || "").trim(),
              label: String(term.label || "").trim(),
            }))
            .filter((term) => term.id && term.value && term.label);
          nextTaxonomyMap[key.toLowerCase()] = options;
          if (taxonomyId) nextTaxonomyMap[taxonomyId] = options;
        }
        setTaxonomyMap(nextTaxonomyMap);

        setForm((prev) => {
          const selectedStillValid = onlyMatching.some((type) => type.id === prev.request_type_id);
          return {
            ...prev,
            request_type_id:
              kind === "leave"
                ? (selectedStillValid ? prev.request_type_id : onlyMatching.length > 0 ? onlyMatching[0].id : "")
                : selectedStillValid
                  ? prev.request_type_id
                  : onlyMatching.length > 0
                    ? onlyMatching[0].id
                    : "",
            organization_id: myOrgOptions.length === 1 ? myOrgOptions[0].id : prev.organization_id,
            team_id: myTeams.length === 1 ? myTeams[0].id : prev.team_id,
          };
        });
      } catch (error: any) {
        setNotice({
          tone: "error",
          message: error?.response?.data?.error?.message || "Unable to load request setup data.",
        });
      }
    };

    void loadOptions();
  }, [kind]);

  useEffect(() => {
    const loadDraftForEdit = async () => {
      if (!editId) {
        setEditingRequestId("");
        setTags([]);
        return;
      }
      try {
        const draft = await getRequest(editId);
        if (String(draft.status || "").toLowerCase() !== "draft") {
          setNotice({ tone: "warning", message: "Only draft requests can be edited." });
          return;
        }

        const data = (draft.data || {}) as Record<string, any>;
        const draftRequestTypeId = String(draft.request_type?.id || "");
        const draftItems =
          Array.isArray(draft.items) && draft.items.length > 0
            ? draft.items.map((item) => ({
                description: String(item.description || ""),
                unit_price: Number(item.amount || 0),
                amount: Number(item.amount || 0) * Number(item.quantity || 1),
                quantity: Number(item.quantity || 1),
                notes: item.notes || "",
                file_id: item.file_id || undefined,
                file_ids: Array.isArray(item.files) ? item.files.map((file) => file.id) : item.file_id ? [item.file_id] : [],
                file_names: Array.isArray(item.files) ? item.files.map((file) => file.file_name) : item.file?.file_name ? [item.file.file_name] : [],
              }))
            : [{ ...defaultItem }];

        const nextForm: CreateFormState = {
          request_type_id: draftRequestTypeId,
          reimbursement: toBoolean(data.reimbursement ?? data.airtime),
          purpose: String(data.purpose || data.leave_reason || ""),
          category_id: String(data.category_id || ""),
          leave_start_date: String(data.start_date || ""),
          leave_end_date: String(data.end_date || ""),
          leave_days_requested: data.days_requested !== undefined && data.days_requested !== null ? String(data.days_requested) : "",
          leave_handover_user_id: String(data.handover_user_id || ""),
          leave_handover_notes: String(data.handover_notes || ""),
          project_id: String(data.project_id || ""),
          team_id: String(data.team_id || ""),
          organization_id: String(data.organization_id || ""),
          due_date: String(data.due_date || ""),
          items: draftItems,
        };

        setForm(nextForm);
        setEditingRequestId(String(draft.id));

        const isLeave = kind === "leave" || isLeaveType({
          id: draftRequestTypeId,
          group_id: "",
          name: String(draft.request_type?.name || ""),
          code_prefix: String(draft.request_type?.code_prefix || ""),
          category_key: String(draft.request_type?.category_key || ""),
          form_schema: (draft.request_type?.form_schema ?? {}) as Record<string, unknown>,
          description: "",
          approval_limit: null,
          approval_flow_json: null,
          is_active: true,
        });
        const tagPayload = await listEntityTags("request", String(draft.id), "request_tags").catch(() => ({ tags: [] as TagTerm[] }));
        setTags(isLeave ? [] : tagPayload.tags || []);
      } catch (error: any) {
        setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load draft for editing." });
      }
    };

    void loadDraftForEdit();
  }, [editId, kind]);

  useEffect(() => {
    const taxonomyKey = String(selectedRequestType?.category_key || "").trim();
    const normalizedKey = taxonomyKey.toLowerCase();
    const resolvedTaxonomyKey =
      normalizedKey && taxonomyMap[normalizedKey]
        ? normalizedKey
        : taxonomyKey && taxonomyMap[taxonomyKey]
          ? taxonomyKey
        : Object.keys(taxonomyMap).length === 1
          ? Object.keys(taxonomyMap)[0]
          : "";
    const options = resolvedTaxonomyKey ? taxonomyMap[resolvedTaxonomyKey] || [] : [];
    setCategoryOptions(options);
    setForm((prev) => {
      if (!prev.category_id) return prev;
      const exists = options.some((option) => option.id === prev.category_id);
      return exists ? prev : { ...prev, category_id: "" };
    });
  }, [selectedRequestType?.category_key, taxonomyMap]);

  useEffect(() => {
    const loadLeaveBalance = async () => {
      if (!isLeaveRequest) {
        setLeaveBalance(null);
        return;
      }
      try {
        const year = form.leave_start_date ? new Date(form.leave_start_date).getFullYear() : new Date().getFullYear();
        const response = await getMyLeaveBalance({ year });
        const summary = response.summary || [];
        const normalizedKey = selectedLeaveTypeKey.trim().toLowerCase();
        const row = summary.find((item) => String(item.leave_type_key || "").trim().toLowerCase() === normalizedKey);
        setLeaveBalance(normalizedKey ? (row ? Number(row.available_days || 0) : 0) : null);
      } catch {
        setLeaveBalance(null);
      }
    };
    void loadLeaveBalance();
  }, [isLeaveRequest, form.leave_start_date, selectedLeaveTypeKey]);

  useEffect(() => {
    if (!isLeaveRequest) return;
    setForm((prev) => ({
      ...prev,
      leave_days_requested: requestedLeaveDays > 0 ? String(requestedLeaveDays) : "",
    }));
  }, [isLeaveRequest, requestedLeaveDays]);

  const updateItem = (index: number, key: keyof CreateItemState, value: string | number) => {
    setForm((prev) => {
      const items = [...prev.items];
      const current = { ...items[index] };

      if (key === "unit_price" || key === "quantity") {
        const numeric = Number(value || 0);
        current[key] = numeric;
        const unit = Number(current.unit_price || 0);
        const qty = Number(current.quantity || 0);
        current.amount = unit * qty;
      } else {
        (current as any)[key] = value;
      }

      items[index] = current;
      return { ...prev, items };
    });
  };

  const addItem = () => setForm((prev) => ({ ...prev, items: [...prev.items, { ...defaultItem }] }));

  const removeItem = (index: number) =>
    setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));

  const applyPickedFile = (index: number, files: FileAssetRecord[]) => {
    if (!files.length) return;
    setForm((prev) => {
      const items = [...prev.items];
      items[index] = {
        ...items[index],
        file_id: files[0]?.id,
        file_ids: files.map((file) => file.id),
        file_names: files.map((file) => file.file_name),
      };
      return { ...prev, items };
    });
  };

  const validate = () => {
    if (!form.request_type_id) return "Select a request type.";
    if (!form.purpose.trim()) return "Purpose is required.";
    if (isLeaveRequest) {
      if (!form.leave_start_date || !form.leave_end_date) return "Leave start and end dates are required.";
      if (new Date(form.leave_end_date) < new Date(form.leave_start_date)) return "Leave end date cannot be before start date.";
      if (requestedLeaveDays <= 0) return "Leave days requested must be greater than zero.";
      if (leaveRules.minNoticeDays > 0) {
        const start = new Date(form.leave_start_date);
        const threshold = new Date();
        threshold.setHours(0, 0, 0, 0);
        threshold.setDate(threshold.getDate() + leaveRules.minNoticeDays);
        if (start < threshold) {
          return `Leave must be requested at least ${leaveRules.minNoticeDays} day(s) in advance.`;
        }
      }
      if (leaveRules.maxDaysPerRequest > 0 && requestedLeaveDays > leaveRules.maxDaysPerRequest) {
        return `This leave type allows a maximum of ${leaveRules.maxDaysPerRequest} day(s) per request.`;
      }
      if (!form.leave_handover_user_id) return "Handover colleague is required for leave.";
      if (!form.leave_handover_notes.trim()) return "Handover notes are required for leave.";
      if (leaveBalance !== null && requestedLeaveDays > leaveBalance) {
        return `Requested leave exceeds available balance (${leaveBalance} days).`;
      }
      return null;
    }
    if (projectRequired && !form.project_id) return "Project is required for this request type.";
    if (form.items.some((item) => !item.description || Number(item.quantity || 0) <= 0 || Number(item.unit_price || 0) <= 0)) {
      return "Each item needs item name, unit price and quantity.";
    }
    return null;
  };

  const upsertDraft = async () => {
    const validationError = validate();
    if (validationError) {
      setNotice({ tone: "warning", message: validationError });
      return;
    }

    const payloadItems: RequestItemInput[] = isLeaveRequest
      ? []
      : form.items.map((item) => ({
      description: item.description,
      amount: Number(item.unit_price || 0),
      quantity: Number(item.quantity || 1),
      notes: item.notes,
      file_id: item.file_ids?.[0] || item.file_id,
      file_ids: item.file_ids,
    }));

    const payload = {
      team_id: form.team_id || undefined,
      data: {
        purpose: form.purpose,
        reimbursement: form.reimbursement,
        category_id: form.category_id || undefined,
        leave_type_key: isLeaveRequest ? selectedLeaveTypeKey : undefined,
        leave_reason: isLeaveRequest ? form.purpose : undefined,
        start_date: form.leave_start_date || undefined,
        end_date: form.leave_end_date || undefined,
        days_requested: form.leave_days_requested ? Number(form.leave_days_requested) : undefined,
        handover_user_id: form.leave_handover_user_id || undefined,
        handover_notes: form.leave_handover_notes || undefined,
        project_id: form.project_id || undefined,
        project_name: selectedProjectName || undefined,
        team_id: form.team_id || undefined,
        organization_id: form.organization_id || undefined,
        due_date: form.due_date || undefined,
      },
      items: payloadItems,
    };

    const created = editingRequestId
      ? await updateRequest(editingRequestId, payload)
      : await createRequest({
          request_type_id: form.request_type_id,
          ...payload,
        });

    if (created?.id && tags.length > 0 && !isLeaveRequest) {
      const existingTermIds = tags
        .filter((tag) => !String(tag.id).startsWith("new:"))
        .map((tag) => tag.id);
      const newLabels = tags
        .filter((tag) => String(tag.id).startsWith("new:"))
        .map((tag) => tag.label);

      await replaceEntityTags("request", String(created.id), "request_tags", {
        term_ids: existingTermIds,
        labels: newLabels,
        module: "finance",
      }).catch(() => undefined);
    }

    return created;
  };

  const onSaveDraft = async () => {
    if (savingDraft || submitting) return;
    try {
      setSavingDraft(true);
      setNotice(null);
      const created = await upsertDraft();
      if (!created) return;
      setNotice({ tone: "success", message: editingRequestId ? "Draft updated successfully." : "Draft saved successfully." });
      navigate(`/app/requests/request/${created.id}`);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save draft." });
    } finally {
      setSavingDraft(false);
    }
  };

  const onSubmit = async () => {
    if (savingDraft || submitting) return;
    try {
      setSubmitting(true);
      setNotice(null);
      const created = await upsertDraft();
      if (!created) return;
      await submitRequest(created.id);
      navigate(`/app/requests/request/${created.id}`, { replace: true });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to submit request." });
    } finally {
      setSubmitting(false);
    }
  };

  const onCancel = () => {
    if (kind === "leave") {
      navigate("/app/staff/leave");
      return;
    }
    navigate("/app/requests");
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">
          {editingRequestId
            ? "Edit Draft Request"
            : kind === "leave"
              ? "Create Leave Request"
              : kind === "financial"
                ? "Create Financial Request"
                : "Create Request"}
        </h2>
        <Button variant="outline-secondary" onClick={onCancel}>
          <Lucide icon="ChevronLeft" className="w-4 h-4 mr-1" />
          {kind === "leave" ? "Back to Leave" : "Back to Requests"}
        </Button>
      </div>

      <div className="mt-5 intro-y">
        <NewPortalNotice />
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="box mt-5 p-5 space-y-5">
        <div className="col-span-12">
          <FormLabel className="w-full">{kind === "leave" ? "Leave Type" : "Request Type"}</FormLabel>
          <div className="flex flex-wrap items-center gap-4">
            <FormSelect className="w-auto" value={form.request_type_id} onChange={(e) => setForm((prev) => ({ ...prev, request_type_id: e.target.value }))}>
              <option value="">{kind === "leave" ? "Select leave type" : "Select type"}</option>
              {filteredTypeOptions.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </FormSelect>
            {form.request_type_id && !isLeaveRequest ? (
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.reimbursement}
                  onChange={(e) => setForm((prev) => ({ ...prev, reimbursement: e.target.checked }))}
                />
                <span>Reimbursement</span>
              </label>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {isLeaveRequest ? (
            <>
              <div className="col-span-12">
                <div className="text-slate-500 text-sm">Leave Days</div>
                <div className="text-2xl font-semibold mt-2">{requestedLeaveDays} day(s)</div>
              </div>
              <div className="col-span-12 md:col-span-3">
                <FormLabel>Start Date</FormLabel>
                <FormInput
                  type="date"
                  value={form.leave_start_date}
                  onChange={(e) => setForm((prev) => ({ ...prev, leave_start_date: e.target.value }))}
                />
              </div>
              <div className="col-span-12 md:col-span-3">
                <FormLabel>End Date</FormLabel>
                <FormInput
                  type="date"
                  value={form.leave_end_date}
                  onChange={(e) => setForm((prev) => ({ ...prev, leave_end_date: e.target.value }))}
                />
              </div>

              <div className="col-span-12">
                <FormLabel>Reason for Leave</FormLabel>
                <FormTextarea rows={4} value={form.purpose} onChange={(e) => setForm((prev) => ({ ...prev, purpose: e.target.value }))} />
              </div>

              <div className="col-span-12 md:col-span-6">
                <FormLabel>Handover Colleague</FormLabel>
                <FormSelect
                  value={form.leave_handover_user_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, leave_handover_user_id: e.target.value }))}
                >
                  <option value="">Select colleague</option>
                  {handoverColleagueOptions.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </FormSelect>
              </div>
              <div className="col-span-12 md:col-span-6">
                <FormLabel>Handover Notes</FormLabel>
                <FormTextarea
                  rows={3}
                  value={form.leave_handover_notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, leave_handover_notes: e.target.value }))}
                  placeholder="Add work handover details for coverage."
                />
              </div>
              <div className="col-span-12">
                <div className="text-xs text-slate-500">
                  Available balance: {leaveBalance === null ? "—" : `${leaveBalance} day(s)`}
                  {leaveRules.minNoticeDays > 0 ? ` • Min notice: ${leaveRules.minNoticeDays} day(s)` : ""}
                  {leaveRules.maxDaysPerRequest > 0 ? ` • Max per request: ${leaveRules.maxDaysPerRequest} day(s)` : ""}
                </div>
              </div>
            </>
          ) : null}

          {!isLeaveRequest ? (
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Category</FormLabel>
              <FormSelect value={form.category_id} onChange={(e) => setForm((prev) => ({ ...prev, category_id: e.target.value }))}>
                <option value="">Select category</option>
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </FormSelect>
            </div>
          ) : null}

          {!isLeaveRequest ? (
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Due Date</FormLabel>
              <FormInput type="date" value={form.due_date} onChange={(e) => setForm((prev) => ({ ...prev, due_date: e.target.value }))} />
            </div>
          ) : null}
          {!isLeaveRequest ? (
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Project</FormLabel>
              <FormSelect value={form.project_id} onChange={(e) => setForm((prev) => ({ ...prev, project_id: e.target.value }))}>
                <option value="">{projectRequired ? "Select project" : "No specific project"}</option>
                {projectOptions.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </FormSelect>
              <div className="mt-1 text-xs text-slate-500">
                Staff select the project only. Fund and grant allocation will be assigned later by Finance Admin.
              </div>
            </div>
          ) : null}

          {!isLeaveRequest && shouldShowTeamSelect ? (
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Team</FormLabel>
              <FormSelect value={form.team_id} onChange={(e) => setForm((prev) => ({ ...prev, team_id: e.target.value }))}>
                <option value="">Select team</option>
                {teamOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </FormSelect>
            </div>
          ) : null}

          {!isLeaveRequest && shouldShowOrganizationSelect ? (
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Organization</FormLabel>
              <FormSelect value={form.organization_id} onChange={(e) => setForm((prev) => ({ ...prev, organization_id: e.target.value }))}>
                <option value="">Select organization</option>
                {organizationOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </FormSelect>
            </div>
          ) : null}
          {!isLeaveRequest ? (
            <div className="col-span-12">
              <FormLabel>Purpose</FormLabel>
              <FormTextarea rows={4} value={form.purpose} onChange={(e) => setForm((prev) => ({ ...prev, purpose: e.target.value }))} />
            </div>
          ) : null}
          {!isLeaveRequest ? (
            <div className="col-span-12">
              <FormLabel className="w-full">Tags (Optional)</FormLabel>
              <TagPicker
                taxonomyKey="request_tags"
                value={tags}
                onChange={setTags}
                placeholder="Type a tag and press Enter"
              />
            </div>
          ) : null}
        </div>

        {!isLeaveRequest ? (
        <div className="space-y-3">
          <div className="flex items-center">
            <h3 className="mr-auto text-base font-medium">Request Items</h3>
            <Button variant="outline-primary" onClick={addItem}>
              <Lucide icon="Plus" className="w-4 h-4 mr-1" />
              Add Item
            </Button>
          </div>

          {form.items.map((item, index) => (
            <div key={index} className="border rounded-md p-4 flex flex-col gap-3">
              <div className="flex flex-wrap items-end gap-3">
                <div className="w-full md:flex-[2_1_320px] min-w-0">
                  <FormLabel>Item</FormLabel>
                  <FormInput value={item.description} onChange={(e) => updateItem(index, "description", e.target.value)} />
                </div>
                <div className="w-[calc(50%-0.375rem)] md:flex-[1_1_140px] min-w-0">
                  <FormLabel>Price</FormLabel>
                  <FormInput
                    type="number"
                    value={item.unit_price || ""}
                    onChange={(e) => updateItem(index, "unit_price", e.target.value)}
                  />
                </div>
                <div className="w-[calc(50%-0.375rem)] md:flex-[1_1_120px] min-w-0">
                  <FormLabel>Quantity</FormLabel>
                  <FormInput
                    type="number"
                    value={item.quantity || 1}
                    onChange={(e) => updateItem(index, "quantity", e.target.value)}
                  />
                </div>
                <div className="w-full md:flex-[1_1_160px] min-w-0">
                  <FormLabel>Amount</FormLabel>
                  <FormInput value={String(formatMoney(item.amount || 0))} readOnly />
                </div>
                <div className="w-full md:w-auto md:ml-auto flex md:justify-end">
                  {form.items.length > 1 ? (
                    <Button variant="outline-danger" className="w-10 px-0 flex items-center justify-center" onClick={() => removeItem(index)}>
                      <Lucide icon="Trash2" className="w-4 h-4" />
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="w-full md:flex-[2_1_480px] min-w-0">
                  <FormLabel>Notes</FormLabel>
                  <FormTextarea value={item.notes || ""} onChange={(e) => updateItem(index, "notes", e.target.value)} />
                </div>
                <div className="w-full md:flex-[1_1_260px] min-w-0">
                  <FormLabel>Invoice File</FormLabel>
                  <Button variant="outline-secondary" className="w-full justify-center" onClick={() => setPickerIndex(index)}>
                    <Lucide icon="FileText" className="w-4 h-4 mr-1" />
                    {(item.file_names || []).length ? "Change Files" : "Pick Files"}
                  </Button>
                  <div className="text-xs text-slate-500 mt-1">
                    {(item.file_names || []).length ? `Attached: ${(item.file_names || []).join(", ")}` : "Attach invoice per item"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        ) : null}

        <div className="flex flex-wrap justify-between gap-2">
          {!isLeaveRequest ? (
            <div>
              <div className="text-slate-500 text-sm">Grand Total</div>
              <div className="text-2xl font-semibold mt-2">{formatMoney(grandTotal)}</div>
            </div>
          ) : <div />}
          <div className="flex flex-row justify-end items-center gap-2">
            <Button variant="outline-secondary" onClick={() => void onSaveDraft()} disabled={savingDraft || submitting}>
              <Lucide icon="CheckCircle2" className="w-4 h-4 mr-1" />
              {savingDraft ? "Saving..." : editingRequestId ? "Save Changes" : "Save"}
            </Button>
            <Button variant="primary" onClick={() => void onSubmit()} disabled={savingDraft || submitting}>
              <Lucide icon="Send" className="w-4 h-4 mr-1" />
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </div>
      </div>
      <MediaPickerModal
        open={pickerIndex !== null}
        onClose={() => setPickerIndex(null)}
        title="Select Invoice Files"
        multiple
        selectedIds={pickerIndex !== null ? (form.items[pickerIndex]?.file_ids || (form.items[pickerIndex]?.file_id ? [String(form.items[pickerIndex].file_id)] : [])) : []}
        onSelect={(files) => {
          if (pickerIndex === null) return;
          applyPickedFile(pickerIndex, files);
        }}
      />
    </>
  );
}

export default RequestsCreatePage;
