const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  console.log('Restoring asset custody for completed maintenance and repair...');

  // 1. AST-000021 (INDUSTRIES MATERIAL) - Maintenance Completed -> ALLOCATED
  const found21 = await prisma.asset.findFirst({ where: { assetTag: 'AST-000021' } });
  const a21 = await prisma.asset.update({
    where: { id: found21.id },
    data: {
      status: 'ALLOCATED',
    },
    include: { currentEmployee: true },
  });
  console.log('✅ AST-000021 restored to ALLOCATED for employee:', a21.currentEmployee?.firstName);

  // 2. AST-000015 (Server 16 gb) - Maintenance In Repair -> UNDER_MAINTENANCE
  const found15 = await prisma.asset.findFirst({ where: { assetTag: 'AST-000015' } });
  const a15 = await prisma.asset.update({
    where: { id: found15.id },
    data: {
      status: 'UNDER_MAINTENANCE',
    },
    include: { currentEmployee: true },
  });
  console.log('✅ AST-000015 updated to UNDER_MAINTENANCE for employee:', a15.currentEmployee?.firstName);

  // Check sanu's assets in getMyAssets logic
  const employee = await prisma.employee.findFirst({
    where: { firstName: 'sanu' },
  });

  const sanuAssets = await prisma.asset.findMany({
    where: {
      OR: [
        { currentEmployeeId: employee.id, status: { in: ['ALLOCATED', 'UNDER_MAINTENANCE'] } },
        { allocations: { some: { employeeId: employee.id, returnedAt: null } } },
      ],
    },
  });

  console.log(`\n🎉 sanu now has ${sanuAssets.length} assets in custody:`, sanuAssets.map(a => `${a.assetTag} (${a.name}) [Status: ${a.status}]`));
}

fix().catch(console.error).finally(() => prisma.$disconnect());
