import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { MarkAttendanceDto, UpdateAttendanceDto } from './dto/attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly listInclude = {
    employee: {
      select: { id: true, firstName: true, lastName: true, employeeCode: true },
    },
    shiftType: { select: { id: true, name: true } },
  };

  list(employeeId?: string, companyId?: string, from?: string, to?: string) {
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

  async findById(id: string) {
    const record = await this.prisma.attendanceRecord.findUnique({
      where: { id },
      include: this.listInclude,
    });
    if (!record) throw new NotFoundException('Attendance record not found');
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
