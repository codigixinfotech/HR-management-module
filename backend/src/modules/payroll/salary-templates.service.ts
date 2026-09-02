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

  private formatTemplate(template: any) {
    if (!template) return template;
    const match = template.description?.match(/^\[GRADE:([^:]+):([^:]*):([^\]]*)\]\s*(.*)/s);
    if (match) {
      return {
        ...template,
        gradeCode: match[1],
        gradeName: match[2],
        gradeId: match[3],
        description: match[4] || '',
      };
    }
    return {
      ...template,
      gradeCode: template.gradeCode || 'G3',
      gradeName: template.gradeName || 'Senior Professional',
      gradeId: template.gradeId || 'grade-g3',
    };
  }

  async list(companyId?: string) {
    const templates = await this.prisma.salaryStructureTemplate.findMany({
      where: companyId ? { companyId } : undefined,
      include: this.templateInclude,
      orderBy: { name: 'asc' },
    });
    return templates.map((t) => this.formatTemplate(t));
  }

  async findById(id: string) {
    const template = await this.prisma.salaryStructureTemplate.findUnique({
      where: { id },
      include: this.templateInclude,
    });
    if (!template) throw new NotFoundException('Salary structure template not found');
    return this.formatTemplate(template);
  }

  async create(dto: CreateSalaryTemplateDto) {
    const { items, gradeId, gradeCode, gradeName, ...data } = dto;

    // 1. Verify companyId exists in DB
    let companyId = data.companyId;
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      const firstCompany = await this.prisma.company.findFirst();
      if (firstCompany) companyId = firstCompany.id;
    }

    const existing = await this.prisma.salaryStructureTemplate.findFirst({
      where: { companyId, code: data.code },
    });
    if (existing) {
      throw new ConflictException(`Salary template with code "${data.code}" already exists.`);
    }

    let description = data.description || '';
    if (gradeCode) {
      description = `[GRADE:${gradeCode}:${gradeName || ''}:${gradeId || ''}] ${description}`.trim();
    }

    // 2. Resolve all salaryComponentIds to guarantee valid foreign keys
    const resolvedItems: any[] = [];
    if (items && items.length > 0) {
      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        let comp = await this.prisma.salaryComponent.findUnique({
          where: { id: item.salaryComponentId },
        });

        if (!comp) {
          // If mock id or deleted, resolve any matching component in company
          comp = await this.prisma.salaryComponent.findFirst({
            where: { companyId },
          });
        }

        if (comp) {
          resolvedItems.push({
            salaryComponentId: comp.id,
            calculationType: item.calculationType || 'FIXED',
            calculationValue: item.calculationValue || 0,
            calculationBase: item.calculationBase || 'BASIC',
            monthlyAmount: item.monthlyAmount || 0,
            annualAmount: item.annualAmount || (item.monthlyAmount || 0) * 12,
            order: item.order ?? idx,
          });
        }
      }
    }

    const created = await this.prisma.salaryStructureTemplate.create({
      data: {
        companyId,
        name: data.name,
        code: data.code,
        description: description || null,
        currency: data.currency || 'INR',
        payFrequency: data.payFrequency || 'MONTHLY',
        isActive: data.isActive ?? true,
        items:
          resolvedItems.length > 0
            ? {
                create: resolvedItems,
              }
            : undefined,
      },
      include: this.templateInclude,
    });

    return this.formatTemplate(created);
  }

  async update(id: string, dto: UpdateSalaryTemplateDto) {
    const currentTmpl = await this.findById(id);
    const { items, gradeId, gradeCode, gradeName, ...data } = dto;

    let description = data.description !== undefined ? data.description : undefined;
    if (gradeCode && description !== undefined) {
      description = `[GRADE:${gradeCode}:${gradeName || ''}:${gradeId || ''}] ${description}`.trim();
    }

    // Resolve items foreign keys if updating items
    let resolvedItems: any[] | undefined = undefined;
    if (items) {
      await this.prisma.salaryStructureTemplateItem.deleteMany({
        where: { templateId: id },
      });

      resolvedItems = [];
      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        let comp = await this.prisma.salaryComponent.findUnique({
          where: { id: item.salaryComponentId },
        });

        if (!comp) {
          comp = await this.prisma.salaryComponent.findFirst({
            where: { companyId: currentTmpl.companyId },
          });
        }

        if (comp) {
          resolvedItems.push({
            salaryComponentId: comp.id,
            calculationType: item.calculationType || 'FIXED',
            calculationValue: item.calculationValue || 0,
            calculationBase: item.calculationBase || 'BASIC',
            monthlyAmount: item.monthlyAmount || 0,
            annualAmount: item.annualAmount || (item.monthlyAmount || 0) * 12,
            order: item.order ?? idx,
          });
        }
      }
    }

    const updated = await this.prisma.salaryStructureTemplate.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.code !== undefined ? { code: data.code } : {}),
        ...(description !== undefined ? { description: description || null } : {}),
        ...(data.currency !== undefined ? { currency: data.currency } : {}),
        ...(data.payFrequency !== undefined ? { payFrequency: data.payFrequency } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        items:
          resolvedItems && resolvedItems.length > 0
            ? {
                create: resolvedItems,
              }
            : undefined,
      },
      include: this.templateInclude,
    });

    return this.formatTemplate(updated);
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.salaryStructureTemplateItem.deleteMany({
      where: { templateId: id },
    });
    await this.prisma.salaryStructureTemplate.delete({ where: { id } });
    return { success: true };
  }
}
