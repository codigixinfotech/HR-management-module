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
exports.JobOpeningsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let JobOpeningsService = class JobOpeningsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    list(companyId) {
        return this.prisma.jobOpening.findMany({
            where: companyId ? { companyId } : undefined,
            include: {
                department: { select: { id: true, name: true } },
                designation: { select: { id: true, title: true } },
                _count: { select: { candidates: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findById(id) {
        const opening = await this.prisma.jobOpening.findUnique({
            where: { id },
            include: {
                department: { select: { id: true, name: true } },
                designation: { select: { id: true, title: true } },
                candidates: { orderBy: { createdAt: 'desc' } },
            },
        });
        if (!opening)
            throw new common_1.NotFoundException('Job opening not found');
        return opening;
    }
    create(dto) {
        return this.prisma.jobOpening.create({ data: dto });
    }
    async update(id, dto) {
        await this.findById(id);
        return this.prisma.jobOpening.update({ where: { id }, data: dto });
    }
    async remove(id) {
        await this.findById(id);
        await this.prisma.jobOpening.delete({ where: { id } });
        return { success: true };
    }
};
exports.JobOpeningsService = JobOpeningsService;
exports.JobOpeningsService = JobOpeningsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], JobOpeningsService);
//# sourceMappingURL=job-openings.service.js.map