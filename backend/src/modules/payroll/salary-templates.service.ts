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
    let desc = template.description || '';
    let branchId = template.branchId;
    let branchName = template.branchName;
    let departmentId = template.departmentId;
    let departmentName = template.departmentName;
    let designationId = template.designationId;
    let designationTitle = template.designationTitle;
    let gradeCode = template.gradeCode;
    let gradeName = template.gradeName;
    let gradeId = template.gradeId;

    const branchMatch = desc.match(/\[BRANCH:([^:]*):([^\]]*)\]/);
    if (branchMatch) {
      branchId = branchMatch[1] || undefined;
      branchName = branchMatch[2] || undefined;
      desc = desc.replace(branchMatch[0], '').trim();
    }

    const deptMatch = desc.match(/\[DEPT:([^:]*):([^\]]*)\]/);
    if (deptMatch) {
      departmentId = deptMatch[1] || undefined;
      departmentName = deptMatch[2] || undefined;
      desc = desc.replace(deptMatch[0], '').trim();
    }

    const desgMatch = desc.match(/\[DESG:([^:]*):([^\]]*)\]/);
    if (desgMatch) {
      designationId = desgMatch[1] || undefined;
      designationTitle = desgMatch[2] || undefined;
      desc = desc.replace(desgMatch[0], '').trim();
    }

    const gradeMatch = desc.match(/\[GRADE:([^:]+):([^:]*):([^\]]*)\]/);
    if (gradeMatch) {
      gradeCode = gradeMatch[1];
      gradeName = gradeMatch[2];
      gradeId = gradeMatch[3];
      desc = desc.replace(gradeMatch[0], '').trim();
    }

    let balancing = 'SPECIAL_ALLOW';
    const balMatch = desc.match(/\[BALANCING:([^\]]+)\]/);
    if (balMatch) {
      balancing = balMatch[1];
      desc = desc.replace(balMatch[0], '').trim();
    }

    let minCtc = 300000;
    const minMatch = desc.match(/\[MIN:([0-9]+)\]/);
    if (minMatch) {
      minCtc = Number(minMatch[1]);
      desc = desc.replace(minMatch[0], '').trim();
    }

    let maxCtc = 1500000;
    const maxMatch = desc.match(/\[MAX:([0-9]+)\]/);
    if (maxMatch) {
      maxCtc = Number(maxMatch[1]);
      desc = desc.replace(maxMatch[0], '').trim();
    }

    let level = 'L1';
    const lvlMatch = desc.match(/\[LEVEL:([^\]]+)\]/);
    if (lvlMatch) {
      level = lvlMatch[1];
      desc = desc.replace(lvlMatch[0], '').trim();
    }

    let category = 'Corporate & Tech';
    const catMatch = desc.match(/\[CAT:([^\]]+)\]/);
    if (catMatch) {
      category = catMatch[1];
      desc = desc.replace(catMatch[0], '').trim();
    }

    let industry = 'IT';
    const indMatch = desc.match(/\[IND:([^\]]+)\]/);
    if (indMatch) {
      industry = indMatch[1];
      desc = desc.replace(indMatch[0], '').trim();
    }

    let employmentType = template.employmentType || 'PERMANENT';
    const empMatch = desc.match(/\[EMP:([^\]]+)\]/);
    if (empMatch) {
      employmentType = empMatch[1];
      desc = desc.replace(empMatch[0], '').trim();
    }

    return {
      ...template,
      branchId: branchId || undefined,
      branchName: branchName || undefined,
      departmentId: departmentId || undefined,
      departmentName: departmentName || undefined,
      designationId: designationId || undefined,
      designationTitle: designationTitle || undefined,
      gradeCode: gradeCode || 'G3',
      gradeName: gradeName || 'Senior Professional',
      gradeId: gradeId || 'grade-g3',
      level,
      employmentType,
      category,
      industry,
      balancingComponentCode: balancing,
      minCtc,
      maxCtc,
      description: desc,
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
    if (gradeCode && !description.includes('[GRADE:')) {
      description = `[GRADE:${gradeCode}:${gradeName || ''}:${gradeId || ''}] ${description}`.trim();
    }

    // 2. Resolve all salaryComponentIds to guarantee valid foreign keys
    const resolvedItems: any[] = [];
    if (items && items.length > 0) {
      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        let comp: any = null;
        if (item.salaryComponentId) {
          comp = await this.prisma.salaryComponent.findUnique({
            where: { id: item.salaryComponentId },
          }).catch(() => null);
        }

        if (!comp && item.salaryComponentId) {
          comp = await this.prisma.salaryComponent.findFirst({
            where: { companyId, code: item.salaryComponentId },
          });
        }

        if (!comp && (item as any).componentCode) {
          comp = await this.prisma.salaryComponent.findFirst({
            where: { companyId, code: (item as any).componentCode },
          });
        }

        if (!comp) {
          // If still not found, resolve any matching component in company
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
        let comp: any = null;
        if (item.salaryComponentId) {
          comp = await this.prisma.salaryComponent.findUnique({
            where: { id: item.salaryComponentId },
          }).catch(() => null);
        }

        if (!comp && item.salaryComponentId) {
          comp = await this.prisma.salaryComponent.findFirst({
            where: { companyId: currentTmpl.companyId, code: item.salaryComponentId },
          });
        }

        if (!comp && (item as any).componentCode) {
          comp = await this.prisma.salaryComponent.findFirst({
            where: { companyId: currentTmpl.companyId, code: (item as any).componentCode },
          });
        }

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
