const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const u1 = await prisma.user.findUnique({ where: { email: 'Branch1@gmail.com' } });
  console.log('Case-sensitive test Branch1@gmail.com:', u1 ? 'Found' : 'NOT FOUND');
  const u2 = await prisma.user.findUnique({ where: { email: 'branch1@gmail.com ' } });
  console.log('Trailing space test branch1@gmail.com :', u2 ? 'Found' : 'NOT FOUND');
}
run().finally(() => prisma.$disconnect());
