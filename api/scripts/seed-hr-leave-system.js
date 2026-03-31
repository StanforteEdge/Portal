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
    if (!(key in process.env)) process.env[key] = value;
  }
}

const HR_GROUP = {
  code: 'HR',
  name: 'Human Resources',
  description: 'HR request group',
};

const TAXONOMY = {
  key: 'hr_leave_types',
  name: 'HR Leave Types',
  module: 'hr',
  terms: ['annual_leave', 'sick_leave', 'casual_leave'],
};

const REQUEST_TYPE = {
  name: 'Leave Request',
  codePrefix: 'LR',
  categoryKey: TAXONOMY.key,
  description: 'Standard leave request workflow',
  approvalFlowJson: {
    steps: [
      { approver: { type: 'relation', value: 'requester_team_lead_or_manager' } },
      { approver: { type: 'permission', value: 'hr.approve' } },
    ],
  },
};

const ENTITLEMENTS = {
  annual_leave: 20,
  sick_leave: 10,
  casual_leave: 5,
};

async function upsertPolicy(prisma, now, payload) {
  const existing = await prisma.policy.findFirst({
    where: {
      module: payload.module,
      policyKey: payload.policyKey,
      scopeType: payload.scopeType,
      scopeId: payload.scopeId ?? null,
    },
    orderBy: { createdAt: 'asc' },
  });

  if (existing) {
    return prisma.policy.update({
      where: { id: existing.id },
      data: {
        configJson: payload.configJson,
        priority: payload.priority ?? 100,
        isActive: true,
        updatedAt: now,
      },
    });
  }

  return prisma.policy.create({
    data: {
      module: payload.module,
      policyKey: payload.policyKey,
      scopeType: payload.scopeType,
      scopeId: payload.scopeId ?? null,
      priority: payload.priority ?? 100,
      configJson: payload.configJson,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  });
}

async function main() {
  loadApiEnv();
  const prisma = new PrismaClient();
  const now = new Date();
  const year = now.getFullYear();

  try {
    const group = await prisma.requestGroup.upsert({
      where: { code: HR_GROUP.code },
      update: {
        name: HR_GROUP.name,
        description: HR_GROUP.description,
        isActive: true,
        updatedAt: now,
      },
      create: {
        code: HR_GROUP.code,
        name: HR_GROUP.name,
        description: HR_GROUP.description,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    });

    const taxonomy = await prisma.taxonomy.upsert({
      where: { key: TAXONOMY.key },
      update: {
        name: TAXONOMY.name,
        module: TAXONOMY.module,
        isActive: true,
        updatedAt: now,
      },
      create: {
        key: TAXONOMY.key,
        name: TAXONOMY.name,
        module: TAXONOMY.module,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    });

    await prisma.$transaction(async (tx) => {
      await tx.taxonomyTerm.deleteMany({ where: { taxonomyId: taxonomy.id } });
      await tx.taxonomyTerm.createMany({
        data: TAXONOMY.terms.map((term, index) => ({
          taxonomyId: taxonomy.id,
          value: term,
          label: term
            .split('_')
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' '),
          sortOrder: index,
          isActive: true,
        })),
      });
    });

    const leaveRequestType = await prisma.requestType.upsert({
      where: {
        unique_group_code_prefix: {
          groupId: group.id,
          codePrefix: REQUEST_TYPE.codePrefix,
        },
      },
      update: {
        name: REQUEST_TYPE.name,
        categoryKey: REQUEST_TYPE.categoryKey,
        description: REQUEST_TYPE.description,
        storageType: 'json',
        formSchema: {},
        approvalFlowJson: REQUEST_TYPE.approvalFlowJson,
        isActive: true,
        updatedAt: now,
      },
      create: {
        groupId: group.id,
        name: REQUEST_TYPE.name,
        codePrefix: REQUEST_TYPE.codePrefix,
        categoryKey: REQUEST_TYPE.categoryKey,
        description: REQUEST_TYPE.description,
        storageType: 'json',
        formSchema: {},
        approvalFlowJson: REQUEST_TYPE.approvalFlowJson,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    });

    await upsertPolicy(prisma, now, {
      module: 'leave',
      policyKey: 'leave_entitlements',
      scopeType: 'global',
      scopeId: null,
      priority: 100,
      configJson: ENTITLEMENTS,
    });

    await upsertPolicy(prisma, now, {
      module: 'leave',
      policyKey: 'leave_request_type',
      scopeType: 'global',
      scopeId: null,
      priority: 100,
      configJson: { request_type_id: leaveRequestType.id },
    });

    const users = await prisma.profile.findMany({
      where: { isActive: true },
      select: { id: true, email: true },
      orderBy: { id: 'asc' },
    });

    let seededRows = 0;
    for (const user of users) {
      for (const leaveTypeKey of TAXONOMY.terms) {
        const exists = await prisma.leaveBalanceLedger.findFirst({
          where: {
            userId: user.id,
            leaveTypeKey,
            periodYear: year,
            entryType: 'seed_opening',
          },
          select: { id: true },
        });
        if (exists) continue;

        await prisma.leaveBalanceLedger.create({
          data: {
            userId: user.id,
            leaveTypeKey,
            periodYear: year,
            deltaDays: 0,
            entryType: 'seed_opening',
            notes: `Seed opening row for ${year}`,
            metadata: { seeded: true, year },
          },
        });
        seededRows += 1;
      }
    }

    console.log('HR leave system seed complete');
    console.log(`- request group: ${group.name} (${group.code})`);
    console.log(`- taxonomy: ${taxonomy.name} (${taxonomy.key})`);
    console.log(`- request type: ${leaveRequestType.name} (${leaveRequestType.codePrefix})`);
    console.log(`- leave entitlements: ${Object.keys(ENTITLEMENTS).join(', ')}`);
    console.log(`- leave opening ledger rows added: ${seededRows}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('HR leave system seed failed:', err);
  process.exit(1);
});
