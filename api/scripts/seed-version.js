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

  try {
    // 1. Resolve PWA version
    const pwaPkgPath = path.join(__dirname, '..', '..', 'apps', 'pwa', 'package.json');
    let version = '1.0.0';

    if (fs.existsSync(pwaPkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pwaPkgPath, 'utf8'));
      if (pkg && pkg.version) {
        version = pkg.version;
      }
    } else {
      console.warn(`[seed-version] PWA package.json not found at: ${pwaPkgPath}. Defaulting to version ${version}`);
    }

    console.log(`[seed-version] Syncing platform 'pwa', module 'portal' to version: ${version}`);

    // 2. Upsert SystemVersion config in DB
    const record = await prisma.systemVersion.upsert({
      where: {
        platform_module: {
          platform: 'pwa',
          module: 'portal',
        },
      },
      update: {
        version: version,
        minVersion: version, // Initial minVersion matches current version; can be lowered/configured manually in production db
      },
      create: {
        platform: 'pwa',
        module: 'portal',
        version: version,
        minVersion: version,
        forceUpdate: false,
        releaseNotes: [],
      },
    });

    console.log('[seed-version] Database record updated successfully:', record);
  } catch (error) {
    console.error('[seed-version] Failed to seed system version:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
