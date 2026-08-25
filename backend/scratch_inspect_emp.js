const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const employees = await prisma.employee.findMany({
    where: {
      firstName: { in: ['Amit', 'Sanika', 'Aditya', 'Admin'] },
    },
    include: {
      company: true,
    },
  });

  console.log('EMPLOYEES:');
  for (const e of employees) {
    console.log({
      id: e.id,
      code: e.employeeCode,
      name: `${e.firstName} ${e.lastName}`,
      companyId: e.companyId,
      companyName: e.company ? e.company.name : null,
      reportingManagerId: e.reportingManagerId,
    });
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
