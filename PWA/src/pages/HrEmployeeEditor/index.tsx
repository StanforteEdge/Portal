import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/Base/Button";
import { FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import {
  addEmployeeOrganization,
  addEmployeeTeam,
  createHrEmployee,
  getHrEmployee,
  listHrEmployees,
  removeEmployeeOrganization,
  removeEmployeeTeam,
  runHrEmployeeAction,
  updateHrEmployee,
  type HrEmployee,
} from "@/services/hr";
import { listOrganizations, type OrganizationRecord } from "@/services/organizations";
import { listTeams, type TeamOption } from "@/services/teams";

const emptyForm = {
  first_name: "",
  last_name: "",
  username: "",
  email: "",
  phone: "",
  employee_code: "",
  job_title: "",
  job_description: "",
  employment_status: "draft",
  employment_type: "full_time",
  work_mode: "onsite",
  manager_user_id: "",
};

function HrEmployeeEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isCreate = id === "employee";

  const [employee, setEmployee] = useState<HrEmployee | null>(null);
  const [form, setForm] = useState<Record<string, string>>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  const [allEmployees, setAllEmployees] = useState<HrEmployee[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);

  const [organizationToAdd, setOrganizationToAdd] = useState("");
  const [teamToAdd, setTeamToAdd] = useState("");
  const [teamRoleToAdd, setTeamRoleToAdd] = useState<"member" | "lead" | "manager">("member");

  const loadMeta = async () => {
    const [employeesRes, orgs, tms] = await Promise.all([
      listHrEmployees({ page: 1, per_page: 200 }),
      listOrganizations({ is_active: true }),
      listTeams({ active_only: true }),
    ]);
    setAllEmployees(employeesRes.data);
    setOrganizations(orgs);
    setTeams(tms);
  };

  const loadEmployee = async () => {
    if (isCreate || !id) {
      setEmployee(null);
      setForm(emptyForm);
      return;
    }
    const data = await getHrEmployee(id);
    setEmployee(data);
    setForm({
      first_name: data.first_name || "",
      last_name: data.last_name || "",
      username: data.username || "",
      email: data.email || "",
      phone: data.phone || "",
      employee_code: data.employee_profile?.employee_code || data.employee_profile?.employeeCode || "",
      job_title: data.employee_profile?.job_title || data.employee_profile?.jobTitle || "",
      job_description: data.employee_profile?.job_description || "",
      employment_status: data.employee_profile?.employment_status || data.employee_profile?.employmentStatus || "draft",
      employment_type: data.employee_profile?.employment_type || "full_time",
      work_mode: data.employee_profile?.work_mode || "onsite",
      manager_user_id: (data.employee_profile?.manager?.id as string | undefined) || "",
    });
  };

  const reload = async () => {
    try {
      setLoading(true);
      await Promise.all([loadMeta(), loadEmployee()]);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load employee." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, [id]);

  const managerOptions = useMemo(
    () =>
      allEmployees.map((row) => ({
        value: row.id,
        label: `${row.first_name || ""} ${row.last_name || ""}`.trim() || row.username,
        email: row.email,
      })),
    [allEmployees]
  );

  const onSave = async () => {
    try {
      setSaving(true);
      const payload = {
        ...form,
        manager_user_id: form.manager_user_id || undefined,
      };
      if (isCreate) {
        const created = await createHrEmployee(payload);
        setNotice({ tone: "success", message: "Employee created." });
        navigate(`/app/hr/employees/${created.id}`, { replace: true });
      } else if (employee) {
        await updateHrEmployee(employee.id, payload);
        setNotice({ tone: "success", message: "Employee updated." });
        await reload();
      }
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save employee." });
    } finally {
      setSaving(false);
    }
  };

  const onRunAction = async (action: "activate" | "suspend" | "exit") => {
    if (!employee) return;
    try {
      setSaving(true);
      await runHrEmployeeAction(employee.id, { action });
      setNotice({ tone: "success", message: `Employee ${action} action applied.` });
      await reload();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to apply action." });
    } finally {
      setSaving(false);
    }
  };

  const onAddOrganization = async () => {
    if (!employee || !organizationToAdd) return;
    try {
      setSaving(true);
      await addEmployeeOrganization(employee.id, { organization_id: organizationToAdd });
      setOrganizationToAdd("");
      await reload();
      setNotice({ tone: "success", message: "Organization assigned." });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to assign organization." });
    } finally {
      setSaving(false);
    }
  };

  const onRemoveOrganization = async (organizationId: string) => {
    if (!employee) return;
    try {
      setSaving(true);
      await removeEmployeeOrganization(employee.id, organizationId);
      await reload();
      setNotice({ tone: "success", message: "Organization removed." });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to remove organization." });
    } finally {
      setSaving(false);
    }
  };

  const onAddTeam = async () => {
    if (!employee || !teamToAdd) return;
    try {
      setSaving(true);
      await addEmployeeTeam(employee.id, { team_id: teamToAdd, role: teamRoleToAdd });
      setTeamToAdd("");
      await reload();
      setNotice({ tone: "success", message: "Team assigned." });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to assign team." });
    } finally {
      setSaving(false);
    }
  };

  const onRemoveTeam = async (teamId: string) => {
    if (!employee) return;
    try {
      setSaving(true);
      await removeEmployeeTeam(employee.id, teamId);
      await reload();
      setNotice({ tone: "success", message: "Team removed." });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to remove team." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">{isCreate ? "Create Employee" : "Employee"}</h2>
        <Button variant="outline-secondary" onClick={() => navigate("/app/hr/employees")}>Back to Employees</Button>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="mt-5 intro-y box p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div><FormLabel>First Name</FormLabel><FormInput value={form.first_name || ""} onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))} /></div>
          <div><FormLabel>Last Name</FormLabel><FormInput value={form.last_name || ""} onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))} /></div>
          <div><FormLabel>Username</FormLabel><FormInput value={form.username || ""} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} /></div>
          <div><FormLabel>Email</FormLabel><FormInput value={form.email || ""} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} /></div>
          <div><FormLabel>Phone</FormLabel><FormInput value={form.phone || ""} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} /></div>
          <div><FormLabel>Employee Code</FormLabel><FormInput value={form.employee_code || ""} onChange={(e) => setForm((p) => ({ ...p, employee_code: e.target.value }))} /></div>
          <div><FormLabel>Job Title</FormLabel><FormInput value={form.job_title || ""} onChange={(e) => setForm((p) => ({ ...p, job_title: e.target.value }))} /></div>
          <div>
            <FormLabel>Manager</FormLabel>
            <FormSelect value={form.manager_user_id || ""} onChange={(e) => setForm((p) => ({ ...p, manager_user_id: e.target.value }))}>
              <option value="">No manager</option>
              {managerOptions.map((option) => (<option key={option.value} value={option.value}>{option.label} ({option.email})</option>))}
            </FormSelect>
          </div>
          <div>
            <FormLabel>Employment Status</FormLabel>
            <FormSelect value={form.employment_status || "draft"} onChange={(e) => setForm((p) => ({ ...p, employment_status: e.target.value }))}>
              <option value="draft">Draft</option><option value="active">Active</option><option value="suspended">Suspended</option><option value="exited">Exited</option>
            </FormSelect>
          </div>
          <div>
            <FormLabel>Employment Type</FormLabel>
            <FormSelect value={form.employment_type || "full_time"} onChange={(e) => setForm((p) => ({ ...p, employment_type: e.target.value }))}>
              <option value="full_time">Full Time</option><option value="contract">Contract</option><option value="intern">Intern</option><option value="consultant">Consultant</option>
            </FormSelect>
          </div>
        </div>

        <div className="mt-4"><FormLabel>Job Description</FormLabel><FormTextarea rows={4} value={form.job_description || ""} onChange={(e) => setForm((p) => ({ ...p, job_description: e.target.value }))} /></div>

        <div className="flex flex-wrap gap-2 mt-6">
          <Button variant="primary" disabled={saving || loading} onClick={onSave}>{saving ? "Saving..." : isCreate ? "Create Employee" : "Save Changes"}</Button>
          {!isCreate && employee ? (
            <>
              <Button variant="outline-primary" disabled={saving} onClick={() => onRunAction("activate")}>Activate</Button>
              <Button variant="outline-warning" disabled={saving} onClick={() => onRunAction("suspend")}>Suspend</Button>
              <Button variant="outline-danger" disabled={saving} onClick={() => onRunAction("exit")}>Exit</Button>
            </>
          ) : null}
        </div>
      </div>

      {!isCreate && employee ? (
        <div className="grid grid-cols-1 gap-4 mt-5 md:grid-cols-2">
          <div className="intro-y box p-5">
            <h4 className="font-medium">Organizations</h4>
            <div className="flex gap-2 mt-3">
              <FormSelect value={organizationToAdd} onChange={(e) => setOrganizationToAdd(e.target.value)}>
                <option value="">Add organization</option>
                {organizations.map((org) => (<option key={org.id} value={org.id}>{org.name}</option>))}
              </FormSelect>
              <Button variant="outline-primary" disabled={saving} onClick={onAddOrganization}>Add</Button>
            </div>
            <div className="mt-3 space-y-2">
              {(employee.organizations || []).map((entry: any) => (
                <div key={entry.id} className="flex items-center justify-between p-2 border rounded">
                  <div><div className="font-medium">{entry.name}</div><div className="text-xs text-slate-500">{entry.code}</div></div>
                  <Button size="sm" variant="outline-danger" disabled={saving} onClick={() => onRemoveOrganization(entry.id)}>Remove</Button>
                </div>
              ))}
            </div>
          </div>

          <div className="intro-y box p-5">
            <h4 className="font-medium">Teams / Departments</h4>
            <div className="grid grid-cols-1 gap-2 mt-3">
              <FormSelect value={teamToAdd} onChange={(e) => setTeamToAdd(e.target.value)}>
                <option value="">Select team</option>
                {teams.map((team) => (<option key={team.id} value={team.id}>{team.name}</option>))}
              </FormSelect>
              <FormSelect value={teamRoleToAdd} onChange={(e) => setTeamRoleToAdd(e.target.value as "member" | "lead" | "manager")}> 
                <option value="member">Member</option><option value="lead">Lead</option><option value="manager">Manager</option>
              </FormSelect>
              <Button variant="outline-primary" disabled={saving} onClick={onAddTeam}>Add Team</Button>
            </div>
            <div className="mt-3 space-y-2">
              {(employee.teams || []).map((entry: any) => (
                <div key={entry.id} className="flex items-center justify-between p-2 border rounded">
                  <div><div className="font-medium">{entry.name}</div><div className="text-xs text-slate-500">{entry.type} • {entry.role}</div></div>
                  <Button size="sm" variant="outline-danger" disabled={saving} onClick={() => onRemoveTeam(entry.id)}>Remove</Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default HrEmployeeEditorPage;
