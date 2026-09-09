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
import { ExitClearanceMasterService } from './exit-clearance-master.service';

@Injectable()
export class ExitsService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clearanceMasterService: ExitClearanceMasterService,
  ) {}

  async onModuleInit() {
    try {
      const count = await this.prisma.employeeExit.count();
      if (count === 0) {
        const employees = await this.prisma.employee.findMany({
          take: 3,
          include: { department: true },
        });
        if (employees.length >= 2) {
          await this.create({
            employeeId: employees[0].id,
            resignationDate: '2026-07-01',
            noticePeriodDays: 60,
            lastWorkingDay: '2026-08-31',
            exitType: 'RESIGNATION',
            exitReason: 'Career Growth',
            remarks: 'Initiated voluntary resignation.',
            companyId: employees[0].companyId,
          });

          await this.create({
            employeeId: employees[1].id,
            resignationDate: '2026-07-15',
            noticePeriodDays: 90,
            lastWorkingDay: '2026-10-15',
            exitType: 'RESIGNATION',
            exitReason: 'Relocation',
            remarks: 'Relocating to another city.',
            companyId: employees[1].companyId,
          });
        }
      } else {
        // Automatically reconcile existing exit records against the Dynamic Clearance Master
        // to purge legacy unverified static items and align with company industry blueprints
        const allExits = await this.prisma.employeeExit.findMany({
          select: { id: true, exitCode: true },
        });
        for (const e of allExits) {
          try {
            await this.recalculateClearance(e.id, 'System Master Alignment');
          } catch (err) {
            console.error(`Failed to reconcile clearance for exit ${e.exitCode}:`, err);
          }
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
            assetAllocations: {
              where: { returnedAt: null },
              include: { asset: true },
              orderBy: { allocatedAt: 'desc' },
            },
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
      include: { department: true },
    });
    if (!employee) throw new NotFoundException('Employee record not found');

    const count = await this.prisma.employeeExit.count();
    const exitCode = `EXT-${300 + count + 1}`;

    const resignationDate = new Date(dto.resignationDate);
    const noticeDays = dto.noticePeriodDays ?? 90;
    const lastWorkingDay = dto.lastWorkingDay
      ? new Date(dto.lastWorkingDay)
      : new Date(resignationDate.getTime() + noticeDays * 24 * 60 * 60 * 1000);

    const exitType = dto.exitType || 'RESIGNATION';
    const isInterviewAutoWaived = ['ABSCONDING', 'DEATH'].includes(exitType);

    // Dynamic Intelligent Clearance Engine evaluation based on Company Industry & Employee Master
    const evaluatedTasks = await this.clearanceMasterService.evaluateClearanceForEmployee(
      employee,
      exitType,
      dto.companyId || employee.companyId,
    );

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
        exitType,
        exitReason: dto.exitReason,
        resignationLetterUrl: dto.resignationLetterUrl,
        remarks: dto.remarks,
        status: 'INITIATED',
        clearanceStatus: 'PENDING',
        fnfStatus: 'PENDING',
        exitInterviewStatus: isInterviewAutoWaived ? 'WAIVED' : 'PENDING',
        clearanceItems: {
          create: evaluatedTasks.map((t) => ({
            department: t.department,
            itemKey: t.ruleKey,
            itemLabel: t.itemLabel,
            status: t.status,
            remarks: t.exclusionReason
              ? `[${t.mandatoryType}] ${t.exclusionReason}`
              : `[${t.mandatoryType}] Required clearance`,
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
            remarks: `Exit initiated (${exitType}). Reason: ${dto.exitReason}. Notice period: ${noticeDays} days. LWD: ${lastWorkingDay.toISOString().split('T')[0]}.`,
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
        remarks: dto.remarks !== undefined ? dto.remarks : item.remarks,
      },
    });

    // Recheck overall exit clearance status
    // Only mandatory / conditional items that are applicable block completion
    const allItems = await this.prisma.exitClearanceItem.findMany({
      where: { exitId: item.exitId },
    });
    const blockingPending = allItems.filter(
      (i) => i.status === 'PENDING' && !i.remarks?.includes('[OPTIONAL]'),
    );
    const anyResolved = allItems.some(
      (i) => i.status === 'CLEARED' || i.status === 'VERIFIED' || i.status === 'WAIVED',
    );

    let overallClearanceStatus = 'PENDING';
    if (blockingPending.length === 0) overallClearanceStatus = 'COMPLETED';
    else if (anyResolved) overallClearanceStatus = 'IN_PROGRESS';

    await this.prisma.employeeExit.update({
      where: { id: item.exitId },
      data: {
        clearanceStatus: overallClearanceStatus,
        status: overallClearanceStatus === 'COMPLETED' && item.exit.status === 'CLEARANCE_PENDING'
          ? 'CLEARANCE_COMPLETED'
          : item.exit.status,
      },
    });

    return updatedItem;
  }

  /**
   * Audit-safe clearance re-evaluation:
   * 1. Preserves existing CLEARED and WAIVED task statuses, verifiers, dates, and audit history
   * 2. Maps legacy item keys to master ruleKeys for seamless historical continuity
   * 3. Creates new applicable tasks from Company Clearance Master
   * 4. Updates newly excluded conditional tasks to NOT_APPLICABLE
   * 5. Purges unverified PENDING legacy tasks that do not belong to the Company Master
   */
  async recalculateClearance(id: string, performedBy?: string) {
    const exit = await this.findOne(id);
    const evaluatedTasks = await this.clearanceMasterService.evaluateClearanceForEmployee(
      exit.employee,
      exit.exitType,
      exit.companyId || undefined,
    );

    const existingItems = exit.clearanceItems || [];
    const existingMap = new Map<string, typeof existingItems[0]>();
    for (const item of existingItems) {
      existingMap.set(item.itemKey.toLowerCase(), item);
    }

    // Mapping of legacy item keys to master rule keys for seamless history preservation
    const legacyKeyAliases: Record<string, string[]> = {
      admin_id_card: ['id_badge', 'admin_id_badge', 'admin_id_access_card'],
      it_laptop_return: ['laptop_hardware', 'it_laptop_hardware', 'it_workstation_hardware'],
      admin_mobile_return: ['mobile_sim', 'assets_mobile_sim'],
      prod_tool_kit_return: ['assigned_assets', 'tools_return'],
      ehs_ppe_return: ['ppe_return'],
      ops_shift_handover: ['work_handover'],
      prod_dept_handover: ['pending_tasks', 'kt_completion'],
      hr_service_closure: ['document_clearance'],
      hr_attendance_closure: ['attendance_closure', 'leave_encashment'],
      hr_exit_survey: ['exit_interview'],
    };

    const matchedExistingItemIds = new Set<string>();

    for (const task of evaluatedTasks) {
      // Find matching item by exact ruleKey, itemKey, or legacy alias
      let existing =
        existingMap.get(task.ruleKey.toLowerCase()) ||
        existingMap.get(task.itemKey.toLowerCase());

      if (!existing && legacyKeyAliases[task.ruleKey.toLowerCase()]) {
        for (const alias of legacyKeyAliases[task.ruleKey.toLowerCase()]) {
          const candidate = existingMap.get(alias.toLowerCase());
          if (candidate) {
            existing = candidate;
            break;
          }
        }
      }

      if (existing) {
        matchedExistingItemIds.add(existing.id);

        // If already CLEARED or WAIVED, preserve status, verifiedBy, verifiedAt, and remarks!
        if (existing.status === 'CLEARED' || existing.status === 'WAIVED') {
          // Normalize itemKey and label to current master rule
          if (existing.itemKey !== task.ruleKey) {
            await this.prisma.exitClearanceItem.update({
              where: { id: existing.id },
              data: {
                itemKey: task.ruleKey,
                itemLabel: task.itemLabel,
                department: task.department,
              },
            });
          }
          continue;
        }

        // If PENDING and now not applicable, mark NOT_APPLICABLE
        if (!task.isApplicable) {
          await this.prisma.exitClearanceItem.update({
            where: { id: existing.id },
            data: {
              itemKey: task.ruleKey,
              itemLabel: task.itemLabel,
              department: task.department,
              status: 'NOT_APPLICABLE',
              remarks: `[${task.mandatoryType}] ${task.exclusionReason || 'Not required for employee profile'}`,
            },
          });
        } else {
          // Task is applicable -> set to PENDING
          await this.prisma.exitClearanceItem.update({
            where: { id: existing.id },
            data: {
              itemKey: task.ruleKey,
              itemLabel: task.itemLabel,
              department: task.department,
              status: 'PENDING',
              remarks: `[${task.mandatoryType}] Required clearance`,
            },
          });
        }
      } else {
        // Create new task from evaluated master rule
        const created = await this.prisma.exitClearanceItem.create({
          data: {
            exitId: id,
            department: task.department,
            itemKey: task.ruleKey,
            itemLabel: task.itemLabel,
            status: task.status,
            remarks: task.exclusionReason
              ? `[${task.mandatoryType}] ${task.exclusionReason}`
              : `[${task.mandatoryType}] Required clearance`,
          },
        });
        matchedExistingItemIds.add(created.id);
      }
    }

    // Unmatched legacy items:
    // If completed (CLEARED / WAIVED): preserve as historical audit records
    // If unverified PENDING: purge so irrelevant tasks (SaaS, VPN, etc.) are NOT GENERATED!
    for (const item of existingItems) {
      if (!matchedExistingItemIds.has(item.id)) {
        if (item.status === 'CLEARED' || item.status === 'WAIVED') {
          // Historical completed item: keep it
        } else {
          // Unverified legacy task not in the Company Master: delete
          await this.prisma.exitClearanceItem.delete({
            where: { id: item.id },
          });
        }
      }
    }

    // Refresh items to compute overall clearance status
    const allItems = await this.prisma.exitClearanceItem.findMany({
      where: { exitId: id },
    });

    const pendingMandatory = allItems.filter(
      (i) => i.status === 'PENDING' && !i.remarks?.includes('[OPTIONAL]'),
    );
    const hasResolved = allItems.some(
      (i) => i.status === 'CLEARED' || i.status === 'WAIVED',
    );

    let overallClearanceStatus = 'PENDING';
    if (pendingMandatory.length === 0) overallClearanceStatus = 'COMPLETED';
    else if (hasResolved) overallClearanceStatus = 'IN_PROGRESS';

    const updated = await this.prisma.employeeExit.update({
      where: { id },
      data: {
        clearanceStatus: overallClearanceStatus,
        status:
          overallClearanceStatus === 'COMPLETED' && exit.status === 'CLEARANCE_PENDING'
            ? 'CLEARANCE_COMPLETED'
            : exit.status,
        auditLogs: {
          create: {
            action: 'CLEARANCE_RULES_RECALCULATED',
            previousStatus: exit.status,
            newStatus: exit.status,
            performedBy: performedBy || 'HR Admin',
            remarks: `Clearance matrix re-evaluated against Company Clearance Master. ${pendingMandatory.length} mandatory tasks pending.`,
          },
        },
      },
      include: {
        clearanceItems: { orderBy: [{ department: 'asc' }, { createdAt: 'asc' }] },
        auditLogs: { orderBy: { createdAt: 'desc' } },
        employee: {
          include: {
            department: true,
            designation: true,
          },
        },
      },
    });

    return updated;
  }

  async saveExitInterview(exitId: string, dto: SaveExitInterviewDto) {
    const exit = await this.findOne(exitId);
    const isWaived = dto.isWaived || false;
    const interviewStatus = isWaived ? 'WAIVED' : 'COMPLETED';

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
        hrRemarks: isWaived && dto.waiverReason ? `[WAIVED]: ${dto.waiverReason}` : dto.hrRemarks,
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
        hrRemarks: isWaived && dto.waiverReason ? `[WAIVED]: ${dto.waiverReason}` : dto.hrRemarks,
        completedAt: new Date(),
      },
    });

    await this.prisma.employeeExit.update({
      where: { id: exitId },
      data: {
        exitInterviewStatus: interviewStatus,
        status: exit.status === 'CLEARANCE_COMPLETED' ? 'EXIT_INTERVIEW' : exit.status,
        auditLogs: {
          create: {
            action: isWaived ? 'EXIT_INTERVIEW_WAIVED' : 'EXIT_INTERVIEW_COMPLETED',
            previousStatus: exit.status,
            newStatus: 'EXIT_INTERVIEW',
            performedBy: 'HR Manager',
            remarks: isWaived
              ? `Exit interview marked as waived. Reason: ${dto.waiverReason || 'Waived by HR Policy'}`
              : `Exit interview recorded. Primary reason: ${dto.primaryReason}`,
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
    const gratuity = dto.gratuity ?? 0;

    const noticeRecovery = dto.noticeRecovery ?? 0;
    const loanAdvanceRecovery = dto.loanAdvanceRecovery ?? 0;
    const assetRecovery = dto.assetRecovery ?? 0;
    const otherDeductions = dto.otherDeductions ?? 0;

    const grossPayable = salaryPayable + leaveEncashment + incentives + reimbursements + gratuity;
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

    // Gate 1: Check Mandatory / Required Clearance Items
    const pendingMandatory = (exit.clearanceItems || []).filter(
      (i) => i.status === 'PENDING' && !i.remarks?.includes('[OPTIONAL]'),
    );
    if (pendingMandatory.length > 0) {
      const itemsList = pendingMandatory
        .map((i) => `• ${i.itemLabel} — ${i.department}`)
        .join('\n');
      throw new BadRequestException(
        `FINAL SIGNOFF BLOCKED\n\n${pendingMandatory.length} mandatory clearance item(s) pending:\n${itemsList}`,
      );
    }

    // Gate 2: Check Exit Interview questionnaire
    if (exit.exitInterviewStatus !== 'COMPLETED' && exit.exitInterviewStatus !== 'WAIVED') {
      throw new BadRequestException(
        'FINAL SIGNOFF BLOCKED: Required Exit Interview questionnaire has not been completed or waived.',
      );
    }

    // Gate 3: Check Full & Final Settlement (F&F)
    if (exit.fnfStatus !== 'COMPLETED') {
      throw new BadRequestException(
        'FINAL SIGNOFF BLOCKED: Full & Final Settlement (F&F) is pending Finance approval.',
      );
    }

    const lastWorkingDay = exit.adjustedLwd || exit.lastWorkingDay;
    const nextEmpStatus = exit.exitType === 'TERMINATION' ? 'TERMINATED' : 'EXITED';

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
            remarks: `Final Exit Approval granted. Employee status updated to ${nextEmpStatus} (Separated) as of LWD ${lastWorkingDay.toISOString().split('T')[0]}.`,
          },
        },
      },
    });

    // Update Employee Master status to EXITED & set dateOfExit
    await this.prisma.employee.update({
      where: { id: exit.employeeId },
      data: {
        status: nextEmpStatus as any,
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
