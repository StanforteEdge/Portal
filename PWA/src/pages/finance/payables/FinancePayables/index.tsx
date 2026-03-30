import { useEffect, useMemo, useState } from "react";
import Button from "@/components/Base/Button";
import Table from "@/components/Base/Table";
import Lucide from "@/components/Base/Lucide";
import { Dialog } from "@/components/Base/Headless";
import { FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import {
  createFinanceBill,
  createFinanceVendorPayment,
  listFinanceChartAccounts,
  listFinanceFunds,
  listFinanceGrants,
  listFinanceVendors,
} from "@/services/financeAccounting";
import { getFinancePayables } from "@/services/financeReporting";
import { listFinanceAccounts } from "@/services/finance";
import { listOrganizations } from "@/services/organizations";
import { listTeams } from "@/services/teams";
import { formatDisplayDate, formatMoney } from "@/utils/formatting";

type BillLine = {
  chart_account_id: string;
  description: string;
  quantity: string;
  unit_price: string;
};

const emptyBillLine: BillLine = {
  chart_account_id: "",
  description: "",
  quantity: "1",
  unit_price: "",
};

const emptyBillForm = {
  bill_number: "",
  vendor_id: "",
  organization_id: "",
  team_id: "",
  fund_id: "",
  grant_id: "",
  bill_date: new Date().toISOString().slice(0, 10),
  due_date: "",
  currency: "NGN",
  tax_amount: "0",
  notes: "",
  lines: [{ ...emptyBillLine }],
};

const emptyPaymentForm = {
  bill_id: "",
  vendor_id: "",
  account_id: "",
  amount: "",
  paid_at: new Date().toISOString().slice(0, 10),
  currency: "NGN",
  payment_number: "",
  reference: "",
  notes: "",
};

function FinancePayablesPage() {
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [report, setReport] = useState<any>(null);
  const [vendors, setVendors] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [expenseAccounts, setExpenseAccounts] = useState<any[]>([]);
  const [funds, setFunds] = useState<any[]>([]);
  const [grants, setGrants] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [filters, setFilters] = useState({ from: "", to: "", organization_id: "", team_id: "" });
  const [showBillModal, setShowBillModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [savingBill, setSavingBill] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [billForm, setBillForm] = useState(emptyBillForm);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
  const filteredGrantOptions = billForm.fund_id
    ? grants.filter((grant) => String(grant.fund?.id || "") === billForm.fund_id)
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
      const [reportData, vendorRows, accountRows, chartRows, organizationRows, teamRows, fundRows, grantRows] = await Promise.all([
        getFinancePayables(params),
        listFinanceVendors(),
        listFinanceAccounts({ is_active: true }),
        listFinanceChartAccounts({ type: "expense", is_active: true }),
        listOrganizations({ is_active: true }).catch(() => []),
        listTeams({ active_only: true }).catch(() => []),
        listFinanceFunds({ is_active: true }).catch(() => []),
        listFinanceGrants({ status: "active" }).catch(() => []),
      ]);
      setReport(reportData);
      setVendors(vendorRows);
      setAccounts(accountRows.filter((row) => row.is_active));
      setExpenseAccounts(chartRows.filter((row) => row.type === "expense" && row.is_active));
      setOrganizations(organizationRows);
      setTeams(teamRows);
      setFunds(fundRows);
      setGrants(grantRows);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load payables." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const totalDraftBill = useMemo(
    () =>
      billForm.lines.reduce((sum, line) => {
        const quantity = Number(line.quantity || 0);
        const unitPrice = Number(line.unit_price || 0);
        return sum + quantity * unitPrice;
      }, 0) + Number(billForm.tax_amount || 0),
    [billForm.lines, billForm.tax_amount]
  );

  const updateLine = (index: number, key: keyof BillLine, value: string) => {
    setBillForm((prev) => ({
      ...prev,
      lines: prev.lines.map((line, lineIndex) => (lineIndex === index ? { ...line, [key]: value } : line)),
    }));
  };

  const addLine = () => setBillForm((prev) => ({ ...prev, lines: [...prev.lines, { ...emptyBillLine }] }));

  const removeLine = (index: number) =>
    setBillForm((prev) => ({
      ...prev,
      lines: prev.lines.length === 1 ? prev.lines : prev.lines.filter((_, lineIndex) => lineIndex !== index),
    }));

  const openPaymentModal = (item?: any) => {
    setPaymentForm({
      ...emptyPaymentForm,
      bill_id: item?.id || "",
      vendor_id: "",
      amount: item?.outstanding_amount ? String(item.outstanding_amount) : "",
    });
    setShowPaymentModal(true);
  };

  const saveBill = async () => {
    try {
      setSavingBill(true);
      await createFinanceBill({
        ...billForm,
        organization_id: billForm.organization_id || undefined,
        team_id: billForm.team_id || undefined,
        fund_id: billForm.fund_id || undefined,
        grant_id: billForm.grant_id || undefined,
        due_date: billForm.due_date || undefined,
        tax_amount: Number(billForm.tax_amount || 0),
        lines: billForm.lines.map((line) => ({
          ...line,
          quantity: Number(line.quantity || 0),
          unit_price: Number(line.unit_price || 0),
        })),
      });
      setShowBillModal(false);
      setBillForm(emptyBillForm);
      setNotice({ tone: "success", message: "Vendor bill created." });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to create vendor bill." });
    } finally {
      setSavingBill(false);
    }
  };

  const savePayment = async () => {
    try {
      setSavingPayment(true);
      await createFinanceVendorPayment({
        ...paymentForm,
        bill_id: paymentForm.bill_id || undefined,
        vendor_id: paymentForm.vendor_id || undefined,
        amount: Number(paymentForm.amount || 0),
        reference: paymentForm.reference || undefined,
        notes: paymentForm.notes || undefined,
        payment_number: paymentForm.payment_number || undefined,
      });
      setShowPaymentModal(false);
      setPaymentForm(emptyPaymentForm);
      setNotice({ tone: "success", message: "Vendor payment recorded." });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to record vendor payment." });
    } finally {
      setSavingPayment(false);
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Payables</h2>
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => setShowBillModal(true)}>
            <Lucide icon="Plus" className="w-4 h-4 mr-1" /> New Bill
          </Button>
          <Button variant="outline-primary" onClick={() => openPaymentModal()}>
            <Lucide icon="CircleDollarSign" className="w-4 h-4 mr-1" /> Record Payment
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
          <Button variant="primary" className="w-full" onClick={() => void load()} aria-label="Apply payables filters" title="Apply filters">
            <Lucide icon="Search" className="w-4 h-4 mr-1" />
            Apply Filters
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 mt-5">
        <div className="col-span-12 md:col-span-4 intro-y">
          <div className="box p-5">
            <div className="text-slate-500">Outstanding Payables</div>
            <div className="mt-2 text-2xl font-medium">{formatMoney(report?.summary?.total_outstanding)}</div>
          </div>
        </div>
        <div className="col-span-12 md:col-span-4 intro-y">
          <div className="box p-5">
            <div className="text-slate-500">Overdue Bills</div>
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
              <Table.Th>Bill</Table.Th>
              <Table.Th>Vendor</Table.Th>
              <Table.Th>Bill Date</Table.Th>
              <Table.Th>Due Date</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th className="text-right">Outstanding</Table.Th>
              <Table.Th className="text-right">Action</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {(report?.items || []).map((item: any) => (
              <Table.Tr key={item.id}>
                <Table.RowHeader>
                  {item.document_number}
                  <div className="text-xs text-slate-500">{item.organization || "-"} {item.team ? `• ${item.team}` : ""}</div>
                </Table.RowHeader>
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
                    aria-label={`Pay vendor bill ${item.document_number}`}
                    title="Record payment"
                    onClick={() => openPaymentModal(item)}
                    disabled={Number(item.outstanding_amount || 0) <= 0}
                  >
                    <Lucide icon="CircleDollarSign" className="w-4 h-4 mr-1" /> Pay
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
            {!report?.items?.length ? (
              <Table.Tr>
                <Table.Td colSpan={7} className="text-center text-slate-500">
                  No payables found.
                </Table.Td>
              </Table.Tr>
            ) : null}
          </Table.Tbody>
        </Table>
      </div>

      <Dialog open={showBillModal} onClose={() => !savingBill && setShowBillModal(false)}>
        <Dialog.Panel className="p-5 max-w-5xl">
          <div className="text-lg font-medium">New Vendor Bill</div>
          <div className="grid grid-cols-12 gap-4 mt-5">
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Bill Number</FormLabel>
              <FormInput value={billForm.bill_number} onChange={(e) => setBillForm((prev) => ({ ...prev, bill_number: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Vendor</FormLabel>
              <FormSelect value={billForm.vendor_id} onChange={(e) => setBillForm((prev) => ({ ...prev, vendor_id: e.target.value }))}>
                <option value="">Select vendor</option>
                {vendors.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
              </FormSelect>
            </div>
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Currency</FormLabel>
              <FormInput value={billForm.currency} onChange={(e) => setBillForm((prev) => ({ ...prev, currency: e.target.value.toUpperCase() }))} />
            </div>
            <div className="col-span-12 md:col-span-3">
              <FormLabel>Bill Date</FormLabel>
              <FormInput type="date" value={billForm.bill_date} onChange={(e) => setBillForm((prev) => ({ ...prev, bill_date: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-3">
              <FormLabel>Due Date</FormLabel>
              <FormInput type="date" value={billForm.due_date} onChange={(e) => setBillForm((prev) => ({ ...prev, due_date: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-3">
              <FormLabel>Organization</FormLabel>
              <FormSelect value={billForm.organization_id} onChange={(e) => setBillForm((prev) => ({ ...prev, organization_id: e.target.value }))}>
                <option value="">Select organization</option>
                {organizations.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
              </FormSelect>
            </div>
            <div className="col-span-12 md:col-span-3">
              <FormLabel>Team</FormLabel>
              <FormSelect value={billForm.team_id} onChange={(e) => setBillForm((prev) => ({ ...prev, team_id: e.target.value }))}>
                <option value="">Select team</option>
                {teams.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
              </FormSelect>
            </div>
            <div className="col-span-12 md:col-span-3">
              <FormLabel>Fund</FormLabel>
              <FormSelect value={billForm.fund_id} onChange={(e) => setBillForm((prev) => ({ ...prev, fund_id: e.target.value, grant_id: "" }))}>
                <option value="">No specific fund</option>
                {funds.map((row) => <option key={row.id} value={row.id}>{row.code ? `${row.code} - ` : ""}{row.name}</option>)}
              </FormSelect>
            </div>
            <div className="col-span-12 md:col-span-3">
              <FormLabel>Grant / Donor Line</FormLabel>
              <FormSelect value={billForm.grant_id} onChange={(e) => setBillForm((prev) => ({ ...prev, grant_id: e.target.value }))}>
                <option value="">No specific grant</option>
                {filteredGrantOptions.map((row) => <option key={row.id} value={row.id}>{row.code ? `${row.code} - ` : ""}{row.name}</option>)}
              </FormSelect>
            </div>
          </div>

          <div className="mt-5 border rounded-md p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">Bill Lines</div>
              <Button size="sm" variant="outline-secondary" onClick={addLine}>
                <Lucide icon="Plus" className="w-4 h-4 mr-1" /> Add Line
              </Button>
            </div>
            {billForm.lines.map((line, index) => (
              <div key={`${index}-${line.chart_account_id}`} className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-12 md:col-span-3">
                  <FormLabel>Expense Account</FormLabel>
                  <FormSelect value={line.chart_account_id} onChange={(e) => updateLine(index, "chart_account_id", e.target.value)}>
                    <option value="">Select account</option>
                    {expenseAccounts.map((row) => <option key={row.id} value={row.id}>{row.code} - {row.name}</option>)}
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
                  <Button
                    size="sm"
                    variant="soft-danger"
                    aria-label={`Remove bill line ${index + 1}`}
                    title="Remove line"
                    onClick={() => removeLine(index)}
                  >
                    <Lucide icon="Trash2" className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-12 gap-4 mt-4">
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Tax Amount</FormLabel>
              <FormInput type="number" min="0" value={billForm.tax_amount} onChange={(e) => setBillForm((prev) => ({ ...prev, tax_amount: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-8">
              <FormLabel>Notes</FormLabel>
              <FormTextarea rows={3} value={billForm.notes} onChange={(e) => setBillForm((prev) => ({ ...prev, notes: e.target.value }))} />
            </div>
          </div>

          <div className="mt-4 text-right text-base font-medium">Bill Total: {formatMoney(totalDraftBill, "-", billForm.currency)}</div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline-secondary" onClick={() => setShowBillModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => void saveBill()} disabled={savingBill}>
              {savingBill ? "Saving..." : "Create Bill"}
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>

      <Dialog open={showPaymentModal} onClose={() => !savingPayment && setShowPaymentModal(false)}>
        <Dialog.Panel className="p-5">
          <div className="text-lg font-medium">Record Vendor Payment</div>
          <div className="grid grid-cols-12 gap-4 mt-5">
            <div className="col-span-12 md:col-span-6">
              <FormLabel>Bill</FormLabel>
              <FormSelect value={paymentForm.bill_id} onChange={(e) => setPaymentForm((prev) => ({ ...prev, bill_id: e.target.value }))}>
                <option value="">Select bill</option>
                {(report?.items || []).map((item: any) => <option key={item.id} value={item.id}>{item.document_number} - {item.party_name}</option>)}
              </FormSelect>
            </div>
            <div className="col-span-12 md:col-span-6">
              <FormLabel>Vendor</FormLabel>
              <FormSelect value={paymentForm.vendor_id} onChange={(e) => setPaymentForm((prev) => ({ ...prev, vendor_id: e.target.value }))}>
                <option value="">Optional vendor</option>
                {vendors.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
              </FormSelect>
            </div>
            <div className="col-span-12 md:col-span-6">
              <FormLabel>Paid From</FormLabel>
              <FormSelect value={paymentForm.account_id} onChange={(e) => setPaymentForm((prev) => ({ ...prev, account_id: e.target.value }))}>
                <option value="">Select account</option>
                {accounts.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
              </FormSelect>
            </div>
            <div className="col-span-12 md:col-span-3">
              <FormLabel>Amount</FormLabel>
              <FormInput type="number" min="0" value={paymentForm.amount} onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-3">
              <FormLabel>Paid At</FormLabel>
              <FormInput type="date" value={paymentForm.paid_at} onChange={(e) => setPaymentForm((prev) => ({ ...prev, paid_at: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Payment Number</FormLabel>
              <FormInput value={paymentForm.payment_number} onChange={(e) => setPaymentForm((prev) => ({ ...prev, payment_number: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Reference</FormLabel>
              <FormInput value={paymentForm.reference} onChange={(e) => setPaymentForm((prev) => ({ ...prev, reference: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Currency</FormLabel>
              <FormInput value={paymentForm.currency} onChange={(e) => setPaymentForm((prev) => ({ ...prev, currency: e.target.value.toUpperCase() }))} />
            </div>
            <div className="col-span-12">
              <FormLabel>Notes</FormLabel>
              <FormTextarea rows={3} value={paymentForm.notes} onChange={(e) => setPaymentForm((prev) => ({ ...prev, notes: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline-secondary" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => void savePayment()} disabled={savingPayment}>
              {savingPayment ? "Saving..." : "Record Payment"}
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>
    </>
  );
}

export default FinancePayablesPage;
