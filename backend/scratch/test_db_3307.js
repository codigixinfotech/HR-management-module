const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'mysql://root:backend@127.0.0.1:3306/hrm_db' } } });

async function run() {
  const codigix = await prisma.company.findFirst({ where: { name: { contains: 'Codigix' } } });
  if (!codigix) { console.log('Codigix company not found'); return; }

  const existing = await prisma.employee.findFirst({
    where: { companyId: codigix.id, firstName: 'Sanika', lastName: 'Mote' }
  });

  if (existing) {
    console.log('Sanika Mote already exists in Codigix Infotech:', existing.employeeCode);
  } else {
    const dept = await prisma.department.findFirst({ where: { companyId: codigix.id } });
    const desig = await prisma.designation.findFirst({ where: { companyId: codigix.id } });
    const branch = await prisma.branch.findFirst({ where: { companyId: codigix.id } });

    const newEmp = await prisma.employee.create({
      data: {
        employeeCode: 'EMP-SANIKA-CDX',
        companyId: codigix.id,
        firstName: 'Sanika',
        lastName: 'Mote',
        departmentId: dept?.id || null,
        designationId: desig?.id || null,
        branchId: branch?.id || null,
      }
    });
    console.log('Successfully created Sanika Mote under Codigix Infotech:', newEmp.id, newEmp.employeeCode);
  }
  await prisma.$disconnect();
}
run();
