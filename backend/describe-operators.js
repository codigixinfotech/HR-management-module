const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cols = await prisma.$queryRawUnsafe('DESCRIBE machine_operators');
  console.log('machine_operators columns:');
  console.log(cols.map(c => c.Field));
  await prisma.$disconnect();
}

main();
