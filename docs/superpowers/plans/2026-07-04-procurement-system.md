# Procurement System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an end-to-end procure-to-pay system covering Purchase Requisition → Purchase Order → Goods Receipt → Payment Voucher trigger, with a persistent vendor portal.

**Architecture:** New `procurement` NestJS module owns PR/PO/GRN entities and delegates approvals to the existing `WorkflowService` (via a new `startForEntity` method), document generation to `DocumentGeneratorService`, and notifications to `NotificationsService`. Vendor portal runs under `/vendor-portal/*` routes in the PWA with separate JWT auth (`aud: vendor-portal`).

**Tech Stack:** NestJS, Prisma (PostgreSQL), React/TSX (Vite PWA), JWT, Nodemailer (existing MailModule)

## Global Constraints

- All Prisma table names use `@@map("sta_<name>")` with snake_case columns and `@map()` aliases
- BigInt IDs for user/profile foreign keys; String UUID for procurement entity PKs
- `toBigInt()` from `../../common/utils/ids` converts string user IDs
- All service methods are async and use `this.prisma` (injected `PrismaService`)
- Controller routes are prefixed `procurement/`; vendor portal routes prefixed `vendor-portal/`
- Number format: `PR-YYYY-NNNN`, `PO-YYYY-NNNN`, `GRN-YYYY-NNNN`
- Spec: `docs/superpowers/specs/2026-07-04-procurement-system-design.md`

---

## File Map

**API — new files:**
- `api/prisma/schema.prisma` — add 4 models + 3 enums (modify)
- `api/src/modules/workflow/workflow.service.ts` — add `startForEntity()` (modify)
- `api/src/modules/procurement/procurement.module.ts`
- `api/src/modules/procurement/procurement.service.ts`
- `api/src/modules/procurement/procurement.controller.ts`
- `api/src/modules/procurement/vendor-portal.service.ts`
- `api/src/modules/procurement/vendor-portal.controller.ts`
- `api/src/modules/procurement/guards/vendor-jwt.guard.ts`
- `api/src/modules/procurement/dto/create-pr.dto.ts`
- `api/src/modules/procurement/dto/submit-pr.dto.ts`
- `api/src/modules/procurement/dto/action-pr.dto.ts`
- `api/src/modules/procurement/dto/create-po.dto.ts`
- `api/src/modules/procurement/dto/action-po.dto.ts`
- `api/src/modules/procurement/dto/create-grn.dto.ts`
- `api/src/modules/procurement/dto/confirm-grn.dto.ts`
- `api/src/modules/procurement/dto/vendor-login.dto.ts`
- `api/src/modules/procurement/documents/purchase-order.document.ts`
- `api/src/modules/procurement/documents/purchase-requisition.document.ts`
- `api/src/modules/procurement/documents/goods-receipt-note.document.ts`
- `api/src/modules/procurement/__tests__/procurement.service.spec.ts`
- `api/src/modules/procurement/__tests__/vendor-portal.service.spec.ts`
- `api/src/app.module.ts` — register ProcurementModule (modify)

**PWA — new files:**
- `apps/pwa/src/pages/procurement/index.tsx` — staff PR list
- `apps/pwa/src/pages/procurement/create.tsx` — PR creation form
- `apps/pwa/src/pages/procurement/[id].tsx` — PR detail + thread
- `apps/pwa/src/pages/procurement/orders/index.tsx` — PO list (officer)
- `apps/pwa/src/pages/procurement/orders/create.tsx` — PO creation
- `apps/pwa/src/pages/procurement/orders/[id].tsx` — PO detail
- `apps/pwa/src/pages/procurement/grn/create.tsx` — GRN creation
- `apps/pwa/src/pages/vendor-portal/login.tsx`
- `apps/pwa/src/pages/vendor-portal/index.tsx` — vendor PO dashboard
- `apps/pwa/src/pages/vendor-portal/po/[id].tsx` — PO detail + acknowledge
- `apps/shared/src/api/procurement-api.ts` — API client types + functions

---

## Task 1: Prisma Schema — Procurement Models

**Files:**
- Modify: `api/prisma/schema.prisma`

**Interfaces:**
- Produces: `ProcurementRequisition`, `ProcurementOrder`, `ProcurementGRN`, `VendorPortalUser` models; enums `ProcurementStatus`, `PoStatus`, `GrnStatus`, `ProcurementCategory`, `PaymentPattern`

- [ ] **Step 1: Add enums after existing enums (after line ~105)**

```prisma
enum ProcurementCategory {
  goods
  services
  works
}

enum PaymentPattern {
  post_delivery
  pre_payment
  milestone
}

enum ProcurementStatus {
  draft
  submitted
  approved
  rejected
  returned
  converted_to_po
  cancelled
}

enum PoStatus {
  draft
  pending_approval
  approved
  sent
  acknowledged
  partially_received
  received
  completed
  cancelled
}

enum GrnStatus {
  pending
  confirmed
  disputed
}
```

- [ ] **Step 2: Add procurement models at end of schema**

```prisma
model ProcurementRequisition {
  id                 String              @id @default(uuid()) @db.Uuid
  requisitionNumber  String              @unique @map("requisition_number") @db.VarChar(30)
  organizationId     BigInt?             @map("organization_id")
  teamId             BigInt?             @map("team_id")
  requestedBy        BigInt              @map("requested_by")
  title              String              @db.VarChar(200)
  category           ProcurementCategory
  paymentPattern     PaymentPattern      @default(post_delivery) @map("payment_pattern")
  items              Json
  estimatedTotal     Decimal             @map("estimated_total") @db.Decimal(15, 2)
  justification      String?
  budgetLineId       String?             @map("budget_line_id") @db.Uuid
  workflowInstanceId String?             @map("workflow_instance_id") @db.Uuid
  status             ProcurementStatus   @default(draft)
  createdAt          DateTime            @default(now()) @map("created_at")
  updatedAt          DateTime            @updatedAt @map("updated_at")

  requester      Profile              @relation("PrRequestedBy", fields: [requestedBy], references: [id])
  organization   Organization?        @relation(fields: [organizationId], references: [id])
  team           Group?               @relation(fields: [teamId], references: [id])
  purchaseOrders ProcurementOrder[]

  @@index([requestedBy])
  @@index([status])
  @@index([organizationId])
  @@map("sta_procurement_requisitions")
}

model ProcurementOrder {
  id                   String         @id @default(uuid()) @db.Uuid
  poNumber             String         @unique @map("po_number") @db.VarChar(30)
  requisitionId        String         @map("requisition_id") @db.Uuid
  vendorId             String         @map("vendor_id") @db.Uuid
  preparedBy           BigInt         @map("prepared_by")
  organizationId       BigInt?        @map("organization_id")
  items                Json
  totalAmount          Decimal        @map("total_amount") @db.Decimal(15, 2)
  paymentPattern       PaymentPattern @default(post_delivery) @map("payment_pattern")
  milestones           Json?
  paymentTerms         String?        @map("payment_terms") @db.VarChar(100)
  deliveryDate         DateTime?      @map("delivery_date") @db.Date
  deliveryAddress      String?        @map("delivery_address")
  workflowInstanceId   String?        @map("workflow_instance_id") @db.Uuid
  status               PoStatus       @default(draft)
  vendorAcknowledgedAt DateTime?      @map("vendor_acknowledged_at")
  vendorAcknowledgeNote String?       @map("vendor_acknowledge_note")
  pdfFileId            String?        @map("pdf_file_id") @db.Uuid
  createdAt            DateTime       @default(now()) @map("created_at")
  updatedAt            DateTime       @updatedAt @map("updated_at")

  requisition  ProcurementRequisition @relation(fields: [requisitionId], references: [id])
  vendor       FinanceContact         @relation("ProcurementOrderVendor", fields: [vendorId], references: [id])
  preparer     Profile                @relation("PoCreatedBy", fields: [preparedBy], references: [id])
  organization Organization?          @relation(fields: [organizationId], references: [id])
  grns         ProcurementGRN[]

  @@index([requisitionId])
  @@index([vendorId])
  @@index([status])
  @@map("sta_procurement_orders")
}

model ProcurementGRN {
  id                  String    @id @default(uuid()) @db.Uuid
  grnNumber           String    @unique @map("grn_number") @db.VarChar(30)
  poId                String    @map("po_id") @db.Uuid
  raisedBy            BigInt    @map("raised_by")
  receivedDate        DateTime  @map("received_date") @db.Date
  items               Json
  overallCondition    String    @default("satisfactory") @map("overall_condition") @db.VarChar(20)
  notes               String?
  confirmedByOfficer  Boolean   @default(false) @map("confirmed_by_officer")
  confirmedAt         DateTime? @map("confirmed_at")
  confirmedBy         BigInt?   @map("confirmed_by")
  status              GrnStatus @default(pending)
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")

  po      ProcurementOrder @relation(fields: [poId], references: [id])
  raiser  Profile          @relation("GrnRaisedBy", fields: [raisedBy], references: [id])
  officer Profile?         @relation("GrnConfirmedBy", fields: [confirmedBy], references: [id])

  @@index([poId])
  @@index([status])
  @@map("sta_procurement_grns")
}

model VendorPortalUser {
  id             String    @id @default(uuid()) @db.Uuid
  vendorId       String    @map("vendor_id") @db.Uuid
  email          String    @unique @db.VarChar(255)
  hashedPassword String?   @map("hashed_password")
  name           String    @db.VarChar(120)
  status         String    @default("active") @db.VarChar(20)
  lastLoginAt    DateTime? @map("last_login_at")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  vendor FinanceContact @relation("VendorPortalUsers", fields: [vendorId], references: [id])

  @@index([vendorId])
  @@map("sta_vendor_portal_users")
}
```

- [ ] **Step 3: Add back-relations to FinanceContact**

In the `FinanceContact` model, inside the relations block, add:
```prisma
  procurementOrders  ProcurementOrder[]  @relation("ProcurementOrderVendor")
  vendorPortalUsers  VendorPortalUser[]  @relation("VendorPortalUsers")
```

- [ ] **Step 4: Add back-relations to Profile**

In the `Profile` model, add:
```prisma
  procurementRequisitions ProcurementRequisition[] @relation("PrRequestedBy")
  procurementOrders       ProcurementOrder[]       @relation("PoCreatedBy")
  grnRaised               ProcurementGRN[]         @relation("GrnRaisedBy")
  grnConfirmed            ProcurementGRN[]         @relation("GrnConfirmedBy")
```

- [ ] **Step 5: Run migration**

```bash
cd api && npx prisma migrate dev --name add_procurement_models
```

Expected: `The following migration(s) have been created and applied: .../add_procurement_models`

- [ ] **Step 6: Verify generated client**

```bash
cd api && npx prisma generate
```

Expected: `Generated Prisma Client`

- [ ] **Step 7: Commit**

```bash
git add api/prisma/schema.prisma api/prisma/migrations/
git commit -m "feat(procurement): add procurement schema models"
```

---

## Task 2: WorkflowService — Add `startForEntity`

**Files:**
- Modify: `api/src/modules/workflow/workflow.service.ts`

**Interfaces:**
- Produces: `WorkflowService.startForEntity(params: StartForEntityParams): Promise<{ instanceId: string | null; workflowStatus: 'pending' | 'none' }>`
- Consumes: existing `extractApprovalSteps`, `normalizeStepsForLeave`, `normalizeWorkflowStepApprover`, `getWorkflowApproverLabel`

- [ ] **Step 1: Write failing test**

```typescript
// api/src/modules/procurement/__tests__/workflow-entity.spec.ts
import { WorkflowService } from '../../workflow/workflow.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

describe('WorkflowService.startForEntity', () => {
  let service: WorkflowService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(() => {
    prisma = { $transaction: jest.fn(), workflow: { create: jest.fn() }, workflowStep: { create: jest.fn() }, workflowInstance: { create: jest.fn() } } as any;
    service = new WorkflowService(prisma as any);
  });

  it('returns none when approvalFlowJson has no steps', async () => {
    const result = await service.startForEntity({
      entityId: 'abc-123',
      entityType: 'procurement_order',
      approvalFlowJson: { steps: [] },
      initiatedBy: '1',
    });
    expect(result.workflowStatus).toBe('none');
    expect(result.instanceId).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd api && npx jest workflow-entity.spec --no-coverage 2>&1 | tail -10
```

Expected: `TypeError: service.startForEntity is not a function`

- [ ] **Step 3: Add `startForEntity` to WorkflowService**

In `api/src/modules/workflow/workflow.service.ts`, add this method after `startForRequest`:

```typescript
async startForEntity(params: {
  entityId: string;
  entityType: string;
  approvalFlowJson: any;
  initiatedBy: string;
  amount?: number | null;
  name?: string;
}) {
  const baseSteps = this.extractApprovalSteps(params.approvalFlowJson, params.amount ?? undefined);
  if (baseSteps.length === 0) {
    return { instanceId: null, workflowStatus: 'none' as const };
  }

  return this.prisma.$transaction(async (tx) => {
    const workflow = await tx.workflow.create({
      data: {
        name: params.name ?? `${params.entityType} workflow`,
        entityType: params.entityType,
        isActive: true,
        createdBy: toBigInt(params.initiatedBy),
        updatedBy: toBigInt(params.initiatedBy),
        config: {},
      },
    });

    const workflowSteps = await Promise.all(
      baseSteps.map((step, index) => {
        const approver = normalizeWorkflowStepApprover(step);
        return tx.workflowStep.create({
          data: {
            workflowId: workflow.id,
            name: getWorkflowApproverLabel(approver.approverType, approver.approverId) || `Step ${index + 1}`,
            stepType: 'approval',
            order: index + 1,
            isInitial: index === 0,
            isFinal: index === baseSteps.length - 1,
            config: step,
            createdBy: toBigInt(params.initiatedBy),
            updatedBy: toBigInt(params.initiatedBy),
          },
        });
      }),
    );

    const instance = await tx.workflowInstance.create({
      data: {
        workflowId: workflow.id,
        entityType: params.entityType,
        entityId: params.entityId,
        currentStepId: workflowSteps[0].id,
        status: 'pending',
        initiatedBy: toBigInt(params.initiatedBy),
      },
    });

    return { instanceId: instance.id, workflowStatus: 'pending' as const };
  });
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
cd api && npx jest workflow-entity.spec --no-coverage 2>&1 | tail -10
```

Expected: `Tests: 1 passed`

- [ ] **Step 5: Commit**

```bash
git add api/src/modules/workflow/workflow.service.ts api/src/modules/procurement/__tests__/workflow-entity.spec.ts
git commit -m "feat(workflow): add generic startForEntity method"
```

---

## Task 3: Procurement Module Scaffold

**Files:**
- Create: `api/src/modules/procurement/procurement.module.ts`
- Create: `api/src/modules/procurement/procurement.service.ts`
- Create: `api/src/modules/procurement/procurement.controller.ts`
- Create: `api/src/modules/procurement/vendor-portal.service.ts`
- Create: `api/src/modules/procurement/vendor-portal.controller.ts`
- Modify: `api/src/app.module.ts`

**Interfaces:**
- Produces: `ProcurementModule` importable in `AppModule`

- [ ] **Step 1: Create DTOs**

`api/src/modules/procurement/dto/create-pr.dto.ts`:
```typescript
export class PrItemDto {
  description: string;
  qty: number;
  unit: string;
  estimatedUnitCost: number;
}

export class CreatePrDto {
  title: string;
  category: 'goods' | 'services' | 'works';
  paymentPattern: 'post_delivery' | 'pre_payment' | 'milestone';
  items: PrItemDto[];
  justification?: string;
  budgetLineId?: string;
  teamId?: string;
}
```

`api/src/modules/procurement/dto/action-pr.dto.ts`:
```typescript
export class ActionPrDto {
  comment?: string;
}
```

`api/src/modules/procurement/dto/create-po.dto.ts`:
```typescript
export class PoItemDto {
  description: string;
  qty: number;
  unit: string;
  unitCost: number;
}

export class MilestoneDto {
  seq: number;
  description: string;
  percentage: number;
  amount: number;
  trigger: 'po_approved' | 'grn_confirmed' | 'manual_signoff';
}

export class CreatePoDto {
  requisitionId: string;
  vendorId: string;
  items: PoItemDto[];
  paymentPattern: 'post_delivery' | 'pre_payment' | 'milestone';
  milestones?: MilestoneDto[];
  paymentTerms?: string;
  deliveryDate?: string;
  deliveryAddress?: string;
  approvalFlowJson: any;
}
```

`api/src/modules/procurement/dto/action-po.dto.ts`:
```typescript
export class ActionPoDto {
  comment?: string;
}
```

`api/src/modules/procurement/dto/create-grn.dto.ts`:
```typescript
export class GrnItemDto {
  description: string;
  qtyOrdered: number;
  qtyReceived: number;
  condition: string;
  notes?: string;
}

export class CreateGrnDto {
  poId: string;
  receivedDate: string;
  items: GrnItemDto[];
  overallCondition: 'satisfactory' | 'partial' | 'rejected';
  notes?: string;
}
```

`api/src/modules/procurement/dto/confirm-grn.dto.ts`:
```typescript
export class ConfirmGrnDto {
  status: 'confirmed' | 'disputed';
  comment?: string;
}
```

`api/src/modules/procurement/dto/vendor-login.dto.ts`:
```typescript
export class VendorLoginDto {
  email: string;
  password: string;
}

export class VendorAcknowledgeDto {
  note?: string;
}
```

- [ ] **Step 2: Create service skeleton**

`api/src/modules/procurement/procurement.service.ts`:
```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WorkflowService } from '../workflow/workflow.service';
import { NotificationsService } from '../notifications/notifications.service';
import { toBigInt } from '../../common/utils/ids';
import { CreatePrDto } from './dto/create-pr.dto';
import { CreatePoDto } from './dto/create-po.dto';
import { CreateGrnDto } from './dto/create-grn.dto';
import { ConfirmGrnDto } from './dto/confirm-grn.dto';

@Injectable()
export class ProcurementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workflowService: WorkflowService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async nextNumber(prefix: 'PR' | 'PO' | 'GRN'): Promise<string> {
    const year = new Date().getFullYear();
    const modelMap = { PR: 'procurementRequisition', PO: 'procurementOrder', GRN: 'procurementGRN' } as const;
    const count = await (this.prisma[modelMap[prefix]] as any).count();
    return `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  // Stubs — implemented in Tasks 4-8
  async createPr(userId: string, dto: CreatePrDto) { return {}; }
  async submitPr(id: string, userId: string) { return {}; }
  async approvePr(id: string, userId: string, comment?: string) { return {}; }
  async rejectPr(id: string, userId: string, comment?: string) { return {}; }
  async listPrs(userId: string, role: string) { return []; }
  async getPr(id: string) { return {}; }
  async createPo(userId: string, dto: CreatePoDto) { return {}; }
  async approvePo(id: string, userId: string, comment?: string) { return {}; }
  async rejectPo(id: string, userId: string, comment?: string) { return {}; }
  async listPos(userId: string) { return []; }
  async getPo(id: string) { return {}; }
  async createGrn(userId: string, dto: CreateGrnDto) { return {}; }
  async confirmGrn(id: string, userId: string, dto: ConfirmGrnDto) { return {}; }
}
```

- [ ] **Step 3: Create vendor portal service skeleton**

`api/src/modules/procurement/vendor-portal.service.ts`:
```typescript
import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { VendorLoginDto, VendorAcknowledgeDto } from './dto/vendor-login.dto';

@Injectable()
export class VendorPortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: VendorLoginDto) {
    const user = await this.prisma.vendorPortalUser.findUnique({ where: { email: dto.email } });
    if (!user || !user.hashedPassword) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(dto.password, user.hashedPassword);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    await this.prisma.vendorPortalUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const token = this.jwtService.sign(
      { sub: user.id, vendorId: user.vendorId, aud: 'vendor-portal' },
      { expiresIn: '8h' },
    );
    return { token, name: user.name, vendorId: user.vendorId };
  }

  async listOrders(vendorId: string) {
    return this.prisma.procurementOrder.findMany({
      where: { vendorId, status: { not: 'draft' } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrder(id: string, vendorId: string) {
    const po = await this.prisma.procurementOrder.findFirst({ where: { id, vendorId } });
    if (!po) throw new NotFoundException('Order not found');
    return po;
  }

  async acknowledge(id: string, vendorId: string, dto: VendorAcknowledgeDto) {
    const po = await this.getOrder(id, vendorId);
    if (po.vendorAcknowledgedAt) throw new UnauthorizedException('Already acknowledged');
    return this.prisma.procurementOrder.update({
      where: { id },
      data: { vendorAcknowledgedAt: new Date(), vendorAcknowledgeNote: dto.note ?? null, status: 'acknowledged' },
    });
  }
}
```

- [ ] **Step 4: Create controller skeletons**

`api/src/modules/procurement/procurement.controller.ts`:
```typescript
import { Controller, Post, Get, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ProcurementService } from './procurement.service';
import { CreatePrDto } from './dto/create-pr.dto';
import { ActionPrDto } from './dto/action-pr.dto';
import { CreatePoDto } from './dto/create-po.dto';
import { ActionPoDto } from './dto/action-po.dto';
import { CreateGrnDto } from './dto/create-grn.dto';
import { ConfirmGrnDto } from './dto/confirm-grn.dto';

@Controller('procurement')
export class ProcurementController {
  constructor(private readonly service: ProcurementService) {}

  @Post('requisitions') createPr(@Req() req: any, @Body() dto: CreatePrDto) { return this.service.createPr(req.user.id, dto); }
  @Post('requisitions/:id/submit') submitPr(@Param('id') id: string, @Req() req: any) { return this.service.submitPr(id, req.user.id); }
  @Post('requisitions/:id/approve') approvePr(@Param('id') id: string, @Req() req: any, @Body() dto: ActionPrDto) { return this.service.approvePr(id, req.user.id, dto.comment); }
  @Post('requisitions/:id/reject') rejectPr(@Param('id') id: string, @Req() req: any, @Body() dto: ActionPrDto) { return this.service.rejectPr(id, req.user.id, dto.comment); }
  @Get('requisitions') listPrs(@Req() req: any) { return this.service.listPrs(req.user.id, req.user.role); }
  @Get('requisitions/:id') getPr(@Param('id') id: string) { return this.service.getPr(id); }

  @Post('orders') createPo(@Req() req: any, @Body() dto: CreatePoDto) { return this.service.createPo(req.user.id, dto); }
  @Post('orders/:id/approve') approvePo(@Param('id') id: string, @Req() req: any, @Body() dto: ActionPoDto) { return this.service.approvePo(id, req.user.id, dto.comment); }
  @Post('orders/:id/reject') rejectPo(@Param('id') id: string, @Req() req: any, @Body() dto: ActionPoDto) { return this.service.rejectPo(id, req.user.id, dto.comment); }
  @Get('orders') listPos(@Req() req: any) { return this.service.listPos(req.user.id); }
  @Get('orders/:id') getPo(@Param('id') id: string) { return this.service.getPo(id); }

  @Post('grns') createGrn(@Req() req: any, @Body() dto: CreateGrnDto) { return this.service.createGrn(req.user.id, dto); }
  @Post('grns/:id/confirm') confirmGrn(@Param('id') id: string, @Req() req: any, @Body() dto: ConfirmGrnDto) { return this.service.confirmGrn(id, req.user.id, dto); }
}
```

`api/src/modules/procurement/vendor-portal.controller.ts`:
```typescript
import { Controller, Post, Get, Param, Body, Req } from '@nestjs/common';
import { VendorPortalService } from './vendor-portal.service';
import { VendorLoginDto, VendorAcknowledgeDto } from './dto/vendor-login.dto';

@Controller('vendor-portal')
export class VendorPortalController {
  constructor(private readonly service: VendorPortalService) {}

  @Post('login') login(@Body() dto: VendorLoginDto) { return this.service.login(dto); }
  @Get('orders') listOrders(@Req() req: any) { return this.service.listOrders(req.vendor.vendorId); }
  @Get('orders/:id') getOrder(@Param('id') id: string, @Req() req: any) { return this.service.getOrder(id, req.vendor.vendorId); }
  @Post('orders/:id/acknowledge') acknowledge(@Param('id') id: string, @Req() req: any, @Body() dto: VendorAcknowledgeDto) { return this.service.acknowledge(id, req.vendor.vendorId, dto); }
}
```

- [ ] **Step 5: Create module**

`api/src/modules/procurement/procurement.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ProcurementController } from './procurement.controller';
import { ProcurementService } from './procurement.service';
import { VendorPortalController } from './vendor-portal.controller';
import { VendorPortalService } from './vendor-portal.service';
import { WorkflowModule } from '../workflow/workflow.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../../common/mail/mail.module';
import { PdfModule } from '../../common/pdf/pdf.module';

@Module({
  imports: [
    WorkflowModule,
    NotificationsModule,
    MailModule,
    PdfModule,
    JwtModule.register({ secret: process.env.JWT_SECRET }),
  ],
  controllers: [ProcurementController, VendorPortalController],
  providers: [ProcurementService, VendorPortalService],
})
export class ProcurementModule {}
```

- [ ] **Step 6: Register in AppModule**

In `api/src/app.module.ts`, add:
```typescript
import { ProcurementModule } from './modules/procurement/procurement.module';
// Add to @Module imports array:
ProcurementModule,
```

- [ ] **Step 7: Verify compilation**

```bash
cd api && npx tsc --noEmit 2>&1 | head -30
```

Expected: No errors (stubs return `{}` so types are loose)

- [ ] **Step 8: Commit**

```bash
git add api/src/modules/procurement/ api/src/app.module.ts
git commit -m "feat(procurement): scaffold module, controllers, service stubs"
```

---

## Task 4: Purchase Requisition — Service Implementation

**Files:**
- Modify: `api/src/modules/procurement/procurement.service.ts`
- Create: `api/src/modules/procurement/__tests__/procurement.service.spec.ts`

**Interfaces:**
- Consumes: `PrismaService.procurementRequisition`, `WorkflowService.startForEntity`
- Produces: `createPr()`, `submitPr()`, `listPrs()`, `getPr()` fully implemented

- [ ] **Step 1: Write failing tests**

`api/src/modules/procurement/__tests__/procurement.service.spec.ts`:
```typescript
import { ProcurementService } from '../procurement.service';

describe('ProcurementService', () => {
  let service: ProcurementService;
  let prisma: any;
  let workflowService: any;

  beforeEach(() => {
    prisma = {
      procurementRequisition: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    workflowService = { startForEntity: jest.fn().mockResolvedValue({ instanceId: 'wf-1', workflowStatus: 'pending' }) };
    service = new ProcurementService(prisma, workflowService, {} as any);
  });

  it('createPr generates a requisition number', async () => {
    prisma.procurementRequisition.create.mockResolvedValue({ id: 'pr-1', requisitionNumber: 'PR-2026-0001' });
    const dto = { title: 'Laptops', category: 'goods' as const, paymentPattern: 'post_delivery' as const, items: [{ description: 'Laptop', qty: 2, unit: 'unit', estimatedUnitCost: 500000 }] };
    const result = await service.createPr('user-1', dto);
    expect(prisma.procurementRequisition.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ title: 'Laptops' }) })
    );
    expect(result).toHaveProperty('id');
  });

  it('listPrs returns all records', async () => {
    prisma.procurementRequisition.findMany.mockResolvedValue([{ id: 'pr-1' }]);
    const result = await service.listPrs('user-1', 'staff');
    expect(result).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run tests — confirm failure**

```bash
cd api && npx jest procurement.service.spec --no-coverage 2>&1 | tail -15
```

Expected: tests fail because stub returns `{}`

- [ ] **Step 3: Implement `createPr`, `submitPr`, `listPrs`, `getPr`**

Replace the stub methods in `procurement.service.ts`:

```typescript
async createPr(userId: string, dto: CreatePrDto) {
  const number = await this.nextNumber('PR');
  const estimatedTotal = dto.items.reduce((sum, i) => sum + i.qty * i.estimatedUnitCost, 0);
  return this.prisma.procurementRequisition.create({
    data: {
      requisitionNumber: number,
      title: dto.title,
      category: dto.category,
      paymentPattern: dto.paymentPattern,
      items: dto.items as any,
      estimatedTotal,
      justification: dto.justification,
      budgetLineId: dto.budgetLineId,
      teamId: dto.teamId ? toBigInt(dto.teamId) : null,
      requestedBy: toBigInt(userId),
      status: 'draft',
    },
  });
}

async submitPr(id: string, userId: string) {
  const pr = await this.prisma.procurementRequisition.findUnique({ where: { id } });
  if (!pr) throw new NotFoundException('Requisition not found');
  if (pr.status !== 'draft') throw new BadRequestException('Only draft requisitions can be submitted');

  const approvalFlowJson = { steps: [{ approverType: 'hod' }, { approverType: 'procurement_officer' }] };
  const { instanceId } = await this.workflowService.startForEntity({
    entityId: id,
    entityType: 'procurement_requisition',
    approvalFlowJson,
    initiatedBy: userId,
    amount: Number(pr.estimatedTotal),
    name: `${pr.requisitionNumber} Approval`,
  });

  return this.prisma.procurementRequisition.update({
    where: { id },
    data: { status: 'submitted', workflowInstanceId: instanceId },
  });
}

async approvePr(id: string, userId: string, comment?: string) {
  const pr = await this.prisma.procurementRequisition.findUnique({ where: { id } });
  if (!pr) throw new NotFoundException('Requisition not found');
  return this.prisma.procurementRequisition.update({
    where: { id },
    data: { status: 'approved' },
  });
}

async rejectPr(id: string, userId: string, comment?: string) {
  const pr = await this.prisma.procurementRequisition.findUnique({ where: { id } });
  if (!pr) throw new NotFoundException('Requisition not found');
  return this.prisma.procurementRequisition.update({
    where: { id },
    data: { status: 'rejected' },
  });
}

async listPrs(userId: string, role: string) {
  const where = role === 'procurement_officer' || role === 'admin' ? {} : { requestedBy: toBigInt(userId) };
  return this.prisma.procurementRequisition.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { requester: { select: { id: true, firstName: true, lastName: true } } },
  });
}

async getPr(id: string) {
  const pr = await this.prisma.procurementRequisition.findUnique({
    where: { id },
    include: { requester: { select: { id: true, firstName: true, lastName: true } }, purchaseOrders: true },
  });
  if (!pr) throw new NotFoundException('Requisition not found');
  return pr;
}
```

- [ ] **Step 4: Run tests — confirm pass**

```bash
cd api && npx jest procurement.service.spec --no-coverage 2>&1 | tail -10
```

Expected: `Tests: 2 passed`

- [ ] **Step 5: Commit**

```bash
git add api/src/modules/procurement/procurement.service.ts api/src/modules/procurement/__tests__/
git commit -m "feat(procurement): implement purchase requisition service methods"
```

---

## Task 5: Purchase Order — Service Implementation

**Files:**
- Modify: `api/src/modules/procurement/procurement.service.ts`

**Interfaces:**
- Consumes: `PrismaService.procurementOrder`, `WorkflowService.startForEntity`, `MailService`
- Produces: `createPo()`, `approvePo()`, `rejectPo()`, `listPos()`, `getPo()` implemented

- [ ] **Step 1: Add MailService injection to ProcurementService constructor**

Modify the constructor in `procurement.service.ts`:
```typescript
import { MailService } from '../../common/mail/mail.service';

constructor(
  private readonly prisma: PrismaService,
  private readonly workflowService: WorkflowService,
  private readonly notificationsService: NotificationsService,
  private readonly mailService: MailService,
) {}
```

- [ ] **Step 2: Implement PO methods**

Replace stubs in `procurement.service.ts`:

```typescript
async createPo(userId: string, dto: CreatePoDto) {
  const pr = await this.prisma.procurementRequisition.findUnique({ where: { id: dto.requisitionId } });
  if (!pr) throw new NotFoundException('Requisition not found');
  if (pr.status !== 'approved') throw new BadRequestException('Requisition must be approved before creating a PO');

  const number = await this.nextNumber('PO');
  const totalAmount = dto.items.reduce((sum, i) => sum + i.qty * i.unitCost, 0);

  const po = await this.prisma.procurementOrder.create({
    data: {
      poNumber: number,
      requisitionId: dto.requisitionId,
      vendorId: dto.vendorId,
      preparedBy: toBigInt(userId),
      items: dto.items as any,
      totalAmount,
      paymentPattern: dto.paymentPattern,
      milestones: dto.milestones as any ?? null,
      paymentTerms: dto.paymentTerms,
      deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : null,
      deliveryAddress: dto.deliveryAddress,
      status: 'draft',
    },
  });

  // Start approval workflow
  const { instanceId } = await this.workflowService.startForEntity({
    entityId: po.id,
    entityType: 'procurement_order',
    approvalFlowJson: dto.approvalFlowJson,
    initiatedBy: userId,
    amount: totalAmount,
    name: `${number} Approval`,
  });

  return this.prisma.procurementOrder.update({
    where: { id: po.id },
    data: { status: 'pending_approval', workflowInstanceId: instanceId },
  });
}

async approvePo(id: string, userId: string, comment?: string) {
  const po = await this.prisma.procurementOrder.findUnique({
    where: { id },
    include: { vendor: { include: { contactPersons: true } }, requisition: true },
  });
  if (!po) throw new NotFoundException('Order not found');

  const updated = await this.prisma.procurementOrder.update({
    where: { id },
    data: { status: 'approved' },
  });

  // Email vendor if primary contact has email
  const primaryContact = po.vendor.contactPersons.find(p => p.isPrimary) ?? po.vendor.contactPersons[0];
  const vendorEmail = primaryContact?.email ?? po.vendor.email;
  if (vendorEmail) {
    await this.mailService.send({
      to: vendorEmail,
      subject: `Purchase Order ${po.poNumber} from Stanforte Edge`,
      text: `Dear ${primaryContact?.firstName ?? po.vendor.name},\n\nPlease find attached Purchase Order ${po.poNumber}.\n\nView and acknowledge at: ${process.env.APP_URL}/vendor-portal`,
    });
  }

  // Update requisition status
  await this.prisma.procurementRequisition.update({
    where: { id: po.requisitionId },
    data: { status: 'converted_to_po' },
  });

  return updated;
}

async rejectPo(id: string, userId: string, comment?: string) {
  const po = await this.prisma.procurementOrder.findUnique({ where: { id } });
  if (!po) throw new NotFoundException('Order not found');
  return this.prisma.procurementOrder.update({ where: { id }, data: { status: 'cancelled' } });
}

async listPos(userId: string) {
  return this.prisma.procurementOrder.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      vendor: { select: { id: true, name: true } },
      requisition: { select: { id: true, requisitionNumber: true, title: true } },
    },
  });
}

async getPo(id: string) {
  const po = await this.prisma.procurementOrder.findUnique({
    where: { id },
    include: {
      vendor: true,
      requisition: true,
      preparer: { select: { id: true, firstName: true, lastName: true } },
      grns: true,
    },
  });
  if (!po) throw new NotFoundException('Order not found');
  return po;
}
```

- [ ] **Step 3: Verify compilation**

```bash
cd api && npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add api/src/modules/procurement/procurement.service.ts
git commit -m "feat(procurement): implement purchase order service methods"
```

---

## Task 6: GRN Service + Payment Trigger

**Files:**
- Modify: `api/src/modules/procurement/procurement.service.ts`

**Interfaces:**
- Produces: `createGrn()`, `confirmGrn()` implemented; on GRN confirmation, PO status updates and notification fires

- [ ] **Step 1: Implement GRN methods**

Replace stubs in `procurement.service.ts`:

```typescript
async createGrn(userId: string, dto: CreateGrnDto) {
  const po = await this.prisma.procurementOrder.findUnique({ where: { id: dto.poId } });
  if (!po) throw new NotFoundException('Order not found');
  if (!['approved', 'sent', 'acknowledged'].includes(po.status)) {
    throw new BadRequestException('GRN can only be raised for approved/sent/acknowledged orders');
  }

  const number = await this.nextNumber('GRN');
  return this.prisma.procurementGRN.create({
    data: {
      grnNumber: number,
      poId: dto.poId,
      raisedBy: toBigInt(userId),
      receivedDate: new Date(dto.receivedDate),
      items: dto.items as any,
      overallCondition: dto.overallCondition,
      notes: dto.notes,
      status: 'pending',
    },
  });
}

async confirmGrn(id: string, userId: string, dto: ConfirmGrnDto) {
  const grn = await this.prisma.procurementGRN.findUnique({ where: { id }, include: { po: true } });
  if (!grn) throw new NotFoundException('GRN not found');

  const updatedGrn = await this.prisma.procurementGRN.update({
    where: { id },
    data: {
      status: dto.status,
      confirmedByOfficer: true,
      confirmedAt: new Date(),
      confirmedBy: toBigInt(userId),
    },
  });

  if (dto.status === 'confirmed') {
    // Mark PO as received
    await this.prisma.procurementOrder.update({
      where: { id: grn.poId },
      data: { status: 'received' },
    });

    // Notify finance that PV can be raised
    await this.notificationsService.send({
      type: 'procurement_ready_for_payment',
      title: `PO ${grn.po.poNumber} ready for payment`,
      body: `GRN confirmed. Raise a Payment Voucher for ${grn.po.poNumber}.`,
      metadata: { poId: grn.poId, grnId: id },
    });
  }

  return updatedGrn;
}
```

- [ ] **Step 2: Test GRN confirm triggers notification**

Add to `procurement.service.spec.ts`:
```typescript
it('confirmGrn sends payment notification when confirmed', async () => {
  const mockNotify = jest.fn();
  const svc = new ProcurementService(
    {
      procurementGRN: {
        findUnique: jest.fn().mockResolvedValue({ id: 'grn-1', poId: 'po-1', po: { poNumber: 'PO-2026-0001' } }),
        update: jest.fn().mockResolvedValue({ id: 'grn-1', status: 'confirmed' }),
        count: jest.fn().mockResolvedValue(0),
      },
      procurementOrder: { update: jest.fn() },
      procurementRequisition: { count: jest.fn().mockResolvedValue(0) },
    } as any,
    workflowService,
    { send: mockNotify } as any,
    {} as any,
  );
  await svc.confirmGrn('grn-1', 'user-1', { status: 'confirmed' });
  expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({ type: 'procurement_ready_for_payment' }));
});
```

- [ ] **Step 3: Run tests**

```bash
cd api && npx jest procurement.service.spec --no-coverage 2>&1 | tail -10
```

Expected: `Tests: 3 passed`

- [ ] **Step 4: Commit**

```bash
git add api/src/modules/procurement/procurement.service.ts api/src/modules/procurement/__tests__/
git commit -m "feat(procurement): implement GRN service with payment trigger notification"
```

---

## Task 7: PO PDF Document

**Files:**
- Create: `api/src/modules/procurement/documents/purchase-order.document.ts`

**Interfaces:**
- Produces: `PurchaseOrderDocument implements Document<PurchaseOrderContext>`
- Consumes: `DocumentGeneratorService` pattern from `api/src/common/documents/`

- [ ] **Step 1: Read existing document pattern**

Read `api/src/modules/requests/documents/payment-voucher.document.ts` lines 1-50 to understand the `Document<T>` interface and `buildPdf()` return shape.

- [ ] **Step 2: Create PurchaseOrderDocument**

`api/src/modules/procurement/documents/purchase-order.document.ts`:
```typescript
import { Document } from '../../../common/documents/document.types';

export type PoLineItem = {
  description: string;
  qty: number;
  unit: string;
  unitCost: number;
  totalCost: number;
};

export type PurchaseOrderContext = {
  poNumber: string;
  date: string;
  vendor: { name: string; address?: string; email?: string };
  preparedBy: string;
  deliveryAddress?: string;
  deliveryDate?: string;
  paymentTerms?: string;
  paymentPattern: string;
  items: PoLineItem[];
  totalAmount: number;
  currency: string;
  orgName: string;
  orgAddress?: string;
};

export class PurchaseOrderDocument implements Document<PurchaseOrderContext> {
  getTitle(ctx: PurchaseOrderContext): string {
    return `Purchase Order — ${ctx.poNumber}`;
  }

  buildHtml(ctx: PurchaseOrderContext): string {
    const rows = ctx.items.map(i => `
      <tr>
        <td>${i.description}</td>
        <td style="text-align:center">${i.qty}</td>
        <td style="text-align:center">${i.unit}</td>
        <td style="text-align:right">${ctx.currency} ${i.unitCost.toLocaleString()}</td>
        <td style="text-align:right">${ctx.currency} ${i.totalCost.toLocaleString()}</td>
      </tr>`).join('');

    return `<!DOCTYPE html><html><head><style>
      body { font-family: Arial, sans-serif; font-size: 12px; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      th, td { border: 1px solid #ccc; padding: 6px 10px; }
      th { background: #f5f5f5; }
      .header { display: flex; justify-content: space-between; margin-bottom: 24px; }
      .label { color: #666; font-size: 11px; }
      .total { font-weight: bold; text-align: right; margin-top: 8px; }
    </style></head><body>
      <div class="header">
        <div><strong>${ctx.orgName}</strong><br/>${ctx.orgAddress ?? ''}</div>
        <div style="text-align:right">
          <h2 style="margin:0">PURCHASE ORDER</h2>
          <div>${ctx.poNumber}</div>
          <div class="label">Date: ${ctx.date}</div>
        </div>
      </div>
      <div style="margin-bottom:16px">
        <div class="label">VENDOR</div>
        <div><strong>${ctx.vendor.name}</strong></div>
        ${ctx.vendor.address ? `<div>${ctx.vendor.address}</div>` : ''}
        ${ctx.vendor.email ? `<div>${ctx.vendor.email}</div>` : ''}
      </div>
      <div style="display:flex;gap:40px;margin-bottom:16px">
        <div><span class="label">Delivery Address</span><br/>${ctx.deliveryAddress ?? '—'}</div>
        <div><span class="label">Expected Delivery</span><br/>${ctx.deliveryDate ?? '—'}</div>
        <div><span class="label">Payment Terms</span><br/>${ctx.paymentTerms ?? '—'}</div>
        <div><span class="label">Payment Pattern</span><br/>${ctx.paymentPattern}</div>
      </div>
      <table>
        <thead><tr><th>Description</th><th>Qty</th><th>Unit</th><th>Unit Cost</th><th>Total</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="total">Total: ${ctx.currency} ${ctx.totalAmount.toLocaleString()}</div>
      <div style="margin-top:40px">
        <div class="label">Prepared by</div>
        <div>${ctx.preparedBy}</div>
      </div>
    </body></html>`;
  }
}
```

- [ ] **Step 3: Register document in DocumentGeneratorService**

Check how `PaymentVoucherDocument` is registered in `document-generator.service.ts` and follow the same pattern to register `PurchaseOrderDocument` with key `'purchase_order'`.

- [ ] **Step 4: Commit**

```bash
git add api/src/modules/procurement/documents/
git commit -m "feat(procurement): add Purchase Order PDF document"
```

---

## Task 8: Vendor Portal Auth Guard

**Files:**
- Create: `api/src/modules/procurement/guards/vendor-jwt.guard.ts`
- Modify: `api/src/modules/procurement/vendor-portal.controller.ts`

**Interfaces:**
- Produces: `VendorJwtGuard` that validates `aud: vendor-portal` JWT and injects `req.vendor`

- [ ] **Step 1: Create guard**

`api/src/modules/procurement/guards/vendor-jwt.guard.ts`:
```typescript
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class VendorJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException();
    try {
      const payload = this.jwtService.verify(auth.slice(7));
      if (payload.aud !== 'vendor-portal') throw new UnauthorizedException('Invalid token audience');
      req.vendor = payload;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
```

- [ ] **Step 2: Apply guard to vendor portal routes**

In `vendor-portal.controller.ts`, protect authenticated routes:
```typescript
import { UseGuards } from '@nestjs/common';
import { VendorJwtGuard } from './guards/vendor-jwt.guard';

// Add @UseGuards(VendorJwtGuard) to listOrders, getOrder, acknowledge:
@UseGuards(VendorJwtGuard)
@Get('orders')
listOrders(@Req() req: any) { ... }

@UseGuards(VendorJwtGuard)
@Get('orders/:id')
getOrder(...) { ... }

@UseGuards(VendorJwtGuard)
@Post('orders/:id/acknowledge')
acknowledge(...) { ... }
```

- [ ] **Step 3: Write guard test**

`api/src/modules/procurement/__tests__/vendor-portal.service.spec.ts`:
```typescript
import { VendorPortalService } from '../vendor-portal.service';
import * as bcrypt from 'bcrypt';

describe('VendorPortalService', () => {
  let service: VendorPortalService;
  let prisma: any;
  let jwtService: any;

  beforeEach(() => {
    prisma = { vendorPortalUser: { findUnique: jest.fn(), update: jest.fn() } };
    jwtService = { sign: jest.fn().mockReturnValue('jwt-token') };
    service = new VendorPortalService(prisma, jwtService);
  });

  it('login returns token for valid credentials', async () => {
    const hashed = await bcrypt.hash('password123', 10);
    prisma.vendorPortalUser.findUnique.mockResolvedValue({ id: 'u1', email: 'v@test.com', hashedPassword: hashed, vendorId: 'v1', name: 'Vendor' });
    prisma.vendorPortalUser.update.mockResolvedValue({});
    const result = await service.login({ email: 'v@test.com', password: 'password123' });
    expect(result.token).toBe('jwt-token');
    expect(result.vendorId).toBe('v1');
  });

  it('login throws for wrong password', async () => {
    const hashed = await bcrypt.hash('correct', 10);
    prisma.vendorPortalUser.findUnique.mockResolvedValue({ id: 'u1', hashedPassword: hashed, vendorId: 'v1', name: 'V' });
    await expect(service.login({ email: 'v@test.com', password: 'wrong' })).rejects.toThrow('Invalid credentials');
  });
});
```

- [ ] **Step 4: Run tests**

```bash
cd api && npx jest vendor-portal.service.spec --no-coverage 2>&1 | tail -10
```

Expected: `Tests: 2 passed`

- [ ] **Step 5: Commit**

```bash
git add api/src/modules/procurement/guards/ api/src/modules/procurement/vendor-portal.controller.ts api/src/modules/procurement/__tests__/vendor-portal.service.spec.ts
git commit -m "feat(procurement): add vendor portal JWT guard and auth tests"
```

---

## Task 9: Frontend — Shared API Client

**Files:**
- Create: `apps/shared/src/api/procurement-api.ts`

**Interfaces:**
- Produces: typed API functions for all procurement endpoints; consumed by PWA pages

- [ ] **Step 1: Create API client**

`apps/shared/src/api/procurement-api.ts`:
```typescript
import type { HttpRequest } from '../auth/http-client';

export type PrItem = { description: string; qty: number; unit: string; estimatedUnitCost: number };
export type PoItem = { description: string; qty: number; unit: string; unitCost: number; totalCost: number };
export type Milestone = { seq: number; description: string; percentage: number; amount: number; trigger: string; status: string };
export type GrnItem = { description: string; qtyOrdered: number; qtyReceived: number; condition: string; notes?: string };

export type PurchaseRequisitionRecord = {
  id: string;
  requisitionNumber: string;
  title: string;
  category: 'goods' | 'services' | 'works';
  paymentPattern: 'post_delivery' | 'pre_payment' | 'milestone';
  status: string;
  estimatedTotal: number;
  items: PrItem[];
  justification?: string;
  createdAt: string;
  requester?: { id: string; firstName?: string; lastName?: string };
};

export type PurchaseOrderRecord = {
  id: string;
  poNumber: string;
  status: string;
  paymentPattern: string;
  totalAmount: number;
  milestones?: Milestone[];
  deliveryDate?: string;
  paymentTerms?: string;
  vendorAcknowledgedAt?: string;
  items: PoItem[];
  vendor?: { id: string; name: string };
  requisition?: { id: string; requisitionNumber: string; title: string };
  createdAt: string;
};

export type GrnRecord = {
  id: string;
  grnNumber: string;
  poId: string;
  status: string;
  overallCondition: string;
  receivedDate: string;
  items: GrnItem[];
  confirmedByOfficer: boolean;
};

function toQuery(params?: Record<string, unknown>) {
  const q = new URLSearchParams();
  if (!params) return '';
  Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') q.set(k, String(v)); });
  const s = q.toString();
  return s ? `?${s}` : '';
}

export function procurementApi(http: HttpRequest) {
  return {
    // Requisitions
    listPrs: () => http.get<PurchaseRequisitionRecord[]>('/procurement/requisitions'),
    getPr: (id: string) => http.get<PurchaseRequisitionRecord>(`/procurement/requisitions/${id}`),
    createPr: (data: Partial<PurchaseRequisitionRecord> & { items: PrItem[] }) => http.post('/procurement/requisitions', data),
    submitPr: (id: string) => http.post(`/procurement/requisitions/${id}/submit`, {}),
    approvePr: (id: string, comment?: string) => http.post(`/procurement/requisitions/${id}/approve`, { comment }),
    rejectPr: (id: string, comment?: string) => http.post(`/procurement/requisitions/${id}/reject`, { comment }),

    // Orders
    listPos: () => http.get<PurchaseOrderRecord[]>('/procurement/orders'),
    getPo: (id: string) => http.get<PurchaseOrderRecord>(`/procurement/orders/${id}`),
    createPo: (data: any) => http.post('/procurement/orders', data),
    approvePo: (id: string, comment?: string) => http.post(`/procurement/orders/${id}/approve`, { comment }),
    rejectPo: (id: string, comment?: string) => http.post(`/procurement/orders/${id}/reject`, { comment }),

    // GRN
    createGrn: (data: any) => http.post('/procurement/grns', data),
    confirmGrn: (id: string, status: 'confirmed' | 'disputed', comment?: string) =>
      http.post(`/procurement/grns/${id}/confirm`, { status, comment }),

    // Vendor portal (uses separate token)
    vendorLogin: (email: string, password: string) =>
      fetch('/api/vendor-portal/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) }).then(r => r.json()),
    vendorListOrders: (token: string) =>
      fetch('/api/vendor-portal/orders', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    vendorGetOrder: (token: string, id: string) =>
      fetch(`/api/vendor-portal/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    vendorAcknowledge: (token: string, id: string, note?: string) =>
      fetch(`/api/vendor-portal/orders/${id}/acknowledge`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ note }) }).then(r => r.json()),
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/shared/src/api/procurement-api.ts
git commit -m "feat(procurement): add shared API client types and functions"
```

---

## Task 10: Frontend — Staff PR Pages

**Files:**
- Create: `apps/pwa/src/pages/procurement/index.tsx`
- Create: `apps/pwa/src/pages/procurement/create.tsx`
- Create: `apps/pwa/src/pages/procurement/[id].tsx`

**Interfaces:**
- Consumes: `procurementApi` from `apps/shared/src/api/procurement-api.ts`
- Produces: PR list page, PR creation form, PR detail with thread

- [ ] **Step 1: Create PR list page**

`apps/pwa/src/pages/procurement/index.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { procurementApi } from '@shared/api/procurement-api';
import { useHttp } from '../../lib/http';

export default function ProcurementIndex() {
  const http = useHttp();
  const api = procurementApi(http);
  const [prs, setPrs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listPrs().then(setPrs).finally(() => setLoading(false));
  }, []);

  const statusColor: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    submitted: 'bg-blue-100 text-blue-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    converted_to_po: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Purchase Requisitions</h1>
        <Link to="/procurement/create" className="btn btn-primary">New Requisition</Link>
      </div>
      {loading ? <div>Loading...</div> : (
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr><th className="text-left py-2">Number</th><th>Title</th><th>Category</th><th>Amount</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {prs.map(pr => (
              <tr key={pr.id} className="border-b hover:bg-gray-50">
                <td className="py-2 font-mono text-xs">{pr.requisitionNumber}</td>
                <td>{pr.title}</td>
                <td className="capitalize">{pr.category}</td>
                <td>₦{Number(pr.estimatedTotal).toLocaleString()}</td>
                <td><span className={`px-2 py-0.5 rounded text-xs ${statusColor[pr.status] ?? ''}`}>{pr.status}</span></td>
                <td><Link to={`/procurement/${pr.id}`} className="text-blue-600 text-xs">View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create PR creation form**

`apps/pwa/src/pages/procurement/create.tsx`:
```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { procurementApi } from '@shared/api/procurement-api';
import { useHttp } from '../../lib/http';

const EMPTY_ITEM = { description: '', qty: 1, unit: 'unit', estimatedUnitCost: 0 };

export default function CreatePr() {
  const http = useHttp();
  const api = procurementApi(http);
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', category: 'goods', paymentPattern: 'post_delivery', justification: '' });
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [saving, setSaving] = useState(false);

  const total = items.reduce((s, i) => s + i.qty * i.estimatedUnitCost, 0);

  const updateItem = (idx: number, field: string, value: any) =>
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));

  const handleSubmit = async (andSubmit = false) => {
    setSaving(true);
    try {
      const pr = await api.createPr({ ...form, items } as any);
      if (andSubmit) await api.submitPr((pr as any).id);
      navigate(`/procurement/${(pr as any).id}`);
    } finally { setSaving(false); }
  };

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-semibold mb-4">New Purchase Requisition</h1>
      <div className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Title</label>
          <input className="input w-full" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Category</label>
            <select className="input w-full" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              <option value="goods">Goods</option>
              <option value="services">Services</option>
              <option value="works">Works</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Payment Pattern</label>
            <select className="input w-full" value={form.paymentPattern} onChange={e => setForm(f => ({ ...f, paymentPattern: e.target.value }))}>
              <option value="post_delivery">Post-Delivery</option>
              <option value="pre_payment">Pre-Payment</option>
              <option value="milestone">Milestone</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1">Justification</label>
          <textarea className="input w-full" rows={3} value={form.justification} onChange={e => setForm(f => ({ ...f, justification: e.target.value }))} />
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <span className="font-medium text-sm">Line Items</span>
            <button className="text-blue-600 text-xs" onClick={() => setItems(p => [...p, { ...EMPTY_ITEM }])}>+ Add Item</button>
          </div>
          {items.map((it, idx) => (
            <div key={idx} className="grid grid-cols-5 gap-2 mb-2">
              <input className="input col-span-2" placeholder="Description" value={it.description} onChange={e => updateItem(idx, 'description', e.target.value)} />
              <input className="input" type="number" placeholder="Qty" value={it.qty} onChange={e => updateItem(idx, 'qty', Number(e.target.value))} />
              <input className="input" placeholder="Unit" value={it.unit} onChange={e => updateItem(idx, 'unit', e.target.value)} />
              <input className="input" type="number" placeholder="Est. Unit Cost" value={it.estimatedUnitCost} onChange={e => updateItem(idx, 'estimatedUnitCost', Number(e.target.value))} />
            </div>
          ))}
          <div className="text-right text-sm font-medium">Total: ₦{total.toLocaleString()}</div>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-outline" onClick={() => handleSubmit(false)} disabled={saving}>Save Draft</button>
          <button className="btn btn-primary" onClick={() => handleSubmit(true)} disabled={saving}>Submit for Approval</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create PR detail page**

`apps/pwa/src/pages/procurement/[id].tsx`:
```tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { procurementApi } from '@shared/api/procurement-api';
import { useHttp } from '../../lib/http';

export default function PrDetail() {
  const { id } = useParams<{ id: string }>();
  const http = useHttp();
  const api = procurementApi(http);
  const [pr, setPr] = useState<any>(null);

  useEffect(() => { api.getPr(id!).then(setPr); }, [id]);

  if (!pr) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold">{pr.title}</h1>
          <div className="text-sm text-gray-500">{pr.requisitionNumber} · {pr.category} · {pr.paymentPattern}</div>
        </div>
        <span className="px-3 py-1 rounded text-sm bg-blue-100 text-blue-700">{pr.status}</span>
      </div>
      <table className="w-full text-sm mb-4 border">
        <thead className="bg-gray-50"><tr><th className="text-left p-2">Description</th><th>Qty</th><th>Unit</th><th>Est. Cost</th><th>Total</th></tr></thead>
        <tbody>
          {pr.items?.map((it: any, i: number) => (
            <tr key={i} className="border-t">
              <td className="p-2">{it.description}</td>
              <td className="text-center">{it.qty}</td>
              <td className="text-center">{it.unit}</td>
              <td className="text-right">₦{it.estimatedUnitCost?.toLocaleString()}</td>
              <td className="text-right">₦{(it.qty * it.estimatedUnitCost).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="text-right font-semibold">Estimated Total: ₦{Number(pr.estimatedTotal).toLocaleString()}</div>
      {pr.justification && <div className="mt-4 text-sm text-gray-600"><span className="font-medium">Justification: </span>{pr.justification}</div>}
      {pr.purchaseOrders?.length > 0 && (
        <div className="mt-4 text-sm">
          <span className="font-medium">Purchase Orders: </span>
          {pr.purchaseOrders.map((po: any) => <span key={po.id} className="ml-2 font-mono">{po.poNumber}</span>)}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Add routes**

In `apps/pwa/src/App.tsx` (or the routing file), add:
```tsx
<Route path="/procurement" element={<ProcurementIndex />} />
<Route path="/procurement/create" element={<CreatePr />} />
<Route path="/procurement/:id" element={<PrDetail />} />
```

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/pages/procurement/ apps/pwa/src/App.tsx
git commit -m "feat(procurement): add staff PR list, create, and detail pages"
```

---

## Task 11: Frontend — Officer PO Pages

**Files:**
- Create: `apps/pwa/src/pages/procurement/orders/index.tsx`
- Create: `apps/pwa/src/pages/procurement/orders/create.tsx`
- Create: `apps/pwa/src/pages/procurement/orders/[id].tsx`
- Create: `apps/pwa/src/pages/procurement/grn/create.tsx`

- [ ] **Step 1: PO list page**

`apps/pwa/src/pages/procurement/orders/index.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { procurementApi } from '@shared/api/procurement-api';
import { useHttp } from '../../../lib/http';

export default function PoList() {
  const http = useHttp();
  const api = procurementApi(http);
  const [pos, setPos] = useState<any[]>([]);

  useEffect(() => { api.listPos().then(setPos); }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Purchase Orders</h1>
        <Link to="/procurement/orders/create" className="btn btn-primary">New PO</Link>
      </div>
      <table className="w-full text-sm">
        <thead className="border-b">
          <tr><th className="text-left py-2">PO Number</th><th>Requisition</th><th>Vendor</th><th>Amount</th><th>Pattern</th><th>Status</th><th></th></tr>
        </thead>
        <tbody>
          {pos.map(po => (
            <tr key={po.id} className="border-b hover:bg-gray-50">
              <td className="py-2 font-mono text-xs">{po.poNumber}</td>
              <td className="text-xs">{po.requisition?.requisitionNumber}</td>
              <td>{po.vendor?.name}</td>
              <td>₦{Number(po.totalAmount).toLocaleString()}</td>
              <td className="text-xs">{po.paymentPattern}</td>
              <td className="text-xs">{po.status}</td>
              <td><Link to={`/procurement/orders/${po.id}`} className="text-blue-600 text-xs">View</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: PO create page**

`apps/pwa/src/pages/procurement/orders/create.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { procurementApi } from '@shared/api/procurement-api';
import { useHttp } from '../../../lib/http';

const EMPTY_ITEM = { description: '', qty: 1, unit: 'unit', unitCost: 0 };

export default function CreatePo() {
  const http = useHttp();
  const api = procurementApi(http);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const prId = params.get('prId');
  const [pr, setPr] = useState<any>(null);
  const [vendors, setVendors] = useState<any[]>([]);
  const [form, setForm] = useState({ vendorId: '', paymentPattern: 'post_delivery', paymentTerms: '', deliveryDate: '', deliveryAddress: '' });
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (prId) api.getPr(prId).then(p => { setPr(p); setItems((p as any).items?.map((i: any) => ({ description: i.description, qty: i.qty, unit: i.unit, unitCost: i.estimatedUnitCost })) ?? [{ ...EMPTY_ITEM }]); });
    // Load vendors from finance API
    fetch('/api/finance/contacts?type=vendor').then(r => r.json()).then(d => setVendors(d.data ?? []));
  }, [prId]);

  const total = items.reduce((s, i) => s + i.qty * i.unitCost, 0);

  const updateItem = (idx: number, field: string, value: any) =>
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));

  const handleCreate = async () => {
    setSaving(true);
    try {
      const po = await api.createPo({
        requisitionId: prId,
        ...form,
        items: items.map(i => ({ ...i, totalCost: i.qty * i.unitCost })),
        approvalFlowJson: { steps: [{ approverType: 'finance_manager' }, { approverType: 'coo' }] },
      });
      navigate(`/procurement/orders/${(po as any).id}`);
    } finally { setSaving(false); }
  };

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-semibold mb-4">Create Purchase Order {pr ? `— ${pr.requisitionNumber}` : ''}</h1>
      <div className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Vendor</label>
          <select className="input w-full" value={form.vendorId} onChange={e => setForm(f => ({ ...f, vendorId: e.target.value }))}>
            <option value="">Select vendor...</option>
            {vendors.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Payment Pattern</label>
            <select className="input w-full" value={form.paymentPattern} onChange={e => setForm(f => ({ ...f, paymentPattern: e.target.value }))}>
              <option value="post_delivery">Post-Delivery</option>
              <option value="pre_payment">Pre-Payment</option>
              <option value="milestone">Milestone</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Payment Terms</label>
            <input className="input w-full" placeholder="e.g. 30 days net" value={form.paymentTerms} onChange={e => setForm(f => ({ ...f, paymentTerms: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm mb-1">Expected Delivery</label>
            <input type="date" className="input w-full" value={form.deliveryDate} onChange={e => setForm(f => ({ ...f, deliveryDate: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm mb-1">Delivery Address</label>
            <input className="input w-full" value={form.deliveryAddress} onChange={e => setForm(f => ({ ...f, deliveryAddress: e.target.value }))} />
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <span className="font-medium text-sm">Line Items</span>
            <button className="text-blue-600 text-xs" onClick={() => setItems(p => [...p, { ...EMPTY_ITEM }])}>+ Add</button>
          </div>
          {items.map((it, idx) => (
            <div key={idx} className="grid grid-cols-5 gap-2 mb-2">
              <input className="input col-span-2" placeholder="Description" value={it.description} onChange={e => updateItem(idx, 'description', e.target.value)} />
              <input className="input" type="number" placeholder="Qty" value={it.qty} onChange={e => updateItem(idx, 'qty', Number(e.target.value))} />
              <input className="input" placeholder="Unit" value={it.unit} onChange={e => updateItem(idx, 'unit', e.target.value)} />
              <input className="input" type="number" placeholder="Unit Cost" value={it.unitCost} onChange={e => updateItem(idx, 'unitCost', Number(e.target.value))} />
            </div>
          ))}
          <div className="text-right font-semibold text-sm">Total: ₦{total.toLocaleString()}</div>
        </div>
        <button className="btn btn-primary" onClick={handleCreate} disabled={saving || !form.vendorId}>Create Purchase Order</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: GRN creation page**

`apps/pwa/src/pages/procurement/grn/create.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { procurementApi } from '@shared/api/procurement-api';
import { useHttp } from '../../../lib/http';

export default function CreateGrn() {
  const http = useHttp();
  const api = procurementApi(http);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const poId = params.get('poId') ?? '';
  const [po, setPo] = useState<any>(null);
  const [form, setForm] = useState({ receivedDate: '', overallCondition: 'satisfactory', notes: '' });
  const [items, setItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (poId) api.getPo(poId).then(p => {
      setPo(p);
      setItems((p as any).items?.map((i: any) => ({ description: i.description, qtyOrdered: i.qty, qtyReceived: i.qty, condition: 'good', notes: '' })) ?? []);
    });
  }, [poId]);

  const updateItem = (idx: number, field: string, value: any) =>
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await api.createGrn({ poId, ...form, items } as any);
      navigate(`/procurement/orders/${poId}`);
    } finally { setSaving(false); }
  };

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-semibold mb-4">Goods Receipt Note {po ? `— ${po.poNumber}` : ''}</h1>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Date Received</label>
            <input type="date" className="input w-full" value={form.receivedDate} onChange={e => setForm(f => ({ ...f, receivedDate: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm mb-1">Overall Condition</label>
            <select className="input w-full" value={form.overallCondition} onChange={e => setForm(f => ({ ...f, overallCondition: e.target.value }))}>
              <option value="satisfactory">Satisfactory</option>
              <option value="partial">Partial</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
        <div>
          <div className="font-medium text-sm mb-2">Items Received</div>
          {items.map((it, idx) => (
            <div key={idx} className="grid grid-cols-4 gap-2 mb-2 text-sm">
              <div className="col-span-1 flex items-center">{it.description}</div>
              <div><label className="block text-xs text-gray-500">Ordered</label><div>{it.qtyOrdered}</div></div>
              <div><label className="block text-xs text-gray-500">Received</label><input className="input w-full" type="number" value={it.qtyReceived} onChange={e => updateItem(idx, 'qtyReceived', Number(e.target.value))} /></div>
              <div><label className="block text-xs text-gray-500">Condition</label><input className="input w-full" value={it.condition} onChange={e => updateItem(idx, 'condition', e.target.value)} /></div>
            </div>
          ))}
        </div>
        <div>
          <label className="block text-sm mb-1">Notes</label>
          <textarea className="input w-full" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={saving || !form.receivedDate}>Submit GRN</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Add PO routes**

```tsx
<Route path="/procurement/orders" element={<PoList />} />
<Route path="/procurement/orders/create" element={<CreatePo />} />
<Route path="/procurement/orders/:id" element={<PoDetail />} />
<Route path="/procurement/grn/create" element={<CreateGrn />} />
```

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/pages/procurement/
git commit -m "feat(procurement): add officer PO and GRN pages"
```

---

## Task 12: Frontend — Vendor Portal

**Files:**
- Create: `apps/pwa/src/pages/vendor-portal/login.tsx`
- Create: `apps/pwa/src/pages/vendor-portal/index.tsx`
- Create: `apps/pwa/src/pages/vendor-portal/po/[id].tsx`

- [ ] **Step 1: Vendor login page**

`apps/pwa/src/pages/vendor-portal/login.tsx`:
```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { procurementApi } from '@shared/api/procurement-api';

export default function VendorLogin() {
  const api = procurementApi({} as any);
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.vendorLogin(form.email, form.password);
      if (res.token) {
        localStorage.setItem('vendor_token', res.token);
        localStorage.setItem('vendor_id', res.vendorId);
        navigate('/vendor-portal');
      } else {
        setError('Login failed. Check your credentials.');
      }
    } catch {
      setError('Login failed. Check your credentials.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded shadow p-8 w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-6 text-center">Vendor Portal</h1>
        {error && <div className="text-red-600 text-sm mb-4">{error}</div>}
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input type="email" className="input w-full" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input type="password" className="input w-full" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>
          <button className="btn btn-primary w-full" onClick={handleLogin} disabled={loading}>Login</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Vendor PO dashboard**

`apps/pwa/src/pages/vendor-portal/index.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { procurementApi } from '@shared/api/procurement-api';

export default function VendorDashboard() {
  const api = procurementApi({} as any);
  const navigate = useNavigate();
  const token = localStorage.getItem('vendor_token') ?? '';
  const [pos, setPos] = useState<any[]>([]);

  useEffect(() => {
    if (!token) { navigate('/vendor-portal/login'); return; }
    api.vendorListOrders(token).then((d: any) => setPos(Array.isArray(d) ? d : d.data ?? []));
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">My Purchase Orders</h1>
        <button className="text-sm text-red-500" onClick={() => { localStorage.removeItem('vendor_token'); navigate('/vendor-portal/login'); }}>Logout</button>
      </div>
      <table className="w-full text-sm">
        <thead className="border-b">
          <tr><th className="text-left py-2">PO Number</th><th>Amount</th><th>Pattern</th><th>Delivery</th><th>Status</th><th>Acknowledged</th><th></th></tr>
        </thead>
        <tbody>
          {pos.map(po => (
            <tr key={po.id} className="border-b hover:bg-gray-50">
              <td className="py-2 font-mono text-xs">{po.poNumber}</td>
              <td>₦{Number(po.totalAmount).toLocaleString()}</td>
              <td className="text-xs">{po.paymentPattern}</td>
              <td className="text-xs">{po.deliveryDate?.slice(0, 10) ?? '—'}</td>
              <td className="text-xs">{po.status}</td>
              <td className="text-xs">{po.vendorAcknowledgedAt ? '✓' : '—'}</td>
              <td><Link to={`/vendor-portal/po/${po.id}`} className="text-blue-600 text-xs">View</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: Vendor PO detail + acknowledge**

`apps/pwa/src/pages/vendor-portal/po/[id].tsx`:
```tsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { procurementApi } from '@shared/api/procurement-api';

export default function VendorPoDetail() {
  const { id } = useParams<{ id: string }>();
  const api = procurementApi({} as any);
  const token = localStorage.getItem('vendor_token') ?? '';
  const [po, setPo] = useState<any>(null);
  const [note, setNote] = useState('');
  const [acknowledging, setAcknowledging] = useState(false);

  useEffect(() => { api.vendorGetOrder(token, id!).then(setPo); }, [id]);

  const handleAcknowledge = async () => {
    setAcknowledging(true);
    await api.vendorAcknowledge(token, id!, note);
    const updated = await api.vendorGetOrder(token, id!);
    setPo(updated);
    setAcknowledging(false);
  };

  if (!po) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-3xl">
      <Link to="/vendor-portal" className="text-blue-600 text-sm mb-4 block">← Back to orders</Link>
      <div className="flex justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold">{po.poNumber}</h1>
          <div className="text-sm text-gray-500">{po.paymentPattern} · Delivery: {po.deliveryDate?.slice(0, 10) ?? '—'}</div>
        </div>
        <span className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded">{po.status}</span>
      </div>
      <div className="mb-4 text-sm">
        <div><span className="font-medium">Delivery Address:</span> {po.deliveryAddress ?? '—'}</div>
        <div><span className="font-medium">Payment Terms:</span> {po.paymentTerms ?? '—'}</div>
      </div>
      <table className="w-full text-sm border mb-4">
        <thead className="bg-gray-50"><tr><th className="text-left p-2">Description</th><th>Qty</th><th>Unit</th><th>Unit Cost</th><th>Total</th></tr></thead>
        <tbody>
          {po.items?.map((it: any, i: number) => (
            <tr key={i} className="border-t">
              <td className="p-2">{it.description}</td>
              <td className="text-center">{it.qty}</td>
              <td className="text-center">{it.unit}</td>
              <td className="text-right">₦{Number(it.unitCost).toLocaleString()}</td>
              <td className="text-right">₦{Number(it.totalCost).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="text-right font-semibold mb-6">Total: ₦{Number(po.totalAmount).toLocaleString()}</div>
      {po.vendorAcknowledgedAt ? (
        <div className="bg-green-50 border border-green-200 rounded p-4 text-sm text-green-700">
          Acknowledged on {new Date(po.vendorAcknowledgedAt).toLocaleDateString()}
          {po.vendorAcknowledgeNote && <div className="mt-1 italic">"{po.vendorAcknowledgeNote}"</div>}
        </div>
      ) : (
        <div className="border rounded p-4">
          <div className="font-medium text-sm mb-2">Acknowledge this Purchase Order</div>
          <textarea className="input w-full mb-3" rows={2} placeholder="Optional note..." value={note} onChange={e => setNote(e.target.value)} />
          <button className="btn btn-primary" onClick={handleAcknowledge} disabled={acknowledging}>Acknowledge PO</button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Add vendor portal routes**

In App.tsx, add routes outside the staff auth guard:
```tsx
<Route path="/vendor-portal/login" element={<VendorLogin />} />
<Route path="/vendor-portal" element={<VendorDashboard />} />
<Route path="/vendor-portal/po/:id" element={<VendorPoDetail />} />
```

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/pages/vendor-portal/ apps/pwa/src/App.tsx
git commit -m "feat(procurement): add vendor portal login, dashboard, and PO detail pages"
```

---

## Task 13: Final Integration — Sidebar + Type Check

**Files:**
- Modify: `apps/pwa/src/shared/` (sidebar/nav component — find the sidebar file)
- Run: full TypeScript check and test suite

- [ ] **Step 1: Find and update sidebar**

```bash
grep -rn "requests\|finance\|Sidebar\|NavItem" apps/pwa/src/shared/ --include="*.tsx" -l | head -5
```

Add a Procurement nav item alongside the existing Requests entry, pointing to `/procurement`.

- [ ] **Step 2: Run TypeScript check**

```bash
cd api && npx tsc --noEmit 2>&1 | head -30
cd apps/pwa && npx tsc --noEmit 2>&1 | head -30
```

Fix any type errors before proceeding.

- [ ] **Step 3: Run all procurement tests**

```bash
cd api && npx jest procurement --no-coverage 2>&1 | tail -20
```

Expected: All tests pass.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(procurement): complete procurement system — sidebar integration and type fixes"
```
