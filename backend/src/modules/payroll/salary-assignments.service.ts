import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateSalaryAssignmentDto } from './dto/salary-assignment.dto';

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

    return assignment;
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
}
