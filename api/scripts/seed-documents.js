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

const DOCUMENTS = [
  {
    title: 'Staff Handbook',
    slug: 'staff-handbook',
    category: 'handbook',
    status: 'published',
    version: '1.0',
    effectiveDate: '2026-01-01',
    requireAcknowledgement: true,
    contentHtml: `
      <h2>Staff Handbook</h2>
      <p>This handbook describes your responsibilities, code of conduct, and workplace expectations.</p>
      <ul>
        <li>Maintain confidentiality of organizational information.</li>
        <li>Follow approved processes for financial, HR, and project workflows.</li>
        <li>Respect all staff and maintain professional behavior.</li>
      </ul>
    `,
  },
  {
    title: 'Code of Conduct Policy',
    slug: 'code-of-conduct-policy',
    category: 'policy',
    status: 'published',
    version: '1.0',
    effectiveDate: '2026-01-01',
    requireAcknowledgement: true,
    contentHtml: `
      <h2>Code of Conduct Policy</h2>
      <p>All employees must uphold integrity, accountability, and respect in all official engagements.</p>
      <ol>
        <li>Avoid conflicts of interest.</li>
        <li>Use company resources responsibly.</li>
        <li>Report policy violations promptly.</li>
      </ol>
    `,
  },
  {
    title: 'Finance Request & Retirement Policy',
    slug: 'finance-request-retirement-policy',
    category: 'policy',
    status: 'published',
    version: '1.0',
    effectiveDate: '2026-01-01',
    requireAcknowledgement: true,
    contentHtml: `
      <h2>Finance Request & Retirement Policy</h2>
      <p>This policy governs request approvals, disbursement records, and retirement timelines.</p>
      <ul>
        <li>Every disbursement must have a voucher trail.</li>
        <li>Retirement evidence must be attached per voucher.</li>
        <li>Requests remain incomplete until all disbursements are retired and verified.</li>
      </ul>
    `,
  },
  {
    title: 'Information Security Guideline',
    slug: 'information-security-guideline',
    category: 'guideline',
    status: 'published',
    version: '1.0',
    effectiveDate: '2026-01-01',
    requireAcknowledgement: false,
    contentHtml: `
      <h2>Information Security Guideline</h2>
      <p>Use strong passwords, protect sensitive files, and avoid sharing credentials.</p>
    `,
  },
  {
    title: 'Workplace Attendance Notice',
    slug: 'workplace-attendance-notice',
    category: 'notice',
    status: 'published',
    version: '1.0',
    effectiveDate: '2026-01-01',
    requireAcknowledgement: false,
    contentHtml: `
      <h2>Workplace Attendance Notice</h2>
      <p>Please ensure attendance and leave records are updated accurately in the portal.</p>
    `,
  },
];

async function main() {
  loadApiEnv();
  const prisma = new PrismaClient();

  try {
    const now = new Date();

    for (const doc of DOCUMENTS) {
      await prisma.document.upsert({
        where: { slug: doc.slug },
        update: {
          title: doc.title,
          category: doc.category,
          status: doc.status,
          version: doc.version,
          effectiveDate: doc.effectiveDate ? new Date(doc.effectiveDate) : null,
          contentHtml: doc.contentHtml,
          requireAcknowledgement: doc.requireAcknowledgement,
          updatedAt: now,
        },
        create: {
          title: doc.title,
          slug: doc.slug,
          category: doc.category,
          status: doc.status,
          version: doc.version,
          effectiveDate: doc.effectiveDate ? new Date(doc.effectiveDate) : null,
          contentHtml: doc.contentHtml,
          requireAcknowledgement: doc.requireAcknowledgement,
          createdAt: now,
          updatedAt: now,
        },
      });
    }

    console.log('Documents seed complete');
    console.log(`- documents: ${DOCUMENTS.map((d) => d.slug).join(', ')}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Documents seed failed:', err);
  process.exit(1);
});
