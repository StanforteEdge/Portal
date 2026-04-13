// apps/pwa/src/modules/hr/attendance/StaffAttendanceSlideOver.tsx
import {
  Button,
  Chip,
  SectionCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
} from "@/shared";
import { useCachedQuery } from "@/shared/lib/core";
import {
  getStaffAttendance,
  type AttendanceDaily,
} from "./hr-attendance-api";

function formatTime(value: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function formatMins(mins: number) {
  if (!mins) return "0h";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

const statusVariant: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  present: "success",
  late: "warning",
  absent: "danger",
};

type Props = {
  userId: string;
  userName: string;
  from: string;
  to: string;
  onClose: () => void;
};

export default function StaffAttendanceSlideOver({
  userId,
  userName,
  from,
  to,
  onClose,
}: Props) {
  const { data, loading, error } = useCachedQuery(
    `hr:attendance:staff:${userId}:${from}:${to}`,
    () => getStaffAttendance(userId, { from, to }),
    { ttlMs: 1000 * 30, storage: "memory" },
  );

  const daily: AttendanceDaily[] = data?.daily ?? [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40">
      <div className="flex h-full w-full max-w-2xl flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Attendance Detail
            </p>
            <h2 className="text-xl font-semibold text-slate-950">{userName}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {from} → {to}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {loading ? (
            <div className="text-sm text-slate-500">Loading...</div>
          ) : error ? (
            <div className="text-sm text-danger">{error}</div>
          ) : (
            <SectionCard title="Daily Records">
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
                  {daily.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.work_date}</TableCell>
                      <TableCell>{formatTime(row.first_in_at)}</TableCell>
                      <TableCell>{formatTime(row.last_out_at)}</TableCell>
                      <TableCell>{formatMins(row.worked_minutes)}</TableCell>
                      <TableCell>
                        {row.late_minutes > 0 ? formatMins(row.late_minutes) : "-"}
                      </TableCell>
                      <TableCell>
                        <Chip variant={statusVariant[row.status] ?? "neutral"}>
                          {row.status}
                        </Chip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!daily.length ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-8 text-center text-slate-500"
                      >
                        No records in this period.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}
