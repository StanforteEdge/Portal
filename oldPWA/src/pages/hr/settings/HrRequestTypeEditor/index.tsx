import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import { FormInput, FormLabel, FormSelect } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import {
  createRequestType,
  deleteRequestType,
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
  leave_type_key: string;
  entitled_days_per_year: string;
  max_carryover_days: string;
  min_notice_days: string;
  max_days_per_request: string;
  allow_half_day: boolean;
  half_day_requires_attachment: boolean;
  description: string;
  approval_limit: string;
  is_active: boolean;
};

type ApprovalStepForm = {
  role: string;
};

type HrCategoryOption = {
  key: string;
  name: string;
};

const emptyTypeForm: RequestTypeFormState = {
  name: "",
  code_prefix: "",
  category_key: "",
  leave_type_key: "",
  entitled_days_per_year: "",
  max_carryover_days: "",
  min_notice_days: "",
  max_days_per_request: "",
  allow_half_day: false,
  half_day_requires_attachment: false,
  description: "",
  approval_limit: "",
  is_active: true,
};

const defaultApprovalSteps: ApprovalStepForm[] = [{ role: "team_lead" }];

const roleOptions = [
  { value: "team_lead", label: "Team Lead" },
  { value: "hr", label: "HR" },
  { value: "coo", label: "COO" },
  { value: "ed", label: "ED" },
];

function normalizeLeaveKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function Main() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [requestGroups, setRequestGroups] = useState<RequestGroupOption[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [requestTypes, setRequestTypes] = useState<RequestTypeOption[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<HrCategoryOption[]>([]);
  const [typeForm, setTypeForm] = useState<RequestTypeFormState>(emptyTypeForm);
  const [approvalSteps, setApprovalSteps] = useState<ApprovalStepForm[]>(defaultApprovalSteps);
  const [loading, setLoading] = useState(true);
  const [savingType, setSavingType] = useState(false);
  const [deletingType, setDeletingType] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  const selectedGroup = useMemo(
    () => requestGroups.find((group) => group.id === selectedGroupId),
    [requestGroups, selectedGroupId]
  );

  const loadTypeIntoForm = (type: RequestTypeOption) => {
    const schema = (type.form_schema || {}) as Record<string, unknown>;
    const stepsRaw = (type.approval_flow_json as { steps?: Array<{ role?: string }> } | null)?.steps;
    const normalizedSteps =
      Array.isArray(stepsRaw) && stepsRaw.length > 0
        ? stepsRaw.map((step) => ({
            role: String(step.role || ""),
          }))
        : defaultApprovalSteps;

    setTypeForm({
      id: type.id,
      name: type.name,
      code_prefix: type.code_prefix,
      category_key: type.category_key || "",
      leave_type_key: String(schema.leave_type_key ?? ""),
      entitled_days_per_year:
        schema.entitled_days_per_year !== undefined && schema.entitled_days_per_year !== null
          ? String(schema.entitled_days_per_year)
          : "",
      max_carryover_days:
        schema.max_carryover_days !== undefined && schema.max_carryover_days !== null
          ? String(schema.max_carryover_days)
          : "",
      min_notice_days:
        schema.min_notice_days !== undefined && schema.min_notice_days !== null
          ? String(schema.min_notice_days)
          : "",
      max_days_per_request:
        schema.max_days_per_request !== undefined && schema.max_days_per_request !== null
          ? String(schema.max_days_per_request)
          : "",
      allow_half_day: Boolean(schema.allow_half_day ?? false),
      half_day_requires_attachment: Boolean(schema.half_day_requires_attachment ?? false),
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
          listManagedTaxonomies({ include_inactive: false, module: "hr" }).catch(() => []),
        ]);

        setRequestGroups(groups);

        const options = (taxonomies || [])
          .filter((taxonomy) => String(taxonomy.module || "").trim().toLowerCase() === "hr")
          .map((taxonomy) => ({ key: String(taxonomy.key), name: String(taxonomy.name) }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setCategoryOptions(options);

        const hrGroup = groups.find((group) => {
          const code = group.code.toLowerCase();
          const name = group.name.toLowerCase();
          return code.includes("hr") || name.includes("hr") || name.includes("leave");
        });
        const groupId = hrGroup?.id || "";
        if (!groupId) {
          setNotice({ tone: "warning", message: "No HR request group found. Create an HR request group first." });
          return;
        }
        setSelectedGroupId(groupId);

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
      } catch {
        setNotice({ tone: "error", message: "Unable to load HR request type editor." });
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [id]);

  const saveRequestType = async () => {
    if (!selectedGroupId) {
      setNotice({ tone: "warning", message: "HR request group is required." });
      return;
    }
    if (!typeForm.name.trim() || !typeForm.code_prefix.trim()) {
      setNotice({ tone: "warning", message: "Name and code prefix are required." });
      return;
    }

    const stepsPayload = approvalSteps
      .map((step) => ({
        role: step.role.trim(),
      }))
      .filter((step) => step.role.length > 0);

    if (stepsPayload.length === 0) {
      setNotice({ tone: "warning", message: "Add at least one approval step with a role." });
      return;
    }

    try {
      setSavingType(true);
      setNotice(null);
      const normalizedLeaveKey = normalizeLeaveKey(typeForm.leave_type_key || typeForm.name);
      const payload = {
        name: typeForm.name.trim(),
        code_prefix: typeForm.code_prefix.trim().toUpperCase(),
        category_key: typeForm.category_key || undefined,
        form_schema: {
          leave_type_key: normalizedLeaveKey || undefined,
          entitled_days_per_year: typeForm.entitled_days_per_year ? Number(typeForm.entitled_days_per_year) : 0,
          max_carryover_days: typeForm.max_carryover_days ? Number(typeForm.max_carryover_days) : 0,
          min_notice_days: typeForm.min_notice_days ? Number(typeForm.min_notice_days) : 0,
          max_days_per_request: typeForm.max_days_per_request ? Number(typeForm.max_days_per_request) : 0,
          allow_half_day: Boolean(typeForm.allow_half_day),
          half_day_requires_attachment: Boolean(typeForm.allow_half_day && typeForm.half_day_requires_attachment),
        },
        description: typeForm.description || undefined,
        approval_limit: typeForm.approval_limit ? Number(typeForm.approval_limit) : undefined,
        approval_flow_json: { steps: stepsPayload },
        is_active: typeForm.is_active,
      };

      if (typeForm.id) {
        await updateRequestType(typeForm.id, payload);
      } else {
        await createRequestType({ category_id: selectedGroupId, ...payload });
      }

      navigate("/appOld/hr/settings/leave", { replace: true });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save request type." });
    } finally {
      setSavingType(false);
    }
  };

  const removeRequestType = async () => {
    if (!typeForm.id) return;
    const confirmed = window.confirm("Delete this request type? This cannot be undone.");
    if (!confirmed) return;
    try {
      setDeletingType(true);
      setNotice(null);
      await deleteRequestType(typeForm.id);
      navigate("/appOld/hr/settings/leave", { replace: true });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to delete request type." });
    } finally {
      setDeletingType(false);
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">{isEdit ? "Edit HR Request Type" : "Create HR Request Type"}</h2>
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
              Module: <strong>{selectedGroup?.name || "HR"}</strong>
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
                <FormLabel>Category Taxonomy (Optional)</FormLabel>
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
                <div className="text-xs text-slate-500 mt-1">
                  Optional for extra classification/reporting. Leave blank for standard leave types.
                </div>
              </div>

              <div className="col-span-12 md:col-span-6">
                <FormLabel>Leave Type Key</FormLabel>
                <FormInput
                  value={typeForm.leave_type_key}
                  onChange={(e) => setTypeForm((prev) => ({ ...prev, leave_type_key: normalizeLeaveKey(e.target.value) }))}
                  placeholder="e.g. annual_leave"
                />
                <div className="text-xs text-slate-500 mt-1">Used by leave balances and overrides.</div>
              </div>

              <div className="col-span-12">
                <FormLabel>Description</FormLabel>
                <FormInput
                  value={typeForm.description}
                  onChange={(e) => setTypeForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="col-span-12">
                <div className="rounded-md border p-4">
                  <div className="font-medium">Leave Rules</div>
                  <div className="grid grid-cols-12 gap-3 mt-3">
                    <div className="col-span-12 md:col-span-4">
                      <FormLabel>Entitled Days / Year</FormLabel>
                      <FormInput
                        type="number"
                        min={0}
                        step="0.5"
                        value={typeForm.entitled_days_per_year}
                        onChange={(e) => setTypeForm((prev) => ({ ...prev, entitled_days_per_year: e.target.value }))}
                      />
                    </div>
                    <div className="col-span-12 md:col-span-4">
                      <FormLabel>Max Carryover Days</FormLabel>
                      <FormInput
                        type="number"
                        min={0}
                        step="0.5"
                        value={typeForm.max_carryover_days}
                        onChange={(e) => setTypeForm((prev) => ({ ...prev, max_carryover_days: e.target.value }))}
                      />
                    </div>
                    <div className="col-span-12 md:col-span-4">
                      <FormLabel>Min Notice (days)</FormLabel>
                      <FormInput
                        type="number"
                        min={0}
                        value={typeForm.min_notice_days}
                        onChange={(e) => setTypeForm((prev) => ({ ...prev, min_notice_days: e.target.value }))}
                      />
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <FormLabel>Max Days Per Request</FormLabel>
                      <FormInput
                        type="number"
                        min={0}
                        step="0.5"
                        value={typeForm.max_days_per_request}
                        onChange={(e) => setTypeForm((prev) => ({ ...prev, max_days_per_request: e.target.value }))}
                      />
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <FormLabel>Allow Half Day</FormLabel>
                      <FormSelect
                        value={typeForm.allow_half_day ? "true" : "false"}
                        onChange={(e) => setTypeForm((prev) => ({ ...prev, allow_half_day: e.target.value === "true" }))}
                      >
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </FormSelect>
                    </div>
                    <div className="col-span-12 md:col-span-4">
                      <FormLabel>Half Day Needs Attachment</FormLabel>
                      <FormSelect
                        value={typeForm.half_day_requires_attachment ? "true" : "false"}
                        onChange={(e) =>
                          setTypeForm((prev) => ({ ...prev, half_day_requires_attachment: e.target.value === "true" }))
                        }
                        disabled={!typeForm.allow_half_day}
                      >
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </FormSelect>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-span-12">
                <div className="flex items-center justify-between mb-2">
                  <FormLabel>Approval Flow</FormLabel>
                  <Button
                    variant="outline-primary"
                    type="button"
                    onClick={() => setApprovalSteps((prev) => [...prev, { role: "" }])}
                  >
                    Add Step
                  </Button>
                </div>

                <div className="space-y-2">
                  {approvalSteps.map((step, index) => (
                    <div key={`${index}-${step.role}`} className="grid grid-cols-12 gap-3 rounded-md border p-3">
                      <div className="col-span-12 md:col-span-9">
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
                      <div className="col-span-12 md:col-span-2 flex items-end">
                        <Button
                          variant="outline-danger"
                          type="button"
                          className="w-full"
                          onClick={() =>
                            setApprovalSteps((prev) =>
                              prev.length > 1 ? prev.filter((_, currentIndex) => currentIndex !== index) : prev
                            )
                          }
                        >
                          <Lucide icon="Trash2" className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 border-t pt-4 flex justify-end gap-2">
              {isEdit ? (
                <Button variant="outline-danger" onClick={() => void removeRequestType()} disabled={savingType || deletingType}>
                  <Lucide icon="Trash2" className="w-4 h-4 mr-1" />
                  {deletingType ? "Deleting..." : "Delete"}
                </Button>
              ) : null}
              <Button variant="outline-secondary" onClick={() => navigate("/appOld/hr/settings/leave")}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => void saveRequestType()} disabled={savingType || deletingType}>
                {savingType ? "Saving..." : "Save Request Type"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Main;
