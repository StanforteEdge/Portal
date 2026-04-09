import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import Table from "@/components/Base/Table";
import { Dialog } from "@/components/Base/Headless";
import { FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import {
  approveFinanceBudget,
  createFinanceBudget,
  exportFinanceBudget,
  listFinanceBudgets,
  listFinanceFunds,
  listFinanceGrants,
  recalculateFinanceBudget,
  reopenFinanceBudget,
  updateFinanceBudget,
} from "@/services/financeAccounting";
import { listOrganizations } from "@/services/organizations";
import { listTeams } from "@/services/teams";
import { listProjects } from "@/services/projects";
import { formatDisplayDate, formatMoney } from "@/utils/formatting";

const emptyLine = {
  section: "expenditure",
  group_name: "",
  line_name: "",
  chart_account_id: "",
  project_id: "",
  fund_id: "",
  grant_id: "",
  period_1_amount: "",
  period_2_amount: "",
  period_3_amount: "",
  period_4_amount: "",
  total_amount: "",
  notes: "",
};

const emptyAssumption = {
  section: "general",
  label: "",
  value: "",
  notes: "",
};

const emptyPortfolio = {
  project_id: "",
  fund_id: "",
  grant_id: "",
  funder_name: "",
  status: "active",
  period_1_amount: "",
  period_2_amount: "",
  period_3_amount: "",
  period_4_amount: "",
  period_total: "",
  total_budget: "",
  notes: "",
};

const emptyForm = {
  name: "",
  scope_type: "organization",
  budget_type: "organization",
  period_type: "annual",
  fiscal_year: new Date().getFullYear().toString(),
  quarter: "",
  month: "",
  currency: "NGN",
  exchange_rate: "",
  status: "draft",
  organization_id: "",
  team_id: "",
  project_id: "",
  fund_id: "",
  grant_id: "",
  parent_budget_id: "",
  start_date: "",
  end_date: "",
  notes: "",
  assumptions: [emptyAssumption],
  portfolio: [],
  lines: [emptyLine],
};

const monthOptions = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const MAX_BUDGET_IMPORT_SIZE = 5 * 1024 * 1024;
const SUPPORTED_BUDGET_IMPORT_EXTENSIONS = [".xlsx", ".xls", ".csv"];

function getPeriodLabels(periodType: string, quarter: string, month: string) {
  if (periodType === "quarterly") {
    const q = Number(quarter || 1);
    const startMonth = (q - 1) * 3;
    return monthOptions.slice(startMonth, startMonth + 3).map((entry) => entry.label.slice(0, 3));
  }
  if (periodType === "monthly") {
    const label = monthOptions.find((entry) => entry.value === month)?.label ?? "Month";
    return [label.slice(0, 3)];
  }
  return ["Q1", "Q2", "Q3", "Q4"];
}

function toText(value: unknown) {
  return value == null ? "" : String(value);
}

function normalizeSection(value: unknown) {
  return String(value || "").trim().toLowerCase() === "income" ? "income" : "expenditure";
}

function fileHasSupportedBudgetExtension(fileName: string) {
  const normalized = fileName.toLowerCase();
  return SUPPORTED_BUDGET_IMPORT_EXTENSIONS.some((extension) => normalized.endsWith(extension));
}

function numericValue(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function hasPeriodValues(line: Record<string, unknown>) {
  return ["period_1_amount", "period_2_amount", "period_3_amount", "period_4_amount"].some((key) => {
    const raw = line[key];
    return raw !== "" && raw !== null && raw !== undefined && Number(raw) !== 0;
  });
}

function derivedLineTotal(line: Record<string, unknown>) {
  return (
    numericValue(line.period_1_amount) +
    numericValue(line.period_2_amount) +
    numericValue(line.period_3_amount) +
    numericValue(line.period_4_amount)
  );
}

function downloadBase64File(fileName: string, mimeType: string, contentBase64: string) {
  const bytes = atob(contentBase64);
  const array = new Uint8Array(bytes.length);
  for (let index = 0; index < bytes.length; index += 1) {
    array[index] = bytes.charCodeAt(index);
  }
  const blob = new Blob([array], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function buildBudgetCsvRows(budget: any) {
  return [
    {
      record_type: "budget",
      name: budget.name || "",
      scope_type: budget.scope_type || budget.budget_type || "",
      budget_type: budget.budget_type || budget.scope_type || "",
      period_type: budget.period_type || "",
      fiscal_year: budget.fiscal_year ?? "",
      quarter: budget.quarter ?? "",
      month: budget.month ?? "",
      currency: budget.currency || "",
      exchange_rate: budget.exchange_rate ?? "",
      status: budget.status || "",
      organization_id: budget.organization_id || "",
      team_id: budget.team_id || "",
      project_id: budget.project_id || "",
      fund_id: budget.fund?.id || budget.fund_id || "",
      grant_id: budget.grant?.id || budget.grant_id || "",
      parent_budget_id: budget.parent_budget_id || "",
      start_date: budget.start_date ? String(budget.start_date).slice(0, 10) : "",
      end_date: budget.end_date ? String(budget.end_date).slice(0, 10) : "",
      notes: budget.notes || "",
    },
    ...((budget.assumptions || []).map((entry: any) => ({
      record_type: "assumption",
      section: entry.section || "",
      label: entry.label || "",
      value: entry.value || "",
      notes: entry.notes || "",
    })) as Record<string, unknown>[]),
    ...((budget.portfolio || []).map((entry: any) => ({
      record_type: "portfolio",
      project_id: entry.project_id || "",
      fund_id: entry.fund_id || "",
      grant_id: entry.grant_id || "",
      funder_name: entry.funder_name || "",
      status: entry.status || "",
      period_1_amount: entry.period_1_amount ?? "",
      period_2_amount: entry.period_2_amount ?? "",
      period_3_amount: entry.period_3_amount ?? "",
      period_4_amount: entry.period_4_amount ?? "",
      period_total: entry.period_total ?? "",
      total_budget: entry.total_budget ?? "",
      notes: entry.notes || "",
    })) as Record<string, unknown>[]),
    ...((budget.lines || []).map((line: any) => ({
      record_type: "line",
      section: line.section || "",
      group_name: line.group_name || "",
      line_name: line.line_name || line.line_label || "",
      chart_account_id: line.chart_account_id || "",
      project_id: line.project_id || "",
      fund_id: line.fund_id || "",
      grant_id: line.grant_id || "",
      period_1_amount: line.period_1_amount ?? "",
      period_2_amount: line.period_2_amount ?? "",
      period_3_amount: line.period_3_amount ?? "",
      period_4_amount: line.period_4_amount ?? "",
      total_amount: line.total_amount ?? line.amount ?? "",
      actual_total_amount: line.actual_total_amount ?? "",
      variance_amount: line.variance_amount ?? "",
      notes: line.notes || "",
    })) as Record<string, unknown>[]),
  ];
}

type BudgetSectionTotals = {
  income: { planned: number; actual: number; variance: number };
  expenditure: { planned: number; actual: number; variance: number };
};

function summarizeBudgetSections(budget: any) {
  const lines = (Array.isArray(budget?.lines) ? budget.lines : []) as Array<Record<string, unknown>>;
  return lines.reduce(
    (acc: BudgetSectionTotals, line: Record<string, unknown>) => {
      const section = line.section === "income" ? "income" : "expenditure";
      const planned = Number(line.total_amount ?? line.amount ?? 0);
      const actual = Number(line.actual_total_amount ?? 0);
      const variance = Number(line.variance_amount ?? planned - actual);
      acc[section].planned += planned;
      acc[section].actual += actual;
      acc[section].variance += variance;
      return acc;
    },
    {
      income: { planned: 0, actual: 0, variance: 0 },
      expenditure: { planned: 0, actual: 0, variance: 0 },
    }
  );
}

function summarizeDraftLines(lines: any[]) {
  const sectionMap = new Map<string, { planned: number; groups: Map<string, number> }>();

  for (const line of lines || []) {
    const section = line.section === "income" ? "income" : "expenditure";
    const groupName = String(line.group_name || "Ungrouped").trim() || "Ungrouped";
    const total = hasPeriodValues(line) ? derivedLineTotal(line) : numericValue(line.total_amount);

    if (!sectionMap.has(section)) {
      sectionMap.set(section, { planned: 0, groups: new Map() });
    }
    const sectionEntry = sectionMap.get(section)!;
    sectionEntry.planned += total;
    sectionEntry.groups.set(groupName, (sectionEntry.groups.get(groupName) || 0) + total);
  }

  return ["income", "expenditure"].map((section) => {
    const sectionEntry = sectionMap.get(section) || { planned: 0, groups: new Map<string, number>() };
    return {
      section,
      planned: sectionEntry.planned,
      groups: Array.from(sectionEntry.groups.entries())
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total),
    };
  });
}

function groupBudgetLines(lines: any[]) {
  const grouped = new Map<
    string,
    {
      section: string;
      total: number;
      groups: Map<string, { name: string; total: number; lines: any[] }>;
    }
  >();

  for (const line of lines || []) {
    const section = line.section === "income" ? "income" : "expenditure";
    const groupName = String(line.group_name || "Ungrouped").trim() || "Ungrouped";
    const total = numericValue(line.total_amount ?? line.amount);
    if (!grouped.has(section)) {
      grouped.set(section, { section, total: 0, groups: new Map() });
    }
    const sectionEntry = grouped.get(section)!;
    sectionEntry.total += total;
    if (!sectionEntry.groups.has(groupName)) {
      sectionEntry.groups.set(groupName, { name: groupName, total: 0, lines: [] });
    }
    const groupEntry = sectionEntry.groups.get(groupName)!;
    groupEntry.total += total;
    groupEntry.lines.push(line);
  }

  return Array.from(grouped.values()).map((section) => ({
    section: section.section,
    total: section.total,
    groups: Array.from(section.groups.values()).sort((a, b) => b.total - a.total),
  }));
}

function FinanceBudgetsPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actingId, setActingId] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [selectedBudgetId, setSelectedBudgetId] = useState("");
  const [filters, setFilters] = useState({ scope_type: "", period_type: "", fiscal_year: "", status: "" });
  const [budgets, setBudgets] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [funds, setFunds] = useState<any[]>([]);
  const [grants, setGrants] = useState<any[]>([]);
  const [form, setForm] = useState<any>(emptyForm);

  const load = async () => {
    try {
      setLoading(true);
      const params = {
        ...(filters.scope_type ? { scope_type: filters.scope_type } : {}),
        ...(filters.period_type ? { period_type: filters.period_type } : {}),
        ...(filters.fiscal_year ? { fiscal_year: filters.fiscal_year } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      };
      const [budgetRows, orgRows, teamRows, projectRows, fundRows, grantRows] = await Promise.all([
        listFinanceBudgets(params),
        listOrganizations({ is_active: true }).catch(() => []),
        listTeams({ active_only: true }).catch(() => []),
        listProjects({ active_only: false }).catch(() => []),
        listFinanceFunds().catch(() => []),
        listFinanceGrants().catch(() => []),
      ]);
      setBudgets(budgetRows);
      setSelectedBudgetId((current) => current || budgetRows[0]?.id || "");
      setOrganizations(orgRows);
      setTeams(teamRows);
      setProjects(projectRows);
      setFunds(fundRows);
      setGrants(grantRows);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load budgets." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const totals = useMemo(() => {
    const totalBudget = budgets.reduce((sum, row) => sum + Number(row.total_budget || 0), 0);
    return {
      totalBudget,
      approvedCount: budgets.filter((row) => row.status === "approved").length,
      orgCount: budgets.filter((row) => row.scope_type === "organization").length,
      projectTagged: budgets.filter((row) => row.project_id || row.portfolio?.length).length,
    };
  }, [budgets]);

  const scopeProjects = projects.filter((project) => !form.organization_id || !project.organizationId || project.organizationId === form.organization_id);
  const scopedFunds = funds.filter((fund) => !form.project_id || !fund.project_id || fund.project_id === form.project_id);
  const scopedGrants = grants.filter((grant) => {
    if (form.project_id && grant.project_id && grant.project_id !== form.project_id) return false;
    if (form.fund_id && grant.fund?.id && grant.fund.id !== form.fund_id) return false;
    return true;
  });
  const periodLabels = getPeriodLabels(form.period_type, form.quarter, form.month);
  const selectedBudget = budgets.find((row) => row.id === selectedBudgetId) ?? budgets[0] ?? null;
  const selectedBudgetSections = useMemo(() => summarizeBudgetSections(selectedBudget), [selectedBudget]);
  const draftLineSections = useMemo(() => summarizeDraftLines(form.lines || []), [form.lines]);
  const selectedBudgetLineGroups = useMemo(() => groupBudgetLines(selectedBudget?.lines || []), [selectedBudget]);
  const selectedBudgetMetrics = useMemo(() => {
    if (!selectedBudget) {
      return {
        netPosition: 0,
        incomeCoveragePct: 0,
        projectTaggedSharePct: 0,
        assumptionsCount: 0,
        portfolioCount: 0,
      };
    }
    const incomePlanned = selectedBudgetSections.income.planned;
    const expenditurePlanned = selectedBudgetSections.expenditure.planned;
    const netPosition = incomePlanned - expenditurePlanned;
    const incomeCoveragePct = expenditurePlanned > 0 ? (incomePlanned / expenditurePlanned) * 100 : 0;
    const projectTaggedLines = (selectedBudget.lines || []).filter(
      (line: any) => line.project_id || line.fund_id || line.grant_id
    ).length;
    const totalLines = Math.max(1, (selectedBudget.lines || []).length);
    return {
      netPosition,
      incomeCoveragePct,
      projectTaggedSharePct: (projectTaggedLines / totalLines) * 100,
      assumptionsCount: (selectedBudget.assumptions || []).length,
      portfolioCount: (selectedBudget.portfolio || []).length,
    };
  }, [selectedBudget, selectedBudgetSections]);

  const openCreate = () => {
    setEditingId("");
    setForm(emptyForm);
    setShowEditor(true);
  };

  const applyImportedBudget = (
    budgetRows: Record<string, unknown>[],
    assumptionRows: Record<string, unknown>[],
    portfolioRows: Record<string, unknown>[],
    lineRows: Record<string, unknown>[]
  ) => {
    if (budgetRows.length !== 1) {
      throw new Error(budgetRows.length > 1 ? "Budget import must contain exactly one budget header row." : "Budget data is empty.");
    }

    const budget = budgetRows[0];
    if (!budget) {
      throw new Error("Budget data is empty.");
    }

    const normalizedBudget = {
      name: toText(budget.name).trim(),
      scope_type: toText(budget.scope_type || budget.budget_type || "organization").trim().toLowerCase(),
      budget_type: toText(budget.budget_type || budget.scope_type || "organization").trim().toLowerCase(),
      period_type: toText(budget.period_type || "annual").trim().toLowerCase(),
      fiscal_year: toText(budget.fiscal_year || new Date().getFullYear()).trim(),
    };

    if (!normalizedBudget.name) throw new Error("Budget name is required.");
    if (!["organization", "team", "project"].includes(normalizedBudget.scope_type)) {
      throw new Error("Budget scope_type must be one of organization, team, or project.");
    }
    if (!["annual", "quarterly", "monthly"].includes(normalizedBudget.period_type)) {
      throw new Error("Budget period_type must be one of annual, quarterly, or monthly.");
    }
    if (!normalizedBudget.fiscal_year || Number.isNaN(Number(normalizedBudget.fiscal_year))) {
      throw new Error("Budget fiscal_year must be a valid year.");
    }

    const normalizedLines = lineRows
      .map((entry) => ({
        section: normalizeSection(entry.section),
        group_name: toText(entry.group_name),
        line_name: toText(entry.line_name || entry.line_label),
        chart_account_id: toText(entry.chart_account_id),
        project_id: toText(entry.project_id),
        fund_id: toText(entry.fund_id),
        grant_id: toText(entry.grant_id),
        period_1_amount: toText(entry.period_1_amount),
        period_2_amount: toText(entry.period_2_amount),
        period_3_amount: toText(entry.period_3_amount),
        period_4_amount: toText(entry.period_4_amount),
        total_amount: toText(entry.total_amount || entry.amount),
        notes: toText(entry.notes),
      }))
      .filter((entry) => entry.line_name.trim());

    if (!normalizedLines.length) {
      throw new Error("Budget import must contain at least one line row.");
    }

    setEditingId("");
    setForm({
      name: normalizedBudget.name,
      scope_type: normalizedBudget.scope_type,
      budget_type: normalizedBudget.budget_type,
      period_type: normalizedBudget.period_type,
      fiscal_year: normalizedBudget.fiscal_year,
      quarter: toText(budget.quarter),
      month: toText(budget.month),
      currency: toText(budget.currency || "NGN"),
      exchange_rate: toText(budget.exchange_rate),
      status: toText(budget.status || "draft"),
      organization_id: toText(budget.organization_id),
      team_id: toText(budget.team_id),
      project_id: toText(budget.project_id),
      fund_id: toText(budget.fund_id),
      grant_id: toText(budget.grant_id),
      parent_budget_id: toText(budget.parent_budget_id),
      start_date: toText(budget.start_date),
      end_date: toText(budget.end_date),
      notes: toText(budget.notes),
      assumptions: assumptionRows.length
        ? assumptionRows
            .map((entry) => ({
            section: toText(entry.section),
            label: toText(entry.label),
            value: toText(entry.value),
            notes: toText(entry.notes),
            }))
            .filter((entry) => entry.label.trim() || entry.value.trim())
        : [emptyAssumption],
      portfolio: portfolioRows
        .map((entry) => ({
          project_id: toText(entry.project_id),
          fund_id: toText(entry.fund_id),
          grant_id: toText(entry.grant_id),
          funder_name: toText(entry.funder_name),
          status: toText(entry.status || "active"),
          period_1_amount: toText(entry.period_1_amount),
          period_2_amount: toText(entry.period_2_amount),
          period_3_amount: toText(entry.period_3_amount),
          period_4_amount: toText(entry.period_4_amount),
          period_total: toText(entry.period_total),
          total_budget: toText(entry.total_budget),
          notes: toText(entry.notes),
        }))
        .filter((entry) => entry.project_id || entry.funder_name || entry.total_budget),
      lines: normalizedLines,
    });
    setShowEditor(true);
  };

  const downloadTemplate = () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet([
        {
          name: "2026 Organization Annual Budget",
          scope_type: "organization",
          budget_type: "organization",
          period_type: "annual",
          fiscal_year: 2026,
          quarter: "",
          month: "",
          currency: "NGN",
          exchange_rate: 1500,
          status: "draft",
          organization_id: "",
          team_id: "",
          project_id: "",
          fund_id: "",
          grant_id: "",
          notes: "Sample organization budget import",
        },
      ]),
      "Budget"
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet([
        { section: "general", label: "Exchange Rate", value: "1 USD = 1500 NGN", notes: "" },
        { section: "planning", label: "Inflation", value: "12%", notes: "" },
      ]),
      "Assumptions"
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet([
        {
          project_id: "",
          fund_id: "",
          grant_id: "",
          funder_name: "Sample Funder",
          status: "active",
          period_1_amount: 1000000,
          period_2_amount: 1200000,
          period_3_amount: 900000,
          period_4_amount: 800000,
          total_budget: 3900000,
          notes: "",
        },
      ]),
      "Portfolio"
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet([
        {
          section: "income",
          group_name: "Funding",
          line_name: "Grant Income",
          chart_account_id: "",
          project_id: "",
          fund_id: "",
          grant_id: "",
          period_1_amount: 1000000,
          period_2_amount: 1200000,
          period_3_amount: 900000,
          period_4_amount: 800000,
          total_amount: 3900000,
          notes: "",
        },
        {
          section: "expenditure",
          group_name: "Programme Costs",
          line_name: "Field Activities",
          chart_account_id: "",
          project_id: "",
          fund_id: "",
          grant_id: "",
          period_1_amount: 600000,
          period_2_amount: 750000,
          period_3_amount: 500000,
          period_4_amount: 450000,
          total_amount: 2300000,
          notes: "",
        },
      ]),
      "Lines"
    );
    XLSX.writeFile(workbook, "budget-import-template.xlsx");
  };

  const downloadCsvTemplate = () => {
    const records = buildBudgetCsvRows({
      name: "2026 Organization Annual Budget",
      scope_type: "organization",
      budget_type: "organization",
      period_type: "annual",
      fiscal_year: 2026,
      currency: "NGN",
      exchange_rate: 1500,
      status: "draft",
      notes: "Sample organization budget import",
      assumptions: [
        { section: "general", label: "Exchange Rate", value: "1 USD = 1500 NGN", notes: "" },
        { section: "planning", label: "Inflation", value: "12%", notes: "" },
      ],
      portfolio: [
        {
          project_id: "",
          fund_id: "",
          grant_id: "",
          funder_name: "Sample Funder",
          status: "active",
          period_1_amount: 1000000,
          period_2_amount: 1200000,
          period_3_amount: 900000,
          period_4_amount: 800000,
          total_budget: 3900000,
          notes: "",
        },
      ],
      lines: [
        {
          section: "income",
          group_name: "Funding",
          line_name: "Grant Income",
          chart_account_id: "",
          project_id: "",
          fund_id: "",
          grant_id: "",
          period_1_amount: 1000000,
          period_2_amount: 1200000,
          period_3_amount: 900000,
          period_4_amount: 800000,
          total_amount: 3900000,
          notes: "",
        },
        {
          section: "expenditure",
          group_name: "Programme Costs",
          line_name: "Field Activities",
          chart_account_id: "",
          project_id: "",
          fund_id: "",
          grant_id: "",
          period_1_amount: 600000,
          period_2_amount: 750000,
          period_3_amount: 500000,
          period_4_amount: 450000,
          total_amount: 2300000,
          notes: "",
        },
      ],
    });
    const sheet = XLSX.utils.json_to_sheet(records);
    const csv = XLSX.utils.sheet_to_csv(sheet);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "budget-import-template.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportBudget = () => {
    if (!selectedBudget) return;
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet([
        {
          name: selectedBudget.name,
          scope_type: selectedBudget.scope_type,
          budget_type: selectedBudget.budget_type,
          period_type: selectedBudget.period_type,
          fiscal_year: selectedBudget.fiscal_year,
          quarter: selectedBudget.quarter ?? "",
          month: selectedBudget.month ?? "",
          currency: selectedBudget.currency,
          exchange_rate: selectedBudget.exchange_rate ?? "",
          status: selectedBudget.status,
          organization_id: selectedBudget.organization_id ?? "",
          team_id: selectedBudget.team_id ?? "",
          project_id: selectedBudget.project_id ?? "",
          fund_id: selectedBudget.fund?.id ?? "",
          grant_id: selectedBudget.grant?.id ?? "",
          notes: selectedBudget.notes ?? "",
        },
      ]),
      "Budget"
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(
        (selectedBudget.assumptions || []).map((entry: any) => ({
          section: entry.section || "",
          label: entry.label || "",
          value: entry.value || "",
          notes: entry.notes || "",
        }))
      ),
      "Assumptions"
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(
        (selectedBudget.portfolio || []).map((entry: any) => ({
          project_id: entry.project_id || "",
          fund_id: entry.fund_id || "",
          grant_id: entry.grant_id || "",
          funder_name: entry.funder_name || "",
          status: entry.status || "",
          period_1_amount: entry.period_1_amount ?? "",
          period_2_amount: entry.period_2_amount ?? "",
          period_3_amount: entry.period_3_amount ?? "",
          period_4_amount: entry.period_4_amount ?? "",
          period_total: entry.period_total ?? "",
          total_budget: entry.total_budget ?? "",
          notes: entry.notes || "",
        }))
      ),
      "Portfolio"
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(
        (selectedBudget.lines || []).map((line: any) => ({
          section: line.section || "",
          group_name: line.group_name || "",
          line_name: line.line_name || line.line_label || "",
          chart_account_id: line.chart_account_id || "",
          project_id: line.project_id || "",
          fund_id: line.fund_id || "",
          grant_id: line.grant_id || "",
          period_1_amount: line.period_1_amount ?? "",
          period_2_amount: line.period_2_amount ?? "",
          period_3_amount: line.period_3_amount ?? "",
          period_4_amount: line.period_4_amount ?? "",
          total_amount: line.total_amount ?? line.amount ?? "",
          actual_total_amount: line.actual_total_amount ?? "",
          variance_amount: line.variance_amount ?? "",
          notes: line.notes || "",
        }))
      ),
      "Lines"
    );
    XLSX.writeFile(workbook, `${selectedBudget.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "budget"}.xlsx`);
  };

  const exportBudgetCsv = () => {
    if (!selectedBudget) return;
    const sheet = XLSX.utils.json_to_sheet(buildBudgetCsvRows(selectedBudget));
    const csv = XLSX.utils.sheet_to_csv(sheet);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${selectedBudget.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "budget"}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportBudgetServer = async () => {
    if (!selectedBudget) return;
    try {
      const file = await exportFinanceBudget(selectedBudget.id, { format: "csv" });
      downloadBase64File(file.file_name, file.mime_type, file.content_base64);
      setNotice({ tone: "success", message: "Server-generated budget export downloaded." });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to export budget from server." });
    }
  };

  const importBudgetFile = async (file: File) => {
    try {
      if (!fileHasSupportedBudgetExtension(file.name)) {
        throw new Error("Unsupported budget file type. Use .xlsx, .xls, or .csv.");
      }
      if (file.size > MAX_BUDGET_IMPORT_SIZE) {
        throw new Error("Budget import file is too large. Use a file smaller than 5MB.");
      }

      if (file.name.toLowerCase().endsWith(".csv")) {
        const text = await file.text();
        const workbook = XLSX.read(text, { type: "string" });
        const firstSheet = workbook.SheetNames[0];
        if (!firstSheet) throw new Error("CSV import is empty.");
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: "" }) as Record<string, unknown>[];
        if (!rows.length) throw new Error("CSV import is empty.");
        const budgetRows = rows.filter((entry) => toText(entry.record_type).toLowerCase() === "budget");
        const assumptionRows = rows.filter((entry) => toText(entry.record_type).toLowerCase() === "assumption");
        const portfolioRows = rows.filter((entry) => toText(entry.record_type).toLowerCase() === "portfolio");
        const lineRows = rows.filter((entry) => toText(entry.record_type).toLowerCase() === "line");
        applyImportedBudget(budgetRows, assumptionRows, portfolioRows, lineRows);
      } else {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        if (!workbook.Sheets["Budget"]) {
          throw new Error("Spreadsheet import must include a Budget sheet.");
        }
        const budgetRows = XLSX.utils.sheet_to_json(workbook.Sheets["Budget"], { defval: "" }) as Record<string, unknown>[];
        const assumptionRows = workbook.Sheets["Assumptions"]
          ? (XLSX.utils.sheet_to_json(workbook.Sheets["Assumptions"], { defval: "" }) as Record<string, unknown>[])
          : [];
        const portfolioRows = workbook.Sheets["Portfolio"]
          ? (XLSX.utils.sheet_to_json(workbook.Sheets["Portfolio"], { defval: "" }) as Record<string, unknown>[])
          : [];
        const lineRows = workbook.Sheets["Lines"]
          ? (XLSX.utils.sheet_to_json(workbook.Sheets["Lines"], { defval: "" }) as Record<string, unknown>[])
          : [];
        applyImportedBudget(budgetRows, assumptionRows, portfolioRows, lineRows);
      }
      setNotice({ tone: "success", message: "Budget spreadsheet imported into the editor." });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.message || "Unable to import budget spreadsheet." });
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const openEdit = (row: any) => {
    setEditingId(row.id);
    setForm({
      name: row.name || "",
      scope_type: row.scope_type || row.budget_type || "organization",
      budget_type: row.budget_type || row.scope_type || "organization",
      period_type: row.period_type || "annual",
      fiscal_year: toText(row.fiscal_year),
      quarter: toText(row.quarter),
      month: toText(row.month),
      currency: row.currency || "NGN",
      exchange_rate: toText(row.exchange_rate),
      status: row.status || "draft",
      organization_id: row.organization_id || "",
      team_id: row.team_id || "",
      project_id: row.project_id || "",
      fund_id: row.fund?.id || "",
      grant_id: row.grant?.id || "",
      parent_budget_id: row.parent_budget_id || "",
      start_date: row.start_date ? String(row.start_date).slice(0, 10) : "",
      end_date: row.end_date ? String(row.end_date).slice(0, 10) : "",
      notes: row.notes || "",
      assumptions: row.assumptions?.length
        ? row.assumptions.map((entry: any) => ({
            section: entry.section || "",
            label: entry.label || "",
            value: entry.value || "",
            notes: entry.notes || "",
          }))
        : [emptyAssumption],
      portfolio: row.portfolio?.length
        ? row.portfolio.map((entry: any) => ({
            project_id: entry.project_id || "",
            fund_id: entry.fund_id || "",
            grant_id: entry.grant_id || "",
            funder_name: entry.funder_name || "",
            status: entry.status || "active",
            period_1_amount: toText(entry.period_1_amount),
            period_2_amount: toText(entry.period_2_amount),
            period_3_amount: toText(entry.period_3_amount),
            period_4_amount: toText(entry.period_4_amount),
            period_total: toText(entry.period_total),
            total_budget: toText(entry.total_budget),
            notes: entry.notes || "",
          }))
        : [],
      lines: row.lines?.length
        ? row.lines.map((line: any) => ({
            section: line.section || "expenditure",
            group_name: line.group_name || "",
            line_name: line.line_name || line.line_label || "",
            chart_account_id: line.chart_account_id || "",
            project_id: line.project_id || "",
            fund_id: line.fund_id || "",
            grant_id: line.grant_id || "",
            period_1_amount: toText(line.period_1_amount),
            period_2_amount: toText(line.period_2_amount),
            period_3_amount: toText(line.period_3_amount),
            period_4_amount: toText(line.period_4_amount),
            total_amount: toText(line.total_amount ?? line.amount),
            notes: line.notes || "",
          }))
        : [emptyLine],
    });
    setShowEditor(true);
  };

  const saveBudget = async () => {
    try {
      setSaving(true);
      const payload = {
        ...form,
        budget_type: form.budget_type || form.scope_type,
        organization_id: form.organization_id || undefined,
        team_id: form.team_id || undefined,
        project_id: form.project_id || undefined,
        fund_id: form.fund_id || undefined,
        grant_id: form.grant_id || undefined,
        parent_budget_id: form.parent_budget_id || undefined,
        exchange_rate: form.exchange_rate ? Number(form.exchange_rate) : undefined,
        fiscal_year: form.fiscal_year ? Number(form.fiscal_year) : undefined,
        quarter: form.quarter ? Number(form.quarter) : undefined,
        month: form.month ? Number(form.month) : undefined,
        assumptions: (form.assumptions || [])
          .filter((entry: any) => entry.label?.trim() && entry.value?.trim())
          .map((entry: any, index: number) => ({
            section: entry.section || undefined,
            label: entry.label.trim(),
            value: entry.value.trim(),
            notes: entry.notes?.trim() || undefined,
            sort_order: index,
          })),
        portfolio: (form.portfolio || [])
          .filter((entry: any) => entry.project_id)
          .map((entry: any, index: number) => ({
            project_id: entry.project_id,
            fund_id: entry.fund_id || undefined,
            grant_id: entry.grant_id || undefined,
            funder_name: entry.funder_name?.trim() || undefined,
            status: entry.status || undefined,
            period_1_amount: entry.period_1_amount ? Number(entry.period_1_amount) : undefined,
            period_2_amount: entry.period_2_amount ? Number(entry.period_2_amount) : undefined,
            period_3_amount: entry.period_3_amount ? Number(entry.period_3_amount) : undefined,
            period_4_amount: entry.period_4_amount ? Number(entry.period_4_amount) : undefined,
            period_total: entry.period_total ? Number(entry.period_total) : undefined,
            total_budget: entry.total_budget ? Number(entry.total_budget) : undefined,
            notes: entry.notes?.trim() || undefined,
            sort_order: index,
          })),
        lines: (form.lines || [])
          .filter((line: any) => line.line_name?.trim())
          .map((line: any, index: number) => ({
            section: line.section || "expenditure",
            group_name: line.group_name?.trim() || undefined,
            line_name: line.line_name.trim(),
            chart_account_id: line.chart_account_id || undefined,
            project_id: line.project_id || undefined,
            fund_id: line.fund_id || undefined,
            grant_id: line.grant_id || undefined,
            period_1_amount: line.period_1_amount ? Number(line.period_1_amount) : undefined,
            period_2_amount: line.period_2_amount ? Number(line.period_2_amount) : undefined,
            period_3_amount: line.period_3_amount ? Number(line.period_3_amount) : undefined,
            period_4_amount: line.period_4_amount ? Number(line.period_4_amount) : undefined,
            total_amount: line.total_amount ? Number(line.total_amount) : undefined,
            notes: line.notes?.trim() || undefined,
            sort_order: index,
          })),
      };
      if (editingId) {
        await updateFinanceBudget(editingId, payload);
      } else {
        await createFinanceBudget(payload);
      }
      setShowEditor(false);
      setEditingId("");
      setForm(emptyForm);
      setNotice({ tone: "success", message: `Budget ${editingId ? "updated" : "created"} successfully.` });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save budget." });
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (id: string, action: "approve" | "reopen" | "recalculate") => {
    try {
      setActingId(id + action);
      if (action === "approve") await approveFinanceBudget(id);
      if (action === "reopen") await reopenFinanceBudget(id);
      if (action === "recalculate") await recalculateFinanceBudget(id);
      setNotice({ tone: "success", message: `Budget ${action}d successfully.` });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || `Unable to ${action} budget.` });
    } finally {
      setActingId("");
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Budgets</h2>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void importBudgetFile(file);
            }}
          />
          <Button variant="outline-secondary" onClick={downloadTemplate}>
            <Lucide icon="FileText" className="w-4 h-4 mr-1" /> Template XLSX
          </Button>
          <Button variant="outline-secondary" onClick={downloadCsvTemplate}>
            <Lucide icon="File" className="w-4 h-4 mr-1" /> Template CSV
          </Button>
          <Button variant="outline-secondary" onClick={() => inputRef.current?.click()}>
            <Lucide icon="Plus" className="w-4 h-4 mr-1" /> Import
          </Button>
          <Button variant="outline-secondary" onClick={exportBudget} disabled={!selectedBudget}>
            <Lucide icon="FileText" className="w-4 h-4 mr-1" /> Export XLSX
          </Button>
          <Button variant="outline-secondary" onClick={exportBudgetCsv} disabled={!selectedBudget}>
            <Lucide icon="File" className="w-4 h-4 mr-1" /> Export CSV
          </Button>
          <Button variant="outline-secondary" onClick={() => void exportBudgetServer()} disabled={!selectedBudget}>
            <Lucide icon="ShieldCheck" className="w-4 h-4 mr-1" /> Server CSV
          </Button>
          <Button variant="outline-secondary" onClick={() => void load()} disabled={loading}>
            <Lucide icon="Undo2" className="w-4 h-4 mr-1" /> Refresh
          </Button>
          <Button variant="primary" onClick={openCreate}>
            <Lucide icon="Plus" className="w-4 h-4 mr-1" /> New Budget
          </Button>
        </div>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="grid grid-cols-12 gap-4 mt-5">
        <div className="col-span-12 sm:col-span-6 xl:col-span-3 box p-5">
          <div className="text-slate-500 text-sm">Total Budgets</div>
          <div className="text-2xl font-medium mt-2">{budgets.length}</div>
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3 box p-5">
          <div className="text-slate-500 text-sm">Budget Value</div>
          <div className="text-2xl font-medium mt-2">{formatMoney(totals.totalBudget)}</div>
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3 box p-5">
          <div className="text-slate-500 text-sm">Approved</div>
          <div className="text-2xl font-medium mt-2">{totals.approvedCount}</div>
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3 box p-5">
          <div className="text-slate-500 text-sm">Org Budgets / Project-tagged</div>
          <div className="text-2xl font-medium mt-2">{totals.orgCount} / {totals.projectTagged}</div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 mt-5 box p-5">
        <div className="col-span-12 md:col-span-3">
          <FormLabel>Scope</FormLabel>
          <FormSelect value={filters.scope_type} onChange={(e) => setFilters((prev) => ({ ...prev, scope_type: e.target.value }))}>
            <option value="">All scopes</option>
            <option value="organization">Organization</option>
            <option value="team">Team</option>
            <option value="project">Project</option>
          </FormSelect>
        </div>
        <div className="col-span-12 md:col-span-3">
          <FormLabel>Period</FormLabel>
          <FormSelect value={filters.period_type} onChange={(e) => setFilters((prev) => ({ ...prev, period_type: e.target.value }))}>
            <option value="">All periods</option>
            <option value="annual">Annual</option>
            <option value="quarterly">Quarterly</option>
            <option value="monthly">Monthly</option>
          </FormSelect>
        </div>
        <div className="col-span-12 md:col-span-3">
          <FormLabel>Fiscal Year</FormLabel>
          <FormInput value={filters.fiscal_year} onChange={(e) => setFilters((prev) => ({ ...prev, fiscal_year: e.target.value }))} placeholder="2026" />
        </div>
        <div className="col-span-12 md:col-span-3">
          <FormLabel>Status</FormLabel>
          <FormSelect value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}>
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
            <option value="closed">Closed</option>
          </FormSelect>
        </div>
        <div className="col-span-12 md:col-span-3 md:col-start-10 flex items-end">
          <Button variant="primary" className="w-full" onClick={() => void load()}>
            <Lucide icon="Search" className="w-4 h-4 mr-1" /> Apply Filters
          </Button>
        </div>
      </div>

      <div className="box p-5 mt-5 overflow-x-auto">
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Scope</Table.Th>
              <Table.Th>Period</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th className="text-right">Budget</Table.Th>
              <Table.Th className="text-right">Action</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {budgets.map((row) => (
              <Table.Tr key={row.id} className={selectedBudgetId === row.id ? "bg-primary/5" : ""}>
                <Table.RowHeader>
                  <button className="text-left font-medium hover:text-primary" onClick={() => setSelectedBudgetId(row.id)}>
                    {row.name}
                  </button>
                  <div className="text-xs text-slate-500 uppercase">{row.scope_type || row.budget_type}</div>
                </Table.RowHeader>
                <Table.Td>
                  {row.scope_type || row.budget_type}
                  <div className="text-xs text-slate-500">{row.project_id ? projects.find((project) => project.id === row.project_id)?.name || `Project ${row.project_id}` : ""}</div>
                </Table.Td>
                <Table.Td>
                  {(row.period_type || "annual").toUpperCase()} {row.fiscal_year || ""} {row.quarter ? `Q${row.quarter}` : row.month ? monthOptions.find((entry) => entry.value === String(row.month))?.label : ""}
                </Table.Td>
                <Table.Td>{row.status}</Table.Td>
                <Table.Td className="text-right">{formatMoney(row.total_budget)}</Table.Td>
                <Table.Td className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline-secondary" onClick={() => openEdit(row)}>
                      <Lucide icon="FilePenLine" className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline-primary" onClick={() => void runAction(row.id, "recalculate")} disabled={actingId === row.id + "recalculate"}>
                      <Lucide icon="BarChart2" className="w-4 h-4" />
                    </Button>
                    {row.status !== "approved" ? (
                      <Button size="sm" variant="outline-success" onClick={() => void runAction(row.id, "approve")} disabled={actingId === row.id + "approve"}>
                        <Lucide icon="BadgeCheck" className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline-warning" onClick={() => void runAction(row.id, "reopen")} disabled={actingId === row.id + "reopen"}>
                        <Lucide icon="Undo2" className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </Table.Td>
              </Table.Tr>
            ))}
            {!budgets.length ? (
              <Table.Tr>
                <Table.Td colSpan={6} className="text-center text-slate-500 py-10">
                  No budgets found.
                </Table.Td>
              </Table.Tr>
            ) : null}
          </Table.Tbody>
        </Table>
      </div>

      {selectedBudget ? (
        <div className="grid grid-cols-12 gap-6 mt-5">
          <div className="col-span-12 xl:col-span-8 box p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-medium text-lg">{selectedBudget.name}</h3>
                <div className="text-slate-500 text-sm mt-1">
                  {(selectedBudget.scope_type || selectedBudget.budget_type || "budget").toUpperCase()} / {(selectedBudget.period_type || "annual").toUpperCase()}
                  {selectedBudget.fiscal_year ? ` / FY ${selectedBudget.fiscal_year}` : ""}
                  {selectedBudget.quarter ? ` / Q${selectedBudget.quarter}` : ""}
                  {selectedBudget.month ? ` / Month ${selectedBudget.month}` : ""}
                </div>
                <div className="text-slate-500 text-sm mt-1">
                  {formatDisplayDate(selectedBudget.start_date)} - {formatDisplayDate(selectedBudget.end_date)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-slate-500 text-sm">Budget Value</div>
                <div className="text-xl font-medium mt-1">{formatMoney(selectedBudget.total_budget)}</div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 mt-5">
              <div className="col-span-12 md:col-span-4 border rounded-md p-4">
                <div className="text-slate-500 text-sm">Net Position</div>
                <div className="text-lg font-medium mt-1">{formatMoney(selectedBudgetMetrics.netPosition)}</div>
                <div className="text-xs text-slate-500 mt-2">Income plan minus expenditure plan.</div>
              </div>
              <div className="col-span-12 md:col-span-4 border rounded-md p-4">
                <div className="text-slate-500 text-sm">Income Coverage</div>
                <div className="text-lg font-medium mt-1">{selectedBudgetMetrics.incomeCoveragePct.toFixed(1)}%</div>
                <div className="text-xs text-slate-500 mt-2">Planned income as a share of planned expenditure.</div>
              </div>
              <div className="col-span-12 md:col-span-4 border rounded-md p-4">
                <div className="text-slate-500 text-sm">Tagged Lines</div>
                <div className="text-lg font-medium mt-1">{selectedBudgetMetrics.projectTaggedSharePct.toFixed(1)}%</div>
                <div className="text-xs text-slate-500 mt-2">Lines linked to project, fund, or grant.</div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 mt-4">
              <div className="col-span-12 md:col-span-6 border rounded-md p-4">
                <div className="text-slate-500 text-sm">Income Summary</div>
                <div className="text-lg font-medium mt-1">{formatMoney(selectedBudgetSections.income.planned)}</div>
                <div className="space-y-2 text-sm mt-3">
                  <div className="flex justify-between"><span>Actual</span><span>{formatMoney(selectedBudgetSections.income.actual)}</span></div>
                  <div className="flex justify-between font-medium"><span>Variance</span><span>{formatMoney(selectedBudgetSections.income.variance)}</span></div>
                </div>
              </div>
              <div className="col-span-12 md:col-span-6 border rounded-md p-4">
                <div className="text-slate-500 text-sm">Expenditure Summary</div>
                <div className="text-lg font-medium mt-1">{formatMoney(selectedBudgetSections.expenditure.planned)}</div>
                <div className="space-y-2 text-sm mt-3">
                  <div className="flex justify-between"><span>Actual</span><span>{formatMoney(selectedBudgetSections.expenditure.actual)}</span></div>
                  <div className="flex justify-between font-medium"><span>Variance</span><span>{formatMoney(selectedBudgetSections.expenditure.variance)}</span></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 mt-5">
              <div className="col-span-12 md:col-span-6">
                <h4 className="font-medium mb-3">Assumptions</h4>
                {(selectedBudget.assumptions || []).length ? (
                  <div className="space-y-3">
                    {selectedBudget.assumptions.map((entry: any) => (
                      <div key={entry.id} className="border rounded-md p-3 text-sm">
                        <div className="font-medium">{entry.label}</div>
                        <div className="text-slate-600 mt-1">{entry.value}</div>
                        {entry.notes ? <div className="text-slate-500 mt-1">{entry.notes}</div> : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">No assumptions captured yet.</div>
                )}
              </div>
              <div className="col-span-12 md:col-span-6">
                <h4 className="font-medium mb-3">Portfolio Attribution</h4>
                {(selectedBudget.portfolio || []).length ? (
                  <div className="space-y-3">
                    {selectedBudget.portfolio.map((entry: any) => (
                      <div key={entry.id} className="border rounded-md p-3 text-sm">
                        <div className="font-medium">
                          {projects.find((project) => project.id === entry.project_id)?.name || `Project ${entry.project_id}`}
                        </div>
                        <div className="text-slate-600 mt-1">{entry.funder_name || "No funder label"}</div>
                        <div className="text-slate-500 mt-1">Total: {formatMoney(entry.total_budget || entry.period_total || 0)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">No project/programme attribution captured yet.</div>
                )}
                <div className="text-xs text-slate-500 mt-3">
                  {selectedBudgetMetrics.portfolioCount} portfolio row{selectedBudgetMetrics.portfolioCount === 1 ? "" : "s"} / {selectedBudgetMetrics.assumptionsCount} assumption{selectedBudgetMetrics.assumptionsCount === 1 ? "" : "s"}
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 xl:col-span-4 box p-5">
            <h3 className="font-medium mb-4">Section / Group Snapshot</h3>
            {selectedBudgetLineGroups.length ? (
              <div className="space-y-4">
                {selectedBudgetLineGroups.map((section) => (
                  <div key={section.section} className="border rounded-md p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="uppercase text-xs text-slate-500">{section.section}</div>
                      <div className="font-medium">{formatMoney(section.total)}</div>
                    </div>
                    <div className="mt-3 space-y-2">
                      {section.groups.slice(0, 5).map((group) => (
                        <div key={`${section.section}-${group.name}`} className="text-sm border rounded-md p-2">
                          <div className="flex items-center justify-between gap-3">
                            <span>{group.name}</span>
                            <span className="font-medium">{formatMoney(group.total)}</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">{group.lines.length} line{group.lines.length === 1 ? "" : "s"}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500">No lines recorded for this budget yet.</div>
            )}
          </div>
        </div>
      ) : null}

      <Dialog open={showEditor} onClose={() => setShowEditor(false)} size="xl">
        <Dialog.Panel>
          <Dialog.Title>
            <h2 className="mr-auto text-base font-medium">{editingId ? "Edit Budget" : "New Budget"}</h2>
          </Dialog.Title>
          <Dialog.Description className="grid grid-cols-12 gap-4 max-h-[75vh] overflow-y-auto">
            <div className="col-span-12 md:col-span-4">
              <FormLabel>Name</FormLabel>
              <FormInput value={form.name} onChange={(e) => setForm((prev: any) => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-2">
              <FormLabel>Scope</FormLabel>
              <FormSelect value={form.scope_type} onChange={(e) => setForm((prev: any) => ({ ...prev, scope_type: e.target.value, budget_type: e.target.value, team_id: "", project_id: "" }))}>
                <option value="organization">Organization</option>
                <option value="team">Team</option>
                <option value="project">Project</option>
              </FormSelect>
            </div>
            <div className="col-span-12 md:col-span-2">
              <FormLabel>Period</FormLabel>
              <FormSelect value={form.period_type} onChange={(e) => setForm((prev: any) => ({ ...prev, period_type: e.target.value, quarter: "", month: "" }))}>
                <option value="annual">Annual</option>
                <option value="quarterly">Quarterly</option>
                <option value="monthly">Monthly</option>
              </FormSelect>
            </div>
            <div className="col-span-12 md:col-span-2">
              <FormLabel>Status</FormLabel>
              <FormSelect value={form.status} onChange={(e) => setForm((prev: any) => ({ ...prev, status: e.target.value }))}>
                <option value="draft">Draft</option>
                <option value="approved">Approved</option>
                <option value="closed">Closed</option>
              </FormSelect>
            </div>
            <div className="col-span-12 md:col-span-2">
              <FormLabel>Currency</FormLabel>
              <FormInput value={form.currency} onChange={(e) => setForm((prev: any) => ({ ...prev, currency: e.target.value.toUpperCase() }))} />
            </div>

            <div className="col-span-12 md:col-span-3">
              <FormLabel>Fiscal Year</FormLabel>
              <FormInput value={form.fiscal_year} onChange={(e) => setForm((prev: any) => ({ ...prev, fiscal_year: e.target.value }))} />
            </div>
            {form.period_type === "quarterly" ? (
              <div className="col-span-12 md:col-span-3">
                <FormLabel>Quarter</FormLabel>
                <FormSelect value={form.quarter} onChange={(e) => setForm((prev: any) => ({ ...prev, quarter: e.target.value }))}>
                  <option value="">Select quarter</option>
                  <option value="1">Q1</option>
                  <option value="2">Q2</option>
                  <option value="3">Q3</option>
                  <option value="4">Q4</option>
                </FormSelect>
              </div>
            ) : null}
            {form.period_type === "monthly" ? (
              <div className="col-span-12 md:col-span-3">
                <FormLabel>Month</FormLabel>
                <FormSelect value={form.month} onChange={(e) => setForm((prev: any) => ({ ...prev, month: e.target.value }))}>
                  <option value="">Select month</option>
                  {monthOptions.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}
                </FormSelect>
              </div>
            ) : null}
            <div className="col-span-12 md:col-span-3">
              <FormLabel>Exchange Rate</FormLabel>
              <FormInput value={form.exchange_rate} onChange={(e) => setForm((prev: any) => ({ ...prev, exchange_rate: e.target.value }))} placeholder="Optional" />
            </div>
            <div className="col-span-12 md:col-span-3">
              <FormLabel>Organization</FormLabel>
              <FormSelect value={form.organization_id} onChange={(e) => setForm((prev: any) => ({ ...prev, organization_id: e.target.value }))}>
                <option value="">Select organization</option>
                {organizations.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
              </FormSelect>
            </div>

            {form.scope_type === "team" ? (
              <div className="col-span-12 md:col-span-6">
                <FormLabel>Team</FormLabel>
                <FormSelect value={form.team_id} onChange={(e) => setForm((prev: any) => ({ ...prev, team_id: e.target.value }))}>
                  <option value="">Select team</option>
                  {teams.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
                </FormSelect>
              </div>
            ) : null}
            {form.scope_type === "project" ? (
              <div className="col-span-12 md:col-span-6">
                <FormLabel>Project</FormLabel>
                <FormSelect value={form.project_id} onChange={(e) => setForm((prev: any) => ({ ...prev, project_id: e.target.value, fund_id: "", grant_id: "" }))}>
                  <option value="">Select project</option>
                  {scopeProjects.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
                </FormSelect>
              </div>
            ) : null}
            <div className="col-span-12 md:col-span-3">
              <FormLabel>Fund</FormLabel>
              <FormSelect value={form.fund_id} onChange={(e) => setForm((prev: any) => ({ ...prev, fund_id: e.target.value, grant_id: "" }))}>
                <option value="">Optional</option>
                {scopedFunds.map((row) => <option key={row.id} value={row.id}>{row.code} - {row.name}</option>)}
              </FormSelect>
            </div>
            <div className="col-span-12 md:col-span-3">
              <FormLabel>Grant</FormLabel>
              <FormSelect value={form.grant_id} onChange={(e) => setForm((prev: any) => ({ ...prev, grant_id: e.target.value }))}>
                <option value="">Optional</option>
                {scopedGrants.map((row) => <option key={row.id} value={row.id}>{row.code} - {row.name}</option>)}
              </FormSelect>
            </div>

            <div className="col-span-12">
              <div className="flex items-center justify-between mb-2">
                <FormLabel>Assumptions</FormLabel>
                <Button size="sm" variant="outline-secondary" onClick={() => setForm((prev: any) => ({ ...prev, assumptions: [...prev.assumptions, { ...emptyAssumption }] }))}>
                  <Lucide icon="Plus" className="w-4 h-4 mr-1" /> Add Assumption
                </Button>
              </div>
              <div className="space-y-3">
                {(form.assumptions || []).map((entry: any, index: number) => (
                  <div key={`assumption-${index}`} className="grid grid-cols-12 gap-3 items-end border rounded-md p-3">
                    <div className="col-span-12 md:col-span-2">
                      <FormLabel>Section</FormLabel>
                      <FormInput value={entry.section} onChange={(e) => setForm((prev: any) => ({ ...prev, assumptions: prev.assumptions.map((row: any, rowIndex: number) => rowIndex === index ? { ...row, section: e.target.value } : row) }))} />
                    </div>
                    <div className="col-span-12 md:col-span-3">
                      <FormLabel>Label</FormLabel>
                      <FormInput value={entry.label} onChange={(e) => setForm((prev: any) => ({ ...prev, assumptions: prev.assumptions.map((row: any, rowIndex: number) => rowIndex === index ? { ...row, label: e.target.value } : row) }))} />
                    </div>
                    <div className="col-span-12 md:col-span-3">
                      <FormLabel>Value</FormLabel>
                      <FormInput value={entry.value} onChange={(e) => setForm((prev: any) => ({ ...prev, assumptions: prev.assumptions.map((row: any, rowIndex: number) => rowIndex === index ? { ...row, value: e.target.value } : row) }))} />
                    </div>
                    <div className="col-span-10 md:col-span-3">
                      <FormLabel>Notes</FormLabel>
                      <FormInput value={entry.notes} onChange={(e) => setForm((prev: any) => ({ ...prev, assumptions: prev.assumptions.map((row: any, rowIndex: number) => rowIndex === index ? { ...row, notes: e.target.value } : row) }))} />
                    </div>
                    <div className="col-span-2 md:col-span-1 flex justify-end">
                      <Button size="sm" variant="outline-danger" onClick={() => setForm((prev: any) => ({ ...prev, assumptions: prev.assumptions.filter((_: any, rowIndex: number) => rowIndex !== index) }))} disabled={(form.assumptions || []).length <= 1}>
                        <Lucide icon="Trash2" className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-12">
              <div className="flex items-center justify-between mb-2">
                <FormLabel>Portfolio Attribution</FormLabel>
                <Button size="sm" variant="outline-secondary" onClick={() => setForm((prev: any) => ({ ...prev, portfolio: [...prev.portfolio, { ...emptyPortfolio }] }))}>
                  <Lucide icon="Plus" className="w-4 h-4 mr-1" /> Add Portfolio Row
                </Button>
              </div>
              <div className="space-y-3">
                {(form.portfolio || []).map((entry: any, index: number) => (
                  <div key={`portfolio-${index}`} className="grid grid-cols-12 gap-3 items-end border rounded-md p-3">
                    <div className="col-span-12 md:col-span-3">
                      <FormLabel>Project</FormLabel>
                      <FormSelect value={entry.project_id} onChange={(e) => setForm((prev: any) => ({ ...prev, portfolio: prev.portfolio.map((row: any, rowIndex: number) => rowIndex === index ? { ...row, project_id: e.target.value } : row) }))}>
                        <option value="">Select project</option>
                        {scopeProjects.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
                      </FormSelect>
                    </div>
                    <div className="col-span-12 md:col-span-2">
                      <FormLabel>Funder</FormLabel>
                      <FormInput value={entry.funder_name} onChange={(e) => setForm((prev: any) => ({ ...prev, portfolio: prev.portfolio.map((row: any, rowIndex: number) => rowIndex === index ? { ...row, funder_name: e.target.value } : row) }))} />
                    </div>
                    {periodLabels.map((label, labelIndex) => (
                      <div key={`${label}-${index}`} className="col-span-6 md:col-span-1">
                        <FormLabel>{label}</FormLabel>
                        <FormInput type="number" value={entry[`period_${labelIndex + 1}_amount`] || ""} onChange={(e) => setForm((prev: any) => ({ ...prev, portfolio: prev.portfolio.map((row: any, rowIndex: number) => rowIndex === index ? { ...row, [`period_${labelIndex + 1}_amount`]: e.target.value } : row) }))} />
                      </div>
                    ))}
                    <div className="col-span-6 md:col-span-2">
                      <FormLabel>Total</FormLabel>
                      <FormInput type="number" value={entry.total_budget} onChange={(e) => setForm((prev: any) => ({ ...prev, portfolio: prev.portfolio.map((row: any, rowIndex: number) => rowIndex === index ? { ...row, total_budget: e.target.value } : row) }))} />
                    </div>
                    <div className="col-span-2 md:col-span-1 flex justify-end">
                      <Button size="sm" variant="outline-danger" onClick={() => setForm((prev: any) => ({ ...prev, portfolio: prev.portfolio.filter((_: any, rowIndex: number) => rowIndex !== index) }))}>
                        <Lucide icon="Trash2" className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-12">
              <div className="flex items-center justify-between mb-2">
                <FormLabel>Budget Lines</FormLabel>
                <Button size="sm" variant="outline-secondary" onClick={() => setForm((prev: any) => ({ ...prev, lines: [...prev.lines, { ...emptyLine }] }))}>
                  <Lucide icon="Plus" className="w-4 h-4 mr-1" /> Add Line
                </Button>
              </div>
              <div className="space-y-3">
                {(form.lines || []).map((line: any, index: number) => (
                  <div key={`line-${index}`} className="grid grid-cols-12 gap-3 items-end border rounded-md p-3">
                    <div className="col-span-12 md:col-span-2">
                      <FormLabel>Section</FormLabel>
                      <FormSelect value={line.section} onChange={(e) => setForm((prev: any) => ({ ...prev, lines: prev.lines.map((row: any, rowIndex: number) => rowIndex === index ? { ...row, section: e.target.value } : row) }))}>
                        <option value="income">Income</option>
                        <option value="expenditure">Expenditure</option>
                      </FormSelect>
                    </div>
                    <div className="col-span-12 md:col-span-2">
                      <FormLabel>Group</FormLabel>
                      <FormInput value={line.group_name} onChange={(e) => setForm((prev: any) => ({ ...prev, lines: prev.lines.map((row: any, rowIndex: number) => rowIndex === index ? { ...row, group_name: e.target.value } : row) }))} />
                    </div>
                    <div className="col-span-12 md:col-span-3">
                      <FormLabel>Line Item</FormLabel>
                      <FormInput value={line.line_name} onChange={(e) => setForm((prev: any) => ({ ...prev, lines: prev.lines.map((row: any, rowIndex: number) => rowIndex === index ? { ...row, line_name: e.target.value } : row) }))} />
                    </div>
                    {periodLabels.map((label, labelIndex) => (
                      <div key={`${label}-line-${index}`} className="col-span-6 md:col-span-1">
                        <FormLabel>{label}</FormLabel>
                        <FormInput
                          type="number"
                          value={line[`period_${labelIndex + 1}_amount`] || ""}
                          onChange={(e) =>
                            setForm((prev: any) => ({
                              ...prev,
                              lines: prev.lines.map((row: any, rowIndex: number) =>
                                rowIndex === index
                                  ? {
                                      ...row,
                                      [`period_${labelIndex + 1}_amount`]: e.target.value,
                                      total_amount: String(
                                        derivedLineTotal({
                                          ...row,
                                          [`period_${labelIndex + 1}_amount`]: e.target.value,
                                        })
                                      ),
                                    }
                                  : row
                              ),
                            }))
                          }
                        />
                      </div>
                    ))}
                    <div className="col-span-6 md:col-span-2">
                      <FormLabel>Total</FormLabel>
                      <FormInput
                        type="number"
                        value={hasPeriodValues(line) ? String(derivedLineTotal(line)) : line.total_amount}
                        onChange={(e) =>
                          setForm((prev: any) => ({
                            ...prev,
                            lines: prev.lines.map((row: any, rowIndex: number) => (rowIndex === index ? { ...row, total_amount: e.target.value } : row)),
                          }))
                        }
                        disabled={hasPeriodValues(line)}
                      />
                      {hasPeriodValues(line) ? <div className="text-xs text-slate-500 mt-1">Auto-calculated from period values.</div> : null}
                    </div>
                    <div className="col-span-2 md:col-span-1 flex justify-end">
                      <Button size="sm" variant="outline-danger" onClick={() => setForm((prev: any) => ({ ...prev, lines: prev.lines.filter((_: any, rowIndex: number) => rowIndex !== index) }))} disabled={(form.lines || []).length <= 1}>
                        <Lucide icon="Trash2" className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-12">
              <h4 className="font-medium mb-3">Editor Subtotals</h4>
              <div className="grid grid-cols-12 gap-4">
                {draftLineSections.map((section) => (
                  <div key={section.section} className="col-span-12 md:col-span-6 border rounded-md p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-slate-500 text-sm uppercase">{section.section}</div>
                        <div className="text-lg font-medium mt-1">{formatMoney(section.planned)}</div>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {section.groups.length} group{section.groups.length === 1 ? "" : "s"}
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      {section.groups.length ? (
                        section.groups.map((group) => (
                          <div key={`${section.section}-${group.name}`} className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">{group.name}</span>
                            <span className="font-medium">{formatMoney(group.total)}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-slate-500">No {section.section} lines yet.</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-12">
              <FormLabel>Notes</FormLabel>
              <FormTextarea rows={3} value={form.notes} onChange={(e) => setForm((prev: any) => ({ ...prev, notes: e.target.value }))} />
            </div>
          </Dialog.Description>
          <Dialog.Footer>
            <Button variant="outline-secondary" onClick={() => setShowEditor(false)} className="mr-2">
              Cancel
            </Button>
            <Button variant="primary" onClick={() => void saveBudget()} disabled={saving}>
              <Lucide icon="CheckCheck" className="w-4 h-4 mr-1" /> {saving ? "Saving..." : editingId ? "Save Changes" : "Create Budget"}
            </Button>
          </Dialog.Footer>
        </Dialog.Panel>
      </Dialog>
    </>
  );
}

export default FinanceBudgetsPage;
