const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const codigixCompany = await prisma.company.findFirst({
    where: { name: { contains: 'Codigix Infotech' } },
  });

  if (!codigixCompany) {
    console.error('Codigix Infotech company not found');
    return;
  }

  console.log('Codigix Infotech ID:', codigixCompany.id);

  // Update TRV-1004, TRV-1003, TRV-1002 to belong to Codigix Infotech
  const updated = await prisma.travelBooking.updateMany({
    where: {
      bookingCode: { in: ['TRV-1004', 'TRV-1003', 'TRV-1002'] },
    },
    data: {
      companyId: codigixCompany.id,
    },
  });

  console.log('Updated bookings count:', updated.count);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
