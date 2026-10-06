const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

async function migrate() {
  console.log('Running machine table migration for QR and Reminders...');
  
  // 1. Check existing columns
  const cols = await prisma.$queryRawUnsafe('DESCRIBE machines');
  const colNames = cols.map((c) => c.Field);
  
  if (!colNames.includes('maintenanceReminderDays')) {
    console.log('Adding maintenanceReminderDays column...');
    await prisma.$executeRawUnsafe(
      'ALTER TABLE machines ADD COLUMN maintenanceReminderDays INT DEFAULT 7 AFTER maintenanceFrequencyDays'
    );
  }
  
  if (!colNames.includes('maintenanceReminderSentAt')) {
    console.log('Adding maintenanceReminderSentAt column...');
    await prisma.$executeRawUnsafe(
      'ALTER TABLE machines ADD COLUMN maintenanceReminderSentAt DATETIME NULL AFTER nextMaintenanceDate'
    );
  }

  if (!colNames.includes('qrToken')) {
    console.log('Adding qrToken column...');
    await prisma.$executeRawUnsafe(
      'ALTER TABLE machines ADD COLUMN qrToken VARCHAR(191) NULL AFTER documentsJson'
    );
    try {
      await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX idx_m_qrToken ON machines(qrToken)');
    } catch (e) {
      console.log('Index might already exist or skipped:', e.message);
    }
  }

  // 2. Populate qrToken for machines where qrToken IS NULL
  const machinesWithoutQr = await prisma.$queryRawUnsafe(
    'SELECT id, machineCode FROM machines WHERE qrToken IS NULL OR qrToken = ""'
  );
  console.log(`Found ${machinesWithoutQr.length} machines needing qrToken...`);
  for (const m of machinesWithoutQr) {
    const token = `qr_${crypto.randomBytes(10).toString('hex')}`;
    await prisma.$executeRawUnsafe(
      'UPDATE machines SET qrToken = ? WHERE id = ?',
      token,
      m.id
    );
  }

  // 3. Ensure nextMaintenanceDate is populated for machines where it is NULL
  await prisma.$executeRawUnsafe(`
    UPDATE machines 
    SET nextMaintenanceDate = DATE_ADD(COALESCE(lastMaintenanceDate, CURDATE()), INTERVAL COALESCE(maintenanceFrequencyDays, 30) DAY)
    WHERE nextMaintenanceDate IS NULL
  `);

  console.log('Migration completed successfully!');
}

migrate()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
