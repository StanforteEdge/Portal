import { useState, useEffect } from "react";
import {
  Button,
  SectionCard,
  TextField,
  SelectField,
  TextAreaField,
  useToast,
} from "@/shared";
import { resourceApi, hrApi } from "@/shared/lib/core";

type Props = {
  project?: {
    id: string;
    name: string;
    description?: string;
    projectCode?: string;
    organizationId?: string;
    ownerId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  } | null;
  onClose: () => void;
  onSaved: () => void;
};

const projectStatusOptions = [
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

export default function AdminProjectSlideOver({ project, onClose, onSaved }: Props) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const [name, setName] = useState(project?.name || "");
  const [description, setDescription] = useState(project?.description || "");
  const [projectCode, setProjectCode] = useState(project?.projectCode || "");
  const [organizationId, setOrganizationId] = useState(project?.organizationId || "");
  const [ownerId, setOwnerId] = useState(project?.ownerId || "");
  const [status, setStatus] = useState(project?.status || "active");
  const [startDate, setStartDate] = useState(project?.startDate || "");
  const [endDate, setEndDate] = useState(project?.endDate || "");

  useEffect(() => {
    async function loadData() {
      setLoadingData(true);
      try {
        const [orgs, employeesResult] = await Promise.all([
          resourceApi.listOrganizations(),
          hrApi.listEmployees({ status: "active" }),
        ]);
        setOrganizations(orgs);
        setUsers(employeesResult.data || []);
      } catch {
        setOrganizations([]);
        setUsers([]);
      } finally {
        setLoadingData(false);
      }
    }
    void loadData();
  }, []);

  async function handleSubmit() {
    if (!name.trim()) {
      showToast({ tone: "warning", title: "Name required", message: "Please enter a project name." });
      return;
    }

    if (!projectCode.trim()) {
      showToast({ tone: "warning", title: "Code required", message: "Please enter a project code." });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        projectCode: projectCode.trim(),
        organizationId: organizationId || undefined,
        ownerId: ownerId || undefined,
        status,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      if (project) {
        await resourceApi.updateProject(project.id, payload);
        showToast({ tone: "success", title: "Project updated", message: `"${name}" has been updated.` });
      } else {
        await resourceApi.createProject(payload);
        showToast({ tone: "success", title: "Project created", message: `"${name}" has been created.` });
      }
      onSaved();
    } catch (err) {
      showToast({
        tone: "danger",
        title: "Save failed",
        message: err instanceof Error ? err.message : "Unable to save project.",
      });
    } finally {
      setSaving(false);
    }
  }

  const getUserDisplayName = (user: any) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ""} ${user.last_name || ""}`.trim();
    }
    return user.email || user.username || user.id;
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-end">
      <div className="absolute inset-0 top-16 bg-slate-950/40" onClick={onClose} />
      <div className="relative w-full max-w-lg flex flex-col bg-white shadow-xl max-h-[calc(100vh-4rem)]">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {project ? "Edit Project" : "New Project"}
            </p>
            <h2 className="text-xl font-semibold text-slate-950">
              {project ? "Edit Project" : "Add Project"}
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <SectionCard title="Basic Info">
            <div className="grid gap-4">
              <TextField
                label="Project Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Website Redesign"
                required
              />
              <TextField
                label="Project Code"
                value={projectCode}
                onChange={(e) => setProjectCode(e.target.value)}
                placeholder="e.g., PROJ-001"
                required
              />
              <TextAreaField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this project"
                rows={3}
              />
              <SelectField
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {projectStatusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </SelectField>
            </div>
          </SectionCard>

          <SectionCard title="Organization & Dates">
            <div className="grid gap-4">
              <SelectField
                label="Organization"
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
              >
                <option value="">Select organization</option>
                {organizations.map((org: any) => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </SelectField>

              <SelectField
                label="Project Owner"
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
              >
                <option value="">Select owner</option>
                {users.map((user: any) => (
                  <option key={user.id} value={user.id}>
                    {getUserDisplayName(user)}
                  </option>
                ))}
              </SelectField>

              <div className="grid grid-cols-2 gap-4">
                <TextField
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <TextField
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="border-t border-slate-200 px-6 py-4">
          <div className="flex gap-3">
            <Button onClick={() => void handleSubmit()} disabled={saving}>
              {saving ? "Saving..." : project ? "Update Project" : "Create Project"}
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
