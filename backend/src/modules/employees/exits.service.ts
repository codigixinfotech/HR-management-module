import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  AdjustLwdDto,
  CreateExitDto,
  SaveExitInterviewDto,
  SaveFnfSettlementDto,
  UpdateClearanceItemDto,
  UpdateExitStatusDto,
} from './dto/exit.dto';

const DEFAULT_CLEARANCE_ITEMS = [
  // Reporting Manager
  { department: 'Reporting Manager', itemKey: 'work_handover', itemLabel: 'Project & Task Work Handover' },
  { department: 'Reporting Manager', itemKey: 'pending_tasks', itemLabel: 'Pending Operations & Client Handoff' },
  { department: 'Reporting Manager', itemKey: 'kt_completion', itemLabel: 'Knowledge Transfer & Code/Doc Deposit' },
  
  // IT Department
  { department: 'IT', itemKey: 'laptop_hardware', itemLabel: 'Company Laptop & Peripheral Hardware' },
  { department: 'IT', itemKey: 'email_access', itemLabel: 'Email Account & Inbox Archival' },
  { department: 'IT', itemKey: 'system_licenses', itemLabel: 'SaaS Software Licenses & Cloud Revocation' },
  { department: 'IT', itemKey: 'vpn_security', itemLabel: 'VPN Keys, Tokens & Security Credential Revocation' },

  // Admin Department
  { department: 'Admin', itemKey: 'id_badge', itemLabel: 'Employee Physical ID Badge & Smartcard' },
  { department: 'Admin', itemKey: 'building_keys', itemLabel: 'Access Cards, Office Keys & Drawers' },
  { department: 'Admin', itemKey: 'office_property', itemLabel: 'Company Vehicle / Parking Sticker Return' },

  // Finance Department
  { department: 'Finance', itemKey: 'salary_dues', itemLabel: 'Salary & Variable Pay Dues Reconciliation' },
  { department: 'Finance', itemKey: 'advance_recovery', itemLabel: 'Travel Advance & Loan Recovery Clearance' },
  { department: 'Finance', itemKey: 'expense_claims', itemLabel: 'Outstanding Expense Reimbursement Audit' },

  // HR Department
  { department: 'HR', itemKey: 'document_clearance', itemLabel: 'HR Service Agreement & Bond Clearance' },
  { department: 'HR', itemKey: 'exit_interview', itemLabel: 'Formal Exit Interview Completion' },
  { department: 'HR', itemKey: 'leave_encashment', itemLabel: 'Unavailed Leave Balance Encashment Audit' },

  // Assets
  { department: 'Assets', itemKey: 'assigned_assets', itemLabel: 'Assigned Hardware, Monitor & Tools Audit' },
  { department: 'Assets', itemKey: 'mobile_sim', itemLabel: 'Corporate Mobile Handset & SIM Return' },
];

@Injectable()
export class ExitsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      const count = await this.prisma.employeeExit.count();
      if (count === 0) {
        const employees = await this.prisma.employee.findMany({ take: 3 });
        if (employees.length >= 2) {
          await this.create({
            employeeId: employees[0].id,
            resignationDate: '2026-07-01',
            noticePeriodDays: 60,
            lastWorkingDay: '2026-08-31',
            exitType: 'RESIGNATION',
            exitReason: 'Better Career Opportunity',
            remarks: 'Initiated voluntary resignation.',
            companyId: employees[0].companyId,
          });

          await this.create({
            employeeId: employees[1].id,
            resignationDate: '2026-07-15',
            noticePeriodDays: 90,
            lastWorkingDay: '2026-10-15',
            exitType: 'RESIGNATION',
            exitReason: 'Personal Reasons / Relocation',
            remarks: 'Relocating to another city.',
            companyId: employees[1].companyId,
          });
        }
      }
    } catch (e) {
      console.error('Failed to auto-seed exit records:', e);
    }
  }

  async getKpis(companyId?: string) {
    const whereClause: any = {};
    if (companyId) whereClause.companyId = companyId;

    const allExits = await this.prisma.employeeExit.findMany({
      where: whereClause,
      include: { employee: true },
    });

    const activeExits = allExits.filter(
      (e) => !['EXITED', 'OFFBOARDING_COMPLETED', 'REJECTED', 'WITHDRAWN'].includes(e.status),
    );

    const pendingApprovals = allExits.filter((e) =>
      ['INITIATED', 'HR_REVIEW', 'MANAGER_APPROVAL', 'FINAL_APPROVAL'].includes(e.status),
    );

    const clearancePending = allExits.filter((e) => e.clearanceStatus !== 'COMPLETED');
    const fnfPending = allExits.filter((e) => e.fnfStatus !== 'COMPLETED');

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const exitsThisMonth = allExits.filter(
      (e) =>
        ['EXITED', 'OFFBOARDING_COMPLETED'].includes(e.status) &&
        e.updatedAt >= startOfMonth,
    ).length;

    let totalExitDays = 0;
    allExits.forEach((e) => {
      const start = new Date(e.resignationDate).getTime();
      const end = new Date(e.lastWorkingDay).getTime();
      totalExitDays += Math.max(0, Math.round((end - start) / (1000 * 3600 * 24)));
    });
    const avgExitDays = allExits.length ? Math.round(totalExitDays / allExits.length) : 90;

    return {
      activeExits: activeExits.length,
      pendingApprovals: pendingApprovals.length,
      clearancePending: clearancePending.length,
      fnfPending: fnfPending.length,
      exitsThisMonth,
      avgExitDays,
    };
  }

  async findAll(search?: string, status?: string, companyId?: string) {
    const where: any = {};
    if (companyId) where.companyId = companyId;

    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { exitCode: { contains: q } },
        { exitReason: { contains: q } },
        { employee: { firstName: { contains: q } } },
        { employee: { lastName: { contains: q } } },
        { employee: { employeeCode: { contains: q } } },
      ];
    }

    return this.prisma.employeeExit.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            workEmail: true,
            phone: true,
            status: true,
            department: { select: { id: true, name: true } },
            designation: { select: { id: true, title: true } },
            reportingManager: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        clearanceItems: true,
        exitInterview: true,
        fnfSettlement: true,
        auditLogs: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const exit = await this.prisma.employeeExit.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            department: { select: { id: true, name: true } },
            designation: { select: { id: true, title: true } },
            branch: { select: { id: true, name: true } },
            reportingManager: { select: { id: true, firstName: true, lastName: true } },
            positionHistory: { orderBy: { effectiveDate: 'desc' } },
          },
        },
        clearanceItems: { orderBy: [{ department: 'asc' }, { createdAt: 'asc' }] },
        exitInterview: true,
        fnfSettlement: true,
        auditLogs: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!exit) throw new NotFoundException('Exit offboarding record not found');
    return exit;
  }

  async create(dto: CreateExitDto) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
    });
    if (!employee) throw new NotFoundException('Employee record not found');

    const count = await this.prisma.employeeExit.count();
    const exitCode = `EXT-${300 + count + 1}`;

    const resignationDate = new Date(dto.resignationDate);
    const noticeDays = dto.noticePeriodDays ?? 90;
    const lastWorkingDay = dto.lastWorkingDay
      ? new Date(dto.lastWorkingDay)
      : new Date(resignationDate.getTime() + noticeDays * 24 * 60 * 60 * 1000);

    // Business Rule: DO NOT deactivate employee master upon resignation initiation!
    // Employee remains ACTIVE during notice period.
    const exit = await this.prisma.employeeExit.create({
      data: {
        exitCode,
        employeeId: dto.employeeId,
        companyId: dto.companyId || employee.companyId,
        resignationDate,
        noticePeriodDays: noticeDays,
        lastWorkingDay,
        exitType: dto.exitType || 'RESIGNATION',
        exitReason: dto.exitReason,
        resignationLetterUrl: dto.resignationLetterUrl,
        remarks: dto.remarks,
        status: 'INITIATED',
        clearanceStatus: 'PENDING',
        fnfStatus: 'PENDING',
        exitInterviewStatus: 'PENDING',
        clearanceItems: {
          create: DEFAULT_CLEARANCE_ITEMS.map((item) => ({
            department: item.department,
            itemKey: item.itemKey,
            itemLabel: item.itemLabel,
            status: 'PENDING',
          })),
        },
        fnfSettlement: {
          create: {
            salaryPayable: (employee.grossSalary || 50000) / 30 * 15,
            leaveEncashment: 15000,
            incentives: 5000,
            reimbursements: 2500,
            noticeRecovery: 0,
            loanAdvanceRecovery: 0,
            assetRecovery: 0,
            otherDeductions: 0,
            grossPayable: ((employee.grossSalary || 50000) / 30 * 15) + 15000 + 5000 + 2500,
            totalDeductions: 0,
            netPayable: ((employee.grossSalary || 50000) / 30 * 15) + 15000 + 5000 + 2500,
            status: 'PENDING',
          },
        },
        auditLogs: {
          create: {
            action: 'RESIGNATION_INITIATED',
            newStatus: 'INITIATED',
            performedBy: 'HR System',
            remarks: `Resignation submitted. Notice period: ${noticeDays} days. LWD: ${lastWorkingDay.toISOString().split('T')[0]}.`,
          },
        },
      },
      include: {
        clearanceItems: true,
        fnfSettlement: true,
        auditLogs: true,
      },
    });

    return exit;
  }

  async updateStatus(id: string, dto: UpdateExitStatusDto) {
    const exit = await this.findOne(id);
    const previousStatus = exit.status;

    if (dto.status === 'EXITED' || dto.status === 'OFFBOARDING_COMPLETED') {
      return this.completeExit(id, dto.performedBy);
    }

    const updated = await this.prisma.employeeExit.update({
      where: { id },
      data: {
        status: dto.status,
        auditLogs: {
          create: {
            action: `STATUS_CHANGED_TO_${dto.status}`,
            previousStatus,
            newStatus: dto.status,
            performedBy: dto.performedBy || 'HR Admin',
            remarks: dto.remarks || `Status updated from ${previousStatus} to ${dto.status}`,
          },
        },
      },
      include: { auditLogs: true },
    });

    return updated;
  }

  async adjustLwd(id: string, dto: AdjustLwdDto) {
    const exit = await this.findOne(id);
    const adjustedDate = new Date(dto.adjustedLwd);

    const updated = await this.prisma.employeeExit.update({
      where: { id },
      data: {
        adjustedLwd: adjustedDate,
        lastWorkingDay: adjustedDate,
        lwdAdjustmentReason: dto.reason,
        auditLogs: {
          create: {
            action: 'LWD_ADJUSTED',
            previousStatus: exit.status,
            newStatus: exit.status,
            performedBy: dto.performedBy || 'HR Admin',
            remarks: `Last Working Day adjusted to ${adjustedDate.toISOString().split('T')[0]}. Reason: ${dto.reason}`,
          },
        },
      },
    });

    return updated;
  }

  async updateClearanceItem(itemId: string, dto: UpdateClearanceItemDto) {
    const item = await this.prisma.exitClearanceItem.findUnique({
      where: { id: itemId },
      include: { exit: true },
    });
    if (!item) throw new NotFoundException('Clearance item not found');

    const updatedItem = await this.prisma.exitClearanceItem.update({
      where: { id: itemId },
      data: {
        status: dto.status,
        verifiedBy: dto.verifiedBy || 'Department Lead',
        verifiedAt: new Date(),
        remarks: dto.remarks,
      },
    });

    // Recheck overall exit clearance status
    const allItems = await this.prisma.exitClearanceItem.findMany({
      where: { exitId: item.exitId },
    });
    const allCleared = allItems.every((i) => i.status === 'CLEARED');
    const anyInFilter = allItems.some((i) => i.status === 'CLEARED' || i.status === 'VERIFIED');

    let overallClearanceStatus = 'PENDING';
    if (allCleared) overallClearanceStatus = 'COMPLETED';
    else if (anyInFilter) overallClearanceStatus = 'IN_PROGRESS';

    await this.prisma.employeeExit.update({
      where: { id: item.exitId },
      data: {
        clearanceStatus: overallClearanceStatus,
        status: overallClearanceStatus === 'COMPLETED' ? 'CLEARANCE_COMPLETED' : item.exit.status,
      },
    });

    return updatedItem;
  }

  async saveExitInterview(exitId: string, dto: SaveExitInterviewDto) {
    const exit = await this.findOne(exitId);

    const interview = await this.prisma.exitInterview.upsert({
      where: { exitId },
      create: {
        exitId,
        primaryReason: dto.primaryReason,
        secondaryReason: dto.secondaryReason,
        managerFeedback: dto.managerFeedback,
        employeeFeedback: dto.employeeFeedback,
        workEnvironmentRating: dto.workEnvironmentRating ?? 5,
        compensationRating: dto.compensationRating ?? 5,
        recommendCompany: dto.recommendCompany ?? true,
        rehireEligible: dto.rehireEligible ?? true,
        hrRemarks: dto.hrRemarks,
        completedAt: new Date(),
      },
      update: {
        primaryReason: dto.primaryReason,
        secondaryReason: dto.secondaryReason,
        managerFeedback: dto.managerFeedback,
        employeeFeedback: dto.employeeFeedback,
        workEnvironmentRating: dto.workEnvironmentRating ?? 5,
        compensationRating: dto.compensationRating ?? 5,
        recommendCompany: dto.recommendCompany ?? true,
        rehireEligible: dto.rehireEligible ?? true,
        hrRemarks: dto.hrRemarks,
        completedAt: new Date(),
      },
    });

    await this.prisma.employeeExit.update({
      where: { id: exitId },
      data: {
        exitInterviewStatus: 'COMPLETED',
        status: exit.status === 'CLEARANCE_COMPLETED' ? 'EXIT_INTERVIEW' : exit.status,
        auditLogs: {
          create: {
            action: 'EXIT_INTERVIEW_COMPLETED',
            previousStatus: exit.status,
            newStatus: 'EXIT_INTERVIEW',
            performedBy: 'HR Manager',
            remarks: `Exit interview recorded. Primary reason: ${dto.primaryReason}`,
          },
        },
      },
    });

    return interview;
  }

  async saveFnfSettlement(exitId: string, dto: SaveFnfSettlementDto) {
    const exit = await this.findOne(exitId);

    const salaryPayable = dto.salaryPayable ?? 0;
    const leaveEncashment = dto.leaveEncashment ?? 0;
    const incentives = dto.incentives ?? 0;
    const reimbursements = dto.reimbursements ?? 0;

    const noticeRecovery = dto.noticeRecovery ?? 0;
    const loanAdvanceRecovery = dto.loanAdvanceRecovery ?? 0;
    const assetRecovery = dto.assetRecovery ?? 0;
    const otherDeductions = dto.otherDeductions ?? 0;

    const grossPayable = salaryPayable + leaveEncashment + incentives + reimbursements;
    const totalDeductions = noticeRecovery + loanAdvanceRecovery + assetRecovery + otherDeductions;
    const netPayable = grossPayable - totalDeductions;

    const isApproved = dto.status === 'APPROVED';

    const fnf = await this.prisma.exitFnfSettlement.upsert({
      where: { exitId },
      create: {
        exitId,
        salaryPayable,
        leaveEncashment,
        incentives,
        reimbursements,
        noticeRecovery,
        loanAdvanceRecovery,
        assetRecovery,
        otherDeductions,
        grossPayable,
        totalDeductions,
        netPayable,
        status: dto.status || 'PENDING',
        remarks: dto.remarks,
        approvedBy: isApproved ? dto.approvedBy || 'Finance Head' : null,
        approvedAt: isApproved ? new Date() : null,
      },
      update: {
        salaryPayable,
        leaveEncashment,
        incentives,
        reimbursements,
        noticeRecovery,
        loanAdvanceRecovery,
        assetRecovery,
        otherDeductions,
        grossPayable,
        totalDeductions,
        netPayable,
        status: dto.status || 'PENDING',
        remarks: dto.remarks,
        approvedBy: isApproved ? dto.approvedBy || 'Finance Head' : null,
        approvedAt: isApproved ? new Date() : null,
      },
    });

    await this.prisma.employeeExit.update({
      where: { id: exitId },
      data: {
        fnfStatus: isApproved ? 'COMPLETED' : 'IN_PROGRESS',
        status: isApproved ? 'FNF_COMPLETED' : 'FNF_PENDING',
        auditLogs: {
          create: {
            action: isApproved ? 'FNF_SETTLEMENT_APPROVED' : 'FNF_SETTLEMENT_CALCULATED',
            previousStatus: exit.status,
            newStatus: isApproved ? 'FNF_COMPLETED' : 'FNF_PENDING',
            performedBy: dto.approvedBy || 'Finance Head',
            remarks: `Full & Final Settlement calculated. Net payable: ₹${netPayable.toLocaleString('en-IN')}`,
          },
        },
      },
    });

    return fnf;
  }

  async completeExit(id: string, performedBy?: string) {
    const exit = await this.findOne(id);
    
    if (exit.clearanceStatus !== 'COMPLETED') {
      throw new BadRequestException('Cannot grant Final Exit Approval: Department clearances are not 100% completed.');
    }
    if (exit.exitInterviewStatus !== 'COMPLETED') {
      throw new BadRequestException('Cannot grant Final Exit Approval: Exit Interview questionnaire has not been completed.');
    }
    if (exit.fnfStatus !== 'COMPLETED') {
      throw new BadRequestException('Cannot grant Final Exit Approval: Full & Final Settlement (F&F) is pending finance approval.');
    }

    const lastWorkingDay = exit.adjustedLwd || exit.lastWorkingDay;

    // Transition Exit status to EXITED
    const updatedExit = await this.prisma.employeeExit.update({
      where: { id },
      data: {
        status: 'EXITED',
        auditLogs: {
          create: {
            action: 'OFFBOARDING_FINAL_COMPLETED',
            previousStatus: exit.status,
            newStatus: 'EXITED',
            performedBy: performedBy || 'HR Director',
            remarks: `Final Exit Approval granted. Employee status updated to EXITED as of LWD ${lastWorkingDay.toISOString().split('T')[0]}.`,
          },
        },
      },
    });

    // Update Employee Master status to EXITED & set dateOfExit
    await this.prisma.employee.update({
      where: { id: exit.employeeId },
      data: {
        status: 'EXITED',
        dateOfExit: lastWorkingDay,
      },
    });

    return updatedExit;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.employeeExit.delete({ where: { id } });
    return { success: true };
  }
}
