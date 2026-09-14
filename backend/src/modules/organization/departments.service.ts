import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  list(companyId?: string, branchId?: string) {
    let branchWhere: any = {};
    if (branchId === 'HEAD_OFFICE' || branchId === 'NONE') {
      branchWhere = { branchId: null };
    } else if (branchId && branchId !== 'ALL' && branchId !== 'ALL_BRANCHES') {
      branchWhere = { branchId };
    }

    return this.prisma.department.findMany({
      where: {
        ...(companyId ? { companyId } : {}),
        ...branchWhere,
      },
      include: {
        parentDepartment: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true, code: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        parentDepartment: { select: { id: true, name: true } },
        childDepartments: true,
        branch: { select: { id: true, name: true, code: true } },
      },
    });
    if (!department) throw new NotFoundException('Department not found');
    return department;
  }

  async create(dto: CreateDepartmentDto) {
    const cleanBranchId =
      dto.branchId && dto.branchId !== 'NONE' && dto.branchId.trim()
        ? dto.branchId.trim()
        : null;
    const cleanCode = dto.code.trim();
    const cleanName = dto.name.trim();

    // 1. Scoped uniqueness check for department code within Company + Branch
    const existingCode = await this.prisma.department.findFirst({
      where: {
        companyId: dto.companyId,
        branchId: cleanBranchId,
        code: cleanCode,
      },
    });
    if (existingCode) {
      throw new ConflictException(
        'Department code already exists for this company and branch.',
      );
    }

    // 2. Scoped uniqueness check for department name within Company + Branch
    const existingName = await this.prisma.department.findFirst({
      where: {
        companyId: dto.companyId,
        branchId: cleanBranchId,
        name: cleanName,
      },
    });
    if (existingName) {
      throw new ConflictException(
        'A department with this name already exists for this company and branch.',
      );
    }

    const { effectiveFrom, ...rest } = dto;
    return this.prisma.department.create({
      data: {
        ...rest,
        branchId: cleanBranchId,
        code: cleanCode,
        name: cleanName,
        parentDepartmentId: dto.parentDepartmentId || null,
        manager: dto.manager || null,
        costCenter: dto.costCenter || null,
        description: dto.description || null,
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : undefined,
      },
      include: {
        parentDepartment: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    const dept = await this.findById(id);

    const effectiveCompanyId = dto.companyId ?? dept.companyId;
    let effectiveBranchId: string | null = dept.branchId;
    if (dto.branchId !== undefined) {
      effectiveBranchId =
        dto.branchId && dto.branchId !== 'NONE' && dto.branchId.trim()
          ? dto.branchId.trim()
          : null;
    }

    const checkCode = dto.code ? dto.code.trim() : dept.code;
    const checkName = dto.name ? dto.name.trim() : dept.name;

    // 1. Scoped uniqueness check for department code within Company + Branch (excluding self)
    if (dto.code !== undefined || dto.branchId !== undefined) {
      const duplicateCode = await this.prisma.department.findFirst({
        where: {
          companyId: effectiveCompanyId,
          branchId: effectiveBranchId,
          code: checkCode,
          id: { not: id },
        },
      });
      if (duplicateCode) {
        throw new ConflictException(
          'Department code already exists for this company and branch.',
        );
      }
    }

    // 2. Scoped uniqueness check for department name within Company + Branch (excluding self)
    if (dto.name !== undefined || dto.branchId !== undefined) {
      const duplicateName = await this.prisma.department.findFirst({
        where: {
          companyId: effectiveCompanyId,
          branchId: effectiveBranchId,
          name: checkName,
          id: { not: id },
        },
      });
      if (duplicateName) {
        throw new ConflictException(
          'A department with this name already exists for this company and branch.',
        );
      }
    }

    const { effectiveFrom, branchId, code, name, ...rest } = dto;
    const updateData: any = { ...rest };

    if (branchId !== undefined) {
      updateData.branchId = effectiveBranchId;
    }
    if (code !== undefined) {
      updateData.code = checkCode;
    }
    if (name !== undefined) {
      updateData.name = checkName;
    }
    if (effectiveFrom) {
      updateData.effectiveFrom = new Date(effectiveFrom);
    }
    if (dto.parentDepartmentId !== undefined) {
      updateData.parentDepartmentId = dto.parentDepartmentId || null;
    }
    if (dto.manager !== undefined) {
      updateData.manager = dto.manager || null;
    }
    if (dto.costCenter !== undefined) {
      updateData.costCenter = dto.costCenter || null;
    }
    if (dto.description !== undefined) {
      updateData.description = dto.description || null;
    }

    return this.prisma.department.update({
      where: { id },
      data: updateData,
      include: {
        parentDepartment: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.department.delete({ where: { id } });
    return { success: true };
  }
}
