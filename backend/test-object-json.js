const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const rows = await prisma.$queryRawUnsafe('SELECT * FROM machines LIMIT 1');
    const m = rows[0];
    console.log('Testing raw object passed to documentsJson:');
    await prisma.$executeRawUnsafe(
      'UPDATE machines SET documentsJson = ? WHERE id = ?',
      m.documentsJson, // which is typeof object!
      m.id
    );
    console.log('PASS object in executeRawUnsafe');
  } catch (err) {
    console.error('FAIL object in executeRawUnsafe:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
