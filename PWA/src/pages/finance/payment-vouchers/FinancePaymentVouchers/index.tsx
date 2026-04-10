import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "@/components/Base/Button";
import Table from "@/components/Base/Table";
import Pagination from "@/components/Base/Pagination";
import Lucide from "@/components/Base/Lucide";
import { FormInput, FormLabel, FormSelect } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { listFinancePaymentVouchers, type FinancePaymentVoucherListRecord } from "@/services/finance";
import { formatDisplayDate, formatMoney, formatRequestNumber } from "@/utils/formatting";

function FinancePaymentVouchersPage() {
  const [rows, setRows] = useState<FinancePaymentVoucherListRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [filters, setFilters] = useState({
    voucher_number: "",
    request_id: "",
    retirement_status: "",
    method: "",
    from: "",
    to: "",
    per_page: 20,
    page: 1,
  });
  const [meta, setMeta] = useState({ page: 1, per_page: 20, total: 0, last_page: 1 });

  const load = async () => {
    try {
      setLoading(true);
      const res = await listFinancePaymentVouchers({
        ...(filters.voucher_number ? { voucher_number: filters.voucher_number } : {}),
        ...(filters.request_id ? { request_id: filters.request_id } : {}),
        ...(filters.retirement_status ? { retirement_status: filters.retirement_status } : {}),
        ...(filters.method ? { method: filters.method } : {}),
        ...(filters.from ? { from: filters.from } : {}),
        ...(filters.to ? { to: filters.to } : {}),
        page: filters.page,
        per_page: filters.per_page,
      });
      setRows(res.data || []);
      setMeta(res.meta || { page: 1, per_page: filters.per_page, total: 0, last_page: 1 });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load payment vouchers." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.per_page]);

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Payment Vouchers</h2>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="box mt-5 p-5">
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-3">
            <FormLabel>Voucher Number</FormLabel>
            <FormInput value={filters.voucher_number} onChange={(e) => setFilters((p) => ({ ...p, voucher_number: e.target.value }))} />
          </div>
          <div className="col-span-12 md:col-span-2">
            <FormLabel>Request ID</FormLabel>
            <FormInput value={filters.request_id} onChange={(e) => setFilters((p) => ({ ...p, request_id: e.target.value }))} />
          </div>
          <div className="col-span-12 md:col-span-2">
            <FormLabel>Retirement Status</FormLabel>
            <FormSelect value={filters.retirement_status} onChange={(e) => setFilters((p) => ({ ...p, retirement_status: e.target.value }))}>
              <option value="">All</option>
              <option value="not_retired">Not Retired</option>
              <option value="partial">Partial</option>
              <option value="retired">Retired</option>
              <option value="verified">Verified</option>
            </FormSelect>
          </div>
          <div className="col-span-12 md:col-span-2">
            <FormLabel>Method</FormLabel>
            <FormInput value={filters.method} onChange={(e) => setFilters((p) => ({ ...p, method: e.target.value }))} />
          </div>
          <div className="col-span-6 md:col-span-1">
            <FormLabel>From</FormLabel>
            <FormInput type="date" value={filters.from} onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))} />
          </div>
          <div className="col-span-6 md:col-span-1">
            <FormLabel>To</FormLabel>
            <FormInput type="date" value={filters.to} onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))} />
          </div>
          <div className="col-span-12 md:col-span-1 flex items-end">
            <Button
              variant="outline-primary"
              onClick={() => {
                setFilters((p) => ({ ...p, page: 1 }));
                void load();
              }}
              disabled={loading}
            >
              {loading ? "..." : "Apply"}
            </Button>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <Table className="table-report" striped hover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Voucher</Table.Th>
                <Table.Th>Request</Table.Th>
                <Table.Th>Requester</Table.Th>
                <Table.Th>Amount</Table.Th>
                <Table.Th>Retired</Table.Th>
                <Table.Th>Balance</Table.Th>
                <Table.Th>Account</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Date</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((row) => (
                <Table.Tr key={row.id}>
                  <Table.Td>
                    <Link className="font-medium text-primary hover:underline" to={`/appOld/finance/requests/request/${row.request_id}?voucher_id=${row.id}`}>
                      {row.voucher_number}
                    </Link>
                    <div className="text-xs text-slate-500">{row.method || "-"}</div>
                    <div className="text-xs text-slate-500">Click to view or edit</div>
                  </Table.Td>
                  <Table.Td>
                    <Link className="font-semibold text-primary hover:underline" to={`/appOld/finance/requests/request/${row.request_id}`}>
                      {formatRequestNumber(row.request_number)}
                    </Link>
                    <div className="text-xs text-slate-500">{row.request_type}</div>
                  </Table.Td>
                  <Table.Td>{row.request_creator_name}</Table.Td>
                  <Table.Td>{formatMoney(row.amount)}</Table.Td>
                  <Table.Td>{formatMoney(row.retired_amount)}</Table.Td>
                  <Table.Td>{formatMoney(row.voucher_balance)}</Table.Td>
                  <Table.Td>
                    {row.paid_from_account ? (
                      <>
                        <div className="font-medium">{row.paid_from_account.name}</div>
                        <div className="text-xs text-slate-500">{row.paid_from_account.code || "-"}</div>
                      </>
                    ) : (
                      "-"
                    )}
                  </Table.Td>
                  <Table.Td className="capitalize">{row.retirement_status.replaceAll("_", " ")}</Table.Td>
                  <Table.Td>{formatDisplayDate(row.disbursed_at)}</Table.Td>
                </Table.Tr>
              ))}
              {!loading && rows.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={9} className="text-center text-slate-500 py-8">
                    No payment vouchers found.
                  </Table.Td>
                </Table.Tr>
              ) : null}
            </Table.Tbody>
          </Table>
        </div>

        <div className="flex flex-wrap items-center justify-between p-5 border-t border-slate-200/60 dark:border-darkmode-400 mt-4">
          <div className="text-slate-500 text-sm">Showing {rows.length} of {meta.total} vouchers</div>
          <div className="flex items-center gap-3">
            <FormLabel className="sr-only">Items per page</FormLabel>
            <FormSelect
              className="w-auto"
              value={filters.per_page}
              onChange={(e) => setFilters((p) => ({ ...p, per_page: Number(e.target.value), page: 1 }))}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </FormSelect>
            <Pagination>
              <Pagination.Link onClick={() => setFilters((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}>
                <Lucide icon="ChevronLeft" className="w-4 h-4" />
              </Pagination.Link>
              <Pagination.Link active>{meta.page}</Pagination.Link>
              <Pagination.Link onClick={() => setFilters((p) => ({ ...p, page: Math.min(meta.last_page || 1, p.page + 1) }))}>
                <Lucide icon="ChevronRight" className="w-4 h-4" />
              </Pagination.Link>
            </Pagination>
          </div>
        </div>
      </div>
    </>
  );
}

export default FinancePaymentVouchersPage;
