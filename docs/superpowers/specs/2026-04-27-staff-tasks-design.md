# Staff Tasks Page

**Date:** 2026-04-27
**Status:** Approved

## Goal

Give every staff member a single page at `/tasks` to manage their assigned and personal tasks, and log what they worked on each day. Daily log submission closes the "pending clockout" state on their attendance record, giving managers and HR a lightweight productivity trail without blocking the attendance workflow.

## Background

The old PWA had `/appOld/work` (staff-facing) and `/appOld/hr/work` (HR admin). The new PWA has `/hr/work` planned for HR admins. The staff-facing equivalent has not been ported. This spec covers the staff page only — the Team Domain (team workspace for leads and members) is a separate future spec.

## Audience

All active staff. No module gate beyond being authenticated. Appears in main app navigation at the same level as `/leave` and `/attendance` — not under `/hr/`.

---

## Two Independent Versions of "Tasks"

| Concept | Source | Who creates it |
|---------|--------|----------------|
| **Assigned Task** | Team lead or HR admin creates, assigns to staff | Lead / HR admin |
| **Personal Task** | Staff creates for themselves (`is_staff_added: true`) | Staff member |

Both appear on the same page. Assigned tasks are read + status-update only. Personal tasks are fully editable and deletable by the owner.

---

## Page Structure

**Route:** `/tasks?tab=tasks` (default) and `/tasks?tab=log`

The `tab` query param allows deep-linking directly to the Daily Log tab — used by the clockout pending nudge.

**File:** `apps/pwa/src/pages/tasks/TasksPage.tsx`

**Navigation:** Add `{ key: "my-tasks", label: "My Tasks", icon: "checklist", path: "/tasks" }` to the main app navigation (not inside any HR or finance module group).

---

## Tab 1: My Tasks

### Layout

Filter pills at the top:

```
[ All ]  [ Assigned to me ]  [ Personal ]              [+ New Task]
```

Tasks grouped by status — active first, completed collapsed:

```
● In Progress
  ┌────────────────────────────────────────────────────┐
  │ Budget Review              [Finance Team]  High    │
  │ Due: 29 Apr · in_progress                     [→] │
  └────────────────────────────────────────────────────┘

● Planned
  ┌────────────────────────────────────────────────────┐
  │ Onboard new vendor            [Personal]  Low      │
  │ No due date · planned                         [→] │
  └────────────────────────────────────────────────────┘

● Blocked
  (same pattern)

  ▼ Show 4 completed
```

### Status groups (ordered top to bottom)

1. In Progress
2. Planned
3. Blocked
4. Completed (collapsed, expandable via toggle)

### Filter pills

Client-side filter — no refetch on change:
- **All** — all tasks
- **Assigned to me** — tasks where `is_staff_added = false`
- **Personal** — tasks where `is_staff_added = true`

### Task card

Each card shows:
- Title
- Source label: team name (if assigned) or "Personal"
- Priority chip
- Due date (if set)
- Status chip
- Arrow to open detail

### Task detail SlideOver (on click)

- Title, source, status, priority, due date, description (read-only for assigned tasks)
- Status selector — staff can update to: planned / in_progress / completed / blocked
- "Log today" shortcut button → switches to Daily Log tab with this task pre-selected in the Add Entry form

### New Personal Task (+ New Task button)

SlideOver with fields:
- Title (required)
- Notes / description
- Priority (low / medium / high)
- Due date (optional)

No team, no approval flow, no goal/objective/KPI linkage. Personal tasks are for personal management.

### What staff cannot do

- Cannot edit title, description, assignee, or dates on tasks assigned by a lead
- Cannot delete assigned tasks
- Can fully edit and delete personal tasks

---

## Tab 2: Daily Log

### Layout

Week navigator at top:

```
◀  Week of 21 Apr          Today, 27 Apr 2026          ▶
```

Clockout pending nudge (shown when today has no submitted entries):

```
┌──────────────────────────────────────────────────────────┐
│ ⚠ Clockout pending — log your day to complete it        │
└──────────────────────────────────────────────────────────┘
```

Nudge links directly to Add Entry. Disappears once at least one entry is submitted for the day.

Log entries for the selected day:

```
  Budget Review · Finance Team
  "Reviewed Q1 actuals, flagged 3 variance items for follow-up"
  2h  ·  Pending Review                                  [Edit]

  Onboard new vendor · Personal
  "Sent intro email, waiting for response"
  —   ·  Draft                                          [Edit]
```

Action bar at bottom of today's entries:

```
                              [+ Add Entry]   [Submit All]
```

For past days: no Add Entry or Submit All — read-only view of entries and their final status.

### Entry states

| State | Meaning |
|-------|---------|
| **Draft** | Added but not submitted. Only visible to the staff member. |
| **Pending Review** | Submitted. Awaiting manager review. |
| **Approved** | Manager confirmed. |
| **Rejected** | Manager rejected with a note. Staff sees reason + [Revise] button. |

Personal task entries skip Pending Review — they auto-approve on submit.

### Add Entry SlideOver

Fields:
- **Task** (required) — picker pre-filtered to My Tasks (assigned + personal). Supports typing to search.
- **Notes** (required) — what was done
- **Hours** (optional) — numeric, accepts decimals

Saves as Draft immediately on "Add". Does not submit yet.

### Submit All

Submits all Draft entries for the currently viewed day in one action:
- Assigned task entries → status becomes Pending Review (goes to manager queue)
- Personal task entries → status becomes Approved immediately

Clockout pending nudge disappears after submit.

### Rejected entries

Staff sees the rejection reason inline below the entry. A [Revise] button opens the entry in edit mode (notes + hours editable). Revised entry returns to Draft, then requires re-submission.

### Previous week navigation

Week arrows navigate backward (and forward up to current week — no future logging). Each past day shows its entries with final approval status. Submitted and approved days show a subtle ✓ indicator in the week header.

---

## Attendance Integration

The daily log integrates with the attendance system at the **status level** — no shared database tables, no circular calls.

**Flow:**
```
Staff clocks out
  → Attendance record: status = "pending_log"

Staff fills + submits daily log for that day
  → Attendance record: status = "logged"

Manager reviews daily log (async)
  → Productivity confirmed, no impact on attendance record

HR reviews attendance record separately
  → Payroll / time accuracy review
```

The `/tasks` page is responsible for writing log entries. The attendance system reads log status to determine if a clockout is complete. The two reviews (log approval by manager, attendance approval by HR) are independent.

The pending nudge on `/tasks` is driven by: does today have at least one submitted log entry? If not, show the banner.

---

## API Additions to `work-api.ts`

The HR Work Management plan (Task 1) added team-level functions. The staff page needs personal equivalents — all added to the same `createWorkApi()` factory:

**New functions** (added to the existing `createWorkApi()` factory):

| Function | Endpoint | Purpose |
|----------|----------|---------|
| `listMyWorkItems(params?)` | `GET /work/my/items` | Staff's assigned + personal tasks |
| `listMyWorkLogs(params?)` | `GET /work/my/logs` | Staff's own log entries |
| `createWorkLog(dto)` | `POST /work/logs` | Add a log entry (saved as Draft) |
| `updateWorkLog(id, dto)` | `POST /work/logs/:id` | Edit a Draft or Rejected entry |
| `submitWorkLog(id)` | `POST /work/logs/:id/submit` | Submit a single Draft entry |

**Existing functions reused (no changes needed):**
- Creating a personal task → `createWorkItem(dto)` with `is_staff_added: true` added to `CreateWorkItemDto`
- Updating task status → `updateWorkItem(id, dto)` already in `work-api.ts`

**DTO additions to `work-api.ts`:**
```typescript
// Add is_staff_added to existing CreateWorkItemDto
export type CreateWorkItemDto = {
  // ... existing fields ...
  is_staff_added?: boolean;   // true for personal tasks created by staff
};

// New type
export type CreateWorkLogDto = {
  work_item_id: string;
  log_date: string;          // YYYY-MM-DD
  notes: string;
  hours_spent?: number;
};
```

---

## Files Affected

| File | Change |
|------|--------|
| `apps/shared/src/api/work-api.ts` | Add personal-facing functions + `CreateWorkLogDto`, `PersonalTaskDto` |
| `apps/shared/src/index.ts` | Export new types |
| `apps/pwa/src/pages/tasks/TasksPage.tsx` | New — main page with tab state |
| `apps/pwa/src/pages/tasks/MyTasksTab.tsx` | New — task list with filter pills |
| `apps/pwa/src/pages/tasks/TaskDetailSlideOver.tsx` | New — view + update status, "Log today" shortcut |
| `apps/pwa/src/pages/tasks/NewPersonalTaskSlideOver.tsx` | New — create personal task |
| `apps/pwa/src/pages/tasks/DailyLogTab.tsx` | New — week navigator, entries list, nudge banner |
| `apps/pwa/src/pages/tasks/AddLogEntrySlideOver.tsx` | New — add/edit a log entry |
| `apps/pwa/src/App.tsx` | Add `/tasks` route |
| `apps/pwa/src/shared/navigation.ts` | Add "My Tasks" nav item |

---

## Out of Scope

- Team Domain (separate future spec)
- KPI linkage on personal tasks
- Push notifications / reminders to log
- Manager review UI (that lives on the HR Work Management page or future Team Domain)
- Timesheet export / payroll integration
- Log entries for future dates
