import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  AppShell,
  Button,
  PageHeader,
  SectionCard,
  TextField,
  SelectField,
  TextAreaField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
} from "@/shared";
import { buildAppMobileNav, buildRequestsNavigation } from "@/pages/requests/requests-data";
import { useAuth } from "@/shared/context/AuthProvider";
import { financeApi, useCachedQuery } from "@/shared/lib/core";

const emptyLine = {
  section: "expenditure",
  group_name: "",
  line_name: "",
  total_amount: "",
};

const emptyAssumption = {
  section: "general",
  label: "",
  value: "",
  notes: "",
};

const emptyPortfolio = {
  funder_name: "",
  status: "active",
  total_budget: "",
};

export default function FinanceBudgetEditorPage() {
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const userName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.email || "Staff";

  const [activeTab, setActiveTab] = useState<"summary" | "expenditures" | "assumptions" | "portfolio">("summary");
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [periodType, setPeriodType] = useState("annual");
  const [quarter, setQuarter] = useState("");
  const [month, setMonth] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [notes, setNotes] = useState("");

  const [assumptions, setAssumptions] = useState<any[]>([emptyAssumption]);
  const [portfolio, setPortfolio] = useState<any[]>([emptyPortfolio]);
  const [lines, setLines] = useState<any[]>([emptyLine]);

  const { data: existingBudget, loading } = useCachedQuery(
    `finance:budget:${id}`,
    () => (isEditing ? financeApi.getBudget(id!) : Promise.resolve(null)),
    { ttlMs: 30_000, storage: "memory" }
  );

  useEffect(() => {
    if (existingBudget) {
      setTitle(existingBudget.title || "");
      setYear(existingBudget.year ? String(existingBudget.year) : "");
      setQuarter(existingBudget.quarter ? String(existingBudget.quarter) : "");
      setMonth(existingBudget.month ? String(existingBudget.month) : "");
      setCurrency(existingBudget.currency || "NGN");
      setNotes((existingBudget as any).notes || "");
      setPeriodType((existingBudget as any).period_type || "annual");
      
      const bAssumptions = (existingBudget as any).assumptions || [];
      const bPortfolio = (existingBudget as any).portfolio || [];
      const bLines = (existingBudget as any).lines || [];

      if (bAssumptions.length > 0) setAssumptions(bAssumptions);
      if (bPortfolio.length > 0) setPortfolio(bPortfolio);
      if (bLines.length > 0) setLines(bLines);
    }
  }, [existingBudget]);

  const handleSave = async () => {
    setIsSaving(true);
    const payload = {
      title,
      year: year ? Number(year) : undefined,
      quarter: quarter ? Number(quarter) : undefined,
      month: month ? Number(month) : undefined,
      currency,
      period_type: periodType,
      notes,
      assumptions: assumptions.filter((a) => a.label || a.value),
      portfolio: portfolio.filter((p) => p.funder_name || p.total_budget),
      lines: lines.filter((l) => l.line_name || l.total_amount),
    };

    try {
      if (isEditing) {
        if (financeApi.updateBudget) {
          await financeApi.updateBudget(id!, payload);
        }
        alert("Budget updated successfully");
      } else {
        const res = await financeApi.createBudget?.(payload);
        alert("Budget created successfully");
        if (res?.id) {
          navigate(`/finance/budgets/${res.id}`);
          return;
        }
      }
      navigate("/finance/budgets");
    } catch (e: any) {
      alert(e?.message || "Failed to save budget");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <AppShell
        navigation={buildRequestsNavigation()}
        activeLabel="finance-budgets"
        user={{ name: userName, role: "Finance" }}
        mobileNav={buildAppMobileNav("Finance")}
      >
        <div className="flex h-64 items-center justify-center text-slate-500">Loading editor...</div>
      </AppShell>
    );
  }

  return (
    <AppShell
      navigation={buildRequestsNavigation()}
      activeLabel="finance-budgets"
      user={{ name: userName, role: "Finance" }}
      mobileNav={buildAppMobileNav("Finance")}
    >
      <PageHeader
        eyebrow="Budget Editor"
        breadcrumbs={[
          { label: "Finance", path: "/finance" },
          { label: "Budgets", path: "/finance/budgets" },
          { label: isEditing ? "Edit" : "New" }
        ]}
        title={isEditing ? `Edit Budget` : "Create New Budget"}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
            <Button onClick={handleSave} isLoading={isSaving}>Save Budget</Button>
          </div>
        }
      />

      <div className="mb-6 flex border-b border-slate-200">
        {(["summary", "expenditures", "assumptions", "portfolio"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize ${
              activeTab === tab
                ? "border-b-2 border-primary text-primary"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "summary" && (
        <SectionCard title="Basic Details">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Title (Optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
            <SelectField label="Period Type" value={periodType} onChange={(e) => setPeriodType(e.target.value)}>
              <option value="annual">Annual</option>
              <option value="quarterly">Quarterly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom</option>
            </SelectField>
            <TextField label="Year" type="number" value={year} onChange={(e) => setYear(e.target.value)} />
            <SelectField label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="NGN">NGN - Naira</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
            </SelectField>
            {periodType === "quarterly" && (
              <SelectField label="Quarter" value={quarter} onChange={(e) => setQuarter(e.target.value)}>
                <option value="">Select Quarter...</option>
                <option value="1">Q1</option>
                <option value="2">Q2</option>
                <option value="3">Q3</option>
                <option value="4">Q4</option>
              </SelectField>
            )}
            {periodType === "monthly" && (
              <SelectField label="Month" value={month} onChange={(e) => setMonth(e.target.value)}>
                <option value="">Select Month...</option>
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i + 1} value={String(i + 1)}>Month {i + 1}</option>
                ))}
              </SelectField>
            )}
          </div>
          <div className="mt-4">
            <TextAreaField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
          </div>
        </SectionCard>
      )}

      {activeTab === "expenditures" && (
        <SectionCard 
          title="Expenditure Lines" 
          description="Enter budgeted lines. Empty rows will be ignored."
          actions={<Button variant="outline" onClick={() => setLines([...lines, { ...emptyLine }])}>+ Add Row</Button>}
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableHeaderRow>
                  <TableHeaderCell>Group Name</TableHeaderCell>
                  <TableHeaderCell>Line Name</TableHeaderCell>
                  <TableHeaderCell>Total Amount</TableHeaderCell>
                  <TableHeaderCell></TableHeaderCell>
                </TableHeaderRow>
              </TableHead>
              <TableBody>
                {lines.map((line, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <TextField
                        value={line.group_name || ""}
                        onChange={(e) => {
                          const updated = [...lines];
                          updated[idx].group_name = e.target.value;
                          setLines(updated);
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={line.line_name || ""}
                        onChange={(e) => {
                          const updated = [...lines];
                          updated[idx].line_name = e.target.value;
                          setLines(updated);
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={line.total_amount || ""}
                        onChange={(e) => {
                          const updated = [...lines];
                          updated[idx].total_amount = e.target.value;
                          setLines(updated);
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" tone="danger" onClick={() => setLines(lines.filter((_, i) => i !== idx))}>
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      )}

      {activeTab === "assumptions" && (
        <SectionCard 
          title="Assumptions"
          actions={<Button variant="outline" onClick={() => setAssumptions([...assumptions, { ...emptyAssumption }])}>+ Add Assumption</Button>}
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableHeaderRow>
                  <TableHeaderCell>Label</TableHeaderCell>
                  <TableHeaderCell>Value</TableHeaderCell>
                  <TableHeaderCell>Notes</TableHeaderCell>
                  <TableHeaderCell></TableHeaderCell>
                </TableHeaderRow>
              </TableHead>
              <TableBody>
                {assumptions.map((asm, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <TextField
                        value={asm.label || ""}
                        onChange={(e) => {
                          const updated = [...assumptions];
                          updated[idx].label = e.target.value;
                          setAssumptions(updated);
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={asm.value || ""}
                        onChange={(e) => {
                          const updated = [...assumptions];
                          updated[idx].value = e.target.value;
                          setAssumptions(updated);
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={asm.notes || ""}
                        onChange={(e) => {
                          const updated = [...assumptions];
                          updated[idx].notes = e.target.value;
                          setAssumptions(updated);
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" tone="danger" onClick={() => setAssumptions(assumptions.filter((_, i) => i !== idx))}>
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      )}

      {activeTab === "portfolio" && (
        <SectionCard 
          title="Portfolio Integrations"
          actions={<Button variant="outline" onClick={() => setPortfolio([...portfolio, { ...emptyPortfolio }])}>+ Add Portfolio</Button>}
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableHeaderRow>
                  <TableHeaderCell>Funder Name</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Total Budget</TableHeaderCell>
                  <TableHeaderCell></TableHeaderCell>
                </TableHeaderRow>
              </TableHead>
              <TableBody>
                {portfolio.map((port, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <TextField
                        value={port.funder_name || ""}
                        onChange={(e) => {
                          const updated = [...portfolio];
                          updated[idx].funder_name = e.target.value;
                          setPortfolio(updated);
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <SelectField
                        value={port.status || "active"}
                        onChange={(e) => {
                          const updated = [...portfolio];
                          updated[idx].status = e.target.value;
                          setPortfolio(updated);
                        }}
                      >
                        <option value="active">Active</option>
                        <option value="pipeline">Pipeline</option>
                        <option value="closed">Closed</option>
                      </SelectField>
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={port.total_budget || ""}
                        onChange={(e) => {
                          const updated = [...portfolio];
                          updated[idx].total_budget = e.target.value;
                          setPortfolio(updated);
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" tone="danger" onClick={() => setPortfolio(portfolio.filter((_, i) => i !== idx))}>
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      )}
    </AppShell>
  );
}
