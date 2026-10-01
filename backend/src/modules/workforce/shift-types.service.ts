import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateShiftTypeDto, UpdateShiftTypeDto } from './dto/shift-type.dto';

@Injectable()
export class ShiftTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(companyId?: string, branchId?: string | null) {
    let sql = `
      SELECT 
        st.id,
        st.companyId,
        st.branchId,
        st.code,
        st.name,
        st.startTime,
        st.endTime,
        st.breakMinutes,
        st.workingHours,
        st.lateGraceMinutes,
        st.earlyExitGraceMinutes,
        st.halfDayThresholdHours,
        st.otEligible,
        st.otStartsAfterMinutes,
        st.weeklyOffDays,
        st.holidayHandling,
        st.colorTag,
        st.isNightShift,
        st.isActive,
        st.createdAt,
        st.updatedAt,
        b.name AS branchName
      FROM shift_types st
      LEFT JOIN branches b ON b.id = st.branchId
      WHERE 1=1
    `;
    const params: any[] = [];
    if (companyId) {
      sql += ` AND st.companyId = ?`;
      params.push(companyId);
    }
    if (branchId === 'HEAD_OFFICE' || branchId === 'NONE' || branchId === 'null') {
      sql += ` AND (st.branchId IS NULL OR st.branchId = 'HEAD_OFFICE')`;
    } else if (branchId && branchId !== 'ALL' && branchId !== 'undefined') {
      sql += ` AND st.branchId = ?`;
      params.push(branchId);
    }
    sql += ` ORDER BY st.name ASC`;

    const rows: any[] = await this.prisma.$queryRawUnsafe(sql, ...params);
    return rows.map((r) => ({
      ...r,
      otEligible: Boolean(r.otEligible),
      isNightShift: Boolean(r.isNightShift),
      isActive: Boolean(r.isActive),
      branchName: r.branchName || (r.branchId ? undefined : 'Head Office'),
      branch: r.branchId ? { id: r.branchId, name: r.branchName } : { id: 'HEAD_OFFICE', name: 'Head Office' },
    }));
  }

  async findById(id: string) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT st.*, b.name AS branchName 
       FROM shift_types st 
       LEFT JOIN branches b ON b.id = st.branchId 
       WHERE st.id = ? LIMIT 1`,
      id
    );
    if (!rows || rows.length === 0) {
      throw new NotFoundException('Shift type not found');
    }
    const r = rows[0];
    return {
      ...r,
      otEligible: Boolean(r.otEligible),
      isNightShift: Boolean(r.isNightShift),
      isActive: Boolean(r.isActive),
      branchName: r.branchName || (r.branchId ? undefined : 'Head Office'),
      branch: r.branchId ? { id: r.branchId, name: r.branchName } : { id: 'HEAD_OFFICE', name: 'Head Office' },
    };
  }

  async create(
    dto: CreateShiftTypeDto,
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

    const existing: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT id FROM shift_types WHERE companyId = ? AND code = ? LIMIT 1`,
      targetCompanyId,
      dto.code.trim().toUpperCase()
    );
    if (existing && existing.length > 0) {
      throw new ConflictException(
        `A shift type with code "${dto.code}" already exists for this company`
      );
    }

    const id = `st-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    const breakMin = dto.breakMinutes ?? 60;
    const workingHrs = dto.workingHours ?? 7.5;
    const lateGrace = dto.lateGraceMinutes ?? 10;
    const earlyGrace = dto.earlyExitGraceMinutes ?? 10;
    const halfDay = dto.halfDayThresholdHours ?? 4.0;
    const otEligible = dto.otEligible !== undefined ? (dto.otEligible ? 1 : 0) : 1;
    const otStartsAfter = dto.otStartsAfterMinutes ?? 30;
    const weeklyOff = dto.weeklyOffDays ?? 'Sunday';
    const holiday = dto.holidayHandling ?? 'Holiday Calendar';
    const color = dto.colorTag ?? 'blue';
    const isNight = dto.isNightShift ? 1 : 0;
    const isActive = dto.isActive !== undefined ? (dto.isActive ? 1 : 0) : 1;

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO shift_types (
        id, companyId, branchId, code, name, startTime, endTime, 
        breakMinutes, workingHours, lateGraceMinutes, earlyExitGraceMinutes, 
        halfDayThresholdHours, otEligible, otStartsAfterMinutes, 
        weeklyOffDays, holidayHandling, colorTag, isNightShift, isActive, 
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
      id,
      targetCompanyId,
      targetBranchId,
      dto.code.trim().toUpperCase(),
      dto.name.trim(),
      dto.startTime,
      dto.endTime,
      breakMin,
      workingHrs,
      lateGrace,
      earlyGrace,
      halfDay,
      otEligible,
      otStartsAfter,
      weeklyOff,
      holiday,
      color,
      isNight,
      isActive
    );

    return this.findById(id);
  }

  async update(
    id: string,
    dto: UpdateShiftTypeDto,
    tenantCompanyId?: string,
    tenantBranchId?: string | null,
  ) {
    const shift = await this.findById(id);
    if (tenantCompanyId && shift.companyId !== tenantCompanyId) {
      throw new ForbiddenException('Cannot edit shift of another company');
    }
    if (tenantBranchId) {
      if (tenantBranchId === 'HEAD_OFFICE') {
        if (shift.branchId !== null && shift.branchId !== undefined && shift.branchId !== 'HEAD_OFFICE') {
          throw new ForbiddenException('Cannot edit shift belonging to another branch');
        }
      } else {
        if (shift.branchId !== tenantBranchId) {
          throw new ForbiddenException('Cannot edit shift belonging to another branch');
        }
      }
    }

    const updates: string[] = ['updatedAt = NOW(3)'];
    const params: any[] = [];
    if (dto.name !== undefined) { updates.push('name = ?'); params.push(dto.name.trim()); }
    if (dto.code !== undefined) { updates.push('code = ?'); params.push(dto.code.trim().toUpperCase()); }
    if (dto.startTime !== undefined) { updates.push('startTime = ?'); params.push(dto.startTime); }
    if (dto.endTime !== undefined) { updates.push('endTime = ?'); params.push(dto.endTime); }
    if (dto.breakMinutes !== undefined) { updates.push('breakMinutes = ?'); params.push(dto.breakMinutes); }
    if (dto.workingHours !== undefined) { updates.push('workingHours = ?'); params.push(dto.workingHours); }
    if (dto.lateGraceMinutes !== undefined) { updates.push('lateGraceMinutes = ?'); params.push(dto.lateGraceMinutes); }
    if (dto.earlyExitGraceMinutes !== undefined) { updates.push('earlyExitGraceMinutes = ?'); params.push(dto.earlyExitGraceMinutes); }
    if (dto.halfDayThresholdHours !== undefined) { updates.push('halfDayThresholdHours = ?'); params.push(dto.halfDayThresholdHours); }
    if (dto.otEligible !== undefined) { updates.push('otEligible = ?'); params.push(dto.otEligible ? 1 : 0); }
    if (dto.otStartsAfterMinutes !== undefined) { updates.push('otStartsAfterMinutes = ?'); params.push(dto.otStartsAfterMinutes); }
    if (dto.weeklyOffDays !== undefined) { updates.push('weeklyOffDays = ?'); params.push(dto.weeklyOffDays); }
    if (dto.holidayHandling !== undefined) { updates.push('holidayHandling = ?'); params.push(dto.holidayHandling); }
    if (dto.colorTag !== undefined) { updates.push('colorTag = ?'); params.push(dto.colorTag); }
    if (dto.isNightShift !== undefined) { updates.push('isNightShift = ?'); params.push(dto.isNightShift ? 1 : 0); }
    if (dto.isActive !== undefined) { updates.push('isActive = ?'); params.push(dto.isActive ? 1 : 0); }
    if (dto.branchId !== undefined && !tenantBranchId) {
      const bId = (dto.branchId && dto.branchId !== 'HEAD_OFFICE' && dto.branchId !== 'ALL' && dto.branchId !== 'NONE') ? dto.branchId : null;
      updates.push('branchId = ?');
      params.push(bId);
    }

    params.push(id);
    await this.prisma.$executeRawUnsafe(
      `UPDATE shift_types SET ${updates.join(', ')} WHERE id = ?`,
      ...params
    );
    return this.findById(id);
  }

  async remove(
    id: string,
    tenantCompanyId?: string,
    tenantBranchId?: string | null,
  ) {
    const shift = await this.findById(id);
    if (tenantCompanyId && shift.companyId !== tenantCompanyId) {
      throw new ForbiddenException('Cannot delete shift of another company');
    }
    if (tenantBranchId) {
      if (tenantBranchId === 'HEAD_OFFICE') {
        if (shift.branchId !== null && shift.branchId !== undefined && shift.branchId !== 'HEAD_OFFICE') {
          throw new ForbiddenException('Cannot delete shift belonging to another branch');
        }
      } else {
        if (shift.branchId !== tenantBranchId) {
          throw new ForbiddenException('Cannot delete shift belonging to another branch');
        }
      }
    }

    await this.prisma.$executeRawUnsafe(`DELETE FROM shift_types WHERE id = ?`, id);
    return { success: true };
  }
}

