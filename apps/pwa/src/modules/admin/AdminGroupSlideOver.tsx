import { useState, useEffect } from "react";
import {
  Button,
  SectionCard,
  TextField,
  SelectField,
  TextAreaField,
  useToast,
  Icon,
} from "@/shared";
import { resourceApi } from "@/shared/lib/core";
import type { TeamOption, OrganizationItem } from "@stanforte/shared";

type Props = {
  group?: TeamOption | null;
  types?: { id: string; name: string; slug: string; description: string }[];
  onClose: () => void;
  onSaved: () => void;
};

export default function AdminGroupSlideOver({ group, types = [], onClose, onSaved }: Props) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);

  const [name, setName] = useState(group?.name || "");
  const [groupType, setGroupType] = useState(group?.groupType || "team");
  const [description, setDescription] = useState(group?.description || "");
  const [isActive, setIsActive] = useState(group?.isActive ?? true);
  const [primaryOrgId, setPrimaryOrgId] = useState(
    group?.organizationId || group?.organizationIds?.[0] || ""
  );
  const [orgIds, setOrgIds] = useState<string[]>(group?.organizationIds || []);

  useEffect(() => {
    async function loadOrgs() {
      setLoadingOrgs(true);
      try {
        const orgs = await resourceApi.listOrganizations();
        setOrganizations(orgs);
      } catch {
        setOrganizations([]);
      } finally {
        setLoadingOrgs(false);
      }
    }
    void loadOrgs();
  }, []);

  const toggleOrg = (orgId: string, checked: boolean) => {
    setOrgIds((prev) => {
      const next = checked ? [...prev, orgId] : prev.filter((id) => id !== orgId);
      if (!next.includes(primaryOrgId)) {
        setPrimaryOrgId(next[0] || "");
      }
      return next;
    });
  };

  async function handleSubmit() {
    if (!name.trim()) {
      showToast({ tone: "warning", title: "Name required", message: "Please enter a group name." });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        group_type: groupType,
        is_active: isActive,
        primary_organization_id: primaryOrgId || undefined,
        organization_ids: orgIds,
        organization_id: primaryOrgId || undefined,
      };

      if (group) {
        await resourceApi.updateGroup(group.id, payload);
        showToast({ tone: "success", title: "Group updated", message: `"${name}" has been updated.` });
      } else {
        await resourceApi.createGroup(payload);
        showToast({ tone: "success", title: "Group created", message: `"${name}" has been created.` });
      }
      onSaved();
    } catch (err) {
      showToast({
        tone: "danger",
        title: "Save failed",
        message: err instanceof Error ? err.message : "Unable to save group.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-end">
      <div className="absolute inset-0 top-16 bg-slate-950/40" onClick={onClose} />
      <div className="relative w-full max-w-lg flex flex-col bg-white shadow-xl max-h-[calc(100vh-4rem)]">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {group ? "Edit Group" : "New Group"}
            </p>
            <h2 className="text-xl font-semibold text-slate-950">
              {group ? "Edit Group" : "Add Group"}
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
                label="Group Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Engineering Team"
                required
              />
              <SelectField
                label="Type"
                value={groupType}
                onChange={(e) => setGroupType(e.target.value)}
              >
                {types.map((t) => (
                  <option key={t.id} value={t.slug}>{t.name}</option>
                ))}
              </SelectField>
              <TextAreaField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this group"
                rows={3}
              />
              {group && (
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <label htmlFor="is_active" className="text-sm text-slate-700">
                    Active
                  </label>
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Organizations">
            {loadingOrgs ? (
              <div className="text-sm text-slate-500">Loading organizations...</div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-500">
                  Select which organizations this group serves.
                </p>
                <div className="grid gap-x-6 gap-y-2">
                  {organizations.map((org) => (
                    <label key={org.id} className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={orgIds.includes(org.id)}
                        onChange={(e) => toggleOrg(org.id, e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300"
                      />
                      <span>
                        <span className="text-sm text-slate-700 block">{org.name}</span>
                        <span className="text-xs text-slate-400">{org.code}</span>
                      </span>
                    </label>
                  ))}
                </div>
                {orgIds.length > 0 && (
                  <SelectField
                    label="Primary Organization"
                    value={primaryOrgId}
                    onChange={(e) => setPrimaryOrgId(e.target.value)}
                  >
                    <option value="">None</option>
                    {organizations
                      .filter((org) => orgIds.includes(org.id))
                      .map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                  </SelectField>
                )}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="border-t border-slate-200 px-6 py-4">
          <div className="flex gap-3">
            <Button onClick={() => void handleSubmit()} disabled={saving}>
              {saving ? "Saving..." : group ? "Update Group" : "Create Group"}
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
