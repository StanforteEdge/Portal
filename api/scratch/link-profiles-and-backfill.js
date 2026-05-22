const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // 1. Link "Olalekan Adebayo" (PayrollWorker) to profile 1
    const p1 = await prisma.profile.findFirst({ where: { email: 'olalekan@stanforteedge.com' } });
    if (p1) {
      await prisma.payrollWorker.updateMany({
        where: { fullName: 'Olalekan Adebayo' },
        data: { profileId: p1.id }
      });
      console.log(`Linked Olalekan Adebayo to profile id ${p1.id}`);
    }

    // 2. Link "olsls kjdfjdf" (PayrollWorker) to profile 8
    const p8 = await prisma.profile.findFirst({ where: { email: 'olalekan.owonikoko@gmail.com' } });
    if (p8) {
      await prisma.payrollWorker.updateMany({
        where: { fullName: 'olsls kjdfjdf' },
        data: { profileId: p8.id }
      });
      console.log(`Linked olsls kjdfjdf to profile id ${p8.id}`);
    }

    // 3. Link active "Oyinkansola Aje" (PayrollWorker) to profile 3
    const p3 = await prisma.profile.findFirst({ where: { email: 'oyin@stanfdorteedge.com' } });
    if (p3) {
      await prisma.payrollWorker.updateMany({
        where: { fullName: 'Oyinkansola Aje', status: 'active' },
        data: { profileId: p3.id }
      });
      console.log(`Linked Oyinkansola Aje (active) to profile id ${p3.id}`);
    }

    // 4. Backfill/create payroll loan for Request 3087
    const req3087 = await prisma.requestInstance.findUnique({
      where: { id: BigInt(3087) },
      include: { requestType: true }
    });

    if (req3087) {
      console.log(`Found request 3087: status=${req3087.status}, createdBy=${req3087.createdBy}`);
      const worker = await prisma.payrollWorker.findFirst({
        where: { profileId: req3087.createdBy, status: 'active' }
      });

      if (worker) {
        // Check if loan already exists
        const existingLoan = await prisma.payrollLoan.findFirst({
          where: { requestId: req3087.id }
        });

        if (!existingLoan) {
          const principalAmount = Number(req3087.totalAmount ?? 50000);
          const repaymentMonths = 12; // default
          const monthlyRecovery = principalAmount / repaymentMonths;

          await prisma.payrollLoan.create({
            data: {
              workerId: worker.id,
              requestId: req3087.id,
              loanType: 'loan',
              title: 'Loan: Staff Loan',
              principalAmount: principalAmount,
              outstandingAmount: principalAmount,
              issuedDate: new Date(),
              startRecoveryDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
              monthlyRecoveryAmount: monthlyRecovery,
              status: 'active',
              notes: 'Backfilled from request 3087'
            }
          });
          console.log(`Successfully backfilled payroll loan for request 3087 linked to worker ${worker.fullName}`);
        } else {
          console.log(`Payroll loan already exists for request 3087`);
        }
      } else {
        console.log(`No active payroll worker found for profile id ${req3087.createdBy}`);
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
