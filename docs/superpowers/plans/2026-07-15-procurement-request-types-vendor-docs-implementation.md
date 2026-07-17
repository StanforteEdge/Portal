# Procurement Request Types, Vendor Documents, and PO Numbering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Seed three procurement request types, add internal/vendor procurement document visibility handling, make vendor-facing procurement documents downloadable with purchase orders, and start procurement numbering from 501.

**Architecture:** Extend the existing request-engine-to-procurement handoff instead of creating a new procurement subsystem. Keep request initiation in Requests and procurement execution in Procurement, while adding explicit document visibility metadata and adjusting numbering logic in the existing procurement service. Documentation updates should explain the new procurement request types and related manual/tax handling clearly.

**Tech Stack:** NestJS, Prisma, React, TypeScript, Vite, PostgreSQL, existing seed scripts, existing procurement document generator

---

## File Map

- Modify: `api/scripts/seed-request-categories.js` - ensure procurement category remains the parent for the new request types.
- Create: `api/scripts/seed-procurement-request-types.js` - seed the three procurement request types.
- Modify: `api/package.json` - add a script entry for the procurement request type seed if needed.
- Modify: `api/src/modules/procurement/procurement.service.ts` - update numbering start logic, vendor document handling, and request-to-procurement document extraction behavior.
- Modify: `api/src/modules/procurement/documents/purchase-order.document.ts` - include vendor-shareable document references/download metadata as needed.
- Modify: `api/src/modules/procurement/dto/create-po.dto.ts` and related DTOs if document inclusion metadata needs to be passed explicitly.
- Modify: `apps/pwa/src/pages/procurement/orders/detail.tsx` - expose PO download and vendor-shareable document download visibility.
- Modify: `apps/pwa/src/pages/procurement/detail.tsx` - show linked request documents and their visibility labels.
- Modify: `apps/pwa/src/pages/procurement/orders/create.tsx` - surface request/procurement source context if vendor-shareable docs need selection or review at PO creation time.
- Modify: `apps/pwa/src/pages/requests/RequestDetailsPage.tsx` or procurement-linked request detail components - show procurement document visibility labels where procurement requests are reviewed internally.
- Modify: procurement/shared API client files used by the above pages.
- Modify: relevant Prisma schema and add migration(s) if explicit procurement document visibility fields or join records are needed.
- Modify: procurement and manual documentation files once implementation is complete.

## Task 1: Seed Procurement Request Types

**Files:**
- Modify: `api/scripts/seed-request-categories.js`
- Create: `api/scripts/seed-procurement-request-types.js`
- Modify: `api/package.json`

- [ ] **Step 1: Write a regression test or seed verification target for request type presence**

Use an existing script-based verification approach if there is no seed test harness. The goal is to verify the database contains these request types under the procurement category:

```text
Goods Procurement Request (PG)
Services Procurement Request (PS)
Works Procurement Request (PW)
```

If there is no formal automated seed test file, document the manual verification query to use after seeding:

```sql
SELECT name, code_prefix
FROM sta_request_types
WHERE category_id = (
  SELECT id FROM sta_request_categories WHERE code = 'PROCUREMENT'
)
ORDER BY code_prefix;
```

- [ ] **Step 2: Create `api/scripts/seed-procurement-request-types.js`**

Add a dedicated seed script that follows the existing repo pattern used in `seed-loans-system.js` and `seed-hr-leave-system.js`.

Required seeded request types:

```js
const PROCUREMENT_REQUEST_TYPES = [
  {
    name: 'Goods Procurement Request',
    codePrefix: 'PG',
    workflowType: 'procurement',
    description: 'Procurement request for goods purchases',
  },
  {
    name: 'Services Procurement Request',
    codePrefix: 'PS',
    workflowType: 'procurement',
    description: 'Procurement request for service engagements',
  },
  {
    name: 'Works Procurement Request',
    codePrefix: 'PW',
    workflowType: 'procurement',
    description: 'Procurement request for works and project execution',
  },
];
```

The script should:

- load `api/.env`
- find category `PROCUREMENT`
- upsert each request type by `categoryId + codePrefix`
- preserve `workflowType = 'procurement'`

- [ ] **Step 3: Add package script entry**

Add a new package script in `api/package.json`:

```json
"seed:procurement-request-types": "node scripts/seed-procurement-request-types.js"
```

- [ ] **Step 4: Run the seed script locally**

Run:

```bash
npm run seed:procurement-request-types -w api
```

Expected output should confirm the three request types were created or updated.

- [ ] **Step 5: Verify the seeded rows**

Run the verification query against the local DB and confirm `PG`, `PS`, and `PW` exist under `PROCUREMENT`.

- [ ] **Step 6: Commit the request type seeding work**

```bash
git add api/scripts/seed-request-categories.js api/scripts/seed-procurement-request-types.js api/package.json
git commit -m "feat(procurement): seed category-specific request types"
```

## Task 2: Start Procurement Numbering at 501

**Files:**
- Modify: `api/src/modules/procurement/procurement.service.ts`
- Test/verify: procurement numbering behavior via targeted local calls or existing tests

- [ ] **Step 1: Identify the current numbering logic**

The current logic is:

```ts
private async nextNumber(prefix: 'PR' | 'PO' | 'GRN'): Promise<string> {
  const year = new Date().getFullYear();
  const modelMap = { PR: 'procurementRequisition', PO: 'procurementOrder', GRN: 'procurementGRN' } as const;
  const count = await (this.prisma[modelMap[prefix]] as any).count();
  return `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`;
}
```

- [ ] **Step 2: Update numbering to start from 501**

Change the sequence calculation so the first generated record becomes 501 instead of 0001-equivalent.

Implementation target:

```ts
const base = 500;
return `${prefix}-${year}-${String(base + count + 1).padStart(4, '0')}`;
```

This should apply consistently to `PR`, `PO`, and `GRN`.

- [ ] **Step 3: Verify numbering manually**

Create or simulate the next procurement requisition / PO / GRN locally and confirm formats like:

```text
PR-2026-0501
PO-2026-0501
GRN-2026-0501
```

- [ ] **Step 4: Commit numbering changes**

```bash
git add api/src/modules/procurement/procurement.service.ts
git commit -m "feat(procurement): start numbering from 501"
```

## Task 3: Add Procurement/Vendor Document Visibility Metadata

**Files:**
- Modify: relevant Prisma schema file(s)
- Create: migration for new visibility metadata if required
- Modify: procurement-related API logic in `api/src/modules/procurement/procurement.service.ts`

- [ ] **Step 1: Define the smallest visibility model**

Use explicit values:

```text
internal
vendor
```

The implementation should avoid inference-only behavior.

- [ ] **Step 2: Choose the narrowest storage approach that fits current models**

Preferred order:

1. Add explicit metadata on procurement-linked document records if such records already exist.
2. If procurement currently only references generic request `data` attachments, add a minimal procurement document mapping record rather than overloading unrelated document entities.

The chosen design must support:

- document reference
- visibility classification
- relation to request/procurement case/PO where applicable

- [ ] **Step 3: Add Prisma schema changes and migration**

Create the minimal schema change required to persist procurement document visibility.

The migration must be additive and safe for existing procurement records.

- [ ] **Step 4: Update procurement service read/write paths**

Ensure procurement logic can:

- label documents internally
- filter vendor-facing documents to visibility `vendor`
- expose all documents internally with labels

- [ ] **Step 5: Verify the API contract**

Confirm procurement detail and PO detail responses now include enough information to distinguish:

```json
{
  "visibility": "internal"
}
```

or

```json
{
  "visibility": "vendor"
}
```

- [ ] **Step 6: Commit the persistence and API changes**

```bash
git add api/prisma/schema.prisma api/prisma/migrations/* api/src/modules/procurement/procurement.service.ts
git commit -m "feat(procurement): classify vendor-facing documents"
```

## Task 4: Surface Procurement and Vendor Documents in the PWA

**Files:**
- Modify: `apps/pwa/src/pages/procurement/detail.tsx`
- Modify: `apps/pwa/src/pages/procurement/orders/detail.tsx`
- Modify: `apps/pwa/src/pages/procurement/orders/create.tsx`
- Modify: relevant request detail page(s)

- [ ] **Step 1: Add visibility labels in procurement detail views**

In procurement detail and PO detail pages, show document entries with explicit labels such as:

```text
Internal only
Vendor-shareable
```

- [ ] **Step 2: Add vendor-facing download section to PO detail**

The PO detail screen should include a grouped section for documents intended to accompany the vendor-facing package.

At minimum it should support:

- downloading the PO document
- downloading vendor-shareable supporting documents individually

- [ ] **Step 3: Ensure request-linked procurement documents are visible internally**

When an approved procurement request is viewed internally, show procurement-linked documents with their visibility classification so staff know what will be shared externally.

- [ ] **Step 4: Verify the UI behavior**

Manual verification checklist:

- internal-only docs are visible internally
- vendor-shareable docs are clearly labeled
- PO screen exposes download action(s)
- request/procurement context still renders correctly

- [ ] **Step 5: Commit the PWA visibility/download work**

```bash
git add apps/pwa/src/pages/procurement/detail.tsx apps/pwa/src/pages/procurement/orders/detail.tsx apps/pwa/src/pages/procurement/orders/create.tsx apps/pwa/src/pages/requests/
git commit -m "feat(procurement): expose vendor document downloads"
```

## Task 5: Ensure PO Download Behavior Is Fully Wired

**Files:**
- Modify: `api/src/modules/procurement/documents/purchase-order.document.ts`
- Modify: procurement controller/service endpoints if necessary
- Modify: PWA procurement order detail actions if necessary

- [ ] **Step 1: Verify the PO document generator is reachable from the UI**

The API already has `purchase-order.document.ts`. Confirm there is a controller/service endpoint the PWA can call for the downloadable file.

- [ ] **Step 2: If missing, add the minimal download endpoint**

The endpoint should return the generated PO PDF for a given PO id.

- [ ] **Step 3: Wire PO detail page to download the generated document**

Add a visible `Download PO` action to `apps/pwa/src/pages/procurement/orders/detail.tsx` if it is not already present.

- [ ] **Step 4: Verify download end-to-end**

Manual verification:

- open a PO detail page
- click `Download PO`
- confirm file downloads successfully

- [ ] **Step 5: Commit PO download wiring**

```bash
git add api/src/modules/procurement/documents/purchase-order.document.ts api/src/modules/procurement/procurement.controller.ts apps/pwa/src/pages/procurement/orders/detail.tsx
git commit -m "feat(procurement): wire downloadable purchase orders"
```

## Task 6: Update Procurement and Manual Documentation

**Files:**
- Modify: procurement usage manual/spec docs
- Modify: manual-entry/tax-related documentation where procurement-related manual handling is explained

- [ ] **Step 1: Update procurement documentation**

Document:

- the three request types
- request vs procurement execution boundary
- internal vs vendor-shareable documents
- PO and supporting document download behavior
- procurement numbering from 501

- [ ] **Step 2: Update manual-entry/tax documentation**

Add the procurement/tax-related guidance requested by the user, focusing on manual handling instructions rather than redesigning tax logic.

- [ ] **Step 3: Verify doc accuracy against implementation**

Ensure docs match the final seeded names, code prefixes, numbering output, and document visibility behavior.

- [ ] **Step 4: Commit documentation updates**

```bash
git add docs/
git commit -m "docs(procurement): add request type and vendor doc guidance"
```

## Self-Review Checklist

- Spec coverage check: request type seeding, vendor/internal document visibility, PO download behavior, numbering from 501, and manual updates are all covered.
- Placeholder scan: no unresolved TODO/TBD placeholders remain.
- Type consistency: request type names, prefixes, numbering prefixes, and visibility values are used consistently throughout the plan.
