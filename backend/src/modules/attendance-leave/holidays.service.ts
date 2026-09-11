import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateHolidayDto, UpdateHolidayDto } from './dto/holiday.dto';

const INITIAL_HOLIDAYS_MOCK = [
  {
    name: 'Republic Day',
    date: '2026-01-26',
    type: 'Mandatory',
    category: 'National',
    scope: 'Company',
    applicableLocations: ['All Company Entities'],
    isPaid: true,
    isOptional: false,
    attendanceOverride: true,
    payrollImpact: 'Paid Holiday',
    description: 'National statutory holiday celebrating Constitution of India.',
    duration: 'Full Day',
    applicableTo: 'Company',
    applicableTarget: 'All Company Entities',
  },
  {
    name: 'Ambedkar Jayanti',
    date: '2026-04-14',
    type: 'Regional',
    category: 'Regional',
    scope: 'Branch',
    applicableLocations: ['Pune Manufacturing Plant', 'Mumbai Office'],
    isPaid: true,
    isOptional: false,
    attendanceOverride: true,
    payrollImpact: 'Paid Holiday',
    description: 'Birth anniversary of Dr. B. R. Ambedkar.',
    duration: 'Full Day',
    applicableTo: 'Branch',
    applicableTarget: 'Pune Manufacturing Plant',
  },
  {
    name: 'Maharashtra Day',
    date: '2026-05-01',
    type: 'Regional',
    category: 'Regional',
    scope: 'Branch',
    applicableLocations: ['Pune Manufacturing Plant', 'Mumbai Office'],
    isPaid: true,
    isOptional: false,
    attendanceOverride: true,
    payrollImpact: 'Paid Holiday',
    description: 'Statehood day celebrating Maharashtra state formation.',
    duration: 'Full Day',
    applicableTo: 'Branch',
    applicableTarget: 'Pune Manufacturing Plant',
  },
  {
    name: 'Independence Day',
    date: '2026-08-15',
    type: 'Mandatory',
    category: 'National',
    scope: 'Company',
    applicableLocations: ['All Company Entities'],
    isPaid: true,
    isOptional: false,
    attendanceOverride: true,
    payrollImpact: 'Paid Holiday',
    description: 'National statutory holiday celebrating Indian Independence.',
    duration: 'Full Day',
    applicableTo: 'Company',
    applicableTarget: 'All Company Entities',
  },
  {
    name: 'Ganesh Chaturthi',
    date: '2026-09-19',
    type: 'Regional',
    category: 'Festival',
    scope: 'Company',
    applicableLocations: ['All Company Entities'],
    isPaid: true,
    isOptional: false,
    attendanceOverride: true,
    payrollImpact: 'Paid Holiday',
    description: 'Auspicious festival celebrating Lord Ganesha.',
    duration: 'Full Day',
    applicableTo: 'Company',
    applicableTarget: 'All Company Entities',
  },
  {
    name: 'Anant Chaturdashi',
    date: '2026-09-28',
    type: 'Regional',
    category: 'Festival',
    scope: 'Branch',
    applicableLocations: ['Pune Manufacturing Plant'],
    isPaid: true,
    isOptional: false,
    attendanceOverride: true,
    payrollImpact: 'Paid Holiday',
    description: 'Festival culmination and visarjan holiday.',
    duration: 'Full Day',
    applicableTo: 'Branch',
    applicableTarget: 'Pune Manufacturing Plant',
  },
  {
    name: 'Gandhi Jayanti',
    date: '2026-10-02',
    type: 'Mandatory',
    category: 'National',
    scope: 'Company',
    applicableLocations: ['All Company Entities'],
    isPaid: true,
    isOptional: false,
    attendanceOverride: true,
    payrollImpact: 'Paid Holiday',
    description: 'Birth anniversary of Mahatma Gandhi.',
    duration: 'Full Day',
    applicableTo: 'Company',
    applicableTarget: 'All Company Entities',
  },
  {
    name: 'Dussehra (Vijayadashami)',
    date: '2026-10-20',
    type: 'Restricted / Optional',
    category: 'Festival',
    scope: 'Branch',
    applicableLocations: ['Pune Manufacturing Plant'],
    isPaid: true,
    isOptional: true,
    attendanceOverride: true,
    payrollImpact: 'Paid Holiday',
    description: 'Restricted festival holiday selectable by employees.',
    duration: 'Full Day',
    applicableTo: 'Branch',
    applicableTarget: 'Pune Manufacturing Plant',
  },
  {
    name: 'Diwali (Laxmi Pujan)',
    date: '2026-11-08',
    type: 'Mandatory',
    category: 'Festival',
    scope: 'Company',
    applicableLocations: ['All Company Entities'],
    isPaid: true,
    isOptional: false,
    attendanceOverride: true,
    payrollImpact: 'Paid Holiday',
    description: 'Major national festival of lights.',
    duration: 'Full Day',
    applicableTo: 'Company',
    applicableTarget: 'All Company Entities',
  },
  {
    name: 'Christmas Day',
    date: '2026-12-25',
    type: 'Mandatory',
    category: 'Festival',
    scope: 'Company',
    applicableLocations: ['All Company Entities'],
    isPaid: true,
    isOptional: false,
    attendanceOverride: true,
    payrollImpact: 'Paid Holiday',
    description: 'Annual festival celebrating Christmas across all branches.',
    duration: 'Full Day',
    applicableTo: 'Company',
    applicableTarget: 'All Company Entities',
  },
];

@Injectable()
export class HolidaysService {
  constructor(private readonly prisma: PrismaService) {}

  private formatDateString(d: any): string {
    if (!d) return '';
    if (typeof d === 'string') return d.slice(0, 10);
    if (d instanceof Date) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return String(d).slice(0, 10);
  }

  private mapDbRowToHoliday(row: any) {
    let locs: string[] = ['All Company Entities'];
    try {
      if (row.applicableLocations) {
        if (typeof row.applicableLocations === 'string') {
          locs = JSON.parse(row.applicableLocations);
        } else if (Array.isArray(row.applicableLocations)) {
          locs = row.applicableLocations;
        }
      }
    } catch {}

    const dateStr = this.formatDateString(row.date);

    return {
      id: row.id,
      companyId: row.companyId,
      name: row.name,
      date: dateStr,
      type: row.type || 'Mandatory',
      category: row.category || 'National',
      scope: row.scope || 'Company',
      applicableTo: row.applicableTo || 'Company',
      applicableTarget: row.applicableTarget || (locs[0] || 'All Company Entities'),
      applicableLocations: locs,
      duration: row.duration || 'Full Day',
      session: row.session || 'Morning',
      isPaid: row.isPaid === 1 || row.isPaid === true,
      isOptional: row.isOptional === 1 || row.isOptional === true,
      attendanceOverride: row.attendanceOverride !== 0 && row.attendanceOverride !== false,
      payrollImpact: row.payrollImpact || 'Paid Holiday',
      description: row.description || '',
      isActive: row.isActive === 1 || row.isActive === true,
      branchId: row.branchId || null,
      branchName: row.branchName || (row.applicableTo === 'Branch' ? row.applicableTarget : 'All Branches'),
      applicableCategory: row.applicableCategory || 'All Employees',
      otApplicable: row.otApplicable === undefined || row.otApplicable === null ? true : (row.otApplicable === 1 || row.otApplicable === true),
      createdAt: row.createdAt,
    };
  }

  async list(companyId?: string, year?: number) {
    let whereClauses: string[] = [];
    let params: any[] = [];

    if (companyId) {
      whereClauses.push('(companyId = ? OR companyId = "" OR companyId IS NULL)');
      params.push(companyId);
    }

    if (year) {
      whereClauses.push('YEAR(date) = ?');
      params.push(Number(year));
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    let rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM holidays ${whereSql} ORDER BY date ASC`,
      ...params
    );

    // If no holidays in database for this company, seed the default statutory holidays
    if (rows.length === 0 && companyId) {
      await this.seedDefaultHolidays(companyId);
      rows = await this.prisma.$queryRawUnsafe(
        `SELECT * FROM holidays WHERE companyId = ? ORDER BY date ASC`,
        companyId
      );
    }

    return rows.map((r) => this.mapDbRowToHoliday(r));
  }

  async findById(id: string) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM holidays WHERE id = ? LIMIT 1`,
      id
    );
    if (!rows || rows.length === 0) throw new NotFoundException('Holiday not found');
    return this.mapDbRowToHoliday(rows[0]);
  }

  async create(dto: CreateHolidayDto & { duration?: string; session?: string; applicableTo?: string; applicableTarget?: string }) {
    const id = `h_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const dateStr = this.formatDateString(dto.date);
    const locsJson = JSON.stringify(
      dto.applicableLocations && dto.applicableLocations.length > 0
        ? dto.applicableLocations
        : [dto.applicableTarget || 'All Company Entities']
    );

    const branchId = dto.branchId || null;
    const branchName = dto.branchName || (dto.applicableTo === 'Branch' ? dto.applicableTarget : 'All Branches');
    const applicableCategory = dto.applicableCategory || 'All Employees';
    const otApplicable = dto.otApplicable !== false ? 1 : 0;

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO holidays (
        id, companyId, name, date, type, isActive,
        category, scope, applicableLocations, isPaid, isOptional,
        attendanceOverride, payrollImpact, description, duration,
        session, applicableTo, applicableTarget, branchId, branchName,
        applicableCategory, otApplicable, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3))`,
      id,
      dto.companyId,
      dto.name.trim(),
      dateStr,
      dto.type || 'Mandatory',
      dto.isActive ?? true ? 1 : 0,
      dto.category || 'National',
      dto.scope || dto.applicableTo || 'Company',
      locsJson,
      dto.isPaid ?? true ? 1 : 0,
      dto.isOptional ?? false ? 1 : 0,
      dto.attendanceOverride ?? true ? 1 : 0,
      dto.payrollImpact || 'Paid Holiday',
      dto.description || '',
      dto.duration || 'Full Day',
      dto.session || null,
      dto.applicableTo || 'Company',
      dto.applicableTarget || 'All Company Entities',
      branchId,
      branchName,
      applicableCategory,
      otApplicable
    );

    // ── SYNC TO ATTENDANCE ──
    // When a holiday is declared, automatically mark attendance records for all active employees as 'HOLIDAY'
    if (dto.attendanceOverride !== false) {
      await this.syncHolidayToAttendance(dto.companyId, dateStr, dto.name);
    }

    return this.findById(id);
  }

  async update(id: string, dto: UpdateHolidayDto & { duration?: string; session?: string; applicableTo?: string; applicableTarget?: string }) {
    const existing = await this.findById(id);
    const dateStr = dto.date ? this.formatDateString(dto.date) : existing.date;
    const name = dto.name !== undefined ? dto.name.trim() : existing.name;
    const locs = dto.applicableLocations || (dto.applicableTarget ? [dto.applicableTarget] : existing.applicableLocations);
    const locsJson = JSON.stringify(locs);

    await this.prisma.$executeRawUnsafe(
      `UPDATE holidays SET
        name = ?,
        date = ?,
        type = ?,
        category = ?,
        scope = ?,
        applicableLocations = ?,
        isPaid = ?,
        isOptional = ?,
        attendanceOverride = ?,
        payrollImpact = ?,
        description = ?,
        duration = ?,
        session = ?,
        applicableTo = ?,
        applicableTarget = ?,
        isActive = ?
      WHERE id = ?`,
      name,
      dateStr,
      dto.type || existing.type,
      dto.category || existing.category,
      dto.scope || dto.applicableTo || existing.scope,
      locsJson,
      dto.isPaid !== undefined ? (dto.isPaid ? 1 : 0) : (existing.isPaid ? 1 : 0),
      dto.isOptional !== undefined ? (dto.isOptional ? 1 : 0) : (existing.isOptional ? 1 : 0),
      dto.attendanceOverride !== undefined ? (dto.attendanceOverride ? 1 : 0) : (existing.attendanceOverride ? 1 : 0),
      dto.payrollImpact || existing.payrollImpact,
      dto.description !== undefined ? dto.description : existing.description,
      dto.duration || existing.duration,
      dto.session || existing.session,
      dto.applicableTo || existing.applicableTo,
      dto.applicableTarget || existing.applicableTarget,
      dto.isActive !== undefined ? (dto.isActive ? 1 : 0) : (existing.isActive ? 1 : 0),
      id
    );

    // Sync to attendance on date
    const companyId = dto.companyId || existing.companyId;
    await this.syncHolidayToAttendance(companyId, dateStr, name);

    return this.findById(id);
  }

  async remove(id: string) {
    const existing = await this.findById(id);
    await this.prisma.$executeRawUnsafe(`DELETE FROM holidays WHERE id = ?`, id);

    // Remove or reset attendance records that were marked by system as this holiday
    try {
      await this.prisma.$executeRawUnsafe(
        `DELETE FROM attendance_records WHERE date = ? AND source = 'SYSTEM_HOLIDAY'`,
        existing.date
      );
    } catch {}

    return { success: true };
  }

  /**
   * Automatically populate or override attendance for all active company employees on declared holiday date
   */
  private async syncHolidayToAttendance(companyId: string, dateStr: string, holidayName: string) {
    try {
      const holDate = new Date(dateStr);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (holDate > today) {
        // Do not create future attendance records for upcoming holidays;
        // future dates should only appear when reached or via calendar/roster logic.
        return;
      }

      const employees: any[] = await this.prisma.employee.findMany({
        where: companyId ? { companyId, status: 'ACTIVE' } : { status: 'ACTIVE' },
        select: { id: true, companyId: true },
      });

      for (const emp of employees) {
        const attId = `att_hol_${emp.id}_${dateStr.replace(/-/g, '')}`;
        const effCompanyId = emp.companyId || companyId;
        const remarks = `Declared Holiday: ${holidayName}`;

        await this.prisma.$executeRawUnsafe(
          `INSERT INTO attendance_records (
            id, companyId, employeeId, date, status, source, remarks, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, 'HOLIDAY', 'SYSTEM_HOLIDAY', ?, NOW(3), NOW(3))
          ON DUPLICATE KEY UPDATE
            status = 'HOLIDAY',
            source = 'SYSTEM_HOLIDAY',
            remarks = VALUES(remarks),
            updatedAt = NOW(3)`,
          attId,
          effCompanyId,
          emp.id,
          dateStr,
          remarks
        );
      }
    } catch (err) {
      console.warn('Error syncing holiday to attendance records:', err);
    }
  }

  private async seedDefaultHolidays(companyId: string) {
    for (const h of INITIAL_HOLIDAYS_MOCK) {
      try {
        const id = `h_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const locsJson = JSON.stringify(h.applicableLocations);
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO holidays (
            id, companyId, name, date, type, isActive,
            category, scope, applicableLocations, isPaid, isOptional,
            attendanceOverride, payrollImpact, description, duration,
            applicableTo, applicableTarget, createdAt
          ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3))`,
          id,
          companyId,
          h.name,
          h.date,
          h.type,
          h.category,
          h.scope,
          locsJson,
          h.isPaid ? 1 : 0,
          h.isOptional ? 1 : 0,
          h.attendanceOverride ? 1 : 0,
          h.payrollImpact,
          h.description,
          h.duration,
          h.applicableTo,
          h.applicableTarget
        );

        // Also sync to attendance records
        await this.syncHolidayToAttendance(companyId, h.date, h.name);
      } catch (err) {
        console.warn('Error seeding default holiday:', h.name, err);
      }
    }
  }
}
