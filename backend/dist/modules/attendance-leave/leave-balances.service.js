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
exports.LeaveBalancesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let LeaveBalancesService = class LeaveBalancesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    list(employeeId, year) {
        return this.prisma.leaveBalance.findMany({
            where: {
                ...(employeeId ? { employeeId } : {}),
                ...(year ? { year } : {}),
            },
            include: {
                leaveType: {
                    select: { id: true, name: true, code: true, isPaid: true },
                },
            },
            orderBy: { year: 'desc' },
        });
    }
    allocate(dto) {
        return this.prisma.leaveBalance.upsert({
            where: {
                employeeId_leaveTypeId_year: {
                    employeeId: dto.employeeId,
                    leaveTypeId: dto.leaveTypeId,
                    year: dto.year,
                },
            },
            update: { allocated: dto.allocated },
            create: {
                employeeId: dto.employeeId,
                leaveTypeId: dto.leaveTypeId,
                year: dto.year,
                allocated: dto.allocated,
            },
        });
    }
    async adjustUsed(employeeId, leaveTypeId, year, deltaDays) {
        await this.prisma.leaveBalance.upsert({
            where: { employeeId_leaveTypeId_year: { employeeId, leaveTypeId, year } },
            update: { used: { increment: deltaDays } },
            create: {
                employeeId,
                leaveTypeId,
                year,
                allocated: 0,
                used: Math.max(deltaDays, 0),
            },
        });
    }
};
exports.LeaveBalancesService = LeaveBalancesService;
exports.LeaveBalancesService = LeaveBalancesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LeaveBalancesService);
//# sourceMappingURL=leave-balances.service.js.map