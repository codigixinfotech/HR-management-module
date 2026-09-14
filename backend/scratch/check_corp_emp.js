const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const emp = await prisma.employee.findUnique({
    where: { id: 'cmtwjbecd00zuj7op138ul3f5' },
    include: { designation: true, department: true, company: true }
  });
  console.log('Corporate Employee:', emp);
}

run().finally(() => prisma.$disconnect());
