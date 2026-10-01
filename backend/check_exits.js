const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const companyId = 'cmtwjbe5900zoj7op4c3xxxb5';
  const branchId = 'cmty65x5g007ej79dy9yj87mu';
  const exits = await prisma.employeeExit.findMany({
    where: {
      AND: [
        { OR: [{ companyId }, { employee: { companyId } }] },
        { employee: { branchId } }
      ]
    },
    include: {
      employee: {
        include: { branch: true }
      }
    }
  });
  console.log(`Branch ${branchId} has ${exits.length} exits:`);
  exits.forEach(e => {
    console.log(`- ${e.exitCode}: ${e.employee?.firstName} ${e.employee?.lastName} (${e.employee?.employeeCode}), Status: ${e.status}, Branch: ${e.employee?.branch?.name}`);
  });
}
main().finally(() => prisma.$disconnect());
