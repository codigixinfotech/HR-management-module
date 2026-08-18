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
exports.CostCentersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let CostCentersService = class CostCentersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(companyId) {
        return this.prisma.costCenter.findMany({
            where: companyId ? { companyId } : undefined,
            include: {
                branch: { select: { id: true, name: true } },
                department: { select: { id: true, name: true } },
            },
            orderBy: { code: 'asc' },
        });
    }
    async findOne(id) {
        const cc = await this.prisma.costCenter.findUnique({
            where: { id },
            include: {
                branch: { select: { id: true, name: true } },
                department: { select: { id: true, name: true } },
            },
        });
        if (!cc)
            throw new common_1.NotFoundException(`Cost Center ${id} not found`);
        return cc;
    }
    async create(dto) {
        return this.prisma.costCenter.create({
            data: {
                companyId: dto.companyId,
                code: dto.code,
                name: dto.name,
                type: dto.type ?? 'Department',
                branchId: dto.branchId || null,
                departmentId: dto.departmentId || null,
                managerId: dto.managerId || null,
                managerName: dto.managerName || null,
                budget: dto.budget ?? 0,
                headcountCapacity: dto.headcountCapacity ?? 0,
                effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date(),
                description: dto.description || null,
                isActive: dto.isActive ?? true,
            },
        });
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.costCenter.update({
            where: { id },
            data: {
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.type !== undefined && { type: dto.type }),
                ...(dto.branchId !== undefined && { branchId: dto.branchId || null }),
                ...(dto.departmentId !== undefined && { departmentId: dto.departmentId || null }),
                ...(dto.managerId !== undefined && { managerId: dto.managerId || null }),
                ...(dto.managerName !== undefined && { managerName: dto.managerName || null }),
                ...(dto.budget !== undefined && { budget: dto.budget }),
                ...(dto.headcountCapacity !== undefined && { headcountCapacity: dto.headcountCapacity }),
                ...(dto.effectiveFrom !== undefined && { effectiveFrom: new Date(dto.effectiveFrom) }),
                ...(dto.description !== undefined && { description: dto.description || null }),
                ...(dto.isActive !== undefined && { isActive: dto.isActive }),
            },
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.costCenter.delete({ where: { id } });
    }
};
exports.CostCentersService = CostCentersService;
exports.CostCentersService = CostCentersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CostCentersService);
//# sourceMappingURL=cost-centers.service.js.map