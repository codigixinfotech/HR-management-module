const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const bookings = await prisma.travelBooking.findMany({
    include: {
      employee: true,
      department: true,
      company: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log('TOTAL BOOKINGS IN DB:', bookings.length);
  for (const b of bookings) {
    console.log({
      id: b.id,
      bookingCode: b.bookingCode,
      employeeId: b.employeeId,
      employeeName: b.employee ? `${b.employee.firstName} ${b.employee.lastName}` : null,
      companyId: b.companyId,
      companyName: b.company ? b.company.name : null,
      status: b.status,
      advanceAmount: b.advanceAmount,
      totalEstimatedCost: b.totalEstimatedCost,
    });
  }

  const companies = await prisma.company.findMany();
  console.log('\nCOMPANIES IN DB:', companies.map((c) => ({ id: c.id, code: c.companyCode, name: c.name })));
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
