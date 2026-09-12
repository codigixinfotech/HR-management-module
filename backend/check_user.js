const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testWorkflow() {
  console.log('Testing shift change queries...');
  const rows = await prisma.$queryRawUnsafe(`
    SELECT sc.*, e.employeeCode, e.firstName, e.lastName, d.name as departmentName
    FROM shift_change_requests sc
    LEFT JOIN employees e ON sc.employeeId = e.id
    LEFT JOIN departments d ON e.departmentId = d.id
    ORDER BY sc.createdAt DESC
  `);
  console.log('Found rows:', rows.length);
  rows.forEach(r => {
    console.log(`- [${r.id}] ${r.employeeCode} ${r.firstName} ${r.lastName} | ${r.currentShift} -> ${r.requestedShift} | ${r.changeType} | ${r.effectiveDate} to ${r.effectiveTo} | status: ${r.status}`);
  });
}

testWorkflow().catch(console.error).finally(() => prisma.$disconnect());
