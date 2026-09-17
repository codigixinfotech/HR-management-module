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

  list(companyId?: string, departmentId?: string) {
    return this.prisma.designation.findMany({
      where: {
        ...(companyId ? { companyId } : {}),
        ...(departmentId ? { departmentId } : {}),
      },
      include: {
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
    const existing = await this.prisma.designation.findFirst({
      where: { companyId: dto.companyId, code: dto.code },
    });
    if (existing)
      throw new ConflictException(
        'A designation with this code already exists for this company',
      );

    const { departmentId, reportingDesignationId, effectiveFrom, gradeId, ...rest } = dto;
    const cleanDepartmentId = departmentId && departmentId !== 'none' ? departmentId : null;
    const cleanReportingId = reportingDesignationId && reportingDesignationId !== 'none' ? reportingDesignationId : null;
    const cleanGradeId = gradeId && gradeId !== 'none' && gradeId !== '' ? gradeId : null;

    return this.prisma.designation.create({
      data: {
        ...rest,
        departmentId: cleanDepartmentId,
        reportingDesignationId: cleanReportingId,
        gradeId: cleanGradeId,
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : undefined,
      },
      include: {
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
    await this.findById(id);
    const { departmentId, reportingDesignationId, effectiveFrom, gradeId, ...rest } = dto;
    const data: any = { ...rest };

    if (departmentId !== undefined) {
      data.departmentId = departmentId && departmentId !== 'none' ? departmentId : null;
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
