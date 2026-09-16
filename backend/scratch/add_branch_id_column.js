const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE pay_grades ADD COLUMN branchId VARCHAR(191) NULL'
    );
    console.log('branchId column added to pay_grades');
  } catch (e) {
    if (e.message && (e.message.includes('Duplicate column') || e.message.includes('already exists'))) {
      console.log('branchId column already exists in pay_grades, skipping.');
    } else {
      console.error('Error:', e.message);
      process.exit(1);
    }
  }

  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE pay_grades ADD INDEX pay_grades_branchId_idx (branchId)'
    );
    console.log('branchId index added to pay_grades');
  } catch (e) {
    if (e.message && (e.message.includes('Duplicate key name') || e.message.includes('already exists'))) {
      console.log('Index already exists, skipping.');
    } else {
      console.error('Index error:', e.message);
    }
  }

  await prisma.$disconnect();
  console.log('Done.');
}

main();
