import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import Table from "@/components/Base/Table";
import { FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import {
  clockIn,
  clockOut,
  createAttendanceCorrection,
  getMyAttendance,
  type AttendanceCorrection,
  type AttendanceDaily,
  type AttendanceEntry,
  type AttendanceException,
  type OfficeLocation,
} from "@/services/hr";
import { formatDisplayDate } from "@/utils/formatting";

type AttendanceMode = "onsite" | "remote" | "field";

const defaultCorrectionForm = {
  work_date: new Date().toISOString().slice(0, 10),
  request_type: "clock_in",
  proposed_at: "",
  proposed_mode: "",
  proposed_office_location_id: "",
  reason: "",
};

function StaffAttendancePage() {
  const [entries, setEntries] = useState<AttendanceEntry[]>([]);
  const [daily, setDaily] = useState<AttendanceDaily[]>([]);
  const [corrections, setCorrections] = useState<AttendanceCorrection[]>([]);
  const [exceptions, setExceptions] = useState<AttendanceException[]>([]);
  const [officeLocations, setOfficeLocations] = useState<OfficeLocation[]>([]);
  const [selectedMode, setSelectedMode] = useState<AttendanceMode>("onsite");
  const [selectedOfficeLocationId, setSelectedOfficeLocationId] = useState("");
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [canClockIn, setCanClockIn] = useState(true);
  const [canClockOut, setCanClockOut] = useState(false);
  const [clockReason, setClockReason] = useState<string | null>(null);
  const [policy, setPolicy] = useState<{ start_time: string; end_time: string; grace_minutes: number; onsite_weekdays?: number[]; remote_weekdays?: number[] } | null>(null);
  const [today, setToday] = useState<AttendanceDaily | null>(null);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(false);
  const [submittingCorrection, setSubmittingCorrection] = useState(false);
  const [correctionForm, setCorrectionForm] = useState(defaultCorrectionForm);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const meData = await getMyAttendance();
      setEntries(meData.entries ?? []);
      setDaily(meData.daily ?? []);
      setCorrections(meData.corrections ?? []);
      setExceptions(meData.exceptions ?? []);
      setOfficeLocations(meData.office_locations ?? []);
      setIsClockedIn(Boolean(meData.current_state?.is_clocked_in));
      setCanClockIn(meData.current_state?.can_clock_in ?? !meData.current_state?.is_clocked_in);
      setCanClockOut(meData.current_state?.can_clock_out ?? Boolean(meData.current_state?.is_clocked_in));
      setClockReason(meData.current_state?.reason ?? null);
      setPolicy(meData.policy ?? null);
      setToday(meData.today ?? null);
      const inferredMode = (meData.today?.expected_mode || meData.today?.attendance_mode || "onsite") as AttendanceMode;
      setSelectedMode(inferredMode);
      setSelectedOfficeLocationId(meData.today?.office_location_id || meData.office_locations?.[0]?.id || "");
      if (meData.today?.geofence_status === "outside") {
        setNotice({ tone: "warning", message: "You appear to be outside the office premises for today's onsite attendance." });
      }
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

  const statsCards = useMemo(() => {
    const statusCount = daily.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = (acc[row.status] || 0) + 1;
      return acc;
    }, {});
    return [
      { label: "Present", value: statusCount.present ?? 0, icon: "CheckCircle2", color: "text-success" },
      { label: "Remote", value: statusCount.remote ?? 0, icon: "Home", color: "text-primary" },
      { label: "Late", value: statusCount.late ?? 0, icon: "Clock3", color: "text-warning" },
      { label: "Absent", value: statusCount.absent ?? 0, icon: "UserX", color: "text-danger" },
    ];
  }, [daily]);

  const todayModeLabel = (today?.attendance_mode || today?.expected_mode || selectedMode || "onsite").replaceAll("_", " ");
  const todayStatusLabel = today?.status ? today.status.replaceAll("_", " ") : isClockedIn ? "present" : "not started";
  const recentDaily = daily.slice(0, 14);
  const recentEntries = entries.slice(0, 12);
  const recentTimeline = useMemo(
    () =>
      entries
        .slice(0, 6)
        .map((row) => ({
          id: row.id,
          title: row.entry_type.replaceAll("_", " "),
          subtitle: row.attendance_mode ? row.attendance_mode.replaceAll("_", " ") : row.source,
          timestamp: row.entry_at,
          icon: row.entry_type === "clock_out" ? "LogOut" : "LogIn",
        })),
    [entries]
  );
  const trendBars = useMemo(() => {
    const bars = recentDaily.slice(0, 10).reverse();
    const maxWorked = Math.max(...bars.map((row) => row.worked_minutes || 0), 1);
    return bars.map((row) => ({
      id: row.id,
      label: formatDisplayDate(row.work_date),
      status: row.status,
      heightPercent: Math.max(12, Math.round(((row.worked_minutes || 0) / maxWorked) * 100)),
    }));
  }, [recentDaily]);

  const statusAccentClass = (status?: string | null) => {
    switch (status) {
      case "present":
        return "bg-success/10 text-success";
      case "remote":
        return "bg-primary/10 text-primary";
      case "field":
        return "bg-pending/15 text-pending";
      case "late":
        return "bg-warning/15 text-warning";
      case "absent":
        return "bg-danger/10 text-danger";
      case "leave":
      case "holiday":
      case "off_day":
        return "bg-slate-100 text-slate-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getCoords = async () => {
    if (!("geolocation" in navigator)) return {};
    return new Promise<{ latitude?: number; longitude?: number }>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
        () => resolve({}),
        { enableHighAccuracy: true, timeout: 7000, maximumAge: 60000 }
      );
    });
  };

  const runClockAction = async (type: "in" | "out") => {
    try {
      setActing(true);
      const coords = await getCoords();
      const payload = {
        attendance_mode: selectedMode,
        office_location_id: selectedMode === "onsite" ? selectedOfficeLocationId || undefined : undefined,
        ...coords,
      };
      if (type === "in") {
        await clockIn(payload);
        setNotice({ tone: "success", message: "Clock in recorded." });
      } else {
        await clockOut(payload);
        setNotice({ tone: "success", message: "Clock out recorded." });
      }
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || `Clock ${type} failed.` });
    } finally {
      setActing(false);
    }
  };

  const submitCorrection = async () => {
    if (!correctionForm.work_date || !correctionForm.reason.trim()) {
      setNotice({ tone: "warning", message: "Correction date and reason are required." });
      return;
    }
    try {
      setSubmittingCorrection(true);
      const proposedAt = correctionForm.proposed_at ? new Date(`${correctionForm.work_date}T${correctionForm.proposed_at}:00`).toISOString() : undefined;
      await createAttendanceCorrection({
        work_date: correctionForm.work_date,
        request_type: correctionForm.request_type,
        reason: correctionForm.reason.trim(),
        proposed_at: proposedAt,
        proposed_mode: correctionForm.proposed_mode || undefined,
        proposed_office_location_id: correctionForm.proposed_office_location_id || undefined,
      });
      setNotice({ tone: "success", message: "Attendance correction submitted for review." });
      setCorrectionForm(defaultCorrectionForm);
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to submit correction." });
    } finally {
      setSubmittingCorrection(false);
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">My Attendance</h2>
        <div className="flex gap-2">
          <Button variant="outline-secondary" onClick={() => void load()} disabled={loading}>
            <Lucide icon="Undo2" className="w-4 h-4 mr-1" /> {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <section className="grid grid-cols-12 gap-5 mt-5" aria-labelledby="attendance-today-heading">
        <div className="col-span-12 xl:col-span-5 box p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <Lucide icon="CalendarDays" className="w-5 h-5" />
            </div>
            <div>
              <h3 id="attendance-today-heading" className="text-base font-medium">Today</h3>
              <p className="mt-1 text-sm text-slate-500">Your current attendance state, expected work mode, and today’s geofence result.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-slate-200/80 px-4 py-3">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">Clock status</div>
                <div className={clsx("mt-1 font-medium", isClockedIn ? "text-success" : "text-slate-800")}>
                  {isClockedIn ? "Clocked In" : "Clocked Out"}
                </div>
              </div>
              <Lucide icon={isClockedIn ? "CheckCircle2" : "Circle"} className={clsx("w-5 h-5", isClockedIn ? "text-success" : "text-slate-400")} />
            </div>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-12 md:col-span-6 rounded-lg border border-slate-200/80 px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-slate-500">Attendance status</div>
                <div className="mt-1 font-medium capitalize text-slate-800">{todayStatusLabel}</div>
              </div>
              <div className="col-span-12 md:col-span-6 rounded-lg border border-slate-200/80 px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-slate-500">Mode</div>
                <div className="mt-1 font-medium capitalize text-slate-800">{todayModeLabel}</div>
              </div>
              <div className="col-span-12 md:col-span-6 rounded-lg border border-slate-200/80 px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-slate-500">Schedule</div>
                <div className="mt-1 font-medium text-slate-800">{policy ? `${policy.start_time} - ${policy.end_time}` : "Not set"}</div>
              </div>
              <div className="col-span-12 md:col-span-6 rounded-lg border border-slate-200/80 px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-slate-500">Geofence</div>
                <div className="mt-1 font-medium capitalize text-slate-800">{today?.geofence_status ? today.geofence_status.replaceAll("_", " ") : "Not checked yet"}</div>
              </div>
            </div>
            {clockReason ? (
              <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
                {clockReason}
              </div>
            ) : null}
          </div>
        </div>

        <div className="col-span-12 xl:col-span-7 box p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-success/10 p-2 text-success">
              <Lucide icon="CheckCheck" className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-medium">Clock Actions</h3>
              <p className="mt-1 text-sm text-slate-500">Choose how you are working today, then clock in or out. Onsite attendance can validate against an office location.</p>
            </div>
          </div>
          <div className="grid grid-cols-12 gap-4 mt-5">
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Attendance Mode</FormLabel>
              <FormSelect value={selectedMode} onChange={(e) => setSelectedMode(e.target.value as AttendanceMode)}>
                <option value="onsite">Onsite</option>
                <option value="remote">Remote</option>
                <option value="field">Field</option>
              </FormSelect>
            </div>
            <div className="col-span-12 md:col-span-8">
              <FormLabel>Office Location</FormLabel>
              <FormSelect value={selectedOfficeLocationId} onChange={(e) => setSelectedOfficeLocationId(e.target.value)} disabled={selectedMode !== "onsite"}>
                <option value="">Select office location</option>
                {officeLocations.map((location) => (
                  <option key={location.id} value={location.id}>{location.name}</option>
                ))}
              </FormSelect>
              <div className="text-xs text-slate-500 mt-1">
                Remote and field days do not require an office location. Onsite days use the selected location for radius checks.
              </div>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => void runClockAction("in")} disabled={acting || !canClockIn}>
              <Lucide icon="CheckCheck" className="w-4 h-4 mr-1" /> {acting && canClockIn ? "Clocking In..." : "Clock In"}
            </Button>
            <Button variant="outline-secondary" onClick={() => void runClockAction("out")} disabled={acting || !canClockOut}>
              <Lucide icon="ToggleRight" className="w-4 h-4 mr-1" /> {acting && canClockOut ? "Clocking Out..." : "Clock Out"}
            </Button>
          </div>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="attendance-insights-heading">
        <div className="mb-3">
          <h3 id="attendance-insights-heading" className="text-base font-medium">Attendance Insights</h3>
          <p className="text-sm text-slate-500">Your attendance health, recent pattern, and latest activity at a glance.</p>
        </div>
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 xl:col-span-7">
            <div className="grid grid-cols-12 gap-6">
              {statsCards.map((card) => (
                <div key={card.label} className="col-span-12 xs:col-span-6 md:col-span-3 intro-y">
                  <div className={clsx(["relative zoom-in", "before:box before:absolute before:inset-x-3 before:mt-3 before:h-full before:bg-slate-50 before:content-['']"])}>
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
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">Attendance Trend</div>
                  <div className="text-sm text-slate-500 mt-1">Recent worked-time pattern across your last attendance days.</div>
                </div>
                <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  Last {trendBars.length} days
                </div>
              </div>
              <div className="mt-6">
                <div className="flex h-52 items-end gap-2 rounded-xl bg-slate-50/70 px-4 py-4">
                  {trendBars.map((bar) => (
                    <div key={bar.id} className="flex h-full flex-1 flex-col justify-end">
                      <div
                        className={clsx(
                          "rounded-t-md transition-all",
                          bar.status === "present" && "bg-success/80",
                          bar.status === "remote" && "bg-primary/80",
                          bar.status === "field" && "bg-pending/80",
                          bar.status === "late" && "bg-warning/80",
                          bar.status === "absent" && "bg-danger/75",
                          !["present", "remote", "field", "late", "absent"].includes(bar.status) && "bg-slate-400"
                        )}
                        style={{ height: `${bar.heightPercent}%` }}
                        title={`${bar.label}: ${bar.status.replaceAll("_", " ")}`}
                      />
                      <div className="mt-2 truncate text-center text-[11px] text-slate-500">{bar.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 xl:col-span-5 box p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-secondary/10 p-2 text-secondary">
                <Lucide icon="Activity" className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-medium">Recent Activity</h4>
                <p className="mt-1 text-sm text-slate-500">Your latest attendance actions and where they were recorded.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {recentTimeline.map((item) => (
                <div key={item.id} className="flex items-start gap-3 rounded-xl border border-slate-200/80 px-4 py-3">
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <Lucide icon={item.icon as any} className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium capitalize text-slate-800">{item.title}</div>
                    <div className="text-sm capitalize text-slate-500">{item.subtitle.replaceAll("_", " ")}</div>
                  </div>
                  <div className="text-xs text-slate-500">{formatDisplayDate(item.timestamp)}</div>
                </div>
              ))}
              {!loading && recentTimeline.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                  No recent activity yet.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="attendance-history-heading">
        <div className="mb-3">
          <h3 id="attendance-history-heading" className="text-base font-medium">History</h3>
          <p className="text-sm text-slate-500">Use the daily summary for attendance outcomes and the raw entries list for exact clock-in and clock-out records.</p>
        </div>
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 xl:col-span-7 box p-5 overflow-x-auto">
          <div className="font-medium mb-1">Daily Summary</div>
          <div className="text-sm text-slate-500 mb-3">Recent attendance days with status, worked time, and geofence result.</div>
          <Table className="table-report" striped hover>
            <caption className="sr-only">
              Daily attendance summary showing date, status, mode, clock times, worked minutes, and geofence result.
            </caption>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Mode</Table.Th>
                <Table.Th>First In</Table.Th>
                <Table.Th>Last Out</Table.Th>
                <Table.Th>Worked</Table.Th>
                <Table.Th>Geo</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {recentDaily.map((row) => (
                <Table.Tr key={row.id}>
                  <Table.Td>{formatDisplayDate(row.work_date)}</Table.Td>
                  <Table.Td>
                    <span className={clsx("inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize", statusAccentClass(row.status))}>
                      {row.status.replaceAll("_", " ")}
                    </span>
                  </Table.Td>
                  <Table.Td className="capitalize">{(row.attendance_mode || row.expected_mode || "-").replaceAll("_", " ")}</Table.Td>
                  <Table.Td>{row.first_in_at ? formatDisplayDate(row.first_in_at) : "-"}</Table.Td>
                  <Table.Td>{row.last_out_at ? formatDisplayDate(row.last_out_at) : "-"}</Table.Td>
                  <Table.Td>{row.worked_minutes} mins</Table.Td>
                  <Table.Td className="capitalize">{row.geofence_status ? row.geofence_status.replaceAll("_", " ") : "-"}</Table.Td>
                </Table.Tr>
              ))}
              {!loading && daily.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={7} className="text-center text-slate-500 py-8">No attendance summary yet.</Table.Td>
                </Table.Tr>
              ) : null}
            </Table.Tbody>
          </Table>
        </div>
        <div className="col-span-12 xl:col-span-5 box p-5 overflow-x-auto">
          <div className="font-medium mb-1">Recent Clock Entries</div>
          <div className="text-sm text-slate-500 mb-3">The latest raw attendance events captured for you.</div>
          <Table className="table-report" striped hover>
            <caption className="sr-only">
              Raw attendance clock entries with date, entry type, mode, timestamp, and source.
            </caption>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Mode</Table.Th>
                <Table.Th>Time</Table.Th>
                <Table.Th>Source</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {recentEntries.map((row) => (
                <Table.Tr key={row.id}>
                  <Table.Td>{formatDisplayDate(row.work_date)}</Table.Td>
                  <Table.Td className="capitalize">{row.entry_type.replaceAll("_", " ")}</Table.Td>
                  <Table.Td className="capitalize">{(row.attendance_mode || "-").replaceAll("_", " ")}</Table.Td>
                  <Table.Td>{formatDisplayDate(row.entry_at)}</Table.Td>
                  <Table.Td>{row.source}</Table.Td>
                </Table.Tr>
              ))}
              {!loading && entries.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={5} className="text-center text-slate-500 py-8">No entries yet.</Table.Td>
                </Table.Tr>
              ) : null}
            </Table.Tbody>
          </Table>
        </div>
      </div>
      </section>

      <section className="mt-8" aria-labelledby="attendance-support-heading">
        <div className="mb-3">
          <h3 id="attendance-support-heading" className="text-base font-medium">Corrections & Support</h3>
          <p className="text-sm text-slate-500">If a day was missed or recorded incorrectly, submit a correction request here and track its status.</p>
        </div>
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-6 box p-5">
          <div className="font-medium mb-1">Request Attendance Correction</div>
          <div className="text-sm text-slate-500 mb-3">Use this form for missed punches, mode changes, or location corrections.</div>
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Work Date</FormLabel>
              <FormInput type="date" value={correctionForm.work_date} onChange={(e) => setCorrectionForm((prev) => ({ ...prev, work_date: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Request Type</FormLabel>
              <FormSelect value={correctionForm.request_type} onChange={(e) => setCorrectionForm((prev) => ({ ...prev, request_type: e.target.value }))}>
                <option value="clock_in">Missed Clock In</option>
                <option value="clock_out">Missed Clock Out</option>
                <option value="mode_change">Mode Change</option>
                <option value="location_change">Location Change</option>
              </FormSelect>
            </div>
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Proposed Time</FormLabel>
              <FormInput type="time" value={correctionForm.proposed_at} onChange={(e) => setCorrectionForm((prev) => ({ ...prev, proposed_at: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-6">
              <FormLabel>Proposed Mode</FormLabel>
              <FormSelect value={correctionForm.proposed_mode} onChange={(e) => setCorrectionForm((prev) => ({ ...prev, proposed_mode: e.target.value }))}>
                <option value="">Keep current</option>
                <option value="onsite">Onsite</option>
                <option value="remote">Remote</option>
                <option value="field">Field</option>
              </FormSelect>
            </div>
            <div className="col-span-12 md:col-span-6">
              <FormLabel>Proposed Office Location</FormLabel>
              <FormSelect value={correctionForm.proposed_office_location_id} onChange={(e) => setCorrectionForm((prev) => ({ ...prev, proposed_office_location_id: e.target.value }))}>
                <option value="">Not applicable</option>
                {officeLocations.map((location) => (
                  <option key={location.id} value={location.id}>{location.name}</option>
                ))}
              </FormSelect>
            </div>
            <div className="col-span-12">
              <FormLabel>Reason</FormLabel>
              <FormTextarea rows={3} value={correctionForm.reason} onChange={(e) => setCorrectionForm((prev) => ({ ...prev, reason: e.target.value }))} />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="primary" onClick={() => void submitCorrection()} disabled={submittingCorrection}>
              <Lucide icon="Send" className="w-4 h-4 mr-1" /> {submittingCorrection ? "Submitting..." : "Submit Correction"}
            </Button>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6 box p-5 overflow-x-auto">
          <div className="font-medium mb-1">Recent Corrections & Exceptions</div>
          <div className="text-sm text-slate-500 mb-3">Recent attendance issues and their current review status.</div>
          <Table className="table-report" striped hover>
            <caption className="sr-only">
              Attendance corrections and exceptions submitted by the current user, including date, type, status, and notes.
            </caption>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Notes</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {[...corrections.map((row) => ({ ...row, kind: "correction" })), ...exceptions.map((row) => ({ ...row, kind: "exception" }))]
                .sort((a, b) => String(b.work_date).localeCompare(String(a.work_date)))
                .slice(0, 12)
                .map((row: any) => (
                  <Table.Tr key={`${row.kind}-${row.id}`}>
                    <Table.Td>{formatDisplayDate(row.work_date)}</Table.Td>
                    <Table.Td className="capitalize">{String(row.kind === "correction" ? row.request_type : row.exception_type).replaceAll("_", " ")}</Table.Td>
                    <Table.Td>
                      <span className={clsx("inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize", statusAccentClass(String(row.status)))}>
                        {String(row.status).replaceAll("_", " ")}
                      </span>
                    </Table.Td>
                    <Table.Td>{row.reason || row.notes || row.review_notes || "-"}</Table.Td>
                  </Table.Tr>
                ))}
              {!loading && corrections.length === 0 && exceptions.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={4} className="text-center text-slate-500 py-8">No corrections or exceptions yet.</Table.Td>
                </Table.Tr>
              ) : null}
            </Table.Tbody>
          </Table>
        </div>
      </div>
      </section>
    </>
  );
}

export default StaffAttendancePage;
