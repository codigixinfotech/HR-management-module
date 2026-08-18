import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixData() {
  const sanikaMain = await prisma.employee.findFirst({
    where: { employeeCode: 'EMP-SANIKA' },
  });

  const duplicateSanika = await prisma.employee.findFirst({
    where: { employeeCode: 'EMP-8265' },
  });

  console.log('Main Sanika:', sanikaMain?.id, sanikaMain?.employeeCode);
  console.log('Duplicate Sanika:', duplicateSanika?.id, duplicateSanika?.employeeCode);

  if (sanikaMain && duplicateSanika) {
    // Re-assign tasks from duplicate to main
    const updated = await prisma.employeeTask.updateMany({
      where: { assignedToId: duplicateSanika.id },
      data: { assignedToId: sanikaMain.id },
    });
    console.log('Reassigned tasks count:', updated.count);

    // Delete duplicate employee record
    await prisma.employee.delete({
      where: { id: duplicateSanika.id },
    });
    console.log('Deleted duplicate Sanika record.');
  }

  // Count tasks assigned to main Sanika
  if (sanikaMain) {
    const tasks = await prisma.employeeTask.findMany({
      where: { assignedToId: sanikaMain.id },
    });
    console.log(`Main Sanika (${sanikaMain.id}) has ${tasks.length} assigned tasks.`);
  }
}

fixData().finally(() => prisma.$disconnect());
