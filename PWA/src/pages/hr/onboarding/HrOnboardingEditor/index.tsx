import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/Base/Button";
import { FormInput, FormLabel, FormSelect } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import {
  assignHrOnboardingForm,
  listHrEmployees,
  listHrOnboardingFormAssignments,
  updateHrOnboardingFormAssignment,
  type HrEmployee,
} from "@/services/hr";
import { listForms, type FormRecord } from "@/services/forms";

function HrOnboardingEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [employees, setEmployees] = useState<HrEmployee[]>([]);
  const [forms, setForms] = useState<FormRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  const [formId, setFormId] = useState("");
  const [profileId, setProfileId] = useState("");
  const [roleSlug, setRoleSlug] = useState("staff");
  const [target, setTarget] = useState<"profile" | "role">("profile");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        const [formsData, employeesData] = await Promise.all([
          listForms(),
          listHrEmployees({ page: 1, per_page: 200 }),
        ]);
        setForms(formsData);
        setEmployees(employeesData.data);
        if (!formId && formsData.length > 0) setFormId(formsData[0].id);

        if (id) {
          const allAssignments = await listHrOnboardingFormAssignments();
          const assignment = allAssignments.find((row) => row.id === id);
          if (!assignment) {
            setNotice({ tone: "error", message: "Assignment not found." });
          } else {
            setFormId(assignment.form_id);
            if (assignment.assigned_to_profile_id) {
              setTarget("profile");
              setProfileId(assignment.assigned_to_profile_id);
            } else {
              setTarget("role");
              setRoleSlug(assignment.assigned_to_role || "staff");
            }
            setDueDate(assignment.due_date ? assignment.due_date.slice(0, 10) : "");
          }
        }
      } catch (error: any) {
        setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load editor." });
      } finally {
        setLoading(false);
      }
    };
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const employeeOptions = useMemo(
    () =>
      employees.map((employee) => ({
        value: employee.id,
        label: `${employee.first_name || ""} ${employee.last_name || ""}`.trim() || employee.username,
        email: employee.email,
      })),
    [employees]
  );

  const onSave = async () => {
    if (!formId) return setNotice({ tone: "error", message: "Select a form." });
    if (target === "profile" && !profileId) {
      return setNotice({ tone: "error", message: "Select an employee for profile assignment." });
    }
    try {
      setSaving(true);
      if (isEdit && id) {
        await updateHrOnboardingFormAssignment(id, {
          form_id: formId,
          profile_id: target === "profile" ? profileId : undefined,
          role_slug: target === "role" ? roleSlug : undefined,
          due_date: dueDate || "",
        });
      } else {
        await assignHrOnboardingForm({
          form_id: formId,
          profile_id: target === "profile" ? profileId : undefined,
          role_slug: target === "role" ? roleSlug : undefined,
          due_date: dueDate || undefined,
        });
      }
      navigate("/app/hr/onboarding", { replace: true });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save assignment." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">{isEdit ? "Edit Assignment" : "Assign Onboarding Form"}</h2>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="box p-5 mt-5 space-y-3">
        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 rounded bg-slate-200"></div>
            <div className="h-4 rounded bg-slate-100"></div>
          </div>
        ) : (
          <>
            <div>
              <FormLabel>Form</FormLabel>
              <FormSelect value={formId} onChange={(e) => setFormId(e.target.value)}>
                <option value="">Select Form</option>
                {forms.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.module})
                  </option>
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
                    <option key={item.value} value={item.value}>
                      {item.label} ({item.email})
                    </option>
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

            <div className="flex gap-2">
              <Button variant="primary" disabled={saving} onClick={() => void onSave()}>
                {saving ? "Saving..." : isEdit ? "Update Assignment" : "Assign Form"}
              </Button>
              <Button variant="outline-secondary" onClick={() => navigate("/app/hr/onboarding")}>
                Cancel
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default HrOnboardingEditorPage;
