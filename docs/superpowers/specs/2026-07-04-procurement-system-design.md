# Procurement System Design

**Date:** 2026-07-04
**Status:** Approved for implementation

---

## Overview

A full procure-to-pay system for the platform. Covers Purchase Requisition through vendor engagement, goods receipt, and payment trigger. Admin petty cash and operational expense purchases remain in the Finance module. This system handles all formal procurement requiring a Purchase Order.

---

## Scope

**In scope:**
- Purchase Requisition (PR) raised by any staff member
- Procurement Officer review and PO creation
- Value-based configurable approval chains (reusing existing workflow engine)
- Three payment patterns: post-delivery, pre-payment, milestone
- Goods Receipt Note (GRN) raised by requesting department
- PO delivery: email with PDF + vendor portal + staff download
- Persistent vendor portal (view POs, acknowledge, download PDF)
- Document generation: PR Summary, PO, GRN PDFs
- Finance PV trigger on GRN confirmation or PO approval (for pre-payment)

**Out of scope (Phase 2):**
- Vendor invoice submission via portal
- Automated invoice-to-PO matching
- Supplier performance ratings

---

## Data Model

### PurchaseRequisition
The starting point for all procurement. Any staff member can raise one.

| Field | Type | Notes |
|---|---|---|
| `id` | bigint | PK |
| `requisitionNumber` | string | e.g. `PR-2026-0001`, auto-generated |
| `title` | string | Short description of the need |
| `category` | enum | `goods \| services \| works` |
| `paymentPattern` | enum | `post_delivery \| pre_payment \| milestone` |
| `items` | JSON | Array of `{description, qty, unit, estimatedUnitCost}` |
| `estimatedTotal` | decimal | Computed from items |
| `justification` | text | Why this purchase is needed |
| `budgetLineId` | string | Reference to finance budget line |
| `teamId` | bigint | Requesting department |
| `requestedBy` | bigint | FK to User |
| `workflowInstanceId` | bigint | FK to WorkflowInstance |
| `status` | enum | `draft \| submitted \| approved \| rejected \| converted_to_po \| cancelled` |
| `supportingFiles` | relation | File attachments |
| `createdAt`, `updatedAt` | datetime | |

### PurchaseOrder
Created by the Procurement Officer from an approved PR.

| Field | Type | Notes |
|---|---|---|
| `id` | bigint | PK |
| `poNumber` | string | e.g. `PO-2026-0001`, auto-generated |
| `requisitionId` | bigint | FK to PurchaseRequisition |
| `vendorId` | string | FK to finance Vendor |
| `preparedBy` | bigint | FK to User (Procurement Officer) |
| `items` | JSON | Array of `{description, qty, unit, unitCost, totalCost}` |
| `totalAmount` | decimal | |
| `deliveryDate` | date | Expected delivery |
| `deliveryAddress` | text | |
| `paymentPattern` | enum | Inherited from PR, can be adjusted |
| `milestones` | JSON | Array of `{description, percentage, amount, trigger, status}` — only for milestone pattern |
| `paymentTerms` | text | e.g. "30 days net" |
| `workflowInstanceId` | bigint | FK to WorkflowInstance |
| `status` | enum | `draft \| pending_approval \| approved \| sent \| acknowledged \| partially_received \| received \| completed \| cancelled` |
| `vendorAcknowledgedAt` | datetime | Set when vendor acknowledges |
| `vendorAcknowledgeNote` | text | Optional note from vendor |
| `pdfFileId` | bigint | Stored PO PDF |
| `createdAt`, `updatedAt` | datetime | |

### GoodsReceiptNote (GRN)
Raised by the requesting department on delivery. Closed by the Procurement Officer.

| Field | Type | Notes |
|---|---|---|
| `id` | bigint | PK |
| `grnNumber` | string | e.g. `GRN-2026-0001` |
| `poId` | bigint | FK to PurchaseOrder |
| `raisedBy` | bigint | FK to User (requesting dept staff) |
| `receivedDate` | date | Actual date of receipt |
| `items` | JSON | Array of `{description, qtyOrdered, qtyReceived, condition, notes}` |
| `overallCondition` | enum | `satisfactory \| partial \| rejected` |
| `notes` | text | |
| `confirmedByOfficer` | boolean | Procurement Officer sign-off |
| `confirmedAt` | datetime | |
| `confirmedBy` | bigint | FK to User (Procurement Officer) |
| `status` | enum | `pending \| confirmed \| disputed` |
| `attachments` | relation | Photos of received goods |
| `createdAt`, `updatedAt` | datetime | |

### VendorUser
Persistent portal accounts for vendors. Separate from staff user accounts.

| Field | Type | Notes |
|---|---|---|
| `id` | bigint | PK |
| `vendorId` | string | FK to finance Vendor |
| `email` | string | Unique login email |
| `hashedPassword` | string | Set on first login via magic link |
| `name` | string | Contact person name |
| `status` | enum | `active \| suspended` |
| `lastLoginAt` | datetime | |
| `createdAt`, `updatedAt` | datetime | |

**Magic link tokens** are ephemeral (not stored as a table row — use signed JWTs with `aud: vendor-portal`, short TTL of 7 days, invalidated on password set).

---

## Procurement Lifecycle

### 1. Purchase Requisition

1. Any staff member creates a PR (draft)
2. Staff submits → workflow starts
3. **Step 1 — HOD approval**: validates need is real and within budget
4. **Step 2 — Procurement Officer review**: accepts (moves to PO creation) or returns with comments
5. PR is now `approved` and ready for PO creation

### 2. Purchase Order Creation

1. Procurement Officer opens approved PR, creates PO
2. Selects vendor from finance vendor registry
3. Finalizes line items, delivery date, payment terms, payment pattern
4. For milestone pattern: defines milestone schedule (% breakdown, trigger per milestone)
5. Saves PO as draft, then submits for approval

### 3. PO Approval

- Configurable `approvalFlowJson` per procurement category (goods / services / works)
- Value-based tiers recommended (e.g. below ₦500k: Finance Manager; above: COO/ED)
- Same approval engine as existing requests — full thread display, comments, notifications
- On final approval: PO status → `approved`

### 4. Vendor Notification

On PO approval:
- System generates PO PDF (via DocumentGeneratorService)
- Email sent to vendor's primary contact with PDF attached and portal login link
- Procurement Officer and staff can also download the PDF from the PO detail view

### 5. Vendor Acknowledgement

- Vendor logs into portal at `/vendor-portal/`
- Views all POs addressed to their vendor
- Clicks **Acknowledge** on the PO (with optional note)
- System records `vendorAcknowledgedAt`, `vendorAcknowledgeNote` on PO
- Acknowledgement appears as a thread event on the PO

### 6. Goods Receipt Note

- Requesting department staff raises GRN when goods/services arrive
- Fills in line-by-line quantities received and condition
- Can attach photos
- GRN status: `pending`
- Procurement Officer reviews and confirms → GRN status: `confirmed`
- If there are discrepancies: GRN status: `disputed` → thread comment required from officer

### 7. Payment Trigger

| Pattern | Trigger | Action |
|---|---|---|
| **Post-delivery** | GRN confirmed | Finance sees "Raise PV" action on PO |
| **Pre-payment** | PO approved | Finance sees "Raise PV" immediately; GRN still required within 30 days as compliance record |
| **Milestone** | Each milestone sign-off | Partial PV raised per milestone; PO closes when all milestones settled |

Payment Voucher is raised in the existing Finance/PV flow, linked to the PO record.

---

## Payment Pattern — Milestone Detail

Milestone schedule stored in `PurchaseOrder.milestones` JSON:

```json
[
  { "seq": 1, "description": "Deposit", "percentage": 40, "amount": 200000, "trigger": "po_approved", "status": "paid" },
  { "seq": 2, "description": "Delivery", "percentage": 40, "amount": 200000, "trigger": "grn_confirmed", "status": "pending" },
  { "seq": 3, "description": "Installation sign-off", "percentage": 20, "amount": 100000, "trigger": "manual_signoff", "status": "pending" }
]
```

Each milestone generates its own PV. PO status → `completed` only when all milestones are `paid`.

---

## Vendor Portal

**URL namespace:** `/vendor-portal/*` (public route, separate from staff app)

**Auth:**
- First access: magic link email (signed JWT, 7-day TTL, `aud: vendor-portal`)
- Vendor sets password on first login
- Subsequent logins: email + password
- Vendor JWT is scoped to vendor portal endpoints only — cannot access staff APIs
- Procurement Officer can suspend a vendor account or resend invitation from the PO/vendor view

**Vendor portal screens:**
1. **Login** — email + password
2. **Dashboard** — list of all POs addressed to this vendor (filterable by status)
3. **PO Detail** — line items, delivery terms, payment pattern summary, timeline, thread events
4. **Acknowledge** — button + optional note field; disabled once acknowledged
5. **PDF Download** — download PO PDF

---

## Document Generation

All documents use the existing `DocumentGeneratorService`.

| Document | Trigger | Format |
|---|---|---|
| PR Summary PDF | PR submitted | Internal — attached to approval thread |
| Purchase Order PDF | PO approved | External — emailed to vendor, downloadable by staff |
| GRN PDF | GRN confirmed | Internal — attached to Finance payment queue |

---

## Approval Configuration

Procurement uses the existing `approvalFlowJson` structure. Each category (goods, services, works) gets its own configurable flow. Recommended default tiers:

| Value | Chain |
|---|---|
| < ₦100k | Procurement Officer → Finance Manager |
| ₦100k – ₦500k | Procurement Officer → Finance Manager → COO |
| > ₦500k | Procurement Officer → Finance Manager → COO → ED |

Thresholds are admin-configurable — not hardcoded.

---

## Integration Points

| System | How procurement uses it |
|---|---|
| **WorkflowService** | `startForRequest()` called for both PR and PO; full thread display |
| **Finance Vendor Registry** | POs reference `financeVendor` — no duplicate vendor storage |
| **Finance Budget** | PR links `budgetLineId`; approval step can check available balance |
| **NotificationsService** | Every status change triggers notifications to relevant parties |
| **Finance PV** | GRN confirmation or PO approval (pre-payment) surfaces a "Raise PV" action in Finance |
| **DocumentGeneratorService** | PR, PO, GRN PDFs |

---

## RBAC & Visibility

| Role | Can see | Can do |
|---|---|---|
| **Staff** | Own PRs | Create, edit draft, submit PR |
| **HOD** | Team PRs | Approve/reject PR (Step 1) |
| **Procurement Officer** | All PRs and POs | Review PR, create PO, confirm GRN, resend vendor invite |
| **Finance** | POs at payment stage | Raise PV, view GRN |
| **COO / ED** | All (view) | Approve PO per value tier |
| **Vendor User** | Own vendor's POs | View, acknowledge, download PDF |

---

## Module Structure

```
api/src/modules/procurement/
  procurement.module.ts
  procurement.controller.ts        # PR and PO endpoints (staff/officer)
  procurement.service.ts
  vendor-portal.controller.ts      # Vendor-facing endpoints
  vendor-portal.service.ts
  dto/
    create-pr.dto.ts
    update-pr.dto.ts
    submit-pr.dto.ts
    create-po.dto.ts
    update-po.dto.ts
    create-grn.dto.ts
    confirm-grn.dto.ts
    vendor-acknowledge.dto.ts
    vendor-login.dto.ts
  documents/
    purchase-requisition.document.ts
    purchase-order.document.ts
    goods-receipt-note.document.ts
```

---

## Phase 2 (Future)

- Vendor invoice submission via portal
- Automated invoice-to-PO line item matching
- Supplier performance scoring
- Multi-vendor quote comparison before PO creation
- Integration with Zoho/accounting system for PO sync
