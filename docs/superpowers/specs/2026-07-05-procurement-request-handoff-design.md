# Procurement Request Handoff Design

**Date:** 2026-07-05
**Status:** Draft

## Goal

Design a procurement system where staff initiate procurement needs through the request engine, approved requests move into a procurement intake queue, and procurement officers explicitly create and manage procurement execution records from those approved requests.

## Summary

Procurement should reuse the request engine for initiation and approval, but it should keep execution in a dedicated procurement module. Staff remain in the familiar request flow. Procurement officers work from an intake queue of approved procurement requests and click `Create Procurement Case` to begin sourcing, purchase order, delivery, and GRN workflows.

## Selected Approach

**Option A (selected):** request-backed intake plus procurement execution handoff.

- Staff creates procurement needs in `Requests`
- Approved requests appear in `Procurement Intake`
- Procurement officer explicitly creates a linked `Procurement Case`
- Procurement module owns sourcing, PO, GRN, vendor coordination, and payment readiness

## Why This Approach

- Reuses the existing request approval engine instead of duplicating it
- Keeps staff out of a specialist procurement module for simple initiation
- Gives procurement officers a proper operational workspace
- Preserves a clear audit trail from need -> approval -> execution -> payment
- Matches the required handoff rule: no automatic case creation; officer must click to create

## Scope

### In Scope

- Procurement initiation through request engine
- Procurement-specific request type and form
- Approved procurement request intake queue
- Procurement officer handoff action: `Create Procurement Case`
- Procurement execution statuses and screens
- Roles, permissions, and approval flow
- Linkage to vendor, PO, GRN, and later payment request
- Usage manual for staff, procurement officers, and finance

### Out of Scope

- Full payment voucher implementation details
- Vendor scoring/advanced sourcing rules
- Multi-round tender workflows
- Procurement analytics dashboard beyond basic lists
- Full contract lifecycle management

## Core Principle

- Request engine owns initiation and approval
- Procurement module owns fulfillment and execution

Procurement should not be modeled entirely as generic requests, and it should not grow a second parallel approval engine.

## Lifecycle

1. Staff creates a `Procurement Request` in the request engine.
2. Request goes through standard approval flow.
3. Once approved, request appears in the procurement intake queue.
4. Procurement officer reviews the approved intake item.
5. Procurement officer clicks `Create Procurement Case`.
6. Procurement case moves through sourcing, PO, delivery, and GRN workflows.
7. Procurement case becomes `ready_for_payment` when operational execution is complete.
8. Finance/payment request is raised from the procurement case or linked PO/GRN context.

## Staff-Side Initiation

### Entry Point

Staff should start procurement from the request engine, not from the procurement officer module.

Primary entry points:
- `Requests -> New Procurement Request`
- `Requests -> My Requests`
- request detail page for procurement-specific progress and comments

### Procurement Request Type

Add a procurement-specific request type in the request engine.

Required fields:
- title
- category: `goods`, `services`, `works`
- team / project context
- budget and budget line
- needed-by date
- justification
- specification / scope
- item lines
- optional suggested vendor
- attachments

Optional later fields:
- delivery location
- preferred vendor list
- special compliance flags

### Request Statuses

Procurement requests use request-engine statuses such as:
- `draft`
- `approval`
- `approved`
- `rejected`
- `returned`

## Roles and Permissions

### Roles

- Staff Requester
- Team Lead
- Budget Owner
- Finance Approver
- Procurement Officer
- Procurement Manager
- COO / ED
- Vendor Portal User

### Permission Matrix

**Staff Requester**
- `requests.create`
- `requests.view.own`
- `procurement.request`

**Team Lead**
- `requests.approve`
- `requests.view.team`

**Budget Owner**
- `requests.approve`
- `budgets.view`

**Finance Approver**
- `requests.approve`
- `finance.view`
- `finance.approve`

**Procurement Officer**
- `procurement.view`
- `procurement.manage`
- `procurement.orders.manage`
- `procurement.grn.manage`

**Procurement Manager**
- `procurement.view`
- `procurement.manage`
- `procurement.approve`

**COO / ED**
- `requests.approve`
- executive threshold approval rights

**Vendor Portal User**
- `procurement.vendor.portal`

## Approval Flow

### Default Procurement Request Approval

1. Staff submits request
2. Team Lead approves
3. Budget Owner approves when budget-linked or over-budget
4. Finance approves (mandatory)
5. COO / ED approves by threshold or exception rule
6. Request becomes approved
7. Approved request appears in procurement intake
8. Procurement officer explicitly creates procurement case

### Key Rule

Procurement officer is not the default initial approver. Procurement officer is primarily the execution owner after request approval.

### Exception Routing

**Over-budget**
- mandatory justification
- budget owner mandatory
- finance mandatory
- executive escalation by amount/policy

**Unbudgeted**
- team lead
- finance mandatory
- likely executive approval depending on policy

**Sole-source / urgent**
- procurement manager review
- justification and supporting documents required

## Procurement Intake Queue

### Purpose

The intake queue is the operational bridge between request approvals and procurement execution.

Only approved procurement requests appear here.

### Allowed Actions

- review intake item
- request clarification through linked request communication path
- create procurement case
- cancel/close only with proper authority

### Handoff Rule

- Approved requests do not automatically create procurement cases
- Procurement officer opens an intake item and clicks `Create Procurement Case`
- That action creates the operational procurement record and links it back to the approved request

## Procurement Case

### Purpose

`ProcurementCase` is the execution record used by procurement officers after approval.

### Linked Records

- originating request
- assigned procurement officer
- selected vendor
- purchase orders
- goods receipt notes
- files and supporting documents
- later payment request or finance settlement records

### Procurement Case Statuses

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

## Procurement Officer Screens

### Procurement Intake

Shows approved procurement requests waiting for officer action.

Primary data points:
- request number
- title
- requester
- team/project
- category
- budget line
- approved date
- urgency flag

Primary actions:
- open details
- create procurement case
- request clarification

### Procurement Cases

Shows active cases owned or visible to procurement officers/managers.

Primary data points:
- case number
- linked request
- officer
- vendor status
- current workflow state
- payment readiness

### Purchase Orders

Shows issued and draft purchase orders.

### GRNs / Deliveries

Shows delivery and receipt confirmation records.

## Purchase Order and GRN Flow

### Purchase Order

Procurement case can create one or more purchase orders depending on sourcing and award logic.

PO should contain:
- linked requisition/case
- vendor
- delivery terms
- payment terms
- item lines
- amount
- approval state where applicable

### GRN

GRN should confirm receipt against the PO.

GRN should contain:
- linked PO
- received date
- line receipt quantities
- condition
- notes
- confirmation officer

When GRN is confirmed, the procurement case can move toward `ready_for_payment`.

## Vendor Linkage

Vendor should remain a reusable master record.

Procurement should be able to attach:
- quotation files
- vendor compliance documents
- supporting correspondence
- PO acknowledgement evidence

Vendor documents must remain reusable later in payment workflows.

## Budget Control

Procurement request should normally select:
- approved budget
- budget line

Rules:
- over-budget allowed with justification
- unbudgeted allowed as exception path
- approval chain escalates according to budget exception rules

## Payment Linkage

Payment should not start in isolation.

Recommended rule:
- payment request must be raised from the procurement case or linked PO/GRN context
- procurement case status `ready_for_payment` unlocks payment request creation

Linked records to preserve:
- originating request
- procurement case
- vendor
- purchase order
- GRN if applicable

This ensures traceability from requester through payment.

## Audit Trail

The system must record:
- who requested
- who approved each request step
- who created the procurement case
- who selected vendor
- who issued the PO
- who confirmed GRN
- who raised payment request

## Data Model Direction

Recommended ownership split:
- `RequestInstance` for intake/approval
- `ProcurementCase` for execution
- `ProcurementQuote` optional later
- `ProcurementOrder` / purchase order for vendor commitment
- `ProcurementGRN` for receipt
- `FinanceContact` / vendor master reused across procurement and payment

## API Direction

Recommended capabilities:

Request side:
- procurement request type registration in requests module
- list/filter approved procurement requests for intake

Procurement side:
- create procurement case from approved request
- list intake queue
- list procurement cases
- create/list/update POs
- create/list/update GRNs
- trigger payment-ready state

## Navigation Direction

### Staff

- `Requests -> New Procurement Request`

### Procurement Officers

- `Procurement -> Intake`
- `Procurement -> Cases`
- `Procurement -> Purchase Orders`

### Vendor Portal

- separate vendor login and order acknowledgement views

## Acceptance Criteria

- Staff can raise procurement needs without entering the procurement officer module
- Procurement requests follow standard request approval flow
- Approved procurement requests appear in a procurement intake queue
- Procurement officer must explicitly create a procurement case
- Procurement case tracks execution independently of request approval state
- Vendor, PO, GRN, and later payment records remain linked to the originating request
- Roles and permissions clearly separate requester, approver, procurement, and vendor responsibilities

## Deferred Decisions

- multi-vendor quotation rounds
- tender committee workflow
- contract lifecycle management
- auto-generated payment requests from GRN confirmation
- advanced sourcing analytics
