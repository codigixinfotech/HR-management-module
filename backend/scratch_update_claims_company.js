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

  const updated = await prisma.expenseClaim.updateMany({
    where: {
      claimCode: { in: ['EXP-9001', 'EXP-9002'] },
    },
    data: {
      companyId: codigixCompany.id,
    },
  });

  console.log('Updated EXP-9001 & EXP-9002 companyId count:', updated.count);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
