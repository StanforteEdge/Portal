import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/Base/Button";
import Table from "@/components/Base/Table";
import Lucide from "@/components/Base/Lucide";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/Base/Form";
import { Dialog } from "@/components/Base/Headless";
import { listUsers, type UserListItem } from "@/services/users";
import { disposeFinanceAsset, getFinanceAsset, type FinanceAssetRecord, verifyFinanceAsset } from "@/services/finance";
import { formatDisplayDate, formatMoney, formatPersonName } from "@/utils/formatting";

function FinanceAssetDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<FinanceAssetRecord | null>(null);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showDisposeModal, setShowDisposeModal] = useState(false);
  const [verifyForm, setVerifyForm] = useState({
    verified_at: new Date().toISOString().slice(0, 10),
    condition: "good",
    location_project: "",
    assigned_to_user_id: "",
    notes: "",
  });
  const [disposeForm, setDisposeForm] = useState({
    disposal_date: new Date().toISOString().slice(0, 10),
    disposal_method: "",
    proceeds: "",
    approved_by: "",
    donor_asset: false,
    notes: "",
  });

  const load = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [assetData, userResponse] = await Promise.all([
        getFinanceAsset(id),
        listUsers({ page: 1, per_page: 500, status: "active" }),
      ]);
      setAsset(assetData);
      setUsers(userResponse.data);
      setVerifyForm((prev) => ({
        ...prev,
        condition: assetData.condition || "good",
        location_project: assetData.location_project || "",
        assigned_to_user_id: assetData.assigned_to?.id || "",
      }));
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load asset details." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const stats = useMemo(() => {
    if (!asset) return null;
    return [
      { label: "Purchase Cost", value: formatMoney(asset.purchase_cost), icon: "Wallet" },
      { label: "Book Value", value: formatMoney(asset.net_book_value), icon: "BarChart2" },
      { label: "Accumulated Depreciation", value: formatMoney(asset.accumulated_depreciation), icon: "TrendingUp" },
      { label: "Useful Life", value: `${asset.useful_life_years} years`, icon: "Clock3" },
    ];
  }, [asset]);

  const submitVerification = async () => {
    if (!asset) return;
    try {
      setSaving(true);
      const updated = await verifyFinanceAsset(asset.id, {
        verified_at: verifyForm.verified_at,
        condition: verifyForm.condition,
        location_project: verifyForm.location_project || undefined,
        assigned_to_user_id: verifyForm.assigned_to_user_id || undefined,
        notes: verifyForm.notes || undefined,
      });
      setAsset(updated);
      setShowVerifyModal(false);
      setNotice({ tone: "success", message: "Asset verification recorded." });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to verify asset." });
    } finally {
      setSaving(false);
    }
  };

  const submitDisposal = async () => {
    if (!asset) return;
    if (!disposeForm.disposal_method.trim()) {
      setNotice({ tone: "warning", message: "Disposal method is required." });
      return;
    }
    try {
      setSaving(true);
      const updated = await disposeFinanceAsset(asset.id, {
        disposal_date: disposeForm.disposal_date,
        disposal_method: disposeForm.disposal_method.trim(),
        proceeds: disposeForm.proceeds.trim() ? Number(disposeForm.proceeds) : 0,
        approved_by: disposeForm.approved_by || undefined,
        donor_asset: disposeForm.donor_asset,
        notes: disposeForm.notes || undefined,
      });
      setAsset(updated);
      setShowDisposeModal(false);
      setNotice({ tone: "success", message: "Asset disposal recorded." });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to dispose asset." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Asset Details</h2>
        <div className="flex gap-2">
          <Button variant="outline-secondary" onClick={() => navigate("/app/finance/assets")}>
            <Lucide icon="ChevronLeft" className="w-4 h-4 mr-1" /> Back
          </Button>
          {asset?.status !== "disposed" ? (
            <>
              <Button variant="outline-primary" onClick={() => navigate(`/app/finance/assets/${id}/edit`)}>
                <Lucide icon="FilePenLine" className="w-4 h-4 mr-1" /> Edit
              </Button>
              <Button variant="outline-secondary" onClick={() => setShowVerifyModal(true)}>
                <Lucide icon="ShieldCheck" className="w-4 h-4 mr-1" /> Verify
              </Button>
              <Button variant="danger" onClick={() => setShowDisposeModal(true)}>
                <Lucide icon="Trash2" className="w-4 h-4 mr-1" /> Dispose
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      {asset ? (
        <>
          <div className="box mt-5 p-5">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 md:col-span-3"><div className="text-xs text-slate-500">Asset ID</div><div className="font-medium">{asset.asset_id}</div></div>
              <div className="col-span-12 md:col-span-4"><div className="text-xs text-slate-500">Description</div><div>{asset.asset_description}</div></div>
              <div className="col-span-12 md:col-span-2"><div className="text-xs text-slate-500">Category</div><div>{asset.category}</div></div>
              <div className="col-span-12 md:col-span-3"><div className="text-xs text-slate-500">Serial / Tag No.</div><div>{asset.serial_tag_no || "-"}</div></div>
              <div className="col-span-12 md:col-span-3"><div className="text-xs text-slate-500">Organization</div><div>{asset.organization?.name || "-"}</div></div>
              <div className="col-span-12 md:col-span-3"><div className="text-xs text-slate-500">Team</div><div>{asset.team?.name || "-"}</div></div>
              <div className="col-span-12 md:col-span-3"><div className="text-xs text-slate-500">Assigned To</div><div>{formatPersonName(asset.assigned_to)}</div></div>
              <div className="col-span-12 md:col-span-3"><div className="text-xs text-slate-500">Location / Project</div><div>{asset.location_project || "-"}</div></div>
              <div className="col-span-12 md:col-span-2"><div className="text-xs text-slate-500">Purchase Date</div><div>{formatDisplayDate(asset.purchase_date)}</div></div>
              <div className="col-span-12 md:col-span-3"><div className="text-xs text-slate-500">Supplier</div><div>{asset.supplier || "-"}</div></div>
              <div className="col-span-12 md:col-span-2"><div className="text-xs text-slate-500">Condition</div><div className="capitalize">{asset.condition}</div></div>
              <div className="col-span-12 md:col-span-2"><div className="text-xs text-slate-500">Status</div><div className="capitalize">{asset.status.replaceAll("_", " ")}</div></div>
              <div className="col-span-12 md:col-span-3"><div className="text-xs text-slate-500">Last Verified</div><div>{formatDisplayDate(asset.last_verified_date)}</div></div>
              <div className="col-span-12"><div className="text-xs text-slate-500">Notes</div><div>{asset.notes || "-"}</div></div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 mt-5">
            {stats?.map((card) => (
              <div key={card.label} className="box col-span-12 md:col-span-3 p-5">
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                  <Lucide icon={card.icon as any} className="w-4 h-4" />
                  <span>{card.label}</span>
                </div>
                <div className="text-lg font-medium mt-2">{card.value}</div>
              </div>
            ))}
          </div>

          {asset.disposal ? (
            <div className="box mt-5 p-5">
              <div className="font-medium mb-3">Disposal Record</div>
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 md:col-span-2"><div className="text-xs text-slate-500">Date</div><div>{formatDisplayDate(asset.disposal.disposal_date)}</div></div>
                <div className="col-span-12 md:col-span-3"><div className="text-xs text-slate-500">Method</div><div>{asset.disposal.disposal_method}</div></div>
                <div className="col-span-12 md:col-span-2"><div className="text-xs text-slate-500">Proceeds</div><div>{formatMoney(asset.disposal.proceeds)}</div></div>
                <div className="col-span-12 md:col-span-2"><div className="text-xs text-slate-500">Book Value</div><div>{formatMoney(asset.disposal.book_value_at_disposal)}</div></div>
                <div className="col-span-12 md:col-span-2"><div className="text-xs text-slate-500">Gain / Loss</div><div>{formatMoney(asset.disposal.gain_loss)}</div></div>
                <div className="col-span-12 md:col-span-1"><div className="text-xs text-slate-500">Donor</div><div>{asset.disposal.donor_asset ? "Yes" : "No"}</div></div>
                <div className="col-span-12 md:col-span-4"><div className="text-xs text-slate-500">Approved By</div><div>{formatPersonName(asset.disposal.approved_by)}</div></div>
                <div className="col-span-12 md:col-span-8"><div className="text-xs text-slate-500">Notes</div><div>{asset.disposal.notes || "-"}</div></div>
              </div>
            </div>
          ) : null}

          <div className="box mt-5 p-5">
            <div className="font-medium mb-3">Verification History</div>
            <Table className="table-report" striped hover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Condition</Table.Th>
                  <Table.Th>Assigned To</Table.Th>
                  <Table.Th>Location</Table.Th>
                  <Table.Th>Verified By</Table.Th>
                  <Table.Th>Notes</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {asset.verifications.map((row) => (
                  <Table.Tr key={row.id}>
                    <Table.Td>{formatDisplayDate(row.verified_at)}</Table.Td>
                    <Table.Td className="capitalize">{row.condition}</Table.Td>
                    <Table.Td>{formatPersonName(row.assigned_to)}</Table.Td>
                    <Table.Td>{row.location_project || "-"}</Table.Td>
                    <Table.Td>{formatPersonName(row.verified_by)}</Table.Td>
                    <Table.Td>{row.notes || "-"}</Table.Td>
                  </Table.Tr>
                ))}
                {asset.verifications.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={6} className="text-center text-slate-500 py-8">No verification record yet.</Table.Td>
                  </Table.Tr>
                ) : null}
              </Table.Tbody>
            </Table>
          </div>
        </>
      ) : loading ? (
        <div className="box mt-5 p-5 text-slate-500">Loading asset...</div>
      ) : null}

      <Dialog open={showVerifyModal} onClose={() => setShowVerifyModal(false)}>
        <Dialog.Panel>
          <div className="p-5 space-y-3">
            <div className="text-lg font-medium">Verify Asset</div>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-12 md:col-span-4">
                <FormLabel>Verified Date</FormLabel>
                <FormInput type="date" value={verifyForm.verified_at} onChange={(e) => setVerifyForm((prev) => ({ ...prev, verified_at: e.target.value }))} />
              </div>
              <div className="col-span-12 md:col-span-4">
                <FormLabel>Condition</FormLabel>
                <FormSelect value={verifyForm.condition} onChange={(e) => setVerifyForm((prev) => ({ ...prev, condition: e.target.value }))}>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </FormSelect>
              </div>
              <div className="col-span-12 md:col-span-4">
                <FormLabel>Assigned To</FormLabel>
                <FormSelect value={verifyForm.assigned_to_user_id} onChange={(e) => setVerifyForm((prev) => ({ ...prev, assigned_to_user_id: e.target.value }))}>
                  <option value="">Unassigned</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {[user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.email}
                    </option>
                  ))}
                </FormSelect>
              </div>
            </div>
            <div>
              <FormLabel>Location / Project</FormLabel>
              <FormInput value={verifyForm.location_project} onChange={(e) => setVerifyForm((prev) => ({ ...prev, location_project: e.target.value }))} />
            </div>
            <div>
              <FormLabel>Notes</FormLabel>
              <FormTextarea rows={3} value={verifyForm.notes} onChange={(e) => setVerifyForm((prev) => ({ ...prev, notes: e.target.value }))} />
            </div>
            <div className="flex gap-2">
              <Button variant="primary" onClick={() => void submitVerification()} disabled={saving}>
                <Lucide icon="ShieldCheck" className="w-4 h-4 mr-1" /> {saving ? "Saving..." : "Save Verification"}
              </Button>
              <Button variant="outline-secondary" onClick={() => setShowVerifyModal(false)}>Cancel</Button>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>

      <Dialog open={showDisposeModal} onClose={() => setShowDisposeModal(false)}>
        <Dialog.Panel>
          <div className="p-5 space-y-3">
            <div className="text-lg font-medium">Dispose Asset</div>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-12 md:col-span-4">
                <FormLabel>Disposal Date</FormLabel>
                <FormInput type="date" value={disposeForm.disposal_date} onChange={(e) => setDisposeForm((prev) => ({ ...prev, disposal_date: e.target.value }))} />
              </div>
              <div className="col-span-12 md:col-span-4">
                <FormLabel>Method</FormLabel>
                <FormInput value={disposeForm.disposal_method} onChange={(e) => setDisposeForm((prev) => ({ ...prev, disposal_method: e.target.value }))} />
              </div>
              <div className="col-span-12 md:col-span-4">
                <FormLabel>Proceeds (NGN)</FormLabel>
                <FormInput type="number" value={disposeForm.proceeds} onChange={(e) => setDisposeForm((prev) => ({ ...prev, proceeds: e.target.value }))} />
              </div>
            </div>
            <div>
              <FormLabel>Approved By</FormLabel>
              <FormSelect value={disposeForm.approved_by} onChange={(e) => setDisposeForm((prev) => ({ ...prev, approved_by: e.target.value }))}>
                <option value="">Select approver</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {[user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.email}
                  </option>
                ))}
              </FormSelect>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={disposeForm.donor_asset}
                onChange={(e) => setDisposeForm((prev) => ({ ...prev, donor_asset: e.target.checked }))}
              />
              <span>Donor-funded asset</span>
            </label>
            <div>
              <FormLabel>Notes</FormLabel>
              <FormTextarea rows={3} value={disposeForm.notes} onChange={(e) => setDisposeForm((prev) => ({ ...prev, notes: e.target.value }))} />
            </div>
            <div className="flex gap-2">
              <Button variant="danger" onClick={() => void submitDisposal()} disabled={saving}>
                <Lucide icon="Trash2" className="w-4 h-4 mr-1" /> {saving ? "Saving..." : "Record Disposal"}
              </Button>
              <Button variant="outline-secondary" onClick={() => setShowDisposeModal(false)}>Cancel</Button>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    </>
  );
}

export default FinanceAssetDetailPage;
