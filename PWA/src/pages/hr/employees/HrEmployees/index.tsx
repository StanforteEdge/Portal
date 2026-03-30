import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/Base/Button";
import Table from "@/components/Base/Table";
import { FormInput, FormLabel, FormSelect } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { getHrSummary, listHrEmployees, type HrEmployee } from "@/services/hr";

function HrEmployeesPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({ total: 0, active: 0, inactive: 0, onboarding_pending: 0 });
  const [employees, setEmployees] = useState<HrEmployee[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const [summaryData, listData] = await Promise.all([
        getHrSummary(),
        listHrEmployees({ page: 1, per_page: 100, search: search || undefined, status: statusFilter || undefined }),
      ]);
      setSummary(summaryData);
      setEmployees(listData.data);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load employees." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [search, statusFilter]);

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">HR Employees</h2>
        <Button variant="primary" onClick={() => navigate("/app/hr/employees/new")}>Create Employee</Button>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="grid grid-cols-1 gap-4 mt-5 md:grid-cols-4">
        <div className="p-4 intro-y box"><div className="text-xs uppercase text-slate-500">Total</div><div className="mt-1 text-2xl font-semibold">{summary.total}</div></div>
        <div className="p-4 intro-y box"><div className="text-xs uppercase text-slate-500">Active</div><div className="mt-1 text-2xl font-semibold">{summary.active}</div></div>
        <div className="p-4 intro-y box"><div className="text-xs uppercase text-slate-500">Inactive</div><div className="mt-1 text-2xl font-semibold">{summary.inactive}</div></div>
        <div className="p-4 intro-y box"><div className="text-xs uppercase text-slate-500">Onboarding Pending</div><div className="mt-1 text-2xl font-semibold">{summary.onboarding_pending}</div></div>
      </div>

      <div className="mt-5 intro-y box p-5">
        <div className="flex flex-wrap gap-2 mb-4">
          <FormLabel className="sr-only">Search employees</FormLabel>
          <FormInput
            type="text"
            placeholder="Search by name/email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <FormLabel className="sr-only">Filter employee status</FormLabel>
          <FormSelect value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="invited">Invited</option>
            <option value="inactive">Inactive</option>
          </FormSelect>
        </div>

        <div className="overflow-auto max-h-[70vh]">
          <Table className="table-report w-full" striped hover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Role</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Onboarding</Table.Th>
                <Table.Th>Employment</Table.Th>
                <Table.Th className="text-right">Action</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {employees.map((employee) => {
                const fullName = `${employee.first_name || ""} ${employee.last_name || ""}`.trim() || employee.username;
                return (
                  <Table.Tr key={employee.id}>
                    <Table.RowHeader>{fullName}</Table.RowHeader>
                    <Table.Td>{employee.email}</Table.Td>
                    <Table.Td>{employee.roles?.[0]?.name || "-"}</Table.Td>
                    <Table.Td>{employee.status}</Table.Td>
                    <Table.Td>{employee.onboarding_progress?.status || "-"}</Table.Td>
                    <Table.Td>{employee.employee_profile?.employment_status || employee.employee_profile?.employmentStatus || "-"}</Table.Td>
                    <Table.Td className="text-right">
                      <Button size="sm" variant="outline-primary" onClick={() => navigate(`/app/hr/employees/${employee.id}`)}>
                        Open
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
              {!loading && employees.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={7} className="text-center text-slate-500">No employees found.</Table.Td>
                </Table.Tr>
              ) : null}
            </Table.Tbody>
          </Table>
        </div>
      </div>
    </>
  );
}

export default HrEmployeesPage;
