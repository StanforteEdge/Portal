import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import Table from "@/components/Base/Table";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { clockIn, clockOut, getAttendanceSummary, getMyAttendance, type AttendanceDaily, type AttendanceEntry } from "@/services/hr";
import { formatDisplayDate } from "@/utils/formatting";

function HrAttendancePage() {
  const [entries, setEntries] = useState<AttendanceEntry[]>([]);
  const [daily, setDaily] = useState<AttendanceDaily[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [canClockIn, setCanClockIn] = useState(true);
  const [canClockOut, setCanClockOut] = useState(false);
  const [clockReason, setClockReason] = useState<string | null>(null);
  const [policy, setPolicy] = useState<{ start_time: string; end_time: string; grace_minutes: number } | null>(null);
  const [today, setToday] = useState<AttendanceDaily | null>(null);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const [meData, summaryData] = await Promise.all([getMyAttendance(), getAttendanceSummary()]);
      setEntries(meData.entries ?? []);
      setDaily(meData.daily ?? []);
      setIsClockedIn(Boolean(meData.current_state?.is_clocked_in));
      setCanClockIn(meData.current_state?.can_clock_in ?? !meData.current_state?.is_clocked_in);
      setCanClockOut(meData.current_state?.can_clock_out ?? Boolean(meData.current_state?.is_clocked_in));
      setClockReason(meData.current_state?.reason ?? null);
      setPolicy(meData.policy ?? null);
      setToday(meData.today ?? null);
      setSummary(summaryData.by_status ?? {});
    } catch (error: any) {
      setNotice({
        tone: "error",
        message: error?.response?.data?.error?.message || "Unable to load attendance.",
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

  const runClockIn = async () => {
    try {
      setActing(true);
      await clockIn();
      setNotice({ tone: "success", message: "Clock in recorded." });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Clock in failed." });
    } finally {
      setActing(false);
    }
  };

  const runClockOut = async () => {
    try {
      setActing(true);
      await clockOut();
      setNotice({ tone: "success", message: "Clock out recorded." });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Clock out failed." });
    } finally {
      setActing(false);
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Attendance</h2>
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => void runClockIn()} disabled={acting || !canClockIn}>
            <Lucide icon="CheckCheck" className="w-4 h-4 mr-1" /> Clock In
          </Button>
          <Button variant="outline-secondary" onClick={() => void runClockOut()} disabled={acting || !canClockOut}>
            <Lucide icon="ToggleRight" className="w-4 h-4 mr-1" /> Clock Out
          </Button>
          <Button variant="outline-secondary" onClick={() => void load()} disabled={loading}>
            <Lucide icon="Undo2" className="w-4 h-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}
      <div className="mt-4 p-4 box flex flex-wrap items-center gap-4">
        <div className="text-sm text-slate-600">
          Status: <span className={clsx("font-medium", isClockedIn ? "text-success" : "text-slate-800")}>{isClockedIn ? "Clocked In" : "Clocked Out"}</span>
        </div>
        {policy ? (
          <div className="text-sm text-slate-600">
            Schedule: <span className="font-medium text-slate-800">{policy.start_time} - {policy.end_time}</span>
          </div>
        ) : null}
        {today ? (
          <div className="text-sm text-slate-600">
            Today: <span className="font-medium text-slate-800">{today.worked_minutes} mins worked</span>
          </div>
        ) : null}
        {clockReason ? <div className="text-sm text-warning">{clockReason}</div> : null}
      </div>

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

      <div className="grid grid-cols-12 gap-5 mt-5">
        <div className="col-span-12 lg:col-span-7 box p-5 overflow-x-auto">
          <div className="font-medium mb-3">Daily Summary</div>
          <Table className="table-report" striped hover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>First In</Table.Th>
                <Table.Th>Last Out</Table.Th>
                <Table.Th>Worked (mins)</Table.Th>
                <Table.Th>Late (mins)</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {daily.map((row) => (
                <Table.Tr key={row.id}>
                  <Table.Td>{formatDisplayDate(row.work_date)}</Table.Td>
                  <Table.Td className="capitalize">{row.status}</Table.Td>
                  <Table.Td>{row.first_in_at ? formatDisplayDate(row.first_in_at) : "-"}</Table.Td>
                  <Table.Td>{row.last_out_at ? formatDisplayDate(row.last_out_at) : "-"}</Table.Td>
                  <Table.Td>{row.worked_minutes}</Table.Td>
                  <Table.Td>{row.late_minutes}</Table.Td>
                </Table.Tr>
              ))}
              {!loading && daily.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6} className="text-center text-slate-500 py-8">No attendance summary yet.</Table.Td>
                </Table.Tr>
              ) : null}
            </Table.Tbody>
          </Table>
        </div>
        <div className="col-span-12 lg:col-span-5 box p-5 overflow-x-auto">
          <div className="font-medium mb-3">Clock Entries</div>
          <Table className="table-report" striped hover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Time</Table.Th>
                <Table.Th>Source</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {entries.slice(0, 50).map((row) => (
                <Table.Tr key={row.id}>
                  <Table.Td>{formatDisplayDate(row.work_date)}</Table.Td>
                  <Table.Td className="capitalize">{row.entry_type.replaceAll("_", " ")}</Table.Td>
                  <Table.Td>{formatDisplayDate(row.entry_at)}</Table.Td>
                  <Table.Td>{row.source}</Table.Td>
                </Table.Tr>
              ))}
              {!loading && entries.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={4} className="text-center text-slate-500 py-8">No entries yet.</Table.Td>
                </Table.Tr>
              ) : null}
            </Table.Tbody>
          </Table>
        </div>
      </div>
    </>
  );
}

export default HrAttendancePage;
