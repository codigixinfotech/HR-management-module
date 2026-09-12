const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany({
    where: { email: { contains: 'sudarshan' } },
    include: { employee: { include: { department: true, company: true } } }
  });
  console.log('Users found:', users.length);
  for (const u of users) {
    console.log('User:', u.email, 'Roles:', u.roles, 'Emp:', u.employee?.id, u.employee?.firstName, u.employee?.lastName, u.employee?.employeeCode, 'Dept:', u.employee?.department?.name);
  }

  const emps = await prisma.employee.findMany({
    where: { OR: [{ firstName: { contains: 'sudarshan' } }, { lastName: { contains: 'kale' } }] },
    include: { department: true, company: true }
  });
  console.log('Employees found:', emps.length);
  for (const e of emps) {
    console.log('Emp:', e.id, e.firstName, e.lastName, e.employeeCode, 'Dept:', e.department?.name, 'Company:', e.company?.name);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
