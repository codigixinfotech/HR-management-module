const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CRAVITA_ID = 'cmtwjbe5900zoj7op4c3xxxb5';

async function main() {
  try {
    await prisma.$executeRawUnsafe('SET SESSION sort_buffer_size = 8388608');

    // Simulate listMachines with branchId = 'HEAD_OFFICE' as passed by getWorkforceTenantScope
    const conditions = ['1=1'];
    const params = [];

    if (CRAVITA_ID && CRAVITA_ID !== 'ALL') {
      conditions.push('m.companyId = ?');
      params.push(CRAVITA_ID);
    }
    const branchId = 'HEAD_OFFICE';
    if (branchId && branchId !== 'ALL' && branchId !== 'HEAD_OFFICE' && branchId !== 'NONE' && branchId !== 'null' && branchId !== 'undefined') {
      conditions.push('m.branchId = ?');
      params.push(branchId);
    }

    const whereClause = conditions.join(' AND ');

    const sql = `
      SELECT 
        m.id, m.companyId, m.branchId, m.departmentId, m.productionLineId,
        m.machineCode, m.machineName, m.machineType, m.machineCategory,
        m.manufacturer, m.model, m.serialNumber, m.assetNumber,
        m.workstation, m.location, m.capacity, m.capacityUom,
        m.operatingHours, m.powerRating, m.powerUom,
        m.maintenanceFrequencyDays, m.maintenanceReminderDays,
        m.maintenanceReminderSentAt,
        m.lastMaintenanceDate, m.nextMaintenanceDate,
        m.status, m.documentsJson, m.qrToken,
        m.createdAt, m.updatedAt,
        pl.lineName as productionLineName,
        pl.lineCode as productionLineCode,
        b.name as branchName,
        d.name as departmentName
      FROM machines m
      LEFT JOIN production_lines pl ON pl.id = m.productionLineId
      LEFT JOIN branches b ON b.id = m.branchId
      LEFT JOIN departments d ON d.id = m.departmentId
      WHERE ${whereClause}
      ORDER BY m.machineCode ASC
    `;

    const rows = await prisma.$queryRawUnsafe(sql, ...params);
    console.log(`Found ${rows.length} machines for Cravita:`);
    rows.forEach(r => console.log(`- [${r.machineCode}] ${r.machineName} (status: ${r.status}, branchId: ${r.branchId})`));
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
