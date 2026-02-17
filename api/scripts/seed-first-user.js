/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
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

  const email = 'olalekan@stanforteedge.com';
  const username = 'olalekan';
  const firstName = 'Olalekan';
  const lastName = 'Adebayo';
  const password = process.env.FIRST_USER_PASSWORD || 'ChangeMe123!';

  try {
    const now = new Date();
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.profile.upsert({
      where: { email },
      update: {
        username,
        firstName,
        lastName,
        type: 'staff',
        status: 'active',
        passwordHash,
        updatedAt: now
      },
      create: {
        email,
        username,
        firstName,
        lastName,
        type: 'staff',
        status: 'active',
        passwordHash
      }
    });

    const adminRole = await prisma.role.upsert({
      where: { slug: 'admin' },
      update: {
        name: 'Admin',
        description: 'System administrator',
        isActive: true,
        updatedAt: now
      },
      create: {
        name: 'Admin',
        slug: 'admin',
        description: 'System administrator',
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    });

    const existingRole = await prisma.userRole.findFirst({
      where: {
        profileId: user.id,
        roleId: adminRole.id,
        organizationId: null
      }
    });

    if (!existingRole) {
      await prisma.userRole.create({
        data: {
          profileId: user.id,
          roleId: adminRole.id,
          organizationId: null,
          isPrimaryRole: true
        }
      });
    } else if (!existingRole.isPrimaryRole) {
      await prisma.userRole.update({
        where: { id: existingRole.id },
        data: { isPrimaryRole: true }
      });
    }

    console.log('Seed complete:');
    console.log(`- email: ${email}`);
    console.log(`- password: ${password}`);
    console.log('- role: admin');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
