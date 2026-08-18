"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let TasksService = class TasksService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generateNextTaskCode() {
        const year = new Date().getFullYear();
        const count = await this.prisma.employeeTask.count();
        const seq = String(count + 1).padStart(3, '0');
        return `TSK-${year}-${seq}`;
    }
    async generateNextRequestCode() {
        const year = new Date().getFullYear();
        const count = await this.prisma.taskRequest.count();
        const seq = String(count + 1).padStart(3, '0');
        return `REQ-${year}-${seq}`;
    }
    async listTasks(params) {
        let assignedToFilter = undefined;
        if (params.assignedToId) {
            assignedToFilter = params.assignedToId;
        }
        else if (params.assignedToName) {
            const nameParts = params.assignedToName.trim().split(/\s+/);
            const firstNamePart = nameParts[0];
            const lastNamePart = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0];
            const emp = await this.prisma.employee.findFirst({
                where: {
                    OR: [
                        {
                            AND: [
                                { firstName: { contains: firstNamePart } },
                                { lastName: { contains: lastNamePart } },
                            ],
                        },
                        { firstName: { contains: params.assignedToName } },
                        { lastName: { contains: params.assignedToName } },
                    ],
                },
            });
            if (emp) {
                assignedToFilter = emp.id;
            }
            else {
                assignedToFilter = 'NOT_FOUND_EMPLOYEE_ID';
            }
        }
        return this.prisma.employeeTask.findMany({
            where: {
                ...(assignedToFilter ? { assignedToId: assignedToFilter } : {}),
                ...(params.status ? { status: params.status } : {}),
                ...(params.priority ? { priority: params.priority } : {}),
                ...(params.departmentName ? { departmentName: params.departmentName } : {}),
                ...(params.search
                    ? {
                        OR: [
                            { title: { contains: params.search } },
                            { taskCode: { contains: params.search } },
                            { description: { contains: params.search } },
                        ],
                    }
                    : {}),
            },
            include: {
                assignedTo: {
                    select: {
                        id: true,
                        employeeCode: true,
                        firstName: true,
                        lastName: true,
                        department: { select: { id: true, name: true } },
                        designation: { select: { id: true, title: true } },
                    },
                },
                assignedBy: {
                    select: {
                        id: true,
                        employeeCode: true,
                        firstName: true,
                        lastName: true,
                        designation: { select: { id: true, title: true } },
                    },
                },
                activities: { orderBy: { createdAt: 'desc' } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findById(id) {
        const task = await this.prisma.employeeTask.findUnique({
            where: { id },
            include: {
                assignedTo: {
                    select: {
                        id: true,
                        employeeCode: true,
                        firstName: true,
                        lastName: true,
                        department: { select: { id: true, name: true } },
                        designation: { select: { id: true, title: true } },
                    },
                },
                assignedBy: {
                    select: {
                        id: true,
                        employeeCode: true,
                        firstName: true,
                        lastName: true,
                        designation: { select: { id: true, title: true } },
                    },
                },
                activities: { orderBy: { createdAt: 'desc' } },
            },
        });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        return task;
    }
    async createTask(dto) {
        const assignedTo = await this.prisma.employee.findUnique({
            where: { id: dto.assignedToId },
            include: { department: true, designation: true },
        });
        if (!assignedTo)
            throw new common_1.NotFoundException('Assigned employee not found');
        let assignedById = dto.assignedById;
        if (!assignedById) {
            const admin = await this.prisma.employee.findFirst();
            assignedById = admin?.id || assignedTo.id;
        }
        const taskCode = await this.generateNextTaskCode();
        const departmentName = dto.departmentName || assignedTo.department?.name || 'General';
        const task = await this.prisma.employeeTask.create({
            data: {
                taskCode,
                title: dto.title,
                description: dto.description || null,
                taskType: dto.taskType || 'TASK',
                departmentName,
                projectName: dto.projectName || 'Internal Operations',
                priority: dto.priority || 'MEDIUM',
                assignedToId: dto.assignedToId,
                assignedById,
                departmentId: assignedTo.departmentId || null,
                startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
                dueDate: dto.dueDate ? new Date(dto.dueDate) : new Date(Date.now() + 3 * 86400000),
                estimatedHours: dto.estimatedHours || 8,
                attachments: dto.attachments || null,
                instructions: dto.instructions || null,
                managerRemarks: dto.managerRemarks || null,
                status: 'ASSIGNED',
                progress: 0,
            },
            include: {
                assignedTo: { select: { id: true, firstName: true, lastName: true } },
                assignedBy: { select: { id: true, firstName: true, lastName: true } },
            },
        });
        await this.prisma.taskActivity.create({
            data: {
                taskId: task.id,
                performedBy: `${task.assignedBy.firstName} ${task.assignedBy.lastName}`,
                action: 'TASK_ASSIGNED',
                newStatus: 'ASSIGNED',
                progress: 0,
                remarks: `Task assigned to ${task.assignedTo.firstName} ${task.assignedTo.lastName}`,
            },
        });
        await this.prisma.taskNotification.create({
            data: {
                employeeId: dto.assignedToId,
                title: 'New Task Assigned',
                message: `You have been assigned task "${dto.title}" (${taskCode}) with priority ${dto.priority || 'MEDIUM'}.`,
                type: 'NEW_TASK',
            },
        });
        return task;
    }
    async startTask(id, startedBy) {
        const task = await this.findById(id);
        const now = new Date();
        const performer = startedBy || `${task.assignedTo.firstName} ${task.assignedTo.lastName}`;
        const updated = await this.prisma.employeeTask.update({
            where: { id },
            data: {
                status: 'IN_PROGRESS',
                startedAt: task.startedAt || now,
                progress: task.progress > 0 ? task.progress : 10,
            },
            include: {
                assignedTo: true,
                assignedBy: true,
            },
        });
        await this.prisma.taskActivity.create({
            data: {
                taskId: id,
                performedBy: performer,
                action: 'TASK_STARTED',
                previousStatus: task.status,
                newStatus: 'IN_PROGRESS',
                progress: updated.progress,
                remarks: `${performer} started working on the task.`,
            },
        });
        return updated;
    }
    async updateProgress(id, dto) {
        const task = await this.findById(id);
        const performer = dto.updatedBy || `${task.assignedTo.firstName} ${task.assignedTo.lastName}`;
        const newStatus = dto.status || (dto.progress === 100 ? 'COMPLETED' : 'IN_PROGRESS');
        const updated = await this.prisma.employeeTask.update({
            where: { id },
            data: {
                progress: dto.progress,
                status: newStatus,
                actualHours: dto.actualHours !== undefined ? dto.actualHours : task.actualHours,
                completionAttachment: dto.completionAttachment || task.completionAttachment,
                completionRemarks: dto.remarks || task.completionRemarks,
                ...(newStatus === 'COMPLETED' ? { completedAt: new Date() } : {}),
            },
        });
        await this.prisma.taskActivity.create({
            data: {
                taskId: id,
                performedBy: performer,
                action: 'PROGRESS_UPDATED',
                previousStatus: task.status,
                newStatus,
                progress: dto.progress,
                remarks: dto.remarks || `Progress updated to ${dto.progress}%.`,
            },
        });
        if (newStatus === 'COMPLETED') {
            await this.prisma.taskNotification.create({
                data: {
                    employeeId: task.assignedById,
                    title: 'Task Completed – Awaiting Review',
                    message: `${performer} completed task "${task.title}" (${task.taskCode}). Please review and approve.`,
                    type: 'AWAITING_REVIEW',
                },
            });
        }
        return updated;
    }
    async completeTask(id, dto) {
        const task = await this.findById(id);
        if (!dto.completionRemarks || !dto.completionRemarks.trim()) {
            throw new common_1.BadRequestException('Completion remarks are required');
        }
        const performer = dto.completedBy || `${task.assignedTo.firstName} ${task.assignedTo.lastName}`;
        const updated = await this.prisma.employeeTask.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                progress: 100,
                actualHours: dto.actualHours || task.actualHours || task.estimatedHours,
                completionRemarks: dto.completionRemarks,
                completionAttachment: dto.completionAttachment || task.completionAttachment,
                completedAt: new Date(),
            },
        });
        await this.prisma.taskActivity.create({
            data: {
                taskId: id,
                performedBy: performer,
                action: 'TASK_COMPLETED',
                previousStatus: task.status,
                newStatus: 'COMPLETED',
                progress: 100,
                remarks: dto.completionRemarks,
            },
        });
        await this.prisma.taskNotification.create({
            data: {
                employeeId: task.assignedById,
                title: 'Task Completed – Awaiting Review',
                message: `${performer} submitted completion for task "${task.title}" (${task.taskCode}).`,
                type: 'AWAITING_REVIEW',
            },
        });
        return updated;
    }
    async reviewTask(id, dto) {
        const task = await this.findById(id);
        const performer = dto.reviewedBy || `${task.assignedBy.firstName} ${task.assignedBy.lastName}`;
        let targetStatus;
        let actionText;
        let messageToEmployee;
        if (dto.action === 'APPROVE') {
            targetStatus = 'CLOSED';
            actionText = 'TASK_APPROVED_CLOSED';
            messageToEmployee = `Your task "${task.title}" (${task.taskCode}) was approved and closed.`;
        }
        else if (dto.action === 'SEND_BACK') {
            targetStatus = 'IN_PROGRESS';
            actionText = 'TASK_RETURNED_FOR_CORRECTION';
            messageToEmployee = `Your task "${task.title}" (${task.taskCode}) was returned for correction. Remarks: ${dto.remarks || 'Needs update'}`;
        }
        else {
            targetStatus = 'REOPENED';
            actionText = 'TASK_REOPENED';
            messageToEmployee = `Task "${task.title}" (${task.taskCode}) has been reopened.`;
        }
        const updated = await this.prisma.employeeTask.update({
            where: { id },
            data: {
                status: targetStatus,
                managerRemarks: dto.remarks || task.managerRemarks,
                ...(dto.action === 'APPROVE' ? { closedAt: new Date() } : {}),
                ...(dto.action === 'SEND_BACK' ? { progress: 75 } : {}),
            },
        });
        await this.prisma.taskActivity.create({
            data: {
                taskId: id,
                performedBy: performer,
                action: actionText,
                previousStatus: task.status,
                newStatus: targetStatus,
                progress: updated.progress,
                remarks: dto.remarks || `Task status updated to ${targetStatus}`,
            },
        });
        await this.prisma.taskNotification.create({
            data: {
                employeeId: task.assignedToId,
                title: dto.action === 'APPROVE' ? 'Task Approved' : dto.action === 'SEND_BACK' ? 'Task Returned for Correction' : 'Task Reopened',
                message: messageToEmployee,
                type: dto.action === 'SEND_BACK' ? 'RETURNED' : 'INFO',
            },
        });
        return updated;
    }
    async getDashboardSummary(employeeId) {
        const whereCondition = employeeId ? { assignedToId: employeeId } : {};
        const all = await this.prisma.employeeTask.findMany({
            where: whereCondition,
        });
        const now = new Date();
        const summary = {
            total: all.length,
            assigned: all.filter((t) => t.status === 'ASSIGNED').length,
            inProgress: all.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'REOPENED').length,
            onHold: all.filter((t) => t.status === 'ON_HOLD').length,
            completed: all.filter((t) => t.status === 'COMPLETED' || t.status === 'CLOSED').length,
            closed: all.filter((t) => t.status === 'CLOSED').length,
            dueToday: all.filter((t) => t.dueDate && new Date(t.dueDate).toDateString() === now.toDateString() && t.status !== 'CLOSED').length,
            overdue: all.filter((t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'COMPLETED' && t.status !== 'CLOSED').length,
        };
        return summary;
    }
    async listRequests(requestedById) {
        return this.prisma.taskRequest.findMany({
            where: requestedById ? { requestedById } : {},
            include: {
                requestedBy: {
                    select: { id: true, firstName: true, lastName: true, employeeCode: true, department: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async createRequest(dto) {
        const requestCode = await this.generateNextRequestCode();
        return this.prisma.taskRequest.create({
            data: {
                requestCode,
                requestTitle: dto.requestTitle,
                requestType: dto.requestType || 'GENERAL',
                description: dto.description || null,
                priority: dto.priority || 'MEDIUM',
                requestedById: dto.requestedById,
                status: 'SUBMITTED',
            },
        });
    }
    async reviewRequest(id, dto) {
        const req = await this.prisma.taskRequest.findUnique({ where: { id } });
        if (!req)
            throw new common_1.NotFoundException('Task Request not found');
        if (dto.action === 'CONVERT_TO_TASK') {
            const assignedToId = dto.assignedToId || req.requestedById;
            const task = await this.createTask({
                title: req.requestTitle,
                description: req.description || undefined,
                taskType: req.requestType,
                priority: req.priority,
                assignedToId,
                instructions: `Created from Request ${req.requestCode}. ${dto.remarks || ''}`,
            });
            return this.prisma.taskRequest.update({
                where: { id },
                data: {
                    status: 'CONVERTED_TO_TASK',
                    assignedTaskId: task.id,
                    reviewRemarks: dto.remarks || 'Converted to task',
                    reviewedBy: dto.reviewedBy || 'Manager',
                    reviewedAt: new Date(),
                },
            });
        }
        return this.prisma.taskRequest.update({
            where: { id },
            data: {
                status: dto.action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
                reviewRemarks: dto.remarks || null,
                reviewedBy: dto.reviewedBy || 'Manager',
                reviewedAt: new Date(),
            },
        });
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TasksService);
//# sourceMappingURL=tasks.service.js.map