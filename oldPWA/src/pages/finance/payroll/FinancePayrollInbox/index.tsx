import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import Table from "@/components/Base/Table";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { getPayrollInbox } from "@/services/payroll";
import { formatDisplayDate, formatMoney } from "@/utils/formatting";

function SectionCard({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <div className="box p-5">
      <div className="flex items-center justify-between">
        <div className="font-medium">{title}</div>
        <div className="text-xs rounded bg-slate-100 px-2 py-1 text-slate-600">{count}</div>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function FinancePayrollInboxPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setData(await getPayrollInbox());
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load payroll inbox." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Payroll Inbox</h2>
        <Button variant="outline-secondary" onClick={() => void load()} disabled={loading}>
          <Lucide icon="Undo2" className="w-4 h-4 mr-1" />
          Refresh
        </Button>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="grid grid-cols-1 gap-4 mt-5 md:grid-cols-6">
        {[
          ["Approvals", data?.counts?.approvals || 0],
          ["Corrections", data?.counts?.corrections || 0],
          ["Payments", data?.counts?.payments || 0],
          ["Imports", data?.counts?.import_issues || 0],
          ["Delivery", data?.counts?.delivery_issues || 0],
          ["Notifications", data?.counts?.notifications || 0],
        ].map(([label, count]) => (
          <div className="box p-4" key={String(label)}>
            <div className="text-slate-500 text-sm">{label}</div>
            <div className="text-2xl font-semibold mt-2">{count as number}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 mt-5 xl:grid-cols-2">
        <SectionCard title="Awaiting Approval" count={data?.approvals?.length || 0}>
          {(data?.approvals || []).length ? (
            <div className="space-y-3">
              {data.approvals.map((row: any) => (
                <div key={row.id} className="rounded border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{row.name}</div>
                      <div className="text-xs text-slate-500">{row.month}/{row.year} • {row.item_count} workers</div>
                    </div>
                    <div className="text-sm font-medium">{formatMoney(row.totals?.net || 0)}</div>
                  </div>
                  {row.link ? (
                    <Link to={row.link} className="text-primary text-xs mt-2 inline-flex items-center gap-1">
                      Open run
                      <Lucide icon="ChevronRight" className="w-3 h-3" />
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          ) : <div className="text-sm text-slate-500">No payroll runs are waiting for approval.</div>}
        </SectionCard>

        <SectionCard title="Corrections Required" count={data?.corrections?.length || 0}>
          {(data?.corrections || []).length ? (
            <div className="space-y-3">
              {data.corrections.map((row: any) => (
                <div key={row.id} className="rounded border p-3">
                  <div className="font-medium">{row.name}</div>
                  <div className="text-xs text-slate-500 mt-1">Rejected • Updated {formatDisplayDate(row.updated_at)}</div>
                  {row.link ? (
                    <Link to={row.link} className="text-primary text-xs mt-2 inline-flex items-center gap-1">
                      Open run
                      <Lucide icon="ChevronRight" className="w-3 h-3" />
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          ) : <div className="text-sm text-slate-500">No rejected payroll runs need correction.</div>}
        </SectionCard>

        <SectionCard title="Ready For Payment" count={data?.payments?.length || 0}>
          {(data?.payments || []).length ? (
            <div className="space-y-3">
              {data.payments.map((row: any) => (
                <div key={row.id} className="rounded border p-3">
                  <div className="font-medium">{row.name}</div>
                  <div className="text-xs text-slate-500 mt-1">Approved • Net {formatMoney(row.totals?.net || 0)}</div>
                  {row.link ? (
                    <Link to={row.link} className="text-primary text-xs mt-2 inline-flex items-center gap-1">
                      Open run
                      <Lucide icon="ChevronRight" className="w-3 h-3" />
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          ) : <div className="text-sm text-slate-500">No approved payroll runs are waiting for payment.</div>}
        </SectionCard>

        <SectionCard title="Import Issues" count={data?.import_issues?.length || 0}>
          {(data?.import_issues || []).length ? (
            <div className="space-y-3">
              {data.import_issues.map((row: any) => (
                <div key={row.id} className="rounded border p-3">
                  <div className="font-medium">{row.file_name}</div>
                  <div className="text-xs text-slate-500 mt-1">{row.status} • {row.row_count} rows</div>
                  {row.link ? (
                    <Link to={row.link} className="text-primary text-xs mt-2 inline-flex items-center gap-1">
                      Open import
                      <Lucide icon="ChevronRight" className="w-3 h-3" />
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          ) : <div className="text-sm text-slate-500">No payroll import jobs need attention.</div>}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-5 mt-5 xl:grid-cols-2">
        <SectionCard title="Payslip Delivery Issues" count={data?.delivery_issues?.length || 0}>
          {(data?.delivery_issues || []).length ? (
            <div className="max-h-80 overflow-auto rounded border">
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Worker</Table.Th>
                    <Table.Th>Run</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Error</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {data.delivery_issues.map((row: any) => (
                    <Table.Tr key={row.id}>
                      <Table.Td>{row.worker?.full_name || row.recipient_email || "-"}</Table.Td>
                      <Table.Td>
                        {row.link ? <Link to={row.link} className="text-primary">{row.run?.name || "-"}</Link> : row.run?.name || "-"}
                      </Table.Td>
                      <Table.Td className="capitalize">{String(row.status || "").replaceAll("_", " ")}</Table.Td>
                      <Table.Td className="text-xs text-slate-500">{row.error_message || "-"}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>
          ) : <div className="text-sm text-slate-500">No payslip delivery issues.</div>}
        </SectionCard>

        <SectionCard title="Recent Payroll Notifications" count={data?.notifications?.length || 0}>
          {(data?.notifications || []).length ? (
            <div className="space-y-3 max-h-80 overflow-auto">
              {data.notifications.map((row: any) => (
                <div key={row.id} className="rounded border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium">{row.title}</div>
                    <div className="text-xs text-slate-500">{formatDisplayDate(row.created_at)}</div>
                  </div>
                  <div className="text-sm text-slate-600 mt-1">{row.message}</div>
                  {row.link ? (
                    <Link to={row.link} className="text-primary text-xs mt-2 inline-flex items-center gap-1">
                      Open
                      <Lucide icon="ChevronRight" className="w-3 h-3" />
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          ) : <div className="text-sm text-slate-500">No payroll notifications yet.</div>}
        </SectionCard>
      </div>
    </>
  );
}

export default FinancePayrollInboxPage;
