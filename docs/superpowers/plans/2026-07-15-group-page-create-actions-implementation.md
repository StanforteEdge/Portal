# Group Page Create Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add group-page create actions so elevated group users can start request, project, and budget creation directly from `TeamDetailPage` using existing flows scoped to the current group.

**Architecture:** Keep `TeamDetailPage` as a navigation hub, not a second create surface. Reuse the existing request creation page, the embedded `BudgetWorkspace` create mode, and the existing project admin slide-over or project create route by passing the current team/group context into those flows.

**Tech Stack:** React, TypeScript, existing PWA routing, embedded budget workspace, existing admin project UI

---

## File Map

- Modify: `apps/pwa/src/pages/teams/TeamDetailPage.tsx` - add create-action buttons and route/focus behavior.
- Modify: `apps/pwa/src/features/budgets/BudgetWorkspace.tsx` - expose a controllable create trigger if required.
- Modify: `apps/pwa/src/pages/requests/new/RequestFormPage.tsx` - accept scoped team/org prefills from navigation query params if not already supported.
- Modify: `apps/pwa/src/pages/admin/projects/AdminProjectSlideOver.tsx` or surrounding project create path - accept prefilled group/team context if supported by the data model.
- Modify: `apps/pwa/src/pages/admin/projects/AdminProjectsPage.tsx` or related routing helper - allow a direct create path with prefilled context if needed.
- Optional: shared routing/helper files if a small helper improves query-state handling cleanly.

## Task 1: Add Scoped Request Creation from the Group Page

**Files:**
- Modify: `apps/pwa/src/pages/teams/TeamDetailPage.tsx`
- Modify: `apps/pwa/src/pages/requests/new/RequestFormPage.tsx`

- [ ] **Step 1: Write or identify the failing behavior**

Current failing behavior:

```text
Group admins can open the Requests tab on TeamDetailPage, but there is no action to create a group-scoped request from that page.
```

If no automated UI test harness exists for this page, record the expected behavior explicitly before implementation:

```text
Clicking Create Request from a group page should navigate to the existing request creation page with team_id and organization_id prefilled.
```

- [ ] **Step 2: Confirm `RequestFormPage` can accept group context**

Inspect and preserve the existing state fields:

```ts
type FormState = {
  request_type_id: string;
  organization_id: string;
  team_id: string;
  project_id: string;
  purpose: string;
};
```

If the page does not yet read scoped query params, add support for query params such as:

```text
/requests/new/form?team_id=<id>&organization_id=<id>
```

- [ ] **Step 3: Add `Create Request` action to the Requests tab in `TeamDetailPage`**

Add a button visible only to elevated team roles that navigates to the existing request flow with the current team preselected.

Target navigation shape:

```ts
window.location.href = `/requests/new/form?team_id=${id}&organization_id=${team?.organization_id ?? ''}`;
```

Use the current team object shape carefully; if `organization_id` is not already exposed on the page, derive it from the available group/profile data.

- [ ] **Step 4: Verify request prefill behavior manually**

Manual verification:

1. Open a team/group page as an elevated group user.
2. Go to the Requests tab.
3. Click `Create Request`.
4. Confirm the request form opens with:
   - team preselected
   - organization preselected where available

- [ ] **Step 5: Commit the request action work**

```bash
git add apps/pwa/src/pages/teams/TeamDetailPage.tsx apps/pwa/src/pages/requests/new/RequestFormPage.tsx
git commit -m "feat(groups): add scoped request creation"
```

## Task 2: Add Scoped Budget Creation from the Group Page

**Files:**
- Modify: `apps/pwa/src/pages/teams/TeamDetailPage.tsx`
- Modify: `apps/pwa/src/features/budgets/BudgetWorkspace.tsx`

- [ ] **Step 1: Confirm existing budget create trigger**

`BudgetWorkspace` already has an internal `handleNew()` action:

```ts
const handleNew = () => {
  setSelectedBudgetId(undefined);
  setView('edit');
};
```

This means the smallest extension is to expose a prop-driven create trigger rather than building a second budget form.

- [ ] **Step 2: Extend `BudgetWorkspace` with a minimal create trigger prop if needed**

If `TeamDetailPage` cannot access create mode directly, add a focused prop such as:

```ts
type BudgetWorkspaceProps = {
  context: BudgetScopeContext;
  selectedBudgetId?: string;
  layout?: 'embedded' | 'full-page';
  startInCreateMode?: boolean;
};
```

or a prop that responds to a create-action key.

- [ ] **Step 3: Add `Create Budget` action in the Budgets tab**

Show the button only when `canWorkBudgets` is true and wire it to the embedded workspace create mode.

Expected behavior:

```text
Clicking Create Budget on the group page opens the embedded team-scoped budget editor immediately.
```

- [ ] **Step 4: Verify budget behavior manually**

Manual verification:

1. Open a department/team page where budgets are allowed.
2. Go to the Budgets tab.
3. Click `Create Budget`.
4. Confirm the embedded budget editor opens for the current team scope.

- [ ] **Step 5: Commit the budget action work**

```bash
git add apps/pwa/src/pages/teams/TeamDetailPage.tsx apps/pwa/src/features/budgets/BudgetWorkspace.tsx
git commit -m "feat(groups): add scoped budget creation"
```

## Task 3: Add Scoped Project Creation from the Group Page

**Files:**
- Modify: `apps/pwa/src/pages/teams/TeamDetailPage.tsx`
- Modify: `apps/pwa/src/pages/admin/projects/AdminProjectsPage.tsx`
- Modify: `apps/pwa/src/pages/admin/projects/AdminProjectSlideOver.tsx` if necessary

- [ ] **Step 1: Confirm current project create entry point**

The current create path is in `AdminProjectsPage` via:

```tsx
<Button className="gap-2" onClick={() => setShowCreate(true)}>
  <Icon name="add" className="text-[18px]" />
  Add Project
</Button>
```

and `AdminProjectSlideOver` handles creation.

- [ ] **Step 2: Add scoped entry path into the existing project create flow**

Do not create a new project form on `TeamDetailPage`.

Preferred navigation:

```text
/admin/projects?create=1&team_id=<id>
```

If project creation needs organization context too, pass that as query state as well.

- [ ] **Step 3: Extend the admin projects page to auto-open create mode from query params**

Add a minimal query-param hook so `AdminProjectsPage` can:

- detect `create=1`
- open `AdminProjectSlideOver`
- pass scoped defaults if supported by the slide-over fields

- [ ] **Step 4: Add `Create Project` action in the Projects tab of `TeamDetailPage`**

Expected behavior:

```text
Clicking Create Project from the group page routes into the existing admin project creation flow with group context preselected where supported.
```

- [ ] **Step 5: Verify project creation routing manually**

Manual verification:

1. Open a group page as an elevated group user.
2. Go to Projects.
3. Click `Create Project`.
4. Confirm the project create flow opens.
5. Confirm scoped fields are prefilled if supported.

- [ ] **Step 6: Commit the project action work**

```bash
git add apps/pwa/src/pages/teams/TeamDetailPage.tsx apps/pwa/src/pages/admin/projects/AdminProjectsPage.tsx apps/pwa/src/pages/admin/projects/AdminProjectSlideOver.tsx
git commit -m "feat(groups): add scoped project creation"
```

## Task 4: Add Visibility Logic and Empty-State Replacement on Group Page

**Files:**
- Modify: `apps/pwa/src/pages/teams/TeamDetailPage.tsx`

- [ ] **Step 1: Replace passive placeholder-only sections with actionable sections**

For tabs where creation is now possible, update the placeholder copy so it no longer reads like a dead end.

Examples:

```text
Create a group-scoped request for this team.
Create a project tied to this group.
Use the team budget workspace below to manage budgets and revisions.
```

- [ ] **Step 2: Ensure non-elevated users still get read-only language**

Non-elevated users should not see create buttons and should instead see passive/read-only wording.

- [ ] **Step 3: Verify role-based visibility manually**

Manual verification:

1. Open the page as an elevated group role.
2. Confirm create actions are visible.
3. Open the page as a non-elevated member.
4. Confirm create actions are hidden.

- [ ] **Step 4: Commit the group-page UX cleanup**

```bash
git add apps/pwa/src/pages/teams/TeamDetailPage.tsx
git commit -m "feat(groups): add actionable create shortcuts"
```

## Self-Review Checklist

- Spec coverage check: request, budget, and project create entry points are all covered.
- Placeholder scan: no TODO/TBD placeholders remain.
- Type consistency: route/query naming for `team_id`, `organization_id`, and `create=1` is consistent throughout the plan.
