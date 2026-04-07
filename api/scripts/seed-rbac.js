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
  { name: 'Tester', slug: 'tester', description: 'Pre-release feature tester' },
  { name: 'Staff', slug: 'staff', description: 'General Staff Member' },
  { name: 'Team Lead', slug: 'team_lead', description: 'Team approval role' },
  { name: 'Line Manager', slug: 'line_manager', description: 'Manager who plans team work and reviews daily logs' },
  { name: 'COO', slug: 'coo', description: 'Chief Operating Officer' },
  { name: 'ED', slug: 'ed', description: 'Executive Director' }
];

const permissions = [
  { name: 'Create Requests', slug: 'requests.create', module: 'requests', description: 'Can create new requests' },
  { name: 'View Requests', slug: 'requests.view', module: 'requests', description: 'Can view requests' },
  { name: 'Manage Requests', slug: 'requests.manage', module: 'requests', description: 'Can manage requests and request types' },
  { name: 'Approve Requests', slug: 'requests.approve', module: 'requests', description: 'Can approve requests' },
  { name: 'Retire Requests', slug: 'requests.retire', module: 'requests', description: 'Can submit retirement proofs' },
  { name: 'Workflow Manage', slug: 'workflow_manage', module: 'workflow', description: 'Can configure and execute workflows' },
  { name: 'Workflow View', slug: 'workflow_view', module: 'workflow', description: 'Can view workflow states and history' },
  { name: 'Send Notifications', slug: 'send_notifications', module: 'notifications', description: 'Can trigger notifications' },
  { name: 'Manage Finance', slug: 'finance.manage', module: 'finance', description: 'Full access to finance module' },
  { name: 'Correct Completed Finance Records', slug: 'finance.correct_completed', module: 'finance', description: 'Can edit protected finance records after a request is completed' },
  { name: 'View Finance', slug: 'finance.view', module: 'finance', description: 'Read-only access to finance module' },
  { name: 'Approve Finance', slug: 'finance.approve', module: 'finance', description: 'Can approve finance workflow steps' },
  { name: 'Generate Vouchers', slug: 'finance.vouchers', module: 'finance', description: 'Can generate payment vouchers' },
  { name: 'Approve Payroll', slug: 'payroll.approve', module: 'payroll', description: 'Can approve payroll workflow steps' },
  { name: 'View Groups', slug: 'groups.view', module: 'groups', description: 'Can view groups and their memberships' },
  { name: 'Manage Groups', slug: 'groups.manage', module: 'groups', description: 'Can create groups, assign organizations, and manage members' },
  { name: 'View Projects', slug: 'projects.view', module: 'projects', description: 'Can view projects and project governance' },
  { name: 'Manage Projects', slug: 'projects.manage', module: 'projects', description: 'Can create projects and administer project governance' },
  { name: 'View Work', slug: 'work.view', module: 'work', description: 'Can access personal work tracking and work-linked timesheet views' },
  { name: 'Manage Work', slug: 'work.manage', module: 'work', description: 'Can plan team work, goals, objectives, and KPIs' },
  { name: 'Approve Work', slug: 'work.approve', module: 'work', description: 'Can review and approve submitted work logs' },
  { name: 'Manage Settings', slug: 'settings.manage', module: 'admin', description: 'Manage system settings' },
  { name: 'Manage Users', slug: 'users.manage', module: 'admin', description: 'Manage users and profiles' },
  { name: 'Manage Roles', slug: 'roles.manage', module: 'admin', description: 'Manage roles and permissions' },
  { name: 'View Audit', slug: 'audit.view', module: 'audit', description: 'Can view audit and email logs' },
  { name: 'Manage Audit', slug: 'audit.manage', module: 'audit', description: 'Can create audit events' },
  { name: 'Manage HR', slug: 'hr.manage', module: 'hr', description: 'Manage HR module' },
  { name: 'Approve HR', slug: 'hr.approve', module: 'hr', description: 'Can approve HR workflow steps' },
  { name: 'Grade Applications', slug: 'grading.grade', module: 'grading', description: 'Can grade applications' }
];

const rolePermissionMap = {
  administrator: ['*'],
  admin: ['*'],
  finance_manager: ['requests.view', 'requests.manage', 'requests.approve', 'finance.manage', 'finance.correct_completed', 'finance.view', 'finance.approve', 'finance.vouchers', 'payroll.approve', 'groups.view', 'projects.view', 'workflow_view', 'work.view', 'work.manage', 'work.approve'],
  accountant: ['requests.view', 'requests.manage', 'requests.approve', 'finance.manage', 'finance.view', 'finance.approve', 'finance.vouchers', 'groups.view', 'projects.view', 'workflow_view'],
  finance_officer: ['requests.view', 'finance.view', 'finance.vouchers', 'groups.view', 'projects.view', 'workflow_view'],
  finance_auditor: ['requests.view', 'finance.view', 'audit.view', 'groups.view', 'projects.view', 'workflow_view'],
  tester: ['requests.create', 'requests.view', 'requests.retire', 'groups.view', 'projects.view', 'work.view'],
  staff: ['requests.create', 'requests.view', 'requests.retire', 'groups.view', 'projects.view', 'work.view'],
  team_lead: ['requests.view', 'requests.approve', 'groups.view', 'groups.manage', 'projects.view', 'projects.manage', 'workflow_view', 'work.view', 'work.manage', 'work.approve'],
  line_manager: ['requests.view', 'groups.view', 'groups.manage', 'projects.view', 'projects.manage', 'workflow_view', 'work.view', 'work.manage', 'work.approve'],
  coo: ['requests.view', 'requests.approve', 'groups.view', 'groups.manage', 'projects.view', 'projects.manage', 'workflow_view', 'work.view', 'work.manage', 'work.approve'],
  ed: ['requests.view', 'requests.approve', 'groups.view', 'groups.manage', 'projects.view', 'projects.manage', 'workflow_view', 'work.view', 'work.manage', 'work.approve']
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
