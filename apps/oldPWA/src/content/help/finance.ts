export type FinanceHelpEntry = {
  key: string;
  title: string;
  summary: string;
  actions: string[];
  tips?: string[];
};

export const financeHelpEntries: FinanceHelpEntry[] = [
  {
    key: "dashboard",
    title: "Finance Dashboard",
    summary: "Use the dashboard to monitor finance activity at a glance before moving into requests, money flow, or reporting.",
    actions: [
      "Review total requests, total amount, and average amount for current activity.",
      "Use Quick Links to jump straight into Requests, Manual Entry, or Finance Settings.",
      "Treat this page as a starting point, not the final source of record."
    ]
  },
  {
    key: "requests",
    title: "Finance Requests",
    summary: "This page is for finance review, filtering, and follow-up on all request activity.",
    actions: [
      "Filter by staff, team, organization, project, status, and due date to narrow the workload.",
      "Open a request to review items, attachments, disbursement status, retirements, and package downloads.",
      "Use this page for processing and audit follow-up, not for submitting new staff requests."
    ]
  },
  {
    key: "manual-entry",
    title: "Manual Entry",
    summary: "Use manual entry for controlled backfill or reconciliation work when a request did not originate in the portal.",
    actions: [
      "Create one request at a time when you have complete supporting details.",
      "Use Batch Import for historical or bulk uploads from structured spreadsheets.",
      "Always validate request IDs, voucher numbers, attachments, and staff details before saving."
    ]
  },
  {
    key: "accounts",
    title: "Finance Accounts",
    summary: "Finance Accounts define the bank, reserve, or cash accounts that transactions post against.",
    actions: [
      "Create one record per real account you operate.",
      "Keep account codes and names stable because reports and vouchers depend on them.",
      "Use account detail to inspect balances and linked movements."
    ]
  },
  {
    key: "ledger",
    title: "Finance Ledger",
    summary: "The ledger is the transaction trail for account movements, income postings, and transfers.",
    actions: [
      "Record direct income here when money enters an account outside the request flow.",
      "Record account-to-account transfers here so movement history stays auditable.",
      "Use filters to isolate one account or source type before reviewing balances."
    ]
  },
  {
    key: "payment-vouchers",
    title: "Payment Vouchers",
    summary: "Payment vouchers are the finance disbursement records tied to requests and supporting evidence.",
    actions: [
      "Use this page to review what has been paid, retired, verified, or is still outstanding.",
      "Open voucher-linked requests when you need the full request package and attachments.",
      "Use evidence and receipt files to support audit and reconciliation."
    ]
  },
  {
    key: "receivables",
    title: "Receivables",
    summary: "Receivables manages invoices, receipts, and customer balances.",
    actions: [
      "Create invoices first, then record receipts against the invoice or customer balance.",
      "Use invoice detail to send, remind, void, or print the invoice PDF.",
      "Check aged receivables regularly for overdue balances and collection follow-up."
    ]
  },
  {
    key: "payables",
    title: "Payables",
    summary: "Payables tracks vendor bills and outgoing obligations that should appear in finance reports.",
    actions: [
      "Create bills when a vendor obligation exists, even if payment will happen later.",
      "Use vendor and due-date information consistently so aging and summaries remain reliable.",
      "Match payables records with the actual payment flow for clean reporting."
    ]
  },
  {
    key: "payroll",
    title: "Payroll",
    summary: "Payroll manages workers, salary components, payroll runs, and the accounting split of payroll cost across organization, team, project, fund, and grant.",
    actions: [
      "Set up payroll workers first, including whether each person is an employee or consultant and how their cost should be allocated.",
      "Create payroll components for earnings, deductions, and employer costs before generating runs.",
      "Generate a run only after worker setup is complete so payroll figures and accounting splits stay consistent."
    ],
    tips: [
      "Treat payroll runs as controlled period records. After approval and payment, they should be corrected through explicit adjustments, not silent edits."
    ]
  },
  {
    key: "budgets",
    title: "Budgets",
    summary: "Budgets now support draft revisions, approval workflow, and copy-from-existing flows so teams can reuse monthly or annual templates without overwriting approved baselines.",
    actions: [
      "Create or edit the current draft revision instead of overwriting an approved budget baseline.",
      "Submit draft revisions for approval, then approve, return, or reject them from the revision workflow.",
      "Use Copy Budget to seed the next month, quarter, or fiscal year without rebuilding recurring lines by hand.",
      "Review budget vs actual reports after new expenses or receipts are posted."
    ],
    tips: [
      "Approved revisions should stay immutable. Make changes by creating or updating a new draft revision.",
      "Use copy modes carefully: header-only for fresh planning, fuller copies for recurring operating budgets."
    ]
  },
  {
    key: "assets",
    title: "Assets",
    summary: "Assets are long-lived items tracked in the asset register with verification and disposal history.",
    actions: [
      "Register qualifying assets with purchase date, cost, useful life, custodian, and location.",
      "Use verification records instead of editing history away.",
      "Dispose assets through the disposal flow so the register and reporting stay aligned."
    ]
  },
  {
    key: "reports",
    title: "Finance Reports",
    summary: "Reports consolidate accounting, balances, receivables, payables, budgets, and fund activity into management outputs.",
    actions: [
      "Select a reporting period or date range before reviewing summaries.",
      "Use Statement of Activities and Financial Position for formal reporting.",
      "Use Budget vs Actual and Grant Utilization for management and donor reporting."
    ],
    tips: [
      "Backfill historical accounting entries before relying on period reports.",
      "If a number looks wrong, drill back into the underlying page before exporting."
    ]
  },
  {
    key: "settings",
    title: "Finance Setup",
    summary: "Finance setup controls request types, report signatories, chart accounts, reporting periods, parties, and fund structure.",
    actions: [
      "Treat setup pages as controlled configuration, not day-to-day transaction screens.",
      "Change chart accounts and reporting periods deliberately because reports depend on them.",
      "Keep customers, vendors, funds, and grants maintained before operational teams start posting against them."
    ]
  }
];

export const financeHelpMap = new Map(financeHelpEntries.map((entry) => [entry.key, entry]));
