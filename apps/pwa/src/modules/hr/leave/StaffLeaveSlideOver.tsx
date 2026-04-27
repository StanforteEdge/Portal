import { Button, Chip, SectionCard, StatCard, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableHeaderRow, TableRow } from "@/shared";
import { SlideOver, SlideOverHeader, SlideOverContent } from "@/shared/components/ui/SlideOver";
import { useCachedQuery } from "@/shared/lib/core";
import { requestStatusTone } from "@/requests/request-helpers";
import { listHrLeaveRequests, getHrLeaveBalances, type RequestRecord } from "./hr-leave-api";

function formatDate(value?: string) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

type Props = {
  userId: string;
  userName: string;
  year: number;
  onClose: () => void;
};

export default function StaffLeaveSlideOver({ userId, userName, year, onClose }: Props) {
  const { data: requestsData, loading: reqLoading } = useCachedQuery(
    `hr:leave:staff:${userId}:${year}`,
    () => listHrLeaveRequests({ user_id: userId }),
    { ttlMs: 1000 * 30, storage: "memory" },
  );

  const { data: balancesData, loading: balLoading } = useCachedQuery(
    `hr:leave:balances:${userId}:${year}`,
    () => getHrLeaveBalances({ year }),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const requests: RequestRecord[] = requestsData ?? [];
  const staffBalance = balancesData?.data.find((b) => b.user_id === userId);

  return (
    <SlideOver open={true} onClose={onClose} size="xl">
      <SlideOverHeader
        title={userName}
        subtitle={`${year} leave year`}
        onClose={onClose}
      />
      <SlideOverContent>
        {!balLoading && staffBalance ? (
          <SectionCard title="Leave Balances">
            <div className="grid gap-3 md:grid-cols-3">
              {staffBalance.balances.map((b) => (
                <StatCard
                  key={b.leave_type_key}
                  label={b.leave_type_name}
                  value={`${b.available_days}d`}
                  tone={b.available_days <= 2 ? "danger" : "success"}
                  hint={`${b.used_days}d used of ${b.entitled_days}d`}
                />
              ))}
            </div>
            {!staffBalance.balances.length ? (
              <p className="text-sm text-slate-500">No balance data available.</p>
            ) : null}
          </SectionCard>
        ) : balLoading ? (
          <div className="text-sm text-slate-500">Loading balances...</div>
        ) : null}

        <SectionCard title="Leave Requests">
          {reqLoading ? (
            <div className="text-sm text-slate-500">Loading requests...</div>
          ) : (
            <Table>
              <TableHead>
                <TableHeaderRow>
                  <TableHeaderCell>Type</TableHeaderCell>
                  <TableHeaderCell>Dates</TableHeaderCell>
                  <TableHeaderCell>Days</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                </TableHeaderRow>
              </TableHead>
              <TableBody>
                {requests.map((r) => {
                  const d = r.data ?? {};
                  const start = formatDate(String(d.start_date ?? ""));
                  const end = formatDate(String(d.end_date ?? ""));
                  const days = Number(d.days_requested ?? 0);
                  return (
                    <TableRow key={r.id}>
                      <TableCell>{r.request_type?.name ?? "Leave"}</TableCell>
                      <TableCell>
                        {start} – {end}
                      </TableCell>
                      <TableCell>{days > 0 ? `${days}d` : "-"}</TableCell>
                      <TableCell>
                        <Chip variant={requestStatusTone(r.status)}>{r.status}</Chip>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!requests.length ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-slate-500">
                      No leave requests found.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          )}
        </SectionCard>
      </SlideOverContent>
    </SlideOver>
  );
}