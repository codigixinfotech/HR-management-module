import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCostCenterDto, UpdateCostCenterDto } from './dto/cost-center.dto';

@Injectable()
export class CostCentersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(companyId?: string) {
    return this.prisma.costCenter.findMany({
      where: companyId ? { companyId } : undefined,
      include: {
        branch:     { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
      },
      orderBy: { code: 'asc' },
    });
  }

  async findOne(id: string) {
    const cc = await this.prisma.costCenter.findUnique({
      where: { id },
      include: {
        branch:     { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
      },
    });
    if (!cc) throw new NotFoundException(`Cost Center ${id} not found`);
    return cc;
  }

  async create(dto: CreateCostCenterDto) {
    return this.prisma.costCenter.create({
      data: {
        companyId:         dto.companyId,
        code:              dto.code,
        name:              dto.name,
        type:              dto.type ?? 'Department',
        branchId:          dto.branchId || null,
        departmentId:      dto.departmentId || null,
        managerId:         dto.managerId || null,
        managerName:       dto.managerName || null,
        budget:            dto.budget ?? 0,
        headcountCapacity: dto.headcountCapacity ?? 0,
        effectiveFrom:     dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date(),
        description:       dto.description || null,
        isActive:          dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateCostCenterDto) {
    await this.findOne(id);
    return this.prisma.costCenter.update({
      where: { id },
      data: {
        ...(dto.name              !== undefined && { name: dto.name }),
        ...(dto.type              !== undefined && { type: dto.type }),
        ...(dto.branchId          !== undefined && { branchId: dto.branchId || null }),
        ...(dto.departmentId      !== undefined && { departmentId: dto.departmentId || null }),
        ...(dto.managerId         !== undefined && { managerId: dto.managerId || null }),
        ...(dto.managerName       !== undefined && { managerName: dto.managerName || null }),
        ...(dto.budget            !== undefined && { budget: dto.budget }),
        ...(dto.headcountCapacity !== undefined && { headcountCapacity: dto.headcountCapacity }),
        ...(dto.effectiveFrom     !== undefined && { effectiveFrom: new Date(dto.effectiveFrom) }),
        ...(dto.description       !== undefined && { description: dto.description || null }),
        ...(dto.isActive          !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.costCenter.delete({ where: { id } });
  }
}
