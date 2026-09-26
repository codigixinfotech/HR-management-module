const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Check existing Branch Admins
  const branchEmps = await prisma.employee.findMany({
    where: {
      OR: [
        { employeeCode: { startsWith: 'BR-' } },
        { user: { roles: { some: { role: { name: 'BRANCH_ADMIN' } } } } },
      ],
    },
    include: { branch: true, department: true, designation: true },
  });

  console.log('Branch Admin records before repair:', branchEmps.map(e => ({
    code: e.employeeCode,
    name: `${e.firstName} ${e.lastName}`,
    dept: e.department?.name ?? null,
    desig: e.designation?.title ?? null,
  })));

  for (const emp of branchEmps) {
    if (!emp.companyId) continue;
    let adminDept = await prisma.department.findFirst({
      where: {
        companyId: emp.companyId,
        name: { in: ['Administration', 'Administration Head', 'Admin', 'Branch Administration'] },
      },
    });
    if (!adminDept) {
      const codeSuffix = emp.branch?.code ? `-${emp.branch.code.replace(/[^a-zA-Z0-9]/g, '')}` : `-${emp.id.slice(-4)}`;
      adminDept = await prisma.department.create({
        data: {
          companyId: emp.companyId,
          branchId: emp.branchId,
          code: `ADM${codeSuffix}`,
          name: 'Administration',
          type: 'Functional',
        },
      });
    }

    let branchAdminDesig = await prisma.designation.findFirst({
      where: {
        companyId: emp.companyId,
        title: { in: ['Branch Administrator', 'Branch Admin'] },
      },
    });
    if (!branchAdminDesig) {
      const codeSuffix = emp.branch?.code ? `-${emp.branch.code.replace(/[^a-zA-Z0-9]/g, '')}` : `-${emp.id.slice(-4)}`;
      branchAdminDesig = await prisma.designation.create({
        data: {
          companyId: emp.companyId,
          departmentId: adminDept.id,
          code: `BA${codeSuffix}`,
          title: 'Branch Administrator',
        },
      });
    }

    await prisma.employee.update({
      where: { id: emp.id },
      data: {
        departmentId: emp.departmentId || adminDept.id,
        designationId: emp.designationId || branchAdminDesig.id,
      },
    });
  }

  // 2. Check existing Company Admins
  const companyAdmins = await prisma.employee.findMany({
    where: {
      OR: [
        { employeeCode: { startsWith: 'C-' } },
        { employeeCode: { startsWith: 'COMP-' } },
        { user: { roles: { some: { role: { name: 'SUPER_ADMIN' } } } } },
      ],
    },
    include: { company: true, department: true, designation: true },
  });

  console.log('Company Admin records before repair:', companyAdmins.map(e => ({
    code: e.employeeCode,
    name: `${e.firstName} ${e.lastName}`,
    dept: e.department?.name ?? null,
    desig: e.designation?.title ?? null,
  })));

  for (const emp of companyAdmins) {
    if (!emp.companyId) continue;
    let mgmtDept = await prisma.department.findFirst({
      where: {
        companyId: emp.companyId,
        name: { in: ['Management', 'Executive Management', 'Corporate Management', 'Administration'] },
      },
    });
    if (!mgmtDept) {
      const codeSuffix = emp.company?.code ? `-${emp.company.code.replace(/[^a-zA-Z0-9]/g, '')}` : `-${emp.id.slice(-4)}`;
      mgmtDept = await prisma.department.create({
        data: {
          companyId: emp.companyId,
          code: `MGMT${codeSuffix}`,
          name: 'Management',
          type: 'Functional',
        },
      });
    }

    let compAdminDesig = await prisma.designation.findFirst({
      where: {
        companyId: emp.companyId,
        title: { in: ['Company Administrator', 'Company Admin', 'Executive Director'] },
      },
    });
    if (!compAdminDesig) {
      const codeSuffix = emp.company?.code ? `-${emp.company.code.replace(/[^a-zA-Z0-9]/g, '')}` : `-${emp.id.slice(-4)}`;
      compAdminDesig = await prisma.designation.create({
        data: {
          companyId: emp.companyId,
          departmentId: mgmtDept.id,
          code: `CA${codeSuffix}`,
          title: 'Company Administrator',
        },
      });
    }

    await prisma.employee.update({
      where: { id: emp.id },
      data: {
        departmentId: emp.departmentId || mgmtDept.id,
        designationId: emp.designationId || compAdminDesig.id,
      },
    });
  }

  // 3. Final verification
  const updatedAll = await prisma.employee.findMany({
    where: {
      OR: [
        { employeeCode: { startsWith: 'BR-' } },
        { employeeCode: { startsWith: 'C-' } },
      ],
    },
    include: { department: true, designation: true },
  });

  console.log('Records after repair:', updatedAll.map(e => ({
    code: e.employeeCode,
    name: `${e.firstName} ${e.lastName}`,
    dept: e.department?.name,
    desig: e.designation?.title,
  })));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
