import { Injectable, NotFoundException } from '@nestjs/common';
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
      select: { id: true, firstName: true, lastName: true, employeeCode: true },
    },
    leaveType: { select: { id: true, name: true, code: true, isPaid: true } },
    approver: { select: { id: true, firstName: true, lastName: true } },
  };

  async list(
    query: PaginationQueryDto,
    employeeId?: string,
    status?: ApprovalStatus,
  ) {
    const { skip, take, page, pageSize } = buildPagination(query);
    const where = {
      ...(employeeId ? { employeeId } : {}),
      ...(status ? { status } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.leaveRequest.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: this.listInclude,
      }),
      this.prisma.leaveRequest.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async listMy(user?: any, status?: ApprovalStatus) {
    const empId = user?.employee?.id;
    if (!empId) return [];

    return this.prisma.leaveRequest.findMany({
      where: {
        employeeId: empId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: this.listInclude,
    });
  }

  async findById(id: string) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: this.listInclude,
    });
    if (!request) throw new NotFoundException('Leave request not found');
    return request;
  }

  create(dto: CreateLeaveRequestDto) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const totalDays =
      Math.floor((endDate.getTime() - startDate.getTime()) / MS_PER_DAY) + 1;

    return this.prisma.leaveRequest.create({
      data: {
        companyId: dto.companyId,
        employeeId: dto.employeeId,
        leaveTypeId: dto.leaveTypeId,
        startDate,
        endDate,
        totalDays,
        reason: dto.reason,
      },
      include: this.listInclude,
    });
  }

  async updateStatus(id: string, dto: UpdateLeaveStatusDto) {
    const request = await this.findById(id);
    const wasApproved = request.status === 'APPROVED';
    const willBeApproved = dto.status === 'APPROVED';
    const year = request.startDate.getFullYear();

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
}
