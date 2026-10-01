import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssetStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  AllocateAssetRequestDto,
  CreateAssetRequestDto,
  ReviewAssetRequestDto,
  UpdateAssetRequestDto,
} from './dto/asset-request.dto';
import { isUserBranchAdmin } from '../../common/utils/tenant-context.util';
import type { CurrentUserPayload } from '../../common/decorators/current-user.decorator';

export const AssetRequestStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  SENT_BACK: 'SENT_BACK',
  WAITING_PROCUREMENT: 'WAITING_PROCUREMENT',
  ALLOCATED: 'ALLOCATED',
  CANCELLED: 'CANCELLED',
} as const;

export type AssetRequestStatus = (typeof AssetRequestStatus)[keyof typeof AssetRequestStatus];

export const AssetRequestPriority = {
  NORMAL: 'NORMAL',
  URGENT: 'URGENT',
} as const;

export type AssetRequestPriority = (typeof AssetRequestPriority)[keyof typeof AssetRequestPriority];

@Injectable()
export class AssetRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly requestInclude = {
    company: { select: { id: true, name: true, code: true } },
    branch: { select: { id: true, name: true, code: true } },
    department: { select: { id: true, name: true, code: true } },
    employee: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeCode: true,
        workEmail: true,
        personalEmail: true,
        branchId: true,
        departmentId: true,
      },
    },
    approver: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeCode: true,
      },
    },
    allocatedAsset: {
      select: {
        id: true,
        assetTag: true,
        name: true,
        serialNumber: true,
        category: true,
        status: true,
        physicalLocation: true,
      },
    },
  };

  private async generateNextRequestNumber(companyId: string): Promise<string> {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `AR-${yearMonth}-`;

    const last = await (this.prisma as any).assetRequest.findFirst({
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

  async list(
    query: {
      companyId?: string;
      branchId?: string;
      status?: string;
      category?: string;
      employeeId?: string;
    },
    user?: CurrentUserPayload,
  ) {
    const where: any = {};

    // 1. Company context
    let compId = query.companyId;
    if (!compId && user?.companyId) compId = user.companyId;
    if (compId) where.companyId = compId;

    // 2. Branch context
    if (user && isUserBranchAdmin(user)) {
      const assignedBranchId = user.branchId || user.employee?.branchId;
      if (assignedBranchId) where.branchId = assignedBranchId;
    } else if (query.branchId === 'HEAD_OFFICE' || query.branchId === 'NONE') {
      where.branchId = null;
    } else if (query.branchId && query.branchId !== 'ALL' && query.branchId !== 'ALL_BRANCHES') {
      where.branchId = query.branchId;
    }

    // 3. Status filter
    if (query.status && query.status !== 'ALL') {
      where.status = query.status as AssetRequestStatus;
    }

    // 4. Category filter
    if (query.category && query.category !== 'ALL') {
      where.category = query.category;
    }

    // 5. Employee filter
    if (query.employeeId) {
      where.employeeId = query.employeeId;
    }

    return (this.prisma as any).assetRequest.findMany({
      where,
      include: this.requestInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyRequests(user: CurrentUserPayload) {
    const employee = await this.resolveEmployeeForUser(user);
    if (!employee) {
      return [];
    }

    return (this.prisma as any).assetRequest.findMany({
      where: { employeeId: employee.id },
      include: this.requestInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyAssets(user: CurrentUserPayload) {
    const employee = await this.resolveEmployeeForUser(user);
    if (!employee) {
      return [];
    }

    return this.prisma.asset.findMany({
      where: {
        OR: [
          { currentEmployeeId: employee.id, status: { in: [AssetStatus.ALLOCATED, AssetStatus.UNDER_MAINTENANCE] } },
          { allocations: { some: { employeeId: employee.id, returnedAt: null } } },
        ],
      },
      include: {
        branch: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        allocations: {
          where: { employeeId: employee.id, returnedAt: null },
          orderBy: { allocatedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findById(id: string, user?: CurrentUserPayload) {
    const req = await (this.prisma as any).assetRequest.findUnique({
      where: { id },
      include: this.requestInclude,
    });
    if (!req) {
      throw new NotFoundException(`Asset Request with ID "${id}" was not found.`);
    }

    if (user && isUserBranchAdmin(user)) {
      const assignedBranchId = user.branchId || user.employee?.branchId;
      if (assignedBranchId && req.branchId && req.branchId !== assignedBranchId) {
        throw new ForbiddenException('You do not have permission to view requests outside your assigned branch.');
      }
    }

    return req;
  }

  async create(dto: CreateAssetRequestDto, user?: CurrentUserPayload) {
    const selfEmployee = await this.resolveEmployeeForUser(user);

    // Target employee ID: either passed explicitly by admin or inferred from logged-in employee
    let targetEmpId = dto.employeeId || selfEmployee?.id;
    if (!targetEmpId) {
      throw new BadRequestException('Employee record could not be resolved for this request.');
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id: targetEmpId },
      include: { company: true, branch: true, department: true },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found.');
    }

    const effectiveCompanyId = dto.companyId || employee.companyId || user?.companyId;
    if (!effectiveCompanyId) {
      throw new BadRequestException('Company / Entity is required.');
    }

    const effectiveBranchId =
      dto.branchId !== undefined ? (dto.branchId === 'NONE' ? null : dto.branchId) : employee.branchId;
    const effectiveDepartmentId =
      dto.departmentId !== undefined ? (dto.departmentId === 'NONE' ? null : dto.departmentId) : employee.departmentId;

    const requestNumber = await this.generateNextRequestNumber(effectiveCompanyId);

    const reqPriority: AssetRequestPriority =
      dto.priority === 'URGENT' ? AssetRequestPriority.URGENT : AssetRequestPriority.NORMAL;

    return (this.prisma as any).assetRequest.create({
      data: {
        requestNumber,
        companyId: effectiveCompanyId,
        branchId: effectiveBranchId,
        departmentId: effectiveDepartmentId,
        employeeId: targetEmpId,
        category: dto.category,
        assetType: dto.assetType || 'Physical Asset',
        specification: dto.specification || null,
        quantity: dto.quantity || 1,
        requiredDate: new Date(dto.requiredDate),
        priority: reqPriority,
        reason: dto.reason,
        remarks: dto.remarks || null,
        status: AssetRequestStatus.SUBMITTED,
      },
      include: this.requestInclude,
    });
  }

  async update(id: string, dto: UpdateAssetRequestDto, user?: CurrentUserPayload) {
    const existing = await this.findById(id, user);

    if (existing.status !== AssetRequestStatus.DRAFT && existing.status !== AssetRequestStatus.SENT_BACK) {
      throw new BadRequestException('Only requests in DRAFT or SENT_BACK status can be updated.');
    }

    const data: any = {
      ...(dto.category ? { category: dto.category } : {}),
      ...(dto.specification !== undefined ? { specification: dto.specification } : {}),
      ...(dto.quantity ? { quantity: dto.quantity } : {}),
      ...(dto.requiredDate ? { requiredDate: new Date(dto.requiredDate) } : {}),
      ...(dto.priority ? { priority: dto.priority as AssetRequestPriority } : {}),
      ...(dto.reason ? { reason: dto.reason } : {}),
      ...(dto.remarks !== undefined ? { remarks: dto.remarks } : {}),
    };

    // If resubmitting from SENT_BACK, promote back to SUBMITTED
    if (existing.status === AssetRequestStatus.SENT_BACK) {
      data.status = AssetRequestStatus.SUBMITTED;
    }

    return (this.prisma as any).assetRequest.update({
      where: { id },
      data,
      include: this.requestInclude,
    });
  }

  async review(id: string, dto: ReviewAssetRequestDto, user?: CurrentUserPayload) {
    const existing = await this.findById(id, user);

    if (existing.status === AssetRequestStatus.ALLOCATED) {
      throw new ConflictException('Cannot review an already allocated request.');
    }

    const reviewerEmployee = await this.resolveEmployeeForUser(user);
    const reviewerId = reviewerEmployee?.id || null;

    let targetStatus: AssetRequestStatus = AssetRequestStatus.APPROVED;
    let rejectionReason: string | null = null;
    let remarks = existing.remarks;

    if (dto.action === 'APPROVE') {
      targetStatus = AssetRequestStatus.APPROVED;
      remarks = dto.remarks || remarks || 'Approved by manager / admin';
    } else if (dto.action === 'REJECT') {
      targetStatus = AssetRequestStatus.REJECTED;
      rejectionReason = dto.rejectionReason || 'Request rejected by reviewer.';
    } else if (dto.action === 'SENT_BACK') {
      targetStatus = AssetRequestStatus.SENT_BACK;
      remarks = dto.remarks || dto.rejectionReason || 'Returned to employee for modification.';
    }

    return (this.prisma as any).assetRequest.update({
      where: { id },
      data: {
        status: targetStatus,
        approverId: reviewerId,
        approvedAt: targetStatus === AssetRequestStatus.APPROVED ? new Date() : null,
        rejectionReason,
        remarks,
      },
      include: this.requestInclude,
    });
  }

  async markWaitingProcurement(id: string, user?: CurrentUserPayload) {
    await this.findById(id, user);

    return (this.prisma as any).assetRequest.update({
      where: { id },
      data: {
        status: AssetRequestStatus.WAITING_PROCUREMENT,
      },
      include: this.requestInclude,
    });
  }

  async allocate(id: string, dto: AllocateAssetRequestDto, user?: CurrentUserPayload) {
    const request = await this.findById(id, user);

    if (request.status === AssetRequestStatus.ALLOCATED) {
      throw new ConflictException('This request has already been allocated.');
    }

    // Verify the target asset from Asset Master
    const asset = await this.prisma.asset.findUnique({
      where: { id: dto.assetId },
      include: { company: true, branch: true },
    });

    if (!asset) {
      throw new NotFoundException('Selected asset does not exist in Asset Master.');
    }

    if (asset.status !== AssetStatus.IN_STOCK) {
      throw new ConflictException(`Asset "${asset.assetTag}" is currently ${asset.status} and cannot be allocated.`);
    }

    if (asset.companyId !== request.companyId) {
      throw new BadRequestException('Asset and Request belong to different companies.');
    }

    if (user && isUserBranchAdmin(user)) {
      const assignedBranchId = user.branchId || user.employee?.branchId;
      if (assignedBranchId && asset.branchId !== assignedBranchId) {
        throw new ForbiddenException('Cannot allocate an asset outside your branch.');
      }
    }

    const allocationDate = dto.allocationDate ? new Date(dto.allocationDate) : new Date();
    const expectedReturnDate = dto.expectedReturnDate ? new Date(dto.expectedReturnDate) : null;

    // Transaction:
    // 1. Create allocation record
    // 2. Update asset status to ALLOCATED and set currentEmployeeId
    // 3. Update request status to ALLOCATED and set allocatedAssetId
    const [, , updatedRequest] = await this.prisma.$transaction([
      this.prisma.assetAllocation.create({
        data: {
          assetId: asset.id,
          employeeId: request.employeeId,
          allocationType: 'Request Allocation',
          location: asset.physicalLocation || asset.branch?.name || null,
          allocatedAt: allocationDate,
          expectedReturnDate,
          remarks: dto.allocationNotes || `Allocated against request #${request.requestNumber}`,
        },
      }),
      this.prisma.asset.update({
        where: { id: asset.id },
        data: {
          status: AssetStatus.ALLOCATED,
          currentEmployeeId: request.employeeId,
        },
      }),
      (this.prisma as any).assetRequest.update({
        where: { id },
        data: {
          status: AssetRequestStatus.ALLOCATED,
          allocatedAssetId: asset.id,
          allocatedAt: allocationDate,
          allocationNotes: dto.allocationNotes || null,
        },
        include: this.requestInclude,
      }),
    ]);

    return updatedRequest;
  }
}
