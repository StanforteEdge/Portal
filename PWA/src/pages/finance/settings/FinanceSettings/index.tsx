import { useEffect, useMemo, useState } from "react";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import { FormInput, FormLabel, FormSelect } from "@/components/Base/Form";
import { Tab } from "@/components/Base/Headless";
import Table from "@/components/Base/Table";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { getFinanceSettings, updateFinanceSettings, type FinanceSettings } from "@/services/financeSettings";
import {
  createRequestType,
  listRequestGroups,
  listRequestTypes,
  updateRequestType,
  type RequestGroupOption,
  type RequestTypeOption,
} from "@/services/requests";
import { listManagedTaxonomies } from "@/services/taxonomy";

const emptySettings: FinanceSettings = {
  prepared_by: { name: "", title: "Accountant" },
  reviewed_by: { name: "", title: "Finance Manager / COO" },
  approved_by: { name: "", title: "Executive Director" },
  meta: {},
};

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
  const [settings, setSettings] = useState<FinanceSettings>(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingType, setSavingType] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  const [requestGroups, setRequestGroups] = useState<RequestGroupOption[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [requestTypes, setRequestTypes] = useState<RequestTypeOption[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<FinanceCategoryOption[]>([]);
  const [typeForm, setTypeForm] = useState<RequestTypeFormState>(emptyTypeForm);
  const [approvalSteps, setApprovalSteps] = useState<ApprovalStepForm[]>(defaultApprovalSteps);
  const [showTypeEditor, setShowTypeEditor] = useState(false);

  const selectedGroup = useMemo(
    () => requestGroups.find((group) => group.id === selectedGroupId),
    [requestGroups, selectedGroupId]
  );

  const categoryLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const option of categoryOptions) map.set(option.key, option.name);
    return map;
  }, [categoryOptions]);

  const loadTypeData = async (groupId: string) => {
    const [types, taxonomies] = await Promise.all([
      listRequestTypes({ group_id: groupId, include_inactive: true }),
      listManagedTaxonomies({ include_inactive: false, module: "finance" }).catch(() => []),
    ]);

    setRequestTypes(types);

    const options = (taxonomies || [])
      .filter((taxonomy) => String(taxonomy.module || "").trim().toLowerCase() === "finance")
      .map((taxonomy) => ({ key: String(taxonomy.key), name: String(taxonomy.name) }))
      .sort((a, b) => a.name.localeCompare(b.name));

    setCategoryOptions(options);
  };

  useEffect(() => {
    const run = async () => {
      try {
        const [settingsData, groups] = await Promise.all([getFinanceSettings(), listRequestGroups()]);
        setSettings(settingsData);
        setRequestGroups(groups);

        const financeGroup = groups.find((group) => {
          const code = group.code.toLowerCase();
          const name = group.name.toLowerCase();
          return code.includes("fin") || name.includes("finance");
        });

        const initialGroupId = financeGroup?.id || groups[0]?.id || "";
        setSelectedGroupId(initialGroupId);
        if (initialGroupId) await loadTypeData(initialGroupId);
      } catch {
        setNotice({ tone: "error", message: "Unable to load finance settings." });
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, []);

  useEffect(() => {
    if (!selectedGroupId || loading) return;
    void loadTypeData(selectedGroupId);
  }, [selectedGroupId, loading]);

  const updateField = (key: "prepared_by" | "reviewed_by" | "approved_by", prop: "name" | "title", value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [prop]: value,
      },
    }));
  };

  const saveSignatories = async () => {
    try {
      setSaving(true);
      setNotice(null);
      const updated = await updateFinanceSettings(settings);
      setSettings(updated);
      setNotice({ tone: "success", message: "Finance settings updated." });
    } catch {
      setNotice({ tone: "error", message: "Unable to save finance settings." });
    } finally {
      setSaving(false);
    }
  };

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
      project_required: Boolean((type.form_schema as any)?.project_required),
      description: type.description || "",
      approval_limit: type.approval_limit !== null && type.approval_limit !== undefined ? String(type.approval_limit) : "",
      is_active: type.is_active,
    });
    setApprovalSteps(normalizedSteps);
    setShowTypeEditor(true);
  };

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

      await loadTypeData(selectedGroupId);
      setTypeForm(emptyTypeForm);
      setApprovalSteps(defaultApprovalSteps);
      setShowTypeEditor(false);
      setNotice({ tone: "success", message: "Request type saved." });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save request type." });
    } finally {
      setSavingType(false);
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Finance Settings</h2>
      </div>

      <div className="grid grid-cols-12 gap-6 mt-5 intro-y">
        <div className="col-span-12 box">
          <div className="p-5">
            {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mb-4" /> : null}

            <Tab.Group>
              <Tab.List variant="tabs">
                <Tab>
                  <Tab.Button className="w-full py-2" as="button">
                    Signatories
                  </Tab.Button>
                </Tab>
                <Tab>
                  <Tab.Button className="w-full py-2" as="button">
                    Request Types
                  </Tab.Button>
                </Tab>
              </Tab.List>

              <Tab.Panels className="border-b border-l border-r">
                <Tab.Panel className="p-5">
                  {loading ? (
                    <div className="text-slate-500">Loading settings...</div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-12 lg:col-span-6">
                          <FormLabel>Prepared By - Name</FormLabel>
                          <FormInput
                            value={settings.prepared_by.name}
                            onChange={(e) => updateField("prepared_by", "name", e.target.value)}
                          />
                        </div>
                        <div className="col-span-12 lg:col-span-6">
                          <FormLabel>Prepared By - Title</FormLabel>
                          <FormInput
                            value={settings.prepared_by.title}
                            onChange={(e) => updateField("prepared_by", "title", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-12 lg:col-span-6">
                          <FormLabel>Reviewed By - Name</FormLabel>
                          <FormInput
                            value={settings.reviewed_by.name}
                            onChange={(e) => updateField("reviewed_by", "name", e.target.value)}
                          />
                        </div>
                        <div className="col-span-12 lg:col-span-6">
                          <FormLabel>Reviewed By - Title</FormLabel>
                          <FormInput
                            value={settings.reviewed_by.title}
                            onChange={(e) => updateField("reviewed_by", "title", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-12 lg:col-span-6">
                          <FormLabel>Approved By - Name</FormLabel>
                          <FormInput
                            value={settings.approved_by.name}
                            onChange={(e) => updateField("approved_by", "name", e.target.value)}
                          />
                        </div>
                        <div className="col-span-12 lg:col-span-6">
                          <FormLabel>Approved By - Title</FormLabel>
                          <FormInput
                            value={settings.approved_by.title}
                            onChange={(e) => updateField("approved_by", "title", e.target.value)}
                          />
                        </div>
                      </div>

                      <Button variant="primary" onClick={saveSignatories} disabled={saving}>
                        {saving ? "Saving..." : "Save Settings"}
                      </Button>
                    </div>
                  )}
                </Tab.Panel>

                <Tab.Panel className="p-5">
                  {loading ? (
                    <div className="text-slate-500">Loading request types...</div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-12 text-slate-500 text-sm">
                          Module: <strong>{selectedGroup?.name || "Finance"}</strong>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          variant="primary"
                          onClick={() => {
                            setTypeForm(emptyTypeForm);
                            setApprovalSteps(defaultApprovalSteps);
                            setShowTypeEditor(true);
                          }}
                        >
                          Create Request Type
                        </Button>
                      </div>

                      <div className="grid grid-cols-12 gap-5">
                        <div className={showTypeEditor ? "col-span-12 sm:col-span-5 border rounded-md p-4" : "col-span-12 border rounded-md p-4"}>
                          <div className="mb-3 text-base font-medium">Request Types</div>
                          <div className="overflow-x-auto">
                            <Table className="table-report w-full" striped hover>
                              <Table.Thead>
                                <Table.Tr>
                                  <Table.Th>Name</Table.Th>
                                  <Table.Th>Code</Table.Th>
                                  {showTypeEditor ? null : <Table.Th>Category</Table.Th>}
                                  {showTypeEditor ? null : <Table.Th>Flow</Table.Th>}
                                  {showTypeEditor ? null : <Table.Th>Status</Table.Th>}
                                  <Table.Th>Action</Table.Th>
                                </Table.Tr>
                              </Table.Thead>
                              <Table.Tbody>
                                {requestTypes.map((type) => {
                                  const steps =
                                    (type.approval_flow_json as { steps?: Array<unknown> } | null)?.steps?.length || 0;
                                  return (
                                    <Table.Tr key={type.id}>
                                      <Table.Td>{type.name}</Table.Td>
                                      <Table.Td>{type.code_prefix}</Table.Td>
                                      {showTypeEditor ? null : (
                                        <Table.Td>{type.category_key ? categoryLabelMap.get(type.category_key) || type.category_key : "-"}</Table.Td>
                                      )}
                                      {showTypeEditor ? null : <Table.Td>{steps} step(s)</Table.Td>}
                                      {showTypeEditor ? null : (
                                        <Table.Td className={type.is_active ? "text-success" : "text-slate-500"}>
                                          {type.is_active ? "Active" : "Inactive"}
                                        </Table.Td>
                                      )}
                                      <Table.Td>
                                        <Button variant="outline-primary" onClick={() => loadTypeIntoForm(type)}>
                                          Edit
                                        </Button>
                                      </Table.Td>
                                    </Table.Tr>
                                  );
                                })}
                                {requestTypes.length === 0 ? (
                                  <Table.Tr>
                                    <Table.Td colSpan={showTypeEditor ? 3 : 6} className="text-slate-500">
                                      No request types found.
                                    </Table.Td>
                                  </Table.Tr>
                                ) : null}
                              </Table.Tbody>
                            </Table>
                          </div>
                        </div>

                        {showTypeEditor ? (
                          <div className="col-span-12 sm:col-span-7 border rounded-md p-4">
                            <div className="mb-3 text-base font-medium">{typeForm.id ? "Edit Request Type" : "Create Request Type"}</div>
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
                              <div className="col-span-12 md:col-span-6">
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
                                <Button
                                  variant="outline-secondary"
                                  onClick={() => {
                                    setTypeForm(emptyTypeForm);
                                    setApprovalSteps(defaultApprovalSteps);
                                    setShowTypeEditor(false);
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </div>
        </div>
      </div>
    </>
  );
}

export default Main;
