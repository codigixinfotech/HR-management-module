const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const user = await prisma.user.findUnique({
    where: { email: 'branch1@gmail.com' },
    include: { branch: true }
  });
  console.log('Branch Admin User:', user?.email, 'Branch:', user?.branch?.id, user?.branch?.name);

  const branchEmps = await prisma.employee.findMany({
    where: { branchId: user?.branchId },
    select: { id: true, firstName: true, lastName: true, employeeCode: true, departmentId: true, branchId: true }
  });
  console.log('Employees in this branch:', branchEmps);

  const totalInCompany = await prisma.employee.count({
    where: { companyId: user?.companyId }
  });
  console.log('Total employees in company:', totalInCompany);

  const allEmps = await prisma.employee.findMany({
    where: { companyId: user?.companyId },
    select: { id: true, firstName: true, lastName: true, branchId: true, departmentId: true }
  });
  console.log('All company employees breakdown:', allEmps);
}

run().finally(() => prisma.$disconnect());
