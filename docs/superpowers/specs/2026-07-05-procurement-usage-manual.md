# Procurement Usage Manual

**Date:** 2026-07-05
**Status:** Draft

## Purpose

This manual explains how staff, approvers, procurement officers, finance, and vendors should use the procurement workflow once the request-backed intake and procurement execution model is implemented.

## Who Uses This

- staff requesters
- team leads
- budget owners
- finance approvers
- procurement officers
- procurement managers
- vendors via vendor portal

## Main Terms

- **Procurement Request:** the staff-facing request raised through the request engine
- **Procurement Intake:** the queue of approved procurement requests awaiting procurement officer action
- **Procurement Case:** the execution record created by a procurement officer from an approved request
- **Purchase Order (PO):** the formal order issued to a vendor
- **GRN:** goods receipt note confirming delivery/receipt

## Staff Workflow

### Raise a Procurement Request

1. Open `Requests`.
2. Choose `New Procurement Request`.
3. Enter the purchase purpose and category.
4. Select the team/project and budget line where applicable.
5. Add item lines, specifications, and attachments.
6. Save as draft or submit for approval.

### Track Progress

Staff should use request detail pages to see:
- approval status
- return/rejection comments
- procurement progression after approval

## Approver Workflow

### Team Lead

Review:
- need and justification
- team relevance
- urgency

### Budget Owner

Review:
- correct budget line
- budget sufficiency
- over-budget justification where applicable

### Finance

Review:
- budget/fund appropriateness
- exception handling
- payment pattern and documentation quality

### Executive Approver

Review requests that cross threshold or exception rules.

## Procurement Officer Workflow

### Intake Queue

1. Open `Procurement -> Intake`.
2. Review approved procurement requests waiting for action.
3. Open the request details and supporting documents.
4. If ready, click `Create Procurement Case`.

Important rule:
- approved requests do not automatically become procurement cases
- procurement officer must explicitly create the case

### Work the Procurement Case

From the procurement case, officers should:
- review scope and requirements
- collect or attach quotation/vendor documents
- choose vendor
- prepare purchase order
- track delivery
- create GRN
- move the case toward `ready_for_payment`

## Procurement Case Statuses

- `new`
- `under_review`
- `sourcing`
- `awaiting_po`
- `po_issued`
- `part_delivered`
- `delivered`
- `grn_confirmed`
- `ready_for_payment`
- `closed`
- `cancelled`

## Purchase Orders

Use purchase orders to formalize procurement execution with vendors.

POs should capture:
- vendor
- linked requisition/case
- line items
- payment terms
- delivery terms
- milestones where applicable

## GRN Workflow

After goods or services are delivered:

1. Open the related purchase order or procurement case.
2. Create a GRN.
3. Record received quantities and condition.
4. Confirm the GRN.

Confirmed GRN should help move the case toward payment readiness.

## Finance / Payment Handoff

Finance should not raise payment from disconnected records.

Payment should be created from the procurement case or PO/GRN context so the system keeps links to:
- original request
- procurement case
- vendor
- PO
- GRN

## Vendor Portal

Vendors should use the vendor portal to:
- sign in
- review assigned purchase orders
- acknowledge orders
- respond or provide fulfillment notes where supported

## Exception Handling

### Over-Budget Requests

Allowed, but require:
- budget owner review
- finance review
- justification
- executive escalation where configured

### Unbudgeted Requests

Allowed through exception flow with stronger approval.

### Urgent / Sole-Source Requests

Require stronger justification and procurement manager oversight if configured.

## Good Operating Practice

- staff should provide clear specifications early
- approvers should reject or return vague requests instead of approving weak records
- procurement officers should create cases only when intake records are complete enough to act on
- PO and GRN steps should be recorded in the system, not managed off-book
- payment should always be linked back to the procurement chain

## Troubleshooting Guidance

### My approved procurement request is not yet in execution

Check whether it has only been approved and is still waiting in procurement intake. A procurement officer must still create the procurement case.

### A procurement officer cannot move forward

Check for missing:
- vendor information
- supporting documents
- item detail/specification
- approval completion

### Finance cannot see enough support for payment

Confirm the procurement case has the linked PO, GRN, vendor information, and supporting documents attached.
