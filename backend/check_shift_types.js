const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const companyId = 'cmtwjbe5900zoj7op4c3xxxb5';
  const rows = await prisma.$queryRawUnsafe('SELECT id, name, code, companyId, branchId, status, isActive FROM shift_types WHERE companyId = ?', companyId);
  console.log('Shifts for company:', rows);
}
main().finally(() => prisma.$disconnect());
