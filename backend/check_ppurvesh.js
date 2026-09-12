const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    where: { email: { contains: 'ppurvesh' } },
    include: {
      roles: { include: { role: true } },
      branch: true,
      company: true,
      employee: true
    }
  });
  console.log(users.map(u => ({
    id: u.id,
    email: u.email,
    companyId: u.companyId,
    companyName: u.company?.name,
    branchId: u.branchId,
    branchName: u.branch?.name,
    roles: u.roles.map(r => r.role.name),
    employee: u.employee ? { id: u.employee.id, branchId: u.employee.branchId } : null
  })));
}
main().finally(() => prisma.$disconnect());
