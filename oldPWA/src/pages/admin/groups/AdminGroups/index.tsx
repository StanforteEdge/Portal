import { useEffect, useMemo, useState } from "react";
import Button from "@/components/Base/Button";
import { FormCheck, FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/Base/Form";
import Table from "@/components/Base/Table";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import {
  addGroupMember,
  createTeam,
  getGroupDetail,
  listTeams,
  removeGroupMember,
  setGroupMemberScopes,
  setGroupOrganizations,
  updateTeam,
  type TeamOption,
} from "@/services/teams";
import { listOrganizations, type OrganizationRecord } from "@/services/organizations";
import { listUsers, type UserListItem } from "@/services/users";

function formatUserName(user: {
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  email?: string | null;
}) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  if (fullName) return fullName;
  if (user.username) return user.username;
  return user.email || "Unknown user";
}

function normalizeOrganizations(group: TeamOption | null, organizations: OrganizationRecord[]) {
  const mapped = group?.organizationMappings ?? [];
  if (mapped.length > 0) return mapped;
  if (group?.organizationId) {
    const fallback = organizations.find((org) => org.id === group.organizationId);
    if (fallback) {
      return [
        {
          id: `legacy-${fallback.id}`,
          organizationId: fallback.id,
          isPrimary: true,
          organization: { id: fallback.id, name: fallback.name, code: fallback.code },
        },
      ];
    }
  }
  return [];
}

function AdminGroupsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [groups, setGroups] = useState<TeamOption[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
  const [userOptions, setUserOptions] = useState<UserListItem[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [groupTypeFilter, setGroupTypeFilter] = useState<string>("all");
  const [organizationFilter, setOrganizationFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [showEditor, setShowEditor] = useState(false);
  const [editingMemberUserId, setEditingMemberUserId] = useState<string>("");
  const [groupForm, setGroupForm] = useState<{
    id?: string;
    name: string;
    group_type: string;
    description: string;
    is_active: boolean;
    primary_organization_id: string;
    organization_ids: string[];
  }>({
    name: "",
    group_type: "team",
    description: "",
    is_active: true,
    primary_organization_id: "",
    organization_ids: [],
  });
  const [memberForm, setMemberForm] = useState<{
    user_id: string;
    role: "member" | "lead" | "manager";
    organization_ids: string[];
  }>({
    user_id: "",
    role: "member",
    organization_ids: [],
  });
  const [memberScopeSelections, setMemberScopeSelections] = useState<Record<string, string[]>>({});

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId) ?? null,
    [groups, selectedGroupId]
  );
  const selectedGroupOrganizations = useMemo(
    () => normalizeOrganizations(selectedGroup, organizations),
    [selectedGroup, organizations]
  );

  const loadAll = async (preferredGroupId?: string) => {
    setLoading(true);
    try {
      const [groupRows, organizationRows, usersResponse] = await Promise.all([
        listTeams({
          active_only: statusFilter === "active",
          ...(search ? { search } : {}),
          ...(organizationFilter !== "all" ? { organization_id: organizationFilter } : {}),
          ...(groupTypeFilter !== "all" ? { group_type: groupTypeFilter } : {}),
        }),
        listOrganizations(),
        listUsers({ per_page: 200 }),
      ]);
      const nextSelectedId = preferredGroupId ?? selectedGroupId;
      setOrganizations(organizationRows);
      setUserOptions(usersResponse.data);
      setGroups(groupRows);
      if (nextSelectedId && groupRows.some((row) => row.id === nextSelectedId)) {
        setSelectedGroupId(nextSelectedId);
      } else {
        setSelectedGroupId(groupRows[0]?.id ?? "");
      }
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load groups." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, [groupTypeFilter, organizationFilter, statusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAll();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!selectedGroupId) return;
    void (async () => {
      try {
        const detail = await getGroupDetail(selectedGroupId);
        setGroups((prev) => prev.map((group) => (group.id === detail.id ? detail : group)));
      } catch {
        // keep list data; page remains usable even if detail refresh fails
      }
    })();
  }, [selectedGroupId]);

  useEffect(() => {
    if (!selectedGroup) return;
    setMemberScopeSelections(
      Object.fromEntries((selectedGroup.members ?? []).map((member) => [member.userId, member.scopeOrganizationIds ?? []]))
    );
  }, [selectedGroup]);

  useEffect(() => {
    if (!selectedGroup || showEditor) return;
    setGroupForm({
      id: selectedGroup.id,
      name: selectedGroup.name,
      group_type: selectedGroup.groupType || "team",
      description: selectedGroup.description || "",
      is_active: selectedGroup.isActive ?? true,
      primary_organization_id: selectedGroup.organizationId || selectedGroup.organizationIds?.[0] || "",
      organization_ids: selectedGroup.organizationIds ?? (selectedGroup.organizationId ? [selectedGroup.organizationId] : []),
    });
  }, [selectedGroup, showEditor]);

  const openCreate = () => {
    setGroupForm({
      name: "",
      group_type: "team",
      description: "",
      is_active: true,
      primary_organization_id: "",
      organization_ids: [],
    });
    setShowEditor(true);
  };

  const openEdit = () => {
    if (!selectedGroup) return;
    setGroupForm({
      id: selectedGroup.id,
      name: selectedGroup.name,
      group_type: selectedGroup.groupType || "team",
      description: selectedGroup.description || "",
      is_active: selectedGroup.isActive ?? true,
      primary_organization_id: selectedGroup.organizationId || selectedGroup.organizationIds?.[0] || "",
      organization_ids: selectedGroup.organizationIds ?? (selectedGroup.organizationId ? [selectedGroup.organizationId] : []),
    });
    setShowEditor(true);
  };

  const toggleOrganization = (organizationId: string, checked: boolean) => {
    setGroupForm((prev) => {
      const current = new Set(prev.organization_ids);
      if (checked) current.add(organizationId);
      else current.delete(organizationId);
      const nextOrganizationIds = Array.from(current);
      const nextPrimary = nextOrganizationIds.includes(prev.primary_organization_id)
        ? prev.primary_organization_id
        : nextOrganizationIds[0] || "";
      return { ...prev, organization_ids: nextOrganizationIds, primary_organization_id: nextPrimary };
    });
  };

  const saveGroup = async () => {
    if (!groupForm.name.trim()) {
      setNotice({ tone: "warning", message: "Group name is required." });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: groupForm.name.trim(),
        description: groupForm.description.trim() || undefined,
        group_type: groupForm.group_type,
        is_active: groupForm.is_active,
        primary_organization_id: groupForm.primary_organization_id || undefined,
        organization_ids: groupForm.organization_ids,
        organization_id: groupForm.primary_organization_id || undefined,
      };
      const result = groupForm.id ? await updateTeam(groupForm.id, payload) : await createTeam(payload);
      const nextId = String((result as any)?.id ?? groupForm.id ?? "");
      setShowEditor(false);
      setNotice({ tone: "success", message: groupForm.id ? "Group updated." : "Group created." });
      await loadAll(nextId || undefined);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save group." });
    } finally {
      setSaving(false);
    }
  };

  const saveOrganizationMappings = async () => {
    if (!selectedGroup) return;
    try {
      setSaving(true);
      await setGroupOrganizations(selectedGroup.id, {
        organization_ids: groupForm.organization_ids,
        primary_organization_id: groupForm.primary_organization_id || undefined,
      });
      setNotice({ tone: "success", message: "Group organizations updated." });
      await loadAll(selectedGroup.id);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to update group organizations." });
    } finally {
      setSaving(false);
    }
  };

  const saveMember = async () => {
    if (!selectedGroup) return;
    if (!memberForm.user_id) {
      setNotice({ tone: "warning", message: "Choose a user first." });
      return;
    }

    try {
      setSaving(true);
      await addGroupMember(selectedGroup.id, memberForm);
      setMemberForm({ user_id: "", role: "member", organization_ids: [] });
      setNotice({ tone: "success", message: "Member saved." });
      await loadAll(selectedGroup.id);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save group member." });
    } finally {
      setSaving(false);
    }
  };

  const deleteMember = async (userId: string) => {
    if (!selectedGroup) return;
    try {
      setSaving(true);
      await removeGroupMember(selectedGroup.id, userId);
      setNotice({ tone: "success", message: "Member removed." });
      await loadAll(selectedGroup.id);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to remove member." });
    } finally {
      setSaving(false);
    }
  };

  const toggleMemberScope = (userId: string, organizationId: string, checked: boolean) => {
    setMemberScopeSelections((prev) => {
      const current = new Set(prev[userId] ?? []);
      if (checked) current.add(organizationId);
      else current.delete(organizationId);
      return { ...prev, [userId]: Array.from(current) };
    });
  };

  const saveMemberScopes = async (userId: string) => {
    if (!selectedGroup) return;
    try {
      setSaving(true);
      await setGroupMemberScopes(selectedGroup.id, userId, {
        organization_ids: memberScopeSelections[userId] ?? [],
      });
      setNotice({ tone: "success", message: "Responsibility scope updated." });
      await loadAll(selectedGroup.id);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to update member scope." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6 mt-8">
      <div className="col-span-12">
        <div className="intro-y flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Groups</h2>
            <div className="text-slate-500 mt-1">Manage typed groups, shared organization coverage, and member responsibilities.</div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline-secondary" onClick={() => void loadAll(selectedGroupId || undefined)} disabled={loading || saving}>
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
            <Button variant="primary" onClick={openCreate} disabled={saving}>
              Create Group
            </Button>
          </div>
        </div>
      </div>

      <div className="col-span-12">
        {notice ? <AppNotice tone={notice.tone} message={notice.message} /> : null}
      </div>

      <div className="col-span-12 xl:col-span-5 space-y-4">
        <div className="box p-5">
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-12">
              <FormLabel>Search</FormLabel>
              <FormInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search groups" />
            </div>
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Type</FormLabel>
              <FormSelect value={groupTypeFilter} onChange={(event) => setGroupTypeFilter(event.target.value)}>
                <option value="all">All</option>
                <option value="team">Team</option>
                <option value="department">Department</option>
              </FormSelect>
            </div>
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Organization</FormLabel>
              <FormSelect value={organizationFilter} onChange={(event) => setOrganizationFilter(event.target.value)}>
                <option value="all">All</option>
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </FormSelect>
            </div>
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Status</FormLabel>
              <FormSelect value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="active">Active</option>
                <option value="all">All</option>
              </FormSelect>
            </div>
          </div>
        </div>

        <div className="box p-5">
          <div className="overflow-x-auto">
            <Table className="table-report w-full" striped hover>
              <caption className="sr-only">
                Groups list with type, organization coverage, and member count.
              </caption>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Organizations</Table.Th>
                  <Table.Th>Members</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {groups.map((group) => (
                  <Table.Tr
                    key={group.id}
                    className={selectedGroupId === group.id ? "bg-primary/5" : undefined}
                  >
                    <Table.Td>
                      <button
                        type="button"
                        className="w-full text-left rounded outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2"
                        onClick={() => setSelectedGroupId(group.id)}
                        aria-pressed={selectedGroupId === group.id}
                        aria-label={`Select ${group.name}`}
                      >
                        <div className="font-medium">{group.name}</div>
                        <div className="text-xs text-slate-500">{group.isActive ? "Active" : "Inactive"}</div>
                      </button>
                    </Table.Td>
                    <Table.Td className="capitalize">{group.groupType || "team"}</Table.Td>
                    <Table.Td>{group.organizationMappings?.length ?? group.organizationIds?.length ?? (group.organizationId ? 1 : 0)}</Table.Td>
                    <Table.Td>{group.members?.length ?? 0}</Table.Td>
                  </Table.Tr>
                ))}
                {!loading && groups.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={4} className="text-slate-500">
                      No groups found.
                    </Table.Td>
                  </Table.Tr>
                ) : null}
              </Table.Tbody>
            </Table>
          </div>
        </div>
      </div>

      <div className="col-span-12 xl:col-span-7 space-y-4">
        {showEditor ? (
          <div className="box p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">{groupForm.id ? "Edit Group" : "Create Group"}</h3>
              <Button variant="outline-secondary" onClick={() => setShowEditor(false)} disabled={saving}>
                Close
              </Button>
            </div>
            <div className="grid grid-cols-12 gap-4 mt-4">
              <div className="col-span-12 md:col-span-6">
                <FormLabel>Name</FormLabel>
                <FormInput value={groupForm.name} onChange={(event) => setGroupForm((prev) => ({ ...prev, name: event.target.value }))} />
              </div>
              <div className="col-span-12 md:col-span-3">
                <FormLabel>Type</FormLabel>
                <FormSelect
                  value={groupForm.group_type}
                  onChange={(event) => setGroupForm((prev) => ({ ...prev, group_type: event.target.value }))}
                >
                  <option value="team">Team</option>
                  <option value="department">Department</option>
                </FormSelect>
              </div>
              <div className="col-span-12 md:col-span-3">
                <FormLabel>Status</FormLabel>
                <FormSelect
                  value={groupForm.is_active ? "true" : "false"}
                  onChange={(event) => setGroupForm((prev) => ({ ...prev, is_active: event.target.value === "true" }))}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </FormSelect>
              </div>
              <div className="col-span-12">
                <FormLabel>Description</FormLabel>
                <FormTextarea
                  rows={3}
                  value={groupForm.description}
                  onChange={(event) => setGroupForm((prev) => ({ ...prev, description: event.target.value }))}
                />
              </div>
              <div className="col-span-12 md:col-span-6">
                <FormLabel>Primary Organization</FormLabel>
                <FormSelect
                  value={groupForm.primary_organization_id}
                  onChange={(event) => setGroupForm((prev) => ({ ...prev, primary_organization_id: event.target.value }))}
                >
                  <option value="">None</option>
                  {organizations
                    .filter((organization) => groupForm.organization_ids.includes(organization.id))
                    .map((organization) => (
                      <option key={organization.id} value={organization.id}>
                        {organization.name}
                      </option>
                    ))}
                </FormSelect>
              </div>
              <div className="col-span-12">
                <FormLabel>Organizations Served</FormLabel>
                <div className="grid grid-cols-12 gap-2 rounded-md border p-3">
                  {organizations.map((organization) => (
                    <label key={organization.id} className="col-span-12 md:col-span-6 flex items-center gap-2 text-sm text-slate-700">
                      <FormCheck.Input
                        type="checkbox"
                        checked={groupForm.organization_ids.includes(organization.id)}
                        onChange={(event) => toggleOrganization(organization.id, event.target.checked)}
                      />
                      <span>{organization.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="col-span-12 flex gap-2">
                <Button onClick={saveGroup} disabled={saving}>
                  {saving ? "Saving..." : groupForm.id ? "Update Group" : "Create Group"}
                </Button>
                <Button variant="outline-secondary" onClick={() => setShowEditor(false)} disabled={saving}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        ) : selectedGroup ? (
          <>
            <div className="box p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{selectedGroup.name}</h3>
                  <div className="mt-1 text-slate-500 capitalize">
                    {selectedGroup.groupType || "team"} · {selectedGroup.isActive ? "Active" : "Inactive"}
                  </div>
                  {selectedGroup.description ? <div className="mt-3 text-slate-600">{selectedGroup.description}</div> : null}
                </div>
                <Button variant="outline-primary" onClick={openEdit} disabled={saving}>
                  Edit Group
                </Button>
              </div>
            </div>

            <div className="box p-5">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-medium">Organizations</h4>
                <Button
                  variant="outline-primary"
                  onClick={() => void saveOrganizationMappings()}
                  disabled={saving}
                >
                  Save Current Mapping
                </Button>
              </div>
              <div className="mt-3 grid grid-cols-12 gap-3">
                <div className="col-span-12 md:col-span-6">
                  <FormLabel>Primary Organization</FormLabel>
                  <FormSelect
                    value={groupForm.primary_organization_id}
                    onChange={(event) => setGroupForm((prev) => ({ ...prev, primary_organization_id: event.target.value }))}
                  >
                    <option value="">None</option>
                    {organizations
                      .filter((organization) => groupForm.organization_ids.includes(organization.id))
                      .map((organization) => (
                        <option key={organization.id} value={organization.id}>
                          {organization.name}
                        </option>
                      ))}
                  </FormSelect>
                </div>
                <div className="col-span-12">
                  <div className="grid grid-cols-12 gap-2 rounded-md border p-3">
                    {organizations.map((organization) => (
                      <label key={organization.id} className="col-span-12 md:col-span-6 flex items-center gap-2 text-sm text-slate-700">
                        <FormCheck.Input
                          type="checkbox"
                          checked={groupForm.organization_ids.includes(organization.id)}
                          onChange={(event) => toggleOrganization(organization.id, event.target.checked)}
                        />
                        <span>{organization.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 overflow-x-auto">
                <Table className="table-report w-full">
                  <caption className="sr-only">
                    Organizations linked to the selected group, including whether each one is primary.
                  </caption>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Organization</Table.Th>
                      <Table.Th>Code</Table.Th>
                      <Table.Th>Primary</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {selectedGroupOrganizations.map((mapping) => (
                      <Table.Tr key={mapping.organizationId}>
                        <Table.Td>{mapping.organization.name}</Table.Td>
                        <Table.Td>{mapping.organization.code}</Table.Td>
                        <Table.Td>{mapping.isPrimary ? "Yes" : "No"}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </div>
            </div>

            <div className="box p-5">
              <h4 className="text-base font-medium">Members</h4>
              <div className="mt-4 grid grid-cols-12 gap-3">
                <div className="col-span-12 md:col-span-5">
                  <FormLabel>User</FormLabel>
                  <FormSelect
                    value={memberForm.user_id}
                    onChange={(event) => setMemberForm((prev) => ({ ...prev, user_id: event.target.value }))}
                  >
                    <option value="">Select user</option>
                    {userOptions.map((user) => (
                      <option key={user.id} value={user.id}>
                        {`${formatUserName(user)} (${user.email})`}
                      </option>
                    ))}
                  </FormSelect>
                </div>
                <div className="col-span-12 md:col-span-3">
                  <FormLabel>Role</FormLabel>
                  <FormSelect
                    value={memberForm.role}
                    onChange={(event) =>
                      setMemberForm((prev) => ({ ...prev, role: event.target.value as "member" | "lead" | "manager" }))
                    }
                  >
                    <option value="member">Member</option>
                    <option value="lead">Lead</option>
                    <option value="manager">Manager</option>
                  </FormSelect>
                </div>
                <div className="col-span-12 md:col-span-4 flex items-end">
                  <Button onClick={saveMember} disabled={saving}>
                    {saving ? "Saving..." : "Add Member"}
                  </Button>
                </div>
                {selectedGroupOrganizations.length > 1 ? (
                  <div className="col-span-12">
                    <FormLabel>Initial Organization Scope</FormLabel>
                    <div className="grid grid-cols-12 gap-2 rounded-md border p-3">
                      {selectedGroupOrganizations.map((mapping) => (
                        <label key={mapping.organizationId} className="col-span-12 md:col-span-6 flex items-center gap-2 text-sm text-slate-700">
                          <FormCheck.Input
                            type="checkbox"
                            checked={memberForm.organization_ids.includes(mapping.organizationId)}
                            onChange={(event) =>
                              setMemberForm((prev) => ({
                                ...prev,
                                organization_ids: event.target.checked
                                  ? Array.from(new Set([...prev.organization_ids, mapping.organizationId]))
                                  : prev.organization_ids.filter((entry) => entry !== mapping.organizationId),
                              }))
                            }
                          />
                          <span>{mapping.organization.name}</span>
                        </label>
                      ))}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">Leave empty to let the member cover the whole group.</div>
                  </div>
                ) : null}
              </div>

              <div className="mt-5 overflow-x-auto">
                <Table className="table-report w-full">
                  <caption className="sr-only">
                    Members assigned to the selected group, including role and organization coverage.
                  </caption>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Member</Table.Th>
                      <Table.Th>Role</Table.Th>
                      <Table.Th>Organization Coverage</Table.Th>
                      <Table.Th>Action</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {(selectedGroup.members ?? []).map((member) => {
                      const scopedOrganizations = member.organizationScopes ?? [];
                      const scopeLabel =
                        scopedOrganizations.length === 0
                          ? "All linked organizations"
                          : scopedOrganizations.map((scope) => scope.organization.name).join(", ");
                      return (
                        <Table.Tr key={member.userId}>
                          <Table.Td>
                            <div className="font-medium">{formatUserName(member.user)}</div>
                            <div className="text-xs text-slate-500">{member.user.email}</div>
                          </Table.Td>
                          <Table.Td className="capitalize">{member.role}</Table.Td>
                          <Table.Td>{scopeLabel}</Table.Td>
                          <Table.Td>
                            <div className="flex flex-wrap gap-2">
                              {selectedGroupOrganizations.length > 1 ? (
                                <Button
                                  variant="outline-primary"
                                  onClick={() => setEditingMemberUserId((prev) => (prev === member.userId ? "" : member.userId))}
                                >
                                  {editingMemberUserId === member.userId ? "Hide Scope" : "Edit Scope"}
                                </Button>
                              ) : null}
                              <Button variant="outline-danger" onClick={() => void deleteMember(member.userId)} disabled={saving}>
                                Remove
                              </Button>
                            </div>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                    {(selectedGroup.members ?? []).length === 0 ? (
                      <Table.Tr>
                        <Table.Td colSpan={4} className="text-slate-500">
                          No members assigned yet.
                        </Table.Td>
                      </Table.Tr>
                    ) : null}
                  </Table.Tbody>
                </Table>
              </div>

              {editingMemberUserId && selectedGroupOrganizations.length > 1 ? (
                <div className="mt-5 rounded-md border p-4">
                  <div className="font-medium">Organization Responsibility</div>
                  <div className="mt-1 text-sm text-slate-500">Choose which organizations this member covers inside the group. Leave all unchecked to treat them as group-wide.</div>
                  <div className="mt-4 grid grid-cols-12 gap-2">
                    {selectedGroupOrganizations.map((mapping) => (
                      <label key={mapping.organizationId} className="col-span-12 md:col-span-6 flex items-center gap-2 text-sm text-slate-700">
                        <FormCheck.Input
                          type="checkbox"
                          checked={(memberScopeSelections[editingMemberUserId] ?? []).includes(mapping.organizationId)}
                          onChange={(event) => toggleMemberScope(editingMemberUserId, mapping.organizationId, event.target.checked)}
                        />
                        <span>{mapping.organization.name}</span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button onClick={() => void saveMemberScopes(editingMemberUserId)} disabled={saving}>
                      {saving ? "Saving..." : "Save Scope"}
                    </Button>
                    <Button variant="outline-secondary" onClick={() => setEditingMemberUserId("")} disabled={saving}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <div className="box p-8 text-center text-slate-500">Select a group to view and manage its details.</div>
        )}
      </div>
    </div>
  );
}

export default AdminGroupsPage;
