import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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
    shiftType: { select: { id: true, name: true } },
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

  list(
    employeeId?: string,
    companyId?: string,
    from?: string,
    to?: string,
    user?: CurrentUserPayload,
  ) {
    const isHrOrAdmin = this.isUserHrOrAdmin(user);
    let targetEmployeeId = employeeId;

    if (!isHrOrAdmin) {
      if (!user?.employee?.id) {
        return Promise.resolve([]);
      }
      targetEmployeeId = user.employee.id;
    }

    return this.prisma.attendanceRecord.findMany({
      where: {
        ...(targetEmployeeId ? { employeeId: targetEmployeeId } : {}),
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

  async findById(id: string, user?: CurrentUserPayload) {
    const record = await this.prisma.attendanceRecord.findUnique({
      where: { id },
      include: this.listInclude,
    });
    if (!record) throw new NotFoundException('Attendance record not found');

    const isHrOrAdmin = this.isUserHrOrAdmin(user);
    if (!isHrOrAdmin) {
      if (user?.employee?.id !== record.employeeId) {
        throw new ForbiddenException(
          'Access denied. You can only view your own verification details.',
        );
      }
    }

    return record;
  }

  mark(dto: MarkAttendanceDto) {
    const date = new Date(dto.date);
    const data = {
      companyId: dto.companyId,
      employeeId: dto.employeeId,
      date,
      status: dto.status,
      checkIn: dto.checkIn ? new Date(dto.checkIn) : undefined,
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

    return this.prisma.attendanceRecord.upsert({
      where: { employeeId_date: { employeeId: dto.employeeId, date } },
      update: data,
      create: data,
      include: this.listInclude,
    });
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
