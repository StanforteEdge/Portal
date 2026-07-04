# Budget Usage Manual

**Date:** 2026-07-04
**Status:** Draft

## Purpose

This manual explains how finance staff, team leads, and project owners will use the budget module once the budget approval workflow is implemented.

## Who Uses This

- finance/accounting staff
- team leads
- project leads
- fund or grant managers
- executive approvers where thresholds apply

## Main Terms

- **Budget:** the long-lived budget record for a scope such as a project or team
- **Revision:** a version of the budget submitted for review and approval
- **Active Approved Revision:** the latest approved revision used for normal budget-backed requests
- **Owner:** the business person accountable for the budget
- **Prepared By:** the person who assembled the draft

## Typical Scenarios

### Create a New Budget

1. Open Finance > Budgets.
2. Click **New Budget**.
3. Select the budget scope: organization, team, project, fund, or grant.
4. Enter period details: annual, quarterly, or monthly.
5. Add the owner, narrative, and line items.
6. Upload supporting files if needed.
7. Save the draft.

### Copy an Existing Budget

Use this when creating recurring budgets such as monthly OPEX.

1. Open an existing budget or the budget list.
2. Click **Copy Budget**.
3. Choose a copy mode:
   - full copy
   - header only
   - header + lines + assumptions
4. Choose whether to shift the period:
   - same period
   - next month
   - next quarter
   - next fiscal year
5. Review the new draft.
6. Edit any changed amounts or notes.
7. Save or submit.

### Submit a Budget for Approval

Before submission, confirm:
- the scope is correct
- an owner is assigned
- the line totals are complete
- the justification is filled in
- required supporting files are attached

Submission sends the revision into the finance-style approval workflow.

### Revise an Approved Budget

Approved budgets are not edited directly for material changes.

1. Open the approved budget.
2. Start a **New Revision**.
3. Update the material fields or line amounts.
4. Add a revision note explaining the change.
5. Attach updated supporting evidence if needed.
6. Submit the new revision for approval.

The old approved revision remains available for history and reporting.

## Approval Flow

Budgets follow the same general pattern as financial requests:
- business owner path
- finance review/approval
- executive approval by threshold where required

Approvers review:
- scope and owner
- line details
- total value
- justification
- supporting files
- revision change summary when applicable

## What Triggers a New Revision

These changes require a new approval cycle:
- total budget amount changes
- line amount changes
- date changes
- project/team/fund/grant changes
- currency or exchange assumption changes
- line additions or removals

These usually do not require a new financial baseline by themselves:
- note updates
- typo corrections
- extra supporting files

## Attachments and Evidence

Attachments belong to the revision being reviewed.

Common examples:
- detailed spreadsheet
- assumptions sheet
- donor/grant support letter
- narrative or revision memo

When a new revision is created, new evidence can be attached without overwriting the files used for older approved revisions.

## Ownership Rules

Default owners:
- team budget -> team lead
- project budget -> project lead
- fund/grant budget -> manager if configured, otherwise finance
- organization budget -> finance owner

Finance can prepare a budget on behalf of the owner, but the system should still show who owns it and who submitted it.

## Reporting Expectations

Users should be able to view:
- original approved budget
- latest approved budget
- historical approved revisions
- revision-to-revision changes

This allows management to compare original plan, revised plan, and eventual actual spend.

## Future Link to Requests

Later, financial requests will use approved budget revisions.

Expected behavior:
- only approved budgets are available for standard budget-backed requests
- request items will link to specific approved budget lines
- later revisions will not automatically change older approved requests

## Good Operating Practice

- use copy for recurring budgets instead of rebuilding from scratch
- keep narrative and assumptions up to date
- avoid submitting incomplete lines or missing files
- use revisions instead of silently editing approved budgets
- review history before making a new revision so the change is clear

## Troubleshooting Guidance

### Submission is blocked

Check for:
- missing owner
- missing scope
- no line items
- zero or negative total
- missing justification
- missing required support files

### Budget was approved but needs changes

Do not overwrite the approved revision. Start a new revision and submit it.

### Need next month's OPEX quickly

Use **Copy Budget** on the current approved or most recent draft budget, shift the period to next month, adjust the changed values, then submit.
