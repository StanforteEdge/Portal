import {
  Button,
  Chip,
  EmptyState,
  Icon,
  PageHeader,
  RightRail,
  SectionCard,
  SelectField,
  TextAreaField,
  TextField,
  useToast,
} from "@/shared";
import { formatCurrency, humanize } from "@stanforte/shared";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AppShell } from "@/shared/components/layout/AppShell";
import { TagPicker } from "@/pages/requests/TagPicker";
import { cacheStore, financeApi, useCachedQuery } from "@/shared/lib/core";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import {
  buildRequestsNavigation,
  requestsMobileNav,
} from "@/pages/requests/requests-data";
import {
  createRequest,
  getMyLeaveBalance,
  getRequest,
  listMyOrganizations,
  listProjects,
  listRequestTypes,
  listGroups,
  submitRequest,
  updateRequest,
  type MyOrganization,
  type ProjectOption,
  type RequestItemInput,
  type RequestRecord,
  type RequestTypeOption,
  type TeamOption,
} from "@/pages/requests/requests-api";
import {
  requestFamilyFromType,
  requestFamilyLabel,
  type RequestFamily,
} from "@/pages/requests/request-helpers";
import {
  listEntityTags,
  listManagedTaxonomies,
  replaceEntityTags,
  type TagTerm,
} from "@/pages/requests/taxonomy-api";
import { uploadFileAsset } from "@/pages/files/files-api";

type ItemState = {
  description: string;
  quantity: string;
  unit_price: string;
  notes: string;
  file_id?: string;
  file_ids?: string[];
  file_names?: string[];
};

type FormState = {
  request_type_id: string;
  reimbursement: boolean;
  category_id: string;
  purpose: string;
  due_date: string;
  project_id: string;
  team_id: string;
  organization_id: string;
  vendor_id: string;
  leave_start_date: string;
  leave_end_date: string;
  leave_days_requested: string;
  leave_handover_user_id: string;
  leave_handover_notes: string;
  items: ItemState[];
};

const defaultForm: FormState = {
  request_type_id: "",
  reimbursement: false,
  category_id: "",
  purpose: "",
  due_date: "",
  project_id: "",
  team_id: "",
  organization_id: "",
  vendor_id: "",
  leave_start_date: "",
  leave_end_date: "",
  leave_days_requested: "",
  leave_handover_user_id: "",
  leave_handover_notes: "",
  items: [{ description: "", quantity: "1", unit_price: "", notes: "" }],
};

function parsePositiveNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function parseDateOnly(value: string) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function itemTotal(item: ItemState) {
  return (
    parsePositiveNumber(item.quantity) * parsePositiveNumber(item.unit_price)
  );
}

function familyDescription(family: RequestFamily) {
  if (family === "leave")
    return "Complete the leave request details and coverage plan before submission.";
  if (family === "financial")
    return "Capture the funding purpose, work context, and itemized costs.";
  return "Complete the shared request details for this workflow.";
}

function mapRequestToForm(request: RequestRecord): FormState {
  const data =
    request.data && typeof request.data === "object" ? request.data : {};
  const items =
    request.items && request.items.length > 0
      ? request.items.map((item) => ({
          description: String(item.description || ""),
          quantity: String(item.quantity ?? 1),
          unit_price: String(item.amount ?? ""),
          notes: String(item.notes || ""),
          file_id: item.file_id ?? undefined,
          file_ids: Array.isArray(item.files)
            ? item.files.map((file) => file.id)
            : item.file_id
              ? [item.file_id]
              : [],
          file_names: Array.isArray(item.files)
            ? item.files.map((file) => file.file_name)
            : [],
        }))
      : defaultForm.items;

  return {
    request_type_id: String(request.request_type?.id || ""),
    reimbursement: Boolean(data.reimbursement),
    category_id: String(data.category_id || ""),
    purpose: String(data.purpose || ""),
    due_date: String(data.due_date || ""),
    project_id: String(data.project_id || ""),
    team_id: String(data.team_id || ""),
    organization_id: String(data.organization_id || ""),
    vendor_id: String(data.vendor_id || ""),
    leave_start_date: String(data.start_date || ""),
    leave_end_date: String(data.end_date || ""),
    leave_days_requested:
      data.days_requested !== undefined && data.days_requested !== null
        ? String(data.days_requested)
        : "",
    leave_handover_user_id: String(data.handover_user_id || ""),
    leave_handover_notes: String(data.handover_notes || ""),
    items,
  };
}

function buildPayload(
  form: FormState,
  selectedType: RequestTypeOption | undefined,
  family: RequestFamily,
) {
  const items: RequestItemInput[] =
    family === "leave"
      ? []
      : form.items.map((item) => ({
          description: item.description.trim(),
          quantity: parsePositiveNumber(item.quantity) || 1,
          amount: parsePositiveNumber(item.unit_price),
          notes: item.notes.trim() || undefined,
          file_id: item.file_ids?.[0] || item.file_id || undefined,
          file_ids: item.file_ids?.length ? item.file_ids : undefined,
        }));

  const payload = {
    team_id: form.team_id || undefined,
    data: {
      purpose: form.purpose.trim(),
      reimbursement: form.reimbursement,
      category_id:
        family === "leave" ? undefined : form.category_id || undefined,
      project_id: family === "leave" ? undefined : form.project_id || undefined,
      team_id: form.team_id || undefined,
      organization_id: form.organization_id || undefined,
      vendor_id: form.vendor_id || undefined,
      due_date: form.due_date || undefined,
      start_date:
        family === "leave" ? form.leave_start_date || undefined : undefined,
      end_date:
        family === "leave" ? form.leave_end_date || undefined : undefined,
      days_requested:
        family === "leave" && form.leave_days_requested
          ? Number(form.leave_days_requested)
          : undefined,
      leave_type_key:
        family === "leave"
          ? String(
              selectedType?.form_schema?.leave_type_key ||
                selectedType?.name ||
                "",
            )
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "_")
              .replace(/^_+|_+$/g, "")
          : undefined,
      handover_user_id:
        family === "leave"
          ? form.leave_handover_user_id || undefined
          : undefined,
      handover_notes:
        family === "leave"
          ? form.leave_handover_notes.trim() || undefined
          : undefined,
    },
    items,
  };

  return payload;
}

function validateForm(
  form: FormState,
  family: RequestFamily,
  options?: { minNoticeDays?: number; maxDaysPerRequest?: number },
) {
  if (!form.request_type_id) return "Select a request type.";
  if (!form.purpose.trim())
    return family === "leave" ? "Reason is required." : "Purpose is required.";

  if (family === "leave") {
    if (!form.leave_start_date || !form.leave_end_date)
      return "Leave start and end dates are required.";
    if (new Date(form.leave_end_date) < new Date(form.leave_start_date)) {
      return "Leave end date cannot be before start date.";
    }
    if (!form.leave_days_requested || Number(form.leave_days_requested) <= 0) {
      return "Leave days requested must be greater than zero.";
    }
    const leaveDaysRequested = Number(form.leave_days_requested);
    if (
      Number(options?.maxDaysPerRequest || 0) > 0 &&
      leaveDaysRequested > Number(options?.maxDaysPerRequest)
    ) {
      return `Leave days requested cannot exceed ${options?.maxDaysPerRequest} day${options?.maxDaysPerRequest === 1 ? "" : "s"} for this leave type.`;
    }
    if (Number(options?.minNoticeDays || 0) > 0) {
      const start = parseDateOnly(form.leave_start_date);
      const minStart = new Date();
      minStart.setHours(0, 0, 0, 0);
      minStart.setDate(minStart.getDate() + Number(options?.minNoticeDays || 0));
      if (start && start < minStart) {
        return `Leave start date must be at least ${options?.minNoticeDays} day${options?.minNoticeDays === 1 ? "" : "s"} from today.`;
      }
    }
    if (!form.leave_handover_user_id) return "Handover colleague is required.";
    if (!form.leave_handover_notes.trim())
      return "Handover notes are required.";
    return null;
  }

  if (
    form.items.some(
      (item) =>
        !item.description.trim() ||
        parsePositiveNumber(item.quantity) <= 0 ||
        parsePositiveNumber(item.unit_price) <= 0,
    )
  ) {
    return "Each item needs description, quantity, and unit price.";
  }

  return null;
}

function buildHandoverOptions(teams: TeamOption[]) {
  const values = new Map<string, string>();
  teams.forEach((team) => {
    (team.members ?? []).forEach((member) => {
      const id = String(member.userId || member.user.id || "");
      if (!id || values.has(id)) return;
      const name =
        `${member.user.firstName ?? ""} ${member.user.lastName ?? ""}`.trim() ||
        member.user.username ||
        member.user.email;
      values.set(id, name);
    });
  });
  return Array.from(values.entries()).map(([value, label]) => ({
    value,
    label,
  }));
}

export function RequestFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const typeId = searchParams.get("typeId") || "";
  const editId = searchParams.get("edit") || "";
  const [form, setForm] = useState<FormState>(defaultForm);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [tags, setTags] = useState<TagTerm[]>([]);

  const { data: requestTypes } = useCachedQuery(
    "requests:types",
    () => listRequestTypes(),
    {
      ttlMs: 1000 * 60 * 10,
      storage: "local",
    },
  );
  const { data: projects } = useCachedQuery(
    "requests:projects",
    () => listProjects(),
    { ttlMs: 1000 * 60 * 10, storage: "memory" },
  );
  const { data: organizations } = useCachedQuery(
    "requests:my-organizations",
    () => listMyOrganizations(),
    {
      ttlMs: 1000 * 60 * 10,
      storage: "memory",
    },
  );
  const { data: teams } = useCachedQuery(
    "requests:groups",
    () => listGroups({ active_only: false }),
    {
      ttlMs: 1000 * 60 * 10,
      storage: "memory",
    },
  );
  const { data: profile } = useCachedQuery(
    "workspace:profile:request-form",
    () => getWorkspaceProfile(),
    { ttlMs: 1000 * 60, storage: "memory" },
  );
  const { data: managedTaxonomies } = useCachedQuery(
    "requests:taxonomies",
    () => listManagedTaxonomies({ include_inactive: false }),
    { ttlMs: 1000 * 60 * 10, storage: "memory" },
  );
  const { data: vendors } = useCachedQuery(
    "finance:vendors:options",
    () => financeApi.listVendors({ is_active: true, per_page: 200 }),
    { ttlMs: 1000 * 60 * 10, storage: "memory" },
  );
  const vendorOptions: Array<{ id: string; name: string }> =
    (vendors as any)?.data?.items ?? [];

  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    setLoadingEdit(true);
    void getRequest(editId)
      .then((request) => {
        if (cancelled) return;
        setForm(mapRequestToForm(request));
        return listEntityTags("request", String(request.id), "request_tags")
          .then((response) => {
            if (!cancelled) setTags(response.tags ?? []);
          })
          .catch(() => {
            if (!cancelled) setTags([]);
          });
      })
      .catch((error) => {
        if (cancelled) return;
        showToast({
          tone: "danger",
          title: "Unable to load draft",
          message:
            error instanceof Error
              ? error.message
              : "We could not load this request draft.",
        });
      })
      .finally(() => {
        if (!cancelled) setLoadingEdit(false);
      });
    return () => {
      cancelled = true;
    };
  }, [editId, showToast]);

  useEffect(() => {
    if (!editId && typeId) {
      setForm((prev) => ({ ...prev, request_type_id: typeId }));
    }
  }, [editId, typeId]);

  useEffect(() => {
    if (!organizations || editId) return;
    if (organizations.length === 1) {
      setForm((prev) => ({
        ...prev,
        organization_id:
          prev.organization_id || organizations[0].organization.id,
      }));
    }
  }, [organizations, editId]);

  const groupOptions = useMemo(
    () =>
      (
        profile?.groups ?? [
          ...(profile?.teams ?? []),
          ...(profile?.projects ?? []),
        ]
      )
        .filter((group) =>
          ["team", "department"].includes(
            String(group.type || "")
              .trim()
              .toLowerCase(),
          ),
        )
        .map((group) => ({
          id: group.id,
          name: group.name,
          type: group.type,
          role: group.role,
        })),
    [profile?.groups, profile?.projects, profile?.teams],
  );

  useEffect(() => {
    if (!groupOptions.length || editId) return;
    if (groupOptions.length === 1) {
      setForm((prev) => ({
        ...prev,
        team_id: prev.team_id || groupOptions[0].id,
      }));
    }
  }, [groupOptions, editId]);

  const selectedType = useMemo(
    () =>
      (requestTypes ?? []).find(
        (type: RequestTypeOption) => type.id === form.request_type_id || type.id === typeId,
      ),
    [form.request_type_id, requestTypes, typeId],
  );
  const family = requestFamilyFromType(selectedType);
  const handoverOptions = useMemo(
    () => buildHandoverOptions(teams ?? []),
    [teams],
  );
  const categoryOptions = useMemo(() => {
    const taxonomyKey = String(
      selectedType?.categoryKey ?? selectedType?.category_key ?? "",
    )
      .trim()
      .toLowerCase();
    if (!taxonomyKey) return [];
    return (managedTaxonomies ?? [])
      .filter(
        (taxonomy) =>
          String(taxonomy.key || "")
            .trim()
            .toLowerCase() === taxonomyKey,
      )
      .flatMap((taxonomy) =>
        (taxonomy.terms ?? []).map((term) => ({
          value: term.id,
          label: term.label,
        })),
      );
  }, [
    managedTaxonomies,
    selectedType?.categoryKey,
    selectedType?.category_key,
  ]);
  const totalAmount = useMemo(
    () =>
      form.items.reduce(
        (sum, item) =>
          sum +
          parsePositiveNumber(item.quantity) *
            parsePositiveNumber(item.unit_price),
        0,
      ),
    [form.items],
  );

  useEffect(() => {
    if (family === "leave") return;
    if (categoryOptions.length === 1 && !form.category_id) {
      setForm((prev) => ({ ...prev, category_id: categoryOptions[0].value }));
      return;
    }
    if (
      form.category_id &&
      categoryOptions.length > 0 &&
      !categoryOptions.some((option) => option.value === form.category_id)
    ) {
      setForm((prev) => ({ ...prev, category_id: "" }));
    }
  }, [categoryOptions, family, form.category_id]);

  useEffect(() => {
    if (family === "leave" && form.leave_start_date && form.leave_end_date) {
      const start = new Date(form.leave_start_date);
      const end = new Date(form.leave_end_date);
      if (
        !Number.isNaN(start.getTime()) &&
        !Number.isNaN(end.getTime()) &&
        end >= start
      ) {
        const days =
          Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
        setForm((prev) => ({
          ...prev,
          leave_days_requested: String(days),
        }));
      }
    }
  }, [family, form.leave_end_date, form.leave_start_date]);

  const { data: leaveBalanceData } = useCachedQuery(
    [
      "requests:leave-balance",
      selectedType?.id ?? "none",
      form.leave_start_date || "current",
    ].join(":"),
    () =>
      getMyLeaveBalance({
        year: form.leave_start_date
          ? new Date(form.leave_start_date).getFullYear()
          : new Date().getFullYear(),
        leave_type_key: String(
          selectedType?.form_schema?.leave_type_key || selectedType?.name || "",
        )
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, ""),
      }),
    { ttlMs: 1000 * 60 * 5, storage: "memory" },
  );

  const leaveBalance = useMemo(() => {
    if (family !== "leave") return null;
    return leaveBalanceData?.summary?.[0]?.available_days ?? null;
  }, [family, leaveBalanceData]);

  const minNoticeDays = Number(
    (selectedType?.form_schema as Record<string, unknown> | null)
      ?.min_notice_days ?? 0,
  );
  const maxDaysPerRequest = Number(
    (selectedType?.form_schema as Record<string, unknown> | null)
      ?.max_days_per_request ??
      (selectedType?.form_schema as Record<string, unknown> | null)?.max_days ??
      0,
  );

  const minStartDate = useMemo(() => {
    if (family !== "leave" || minNoticeDays <= 0) return "";
    const date = new Date();
    date.setDate(date.getDate() + minNoticeDays);
    return date.toISOString().slice(0, 10);
  }, [family, minNoticeDays]);

  const organizationOptions = (organizations ?? []).map(
    (entry: MyOrganization) => entry.organization,
  );
  const projectOptions = projects ?? [];

  async function handleSave(submitAfterSave: boolean) {
    const error = validateForm(form, family, {
      minNoticeDays,
      maxDaysPerRequest,
    });
    if (error) {
      showToast({
        tone: "warning",
        title: "Check this request",
        message: error,
      });
      return;
    }

    try {
      submitAfterSave ? setSubmitting(true) : setSavingDraft(true);

      const payload = buildPayload(form, selectedType, family);
      const created = editId
        ? await updateRequest(editId, payload)
        : await createRequest({
            request_type_id: form.request_type_id,
            ...payload,
          });

      if (family !== "leave") {
        await replaceEntityTags("request", String(created.id), "request_tags", {
          term_ids: tags
            .filter((tag) => !tag.id.startsWith("new:"))
            .map((tag) => tag.id),
          labels: tags
            .filter((tag) => tag.id.startsWith("new:"))
            .map((tag) => tag.label),
          module: "finance",
        });
      }

      if (submitAfterSave) {
        await submitRequest(String(created.id));
      }

      showToast({
        tone: "success",
        title: submitAfterSave ? "Request submitted" : "Draft saved",
        message: submitAfterSave
          ? "Your request has been submitted and routed for review."
          : "Your draft has been saved.",
      });
      [
        "requests:list:mine",
        "requests:list:approvals",
        `requests:detail:${created.id}`,
        `requests:actions:${created.id}`,
      ].forEach((key) => cacheStore.invalidateCache(key));
      navigate(`/requests/${created.id}`, { replace: true });
    } catch (requestError) {
      showToast({
        tone: "danger",
        title: submitAfterSave
          ? "Unable to submit request"
          : "Unable to save draft",
        message:
          requestError instanceof Error
            ? requestError.message
            : "Unable to save request.",
      });
    } finally {
      setSavingDraft(false);
      setSubmitting(false);
    }
  }

  async function handleAttachFiles(index: number, files: FileList | null) {
    if (!files || files.length === 0) return;
    try {
      const uploaded = await Promise.all(
        Array.from(files).map((file) =>
          uploadFileAsset(file, {
            organization_id: form.organization_id || undefined,
            metadata: { source: "request_item" },
          }),
        ),
      );
      setForm((prev) => {
        const nextItems = [...prev.items];
        nextItems[index] = {
          ...nextItems[index],
          file_id: uploaded[0]?.id,
          file_ids: uploaded.map((file) => file.id),
          file_names: uploaded.map((file) => file.file_name),
        };
        return { ...prev, items: nextItems };
      });
      showToast({
        tone: "success",
        title: "Files attached",
        message: `${uploaded.length} file${uploaded.length === 1 ? "" : "s"} attached to request item ${index + 1}.`,
      });
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Unable to attach files",
        message: error instanceof Error ? error.message : "Please try again.",
      });
    }
  }

  if (!typeId && !editId) {
    return (
      <AppShell
        navigation={buildRequestsNavigation()}
        activeLabel="New Request"
        user={{ name: "Alex Sterling", role: "Fleet Operations" }}
        mobileNav={requestsMobileNav}
      >
        <div className="shell-panel flex flex-col items-center justify-center gap-4 px-6 py-10 text-center">
          <EmptyState
            title="Choose a request type first"
            description="Start from the request selector so we can load the right form structure."
          />
          <Link
            to="/requests/new"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10"
          >
            Back to New Request
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      navigation={buildRequestsNavigation()}
      activeLabel="New Request"
      user={{ name: "Alex Sterling", role: "Fleet Operations" }}
      mobileNav={requestsMobileNav}
    >
      <div className="hidden lg:block">
        <PageHeader
          breadcrumbs={[
            { label: "Requests", path: "/requests" },
            { label: editId ? "Edit Draft" : "New Request" },
          ]}
          title={
            selectedType?.name ||
            (loadingEdit ? "Loading request..." : "Request form")
          }
          description={familyDescription(family)}
          actions={
            <Link
              to="/requests/new"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10"
            >
              <Icon name="arrow_back" className="text-[18px]" />
              Change Type
            </Link>
          }
        />

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <SectionCard
              title="Request Setup"
              description="Confirm the request subtype and primary timing details."
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <SelectField
                  label="Request Type"
                  value={form.request_type_id}
                  onChange={(event) => {
                    setForm((prev) => ({
                      ...prev,
                      request_type_id: event.target.value,
                      category_id: "",
                    }));
                    setTags([]);
                  }}
                  disabled={Boolean(editId)}
                >
                  <option value="">Select request type</option>
                    {(["financial", "leave", "other"] as const).map((fam) => {
                    const famTypes = (requestTypes ?? []).filter(
                      (t: RequestTypeOption) => requestFamilyFromType(t) === fam,
                    );
                    if (!famTypes.length) return null;
                    return (
                      <optgroup key={fam} label={requestFamilyLabel(fam)}>
                        {famTypes.map((type: RequestTypeOption) => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </SelectField>

                {family === "leave" ? (
                  <TextField
                    label="Leave Days"
                    value={form.leave_days_requested}
                    readOnly
                  />
                ) : (
                  <TextField
                    label="Due Date"
                    type="date"
                    value={form.due_date}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        due_date: event.target.value,
                      }))
                    }
                  />
                )}
              </div>

              {family !== "leave" ? (
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <SelectField
                    label="Category"
                    value={form.category_id}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        category_id: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select category</option>
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </SelectField>
                  <label className=" flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <span>
                      <span className="field-label">Reimbursement Needed</span>
                      <span className="block text-sm text-slate-500">
                        Mark this if the request is a reimbursement flow.
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={form.reimbursement}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          reimbursement: event.target.checked,
                        }))
                      }
                      className="h-5 w-5 rounded border-slate-300 text-brand-900 focus:ring-brand-900"
                    />
                  </label>
                  <TagPicker
                    taxonomyKey="request_tags"
                    value={tags}
                    onChange={setTags}
                    placeholder="Add tags"
                    label="Tags"
                  />
                </div>
              ) : null}
            </SectionCard>
            <SectionCard
              title={family === "leave" ? "Reason" : "Purpose"}
              description="Provide the narrative context for this request."
            >
              <TextAreaField
                label={family === "leave" ? "Reason for Request" : "Purpose"}
                value={form.purpose}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, purpose: event.target.value }))
                }
                placeholder={
                  family === "leave"
                    ? "Explain the leave reason and any planning context."
                    : "Explain why this request is needed and what outcome it supports."
                }
              />
            </SectionCard>

            {family === "leave" ? (
              <>
                <SectionCard
                  title="Leave Schedule"
                  description="Capture the dates and policy timing for this leave request."
                >
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div>
                      <TextField
                        label="Start Date"
                        type="date"
                        value={form.leave_start_date}
                        min={minStartDate || undefined}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            leave_start_date: event.target.value,
                          }))
                        }
                      />
                      {minNoticeDays > 0 ? (
                        <p className="mt-1.5 text-xs text-slate-500">
                          This leave type requires at least {minNoticeDays} day{minNoticeDays === 1 ? "" : "s"} notice — earliest start date is {minStartDate}.
                        </p>
                      ) : null}
                    </div>
                    <TextField
                      label="End Date"
                      type="date"
                      value={form.leave_end_date}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          leave_end_date: event.target.value,
                        }))
                      }
                    />
                  </div>
                </SectionCard>

                <SectionCard
                  title="Work Context"
                  description="Tie the request to the right organization and group."
                >
                  <div className="grid gap-4 lg:grid-cols-2">
                    <SelectField
                      label="Organization"
                      value={form.organization_id}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          organization_id: event.target.value,
                        }))
                      }
                      disabled={organizationOptions.length <= 1}
                    >
                      <option value="">Select organization</option>
                      {organizationOptions.map((organization: { id: string; name: string; code: string }) => (
                        <option key={organization.id} value={organization.id}>
                          {organization.name}
                        </option>
                      ))}
                    </SelectField>

                    <SelectField
                      label="Group"
                      value={form.team_id}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          team_id: event.target.value,
                        }))
                      }
                      disabled={groupOptions.length <= 1}
                    >
                      <option value="">Select group</option>
                      {groupOptions.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name} ({humanize(group.type)})
                        </option>
                      ))}
                    </SelectField>
                  </div>

                  <div className="mt-4">
                    <SelectField
                      label="Vendor"
                      helpText="Optional — select if this is a vendor payment or procurement."
                      value={form.vendor_id}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          vendor_id: event.target.value,
                        }))
                      }
                    >
                      <option value="">No vendor</option>
                      {vendorOptions.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </SelectField>
                  </div>
                </SectionCard>

                <SectionCard
                  title="Handover Plan"
                  description="Identify who will cover and how work will be handed over."
                >
                  <div className="rounded-[18px] border border-slate-100 bg-slate-50 px-4 py-3 text-xs leading-6 text-slate-600">
                    Handover colleague receives an acknowledgement notice.
                    Leave approval decisions are still made by team lead/workflow approvers.
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <SelectField
                      label="Handover Colleague"
                      value={form.leave_handover_user_id}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          leave_handover_user_id: event.target.value,
                        }))
                      }
                    >
                      <option value="">Select colleague</option>
                      {handoverOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </SelectField>
                  </div>
                  <div className="mt-4">
                    <TextAreaField
                      label="Handover Notes"
                      value={form.leave_handover_notes}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          leave_handover_notes: event.target.value,
                        }))
                      }
                      placeholder="Summarize work coverage, dependencies, and any notes for the covering colleague."
                    />
                  </div>
                </SectionCard>
              </>
            ) : (
              <>
                <SectionCard
                  title="Work Context"
                  description="Assign the request to the right workstream and organization."
                >
                  <div className="grid gap-4 lg:grid-cols-3">
                    <SelectField
                      label="Project"
                      value={form.project_id}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          project_id: event.target.value,
                        }))
                      }
                      disabled={projectOptions.length <= 1}
                    >
                      <option value="">Select project</option>
                      {projectOptions.map((project: ProjectOption) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </SelectField>
                    <SelectField
                      label="Group"
                      value={form.team_id}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          team_id: event.target.value,
                        }))
                      }
                      disabled={groupOptions.length <= 1}
                    >
                      <option value="">Select group</option>
                      {groupOptions.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name} ({humanize(group.type)})
                        </option>
                      ))}
                    </SelectField>
                    <SelectField
                      label="Organization"
                      value={form.organization_id}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          organization_id: event.target.value,
                        }))
                      }
                      disabled={organizationOptions.length <= 1}
                    >
                      <option value="">Select organization</option>
                      {organizationOptions.map((organization: { id: string; name: string; code: string }) => (
                        <option key={organization.id} value={organization.id}>
                          {organization.name}
                        </option>
                      ))}
                    </SelectField>
                  </div>

                  <div className="mt-4">
                    <SelectField
                      label="Vendor"
                      helpText="Optional — select if this is a vendor payment or procurement."
                      value={form.vendor_id}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          vendor_id: event.target.value,
                        }))
                      }
                    >
                      <option value="">No vendor</option>
                      {vendorOptions.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </SelectField>
                  </div>
                </SectionCard>

                <SectionCard
                  title="Request Items"
                  description="List the cost items that make up this request."
                  action={
                    <Button
                      variant="secondary"
                      size="sm"
                      className="gap-2"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          items: [
                            ...prev.items,
                            {
                              description: "",
                              quantity: "1",
                              unit_price: "",
                              notes: "",
                            },
                          ],
                        }))
                      }
                    >
                      <Icon name="add" className="text-[18px]" />
                      Add Line Item
                    </Button>
                  }
                >
                  <div className="space-y-4">
                    {form.items.map((item, index) => (
                      <div
                        key={`item-${index}`}
                        className="rounded-[20px] border border-slate-200 bg-white p-4"
                      >
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-950">
                              Request Item {index + 1}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Line total updates as quantity and unit price
                              change.
                            </p>
                          </div>
                          <button
                            type="button"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-danger/15 bg-danger/10 text-danger transition hover:bg-danger/15 disabled:cursor-not-allowed disabled:opacity-40"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                items:
                                  prev.items.length === 1
                                    ? prev.items
                                    : prev.items.filter(
                                        (_, itemIndex) => itemIndex !== index,
                                      ),
                              }))
                            }
                            disabled={form.items.length === 1}
                            aria-label={`Remove request item ${index + 1}`}
                          >
                            <Icon name="delete" className="text-[18px]" />
                          </button>
                        </div>
                        <div className="grid gap-4 lg:grid-cols-[1.8fr_0.7fr_0.7fr_auto]">
                          <TextField
                            label="Description"
                            value={item.description}
                            onChange={(event) =>
                              setForm((prev) => {
                                const nextItems = [...prev.items];
                                nextItems[index] = {
                                  ...nextItems[index],
                                  description: event.target.value,
                                };
                                return { ...prev, items: nextItems };
                              })
                            }
                          />
                          <TextField
                            label="Quantity"
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(event) =>
                              setForm((prev) => {
                                const nextItems = [...prev.items];
                                nextItems[index] = {
                                  ...nextItems[index],
                                  quantity: event.target.value,
                                };
                                return { ...prev, items: nextItems };
                              })
                            }
                          />
                          <TextField
                            label="Unit Price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(event) =>
                              setForm((prev) => {
                                const nextItems = [...prev.items];
                                nextItems[index] = {
                                  ...nextItems[index],
                                  unit_price: event.target.value,
                                };
                                return { ...prev, items: nextItems };
                              })
                            }
                          />
                          <div className="flex items-end">
                            <div className="mb-1">
                              <Chip variant="neutral">
                                {formatCurrency(itemTotal(item))}
                              </Chip>
                            </div>
                          </div>
                        </div>
                        <div className="grid lg:grid-cols-3 gap-4">
                          <div className="mt-4 col-span-2">
                            <TextAreaField
                              label="Notes"
                              value={item.notes}
                              onChange={(event) =>
                                setForm((prev) => {
                                  const nextItems = [...prev.items];
                                  nextItems[index] = {
                                    ...nextItems[index],
                                    notes: event.target.value,
                                  };
                                  return { ...prev, items: nextItems };
                                })
                              }
                              placeholder="Optional context for this line item."
                            />
                          </div>
                          <div className="mt-4">
                            <span className="field-label">Invoice File</span>
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                              <Icon
                                name="attach_file"
                                className="text-[18px]"
                              />
                              {(item.file_names || []).length
                                ? "Change Files"
                                : "Pick Files"}
                              <input
                                type="file"
                                className="hidden"
                                multiple
                                onChange={(event) => {
                                  void handleAttachFiles(
                                    index,
                                    event.target.files,
                                  );
                                  event.target.value = "";
                                }}
                              />
                            </label>
                            <p className="mt-2 text-xs text-slate-500">
                              {(item.file_names || []).length
                                ? `Attached: ${(item.file_names || []).join(", ")}`
                                : "Attach invoice per item"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </>
            )}
          </div>

          <RightRail className="self-start lg:col-span-4 lg:sticky lg:top-28">
            <section className="section-card bg-brand-900 p-5 text-white">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-white/70">
                {family === "leave" ? "Leave Request" : "Current Total"}
              </p>
              <p className="mt-3 text-4xl font-semibold tracking-tight">
                {family === "leave"
                  ? form.leave_days_requested
                    ? `${form.leave_days_requested} day${Number(form.leave_days_requested) === 1 ? "" : "s"}`
                    : "— days"
                  : formatCurrency(totalAmount || 0)}
              </p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                {family === "leave"
                  ? selectedType?.name || "Leave request"
                  : "The request total updates from the line items you add below."}
              </p>
              {family === "leave" ? (
                <div className="mt-4 space-y-2">
                  {leaveBalance !== null ? (
                    <div className="rounded-[18px] border border-white/10 bg-white/10 px-4 py-3">
                      <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white/70">
                        Available Balance
                      </p>
                      <p className="mt-2 text-2xl font-semibold">
                        {leaveBalance} days
                      </p>
                    </div>
                  ) : null}
                  {minNoticeDays > 0 ? (
                    <div className="rounded-[18px] border border-white/10 bg-white/10 px-4 py-3">
                      <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white/70">
                        Notice Required
                      </p>
                      <p className="mt-2 text-lg font-semibold">
                        {minNoticeDays} day{minNoticeDays === 1 ? "" : "s"} in advance
                      </p>
                    </div>
                  ) : null}
                  {maxDaysPerRequest > 0 ? (
                    <div className="rounded-[18px] border border-white/10 bg-white/10 px-4 py-3">
                      <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white/70">
                        Max Per Request
                      </p>
                      <p className="mt-2 text-lg font-semibold">
                        {maxDaysPerRequest} day{maxDaysPerRequest === 1 ? "" : "s"}
                      </p>
                    </div>
                  ) : null}
                  <div className="rounded-[18px] border border-white/10 bg-white/10 px-4 py-3">
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white/70">
                      Handover & Approval
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/85">
                      Handover colleague is notified to acknowledge coverage.
                      Team lead/workflow approvers still approve or reject leave.
                    </p>
                  </div>
                </div>
              ) : null}
            </section>

            <SectionCard title="Submission Actions">
              <div className="space-y-3">
                <Button
                  variant="secondary"
                  className="w-full justify-center"
                  onClick={() => void handleSave(false)}
                  disabled={savingDraft || submitting || loadingEdit}
                >
                  {savingDraft
                    ? "Saving..."
                    : editId
                      ? "Update Draft"
                      : "Save Draft"}
                </Button>
                <Button
                  className="w-full justify-center gap-2"
                  onClick={() => void handleSave(true)}
                  disabled={savingDraft || submitting || loadingEdit}
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                  <Icon name="arrow_forward" className="text-[18px]" />
                </Button>
              </div>
            </SectionCard>
          </RightRail>
        </div>
      </div>

      <div className="space-y-4 lg:hidden">
        <div className="pt-1">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-slate-500">
            {editId ? "Edit Request" : "New Request"}
          </p>
          <h1 className="page-title mt-2 text-[clamp(1.7rem,7vw,2.2rem)]">
            {selectedType?.name || "Request form"}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
            {familyDescription(family)}
          </p>
        </div>

        <section className="section-card bg-brand-900 p-5 text-white">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-white/70">
            {family === "leave" ? "Leave Request" : "Current Total"}
          </p>
          <p className="mt-3 text-4xl font-semibold tracking-tight">
            {family === "leave"
              ? form.leave_days_requested
                ? `${form.leave_days_requested} day${Number(form.leave_days_requested) === 1 ? "" : "s"}`
                : "— days"
              : formatCurrency(totalAmount || 0)}
          </p>
          {family === "leave" ? (
            <div className="mt-3 space-y-2">
              {leaveBalance !== null ? (
                <p className="text-sm leading-6 text-white/85">
                  Available balance: {leaveBalance} days
                </p>
              ) : null}
              {minNoticeDays > 0 ? (
                <p className="text-sm leading-6 text-white/70">
                  Notice required: {minNoticeDays} day{minNoticeDays === 1 ? "" : "s"} in advance
                </p>
              ) : null}
              {maxDaysPerRequest > 0 ? (
                <p className="text-sm leading-6 text-white/70">
                  Max per request: {maxDaysPerRequest} day{maxDaysPerRequest === 1 ? "" : "s"}
                </p>
              ) : null}
            </div>
          ) : null}
        </section>

        <SectionCard title="Request Setup">
          <div className="grid gap-4">
            <SelectField
              label="Request Type"
              value={form.request_type_id}
              onChange={(event) => {
                setForm((prev) => ({
                  ...prev,
                  request_type_id: event.target.value,
                  category_id: "",
                }));
                setTags([]);
              }}
              disabled={Boolean(editId)}
            >
              <option value="">Select request type</option>
              {(requestTypes ?? []).map((type: RequestTypeOption) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </SelectField>
            {family === "leave" ? (
              <TextField
                label="Leave Days"
                value={form.leave_days_requested}
                readOnly
              />
            ) : (
              <TextField
                label="Due Date"
                type="date"
                value={form.due_date}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, due_date: event.target.value }))
                }
              />
            )}
          </div>
          {family !== "leave" ? (
            <div className="mt-4 grid gap-4">
              <SelectField
                label="Category"
                value={form.category_id}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    category_id: event.target.value,
                  }))
                }
              >
                <option value="">Select category</option>
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectField>
              <TagPicker
                taxonomyKey="request_tags"
                value={tags}
                onChange={setTags}
                placeholder="Add tags"
                label="Tags"
              />
            </div>
          ) : null}
        </SectionCard>

        <SectionCard title={family === "leave" ? "Reason" : "Purpose"}>
          <TextAreaField
            label={family === "leave" ? "Reason for Request" : "Purpose"}
            value={form.purpose}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, purpose: event.target.value }))
            }
          />
        </SectionCard>

        <section className="section-card p-4">
          <div className="space-y-3">
            <Button
              variant="secondary"
              className="w-full justify-center"
              onClick={() => void handleSave(false)}
              disabled={savingDraft || submitting || loadingEdit}
            >
              {savingDraft
                ? "Saving..."
                : editId
                  ? "Update Draft"
                  : "Save Draft"}
            </Button>
            <Button
              className="w-full justify-center gap-2"
              onClick={() => void handleSave(true)}
              disabled={savingDraft || submitting || loadingEdit}
            >
              {submitting ? "Submitting..." : "Submit Request"}
              <Icon name="arrow_forward" className="text-[18px]" />
            </Button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

export default RequestFormPage;
