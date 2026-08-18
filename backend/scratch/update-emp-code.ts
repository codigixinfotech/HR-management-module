import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find employee with code EMP-SANIKA or named Sanika Mote
  const sanika = await prisma.employee.findFirst({
    where: {
      OR: [
        { employeeCode: 'EMP-SANIKA' },
        { employeeCode: 'EMP-8265' },
        { AND: [{ firstName: 'Sanika' }, { lastName: 'Mote' }] },
      ],
    },
  });

  console.log('Sanika employee record found:', sanika?.id, sanika?.employeeCode, sanika?.firstName, sanika?.lastName);

  if (sanika) {
    // Update employeeCode to EMP-8265 and workEmail to motesanika@gmail.com
    await prisma.employee.update({
      where: { id: sanika.id },
      data: {
        employeeCode: 'EMP-8265',
        workEmail: 'motesanika@gmail.com',
      },
    });
    console.log('Updated Sanika employeeCode to EMP-8265 and workEmail to motesanika@gmail.com');
  }

  // Check tasks
  if (sanika) {
    const tasks = await prisma.employeeTask.findMany({
      where: { assignedToId: sanika.id },
    });
    console.log(`Sanika (${sanika.id}, EMP-8265) has ${tasks.length} assigned tasks.`);
  }
}

main().finally(() => prisma.$disconnect());
