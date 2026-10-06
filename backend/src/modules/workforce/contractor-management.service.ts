import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateContractorComplianceDto,
  CreateContractorContractDto,
  CreateContractorDocumentDto,
  CreateContractorVendorDto,
  CreateContractorWorkerDto,
  CreateWorkerDeploymentDto,
  RenewContractDto,
  TransferWorkerDeploymentDto,
  UpdateContractorComplianceDto,
  UpdateContractorContractDto,
  UpdateContractorVendorDto,
  UpdateContractorWorkerDto,
  UpdateVendorStatusDto,
  UpdateWorkerDeploymentDto,
  VerifyComplianceDto,
} from './dto/contractor-management.dto';

// BigInt serialization fix (prevents JSON.stringify errors on BigInt values)
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

@Injectable()
export class ContractorManagementService {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────
  // Helper: Log Vendor History / Audit
  // ─────────────────────────────────────────────────────────────
  async logHistory(params: {
    vendorId: string;
    action: string;
    entityType: string;
    entityId: string;
    oldValue?: any;
    newValue?: any;
    reason?: string;
    performedBy?: string;
  }) {
    const id = `cvh-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    try {
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO contractor_vendor_history (
          id, vendor_id, action, entity_type, entity_id,
          old_value, new_value, reason, performed_by, performed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        id,
        params.vendorId,
        params.action,
        params.entityType,
        params.entityId,
        params.oldValue ? JSON.stringify(params.oldValue) : null,
        params.newValue ? JSON.stringify(params.newValue) : null,
        params.reason || null,
        params.performedBy || 'System / Admin'
      );
    } catch (err) {
      console.error('Failed to log contractor history:', err);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 1. Dashboard KPIs (100% database-driven)
  // ─────────────────────────────────────────────────────────────
  async getDashboard(companyId?: string, branchId?: string) {
    let compId = companyId;
    if (!compId || compId === 'ALL') {
      const firstComp = await this.prisma.company.findFirst();
      compId = firstComp?.id;
    }

    const branchFilter = branchId && branchId !== 'ALL' && branchId !== 'HEAD_OFFICE' && branchId !== 'NONE' && branchId !== 'null' && branchId !== 'undefined';

    // 1. Permanent workforce count from employees table
    let permSql = `SELECT COUNT(*) as count FROM employees WHERE status = 'ACTIVE'`;
    const permParams: any[] = [];
    if (compId) {
      permSql += ` AND companyId = ?`;
      permParams.push(compId);
    }
    if (branchFilter) {
      permSql += ` AND branchId = ?`;
      permParams.push(branchId);
    }
    const permRows: any[] = await this.prisma.$queryRawUnsafe(permSql, ...permParams);
    const permanentWorkforce = Number(permRows[0]?.count || 0);

    // 2. Contractor workforce count from contractor_workers
    let cwSql = `SELECT COUNT(*) as count FROM contractor_workers WHERE status = 'ACTIVE'`;
    const cwParams: any[] = [];
    if (compId) {
      cwSql += ` AND company_id = ?`;
      cwParams.push(compId);
    }
    if (branchFilter) {
      cwSql += ` AND branch_id = ?`;
      cwParams.push(branchId);
    }
    const cwRows: any[] = await this.prisma.$queryRawUnsafe(cwSql, ...cwParams);
    const contractWorkforce = Number(cwRows[0]?.count || 0);

    // Total plant workforce = permanent + contract
    const totalPlantWorkforce = permanentWorkforce + contractWorkforce;

    // 3. Active Staffing Vendors
    let vSql = `SELECT COUNT(*) as count FROM contractor_vendors WHERE status = 'ACTIVE' AND deleted_at IS NULL`;
    const vParams: any[] = [];
    if (compId) {
      vSql += ` AND company_id = ?`;
      vParams.push(compId);
    }
    if (branchFilter) {
      vSql += ` AND branch_id = ?`;
      vParams.push(branchId);
    }
    const vRows: any[] = await this.prisma.$queryRawUnsafe(vSql, ...vParams);
    const activeVendors = Number(vRows[0]?.count || 0);

    // 4. Active Contracts & Headcount Capacity
    let cSql = `
      SELECT 
        COUNT(*) as totalActive,
        COALESCE(SUM(maximum_headcount), 0) as totalHeadcountCapacity,
        SUM(CASE WHEN contract_end_date BETWEEN CURRENT_DATE AND DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY) THEN 1 ELSE 0 END) as expiringSoon,
        SUM(CASE WHEN contract_end_date < CURRENT_DATE THEN 1 ELSE 0 END) as expiredCount
      FROM contractor_contracts
      WHERE status = 'ACTIVE'
    `;
    const cParams: any[] = [];
    if (compId) {
      cSql += ` AND company_id = ?`;
      cParams.push(compId);
    }
    if (branchFilter) {
      cSql += ` AND branch_id = ?`;
      cParams.push(branchId);
    }
    const cRows: any[] = await this.prisma.$queryRawUnsafe(cSql, ...cParams);
    const activeContracts = Number(cRows[0]?.totalActive || 0);
    const totalHeadcountCapacity = Number(cRows[0]?.totalHeadcountCapacity || 0);
    const expiringContracts = Number(cRows[0]?.expiringSoon || 0);
    const expiredContracts = Number(cRows[0]?.expiredCount || 0);

    // 5. Deployed Workers
    let wdSql = `
      SELECT COUNT(*) as count 
      FROM worker_deployments 
      WHERE status = 'ACTIVE'
    `;
    const wdParams: any[] = [];
    if (compId) {
      wdSql += ` AND company_id = ?`;
      wdParams.push(compId);
    }
    if (branchFilter) {
      wdSql += ` AND branch_id = ?`;
      wdParams.push(branchId);
    }
    const wdRows: any[] = await this.prisma.$queryRawUnsafe(wdSql, ...wdParams);
    const deployedWorkers = Number(wdRows[0]?.count || 0);

    const availableWorkerCapacity = Math.max(0, totalHeadcountCapacity - deployedWorkers);

    // 6. Statutory Compliance & SLA Score
    let compSql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN expiry_date > DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY) AND status != 'REJECTED' THEN 1 ELSE 0 END) as validCount,
        SUM(CASE WHEN expiry_date BETWEEN CURRENT_DATE AND DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY) THEN 1 ELSE 0 END) as expiringCount,
        SUM(CASE WHEN expiry_date < CURRENT_DATE THEN 1 ELSE 0 END) as expiredCount
      FROM contractor_compliance
      WHERE 1=1
    `;
    const compParams: any[] = [];
    if (compId) {
      compSql += ` AND company_id = ?`;
      compParams.push(compId);
    }
    if (branchFilter) {
      compSql += ` AND branch_id = ?`;
      compParams.push(branchId);
    }
    const compRows: any[] = await this.prisma.$queryRawUnsafe(compSql, ...compParams);
    const totalCompliance = Number(compRows[0]?.total || 0);
    const validComplianceCount = Number(compRows[0]?.validCount || 0);
    const expiringComplianceCount = Number(compRows[0]?.expiringCount || 0);
    const expiredComplianceCount = Number(compRows[0]?.expiredCount || 0);

    const complianceScore = totalCompliance > 0
      ? Number(((validComplianceCount / totalCompliance) * 100).toFixed(1))
      : 100.0;

    return {
      totalPlantWorkforce,
      permanentWorkforce,
      contractWorkforce,
      activeVendors,
      activeContracts,
      activeWorkers: contractWorkforce,
      deployedWorkers,
      availableWorkerCapacity,
      expiringContracts,
      expiredContracts,
      validComplianceCount,
      expiringComplianceCount,
      expiredComplianceCount,
      complianceScore: `${complianceScore}%`,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Vendor Master Operations
  // ─────────────────────────────────────────────────────────────
  async listVendors(
    companyId?: string,
    branchId?: string,
    filters?: {
      status?: string;
      vendorType?: string;
      search?: string;
    }
  ) {
    let sql = `
      SELECT 
        v.*,
        b.name as branch_name,
        c.name as company_name,
        (SELECT COUNT(*) FROM contractor_contracts cc WHERE cc.vendor_id = v.id AND cc.status = 'ACTIVE') as active_contracts_count,
        (SELECT COUNT(*) FROM contractor_workers cw WHERE cw.vendor_id = v.id AND cw.status = 'ACTIVE') as total_workers_count,
        (SELECT COUNT(*) FROM worker_deployments wd WHERE wd.vendor_id = v.id AND wd.status = 'ACTIVE') as deployed_headcount,
        (SELECT cc.license_number FROM contractor_compliance cc WHERE cc.vendor_id = v.id AND cc.compliance_type = 'CLRA' ORDER BY cc.expiry_date DESC LIMIT 1) as clra_license,
        (SELECT cc.status FROM contractor_compliance cc WHERE cc.vendor_id = v.id AND cc.compliance_type = 'CLRA' ORDER BY cc.expiry_date DESC LIMIT 1) as clra_status,
        (SELECT MIN(cc.contract_end_date) FROM contractor_contracts cc WHERE cc.vendor_id = v.id AND cc.status = 'ACTIVE' AND cc.contract_end_date >= CURRENT_DATE) as nearest_contract_expiry
      FROM contractor_vendors v
      LEFT JOIN branches b ON b.id = v.branch_id
      LEFT JOIN companies c ON c.id = v.company_id
      WHERE v.deleted_at IS NULL
    `;
    const params: any[] = [];

    if (companyId && companyId !== 'ALL') {
      sql += ` AND v.company_id = ?`;
      params.push(companyId);
    }
    if (branchId && branchId !== 'ALL' && branchId !== 'HEAD_OFFICE' && branchId !== 'NONE' && branchId !== 'null' && branchId !== 'undefined') {
      sql += ` AND v.branch_id = ?`;
      params.push(branchId);
    }

    if (filters?.status && filters.status !== 'ALL') {
      sql += ` AND v.status = ?`;
      params.push(filters.status);
    }
    if (filters?.vendorType && filters.vendorType !== 'ALL') {
      sql += ` AND v.vendor_type = ?`;
      params.push(filters.vendorType);
    }
    if (filters?.search && filters.search.trim()) {
      const q = `%${filters.search.trim()}%`;
      sql += ` AND (v.vendor_code LIKE ? OR v.legal_name LIKE ? OR v.display_name LIKE ? OR v.primary_contact_name LIKE ? OR v.primary_contact_phone LIKE ? OR v.primary_contact_email LIKE ?)`;
      params.push(q, q, q, q, q, q);
    }

    sql += ` ORDER BY v.created_at DESC`;

    const rows: any[] = await this.prisma.$queryRawUnsafe(sql, ...params);
    return rows.map((r) => ({
      ...r,
      active_contracts_count: Number(r.active_contracts_count || 0),
      total_workers_count: Number(r.total_workers_count || 0),
      deployed_headcount: Number(r.deployed_headcount || 0),
    }));
  }

  async getVendorById(id: string) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT 
        v.*,
        b.name as branch_name,
        c.name as company_name,
        (SELECT COUNT(*) FROM contractor_contracts cc WHERE cc.vendor_id = v.id AND cc.status = 'ACTIVE') as active_contracts_count,
        (SELECT COUNT(*) FROM contractor_workers cw WHERE cw.vendor_id = v.id AND cw.status = 'ACTIVE') as total_workers_count,
        (SELECT COUNT(*) FROM worker_deployments wd WHERE wd.vendor_id = v.id AND wd.status = 'ACTIVE') as deployed_headcount
      FROM contractor_vendors v
      LEFT JOIN branches b ON b.id = v.branch_id
      LEFT JOIN companies c ON c.id = v.company_id
      WHERE v.id = ? AND v.deleted_at IS NULL`,
      id
    );

    if (!rows || rows.length === 0) {
      throw new NotFoundException('Contractor vendor not found');
    }

    const vendor = rows[0];

    // Contracts
    const contracts: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT cc.*, d.name as department_name,
        (SELECT COUNT(*) FROM worker_deployments wd WHERE wd.contract_id = cc.id AND wd.status = 'ACTIVE') as deployed_headcount
       FROM contractor_contracts cc
       LEFT JOIN departments d ON d.id = cc.department_id
       WHERE cc.vendor_id = ?
       ORDER BY cc.contract_end_date DESC`,
      id
    );

    // Compliance
    const compliance: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT cc.*, 
        DATEDIFF(cc.expiry_date, CURRENT_DATE) as days_remaining
       FROM contractor_compliance cc
       WHERE cc.vendor_id = ?
       ORDER BY cc.expiry_date ASC`,
      id
    );

    // Documents
    const documents: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT cd.* FROM contractor_documents cd WHERE cd.vendor_id = ? ORDER BY cd.uploaded_at DESC`,
      id
    );

    // Recent History
    const history: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT cvh.* FROM contractor_vendor_history cvh WHERE cvh.vendor_id = ? ORDER BY cvh.performed_at DESC LIMIT 20`,
      id
    );

    return {
      ...vendor,
      active_contracts_count: Number(vendor.active_contracts_count || 0),
      total_workers_count: Number(vendor.total_workers_count || 0),
      deployed_headcount: Number(vendor.deployed_headcount || 0),
      contracts: contracts.map((c) => ({
        ...c,
        deployed_headcount: Number(c.deployed_headcount || 0),
        available_capacity: Math.max(0, Number(c.maximum_headcount || 0) - Number(c.deployed_headcount || 0)),
      })),
      compliance,
      documents,
      history,
    };
  }

  async createVendor(dto: CreateContractorVendorDto, companyId?: string, branchId?: string | null, userId?: string) {
    const id = `vnd-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    let compId = dto.companyId || companyId;
    if (!compId || compId === 'ALL') {
      const firstComp = await this.prisma.company.findFirst();
      compId = firstComp?.id;
    }
    if (!compId) throw new BadRequestException('Company ID is required');

    let bId = dto.branchId !== undefined ? dto.branchId : branchId;
    if (bId === 'HEAD_OFFICE' || bId === 'NONE' || bId === 'null') bId = null;

    // Check duplicate vendor_code per company
    const existing: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT id FROM contractor_vendors WHERE company_id = ? AND vendor_code = ? AND deleted_at IS NULL`,
      compId,
      dto.vendorCode
    );
    if (existing.length > 0) {
      throw new ConflictException(`Vendor Code ${dto.vendorCode} already exists for this company`);
    }

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO contractor_vendors (
        id, company_id, branch_id, vendor_code, legal_name, display_name,
        vendor_type, registration_number, gstin, pan, registered_address,
        city, state, pincode, primary_contact_name, primary_contact_phone,
        primary_contact_email, emergency_contact_name, emergency_contact_phone,
        status, remarks, created_by, updated_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      id,
      compId,
      bId,
      dto.vendorCode,
      dto.legalName,
      dto.displayName || dto.legalName,
      dto.vendorType || 'MANPOWER_AGENCY',
      dto.registrationNumber || null,
      dto.gstin || null,
      dto.pan || null,
      dto.registeredAddress || null,
      dto.city || null,
      dto.state || null,
      dto.pincode || null,
      dto.primaryContactName,
      dto.primaryContactPhone,
      dto.primaryContactEmail,
      dto.emergencyContactName || null,
      dto.emergencyContactPhone || null,
      dto.status || 'ACTIVE',
      dto.remarks || null,
      userId || null,
      userId || null
    );

    await this.logHistory({
      vendorId: id,
      action: 'VENDOR_CREATED',
      entityType: 'VENDOR',
      entityId: id,
      newValue: { vendorCode: dto.vendorCode, legalName: dto.legalName, status: dto.status || 'ACTIVE' },
      performedBy: userId,
    });

    return this.getVendorById(id);
  }

  async updateVendor(id: string, dto: UpdateContractorVendorDto, userId?: string) {
    const existing = await this.getVendorById(id);
    let bId = dto.branchId !== undefined ? dto.branchId : undefined;
    if (bId === 'HEAD_OFFICE' || bId === 'NONE' || bId === 'null') bId = null;

    await this.prisma.$executeRawUnsafe(
      `UPDATE contractor_vendors SET
        branch_id = COALESCE(?, branch_id),
        legal_name = COALESCE(?, legal_name),
        display_name = COALESCE(?, display_name),
        vendor_type = COALESCE(?, vendor_type),
        registration_number = COALESCE(?, registration_number),
        gstin = COALESCE(?, gstin),
        pan = COALESCE(?, pan),
        registered_address = COALESCE(?, registered_address),
        city = COALESCE(?, city),
        state = COALESCE(?, state),
        pincode = COALESCE(?, pincode),
        primary_contact_name = COALESCE(?, primary_contact_name),
        primary_contact_phone = COALESCE(?, primary_contact_phone),
        primary_contact_email = COALESCE(?, primary_contact_email),
        emergency_contact_name = COALESCE(?, emergency_contact_name),
        emergency_contact_phone = COALESCE(?, emergency_contact_phone),
        status = COALESCE(?, status),
        remarks = COALESCE(?, remarks),
        updated_by = ?,
        updated_at = NOW()
      WHERE id = ?`,
      bId,
      dto.legalName,
      dto.displayName,
      dto.vendorType,
      dto.registrationNumber,
      dto.gstin,
      dto.pan,
      dto.registeredAddress,
      dto.city,
      dto.state,
      dto.pincode,
      dto.primaryContactName,
      dto.primaryContactPhone,
      dto.primaryContactEmail,
      dto.emergencyContactName,
      dto.emergencyContactPhone,
      dto.status,
      dto.remarks,
      userId || null,
      id
    );

    await this.logHistory({
      vendorId: id,
      action: 'VENDOR_UPDATED',
      entityType: 'VENDOR',
      entityId: id,
      oldValue: { legalName: existing.legal_name, status: existing.status },
      newValue: dto,
      performedBy: userId,
    });

    return this.getVendorById(id);
  }

  async updateVendorStatus(id: string, status: string, reason?: string, userId?: string) {
    const existing = await this.getVendorById(id);
    await this.prisma.$executeRawUnsafe(
      `UPDATE contractor_vendors SET status = ?, remarks = COALESCE(?, remarks), updated_by = ?, updated_at = NOW() WHERE id = ?`,
      status,
      reason ? `Status changed to ${status}: ${reason}` : null,
      userId || null,
      id
    );

    const action = status === 'SUSPENDED' ? 'VENDOR_SUSPENDED' : status === 'ACTIVE' ? 'VENDOR_ACTIVATED' : 'VENDOR_UPDATED';
    await this.logHistory({
      vendorId: id,
      action,
      entityType: 'VENDOR',
      entityId: id,
      oldValue: { status: existing.status },
      newValue: { status },
      reason,
      performedBy: userId,
    });

    return this.getVendorById(id);
  }

  // ─────────────────────────────────────────────────────────────
  // 3. Contract Management
  // ─────────────────────────────────────────────────────────────
  async listContracts(
    companyId?: string,
    branchId?: string,
    filters?: {
      vendorId?: string;
      departmentId?: string;
      status?: string;
      search?: string;
    }
  ) {
    let sql = `
      SELECT 
        cc.*,
        v.legal_name as vendor_name,
        v.vendor_code as vendor_code,
        d.name as department_name,
        b.name as branch_name,
        (SELECT COUNT(*) FROM worker_deployments wd WHERE wd.contract_id = cc.id AND wd.status = 'ACTIVE') as deployed_headcount,
        (SELECT COUNT(*) FROM contractor_workers cw WHERE cw.contract_id = cc.id AND cw.status = 'ACTIVE') as workers_enrolled
      FROM contractor_contracts cc
      JOIN contractor_vendors v ON v.id = cc.vendor_id
      LEFT JOIN departments d ON d.id = cc.department_id
      LEFT JOIN branches b ON b.id = cc.branch_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (companyId && companyId !== 'ALL') {
      sql += ` AND cc.company_id = ?`;
      params.push(companyId);
    }
    if (branchId && branchId !== 'ALL' && branchId !== 'HEAD_OFFICE' && branchId !== 'NONE' && branchId !== 'null' && branchId !== 'undefined') {
      sql += ` AND cc.branch_id = ?`;
      params.push(branchId);
    }

    if (filters?.vendorId && filters.vendorId !== 'ALL') {
      sql += ` AND cc.vendor_id = ?`;
      params.push(filters.vendorId);
    }
    if (filters?.departmentId && filters.departmentId !== 'ALL') {
      sql += ` AND cc.department_id = ?`;
      params.push(filters.departmentId);
    }
    if (filters?.status && filters.status !== 'ALL') {
      sql += ` AND cc.status = ?`;
      params.push(filters.status);
    }
    if (filters?.search && filters.search.trim()) {
      const q = `%${filters.search.trim()}%`;
      sql += ` AND (cc.contract_number LIKE ? OR cc.scope_of_work LIKE ? OR v.legal_name LIKE ? OR v.vendor_code LIKE ?)`;
      params.push(q, q, q, q);
    }

    sql += ` ORDER BY cc.contract_end_date ASC`;

    const rows: any[] = await this.prisma.$queryRawUnsafe(sql, ...params);
    return rows.map((r) => {
      const maxHeadcount = Number(r.maximum_headcount || 0);
      const deployed = Number(r.deployed_headcount || 0);
      return {
        ...r,
        maximum_headcount: maxHeadcount,
        deployed_headcount: deployed,
        available_capacity: Math.max(0, maxHeadcount - deployed),
        workers_enrolled: Number(r.workers_enrolled || 0),
      };
    });
  }

  async getContractById(id: string) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT 
        cc.*,
        v.legal_name as vendor_name,
        v.vendor_code as vendor_code,
        d.name as department_name,
        b.name as branch_name,
        (SELECT COUNT(*) FROM worker_deployments wd WHERE wd.contract_id = cc.id AND wd.status = 'ACTIVE') as deployed_headcount
      FROM contractor_contracts cc
      JOIN contractor_vendors v ON v.id = cc.vendor_id
      LEFT JOIN departments d ON d.id = cc.department_id
      LEFT JOIN branches b ON b.id = cc.branch_id
      WHERE cc.id = ?`,
      id
    );

    if (!rows || rows.length === 0) {
      throw new NotFoundException('Contract not found');
    }

    const c = rows[0];
    const maxHeadcount = Number(c.maximum_headcount || 0);
    const deployed = Number(c.deployed_headcount || 0);
    return {
      ...c,
      maximum_headcount: maxHeadcount,
      deployed_headcount: deployed,
      available_capacity: Math.max(0, maxHeadcount - deployed),
    };
  }

  async createContract(dto: CreateContractorContractDto, companyId?: string, branchId?: string | null, userId?: string) {
    const id = `cnt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    let compId = dto.companyId || companyId;
    if (!compId || compId === 'ALL') {
      const firstComp = await this.prisma.company.findFirst();
      compId = firstComp?.id;
    }
    if (!compId) throw new BadRequestException('Company ID is required');

    let bId = dto.branchId !== undefined ? dto.branchId : branchId;
    if (bId === 'HEAD_OFFICE' || bId === 'NONE' || bId === 'null') bId = null;

    // Validate dates
    if (new Date(dto.contractEndDate) < new Date(dto.contractStartDate)) {
      throw new BadRequestException('Contract end date cannot be earlier than start date');
    }

    // Check duplicate contract number for this vendor
    const existing: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT id FROM contractor_contracts WHERE vendor_id = ? AND contract_number = ?`,
      dto.vendorId,
      dto.contractNumber
    );
    if (existing.length > 0) {
      throw new ConflictException(`Contract Number ${dto.contractNumber} already exists for this vendor`);
    }

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO contractor_contracts (
        id, vendor_id, company_id, branch_id, contract_number,
        contract_start_date, contract_end_date, contract_type,
        scope_of_work, department_id, maximum_headcount, billing_type,
        billing_rate, payment_terms, status, renewal_required, renewal_date,
        contract_document_id, remarks, created_by, updated_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      id,
      dto.vendorId,
      compId,
      bId,
      dto.contractNumber,
      dto.contractStartDate,
      dto.contractEndDate,
      dto.contractType || 'MANPOWER_SUPPLY',
      dto.scopeOfWork,
      dto.departmentId || null,
      dto.maximumHeadcount || 10,
      dto.billingType || 'MONTHLY',
      dto.billingRate || 0,
      dto.paymentTerms || 'Net 30 Days',
      dto.status || 'ACTIVE',
      dto.renewalRequired || false,
      dto.renewalDate || null,
      dto.contractDocumentId || null,
      dto.remarks || null,
      userId || null,
      userId || null
    );

    await this.logHistory({
      vendorId: dto.vendorId,
      action: 'CONTRACT_CREATED',
      entityType: 'CONTRACT',
      entityId: id,
      newValue: { contractNumber: dto.contractNumber, maxHeadcount: dto.maximumHeadcount, endDate: dto.contractEndDate },
      performedBy: userId,
    });

    return this.getContractById(id);
  }

  async updateContract(id: string, dto: UpdateContractorContractDto, userId?: string) {
    const existing = await this.getContractById(id);
    if (dto.contractStartDate && dto.contractEndDate) {
      if (new Date(dto.contractEndDate) < new Date(dto.contractStartDate)) {
        throw new BadRequestException('Contract end date cannot be earlier than start date');
      }
    }

    let bId = dto.branchId !== undefined ? dto.branchId : undefined;
    if (bId === 'HEAD_OFFICE' || bId === 'NONE' || bId === 'null') bId = null;

    await this.prisma.$executeRawUnsafe(
      `UPDATE contractor_contracts SET
        branch_id = COALESCE(?, branch_id),
        contract_number = COALESCE(?, contract_number),
        contract_start_date = COALESCE(?, contract_start_date),
        contract_end_date = COALESCE(?, contract_end_date),
        contract_type = COALESCE(?, contract_type),
        scope_of_work = COALESCE(?, scope_of_work),
        department_id = COALESCE(?, department_id),
        maximum_headcount = COALESCE(?, maximum_headcount),
        billing_type = COALESCE(?, billing_type),
        billing_rate = COALESCE(?, billing_rate),
        payment_terms = COALESCE(?, payment_terms),
        status = COALESCE(?, status),
        renewal_required = COALESCE(?, renewal_required),
        renewal_date = COALESCE(?, renewal_date),
        remarks = COALESCE(?, remarks),
        updated_by = ?,
        updated_at = NOW()
      WHERE id = ?`,
      bId,
      dto.contractNumber,
      dto.contractStartDate,
      dto.contractEndDate,
      dto.contractType,
      dto.scopeOfWork,
      dto.departmentId,
      dto.maximumHeadcount,
      dto.billingType,
      dto.billingRate,
      dto.paymentTerms,
      dto.status,
      dto.renewalRequired,
      dto.renewalDate,
      dto.remarks,
      userId || null,
      id
    );

    await this.logHistory({
      vendorId: existing.vendor_id,
      action: 'CONTRACT_UPDATED',
      entityType: 'CONTRACT',
      entityId: id,
      oldValue: { contractNumber: existing.contract_number, status: existing.status },
      newValue: dto,
      performedBy: userId,
    });

    return this.getContractById(id);
  }

  async renewContract(id: string, dto: RenewContractDto, userId?: string) {
    const existing = await this.getContractById(id);
    if (new Date(dto.newEndDate) <= new Date(existing.contract_end_date)) {
      throw new BadRequestException('Renewal end date must be after current contract end date');
    }

    await this.prisma.$executeRawUnsafe(
      `UPDATE contractor_contracts SET
        contract_end_date = ?,
        maximum_headcount = COALESCE(?, maximum_headcount),
        billing_rate = COALESCE(?, billing_rate),
        status = 'ACTIVE',
        renewal_required = FALSE,
        renewal_date = CURRENT_DATE,
        remarks = CONCAT(COALESCE(remarks, ''), ' | Renewed until ', ?),
        updated_by = ?,
        updated_at = NOW()
      WHERE id = ?`,
      dto.newEndDate,
      dto.maximumHeadcount,
      dto.billingRate,
      dto.newEndDate,
      userId || null,
      id
    );

    await this.logHistory({
      vendorId: existing.vendor_id,
      action: 'CONTRACT_RENEWED',
      entityType: 'CONTRACT',
      entityId: id,
      oldValue: { endDate: existing.contract_end_date },
      newValue: { newEndDate: dto.newEndDate, maximumHeadcount: dto.maximumHeadcount },
      reason: dto.remarks,
      performedBy: userId,
    });

    return this.getContractById(id);
  }

  // ─────────────────────────────────────────────────────────────
  // 4. Contractor Workers
  // ─────────────────────────────────────────────────────────────
  async listWorkers(
    companyId?: string,
    branchId?: string,
    filters?: {
      vendorId?: string;
      contractId?: string;
      departmentId?: string;
      skill?: string;
      status?: string;
      search?: string;
    }
  ) {
    let sql = `
      SELECT 
        cw.*,
        v.legal_name as vendor_name,
        v.vendor_code as vendor_code,
        cc.contract_number as contract_number,
        d.name as department_name,
        b.name as branch_name,
        wd.id as current_deployment_id,
        wd.start_date as deployment_start_date,
        wd.production_line_id,
        wd.machine_id,
        wd.shift_id,
        pl.lineName as current_line_name,
        m.machineName as current_machine_name,
        st.name as shift_name
      FROM contractor_workers cw
      JOIN contractor_vendors v ON v.id = cw.vendor_id
      JOIN contractor_contracts cc ON cc.id = cw.contract_id
      LEFT JOIN departments d ON d.id = cw.department_id
      LEFT JOIN branches b ON b.id = cw.branch_id
      LEFT JOIN worker_deployments wd ON wd.worker_id = cw.id AND wd.status = 'ACTIVE'
      LEFT JOIN production_lines pl ON pl.id = wd.production_line_id
      LEFT JOIN machines m ON m.id = wd.machine_id
      LEFT JOIN shift_types st ON st.id = wd.shift_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (companyId && companyId !== 'ALL') {
      sql += ` AND cw.company_id = ?`;
      params.push(companyId);
    }
    if (branchId && branchId !== 'ALL' && branchId !== 'HEAD_OFFICE' && branchId !== 'NONE' && branchId !== 'null' && branchId !== 'undefined') {
      sql += ` AND cw.branch_id = ?`;
      params.push(branchId);
    }

    if (filters?.vendorId && filters.vendorId !== 'ALL') {
      sql += ` AND cw.vendor_id = ?`;
      params.push(filters.vendorId);
    }
    if (filters?.contractId && filters.contractId !== 'ALL') {
      sql += ` AND cw.contract_id = ?`;
      params.push(filters.contractId);
    }
    if (filters?.departmentId && filters.departmentId !== 'ALL') {
      sql += ` AND cw.department_id = ?`;
      params.push(filters.departmentId);
    }
    if (filters?.status && filters.status !== 'ALL') {
      sql += ` AND cw.status = ?`;
      params.push(filters.status);
    }
    if (filters?.skill && filters.skill !== 'ALL') {
      sql += ` AND cw.skill LIKE ?`;
      params.push(`%${filters.skill}%`);
    }
    if (filters?.search && filters.search.trim()) {
      const q = `%${filters.search.trim()}%`;
      sql += ` AND (cw.worker_code LIKE ? OR cw.first_name LIKE ? OR cw.last_name LIKE ? OR cw.mobile LIKE ? OR cw.designation LIKE ? OR v.legal_name LIKE ?)`;
      params.push(q, q, q, q, q, q);
    }

    sql += ` ORDER BY cw.first_name ASC`;

    const rows: any[] = await this.prisma.$queryRawUnsafe(sql, ...params);
    return rows;
  }

  async getWorkerById(id: string) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT 
        cw.*,
        v.legal_name as vendor_name,
        v.vendor_code as vendor_code,
        cc.contract_number as contract_number,
        d.name as department_name,
        b.name as branch_name,
        wd.id as current_deployment_id,
        wd.start_date as deployment_start_date,
        wd.production_line_id,
        wd.machine_id,
        wd.shift_id,
        pl.lineName as current_line_name,
        m.machineName as current_machine_name,
        st.name as shift_name
      FROM contractor_workers cw
      JOIN contractor_vendors v ON v.id = cw.vendor_id
      JOIN contractor_contracts cc ON cc.id = cw.contract_id
      LEFT JOIN departments d ON d.id = cw.department_id
      LEFT JOIN branches b ON b.id = cw.branch_id
      LEFT JOIN worker_deployments wd ON wd.worker_id = cw.id AND wd.status = 'ACTIVE'
      LEFT JOIN production_lines pl ON pl.id = wd.production_line_id
      LEFT JOIN machines m ON m.id = wd.machine_id
      LEFT JOIN shift_types st ON st.id = wd.shift_id
      WHERE cw.id = ?`,
      id
    );

    if (!rows || rows.length === 0) {
      throw new NotFoundException('Contractor worker not found');
    }

    const worker = rows[0];

    // Deployment history
    const deployments: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT wd.*, pl.lineName, m.machineName, st.name as shift_name, d.name as department_name
       FROM worker_deployments wd
       LEFT JOIN production_lines pl ON pl.id = wd.production_line_id
       LEFT JOIN machines m ON m.id = wd.machine_id
       LEFT JOIN shift_types st ON st.id = wd.shift_id
       LEFT JOIN departments d ON d.id = wd.department_id
       WHERE wd.worker_id = ?
       ORDER BY wd.start_date DESC`,
      id
    );

    return {
      ...worker,
      deployments,
    };
  }

  async createWorker(dto: CreateContractorWorkerDto, companyId?: string, branchId?: string | null, userId?: string) {
    const id = `cw-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    let compId = dto.companyId || companyId;
    if (!compId || compId === 'ALL') {
      const firstComp = await this.prisma.company.findFirst();
      compId = firstComp?.id;
    }
    if (!compId) throw new BadRequestException('Company ID is required');

    let bId = dto.branchId !== undefined ? dto.branchId : branchId;
    if (bId === 'HEAD_OFFICE' || bId === 'NONE' || bId === 'null') bId = null;

    // Check duplicate worker_code per company
    const existing: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT id FROM contractor_workers WHERE company_id = ? AND worker_code = ?`,
      compId,
      dto.workerCode
    );
    if (existing.length > 0) {
      throw new ConflictException(`Worker Code ${dto.workerCode} already exists for this company`);
    }

    // Verify contract belongs to vendor
    const contract = await this.getContractById(dto.contractId);
    if (contract.vendor_id !== dto.vendorId) {
      throw new BadRequestException('Selected contract does not belong to this vendor');
    }

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO contractor_workers (
        id, vendor_id, contract_id, company_id, branch_id,
        worker_code, first_name, middle_name, last_name,
        gender, date_of_birth, mobile, email,
        government_id_type, government_id_number,
        joining_date, exit_date, department_id, designation,
        skill, skill_level, status, emergency_contact_name,
        emergency_contact_phone, created_by, updated_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      id,
      dto.vendorId,
      dto.contractId,
      compId,
      bId,
      dto.workerCode,
      dto.firstName,
      dto.middleName || null,
      dto.lastName,
      dto.gender || 'MALE',
      dto.dateOfBirth || null,
      dto.mobile,
      dto.email || null,
      dto.governmentIdType || 'AADHAAR',
      dto.governmentIdNumber || null,
      dto.joiningDate,
      dto.exitDate || null,
      dto.departmentId || null,
      dto.designation || 'Contract Worker',
      dto.skill,
      dto.skillLevel || 'Semi-Skilled',
      dto.status || 'ACTIVE',
      dto.emergencyContactName || null,
      dto.emergencyContactPhone || null,
      userId || null,
      userId || null
    );

    await this.logHistory({
      vendorId: dto.vendorId,
      action: 'WORKER_ADDED',
      entityType: 'WORKER',
      entityId: id,
      newValue: { workerCode: dto.workerCode, name: `${dto.firstName} ${dto.lastName}`, skill: dto.skill },
      performedBy: userId,
    });

    return this.getWorkerById(id);
  }

  async updateWorker(id: string, dto: UpdateContractorWorkerDto, userId?: string) {
    const existing = await this.getWorkerById(id);
    let bId = dto.branchId !== undefined ? dto.branchId : undefined;
    if (bId === 'HEAD_OFFICE' || bId === 'NONE' || bId === 'null') bId = null;

    await this.prisma.$executeRawUnsafe(
      `UPDATE contractor_workers SET
        branch_id = COALESCE(?, branch_id),
        contract_id = COALESCE(?, contract_id),
        first_name = COALESCE(?, first_name),
        middle_name = COALESCE(?, middle_name),
        last_name = COALESCE(?, last_name),
        gender = COALESCE(?, gender),
        date_of_birth = COALESCE(?, date_of_birth),
        mobile = COALESCE(?, mobile),
        email = COALESCE(?, email),
        government_id_type = COALESCE(?, government_id_type),
        government_id_number = COALESCE(?, government_id_number),
        joining_date = COALESCE(?, joining_date),
        exit_date = COALESCE(?, exit_date),
        department_id = COALESCE(?, department_id),
        designation = COALESCE(?, designation),
        skill = COALESCE(?, skill),
        skill_level = COALESCE(?, skill_level),
        status = COALESCE(?, status),
        emergency_contact_name = COALESCE(?, emergency_contact_name),
        emergency_contact_phone = COALESCE(?, emergency_contact_phone),
        updated_by = ?,
        updated_at = NOW()
      WHERE id = ?`,
      bId,
      dto.contractId,
      dto.firstName,
      dto.middleName,
      dto.lastName,
      dto.gender,
      dto.dateOfBirth,
      dto.mobile,
      dto.email,
      dto.governmentIdType,
      dto.governmentIdNumber,
      dto.joiningDate,
      dto.exitDate,
      dto.departmentId,
      dto.designation,
      dto.skill,
      dto.skillLevel,
      dto.status,
      dto.emergencyContactName,
      dto.emergencyContactPhone,
      userId || null,
      id
    );

    await this.logHistory({
      vendorId: existing.vendor_id,
      action: 'WORKER_UPDATED',
      entityType: 'WORKER',
      entityId: id,
      oldValue: { status: existing.status, skill: existing.skill },
      newValue: dto,
      performedBy: userId,
    });

    return this.getWorkerById(id);
  }

  // ─────────────────────────────────────────────────────────────
  // 5. Worker Deployment Workflow & Machine Integration
  // ─────────────────────────────────────────────────────────────
  async listDeployments(
    companyId?: string,
    branchId?: string,
    filters?: {
      vendorId?: string;
      contractId?: string;
      workerId?: string;
      departmentId?: string;
      status?: string;
      search?: string;
    }
  ) {
    let sql = `
      SELECT 
        wd.*,
        cw.worker_code,
        cw.first_name,
        cw.last_name,
        cw.skill as worker_skill,
        v.legal_name as vendor_name,
        v.vendor_code as vendor_code,
        cc.contract_number,
        d.name as department_name,
        b.name as branch_name,
        pl.lineName as line_name,
        pl.lineCode as line_code,
        m.machineName as machine_name,
        m.machineCode as machine_code,
        st.name as shift_name,
        st.code as shift_code,
        st.startTime as shift_start_time,
        st.endTime as shift_end_time
      FROM worker_deployments wd
      JOIN contractor_workers cw ON cw.id = wd.worker_id
      JOIN contractor_vendors v ON v.id = wd.vendor_id
      JOIN contractor_contracts cc ON cc.id = wd.contract_id
      LEFT JOIN departments d ON d.id = wd.department_id
      LEFT JOIN branches b ON b.id = wd.branch_id
      LEFT JOIN production_lines pl ON pl.id = wd.production_line_id
      LEFT JOIN machines m ON m.id = wd.machine_id
      LEFT JOIN shift_types st ON st.id = wd.shift_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (companyId && companyId !== 'ALL') {
      sql += ` AND wd.company_id = ?`;
      params.push(companyId);
    }
    if (branchId && branchId !== 'ALL' && branchId !== 'HEAD_OFFICE' && branchId !== 'NONE' && branchId !== 'null' && branchId !== 'undefined') {
      sql += ` AND wd.branch_id = ?`;
      params.push(branchId);
    }

    if (filters?.vendorId && filters.vendorId !== 'ALL') {
      sql += ` AND wd.vendor_id = ?`;
      params.push(filters.vendorId);
    }
    if (filters?.contractId && filters.contractId !== 'ALL') {
      sql += ` AND wd.contract_id = ?`;
      params.push(filters.contractId);
    }
    if (filters?.workerId && filters.workerId !== 'ALL') {
      sql += ` AND wd.worker_id = ?`;
      params.push(filters.workerId);
    }
    if (filters?.departmentId && filters.departmentId !== 'ALL') {
      sql += ` AND wd.department_id = ?`;
      params.push(filters.departmentId);
    }
    if (filters?.status && filters.status !== 'ALL') {
      sql += ` AND wd.status = ?`;
      params.push(filters.status);
    }
    if (filters?.search && filters.search.trim()) {
      const q = `%${filters.search.trim()}%`;
      sql += ` AND (cw.worker_code LIKE ? OR cw.first_name LIKE ? OR cw.last_name LIKE ? OR v.legal_name LIKE ? OR cc.contract_number LIKE ? OR m.machineName LIKE ?)`;
      params.push(q, q, q, q, q, q);
    }

    sql += ` ORDER BY wd.start_date DESC`;

    const rows: any[] = await this.prisma.$queryRawUnsafe(sql, ...params);
    return rows;
  }

  async getDeploymentById(id: string) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT 
        wd.*,
        cw.worker_code,
        cw.first_name,
        cw.last_name,
        v.legal_name as vendor_name,
        cc.contract_number,
        pl.lineName as line_name,
        m.machineName as machine_name,
        st.name as shift_name
      FROM worker_deployments wd
      JOIN contractor_workers cw ON cw.id = wd.worker_id
      JOIN contractor_vendors v ON v.id = wd.vendor_id
      JOIN contractor_contracts cc ON cc.id = wd.contract_id
      LEFT JOIN production_lines pl ON pl.id = wd.production_line_id
      LEFT JOIN machines m ON m.id = wd.machine_id
      LEFT JOIN shift_types st ON st.id = wd.shift_id
      WHERE wd.id = ?`,
      id
    );

    if (!rows || rows.length === 0) {
      throw new NotFoundException('Deployment record not found');
    }
    return rows[0];
  }

  async createDeployment(dto: CreateWorkerDeploymentDto, companyId?: string, branchId?: string | null, userId?: string) {
    const id = `wd-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    let compId = dto.companyId || companyId;
    if (!compId || compId === 'ALL') {
      const firstComp = await this.prisma.company.findFirst();
      compId = firstComp?.id;
    }
    if (!compId) throw new BadRequestException('Company ID is required');

    let bId = dto.branchId !== undefined ? dto.branchId : branchId;
    if (bId === 'HEAD_OFFICE' || bId === 'NONE' || bId === 'null') bId = null;

    // 1. Worker validation
    const worker = await this.getWorkerById(dto.workerId);
    if (worker.status !== 'ACTIVE') {
      throw new BadRequestException(`Cannot deploy worker: Worker status is ${worker.status} (must be ACTIVE)`);
    }

    // 2. Vendor validation
    const vendor = await this.getVendorById(dto.vendorId);
    if (vendor.status !== 'ACTIVE') {
      throw new BadRequestException(`Cannot deploy worker: Vendor status is ${vendor.status} (must be ACTIVE)`);
    }

    // 3. Contract validation
    const contract = await this.getContractById(dto.contractId);
    if (contract.status !== 'ACTIVE') {
      throw new BadRequestException(`Cannot deploy worker: Contract status is ${contract.status} (must be ACTIVE)`);
    }
    if (new Date(contract.contract_end_date) < new Date()) {
      throw new UnprocessableEntityException('Cannot deploy worker: Contract has expired');
    }

    // 4. CLRA Compliance Check
    const clraRows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM contractor_compliance 
       WHERE vendor_id = ? AND compliance_type = 'CLRA'
       ORDER BY expiry_date DESC LIMIT 1`,
      dto.vendorId
    );
    if (clraRows.length > 0) {
      const clra = clraRows[0];
      if (new Date(clra.expiry_date) < new Date()) {
        throw new UnprocessableEntityException('Cannot deploy worker: Vendor CLRA license is expired');
      }
      if (clra.status === 'REJECTED') {
        throw new UnprocessableEntityException('Cannot deploy worker: Vendor CLRA compliance was rejected');
      }
    }

    // 5. Maximum Headcount Check
    const activeDeployments: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as count FROM worker_deployments WHERE contract_id = ? AND status = 'ACTIVE'`,
      dto.contractId
    );
    const currentDeployed = Number(activeDeployments[0]?.count || 0);
    if (currentDeployed >= Number(contract.maximum_headcount || 0)) {
      throw new ConflictException(`Maximum contract headcount (${contract.maximum_headcount}) exceeded for contract ${contract.contract_number}`);
    }

    // 6. Overlapping Deployment Check for this worker
    const overlapping: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT id FROM worker_deployments 
       WHERE worker_id = ? AND status = 'ACTIVE'`,
      dto.workerId
    );
    if (overlapping.length > 0) {
      throw new ConflictException(`Worker ${worker.worker_code} (${worker.first_name} ${worker.last_name}) already has an ACTIVE deployment. Please complete or transfer the existing deployment first.`);
    }

    // 7. Machine Validation (if machineId provided)
    if (dto.machineId) {
      const machineRows: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT id, machineName, status FROM machines WHERE id = ?`,
        dto.machineId
      );
      if (machineRows.length === 0) {
        throw new NotFoundException('Selected machine not found');
      }
      const mach = machineRows[0];
      if (mach.status === 'UNDER_MAINTENANCE' || mach.status === 'INACTIVE') {
        throw new BadRequestException(`Cannot assign to machine ${mach.machineName}: Machine status is ${mach.status}`);
      }
    }

    // Insert deployment record
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO worker_deployments (
        id, worker_id, vendor_id, contract_id, company_id, branch_id,
        department_id, production_line_id, machine_id, shift_id,
        designation, deployment_type, start_date, end_date,
        status, remarks, created_by, updated_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?, NOW(), NOW())`,
      id,
      dto.workerId,
      dto.vendorId,
      dto.contractId,
      compId,
      bId,
      dto.departmentId || null,
      dto.productionLineId || null,
      dto.machineId || null,
      dto.shiftId || null,
      dto.designation || worker.designation || 'Deployed Worker',
      dto.deploymentType || 'PLANT_FLOOR',
      dto.startDate,
      dto.endDate || null,
      dto.remarks || null,
      userId || null,
      userId || null
    );

    // INTEGRATION WITH MACHINE MANAGEMENT:
    // If assigned to a machine, also sync with machine_allocations!
    if (dto.machineId) {
      try {
        const allocId = `alloc-cw-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO machine_allocations (
            id, machineId, productionLineId, operatorId, shift,
            allocationDate, startTime, endTime, workOrder, operation,
            status, efficiency, notes, createdBy, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 95.0, ?, ?, NOW(), NOW())`,
          allocId,
          dto.machineId,
          dto.productionLineId || null,
          dto.workerId, // mapped to contractor worker
          'General Shift',
          dto.startDate,
          '08:00',
          '17:00',
          `WO-CW-${dto.workerId.slice(-4)}`,
          'Contract Labour Deployment',
          `Deployed via Contractor Vendor: ${vendor.legal_name}`,
          userId || 'System'
        );
      } catch (allocErr) {
        console.warn('Machine allocation sync notice:', allocErr);
      }
    }

    await this.logHistory({
      vendorId: dto.vendorId,
      action: 'WORKER_DEPLOYED',
      entityType: 'DEPLOYMENT',
      entityId: id,
      newValue: {
        worker: `${worker.first_name} ${worker.last_name} (${worker.worker_code})`,
        startDate: dto.startDate,
        machineId: dto.machineId,
        lineId: dto.productionLineId,
      },
      performedBy: userId,
    });

    return this.getDeploymentById(id);
  }

  async completeDeployment(id: string, userId?: string, remarks?: string) {
    const dep = await this.getDeploymentById(id);
    await this.prisma.$executeRawUnsafe(
      `UPDATE worker_deployments SET
        status = 'COMPLETED',
        end_date = COALESCE(end_date, CURRENT_DATE),
        remarks = CONCAT(COALESCE(remarks, ''), ' | Completed: ', COALESCE(?, 'Regular completion')),
        updated_by = ?,
        updated_at = NOW()
      WHERE id = ?`,
      remarks || null,
      userId || null,
      id
    );

    // If linked to a machine, mark machine allocation completed as well
    if (dep.machine_id) {
      try {
        await this.prisma.$executeRawUnsafe(
          `UPDATE machine_allocations SET status = 'COMPLETED', updatedAt = NOW() WHERE machineId = ? AND operatorId = ? AND status = 'ACTIVE'`,
          dep.machine_id,
          dep.worker_id
        );
      } catch (mErr) {
        console.warn('Failed to update machine allocation on completion:', mErr);
      }
    }

    await this.logHistory({
      vendorId: dep.vendor_id,
      action: 'WORKER_EXITED',
      entityType: 'DEPLOYMENT',
      entityId: id,
      reason: remarks || 'Deployment completed',
      performedBy: userId,
    });

    return this.getDeploymentById(id);
  }

  async transferDeployment(id: string, dto: TransferWorkerDeploymentDto, userId?: string) {
    const dep = await this.getDeploymentById(id);
    if (dep.status !== 'ACTIVE') {
      throw new BadRequestException('Can only transfer an ACTIVE deployment');
    }

    // 1. Mark existing deployment TRANSFERRED
    await this.prisma.$executeRawUnsafe(
      `UPDATE worker_deployments SET
        status = 'TRANSFERRED',
        end_date = ?,
        remarks = CONCAT(COALESCE(remarks, ''), ' | Transferred to new line/machine: ', COALESCE(?, '')),
        updated_by = ?,
        updated_at = NOW()
      WHERE id = ?`,
      dto.transferDate,
      dto.reason || 'Workforce re-allocation',
      userId || null,
      id
    );

    // 2. Create new deployment
    const newDep = await this.createDeployment(
      {
        workerId: dep.worker_id,
        vendorId: dep.vendor_id,
        contractId: dep.contract_id,
        companyId: dep.company_id,
        branchId: dep.branch_id,
        departmentId: dto.departmentId !== undefined ? dto.departmentId : dep.department_id,
        productionLineId: dto.productionLineId !== undefined ? dto.productionLineId : dep.production_line_id,
        machineId: dto.machineId !== undefined ? dto.machineId : dep.machine_id,
        shiftId: dto.shiftId !== undefined ? dto.shiftId : dep.shift_id,
        designation: dep.designation,
        deploymentType: dep.deployment_type,
        startDate: dto.transferDate,
        remarks: dto.reason || 'Transferred from previous deployment',
      },
      dep.company_id,
      dep.branch_id,
      userId
    );

    await this.logHistory({
      vendorId: dep.vendor_id,
      action: 'WORKER_TRANSFERRED',
      entityType: 'DEPLOYMENT',
      entityId: newDep.id,
      oldValue: { previousDeploymentId: id, machineId: dep.machine_id, lineId: dep.production_line_id },
      newValue: { newDeploymentId: newDep.id, machineId: dto.machineId, lineId: dto.productionLineId },
      reason: dto.reason,
      performedBy: userId,
    });

    return newDep;
  }

  // ─────────────────────────────────────────────────────────────
  // 6. Statutory Compliance (CLRA, PF, ESIC, etc.)
  // ─────────────────────────────────────────────────────────────
  async listCompliance(
    companyId?: string,
    branchId?: string,
    filters?: {
      vendorId?: string;
      contractId?: string;
      complianceType?: string;
      status?: string;
      search?: string;
    }
  ) {
    let sql = `
      SELECT 
        cc.*,
        v.legal_name as vendor_name,
        v.vendor_code as vendor_code,
        cnt.contract_number,
        b.name as branch_name,
        DATEDIFF(cc.expiry_date, CURRENT_DATE) as days_remaining,
        CASE
          WHEN cc.expiry_date < CURRENT_DATE THEN 'EXPIRED'
          WHEN cc.expiry_date <= DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY) THEN 'EXPIRING'
          ELSE cc.status
        END as calculated_status
      FROM contractor_compliance cc
      JOIN contractor_vendors v ON v.id = cc.vendor_id
      LEFT JOIN contractor_contracts cnt ON cnt.id = cc.contract_id
      LEFT JOIN branches b ON b.id = cc.branch_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (companyId && companyId !== 'ALL') {
      sql += ` AND cc.company_id = ?`;
      params.push(companyId);
    }
    if (branchId && branchId !== 'ALL' && branchId !== 'HEAD_OFFICE' && branchId !== 'NONE' && branchId !== 'null' && branchId !== 'undefined') {
      sql += ` AND cc.branch_id = ?`;
      params.push(branchId);
    }

    if (filters?.vendorId && filters.vendorId !== 'ALL') {
      sql += ` AND cc.vendor_id = ?`;
      params.push(filters.vendorId);
    }
    if (filters?.contractId && filters.contractId !== 'ALL') {
      sql += ` AND cc.contract_id = ?`;
      params.push(filters.contractId);
    }
    if (filters?.complianceType && filters.complianceType !== 'ALL') {
      sql += ` AND cc.compliance_type = ?`;
      params.push(filters.complianceType);
    }
    if (filters?.status && filters.status !== 'ALL') {
      sql += ` AND cc.status = ?`;
      params.push(filters.status);
    }
    if (filters?.search && filters.search.trim()) {
      const q = `%${filters.search.trim()}%`;
      sql += ` AND (cc.license_number LIKE ? OR cc.issuing_authority LIKE ? OR v.legal_name LIKE ? OR v.vendor_code LIKE ?)`;
      params.push(q, q, q, q);
    }

    sql += ` ORDER BY cc.expiry_date ASC`;

    const rows: any[] = await this.prisma.$queryRawUnsafe(sql, ...params);
    return rows.map((r) => ({
      ...r,
      days_remaining: Number(r.days_remaining || 0),
      status: r.calculated_status,
    }));
  }

  async getComplianceById(id: string) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT cc.*, v.legal_name as vendor_name, DATEDIFF(cc.expiry_date, CURRENT_DATE) as days_remaining
       FROM contractor_compliance cc
       JOIN contractor_vendors v ON v.id = cc.vendor_id
       WHERE cc.id = ?`,
      id
    );
    if (!rows || rows.length === 0) {
      throw new NotFoundException('Compliance record not found');
    }
    return {
      ...rows[0],
      days_remaining: Number(rows[0].days_remaining || 0),
    };
  }

  async createCompliance(dto: CreateContractorComplianceDto, companyId?: string, branchId?: string | null, userId?: string) {
    const id = `cmp-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    let compId = dto.companyId || companyId;
    if (!compId || compId === 'ALL') {
      const firstComp = await this.prisma.company.findFirst();
      compId = firstComp?.id;
    }
    if (!compId) throw new BadRequestException('Company ID is required');

    let bId = dto.branchId !== undefined ? dto.branchId : branchId;
    if (bId === 'HEAD_OFFICE' || bId === 'NONE' || bId === 'null') bId = null;

    // Determine status based on dates
    const expiry = new Date(dto.expiryDate);
    const now = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    let status = 'VALID';
    if (expiry < now) status = 'EXPIRED';
    else if (expiry <= thirtyDaysLater) status = 'EXPIRING';

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO contractor_compliance (
        id, vendor_id, contract_id, company_id, branch_id,
        compliance_type, license_number, issue_date, expiry_date,
        issuing_authority, status, verified_by, verified_at,
        document_id, remarks, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, NOW(), NOW())`,
      id,
      dto.vendorId,
      dto.contractId || null,
      compId,
      bId,
      dto.complianceType,
      dto.licenseNumber,
      dto.issueDate,
      dto.expiryDate,
      dto.issuingAuthority || 'Labour Department',
      status,
      userId || 'HR Admin',
      dto.documentId || null,
      dto.remarks || null
    );

    await this.logHistory({
      vendorId: dto.vendorId,
      action: 'COMPLIANCE_ADDED',
      entityType: 'COMPLIANCE',
      entityId: id,
      newValue: { type: dto.complianceType, licenseNumber: dto.licenseNumber, expiryDate: dto.expiryDate, status },
      performedBy: userId,
    });

    return this.getComplianceById(id);
  }

  async verifyCompliance(id: string, dto: VerifyComplianceDto, userId?: string) {
    const existing = await this.getComplianceById(id);
    await this.prisma.$executeRawUnsafe(
      `UPDATE contractor_compliance SET
        status = ?,
        verified_by = ?,
        verified_at = NOW(),
        remarks = COALESCE(?, remarks),
        updated_at = NOW()
      WHERE id = ?`,
      dto.status,
      userId || 'HR Compliance Auditor',
      dto.remarks || null,
      id
    );

    await this.logHistory({
      vendorId: existing.vendor_id,
      action: 'COMPLIANCE_VERIFIED',
      entityType: 'COMPLIANCE',
      entityId: id,
      newValue: { status: dto.status, verifiedBy: userId },
      reason: dto.remarks,
      performedBy: userId,
    });

    return this.getComplianceById(id);
  }

  // ─────────────────────────────────────────────────────────────
  // 7. Documents Management
  // ─────────────────────────────────────────────────────────────
  async listDocuments(vendorId: string, filters?: { contractId?: string; workerId?: string }) {
    let sql = `SELECT * FROM contractor_documents WHERE vendor_id = ?`;
    const params: any[] = [vendorId];

    if (filters?.contractId) {
      sql += ` AND contract_id = ?`;
      params.push(filters.contractId);
    }
    if (filters?.workerId) {
      sql += ` AND worker_id = ?`;
      params.push(filters.workerId);
    }

    sql += ` ORDER BY uploaded_at DESC`;
    const rows: any[] = await this.prisma.$queryRawUnsafe(sql, ...params);
    return rows;
  }

  async createDocument(dto: CreateContractorDocumentDto, userId?: string) {
    const id = `cdoc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO contractor_documents (
        id, vendor_id, contract_id, worker_id, document_type,
        document_name, file_name, file_url, issue_date,
        expiry_date, verification_status, uploaded_by, uploaded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'VERIFIED', ?, NOW())`,
      id,
      dto.vendorId,
      dto.contractId || null,
      dto.workerId || null,
      dto.documentType,
      dto.documentName,
      dto.fileName,
      dto.fileUrl,
      dto.issueDate || null,
      dto.expiryDate || null,
      userId || 'HR Admin'
    );

    await this.logHistory({
      vendorId: dto.vendorId,
      action: 'DOCUMENT_UPLOADED',
      entityType: 'DOCUMENT',
      entityId: id,
      newValue: { name: dto.documentName, type: dto.documentType },
      performedBy: userId,
    });

    const rows: any[] = await this.prisma.$queryRawUnsafe(`SELECT * FROM contractor_documents WHERE id = ?`, id);
    return rows[0];
  }

  async deleteDocument(id: string, userId?: string) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(`SELECT * FROM contractor_documents WHERE id = ?`, id);
    if (!rows || rows.length === 0) throw new NotFoundException('Document not found');
    const doc = rows[0];

    await this.prisma.$executeRawUnsafe(`DELETE FROM contractor_documents WHERE id = ?`, id);
    await this.logHistory({
      vendorId: doc.vendor_id,
      action: 'DOCUMENT_DELETED',
      entityType: 'DOCUMENT',
      entityId: id,
      performedBy: userId,
    });
    return { success: true, message: 'Document deleted successfully' };
  }

  // ─────────────────────────────────────────────────────────────
  // 8. History & Audit
  // ─────────────────────────────────────────────────────────────
  async getVendorHistory(vendorId: string) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM contractor_vendor_history WHERE vendor_id = ? ORDER BY performed_at DESC`,
      vendorId
    );
    return rows;
  }
}
