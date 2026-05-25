import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { Button, Chip, Icon, SectionCard, SelectField, TextAreaField, TextField } from "@/shared";
import { formatCurrency, humanize } from "@stanforte/shared";
import type { RequestTypeOption, RequestCategoryOption, RequestRecord, ProjectOption } from "@/pages/requests/requests-api";
import type { FamilyFormHandle } from "./family-form-types";
import type { TagTerm } from "@/pages/requests/taxonomy-api";
import { uploadFileAsset } from "@/pages/files/files-api";

type ItemState = {
  description: string;
  quantity: string;
  unit_price: string;
  notes: string;
  vendor_id: string;
  file_id?: string;
  file_ids?: string[];
  file_names?: string[];
};

type FinancialFormState = {
  due_date: string;
  reimbursement: boolean;
  items: ItemState[];
};

type Props = {
  selectedType: RequestTypeOption;
  selectedCategory: RequestCategoryOption | null;
  vendorOptions: Array<{ id: string; name: string }>;
  editRequest?: RequestRecord | null;
  loadingEdit: boolean;
  onSummary: (node: React.ReactNode) => void;
};

function parsePositiveNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function itemTotal(item: ItemState) {
  return parsePositiveNumber(item.quantity) * parsePositiveNumber(item.unit_price);
}

export const PaymentRequestFormPage = forwardRef<FamilyFormHandle, Props>(({
  selectedType,
  selectedCategory,
  vendorOptions,
  editRequest,
  loadingEdit,
  onSummary,
}, ref) => {
  const [form, setForm] = useState<FinancialFormState>({
    due_date: "",
    reimbursement: false,
    items: [{ description: "", quantity: "1", unit_price: "", notes: "", vendor_id: "" }],
  });

  useEffect(() => {
    if (!editRequest?.data) return;
    const data = editRequest.data as Record<string, unknown>;
    const loadedItems = editRequest.items?.length
      ? editRequest.items.map((item) => ({
          description: item.description ?? "",
          quantity: String(item.quantity ?? 1),
          unit_price: String(item.amount ?? ""),
          notes: item.notes ?? "",
          vendor_id: "",
          file_id: item.file_id ?? undefined,
          file_ids: item.files?.map((f) => f.id),
          file_names: item.files?.map((f) => f.file_name),
        }))
      : [{ description: "", quantity: "1", unit_price: "", notes: "", vendor_id: "" }];
    setForm((prev) => ({
      ...prev,
      due_date: String(data.due_date || ""),
      reimbursement: Boolean(data.reimbursement),
      items: loadedItems,
    }));
  }, [editRequest]);

  const totalAmount = useMemo(
    () => form.items.reduce((sum, item) => sum + parsePositiveNumber(item.quantity) * parsePositiveNumber(item.unit_price), 0),
    [form.items],
  );

  useEffect(() => {
    onSummary(
      <section className="section-card bg-brand-900 p-5 text-white">
        <p className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-white/70">
          {selectedCategory?.name || "Financial Request"}
        </p>
        <p className="mt-3 text-4xl font-semibold tracking-tight">
          {formatCurrency(totalAmount || 0)}
        </p>
        <p className="mt-2 text-sm leading-6 text-white/70">
          {selectedCategory?.description || "The request total updates from the line items you add below."}
        </p>
      </section>,
    );
  }, [totalAmount, selectedCategory, onSummary]);

  useImperativeHandle(ref, () => ({
    validateAndBuild: () => {
      if (form.items.some((item) => !item.description.trim())) {
        return { error: "Each item needs a description." };
      }
      if (form.items.some((item) => parsePositiveNumber(item.quantity) <= 0)) {
        return { error: "Each item needs a valid quantity." };
      }
      if (form.items.some((item) => parsePositiveNumber(item.unit_price) <= 0)) {
        return { error: "Each item needs a valid unit price." };
      }

      return {
        payload: {
          data: {
            due_date: form.due_date || undefined,
            reimbursement: form.reimbursement,
          },
          items: form.items.map((item) => ({
            description: item.description.trim(),
            quantity: parsePositiveNumber(item.quantity) || 1,
            amount: parsePositiveNumber(item.unit_price),
            notes: item.notes.trim() || undefined,
            vendor_id: item.vendor_id || undefined,
            file_id: item.file_ids?.[0] || item.file_id || undefined,
            file_ids: item.file_ids?.length ? item.file_ids : undefined,
          })),
        },
      };
    },
  }));

  async function handleAttachFiles(index: number, files: FileList | null) {
    if (!files || files.length === 0) return;
    try {
      const uploaded = await Promise.all(
        Array.from(files).map((file) =>
          uploadFileAsset(file, {
            metadata: { source: "request_item" },
          }),
        ),
      );
      setForm((prev) => {
        const nextItems = [...prev.items];
        nextItems[index] = {
          ...nextItems[index],
          file_id: uploaded[0]?.id,
          file_ids: uploaded.map((f) => f.id),
          file_names: uploaded.map((f) => f.file_name),
        };
        return { ...prev, items: nextItems };
      });
    } catch {
      // silently fail — file upload is non-critical
    }
  }

  return (
    <>
      <SectionCard
        title="Request Setup"
        description="Configure the request details and timing."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <TextField
            label="Due Date"
            type="date"
            value={form.due_date}
            onChange={(event) => setForm((prev) => ({ ...prev, due_date: event.target.value }))}
          />
          <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <span>
              <span className="field-label">Reimbursement Needed</span>
              <span className="block text-sm text-slate-500">
                Mark this if the request is a reimbursement flow.
              </span>
            </span>
            <input
              type="checkbox"
              checked={form.reimbursement}
              onChange={(event) => setForm((prev) => ({ ...prev, reimbursement: event.target.checked }))}
              className="h-5 w-5 rounded border-slate-300 text-brand-900 focus:ring-brand-900"
            />
          </label>
        </div>
      </SectionCard>

      <SectionCard
        title="Request Items"
        description="List the cost items that make up this request."
        action={
          <Button
            variant="secondary"
            size="sm"
            className="gap-2"
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                items: [...prev.items, { description: "", quantity: "1", unit_price: "", notes: "", vendor_id: "" }],
              }))
            }
          >
            <Icon name="add" className="text-[18px]" />
            Add Line Item
          </Button>
        }
      >
        <div className="space-y-4">
          {form.items.map((item, index) => (
            <div key={`item-${index}`} className="rounded-[20px] border border-slate-200 bg-white p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">Request Item {index + 1}</p>
                  <p className="mt-1 text-xs text-slate-500">Line total updates as quantity and unit price change.</p>
                </div>
                {form.items.length > 1 ? (
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-danger/15 bg-danger/10 text-danger transition hover:bg-danger/15"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        items: prev.items.filter((_, i) => i !== index),
                      }))
                    }
                    aria-label={`Remove request item ${index + 1}`}
                  >
                    <Icon name="delete" className="text-[18px]" />
                  </button>
                ) : null}
              </div>
              <div className="grid gap-4 lg:grid-cols-[1.8fr_0.7fr_0.7fr_auto]">
                <TextField
                  label="Description"
                  value={item.description}
                  onChange={(event) =>
                    setForm((prev) => {
                      const nextItems = [...prev.items];
                      nextItems[index] = { ...nextItems[index], description: event.target.value };
                      return { ...prev, items: nextItems };
                    })
                  }
                />
                <TextField
                  label="Quantity"
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(event) =>
                    setForm((prev) => {
                      const nextItems = [...prev.items];
                      nextItems[index] = { ...nextItems[index], quantity: event.target.value };
                      return { ...prev, items: nextItems };
                    })
                  }
                />
                <TextField
                  label="Unit Price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unit_price}
                  onChange={(event) =>
                    setForm((prev) => {
                      const nextItems = [...prev.items];
                      nextItems[index] = { ...nextItems[index], unit_price: event.target.value };
                      return { ...prev, items: nextItems };
                    })
                  }
                />
                <div className="flex items-end">
                  <div className="mb-1">
                    <Chip variant="neutral">{formatCurrency(itemTotal(item))}</Chip>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <div>
                  <TextAreaField
                    label="Notes"
                    value={item.notes}
                    rows={2}
                    onChange={(event) =>
                      setForm((prev) => {
                        const nextItems = [...prev.items];
                        nextItems[index] = { ...nextItems[index], notes: event.target.value };
                        return { ...prev, items: nextItems };
                      })
                    }
                    placeholder="Optional context."
                  />
                </div>
                <div>
                  <SelectField
                    label="Vendor"
                    value={item.vendor_id}
                    onChange={(event) =>
                      setForm((prev) => {
                        const nextItems = [...prev.items];
                        nextItems[index] = { ...nextItems[index], vendor_id: event.target.value };
                        return { ...prev, items: nextItems };
                      })
                    }
                  >
                    <option value="">No vendor</option>
                    {vendorOptions.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </SelectField>
                </div>
                <div>
                  <span className="field-label">Invoice File</span>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                    <Icon name="attach_file" className="text-[18px]" />
                    {(item.file_names || []).length ? "Change Files" : "Pick Files"}
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      onChange={(event) => {
                        void handleAttachFiles(index, event.target.files);
                        event.target.value = "";
                      }}
                    />
                  </label>
                  <p className="mt-2 text-xs text-slate-500">
                    {(item.file_names || []).length
                      ? `Attached: ${(item.file_names || []).join(", ")}`
                      : "Attach invoice per item"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-center">
          <Button
            variant="secondary"
            size="sm"
            className="gap-2"
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                items: [...prev.items, { description: "", quantity: "1", unit_price: "", notes: "", vendor_id: "" }],
              }))
            }
          >
            <Icon name="add" className="text-[18px]" />
            Add Line Item
          </Button>
        </div>
      </SectionCard>
    </>
  );
});

PaymentRequestFormPage.displayName = "PaymentRequestFormPage";
