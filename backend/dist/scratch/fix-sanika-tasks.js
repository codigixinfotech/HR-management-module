"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
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
        const updated = await prisma.employeeTask.updateMany({
            where: { assignedToId: duplicateSanika.id },
            data: { assignedToId: sanikaMain.id },
        });
        console.log('Reassigned tasks count:', updated.count);
        await prisma.employee.delete({
            where: { id: duplicateSanika.id },
        });
        console.log('Deleted duplicate Sanika record.');
    }
    if (sanikaMain) {
        const tasks = await prisma.employeeTask.findMany({
            where: { assignedToId: sanikaMain.id },
        });
        console.log(`Main Sanika (${sanikaMain.id}) has ${tasks.length} assigned tasks.`);
    }
}
fixData().finally(() => prisma.$disconnect());
//# sourceMappingURL=fix-sanika-tasks.js.map