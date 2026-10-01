import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateWeeklyOffPolicyDto,
  UpdateWeeklyOffPolicyDto,
} from './dto/weekly-off-policy.dto';

@Injectable()
export class WeeklyOffPoliciesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(companyId?: string, branchId?: string | null) {
    let sql = `
      SELECT 
        wo.*,
        b.name AS branchName
      FROM weekly_off_policies wo
      LEFT JOIN branches b ON b.id = wo.branchId
      WHERE 1=1
    `;
    const params: any[] = [];
    if (companyId) {
      sql += ` AND wo.companyId = ?`;
      params.push(companyId);
    }
    if (branchId === 'HEAD_OFFICE' || branchId === 'NONE' || branchId === 'null') {
      sql += ` AND (wo.branchId IS NULL OR wo.branchId = 'HEAD_OFFICE')`;
    } else if (branchId && branchId !== 'ALL' && branchId !== 'undefined') {
      sql += ` AND wo.branchId = ?`;
      params.push(branchId);
    }
    sql += ` ORDER BY wo.createdAt DESC`;

    const rows: any[] = await this.prisma.$queryRawUnsafe(sql, ...params);
    return rows.map((r) => this.formatPolicyRow(r));
  }

  async findById(id: string) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT wo.*, b.name AS branchName FROM weekly_off_policies wo LEFT JOIN branches b ON b.id = wo.branchId WHERE wo.id = ? LIMIT 1`,
      id
    );
    if (!rows || rows.length === 0) {
      throw new NotFoundException('Weekly off policy not found');
    }
    return this.formatPolicyRow(rows[0]);
  }

  async create(
    dto: CreateWeeklyOffPolicyDto,
    tenantCompanyId?: string,
    tenantBranchId?: string | null,
  ) {
    const targetCompanyId = tenantCompanyId || dto.companyId;

    let targetBranchId: string | null = null;
    if (tenantBranchId === 'HEAD_OFFICE' || tenantBranchId === 'NONE' || tenantBranchId === 'null') {
      targetBranchId = null;
    } else if (tenantBranchId) {
      targetBranchId = tenantBranchId;
    } else if (dto.branchId && dto.branchId !== 'HEAD_OFFICE' && dto.branchId !== 'ALL' && dto.branchId !== 'NONE') {
      targetBranchId = dto.branchId;
    }

    // Check duplicate code within scope
    const existing: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT id FROM weekly_off_policies WHERE companyId = ? AND code = ? LIMIT 1`,
      targetCompanyId,
      dto.code.trim().toUpperCase()
    );
    if (existing && existing.length > 0) {
      throw new ConflictException(
        `A weekly off policy with code "${dto.code}" already exists for this company`
      );
    }

    const id = `wo-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    const schedulePatternStr = typeof dto.schedulePattern === 'string'
      ? dto.schedulePattern
      : JSON.stringify(dto.schedulePattern || {});

    const multipleFixedStr = dto.multipleFixedDays
      ? JSON.stringify(dto.multipleFixedDays)
      : null;
    const multipleHalfStr = dto.multipleHalfDays
      ? JSON.stringify(dto.multipleHalfDays)
      : null;

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO weekly_off_policies (
        id, companyId, branchId, code, name, description, status,
        effectiveFrom, effectiveTo, type, schedulePattern,
        fixedDay, multipleFixedDays, halfDay, halfDaySession, multipleHalfDays,
        rotationPattern, rotationOffRule, assignmentSource,
        alternatePrimaryDay, alternatePattern, alternateSecondaryDay, alternateAction,
        customDeterminedBy, applicableTo, applicableTarget,
        minWorkingDaysPerWeek, maxConsecutiveWorkingDays, minWeeklyOffDays,
        allowOffDaySwap, requireApprovalForSwap, holidayInteraction,
        allowOverride, reasonRequired, approvalRequired, auditTrail,
        createdAt, updatedAt
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        NOW(3), NOW(3)
      )`,
      id,
      targetCompanyId,
      targetBranchId,
      dto.code.trim().toUpperCase(),
      dto.name.trim(),
      dto.description || '',
      dto.status || 'Active',
      dto.effectiveFrom,
      dto.effectiveTo || null,
      dto.type || 'Fixed (Single Full Day)',
      schedulePatternStr,
      dto.fixedDay || null,
      multipleFixedStr,
      dto.halfDay || null,
      dto.halfDaySession || null,
      multipleHalfStr,
      dto.rotationPattern || null,
      dto.rotationOffRule || null,
      dto.assignmentSource || null,
      dto.alternatePrimaryDay || null,
      dto.alternatePattern || null,
      dto.alternateSecondaryDay || null,
      dto.alternateAction || null,
      dto.customDeterminedBy || null,
      dto.applicableTo || 'Entire Company',
      dto.applicableTarget || '',
      dto.minWorkingDaysPerWeek ?? 6,
      dto.maxConsecutiveWorkingDays ?? 6,
      dto.minWeeklyOffDays ?? 1,
      dto.allowOffDaySwap !== undefined ? (dto.allowOffDaySwap ? 1 : 0) : 1,
      dto.requireApprovalForSwap !== undefined ? (dto.requireApprovalForSwap ? 1 : 0) : 1,
      dto.holidayInteraction || 'No additional off',
      dto.allowOverride !== undefined ? (dto.allowOverride ? 1 : 0) : 1,
      dto.reasonRequired !== undefined ? (dto.reasonRequired ? 1 : 0) : 1,
      dto.approvalRequired !== undefined ? (dto.approvalRequired ? 1 : 0) : 1,
      dto.auditTrail !== undefined ? (dto.auditTrail ? 1 : 0) : 1
    );

    return this.findById(id);
  }

  async update(
    id: string,
    dto: UpdateWeeklyOffPolicyDto,
    tenantCompanyId?: string,
    tenantBranchId?: string | null,
  ) {
    const existing = await this.findById(id);
    if (tenantCompanyId && existing.companyId !== tenantCompanyId) {
      throw new ForbiddenException('Cannot edit policy of another company');
    }
    if (tenantBranchId) {
      if (tenantBranchId === 'HEAD_OFFICE') {
        if (existing.branchId !== null && existing.branchId !== undefined && existing.branchId !== 'HEAD_OFFICE') {
          throw new ForbiddenException('Cannot edit policy belonging to another branch');
        }
      } else {
        if (existing.branchId !== tenantBranchId) {
          throw new ForbiddenException('Cannot edit policy belonging to another branch');
        }
      }
    }

    const updates: string[] = ['updatedAt = NOW(3)'];
    const params: any[] = [];

    if (dto.name !== undefined) { updates.push('name = ?'); params.push(dto.name.trim()); }
    if (dto.code !== undefined) { updates.push('code = ?'); params.push(dto.code.trim().toUpperCase()); }
    if (dto.description !== undefined) { updates.push('description = ?'); params.push(dto.description); }
    if (dto.status !== undefined) { updates.push('status = ?'); params.push(dto.status); }
    if (dto.effectiveFrom !== undefined) { updates.push('effectiveFrom = ?'); params.push(dto.effectiveFrom); }
    if (dto.effectiveTo !== undefined) { updates.push('effectiveTo = ?'); params.push(dto.effectiveTo || null); }
    if (dto.type !== undefined) { updates.push('type = ?'); params.push(dto.type); }
    if (dto.schedulePattern !== undefined) {
      updates.push('schedulePattern = ?');
      params.push(typeof dto.schedulePattern === 'string' ? dto.schedulePattern : JSON.stringify(dto.schedulePattern));
    }
    if (dto.fixedDay !== undefined) { updates.push('fixedDay = ?'); params.push(dto.fixedDay || null); }
    if (dto.multipleFixedDays !== undefined) {
      updates.push('multipleFixedDays = ?');
      params.push(dto.multipleFixedDays ? JSON.stringify(dto.multipleFixedDays) : null);
    }
    if (dto.halfDay !== undefined) { updates.push('halfDay = ?'); params.push(dto.halfDay || null); }
    if (dto.halfDaySession !== undefined) { updates.push('halfDaySession = ?'); params.push(dto.halfDaySession || null); }
    if (dto.multipleHalfDays !== undefined) {
      updates.push('multipleHalfDays = ?');
      params.push(dto.multipleHalfDays ? JSON.stringify(dto.multipleHalfDays) : null);
    }
    if (dto.rotationPattern !== undefined) { updates.push('rotationPattern = ?'); params.push(dto.rotationPattern || null); }
    if (dto.rotationOffRule !== undefined) { updates.push('rotationOffRule = ?'); params.push(dto.rotationOffRule || null); }
    if (dto.assignmentSource !== undefined) { updates.push('assignmentSource = ?'); params.push(dto.assignmentSource || null); }
    if (dto.alternatePrimaryDay !== undefined) { updates.push('alternatePrimaryDay = ?'); params.push(dto.alternatePrimaryDay || null); }
    if (dto.alternatePattern !== undefined) { updates.push('alternatePattern = ?'); params.push(dto.alternatePattern || null); }
    if (dto.alternateSecondaryDay !== undefined) { updates.push('alternateSecondaryDay = ?'); params.push(dto.alternateSecondaryDay || null); }
    if (dto.alternateAction !== undefined) { updates.push('alternateAction = ?'); params.push(dto.alternateAction || null); }
    if (dto.customDeterminedBy !== undefined) { updates.push('customDeterminedBy = ?'); params.push(dto.customDeterminedBy || null); }
    if (dto.applicableTo !== undefined) { updates.push('applicableTo = ?'); params.push(dto.applicableTo); }
    if (dto.applicableTarget !== undefined) { updates.push('applicableTarget = ?'); params.push(dto.applicableTarget); }
    if (dto.minWorkingDaysPerWeek !== undefined) { updates.push('minWorkingDaysPerWeek = ?'); params.push(dto.minWorkingDaysPerWeek); }
    if (dto.maxConsecutiveWorkingDays !== undefined) { updates.push('maxConsecutiveWorkingDays = ?'); params.push(dto.maxConsecutiveWorkingDays); }
    if (dto.minWeeklyOffDays !== undefined) { updates.push('minWeeklyOffDays = ?'); params.push(dto.minWeeklyOffDays); }
    if (dto.allowOffDaySwap !== undefined) { updates.push('allowOffDaySwap = ?'); params.push(dto.allowOffDaySwap ? 1 : 0); }
    if (dto.requireApprovalForSwap !== undefined) { updates.push('requireApprovalForSwap = ?'); params.push(dto.requireApprovalForSwap ? 1 : 0); }
    if (dto.holidayInteraction !== undefined) { updates.push('holidayInteraction = ?'); params.push(dto.holidayInteraction); }
    if (dto.allowOverride !== undefined) { updates.push('allowOverride = ?'); params.push(dto.allowOverride ? 1 : 0); }
    if (dto.reasonRequired !== undefined) { updates.push('reasonRequired = ?'); params.push(dto.reasonRequired ? 1 : 0); }
    if (dto.approvalRequired !== undefined) { updates.push('approvalRequired = ?'); params.push(dto.approvalRequired ? 1 : 0); }
    if (dto.auditTrail !== undefined) { updates.push('auditTrail = ?'); params.push(dto.auditTrail ? 1 : 0); }

    params.push(id);
    await this.prisma.$executeRawUnsafe(
      `UPDATE weekly_off_policies SET ${updates.join(', ')} WHERE id = ?`,
      ...params
    );

    return this.findById(id);
  }

  async remove(id: string, tenantCompanyId?: string, tenantBranchId?: string | null) {
    const existing = await this.findById(id);
    if (tenantCompanyId && existing.companyId !== tenantCompanyId) {
      throw new ForbiddenException('Cannot delete policy of another company');
    }
    if (tenantBranchId) {
      if (tenantBranchId === 'HEAD_OFFICE') {
        if (existing.branchId !== null && existing.branchId !== undefined && existing.branchId !== 'HEAD_OFFICE') {
          throw new ForbiddenException('Cannot delete policy belonging to another branch');
        }
      } else {
        if (existing.branchId !== tenantBranchId) {
          throw new ForbiddenException('Cannot delete policy belonging to another branch');
        }
      }
    }

    await this.prisma.$executeRawUnsafe(
      `DELETE FROM weekly_off_policies WHERE id = ?`,
      id
    );
    return { success: true };
  }

  private formatPolicyRow(r: any) {
    let pattern = {};
    try {
      pattern = typeof r.schedulePattern === 'string' ? JSON.parse(r.schedulePattern) : r.schedulePattern;
    } catch {}

    let multFixed: string[] = [];
    try {
      multFixed = typeof r.multipleFixedDays === 'string' ? JSON.parse(r.multipleFixedDays) : r.multipleFixedDays;
    } catch {}

    let multHalf: any[] = [];
    try {
      multHalf = typeof r.multipleHalfDays === 'string' ? JSON.parse(r.multipleHalfDays) : r.multipleHalfDays;
    } catch {}

    return {
      id: r.id,
      companyId: r.companyId,
      branchId: r.branchId,
      branchName: r.branchName || (r.branchId ? undefined : 'Head Office'),
      branch: r.branchId ? { id: r.branchId, name: r.branchName } : { id: 'HEAD_OFFICE', name: 'Head Office' },
      code: r.code,
      name: r.name,
      description: r.description || '',
      status: r.status,
      effectiveFrom: r.effectiveFrom,
      effectiveTo: r.effectiveTo || undefined,
      type: r.type,
      schedulePattern: pattern,
      fixedDay: r.fixedDay || undefined,
      multipleFixedDays: multFixed || undefined,
      halfDay: r.halfDay || undefined,
      halfDaySession: r.halfDaySession || undefined,
      multipleHalfDays: multHalf || undefined,
      rotationPattern: r.rotationPattern || undefined,
      rotationOffRule: r.rotationOffRule || undefined,
      assignmentSource: r.assignmentSource || undefined,
      alternatePrimaryDay: r.alternatePrimaryDay || undefined,
      alternatePattern: r.alternatePattern || undefined,
      alternateSecondaryDay: r.alternateSecondaryDay || undefined,
      alternateAction: r.alternateAction || undefined,
      customDeterminedBy: r.customDeterminedBy || undefined,
      applicableTo: r.applicableTo,
      applicableTarget: r.applicableTarget || '',
      minWorkingDaysPerWeek: Number(r.minWorkingDaysPerWeek),
      maxConsecutiveWorkingDays: Number(r.maxConsecutiveWorkingDays),
      minWeeklyOffDays: Number(r.minWeeklyOffDays),
      allowOffDaySwap: Boolean(r.allowOffDaySwap),
      requireApprovalForSwap: Boolean(r.requireApprovalForSwap),
      holidayInteraction: r.holidayInteraction,
      allowOverride: Boolean(r.allowOverride),
      reasonRequired: Boolean(r.reasonRequired),
      approvalRequired: Boolean(r.approvalRequired),
      auditTrail: Boolean(r.auditTrail),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }
}
