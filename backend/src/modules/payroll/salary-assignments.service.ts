import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateSalaryAssignmentDto, UpdateSalaryAssignmentDto } from './dto/salary-assignment.dto';

@Injectable()
export class SalaryAssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly assignmentInclude = {
    employee: {
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        dateOfJoining: true,
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, title: true } },
      },
    },
    template: {
      select: { id: true, name: true, code: true },
    },
    details: {
      include: { salaryComponent: true },
    },
  };

  list(companyId?: string, employeeId?: string, status?: string) {
    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;

    return this.prisma.employeeSalaryAssignment.findMany({
      where,
      include: this.assignmentInclude,
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  async findById(id: string) {
    const assignment = await this.prisma.employeeSalaryAssignment.findUnique({
      where: { id },
      include: this.assignmentInclude,
    });
    if (!assignment) throw new NotFoundException('Salary assignment not found');
    return assignment;
  }

  async assign(dto: CreateSalaryAssignmentDto) {
    // Check if there is an existing ACTIVE assignment for this employee
    const existingActive = await this.prisma.employeeSalaryAssignment.findFirst({
      where: {
        employeeId: dto.employeeId,
        status: 'ACTIVE',
      },
      orderBy: { effectiveFrom: 'desc' },
    });

    // If an active assignment exists, calculate revision metrics and mark historical if effectiveFrom date matches or supersedes
    let previousCtc = dto.previousCtc;
    let increasePercentage = dto.increasePercentage;

    if (existingActive) {
      if (!previousCtc) previousCtc = existingActive.annualCtc;
      if (!increasePercentage && previousCtc > 0) {
        increasePercentage = Math.round(((dto.annualCtc - previousCtc) / previousCtc) * 10000) / 100;
      }

      // Transition existing active assignment status to HISTORICAL
      await this.prisma.employeeSalaryAssignment.update({
        where: { id: existingActive.id },
        data: {
          status: 'HISTORICAL',
          effectiveTo: new Date(dto.effectiveFrom),
        },
      });
    }

    const { details, ...data } = dto;

    const assignment = await this.prisma.employeeSalaryAssignment.create({
      data: {
        ...data,
        effectiveFrom: new Date(dto.effectiveFrom),
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : undefined,
        status: dto.status || 'ACTIVE',
        previousCtc,
        newCtc: dto.annualCtc,
        increasePercentage,
        details: details
          ? {
              create: details.map((d) => ({
                salaryComponentId: d.salaryComponentId,
                monthlyAmount: d.monthlyAmount,
                annualAmount: d.annualAmount || d.monthlyAmount * 12,
                calculationType: d.calculationType || 'FIXED',
                calculationValue: d.calculationValue || 0,
              })),
            }
          : undefined,
      },
      include: this.assignmentInclude,
    });

    // Also sync to legacy employee_salary_components for 100% backward compatibility
    if (details && details.length > 0) {
      for (const d of details) {
        await this.prisma.employeeSalaryComponent.upsert({
          where: {
            employeeId_salaryComponentId: {
              employeeId: dto.employeeId,
              salaryComponentId: d.salaryComponentId,
            },
          },
          update: {
            monthlyAmount: d.monthlyAmount,
            effectiveFrom: new Date(dto.effectiveFrom),
          },
          create: {
            employeeId: dto.employeeId,
            salaryComponentId: d.salaryComponentId,
            monthlyAmount: d.monthlyAmount,
            effectiveFrom: new Date(dto.effectiveFrom),
          },
        });
      }
    }

    // Auto-sync to Employee Master model
    await this.syncToEmployee(dto.employeeId, dto);

    return assignment;
  }

  private async syncToEmployee(employeeId: string, dto: any) {
    try {
      let basicSalary = 0;
      let hra = 0;
      let conveyance = 0;
      let specialAllowance = 0;
      let otherAllowances = 0;
      let grossSalary = 0;
      let totalDeductions = 0;

      // Prefer details that already have salaryComponent relation loaded (e.g. from DB fetch)
      let detailsToProcess = dto.details || [];

      // If details don't have salaryComponent info, fetch from DB assignment's details
      if (detailsToProcess.length > 0 && !detailsToProcess[0].salaryComponent) {
        // Fetch all components in one query
        const componentIds = detailsToProcess
          .map((d: any) => d.salaryComponentId)
          .filter(Boolean);
        const dbComponents = componentIds.length > 0
          ? await this.prisma.salaryComponent.findMany({ where: { id: { in: componentIds } } })
          : [];
        const compMap = new Map(dbComponents.map((c: any) => [c.id, c]));
        detailsToProcess = detailsToProcess.map((d: any) => ({
          ...d,
          salaryComponent: compMap.get(d.salaryComponentId) || null,
        }));
      }

      for (const d of detailsToProcess) {
        const comp = d.salaryComponent;
        const code = (comp?.code || '').toUpperCase().trim();
        const name = (comp?.name || d.name || '').toLowerCase().trim();
        const type = (comp?.type || d.type || 'EARNING').toUpperCase();
        const amt = Number(d.monthlyAmount) || 0;

        if (type === 'EARNING') {
          grossSalary += amt;
          if (code === 'BASIC' || name.includes('basic')) {
            basicSalary += amt;
          } else if (code === 'HRA' || name.includes('house rent') || name.includes('hra')) {
            hra += amt;
          } else if (code === 'CONVEYANCE' || name.includes('conveyance')) {
            conveyance += amt;
          } else if (code === 'SPECIAL' || code === 'SA' || name.includes('special')) {
            specialAllowance += amt;
          } else {
            otherAllowances += amt;
          }
        } else if (type === 'DEDUCTION') {
          totalDeductions += amt;
        }
      }

      let templateName: string | undefined;
      if (dto.templateId) {
        const tmpl = await this.prisma.salaryStructureTemplate.findUnique({
          where: { id: dto.templateId },
        });
        templateName = tmpl?.name || tmpl?.code;
      }

      await this.prisma.employee.update({
        where: { id: employeeId },
        data: {
          annualCtc: Number(dto.annualCtc),
          grossSalary: grossSalary > 0 ? grossSalary : Number(dto.monthlyCtc || 0),
          basicSalary: basicSalary > 0 ? basicSalary : Math.round(Number(dto.monthlyCtc || 0) * 0.5),
          hra: hra > 0 ? hra : 0,
          conveyance: conveyance > 0 ? conveyance : 0,
          specialAllowance: specialAllowance > 0 ? specialAllowance : 0,
          otherAllowances: otherAllowances > 0 ? otherAllowances : 0,
          salaryEffectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : undefined,
          salaryGrade: templateName || undefined,
        },
      });
    } catch (e) {
      // Non-blocking sync
      console.warn('syncToEmployee failed silently:', e);
    }
  }

  async listRevisions(companyId?: string) {
    return this.prisma.employeeSalaryAssignment.findMany({
      where: companyId
        ? { companyId, previousCtc: { not: null } }
        : { previousCtc: { not: null } },
      include: this.assignmentInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, dto: UpdateSalaryAssignmentDto) {
    await this.findById(id);
    const { details, ...data } = dto;

    if (details) {
      await this.prisma.employeeSalaryComponentDetail.deleteMany({
        where: { assignmentId: id },
      });
    }

    const updated = await this.prisma.employeeSalaryAssignment.update({
      where: { id },
      data: {
        ...(data.annualCtc !== undefined ? { annualCtc: data.annualCtc } : {}),
        ...(data.monthlyCtc !== undefined ? { monthlyCtc: data.monthlyCtc } : {}),
        ...(data.grossSalary !== undefined ? { grossSalary: data.grossSalary } : {}),
        ...(data.netSalary !== undefined ? { netSalary: data.netSalary } : {}),
        ...(data.templateId !== undefined ? { templateId: data.templateId || null } : {}),
        ...(data.effectiveFrom ? { effectiveFrom: new Date(data.effectiveFrom) } : {}),
        ...(data.effectiveTo !== undefined ? { effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null } : {}),
        ...(data.status ? { status: data.status } : {}),
        ...(data.revisionReason !== undefined ? { revisionReason: data.revisionReason } : {}),
        ...(data.previousCtc !== undefined ? { previousCtc: data.previousCtc } : {}),
        ...(data.newCtc !== undefined ? { newCtc: data.newCtc } : {}),
        ...(data.increasePercentage !== undefined ? { increasePercentage: data.increasePercentage } : {}),
        details: details
          ? {
              create: details.map((d) => ({
                salaryComponentId: d.salaryComponentId,
                monthlyAmount: d.monthlyAmount,
                annualAmount: d.annualAmount || d.monthlyAmount * 12,
                calculationType: d.calculationType || 'FIXED',
                calculationValue: d.calculationValue || 0,
              })),
            }
          : undefined,
      },
      include: this.assignmentInclude,
    });

    await this.syncToEmployee(updated.employeeId, { ...updated, details: dto.details });

    return updated;
  }

  async remove(id: string) {
    const assignment = await this.findById(id);

    // Delete child detail records first
    await this.prisma.employeeSalaryComponentDetail.deleteMany({
      where: { assignmentId: id },
    });

    // Delete the assignment
    await this.prisma.employeeSalaryAssignment.delete({
      where: { id },
    });

    // If deleted was active, reactivate latest historical assignment if available
    if (assignment.status === 'ACTIVE') {
      const latestHistorical = await this.prisma.employeeSalaryAssignment.findFirst({
        where: { employeeId: assignment.employeeId },
        orderBy: { effectiveFrom: 'desc' },
      });
      if (latestHistorical) {
        await this.prisma.employeeSalaryAssignment.update({
          where: { id: latestHistorical.id },
          data: { status: 'ACTIVE', effectiveTo: null },
        });
      }
    }

    return { success: true, message: 'Salary assignment deleted successfully' };
  }
}
