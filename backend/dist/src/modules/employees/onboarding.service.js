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
exports.OnboardingService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let OnboardingService = class OnboardingService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listForEmployee(employeeId) {
        return this.prisma.employeeOnboardingTask.findMany({
            where: { employeeId },
            orderBy: { createdAt: 'asc' },
        });
    }
    async createTask(employeeId, dto) {
        const employee = await this.prisma.employee.findUnique({
            where: { id: employeeId },
        });
        if (!employee)
            throw new common_1.NotFoundException('Employee not found');
        return this.prisma.employeeOnboardingTask.create({
            data: {
                employeeId,
                title: dto.title,
                description: dto.description,
                ownerType: dto.ownerType,
                dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
            },
        });
    }
    async updateStatus(taskId, status) {
        const task = await this.prisma.employeeOnboardingTask.findUnique({
            where: { id: taskId },
        });
        if (!task)
            throw new common_1.NotFoundException('Onboarding task not found');
        return this.prisma.employeeOnboardingTask.update({
            where: { id: taskId },
            data: {
                status,
                completedAt: status === client_1.ApprovalStatus.APPROVED ? new Date() : null,
            },
        });
    }
};
exports.OnboardingService = OnboardingService;
exports.OnboardingService = OnboardingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OnboardingService);
//# sourceMappingURL=onboarding.service.js.map