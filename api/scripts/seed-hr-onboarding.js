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

const FORMS = [
  {
    name: 'Employee Data Form',
    description: 'Core employee profile and employment information.',
    module: 'hr',
    storageType: 'json',
    fields: [
      { fieldKey: 'job_title', fieldLabel: 'Job Title', fieldType: 'text', isRequired: true, displayOrder: 1 },
      { fieldKey: 'job_description', fieldLabel: 'Job Description', fieldType: 'textarea', isRequired: true, displayOrder: 2 },
      { fieldKey: 'employment_type', fieldLabel: 'Employment Type', fieldType: 'select', isRequired: true, displayOrder: 3, fieldOptions: { options: ['full_time', 'contract', 'intern', 'consultant'] } },
      { fieldKey: 'manager', fieldLabel: 'Manager', fieldType: 'text', isRequired: false, displayOrder: 4 },
      { fieldKey: 'hire_date', fieldLabel: 'Hire Date', fieldType: 'date', isRequired: true, displayOrder: 5 }
    ],
    assignments: [{ assignedToRole: 'staff' }]
  },
  {
    name: 'Emergency Contact Form',
    description: 'Emergency and next-of-kin details for HR records.',
    module: 'hr',
    storageType: 'json',
    fields: [
      { fieldKey: 'contact_name', fieldLabel: 'Contact Name', fieldType: 'text', isRequired: true, displayOrder: 1 },
      { fieldKey: 'relationship', fieldLabel: 'Relationship', fieldType: 'text', isRequired: true, displayOrder: 2 },
      { fieldKey: 'phone', fieldLabel: 'Phone Number', fieldType: 'text', isRequired: true, displayOrder: 3 },
      { fieldKey: 'address', fieldLabel: 'Address', fieldType: 'textarea', isRequired: false, displayOrder: 4 }
    ],
    assignments: [{ assignedToRole: 'staff' }]
  },
  {
    name: 'Onboarding Policy Acknowledgement',
    description: 'Confirms policy read/acceptance for all new staff.',
    module: 'hr',
    storageType: 'json',
    fields: [
      { fieldKey: 'policy_acknowledged', fieldLabel: 'I have read and agree to company policies', fieldType: 'checkbox', isRequired: true, displayOrder: 1 },
      { fieldKey: 'acknowledged_at', fieldLabel: 'Acknowledged At', fieldType: 'date', isRequired: true, displayOrder: 2 }
    ],
    assignments: [{ assignedToRole: 'staff' }]
  }
];

async function upsertForm(prisma, config) {
  const now = new Date();
  const existing = await prisma.form.findFirst({
    where: {
      name: config.name,
      module: config.module
    }
  });

  const form = existing
    ? await prisma.form.update({
        where: { id: existing.id },
        data: {
          description: config.description,
          storageType: config.storageType,
          isActive: true,
          updatedAt: now
        }
      })
    : await prisma.form.create({
        data: {
          name: config.name,
          description: config.description,
          module: config.module,
          storageType: config.storageType,
          isActive: true,
          createdAt: now,
          updatedAt: now
        }
      });

  for (const field of config.fields) {
    await prisma.formField.upsert({
      where: {
        unique_form_field_key: {
          formId: form.id,
          fieldKey: field.fieldKey
        }
      },
      update: {
        fieldLabel: field.fieldLabel,
        fieldType: field.fieldType,
        isRequired: Boolean(field.isRequired),
        displayOrder: field.displayOrder,
        fieldOptions: field.fieldOptions ?? null,
        updatedAt: now
      },
      create: {
        formId: form.id,
        fieldKey: field.fieldKey,
        fieldLabel: field.fieldLabel,
        fieldType: field.fieldType,
        isRequired: Boolean(field.isRequired),
        displayOrder: field.displayOrder,
        fieldOptions: field.fieldOptions ?? null,
        createdAt: now,
        updatedAt: now
      }
    });
  }

  for (const assignment of config.assignments || []) {
    const alreadyAssigned = await prisma.formAssignment.findFirst({
      where: {
        formId: form.id,
        assignedToRole: assignment.assignedToRole || null,
        assignedToProfileId: assignment.assignedToProfileId || null
      }
    });

    if (!alreadyAssigned) {
      await prisma.formAssignment.create({
        data: {
          formId: form.id,
          assignedToRole: assignment.assignedToRole || null,
          assignedToProfileId: assignment.assignedToProfileId || null,
          dueDate: assignment.dueDate || null,
          createdAt: now,
          updatedAt: now
        }
      });
    }
  }

  return form;
}

async function main() {
  loadApiEnv();
  const prisma = new PrismaClient();

  try {
    const created = [];
    for (const formConfig of FORMS) {
      const form = await upsertForm(prisma, formConfig);
      created.push(form.name);
    }

    console.log('HR onboarding forms seed complete');
    console.log(`- forms: ${created.join(', ')}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('HR onboarding forms seed failed:', err);
  process.exit(1);
});
