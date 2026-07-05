# Funder Receipts & Pledge Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add pledge tracking (with Pledge Acknowledgment PDF), a Donors UI page, a Grants UI page, and a Funder Receipt PDF on income entries.

**Architecture:** New `FinancePledge` Prisma model links donors to grant commitments; `FinanceIncomeEntry` gains `pledgeId` and `receiptNumber` fields. All PDF documents follow the existing pattern: build an HTML string → `pdfService.renderPdfFromHtml(html)` �� return `{ file_name, mime_type, content_base64 }`. Frontend pages call new methods added to `apps/shared/src/api/resource-api.ts`.

**Tech Stack:** NestJS + Prisma (API), React + TypeScript (PWA), Jest (tests), PdfService (existing).

## Global Constraints

- All new Prisma models use `@db.Uuid` for UUID fields, `@default(now())` for `createdAt`, `@updatedAt` for `updatedAt`.
- Pledge number format: `PLG-YYYY-NNN` — use `this.nextDocumentSequenceValue('PLG', date, 'pledge')`.
- Funder receipt number format: `FRC-YYYY-NNN` — use `this.nextDocumentSequenceValue('FRC', date, 'funder_receipt')`.
- All amounts stored as `Decimal @db.Decimal(15, 2)`.
- PDF methods return `{ file_name: string, mime_type: 'application/pdf', content_base64: string }`.
- Frontend pages import `resourceApi, useCachedQuery` from `@/shared/lib/core` and `downloadBase64File` from `@/shared/lib/download`.
- All new frontend pages follow the pattern of `FinanceIncomePage.tsx`: `AppShell`, `PageHeader`, `SectionCard`, `DataTable`, `Button`, `Icon`, `Chip`, `useToast`.
- Tests use Jest with a mocked `prisma` object; instantiate service as `new FinanceService(prisma, {} as any, {} as any, {} as any)`.

---

## File Map

**Create:**
- `api/prisma/migrations/<timestamp>_finance_pledges/migration.sql`
- `api/src/modules/finance/dto/upsert-finance-pledge.dto.ts`
- `api/src/modules/finance/__tests__/pledges.spec.ts`
- `api/src/modules/finance/documents/pledge-acknowledgment.document.ts`
- `api/src/modules/finance/documents/funder-receipt.document.ts`
- `apps/pwa/src/pages/finance/donors/FinanceDonorsPage.tsx`
- `apps/pwa/src/pages/finance/grants/FinanceGrantsPage.tsx`
- `apps/pwa/src/pages/finance/pledges/FinancePledgesPage.tsx`

**Modify:**
- `api/prisma/schema.prisma` — add `FinancePledge` model; add `pledgeId` + `receiptNumber` to `FinanceIncomeEntry`
- `api/src/modules/finance/finance.service.ts` — pledge CRUD methods, income extension, PDF methods
- `api/src/modules/finance/finance.controller.ts` — pledge endpoints + PDF endpoints
- `api/src/modules/finance/dto/create-finance-income.dto.ts` — add `pledge_id`, `donor_id`
- `apps/shared/src/api/resource-api.ts` — donor, grant, pledge, PDF download methods
- `apps/pwa/src/App.tsx` — add routes for donors, grants, pledges
- `apps/pwa/src/shared/navigation.ts` — add Funding group with Donors / Grants / Pledges
- `apps/pwa/src/pages/finance/income/FinanceIncomePage.tsx` — donor/pledge selectors, Download Receipt button

---

### Task 1: Prisma Schema — FinancePledge model + FinanceIncomeEntry fields

**Files:**
- Modify: `api/prisma/schema.prisma`

**Interfaces:**
- Produces: `FinancePledge` Prisma model, `pledgeId`/`receiptNumber` fields on `FinanceIncomeEntry`, available in all subsequent tasks via `prisma.financePledge.*`

- [ ] **Step 1: Add FinancePledge model to schema**

Open `api/prisma/schema.prisma`. After the closing `}` of `model FinanceGrant` (around line 1123), add:

```prisma
model FinancePledge {
  id             String    @id @default(uuid()) @db.Uuid
  pledgeNumber   String    @map("pledge_number") @db.VarChar(60)
  organizationId BigInt?   @map("organization_id")
  donorId        String    @map("donor_id") @db.Uuid
  grantId        String?   @map("grant_id") @db.Uuid
  fundId         String?   @map("fund_id") @db.Uuid
  amount         Decimal   @db.Decimal(15, 2)
  currency       String    @default("NGN") @db.VarChar(3)
  receivedAmount Decimal   @default(0) @map("received_amount") @db.Decimal(15, 2)
  pledgedAt      DateTime  @map("pledged_at")
  expectedAt     DateTime? @map("expected_at")
  status         String    @default("pending") @db.VarChar(20)
  purpose        String?
  notes          String?
  createdBy      BigInt?   @map("created_by")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  donor        FinanceDonor         @relation(fields: [donorId], references: [id], onDelete: Restrict)
  grant        FinanceGrant?        @relation(fields: [grantId], references: [id], onDelete: SetNull)
  fund         FinanceFund?         @relation(fields: [fundId], references: [id], onDelete: SetNull)
  incomeEntries FinanceIncomeEntry[]

  @@unique([organizationId, pledgeNumber], name: "unique_finance_pledge_number_per_org")
  @@index([donorId])
  @@index([grantId])
  @@index([status])
  @@map("sta_finance_pledges")
}
```

- [ ] **Step 2: Add back-relation on FinanceDonor**

In `model FinanceDonor`, add to the relations block (after `grants FinanceGrant[]`):

```prisma
  pledges FinancePledge[]
```

- [ ] **Step 3: Add back-relation on FinanceGrant**

In `model FinanceGrant`, add to the relations block (after the existing relations):

```prisma
  pledges FinancePledge[]
```

- [ ] **Step 4: Add pledgeId and receiptNumber to FinanceIncomeEntry**

In `model FinanceIncomeEntry`, add these fields after `grantId`:

```prisma
  pledgeId       String?  @map("pledge_id") @db.Uuid
  receiptNumber  String?  @unique @map("receipt_number") @db.VarChar(60)
```

And add the relation after the existing `grant` relation:

```prisma
  pledge FinancePledge? @relation(fields: [pledgeId], references: [id], onDelete: SetNull)
```

And add to the `@@index` block:

```prisma
  @@index([pledgeId])
```

- [ ] **Step 5: Run migration**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal/api
npx prisma migrate dev --name finance_pledges
```

Expected: Migration created and applied. Prisma client regenerated.

- [ ] **Step 6: Verify generated client**

```bash
npx prisma generate
```

Expected: `✔ Generated Prisma Client` with no errors.

- [ ] **Step 7: Commit**

```bash
git add api/prisma/schema.prisma api/prisma/migrations/
git commit -m "feat(finance): add FinancePledge model and pledge/receipt fields on income entries"
```

---

### Task 2: Pledge DTO + Service CRUD

**Files:**
- Create: `api/src/modules/finance/dto/upsert-finance-pledge.dto.ts`
- Modify: `api/src/modules/finance/finance.service.ts`

**Interfaces:**
- Consumes: `prisma.financePledge` (from Task 1)
- Produces:
  - `financeService.createPledge(dto: UpsertFinancePledgeDto, actorId?: number): Promise<FinancePledge>`
  - `financeService.updatePledge(id: string, dto: UpsertFinancePledgeDto, actorId?: number): Promise<FinancePledge>`
  - `financeService.deletePledge(id: string): Promise<void>`
  - `financeService.listPledges(query: Record<string, any>): Promise<{ result, total, page, pages, per_page }>`
  - `financeService.getPledge(id: string): Promise<FinancePledge & { donor, grant, incomeEntries }>`

- [ ] **Step 1: Write the failing test**

Create `api/src/modules/finance/__tests__/pledges.spec.ts`:

```typescript
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FinanceService } from '../finance.service';

describe('FinanceService — pledge CRUD', () => {
  const prisma: any = {
    financePledge: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    },
    financeDonor: { findUnique: jest.fn() },
    financeGrant: { findUnique: jest.fn() },
    financeFund: { findUnique: jest.fn() },
    financeIncomeEntry: { aggregate: jest.fn() },
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
    $transaction: jest.fn(async (cb: any) => cb(prisma)),
  };

  const service = new FinanceService(prisma, {} as any, {} as any, {} as any);

  beforeEach(() => jest.clearAllMocks());

  it('createPledge — creates pledge with generated number', async () => {
    prisma.financeDonor.findUnique.mockResolvedValue({ id: 'donor-1', name: 'USAID' });
    prisma.$queryRaw.mockResolvedValue([{ last_number: 0 }]);
    prisma.$executeRaw.mockResolvedValue(1);
    prisma.financePledge.create.mockResolvedValue({
      id: 'pledge-1',
      pledgeNumber: 'PLG-2026-001',
      donorId: 'donor-1',
      amount: 5000000,
      currency: 'NGN',
      status: 'pending',
      receivedAmount: 0,
      pledgedAt: new Date('2026-07-05'),
    });
    const result = await service.createPledge({
      donor_id: 'donor-1',
      amount: 5000000,
      pledged_at: '2026-07-05',
    }, 1);
    expect(prisma.financePledge.create).toHaveBeenCalled();
    expect(result.pledgeNumber).toBe('PLG-2026-001');
  });

  it('createPledge — throws NotFoundException if donor not found', async () => {
    prisma.financeDonor.findUnique.mockResolvedValue(null);
    await expect(
      service.createPledge({ donor_id: 'bad-id', amount: 1000, pledged_at: '2026-07-05' }, 1)
    ).rejects.toThrow(NotFoundException);
  });

  it('deletePledge — throws BadRequestException if status is not pending', async () => {
    prisma.financePledge.findUnique.mockResolvedValue({ id: 'pledge-1', status: 'partial' });
    await expect(service.deletePledge('pledge-1')).rejects.toThrow(BadRequestException);
  });

  it('deletePledge — deletes if status is pending', async () => {
    prisma.financePledge.findUnique.mockResolvedValue({ id: 'pledge-1', status: 'pending' });
    prisma.financePledge.delete.mockResolvedValue({ id: 'pledge-1' });
    await service.deletePledge('pledge-1');
    expect(prisma.financePledge.delete).toHaveBeenCalledWith({ where: { id: 'pledge-1' } });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal/api
npx jest pledges.spec.ts --no-coverage
```

Expected: FAIL — `service.createPledge is not a function`

- [ ] **Step 3: Create UpsertFinancePledgeDto**

Create `api/src/modules/finance/dto/upsert-finance-pledge.dto.ts`:

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class UpsertFinancePledgeDto {
  @ApiProperty({ example: '3fef7e86-cf6a-4df7-b0b3-e350adf55e33' })
  @IsUUID()
  donor_id!: string;

  @ApiPropertyOptional({ example: '3fef7e86-cf6a-4df7-b0b3-e350adf55e33' })
  @IsOptional()
  @IsUUID()
  grant_id?: string;

  @ApiPropertyOptional({ example: '3fef7e86-cf6a-4df7-b0b3-e350adf55e33' })
  @IsOptional()
  @IsUUID()
  fund_id?: string;

  @ApiProperty({ example: 5000000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional({ example: 'NGN' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: '2026-07-05' })
  @IsDateString()
  pledged_at!: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  expected_at?: string;

  @ApiPropertyOptional({ example: 'pending' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'Education program support' })
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
```

- [ ] **Step 4: Add pledge service methods to finance.service.ts**

In `api/src/modules/finance/finance.service.ts`, import the new DTO at the top alongside other DTO imports:

```typescript
import { UpsertFinancePledgeDto } from './dto/upsert-finance-pledge.dto';
```

Then add these methods before the closing `}` of the `FinanceService` class:

```typescript
  async createPledge(dto: UpsertFinancePledgeDto, actorId?: number) {
    const donor = await this.prisma.financeDonor.findUnique({ where: { id: dto.donor_id } });
    if (!donor) throw new NotFoundException(`Donor ${dto.donor_id} not found`);

    const pledgedAt = new Date(dto.pledged_at);
    const pledgeNumber = await this.nextDocumentSequenceValue('PLG', pledgedAt, 'pledge');

    return this.prisma.financePledge.create({
      data: {
        pledgeNumber,
        donorId: dto.donor_id,
        grantId: dto.grant_id ?? null,
        fundId: dto.fund_id ?? null,
        amount: dto.amount,
        currency: (dto.currency ?? 'NGN').toUpperCase(),
        receivedAmount: 0,
        pledgedAt,
        expectedAt: dto.expected_at ? new Date(dto.expected_at) : null,
        status: (dto.status ?? 'pending').toLowerCase(),
        purpose: dto.purpose?.trim() ?? null,
        notes: dto.notes?.trim() ?? null,
        createdBy: actorId ? BigInt(actorId) : null,
      },
      include: { donor: true, grant: true },
    });
  }

  async updatePledge(id: string, dto: UpsertFinancePledgeDto, actorId?: number) {
    const existing = await this.prisma.financePledge.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Pledge ${id} not found`);

    const donor = await this.prisma.financeDonor.findUnique({ where: { id: dto.donor_id } });
    if (!donor) throw new NotFoundException(`Donor ${dto.donor_id} not found`);

    return this.prisma.financePledge.update({
      where: { id },
      data: {
        donorId: dto.donor_id,
        grantId: dto.grant_id ?? null,
        fundId: dto.fund_id ?? null,
        amount: dto.amount,
        currency: (dto.currency ?? existing.currency).toUpperCase(),
        pledgedAt: new Date(dto.pledged_at),
        expectedAt: dto.expected_at ? new Date(dto.expected_at) : null,
        status: dto.status ? dto.status.toLowerCase() : existing.status,
        purpose: dto.purpose?.trim() ?? existing.purpose,
        notes: dto.notes?.trim() ?? existing.notes,
      },
      include: { donor: true, grant: true },
    });
  }

  async deletePledge(id: string) {
    const pledge = await this.prisma.financePledge.findUnique({ where: { id } });
    if (!pledge) throw new NotFoundException(`Pledge ${id} not found`);
    if (!['pending', 'cancelled'].includes(pledge.status)) {
      throw new BadRequestException(`Cannot delete a pledge with status "${pledge.status}". Cancel it first.`);
    }
    await this.prisma.financePledge.delete({ where: { id } });
  }

  async listPledges(query: Record<string, any>) {
    const page = Math.max(1, Number(query.page ?? 1));
    const perPage = Math.min(100, Math.max(1, Number(query.per_page ?? 20)));
    const skip = (page - 1) * perPage;

    const where: any = {};
    if (query.donor_id) where.donorId = query.donor_id;
    if (query.grant_id) where.grantId = query.grant_id;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { pledgeNumber: { contains: query.search, mode: 'insensitive' } },
        { donor: { name: { contains: query.search, mode: 'insensitive' } } },
        { purpose: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [rows, total] = await Promise.all([
      this.prisma.financePledge.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { pledgedAt: 'desc' },
        include: { donor: { select: { id: true, name: true } }, grant: { select: { id: true, name: true } } },
      }),
      this.prisma.financePledge.count({ where }),
    ]);

    return { result: rows, total, page, pages: Math.ceil(total / perPage), per_page: perPage };
  }

  async getPledge(id: string) {
    const pledge = await this.prisma.financePledge.findUnique({
      where: { id },
      include: {
        donor: true,
        grant: true,
        incomeEntries: { orderBy: { receivedAt: 'desc' } },
      },
    });
    if (!pledge) throw new NotFoundException(`Pledge ${id} not found`);
    return pledge;
  }
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal/api
npx jest pledges.spec.ts --no-coverage
```

Expected: All 4 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add api/src/modules/finance/dto/upsert-finance-pledge.dto.ts \
        api/src/modules/finance/finance.service.ts \
        api/src/modules/finance/__tests__/pledges.spec.ts
git commit -m "feat(finance): add pledge DTO and service CRUD methods"
```

---

### Task 3: Pledge Controller Endpoints

**Files:**
- Modify: `api/src/modules/finance/finance.controller.ts`

**Interfaces:**
- Consumes: `createPledge`, `updatePledge`, `deletePledge`, `listPledges`, `getPledge` from Task 2
- Produces: REST endpoints `GET/POST /finance/pledges`, `POST/DELETE /finance/pledges/:id`

- [ ] **Step 1: Add import to controller**

In `api/src/modules/finance/finance.controller.ts`, add to the DTO imports at the top:

```typescript
import { UpsertFinancePledgeDto } from './dto/upsert-finance-pledge.dto';
```

- [ ] **Step 2: Add pledge endpoints**

In the controller class, locate the donor endpoints block (around the `@Get('donors')` decorator). Add the pledge endpoints immediately after the grant endpoints block:

```typescript
  @Get('pledges')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List finance pledges' })
  listPledges(@Query() query: Record<string, any>) {
    return this.financeService.listPledges(query);
  }

  @Get('pledges/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get finance pledge' })
  getPledge(@Param('id') id: string) {
    return this.financeService.getPledge(id);
  }

  @Post('pledges')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create finance pledge' })
  createPledge(@Req() req: any, @Body() dto: UpsertFinancePledgeDto) {
    return this.financeService.createPledge(dto, req.user?.id);
  }

  @Post('pledges/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update finance pledge' })
  updatePledge(@Req() req: any, @Param('id') id: string, @Body() dto: UpsertFinancePledgeDto) {
    return this.financeService.updatePledge(id, dto, req.user?.id);
  }

  @Delete('pledges/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete finance pledge (pending only)' })
  deletePledge(@Param('id') id: string) {
    return this.financeService.deletePledge(id);
  }
```

- [ ] **Step 3: Build to verify no TypeScript errors**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal/api
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add api/src/modules/finance/finance.controller.ts
git commit -m "feat(finance): add pledge controller endpoints"
```

---

### Task 4: Extend Income — pledge_id, donor_id, receipt_number

**Files:**
- Modify: `api/src/modules/finance/dto/create-finance-income.dto.ts`
- Modify: `api/src/modules/finance/finance.service.ts`

**Interfaces:**
- Consumes: `prisma.financePledge.update` (Task 1), `nextDocumentSequenceValue` (existing)
- Produces:
  - `CreateFinanceIncomeDto` gains optional `pledge_id` and `donor_id` fields
  - `createIncome` recomputes pledge `receivedAmount` + `status` after saving
  - Each income entry gets a unique `receiptNumber` (`FRC-YYYY-NNN`) on first download

- [ ] **Step 1: Write the failing test for pledge status recompute**

Add to `api/src/modules/finance/__tests__/pledges.spec.ts`:

```typescript
describe('FinanceService — income pledge recompute', () => {
  const prisma: any = {
    financeAccount: { findUnique: jest.fn() },
    financeChartAccount: { findUnique: jest.fn() },
    financeFund: { findUnique: jest.fn() },
    financeGrant: { findUnique: jest.fn() },
    financePledge: { findUnique: jest.fn(), update: jest.fn() },
    financeIncomeEntry: { create: jest.fn(), aggregate: jest.fn() },
    financeJournalEntry: { create: jest.fn() },
    financeReportingPeriod: { findFirst: jest.fn(), create: jest.fn() },
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
    $transaction: jest.fn(async (cb: any) => cb(prisma)),
  };

  const service = new FinanceService(prisma, {} as any, {} as any, {} as any);

  beforeEach(() => jest.clearAllMocks());

  it('recomputePledgeStatus — sets partial when received < pledged', async () => {
    prisma.financeIncomeEntry.aggregate.mockResolvedValue({ _sum: { amount: 1000000 } });
    prisma.financePledge.update.mockResolvedValue({ id: 'p1', status: 'partial', receivedAmount: 1000000 });
    await (service as any).recomputePledgeStatus('p1', 5000000, prisma);
    expect(prisma.financePledge.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'p1' },
      data: expect.objectContaining({ status: 'partial', receivedAmount: 1000000 }),
    }));
  });

  it('recomputePledgeStatus — sets fulfilled when received >= pledged', async () => {
    prisma.financeIncomeEntry.aggregate.mockResolvedValue({ _sum: { amount: 5000000 } });
    prisma.financePledge.update.mockResolvedValue({ id: 'p1', status: 'fulfilled', receivedAmount: 5000000 });
    await (service as any).recomputePledgeStatus('p1', 5000000, prisma);
    expect(prisma.financePledge.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'fulfilled' }),
    }));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal/api
npx jest pledges.spec.ts --no-coverage
```

Expected: FAIL — `service.recomputePledgeStatus is not a function`

- [ ] **Step 3: Add pledge_id and donor_id to CreateFinanceIncomeDto**

In `api/src/modules/finance/dto/create-finance-income.dto.ts`, add after the existing `grant_id` field:

```typescript
  @ApiPropertyOptional({ example: 'f3e8b369-0eca-454f-a8f8-46b780bc6264' })
  @IsOptional()
  @IsUUID()
  pledge_id?: string;

  @ApiPropertyOptional({ example: 'f3e8b369-0eca-454f-a8f8-46b780bc6264' })
  @IsOptional()
  @IsUUID()
  donor_id?: string;
```

- [ ] **Step 4: Add recomputePledgeStatus private method to finance.service.ts**

Add this private method in `finance.service.ts` before the closing `}` of the class:

```typescript
  private async recomputePledgeStatus(pledgeId: string, pledgedAmount: number, tx: any) {
    const agg = await tx.financeIncomeEntry.aggregate({
      where: { pledgeId },
      _sum: { amount: true },
    });
    const received = Number(agg._sum.amount ?? 0);
    const status = received <= 0 ? 'pending' : received >= pledgedAmount ? 'fulfilled' : 'partial';
    await tx.financePledge.update({
      where: { id: pledgeId },
      data: { receivedAmount: received, status },
    });
  }
```

- [ ] **Step 5: Update createIncome to pass pledge_id/donor_id and recompute**

Find the `createIncome` method in `finance.service.ts`. In the `$transaction` block where `financeIncomeEntry.create` is called, add `pledgeId` to the data object:

```typescript
pledgeId: dto.pledge_id ?? null,
// donor_id is stored as payer name when donor lookup is available
```

After the `financeIncomeEntry.create` call, inside the same transaction block, add:

```typescript
    if (dto.pledge_id) {
      const pledge = await tx.financePledge.findUnique({ where: { id: dto.pledge_id }, select: { amount: true } });
      if (pledge) {
        await this.recomputePledgeStatus(dto.pledge_id, Number(pledge.amount), tx);
      }
    }
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal/api
npx jest pledges.spec.ts --no-coverage
```

Expected: All 6 tests PASS.

- [ ] **Step 7: Commit**

```bash
git add api/src/modules/finance/dto/create-finance-income.dto.ts \
        api/src/modules/finance/finance.service.ts \
        api/src/modules/finance/__tests__/pledges.spec.ts
git commit -m "feat(finance): extend income with pledge_id and donor_id; recompute pledge status on income save"
```

---

### Task 5: PDF — Pledge Acknowledgment & Funder Receipt

**Files:**
- Modify: `api/src/modules/finance/finance.service.ts`
- Modify: `api/src/modules/finance/finance.controller.ts`

**Interfaces:**
- Consumes: `getPledge(id)` (Task 2), `prisma.financeIncomeEntry.findUnique` (Task 1), `pdfService.renderPdfFromHtml`, `fetchOrgSettings`, `nextDocumentSequenceValue`
- Produces:
  - `financeService.generatePledgeAcknowledgmentPdf(id: string): Promise<{ file_name, mime_type, content_base64 }>`
  - `financeService.generateFunderReceiptPdf(id: string): Promise<{ file_name, mime_type, content_base64 }>`
  - `GET /finance/pledges/:id/acknowledgment`
  - `GET /finance/income/:id/receipt`

- [ ] **Step 1: Add generatePledgeAcknowledgmentPdf to finance.service.ts**

Add this method before the closing `}` of the `FinanceService` class. It follows the exact same pattern as `generateTrmSlipPdf` in deduction.service.ts:

```typescript
  async generatePledgeAcknowledgmentPdf(id: string) {
    const pledge = await this.prisma.financePledge.findUnique({
      where: { id },
      include: { donor: true, grant: true },
    });
    if (!pledge) throw new NotFoundException(`Pledge ${id} not found`);

    const org = await this.fetchOrgSettings();
    const logoDataUri = this.getPdfLogoDataUri();
    const amountWords = this.numberToWords(Number(pledge.amount));
    const currency = pledge.currency || 'NGN';
    const formattedAmount = new Intl.NumberFormat('en-NG', { style: 'decimal', minimumFractionDigits: 2 }).format(Number(pledge.amount));
    const pledgedDate = pledge.pledgedAt.toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' });
    const expectedDate = pledge.expectedAt
      ? pledge.expectedAt.toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })
      : null;

    const html = `<!doctype html><html><head><meta charset="utf-8"/>
<style>
  body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a2e; margin: 0; padding: 32px; }
  .header { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 24px; border-bottom: 2px solid #1a1a2e; padding-bottom: 16px; }
  .org-name { font-size: 20px; font-weight: bold; }
  .org-sub { font-size: 11px; color: #555; margin-top: 2px; }
  .doc-title { text-align: center; font-size: 18px; font-weight: bold; margin: 24px 0 8px; text-transform: uppercase; letter-spacing: 1px; }
  .ref-badge { display: inline-block; background: #f0f4ff; border: 1px solid #c7d2fe; border-radius: 4px; padding: 4px 12px; font-size: 13px; font-weight: bold; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  td { padding: 8px 12px; border: 1px solid #e5e7eb; font-size: 13px; vertical-align: top; }
  td:first-child { font-weight: 600; background: #f9fafb; width: 35%; }
  .clause { margin-top: 24px; padding: 12px 16px; background: #f9fafb; border-left: 3px solid #6366f1; font-size: 12px; color: #374151; line-height: 1.6; }
  .signatory { margin-top: 48px; display: flex; justify-content: flex-end; }
  .sig-block { text-align: center; min-width: 200px; }
  .sig-line { border-top: 1px solid #374151; padding-top: 4px; font-size: 11px; color: #6b7280; margin-top: 40px; }
</style></head><body>
<div class="header">
  ${logoDataUri ? `<img src="${logoDataUri}" style="height:56px;object-fit:contain;" alt="logo"/>` : ''}
  <div>
    <div class="org-name">${this.esc(org.org_name)}</div>
    ${org.org_address ? `<div class="org-sub">${this.esc(org.org_address)}</div>` : ''}
    ${org.org_registration ? `<div class="org-sub">Reg: ${this.esc(org.org_registration)}</div>` : ''}
  </div>
</div>
<div class="doc-title">Pledge Acknowledgment</div>
<div style="text-align:center;margin-bottom:16px;"><span class="ref-badge">${this.esc(pledge.pledgeNumber)}</span></div>
<p style="color:#6b7280;font-size:12px;">Date Issued: ${new Date().toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
<table>
  <tr><td>Pledged By</td><td>${this.esc(pledge.donor.name)}</td></tr>
  ${pledge.donor.address ? `<tr><td>Address</td><td>${this.esc(pledge.donor.address)}</td></tr>` : ''}
  ${pledge.donor.email ? `<tr><td>Email</td><td>${this.esc(pledge.donor.email)}</td></tr>` : ''}
  <tr><td>Pledge Date</td><td>${pledgedDate}</td></tr>
  ${expectedDate ? `<tr><td>Expected Receipt Date</td><td>${expectedDate}</td></tr>` : ''}
  ${pledge.grant ? `<tr><td>Grant / Program</td><td>${this.esc(pledge.grant.name)}${pledge.grant.restrictionType ? ` (${this.esc(pledge.grant.restrictionType)})` : ''}</td></tr>` : ''}
  <tr><td>Pledged Amount</td><td><strong>${currency} ${formattedAmount}</strong></td></tr>
  <tr><td>Amount in Words</td><td>${this.esc(amountWords)} ${currency}</td></tr>
  ${pledge.purpose ? `<tr><td>Purpose</td><td>${this.esc(pledge.purpose)}</td></tr>` : ''}
</table>
<div class="clause">
  This letter acknowledges the above pledge commitment made to ${this.esc(org.org_name)}. No goods or services were provided or promised in exchange for this pledge.
</div>
<div class="signatory">
  <div class="sig-block">
    <div class="sig-line">${this.esc(org.org_name)}<br/>Authorized Signatory</div>
  </div>
</div>
</body></html>`;

    const buffer = await this.pdfService.renderPdfFromHtml(html);
    const fileName = `pledge-acknowledgment-${pledge.pledgeNumber.replace(/\//g, '-')}.pdf`;
    return { file_name: fileName, mime_type: 'application/pdf', content_base64: buffer.toString('base64') };
  }
```

- [ ] **Step 2: Add generateFunderReceiptPdf to finance.service.ts**

Add immediately after `generatePledgeAcknowledgmentPdf`:

```typescript
  async generateFunderReceiptPdf(incomeId: string) {
    const entry = await this.prisma.financeIncomeEntry.findUnique({
      where: { id: incomeId },
      include: {
        account: true,
        grant: true,
        pledge: { include: { donor: true } },
      },
    });
    if (!entry) throw new NotFoundException(`Income entry ${incomeId} not found`);

    // Lazily generate receipt_number on first download
    let receiptNumber = entry.receiptNumber;
    if (!receiptNumber) {
      receiptNumber = await this.nextDocumentSequenceValue('FRC', entry.receivedAt, 'funder_receipt');
      await this.prisma.financeIncomeEntry.update({ where: { id: incomeId }, data: { receiptNumber } });
    }

    const org = await this.fetchOrgSettings();
    const logoDataUri = this.getPdfLogoDataUri();
    const currency = entry.currency || 'NGN';
    const amountWords = this.numberToWords(Number(entry.amount));
    const formattedAmount = new Intl.NumberFormat('en-NG', { style: 'decimal', minimumFractionDigits: 2 }).format(Number(entry.amount));
    const receivedDate = entry.receivedAt.toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' });
    const payerName = entry.pledge?.donor?.name ?? entry.payer ?? 'Unknown';
    const payerAddress = entry.pledge?.donor?.address ?? null;

    const html = `<!doctype html><html><head><meta charset="utf-8"/>
<style>
  body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a2e; margin: 0; padding: 32px; }
  .header { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 24px; border-bottom: 2px solid #1a1a2e; padding-bottom: 16px; }
  .org-name { font-size: 20px; font-weight: bold; }
  .org-sub { font-size: 11px; color: #555; margin-top: 2px; }
  .doc-title { text-align: center; font-size: 18px; font-weight: bold; margin: 24px 0 8px; text-transform: uppercase; letter-spacing: 1px; }
  .ref-badge { display: inline-block; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 4px; padding: 4px 12px; font-size: 13px; font-weight: bold; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  td { padding: 8px 12px; border: 1px solid #e5e7eb; font-size: 13px; vertical-align: top; }
  td:first-child { font-weight: 600; background: #f9fafb; width: 35%; }
  .amount-box { margin: 16px 0; padding: 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; text-align: center; }
  .amount-box .big { font-size: 22px; font-weight: bold; color: #15803d; }
  .clause { margin-top: 24px; padding: 12px 16px; background: #f9fafb; border-left: 3px solid #22c55e; font-size: 12px; color: #374151; line-height: 1.6; }
  .signatory { margin-top: 48px; display: flex; justify-content: flex-end; }
  .sig-block { text-align: center; min-width: 200px; }
  .sig-line { border-top: 1px solid #374151; padding-top: 4px; font-size: 11px; color: #6b7280; margin-top: 40px; }
</style></head><body>
<div class="header">
  ${logoDataUri ? `<img src="${logoDataUri}" style="height:56px;object-fit:contain;" alt="logo"/>` : ''}
  <div>
    <div class="org-name">${this.esc(org.org_name)}</div>
    ${org.org_address ? `<div class="org-sub">${this.esc(org.org_address)}</div>` : ''}
    ${org.org_registration ? `<div class="org-sub">Reg: ${this.esc(org.org_registration)}</div>` : ''}
  </div>
</div>
<div class="doc-title">Official Receipt</div>
<div style="text-align:center;margin-bottom:16px;"><span class="ref-badge">${this.esc(receiptNumber)}</span></div>
<p style="color:#6b7280;font-size:12px;">Date: ${receivedDate}</p>
<div class="amount-box">
  <div class="big">${currency} ${formattedAmount}</div>
  <div style="font-size:12px;color:#374151;margin-top:4px;">${this.esc(amountWords)} ${currency}</div>
</div>
<table>
  <tr><td>Received From</td><td>${this.esc(payerName)}</td></tr>
  ${payerAddress ? `<tr><td>Address</td><td>${this.esc(payerAddress)}</td></tr>` : ''}
  <tr><td>Date Received</td><td>${receivedDate}</td></tr>
  ${entry.reference ? `<tr><td>Payment Reference</td><td>${this.esc(entry.reference)}</td></tr>` : ''}
  <tr><td>Received Into</td><td>${this.esc(entry.account?.name ?? '—')}</td></tr>
  ${entry.grant ? `<tr><td>Grant / Program</td><td>${this.esc(entry.grant.name)}${(entry.grant as any).restrictionType ? ` (${this.esc((entry.grant as any).restrictionType)})` : ''}</td></tr>` : ''}
  ${entry.pledge ? `<tr><td>Pledge Reference</td><td>${this.esc((entry.pledge as any).pledgeNumber)}</td></tr>` : ''}
  ${entry.notes ? `<tr><td>Notes</td><td>${this.esc(entry.notes)}</td></tr>` : ''}
</table>
<div class="clause">
  This is an official acknowledgment of funds received by ${this.esc(org.org_name)}.
</div>
<div class="signatory">
  <div class="sig-block">
    <div class="sig-line">${this.esc(org.org_name)}<br/>Authorized Signatory</div>
  </div>
</div>
</body></html>`;

    const buffer = await this.pdfService.renderPdfFromHtml(html);
    const fileName = `funder-receipt-${receiptNumber.replace(/\//g, '-')}.pdf`;
    return { file_name: fileName, mime_type: 'application/pdf', content_base64: buffer.toString('base64') };
  }
```

- [ ] **Step 3: Add PDF endpoints to finance.controller.ts**

After the `deletePledge` endpoint added in Task 3, add:

```typescript
  @Get('pledges/:id/acknowledgment')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Download Pledge Acknowledgment PDF' })
  downloadPledgeAcknowledgment(@Param('id') id: string) {
    return this.financeService.generatePledgeAcknowledgmentPdf(id);
  }
```

After the existing `listIncome` endpoint block, add:

```typescript
  @Get('income/:id/receipt')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Download Funder Receipt PDF for an income entry' })
  downloadFunderReceipt(@Param('id') id: string) {
    return this.financeService.generateFunderReceiptPdf(id);
  }
```

- [ ] **Step 4: Build to verify no TypeScript errors**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal/api
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add api/src/modules/finance/finance.service.ts \
        api/src/modules/finance/finance.controller.ts
git commit -m "feat(finance): add pledge acknowledgment and funder receipt PDF generation"
```

---

### Task 6: Frontend resourceApi — donor, grant, pledge methods

**Files:**
- Modify: `apps/shared/src/api/resource-api.ts`

**Interfaces:**
- Produces (all on the `resourceApi` object):
  - `listFinanceDonors(params?)` → `{ result: Donor[], total, page, pages, per_page }`
  - `createFinanceDonor(payload)` → donor object
  - `updateFinanceDonor(id, payload)` → donor object
  - `deleteFinanceDonor(id)` → void
  - `listFinanceGrants(params?)` → `{ result: Grant[], total, page, pages, per_page }`
  - `createFinanceGrant(payload)` → grant object
  - `updateFinanceGrant(id, payload)` → grant object
  - `deleteFinanceGrant(id)` → void
  - `listFinancePledges(params?)` → `{ result: Pledge[], total, page, pages, per_page }`
  - `createFinancePledge(payload)` → pledge object
  - `updateFinancePledge(id, payload)` → pledge object
  - `deleteFinancePledge(id)` → void
  - `downloadPledgeAcknowledgment(id)` → `{ file_name, mime_type, content_base64 }`
  - `downloadFunderReceipt(id)` → `{ file_name, mime_type, content_base64 }`

- [ ] **Step 1: Add methods after the createFinanceIncome method (around line 575)**

In `apps/shared/src/api/resource-api.ts`, after the closing `},` of `createFinanceIncome`, add:

```typescript
    async listFinanceDonors(params?: Record<string, unknown>) {
      const query = new URLSearchParams();
      if (params) Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') query.set(k, String(v)); });
      const qs = query.toString();
      const response = await httpRequest<any>(qs ? `/finance/donors?${qs}` : '/finance/donors');
      const d = response?.data ?? response;
      if (!d || typeof d !== 'object' || Array.isArray(d) || !Array.isArray(d.result)) {
        return { result: Array.isArray(d) ? d : [], total: 0, page: 1, pages: 1, per_page: 100 };
      }
      return { result: d.result, total: Number(d.total ?? 0), page: Number(d.page ?? 1), pages: Number(d.pages ?? 1), per_page: Number(d.per_page ?? 100) };
    },

    async createFinanceDonor(payload: Record<string, unknown>) {
      const response = await httpRequest<any>('/finance/donors', { method: 'POST', body: payload });
      return response?.data;
    },

    async updateFinanceDonor(id: string, payload: Record<string, unknown>) {
      const response = await httpRequest<any>(`/finance/donors/${id}`, { method: 'POST', body: payload });
      return response?.data;
    },

    async deleteFinanceDonor(id: string) {
      await httpRequest<any>(`/finance/donors/${id}`, { method: 'DELETE' });
    },

    async listFinanceGrants(params?: Record<string, unknown>) {
      const query = new URLSearchParams();
      if (params) Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') query.set(k, String(v)); });
      const qs = query.toString();
      const response = await httpRequest<any>(qs ? `/finance/grants?${qs}` : '/finance/grants');
      const d = response?.data ?? response;
      if (!d || typeof d !== 'object' || Array.isArray(d) || !Array.isArray(d.result)) {
        return { result: Array.isArray(d) ? d : [], total: 0, page: 1, pages: 1, per_page: 100 };
      }
      return { result: d.result, total: Number(d.total ?? 0), page: Number(d.page ?? 1), pages: Number(d.pages ?? 1), per_page: Number(d.per_page ?? 100) };
    },

    async createFinanceGrant(payload: Record<string, unknown>) {
      const response = await httpRequest<any>('/finance/grants', { method: 'POST', body: payload });
      return response?.data;
    },

    async updateFinanceGrant(id: string, payload: Record<string, unknown>) {
      const response = await httpRequest<any>(`/finance/grants/${id}`, { method: 'POST', body: payload });
      return response?.data;
    },

    async deleteFinanceGrant(id: string) {
      await httpRequest<any>(`/finance/grants/${id}`, { method: 'DELETE' });
    },

    async listFinancePledges(params?: Record<string, unknown>) {
      const query = new URLSearchParams();
      if (params) Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') query.set(k, String(v)); });
      const qs = query.toString();
      const response = await httpRequest<any>(qs ? `/finance/pledges?${qs}` : '/finance/pledges');
      const d = response?.data ?? response;
      if (!d || typeof d !== 'object' || Array.isArray(d) || !Array.isArray(d.result)) {
        throw new Error('/finance/pledges must return paginated result.');
      }
      return { result: d.result, total: Number(d.total ?? 0), page: Number(d.page ?? 1), pages: Number(d.pages ?? 1), per_page: Number(d.per_page ?? 20) };
    },

    async createFinancePledge(payload: Record<string, unknown>) {
      const response = await httpRequest<any>('/finance/pledges', { method: 'POST', body: payload });
      return response?.data;
    },

    async updateFinancePledge(id: string, payload: Record<string, unknown>) {
      const response = await httpRequest<any>(`/finance/pledges/${id}`, { method: 'POST', body: payload });
      return response?.data;
    },

    async deleteFinancePledge(id: string) {
      await httpRequest<any>(`/finance/pledges/${id}`, { method: 'DELETE' });
    },

    async downloadPledgeAcknowledgment(id: string) {
      const response = await httpRequest<any>(`/finance/pledges/${id}/acknowledgment`);
      return response?.data ?? response;
    },

    async downloadFunderReceipt(id: string) {
      const response = await httpRequest<any>(`/finance/income/${id}/receipt`);
      return response?.data ?? response;
    },
```

- [ ] **Step 2: Build shared package to verify**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal/apps/shared
npx tsc --noEmit 2>/dev/null || echo "check tsconfig"
```

Expected: No errors (or the shared package may not have a standalone tsconfig — proceed if no errors from the pwa build).

- [ ] **Step 3: Commit**

```bash
git add apps/shared/src/api/resource-api.ts
git commit -m "feat(finance): add donor, grant, pledge, and PDF download methods to resourceApi"
```

---

### Task 7: Frontend — Donors Page

**Files:**
- Create: `apps/pwa/src/pages/finance/donors/FinanceDonorsPage.tsx`

**Interfaces:**
- Consumes: `resourceApi.listFinanceDonors`, `resourceApi.createFinanceDonor`, `resourceApi.updateFinanceDonor`, `resourceApi.deleteFinanceDonor` (Task 6)
- Produces: `/finance/donors` page (route wired in Task 10)

- [ ] **Step 1: Create the Donors page**

Create `apps/pwa/src/pages/finance/donors/FinanceDonorsPage.tsx`:

```tsx
import { useState, useMemo } from "react";
import {
  AppShell, Button, Chip, Icon, PageHeader, SectionCard, SelectField,
  StatCard, useToast, DataTable, ColumnDef,
} from "@/shared";
import { useAuth } from "@/shared/context/AuthProvider";
import { resourceApi, useCachedQuery } from "@/shared/lib/core";
import { buildAppMobileNav, buildAppNavigation } from "@/shared/navigation";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";

const EMPTY_FORM = { name: "", donor_type: "grantor", email: "", phone: "", address: "" };

export default function FinanceDonorsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [listKey, setListKey] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const { data: profile } = useCachedQuery("finance:profile", () => getWorkspaceProfile(), { ttlMs: 60_000, storage: "memory" });
  const { data: donorData, loading, refetch } = useCachedQuery(
    `finance:donors:${listKey}:${search}:${page}:${perPage}`,
    () => resourceApi.listFinanceDonors({ search: search || undefined, page, per_page: perPage }),
    { ttlMs: 0, storage: "memory" },
  );

  const donors = Array.isArray(donorData?.result) ? donorData.result : [];
  const totalDonors = Number(donorData?.total ?? 0);
  const pagination = { page: donorData?.page ?? page, pages: donorData?.pages ?? 1, total_result: donorData?.total ?? 0 };

  const openCreate = () => { setForm({ ...EMPTY_FORM }); setEditId(null); setShowModal(true); };
  const openEdit = (d: any) => { setForm({ name: d.name, donor_type: d.donor_type ?? "grantor", email: d.email ?? "", phone: d.phone ?? "", address: d.address ?? "" }); setEditId(d.id); setShowModal(true); };

  const saveDonor = async () => {
    if (!form.name.trim()) { showToast({ tone: "warning", title: "Missing field", message: "Name is required." }); return; }
    setSaving(true);
    try {
      if (editId) {
        await resourceApi.updateFinanceDonor(editId, { name: form.name, donor_type: form.donor_type, email: form.email || undefined, phone: form.phone || undefined, address: form.address || undefined });
      } else {
        await resourceApi.createFinanceDonor({ name: form.name, donor_type: form.donor_type, email: form.email || undefined, phone: form.phone || undefined, address: form.address || undefined });
      }
      setShowModal(false); setListKey((k) => k + 1);
      showToast({ tone: "success", title: "Saved", message: `Donor ${editId ? "updated" : "created"}.` });
    } catch (e) {
      showToast({ tone: "danger", title: "Save failed", message: e instanceof Error ? e.message : "Unable to save." });
    } finally { setSaving(false); }
  };

  const deleteDonor = async (id: string) => {
    if (!confirm("Delete this donor?")) return;
    try { await resourceApi.deleteFinanceDonor(id); setListKey((k) => k + 1); showToast({ tone: "success", title: "Deleted", message: "Donor removed." }); }
    catch (e) { showToast({ tone: "danger", title: "Delete failed", message: e instanceof Error ? e.message : "Unable to delete." }); }
  };

  const userName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.email || "Finance";

  const columns: ColumnDef<any>[] = useMemo(() => [
    { header: "Name", cell: (d: any) => d.name },
    { header: "Type", cell: (d: any) => d.donor_type ? <Chip variant="neutral">{d.donor_type}</Chip> : "-" },
    { header: "Email", cell: (d: any) => d.email || "-" },
    { header: "Phone", cell: (d: any) => d.phone || "-" },
    {
      header: "Actions",
      cell: (d: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => openEdit(d)}><Icon name="edit" className="text-[16px]" /></Button>
          <Button size="sm" variant="ghost" onClick={() => void deleteDonor(d.id)}><Icon name="delete" className="text-[16px] text-red-500" /></Button>
        </div>
      ),
    },
  ], []);

  return (
    <AppShell navigation={buildAppNavigation({ requestDetailsParent: "finance" })} activeLabel="finance-donors" user={{ name: userName, role: profile?.employee_profile?.job_title || "Finance" }} mobileNav={buildAppMobileNav("Dashboard")}>
      <PageHeader breadcrumbs={[{ label: "Finance", path: "/finance" }, { label: "Donors" }]} title="Donors" description="Manage funder and donor directory." />
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <StatCard label="Total Donors" value={String(totalDonors)} tone="neutral" />
        </div>
        <section className="section-card p-4 sm:p-5">
          <div className="flex flex-wrap items-end gap-3">
            <label className="grid gap-1.5 text-sm flex-1 min-w-[180px]">
              <span className="font-semibold text-slate-700">Search</span>
              <input type="search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name" className="rounded-2xl border border-slate-200 bg-white px-4 py-[0.6rem] text-sm font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-brand-900/10" />
            </label>
            <Button variant="secondary" size="sm" onClick={() => void refetch()}><Icon name="refresh" className="text-[16px]" /> Refresh</Button>
            <Button onClick={openCreate}><Icon name="add" className="text-[18px]" /> Add Donor</Button>
          </div>
        </section>
        <SectionCard title="All Donors" description="Track donors and grantors." action={totalDonors > 0 ? <Chip variant="neutral">{totalDonors} donor{totalDonors !== 1 ? "s" : ""}</Chip> : null}>
          <DataTable columns={columns} data={donors} loading={loading} error={null} caption="Donors" emptyTitle="No donors found" emptyDescription="Add your first donor or grantor."
            pagination={{ page: Number(pagination.page || page), totalPages: Number(pagination.pages || 1), totalCount: Number(pagination.total_result || 0), perPage, onPageChange: setPage, onPerPageChange: (v) => { setPerPage(v); setPage(1); } }} />
        </SectionCard>
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-900">{editId ? "Edit Donor" : "Add Donor"}</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}><Icon name="close" /></Button>
            </div>
            <div className="grid gap-4 p-6 md:grid-cols-2">
              <label className="grid gap-1.5 text-sm md:col-span-2">
                <span className="font-semibold text-slate-700">Name <span className="text-red-500">*</span></span>
                <input className="rounded-2xl border border-slate-200 px-4 py-2.5" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </label>
              <SelectField label="Type" value={form.donor_type} onChange={(e) => setForm((f) => ({ ...f, donor_type: e.target.value }))}>
                <option value="grantor">Grantor</option>
                <option value="donor">Donor</option>
                <option value="government">Government</option>
                <option value="corporate">Corporate</option>
                <option value="individual">Individual</option>
              </SelectField>
              <label className="grid gap-1.5 text-sm">
                <span className="font-semibold text-slate-700">Email</span>
                <input type="email" className="rounded-2xl border border-slate-200 px-4 py-2.5" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="font-semibold text-slate-700">Phone</span>
                <input className="rounded-2xl border border-slate-200 px-4 py-2.5" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </label>
              <label className="grid gap-1.5 text-sm md:col-span-2">
                <span className="font-semibold text-slate-700">Address</span>
                <textarea className="rounded-2xl border border-slate-200 px-4 py-2.5" rows={2} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={() => void saveDonor()} disabled={saving}>{saving ? "Saving..." : editId ? "Update Donor" : "Add Donor"}</Button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/pwa/src/pages/finance/donors/FinanceDonorsPage.tsx
git commit -m "feat(finance): add Donors management page"
```

---

### Task 8: Frontend — Grants Page

**Files:**
- Create: `apps/pwa/src/pages/finance/grants/FinanceGrantsPage.tsx`

**Interfaces:**
- Consumes: `resourceApi.listFinanceGrants`, `resourceApi.createFinanceGrant`, `resourceApi.updateFinanceGrant`, `resourceApi.deleteFinanceGrant`, `resourceApi.listFinanceDonors` (Task 6)
- Produces: `/finance/grants` page

- [ ] **Step 1: Create the Grants page**

Create `apps/pwa/src/pages/finance/grants/FinanceGrantsPage.tsx`:

```tsx
import { useState, useMemo } from "react";
import {
  AppShell, Button, Chip, Icon, PageHeader, SectionCard, SelectField,
  StatCard, useToast, DataTable, ColumnDef,
} from "@/shared";
import { useAuth } from "@/shared/context/AuthProvider";
import { resourceApi, useCachedQuery } from "@/shared/lib/core";
import { buildAppMobileNav, buildAppNavigation } from "@/shared/navigation";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import { formatCurrency, formatDate } from "@stanforte/shared";

const EMPTY_FORM = { code: "", name: "", donor_id: "", restriction_type: "unrestricted", start_date: "", end_date: "", committed_amount: "", status: "active", purpose: "", notes: "" };

function statusColor(status: string) {
  if (status === "active") return "success";
  if (status === "closed") return "neutral";
  if (status === "cancelled") return "danger";
  return "neutral";
}

export default function FinanceGrantsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [listKey, setListKey] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const { data: profile } = useCachedQuery("finance:profile", () => getWorkspaceProfile(), { ttlMs: 60_000, storage: "memory" });
  const { data: grantData, loading, refetch } = useCachedQuery(
    `finance:grants:${listKey}:${search}:${page}:${perPage}`,
    () => resourceApi.listFinanceGrants({ search: search || undefined, page, per_page: perPage }),
    { ttlMs: 0, storage: "memory" },
  );
  const { data: donorData } = useCachedQuery("finance:donors:all", () => resourceApi.listFinanceDonors({ per_page: 200 }), { ttlMs: 60_000, storage: "memory" });

  const grants = Array.isArray(grantData?.result) ? grantData.result : [];
  const totalGrants = Number(grantData?.total ?? 0);
  const donors = Array.isArray(donorData?.result) ? donorData.result : [];
  const pagination = { page: grantData?.page ?? page, pages: grantData?.pages ?? 1, total_result: grantData?.total ?? 0 };

  const openCreate = () => { setForm({ ...EMPTY_FORM }); setEditId(null); setShowModal(true); };
  const openEdit = (g: any) => {
    setForm({ code: g.code, name: g.name, donor_id: g.donor_id ?? "", restriction_type: g.restriction_type ?? "unrestricted", start_date: g.start_date ? String(g.start_date).slice(0, 10) : "", end_date: g.end_date ? String(g.end_date).slice(0, 10) : "", committed_amount: g.committed_amount ? String(g.committed_amount) : "", status: g.status ?? "active", purpose: g.purpose ?? "", notes: g.notes ?? "" });
    setEditId(g.id); setShowModal(true);
  };

  const saveGrant = async () => {
    if (!form.code.trim() || !form.name.trim()) { showToast({ tone: "warning", title: "Missing fields", message: "Code and name are required." }); return; }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { code: form.code, name: form.name, restriction_type: form.restriction_type, status: form.status, donor_id: form.donor_id || undefined, start_date: form.start_date || undefined, end_date: form.end_date || undefined, committed_amount: form.committed_amount ? Number(form.committed_amount) : undefined, purpose: form.purpose || undefined, notes: form.notes || undefined };
      if (editId) { await resourceApi.updateFinanceGrant(editId, payload); } else { await resourceApi.createFinanceGrant(payload); }
      setShowModal(false); setListKey((k) => k + 1);
      showToast({ tone: "success", title: "Saved", message: `Grant ${editId ? "updated" : "created"}.` });
    } catch (e) { showToast({ tone: "danger", title: "Save failed", message: e instanceof Error ? e.message : "Unable to save." }); }
    finally { setSaving(false); }
  };

  const deleteGrant = async (id: string) => {
    if (!confirm("Delete this grant?")) return;
    try { await resourceApi.deleteFinanceGrant(id); setListKey((k) => k + 1); showToast({ tone: "success", title: "Deleted", message: "Grant removed." }); }
    catch (e) { showToast({ tone: "danger", title: "Delete failed", message: e instanceof Error ? e.message : "Unable to delete." }); }
  };

  const userName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.email || "Finance";

  const columns: ColumnDef<any>[] = useMemo(() => [
    { header: "Code", cell: (g: any) => <span className="font-mono text-sm">{g.code}</span> },
    { header: "Name", cell: (g: any) => g.name },
    { header: "Donor", cell: (g: any) => g.donor?.name ?? "-" },
    { header: "Restriction", cell: (g: any) => g.restriction_type ? <Chip variant="neutral">{g.restriction_type}</Chip> : "-" },
    { header: "Committed", cell: (g: any) => g.committed_amount ? formatCurrency(Number(g.committed_amount)) : "-", className: "text-right" },
    { header: "Status", cell: (g: any) => <Chip variant={statusColor(g.status ?? "")}>{g.status ?? "-"}</Chip> },
    {
      header: "Actions",
      cell: (g: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => openEdit(g)}><Icon name="edit" className="text-[16px]" /></Button>
          <Button size="sm" variant="ghost" onClick={() => void deleteGrant(g.id)}><Icon name="delete" className="text-[16px] text-red-500" /></Button>
        </div>
      ),
    },
  ], []);

  return (
    <AppShell navigation={buildAppNavigation({ requestDetailsParent: "finance" })} activeLabel="finance-grants" user={{ name: userName, role: profile?.employee_profile?.job_title || "Finance" }} mobileNav={buildAppMobileNav("Dashboard")}>
      <PageHeader breadcrumbs={[{ label: "Finance", path: "/finance" }, { label: "Grants" }]} title="Grants" description="Manage grant programs and funding agreements." />
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <StatCard label="Total Grants" value={String(totalGrants)} tone="neutral" />
        </div>
        <section className="section-card p-4 sm:p-5">
          <div className="flex flex-wrap items-end gap-3">
            <label className="grid gap-1.5 text-sm flex-1 min-w-[180px]">
              <span className="font-semibold text-slate-700">Search</span>
              <input type="search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name or code" className="rounded-2xl border border-slate-200 bg-white px-4 py-[0.6rem] text-sm font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-brand-900/10" />
            </label>
            <Button variant="secondary" size="sm" onClick={() => void refetch()}><Icon name="refresh" className="text-[16px]" /> Refresh</Button>
            <Button onClick={openCreate}><Icon name="add" className="text-[18px]" /> Add Grant</Button>
          </div>
        </section>
        <SectionCard title="All Grants" description="Grant programs and funding agreements." action={totalGrants > 0 ? <Chip variant="neutral">{totalGrants} grant{totalGrants !== 1 ? "s" : ""}</Chip> : null}>
          <DataTable columns={columns} data={grants} loading={loading} error={null} caption="Grants" emptyTitle="No grants found" emptyDescription="Add your first grant program."
            pagination={{ page: Number(pagination.page || page), totalPages: Number(pagination.pages || 1), totalCount: Number(pagination.total_result || 0), perPage, onPageChange: setPage, onPerPageChange: (v) => { setPerPage(v); setPage(1); } }} />
        </SectionCard>
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-900">{editId ? "Edit Grant" : "Add Grant"}</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}><Icon name="close" /></Button>
            </div>
            <div className="grid gap-4 p-6 md:grid-cols-2">
              <label className="grid gap-1.5 text-sm">
                <span className="font-semibold text-slate-700">Code <span className="text-red-500">*</span></span>
                <input className="rounded-2xl border border-slate-200 px-4 py-2.5 font-mono" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="GRT-2026-001" />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="font-semibold text-slate-700">Name <span className="text-red-500">*</span></span>
                <input className="rounded-2xl border border-slate-200 px-4 py-2.5" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </label>
              <SelectField label="Donor" value={form.donor_id} onChange={(e) => setForm((f) => ({ ...f, donor_id: e.target.value }))}>
                <option value="">None</option>
                {donors.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </SelectField>
              <SelectField label="Restriction Type" value={form.restriction_type} onChange={(e) => setForm((f) => ({ ...f, restriction_type: e.target.value }))}>
                <option value="unrestricted">Unrestricted</option>
                <option value="restricted">Restricted</option>
                <option value="temporarily_restricted">Temporarily Restricted</option>
              </SelectField>
              <label className="grid gap-1.5 text-sm">
                <span className="font-semibold text-slate-700">Committed Amount</span>
                <input type="number" className="rounded-2xl border border-slate-200 px-4 py-2.5" value={form.committed_amount} onChange={(e) => setForm((f) => ({ ...f, committed_amount: e.target.value }))} />
              </label>
              <SelectField label="Status" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
                <option value="cancelled">Cancelled</option>
              </SelectField>
              <label className="grid gap-1.5 text-sm">
                <span className="font-semibold text-slate-700">Start Date</span>
                <input type="date" className="rounded-2xl border border-slate-200 px-4 py-2.5" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="font-semibold text-slate-700">End Date</span>
                <input type="date" className="rounded-2xl border border-slate-200 px-4 py-2.5" value={form.end_date} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))} />
              </label>
              <label className="grid gap-1.5 text-sm md:col-span-2">
                <span className="font-semibold text-slate-700">Purpose</span>
                <textarea className="rounded-2xl border border-slate-200 px-4 py-2.5" rows={2} value={form.purpose} onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))} />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={() => void saveGrant()} disabled={saving}>{saving ? "Saving..." : editId ? "Update Grant" : "Add Grant"}</Button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/pwa/src/pages/finance/grants/FinanceGrantsPage.tsx
git commit -m "feat(finance): add Grants management page"
```

---

### Task 9: Frontend — Pledges Page

**Files:**
- Create: `apps/pwa/src/pages/finance/pledges/FinancePledgesPage.tsx`

**Interfaces:**
- Consumes: `resourceApi.listFinancePledges`, `resourceApi.createFinancePledge`, `resourceApi.updateFinancePledge`, `resourceApi.deleteFinancePledge`, `resourceApi.downloadPledgeAcknowledgment`, `resourceApi.listFinanceDonors`, `resourceApi.listFinanceGrants` (Task 6)
- `downloadBase64File` from `@/shared/lib/download`
- Produces: `/finance/pledges` page

- [ ] **Step 1: Create the Pledges page**

Create `apps/pwa/src/pages/finance/pledges/FinancePledgesPage.tsx`:

```tsx
import { useState, useMemo } from "react";
import {
  AppShell, Button, Chip, Icon, PageHeader, SectionCard, SelectField,
  StatCard, useToast, DataTable, ColumnDef,
} from "@/shared";
import { useAuth } from "@/shared/context/AuthProvider";
import { resourceApi, useCachedQuery } from "@/shared/lib/core";
import { buildAppMobileNav, buildAppNavigation } from "@/shared/navigation";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import { formatCurrency, formatDate } from "@stanforte/shared";
import { downloadBase64File } from "@/shared/lib/download";

const EMPTY_FORM = { donor_id: "", grant_id: "", amount: "", currency: "NGN", pledged_at: new Date().toISOString().slice(0, 10), expected_at: "", purpose: "", notes: "" };

function statusColor(status: string) {
  if (status === "fulfilled") return "success";
  if (status === "partial") return "warning";
  if (status === "cancelled") return "danger";
  return "neutral";
}

export default function FinancePledgesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [listKey, setListKey] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const { data: profile } = useCachedQuery("finance:profile", () => getWorkspaceProfile(), { ttlMs: 60_000, storage: "memory" });
  const { data: pledgeData, loading, refetch } = useCachedQuery(
    `finance:pledges:${listKey}:${search}:${statusFilter}:${page}:${perPage}`,
    () => resourceApi.listFinancePledges({ search: search || undefined, status: statusFilter || undefined, page, per_page: perPage }),
    { ttlMs: 0, storage: "memory" },
  );
  const { data: donorData } = useCachedQuery("finance:donors:all", () => resourceApi.listFinanceDonors({ per_page: 200 }), { ttlMs: 60_000, storage: "memory" });
  const { data: grantData } = useCachedQuery("finance:grants:all", () => resourceApi.listFinanceGrants({ per_page: 200 }), { ttlMs: 60_000, storage: "memory" });

  const pledges = Array.isArray(pledgeData?.result) ? pledgeData.result : [];
  const totalPledges = Number(pledgeData?.total ?? 0);
  const donors = Array.isArray(donorData?.result) ? donorData.result : [];
  const grants = Array.isArray(grantData?.result) ? grantData.result : [];
  const pagination = { page: pledgeData?.page ?? page, pages: pledgeData?.pages ?? 1, total_result: pledgeData?.total ?? 0 };

  const openCreate = () => { setForm({ ...EMPTY_FORM }); setEditId(null); setShowModal(true); };
  const openEdit = (p: any) => {
    setForm({ donor_id: p.donor_id ?? "", grant_id: p.grant_id ?? "", amount: String(p.amount), currency: p.currency ?? "NGN", pledged_at: p.pledged_at ? String(p.pledged_at).slice(0, 10) : "", expected_at: p.expected_at ? String(p.expected_at).slice(0, 10) : "", purpose: p.purpose ?? "", notes: p.notes ?? "" });
    setEditId(p.id); setShowModal(true);
  };

  const savePledge = async () => {
    if (!form.donor_id || !form.amount || !form.pledged_at) { showToast({ tone: "warning", title: "Missing fields", message: "Donor, amount and pledge date are required." }); return; }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { donor_id: form.donor_id, grant_id: form.grant_id || undefined, amount: Number(form.amount), currency: form.currency, pledged_at: form.pledged_at, expected_at: form.expected_at || undefined, purpose: form.purpose || undefined, notes: form.notes || undefined };
      if (editId) { await resourceApi.updateFinancePledge(editId, payload); } else { await resourceApi.createFinancePledge(payload); }
      setShowModal(false); setListKey((k) => k + 1);
      showToast({ tone: "success", title: "Saved", message: `Pledge ${editId ? "updated" : "recorded"}.` });
    } catch (e) { showToast({ tone: "danger", title: "Save failed", message: e instanceof Error ? e.message : "Unable to save." }); }
    finally { setSaving(false); }
  };

  const cancelPledge = async (id: string) => {
    if (!confirm("Cancel this pledge?")) return;
    try { await resourceApi.deleteFinancePledge(id); setListKey((k) => k + 1); showToast({ tone: "success", title: "Cancelled", message: "Pledge cancelled." }); }
    catch (e) { showToast({ tone: "danger", title: "Failed", message: e instanceof Error ? e.message : "Unable to cancel pledge." }); }
  };

  const downloadAck = async (p: any) => {
    setDownloading(p.id);
    try {
      const result = await resourceApi.downloadPledgeAcknowledgment(p.id);
      downloadBase64File(result.file_name, result.mime_type, result.content_base64);
    } catch (e) { showToast({ tone: "danger", title: "Download failed", message: e instanceof Error ? e.message : "Unable to download." }); }
    finally { setDownloading(null); }
  };

  const userName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.email || "Finance";

  const columns: ColumnDef<any>[] = useMemo(() => [
    { header: "Pledge #", cell: (p: any) => <span className="font-mono text-sm">{p.pledge_number}</span> },
    { header: "Donor", cell: (p: any) => p.donor?.name ?? "-" },
    { header: "Grant", cell: (p: any) => p.grant?.name ?? "-" },
    { header: "Pledged", cell: (p: any) => formatDate(p.pledged_at) },
    { header: "Pledged Amount", cell: (p: any) => formatCurrency(Number(p.amount ?? 0), p.currency || "NGN"), className: "text-right font-medium" },
    { header: "Received", cell: (p: any) => formatCurrency(Number(p.received_amount ?? 0), p.currency || "NGN"), className: "text-right" },
    { header: "Status", cell: (p: any) => <Chip variant={statusColor(p.status ?? "")}>{p.status ?? "-"}</Chip> },
    {
      header: "Actions",
      cell: (p: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => void downloadAck(p)} disabled={downloading === p.id}>
            <Icon name={downloading === p.id ? "hourglass_empty" : "download"} className="text-[16px]" />
          </Button>
          {["pending", "partial"].includes(p.status) && (
            <Button size="sm" variant="ghost" onClick={() => openEdit(p)}><Icon name="edit" className="text-[16px]" /></Button>
          )}
          {p.status === "pending" && (
            <Button size="sm" variant="ghost" onClick={() => void cancelPledge(p.id)}><Icon name="cancel" className="text-[16px] text-red-500" /></Button>
          )}
        </div>
      ),
    },
  ], [downloading]);

  return (
    <AppShell navigation={buildAppNavigation({ requestDetailsParent: "finance" })} activeLabel="finance-pledges" user={{ name: userName, role: profile?.employee_profile?.job_title || "Finance" }} mobileNav={buildAppMobileNav("Dashboard")}>
      <PageHeader breadcrumbs={[{ label: "Finance", path: "/finance" }, { label: "Pledges" }]} title="Pledges" description="Track funding commitments from donors and grantors." />
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Total Pledges" value={String(totalPledges)} tone="neutral" />
          <StatCard label="Pending" value={String(pledges.filter((p: any) => p.status === "pending").length)} tone="neutral" />
          <StatCard label="Fulfilled" value={String(pledges.filter((p: any) => p.status === "fulfilled").length)} tone="neutral" />
        </div>
        <section className="section-card p-4 sm:p-5">
          <div className="flex flex-wrap items-end gap-3">
            <label className="grid gap-1.5 text-sm flex-1 min-w-[180px]">
              <span className="font-semibold text-slate-700">Search</span>
              <input type="search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by donor or pledge number" className="rounded-2xl border border-slate-200 bg-white px-4 py-[0.6rem] text-sm font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-brand-900/10" />
            </label>
            <SelectField label="Status" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="cancelled">Cancelled</option>
            </SelectField>
            <Button variant="secondary" size="sm" onClick={() => void refetch()}><Icon name="refresh" className="text-[16px]" /> Refresh</Button>
            <Button onClick={openCreate}><Icon name="add" className="text-[18px]" /> Record Pledge</Button>
          </div>
        </section>
        <SectionCard title="All Pledges" description="Funding commitments and their receipt status." action={totalPledges > 0 ? <Chip variant="neutral">{totalPledges} pledge{totalPledges !== 1 ? "s" : ""}</Chip> : null}>
          <DataTable columns={columns} data={pledges} loading={loading} error={null} caption="Pledges" emptyTitle="No pledges found" emptyDescription="Record a pledge when a donor commits funds."
            pagination={{ page: Number(pagination.page || page), totalPages: Number(pagination.pages || 1), totalCount: Number(pagination.total_result || 0), perPage, onPageChange: setPage, onPerPageChange: (v) => { setPerPage(v); setPage(1); } }} />
        </SectionCard>
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-900">{editId ? "Edit Pledge" : "Record Pledge"}</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}><Icon name="close" /></Button>
            </div>
            <div className="grid gap-4 p-6 md:grid-cols-2">
              <SelectField label="Donor *" value={form.donor_id} onChange={(e) => setForm((f) => ({ ...f, donor_id: e.target.value }))}>
                <option value="">Select donor</option>
                {donors.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </SelectField>
              <SelectField label="Grant (optional)" value={form.grant_id} onChange={(e) => setForm((f) => ({ ...f, grant_id: e.target.value }))}>
                <option value="">None</option>
                {grants.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </SelectField>
              <label className="grid gap-1.5 text-sm">
                <span className="font-semibold text-slate-700">Amount <span className="text-red-500">*</span></span>
                <input type="number" className="rounded-2xl border border-slate-200 px-4 py-2.5" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="font-semibold text-slate-700">Currency</span>
                <input className="rounded-2xl border border-slate-200 px-4 py-2.5" value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value.toUpperCase() }))} />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="font-semibold text-slate-700">Pledge Date <span className="text-red-500">*</span></span>
                <input type="date" className="rounded-2xl border border-slate-200 px-4 py-2.5" value={form.pledged_at} onChange={(e) => setForm((f) => ({ ...f, pledged_at: e.target.value }))} />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="font-semibold text-slate-700">Expected Receipt Date</span>
                <input type="date" className="rounded-2xl border border-slate-200 px-4 py-2.5" value={form.expected_at} onChange={(e) => setForm((f) => ({ ...f, expected_at: e.target.value }))} />
              </label>
              <label className="grid gap-1.5 text-sm md:col-span-2">
                <span className="font-semibold text-slate-700">Purpose</span>
                <textarea className="rounded-2xl border border-slate-200 px-4 py-2.5" rows={2} value={form.purpose} onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))} />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={() => void savePledge()} disabled={saving}>{saving ? "Saving..." : editId ? "Update Pledge" : "Record Pledge"}</Button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/pwa/src/pages/finance/pledges/FinancePledgesPage.tsx
git commit -m "feat(finance): add Pledges management page with acknowledgment download"
```

---

### Task 10: Frontend — Income Page Upgrade (donor/pledge selectors + Funder Receipt download)

**Files:**
- Modify: `apps/pwa/src/pages/finance/income/FinanceIncomePage.tsx`

**Interfaces:**
- Consumes: `resourceApi.listFinanceDonors`, `resourceApi.listFinancePledges`, `resourceApi.downloadFunderReceipt` (Task 6)
- `downloadBase64File` from `@/shared/lib/download`

- [ ] **Step 1: Add donor_id, pledge_id to form state and queries**

In `FinanceIncomePage.tsx`:

1. Add `downloadBase64File` import at the top:
```tsx
import { downloadBase64File } from "@/shared/lib/download";
```

2. Add `donor_id: ""` and `pledge_id: ""` to the `form` state initial object (both in `useState` and in `openCreate`).

3. Add these two queries after the existing `funds` query:
```tsx
  const { data: donorData } = useCachedQuery(
    "finance:donors:all",
    () => resourceApi.listFinanceDonors({ per_page: 200 }),
    { ttlMs: 60_000, storage: "memory" },
  );

  const { data: pledgeData } = useCachedQuery(
    `finance:pledges:open:${form.donor_id}`,
    () => form.donor_id
      ? resourceApi.listFinancePledges({ donor_id: form.donor_id, per_page: 50 })
      : Promise.resolve({ result: [] }),
    { ttlMs: 0, storage: "memory" },
  );

  const donors = Array.isArray(donorData?.result) ? donorData.result : [];
  const openPledges = (Array.isArray(pledgeData?.result) ? pledgeData.result : [])
    .filter((p: any) => ['pending', 'partial'].includes(p.status));
```

4. Add a `downloading` state: `const [downloading, setDownloading] = useState<string | null>(null);`

5. Add the `downloadReceipt` function:
```tsx
  const downloadReceipt = async (entry: any) => {
    setDownloading(entry.id);
    try {
      const result = await resourceApi.downloadFunderReceipt(entry.id);
      downloadBase64File(result.file_name, result.mime_type, result.content_base64);
    } catch (e) {
      showToast({ tone: "danger", title: "Download failed", message: e instanceof Error ? e.message : "Unable to download receipt." });
    } finally { setDownloading(null); }
  };
```

- [ ] **Step 2: Add donor/pledge fields to saveIncome payload**

In `saveIncome`, add `pledge_id` and `donor_id` to the `createFinanceIncome` call:
```tsx
      pledge_id: form.pledge_id || undefined,
      donor_id: form.donor_id || undefined,
```

- [ ] **Step 3: Add donor + pledge selectors to the modal form**

In the modal `<div className="grid gap-4 p-6 md:grid-cols-2">`, add these two fields before the existing "Received Into Account" field:

```tsx
              <SelectField
                label="Donor (optional)"
                value={form.donor_id}
                onChange={(e) => {
                  const donorId = e.target.value;
                  const donor = donors.find((d: any) => d.id === donorId);
                  setForm((f) => ({
                    ...f,
                    donor_id: donorId,
                    payer: donor ? donor.name : f.payer,
                    pledge_id: "",
                  }));
                }}
              >
                <option value="">Select donor</option>
                {donors.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </SelectField>

              <SelectField
                label="Pledge (optional)"
                value={form.pledge_id}
                onChange={(e) => setForm((f) => ({ ...f, pledge_id: e.target.value }))}
              >
                <option value="">None</option>
                {openPledges.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.pledge_number} — {p.currency} {Number(p.amount).toLocaleString()}
                  </option>
                ))}
              </SelectField>
```

- [ ] **Step 4: Add Download Receipt button to each income row**

Update the `columns` array to add a new final column:

```tsx
    {
      header: "",
      cell: (entry: any) => (entry.payer || entry.donor_id) ? (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => void downloadReceipt(entry)}
          disabled={downloading === entry.id}
        >
          <Icon name={downloading === entry.id ? "hourglass_empty" : "download"} className="text-[16px]" />
        </Button>
      ) : null,
    },
```

- [ ] **Step 5: Build to verify no TypeScript errors**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal
npx tsc --noEmit -p apps/pwa/tsconfig.json 2>&1 | head -30
```

Expected: No errors (or only pre-existing unrelated errors).

- [ ] **Step 6: Commit**

```bash
git add apps/pwa/src/pages/finance/income/FinanceIncomePage.tsx
git commit -m "feat(finance): add donor/pledge selectors and funder receipt download to income page"
```

---

### Task 11: Frontend — Navigation + Routes

**Files:**
- Modify: `apps/pwa/src/shared/navigation.ts`
- Modify: `apps/pwa/src/App.tsx`

**Interfaces:**
- Consumes: `FinanceDonorsPage`, `FinanceGrantsPage`, `FinancePledgesPage` (Tasks 7–9)
- Produces: `/finance/donors`, `/finance/grants`, `/finance/pledges` routes accessible from sidebar

- [ ] **Step 1: Add Funding group to navigation**

In `apps/pwa/src/shared/navigation.ts`, find the `finance-group-money-in` children array (line ~111). After the closing `],` of that group's `children`, add a new group:

```typescript
        {
          key: "finance-group-funding",
          label: "Funding",
          icon: "volunteer_activism",
          children: [
            { key: "finance-donors", label: "Donors", icon: "people", path: "/finance/donors", permissions: ["finance.manage"] },
            { key: "finance-grants", label: "Grants", icon: "workspace_premium", path: "/finance/grants", permissions: ["finance.manage"] },
            { key: "finance-pledges", label: "Pledges", icon: "handshake", path: "/finance/pledges", permissions: ["finance.manage"] },
          ],
        },
```

- [ ] **Step 2: Add routes to App.tsx**

In `apps/pwa/src/App.tsx`, add these three imports at the top with the other finance page imports:

```tsx
import FinanceDonorsPage from "@/pages/finance/donors/FinanceDonorsPage";
import FinanceGrantsPage from "@/pages/finance/grants/FinanceGrantsPage";
import FinancePledgesPage from "@/pages/finance/pledges/FinancePledgesPage";
```

Then in the routes block, add alongside the other finance routes (after `/finance/income`):

```tsx
            <Route path="/finance/donors" element={<FinanceDonorsPage />} />
            <Route path="/finance/grants" element={<FinanceGrantsPage />} />
            <Route path="/finance/pledges" element={<FinancePledgesPage />} />
```

- [ ] **Step 3: Build to verify no TypeScript errors**

```bash
cd /Users/olalekan/Projects/stanforteedge/portal
npx tsc --noEmit -p apps/pwa/tsconfig.json 2>&1 | head -30
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add apps/pwa/src/shared/navigation.ts apps/pwa/src/App.tsx
git commit -m "feat(finance): add Funding nav group and routes for donors, grants, pledges"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** All 6 scope items covered — Donors UI (Task 7), Grants UI (Task 8), Pledges model+API+UI (Tasks 1–3, 9), Income upgrade (Tasks 4, 10), Pledge Acknowledgment PDF (Task 5), Funder Receipt PDF (Task 5).
- [x] **Pledge status recompute:** Covered in Task 4 — `recomputePledgeStatus` called from `createIncome` when `pledge_id` is present.
- [x] **receipt_number lazy generation:** Covered in Task 5 `generateFunderReceiptPdf` — generated on first download, stored back to the income entry.
- [x] **Nav group:** Added "Funding" group in Task 11 with correct keys `finance-donors`, `finance-grants`, `finance-pledges` — matching `activeLabel` props used in the page components.
- [x] **Back-relations:** `FinanceDonor` and `FinanceGrant` back-relations added in Task 1.
- [x] **`FinanceIncomeEntry` not `FinanceIncome`:** All references use the correct model name throughout.
- [x] **`pledge_number` vs `pledgeNumber`:** API returns snake_case (`pledge_number`), Prisma model uses camelCase (`pledgeNumber`) — the Pledges page uses `p.pledge_number` from API responses, service creates with `pledgeNumber`. Consistent.
- [x] **No placeholders or TBDs found.**
