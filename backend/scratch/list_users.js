const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      isActive: true,
      mustResetPassword: true,
      branchId: true,
      branch: { select: { name: true, code: true } },
      companyId: true,
      company: { select: { name: true, code: true } },
      roles: { select: { role: { select: { name: true } } } },
    }
  });
  console.log(JSON.stringify(users, null, 2));
}
run().finally(() => prisma.$disconnect());
