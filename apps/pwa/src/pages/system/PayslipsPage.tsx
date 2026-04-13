import { Button, Chip, SectionCard, StatCard, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableHeaderRow, TableRow } from "@/shared";
import { SystemShellPage } from "./page-helpers";

const payslips = [
  {
    id: "2026-03",
    period: "March 2026",
    payDate: "Mar 31, 2026",
    gross: "₦720,000",
    net: "₦612,000",
    status: "Ready",
  },
  {
    id: "2026-02",
    period: "February 2026",
    payDate: "Feb 28, 2026",
    gross: "₦720,000",
    net: "₦612,000",
    status: "Ready",
  },
  {
    id: "2026-01",
    period: "January 2026",
    payDate: "Jan 31, 2026",
    gross: "₦720,000",
    net: "₦612,000",
    status: "Ready",
  },
  {
    id: "2025-12",
    period: "December 2025",
    payDate: "Dec 31, 2025",
    gross: "₦720,000",
    net: "₦612,000",
    status: "Processing",
  },
];

const statusVariant: Record<string, "success" | "pending" | "neutral"> = {
  ready: "success",
  processing: "pending",
};

export default function PayslipsPage() {
  const latest = payslips[0];

  return (
    <SystemShellPage
      activeLabel="Payslips"
      breadcrumbs={[
        { label: "Profile", path: "/profile" },
        { label: "Payslips" },
      ]}
      eyebrow="Workspace > Profile"
      title="My Payslips"
      description="Review monthly salary statements and download your payroll history."
    >
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <SectionCard title="Payslip History" description="Download issued payslips or check upcoming payroll releases.">
            <Table>
              <TableHead>
                <TableHeaderRow>
                  <TableHeaderCell>Period</TableHeaderCell>
                  <TableHeaderCell>Pay Date</TableHeaderCell>
                  <TableHeaderCell>Gross</TableHeaderCell>
                  <TableHeaderCell>Net</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell />
                </TableHeaderRow>
              </TableHead>
              <TableBody>
                {payslips.map((row) => {
                  const statusKey = row.status.toLowerCase();
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="font-semibold text-slate-900">{row.period}</TableCell>
                      <TableCell>{row.payDate}</TableCell>
                      <TableCell>{row.gross}</TableCell>
                      <TableCell>{row.net}</TableCell>
                      <TableCell>
                        <Chip variant={statusVariant[statusKey] ?? "neutral"}>{row.status}</Chip>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={row.status !== "Ready"}
                        >
                          {row.status === "Ready" ? "Download" : "Pending"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </SectionCard>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <StatCard
            label="Latest Payslip"
            value={latest?.period ?? "-"}
            tone="success"
            hint={latest ? `${latest.net} net pay` : "No payslip issued yet."}
          />
          <StatCard
            label="YTD Earnings"
            value="₦2,160,000"
            tone="neutral"
            hint="Sum of issued payslips this year."
          />
          <StatCard
            label="Next Payday"
            value="Apr 30, 2026"
            tone="pending"
            hint="Subject to payroll confirmation."
          />
          <SectionCard title="Need a correction?">
            <p className="text-sm text-slate-600">
              If a payslip looks off, contact HR or submit a payroll correction request.
            </p>
          </SectionCard>
        </div>
      </div>
    </SystemShellPage>
  );
}
