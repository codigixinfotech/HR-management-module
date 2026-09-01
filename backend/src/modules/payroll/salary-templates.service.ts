import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateSalaryTemplateDto, UpdateSalaryTemplateDto } from './dto/salary-template.dto';

@Injectable()
export class SalaryTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly templateInclude = {
    items: {
      include: {
        salaryComponent: true,
      },
      orderBy: { order: 'asc' as const },
    },
  };

  list(companyId?: string) {
    return this.prisma.salaryStructureTemplate.findMany({
      where: companyId ? { companyId } : undefined,
      include: this.templateInclude,
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const template = await this.prisma.salaryStructureTemplate.findUnique({
      where: { id },
      include: this.templateInclude,
    });
    if (!template) throw new NotFoundException('Salary structure template not found');
    return template;
  }

  async create(dto: CreateSalaryTemplateDto) {
    const existing = await this.prisma.salaryStructureTemplate.findFirst({
      where: { companyId: dto.companyId, code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`Salary template with code "${dto.code}" already exists.`);
    }

    const { items, ...data } = dto;

    return this.prisma.salaryStructureTemplate.create({
      data: {
        ...data,
        items: items
          ? {
              create: items.map((item, idx) => ({
                salaryComponentId: item.salaryComponentId,
                calculationType: item.calculationType || 'FIXED',
                calculationValue: item.calculationValue || 0,
                calculationBase: item.calculationBase || 'BASIC',
                monthlyAmount: item.monthlyAmount || 0,
                annualAmount: item.annualAmount || (item.monthlyAmount || 0) * 12,
                order: item.order ?? idx,
              })),
            }
          : undefined,
      },
      include: this.templateInclude,
    });
  }

  async update(id: string, dto: UpdateSalaryTemplateDto) {
    await this.findById(id);
    const { items, ...data } = dto;

    if (items) {
      // Clear existing items and recreate
      await this.prisma.salaryStructureTemplateItem.deleteMany({
        where: { templateId: id },
      });
    }

    return this.prisma.salaryStructureTemplate.update({
      where: { id },
      data: {
        ...data,
        items: items
          ? {
              create: items.map((item, idx) => ({
                salaryComponentId: item.salaryComponentId,
                calculationType: item.calculationType || 'FIXED',
                calculationValue: item.calculationValue || 0,
                calculationBase: item.calculationBase || 'BASIC',
                monthlyAmount: item.monthlyAmount || 0,
                annualAmount: item.annualAmount || (item.monthlyAmount || 0) * 12,
                order: item.order ?? idx,
              })),
            }
          : undefined,
      },
      include: this.templateInclude,
    });
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.salaryStructureTemplate.delete({ where: { id } });
    return { success: true };
  }
}
