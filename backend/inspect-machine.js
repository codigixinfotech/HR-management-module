const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const CRAVITA_ID = 'cmtwjbe5900zoj7op4c3xxxb5';

async function main() {
  try {
    const machines = await prisma.$queryRawUnsafe(
      'SELECT * FROM machines WHERE companyId = ? LIMIT 1',
      CRAVITA_ID
    );
    console.log('Sample machine from DB:', machines[0]);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
