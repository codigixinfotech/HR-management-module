import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { MarkAttendanceDto, UpdateAttendanceDto } from './dto/attendance.dto';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly listInclude = {
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

  private isUserHrOrAdmin(user?: CurrentUserPayload): boolean {
    if (!user) return true; // fallback if context missing
    if (user.permissions?.includes('*')) return true;
    const isRoleAdmin = user.roles?.some((r) => {
      const u = r.toUpperCase();
      return u.includes('ADMIN') || u.includes('HR');
    });
    const isPrimaryAdmin =
      user.primaryRole?.toUpperCase().includes('ADMIN') ||
      user.primaryRole?.toUpperCase().includes('HR');
    return Boolean(isRoleAdmin || isPrimaryAdmin);
  }

  private computeCheckInMinsInIst(checkInDate: Date): number {
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
    } catch {
      return checkInDate.getHours() * 60 + checkInDate.getMinutes();
    }
  }

  async list(
    employeeId?: string,
    companyId?: string,
    from?: string,
    to?: string,
    user?: CurrentUserPayload,
  ) {
    const isHrOrAdmin = this.isUserHrOrAdmin(user);
    let targetEmployeeId = employeeId;

    if (!isHrOrAdmin) {
      if (user?.employee?.id) {
        targetEmployeeId = user.employee.id;
      } else if (user?.employee?.employeeCode) {
        targetEmployeeId = user.employee.employeeCode;
      } else if (employeeId) {
        targetEmployeeId = employeeId;
      } else {
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

    // Ensure status correctly reflects LATE_ARRIVING if checkIn is after shift start time (09:30 AM IST)
    return records.map((r) => {
      if (r.checkIn) {
        const checkInMins = this.computeCheckInMinsInIst(new Date(r.checkIn));
        let shiftStartMins = 9 * 60 + 30; // 09:30 AM
        const sType = r.shiftType as any;
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

  async listMyAttendance(
    user?: CurrentUserPayload,
    from?: string,
    to?: string,
  ) {
    const empId = user?.employee?.id;

    if (!empId) {
      return [];
    }

    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        employeeId: empId,
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
        let shiftStartMins = 9 * 60 + 30; // 09:30 AM
        const sType = r.shiftType as any;
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

  async getMyAttendanceSummary(user?: CurrentUserPayload) {
    const empId = user?.employee?.id;

    if (!empId) {
      return {
        todayStatus: 'NOT_CHECKED_IN',
        checkInTime: '—',
        checkOutTime: '—',
        totalWorkHours: '—',
        monthlyPresentDays: 0,
        leaveBalanceAllocated: 18,
        leaveBalanceRemaining: 18,
        leaveBalanceDisplay: '0 / 18',
      };
    }

    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    // Fetch today's record strictly for this employee
    const todayRecord = await this.prisma.attendanceRecord.findFirst({
      where: {
        employeeId: empId,
        date: startOfToday,
      },
      include: this.listInclude,
    });

    let todayStatus = 'NOT_CHECKED_IN';
    let checkInTime = '—';
    let checkOutTime = '—';
    let totalWorkHours = '—';

    if (todayRecord) {
      todayStatus = todayRecord.status;
      if (todayRecord.checkIn) {
        const cIn = new Date(todayRecord.checkIn);
        checkInTime = cIn.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        const checkInMins = this.computeCheckInMinsInIst(cIn);
        if (checkInMins > (9 * 60 + 30)) {
          todayStatus = 'LATE_ARRIVING';
        } else {
          todayStatus = 'PRESENT';
        }
      }
      if (todayRecord.checkOut) {
        const cOut = new Date(todayRecord.checkOut);
        checkOutTime = cOut.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      }

      if (todayRecord.checkIn && todayRecord.checkOut) {
        const diffMs = new Date(todayRecord.checkOut).getTime() - new Date(todayRecord.checkIn).getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const hrs = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        totalWorkHours = `${hrs}h ${String(mins).padStart(2, '0')}m`;
      } else if (todayRecord.checkIn) {
        totalWorkHours = 'In Progress';
      }
    }

    // Monthly present days for current month strictly for this employee
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const endOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59));

    const monthlyPresentCount = await this.prisma.attendanceRecord.count({
      where: {
        employeeId: empId,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        status: { in: ['PRESENT', 'HALF_DAY'] },
      },
    });

    // Fetch leave balances for current year
    const currentYear = now.getFullYear();
    const leaveBalances = empId
      ? await this.prisma.leaveBalance.findMany({
          where: { employeeId: empId, year: currentYear },
        })
      : [];

    let totalAllocated = 18;
    let totalUsed = 0;

    if (leaveBalances.length > 0) {
      totalAllocated = leaveBalances.reduce((acc, b) => acc + b.allocated, 0);
      totalUsed = leaveBalances.reduce((acc, b) => acc + b.used, 0);
    }

    const remaining = Math.max(0, totalAllocated - totalUsed);

    return {
      todayStatus,
      checkInTime,
      checkOutTime,
      totalWorkHours,
      monthlyPresentDays: monthlyPresentCount,
      leaveBalanceAllocated: totalAllocated,
      leaveBalanceRemaining: remaining,
      leaveBalanceDisplay: `${remaining} / ${totalAllocated}`,
    };
  }

  async findById(id: string, user?: CurrentUserPayload) {
    const record = await this.prisma.attendanceRecord.findUnique({
      where: { id },
      include: this.listInclude,
    });
    if (!record) throw new NotFoundException('Attendance record not found');

    const isHrOrAdmin = this.isUserHrOrAdmin(user);
    if (!isHrOrAdmin) {
      if (user?.employee?.id && user.employee.id !== record.employeeId) {
        throw new ForbiddenException(
          'Access denied. You can only view your own verification details.',
        );
      }
    }

    if (record.checkIn) {
      const checkInMins = this.computeCheckInMinsInIst(new Date(record.checkIn));
      let shiftStartMins = 9 * 60 + 30;
      const sType = record.shiftType as any;
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

  async mark(dto: MarkAttendanceDto) {
    console.log('[ATTENDANCE MARK RECEIVED]', {
      employeeId: dto.employeeId,
      employeeCode: dto.employeeCode,
      employeeName: dto.employeeName,
      date: dto.date,
      checkIn: dto.checkIn,
      punchType: dto.punchType,
    });

    if (!dto.employeeId && !dto.employeeCode) {
      throw new BadRequestException('employeeId or employeeCode is required');
    }

    let emp: any = null;

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
      throw new BadRequestException(
        `Employee not found in database for ID: "${dto.employeeId || 'N/A'}" or Code: "${dto.employeeCode || 'N/A'}".`
      );
    }

    const validEmployeeId = emp.id;
    const validCompanyId = emp.companyId;

    const rawDate = new Date(dto.date);
    const normalizedDate = new Date(Date.UTC(rawDate.getUTCFullYear(), rawDate.getUTCMonth(), rawDate.getUTCDate()));

    const checkInDate = dto.checkIn ? new Date(dto.checkIn) : new Date();

    // Default shift start time: 09:30 AM (570 minutes)
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

    // Evaluate attendance status: check-in after 09:30 AM IST is LATE_ARRIVING
    const computedStatus: any = checkInTotalMins <= shiftStartTotalMins ? 'PRESENT' : 'LATE_ARRIVING';

    console.log('[ATTENDANCE STATUS EVALUATION]', {
      checkInTime: checkInDate.toISOString(),
      checkInTotalMins,
      shiftStart: `${shiftStartHour}:${shiftStartMin}`,
      shiftStartTotalMins,
      computedStatus,
    });

    // Pass PRESENT to MySQL column to comply with DB ENUM constraint; API layer dynamically returns LATE_ARRIVING
    const dbStatus = (computedStatus === 'LATE_ARRIVING' || computedStatus === 'PRESENT') ? 'PRESENT' : computedStatus;

    const data = {
      companyId: validCompanyId,
      employeeId: validEmployeeId,
      date: normalizedDate,
      status: dbStatus as any,
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

  async update(id: string, dto: UpdateAttendanceDto) {
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
}
