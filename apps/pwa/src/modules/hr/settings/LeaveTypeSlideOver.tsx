import { useState, useEffect } from "react";
import {
  Button,
  TextField,
  SelectField,
  useToast,
  SectionCard,
  Icon,
} from "@/shared";
import { requestApi } from "@/shared/lib/core";
import { type RequestType } from "@stanforte/shared";

type Props = {
  requestType?: RequestType | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function LeaveTypeSlideOver({ requestType, onClose, onSaved }: Props) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [hrGroupId, setHrGroupId] = useState<string>("");

  useEffect(() => {
    requestApi.listGroups().then((groups) => {
      const hrGroup = groups.find(g => g.code?.toLowerCase() === 'hr' || g.name?.toLowerCase().includes('human'));
      if (hrGroup) setHrGroupId(hrGroup.id);
    }).catch(console.error);
  }, []);

  // Form State
  const [name, setName] = useState(requestType?.name || "");
  const [slug, setSlug] = useState(requestType?.slug || "");
  const [isActive, setIsActive] = useState(requestType?.is_active ?? true);

  // Business Rules Metadata
  const metadata = requestType?.metadata || {};
  const [accrualType, setAccrualType] = useState<string>(metadata.accrual_type || "upfront");
  const [prorateNewHires, setProrateNewHires] = useState<boolean>(metadata.prorate ?? true);
  const [allowNegative, setAllowNegative] = useState<boolean>(metadata.allow_negative ?? false);
  const [allowCarryOver, setAllowCarryOver] = useState<boolean>(metadata.allow_carry_over ?? false);
  const [maxCarryOver, setMaxCarryOver] = useState<number>(metadata.max_carry_over || 5);
  const [noticeDays, setNoticeDays] = useState<number>(metadata.notice_days || 0);

  async function handleSubmit() {
    if (!name.trim()) {
      showToast({ tone: "warning", title: "Required", message: "Type name is required." });
      return;
    }
    if (!requestType?.id && !hrGroupId) {
      showToast({ tone: "danger", title: "Error", message: "HR Request Group not found. Cannot create type." });
      return;
    }
    try {
      setSaving(true);
      await requestApi.saveType({
        name: name.trim(),
        slug: slug.trim() || name.toLowerCase().replace(/\s+/g, "_"),
        category: "leave",
        is_active: isActive,
        metadata: {
          accrual_type: accrualType,
          prorate: prorateNewHires,
          allow_negative: allowNegative,
          allow_carry_over: allowCarryOver,
          max_carry_over: allowCarryOver ? Number(maxCarryOver) : 0,
          notice_days: Number(noticeDays),
        }
      }, requestType?.id, hrGroupId);

      showToast({ tone: "success", title: "Saved", message: `Leave type ${requestType ? "updated" : "created"}.` });
      onSaved();
    } catch (err) {
      showToast({ tone: "danger", title: "Failed", message: err instanceof Error ? err.message : "Unable to save leave type." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-slate-950/40 animate-in fade-in duration-200">
      <div className="flex h-screen w-full max-w-lg flex-col bg-white shadow-xl animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Settings</p>
            <h2 className="text-xl font-semibold text-slate-950">{requestType ? "Edit Leave Type" : "Add Leave Type"}</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <Icon name="close" />
          </Button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <SectionCard title="Basic Info">
            <div className="grid gap-4">
              <TextField 
                label="Type Name" 
                placeholder="e.g. Annual Leave, Sick Leave" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
              />
              <TextField 
                label="Slug (Auto-generated if empty)" 
                placeholder="e.g. annual_leave" 
                value={slug} 
                onChange={(e) => setSlug(e.target.value)} 
              />
              <div className="flex items-center gap-3 pt-4">
                <input 
                  type="checkbox" 
                  id="type-active"
                  checked={isActive} 
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-900"
                />
                <label htmlFor="type-active" className="text-sm font-medium text-slate-700">Active Type</label>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Business Rules">
            <p className="mb-4 text-xs text-slate-500">
              Define how this leave type is calculated and requested.
            </p>
            <div className="grid gap-4">
              <SelectField 
                label="Accrual Type" 
                value={accrualType} 
                onChange={(e) => setAccrualType(e.target.value)}
              >
                <option value="upfront">Upfront (All days available Jan 1st)</option>
                <option value="monthly">Monthly Accrual</option>
                <option value="yearly">Yearly Anniversary Accrual</option>
              </SelectField>

              <TextField 
                label="Required Notice (Days)" 
                type="number"
                placeholder="0 for no notice"
                value={noticeDays} 
                onChange={(e) => setNoticeDays(Number(e.target.value))} 
              />

              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="rule-prorate"
                    checked={prorateNewHires} 
                    onChange={(e) => setProrateNewHires(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-brand-900"
                  />
                  <div className="flex flex-col">
                    <label htmlFor="rule-prorate" className="text-sm font-medium text-slate-700">Prorate for New Hires</label>
                    <span className="text-xs text-slate-500">Adjust total days based on the employee's hire date.</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="rule-negative"
                    checked={allowNegative} 
                    onChange={(e) => setAllowNegative(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-brand-900"
                  />
                  <div className="flex flex-col">
                    <label htmlFor="rule-negative" className="text-sm font-medium text-slate-700">Allow Negative Balance</label>
                    <span className="text-xs text-slate-500">Employees can take leave in advance of accrual.</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="rule-carry"
                    checked={allowCarryOver} 
                    onChange={(e) => setAllowCarryOver(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-brand-900"
                  />
                  <div className="flex flex-col">
                    <label htmlFor="rule-carry" className="text-sm font-medium text-slate-700">Permit Carry-Over</label>
                    <span className="text-xs text-slate-500">Allow unused days to roll into the next year.</span>
                  </div>
                </div>
                
                {allowCarryOver && (
                  <div className="pl-7 mt-2">
                    <TextField 
                      label="Max Days to Carry Over" 
                      type="number"
                      value={maxCarryOver} 
                      onChange={(e) => setMaxCarryOver(Number(e.target.value))} 
                    />
                  </div>
                )}
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="border-t border-slate-200 px-6 py-4">
          <div className="flex gap-3">
            <Button onClick={() => void handleSubmit()} disabled={saving}>
              {saving ? "Saving..." : "Save Leave Type"}
            </Button>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
