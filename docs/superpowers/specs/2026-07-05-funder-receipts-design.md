# Funder Receipts & Pledge Tracking

**Date:** 2026-07-05  
**Status:** Approved

## Overview

Add the ability to record pledged funds from donors/grantors, issue a Pledge Acknowledgment letter at pledge time, and generate an official Funder Receipt when funds are actually received. Builds on top of the existing Donors, Grants, and Income infrastructure (API already exists for Donors and Grants; UI pages are missing).

---

## Scope

1. Donors UI page
2. Grants UI page
3. Pledges model + API + UI page
4. Income form upgrade (donor + pledge selectors, Download Receipt button)
5. PDF: Pledge Acknowledgment letter
6. PDF: Funder Receipt

---

## Data Model

### New: `FinancePledge`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `pledge_number` | String | Auto-generated, e.g. `PLG-2026-001`, unique per org |
| `donor_id` | UUID | FK → FinanceDonor (required) |
| `grant_id` | UUID? | FK → FinanceGrant (optional) |
| `fund_id` | UUID? | FK → ChartAccount type=income (optional) |
| `amount` | Decimal | Pledged amount |
| `currency` | String | Default NGN |
| `pledged_at` | Date | Date of commitment |
| `expected_at` | Date? | Expected receipt date |
| `received_amount` | Decimal | Auto-computed from linked income entries |
| `status` | String | `pending` / `partial` / `fulfilled` / `cancelled` |
| `purpose` | String? | What the funds are for |
| `notes` | String? | Internal notes |
| `organization_id` | UUID | FK → Organization |
| `created_by` | UUID? | FK → Profile |
| `created_at` | DateTime | |
| `updated_at` | DateTime | |

Prisma table name: `sta_finance_pledges`  
Unique constraint: `(organization_id, pledge_number)`

### `FinanceIncome` — new FK

Add optional `pledge_id` (UUID, FK → FinancePledge, onDelete: SetNull).  
When income is saved with a `pledge_id`, the pledge's `received_amount` is recomputed and `status` transitions:
- `received_amount < amount` → `partial`
- `received_amount >= amount` → `fulfilled`

### `FinanceIncome` — new field

Add `receipt_number` (String, unique, auto-generated `FRC-YYYY-NNNN`) so every income entry that is downloaded as a receipt has a stable number.

---

## API Endpoints

### Pledges

| Method | Path | Description |
|---|---|---|
| `GET` | `/finance/pledges` | List with filters: `status`, `donor_id`, `grant_id`, `search`, `page`, `per_page` |
| `POST` | `/finance/pledges` | Create pledge |
| `POST` | `/finance/pledges/:id` | Update pledge |
| `DELETE` | `/finance/pledges/:id` | Delete (only if status = pending) |
| `GET` | `/finance/pledges/:id/acknowledgment` | Download Pledge Acknowledgment PDF |

### Income (extensions)

| Method | Path | Description |
|---|---|---|
| `GET` | `/finance/income/:id/receipt` | Download Funder Receipt PDF |

### Existing (no change needed)

- `GET/POST /finance/donors` — already exists
- `GET/POST /finance/grants` — already exists

---

## UI Pages

### `/finance/donors` — Donors Page (new)

- List: name, type, email/phone, total pledged, total received, active badge
- Actions: Add Donor (slide-over form), Edit, Delete
- Clicking a row opens a detail slide-over with two tabs: Pledges | Income

### `/finance/grants` — Grants Page (new)

- List: code, name, donor name, status chip, committed amount, received amount, progress bar, dates
- Actions: Add Grant (slide-over form), Edit, Delete
- Fields map to existing `UpsertFinanceGrantDto`

### `/finance/pledges` — Pledges Page (new)

- List: pledge number, donor, grant (if any), pledged amount, received amount, status chip, pledged date
- Actions: Add Pledge (modal form), Edit, Cancel
- Each row: **Download Acknowledgment** button
- Clicking a row opens a detail slide-over showing linked income entries

### `/finance/income` — Income Page (upgraded)

- "Record Income" modal gains two new optional fields:
  - **Donor** — searchable select from FinanceDonor records; when selected, auto-fills the Payer field
  - **Pledge** — dropdown filtered to the selected donor's `pending` or `partial` pledges
- Income list table gains a **Download Receipt** button per row (only shows if income has a payer or donor)

### Navigation

Add to Finance sidebar (under Receivables or a new "Funding" group):
- Donors
- Grants
- Pledges

---

## PDF Documents

Both documents are generated server-side using the existing PDF infrastructure (same approach as payment vouchers and WHT certificates).

### Document 1: Pledge Acknowledgment

**Trigger:** `GET /finance/pledges/:id/acknowledgment`  
**Filename:** `pledge-acknowledgment-{pledge_number}.pdf`

Contents:
- Org letterhead (logo, name, address, registration number)
- Title: **"Pledge Acknowledgment"**
- Pledge number + date issued
- Donor: name, address, email
- Grant name + restriction type (if linked)
- Pledged amount — figures + written form
- Expected receipt date (if set)
- Purpose / intended use
- Clause: *"This letter acknowledges the above pledge commitment. No goods or services were provided or promised in exchange for this pledge."*
- Authorized signatory block (org name, title, signature line)

### Document 2: Funder Receipt

**Trigger:** `GET /finance/income/:id/receipt`  
**Filename:** `funder-receipt-{receipt_number}.pdf`  
**Receipt number prefix:** `FRC-` (separate from customer receipts `RCPT-`)

Contents:
- Org letterhead
- Title: **"Official Receipt"**
- Receipt number + date issued
- Received from: donor name + address (from linked donor, or free-text payer)
- Amount — figures + written form + currency
- Payment reference
- Grant name + restriction type (if linked)
- Pledge reference number (if income linked to a pledge)
- Account received into
- Purpose / notes
- Clause: *"This is an official acknowledgment of funds received by [Org Name]."*
- Authorized signatory block

---

## Status Transitions

```
Pledge created → status: pending
  ↓ income entry linked (received < pledged)
status: partial
  ↓ income entry linked (received >= pledged)
status: fulfilled

status: pending or partial → cancelled (manual action)
```

---

## Build Sequence

1. Prisma migration — add `sta_finance_pledges`, add `pledge_id` + `receipt_number` to `sta_finance_income`
2. API — `UpsertFinancePledgeDto`, pledge service methods, pledge controller endpoints, pledge acknowledgment PDF document
3. API — extend income service to recompute pledge status on income create; add `receipt_number` generation; add funder receipt PDF endpoint
4. Frontend — Donors page
5. Frontend — Grants page
6. Frontend — Pledges page
7. Frontend — Income form upgrade (donor + pledge selectors, Download Receipt button)
8. Frontend — Add Donors / Grants / Pledges to navigation
