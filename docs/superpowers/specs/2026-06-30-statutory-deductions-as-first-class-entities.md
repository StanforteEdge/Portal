# Statutory Deductions as First-Class Entities

## Problem

Statutory deductions (WHT, VAT, etc.) are currently nested inside Payment Vouchers via `FinancePVDeduction`. They have no independent lifecycle, no central listing, and only WHT has remittance tracking (via separate `FinanceVendorWHTAccrual`/`FinanceWHTRemittance` tables). Other deduction types have no remittance tracking at all.

## Design

Promote deductions to sibling entities of Payment Vouchers on a Request. A disbursement creates both:

- **Payment Voucher** — what the recipient receives (net)
- **Deduction** — what was withheld for statutory purposes

```
Request
  ├── Items                (budgeted line items)
  ├── PaymentVouchers[]    (net amounts paid to recipients)
  └── RequestDeductions[]  (statutory amounts withheld — WHT, VAT, etc.)
```

Reconciliation: `items_total = sum(pvs) + sum(deductions)`

---

## Data Model

### New table: `FinanceRequestDeduction`

Stored in `api/prisma/schema.prisma` as a new model:

```prisma
model FinanceRequestDeduction {
  id                String   @id @default(uuid()) @db.Uuid
  requestId         BigInt   @map("request_id")
  deductionTypeId   String   @map("deduction_type_id") @db.Uuid
  amount            Decimal  @db.Decimal(15, 2)
  rate              Decimal  @db.Decimal(6, 4)
  grossAmount       Decimal  @map("gross_amount") @db.Decimal(15, 2)
  status            String   @default("pending") @db.VarChar(20)    // pending | remitted
  remittedAt        DateTime? @map("remitted_at")
  remittanceRef     String?  @map("remittance_ref") @db.VarChar(255)
  notes             String?
  createdBy         BigInt   @map("created_by")
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  request        RequestInstance       @relation(fields: [requestId], references: [id])
  deductionType  FinanceDeductionType  @relation(fields: [deductionTypeId], references: [id])
  createdByUser  Profile               @relation(fields: [createdBy], references: [id])

  @@index([requestId])
  @@index([status])
  @@index([deductionTypeId])
  @@map("sta_finance_request_deductions")
}
```

### What stays unchanged

- `FinancePVDeduction` — kept for vendor WHT certificate reporting. When a deduction is applied via the new disbursement flow, `FinanceRequestDeduction` is created for obligation tracking. If the PV has a vendor contact, `FinancePVDeduction` + `FinanceVendorWHTAccrual` are ALSO created for the existing vendor reporting path.
- `FinanceVendorWHTAccrual` / `FinanceWHTRemittance` — kept for existing vendor workflow
- `FinancePaymentVoucher.amount` — still the net paid amount
- `FinancePaymentVoucher.grossAmount` / `netAmount` — still used for PDF reconciliation

### What changes

- `FinancePaymentVoucher` — `grossAmount` / `netAmount` become purely informational on the PV (for per-voucher PDF display). The canonical deduction data lives in `FinanceRequestDeduction`.
- Disbursement DTO — extended to accept deduction lines that create sibling records.

---

## Disbursement Flow

### Current flow (unchanged behavior for simple cases):

1. `POST /finance/requests/:id/disburse` creates `FinancePaymentVoucher` with `amount` = net paid
2. If deductions are included in the DTO, the same endpoint creates `FinanceRequestDeduction` records as siblings, and updates the PV's `grossAmount`/`netAmount`

### Deduction lines in the disbursement DTO:

```ts
{
  amount: 28500,           // net to recipient
  method: "bank_transfer",
  paid_from_account_id: "...",
  // ...existing PV fields...
  deductions: [
    {
      deduction_type_id: "uuid-of-wht",
      rate: 0.05,
      gross_amount: 30000,
      amount: 1500          // the withheld amount
    }
  ]
}
```

### Created records:

| Record | amount |
|--------|--------|
| `FinancePaymentVoucher` | 28,500 (net to recipient) |
| `FinanceRequestDeduction` | 1,500 (WHT withheld) |
| `FinancePVDeduction` | 1,500 (also created if PV has vendor contact — existing vendor certificate flow) |
| `FinanceVendorWHTAccrual` | 1,500 (also created if PV has vendor contact — existing WHT remittance flow) |

### Backward compat path (existing `applyPVDeductions` endpoint):

When the existing `POST /finance/payment-vouchers/:pvId/deductions` is called, it now ALSO creates `FinanceRequestDeduction` records. So both the old and new flows produce the new model.

### Reconciliation:

```
items_total = 30,000
    = PV.amount (28,500) + Deduction.amount (1,500)
```

---

## Remittance Workflow

### Central page: `/finance/statutory-deductions`

List all `FinanceRequestDeduction` records across all requests. Columns:

| Column | Source |
|--------|--------|
| Request # | request → requestNumber |
| PV # | linked via request (or null if standalone) |
| Deduction Type | deductionType.name |
| Gross Amount | grossAmount |
| Deducted Amount | amount |
| Status | pending / remitted |
| Remitted At | remittedAt |
| Reference | remittanceRef |

### Filters

- Status (pending / remitted / all)
- Deduction type
- Date range (by request date)
- Search by request number

### Batch remit

1. User checks pending deductions
2. Clicks "Remit Selected"
3. Form opens: remittance date (default today), reference (text input)
4. Submitted → updates all selected deductions: `status = "remitted"`, `remittedAt = now`, `remittanceRef = input`

### No interference with requests

- Changing deduction status does NOT affect request status
- A request can be `completed` / `retired` with pending deductions
- The page is purely an operational tool for the accountant

### Independence from vendor WHT workflow

- Remitting via the central page updates only `FinanceRequestDeduction.status`
- It does NOT touch `FinanceVendorWHTAccrual` or `FinanceWHTRemittance`
- The existing vendor WHT remittance flow (per-vendor accruals → batch remittance) remains completely separate
- A deduction can be marked "remitted" in the central page without having been processed through the vendor WHT system, and vice versa

---

## Request PDF Changes

The disbursement table and reconciliation in `buildRequestPdfDocument` already show deductions per-PV and as a summary row. With the new model:

- **Disbursement table:** Show PV amount (net) in one row, and linked deduction(s) as separate rows below it — or keep the current format (deduction column per PV). TBD during implementation.
- **Reconciliation:** Already shows "Statutory Deductions (Withheld)" — this stays.

The PDF already has the right data; the layout choice is about clarity.

---

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/finance/statutory-deductions` | List all, with filters |
| `PATCH` | `/finance/statutory-deductions/remit` | Batch-remit selected IDs |

Existing endpoints unchanged:
- `POST /finance/requests/:id/disburse` — extended to accept `deductions[]`
- `POST /finance/payment-vouchers/:pvId/deductions` — kept for backward compat

---

## Existing WHT Tables

`FinanceVendorWHTAccrual` and `FinanceWHTRemittance` are left untouched. They serve the vendor tax certificate workflow, which is a separate concern. The new `FinanceRequestDeduction` system handles obligation tracking for ALL deduction types.

When both exist for the same data (WHT on a vendor PV), they run in parallel. No migration of existing data is required.

---

## Non-goals

- Editing/voiding deductions — create + remit only
- Payment file generation — not part of this scope
- Vendor tax certificates — already handled by the existing accrual system
- Request lifecycle integration — deductions don't gate request status
