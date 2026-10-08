const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const compId = 'cmtwjbe5900zoj7op4c3xxxb5';
  console.log('=== Branches for Cravita ===');
  const branches = await prisma.branch.findMany({ where: { companyId: compId } });
  console.log(branches);

  console.log('=== All Branches with Pune in name ===');
  const allPuneBranches = await prisma.branch.findMany({
    where: {
      OR: [
        { name: { contains: 'Pune' } },
        { name: { contains: 'Head Office' } },
      ]
    }
  });
  console.log(allPuneBranches);

  console.log('=== Vendors for Cravita ===');
  const vendors = await prisma.$queryRawUnsafe(`
    SELECT v.id, v.vendor_code, v.display_name, v.branch_id, b.name as branch_name, b.companyId as branch_comp_id
    FROM contractor_vendors v
    LEFT JOIN branches b ON b.id = v.branch_id
    WHERE v.company_id = '${compId}'
  `);
  console.log(vendors);

  console.log('=== Contracts for Cravita ===');
  const contracts = await prisma.$queryRawUnsafe(`
    SELECT c.id, c.contract_number, c.branch_id, b.name as branch_name, b.companyId as branch_comp_id
    FROM contractor_contracts c
    LEFT JOIN branches b ON b.id = c.branch_id
    WHERE c.company_id = '${compId}'
  `);
  console.log(contracts);
}

main().catch(console.error).finally(() => prisma.$disconnect());
