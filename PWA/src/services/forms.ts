import apiClient from "@/utils/httpClient";

export type FormRecord = {
  id: string;
  name: string;
  description?: string | null;
  module: string;
  storage_type?: string | null;
  is_active: boolean;
  fields?: FormFieldRecord[];
  assignments?: FormAssignmentRecord[];
};

export type FormFieldRecord = {
  id: string;
  form_id: string;
  field_key: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  display_order: number;
  field_options?: Record<string, unknown> | null;
  validation_rules?: Record<string, unknown> | null;
};

export type FormAssignmentRecord = {
  id: string;
  form_id: string;
  assigned_to_role?: string | null;
  assigned_to_profile_id?: string | null;
  due_date?: string | null;
  created_at?: string;
};

function mapField(row: any): FormFieldRecord {
  return {
    id: String(row.id),
    form_id: String(row.formId ?? row.form_id ?? ""),
    field_key: String(row.fieldKey ?? row.field_key ?? ""),
    field_label: String(row.fieldLabel ?? row.field_label ?? ""),
    field_type: String(row.fieldType ?? row.field_type ?? "text"),
    is_required: Boolean(row.isRequired ?? row.is_required ?? false),
    display_order: Number(row.displayOrder ?? row.display_order ?? 0),
    field_options: row.fieldOptions ?? row.field_options ?? null,
    validation_rules: row.validationRules ?? row.validation_rules ?? null,
  };
}

function mapAssignment(row: any): FormAssignmentRecord {
  return {
    id: String(row.id),
    form_id: String(row.formId ?? row.form_id ?? ""),
    assigned_to_role: row.assignedToRole ?? row.assigned_to_role ?? null,
    assigned_to_profile_id:
      row.assignedToProfileId != null
        ? String(row.assignedToProfileId)
        : row.assigned_to_profile_id != null
        ? String(row.assigned_to_profile_id)
        : null,
    due_date: row.dueDate ?? row.due_date ?? null,
    created_at: row.createdAt ?? row.created_at,
  };
}

function mapForm(row: any): FormRecord {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    description: row.description ?? null,
    module: String(row.module ?? "general"),
    storage_type: row.storageType ?? row.storage_type ?? null,
    is_active: Boolean(row.isActive ?? row.is_active ?? true),
    fields: Array.isArray(row.fields) ? row.fields.map(mapField) : undefined,
    assignments: Array.isArray(row.assignments)
      ? row.assignments.map(mapAssignment)
      : undefined,
  };
}

export async function listForms(params?: { module?: string }) {
  const response = await apiClient.get("/forms", { params });
  const data = response.data.data as any[];
  return Array.isArray(data) ? data.map(mapForm) : [];
}

export async function getFormById(id: string) {
  const response = await apiClient.get(`/forms/${id}`);
  return mapForm(response.data.data);
}

export async function listFormsForManagement(params?: {
  search?: string;
  module?: string;
  include_inactive?: boolean;
}) {
  const response = await apiClient.get("/forms/manage/list", {
    params: {
      ...(params?.search ? { search: params.search } : {}),
      ...(params?.module ? { module: params.module } : {}),
      ...(params?.include_inactive ? { include_inactive: "true" } : {}),
    },
  });
  const data = response.data.data as any[];
  return Array.isArray(data) ? data.map(mapForm) : [];
}

export async function createForm(payload: {
  name: string;
  description?: string;
  module?: string;
  storage_type?: string;
  is_active?: boolean;
}) {
  const response = await apiClient.post("/forms/manage", payload);
  return mapForm(response.data.data);
}

export async function updateForm(id: string, payload: Partial<{
  name: string;
  description: string;
  module: string;
  storage_type: string;
  is_active: boolean;
}>) {
  const response = await apiClient.patch(`/forms/manage/${id}`, payload);
  return mapForm(response.data.data);
}

export async function createFormField(
  formId: string,
  payload: {
    field_key: string;
    field_label: string;
    field_type: string;
    is_required?: boolean;
    display_order?: number;
    field_options?: Record<string, unknown>;
    validation_rules?: Record<string, unknown>;
  }
) {
  const response = await apiClient.post(`/forms/manage/${formId}/fields`, payload);
  return mapField(response.data.data);
}

export async function updateFormField(
  formId: string,
  fieldId: string,
  payload: Partial<{
    field_label: string;
    field_type: string;
    is_required: boolean;
    display_order: number;
    field_options: Record<string, unknown>;
    validation_rules: Record<string, unknown>;
  }>
) {
  const response = await apiClient.patch(`/forms/manage/${formId}/fields/${fieldId}`, payload);
  return mapField(response.data.data);
}

export async function deleteFormField(formId: string, fieldId: string) {
  const response = await apiClient.delete(`/forms/manage/${formId}/fields/${fieldId}`);
  return response.data.data as { success: boolean };
}

export async function listFormAssignments(params?: { form_id?: string }) {
  const response = await apiClient.get("/forms/manage/assignments/list", { params });
  const data = response.data.data as any[];
  return Array.isArray(data) ? data.map(mapAssignment) : [];
}

export async function createFormAssignment(payload: {
  form_id: string;
  assigned_to_role?: string;
  assigned_to_profile_id?: string;
  due_date?: string;
}) {
  const response = await apiClient.post("/forms/manage/assignments", payload);
  return mapAssignment(response.data.data);
}

export async function deleteFormAssignment(id: string) {
  const response = await apiClient.delete(`/forms/manage/assignments/${id}`);
  return response.data.data as { success: boolean };
}
