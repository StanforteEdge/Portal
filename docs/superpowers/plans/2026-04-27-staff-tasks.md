# Staff Tasks Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/tasks` — a two-tab page giving all staff a personal task manager (My Tasks) and a daily work log (Daily Log) that integrates with the clockout attendance flow.

**Architecture:** Extend `work-api.ts` with personal-facing endpoints, build focused tab components (`MyTasksTab`, `DailyLogTab`) with their SlideOvers, then assemble a `TasksPage` shell that syncs tab state to the URL. Route and navigation are wired in the final task.

**Tech Stack:** React 18, TypeScript, `useCachedQuery`, `AppShell`, `SlideOver/SlideOverHeader/SlideOverContent/SlideOverFooter`, `Button`, `Chip`, `EmptyState`, `PageHeader`, `SelectField`, `TextField`, `useToast`, `useAuth`, `useSearchParams` (react-router-dom), `@stanforte/shared`

---

**Prerequisite:** `apps/shared/src/api/work-api.ts` must exist with `createWorkApi()`. If it doesn't, complete Task 1 of `docs/superpowers/plans/2026-04-27-hr-work-management-migration.md` first.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `apps/shared/src/api/work-api.ts` | Modify | Add personal API functions + `CreateWorkLogDto`, `is_staff_added` field |
| `apps/shared/src/index.ts` | Modify | Export `CreateWorkLogDto` |
| `apps/pwa/src/pages/tasks/TaskDetailSlideOver.tsx` | Create | View task, update status, "Log today" shortcut |
| `apps/pwa/src/pages/tasks/NewPersonalTaskSlideOver.tsx` | Create | Create a personal task |
| `apps/pwa/src/pages/tasks/MyTasksTab.tsx` | Create | Task list with filter pills and task cards |
| `apps/pwa/src/pages/tasks/AddLogEntrySlideOver.tsx` | Create | Add or edit a daily log entry |
| `apps/pwa/src/pages/tasks/DailyLogTab.tsx` | Create | Week navigator, log entries, pending nudge, submit flow |
| `apps/pwa/src/pages/tasks/TasksPage.tsx` | Create | Shell — tabs, URL param sync, AppShell |
| `apps/pwa/src/App.tsx` | Modify | Add `/tasks` route |
| `apps/pwa/src/shared/navigation.ts` | Modify | Add "My Tasks" nav item |

---

### Task 1: Extend work-api.ts with personal-facing functions

**Files:**
- Modify: `apps/shared/src/api/work-api.ts`
- Modify: `apps/shared/src/index.ts`

- [ ] **Step 1: Add `is_staff_added` to `CreateWorkItemDto` and add `CreateWorkLogDto`**

In `apps/shared/src/api/work-api.ts`, find the `CreateWorkItemDto` type and add `is_staff_added?: boolean` as the last field:

```typescript
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
  is_staff_added?: boolean;
};
```

Then add `CreateWorkLogDto` immediately after `CreateWorkItemDto`:

```typescript
export type CreateWorkLogDto = {
  work_item_id: string;
  log_date: string;
  notes: string;
  hours_spent?: number;
};
```

- [ ] **Step 2: Add personal-facing functions inside `createWorkApi()` return block**

In `apps/shared/src/api/work-api.ts`, inside the `return { ... }` of `createWorkApi()`, add these five functions after `rejectWorkLog`:

```typescript
async listMyWorkItems(params?: Record<string, unknown>) {
  const res = await httpRequest<any>(`/work/my/items${toQuery(params)}`);
  return (res?.data ?? res ?? []) as WorkItem[];
},

async listMyWorkLogs(params?: Record<string, unknown>) {
  const res = await httpRequest<any>(`/work/my/logs${toQuery(params)}`);
  return (res?.data ?? res ?? []) as WorkLog[];
},

async createWorkLog(dto: CreateWorkLogDto) {
  const res = await httpRequest<any>('/work/logs', { method: 'POST', body: dto });
  return (res?.data ?? res) as WorkLog;
},

async updateWorkLog(id: string, dto: Partial<CreateWorkLogDto>) {
  const res = await httpRequest<any>(`/work/logs/${id}`, { method: 'POST', body: dto });
  return (res?.data ?? res) as WorkLog;
},

async submitWorkLog(id: string) {
  const res = await httpRequest<any>(`/work/logs/${id}/submit`, { method: 'POST' });
  return (res?.data ?? res) as WorkLog;
},
```

- [ ] **Step 3: Export `CreateWorkLogDto` from `apps/shared/src/index.ts`**

Find the work-api export block and add `CreateWorkLogDto` to the type exports:

```typescript
export { createWorkApi } from "./api/work-api";
export type {
  WorkItem, WorkLog, WorkGoal, WorkObjective, WorkKpi,
  WorkItemType, WorkItemPriority, WorkItemStatus,
  CreateWorkItemDto, CreateWorkGoalDto, CreateWorkObjectiveDto, CreateWorkKpiDto,
  CreateWorkLogDto,
} from "./api/work-api";
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal && npx tsc -p apps/pwa/tsconfig.json --noEmit 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add apps/shared/src/api/work-api.ts apps/shared/src/index.ts
git commit -m "feat(tasks): extend work API with personal task and log functions (Task 1)"
```

---

### Task 2: TaskDetailSlideOver and NewPersonalTaskSlideOver

**Files:**
- Create: `apps/pwa/src/pages/tasks/TaskDetailSlideOver.tsx`
- Create: `apps/pwa/src/pages/tasks/NewPersonalTaskSlideOver.tsx`

Pattern reference: `apps/pwa/src/pages/admin/projects/AdminProjectSlideOver.tsx` — uses `SlideOver`, `SlideOverHeader`, `SlideOverContent`, `SlideOverFooter` from `@/shared/components/ui/SlideOver`.

- [ ] **Step 1: Create `apps/pwa/src/pages/tasks/TaskDetailSlideOver.tsx`**

```tsx
// apps/pwa/src/pages/tasks/TaskDetailSlideOver.tsx
import { useState } from "react";
import { Button, Chip, SelectField, useToast } from "@/shared";
import { SlideOver, SlideOverHeader, SlideOverContent, SlideOverFooter } from "@/shared/components/ui/SlideOver";
import { workApi } from "@/shared/lib/core";
import type { WorkItem, WorkItemStatus } from "@stanforte/shared";

type Props = {
  item: WorkItem;
  onClose: () => void;
  onUpdated: () => void;
  onLogToday: (item: WorkItem) => void;
};

const STATUS_OPTIONS: { value: WorkItemStatus; label: string }[] = [
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "blocked", label: "Blocked" },
];

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  planned: "neutral",
  in_progress: "warning",
  completed: "success",
  blocked: "danger",
  carried_over: "neutral",
  cancelled: "danger",
};

export default function TaskDetailSlideOver({ item, onClose, onUpdated, onLogToday }: Props) {
  const { showToast } = useToast();
  const [status, setStatus] = useState<WorkItemStatus>(item.status);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (status === item.status) { onClose(); return; }
    setSaving(true);
    try {
      await workApi.updateWorkItem(item.id, { status });
      showToast("Status updated.", "success");
      onUpdated();
    } catch {
      showToast("Unable to update status.", "error");
    } finally {
      setSaving(false);
    }
  };

  const isPersonal = (item as any).is_staff_added === true;
  const source = isPersonal ? "Personal" : ((item as any).owner_team?.name ?? "Assigned");

  return (
    <SlideOver open={true} onClose={onClose}>
      <SlideOverHeader title={item.title} onClose={onClose} />
      <SlideOverContent>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Chip
              label={String(item.status).replace(/_/g, " ")}
              variant={STATUS_VARIANT[item.status] ?? "neutral"}
            />
            <span className="text-sm text-gray-400">{source}</span>
          </div>

          {item.description && (
            <p className="text-sm text-gray-600">{item.description}</p>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            {item.due_date && (
              <div>
                <div className="text-xs text-gray-400 mb-1">Due date</div>
                <div>{String(item.due_date).slice(0, 10)}</div>
              </div>
            )}
            <div>
              <div className="text-xs text-gray-400 mb-1">Priority</div>
              <div className="capitalize">{item.priority}</div>
            </div>
          </div>

          <SelectField
            label="Update status"
            value={status}
            onChange={(e) => setStatus(e.target.value as WorkItemStatus)}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </SelectField>
        </div>
      </SlideOverContent>
      <SlideOverFooter>
        <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="ghost" onClick={() => { onLogToday(item); onClose(); }}>
          Log today
        </Button>
        <Button variant="primary" onClick={() => void handleSave()} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </SlideOverFooter>
    </SlideOver>
  );
}
```

- [ ] **Step 2: Create `apps/pwa/src/pages/tasks/NewPersonalTaskSlideOver.tsx`**

```tsx
// apps/pwa/src/pages/tasks/NewPersonalTaskSlideOver.tsx
import { useState } from "react";
import { Button, SelectField, TextField, useToast } from "@/shared";
import { SlideOver, SlideOverHeader, SlideOverContent, SlideOverFooter } from "@/shared/components/ui/SlideOver";
import { workApi } from "@/shared/lib/core";
import type { WorkItemPriority } from "@stanforte/shared";

type Props = { onClose: () => void; onSaved: () => void };

type Form = {
  title: string;
  description: string;
  priority: WorkItemPriority;
  due_date: string;
};

const EMPTY: Form = { title: "", description: "", priority: "medium", due_date: "" };

export default function NewPersonalTaskSlideOver({ onClose, onSaved }: Props) {
  const { showToast } = useToast();
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);

  const set = (patch: Partial<Form>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSave = async () => {
    if (!form.title.trim()) { showToast("Title is required.", "error"); return; }
    setSaving(true);
    try {
      await workApi.createWorkItem({
        title: form.title,
        description: form.description || undefined,
        priority: form.priority,
        due_date: form.due_date || undefined,
        item_type: "weekly_task",
        is_staff_added: true,
      });
      showToast("Task created.", "success");
      onSaved();
    } catch {
      showToast("Unable to create task.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SlideOver open={true} onClose={onClose}>
      <SlideOverHeader title="New Personal Task" onClose={onClose} />
      <SlideOverContent>
        <div className="flex flex-col gap-4">
          <TextField label="Title" value={form.title} onChange={(e) => set({ title: e.target.value })} />
          <TextField
            label="Notes"
            value={form.description}
            onChange={(e) => set({ description: e.target.value })}
          />
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
          <TextField
            label="Due date (optional)"
            type="date"
            value={form.due_date}
            onChange={(e) => set({ due_date: e.target.value })}
          />
        </div>
      </SlideOverContent>
      <SlideOverFooter>
        <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="primary" onClick={() => void handleSave()} disabled={saving}>
          {saving ? "Saving…" : "Add Task"}
        </Button>
      </SlideOverFooter>
    </SlideOver>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal && npx tsc -p apps/pwa/tsconfig.json --noEmit 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add apps/pwa/src/pages/tasks/TaskDetailSlideOver.tsx apps/pwa/src/pages/tasks/NewPersonalTaskSlideOver.tsx
git commit -m "feat(tasks): add TaskDetailSlideOver and NewPersonalTaskSlideOver (Task 2)"
```

---

### Task 3: MyTasksTab

**Files:**
- Create: `apps/pwa/src/pages/tasks/MyTasksTab.tsx`

- [ ] **Step 1: Create `apps/pwa/src/pages/tasks/MyTasksTab.tsx`**

```tsx
// apps/pwa/src/pages/tasks/MyTasksTab.tsx
import { useMemo, useState } from "react";
import { Button, Chip, EmptyState } from "@/shared";
import { useCachedQuery, workApi } from "@/shared/lib/core";
import type { WorkItem, WorkItemStatus } from "@stanforte/shared";
import TaskDetailSlideOver from "./TaskDetailSlideOver";
import NewPersonalTaskSlideOver from "./NewPersonalTaskSlideOver";

type Props = {
  onLogToday: (item: WorkItem) => void;
};

type FilterType = "all" | "assigned" | "personal";

const STATUS_ORDER: WorkItemStatus[] = ["in_progress", "planned", "blocked"];

const STATUS_LABEL: Record<string, string> = {
  in_progress: "In Progress",
  planned: "Planned",
  blocked: "Blocked",
};

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  planned: "neutral",
  in_progress: "warning",
  completed: "success",
  blocked: "danger",
  carried_over: "neutral",
  cancelled: "danger",
};

const FILTER_BUTTONS: { key: FilterType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "assigned", label: "Assigned to me" },
  { key: "personal", label: "Personal" },
];

function TaskCard({ item, onClick }: { item: WorkItem; onClick: () => void }) {
  const isPersonal = (item as any).is_staff_added === true;
  const source = isPersonal ? "Personal" : ((item as any).owner_team?.name ?? "Assigned");

  return (
    <button
      type="button"
      className="w-full rounded-lg border border-gray-200 bg-white p-3 text-left hover:border-blue-200 hover:bg-blue-50/30 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{item.title}</div>
          <div className="text-xs text-gray-400 mt-0.5">{source}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {item.due_date && (
            <span className="text-xs text-gray-400">{String(item.due_date).slice(0, 10)}</span>
          )}
          <Chip
            label={String(item.priority)}
            variant={item.priority === "high" || item.priority === "critical" ? "danger" : "neutral"}
            size="sm"
          />
          <span className="text-gray-300">→</span>
        </div>
      </div>
    </button>
  );
}

export default function MyTasksTab({ onLogToday }: Props) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [showCompleted, setShowCompleted] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selected, setSelected] = useState<WorkItem | null>(null);
  const [showNew, setShowNew] = useState(false);

  const { data: items = [], loading } = useCachedQuery(
    `tasks:my:${refreshKey}`,
    () => workApi.listMyWorkItems(),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const refresh = () => setRefreshKey((k) => k + 1);

  const filtered = useMemo(() => {
    if (filter === "assigned") return items.filter((i) => !(i as any).is_staff_added);
    if (filter === "personal") return items.filter((i) => (i as any).is_staff_added);
    return items;
  }, [items, filter]);

  const active = useMemo(
    () => STATUS_ORDER.flatMap((s) => filtered.filter((i) => i.status === s)),
    [filtered],
  );

  const completed = useMemo(
    () => filtered.filter((i) => i.status === "completed" || i.status === "cancelled" || i.status === "carried_over"),
    [filtered],
  );

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex gap-2">
          {FILTER_BUTTONS.map((btn) => (
            <Button
              key={btn.key}
              size="sm"
              variant={filter === btn.key ? "primary" : "ghost"}
              onClick={() => setFilter(btn.key)}
            >
              {btn.label}
            </Button>
          ))}
        </div>
        <Button size="sm" variant="primary" onClick={() => setShowNew(true)}>
          + New Task
        </Button>
      </div>

      {loading && !items.length && (
        <div className="text-sm text-gray-400 py-8 text-center">Loading tasks…</div>
      )}

      {!loading && !active.length && !completed.length && (
        <EmptyState message="No tasks yet. Create a personal task or wait for assignments." />
      )}

      <div className="space-y-1">
        {STATUS_ORDER.map((status) => {
          const group = active.filter((i) => i.status === status);
          if (!group.length) return null;
          return (
            <div key={status}>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-4 mb-2">
                ● {STATUS_LABEL[status]}
              </div>
              <div className="space-y-2">
                {group.map((item) => (
                  <TaskCard key={item.id} item={item} onClick={() => setSelected(item)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {completed.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            className="text-sm text-gray-400 hover:text-gray-600"
            onClick={() => setShowCompleted((v) => !v)}
          >
            {showCompleted ? "▲ Hide" : "▼ Show"} {completed.length} completed
          </button>
          {showCompleted && (
            <div className="mt-2 space-y-2">
              {completed.map((item) => (
                <TaskCard key={item.id} item={item} onClick={() => setSelected(item)} />
              ))}
            </div>
          )}
        </div>
      )}

      {selected && (
        <TaskDetailSlideOver
          item={selected}
          onClose={() => setSelected(null)}
          onUpdated={() => { setSelected(null); refresh(); }}
          onLogToday={(item) => { setSelected(null); onLogToday(item); }}
        />
      )}

      {showNew && (
        <NewPersonalTaskSlideOver
          onClose={() => setShowNew(false)}
          onSaved={() => { setShowNew(false); refresh(); }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal && npx tsc -p apps/pwa/tsconfig.json --noEmit 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/pages/tasks/MyTasksTab.tsx
git commit -m "feat(tasks): add MyTasksTab with filter pills and task cards (Task 3)"
```

---

### Task 4: AddLogEntrySlideOver

**Files:**
- Create: `apps/pwa/src/pages/tasks/AddLogEntrySlideOver.tsx`

Handles both adding a new entry ("Add Entry" button) and editing an existing Draft or Rejected entry ([Edit] button on the log).

- [ ] **Step 1: Create `apps/pwa/src/pages/tasks/AddLogEntrySlideOver.tsx`**

```tsx
// apps/pwa/src/pages/tasks/AddLogEntrySlideOver.tsx
import { useState } from "react";
import { Button, SelectField, TextField, useToast } from "@/shared";
import { SlideOver, SlideOverHeader, SlideOverContent, SlideOverFooter } from "@/shared/components/ui/SlideOver";
import { useCachedQuery, workApi } from "@/shared/lib/core";
import type { WorkLog, CreateWorkLogDto } from "@stanforte/shared";

type Props = {
  logDate: string;
  editing: WorkLog | null;
  preselectedTaskId?: string;
  onClose: () => void;
  onSaved: () => void;
};

type Form = {
  work_item_id: string;
  notes: string;
  hours_spent: string;
};

export default function AddLogEntrySlideOver({ logDate, editing, preselectedTaskId, onClose, onSaved }: Props) {
  const { showToast } = useToast();
  const [form, setForm] = useState<Form>({
    work_item_id: editing?.work_item?.id ?? preselectedTaskId ?? "",
    notes: (editing as any)?.notes ?? "",
    hours_spent: editing?.hours_spent ? String(editing.hours_spent) : "",
  });
  const [saving, setSaving] = useState(false);

  const set = (patch: Partial<Form>) => setForm((prev) => ({ ...prev, ...patch }));

  const { data: tasks = [] } = useCachedQuery(
    "tasks:my:for-log",
    () => workApi.listMyWorkItems(),
    { ttlMs: 1000 * 60 * 5, storage: "memory" },
  );

  const handleSave = async () => {
    if (!form.work_item_id) { showToast("Select a task.", "error"); return; }
    if (!form.notes.trim()) { showToast("Notes are required.", "error"); return; }
    setSaving(true);
    try {
      const dto: CreateWorkLogDto = {
        work_item_id: form.work_item_id,
        log_date: logDate,
        notes: form.notes,
        hours_spent: form.hours_spent ? Number(form.hours_spent) : undefined,
      };
      if (editing) {
        await workApi.updateWorkLog(editing.id, dto);
      } else {
        await workApi.createWorkLog(dto);
      }
      showToast(editing ? "Entry updated." : "Entry added.", "success");
      onSaved();
    } catch {
      showToast("Unable to save entry.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SlideOver open={true} onClose={onClose}>
      <SlideOverHeader title={editing ? "Edit Log Entry" : "Add Log Entry"} onClose={onClose} />
      <SlideOverContent>
        <div className="flex flex-col gap-4">
          <SelectField
            label="Task"
            value={form.work_item_id}
            onChange={(e) => set({ work_item_id: e.target.value })}
          >
            <option value="">Select a task…</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </SelectField>
          <TextField
            label="Notes (what did you do?)"
            value={form.notes}
            onChange={(e) => set({ notes: e.target.value })}
          />
          <TextField
            label="Hours (optional)"
            type="number"
            value={form.hours_spent}
            onChange={(e) => set({ hours_spent: e.target.value })}
          />
          <p className="text-xs text-gray-400">Logging for: {logDate}</p>
        </div>
      </SlideOverContent>
      <SlideOverFooter>
        <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="primary" onClick={() => void handleSave()} disabled={saving}>
          {saving ? "Saving…" : editing ? "Update" : "Add Entry"}
        </Button>
      </SlideOverFooter>
    </SlideOver>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal && npx tsc -p apps/pwa/tsconfig.json --noEmit 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/pages/tasks/AddLogEntrySlideOver.tsx
git commit -m "feat(tasks): add AddLogEntrySlideOver (Task 4)"
```

---

### Task 5: DailyLogTab

**Files:**
- Create: `apps/pwa/src/pages/tasks/DailyLogTab.tsx`

- [ ] **Step 1: Create `apps/pwa/src/pages/tasks/DailyLogTab.tsx`**

```tsx
// apps/pwa/src/pages/tasks/DailyLogTab.tsx
import { useState } from "react";
import { Button, Chip, EmptyState, useToast } from "@/shared";
import { useCachedQuery, workApi } from "@/shared/lib/core";
import type { WorkLog } from "@stanforte/shared";
import AddLogEntrySlideOver from "./AddLogEntrySlideOver";

type Props = {
  preselectedTaskId?: string;
  onPreselectedConsumed?: () => void;
};

function toDateStr(date: Date) {
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

const LOG_STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  draft: "neutral",
  pending_review: "warning",
  approved: "success",
  rejected: "danger",
};

const LOG_STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
};

export default function DailyLogTab({ preselectedTaskId, onPreselectedConsumed }: Props) {
  const today = toDateStr(new Date());
  const { showToast } = useToast();
  const [weekStart, setWeekStart] = useState(() => getWeekStart());
  const [selectedDate, setSelectedDate] = useState(today);
  const [refreshKey, setRefreshKey] = useState(0);
  const [slideOver, setSlideOver] = useState<{ editing: WorkLog | null } | null>(
    preselectedTaskId ? { editing: null } : null,
  );
  const [submitting, setSubmitting] = useState(false);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    return {
      key: toDateStr(date),
      label: date.toLocaleDateString(undefined, { weekday: "short", day: "numeric" }),
      isFuture: toDateStr(date) > today,
    };
  });

  const { data: logs = [], loading } = useCachedQuery(
    `tasks:logs:${toDateStr(weekStart)}:${refreshKey}`,
    () => workApi.listMyWorkLogs({
      date_from: toDateStr(weekStart),
      date_to: toDateStr(addDays(weekStart, 6)),
    }),
    { ttlMs: 1000 * 60, storage: "memory" },
  );

  const refresh = () => setRefreshKey((k) => k + 1);

  const dayLogs = logs.filter((l) => String(l.log_date).slice(0, 10) === selectedDate);
  const isToday = selectedDate === today;
  const hasDrafts = dayLogs.some((l) => (l as any).status === "draft");
  const hasSubmitted = dayLogs.some((l) => (l as any).status !== "draft");
  const needsLog = isToday && !hasSubmitted && dayLogs.length === 0;

  const handleSubmitAll = async () => {
    const drafts = dayLogs.filter((l) => (l as any).status === "draft");
    if (!drafts.length) return;
    setSubmitting(true);
    try {
      await Promise.all(drafts.map((l) => workApi.submitWorkLog(l.id)));
      showToast("Daily log submitted.", "success");
      refresh();
    } catch {
      showToast("Unable to submit log.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const canGoNext = toDateStr(addDays(weekStart, 7)) <= today;

  return (
    <div>
      {/* Week navigator */}
      <div className="flex items-center justify-between mb-4">
        <Button size="sm" variant="ghost" onClick={() => setWeekStart((w) => addDays(w, -7))}>◀</Button>
        <div className="text-sm font-medium text-gray-700">
          Week of {weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </div>
        <Button size="sm" variant="ghost" onClick={() => { if (canGoNext) setWeekStart((w) => addDays(w, 7)); }} disabled={!canGoNext}>▶</Button>
      </div>

      {/* Day selector */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {weekDays.map((day) => {
          const dayHasLogs = logs.some((l) => String(l.log_date).slice(0, 10) === day.key);
          return (
            <button
              key={day.key}
              type="button"
              disabled={day.isFuture}
              onClick={() => setSelectedDate(day.key)}
              className={[
                "flex-1 min-w-[60px] rounded py-2 text-xs text-center transition-colors",
                selectedDate === day.key
                  ? "bg-blue-600 text-white"
                  : day.isFuture
                    ? "text-gray-300 cursor-not-allowed"
                    : "hover:bg-gray-100 text-gray-600",
              ].join(" ")}
            >
              {day.label}
              {dayHasLogs && selectedDate !== day.key && (
                <div className="mx-auto mt-1 h-1 w-1 rounded-full bg-green-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Clockout pending nudge */}
      {needsLog && (
        <button
          type="button"
          className="w-full mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 text-left hover:bg-amber-100"
          onClick={() => setSlideOver({ editing: null })}
        >
          ⚠ Clockout pending — log your day to complete it
        </button>
      )}

      {/* Log entries */}
      {loading && !logs.length && (
        <div className="text-sm text-gray-400 py-6 text-center">Loading…</div>
      )}

      {!loading && !dayLogs.length && !needsLog && (
        <EmptyState message={isToday ? "Nothing logged yet today." : "No entries for this day."} />
      )}

      <div className="space-y-3 mb-4">
        {dayLogs.map((log) => {
          const status = (log as any).status ?? "draft";
          const isRejected = status === "rejected";
          const isEditable = isToday && (status === "draft" || status === "rejected");
          return (
            <div key={log.id} className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {log.work_item?.title ?? "Unknown task"}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{(log as any).notes}</div>
                  {log.hours_spent != null && (
                    <div className="text-xs text-gray-400 mt-1">{log.hours_spent}h</div>
                  )}
                  {isRejected && (log as any).rejection_note && (
                    <div className="mt-2 text-xs text-red-600 bg-red-50 rounded px-2 py-1">
                      Rejected: {(log as any).rejection_note}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Chip
                    label={LOG_STATUS_LABEL[status] ?? status}
                    variant={LOG_STATUS_VARIANT[status] ?? "neutral"}
                    size="sm"
                  />
                  {isEditable && (
                    <Button size="sm" variant="ghost" onClick={() => setSlideOver({ editing: log })}>
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions — today only */}
      {isToday && (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { onPreselectedConsumed?.(); setSlideOver({ editing: null }); }}
          >
            + Add Entry
          </Button>
          {hasDrafts && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => void handleSubmitAll()}
              disabled={submitting}
            >
              {submitting ? "Submitting…" : "Submit All"}
            </Button>
          )}
        </div>
      )}

      {slideOver !== null && (
        <AddLogEntrySlideOver
          logDate={selectedDate}
          editing={slideOver.editing}
          preselectedTaskId={preselectedTaskId}
          onClose={() => { setSlideOver(null); onPreselectedConsumed?.(); }}
          onSaved={() => { setSlideOver(null); onPreselectedConsumed?.(); refresh(); }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal && npx tsc -p apps/pwa/tsconfig.json --noEmit 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/pages/tasks/DailyLogTab.tsx
git commit -m "feat(tasks): add DailyLogTab with week navigator and submit flow (Task 5)"
```

---

### Task 6: TasksPage shell + route + navigation

**Files:**
- Create: `apps/pwa/src/pages/tasks/TasksPage.tsx`
- Modify: `apps/pwa/src/App.tsx`
- Modify: `apps/pwa/src/shared/navigation.ts`

- [ ] **Step 1: Create `apps/pwa/src/pages/tasks/TasksPage.tsx`**

```tsx
// apps/pwa/src/pages/tasks/TasksPage.tsx
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import { PageHeader } from "@/shared";
import type { WorkItem } from "@stanforte/shared";
import MyTasksTab from "./MyTasksTab";
import DailyLogTab from "./DailyLogTab";

type Tab = "tasks" | "log";

export default function TasksPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [logTaskId, setLogTaskId] = useState<string | undefined>();

  const tab = (searchParams.get("tab") as Tab | null) ?? "tasks";

  const setTab = (t: Tab) => setSearchParams({ tab: t }, { replace: true });

  const handleLogToday = (item: WorkItem) => {
    setLogTaskId(item.id);
    setTab("log");
  };

  const nav = buildAppNavigation(user);
  const mobileNav = buildAppMobileNav(user);

  return (
    <AppShell navigation={nav} mobileNav={mobileNav}>
      <PageHeader title="My Tasks" />

      <div className="flex gap-2 border-b border-gray-200 mb-6">
        {(["tasks", "log"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            className={[
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === t
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700",
            ].join(" ")}
            onClick={() => setTab(t)}
          >
            {t === "tasks" ? "My Tasks" : "Daily Log"}
          </button>
        ))}
      </div>

      {tab === "tasks" && <MyTasksTab onLogToday={handleLogToday} />}

      {tab === "log" && (
        <DailyLogTab
          preselectedTaskId={logTaskId}
          onPreselectedConsumed={() => setLogTaskId(undefined)}
        />
      )}
    </AppShell>
  );
}
```

- [ ] **Step 2: Add import and route to `apps/pwa/src/App.tsx`**

Add import near the other page imports at the top of the file:

```tsx
import TasksPage from "@/pages/tasks/TasksPage";
```

Add route inside the authenticated routes block — same level as `/leave` and `/attendance`:

```tsx
<Route path="/tasks" element={<TasksPage />} />
```

- [ ] **Step 3: Add nav item to `apps/pwa/src/shared/navigation.ts`**

Add to the main navigation array (not inside any module group — top-level alongside dashboard/requests):

```typescript
{ key: "my-tasks", label: "My Tasks", icon: "checklist", path: "/tasks" },
```

- [ ] **Step 4: Verify TypeScript compiles with 0 errors**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal && npx tsc -p apps/pwa/tsconfig.json --noEmit 2>&1 | head -20
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/pages/tasks/TasksPage.tsx apps/pwa/src/App.tsx apps/pwa/src/shared/navigation.ts
git commit -m "feat(tasks): add TasksPage shell, /tasks route, and My Tasks nav item (Task 6)"
```

---

## Self-Review

**1. Spec coverage:**
- ✅ Route `/tasks?tab=tasks` / `?tab=log` — Task 6
- ✅ My Tasks tab: filter pills (All / Assigned to me / Personal) — Task 3
- ✅ Task list grouped by status (In Progress → Planned → Blocked), completed collapsed — Task 3
- ✅ Task detail SlideOver: view, status update, "Log today" shortcut — Task 2
- ✅ New personal task SlideOver: title, notes, priority, due date, `is_staff_added: true` — Task 2
- ✅ Daily Log tab: week navigator, day selector, entries list — Task 5
- ✅ Clockout pending nudge banner — Task 5
- ✅ Add log entry SlideOver: task picker, notes required, hours optional — Task 4
- ✅ Edit log entry (Draft + Rejected, today only) — Task 4 + Task 5
- ✅ Submit All (drafts → pending review) — Task 5
- ✅ Rejected entry shows rejection note + Edit button — Task 5
- ✅ "Log today" shortcut passes preselected task ID from My Tasks → Daily Log — Tasks 2, 3, 5, 6
- ✅ Personal API functions: `listMyWorkItems`, `listMyWorkLogs`, `createWorkLog`, `updateWorkLog`, `submitWorkLog` — Task 1
- ✅ `CreateWorkLogDto` exported from shared package — Task 1
- ✅ `is_staff_added` added to `CreateWorkItemDto` — Task 1
- ✅ `/tasks` route — Task 6
- ✅ "My Tasks" nav item — Task 6

**2. Placeholder scan:** None found.

**3. Type consistency:**
- `WorkItem`, `WorkItemStatus`, `WorkItemPriority`, `WorkLog`, `CreateWorkLogDto` defined in Task 1, imported via `@stanforte/shared` in Tasks 2–6.
- `workApi.listMyWorkItems`, `workApi.listMyWorkLogs`, `workApi.createWorkLog`, `workApi.updateWorkLog`, `workApi.submitWorkLog`, `workApi.updateWorkItem`, `workApi.createWorkItem` — all match functions added/existing in Task 1.
- `onLogToday: (item: WorkItem) => void` — consistent in `MyTasksTab` (Task 3), `TaskDetailSlideOver` (Task 2), `TasksPage` (Task 6).
- `preselectedTaskId?: string` + `onPreselectedConsumed?: () => void` — consistent in `DailyLogTab` (Task 5) and `AddLogEntrySlideOver` (Task 4).
