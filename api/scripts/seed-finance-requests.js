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

const financeGroup = {
  code: 'FIN',
  name: 'Finance',
  description: 'Finance request group'
};

const requestTypes = [
  {
    name: 'Petty Cash',
    codePrefix: 'PC',
    description: 'Petty cash request (target cap: 50,000)',
    approvalLimit: 50000,
    approvalFlowJson: {
      steps: [
        { approver: { type: 'relation', value: 'requester_team_lead' } },
        { approver: { type: 'permission', value: 'finance.approve' } }
      ]
    }
  },
  {
    name: 'Operational Request',
    codePrefix: 'OP',
    description: 'Operational expense request with threshold-based approvals',
    approvalLimit: null,
    approvalFlowJson: {
      steps: [
        { approver: { type: 'relation', value: 'requester_team_lead' } },
        { approver: { type: 'permission', value: 'finance.approve' } },
        { approver: { type: 'office', value: 'coo' }, min_amount: 500000 },
        { approver: { type: 'office', value: 'ed' }, min_amount: 2000000 }
      ]
    }
  }
];

const missingRoleSeeds = [
  { name: 'Team Lead', slug: 'team_lead', description: 'Team-level approver for requests' },
  { name: 'COO', slug: 'coo', description: 'Chief Operating Officer approver role' },
  { name: 'ED', slug: 'ed', description: 'Executive Director approver role' }
];

async function main() {
  loadApiEnv();
  const prisma = new PrismaClient();

  try {
    const now = new Date();

    for (const role of missingRoleSeeds) {
      await prisma.role.upsert({
        where: { slug: role.slug },
        update: {
          name: role.name,
          description: role.description,
          isActive: true,
          updatedAt: now
        },
        create: {
          name: role.name,
          slug: role.slug,
          description: role.description,
          isActive: true,
          createdAt: now,
          updatedAt: now
        }
      });
    }

    const group = await prisma.requestGroup.upsert({
      where: { code: financeGroup.code },
      update: {
        name: financeGroup.name,
        description: financeGroup.description,
        isActive: true,
        updatedAt: now
      },
      create: {
        code: financeGroup.code,
        name: financeGroup.name,
        description: financeGroup.description,
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    });

    for (const type of requestTypes) {
      await prisma.requestType.upsert({
        where: {
          unique_group_code_prefix: {
            groupId: group.id,
            codePrefix: type.codePrefix
          }
        },
        update: {
          name: type.name,
          description: type.description,
          storageType: 'json',
          approvalFlowJson: type.approvalFlowJson,
          approvalLimit: type.approvalLimit,
          isActive: true,
          updatedAt: now
        },
        create: {
          groupId: group.id,
          name: type.name,
          codePrefix: type.codePrefix,
          description: type.description,
          storageType: 'json',
          approvalFlowJson: type.approvalFlowJson,
          approvalLimit: type.approvalLimit,
          isActive: true,
          createdAt: now,
          updatedAt: now
        }
      });
    }

    console.log('Finance requests seed complete');
    console.log(`- group: ${group.name} (${group.code})`);
    console.log(`- request types: ${requestTypes.map((t) => t.codePrefix).join(', ')}`);
    console.log(`- ensured roles: ${missingRoleSeeds.map((r) => r.slug).join(', ')}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Finance requests seed failed:', err);
  process.exit(1);
});
