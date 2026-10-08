const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const shifts = await prisma.$queryRawUnsafe('SELECT id, name, code, startTime, endTime, companyId FROM shift_types');
  console.log('Shifts:');
  console.table(shifts);
}
main().finally(() => prisma.$disconnect());
