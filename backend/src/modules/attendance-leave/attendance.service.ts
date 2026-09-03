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

  private computeBackendBiometricSimilarity(descA: number[], descB: number[]): number {
    if (!descA || !descB || descA.length !== 128 || descB.length !== 128) return 0;
    let dotProduct = 0;
    let normASq = 0;
    let normBSq = 0;

    for (let i = 0; i < 128; i++) {
      const a = descA[i];
      const b = descB[i];
      if (typeof a !== 'number' || typeof b !== 'number' || !isFinite(a) || !isFinite(b)) return 0;
      dotProduct += a * b;
      normASq += a * a;
      normBSq += b * b;
    }

    const denominator = Math.sqrt(normASq) * Math.sqrt(normBSq);
    if (denominator === 0) return 0;

    const cosineSim = dotProduct / denominator;
    return parseFloat(Math.max(0, Math.min(100, cosineSim * 100)).toFixed(1));
  }

  private validate128dVector(vec: any): number[] | null {
    if (!vec) return null;
    let arr = vec;
    if (typeof vec === 'string') {
      try {
        arr = JSON.parse(vec);
      } catch {
        return null;
      }
    }
    if (!Array.isArray(arr) || arr.length !== 128) return null;
    if (arr.some((v) => typeof v !== 'number' || !isFinite(v))) return null;
    return arr;
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

    // SECURITY RULE: Independent Backend Biometric Verification & Vector Re-Validation
    if (dto.verificationMethod === 'Biometric Face ID' || dto.faceVerificationStatus) {
      if (dto.faceVerificationStatus !== 'VERIFIED') {
        throw new BadRequestException(
          `Attendance punch rejected: Biometric face verification failed (${dto.faceVerificationStatus || 'UNVERIFIED'}).`
        );
      }

      // 1. Validate Enrolled Reference Face Template for Employee
      const enrolledVector = this.validate128dVector(emp.faceTemplate);
      if (!enrolledVector) {
        throw new BadRequestException(
          `Attendance punch rejected: Employee "${emp.firstName} ${emp.lastName}" has no valid enrolled 128-D face template.`
        );
      }

      // 2. Parse & Validate Captured Live Face Descriptor
      const liveVector = this.validate128dVector(dto.liveFaceDescriptor);
      if (!liveVector) {
        throw new BadRequestException(
          `Attendance punch rejected: Captured live face descriptor is missing or invalid.`
        );
      }

      // 3. Independent Backend 128-D Cosine Similarity Calculation
      const realSimilarity = this.computeBackendBiometricSimilarity(liveVector, enrolledVector);
      console.log(`[BACKEND BIOMETRIC VERIFICATION] Employee: ${emp.firstName} ${emp.lastName} (${emp.id}) | Real Score: ${realSimilarity}%`);

      const BACKEND_THRESHOLD = 70.0;
      if (realSimilarity < BACKEND_THRESHOLD) {
        throw new BadRequestException(
          `Attendance punch rejected: Backend biometric verification failed (Score: ${realSimilarity}%, Cutoff: ${BACKEND_THRESHOLD}%).`
        );
      }

      // Store real calculated score in DTO
      dto.faceMatchScore = realSimilarity;
    }

    const validEmployeeId = emp.id;
    const validCompanyId = emp.companyId;

    const rawDate = new Date(dto.date);
    const normalizedDate = new Date(Date.UTC(rawDate.getUTCFullYear(), rawDate.getUTCMonth(), rawDate.getUTCDate()));

    const startOfDay = new Date(Date.UTC(rawDate.getUTCFullYear(), rawDate.getUTCMonth(), rawDate.getUTCDate(), 0, 0, 0));
    const endOfDay = new Date(Date.UTC(rawDate.getUTCFullYear(), rawDate.getUTCMonth(), rawDate.getUTCDate(), 23, 59, 59));

    // Find today's existing attendance record for this employee
    const existingRecord = await this.prisma.attendanceRecord.findFirst({
      where: {
        employeeId: validEmployeeId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // 1. Explicitly separate Check-In and Check-Out timestamps
    let checkInDate: Date;
    let checkOutDate: Date | null = null;

    if (dto.punchType === 'CHECK_OUT') {
      // On Check-Out: Preserve original Check-In timestamp and reject if no Check-In exists
      const existingCheckIn = existingRecord?.checkIn || (dto.checkIn ? new Date(dto.checkIn) : null);
      if (!existingCheckIn) {
        throw new BadRequestException(
          `Cannot Check-Out for "${emp.firstName} ${emp.lastName}": No existing Check-In record found for today (${dto.date}). Please complete Check-In first.`
        );
      }
      checkInDate = new Date(existingCheckIn);
      checkOutDate = dto.checkOut ? new Date(dto.checkOut) : new Date();

      if (checkOutDate.getTime() < checkInDate.getTime()) {
        throw new BadRequestException(
          `Invalid Check-Out time: Check-Out timestamp (${checkOutDate.toLocaleTimeString()}) cannot be earlier than Check-In timestamp (${checkInDate.toLocaleTimeString()}).`
        );
      }
    } else {
      // On Check-In: Set new Check-In timestamp; keep Check-Out null
      checkInDate = dto.checkIn ? new Date(dto.checkIn) : new Date();
      checkOutDate = dto.checkOut
        ? new Date(dto.checkOut)
        : existingRecord?.checkOut
        ? new Date(existingRecord.checkOut)
        : null;
    }

    let workedMinutes: number | undefined = undefined;
    if (checkInDate && checkOutDate) {
      workedMinutes = Math.max(0, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / 60000));
    }

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
      punchType: dto.punchType,
      checkInTime: checkInDate.toISOString(),
      checkOutTime: checkOutDate ? checkOutDate.toISOString() : 'NULL',
      workedMinutes,
      computedStatus,
    });

    // Pass PRESENT to MySQL column to comply with DB ENUM constraint; API layer dynamically returns LATE_ARRIVING
    const dbStatus = (computedStatus === 'LATE_ARRIVING' || computedStatus === 'PRESENT') ? 'PRESENT' : computedStatus;

    const data: any = {
      companyId: validCompanyId,
      employeeId: validEmployeeId,
      date: existingRecord?.date || normalizedDate,
      status: dbStatus as any,
      checkIn: checkInDate,
      checkOut: checkOutDate || undefined,
      workedMinutes: workedMinutes ?? undefined,
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
      punchType: dto.punchType || (checkOutDate ? 'CHECK_OUT' : 'CHECK_IN'),
    };

    let savedRecord: any;
    if (existingRecord) {
      savedRecord = await this.prisma.attendanceRecord.update({
        where: { id: existingRecord.id },
        data,
        include: this.listInclude,
      });
    } else {
      savedRecord = await this.prisma.attendanceRecord.create({
        data,
        include: this.listInclude,
      });
    }

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
