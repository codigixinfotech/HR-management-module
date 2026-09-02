import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

/** Maharashtra PT slabs (monthly gross → monthly PT) */
const PT_SLABS = [
  { upTo: 7500, pt: 0 },
  { upTo: 10000, pt: 175 },
  { upTo: Infinity, pt: 200 },
];
const PT_SLABS_FEB = [
  { upTo: 7500, pt: 0 },
  { upTo: 10000, pt: 175 },
  { upTo: Infinity, pt: 300 },
];

function calcPt(grossMonthly: number, month: number): number {
  const slabs = month === 2 ? PT_SLABS_FEB : PT_SLABS;
  for (const slab of slabs) {
    if (grossMonthly <= slab.upTo) return slab.pt;
  }
  return slabs[slabs.length - 1].pt;
}

@Injectable()
export class PtComplianceService {
  constructor(private readonly prisma: PrismaService) {}

  async getRegister(companyId?: string, period?: string) {
    const targetPeriod = period || '2026-09';
    const [yearStr, monthStr] = targetPeriod.split('-');
    const month = parseInt(monthStr, 10);

    const isAll = !companyId || companyId === 'all' || companyId === 'default-company';
    const targetCompanyId = isAll ? undefined : companyId;

    // Only fetch employees who have an ACTIVE salary assignment (i.e. real payroll data)
    const assignments = await (this.prisma as any).employeeSalaryAssignment.findMany({
      where: {
        status: 'ACTIVE',
        ...(targetCompanyId
          ? {
              OR: [
                { companyId: targetCompanyId },
                { employee: { companyId: targetCompanyId } },
              ],
            }
          : {}),
      },
      include: {
        company: { select: { id: true, name: true, code: true } },
        employee: {
          include: { department: true, company: { select: { id: true, name: true, code: true } } },
        },
        details: { include: { salaryComponent: true } },
        template: { select: { id: true, name: true, code: true } },
      },
      orderBy: { effectiveFrom: 'desc' },
    });

    // Deduplicate by employeeId (take latest active assignment)
    const seen = new Set<string>();
    const uniqueAssignments: any[] = [];
    for (const a of assignments) {
      if (!seen.has(a.employeeId)) {
        seen.add(a.employeeId);
        uniqueAssignments.push(a);
      }
    }

    const registerRows = uniqueAssignments.map((asgn: any) => {
      const emp = asgn.employee;
      if (!emp) return null;

      // Compute gross from assignment earnings components
      let grossMonthly = 0;
      for (const d of asgn.details || []) {
        const type = (d.salaryComponent?.type || 'EARNING').toUpperCase();
        if (type === 'EARNING') grossMonthly += Number(d.monthlyAmount) || 0;
      }
      // Fallback to stored monthlyCtc
      if (grossMonthly === 0) grossMonthly = Number(asgn.monthlyCtc || 0);

      const ptApplicable = emp.ptApplicable !== false;
      const ptWage = grossMonthly;
      const ptAmount = ptApplicable && ptWage > 0 ? calcPt(ptWage, month) : 0;
      const annualCtc = Number(asgn.annualCtc || 0);

      return {
        employeeId: emp.id,
        employeeCode: emp.employeeCode || '—',
        name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Unknown',
        department: emp.department?.name || 'General',
        companyName: emp.company?.name || asgn.company?.name || 'Codigix Infotech Pvt. Ltd.',
        state: emp.state || emp.presentAddressState || 'Maharashtra',
        ptApplicable,
        ptWage,
        ptAmount,
        annualCtc,
        monthlyCtc: Number(asgn.monthlyCtc || 0),
        payrollPeriod: targetPeriod,
        effectiveFrom: asgn.effectiveFrom,
        templateName: asgn.template?.name || null,
        templateCode: asgn.template?.code || null,
        status: ptApplicable && ptWage > 0 ? 'CALCULATED' : ptApplicable ? 'NO_SALARY' : 'EXEMPT',
      };
    }).filter(Boolean);

    const applicableRows = registerRows.filter((r: any) => r.ptApplicable && r.ptWage > 0);
    const totalPtLiability = applicableRows.reduce((s: number, r: any) => s + r.ptAmount, 0);
    const totalTaxableSalary = applicableRows.reduce((s: number, r: any) => s + r.ptWage, 0);
    const totalAnnualCtc = applicableRows.reduce((s: number, r: any) => s + r.annualCtc, 0);

    return {
      period: targetPeriod,
      state: 'Maharashtra',
      ptrcNumber: 'PTRC/MH/27AAECR2568P1Z3',
      financialYear: `${yearStr}-${parseInt(yearStr) + 1}`,
      registrationType: 'PTRC',
      employees: registerRows,
      summary: {
        totalEmployees: registerRows.length,
        ptApplicableEmployees: applicableRows.length,
        totalTaxableSalary,
        totalAnnualCtc,
        totalPtLiability,
        amountPaid: 0,
        balancePayable: totalPtLiability,
      },
    };
  }

  async getDashboard(companyId?: string, period?: string) {
    const register = await this.getRegister(companyId, period);
    return {
      ...register,
      workflowSteps: [
        { id: 1, label: 'Employee Data', status: register.employees.length > 0 ? 'COMPLETED' : 'PENDING' },
        { id: 2, label: 'Salary Structure', status: register.summary.ptApplicableEmployees > 0 ? 'COMPLETED' : 'PENDING' },
        { id: 3, label: 'Payroll Finalized', status: register.summary.ptApplicableEmployees > 0 ? 'COMPLETED' : 'PENDING' },
        { id: 4, label: 'PT Calculated', status: register.summary.totalPtLiability > 0 ? 'COMPLETED' : 'PENDING' },
        { id: 5, label: 'PT Register', status: register.summary.totalPtLiability > 0 ? 'COMPLETED' : 'PENDING' },
        { id: 6, label: 'Payment', status: 'PENDING' },
        { id: 7, label: 'Return Prep', status: 'PENDING' },
        { id: 8, label: 'Validation', status: 'PENDING' },
        { id: 9, label: 'Filed', status: 'PENDING' },
      ],
    };
  }
}
