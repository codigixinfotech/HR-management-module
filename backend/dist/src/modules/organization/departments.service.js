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
exports.DepartmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let DepartmentsService = class DepartmentsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    list(companyId, branchId) {
        return this.prisma.department.findMany({
            where: {
                ...(companyId ? { companyId } : {}),
                ...(branchId ? { OR: [{ branchId }, { branchId: null }] } : {}),
            },
            include: { parentDepartment: { select: { id: true, name: true } } },
            orderBy: { name: 'asc' },
        });
    }
    async findById(id) {
        const department = await this.prisma.department.findUnique({
            where: { id },
            include: {
                parentDepartment: { select: { id: true, name: true } },
                childDepartments: true,
            },
        });
        if (!department)
            throw new common_1.NotFoundException('Department not found');
        return department;
    }
    async create(dto) {
        const existing = await this.prisma.department.findFirst({
            where: { companyId: dto.companyId, code: dto.code },
        });
        if (existing)
            throw new common_1.ConflictException('A department with this code already exists for this company');
        return this.prisma.department.create({ data: dto });
    }
    async update(id, dto) {
        await this.findById(id);
        return this.prisma.department.update({ where: { id }, data: dto });
    }
    async remove(id) {
        await this.findById(id);
        await this.prisma.department.delete({ where: { id } });
        return { success: true };
    }
};
exports.DepartmentsService = DepartmentsService;
exports.DepartmentsService = DepartmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DepartmentsService);
//# sourceMappingURL=departments.service.js.map