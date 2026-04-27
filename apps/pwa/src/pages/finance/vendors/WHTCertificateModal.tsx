import { Button, Icon, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableHeaderRow, TableRow } from "@/shared";
import { financeApi, useCachedQuery } from "@/shared/lib/core";
import { formatCurrency } from "@stanforte/shared";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type Vendor = {
  id: string;
  name?: string;
  tin?: string;
  email?: string;
  tax_number?: string;
};

type Accrual = {
  id: string;
  voucher_number?: string;
  date?: string;
  deduction_type?: string;
  deduction_type_name?: string;
  gross_amount?: number;
  wht_amount?: number;
  remittance_id?: string;
  remittance_reference?: string;
};

type DeductionType = {
  id: string;
  name: string;
};

export function WHTCertificateModal({
  vendorId,
  year,
  month,
  onClose,
}: {
  vendorId: string;
  year: number;
  month: number;
  onClose: () => void;
}) {
  const { data: vendorData } = useCachedQuery(
    `finance:vendor:${vendorId}`,
    () => financeApi.getVendor(vendorId),
    { ttlMs: 60_000, storage: "memory" },
  );

  const { data: accrualsData } = useCachedQuery(
    `finance:vendor:${vendorId}:wht-accruals:${year}:${month}`,
    () => financeApi.listVendorWHTAccruals(vendorId, { year, month }),
    { ttlMs: 60_000, storage: "memory" },
  );

  const { data: deductionTypesData } = useCachedQuery(
    "finance:wht:deduction-types",
    () => financeApi.listDeductionTypes(),
    { ttlMs: 60_000, storage: "memory" },
  );

  const vendor = (vendorData ?? {}) as Vendor;
  const accruals = (Array.isArray(accrualsData) ? accrualsData : []) as Accrual[];
  const deductionTypes = (Array.isArray(deductionTypesData) ? deductionTypesData : []) as DeductionType[];

  const remitted = accruals.filter((a) => !!a.remittance_id);

  const totalGross = remitted.reduce((sum, a) => sum + (Number(a.gross_amount) || 0), 0);
  const totalWHT = remitted.reduce((sum, a) => sum + (Number(a.wht_amount) || 0), 0);

  const deductionTypeName = (typeId: string | undefined) => {
    if (!typeId) return "-";
    const match = deductionTypes.find((d) => d.id === typeId);
    return match ? match.name : typeId;
  };

  const remittanceRef = remitted.find((a) => a.remittance_reference)?.remittance_reference;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 px-4 py-6">
      <button
        type="button"
        aria-label="Close WHT certificate"
        className="absolute inset-0"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="wht-cert-title"
        className="relative z-[81] flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-card"
      >
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-slate-500">
                Withholding Tax
              </p>
              <h2
                id="wht-cert-title"
                className="mt-2 text-2xl font-semibold tracking-tight text-slate-950"
              >
                WHT Certificate — {MONTHS[month - 1]} {year}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200"
            >
              <Icon name="close" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Vendor
              </div>
              <div className="mt-1 text-lg font-semibold text-slate-950">
                {vendor.name || "-"}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                TIN
              </div>
              <div className="mt-1 text-lg font-semibold text-slate-950">
                {vendor.tin || vendor.tax_number || "-"}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Email
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-950 break-all">
                {vendor.email || "-"}
              </div>
            </div>
          </div>

          <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4 space-y-1">
            <div className="text-sm text-slate-700">
              <span className="font-semibold text-slate-950">Period:</span>{" "}
              {MONTHS[month - 1]} {year}
            </div>
            {remittanceRef ? (
              <div className="text-sm text-slate-700">
                <span className="font-semibold text-slate-950">Remittance Reference:</span>{" "}
                {remittanceRef}
              </div>
            ) : null}
          </div>

          {!remitted.length ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No remitted accruals for this period.
            </p>
          ) : (
            <Table caption="WHT certificate accruals">
              <TableHead>
                <TableHeaderRow>
                  <TableHeaderCell>Voucher</TableHeaderCell>
                  <TableHeaderCell>Date</TableHeaderCell>
                  <TableHeaderCell>Deduction</TableHeaderCell>
                  <TableHeaderCell className="text-right">Gross</TableHeaderCell>
                  <TableHeaderCell className="text-right">WHT</TableHeaderCell>
                </TableHeaderRow>
              </TableHead>
              <TableBody>
                {remitted.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.voucher_number || "-"}</TableCell>
                    <TableCell>{a.date ? new Date(a.date).toLocaleDateString() : "-"}</TableCell>
                    <TableCell>{deductionTypeName(a.deduction_type)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(a.gross_amount) || 0)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(a.wht_amount) || 0)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-slate-50 font-semibold">
                  <TableCell colSpan={3}>Total</TableCell>
                  <TableCell className="text-right">{formatCurrency(totalGross)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totalWHT)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </div>

        <div className="border-t border-slate-100 px-6 py-4">
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="secondary" onClick={handlePrint}>
              <Icon name="print" className="text-[18px]" />
              Print
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}