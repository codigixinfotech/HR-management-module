import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AllocateLeaveBalanceDto } from './dto/leave-balance.dto';
import { isUserSuperAdmin } from '../../common/utils/tenant-context.util';

@Injectable()
export class LeaveBalancesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(employeeId?: string, year?: number, companyId?: string) {
    const currentYear = year || new Date().getFullYear();
    const balances = await this.prisma.leaveBalance.findMany({
      where: {
        ...(companyId ? { employee: { companyId } } : {}),
        ...(employeeId ? { employeeId } : {}),
        year: currentYear,
      },
      include: {
        leaveType: {
          select: { id: true, name: true, code: true, isPaid: true, annualQuota: true },
        },
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            companyId: true,
            department: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { year: 'desc' },
    });

    // Also get all pending leave requests for this year to show pending balances
    const pendingRequests = await this.prisma.leaveRequest.findMany({
      where: {
        status: 'PENDING',
        ...(companyId ? { companyId } : {}),
        ...(employeeId ? { employeeId } : {}),
        startDate: {
          gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
          lte: new Date(`${currentYear}-12-31T23:59:59.999Z`),
        },
      },
      select: {
        employeeId: true,
        leaveTypeId: true,
        totalDays: true,
      },
    });

    const pendingMap = new Map<string, number>();
    for (const req of pendingRequests) {
      const key = `${req.employeeId}_${req.leaveTypeId}`;
      pendingMap.set(key, (pendingMap.get(key) || 0) + (req.totalDays || 1));
    }

    return balances.map((b: any) => {
      const key = `${b.employeeId}_${b.leaveTypeId}`;
      const pending = pendingMap.get(key) || 0;
      const defaultQuota = b.leaveType?.annualQuota || 12;
      const allocated = b.allocated > 0 ? b.allocated : defaultQuota;
      const used = b.used;
      const available = Math.max(0, allocated - used - pending);
      return {
        ...b,
        allocated,
        pending,
        available,
      };
    });
  }

  async listMy(user?: any, year?: number) {
    let empId = user?.employee?.id || user?.employeeId;
    if (!empId && user?.userId) {
      const emp = await this.prisma.employee.findFirst({ where: { userId: user.userId }, select: { id: true } });
      if (emp) empId = emp.id;
    }
    if (!empId) return [];

    return this.list(empId, year, user?.companyId);
  }

  async allocate(dto: AllocateLeaveBalanceDto, user?: any) {
    if (user && !isUserSuperAdmin(user) && user.companyId) {
      const emp = await this.prisma.employee.findUnique({
        where: { id: dto.employeeId },
        select: { companyId: true },
      });
      if (emp && emp.companyId !== user.companyId) {
        throw new ForbiddenException('Cannot allocate leave balance to employee from another organization');
      }
    }

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
    const leaveType = await this.prisma.leaveType.findUnique({
      where: { id: leaveTypeId },
      select: { annualQuota: true },
    });
    const defaultQuota = leaveType?.annualQuota || 12;

    const existing = await this.prisma.leaveBalance.findUnique({
      where: { employeeId_leaveTypeId_year: { employeeId, leaveTypeId, year } },
    });

    if (existing) {
      const newUsed = Math.max(0, existing.used + deltaDays);
      const allocated = existing.allocated > 0 ? existing.allocated : defaultQuota;
      await this.prisma.leaveBalance.update({
        where: { id: existing.id },
        data: {
          used: newUsed,
          allocated,
        },
      });
    } else {
      await this.prisma.leaveBalance.create({
        data: {
          employeeId,
          leaveTypeId,
          year,
          allocated: defaultQuota,
          used: Math.max(deltaDays, 0),
        },
      });
    }
  }
}
