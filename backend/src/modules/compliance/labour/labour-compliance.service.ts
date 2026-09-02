import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

export interface LabourTask {
  id: string;
  name: string;
  category: string;
  act: string;
  frequency: string;
  period: string;
  dueDate: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  applicability: string;
  employeesCount: number;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
  evidenceFile?: string;
}

const DEFAULT_LABOUR_TASKS: Omit<LabourTask, 'id' | 'period' | 'dueDate'>[] = [
  {
    name: 'Minimum Wage Review & Register',
    category: 'Wages',
    act: 'Minimum Wages Act, 1948',
    frequency: 'Monthly',
    priority: 'HIGH',
    status: 'COMPLETED',
    applicability: 'Maharashtra — Minimum Wage Sched. Empl.',
    employeesCount: 44,
    completedAt: '2026-09-02',
    completedBy: 'Admin User',
    notes: 'Verified all active assignments exceed statutory minimum wage floors.',
  },
  {
    name: 'Monthly Wage Register (Form B / Form X)',
    category: 'Wage Registers',
    act: 'Code on Wages / Payment of Wages Act, 1936',
    frequency: 'Monthly',
    priority: 'HIGH',
    status: 'COMPLETED',
    applicability: 'All Establishments (Commercial & Factory)',
    employeesCount: 44,
    completedAt: '2026-09-02',
    completedBy: 'Admin User',
    notes: 'Monthly wage sheets and deductions cross-verified with payroll.',
  },
  {
    name: 'Working Hours & Overtime Compliance',
    category: 'Working Hours',
    act: 'Factories Act, 1948 / Shops & Est. Act',
    frequency: 'Monthly',
    priority: 'MEDIUM',
    status: 'PENDING',
    applicability: 'Weekly 48h limit & 2x overtime rate check',
    employeesCount: 44,
  },
  {
    name: 'Contract Labour Muster & Licensing Review',
    category: 'Contract Labour',
    act: 'Contract Labour (R&A) Act, 1970',
    frequency: 'Monthly',
    priority: 'HIGH',
    status: 'PENDING',
    applicability: 'Principal Employer Contractor Registry',
    employeesCount: 18,
  },
  {
    name: 'Attendance Register (Muster Roll Form D)',
    category: 'Attendance',
    act: 'Maha Shops & Est. (Regulation of Employment) Act',
    frequency: 'Monthly',
    priority: 'MEDIUM',
    status: 'COMPLETED',
    applicability: 'All Active Employees & Trainees',
    employeesCount: 44,
    completedAt: '2026-09-01',
    completedBy: 'HR Executive',
  },
  {
    name: 'POSH ICC Constitution & Grievance Review',
    category: 'POSH',
    act: 'POSH Act, 2013 (Prevention of Sexual Harassment)',
    frequency: 'Quarterly',
    priority: 'HIGH',
    status: 'PENDING',
    applicability: 'Internal Complaints Committee (ICC)',
    employeesCount: 44,
    notes: 'Q2 review scheduled with presiding officer and external NGO member.',
  },
  {
    name: 'Labour Welfare Fund (MLWF) Half-Yearly Prep',
    category: 'Labour Welfare',
    act: 'Maharashtra Labour Welfare Fund Act, 1953',
    frequency: 'Half-Yearly',
    priority: 'MEDIUM',
    status: 'PENDING',
    applicability: 'Deductions: Employee ₹12 + Employer ₹36',
    employeesCount: 44,
  },
  {
    name: 'Leave & Holiday Records (Form H)',
    category: 'Leave',
    act: 'National & Festival Holidays Act',
    frequency: 'Monthly',
    priority: 'LOW',
    status: 'COMPLETED',
    applicability: 'Paid Leave with wages & statutory holiday muster',
    employeesCount: 44,
    completedAt: '2026-09-01',
    completedBy: 'HR Executive',
  },
  {
    name: 'Annual Bonus Calculation Register (Form C)',
    category: 'Bonus',
    act: 'Payment of Bonus Act, 1965',
    frequency: 'Annual',
    priority: 'MEDIUM',
    status: 'PENDING',
    applicability: 'Eligible employees (8.33% to 20% limit)',
    employeesCount: 44,
  },
  {
    name: 'Maternity Benefit Compliance & Nursing Breaks',
    category: 'Maternity',
    act: 'Maternity Benefit Act, 1961',
    frequency: 'Event-based',
    priority: 'MEDIUM',
    status: 'COMPLETED',
    applicability: 'Eligible women employees with 80+ work days',
    employeesCount: 12,
    completedAt: '2026-08-28',
    completedBy: 'Admin User',
  },
  {
    name: 'Gratuity Nominations Verification (Form F)',
    category: 'Gratuity',
    act: 'Payment of Gratuity Act, 1972',
    frequency: 'Event-based',
    priority: 'LOW',
    status: 'PENDING',
    applicability: 'Employees with > 5 years service',
    employeesCount: 22,
  },
  {
    name: 'Labour Inspector Notice & Inspection File',
    category: 'Inspection',
    act: 'State Labour Department Inspection Protocol',
    frequency: 'Event-based',
    priority: 'HIGH',
    status: 'OVERDUE',
    applicability: 'Statutory Inspection Record File',
    employeesCount: 44,
    notes: 'Annual audit submission deadline was 31-Aug-2026.',
  },
];

@Injectable()
export class LabourComplianceService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(companyId?: string, period: string = '2026-09', fy: string = '2026-2027') {
    const isAll = !companyId || companyId === 'all' || companyId === 'default-company';
    const targetCompanyId = isAll ? undefined : companyId;

    // Fetch live employee count
    const totalEmployeesInDb = await this.prisma.employee.count({
      where: {
        status: { in: ['ACTIVE', 'PROBATION'] },
        ...(targetCompanyId ? { companyId: targetCompanyId } : {}),
      },
    });

    const employeesCount = Math.max(totalEmployeesInDb, 44);

    const tasks: LabourTask[] = DEFAULT_LABOUR_TASKS.map((t, idx) => {
      let dueDate = '2026-09-30';
      if (t.name.includes('Contract')) dueDate = '2026-10-10';
      if (t.name.includes('POSH')) dueDate = '2026-09-30';
      if (t.name.includes('Inspection')) dueDate = '2026-08-31';
      if (t.frequency === 'Annual') dueDate = '2027-03-31';

      return {
        ...t,
        id: `LAB-TASK-${period.replace('-', '')}-${String(idx + 1).padStart(3, '0')}`,
        period: period,
        dueDate,
        employeesCount: t.employeesCount > employeesCount ? employeesCount : t.employeesCount,
      };
    });

    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    const pending = tasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length;
    const overdue = tasks.filter(t => t.status === 'OVERDUE').length;

    return {
      period,
      financialYear: fy,
      state: 'Maharashtra',
      establishmentType: 'Commercial Establishment & IT Services',
      registrationNumber: 'MH/PUN/SHOPS/2024/098124',
      totalEmployees: employeesCount,
      summary: {
        totalEmployees: employeesCount,
        totalTasks: tasks.length,
        completedTasks: completed,
        pendingTasks: pending,
        overdueTasks: overdue,
        complianceScore: Math.round((completed / tasks.length) * 100),
      },
      tasks,
      workflowSteps: [
        { id: 1, label: 'Employee Data', status: 'COMPLETED' },
        { id: 2, label: 'Establishment Setup', status: 'COMPLETED' },
        { id: 3, label: 'Applicability', status: 'COMPLETED' },
        { id: 4, label: 'Compliance Calendar', status: 'COMPLETED' },
        { id: 5, label: 'Compliance Tasks', status: pending > 0 ? 'IN_PROGRESS' : 'COMPLETED' },
        { id: 6, label: 'Registers', status: completed >= 3 ? 'COMPLETED' : 'PENDING' },
        { id: 7, label: 'Validation', status: completed >= 4 ? 'COMPLETED' : 'PENDING' },
        { id: 8, label: 'Submission', status: 'PENDING' },
        { id: 9, label: 'Evidence', status: completed >= 4 ? 'COMPLETED' : 'PENDING' },
        { id: 10, label: 'Audit', status: 'PENDING' },
        { id: 11, label: 'Completed', status: overdue === 0 && pending === 0 ? 'COMPLETED' : 'PENDING' },
      ],
    };
  }
}
