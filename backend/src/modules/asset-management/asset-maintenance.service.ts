import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AssetStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAssetMaintenanceDto, CompleteAssetMaintenanceDto } from './dto/asset-maintenance.dto';
import { isUserBranchAdmin } from '../../common/utils/tenant-context.util';
import type { CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class AssetMaintenanceService {
  constructor(private readonly prisma: PrismaService) {}

  list(assetId?: string, companyId?: string, branchId?: string) {
    let branchWhere: any = undefined;
    if (branchId === 'HEAD_OFFICE' || branchId === 'NONE') {
      branchWhere = { branchId: null };
    } else if (branchId && branchId !== 'ALL' && branchId !== 'ALL_BRANCHES') {
      branchWhere = { branchId };
    }

    return this.prisma.assetMaintenanceRecord.findMany({
      where: {
        ...(assetId ? { assetId } : {}),
        ...(companyId || branchWhere
          ? {
              asset: {
                ...(companyId && companyId !== 'ALL' ? { companyId } : {}),
                ...branchWhere,
              },
            }
          : {}),
      },
      include: {
        asset: {
          select: {
            id: true,
            assetTag: true,
            name: true,
            category: true,
            serialNumber: true,
            companyId: true,
            branchId: true,
            company: { select: { id: true, name: true } },
            branch: { select: { id: true, name: true } },
            department: { select: { id: true, name: true } },
            currentEmployee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async create(dto: CreateAssetMaintenanceDto, user?: CurrentUserPayload) {
    const asset = await this.prisma.asset.findUnique({ where: { id: dto.assetId } });
    if (!asset) throw new NotFoundException('Asset not found');

    if (user && isUserBranchAdmin(user)) {
      const assignedBranchId = user.branchId || user.employee?.branchId;
      if (asset.branchId !== assignedBranchId) {
        throw new NotFoundException('Asset not found');
      }
    }

    const woCount = await this.prisma.assetMaintenanceRecord.count();
    const workOrderNumber = `WO-2026-${String(woCount + 1001).padStart(6, '0')}`;

    const [record] = await this.prisma.$transaction([
      this.prisma.assetMaintenanceRecord.create({
        data: {
          assetId: dto.assetId,
          workOrderNumber,
          issue: dto.issue,
          priority: dto.priority || 'MEDIUM',
          maintenanceType: dto.maintenanceType || 'Repair',
          vendor: dto.vendor || null,
          warrantyClaim: dto.warrantyClaim ?? false,
          startDate: new Date(dto.startDate),
          cost: dto.cost ? Number(dto.cost) : null,
          notes: dto.notes || null,
          qcStatus: 'PENDING',
        },
      }),
      this.prisma.asset.update({ where: { id: dto.assetId }, data: { status: AssetStatus.UNDER_MAINTENANCE } }),
    ]);
    return record;
  }

  async complete(id: string, dto?: CompleteAssetMaintenanceDto, user?: CurrentUserPayload) {
    const record = await this.prisma.assetMaintenanceRecord.findUnique({
      where: { id },
      include: { asset: true },
    });
    if (!record) throw new NotFoundException('Maintenance record not found');

    if (user && isUserBranchAdmin(user)) {
      const assignedBranchId = user.branchId || user.employee?.branchId;
      if (record.asset.branchId !== assignedBranchId) {
        throw new NotFoundException('Maintenance record not found');
      }
    }

    const completionDate = dto?.completionDate ? new Date(dto.completionDate) : new Date();
    const finalCondition = dto?.finalCondition || 'GOOD';
    const actualCost = dto?.actualCost !== undefined && dto.actualCost !== null ? Number(dto.actualCost) : record.cost;
    const vendor = dto?.vendor || record.vendor;
    const notes = dto?.repairNotes || record.notes;
    const qcStatus = dto?.qcStatus || 'PASS';

    const newAssetStatus = qcStatus === 'PASS' ? AssetStatus.IN_STOCK : AssetStatus.UNDER_MAINTENANCE;

    const [updated] = await this.prisma.$transaction([
      this.prisma.assetMaintenanceRecord.update({
        where: { id },
        data: {
          endDate: qcStatus === 'PASS' ? completionDate : null,
          cost: actualCost,
          vendor,
          finalCondition,
          workPerformed: dto?.workPerformed || null,
          partsUsed: dto?.partsUsed || null,
          qcStatus,
          notes,
        },
      }),
      this.prisma.asset.update({
        where: { id: record.assetId },
        data: { status: newAssetStatus, condition: finalCondition },
      }),
    ]);
    return updated;
  }
}

