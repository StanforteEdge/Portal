const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const profiles = await prisma.profile.findMany();
    console.log('--- PROFILES ---');
    console.log(profiles.map(p => ({ id: p.id.toString(), email: p.email, username: p.username, type: p.type })));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
