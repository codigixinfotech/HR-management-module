import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AllocateLeaveBalanceDto } from './dto/leave-balance.dto';

@Injectable()
export class LeaveBalancesService {
  constructor(private readonly prisma: PrismaService) {}

  list(employeeId?: string, year?: number) {
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

  listMy(user?: any, year?: number) {
    const empId = user?.employee?.id;
    if (!empId) return [];

    return this.prisma.leaveBalance.findMany({
      where: {
        employeeId: empId,
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

  allocate(dto: AllocateLeaveBalanceDto) {
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

  async adjustUsed(
    employeeId: string,
    leaveTypeId: string,
    year: number,
    deltaDays: number,
  ) {
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
}
