import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AssignSalaryComponentDto } from './dto/employee-salary-component.dto';

@Injectable()
export class SalaryStructureService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly listInclude = {
    salaryComponent: {
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
        isStatutory: true,
      },
    },
  };

  list(employeeId: string) {
    return this.prisma.employeeSalaryComponent.findMany({
      where: { employeeId },
      include: this.listInclude,
      orderBy: { createdAt: 'asc' },
    });
  }

  assign(dto: AssignSalaryComponentDto) {
    return this.prisma.employeeSalaryComponent.upsert({
      where: {
        employeeId_salaryComponentId: {
          employeeId: dto.employeeId,
          salaryComponentId: dto.salaryComponentId,
        },
      },
      update: {
        monthlyAmount: dto.monthlyAmount,
        effectiveFrom: new Date(dto.effectiveFrom),
      },
      create: {
        employeeId: dto.employeeId,
        salaryComponentId: dto.salaryComponentId,
        monthlyAmount: dto.monthlyAmount,
        effectiveFrom: new Date(dto.effectiveFrom),
      },
      include: this.listInclude,
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.employeeSalaryComponent.findUnique({
      where: { id },
    });
    if (!existing)
      throw new NotFoundException('Salary structure entry not found');
    await this.prisma.employeeSalaryComponent.delete({ where: { id } });
    return { success: true };
  }
}
