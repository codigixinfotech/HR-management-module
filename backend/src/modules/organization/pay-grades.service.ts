import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePayGradeDto, UpdatePayGradeDto } from './dto/pay-grade.dto';

@Injectable()
export class PayGradesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(companyId?: string, branchId?: string) {
    const where: any = {};

    if (companyId) {
      where.companyId = companyId;
    }

    if (branchId && branchId !== 'NO_BRANCH_ASSIGNED') {
      // Branch-scoped users see only their branch grades (plus grades with no branch assignment)
      where.OR = [{ branchId }, { branchId: null }];
    }

    return this.prisma.payGrade.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        department: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
      orderBy: { level: 'asc' },
    });
  }

  async findOne(id: string) {
    const grade = await this.prisma.payGrade.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
    });
    if (!grade) throw new NotFoundException(`Pay Grade ${id} not found`);
    return grade;
  }

  /**
   * Validates that a department belongs to the specified company and branch.
   * Used to prevent cross-branch department injection on create/update.
   */
  async isDepartmentInScope(
    departmentId: string,
    companyId: string,
    branchId?: string | null,
  ): Promise<boolean> {
    const dept = await this.prisma.department.findUnique({
      where: { id: departmentId },
      select: { id: true, companyId: true, branchId: true },
    });

    if (!dept) return false;
    if (dept.companyId !== companyId) return false;

    // If the user has a specific branch, the department must belong to that branch
    if (branchId) {
      return dept.branchId === branchId;
    }

    return true;
  }

  async create(dto: CreatePayGradeDto) {
    const existing = await this.prisma.payGrade.findUnique({
      where: { gradeCode: dto.gradeCode },
    });
    if (existing) {
      throw new ConflictException(`Job Grade code '${dto.gradeCode}' already exists.`);
    }

    return this.prisma.payGrade.create({
      data: {
        companyId:     dto.companyId,
        branchId:      dto.branchId || null,
        businessUnit:  dto.businessUnit || null,
        gradeCode:     dto.gradeCode,
        gradeName:     dto.gradeName,
        level:         dto.level ?? 'L1',
        category:      dto.category ?? 'Professional',
        jobFamily:     dto.jobFamily || null,
        departmentId:  dto.departmentId || null,
        minSalary:     dto.minSalary ?? 0,
        maxSalary:     dto.maxSalary ?? 0,
        currency:      dto.currency ?? 'INR',
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date(),
        description:   dto.description || null,
        isActive:      dto.isActive ?? true,
      },
      include: {
        department: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
    });
  }

  async update(id: string, dto: UpdatePayGradeDto) {
    await this.findOne(id);
    return this.prisma.payGrade.update({
      where: { id },
      data: {
        ...(dto.businessUnit  !== undefined && { businessUnit: dto.businessUnit || null }),
        ...(dto.gradeName     !== undefined && { gradeName: dto.gradeName }),
        ...(dto.level         !== undefined && { level: dto.level }),
        ...(dto.category      !== undefined && { category: dto.category }),
        ...(dto.jobFamily     !== undefined && { jobFamily: dto.jobFamily || null }),
        ...(dto.departmentId  !== undefined && { departmentId: dto.departmentId || null }),
        ...(dto.minSalary     !== undefined && { minSalary: dto.minSalary }),
        ...(dto.maxSalary     !== undefined && { maxSalary: dto.maxSalary }),
        ...(dto.currency      !== undefined && { currency: dto.currency }),
        ...(dto.effectiveFrom !== undefined && { effectiveFrom: new Date(dto.effectiveFrom) }),
        ...(dto.description   !== undefined && { description: dto.description || null }),
        ...(dto.isActive      !== undefined && { isActive: dto.isActive }),
      },
      include: {
        department: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.payGrade.delete({ where: { id } });
  }
}
