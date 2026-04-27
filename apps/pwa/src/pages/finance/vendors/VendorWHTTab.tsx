import { useState } from "react";
import {
  Button,
  Chip,
  Icon,
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
} from "@/shared";
import { financeApi, useCachedQuery } from "@/shared/lib/core";
import { formatCurrency } from "@stanforte/shared";
import { WHTCertificateModal } from "./WHTCertificateModal";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type Accrual = {
  id: string;
  voucher_number?: string;
  deduction_type?: string;
  deduction_type_name?: string;
  gross_amount?: number;
  wht_amount?: number;
  status?: string;
  date?: string;
  remittance_id?: string;
  remittance_reference?: string;
};

type DeductionType = {
  id: string;
  name: string;
  rate?: number;
};

export function VendorWHTTab({ vendorId }: { vendorId: string }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [showCertificate, setShowCertificate] = useState(false);

  const [formState, setFormState] = useState({
    account_id: "",
    remittance_date: "",
    reference: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const { data: accrualsData, loading: accrualsLoading, refetch: refetchAccruals } = useCachedQuery(
    `finance:vendor:${vendorId}:wht-accruals:${year}:${month}`,
    () => financeApi.listVendorWHTAccruals(vendorId, { year, month }),
    { ttlMs: 60_000, storage: "memory" },
  );

  const { data: deductionTypesData } = useCachedQuery(
    "finance:wht:deduction-types",
    () => financeApi.listDeductionTypes(),
    { ttlMs: 60_000, storage: "memory" },
  );

  const { data: accountsData } = useCachedQuery(
    "finance:accounts",
    () => financeApi.listAccounts(),
    { ttlMs: 60_000, storage: "memory" },
  );

  const accruals = (Array.isArray(accrualsData) ? accrualsData : []) as Accrual[];
  const deductionTypes = (Array.isArray(deductionTypesData) ? deductionTypesData : []) as DeductionType[];
  const accounts = Array.isArray(accountsData) ? accountsData : [];

  const pending = accruals.filter((a) => !a.remittance_id);
  const remitted = accruals.filter((a) => !!a.remittance_id);

  const totalPendingWHT = pending.reduce((sum, a) => sum + (Number(a.wht_amount) || 0), 0);
  const totalRemittedWHT = remitted.reduce((sum, a) => sum + (Number(a.wht_amount) || 0), 0);

  const deductionTypeName = (typeId: string | undefined) => {
    if (!typeId) return "-";
    const match = deductionTypes.find((d) => d.id === typeId);
    return match ? match.name : typeId;
  };

  const handleSubmit = async () => {
    if (!formState.account_id || !pending.length) return;
    setSubmitting(true);
    try {
      await financeApi.createWHTRemittance({
        vendor_id: vendorId,
        account_id: formState.account_id,
        remittance_date: formState.remittance_date || undefined,
        reference: formState.reference || undefined,
        accrual_ids: pending.map((a) => a.id),
        year,
        month,
      });
      setFormState({ account_id: "", remittance_date: "", reference: "" });
      void refetchAccruals();
    } catch {
      // error handled silently — user can retry
    } finally {
      setSubmitting(false);
    }
  };

  const yearOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  return (
    <>
      <div className="flex flex-wrap items-end gap-3">
        <SelectField
          label="Year"
          value={String(year)}
          onChange={(e) => setYear(Number(e.target.value))}
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </SelectField>
        <SelectField
          label="Month"
          value={String(month)}
          onChange={(e) => setMonth(Number(e.target.value))}
        >
          {MONTHS.map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </SelectField>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <StatCard
          label="Pending Remittance"
          value={formatCurrency(totalPendingWHT)}
          tone="warning"
          icon="pending"
        />
        <StatCard
          label="Remitted"
          value={formatCurrency(totalRemittedWHT)}
          tone="success"
          icon="check_circle"
        />
      </div>

      <SectionCard title="WHT Accruals" className="mt-6">
        {accrualsLoading ? (
          <p className="py-8 text-center text-sm text-slate-500">Loading accruals...</p>
        ) : !accruals.length ? (
          <p className="py-8 text-center text-sm text-slate-500">
            No WHT accruals for {MONTHS[month - 1]} {year}.
          </p>
        ) : (
          <Table caption="WHT accruals">
            <TableHead>
              <TableHeaderRow>
                <TableHeaderCell>Voucher #</TableHeaderCell>
                <TableHeaderCell>Deduction Type</TableHeaderCell>
                <TableHeaderCell className="text-right">Gross Amount</TableHeaderCell>
                <TableHeaderCell className="text-right">WHT Amount</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
              </TableHeaderRow>
            </TableHead>
            <TableBody>
              {accruals.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.voucher_number || "-"}</TableCell>
                  <TableCell>{deductionTypeName(a.deduction_type)}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(Number(a.gross_amount) || 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(Number(a.wht_amount) || 0)}
                  </TableCell>
                  <TableCell>
                    {a.remittance_id ? (
                      <Chip variant="success">Remitted</Chip>
                    ) : (
                      <Chip variant="warning">Pending</Chip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SectionCard>

      {pending.length > 0 && (
        <SectionCard title="Record Remittance" description="Submit a remittance record for pending accruals." className="mt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <SelectField
              label="Paid From Account"
              value={formState.account_id}
              onChange={(e) =>
                setFormState((s) => ({ ...s, account_id: e.target.value }))
              }
            >
              <option value="">Select account</option>
              {accounts.map((acc: any) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}{acc.code ? ` (${acc.code})` : ""}
                </option>
              ))}
            </SelectField>
            <TextField
              label="Remittance Date"
              type="date"
              value={formState.remittance_date}
              onChange={(e) =>
                setFormState((s) => ({ ...s, remittance_date: e.target.value }))
              }
            />
            <TextField
              label="Reference"
              value={formState.reference}
              onChange={(e) =>
                setFormState((s) => ({ ...s, reference: e.target.value }))
              }
              placeholder="Payment reference"
            />
          </div>
          <div className="mt-4">
            <Button onClick={() => void handleSubmit()} disabled={submitting || !formState.account_id}>
              {submitting ? "Recording..." : "Record Remittance"}
            </Button>
          </div>
        </SectionCard>
      )}

      {remitted.length > 0 && (
        <div className="mt-4">
          <Button
            variant="secondary"
            onClick={() => setShowCertificate(true)}
          >
            <Icon name="description" className="text-[18px]" />
            View Certificate
          </Button>
        </div>
      )}

      {showCertificate && (
        <WHTCertificateModal
          vendorId={vendorId}
          year={year}
          month={month}
          onClose={() => setShowCertificate(false)}
        />
      )}
    </>
  );
}