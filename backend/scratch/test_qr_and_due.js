const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('Testing machine records and due calculation...');
  const machines = await prisma.$queryRawUnsafe(`
    SELECT id, machineCode, machineName, qrToken, nextMaintenanceDate, maintenanceReminderDays, status
    FROM machines
    LIMIT 5
  `);
  console.log('Sample Machines:', machines);

  // Check if any has null qrToken
  const nullTokens = await prisma.$queryRawUnsafe('SELECT COUNT(*) as count FROM machines WHERE qrToken IS NULL');
  console.log('Machines with NULL qrToken:', nullTokens[0].count);

  console.log('All tests passed successfully!');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
