import { useEffect, useMemo, useState } from "react";
import Button from "@/components/Base/Button";
import Table from "@/components/Base/Table";
import { FormInput, FormLabel, FormSelect } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import {
  assignHrOnboardingForm,
  deleteHrOnboardingFormAssignment,
  listHrEmployees,
  listHrOnboardingFormAssignments,
  updateHrOnboardingFormAssignment,
  type HrEmployee,
  type HrFormAssignment,
} from "@/services/hr";
import { listForms, type FormRecord } from "@/services/forms";

function HrOnboardingPage() {
  const [employees, setEmployees] = useState<HrEmployee[]>([]);
  const [forms, setForms] = useState<FormRecord[]>([]);
  const [assignments, setAssignments] = useState<HrFormAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  const [formId, setFormId] = useState("");
  const [profileId, setProfileId] = useState("");
  const [roleSlug, setRoleSlug] = useState("staff");
  const [target, setTarget] = useState<"profile" | "role">("profile");
  const [dueDate, setDueDate] = useState("");
  const [filterProfileId, setFilterProfileId] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const [formsData, employeesData, assignmentsData] = await Promise.all([
        listForms(),
        listHrEmployees({ page: 1, per_page: 200 }),
        listHrOnboardingFormAssignments(filterProfileId ? { profile_id: filterProfileId } : undefined),
      ]);
      setForms(formsData);
      setEmployees(employeesData.data);
      setAssignments(assignmentsData);
      if (!formId && formsData.length > 0) setFormId(formsData[0].id);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load onboarding rules." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [filterProfileId]);

  const employeeOptions = useMemo(
    () =>
      employees.map((employee) => ({
        value: employee.id,
        label: `${employee.first_name || ""} ${employee.last_name || ""}`.trim() || employee.username,
        email: employee.email,
      })),
    [employees]
  );

  const onAssign = async () => {
    if (!formId) return setNotice({ tone: "error", message: "Select a form." });
    if (target === "profile" && !profileId) {
      return setNotice({ tone: "error", message: "Select an employee for profile assignment." });
    }

    try {
      setSaving(true);
      if (editingAssignmentId) {
        await updateHrOnboardingFormAssignment(editingAssignmentId, {
          form_id: formId,
          profile_id: target === "profile" ? profileId : undefined,
          role_slug: target === "role" ? roleSlug : undefined,
          due_date: dueDate || "",
        });
        setNotice({ tone: "success", message: "Onboarding assignment updated." });
      } else {
        await assignHrOnboardingForm({
          form_id: formId,
          profile_id: target === "profile" ? profileId : undefined,
          role_slug: target === "role" ? roleSlug : undefined,
          due_date: dueDate || undefined,
        });
        setNotice({ tone: "success", message: "Onboarding form assigned." });
      }
      await load();
      setPanelOpen(false);
      setEditingAssignmentId(null);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to assign form." });
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (assignment: HrFormAssignment) => {
    setEditingAssignmentId(assignment.id);
    setPanelOpen(true);
    setFormId(assignment.form_id);
    if (assignment.assigned_to_profile_id) {
      setTarget("profile");
      setProfileId(assignment.assigned_to_profile_id);
      setRoleSlug("staff");
    } else {
      setTarget("role");
      setRoleSlug(assignment.assigned_to_role || "staff");
      setProfileId("");
    }
    setDueDate(assignment.due_date ? assignment.due_date.slice(0, 10) : "");
  };

  const onDelete = async (id: string) => {
    try {
      setSaving(true);
      await deleteHrOnboardingFormAssignment(id);
      setNotice({ tone: "success", message: "Assignment removed." });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to remove assignment." });
    } finally {
      setSaving(false);
    }
  };

  const columns = panelOpen ? ["Form", "Target", "Due", "Action"] : ["Form", "Target", "Due", "Created", "Action"];

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">HR Onboarding</h2>
        <Button
          variant="primary"
          onClick={() => {
            setEditingAssignmentId(null);
            setPanelOpen(true);
            setDueDate("");
            setProfileId("");
            setTarget("profile");
          }}
        >
          New Assignment
        </Button>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className={`grid grid-cols-1 gap-5 mt-5 intro-y ${panelOpen ? "sm:grid-cols-12" : ""}`}>
        <div className={panelOpen ? "sm:col-span-5 box p-5" : "box p-5"}>
          <div className="flex items-center gap-3 mb-4">
            <h3 className="mr-auto text-base font-medium">Current Assignments</h3>
            <FormSelect value={filterProfileId} onChange={(e) => setFilterProfileId(e.target.value)}>
              <option value="">All Staff</option>
              {employeeOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </FormSelect>
          </div>

          <div className="overflow-auto">
            <Table className="table-report w-full" striped hover>
              <Table.Thead>
                <Table.Tr>
                  {columns.map((column) => (
                    <Table.Th key={column}>{column}</Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {assignments.map((assignment) => (
                  <Table.Tr key={assignment.id}>
                    <Table.Td>
                      <div className="font-medium">{assignment.form_name}</div>
                      <div className="text-xs text-slate-500">{assignment.module}</div>
                    </Table.Td>
                    <Table.Td>
                      {assignment.assigned_to_profile_id
                        ? employeeOptions.find((item) => item.value === assignment.assigned_to_profile_id)?.label || assignment.assigned_to_profile_id
                        : `Role: ${assignment.assigned_to_role || "-"}`}
                    </Table.Td>
                    <Table.Td>{assignment.due_date ? assignment.due_date.slice(0, 10) : "-"}</Table.Td>
                    {!panelOpen ? <Table.Td>{assignment.created_at ? assignment.created_at.slice(0, 10) : "-"}</Table.Td> : null}
                    <Table.Td>
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        className="mr-2"
                        disabled={saving}
                        onClick={() => onEdit(assignment)}
                      >
                        Edit
                      </Button>
                      <Button size="sm" variant="outline-danger" disabled={saving} onClick={() => void onDelete(assignment.id)}>
                        Remove
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {!loading && assignments.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={columns.length} className="text-center text-slate-500">
                      No assignments yet.
                    </Table.Td>
                  </Table.Tr>
                ) : null}
              </Table.Tbody>
            </Table>
          </div>
        </div>

        {panelOpen ? (
          <div className="sm:col-span-7 box p-5">
            <div className="flex items-center gap-2">
              <h3 className="mr-auto text-base font-medium">
                {editingAssignmentId ? "Edit Assignment" : "Assign Onboarding Form"}
              </h3>
              <Button
                variant="outline-secondary"
                onClick={() => {
                  setPanelOpen(false);
                  setEditingAssignmentId(null);
                }}
              >
                Close
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <FormLabel>Form</FormLabel>
                <FormSelect value={formId} onChange={(e) => setFormId(e.target.value)}>
                  <option value="">Select Form</option>
                  {forms.map((item) => (
                    <option key={item.id} value={item.id}>{item.name} ({item.module})</option>
                  ))}
                </FormSelect>
              </div>
              <div>
                <FormLabel>Assign To</FormLabel>
                <FormSelect value={target} onChange={(e) => setTarget(e.target.value as "profile" | "role")}>
                  <option value="profile">Specific Staff</option>
                  <option value="role">Role</option>
                </FormSelect>
              </div>

              {target === "profile" ? (
                <div>
                  <FormLabel>Staff</FormLabel>
                  <FormSelect value={profileId} onChange={(e) => setProfileId(e.target.value)}>
                    <option value="">Select Staff</option>
                    {employeeOptions.map((item) => (
                      <option key={item.value} value={item.value}>{item.label} ({item.email})</option>
                    ))}
                  </FormSelect>
                </div>
              ) : (
                <div>
                  <FormLabel>Role</FormLabel>
                  <FormSelect value={roleSlug} onChange={(e) => setRoleSlug(e.target.value)}>
                    <option value="staff">staff</option>
                    <option value="team_lead">team_lead</option>
                    <option value="accountant">accountant</option>
                    <option value="finance_manager">finance_manager</option>
                    <option value="admin">admin</option>
                    <option value="hr">hr</option>
                  </FormSelect>
                </div>
              )}

              <div>
                <FormLabel>Due Date (Optional)</FormLabel>
                <FormInput type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>

              <Button variant="primary" disabled={saving} onClick={onAssign}>
                {saving ? "Saving..." : editingAssignmentId ? "Update Assignment" : "Assign Form"}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}

export default HrOnboardingPage;
