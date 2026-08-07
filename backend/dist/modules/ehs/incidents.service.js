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
exports.IncidentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let IncidentsService = class IncidentsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    listInclude = {
        reportedBy: { select: { id: true, firstName: true, lastName: true } },
    };
    list(companyId) {
        return this.prisma.safetyIncident.findMany({
            where: companyId ? { companyId } : undefined,
            include: this.listInclude,
            orderBy: { occurredAt: 'desc' },
        });
    }
    async findById(id) {
        const incident = await this.prisma.safetyIncident.findUnique({ where: { id }, include: this.listInclude });
        if (!incident)
            throw new common_1.NotFoundException('Safety incident not found');
        return incident;
    }
    create(dto) {
        return this.prisma.safetyIncident.create({
            data: { ...dto, occurredAt: new Date(dto.occurredAt) },
            include: this.listInclude,
        });
    }
    async updateStatus(id, dto) {
        await this.findById(id);
        return this.prisma.safetyIncident.update({
            where: { id },
            data: dto,
            include: this.listInclude,
        });
    }
};
exports.IncidentsService = IncidentsService;
exports.IncidentsService = IncidentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], IncidentsService);
//# sourceMappingURL=incidents.service.js.map