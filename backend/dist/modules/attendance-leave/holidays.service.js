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
exports.HolidaysService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let HolidaysService = class HolidaysService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    list(companyId, year) {
        return this.prisma.holiday.findMany({
            where: {
                ...(companyId ? { companyId } : {}),
                ...(year
                    ? {
                        date: {
                            gte: new Date(`${year}-01-01`),
                            lt: new Date(`${year + 1}-01-01`),
                        },
                    }
                    : {}),
            },
            orderBy: { date: 'asc' },
        });
    }
    async findById(id) {
        const holiday = await this.prisma.holiday.findUnique({ where: { id } });
        if (!holiday)
            throw new common_1.NotFoundException('Holiday not found');
        return holiday;
    }
    create(dto) {
        return this.prisma.holiday.create({
            data: { ...dto, date: new Date(dto.date) },
        });
    }
    async update(id, dto) {
        await this.findById(id);
        return this.prisma.holiday.update({
            where: { id },
            data: { ...dto, date: dto.date ? new Date(dto.date) : undefined },
        });
    }
    async remove(id) {
        await this.findById(id);
        await this.prisma.holiday.delete({ where: { id } });
        return { success: true };
    }
};
exports.HolidaysService = HolidaysService;
exports.HolidaysService = HolidaysService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HolidaysService);
//# sourceMappingURL=holidays.service.js.map