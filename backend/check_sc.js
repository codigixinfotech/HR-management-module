const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.shiftChangeRequest.findMany();
  console.log('COUNT SHIFT CHANGES:', rows.length);
  console.log('ROWS:', JSON.stringify(rows, null, 2));

  const emps = await prisma.employee.findMany({
    select: { id: true, employeeCode: true, firstName: true, lastName: true, companyId: true, department: { select: { name: true } } }
  });
  console.log('ACTIVE EMPLOYEES:', JSON.stringify(emps, null, 2));

  const companies = await prisma.company.findMany({ select: { id: true, name: true } });
  console.log('COMPANIES:', JSON.stringify(companies, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
