const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const future = await prisma.attendanceRecord.findMany({
    where: { date: { gt: new Date('2026-09-10T23:59:59.999Z') } }
  });
  console.log('Future records count:', future.length);
  for (const f of future) {
    console.log(f.id, f.date.toISOString().slice(0, 10), f.status, f.employeeId);
  }

  // Delete future attendance records
  const del = await prisma.attendanceRecord.deleteMany({
    where: { date: { gt: new Date('2026-09-10T23:59:59.999Z') } }
  });
  console.log('Deleted future records count:', del.count);
}

run().catch(console.error).finally(() => prisma.$disconnect());
