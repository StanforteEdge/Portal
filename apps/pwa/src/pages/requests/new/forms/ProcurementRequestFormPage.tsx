import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { SectionCard, TextField, TextAreaField, SelectField } from "@/shared";
import type { ApprovedBudgetLineOption, RequestTypeOption, RequestCategoryOption, RequestRecord } from "@/pages/requests/requests-api";
import type { RequestFormHandle } from "./category-form-types";

type Props = {
  selectedType: RequestTypeOption;
  selectedCategory: RequestCategoryOption | null;
  editRequest?: RequestRecord | null;
  loadingEdit: boolean;
  approvedBudgetLines: ApprovedBudgetLineOption[];
  onSummary: (node: React.ReactNode) => void;
};

export const ProcurementRequestFormPage = forwardRef<RequestFormHandle, Props>(({
  selectedCategory,
  editRequest,
  approvedBudgetLines,
  onSummary,
}, ref) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("goods");
  const [neededBy, setNeededBy] = useState("");
  const [budgetId, setBudgetId] = useState("");
  const [budgetLineId, setBudgetLineId] = useState("");
  const [justification, setJustification] = useState("");
  const [specification, setSpecification] = useState("");
  const [suggestedVendorId, setSuggestedVendorId] = useState("");

  const budgetOptions = useMemo(() => {
    const byBudget = new Map<string, { id: string; name: string }>();
    for (const line of approvedBudgetLines) {
      if (!byBudget.has(line.budget_id)) {
        byBudget.set(line.budget_id, { id: line.budget_id, name: line.budget_name });
      }
    }
    return Array.from(byBudget.values());
  }, [approvedBudgetLines]);

  const budgetLineOptions = useMemo(
    () => approvedBudgetLines.filter((line) => !budgetId || line.budget_id === budgetId),
    [approvedBudgetLines, budgetId],
  );

  const selectedBudgetLine = useMemo(
    () => approvedBudgetLines.find((line) => line.budget_line_id === budgetLineId) ?? null,
    [approvedBudgetLines, budgetLineId],
  );

  useEffect(() => {
    if (!editRequest?.data) return;
    const data = editRequest.data as Record<string, unknown>;
    setTitle(String(data.title || ""));
    setCategory(String(data.category || "goods"));
    setNeededBy(String(data.needed_by || ""));
    setBudgetId(String(data.budget_id || ""));
    setBudgetLineId(String(data.budget_line_id || ""));
    setJustification(String(data.justification || ""));
    setSpecification(String(data.specification || ""));
    setSuggestedVendorId(String(data.suggested_vendor_id || ""));
  }, [editRequest]);

  useEffect(() => {
    onSummary(
      <section className="section-card bg-brand-900 p-5 text-white">
        <p className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-white/70">
          {selectedCategory?.name || "Procurement Request"}
        </p>
        <p className="mt-3 text-4xl font-semibold tracking-tight">&mdash;</p>
        <p className="mt-2 text-sm leading-6 text-white/70">
          {title || selectedCategory?.description || "Fill in the procurement details."}
        </p>
      </section>,
    );
  }, [selectedCategory, onSummary, title]);

  useImperativeHandle(ref, () => ({
    validateAndBuild: () => ({
      payload: {
        data: {
          title: title.trim() || undefined,
          category: category || undefined,
          needed_by: neededBy || undefined,
          budget_id: budgetId || undefined,
          budget_revision_id: selectedBudgetLine?.budget_revision_id || undefined,
          budget_line_id: budgetLineId || undefined,
          justification: justification.trim() || undefined,
          specification: specification.trim() || undefined,
          suggested_vendor_id: suggestedVendorId || undefined,
        },
      },
    }),
  }));

  return (
    <SectionCard
      title="Procurement Details"
      description="Describe what you need to procure."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <TextField
            label="Item / Service Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Purchase of QA Testing Laptops"
          />
        </div>
        <SelectField
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="goods">Goods</option>
          <option value="services">Services</option>
          <option value="works">Works</option>
        </SelectField>
        <TextField
          label="Needed By"
          type="date"
          value={neededBy}
          onChange={(e) => setNeededBy(e.target.value)}
        />
        <SelectField
          label="Budget"
          value={budgetId}
          onChange={(e) => {
            setBudgetId(e.target.value);
            setBudgetLineId("");
          }}
          disabled={budgetOptions.length === 0}
        >
          <option value="">Select approved budget</option>
          {budgetOptions.map((option) => (
            <option key={option.id} value={option.id}>{option.name}</option>
          ))}
        </SelectField>
        <SelectField
          label="Budget Line"
          value={budgetLineId}
          onChange={(e) => setBudgetLineId(e.target.value)}
          disabled={budgetLineOptions.length === 0}
        >
          <option value="">Select approved budget line</option>
          {budgetLineOptions.map((option) => (
            <option key={option.budget_line_id} value={option.budget_line_id}>
              {option.line_label} ({option.total_amount})
            </option>
          ))}
        </SelectField>
        <TextField
          label="Suggested Vendor ID"
          value={suggestedVendorId}
          onChange={(e) => setSuggestedVendorId(e.target.value)}
          placeholder="Vendor UUID (optional)"
        />
        <div className="md:col-span-2">
          <TextAreaField
            label="Justification"
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Why is this procurement needed?"
            rows={3}
          />
        </div>
        <div className="md:col-span-2">
          <TextAreaField
            label="Specification"
            value={specification}
            onChange={(e) => setSpecification(e.target.value)}
            placeholder="Detailed specs, preferred brands, or requirements"
            rows={4}
          />
        </div>
      </div>
    </SectionCard>
  );
});

ProcurementRequestFormPage.displayName = "ProcurementRequestFormPage";
