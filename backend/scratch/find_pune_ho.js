const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const fks = await prisma.$queryRawUnsafe(`
    SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME IN ('contractor_vendors', 'contractor_contracts', 'contractor_workers', 'worker_deployments')
      AND COLUMN_NAME = 'branch_id'
  `);
  console.log('Foreign keys on branch_id:', fks);
}

main().catch(console.error).finally(() => prisma.$disconnect());
