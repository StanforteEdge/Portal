import {
  Button,
  EmptyState,
  Icon,
  PageHeader,
  RightRail,
  SectionCard,
  TextAreaField,
  TextField,
  useToast,
} from "@/shared";

import { useEffect, useMemo, useRef, useState } from "react";
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
  listRequestTypes,
  listCategories,
  type RequestTypeOption,
  type RequestCategoryOption,
  createRequest,
  getRequest,
  updateRequest,
  submitRequest,
  listProjects,
  listMyOrganizations,
  listGroups,
  type MyOrganization,
  type TeamOption,
  type RequestItemInput,
  type RequestRecord,
} from "@/pages/requests/requests-api";
import {
  classifyRequestFamily,
  type RequestFamily,
} from "@/pages/requests/request-helpers";
import { LeaveRequestFormPage } from "@/pages/requests/new/forms/LeaveRequestFormPage";
import { FinancialRequestFormPage } from "@/pages/requests/new/forms/FinancialRequestFormPage";
import { LoanRequestFormPage } from "@/pages/requests/new/forms/LoanRequestFormPage";
import { OtherRequestFormPage } from "@/pages/requests/new/forms/OtherRequestFormPage";
import type { FamilyFormHandle } from "@/pages/requests/new/forms/family-form-types";
import {
  listEntityTags,
  listManagedTaxonomies,
  replaceEntityTags,
  type TagTerm,
} from "@/pages/requests/taxonomy-api";

type FormState = {
  request_type_id: string;
  purpose: string;
  due_date: string;
  reimbursement: boolean;
};

const defaultForm: FormState = {
  request_type_id: "",
  purpose: "",
  due_date: "",
  reimbursement: false,
};

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
  const [summaryContent, setSummaryContent] = useState<React.ReactNode>(null);
  const [editRequest, setEditRequest] = useState<RequestRecord | undefined>(undefined);
  const familyFormRef = useRef<FamilyFormHandle>(null);

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
  const { data: categories } = useCachedQuery(
    "requests:categories",
    () => listCategories(),
    { ttlMs: 1000 * 60 * 10, storage: "memory" },
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
        setForm((prev) => ({ ...prev, request_type_id: String(request.request_type?.id || "") }));
        setEditRequest(request);
        const tagTaxonomyKey = taxonomyKey || "request_tags";
        return listEntityTags("request", String(request.id), tagTaxonomyKey)
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

  const selectedType = useMemo(
    () =>
      (requestTypes ?? []).find(
        (type: RequestTypeOption) => type.id === form.request_type_id || type.id === typeId,
      ),
    [form.request_type_id, requestTypes, typeId],
  );
  const handoverOptions = useMemo(
    () => buildHandoverOptions(teams ?? []),
    [teams],
  );
  const categoryMap = useMemo(() => {
    const map = new Map<string, RequestCategoryOption>();
    for (const cat of categories ?? []) {
      map.set(cat.id, cat);
    }
    return map;
  }, [categories]);

  const selectedCategory = useMemo(() => {
    if (!selectedType) return null;
    const catId = selectedType.categoryId || selectedType.category_id;
    return catId ? categoryMap.get(catId) ?? null : null;
  }, [selectedType, categoryMap]);

  const family: RequestFamily = useMemo(() => {
    if (!selectedType) return "other";
    return classifyRequestFamily(
      selectedType.taxonomyKeys?.[0] ?? selectedType.taxonomy_keys?.[0],
      selectedType.name,
      selectedCategory?.code ?? null,
    );
  }, [selectedType, selectedCategory]);

  const selectedTaxonomy = useMemo(() => {
    const taxonomyKey = String(
      selectedType?.taxonomyKeys?.[0] ?? selectedType?.taxonomy_keys?.[0] ?? "",
    )
      .trim()
      .toLowerCase();
    if (!taxonomyKey) return null;
    return (managedTaxonomies ?? []).find(
      (t) => t.key.trim().toLowerCase() === taxonomyKey,
    ) ?? null;
  }, [managedTaxonomies, selectedType?.taxonomyKeys, selectedType?.taxonomy_keys]);

  const taxonomyKey = selectedTaxonomy?.key ?? "";
  const isTagTaxonomy = selectedTaxonomy?.renderType === "tags";

  const categoryOptions = useMemo(() => {
    if (isTagTaxonomy || !selectedTaxonomy) return [];
    return (selectedTaxonomy.terms ?? []).map((term) => ({
      value: term.id,
      label: term.label,
    }));
  }, [selectedTaxonomy, isTagTaxonomy]);
  const organizationOptions = (organizations ?? []).map(
    (entry: MyOrganization) => entry.organization,
  );
  const projectOptions = projects ?? [];

  async function handleSave(submitAfterSave: boolean) {
    try {
      let payload: { team_id?: string; total_amount?: number; data: Record<string, unknown>; items?: RequestItemInput[] };

      if (family === "leave" || family === "loan") {
        const result = familyFormRef.current?.validateAndBuild();
        if (!result) return;
        if ("error" in result) {
          showToast({ tone: "warning", title: "Check this request", message: result.error });
          return;
        }
        payload = { ...result.payload, items: [] as RequestItemInput[] };
      } else {
        if (!form.purpose.trim()) {
          showToast({ tone: "warning", title: "Check this request", message: "Purpose is required." });
          return;
        }
        const result = familyFormRef.current?.validateAndBuild();
        if (!result) return;
        if ("error" in result) {
          showToast({ tone: "warning", title: "Check this request", message: result.error });
          return;
        }
        payload = {
          team_id: result.payload.team_id || undefined,
          data: {
            purpose: form.purpose.trim(),
            due_date: form.due_date || undefined,
            reimbursement: form.reimbursement,
            ...result.payload.data,
          },
          items: result.payload.items ?? [],
        };
      }
      const created = editId
        ? await updateRequest(editId, payload)
        : await createRequest({
            request_type_id: form.request_type_id,
            ...payload,
            items: payload.items ?? [],
          });

      const tagTaxonomyKey = taxonomyKey || "request_tags";
      if (tags.length > 0) {
        await replaceEntityTags("request", String(created.id), tagTaxonomyKey, {
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
          description={selectedCategory?.description || "Fill in the request details below."}
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
            {family === "leave" ? (
              <LeaveRequestFormPage
                ref={familyFormRef}
                selectedType={selectedType}
                selectedCategory={selectedCategory}
                organizationOptions={organizationOptions}
                groupOptions={groupOptions}
                handoverOptions={handoverOptions}
                editRequest={editRequest}
                loadingEdit={loadingEdit}
                onSummary={setSummaryContent}
                tags={tags}
                setTags={setTags}
                taxonomyKey={taxonomyKey}
                isTagTaxonomy={isTagTaxonomy}
              />
            ) : family === "loan" ? (
              <LoanRequestFormPage
                ref={familyFormRef}
                selectedType={selectedType}
                selectedCategory={selectedCategory}
                organizationOptions={organizationOptions}
                groupOptions={groupOptions}
                editRequest={editRequest}
                loadingEdit={loadingEdit}
                onSummary={setSummaryContent}
              />
            ) : (
              <>
                <SectionCard
                  title="Request Setup"
                  description="Configure the request details and timing."
                >
                  {family === "payment" ? (
                    <div className="grid gap-4 lg:grid-cols-2">
                      <TextField
                        label="Due Date"
                        type="date"
                        value={form.due_date}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, due_date: event.target.value }))
                        }
                      />
                      <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
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
                            setForm((prev) => ({ ...prev, reimbursement: event.target.checked }))
                          }
                          className="h-5 w-5 rounded border-slate-300 text-brand-900 focus:ring-brand-900"
                        />
                      </label>
                    </div>
                  ) : null}
                  {isTagTaxonomy ? (
                    <div className={family === "payment" ? "mt-5 border-t border-slate-100 pt-5" : ""}>
                      <TagPicker
                        taxonomyKey={taxonomyKey}
                        value={tags}
                        onChange={setTags}
                        placeholder="Add tags"
                        label="Tags"
                      />
                    </div>
                  ) : null}
                  <div className="mt-5 border-t border-slate-100 pt-5">
                    <TextAreaField
                      label="Purpose"
                      value={form.purpose}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, purpose: event.target.value }))
                      }
                      placeholder="Explain why this request is needed and what outcome it supports."
                    />
                  </div>
                </SectionCard>
                {family === "payment" ? (
                  <FinancialRequestFormPage
                    ref={familyFormRef}
                    selectedType={selectedType}
                    selectedCategory={selectedCategory}
                    organizationOptions={organizationOptions}
                    groupOptions={groupOptions}
                    projectOptions={projectOptions}
                    vendorOptions={vendorOptions}
                    categoryOptions={categoryOptions}
                    editRequest={editRequest}
                    loadingEdit={loadingEdit}
                    onSummary={setSummaryContent}
                    tags={tags}
                    setTags={setTags}
                  />
                ) : (
                  <OtherRequestFormPage
                    ref={familyFormRef}
                    selectedType={selectedType}
                    selectedCategory={selectedCategory}
                    organizationOptions={organizationOptions}
                    groupOptions={groupOptions}
                    projectOptions={projectOptions}
                    categoryOptions={categoryOptions}
                    editRequest={editRequest}
                    loadingEdit={loadingEdit}
                    onSummary={setSummaryContent}
                  />
                )}
              </>
            )}
          </div>

          <RightRail className="self-start lg:col-span-4 lg:sticky lg:top-28">
            {summaryContent}

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
            {selectedCategory?.description || "Fill in the request details below."}
          </p>
        </div>

        {summaryContent}

        {family !== "leave" && family !== "loan" ? (
          <>
            <SectionCard title="Request Setup">
              {family === "payment" ? (
                <div className="grid gap-4">
                  <TextField
                    label="Due Date"
                    type="date"
                    value={form.due_date}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, due_date: event.target.value }))
                    }
                  />
                  <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
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
                        setForm((prev) => ({ ...prev, reimbursement: event.target.checked }))
                      }
                      className="h-5 w-5 rounded border-slate-300 text-brand-900 focus:ring-brand-900"
                    />
                  </label>
                </div>
              ) : null}
              {isTagTaxonomy ? (
                <div className={family === "payment" ? "mt-5 border-t border-slate-100 pt-5" : ""}>
                  <TagPicker
                    taxonomyKey={taxonomyKey}
                    value={tags}
                    onChange={setTags}
                    placeholder="Add tags"
                    label="Tags"
                  />
                </div>
              ) : null}
              <div className="mt-5 border-t border-slate-100 pt-5">
                <TextAreaField
                  label="Purpose"
                  value={form.purpose}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, purpose: event.target.value }))
                  }
                />
              </div>
            </SectionCard>
          </>
        ) : null}

        {family === "leave" ? (
          <LeaveRequestFormPage
            ref={familyFormRef}
            selectedType={selectedType}
            selectedCategory={selectedCategory}
            organizationOptions={organizationOptions}
            groupOptions={groupOptions}
            handoverOptions={handoverOptions}
            editRequest={editRequest}
            loadingEdit={loadingEdit}
            onSummary={setSummaryContent}
            tags={tags}
            setTags={setTags}
            taxonomyKey={taxonomyKey}
            isTagTaxonomy={isTagTaxonomy}
          />
        ) : family === "loan" ? (
          <LoanRequestFormPage
            ref={familyFormRef}
            selectedType={selectedType}
            selectedCategory={selectedCategory}
            organizationOptions={organizationOptions}
            groupOptions={groupOptions}
            editRequest={editRequest}
            loadingEdit={loadingEdit}
            onSummary={setSummaryContent}
          />
        ) : family === "payment" ? (
          <FinancialRequestFormPage
            ref={familyFormRef}
            selectedType={selectedType}
            selectedCategory={selectedCategory}
            organizationOptions={organizationOptions}
            groupOptions={groupOptions}
            projectOptions={projectOptions}
            vendorOptions={vendorOptions}
            categoryOptions={categoryOptions}
            editRequest={editRequest}
            loadingEdit={loadingEdit}
            onSummary={setSummaryContent}
            tags={tags}
            setTags={setTags}
          />
        ) : (
          <OtherRequestFormPage
            ref={familyFormRef}
            selectedType={selectedType}
            selectedCategory={selectedCategory}
            organizationOptions={organizationOptions}
            groupOptions={groupOptions}
            projectOptions={projectOptions}
            categoryOptions={categoryOptions}
            editRequest={editRequest}
            loadingEdit={loadingEdit}
            onSummary={setSummaryContent}
          />
        )}

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
