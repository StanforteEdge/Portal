import { useEffect, useMemo, useState } from "react";
import Button from "@/components/Base/Button";
import Table from "@/components/Base/Table";
import Lucide from "@/components/Base/Lucide";
import { Dialog } from "@/components/Base/Headless";
import { FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import {
  createFinanceReceipt,
  createFinanceSalesInvoice,
  listFinanceChartAccounts,
  listFinanceCustomers,
  listFinanceFunds,
  listFinanceGrants,
} from "@/services/financeAccounting";
import { getFinanceReceivables } from "@/services/financeReporting";
import { listFinanceAccounts } from "@/services/finance";
import { listOrganizations } from "@/services/organizations";
import { listTeams } from "@/services/teams";
import { formatDisplayDate, formatMoney } from "@/utils/formatting";

type InvoiceLine = {
  chart_account_id: string;
  description: string;
  quantity: string;
  unit_price: string;
};

const emptyInvoiceLine: InvoiceLine = {
  chart_account_id: "",
  description: "",
  quantity: "1",
  unit_price: "",
};

const emptyInvoiceForm = {
  invoice_number: "",
  customer_id: "",
  organization_id: "",
  team_id: "",
  fund_id: "",
  grant_id: "",
  invoice_date: new Date().toISOString().slice(0, 10),
  due_date: "",
  currency: "NGN",
  tax_amount: "0",
  notes: "",
  lines: [{ ...emptyInvoiceLine }],
};

const emptyReceiptForm = {
  sales_invoice_id: "",
  customer_id: "",
  account_id: "",
  amount: "",
  received_at: new Date().toISOString().slice(0, 10),
  currency: "NGN",
  receipt_number: "",
  reference: "",
  notes: "",
};

function FinanceReceivablesPage() {
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [report, setReport] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [incomeAccounts, setIncomeAccounts] = useState<any[]>([]);
  const [funds, setFunds] = useState<any[]>([]);
  const [grants, setGrants] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [filters, setFilters] = useState({ from: "", to: "", organization_id: "", team_id: "" });
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [savingReceipt, setSavingReceipt] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState(emptyInvoiceForm);
  const [receiptForm, setReceiptForm] = useState(emptyReceiptForm);
  const filteredGrantOptions = invoiceForm.fund_id
    ? grants.filter((grant) => String(grant.fund?.id || "") === invoiceForm.fund_id)
    : grants;

  const load = async () => {
    try {
      setLoading(true);
      const params = {
        ...(filters.from ? { from: filters.from } : {}),
        ...(filters.to ? { to: filters.to } : {}),
        ...(filters.organization_id ? { organization_id: filters.organization_id } : {}),
        ...(filters.team_id ? { team_id: filters.team_id } : {}),
      };
      const [reportData, customerRows, accountRows, chartRows, organizationRows, teamRows, fundRows, grantRows] = await Promise.all([
        getFinanceReceivables(params),
        listFinanceCustomers(),
        listFinanceAccounts({ is_active: true }),
        listFinanceChartAccounts({ type: "income", is_active: true }),
        listOrganizations({ is_active: true }).catch(() => []),
        listTeams({ active_only: true }).catch(() => []),
        listFinanceFunds({ is_active: true }).catch(() => []),
        listFinanceGrants({ status: "active" }).catch(() => []),
      ]);
      setReport(reportData);
      setCustomers(customerRows);
      setAccounts(accountRows.filter((row) => row.is_active));
      setIncomeAccounts(chartRows.filter((row) => row.type === "income" && row.is_active));
      setOrganizations(organizationRows);
      setTeams(teamRows);
      setFunds(fundRows);
      setGrants(grantRows);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load receivables." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const totalDraftInvoice = useMemo(
    () =>
      invoiceForm.lines.reduce((sum, line) => {
        const quantity = Number(line.quantity || 0);
        const unitPrice = Number(line.unit_price || 0);
        return sum + quantity * unitPrice;
      }, 0) + Number(invoiceForm.tax_amount || 0),
    [invoiceForm.lines, invoiceForm.tax_amount]
  );

  const updateLine = (index: number, key: keyof InvoiceLine, value: string) => {
    setInvoiceForm((prev) => ({
      ...prev,
      lines: prev.lines.map((line, lineIndex) => (lineIndex === index ? { ...line, [key]: value } : line)),
    }));
  };

  const addLine = () => setInvoiceForm((prev) => ({ ...prev, lines: [...prev.lines, { ...emptyInvoiceLine }] }));

  const removeLine = (index: number) =>
    setInvoiceForm((prev) => ({
      ...prev,
      lines: prev.lines.length === 1 ? prev.lines : prev.lines.filter((_, lineIndex) => lineIndex !== index),
    }));

  const openReceiptModal = (item?: any) => {
    setReceiptForm({
      ...emptyReceiptForm,
      sales_invoice_id: item?.id || "",
      customer_id: "",
      amount: item?.outstanding_amount ? String(item.outstanding_amount) : "",
    });
    setShowReceiptModal(true);
  };

  const saveInvoice = async () => {
    try {
      setSavingInvoice(true);
      await createFinanceSalesInvoice({
        ...invoiceForm,
        organization_id: invoiceForm.organization_id || undefined,
        team_id: invoiceForm.team_id || undefined,
        fund_id: invoiceForm.fund_id || undefined,
        grant_id: invoiceForm.grant_id || undefined,
        due_date: invoiceForm.due_date || undefined,
        tax_amount: Number(invoiceForm.tax_amount || 0),
        lines: invoiceForm.lines.map((line) => ({
          ...line,
          quantity: Number(line.quantity || 0),
          unit_price: Number(line.unit_price || 0),
        })),
      });
      setShowInvoiceModal(false);
      setInvoiceForm(emptyInvoiceForm);
      setNotice({ tone: "success", message: "Sales invoice created." });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to create sales invoice." });
    } finally {
      setSavingInvoice(false);
    }
  };

  const saveReceipt = async () => {
    try {
      setSavingReceipt(true);
      await createFinanceReceipt({
        ...receiptForm,
        sales_invoice_id: receiptForm.sales_invoice_id || undefined,
        customer_id: receiptForm.customer_id || undefined,
        amount: Number(receiptForm.amount || 0),
        reference: receiptForm.reference || undefined,
        notes: receiptForm.notes || undefined,
        receipt_number: receiptForm.receipt_number || undefined,
      });
      setShowReceiptModal(false);
      setReceiptForm(emptyReceiptForm);
      setNotice({ tone: "success", message: "Receipt recorded." });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to record receipt." });
    } finally {
      setSavingReceipt(false);
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Receivables</h2>
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => setShowInvoiceModal(true)}>
            <Lucide icon="Plus" className="w-4 h-4 mr-1" /> New Invoice
          </Button>
          <Button variant="outline-primary" onClick={() => openReceiptModal()}>
            <Lucide icon="CircleDollarSign" className="w-4 h-4 mr-1" /> Record Receipt
          </Button>
          <Button variant="outline-secondary" onClick={() => void load()} disabled={loading}>
            <Lucide icon="Undo2" className="w-4 h-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="grid grid-cols-12 gap-4 mt-5 box p-5">
        <div className="col-span-12 md:col-span-3">
          <FormLabel>From</FormLabel>
          <FormInput type="date" value={filters.from} onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))} />
        </div>
        <div className="col-span-12 md:col-span-3">
          <FormLabel>To</FormLabel>
          <FormInput type="date" value={filters.to} onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))} />
        </div>
        <div className="col-span-12 md:col-span-3">
          <FormLabel>Organization</FormLabel>
          <FormSelect value={filters.organization_id} onChange={(e) => setFilters((prev) => ({ ...prev, organization_id: e.target.value }))}>
            <option value="">All organizations</option>
            {organizations.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
          </FormSelect>
        </div>
        <div className="col-span-12 md:col-span-2">
          <FormLabel>Team</FormLabel>
          <FormSelect value={filters.team_id} onChange={(e) => setFilters((prev) => ({ ...prev, team_id: e.target.value }))}>
            <option value="">All teams</option>
            {teams.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
          </FormSelect>
        </div>
        <div className="col-span-12 md:col-span-1 flex items-end">
          <Button variant="primary" className="w-full" onClick={() => void load()}>
            <Lucide icon="Search" className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 mt-5">
        <div className="col-span-12 md:col-span-4 intro-y">
          <div className="box p-5">
            <div className="text-slate-500">Outstanding Receivables</div>
            <div className="mt-2 text-2xl font-medium">{formatMoney(report?.summary?.total_outstanding)}</div>
          </div>
        </div>
        <div className="col-span-12 md:col-span-4 intro-y">
          <div className="box p-5">
            <div className="text-slate-500">Overdue Invoices</div>
            <div className="mt-2 text-2xl font-medium">{report?.summary?.overdue_count ?? 0}</div>
          </div>
        </div>
        <div className="col-span-12 md:col-span-4 intro-y">
          <div className="box p-5">
            <div className="text-slate-500">Period</div>
            <div className="mt-2 text-base font-medium">{report?.period?.label || "Custom range"}</div>
          </div>
        </div>
      </div>

      <div className="box p-5 mt-5">
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Invoice</Table.Th>
              <Table.Th>Customer</Table.Th>
              <Table.Th>Issue Date</Table.Th>
              <Table.Th>Due Date</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th className="text-right">Outstanding</Table.Th>
              <Table.Th className="text-right">Action</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {(report?.items || []).map((item: any) => (
              <Table.Tr key={item.id}>
                <Table.Td>
                  <div className="font-medium">{item.document_number}</div>
                  <div className="text-xs text-slate-500">{item.organization || "-"} {item.team ? `• ${item.team}` : ""}</div>
                </Table.Td>
                <Table.Td>{item.party_name}</Table.Td>
                <Table.Td>{formatDisplayDate(item.issue_date)}</Table.Td>
                <Table.Td>{formatDisplayDate(item.due_date)}</Table.Td>
                <Table.Td>
                  <div className="capitalize">{String(item.status || "").replaceAll("_", " ")}</div>
                  <div className="text-xs text-slate-500">{item.aging_bucket}</div>
                </Table.Td>
                <Table.Td className="text-right">{formatMoney(item.outstanding_amount, "-", item.currency)}</Table.Td>
                <Table.Td className="text-right">
                  <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={() => openReceiptModal(item)}
                    disabled={Number(item.outstanding_amount || 0) <= 0}
                  >
                    <Lucide icon="CircleDollarSign" className="w-4 h-4 mr-1" /> Receipt
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
            {!report?.items?.length ? (
              <Table.Tr>
                <Table.Td colSpan={7} className="text-center text-slate-500">
                  No receivables found.
                </Table.Td>
              </Table.Tr>
            ) : null}
          </Table.Tbody>
        </Table>
      </div>

      <Dialog open={showInvoiceModal} onClose={() => !savingInvoice && setShowInvoiceModal(false)}>
        <Dialog.Panel className="p-5 max-w-5xl">
          <div className="text-lg font-medium">New Sales Invoice</div>
          <div className="grid grid-cols-12 gap-4 mt-5">
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Invoice Number</FormLabel>
              <FormInput value={invoiceForm.invoice_number} onChange={(e) => setInvoiceForm((prev) => ({ ...prev, invoice_number: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Customer</FormLabel>
              <FormSelect value={invoiceForm.customer_id} onChange={(e) => setInvoiceForm((prev) => ({ ...prev, customer_id: e.target.value }))}>
                <option value="">Select customer</option>
                {customers.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
              </FormSelect>
            </div>
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Currency</FormLabel>
              <FormInput value={invoiceForm.currency} onChange={(e) => setInvoiceForm((prev) => ({ ...prev, currency: e.target.value.toUpperCase() }))} />
            </div>
            <div className="col-span-12 md:col-span-3">
              <FormLabel>Invoice Date</FormLabel>
              <FormInput type="date" value={invoiceForm.invoice_date} onChange={(e) => setInvoiceForm((prev) => ({ ...prev, invoice_date: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-3">
              <FormLabel>Due Date</FormLabel>
              <FormInput type="date" value={invoiceForm.due_date} onChange={(e) => setInvoiceForm((prev) => ({ ...prev, due_date: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-3">
              <FormLabel>Organization</FormLabel>
              <FormSelect value={invoiceForm.organization_id} onChange={(e) => setInvoiceForm((prev) => ({ ...prev, organization_id: e.target.value }))}>
                <option value="">Select organization</option>
                {organizations.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
              </FormSelect>
            </div>
            <div className="col-span-12 md:col-span-3">
              <FormLabel>Team</FormLabel>
              <FormSelect value={invoiceForm.team_id} onChange={(e) => setInvoiceForm((prev) => ({ ...prev, team_id: e.target.value }))}>
                <option value="">Select team</option>
                {teams.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
              </FormSelect>
            </div>
            <div className="col-span-12 md:col-span-3">
              <FormLabel>Fund</FormLabel>
              <FormSelect value={invoiceForm.fund_id} onChange={(e) => setInvoiceForm((prev) => ({ ...prev, fund_id: e.target.value, grant_id: "" }))}>
                <option value="">No specific fund</option>
                {funds.map((row) => <option key={row.id} value={row.id}>{row.code ? `${row.code} - ` : ""}{row.name}</option>)}
              </FormSelect>
            </div>
            <div className="col-span-12 md:col-span-3">
              <FormLabel>Grant / Donor Line</FormLabel>
              <FormSelect value={invoiceForm.grant_id} onChange={(e) => setInvoiceForm((prev) => ({ ...prev, grant_id: e.target.value }))}>
                <option value="">No specific grant</option>
                {filteredGrantOptions.map((row) => <option key={row.id} value={row.id}>{row.code ? `${row.code} - ` : ""}{row.name}</option>)}
              </FormSelect>
            </div>
          </div>

          <div className="mt-5 border rounded-md p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">Invoice Lines</div>
              <Button size="sm" variant="outline-secondary" onClick={addLine}>
                <Lucide icon="Plus" className="w-4 h-4 mr-1" /> Add Line
              </Button>
            </div>
            {invoiceForm.lines.map((line, index) => (
              <div key={`${index}-${line.chart_account_id}`} className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-12 md:col-span-3">
                  <FormLabel>Income Account</FormLabel>
                  <FormSelect value={line.chart_account_id} onChange={(e) => updateLine(index, "chart_account_id", e.target.value)}>
                    <option value="">Select account</option>
                    {incomeAccounts.map((row) => <option key={row.id} value={row.id}>{row.code} - {row.name}</option>)}
                  </FormSelect>
                </div>
                <div className="col-span-12 md:col-span-5">
                  <FormLabel>Description</FormLabel>
                  <FormInput value={line.description} onChange={(e) => updateLine(index, "description", e.target.value)} />
                </div>
                <div className="col-span-6 md:col-span-2">
                  <FormLabel>Qty</FormLabel>
                  <FormInput type="number" min="0" value={line.quantity} onChange={(e) => updateLine(index, "quantity", e.target.value)} />
                </div>
                <div className="col-span-6 md:col-span-1">
                  <FormLabel>Rate</FormLabel>
                  <FormInput type="number" min="0" value={line.unit_price} onChange={(e) => updateLine(index, "unit_price", e.target.value)} />
                </div>
                <div className="col-span-12 md:col-span-1 flex md:justify-end">
                  <Button size="sm" variant="soft-danger" onClick={() => removeLine(index)}>
                    <Lucide icon="Trash2" className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-12 gap-4 mt-4">
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Tax Amount</FormLabel>
              <FormInput type="number" min="0" value={invoiceForm.tax_amount} onChange={(e) => setInvoiceForm((prev) => ({ ...prev, tax_amount: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-8">
              <FormLabel>Notes</FormLabel>
              <FormTextarea rows={3} value={invoiceForm.notes} onChange={(e) => setInvoiceForm((prev) => ({ ...prev, notes: e.target.value }))} />
            </div>
          </div>

          <div className="mt-4 text-right text-base font-medium">Invoice Total: {formatMoney(totalDraftInvoice, "-", invoiceForm.currency)}</div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline-secondary" onClick={() => setShowInvoiceModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => void saveInvoice()} disabled={savingInvoice}>
              {savingInvoice ? "Saving..." : "Create Invoice"}
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>

      <Dialog open={showReceiptModal} onClose={() => !savingReceipt && setShowReceiptModal(false)}>
        <Dialog.Panel className="p-5">
          <div className="text-lg font-medium">Record Receipt</div>
          <div className="grid grid-cols-12 gap-4 mt-5">
            <div className="col-span-12 md:col-span-6">
              <FormLabel>Invoice</FormLabel>
              <FormSelect value={receiptForm.sales_invoice_id} onChange={(e) => setReceiptForm((prev) => ({ ...prev, sales_invoice_id: e.target.value }))}>
                <option value="">Select invoice</option>
                {(report?.items || []).map((item: any) => <option key={item.id} value={item.id}>{item.document_number} - {item.party_name}</option>)}
              </FormSelect>
            </div>
            <div className="col-span-12 md:col-span-6">
              <FormLabel>Customer</FormLabel>
              <FormSelect value={receiptForm.customer_id} onChange={(e) => setReceiptForm((prev) => ({ ...prev, customer_id: e.target.value }))}>
                <option value="">Optional customer</option>
                {customers.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
              </FormSelect>
            </div>
            <div className="col-span-12 md:col-span-6">
              <FormLabel>Paid Into</FormLabel>
              <FormSelect value={receiptForm.account_id} onChange={(e) => setReceiptForm((prev) => ({ ...prev, account_id: e.target.value }))}>
                <option value="">Select account</option>
                {accounts.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
              </FormSelect>
            </div>
            <div className="col-span-12 md:col-span-3">
              <FormLabel>Amount</FormLabel>
              <FormInput type="number" min="0" value={receiptForm.amount} onChange={(e) => setReceiptForm((prev) => ({ ...prev, amount: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-3">
              <FormLabel>Received At</FormLabel>
              <FormInput type="date" value={receiptForm.received_at} onChange={(e) => setReceiptForm((prev) => ({ ...prev, received_at: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Receipt Number</FormLabel>
              <FormInput value={receiptForm.receipt_number} onChange={(e) => setReceiptForm((prev) => ({ ...prev, receipt_number: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Reference</FormLabel>
              <FormInput value={receiptForm.reference} onChange={(e) => setReceiptForm((prev) => ({ ...prev, reference: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Currency</FormLabel>
              <FormInput value={receiptForm.currency} onChange={(e) => setReceiptForm((prev) => ({ ...prev, currency: e.target.value.toUpperCase() }))} />
            </div>
            <div className="col-span-12">
              <FormLabel>Notes</FormLabel>
              <FormTextarea rows={3} value={receiptForm.notes} onChange={(e) => setReceiptForm((prev) => ({ ...prev, notes: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline-secondary" onClick={() => setShowReceiptModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => void saveReceipt()} disabled={savingReceipt}>
              {savingReceipt ? "Saving..." : "Record Receipt"}
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>
    </>
  );
}

export default FinanceReceivablesPage;
