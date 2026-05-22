const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const loans = await prisma.payrollLoan.findMany({
      include: {
        worker: true
      }
    });
    console.log(JSON.stringify(loans, (key, val) => typeof val === 'bigint' ? val.toString() : val, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
