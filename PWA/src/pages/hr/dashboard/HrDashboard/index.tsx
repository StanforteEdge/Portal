import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Lucide from "@/components/Base/Lucide";
import Table from "@/components/Base/Table";
import { getHrSummary, listHrEmployees, type HrEmployee } from "@/services/hr";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";

function HrDashboardPage() {
  const [summary, setSummary] = useState({ total: 0, active: 0, inactive: 0, onboarding_pending: 0 });
  const [employees, setEmployees] = useState<HrEmployee[]>([]);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [summaryData, listData] = await Promise.all([
          getHrSummary(),
          listHrEmployees({ page: 1, per_page: 200 }),
        ]);
        setSummary(summaryData);
        setEmployees(listData.data);
      } catch (error: any) {
        setNotice({
          tone: "error",
          message: error?.response?.data?.error?.message || "Unable to load HR dashboard.",
        });
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const onboardingQueue = useMemo(
    () =>
      employees.filter((item) =>
        ["invited", "accepted", "profile_pending", "forms_pending", "hr_review"].includes(
          item.onboarding_progress?.status || ""
        )
      ),
    [employees]
  );

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">HR Dashboard</h2>
        <div className="flex gap-2">
          <Link to="/app/hr/employees" className="btn btn-primary">Manage Employees</Link>
          <Link to="/app/hr/onboarding" className="btn btn-outline-secondary">Onboarding Rules</Link>
        </div>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="grid grid-cols-12 gap-4 mt-5">
        <div className="col-span-12 sm:col-span-6 xl:col-span-3 intro-y"><div className="relative zoom-in"><div className="p-5 box"><div className="flex"><Lucide icon="Users" className="w-[28px] h-[28px] text-primary" /></div><div className="mt-6 text-3xl font-medium leading-8">{summary.total}</div><div className="mt-1 text-base text-slate-500">Total Employees</div></div></div></div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3 intro-y"><div className="relative zoom-in"><div className="p-5 box"><div className="flex"><Lucide icon="UserCheck" className="w-[28px] h-[28px] text-success" /></div><div className="mt-6 text-3xl font-medium leading-8">{summary.active}</div><div className="mt-1 text-base text-slate-500">Active</div></div></div></div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3 intro-y"><div className="relative zoom-in"><div className="p-5 box"><div className="flex"><Lucide icon="UserX" className="w-[28px] h-[28px] text-danger" /></div><div className="mt-6 text-3xl font-medium leading-8">{summary.inactive}</div><div className="mt-1 text-base text-slate-500">Inactive</div></div></div></div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3 intro-y"><div className="relative zoom-in"><div className="p-5 box"><div className="flex"><Lucide icon="ClipboardList" className="w-[28px] h-[28px] text-warning" /></div><div className="mt-6 text-3xl font-medium leading-8">{summary.onboarding_pending}</div><div className="mt-1 text-base text-slate-500">Onboarding Pending</div></div></div></div>
      </div>

      <div className="mt-5 intro-y box">
        <div className="flex items-center p-5 border-b border-slate-200/60">
          <h2 className="mr-auto text-base font-medium">Onboarding Queue</h2>
        </div>
        <div className="p-5 overflow-auto">
          <Table className="table-report w-full" striped hover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Staff</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Onboarding Status</Table.Th>
                <Table.Th>Employment</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {onboardingQueue.map((item) => (
                <Table.Tr key={item.id}>
                  <Table.Td>{`${item.first_name || ""} ${item.last_name || ""}`.trim() || item.username}</Table.Td>
                  <Table.Td>{item.email}</Table.Td>
                  <Table.Td>{item.onboarding_progress?.status || "-"}</Table.Td>
                  <Table.Td>{item.employee_profile?.employment_status || item.employee_profile?.employmentStatus || "-"}</Table.Td>
                </Table.Tr>
              ))}
              {!loading && onboardingQueue.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={4} className="text-center text-slate-500">No pending onboarding records.</Table.Td>
                </Table.Tr>
              ) : null}
            </Table.Tbody>
          </Table>
        </div>
      </div>
    </>
  );
}

export default HrDashboardPage;
