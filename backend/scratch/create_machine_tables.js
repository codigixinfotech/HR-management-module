const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function initTables() {
  console.log('Initializing machine management tables in MySQL...');

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS production_lines (
      id VARCHAR(191) PRIMARY KEY,
      companyId VARCHAR(191) NOT NULL,
      branchId VARCHAR(191) NULL,
      departmentId VARCHAR(191) NULL,
      lineCode VARCHAR(100) NOT NULL,
      lineName VARCHAR(255) NOT NULL,
      lineType VARCHAR(100) DEFAULT 'Production',
      location VARCHAR(255) NULL,
      supervisorId VARCHAR(191) NULL,
      supervisorName VARCHAR(255) NULL,
      productionCapacity DECIMAL(12,2) NULL,
      capacityUom VARCHAR(50) DEFAULT 'Units/Day',
      workingHours DECIMAL(5,2) DEFAULT 8.00,
      numberOfShifts INT DEFAULT 2,
      status VARCHAR(50) DEFAULT 'ACTIVE',
      description TEXT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_pl_company (companyId),
      INDEX idx_pl_branch (branchId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS machines (
      id VARCHAR(191) PRIMARY KEY,
      companyId VARCHAR(191) NOT NULL,
      branchId VARCHAR(191) NULL,
      departmentId VARCHAR(191) NULL,
      productionLineId VARCHAR(191) NULL,
      machineCode VARCHAR(100) NOT NULL,
      machineName VARCHAR(255) NOT NULL,
      machineType VARCHAR(100) NOT NULL,
      machineCategory VARCHAR(100) DEFAULT 'Production Machine',
      manufacturer VARCHAR(255) NULL,
      model VARCHAR(255) NULL,
      serialNumber VARCHAR(255) NULL,
      assetNumber VARCHAR(255) NULL,
      workstation VARCHAR(255) NULL,
      location VARCHAR(255) NULL,
      capacity DECIMAL(12,2) NULL,
      capacityUom VARCHAR(50) DEFAULT 'Units/Hour',
      operatingHours DECIMAL(5,2) DEFAULT 8.00,
      powerRating DECIMAL(10,2) NULL,
      powerUom VARCHAR(50) DEFAULT 'kW',
      maintenanceFrequencyDays INT DEFAULT 30,
      lastMaintenanceDate DATE NULL,
      nextMaintenanceDate DATE NULL,
      status VARCHAR(50) DEFAULT 'ACTIVE',
      documentsJson JSON NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_m_company (companyId),
      INDEX idx_m_branch (branchId),
      INDEX idx_m_line (productionLineId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS machine_operators (
      id VARCHAR(191) PRIMARY KEY,
      companyId VARCHAR(191) NOT NULL,
      branchId VARCHAR(191) NULL,
      employeeId VARCHAR(191) NULL,
      operatorType VARCHAR(50) DEFAULT 'Employee',
      operatorName VARCHAR(255) NOT NULL,
      operatorCode VARCHAR(100) NOT NULL,
      department VARCHAR(255) NULL,
      skill VARCHAR(255) NOT NULL,
      skillLevel VARCHAR(50) DEFAULT 'Expert',
      certification VARCHAR(255) NULL,
      certificationExpiry DATE NULL,
      contractorAgency VARCHAR(255) NULL,
      contractorComplianceStatus VARCHAR(50) DEFAULT 'VALID',
      status VARCHAR(50) DEFAULT 'Available',
      currentMachineId VARCHAR(191) NULL,
      currentShift VARCHAR(100) NULL,
      trainingRecordsJson JSON NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_mo_company (companyId),
      INDEX idx_mo_branch (branchId),
      INDEX idx_mo_emp (employeeId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS machine_allocations (
      id VARCHAR(191) PRIMARY KEY,
      companyId VARCHAR(191) NOT NULL,
      branchId VARCHAR(191) NULL,
      productionLineId VARCHAR(191) NOT NULL,
      machineId VARCHAR(191) NOT NULL,
      operatorId VARCHAR(191) NOT NULL,
      operatorType VARCHAR(50) DEFAULT 'Employee',
      supervisorId VARCHAR(191) NULL,
      supervisorName VARCHAR(255) NULL,
      shift VARCHAR(100) NOT NULL,
      allocationDate DATE NOT NULL,
      startTime VARCHAR(50) NULL,
      endTime VARCHAR(50) NULL,
      workOrder VARCHAR(100) NULL,
      operation VARCHAR(255) NULL,
      efficiency DECIMAL(5,2) DEFAULT 95.00,
      status VARCHAR(50) DEFAULT 'ACTIVE',
      remarks TEXT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_ma_company (companyId),
      INDEX idx_ma_branch (branchId),
      INDEX idx_ma_line (productionLineId),
      INDEX idx_ma_machine (machineId),
      INDEX idx_ma_operator (operatorId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS machine_maintenances (
      id VARCHAR(191) PRIMARY KEY,
      companyId VARCHAR(191) NOT NULL,
      branchId VARCHAR(191) NULL,
      machineId VARCHAR(191) NOT NULL,
      productionLineId VARCHAR(191) NULL,
      maintenanceType VARCHAR(50) DEFAULT 'Preventive',
      priority VARCHAR(50) DEFAULT 'Medium',
      reason TEXT NOT NULL,
      startDate DATE NOT NULL,
      expectedCompletionDate DATE NULL,
      actualCompletionDate DATE NULL,
      technicianName VARCHAR(255) NOT NULL,
      status VARCHAR(50) DEFAULT 'In Progress',
      result VARCHAR(100) NULL,
      partsReplaced TEXT NULL,
      remarks TEXT NULL,
      interruptedAllocationId VARCHAR(191) NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_mm_company (companyId),
      INDEX idx_mm_branch (branchId),
      INDEX idx_mm_machine (machineId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log('Tables created successfully.');
  await prisma.$disconnect();
}

initTables().catch(err => {
  console.error('Error creating tables:', err);
  prisma.$disconnect();
  process.exit(1);
});
