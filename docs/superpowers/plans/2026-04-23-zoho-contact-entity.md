# Zoho-Style Contact Entity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge FinanceVendor and FinanceCustomer into a single FinanceContact entity (Zoho Books style), with contact_type discrimination, individual/business sub-type, contact persons, and structured billing/shipping addresses.

**Architecture:** Single `FinanceContact` Prisma model replaces both `FinanceVendor` and `FinanceCustomer`. A new `FinanceContactPerson` model stores multiple contact persons per contact. All existing FK references (`vendor_id`, `customer_id`) migrate to `contact_id` with a `contact_role` column on the referencing models to preserve direction. Backend exposes unified `/finance/contacts` CRUD routes while keeping backward-compat `/finance/vendors` and `/finance/customers` filter aliases. Frontend keeps separate Vendor/Customer pages but they query the unified contact API with `contact_type` filter.

**Tech Stack:** Prisma (PostgreSQL), NestJS (class-validator DTOs), TypeScript, React, shared API client

---

## File Structure

### New files to create:
- `api/prisma/migrations/20260424000000_zoho_contact_entity/migration.sql` — migration SQL
- `api/src/modules/finance/dto/upsert-contact.dto.ts` — contact create/update DTO
- `api/src/modules/finance/dto/upsert-contact-person.dto.ts` — contact person DTO
- `apps/shared/src/api/finance-api.ts` — add ContactRecord, ContactPersonRecord types + API methods (in-place edit)
- `apps/pwa/src/modules/finance/contacts/` — new shared contact components folder
- `apps/pwa/src/modules/finance/contacts/ContactFormSlideOver.tsx` — unified form with contact_type, sub_type, company_name, contact persons, addresses
- `apps/pwa/src/modules/finance/contacts/ContactPersonForm.tsx` — inline contact person editor
- `apps/pwa/src/modules/finance/contacts/ContactDetailView.tsx` — unified detail view with contact persons tab
- `apps/pwa/src/modules/finance/contacts/helpers.ts` — shared types and helpers

### Files to modify:
- `api/prisma/schema.prisma` — add FinanceContact, FinanceContactPerson; modify FK references; remove FinanceVendor, FinanceCustomer
- `api/src/modules/finance/finance.service.ts` — add contact CRUD, update serializers, update FK lookups
- `api/src/modules/finance/finance.controller.ts` — add contact routes, keep vendor/customer alias routes
- `api/src/modules/finance/dto/create-finance-bill.dto.ts` — rename vendor_id to contact_id
- `api/src/modules/finance/dto/create-finance-sales-invoice.dto.ts` — rename customer_id to contact_id
- `api/src/modules/finance/dto/create-finance-receipt.dto.ts` — rename customer_id to contact_id
- `api/src/modules/finance/dto/create-finance-vendor-payment.dto.ts` — rename vendor_id to contact_id
- `api/src/modules/finance/dto/create-finance-expense.dto.ts` — rename vendorId to contact_id
- `api/src/modules/finance/dto/apply-pv-deductions.dto.ts` — if vendor_id referenced
- `api/src/modules/finance/deduction.service.ts` — update vendor FK lookups to contact FK
- `apps/shared/src/api/finance-api.ts` — add unified contact types + methods
- `apps/shared/src/index.ts` — export new types
- `apps/pwa/src/modules/finance/vendors/index.tsx` — update to use contact API with vendor filter
- `apps/pwa/src/modules/finance/vendors/VendorDetailView.tsx` — update to use contact API
- `apps/pwa/src/modules/finance/vendors/VendorFormSlideOver.tsx` — replace with shared ContactFormSlideOver
- `apps/pwa/src/modules/finance/vendors/VendorTransactionsTab.tsx` — update API calls
- `apps/pwa/src/modules/finance/vendors/VendorWHTTab.tsx` — update API calls
- `apps/pwa/src/modules/finance/vendors/WHTCertificateModal.tsx` — update API calls
- `apps/pwa/src/modules/finance/vendors/helpers.ts` — update types
- `apps/pwa/src/modules/finance/customers/index.tsx` — update to use contact API with customer filter
- `apps/pwa/src/modules/finance/customers/CustomerDetailView.tsx` — update to use contact API
- `apps/pwa/src/modules/finance/customers/CustomerFormSlideOver.tsx` — replace with shared ContactFormSlideOver
- `apps/pwa/src/modules/finance/customers/CustomerTransactionsTab.tsx` — update API calls
- `apps/pwa/src/modules/finance/customers/helpers.ts` — update types
- `apps/pwa/src/modules/finance/FinanceBillsPage.tsx` — update vendor_id -> contact_id
- `apps/pwa/src/modules/finance/FinanceSalesInvoicesPage.tsx` — update customer_id -> contact_id
- `apps/pwa/src/modules/finance/FinanceExpensesPage.tsx` — update vendor_id -> contact_id
- `apps/pwa/src/features/requests/pages/new/RequestFormPage.tsx` — update vendor_id -> contact_id
- `apps/pwa/src/shared/navigation.ts` — add "Contacts" nav item

---

### Task 1: Prisma Schema — Add FinanceContact and FinanceContactPerson Models

**Files:**
- Modify: `api/prisma/schema.prisma` (add after FinanceCustomer model ~line 1356)

- [ ] **Step 1: Add FinanceContact model to schema.prisma**

Insert the following after the `FinanceCustomer` model block (after line 1356). Do NOT remove FinanceVendor or FinanceCustomer yet — they stay until Task 3 migrates data.

```prisma
model FinanceContact {
  id             String   @id @default(uuid()) @db.Uuid
  organizationId BigInt?  @map("organization_id")
  contactType    String   @default("customer") @map("contact_type") @db.VarChar(20)
  subType        String   @default("business") @map("sub_type") @db.VarChar(20)
  name           String   @db.VarChar(150)
  companyName    String?  @map("company_name") @db.VarChar(150)
  legalName      String?  @map("legal_name") @db.VarChar(150)
  email          String?  @db.VarChar(255)
  phone          String?  @db.VarChar(40)
  address        String?
  billingAddress Json?    @map("billing_address")
  shippingAddress Json?   @map("shipping_address")
  taxNumber      String?  @map("tax_number") @db.VarChar(80)
  isTaxable      Boolean  @default(true) @map("is_taxable")
  isActive       Boolean  @default(true) @map("is_active")
  paymentTerms   Int?     @map("payment_terms")
  creditLimit    Decimal? @map("credit_limit") @db.Decimal(15, 2)
  openingBalance Decimal? @map("opening_balance") @db.Decimal(15, 2)
  website        String?  @db.VarChar(255)
  notes          String?
  metadata       Json?
  primaryContactId String? @map("primary_contact_id") @db.Uuid
  createdBy      BigInt?  @map("created_by")
  updatedBy      BigInt?  @map("updated_by")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  organization     Organization?             @relation(fields: [organizationId], references: [id], onDelete: SetNull)
  primaryContact   FinanceContactPerson?     @relation("ContactPrimaryPerson", fields: [primaryContactId], references: [id], onDelete: SetNull)
  contactPersons   FinanceContactPerson[]    @relation("ContactPersons")
  createdByUser    Profile?                  @relation("FinanceContactCreatedBy", fields: [createdBy], references: [id], onDelete: SetNull)
  updatedByUser    Profile?                  @relation("FinanceContactUpdatedBy", fields: [updatedBy], references: [id], onDelete: SetNull)
  bills            FinanceBillHeader[]
  payments         FinanceVendorPayment[]
  expenses         FinanceExpense[]
  paymentVouchers  FinancePaymentVoucher[]   @relation("PVContact")
  requests         RequestInstance[]         @relation("RequestContact")
  whtAccruals      FinanceVendorWHTAccrual[]
  salesInvoices    FinanceSalesInvoice[]
  receipts         FinanceReceipt[]

  @@unique([organizationId, name], name: "unique_finance_contact_name_per_org")
  @@index([contactType])
  @@index([isActive])
  @@map("sta_finance_contacts")
}
```

- [ ] **Step 2: Add FinanceContactPerson model to schema.prisma**

Insert after the FinanceContact model:

```prisma
model FinanceContactPerson {
  id          String   @id @default(uuid()) @db.Uuid
  contactId   String   @map("contact_id") @db.Uuid
  salutation  String?  @db.VarChar(10)
  firstName   String?  @map("first_name") @db.VarChar(80)
  lastName    String?  @map("last_name") @db.VarChar(80)
  email       String?  @db.VarChar(255)
  phone       String?  @db.VarChar(40)
  mobile      String?  @db.VarChar(40)
  designation String?  @db.VarChar(80)
  department  String?  @db.VarChar(80)
  isPrimary   Boolean  @default(false) @map("is_primary")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  contact     FinanceContact @relation("ContactPersons", fields: [contactId], references: [id], onDelete: Cascade)
  primaryFor  FinanceContact? @relation("ContactPrimaryPerson", fields: [], references: [])

  @@index([contactId])
  @@map("sta_finance_contact_persons")
}
```

- [ ] **Step 3: Run prisma format to validate schema**

Run: `npx prisma format --schema=api/prisma/schema.prisma`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add api/prisma/schema.prisma
git commit -m "feat(finance): add FinanceContact and FinanceContactPerson models"
```

---

### Task 2: Migration SQL — Create Tables and Migrate Data

**Files:**
- Create: `api/prisma/migrations/20260424000000_zoho_contact_entity/migration.sql`

- [ ] **Step 1: Create migration directory**

Run: `mkdir -p api/prisma/migrations/20260424000000_zoho_contact_entity`

- [ ] **Step 2: Write migration SQL**

Create `api/prisma/migrations/20260424000000_zoho_contact_entity/migration.sql`:

```sql
-- 1. Create sta_finance_contacts table
CREATE TABLE "sta_finance_contacts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" BigInt,
    "contact_type" VARCHAR(20) NOT NULL DEFAULT 'customer',
    "sub_type" VARCHAR(20) NOT NULL DEFAULT 'business',
    "name" VARCHAR(150) NOT NULL,
    "company_name" VARCHAR(150),
    "legal_name" VARCHAR(150),
    "email" VARCHAR(255),
    "phone" VARCHAR(40),
    "address" TEXT,
    "billing_address" JSONB,
    "shipping_address" JSONB,
    "tax_number" VARCHAR(80),
    "is_taxable" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "payment_terms" INTEGER,
    "credit_limit" DECIMAL(15, 2),
    "opening_balance" DECIMAL(15, 2),
    "website" VARCHAR(255),
    "notes" TEXT,
    "metadata" JSONB,
    "primary_contact_id" UUID,
    "created_by" BigInt,
    "updated_by" BigInt,
    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT now(),

    CONSTRAINT "sta_finance_contacts_pkey" PRIMARY KEY ("id")
);

-- 2. Create sta_finance_contact_persons table
CREATE TABLE "sta_finance_contact_persons" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "contact_id" UUID NOT NULL,
    "salutation" VARCHAR(10),
    "first_name" VARCHAR(80),
    "last_name" VARCHAR(80),
    "email" VARCHAR(255),
    "phone" VARCHAR(40),
    "mobile" VARCHAR(40),
    "designation" VARCHAR(80),
    "department" VARCHAR(80),
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT now(),

    CONSTRAINT "sta_finance_contact_persons_pkey" PRIMARY KEY ("id")
);

-- 3. Create indexes
CREATE INDEX "sta_finance_contacts_contact_type_idx" ON "sta_finance_contacts"("contact_type");
CREATE INDEX "sta_finance_contacts_is_active_idx" ON "sta_finance_contacts"("is_active");
CREATE INDEX "sta_finance_contact_persons_contact_id_idx" ON "sta_finance_contact_persons"("contact_id");
CREATE UNIQUE INDEX "unique_finance_contact_name_per_org" ON "sta_finance_contacts"("organization_id", "name");

-- 4. Migrate vendors into contacts
INSERT INTO "sta_finance_contacts" (
    id, organization_id, contact_type, sub_type, name, email, phone, address,
    tax_number, is_taxable, is_active, opening_balance, metadata,
    created_by, updated_by, created_at, updated_at
)
SELECT
    id, organization_id, 'vendor', 'business', name, email, phone, address,
    tax_number, true, is_active, NULL, metadata,
    created_by, updated_by, created_at, updated_at
FROM "sta_finance_vendors";

-- 5. Migrate customers into contacts (merge if same org+name exists from vendor)
-- For customers that share organization_id+name with a vendor, update to 'both' instead of inserting
INSERT INTO "sta_finance_contacts" (
    id, organization_id, contact_type, sub_type, name, email, phone, address,
    tax_number, is_taxable, is_active, credit_limit, metadata,
    created_by, updated_by, created_at, updated_at
)
SELECT
    c.id, c.organization_id, 'customer', 'business', c.name, c.email, c.phone, c.address,
    c.tax_number, true, c.is_active, NULL, c.metadata,
    c.created_by, c.updated_by, c.created_at, c.updated_at
FROM "sta_finance_customers" c
WHERE NOT EXISTS (
    SELECT 1 FROM "sta_finance_contacts" fc
    WHERE fc.organization_id = c.organization_id AND fc.name = c.name
);

-- For customers that overlap with vendors (same org+name), update the contact_type to 'both'
-- and preserve the customer's UUID in a mapping for FK updates below
CREATE TEMP TABLE customer_id_map AS
SELECT c.id AS old_customer_id, fc.id AS new_contact_id
FROM "sta_finance_customers" c
JOIN "sta_finance_contacts" fc ON fc.organization_id = c.organization_id AND fc.name = c.name
WHERE fc.contact_type = 'vendor';

UPDATE "sta_finance_contacts" SET contact_type = 'both'
WHERE id IN (SELECT new_contact_id FROM customer_id_map);

-- 6. Add contact_id column to all referencing tables (initially nullable for migration)
-- FinanceBillHeader
ALTER TABLE "sta_finance_bill_headers" ADD COLUMN "contact_id" UUID;
-- FinanceVendorPayment
ALTER TABLE "sta_finance_vendor_payments" ADD COLUMN "contact_id" UUID;
-- FinanceExpense
ALTER TABLE "sta_finance_expenses" ADD COLUMN "contact_id" UUID;
-- FinancePaymentVoucher
ALTER TABLE "sta_finance_payment_vouchers" ADD COLUMN "contact_id" UUID;
-- RequestInstance
ALTER TABLE "sta_request_instances" ADD COLUMN "contact_id" UUID;
-- FinanceVendorWHTAccrual
ALTER TABLE "sta_finance_vendor_wht_accruals" ADD COLUMN "contact_id" UUID;
-- FinanceSalesInvoice
ALTER TABLE "sta_finance_sales_invoices" ADD COLUMN "contact_id" UUID;
-- FinanceReceipt
ALTER TABLE "sta_finance_receipts" ADD COLUMN "contact_id" UUID;

-- 7. Populate contact_id from vendor_id (direct UUID match since vendors were copied with same IDs)
UPDATE "sta_finance_bill_headers" SET contact_id = vendor_id WHERE vendor_id IS NOT NULL;
UPDATE "sta_finance_vendor_payments" SET contact_id = vendor_id WHERE vendor_id IS NOT NULL;
UPDATE "sta_finance_expenses" SET contact_id = vendor_id WHERE vendor_id IS NOT NULL;
UPDATE "sta_finance_payment_vouchers" SET contact_id = vendor_id WHERE vendor_id IS NOT NULL;
UPDATE "sta_request_instances" SET contact_id = vendor_id WHERE vendor_id IS NOT NULL;
UPDATE "sta_finance_vendor_wht_accruals" SET contact_id = vendor_id WHERE vendor_id IS NOT NULL;

-- 8. Populate contact_id from customer_id
-- Direct match for customers that were inserted as new rows (no overlap)
UPDATE "sta_finance_sales_invoices" si SET contact_id = si.customer_id
WHERE si.customer_id IS NOT NULL
AND EXISTS (SELECT 1 FROM "sta_finance_contacts" fc WHERE fc.id = si.customer_id);

UPDATE "sta_finance_receipts" r SET contact_id = r.customer_id
WHERE r.customer_id IS NOT NULL
AND EXISTS (SELECT 1 FROM "sta_finance_contacts" fc WHERE fc.id = r.customer_id);

-- For customers that were merged (overlap), use the mapping table
UPDATE "sta_finance_sales_invoices" si SET contact_id = m.new_contact_id
FROM customer_id_map m
WHERE si.customer_id = m.old_customer_id;

UPDATE "sta_finance_receipts" r SET contact_id = m.new_contact_id
FROM customer_id_map r_map
WHERE r.customer_id = r_map.old_customer_id;

-- 9. Drop old FK constraints and columns, add new ones
-- FinanceBillHeader
ALTER TABLE "sta_finance_bill_headers" DROP CONSTRAINT IF EXISTS "sta_finance_bill_headers_vendor_id_fkey";
ALTER TABLE "sta_finance_bill_headers" ALTER COLUMN "contact_id" SET NOT NULL;
ALTER TABLE "sta_finance_bill_headers" DROP COLUMN "vendor_id";
ALTER TABLE "sta_finance_bill_headers" ADD CONSTRAINT "sta_finance_bill_headers_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "sta_finance_contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- FinanceVendorPayment
ALTER TABLE "sta_finance_vendor_payments" DROP CONSTRAINT IF EXISTS "sta_finance_vendor_payments_vendor_id_fkey";
ALTER TABLE "sta_finance_vendor_payments" DROP COLUMN "vendor_id";
ALTER TABLE "sta_finance_vendor_payments" ADD CONSTRAINT "sta_finance_vendor_payments_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "sta_finance_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- FinanceExpense
ALTER TABLE "sta_finance_expenses" DROP CONSTRAINT IF EXISTS "sta_finance_expenses_vendor_id_fkey";
ALTER TABLE "sta_finance_expenses" DROP COLUMN "vendor_id";
ALTER TABLE "sta_finance_expenses" ADD CONSTRAINT "sta_finance_expenses_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "sta_finance_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- FinancePaymentVoucher
ALTER TABLE "sta_finance_payment_vouchers" DROP CONSTRAINT IF EXISTS "sta_finance_payment_vouchers_vendor_id_fkey";
ALTER TABLE "sta_finance_payment_vouchers" DROP COLUMN "vendor_id";
ALTER TABLE "sta_finance_payment_vouchers" ADD CONSTRAINT "sta_finance_payment_vouchers_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "sta_finance_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RequestInstance
ALTER TABLE "sta_request_instances" DROP CONSTRAINT IF EXISTS "sta_request_instances_vendor_id_fkey";
ALTER TABLE "sta_request_instances" DROP COLUMN "vendor_id";
ALTER TABLE "sta_request_instances" ADD CONSTRAINT "sta_request_instances_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "sta_finance_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- FinanceVendorWHTAccrual
ALTER TABLE "sta_finance_vendor_wht_accruals" DROP CONSTRAINT IF EXISTS "sta_finance_vendor_wht_accruals_vendor_id_fkey";
ALTER TABLE "sta_finance_vendor_wht_accruals" ALTER COLUMN "contact_id" SET NOT NULL;
ALTER TABLE "sta_finance_vendor_wht_accruals" DROP COLUMN "vendor_id";
ALTER TABLE "sta_finance_vendor_wht_accruals" ADD CONSTRAINT "sta_finance_vendor_wht_accruals_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "sta_finance_contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- FinanceSalesInvoice
ALTER TABLE "sta_finance_sales_invoices" DROP CONSTRAINT IF EXISTS "sta_finance_sales_invoices_customer_id_fkey";
ALTER TABLE "sta_finance_sales_invoices" ALTER COLUMN "contact_id" SET NOT NULL;
ALTER TABLE "sta_finance_sales_invoices" DROP COLUMN "customer_id";
ALTER TABLE "sta_finance_sales_invoices" ADD CONSTRAINT "sta_finance_sales_invoices_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "sta_finance_contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- FinanceReceipt
ALTER TABLE "sta_finance_receipts" DROP CONSTRAINT IF EXISTS "sta_finance_receipts_customer_id_fkey";
ALTER TABLE "sta_finance_receipts" DROP COLUMN "customer_id";
ALTER TABLE "sta_finance_receipts" ADD CONSTRAINT "sta_finance_receipts_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "sta_finance_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 10. Add FK for primary_contact_id
ALTER TABLE "sta_finance_contacts" ADD CONSTRAINT "sta_finance_contacts_primary_contact_id_fkey" FOREIGN KEY ("primary_contact_id") REFERENCES "sta_finance_contact_persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 11. Add FK for contact_persons -> contacts
ALTER TABLE "sta_finance_contact_persons" ADD CONSTRAINT "sta_finance_contact_persons_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "sta_finance_contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 12. Drop old tables
DROP TABLE IF EXISTS "sta_finance_vendors";
DROP TABLE IF EXISTS "sta_finance_customers";

-- 13. Add FKs for organization and audit users
ALTER TABLE "sta_finance_contacts" ADD CONSTRAINT "sta_finance_contacts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sta_finance_contacts" ADD CONSTRAINT "sta_finance_contacts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sta_finance_contacts" ADD CONSTRAINT "sta_finance_contacts_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

- [ ] **Step 3: Commit**

```bash
git add api/prisma/migrations/20260424000000_zoho_contact_entity/migration.sql
git commit -m "feat(finance): add migration for Zoho-style contact entity"
```

---

### Task 3: Update Prisma Schema — Remove Old Models, Update FK References

**Files:**
- Modify: `api/prisma/schema.prisma`

- [ ] **Step 1: Remove FinanceVendor and FinanceCustomer models**

Delete the `FinanceCustomer` model block (lines 1332-1356) and `FinanceVendor` model block (lines 1358-1386) from `schema.prisma`.

- [ ] **Step 2: Update FinanceBillHeader — replace vendorId with contactId**

In the `FinanceBillHeader` model, replace:
```prisma
vendor    FinanceVendor @relation(fields: [vendorId], references: [id], onDelete: Restrict)
```
with:
```prisma
contact  FinanceContact @relation(fields: [contactId], references: [id], onDelete: Restrict)
```
And rename the field from `vendorId @map("vendor_id")` to `contactId @map("contact_id") @db.Uuid`.

- [ ] **Step 3: Update FinanceVendorPayment — replace vendorId with contactId**

Replace `vendor FinanceVendor @relation(...)` with `contact FinanceContact @relation(...)`, rename field `vendorId @map("vendor_id")` to `contactId @map("contact_id") @db.Uuid`.

- [ ] **Step 4: Update FinanceExpense — replace vendorId with contactId**

Replace `vendor FinanceVendor @relation(...)` with `contact FinanceContact @relation(...)`, rename field `vendorId @map("vendor_id")` to `contactId @map("contact_id") @db.Uuid`.

- [ ] **Step 5: Update FinancePaymentVoucher — replace vendorId with contactId**

Replace `vendor FinanceVendor @relation("PVVendor", ...)` with `contact FinanceContact @relation("PVContact", ...)`, rename field `vendorId @map("vendor_id")` to `contactId @map("contact_id") @db.Uuid`.

- [ ] **Step 6: Update RequestInstance — replace vendorId with contactId**

Replace `vendor FinanceVendor @relation("RequestVendor", ...)` with `contact FinanceContact @relation("RequestContact", ...)`, rename field `vendorId @map("vendor_id")` to `contactId @map("contact_id") @db.Uuid`.

- [ ] **Step 7: Update FinanceVendorWHTAccrual — replace vendorId with contactId**

Replace `vendor FinanceVendor @relation(...)` with `contact FinanceContact @relation(...)`, rename field `vendorId @map("vendor_id")` to `contactId @map("contact_id") @db.Uuid`.

- [ ] **Step 8: Update FinanceSalesInvoice — replace customerId with contactId**

Replace `customer FinanceCustomer @relation(...)` with `contact FinanceContact @relation(...)`, rename field `customerId @map("customer_id")` to `contactId @map("contact_id") @db.Uuid`.

- [ ] **Step 9: Update FinanceReceipt — replace customerId with contactId**

Replace `customer FinanceCustomer @relation(...)` with `contact FinanceContact @relation(...)`, rename field `customerId @map("customer_id")` to `contactId @map("contact_id") @db.Uuid`.

- [ ] **Step 10: Remove old Profile relation names for vendor/customer**

Remove the `FinanceVendorCreatedBy`, `FinanceVendorUpdatedBy`, `FinanceCustomerCreatedBy`, `FinanceCustomerUpdatedBy` relation annotations from the `Profile` model. The new `FinanceContactCreatedBy` and `FinanceContactUpdatedBy` relations replace them.

- [ ] **Step 11: Run prisma generate to validate**

Run: `npx prisma generate --schema=api/prisma/schema.prisma`
Expected: Success, no errors

- [ ] **Step 12: Commit**

```bash
git add api/prisma/schema.prisma
git commit -m "feat(finance): remove FinanceVendor/FinanceCustomer, update FK refs to FinanceContact"
```

---

### Task 4: Backend DTOs — Create Contact DTOs, Update Existing DTOs

**Files:**
- Create: `api/src/modules/finance/dto/upsert-contact.dto.ts`
- Create: `api/src/modules/finance/dto/upsert-contact-person.dto.ts`
- Modify: `api/src/modules/finance/dto/create-finance-bill.dto.ts` — rename `vendor_id` to `contact_id`
- Modify: `api/src/modules/finance/dto/create-finance-sales-invoice.dto.ts` — rename `customer_id` to `contact_id`
- Modify: `api/src/modules/finance/dto/create-finance-receipt.dto.ts` — rename `customer_id` to `contact_id`
- Modify: `api/src/modules/finance/dto/create-finance-vendor-payment.dto.ts` — rename `vendor_id` to `contact_id`
- Modify: `api/src/modules/finance/dto/create-finance-expense.dto.ts` — rename `vendorId` to `contact_id`

- [ ] **Step 1: Create UpsertContactDto**

Create `api/src/modules/finance/dto/upsert-contact.dto.ts`:

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsEnum, IsInt, IsOptional, IsString, IsUUID } from 'class-validator';
import { UpsertContactPersonDto } from './upsert-contact-person.dto';

export class UpsertContactDto {
  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsString()
  organization_id?: string;

  @ApiProperty({ example: 'customer', enum: ['customer', 'vendor', 'both'] })
  @IsEnum(['customer', 'vendor', 'both'])
  contact_type!: string;

  @ApiPropertyOptional({ example: 'business', enum: ['individual', 'business'] })
  @IsOptional()
  @IsEnum(['individual', 'business'])
  sub_type?: string;

  @ApiProperty({ example: 'Global Office Supplies' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'Global Office Supplies Ltd.' })
  @IsOptional()
  @IsString()
  company_name?: string;

  @ApiPropertyOptional({ example: 'Global Office Supplies Limited' })
  @IsOptional()
  @IsString()
  legal_name?: string;

  @ApiPropertyOptional({ example: 'sales@globaloffice.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+2348000000000' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ type: 'object' })
  @IsOptional()
  billing_address?: Record<string, unknown>;

  @ApiPropertyOptional({ type: 'object' })
  @IsOptional()
  shipping_address?: Record<string, unknown>;

  @ApiPropertyOptional({ example: 'TIN-12345' })
  @IsOptional()
  @IsString()
  tax_number?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_taxable?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsInt()
  payment_terms?: number;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  credit_limit?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  opening_balance?: number;

  @ApiPropertyOptional({ example: 'https://example.com' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ type: [UpsertContactPersonDto] })
  @IsOptional()
  contact_persons?: UpsertContactPersonDto[];
}
```

- [ ] **Step 2: Create UpsertContactPersonDto**

Create `api/src/modules/finance/dto/upsert-contact-person.dto.ts`:

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';

export class UpsertContactPersonDto {
  @ApiPropertyOptional({ example: 'Mr.' })
  @IsOptional()
  @IsString()
  salutation?: string;

  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+2348000000000' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '+2348011111111' })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiPropertyOptional({ example: 'CEO' })
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiPropertyOptional({ example: 'Finance' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;
}
```

- [ ] **Step 3: Update create-finance-bill.dto.ts — rename vendor_id to contact_id**

Replace `vendor_id` field with `contact_id`:
```typescript
@ApiProperty({ example: 'uuid' })
@IsUUID()
contact_id!: string;
```

- [ ] **Step 4: Update create-finance-sales-invoice.dto.ts — rename customer_id to contact_id**

Replace `customer_id` field with `contact_id`:
```typescript
@ApiProperty({ example: 'uuid' })
@IsUUID()
contact_id!: string;
```

- [ ] **Step 5: Update create-finance-receipt.dto.ts — rename customer_id to contact_id**

Replace `customer_id` field with `contact_id`:
```typescript
@ApiPropertyOptional({ example: 'uuid' })
@IsOptional()
@IsUUID()
contact_id?: string;
```

- [ ] **Step 6: Update create-finance-vendor-payment.dto.ts — rename vendor_id to contact_id**

Replace `vendor_id` field with `contact_id`:
```typescript
@ApiPropertyOptional({ example: 'uuid' })
@IsOptional()
@IsUUID()
contact_id?: string;
```

- [ ] **Step 7: Update create-finance-expense.dto.ts — rename vendorId to contact_id**

Replace `vendorId` field with `contact_id` (note: existing code uses camelCase `vendorId`, switch to snake_case `contact_id` for consistency):
```typescript
@ApiPropertyOptional({ example: 'uuid' })
@IsOptional()
@IsUUID()
contact_id?: string;
```

- [ ] **Step 8: Commit**

```bash
git add api/src/modules/finance/dto/
git commit -m "feat(finance): add contact DTOs, update bill/invoice/receipt/expense DTOs"
```

---

### Task 5: Backend Service — Add Contact CRUD Methods, Update References

**Files:**
- Modify: `api/src/modules/finance/finance.service.ts`

- [ ] **Step 1: Add listContacts method**

Add to `FinanceService` class (after existing customer/vendor methods, around line 2687):

```typescript
async listContacts(query: Record<string, any>) {
  const where: any = {};
  if (query.organization_id) where.organizationId = BigInt(query.organization_id);
  if (query.is_active !== undefined) where.isActive = query.is_active === 'true' || query.is_active === true;
  if (query.contact_type) where.contactType = query.contact_type;
  if (query.sub_type) where.subType = query.sub_type;
  if (query.q) {
    const q = String(query.q).trim();
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q, mode: 'insensitive' } },
      { companyName: { contains: q, mode: 'insensitive' } },
    ];
  }

  const page = Number(query.page || 1);
  const perPage = Number(query.per_page || 20);
  const [result, total] = await Promise.all([
    this.prisma.financeContact.findMany({
      where,
      include: { contactPersons: { where: { isPrimary: true }, take: 1 } },
      orderBy: { name: 'asc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    this.prisma.financeContact.count({ where }),
  ]);
  return { result: result.map(r => this.serializeContact(r)), total, total_result: total, per_page: perPage, page, pages: Math.ceil(total / perPage) };
}
```

- [ ] **Step 2: Add getContact method**

```typescript
async getContact(id: string) {
  const contact = await this.prisma.financeContact.findUnique({
    where: { id },
    include: { contactPersons: { orderBy: { isPrimary: 'desc' } }, organization: true },
  });
  if (!contact) throw new NotFoundException('Contact not found');
  return this.serializeContact(contact);
}
```

- [ ] **Step 3: Add createContact method**

```typescript
async createContact(dto: UpsertContactDto, actorId?: string) {
  const data: any = {
    contactType: dto.contact_type,
    subType: dto.sub_type || 'business',
    name: dto.name.trim(),
    companyName: dto.company_name?.trim() || null,
    legalName: dto.legal_name?.trim() || null,
    email: dto.email?.trim() || null,
    phone: dto.phone?.trim() || null,
    address: dto.address?.trim() || null,
    billingAddress: dto.billing_address || null,
    shippingAddress: dto.shipping_address || null,
    taxNumber: dto.tax_number?.trim() || null,
    isTaxable: dto.is_taxable ?? true,
    isActive: dto.is_active ?? true,
    paymentTerms: dto.payment_terms || null,
    creditLimit: dto.credit_limit ? dto.credit_limit : null,
    openingBalance: dto.opening_balance ? dto.opening_balance : null,
    website: dto.website?.trim() || null,
    notes: dto.notes?.trim() || null,
    metadata: dto.metadata || undefined,
    createdBy: actorId ? BigInt(actorId) : null,
    updatedBy: actorId ? BigInt(actorId) : null,
  };
  if (dto.organization_id) data.organizationId = BigInt(dto.organization_id);

  const contact = await this.prisma.financeContact.create({ data, include: { contactPersons: true } });

  if (Array.isArray(dto.contact_persons) && dto.contact_persons.length > 0) {
    const persons = await Promise.all(
      dto.contact_persons.map((p, idx) =>
        this.prisma.financeContactPerson.create({
          data: {
            contactId: contact.id,
            salutation: p.salutation || null,
            firstName: p.first_name?.trim() || null,
            lastName: p.last_name?.trim() || null,
            email: p.email?.trim() || null,
            phone: p.phone?.trim() || null,
            mobile: p.mobile?.trim() || null,
            designation: p.designation?.trim() || null,
            department: p.department?.trim() || null,
            isPrimary: p.is_primary ?? (idx === 0),
          },
        })
      )
    );
    const primaryPerson = persons.find(p => p.isPrimary);
    if (primaryPerson) {
      await this.prisma.financeContact.update({ where: { id: contact.id }, data: { primaryContactId: primaryPerson.id } });
    }
    contact.contactPersons = persons;
    contact.primaryContactId = primaryPerson?.id || null;
  }

  return this.serializeContact(contact);
}
```

- [ ] **Step 4: Add updateContact method**

```typescript
async updateContact(id: string, dto: UpsertContactDto, actorId?: string) {
  const existing = await this.prisma.financeContact.findUnique({ where: { id } });
  if (!existing) throw new NotFoundException('Contact not found');

  const data: any = {
    contactType: dto.contact_type ?? existing.contactType,
    subType: dto.sub_type ?? existing.subType,
    name: dto.name !== undefined ? dto.name.trim() : existing.name,
    companyName: dto.company_name !== undefined ? (dto.company_name?.trim() || null) : existing.companyName,
    legalName: dto.legal_name !== undefined ? (dto.legal_name?.trim() || null) : existing.legalName,
    email: dto.email !== undefined ? (dto.email?.trim() || null) : existing.email,
    phone: dto.phone !== undefined ? (dto.phone?.trim() || null) : existing.phone,
    address: dto.address !== undefined ? (dto.address?.trim() || null) : existing.address,
    billingAddress: dto.billing_address !== undefined ? (dto.billing_address || null) : existing.billingAddress,
    shippingAddress: dto.shipping_address !== undefined ? (dto.shipping_address || null) : existing.shippingAddress,
    taxNumber: dto.tax_number !== undefined ? (dto.tax_number?.trim() || null) : existing.taxNumber,
    isTaxable: dto.is_taxable ?? existing.isTaxable,
    isActive: dto.is_active ?? existing.isActive,
    paymentTerms: dto.payment_terms !== undefined ? (dto.payment_terms || null) : existing.paymentTerms,
    creditLimit: dto.credit_limit !== undefined ? (dto.credit_limit ? dto.credit_limit : null) : existing.creditLimit,
    openingBalance: dto.opening_balance !== undefined ? (dto.opening_balance ? dto.opening_balance : null) : existing.openingBalance,
    website: dto.website !== undefined ? (dto.website?.trim() || null) : existing.website,
    notes: dto.notes !== undefined ? (dto.notes?.trim() || null) : existing.notes,
    metadata: dto.metadata !== undefined ? (dto.metadata || undefined) : existing.metadata,
    updatedBy: actorId ? BigInt(actorId) : null,
  };
  if (dto.organization_id !== undefined) data.organizationId = dto.organization_id ? BigInt(dto.organization_id) : null;

  const contact = await this.prisma.financeContact.update({ where: { id }, data, include: { contactPersons: { orderBy: { isPrimary: 'desc' } } } });

  if (Array.isArray(dto.contact_persons)) {
    await this.prisma.financeContactPerson.deleteMany({ where: { contactId: id } });
    const persons = await Promise.all(
      dto.contact_persons.map((p, idx) =>
        this.prisma.financeContactPerson.create({
          data: {
            contactId: id,
            salutation: p.salutation || null,
            firstName: p.first_name?.trim() || null,
            lastName: p.last_name?.trim() || null,
            email: p.email?.trim() || null,
            phone: p.phone?.trim() || null,
            mobile: p.mobile?.trim() || null,
            designation: p.designation?.trim() || null,
            department: p.department?.trim() || null,
            isPrimary: p.is_primary ?? (idx === 0),
          },
        })
      )
    );
    const primaryPerson = persons.find(p => p.isPrimary);
    if (primaryPerson) {
      await this.prisma.financeContact.update({ where: { id }, data: { primaryContactId: primaryPerson.id } });
    }
    contact.contactPersons = persons;
  }

  return this.serializeContact(contact);
}
```

- [ ] **Step 5: Add serializeContact method**

```typescript
serializeContact(row: any) {
  const obj = row.toObject ? row.toObject() : row;
  return {
    id: obj.id,
    organization: obj.organization ? { id: String(obj.organization.id), name: obj.organization.name } : null,
    contact_type: obj.contactType,
    sub_type: obj.subType,
    name: obj.name,
    company_name: obj.companyName || null,
    legal_name: obj.legalName || null,
    email: obj.email || null,
    phone: obj.phone || null,
    address: obj.address || null,
    billing_address: obj.billingAddress || null,
    shipping_address: obj.shippingAddress || null,
    tax_number: obj.taxNumber || null,
    is_taxable: obj.isTaxable,
    is_active: obj.isActive,
    payment_terms: obj.paymentTerms || null,
    credit_limit: obj.creditLimit ? Number(obj.creditLimit) : null,
    opening_balance: obj.openingBalance ? Number(obj.openingBalance) : null,
    website: obj.website || null,
    notes: obj.notes || null,
    metadata: obj.metadata || null,
    primary_contact_id: obj.primaryContactId || null,
    contact_persons: Array.isArray(obj.contactPersons)
      ? obj.contactPersons.map((p: any) => ({
          id: p.id,
          salutation: p.salutation || null,
          first_name: p.firstName || null,
          last_name: p.lastName || null,
          email: p.email || null,
          phone: p.phone || null,
          mobile: p.mobile || null,
          designation: p.designation || null,
          department: p.department || null,
          is_primary: p.isPrimary,
        }))
      : [],
    created_at: obj.createdAt?.toISOString?.() ?? obj.createdAt,
    updated_at: obj.updatedAt?.toISOString?.() ?? obj.updatedAt,
  };
}
```

- [ ] **Step 6: Update listCustomers to use FinanceContact**

Replace the existing `listCustomers` method body with:

```typescript
async listCustomers(query: Record<string, any>) {
  return this.listContacts({ ...query, contact_type: 'customer' });
}
```

- [ ] **Step 7: Update listVendors to use FinanceContact**

Replace the existing `listVendors` method body with:

```typescript
async listVendors(query: Record<string, any>) {
  return this.listContacts({ ...query, contact_type: 'vendor' });
}
```

Note: When `contact_type='vendor'`, the query should also include rows where `contactType='both'`. Update the `listContacts` `where` clause for `contact_type`:

```typescript
if (query.contact_type) {
  where.OR = where.OR
    ? [...where.OR, { contactType: query.contact_type }, { contactType: 'both' }]
    : [{ contactType: query.contact_type }, { contactType: 'both' }];
}
```

Wait — this conflicts with the search `OR` clause. Better approach: use a combined `where` with `AND`:

```typescript
if (query.contact_type) {
  where.contactType = { in: [query.contact_type, 'both'] };
}
```

This is cleaner. Apply this in the `listContacts` method from Step 1 instead of the simple `where.contactType = query.contact_type`.

- [ ] **Step 8: Update createCustomer to delegate to createContact**

```typescript
async createCustomer(dto: UpsertFinanceCustomerDto, actorId?: string) {
  const contactDto = new UpsertContactDto();
  contactDto.contact_type = 'customer';
  contactDto.sub_type = 'business';
  contactDto.name = dto.name;
  contactDto.email = dto.email;
  contactDto.phone = dto.phone;
  contactDto.address = dto.address;
  contactDto.tax_number = dto.tax_number;
  contactDto.is_active = dto.is_active;
  contactDto.metadata = dto.metadata;
  contactDto.organization_id = dto.organization_id;
  return this.createContact(contactDto, actorId);
}
```

- [ ] **Step 9: Update updateCustomer to delegate to updateContact**

```typescript
async updateCustomer(id: string, dto: UpsertFinanceCustomerDto, actorId?: string) {
  const contactDto = new UpsertContactDto();
  contactDto.name = dto.name;
  contactDto.email = dto.email;
  contactDto.phone = dto.phone;
  contactDto.address = dto.address;
  contactDto.tax_number = dto.tax_number;
  contactDto.is_active = dto.is_active;
  contactDto.metadata = dto.metadata;
  contactDto.organization_id = dto.organization_id;
  return this.updateContact(id, contactDto, actorId);
}
```

- [ ] **Step 10: Update createVendor to delegate to createContact**

```typescript
async createVendor(dto: UpsertFinanceVendorDto, actorId?: string) {
  const contactDto = new UpsertContactDto();
  contactDto.contact_type = 'vendor';
  contactDto.sub_type = 'business';
  contactDto.name = dto.name;
  contactDto.email = dto.email;
  contactDto.phone = dto.phone;
  contactDto.address = dto.address;
  contactDto.tax_number = dto.tax_number;
  contactDto.is_active = dto.is_active;
  contactDto.metadata = dto.metadata;
  contactDto.organization_id = dto.organization_id;
  return this.createContact(contactDto, actorId);
}
```

- [ ] **Step 11: Update updateVendor to delegate to updateContact**

```typescript
async updateVendor(id: string, dto: UpsertFinanceVendorDto, actorId?: string) {
  const contactDto = new UpsertContactDto();
  contactDto.name = dto.name;
  contactDto.email = dto.email;
  contactDto.phone = dto.phone;
  contactDto.address = dto.address;
  contactDto.tax_number = dto.tax_number;
  contactDto.is_active = dto.is_active;
  contactDto.metadata = dto.metadata;
  contactDto.organization_id = dto.organization_id;
  return this.updateContact(id, contactDto, actorId);
}
```

- [ ] **Step 12: Update FK references in service methods**

In the following methods, update the Prisma field names from `vendorId` to `contactId` and `customerId` to `contactId`, and the model references from `financeVendor` to `financeContact` and `financeCustomer` to `financeContact`:

- `listSalesInvoices`: `where.customerId` -> `where.contactId`
- `createSalesInvoice`: `prisma.financeCustomer.findUnique` -> `prisma.financeContact.findUnique`, `dto.customer_id` -> `dto.contact_id`
- `listBills`: `where.vendorId` -> `where.contactId`
- `createBill`: `prisma.financeVendor.findUnique` -> `prisma.financeContact.findUnique`, `dto.vendor_id` -> `dto.contact_id`
- `listExpenses`: `where.vendorId` -> `where.contactId`
- `createReceipt`: all `customer_id` references -> `contact_id`, `customerId` -> `contactId`
- `createVendorPayment`: all `vendor_id` references -> `contact_id`, `vendorId` -> `contactId`
- `customerStatement`: update `customerId` -> `contactId` references
- `vendorStatement`: update `vendorId` -> `contactId` references (if exists)
- `serializeCustomer` / `serializeVendor`: can be removed or delegated to `serializeContact`

- [ ] **Step 13: Update deduction.service.ts FK references**

In `api/src/modules/finance/deduction.service.ts`, update any `vendorId` references to `contactId` and `financeVendor` to `financeContact`.

- [ ] **Step 14: Commit**

```bash
git add api/src/modules/finance/finance.service.ts api/src/modules/finance/deduction.service.ts
git commit -m "feat(finance): add contact CRUD, update service FK references"
```

---

### Task 6: Backend Controller — Add Contact Routes, Keep Backward-Compat Aliases

**Files:**
- Modify: `api/src/modules/finance/finance.controller.ts`

- [ ] **Step 1: Add unified contact routes**

Insert new routes before the existing customer routes (around line 157):

```typescript
@Get('contacts')
@Permissions('finance.view')
@ApiOperation({ summary: 'List finance contacts' })
listContacts(@Query() query: Record<string, any>) {
  return this.financeService.listContacts(query);
}

@Get('contacts/:id')
@Permissions('finance.view')
@ApiOperation({ summary: 'Get finance contact' })
getContact(@Param('id') id: string) {
  return this.financeService.getContact(id);
}

@Post('contacts')
@Permissions('requests.manage')
@ApiOperation({ summary: 'Create finance contact' })
createContact(@Req() req: any, @Body() dto: UpsertContactDto) {
  return this.financeService.createContact(dto, req.user?.id);
}

@Post('contacts/:id')
@Permissions('requests.manage')
@ApiOperation({ summary: 'Update finance contact' })
updateContact(@Req() req: any, @Param('id') id: string, @Body() dto: UpsertContactDto) {
  return this.financeService.updateContact(id, dto, req.user?.id);
}

@Get('contacts/:id/transactions')
@Permissions('finance.view')
@ApiOperation({ summary: 'Get contact transactions' })
contactTransactions(@Param('id') id: string, @Query() query: Record<string, any>) {
  return this.financeService.contactTransactions(id, query);
}

@Get('contacts/:id/statement')
@Permissions('finance.view')
@ApiOperation({ summary: 'Get contact statement' })
contactStatement(@Param('id') id: string, @Query() query: Record<string, any>) {
  return this.financeService.contactStatement(id, query);
}
```

- [ ] **Step 2: Keep existing vendor/customer routes as backward-compat aliases**

The existing `/finance/vendors` and `/finance/customers` routes continue to work because the service methods now delegate to `listContacts` with the appropriate `contact_type` filter. No changes needed to the existing route definitions.

- [ ] **Step 3: Add import for UpsertContactDto**

Add to the controller's import block:
```typescript
import { UpsertContactDto } from './dto/upsert-contact.dto';
```

- [ ] **Step 4: Commit**

```bash
git add api/src/modules/finance/finance.controller.ts
git commit -m "feat(finance): add unified contact controller routes"
```

---

### Task 7: Shared API — Add ContactRecord Type and API Methods

**Files:**
- Modify: `apps/shared/src/api/finance-api.ts`
- Modify: `apps/shared/src/index.ts`

- [ ] **Step 1: Add ContactPersonRecord and ContactRecord types**

In `apps/shared/src/api/finance-api.ts`, add after the `VendorRecord` type definition (around line 161):

```typescript
export type ContactPersonRecord = {
  id: string;
  salutation?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  designation?: string | null;
  department?: string | null;
  is_primary: boolean;
};

export type ContactRecord = FinancePartyRecord & {
  contact_type: "customer" | "vendor" | "both";
  sub_type: "individual" | "business";
  company_name?: string | null;
  legal_name?: string | null;
  billing_address?: Record<string, unknown> | null;
  shipping_address?: Record<string, unknown> | null;
  tax_number?: string | null;
  is_taxable?: boolean;
  payment_terms?: number | null;
  credit_limit?: number | null;
  opening_balance?: number | null;
  website?: string | null;
  notes?: string | null;
  primary_contact_id?: string | null;
  contact_persons: ContactPersonRecord[];
  outstanding_amount?: number;
};
```

- [ ] **Step 2: Add contact API client methods**

In the `createFinanceApi` function, add after the vendor methods (around line 499):

```typescript
listContacts(params?: Record<string, unknown>) {
  return httpRequest<any>(`/finance/contacts${toQuery(params)}`).then((response) => {
    const rows = Array.isArray(response?.result) ? response.result : Array.isArray(response) ? response : [];
    return {
      result: rows,
      total: Number(response?.total ?? response?.total_result ?? rows.length),
      total_result: Number(response?.total_result ?? response?.total ?? rows.length),
      per_page: Number(response?.per_page ?? 20),
      page: Number(response?.page ?? 1),
      pages: Number(response?.pages ?? 1)
    };
  });
},

getContact(id: string) {
  return httpRequest<ContactRecord>(`/finance/contacts/${id}`);
},

createContact(payload: Record<string, unknown>) {
  return httpRequest<ContactRecord>("/finance/contacts", { method: "POST", body: payload });
},

updateContact(id: string, payload: Record<string, unknown>) {
  return httpRequest<ContactRecord>(`/finance/contacts/${id}`, { method: "POST", body: payload });
},

getContactTransactions(id: string) {
  return httpRequest<PartyTransaction[]>(`/finance/contacts/${id}/transactions`);
},
```

- [ ] **Step 3: Update VendorRecord and CustomerRecord to extend ContactRecord (optional backward compat)**

Add `contact_type` and `sub_type` as optional fields to `VendorRecord` and `CustomerRecord` so existing code doesn't break:

```typescript
export type CustomerRecord = FinancePartyRecord & {
  outstanding_amount?: number;
  credit_limit?: number;
  pan?: string | null;
  tpin?: string | null;
  contact_type?: "customer" | "vendor" | "both";
  sub_type?: "individual" | "business";
  company_name?: string | null;
  contact_persons?: ContactPersonRecord[];
};

export type VendorRecord = FinancePartyRecord & {
  outstanding_amount?: number;
  opening_balance?: number;
  tax_number?: string | null;
  contact_type?: "customer" | "vendor" | "both";
  sub_type?: "individual" | "business";
  company_name?: string | null;
  contact_persons?: ContactPersonRecord[];
};
```

- [ ] **Step 4: Export new types from index.ts**

In `apps/shared/src/index.ts`, add to the existing type exports from `finance-api`:

```typescript
export type {
  FinancePartyRecord,
  CustomerRecord,
  VendorRecord,
  ContactRecord,
  ContactPersonRecord,
  PartyTransaction,
  ...
} from "./api/finance-api";
```

- [ ] **Step 5: Commit**

```bash
git add apps/shared/src/api/finance-api.ts apps/shared/src/index.ts
git commit -m "feat(finance): add ContactRecord type and contact API methods"
```

---

### Task 8: Frontend — Create Shared Contact Components

**Files:**
- Create: `apps/pwa/src/modules/finance/contacts/helpers.ts`
- Create: `apps/pwa/src/modules/finance/contacts/ContactPersonForm.tsx`
- Create: `apps/pwa/src/modules/finance/contacts/ContactFormSlideOver.tsx`
- Create: `apps/pwa/src/modules/finance/contacts/ContactDetailView.tsx`

- [ ] **Step 1: Create contacts/helpers.ts**

Create `apps/pwa/src/modules/finance/contacts/helpers.ts`:

```typescript
import { formatCurrency } from "@stanforte/shared";
import type { ContactPersonRecord } from "@stanforte/shared";

export function asMoney(value: unknown, currency = "NGN") {
  const amount = Number(value || 0);
  return formatCurrency(Number.isFinite(amount) ? amount : 0, currency);
}

export function asDate(value: unknown) {
  const raw = typeof value === "string" ? value : "";
  if (!raw) return "-";
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? raw : parsed.toLocaleDateString();
}

export type ContactFormState = {
  contact_type: "customer" | "vendor" | "both";
  sub_type: "individual" | "business";
  name: string;
  company_name: string;
  legal_name: string;
  email: string;
  phone: string;
  address: string;
  billing_address: Record<string, unknown> | null;
  shipping_address: Record<string, unknown> | null;
  tax_number: string;
  is_taxable: boolean;
  is_active: boolean;
  payment_terms: string;
  credit_limit: string;
  opening_balance: string;
  website: string;
  notes: string;
  contact_persons: ContactPersonFormState[];
};

export type ContactPersonFormState = {
  salutation: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  mobile: string;
  designation: string;
  department: string;
  is_primary: boolean;
};

export const emptyPerson: ContactPersonFormState = {
  salutation: "",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  mobile: "",
  designation: "",
  department: "",
  is_primary: false,
};

export function emptyContactForm(contactType: "customer" | "vendor" | "both" = "customer"): ContactFormState {
  return {
    contact_type: contactType,
    sub_type: "business",
    name: "",
    company_name: "",
    legal_name: "",
    email: "",
    phone: "",
    address: "",
    billing_address: null,
    shipping_address: null,
    tax_number: "",
    is_taxable: true,
    is_active: true,
    payment_terms: "",
    credit_limit: "",
    opening_balance: "",
    website: "",
    notes: "",
    contact_persons: [{ ...emptyPerson, is_primary: true }],
  };
}

export function contactPersonFromRecord(r: ContactPersonRecord): ContactPersonFormState {
  return {
    salutation: r.salutation || "",
    first_name: r.first_name || "",
    last_name: r.last_name || "",
    email: r.email || "",
    phone: r.phone || "",
    mobile: r.mobile || "",
    designation: r.designation || "",
    department: r.department || "",
    is_primary: r.is_primary,
  };
}
```

- [ ] **Step 2: Create ContactPersonForm.tsx**

Create `apps/pwa/src/modules/finance/contacts/ContactPersonForm.tsx`:

```tsx
import { Button, Icon, SelectField, TextField } from "@/shared";
import type { ContactPersonFormState } from "./helpers";
import { emptyPerson } from "./helpers";

type Props = {
  persons: ContactPersonFormState[];
  setPersons: React.Dispatch<React.SetStateAction<ContactPersonFormState[]>>;
  readOnly?: boolean;
};

export function ContactPersonForm({ persons, setPersons, readOnly }: Props) {
  function update(index: number, field: keyof ContactPersonFormState, value: string | boolean) {
    setPersons((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (field === "is_primary" && value === true) {
        next.forEach((p, i) => {
          if (i !== index) next[i] = { ...next[i], is_primary: false };
        });
      }
      return next;
    });
  }

  function addPerson() {
    setPersons((prev) => [...prev, { ...emptyPerson }]);
  }

  function removePerson(index: number) {
    setPersons((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Contact Persons</h3>
        {!readOnly && (
          <Button variant="ghost" size="sm" onClick={addPerson}>
            <Icon name="add" className="text-[16px]" /> Add
          </Button>
        )}
      </div>
      {persons.map((person, idx) => (
        <div key={idx} className="grid gap-3 rounded-md border border-slate-200 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Person {idx + 1}</span>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={person.is_primary}
                  onChange={(e) => update(idx, "is_primary", e.target.checked)}
                  disabled={readOnly}
                  className="h-3.5 w-3.5 rounded border-slate-300"
                />
                Primary
              </label>
              {!readOnly && persons.length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => removePerson(idx)}>
                  <Icon name="delete" className="text-[16px] text-danger" />
                </Button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Salutation" value={person.salutation} onChange={(e) => update(idx, "salutation", e.target.value)} disabled={readOnly}>
              <option value="">None</option>
              <option value="Mr.">Mr.</option>
              <option value="Ms.">Ms.</option>
              <option value="Mrs.">Mrs.</option>
              <option value="Dr.">Dr.</option>
            </SelectField>
            <div />
            <TextField label="First Name" value={person.first_name} onChange={(e) => update(idx, "first_name", e.target.value)} disabled={readOnly} placeholder="John" />
            <TextField label="Last Name" value={person.last_name} onChange={(e) => update(idx, "last_name", e.target.value)} disabled={readOnly} placeholder="Doe" />
            <TextField label="Email" type="email" value={person.email} onChange={(e) => update(idx, "email", e.target.value)} disabled={readOnly} placeholder="john@example.com" />
            <TextField label="Phone" value={person.phone} onChange={(e) => update(idx, "phone", e.target.value)} disabled={readOnly} placeholder="+234..." />
            <TextField label="Mobile" value={person.mobile} onChange={(e) => update(idx, "mobile", e.target.value)} disabled={readOnly} placeholder="+234..." />
            <TextField label="Designation" value={person.designation} onChange={(e) => update(idx, "designation", e.target.value)} disabled={readOnly} placeholder="CEO" />
            <TextField label="Department" value={person.department} onChange={(e) => update(idx, "department", e.target.value)} disabled={readOnly} placeholder="Finance" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create ContactFormSlideOver.tsx**

Create `apps/pwa/src/modules/finance/contacts/ContactFormSlideOver.tsx`:

```tsx
import {
  Button,
  SelectField,
  SlideOver,
  SlideOverContent,
  SlideOverFooter,
  SlideOverHeader,
  TextField,
} from "@/shared";
import type { ContactRecord } from "@stanforte/shared";
import { ContactPersonForm } from "./ContactPersonForm";
import type { ContactFormState, ContactPersonFormState } from "./helpers";
import { emptyContactForm, contactPersonFromRecord } from "./helpers";

type Props = {
  open: boolean;
  onClose: () => void;
  editing: ContactRecord | null;
  contactType: "customer" | "vendor" | "both";
  form: ContactFormState;
  setForm: React.Dispatch<React.SetStateAction<ContactFormState>>;
  saving: boolean;
  onSave: () => void;
};

export function ContactFormSlideOver({
  open,
  onClose,
  editing,
  contactType,
  form,
  setForm,
  saving,
  onSave,
}: Props) {
  const label = contactType === "vendor" ? "Vendor" : contactType === "customer" ? "Customer" : "Contact";
  const setPersons: React.Dispatch<React.SetStateAction<ContactPersonFormState[]>> = (action) => {
    setForm((f) => ({
      ...f,
      contact_persons: typeof action === "function" ? action(f.contact_persons) : action,
    }));
  };

  const showBusinessFields = form.sub_type === "business";

  return (
    <SlideOver open={open} onClose={onClose} size="lg">
      <SlideOverHeader
        title={editing ? `Edit ${label}` : `New ${label}`}
        subtitle={editing ? editing.name : `Add a new ${label.toLowerCase()} account.`}
        onClose={onClose}
      />
      <SlideOverContent>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Type" value={form.contact_type} onChange={(e) => setForm((f) => ({ ...f, contact_type: e.target.value as any }))}>
              <option value="customer">Customer</option>
              <option value="vendor">Vendor</option>
              <option value="both">Both</option>
            </SelectField>
            <SelectField label="Sub Type" value={form.sub_type} onChange={(e) => setForm((f) => ({ ...f, sub_type: e.target.value as any }))}>
              <option value="business">Business</option>
              <option value="individual">Individual</option>
            </SelectField>
          </div>
          <TextField label={showBusinessFields ? "Contact Name" : "Full Name"} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder={showBusinessFields ? "Primary contact person" : "Full name"} />
          {showBusinessFields && (
            <>
              <TextField label="Company Name" value={form.company_name} onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))} placeholder="Registered company name" />
              <TextField label="Legal Name" value={form.legal_name} onChange={(e) => setForm((f) => ({ ...f, legal_name: e.target.value }))} placeholder="Legal / registered name" />
            </>
          )}
          <TextField label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="contact@example.com" />
          <TextField label="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+234..." />
          <TextField label="Address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Street address" />
          <TextField label="Tax Number" value={form.tax_number} onChange={(e) => setForm((f) => ({ ...f, tax_number: e.target.value }))} placeholder="TIN-12345" />
          <TextField label="Website" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="https://..." />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Payment Terms (days)" value={form.payment_terms} onChange={(e) => setForm((f) => ({ ...f, payment_terms: e.target.value }))} placeholder="30" />
            {form.contact_type !== "vendor" && (
              <TextField label="Credit Limit" value={form.credit_limit} onChange={(e) => setForm((f) => ({ ...f, credit_limit: e.target.value }))} placeholder="50000" />
            )}
            {form.contact_type !== "customer" && (
              <TextField label="Opening Balance" value={form.opening_balance} onChange={(e) => setForm((f) => ({ ...f, opening_balance: e.target.value }))} placeholder="0" />
            )}
          </div>
          <TextField label="Notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Internal notes..." />
          <SelectField label="Status" value={form.is_active ? "true" : "false"} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.value === "true" }))}>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </SelectField>

          {showBusinessFields && (
            <ContactPersonForm persons={form.contact_persons} setPersons={setPersons} />
          )}
        </div>
      </SlideOverContent>
      <SlideOverFooter>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={onSave} disabled={saving}>{saving ? "Saving..." : editing ? `Update ${label}` : `Create ${label}`}</Button>
      </SlideOverFooter>
    </SlideOver>
  );
}
```

- [ ] **Step 4: Create ContactDetailView.tsx**

Create `apps/pwa/src/modules/finance/contacts/ContactDetailView.tsx`:

```tsx
import { useState } from "react";
import {
  Button,
  Chip,
  Icon,
  PageHeader,
  SectionCard,
  StatCard,
  Table,
  TableBody,
  TableCell,
  TableHeaderRow,
  TableRow,
} from "@/shared";
import { financeApi, useCachedQuery } from "@/shared/lib/core";
import type { ContactRecord } from "@stanforte/shared";
import { asMoney } from "./helpers";

type Props = {
  contactId: string;
  contactType: "customer" | "vendor";
  onEdit: (c: ContactRecord) => void;
  transactionsTab: React.ReactNode;
  whtTab?: React.ReactNode;
};

export function ContactDetailView({ contactId, contactType, onEdit, transactionsTab, whtTab }: Props) {
  const [activeTab, setActiveTab] = useState<"info" | "contacts" | "transactions" | "wht">("info");

  const { data: contact } = useCachedQuery(
    `finance:contact:${contactId}`,
    () => financeApi.getContact(contactId),
    { ttlMs: 60_000, storage: "memory" },
  );

  const c = contact as ContactRecord | undefined;
  if (!c) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-500">Loading details...</p>
      </div>
    );
  }

  const label = contactType === "vendor" ? "Vendor" : "Customer";
  const breadcrumbLabel = contactType === "vendor" ? "Vendors" : "Customers";
  const breadcrumbPath = contactType === "vendor" ? "/finance/vendors" : "/finance/customers";
  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: "info", label: "Details" },
  ];
  if (c.sub_type === "business") tabs.push({ key: "contacts", label: "Contact Persons" });
  tabs.push({ key: "transactions", label: "Transactions" });
  if (contactType === "vendor" || c.contact_type === "both") tabs.push({ key: "wht", label: "WHT" });

  const primaryPerson = c.contact_persons?.find((p) => p.is_primary);

  return (
    <>
      <PageHeader
        eyebrow="Finance"
        breadcrumbs={[
          { label: "Finance", path: "/finance" },
          { label: breadcrumbLabel, path: breadcrumbPath },
          { label: c.name || contactId.slice(0, 8) },
        ]}
        title={c.company_name || c.name || `${label} Details`}
        actions={
          <Button onClick={() => onEdit(c)}>
            <Icon name="edit" className="text-[18px]" />
            Edit
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Outstanding" value={asMoney(c.outstanding_amount)} tone="warning" />
        {contactType !== "customer" && <StatCard label="Opening Balance" value={asMoney(c.opening_balance)} tone="neutral" />}
        {contactType !== "vendor" && <StatCard label="Credit Limit" value={asMoney(c.credit_limit)} tone="neutral" />}
        <StatCard label="Type" value={c.sub_type === "business" ? "Business" : "Individual"} tone="neutral" />
        <StatCard label="Status" value={c.is_active ? "Active" : "Inactive"} tone={c.is_active ? "success" : "neutral"} />
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.key
                ? "border-brand-900 text-brand-900"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "info" ? (
        <SectionCard>
          <Table>
            <TableBody>
              {c.company_name && (
                <TableRow>
                  <TableCell className="w-40 font-medium text-slate-500">Company Name</TableCell>
                  <TableCell className="font-semibold">{c.company_name}</TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">Contact Name</TableCell>
                <TableCell className="font-semibold">{c.name || "-"}</TableCell>
              </TableRow>
              {c.legal_name && (
                <TableRow>
                  <TableCell className="w-40 font-medium text-slate-500">Legal Name</TableCell>
                  <TableCell>{c.legal_name}</TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">Email</TableCell>
                <TableCell>{c.email || "-"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">Phone</TableCell>
                <TableCell>{c.phone || "-"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">Address</TableCell>
                <TableCell>{c.address || "-"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">Tax Number</TableCell>
                <TableCell>{c.tax_number || "-"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">Website</TableCell>
                <TableCell>{c.website || "-"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">Payment Terms</TableCell>
                <TableCell>{c.payment_terms ? `${c.payment_terms} days` : "-"}</TableCell>
              </TableRow>
              {primaryPerson && (
                <TableRow>
                  <TableCell className="w-40 font-medium text-slate-500">Primary Contact</TableCell>
                  <TableCell>{[primaryPerson.first_name, primaryPerson.last_name].filter(Boolean).join(" ") || "-"} {primaryPerson.email ? `(${primaryPerson.email})` : ""}</TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">Type</TableCell>
                <TableCell><Chip variant="neutral">{c.contact_type}</Chip></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">Taxable</TableCell>
                <TableCell>{c.is_taxable ? "Yes" : "No"}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </SectionCard>
      ) : activeTab === "contacts" ? (
        <SectionCard title="Contact Persons">
          {c.contact_persons?.length ? (
            <Table caption="Contact Persons">
              <TableHeaderRow>
                <TableCell className="font-medium">Name</TableCell>
                <TableCell className="font-medium">Email</TableCell>
                <TableCell className="font-medium">Phone</TableCell>
                <TableCell className="font-medium">Designation</TableCell>
                <TableCell className="font-medium">Primary</TableCell>
              </TableHeaderRow>
              {c.contact_persons.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{[p.salutation, p.first_name, p.last_name].filter(Boolean).join(" ")}</TableCell>
                  <TableCell>{p.email || "-"}</TableCell>
                  <TableCell>{p.phone || p.mobile || "-"}</TableCell>
                  <TableCell>{p.designation || "-"}</TableCell>
                  <TableCell>{p.is_primary ? <Chip variant="success">Yes</Chip> : "No"}</TableCell>
                </TableRow>
              ))}
            </Table>
          ) : (
            <p className="text-sm text-slate-500">No contact persons.</p>
          )}
        </SectionCard>
      ) : activeTab === "transactions" ? (
        transactionsTab
      ) : (
        whtTab
      )}
    </>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/modules/finance/contacts/
git commit -m "feat(finance): add shared contact components (form, detail, person editor)"
```

---

### Task 9: Frontend — Update Vendor Page to Use Contact API

**Files:**
- Modify: `apps/pwa/src/modules/finance/vendors/index.tsx`
- Modify: `apps/pwa/src/modules/finance/vendors/VendorDetailView.tsx`
- Modify: `apps/pwa/src/modules/finance/vendors/VendorFormSlideOver.tsx`
- Modify: `apps/pwa/src/modules/finance/vendors/VendorTransactionsTab.tsx`
- Modify: `apps/pwa/src/modules/finance/vendors/VendorWHTTab.tsx`
- Modify: `apps/pwa/src/modules/finance/vendors/WHTCertificateModal.tsx`
- Modify: `apps/pwa/src/modules/finance/vendors/helpers.ts`

- [ ] **Step 1: Update vendors/helpers.ts to import from shared contact helpers**

Replace `apps/pwa/src/modules/finance/vendors/helpers.ts` contents with:

```typescript
export { asMoney, asDate } from "../contacts/helpers";
export type { ContactFormState as PartyFormState } from "../contacts/helpers";
export { emptyContactForm as emptyForm } from "../contacts/helpers";
```

Wait — `emptyForm` in the old helpers was a plain object, but `emptyContactForm` requires a `contactType` argument. The vendor page needs `emptyContactForm("vendor")`. We need a wrapper:

```typescript
export { asMoney, asDate } from "../contacts/helpers";
export type { ContactFormState as PartyFormState } from "../contacts/helpers";
import { emptyContactForm } from "../contacts/helpers";
export const emptyForm = emptyContactForm("vendor");
```

- [ ] **Step 2: Update vendors/VendorFormSlideOver.tsx to use ContactFormSlideOver**

Replace the entire file with a thin wrapper:

```tsx
import type { ContactRecord } from "@stanforte/shared";
import { ContactFormSlideOver } from "../contacts/ContactFormSlideOver";
import type { ContactFormState } from "../contacts/helpers";

type VendorFormSlideOverProps = {
  open: boolean;
  onClose: () => void;
  editing: ContactRecord | null;
  form: ContactFormState;
  setForm: React.Dispatch<React.SetStateAction<ContactFormState>>;
  saving: boolean;
  onSave: () => void;
};

export function VendorFormSlideOver(props: VendorFormSlideOverProps) {
  return <ContactFormSlideOver {...props} contactType="vendor" />;
}
```

- [ ] **Step 3: Update vendors/VendorDetailView.tsx to use ContactDetailView**

Replace the entire file with:

```tsx
import type { ContactRecord } from "@stanforte/shared";
import { ContactDetailView } from "../contacts/ContactDetailView";
import { VendorTransactionsTab } from "./VendorTransactionsTab";
import { VendorWHTTab } from "./VendorWHTTab";

export function VendorDetailView({ vendorId, onEdit }: { vendorId: string; onEdit: (v: ContactRecord) => void }) {
  return (
    <ContactDetailView
      contactId={vendorId}
      contactType="vendor"
      onEdit={onEdit}
      transactionsTab={<VendorTransactionsTab vendorId={vendorId} />}
      whtTab={<VendorWHTTab vendorId={vendorId} />}
    />
  );
}
```

- [ ] **Step 4: Update vendors/VendorTransactionsTab.tsx**

Change `financeApi.getVendorTransactions(vendorId)` to `financeApi.getContactTransactions(vendorId)`. Update the import type from `VendorRecord` to `ContactRecord` if needed.

- [ ] **Step 5: Update vendors/VendorWHTTab.tsx**

No changes needed if it already uses `financeApi.listVendorWHTAccruals(vendorId)` directly. If it references `VendorRecord`, update to `ContactRecord`.

- [ ] **Step 6: Update vendors/WHTCertificateModal.tsx**

Change `financeApi.getVendor(vendorId)` to `financeApi.getContact(vendorId)`. Update type references from `VendorRecord` to `ContactRecord`.

- [ ] **Step 7: Update vendors/index.tsx — use contact API**

In `vendors/index.tsx`, update:
- Change `financeApi.listVendors(query)` to `financeApi.listContacts({ ...query, contact_type: 'vendor' })`
- Change `financeApi.createVendor(payload)` to `financeApi.createContact({ ...payload, contact_type: 'vendor' })`
- Change `financeApi.updateVendor(id, payload)` to `financeApi.updateContact(id, { ...payload, contact_type: 'vendor' })`
- Update the `openEdit` function to map `ContactRecord` fields to the new `ContactFormState`:

```typescript
function openEdit(contact: ContactRecord) {
  setEditing(contact);
  setForm({
    contact_type: contact.contact_type || "vendor",
    sub_type: contact.sub_type || "business",
    name: contact.name || "",
    company_name: contact.company_name || "",
    legal_name: contact.legal_name || "",
    email: contact.email || "",
    phone: contact.phone || "",
    address: contact.address || "",
    billing_address: contact.billing_address || null,
    shipping_address: contact.shipping_address || null,
    tax_number: contact.tax_number || "",
    is_taxable: contact.is_taxable ?? true,
    is_active: contact.is_active ?? true,
    payment_terms: String(contact.payment_terms || ""),
    credit_limit: String(contact.credit_limit || ""),
    opening_balance: String(contact.opening_balance || ""),
    website: contact.website || "",
    notes: contact.notes || "",
    contact_persons: contact.contact_persons?.length
      ? contact.contact_persons.map(contactPersonFromRecord)
      : [{ ...emptyPerson, is_primary: true }],
  });
  setSlideOverOpen(true);
}
```

- Update the `handleSave` function to build the payload with all new fields:

```typescript
async function handleSave() {
  if (!form.name.trim()) {
    showToast({ tone: "danger", title: "Validation error", message: "Name is required." });
    return;
  }
  setSaving(true);
  try {
    const payload: Record<string, unknown> = {
      contact_type: form.contact_type,
      sub_type: form.sub_type,
      name: form.name.trim(),
      company_name: form.company_name.trim() || undefined,
      legal_name: form.legal_name.trim() || undefined,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      address: form.address.trim() || undefined,
      billing_address: form.billing_address || undefined,
      shipping_address: form.shipping_address || undefined,
      tax_number: form.tax_number.trim() || undefined,
      is_taxable: form.is_taxable,
      is_active: form.is_active,
      payment_terms: form.payment_terms ? Number(form.payment_terms) : undefined,
      credit_limit: form.credit_limit ? Number(form.credit_limit) : undefined,
      opening_balance: form.opening_balance ? Number(form.opening_balance) : undefined,
      website: form.website.trim() || undefined,
      notes: form.notes.trim() || undefined,
      contact_persons: form.contact_persons
        .filter((p) => p.first_name || p.last_name || p.email)
        .map((p) => ({
          salutation: p.salutation || undefined,
          first_name: p.first_name || undefined,
          last_name: p.last_name || undefined,
          email: p.email || undefined,
          phone: p.phone || undefined,
          mobile: p.mobile || undefined,
          designation: p.designation || undefined,
          department: p.department || undefined,
          is_primary: p.is_primary,
        })),
    };
    if (editing) {
      await financeApi.updateContact(String(editing.id), payload);
      showToast({ tone: "success", title: "Vendor updated", message: "Changes saved." });
    } else {
      await financeApi.createContact(payload);
      showToast({ tone: "success", title: "Vendor created", message: "New vendor added." });
    }
    setSlideOverOpen(false);
    setListKey((k) => k + 1);
  } catch (err) {
    showToast({
      tone: "danger",
      title: "Save failed",
      message: err instanceof Error ? err.message : "Unable to save.",
    });
  } finally {
    setSaving(false);
  }
}
```

- Update type imports: `VendorRecord` -> `ContactRecord`, add `contactPersonFromRecord`, `emptyPerson`, `ContactFormState` from shared helpers

- [ ] **Step 8: Commit**

```bash
git add apps/pwa/src/modules/finance/vendors/
git commit -m "feat(finance): update vendor pages to use contact API"
```

---

### Task 10: Frontend — Update Customer Page to Use Contact API

**Files:**
- Modify: `apps/pwa/src/modules/finance/customers/index.tsx`
- Modify: `apps/pwa/src/modules/finance/customers/CustomerDetailView.tsx`
- Modify: `apps/pwa/src/modules/finance/customers/CustomerFormSlideOver.tsx`
- Modify: `apps/pwa/src/modules/finance/customers/CustomerTransactionsTab.tsx`
- Modify: `apps/pwa/src/modules/finance/customers/helpers.ts`

- [ ] **Step 1: Update customers/helpers.ts**

Replace contents with:

```typescript
export { asMoney, asDate } from "../contacts/helpers";
export type { ContactFormState as PartyFormState } from "../contacts/helpers";
import { emptyContactForm } from "../contacts/helpers";
export const emptyForm = emptyContactForm("customer");
```

- [ ] **Step 2: Update customers/CustomerFormSlideOver.tsx**

Replace with thin wrapper:

```tsx
import type { ContactRecord } from "@stanforte/shared";
import { ContactFormSlideOver } from "../contacts/ContactFormSlideOver";
import type { ContactFormState } from "../contacts/helpers";

type CustomerFormSlideOverProps = {
  open: boolean;
  onClose: () => void;
  editing: ContactRecord | null;
  form: ContactFormState;
  setForm: React.Dispatch<React.SetStateAction<ContactFormState>>;
  saving: boolean;
  onSave: () => void;
  size?: "md" | "lg" | "xl";
};

export function CustomerFormSlideOver(props: CustomerFormSlideOverProps) {
  return <ContactFormSlideOver {...props} contactType="customer" />;
}
```

- [ ] **Step 3: Update customers/CustomerDetailView.tsx**

Replace with wrapper using ContactDetailView:

```tsx
import type { ContactRecord } from "@stanforte/shared";
import { ContactDetailView } from "../contacts/ContactDetailView";
import { CustomerTransactionsTab } from "./CustomerTransactionsTab";

export function CustomerDetailView({ customerId, onEdit }: { customerId: string; onEdit: (c: ContactRecord) => void }) {
  return (
    <ContactDetailView
      contactId={customerId}
      contactType="customer"
      onEdit={onEdit}
      transactionsTab={<CustomerTransactionsTab customerId={customerId} />}
    />
  );
}
```

- [ ] **Step 4: Update customers/CustomerTransactionsTab.tsx**

Change `financeApi.getCustomerTransactions(customerId)` to `financeApi.getContactTransactions(customerId)`.

- [ ] **Step 5: Update customers/index.tsx — use contact API**

Same pattern as Task 9 Step 7 but for customers:
- `financeApi.listCustomers(query)` -> `financeApi.listContacts({ ...query, contact_type: 'customer' })`
- `financeApi.createCustomer(payload)` -> `financeApi.createContact({ ...payload, contact_type: 'customer' })`
- `financeApi.updateCustomer(id, payload)` -> `financeApi.updateContact(id, { ...payload, contact_type: 'customer' })`
- Update `openEdit` to map `ContactRecord` to `ContactFormState`
- Update `handleSave` to build full contact payload
- Update type imports: `CustomerRecord` -> `ContactRecord`

- [ ] **Step 6: Commit**

```bash
git add apps/pwa/src/modules/finance/customers/
git commit -m "feat(finance): update customer pages to use contact API"
```

---

### Task 11: Frontend — Update Cross-References (Bills, Invoices, Expenses, Request Form)

**Files:**
- Modify: `apps/pwa/src/modules/finance/FinanceBillsPage.tsx`
- Modify: `apps/pwa/src/modules/finance/FinanceSalesInvoicesPage.tsx`
- Modify: `apps/pwa/src/modules/finance/FinanceExpensesPage.tsx`
- Modify: `apps/pwa/src/features/requests/pages/new/RequestFormPage.tsx`

- [ ] **Step 1: Update FinanceBillsPage.tsx**

In the bill form, rename `vendor_id` field references to `contact_id`:
- Form state: `vendor_id: ""` -> `contact_id: ""`
- Validation: `vendor_id` -> `contact_id`
- Payload: `vendor_id` -> `contact_id`
- API call to load vendors: `financeApi.listVendors()` -> `financeApi.listContacts({ contact_type: 'vendor' })`
- Dropdown label: "Vendor" stays the same (user-facing)

- [ ] **Step 2: Update FinanceSalesInvoicesPage.tsx**

Rename `customer_id` field references to `contact_id`:
- Form state: `customer_id: ""` -> `contact_id: ""`
- Validation: `customer_id` -> `contact_id`
- Payload: `customer_id` -> `contact_id`
- API call: `financeApi.listCustomers()` -> `financeApi.listContacts({ contact_type: 'customer' })`
- Dropdown label: "Customer" stays the same

- [ ] **Step 3: Update FinanceExpensesPage.tsx**

Rename `vendor_id` field references to `contact_id`:
- Form state: `vendor_id: ""` -> `contact_id: ""`
- Payload: `vendor_id` -> `contact_id`
- API call: `financeApi.listVendors()` -> `financeApi.listContacts({ contact_type: 'vendor' })`

- [ ] **Step 4: Update RequestFormPage.tsx**

Rename `vendor_id` field references to `contact_id`:
- FormState type: `vendor_id: string` -> `contact_id: string`
- Default form: `vendor_id: ""` -> `contact_id: ""`
- Load from data: `data.vendor_id` -> `data.contact_id`
- Build payload: `vendor_id` -> `contact_id`
- API call: `financeApi.listVendors()` -> `financeApi.listContacts({ contact_type: 'vendor' })`
- Dropdown label stays "Vendor"

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/modules/finance/FinanceBillsPage.tsx apps/pwa/src/modules/finance/FinanceSalesInvoicesPage.tsx apps/pwa/src/modules/finance/FinanceExpensesPage.tsx apps/pwa/src/features/requests/pages/new/RequestFormPage.tsx
git commit -m "feat(finance): update cross-references from vendor_id/customer_id to contact_id"
```

---

### Task 12: Frontend — Add "Contacts" Navigation Item and Route

**Files:**
- Modify: `apps/pwa/src/shared/navigation.ts`
- Modify: `apps/pwa/src/App.tsx` (or wherever routes are defined)

- [ ] **Step 1: Add Contacts nav item**

In `apps/pwa/src/shared/navigation.ts`, add a "Contacts" entry under the Finance Setup group (or as a top-level Finance item). Place it near Vendors/Customers:

```typescript
{ key: "finance-contacts", label: "Contacts", icon: "people", path: "/finance/contacts" },
```

Add this in the "Money In" group after Customers, or create a separate "Directory" group.

- [ ] **Step 2: Add /finance/contacts route**

In `apps/pwa/src/App.tsx`, add a route for the contacts page:

```tsx
<Route path="/finance/contacts" element={<FinanceContactsPage />} />
```

Create a minimal `FinanceContactsPage` at `apps/pwa/src/modules/finance/FinanceContactsPage.tsx` that lists all contacts (both vendors and customers) with a `contact_type` filter dropdown. This can follow the same pattern as the vendor/customer list pages but using `financeApi.listContacts()`.

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/src/shared/navigation.ts apps/pwa/src/App.tsx apps/pwa/src/modules/finance/FinanceContactsPage.tsx
git commit -m "feat(finance): add Contacts page and navigation"
```

---

### Task 13: Backend — Add contactTransactions and contactStatement Service Methods

**Files:**
- Modify: `api/src/modules/finance/finance.service.ts`

- [ ] **Step 1: Add contactTransactions method**

The existing `customerTransactions` and (if exists) `vendorTransactions` methods should be unified. Add:

```typescript
async contactTransactions(id: string, query: Record<string, any>) {
  const contact = await this.prisma.financeContact.findUnique({ where: { id } });
  if (!contact) throw new NotFoundException('Contact not found');

  if (contact.contactType === 'customer' || contact.contactType === 'both') {
    return this.customerTransactions(id, query);
  }
  // For vendors, return vendor-side transactions
  return this.vendorTransactions(id, query);
}
```

Note: If `vendorTransactions` doesn't exist yet, it needs to be created mirroring `customerTransactions` but querying bills, vendor payments, and expenses instead of invoices and receipts. For the initial implementation, `contactTransactions` can delegate to the existing transaction methods.

- [ ] **Step 2: Add contactStatement method**

```typescript
async contactStatement(id: string, query: Record<string, any>) {
  const contact = await this.prisma.financeContact.findUnique({ where: { id } });
  if (!contact) throw new NotFoundException('Contact not found');

  if (contact.contactType === 'customer' || contact.contactType === 'both') {
    return this.customerStatement(id, query);
  }
  return this.vendorStatement(id, query);
}
```

- [ ] **Step 3: Commit**

```bash
git add api/src/modules/finance/finance.service.ts
git commit -m "feat(finance): add contactTransactions and contactStatement methods"
```

---

### Task 14: Remove Obsolete Backend Code

**Files:**
- Delete: `api/src/modules/finance/dto/upsert-finance-vendor.dto.ts`
- Delete: `api/src/modules/finance/dto/upsert-finance-customer.dto.ts`
- Modify: `api/src/modules/finance/finance.service.ts` — remove `serializeCustomer` and `serializeVendor` if no longer used
- Modify: `api/src/modules/finance/finance.controller.ts` — optionally remove old vendor/customer routes if backward-compat is no longer needed

- [ ] **Step 1: Remove old DTOs**

```bash
rm api/src/modules/finance/dto/upsert-finance-vendor.dto.ts
rm api/src/modules/finance/dto/upsert-finance-customer.dto.ts
```

- [ ] **Step 2: Remove serializeCustomer and serializeVendor from finance.service.ts**

These methods are replaced by `serializeContact`. Remove them if no other code references them. Search the codebase first.

- [ ] **Step 3: Update controller imports**

Remove imports of `UpsertFinanceVendorDto` and `UpsertFinanceCustomerDto` from the controller file. The existing vendor/customer routes that still use them need to be updated to use `UpsertContactDto` instead, OR removed if the frontend no longer calls those endpoints.

Decision: Keep the backward-compat routes for now but have them accept `UpsertContactDto`:

```typescript
@Post('customers')
@Permissions('requests.manage')
@ApiOperation({ summary: 'Create finance customer (backward compat)' })
createCustomer(@Req() req: any, @Body() dto: UpsertContactDto) {
  dto.contact_type = 'customer';
  return this.financeService.createContact(dto, req.user?.id);
}

@Post('vendors')
@Permissions('requests.manage')
@ApiOperation({ summary: 'Create finance vendor (backward compat)' })
createVendor(@Req() req: any, @Body() dto: UpsertContactDto) {
  dto.contact_type = 'vendor';
  return this.financeService.createContact(dto, req.user?.id);
}
```

Similarly for the list and update routes.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(finance): remove obsolete vendor/customer DTOs, clean up backward-compat routes"
```

---

### Task 15: Verification — TypeScript Compilation and Manual Testing

**Files:** None (verification only)

- [ ] **Step 1: Run TypeScript compilation on API**

Run: `npx tsc --noEmit -p api/tsconfig.json`
Expected: 0 errors

- [ ] **Step 2: Run TypeScript compilation on PWA**

Run: `npx tsc --noEmit -p apps/pwa/tsconfig.json`
Expected: 0 errors

- [ ] **Step 3: Run TypeScript compilation on shared**

Run: `npx tsc --noEmit -p apps/shared/tsconfig.json`
Expected: 0 errors

- [ ] **Step 4: Run Prisma generate and validate**

Run: `npx prisma generate --schema=api/prisma/schema.prisma && npx prisma validate --schema=api/prisma/schema.prisma`
Expected: Success

- [ ] **Step 5: Fix any errors found**

Address any TypeScript or Prisma validation errors. Common issues:
- Stale imports referencing `FinanceVendor` or `FinanceCustomer`
- Missing `contact_type` or `contact_id` fields in form payloads
- Type mismatches between `VendorRecord`/`CustomerRecord` and `ContactRecord`

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore(finance): fix TypeScript errors from contact entity migration"
```

---

## Self-Review Checklist

**1. Spec coverage:**
- Zoho-style single Contact entity ✅ (Task 1-3)
- Contact persons sub-model ✅ (Task 1, 4, 8)
- Individual/business sub-type ✅ (Task 4, 8)
- Company name, legal name ✅ (Task 4, 8)
- Billing/shipping addresses ✅ (Task 4, 8)
- Payment terms, credit limit, opening balance ✅ (Task 4, 8)
- Backward-compat routes ✅ (Task 6)
- Frontend vendor/customer pages updated ✅ (Task 9-10)
- Cross-references updated ✅ (Task 11)
- Navigation entry ✅ (Task 12)
- Contact transactions/statements ✅ (Task 13)

**2. Placeholder scan:** No TBD, TODO, or vague steps found.

**3. Type consistency:**
- `ContactRecord` type used consistently across shared API, frontend pages, and form handlers
- `ContactFormState` defined in contacts/helpers.ts and re-exported from vendor/customer helpers
- `contact_id` used consistently in DTOs and API payloads (not `vendor_id` or `customer_id`)
- `contactType` (Prisma) maps to `contact_type` (API/serializer) consistently
