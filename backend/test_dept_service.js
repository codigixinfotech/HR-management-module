const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();
const { DepartmentsService } = require('./dist/modules/organization/departments.service');

async function main() {
  const service = new DepartmentsService(prisma);
  const companyId = 'cmtwjbe5900zoj7op4c3xxxb5';
  const branchId = 'cmty65x5g007ej79dy9yj87mu';

  console.log('--- Calling service.list without branchId ---');
  const allDepts = await service.list(companyId);
  console.log('All depts:', allDepts.map(d => ({ id: d.id, name: d.name, branchId: d.branchId })));

  console.log('--- Calling service.list with branchId ---');
  const branchDepts = await service.list(companyId, branchId);
  console.log('Branch depts:', branchDepts.map(d => ({ id: d.id, name: d.name, branchId: d.branchId })));
}
main().finally(() => prisma.$disconnect());
