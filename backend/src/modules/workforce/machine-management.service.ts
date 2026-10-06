import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
} from './dto/machine-management.dto';

@Injectable()
export class MachineManagementService {
  constructor(private readonly prisma: PrismaService) {}

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

    // Allocated machines count (machines with ACTIVE allocation)
    const allocatedResult: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT COUNT(DISTINCT machineId) as allocatedCount 
       FROM machine_allocations 
       ${whereClause} AND status = 'ACTIVE'`,
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
    let sql = `
      SELECT 
        m.*,
        pl.lineName as productionLineName,
        pl.lineCode as productionLineCode,
        b.name as branchName,
        d.name as departmentName,
        alloc.operatorName as currentOperatorName,
        alloc.shift as currentShift,
        alloc.efficiency as currentEfficiency,
        alloc.status as currentAllocationStatus
      FROM machines m
      LEFT JOIN production_lines pl ON pl.id = m.productionLineId
      LEFT JOIN branches b ON b.id = m.branchId
      LEFT JOIN departments d ON d.id = m.departmentId
      LEFT JOIN (
        SELECT ma.machineId, ma.shift, ma.efficiency, ma.status, mo.operatorName
        FROM machine_allocations ma
        JOIN machine_operators mo ON mo.id = ma.operatorId
        WHERE ma.status = 'ACTIVE'
      ) alloc ON alloc.machineId = m.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (companyId && companyId !== 'ALL') {
      sql += ' AND m.companyId = ?';
      params.push(companyId);
    }
    if (branchId && branchId !== 'ALL' && branchId !== 'HEAD_OFFICE' && branchId !== 'NONE' && branchId !== 'null' && branchId !== 'undefined') {
      sql += ' AND m.branchId = ?';
      params.push(branchId);
    }

    if (filters?.departmentId && filters.departmentId !== 'ALL') {
      sql += ' AND m.departmentId = ?';
      params.push(filters.departmentId);
    }
    if (filters?.productionLineId && filters.productionLineId !== 'ALL') {
      sql += ' AND m.productionLineId = ?';
      params.push(filters.productionLineId);
    }
    if (filters?.machineType && filters.machineType !== 'ALL') {
      sql += ' AND m.machineType = ?';
      params.push(filters.machineType);
    }
    if (filters?.status && filters.status !== 'ALL') {
      sql += ' AND m.status = ?';
      params.push(filters.status);
    }
    if (filters?.search && filters.search.trim()) {
      const q = `%${filters.search.trim()}%`;
      sql += ' AND (m.machineCode LIKE ? OR m.machineName LIKE ? OR m.serialNumber LIKE ? OR m.manufacturer LIKE ?)';
      params.push(q, q, q, q);
    }

    sql += ' ORDER BY m.machineCode ASC';

    const rows: any[] = await this.prisma.$queryRawUnsafe(sql, ...params);
    return rows;
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
      `SELECT ma.*, mo.operatorName, mo.operatorCode, mo.operatorType
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

    return {
      ...machine,
      allocations,
      maintenances,
      currentAllocation: allocations.find((a) => a.status === 'ACTIVE') || null,
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

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO machines (
        id, companyId, branchId, departmentId, productionLineId, machineCode,
        machineName, machineType, machineCategory, manufacturer, model, serialNumber,
        assetNumber, workstation, location, capacity, capacityUom, operatingHours,
        powerRating, powerUom, maintenanceFrequencyDays, lastMaintenanceDate,
        nextMaintenanceDate, status, documentsJson
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      compId,
      bId,
      dto.departmentId || null,
      dto.productionLineId || null,
      dto.machineCode,
      dto.machineName,
      dto.machineType,
      dto.machineCategory || 'Production Machine',
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
      dto.maintenanceFrequencyDays || 30,
      dto.lastMaintenanceDate || null,
      dto.nextMaintenanceDate || null,
      dto.status || 'ACTIVE',
      dto.documentsJson ? JSON.stringify(dto.documentsJson) : null
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
        lastMaintenanceDate = ?,
        nextMaintenanceDate = ?,
        status = ?,
        documentsJson = ?
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
      dto.lastMaintenanceDate !== undefined ? dto.lastMaintenanceDate : existing.lastMaintenanceDate,
      dto.nextMaintenanceDate !== undefined ? dto.nextMaintenanceDate : existing.nextMaintenanceDate,
      dto.status || existing.status,
      dto.documentsJson !== undefined ? JSON.stringify(dto.documentsJson) : existing.documentsJson,
      id
    );

    return this.getMachineById(id);
  }

  async deleteMachine(id: string) {
    await this.getMachineById(id);
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
      // Mark active allocation as INTERRUPTED
      await this.prisma.$executeRawUnsafe(
        `UPDATE machine_allocations SET status = 'INTERRUPTED' WHERE id = ?`,
        interruptedAllocationId
      );
      // Free operator to available
      await this.prisma.$executeRawUnsafe(
        `UPDATE machine_operators SET status = 'Available', currentMachineId = NULL, currentShift = NULL WHERE id = ?`,
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

    // Update machine status to UNDER_MAINTENANCE
    await this.prisma.$executeRawUnsafe(
      `UPDATE machines SET status = 'UNDER_MAINTENANCE' WHERE id = ?`,
      dto.machineId
    );

    return {
      id,
      machineId: dto.machineId,
      status: 'In Progress',
      interruptedAllocationId,
      message: 'Maintenance started successfully. Machine set to UNDER_MAINTENANCE.',
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

    // Re-activate machine
    await this.prisma.$executeRawUnsafe(
      `UPDATE machines SET 
        status = 'ACTIVE',
        lastMaintenanceDate = ?
      WHERE id = ?`,
      dto.actualCompletionDate,
      maint.machineId
    );

    return {
      success: true,
      message: 'Maintenance completed successfully and Machine set back to ACTIVE',
    };
  }
}
