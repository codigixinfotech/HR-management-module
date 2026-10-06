const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const lines = await prisma.$queryRawUnsafe('SELECT id, lineCode, lineName, companyId FROM production_lines');
  console.log('LINES:', lines);
}

run().finally(() => prisma.$disconnect());
