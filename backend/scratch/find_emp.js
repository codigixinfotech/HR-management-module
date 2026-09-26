const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const emp = await prisma.employee.findUnique({
    where: { id: 'cmu5be8im0076j7fnte7g79nm' },
    include: {
      company: true,
      branch: true,
      department: true,
      designation: true,
    },
  });
  console.log('Employee query result:', emp);
}

main().finally(() => prisma.$disconnect());
