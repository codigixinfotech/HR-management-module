const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- 1. Updating branch names containing "Pune Head Office" ---');
  const updatedBranches = await prisma.$executeRawUnsafe(`
    UPDATE branches 
    SET name = 'Head Office' 
    WHERE name LIKE '%Pune Head Office%'
  `);
  console.log('Updated branches count:', updatedBranches);

  console.log('--- 2. Checking / Creating Head Office branch for Cravita ---');
  const compId = 'cmtwjbe5900zoj7op4c3xxxb5';
  let cravitaHo = await prisma.branch.findFirst({
    where: {
      companyId: compId,
      OR: [
        { code: 'HO' },
        { name: { contains: 'Head Office' } }
      ]
    }
  });

  if (!cravitaHo) {
    console.log('Creating Head Office branch for Cravita...');
    cravitaHo = await prisma.branch.create({
      data: {
        companyId: compId,
        code: 'HO',
        name: 'Head Office',
        branchType: 'Head Office',
        city: 'Pune',
        state: 'Maharashtra',
        country: 'India',
        isActive: true,
      }
    });
    console.log('Created Cravita Head Office branch:', cravitaHo.id);
  } else {
    console.log('Found Cravita Head Office branch:', cravitaHo.id);
  }

  console.log('--- 3. Restoring terminated/deleted vendors for Cravita ---');
  const restoredVendors = await prisma.$executeRawUnsafe(`
    UPDATE contractor_vendors 
    SET deleted_at = NULL, status = 'ACTIVE', branch_id = ?
    WHERE company_id = ? AND vendor_code IN ('VND-001', 'VND-002', 'VND-003')
  `, cravitaHo.id, compId);
  console.log('Restored vendors:', restoredVendors);

  console.log('--- 4. Updating branch_id for Cravita contracts & workers ---');
  const updatedContracts = await prisma.$executeRawUnsafe(`
    UPDATE contractor_contracts 
    SET branch_id = ?
    WHERE company_id = ? AND (branch_id = 'cmsogkyxl0005iphs4mqhbxsx' OR branch_id IS NULL)
  `, cravitaHo.id, compId);
  console.log('Updated contracts:', updatedContracts);

  const updatedWorkers = await prisma.$executeRawUnsafe(`
    UPDATE contractor_workers 
    SET branch_id = ?
    WHERE company_id = ? AND branch_id = 'cmsogkyxl0005iphs4mqhbxsx'
  `, cravitaHo.id, compId);
  console.log('Updated workers:', updatedWorkers);

  const updatedDeployments = await prisma.$executeRawUnsafe(`
    UPDATE worker_deployments 
    SET branch_id = ?
    WHERE company_id = ? AND branch_id = 'cmsogkyxl0005iphs4mqhbxsx'
  `, cravitaHo.id, compId);
  console.log('Updated deployments:', updatedDeployments);

  console.log('--- 5. Verify Current State for Cravita ---');
  const finalVendors = await prisma.$queryRawUnsafe(`
    SELECT v.id, v.vendor_code, v.display_name, v.status, v.branch_id, b.name as branch_name 
    FROM contractor_vendors v 
    LEFT JOIN branches b ON b.id = v.branch_id 
    WHERE v.company_id = ? AND v.deleted_at IS NULL
  `, compId);
  console.log('Active vendors:', finalVendors);

  const finalContracts = await prisma.$queryRawUnsafe(`
    SELECT c.id, c.contract_number, c.status, c.branch_id, b.name as branch_name, v.display_name as vendor_name
    FROM contractor_contracts c 
    LEFT JOIN branches b ON b.id = c.branch_id 
    LEFT JOIN contractor_vendors v ON v.id = c.vendor_id
    WHERE c.company_id = ?
  `, compId);
  console.log('Contracts:', finalContracts);
}

main().catch(console.error).finally(() => prisma.$disconnect());
