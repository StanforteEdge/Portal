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

const PROCUREMENT_REQUEST_TYPES = [
  {
    name: 'Goods Procurement Request',
    codePrefix: 'PG',
    description: 'Procurement request for goods purchases',
  },
  {
    name: 'Services Procurement Request',
    codePrefix: 'PS',
    description: 'Procurement request for service engagements',
  },
  {
    name: 'Works Procurement Request',
    codePrefix: 'PW',
    description: 'Procurement request for works and project execution',
  },
];

async function main() {
  loadApiEnv();
  const prisma = new PrismaClient();
  const now = new Date();

  try {
    let group = await prisma.requestGroup.findUnique({ where: { code: 'FIN' } });
    if (!group) {
      group = await prisma.requestGroup.create({
        data: {
          code: 'FIN',
          name: 'Finance',
          description: 'Finance request group',
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
      });
    }

    const category = await prisma.requestCategory.upsert({
      where: { code: 'PROCUREMENT' },
      update: {
        name: 'Procurement',
        groupId: group.id,
        description: 'Procurement-related requests for goods, services, and works',
        sortOrder: 40,
        isActive: true,
        updatedAt: now,
      },
      create: {
        code: 'PROCUREMENT',
        name: 'Procurement',
        groupId: group.id,
        description: 'Procurement-related requests for goods, services, and works',
        sortOrder: 40,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    });

    for (const type of PROCUREMENT_REQUEST_TYPES) {
      const existingType = await prisma.requestType.findFirst({
        where: {
          categoryId: category.id,
          codePrefix: type.codePrefix,
        },
      });

      const data = {
        name: type.name,
        description: type.description,
        storageType: 'json',
        formSchema: {},
        approvalFlowJson: {
          steps: [
            { role: 'team_lead' },
            { role: 'procurement_officer' },
          ],
        },
        visibleToRoles: ['staff'],
        workflowType: 'procurement',
        isActive: true,
        updatedAt: now,
      };

      if (existingType) {
        await prisma.requestType.update({
          where: { id: existingType.id },
          data,
        });
        console.log(`Updated RequestType "${type.name}" (${type.codePrefix}) under category "${category.name}"`);
      } else {
        await prisma.requestType.create({
          data: {
            categoryId: category.id,
            codePrefix: type.codePrefix,
            createdAt: now,
            ...data,
          },
        });
        console.log(`Created RequestType "${type.name}" (${type.codePrefix}) under category "${category.name}"`);
      }
    }

    console.log('Procurement request types seed complete');
  } catch (err) {
    console.error('Procurement request type seed failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Main thread unhandled rejection:', err);
  process.exit(1);
});
