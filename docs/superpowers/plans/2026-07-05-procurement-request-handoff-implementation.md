# Procurement Request Handoff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a procurement workflow where staff initiate procurement through the request engine, approved requests enter a procurement intake queue, and procurement officers explicitly create and execute procurement cases in the procurement module.

**Architecture:** Reuse `RequestInstance` for staff intake and approvals, then add a procurement intake bridge that lists approved procurement requests not yet converted into operational procurement cases. Keep sourcing, purchase order, GRN, vendor acknowledgement, and payment readiness inside the dedicated procurement module, linked back to the originating request.

**Tech Stack:** NestJS, Prisma, PostgreSQL, React, React Router, TypeScript, `apps/pwa`, shared API client layer.

---

## File Map

### Backend

- Modify: `api/prisma/schema.prisma`
- Create: `api/prisma/migrations/<timestamp>_procurement_request_handoff/migration.sql`
- Modify: `api/src/modules/procurement/procurement.controller.ts`
- Modify: `api/src/modules/procurement/procurement.service.ts`
- Modify: `api/src/modules/procurement/procurement.module.ts`
- Create: `api/src/modules/procurement/dto/create-procurement-case.dto.ts`
- Modify: `api/src/modules/procurement/dto/create-pr.dto.ts`
- Create: `api/src/modules/procurement/__tests__/procurement-handoff.spec.ts`
- Modify: `api/src/modules/requests/requests.service.ts`
- Modify: `api/src/modules/requests/dto/create-request.dto.ts`

### Frontend Shared/API

- Modify: `apps/shared/src/api/procurement-api.ts`
- Modify: `apps/shared/src/index.ts`
- Modify: `apps/pwa/src/shared/lib/core.ts`

### Frontend Request Entry

- Modify: `apps/pwa/src/pages/requests/new/RequestTypePage.tsx`
- Modify: `apps/pwa/src/pages/requests/new/RequestFormPage.tsx`
- Modify: `apps/pwa/src/pages/requests/RequestDetailsPage.tsx`
- Create: `apps/pwa/src/pages/requests/bodies/ProcurementRequestBody.tsx`

### Frontend Procurement Module

- Modify: `apps/pwa/src/App.tsx`
- Modify: `apps/pwa/src/shared/navigation.ts`
- Modify: `apps/pwa/src/pages/procurement/index.tsx`
- Modify: `apps/pwa/src/pages/procurement/detail.tsx`
- Modify: `apps/pwa/src/pages/procurement/orders/index.tsx`
- Modify: `apps/pwa/src/pages/procurement/orders/create.tsx`
- Modify: `apps/pwa/src/pages/procurement/orders/detail.tsx`

### Docs

- Already written: `docs/superpowers/specs/2026-07-05-procurement-request-handoff-design.md`
- Already written: `docs/superpowers/specs/2026-07-05-procurement-usage-manual.md`

## Task 1: Add Procurement Case and Request Linkage Schema

**Files:**
- Modify: `api/prisma/schema.prisma`
- Create: `api/prisma/migrations/<timestamp>_procurement_request_handoff/migration.sql`
- Test: `api/src/modules/procurement/__tests__/procurement-handoff.spec.ts`

- [ ] **Step 1: Write the failing schema-oriented service test**

Create `api/src/modules/procurement/__tests__/procurement-handoff.spec.ts`:

```ts
import { ProcurementService } from '../procurement.service';

describe('ProcurementService handoff', () => {
  const prisma: any = {
    requestInstance: { findUnique: jest.fn(), findMany: jest.fn() },
    procurementCase: { create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn() },
    procurementRequisition: { findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn() },
    $transaction: jest.fn(async (callback: any) => callback(prisma)),
  };

  const service = new ProcurementService(prisma, {} as any, {} as any, {} as any);

  beforeEach(() => jest.clearAllMocks());

  it('creates a procurement case from an approved procurement request', async () => {
    prisma.requestInstance.findUnique.mockResolvedValue({
      id: 101n,
      status: 'approved',
      requestType: { workflowType: 'procurement' },
      data: { title: 'Buy laptops' },
      createdBy: 9n,
      teamId: 4n,
    });
    prisma.procurementCase.create.mockResolvedValue({ id: 'case-1', requestId: 101n, status: 'new' });

    const result = await (service as any).createCaseFromApprovedRequest('101', '12', { note: 'Accepted into sourcing' });

    expect(prisma.procurementCase.create).toHaveBeenCalled();
    expect(result.id).toBe('case-1');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run build -w api`
Expected: build still passes, but the new spec should fail once a test runner is wired in later; for this repo, keep the file compiling first and use it as the regression anchor during implementation.

- [ ] **Step 3: Add Prisma models and links**

Extend `api/prisma/schema.prisma` with a procurement execution record linked to requests:

```prisma
model ProcurementCase {
  id               String   @id @default(uuid()) @db.Uuid
  requestId        BigInt   @unique @map("request_id")
  requisitionId    String?  @map("requisition_id") @db.Uuid
  assignedOfficerId BigInt? @map("assigned_officer_id")
  status           String   @default("new") @db.VarChar(30)
  category         String?  @db.VarChar(20)
  note             String?
  createdBy        BigInt?  @map("created_by")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  request       RequestInstance         @relation(fields: [requestId], references: [id], onDelete: Cascade)
  requisition   ProcurementRequisition? @relation(fields: [requisitionId], references: [id], onDelete: SetNull)

  @@index([status])
  @@index([assignedOfficerId])
  @@map("sta_procurement_cases")
}
```

Also add the reverse relation on `RequestInstance` and `ProcurementRequisition`.

- [ ] **Step 4: Create the migration SQL**

Run: `npm run prisma:migrate -w api -- --name procurement_request_handoff`
Expected: migration generated with `sta_procurement_cases` and new relations.

- [ ] **Step 5: Commit**

```bash
git add api/prisma/schema.prisma api/prisma/migrations api/src/modules/procurement/__tests__/procurement-handoff.spec.ts
git commit -m "feat(procurement): add procurement case schema"
```

## Task 2: Mark Procurement Request Types in the Request Engine

**Files:**
- Modify: `api/src/modules/requests/dto/create-request.dto.ts`
- Modify: `api/src/modules/requests/requests.service.ts`

- [ ] **Step 1: Add a failing service assertion for procurement workflow typing**

Add to `procurement-handoff.spec.ts`:

```ts
it('rejects procurement case creation when request is not approved procurement workflow', async () => {
  prisma.requestInstance.findUnique.mockResolvedValue({
    id: 101n,
    status: 'draft',
    requestType: { workflowType: 'general' },
  });

  await expect((service as any).createCaseFromApprovedRequest('101', '12', {})).rejects.toThrow('Approved procurement request required');
});
```

- [ ] **Step 2: Add request-side procurement fields**

Extend procurement-capable request payloads in `create-request.dto.ts` by documenting/requesting these `data` properties for procurement requests:

```ts
data: {
  title: 'Purchase of QA laptops',
  category: 'goods',
  needed_by: '2026-08-01',
  budget_id: 'budget-uuid',
  budget_line_id: 'budget-line-uuid',
  justification: 'Team expansion',
  specification: '15-inch, 16GB RAM',
  suggested_vendor_id: 'vendor-uuid',
}
```

- [ ] **Step 3: Ensure request serialization exposes procurement shape cleanly**

In `requests.service.ts`, when listing/getting requests, preserve procurement request `data` fields and surface `workflow_type` / `request_type.workflow_type` so the PWA can recognize procurement requests without guessing.

- [ ] **Step 4: Commit**

```bash
git add api/src/modules/requests/dto/create-request.dto.ts api/src/modules/requests/requests.service.ts api/src/modules/procurement/__tests__/procurement-handoff.spec.ts
git commit -m "feat(requests): expose procurement workflow metadata"
```

## Task 3: Replace Staff Procurement Creation with Request-Backed Intake

**Files:**
- Modify: `apps/shared/src/api/procurement-api.ts`
- Modify: `apps/shared/src/index.ts`
- Modify: `apps/pwa/src/shared/lib/core.ts`
- Modify: `apps/pwa/src/pages/requests/new/RequestTypePage.tsx`
- Modify: `apps/pwa/src/pages/requests/new/RequestFormPage.tsx`
- Create: `apps/pwa/src/pages/requests/bodies/ProcurementRequestBody.tsx`

- [ ] **Step 1: Add a shared API helper for procurement intake listing**

Extend `apps/shared/src/api/procurement-api.ts`:

```ts
listIntake: () => http<any[]>('/procurement/intake'),
createCaseFromRequest: (requestId: string, data?: Record<string, unknown>) =>
  http<any>(`/procurement/intake/${requestId}/create-case`, { method: 'POST', body: data }),
```

- [ ] **Step 2: Add procurement request body renderer**

Create `apps/pwa/src/pages/requests/bodies/ProcurementRequestBody.tsx` to show procurement-specific request details:

```tsx
export default function ProcurementRequestBody({ request }: { request: any }) {
  const data = request?.data || {};
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <SectionCard title="Procurement Summary">
        <p className="text-sm text-slate-600">Category: {String(data.category || '-')}</p>
        <p className="text-sm text-slate-600">Needed by: {String(data.needed_by || '-')}</p>
        <p className="text-sm text-slate-600">Budget line: {String(data.budget_line_id || '-')}</p>
      </SectionCard>
      <SectionCard title="Specification">
        <p className="text-sm text-slate-600 whitespace-pre-wrap">{String(data.specification || '-')}</p>
      </SectionCard>
    </div>
  );
}
```

- [ ] **Step 3: Wire procurement into request type selection**

In `RequestTypePage.tsx` and/or `RequestFormPage.tsx`, detect request types where `workflow_type === 'procurement'` and render procurement-specific input sections inside the request engine rather than navigating to `/procurement/create`.

- [ ] **Step 4: Stop using direct PR creation for staff requests**

Refactor `apps/pwa/src/pages/procurement/create.tsx` into either:
- a redirect back into `Requests -> New Procurement Request`, or
- a thin wrapper around the request form if still needed temporarily.

The approved architecture requires staff procurement to start in requests, not direct procurement requisitions.

- [ ] **Step 5: Commit**

```bash
git add apps/shared/src/api/procurement-api.ts apps/shared/src/index.ts apps/pwa/src/shared/lib/core.ts apps/pwa/src/pages/requests/new/RequestTypePage.tsx apps/pwa/src/pages/requests/new/RequestFormPage.tsx apps/pwa/src/pages/requests/bodies/ProcurementRequestBody.tsx apps/pwa/src/pages/procurement/create.tsx
git commit -m "feat(procurement): route staff intake through requests"
```

## Task 4: Add Procurement Intake Queue and Explicit Case Creation

**Files:**
- Create: `api/src/modules/procurement/dto/create-procurement-case.dto.ts`
- Modify: `api/src/modules/procurement/procurement.controller.ts`
- Modify: `api/src/modules/procurement/procurement.service.ts`
- Modify: `apps/pwa/src/pages/procurement/index.tsx`
- Modify: `apps/pwa/src/pages/procurement/detail.tsx`

- [ ] **Step 1: Add intake endpoints**

Extend `procurement.controller.ts`:

```ts
@Get('intake')
listIntake(@Req() req: any) {
  return this.service.listIntake(req.user.id, req.user.role);
}

@Post('intake/:requestId/create-case')
createCaseFromRequest(@Param('requestId') requestId: string, @Req() req: any, @Body() dto: CreateProcurementCaseDto) {
  return this.service.createCaseFromApprovedRequest(requestId, req.user.id, dto);
}
```

- [ ] **Step 2: Add the create-case DTO**

Create `create-procurement-case.dto.ts`:

```ts
import { IsOptional, IsString } from 'class-validator';

export class CreateProcurementCaseDto {
  @IsOptional()
  @IsString()
  note?: string;
}
```

- [ ] **Step 3: Implement intake query and explicit handoff in service**

Add service methods:

```ts
async listIntake(userId: string, role: string) {
  return this.prisma.requestInstance.findMany({
    where: {
      status: 'approved',
      requestType: { workflowType: 'procurement' },
      procurementCase: null,
    },
    include: {
      requestType: true,
      creator: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

async createCaseFromApprovedRequest(requestId: string, userId: string, dto: { note?: string }) {
  const request = await this.prisma.requestInstance.findUnique({
    where: { id: toBigInt(requestId) },
    include: { requestType: true },
  });
  if (!request || request.status !== 'approved' || request.requestType?.workflowType !== 'procurement') {
    throw new BadRequestException('Approved procurement request required');
  }

  return this.prisma.procurementCase.create({
    data: {
      requestId: request.id,
      assignedOfficerId: toBigInt(userId),
      status: 'new',
      category: String((request.data as any)?.category || ''),
      note: dto.note?.trim() || null,
      createdBy: toBigInt(userId),
    },
  });
}
```

- [ ] **Step 4: Refactor `apps/pwa/src/pages/procurement/index.tsx` into intake view**

Replace direct requisition list with intake-first behavior:

```tsx
const [rows, setRows] = useState<any[]>([]);
useEffect(() => {
  procurementApi.listIntake().then(setRows).finally(() => setLoading(false));
}, []);
```

Primary action per row:

```tsx
<button onClick={() => procurementApi.createCaseFromRequest(row.id, { note: 'Accepted into procurement' })}>
  Create Procurement Case
</button>
```

- [ ] **Step 5: Update `detail.tsx` to show linked request + case creation state**

If a procurement case exists, show execution details. If not, show the approved request details and a procurement officer CTA to create the case.

- [ ] **Step 6: Commit**

```bash
git add api/src/modules/procurement/dto/create-procurement-case.dto.ts api/src/modules/procurement/procurement.controller.ts api/src/modules/procurement/procurement.service.ts apps/pwa/src/pages/procurement/index.tsx apps/pwa/src/pages/procurement/detail.tsx api/src/modules/procurement/__tests__/procurement-handoff.spec.ts
git commit -m "feat(procurement): add intake queue handoff"
```

## Task 5: Convert Procurement Requisition Records into Procurement Cases

**Files:**
- Modify: `api/src/modules/procurement/procurement.service.ts`
- Modify: `api/src/modules/procurement/procurement.controller.ts`
- Modify: `apps/shared/src/api/procurement-api.ts`

- [ ] **Step 1: Keep existing requisition records as execution-side artifacts only if needed**

Refactor `createPr()` usage so staff no longer creates procurement requisitions directly. Procurement requisitions should either:
- be created by the officer when creating the procurement case, or
- be collapsed into the new `ProcurementCase` if requisition and case are redundant.

Recommended minimal move:

```ts
const requisition = await this.prisma.procurementRequisition.create({
  data: {
    requisitionNumber: await this.nextNumber('PR'),
    title: String((request.data as any)?.title || request.id.toString()),
    category: String((request.data as any)?.category || 'goods'),
    paymentPattern: String((request.data as any)?.payment_pattern || 'post_delivery'),
    items: ((request.items || []) as any) ?? [],
    estimatedTotal: Number(request.totalAmount ?? 0),
    justification: String((request.data as any)?.justification || ''),
    budgetLineId: String((request.data as any)?.budget_line_id || ''),
    teamId: request.teamId,
    requestedBy: request.createdBy,
    status: 'approved',
  },
});
```

- [ ] **Step 2: Link the created requisition into the new case**

When the officer creates the case, also set `requisitionId` so downstream PO/GRN screens can continue working with minimal disruption.

- [ ] **Step 3: Commit**

```bash
git add api/src/modules/procurement/procurement.service.ts api/src/modules/procurement/procurement.controller.ts apps/shared/src/api/procurement-api.ts
git commit -m "refactor(procurement): derive requisitions from approved requests"
```

## Task 6: Tighten PO and GRN Flow Around Procurement Cases

**Files:**
- Modify: `api/src/modules/procurement/dto/create-po.dto.ts`
- Modify: `api/src/modules/procurement/procurement.service.ts`
- Modify: `apps/pwa/src/pages/procurement/orders/index.tsx`
- Modify: `apps/pwa/src/pages/procurement/orders/create.tsx`
- Modify: `apps/pwa/src/pages/procurement/orders/detail.tsx`

- [ ] **Step 1: Allow PO creation from case/requisition context**

Extend `CreatePoDto` with `caseId` while preserving `requisitionId` during migration:

```ts
@IsOptional()
@IsString()
caseId?: string;
```

- [ ] **Step 2: Validate approved handoff before PO creation**

In `createPo()`, require that the source requisition/case came from an approved request-derived procurement case and that the case is in an executable status such as `new`, `under_review`, `sourcing`, or `awaiting_po`.

- [ ] **Step 3: Update the orders create page to source from procurement cases**

In `apps/pwa/src/pages/procurement/orders/create.tsx`, load procurement cases or intake-converted requisitions rather than assuming arbitrary approved requisitions.

- [ ] **Step 4: Update order detail to surface procurement case link**

Show:
- linked request number
- linked procurement case
- vendor acknowledgement state
- GRN readiness

- [ ] **Step 5: Commit**

```bash
git add api/src/modules/procurement/dto/create-po.dto.ts api/src/modules/procurement/procurement.service.ts apps/pwa/src/pages/procurement/orders/index.tsx apps/pwa/src/pages/procurement/orders/create.tsx apps/pwa/src/pages/procurement/orders/detail.tsx
git commit -m "feat(procurement): link po and grn to cases"
```

## Task 7: Wire Navigation and Protect Entry Points

**Files:**
- Modify: `apps/pwa/src/App.tsx`
- Modify: `apps/pwa/src/shared/navigation.ts`

- [ ] **Step 1: Add procurement routes back intentionally**

Restore only the routes that match the approved design:

```tsx
import ProcurementIndex from '@/pages/procurement/index';
import CreatePr from '@/pages/procurement/create';
import PrDetail from '@/pages/procurement/detail';
import PoIndex from '@/pages/procurement/orders/index';
import CreatePo from '@/pages/procurement/orders/create';
import PoDetail from '@/pages/procurement/orders/detail';

<Route path="/procurement" element={<ProcurementIndex />} />
<Route path="/procurement/create" element={<CreatePr />} />
<Route path="/procurement/:id" element={<PrDetail />} />
<Route path="/procurement/orders" element={<PoIndex />} />
<Route path="/procurement/orders/create" element={<CreatePo />} />
<Route path="/procurement/orders/:id" element={<PoDetail />} />
```

- [ ] **Step 2: Add navigation entries by audience**

In `shared/navigation.ts`:

```ts
{ label: 'Procurement', icon: 'shopping_cart', path: '/procurement', section: 'Staff', permissions: ['procurement.view', 'procurement.manage'] },
```

Add PO/admin entry only for procurement/finance operators:

```ts
{ key: 'procurement-orders', label: 'Purchase Orders', icon: 'description', path: '/procurement/orders', permissions: ['procurement.orders.manage'] },
```

- [ ] **Step 3: Keep vendor portal routes separate**

Do not merge vendor portal into the main protected route tree. Keep:

```tsx
<Route path="/vendor-portal/login" element={<VendorLogin />} />
<Route path="/vendor-portal/dashboard" element={<VendorDashboard />} />
<Route path="/vendor-portal/orders/:id" element={<VendorOrderDetail />} />
```

- [ ] **Step 4: Commit**

```bash
git add apps/pwa/src/App.tsx apps/pwa/src/shared/navigation.ts
git commit -m "feat(procurement): wire pwa entry points"
```

## Task 8: Verification and Documentation Alignment

**Files:**
- Review only; no required file changes unless verification exposes a gap

- [ ] **Step 1: Run API build**

Run: `npm run build -w api`
Expected: PASS.

- [ ] **Step 2: Run PWA build**

Run: `npm run build -w apps/pwa`
Expected: PASS.

- [ ] **Step 3: Manual verification pass**

Check this flow locally:
- create procurement request through requests
- approve it through request approvals
- confirm it appears in procurement intake
- procurement officer clicks `Create Procurement Case`
- create a PO from the resulting case
- raise and confirm a GRN
- confirm the record is marked ready for payment linkage

- [ ] **Step 4: Final commit if verification changes are needed**

```bash
git add api apps/pwa apps/shared
git commit -m "fix(procurement): align request handoff flow"
```

## Spec Coverage Check

- Staff procurement starts in requests: covered in Tasks 2 and 3.
- Approved request appears in procurement intake: covered in Task 4.
- Officer must click to create case: covered in Task 4.
- Procurement module owns execution after approval: covered in Tasks 4, 5, and 6.
- Roles, permissions, approval chain support: covered in Tasks 2, 4, and 7.
- PO / GRN / vendor / payment linkage: covered in Tasks 5 and 6.

## Notes for the Implementer

- Do not rebuild procurement from scratch; reshape the existing module.
- Do not create a second approval engine.
- Do not keep staff procurement initiation as direct `procurementRequisition.create()` in the final design.
- Preserve traceability from request -> procurement case -> PO -> GRN -> payment handoff.
