const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const policies = await prisma.policy.findMany();
    console.log(JSON.stringify(policies, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
