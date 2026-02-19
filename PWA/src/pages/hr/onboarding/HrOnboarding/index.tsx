import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/Base/Button";
import Table from "@/components/Base/Table";
import { FormSelect } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import {
  deleteHrOnboardingFormAssignment,
  listHrEmployees,
  listHrOnboardingFormAssignments,
  type HrEmployee,
  type HrFormAssignment,
} from "@/services/hr";

function HrOnboardingPage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<HrEmployee[]>([]);
  const [assignments, setAssignments] = useState<HrFormAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [filterProfileId, setFilterProfileId] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const [employeesData, assignmentsData] = await Promise.all([
        listHrEmployees({ page: 1, per_page: 200 }),
        listHrOnboardingFormAssignments(filterProfileId ? { profile_id: filterProfileId } : undefined),
      ]);
      setEmployees(employeesData.data);
      setAssignments(assignmentsData);
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
      })),
    [employees]
  );

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

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">HR Onboarding</h2>
        <Button variant="primary" onClick={() => navigate("/app/hr/onboarding/new")}>
          New Assignment
        </Button>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="box p-5 mt-5">
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
                <Table.Th>Form</Table.Th>
                <Table.Th>Target</Table.Th>
                <Table.Th>Due</Table.Th>
                <Table.Th>Created</Table.Th>
                <Table.Th>Action</Table.Th>
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
                  <Table.Td>{assignment.created_at ? assignment.created_at.slice(0, 10) : "-"}</Table.Td>
                  <Table.Td>
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      className="mr-2"
                      disabled={saving}
                      onClick={() => navigate(`/app/hr/onboarding/${assignment.id}`)}
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
                  <Table.Td colSpan={5} className="text-center text-slate-500">
                    No assignments yet.
                  </Table.Td>
                </Table.Tr>
              ) : null}
            </Table.Tbody>
          </Table>
        </div>
      </div>
    </>
  );
}

export default HrOnboardingPage;
