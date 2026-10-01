const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const asset = await prisma.asset.findFirst({
    where: { assetTag: 'AST-000021' },
    include: {
      currentEmployee: true,
      allocations: {
        include: { employee: true },
        orderBy: { allocatedAt: 'desc' },
      },
      maintenanceLogs: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  console.log('Asset AST-000021:', {
    id: asset?.id,
    name: asset?.name,
    status: asset?.status,
    currentEmployeeId: asset?.currentEmployeeId,
    currentEmployee: asset?.currentEmployee ? `${asset.currentEmployee.firstName} ${asset.currentEmployee.lastName}` : null,
  });

  console.log('Allocations:', asset?.allocations.map(a => ({
    id: a.id,
    employeeId: a.employeeId,
    employeeName: `${a.employee?.firstName} ${a.employee?.lastName}`,
    allocatedAt: a.allocatedAt,
    returnedAt: a.returnedAt,
  })));

  const reqs = await prisma.assetMaintenanceRequest.findMany({
    where: { assetId: asset?.id },
    include: { requestedByEmployee: true },
  });

  console.log('Maintenance Requests:', reqs.map((r) => ({
    id: r.id,
    requestNumber: r.requestNumber,
    status: r.status,
    requestedBy: `${r.requestedByEmployee?.firstName} ${r.requestedByEmployee?.lastName}`,
    workOrderId: r.workOrderId,
  })));
}

check().catch(console.error).finally(() => prisma.$disconnect());
