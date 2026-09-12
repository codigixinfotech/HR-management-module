const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const rec = await prisma.attendanceRecord.findFirst({
    where: { id: 'cmtv1bjsz0076ipfgiurqbx2g' },
    include: { employee: { include: { department: true } }, shiftType: true },
  });
  console.log('Record 2026-09-10 Details:', JSON.stringify(rec, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
