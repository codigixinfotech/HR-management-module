import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AssetStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AllocateAssetDto, CreateAssetDto, UpdateAssetDto } from './dto/asset.dto';

@Injectable()
export class AssetsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly listInclude = {
    currentEmployee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
  };

  list(companyId?: string) {
    return this.prisma.asset.findMany({
      where: companyId ? { companyId } : undefined,
      include: this.listInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      include: { ...this.listInclude, allocations: { orderBy: { allocatedAt: 'desc' } }, maintenanceLogs: { orderBy: { startDate: 'desc' } } },
    });
    if (!asset) throw new NotFoundException('Asset not found');
    return asset;
  }

  async create(dto: CreateAssetDto) {
    const existing = await this.prisma.asset.findFirst({
      where: { companyId: dto.companyId, assetTag: dto.assetTag },
    });
    if (existing) throw new ConflictException('An asset with this tag already exists for this company');
    return this.prisma.asset.create({
      data: {
        ...dto,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
        warrantyExpiry: dto.warrantyExpiry ? new Date(dto.warrantyExpiry) : undefined,
      },
      include: this.listInclude,
    });
  }

  async update(id: string, dto: UpdateAssetDto) {
    await this.findById(id);
    return this.prisma.asset.update({
      where: { id },
      data: {
        ...dto,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
        warrantyExpiry: dto.warrantyExpiry ? new Date(dto.warrantyExpiry) : undefined,
      },
      include: this.listInclude,
    });
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.asset.delete({ where: { id } });
    return { success: true };
  }

  async allocate(id: string, dto: AllocateAssetDto) {
    const asset = await this.findById(id);
    if (asset.status !== AssetStatus.IN_STOCK) {
      throw new ConflictException('Only assets that are in stock can be allocated');
    }
    const [, updated] = await this.prisma.$transaction([
      this.prisma.assetAllocation.create({
        data: { assetId: id, employeeId: dto.employeeId, remarks: dto.remarks },
      }),
      this.prisma.asset.update({
        where: { id },
        data: { status: AssetStatus.ALLOCATED, currentEmployeeId: dto.employeeId },
        include: this.listInclude,
      }),
    ]);
    return updated;
  }

  async returnAsset(id: string) {
    const asset = await this.findById(id);
    if (asset.status !== AssetStatus.ALLOCATED) {
      throw new ConflictException('Only allocated assets can be returned');
    }
    const openAllocation = await this.prisma.assetAllocation.findFirst({
      where: { assetId: id, returnedAt: null },
      orderBy: { allocatedAt: 'desc' },
    });

    const [, updated] = await this.prisma.$transaction([
      openAllocation
        ? this.prisma.assetAllocation.update({ where: { id: openAllocation.id }, data: { returnedAt: new Date() } })
        : this.prisma.assetAllocation.create({ data: { assetId: id, employeeId: asset.currentEmployeeId!, returnedAt: new Date() } }),
      this.prisma.asset.update({
        where: { id },
        data: { status: AssetStatus.IN_STOCK, currentEmployeeId: null },
        include: this.listInclude,
      }),
    ]);
    return updated;
  }
}
