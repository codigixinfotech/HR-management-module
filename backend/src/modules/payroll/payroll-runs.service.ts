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
      include: {
        _count: { select: { payslips: true } },
        payslips: {
          select: {
            id: true,
            grossEarnings: true,
            pf: true,
            esic: true,
            professionalTax: true,
            otherDeductions: true,
            netPay: true,
          },
        },
      },
    });
  }

  async findById(id: string) {
    const run = await this.prisma.payrollRun.findUnique({
      where: { id },
      include: {
        _count: { select: { payslips: true } },
        payslips: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeCode: true,
                department: { select: { id: true, name: true } },
                designation: { select: { id: true, title: true } },
                panNumber: true,
                bankAccountNumber: true,
              },
            },
            components: true,
          },
        },
      },
    });
    if (!run) throw new NotFoundException('Payroll run not found');
    return run;
  }

  async create(dto: CreatePayrollRunDto) {
    const existing = await this.prisma.payrollRun.findFirst({
      where: { companyId: dto.companyId, month: dto.month, year: dto.year },
      include: { _count: { select: { payslips: true } } },
    });
    if (existing) {
      return existing;
    }
    return this.prisma.payrollRun.create({
      data: dto,
      include: { _count: { select: { payslips: true } } },
    });
  }

  async updateStatus(id: string, dto: UpdatePayrollRunStatusDto) {
    const run = await this.findById(id);
    const data: { status: PayrollRunStatus; approvedAt?: Date; paidAt?: Date } =
      { status: dto.status };
    if (dto.status === PayrollRunStatus.APPROVED) data.approvedAt = new Date();
    if (dto.status === PayrollRunStatus.PAID) data.paidAt = new Date();
    return this.prisma.payrollRun.update({ where: { id }, data });
  }

  async remove(id: string) {
    const run = await this.findById(id);
    if (run.status === PayrollRunStatus.PAID) {
      throw new ConflictException('Cannot delete a payroll run that has already been PAID and locked');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.payslipComponent.deleteMany({
        where: { payslip: { payrollRunId: id } },
      });
      await tx.payslip.deleteMany({
        where: { payrollRunId: id },
      });
      return tx.payrollRun.delete({
        where: { id },
      });
    });
  }

  async process(id: string) {
    const run = await this.findById(id);
    if (run.status === PayrollRunStatus.PAID) {
      throw new ConflictException(
        'This payroll run has already been PAID and locked against recalculations',
      );
    }

    const employees = await this.prisma.employee.findMany({
      where: {
        companyId: run.companyId,
        status: { in: ['ACTIVE', 'PROBATION'] },
      },
      include: {
        salaryAssignments: {
          where: { status: 'ACTIVE' },
          orderBy: { effectiveFrom: 'desc' },
          take: 1,
          include: {
            details: {
              include: { salaryComponent: true },
            },
          },
        },
        salaryComponents: {
          include: { salaryComponent: true },
        },
      },
    });

    await this.prisma.$transaction(async (tx) => {
      // Clear previous calculation if re-running
      await tx.payslipComponent.deleteMany({
        where: { payslip: { payrollRunId: run.id } },
      });
      await tx.payslip.deleteMany({
        where: { payrollRunId: run.id },
      });

      for (const employee of employees) {
        const earnings: Array<{
          name: string;
          type: SalaryComponentType;
          amount: number;
          salaryComponentId?: string;
        }> = [];
        const deductions: Array<{
          name: string;
          type: SalaryComponentType;
          amount: number;
          salaryComponentId?: string;
        }> = [];

        const activeAssignment = employee.salaryAssignments?.[0];
        if (
          activeAssignment &&
          activeAssignment.details &&
          activeAssignment.details.length > 0
        ) {
          for (const d of activeAssignment.details) {
            if (d.salaryComponent.type === SalaryComponentType.EARNING) {
              earnings.push({
                name: d.salaryComponent.name,
                type: SalaryComponentType.EARNING,
                amount: Math.round(d.monthlyAmount),
                salaryComponentId: d.salaryComponentId,
              });
            } else if (d.salaryComponent.type === SalaryComponentType.DEDUCTION) {
              deductions.push({
                name: d.salaryComponent.name,
                type: SalaryComponentType.DEDUCTION,
                amount: Math.round(d.monthlyAmount),
                salaryComponentId: d.salaryComponentId,
              });
            }
          }
        } else if (
          employee.salaryComponents &&
          employee.salaryComponents.length > 0
        ) {
          for (const sc of employee.salaryComponents) {
            if (sc.salaryComponent.type === SalaryComponentType.EARNING) {
              earnings.push({
                name: sc.salaryComponent.name,
                type: SalaryComponentType.EARNING,
                amount: Math.round(sc.monthlyAmount),
                salaryComponentId: sc.salaryComponentId,
              });
            } else if (sc.salaryComponent.type === SalaryComponentType.DEDUCTION) {
              deductions.push({
                name: sc.salaryComponent.name,
                type: SalaryComponentType.DEDUCTION,
                amount: Math.round(sc.monthlyAmount),
                salaryComponentId: sc.salaryComponentId,
              });
            }
          }
        } else {
          // Fallback based on employee profile or baseline
          const gross =
            employee.grossSalary ||
            (employee.annualCtc ? Math.round(employee.annualCtc / 12) : 25000);
          const basic = employee.basicSalary || Math.round(gross * 0.5);
          const hra = employee.hra || Math.round(basic * 0.4);
          const special = Math.max(0, gross - basic - hra);

          earnings.push({
            name: 'Basic Salary',
            type: SalaryComponentType.EARNING,
            amount: basic,
          });
          earnings.push({
            name: 'House Rent Allowance (HRA)',
            type: SalaryComponentType.EARNING,
            amount: hra,
          });
          if (special > 0) {
            earnings.push({
              name: 'Special Allowance',
              type: SalaryComponentType.EARNING,
              amount: special,
            });
          }

          if (employee.pfApplicable !== false) {
            const pfAmt = Math.round(Math.min(basic, PF_WAGE_CEILING) * PF_RATE);
            deductions.push({
              name: 'Provident Fund (Employee)',
              type: SalaryComponentType.DEDUCTION,
              amount: pfAmt,
            });
          }
          if (employee.esicApplicable !== false && gross <= ESIC_WAGE_CEILING) {
            const esicAmt = Math.round(gross * ESIC_RATE);
            deductions.push({
              name: 'ESIC (Employee)',
              type: SalaryComponentType.DEDUCTION,
              amount: esicAmt,
            });
          }
          const ptAmt =
            gross > PROFESSIONAL_TAX_THRESHOLD
              ? PROFESSIONAL_TAX_AMOUNT
              : gross > 10000
                ? 150
                : 0;
          if (ptAmt > 0) {
            deductions.push({
              name: 'Professional Tax',
              type: SalaryComponentType.DEDUCTION,
              amount: ptAmt,
            });
          }
        }

        const grossEarnings = earnings.reduce((sum, c) => sum + c.amount, 0);

        // Check statutory components
        const pfItem = deductions.find(
          (d) =>
            d.name.toLowerCase().includes('provident') ||
            d.name.toLowerCase().includes('pf'),
        );
        let pf = pfItem ? pfItem.amount : 0;
        if (!pfItem && employee.pfApplicable !== false) {
          const basic =
            earnings.find((e) => e.name.toLowerCase().includes('basic'))
              ?.amount || Math.round(grossEarnings * 0.5);
          pf = Math.round(Math.min(basic, PF_WAGE_CEILING) * PF_RATE);
          if (pf > 0) {
            deductions.push({
              name: 'Provident Fund (Employee)',
              type: SalaryComponentType.DEDUCTION,
              amount: pf,
            });
          }
        }

        const esicItem = deductions.find((d) =>
          d.name.toLowerCase().includes('esi'),
        );
        let esic = esicItem ? esicItem.amount : 0;
        if (
          !esicItem &&
          employee.esicApplicable !== false &&
          grossEarnings > 0 &&
          grossEarnings <= ESIC_WAGE_CEILING
        ) {
          esic = Math.round(grossEarnings * ESIC_RATE);
          if (esic > 0) {
            deductions.push({
              name: 'ESIC (Employee)',
              type: SalaryComponentType.DEDUCTION,
              amount: esic,
            });
          }
        }

        const ptItem = deductions.find(
          (d) =>
            d.name.toLowerCase().includes('professional') ||
            d.name.toLowerCase().includes('pt'),
        );
        let professionalTax = ptItem ? ptItem.amount : 0;
        if (!ptItem && grossEarnings > PROFESSIONAL_TAX_THRESHOLD) {
          professionalTax = PROFESSIONAL_TAX_AMOUNT;
          deductions.push({
            name: 'Professional Tax',
            type: SalaryComponentType.DEDUCTION,
            amount: professionalTax,
          });
        }

        const otherDeductions = deductions
          .filter((d) => d !== pfItem && d !== esicItem && d !== ptItem)
          .reduce((sum, d) => sum + d.amount, 0);

        const netPay = Math.max(
          0,
          grossEarnings - pf - esic - professionalTax - otherDeductions,
        );

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

        const allComponents = [...earnings, ...deductions];
        if (allComponents.length > 0) {
          await tx.payslipComponent.createMany({
            data: allComponents.map((c) => ({
              payslipId: payslip.id,
              salaryComponentId: c.salaryComponentId || null,
              name: c.name,
              type: c.type,
              amount: c.amount,
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

  async getDiagnostics(id: string) {
    const run = await this.findById(id);
    const employees = await this.prisma.employee.findMany({
      where: { companyId: run.companyId, status: { in: ['ACTIVE', 'PROBATION'] } },
      include: {
        department: true,
        designation: true,
        salaryAssignments: { where: { status: 'ACTIVE' } },
      },
    });

    const missingBank = employees.filter((e) => !e.bankAccountNumber || !e.bankIfscCode);
    const missingPan = employees.filter((e) => !e.panNumber);
    const missingSalary = employees.filter((e) => !e.salaryAssignments || e.salaryAssignments.length === 0);

    const pendingLeaves = await this.prisma.leaveRequest.findMany({
      where: { companyId: run.companyId, status: 'PENDING' },
      include: { employee: true },
    });

    return [
      {
        id: 'chk-salary',
        category: 'SALARY',
        severity: 'CRITICAL',
        title: 'Active Salary Structure Assignment',
        description: 'Verify all active employees have an active salary structure assigned before calculating wages.',
        affectedCount: missingSalary.length,
        isResolved: missingSalary.length === 0,
        affectedEmployees: missingSalary.map((e) => ({
          id: e.id,
          name: `${e.firstName} ${e.lastName}`,
          code: e.employeeCode || `EMP-${e.id.slice(-4).toUpperCase()}`,
          detail: 'No active salary structure assignment found in payroll master',
        })),
      },
      {
        id: 'chk-bank',
        category: 'BANK',
        severity: 'CRITICAL',
        title: 'Disbursement Bank Account & IFSC Validation',
        description: 'Ensure valid employee bank account and IFSC details exist for bank transfer file generation.',
        affectedCount: missingBank.length,
        isResolved: missingBank.length === 0,
        affectedEmployees: missingBank.map((e) => ({
          id: e.id,
          name: `${e.firstName} ${e.lastName}`,
          code: e.employeeCode || `EMP-${e.id.slice(-4).toUpperCase()}`,
          detail: 'Missing bank account number or IFSC code',
        })),
      },
      {
        id: 'chk-pan',
        category: 'PAN',
        severity: 'WARNING',
        title: 'Statutory PAN & Tax Filing Verification',
        description: 'Permanent Account Number (PAN) is required for statutory Form 16 and TDS compliance.',
        affectedCount: missingPan.length,
        isResolved: missingPan.length === 0,
        affectedEmployees: missingPan.map((e) => ({
          id: e.id,
          name: `${e.firstName} ${e.lastName}`,
          code: e.employeeCode || `EMP-${e.id.slice(-4).toUpperCase()}`,
          detail: 'Missing Permanent Account Number (PAN)',
        })),
      },
      {
        id: 'chk-attendance',
        category: 'ATTENDANCE',
        severity: 'WARNING',
        title: 'Pending Leave Approvals & LOP Lock',
        description: 'Unapproved leave requests will skew pro-rata loss of pay (LOP) deductions for this period.',
        affectedCount: pendingLeaves.length,
        isResolved: pendingLeaves.length === 0,
        affectedEmployees: pendingLeaves.map((l) => ({
          id: l.id,
          name: l.employee ? `${l.employee.firstName} ${l.employee.lastName}` : 'Employee',
          code: l.employee?.employeeCode || 'EMP',
          detail: `Pending leave approval: ${l.totalDays} day(s) from ${l.startDate.toISOString().split('T')[0]} to ${l.endDate.toISOString().split('T')[0]}`,
        })),
      },
    ];
  }

  async getAttendanceLop(id: string) {
    const run = await this.findById(id);
    const employees = await this.prisma.employee.findMany({
      where: { companyId: run.companyId, status: { in: ['ACTIVE', 'PROBATION'] } },
      include: {
        department: true,
      },
      orderBy: { employeeCode: 'asc' },
    });

    const daysInMonth = new Date(run.year, run.month, 0).getDate();
    const workingDays = Math.min(26, daysInMonth);
    const weeklyOffs = daysInMonth - workingDays;

    const startOfMonth = new Date(run.year, run.month - 1, 1);
    const endOfMonth = new Date(run.year, run.month, 0, 23, 59, 59);

    const approvedLeaves = await this.prisma.leaveRequest.findMany({
      where: {
        companyId: run.companyId,
        status: 'APPROVED',
        startDate: { lte: endOfMonth },
        endDate: { gte: startOfMonth },
      },
    });

    return employees.map((emp) => {
      const empLeaves = approvedLeaves.filter((l) => l.employeeId === emp.id);
      const paidLeaveDays = empLeaves.reduce((sum, l) => sum + (l.totalDays || 0), 0);
      const lopDays = 0;
      const payableDays = Math.max(0, daysInMonth - lopDays);
      const presentDays = Math.max(0, workingDays - paidLeaveDays);
      const proRataFactor = Math.round((payableDays / daysInMonth) * 1000) / 1000;

      return {
        id: `att-${emp.id}`,
        employeeId: emp.id,
        employeeCode: emp.employeeCode || `EMP-${emp.id.slice(-4).toUpperCase()}`,
        name: `${emp.firstName} ${emp.lastName}`,
        department: emp.department?.name || 'General',
        totalCalendarDays: daysInMonth,
        payableDays,
        presentDays,
        paidLeaves: paidLeaveDays,
        lopDays,
        weeklyOffs,
        holidays: 0,
        attendanceFinalized: true,
        proRataFactor,
      };
    });
  }

  async getVariableInputs(id: string) {
    const run = await this.findById(id);
    const employees = await this.prisma.employee.findMany({
      where: { companyId: run.companyId, status: { in: ['ACTIVE', 'PROBATION'] } },
      include: { department: true },
      orderBy: { employeeCode: 'asc' },
    });

    const approvedClaims = await this.prisma.expenseClaim.findMany({
      where: { companyId: run.companyId, status: 'APPROVED' },
    });

    return employees.map((emp) => {
      const empClaims = approvedClaims.filter((c) => c.employeeId === emp.id);
      const reimbursementPayout = empClaims.reduce((sum, c) => sum + Number(c.amount || 0), 0);

      return {
        id: `var-${emp.id}`,
        employeeId: emp.id,
        employeeCode: emp.employeeCode || `EMP-${emp.id.slice(-4).toUpperCase()}`,
        name: `${emp.firstName} ${emp.lastName}`,
        department: emp.department?.name || 'General',
        overtimeHours: 0,
        overtimeAmount: 0,
        performanceBonus: 0,
        salesIncentive: 0,
        revisionArrears: 0,
        oneTimeEarnings: 0,
        oneTimeDeductions: 0,
        loanEmiDeduction: 0,
        reimbursementPayout,
      };
    });
  }

  async getFnfRecords(id: string) {
    const run = await this.findById(id);
    const exits = await this.prisma.employeeExit.findMany({
      where: { companyId: run.companyId },
      include: {
        employee: {
          include: { department: true, designation: true },
        },
        fnfSettlement: true,
      },
      orderBy: { resignationDate: 'desc' },
    });

    return exits.map((ex) => {
      const s = ex.fnfSettlement;
      const proRatedSalary = s?.salaryPayable ?? 0;
      const leaveEncashmentAmount = s?.leaveEncashment ?? 0;
      const gratuityAmount = 0;
      const bonusAmount = s?.incentives ?? 0;
      const totalEarnings = s?.grossPayable ?? (proRatedSalary + leaveEncashmentAmount + bonusAmount);
      const noticePayRecoveryAmount = s?.noticeRecovery ?? 0;
      const outstandingLoanBalance = s?.loanAdvanceRecovery ?? 0;
      const assetRecovery = s?.assetRecovery ?? 0;
      const totalRecoveries = s?.totalDeductions ?? (noticePayRecoveryAmount + outstandingLoanBalance + assetRecovery);
      const netSettlementPayable = s?.netPayable ?? Math.max(0, totalEarnings - totalRecoveries);

      let settlementStatus: 'DRAFT' | 'APPROVED' | 'DISBURSED' = 'DRAFT';
      if (s?.status === 'APPROVED') settlementStatus = 'APPROVED';
      else if (s?.status === 'DISBURSED' || s?.status === 'PAID') settlementStatus = 'DISBURSED';

      return {
        id: ex.id,
        employeeId: ex.employeeId,
        employeeCode: ex.employee?.employeeCode || 'EMP',
        name: ex.employee ? `${ex.employee.firstName} ${ex.employee.lastName}` : 'Exiting Employee',
        department: ex.employee?.department?.name || 'General',
        designation: ex.employee?.designation?.title || 'Staff',
        joiningDate: ex.employee?.dateOfJoining ? ex.employee.dateOfJoining.toISOString().split('T')[0] : 'N/A',
        resignationDate: ex.resignationDate ? ex.resignationDate.toISOString().split('T')[0] : '',
        lastWorkingDay: ex.lastWorkingDay ? ex.lastWorkingDay.toISOString().split('T')[0] : '',
        noticePeriodRequiredDays: ex.noticePeriodDays || 30,
        noticePeriodServedDays: ex.noticePeriodDays || 30,
        shortfallDays: 0,
        proRatedSalary,
        leaveEncashmentDays: 0,
        leaveEncashmentAmount,
        noticePayRecoveryAmount,
        gratuityAmount,
        bonusAmount,
        outstandingLoanBalance,
        finalTds: 0,
        totalEarnings,
        totalRecoveries,
        netSettlementPayable,
        settlementStatus,
        paymentMode: 'BANK_TRANSFER' as const,
      };
    });
  }
}
