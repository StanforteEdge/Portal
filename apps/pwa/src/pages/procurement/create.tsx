import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { procurementApi } from "@/shared/lib/core";
import { formatCurrency } from "@stanforte/shared";
import { Button, SectionCard } from '@/shared';

const EMPTY_ITEM = { description: '', qty: 1, unit: 'unit', estimatedUnitCost: 0 };

export default function CreatePr() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', category: 'goods' as const, paymentPattern: 'post_delivery' as const, justification: '' });
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [saving, setSaving] = useState(false);

  const total = items.reduce((s, i) => s + i.qty * i.estimatedUnitCost, 0);

  const updateItem = (idx: number, field: string, value: any) =>
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));

  const handleSubmit = async (andSubmit = false) => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const pr = await procurementApi.createPr({ ...form, items } as any);
      if (andSubmit) await procurementApi.submitPr((pr as any).id);
      navigate(`/procurement/${(pr as any).id}`);
    } catch (err) {
      console.error(err);
    } finally { setSaving(false); }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">New Purchase Requisition</h1>
        <p className="text-sm text-slate-500">Submit a requisition for approval before creating a purchase order.</p>
      </div>

      <SectionCard title="Requisition Details" description="Configure basic settings and justification">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-1">Requisition Title</label>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="e.g. Purchase of QA Testing Laptops"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
            <select
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value as any }))}
            >
              <option value="goods">Goods</option>
              <option value="services">Services</option>
              <option value="works">Works</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Payment Pattern</label>
            <select
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={form.paymentPattern}
              onChange={e => setForm(f => ({ ...f, paymentPattern: e.target.value as any }))}
            >
              <option value="post_delivery">Post-Delivery</option>
              <option value="pre_payment">Pre-Payment</option>
              <option value="milestone">Milestone</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-1">Justification</label>
            <textarea
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              rows={3}
              placeholder="Provide a justification for this purchase requisition..."
              value={form.justification}
              onChange={e => setForm(f => ({ ...f, justification: e.target.value }))}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Line Items" description="Add specific goods, services, or works to be procured">
        <div className="space-y-3">
          {items.map((it, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-5">
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Description"
                  value={it.description}
                  onChange={e => updateItem(idx, 'description', e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  type="number"
                  placeholder="Qty"
                  value={it.qty}
                  onChange={e => updateItem(idx, 'qty', Number(e.target.value))}
                />
              </div>
              <div className="col-span-2">
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Unit"
                  value={it.unit}
                  onChange={e => updateItem(idx, 'unit', e.target.value)}
                />
              </div>
              <div className="col-span-3">
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  type="number"
                  placeholder="Est. Cost"
                  value={it.estimatedUnitCost}
                  onChange={e => updateItem(idx, 'estimatedUnitCost', Number(e.target.value))}
                />
              </div>
            </div>
          ))}

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <button
              type="button"
              className="text-xs font-semibold text-brand-600 hover:text-brand-500 flex items-center gap-1"
              onClick={() => setItems(p => [...p, { ...EMPTY_ITEM }])}
            >
              <span className="material-symbols-outlined text-sm">add</span> Add Item
            </button>
            <div className="text-lg font-bold text-slate-900">Total: {formatCurrency(total)}</div>
          </div>
        </div>
      </SectionCard>

      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={() => handleSubmit(false)} disabled={saving}>
          Save Draft
        </Button>
        <Button onClick={() => handleSubmit(true)} disabled={saving || !form.title.trim()}>
          Submit Requisition
        </Button>
      </div>
    </div>
  );
}
