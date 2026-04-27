# HR Work Management Migration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the Team Work Planner from the old PWA (`/appOld/hr/work`) to the new PWA at `/hr/work`, porting all functionality — stats bar, filter bar, weekly board view, table view, daily log review, and create/edit SlideOvers for tasks, goals, objectives, and KPIs.

**Architecture:** Add a `work-api.ts` factory to the shared package (mirroring `hr-api.ts` / `attendance-api.ts`), register a `workApi` singleton in `core.ts`, build four focused SlideOver form components, then assemble `HrWorkManagementPage` which composes them. Route and navigation are wired in the final task.

**Tech Stack:** React 18, TypeScript, `useCachedQuery`, `AppShell`, `SlideOver/SlideOverHeader/SlideOverContent/SlideOverFooter`, `StatCard`, `SectionCard`, `Table/TableHead/TableHeaderRow/TableHeaderCell/TableBody/TableRow/TableCell`, `Button`, `SelectField`, `TextField`, `Chip`, `EmptyState`, `PageHeader`, `useToast`, `useAuth`, `@stanforte/shared`

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `apps/shared/src/api/work-api.ts` | Create | Types + `createWorkApi()` factory |
| `apps/shared/src/index.ts` | Modify | Export work-api types and factory |
| `apps/pwa/src/shared/lib/core.ts` | Modify | Register `workApi` singleton |
| `apps/pwa/src/pages/hr/work/TaskSlideOver.tsx` | Create | Create/edit work item form |
| `apps/pwa/src/pages/hr/work/GoalSlideOver.tsx` | Create | Create goal form |
| `apps/pwa/src/pages/hr/work/ObjectiveSlideOver.tsx` | Create | Create objective form |
| `apps/pwa/src/pages/hr/work/KpiSlideOver.tsx` | Create | Create KPI form |
| `apps/pwa/src/pages/hr/work/HrWorkManagementPage.tsx` | Create | Main page (stats, filters, board, table, logs) |
| `apps/pwa/src/App.tsx` | Modify | Add `/hr/work` route |
| `apps/pwa/src/shared/navigation.ts` | Modify | Add "Work Planner" nav item in HR section |
| `docs/pwa-migration-map.md` | Modify | Mark HR Work Management as ✅ Done |

---

### Task 1: Work API — Shared Package

**Files:**
- Create: `apps/shared/src/api/work-api.ts`
- Modify: `apps/shared/src/index.ts`
- Modify: `apps/pwa/src/shared/lib/core.ts`

The old PWA's `workManagement.ts` used axios directly. The new pattern (see `hr-api.ts`, `attendance-api.ts`) is a factory function `createWorkApi(httpRequest)` exported from the shared package and instantiated once in `core.ts`.

API endpoints:
- `GET /work/goals` — list goals
- `POST /work/goals` — create goal
- `GET /work/objectives` — list objectives
- `POST /work/objectives` — create objective
- `GET /work/kpis` — list KPIs
- `POST /work/kpis` — create KPI
- `GET /work/team/items` — list team work items (with filter params)
- `POST /work/items` — create work item
- `POST /work/items/:id` — update work item
- `GET /work/team/logs` — list team work logs
- `POST /work/logs/:id/approve` — approve log
- `POST /work/logs/:id/reject` — reject log

- [ ] **Step 1: Create `apps/shared/src/api/work-api.ts`**

```typescript
// apps/shared/src/api/work-api.ts
import type { HttpRequest } from "../auth/http-client";

export type WorkItemType = 'weekly_task' | 'project_activity' | 'recurring_responsibility';
export type WorkItemPriority = 'low' | 'medium' | 'high' | 'critical';
export type WorkItemStatus = 'planned' | 'in_progress' | 'completed' | 'blocked' | 'carried_over' | 'cancelled';

export type WorkItem = {
  id: string;
  title: string;
  description?: string | null;
  item_type: WorkItemType;
  priority: WorkItemPriority;
  status: WorkItemStatus;
  assigned_to_id?: string | null;
  assigned_to?: { id: string; full_name?: string } | null;
  due_date?: string | null;
  week_start_date?: string | null;
  expected_hours?: number | null;
  organization_id?: string | null;
  owner_team_id?: string | null;
  project_id?: string | null;
  goal_id?: string | null;
  objective_id?: string | null;
  kpi_id?: string | null;
  requires_manager_ack?: boolean;
  project?: { id: string; name: string } | null;
  goal?: { id: string; title: string } | null;
  objective?: { id: string; title: string } | null;
};

export type WorkLog = {
  id: string;
  status: string;
  approval_status: string;
  log_date: string;
  hours_spent: number;
  staff?: { id: string; full_name?: string } | null;
  work_item?: { id: string; title: string } | null;
};

export type WorkGoal = {
  id: string;
  title: string;
  description?: string | null;
  period_year: number;
  period_type?: string | null;
  period_label?: string | null;
  team_id?: string | null;
  organization_id?: string | null;
};

export type WorkObjective = {
  id: string;
  title: string;
  description?: string | null;
  goal_id?: string | null;
  team_id?: string | null;
  organization_id?: string | null;
  due_date?: string | null;
};

export type WorkKpi = {
  id: string;
  title: string;
  description?: string | null;
  goal_id?: string | null;
  objective_id?: string | null;
  team_id?: string | null;
  organization_id?: string | null;
  target_type: 'count' | 'percentage' | 'currency' | 'milestone';
  target_value?: number | null;
  unit_label?: string | null;
  period_year?: number | null;
  quarter?: number | null;
};

export type CreateWorkItemDto = {
  title: string;
  description?: string;
  item_type: WorkItemType;
  priority: WorkItemPriority;
  assigned_to_id?: string;
  due_date?: string;
  week_start_date?: string;
  expected_hours?: number;
  organization_id?: string;
  owner_team_id?: string;
  project_id?: string;
  goal_id?: string;
  objective_id?: string;
  kpi_id?: string;
  requires_manager_ack?: boolean;
};

export type CreateWorkGoalDto = {
  title: string;
  description?: string;
  period_year: number;
  period_type?: string;
  period_label?: string;
  team_id?: string;
  organization_id?: string;
};

export type CreateWorkObjectiveDto = {
  title: string;
  description?: string;
  goal_id?: string;
  team_id?: string;
  organization_id?: string;
  due_date?: string;
};

export type CreateWorkKpiDto = {
  title: string;
  description?: string;
  goal_id?: string;
  objective_id?: string;
  team_id?: string;
  organization_id?: string;
  target_type: 'count' | 'percentage' | 'currency' | 'milestone';
  target_value?: number;
  unit_label?: string;
  period_year?: number;
  quarter?: number;
};

export function createWorkApi(httpRequest: HttpRequest) {
  function toQuery(params?: Record<string, unknown>) {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') q.set(k, String(v)); });
    return q.toString() ? `?${q.toString()}` : '';
  }

  return {
    async listTeamGoals(params?: Record<string, unknown>) {
      const res = await httpRequest<any>(`/work/goals${toQuery(params)}`);
      return (res?.data ?? res ?? []) as WorkGoal[];
    },

    async createTeamGoal(dto: CreateWorkGoalDto) {
      const res = await httpRequest<any>('/work/goals', { method: 'POST', body: dto });
      return (res?.data ?? res) as WorkGoal;
    },

    async listTeamObjectives(params?: Record<string, unknown>) {
      const res = await httpRequest<any>(`/work/objectives${toQuery(params)}`);
      return (res?.data ?? res ?? []) as WorkObjective[];
    },

    async createTeamObjective(dto: CreateWorkObjectiveDto) {
      const res = await httpRequest<any>('/work/objectives', { method: 'POST', body: dto });
      return (res?.data ?? res) as WorkObjective;
    },

    async listTeamKpis(params?: Record<string, unknown>) {
      const res = await httpRequest<any>(`/work/kpis${toQuery(params)}`);
      return (res?.data ?? res ?? []) as WorkKpi[];
    },

    async createTeamKpi(dto: CreateWorkKpiDto) {
      const res = await httpRequest<any>('/work/kpis', { method: 'POST', body: dto });
      return (res?.data ?? res) as WorkKpi;
    },

    async listTeamWorkItems(params?: Record<string, unknown>) {
      const res = await httpRequest<any>(`/work/team/items${toQuery(params)}`);
      return (res?.data ?? res ?? []) as WorkItem[];
    },

    async createWorkItem(dto: CreateWorkItemDto) {
      const res = await httpRequest<any>('/work/items', { method: 'POST', body: dto });
      return (res?.data ?? res) as WorkItem;
    },

    async updateWorkItem(id: string, dto: Partial<CreateWorkItemDto>) {
      const res = await httpRequest<any>(`/work/items/${id}`, { method: 'POST', body: dto });
      return (res?.data ?? res) as WorkItem;
    },

    async listTeamWorkLogs(params?: Record<string, unknown>) {
      const res = await httpRequest<any>(`/work/team/logs${toQuery(params)}`);
      return (res?.data ?? res ?? []) as WorkLog[];
    },

    async approveWorkLog(id: string) {
      return httpRequest<void>(`/work/logs/${id}/approve`, { method: 'POST' });
    },

    async rejectWorkLog(id: string) {
      return httpRequest<void>(`/work/logs/${id}/reject`, { method: 'POST' });
    },
  };
}
```

- [ ] **Step 2: Export from `apps/shared/src/index.ts`**

Add after the existing `attendance-api` exports (after line 14):

```typescript
export { createWorkApi } from "./api/work-api";
export type {
  WorkItem, WorkLog, WorkGoal, WorkObjective, WorkKpi,
  WorkItemType, WorkItemPriority, WorkItemStatus,
  CreateWorkItemDto, CreateWorkGoalDto, CreateWorkObjectiveDto, CreateWorkKpiDto,
} from "./api/work-api";
```

- [ ] **Step 3: Register `workApi` in `apps/pwa/src/shared/lib/core.ts`**

Add the import alongside the existing ones near the top of the file (which already has `createHrApi`, `createAttendanceApi`):

```typescript
import { createWorkApi } from "@stanforte/shared";
```

Then add after the line that defines `attendanceApi` (around line 29):

```typescript
export const workApi = createWorkApi(httpRequest);
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal && npx tsc -p apps/pwa/tsconfig.json --noEmit 2>&1 | head -20
```

Expected: No errors about `work-api` or `workApi`.

- [ ] **Step 5: Commit**

```bash
git add apps/shared/src/api/work-api.ts apps/shared/src/index.ts apps/pwa/src/shared/lib/core.ts
git commit -m "feat(hr): add work API factory to shared package (Task 1)"
```

---

### Task 2: TaskSlideOver

**Files:**
- Create: `apps/pwa/src/pages/hr/work/TaskSlideOver.tsx`

Pattern reference: `apps/pwa/src/pages/admin/projects/AdminProjectSlideOver.tsx` — uses `SlideOver`, `SlideOverHeader`, `SlideOverContent`, `SlideOverFooter` from `@/shared/components/ui/SlideOver`.

- [ ] **Step 1: Create `apps/pwa/src/pages/hr/work/TaskSlideOver.tsx`**

```tsx
// apps/pwa/src/pages/hr/work/TaskSlideOver.tsx
import { useState } from "react";
import { Button, SelectField, TextField, useToast } from "@/shared";
import { SlideOver, SlideOverHeader, SlideOverContent, SlideOverFooter } from "@/shared/components/ui/SlideOver";
import { workApi } from "@/shared/lib/core";
import type { WorkItem, WorkGoal, WorkObjective, WorkKpi, CreateWorkItemDto } from "@stanforte/shared";

type User = { id: string; first_name?: string | null; last_name?: string | null; email: string };
type Team = { id: string; name: string };
type Project = { id: string; name: string };
type Organization = { id: string; name: string };

type Props = {
  editing: WorkItem | null;
  users: User[];
  teams: Team[];
  projects: Project[];
  organizations: Organization[];
  goals: WorkGoal[];
  objectives: WorkObjective[];
  kpis: WorkKpi[];
  onClose: () => void;
  onSaved: () => void;
};

const EMPTY: CreateWorkItemDto = {
  title: "",
  item_type: "weekly_task",
  priority: "medium",
  assigned_to_id: "",
  due_date: "",
  week_start_date: "",
  expected_hours: undefined,
  organization_id: "",
  owner_team_id: "",
  project_id: "",
  goal_id: "",
  objective_id: "",
  kpi_id: "",
  requires_manager_ack: true,
};

export default function TaskSlideOver({
  editing, users, teams, projects, organizations, goals, objectives, kpis, onClose, onSaved,
}: Props) {
  const { showToast } = useToast();
  const [form, setForm] = useState<CreateWorkItemDto>(() =>
    editing
      ? {
          title: editing.title,
          item_type: editing.item_type,
          priority: editing.priority,
          assigned_to_id: editing.assigned_to_id ?? "",
          due_date: editing.due_date ? String(editing.due_date).slice(0, 10) : "",
          week_start_date: editing.week_start_date ? String(editing.week_start_date).slice(0, 10) : "",
          expected_hours: editing.expected_hours ?? undefined,
          organization_id: editing.organization_id ?? "",
          owner_team_id: editing.owner_team_id ?? "",
          project_id: editing.project_id ?? "",
          goal_id: editing.goal_id ?? "",
          objective_id: editing.objective_id ?? "",
          kpi_id: editing.kpi_id ?? "",
          requires_manager_ack: editing.requires_manager_ack ?? true,
        }
      : EMPTY,
  );
  const [saving, setSaving] = useState(false);

  const set = (patch: Partial<CreateWorkItemDto>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSave = async () => {
    if (!form.title.trim()) { showToast("Title is required.", "error"); return; }
    setSaving(true);
    try {
      const payload: CreateWorkItemDto = {
        ...form,
        expected_hours: form.expected_hours ? Number(form.expected_hours) : undefined,
        assigned_to_id: form.assigned_to_id || undefined,
        organization_id: form.organization_id || undefined,
        owner_team_id: form.owner_team_id || undefined,
        project_id: form.project_id || undefined,
        goal_id: form.goal_id || undefined,
        objective_id: form.objective_id || undefined,
        kpi_id: form.kpi_id || undefined,
      };
      if (editing) await workApi.updateWorkItem(editing.id, payload);
      else await workApi.createWorkItem(payload);
      showToast(`Work item ${editing ? "updated" : "created"}.`, "success");
      onSaved();
    } catch {
      showToast("Unable to save work item.", "error");
    } finally {
      setSaving(false);
    }
  };

  const filteredObjectives = objectives.filter((o) => !form.goal_id || o.goal_id === form.goal_id);
  const filteredKpis = kpis.filter(
    (k) => (!form.goal_id || k.goal_id === form.goal_id) && (!form.objective_id || k.objective_id === form.objective_id),
  );

  return (
    <SlideOver open={true} onClose={onClose} size="xl">
      <SlideOverHeader title={editing ? "Edit Team Task" : "New Team Task"} onClose={onClose} />
      <SlideOverContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <TextField label="Title" value={form.title} onChange={(e) => set({ title: e.target.value })} />
          </div>
          <SelectField
            label="Type"
            value={form.item_type}
            onChange={(e) => set({ item_type: e.target.value as WorkItemType })}
          >
            <option value="weekly_task">Weekly Task</option>
            <option value="project_activity">Project Activity</option>
            <option value="recurring_responsibility">Recurring Responsibility</option>
          </SelectField>
          <SelectField
            label="Priority"
            value={form.priority}
            onChange={(e) => set({ priority: e.target.value as WorkItemPriority })}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </SelectField>
          <SelectField
            label="Assignee"
            value={form.assigned_to_id ?? ""}
            onChange={(e) => set({ assigned_to_id: e.target.value })}
          >
            <option value="">Select staff</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {[u.first_name, u.last_name].filter(Boolean).join(" ") || u.email}
              </option>
            ))}
          </SelectField>
          <TextField
            label="Week Start"
            type="date"
            value={form.week_start_date ?? ""}
            onChange={(e) => set({ week_start_date: e.target.value })}
          />
          <TextField
            label="Due Date"
            type="date"
            value={form.due_date ?? ""}
            onChange={(e) => set({ due_date: e.target.value })}
          />
          <TextField
            label="Expected Hours"
            type="number"
            value={form.expected_hours != null ? String(form.expected_hours) : ""}
            onChange={(e) => set({ expected_hours: e.target.value ? Number(e.target.value) : undefined })}
          />
          {organizations.length > 1 && (
            <SelectField
              label="Organization"
              value={form.organization_id ?? ""}
              onChange={(e) => set({ organization_id: e.target.value })}
            >
              <option value="">None</option>
              {organizations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </SelectField>
          )}
          {teams.length > 1 && (
            <SelectField
              label="Team"
              value={form.owner_team_id ?? ""}
              onChange={(e) => set({ owner_team_id: e.target.value })}
            >
              <option value="">None</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </SelectField>
          )}
          <SelectField
            label="Project"
            value={form.project_id ?? ""}
            onChange={(e) => set({ project_id: e.target.value })}
          >
            <option value="">None</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </SelectField>
          <SelectField
            label="Goal"
            value={form.goal_id ?? ""}
            onChange={(e) => set({ goal_id: e.target.value, objective_id: "", kpi_id: "" })}
          >
            <option value="">None</option>
            {goals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
          </SelectField>
          <SelectField
            label="Objective"
            value={form.objective_id ?? ""}
            onChange={(e) => set({ objective_id: e.target.value, kpi_id: "" })}
          >
            <option value="">None</option>
            {filteredObjectives.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
          </SelectField>
          <SelectField
            label="KPI"
            value={form.kpi_id ?? ""}
            onChange={(e) => set({ kpi_id: e.target.value })}
          >
            <option value="">None</option>
            {filteredKpis.map((k) => <option key={k.id} value={k.id}>{k.title}</option>)}
          </SelectField>
        </div>
      </SlideOverContent>
      <SlideOverFooter>
        <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="primary" onClick={() => void handleSave()} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </SlideOverFooter>
    </SlideOver>
  );
}
```

Note: `WorkItemType` and `WorkItemPriority` are imported from `@stanforte/shared` — add them to the import line:

```tsx
import type { WorkItem, WorkGoal, WorkObjective, WorkKpi, CreateWorkItemDto, WorkItemType, WorkItemPriority } from "@stanforte/shared";
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal && npx tsc -p apps/pwa/tsconfig.json --noEmit 2>&1 | grep "TaskSlideOver" | head -10
```

Expected: No output (no errors).

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/pages/hr/work/TaskSlideOver.tsx
git commit -m "feat(hr): add TaskSlideOver for work item create/edit (Task 2)"
```

---

### Task 3: Goal, Objective, and KPI SlideOvers

**Files:**
- Create: `apps/pwa/src/pages/hr/work/GoalSlideOver.tsx`
- Create: `apps/pwa/src/pages/hr/work/ObjectiveSlideOver.tsx`
- Create: `apps/pwa/src/pages/hr/work/KpiSlideOver.tsx`

- [ ] **Step 1: Create `apps/pwa/src/pages/hr/work/GoalSlideOver.tsx`**

```tsx
// apps/pwa/src/pages/hr/work/GoalSlideOver.tsx
import { useState } from "react";
import { Button, TextField, useToast } from "@/shared";
import { SlideOver, SlideOverHeader, SlideOverContent, SlideOverFooter } from "@/shared/components/ui/SlideOver";
import { workApi } from "@/shared/lib/core";
import type { CreateWorkGoalDto } from "@stanforte/shared";

type Props = { onClose: () => void; onSaved: () => void };

const EMPTY: CreateWorkGoalDto = {
  title: "",
  description: "",
  period_year: new Date().getFullYear(),
  period_type: "annual",
};

export default function GoalSlideOver({ onClose, onSaved }: Props) {
  const { showToast } = useToast();
  const [form, setForm] = useState<CreateWorkGoalDto>(EMPTY);
  const [saving, setSaving] = useState(false);

  const set = (patch: Partial<CreateWorkGoalDto>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSave = async () => {
    if (!form.title.trim()) { showToast("Title is required.", "error"); return; }
    setSaving(true);
    try {
      await workApi.createTeamGoal(form);
      showToast("Goal created.", "success");
      onSaved();
    } catch {
      showToast("Unable to save goal.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SlideOver open={true} onClose={onClose}>
      <SlideOverHeader title="New Goal" onClose={onClose} />
      <SlideOverContent>
        <div className="flex flex-col gap-4">
          <TextField label="Title" value={form.title} onChange={(e) => set({ title: e.target.value })} />
          <TextField label="Description" value={form.description ?? ""} onChange={(e) => set({ description: e.target.value })} />
          <TextField
            label="Year"
            type="number"
            value={String(form.period_year)}
            onChange={(e) => set({ period_year: Number(e.target.value) })}
          />
        </div>
      </SlideOverContent>
      <SlideOverFooter>
        <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="primary" onClick={() => void handleSave()} disabled={saving}>
          {saving ? "Saving…" : "Save Goal"}
        </Button>
      </SlideOverFooter>
    </SlideOver>
  );
}
```

- [ ] **Step 2: Create `apps/pwa/src/pages/hr/work/ObjectiveSlideOver.tsx`**

```tsx
// apps/pwa/src/pages/hr/work/ObjectiveSlideOver.tsx
import { useState } from "react";
import { Button, SelectField, TextField, useToast } from "@/shared";
import { SlideOver, SlideOverHeader, SlideOverContent, SlideOverFooter } from "@/shared/components/ui/SlideOver";
import { workApi } from "@/shared/lib/core";
import type { CreateWorkObjectiveDto, WorkGoal } from "@stanforte/shared";

type Props = { goals: WorkGoal[]; onClose: () => void; onSaved: () => void };

const EMPTY: CreateWorkObjectiveDto = { title: "", description: "", goal_id: "", due_date: "" };

export default function ObjectiveSlideOver({ goals, onClose, onSaved }: Props) {
  const { showToast } = useToast();
  const [form, setForm] = useState<CreateWorkObjectiveDto>(EMPTY);
  const [saving, setSaving] = useState(false);

  const set = (patch: Partial<CreateWorkObjectiveDto>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSave = async () => {
    if (!form.title.trim()) { showToast("Title is required.", "error"); return; }
    setSaving(true);
    try {
      await workApi.createTeamObjective({
        ...form,
        goal_id: form.goal_id || undefined,
        due_date: form.due_date || undefined,
      });
      showToast("Objective created.", "success");
      onSaved();
    } catch {
      showToast("Unable to save objective.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SlideOver open={true} onClose={onClose}>
      <SlideOverHeader title="New Objective" onClose={onClose} />
      <SlideOverContent>
        <div className="flex flex-col gap-4">
          <TextField label="Title" value={form.title} onChange={(e) => set({ title: e.target.value })} />
          <TextField label="Description" value={form.description ?? ""} onChange={(e) => set({ description: e.target.value })} />
          <SelectField label="Goal" value={form.goal_id ?? ""} onChange={(e) => set({ goal_id: e.target.value })}>
            <option value="">None</option>
            {goals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
          </SelectField>
          <TextField label="Due Date" type="date" value={form.due_date ?? ""} onChange={(e) => set({ due_date: e.target.value })} />
        </div>
      </SlideOverContent>
      <SlideOverFooter>
        <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="primary" onClick={() => void handleSave()} disabled={saving}>
          {saving ? "Saving…" : "Save Objective"}
        </Button>
      </SlideOverFooter>
    </SlideOver>
  );
}
```

- [ ] **Step 3: Create `apps/pwa/src/pages/hr/work/KpiSlideOver.tsx`**

```tsx
// apps/pwa/src/pages/hr/work/KpiSlideOver.tsx
import { useState } from "react";
import { Button, SelectField, TextField, useToast } from "@/shared";
import { SlideOver, SlideOverHeader, SlideOverContent, SlideOverFooter } from "@/shared/components/ui/SlideOver";
import { workApi } from "@/shared/lib/core";
import type { CreateWorkKpiDto, WorkGoal, WorkObjective } from "@stanforte/shared";

type Props = { goals: WorkGoal[]; objectives: WorkObjective[]; onClose: () => void; onSaved: () => void };

const EMPTY: CreateWorkKpiDto = {
  title: "",
  goal_id: "",
  objective_id: "",
  target_type: "count",
  target_value: undefined,
  unit_label: "",
  period_year: new Date().getFullYear(),
  quarter: undefined,
};

export default function KpiSlideOver({ goals, objectives, onClose, onSaved }: Props) {
  const { showToast } = useToast();
  const [form, setForm] = useState<CreateWorkKpiDto>(EMPTY);
  const [saving, setSaving] = useState(false);

  const set = (patch: Partial<CreateWorkKpiDto>) => setForm((prev) => ({ ...prev, ...patch }));
  const filteredObjectives = objectives.filter((o) => !form.goal_id || o.goal_id === form.goal_id);

  const handleSave = async () => {
    if (!form.title.trim()) { showToast("Title is required.", "error"); return; }
    setSaving(true);
    try {
      await workApi.createTeamKpi({
        ...form,
        goal_id: form.goal_id || undefined,
        objective_id: form.objective_id || undefined,
        target_value: form.target_value ? Number(form.target_value) : undefined,
        unit_label: form.unit_label || undefined,
        quarter: form.quarter ? Number(form.quarter) : undefined,
      });
      showToast("KPI created.", "success");
      onSaved();
    } catch {
      showToast("Unable to save KPI.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SlideOver open={true} onClose={onClose}>
      <SlideOverHeader title="New KPI" onClose={onClose} />
      <SlideOverContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <TextField label="Title" value={form.title} onChange={(e) => set({ title: e.target.value })} />
          </div>
          <SelectField
            label="Goal"
            value={form.goal_id ?? ""}
            onChange={(e) => set({ goal_id: e.target.value, objective_id: "" })}
          >
            <option value="">None</option>
            {goals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
          </SelectField>
          <SelectField
            label="Objective"
            value={form.objective_id ?? ""}
            onChange={(e) => set({ objective_id: e.target.value })}
          >
            <option value="">None</option>
            {filteredObjectives.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
          </SelectField>
          <SelectField
            label="Target Type"
            value={form.target_type}
            onChange={(e) => set({ target_type: e.target.value as CreateWorkKpiDto["target_type"] })}
          >
            <option value="count">Count</option>
            <option value="percentage">Percentage</option>
            <option value="currency">Currency</option>
            <option value="milestone">Milestone</option>
          </SelectField>
          <TextField
            label="Target Value"
            type="number"
            value={form.target_value != null ? String(form.target_value) : ""}
            onChange={(e) => set({ target_value: e.target.value ? Number(e.target.value) : undefined })}
          />
          <TextField
            label="Unit"
            value={form.unit_label ?? ""}
            onChange={(e) => set({ unit_label: e.target.value })}
          />
        </div>
      </SlideOverContent>
      <SlideOverFooter>
        <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="primary" onClick={() => void handleSave()} disabled={saving}>
          {saving ? "Saving…" : "Save KPI"}
        </Button>
      </SlideOverFooter>
    </SlideOver>
  );
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal && npx tsc -p apps/pwa/tsconfig.json --noEmit 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/pages/hr/work/GoalSlideOver.tsx apps/pwa/src/pages/hr/work/ObjectiveSlideOver.tsx apps/pwa/src/pages/hr/work/KpiSlideOver.tsx
git commit -m "feat(hr): add Goal, Objective, and KPI SlideOvers (Task 3)"
```

---

### Task 4: HrWorkManagementPage

**Files:**
- Create: `apps/pwa/src/pages/hr/work/HrWorkManagementPage.tsx`

This is the main page. It loads work items, logs, goals, objectives, KPIs, employees, teams, projects, and organizations. It uses a `refreshKey` counter to bust `useCachedQuery` cache after mutations.

Pattern reference for `useCachedQuery`: `apps/pwa/src/pages/hr/attendance/HrAttendancePage.tsx`.

Pattern reference for employees list: the page calls `hrApi.listEmployees({ status: "active", per_page: 200 })` — same `hrApi` already in `core.ts`.

Pattern reference for teams/projects/organizations: loaded via `getWorkspaceProfile()` which returns a workspace profile with `teams`, `projects`, `organizations` arrays. Check `apps/pwa/src/shared/api/workspace-api.ts` if the shape differs.

- [ ] **Step 1: Create `apps/pwa/src/pages/hr/work/HrWorkManagementPage.tsx`**

```tsx
// apps/pwa/src/pages/hr/work/HrWorkManagementPage.tsx
import { useMemo, useState } from "react";
import {
  Button,
  Chip,
  EmptyState,
  PageHeader,
  SectionCard,
  SelectField,
  StatCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
  TextField,
  useToast,
} from "@/shared";
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import { useCachedQuery, workApi, hrApi } from "@/shared/lib/core";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import type { WorkItem, WorkGoal, WorkObjective, WorkKpi } from "@stanforte/shared";
import TaskSlideOver from "./TaskSlideOver";
import GoalSlideOver from "./GoalSlideOver";
import ObjectiveSlideOver from "./ObjectiveSlideOver";
import KpiSlideOver from "./KpiSlideOver";

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getWeekStart(date = new Date()) {
  const next = new Date(date);
  const day = next.getDay();
  next.setDate(next.getDate() + (day === 0 ? -6 : 1 - day));
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  planned: "neutral",
  in_progress: "warning",
  completed: "success",
  blocked: "danger",
  carried_over: "neutral",
  cancelled: "danger",
};

type SlideOverState =
  | { type: "task"; item: WorkItem | null }
  | { type: "goal" }
  | { type: "objective" }
  | { type: "kpi" }
  | null;

export default function HrWorkManagementPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);
  const [slideOver, setSlideOver] = useState<SlideOverState>(null);
  const [plannerView, setPlannerView] = useState<"board" | "table">("board");
  const [teamFilter, setTeamFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [weekStart, setWeekStart] = useState(() => toDateInputValue(getWeekStart()));

  const { data: profile } = useCachedQuery(
    "hr:profile",
    () => getWorkspaceProfile(),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const { data: employees } = useCachedQuery(
    "hr:employees:active",
    () => hrApi.listEmployees({ status: "active", per_page: 200 }),
    { ttlMs: 1000 * 60 * 5, storage: "memory" },
  );

  const users = (employees?.result ?? []).map((e) => ({
    id: e.id,
    first_name: e.first_name,
    last_name: e.last_name,
    email: e.email,
  }));

  const teams = ((profile as any)?.teams ?? []) as { id: string; name: string }[];
  const projects = ((profile as any)?.projects ?? []) as { id: string; name: string }[];
  const organizations = ((profile as any)?.organizations ?? []) as { id: string; name: string }[];

  const itemsKey = `work:items:${teamFilter}:${assigneeFilter}:${statusFilter}:${weekStart}:${refreshKey}`;
  const { data: items = [], loading: itemsLoading } = useCachedQuery(
    itemsKey,
    () => workApi.listTeamWorkItems({
      ...(teamFilter ? { team_id: teamFilter } : {}),
      ...(assigneeFilter ? { assigned_to_id: assigneeFilter } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(weekStart ? { week_start_date: weekStart } : {}),
    }),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const logsKey = `work:logs:${teamFilter}:${assigneeFilter}:${weekStart}:${refreshKey}`;
  const { data: logs = [], loading: logsLoading } = useCachedQuery(
    logsKey,
    () => workApi.listTeamWorkLogs({
      approval_status: "submitted",
      ...(teamFilter ? { team_id: teamFilter } : {}),
      ...(assigneeFilter ? { staff_id: assigneeFilter } : {}),
      ...(weekStart ? { week_start_date: weekStart } : {}),
    }),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const { data: goals = [] } = useCachedQuery(
    `work:goals:${refreshKey}`,
    () => workApi.listTeamGoals(),
    { ttlMs: 1000 * 60 * 5, storage: "memory" },
  );

  const { data: objectives = [] } = useCachedQuery(
    `work:objectives:${refreshKey}`,
    () => workApi.listTeamObjectives(),
    { ttlMs: 1000 * 60 * 5, storage: "memory" },
  );

  const { data: kpis = [] } = useCachedQuery(
    `work:kpis:${refreshKey}`,
    () => workApi.listTeamKpis(),
    { ttlMs: 1000 * 60 * 5, storage: "memory" },
  );

  const refresh = () => setRefreshKey((k) => k + 1);

  const stats = useMemo(() => ({
    total: items.length,
    assigned: new Set(items.map((i) => i.assigned_to_id).filter(Boolean)).size,
    completed: items.filter((i) => i.status === "completed").length,
    pendingLogs: logs.length,
  }), [items, logs]);

  const weekDays = useMemo(() => {
    const start = weekStart ? new Date(weekStart) : getWeekStart();
    return Array.from({ length: 7 }, (_, idx) => {
      const date = addDays(start, idx);
      return {
        key: toDateInputValue(date),
        label: date.toLocaleDateString(undefined, { weekday: "short" }),
        fullLabel: date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
      };
    });
  }, [weekStart]);

  const boardColumns = useMemo(() => {
    const byDay = new Map<string, WorkItem[]>();
    weekDays.forEach((d) => byDay.set(d.key, []));
    items.forEach((item) => {
      const key = String(item.due_date || item.week_start_date || "").slice(0, 10);
      if (byDay.has(key)) byDay.get(key)!.push(item);
    });
    return weekDays.map((d) => ({ ...d, items: byDay.get(d.key) ?? [] }));
  }, [items, weekDays]);

  const handleApprove = async (id: string) => {
    try {
      await workApi.approveWorkLog(id);
      showToast("Log approved.", "success");
      refresh();
    } catch {
      showToast("Unable to approve log.", "error");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await workApi.rejectWorkLog(id);
      showToast("Log rejected.", "success");
      refresh();
    } catch {
      showToast("Unable to reject log.", "error");
    }
  };

  const nav = buildAppNavigation(user);
  const mobileNav = buildAppMobileNav(user);

  return (
    <AppShell navigation={nav} mobileNav={mobileNav}>
      <PageHeader
        title="Team Work Planner"
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button variant="ghost" size="sm" onClick={refresh}>Refresh</Button>
            <Button variant="ghost" size="sm" onClick={() => setSlideOver({ type: "goal" })}>New Goal</Button>
            <Button variant="ghost" size="sm" onClick={() => setSlideOver({ type: "objective" })}>New Objective</Button>
            <Button variant="ghost" size="sm" onClick={() => setSlideOver({ type: "kpi" })}>New KPI</Button>
            <Button variant="primary" size="sm" onClick={() => setSlideOver({ type: "task", item: null })}>New Weekly Task</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 mt-4 md:grid-cols-4">
        <StatCard label="Tracked Items" value={String(stats.total)} />
        <StatCard label="Assigned Staff" value={String(stats.assigned)} />
        <StatCard label="Completed" value={String(stats.completed)} />
        <StatCard label="Logs Waiting Review" value={String(stats.pendingLogs)} />
      </div>

      <SectionCard title="Filters" className="mt-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          {teams.length > 1 && (
            <SelectField label="Team" value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
              <option value="">All teams</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </SelectField>
          )}
          <SelectField label="Assignee" value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)}>
            <option value="">All staff</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {[u.first_name, u.last_name].filter(Boolean).join(" ") || u.email}
              </option>
            ))}
          </SelectField>
          <TextField label="Week Of" type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} />
          <SelectField label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="blocked">Blocked</option>
            <option value="carried_over">Carried Over</option>
            <option value="cancelled">Cancelled</option>
          </SelectField>
          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">View</div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={plannerView === "board" ? "primary" : "ghost"}
                onClick={() => setPlannerView("board")}
                className="flex-1"
              >Board</Button>
              <Button
                size="sm"
                variant={plannerView === "table" ? "primary" : "ghost"}
                onClick={() => setPlannerView("table")}
                className="flex-1"
              >Table</Button>
            </div>
          </div>
        </div>
      </SectionCard>

      {plannerView === "board" && (
        <div className="grid grid-cols-1 gap-3 mt-4 sm:grid-cols-3 lg:grid-cols-7">
          {boardColumns.map((day) => (
            <div key={day.key} className="rounded-lg border border-gray-200 bg-white p-3 min-h-[200px]">
              <div className="border-b border-gray-100 pb-2 mb-3">
                <div className="text-xs text-gray-400 uppercase">{day.label}</div>
                <div className="text-sm font-medium text-gray-700">{day.fullLabel}</div>
              </div>
              <div className="space-y-2">
                {day.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="w-full rounded border border-gray-200 bg-gray-50 p-2 text-left text-sm hover:border-blue-300 hover:bg-white transition-colors"
                    onClick={() => setSlideOver({ type: "task", item })}
                  >
                    <div className="font-medium truncate">{item.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {item.assigned_to?.full_name ?? "Unassigned"}
                    </div>
                    <div className="mt-1">
                      <Chip
                        label={String(item.status ?? "planned").replace(/_/g, " ")}
                        variant={STATUS_VARIANT[item.status] ?? "neutral"}
                        size="sm"
                      />
                    </div>
                  </button>
                ))}
                {day.items.length === 0 && (
                  <div className="rounded border border-dashed border-gray-200 px-2 py-4 text-center text-xs text-gray-400">
                    No planned work
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 mt-4 lg:grid-cols-2">
        <SectionCard title="Planned Work">
          {plannerView === "table" ? (
            <Table>
              <TableHead>
                <TableHeaderRow>
                  <TableHeaderCell>Task</TableHeaderCell>
                  <TableHeaderCell>Assignee</TableHeaderCell>
                  <TableHeaderCell>Week</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell />
                </TableHeaderRow>
              </TableHead>
              <TableBody>
                {items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="font-medium">{row.title}</div>
                      <div className="text-xs text-gray-400">
                        {row.project?.name ?? row.objective?.title ?? row.goal?.title ?? "General work"}
                      </div>
                    </TableCell>
                    <TableCell>{row.assigned_to?.full_name ?? "-"}</TableCell>
                    <TableCell>{row.week_start_date ? String(row.week_start_date).slice(0, 10) : "-"}</TableCell>
                    <TableCell>
                      <Chip
                        label={String(row.status ?? "planned").replace(/_/g, " ")}
                        variant={STATUS_VARIANT[row.status] ?? "neutral"}
                        size="sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => setSlideOver({ type: "task", item: row })}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!items.length && !itemsLoading && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <EmptyState message="No planned work for this week." />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center">Switch to Table view to see the list.</p>
          )}
        </SectionCard>

        <SectionCard title="Submitted Daily Logs">
          <Table>
            <TableHead>
              <TableHeaderRow>
                <TableHeaderCell>Staff</TableHeaderCell>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Hours</TableHeaderCell>
                <TableHeaderCell />
              </TableHeaderRow>
            </TableHead>
            <TableBody>
              {logs.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="font-medium">{row.staff?.full_name ?? "-"}</div>
                    <div className="text-xs text-gray-400">{row.work_item?.title ?? "-"}</div>
                  </TableCell>
                  <TableCell>{String(row.log_date).slice(0, 10)}</TableCell>
                  <TableCell>{row.hours_spent}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="primary" onClick={() => void handleApprove(row.id)}>Approve</Button>
                      <Button size="sm" variant="danger" onClick={() => void handleReject(row.id)}>Reject</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!logs.length && !logsLoading && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <EmptyState message="No submitted logs waiting review." />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </SectionCard>
      </div>

      {slideOver?.type === "task" && (
        <TaskSlideOver
          editing={slideOver.item}
          users={users}
          teams={teams}
          projects={projects}
          organizations={organizations}
          goals={goals as WorkGoal[]}
          objectives={objectives as WorkObjective[]}
          kpis={kpis as WorkKpi[]}
          onClose={() => setSlideOver(null)}
          onSaved={() => { setSlideOver(null); refresh(); }}
        />
      )}
      {slideOver?.type === "goal" && (
        <GoalSlideOver
          onClose={() => setSlideOver(null)}
          onSaved={() => { setSlideOver(null); refresh(); }}
        />
      )}
      {slideOver?.type === "objective" && (
        <ObjectiveSlideOver
          goals={goals as WorkGoal[]}
          onClose={() => setSlideOver(null)}
          onSaved={() => { setSlideOver(null); refresh(); }}
        />
      )}
      {slideOver?.type === "kpi" && (
        <KpiSlideOver
          goals={goals as WorkGoal[]}
          objectives={objectives as WorkObjective[]}
          onClose={() => setSlideOver(null)}
          onSaved={() => { setSlideOver(null); refresh(); }}
        />
      )}
    </AppShell>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal && npx tsc -p apps/pwa/tsconfig.json --noEmit 2>&1 | head -30
```

Expected: No errors. If `getWorkspaceProfile()` return type doesn't include `teams`/`projects`/`organizations`, you may need to cast to `any` on those lines (already done with `(profile as any)?.teams`).

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/pages/hr/work/HrWorkManagementPage.tsx
git commit -m "feat(hr): add HrWorkManagementPage — board view, table view, daily log review (Task 4)"
```

---

### Task 5: Route and Navigation

**Files:**
- Modify: `apps/pwa/src/App.tsx`
- Modify: `apps/pwa/src/shared/navigation.ts`
- Modify: `docs/pwa-migration-map.md`

- [ ] **Step 1: Add import + route to `apps/pwa/src/App.tsx`**

Add the import alongside the other HR imports (lines 37–44):

```tsx
import HrWorkManagementPage from "@/pages/hr/work/HrWorkManagementPage";
```

Add the route inside the `<ModuleRoute moduleKey="hr">` block, after the settings route:

```tsx
<Route path="/hr/work" element={<HrWorkManagementPage />} />
```

The full HR block should look like this after the change:

```tsx
<Route element={<ModuleRoute moduleKey="hr" />}>
  <Route path="/hr" element={<HrDashboardPage />} />
  <Route path="/hr/employees" element={<HrEmployeesPage />} />
  <Route path="/hr/employees/new" element={<HrEmployeeCreatePage />} />
  <Route path="/hr/employees/:id" element={<HrEmployeeDetailPage />} />
  <Route path="/hr/employees/:id/edit" element={<HrEmployeeEditPage />} />
  <Route path="/hr/attendance" element={<HrAttendancePage />} />
  <Route path="/hr/leave" element={<HrLeavePage />} />
  <Route path="/hr/settings" element={<HrSettingsPage />} />
  <Route path="/hr/work" element={<HrWorkManagementPage />} />
</Route>
```

- [ ] **Step 2: Add nav item to `apps/pwa/src/shared/navigation.ts`**

In the HR module section (around line 150–154), add the Work Planner entry before settings:

```typescript
{ key: "hr-dashboard", label: "Overview", icon: "dashboard", path: "/hr" },
{ key: "hr-employees", label: "Employees", icon: "group", path: "/hr/employees" },
{ key: "hr-attendance", label: "Attendance", icon: "pending_actions", path: "/hr/attendance" },
{ key: "hr-leave", label: "Leave", icon: "event_available", path: "/hr/leave" },
{ key: "hr-work", label: "Work Planner", icon: "task_alt", path: "/hr/work" },
{ key: "hr-settings", label: "Settings", icon: "settings", path: "/hr/settings" },
```

- [ ] **Step 3: Update migration map in `docs/pwa-migration-map.md`**

Find the HR Work Management row and change `⬜ Not Started` to `✅ Done`:

```
| HR Work Management | /appOld/hr/work | hr/work/HrWorkManagement | ✅ Done |
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal && npx tsc -p apps/pwa/tsconfig.json --noEmit 2>&1 | head -20
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/App.tsx apps/pwa/src/shared/navigation.ts docs/pwa-migration-map.md
git commit -m "feat(hr): register /hr/work route and Work Planner nav item (Task 5)"
```

---

## Self-Review

**1. Spec coverage:**
- ✅ Stats bar (Tracked Items, Assigned Staff, Completed, Logs Waiting Review) — Task 4
- ✅ Filter bar (team, assignee, week, status, view toggle) — Task 4
- ✅ Weekly board view (7-day columns, items clickable to edit) — Task 4
- ✅ Table view (planned work list with Edit button) — Task 4
- ✅ Daily logs review section (approve + reject buttons) — Task 4
- ✅ Task create/edit SlideOver (all fields from old PWA) — Task 2
- ✅ Goal create SlideOver — Task 3
- ✅ Objective create SlideOver — Task 3
- ✅ KPI create SlideOver — Task 3
- ✅ Work API shared factory (`createWorkApi`) — Task 1
- ✅ Route `/hr/work` — Task 5
- ✅ "Work Planner" nav item in HR section — Task 5
- ✅ Migration map updated — Task 5

**2. Placeholder scan:** None found. All code blocks contain full implementations.

**3. Type consistency:**
- `CreateWorkItemDto`, `WorkItem`, `WorkGoal`, `WorkObjective`, `WorkKpi`, `WorkItemType`, `WorkItemPriority` defined in Task 1 and imported via `@stanforte/shared` in Tasks 2, 3, and 4.
- `workApi.createWorkItem`, `workApi.updateWorkItem`, `workApi.approveWorkLog`, `workApi.rejectWorkLog`, `workApi.listTeamGoals`, `workApi.listTeamObjectives`, `workApi.listTeamKpis`, `workApi.listTeamWorkItems`, `workApi.listTeamWorkLogs` all match the factory defined in Task 1.
- `onSaved` / `onClose` prop names are consistent across all SlideOver components and the page.
