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

const requestTypes = [
  {
    name: 'Goods Purchase',
    codePrefix: 'PRG',
    description: 'Request procurement of goods and equipment.',
  },
  {
    name: 'Service Procurement',
    codePrefix: 'PRS',
    description: 'Request procurement of services or retainers.',
  },
  {
    name: 'Works Request',
    codePrefix: 'PRW',
    description: 'Request procurement of works and project execution services.',
  },
];

async function main() {
  loadApiEnv();
  const prisma = new PrismaClient();
  const now = new Date();

  try {
    const procurementCategory = await prisma.requestCategory.findUnique({
      where: { code: 'PROCUREMENT' },
    });

    if (!procurementCategory) {
      throw new Error('PROCUREMENT category not found. Run seed:request-categories first.');
    }

    for (const type of requestTypes) {
      await prisma.requestType.upsert({
        where: {
          unique_category_code_prefix: {
            categoryId: procurementCategory.id,
            codePrefix: type.codePrefix,
          },
        },
        update: {
          name: type.name,
          description: type.description,
          storageType: 'json',
          formSchema: {},
          approvalFlowJson: null,
          workflowType: 'procurement',
          handlerRoleLabel: 'Procurement Officer',
          isActive: true,
          updatedAt: now,
        },
        create: {
          categoryId: procurementCategory.id,
          name: type.name,
          codePrefix: type.codePrefix,
          description: type.description,
          storageType: 'json',
          formSchema: {},
          approvalFlowJson: null,
          workflowType: 'procurement',
          handlerRoleLabel: 'Procurement Officer',
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
      });
    }

    console.log('Procurement requests seed complete');
    console.log(`- request types: ${requestTypes.map((t) => t.codePrefix).join(', ')}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Procurement requests seed failed:', err);
  process.exit(1);
});
