"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const user = await prisma.user.findFirst({
        where: { email: 'motesanika@gmail.com' },
    });
    const sanikaEmp = await prisma.employee.findFirst({
        where: { employeeCode: 'EMP-SANIKA' },
    });
    console.log('User motesanika@gmail.com:', user?.id);
    console.log('Sanika Employee EMP-SANIKA:', sanikaEmp?.id);
    await prisma.employee.updateMany({
        where: { workEmail: 'motesanika@gmail.com' },
        data: { workEmail: 'demo.employee@ehcm.local' },
    });
    await prisma.employee.updateMany({
        where: { personalEmail: 'motesanika@gmail.com' },
        data: { personalEmail: null },
    });
    if (sanikaEmp) {
        await prisma.employee.update({
            where: { id: sanikaEmp.id },
            data: {
                workEmail: 'motesanika@gmail.com',
                userId: user?.id || null,
            },
        });
        console.log('Successfully linked EMP-SANIKA to motesanika@gmail.com and user ID!');
    }
    const tasks = await prisma.employeeTask.findMany({
        where: { assignedToId: sanikaEmp?.id },
    });
    console.log(`Verified ${tasks.length} tasks assigned to EMP-SANIKA (${sanikaEmp?.id}).`);
}
main().finally(() => prisma.$disconnect());
//# sourceMappingURL=link-sanika-user.js.map