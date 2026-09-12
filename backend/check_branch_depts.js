const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const companies = await prisma.company.findMany({
    where: { name: { contains: 'Crav' } }
  });
  for (const company of companies) {
    console.log('=== Company:', company.id, company.name, '===');
    const branches = await prisma.branch.findMany({
      where: { companyId: company.id }
    });
    console.log('Branches:', branches.map(b => ({ id: b.id, name: b.name, code: b.code })));

    const depts = await prisma.department.findMany({
      where: { companyId: company.id }
    });
    console.log('Depts:', depts.map(d => ({ id: d.id, name: d.name, branchId: d.branchId })));

    for (const b of branches) {
      const filtered = await prisma.department.findMany({
        where: {
          companyId: company.id,
          branchId: b.id
        }
      });
      console.log(`Depts for branch ${b.name} (${b.id}):`, filtered.map(d => d.name));
    }
  }
}
main().finally(() => prisma.$disconnect());
