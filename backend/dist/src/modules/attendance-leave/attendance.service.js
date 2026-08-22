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
            select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeCode: true,
                facePhoto: true,
                faceTemplate: true,
                department: { select: { id: true, name: true } },
            },
        },
        shiftType: { select: { id: true, name: true, startTime: true, endTime: true } },
    };
    isUserHrOrAdmin(user) {
        if (!user)
            return true;
        if (user.permissions?.includes('*'))
            return true;
        const isRoleAdmin = user.roles?.some((r) => {
            const u = r.toUpperCase();
            return u.includes('ADMIN') || u.includes('HR');
        });
        const isPrimaryAdmin = user.primaryRole?.toUpperCase().includes('ADMIN') ||
            user.primaryRole?.toUpperCase().includes('HR');
        return Boolean(isRoleAdmin || isPrimaryAdmin);
    }
    computeCheckInMinsInIst(checkInDate) {
        try {
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: 'Asia/Kolkata',
                hour: 'numeric',
                minute: 'numeric',
                hour12: false,
            });
            const parts = formatter.formatToParts(checkInDate);
            const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
            const min = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
            return hour * 60 + min;
        }
        catch {
            return checkInDate.getHours() * 60 + checkInDate.getMinutes();
        }
    }
    async list(employeeId, companyId, from, to, user) {
        const isHrOrAdmin = this.isUserHrOrAdmin(user);
        let targetEmployeeId = employeeId;
        if (!isHrOrAdmin) {
            if (user?.employee?.id) {
                targetEmployeeId = user.employee.id;
            }
            else if (user?.employee?.employeeCode) {
                targetEmployeeId = user.employee.employeeCode;
            }
            else if (employeeId) {
                targetEmployeeId = employeeId;
            }
            else {
                targetEmployeeId = undefined;
            }
        }
        const records = await this.prisma.attendanceRecord.findMany({
            where: {
                ...(targetEmployeeId
                    ? {
                        OR: [
                            { employeeId: targetEmployeeId },
                            { employee: { employeeCode: targetEmployeeId } },
                        ],
                    }
                    : {}),
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
        return records.map((r) => {
            if (r.checkIn) {
                const checkInMins = this.computeCheckInMinsInIst(new Date(r.checkIn));
                let shiftStartMins = 9 * 60 + 30;
                const sType = r.shiftType;
                if (sType?.startTime) {
                    const parts = sType.startTime.split(':');
                    shiftStartMins = (parseInt(parts[0], 10) || 9) * 60 + (parseInt(parts[1], 10) || 30);
                }
                if (checkInMins > shiftStartMins) {
                    return { ...r, status: 'LATE_ARRIVING' };
                }
            }
            return r;
        });
    }
    async findById(id, user) {
        const record = await this.prisma.attendanceRecord.findUnique({
            where: { id },
            include: this.listInclude,
        });
        if (!record)
            throw new common_1.NotFoundException('Attendance record not found');
        const isHrOrAdmin = this.isUserHrOrAdmin(user);
        if (!isHrOrAdmin) {
            if (user?.employee?.id && user.employee.id !== record.employeeId) {
                throw new common_1.ForbiddenException('Access denied. You can only view your own verification details.');
            }
        }
        if (record.checkIn) {
            const checkInMins = this.computeCheckInMinsInIst(new Date(record.checkIn));
            let shiftStartMins = 9 * 60 + 30;
            const sType = record.shiftType;
            if (sType?.startTime) {
                const parts = sType.startTime.split(':');
                shiftStartMins = (parseInt(parts[0], 10) || 9) * 60 + (parseInt(parts[1], 10) || 30);
            }
            if (checkInMins > shiftStartMins) {
                return { ...record, status: 'LATE_ARRIVING' };
            }
        }
        return record;
    }
    async mark(dto) {
        console.log('[ATTENDANCE MARK RECEIVED]', {
            employeeId: dto.employeeId,
            employeeCode: dto.employeeCode,
            employeeName: dto.employeeName,
            date: dto.date,
            checkIn: dto.checkIn,
            punchType: dto.punchType,
        });
        if (!dto.employeeId && !dto.employeeCode) {
            throw new common_1.BadRequestException('employeeId or employeeCode is required');
        }
        let emp = null;
        if (dto.employeeId) {
            emp = await this.prisma.employee.findUnique({
                where: { id: dto.employeeId },
            });
        }
        if (!emp && dto.employeeCode) {
            emp = await this.prisma.employee.findFirst({
                where: { employeeCode: dto.employeeCode },
            });
        }
        if (!emp) {
            console.warn('[ATTENDANCE ERROR] Employee not found for ID:', dto.employeeId, 'Code:', dto.employeeCode);
            throw new common_1.BadRequestException(`Employee not found in database for ID: "${dto.employeeId || 'N/A'}" or Code: "${dto.employeeCode || 'N/A'}".`);
        }
        const validEmployeeId = emp.id;
        const validCompanyId = emp.companyId;
        const rawDate = new Date(dto.date);
        const normalizedDate = new Date(Date.UTC(rawDate.getUTCFullYear(), rawDate.getUTCMonth(), rawDate.getUTCDate()));
        const checkInDate = dto.checkIn ? new Date(dto.checkIn) : new Date();
        let shiftStartHour = 9;
        let shiftStartMin = 30;
        if (emp?.shift) {
            const shiftParts = emp.shift.split(':');
            if (shiftParts.length >= 2) {
                shiftStartHour = parseInt(shiftParts[0], 10) || 9;
                shiftStartMin = parseInt(shiftParts[1], 10) || 30;
            }
        }
        const checkInTotalMins = this.computeCheckInMinsInIst(checkInDate);
        const shiftStartTotalMins = shiftStartHour * 60 + shiftStartMin;
        const computedStatus = checkInTotalMins <= shiftStartTotalMins ? 'PRESENT' : 'LATE_ARRIVING';
        console.log('[ATTENDANCE STATUS EVALUATION]', {
            checkInTime: checkInDate.toISOString(),
            checkInTotalMins,
            shiftStart: `${shiftStartHour}:${shiftStartMin}`,
            shiftStartTotalMins,
            computedStatus,
        });
        const dbStatus = (computedStatus === 'LATE_ARRIVING' || computedStatus === 'PRESENT') ? 'PRESENT' : computedStatus;
        const data = {
            companyId: validCompanyId,
            employeeId: validEmployeeId,
            date: normalizedDate,
            status: dbStatus,
            checkIn: checkInDate,
            checkOut: dto.checkOut ? new Date(dto.checkOut) : undefined,
            remarks: dto.remarks,
            faceVerificationStatus: dto.faceVerificationStatus,
            faceMatchScore: dto.faceMatchScore,
            ipAddress: dto.ipAddress,
            ipVerificationStatus: dto.ipVerificationStatus,
            latitude: dto.latitude,
            longitude: dto.longitude,
            locationVerificationStatus: dto.locationVerificationStatus,
            deviceType: dto.deviceType,
            capturedFacePhoto: dto.capturedFacePhoto,
            officeLocation: dto.officeLocation,
            distanceMeters: dto.distanceMeters,
            allowedRadiusMeters: dto.allowedRadiusMeters,
            verificationMethod: dto.verificationMethod,
            failureReason: dto.failureReason,
            punchType: dto.punchType,
        };
        const savedRecord = await this.prisma.attendanceRecord.upsert({
            where: { employeeId_date: { employeeId: validEmployeeId, date: normalizedDate } },
            update: data,
            create: data,
            include: this.listInclude,
        });
        console.log('[ATTENDANCE SAVED]', {
            id: savedRecord.id,
            employeeId: savedRecord.employeeId,
            companyId: savedRecord.companyId,
            employeeCode: savedRecord.employee?.employeeCode,
            employeeName: `${savedRecord.employee?.firstName} ${savedRecord.employee?.lastName}`,
            date: savedRecord.date,
            checkIn: savedRecord.checkIn,
            computedStatus,
        });
        return { ...savedRecord, status: computedStatus };
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