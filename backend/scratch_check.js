const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const emp = await prisma.employee.findFirst({
    where: { OR: [{ employeeCode: 'EMP-001' }, { firstName: { contains: 'sudarshan' } }] },
    include: { department: true, shiftAssignments: { include: { shiftType: true } } }
  });
  console.log('Employee:', emp?.id, emp?.firstName, emp?.lastName, 'Dept:', emp?.department?.name, 'Assignments:', JSON.stringify(emp?.shiftAssignments, null, 2));

  const deptAssignments = await prisma.shiftAssignment.findMany({
    include: { shiftType: true, employee: true, department: true }
  });
  console.log('All DB ShiftAssignments count:', deptAssignments.length);
  for (const a of deptAssignments) {
    console.log(a.id, a.shiftType?.name, a.shiftType?.code, 'Emp:', a.employee?.firstName, 'Dept:', a.department?.name, 'Active:', a.isActive);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
