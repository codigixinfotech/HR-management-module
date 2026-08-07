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
exports.LeaveTypesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let LeaveTypesService = class LeaveTypesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    list(companyId) {
        return this.prisma.leaveType.findMany({
            where: companyId ? { companyId } : undefined,
            orderBy: { name: 'asc' },
        });
    }
    async findById(id) {
        const leaveType = await this.prisma.leaveType.findUnique({ where: { id } });
        if (!leaveType)
            throw new common_1.NotFoundException('Leave type not found');
        return leaveType;
    }
    async create(dto) {
        const existing = await this.prisma.leaveType.findFirst({
            where: { companyId: dto.companyId, code: dto.code },
        });
        if (existing)
            throw new common_1.ConflictException('A leave type with this code already exists for this company');
        return this.prisma.leaveType.create({ data: dto });
    }
    async update(id, dto) {
        await this.findById(id);
        return this.prisma.leaveType.update({ where: { id }, data: dto });
    }
    async remove(id) {
        await this.findById(id);
        await this.prisma.leaveType.delete({ where: { id } });
        return { success: true };
    }
};
exports.LeaveTypesService = LeaveTypesService;
exports.LeaveTypesService = LeaveTypesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LeaveTypesService);
//# sourceMappingURL=leave-types.service.js.map