const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const machines = await prisma.$queryRawUnsafe('SELECT id, machineCode, status FROM machines WHERE machineCode = ?', 'CT-001');
  console.log('CT-001 machine:', machines);
  
  if (machines.length > 0) {
    // Set status to BREAKDOWN
    await prisma.$executeRawUnsafe('UPDATE machines SET status = ? WHERE id = ?', 'BREAKDOWN', machines[0].id);
    // Remove test maintenance record so maintenance column is Healthy (no active servicing yet)
    await prisma.$executeRawUnsafe('DELETE FROM machine_maintenances WHERE machineId = ?', machines[0].id);
    console.log('Updated CT-001 status to BREAKDOWN and cleared active maintenance record.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
