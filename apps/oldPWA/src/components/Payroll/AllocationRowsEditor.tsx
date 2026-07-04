import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import { FormInput, FormLabel, FormSelect } from "@/components/Base/Form";

export type AllocationRowValue = {
  organization_id: string;
  team_id: string;
  project_id: string;
  fund_id: string;
  grant_id: string;
  allocation_percent: string;
  hours?: string;
  notes?: string;
};

type Option = { id: string | number; name: string };

type Props = {
  rows: AllocationRowValue[];
  organizations: Option[];
  teams: Option[];
  projects: Option[];
  funds: Option[];
  grants: Option[];
  onChange: (rows: AllocationRowValue[]) => void;
  addLabel?: string;
  showHours?: boolean;
  title?: string;
  description?: string;
};

const emptyRow: AllocationRowValue = {
  organization_id: "",
  team_id: "",
  project_id: "",
  fund_id: "",
  grant_id: "",
  allocation_percent: "0",
  hours: "",
  notes: "",
};

function AllocationRowsEditor({
  rows,
  organizations,
  teams,
  projects,
  funds,
  grants,
  onChange,
  addLabel = "Add Allocation",
  showHours = false,
  title = "Allocations",
  description = "Split payroll cost across organization, team, project, fund, or grant."
}: Props) {
  const totalPercent = rows.reduce((sum, row) => sum + Number(row.allocation_percent || 0), 0);
  const totalHours = rows.reduce((sum, row) => sum + Number(row.hours || 0), 0);

  const updateRow = (index: number, patch: Partial<AllocationRowValue>) => {
    onChange(rows.map((entry, entryIndex) => (entryIndex === index ? { ...entry, ...patch } : entry)));
  };

  const removeRow = (index: number) => {
    onChange(rows.filter((_, entryIndex) => entryIndex !== index));
  };

  const addRow = () => {
    onChange([...(rows || []), { ...emptyRow }]);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">{title}</div>
          <div className="text-xs text-slate-500">{description}</div>
        </div>
        <div className="flex items-center gap-3">
          {showHours ? (
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              Hours {totalHours}
            </div>
          ) : null}
          <div className={`rounded-full px-3 py-1 text-xs font-medium ${totalPercent === 100 ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
            Total {totalPercent}%
          </div>
          <Button size="sm" variant="outline-secondary" onClick={addRow}>
            <Lucide icon="Plus" className="w-4 h-4 mr-1" />
            {addLabel}
          </Button>
        </div>
      </div>

      {totalPercent !== 100 ? (
        <div className="rounded border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-warning">
          Allocation total should equal 100% before you save this worker or payroll item.
        </div>
      ) : null}

      {(rows || []).map((row, index) => (
        <div key={`allocation-${index}`} className="grid grid-cols-12 gap-3 rounded border p-3">
          <div className="col-span-12 md:col-span-2">
            <FormLabel>Organization</FormLabel>
            <FormSelect value={row.organization_id} onChange={(e) => updateRow(index, { organization_id: e.target.value })}>
              <option value="">None</option>
              {organizations.map((entry) => (
                <option key={entry.id} value={entry.id}>{entry.name}</option>
              ))}
            </FormSelect>
          </div>
          <div className="col-span-12 md:col-span-2">
            <FormLabel>Team</FormLabel>
            <FormSelect value={row.team_id} onChange={(e) => updateRow(index, { team_id: e.target.value })}>
              <option value="">None</option>
              {teams.map((entry) => (
                <option key={entry.id} value={entry.id}>{entry.name}</option>
              ))}
            </FormSelect>
          </div>
          <div className="col-span-12 md:col-span-2">
            <FormLabel>Project</FormLabel>
            <FormSelect value={row.project_id} onChange={(e) => updateRow(index, { project_id: e.target.value })}>
              <option value="">None</option>
              {projects.map((entry) => (
                <option key={entry.id} value={entry.id}>{entry.name}</option>
              ))}
            </FormSelect>
          </div>
          <div className="col-span-12 md:col-span-2">
            <FormLabel>Fund</FormLabel>
            <FormSelect value={row.fund_id} onChange={(e) => updateRow(index, { fund_id: e.target.value })}>
              <option value="">None</option>
              {funds.map((entry) => (
                <option key={entry.id} value={entry.id}>{entry.name}</option>
              ))}
            </FormSelect>
          </div>
          <div className="col-span-12 md:col-span-2">
            <FormLabel>Grant</FormLabel>
            <FormSelect value={row.grant_id} onChange={(e) => updateRow(index, { grant_id: e.target.value })}>
              <option value="">None</option>
              {grants.map((entry) => (
                <option key={entry.id} value={entry.id}>{entry.name}</option>
              ))}
            </FormSelect>
          </div>
          <div className="col-span-8 md:col-span-1">
            <FormLabel>%</FormLabel>
            <FormInput type="number" value={row.allocation_percent} onChange={(e) => updateRow(index, { allocation_percent: e.target.value })} />
          </div>
          {showHours ? (
            <div className="col-span-8 md:col-span-1">
              <FormLabel>Hours</FormLabel>
              <FormInput type="number" value={row.hours || ""} onChange={(e) => updateRow(index, { hours: e.target.value })} />
            </div>
          ) : null}
          <div className="col-span-4 md:col-span-1 flex items-end">
            <Button
              variant="outline-danger"
              className="w-full"
              onClick={() => removeRow(index)}
              aria-label={`Remove allocation row ${index + 1}`}
              title="Remove allocation row"
            >
              <Lucide icon="Trash2" className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AllocationRowsEditor;
