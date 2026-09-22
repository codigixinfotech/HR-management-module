import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ApprovalStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  PaginationQueryDto,
  buildPagination,
} from '../../common/dto/pagination.dto';
import {
  CreateLeaveRequestDto,
  UpdateLeaveStatusDto,
} from './dto/leave-request.dto';
import { LeaveBalancesService } from './leave-balances.service';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class LeaveRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly leaveBalancesService: LeaveBalancesService,
  ) {}

  private readonly listInclude = {
    employee: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeCode: true,
        department: { select: { id: true, name: true } },
      },
    },
    leaveType: { select: { id: true, name: true, code: true, isPaid: true } },
    approver: { select: { id: true, firstName: true, lastName: true } },
  };

  async list(
    query: PaginationQueryDto,
    employeeId?: string,
    status?: ApprovalStatus,
    companyId?: string,
    branchId?: string,
  ) {
    const { skip, take, page, pageSize } = buildPagination(query);
    const where = {
      ...(employeeId ? { employeeId } : {}),
      ...(status ? { status } : {}),
      ...(companyId ? { companyId, employee: { companyId } } : {}),
      ...(branchId ? { employee: { branchId } } : {}),
    };

    const [rawItems, total] = await this.prisma.$transaction([
      this.prisma.leaveRequest.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: this.listInclude,
      }),
      this.prisma.leaveRequest.count({ where }),
    ]);

    // Fetch extra attributes
    const ids = rawItems.map((i) => i.id);
    let extraCols: any[] = [];
    if (ids.length > 0) {
      try {
        extraCols = await this.prisma.$queryRawUnsafe(
          `SELECT id, duration, halfDaySession, attachmentUrl, approvalLevel, currentApproverRole FROM leave_requests WHERE id IN (${ids.map(() => '?').join(',')})`,
          ...ids
        );
      } catch {}
    }

    const items = rawItems.map((item) => {
      const extra = extraCols.find((e: any) => e.id === item.id);
      return {
        ...item,
        duration: extra?.duration || 'FULL_DAY',
        halfDaySession: extra?.halfDaySession || null,
        attachmentUrl: extra?.attachmentUrl || null,
        approvalLevel: extra?.approvalLevel || 1,
        currentApproverRole: extra?.currentApproverRole || 'Reporting Manager',
      };
    });

    return { items, total, page, pageSize };
  }

  async listMy(user?: any, status?: ApprovalStatus) {
    let empId = user?.employee?.id || user?.employeeId;
    if (!empId && user?.userId) {
      const emp = await this.prisma.employee.findFirst({ where: { userId: user.userId }, select: { id: true } });
      if (emp) empId = emp.id;
    }
    if (!empId) return [];

    const rawItems = await this.prisma.leaveRequest.findMany({
      where: {
        employeeId: empId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: this.listInclude,
    });

    const ids = rawItems.map((i) => i.id);
    let extraCols: any[] = [];
    if (ids.length > 0) {
      try {
        extraCols = await this.prisma.$queryRawUnsafe(
          `SELECT id, duration, halfDaySession, attachmentUrl, approvalLevel, currentApproverRole FROM leave_requests WHERE id IN (${ids.map(() => '?').join(',')})`,
          ...ids
        );
      } catch {}
    }

    return rawItems.map((item) => {
      const extra = extraCols.find((e: any) => e.id === item.id);
      return {
        ...item,
        duration: extra?.duration || 'FULL_DAY',
        halfDaySession: extra?.halfDaySession || null,
        attachmentUrl: extra?.attachmentUrl || null,
        approvalLevel: extra?.approvalLevel || 1,
        currentApproverRole: extra?.currentApproverRole || 'Reporting Manager',
      };
    });
  }

  async findById(id: string) {
    const request: any = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: this.listInclude,
    });
    if (!request) throw new NotFoundException('Leave request not found');

    let extra: any = null;
    try {
      const extraRows: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT id, duration, halfDaySession, attachmentUrl, approvalLevel, currentApproverRole FROM leave_requests WHERE id = ? LIMIT 1`,
        id
      );
      if (extraRows && extraRows.length > 0) extra = extraRows[0];
    } catch {}

    return {
      ...request,
      duration: extra?.duration || 'FULL_DAY',
      halfDaySession: extra?.halfDaySession || null,
      attachmentUrl: extra?.attachmentUrl || null,
      approvalLevel: extra?.approvalLevel || 1,
      currentApproverRole: extra?.currentApproverRole || 'Reporting Manager',
    };
  }

  async create(dto: CreateLeaveRequestDto) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    let computedDays = dto.totalDays;
    if (computedDays === undefined || computedDays === null || isNaN(computedDays)) {
      if (dto.duration === 'HALF_DAY') {
        computedDays = 0.5;
      } else {
        computedDays = Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / MS_PER_DAY) + 1);
      }
    }

    const created = await this.prisma.leaveRequest.create({
      data: {
        companyId: dto.companyId,
        employeeId: dto.employeeId,
        leaveTypeId: dto.leaveTypeId,
        startDate,
        endDate,
        totalDays: computedDays,
        reason: dto.reason,
      },
      include: this.listInclude,
    });

    try {
      await this.prisma.$executeRawUnsafe(
        `UPDATE leave_requests SET duration = ?, halfDaySession = ?, attachmentUrl = ?, currentApproverRole = 'Reporting Manager' WHERE id = ?`,
        dto.duration || 'FULL_DAY',
        dto.halfDaySession || null,
        dto.attachmentUrl || null,
        created.id
      );
    } catch (err) {
      console.warn('Could not update extra columns:', err);
    }

    return this.findById(created.id);
  }

  async updateStatus(id: string, dto: UpdateLeaveStatusDto) {
    const request = await this.findById(id);
    const wasApproved = request.status === 'APPROVED';
    const willBeApproved = dto.status === 'APPROVED';
    const year = new Date(request.startDate).getFullYear();

    const updated = await this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: dto.status,
        approverId: dto.approverId,
        approverRemarks: dto.approverRemarks,
        decidedAt: new Date(),
      },
      include: this.listInclude,
    });

    if (!wasApproved && willBeApproved) {
      await this.leaveBalancesService.adjustUsed(
        request.employeeId,
        request.leaveTypeId,
        year,
        request.totalDays,
      );
    } else if (wasApproved && !willBeApproved) {
      await this.leaveBalancesService.adjustUsed(
        request.employeeId,
        request.leaveTypeId,
        year,
        -request.totalDays,
      );
    }

    return updated;
  }

  async bulkUpdateStatus(dto: { ids: string[]; status: ApprovalStatus; approverId?: string; approverRemarks?: string }) {
    const results: any[] = [];
    for (const id of dto.ids) {
      try {
        const res = await this.updateStatus(id, {
          status: dto.status,
          approverId: dto.approverId,
          approverRemarks: dto.approverRemarks,
        });
        results.push(res);
      } catch (err) {
        console.warn('Error bulk updating status for leave request:', id, err);
      }
    }
    return { success: true, count: results.length, items: results };
  }

  async cancelMyRequest(id: string, user?: any, reason?: string) {
    const request = await this.findById(id);
    let empId = user?.employee?.id || user?.employeeId;
    if (!empId && user?.userId) {
      const emp = await this.prisma.employee.findFirst({ where: { userId: user.userId }, select: { id: true } });
      if (emp) empId = emp.id;
    }

    // Admins can cancel any request, regular employees only their own
    const isAdmin = user?.permissions?.includes('*') || user?.roles?.some((r: string) => r.toUpperCase().includes('ADMIN'));
    if (!isAdmin && empId && request.employeeId !== empId) {
      throw new BadRequestException('You are not authorized to cancel this leave request');
    }

    if (request.status === 'CANCELLED') {
      return request;
    }

    const wasApproved = request.status === 'APPROVED';
    const year = new Date(request.startDate).getFullYear();

    const updated = await this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        approverRemarks: reason || 'Withdrawn by employee',
        decidedAt: new Date(),
      },
      include: this.listInclude,
    });

    // If it was already approved and deducted from balance, restore balance
    if (wasApproved) {
      await this.leaveBalancesService.adjustUsed(
        request.employeeId,
        request.leaveTypeId,
        year,
        -request.totalDays,
      );
    }

    return updated;
  }
}
