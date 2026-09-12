const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  console.log('--- STARTING SHIFT MANAGEMENT DB MIGRATION ---');

  // Helper to add column if not exists
  async function addColumnIfNotExists(table, column, definition) {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      table,
      column
    );
    if (!rows || rows.length === 0) {
      await prisma.$executeRawUnsafe(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
      console.log(`Added column ${column} to ${table}`);
    } else {
      console.log(`Column ${column} already exists in ${table}`);
    }
  }

  // 1. Extend shift_types table
  await addColumnIfNotExists('shift_types', 'workingHours', 'DOUBLE DEFAULT 7.5');
  await addColumnIfNotExists('shift_types', 'lateGraceMinutes', 'INT DEFAULT 10');
  await addColumnIfNotExists('shift_types', 'earlyExitGraceMinutes', 'INT DEFAULT 10');
  await addColumnIfNotExists('shift_types', 'halfDayThresholdHours', 'DOUBLE DEFAULT 4.0');
  await addColumnIfNotExists('shift_types', 'otEligible', 'TINYINT(1) DEFAULT 1');
  await addColumnIfNotExists('shift_types', 'otStartsAfterMinutes', 'INT DEFAULT 30');
  await addColumnIfNotExists('shift_types', 'weeklyOffDays', "VARCHAR(191) DEFAULT 'Sunday'");
  await addColumnIfNotExists('shift_types', 'holidayHandling', "VARCHAR(191) DEFAULT 'Holiday Calendar'");
  await addColumnIfNotExists('shift_types', 'colorTag', "VARCHAR(50) DEFAULT 'blue'");

  // 2. Extend shift_assignments table
  await addColumnIfNotExists('shift_assignments', 'tier', "VARCHAR(50) DEFAULT 'EMPLOYEE'");
  await addColumnIfNotExists('shift_assignments', 'departmentId', 'VARCHAR(191) NULL');
  await addColumnIfNotExists('shift_assignments', 'overrideReason', 'VARCHAR(255) NULL');

  // 3. Create shift_roster_schedules table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS shift_roster_schedules (
      id VARCHAR(191) PRIMARY KEY,
      companyId VARCHAR(191) NOT NULL,
      employeeId VARCHAR(191) NOT NULL,
      shiftTypeId VARCHAR(191) NULL,
      shiftCode VARCHAR(20) NOT NULL,
      shiftName VARCHAR(191) NOT NULL,
      timing VARCHAR(100) NULL,
      date VARCHAR(20) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Published',
      isCustomOverride TINYINT(1) NOT NULL DEFAULT 0,
      createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      UNIQUE KEY uq_emp_date (employeeId, date),
      INDEX idx_comp_date (companyId, date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✓ shift_roster_schedules table verified');

  // 4. Create shift_rotation_rules table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS shift_rotation_rules (
      id VARCHAR(191) PRIMARY KEY,
      companyId VARCHAR(191) NOT NULL,
      name VARCHAR(191) NOT NULL,
      department VARCHAR(191) NULL,
      frequency VARCHAR(50) NOT NULL DEFAULT 'Weekly',
      pattern TEXT NOT NULL,
      handoverDay VARCHAR(100) NOT NULL DEFAULT 'Monday 00:00 AM',
      headcountCovered INT NOT NULL DEFAULT 0,
      currentPhase INT NOT NULL DEFAULT 1,
      nextRotationDate VARCHAR(50) NULL,
      autoApplyToRoster TINYINT(1) NOT NULL DEFAULT 1,
      status VARCHAR(50) NOT NULL DEFAULT 'Active',
      createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      INDEX idx_comp_rot (companyId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✓ shift_rotation_rules table verified');

  // 5. Create shift_change_requests table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS shift_change_requests (
      id VARCHAR(191) PRIMARY KEY,
      companyId VARCHAR(191) NOT NULL,
      employeeId VARCHAR(191) NOT NULL,
      currentShift VARCHAR(191) NOT NULL,
      requestedShift VARCHAR(191) NOT NULL,
      effectiveDate VARCHAR(50) NOT NULL,
      reason TEXT NOT NULL,
      appliedDate VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Pending Review',
      reviewerRemarks TEXT NULL,
      createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      INDEX idx_comp_chg (companyId),
      INDEX idx_emp_chg (employeeId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✓ shift_change_requests table verified');

  // 6. Create shift_swap_requests table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS shift_swap_requests (
      id VARCHAR(191) PRIMARY KEY,
      companyId VARCHAR(191) NOT NULL,
      requesterId VARCHAR(191) NOT NULL,
      targetId VARCHAR(191) NOT NULL,
      swapDate VARCHAR(50) NOT NULL,
      requesterShift VARCHAR(191) NOT NULL,
      targetShift VARCHAR(191) NOT NULL,
      reason TEXT NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Pending Manager Approval',
      checks TEXT NULL,
      createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      INDEX idx_comp_swp (companyId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✓ shift_swap_requests table verified');

  // Ensure all columns exist in shift_swap_requests
  const swapCols = [
    { name: 'history', type: 'TEXT NULL' },
    { name: 'reviewerRemarks', type: 'TEXT NULL' },
    { name: 'approvedBy', type: 'VARCHAR(191) NULL' },
    { name: 'approvedAt', type: 'DATETIME(3) NULL' },
    { name: 'rejectedBy', type: 'VARCHAR(191) NULL' },
    { name: 'rejectedAt', type: 'DATETIME(3) NULL' },
    { name: 'cancelledBy', type: 'VARCHAR(191) NULL' },
    { name: 'cancelledAt', type: 'DATETIME(3) NULL' },
  ];

  for (const col of swapCols) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE shift_swap_requests ADD COLUMN ${col.name} ${col.type}`);
      console.log(`✓ Added column ${col.name} to shift_swap_requests`);
    } catch (err) {
      // Ignored if duplicate column
    }
  }

  // 7. Create shift_roster_batches table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS shift_roster_batches (
      id VARCHAR(191) PRIMARY KEY,
      companyId VARCHAR(191) NOT NULL,
      periodName VARCHAR(191) NOT NULL,
      department VARCHAR(191) NULL,
      dateRange VARCHAR(100) NOT NULL,
      headcount INT NOT NULL DEFAULT 0,
      submittedBy VARCHAR(191) NOT NULL,
      submittedAt VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Draft',
      shiftsCovered TEXT NULL,
      createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      INDEX idx_comp_bat (companyId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✓ shift_roster_batches table verified');

  // Note: Standard shift seeding disabled to respect user-created shift masters only.
  console.log('Skipping dummy shifts auto-seed.');

  console.log('--- MIGRATION COMPLETED SUCCESSFULLY ---');
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
