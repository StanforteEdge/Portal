import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import { FormInput, FormLabel, FormSelect } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import {
  createRequestType,
  listRequestGroups,
  listRequestTypes,
  updateRequestType,
  type RequestGroupOption,
  type RequestTypeOption,
} from "@/services/requests";
import { listManagedTaxonomies } from "@/services/taxonomy";

type RequestTypeFormState = {
  id?: string;
  name: string;
  code_prefix: string;
  category_key: string;
  project_required: boolean;
  description: string;
  approval_limit: string;
  is_active: boolean;
};

type ApprovalStepForm = {
  role: string;
  min_amount: string;
};

type FinanceCategoryOption = {
  key: string;
  name: string;
};

const emptyTypeForm: RequestTypeFormState = {
  name: "",
  code_prefix: "",
  category_key: "",
  project_required: false,
  description: "",
  approval_limit: "",
  is_active: true,
};

const defaultApprovalSteps: ApprovalStepForm[] = [
  { role: "team_lead", min_amount: "" },
  { role: "accountant", min_amount: "" },
];

const roleOptions = [
  { value: "team_lead", label: "Team Lead" },
  { value: "accountant", label: "Accountant" },
  { value: "finance_manager", label: "Finance Manager" },
  { value: "coo", label: "COO" },
  { value: "ed", label: "ED" },
];

function Main() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [requestGroups, setRequestGroups] = useState<RequestGroupOption[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [requestTypes, setRequestTypes] = useState<RequestTypeOption[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<FinanceCategoryOption[]>([]);
  const [typeForm, setTypeForm] = useState<RequestTypeFormState>(emptyTypeForm);
  const [approvalSteps, setApprovalSteps] = useState<ApprovalStepForm[]>(defaultApprovalSteps);
  const [loading, setLoading] = useState(true);
  const [savingType, setSavingType] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  const selectedGroup = useMemo(
    () => requestGroups.find((group) => group.id === selectedGroupId),
    [requestGroups, selectedGroupId]
  );

  const loadTypeIntoForm = (type: RequestTypeOption) => {
    const stepsRaw = (type.approval_flow_json as { steps?: Array<{ role?: string; min_amount?: number }> } | null)?.steps;
    const normalizedSteps =
      Array.isArray(stepsRaw) && stepsRaw.length > 0
        ? stepsRaw.map((step) => ({
            role: String(step.role || ""),
            min_amount: step.min_amount !== undefined && step.min_amount !== null ? String(Number(step.min_amount)) : "",
          }))
        : defaultApprovalSteps;

    setTypeForm({
      id: type.id,
      name: type.name,
      code_prefix: type.code_prefix,
      category_key: type.category_key || "",
      project_required: Boolean((type.form_schema as Record<string, unknown> | null)?.project_required),
      description: type.description || "",
      approval_limit: type.approval_limit !== null && type.approval_limit !== undefined ? String(type.approval_limit) : "",
      is_active: type.is_active,
    });
    setApprovalSteps(normalizedSteps);
  };

  useEffect(() => {
    const run = async () => {
      try {
        const [groups, taxonomies] = await Promise.all([
          listRequestGroups(),
          listManagedTaxonomies({ include_inactive: false, module: "finance" }).catch(() => []),
        ]);

        setRequestGroups(groups);

        const options = (taxonomies || [])
          .filter((taxonomy) => String(taxonomy.module || "").trim().toLowerCase() === "finance")
          .map((taxonomy) => ({ key: String(taxonomy.key), name: String(taxonomy.name) }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setCategoryOptions(options);

        const financeGroup = groups.find((group) => {
          const code = group.code.toLowerCase();
          const name = group.name.toLowerCase();
          return code.includes("fin") || name.includes("finance");
        });
        const groupId = financeGroup?.id || groups[0]?.id || "";
        setSelectedGroupId(groupId);

        if (groupId) {
          const types = await listRequestTypes({ group_id: groupId, include_inactive: true });
          setRequestTypes(types);

          if (id) {
            const found = types.find((type) => type.id === id);
            if (found) {
              loadTypeIntoForm(found);
            } else {
              setNotice({ tone: "error", message: "Request type not found." });
            }
          }
        }
      } catch {
        setNotice({ tone: "error", message: "Unable to load request type editor." });
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [id]);

  const saveRequestType = async () => {
    if (!selectedGroupId) {
      setNotice({ tone: "warning", message: "Select a request group first." });
      return;
    }
    if (!typeForm.name.trim() || !typeForm.code_prefix.trim()) {
      setNotice({ tone: "warning", message: "Name and code prefix are required." });
      return;
    }

    const stepsPayload = approvalSteps
      .map((step) => ({
        role: step.role.trim(),
        ...(step.min_amount ? { min_amount: Number(step.min_amount) } : {}),
      }))
      .filter((step) => step.role.length > 0);

    if (stepsPayload.length === 0) {
      setNotice({ tone: "warning", message: "Add at least one approval step with a role." });
      return;
    }

    try {
      setSavingType(true);
      setNotice(null);
      const payload = {
        name: typeForm.name.trim(),
        code_prefix: typeForm.code_prefix.trim().toUpperCase(),
        category_key: typeForm.category_key || undefined,
        form_schema: {
          project_required: typeForm.project_required,
        },
        description: typeForm.description || undefined,
        approval_limit: typeForm.approval_limit ? Number(typeForm.approval_limit) : undefined,
        approval_flow_json: { steps: stepsPayload },
        is_active: typeForm.is_active,
      };

      if (typeForm.id) {
        await updateRequestType(typeForm.id, payload);
      } else {
        await createRequestType({ group_id: selectedGroupId, ...payload });
      }

      navigate("/app/finance/settings", { replace: true });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save request type." });
    } finally {
      setSavingType(false);
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">{isEdit ? "Edit Request Type" : "Create Request Type"}</h2>
      </div>
      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="box mt-5 p-5">
        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 rounded bg-slate-200"></div>
            <div className="h-4 rounded bg-slate-100"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-slate-500">
              Module: <strong>{selectedGroup?.name || "Finance"}</strong>
            </div>

            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 md:col-span-6">
                <FormLabel>Name</FormLabel>
                <FormInput value={typeForm.name} onChange={(e) => setTypeForm((prev) => ({ ...prev, name: e.target.value }))} />
              </div>
              <div className="col-span-12 md:col-span-3">
                <FormLabel>Code Prefix</FormLabel>
                <FormInput
                  value={typeForm.code_prefix}
                  onChange={(e) => setTypeForm((prev) => ({ ...prev, code_prefix: e.target.value.toUpperCase() }))}
                />
              </div>
              <div className="col-span-12 md:col-span-3">
                <FormLabel>Active</FormLabel>
                <FormSelect
                  value={typeForm.is_active ? "true" : "false"}
                  onChange={(e) => setTypeForm((prev) => ({ ...prev, is_active: e.target.value === "true" }))}
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </FormSelect>
              </div>

              <div className="col-span-12 md:col-span-6">
                <FormLabel>Category Taxonomy</FormLabel>
                <FormSelect
                  value={typeForm.category_key}
                  onChange={(e) => setTypeForm((prev) => ({ ...prev, category_key: e.target.value }))}
                >
                  <option value="">Select taxonomy</option>
                  {categoryOptions.map((category) => (
                    <option key={category.key} value={category.key}>
                      {category.name}
                    </option>
                  ))}
                </FormSelect>
              </div>
              <div className="col-span-12 md:col-span-3">
                <FormLabel>Project Required</FormLabel>
                <FormSelect
                  value={typeForm.project_required ? "true" : "false"}
                  onChange={(e) => setTypeForm((prev) => ({ ...prev, project_required: e.target.value === "true" }))}
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </FormSelect>
              </div>
              <div className="col-span-12 md:col-span-3">
                <FormLabel>Approval Limit</FormLabel>
                <FormInput
                  type="number"
                  value={typeForm.approval_limit}
                  onChange={(e) => setTypeForm((prev) => ({ ...prev, approval_limit: e.target.value }))}
                />
              </div>

              <div className="col-span-12">
                <FormLabel>Description</FormLabel>
                <FormInput
                  value={typeForm.description}
                  onChange={(e) => setTypeForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="col-span-12">
                <div className="flex items-center justify-between mb-2">
                  <FormLabel>Approval Flow</FormLabel>
                  <Button
                    variant="outline-primary"
                    type="button"
                    onClick={() => setApprovalSteps((prev) => [...prev, { role: "", min_amount: "" }])}
                  >
                    Add Step
                  </Button>
                </div>

                <div className="space-y-2">
                  {approvalSteps.map((step, index) => (
                    <div key={`${index}-${step.role}`} className="grid grid-cols-12 gap-3 rounded-md border p-3">
                      <div className="col-span-12 md:col-span-5">
                        <FormLabel>Role</FormLabel>
                        <FormSelect
                          value={step.role}
                          onChange={(e) =>
                            setApprovalSteps((prev) =>
                              prev.map((current, currentIndex) =>
                                currentIndex === index ? { ...current, role: e.target.value } : current
                              )
                            )
                          }
                        >
                          <option value="">Select role</option>
                          {roleOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </FormSelect>
                      </div>
                      <div className="col-span-12 md:col-span-5">
                        <FormLabel>Min Amount (optional)</FormLabel>
                        <FormInput
                          type="number"
                          value={step.min_amount}
                          onChange={(e) =>
                            setApprovalSteps((prev) =>
                              prev.map((current, currentIndex) =>
                                currentIndex === index ? { ...current, min_amount: e.target.value } : current
                              )
                            )
                          }
                          placeholder="e.g 500000"
                        />
                      </div>
                      <div className="col-span-12 md:col-span-2 flex items-end">
                        <Button
                          variant="outline-danger"
                          type="button"
                          className="w-full"
                          onClick={() => setApprovalSteps((prev) => prev.filter((_, currentIndex) => currentIndex !== index))}
                          disabled={approvalSteps.length === 1}
                        >
                          <Lucide icon="Trash2" className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-span-12 flex flex-wrap gap-2">
                <Button onClick={saveRequestType} disabled={savingType}>
                  {savingType ? "Saving..." : typeForm.id ? "Update Type" : "Create Type"}
                </Button>
                <Button variant="outline-secondary" onClick={() => navigate("/app/finance/settings")}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Main;
