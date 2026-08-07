import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PayrollRunStatus, SalaryComponentType } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreatePayrollRunDto,
  UpdatePayrollRunStatusDto,
} from './dto/payroll-run.dto';

const PF_RATE = 0.12;
const PF_WAGE_CEILING = 15000;
const ESIC_RATE = 0.0075;
const ESIC_WAGE_CEILING = 21000;
const PROFESSIONAL_TAX_THRESHOLD = 15000;
const PROFESSIONAL_TAX_AMOUNT = 200;

@Injectable()
export class PayrollRunsService {
  constructor(private readonly prisma: PrismaService) {}

  list(companyId?: string) {
    return this.prisma.payrollRun.findMany({
      where: companyId ? { companyId } : undefined,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: { _count: { select: { payslips: true } } },
    });
  }

  async findById(id: string) {
    const run = await this.prisma.payrollRun.findUnique({
      where: { id },
      include: { _count: { select: { payslips: true } } },
    });
    if (!run) throw new NotFoundException('Payroll run not found');
    return run;
  }

  async create(dto: CreatePayrollRunDto) {
    const existing = await this.prisma.payrollRun.findFirst({
      where: { companyId: dto.companyId, month: dto.month, year: dto.year },
    });
    if (existing)
      throw new ConflictException(
        'A payroll run for this month already exists',
      );
    return this.prisma.payrollRun.create({ data: dto });
  }

  async updateStatus(id: string, dto: UpdatePayrollRunStatusDto) {
    const run = await this.findById(id);
    if (run.status === PayrollRunStatus.DRAFT) {
      throw new ConflictException('Run the payroll before changing its status');
    }
    const data: { status: PayrollRunStatus; approvedAt?: Date; paidAt?: Date } =
      { status: dto.status };
    if (dto.status === PayrollRunStatus.APPROVED) data.approvedAt = new Date();
    if (dto.status === PayrollRunStatus.PAID) data.paidAt = new Date();
    return this.prisma.payrollRun.update({ where: { id }, data });
  }

  async process(id: string) {
    const run = await this.findById(id);
    if (run.status !== PayrollRunStatus.DRAFT) {
      throw new ConflictException(
        'This payroll run has already been processed',
      );
    }

    const employees = await this.prisma.employee.findMany({
      where: { companyId: run.companyId, status: 'ACTIVE' },
      include: { salaryComponents: { include: { salaryComponent: true } } },
    });

    await this.prisma.$transaction(async (tx) => {
      for (const employee of employees) {
        const earnings = employee.salaryComponents.filter(
          (c) => c.salaryComponent.type === SalaryComponentType.EARNING,
        );
        const deductions = employee.salaryComponents.filter(
          (c) => c.salaryComponent.type === SalaryComponentType.DEDUCTION,
        );

        const grossEarnings = earnings.reduce(
          (sum, c) => sum + c.monthlyAmount,
          0,
        );
        const otherDeductions = deductions
          .filter((c) => !c.salaryComponent.isStatutory)
          .reduce((sum, c) => sum + c.monthlyAmount, 0);

        const basic =
          earnings.find((c) => c.salaryComponent.code === 'BASIC')
            ?.monthlyAmount ?? 0;
        const pf = Math.min(basic, PF_WAGE_CEILING) * PF_RATE;
        const esic =
          grossEarnings > 0 && grossEarnings <= ESIC_WAGE_CEILING
            ? grossEarnings * ESIC_RATE
            : 0;
        const professionalTax =
          grossEarnings > PROFESSIONAL_TAX_THRESHOLD
            ? PROFESSIONAL_TAX_AMOUNT
            : 0;
        const netPay =
          grossEarnings - pf - esic - professionalTax - otherDeductions;

        const payslip = await tx.payslip.create({
          data: {
            payrollRunId: run.id,
            employeeId: employee.id,
            grossEarnings,
            pf,
            esic,
            professionalTax,
            otherDeductions,
            netPay,
          },
        });

        if (employee.salaryComponents.length > 0) {
          await tx.payslipComponent.createMany({
            data: employee.salaryComponents.map((c) => ({
              payslipId: payslip.id,
              salaryComponentId: c.salaryComponentId,
              name: c.salaryComponent.name,
              type: c.salaryComponent.type,
              amount: c.monthlyAmount,
            })),
          });
        }
      }

      await tx.payrollRun.update({
        where: { id: run.id },
        data: { status: PayrollRunStatus.PROCESSED, processedAt: new Date() },
      });
    });

    return this.findById(id);
  }
}
