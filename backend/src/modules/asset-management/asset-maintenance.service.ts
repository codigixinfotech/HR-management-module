import { Injectable, NotFoundException } from '@nestjs/common';
import { AssetStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAssetMaintenanceDto, CompleteAssetMaintenanceDto } from './dto/asset-maintenance.dto';

@Injectable()
export class AssetMaintenanceService {
  constructor(private readonly prisma: PrismaService) {}

  list(assetId?: string) {
    return this.prisma.assetMaintenanceRecord.findMany({
      where: assetId ? { assetId } : undefined,
      include: {
        asset: {
          select: {
            id: true,
            assetTag: true,
            name: true,
            category: true,
            serialNumber: true,
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

  async create(dto: CreateAssetMaintenanceDto) {
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

  async complete(id: string, dto?: CompleteAssetMaintenanceDto) {
    const record = await this.prisma.assetMaintenanceRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Maintenance record not found');

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
