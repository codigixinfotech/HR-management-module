const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  console.log('--- STARTING OVERTIME RECORDS DB MIGRATION ---');

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS overtime_records (
      id VARCHAR(191) PRIMARY KEY,
      attendanceId VARCHAR(191) NULL,
      companyId VARCHAR(191) NOT NULL,
      employeeId VARCHAR(191) NOT NULL,
      employeeCode VARCHAR(100) NOT NULL,
      employeeName VARCHAR(191) NOT NULL,
      department VARCHAR(191) NULL,
      workedDate VARCHAR(20) NOT NULL,
      dayType VARCHAR(50) NOT NULL DEFAULT 'NORMAL WORKDAY',
      scheduledHours DOUBLE NOT NULL DEFAULT 8.5,
      actualIn VARCHAR(50) NULL,
      actualOut VARCHAR(50) NULL,
      breakMins INT NOT NULL DEFAULT 30,
      workedHours DOUBLE NOT NULL,
      dailyThreshold DOUBLE NOT NULL DEFAULT 9.0,
      weeklyHours DOUBLE NOT NULL DEFAULT 0,
      otHours DOUBLE NOT NULL,
      otType VARCHAR(50) NOT NULL DEFAULT 'Daily Threshold',
      multiplier DOUBLE NOT NULL DEFAULT 2.0,
      hourlyOrdinaryRate DOUBLE NOT NULL DEFAULT 150.0,
      otAmount DOUBLE NOT NULL,
      policyName VARCHAR(191) NOT NULL DEFAULT 'Factory Worker Statutory OT',
      status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
      approvedBy VARCHAR(191) NULL,
      approvedAt VARCHAR(100) NULL,
      rejectionReason VARCHAR(255) NULL,
      payrollStatus VARCHAR(50) NOT NULL DEFAULT 'PENDING_SIGNOFF',
      source VARCHAR(50) NOT NULL DEFAULT 'ATTENDANCE_AUTO',
      createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      UNIQUE KEY uq_ot_emp_date (employeeId, workedDate),
      INDEX idx_ot_comp_date (companyId, workedDate),
      INDEX idx_ot_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log('✓ overtime_records table verified successfully');
}

migrate()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
