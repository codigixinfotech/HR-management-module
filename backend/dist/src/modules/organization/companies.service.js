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
exports.CompaniesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let CompaniesService = class CompaniesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    list() {
        return this.prisma.company.findMany({ orderBy: { name: 'asc' } });
    }
    async findById(id) {
        const company = await this.prisma.company.findUnique({ where: { id } });
        if (!company)
            throw new common_1.NotFoundException('Company not found');
        return company;
    }
    async create(dto) {
        const existing = await this.prisma.company.findUnique({
            where: { code: dto.code },
        });
        if (existing)
            throw new common_1.ConflictException('A company with this code already exists');
        return this.prisma.company.create({ data: dto });
    }
    async update(id, dto) {
        await this.findById(id);
        return this.prisma.company.update({ where: { id }, data: dto });
    }
    async remove(id) {
        await this.findById(id);
        const employeeCount = await this.prisma.employee.count({
            where: { companyId: id },
        });
        if (employeeCount > 0) {
            throw new common_1.BadRequestException(`Cannot delete corporate entity because ${employeeCount} employee(s) are assigned to it. Please reassign or remove employees first.`);
        }
        try {
            await this.prisma.company.updateMany({
                where: { parentCompanyId: id },
                data: { parentCompanyId: null },
            });
            await this.prisma.location.deleteMany({
                where: { branch: { companyId: id } },
            });
            await this.prisma.branch.deleteMany({
                where: { companyId: id },
            });
            await this.prisma.department.deleteMany({
                where: { companyId: id },
            });
            await this.prisma.designation.deleteMany({
                where: { companyId: id },
            });
            await this.prisma.costCenter.deleteMany({
                where: { companyId: id },
            });
            await this.prisma.payGrade.deleteMany({
                where: { companyId: id },
            });
            await this.prisma.hrPolicy.deleteMany({
                where: { companyId: id },
            });
            await this.prisma.company.delete({
                where: { id },
            });
            return { success: true };
        }
        catch (err) {
            throw new common_1.BadRequestException(err?.message ?? 'Failed to delete corporate entity due to associated record constraints.');
        }
    }
};
exports.CompaniesService = CompaniesService;
exports.CompaniesService = CompaniesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CompaniesService);
//# sourceMappingURL=companies.service.js.map