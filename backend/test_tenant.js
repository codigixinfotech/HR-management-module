const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();
const { getTenantBranchId, getTenantCompanyId } = require('./dist/common/utils/tenant-context.util');

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'ppurvesh503@gmail.com' },
    include: {
      roles: { include: { role: true } },
      branch: true,
      company: true,
      employee: true
    }
  });

  const payload = {
    userId: user.id,
    email: user.email,
    companyId: user.companyId,
    branchId: user.branchId,
    roles: user.roles.map(r => r.role.name),
    primaryRole: 'Company Admin',
    permissions: ['*']
  };

  const queryBranchId = 'cmty65x5g007ej79dy9yj87mu';
  const tenantCompany = getTenantCompanyId(payload, user.companyId);
  const tenantBranch = getTenantBranchId(payload, queryBranchId);

  console.log('Result for ppurvesh503:');
  console.log('tenantCompanyId:', tenantCompany);
  console.log('tenantBranchId:', tenantBranch);
}
main().finally(() => prisma.$disconnect());
