import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import Table from "@/components/Base/Table";
import { Dialog } from "@/components/Base/Headless";
import { FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { adjustLeaveBalance, getLeaveBalances, listHrEmployees, type HrEmployee, type LeaveBalanceRow } from "@/services/hr";
import { listApprovals } from "@/services/requests";

function HrLeaveTrackerPage() {
  const [rows, setRows] = useState<LeaveBalanceRow[]>([]);
  const [employees, setEmployees] = useState<HrEmployee[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [userId, setUserId] = useState("");
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjust, setAdjust] = useState({
    user_id: "",
    leave_type_key: "annual_leave",
    period_year: String(new Date().getFullYear()),
    delta_days: "",
    entry_type: "adjustment",
    notes: "",
  });

  const employeeNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const employee of employees) {
      map.set(employee.id, `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim() || employee.email);
    }
    return map;
  }, [employees]);

  const load = async () => {
    try {
      setLoading(true);
      const [balances, employeeRes] = await Promise.all([
        getLeaveBalances({ year, ...(userId ? { user_id: userId } : {}) }),
        listHrEmployees({ page: 1, per_page: 200 }),
      ]);
      setRows(balances.data ?? []);
      setEmployees(employeeRes.data ?? []);
      const approvalRows = await listApprovals({ status: "pending" }).catch(() => []);
      const pendingLeave = (approvalRows || []).filter((row) =>
        String(row.request_type?.category_key ?? "").toLowerCase().includes("leave") ||
        String(row.request_type?.name ?? "").toLowerCase().includes("leave")
      );
      setPendingApprovals(pendingLeave.length);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load leave balances." });
    } finally {
      setLoading(false);
    }
  };

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.entitled += Number(row.entitled || 0);
        acc.used += Number(row.used || 0);
        acc.available += Number(row.available || 0);
        return acc;
      },
      { entitled: 0, used: 0, available: 0 }
    );
  }, [rows]);
  const coveredEmployees = useMemo(() => new Set(rows.map((row) => row.user_id)).size, [rows]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, userId]);

  const runAdjust = async () => {
    if (!adjust.user_id || !adjust.leave_type_key || !adjust.delta_days) {
      setNotice({ tone: "warning", message: "User, leave type and delta days are required." });
      return;
    }
    try {
      setSaving(true);
      await adjustLeaveBalance({
        user_id: adjust.user_id,
        leave_type_key: adjust.leave_type_key.trim().toLowerCase(),
        period_year: Number(adjust.period_year || year),
        delta_days: Number(adjust.delta_days),
        entry_type: adjust.entry_type || "adjustment",
        notes: adjust.notes || undefined,
      });
      setShowAdjust(false);
      setNotice({ tone: "success", message: "Leave balance adjusted." });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to adjust leave balance." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Leave Tracker</h2>
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => setShowAdjust(true)}>
            <Lucide icon="Settings2" className="w-4 h-4 mr-1" />
            Adjust Balance
          </Button>
          <Button variant="outline-secondary" onClick={() => void load()} disabled={loading}>
            <Lucide icon="Undo2" className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>
      <div className="mt-4 intro-y">
        <div className="box p-2">
          <div className="flex gap-2">
            <Button variant="primary">
              <Lucide icon="BarChart2" className="w-4 h-4 mr-1" />
              Tracker
            </Button>
            <Link to="/app/hr/leave/requests">
              <Button variant="outline-secondary">
                <Lucide icon="CheckCheck" className="w-4 h-4 mr-1" />
                Requests
              </Button>
            </Link>
            <Link to="/app/hr/settings/leave">
              <Button variant="outline-secondary">
                <Lucide icon="Settings" className="w-4 h-4 mr-1" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>
      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="grid grid-cols-12 gap-6 mt-5">
        {[
          { label: "Employees", value: coveredEmployees, icon: "Users", color: "text-primary" },
          { label: "Entitled Days", value: totals.entitled, icon: "FileText", color: "text-success" },
          { label: "Used Days", value: totals.used, icon: "Clock3", color: "text-warning" },
          { label: "Available Days", value: totals.available, icon: "BadgeCheck", color: "text-primary" },
          { label: "Pending Leave Approvals", value: pendingApprovals, icon: "CheckCheck", color: "text-danger" },
        ].map((card) => (
          <div key={card.label} className="col-span-12 xs:col-span-6 md:col-span-4 xl:col-span-2 intro-y">
            <div
              className="relative zoom-in before:box before:absolute before:inset-x-3 before:mt-3 before:h-full before:bg-slate-50 before:content-['']"
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
          <div className="col-span-12 md:col-span-3">
            <FormLabel>Year</FormLabel>
            <FormInput type="number" value={year} onChange={(e) => setYear(Number(e.target.value || new Date().getFullYear()))} />
          </div>
          <div className="col-span-12 md:col-span-5">
            <FormLabel>Employee</FormLabel>
            <FormSelect value={userId} onChange={(e) => setUserId(e.target.value)}>
              <option value="">All employees</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {(employee.first_name || employee.last_name)
                    ? `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim()
                    : employee.email}
                </option>
              ))}
            </FormSelect>
          </div>
        </div>
      </div>

      <div className="box p-5 mt-5 overflow-x-auto">
        <Table className="table-report" striped hover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Employee</Table.Th>
              <Table.Th>Leave Type</Table.Th>
              <Table.Th>Entitled</Table.Th>
              <Table.Th>Used</Table.Th>
              <Table.Th>Adjustments</Table.Th>
              <Table.Th>Available</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((row) => (
              <Table.Tr key={`${row.user_id}-${row.leave_type_key}`}>
                <Table.Td>{employeeNameMap.get(row.user_id) ?? row.user_id}</Table.Td>
                <Table.Td className="capitalize">{row.leave_type_key.replaceAll("_", " ")}</Table.Td>
                <Table.Td>{row.entitled}</Table.Td>
                <Table.Td>{row.used}</Table.Td>
                <Table.Td>{row.adjustments}</Table.Td>
                <Table.Td>{row.available}</Table.Td>
              </Table.Tr>
            ))}
            {!loading && rows.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={6} className="text-center text-slate-500 py-8">No leave balances yet.</Table.Td>
              </Table.Tr>
            ) : null}
          </Table.Tbody>
        </Table>
      </div>

      <Dialog open={showAdjust} onClose={() => setShowAdjust(false)}>
        <Dialog.Panel>
          <div className="p-5 space-y-3">
            <div className="text-lg font-medium">Adjust Leave Balance</div>
            <div>
              <FormLabel>Employee</FormLabel>
              <FormSelect value={adjust.user_id} onChange={(e) => setAdjust((p) => ({ ...p, user_id: e.target.value }))}>
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {(employee.first_name || employee.last_name)
                      ? `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim()
                      : employee.email}
                  </option>
                ))}
              </FormSelect>
            </div>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-12 md:col-span-6">
                <FormLabel>Leave Type Key</FormLabel>
                <FormInput value={adjust.leave_type_key} onChange={(e) => setAdjust((p) => ({ ...p, leave_type_key: e.target.value }))} />
              </div>
              <div className="col-span-12 md:col-span-6">
                <FormLabel>Year</FormLabel>
                <FormInput type="number" value={adjust.period_year} onChange={(e) => setAdjust((p) => ({ ...p, period_year: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-12 md:col-span-6">
                <FormLabel>Delta Days (+ / -)</FormLabel>
                <FormInput type="number" step="0.5" value={adjust.delta_days} onChange={(e) => setAdjust((p) => ({ ...p, delta_days: e.target.value }))} />
              </div>
              <div className="col-span-12 md:col-span-6">
                <FormLabel>Entry Type</FormLabel>
                <FormSelect value={adjust.entry_type} onChange={(e) => setAdjust((p) => ({ ...p, entry_type: e.target.value }))}>
                  <option value="adjustment">adjustment</option>
                  <option value="entitlement">entitlement</option>
                  <option value="carryover">carryover</option>
                </FormSelect>
              </div>
            </div>
            <div>
              <FormLabel>Notes</FormLabel>
              <FormTextarea rows={3} value={adjust.notes} onChange={(e) => setAdjust((p) => ({ ...p, notes: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline-secondary" onClick={() => setShowAdjust(false)}>
                <Lucide icon="XCircle" className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button variant="primary" onClick={() => void runAdjust()} disabled={saving}>
                <Lucide icon="CheckCircle2" className="w-4 h-4 mr-1" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    </>
  );
}

export default HrLeaveTrackerPage;
