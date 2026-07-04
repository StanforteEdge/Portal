import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Button from "@/components/Base/Button";
import { FormInput, FormLabel, FormSelect } from "@/components/Base/Form";
import { Dialog, Tab } from "@/components/Base/Headless";
import Table from "@/components/Base/Table";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import {
  createManagedTaxonomy,
  deleteManagedTaxonomy,
  listManagedTaxonomies,
  syncManagedTaxonomyTerms,
  updateManagedTaxonomy,
  type ManagedTaxonomy,
} from "@/services/taxonomy";
import { addGroupMember, createTeam, listTeams, removeGroupMember, updateTeam, type TeamOption } from "@/services/teams";
import {
  createOrganization,
  listOrganizations,
  updateOrganization,
  type OrganizationRecord,
} from "@/services/organizations";
import { listUsers, type UserListItem } from "@/services/users";
import {
  createRequestGroup,
  listRequestGroups,
  updateRequestGroup,
  type RequestGroupOption,
} from "@/services/requests";

type EditableTerm = {
  id: string;
  label: string;
};

function normalizeTerms(terms: Array<{ id: string; label: string }>): EditableTerm[] {
  return terms.map((term) => ({ id: term.id, label: term.label }));
}

function makeTermId() {
  return `new-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

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

function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  const [taxonomies, setTaxonomies] = useState<ManagedTaxonomy[]>([]);
  const [selectedTaxonomyId, setSelectedTaxonomyId] = useState("");
  const [showTaxonomyEditor, setShowTaxonomyEditor] = useState(false);
  const [taxonomyModuleFilter, setTaxonomyModuleFilter] = useState("finance");
  const [taxonomyForm, setTaxonomyForm] = useState<{
    id?: string;
    key: string;
    name: string;
    module: string;
    is_active: boolean;
  }>({
    key: "",
    name: "",
    module: "finance",
    is_active: true,
  });
  const [taxonomyTerms, setTaxonomyTerms] = useState<EditableTerm[]>([]);
  const [showTermModal, setShowTermModal] = useState(false);
  const [editingTermId, setEditingTermId] = useState<string | null>(null);
  const [termLabelInput, setTermLabelInput] = useState("");

  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [requestGroups, setRequestGroups] = useState<RequestGroupOption[]>([]);
  const [showRequestGroupEditor, setShowRequestGroupEditor] = useState(false);
  const [requestGroupForm, setRequestGroupForm] = useState<{
    id?: string;
    name: string;
    code: string;
    description: string;
  }>({
    name: "",
    code: "",
    description: "",
  });
  const [userOptions, setUserOptions] = useState<UserListItem[]>([]);
  const [memberForm, setMemberForm] = useState<{ user_id: string; role: "member" | "lead" | "manager" }>({
    user_id: "",
    role: "member",
  });
  const [showTeamEditor, setShowTeamEditor] = useState(false);
  const [teamForm, setTeamForm] = useState<{
    id?: string;
    name: string;
    group_type: "team" | "department";
    description: string;
    organization_id: string;
    is_active: boolean;
  }>({
    name: "",
    group_type: "team",
    description: "",
    organization_id: "",
    is_active: true,
  });

  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
  const [showOrganizationEditor, setShowOrganizationEditor] = useState(false);
  const [organizationForm, setOrganizationForm] = useState<{
    id?: string;
    name: string;
    code: string;
    organization_type: "group" | "venture" | "shared_function";
    is_active: boolean;
    parent_organization_id: string;
  }>({
    name: "",
    code: "",
    organization_type: "venture",
    is_active: true,
    parent_organization_id: "",
  });

  const selectedTaxonomy = useMemo(
    () => taxonomies.find((row) => row.id === selectedTaxonomyId),
    [taxonomies, selectedTaxonomyId]
  );
  const visibleTaxonomies = useMemo(
    () =>
      taxonomies.filter((row) => {
        const module = String(row.module || "").trim().toLowerCase();
        return module === taxonomyModuleFilter;
      }),
    [taxonomies, taxonomyModuleFilter]
  );

  const loadAll = async () => {
    setLoading(true);
    try {
      const [taxonomyResult, requestGroupsResult, teamsResult, orgsResult, usersResult] = await Promise.allSettled([
        listManagedTaxonomies({ include_inactive: true }),
        listRequestGroups(),
        listTeams({ active_only: false }),
        listOrganizations(),
        listUsers({ per_page: 200 }),
      ]);

      const taxonomyData = taxonomyResult.status === "fulfilled" ? taxonomyResult.value : [];
      const requestGroupsData = requestGroupsResult.status === "fulfilled" ? requestGroupsResult.value : [];
      const teamsData = teamsResult.status === "fulfilled" ? teamsResult.value : [];
      const orgs = orgsResult.status === "fulfilled" ? orgsResult.value : [];
      const usersData = usersResult.status === "fulfilled" ? usersResult.value.data : [];

      setTaxonomies(taxonomyData);
      setRequestGroups(requestGroupsData);
      setTeams(teamsData);
      setOrganizations(orgs);
      setUserOptions(usersData);

      const firstTaxonomy = taxonomyData.find(
        (row) => String(row.module || "").trim().toLowerCase() === taxonomyModuleFilter
      );
      if (firstTaxonomy) {
        setSelectedTaxonomyId(firstTaxonomy.id);
        setTaxonomyTerms(normalizeTerms(firstTaxonomy.terms));
      }

      if (taxonomyResult.status === "rejected") {
        setNotice({
          tone: "warning",
          message: "Taxonomy failed to load. Ensure migration is applied, then refresh.",
        });
      }
    } catch {
      setNotice({ tone: "error", message: "Unable to load admin settings." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    if (!selectedTaxonomy) {
      setTaxonomyTerms([]);
      return;
    }
    setTaxonomyTerms(normalizeTerms(selectedTaxonomy.terms));
  }, [selectedTaxonomy]);

  useEffect(() => {
    const taxonomyExistsInModule = visibleTaxonomies.some((row) => row.id === selectedTaxonomyId);
    if (taxonomyExistsInModule) return;
    const first = visibleTaxonomies[0];
    setSelectedTaxonomyId(first?.id || "");
    setTaxonomyTerms(first ? normalizeTerms(first.terms) : []);
  }, [visibleTaxonomies, selectedTaxonomyId]);

  const saveTaxonomy = async () => {
    if (!taxonomyForm.key.trim() || !taxonomyForm.name.trim()) {
      setNotice({ tone: "warning", message: "Taxonomy key and name are required." });
      return;
    }

    try {
      setSaving(true);
      if (taxonomyForm.id) {
        await updateManagedTaxonomy(taxonomyForm.id, {
          key: taxonomyForm.key.trim(),
          name: taxonomyForm.name.trim(),
          module: taxonomyForm.module.trim() || undefined,
          is_active: taxonomyForm.is_active,
        });
      } else {
        await createManagedTaxonomy({
          key: taxonomyForm.key.trim(),
          name: taxonomyForm.name.trim(),
          module: (taxonomyForm.module.trim() || taxonomyModuleFilter).toLowerCase(),
          is_active: taxonomyForm.is_active,
        });
      }

      const rows = await listManagedTaxonomies({ include_inactive: true });
      setTaxonomies(rows);
      setShowTaxonomyEditor(false);
      setTaxonomyForm({ key: "", name: "", module: taxonomyModuleFilter, is_active: true });
      setTaxonomyTerms([]);
      setNotice({ tone: "success", message: "Taxonomy saved." });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save taxonomy." });
    } finally {
      setSaving(false);
    }
  };

  const saveTaxonomyTerms = async () => {
    if (!selectedTaxonomyId) {
      setNotice({ tone: "warning", message: "Select a taxonomy first." });
      return;
    }

    const terms = taxonomyTerms
      .map((row) => row.label.trim())
      .filter(Boolean);

    try {
      setSaving(true);
      await syncManagedTaxonomyTerms(selectedTaxonomyId, terms);
      const rows = await listManagedTaxonomies({ include_inactive: true });
      setTaxonomies(rows);
      setNotice({ tone: "success", message: "Taxonomy terms updated." });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to update taxonomy terms." });
    } finally {
      setSaving(false);
    }
  };

  const removeTaxonomy = async (id: string) => {
    const confirmed = window.confirm("Delete this taxonomy and all its terms?");
    if (!confirmed) return;
    try {
      setSaving(true);
      await deleteManagedTaxonomy(id);
      const rows = await listManagedTaxonomies({ include_inactive: true });
      setTaxonomies(rows);
      if (selectedTaxonomyId === id) {
        setSelectedTaxonomyId("");
        setTaxonomyTerms([]);
        if (taxonomyForm.id === id) {
          setShowTaxonomyEditor(false);
          setTaxonomyForm({ key: "", name: "", module: taxonomyModuleFilter, is_active: true });
        }
      }
      setNotice({ tone: "success", message: "Taxonomy deleted." });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to delete taxonomy." });
    } finally {
      setSaving(false);
    }
  };

  const loadTaxonomyIntoForm = (row: ManagedTaxonomy) => {
    setSelectedTaxonomyId(row.id);
    setTaxonomyForm({
      id: row.id,
      key: row.key,
      name: row.name,
      module: row.module || "",
      is_active: row.is_active,
    });
    setTaxonomyTerms(normalizeTerms(row.terms));
    setShowTaxonomyEditor(true);
  };

  const openCreateTermModal = () => {
    setEditingTermId(null);
    setTermLabelInput("");
    setShowTermModal(true);
  };

  const openEditTermModal = (term: EditableTerm) => {
    setEditingTermId(term.id);
    setTermLabelInput(term.label);
    setShowTermModal(true);
  };

  const saveTermFromModal = () => {
    const value = termLabelInput.trim();
    if (!value) {
      setNotice({ tone: "warning", message: "Term label is required." });
      return;
    }

    const hasDuplicate = taxonomyTerms.some((term) => {
      if (editingTermId && term.id === editingTermId) return false;
      return term.label.trim().toLowerCase() === value.toLowerCase();
    });
    if (hasDuplicate) {
      setNotice({ tone: "warning", message: "Term label already exists." });
      return;
    }

    if (editingTermId) {
      setTaxonomyTerms((prev) => prev.map((term) => (term.id === editingTermId ? { ...term, label: value } : term)));
    } else {
      setTaxonomyTerms((prev) => [...prev, { id: makeTermId(), label: value }]);
    }

    setShowTermModal(false);
    setEditingTermId(null);
    setTermLabelInput("");
  };

  const deleteTerm = (id: string) => {
    setTaxonomyTerms((prev) => prev.filter((term) => term.id !== id));
  };

  const loadRequestGroupIntoForm = (group: RequestGroupOption) => {
    setRequestGroupForm({
      id: group.id,
      name: group.name,
      code: group.code,
      description: group.description || "",
    });
    setShowRequestGroupEditor(true);
  };

  const saveRequestGroup = async () => {
    if (!requestGroupForm.name.trim() || !requestGroupForm.code.trim()) {
      setNotice({ tone: "warning", message: "Request group name and code are required." });
      return;
    }
    try {
      setSaving(true);
      const payload = {
        name: requestGroupForm.name.trim(),
        code: requestGroupForm.code.trim().toLowerCase(),
        description: requestGroupForm.description.trim() || undefined,
      };
      if (requestGroupForm.id) {
        await updateRequestGroup(requestGroupForm.id, payload);
      } else {
        await createRequestGroup(payload);
      }
      setRequestGroups(await listRequestGroups());
      setShowRequestGroupEditor(false);
      setRequestGroupForm({ name: "", code: "", description: "" });
      setNotice({ tone: "success", message: "Request group saved." });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save request group." });
    } finally {
      setSaving(false);
    }
  };

  const loadTeamIntoForm = (team: TeamOption) => {
    setTeamForm({
      id: team.id,
      name: team.name,
      group_type: (team.groupType as "team" | "department") || "team",
      description: team.description || "",
      organization_id: team.organizationId || "",
      is_active: team.isActive ?? true,
    });
    setShowTeamEditor(true);
  };

  const saveTeam = async () => {
    if (!teamForm.name.trim()) {
      setNotice({ tone: "warning", message: "Group name is required." });
      return;
    }
    try {
      setSaving(true);
      if (teamForm.id) {
        await updateTeam(teamForm.id, {
          name: teamForm.name.trim(),
          group_type: teamForm.group_type,
          description: teamForm.description || undefined,
          organization_id: teamForm.organization_id || undefined,
          is_active: teamForm.is_active,
        });
      } else {
        await createTeam({
          name: teamForm.name.trim(),
          group_type: teamForm.group_type,
          description: teamForm.description || undefined,
          organization_id: teamForm.organization_id || undefined,
        });
      }
      setTeamForm({ name: "", group_type: "team", description: "", organization_id: "", is_active: true });
      setTeams(await listTeams({ active_only: false }));
      setShowTeamEditor(false);
      setNotice({ tone: "success", message: "Group saved." });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save group." });
    } finally {
      setSaving(false);
    }
  };

  const saveGroupMember = async () => {
    if (!teamForm.id || !memberForm.user_id) {
      setNotice({ tone: "warning", message: "Select a user to add." });
      return;
    }
    try {
      setSaving(true);
      await addGroupMember(teamForm.id, memberForm);
      setTeams(await listTeams({ active_only: false }));
      setMemberForm({ user_id: "", role: "member" });
      setNotice({ tone: "success", message: "Member updated." });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to add member." });
    } finally {
      setSaving(false);
    }
  };

  const deleteGroupMember = async (groupId: string, userId: string) => {
    try {
      setSaving(true);
      await removeGroupMember(groupId, userId);
      setTeams(await listTeams({ active_only: false }));
      setNotice({ tone: "success", message: "Member removed." });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to remove member." });
    } finally {
      setSaving(false);
    }
  };

  const loadOrganizationIntoForm = (org: OrganizationRecord) => {
    setOrganizationForm({
      id: org.id,
      name: org.name,
      code: org.code,
      organization_type: org.organization_type,
      is_active: org.is_active,
      parent_organization_id: org.parent_organization_id || "",
    });
    setShowOrganizationEditor(true);
  };

  const saveOrganization = async () => {
    if (!organizationForm.name.trim() || !organizationForm.code.trim()) {
      setNotice({ tone: "warning", message: "Organization name and code are required." });
      return;
    }
    try {
      setSaving(true);
      if (organizationForm.id) {
        await updateOrganization(organizationForm.id, {
          name: organizationForm.name.trim(),
          code: organizationForm.code.trim().toUpperCase(),
          organization_type: organizationForm.organization_type,
          is_active: organizationForm.is_active,
          parent_organization_id: organizationForm.parent_organization_id || null,
        });
      } else {
        await createOrganization({
          name: organizationForm.name.trim(),
          code: organizationForm.code.trim().toUpperCase(),
          organization_type: organizationForm.organization_type,
          is_active: organizationForm.is_active,
          parent_organization_id: organizationForm.parent_organization_id || undefined,
        });
      }
      setOrganizationForm({
        name: "",
        code: "",
        organization_type: "venture",
        is_active: true,
        parent_organization_id: "",
      });
      setOrganizations(await listOrganizations());
      setShowOrganizationEditor(false);
      setNotice({ tone: "success", message: "Organization saved." });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save organization." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Admin Settings</h2>
      </div>

      <div className="grid grid-cols-12 gap-6 mt-5 intro-y">
        <div className="col-span-12 box p-5">
          {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mb-4" /> : null}
          {loading ? <div className="text-slate-500">Loading settings...</div> : null}

          {!loading ? (
            <Tab.Group>
              <Tab.List variant="tabs">
                <Tab>
                  <Tab.Button className="w-full py-2" as="button">
                    Categories
                  </Tab.Button>
                </Tab>
                <Tab>
                  <Tab.Button className="w-full py-2" as="button">
                    Request Groups
                  </Tab.Button>
                </Tab>
                <Tab>
                  <Tab.Button className="w-full py-2" as="button">
                    Groups
                  </Tab.Button>
                </Tab>
                <Tab>
                  <Tab.Button className="w-full py-2" as="button">
                    Organizations
                  </Tab.Button>
                </Tab>
              </Tab.List>

              <Tab.Panels className="border-b border-l border-r">
                <Tab.Panel className="p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-end sm:justify-between">
                    <div className="w-full sm:w-56">
                      <FormLabel>Module</FormLabel>
                      <FormSelect
                        value={taxonomyModuleFilter}
                        onChange={(e) => {
                          const nextModule = e.target.value;
                          setTaxonomyModuleFilter(nextModule);
                          if (!showTaxonomyEditor || !taxonomyForm.id) {
                            setTaxonomyForm((prev) => ({ ...prev, module: nextModule }));
                          }
                        }}
                      >
                        <option value="finance">Finance</option>
                        <option value="hr">Human Resources</option>
                        <option value="admin">Admin</option>
                      </FormSelect>
                    </div>
                    <Button
                      variant="primary"
                      onClick={() => {
                        setTaxonomyForm({ key: "", name: "", module: taxonomyModuleFilter, is_active: true });
                        setTaxonomyTerms([]);
                        setShowTaxonomyEditor(true);
                      }}
                    >
                      Create Taxonomy
                    </Button>
                  </div>

                  <div className="grid grid-cols-12 gap-5">
                    <div className={showTaxonomyEditor ? "col-span-12 sm:col-span-5 border rounded-md p-4" : "col-span-12 border rounded-md p-4"}>
                      <div className="overflow-x-auto">
                        <Table className="table-report w-full" striped hover>
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th>Name</Table.Th>
                              {showTaxonomyEditor ? null : <Table.Th>Key</Table.Th>}
                              <Table.Th>Module</Table.Th>
                              {showTaxonomyEditor ? null : <Table.Th>Terms</Table.Th>}
                              {showTaxonomyEditor ? null : <Table.Th>Status</Table.Th>}
                              <Table.Th>Action</Table.Th>
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {visibleTaxonomies.map((row) => (
                              <Table.Tr key={row.id}>
                                <Table.Td>{row.name}</Table.Td>
                                {showTaxonomyEditor ? null : <Table.Td>{row.key}</Table.Td>}
                                <Table.Td>{row.module || "-"}</Table.Td>
                                {showTaxonomyEditor ? null : <Table.Td>{row.terms.length}</Table.Td>}
                                {showTaxonomyEditor ? null : (
                                  <Table.Td className={row.is_active ? "text-success" : "text-slate-500"}>
                                    {row.is_active ? "Active" : "Inactive"}
                                  </Table.Td>
                                )}
                                <Table.Td>
                                  <div className="flex gap-2">
                                    <Button variant="outline-primary" onClick={() => loadTaxonomyIntoForm(row)}>
                                      Edit
                                    </Button>
                                    <Button variant="outline-danger" onClick={() => void removeTaxonomy(row.id)}>
                                      Delete
                                    </Button>
                                  </div>
                                </Table.Td>
                              </Table.Tr>
                            ))}
                            {visibleTaxonomies.length === 0 ? (
                              <Table.Tr>
                                <Table.Td colSpan={showTaxonomyEditor ? 3 : 6} className="text-slate-500">
                                  No taxonomies found for this module.
                                </Table.Td>
                              </Table.Tr>
                            ) : null}
                          </Table.Tbody>
                        </Table>
                      </div>
                    </div>

                    {showTaxonomyEditor ? (
                      <div className="col-span-12 sm:col-span-7 border rounded-md p-4 space-y-4">
                        <div className="grid grid-cols-12 gap-4">
                          <div className="col-span-12 md:col-span-4">
                            <FormLabel>Taxonomy Name</FormLabel>
                            <FormInput
                              value={taxonomyForm.name}
                              onChange={(e) => setTaxonomyForm((prev) => ({ ...prev, name: e.target.value }))}
                            />
                          </div>
                          <div className="col-span-12 md:col-span-4">
                            <FormLabel>Taxonomy Key</FormLabel>
                            <FormInput
                              value={taxonomyForm.key}
                              onChange={(e) => setTaxonomyForm((prev) => ({ ...prev, key: e.target.value }))}
                            />
                          </div>
                          <div className="col-span-12 md:col-span-2">
                            <FormLabel>Module</FormLabel>
                            <FormSelect
                              value={taxonomyForm.module}
                              onChange={(e) => setTaxonomyForm((prev) => ({ ...prev, module: e.target.value }))}
                            >
                              <option value="finance">Finance</option>
                              <option value="hr">Human Resources</option>
                              <option value="admin">Admin</option>
                            </FormSelect>
                          </div>
                          <div className="col-span-12 md:col-span-2">
                            <FormLabel>Status</FormLabel>
                            <FormSelect
                              value={taxonomyForm.is_active ? "true" : "false"}
                              onChange={(e) => setTaxonomyForm((prev) => ({ ...prev, is_active: e.target.value === "true" }))}
                            >
                              <option value="true">Active</option>
                              <option value="false">Inactive</option>
                            </FormSelect>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button onClick={saveTaxonomy} disabled={saving}>
                            {saving ? "Saving..." : taxonomyForm.id ? "Update Taxonomy" : "Create Taxonomy"}
                          </Button>
                          <Button
                            variant="outline-secondary"
                            onClick={() => {
                              setShowTaxonomyEditor(false);
                              setTaxonomyForm({ key: "", name: "", module: taxonomyModuleFilter, is_active: true });
                              setTaxonomyTerms([]);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>

                        {taxonomyForm.id ? (
                          <div className="border-t pt-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="text-base font-medium">Category Terms</div>
                              <Button variant="outline-primary" onClick={openCreateTermModal}>
                                Add Term
                              </Button>
                            </div>
                            <div className="overflow-x-auto">
                              <Table className="table-report w-full" striped>
                                <Table.Thead>
                                  <Table.Tr>
                                    <Table.Th>Label</Table.Th>
                                    <Table.Th>Action</Table.Th>
                                  </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                  {taxonomyTerms.map((term) => (
                                    <Table.Tr key={term.id}>
                                      <Table.Td>{term.label}</Table.Td>
                                      <Table.Td>
                                        <div className="flex flex-wrap gap-2">
                                          <Button variant="outline-primary" onClick={() => openEditTermModal(term)}>
                                            Edit
                                          </Button>
                                          <Button variant="outline-danger" onClick={() => deleteTerm(term.id)}>
                                            Remove
                                          </Button>
                                        </div>
                                      </Table.Td>
                                    </Table.Tr>
                                  ))}
                                  {taxonomyTerms.length === 0 ? (
                                    <Table.Tr>
                                      <Table.Td colSpan={2} className="text-slate-500">
                                        No terms yet.
                                      </Table.Td>
                                    </Table.Tr>
                                  ) : null}
                                </Table.Tbody>
                              </Table>
                            </div>
                            <Button variant="primary" onClick={saveTaxonomyTerms} disabled={saving}>
                              {saving ? "Saving..." : "Save Terms"}
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </Tab.Panel>

                <Tab.Panel className="p-5 space-y-4">
                  <AppNotice
                    tone="info"
                    message="Group management now has a dedicated workspace. Use it for shared teams, multi-organization coverage, and member responsibility assignments."
                  />
                  <div className="flex justify-end">
                    <Button as={Link as any} to="/appOld/admin/groups" variant="outline-primary">
                      Open Groups Workspace
                    </Button>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="primary"
                      onClick={() => {
                        setRequestGroupForm({ name: "", code: "", description: "" });
                        setShowRequestGroupEditor(true);
                      }}
                    >
                      Create Request Group
                    </Button>
                  </div>

                  <div className="grid grid-cols-12 gap-5">
                    <div
                      className={
                        showRequestGroupEditor ? "col-span-12 sm:col-span-5 border rounded-md p-4" : "col-span-12 border rounded-md p-4"
                      }
                    >
                      <div className="overflow-x-auto">
                        <Table className="table-report w-full" striped hover>
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th>Name</Table.Th>
                              <Table.Th>Code</Table.Th>
                              {showRequestGroupEditor ? null : <Table.Th>Description</Table.Th>}
                              <Table.Th>Action</Table.Th>
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {requestGroups.map((group) => (
                              <Table.Tr key={group.id}>
                                <Table.Td>{group.name}</Table.Td>
                                <Table.Td>{group.code}</Table.Td>
                                {showRequestGroupEditor ? null : <Table.Td>{group.description || "-"}</Table.Td>}
                                <Table.Td>
                                  <Button variant="outline-primary" onClick={() => loadRequestGroupIntoForm(group)}>
                                    Edit
                                  </Button>
                                </Table.Td>
                              </Table.Tr>
                            ))}
                            {requestGroups.length === 0 ? (
                              <Table.Tr>
                                <Table.Td colSpan={showRequestGroupEditor ? 3 : 4} className="text-slate-500">
                                  No request groups found.
                                </Table.Td>
                              </Table.Tr>
                            ) : null}
                          </Table.Tbody>
                        </Table>
                      </div>
                    </div>

                    {showRequestGroupEditor ? (
                      <div className="col-span-12 sm:col-span-7 border rounded-md p-4">
                        <div className="grid grid-cols-12 gap-4">
                          <div className="col-span-12 md:col-span-4">
                            <FormLabel>Name</FormLabel>
                            <FormInput
                              value={requestGroupForm.name}
                              onChange={(e) => setRequestGroupForm((prev) => ({ ...prev, name: e.target.value }))}
                            />
                          </div>
                          <div className="col-span-12 md:col-span-3">
                            <FormLabel>Code</FormLabel>
                            <FormInput
                              value={requestGroupForm.code}
                              onChange={(e) => setRequestGroupForm((prev) => ({ ...prev, code: e.target.value.toLowerCase() }))}
                            />
                          </div>
                          <div className="col-span-12 md:col-span-5">
                            <FormLabel>Description</FormLabel>
                            <FormInput
                              value={requestGroupForm.description}
                              onChange={(e) => setRequestGroupForm((prev) => ({ ...prev, description: e.target.value }))}
                              placeholder="Optional"
                            />
                          </div>
                          <div className="col-span-12 flex gap-2">
                            <Button onClick={saveRequestGroup} disabled={saving}>
                              {saving ? "Saving..." : requestGroupForm.id ? "Update Request Group" : "Create Request Group"}
                            </Button>
                            <Button
                              variant="outline-secondary"
                              onClick={() => {
                                setRequestGroupForm({ name: "", code: "", description: "" });
                                setShowRequestGroupEditor(false);
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </Tab.Panel>

                <Tab.Panel className="p-5 space-y-4">
                  <div className="flex justify-end">
                    <Button
                      variant="primary"
                      onClick={() => {
                        setTeamForm({ name: "", group_type: "team", description: "", organization_id: "", is_active: true });
                        setShowTeamEditor(true);
                      }}
                    >
                      Create Group
                    </Button>
                  </div>

                  <div className="grid grid-cols-12 gap-5">
                    <div className={showTeamEditor ? "col-span-12 sm:col-span-5 border rounded-md p-4" : "col-span-12 border rounded-md p-4"}>
                      <div className="overflow-x-auto">
                        <Table className="table-report w-full" striped hover>
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th>Name</Table.Th>
                              <Table.Th>Type</Table.Th>
                              {showTeamEditor ? null : <Table.Th>Organization</Table.Th>}
                              {showTeamEditor ? null : <Table.Th>Members</Table.Th>}
                              {showTeamEditor ? null : <Table.Th>Status</Table.Th>}
                              <Table.Th>Action</Table.Th>
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {teams.map((team) => (
                              <Table.Tr key={team.id}>
                                <Table.Td>{team.name}</Table.Td>
                                <Table.Td className="capitalize">{team.groupType || "team"}</Table.Td>
                                {showTeamEditor ? null : (
                                  <Table.Td>{organizations.find((org) => org.id === team.organizationId)?.name || "-"}</Table.Td>
                                )}
                                {showTeamEditor ? null : <Table.Td>{team.members?.length || 0}</Table.Td>}
                                {showTeamEditor ? null : (
                                  <Table.Td className={team.isActive ? "text-success" : "text-slate-500"}>
                                    {team.isActive ? "Active" : "Inactive"}
                                  </Table.Td>
                                )}
                                <Table.Td>
                                  <Button variant="outline-primary" onClick={() => loadTeamIntoForm(team)}>
                                    Edit
                                  </Button>
                                </Table.Td>
                              </Table.Tr>
                            ))}
                            {teams.length === 0 ? (
                              <Table.Tr>
                                <Table.Td colSpan={showTeamEditor ? 3 : 6} className="text-slate-500">
                                  No groups found.
                                </Table.Td>
                              </Table.Tr>
                            ) : null}
                          </Table.Tbody>
                        </Table>
                      </div>
                    </div>

                    {showTeamEditor ? (
                      <div className="col-span-12 sm:col-span-7 border rounded-md p-4">
                        <div className="grid grid-cols-12 gap-4">
                          <div className="col-span-12 md:col-span-4">
                            <FormLabel>Name</FormLabel>
                            <FormInput value={teamForm.name} onChange={(e) => setTeamForm((prev) => ({ ...prev, name: e.target.value }))} />
                          </div>
                          <div className="col-span-12 md:col-span-3">
                            <FormLabel>Group Type</FormLabel>
                            <FormSelect
                              value={teamForm.group_type}
                              onChange={(e) => setTeamForm((prev) => ({ ...prev, group_type: e.target.value as "team" | "department" }))}
                            >
                              <option value="team">Team</option>
                              <option value="department">Department</option>
                            </FormSelect>
                          </div>
                          <div className="col-span-12 md:col-span-3">
                            <FormLabel>Organization</FormLabel>
                            <FormSelect
                              value={teamForm.organization_id}
                              onChange={(e) => setTeamForm((prev) => ({ ...prev, organization_id: e.target.value }))}
                            >
                              <option value="">None</option>
                              {organizations.map((org) => (
                                <option key={org.id} value={org.id}>
                                  {org.name}
                                </option>
                              ))}
                            </FormSelect>
                          </div>
                          <div className="col-span-12 md:col-span-2">
                            <FormLabel>Status</FormLabel>
                            <FormSelect
                              value={teamForm.is_active ? "true" : "false"}
                              onChange={(e) => setTeamForm((prev) => ({ ...prev, is_active: e.target.value === "true" }))}
                            >
                              <option value="true">Active</option>
                              <option value="false">Inactive</option>
                            </FormSelect>
                          </div>

                          <div className="col-span-12">
                            <FormLabel>Description</FormLabel>
                            <FormInput
                              value={teamForm.description}
                              onChange={(e) => setTeamForm((prev) => ({ ...prev, description: e.target.value }))}
                            />
                          </div>

                          <div className="col-span-12 flex gap-2">
                            <Button onClick={saveTeam} disabled={saving}>
                              {saving ? "Saving..." : teamForm.id ? "Update Group" : "Create Group"}
                            </Button>
                            <Button
                              variant="outline-secondary"
                              onClick={() => {
                                setTeamForm({ name: "", group_type: "team", description: "", organization_id: "", is_active: true });
                                setShowTeamEditor(false);
                              }}
                            >
                              Cancel
                            </Button>
                          </div>

                          {teamForm.id ? (
                            <div className="col-span-12 border-t pt-4 space-y-3">
                              <div className="text-base font-medium">Members</div>
                              <div className="grid grid-cols-12 gap-3">
                                <div className="col-span-12 md:col-span-6">
                                  <FormLabel>User</FormLabel>
                                  <FormSelect
                                    value={memberForm.user_id}
                                    onChange={(e) => setMemberForm((prev) => ({ ...prev, user_id: e.target.value }))}
                                  >
                                    <option value="">Select user</option>
                                    {userOptions.map((user) => (
                                      <option key={user.id} value={user.id}>
                                        {`${formatUserName(user)} (${user.email})`}
                                      </option>
                                    ))}
                                  </FormSelect>
                                </div>
                                <div className="col-span-12 md:col-span-4">
                                  <FormLabel>Role</FormLabel>
                                  <FormSelect
                                    value={memberForm.role}
                                    onChange={(e) => setMemberForm((prev) => ({ ...prev, role: e.target.value as "member" | "lead" | "manager" }))}
                                  >
                                    <option value="member">Member</option>
                                    <option value="lead">Lead</option>
                                    <option value="manager">Manager</option>
                                  </FormSelect>
                                </div>
                                <div className="col-span-12 md:col-span-2 flex items-end">
                                  <Button onClick={saveGroupMember} disabled={saving} className="w-full">
                                    Add
                                  </Button>
                                </div>
                              </div>

                              <Table className="table-report w-full">
                                <Table.Thead>
                                  <Table.Tr>
                                    <Table.Th>User</Table.Th>
                                    <Table.Th>Role</Table.Th>
                                    <Table.Th>Action</Table.Th>
                                  </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                  {(teams.find((t) => t.id === teamForm.id)?.members || []).map((member) => (
                                    <Table.Tr key={`${member.userId}-${member.role}`}>
                                      <Table.Td>
                                        <div className="font-medium">{formatUserName(member.user)}</div>
                                        <div className="text-xs text-slate-500">{member.user.email}</div>
                                      </Table.Td>
                                      <Table.Td className="capitalize">{member.role}</Table.Td>
                                      <Table.Td>
                                        <Button
                                          variant="outline-danger"
                                          onClick={() => void deleteGroupMember(teamForm.id as string, member.userId)}
                                        >
                                          Remove
                                        </Button>
                                      </Table.Td>
                                    </Table.Tr>
                                  ))}
                                </Table.Tbody>
                              </Table>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </Tab.Panel>

                <Tab.Panel className="p-5 space-y-4">
                  <div className="flex justify-end">
                    <Button
                      variant="primary"
                      onClick={() => {
                        setOrganizationForm({
                          name: "",
                          code: "",
                          organization_type: "venture",
                          is_active: true,
                          parent_organization_id: "",
                        });
                        setShowOrganizationEditor(true);
                      }}
                    >
                      Create Organization
                    </Button>
                  </div>

                  <div className="grid grid-cols-12 gap-5">
                    <div className={showOrganizationEditor ? "col-span-12 sm:col-span-5 border rounded-md p-4" : "col-span-12 border rounded-md p-4"}>
                      <div className="overflow-x-auto">
                        <Table className="table-report w-full" striped hover>
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th>Name</Table.Th>
                              <Table.Th>Code</Table.Th>
                              {showOrganizationEditor ? null : <Table.Th>Type</Table.Th>}
                              {showOrganizationEditor ? null : <Table.Th>Parent</Table.Th>}
                              {showOrganizationEditor ? null : <Table.Th>Status</Table.Th>}
                              <Table.Th>Action</Table.Th>
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {organizations.map((org) => (
                              <Table.Tr key={org.id}>
                                <Table.Td>{org.name}</Table.Td>
                                <Table.Td>{org.code}</Table.Td>
                                {showOrganizationEditor ? null : (
                                  <Table.Td className="capitalize">{org.organization_type.replace("_", " ")}</Table.Td>
                                )}
                                {showOrganizationEditor ? null : (
                                  <Table.Td>{organizations.find((item) => item.id === org.parent_organization_id)?.name || "-"}</Table.Td>
                                )}
                                {showOrganizationEditor ? null : (
                                  <Table.Td className={org.is_active ? "text-success" : "text-slate-500"}>
                                    {org.is_active ? "Active" : "Inactive"}
                                  </Table.Td>
                                )}
                                <Table.Td>
                                  <Button variant="outline-primary" onClick={() => loadOrganizationIntoForm(org)}>
                                    Edit
                                  </Button>
                                </Table.Td>
                              </Table.Tr>
                            ))}
                            {organizations.length === 0 ? (
                              <Table.Tr>
                                <Table.Td colSpan={showOrganizationEditor ? 3 : 6} className="text-slate-500">
                                  No organizations found.
                                </Table.Td>
                              </Table.Tr>
                            ) : null}
                          </Table.Tbody>
                        </Table>
                      </div>
                    </div>

                    {showOrganizationEditor ? (
                      <div className="col-span-12 sm:col-span-7 border rounded-md p-4">
                        <div className="grid grid-cols-12 gap-4">
                          <div className="col-span-12 md:col-span-4">
                            <FormLabel>Name</FormLabel>
                            <FormInput
                              value={organizationForm.name}
                              onChange={(e) => setOrganizationForm((prev) => ({ ...prev, name: e.target.value }))}
                            />
                          </div>
                          <div className="col-span-12 md:col-span-2">
                            <FormLabel>Code</FormLabel>
                            <FormInput
                              value={organizationForm.code}
                              onChange={(e) => setOrganizationForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                            />
                          </div>
                          <div className="col-span-12 md:col-span-3">
                            <FormLabel>Type</FormLabel>
                            <FormSelect
                              value={organizationForm.organization_type}
                              onChange={(e) =>
                                setOrganizationForm((prev) => ({
                                  ...prev,
                                  organization_type: e.target.value as "group" | "venture" | "shared_function",
                                }))
                              }
                            >
                              <option value="group">Group</option>
                              <option value="venture">Venture</option>
                              <option value="shared_function">Shared Function</option>
                            </FormSelect>
                          </div>
                          <div className="col-span-12 md:col-span-3">
                            <FormLabel>Status</FormLabel>
                            <FormSelect
                              value={organizationForm.is_active ? "true" : "false"}
                              onChange={(e) => setOrganizationForm((prev) => ({ ...prev, is_active: e.target.value === "true" }))}
                            >
                              <option value="true">Active</option>
                              <option value="false">Inactive</option>
                            </FormSelect>
                          </div>

                          <div className="col-span-12 md:col-span-6">
                            <FormLabel>Parent Organization (optional)</FormLabel>
                            <FormSelect
                              value={organizationForm.parent_organization_id}
                              onChange={(e) => setOrganizationForm((prev) => ({ ...prev, parent_organization_id: e.target.value }))}
                            >
                              <option value="">None</option>
                              {organizations
                                .filter((org) => org.id !== organizationForm.id)
                                .map((org) => (
                                  <option key={org.id} value={org.id}>
                                    {org.name}
                                  </option>
                                ))}
                            </FormSelect>
                          </div>

                          <div className="col-span-12 flex gap-2">
                            <Button onClick={saveOrganization} disabled={saving}>
                              {saving ? "Saving..." : organizationForm.id ? "Update Organization" : "Create Organization"}
                            </Button>
                            <Button
                              variant="outline-secondary"
                              onClick={() => {
                                setOrganizationForm({
                                  name: "",
                                  code: "",
                                  organization_type: "venture",
                                  is_active: true,
                                  parent_organization_id: "",
                                });
                                setShowOrganizationEditor(false);
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          ) : null}
        </div>
      </div>

      <Dialog open={showTermModal} onClose={() => setShowTermModal(false)}>
        <Dialog.Panel>
          <div className="p-5 space-y-4">
            <div className="text-lg font-medium">{editingTermId ? "Edit Category Term" : "Add Category Term"}</div>
            <div>
              <FormLabel>Term Label</FormLabel>
              <FormInput value={termLabelInput} onChange={(e) => setTermLabelInput(e.target.value)} placeholder="e.g. Operations" />
            </div>
          </div>
          <div className="px-5 pb-5 flex gap-2 justify-end">
            <Button variant="outline-secondary" onClick={() => setShowTermModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={saveTermFromModal}>
              {editingTermId ? "Update" : "Add"}
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>
    </>
  );
}

export default AdminSettingsPage;
