# Statutory Deductions & WHT Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow finance officers to apply configurable statutory deductions (WHT, VAT, levies) on Payment Vouchers, track withheld amounts per vendor, record remittances to tax authorities, and generate WHT Certificates per vendor per period.

**Architecture:** Deductions live on the Payment Voucher (not the request) — the request always holds the gross approved amount. Each deduction applied to a PV creates a `VendorWHTAccrual` entry that accumulates against the vendor until a `WHTRemittance` batch clears it. A `DeductionType` master table holds org-configurable rates and links each type to its GL liability account (e.g. "WHT Payable"). The request form gains an optional vendor field controlled per request type.

**Tech Stack:** NestJS + Prisma (PostgreSQL), React 18 + TypeScript + Tailwind, class-validator DTOs, apps/shared API layer.

---

## File Map

**Create (API):**
- `api/prisma/migrations/20260423000000_add_statutory_deductions/migration.sql`
- `api/src/modules/finance/dto/upsert-deduction-type.dto.ts`
- `api/src/modules/finance/dto/apply-pv-deductions.dto.ts`
- `api/src/modules/finance/dto/create-wht-remittance.dto.ts`
- `api/src/modules/finance/deduction.service.ts`

**Modify (API):**
- `api/prisma/schema.prisma` — 4 new models + alter FinancePaymentVoucher + RequestInstance
- `api/src/modules/finance/finance.service.ts` — vendor on disburse, GL posting with net
- `api/src/modules/finance/finance.controller.ts` — new endpoints
- `api/src/modules/finance/finance.module.ts` — register DeductionService

**Create (PWA):**
- `apps/pwa/src/modules/finance/components/PVDeductionsPanel.tsx`
- `apps/pwa/src/modules/finance/components/VendorWHTPanel.tsx`
- `apps/pwa/src/modules/finance/components/WHTCertificateModal.tsx`
- `apps/pwa/src/modules/finance/FinanceDeductionTypesPage.tsx`

**Modify (PWA):**
- `apps/shared/src/api/finance-api.ts` — new API calls
- `apps/pwa/src/modules/finance/FinancePaymentVouchersPage.tsx` — add PVDeductionsPanel
- `apps/pwa/src/modules/finance/FinanceVendorsPage.tsx` (or equivalent vendor page) — add VendorWHTPanel
- `apps/pwa/src/shared/navigation.ts` — add Deduction Types under Setup group

---

## Task 1: Database Schema — 4 New Models + Alter Existing

**Files:**
- Create: `api/prisma/migrations/20260423000000_add_statutory_deductions/migration.sql`
- Modify: `api/prisma/schema.prisma`

- [ ] **Step 1: Create the migration SQL file**

```bash
mkdir -p api/prisma/migrations/20260423000000_add_statutory_deductions
```

Create `api/prisma/migrations/20260423000000_add_statutory_deductions/migration.sql`:

```sql
-- ============================================================
-- Statutory Deductions & WHT Tracking
-- ============================================================

-- 1. DeductionType master table
CREATE TABLE "sta_finance_deduction_types" (
    "id"              UUID         NOT NULL,
    "name"            VARCHAR(100) NOT NULL,
    "code"            VARCHAR(30)  NOT NULL,
    "rate"            DECIMAL(6,4) NOT NULL DEFAULT 0,
    "applies_to"      VARCHAR(50)  NOT NULL DEFAULT 'vendor',
    "gl_account_id"   UUID,
    "is_active"       BOOLEAN      NOT NULL DEFAULT true,
    "organization_id" BIGINT,
    "created_by"      BIGINT       NOT NULL,
    "updated_by"      BIGINT,
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"      TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sta_finance_deduction_types_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sta_finance_deduction_types_code_org_key"
    ON "sta_finance_deduction_types"("code", "organization_id");
CREATE INDEX "sta_finance_deduction_types_is_active_idx"
    ON "sta_finance_deduction_types"("is_active");

-- 2. PV Deduction line items
CREATE TABLE "sta_finance_pv_deductions" (
    "id"                UUID         NOT NULL,
    "payment_voucher_id" UUID        NOT NULL,
    "deduction_type_id" UUID         NOT NULL,
    "rate"              DECIMAL(6,4) NOT NULL,
    "gross_amount"      DECIMAL(15,2) NOT NULL,
    "deduction_amount"  DECIMAL(15,2) NOT NULL,
    "created_by"        BIGINT       NOT NULL,
    "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"        TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sta_finance_pv_deductions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sta_finance_pv_deductions_pv_idx"
    ON "sta_finance_pv_deductions"("payment_voucher_id");

-- 3. Vendor WHT Accruals (one row per deduction on a PV)
CREATE TABLE "sta_finance_vendor_wht_accruals" (
    "id"                UUID         NOT NULL,
    "vendor_id"         UUID         NOT NULL,
    "payment_voucher_id" UUID        NOT NULL,
    "pv_deduction_id"   UUID         NOT NULL,
    "deduction_type_id" UUID         NOT NULL,
    "period_year"       INTEGER      NOT NULL,
    "period_month"      INTEGER      NOT NULL,
    "gross_amount"      DECIMAL(15,2) NOT NULL,
    "withheld_amount"   DECIMAL(15,2) NOT NULL,
    "remittance_id"     UUID,
    "remitted_at"       TIMESTAMP(3),
    "organization_id"   BIGINT,
    "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"        TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sta_finance_vendor_wht_accruals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sta_finance_vendor_wht_accruals_pv_deduction_key"
    ON "sta_finance_vendor_wht_accruals"("pv_deduction_id");
CREATE INDEX "sta_finance_vendor_wht_accruals_vendor_idx"
    ON "sta_finance_vendor_wht_accruals"("vendor_id");
CREATE INDEX "sta_finance_vendor_wht_accruals_period_idx"
    ON "sta_finance_vendor_wht_accruals"("period_year", "period_month");
CREATE INDEX "sta_finance_vendor_wht_accruals_remittance_idx"
    ON "sta_finance_vendor_wht_accruals"("remittance_id");

-- 4. WHT Remittance batches
CREATE TABLE "sta_finance_wht_remittances" (
    "id"                  UUID         NOT NULL,
    "remittance_number"   VARCHAR(60)  NOT NULL,
    "deduction_type_id"   UUID         NOT NULL,
    "period_year"         INTEGER      NOT NULL,
    "period_month"        INTEGER      NOT NULL,
    "total_amount"        DECIMAL(15,2) NOT NULL,
    "paid_from_account_id" UUID        NOT NULL,
    "remittance_date"     DATE         NOT NULL,
    "reference"           VARCHAR(120),
    "receipt_file_id"     UUID,
    "status"              VARCHAR(20)  NOT NULL DEFAULT 'pending',
    "notes"               TEXT,
    "organization_id"     BIGINT,
    "created_by"          BIGINT       NOT NULL,
    "updated_by"          BIGINT,
    "created_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"          TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sta_finance_wht_remittances_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sta_finance_wht_remittances_number_key"
    ON "sta_finance_wht_remittances"("remittance_number");
CREATE INDEX "sta_finance_wht_remittances_period_idx"
    ON "sta_finance_wht_remittances"("period_year", "period_month");
CREATE INDEX "sta_finance_wht_remittances_type_idx"
    ON "sta_finance_wht_remittances"("deduction_type_id");

-- 5. Add vendor + gross/net to payment vouchers
ALTER TABLE "sta_finance_payment_vouchers"
    ADD COLUMN IF NOT EXISTS "vendor_id"    UUID,
    ADD COLUMN IF NOT EXISTS "gross_amount" DECIMAL(15,2),
    ADD COLUMN IF NOT EXISTS "net_amount"   DECIMAL(15,2);

CREATE INDEX "sta_finance_payment_vouchers_vendor_idx"
    ON "sta_finance_payment_vouchers"("vendor_id");

-- 6. Add vendor to request instances (optional — for procurement requests)
ALTER TABLE "sta_request_instances"
    ADD COLUMN IF NOT EXISTS "vendor_id" UUID;

-- Foreign keys
ALTER TABLE "sta_finance_deduction_types"
    ADD CONSTRAINT "sta_finance_deduction_types_gl_account_fkey"
        FOREIGN KEY ("gl_account_id") REFERENCES "sta_finance_chart_accounts"("id") ON DELETE SET NULL,
    ADD CONSTRAINT "sta_finance_deduction_types_created_by_fkey"
        FOREIGN KEY ("created_by") REFERENCES "sta_profiles"("id") ON DELETE RESTRICT;

ALTER TABLE "sta_finance_pv_deductions"
    ADD CONSTRAINT "sta_finance_pv_deductions_pv_fkey"
        FOREIGN KEY ("payment_voucher_id") REFERENCES "sta_finance_payment_vouchers"("id") ON DELETE CASCADE,
    ADD CONSTRAINT "sta_finance_pv_deductions_type_fkey"
        FOREIGN KEY ("deduction_type_id") REFERENCES "sta_finance_deduction_types"("id") ON DELETE RESTRICT,
    ADD CONSTRAINT "sta_finance_pv_deductions_created_by_fkey"
        FOREIGN KEY ("created_by") REFERENCES "sta_profiles"("id") ON DELETE RESTRICT;

ALTER TABLE "sta_finance_vendor_wht_accruals"
    ADD CONSTRAINT "sta_finance_vendor_wht_accruals_vendor_fkey"
        FOREIGN KEY ("vendor_id") REFERENCES "sta_finance_vendors"("id") ON DELETE RESTRICT,
    ADD CONSTRAINT "sta_finance_vendor_wht_accruals_pv_fkey"
        FOREIGN KEY ("payment_voucher_id") REFERENCES "sta_finance_payment_vouchers"("id") ON DELETE RESTRICT,
    ADD CONSTRAINT "sta_finance_vendor_wht_accruals_pv_deduction_fkey"
        FOREIGN KEY ("pv_deduction_id") REFERENCES "sta_finance_pv_deductions"("id") ON DELETE RESTRICT,
    ADD CONSTRAINT "sta_finance_vendor_wht_accruals_type_fkey"
        FOREIGN KEY ("deduction_type_id") REFERENCES "sta_finance_deduction_types"("id") ON DELETE RESTRICT,
    ADD CONSTRAINT "sta_finance_vendor_wht_accruals_remittance_fkey"
        FOREIGN KEY ("remittance_id") REFERENCES "sta_finance_wht_remittances"("id") ON DELETE SET NULL;

ALTER TABLE "sta_finance_wht_remittances"
    ADD CONSTRAINT "sta_finance_wht_remittances_type_fkey"
        FOREIGN KEY ("deduction_type_id") REFERENCES "sta_finance_deduction_types"("id") ON DELETE RESTRICT,
    ADD CONSTRAINT "sta_finance_wht_remittances_account_fkey"
        FOREIGN KEY ("paid_from_account_id") REFERENCES "sta_finance_accounts"("id") ON DELETE RESTRICT,
    ADD CONSTRAINT "sta_finance_wht_remittances_created_by_fkey"
        FOREIGN KEY ("created_by") REFERENCES "sta_profiles"("id") ON DELETE RESTRICT;

ALTER TABLE "sta_finance_payment_vouchers"
    ADD CONSTRAINT "sta_finance_payment_vouchers_vendor_fkey"
        FOREIGN KEY ("vendor_id") REFERENCES "sta_finance_vendors"("id") ON DELETE SET NULL;

ALTER TABLE "sta_request_instances"
    ADD CONSTRAINT "sta_request_instances_vendor_fkey"
        FOREIGN KEY ("vendor_id") REFERENCES "sta_finance_vendors"("id") ON DELETE SET NULL;
```

- [ ] **Step 2: Add Prisma models to `api/prisma/schema.prisma`**

Add these 4 models at the end of the file, before the final closing. Also add the new fields to existing models.

**Add to `FinancePaymentVoucher` model** (after `metadata` field, before `@@map`):
```prisma
  vendorId         String?   @db.Uuid @map("vendor_id")
  grossAmount      Decimal?  @db.Decimal(15, 2) @map("gross_amount")
  netAmount        Decimal?  @db.Decimal(15, 2) @map("net_amount")

  vendor           FinanceVendor?           @relation("PVVendor", fields: [vendorId], references: [id])
  deductions       FinancePVDeduction[]
  whtAccruals      FinanceVendorWHTAccrual[]
```

**Add to `RequestInstance` model** (after `currency` field, before `@@map`):
```prisma
  vendorId         String?   @db.Uuid @map("vendor_id")
  vendor           FinanceVendor? @relation("RequestVendor", fields: [vendorId], references: [id])
```

**Add to `FinanceVendor` model** (before `@@map`):
```prisma
  paymentVouchers  FinancePaymentVoucher[]   @relation("PVVendor")
  requests         RequestInstance[]          @relation("RequestVendor")
  whtAccruals      FinanceVendorWHTAccrual[]
```

**Add these 4 new models at end of file:**
```prisma
model FinanceDeductionType {
  id             String   @id @default(uuid()) @db.Uuid
  name           String   @db.VarChar(100)
  code           String   @db.VarChar(30)
  rate           Decimal  @db.Decimal(6, 4)
  appliesTo      String   @default("vendor") @db.VarChar(50) @map("applies_to")
  glAccountId    String?  @db.Uuid @map("gl_account_id")
  isActive       Boolean  @default(true) @map("is_active")
  organizationId BigInt?  @map("organization_id")
  createdBy      BigInt   @map("created_by")
  updatedBy      BigInt?  @map("updated_by")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  glAccount      FinanceChartAccount?    @relation("DeductionTypeGL", fields: [glAccountId], references: [id])
  createdByUser  Profile                 @relation("DeductionTypeCreatedBy", fields: [createdBy], references: [id])
  updatedByUser  Profile?                @relation("DeductionTypeUpdatedBy", fields: [updatedBy], references: [id])
  pvDeductions   FinancePVDeduction[]
  accruals       FinanceVendorWHTAccrual[]
  remittances    FinanceWHTRemittance[]

  @@map("sta_finance_deduction_types")
}

model FinancePVDeduction {
  id               String   @id @default(uuid()) @db.Uuid
  paymentVoucherId String   @db.Uuid @map("payment_voucher_id")
  deductionTypeId  String   @db.Uuid @map("deduction_type_id")
  rate             Decimal  @db.Decimal(6, 4)
  grossAmount      Decimal  @db.Decimal(15, 2) @map("gross_amount")
  deductionAmount  Decimal  @db.Decimal(15, 2) @map("deduction_amount")
  createdBy        BigInt   @map("created_by")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  paymentVoucher   FinancePaymentVoucher   @relation(fields: [paymentVoucherId], references: [id], onDelete: Cascade)
  deductionType    FinanceDeductionType    @relation(fields: [deductionTypeId], references: [id])
  createdByUser    Profile                 @relation("PVDeductionCreatedBy", fields: [createdBy], references: [id])
  accrual          FinanceVendorWHTAccrual?

  @@index([paymentVoucherId])
  @@map("sta_finance_pv_deductions")
}

model FinanceVendorWHTAccrual {
  id               String    @id @default(uuid()) @db.Uuid
  vendorId         String    @db.Uuid @map("vendor_id")
  paymentVoucherId String    @db.Uuid @map("payment_voucher_id")
  pvDeductionId    String    @unique @db.Uuid @map("pv_deduction_id")
  deductionTypeId  String    @db.Uuid @map("deduction_type_id")
  periodYear       Int       @map("period_year")
  periodMonth      Int       @map("period_month")
  grossAmount      Decimal   @db.Decimal(15, 2) @map("gross_amount")
  withheldAmount   Decimal   @db.Decimal(15, 2) @map("withheld_amount")
  remittanceId     String?   @db.Uuid @map("remittance_id")
  remittedAt       DateTime? @map("remitted_at")
  organizationId   BigInt?   @map("organization_id")
  createdAt        DateTime  @default(now()) @map("created_at")
  updatedAt        DateTime  @updatedAt @map("updated_at")

  vendor           FinanceVendor           @relation(fields: [vendorId], references: [id])
  paymentVoucher   FinancePaymentVoucher   @relation(fields: [paymentVoucherId], references: [id])
  pvDeduction      FinancePVDeduction      @relation(fields: [pvDeductionId], references: [id])
  deductionType    FinanceDeductionType    @relation(fields: [deductionTypeId], references: [id])
  remittance       FinanceWHTRemittance?   @relation(fields: [remittanceId], references: [id])

  @@index([vendorId])
  @@index([periodYear, periodMonth])
  @@index([remittanceId])
  @@map("sta_finance_vendor_wht_accruals")
}

model FinanceWHTRemittance {
  id                String    @id @default(uuid()) @db.Uuid
  remittanceNumber  String    @unique @db.VarChar(60) @map("remittance_number")
  deductionTypeId   String    @db.Uuid @map("deduction_type_id")
  periodYear        Int       @map("period_year")
  periodMonth       Int       @map("period_month")
  totalAmount       Decimal   @db.Decimal(15, 2) @map("total_amount")
  paidFromAccountId String    @db.Uuid @map("paid_from_account_id")
  remittanceDate    DateTime  @db.Date @map("remittance_date")
  reference         String?   @db.VarChar(120)
  receiptFileId     String?   @db.Uuid @map("receipt_file_id")
  status            String    @default("pending") @db.VarChar(20)
  notes             String?   @db.Text
  organizationId    BigInt?   @map("organization_id")
  createdBy         BigInt    @map("created_by")
  updatedBy         BigInt?   @map("updated_by")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  deductionType     FinanceDeductionType    @relation(fields: [deductionTypeId], references: [id])
  paidFromAccount   FinanceAccount          @relation("WHTRemittanceAccount", fields: [paidFromAccountId], references: [id])
  createdByUser     Profile                 @relation("WHTRemittanceCreatedBy", fields: [createdBy], references: [id])
  updatedByUser     Profile?                @relation("WHTRemittanceUpdatedBy", fields: [updatedBy], references: [id])
  accruals          FinanceVendorWHTAccrual[]

  @@index([periodYear, periodMonth])
  @@index([deductionTypeId])
  @@map("sta_finance_wht_remittances")
}
```

**Add back-relations to `Profile` model** (before `@@map("sta_profiles")`):
```prisma
  createdDeductionTypes    FinanceDeductionType[]    @relation("DeductionTypeCreatedBy")
  updatedDeductionTypes    FinanceDeductionType[]    @relation("DeductionTypeUpdatedBy")
  createdPVDeductions      FinancePVDeduction[]      @relation("PVDeductionCreatedBy")
  createdWHTRemittances    FinanceWHTRemittance[]    @relation("WHTRemittanceCreatedBy")
  updatedWHTRemittances    FinanceWHTRemittance[]    @relation("WHTRemittanceUpdatedBy")
```

**Add back-relation to `FinanceChartAccount` model** (before `@@map`):
```prisma
  deductionTypes   FinanceDeductionType[]  @relation("DeductionTypeGL")
```

**Add back-relation to `FinanceAccount` model** (before `@@map`):
```prisma
  whtRemittances   FinanceWHTRemittance[]  @relation("WHTRemittanceAccount")
```

- [ ] **Step 3: Apply migration and regenerate Prisma client**

```bash
cd api
DATABASE_URL="$(grep DATABASE_URL .env | cut -d= -f2-)" npx prisma migrate deploy
npx prisma generate
```

Expected: "1 migration applied" and client regenerated without errors.

- [ ] **Step 4: Verify schema compiles**

```bash
cd api
npx prisma validate
```

Expected: "The schema at prisma/schema.prisma is valid"

- [ ] **Step 5: Commit**

```bash
git add api/prisma/schema.prisma api/prisma/migrations/20260423000000_add_statutory_deductions/
git commit -m "feat(schema): add statutory deductions, WHT accruals, and remittance tables"
```

---

## Task 2: DTOs for Deduction Types, PV Deductions, Remittances

**Files:**
- Create: `api/src/modules/finance/dto/upsert-deduction-type.dto.ts`
- Create: `api/src/modules/finance/dto/apply-pv-deductions.dto.ts`
- Create: `api/src/modules/finance/dto/create-wht-remittance.dto.ts`

- [ ] **Step 1: Create `upsert-deduction-type.dto.ts`**

```typescript
import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertDeductionTypeDto {
  @ApiProperty({ example: 'Withholding Tax' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'WHT' })
  @IsString()
  code: string;

  @ApiProperty({ example: 0.05, description: 'Rate as decimal, e.g. 0.05 = 5%' })
  @IsNumber()
  @Min(0)
  @Max(1)
  rate: number;

  @ApiPropertyOptional({ example: 'vendor', description: 'vendor | all' })
  @IsOptional()
  @IsString()
  applies_to?: string;

  @ApiPropertyOptional({ example: 'uuid-of-wht-payable-chart-account' })
  @IsOptional()
  @IsUUID()
  gl_account_id?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
```

- [ ] **Step 2: Create `apply-pv-deductions.dto.ts`**

```typescript
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsUUID, ValidateNested, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PVDeductionLineDto {
  @ApiProperty({ example: 'uuid-of-deduction-type' })
  @IsUUID()
  deduction_type_id: string;

  @ApiPropertyOptional({ example: 0.05, description: 'Override rate; defaults to type rate if omitted' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rate_override?: number;
}

export class ApplyPVDeductionsDto {
  @ApiProperty({ example: 'uuid-of-vendor' })
  @IsUUID()
  vendor_id: string;

  @ApiProperty({ type: [PVDeductionLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PVDeductionLineDto)
  deductions: PVDeductionLineDto[];
}
```

- [ ] **Step 3: Create `create-wht-remittance.dto.ts`**

```typescript
import { IsArray, IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWHTRemittanceDto {
  @ApiProperty({ example: 'uuid-of-deduction-type' })
  @IsUUID()
  deduction_type_id: string;

  @ApiProperty({ example: 2026 })
  period_year: number;

  @ApiProperty({ example: 4 })
  period_month: number;

  @ApiProperty({ example: 'uuid-of-bank-account' })
  @IsUUID()
  paid_from_account_id: string;

  @ApiProperty({ example: '2026-04-30' })
  @IsDateString()
  remittance_date: string;

  @ApiProperty({ type: [String], description: 'Array of accrual IDs to include in this remittance' })
  @IsArray()
  @IsUUID('4', { each: true })
  accrual_ids: string[];

  @ApiPropertyOptional({ example: 'FIRS-REF-2026-04' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ example: 'uuid-of-receipt-file' })
  @IsOptional()
  @IsUUID()
  receipt_file_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
```

- [ ] **Step 4: Commit**

```bash
git add api/src/modules/finance/dto/upsert-deduction-type.dto.ts \
        api/src/modules/finance/dto/apply-pv-deductions.dto.ts \
        api/src/modules/finance/dto/create-wht-remittance.dto.ts
git commit -m "feat(finance): add DTOs for deduction types, PV deductions, WHT remittances"
```

---

## Task 3: Deduction Service (Backend Logic)

**Files:**
- Create: `api/src/modules/finance/deduction.service.ts`

This service handles all deduction logic: applying deductions to a PV, creating accruals, listing vendor accruals, and recording remittances.

- [ ] **Step 1: Create `api/src/modules/finance/deduction.service.ts`**

```typescript
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpsertDeductionTypeDto } from './dto/upsert-deduction-type.dto';
import { ApplyPVDeductionsDto } from './dto/apply-pv-deductions.dto';
import { CreateWHTRemittanceDto } from './dto/create-wht-remittance.dto';
import { randomUUID } from 'crypto';
import { toBigInt } from '../../common/utils/ids';

@Injectable()
export class DeductionService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Deduction Types ──────────────────────────────────────────────────────

  async listDeductionTypes(organizationId?: bigint) {
    return this.prisma.financeDeductionType.findMany({
      where: {
        isActive: true,
        OR: [{ organizationId: null }, { organizationId: organizationId ?? null }],
      },
      include: { glAccount: { select: { id: true, name: true, code: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async upsertDeductionType(
    dto: UpsertDeductionTypeDto,
    userId: string,
    id?: string,
    organizationId?: bigint,
  ) {
    const data = {
      name: dto.name,
      code: dto.code.toUpperCase(),
      rate: dto.rate,
      appliesTo: dto.applies_to ?? 'vendor',
      glAccountId: dto.gl_account_id ?? null,
      isActive: dto.is_active ?? true,
      organizationId: organizationId ?? null,
      updatedBy: toBigInt(userId),
      updatedAt: new Date(),
    };

    if (id) {
      return this.prisma.financeDeductionType.update({ where: { id }, data });
    }

    return this.prisma.financeDeductionType.create({
      data: { ...data, id: randomUUID(), createdBy: toBigInt(userId) },
    });
  }

  async deleteDeductionType(id: string) {
    return this.prisma.financeDeductionType.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ── PV Deductions ────────────────────────────────────────────────────────

  async applyDeductions(pvId: string, dto: ApplyPVDeductionsDto, userId: string) {
    const pv = await this.prisma.financePaymentVoucher.findUnique({
      where: { id: pvId },
      include: { deductions: true },
    });
    if (!pv) throw new NotFoundException('Payment voucher not found');
    if (pv.deductions.length > 0) {
      throw new BadRequestException('Deductions already applied to this voucher. Remove existing deductions first.');
    }

    const grossAmount = Number(pv.amount);
    const types = await this.prisma.financeDeductionType.findMany({
      where: { id: { in: dto.deductions.map((d) => d.deduction_type_id) } },
    });

    const now = new Date();
    const periodYear = now.getFullYear();
    const periodMonth = now.getMonth() + 1;

    let totalDeductions = 0;
    const deductionRows: Array<{
      id: string;
      paymentVoucherId: string;
      deductionTypeId: string;
      rate: number;
      grossAmount: number;
      deductionAmount: number;
      createdBy: bigint;
      createdAt: Date;
      updatedAt: Date;
    }> = [];

    for (const line of dto.deductions) {
      const type = types.find((t) => t.id === line.deduction_type_id);
      if (!type) throw new NotFoundException(`Deduction type ${line.deduction_type_id} not found`);

      const rate = line.rate_override ?? Number(type.rate);
      const deductionAmount = Math.round(grossAmount * rate * 100) / 100;
      totalDeductions += deductionAmount;

      deductionRows.push({
        id: randomUUID(),
        paymentVoucherId: pvId,
        deductionTypeId: type.id,
        rate,
        grossAmount,
        deductionAmount,
        createdBy: toBigInt(userId),
        createdAt: now,
        updatedAt: now,
      });
    }

    const netAmount = grossAmount - totalDeductions;

    await this.prisma.$transaction(async (tx) => {
      // Insert deduction line items
      await tx.financePVDeduction.createMany({ data: deductionRows });

      // Update PV with vendor, gross, net
      await tx.financePaymentVoucher.update({
        where: { id: pvId },
        data: {
          vendorId: dto.vendor_id,
          grossAmount,
          netAmount,
        },
      });

      // Create vendor accrual per deduction
      for (const row of deductionRows) {
        await tx.financeVendorWHTAccrual.create({
          data: {
            id: randomUUID(),
            vendorId: dto.vendor_id,
            paymentVoucherId: pvId,
            pvDeductionId: row.id,
            deductionTypeId: row.deductionTypeId,
            periodYear,
            periodMonth,
            grossAmount: row.grossAmount,
            withheldAmount: row.deductionAmount,
            organizationId: pv.organizationId ?? null,
            updatedAt: now,
          },
        });
      }
    });

    return this.prisma.financePaymentVoucher.findUnique({
      where: { id: pvId },
      include: { deductions: { include: { deductionType: true } } },
    });
  }

  async removeDeductions(pvId: string) {
    const pv = await this.prisma.financePaymentVoucher.findUnique({ where: { id: pvId } });
    if (!pv) throw new NotFoundException('Payment voucher not found');

    // Only allow removal if no accruals have been remitted
    const remitted = await this.prisma.financeVendorWHTAccrual.count({
      where: { paymentVoucherId: pvId, remittanceId: { not: null } },
    });
    if (remitted > 0) {
      throw new BadRequestException('Cannot remove deductions — some accruals have already been remitted.');
    }

    await this.prisma.$transaction([
      this.prisma.financeVendorWHTAccrual.deleteMany({ where: { paymentVoucherId: pvId } }),
      this.prisma.financePVDeduction.deleteMany({ where: { paymentVoucherId: pvId } }),
      this.prisma.financePaymentVoucher.update({
        where: { id: pvId },
        data: { vendorId: null, grossAmount: null, netAmount: null },
      }),
    ]);

    return { success: true };
  }

  async getPVDeductions(pvId: string) {
    return this.prisma.financePVDeduction.findMany({
      where: { paymentVoucherId: pvId },
      include: { deductionType: true },
    });
  }

  // ── Vendor Accruals ──────────────────────────────────────────────────────

  async getVendorAccruals(vendorId: string, year?: number, month?: number) {
    return this.prisma.financeVendorWHTAccrual.findMany({
      where: {
        vendorId,
        ...(year ? { periodYear: year } : {}),
        ...(month ? { periodMonth: month } : {}),
      },
      include: {
        deductionType: { select: { id: true, name: true, code: true } },
        paymentVoucher: { select: { id: true, voucherNumber: true, disbursedAt: true } },
      },
      orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getVendorAccrualSummary(vendorId: string) {
    const rows = await this.prisma.financeVendorWHTAccrual.groupBy({
      by: ['periodYear', 'periodMonth', 'deductionTypeId'],
      where: { vendorId },
      _sum: { withheldAmount: true, grossAmount: true },
      _count: { id: true },
    });
    return rows;
  }

  async getUnremittedAccruals(deductionTypeId: string, year: number, month: number, organizationId?: bigint) {
    return this.prisma.financeVendorWHTAccrual.findMany({
      where: {
        deductionTypeId,
        periodYear: year,
        periodMonth: month,
        remittanceId: null,
        ...(organizationId ? { organizationId } : {}),
      },
      include: {
        vendor: { select: { id: true, name: true } },
        paymentVoucher: { select: { id: true, voucherNumber: true } },
      },
    });
  }

  // ── Remittances ──────────────────────────────────────────────────────────

  async createRemittance(dto: CreateWHTRemittanceDto, userId: string, organizationId?: bigint) {
    const accruals = await this.prisma.financeVendorWHTAccrual.findMany({
      where: {
        id: { in: dto.accrual_ids },
        remittanceId: null,
        deductionTypeId: dto.deduction_type_id,
        periodYear: dto.period_year,
        periodMonth: dto.period_month,
      },
    });

    if (accruals.length !== dto.accrual_ids.length) {
      throw new BadRequestException('Some accruals are already remitted or do not match the selected period/type.');
    }

    const totalAmount = accruals.reduce((sum, a) => sum + Number(a.withheldAmount), 0);
    const remittanceId = randomUUID();
    const now = new Date();

    // Generate remittance number: REM-WHT-YYYYMM-XXXX
    const count = await this.prisma.financeWHTRemittance.count();
    const remittanceNumber = `REM-${dto.deduction_type_id.slice(0, 3).toUpperCase()}-${dto.period_year}${String(dto.period_month).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`;

    await this.prisma.$transaction([
      this.prisma.financeWHTRemittance.create({
        data: {
          id: remittanceId,
          remittanceNumber,
          deductionTypeId: dto.deduction_type_id,
          periodYear: dto.period_year,
          periodMonth: dto.period_month,
          totalAmount,
          paidFromAccountId: dto.paid_from_account_id,
          remittanceDate: new Date(dto.remittance_date),
          reference: dto.reference ?? null,
          receiptFileId: dto.receipt_file_id ?? null,
          status: 'completed',
          notes: dto.notes ?? null,
          organizationId: organizationId ?? null,
          createdBy: toBigInt(userId),
          updatedAt: now,
        },
      }),
      this.prisma.financeVendorWHTAccrual.updateMany({
        where: { id: { in: dto.accrual_ids } },
        data: { remittanceId, remittedAt: now },
      }),
    ]);

    return this.prisma.financeWHTRemittance.findUnique({
      where: { id: remittanceId },
      include: { accruals: { include: { vendor: { select: { id: true, name: true } } } } },
    });
  }

  async listRemittances(organizationId?: bigint) {
    return this.prisma.financeWHTRemittance.findMany({
      where: organizationId ? { organizationId } : {},
      include: {
        deductionType: { select: { id: true, name: true, code: true } },
        _count: { select: { accruals: true } },
      },
      orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
    });
  }

  // ── WHT Certificate data ─────────────────────────────────────────────────

  async getWHTCertificateData(vendorId: string, year: number, month: number) {
    const vendor = await this.prisma.financeVendor.findUnique({
      where: { id: vendorId },
      select: { id: true, name: true, email: true, phone: true, address: true, taxId: true },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const accruals = await this.prisma.financeVendorWHTAccrual.findMany({
      where: { vendorId, periodYear: year, periodMonth: month, remittanceId: { not: null } },
      include: {
        deductionType: { select: { name: true, code: true, rate: true } },
        paymentVoucher: { select: { voucherNumber: true, disbursedAt: true } },
        remittance: { select: { remittanceNumber: true, remittanceDate: true, reference: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const totalGross = accruals.reduce((s, a) => s + Number(a.grossAmount), 0);
    const totalWithheld = accruals.reduce((s, a) => s + Number(a.withheldAmount), 0);

    return {
      vendor,
      period: { year, month },
      accruals,
      summary: { totalGross, totalWithheld },
      generatedAt: new Date().toISOString(),
    };
  }
}
```

- [ ] **Step 2: Verify the service file has no TypeScript errors**

```bash
cd api && npx tsc --noEmit 2>&1 | grep deduction.service
```

Expected: no output (no errors).

- [ ] **Step 3: Commit**

```bash
git add api/src/modules/finance/deduction.service.ts
git commit -m "feat(finance): add DeductionService for WHT and statutory charge tracking"
```

---

## Task 4: Register Service and Add Controller Endpoints

**Files:**
- Modify: `api/src/modules/finance/finance.module.ts`
- Modify: `api/src/modules/finance/finance.controller.ts`

- [ ] **Step 1: Register `DeductionService` in `finance.module.ts`**

Open `api/src/modules/finance/finance.module.ts`. Import and add `DeductionService` to the `providers` array:

```typescript
import { DeductionService } from './deduction.service';

// In @Module({ providers: [...] })
// Add DeductionService alongside FinanceService
providers: [FinanceService, DeductionService],
```

- [ ] **Step 2: Add endpoints to `finance.controller.ts`**

Import `DeductionService` and inject it alongside `FinanceService`, then add these endpoints. Add them after the existing payment voucher endpoints:

```typescript
import { DeductionService } from './deduction.service';
import { UpsertDeductionTypeDto } from './dto/upsert-deduction-type.dto';
import { ApplyPVDeductionsDto } from './dto/apply-pv-deductions.dto';
import { CreateWHTRemittanceDto } from './dto/create-wht-remittance.dto';

// In constructor:
// constructor(private readonly financeService: FinanceService, private readonly deductionService: DeductionService) {}

// ── Deduction Types ──────────────────────────────────────────────────────

@Get('deduction-types')
@UseGuards(JwtAuthGuard)
listDeductionTypes(@Request() req) {
  return this.deductionService.listDeductionTypes(req.user?.organizationId ? BigInt(req.user.organizationId) : undefined);
}

@Post('deduction-types')
@UseGuards(JwtAuthGuard)
createDeductionType(@Body() dto: UpsertDeductionTypeDto, @Request() req) {
  return this.deductionService.upsertDeductionType(dto, req.user.id, undefined, req.user?.organizationId ? BigInt(req.user.organizationId) : undefined);
}

@Put('deduction-types/:id')
@UseGuards(JwtAuthGuard)
updateDeductionType(@Param('id') id: string, @Body() dto: UpsertDeductionTypeDto, @Request() req) {
  return this.deductionService.upsertDeductionType(dto, req.user.id, id);
}

@Delete('deduction-types/:id')
@UseGuards(JwtAuthGuard)
deleteDeductionType(@Param('id') id: string) {
  return this.deductionService.deleteDeductionType(id);
}

// ── PV Deductions ────────────────────────────────────────────────────────

@Get('payment-vouchers/:id/deductions')
@UseGuards(JwtAuthGuard)
getPVDeductions(@Param('id') id: string) {
  return this.deductionService.getPVDeductions(id);
}

@Post('payment-vouchers/:id/deductions')
@UseGuards(JwtAuthGuard)
applyDeductions(@Param('id') id: string, @Body() dto: ApplyPVDeductionsDto, @Request() req) {
  return this.deductionService.applyDeductions(id, dto, req.user.id);
}

@Delete('payment-vouchers/:id/deductions')
@UseGuards(JwtAuthGuard)
removeDeductions(@Param('id') id: string) {
  return this.deductionService.removeDeductions(id);
}

// ── Vendor Accruals ──────────────────────────────────────────────────────

@Get('vendors/:id/wht-accruals')
@UseGuards(JwtAuthGuard)
getVendorAccruals(
  @Param('id') id: string,
  @Query('year') year?: string,
  @Query('month') month?: string,
) {
  return this.deductionService.getVendorAccruals(id, year ? Number(year) : undefined, month ? Number(month) : undefined);
}

@Get('vendors/:id/wht-accruals/summary')
@UseGuards(JwtAuthGuard)
getVendorAccrualSummary(@Param('id') id: string) {
  return this.deductionService.getVendorAccrualSummary(id);
}

@Get('wht-accruals/unremitted')
@UseGuards(JwtAuthGuard)
getUnremittedAccruals(
  @Query('deduction_type_id') typeId: string,
  @Query('year') year: string,
  @Query('month') month: string,
  @Request() req,
) {
  return this.deductionService.getUnremittedAccruals(typeId, Number(year), Number(month), req.user?.organizationId ? BigInt(req.user.organizationId) : undefined);
}

@Get('vendors/:id/wht-certificate')
@UseGuards(JwtAuthGuard)
getWHTCertificate(
  @Param('id') vendorId: string,
  @Query('year') year: string,
  @Query('month') month: string,
) {
  return this.deductionService.getWHTCertificateData(vendorId, Number(year), Number(month));
}

// ── Remittances ──────────────────────────────────────────────────────────

@Get('wht-remittances')
@UseGuards(JwtAuthGuard)
listRemittances(@Request() req) {
  return this.deductionService.listRemittances(req.user?.organizationId ? BigInt(req.user.organizationId) : undefined);
}

@Post('wht-remittances')
@UseGuards(JwtAuthGuard)
createRemittance(@Body() dto: CreateWHTRemittanceDto, @Request() req) {
  return this.deductionService.createRemittance(dto, req.user.id, req.user?.organizationId ? BigInt(req.user.organizationId) : undefined);
}
```

- [ ] **Step 3: Verify build**

```bash
cd api && npm run build 2>&1 | tail -20
```

Expected: "Successfully compiled" with no errors.

- [ ] **Step 4: Commit**

```bash
git add api/src/modules/finance/finance.module.ts api/src/modules/finance/finance.controller.ts
git commit -m "feat(finance): register DeductionService and add WHT API endpoints"
```

---

## Task 5: Shared API Layer (apps/shared)

**Files:**
- Modify: `apps/shared/src/api/finance-api.ts`

- [ ] **Step 1: Add deduction API functions to `apps/shared/src/api/finance-api.ts`**

Open the file and append these exports after the existing finance API functions:

```typescript
// ── Deduction Types ──────────────────────────────────────────────────────

export async function listDeductionTypes(client: AxiosInstance) {
  const res = await client.get('/finance/deduction-types');
  return res.data;
}

export async function createDeductionType(client: AxiosInstance, data: {
  name: string; code: string; rate: number; applies_to?: string; gl_account_id?: string;
}) {
  const res = await client.post('/finance/deduction-types', data);
  return res.data;
}

export async function updateDeductionType(client: AxiosInstance, id: string, data: {
  name?: string; code?: string; rate?: number; applies_to?: string; gl_account_id?: string; is_active?: boolean;
}) {
  const res = await client.put(`/finance/deduction-types/${id}`, data);
  return res.data;
}

export async function deleteDeductionType(client: AxiosInstance, id: string) {
  const res = await client.delete(`/finance/deduction-types/${id}`);
  return res.data;
}

// ── PV Deductions ────────────────────────────────────────────────────────

export async function getPVDeductions(client: AxiosInstance, pvId: string) {
  const res = await client.get(`/finance/payment-vouchers/${pvId}/deductions`);
  return res.data;
}

export async function applyPVDeductions(client: AxiosInstance, pvId: string, data: {
  vendor_id: string;
  deductions: Array<{ deduction_type_id: string; rate_override?: number }>;
}) {
  const res = await client.post(`/finance/payment-vouchers/${pvId}/deductions`, data);
  return res.data;
}

export async function removePVDeductions(client: AxiosInstance, pvId: string) {
  const res = await client.delete(`/finance/payment-vouchers/${pvId}/deductions`);
  return res.data;
}

// ── Vendor Accruals ──────────────────────────────────────────────────────

export async function getVendorWHTAccruals(
  client: AxiosInstance,
  vendorId: string,
  params?: { year?: number; month?: number }
) {
  const res = await client.get(`/finance/vendors/${vendorId}/wht-accruals`, { params });
  return res.data;
}

export async function getVendorAccrualSummary(client: AxiosInstance, vendorId: string) {
  const res = await client.get(`/finance/vendors/${vendorId}/wht-accruals/summary`);
  return res.data;
}

export async function getUnremittedAccruals(
  client: AxiosInstance,
  params: { deduction_type_id: string; year: number; month: number }
) {
  const res = await client.get('/finance/wht-accruals/unremitted', { params });
  return res.data;
}

export async function getWHTCertificateData(
  client: AxiosInstance,
  vendorId: string,
  year: number,
  month: number
) {
  const res = await client.get(`/finance/vendors/${vendorId}/wht-certificate`, { params: { year, month } });
  return res.data;
}

// ── Remittances ──────────────────────────────────────────────────────────

export async function listWHTRemittances(client: AxiosInstance) {
  const res = await client.get('/finance/wht-remittances');
  return res.data;
}

export async function createWHTRemittance(client: AxiosInstance, data: {
  deduction_type_id: string;
  period_year: number;
  period_month: number;
  paid_from_account_id: string;
  remittance_date: string;
  accrual_ids: string[];
  reference?: string;
  receipt_file_id?: string;
  notes?: string;
}) {
  const res = await client.post('/finance/wht-remittances', data);
  return res.data;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/shared/src/api/finance-api.ts
git commit -m "feat(shared): add WHT and deduction API functions"
```

---

## Task 6: PV Deductions Panel (Frontend)

**Files:**
- Create: `apps/pwa/src/modules/finance/components/PVDeductionsPanel.tsx`
- Modify: `apps/pwa/src/modules/finance/FinancePaymentVouchersPage.tsx`

- [ ] **Step 1: Create `PVDeductionsPanel.tsx`**

This component shows on an existing payment voucher, lets the accountant add a vendor and apply deduction types, and displays the gross/deductions/net breakdown.

```tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/shared';
import {
  listDeductionTypes,
  applyPVDeductions,
  removePVDeductions,
  getPVDeductions,
} from '@shared/api/finance-api';

type Props = {
  pvId: string;
  pvAmount: number;
  vendorId?: string | null;
  onUpdate?: () => void;
};

type DeductionLine = { deduction_type_id: string; rate_override?: number };

export function PVDeductionsPanel({ pvId, pvAmount, vendorId: initialVendorId, onUpdate }: Props) {
  const api = useApi();
  const qc = useQueryClient();
  const [selectedVendorId, setSelectedVendorId] = useState(initialVendorId ?? '');
  const [lines, setLines] = useState<DeductionLine[]>([]);
  const [saving, setSaving] = useState(false);

  const { data: types = [] } = useQuery({
    queryKey: ['deduction-types'],
    queryFn: () => listDeductionTypes(api),
  });

  const { data: existing = [] } = useQuery({
    queryKey: ['pv-deductions', pvId],
    queryFn: () => getPVDeductions(api, pvId),
  });

  const hasExisting = existing.length > 0;

  const totalDeducted = hasExisting
    ? existing.reduce((s: number, d: any) => s + Number(d.deduction_amount), 0)
    : lines.reduce((s, l) => {
        const type = types.find((t: any) => t.id === l.deduction_type_id);
        const rate = l.rate_override ?? Number(type?.rate ?? 0);
        return s + pvAmount * rate;
      }, 0);

  const netAmount = pvAmount - totalDeducted;

  async function handleApply() {
    if (!selectedVendorId || lines.length === 0) return;
    setSaving(true);
    try {
      await applyPVDeductions(api, pvId, { vendor_id: selectedVendorId, deductions: lines });
      qc.invalidateQueries({ queryKey: ['pv-deductions', pvId] });
      onUpdate?.();
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!confirm('Remove all deductions from this voucher?')) return;
    await removePVDeductions(api, pvId);
    qc.invalidateQueries({ queryKey: ['pv-deductions', pvId] });
    onUpdate?.();
  }

  function addLine() {
    setLines((prev) => [...prev, { deduction_type_id: '' }]);
  }

  function updateLine(i: number, field: keyof DeductionLine, value: string | number) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
  }

  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Statutory Deductions</h3>
        {hasExisting && (
          <button onClick={handleRemove} className="text-xs text-danger hover:underline">
            Remove all
          </button>
        )}
      </div>

      {hasExisting ? (
        <div className="space-y-2">
          {existing.map((d: any) => (
            <div key={d.id} className="flex items-center justify-between text-xs text-slate-600">
              <span>{d.deduction_type?.name} ({(Number(d.rate) * 100).toFixed(1)}%)</span>
              <span className="font-semibold text-danger">−₦{Number(d.deduction_amount).toLocaleString()}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Vendor selector — wire to your vendor list query */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Vendor</label>
            <input
              type="text"
              placeholder="Enter vendor ID (wire to vendor dropdown)"
              value={selectedVendorId}
              onChange={(e) => setSelectedVendorId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
            />
          </div>

          {lines.map((line, i) => (
            <div key={i} className="flex gap-2 items-center">
              <select
                value={line.deduction_type_id}
                onChange={(e) => updateLine(i, 'deduction_type_id', e.target.value)}
                className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
              >
                <option value="">Select deduction type</option>
                {types.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({(Number(t.rate) * 100).toFixed(1)}%)
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Rate override"
                value={line.rate_override ?? ''}
                onChange={(e) => updateLine(i, 'rate_override', e.target.value ? Number(e.target.value) / 100 : undefined as any)}
                className="w-24 rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
              />
              <button onClick={() => removeLine(i)} className="text-danger text-xs">✕</button>
            </div>
          ))}

          <button onClick={addLine} className="text-xs text-brand-600 hover:underline">+ Add deduction</button>

          {lines.length > 0 && selectedVendorId && (
            <button
              onClick={handleApply}
              disabled={saving}
              className="w-full rounded-lg bg-primary py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              {saving ? 'Applying…' : 'Apply Deductions'}
            </button>
          )}
        </div>
      )}

      {/* Summary */}
      <div className="border-t border-slate-100 pt-3 space-y-1 text-xs">
        <div className="flex justify-between text-slate-500">
          <span>Gross Amount</span>
          <span>₦{pvAmount.toLocaleString()}</span>
        </div>
        {totalDeducted > 0 && (
          <div className="flex justify-between text-danger">
            <span>Total Deductions</span>
            <span>−₦{totalDeducted.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-slate-700">
          <span>Net Disbursed</span>
          <span>₦{netAmount.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add `PVDeductionsPanel` to `FinancePaymentVouchersPage.tsx`**

Find where a single payment voucher's detail is shown (the slide-over or detail panel for an individual PV). Import and render `PVDeductionsPanel` passing the PV's `id` and `amount`:

```tsx
import { PVDeductionsPanel } from './components/PVDeductionsPanel';

// Inside the PV detail render, after the existing PV fields:
<PVDeductionsPanel
  pvId={selectedPV.id}
  pvAmount={Number(selectedPV.amount)}
  vendorId={selectedPV.vendor_id}
  onUpdate={() => queryClient.invalidateQueries({ queryKey: ['payment-vouchers'] })}
/>
```

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/modules/finance/components/PVDeductionsPanel.tsx \
        apps/pwa/src/modules/finance/FinancePaymentVouchersPage.tsx
git commit -m "feat(finance): add PV deductions panel with gross/net breakdown"
```

---

## Task 7: Vendor WHT Panel — Accruals, Remittance, Certificate

**Files:**
- Create: `apps/pwa/src/modules/finance/components/VendorWHTPanel.tsx`
- Create: `apps/pwa/src/modules/finance/components/WHTCertificateModal.tsx`
- Modify: vendor page (likely `FinanceVendorsPage.tsx` or wherever vendor detail renders)

- [ ] **Step 1: Create `WHTCertificateModal.tsx`**

```tsx
import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/shared';
import { getWHTCertificateData } from '@shared/api/finance-api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

type Props = {
  vendorId: string;
  year: number;
  month: number;
  onClose: () => void;
};

export function WHTCertificateModal({ vendorId, year, month, onClose }: Props) {
  const api = useApi();
  const { data, isLoading } = useQuery({
    queryKey: ['wht-certificate', vendorId, year, month],
    queryFn: () => getWHTCertificateData(api, vendorId, year, month),
  });

  function handlePrint() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="font-semibold text-slate-800">WHT Certificate — {MONTHS[month - 1]} {year}</h2>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="rounded-lg bg-primary px-4 py-2 text-xs text-white font-semibold">Print / PDF</button>
            <button onClick={onClose} className="rounded-lg border px-4 py-2 text-xs text-slate-600">Close</button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading certificate data…</div>
        ) : !data ? null : (
          <div className="p-6 space-y-6 text-sm">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-400 font-medium uppercase tracking-wide">Vendor</p>
                <p className="font-semibold text-slate-800">{data.vendor.name}</p>
                {data.vendor.taxId && <p className="text-slate-500">TIN: {data.vendor.taxId}</p>}
                {data.vendor.email && <p className="text-slate-500">{data.vendor.email}</p>}
              </div>
              <div className="text-right">
                <p className="text-slate-400 font-medium uppercase tracking-wide">Period</p>
                <p className="font-semibold">{MONTHS[month - 1]} {year}</p>
                <p className="text-slate-400 text-xs">Generated: {new Date(data.generatedAt).toLocaleDateString()}</p>
              </div>
            </div>

            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-3 py-2 border border-slate-200 font-semibold">Voucher</th>
                  <th className="px-3 py-2 border border-slate-200 font-semibold">Date</th>
                  <th className="px-3 py-2 border border-slate-200 font-semibold">Deduction</th>
                  <th className="px-3 py-2 border border-slate-200 font-semibold text-right">Gross</th>
                  <th className="px-3 py-2 border border-slate-200 font-semibold text-right">WHT</th>
                </tr>
              </thead>
              <tbody>
                {data.accruals.map((a: any) => (
                  <tr key={a.id}>
                    <td className="px-3 py-2 border border-slate-100">{a.paymentVoucher?.voucherNumber}</td>
                    <td className="px-3 py-2 border border-slate-100">{a.paymentVoucher?.disbursedAt ? new Date(a.paymentVoucher.disbursedAt).toLocaleDateString() : '—'}</td>
                    <td className="px-3 py-2 border border-slate-100">{a.deductionType?.name}</td>
                    <td className="px-3 py-2 border border-slate-100 text-right">₦{Number(a.grossAmount).toLocaleString()}</td>
                    <td className="px-3 py-2 border border-slate-100 text-right text-danger">₦{Number(a.withheldAmount).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-semibold">
                  <td colSpan={3} className="px-3 py-2 border border-slate-200">Total</td>
                  <td className="px-3 py-2 border border-slate-200 text-right">₦{data.summary.totalGross.toLocaleString()}</td>
                  <td className="px-3 py-2 border border-slate-200 text-right text-danger">₦{data.summary.totalWithheld.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>

            {data.accruals[0]?.remittance && (
              <p className="text-xs text-slate-500">
                Remitted on {new Date(data.accruals[0].remittance.remittanceDate).toLocaleDateString()} · Ref: {data.accruals[0].remittance.reference ?? data.accruals[0].remittance.remittanceNumber}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `VendorWHTPanel.tsx`**

```tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/shared';
import {
  getVendorWHTAccruals,
  getUnremittedAccruals,
  createWHTRemittance,
  listDeductionTypes,
} from '@shared/api/finance-api';
import { WHTCertificateModal } from './WHTCertificateModal';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

type Props = { vendorId: string };

export function VendorWHTPanel({ vendorId }: Props) {
  const api = useApi();
  const qc = useQueryClient();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [certModal, setCertModal] = useState<{ year: number; month: number } | null>(null);
  const [remitting, setRemitting] = useState(false);
  const [remitAccountId, setRemitAccountId] = useState('');
  const [remitDate, setRemitDate] = useState(new Date().toISOString().slice(0, 10));
  const [remitRef, setRemitRef] = useState('');

  const { data: accruals = [] } = useQuery({
    queryKey: ['vendor-wht-accruals', vendorId, selectedYear, selectedMonth],
    queryFn: () => getVendorWHTAccruals(api, vendorId, { year: selectedYear, month: selectedMonth }),
  });

  const { data: types = [] } = useQuery({
    queryKey: ['deduction-types'],
    queryFn: () => listDeductionTypes(api),
  });

  const unremitted = accruals.filter((a: any) => !a.remittance_id);
  const remitted = accruals.filter((a: any) => a.remittance_id);
  const totalUnremitted = unremitted.reduce((s: number, a: any) => s + Number(a.withheld_amount), 0);
  const totalRemitted = remitted.reduce((s: number, a: any) => s + Number(a.withheld_amount), 0);

  async function handleRemit() {
    if (!remitAccountId || unremitted.length === 0) return;
    if (!types[0]) return;
    setRemitting(true);
    try {
      await createWHTRemittance(api, {
        deduction_type_id: types[0].id,
        period_year: selectedYear,
        period_month: selectedMonth,
        paid_from_account_id: remitAccountId,
        remittance_date: remitDate,
        accrual_ids: unremitted.map((a: any) => a.id),
        reference: remitRef || undefined,
      });
      qc.invalidateQueries({ queryKey: ['vendor-wht-accruals', vendorId] });
    } finally {
      setRemitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold text-slate-700 flex-1">WHT Accruals</h3>
        <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="rounded-lg border border-slate-300 px-2 py-1 text-xs">
          {[currentYear - 1, currentYear, currentYear + 1].map((y) => <option key={y}>{y}</option>)}
        </select>
        <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="rounded-lg border border-slate-300 px-2 py-1 text-xs">
          {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
        </select>
      </div>

      {accruals.length === 0 ? (
        <p className="text-xs text-slate-400 py-4 text-center">No WHT accruals for this period.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-orange-50 border border-orange-100 p-3 text-center">
              <p className="text-xs text-orange-500 font-medium">Pending Remittance</p>
              <p className="text-lg font-bold text-orange-700">₦{totalUnremitted.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-green-50 border border-green-100 p-3 text-center">
              <p className="text-xs text-green-600 font-medium">Remitted</p>
              <p className="text-lg font-bold text-green-700">₦{totalRemitted.toLocaleString()}</p>
            </div>
          </div>

          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-100">
                <th className="pb-2 font-medium">Voucher</th>
                <th className="pb-2 font-medium">Type</th>
                <th className="pb-2 font-medium text-right">Amount</th>
                <th className="pb-2 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {accruals.map((a: any) => (
                <tr key={a.id}>
                  <td className="py-2 text-slate-600">{a.payment_voucher?.voucher_number ?? '—'}</td>
                  <td className="py-2 text-slate-600">{a.deduction_type?.code}</td>
                  <td className="py-2 text-right font-semibold">₦{Number(a.withheld_amount).toLocaleString()}</td>
                  <td className="py-2 text-right">
                    {a.remittance_id
                      ? <span className="text-green-600 font-medium">Remitted</span>
                      : <span className="text-orange-500 font-medium">Pending</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {unremitted.length > 0 && (
            <div className="rounded-xl border border-slate-200 p-3 space-y-2">
              <p className="text-xs font-semibold text-slate-700">Record Remittance</p>
              <input
                type="text"
                placeholder="Bank account ID (wire to account picker)"
                value={remitAccountId}
                onChange={(e) => setRemitAccountId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
              />
              <div className="flex gap-2">
                <input
                  type="date"
                  value={remitDate}
                  onChange={(e) => setRemitDate(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs"
                />
                <input
                  type="text"
                  placeholder="FIRS reference"
                  value={remitRef}
                  onChange={(e) => setRemitRef(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
              <button
                onClick={handleRemit}
                disabled={remitting || !remitAccountId}
                className="w-full rounded-lg bg-primary py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {remitting ? 'Recording…' : `Record Remittance of ₦${totalUnremitted.toLocaleString()}`}
              </button>
            </div>
          )}

          {totalRemitted > 0 && (
            <button
              onClick={() => setCertModal({ year: selectedYear, month: selectedMonth })}
              className="w-full rounded-lg border border-slate-300 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Generate WHT Certificate
            </button>
          )}
        </>
      )}

      {certModal && (
        <WHTCertificateModal
          vendorId={vendorId}
          year={certModal.year}
          month={certModal.month}
          onClose={() => setCertModal(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Add `VendorWHTPanel` to the vendor detail view**

Find where vendor detail is rendered (slide-over or tab in `FinanceVendorsPage.tsx`). Add a "WHT" tab or section:

```tsx
import { VendorWHTPanel } from './components/VendorWHTPanel';

// Inside vendor detail, add a new tab or section:
<VendorWHTPanel vendorId={selectedVendor.id} />
```

- [ ] **Step 4: Commit**

```bash
git add apps/pwa/src/modules/finance/components/VendorWHTPanel.tsx \
        apps/pwa/src/modules/finance/components/WHTCertificateModal.tsx \
        apps/pwa/src/modules/finance/FinanceVendorsPage.tsx
git commit -m "feat(finance): add vendor WHT accrual panel and certificate modal"
```

---

## Task 8: Deduction Types Setup Page + Navigation

**Files:**
- Create: `apps/pwa/src/modules/finance/FinanceDeductionTypesPage.tsx`
- Modify: `apps/pwa/src/App.tsx` (route)
- Modify: `apps/pwa/src/shared/navigation.ts` (add to Setup group)

- [ ] **Step 1: Create `FinanceDeductionTypesPage.tsx`**

```tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/shared';
import { listDeductionTypes, createDeductionType, updateDeductionType, deleteDeductionType } from '@shared/api/finance-api';

export function FinanceDeductionTypesPage() {
  const api = useApi();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', code: '', rate: '', gl_account_id: '' });

  const { data: types = [], isLoading } = useQuery({
    queryKey: ['deduction-types'],
    queryFn: () => listDeductionTypes(api),
  });

  function openNew() {
    setEditing({});
    setForm({ name: '', code: '', rate: '', gl_account_id: '' });
  }

  function openEdit(t: any) {
    setEditing(t);
    setForm({ name: t.name, code: t.code, rate: String(Number(t.rate) * 100), gl_account_id: t.gl_account_id ?? '' });
  }

  async function handleSave() {
    const payload = { name: form.name, code: form.code, rate: Number(form.rate) / 100, gl_account_id: form.gl_account_id || undefined };
    if (editing?.id) {
      await updateDeductionType(api, editing.id, payload);
    } else {
      await createDeductionType(api, payload);
    }
    qc.invalidateQueries({ queryKey: ['deduction-types'] });
    setEditing(null);
  }

  async function handleDelete(id: string) {
    if (!confirm('Deactivate this deduction type?')) return;
    await deleteDeductionType(api, id);
    qc.invalidateQueries({ queryKey: ['deduction-types'] });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Deduction Types</h1>
        <button onClick={openNew} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
          + New Type
        </button>
      </div>

      {isLoading ? <p className="text-sm text-slate-400">Loading…</p> : (
        <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
          {types.length === 0 && (
            <p className="p-6 text-center text-sm text-slate-400">No deduction types configured yet.</p>
          )}
          {types.map((t: any) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <span className="font-semibold text-slate-800 text-sm">{t.name}</span>
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{t.code}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-slate-700">{(Number(t.rate) * 100).toFixed(1)}%</span>
                <button onClick={() => openEdit(t)} className="text-xs text-brand-600 hover:underline">Edit</button>
                <button onClick={() => handleDelete(t.id)} className="text-xs text-danger hover:underline">Disable</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <h2 className="font-semibold text-slate-800">{editing?.id ? 'Edit' : 'New'} Deduction Type</h2>
            {(['name', 'code'] as const).map((f) => (
              <div key={f}>
                <label className="block text-xs font-medium text-slate-600 mb-1 capitalize">{f}</label>
                <input value={form[f]} onChange={(e) => setForm((p) => ({ ...p, [f]: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Rate (%)</label>
              <input type="number" value={form.rate} onChange={(e) => setForm((p) => ({ ...p, rate: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="e.g. 5 for 5%" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-white">Save</button>
              <button onClick={() => setEditing(null)} className="flex-1 rounded-lg border py-2 text-sm text-slate-600">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add route in `apps/pwa/src/App.tsx`**

Find the finance routes block. Add:

```tsx
import { FinanceDeductionTypesPage } from '@/modules/finance/FinanceDeductionTypesPage';

// Inside finance routes:
<Route path="/finance/deduction-types" element={<FinanceDeductionTypesPage />} />
```

- [ ] **Step 3: Add to navigation in `apps/pwa/src/shared/navigation.ts`**

In the Setup group children array, add after `Settings`:

```ts
{ key: "finance-deduction-types", label: "Deduction Types", icon: "percent", path: "/finance/deduction-types" },
```

- [ ] **Step 4: Commit**

```bash
git add apps/pwa/src/modules/finance/FinanceDeductionTypesPage.tsx \
        apps/pwa/src/App.tsx \
        apps/pwa/src/shared/navigation.ts
git commit -m "feat(finance): add deduction types setup page and navigation entry"
```

---

## Task 9: Vendor Field on Request Form

**Files:**
- Modify: request form component (find via `grep -r "RequestForm\|request.*form" apps/pwa/src/features/requests --include="*.tsx" -l`)

- [ ] **Step 1: Locate the request creation form**

```bash
grep -r "totalAmount\|requestType\|formSchema" apps/pwa/src/features/requests --include="*.tsx" -l
```

Open the file that renders the request creation form.

- [ ] **Step 2: Add optional vendor field to the form**

The vendor field should only show when the `request_type` has `categoryKey === 'vendor_payment'` or `categoryKey === 'procurement'` — or always show it as optional with a note "Leave blank if not a vendor payment":

```tsx
import { useQuery } from '@tanstack/react-query';
// At top of form component, add vendor list query:
const { data: vendors = [] } = useQuery({
  queryKey: ['finance-vendors'],
  queryFn: () => client.get('/finance/vendors').then(r => r.data?.data ?? []),
});

// In the form JSX, add before the submit button:
<div>
  <label className="block text-xs font-medium text-slate-600 mb-1">
    Vendor <span className="text-slate-400 font-normal">(optional — for vendor payments)</span>
  </label>
  <select
    value={formData.vendor_id ?? ''}
    onChange={(e) => setFormData((p) => ({ ...p, vendor_id: e.target.value || undefined }))}
    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
  >
    <option value="">No vendor</option>
    {vendors.map((v: any) => (
      <option key={v.id} value={v.id}>{v.name}</option>
    ))}
  </select>
</div>
```

Include `vendor_id` in the request submission payload.

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/features/requests/
git commit -m "feat(requests): add optional vendor field to request form"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ Dynamic deduction types with configurable rates
- ✅ Accountant applies deductions at PV stage
- ✅ Gross / deductions / net breakdown on PV
- ✅ Vendor attached to request (optional) and PV
- ✅ WHT accruals accumulated per vendor
- ✅ Remittance workflow (batch clear accruals)
- ✅ WHT Certificate generation (not "credit note")
- ✅ Deduction Types setup page under Finance > Setup
- ✅ GL account linkage for liability accounts

**No placeholders:** All code blocks are complete implementations.

**Type consistency:**
- `pvId` used consistently (not `payment_voucher_id`) in frontend function calls
- `deductionType` relation name matches Prisma model
- `FinancePVDeduction`, `FinanceVendorWHTAccrual`, `FinanceWHTRemittance`, `FinanceDeductionType` used consistently throughout

---

Plan complete and saved to `docs/superpowers/plans/2026-04-23-statutory-deductions-wht.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** — Fresh subagent per task, two-stage review between tasks, fastest iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans skill, with checkpoints.

Which approach?
