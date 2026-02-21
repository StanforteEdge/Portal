import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import Table from "@/components/Base/Table";
import { FormInput, FormLabel, FormSelect } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { getAttendanceRecords, getAttendanceSummary, listHrEmployees, type HrEmployee } from "@/services/hr";
import { formatDisplayDate } from "@/utils/formatting";

type AttendanceRecord = {
  id: string;
  user_id: string;
  work_date: string;
  status: string;
  scheduled_minutes: number;
  worked_minutes: number;
  late_minutes: number;
  overtime_minutes: number;
  first_in_at: string | null;
  last_out_at: string | null;
  computed_at: string;
  profile: {
    id: string;
    email: string | null;
    username: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null;
};

function HrAttendancePage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<HrEmployee[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [from, setFrom] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState("");
  const [userId, setUserId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const [recordsData, summaryData, employeeRes] = await Promise.all([
        getAttendanceRecords({
          from: from || undefined,
          to: to || undefined,
          status: status || undefined,
          user_id: userId || undefined,
          search: search || undefined,
        }),
        getAttendanceSummary({
          from: from || undefined,
          to: to || undefined,
        }),
        listHrEmployees({ page: 1, per_page: 200 }),
      ]);
      setRecords((recordsData.data || []) as AttendanceRecord[]);
      setSummary(summaryData.by_status || {});
      setEmployees(employeeRes.data || []);
    } catch (error: any) {
      setNotice({
        tone: "error",
        message: error?.response?.data?.error?.message || "Unable to load attendance monitoring data.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const statsCards = useMemo(
    () => [
      { label: "Present", value: summary.present ?? 0, icon: "CheckCircle2", color: "text-success" },
      { label: "Late", value: summary.late ?? 0, icon: "Clock3", color: "text-warning" },
      { label: "Absent", value: summary.absent ?? 0, icon: "UserX", color: "text-danger" },
      { label: "Total Days", value: Object.values(summary).reduce((a, b) => a + Number(b || 0), 0), icon: "BarChart2", color: "text-primary" },
    ],
    [summary]
  );

  const getEmployeeName = (row: AttendanceRecord) => {
    if (!row.profile) return row.user_id;
    const fullName = `${row.profile.first_name ?? ""} ${row.profile.last_name ?? ""}`.trim();
    return fullName || row.profile.username || row.profile.email || row.user_id;
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Attendance Monitoring</h2>
        <div className="flex gap-2">
          <Button variant="outline-primary" onClick={() => navigate("/app/hr/settings?tab=attendance")}>
            <Lucide icon="Settings" className="w-4 h-4 mr-1" /> Policy Settings
          </Button>
          <Button variant="outline-secondary" onClick={() => void load()} disabled={loading}>
            <Lucide icon="Undo2" className="w-4 h-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="grid grid-cols-12 gap-6 mt-5">
        {statsCards.map((card) => (
          <div key={card.label} className="col-span-12 xs:col-span-6 md:col-span-3 intro-y">
            <div
              className={clsx([
                "relative zoom-in",
                "before:box before:absolute before:inset-x-3 before:mt-3 before:h-full before:bg-slate-50 before:content-['']",
              ])}
            >
              <div className="p-5 box">
                <div className="flex">
                  <Lucide icon={card.icon as any} className={clsx("w-[28px] h-[28px]", card.color)} />
                </div>
                <div className="mt-6 text-3xl font-medium leading-8">{card.value}</div>
                <div className="mt-1 text-base text-slate-500">{card.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="box p-5 mt-5">
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-2">
            <FormLabel>From</FormLabel>
            <FormInput type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="col-span-12 md:col-span-2">
            <FormLabel>To</FormLabel>
            <FormInput type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="col-span-12 md:col-span-2">
            <FormLabel>Status</FormLabel>
            <FormSelect value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
            </FormSelect>
          </div>
          <div className="col-span-12 md:col-span-3">
            <FormLabel>Employee</FormLabel>
            <FormSelect value={userId} onChange={(e) => setUserId(e.target.value)}>
              <option value="">All employees</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {`${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim() || employee.email}
                </option>
              ))}
            </FormSelect>
          </div>
          <div className="col-span-12 md:col-span-3">
            <FormLabel>Search</FormLabel>
            <FormInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, username, email" />
          </div>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="primary" onClick={() => void load()} disabled={loading}>
            <Lucide icon="Search" className="w-4 h-4 mr-1" />
            Apply Filters
          </Button>
        </div>
      </div>

      <div className="box p-5 mt-5 overflow-x-auto">
        <div className="font-medium mb-3">Daily Attendance Records</div>
        <Table className="table-report" striped hover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Date</Table.Th>
              <Table.Th>Employee</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>First In</Table.Th>
              <Table.Th>Last Out</Table.Th>
              <Table.Th>Worked (mins)</Table.Th>
              <Table.Th>Late (mins)</Table.Th>
              <Table.Th>Overtime (mins)</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {records.map((row) => (
              <Table.Tr key={row.id}>
                <Table.Td>{formatDisplayDate(row.work_date)}</Table.Td>
                <Table.Td>{getEmployeeName(row)}</Table.Td>
                <Table.Td className="capitalize">{row.status}</Table.Td>
                <Table.Td>{row.first_in_at ? formatDisplayDate(row.first_in_at) : "-"}</Table.Td>
                <Table.Td>{row.last_out_at ? formatDisplayDate(row.last_out_at) : "-"}</Table.Td>
                <Table.Td>{row.worked_minutes}</Table.Td>
                <Table.Td>{row.late_minutes}</Table.Td>
                <Table.Td>{row.overtime_minutes}</Table.Td>
              </Table.Tr>
            ))}
            {!loading && records.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={8} className="text-center text-slate-500 py-8">No attendance records found.</Table.Td>
              </Table.Tr>
            ) : null}
          </Table.Tbody>
        </Table>
      </div>
    </>
  );
}

export default HrAttendancePage;
