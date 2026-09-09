"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('=== USERS ===');
    const users = await prisma.user.findMany();
    console.log(JSON.stringify(users.map(u => ({ id: u.id, email: u.email })), null, 2));
    console.log('=== ALL EMPLOYEES ===');
    const employees = await prisma.employee.findMany();
    console.log(JSON.stringify(employees.map(e => ({
        id: e.id,
        code: e.employeeCode,
        firstName: e.firstName,
        lastName: e.lastName,
        workEmail: e.workEmail,
        personalEmail: e.personalEmail,
        userId: e.userId,
    })), null, 2));
    console.log('=== ALL EMPLOYEE TASKS ===');
    const tasks = await prisma.employeeTask.findMany({
        include: { assignedTo: true },
    });
    console.log(JSON.stringify(tasks.map(t => ({
        id: t.id,
        taskCode: t.taskCode,
        title: t.title,
        assignedToId: t.assignedToId,
        assignedToCode: t.assignedTo?.employeeCode,
        assignedToName: t.assignedTo ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}` : null,
    })), null, 2));
}
main().finally(() => prisma.$disconnect());
//# sourceMappingURL=debug-user-sanika.js.map