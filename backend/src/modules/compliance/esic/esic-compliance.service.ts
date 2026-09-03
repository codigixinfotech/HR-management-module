import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

/** Statutory ESIC contribution rates */
const EMPLOYEE_ESIC_RATE = 0.0075; // 0.75%
const EMPLOYER_ESIC_RATE = 0.0325; // 3.25%

@Injectable()
export class EsicComplianceService {
  constructor(private readonly prisma: PrismaService) {}

  async getRegister(companyId?: string, period?: string) {
    const targetPeriod = period || '2026-09';
    const [yearStr, monthStr] = targetPeriod.split('-');
    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);

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

      // Compute gross earnings from assignment details
      let grossMonthly = 0;
      for (const d of asgn.details || []) {
        const type = (d.salaryComponent?.type || 'EARNING').toUpperCase();
        if (type === 'EARNING') grossMonthly += Number(d.monthlyAmount) || 0;
      }
      if (grossMonthly === 0) grossMonthly = Number(asgn.monthlyCtc || 0);

      const esicApplicable = emp.esicApplicable !== false;
      const esicWage = grossMonthly;

      const employeeShare = esicApplicable && esicWage > 0 ? Number((esicWage * EMPLOYEE_ESIC_RATE).toFixed(2)) : 0;
      const employerShare = esicApplicable && esicWage > 0 ? Number((esicWage * EMPLOYER_ESIC_RATE).toFixed(2)) : 0;
      const totalContribution = Number((employeeShare + employerShare).toFixed(2));
      const annualCtc = Number(asgn.annualCtc || 0);

      // Generate a formatted IP / ESIC Number if not directly set
      const ipNumber = emp.esicNumber || `31${(emp.employeeCode || '1001').replace(/\D/g, '').padStart(8, '0')}`;

      return {
        employeeId: emp.id,
        employeeCode: emp.employeeCode || '—',
        name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Unknown',
        ipNumber,
        department: emp.department?.name || 'General',
        companyName: emp.company?.name || asgn.company?.name || 'Codigix Infotech Pvt. Ltd.',
        state: emp.state || emp.presentAddressState || 'Maharashtra',
        esicApplicable,
        esicWage,
        employeeShare,
        employerShare,
        totalContribution,
        annualCtc,
        monthlyCtc: Number(asgn.monthlyCtc || 0),
        payrollPeriod: targetPeriod,
        effectiveFrom: asgn.effectiveFrom,
        templateName: asgn.template?.name || null,
        templateCode: asgn.template?.code || null,
        status: esicApplicable && esicWage > 0 ? 'CALCULATED' : 'EXEMPT',
      };
    }).filter(Boolean);

    const applicableRows = registerRows.filter((r: any) => r.esicApplicable && r.esicWage > 0);
    const totalEsicWage = applicableRows.reduce((s: number, r: any) => s + r.esicWage, 0);
    const totalEmployeeShare = applicableRows.reduce((s: number, r: any) => s + r.employeeShare, 0);
    const totalEmployerShare = applicableRows.reduce((s: number, r: any) => s + r.employerShare, 0);
    const totalContribution = Number((totalEmployeeShare + totalEmployerShare).toFixed(2));

    // Due date is 15th of following month
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const dueDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-15`;

    return {
      period: targetPeriod,
      employerCode: 'ESIC-MH-31000256890001001',
      financialYear: `${yearStr}-${parseInt(yearStr) + 1}`,
      dueDate,
      employees: registerRows,
      summary: {
        totalEmployees: registerRows.length,
        esicApplicableEmployees: applicableRows.length,
        totalEsicWage,
        totalEmployeeShare,
        totalEmployerShare,
        totalContribution,
        amountPaid: 0,
        balancePayable: totalContribution,
      },
    };
  }

  async getDashboard(companyId?: string, period?: string) {
    const register = await this.getRegister(companyId, period);
    return {
      ...register,
      workflowSteps: [
        { id: 1, label: 'Employee Data', status: register.employees.length > 0 ? 'COMPLETED' : 'PENDING' },
        { id: 2, label: 'Salary Structure', status: register.summary.esicApplicableEmployees > 0 ? 'COMPLETED' : 'PENDING' },
        { id: 3, label: 'Payroll Finalized', status: register.summary.esicApplicableEmployees > 0 ? 'COMPLETED' : 'PENDING' },
        { id: 4, label: 'ESIC Calculated', status: register.summary.totalContribution > 0 ? 'COMPLETED' : 'PENDING' },
        { id: 5, label: 'ESIC Register', status: register.summary.totalContribution > 0 ? 'COMPLETED' : 'PENDING' },
        { id: 6, label: 'Monthly Contribution', status: 'PENDING' },
        { id: 7, label: 'Challan Generated', status: 'PENDING' },
        { id: 8, label: 'Payment / UTR', status: 'PENDING' },
        { id: 9, label: 'Submitted / Completed', status: 'PENDING' },
      ],
    };
  }
}
