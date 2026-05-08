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
import { cacheStore, policyApi, requestApi, useCachedQuery } from "@/shared/lib/core";
import { type PolicyRecord, type RequestType } from "@stanforte/shared";

type Props = {
  onEditPolicy: (policy: PolicyRecord | null | boolean) => void;
  onEditType: (type: RequestType | null | boolean) => void;
};

export default function LeaveSettingsTab({ onEditPolicy, onEditType }: Props) {
  const { showToast } = useToast();
  const [overrides, setOverrides] = useState<PolicyRecord[]>([]);

  // Cached Request Types
  const { data: requestTypes = [], loading: typesLoading, refetch: refetchTypes } = useCachedQuery(
    "hr:leave_types",
    async () => {
      const res = await requestApi.listTypes();
      return res.filter((t: RequestType) =>
        t.category?.toLowerCase().includes('leave') || 
        t.name.toLowerCase().includes('leave')
      );
    },
    { ttlMs: 1000 * 60 * 5, storage: "memory" }
  );

  const [loading, setLoading] = useState(true);

  // Form State
  

  const load = async () => {
    try {
      setLoading(true);
      const filtered = await policyApi.listPolicies("leave");
      const list = filtered.filter(p => p.policy_key === "leave_entitlements" && p.scope_type !== "global");
      
      setOverrides(list);
    } catch (err) {
      showToast({ tone: "danger", title: "Error", message: "Failed to load leave settings." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);



  const handleDeleteType = async (id: string) => {
    if (!confirm("Are you sure you want to delete this leave type?")) return;
    try {
      await requestApi.deleteType(id);
      cacheStore.invalidateCache("requests:types");
      cacheStore.invalidateCache("hr:leave_types");
      showToast({ tone: "success", title: "Deleted", message: "Leave type removed." });
      void refetchTypes();
    } catch (err) {
      showToast({ tone: "danger", title: "Error", message: "Failed to delete leave type." });
    }
  };

  if (loading || typesLoading) return <div className="p-8 text-center text-slate-500 text-sm">Loading leave settings...</div>;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">

      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Leave Request Types</h3>
            <p className="text-sm text-slate-500 mt-1">Add or remove the types of leave staff can request.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => onEditType(true)}>
            <Icon name="add" className="mr-1" />
            Add Type
          </Button>
        </div>

        <Table>
          <TableHead>
            <TableHeaderRow>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Slug</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableHeaderRow>
          </TableHead>
          <TableBody>
            {(requestTypes ?? []).map((type: RequestType) => (
              <TableRow key={type.id}>
                <TableCell className="font-medium text-slate-900">{type.name}</TableCell>
                <TableCell className="text-slate-500">{type.slug}</TableCell>
                <TableCell>
                  <Chip variant={type.is_active ? "success" : "neutral"}>
                    {type.is_active ? "Active" : "Inactive"}
                  </Chip>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => onEditType(type)}>
                    <Icon name="edit" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => void handleDeleteType(type.id)} className="text-danger hover:bg-danger/5">
                    <Icon name="delete" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="pt-8 border-t border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Leave Entitlement Overrides</h3>
            <p className="text-sm text-slate-500 mt-1">Specific day counts for different groups or individuals.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onEditPolicy(true)}>
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
                  <Button variant="ghost" size="sm" onClick={() => onEditPolicy(row)}>
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
