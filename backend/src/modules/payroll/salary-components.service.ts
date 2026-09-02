import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateSalaryComponentDto,
  UpdateSalaryComponentDto,
} from './dto/salary-component.dto';

@Injectable()
export class SalaryComponentsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly DEFAULT_14_MASTER_COMPONENTS = [
    {
      id: 'comp-basic',
      code: 'BASIC',
      name: 'Basic Salary',
      type: 'EARNING',
      category: 'Basic',
      description: 'Core basic salary component',
      calculationType: 'FIXED',
      calculationValue: 0,
      calculationBase: 'MANUAL',
      isStatutory: false,
      isTaxable: true,
      includeInGross: true,
      includeInCtc: true,
      isPfApplicable: true,
      isEsiApplicable: true,
      isPtApplicable: true,
      isTdsApplicable: true,
      showOnPayslip: true,
      isActive: true,
    },
    {
      id: 'comp-hra',
      code: 'HRA',
      name: 'House Rent Allowance',
      type: 'EARNING',
      category: 'Allowance',
      description: 'House rent allowance (Percentage of Basic)',
      calculationType: 'PERCENTAGE',
      calculationValue: 3.75,
      calculationBase: 'BASIC',
      isStatutory: false,
      isTaxable: true,
      includeInGross: true,
      includeInCtc: true,
      isPfApplicable: false,
      isEsiApplicable: false,
      isPtApplicable: true,
      isTdsApplicable: true,
      showOnPayslip: true,
      isActive: true,
    },
    {
      id: 'comp-conveyance',
      code: 'CONVEYANCE',
      name: 'Conveyance Allowance',
      type: 'EARNING',
      category: 'Allowance',
      description: 'Fixed conveyance & travel allowance',
      calculationType: 'FIXED',
      calculationValue: 3000,
      calculationBase: 'NONE',
      isStatutory: false,
      isTaxable: true,
      includeInGross: true,
      includeInCtc: true,
      isPfApplicable: false,
      isEsiApplicable: false,
      isPtApplicable: true,
      isTdsApplicable: true,
      showOnPayslip: true,
      isActive: true,
    },
    {
      id: 'comp-special',
      code: 'SPECIAL',
      name: 'Special Allowance',
      type: 'EARNING',
      category: 'Allowance',
      description: 'Special balancing allowance',
      calculationType: 'FIXED',
      calculationValue: 120,
      calculationBase: 'NONE',
      isStatutory: false,
      isTaxable: true,
      includeInGross: true,
      includeInCtc: true,
      isPfApplicable: false,
      isEsiApplicable: false,
      isPtApplicable: true,
      isTdsApplicable: true,
      showOnPayslip: true,
      isActive: true,
    },
    {
      id: 'comp-other-allow',
      code: 'OTHER_ALLOW',
      name: 'Other Allowance',
      type: 'EARNING',
      category: 'Allowance',
      description: 'Miscellaneous supplementary allowance',
      calculationType: 'FIXED',
      calculationValue: 1000,
      calculationBase: 'NONE',
      isStatutory: false,
      isTaxable: true,
      includeInGross: true,
      includeInCtc: true,
      isPfApplicable: false,
      isEsiApplicable: false,
      isPtApplicable: true,
      isTdsApplicable: true,
      showOnPayslip: true,
      isActive: true,
    },
    {
      id: 'comp-bonus',
      code: 'BONUS',
      name: 'Performance Bonus',
      type: 'EARNING',
      category: 'Variable',
      description: 'Conditional performance incentive (10% of Basic)',
      calculationType: 'PERCENTAGE',
      calculationValue: 10,
      calculationBase: 'BASIC',
      isStatutory: false,
      isTaxable: true,
      includeInGross: true,
      includeInCtc: true,
      isPfApplicable: false,
      isEsiApplicable: false,
      isPtApplicable: true,
      isTdsApplicable: true,
      showOnPayslip: true,
      isActive: true,
    },
    {
      id: 'comp-overtime',
      code: 'OVERTIME',
      name: 'Overtime Pay',
      type: 'EARNING',
      category: 'Variable',
      description: 'Approved Overtime Hours × Overtime Rate',
      calculationType: 'FORMULA',
      calculationValue: 0,
      calculationBase: 'OVERTIME_HOURS',
      formula: 'OVERTIME_HOURS * OVERTIME_RATE',
      isStatutory: false,
      isTaxable: true,
      includeInGross: true,
      includeInCtc: false,
      showOnPayslip: true,
      isActive: true,
    },
    {
      id: 'comp-pf',
      code: 'PF',
      name: 'Employee PF',
      type: 'DEDUCTION',
      category: 'Statutory',
      description: '12% of PF Wage (EPFO Compliance)',
      calculationType: 'PERCENTAGE',
      calculationValue: 12,
      calculationBase: 'PF_WAGE',
      isStatutory: true,
      isTaxable: false,
      includeInGross: false,
      includeInCtc: false,
      showOnPayslip: true,
      isActive: true,
    },
    {
      id: 'comp-esi',
      code: 'ESI',
      name: 'Employee ESI',
      type: 'DEDUCTION',
      category: 'Statutory',
      description: '0.75% of ESI Wage (ESIC Compliance)',
      calculationType: 'PERCENTAGE',
      calculationValue: 0.75,
      calculationBase: 'ESI_WAGE',
      isStatutory: true,
      isTaxable: false,
      includeInGross: false,
      includeInCtc: false,
      showOnPayslip: true,
      isActive: true,
    },
    {
      id: 'comp-pt',
      code: 'PT',
      name: 'Professional Tax',
      type: 'DEDUCTION',
      category: 'Statutory',
      description: 'State Professional Tax Slab Rule',
      calculationType: 'SLAB',
      calculationValue: 0,
      calculationBase: 'GROSS',
      isStatutory: true,
      isTaxable: false,
      includeInGross: false,
      includeInCtc: false,
      showOnPayslip: true,
      isActive: true,
    },
    {
      id: 'comp-tds',
      code: 'TDS',
      name: 'Income Tax (TDS)',
      type: 'DEDUCTION',
      category: 'Statutory',
      description: 'Monthly TDS deduction based on annual taxable income',
      calculationType: 'FORMULA',
      calculationValue: 0,
      calculationBase: 'ANNUAL_TAXABLE_INCOME',
      isStatutory: true,
      isTaxable: false,
      includeInGross: false,
      includeInCtc: false,
      showOnPayslip: true,
      isActive: true,
    },
    {
      id: 'comp-lop',
      code: 'LOP',
      name: 'Loss of Pay',
      type: 'DEDUCTION',
      category: 'Attendance',
      description: 'Attendance LOP deduction (Salary ÷ Payroll Days × LOP Days)',
      calculationType: 'PER_DAY',
      calculationValue: 0,
      calculationBase: 'ATTENDANCE',
      formula: 'SALARY / PAYROLL_DAYS * LOP_DAYS',
      isStatutory: false,
      isTaxable: false,
      includeInGross: false,
      includeInCtc: false,
      showOnPayslip: true,
      isActive: true,
    },
    {
      id: 'comp-loan',
      code: 'LOAN',
      name: 'Loan EMI',
      type: 'DEDUCTION',
      category: 'Loan',
      description: 'Employee loan EMI recovery schedule',
      calculationType: 'FIXED_SCHEDULE',
      calculationValue: 0,
      calculationBase: 'LOAN_SCHEDULE',
      isStatutory: false,
      isTaxable: false,
      includeInGross: false,
      includeInCtc: false,
      showOnPayslip: true,
      isActive: true,
    },
    {
      id: 'comp-advance',
      code: 'ADVANCE',
      name: 'Salary Advance',
      type: 'DEDUCTION',
      category: 'Advance',
      description: 'Salary advance recovery schedule',
      calculationType: 'FIXED_SCHEDULE',
      calculationValue: 0,
      calculationBase: 'ADVANCE_SCHEDULE',
      isStatutory: false,
      isTaxable: false,
      includeInGross: false,
      includeInCtc: false,
      showOnPayslip: true,
      isActive: true,
    },
  ];

  async list(companyId?: string, search?: string, type?: string) {
    if (companyId) {
      // Auto-seed missing master components into DB for this company so all components have valid database IDs!
      const existing = await this.prisma.salaryComponent.findMany({
        where: { companyId },
        select: { code: true },
      });
      const existingCodes = new Set(existing.map((e) => e.code));
      const missing = this.DEFAULT_14_MASTER_COMPONENTS.filter((m) => !existingCodes.has(m.code));

      if (missing.length > 0) {
        for (const m of missing) {
          const { id, ...data } = m;
          await this.prisma.salaryComponent
            .create({
              data: {
                ...data,
                type: data.type as any,
                companyId,
              } as any,
            })
            .catch(() => null);
        }
      }
    }

    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.salaryComponent.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const component = await this.prisma.salaryComponent.findUnique({
      where: { id },
    });
    if (!component) throw new NotFoundException('Salary component not found');
    return component;
  }

  async create(dto: CreateSalaryComponentDto) {
    const existing = await this.prisma.salaryComponent.findFirst({
      where: { companyId: dto.companyId, code: dto.code },
    });
    if (existing)
      throw new ConflictException(
        `A salary component with code "${dto.code}" already exists for this company`,
      );
    return this.prisma.salaryComponent.create({ data: dto });
  }

  async update(id: string, dto: UpdateSalaryComponentDto) {
    await this.findById(id);
    return this.prisma.salaryComponent.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findById(id);

    // Check if component is referenced by active template items or employee assignment details
    const inTemplate = await this.prisma.salaryStructureTemplateItem.findFirst({
      where: { salaryComponentId: id },
    });
    if (inTemplate) {
      throw new ConflictException(
        'Cannot delete component because it is referenced in active salary structure templates.',
      );
    }

    const inAssignment = await this.prisma.employeeSalaryComponentDetail.findFirst({
      where: { salaryComponentId: id },
    });
    if (inAssignment) {
      throw new ConflictException(
        'Cannot delete component because it is referenced in employee salary structures.',
      );
    }

    await this.prisma.salaryComponent.delete({ where: { id } });
    return { success: true };
  }
}
