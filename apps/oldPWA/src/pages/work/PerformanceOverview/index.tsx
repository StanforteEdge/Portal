import { useEffect, useMemo, useState } from "react";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import Table from "@/components/Base/Table";
import { useAppSelector } from "@/stores/hooks";
import { selectAuthState } from "@/stores/authSlice";
import {
  getMyWorkTimesheetSummary,
  listMyWorkItems,
  listMyWorkLogs,
  listTeamGoals,
  listTeamKpis,
  listTeamObjectives,
  listTeamWorkItems,
  listTeamWorkLogs,
} from "@/services/workManagement";

function PerformanceOverviewPage() {
  const auth = useAppSelector(selectAuthState);
  const canManageWork = auth.permissions.includes("*") || auth.permissions.includes("work.manage");
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [myItems, setMyItems] = useState<any[]>([]);
  const [myLogs, setMyLogs] = useState<any[]>([]);
  const [myTimesheetSummary, setMyTimesheetSummary] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [objectives, setObjectives] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any[]>([]);
  const [teamItems, setTeamItems] = useState<any[]>([]);
  const [teamLogs, setTeamLogs] = useState<any[]>([]);

  const load = async () => {
    try {
      const [myItemRows, myLogRows, timesheetRows, goalRows, objectiveRows, kpiRows, teamItemRows, teamLogRows] = await Promise.all([
        listMyWorkItems().catch(() => []),
        listMyWorkLogs().catch(() => []),
        getMyWorkTimesheetSummary().catch(() => []),
        listTeamGoals().catch(() => []),
        listTeamObjectives().catch(() => []),
        listTeamKpis().catch(() => []),
        canManageWork ? listTeamWorkItems().catch(() => []) : Promise.resolve([]),
        canManageWork ? listTeamWorkLogs({ approval_status: "submitted" }).catch(() => []) : Promise.resolve([]),
      ]);
      setMyItems(myItemRows);
      setMyLogs(myLogRows);
      setMyTimesheetSummary(timesheetRows);
      setGoals(goalRows);
      setObjectives(objectiveRows);
      setKpis(kpiRows);
      setTeamItems(teamItemRows);
      setTeamLogs(teamLogRows);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load performance overview." });
    }
  };

  useEffect(() => {
    void load();
  }, [canManageWork]);

  const myStats = useMemo(() => {
    const completed = myItems.filter((row) => row.status === "completed").length;
    const open = myItems.filter((row) => !["completed", "cancelled"].includes(row.status)).length;
    const blocked = myItems.filter((row) => row.status === "blocked").length;
    const carried = myLogs.filter((row) => row.status === "carried_over" || row.carried_over).length;
    const submitted = myLogs.filter((row) => row.approval_status === "submitted").length;
    const approved = myLogs.filter((row) => row.approval_status === "approved").length;
    const total = myItems.length || 1;
    return {
      completed,
      open,
      blocked,
      carried,
      submitted,
      approved,
      completionRate: Math.round((completed / total) * 100),
    };
  }, [myItems, myLogs]);

  const teamStats = useMemo(() => {
    const completed = teamItems.filter((row) => row.status === "completed").length;
    const total = teamItems.length || 1;
    const assignedPeople = new Set(teamItems.map((row) => row.assigned_to_id).filter(Boolean)).size;
    return {
      tasks: teamItems.length,
      completionRate: Math.round((completed / total) * 100),
      goals: goals.length,
      objectives: objectives.length,
      kpis: kpis.length,
      reviewQueue: teamLogs.length,
      assignedPeople,
    };
  }, [goals.length, kpis.length, objectives.length, teamItems, teamLogs.length]);

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Performance Overview</h2>
        <Button variant="outline-secondary" onClick={() => void load()}>
          <Lucide icon="Undo2" className="w-4 h-4 mr-1" />
          Refresh
        </Button>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="box p-5 mt-5">
        <div className="rounded bg-slate-50 px-4 py-3 text-sm text-slate-600">
          This is the first performance view built on the work-management foundation. It shows how goals, KPIs, assigned work, completion rate, and review flow are tracking for you and, when you manage work, for your team as well.
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 mt-5 md:grid-cols-4">
        <div className="box p-5"><div className="text-sm text-slate-500">My Completion Rate</div><div className="mt-2 text-2xl font-semibold">{myStats.completionRate}%</div></div>
        <div className="box p-5"><div className="text-sm text-slate-500">Open Work</div><div className="mt-2 text-2xl font-semibold">{myStats.open}</div></div>
        <div className="box p-5"><div className="text-sm text-slate-500">Blocked / Carried</div><div className="mt-2 text-2xl font-semibold">{myStats.blocked + myStats.carried}</div></div>
        <div className="box p-5"><div className="text-sm text-slate-500">Logs Approved</div><div className="mt-2 text-2xl font-semibold">{myStats.approved}</div></div>
      </div>

      {canManageWork ? (
        <div className="grid grid-cols-1 gap-4 mt-5 md:grid-cols-4">
          <div className="box p-5"><div className="text-sm text-slate-500">Team Tasks</div><div className="mt-2 text-2xl font-semibold">{teamStats.tasks}</div></div>
          <div className="box p-5"><div className="text-sm text-slate-500">Team Completion</div><div className="mt-2 text-2xl font-semibold">{teamStats.completionRate}%</div></div>
          <div className="box p-5"><div className="text-sm text-slate-500">Goals / KPIs</div><div className="mt-2 text-2xl font-semibold">{teamStats.goals}/{teamStats.kpis}</div></div>
          <div className="box p-5"><div className="text-sm text-slate-500">Review Queue</div><div className="mt-2 text-2xl font-semibold">{teamStats.reviewQueue}</div></div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-5 mt-5 xl:grid-cols-2">
        <div className="box p-5">
          <h3 className="font-medium">My KPI and Goal Coverage</h3>
          <Table className="mt-4">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Area</Table.Th>
                <Table.Th>Count</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              <Table.Tr><Table.RowHeader>Goals</Table.RowHeader><Table.Td>{goals.length}</Table.Td></Table.Tr>
              <Table.Tr><Table.RowHeader>Objectives</Table.RowHeader><Table.Td>{objectives.length}</Table.Td></Table.Tr>
              <Table.Tr><Table.RowHeader>KPIs</Table.RowHeader><Table.Td>{kpis.length}</Table.Td></Table.Tr>
              <Table.Tr><Table.RowHeader>Work Items</Table.RowHeader><Table.Td>{myItems.length}</Table.Td></Table.Tr>
              <Table.Tr><Table.RowHeader>Submitted Logs</Table.RowHeader><Table.Td>{myStats.submitted}</Table.Td></Table.Tr>
            </Table.Tbody>
          </Table>
        </div>

        <div className="box p-5">
          <h3 className="font-medium">Approved Work Allocation</h3>
          <Table className="mt-4">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Coverage</Table.Th>
                <Table.Th>Hours</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {myTimesheetSummary.map((row, index) => (
                <Table.Tr key={`${row.project_id}-${index}`}>
                  <Table.RowHeader>
                    <div className="font-medium">{row.project_name || "No project"}</div>
                    <div className="text-xs text-slate-500">{row.team_name} · {row.organization_name}</div>
                  </Table.RowHeader>
                  <Table.Td>{Number(row.hours || 0).toFixed(1)}</Table.Td>
                </Table.Tr>
              ))}
              {!myTimesheetSummary.length ? <Table.Tr><Table.Td colSpan={2} className="py-10 text-center text-slate-500">No approved work allocation yet.</Table.Td></Table.Tr> : null}
            </Table.Tbody>
          </Table>
        </div>
      </div>

      {canManageWork ? (
        <div className="box p-5 mt-5">
          <h3 className="font-medium">Team Review Queue</h3>
          <Table className="mt-4">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Staff</Table.Th>
                <Table.Th>Task</Table.Th>
                <Table.Th>Hours</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {teamLogs.map((row) => (
                <Table.Tr key={row.id}>
                  <Table.RowHeader>{row.staff?.full_name || row.staff?.email || "-"}</Table.RowHeader>
                  <Table.Td>{row.work_item?.title || "-"}</Table.Td>
                  <Table.Td>{row.hours_spent}</Table.Td>
                  <Table.Td className="capitalize">{String(row.status || "").replaceAll("_", " ")}</Table.Td>
                </Table.Tr>
              ))}
              {!teamLogs.length ? <Table.Tr><Table.Td colSpan={4} className="py-10 text-center text-slate-500">No submitted daily logs waiting review.</Table.Td></Table.Tr> : null}
            </Table.Tbody>
          </Table>
        </div>
      ) : null}
    </>
  );
}

export default PerformanceOverviewPage;
