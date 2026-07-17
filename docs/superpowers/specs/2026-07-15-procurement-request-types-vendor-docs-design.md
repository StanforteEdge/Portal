# Procurement Request Types, Vendor Documents, and PO Numbering Design

## Goal

Extend the current procurement flow so that:

- procurement requests are seeded as three separate request types
- vendor-related procurement documents can be classified as internal-only or vendor-shareable
- purchase orders and related procurement documents are downloadable in a consistent way
- procurement numbering begins at 501
- the manual-entry guidance is updated to include procurement and tax-related manual flows

## Scope

This design covers:

- procurement request type seeding
- procurement request and purchase order document handling
- vendor-facing document visibility rules
- procurement numbering behavior
- user-facing documentation/manual updates

This design does not change the high-level architecture that procurement starts in Requests and execution continues in Procurement.

## Current State

- Procurement request intake already exists through the request engine and procurement handoff.
- Procurement execution already has API and PWA pages for:
  - requisitions
  - procurement case intake
  - purchase orders
  - GRN confirmation
- Purchase order document generation already exists in the API at `api/src/modules/procurement/documents/purchase-order.document.ts`.
- Procurement numbering currently uses `nextNumber(prefix: 'PR' | 'PO' | 'GRN')` in `api/src/modules/procurement/procurement.service.ts`.
- The repo already uses seeding scripts for request groups, categories, and request types.
- The current document work supports files and links, but not a procurement-specific internal/vendor visibility classification.

## Desired Outcome

- Three separate procurement request types exist and are seeded under the procurement category:
  - Goods Procurement Request
  - Services Procurement Request
  - Works Procurement Request
- Vendor/procurement documents can be marked as either:
  - internal-only
  - vendor-shareable
- When a vendor is attached to a procurement request or a PO is generated/downloaded, vendor-shareable documents are the ones included for vendor-facing use.
- Purchase orders are clearly downloadable from the procurement flow.
- Procurement numbering for requisitions and purchase orders starts at 501.
- Documentation/manuals explain procurement and tax-related manual entry behavior clearly.

## Request Type Design

### Request Category

Keep procurement under the existing procurement request category and request workflow, but create separate request types within that category.

### New Request Types

Seed these request types:

1. Goods Procurement Request
2. Services Procurement Request
3. Works Procurement Request

### Reasoning

Using separate request types is preferred over one type with only an internal category field because:

- it keeps approvals and reporting clearer
- it allows request-specific labels and code prefixes
- it keeps future workflow specialization easier without forcing immediate complexity now

### Suggested Prefixing

The request types should use separate code prefixes so the request layer remains distinguishable.

Recommended prefixes:

- Goods Procurement Request: `PG`
- Services Procurement Request: `PS`
- Works Procurement Request: `PW`

These prefixes are for request types in the request engine, not for procurement execution numbering.

## Procurement Execution Design

### Existing Model

Keep the current procurement execution flow after approval:

1. Request is approved in Requests
2. Procurement intake creates a procurement case / requisition
3. Procurement creates a PO
4. Vendor receives/acknowledges PO
5. GRN and payment follow

### No Separate Execution Pipelines

Do not create three separate procurement execution modules. The category-specific distinction should remain at request type and request metadata level, while procurement execution remains unified.

## Vendor Document Design

### Purpose

Procurement-related documents should support two visibility modes:

1. Internal-only
2. Vendor-shareable

This distinction determines what appears in internal procurement/request detail screens versus what is exposed when vendor-facing documentation is assembled.

### Internal-only Documents

Examples:

- internal review notes
- comparative bid sheets
- internal approvals
- tax/risk assessment notes

These should remain visible only inside the internal portal.

### Vendor-shareable Documents

Examples:

- purchase order PDF
- specification sheets intended for vendor execution
- approved request brief intended for vendor context
- externally shareable attachments

These should be surfaced when a vendor is attached to the request/PO and when procurement wants to download or send the relevant vendor package.

### Visibility Model

The document metadata should carry an explicit visibility field rather than inferring visibility from location alone.

Recommended values:

- `internal`
- `vendor`

This should apply to procurement/request attachments relevant to procurement workflows.

## Vendor-Tagged Request Behavior

When a vendor is associated with a procurement case or PO:

- internal users should still see all procurement/request documents with their visibility label
- vendor-facing download/send actions should include only `vendor` documents

This avoids accidental leakage of internal files while keeping vendor packets predictable.

## Download Behavior

### Purchase Orders

Purchase orders must remain downloadable from procurement detail screens.

### Procurement / Request Documents

Ensure that the procurement flow supports either:

- direct download of individual vendor-shareable documents
- or a clearly grouped vendor-facing document section from which the user can download what should accompany the PO/request

### User Experience Requirement

The interface should make it obvious which documents are:

- internal-only
- vendor-shareable

This should be visible in procurement and request detail screens.

## Numbering Design

### Requirement

Procurement and purchase order numbering should begin from 501.

### Recommended Scope

Apply this to procurement execution numbers:

- PR
- PO
- GRN

Recommended results:

- first requisition: `PR-501`
- first purchase order: `PO-501`
- first goods received note: `GRN-501`

### Reasoning

Using the same starting threshold across procurement execution identifiers keeps the procurement series consistent and avoids mixed numbering expectations.

## Documentation / Manual Updates

### Procurement Manual Content

Update the procurement-related guidance to explain:

- the three procurement request types
- where procurement begins versus where execution continues
- how vendor-shareable versus internal documents behave
- how procurement downloads and PO downloads work

### Tax / Manual Entry Guidance

Update manual-entry guidance to include tax-related manual processes where relevant, especially where procurement and payment voucher flows intersect with deductions or vendor-related finance handling.

The intent is not to redesign tax processing here, but to ensure users can understand the manual operational steps tied to procurement and related finance records.

## File/Module Expectations

Likely areas to change during implementation:

### API

- request/procurement seed scripts
- procurement service/controller logic
- purchase order document generation logic
- procurement-related persistence for document visibility metadata

### PWA

- procurement order create/detail/list pages
- procurement intake/detail pages
- request detail pages where procurement-linked documents are shown
- any vendor/procurement document UI needed for visibility labels and downloads

### Docs

- procurement manual
- manual-entry or tax-related usage documentation

## Risks

- if document visibility is inferred instead of stored explicitly, vendor-facing downloads may accidentally include internal files
- if numbering start logic is changed incompletely, old and new numbering may become inconsistent across PR/PO/GRN
- if request type seeding is done without preserving existing procurement request handling, approved procurement requests may stop flowing into the procurement intake queue correctly

## Testing Expectations

Implementation should verify:

1. the three procurement request types are created and visible
2. approved requests still enter procurement intake properly
3. procurement requisition/PO/GRN numbering starts at 501 for new series behavior
4. vendor-shareable documents appear in vendor-facing procurement flows
5. internal-only documents do not appear in vendor-facing download/send flows
6. PO download remains functional
7. manuals/documentation reflect the updated behavior
