const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Let's test what service.updateMachine('m-muwi1yeo-rb9k', payload) does:
async function testServiceUpdate() {
  const id = 'm-muwi1yeo-rb9k';

  // Exactly what the frontend builds:
  const payload = {
    companyId: 'cmtwjbe5900zoj7op4c3xxxb5',
    branchId: null,
    departmentId: 'cmu285pw3007mj7bu4fn6l2cn',
    productionLineId: 'pl-muwd3e8w-jpk3',
    machineCode: 'HSP-MCH-001',
    machineName: 'Siemens CT Scanner 128 Slice',
    machineType: 'MRI',
    manufacturer: 'Siemens Healthineers',
    model: 'SOMATOM Definition AS+',
    serialNumber: 'SN-CT-2026-00125',
    assetNumber: '- HSP-AST-CT-001',
    location: 'Bay A, Section 1',
    workstation: 'WS-01 Turning Cell',
    capacity: 20,
    capacityUom: 'Patients / Day',
    operatingHours: 16,
    powerRating: 15,
    powerUom: '', // Notice empty string!
    maintenanceFrequencyDays: 180,
    maintenanceReminderDays: 15,
    lastMaintenanceDate: undefined,
    nextMaintenanceDate: undefined,
    status: 'ACTIVE',
    documentsJson: {
      docs: { manual: 'HSP-MCH-001_MANUAL_v1.pdf', warranty: '', certificate: '', other: '' },
      images: {
        mainPhoto: undefined,
        angles: {}
      },
      assignedShifts: ['Morning Shift', 'Night Shift'],
      responsibleEmployeeId: undefined,
      calibration: {
        frequencyDays: 180,
        lastDate: '2026-11-01',
        nextDueDate: '2027-04-30'
      }
    }
  };

  try {
    console.log('Testing update on HSP-MCH-001...');

    // 1. First getMachineById as the service does:
    const rows = await prisma.$queryRawUnsafe(
      `SELECT 
        m.*,
        pl.lineName as productionLineName,
        pl.lineCode as productionLineCode,
        b.name as branchName,
        d.name as departmentName,
        c.name as companyName
      FROM machines m
      LEFT JOIN production_lines pl ON pl.id = m.productionLineId
      LEFT JOIN branches b ON b.id = m.branchId
      LEFT JOIN departments d ON d.id = m.departmentId
      LEFT JOIN companies c ON c.id = m.companyId
      WHERE m.id = ?`,
      id
    );

    if (!rows || rows.length === 0) {
      console.log('Machine not found');
      return;
    }
    const existing = rows[0];
    console.log('Existing machine found:', existing.id, existing.machineCode);

    let bId = payload.branchId !== undefined ? payload.branchId : existing.branchId;
    if (bId === 'HEAD_OFFICE' || bId === 'NONE' || bId === 'null') bId = null;

    await prisma.$executeRawUnsafe(
      `UPDATE machines SET
        branchId = ?,
        departmentId = ?,
        productionLineId = ?,
        machineCode = ?,
        machineName = ?,
        machineType = ?,
        machineCategory = ?,
        manufacturer = ?,
        model = ?,
        serialNumber = ?,
        assetNumber = ?,
        workstation = ?,
        location = ?,
        capacity = ?,
        capacityUom = ?,
        operatingHours = ?,
        powerRating = ?,
        powerUom = ?,
        maintenanceFrequencyDays = ?,
        maintenanceReminderDays = ?,
        lastMaintenanceDate = ?,
        nextMaintenanceDate = ?,
        status = ?,
        documentsJson = ?,
        qrToken = ?
      WHERE id = ?`,
      bId,
      payload.departmentId !== undefined ? payload.departmentId : existing.departmentId,
      payload.productionLineId !== undefined ? payload.productionLineId : existing.productionLineId,
      payload.machineCode || existing.machineCode,
      payload.machineName || existing.machineName,
      payload.machineType || existing.machineType,
      payload.machineCategory || existing.machineCategory,
      payload.manufacturer !== undefined ? payload.manufacturer : existing.manufacturer,
      payload.model !== undefined ? payload.model : existing.model,
      payload.serialNumber !== undefined ? payload.serialNumber : existing.serialNumber,
      payload.assetNumber !== undefined ? payload.assetNumber : existing.assetNumber,
      payload.workstation !== undefined ? payload.workstation : existing.workstation,
      payload.location !== undefined ? payload.location : existing.location,
      payload.capacity !== undefined ? payload.capacity : existing.capacity,
      payload.capacityUom || existing.capacityUom,
      payload.operatingHours !== undefined ? payload.operatingHours : existing.operatingHours,
      payload.powerRating !== undefined ? payload.powerRating : existing.powerRating,
      payload.powerUom || existing.powerUom,
      payload.maintenanceFrequencyDays !== undefined ? payload.maintenanceFrequencyDays : existing.maintenanceFrequencyDays,
      payload.maintenanceReminderDays !== undefined ? payload.maintenanceReminderDays : existing.maintenanceReminderDays,
      payload.lastMaintenanceDate !== undefined ? payload.lastMaintenanceDate : existing.lastMaintenanceDate,
      payload.nextMaintenanceDate !== undefined ? payload.nextMaintenanceDate : existing.nextMaintenanceDate,
      payload.status || existing.status,
      payload.documentsJson !== undefined ? JSON.stringify(payload.documentsJson) : existing.documentsJson,
      payload.qrToken !== undefined ? payload.qrToken : existing.qrToken,
      id
    );

    console.log('Direct SQL update SUCCEEDED!');
  } catch (err) {
    console.error('Direct SQL update FAILED:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testServiceUpdate();
