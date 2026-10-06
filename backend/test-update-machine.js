const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const rows = await prisma.$queryRawUnsafe('SELECT * FROM machines LIMIT 1');
    const m = rows[0];
    console.log('Testing update on machine:', m.id, m.machineCode);

    // Simulate updateMachine
    const dto = {
      machineName: m.machineName + ' (Updated)',
      operatingHours: 16,
      capacity: 25,
      documentsJson: m.documentsJson,
    };

    let bId = dto.branchId !== undefined ? dto.branchId : m.branchId;
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
      dto.departmentId !== undefined ? dto.departmentId : m.departmentId,
      dto.productionLineId !== undefined ? dto.productionLineId : m.productionLineId,
      dto.machineCode || m.machineCode,
      dto.machineName || m.machineName,
      dto.machineType || m.machineType,
      dto.machineCategory || m.machineCategory,
      dto.manufacturer !== undefined ? dto.manufacturer : m.manufacturer,
      dto.model !== undefined ? dto.model : m.model,
      dto.serialNumber !== undefined ? dto.serialNumber : m.serialNumber,
      dto.assetNumber !== undefined ? dto.assetNumber : m.assetNumber,
      dto.workstation !== undefined ? dto.workstation : m.workstation,
      dto.location !== undefined ? dto.location : m.location,
      dto.capacity !== undefined ? dto.capacity : m.capacity,
      dto.capacityUom || m.capacityUom,
      dto.operatingHours !== undefined ? dto.operatingHours : m.operatingHours,
      dto.powerRating !== undefined ? dto.powerRating : m.powerRating,
      dto.powerUom || m.powerUom,
      dto.maintenanceFrequencyDays !== undefined ? dto.maintenanceFrequencyDays : m.maintenanceFrequencyDays,
      dto.maintenanceReminderDays !== undefined ? dto.maintenanceReminderDays : m.maintenanceReminderDays,
      dto.lastMaintenanceDate !== undefined ? dto.lastMaintenanceDate : m.lastMaintenanceDate,
      dto.nextMaintenanceDate !== undefined ? dto.nextMaintenanceDate : m.nextMaintenanceDate,
      dto.status || m.status,
      dto.documentsJson !== undefined ? (typeof dto.documentsJson === 'string' ? dto.documentsJson : JSON.stringify(dto.documentsJson)) : (typeof m.documentsJson === 'string' ? m.documentsJson : JSON.stringify(m.documentsJson)),
      dto.qrToken !== undefined ? dto.qrToken : m.qrToken,
      m.id
    );

    console.log('UPDATE SUCCEEDED!');
  } catch (err) {
    console.error('UPDATE ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
