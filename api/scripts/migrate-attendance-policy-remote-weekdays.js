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

const WORK_WEEKDAYS = [1, 2, 3, 4, 5];

async function main() {
  loadApiEnv();
  const prisma = new PrismaClient();

  try {
    const policies = await prisma.policy.findMany({
      where: { module: 'attendance', policyKey: 'schedule' }
    });

    let patched = 0;
    let skipped = 0;

    for (const policy of policies) {
      const cfg =
        policy.configJson && typeof policy.configJson === 'object' && !Array.isArray(policy.configJson)
          ? policy.configJson
          : {};

      if (Array.isArray(cfg.remote_weekdays)) {
        skipped++;
        continue;
      }

      const onsiteDays = Array.isArray(cfg.onsite_weekdays) ? cfg.onsite_weekdays : [1, 5];
      const remoteDays = WORK_WEEKDAYS.filter(d => !onsiteDays.includes(d));

      await prisma.policy.update({
        where: { id: policy.id },
        data: { configJson: { ...cfg, remote_weekdays: remoteDays } }
      });

      console.log(`Patched policy ${policy.id} (scope: ${policy.scopeType}/${policy.scopeId ?? 'global'}): remote_weekdays = [${remoteDays}]`);
      patched++;
    }

    console.log(`\nDone. Patched: ${patched}, Already had remote_weekdays: ${skipped}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
