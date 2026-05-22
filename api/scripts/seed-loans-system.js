/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

function loadApiEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

/**
 * Category sort orders (lower = first):
 *   PAYMENT  = 10
 *   LEAVE    = 20
 *   LOAN     = 30
 *   (Others always rendered last by the frontend)
 */
const CATEGORY_SORT_ORDERS = {
  PAYMENT: 10,
  LEAVE: 20,
  LOAN: 30,
};

const loanRequestTypes = [
  {
    name: 'Loan Request',
    codePrefix: 'LN',
    description: 'Staff Loan Request',
    storageType: 'json',
    formSchema: {},
    approvalFlowJson: {
      steps: [
        { role: 'team_lead' },
        { role: 'hr' },
        { role: 'accountant' }
      ]
    },
    visibleToRoles: ['staff']
  },
  {
    name: 'Salary Advance',
    codePrefix: 'SA',
    description: 'Staff Salary Advance Request',
    storageType: 'json',
    formSchema: {},
    approvalFlowJson: {
      steps: [
        { role: 'team_lead' },
        { role: 'hr' },
        { role: 'accountant' }
      ]
    },
    visibleToRoles: ['staff']
  }
];

async function main() {
  loadApiEnv();
  const prisma = new PrismaClient();
  const now = new Date();

  try {
    // 1. Find or create the HR group
    let hrGroup = await prisma.requestGroup.findUnique({
      where: { code: 'HR' }
    });

    if (!hrGroup) {
      console.log('HR request group not found, creating it...');
      hrGroup = await prisma.requestGroup.create({
        data: {
          code: 'HR',
          name: 'Human Resources',
          description: 'HR request group',
          isActive: true,
          createdAt: now,
          updatedAt: now
        }
      });
    }

    // 2. Upsert RequestCategory 'LOAN' under the HR group
    const category = await prisma.requestCategory.upsert({
      where: { code: 'LOAN' },
      update: {
        name: 'Loans',
        groupId: hrGroup.id,
        description: 'Staff Loans & Salary Advances',
        sortOrder: CATEGORY_SORT_ORDERS.LOAN,
        isActive: true,
        updatedAt: now
      },
      create: {
        code: 'LOAN',
        name: 'Loans',
        groupId: hrGroup.id,
        description: 'Staff Loans & Salary Advances',
        sortOrder: CATEGORY_SORT_ORDERS.LOAN,
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    });

    console.log(`Upserted RequestCategory "${category.name}" (${category.code}, sortOrder: ${category.sortOrder}) under Group "${hrGroup.name}"`);

    // 3. Upsert the RequestTypes
    for (const type of loanRequestTypes) {
      const existingType = await prisma.requestType.findFirst({
        where: {
          categoryId: category.id,
          codePrefix: type.codePrefix
        }
      });

      if (existingType) {
        await prisma.requestType.update({
          where: { id: existingType.id },
          data: {
            name: type.name,
            description: type.description,
            storageType: type.storageType,
            formSchema: type.formSchema,
            approvalFlowJson: type.approvalFlowJson,
            visibleToRoles: type.visibleToRoles,
            isActive: true,
            updatedAt: now
          }
        });
        console.log(`Updated RequestType "${type.name}" (${type.codePrefix}) under category "${category.name}"`);
      } else {
        await prisma.requestType.create({
          data: {
            categoryId: category.id,
            name: type.name,
            codePrefix: type.codePrefix,
            description: type.description,
            storageType: type.storageType,
            formSchema: type.formSchema,
            approvalFlowJson: type.approvalFlowJson,
            visibleToRoles: type.visibleToRoles,
            isActive: true,
            createdAt: now,
            updatedAt: now
          }
        });
        console.log(`Created RequestType "${type.name}" (${type.codePrefix}) under category "${category.name}"`);
      }
    }

    // 4. Update sort orders for existing categories (PAYMENT, LEAVE)
    for (const [code, sortOrder] of Object.entries(CATEGORY_SORT_ORDERS)) {
      if (code === 'LOAN') continue; // already handled above
      const existing = await prisma.requestCategory.findUnique({ where: { code } });
      if (existing) {
        await prisma.requestCategory.update({
          where: { id: existing.id },
          data: { sortOrder, updatedAt: now }
        });
        console.log(`Updated sortOrder for "${existing.name}" (${code}) to ${sortOrder}`);
      }
    }

    console.log('Loans database seeding completed successfully!');
  } catch (err) {
    console.error('Error seeding loans database:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Main thread unhandled rejection:', err);
  process.exit(1);
});
