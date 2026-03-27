import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Button from "@/components/Base/Button";
import Table from "@/components/Base/Table";
import Lucide from "@/components/Base/Lucide";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { downloadMyPayrollPayslip, listMyPayrollPayslips } from "@/services/payroll";
import { formatDisplayDate, formatMoney } from "@/utils/formatting";

const downloadBase64File = (fileName: string, mimeType: string, contentBase64: string) => {
  const bytes = atob(contentBase64);
  const array = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) array[i] = bytes.charCodeAt(i);
  const blob = new Blob([array], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

function MyPayslipsPage() {
  const [searchParams] = useSearchParams();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  const targetRunId = searchParams.get("run_id");
  const targetItemId = searchParams.get("item_id");

  const load = async () => {
    try {
      setLoading(true);
      const response = await listMyPayrollPayslips({ page: 1, per_page: 100 });
      setRows(response?.data || []);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load payslips." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const download = async (runId: string, itemId: string) => {
    try {
      const response = await downloadMyPayrollPayslip(runId, itemId);
      downloadBase64File(response.file_name, response.mime_type, response.content_base64);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to download payslip." });
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">My Payslips</h2>
        <Button variant="outline-secondary" onClick={() => void load()} disabled={loading}>
          <Lucide icon="Undo2" className="w-4 h-4 mr-1" />
          Refresh
        </Button>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="box p-5 mt-5">
        <div className="text-sm text-slate-600">
          Download your payroll payslips. Newly distributed payslips will appear here with the latest distribution status.
        </div>
      </div>

      <div className="box p-5 mt-5">
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Run</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th className="text-right">Gross</Table.Th>
              <Table.Th className="text-right">Net</Table.Th>
              <Table.Th>Distributed</Table.Th>
              <Table.Th className="text-right">Action</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((row) => {
              const isTarget = targetRunId === row.run_id || targetItemId === row.id;
              return (
                <Table.Tr key={row.id} className={isTarget ? "bg-primary/5" : undefined}>
                  <Table.Td>
                    <div className="font-medium">{row.run_name}</div>
                    <div className="text-xs text-slate-500">{row.month}/{row.year}</div>
                  </Table.Td>
                  <Table.Td className="capitalize">{String(row.status || "").replaceAll("_", " ")}</Table.Td>
                  <Table.Td className="text-right">{formatMoney(row.gross_pay)}</Table.Td>
                  <Table.Td className="text-right">{formatMoney(row.net_pay)}</Table.Td>
                  <Table.Td>
                    {row.latest_distribution ? (
                      <div>
                        <div className="capitalize">{String(row.latest_distribution.status || "").replaceAll("_", " ")}</div>
                        <div className="text-xs text-slate-500">{formatDisplayDate(row.latest_distribution.created_at)}</div>
                      </div>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </Table.Td>
                  <Table.Td className="text-right">
                    <Button size="sm" variant="outline-primary" onClick={() => void download(row.run_id, row.id)}>
                      <Lucide icon="FileText" className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </Table.Td>
                </Table.Tr>
              );
            })}
            {!rows.length ? (
              <Table.Tr>
                <Table.Td colSpan={6} className="text-center text-slate-500 py-10">
                  No payslips available yet.
                </Table.Td>
              </Table.Tr>
            ) : null}
          </Table.Tbody>
        </Table>
      </div>
    </>
  );
}

export default MyPayslipsPage;
