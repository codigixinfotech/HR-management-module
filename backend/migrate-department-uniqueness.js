const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting Department uniqueness migration...');

  // 1. Check existing indexes on departments table
  const indexes = await prisma.$queryRawUnsafe('SHOW INDEX FROM departments');
  const indexNames = new Set(indexes.map((i) => i.Key_name));
  console.log('Existing index names:', Array.from(indexNames));

  // 2. Create composite unique index on (companyId, branchId, code) FIRST
  // so that MySQL foreign key constraint on companyId continues to have an index covering companyId.
  if (!indexNames.has('departments_companyId_branchId_code_key')) {
    console.log('Creating unique index departments_companyId_branchId_code_key...');
    try {
      await prisma.$executeRawUnsafe(
        'CREATE UNIQUE INDEX departments_companyId_branchId_code_key ON departments (companyId, branchId, code)'
      );
      console.log('✓ Created departments_companyId_branchId_code_key');
    } catch (err) {
      console.log('Note on creating departments_companyId_branchId_code_key:', err.message);
    }
  }

  // Also ensure a standard index on companyId exists so companyId foreign key is always satisfied
  if (!indexNames.has('departments_companyId_idx')) {
    try {
      await prisma.$executeRawUnsafe('CREATE INDEX departments_companyId_idx ON departments (companyId)');
      console.log('✓ Created departments_companyId_idx');
    } catch (err) {
      console.log('Note on creating departments_companyId_idx:', err.message);
    }
  }

  // 3. Now drop the old index departments_companyId_code_key
  const refreshedIndexes = await prisma.$queryRawUnsafe('SHOW INDEX FROM departments');
  const refreshedNames = new Set(refreshedIndexes.map((i) => i.Key_name));

  if (refreshedNames.has('departments_companyId_code_key')) {
    console.log('Dropping old index departments_companyId_code_key...');
    await prisma.$executeRawUnsafe('ALTER TABLE departments DROP INDEX departments_companyId_code_key');
    console.log('✓ Dropped departments_companyId_code_key');
  }

  // 4. Create MySQL 8 functional unique index to handle NULL branchId (Head Office / No Branch)
  if (!refreshedNames.has('uq_dept_coalesce_branch_code')) {
    console.log('Creating functional unique index uq_dept_coalesce_branch_code...');
    try {
      await prisma.$executeRawUnsafe(
        "CREATE UNIQUE INDEX uq_dept_coalesce_branch_code ON departments (companyId, (COALESCE(branchId, '__HEAD_OFFICE__')), code)"
      );
      console.log('✓ Created uq_dept_coalesce_branch_code');
    } catch (err) {
      console.log('Note on creating uq_dept_coalesce_branch_code:', err.message);
    }
  }

  // 5. Create functional unique index for normalized department name
  if (!refreshedNames.has('uq_dept_coalesce_branch_name')) {
    console.log('Creating functional unique index uq_dept_coalesce_branch_name...');
    try {
      await prisma.$executeRawUnsafe(
        "CREATE UNIQUE INDEX uq_dept_coalesce_branch_name ON departments (companyId, (COALESCE(branchId, '__HEAD_OFFICE__')), (LOWER(TRIM(name))))"
      );
      console.log('✓ Created uq_dept_coalesce_branch_name');
    } catch (err) {
      console.log('Note on creating uq_dept_coalesce_branch_name:', err.message);
    }
  }

  const finalIndexes = await prisma.$queryRawUnsafe('SHOW INDEX FROM departments');
  console.log(
    'Final department indexes:',
    Array.from(new Set(finalIndexes.map((i) => i.Key_name)))
  );
  console.log('Department uniqueness migration completed successfully!');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
