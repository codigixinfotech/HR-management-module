const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const rows = await prisma.$queryRawUnsafe('SELECT * FROM machines LIMIT 1');
    const m = rows[0];
    console.log('m.lastMaintenanceDate type:', typeof m.lastMaintenanceDate, m.lastMaintenanceDate);
    console.log('m.nextMaintenanceDate type:', typeof m.nextMaintenanceDate, m.nextMaintenanceDate);
    console.log('m.documentsJson type:', typeof m.documentsJson);

    // Now test updating with exact values from m
    await prisma.$executeRawUnsafe(
      'UPDATE machines SET lastMaintenanceDate = ?, nextMaintenanceDate = ? WHERE id = ?',
      m.lastMaintenanceDate,
      m.nextMaintenanceDate,
      m.id
    );
    console.log('Date update succeeded!');
  } catch (err) {
    console.error('Date update failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
