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
exports.ShiftTypesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let ShiftTypesService = class ShiftTypesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    list(companyId) {
        return this.prisma.shiftType.findMany({
            where: companyId ? { companyId } : undefined,
            orderBy: { name: 'asc' },
        });
    }
    async findById(id) {
        const shiftType = await this.prisma.shiftType.findUnique({ where: { id } });
        if (!shiftType)
            throw new common_1.NotFoundException('Shift type not found');
        return shiftType;
    }
    async create(dto) {
        const existing = await this.prisma.shiftType.findFirst({
            where: { companyId: dto.companyId, code: dto.code },
        });
        if (existing)
            throw new common_1.ConflictException('A shift type with this code already exists for this company');
        return this.prisma.shiftType.create({ data: dto });
    }
    async update(id, dto) {
        await this.findById(id);
        return this.prisma.shiftType.update({ where: { id }, data: dto });
    }
    async remove(id) {
        await this.findById(id);
        await this.prisma.shiftType.delete({ where: { id } });
        return { success: true };
    }
};
exports.ShiftTypesService = ShiftTypesService;
exports.ShiftTypesService = ShiftTypesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ShiftTypesService);
//# sourceMappingURL=shift-types.service.js.map