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
  const shouldApply = process.argv.includes('--apply');

  try {
    const mismatches = await prisma.$queryRaw`
      SELECT
        r.id AS request_id,
        r.workflow_instance_id,
        wi.entity_id
      FROM sta_request_instances r
      JOIN sta_workflow_instances wi
        ON wi.id = r.workflow_instance_id
      WHERE wi.entity_type = 'request'
        AND wi.entity_id <> r.id::text
      ORDER BY r.id
    `;

    if (!Array.isArray(mismatches) || mismatches.length === 0) {
      console.log('No request/workflow entity_id mismatches found.');
      return;
    }

    console.log(`Found ${mismatches.length} request/workflow mismatch(es):`);
    for (const row of mismatches) {
      console.log(
        `- request ${String(row.request_id)} -> workflow ${String(row.workflow_instance_id)} currently points to entity_id ${String(row.entity_id)}`
      );
    }

    if (!shouldApply) {
      console.log('');
      console.log('Dry run only. Re-run with --apply to update workflow entity_id values.');
      return;
    }

    let updated = 0;
    await prisma.$transaction(async (tx) => {
      for (const row of mismatches) {
        await tx.workflowInstance.update({
          where: { id: String(row.workflow_instance_id) },
          data: { entityId: String(row.request_id) },
        });
        updated += 1;
      }
    });

    console.log('');
    console.log(`Updated ${updated} workflow instance link(s).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Request/workflow repair failed:', error);
  process.exit(1);
});
