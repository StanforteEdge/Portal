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

const categories = [
  {
    code: 'PAYMENT',
    name: 'Payment',
    groupCode: 'FIN',
    description: 'Payment-related requests',
    sortOrder: 10,
  },
  {
    code: 'LEAVE',
    name: 'Leave',
    groupCode: 'HR',
    description: 'Leave-related requests',
    sortOrder: 20,
  },
  {
    code: 'LOAN',
    name: 'Loans',
    groupCode: 'HR',
    description: 'Staff Loans & Salary Advances',
    sortOrder: 30,
  },
];

async function main() {
  loadApiEnv();
  const prisma = new PrismaClient();
  const now = new Date();

  try {
    for (const cat of categories) {
      const group = await prisma.requestGroup.findUnique({
        where: { code: cat.groupCode },
      });

      if (!group) {
        console.warn(`Group "${cat.groupCode}" not found — skipping "${cat.name}"`);
        continue;
      }

      await prisma.requestCategory.upsert({
        where: { code: cat.code },
        update: {
          name: cat.name,
          groupId: group.id,
          description: cat.description,
          sortOrder: cat.sortOrder ?? 0,
          isActive: true,
          updatedAt: now,
        },
        create: {
          code: cat.code,
          name: cat.name,
          groupId: group.id,
          description: cat.description,
          sortOrder: cat.sortOrder ?? 0,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
      });

      console.log(`Category "${cat.name}" (${cat.code}) under "${group.name}"`);
    }

    console.log('Request categories seed complete');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Request categories seed failed:', err);
  process.exit(1);
});
