import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "@/components/Base/Button";
import Table from "@/components/Base/Table";
import Lucide from "@/components/Base/Lucide";
import { FormInput, FormLabel } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { listFinanceAssetDisposals, type FinanceAssetDisposalRecord } from "@/services/finance";
import { formatDisplayDate, formatMoney, formatPersonName } from "@/utils/formatting";

function FinanceAssetDisposalsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<FinanceAssetDisposalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [filters, setFilters] = useState({ from: "", to: "" });

  const load = async () => {
    try {
      setLoading(true);
      const data = await listFinanceAssetDisposals({
        ...(filters.from ? { from: filters.from } : {}),
        ...(filters.to ? { to: filters.to } : {}),
      });
      setRows(data);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load disposal log." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Asset Disposal Log</h2>
        <div className="flex gap-2">
          <Button variant="outline-secondary" onClick={() => navigate("/appOld/finance/assets")}>
            <Lucide icon="ChevronLeft" className="w-4 h-4 mr-1" /> Back to Assets
          </Button>
          <Button variant="outline-secondary" onClick={() => void load()} disabled={loading}>
            <Lucide icon="Undo2" className="w-4 h-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="box mt-5 p-5">
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-3">
            <FormLabel>From</FormLabel>
            <FormInput type="date" value={filters.from} onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))} />
          </div>
          <div className="col-span-12 md:col-span-3">
            <FormLabel>To</FormLabel>
            <FormInput type="date" value={filters.to} onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))} />
          </div>
          <div className="col-span-12 md:col-span-2 flex items-end">
            <Button variant="outline-primary" onClick={() => void load()} disabled={loading}>
              {loading ? "Loading..." : "Apply"}
            </Button>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <Table className="table-report" striped hover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Asset</Table.Th>
                <Table.Th>Disposal</Table.Th>
                <Table.Th>Original Cost</Table.Th>
                <Table.Th>Book Value</Table.Th>
                <Table.Th>Proceeds</Table.Th>
                <Table.Th>Gain / Loss</Table.Th>
                <Table.Th>Approved By</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((row) => (
                <Table.Tr key={row.id}>
                  <Table.Td>
                    <Link className="font-semibold text-primary hover:underline" to={`/appOld/finance/assets/${row.asset_record_id}`}>
                      {row.asset_id}
                    </Link>
                    <div className="text-sm">{row.asset_description}</div>
                    <div className="text-xs text-slate-500">{row.category}</div>
                  </Table.Td>
                  <Table.Td>
                    <div>{formatDisplayDate(row.disposal_date)}</div>
                    <div className="text-xs text-slate-500">{row.disposal_method}</div>
                  </Table.Td>
                  <Table.Td>{formatMoney(row.original_cost)}</Table.Td>
                  <Table.Td>{formatMoney(row.book_value_at_disposal)}</Table.Td>
                  <Table.Td>{formatMoney(row.proceeds)}</Table.Td>
                  <Table.Td>{formatMoney(row.gain_loss)}</Table.Td>
                  <Table.Td>
                    <div>{formatPersonName(row.approved_by)}</div>
                    <div className="text-xs text-slate-500">{row.donor_asset ? "Donor Asset" : "Regular Asset"}</div>
                  </Table.Td>
                </Table.Tr>
              ))}
              {!loading && rows.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={7} className="text-center text-slate-500 py-8">No disposal records found.</Table.Td>
                </Table.Tr>
              ) : null}
            </Table.Tbody>
          </Table>
        </div>
      </div>
    </>
  );
}

export default FinanceAssetDisposalsPage;
