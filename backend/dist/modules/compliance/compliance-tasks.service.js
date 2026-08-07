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
exports.ComplianceTasksService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
let ComplianceTasksService = class ComplianceTasksService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    listInclude = {
        complianceType: {
            select: {
                id: true,
                name: true,
                code: true,
                category: true,
                frequency: true,
            },
        },
        filedBy: { select: { id: true, firstName: true, lastName: true } },
    };
    async list(query, companyId, status) {
        const { skip, take, page, pageSize } = (0, pagination_dto_1.buildPagination)(query);
        const where = {
            ...(companyId ? { companyId } : {}),
            ...(status ? { status } : {}),
        };
        const [items, total] = await this.prisma.$transaction([
            this.prisma.complianceTask.findMany({
                where,
                skip,
                take,
                orderBy: { dueDate: 'asc' },
                include: this.listInclude,
            }),
            this.prisma.complianceTask.count({ where }),
        ]);
        return { items, total, page, pageSize };
    }
    async findById(id) {
        const task = await this.prisma.complianceTask.findUnique({
            where: { id },
            include: this.listInclude,
        });
        if (!task)
            throw new common_1.NotFoundException('Compliance task not found');
        return task;
    }
    create(dto) {
        return this.prisma.complianceTask.create({
            data: { ...dto, dueDate: new Date(dto.dueDate) },
            include: this.listInclude,
        });
    }
    async updateStatus(id, dto) {
        await this.findById(id);
        return this.prisma.complianceTask.update({
            where: { id },
            data: {
                status: dto.status,
                remarks: dto.remarks,
                filedById: dto.filedById,
                filedDate: dto.status === client_1.ComplianceStatus.FILED
                    ? new Date(dto.filedDate ?? Date.now())
                    : dto.filedDate
                        ? new Date(dto.filedDate)
                        : undefined,
            },
            include: this.listInclude,
        });
    }
    async remove(id) {
        await this.findById(id);
        await this.prisma.complianceTask.delete({ where: { id } });
        return { success: true };
    }
};
exports.ComplianceTasksService = ComplianceTasksService;
exports.ComplianceTasksService = ComplianceTasksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ComplianceTasksService);
//# sourceMappingURL=compliance-tasks.service.js.map