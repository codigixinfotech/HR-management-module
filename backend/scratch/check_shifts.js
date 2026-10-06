const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const shifts = await prisma.shiftType.findMany();
  console.log('SHIFTS COUNT:', shifts.length);
  console.log('SHIFTS:', JSON.stringify(shifts.map(s => ({ id: s.id, code: s.code, name: s.name, companyId: s.companyId })), null, 2));
}

run().finally(() => prisma.$disconnect());
