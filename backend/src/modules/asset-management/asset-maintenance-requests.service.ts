import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssetStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateAssetMaintenanceRequestDto,
  InspectMaintenanceRequestDto,
  UpdateMaintenanceRequestStatusDto,
  CreateWorkOrderFromRequestDto,
} from './dto/asset-maintenance-request.dto';
import { isUserBranchAdmin } from '../../common/utils/tenant-context.util';
import type { CurrentUserPayload } from '../../common/decorators/current-user.decorator';

export const MaintenanceRequestStatus = {
  PENDING: 'PENDING',
  IN_INSPECTION: 'IN_INSPECTION',
  IN_REPAIR: 'IN_REPAIR',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
  SENT_BACK: 'SENT_BACK',
} as const;

export type MaintenanceRequestStatus =
  (typeof MaintenanceRequestStatus)[keyof typeof MaintenanceRequestStatus];

@Injectable()
export class AssetMaintenanceRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly requestInclude = {
    company: { select: { id: true, name: true, code: true } },
    branch: { select: { id: true, name: true, code: true } },
    asset: {
      select: {
        id: true,
        assetTag: true,
        name: true,
        category: true,
        serialNumber: true,
        modelNumber: true,
        manufacturer: true,
        status: true,
        physicalLocation: true,
      },
    },
    requestedBy: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeCode: true,
        workEmail: true,
        departmentId: true,
        branchId: true,
        department: { select: { id: true, name: true } },
      },
    },
    inspectedBy: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeCode: true,
      },
    },
    workOrder: {
      select: {
        id: true,
        workOrderNumber: true,
        issue: true,
        priority: true,
        maintenanceType: true,
        vendor: true,
        startDate: true,
        endDate: true,
        cost: true,
        qcStatus: true,
      },
    },
  };

  private async generateNextRequestNumber(companyId: string): Promise<string> {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `MR-${yearMonth}-`;

    const last = await (this.prisma as any).assetMaintenanceRequest.findFirst({
      where: {
        companyId,
        requestNumber: { startsWith: prefix },
      },
      orderBy: { requestNumber: 'desc' },
      select: { requestNumber: true },
    });

    let nextSeq = 1;
    if (last?.requestNumber) {
      const parts = last.requestNumber.split('-');
      if (parts.length === 3) {
        const num = parseInt(parts[2], 10);
        if (!isNaN(num)) nextSeq = num + 1;
      }
    }

    return `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }

  private async resolveEmployeeForUser(user?: CurrentUserPayload) {
    if (!user) return null;
    const userId = (user as any).sub || user.userId || (user as any).id;
    if (!userId) return null;

    return this.prisma.employee.findFirst({
      where: {
        OR: [
          { userId },
          { id: (user as any).employeeId || (user.employee as any)?.id || '' },
        ],
      },
      include: { company: true, branch: true, department: true },
    });
  }

  async create(dto: CreateAssetMaintenanceRequestDto, user?: CurrentUserPayload) {
    const employee = await this.resolveEmployeeForUser(user);
    if (!employee) {
      throw new ForbiddenException('Employee profile not found for this user account.');
    }

    // Strict validation: Asset MUST be currently allocated to this employee
    const activeAllocation = await this.prisma.assetAllocation.findFirst({
      where: {
        assetId: dto.assetId,
        employeeId: employee.id,
        returnedAt: null,
      },
    });

    if (!activeAllocation) {
      throw new ForbiddenException(
        'You can only submit maintenance requests for assets currently allocated to you.',
      );
    }

    const asset = await this.prisma.asset.findUnique({
      where: { id: dto.assetId },
    });
    if (!asset) {
      throw new NotFoundException('Asset not found.');
    }

    // Check if an identical request was already submitted recently or is currently pending inspection
    const recentDuplicate = await (this.prisma as any).assetMaintenanceRequest.findFirst({
      where: {
        assetId: dto.assetId,
        requestedByEmployeeId: employee.id,
        status: { in: ['PENDING', 'IN_INSPECTION'] },
        issueTitle: dto.issueTitle,
      },
      include: this.requestInclude,
    });
    if (recentDuplicate) {
      // Return the already created request idempotently to prevent duplicate database rows
      return recentDuplicate;
    }

    const companyId = asset.companyId || employee.companyId;
    const branchId = asset.branchId || employee.branchId;

    // Ensure request number is strictly unique
    let requestNumber = await this.generateNextRequestNumber(companyId);
    let attempts = 0;
    while (attempts < 10) {
      const exists = await (this.prisma as any).assetMaintenanceRequest.findFirst({
        where: { requestNumber },
      });
      if (!exists) break;
      attempts++;
      const parts = requestNumber.split('-');
      const nextNum = parseInt(parts[2], 10) + 1;
      requestNumber = `${parts[0]}-${parts[1]}-${String(nextNum).padStart(4, '0')}`;
    }

    return (this.prisma as any).assetMaintenanceRequest.create({
      data: {
        requestNumber,
        companyId,
        branchId,
        assetId: dto.assetId,
        requestedByEmployeeId: employee.id,
        issueTitle: dto.issueTitle,
        issueDescription: dto.issueDescription || null,
        priority: dto.priority || 'MEDIUM',
        status: 'PENDING',
      },
      include: this.requestInclude,
    });
  }

  async list(
    query: {
      companyId?: string;
      branchId?: string;
      status?: string;
      priority?: string;
      assetId?: string;
    },
    user?: CurrentUserPayload,
  ) {
    const where: any = {};

    let compId = query.companyId;
    if (!compId && user?.companyId) compId = user.companyId;
    if (compId && compId !== 'ALL') where.companyId = compId;

    if (user && isUserBranchAdmin(user)) {
      const assignedBranchId = user.branchId || user.employee?.branchId;
      if (assignedBranchId) where.branchId = assignedBranchId;
    } else if (query.branchId === 'HEAD_OFFICE' || query.branchId === 'NONE') {
      where.branchId = null;
    } else if (query.branchId && query.branchId !== 'ALL' && query.branchId !== 'ALL_BRANCHES') {
      where.branchId = query.branchId;
    }

    if (query.status && query.status !== 'ALL') {
      where.status = query.status;
    }

    if (query.priority && query.priority !== 'ALL') {
      where.priority = query.priority;
    }

    if (query.assetId) {
      where.assetId = query.assetId;
    }

    return (this.prisma as any).assetMaintenanceRequest.findMany({
      where,
      include: this.requestInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async listMyRequests(user?: CurrentUserPayload) {
    const employee = await this.resolveEmployeeForUser(user);
    if (!employee) return [];

    return (this.prisma as any).assetMaintenanceRequest.findMany({
      where: { requestedByEmployeeId: employee.id },
      include: this.requestInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    const record = await (this.prisma as any).assetMaintenanceRequest.findUnique({
      where: { id },
      include: this.requestInclude,
    });
    if (!record) {
      throw new NotFoundException(`Maintenance request with ID ${id} not found.`);
    }
    return record;
  }

  async inspect(id: string, dto: InspectMaintenanceRequestDto, user?: CurrentUserPayload) {
    const existing = await this.getById(id);
    const inspector = await this.resolveEmployeeForUser(user);

    return (this.prisma as any).assetMaintenanceRequest.update({
      where: { id },
      data: {
        inspectionRemarks: dto.inspectionRemarks ?? existing.inspectionRemarks,
        inspectedById: inspector?.id ?? existing.inspectedById,
        inspectedAt: new Date(),
        status: dto.status || 'IN_INSPECTION',
      },
      include: this.requestInclude,
    });
  }

  async updateStatus(
    id: string,
    dto: UpdateMaintenanceRequestStatusDto,
    user?: CurrentUserPayload,
  ) {
    const existing = await this.getById(id);

    if (
      (dto.status === 'REJECTED' || dto.status === 'SENT_BACK') &&
      !dto.adminRemarks &&
      !existing.adminRemarks
    ) {
      throw new BadRequestException('Remarks are required when rejecting or sending back a request.');
    }

    return (this.prisma as any).assetMaintenanceRequest.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.adminRemarks !== undefined ? { adminRemarks: dto.adminRemarks } : {}),
      },
      include: this.requestInclude,
    });
  }

  async createWorkOrder(
    id: string,
    dto: CreateWorkOrderFromRequestDto,
    user?: CurrentUserPayload,
  ) {
    const request = await this.getById(id);

    let workOrderId = dto.workOrderId;

    if (!workOrderId) {
      // Create new AssetMaintenanceRecord (work order)
      const woCount = await this.prisma.assetMaintenanceRecord.count();
      const workOrderNumber = `WO-2026-${String(woCount + 1001).padStart(6, '0')}`;

      const createdWo = await this.prisma.$transaction(async (tx) => {
        const wo = await tx.assetMaintenanceRecord.create({
          data: {
            assetId: request.assetId,
            workOrderNumber,
            issue: request.issueTitle,
            priority: request.priority || 'MEDIUM',
            maintenanceType: 'Repair',
            vendor: dto.vendor || null,
            startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
            cost: dto.cost ? Number(dto.cost) : null,
            notes: dto.notes || request.issueDescription || null,
            qcStatus: 'PENDING',
          },
        });

        // Set asset status to UNDER_MAINTENANCE
        await tx.asset.update({
          where: { id: request.assetId },
          data: { status: AssetStatus.UNDER_MAINTENANCE },
        });

        return wo;
      });

      workOrderId = createdWo.id;
    }

    // Link work order to maintenance request and set status to IN_REPAIR
    return (this.prisma as any).assetMaintenanceRequest.update({
      where: { id },
      data: {
        workOrderId,
        status: 'IN_REPAIR',
      },
      include: this.requestInclude,
    });
  }
}
