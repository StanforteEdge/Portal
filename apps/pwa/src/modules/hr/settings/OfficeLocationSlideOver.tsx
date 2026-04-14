import { useState, useEffect } from "react";
import {
  Button,
  TextField,
  SelectField,
  useToast,
  SectionCard,
  Icon,
} from "@/shared";
import { listOrganizations, type OrganizationRecord } from "@/shared/api/organization-api";
import { saveOfficeLocation, type OfficeLocation } from "./hr-settings-api";

type Props = {
  location?: OfficeLocation | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function OfficeLocationSlideOver({ location, onClose, onSaved }: Props) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [orgs, setOrgs] = useState<OrganizationRecord[]>([]);

  // Form State
  const [name, setName] = useState(location?.name || "");
  const [address, setAddress] = useState(location?.address || "");
  const [latitude, setLatitude] = useState(location?.latitude || 0);
  const [longitude, setLongitude] = useState(location?.longitude || 0);
  const [radius, setRadius] = useState(location?.radius_meters || 200);
  const [isActive, setIsActive] = useState(location?.is_active ?? true);
  const [primaryOrgId, setPrimaryOrgId] = useState("");

  useEffect(() => {
    listOrganizations({ is_active: true }).then(setOrgs).catch(() => setOrgs([]));
    if (location) {
      const primary = location.organizations.find(o => o.is_primary);
      if (primary) setPrimaryOrgId(primary.id);
    }
  }, [location]);

  async function handleSubmit() {
    if (!name.trim()) {
      showToast({ tone: "warning", title: "Required", message: "Location name is required." });
      return;
    }
    try {
      setSaving(true);
      await saveOfficeLocation({
        name: name.trim(),
        address: address.trim() || undefined,
        latitude: Number(latitude),
        longitude: Number(longitude),
        radius_meters: Number(radius),
        is_active: isActive,
        primary_organization_id: primaryOrgId || undefined,
      }, location?.id);

      showToast({ tone: "success", title: "Saved", message: `Office location ${location ? "updated" : "created"}.` });
      onSaved();
    } catch (err) {
      showToast({ tone: "danger", title: "Failed", message: err instanceof Error ? err.message : "Unable to save location." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 animate-in fade-in duration-200">
      <div className="flex h-full w-full max-w-lg flex-col bg-white shadow-xl animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Settings
            </p>
            <h2 className="text-xl font-semibold text-slate-950">
              {location ? "Edit Location" : "Add Office Location"}
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <Icon name="close" />
          </Button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <SectionCard title="Basic Info">
            <div className="grid gap-4">
              <TextField 
                label="Location Name" 
                placeholder="e.g. Lagos Head Office" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
              />
              <TextField 
                label="Full Address" 
                placeholder="Street address..." 
                value={address} 
                onChange={(e) => setAddress(e.target.value)} 
              />
              <SelectField
                label="Primary Organization"
                value={primaryOrgId}
                onChange={(e) => setPrimaryOrgId(e.target.value)}
              >
                <option value="">Select organization…</option>
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </SelectField>
            </div>
          </SectionCard>

          <SectionCard title="Geofence Controls">
            <p className="mb-4 text-xs text-slate-500">
              Attendance clock-ins are validated against these coordinates.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField 
                label="Latitude" 
                type="number" 
                step="any"
                value={latitude} 
                onChange={(e) => setLatitude(Number(e.target.value))} 
              />
              <TextField 
                label="Longitude" 
                type="number" 
                step="any"
                value={longitude} 
                onChange={(e) => setLongitude(Number(e.target.value))} 
              />
              <TextField 
                label="Radius (Meters)" 
                type="number" 
                value={radius} 
                onChange={(e) => setRadius(Number(e.target.value))} 
              />
               <div className="flex items-center gap-3 pt-6">
                <input 
                  type="checkbox" 
                  id="loc-active"
                  checked={isActive} 
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-900"
                />
                <label htmlFor="loc-active" className="text-sm font-medium text-slate-700">Active Location</label>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="border-t border-slate-200 px-6 py-4">
          <div className="flex gap-3">
            <Button onClick={() => void handleSubmit()} disabled={saving}>
              {saving ? "Saving..." : "Save Location"}
            </Button>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
