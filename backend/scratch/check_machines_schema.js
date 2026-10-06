const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const cols = await prisma.$queryRawUnsafe('DESCRIBE machines');
    console.log('MACHINES COLUMNS:', cols.map(c => c.Field));
    const maintCols = await prisma.$queryRawUnsafe('DESCRIBE machine_maintenances');
    console.log('MAINTENANCE COLUMNS:', maintCols.map(c => c.Field));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
