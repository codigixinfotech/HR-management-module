const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const employees = await prisma.employee.findMany({ select: { id: true, firstName: true, lastName: true, companyId: true, status: true } });
  console.log('Employees count:', employees.length);
  console.log('Employees:', JSON.stringify(employees, null, 2));

  const assignments = await prisma.employeeSalaryAssignment.findMany({
    include: { employee: true, template: true }
  });
  console.log('Assignments count:', assignments.length);
  console.log('Assignments:', JSON.stringify(assignments.map(x => ({
    id: x.id,
    empId: x.employeeId,
    employee: `${x.employee?.firstName} ${x.employee?.lastName}`,
    companyId: x.companyId,
    status: x.status,
    template: x.template?.name,
    monthlyCtc: x.monthlyCtc
  })), null, 2));

  const companies = await prisma.company.findMany();
  console.log('Companies:', JSON.stringify(companies.map(c => ({ id: c.id, name: c.name })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
