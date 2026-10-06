const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const CRAVITA_ID = 'cmtwjbe5900zoj7op4c3xxxb5';

async function main() {
  try {
    console.log('Testing listProductionLines...');
    const pl = await prisma.$queryRawUnsafe(`
      SELECT 
        pl.*,
        b.name as branchName,
        d.name as departmentName,
        COUNT(m.id) as machineCount
      FROM production_lines pl
      LEFT JOIN branches b ON b.id = pl.branchId
      LEFT JOIN departments d ON d.id = pl.departmentId
      LEFT JOIN machines m ON m.productionLineId = pl.id
      WHERE 1=1 AND pl.companyId = ?
      GROUP BY pl.id ORDER BY pl.lineCode ASC
    `, CRAVITA_ID);
    console.log('listProductionLines OK:', pl.length);

    console.log('Testing listOperators...');
    const op = await prisma.$queryRawUnsafe(`
      SELECT 
        mo.*,
        b.name as branchName,
        d.name as departmentName,
        pl.lineName as productionLineName,
        e.firstName, e.lastName, e.employeeCode,
        (SELECT COUNT(*) FROM machine_allocations ma WHERE ma.operatorId = mo.id AND ma.status = 'ACTIVE') as activeAllocationCount
      FROM machine_operators mo
      LEFT JOIN branches b ON b.id = mo.branchId
      LEFT JOIN departments d ON d.id = mo.departmentId
      LEFT JOIN production_lines pl ON pl.id = mo.productionLineId
      LEFT JOIN employees e ON e.id = mo.employeeId
      WHERE 1=1 AND mo.companyId = ?
      ORDER BY mo.operatorName ASC
    `, CRAVITA_ID);
    console.log('listOperators OK:', op.length);

    console.log('Testing listAllocations...');
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

    console.log('Testing listMaintenances...');
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
