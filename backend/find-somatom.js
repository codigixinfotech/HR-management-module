const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const machines = await prisma.$queryRawUnsafe(
    "SELECT id, machineCode, machineName, manufacturer, model, serialNumber, branchId, departmentId, productionLineId FROM machines WHERE serialNumber LIKE '%2026%' OR model LIKE '%SOMATOM%'"
  );
  console.log('Matching machines:', machines);
  await prisma.$disconnect();
}

main();
