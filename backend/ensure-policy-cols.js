const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cols = await prisma.$queryRawUnsafe('DESCRIBE overtime_policies');
  console.log('Columns:', cols.map(c => c.Field));

  const existingCols = new Set(cols.map(c => c.Field));

  if (!existingCols.has('hourlyRateSource')) {
    await prisma.$executeRawUnsafe(`ALTER TABLE overtime_policies ADD COLUMN hourlyRateSource VARCHAR(100) DEFAULT 'Payroll salary configuration'`);
    console.log('+ Added hourlyRateSource');
  }
  if (!existingCols.has('maxDailyOtHours')) {
    await prisma.$executeRawUnsafe(`ALTER TABLE overtime_policies ADD COLUMN maxDailyOtHours DOUBLE DEFAULT 4.0`);
    console.log('+ Added maxDailyOtHours');
  }
  if (!existingCols.has('maxWeeklyOtHours')) {
    await prisma.$executeRawUnsafe(`ALTER TABLE overtime_policies ADD COLUMN maxWeeklyOtHours DOUBLE DEFAULT 12.0`);
    console.log('+ Added maxWeeklyOtHours');
  }

  // Update existing seed policies to link to active company & branch if not already
  const companies = await prisma.$queryRawUnsafe(`SELECT id, name FROM companies LIMIT 5`);
  console.log('Companies:', companies);
  const branches = await prisma.$queryRawUnsafe(`SELECT id, name, companyId FROM branches LIMIT 10`);
  console.log('Branches:', branches);

  console.log('Migration complete.');
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
