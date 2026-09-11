const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const rows = await prisma.$queryRawUnsafe('SELECT * FROM overtime_records');
  console.log('overtime_records count:', rows.length);
}

test().catch(console.error).finally(() => prisma.$disconnect());
