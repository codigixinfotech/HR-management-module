const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const cravita = await prisma.company.findFirst({ where: { name: { contains: 'Cravita' } } });
  if (cravita) {
    console.log('CRAVITA ID:', cravita.id);
    const emps = await prisma.employee.findMany({
      where: { companyId: cravita.id },
      select: { id: true, firstName: true, lastName: true, employeeCode: true, branchId: true, departmentId: true }
    });
    console.log('CRAVITA EMPLOYEES COUNT:', emps.length);
    console.log('CRAVITA EMPLOYEES:', JSON.stringify(emps, null, 2));
  }
}

run().finally(() => prisma.$disconnect());
