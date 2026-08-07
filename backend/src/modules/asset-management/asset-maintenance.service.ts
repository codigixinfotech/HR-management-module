import { Injectable, NotFoundException } from '@nestjs/common';
import { AssetStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAssetMaintenanceDto } from './dto/asset-maintenance.dto';

@Injectable()
export class AssetMaintenanceService {
  constructor(private readonly prisma: PrismaService) {}

  list(assetId?: string) {
    return this.prisma.assetMaintenanceRecord.findMany({
      where: assetId ? { assetId } : undefined,
      include: { asset: { select: { id: true, assetTag: true, name: true } } },
      orderBy: { startDate: 'desc' },
    });
  }

  async create(dto: CreateAssetMaintenanceDto) {
    const [record] = await this.prisma.$transaction([
      this.prisma.assetMaintenanceRecord.create({
        data: { ...dto, startDate: new Date(dto.startDate) },
      }),
      this.prisma.asset.update({ where: { id: dto.assetId }, data: { status: AssetStatus.UNDER_MAINTENANCE } }),
    ]);
    return record;
  }

  async complete(id: string) {
    const record = await this.prisma.assetMaintenanceRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Maintenance record not found');
    const [updated] = await this.prisma.$transaction([
      this.prisma.assetMaintenanceRecord.update({ where: { id }, data: { endDate: new Date() } }),
      this.prisma.asset.update({ where: { id: record.assetId }, data: { status: AssetStatus.IN_STOCK } }),
    ]);
    return updated;
  }
}
