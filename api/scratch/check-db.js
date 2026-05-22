const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const workers = await prisma.payrollWorker.findMany();
    console.log('--- PAYROLL WORKERS ---');
    console.log(workers.map(w => ({ id: w.id, fullName: w.fullName, profileId: w.profileId?.toString(), status: w.status })));

    const loans = await prisma.payrollLoan.findMany();
    console.log('--- PAYROLL LOANS ---');
    console.log(loans.map(l => ({ id: l.id, workerId: l.workerId, title: l.title, amount: l.principalAmount, status: l.status })));

    const requests = await prisma.requestInstance.findMany({
      include: { requestType: true }
    });
    console.log('--- REQUESTS ---');
    console.log(requests.map(r => ({
      id: r.id.toString(),
      codePrefix: r.requestType?.codePrefix,
      typeName: r.requestType?.name,
      status: r.status,
      totalAmount: r.totalAmount,
      createdBy: r.createdBy.toString()
    })));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
