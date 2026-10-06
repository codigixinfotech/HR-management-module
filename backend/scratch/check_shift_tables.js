const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tables = await prisma.$queryRawUnsafe("SHOW TABLES");
  const matched = tables.filter(t => {
    const name = Object.values(t)[0];
    return name.toLowerCase().includes('shift');
  });
  console.log('Shift tables:', matched);
  await prisma.$disconnect();
}

main().catch(console.error);
