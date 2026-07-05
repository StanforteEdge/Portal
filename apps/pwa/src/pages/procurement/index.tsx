import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { procurementApi } from "@/shared/lib/core";
import { formatCurrency } from "@stanforte/shared";
import { SectionCard } from '@/shared';

export default function ProcurementIndex() {
  const [prs, setPrs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    procurementApi.listPrs()
      .then((data: any) => setPrs(data))
      .finally(() => setLoading(false));
  }, []);

  const statusColor: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700',
    submitted: 'bg-blue-100 text-blue-700 border-blue-200',
    approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    rejected: 'bg-rose-100 text-rose-700 border-rose-200',
    returned: 'bg-amber-100 text-amber-700 border-amber-200',
    converted_to_po: 'bg-violet-100 text-violet-700 border-violet-200',
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Purchase Requisitions</h1>
          <p className="text-sm text-slate-500">Raise and track purchase requisitions for goods, services, or works.</p>
        </div>
        <Link
          to="/procurement/create"
          className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 transition-all"
        >
          New Requisition
        </Link>
      </div>

      <SectionCard title="All Requisitions" description="Overview of your raised and pending requisitions">
        {loading ? (
          <div className="py-12 text-center text-slate-500">Loading requisitions...</div>
        ) : prs.length === 0 ? (
          <div className="py-12 text-center text-slate-500 border border-dashed border-slate-200 rounded-2xl">
            <span className="material-symbols-outlined text-4xl text-slate-400">shopping_cart</span>
            <p className="mt-2 text-sm font-medium">No requisitions found</p>
            <p className="text-xs text-slate-400 mt-1">Get started by creating a new purchase requisition.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-slate-600">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="text-left pb-3 font-semibold">Number</th>
                  <th className="text-left pb-3 font-semibold">Title</th>
                  <th className="text-left pb-3 font-semibold">Category</th>
                  <th className="text-left pb-3 font-semibold">Est. Total</th>
                  <th className="text-left pb-3 font-semibold">Status</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {prs.map(pr => (
                  <tr key={pr.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 font-mono text-xs text-slate-900 font-medium">{pr.requisitionNumber}</td>
                    <td className="py-3.5 font-medium text-slate-900">{pr.title}</td>
                    <td className="py-3.5 capitalize text-xs">{pr.category}</td>
                    <td className="py-3.5 font-semibold text-slate-900">{formatCurrency(Number(pr.estimatedTotal))}</td>
                    <td className="py-3.5">
                      <span className={`inline-flex items-center rounded-lg px-2 py-1 text-xs font-semibold border ${statusColor[pr.status] ?? 'bg-slate-100 text-slate-700'}`}>
                        {pr.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <Link to={`/procurement/${pr.id}`} className="text-xs font-semibold text-brand-600 hover:text-brand-500 underline">
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
