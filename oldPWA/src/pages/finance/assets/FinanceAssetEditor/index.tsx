import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/Base/Button";
import { FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/Base/Form";
import Lucide from "@/components/Base/Lucide";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { listOrganizations, type OrganizationRecord } from "@/services/organizations";
import { listTeams, type TeamOption } from "@/services/teams";
import { listUsers, type UserListItem } from "@/services/users";
import { createFinanceAsset, getFinanceAsset, updateFinanceAsset } from "@/services/finance";

const initialForm = {
  asset_id: "",
  organization_id: "",
  team_id: "",
  asset_description: "",
  category: "",
  serial_tag_no: "",
  location_project: "",
  assigned_to_user_id: "",
  purchase_date: "",
  supplier: "",
  purchase_cost: "",
  useful_life_years: "3",
  salvage_value: "0",
  condition: "good",
  status: "active",
  notes: "",
};

function FinanceAssetEditorPage() {
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(initialForm);
  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [organizationOptions, teamOptions, userResponse, asset] = await Promise.all([
          listOrganizations({ is_active: true }),
          listTeams({ active_only: false }),
          listUsers({ page: 1, per_page: 500, status: "active" }),
          isEdit ? getFinanceAsset(id) : Promise.resolve(null),
        ]);
        setOrganizations(organizationOptions);
        setTeams(teamOptions);
        setUsers(userResponse.data);

        if (asset) {
          setForm({
            asset_id: asset.asset_id || "",
            organization_id: asset.organization?.id || "",
            team_id: asset.team?.id || "",
            asset_description: asset.asset_description || "",
            category: asset.category || "",
            serial_tag_no: asset.serial_tag_no || "",
            location_project: asset.location_project || "",
            assigned_to_user_id: asset.assigned_to?.id || "",
            purchase_date: asset.purchase_date ? String(asset.purchase_date).slice(0, 10) : "",
            supplier: asset.supplier || "",
            purchase_cost: String(asset.purchase_cost ?? ""),
            useful_life_years: String(asset.useful_life_years ?? 3),
            salvage_value: String(asset.salvage_value ?? 0),
            condition: asset.condition || "good",
            status: asset.status || "active",
            notes: asset.notes || "",
          });
        }
      } catch (error: any) {
        setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load asset editor." });
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id, isEdit]);

  const save = async () => {
    if (!form.asset_description.trim() || !form.category.trim() || !form.purchase_date || !form.purchase_cost.trim()) {
      setNotice({ tone: "warning", message: "Description, category, purchase date, and purchase cost are required." });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        asset_id: form.asset_id.trim() || undefined,
        organization_id: form.organization_id || undefined,
        team_id: form.team_id || undefined,
        asset_description: form.asset_description.trim(),
        category: form.category.trim(),
        serial_tag_no: form.serial_tag_no.trim() || undefined,
        location_project: form.location_project.trim() || undefined,
        assigned_to_user_id: form.assigned_to_user_id || undefined,
        purchase_date: form.purchase_date,
        supplier: form.supplier.trim() || undefined,
        purchase_cost: Number(form.purchase_cost),
        useful_life_years: Number(form.useful_life_years),
        salvage_value: Number(form.salvage_value || 0),
        condition: form.condition,
        status: form.status,
        notes: form.notes.trim() || undefined,
      };
      const saved = isEdit ? await updateFinanceAsset(id, payload) : await createFinanceAsset(payload);
      navigate(`/appOld/finance/assets/${saved.id}`, { replace: true });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save asset." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">{isEdit ? "Edit Asset" : "New Asset"}</h2>
        <Button variant="outline-secondary" onClick={() => navigate(isEdit ? `/appOld/finance/assets/${id}` : "/appOld/finance/assets")}>
          <Lucide icon="ChevronLeft" className="w-4 h-4 mr-1" /> Back
        </Button>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="box p-5 mt-5 space-y-4">
        {loading ? <div className="text-slate-500">Loading asset form...</div> : null}

        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-3">
            <FormLabel>Asset ID</FormLabel>
            <FormInput value={form.asset_id} onChange={(e) => setForm((prev) => ({ ...prev, asset_id: e.target.value }))} placeholder="SEA-001 or leave blank" />
          </div>
          <div className="col-span-12 md:col-span-4">
            <FormLabel>Asset Description</FormLabel>
            <FormInput value={form.asset_description} onChange={(e) => setForm((prev) => ({ ...prev, asset_description: e.target.value }))} />
          </div>
          <div className="col-span-12 md:col-span-2">
            <FormLabel>Category</FormLabel>
            <FormInput value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))} />
          </div>
          <div className="col-span-12 md:col-span-3">
            <FormLabel>Serial / Tag No.</FormLabel>
            <FormInput value={form.serial_tag_no} onChange={(e) => setForm((prev) => ({ ...prev, serial_tag_no: e.target.value }))} />
          </div>
        </div>

        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-3">
            <FormLabel>Organization</FormLabel>
            <FormSelect value={form.organization_id} onChange={(e) => setForm((prev) => ({ ...prev, organization_id: e.target.value }))}>
              <option value="">Select organization</option>
              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>{organization.name}</option>
              ))}
            </FormSelect>
          </div>
          <div className="col-span-12 md:col-span-3">
            <FormLabel>Team</FormLabel>
            <FormSelect value={form.team_id} onChange={(e) => setForm((prev) => ({ ...prev, team_id: e.target.value }))}>
              <option value="">Select team</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </FormSelect>
          </div>
          <div className="col-span-12 md:col-span-3">
            <FormLabel>Assigned To</FormLabel>
            <FormSelect value={form.assigned_to_user_id} onChange={(e) => setForm((prev) => ({ ...prev, assigned_to_user_id: e.target.value }))}>
              <option value="">Unassigned</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {[user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.email}
                </option>
              ))}
            </FormSelect>
          </div>
          <div className="col-span-12 md:col-span-3">
            <FormLabel>Location / Project</FormLabel>
            <FormInput value={form.location_project} onChange={(e) => setForm((prev) => ({ ...prev, location_project: e.target.value }))} />
          </div>
        </div>

        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-2">
            <FormLabel>Purchase Date</FormLabel>
            <FormInput type="date" value={form.purchase_date} onChange={(e) => setForm((prev) => ({ ...prev, purchase_date: e.target.value }))} />
          </div>
          <div className="col-span-12 md:col-span-3">
            <FormLabel>Supplier</FormLabel>
            <FormInput value={form.supplier} onChange={(e) => setForm((prev) => ({ ...prev, supplier: e.target.value }))} />
          </div>
          <div className="col-span-12 md:col-span-2">
            <FormLabel>Purchase Cost (NGN)</FormLabel>
            <FormInput type="number" value={form.purchase_cost} onChange={(e) => setForm((prev) => ({ ...prev, purchase_cost: e.target.value }))} />
          </div>
          <div className="col-span-12 md:col-span-2">
            <FormLabel>Useful Life (Years)</FormLabel>
            <FormInput type="number" value={form.useful_life_years} onChange={(e) => setForm((prev) => ({ ...prev, useful_life_years: e.target.value }))} />
          </div>
          <div className="col-span-12 md:col-span-3">
            <FormLabel>Salvage Value (NGN)</FormLabel>
            <FormInput type="number" value={form.salvage_value} onChange={(e) => setForm((prev) => ({ ...prev, salvage_value: e.target.value }))} />
          </div>
        </div>

        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-2">
            <FormLabel>Condition</FormLabel>
            <FormSelect value={form.condition} onChange={(e) => setForm((prev) => ({ ...prev, condition: e.target.value }))}>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </FormSelect>
          </div>
          <div className="col-span-12 md:col-span-2">
            <FormLabel>Status</FormLabel>
            <FormSelect value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="lost">Lost</option>
            </FormSelect>
          </div>
          <div className="col-span-12 md:col-span-8">
            <FormLabel>Notes / Remarks</FormLabel>
            <FormTextarea rows={4} value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} />
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="primary" disabled={saving || loading} onClick={() => void save()}>
            <Lucide icon="CheckCircle2" className="w-4 h-4 mr-1" /> {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Asset"}
          </Button>
          <Button variant="outline-secondary" onClick={() => navigate(isEdit ? `/appOld/finance/assets/${id}` : "/appOld/finance/assets")}>
            Cancel
          </Button>
        </div>
      </div>
    </>
  );
}

export default FinanceAssetEditorPage;
