const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CRAVITA_ID = 'cmtwjbe5900zoj7op4c3xxxb5';
const crypto = require('crypto');

const MACHINES = [
  {
    code: 'MRI-001',
    name: 'Siemens Magnetom Sola 1.5T MRI',
    type: 'MRI',
    mfg: 'Siemens',
    model: 'Magnetom Sola',
    serial: 'SN-MRI-2024-001',
    asset: 'AST-RAD-001',
    capacity: 20,
    uom: 'Patients / Day',
    hours: 16,
    power: 75,
    powerUom: 'kW (Kilowatts)',
    location: 'Radiology Block - 1st Floor - Room 101',
    freq: 180,
    status: 'ACTIVE',
  },
  {
    code: 'CT-001',
    name: 'GE Revolution CT 128-Slice Scanner',
    type: 'CT Scanner',
    mfg: 'GE Healthcare',
    model: 'Revolution CT',
    serial: 'SN-CT-2024-001',
    asset: 'AST-RAD-002',
    capacity: 30,
    uom: 'Patients / Day',
    hours: 16,
    power: 50,
    powerUom: 'kW (Kilowatts)',
    location: 'Radiology Block - 1st Floor - Room 103',
    freq: 180,
    status: 'ACTIVE',
  },
  {
    code: 'XR-001',
    name: 'Philips DigitalDiagnost X-Ray System',
    type: 'X-Ray',
    mfg: 'Philips',
    model: 'DigitalDiagnost C90',
    serial: 'SN-XR-2023-001',
    asset: 'AST-RAD-003',
    capacity: 50,
    uom: 'Patients / Day',
    hours: 8,
    power: 30,
    powerUom: 'kW (Kilowatts)',
    location: 'Radiology Block - 2nd Floor - Room 201',
    freq: 365,
    status: 'ACTIVE',
  },
  {
    code: 'US-001',
    name: 'Mindray Ultrasound DC-8 Pro',
    type: 'Ultrasound',
    mfg: 'Mindray',
    model: 'DC-8 Pro',
    serial: 'SN-US-2024-001',
    asset: 'AST-RAD-004',
    capacity: 25,
    uom: 'Patients / Day',
    hours: 8,
    power: 2,
    powerUom: 'kW (Kilowatts)',
    location: 'Radiology Block - 2nd Floor - Room 202',
    freq: 365,
    status: 'ACTIVE',
  },
  {
    code: 'ECG-001',
    name: 'Schiller AT-102 Plus ECG Machine',
    type: 'ECG Machine',
    mfg: 'Schiller',
    model: 'AT-102 Plus',
    serial: 'SN-ECG-2024-001',
    asset: 'AST-CARD-001',
    capacity: 40,
    uom: 'Tests / Day',
    hours: 8,
    power: 0.5,
    powerUom: 'kW (Kilowatts)',
    location: 'Cardiology - 3rd Floor - Bay A',
    freq: 365,
    status: 'ACTIVE',
  },
];

async function main() {
  try {
    await prisma.$executeRawUnsafe('SET SESSION sort_buffer_size = 8388608');
    console.log('Adding hospital machines for Cravita Technology...\n');

    for (const m of MACHINES) {
      const id = `m-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const qrToken = `qr_${crypto.randomBytes(10).toString('hex')}`;
      const lastDate = new Date();
      lastDate.setDate(lastDate.getDate() - 90);
      const nextDate = new Date(lastDate.getTime() + m.freq * 86400000);

      // Check if already exists
      const existing = await prisma.$queryRawUnsafe(
        'SELECT id FROM machines WHERE companyId = ? AND machineCode = ?',
        CRAVITA_ID, m.code
      );
      if (existing.length > 0) {
        console.log(`SKIP: ${m.code} already exists`);
        continue;
      }

      await prisma.$executeRawUnsafe(
        `INSERT INTO machines (
          id, companyId, branchId, departmentId, productionLineId,
          machineCode, machineName, machineType, machineCategory,
          manufacturer, model, serialNumber, assetNumber,
          workstation, location, capacity, capacityUom, operatingHours,
          powerRating, powerUom, maintenanceFrequencyDays, maintenanceReminderDays,
          lastMaintenanceDate, nextMaintenanceDate, status, documentsJson, qrToken
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        CRAVITA_ID,
        null,     // branchId
        null,     // departmentId
        null,     // productionLineId
        m.code,
        m.name,
        m.type,
        m.type,   // machineCategory
        m.mfg,
        m.model,
        m.serial,
        m.asset,
        null,     // workstation
        m.location,
        m.capacity,
        m.uom,
        m.hours,
        m.power,
        m.powerUom,
        m.freq,
        15,       // maintenanceReminderDays
        lastDate.toISOString().slice(0, 10),
        nextDate.toISOString().slice(0, 10),
        m.status,
        JSON.stringify({ assignedShifts: ['Morning Shift', 'Evening Shift'] }),
        qrToken
      );
      console.log(`✅ Added: ${m.code} - ${m.name}`);
      
      // Small delay to avoid ID collision
      await new Promise(resolve => setTimeout(resolve, 5));
    }

    // Final count
    const count = await prisma.$queryRawUnsafe(
      'SELECT COUNT(*) as total FROM machines WHERE companyId = ?',
      CRAVITA_ID
    );
    console.log(`\nTotal Cravita machines now: ${Number(count[0].total)}`);

  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
