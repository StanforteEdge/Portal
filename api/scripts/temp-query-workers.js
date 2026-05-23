const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const workers = await prisma.payrollWorker.findMany({
      include: {
        profile: true
      }
    });
    console.log(JSON.stringify(workers, (key, val) => typeof val === 'bigint' ? val.toString() : val, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
