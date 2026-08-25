const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const claims = await prisma.expenseClaim.findMany({
    include: {
      employee: { select: { firstName: true, lastName: true } },
      travelBooking: { select: { bookingCode: true, purpose: true } },
    },
  });
  console.log(JSON.stringify(claims, null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
