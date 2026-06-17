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
import { SlideOver, SlideOverHeader, SlideOverContent } from "@/shared/components/ui/SlideOver";
import { attendanceApi, useCachedQuery } from "@/shared/lib/core";
import { type AttendanceDaily } from "@stanforte/shared";

import { formatDate, formatTime, formatDuration, humanize } from "@stanforte/shared";
import { deriveAttendanceStatus, toneFromStatus } from "./attendance-data";
import { TimeWithNextDay } from "@/shared/components/ui/TimeWithNextDay";

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
    () => attendanceApi.listRecords({ from, to, user_id: userId }),
    { ttlMs: 1000 * 30, storage: "memory" },
  );

  const daily: AttendanceDaily[] = (data as any)?.items || [];

  return (
    <SlideOver open={true} onClose={onClose} size="xl">
      <SlideOverHeader
        title="Attendance Detail"
        subtitle={`${from} → ${to}`}
        onClose={onClose}
      />
      <SlideOverContent>
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
                    <TableCell>{formatDate(row.work_date)}</TableCell>
                    <TableCell>{formatTime(row.first_in_at)}</TableCell>
                    <TableCell><TimeWithNextDay time={row.last_out_at} referenceDate={row.first_in_at} /></TableCell>
                    <TableCell>{formatDuration(row.worked_minutes)}</TableCell>
                    <TableCell>
                      {row.late_minutes > 0 ? formatDuration(row.late_minutes) : "-"}
                    </TableCell>
                    <TableCell>
                      <Chip variant={toneFromStatus(deriveAttendanceStatus(row))}>
                        {humanize(deriveAttendanceStatus(row))}
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
      </SlideOverContent>
    </SlideOver>
  );
}
