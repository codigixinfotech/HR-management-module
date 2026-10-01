const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const companyId = 'cmtwjbe5900zoj7op4c3xxxb5';
  const shifts = await prisma.shift.findMany({
    where: {
      OR: [{ companyId }, { companyId: null }]
    },
    include: {
      branch: true
    }
  });
  console.log(`Found ${shifts.length} shifts for company ${companyId}:`);
  shifts.forEach(s => {
    console.log({
      id: s.id,
      name: s.name,
      code: s.code,
      status: s.status,
      companyId: s.companyId,
      branchId: s.branchId,
      branchName: s.branch?.name
    });
  });
}
main().finally(() => prisma.$disconnect());
