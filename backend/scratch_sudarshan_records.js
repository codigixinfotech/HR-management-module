const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const records = await prisma.attendanceRecord.findMany({
    where: { employeeId: 'cmtr2qzm7006zip185kbklj96' },
    orderBy: { date: 'desc' }
  });
  console.log('Sudarshan Records:', records.length);
  for (const r of records) {
    console.log(r.date.toISOString().slice(0, 10), r.status, 'In:', r.checkIn, 'Out:', r.checkOut);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
