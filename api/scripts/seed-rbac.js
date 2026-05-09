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
  { name: 'HR Manager', slug: 'hr_manager', description: 'Head of Human Resources' },
  { name: 'HR Officer', slug: 'hr_officer', description: 'HR Department Staff' },
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
  { name: 'View Workflows', slug: 'workflow.view', module: 'workflow', description: 'Can view workflow configurations' },
  { name: 'Manage Workflows', slug: 'workflow.manage', module: 'workflow', description: 'Can configure and execute workflows' },
  { name: 'Send Notifications', slug: 'send_notifications', module: 'notifications', description: 'Can trigger notifications' },
  { name: 'Manage Finance', slug: 'finance.manage', module: 'finance', description: 'Full access to finance module' },
  { name: 'Correct Completed Finance Records', slug: 'finance.correct_completed', module: 'finance', description: 'Can edit protected finance records after a request is completed' },
  { name: 'View Finance', slug: 'finance.view', module: 'finance', description: 'Read-only access to finance module' },
  { name: 'Approve Finance', slug: 'finance.approve', module: 'finance', description: 'Can approve finance workflow steps' },
  { name: 'Generate Vouchers', slug: 'finance.vouchers', module: 'finance', description: 'Can generate payment vouchers' },
  { name: 'Approve Payroll', slug: 'payroll.approve', module: 'payroll', description: 'Can approve payroll workflow steps' },
  { name: 'Authorize Payroll', slug: 'payroll.authorize', module: 'payroll', description: 'Final ED/COO authorization required before Finance can pay' },
  { name: 'View Organizations', slug: 'organizations.view', module: 'organizations', description: 'Can view organizations and their details' },
  { name: 'View Groups', slug: 'groups.view', module: 'groups', description: 'Can view groups and their memberships' },
  { name: 'Manage Groups', slug: 'groups.manage', module: 'groups', description: 'Can create groups, assign organizations, and manage members' },
  { name: 'Clock Attendance', slug: 'attendance.clock', module: 'attendance', description: 'Can clock in and out' },
  { name: 'View Own Attendance', slug: 'attendance.view_self', module: 'attendance', description: 'Can view personal attendance records' },
  { name: 'View Team Attendance', slug: 'attendance.view_team', module: 'attendance', description: 'Can review team attendance records' },
  { name: 'Manage Attendance', slug: 'attendance.manage', module: 'attendance', description: 'Can manage attendance records and settings' },
  { name: 'Approve Attendance', slug: 'attendance.approve', module: 'attendance', description: 'Can approve attendance corrections' },
  { name: 'Correct Attendance', slug: 'attendance.correct', module: 'attendance', description: 'Can submit attendance corrections' },
  { name: 'View Leave', slug: 'leave.view', module: 'leave', description: 'Can view leave requests in HR admin' },
  { name: 'Manage Leave', slug: 'leave.manage', module: 'leave', description: 'Can manage leave types, balances, and policy' },
  { name: 'Approve Leave', slug: 'leave.approve', module: 'leave', description: 'Can approve and reject leave requests' },
  { name: 'View HR', slug: 'hr.view', module: 'hr', description: 'Can access the HR admin section' },
  { name: 'Manage HR', slug: 'hr.manage', module: 'hr', description: 'Manage HR-wide settings, create and deactivate employees' },
  { name: 'Manage Employees', slug: 'hr.employees', module: 'hr', description: 'View and update employee records (no create or deactivate)' },
  { name: 'Approve HR', slug: 'hr.approve', module: 'hr', description: 'Can approve HR workflow steps' },
  { name: 'View Projects', slug: 'projects.view', module: 'projects', description: 'Can view projects and project governance' },
  { name: 'Manage Projects', slug: 'projects.manage', module: 'projects', description: 'Can create projects and administer project governance' },
  { name: 'View Work', slug: 'work.view', module: 'work', description: 'Can access personal work tracking and work-linked timesheet views' },
  { name: 'Manage Work', slug: 'work.manage', module: 'work', description: 'Can plan team work, goals, objectives, and KPIs' },
  { name: 'Approve Work', slug: 'work.approve', module: 'work', description: 'Can review and approve submitted work logs' },
  { name: 'View Users', slug: 'users.view', module: 'users', description: 'Can view user list (read-only)' },
  { name: 'Manage Users', slug: 'users.manage', module: 'users', description: 'Can create, edit, and deactivate users' },
  { name: 'View Admin', slug: 'admin.view', module: 'admin', description: 'Can access the admin section' },
  { name: 'Manage Settings', slug: 'settings.manage', module: 'admin', description: 'Manage system settings' },
  { name: 'Manage Roles', slug: 'roles.manage', module: 'roles', description: 'Manage roles and assign permissions' },
  { name: 'View Audit', slug: 'audit.view', module: 'audit', description: 'Can view audit and email logs' },
  { name: 'Manage Audit', slug: 'audit.manage', module: 'audit', description: 'Can create audit events' },
];

const rolePermissionMap = {
  administrator: ['*'],
  admin: ['admin.view', 'users.view', 'users.manage', 'groups.view', 'groups.manage', 'projects.view', 'projects.manage', 'roles.manage', 'settings.manage', 'audit.view', 'audit.manage', 'workflow.view', 'workflow.manage', 'send_notifications'],
  hr_manager: ['hr.view', 'hr.manage', 'hr.employees', 'hr.approve', 'attendance.clock', 'attendance.view_self', 'attendance.view_team', 'attendance.manage', 'attendance.approve', 'attendance.correct', 'leave.view', 'leave.manage', 'leave.approve', 'work.view', 'work.manage', 'work.approve', 'organizations.view', 'groups.view', 'projects.view', 'requests.view', 'requests.approve'],
  hr_officer: ['hr.view', 'hr.employees', 'attendance.clock', 'attendance.view_self', 'attendance.view_team', 'leave.view', 'work.view', 'organizations.view', 'groups.view', 'projects.view', 'requests.view'],
  finance_manager: ['requests.view', 'requests.manage', 'requests.approve', 'finance.manage', 'finance.correct_completed', 'finance.view', 'finance.approve', 'finance.vouchers', 'payroll.approve', 'groups.view', 'projects.view', 'workflow.view', 'work.view', 'work.manage', 'work.approve'],
  accountant: ['requests.view', 'requests.manage', 'requests.approve', 'finance.manage', 'finance.view', 'finance.approve', 'finance.vouchers', 'groups.view', 'projects.view', 'workflow.view'],
  finance_officer: ['requests.view', 'finance.view', 'finance.vouchers', 'groups.view', 'projects.view', 'workflow.view'],
  finance_auditor: ['requests.view', 'finance.view', 'audit.view', 'groups.view', 'projects.view', 'workflow.view'],
  tester: ['requests.create', 'requests.view', 'requests.retire', 'groups.view', 'projects.view', 'attendance.clock', 'attendance.view_self', 'work.view'],
  staff: ['requests.create', 'requests.view', 'requests.retire', 'groups.view', 'projects.view', 'attendance.clock', 'attendance.view_self', 'work.view'],
  team_lead: ['requests.view', 'requests.approve', 'groups.view', 'groups.manage', 'projects.view', 'projects.manage', 'workflow.view', 'attendance.clock', 'attendance.view_self', 'attendance.view_team', 'attendance.approve', 'work.view', 'work.manage', 'work.approve'],
  line_manager: ['requests.view', 'groups.view', 'groups.manage', 'projects.view', 'projects.manage', 'workflow.view', 'attendance.view_team', 'attendance.approve', 'work.view', 'work.manage', 'work.approve'],
  coo: ['requests.view', 'requests.approve', 'groups.view', 'groups.manage', 'projects.view', 'projects.manage', 'workflow.view', 'attendance.view_team', 'attendance.approve', 'attendance.manage', 'attendance.correct', 'work.view', 'work.manage', 'work.approve', 'payroll.authorize'],
  ed: ['requests.view', 'requests.approve', 'groups.view', 'groups.manage', 'projects.view', 'projects.manage', 'workflow.view', 'attendance.view_team', 'attendance.approve', 'attendance.manage', 'attendance.correct', 'work.view', 'work.manage', 'work.approve', 'payroll.authorize']
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

      // Only insert missing — never delete existing (preserves manually-added permissions)
      const existing = await prisma.rolePermission.findMany({
        where: { roleId: role.id },
        select: { permissionId: true }
      });
      const existingIds = new Set(existing.map((r) => r.permissionId));
      const toAdd = permissionIds.filter((id) => !existingIds.has(id));

      if (toAdd.length > 0) {
        await prisma.rolePermission.createMany({
          data: toAdd.map((permissionId) => ({ roleId: role.id, permissionId })),
          skipDuplicates: true
        });
      }
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
