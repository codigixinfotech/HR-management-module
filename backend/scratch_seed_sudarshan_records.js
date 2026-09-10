const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const empId = 'cmtr2qzm7006zip185kbklj96'; // Sudarshan Kale
  const emp = await prisma.employee.findUnique({ where: { id: empId } });
  if (!emp) {
    console.error('Sudarshan not found by ID');
    return;
  }
  console.log('Found Sudarshan:', emp.id, emp.firstName, emp.lastName, 'Company:', emp.companyId);

  // Find Morning Shift for his company
  let morningShift = await prisma.shiftType.findFirst({
    where: { companyId: emp.companyId, OR: [{ code: 'MS' }, { name: { contains: 'Morning' } }] }
  });
  if (!morningShift) {
    morningShift = await prisma.shiftType.findFirst({
      where: { OR: [{ code: 'MS' }, { name: { contains: 'Morning' } }] }
    });
  }
  console.log('Morning Shift:', morningShift?.id, morningShift?.name, morningShift?.code);

  // 1. Record for 2026-09-10 (Today: Late)
  const id10 = `att_sudarshan_20260910`;
  await prisma.$executeRawUnsafe(
    `INSERT INTO attendance_records (
      id, companyId, employeeId, date, status, checkIn, source, shiftTypeId, createdAt, updatedAt
    ) VALUES (?, ?, ?, '2026-09-10 00:00:00', 'LATE_ARRIVING', '2026-09-10 08:18:00', 'BIOMETRIC_DEVICE', ?, NOW(3), NOW(3))
    ON DUPLICATE KEY UPDATE
      status = 'LATE_ARRIVING',
      checkIn = '2026-09-10 08:18:00',
      checkOut = NULL,
      shiftTypeId = ?,
      updatedAt = NOW(3)`,
    id10, emp.companyId, emp.id, morningShift?.id || null, morningShift?.id || null
  );

  // 2. Record for 2026-09-09 (Present: 08:05 to 16:32)
  const id09 = `att_sudarshan_20260909`;
  await prisma.$executeRawUnsafe(
    `INSERT INTO attendance_records (
      id, companyId, employeeId, date, status, checkIn, checkOut, source, shiftTypeId, createdAt, updatedAt
    ) VALUES (?, ?, ?, '2026-09-09 00:00:00', 'PRESENT', '2026-09-09 08:05:00', '2026-09-09 16:32:00', 'BIOMETRIC_DEVICE', ?, NOW(3), NOW(3))
    ON DUPLICATE KEY UPDATE
      status = 'PRESENT',
      checkIn = '2026-09-09 08:05:00',
      checkOut = '2026-09-09 16:32:00',
      shiftTypeId = ?,
      updatedAt = NOW(3)`,
    id09, emp.companyId, emp.id, morningShift?.id || null, morningShift?.id || null
  );

  // 3. Record for 2026-09-08 (Weekly Off)
  const id08 = `att_sudarshan_20260908`;
  await prisma.$executeRawUnsafe(
    `INSERT INTO attendance_records (
      id, companyId, employeeId, date, status, source, shiftTypeId, createdAt, updatedAt
    ) VALUES (?, ?, ?, '2026-09-08 00:00:00', 'WEEK_OFF', 'SYSTEM_POLICY', ?, NOW(3), NOW(3))
    ON DUPLICATE KEY UPDATE
      status = 'WEEK_OFF',
      shiftTypeId = ?,
      updatedAt = NOW(3)`,
    id08, emp.companyId, emp.id, morningShift?.id || null, morningShift?.id || null
  );

  // 4. Record for 2026-09-07 (Holiday)
  const id07 = `att_sudarshan_20260907`;
  await prisma.$executeRawUnsafe(
    `INSERT INTO attendance_records (
      id, companyId, employeeId, date, status, source, shiftTypeId, remarks, createdAt, updatedAt
    ) VALUES (?, ?, ?, '2026-09-07 00:00:00', 'HOLIDAY', 'SYSTEM_HOLIDAY', ?, 'Plant Declared Holiday', NOW(3), NOW(3))
    ON DUPLICATE KEY UPDATE
      status = 'HOLIDAY',
      shiftTypeId = ?,
      updatedAt = NOW(3)`,
    id07, emp.companyId, emp.id, morningShift?.id || null, morningShift?.id || null
  );

  console.log('Seeded 4 realistic recent records for Sudarshan Kale successfully');
}

run().catch(console.error).finally(() => prisma.$disconnect());
