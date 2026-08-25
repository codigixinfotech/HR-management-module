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

  // Update TRV-1005 to belong to Codigix Infotech
  const updated = await prisma.travelBooking.updateMany({
    where: {
      bookingCode: 'TRV-1005',
    },
    data: {
      companyId: codigixCompany.id,
    },
  });

  console.log('Updated TRV-1005 companyId count:', updated.count);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
