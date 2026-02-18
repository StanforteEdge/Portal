import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import { FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import {
  createRequest,
  listRequestTypes,
  submitRequest,
  type RequestItemInput,
  type RequestTypeOption,
} from "@/services/requests";
import { listProjects } from "@/services/projects";
import { listMyOrganizations, listOrganizations } from "@/services/organizations";
import { attachFileAsset } from "@/services/files";
import { listTeams, type TeamOption } from "@/services/teams";
import { listManagedTaxonomies } from "@/services/taxonomy";
import { getMyProfile } from "@/services/profile";
import { formatMoney } from "@/utils/formatting";

type CategoryTermOption = { id: string; value: string; label: string };

type CreateItemState = RequestItemInput & {
  unit_price?: number;
  category?: string;
  file_name?: string;
};

type CreateFormState = {
  request_type_id: string;
  reimbursement: boolean;
  purpose: string;
  category_id: string;
  project: string;
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
  file_name: "",
};

const defaultForm: CreateFormState = {
  request_type_id: "",
  reimbursement: false,
  purpose: "",
  category_id: "",
  project: "",
  team_id: "",
  organization_id: "",
  due_date: "",
  items: [{ ...defaultItem }],
};

function RequestsCreatePage() {
  const navigate = useNavigate();
  const [types, setTypes] = useState<RequestTypeOption[]>([]);
  const [projectOptions, setProjectOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [organizationOptions, setOrganizationOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [teamOptions, setTeamOptions] = useState<TeamOption[]>([]);
  const [taxonomyMap, setTaxonomyMap] = useState<Record<string, CategoryTermOption[]>>({});
  const [categoryOptions, setCategoryOptions] = useState<CategoryTermOption[]>([]);

  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [form, setForm] = useState<CreateFormState>(defaultForm);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  const selectedRequestType = useMemo(
    () => types.find((type) => type.id === form.request_type_id),
    [types, form.request_type_id]
  );

  const projectRequired = useMemo(() => {
    return Boolean((selectedRequestType?.form_schema as any)?.project_required);
  }, [selectedRequestType]);

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

        setTypes(typeData);
        setProjectOptions(projects.map((project) => ({ id: project.id, name: project.name })));
        const myProfile = await getMyProfile().catch(() => null);
        const myUserId = myProfile?.id ? String(myProfile.id) : "";

        const myOrgOptions = orgs.map((row) => ({ id: row.organization.id, name: row.organization.name }));
        const allOrgOptions =
          myOrgOptions.length === 0
            ? (await listOrganizations({ is_active: true }).catch(() => [])).map((row) => ({ id: row.id, name: row.name }))
            : myOrgOptions;
        setOrganizationOptions(allOrgOptions);

        const allTeams = teams || [];
        const myTeams =
          myUserId.length > 0
            ? allTeams.filter((team) => (team.members || []).some((member) => String(member.userId) === myUserId))
            : [];
        const resolvedTeams = myTeams.length > 0 ? myTeams : allTeams;
        setTeamOptions(resolvedTeams);

        const nextTaxonomyMap: Record<string, CategoryTermOption[]> = {};
        for (const taxonomy of taxonomies || []) {
          const key = String(taxonomy.key || "").trim();
          if (!key) continue;
          nextTaxonomyMap[key] = (taxonomy.terms || [])
            .map((term) => ({
              id: String(term.id || "").trim(),
              value: String(term.value || "").trim(),
              label: String(term.label || "").trim(),
            }))
            .filter((term) => term.id && term.value && term.label);
        }
        setTaxonomyMap(nextTaxonomyMap);

        setForm((prev) => ({
          ...prev,
          organization_id: allOrgOptions.length === 1 ? allOrgOptions[0].id : prev.organization_id,
          team_id: resolvedTeams.length === 1 ? resolvedTeams[0].id : prev.team_id,
        }));
      } catch (error: any) {
        setNotice({
          tone: "error",
          message: error?.response?.data?.error?.message || "Unable to load request setup data.",
        });
      }
    };

    void loadOptions();
  }, []);

  useEffect(() => {
    const taxonomyKey = selectedRequestType?.category_key || "";
    const options = taxonomyKey ? taxonomyMap[taxonomyKey] || [] : [];
    setCategoryOptions(options);
    setForm((prev) => {
      if (!prev.category_id) return prev;
      const exists = options.some((option) => option.id === prev.category_id);
      return exists ? prev : { ...prev, category_id: "" };
    });
  }, [selectedRequestType?.category_key, taxonomyMap]);

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

  const uploadFileForItem = async (index: number, file: File | null) => {
    if (!file) return;
    try {
      setUploadingIndex(index);
      const attached = await attachFileAsset({
        storage_path: `uploads/requests/${Date.now()}-${file.name}`,
        file_name: file.name,
        mime_type: file.type || "application/octet-stream",
        file_size: file.size,
        metadata: { source: "request_item_invoice" },
      });

      setForm((prev) => {
        const items = [...prev.items];
        items[index] = {
          ...items[index],
          file_id: attached.id,
          file_name: file.name,
        };
        return { ...prev, items };
      });
    } catch (error: any) {
      setNotice({
        tone: "error",
        message: error?.response?.data?.error?.message || "Unable to attach file metadata.",
      });
    } finally {
      setUploadingIndex(null);
    }
  };

  const validate = () => {
    if (!form.request_type_id) return "Select a request type.";
    if (!form.purpose.trim()) return "Purpose is required.";
    if (projectRequired && !form.project) return "Project is required for this request type.";
    if (form.items.some((item) => !item.description || Number(item.quantity || 0) <= 0 || Number(item.unit_price || 0) <= 0)) {
      return "Each item needs item name, unit price and quantity.";
    }
    return null;
  };

  const createOnly = async () => {
    const validationError = validate();
    if (validationError) {
      setNotice({ tone: "warning", message: validationError });
      return;
    }

    const payloadItems: RequestItemInput[] = form.items.map((item) => ({
      description: item.description,
      amount: Number(item.unit_price || 0),
      quantity: Number(item.quantity || 1),
      notes: item.notes,
      file_id: item.file_id,
    }));

    return createRequest({
      request_type_id: form.request_type_id,
      team_id: form.team_id || undefined,
      data: {
        purpose: form.purpose,
        reimbursement: form.reimbursement,
        category_id: form.category_id || undefined,
        project: form.project || undefined,
        team_id: form.team_id || undefined,
        organization_id: form.organization_id || undefined,
        due_date: form.due_date || undefined,
      },
      items: payloadItems,
    });
  };

  const onSaveDraft = async () => {
    try {
      setSavingDraft(true);
      setNotice(null);
      const created = await createOnly();
      if (!created) return;
      setNotice({ tone: "success", message: "Draft saved successfully." });
      navigate(`/app/requests/request/${created.id}`);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save draft." });
    } finally {
      setSavingDraft(false);
    }
  };

  const onSubmit = async () => {
    try {
      setSubmitting(true);
      setNotice(null);
      const created = await createOnly();
      if (!created) return;
      await submitRequest(created.id);
      navigate(`/app/requests/request/${created.id}`);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to submit request." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Create Request</h2>
        <Button variant="outline-secondary" onClick={() => navigate("/app/requests")}>
          <Lucide icon="ChevronLeft" className="w-4 h-4 mr-1" />
          Back to Requests
        </Button>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="box mt-5 p-5 space-y-5">
        <div className="col-span-12">
          <FormLabel className="w-full">Request Type</FormLabel>
          <div className="flex flex-wrap items-center gap-4">
            <FormSelect className="w-auto" value={form.request_type_id} onChange={(e) => setForm((prev) => ({ ...prev, request_type_id: e.target.value }))}>
              <option value="">Select type</option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </FormSelect>
            {form.request_type_id ? (
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

          <div className="col-span-12 md:col-span-4">
            <FormLabel>Due Date</FormLabel>
            <FormInput type="date" value={form.due_date} onChange={(e) => setForm((prev) => ({ ...prev, due_date: e.target.value }))} />
          </div>
          {projectRequired ? (
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Project</FormLabel>
              <FormSelect value={form.project} onChange={(e) => setForm((prev) => ({ ...prev, project: e.target.value }))}>
                <option value="">Select project</option>
                {projectOptions.map((project) => (
                  <option key={project.id} value={project.name}>
                    {project.name}
                  </option>
                ))}
              </FormSelect>
            </div>
          ) : null}

          {shouldShowTeamSelect ? (
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

          {shouldShowOrganizationSelect ? (
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



          <div className="col-span-12">
            <FormLabel>Purpose</FormLabel>
            <FormTextarea rows={4} value={form.purpose} onChange={(e) => setForm((prev) => ({ ...prev, purpose: e.target.value }))} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center">
            <h3 className="mr-auto text-base font-medium">Request Items</h3>
            <Button variant="outline-primary" onClick={addItem}>
              Add Item
            </Button>
          </div>

          {form.items.map((item, index) => (
            <div key={index} className="border rounded-md p-4 space-y-3">
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-12 md:col-span-5">
                  <FormLabel>Item</FormLabel>
                  <FormInput value={item.description} onChange={(e) => updateItem(index, "description", e.target.value)} />
                </div>
                <div className="col-span-6 md:col-span-2">
                  <FormLabel>Price</FormLabel>
                  <FormInput
                    type="number"
                    value={item.unit_price || ""}
                    onChange={(e) => updateItem(index, "unit_price", e.target.value)}
                  />
                </div>
                <div className="col-span-6 md:col-span-2">
                  <FormLabel>Quantity</FormLabel>
                  <FormInput
                    type="number"
                    value={item.quantity || 1}
                    onChange={(e) => updateItem(index, "quantity", e.target.value)}
                  />
                </div>
                <div className="col-span-12 md:col-span-2">
                  <FormLabel>Amount</FormLabel>
                  <FormInput value={String(formatMoney(item.amount || 0))} readOnly />
                </div>
                <div className="col-span-12 md:col-span-1 flex items-end">
                  {form.items.length > 1 ? (
                    <Button variant="outline-danger" className="w-auto" onClick={() => removeItem(index)}>
                      Remove
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-12 md:col-span-8">
                  <FormLabel>Notes</FormLabel>
                  <FormTextarea value={item.notes || ""} onChange={(e) => updateItem(index, "notes", e.target.value)} />
                </div>
                <div className="col-span-12 md:col-span-4">
                  <FormLabel>Invoice File</FormLabel>
                  <FormInput
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      void uploadFileForItem(index, file);
                    }}
                    disabled={uploadingIndex === index}
                  />
                  <div className="text-xs text-slate-500 mt-1">
                    {uploadingIndex === index
                      ? "Attaching..."
                      : item.file_name
                        ? `Attached: ${item.file_name}`
                        : "Attach invoice per item"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-between gap-2">
          <div className=" ">
            <div className="text-slate-500 text-sm">Grand Total</div>
            <div className="text-2xl font-semibold mt-2">{formatMoney(grandTotal)}</div>
          </div>
          <div className="flex flex-row justify-end items-center gap-2">
            <Button variant="outline-secondary" onClick={() => void onSaveDraft()} disabled={savingDraft || submitting}>
              {savingDraft ? "Saving..." : "Save Draft"}
            </Button>
            <Button variant="primary" onClick={() => void onSubmit()} disabled={savingDraft || submitting}>
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default RequestsCreatePage;
