import { useMemo, useState } from "react";
import {
  Button,
  Chip,
  SectionCard,
  StatCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
  useToast,
  Icon,
} from "@/shared";
import { useCachedQuery, httpRequest } from "@/shared/lib/core";
import { formatDisplayDate } from "@stanforte/shared";
import {
  listMyProjectTimesheets,
  submitMyProjectTimesheet,
  type TimesheetRow,
} from "@/shared/api/payroll-api";
import { AccountShellPage } from "./page-helpers";
import TimesheetEditorSlideOver from "./TimesheetEditorSlideOver";

const statusVariant: Record<string, "success" | "pending" | "neutral" | "warning" | "danger"> = {
  draft: "neutral",
  submitted: "pending",
  approved: "success",
  rejected: "danger",
};

export default function TimesheetsPage() {
  const { showToast } = useToast();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: timesheets = [], loading, refetch } = useCachedQuery(
    "payroll:my-timesheets",
    () => listMyProjectTimesheets({ page: 1, per_page: 500 }),
    { ttlMs: 1000 * 60, storage: "memory" }
  );

  const summary = useMemo(() => {
    const totalHours = timesheets.reduce((sum: number, row: any) => sum + Number(row.hours || 0), 0);
    return {
      entries: timesheets.length,
      hours: totalHours,
      submitted: timesheets.filter((row: any) => row.status === "submitted").length,
      approved: timesheets.filter((row: any) => row.status === "approved").length,
    };
  }, [timesheets]);

  async function submitTimesheet(id: string) {
    try {
      await submitMyProjectTimesheet(id);
      showToast({ tone: "success", title: "Submitted", message: "Timesheet submitted for review." });
      void refetch();
    } catch (err: any) {
      showToast({ tone: "danger", title: "Cannot submit", message: err.message || "Failed to submit timesheet." });
    }
  }

  return (
    <AccountShellPage
      activeLabel="Timesheets"
      eyebrow="My Account"
      breadcrumbs={[
        { label: "Profile", path: "/profile" },
        { label: "Timesheets" },
      ]}
      title="My Project Timesheets"
      description="Submit your project time to feed payroll allocations."
    >
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Recent Entries</h3>
            <Button size="sm" onClick={() => { setEditingId(null); setEditorOpen(true); }}>
              <Icon name="add" className="mr-2" />
              New Entry
            </Button>
          </div>

          <SectionCard>
            <Table>
              <TableHead>
                <TableHeaderRow>
                  <TableHeaderCell>Date & Desc</TableHeaderCell>
                  <TableHeaderCell>Project / Fund</TableHeaderCell>
                  <TableHeaderCell>Hours</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                </TableHeaderRow>
              </TableHead>
              <TableBody>
                {timesheets.map((row: any) => {
                  const statusKey = String(row.status || "").toLowerCase();
                  const isDraftOrRejected = ["draft", "rejected"].includes(statusKey);
                  return (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="font-semibold text-slate-900">{row.work_date ? formatDisplayDate(row.work_date) : "-"}</div>
                        <div className="text-xs text-slate-500 line-clamp-1 max-w-[200px]" title={row.description}>{row.description || "No description"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-800">{row.project?.name || "General"}</div>
                        <div className="text-xs text-slate-500">{row.fund?.name || "No fund"} • {row.grant?.name || "No grant"}</div>
                      </TableCell>
                      <TableCell>{Number(row.hours).toFixed(1)}</TableCell>
                      <TableCell>
                        <Chip variant={statusVariant[statusKey] ?? "neutral"} className="capitalize">
                          {row.status?.replace("_", " ") || "Draft"}
                        </Chip>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {isDraftOrRejected && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => { setEditingId(row.id); setEditorOpen(true); }}>
                              <Icon name="edit" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => void submitTimesheet(row.id)}>
                              <Icon name="send" />
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!timesheets.length && !loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-slate-500">
                      No timesheet entries yet.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </SectionCard>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <StatCard label="Entries" value={String(summary.entries)} tone="neutral" />
          <StatCard label="Hours Logged" value={summary.hours.toFixed(1)} tone="pending" />
          <StatCard label="Submitted" value={String(summary.submitted)} tone="neutral" />
          <StatCard label="Approved" value={String(summary.approved)} tone="success" hint="Feeding into next payroll run" />

          <SectionCard title="Guidelines">
            <ul className="text-sm text-slate-600 list-disc pl-4 space-y-2">
              <li>Approved entries feed payroll allocation for project costing.</li>
              <li>Draft and rejected rows can be edited freely.</li>
              <li>Submitted rows are locked until reviewed.</li>
            </ul>
          </SectionCard>
        </div>
      </div>

      {editorOpen && (
        <TimesheetEditorSlideOver
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          timesheetId={editingId}
          onSaved={() => {
            setEditorOpen(false);
            void refetch();
          }}
        />
      )}
    </AccountShellPage>
  );
}
