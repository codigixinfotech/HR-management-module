import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AssetStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AllocateAssetDto, CreateAssetDto, ReturnAssetDto, UpdateAssetDto } from './dto/asset.dto';

@Injectable()
export class AssetsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly listInclude = {
    company: { select: { id: true, name: true, code: true } },
    branch: { select: { id: true, name: true, code: true } },
    department: { select: { id: true, name: true, code: true } },
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
      include: {
        ...this.listInclude,
        allocations: {
          include: { employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } } },
          orderBy: { allocatedAt: 'desc' },
        },
        maintenanceLogs: { orderBy: { startDate: 'desc' } },
      },
    });
    if (!asset) throw new NotFoundException('Asset not found');
    return asset;
  }

  private async generateNextAssetTag(companyId: string): Promise<string> {
    const count = await this.prisma.asset.count({ where: { companyId } });
    const nextNum = (count + 1).toString().padStart(6, '0');
    return `AST-${nextNum}`;
  }

  async create(dto: CreateAssetDto) {
    const assetTag = dto.assetTag || (await this.generateNextAssetTag(dto.companyId));

    const existing = await this.prisma.asset.findFirst({
      where: { companyId: dto.companyId, assetTag },
    });
    if (existing) throw new ConflictException(`An asset with tag "${assetTag}" already exists for this company`);

    if (dto.purchaseDate) {
      const pDate = new Date(dto.purchaseDate);
      const today = new Date();
      if (pDate > today) {
        throw new BadRequestException('Purchase Date cannot be in the future.');
      }
    }

    if (dto.serialNumber && dto.serialNumber.trim()) {
      const existingSerial = await this.prisma.asset.findFirst({
        where: { companyId: dto.companyId, serialNumber: dto.serialNumber.trim() },
      });
      if (existingSerial) {
        throw new ConflictException('This Serial Number is already registered.');
      }
    }

    if (dto.warrantyStart && dto.warrantyExpiry) {
      if (new Date(dto.warrantyExpiry) < new Date(dto.warrantyStart)) {
        throw new BadRequestException('Warranty End Date cannot be before Warranty Start Date.');
      }
    }

    let targetStatus: AssetStatus = AssetStatus.IN_STOCK;
    if (dto.status === 'ALLOCATED') targetStatus = AssetStatus.ALLOCATED;
    else if (dto.status === 'UNDER_MAINTENANCE') targetStatus = AssetStatus.UNDER_MAINTENANCE;
    else if (dto.status === 'RETIRED' || dto.status === 'DISPOSED') targetStatus = AssetStatus.RETIRED;

    return this.prisma.asset.create({
      data: {
        companyId: dto.companyId,
        branchId: dto.branchId || null,
        departmentId: dto.departmentId || null,
        assetTag,
        name: dto.name,
        category: dto.category,
        assetType: dto.assetType || 'Hardware',
        physicalLocation: dto.physicalLocation || null,
        vendor: dto.vendor || null,
        invoiceNumber: dto.invoiceNumber || null,
        poNumber: dto.poNumber || null,
        serialNumber: dto.serialNumber || null,
        manufacturer: dto.manufacturer || null,
        modelNumber: dto.modelNumber || null,
        value: dto.value !== undefined && dto.value !== null ? Number(dto.value) : null,
        status: targetStatus,
        condition: dto.condition || 'NEW',
        usefulLife: dto.usefulLife || null,
        notes: dto.notes || null,
        remarks: dto.remarks || null,
        photoUrl: dto.photoUrl || null,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
        warrantyStart: dto.warrantyStart ? new Date(dto.warrantyStart) : undefined,
        warrantyExpiry: dto.warrantyExpiry ? new Date(dto.warrantyExpiry) : undefined,
      },
      include: this.listInclude,
    });
  }

  async update(id: string, dto: UpdateAssetDto) {
    const existingAsset = await this.findById(id);

    if (dto.purchaseDate) {
      const pDate = new Date(dto.purchaseDate);
      const today = new Date();
      if (pDate > today) {
        throw new BadRequestException('Purchase Date cannot be a future date');
      }
    }

    if (dto.serialNumber && dto.serialNumber.trim() && dto.serialNumber.trim() !== existingAsset.serialNumber) {
      const existingSerial = await this.prisma.asset.findFirst({
        where: { companyId: existingAsset.companyId, serialNumber: dto.serialNumber.trim(), NOT: { id } },
      });
      if (existingSerial) {
        throw new ConflictException(`An asset with serial number "${dto.serialNumber}" already exists`);
      }
    }

    if (existingAsset.status === AssetStatus.ALLOCATED) {
      if (dto.branchId && dto.branchId !== existingAsset.branchId) {
        throw new BadRequestException('This asset is currently allocated. Please use Asset Allocation/Transfer workflow to change ownership or location.');
      }
      if (dto.departmentId && dto.departmentId !== existingAsset.departmentId) {
        throw new BadRequestException('This asset is currently allocated. Please use Asset Allocation/Transfer workflow to change ownership or location.');
      }
      if (dto.status && dto.status !== 'ALLOCATED') {
        throw new BadRequestException('This asset is currently allocated. Please use Asset Allocation/Return workflow to change lifecycle status.');
      }
    }

    const { companyId, status, purchaseDate, warrantyStart, warrantyExpiry, ...rest } = dto;

    let targetStatus: AssetStatus | undefined = undefined;
    if (status === 'ALLOCATED') targetStatus = AssetStatus.ALLOCATED;
    else if (status === 'UNDER_MAINTENANCE') targetStatus = AssetStatus.UNDER_MAINTENANCE;
    else if (status === 'RETIRED' || status === 'DISPOSED') targetStatus = AssetStatus.RETIRED;
    else if (status === 'IN_STOCK' || status === 'AVAILABLE') targetStatus = AssetStatus.IN_STOCK;

    return this.prisma.asset.update({
      where: { id },
      data: {
        ...rest,
        ...(companyId ? { companyId } : {}),
        ...(targetStatus ? { status: targetStatus } : {}),
        purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
        warrantyStart: warrantyStart ? new Date(warrantyStart) : undefined,
        warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : undefined,
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
      throw new ConflictException('This asset is not available for allocation.');
    }

    const employee = await this.prisma.employee.findUnique({ where: { id: dto.employeeId } });
    if (!employee) {
      throw new BadRequestException('Employee is required.');
    }
    if (employee.status !== 'ACTIVE') {
      throw new BadRequestException('Selected employee is inactive and cannot receive an asset.');
    }
    if (employee.companyId !== asset.companyId) {
      throw new BadRequestException('Selected employee does not belong to this company.');
    }

    const allocatedAt = dto.allocationDate ? new Date(dto.allocationDate) : new Date();
    const expectedReturnDate = dto.expectedReturnDate ? new Date(dto.expectedReturnDate) : null;

    const [, updated] = await this.prisma.$transaction([
      this.prisma.assetAllocation.create({
        data: {
          assetId: id,
          employeeId: dto.employeeId,
          allocationType: dto.allocationType || 'New Allocation',
          location: dto.location || null,
          allocatedAt,
          expectedReturnDate,
          remarks: dto.remarks || null,
        },
      }),
      this.prisma.asset.update({
        where: { id },
        data: { status: AssetStatus.ALLOCATED, currentEmployeeId: dto.employeeId },
        include: this.listInclude,
      }),
    ]);
    return updated;
  }

  async returnAsset(id: string, dto?: ReturnAssetDto) {
    const asset = await this.findById(id);
    if (asset.status !== AssetStatus.ALLOCATED) {
      throw new ConflictException('Only allocated assets can be returned');
    }

    const openAllocation = await this.prisma.assetAllocation.findFirst({
      where: { assetId: id, returnedAt: null },
      orderBy: { allocatedAt: 'desc' },
    });

    const returnDate = dto?.returnDate ? new Date(dto.returnDate) : new Date();
    const returnReason = dto?.returnReason === 'Other' && dto?.otherReason ? `Other: ${dto.otherReason}` : dto?.returnReason || 'Asset Return';
    const condition = dto?.condition || 'Good';

    // Condition-driven asset status
    let newStatus: AssetStatus = AssetStatus.IN_STOCK;
    if (condition === 'Damaged') {
      newStatus = AssetStatus.UNDER_MAINTENANCE;
    } else if (condition === 'Lost') {
      newStatus = AssetStatus.RETIRED;
    }

    const [, updated] = await this.prisma.$transaction([
      openAllocation
        ? this.prisma.assetAllocation.update({
            where: { id: openAllocation.id },
            data: {
              returnedAt: returnDate,
              returnReason,
              returnedBy: dto?.returnedBy || null,
              returnLocation: dto?.returnLocation || null,
              conditionOnReturn: condition,
              accessoriesReturned: dto?.accessoriesReturned || null,
              remarks: dto?.remarks || null,
            },
          })
        : this.prisma.assetAllocation.create({
            data: {
              assetId: id,
              employeeId: asset.currentEmployeeId!,
              returnedAt: returnDate,
              returnReason,
              returnedBy: dto?.returnedBy || null,
              returnLocation: dto?.returnLocation || null,
              conditionOnReturn: condition,
              accessoriesReturned: dto?.accessoriesReturned || null,
              remarks: dto?.remarks || null,
            },
          }),
      this.prisma.asset.update({
        where: { id },
        data: {
          status: newStatus,
          condition,
          currentEmployeeId: null,
        },
        include: this.listInclude,
      }),
      ...(condition === 'Damaged'
        ? [
            this.prisma.assetMaintenanceRecord.create({
              data: {
                assetId: id,
                issue: `Damaged on Return (${returnReason})`,
                startDate: returnDate,
                cost: null,
              },
            }),
          ]
        : []),
    ]);
    return updated;
  }
}
