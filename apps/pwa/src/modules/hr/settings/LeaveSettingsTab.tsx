import { useState, useEffect } from "react";
import {
  Button,
  TextField,
  SelectField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
  useToast,
  Chip,
  EmptyState,
  Icon,
} from "@/shared";
import { 
  listHrPolicies, 
  saveHrPolicy, 
  type PolicyRecord, 
} from "./hr-settings-api";

export default function LeaveSettingsTab() {
  const { showToast } = useToast();
  const [requestTypePolicy, setRequestTypePolicy] = useState<PolicyRecord | null>(null);
  const [overrides, setOverrides] = useState<PolicyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [defaultTypeId, setDefaultTypeId] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const res = await listHrPolicies({ module: "leave" });
      const typePol = res.data.find(p => p.policy_key === "leave_request_type" && p.scope_type === "global");
      const list = res.data.filter(p => p.policy_key === "leave_entitlements" && p.scope_type !== "global");
      
      setRequestTypePolicy(typePol || null);
      setOverrides(list);

      if (typePol?.config_json) {
        setDefaultTypeId(typePol.config_json.request_type_id || "");
      }
    } catch (err) {
      showToast({ tone: "danger", title: "Error", message: "Failed to load leave settings." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSaveDefault = async () => {
    try {
      setSaving(true);
      await saveHrPolicy({
        module: "leave",
        policy_key: "leave_request_type",
        scope_type: "global",
        config_json: { request_type_id: defaultTypeId },
        priority: 100,
        is_active: true,
      }, requestTypePolicy?.id);
      
      showToast({ tone: "success", title: "Success", message: "Default leave type saved." });
      await load();
    } catch (err) {
      showToast({ tone: "danger", title: "Error", message: "Failed to save default leave type." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 text-sm">Loading leave settings...</div>;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Leave Configuration</h3>
        <p className="text-sm text-slate-500 mt-1">Configure global leave behaviors and request types.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 items-end">
          <SelectField 
            label="Default Leave Request Type" 
            value={defaultTypeId} 
            onChange={(e) => setDefaultTypeId(e.target.value)}
          >
            <option value="">Select a default type</option>
            <option value="annual">Annual Leave</option>
            <option value="sick">Sick Leave</option>
          </SelectField>
          <Button onClick={() => void handleSaveDefault()} disabled={saving || !defaultTypeId}>
            {saving ? "Saving..." : "Save Default"}
          </Button>
        </div>
      </div>

      <div className="pt-8 border-t border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Leave Entitlement Overrides</h3>
            <p className="text-sm text-slate-500 mt-1">Specific day counts for different groups or individuals.</p>
          </div>
          <Button variant="ghost" size="sm">
            <Icon name="add" className="mr-1" />
            Add Override
          </Button>
        </div>

        <Table>
          <TableHead>
            <TableHeaderRow>
              <TableHeaderCell>Target</TableHeaderCell>
              <TableHeaderCell>Scope</TableHeaderCell>
              <TableHeaderCell>Rules</TableHeaderCell>
              <TableHeaderCell>Priority</TableHeaderCell>
              <TableHeaderCell>Action</TableHeaderCell>
            </TableHeaderRow>
          </TableHead>
          <TableBody>
            {overrides.length > 0 ? overrides.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium text-slate-900">{row.scope_id || "-"}</TableCell>
                <TableCell><Chip variant="neutral">{row.scope_type}</Chip></TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(row.config_json || {}).map(([key, val]) => (
                      <Chip key={key} variant="neutral">{key}: {String(val)}d</Chip>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{row.priority}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    <Icon name="edit" />
                  </Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center">
                  <EmptyState 
                    title="No leave overrides" 
                    description="Global entitlements are being used for everyone."
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
