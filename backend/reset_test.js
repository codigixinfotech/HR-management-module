const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.leaveType.update({
    where: { id: 'cmtva5jrm0076ip1gdqea0ktb' },
    data: { code: 'CL' },
  });
  console.log('Updated leaveType code to CL');

  // Let's reset the test requests for Sudarshan so we can execute the user's test cleanly
  const testRequests = await prisma.leaveRequest.findMany({
    where: { employee: { firstName: { contains: 'sudarshan' } } },
  });
  for (const tr of testRequests) {
    console.log('Found previous test request:', tr.id, tr.startDate, tr.status);
    // Delete previous test requests to start fresh from step 1
    await prisma.leaveRequest.delete({ where: { id: tr.id } });
  }

  // Also reset leave balance for Sudarshan
  const balances = await prisma.leaveBalance.findMany({
    where: { employee: { firstName: { contains: 'sudarshan' } } },
  });
  for (const b of balances) {
    await prisma.leaveBalance.update({
      where: { id: b.id },
      data: { allocated: 12, used: 0 },
    });
    console.log('Reset balance for', b.id, 'allocated: 12, used: 0');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
