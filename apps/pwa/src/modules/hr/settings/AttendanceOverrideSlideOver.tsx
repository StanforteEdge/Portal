import { useState } from "react";
import {
  Button,
  TextField,
  SelectField,
  useToast,
  SectionCard,
  Icon,
} from "@/shared";
import { policyApi } from "@/shared/lib/core";
import { type PolicyRecord, type ScopeType } from "@stanforte/shared";
import { useDirectory } from "@/shared/lib/use-directory";

type Props = {
  policy?: PolicyRecord | null;
  onClose: () => void;
  onSaved: () => void;
};

const WEEKDAYS = [
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
  { label: "Sunday", value: 0 },
];

export default function AttendanceOverrideSlideOver({ policy, onClose, onSaved }: Props) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const { organizations, teams, employees } = useDirectory();

  // Form State
  const [scopeType, setScopeType] = useState<ScopeType>(policy?.scope_type || "organization");
  const [scopeId, setScopeId] = useState(policy?.scope_id || "");
  const [priority, setPriority] = useState(policy?.priority || 200);
  
  const [startTime, setStartTime] = useState(policy?.config_json?.start_time || "09:00");
  const [endTime, setEndTime] = useState(policy?.config_json?.end_time || "17:00");
  const [grace, setGrace] = useState(policy?.config_json?.grace_minutes || 15);
  const [onsiteDays, setOnsiteDays] = useState<number[]>(policy?.config_json?.onsite_weekdays || [1, 2, 3, 4, 5]);
  const [isActive, setIsActive] = useState(policy?.is_active ?? true);

  const toggleDay = (day: number) => {
    setOnsiteDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  async function handleSubmit() {
    if (!scopeId.trim()) {
      showToast({ tone: "warning", title: "Missing ID", message: "Please provide the Target ID (e.g. Org ID, Team ID or User Email)." });
      return;
    }
    try {
      setSaving(true);
      await policyApi.savePolicy({
        module: "attendance",
        policy_key: "schedule",
        scope_type: scopeType,
        scope_id: scopeId.trim(),
        priority: Number(priority),
        is_active: isActive,
        config_json: {
          start_time: startTime,
          end_time: endTime,
          grace_minutes: Number(grace),
          onsite_weekdays: onsiteDays,
        },
      }, policy?.id);

      showToast({ tone: "success", title: "Saved", message: "Policy override saved successfully." });
      onSaved();
    } catch (err) {
      showToast({ tone: "danger", title: "Failed", message: err instanceof Error ? err.message : "Unable to save override." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-slate-950/40 animate-in fade-in duration-200">
      <div className="flex h-screen w-full max-w-lg flex-col bg-white shadow-xl animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Attendance Policies</p>
            <h2 className="text-xl font-semibold text-slate-950">{policy ? "Edit Override" : "Add Policy Override"}</h2>
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
                <option value="user">Specific User</option>
              </SelectField>

              {scopeType === "organization" && (
                <SelectField label="Target Organization" value={scopeId} onChange={(e) => setScopeId(e.target.value)} disabled={!!policy}>
                  <option value="">Select organization…</option>
                  {organizations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </SelectField>
              )}

              {scopeType === "team" && (
                <SelectField label="Target Team" value={scopeId} onChange={(e) => setScopeId(e.target.value)} disabled={!!policy}>
                  <option value="">Select team…</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </SelectField>
              )}

              {scopeType === "user" && (
                <SelectField label="Target Employee" value={scopeId} onChange={(e) => setScopeId(e.target.value)} disabled={!!policy}>
                  <option value="">Select staff member…</option>
                  {employees.map(s => <option key={s.id} value={s.id}>{s.name} ({s.subtitle})</option>)}
                </SelectField>
              )}

              <TextField 
                label="Priority (Higher wins)" 
                type="number"
                value={priority} 
                onChange={(e) => setPriority(Number(e.target.value))} 
              />
            </div>
          </SectionCard>

          <SectionCard title="Schedule Details">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Start Time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              <TextField label="End Time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              <TextField label="Grace Period (mins)" type="number" value={grace} onChange={(e) => setGrace(Number(e.target.value))} />
            </div>
            
            <div className="mt-6">
              <p className="field-label mb-2">Required Onsite Days</p>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map(day => (
                  <button
                    key={day.value}
                    onClick={() => toggleDay(day.value)}
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                      onsiteDays.includes(day.value) 
                        ? "bg-brand-900 text-white border-brand-900" 
                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <input 
                type="checkbox" 
                id="policy-active"
                checked={isActive} 
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-900"
              />
              <label htmlFor="policy-active" className="text-sm font-medium text-slate-700">Policy is Active</label>
            </div>
          </SectionCard>
        </div>

        <div className="border-t border-slate-200 px-6 py-4">
          <div className="flex gap-3">
            <Button onClick={() => void handleSubmit()} disabled={saving}>
              {saving ? "Saving..." : "Save Override"}
            </Button>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
