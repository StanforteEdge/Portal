import { Link } from "react-router-dom";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import { financeHelpEntries } from "@/content/help/finance";

const financePageLinks: Record<string, string> = {
  dashboard: "/appOld/finance",
  requests: "/appOld/finance/requests",
  "manual-entry": "/appOld/finance/manual-entry",
  accounts: "/appOld/finance/accounts",
  ledger: "/appOld/finance/ledger",
  "payment-vouchers": "/appOld/finance/payment-vouchers",
  receivables: "/appOld/finance/receivables",
  payables: "/appOld/finance/payables",
  budgets: "/appOld/finance/budgets",
  assets: "/appOld/finance/assets",
  reports: "/appOld/finance/reports",
  settings: "/appOld/finance/settings",
};

function FinanceHelpPage() {
  return (
    <>
      <div className="mt-8 intro-y flex items-center justify-between gap-3">
        <h2 className="text-lg font-medium">Finance Help</h2>
        <Link to="/appOld/help">
          <Button variant="outline-secondary">Back to Help Center</Button>
        </Link>
      </div>
      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
        This guide explains what each finance page is for and how the workflow fits together. Use Requests for operational spending, Ledger for direct account movement, Receivables and Payables for invoices and bills, and Reports for management outputs.
      </div>
      <div className="mt-5 space-y-4">
        {financeHelpEntries.map((entry) => (
          <section key={entry.key} id={entry.key} className="box p-5 scroll-mt-24">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-base font-medium text-slate-800">{entry.title}</div>
                <p className="mt-2 text-sm text-slate-600">{entry.summary}</p>
              </div>
              {financePageLinks[entry.key] ? (
                <Link to={financePageLinks[entry.key]} className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                  Open page
                  <Lucide icon="ChevronRight" className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
              {entry.actions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
            {entry.tips?.length ? (
              <div className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-500">
                {entry.tips.map((tip) => (
                  <div key={tip}>{tip}</div>
                ))}
              </div>
            ) : null}
          </section>
        ))}
      </div>
    </>
  );
}

export default FinanceHelpPage;
