import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCostCenterDto, UpdateCostCenterDto } from './dto/cost-center.dto';

@Injectable()
export class CostCentersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(companyId?: string, branchId?: string, departmentId?: string) {
    const where: any = {};
    if (companyId) {
      where.companyId = companyId;
    }
    if (branchId) {
      where.OR = [{ branchId }, { branchId: null }];
    }
    if (departmentId) {
      const targetDept = await this.prisma.department.findUnique({
        where: { id: departmentId },
        select: { id: true, name: true },
      });
      const deptName = targetDept?.name?.toLowerCase().trim();

      const deptConditions: any[] = [{ departmentId }];
      if (deptName) {
        deptConditions.push({
          department: {
            name: {
              equals: targetDept?.name,
            },
          },
        });
        deptConditions.push({
          name: {
            equals: targetDept?.name,
          },
        });
      }

      if (where.OR) {
        where.AND = [
          { OR: [{ branchId }, { branchId: null }] },
          { OR: deptConditions },
        ];
        delete where.OR;
      } else {
        where.OR = deptConditions;
      }
    }

    return this.prisma.costCenter.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
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
    let code = dto.code;
    const existing = await this.prisma.costCenter.findUnique({
      where: { code },
    });
    if (existing) {
      if (code.startsWith('CC-')) {
        const allCCs = await this.prisma.costCenter.findMany({ select: { code: true } });
        const existingCodes = new Set(allCCs.map((c) => c.code));
        let count = allCCs.length + 101;
        let nextCode = `CC-${count}`;
        while (existingCodes.has(nextCode)) {
          count++;
          nextCode = `CC-${count}`;
        }
        code = nextCode;
      } else {
        throw new ConflictException(`Cost Center code '${dto.code}' already exists.`);
      }
    }

    return this.prisma.costCenter.create({
      data: {
        companyId:         dto.companyId,
        code,
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
