const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const assets = await prisma.asset.findMany({
    where: { assetTag: { in: ['AST-000021', 'AST-000015'] } },
    include: {
      currentEmployee: true,
      allocations: {
        where: { returnedAt: null },
        include: { employee: true },
      },
    },
  });

  for (const a of assets) {
    console.log(`Asset ${a.assetTag} (${a.name}):`, {
      status: a.status,
      currentEmployeeId: a.currentEmployeeId,
      currentEmployee: a.currentEmployee ? `${a.currentEmployee.firstName} ${a.currentEmployee.lastName}` : null,
      activeAllocations: a.allocations.map(al => `${al.employee?.firstName} ${al.employee?.lastName}`),
    });
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
