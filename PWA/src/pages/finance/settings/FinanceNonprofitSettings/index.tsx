import { useEffect, useState } from "react";
import Button from "@/components/Base/Button";
import Table from "@/components/Base/Table";
import Lucide from "@/components/Base/Lucide";
import { Dialog } from "@/components/Base/Headless";
import { FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import {
  createFinanceDonor,
  createFinanceFund,
  createFinanceGrant,
  listFinanceDonors,
  listFinanceFunds,
  listFinanceGrants,
  updateFinanceDonor,
  updateFinanceFund,
  updateFinanceGrant,
} from "@/services/financeAccounting";
import { formatDisplayDate, formatMoney } from "@/utils/formatting";

const emptyDonor = { name: "", donor_type: "grantor", email: "", phone: "", address: "", is_active: true };
const emptyFund = { code: "", name: "", fund_type: "operating", restriction_type: "unrestricted", donor_id: "", purpose: "", is_active: true };
const emptyGrant = {
  code: "",
  name: "",
  donor_id: "",
  fund_id: "",
  restriction_type: "restricted",
  start_date: "",
  end_date: "",
  committed_amount: "",
  recognized_amount: "",
  deferred_amount: "",
  status: "active",
  purpose: "",
  notes: "",
};

function FinanceNonprofitSettingsPage() {
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [donors, setDonors] = useState<any[]>([]);
  const [funds, setFunds] = useState<any[]>([]);
  const [grants, setGrants] = useState<any[]>([]);
  const [showDonor, setShowDonor] = useState(false);
  const [showFund, setShowFund] = useState(false);
  const [showGrant, setShowGrant] = useState(false);
  const [donorId, setDonorId] = useState("");
  const [fundId, setFundId] = useState("");
  const [grantId, setGrantId] = useState("");
  const [donorForm, setDonorForm] = useState(emptyDonor);
  const [fundForm, setFundForm] = useState(emptyFund);
  const [grantForm, setGrantForm] = useState(emptyGrant);

  const load = async () => {
    try {
      const [donorRows, fundRows, grantRows] = await Promise.all([
        listFinanceDonors(),
        listFinanceFunds(),
        listFinanceGrants(),
      ]);
      setDonors(donorRows);
      setFunds(fundRows);
      setGrants(grantRows);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load non-profit settings." });
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const saveDonor = async () => {
    try {
      if (donorId) await updateFinanceDonor(donorId, donorForm);
      else await createFinanceDonor(donorForm);
      setShowDonor(false);
      setDonorId("");
      setDonorForm(emptyDonor);
      setNotice({ tone: "success", message: "Donor saved." });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save donor." });
    }
  };

  const saveFund = async () => {
    try {
      if (fundId) await updateFinanceFund(fundId, fundForm);
      else await createFinanceFund(fundForm);
      setShowFund(false);
      setFundId("");
      setFundForm(emptyFund);
      setNotice({ tone: "success", message: "Fund saved." });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save fund." });
    }
  };

  const saveGrant = async () => {
    try {
      const payload = {
        ...grantForm,
        donor_id: grantForm.donor_id || undefined,
        fund_id: grantForm.fund_id || undefined,
        start_date: grantForm.start_date || undefined,
        end_date: grantForm.end_date || undefined,
        committed_amount: Number(grantForm.committed_amount || 0),
        recognized_amount: Number(grantForm.recognized_amount || 0),
        deferred_amount: Number(grantForm.deferred_amount || 0),
      };
      if (grantId) await updateFinanceGrant(grantId, payload);
      else await createFinanceGrant(payload);
      setShowGrant(false);
      setGrantId("");
      setGrantForm(emptyGrant);
      setNotice({ tone: "success", message: "Grant saved." });
      await load();
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save grant." });
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Non-Profit Finance Settings</h2>
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => { setDonorId(""); setDonorForm(emptyDonor); setShowDonor(true); }}>
            <Lucide icon="Users" className="w-4 h-4 mr-1" /> New Donor
          </Button>
          <Button variant="outline-primary" onClick={() => { setFundId(""); setFundForm(emptyFund); setShowFund(true); }}>
            <Lucide icon="Wallet" className="w-4 h-4 mr-1" /> New Fund
          </Button>
          <Button variant="outline-secondary" onClick={() => { setGrantId(""); setGrantForm(emptyGrant); setShowGrant(true); }}>
            <Lucide icon="FileText" className="w-4 h-4 mr-1" /> New Grant
          </Button>
        </div>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="grid grid-cols-12 gap-6 mt-5">
        <div className="col-span-12 xl:col-span-4 box p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="font-medium">Donors</div>
            <div className="text-xs text-slate-500">{donors.length} record(s)</div>
          </div>
          <Table>
            <Table.Thead>
              <Table.Tr><Table.Th>Name</Table.Th><Table.Th>Type</Table.Th><Table.Th className="text-right">Action</Table.Th></Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {donors.map((row) => (
                <Table.Tr key={row.id}>
                  <Table.Td>
                    <div className="font-medium">{row.name}</div>
                    <div className="text-xs text-slate-500">{row.email || "-"}</div>
                  </Table.Td>
                  <Table.Td>{row.donor_type}</Table.Td>
                  <Table.Td className="text-right">
                    <Button size="sm" variant="outline-secondary" onClick={() => { setDonorId(row.id); setDonorForm({ name: row.name || "", donor_type: row.donor_type || "grantor", email: row.email || "", phone: row.phone || "", address: row.address || "", is_active: row.is_active !== false }); setShowDonor(true); }}>
                      <Lucide icon="FilePenLine" className="w-4 h-4" />
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>

        <div className="col-span-12 xl:col-span-4 box p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="font-medium">Funds</div>
            <div className="text-xs text-slate-500">{funds.length} record(s)</div>
          </div>
          <Table>
            <Table.Thead>
              <Table.Tr><Table.Th>Fund</Table.Th><Table.Th>Restriction</Table.Th><Table.Th className="text-right">Action</Table.Th></Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {funds.map((row) => (
                <Table.Tr key={row.id}>
                  <Table.Td>
                    <div className="font-medium">{row.code}</div>
                    <div className="text-xs text-slate-500">{row.name}</div>
                  </Table.Td>
                  <Table.Td>{row.restriction_type}</Table.Td>
                  <Table.Td className="text-right">
                    <Button size="sm" variant="outline-secondary" onClick={() => { setFundId(row.id); setFundForm({ code: row.code || "", name: row.name || "", fund_type: row.fund_type || "operating", restriction_type: row.restriction_type || "unrestricted", donor_id: row.donor?.id || "", purpose: row.purpose || "", is_active: row.is_active !== false }); setShowFund(true); }}>
                      <Lucide icon="FilePenLine" className="w-4 h-4" />
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>

        <div className="col-span-12 xl:col-span-4 box p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="font-medium">Grants</div>
            <div className="text-xs text-slate-500">{grants.length} record(s)</div>
          </div>
          <Table>
            <Table.Thead>
              <Table.Tr><Table.Th>Grant</Table.Th><Table.Th>Status</Table.Th><Table.Th className="text-right">Action</Table.Th></Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {grants.map((row) => (
                <Table.Tr key={row.id}>
                  <Table.Td>
                    <div className="font-medium">{row.code}</div>
                    <div className="text-xs text-slate-500">{row.name}</div>
                  </Table.Td>
                  <Table.Td>
                    <div>{row.status}</div>
                    <div className="text-xs text-slate-500">{formatMoney(row.committed_amount)}</div>
                  </Table.Td>
                  <Table.Td className="text-right">
                    <Button size="sm" variant="outline-secondary" onClick={() => { setGrantId(row.id); setGrantForm({ code: row.code || "", name: row.name || "", donor_id: row.donor?.id || "", fund_id: row.fund?.id || "", restriction_type: row.restriction_type || "restricted", start_date: row.start_date ? String(row.start_date).slice(0, 10) : "", end_date: row.end_date ? String(row.end_date).slice(0, 10) : "", committed_amount: String(row.committed_amount || ""), recognized_amount: String(row.recognized_amount || ""), deferred_amount: String(row.deferred_amount || ""), status: row.status || "active", purpose: row.purpose || "", notes: row.notes || "" }); setShowGrant(true); }}>
                      <Lucide icon="FilePenLine" className="w-4 h-4" />
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      </div>

      <Dialog open={showDonor} onClose={() => setShowDonor(false)}>
        <Dialog.Panel className="p-5">
          <div className="text-lg font-medium">{donorId ? "Edit" : "New"} Donor</div>
          <div className="grid grid-cols-12 gap-4 mt-5">
            <div className="col-span-12 md:col-span-6"><FormLabel>Name</FormLabel><FormInput value={donorForm.name} onChange={(e) => setDonorForm((prev) => ({ ...prev, name: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-6"><FormLabel>Type</FormLabel><FormSelect value={donorForm.donor_type} onChange={(e) => setDonorForm((prev) => ({ ...prev, donor_type: e.target.value }))}><option value="grantor">Grantor</option><option value="donor">Donor</option><option value="partner">Partner</option></FormSelect></div>
            <div className="col-span-12 md:col-span-6"><FormLabel>Email</FormLabel><FormInput value={donorForm.email} onChange={(e) => setDonorForm((prev) => ({ ...prev, email: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-6"><FormLabel>Phone</FormLabel><FormInput value={donorForm.phone} onChange={(e) => setDonorForm((prev) => ({ ...prev, phone: e.target.value }))} /></div>
            <div className="col-span-12"><FormLabel>Address</FormLabel><FormTextarea rows={3} value={donorForm.address} onChange={(e) => setDonorForm((prev) => ({ ...prev, address: e.target.value }))} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-6"><Button variant="outline-secondary" onClick={() => setShowDonor(false)}>Cancel</Button><Button variant="primary" onClick={() => void saveDonor()}>Save Donor</Button></div>
        </Dialog.Panel>
      </Dialog>

      <Dialog open={showFund} onClose={() => setShowFund(false)}>
        <Dialog.Panel className="p-5">
          <div className="text-lg font-medium">{fundId ? "Edit" : "New"} Fund</div>
          <div className="grid grid-cols-12 gap-4 mt-5">
            <div className="col-span-12 md:col-span-4"><FormLabel>Code</FormLabel><FormInput value={fundForm.code} onChange={(e) => setFundForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))} /></div>
            <div className="col-span-12 md:col-span-8"><FormLabel>Name</FormLabel><FormInput value={fundForm.name} onChange={(e) => setFundForm((prev) => ({ ...prev, name: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Fund Type</FormLabel><FormSelect value={fundForm.fund_type} onChange={(e) => setFundForm((prev) => ({ ...prev, fund_type: e.target.value }))}><option value="operating">Operating</option><option value="grant">Grant</option><option value="reserve">Reserve</option><option value="project">Project</option></FormSelect></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Restriction</FormLabel><FormSelect value={fundForm.restriction_type} onChange={(e) => setFundForm((prev) => ({ ...prev, restriction_type: e.target.value }))}><option value="unrestricted">Unrestricted</option><option value="restricted">Restricted</option><option value="temporarily_restricted">Temporarily Restricted</option><option value="permanently_restricted">Permanently Restricted</option></FormSelect></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Donor</FormLabel><FormSelect value={fundForm.donor_id} onChange={(e) => setFundForm((prev) => ({ ...prev, donor_id: e.target.value }))}><option value="">None</option>{donors.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</FormSelect></div>
            <div className="col-span-12"><FormLabel>Purpose</FormLabel><FormTextarea rows={3} value={fundForm.purpose} onChange={(e) => setFundForm((prev) => ({ ...prev, purpose: e.target.value }))} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-6"><Button variant="outline-secondary" onClick={() => setShowFund(false)}>Cancel</Button><Button variant="primary" onClick={() => void saveFund()}>Save Fund</Button></div>
        </Dialog.Panel>
      </Dialog>

      <Dialog open={showGrant} onClose={() => setShowGrant(false)}>
        <Dialog.Panel className="p-5 max-w-4xl">
          <div className="text-lg font-medium">{grantId ? "Edit" : "New"} Grant</div>
          <div className="grid grid-cols-12 gap-4 mt-5">
            <div className="col-span-12 md:col-span-4"><FormLabel>Code</FormLabel><FormInput value={grantForm.code} onChange={(e) => setGrantForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))} /></div>
            <div className="col-span-12 md:col-span-8"><FormLabel>Name</FormLabel><FormInput value={grantForm.name} onChange={(e) => setGrantForm((prev) => ({ ...prev, name: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Donor</FormLabel><FormSelect value={grantForm.donor_id} onChange={(e) => setGrantForm((prev) => ({ ...prev, donor_id: e.target.value }))}><option value="">Select donor</option>{donors.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</FormSelect></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Fund</FormLabel><FormSelect value={grantForm.fund_id} onChange={(e) => setGrantForm((prev) => ({ ...prev, fund_id: e.target.value }))}><option value="">Select fund</option>{funds.map((row) => <option key={row.id} value={row.id}>{row.code} - {row.name}</option>)}</FormSelect></div>
            <div className="col-span-12 md:col-span-4"><FormLabel>Restriction</FormLabel><FormSelect value={grantForm.restriction_type} onChange={(e) => setGrantForm((prev) => ({ ...prev, restriction_type: e.target.value }))}><option value="restricted">Restricted</option><option value="temporarily_restricted">Temporarily Restricted</option><option value="unrestricted">Unrestricted</option></FormSelect></div>
            <div className="col-span-12 md:col-span-3"><FormLabel>Start Date</FormLabel><FormInput type="date" value={grantForm.start_date} onChange={(e) => setGrantForm((prev) => ({ ...prev, start_date: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-3"><FormLabel>End Date</FormLabel><FormInput type="date" value={grantForm.end_date} onChange={(e) => setGrantForm((prev) => ({ ...prev, end_date: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-3"><FormLabel>Status</FormLabel><FormSelect value={grantForm.status} onChange={(e) => setGrantForm((prev) => ({ ...prev, status: e.target.value }))}><option value="active">Active</option><option value="closed">Closed</option><option value="suspended">Suspended</option></FormSelect></div>
            <div className="col-span-12 md:col-span-3"><FormLabel>Committed Amount</FormLabel><FormInput type="number" min="0" value={grantForm.committed_amount} onChange={(e) => setGrantForm((prev) => ({ ...prev, committed_amount: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-6"><FormLabel>Recognized Amount</FormLabel><FormInput type="number" min="0" value={grantForm.recognized_amount} onChange={(e) => setGrantForm((prev) => ({ ...prev, recognized_amount: e.target.value }))} /></div>
            <div className="col-span-12 md:col-span-6"><FormLabel>Deferred Amount</FormLabel><FormInput type="number" min="0" value={grantForm.deferred_amount} onChange={(e) => setGrantForm((prev) => ({ ...prev, deferred_amount: e.target.value }))} /></div>
            <div className="col-span-12"><FormLabel>Purpose</FormLabel><FormTextarea rows={2} value={grantForm.purpose} onChange={(e) => setGrantForm((prev) => ({ ...prev, purpose: e.target.value }))} /></div>
            <div className="col-span-12"><FormLabel>Notes</FormLabel><FormTextarea rows={3} value={grantForm.notes} onChange={(e) => setGrantForm((prev) => ({ ...prev, notes: e.target.value }))} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-6"><Button variant="outline-secondary" onClick={() => setShowGrant(false)}>Cancel</Button><Button variant="primary" onClick={() => void saveGrant()}>Save Grant</Button></div>
        </Dialog.Panel>
      </Dialog>

      <div className="box p-5 mt-5">
        <div className="font-medium mb-2">Configuration order</div>
        <ol className="list-decimal ml-5 text-sm text-slate-600 space-y-1">
          <li>Create donor records.</li>
          <li>Create funds and set whether they are restricted or unrestricted.</li>
          <li>Create grants and attach each grant to its donor and, where applicable, its fund.</li>
          <li>Use the fund and grant IDs on income, invoices, bills, and request-linked finance records.</li>
        </ol>
      </div>
    </>
  );
}

export default FinanceNonprofitSettingsPage;
