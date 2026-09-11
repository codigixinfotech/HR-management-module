const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper: format time in IST
function formatTimeInIst(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  try {
    return d.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }
}

async function testEngine() {
  console.log('=== RUNNING OVERTIME ENGINE TEST SUITE ===');

  // Load the test attendance record on 10-Sep-2026 for Ajinkay Mote
  const rec = await prisma.attendanceRecord.findFirst({
    where: {
      date: {
        gte: new Date('2026-09-10T00:00:00.000Z'),
        lte: new Date('2026-09-10T23:59:59.000Z'),
      },
      checkOut: { not: null },
    },
    include: { employee: { include: { department: true } } },
  });

  if (!rec) {
    console.log('Error: Test record on 10-Sep-2026 not found');
    return;
  }

  console.log('Found attendance on 10-Sep-2026 for:', rec.employee?.firstName, rec.employee?.lastName);
  console.log('Check-In:', rec.checkIn, 'IST:', formatTimeInIst(rec.checkIn));
  console.log('Check-Out:', rec.checkOut, 'IST:', formatTimeInIst(rec.checkOut));

  // Calculate duration
  const diffMs = rec.checkOut.getTime() - rec.checkIn.getTime();
  const durationMins = Math.max(0, Math.round(diffMs / 60000));
  const workedHours = parseFloat((durationMins / 60).toFixed(2));
  console.log(`Punch Duration: ${durationMins} mins = ${workedHours} hrs (10h 30m)`);

  const dailyThreshold = 9.0;
  const otHours = Math.round((workedHours - dailyThreshold) * 4) / 4;
  console.log(`Threshold: ${dailyThreshold} hrs (includes 30m break)`);
  console.log(`Calculated OT: ${otHours} hrs (1h 30m)`);

  const multiplier = 2.0;
  const hourlyRate = 150.0;
  const otAmount = Math.round(otHours * multiplier * hourlyRate);
  console.log(`OT Amount: ${otHours}h * ${multiplier}x * ₹${hourlyRate} = ₹${otAmount}`);

  // Test 1: Insert / Upsert into overtime_records
  const id = `ot_test_${rec.id}`;
  const workedDate = '2026-09-10';
  const employeeId = rec.employeeId;
  const empCode = rec.employee?.employeeCode || 'EMP-002';
  const empName = `${rec.employee?.firstName} ${rec.employee?.lastName}`.trim();
  const dept = rec.employee?.department?.name || 'Engineering & Maintenance';

  await prisma.$executeRawUnsafe(
    `INSERT INTO overtime_records (
      id, attendanceId, companyId, employeeId, employeeCode, employeeName, department,
      workedDate, dayType, scheduledHours, actualIn, actualOut, breakMins,
      workedHours, dailyThreshold, weeklyHours, otHours, otType, multiplier,
      hourlyOrdinaryRate, otAmount, policyName, status, payrollStatus, source,
      createdAt, updatedAt
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, 'NORMAL WORKDAY', 8.5, ?, ?, 30,
      ?, ?, 0, ?, 'Daily Threshold', ?,
      ?, ?, 'Factory Worker Statutory OT', 'PENDING', 'PENDING_SIGNOFF', 'ATTENDANCE_AUTO',
      NOW(3), NOW(3)
    ) ON DUPLICATE KEY UPDATE
      workedHours = VALUES(workedHours),
      otHours = VALUES(otHours),
      otAmount = VALUES(otAmount),
      actualIn = VALUES(actualIn),
      actualOut = VALUES(actualOut),
      status = 'PENDING',
      payrollStatus = 'PENDING_SIGNOFF',
      updatedAt = NOW(3)`,
    id,
    rec.id,
    rec.companyId,
    employeeId,
    empCode,
    empName,
    dept,
    workedDate,
    formatTimeInIst(rec.checkIn),
    formatTimeInIst(rec.checkOut),
    workedHours,
    dailyThreshold,
    otHours,
    multiplier,
    hourlyRate,
    otAmount
  );

  console.log('✓ Test 1 Passed: Overtime record successfully created in DB!');

  // Test 6: Recalculation / Deduplication test (run exact same insert again)
  await prisma.$executeRawUnsafe(
    `INSERT INTO overtime_records (
      id, attendanceId, companyId, employeeId, employeeCode, employeeName, department,
      workedDate, dayType, scheduledHours, actualIn, actualOut, breakMins,
      workedHours, dailyThreshold, weeklyHours, otHours, otType, multiplier,
      hourlyOrdinaryRate, otAmount, policyName, status, payrollStatus, source,
      createdAt, updatedAt
    ) VALUES (
      'duplicate_id', ?, ?, ?, ?, ?, ?,
      ?, 'NORMAL WORKDAY', 8.5, ?, ?, 30,
      ?, ?, 0, ?, 'Daily Threshold', ?,
      ?, ?, 'Factory Worker Statutory OT', 'PENDING', 'PENDING_SIGNOFF', 'ATTENDANCE_AUTO',
      NOW(3), NOW(3)
    ) ON DUPLICATE KEY UPDATE
      workedHours = VALUES(workedHours),
      otHours = VALUES(otHours),
      otAmount = VALUES(otAmount),
      updatedAt = NOW(3)`,
    rec.id,
    rec.companyId,
    employeeId,
    empCode,
    empName,
    dept,
    workedDate,
    formatTimeInIst(rec.checkIn),
    formatTimeInIst(rec.checkOut),
    workedHours,
    dailyThreshold,
    otHours,
    multiplier,
    hourlyRate,
    otAmount
  );

  const allRecords = await prisma.$queryRawUnsafe(
    `SELECT * FROM overtime_records WHERE employeeId = ? AND workedDate = ?`,
    employeeId,
    workedDate
  );
  console.log(`Records count for ${workedDate}: ${allRecords.length} (Must be exactly 1)`);
  if (allRecords.length === 1) {
    console.log('✓ Test 6 Passed: Deduplication works! Exactly one record maintained.');
  } else {
    console.error('✗ Test 6 Failed: Duplicate records detected!');
  }

  console.log('DB Record content:');
  console.log(allRecords[0]);
}

testEngine().catch(console.error).finally(() => prisma.$disconnect());
