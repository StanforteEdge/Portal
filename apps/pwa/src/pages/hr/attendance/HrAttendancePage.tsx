import { useMemo, useState } from "react";
import {
  Button,
  Chip,
  EmptyState,
  PageHeader,
  SectionCard,
  SelectField,
  StatCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
  TextField,
  useToast,
} from "@/shared";
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import { useCachedQuery } from "@/shared/lib/core";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import { attendanceApi, resourceApi } from "@/shared/lib/core";
import {
  type AdminCorrectionRow,
  type StaffDailyRow,
} from "@stanforte/shared";
import StaffAttendanceSlideOver from "./StaffAttendanceSlideOver";
import CorrectionReviewSlideOver from "./CorrectionReviewSlideOver";
import { formatDate, formatTime, formatDuration, humanize } from "@stanforte/shared";
import { deriveAttendanceStatus, toneFromStatus } from "./attendance-data";
import { TimeWithNextDay } from "@/shared/components/ui/TimeWithNextDay";
import { SidebarTabs } from "@/shared";
import { PaginationControls } from "@/shared";

type ActiveTab = "attendance" | "corrections";

const corrStatusVariant: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

const tabItems = [
  { id: "attendance" as ActiveTab, label: "Staff Attendance", icon: "badge" },
  { id: "corrections" as ActiveTab, label: "Correction Requests", icon: "rate_review" },
];

export default function HrAttendancePage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const { data: profile } = useCachedQuery(
    "hr:profile",
    () => getWorkspaceProfile(),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const { data: organizations } = useCachedQuery(
    "hr:attendance:orgs",
    () => resourceApi.listOrganizations(),
    { ttlMs: 1000 * 60 * 5, storage: "memory" },
  );

  const { data: teams } = useCachedQuery(
    "hr:attendance:teams",
    () => resourceApi.listGroups({ active_only: true }),
    { ttlMs: 1000 * 60 * 5, storage: "memory" },
  );

  const [activeTab, setActiveTab] = useState<ActiveTab>("attendance");
  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
  const [statusFilter, setStatusFilter] = useState("");
  const [orgFilter, setOrgFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [corrStatusFilter, setCorrStatusFilter] = useState("");
  const [attPage, setAttPage] = useState(1);
  const [attPerPage, setAttPerPage] = useState(25);
  const [corrPage, setCorrPage] = useState(1);
  const [corrPerPage, setCorrPerPage] = useState(25);
  const [slideOver, setSlideOver] = useState<{
    userId: string;
    userName: string;
  } | null>(null);
  const [reviewingItem, setReviewingItem] = useState<AdminCorrectionRow | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);

  const { data: stats } = useCachedQuery(
    `hr:attendance:stats:${todayStr}`,
    () => attendanceApi.getStats(todayStr),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const { data: attendanceData, loading: attLoading } = useCachedQuery(
    `hr:attendance:list:${dateFrom}:${dateTo}:${statusFilter}:${orgFilter}:${teamFilter}`,
    () =>
      attendanceApi.listRecords({
        from: dateFrom,
        to: dateTo,
        status: statusFilter || undefined,
        org_id: orgFilter || undefined,
        team_id: teamFilter || undefined,
      }),
    { ttlMs: 1000 * 30, storage: "memory" },
  );

  const { data: correctionsData, loading: corrLoading } = useCachedQuery(
    `hr:attendance:corrections:${corrStatusFilter}`,
    () => attendanceApi.listCorrections(corrStatusFilter ? { status: corrStatusFilter } : undefined),
    { ttlMs: 1000 * 30, storage: "memory" },
  );

  const allRows: StaffDailyRow[] = (attendanceData || []) as any;
  const allCorrections: AdminCorrectionRow[] = (correctionsData || []) as any;

  const attTotalPages = Math.max(1, Math.ceil(allRows.length / attPerPage));
  const attSafePage = Math.min(attPage, attTotalPages);
  const pagedRows = useMemo(() => {
    const start = (attSafePage - 1) * attPerPage;
    return allRows.slice(start, start + attPerPage);
  }, [allRows, attSafePage, attPerPage]);

  const corrTotalPages = Math.max(1, Math.ceil(allCorrections.length / corrPerPage));
  const corrSafePage = Math.min(corrPage, corrTotalPages);
  const pagedCorrections = useMemo(() => {
    const start = (corrSafePage - 1) * corrPerPage;
    return allCorrections.slice(start, start + corrPerPage);
  }, [allCorrections, corrSafePage, corrPerPage]);

  const userName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.email ||
    "HR Staff";

  return (
    <AppShell
      navigation={buildAppNavigation()}
      activeLabel="hr-attendance"
      user={{
        name: userName,
        role: profile?.employee_profile?.job_title || "HR Staff",
      }}
      mobileNav={buildAppMobileNav("HR")}
    >
      <PageHeader
        breadcrumbs={[{ label: "HR", path: "/hr" }, { label: "Attendance" }]}
        title="Attendance"
        description="Monitor daily attendance, worked hours, and manage correction requests."
      />

      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            label="Total Staff"
            value={String(stats?.total_staff ?? 0)}
            tone="neutral"
            icon="group"
          />
          <StatCard
            label="Clocked In"
            value={String(stats?.clocked_in ?? 0)}
            tone="success"
            icon="login"
          />
          <StatCard
            label="Late"
            value={String(stats?.late ?? 0)}
            tone="warning"
            icon="schedule"
          />
          <StatCard
            label="Absent / Not In"
            value={String(stats?.absent ?? 0)}
            tone="danger"
            icon="person_off"
          />
        </div>

        <SidebarTabs items={tabItems} activeTab={activeTab} onTabChange={(id) => setActiveTab(id as ActiveTab)}>
          {activeTab === "attendance" && (
            <SectionCard
              title="Staff Attendance"
              description="Records for the selected date range."
            >
              <div className="mb-4 flex flex-wrap items-end gap-3">
                <TextField
                  label="From"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setAttPage(1); }}
                />
                <TextField
                  label="To"
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setAttPage(1); }}
                />
                <SelectField
                  label="Status"
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setAttPage(1); }}
                >
                  <option value="">All statuses</option>
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="absent">Absent</option>
                </SelectField>
                <SelectField
                  label="Organization"
                  value={orgFilter}
                  onChange={(e) => { setOrgFilter(e.target.value); setAttPage(1); }}
                >
                  <option value="">All organizations</option>
                  {(organizations ?? []).map((org) => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </SelectField>
                <SelectField
                  label="Team"
                  value={teamFilter}
                  onChange={(e) => { setTeamFilter(e.target.value); setAttPage(1); }}
                >
                  <option value="">All teams</option>
                  {(teams ?? []).map((team: any) => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </SelectField>
              </div>

              {attLoading ? (
                <div className="text-sm text-slate-500">Loading attendance...</div>
              ) : (
                <>
                  <Table>
                    <TableHead>
                      <TableHeaderRow>
                        <TableHeaderCell>Staff</TableHeaderCell>
                        <TableHeaderCell>Date</TableHeaderCell>
                        <TableHeaderCell>Clock In</TableHeaderCell>
                        <TableHeaderCell>Clock Out</TableHeaderCell>
                        <TableHeaderCell>Worked</TableHeaderCell>
                        <TableHeaderCell>Late</TableHeaderCell>
                        <TableHeaderCell>Mode</TableHeaderCell>
                        <TableHeaderCell>Status</TableHeaderCell>
                        <TableHeaderCell>{""}</TableHeaderCell>
                      </TableHeaderRow>
                    </TableHead>
                    <TableBody>
                      {pagedRows.map((row) => (
                        <TableRow key={`${row.user_id}-${row.work_date}`}>
                          <TableCell>
                            <p className="font-semibold text-slate-900">{row.user_name}</p>
                            <p className="text-xs text-slate-500">{row.email}</p>
                          </TableCell>
                          <TableCell>{formatDate(row.work_date)}</TableCell>
                          <TableCell>{formatTime(row.first_in_at)}</TableCell>
                          <TableCell><TimeWithNextDay time={row.last_out_at} referenceDate={row.first_in_at} /></TableCell>
                          <TableCell>{formatDuration(row.worked_minutes)}</TableCell>
                          <TableCell>
                            {row.late_minutes > 0 ? formatDuration(row.late_minutes) : "-"}
                          </TableCell>
                          <TableCell>
                            <Chip variant="neutral">{row.attendance_mode ?? "-"}</Chip>
                          </TableCell>
                          <TableCell>
                            <Chip variant={toneFromStatus(deriveAttendanceStatus(row))}>
                              {humanize(deriveAttendanceStatus(row))}
                            </Chip>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSlideOver({ userId: row.user_id, userName: row.user_name })}
                            >
                              Detail
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!pagedRows.length ? (
                        <TableRow>
                          <TableCell colSpan={9} className="py-10 text-center text-slate-500">
                            No attendance records for this period.
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                  {allRows.length > attPerPage && (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <SelectField label="" value={String(attPerPage)} onChange={(e) => { setAttPerPage(Number(e.target.value)); setAttPage(1); }} className="w-[110px]">
                        <option value="10">10 / page</option>
                        <option value="25">25 / page</option>
                        <option value="50">50 / page</option>
                      </SelectField>
                      <PaginationControls
                        page={attSafePage}
                        totalPages={attTotalPages}
                        totalCount={allRows.length}
                        itemLabel="record"
                        onPageChange={setAttPage}
                      />
                    </div>
                  )}
                </>
              )}
            </SectionCard>
          )}

          {activeTab === "corrections" && (
            <SectionCard
              title="Correction Requests"
              description="Pending and recent attendance corrections submitted by staff."
              action={
                <SelectField
                  label=""
                  value={corrStatusFilter}
                  onChange={(e) => { setCorrStatusFilter(e.target.value); setCorrPage(1); }}
                  className="w-[160px]"
                >
                  <option value="">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </SelectField>
              }
            >
              {corrLoading ? (
                <div className="text-sm text-slate-500">Loading corrections...</div>
              ) : allCorrections.length ? (
                <>
                  <Table>
                    <TableHead>
                      <TableHeaderRow>
                        <TableHeaderCell>Staff</TableHeaderCell>
                        <TableHeaderCell>Date</TableHeaderCell>
                        <TableHeaderCell>Type</TableHeaderCell>
                        <TableHeaderCell>Reason</TableHeaderCell>
                        <TableHeaderCell>Status</TableHeaderCell>
                        <TableHeaderCell>{""}</TableHeaderCell>
                      </TableHeaderRow>
                    </TableHead>
                    <TableBody>
                      {pagedCorrections.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell>
                            <p className="font-semibold text-slate-900">{c.user_name}</p>
                            <p className="text-xs text-slate-500">{c.email}</p>
                          </TableCell>
                          <TableCell>{formatDate(c.work_date)}</TableCell>
                          <TableCell className="capitalize">{c.request_type.replace(/_/g, " ")}</TableCell>
                          <TableCell className="max-w-xs truncate">{c.reason}</TableCell>
                          <TableCell>
                            <Chip variant={corrStatusVariant[c.status] ?? "neutral"}>
                              {c.status}
                            </Chip>
                          </TableCell>
                          <TableCell>
                            {c.status === "pending" ? (
                              <Button size="sm" variant="ghost" onClick={() => setReviewingItem(c)}>
                                Review
                              </Button>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {allCorrections.length > corrPerPage && (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <SelectField label="" value={String(corrPerPage)} onChange={(e) => { setCorrPerPage(Number(e.target.value)); setCorrPage(1); }} className="w-[110px]">
                        <option value="10">10 / page</option>
                        <option value="25">25 / page</option>
                        <option value="50">50 / page</option>
                      </SelectField>
                      <PaginationControls
                        page={corrSafePage}
                        totalPages={corrTotalPages}
                        totalCount={allCorrections.length}
                        itemLabel="request"
                        onPageChange={setCorrPage}
                      />
                    </div>
                  )}
                </>
              ) : (
                <EmptyState
                  title="No correction requests"
                  description="Staff correction requests will appear here."
                />
              )}
            </SectionCard>
          )}
        </SidebarTabs>
      </div>

      {slideOver ? (
        <StaffAttendanceSlideOver
          userId={slideOver.userId}
          userName={slideOver.userName}
          from={dateFrom}
          to={dateTo}
          onClose={() => setSlideOver(null)}
        />
      ) : null}

      {reviewingItem ? (
        <CorrectionReviewSlideOver
          correction={reviewingItem}
          onClose={() => setReviewingItem(null)}
          onReviewed={() => {
            setReviewingItem(null);
          }}
        />
      ) : null}
    </AppShell>
  );
}