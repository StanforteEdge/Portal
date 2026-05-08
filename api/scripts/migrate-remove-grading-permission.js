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
    const value = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

async function main() {
  loadApiEnv();
  const prisma = new PrismaClient();

  try {
    const permission = await prisma.permission.findUnique({
      where: { slug: 'grading.grade' }
    });

    if (!permission) {
      console.log('grading.grade permission not found — nothing to do.');
      return;
    }

    const { count: rpCount } = await prisma.rolePermission.deleteMany({
      where: { permissionId: permission.id }
    });

    await prisma.permission.delete({
      where: { id: permission.id }
    });

    console.log(`Removed grading.grade permission (${rpCount} role assignment(s) deleted).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
