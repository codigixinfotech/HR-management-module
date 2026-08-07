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
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let AttendanceService = class AttendanceService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    listInclude = {
        employee: {
            select: { id: true, firstName: true, lastName: true, employeeCode: true },
        },
        shiftType: { select: { id: true, name: true } },
    };
    list(employeeId, companyId, from, to) {
        return this.prisma.attendanceRecord.findMany({
            where: {
                ...(employeeId ? { employeeId } : {}),
                ...(companyId ? { companyId } : {}),
                ...(from || to
                    ? {
                        date: {
                            ...(from ? { gte: new Date(from) } : {}),
                            ...(to ? { lte: new Date(to) } : {}),
                        },
                    }
                    : {}),
            },
            include: this.listInclude,
            orderBy: { date: 'desc' },
        });
    }
    async findById(id) {
        const record = await this.prisma.attendanceRecord.findUnique({
            where: { id },
            include: this.listInclude,
        });
        if (!record)
            throw new common_1.NotFoundException('Attendance record not found');
        return record;
    }
    mark(dto) {
        const date = new Date(dto.date);
        const data = {
            companyId: dto.companyId,
            employeeId: dto.employeeId,
            date,
            status: dto.status,
            checkIn: dto.checkIn ? new Date(dto.checkIn) : undefined,
            checkOut: dto.checkOut ? new Date(dto.checkOut) : undefined,
            remarks: dto.remarks,
        };
        return this.prisma.attendanceRecord.upsert({
            where: { employeeId_date: { employeeId: dto.employeeId, date } },
            update: data,
            create: data,
            include: this.listInclude,
        });
    }
    async update(id, dto) {
        await this.findById(id);
        return this.prisma.attendanceRecord.update({
            where: { id },
            data: {
                ...dto,
                date: dto.date ? new Date(dto.date) : undefined,
                checkIn: dto.checkIn ? new Date(dto.checkIn) : undefined,
                checkOut: dto.checkOut ? new Date(dto.checkOut) : undefined,
            },
            include: this.listInclude,
        });
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map