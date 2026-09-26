import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateDesignationDto,
  UpdateDesignationDto,
} from './dto/designation.dto';

@Injectable()
export class DesignationsService {
  constructor(private readonly prisma: PrismaService) { }

  list(companyId?: string, departmentId?: string, branchId?: string) {
    let branchWhere: any = {};
    if (branchId === 'HEAD_OFFICE' || branchId === 'NONE') {
      branchWhere = { branchId: null };
    } else if (branchId && branchId !== 'ALL' && branchId !== 'ALL_BRANCHES') {
      branchWhere = { branchId };
    }

    return this.prisma.designation.findMany({
      where: {
        ...(companyId ? { companyId } : {}),
        ...(departmentId ? { departmentId } : {}),
        ...branchWhere,
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        department: {
          select: {
            id: true,
            name: true,
            branchId: true,
            branch: { select: { id: true, name: true, code: true } },
          },
        },
        reportingDesignation: { select: { id: true, title: true } },
        payGrade: {
          select: {
            id: true,
            gradeCode: true,
            gradeName: true,
            level: true,
            category: true,
            branchId: true,
            departmentId: true,
            minSalary: true,
            maxSalary: true,
            currency: true,
            branch: { select: { id: true, name: true, code: true } },
            department: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { title: 'asc' },
    });
  }

  async findById(id: string) {
    const designation = await this.prisma.designation.findUnique({
      where: { id },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        department: {
          select: {
            id: true,
            name: true,
            branchId: true,
            branch: { select: { id: true, name: true, code: true } },
          },
        },
        reportingDesignation: { select: { id: true, title: true } },
        payGrade: {
          select: {
            id: true,
            gradeCode: true,
            gradeName: true,
            level: true,
            category: true,
            branchId: true,
            departmentId: true,
            minSalary: true,
            maxSalary: true,
            currency: true,
            branch: { select: { id: true, name: true, code: true } },
            department: { select: { id: true, name: true } },
          },
        },
      },
    });
    if (!designation) throw new NotFoundException('Designation not found');
    return designation;
  }

  async create(dto: CreateDesignationDto) {
    const { departmentId, reportingDesignationId, effectiveFrom, gradeId, branchId, ...rest } = dto;
    const cleanDepartmentId = departmentId && departmentId !== 'none' ? departmentId : null;
    const cleanReportingId = reportingDesignationId && reportingDesignationId !== 'none' ? reportingDesignationId : null;
    const cleanGradeId = gradeId && gradeId !== 'none' && gradeId !== '' ? gradeId : null;

    // Resolve branchId (explicit or inherited from department)
    let cleanBranchId: string | null = null;
    if (branchId && branchId !== 'HEAD_OFFICE' && branchId !== 'NONE') {
      cleanBranchId = branchId.trim();
    } else if (cleanDepartmentId) {
      const dept = await this.prisma.department.findUnique({
        where: { id: cleanDepartmentId },
        select: { branchId: true },
      });
      cleanBranchId = dept?.branchId ?? null;
    }

    const cleanTitle = dto.title.trim();
    const cleanCode = dto.code.trim();

    // 1. Scoped duplicate check: Title within SAME Company + SAME Branch
    const existingTitle = await this.prisma.designation.findFirst({
      where: {
        companyId: dto.companyId,
        branchId: cleanBranchId,
        title: { equals: cleanTitle },
      },
    });
    if (existingTitle) {
      throw new ConflictException(
        `${cleanTitle} already exists in this ${cleanBranchId ? 'branch' : 'Head Office'}`,
      );
    }

    // 2. Scoped duplicate check: Code within SAME Company + SAME Branch
    const existingCode = await this.prisma.designation.findFirst({
      where: {
        companyId: dto.companyId,
        branchId: cleanBranchId,
        code: cleanCode,
      },
    });
    if (existingCode) {
      throw new ConflictException(
        `A designation with code "${cleanCode}" already exists in this ${cleanBranchId ? 'branch' : 'Head Office'}`,
      );
    }

    return this.prisma.designation.create({
      data: {
        ...rest,
        title: cleanTitle,
        code: cleanCode,
        branchId: cleanBranchId,
        departmentId: cleanDepartmentId,
        reportingDesignationId: cleanReportingId,
        gradeId: cleanGradeId,
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : undefined,
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        department: { select: { id: true, name: true } },
        reportingDesignation: { select: { id: true, title: true } },
        payGrade: {
          select: {
            id: true,
            gradeCode: true,
            gradeName: true,
            level: true,
            category: true,
            minSalary: true,
            maxSalary: true,
            currency: true,
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateDesignationDto) {
    const current = await this.findById(id);
    const { departmentId, reportingDesignationId, effectiveFrom, gradeId, branchId, ...rest } = dto;
    const data: any = { ...rest };

    let targetBranchId = current.branchId;
    if (branchId !== undefined) {
      targetBranchId = (branchId && branchId !== 'HEAD_OFFICE' && branchId !== 'NONE') ? branchId.trim() : null;
      data.branchId = targetBranchId;
    }

    if (departmentId !== undefined) {
      data.departmentId = departmentId && departmentId !== 'none' ? departmentId : null;
      if (branchId === undefined && data.departmentId) {
        const dept = await this.prisma.department.findUnique({
          where: { id: data.departmentId },
          select: { branchId: true },
        });
        if (dept) {
          targetBranchId = dept.branchId ?? null;
          data.branchId = targetBranchId;
        }
      }
    }

    if (dto.title !== undefined) {
      const cleanTitle = dto.title.trim();
      const existingTitle = await this.prisma.designation.findFirst({
        where: {
          id: { not: id },
          companyId: current.companyId,
          branchId: targetBranchId,
          title: { equals: cleanTitle },
        },
      });
      if (existingTitle) {
        throw new ConflictException(
          `${cleanTitle} already exists in this ${targetBranchId ? 'branch' : 'Head Office'}`,
        );
      }
      data.title = cleanTitle;
    }

    if (dto.code !== undefined) {
      const cleanCode = dto.code.trim();
      const existingCode = await this.prisma.designation.findFirst({
        where: {
          id: { not: id },
          companyId: current.companyId,
          branchId: targetBranchId,
          code: cleanCode,
        },
      });
      if (existingCode) {
        throw new ConflictException(
          `A designation with code "${cleanCode}" already exists in this ${targetBranchId ? 'branch' : 'Head Office'}`,
        );
      }
      data.code = cleanCode;
    }

    if (reportingDesignationId !== undefined) {
      data.reportingDesignationId = reportingDesignationId && reportingDesignationId !== 'none' ? reportingDesignationId : null;
    }
    if (gradeId !== undefined) {
      data.gradeId = gradeId && gradeId !== 'none' && gradeId !== '' ? gradeId : null;
    }
    if (effectiveFrom) {
      data.effectiveFrom = new Date(effectiveFrom);
    }

    return this.prisma.designation.update({
      where: { id },
      data,
      include: {
        branch: { select: { id: true, name: true, code: true } },
        department: { select: { id: true, name: true } },
        reportingDesignation: { select: { id: true, title: true } },
        payGrade: {
          select: {
            id: true,
            gradeCode: true,
            gradeName: true,
            level: true,
            category: true,
            minSalary: true,
            maxSalary: true,
            currency: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.designation.delete({ where: { id } });
    return { success: true };
  }
}
