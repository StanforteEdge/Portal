import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/Base/Button";
import Table from "@/components/Base/Table";
import { FormInput, FormLabel, FormSelect } from "@/components/Base/Form";
import { Dialog } from "@/components/Base/Headless";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import {
  createForm,
  createFormAssignment,
  createFormField,
  deleteFormAssignment,
  deleteFormField,
  listFormsForManagement,
  type FormFieldRecord,
  type FormRecord,
  updateForm,
  updateFormField,
} from "@/services/forms";
import { listDocuments, type PortalDocument } from "@/services/documents";
import { listRoleOptions, listUsers, type RoleOption, type UserListItem } from "@/services/users";

const EMPTY_FORM = {
  name: "",
  description: "",
  module: "general",
  storage_type: "json",
  is_active: true,
};

const EMPTY_FIELD = {
  field_key: "",
  field_label: "",
  field_type: "text",
  is_required: false,
  display_order: 0,
  options_csv: "",
  document_id: "",
};

function optionsToCsv(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const options = (value as Record<string, unknown>).options;
  if (!Array.isArray(options)) return "";
  return options.map((item) => String(item)).join(", ");
}

function csvToOptions(csv: string): Record<string, unknown> | undefined {
  const options = csv
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (options.length === 0) return undefined;
  return { options };
}

function AdminFormEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isCreate = !id;

  const [selected, setSelected] = useState<FormRecord | null>(null);
  const [activeTab, setActiveTab] = useState<"fields" | "assignments">("fields");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  const [formState, setFormState] = useState(EMPTY_FORM);
  const [fieldState, setFieldState] = useState(EMPTY_FIELD);
  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);

  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [documents, setDocuments] = useState<PortalDocument[]>([]);
  const [assignmentState, setAssignmentState] = useState({
    target: "role",
    role_slug: "staff",
    profile_id: "",
    due_date: "",
  });

  const load = async () => {
    if (!id) {
      setSelected(null);
      return;
    }
    try {
      setLoading(true);
      const forms = await listFormsForManagement({ include_inactive: true });
      const form = forms.find((row) => row.id === id) || null;
      setSelected(form);
      if (form) {
        setFormState({
          name: form.name,
          description: form.description || "",
          module: form.module || "general",
          storage_type: form.storage_type || "json",
          is_active: form.is_active,
        });
      } else {
        setNotice({ tone: "error", message: "Form not found." });
      }
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load form." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [roleData, userData] = await Promise.all([
          listRoleOptions(),
          listUsers({ per_page: 100, status: "active" }).then((res) => res.data),
        ]);
        setRoles(roleData);
        setUsers(userData);
        const docs = await listDocuments({ category: "policy", status: "published", per_page: 200 });
        setDocuments(docs.data);
      } catch {
        // noop
      }
    };
    void loadMeta();
  }, []);

  const submitForm = async () => {
    try {
      setSaving(true);
      if (isCreate) {
        const created = await createForm(formState);
        setNotice({ tone: "success", message: "Form created." });
        navigate(`/appOld/admin/forms/${created.id}`, { replace: true });
        return;
      }

      if (!selected) return;
      await updateForm(selected.id, formState);
      setNotice({ tone: "success", message: "Form updated." });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save form." });
    } finally {
      setSaving(false);
    }
  };

  const openNewFieldModal = () => {
    setEditingFieldId(null);
    setFieldState(EMPTY_FIELD);
    setFieldModalOpen(true);
  };

  const openEditFieldModal = (field: FormFieldRecord) => {
    setEditingFieldId(field.id);
    setFieldState({
      field_key: field.field_key,
      field_label: field.field_label,
      field_type: field.field_type,
      is_required: field.is_required,
      display_order: field.display_order,
      options_csv: optionsToCsv(field.field_options),
      document_id:
        field.field_options && typeof field.field_options === "object" && !Array.isArray(field.field_options)
          ? String((field.field_options as Record<string, unknown>).document_id || "")
          : "",
    });
    setFieldModalOpen(true);
  };

  const saveField = async () => {
    if (!selected) return;
    try {
      setSaving(true);
      const payload = {
        field_key: fieldState.field_key,
        field_label: fieldState.field_label,
        field_type: fieldState.field_type,
        is_required: fieldState.is_required,
        display_order: Number(fieldState.display_order || 0),
        field_options: ["select", "multiselect", "radio", "checkbox"].includes(fieldState.field_type)
          ? csvToOptions(fieldState.options_csv)
          : fieldState.field_type === "document_acknowledgement" && fieldState.document_id
            ? { document_id: fieldState.document_id }
          : undefined,
      };
      if (editingFieldId) {
        await updateFormField(selected.id, editingFieldId, payload);
        setNotice({ tone: "success", message: "Field updated." });
      } else {
        await createFormField(selected.id, payload);
        setNotice({ tone: "success", message: "Field added." });
      }
      setFieldModalOpen(false);
      setFieldState(EMPTY_FIELD);
      setEditingFieldId(null);
      await load();
    } catch (error: any) {
      setNotice({
        tone: "error",
        message: error?.response?.data?.error?.message || "Unable to save field.",
      });
    } finally {
      setSaving(false);
    }
  };

  const removeField = async (fieldId: string) => {
    if (!selected) return;
    try {
      setSaving(true);
      await deleteFormField(selected.id, fieldId);
      await load();
      setNotice({ tone: "success", message: "Field removed." });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to remove field." });
    } finally {
      setSaving(false);
    }
  };

  const addAssignment = async () => {
    if (!selected) return;
    try {
      setSaving(true);
      await createFormAssignment({
        form_id: selected.id,
        assigned_to_role: assignmentState.target === "role" ? assignmentState.role_slug : undefined,
        assigned_to_profile_id: assignmentState.target === "profile" ? assignmentState.profile_id : undefined,
        due_date: assignmentState.due_date || undefined,
      });
      await load();
      setNotice({ tone: "success", message: "Form assigned." });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to assign form." });
    } finally {
      setSaving(false);
    }
  };

  const removeAssignment = async (assignmentId: string) => {
    if (!selected) return;
    try {
      setSaving(true);
      await deleteFormAssignment(assignmentId);
      await load();
      setNotice({ tone: "success", message: "Assignment removed." });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to remove assignment." });
    } finally {
      setSaving(false);
    }
  };

  const selectedFields = useMemo(
    () => [...(selected?.fields || [])].sort((a, b) => a.display_order - b.display_order),
    [selected?.fields]
  );

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">{isCreate ? "Create Form" : "Edit Form"}</h2>
        <Button variant="outline-secondary" onClick={() => navigate("/appOld/admin/forms")}>
          Back to Forms
        </Button>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="mt-5 intro-y box p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <FormLabel>Name</FormLabel>
            <FormInput value={formState.name} onChange={(e) => setFormState((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <FormLabel>Module</FormLabel>
            <FormInput value={formState.module} onChange={(e) => setFormState((p) => ({ ...p, module: e.target.value }))} />
          </div>
          <div>
            <FormLabel>Storage Type</FormLabel>
            <FormSelect
              value={formState.storage_type}
              onChange={(e) => setFormState((p) => ({ ...p, storage_type: e.target.value }))}
            >
              <option value="json">JSON</option>
              <option value="normalized">Normalized</option>
              <option value="hybrid">Hybrid</option>
            </FormSelect>
          </div>
          <div>
            <FormLabel>Status</FormLabel>
            <FormSelect
              value={formState.is_active ? "true" : "false"}
              onChange={(e) => setFormState((p) => ({ ...p, is_active: e.target.value === "true" }))}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </FormSelect>
          </div>
          <div className="md:col-span-2">
            <FormLabel>Description</FormLabel>
            <FormInput
              value={formState.description}
              onChange={(e) => setFormState((p) => ({ ...p, description: e.target.value }))}
            />
          </div>
        </div>

        <div className="mt-5">
          <Button variant="primary" disabled={saving || loading} onClick={submitForm}>
            {saving ? "Saving..." : isCreate ? "Create" : "Save"}
          </Button>
        </div>
      </div>

      {!isCreate && selected ? (
        <div className="p-5 mt-5 intro-y box">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/60 pb-3">
            <Button
              variant={activeTab === "fields" ? "primary" : "outline-secondary"}
              onClick={() => setActiveTab("fields")}
            >
              Fields
            </Button>
            <Button
              variant={activeTab === "assignments" ? "primary" : "outline-secondary"}
              onClick={() => setActiveTab("assignments")}
            >
              Assignments
            </Button>
          </div>

          {activeTab === "fields" ? (
            <div className="mt-4">
              <div className="flex items-center">
                <h4 className="mr-auto font-medium">Form Fields</h4>
                <Button variant="outline-primary" onClick={openNewFieldModal}>
                  Add Field
                </Button>
              </div>

              <div className="mt-4 overflow-auto">
                <Table className="table-report w-full" striped>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Key</Table.Th>
                      <Table.Th>Label</Table.Th>
                      <Table.Th>Type</Table.Th>
                      <Table.Th>Required</Table.Th>
                      <Table.Th>Order</Table.Th>
                      <Table.Th>Action</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {selectedFields.map((field) => (
                      <Table.Tr key={field.id}>
                        <Table.Td>{field.field_key}</Table.Td>
                        <Table.Td>{field.field_label}</Table.Td>
                        <Table.Td>{field.field_type}</Table.Td>
                        <Table.Td>{field.is_required ? "Yes" : "No"}</Table.Td>
                        <Table.Td>{field.display_order}</Table.Td>
                        <Table.Td className="space-x-2">
                          <Button size="sm" variant="outline-secondary" onClick={() => openEditFieldModal(field)}>
                            Edit
                          </Button>
                          <Button size="sm" variant="outline-danger" onClick={() => void removeField(field.id)}>
                            Remove
                          </Button>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <h4 className="font-medium">Assignments</h4>
              <div className="grid grid-cols-1 gap-3 mt-3 md:grid-cols-2">
                <FormSelect
                  value={assignmentState.target}
                  onChange={(e) => setAssignmentState((p) => ({ ...p, target: e.target.value }))}
                >
                  <option value="role">Role</option>
                  <option value="profile">Profile</option>
                </FormSelect>
                {assignmentState.target === "role" ? (
                  <FormSelect
                    value={assignmentState.role_slug}
                    onChange={(e) => setAssignmentState((p) => ({ ...p, role_slug: e.target.value }))}
                  >
                    {roles.map((role) => (
                      <option key={role.slug} value={role.slug}>
                        {role.name}
                      </option>
                    ))}
                  </FormSelect>
                ) : (
                  <FormSelect
                    value={assignmentState.profile_id}
                    onChange={(e) => setAssignmentState((p) => ({ ...p, profile_id: e.target.value }))}
                  >
                    <option value="">Select profile</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {(user.firstName || user.lastName)
                          ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                          : user.username}{" "}
                        ({user.email})
                      </option>
                    ))}
                  </FormSelect>
                )}
                <FormInput
                  type="date"
                  value={assignmentState.due_date}
                  onChange={(e) => setAssignmentState((p) => ({ ...p, due_date: e.target.value }))}
                />
                <Button variant="outline-primary" disabled={saving} onClick={addAssignment}>
                  Assign
                </Button>
              </div>

              <div className="mt-4 overflow-auto">
                <Table className="table-report w-full" striped>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Target</Table.Th>
                      <Table.Th>Due</Table.Th>
                      <Table.Th>Action</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {(selected.assignments || []).map((assignment) => (
                      <Table.Tr key={assignment.id}>
                        <Table.Td>
                          {assignment.assigned_to_profile_id
                            ? `Profile: ${assignment.assigned_to_profile_id}`
                            : `Role: ${assignment.assigned_to_role || "-"}`}
                        </Table.Td>
                        <Table.Td>{assignment.due_date ? String(assignment.due_date).slice(0, 10) : "-"}</Table.Td>
                        <Table.Td>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => void removeAssignment(assignment.id)}
                          >
                            Remove
                          </Button>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </div>
            </div>
          )}
        </div>
      ) : null}

      <Dialog open={fieldModalOpen} onClose={() => setFieldModalOpen(false)}>
        <Dialog.Panel>
          <Dialog.Title>{editingFieldId ? "Edit Field" : "Add Field"}</Dialog.Title>
          <Dialog.Description className="grid grid-cols-12 gap-4 gap-y-3 mt-3">
            <div className="col-span-12 sm:col-span-6">
              <FormLabel>Field Key</FormLabel>
              <FormInput
                value={fieldState.field_key}
                disabled={Boolean(editingFieldId)}
                onChange={(e) => setFieldState((p) => ({ ...p, field_key: e.target.value }))}
              />
            </div>
            <div className="col-span-12 sm:col-span-6">
              <FormLabel>Field Label</FormLabel>
              <FormInput
                value={fieldState.field_label}
                onChange={(e) => setFieldState((p) => ({ ...p, field_label: e.target.value }))}
              />
            </div>
            <div className="col-span-12 sm:col-span-6">
              <FormLabel>Field Type</FormLabel>
              <FormSelect
                value={fieldState.field_type}
                onChange={(e) => setFieldState((p) => ({ ...p, field_type: e.target.value }))}
              >
                {["text", "textarea", "number", "date", "datetime", "select", "multiselect", "checkbox", "radio", "file", "document_acknowledgement"].map(
                  (type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  )
                )}
              </FormSelect>
            </div>
            <div className="col-span-12 sm:col-span-6">
              <FormLabel>Display Order</FormLabel>
              <FormInput
                type="number"
                min={0}
                value={String(fieldState.display_order)}
                onChange={(e) => setFieldState((p) => ({ ...p, display_order: Number(e.target.value || 0) }))}
              />
            </div>
            <div className="col-span-12 sm:col-span-6">
              <FormLabel>Required</FormLabel>
              <FormSelect
                value={fieldState.is_required ? "true" : "false"}
                onChange={(e) => setFieldState((p) => ({ ...p, is_required: e.target.value === "true" }))}
              >
                <option value="false">Optional</option>
                <option value="true">Required</option>
              </FormSelect>
            </div>
            {["select", "multiselect", "radio", "checkbox"].includes(fieldState.field_type) ? (
              <div className="col-span-12">
                <FormLabel>Options (comma-separated)</FormLabel>
                <FormInput
                  placeholder="Option A, Option B, Option C"
                  value={fieldState.options_csv}
                  onChange={(e) => setFieldState((p) => ({ ...p, options_csv: e.target.value }))}
                />
              </div>
            ) : null}
            {fieldState.field_type === "document_acknowledgement" ? (
              <div className="col-span-12">
                <FormLabel>Bound Document</FormLabel>
                <FormSelect
                  value={fieldState.document_id}
                  onChange={(e) => setFieldState((p) => ({ ...p, document_id: e.target.value }))}
                >
                  <option value="">Select policy document</option>
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.title} (v{doc.version})
                    </option>
                  ))}
                </FormSelect>
              </div>
            ) : null}
          </Dialog.Description>
          <Dialog.Footer className="text-right">
            <Button variant="outline-secondary" className="mr-2" onClick={() => setFieldModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => void saveField()} disabled={saving}>
              {saving ? "Saving..." : editingFieldId ? "Update Field" : "Add Field"}
            </Button>
          </Dialog.Footer>
        </Dialog.Panel>
      </Dialog>
    </>
  );
}

export default AdminFormEditorPage;
