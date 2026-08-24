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
exports.PayGradesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let PayGradesService = class PayGradesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(companyId) {
        return this.prisma.payGrade.findMany({
            where: companyId ? { companyId } : undefined,
            include: {
                department: { select: { id: true, name: true } },
            },
            orderBy: { level: 'asc' },
        });
    }
    async findOne(id) {
        const grade = await this.prisma.payGrade.findUnique({
            where: { id },
            include: {
                department: { select: { id: true, name: true } },
            },
        });
        if (!grade)
            throw new common_1.NotFoundException(`Pay Grade ${id} not found`);
        return grade;
    }
    async create(dto) {
        const existing = await this.prisma.payGrade.findUnique({
            where: { gradeCode: dto.gradeCode },
        });
        if (existing) {
            throw new common_1.ConflictException(`Job Grade code '${dto.gradeCode}' already exists.`);
        }
        return this.prisma.payGrade.create({
            data: {
                companyId: dto.companyId,
                businessUnit: dto.businessUnit || null,
                gradeCode: dto.gradeCode,
                gradeName: dto.gradeName,
                level: dto.level ?? 'L1',
                category: dto.category ?? 'Professional',
                jobFamily: dto.jobFamily || null,
                departmentId: dto.departmentId || null,
                minSalary: dto.minSalary ?? 0,
                maxSalary: dto.maxSalary ?? 0,
                currency: dto.currency ?? 'INR',
                effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date(),
                description: dto.description || null,
                isActive: dto.isActive ?? true,
            },
        });
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.payGrade.update({
            where: { id },
            data: {
                ...(dto.businessUnit !== undefined && { businessUnit: dto.businessUnit || null }),
                ...(dto.gradeName !== undefined && { gradeName: dto.gradeName }),
                ...(dto.level !== undefined && { level: dto.level }),
                ...(dto.category !== undefined && { category: dto.category }),
                ...(dto.jobFamily !== undefined && { jobFamily: dto.jobFamily || null }),
                ...(dto.departmentId !== undefined && { departmentId: dto.departmentId || null }),
                ...(dto.minSalary !== undefined && { minSalary: dto.minSalary }),
                ...(dto.maxSalary !== undefined && { maxSalary: dto.maxSalary }),
                ...(dto.currency !== undefined && { currency: dto.currency }),
                ...(dto.effectiveFrom !== undefined && { effectiveFrom: new Date(dto.effectiveFrom) }),
                ...(dto.description !== undefined && { description: dto.description || null }),
                ...(dto.isActive !== undefined && { isActive: dto.isActive }),
            },
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.payGrade.delete({ where: { id } });
    }
};
exports.PayGradesService = PayGradesService;
exports.PayGradesService = PayGradesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PayGradesService);
//# sourceMappingURL=pay-grades.service.js.map