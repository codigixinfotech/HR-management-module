const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe('SET GLOBAL sort_buffer_size = 16777216');
    console.log('SET GLOBAL sort_buffer_size = 16MB SUCCESSFUL!');
  } catch (err) {
    console.error('Failed SET GLOBAL:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
