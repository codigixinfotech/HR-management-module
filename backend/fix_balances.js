const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.leaveBalance.findMany({
    include: { leaveType: true, employee: true },
  });
  console.log('Total leave_balances rows in DB:', rows.length);
  for (const r of rows) {
    console.log(
      r.id,
      r.employee?.firstName,
      r.leaveType?.code,
      'Allocated:',
      r.allocated,
      'Used:',
      r.used
    );
    const targetQuota = r.leaveType?.annualQuota || 12;
    if (r.allocated === 0 || r.allocated < targetQuota) {
      await prisma.leaveBalance.update({
        where: { id: r.id },
        data: { allocated: targetQuota },
      });
      console.log('Updated', r.leaveType?.code, 'allocated to:', targetQuota);
    }
  }

  // Also verify Sudarshan Kale has a Casual Leave balance
  const sudarshan = await prisma.employee.findFirst({
    where: { firstName: { contains: 'Sudarshan' } },
  });
  const cl = await prisma.leaveType.findFirst({
    where: { code: 'CL' },
  });
  if (sudarshan && cl) {
    const existing = await prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: sudarshan.id,
          leaveTypeId: cl.id,
          year: 2026,
        },
      },
    });
    console.log('Sudarshan CL balance in DB:', existing);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
