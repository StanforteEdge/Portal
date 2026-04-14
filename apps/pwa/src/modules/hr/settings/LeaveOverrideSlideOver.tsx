import { useState, useEffect } from "react";
import {
  Button,
  TextField,
  SelectField,
  useToast,
  SectionCard,
  Icon,
} from "@/shared";
import { listHrPolicies, saveHrPolicy, listRequestTypes, type PolicyRecord, type ScopeType } from "./hr-settings-api";

type Props = {
  policy?: PolicyRecord | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function LeaveOverrideSlideOver({ policy, onClose, onSaved }: Props) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [requestTypes, setRequestTypes] = useState<{ id: string; name: string; slug: string }[]>([]);

  // Form State
  const [scopeType, setScopeType] = useState<ScopeType>(policy?.scope_type || "organization");
  const [scopeId, setScopeId] = useState(policy?.scope_id || "");
  const [priority, setPriority] = useState(policy?.priority || 200);
  const [isActive, setIsActive] = useState(policy?.is_active ?? true);
  
  // Entitlements (Dynamic list based on request types)
  const [entitlements, setEntitlements] = useState<Record<string, number>>(policy?.config_json || {});

  useEffect(() => {
    listRequestTypes().then(setRequestTypes).catch(() => setRequestTypes([]));
  }, []);

  const updateEntitlement = (slug: string, days: number) => {
    setEntitlements(prev => ({ ...prev, [slug]: days }));
  };

  async function handleSubmit() {
    if (!scopeId.trim()) {
      showToast({ tone: "warning", title: "Missing ID", message: "Please provide the Target ID." });
      return;
    }
    try {
      setSaving(true);
      await saveHrPolicy({
        module: "leave",
        policy_key: "leave_entitlements",
        scope_type: scopeType,
        scope_id: scopeId.trim(),
        priority: Number(priority),
        is_active: isActive,
        config_json: entitlements,
      }, policy?.id);

      showToast({ tone: "success", title: "Saved", message: "Leave entitlements updated." });
      onSaved();
    } catch (err) {
      showToast({ tone: "danger", title: "Failed", message: err instanceof Error ? err.message : "Unable to save override." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 animate-in fade-in duration-200">
      <div className="flex h-full w-full max-w-lg flex-col bg-white shadow-xl animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Leave Policies</p>
            <h2 className="text-xl font-semibold text-slate-950">{policy ? "Edit Entitlements" : "Add Entitlement Override"}</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <Icon name="close" />
          </Button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <SectionCard title="Target Scope">
            <div className="grid gap-4">
              <SelectField
                label="Scope Type"
                value={scopeType}
                onChange={(e) => setScopeType(e.target.value as ScopeType)}
                disabled={!!policy}
              >
                <option value="organization">Organization</option>
                <option value="team">Team</option>
                <option value="staff_type">Staff Type</option>
                <option value="user">Specific User</option>
              </SelectField>
              <TextField 
                label="Target ID / Identifier" 
                placeholder="e.g. Org ID, Team Slug, or User Email"
                value={scopeId} 
                onChange={(e) => setScopeId(e.target.value)}
                disabled={!!policy}
              />
              <TextField 
                label="Priority" 
                type="number"
                value={priority} 
                onChange={(e) => setPriority(Number(e.target.value))} 
              />
            </div>
          </SectionCard>

          <SectionCard title="Annual Day Entitlements">
            <p className="mb-4 text-xs text-slate-500">
              Set the number of allowed days per year for each leave type.
            </p>
            <div className="space-y-4">
              {requestTypes.map(type => (
                <div key={type.id} className="flex items-center justify-between gap-4 p-3 bg-slate-50 rounded-2xl">
                  <span className="text-sm font-medium text-slate-700">{type.name}</span>
                  <div className="w-24">
                    <TextField 
                      label="" 
                      type="number" 
                      placeholder="0"
                      value={entitlements[type.slug] || ""} 
                      onChange={(e) => updateEntitlement(type.slug, Number(e.target.value))} 
                    />
                  </div>
                </div>
              ))}
              {requestTypes.length === 0 && <p className="text-sm text-slate-400 italic">Loading leave types...</p>}
            </div>

            <div className="mt-8 flex items-center gap-3">
              <input 
                type="checkbox" 
                id="leave-active"
                checked={isActive} 
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-900"
              />
              <label htmlFor="leave-active" className="text-sm font-medium text-slate-700">Override is Active</label>
            </div>
          </SectionCard>
        </div>

        <div className="border-t border-slate-200 px-6 py-4">
          <div className="flex gap-3">
            <Button onClick={() => void handleSubmit()} disabled={saving}>
              {saving ? "Saving..." : "Save Entitlements"}
            </Button>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
