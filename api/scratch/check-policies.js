const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const policies = await prisma.policy.findMany();
    const serialized = policies.map(p => ({
      ...p,
      createdBy: p.createdBy?.toString(),
      updatedBy: p.updatedBy?.toString(),
      documentId: p.documentId?.toString(),
    }));
    console.log('--- POLICIES ---');
    console.log(JSON.stringify(serialized, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
