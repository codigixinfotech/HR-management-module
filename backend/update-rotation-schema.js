const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const existingCols = await prisma.$queryRawUnsafe('DESCRIBE shift_rotation_rules');
  const existingColNames = new Set(existingCols.map((c) => c.Field.toLowerCase()));

  const columnsToAdd = [
    { name: 'startDate', type: "VARCHAR(50) NULL DEFAULT '2026-09-14'" },
    { name: 'effectiveFrom', type: "VARCHAR(50) NULL DEFAULT '2026-09-14'" },
    { name: 'effectiveTo', type: 'VARCHAR(50) NULL' },
    { name: 'applicableTo', type: "VARCHAR(50) NULL DEFAULT 'Department'" },
    { name: 'applicableTarget', type: 'VARCHAR(191) NULL' },
    { name: 'applicableScope', type: 'VARCHAR(191) NULL' },
    { name: 'code', type: 'VARCHAR(100) NULL' },
    { name: 'description', type: 'TEXT NULL' },
    { name: 'phases', type: 'TEXT NULL' },
    { name: 'selectedEmployeeIds', type: 'TEXT NULL' },
  ];

  for (const col of columnsToAdd) {
    if (!existingColNames.has(col.name.toLowerCase())) {
      try {
        const sql = `ALTER TABLE shift_rotation_rules ADD COLUMN ${col.name} ${col.type}`;
        await prisma.$executeRawUnsafe(sql);
        console.log('✓ Added column:', col.name);
      } catch (err) {
        console.error('Failed to add column:', col.name, err.message);
      }
    } else {
      console.log('Column already exists:', col.name);
    }
  }

  const finalCols = await prisma.$queryRawUnsafe('DESCRIBE shift_rotation_rules');
  console.log('Final columns:', finalCols.map((c) => c.Field));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
