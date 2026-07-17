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

const PROCUREMENT_CATEGORIES = [
  {
    codePrefix: 'PG',
    taxonomy: {
      key: 'procurement_goods_category',
      name: 'Goods Category',
      module: 'procurement',
      terms: ['food_catering', 'devices_electronics', 'computers_it', 'office_supplies', 'furniture', 'vehicles', 'other_goods'],
    },
  },
  {
    codePrefix: 'PS',
    taxonomy: {
      key: 'procurement_services_category',
      name: 'Services Category',
      module: 'procurement',
      terms: ['consulting', 'maintenance_repairs', 'training', 'it_services', 'logistics_transport', 'other_services'],
    },
  },
  {
    codePrefix: 'PW',
    taxonomy: {
      key: 'procurement_works_category',
      name: 'Works Category',
      module: 'procurement',
      terms: ['construction', 'renovation', 'civil_works', 'installation', 'other_works'],
    },
  },
];

function toLabel(term) {
  return term
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

async function main() {
  loadApiEnv();
  const prisma = new PrismaClient();
  const now = new Date();

  try {
    const category = await prisma.requestCategory.findUnique({ where: { code: 'PROCUREMENT' } });
    if (!category) {
      throw new Error('PROCUREMENT category not found. Run seed:procurement-request-types first.');
    }

    for (const { codePrefix, taxonomy: def } of PROCUREMENT_CATEGORIES) {
      const taxonomy = await prisma.taxonomy.upsert({
        where: { key: def.key },
        update: {
          name: def.name,
          module: def.module,
          isActive: true,
          updatedAt: now,
        },
        create: {
          key: def.key,
          name: def.name,
          module: def.module,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
      });

      const existingTerms = await prisma.taxonomyTerm.findMany({
        where: { taxonomyId: taxonomy.id },
        select: { value: true },
      });
      const existingValues = new Set(existingTerms.map((t) => t.value));
      const nextSortOrder = existingTerms.length;
      const newTerms = def.terms
        .filter((term) => !existingValues.has(term))
        .map((term, index) => ({
          taxonomyId: taxonomy.id,
          value: term,
          label: toLabel(term),
          sortOrder: nextSortOrder + index,
          isActive: true,
        }));
      if (newTerms.length > 0) {
        await prisma.taxonomyTerm.createMany({ data: newTerms, skipDuplicates: true });
      }

      const requestType = await prisma.requestType.findFirst({
        where: { categoryId: category.id, codePrefix },
      });
      if (!requestType) {
        console.warn(`RequestType with codePrefix "${codePrefix}" not found — skipping taxonomy link.`);
        continue;
      }

      await prisma.requestType.update({
        where: { id: requestType.id },
        data: { taxonomyKeys: [def.key], updatedAt: now },
      });

      console.log(`- ${requestType.name} (${codePrefix}) -> taxonomy "${def.name}" (${def.key}), ${def.terms.length} terms`);
    }

    console.log('Procurement categories seed complete');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Procurement categories seed failed:', err);
  process.exit(1);
});
