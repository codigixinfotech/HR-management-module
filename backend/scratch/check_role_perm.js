const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const role = await prisma.role.findFirst({
    where: { name: 'EMPLOYEE' },
    include: {
      permissions: {
        include: { permission: true },
      },
    },
  });
  console.log('Role:', role?.name);
  console.log('Permissions count:', role?.permissions?.length);
  console.log('Permissions:', role?.permissions?.map(p => p.permission?.code));

  // Check all permissions with attendance_leave
  const alPerms = await prisma.permission.findMany({
    where: { code: { contains: 'attendance_leave' } },
  });
  console.log('All attendance_leave permissions:', alPerms);
}

main().finally(() => prisma.$disconnect());
