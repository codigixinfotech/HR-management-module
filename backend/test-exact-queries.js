const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const CRAVITA_ID = 'cmtwjbe5900zoj7op4c3xxxb5';

async function main() {
  try {
    // 1. Exact listOperators from service
    console.log('Testing EXACT listOperators...');
    const op = await prisma.$queryRawUnsafe(`
      SELECT 
        mo.*,
        b.name as branchName,
        m.machineName as currentMachineName,
        m.machineCode as currentMachineCode,
        pl.lineName as currentLineName
      FROM machine_operators mo
      LEFT JOIN branches b ON b.id = mo.branchId
      LEFT JOIN machines m ON m.id = mo.currentMachineId
      LEFT JOIN production_lines pl ON pl.id = m.productionLineId
      WHERE 1=1 AND mo.companyId = ?
      ORDER BY mo.operatorName ASC
    `, CRAVITA_ID);
    console.log('listOperators OK:', op.length);

    // 2. Exact listAllocations from service
    console.log('Testing EXACT listAllocations...');
    const alloc = await prisma.$queryRawUnsafe(`
      SELECT 
        ma.*,
        m.machineCode, m.machineName, m.machineType, m.location as machineLocation,
        mo.operatorName, mo.operatorCode, mo.operatorType,
        pl.lineName as productionLineName,
        b.name as branchName
      FROM machine_allocations ma
      LEFT JOIN machines m ON m.id = ma.machineId
      LEFT JOIN machine_operators mo ON mo.id = ma.operatorId
      LEFT JOIN production_lines pl ON pl.id = ma.productionLineId
      LEFT JOIN branches b ON b.id = ma.branchId
      WHERE 1=1 AND ma.companyId = ?
      ORDER BY ma.allocationDate DESC, ma.createdAt DESC
    `, CRAVITA_ID);
    console.log('listAllocations OK:', alloc.length);

    // 3. Exact listMaintenances from service
    console.log('Testing EXACT listMaintenances...');
    const maint = await prisma.$queryRawUnsafe(`
      SELECT 
        mm.*,
        m.machineCode, m.machineName, m.machineType, m.location as machineLocation,
        b.name as branchName
      FROM machine_maintenances mm
      LEFT JOIN machines m ON m.id = mm.machineId
      LEFT JOIN branches b ON b.id = mm.branchId
      WHERE 1=1 AND mm.companyId = ?
      ORDER BY mm.startDate DESC, mm.createdAt DESC
    `, CRAVITA_ID);
    console.log('listMaintenances OK:', maint.length);

  } catch (err) {
    console.error('FAILED:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
