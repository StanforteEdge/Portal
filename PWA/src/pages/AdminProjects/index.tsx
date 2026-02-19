import { useEffect, useMemo, useState } from "react";
import Button from "@/components/Base/Button";
import { FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/Base/Form";
import Table from "@/components/Base/Table";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import {
  archiveProject,
  createProject,
  listProjects,
  unarchiveProject,
  updateProject,
  type ProjectOption,
} from "@/services/projects";
import { listOrganizations } from "@/services/organizations";
import { listUsers } from "@/services/users";

function AdminProjectsPage() {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([]);
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    organization_id: "",
    owner_user_id: "",
    project_code: "",
    governance_status: "planned",
    start_date: "",
    end_date: "",
  });

  const selected = useMemo(() => projects.find((x) => x.id === selectedId), [projects, selectedId]);

  const load = async () => {
    try {
      setBusy(true);
      const [p, orgs, us] = await Promise.all([
        listProjects({ active_only: false }),
        listOrganizations({ is_active: true }),
        listUsers({ page: 1, per_page: 200 }),
      ]);
      setProjects(p);
      setOrganizations(orgs.map((o) => ({ id: o.id, name: o.name })));
      setUsers(
        us.data.map((u) => ({
          id: u.id,
          name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username || u.email,
        }))
      );
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load projects." });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!selected) {
      setForm({
        name: "",
        description: "",
        organization_id: "",
        owner_user_id: "",
        project_code: "",
        governance_status: "planned",
        start_date: "",
        end_date: "",
      });
      return;
    }
    setForm({
      name: selected.name || "",
      description: selected.description || "",
      organization_id: selected.organizationId || "",
      owner_user_id: selected.governance?.owner_user_id || "",
      project_code: selected.governance?.project_code || "",
      governance_status: selected.governance?.governance_status || (selected.isActive ? "active" : "archived"),
      start_date: selected.governance?.start_date || "",
      end_date: selected.governance?.end_date || "",
    });
  }, [selectedId, selected]);

  const save = async () => {
    try {
      setBusy(true);
      setNotice(null);
      if (!form.name.trim()) {
        setNotice({ tone: "warning", message: "Project name is required." });
        return;
      }
      if (!selectedId) {
        await createProject({
          name: form.name,
          description: form.description || undefined,
          organization_id: form.organization_id || undefined,
          owner_user_id: form.owner_user_id || undefined,
          project_code: form.project_code || undefined,
          governance_status: form.governance_status,
          start_date: form.start_date || undefined,
          end_date: form.end_date || undefined,
        });
      } else {
        await updateProject(selectedId, {
          name: form.name,
          description: form.description || undefined,
          owner_user_id: form.owner_user_id || undefined,
          project_code: form.project_code || undefined,
          governance_status: form.governance_status,
          start_date: form.start_date || undefined,
          end_date: form.end_date || undefined,
        });
      }
      setNotice({ tone: "success", message: "Project saved." });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save project." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Projects Governance</h2>
      </div>
      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}
      <div className="grid grid-cols-12 gap-5 mt-5">
        <div className="col-span-12 lg:col-span-5 box p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Projects</h3>
            <Button variant="outline-primary" onClick={() => setSelectedId("")}>New</Button>
          </div>
          <div className="overflow-x-auto">
            <Table className="table-report" striped hover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Owner</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {projects.map((p) => (
                  <tr key={p.id} className={p.id === selectedId ? "bg-primary/10" : ""} onClick={() => setSelectedId(p.id)} style={{ cursor: "pointer" }}>
                    <td>{p.name}</td>
                    <td>{p.governance?.governance_status || (p.isActive ? "active" : "archived")}</td>
                    <td>{users.find((u) => u.id === p.governance?.owner_user_id)?.name || "-"}</td>
                  </tr>
                ))}
              </Table.Tbody>
            </Table>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-7 box p-4">
          <h3 className="font-medium mb-3">{selectedId ? "Edit Project" : "Create Project"}</h3>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-6"><FormLabel>Name</FormLabel><FormInput value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-6"><FormLabel>Project Code</FormLabel><FormInput value={form.project_code} onChange={(e) => setForm((p) => ({ ...p, project_code: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-6"><FormLabel>Organization</FormLabel><FormSelect value={form.organization_id} onChange={(e) => setForm((p) => ({ ...p, organization_id: e.target.value }))}><option value="">Select</option>{organizations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</FormSelect></div>
            <div className="col-span-12 md:col-span-6"><FormLabel>Owner</FormLabel><FormSelect value={form.owner_user_id} onChange={(e) => setForm((p) => ({ ...p, owner_user_id: e.target.value }))}><option value="">Select</option>{users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</FormSelect></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Status</FormLabel><FormSelect value={form.governance_status} onChange={(e) => setForm((p) => ({ ...p, governance_status: e.target.value }))}><option value="planned">Planned</option><option value="active">Active</option><option value="on_hold">On Hold</option><option value="completed">Completed</option><option value="archived">Archived</option></FormSelect></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Start Date</FormLabel><FormInput type="date" value={form.start_date} onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>End Date</FormLabel><FormInput type="date" value={form.end_date} onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))} /></div>
            <div className="col-span-12"><FormLabel>Description</FormLabel><FormTextarea rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button onClick={() => void save()} disabled={busy}>{selectedId ? "Update" : "Create"}</Button>
            {selectedId ? (
              <>
                <Button variant="outline-secondary" onClick={() => void archiveProject(selectedId).then(load)} disabled={busy}>Archive</Button>
                <Button variant="outline-secondary" onClick={() => void unarchiveProject(selectedId).then(load)} disabled={busy}>Unarchive</Button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminProjectsPage;

