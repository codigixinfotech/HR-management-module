import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Inspecting and fixing user accounts...');

  const passSanika = await bcrypt.hash('Sanika@123', 12);
  const passAdmin = await bcrypt.hash('Admin@12345', 12);
  const passRowan = await bcrypt.hash('rowanortiz2026', 12);

  // 1. Ensure Admin User
  let adminUser = await prisma.user.findFirst({ where: { email: 'admin@ehcm.local' } });
  if (adminUser) {
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { passwordHash: passAdmin, mustResetPassword: false },
    });
    console.log('✅ Admin user account updated: admin@ehcm.local / Admin@12345');
  }

  // 2. Find Sanika Mote Employee Record
  const sanikaEmp = await prisma.employee.findFirst({
    where: {
      OR: [
        { workEmail: 'motesanika@gmail.com' },
        { AND: [{ firstName: 'Sanika' }, { lastName: 'Mote' }] },
        { employeeCode: 'EMP-8265' },
        { employeeCode: 'EMP-SANIKA' },
      ],
    },
  });

  if (sanikaEmp) {
    // Update Sanika Employee details
    await prisma.employee.update({
      where: { id: sanikaEmp.id },
      data: {
        employeeCode: 'EMP-8265',
        workEmail: 'motesanika@gmail.com',
        firstName: 'Sanika',
        lastName: 'Mote',
      },
    });

    // Create or update User for Sanika
    let sanikaUser = await prisma.user.findFirst({
      where: { OR: [{ email: 'motesanika@gmail.com' }, { id: sanikaEmp.userId || '' }] },
    });

    if (sanikaUser) {
      await prisma.user.update({
        where: { id: sanikaUser.id },
        data: {
          email: 'motesanika@gmail.com',
          passwordHash: passSanika,
          mustResetPassword: false,
        },
      });
      await prisma.employee.update({
        where: { id: sanikaEmp.id },
        data: { userId: sanikaUser.id },
      });
      console.log('✅ Sanika Mote user account updated: motesanika@gmail.com / Sanika@123');
    } else {
      const company = await prisma.company.findFirst();
      const empRole = await prisma.role.findFirst({ where: { name: 'EMPLOYEE' } });
      const newUser = await prisma.user.create({
        data: {
          companyId: company ? company.id : undefined,
          email: 'motesanika@gmail.com',
          passwordHash: passSanika,
          mustResetPassword: false,
          roles: empRole
            ? { create: [{ roleId: empRole.id }] }
            : undefined,
        },
      });
      await prisma.employee.update({
        where: { id: sanikaEmp.id },
        data: { userId: newUser.id },
      });
      console.log('✅ Sanika Mote user account created: motesanika@gmail.com / Sanika@123');
    }
  } else {
    console.log('⚠️ Sanika Mote employee record not found.');
  }

  // 3. Find Rowan Ortiz Employee Record
  const rowanEmp = await prisma.employee.findFirst({
    where: {
      OR: [
        { employeeCode: 'EMP0025' },
        { AND: [{ firstName: 'Rowan' }, { lastName: 'Ortiz' }] },
      ],
    },
  });

  if (rowanEmp) {
    let rowanUser = await prisma.user.findFirst({
      where: { OR: [{ email: 'rowan.ortiz@ehcm.local' }, { id: rowanEmp.userId || '' }] },
    });

    if (rowanUser) {
      await prisma.user.update({
        where: { id: rowanUser.id },
        data: {
          email: 'rowan.ortiz@ehcm.local',
          passwordHash: passRowan,
          mustResetPassword: true,
        },
      });
      await prisma.employee.update({
        where: { id: rowanEmp.id },
        data: { userId: rowanUser.id },
      });
      console.log('✅ Rowan Ortiz user account updated: rowan.ortiz@ehcm.local / rowanortiz2026');
    } else {
      const company = await prisma.company.findFirst();
      const empRole = await prisma.role.findFirst({ where: { name: 'EMPLOYEE' } });
      const newUser = await prisma.user.create({
        data: {
          companyId: company ? company.id : undefined,
          email: 'rowan.ortiz@ehcm.local',
          passwordHash: passRowan,
          mustResetPassword: true,
          roles: empRole
            ? { create: [{ roleId: empRole.id }] }
            : undefined,
        },
      });
      await prisma.employee.update({
        where: { id: rowanEmp.id },
        data: { userId: newUser.id },
      });
      console.log('✅ Rowan Ortiz user account created: rowan.ortiz@ehcm.local / rowanortiz2026');
    }
  }

  console.log('Account setup script complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
