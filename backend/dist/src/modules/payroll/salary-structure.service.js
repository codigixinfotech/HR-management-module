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
exports.SalaryStructureService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let SalaryStructureService = class SalaryStructureService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    listInclude = {
        salaryComponent: {
            select: {
                id: true,
                code: true,
                name: true,
                type: true,
                isStatutory: true,
            },
        },
    };
    list(employeeId) {
        return this.prisma.employeeSalaryComponent.findMany({
            where: { employeeId },
            include: this.listInclude,
            orderBy: { createdAt: 'asc' },
        });
    }
    assign(dto) {
        return this.prisma.employeeSalaryComponent.upsert({
            where: {
                employeeId_salaryComponentId: {
                    employeeId: dto.employeeId,
                    salaryComponentId: dto.salaryComponentId,
                },
            },
            update: {
                monthlyAmount: dto.monthlyAmount,
                effectiveFrom: new Date(dto.effectiveFrom),
            },
            create: {
                employeeId: dto.employeeId,
                salaryComponentId: dto.salaryComponentId,
                monthlyAmount: dto.monthlyAmount,
                effectiveFrom: new Date(dto.effectiveFrom),
            },
            include: this.listInclude,
        });
    }
    async remove(id) {
        const existing = await this.prisma.employeeSalaryComponent.findUnique({
            where: { id },
        });
        if (!existing)
            throw new common_1.NotFoundException('Salary structure entry not found');
        await this.prisma.employeeSalaryComponent.delete({ where: { id } });
        return { success: true };
    }
};
exports.SalaryStructureService = SalaryStructureService;
exports.SalaryStructureService = SalaryStructureService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SalaryStructureService);
//# sourceMappingURL=salary-structure.service.js.map