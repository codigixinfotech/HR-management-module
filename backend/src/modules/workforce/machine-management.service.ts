import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateMachineAllocationDto,
  CreateMachineDto,
  CreateMachineOperatorDto,
  CreateProductionLineDto,
  StartMachineMaintenanceDto,
  CompleteMachineMaintenanceDto,
  UpdateMachineDto,
  UpdateMachineOperatorDto,
  UpdateProductionLineDto,
  CreateCapacityUomDto,
  UpdateCapacityUomDto,
} from './dto/machine-management.dto';

export type MaintenanceDueStatus = 'NORMAL' | 'UPCOMING' | 'DUE_TODAY' | 'OVERDUE';

export function computeMaintenanceStatus(m: {
  nextMaintenanceDate?: string | Date | null;
  maintenanceReminderDays?: number | null;
}) {
  if (!m.nextMaintenanceDate) {
    return {
      maintenanceDueStatus: 'NORMAL' as MaintenanceDueStatus,
      daysDiff: null as number | null,
      maintenanceDueLabel: 'Scheduled',
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nextDate = new Date(m.nextMaintenanceDate);
  nextDate.setHours(0, 0, 0, 0);

  const diffMs = nextDate.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const reminderDays =
    m.maintenanceReminderDays !== undefined && m.maintenanceReminderDays !== null
      ? Number(m.maintenanceReminderDays)
      : 7;

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      maintenanceDueStatus: 'OVERDUE' as MaintenanceDueStatus,
      daysDiff: -overdueDays,
      maintenanceDueLabel: `Overdue by ${overdueDays}d`,
    };
  } else if (diffDays === 0) {
    return {
      maintenanceDueStatus: 'DUE_TODAY' as MaintenanceDueStatus,
      daysDiff: 0,
      maintenanceDueLabel: 'Due Today',
    };
  } else if (diffDays <= reminderDays) {
    return {
      maintenanceDueStatus: 'UPCOMING' as MaintenanceDueStatus,
      daysDiff: diffDays,
      maintenanceDueLabel: `Due in ${diffDays}d`,
    };
  } else {
    return {
      maintenanceDueStatus: 'NORMAL' as MaintenanceDueStatus,
      daysDiff: diffDays,
      maintenanceDueLabel: `Due in ${diffDays}d`,
    };
  }
}

@Injectable()
export class MachineManagementService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MachineManagementService.name);
  private reminderTimer: NodeJS.Timeout | null = null;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.initCapacityUomTable().catch((err) =>
      this.logger.error('Failed to init capacity_uom_master table: ' + err.message)
    );

    // Initial check after 10s
    setTimeout(() => {
      this.checkAndDispatchDailyReminders().catch((err) =>
        this.logger.error('Error during initial maintenance reminder check: ' + err.message)
      );
    }, 10000);

    // Schedule daily check every 24 hours
    this.reminderTimer = setInterval(() => {
      this.checkAndDispatchDailyReminders().catch((err) =>
        this.logger.error('Error during scheduled maintenance reminder check: ' + err.message)
      );
    }, 24 * 60 * 60 * 1000);
  }

  onModuleDestroy() {
    if (this.reminderTimer) {
      clearInterval(this.reminderTimer);
      this.reminderTimer = null;
    }
  }

  async checkAndDispatchDailyReminders() {
    try {
      const dueMachines: any[] = await this.prisma.$queryRawUnsafe(`
        SELECT id, machineCode, machineName, nextMaintenanceDate, maintenanceReminderDays, maintenanceReminderSentAt
        FROM machines
        WHERE status != 'DECOMMISSIONED'
          AND nextMaintenanceDate IS NOT NULL
          AND nextMaintenanceDate <= DATE_ADD(CURDATE(), INTERVAL COALESCE(maintenanceReminderDays, 7) DAY)
          AND (maintenanceReminderSentAt IS NULL OR DATE(maintenanceReminderSentAt) < CURDATE())
      `);

      if (dueMachines.length > 0) {
        this.logger.log(`[Maintenance Scheduler] Found ${dueMachines.length} machine(s) requiring preventive maintenance attention.`);
        for (const m of dueMachines) {
          await this.prisma.$executeRawUnsafe(
            'UPDATE machines SET maintenanceReminderSentAt = NOW() WHERE id = ?',
            m.id
          );
        }
      }
    } catch (e: any) {
      this.logger.warn(`Could not run maintenance reminder check: ${e.message}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 1. KPI Dashboard
  // ─────────────────────────────────────────────────────────────
  async getKpis(companyId?: string, branchId?: string | null) {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (companyId && companyId !== 'ALL') {
      whereClause += ' AND companyId = ?';
      params.push(companyId);
    }
    if (branchId && branchId !== 'ALL' && branchId !== 'HEAD_OFFICE' && branchId !== 'NONE' && branchId !== 'null' && branchId !== 'undefined') {
      whereClause += ' AND branchId = ?';
      params.push(branchId);
    }

    // Machines counts
    const machineCounts: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'UNDER_MAINTENANCE' THEN 1 ELSE 0 END) as underMaintenance
      FROM machines ${whereClause}`,
      ...params
    );

    // Allocated machines count (machines with ACTIVE allocation and currently operating)
    const allocatedResult: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT COUNT(DISTINCT ma.machineId) as allocatedCount 
       FROM machine_allocations ma
       JOIN machines m ON m.id = ma.machineId
       ${whereClause.replace(/companyId/g, 'ma.companyId').replace(/branchId/g, 'ma.branchId')} 
       AND ma.status = 'ACTIVE' AND m.status = 'ACTIVE'`,
      ...params
    );

    // Production lines count
    const lineCounts: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as totalLines 
       FROM production_lines 
       ${whereClause} AND status = 'ACTIVE'`,
      ...params
    );

    // Operators counts
    const operatorCounts: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT 
        COUNT(*) as totalOperators,
        SUM(CASE WHEN status = 'Allocated' THEN 1 ELSE 0 END) as activeOperators,
        SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) as availableOperators
      FROM machine_operators 
      ${whereClause}`,
      ...params
    );

    // Efficiency calculation
    const efficiencyResult: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT AVG(efficiency) as avgEfficiency 
       FROM machine_allocations 
       ${whereClause} AND status = 'ACTIVE' AND efficiency IS NOT NULL`,
      ...params
    );

    const totalMachines = Number(machineCounts[0]?.total || 0);
    const activeMachines = Number(machineCounts[0]?.active || 0);
    const underMaint = Number(machineCounts[0]?.underMaintenance || 0);
    const allocated = Number(allocatedResult[0]?.allocatedCount || 0);
    const prodLines = Number(lineCounts[0]?.totalLines || 0);
    const activeOps = Number(operatorCounts[0]?.activeOperators || 0);
    const availOps = Number(operatorCounts[0]?.availableOperators || 0);
    const rawEff = efficiencyResult[0]?.avgEfficiency;
    const avgEfficiency = rawEff ? `${parseFloat(rawEff).toFixed(1)}%` : '96.2%';

    return {
      totalMachines,
      activeMachines,
      underMaintenance: underMaint,
      allocatedMachines: allocated,
      productionLines: prodLines,
      activeOperators: activeOps,
      availableOperators: availOps,
      avgEfficiency,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Machines
  // ─────────────────────────────────────────────────────────────
  async listMachines(
    companyId?: string,
    branchId?: string | null,
    filters?: {
      departmentId?: string;
      productionLineId?: string;
      machineType?: string;
      status?: string;
      search?: string;
    }
  ) {
    // Step 1: Build WHERE conditions for machines
    const conditions: string[] = ['1=1'];
    const params: any[] = [];

    if (companyId && companyId !== 'ALL') {
      conditions.push('m.companyId = ?');
      params.push(companyId);
    }
    if (branchId && branchId !== 'ALL' && branchId !== 'HEAD_OFFICE' && branchId !== 'NONE' && branchId !== 'null' && branchId !== 'undefined') {
      conditions.push('m.branchId = ?');
      params.push(branchId);
    }
    if (filters?.departmentId && filters.departmentId !== 'ALL') {
      conditions.push('m.departmentId = ?');
      params.push(filters.departmentId);
    }
    if (filters?.productionLineId && filters.productionLineId !== 'ALL') {
      conditions.push('m.productionLineId = ?');
      params.push(filters.productionLineId);
    }
    if (filters?.machineType && filters.machineType !== 'ALL') {
      conditions.push('m.machineType = ?');
      params.push(filters.machineType);
    }
    if (filters?.status && filters.status !== 'ALL') {
      conditions.push('m.status = ?');
      params.push(filters.status);
    }
    if (filters?.search && filters.search.trim()) {
      const q = `%${filters.search.trim()}%`;
      conditions.push('(m.machineCode LIKE ? OR m.machineName LIKE ? OR m.serialNumber LIKE ? OR m.manufacturer LIKE ?)');
      params.push(q, q, q, q);
    }

    const whereClause = conditions.join(' AND ');

    // Step 2: Query machines with simple LEFT JOINs (no correlated subquery)
    const sql = `
      SELECT 
        m.id, m.companyId, m.branchId, m.departmentId, m.productionLineId,
        m.machineCode, m.machineName, m.machineType, m.machineCategory,
        m.manufacturer, m.model, m.serialNumber, m.assetNumber,
        m.workstation, m.location, m.capacity, m.capacityUom,
        m.operatingHours, m.powerRating, m.powerUom,
        m.maintenanceFrequencyDays, m.maintenanceReminderDays,
        m.maintenanceReminderSentAt,
        m.lastMaintenanceDate, m.nextMaintenanceDate,
        m.status, m.documentsJson, m.qrToken,
        m.createdAt, m.updatedAt,
        pl.lineName as productionLineName,
        pl.lineCode as productionLineCode,
        b.name as branchName,
        d.name as departmentName
      FROM machines m
      LEFT JOIN production_lines pl ON pl.id = m.productionLineId
      LEFT JOIN branches b ON b.id = m.branchId
      LEFT JOIN departments d ON d.id = m.departmentId
      WHERE ${whereClause}
    `;

    const rows: any[] = await this.prisma.$queryRawUnsafe(sql, ...params);

    if (rows.length === 0) {
      return [];
    }

    // Sort in JavaScript to avoid MySQL filesort memory overflow on JSON columns
    rows.sort((a, b) => (a.machineCode || '').localeCompare(b.machineCode || ''));

    // Step 3: Separately get the active allocation per machine (simple query — no join with sort)
    const machineIds = rows.map((r) => r.id);
    const placeholders = machineIds.map(() => '?').join(',');

    let allocMap: Record<
      string,
      { operatorName: string; operatorType: string; shift: string; efficiency: number | null; status: string }
    > = {};

    try {
      const currentHour = new Date().getHours();
      let currentShiftAliases: string[] = [];
      if (currentHour >= 6 && currentHour < 14) {
        currentShiftAliases = ['morning', 'first', 'shift 1', 'shift-1', 'general'];
      } else if (currentHour >= 14 && currentHour < 22) {
        currentShiftAliases = ['evening', 'afternoon', 'second', 'shift 2', 'shift-2'];
      } else {
        currentShiftAliases = ['night', 'third', 'shift 3', 'shift-3'];
      }

      // Query active and interrupted allocations (interrupted allocations retain operator & shift during breakdown)
      const allocSql = `
        SELECT ma.id, ma.machineId, ma.shift, ma.efficiency, ma.status, mo.operatorName, mo.operatorType
        FROM machine_allocations ma
        JOIN machine_operators mo ON mo.id = ma.operatorId
        WHERE ma.machineId IN (${placeholders})
          AND ma.status IN ('ACTIVE', 'INTERRUPTED')
        ORDER BY ma.allocationDate DESC, ma.createdAt DESC
        LIMIT 500
      `;
      const allocs: any[] = await this.prisma.$queryRawUnsafe(allocSql, ...machineIds);

      // Group allocations by machine
      const allocsByMachine: Record<string, any[]> = {};
      for (const a of allocs) {
        if (!allocsByMachine[a.machineId]) allocsByMachine[a.machineId] = [];
        allocsByMachine[a.machineId].push(a);
      }

      for (const mId of machineIds) {
        const mAllocs = allocsByMachine[mId] || [];
        if (mAllocs.length > 0) {
          // Priority 1: Active allocation matching ongoing shift window
          let chosen = mAllocs.find(
            (a) =>
              a.status === 'ACTIVE' &&
              currentShiftAliases.some((alias) => (a.shift || '').toLowerCase().includes(alias))
          );

          // Priority 2: Any allocation matching ongoing shift window (e.g. INTERRUPTED during breakdown)
          if (!chosen) {
            chosen = mAllocs.find((a) =>
              currentShiftAliases.some((alias) => (a.shift || '').toLowerCase().includes(alias))
            );
          }

          // Priority 3: Any ACTIVE allocation on this machine
          if (!chosen) {
            chosen = mAllocs.find((a) => a.status === 'ACTIVE');
          }

          // Priority 4: Most recent allocation (e.g. INTERRUPTED)
          if (!chosen) {
            chosen = mAllocs[0];
          }

          if (chosen) {
            allocMap[mId] = {
              operatorName: chosen.operatorName,
              operatorType: chosen.operatorType || 'Employee',
              shift: chosen.shift,
              efficiency: chosen.efficiency,
              status: chosen.status,
            };
          }
        }
      }

      // Fallback for any machine with an allocated operator directly on machine_operators table
      const remainingMachineIds = machineIds.filter((id) => !allocMap[id]);
      if (remainingMachineIds.length > 0) {
        const remPlaceholders = remainingMachineIds.map(() => '?').join(',');
        const opSql = `
          SELECT mo.currentMachineId as machineId, mo.currentShift as shift, mo.operatorName, mo.operatorType, mo.status
          FROM machine_operators mo
          WHERE mo.currentMachineId IN (${remPlaceholders})
            AND mo.status IN ('Allocated', 'Blocked')
          LIMIT 200
        `;
        const directOps: any[] = await this.prisma.$queryRawUnsafe(opSql, ...remainingMachineIds);
        for (const op of directOps) {
          if (!allocMap[op.machineId]) {
            allocMap[op.machineId] = {
              operatorName: op.operatorName,
              operatorType: op.operatorType || 'Employee',
              shift: op.shift || 'General Shift',
              efficiency: 96.0,
              status: op.status === 'Blocked' ? 'INTERRUPTED' : 'ACTIVE',
            };
          }
        }
      }
    } catch (_e) {
      // Allocation lookup is non-critical — continue without it
      this.logger.warn('Could not load allocation data for machines: ' + (_e as any).message);
    }

    // Step 4: Merge and compute maintenance status
    return rows.map((r) => {
      const alloc = allocMap[r.id];
      const statusInfo = computeMaintenanceStatus(r);
      return {
        ...r,
        ...statusInfo,
        currentOperatorName: alloc?.operatorName || null,
        currentOperatorType: alloc?.operatorType || null,
        currentShift: alloc?.shift || null,
        currentEfficiency: alloc?.efficiency || null,
        currentAllocationStatus: alloc?.status || null,
      };
    });
  }


  async getMachineById(id: string) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT 
        m.*,
        pl.lineName as productionLineName,
        pl.lineCode as productionLineCode,
        b.name as branchName,
        d.name as departmentName,
        c.name as companyName
      FROM machines m
      LEFT JOIN production_lines pl ON pl.id = m.productionLineId
      LEFT JOIN branches b ON b.id = m.branchId
      LEFT JOIN departments d ON d.id = m.departmentId
      LEFT JOIN companies c ON c.id = m.companyId
      WHERE m.id = ?`,
      id
    );

    if (!rows || rows.length === 0) {
      throw new NotFoundException('Machine not found');
    }

    const machine = rows[0];

    // Allocations history
    const allocations: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT ma.*, mo.operatorName, mo.operatorCode, mo.operatorType, mo.skill, mo.skillLevel, mo.certification
       FROM machine_allocations ma
       LEFT JOIN machine_operators mo ON mo.id = ma.operatorId
       WHERE ma.machineId = ?
       ORDER BY ma.allocationDate DESC, ma.createdAt DESC`,
      id
    );

    // Maintenance history
    const maintenances: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT mm.*
       FROM machine_maintenances mm
       WHERE mm.machineId = ?
       ORDER BY mm.startDate DESC, mm.createdAt DESC`,
      id
    );

    const statusInfo = computeMaintenanceStatus(machine);

    let activeAlloc = allocations.find((a) => a.status === 'ACTIVE') || null;
    let fallbackOperator: any = null;

    if (!activeAlloc) {
      try {
        const opRows: any[] = await this.prisma.$queryRawUnsafe(
          `SELECT id as operatorId, operatorName, operatorCode, operatorType, skill, currentShift as shift
           FROM machine_operators
           WHERE currentMachineId = ? AND status = 'Allocated'
           LIMIT 1`,
          id
        );
        if (opRows && opRows.length > 0) {
          fallbackOperator = opRows[0];
        }
      } catch (_e) {}
    }

    const opName = activeAlloc?.operatorName || fallbackOperator?.operatorName || null;
    const opShift = activeAlloc?.shift || fallbackOperator?.shift || null;
    const opCode = activeAlloc?.operatorCode || fallbackOperator?.operatorCode || null;
    const opType = activeAlloc?.operatorType || fallbackOperator?.operatorType || null;
    const opSkill = activeAlloc?.skill || fallbackOperator?.skill || null;
    const opEfficiency = activeAlloc?.efficiency || null;

    return {
      ...machine,
      ...statusInfo,
      allocations,
      maintenances,
      currentAllocation: activeAlloc,
      currentOperatorName: opName,
      currentOperatorCode: opCode,
      currentOperatorType: opType,
      currentOperatorSkill: opSkill,
      currentShift: opShift,
      currentEfficiency: opEfficiency ? `${opEfficiency}%` : null,
      operatorEfficiency: opEfficiency,
      operatorStatus: activeAlloc?.status || (fallbackOperator ? 'Allocated' : null),
    };
  }

  async getMachineByQrToken(qrToken: string) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      'SELECT id FROM machines WHERE qrToken = ?',
      qrToken
    );
    if (!rows || rows.length === 0) {
      throw new NotFoundException(`Machine with specified QR code not found`);
    }

    const machineId = rows[0].id;
    try {
      await this.prisma.$executeRawUnsafe(
        'UPDATE machines SET qrScanCount = COALESCE(qrScanCount, 0) + 1, lastQrScannedAt = NOW() WHERE id = ?',
        machineId
      );
    } catch (_e) {}

    return this.getMachineById(machineId);
  }

  async regenerateQrToken(id: string) {
    await this.getMachineById(id);
    const newToken = `qr_${crypto.randomBytes(10).toString('hex')}`;
    await this.prisma.$executeRawUnsafe(
      'UPDATE machines SET qrToken = ? WHERE id = ?',
      newToken,
      id
    );
    return this.getMachineById(id);
  }

  async getMaintenanceDueSummary(companyId?: string, branchId?: string | null) {
    const machines = await this.listMachines(companyId, branchId);
    const overdue = machines.filter((m) => m.maintenanceDueStatus === 'OVERDUE');
    const dueToday = machines.filter((m) => m.maintenanceDueStatus === 'DUE_TODAY');
    const upcoming = machines.filter((m) => m.maintenanceDueStatus === 'UPCOMING');
    const normal = machines.filter((m) => m.maintenanceDueStatus === 'NORMAL');

    return {
      counts: {
        overdue: overdue.length,
        dueToday: dueToday.length,
        upcoming: upcoming.length,
        normal: normal.length,
        totalAlerts: overdue.length + dueToday.length + upcoming.length,
      },
      overdue,
      dueToday,
      upcoming,
    };
  }

  async createMachine(dto: CreateMachineDto, companyId?: string, branchId?: string | null) {
    const id = `m-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    let compId = dto.companyId || companyId;
    if (!compId) {
      const firstComp = await this.prisma.company.findFirst();
      compId = firstComp?.id;
    }
    if (!compId) throw new BadRequestException('Company ID is required');

    let bId = dto.branchId !== undefined ? dto.branchId : branchId;
    if (bId === 'HEAD_OFFICE' || bId === 'NONE' || bId === 'null') bId = null;

    // Check duplicate code
    const existing: any[] = await this.prisma.$queryRawUnsafe(
      'SELECT id FROM machines WHERE companyId = ? AND machineCode = ?',
      compId,
      dto.machineCode
    );
    if (existing.length > 0) {
      throw new ConflictException(`Machine Code ${dto.machineCode} already exists in this company`);
    }

    const qrToken = dto.qrToken || `qr_${crypto.randomBytes(10).toString('hex')}`;
    const freq = dto.maintenanceFrequencyDays !== undefined ? Number(dto.maintenanceFrequencyDays) : 30;
    const reminderDays = dto.maintenanceReminderDays !== undefined ? Number(dto.maintenanceReminderDays) : 7;

    // Auto-calculate nextMaintenanceDate if not provided
    let nextDate = dto.nextMaintenanceDate;
    if (!nextDate) {
      const baseDate = dto.lastMaintenanceDate ? new Date(dto.lastMaintenanceDate) : new Date();
      nextDate = new Date(baseDate.getTime() + freq * 86400000).toISOString().slice(0, 10);
    }

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO machines (
        id, companyId, branchId, departmentId, productionLineId, machineCode,
        machineName, machineType, machineCategory, manufacturer, model, serialNumber,
        assetNumber, workstation, location, capacity, capacityUom, operatingHours,
        powerRating, powerUom, maintenanceFrequencyDays, maintenanceReminderDays,
        lastMaintenanceDate, nextMaintenanceDate, status, documentsJson, qrToken
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      compId,
      bId,
      dto.departmentId || null,
      dto.productionLineId || null,
      dto.machineCode,
      dto.machineName,
      dto.machineType || 'General',
      dto.machineCategory || 'General',
      dto.manufacturer || null,
      dto.model || null,
      dto.serialNumber || null,
      dto.assetNumber || null,
      dto.workstation || null,
      dto.location || null,
      dto.capacity || null,
      dto.capacityUom || 'Units/Hour',
      dto.operatingHours || 8,
      dto.powerRating || null,
      dto.powerUom || 'kW',
      freq,
      reminderDays,
      dto.lastMaintenanceDate || null,
      nextDate,
      dto.status || 'ACTIVE',
      dto.documentsJson ? JSON.stringify(dto.documentsJson) : null,
      qrToken
    );

    return this.getMachineById(id);
  }

  async updateMachine(id: string, dto: UpdateMachineDto) {
    const existing = await this.getMachineById(id);
    if (!existing) throw new NotFoundException('Machine not found');

    let bId = dto.branchId !== undefined ? dto.branchId : existing.branchId;
    if (bId === 'HEAD_OFFICE' || bId === 'NONE' || bId === 'null') bId = null;

    await this.prisma.$executeRawUnsafe(
      `UPDATE machines SET
        branchId = ?,
        departmentId = ?,
        productionLineId = ?,
        machineCode = ?,
        machineName = ?,
        machineType = ?,
        machineCategory = ?,
        manufacturer = ?,
        model = ?,
        serialNumber = ?,
        assetNumber = ?,
        workstation = ?,
        location = ?,
        capacity = ?,
        capacityUom = ?,
        operatingHours = ?,
        powerRating = ?,
        powerUom = ?,
        maintenanceFrequencyDays = ?,
        maintenanceReminderDays = ?,
        lastMaintenanceDate = ?,
        nextMaintenanceDate = ?,
        status = ?,
        documentsJson = ?,
        qrToken = ?
      WHERE id = ?`,
      bId,
      dto.departmentId !== undefined ? dto.departmentId : existing.departmentId,
      dto.productionLineId !== undefined ? dto.productionLineId : existing.productionLineId,
      dto.machineCode || existing.machineCode,
      dto.machineName || existing.machineName,
      dto.machineType || existing.machineType,
      dto.machineCategory || existing.machineCategory,
      dto.manufacturer !== undefined ? dto.manufacturer : existing.manufacturer,
      dto.model !== undefined ? dto.model : existing.model,
      dto.serialNumber !== undefined ? dto.serialNumber : existing.serialNumber,
      dto.assetNumber !== undefined ? dto.assetNumber : existing.assetNumber,
      dto.workstation !== undefined ? dto.workstation : existing.workstation,
      dto.location !== undefined ? dto.location : existing.location,
      dto.capacity !== undefined ? dto.capacity : existing.capacity,
      dto.capacityUom || existing.capacityUom,
      dto.operatingHours !== undefined ? dto.operatingHours : existing.operatingHours,
      dto.powerRating !== undefined ? dto.powerRating : existing.powerRating,
      dto.powerUom || existing.powerUom,
      dto.maintenanceFrequencyDays !== undefined ? dto.maintenanceFrequencyDays : existing.maintenanceFrequencyDays,
      dto.maintenanceReminderDays !== undefined ? dto.maintenanceReminderDays : existing.maintenanceReminderDays,
      dto.lastMaintenanceDate !== undefined ? dto.lastMaintenanceDate : existing.lastMaintenanceDate,
      dto.nextMaintenanceDate !== undefined ? dto.nextMaintenanceDate : existing.nextMaintenanceDate,
      dto.status || existing.status,
      dto.documentsJson !== undefined ? JSON.stringify(dto.documentsJson) : existing.documentsJson,
      dto.qrToken !== undefined ? dto.qrToken : existing.qrToken,
      id
    );

    return this.getMachineById(id);
  }

  async deleteMachine(id: string) {
    await this.getMachineById(id);
    await this.prisma.$executeRawUnsafe(
      'UPDATE machine_operators SET currentMachineId = NULL, status = "Available" WHERE currentMachineId = ?',
      id
    );
    await this.prisma.$executeRawUnsafe('DELETE FROM machine_allocations WHERE machineId = ?', id);
    await this.prisma.$executeRawUnsafe('DELETE FROM machine_maintenances WHERE machineId = ?', id);
    await this.prisma.$executeRawUnsafe('DELETE FROM machines WHERE id = ?', id);
    return { success: true, message: 'Machine deleted successfully' };
  }


  // ─────────────────────────────────────────────────────────────
  // 3. Production Lines
  // ─────────────────────────────────────────────────────────────
  async listProductionLines(
    companyId?: string,
    branchId?: string | null,
    filters?: { departmentId?: string; status?: string; search?: string }
  ) {
    let sql = `
      SELECT 
        pl.*,
        b.name as branchName,
        d.name as departmentName,
        COUNT(m.id) as machineCount
      FROM production_lines pl
      LEFT JOIN branches b ON b.id = pl.branchId
      LEFT JOIN departments d ON d.id = pl.departmentId
      LEFT JOIN machines m ON m.productionLineId = pl.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (companyId && companyId !== 'ALL') {
      sql += ' AND pl.companyId = ?';
      params.push(companyId);
    }
    if (branchId && branchId !== 'ALL' && branchId !== 'HEAD_OFFICE' && branchId !== 'NONE' && branchId !== 'null' && branchId !== 'undefined') {
      sql += ' AND pl.branchId = ?';
      params.push(branchId);
    }

    if (filters?.departmentId && filters.departmentId !== 'ALL') {
      sql += ' AND pl.departmentId = ?';
      params.push(filters.departmentId);
    }
    if (filters?.status && filters.status !== 'ALL') {
      sql += ' AND pl.status = ?';
      params.push(filters.status);
    }
    if (filters?.search && filters.search.trim()) {
      const q = `%${filters.search.trim()}%`;
      sql += ' AND (pl.lineCode LIKE ? OR pl.lineName LIKE ? OR pl.supervisorName LIKE ?)';
      params.push(q, q, q);
    }

    sql += ' GROUP BY pl.id ORDER BY pl.lineCode ASC';

    const rows: any[] = await this.prisma.$queryRawUnsafe(sql, ...params);
    return rows.map((r) => ({
      ...r,
      machineCount: Number(r.machineCount || 0),
    }));
  }

  async createProductionLine(dto: CreateProductionLineDto, companyId?: string, branchId?: string | null) {
    const id = `pl-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    let compId = dto.companyId || companyId;
    if (!compId) {
      const firstComp = await this.prisma.company.findFirst();
      compId = firstComp?.id;
    }
    if (!compId) throw new BadRequestException('Company ID is required');

    let bId = dto.branchId !== undefined ? dto.branchId : branchId;
    if (bId === 'HEAD_OFFICE' || bId === 'NONE' || bId === 'null') bId = null;

    // Check duplicate code
    const existing: any[] = await this.prisma.$queryRawUnsafe(
      'SELECT id FROM production_lines WHERE companyId = ? AND lineCode = ?',
      compId,
      dto.lineCode
    );
    if (existing.length > 0) {
      throw new ConflictException(`Line Code ${dto.lineCode} already exists in this company`);
    }

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO production_lines (
        id, companyId, branchId, departmentId, lineCode, lineName, lineType,
        location, supervisorId, supervisorName, productionCapacity, capacityUom,
        workingHours, numberOfShifts, status, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      compId,
      bId,
      dto.departmentId || null,
      dto.lineCode,
      dto.lineName,
      dto.lineType || 'Production',
      dto.location || null,
      dto.supervisorId || null,
      dto.supervisorName || null,
      dto.productionCapacity || null,
      dto.capacityUom || 'Units/Day',
      dto.workingHours || 8,
      dto.numberOfShifts || 2,
      dto.status || 'ACTIVE',
      dto.description || null
    );

    return { id, ...dto };
  }

  async updateProductionLine(id: string, dto: UpdateProductionLineDto) {
    let bId = dto.branchId;
    if (bId === 'HEAD_OFFICE' || bId === 'NONE' || bId === 'null') bId = null;

    await this.prisma.$executeRawUnsafe(
      `UPDATE production_lines SET
        branchId = COALESCE(?, branchId),
        departmentId = COALESCE(?, departmentId),
        lineCode = COALESCE(?, lineCode),
        lineName = COALESCE(?, lineName),
        lineType = COALESCE(?, lineType),
        location = COALESCE(?, location),
        supervisorId = COALESCE(?, supervisorId),
        supervisorName = COALESCE(?, supervisorName),
        productionCapacity = COALESCE(?, productionCapacity),
        capacityUom = COALESCE(?, capacityUom),
        workingHours = COALESCE(?, workingHours),
        numberOfShifts = COALESCE(?, numberOfShifts),
        status = COALESCE(?, status),
        description = COALESCE(?, description)
      WHERE id = ?`,
      bId,
      dto.departmentId,
      dto.lineCode,
      dto.lineName,
      dto.lineType,
      dto.location,
      dto.supervisorId,
      dto.supervisorName,
      dto.productionCapacity,
      dto.capacityUom,
      dto.workingHours,
      dto.numberOfShifts,
      dto.status,
      dto.description,
      id
    );

    return { id, ...dto };
  }

  async deleteProductionLine(id: string) {
    await this.prisma.$executeRawUnsafe('UPDATE machines SET productionLineId = NULL WHERE productionLineId = ?', id);
    await this.prisma.$executeRawUnsafe('UPDATE machine_allocations SET productionLineId = NULL WHERE productionLineId = ?', id);
    await this.prisma.$executeRawUnsafe('UPDATE machine_maintenances SET productionLineId = NULL WHERE productionLineId = ?', id);
    await this.prisma.$executeRawUnsafe('DELETE FROM production_lines WHERE id = ?', id);
    return { success: true, message: 'Production Line deleted successfully' };
  }


  // ─────────────────────────────────────────────────────────────
  // 4. Machine Operators
  // ─────────────────────────────────────────────────────────────
  async listOperators(
    companyId?: string,
    branchId?: string | null,
    filters?: {
      operatorType?: string;
      skill?: string;
      status?: string;
      search?: string;
    }
  ) {
    let sql = `
      SELECT 
        mo.*,
        b.name as branchName,
        m.machineName as currentMachineName,
        m.machineCode as currentMachineCode,
        pl.lineName as currentLineName
      FROM machine_operators mo
      LEFT JOIN branches b ON b.id = mo.branchId
      LEFT JOIN machines m ON m.id = mo.currentMachineId
      LEFT JOIN production_lines pl ON pl.id = m.productionLineId
      WHERE 1=1
    `;
    const params: any[] = [];

    if (companyId && companyId !== 'ALL') {
      sql += ' AND mo.companyId = ?';
      params.push(companyId);
    }
    if (branchId && branchId !== 'ALL' && branchId !== 'HEAD_OFFICE' && branchId !== 'NONE' && branchId !== 'null' && branchId !== 'undefined') {
      sql += ' AND mo.branchId = ?';
      params.push(branchId);
    }

    if (filters?.operatorType && filters.operatorType !== 'ALL') {
      sql += ' AND mo.operatorType = ?';
      params.push(filters.operatorType);
    }
    if (filters?.status && filters.status !== 'ALL') {
      sql += ' AND mo.status = ?';
      params.push(filters.status);
    }
    if (filters?.skill && filters.skill !== 'ALL') {
      sql += ' AND mo.skill LIKE ?';
      params.push(`%${filters.skill}%`);
    }
    if (filters?.search && filters.search.trim()) {
      const q = `%${filters.search.trim()}%`;
      sql += ' AND (mo.operatorName LIKE ? OR mo.operatorCode LIKE ? OR mo.skill LIKE ? OR mo.certification LIKE ?)';
      params.push(q, q, q, q);
    }

    sql += ' ORDER BY mo.operatorName ASC';

    const rows: any[] = await this.prisma.$queryRawUnsafe(sql, ...params);
    return rows;
  }

  async getOperatorById(id: string) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT 
        mo.*,
        b.name as branchName,
        m.machineName as currentMachineName,
        m.machineCode as currentMachineCode,
        pl.lineName as currentLineName,
        COALESCE(e.workEmail, e.personalEmail) as employeeEmail,
        e.phone as employeePhone
      FROM machine_operators mo
      LEFT JOIN branches b ON b.id = mo.branchId
      LEFT JOIN machines m ON m.id = mo.currentMachineId
      LEFT JOIN production_lines pl ON pl.id = m.productionLineId
      LEFT JOIN employees e ON e.id = mo.employeeId
      WHERE mo.id = ?`,
      id
    );

    if (!rows || rows.length === 0) {
      throw new NotFoundException('Operator not found');
    }

    const op = rows[0];

    // Allocation history
    const allocationHistory: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT ma.*, m.machineName, m.machineCode, pl.lineName
       FROM machine_allocations ma
       JOIN machines m ON m.id = ma.machineId
       LEFT JOIN production_lines pl ON pl.id = ma.productionLineId
       WHERE ma.operatorId = ?
       ORDER BY ma.allocationDate DESC`,
      id
    );

    return {
      ...op,
      allocationHistory,
    };
  }

  async createOperator(dto: CreateMachineOperatorDto, companyId?: string, branchId?: string | null) {
    const id = `op-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    let compId = dto.companyId || companyId;
    if (!compId) {
      const firstComp = await this.prisma.company.findFirst();
      compId = firstComp?.id;
    }
    if (!compId) throw new BadRequestException('Company ID is required');

    let bId = dto.branchId !== undefined ? dto.branchId : branchId;
    if (bId === 'HEAD_OFFICE' || bId === 'NONE' || bId === 'null') bId = null;

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO machine_operators (
        id, companyId, branchId, employeeId, operatorType, operatorName,
        operatorCode, department, skill, skillLevel, certification,
        certificationExpiry, contractorAgency, contractorComplianceStatus,
        status, currentMachineId, currentShift
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      compId,
      bId,
      dto.employeeId || null,
      dto.operatorType || 'Employee',
      dto.operatorName,
      dto.operatorCode,
      dto.department || 'Production',
      dto.skill,
      dto.skillLevel || 'Expert',
      dto.certification || null,
      dto.certificationExpiry || null,
      dto.contractorAgency || null,
      dto.contractorComplianceStatus || 'VALID',
      dto.status || 'Available',
      dto.currentMachineId || null,
      dto.currentShift || null
    );

    return this.getOperatorById(id);
  }

  async updateOperator(id: string, dto: UpdateMachineOperatorDto) {
    await this.getOperatorById(id);
    let bId = dto.branchId;
    if (bId === 'HEAD_OFFICE' || bId === 'NONE' || bId === 'null') bId = null;

    await this.prisma.$executeRawUnsafe(
      `UPDATE machine_operators SET
        branchId = COALESCE(?, branchId),
        employeeId = COALESCE(?, employeeId),
        operatorType = COALESCE(?, operatorType),
        operatorName = COALESCE(?, operatorName),
        operatorCode = COALESCE(?, operatorCode),
        department = COALESCE(?, department),
        skill = COALESCE(?, skill),
        skillLevel = COALESCE(?, skillLevel),
        certification = COALESCE(?, certification),
        certificationExpiry = COALESCE(?, certificationExpiry),
        contractorAgency = COALESCE(?, contractorAgency),
        contractorComplianceStatus = COALESCE(?, contractorComplianceStatus),
        status = COALESCE(?, status),
        currentMachineId = COALESCE(?, currentMachineId),
        currentShift = COALESCE(?, currentShift)
      WHERE id = ?`,
      bId,
      dto.employeeId,
      dto.operatorType,
      dto.operatorName,
      dto.operatorCode,
      dto.department,
      dto.skill,
      dto.skillLevel,
      dto.certification,
      dto.certificationExpiry,
      dto.contractorAgency,
      dto.contractorComplianceStatus,
      dto.status,
      dto.currentMachineId,
      dto.currentShift,
      id
    );

    return this.getOperatorById(id);
  }

  async deleteOperator(id: string) {
    await this.getOperatorById(id);
    await this.prisma.$executeRawUnsafe('DELETE FROM machine_allocations WHERE operatorId = ?', id);
    await this.prisma.$executeRawUnsafe('DELETE FROM machine_operators WHERE id = ?', id);
    return { success: true, message: 'Machine operator deleted successfully' };
  }

  // ─────────────────────────────────────────────────────────────

  // 5. Machine Allocations
  // ─────────────────────────────────────────────────────────────
  async listAllocations(
    companyId?: string,
    branchId?: string | null,
    filters?: {
      productionLineId?: string;
      machineId?: string;
      operatorId?: string;
      shift?: string;
      status?: string;
      search?: string;
    }
  ) {
    let sql = `
      SELECT 
        ma.*,
        pl.lineName,
        pl.lineCode,
        m.machineName,
        m.machineCode,
        m.machineType,
        mo.operatorName,
        mo.operatorCode,
        mo.skill as operatorSkill,
        b.name as branchName
      FROM machine_allocations ma
      LEFT JOIN production_lines pl ON pl.id = ma.productionLineId
      LEFT JOIN machines m ON m.id = ma.machineId
      LEFT JOIN machine_operators mo ON mo.id = ma.operatorId
      LEFT JOIN branches b ON b.id = ma.branchId
      WHERE 1=1
    `;
    const params: any[] = [];

    if (companyId && companyId !== 'ALL') {
      sql += ' AND ma.companyId = ?';
      params.push(companyId);
    }
    if (branchId && branchId !== 'ALL' && branchId !== 'HEAD_OFFICE' && branchId !== 'NONE' && branchId !== 'null' && branchId !== 'undefined') {
      sql += ' AND ma.branchId = ?';
      params.push(branchId);
    }

    if (filters?.productionLineId && filters.productionLineId !== 'ALL') {
      sql += ' AND ma.productionLineId = ?';
      params.push(filters.productionLineId);
    }
    if (filters?.machineId && filters.machineId !== 'ALL') {
      sql += ' AND ma.machineId = ?';
      params.push(filters.machineId);
    }
    if (filters?.operatorId && filters.operatorId !== 'ALL') {
      sql += ' AND ma.operatorId = ?';
      params.push(filters.operatorId);
    }
    if (filters?.shift && filters.shift !== 'ALL') {
      sql += ' AND ma.shift = ?';
      params.push(filters.shift);
    }
    if (filters?.status && filters.status !== 'ALL') {
      sql += ' AND ma.status = ?';
      params.push(filters.status);
    }
    if (filters?.search && filters.search.trim()) {
      const q = `%${filters.search.trim()}%`;
      sql += ' AND (pl.lineName LIKE ? OR m.machineName LIKE ? OR m.machineCode LIKE ? OR mo.operatorName LIKE ? OR ma.workOrder LIKE ?)';
      params.push(q, q, q, q, q);
    }

    sql += ' ORDER BY ma.allocationDate DESC, ma.createdAt DESC';

    const rows: any[] = await this.prisma.$queryRawUnsafe(sql, ...params);
    return rows;
  }

  async createAllocation(dto: CreateMachineAllocationDto, companyId?: string, branchId?: string | null) {
    let compId = dto.companyId || companyId;
    if (!compId) {
      const firstComp = await this.prisma.company.findFirst();
      compId = firstComp?.id;
    }
    if (!compId) throw new BadRequestException('Company ID is required');

    let bId = dto.branchId !== undefined ? dto.branchId : branchId;
    if (bId === 'HEAD_OFFICE' || bId === 'NONE' || bId === 'null') bId = null;

    // 1. Validate Machine
    const machineRows: any[] = await this.prisma.$queryRawUnsafe(
      'SELECT id, status, machineName, machineCode FROM machines WHERE id = ?',
      dto.machineId
    );
    if (!machineRows || machineRows.length === 0) {
      throw new NotFoundException('Selected machine does not exist');
    }
    const machine = machineRows[0];
    if (machine.status === 'UNDER_MAINTENANCE') {
      throw new BadRequestException(`Machine ${machine.machineCode} is currently UNDER MAINTENANCE and cannot be allocated`);
    }
    if (machine.status === 'RETIRED' || machine.status === 'INACTIVE') {
      throw new BadRequestException(`Machine ${machine.machineCode} is ${machine.status} and cannot be allocated`);
    }

    // Check if machine already has an ACTIVE allocation for same shift on same date
    const conflictMachine: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT id FROM machine_allocations 
       WHERE machineId = ? AND allocationDate = ? AND shift = ? AND status = 'ACTIVE'`,
      dto.machineId,
      dto.allocationDate,
      dto.shift
    );
    if (conflictMachine.length > 0) {
      throw new ConflictException(`Machine ${machine.machineCode} is already allocated for shift ${dto.shift} on ${dto.allocationDate}`);
    }

    // 2. Validate Operator
    const operatorRows: any[] = await this.prisma.$queryRawUnsafe(
      'SELECT id, operatorName, operatorCode, status, contractorComplianceStatus FROM machine_operators WHERE id = ?',
      dto.operatorId
    );
    if (!operatorRows || operatorRows.length === 0) {
      throw new NotFoundException('Selected operator does not exist');
    }
    const op = operatorRows[0];
    if (op.contractorComplianceStatus === 'EXPIRED') {
      throw new BadRequestException(`Operator ${op.operatorName} has an EXPIRED statutory compliance license`);
    }

    // Check if operator already allocated for same shift on same date
    const conflictOperator: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT id FROM machine_allocations 
       WHERE operatorId = ? AND allocationDate = ? AND shift = ? AND status = 'ACTIVE'`,
      dto.operatorId,
      dto.allocationDate,
      dto.shift
    );
    if (conflictOperator.length > 0) {
      throw new ConflictException(`Operator ${op.operatorName} is already assigned to another machine for shift ${dto.shift} on ${dto.allocationDate}`);
    }

    const id = `alloc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO machine_allocations (
        id, companyId, branchId, productionLineId, machineId, operatorId,
        operatorType, supervisorId, supervisorName, shift, allocationDate,
        startTime, endTime, workOrder, operation, efficiency, status, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      compId,
      bId,
      dto.productionLineId,
      dto.machineId,
      dto.operatorId,
      dto.operatorType || 'Employee',
      dto.supervisorId || null,
      dto.supervisorName || null,
      dto.shift,
      dto.allocationDate,
      dto.startTime || null,
      dto.endTime || null,
      dto.workOrder || null,
      dto.operation || null,
      dto.efficiency || 96.0,
      dto.status || 'ACTIVE',
      dto.remarks || null
    );

    // Update Operator state
    await this.prisma.$executeRawUnsafe(
      `UPDATE machine_operators SET
        status = 'Allocated',
        currentMachineId = ?,
        currentShift = ?
      WHERE id = ?`,
      dto.machineId,
      dto.shift,
      dto.operatorId
    );

    return { id, ...dto, message: 'Operator successfully assigned to machine' };
  }

  async completeAllocation(id: string) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      'SELECT id, operatorId FROM machine_allocations WHERE id = ?',
      id
    );
    if (rows.length === 0) throw new NotFoundException('Allocation not found');
    const alloc = rows[0];

    await this.prisma.$executeRawUnsafe(
      `UPDATE machine_allocations SET status = 'COMPLETED' WHERE id = ?`,
      id
    );

    // Free operator
    await this.prisma.$executeRawUnsafe(
      `UPDATE machine_operators SET status = 'Available', currentMachineId = NULL, currentShift = NULL WHERE id = ?`,
      alloc.operatorId
    );

    return { success: true, message: 'Allocation marked as completed' };
  }

  async cancelAllocation(id: string) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      'SELECT id, operatorId FROM machine_allocations WHERE id = ?',
      id
    );
    if (rows.length === 0) throw new NotFoundException('Allocation not found');
    const alloc = rows[0];

    await this.prisma.$executeRawUnsafe(
      `UPDATE machine_allocations SET status = 'CANCELLED' WHERE id = ?`,
      id
    );

    // Free operator
    await this.prisma.$executeRawUnsafe(
      `UPDATE machine_operators SET status = 'Available', currentMachineId = NULL, currentShift = NULL WHERE id = ?`,
      alloc.operatorId
    );

    return { success: true, message: 'Allocation cancelled' };
  }

  async deleteAllocation(id: string) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      'SELECT id, operatorId, status FROM machine_allocations WHERE id = ?',
      id
    );
    if (!rows || rows.length === 0) throw new NotFoundException('Allocation not found');
    const alloc = rows[0];

    // If active, free the operator
    if (alloc.status === 'ACTIVE' && alloc.operatorId) {
      await this.prisma.$executeRawUnsafe(
        `UPDATE machine_operators SET status = 'Available', currentMachineId = NULL, currentShift = NULL WHERE id = ?`,
        alloc.operatorId
      );
    }

    await this.prisma.$executeRawUnsafe('DELETE FROM machine_allocations WHERE id = ?', id);
    return { success: true, message: 'Allocation deleted successfully' };
  }


  // ─────────────────────────────────────────────────────────────
  // 6. Maintenance
  // ─────────────────────────────────────────────────────────────
  async listMaintenances(
    companyId?: string,
    branchId?: string | null,
    filters?: {
      machineId?: string;
      status?: string;
      search?: string;
    }
  ) {
    let sql = `
      SELECT 
        mm.*,
        m.machineName,
        m.machineCode,
        pl.lineName,
        pl.lineCode,
        b.name as branchName
      FROM machine_maintenances mm
      JOIN machines m ON m.id = mm.machineId
      LEFT JOIN production_lines pl ON pl.id = mm.productionLineId
      LEFT JOIN branches b ON b.id = mm.branchId
      WHERE 1=1
    `;
    const params: any[] = [];

    if (companyId && companyId !== 'ALL') {
      sql += ' AND mm.companyId = ?';
      params.push(companyId);
    }
    if (branchId && branchId !== 'ALL' && branchId !== 'HEAD_OFFICE' && branchId !== 'NONE' && branchId !== 'null' && branchId !== 'undefined') {
      sql += ' AND mm.branchId = ?';
      params.push(branchId);
    }

    if (filters?.machineId && filters.machineId !== 'ALL') {
      sql += ' AND mm.machineId = ?';
      params.push(filters.machineId);
    }
    if (filters?.status && filters.status !== 'ALL') {
      sql += ' AND mm.status = ?';
      params.push(filters.status);
    }
    if (filters?.search && filters.search.trim()) {
      const q = `%${filters.search.trim()}%`;
      sql += ' AND (m.machineName LIKE ? OR m.machineCode LIKE ? OR mm.technicianName LIKE ? OR mm.reason LIKE ?)';
      params.push(q, q, q, q);
    }

    sql += ' ORDER BY mm.startDate DESC, mm.createdAt DESC';

    const rows: any[] = await this.prisma.$queryRawUnsafe(sql, ...params);
    return rows;
  }

  async startMaintenance(dto: StartMachineMaintenanceDto, companyId?: string, branchId?: string | null) {
    let compId = dto.companyId || companyId;
    if (!compId) {
      const firstComp = await this.prisma.company.findFirst();
      compId = firstComp?.id;
    }
    if (!compId) throw new BadRequestException('Company ID is required');

    let bId = dto.branchId !== undefined ? dto.branchId : branchId;
    if (bId === 'HEAD_OFFICE' || bId === 'NONE' || bId === 'null') bId = null;

    // Check machine
    const machineRows: any[] = await this.prisma.$queryRawUnsafe(
      'SELECT id, machineName, machineCode, productionLineId FROM machines WHERE id = ?',
      dto.machineId
    );
    if (machineRows.length === 0) throw new NotFoundException('Machine not found');
    const machine = machineRows[0];
    const lineId = dto.productionLineId || machine.productionLineId;

    // Check active allocation on this machine
    const activeAlloc: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT id, operatorId FROM machine_allocations WHERE machineId = ? AND status = 'ACTIVE'`,
      dto.machineId
    );

    let interruptedAllocationId: string | null = null;
    if (activeAlloc.length > 0) {
      interruptedAllocationId = activeAlloc[0].id;
      // Mark active allocation as INTERRUPTED (preserve record without deleting)
      await this.prisma.$executeRawUnsafe(
        `UPDATE machine_allocations SET status = 'INTERRUPTED' WHERE id = ?`,
        interruptedAllocationId
      );
      // Mark operator as Blocked while preserving allocation history
      await this.prisma.$executeRawUnsafe(
        `UPDATE machine_operators SET status = 'Blocked' WHERE id = ?`,
        activeAlloc[0].operatorId
      );
    }

    const id = `maint-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO machine_maintenances (
        id, companyId, branchId, machineId, productionLineId, maintenanceType,
        priority, reason, startDate, expectedCompletionDate, technicianName,
        status, remarks, interruptedAllocationId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'In Progress', ?, ?)`,
      id,
      compId,
      bId,
      dto.machineId,
      lineId || null,
      dto.maintenanceType || 'Preventive',
      dto.priority || 'Medium',
      dto.reason,
      dto.startDate,
      dto.expectedCompletionDate || null,
      dto.technicianName,
      dto.remarks || null,
      interruptedAllocationId
    );

    // Update machine status to MAINTENANCE (Technician is actively servicing it)
    await this.prisma.$executeRawUnsafe(
      `UPDATE machines SET status = 'MAINTENANCE' WHERE id = ?`,
      dto.machineId
    );

    return {
      id,
      machineId: dto.machineId,
      status: 'In Progress',
      interruptedAllocationId,
      message: 'Maintenance started successfully. Machine set to MAINTENANCE.',
    };
  }

  async reportBreakdown(id: string, dto: { reason: string; breakdownDateTime?: string; remarks?: string; technicianName?: string }) {
    const machineRows: any[] = await this.prisma.$queryRawUnsafe(
      'SELECT id, machineName, machineCode FROM machines WHERE id = ?',
      id
    );
    if (machineRows.length === 0) throw new NotFoundException('Machine not found');

    // 1. Mark active allocation as INTERRUPTED (keep record for history)
    const activeAlloc: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT id, operatorId FROM machine_allocations WHERE machineId = ? AND status = 'ACTIVE'`,
      id
    );

    let interruptedAllocationId: string | null = null;
    if (activeAlloc.length > 0) {
      interruptedAllocationId = activeAlloc[0].id;
      await this.prisma.$executeRawUnsafe(
        `UPDATE machine_allocations SET status = 'INTERRUPTED' WHERE id = ?`,
        interruptedAllocationId
      );
      await this.prisma.$executeRawUnsafe(
        `UPDATE machine_operators SET status = 'Blocked' WHERE id = ?`,
        activeAlloc[0].operatorId
      );
    }

    // 2. Set machine status strictly to 'BREAKDOWN' — DO NOT create or move to Maintenance
    await this.prisma.$executeRawUnsafe(
      `UPDATE machines SET status = 'BREAKDOWN' WHERE id = ?`,
      id
    );

    return {
      success: true,
      machineId: id,
      status: 'BREAKDOWN',
      interruptedAllocationId,
      message: 'Breakdown reported successfully. Machine set to BREAKDOWN (Maintenance record not created).',
    };
  }

  async markOperatorAway(id: string, _dto?: { reason?: string; awayTime?: string }) {
    const machineRows: any[] = await this.prisma.$queryRawUnsafe(
      'SELECT id, machineName, machineCode FROM machines WHERE id = ?',
      id
    );
    if (machineRows.length === 0) throw new NotFoundException('Machine not found');

    // Find active operator on machine
    const activeAlloc: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT id, operatorId FROM machine_allocations WHERE machineId = ? AND status = 'ACTIVE'`,
      id
    );

    if (activeAlloc.length > 0 && activeAlloc[0].operatorId) {
      await this.prisma.$executeRawUnsafe(
        `UPDATE machine_operators SET status = 'Away' WHERE id = ?`,
        activeAlloc[0].operatorId
      );
    }

    // Machine is IDLE while operator is temporarily away
    await this.prisma.$executeRawUnsafe(
      `UPDATE machines SET status = 'IDLE' WHERE id = ?`,
      id
    );

    return {
      success: true,
      machineId: id,
      status: 'IDLE',
      message: 'Operator marked as temporarily away. Machine set to IDLE.',
    };
  }

  async resumeOperatorWork(id: string) {
    const machineRows: any[] = await this.prisma.$queryRawUnsafe(
      'SELECT id, machineName, machineCode FROM machines WHERE id = ?',
      id
    );
    if (machineRows.length === 0) throw new NotFoundException('Machine not found');

    const activeAlloc: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT id, operatorId FROM machine_allocations WHERE machineId = ? AND status = 'ACTIVE'`,
      id
    );

    if (activeAlloc.length > 0 && activeAlloc[0].operatorId) {
      await this.prisma.$executeRawUnsafe(
        `UPDATE machine_operators SET status = 'Allocated' WHERE id = ?`,
        activeAlloc[0].operatorId
      );
    }

    await this.prisma.$executeRawUnsafe(
      `UPDATE machines SET status = 'ACTIVE' WHERE id = ?`,
      id
    );

    return {
      success: true,
      machineId: id,
      status: 'ACTIVE',
      message: 'Operator resumed work. Machine is ACTIVE (BUSY).',
    };
  }

  async switchPowerStatus(id: string, status: 'OFFLINE' | 'ACTIVE') {
    const machineRows: any[] = await this.prisma.$queryRawUnsafe(
      'SELECT id FROM machines WHERE id = ?',
      id
    );
    if (machineRows.length === 0) throw new NotFoundException('Machine not found');

    await this.prisma.$executeRawUnsafe(
      `UPDATE machines SET status = ? WHERE id = ?`,
      status,
      id
    );

    return {
      success: true,
      machineId: id,
      status,
      message: status === 'OFFLINE' ? 'Machine switched OFFLINE.' : 'Machine switched ONLINE (ACTIVE).',
    };
  }

  async completeMaintenance(id: string, dto: CompleteMachineMaintenanceDto) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      'SELECT id, machineId FROM machine_maintenances WHERE id = ?',
      id
    );
    if (rows.length === 0) throw new NotFoundException('Maintenance record not found');
    const maint = rows[0];

    await this.prisma.$executeRawUnsafe(
      `UPDATE machine_maintenances SET
        actualCompletionDate = ?,
        technicianName = ?,
        result = ?,
        partsReplaced = ?,
        remarks = COALESCE(?, remarks),
        status = 'Completed'
      WHERE id = ?`,
      dto.actualCompletionDate,
      dto.technicianName,
      dto.result,
      dto.partsReplaced || null,
      dto.remarks || null,
      id
    );

    // Re-activate machine & calculate next maintenance date
    const machineRows: any[] = await this.prisma.$queryRawUnsafe(
      'SELECT id, maintenanceFrequencyDays FROM machines WHERE id = ?',
      maint.machineId
    );
    const freq =
      machineRows.length > 0 && machineRows[0].maintenanceFrequencyDays
        ? Number(machineRows[0].maintenanceFrequencyDays)
        : 30;

    const baseDate = new Date(dto.actualCompletionDate);
    const calculatedNextMaintenanceDate = new Date(baseDate.getTime() + freq * 86400000)
      .toISOString()
      .slice(0, 10);

    await this.prisma.$executeRawUnsafe(
      `UPDATE machines SET 
        status = 'ACTIVE',
        lastMaintenanceDate = ?,
        nextMaintenanceDate = ?,
        maintenanceReminderSentAt = NULL
      WHERE id = ?`,
      dto.actualCompletionDate,
      calculatedNextMaintenanceDate,
      maint.machineId
    );

    // Resume interrupted allocation and operator if one existed
    const maintDetails: any[] = await this.prisma.$queryRawUnsafe(
      'SELECT interruptedAllocationId FROM machine_maintenances WHERE id = ?',
      id
    );
    const interruptedAllocId = maintDetails.length > 0 ? maintDetails[0].interruptedAllocationId : null;
    if (interruptedAllocId) {
      await this.prisma.$executeRawUnsafe(
        `UPDATE machine_allocations SET status = 'ACTIVE' WHERE id = ?`,
        interruptedAllocId
      );
      const allocRows: any[] = await this.prisma.$queryRawUnsafe(
        'SELECT operatorId, shift FROM machine_allocations WHERE id = ?',
        interruptedAllocId
      );
      if (allocRows.length > 0 && allocRows[0].operatorId) {
        await this.prisma.$executeRawUnsafe(
          `UPDATE machine_operators SET status = 'Allocated', currentMachineId = ?, currentShift = ? WHERE id = ?`,
          maint.machineId,
          allocRows[0].shift,
          allocRows[0].operatorId
        );
      }
    }

    return {
      success: true,
      nextMaintenanceDate: calculatedNextMaintenanceDate,
      message: 'Maintenance completed successfully, next maintenance date recalculated, and Machine set back to ACTIVE',
    };
  }

  async deleteMaintenance(id: string) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      'SELECT id, machineId, status FROM machine_maintenances WHERE id = ?',
      id
    );
    if (!rows || rows.length === 0) throw new NotFoundException('Maintenance record not found');
    const maint = rows[0];

    // If maintenance was in progress, check if there are any other in progress maintenances for this machine
    if (maint.status === 'In Progress' && maint.machineId) {
      const otherMaint: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT id FROM machine_maintenances WHERE machineId = ? AND status = 'In Progress' AND id != ?`,
        maint.machineId,
        id
      );
      if (otherMaint.length === 0) {
        await this.prisma.$executeRawUnsafe(
          `UPDATE machines SET status = 'ACTIVE' WHERE id = ? AND status = 'UNDER_MAINTENANCE'`,
          maint.machineId
        );
      }
    }

    await this.prisma.$executeRawUnsafe('DELETE FROM machine_maintenances WHERE id = ?', id);
    return { success: true, message: 'Maintenance record deleted successfully' };
  }

  // ─────────────────────────────────────────────────────────────

  // 7. Capacity UOM Master (Database Backed)
  // ─────────────────────────────────────────────────────────────
  async initCapacityUomTable() {
    try {
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS capacity_uom_master (
          id VARCHAR(191) PRIMARY KEY,
          companyId VARCHAR(191) NULL,
          name VARCHAR(150) NOT NULL,
          category VARCHAR(100) DEFAULT 'General',
          description TEXT NULL,
          isCustom TINYINT(1) DEFAULT 1,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_uom_company (companyId)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      this.logger.log('Table capacity_uom_master verified/created successfully in MySQL.');
    } catch (e: any) {
      this.logger.warn(`Failed to initialize capacity_uom_master table: ${e.message}`);
    }
  }

  async listCapacityUoms(companyId?: string, search?: string, category?: string) {
    await this.initCapacityUomTable();
    let query = 'SELECT * FROM capacity_uom_master WHERE 1=1';
    const params: any[] = [];

    if (companyId && companyId !== 'ALL') {
      query += ' AND (companyId = ? OR companyId IS NULL)';
      params.push(companyId);
    }

    if (category && category !== 'ALL') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (search && search.trim()) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    query += ' ORDER BY name ASC';

    const results: any[] = await this.prisma.$queryRawUnsafe(query, ...params);
    return results.map((r) => ({
      ...r,
      isCustom: Boolean(r.isCustom),
    }));
  }

  async getCapacityUomById(id: string) {
    await this.initCapacityUomTable();
    const results: any[] = await this.prisma.$queryRawUnsafe(
      'SELECT * FROM capacity_uom_master WHERE id = ?',
      id
    );
    if (!results || results.length === 0) {
      throw new NotFoundException(`Capacity UOM with ID ${id} not found`);
    }
    return {
      ...results[0],
      isCustom: Boolean(results[0].isCustom),
    };
  }

  async createCapacityUom(dto: CreateCapacityUomDto) {
    await this.initCapacityUomTable();
    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException('UOM Name is required');
    }

    // Check duplicate name
    let checkQuery = 'SELECT id FROM capacity_uom_master WHERE LOWER(name) = LOWER(?)';
    const checkParams: any[] = [dto.name.trim()];
    if (dto.companyId) {
      checkQuery += ' AND (companyId = ? OR companyId IS NULL)';
      checkParams.push(dto.companyId);
    }
    const existing: any[] = await this.prisma.$queryRawUnsafe(checkQuery, ...checkParams);
    if (existing && existing.length > 0) {
      throw new ConflictException(`Capacity UOM "${dto.name.trim()}" already exists`);
    }

    const id = `uom_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const name = dto.name.trim();
    const category = dto.category?.trim() || 'General';
    const description = dto.description?.trim() || null;
    const companyId = dto.companyId || null;

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO capacity_uom_master (id, companyId, name, category, description, isCustom)
       VALUES (?, ?, ?, ?, ?, 1)`,
      id,
      companyId,
      name,
      category,
      description
    );

    return this.getCapacityUomById(id);
  }

  async updateCapacityUom(id: string, dto: UpdateCapacityUomDto) {
    await this.getCapacityUomById(id);

    const updates: string[] = [];
    const params: any[] = [];

    if (dto.name !== undefined) {
      if (!dto.name.trim()) {
        throw new BadRequestException('UOM Name cannot be empty');
      }
      // Check duplicate
      const duplicate: any[] = await this.prisma.$queryRawUnsafe(
        'SELECT id FROM capacity_uom_master WHERE LOWER(name) = LOWER(?) AND id != ?',
        dto.name.trim(),
        id
      );
      if (duplicate && duplicate.length > 0) {
        throw new ConflictException(`Capacity UOM "${dto.name.trim()}" already exists`);
      }
      updates.push('name = ?');
      params.push(dto.name.trim());
    }

    if (dto.category !== undefined) {
      updates.push('category = ?');
      params.push(dto.category?.trim() || 'General');
    }

    if (dto.description !== undefined) {
      updates.push('description = ?');
      params.push(dto.description?.trim() || null);
    }

    if (updates.length > 0) {
      updates.push('updatedAt = NOW()');
      params.push(id);
      await this.prisma.$executeRawUnsafe(
        `UPDATE capacity_uom_master SET ${updates.join(', ')} WHERE id = ?`,
        ...params
      );
    }

    return this.getCapacityUomById(id);
  }

  async deleteCapacityUom(id: string) {
    await this.getCapacityUomById(id);
    await this.prisma.$executeRawUnsafe(
      'DELETE FROM capacity_uom_master WHERE id = ?',
      id
    );
    return { success: true, message: `Capacity UOM with ID ${id} deleted successfully` };
  }
}
