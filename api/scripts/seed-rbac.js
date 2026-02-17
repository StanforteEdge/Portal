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

const roles = [
  { name: 'Administrator', slug: 'administrator', description: 'Super User with access to everything' },
  { name: 'Admin', slug: 'admin', description: 'System Administrator' },
  { name: 'Finance Manager', slug: 'finance_manager', description: 'Head of Finance' },
  { name: 'Finance Officer', slug: 'finance_officer', description: 'Finance Department Staff' },
  { name: 'Finance Auditor', slug: 'finance_auditor', description: 'External/Internal Auditor' },
  { name: 'Accountant', slug: 'accountant', description: 'Accountant' },
  { name: 'Staff', slug: 'staff', description: 'General Staff Member' }
];

const permissions = [
  { name: 'Create Requests', slug: 'requests.create', module: 'requests', description: 'Can create new requests' },
  { name: 'View Requests', slug: 'requests.view', module: 'requests', description: 'Can view requests' },
  { name: 'Approve Requests', slug: 'requests.approve', module: 'requests', description: 'Can approve requests' },
  { name: 'Retire Requests', slug: 'requests.retire', module: 'requests', description: 'Can submit retirement proofs' },
  { name: 'Manage Finance', slug: 'finance.manage', module: 'finance', description: 'Full access to finance module' },
  { name: 'View Finance', slug: 'finance.view', module: 'finance', description: 'Read-only access to finance module' },
  { name: 'Generate Vouchers', slug: 'finance.vouchers', module: 'finance', description: 'Can generate payment vouchers' },
  { name: 'Manage Settings', slug: 'settings.manage', module: 'admin', description: 'Manage system settings' },
  { name: 'Manage Users', slug: 'users.manage', module: 'admin', description: 'Manage users and profiles' },
  { name: 'Manage Roles', slug: 'roles.manage', module: 'admin', description: 'Manage roles and permissions' },
  { name: 'Manage HR', slug: 'hr.manage', module: 'hr', description: 'Manage HR module' },
  { name: 'Grade Applications', slug: 'grading.grade', module: 'grading', description: 'Can grade applications' }
];

const rolePermissionMap = {
  administrator: ['*'],
  admin: ['*'],
  finance_manager: ['requests.view', 'requests.approve', 'finance.manage', 'finance.view', 'finance.vouchers'],
  finance_officer: ['requests.view', 'finance.view', 'finance.vouchers'],
  staff: ['requests.create', 'requests.view', 'requests.retire']
};

async function main() {
  loadApiEnv();
  const prisma = new PrismaClient();

  try {
    const now = new Date();

    for (const role of roles) {
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

    for (const permission of permissions) {
      await prisma.permission.upsert({
        where: { slug: permission.slug },
        update: {
          name: permission.name,
          description: permission.description,
          module: permission.module,
          updatedAt: now
        },
        create: {
          name: permission.name,
          slug: permission.slug,
          description: permission.description,
          module: permission.module,
          createdAt: now,
          updatedAt: now
        }
      });
    }

    const dbRoles = await prisma.role.findMany({ select: { id: true, slug: true } });
    const dbPermissions = await prisma.permission.findMany({ select: { id: true, slug: true } });
    const roleBySlug = Object.fromEntries(dbRoles.map((r) => [r.slug, r]));
    const permBySlug = Object.fromEntries(dbPermissions.map((p) => [p.slug, p]));
    const allPermissionIds = dbPermissions.map((p) => p.id);

    for (const [roleSlug, slugs] of Object.entries(rolePermissionMap)) {
      const role = roleBySlug[roleSlug];
      if (!role) continue;

      const permissionIds = slugs.length === 1 && slugs[0] === '*'
        ? allPermissionIds
        : slugs.map((slug) => permBySlug[slug]).filter(Boolean).map((p) => p.id);

      await prisma.$transaction([
        prisma.rolePermission.deleteMany({ where: { roleId: role.id } }),
        prisma.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({
            roleId: role.id,
            permissionId
          })),
          skipDuplicates: true
        })
      ]);
    }

    console.log('RBAC seed complete');
    console.log(`- roles: ${roles.length}`);
    console.log(`- permissions: ${permissions.length}`);
    console.log(`- mapped roles: ${Object.keys(rolePermissionMap).length}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('RBAC seed failed:', err);
  process.exit(1);
});
