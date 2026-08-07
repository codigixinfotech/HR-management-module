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
exports.EmployeesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
let EmployeesService = class EmployeesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    listInclude = {
        company: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, title: true } },
        reportingManager: { select: { id: true, firstName: true, lastName: true } },
    };
    async list(query, companyId) {
        const { skip, take, page, pageSize } = (0, pagination_dto_1.buildPagination)(query);
        const where = {
            ...(companyId ? { companyId } : {}),
            ...(query.search
                ? {
                    OR: [
                        { firstName: { contains: query.search } },
                        { lastName: { contains: query.search } },
                        { employeeCode: { contains: query.search } },
                        { workEmail: { contains: query.search } },
                    ],
                }
                : {}),
        };
        const [items, total] = await this.prisma.$transaction([
            this.prisma.employee.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: this.listInclude,
            }),
            this.prisma.employee.count({ where }),
        ]);
        return { items, total, page, pageSize };
    }
    async findById(id) {
        const employee = await this.prisma.employee.findUnique({
            where: { id },
            include: {
                ...this.listInclude,
                documents: true,
                onboardingTasks: { orderBy: { createdAt: 'asc' } },
                directReports: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
        });
        if (!employee)
            throw new common_1.NotFoundException('Employee not found');
        return employee;
    }
    async create(dto) {
        const existing = await this.prisma.employee.findFirst({
            where: { companyId: dto.companyId, employeeCode: dto.employeeCode },
        });
        if (existing)
            throw new common_1.ConflictException('An employee with this code already exists for this company');
        return this.prisma.employee.create({
            data: {
                ...dto,
                dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
                dateOfJoining: dto.dateOfJoining
                    ? new Date(dto.dateOfJoining)
                    : undefined,
            },
            include: this.listInclude,
        });
    }
    async update(id, dto) {
        await this.findById(id);
        return this.prisma.employee.update({
            where: { id },
            data: {
                ...dto,
                dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
                dateOfJoining: dto.dateOfJoining
                    ? new Date(dto.dateOfJoining)
                    : undefined,
            },
            include: this.listInclude,
        });
    }
    async remove(id) {
        await this.findById(id);
        await this.prisma.employee.delete({ where: { id } });
        return { success: true };
    }
    async addDocument(employeeId, docType, fileName, filePath) {
        await this.findById(employeeId);
        return this.prisma.employeeDocument.create({
            data: { employeeId, docType, fileName, filePath },
        });
    }
    async listDocuments(employeeId) {
        await this.findById(employeeId);
        return this.prisma.employeeDocument.findMany({
            where: { employeeId },
            orderBy: { uploadedAt: 'desc' },
        });
    }
    async removeDocument(employeeId, documentId) {
        const doc = await this.prisma.employeeDocument.findFirst({
            where: { id: documentId, employeeId },
        });
        if (!doc)
            throw new common_1.NotFoundException('Document not found');
        await this.prisma.employeeDocument.delete({ where: { id: documentId } });
        return { success: true };
    }
};
exports.EmployeesService = EmployeesService;
exports.EmployeesService = EmployeesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EmployeesService);
//# sourceMappingURL=employees.service.js.map