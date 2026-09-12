const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const depts = await prisma.department.findMany({
    include: { branch: true, company: true }
  });
  console.log(depts.map(d => ({
    id: d.id,
    code: d.code,
    name: d.name,
    companyId: d.companyId,
    companyName: d.company?.name,
    branchId: d.branchId,
    branchName: d.branch?.name
  })));
}
main().finally(() => prisma.$disconnect());
