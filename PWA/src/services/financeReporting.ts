import apiClient from "@/utils/httpClient";

export type FinanceReportFilter = {
  period_id?: string;
  from?: string;
  to?: string;
  organization_id?: string;
  team_id?: string;
  fund_id?: string;
  grant_id?: string;
  comparison_period?: string;
};

export type FinanceExecutiveSummary = {
  period: { id: string | null; label: string; start_date: string; end_date: string; year: number; month: number; quarter: number; status: string };
  executive_summary: {
    total_support_and_revenue: number;
    total_income: number;
    total_expense: number;
    surplus_deficit: number;
    net_profit_loss: number;
    grant_income: number;
    donation_income: number;
    service_income: number;
    bank_balance: number;
    reserve_balance: number;
    receivables: number;
    payables: number;
    advances: number;
    unrestricted_net_assets: number;
    restricted_net_assets: number;
    deferred_grant_income: number;
  };
  fund_activity?: Array<{
    fund_id: string;
    fund_name: string;
    restriction_type: string;
    income: number;
    expense: number;
    net: number;
  }>;
  notes: {
    saved: Array<{ id: string; severity: string; title: string; body: string; source_rule: string | null; kind: string; is_overridden: boolean }>;
    generated: Array<{ severity: string; title: string; body: string; source_rule: string }>;
  };
};

export type FinanceSummaryBreakdown = Array<{
  account_id: string;
  code: string;
  name: string;
  amount: number;
  category: string;
}>;

export async function getFinanceExecutiveSummary(params?: FinanceReportFilter) {
  const response = await apiClient.get("/finance/reports/executive-summary", { params });
  return response.data?.data as FinanceExecutiveSummary;
}

export async function getFinanceIncomeSummary(params?: FinanceReportFilter) {
  const response = await apiClient.get("/finance/reports/income-summary", { params });
  return response.data?.data as {
    period: FinanceExecutiveSummary["period"];
    total_income: number;
    breakdown: FinanceSummaryBreakdown;
    category_totals: Record<string, number>;
    restriction_totals: Record<string, number>;
    notes: FinanceExecutiveSummary["notes"];
  };
}

export async function getFinanceExpenseSummary(params?: FinanceReportFilter) {
  const response = await apiClient.get("/finance/reports/expense-summary", { params });
  return response.data?.data as {
    period: FinanceExecutiveSummary["period"];
    total_expense: number;
    breakdown: FinanceSummaryBreakdown;
    category_totals: Record<string, number>;
    restriction_totals: Record<string, number>;
    notes: FinanceExecutiveSummary["notes"];
  };
}

export async function getFinanceProfitLoss(params?: FinanceReportFilter) {
  const response = await apiClient.get("/finance/reports/profit-loss", { params });
  return response.data?.data as {
    period: FinanceExecutiveSummary["period"];
    statement_of_activities: {
      total_support_and_revenue: number;
      total_expense: number;
      surplus_deficit: number;
      support_and_revenue_by_category: Record<string, number>;
      expenses_by_category: Record<string, number>;
      support_and_revenue_by_restriction: Record<string, number>;
      expenses_by_restriction: Record<string, number>;
    };
    income_total: number;
    expense_total: number;
    net_profit_loss: number;
    income_breakdown: FinanceSummaryBreakdown;
    expense_breakdown: FinanceSummaryBreakdown;
    fund_activity?: FinanceExecutiveSummary["fund_activity"];
    notes: FinanceExecutiveSummary["notes"];
  };
}

export async function getFinanceBalances(params?: FinanceReportFilter) {
  const response = await apiClient.get("/finance/reports/balances", { params });
  return response.data?.data as {
    period: FinanceExecutiveSummary["period"];
    bank_and_reserve_balances: {
      total_bank: number;
      total_reserve: number;
      accounts: Array<{ id: string; code: string; name: string; category: string; linked_finance_account: { id: string; name: string; code: string | null; account_type: string } | null; balance: number }>;
    };
    balance_sheet: {
      accounts_receivable: number;
      accounts_payable: number;
      advances: number;
      fixed_assets: number;
      retained_earnings: number;
      unrestricted_net_assets: number;
      restricted_net_assets: number;
      deferred_grant_income: number;
    };
    notes: FinanceExecutiveSummary["notes"];
  };
}

export async function getFinanceReceivables(params?: FinanceReportFilter) {
  const response = await apiClient.get("/finance/reports/receivables", { params });
  return response.data?.data as {
    period: FinanceExecutiveSummary["period"];
    summary: {
      total_outstanding: number;
      overdue_count: number;
      buckets: Record<string, number>;
    };
    items: Array<{
      id: string;
      document_number: string;
      customer_id: string;
      party_name: string;
      organization: string | null;
      team: string | null;
      issue_date: string;
      due_date: string | null;
      total_amount: number;
      paid_amount: number;
      outstanding_amount: number;
      age_days: number;
      aging_bucket: string;
      status: string;
      currency: string;
      type: string;
    }>;
    notes: FinanceExecutiveSummary["notes"];
  };
}

export async function getFinancePayables(params?: FinanceReportFilter) {
  const response = await apiClient.get("/finance/reports/payables", { params });
  return response.data?.data as {
    period: FinanceExecutiveSummary["period"];
    summary: {
      total_outstanding: number;
      overdue_count: number;
      buckets: Record<string, number>;
    };
    items: Array<{
      id: string;
      document_number: string;
      party_name: string;
      organization: string | null;
      team: string | null;
      issue_date: string;
      due_date: string | null;
      total_amount: number;
      paid_amount: number;
      outstanding_amount: number;
      age_days: number;
      aging_bucket: string;
      status: string;
      currency: string;
      type: string;
    }>;
    notes: FinanceExecutiveSummary["notes"];
  };
}

export async function listFinanceReportNotes(params?: { period_id?: string; report_key?: string }) {
  const response = await apiClient.get("/finance/report-notes", { params });
  return (response.data?.data ?? []) as Array<{
    id: string;
    period: FinanceExecutiveSummary["period"];
    report_key: string;
    kind: string;
    severity: string;
    title: string;
    body: string;
    source_rule: string | null;
    is_overridden: boolean;
  }>;
}

export async function createFinanceReportNote(payload: {
  period_id: string;
  report_key: string;
  kind?: string;
  severity?: string;
  title: string;
  body: string;
  source_rule?: string;
  is_overridden?: boolean;
}) {
  const response = await apiClient.post("/finance/report-notes", payload);
  return response.data?.data;
}

export async function backfillFinanceAccounting() {
  const response = await apiClient.post("/finance/accounting/backfill");
  return response.data?.data as { success: boolean; created_count: number; entries: string[] };
}

export async function getFinanceBudgetVsActual(params: { budget_id: string }) {
  const response = await apiClient.get("/finance/reports/budget-vs-actual", { params });
  return response.data?.data as {
    budget: any;
    actuals: {
      total_budget: number;
      total_actual: number;
      total_income: number;
      total_expense: number;
      variance: number;
      utilization_pct: number;
    };
  };
}

export async function getFinanceGrantUtilization(params?: FinanceReportFilter & { status?: string }) {
  const response = await apiClient.get("/finance/reports/grant-utilization", { params });
  return response.data?.data as {
    items: Array<{
      grant: any;
      cash_received: number;
      expense_utilized: number;
      committed_amount: number;
      recognized_amount: number;
      deferred_amount: number;
      remaining_budget: number;
      cash_balance: number;
    }>;
    summary: {
      committed_amount: number;
      cash_received: number;
      expense_utilized: number;
      recognized_amount: number;
      deferred_amount: number;
      remaining_budget: number;
      cash_balance: number;
    };
  };
}
