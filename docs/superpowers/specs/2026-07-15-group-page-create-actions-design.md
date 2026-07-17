# Group Page Create Actions Design

## Goal

Add actionable create entry points on the group/team detail page so a group admin can create or start:

- a request
- a project
- a budget

without leaving the group context and without duplicating existing create flows.

## Scope

This design covers only the group/team detail page create-action behavior.

It does not redesign project creation, request creation, or budget workflows themselves.

## Current State

`apps/pwa/src/pages/teams/TeamDetailPage.tsx` currently shows:

- an embedded budget workspace for eligible team contexts
- placeholder text for requests
- placeholder text for projects

The page does not currently expose create buttons for:

- project
- budget
- request

This makes the group page a dead-end for users who already have admin/lead-level access within the group.

## Desired Outcome

A user who is effectively a group admin should be able to start key actions directly from the group page:

- `Create Request`
- `Create Project`
- `Create Budget`

The group page should not contain duplicate create forms. It should route into existing flows with the group context preselected wherever possible.

## Roles / Visibility

Use the same effective elevated role logic already present in `TeamDetailPage`:

- `lead`
- `moderator`
- `manager`
- `admin`

Only users with these elevated roles for the current group should see the create action entry points.

## Design Choice

### Request Creation

Route to the existing request creation flow with the current group context prefilled.

Expected prefills:

- `team_id`
- `organization_id` when available

The user should land in the normal request creation experience, just already scoped to the current group.

### Project Creation

Route to the existing project creation/admin flow with the current team/group context preselected where supported.

This should act as a shortcut into the project create flow, not as a separate project form living inside the group page.

### Budget Creation

Keep budget creation anchored to the embedded `BudgetWorkspace`.

The group page should provide an explicit `Create Budget` action that opens, focuses, or triggers the team-scoped create behavior in `BudgetWorkspace`, instead of introducing a second standalone budget form.

## Page Placement

Recommended placement:

- `Create Request` in the Requests tab area
- `Create Budget` in the Budgets tab area
- `Create Project` in the Projects tab area

This keeps each action close to the relevant context instead of clustering unrelated buttons in one global toolbar.

## Navigation Behavior

### Request

Use query parameters or route state so the request create page receives the group/team context immediately.

### Project

Use query parameters or route state to pass the current team/group context into the existing project create flow.

### Budget

Use local page state or a `BudgetWorkspace` prop-driven trigger to enter create mode directly for the current team scope.

## Permission Model

Do not introduce a new permission system in this feature.

Use the current group role visibility logic on the page for button visibility, and let destination screens continue enforcing their own existing authorization rules.

## Non-Goals

- no inline project creation form on the team page
- no duplicate request form on the team page
- no standalone budget editor replacing `BudgetWorkspace`
- no backend authorization redesign in this feature

## Risks

- if scoped navigation parameters are inconsistent with the target pages, buttons may route correctly but fail to prefill context
- if the project creation flow only exists in a strict admin path, the button may need a clear route into that flow rather than a user-facing projects page that lacks create behavior
- if `BudgetWorkspace` does not currently expose a create trigger, a small extension will be needed to make the group-page button useful

## Testing Expectations

Implementation should verify:

1. elevated-role users can see the relevant create buttons on the group page
2. non-elevated users do not see those create buttons
3. `Create Request` opens the existing request flow with team context prefilled
4. `Create Project` opens the existing project/admin create flow with group context prefilled where supported
5. `Create Budget` enters create mode in the embedded budget workspace for the current group scope
