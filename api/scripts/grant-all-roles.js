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

async function main() {
  loadApiEnv();
  const prisma = new PrismaClient();

  const email = process.argv[2] || 'olalekan@stanforteedge.com';

  try {
    const user = await prisma.profile.findUnique({
      where: { email },
      select: { id: true, email: true }
    });

    if (!user) {
      throw new Error(`User not found for email: ${email}`);
    }

    const roles = await prisma.role.findMany({
      where: { isActive: true },
      select: { id: true, slug: true },
      orderBy: { id: 'asc' }
    });

    if (!roles.length) {
      throw new Error('No active roles found. Run RBAC seed first.');
    }

    await prisma.userRole.deleteMany({
      where: { profileId: user.id }
    });

    await prisma.userRole.createMany({
      data: roles.map((role, idx) => ({
        profileId: user.id,
        roleId: role.id,
        organizationId: null,
        isPrimaryRole: idx === 0
      })),
      skipDuplicates: true
    });

    console.log(`Granted ${roles.length} active roles to ${user.email}`);
    console.log(`Roles: ${roles.map((r) => r.slug).join(', ')}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Grant all roles failed:', err.message || err);
  process.exit(1);
});
