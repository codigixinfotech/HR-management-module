const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tables = await prisma.$queryRawUnsafe("SHOW TABLES");
  console.log('All tables count:', tables.length);
  const matched = tables.filter(t => {
    const name = Object.values(t)[0];
    return name.includes('contract') || name.includes('vendor') || name.includes('deploy') || name.includes('worker');
  });
  console.log('Matched tables:', matched);
  await prisma.$disconnect();
}

main().catch(console.error);
