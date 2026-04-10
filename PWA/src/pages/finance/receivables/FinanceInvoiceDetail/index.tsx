import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import Table from "@/components/Base/Table";
import { Dialog } from "@/components/Base/Headless";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import {
  generateFinanceSalesInvoicePdf,
  getFinanceCustomerStatement,
  getFinanceSalesInvoice,
  remindFinanceSalesInvoice,
  sendFinanceSalesInvoice,
  voidFinanceSalesInvoice,
} from "@/services/financeAccounting";
import { formatDisplayDate, formatMoney, statusBadgeClass } from "@/utils/formatting";

function downloadBase64File(fileName: string, mimeType: string, contentBase64: string) {
  const bytes = atob(contentBase64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) arr[i] = bytes.charCodeAt(i);
  const blob = new Blob([arr], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function FinanceInvoiceDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<any | null>(null);
  const [statement, setStatement] = useState<any | null>(null);
  const [statementOpen, setStatementOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getFinanceSalesInvoice(id);
      setInvoice(data);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load invoice." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) void load();
  }, [id]);

  const canSend = invoice?.status === "draft";
  const canVoid = invoice?.status === "draft";
  const canRemind = invoice && !["draft", "void", "paid"].includes(String(invoice.status));

  const receiptTotal = useMemo(
    () => (invoice?.receipts || []).reduce((sum: number, row: any) => sum + Number(row.allocated_amount ?? row.amount ?? 0), 0),
    [invoice?.receipts]
  );

  const runSend = async () => {
    try {
      setBusyAction("send");
      await sendFinanceSalesInvoice(id);
      setNotice({ tone: "success", message: "Invoice sent." });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to send invoice." });
    } finally {
      setBusyAction("");
    }
  };

  const runRemind = async () => {
    try {
      setBusyAction("remind");
      await remindFinanceSalesInvoice(id);
      setNotice({ tone: "success", message: "Invoice reminder sent." });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to send reminder." });
    } finally {
      setBusyAction("");
    }
  };

  const runVoid = async () => {
    try {
      setBusyAction("void");
      await voidFinanceSalesInvoice(id);
      setNotice({ tone: "success", message: "Invoice voided." });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to void invoice." });
    } finally {
      setBusyAction("");
    }
  };

  const runPdf = async () => {
    try {
      setBusyAction("pdf");
      const file = await generateFinanceSalesInvoicePdf(id);
      downloadBase64File(file.file_name, file.mime_type, file.content_base64);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to generate invoice PDF." });
    } finally {
      setBusyAction("");
    }
  };

  const openStatement = async () => {
    if (!invoice?.customer?.id) return;
    try {
      setBusyAction("statement");
      const data = await getFinanceCustomerStatement(invoice.customer.id);
      setStatement(data);
      setStatementOpen(true);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load customer statement." });
    } finally {
      setBusyAction("");
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y gap-3">
        <Button variant="outline-secondary" onClick={() => navigate("/appOld/finance/receivables")}>
          <Lucide icon="ChevronLeft" className="w-4 h-4 mr-1" /> Back
        </Button>
        <h2 className="mr-auto text-lg font-medium">Invoice Detail</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline-secondary" onClick={() => void runPdf()} disabled={busyAction === "pdf" || !invoice}>
            <Lucide icon="FileText" className="w-4 h-4 mr-1" /> PDF
          </Button>
          <Button variant="outline-secondary" onClick={() => void openStatement()} disabled={busyAction === "statement" || !invoice?.customer?.id}>
            <Lucide icon="BookOpen" className="w-4 h-4 mr-1" /> Statement
          </Button>
          {canSend ? (
            <Button variant="primary" onClick={() => void runSend()} disabled={busyAction === "send"}>
              <Lucide icon="Send" className="w-4 h-4 mr-1" /> Send
            </Button>
          ) : null}
          {canRemind ? (
            <Button variant="outline-primary" onClick={() => void runRemind()} disabled={busyAction === "remind"}>
              <Lucide icon="Bell" className="w-4 h-4 mr-1" /> Remind
            </Button>
          ) : null}
          {canVoid ? (
            <Button variant="soft-danger" onClick={() => void runVoid()} disabled={busyAction === "void"}>
              <Lucide icon="XCircle" className="w-4 h-4 mr-1" /> Void
            </Button>
          ) : null}
        </div>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="grid grid-cols-12 gap-4 mt-5">
        <div className="col-span-12 lg:col-span-8 box p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-slate-500 text-xs uppercase">Invoice Number</div>
              <div className="text-2xl font-medium mt-1">{invoice?.invoice_number || "-"}</div>
              <div className="text-slate-500 mt-2">{invoice?.customer?.name || "-"}</div>
              <div className="text-slate-500 text-sm">{invoice?.customer?.email || "-"}</div>
            </div>
            <div className={`capitalize px-3 py-1 rounded-full text-xs font-medium ${statusBadgeClass(String(invoice?.status || "draft"))}`}>
              {String(invoice?.status || "draft").replaceAll("_", " ")}
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 mt-5">
            <div className="col-span-12 md:col-span-4">
              <div className="text-slate-500 text-xs uppercase">Issue Date</div>
              <div className="mt-1 font-medium">{formatDisplayDate(invoice?.invoice_date)}</div>
            </div>
            <div className="col-span-12 md:col-span-4">
              <div className="text-slate-500 text-xs uppercase">Due Date</div>
              <div className="mt-1 font-medium">{formatDisplayDate(invoice?.due_date)}</div>
            </div>
            <div className="col-span-12 md:col-span-4">
              <div className="text-slate-500 text-xs uppercase">Currency</div>
              <div className="mt-1 font-medium">{invoice?.currency || "NGN"}</div>
            </div>
            <div className="col-span-12 md:col-span-4">
              <div className="text-slate-500 text-xs uppercase">Organization</div>
              <div className="mt-1 font-medium">{invoice?.organization?.name || "-"}</div>
            </div>
            <div className="col-span-12 md:col-span-4">
              <div className="text-slate-500 text-xs uppercase">Team</div>
              <div className="mt-1 font-medium">{invoice?.team?.name || "-"}</div>
            </div>
            <div className="col-span-12 md:col-span-4">
              <div className="text-slate-500 text-xs uppercase">Fund / Grant</div>
              <div className="mt-1 font-medium">{invoice?.grant?.name || invoice?.fund?.name || "-"}</div>
            </div>
          </div>

          <div className="mt-6">
            <div className="font-medium mb-3">Line Items</div>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Description</Table.Th>
                  <Table.Th>Account</Table.Th>
                  <Table.Th className="text-right">Qty</Table.Th>
                  <Table.Th className="text-right">Rate</Table.Th>
                  <Table.Th className="text-right">Amount</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(invoice?.lines || []).map((line: any) => (
                  <Table.Tr key={line.id}>
                    <Table.Td>{line.description}</Table.Td>
                    <Table.Td>{line.chart_account?.code} - {line.chart_account?.name}</Table.Td>
                    <Table.Td className="text-right">{line.quantity}</Table.Td>
                    <Table.Td className="text-right">{formatMoney(line.unit_price, "-", invoice?.currency)}</Table.Td>
                    <Table.Td className="text-right">{formatMoney(line.line_total, "-", invoice?.currency)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </div>

          {invoice?.notes ? (
            <div className="mt-5">
              <div className="text-slate-500 text-xs uppercase">Notes</div>
              <div className="mt-1 whitespace-pre-wrap">{invoice.notes}</div>
            </div>
          ) : null}
        </div>

        <div className="col-span-12 lg:col-span-4 box p-5">
          <div className="text-slate-500 text-xs uppercase">Summary</div>
          <div className="space-y-3 mt-4 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(invoice?.subtotal, "-", invoice?.currency)}</span></div>
            <div className="flex justify-between"><span>Tax</span><span>{formatMoney(invoice?.tax_amount, "-", invoice?.currency)}</span></div>
            <div className="flex justify-between font-medium"><span>Total</span><span>{formatMoney(invoice?.total_amount, "-", invoice?.currency)}</span></div>
            <div className="flex justify-between"><span>Paid</span><span>{formatMoney(invoice?.paid_amount, "-", invoice?.currency)}</span></div>
            <div className="flex justify-between text-base font-medium border-t pt-3"><span>Balance Due</span><span>{formatMoney(invoice?.outstanding_amount, "-", invoice?.currency)}</span></div>
          </div>

          <div className="mt-6 text-slate-500 text-xs uppercase">Receipts</div>
          <div className="mt-3 space-y-3">
            {(invoice?.receipts || []).map((receipt: any) => (
              <div key={`${receipt.id}-${receipt.receipt_number}`} className="border rounded-md p-3">
                <div className="flex justify-between gap-4">
                  <div>
                    <div className="font-medium">{receipt.receipt_number}</div>
                    <div className="text-xs text-slate-500">{formatDisplayDate(receipt.received_at)}</div>
                  </div>
                  <div className="text-right font-medium">{formatMoney(receipt.allocated_amount ?? receipt.amount, "-", invoice?.currency)}</div>
                </div>
                <div className="text-xs text-slate-500 mt-2">{receipt.account?.name || "-"}{receipt.reference ? ` • ${receipt.reference}` : ""}</div>
              </div>
            ))}
            {!(invoice?.receipts || []).length ? <div className="text-slate-500 text-sm">No receipts recorded.</div> : null}
          </div>

          <div className="mt-5 pt-4 border-t text-sm flex justify-between font-medium">
            <span>Allocated Receipts</span>
            <span>{formatMoney(receiptTotal, "-", invoice?.currency)}</span>
          </div>
        </div>
      </div>

      <Dialog open={statementOpen} onClose={() => setStatementOpen(false)}>
        <Dialog.Panel className="p-5 max-w-4xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-lg font-medium">Customer Statement</div>
              <div className="text-slate-500">{invoice?.customer?.name || "-"}</div>
            </div>
            <Button variant="outline-secondary" onClick={() => setStatementOpen(false)}>Close</Button>
          </div>
          <div className="box p-0 mt-5 overflow-x-auto">
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Document</Table.Th>
                  <Table.Th>Description</Table.Th>
                  <Table.Th className="text-right">Debit</Table.Th>
                  <Table.Th className="text-right">Credit</Table.Th>
                  <Table.Th className="text-right">Balance</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(statement?.items || []).map((row: any, index: number) => (
                  <Table.Tr key={`${row.type}-${row.document_number}-${index}`}>
                    <Table.Td>{formatDisplayDate(row.date)}</Table.Td>
                    <Table.Td>{row.document_number}</Table.Td>
                    <Table.Td>{row.description}</Table.Td>
                    <Table.Td className="text-right">{row.debit ? formatMoney(row.debit) : "-"}</Table.Td>
                    <Table.Td className="text-right">{row.credit ? formatMoney(row.credit) : "-"}</Table.Td>
                    <Table.Td className="text-right">{formatMoney(row.running_balance)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </div>
        </Dialog.Panel>
      </Dialog>
    </>
  );
}

export default FinanceInvoiceDetailPage;
