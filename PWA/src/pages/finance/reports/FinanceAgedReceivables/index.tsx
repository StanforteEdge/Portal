import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import Table from "@/components/Base/Table";
import { FormInput, FormLabel, FormSelect } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { listOrganizations } from "@/services/organizations";
import { listTeams } from "@/services/teams";
import { getFinanceReceivables } from "@/services/financeReporting";
import { formatDisplayDate, formatMoney } from "@/utils/formatting";

function FinanceAgedReceivablesPage() {
  const navigate = useNavigate();
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [filters, setFilters] = useState({ from: "", to: "", organization_id: "", team_id: "" });
  const [report, setReport] = useState<any>(null);

  const load = async () => {
    try {
      setLoading(true);
      const params = {
        ...(filters.from ? { from: filters.from } : {}),
        ...(filters.to ? { to: filters.to } : {}),
        ...(filters.organization_id ? { organization_id: filters.organization_id } : {}),
        ...(filters.team_id ? { team_id: filters.team_id } : {}),
      };
      const [reportData, organizationRows, teamRows] = await Promise.all([
        getFinanceReceivables(params),
        listOrganizations({ is_active: true }).catch(() => []),
        listTeams({ active_only: true }).catch(() => []),
      ]);
      setReport(reportData);
      setOrganizations(organizationRows);
      setTeams(teamRows);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load aged receivables." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Aged Receivables</h2>
        <Button variant="outline-secondary" onClick={() => void load()} disabled={loading}>
          <Lucide icon="Undo2" className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="grid grid-cols-12 gap-4 mt-5 box p-5">
        <div className="col-span-12 md:col-span-3">
          <FormLabel>From</FormLabel>
          <FormInput type="date" value={filters.from} onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))} />
        </div>
        <div className="col-span-12 md:col-span-3">
          <FormLabel>To</FormLabel>
          <FormInput type="date" value={filters.to} onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))} />
        </div>
        <div className="col-span-12 md:col-span-3">
          <FormLabel>Organization</FormLabel>
          <FormSelect value={filters.organization_id} onChange={(e) => setFilters((prev) => ({ ...prev, organization_id: e.target.value }))}>
            <option value="">All organizations</option>
            {organizations.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
          </FormSelect>
        </div>
        <div className="col-span-12 md:col-span-2">
          <FormLabel>Team</FormLabel>
          <FormSelect value={filters.team_id} onChange={(e) => setFilters((prev) => ({ ...prev, team_id: e.target.value }))}>
            <option value="">All teams</option>
            {teams.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
          </FormSelect>
        </div>
        <div className="col-span-12 md:col-span-1 flex items-end">
          <Button variant="primary" className="w-full" onClick={() => void load()}>
            <Lucide icon="Search" className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 mt-5">
        <div className="col-span-12 md:col-span-6 xl:col-span-2 box p-5"><div className="text-slate-500 text-sm">Current</div><div className="text-2xl font-medium mt-2">{formatMoney(report?.summary?.buckets?.current || 0)}</div></div>
        <div className="col-span-12 md:col-span-6 xl:col-span-2 box p-5"><div className="text-slate-500 text-sm">1-30 Days</div><div className="text-2xl font-medium mt-2">{formatMoney(report?.summary?.buckets?.["1-30"] || 0)}</div></div>
        <div className="col-span-12 md:col-span-6 xl:col-span-2 box p-5"><div className="text-slate-500 text-sm">31-60 Days</div><div className="text-2xl font-medium mt-2">{formatMoney(report?.summary?.buckets?.["31-60"] || 0)}</div></div>
        <div className="col-span-12 md:col-span-6 xl:col-span-2 box p-5"><div className="text-slate-500 text-sm">61-90 Days</div><div className="text-2xl font-medium mt-2">{formatMoney(report?.summary?.buckets?.["61-90"] || 0)}</div></div>
        <div className="col-span-12 md:col-span-6 xl:col-span-2 box p-5"><div className="text-slate-500 text-sm">90+ Days</div><div className="text-2xl font-medium mt-2">{formatMoney(report?.summary?.buckets?.["90+"] || 0)}</div></div>
        <div className="col-span-12 md:col-span-6 xl:col-span-2 box p-5"><div className="text-slate-500 text-sm">Outstanding</div><div className="text-2xl font-medium mt-2">{formatMoney(report?.summary?.total_outstanding || 0)}</div></div>
      </div>

      <div className="box p-5 mt-5">
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Invoice</Table.Th>
              <Table.Th>Customer</Table.Th>
              <Table.Th>Issue Date</Table.Th>
              <Table.Th>Due Date</Table.Th>
              <Table.Th>Aging</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th className="text-right">Outstanding</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {(report?.items || []).map((item: any) => (
              <Table.Tr key={item.id}>
                <Table.Td>
                  <button
                    type="button"
                    className="text-primary font-medium"
                    onClick={() => navigate(`/app/finance/receivables/${item.id}`)}
                  >
                    {item.document_number}
                  </button>
                </Table.Td>
                <Table.Td>{item.party_name}</Table.Td>
                <Table.Td>{formatDisplayDate(item.issue_date)}</Table.Td>
                <Table.Td>{formatDisplayDate(item.due_date)}</Table.Td>
                <Table.Td>{item.aging_bucket} ({item.age_days}d)</Table.Td>
                <Table.Td className="capitalize">{String(item.status || "").replaceAll("_", " ")}</Table.Td>
                <Table.Td className="text-right">{formatMoney(item.outstanding_amount, "-", item.currency)}</Table.Td>
              </Table.Tr>
            ))}
            {!(report?.items || []).length ? (
              <Table.Tr>
                <Table.Td colSpan={7} className="text-center text-slate-500 py-10">No receivables found.</Table.Td>
              </Table.Tr>
            ) : null}
          </Table.Tbody>
        </Table>
      </div>
    </>
  );
}

export default FinanceAgedReceivablesPage;
