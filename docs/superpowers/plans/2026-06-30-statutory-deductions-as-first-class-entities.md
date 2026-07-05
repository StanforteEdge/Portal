# Statutory Deductions as First-Class Entities — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote statutory deductions (WHT, VAT, etc.) from nested PV children to sibling entities of Payment Vouchers, with a central remittance page.

**Architecture:** New `FinanceRequestDeduction` model as a sibling to `FinancePaymentVoucher` under a Request. Disbursement creates both. A central page lists all deductions across requests with batch remittance. Existing `FinancePVDeduction`/`FinanceVendorWHTAccrual`/`FinanceWHTRemittance` stay untouched for vendor certificate reporting.

**Tech Stack:** Prisma (PostgreSQL), NestJS, React (custom `@/shared` component library — NOT Mantine), `financeApi` from `@/shared/lib/core`.

---

## File Map

| Layer | File | Action |
|-------|------|--------|
| Data | `api/prisma/schema.prisma` | Modify — add `FinanceRequestDeduction` model + 3 back-relations |
| API DTO | `api/src/modules/finance/dto/disburse-request.dto.ts` | Modify — add optional `deductions[]` |
| API DTO | `api/src/modules/finance/dto/statutory-deductions.dto.ts` | Create — list filters + remit body |
| API Service | `api/src/modules/finance/deduction.service.ts` | Modify — add `listRequestDeductions`, `batchRemitDeductions`; extend `applyPVDeductions` |
| API Service | `api/src/modules/finance/finance.service.ts` | Modify — extend `disburseRequest` to create deduction siblings |
| API Service | `api/src/modules/requests/requests.service.ts` | Modify — extend `createManualEntry` / `updateManualEntry` to create `FinanceRequestDeduction` records |
| API Controller | `api/src/modules/finance/finance.controller.ts` | Modify — add GET/PATCH for statutory deductions |
| API Test | `api/src/modules/finance/__tests__/statutory-deductions.spec.ts` | Create — test list + remit for the new endpoints |
| PWA Types | `apps/shared/src/api/finance-api.ts` | Modify — add `FinanceRequestDeductionRecord` type + API functions |
| PWA Page | `apps/pwa/src/pages/finance/deductions/StatutoryDeductionsPage.tsx` | Create — central list page with batch remit |
| PWA Page | `apps/pwa/src/pages/finance/requests/FinanceLegacyManualEntryPage.tsx` | Modify — load + display request deductions when editing |
| PWA Router | `apps/pwa/src/App.tsx` | Modify — add route `/finance/statutory-deductions` (insert after line 246) |

---

### Task 1: Add `FinanceRequestDeduction` model to Prisma schema

**Files:**
- Modify: `api/prisma/schema.prisma`

- [ ] **Step 1: Add the new model**

Insert after the `FinancePVDeduction` block. The `createdByUser` relation uses a named relation to avoid ambiguity with the many existing `Profile` relations:

```prisma
model FinanceRequestDeduction {
  id              String   @id @default(uuid()) @db.Uuid
  requestId       BigInt   @map("request_id")
  deductionTypeId String   @map("deduction_type_id") @db.Uuid
  amount          Decimal  @db.Decimal(15, 2)
  rate            Decimal  @db.Decimal(6, 4)
  grossAmount     Decimal  @map("gross_amount") @db.Decimal(15, 2)
  status          String   @default("pending") @db.VarChar(20)
  remittedAt      DateTime? @map("remitted_at")
  remittanceRef   String?  @map("remittance_ref") @db.VarChar(255)
  notes           String?
  createdBy       BigInt   @map("created_by")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  request       RequestInstance      @relation("RequestDeductions", fields: [requestId], references: [id])
  deductionType FinanceDeductionType @relation("DeductionTypeRequestDeductions", fields: [deductionTypeId], references: [id])
  createdByUser Profile              @relation("RequestDeductionCreatedBy", fields: [createdBy], references: [id])

  @@index([requestId])
  @@index([status])
  @@index([deductionTypeId])
  @@map("sta_finance_request_deductions")
}
```

- [ ] **Step 2: Add back-relations to the three related models**

Prisma requires both sides of every relation. Add these lines to the existing models:

In `model RequestInstance` (around line 858, after the `loans` relation):
```prisma
  requestDeductions FinanceRequestDeduction[] @relation("RequestDeductions")
```

In `model FinanceDeductionType` (after the `remittances` relation, line 3211):
```prisma
  requestDeductions FinanceRequestDeduction[] @relation("DeductionTypeRequestDeductions")
```

In `model Profile` (after existing back-relations — search for `"DeductionTypeCreatedBy"` and add nearby):
```prisma
  createdRequestDeductions FinanceRequestDeduction[] @relation("RequestDeductionCreatedBy")
```

- [ ] **Step 3: Generate and apply migration**

```bash
npx prisma migrate dev --name add_finance_request_deduction --create-only
npx prisma migrate deploy
npx prisma generate
```

Expected: No errors. `prismaClient.financeRequestDeduction` available.

- [ ] **Step 4: Commit**

```bash
git add api/prisma/schema.prisma api/prisma/migrations/
git commit -m "feat(db): add FinanceRequestDeduction model with back-relations"
```

---

### Task 2: Create DTOs for list + remit endpoints

**Files:**
- Create: `api/src/modules/finance/dto/statutory-deductions.dto.ts`

- [ ] **Step 1: Write the DTOs**

```ts
import { IsArray, IsDateString, IsIn, IsNumberString, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class StatutoryDeductionsQueryDto {
  @ApiPropertyOptional({ enum: ['pending', 'remitted'] })
  @IsOptional()
  @IsIn(['pending', 'remitted'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  deduction_type_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date_to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  request_id?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @IsNumberString()
  per_page?: string;
}

export class RemitStatutoryDeductionsDto {
  @ApiProperty({ type: [String], description: 'IDs of FinanceRequestDeduction to mark as remitted' })
  @IsArray()
  @IsUUID('4', { each: true })
  deduction_ids!: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  remitted_at?: string;

  @ApiProperty({ example: 'WHT-2026-Q1-remittance' })
  @IsString()
  reference!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add api/src/modules/finance/dto/statutory-deductions.dto.ts
git commit -m "feat(api): add statutory deductions DTOs"
```

---

### Task 3: Extend `DisburseRequestDto` with deductions array

**Files:**
- Modify: `api/src/modules/finance/dto/disburse-request.dto.ts`

- [ ] **Step 1: Add `DisburseDeductionLineDto` class and `deductions` field to the main DTO**

```ts
// Add at top-level (before or after existing nested DTOs):
export class DisburseDeductionLineDto {
  @ApiProperty()
  @IsUUID()
  deduction_type_id!: string;

  @ApiProperty({ example: 0.05 })
  @IsNumber()
  rate!: number;

  @ApiProperty({ example: 30000 })
  @IsNumber()
  gross_amount!: number;

  @ApiProperty({ example: 1500 })
  @IsNumber()
  amount!: number;
}

// Add to DisburseRequestDto:
@ApiPropertyOptional({ type: [DisburseDeductionLineDto] })
@IsOptional()
@IsArray()
@ValidateNested({ each: true })
@Type(() => DisburseDeductionLineDto)
deductions?: DisburseDeductionLineDto[];
```

- [ ] **Step 2: Commit**

```bash
git add api/src/modules/finance/dto/disburse-request.dto.ts
git commit -m "feat(api): add deductions[] to DisburseRequestDto"
```

---

### Task 4: Add service methods — list, batch remit, extend `applyPVDeductions`

**Files:**
- Modify: `api/src/modules/finance/deduction.service.ts`

- [ ] **Step 1: Add imports at the top of the file** (if not already present)

```ts
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StatutoryDeductionsQueryDto, RemitStatutoryDeductionsDto } from './dto/statutory-deductions.dto';
import { toBigInt } from '../../common/utils/bigint.utils'; // adjust path to match project
```

- [ ] **Step 2: Add `listRequestDeductions` method**

```ts
async listRequestDeductions(query: StatutoryDeductionsQueryDto) {
  const page = Math.max(1, Number(query.page ?? 1));
  const perPage = Math.min(200, Math.max(1, Number(query.per_page ?? 50)));
  const skip = (page - 1) * perPage;

  const where: Prisma.FinanceRequestDeductionWhereInput = {};
  if (query.status) where.status = query.status;
  if (query.deduction_type_id) where.deductionTypeId = query.deduction_type_id;
  if (query.request_id) where.requestId = toBigInt(query.request_id);
  if (query.search) {
    where.request = { data: { path: ['request_number'], string_contains: query.search } };
  }
  if (query.date_from || query.date_to) {
    where.createdAt = {
      ...(query.date_from ? { gte: new Date(query.date_from) } : {}),
      ...(query.date_to ? { lte: new Date(query.date_to) } : {}),
    };
  }

  const [rows, total] = await Promise.all([
    this.prisma.financeRequestDeduction.findMany({
      where,
      include: {
        deductionType: { select: { id: true, name: true, code: true } },
        request: { select: { id: true, createdAt: true, status: true, data: true } },
        createdByUser: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: perPage,
    }),
    this.prisma.financeRequestDeduction.count({ where }),
  ]);

  return {
    data: {
      items: rows,
      pagination: { page, per_page: perPage, total, total_pages: Math.ceil(total / perPage) },
    },
  };
}
```

- [ ] **Step 3: Add `batchRemitDeductions` method**

```ts
async batchRemitDeductions(dto: RemitStatutoryDeductionsDto, userId: number) {
  const ids = dto.deduction_ids;
  const now = dto.remitted_at ? new Date(dto.remitted_at) : new Date();

  const existing = await this.prisma.financeRequestDeduction.findMany({
    where: { id: { in: ids } },
    select: { id: true, status: true },
  });

  if (existing.length !== ids.length) {
    throw new NotFoundException('Some deductions were not found');
  }
  const alreadyRemitted = existing.filter((d) => d.status === 'remitted');
  if (alreadyRemitted.length > 0) {
    throw new BadRequestException(`${alreadyRemitted.length} deduction(s) already remitted`);
  }

  await this.prisma.financeRequestDeduction.updateMany({
    where: { id: { in: ids } },
    data: { status: 'remitted', remittedAt: now, remittanceRef: dto.reference, notes: dto.notes ?? null },
  });

  return { updated: ids.length };
}
```

- [ ] **Step 4: Extend `applyPVDeductions` to also create `FinanceRequestDeduction` siblings**

`createdDeductions` and `pv.requestId` are both already available in `applyPVDeductions`. After the existing `financeVendorWHTAccrual` block (end of the `$transaction` callback), add:

```ts
// Create FinanceRequestDeduction siblings for request-level deduction tracking
if (pv.requestId) {
  await Promise.all(
    createdDeductions.map((deduction) =>
      tx.financeRequestDeduction.create({
        data: {
          requestId: pv.requestId!,
          deductionTypeId: deduction.deductionTypeId,
          amount: deduction.deductionAmount,
          rate: deduction.rate,
          grossAmount: deduction.grossAmount,
          status: 'pending',
          createdBy: toBigInt(userId),
          updatedAt: now,
        },
      }),
    ),
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add api/src/modules/finance/deduction.service.ts
git commit -m "feat(api): list, remit, and auto-create FinanceRequestDeduction"
```

---

### Task 5: Extend `disburseRequest` to create deduction siblings

**Files:**
- Modify: `api/src/modules/finance/finance.service.ts`

`actorId` and `now` are both in scope inside `disburseRequest`. After the PV creation block (inside the transaction, before the request status update), add:

- [ ] **Step 1: Add deduction siblings after PV creation**

```ts
// Create FinanceRequestDeduction siblings for statutory deduction tracking
if (dto.deductions && dto.deductions.length > 0) {
  await Promise.all(
    dto.deductions.map((ded) =>
      this.prisma.financeRequestDeduction.create({
        data: {
          requestId: id,
          deductionTypeId: ded.deduction_type_id,
          amount: ded.amount,
          rate: ded.rate,
          grossAmount: ded.gross_amount,
          status: 'pending',
          createdBy: actorId ? toBigInt(actorId) : BigInt(0),
          updatedAt: now,
        },
      }),
    ),
  );
  traceLog(
    `disburseRequest:deductions-created requestId=${id.toString()} count=${dto.deductions.length}`,
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add api/src/modules/finance/finance.service.ts
git commit -m "feat(api): create FinanceRequestDeduction siblings during disbursement"
```

---

### Task 6: Extend `createManualEntry` and `updateManualEntry` to create deduction siblings

**Files:**
- Modify: `api/src/modules/requests/requests.service.ts`

The manual entry path already creates `FinancePVDeduction` records inside `$transaction`. For each PV row that has deductions, also create `FinanceRequestDeduction` records so they appear on the central statutory deductions page.

- [ ] **Step 1: In both `createManualEntry` and `updateManualEntry`, after `tx.financePVDeduction.createMany`, add**

```ts
// Mirror as request-level deductions for central tracking
if (deductions.length > 0) {
  await tx.financeRequestDeduction.createMany({
    data: deductions.map((d) => ({
      requestId: createdRequest.id, // use the request's BigInt id
      deductionTypeId: d.deduction_type_id,
      amount: Number(d.deduction_amount),
      rate: d.rate,
      grossAmount: grossAmt,
      status: 'pending',
      createdBy: toBigInt(userId),
      updatedAt: new Date(),
    })),
    skipDuplicates: true,
  });
}
```

> **Note:** `createdRequest.id` in `createManualEntry` is the newly created `RequestInstance.id`. In `updateManualEntry`, use the `existing.id` (the request being updated). Before adding to update, also delete stale ones for that request first:
> ```ts
> await tx.financeRequestDeduction.deleteMany({ where: { requestId: existing.id } });
> ```
> Insert this delete before the PV-level loop so stale deductions are cleared on every save.

- [ ] **Step 2: Commit**

```bash
git add api/src/modules/requests/requests.service.ts
git commit -m "feat(api): create FinanceRequestDeduction records during manual entry save"
```

---

### Task 7: Add REST endpoints to finance controller

**Files:**
- Modify: `api/src/modules/finance/finance.controller.ts`

- [ ] **Step 1: Import new DTOs**

```ts
import { StatutoryDeductionsQueryDto, RemitStatutoryDeductionsDto } from './dto/statutory-deductions.dto';
```

- [ ] **Step 2: Add two endpoints after the existing WHT remittance block**

```ts
// ── Request-level Statutory Deductions ──────────────────────────────────

@Get('statutory-deductions')
@Permissions('finance.view')
@ApiOperation({ summary: 'List request-level statutory deductions across all requests' })
listRequestDeductions(@Query() query: StatutoryDeductionsQueryDto) {
  return this.deductionService.listRequestDeductions(query);
}

@Patch('statutory-deductions/remit')
@Permissions('finance.manage')
@ApiOperation({ summary: 'Batch-remit selected statutory deductions' })
batchRemitDeductions(@Req() req: any, @Body() dto: RemitStatutoryDeductionsDto) {
  return this.deductionService.batchRemitDeductions(dto, req.user?.id);
}
```

- [ ] **Step 3: Commit**

```bash
git add api/src/modules/finance/finance.controller.ts
git commit -m "feat(api): add GET/PATCH statutory-deductions endpoints"
```

---

### Task 8: Write backend tests

**Files:**
- Create: `api/src/modules/finance/__tests__/statutory-deductions.spec.ts`

- [ ] **Step 1: Write tests**

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { DeductionService } from '../deduction.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { StatutoryDeductionsQueryDto, RemitStatutoryDeductionsDto } from '../dto/statutory-deductions.dto';

const mockDeductions = [
  {
    id: 'uuid-1',
    requestId: 1n,
    deductionTypeId: 'type-uuid',
    amount: 1500,
    rate: 0.05,
    grossAmount: 30000,
    status: 'pending',
    remittedAt: null,
    remittanceRef: null,
    notes: null,
    createdBy: 1n,
    createdAt: new Date(),
    updatedAt: new Date(),
    deductionType: { id: 'type-uuid', name: 'WHT', code: 'wht' },
    request: { id: 1n, data: {}, createdAt: new Date(), status: 'completed' },
    createdByUser: { id: 1n, firstName: 'Admin', lastName: 'User' },
  },
];

describe('DeductionService — listRequestDeductions', () => {
  let service: DeductionService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      financeRequestDeduction: {
        findMany: jest.fn().mockResolvedValue(mockDeductions),
        count: jest.fn().mockResolvedValue(1),
        updateMany: jest.fn(),
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeductionService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get<DeductionService>(DeductionService);
  });

  it('should return paginated deductions', async () => {
    const result = await service.listRequestDeductions({});
    expect(result.data.items).toHaveLength(1);
    expect(result.data.pagination.total).toBe(1);
  });

  it('should pass status filter to where clause', async () => {
    await service.listRequestDeductions({ status: 'pending' });
    expect(prisma.financeRequestDeduction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: 'pending' }) }),
    );
  });
});

describe('DeductionService — batchRemitDeductions', () => {
  let service: DeductionService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      financeRequestDeduction: {
        findMany: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeductionService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get<DeductionService>(DeductionService);
  });

  it('should remit selected deductions', async () => {
    prisma.financeRequestDeduction.findMany.mockResolvedValue([
      { id: 'uuid-1', status: 'pending' },
      { id: 'uuid-2', status: 'pending' },
    ]);
    const dto: RemitStatutoryDeductionsDto = { deduction_ids: ['uuid-1', 'uuid-2'], reference: 'WHT-001' };
    const result = await service.batchRemitDeductions(dto, 1);
    expect(result.updated).toBe(2);
  });

  it('should throw if any deduction is already remitted', async () => {
    prisma.financeRequestDeduction.findMany.mockResolvedValue([{ id: 'uuid-1', status: 'remitted' }]);
    await expect(
      service.batchRemitDeductions({ deduction_ids: ['uuid-1'], reference: 'ref' }, 1),
    ).rejects.toThrow();
  });

  it('should throw NotFoundException if an id is missing', async () => {
    prisma.financeRequestDeduction.findMany.mockResolvedValue([]);
    await expect(
      service.batchRemitDeductions({ deduction_ids: ['missing-uuid'], reference: 'ref' }, 1),
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run**

```bash
npx jest --testPathPattern=statutory-deductions --no-coverage
```

- [ ] **Step 3: Commit**

```bash
git add api/src/modules/finance/__tests__/statutory-deductions.spec.ts
git commit -m "test(api): add tests for statutory deductions list/remit"
```

---

### Task 9: Add types + API functions to shared finance-api client

**Files:**
- Modify: `apps/shared/src/api/finance-api.ts`

- [ ] **Step 1: Add `FinanceRequestDeductionRecord` type**

```ts
export type FinanceRequestDeductionRecord = {
  id: string;
  request_id: string;
  deduction_type_id: string;
  deduction_type_name: string;
  deduction_type_code: string;
  amount: number;
  rate: number;
  gross_amount: number;
  status: "pending" | "remitted";
  remitted_at: string | null;
  remittance_ref: string | null;
  notes: string | null;
  created_by_name: string;
  created_at: string;
};
```

- [ ] **Step 2: Add API functions inside `createFinanceApi`**

```ts
async listRequestDeductions(params?: Record<string, unknown>) {
  const res = await httpRequest<any>(`/finance/statutory-deductions${toQuery(params)}`);
  return {
    items: ((res as any)?.data?.items ?? []) as FinanceRequestDeductionRecord[],
    pagination: (res as any)?.data?.pagination ?? null,
  };
},

batchRemitDeductions(body: Record<string, unknown>) {
  return httpRequest<{ updated: number }>('/finance/statutory-deductions/remit', {
    method: 'PATCH',
    body,
  });
},
```

- [ ] **Step 3: Commit**

```bash
git add apps/shared/src/api/finance-api.ts
git commit -m "feat(shared): add FinanceRequestDeduction type and API functions"
```

---

### Task 10: Build the central Statutory Deductions page

**Files:**
- Create: `apps/pwa/src/pages/finance/deductions/StatutoryDeductionsPage.tsx`

Use the project's actual component library from `@/shared` — **not Mantine**.

- [ ] **Step 1: Write the page component**

```tsx
import { useState } from "react";
import { financeApi } from "@/shared/lib/core";
import {
  AppShell, Button, Icon, PageHeader,
  Table, TableHead, TableHeaderRow, TableHeaderCell,
  TableRow, TableCell, TableBody,
  TextField, SelectField, useToast, SlideOver,
} from "@/shared";
import type { FinanceRequestDeductionRecord } from "@shared/api/finance-api";
import { useNavigate } from "react-router-dom";

export default function StatutoryDeductionsPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [deductions, setDeductions] = useState<FinanceRequestDeductionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [remitOpen, setRemitOpen] = useState(false);
  const [remitRef, setRemitRef] = useState("");
  const [remitting, setRemitting] = useState(false);
  const [pagination, setPagination] = useState<{ page: number; total: number; total_pages: number } | null>(null);
  const [page, setPage] = useState(1);

  const fetchDeductions = async (p = 1) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page: p, per_page: 50 };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const res = await financeApi.listRequestDeductions(params);
      setDeductions(res.items);
      setPagination(res.pagination);
      setPage(p);
    } catch {
      toast.error("Failed to load deductions");
    } finally {
      setLoading(false);
    }
  };

  const handleRemit = async () => {
    if (!remitRef.trim()) return;
    setRemitting(true);
    try {
      const result = await financeApi.batchRemitDeductions({
        deduction_ids: Array.from(selectedIds),
        reference: remitRef.trim(),
      });
      toast.success(`${result.updated} deduction(s) marked as remitted`);
      setSelectedIds(new Set());
      setRemitRef("");
      setRemitOpen(false);
      fetchDeductions(page);
    } catch {
      toast.error("Failed to remit deductions");
    } finally {
      setRemitting(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const pending = deductions.filter((d) => d.status === "pending");
    if (selectedIds.size === pending.length && pending.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pending.map((d) => d.id)));
    }
  };

  const pendingRows = deductions.filter((d) => d.status === "pending");

  return (
    <AppShell>
      <div className="p-4 space-y-4">
        <PageHeader
          title="Statutory Deductions"
          subtitle="Track and remit withheld statutory amounts across all requests"
        />

        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[200px]">
            <TextField
              label="Search request"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchDeductions(1)}
            />
          </div>
          <div className="w-40">
            <SelectField
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="remitted">Remitted</option>
            </SelectField>
          </div>
          <Button onClick={() => fetchDeductions(1)} disabled={loading}>
            {loading ? "Loading..." : "Search"}
          </Button>
          <Button
            variant="primary"
            disabled={selectedIds.size === 0}
            onClick={() => setRemitOpen(true)}
          >
            <Icon name="CheckSquare" className="w-4 h-4 mr-1" />
            Remit ({selectedIds.size})
          </Button>
        </div>

        <Table>
          <TableHead>
            <TableHeaderRow>
              <TableHeaderCell>
                <input
                  type="checkbox"
                  checked={pendingRows.length > 0 && selectedIds.size === pendingRows.length}
                  onChange={toggleAll}
                  aria-label="Select all pending"
                />
              </TableHeaderCell>
              <TableHeaderCell>Request ID</TableHeaderCell>
              <TableHeaderCell>Deduction Type</TableHeaderCell>
              <TableHeaderCell>Gross Amount</TableHeaderCell>
              <TableHeaderCell>Amount Withheld</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Remitted At</TableHeaderCell>
              <TableHeaderCell>Reference</TableHeaderCell>
            </TableHeaderRow>
          </TableHead>
          <TableBody>
            {deductions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-slate-400 py-8">
                  {loading ? "Loading..." : "No deductions found. Click Search to load."}
                </TableCell>
              </TableRow>
            ) : (
              deductions.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(d.id)}
                      onChange={() => toggleSelect(d.id)}
                      disabled={d.status === "remitted"}
                      aria-label={`Select ${d.id}`}
                    />
                  </TableCell>
                  <TableCell>
                    <button
                      className="text-blue-600 underline text-sm"
                      onClick={() => navigate(`/requests/${d.request_id}`)}
                    >
                      {d.request_id}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{d.deduction_type_name}</div>
                    <div className="text-xs text-slate-400">{d.deduction_type_code}</div>
                  </TableCell>
                  <TableCell>{Number(d.gross_amount).toLocaleString()}</TableCell>
                  <TableCell>{Number(d.amount).toLocaleString()}</TableCell>
                  <TableCell>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${d.status === "remitted" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {d.status}
                    </span>
                  </TableCell>
                  <TableCell>{d.remitted_at ? new Date(d.remitted_at).toLocaleDateString() : "—"}</TableCell>
                  <TableCell>{d.remittance_ref ?? "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {pagination && pagination.total_pages > 1 && (
          <div className="flex gap-2 items-center">
            <Button variant="secondary" disabled={page <= 1} onClick={() => fetchDeductions(page - 1)}>Prev</Button>
            <span className="text-sm text-slate-600">Page {page} of {pagination.total_pages}</span>
            <Button variant="secondary" disabled={page >= pagination.total_pages} onClick={() => fetchDeductions(page + 1)}>Next</Button>
          </div>
        )}
      </div>

      <SlideOver open={remitOpen} onClose={() => setRemitOpen(false)} title="Remit Deductions">
        <div className="space-y-4 p-4">
          <p className="text-sm text-slate-600">{selectedIds.size} deduction(s) selected for remittance.</p>
          <TextField
            label="Remittance Reference *"
            value={remitRef}
            onChange={(e) => setRemitRef(e.target.value)}
            placeholder="e.g. WHT-remit-2026-001"
          />
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="secondary" onClick={() => setRemitOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleRemit} disabled={!remitRef.trim() || remitting}>
              {remitting ? "Remitting..." : "Confirm Remit"}
            </Button>
          </div>
        </div>
      </SlideOver>
    </AppShell>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/pwa/src/pages/finance/deductions/StatutoryDeductionsPage.tsx
git commit -m "feat(pwa): add Statutory Deductions page with list/batch-remit"
```

---

### Task 11: Register route in App.tsx

**Files:**
- Modify: `apps/pwa/src/App.tsx`

- [ ] **Step 1: Import the page**

```ts
import StatutoryDeductionsPage from "@/pages/finance/deductions/StatutoryDeductionsPage";
```

- [ ] **Step 2: Add route**

Insert after the existing legacy manual entry route (currently around line 246):

```tsx
<Route path="/finance/statutory-deductions" element={<StatutoryDeductionsPage />} />
```

- [ ] **Step 3: Add nav link**

Find the sidebar/navigation component that renders the Finance section links (search for `/finance/legacy-manual-entry` to locate it). Add:

```tsx
{ label: "Statutory Deductions", path: "/finance/statutory-deductions", icon: "CheckSquare" }
```

- [ ] **Step 4: Commit**

```bash
git add apps/pwa/src/App.tsx
git commit -m "feat(pwa): register /finance/statutory-deductions route"
```

---

### Task 12: Update `FinanceLegacyManualEntryPage` to show existing deductions

**Files:**
- Modify: `apps/pwa/src/pages/finance/requests/FinanceLegacyManualEntryPage.tsx`

When a request is loaded for edit, fetch its `FinanceRequestDeduction` records and display them in a read-only summary table inside each PV row that has deductions.

- [ ] **Step 1: Add state for loaded deductions**

```ts
const [requestDeductions, setRequestDeductions] = useState<import("@shared/api/finance-api").FinanceRequestDeductionRecord[]>([]);
```

- [ ] **Step 2: In `loadForEdit`, after setting disbursements, fetch and store deductions**

```ts
const deductionRes = await financeApi.listRequestDeductions({ request_id: String(req.id), per_page: 200 })
  .catch(() => ({ items: [] }));
setRequestDeductions(deductionRes.items);
```

- [ ] **Step 3: In `resetManualForm`, clear deductions**

```ts
setRequestDeductions([]);
```

- [ ] **Step 4: Render a read-only deduction summary below the disbursement section (after all PV rows)**

```tsx
{requestDeductions.length > 0 && (
  <div className="col-span-12 mt-4">
    <h4 className="font-medium text-slate-700 mb-2">Statutory Deductions on this Request</h4>
    <table className="w-full text-sm border rounded overflow-hidden">
      <thead className="bg-slate-50 text-slate-600">
        <tr>
          <th className="px-3 py-2 text-left">Type</th>
          <th className="px-3 py-2 text-right">Gross</th>
          <th className="px-3 py-2 text-right">Withheld</th>
          <th className="px-3 py-2 text-left">Status</th>
          <th className="px-3 py-2 text-left">Reference</th>
        </tr>
      </thead>
      <tbody>
        {requestDeductions.map((d) => (
          <tr key={d.id} className="border-t">
            <td className="px-3 py-2">{d.deduction_type_name} <span className="text-xs text-slate-400">({d.deduction_type_code})</span></td>
            <td className="px-3 py-2 text-right">{Number(d.gross_amount).toLocaleString()}</td>
            <td className="px-3 py-2 text-right">{Number(d.amount).toLocaleString()}</td>
            <td className="px-3 py-2">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${d.status === "remitted" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                {d.status}
              </span>
            </td>
            <td className="px-3 py-2 text-slate-500">{d.remittance_ref ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}
```

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/pages/finance/requests/FinanceLegacyManualEntryPage.tsx
git commit -m "feat(pwa): show statutory deductions summary in legacy manual entry when editing"
```

---

### Task 13: Verify full stack compiles

- [ ] `npx tsc --noEmit -p api/tsconfig.json` — 0 errors
- [ ] `npx tsc --noEmit -p apps/pwa/tsconfig.json` — 0 errors
- [ ] `npx jest --testPathPattern=statutory-deductions --no-coverage` — all green
- [ ] `npx prisma migrate status` — up to date

---

## Self-Review Checklist

- [ ] Back-relations on all three related models (`RequestInstance`, `FinanceDeductionType`, `Profile`) are present with named relation strings
- [ ] Named relation strings match exactly between the new model and the back-relation declarations
- [ ] PWA page uses `@/shared` components only — no Mantine imports
- [ ] PWA page uses `financeApi` from `@/shared/lib/core` — no `useFinanceApi` hook
- [ ] `listRequestDeductions` has real pagination (skip/take + count)
- [ ] Test mocks have no duplicate object keys
- [ ] `createManualEntry` and `updateManualEntry` both create `FinanceRequestDeduction` records; `updateManualEntry` deletes stale records first
- [ ] `applyPVDeductions` extension uses existing `createdDeductions` variable (already present at line 99 of `deduction.service.ts`)
- [ ] `actorId` is confirmed in scope in `disburseRequest` (it's a parameter)
- [ ] Existing `FinancePVDeduction`/`FinanceVendorWHTAccrual`/`FinanceWHTRemittance` untouched
