import { useState } from "react";
import {
  Chip,
  StatCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
  TextField,
} from "@/shared";
import { attendanceApi, useCachedQuery } from "@/shared/lib/core";
import { formatDate, formatTime, formatDuration } from "@/shared/lib/format-utils";

type Props = {
  employeeId: string;
};

const statusVariant: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  present: "success",
  late: "warning",
  absent: "danger",
};

export default function EmployeeAttendanceTab({ employeeId }: Props) {
  const [from, setFrom] = useState(new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));

  const { data, loading } = useCachedQuery(
    `hr:employee:attendance:${employeeId}:${from}:${to}`,
    () => attendanceApi.listRecords({ from, to, user_id: employeeId }),
    { ttlMs: 1000 * 60, storage: "memory" }
  );

  const rows: any[] = (data || []) as any;
  
  // Aggregate stats from rows
  const stats = rows.reduce((acc, row) => {
    acc.total++;
    if (row.status === 'present' || row.status === 'late') acc.present++;
    if (row.status === 'late') acc.late++;
    if (row.status === 'absent') acc.absent++;
    acc.workedMins += row.worked_minutes;
    return acc;
  }, { total: 0, present: 0, late: 0, absent: 0, workedMins: 0 });

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total Days" value={String(stats.total)} icon="calendar_today" />
        <StatCard label="Present" value={String(stats.present)} tone="success" icon="check_circle" />
        <StatCard label="Late" value={String(stats.late)} tone="warning" icon="schedule" />
        <StatCard label="Worked Time" value={formatDuration(stats.workedMins)} icon="timer" />
      </div>

      <div className="flex flex-wrap items-end gap-3 bg-slate-50 p-4 rounded-3xl border border-slate-100">
        <TextField label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <TextField label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500">Loading history...</div>
      ) : (
        <div className="overflow-x-auto rounded-[22px] border border-slate-200">
          <Table>
            <TableHead>
              <TableHeaderRow>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Clock In</TableHeaderCell>
                <TableHeaderCell>Clock Out</TableHeaderCell>
                <TableHeaderCell>Worked</TableHeaderCell>
                <TableHeaderCell>Late</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
              </TableHeaderRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.work_date}>
                  <TableCell className="font-medium text-slate-900">{formatDate(row.work_date)}</TableCell>
                  <TableCell>{formatTime(row.first_in_at)}</TableCell>
                  <TableCell>{formatTime(row.last_out_at)}</TableCell>
                  <TableCell>{formatDuration(row.worked_minutes)}</TableCell>
                  <TableCell>{row.late_minutes > 0 ? formatDuration(row.late_minutes) : "-"}</TableCell>
                  <TableCell>
                    <Chip variant={statusVariant[row.status] ?? "neutral"}>
                      {row.status}
                    </Chip>
                  </TableCell>
                </TableRow>
              ))}
              {!rows.length && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-slate-400 italic">
                    No attendance records found for this period.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
