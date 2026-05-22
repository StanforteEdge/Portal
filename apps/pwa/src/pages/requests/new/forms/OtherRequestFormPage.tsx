import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { SectionCard, SelectField } from "@/shared";
import { humanize } from "@stanforte/shared";
import type { RequestTypeOption, RequestCategoryOption, RequestRecord, ProjectOption } from "@/pages/requests/requests-api";
import type { FamilyFormHandle } from "./family-form-types";

type OtherFormState = {
  organization_id: string;
  team_id: string;
  project_id: string;
  category_id: string;
};

type Props = {
  selectedType: RequestTypeOption;
  selectedCategory: RequestCategoryOption | null;
  organizationOptions: Array<{ id: string; name: string; code: string }>;
  groupOptions: Array<{ id: string; name: string; type: string; role: string }>;
  projectOptions: ProjectOption[];
  categoryOptions: Array<{ value: string; label: string }>;
  editRequest?: RequestRecord | null;
  loadingEdit: boolean;
  onSummary: (node: React.ReactNode) => void;
};

export const OtherRequestFormPage = forwardRef<FamilyFormHandle, Props>(({
  selectedType,
  selectedCategory,
  organizationOptions,
  groupOptions,
  projectOptions,
  categoryOptions,
  editRequest,
  loadingEdit,
  onSummary,
}, ref) => {
  const [form, setForm] = useState<OtherFormState>({
    organization_id: "",
    team_id: "",
    project_id: "",
    category_id: "",
  });

  useEffect(() => {
    if (organizationOptions.length === 1) {
      setForm((prev) => ({ ...prev, organization_id: prev.organization_id || organizationOptions[0].id }));
    }
  }, [organizationOptions]);

  useEffect(() => {
    if (groupOptions.length === 1) {
      setForm((prev) => ({ ...prev, team_id: prev.team_id || groupOptions[0].id }));
    }
  }, [groupOptions]);

  useEffect(() => {
    if (categoryOptions.length === 1 && !form.category_id) {
      setForm((prev) => ({ ...prev, category_id: categoryOptions[0].value }));
    }
    if (form.category_id && categoryOptions.length > 0 && !categoryOptions.some((o) => o.value === form.category_id)) {
      setForm((prev) => ({ ...prev, category_id: "" }));
    }
  }, [categoryOptions, form.category_id]);

  useEffect(() => {
    onSummary(
      <section className="section-card bg-brand-900 p-5 text-white">
        <p className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-white/70">
          {selectedCategory?.name || "Request Summary"}
        </p>
        <p className="mt-3 text-4xl font-semibold tracking-tight">&mdash;</p>
        <p className="mt-2 text-sm leading-6 text-white/70">
          {selectedCategory?.description || "Complete the shared request details."}
        </p>
      </section>,
    );
  }, [selectedCategory, onSummary]);

  useImperativeHandle(ref, () => ({
    validateAndBuild: () => ({
      payload: {
        team_id: form.team_id || undefined,
        data: {
          organization_id: form.organization_id || undefined,
          project_id: form.project_id || undefined,
          category_id: form.category_id || undefined,
        },
        items: [],
      },
    }),
  }));

  return (
    <SectionCard
      title="Work Context"
      description="Assign the request to the right workstream and organization."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <SelectField
          label="Project"
          value={form.project_id}
          onChange={(event) => setForm((prev) => ({ ...prev, project_id: event.target.value }))}
          disabled={projectOptions.length <= 1}
        >
          <option value="">Select project</option>
          {projectOptions.map((project) => (
            <option key={project.id} value={project.id}>{project.name}</option>
          ))}
        </SelectField>
        <SelectField
          label="Group"
          value={form.team_id}
          onChange={(event) => setForm((prev) => ({ ...prev, team_id: event.target.value }))}
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
          onChange={(event) => setForm((prev) => ({ ...prev, organization_id: event.target.value }))}
          disabled={organizationOptions.length <= 1}
        >
          <option value="">Select organization</option>
          {organizationOptions.map((org) => (
            <option key={org.id} value={org.id}>{org.name}</option>
          ))}
        </SelectField>
      </div>

      <div className="mt-4">
        <SelectField
          label="Category"
          value={form.category_id}
          onChange={(event) => setForm((prev) => ({ ...prev, category_id: event.target.value }))}
        >
          <option value="">Select category</option>
          {categoryOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </SelectField>
      </div>
    </SectionCard>
  );
});

OtherRequestFormPage.displayName = "OtherRequestFormPage";
