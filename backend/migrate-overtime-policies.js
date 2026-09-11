const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migratePolicies() {
  console.log('--- STARTING OVERTIME POLICIES DB MIGRATION ---');

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS overtime_policies (
      id VARCHAR(191) PRIMARY KEY,
      name VARCHAR(191) NOT NULL,
      description TEXT NULL,
      applicableIndustry VARCHAR(191) NOT NULL,
      applicableCategory VARCHAR(191) NOT NULL,
      establishmentType VARCHAR(191) NULL,
      companyId VARCHAR(191) NULL,
      branchId VARCHAR(191) NULL,
      effectiveFrom VARCHAR(50) NOT NULL,
      effectiveTo VARCHAR(50) NULL,
      dailyThresholdHours DOUBLE NOT NULL DEFAULT 9.0,
      weeklyThresholdHours DOUBLE NOT NULL DEFAULT 48.0,
      breakDurationMins INT NOT NULL DEFAULT 30,
      breakTreatment VARCHAR(50) NOT NULL DEFAULT 'INCLUDED_IN_9H',
      otStartsAfterHours DOUBLE NOT NULL DEFAULT 9.0,
      minOtDurationMins INT NOT NULL DEFAULT 15,
      roundingRule VARCHAR(50) NOT NULL DEFAULT '15 Minutes',
      normalWorkdayMultiplier DOUBLE NOT NULL DEFAULT 2.0,
      weeklyOffMultiplier DOUBLE NOT NULL DEFAULT 2.0,
      holidayMultiplier DOUBLE NOT NULL DEFAULT 2.0,
      nightMultiplier DOUBLE NOT NULL DEFAULT 1.0,
      approvalRequired BOOLEAN NOT NULL DEFAULT TRUE,
      approvalLevel VARCHAR(50) NOT NULL DEFAULT 'Single Level',
      payrollIntegration BOOLEAN NOT NULL DEFAULT TRUE,
      payrollComponent VARCHAR(191) NOT NULL DEFAULT 'Overtime Allowance',
      maxMonthlyOtHours DOUBLE NOT NULL DEFAULT 50.0,
      status VARCHAR(50) NOT NULL DEFAULT 'Active',
      createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      INDEX idx_otp_status (status),
      INDEX idx_otp_category (applicableCategory)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log('✓ overtime_policies table verified successfully');

  // Seed default 3 industry policies if empty
  const countResult = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as cnt FROM overtime_policies`);
  const count = Number(countResult[0]?.cnt || 0);

  if (count === 0) {
    console.log('Seeding initial 3 industry overtime policies...');
    const seedPolicies = [
      {
        id: 'otp-factory-maha',
        name: 'Factory Worker Statutory OT',
        description: 'Statutory overtime policy for manufacturing plant & factory operations under Section 59',
        applicableIndustry: 'Manufacturing / Factory',
        applicableCategory: 'Factory Workers & Plant Technicians',
        establishmentType: 'The Factories Act, 1948 (Sec 59)',
        dailyThresholdHours: 9.0,
        weeklyThresholdHours: 48.0,
        breakDurationMins: 30,
        breakTreatment: 'INCLUDED_IN_9H',
        otStartsAfterHours: 9.0,
        minOtDurationMins: 15,
        roundingRule: '15 Minutes',
        normalWorkdayMultiplier: 2.0,
        weeklyOffMultiplier: 2.0,
        holidayMultiplier: 2.0,
        nightMultiplier: 1.0,
        approvalRequired: true,
        approvalLevel: 'Single Level',
        payrollIntegration: true,
        payrollComponent: 'Statutory Overtime Wages',
        maxMonthlyOtHours: 50.0,
        effectiveFrom: '01-04-2026',
        status: 'Active',
      },
      {
        id: 'otp-corp-staff',
        name: 'Corporate & Support Staff Policy',
        description: 'Overtime allowance for corporate office and administrative staff under Shops & Establishments rules',
        applicableIndustry: 'Commercial / Corporate Office',
        applicableCategory: 'Office & Administrative Staff',
        establishmentType: 'Shops & Commercial Establishments Act',
        dailyThresholdHours: 9.0,
        weeklyThresholdHours: 45.0,
        breakDurationMins: 45,
        breakTreatment: 'INCLUDED_IN_9H',
        otStartsAfterHours: 9.0,
        minOtDurationMins: 30,
        roundingRule: '30 Minutes',
        normalWorkdayMultiplier: 1.5,
        weeklyOffMultiplier: 2.0,
        holidayMultiplier: 2.0,
        nightMultiplier: 1.25,
        approvalRequired: true,
        approvalLevel: 'Single Level',
        payrollIntegration: true,
        payrollComponent: 'Overtime Allowance',
        maxMonthlyOtHours: 40.0,
        effectiveFrom: '01-04-2026',
        status: 'Active',
      },
      {
        id: 'otp-continuous-proc',
        name: 'Continuous Process Operations OT',
        description: 'Exempted continuous process plant operations (boilers, furnaces, continuous casting)',
        applicableIndustry: 'Continuous Process Operations',
        applicableCategory: 'Boiler & Furnace Shift Leads',
        establishmentType: 'The Factories Act (Sec 64 Exemptions)',
        dailyThresholdHours: 9.0,
        weeklyThresholdHours: 48.0,
        breakDurationMins: 30,
        breakTreatment: 'INCLUDED_IN_9H',
        otStartsAfterHours: 9.0,
        minOtDurationMins: 15,
        roundingRule: '15 Minutes',
        normalWorkdayMultiplier: 2.0,
        weeklyOffMultiplier: 2.0,
        holidayMultiplier: 2.0,
        nightMultiplier: 1.0,
        approvalRequired: true,
        approvalLevel: 'Two Level',
        payrollIntegration: true,
        payrollComponent: 'Statutory Overtime Wages',
        maxMonthlyOtHours: 60.0,
        effectiveFrom: '01-04-2026',
        status: 'Active',
      },
    ];

    for (const p of seedPolicies) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO overtime_policies (
          id, name, description, applicableIndustry, applicableCategory, establishmentType,
          dailyThresholdHours, weeklyThresholdHours, breakDurationMins, breakTreatment,
          otStartsAfterHours, minOtDurationMins, roundingRule, normalWorkdayMultiplier,
          weeklyOffMultiplier, holidayMultiplier, nightMultiplier, approvalRequired,
          approvalLevel, payrollIntegration, payrollComponent, maxMonthlyOtHours,
          effectiveFrom, status, createdAt, updatedAt
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, NOW(3), NOW(3)
        )`,
        p.id, p.name, p.description, p.applicableIndustry, p.applicableCategory, p.establishmentType,
        p.dailyThresholdHours, p.weeklyThresholdHours, p.breakDurationMins, p.breakTreatment,
        p.otStartsAfterHours, p.minOtDurationMins, p.roundingRule, p.normalWorkdayMultiplier,
        p.weeklyOffMultiplier, p.holidayMultiplier, p.nightMultiplier, p.approvalRequired,
        p.approvalLevel, p.payrollIntegration, p.payrollComponent, p.maxMonthlyOtHours,
        p.effectiveFrom, p.status
      );
    }
    console.log('✓ Successfully seeded 3 configurable industry policies');
  } else {
    console.log(`✓ Found ${count} existing policies in database`);
  }
}

migratePolicies()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
