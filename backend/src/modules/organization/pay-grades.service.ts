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

    if (branchId === 'HEAD_OFFICE' || branchId === 'NONE') {
      where.branchId = null;
    } else if (branchId && branchId !== 'ALL' && branchId !== 'ALL_BRANCHES' && branchId !== 'NO_BRANCH_ASSIGNED') {
      // Show ONLY the specific branch's job grade entries
      where.branchId = branchId;
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

  /**
   * Helper to normalize/clean branch code for Job Grade formatting:
   * e.g., 'Br1' -> 'Br1', 'BR-01' / 'BR-1' -> 'Br1', 'BR-27' -> 'Br27', 'MUM' -> 'MUM'.
   */
  extractBranchCode(rawCode?: string | null): string {
    if (!rawCode || !rawCode.trim()) return 'BR';
    const trimmed = rawCode.trim();
    // If format is like BR-01 or BR-1 -> Br1, BR-02 -> Br2
    const brMatch = trimmed.match(/^BR-?0*([0-9]+)$/i);
    if (brMatch) {
      return `Br${brMatch[1]}`;
    }
    // If format is like Br1, Br01
    const brNumMatch = trimmed.match(/^Br0*([0-9]+)$/i);
    if (brNumMatch) {
      return `Br${brNumMatch[1]}`;
    }
    // If starts with BR- (e.g. BR-PUN)
    if (/^BR-/i.test(trimmed)) {
      return trimmed.replace(/^BR-/i, 'Br').replace(/[^a-zA-Z0-9]/g, '');
    }
    // Otherwise alphanumeric cleaned code
    return trimmed.replace(/[^a-zA-Z0-9]/g, '') || 'BR';
  }

  /**
   * Computes the next grade code following the rule:
   * GR-{BranchCode}-{Sequence}
   * Sequences restart for each branch independently (e.g. GR-Br1-01, GR-Br1-02; GR-Br2-01).
   */
  async generateNextGradeCode(branchId?: string, companyId?: string): Promise<string> {
    let branchCode = 'BR';
    let targetBranchId = branchId;

    if (targetBranchId && targetBranchId !== 'NO_BRANCH_ASSIGNED') {
      const branch = await this.prisma.branch.findUnique({
        where: { id: targetBranchId },
        select: { id: true, code: true, name: true, companyId: true },
      });
      if (branch && branch.code) {
        branchCode = this.extractBranchCode(branch.code);
      }
    } else if (companyId) {
      const branch = await this.prisma.branch.findFirst({
        where: { companyId },
        orderBy: { createdAt: 'asc' },
        select: { id: true, code: true, name: true },
      });
      if (branch) {
        targetBranchId = branch.id;
        if (branch.code) {
          branchCode = this.extractBranchCode(branch.code);
        }
      }
    }

    const prefix = `GR-${branchCode}-`;

    // Query existing grades for this branch or matching this prefix
    const existingGrades = await this.prisma.payGrade.findMany({
      where: {
        OR: [
          ...(targetBranchId ? [{ branchId: targetBranchId }] : []),
          { gradeCode: { startsWith: prefix } },
        ],
      },
      select: { gradeCode: true },
    });

    const seqRegex = new RegExp(`^GR-${branchCode}-(\\d+)$`, 'i');
    const sequences: number[] = [];

    for (const g of existingGrades) {
      const match = (g.gradeCode || '').match(seqRegex);
      if (match && match[1]) {
        sequences.push(parseInt(match[1], 10));
      }
    }

    const maxSeq = sequences.length > 0 ? Math.max(...sequences) : 0;
    let nextSeq = maxSeq + 1;
    let candidateCode = `${prefix}${String(nextSeq).padStart(2, '0')}`;

    // Guarantee global database uniqueness
    while (await this.prisma.payGrade.findUnique({ where: { gradeCode: candidateCode } })) {
      nextSeq++;
      candidateCode = `${prefix}${String(nextSeq).padStart(2, '0')}`;
    }

    return candidateCode;
  }

  async create(dto: CreatePayGradeDto) {
    // If gradeCode is empty or legacy generic 'GR-XX', auto-generate branch-isolated code
    if (!dto.gradeCode || /^GR-\d+$/i.test(dto.gradeCode.trim())) {
      dto.gradeCode = await this.generateNextGradeCode(dto.branchId, dto.companyId);
    }

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
