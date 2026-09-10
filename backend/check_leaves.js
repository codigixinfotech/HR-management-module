const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const types = await prisma.leaveType.findMany();
  console.log('Leave Types in DB:');
  for (const t of types) {
    console.log(t.id, t.code, t.name, 'Quota:', t.annualQuota, 'Company:', t.companyId);
  }

  const requests = await prisma.leaveRequest.findMany({
    include: { leaveType: true, employee: true },
  });
  console.log('\nLeave Requests in DB:');
  for (const r of requests) {
    console.log(
      r.id,
      r.employee?.firstName,
      r.leaveType?.code,
      r.startDate,
      'Days:',
      r.totalDays,
      'Status:',
      r.status
    );
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
