import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export type MandatoryType = 'MANDATORY' | 'CONDITIONAL' | 'OPTIONAL';
export type ApplicableScope = 'ALL' | 'DEPARTMENT' | 'ROLE' | 'CONDITION_DRIVEN' | 'EXIT_TYPE_DRIVEN';
export type ConditionTrigger =
  | 'NONE'
  | 'HAS_ALLOCATED_ASSET'
  | 'HAS_ALLOCATED_LAPTOP'
  | 'HAS_ALLOCATED_TOOLS'
  | 'HAS_ALLOCATED_PPE'
  | 'HAS_ALLOCATED_MOBILE'
  | 'HAS_ACCESS_ACCOUNT'
  | 'HAS_PHYSICAL_ACCESS'
  | 'HAS_OUTSTANDING_LOANS'
  | 'HAS_PENDING_EXPENSE_CLAIMS'
  | 'HAS_ADVANCE_BALANCE'
  | 'HAS_PENDING_HANDOVER'
  | 'EXIT_TYPE_INVOLUNTARY'
  | 'EXIT_TYPE_CONTRACT_EXPIRY';

export interface ClearanceRule {
  ruleKey: string;
  itemLabel: string;
  department: string;
  taskCategory: string;
  mandatoryType: MandatoryType;
  applicableScope: ApplicableScope;
  applicableDepartments?: string[];
  applicableDesignations?: string[];
  applicableExitTypes?: string[];
  conditionTrigger: ConditionTrigger;
  evidenceRequired?: boolean;
  isActive: boolean;
}

export interface EvaluatedClearanceTask {
  ruleKey: string;
  itemKey: string;
  itemLabel: string;
  department: string;
  taskCategory: string;
  mandatoryType: MandatoryType;
  isApplicable: boolean;
  isRequired: boolean;
  status: 'PENDING' | 'NOT_APPLICABLE' | 'CLEARED' | 'WAIVED';
  exclusionReason?: string;
}

// ── INDUSTRY PRESETS ──
export const INDUSTRY_CLEARANCE_PRESETS: Record<string, ClearanceRule[]> = {
  MANUFACTURING: [
    {
      ruleKey: 'ADMIN_ID_CARD',
      itemLabel: 'ID Card Return & Smartcard Clearance',
      department: 'Admin',
      taskCategory: 'FACILITY_ADMIN',
      mandatoryType: 'MANDATORY',
      applicableScope: 'ALL',
      conditionTrigger: 'NONE',
      isActive: true,
    },
    {
      ruleKey: 'ADMIN_MOBILE_RETURN',
      itemLabel: 'Mobile/SIM Return (Corporate Handset & Cellular Line)',
      department: 'Admin',
      taskCategory: 'ASSETS',
      mandatoryType: 'CONDITIONAL',
      applicableScope: 'CONDITION_DRIVEN',
      conditionTrigger: 'HAS_ALLOCATED_MOBILE',
      isActive: true,
    },
    {
      ruleKey: 'SECURITY_PLANT_GATE_PASS',
      itemLabel: 'Plant Gate Pass Closure & Access Revocation',
      department: 'Security & Gate',
      taskCategory: 'SECURITY',
      mandatoryType: 'MANDATORY',
      applicableScope: 'ALL',
      conditionTrigger: 'NONE',
      isActive: true,
    },
    {
      ruleKey: 'OPS_SHIFT_HANDOVER',
      itemLabel: 'Shift Handover & Operations Order Signoff',
      department: 'Production & Operations',
      taskCategory: 'OPERATIONS_KT',
      mandatoryType: 'MANDATORY',
      applicableScope: 'ALL',
      conditionTrigger: 'NONE',
      isActive: true,
    },
    {
      ruleKey: 'PROD_DEPT_HANDOVER',
      itemLabel: 'Department Handover & Workstation Clearance',
      department: 'Production & Operations',
      taskCategory: 'OPERATIONS_KT',
      mandatoryType: 'MANDATORY',
      applicableScope: 'ALL',
      conditionTrigger: 'NONE',
      isActive: true,
    },
    {
      ruleKey: 'EHS_PPE_RETURN',
      itemLabel: 'PPE Return (Safety Helmet, Harness & Special Gear)',
      department: 'Maintenance & EHS',
      taskCategory: 'ASSETS',
      mandatoryType: 'CONDITIONAL',
      applicableScope: 'CONDITION_DRIVEN',
      conditionTrigger: 'HAS_ALLOCATED_PPE',
      isActive: true,
    },
    {
      ruleKey: 'HR_SERVICE_CLOSURE',
      itemLabel: 'HR Closure & Service Bond Verification',
      department: 'HR',
      taskCategory: 'HR_COMPLIANCE',
      mandatoryType: 'MANDATORY',
      applicableScope: 'ALL',
      conditionTrigger: 'NONE',
      isActive: true,
    },
    {
      ruleKey: 'HR_ATTENDANCE_CLOSURE',
      itemLabel: 'Attendance Closure & Shift Biometric Audit',
      department: 'HR',
      taskCategory: 'HR_COMPLIANCE',
      mandatoryType: 'MANDATORY',
      applicableScope: 'ALL',
      conditionTrigger: 'NONE',
      isActive: true,
    },
    {
      ruleKey: 'HR_EXIT_SURVEY',
      itemLabel: 'Exit Feedback Survey',
      department: 'HR',
      taskCategory: 'HR_COMPLIANCE',
      mandatoryType: 'OPTIONAL',
      applicableScope: 'ALL',
      conditionTrigger: 'NONE',
      isActive: true,
    },
  ],

  HEALTHCARE: [
    {
      ruleKey: 'ADMIN_HOSPITAL_BADGE',
      itemLabel: 'Hospital Smart Badge, Scrubs & Locker Keys Return',
      department: 'Admin & Facilities',
      taskCategory: 'FACILITY_ADMIN',
      mandatoryType: 'MANDATORY',
      applicableScope: 'ALL',
      conditionTrigger: 'NONE',
      isActive: true,
    },
    {
      ruleKey: 'CLINICAL_PATIENT_HANDOFF',
      itemLabel: 'Patient File, Ward Log & Clinical Case Handover',
      department: 'Clinical Dept',
      taskCategory: 'OPERATIONS_KT',
      mandatoryType: 'MANDATORY',
      applicableScope: 'DEPARTMENT',
      applicableDepartments: ['clinical', 'medical', 'nursing', 'surgery', 'icu', 'emergency', 'radiology'],
      conditionTrigger: 'NONE',
      isActive: true,
    },
    {
      ruleKey: 'PHARMACY_NARCOTICS_KEYS',
      itemLabel: 'Schedule Drug & Narcotics Cabinet Key Return',
      department: 'Pharmacy & Custody',
      taskCategory: 'SECURITY',
      mandatoryType: 'CONDITIONAL',
      applicableScope: 'ROLE',
      applicableDesignations: ['nurse', 'pharmacist', 'medical officer', 'incharge'],
      conditionTrigger: 'HAS_PHYSICAL_ACCESS',
      isActive: true,
    },
    {
      ruleKey: 'IT_EHR_HIS_ACCESS',
      itemLabel: 'Electronic Health Record (EHR) & HIS Access Revocation',
      department: 'IT',
      taskCategory: 'IT_SYSTEMS',
      mandatoryType: 'MANDATORY',
      applicableScope: 'ALL',
      conditionTrigger: 'NONE',
      isActive: true,
    },
    {
      ruleKey: 'ASSET_DIAGNOSTIC_TOOLS',
      itemLabel: 'Diagnostic Tools, Clinical Tablet & Pager Return',
      department: 'Assets',
      taskCategory: 'ASSETS',
      mandatoryType: 'CONDITIONAL',
      applicableScope: 'CONDITION_DRIVEN',
      conditionTrigger: 'HAS_ALLOCATED_ASSET',
      isActive: true,
    },
    {
      ruleKey: 'HR_MEDICAL_REGISTRATION',
      itemLabel: 'Medical Council Registration Verification & Clearance',
      department: 'HR',
      taskCategory: 'HR_COMPLIANCE',
      mandatoryType: 'MANDATORY',
      applicableScope: 'ALL',
      conditionTrigger: 'NONE',
      isActive: true,
    },
    {
      ruleKey: 'FINANCE_DUTY_ALLOWANCE',
      itemLabel: 'On-Call & Night Duty Allowance Reconciliation',
      department: 'Finance',
      taskCategory: 'FINANCE',
      mandatoryType: 'MANDATORY',
      applicableScope: 'ALL',
      conditionTrigger: 'NONE',
      isActive: true,
    },
    {
      ruleKey: 'HR_EXIT_INTERVIEW',
      itemLabel: 'Formal Exit Interview Completion',
      department: 'HR',
      taskCategory: 'HR_COMPLIANCE',
      mandatoryType: 'MANDATORY',
      applicableScope: 'EXIT_TYPE_DRIVEN',
      applicableExitTypes: ['RESIGNATION', 'RETIREMENT', 'MUTUAL_SEPARATION'],
      conditionTrigger: 'NONE',
      isActive: true,
    },
  ],

  IT_TECH: [
    {
      ruleKey: 'ADMIN_ID_CARD',
      itemLabel: 'Employee Physical ID Badge & Smartcard Return',
      department: 'Admin',
      taskCategory: 'FACILITY_ADMIN',
      mandatoryType: 'MANDATORY',
      applicableScope: 'ALL',
      conditionTrigger: 'NONE',
      isActive: true,
    },
    {
      ruleKey: 'ADMIN_ACCESS_KEYS',
      itemLabel: 'Office Access Card, Pedestal Key & Parking Pass',
      department: 'Admin',
      taskCategory: 'FACILITY_ADMIN',
      mandatoryType: 'MANDATORY',
      applicableScope: 'ALL',
      conditionTrigger: 'NONE',
      isActive: true,
    },
    {
      ruleKey: 'MGR_SPRINT_HANDOVER',
      itemLabel: 'Sprint Backlog & Task Work Handover',
      department: 'Reporting Manager',
      taskCategory: 'OPERATIONS_KT',
      mandatoryType: 'MANDATORY',
      applicableScope: 'ALL',
      conditionTrigger: 'NONE',
      isActive: true,
    },
    {
      ruleKey: 'MGR_CODE_KT',
      itemLabel: 'Code KT & Git Repository / Project Access Transfer',
      department: 'Reporting Manager',
      taskCategory: 'OPERATIONS_KT',
      mandatoryType: 'MANDATORY',
      applicableScope: 'DEPARTMENT',
      applicableDepartments: ['engineering', 'technology', 'it', 'qa', 'product', 'software', 'devops'],
      conditionTrigger: 'NONE',
      isActive: true,
    },
    {
      ruleKey: 'IT_LAPTOP_HARDWARE',
      itemLabel: 'Company Laptop, Charger & Peripheral Hardware Return',
      department: 'IT',
      taskCategory: 'ASSETS',
      mandatoryType: 'CONDITIONAL',
      applicableScope: 'CONDITION_DRIVEN',
      conditionTrigger: 'HAS_ALLOCATED_LAPTOP',
      isActive: true,
    },
    {
      ruleKey: 'IT_MONITOR_ACCESSORIES',
      itemLabel: 'Assigned External Monitor & Ergonomic Accessories',
      department: 'IT',
      taskCategory: 'ASSETS',
      mandatoryType: 'CONDITIONAL',
      applicableScope: 'CONDITION_DRIVEN',
      conditionTrigger: 'HAS_ALLOCATED_ASSET',
      isActive: true,
    },
    {
      ruleKey: 'IT_EMAIL_SLACK_ARCHIVE',
      itemLabel: 'Email Account, Slack / Teams & Cloud Archival',
      department: 'IT',
      taskCategory: 'IT_SYSTEMS',
      mandatoryType: 'MANDATORY',
      applicableScope: 'ALL',
      conditionTrigger: 'NONE',
      isActive: true,
    },
    {
      ruleKey: 'IT_VPN_IAM_REVOCATION',
      itemLabel: 'VPN Keys, AWS/GCP IAM & Security Token Revocation',
      department: 'IT',
      taskCategory: 'IT_SYSTEMS',
      mandatoryType: 'MANDATORY',
      applicableScope: 'ALL',
      conditionTrigger: 'NONE',
      isActive: true,
    },
    {
      ruleKey: 'ASSETS_MOBILE_SIM',
      itemLabel: 'Corporate Mobile Handset & SIM Return',
      department: 'Assets',
      taskCategory: 'ASSETS',
      mandatoryType: 'CONDITIONAL',
      applicableScope: 'CONDITION_DRIVEN',
      conditionTrigger: 'HAS_ALLOCATED_MOBILE',
      isActive: true,
    },
    {
      ruleKey: 'FINANCE_SALARY_VARIABLE',
      itemLabel: 'Salary & Variable Pay Dues Reconciliation',
      department: 'Finance',
      taskCategory: 'FINANCE',
      mandatoryType: 'MANDATORY',
      applicableScope: 'ALL',
      conditionTrigger: 'NONE',
      isActive: true,
    },
    {
      ruleKey: 'FINANCE_ADVANCE_LOAN',
      itemLabel: 'Travel Advance & Loan Recovery Clearance',
      department: 'Finance',
      taskCategory: 'FINANCE',
      mandatoryType: 'CONDITIONAL',
      applicableScope: 'CONDITION_DRIVEN',
      conditionTrigger: 'HAS_OUTSTANDING_LOANS',
      isActive: true,
    },
    {
      ruleKey: 'HR_LEAVE_ENCASHMENT',
      itemLabel: 'Unavailed Leave Balance Encashment Audit',
      department: 'HR',
      taskCategory: 'HR_COMPLIANCE',
      mandatoryType: 'MANDATORY',
      applicableScope: 'ALL',
      conditionTrigger: 'NONE',
      isActive: true,
    },
    {
      ruleKey: 'HR_EXIT_INTERVIEW',
      itemLabel: 'Formal Exit Interview Completion',
      department: 'HR',
      taskCategory: 'HR_COMPLIANCE',
      mandatoryType: 'MANDATORY',
      applicableScope: 'EXIT_TYPE_DRIVEN',
      applicableExitTypes: ['RESIGNATION', 'RETIREMENT', 'MUTUAL_SEPARATION'],
      conditionTrigger: 'NONE',
      isActive: true,
    },
  ],

  BANKING_FINANCE: [
    {
      ruleKey: 'ADMIN_ID_CARD',
      itemLabel: 'Employee Physical ID Badge & Smartcard Return',
      department: 'Admin',
      taskCategory: 'FACILITY_ADMIN',
      mandatoryType: 'MANDATORY',
      applicableScope: 'ALL',
      conditionTrigger: 'NONE',
      isActive: true,
    },
    {
      ruleKey: 'SECURITY_BRANCH_ACCESS',
      itemLabel: 'Branch Access Card, Strongroom & Cash Vault Keys',
      department: 'Security & Facilities',
      taskCategory: 'SECURITY',
      mandatoryType: 'MANDATORY',
      applicableScope: 'ALL',
      conditionTrigger: 'NONE',
      isActive: true,
    },
    {
      ruleKey: 'OPS_TELLER_CASH_HANDOVER',
      itemLabel: 'Teller Cash Drawer & Financial Register Signoff',
      department: 'Operations',
      taskCategory: 'OPERATIONS_KT',
      mandatoryType: 'CONDITIONAL',
      applicableScope: 'ROLE',
      applicableDesignations: ['teller', 'cashier', 'branch manager', 'operations officer'],
      conditionTrigger: 'NONE',
      isActive: true,
    },
    {
      ruleKey: 'IT_CORE_BANKING_ACCESS',
      itemLabel: 'Core Banking System (CBS) & Finacle / SWIFT Access Revocation',
      department: 'IT',
      taskCategory: 'IT_SYSTEMS',
      mandatoryType: 'MANDATORY',
      applicableScope: 'ALL',
      conditionTrigger: 'NONE',
      isActive: true,
    },
    {
      ruleKey: 'IT_LAPTOP_RETURN',
      itemLabel: 'Assigned Laptop & Mobile Device Return',
      department: 'IT',
      taskCategory: 'ASSETS',
      mandatoryType: 'CONDITIONAL',
      applicableScope: 'CONDITION_DRIVEN',
      conditionTrigger: 'HAS_ALLOCATED_LAPTOP',
      isActive: true,
    },
    {
      ruleKey: 'FINANCE_LOAN_STAFF_ADVANCE',
      itemLabel: 'Staff Concessional Loan & Advance Recovery Audit',
      department: 'Finance',
      taskCategory: 'FINANCE',
      mandatoryType: 'MANDATORY',
      applicableScope: 'ALL',
      conditionTrigger: 'NONE',
      isActive: true,
    },
    {
      ruleKey: 'HR_COMPLIANCE_SIGN',
      itemLabel: 'Banking Regulatory Compliance & NDA Exit Signoff',
      department: 'HR',
      taskCategory: 'HR_COMPLIANCE',
      mandatoryType: 'MANDATORY',
      applicableScope: 'ALL',
      conditionTrigger: 'NONE',
      isActive: true,
    },
    {
      ruleKey: 'HR_EXIT_INTERVIEW',
      itemLabel: 'Formal Exit Interview Completion',
      department: 'HR',
      taskCategory: 'HR_COMPLIANCE',
      mandatoryType: 'MANDATORY',
      applicableScope: 'EXIT_TYPE_DRIVEN',
      applicableExitTypes: ['RESIGNATION', 'RETIREMENT', 'MUTUAL_SEPARATION'],
      conditionTrigger: 'NONE',
      isActive: true,
    },
  ],

  CORPORATE: [
    {
      ruleKey: 'ADMIN_ID_ACCESS_CARD',
      itemLabel: 'Company ID Card, RFID Access Card & Office Keys',
      department: 'Admin',
      taskCategory: 'FACILITY_ADMIN',
      mandatoryType: 'MANDATORY',
      applicableScope: 'ALL',
      conditionTrigger: 'NONE',
      isActive: true,
    },
    {
      ruleKey: 'MGR_WORK_HANDOVER',
      itemLabel: 'Project & Client Deliverables Handover',
      department: 'Reporting Manager',
      taskCategory: 'OPERATIONS_KT',
      mandatoryType: 'MANDATORY',
      applicableScope: 'ALL',
      conditionTrigger: 'NONE',
      isActive: true,
    },
    {
      ruleKey: 'IT_WORKSTATION_HARDWARE',
      itemLabel: 'Workstation Laptop & Peripheral Hardware Return',
      department: 'IT',
      taskCategory: 'ASSETS',
      mandatoryType: 'CONDITIONAL',
      applicableScope: 'CONDITION_DRIVEN',
      conditionTrigger: 'HAS_ALLOCATED_LAPTOP',
      isActive: true,
    },
    {
      ruleKey: 'IT_EMAIL_SSO_ACCESS',
      itemLabel: 'Email Account, Single Sign-On (SSO) & Network Access',
      department: 'IT',
      taskCategory: 'IT_SYSTEMS',
      mandatoryType: 'MANDATORY',
      applicableScope: 'ALL',
      conditionTrigger: 'NONE',
      isActive: true,
    },
    {
      ruleKey: 'ASSETS_COMPANY_PROPERTY',
      itemLabel: 'Return of Company Assigned Assets & Mobile SIM',
      department: 'Assets',
      taskCategory: 'ASSETS',
      mandatoryType: 'CONDITIONAL',
      applicableScope: 'CONDITION_DRIVEN',
      conditionTrigger: 'HAS_ALLOCATED_ASSET',
      isActive: true,
    },
    {
      ruleKey: 'FINANCE_SALARY_RECONCILIATION',
      itemLabel: 'Salary, Expense & Advance Reconciliation',
      department: 'Finance',
      taskCategory: 'FINANCE',
      mandatoryType: 'MANDATORY',
      applicableScope: 'ALL',
      conditionTrigger: 'NONE',
      isActive: true,
    },
    {
      ruleKey: 'HR_LEAVE_ENCASHMENT',
      itemLabel: 'Service Agreement Clearance & Leave Encashment Audit',
      department: 'HR',
      taskCategory: 'HR_COMPLIANCE',
      mandatoryType: 'MANDATORY',
      applicableScope: 'ALL',
      conditionTrigger: 'NONE',
      isActive: true,
    },
    {
      ruleKey: 'HR_EXIT_INTERVIEW',
      itemLabel: 'Formal Exit Interview Completion',
      department: 'HR',
      taskCategory: 'HR_COMPLIANCE',
      mandatoryType: 'MANDATORY',
      applicableScope: 'EXIT_TYPE_DRIVEN',
      applicableExitTypes: ['RESIGNATION', 'RETIREMENT', 'MUTUAL_SEPARATION'],
      conditionTrigger: 'NONE',
      isActive: true,
    },
    {
      ruleKey: 'HR_ALUMNI_OPTIONAL',
      itemLabel: 'Corporate Alumni Network Opt-In',
      department: 'HR',
      taskCategory: 'HR_COMPLIANCE',
      mandatoryType: 'OPTIONAL',
      applicableScope: 'ALL',
      conditionTrigger: 'NONE',
      isActive: true,
    },
  ],
};

@Injectable()
export class ExitClearanceMasterService {
  // In-memory tenant store with fallback to industry preset
  private companyCustomRules: Map<string, { sector: string; rules: ClearanceRule[] }> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Determine company's industry sector. Priority:
   * 1. Custom configured sector
   * 2. Company.industry or Company.entityType in DB
   * 3. Default to MANUFACTURING (or IT_TECH if software)
   */
  async getCompanySector(companyId?: string): Promise<string> {
    if (!companyId) return 'MANUFACTURING';

    if (this.companyCustomRules.has(companyId)) {
      return this.companyCustomRules.get(companyId)!.sector;
    }

    try {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        select: { entityType: true, name: true },
      });

      const name = (company?.name || '').toLowerCase();
      const entity = (company?.entityType || '').toLowerCase();
      const raw = `${name} ${entity}`;

      // 1. Manufacturing & Industrial Plant check (priority if name contains lift, component, plant, machine, industrial, factory, midc, manufacturing)
      if (
        name.includes('manufactur') ||
        name.includes('lift') ||
        name.includes('component') ||
        name.includes('plant') ||
        name.includes('machin') ||
        name.includes('industrial') ||
        name.includes('factory') ||
        name.includes('midc') ||
        entity.includes('manufactur') ||
        entity.includes('industrial')
      ) {
        return 'MANUFACTURING';
      }

      if (raw.includes('health') || raw.includes('hospital') || raw.includes('clinic') || raw.includes('pharma')) return 'HEALTHCARE';
      if (raw.includes('bank') || raw.includes('financ') || raw.includes('invest')) return 'BANKING_FINANCE';
      if (raw.includes('retail') || raw.includes('store') || raw.includes('mall')) return 'RETAIL';
      if (raw.includes('tech') || raw.includes('software') || raw.includes('digital') || entity.includes('information technology')) return 'IT_TECH';
      if (raw.includes('corporate') || raw.includes('consulting')) return 'CORPORATE';
    } catch {
      // Fallback
    }

    return 'MANUFACTURING';
  }

  /**
   * Get active clearance rules for a company
   */
  async getClearanceRules(companyId?: string): Promise<{ sector: string; rules: ClearanceRule[] }> {
    const sector = await this.getCompanySector(companyId);

    if (companyId && this.companyCustomRules.has(companyId)) {
      return this.companyCustomRules.get(companyId)!;
    }
    if (this.companyCustomRules.has('DEFAULT')) {
      return this.companyCustomRules.get('DEFAULT')!;
    }

    const preset = INDUSTRY_CLEARANCE_PRESETS[sector] || INDUSTRY_CLEARANCE_PRESETS.MANUFACTURING;
    return { sector, rules: preset };
  }

  /**
   * Save custom clearance rules for a company
   */
  async saveCompanyRules(companyId: string | undefined, sector: string, rules: ClearanceRule[]): Promise<{ sector: string; rules: ClearanceRule[] }> {
    if (companyId) {
      this.companyCustomRules.set(companyId, { sector, rules });
    }
    return { sector, rules };
  }

  /**
   * Reset company rules to industry preset
   */
  async resetToPreset(companyId: string, sector: string): Promise<{ sector: string; rules: ClearanceRule[] }> {
    const preset = INDUSTRY_CLEARANCE_PRESETS[sector] || INDUSTRY_CLEARANCE_PRESETS.MANUFACTURING;
    this.companyCustomRules.set(companyId, { sector, rules: preset });
    return { sector, rules: preset };
  }

  /**
   * Evaluate clearance tasks dynamically for an exiting employee
   */
  async evaluateClearanceForEmployee(
    employeeOrId: any,
    exitType: string = 'RESIGNATION',
    companyId?: string,
  ): Promise<EvaluatedClearanceTask[]> {
    let employee = employeeOrId;
    if (typeof employeeOrId === 'string') {
      employee = await this.prisma.employee.findUnique({
        where: { id: employeeOrId },
        include: {
          department: true,
          designation: true,
          branch: true,
          assetAllocations: {
            where: { returnedAt: null },
            include: { asset: true },
          },
        },
      });
    }

    if (!employee) return [];

    const effectiveCompanyId = companyId || employee.companyId;
    const { sector, rules } = await this.getClearanceRules(effectiveCompanyId);

    // 1. Live Employee Asset Allocation Audit
    // STRICT CRITERIA: ONLY personal equipment assigned directly to employee.
    // Fixed plant machinery, department tools, and location assets are strictly excluded!
    let personalAssetAllocations: any[] = [];
    try {
      personalAssetAllocations = await this.prisma.assetAllocation.findMany({
        where: {
          employeeId: employee.id,
          returnedAt: null,
          asset: {
            currentEmployeeId: employee.id,
            // Exclude fixed plant machinery, heavy equipment, and location/department/branch assets
            NOT: {
              OR: [
                { assetType: 'LOCATION' },
                { assetType: 'DEPARTMENT' },
                { assetType: 'BRANCH' },
                { assetType: 'COMPANY' },
                { status: 'UNDER_MAINTENANCE' },
              ],
            },
          },
        },
        include: { asset: true },
      });
    } catch {
      // If table query fails, fallback to employee.assetAllocations if preloaded
      personalAssetAllocations = (employee.assetAllocations || []).filter(
        (a: any) =>
          !a.returnedAt &&
          a.asset?.currentEmployeeId === employee.id &&
          !['LOCATION', 'DEPARTMENT', 'BRANCH', 'COMPANY'].includes(a.asset?.assetType),
      );
    }

    const hasAllocatedAsset = personalAssetAllocations.length > 0;

    const hasAllocatedLaptop = personalAssetAllocations.some((a) => {
      const name = (a.asset?.name || '').toLowerCase();
      const cat = (a.asset?.category || '').toLowerCase();
      return name.includes('laptop') || name.includes('macbook') || name.includes('notebook') || cat.includes('computer') || cat.includes('it');
    });

    const hasAllocatedTools = personalAssetAllocations.some((a) => {
      const name = (a.asset?.name || '').toLowerCase();
      const cat = (a.asset?.category || '').toLowerCase();
      return name.includes('tool') || name.includes('gauge') || name.includes('kit') || cat.includes('tool') || cat.includes('instrument');
    });

    const hasAllocatedPPE = personalAssetAllocations.some((a) => {
      const name = (a.asset?.name || '').toLowerCase();
      const cat = (a.asset?.category || '').toLowerCase();
      return name.includes('ppe') || name.includes('helmet') || name.includes('harness') || name.includes('boot') || cat.includes('ppe') || cat.includes('safety');
    });

    const hasAllocatedMobile = personalAssetAllocations.some((a) => {
      const name = (a.asset?.name || '').toLowerCase();
      const cat = (a.asset?.category || '').toLowerCase();
      return name.includes('mobile') || name.includes('phone') || name.includes('sim') || cat.includes('mobile') || cat.includes('telecom');
    });

    // Live checks for outstanding loans & pending expense claims
    let hasPendingExpenseClaims = false;
    try {
      const pendingClaimsCount = await this.prisma.expenseClaim.count({
        where: {
          employeeId: employee.id,
          status: { in: ['SUBMITTED', 'PENDING', 'UNDER_REVIEW', 'APPROVED_BY_MGR'] },
        },
      });
      hasPendingExpenseClaims = pendingClaimsCount > 0;
    } catch {
      hasPendingExpenseClaims = false;
    }

    let hasOutstandingLoans = false;
    try {
      const exitRecord = await this.prisma.employeeExit.findFirst({
        where: {
          employeeId: employee.id,
          status: { notIn: ['EXITED', 'OFFBOARDING_COMPLETED', 'REJECTED', 'WITHDRAWN'] },
        },
        include: { fnfSettlement: true },
      });
      if (exitRecord?.fnfSettlement && exitRecord.fnfSettlement.loanAdvanceRecovery > 0) {
        hasOutstandingLoans = true;
      }
    } catch {
      hasOutstandingLoans = false;
    }

    // 2. Department & Role Normalization
    const deptNorm = (employee.department?.name || '').toLowerCase();
    const desigNorm = (employee.designation?.title || '').toLowerCase();

    // 3. Evaluate each rule
    const evaluatedTasks: EvaluatedClearanceTask[] = [];

    for (const rule of rules) {
      if (!rule.isActive) continue;

      let isApplicable = true;
      let exclusionReason: string | undefined;

      // A. Department Scope Check
      if (rule.applicableScope === 'DEPARTMENT' && rule.applicableDepartments && rule.applicableDepartments.length > 0) {
        const matchesDept = rule.applicableDepartments.some((d) => deptNorm.includes(d.toLowerCase()));
        if (!matchesDept) {
          isApplicable = false;
          exclusionReason = `Not applicable to ${employee.department?.name || 'current'} department`;
        }
      }

      // B. Role Scope Check
      if (isApplicable && rule.applicableScope === 'ROLE' && rule.applicableDesignations && rule.applicableDesignations.length > 0) {
        const matchesRole = rule.applicableDesignations.some((r) => desigNorm.includes(r.toLowerCase()));
        if (!matchesRole) {
          isApplicable = false;
          exclusionReason = `Not applicable to ${employee.designation?.title || 'current'} role`;
        }
      }

      // C. Exit Type Scope Check
      if (isApplicable && rule.applicableScope === 'EXIT_TYPE_DRIVEN' && rule.applicableExitTypes && rule.applicableExitTypes.length > 0) {
        const matchesExit = rule.applicableExitTypes.includes(exitType);
        if (!matchesExit) {
          isApplicable = false;
          exclusionReason = `Waived for exit type: ${exitType.replace('_', ' ')}`;
        }
      }

      // D. Condition Triggers
      if (isApplicable && rule.conditionTrigger !== 'NONE') {
        switch (rule.conditionTrigger) {
          case 'HAS_ALLOCATED_LAPTOP':
            if (!hasAllocatedLaptop) {
              isApplicable = false;
              exclusionReason = 'Not Required — No laptop assigned to employee';
            }
            break;

          case 'HAS_ALLOCATED_TOOLS':
            if (!hasAllocatedTools) {
              isApplicable = false;
              exclusionReason = 'Not Required — No tool kit assigned to employee';
            }
            break;

          case 'HAS_ALLOCATED_PPE':
            if (!hasAllocatedPPE) {
              isApplicable = false;
              exclusionReason = 'Not Required — No company PPE equipment tracked';
            }
            break;

          case 'HAS_ALLOCATED_MOBILE':
            if (!hasAllocatedMobile) {
              isApplicable = false;
              exclusionReason = 'Not Required — No corporate mobile or SIM assigned';
            }
            break;

          case 'HAS_ALLOCATED_ASSET':
            if (!hasAllocatedAsset) {
              isApplicable = false;
              exclusionReason = 'Not Required — 0 personal assets allocated in register';
            }
            break;

          case 'HAS_ACCESS_ACCOUNT':
            if (!employee.workEmail) {
              isApplicable = false;
              exclusionReason = 'Not Required — No corporate system login or work email assigned';
            }
            break;

          case 'HAS_PHYSICAL_ACCESS':
            // Applicable for staff with on-prem facility/plant assignments
            isApplicable = true;
            break;

          case 'HAS_OUTSTANDING_LOANS':
            if (!hasOutstandingLoans) {
              isApplicable = false;
              exclusionReason = 'Not Required — No active company loan or advance balance recorded';
            }
            break;

          case 'HAS_PENDING_EXPENSE_CLAIMS':
            if (!hasPendingExpenseClaims) {
              isApplicable = false;
              exclusionReason = 'Not Required — No outstanding travel/expense claim unsettled';
            }
            break;

          case 'HAS_ADVANCE_BALANCE':
            if (!hasOutstandingLoans) {
              isApplicable = false;
              exclusionReason = 'Not Required — Zero advance balance on record';
            }
            break;

          case 'HAS_PENDING_HANDOVER':
            // Handovers apply if employee has a team/manager or is in operations/tech
            if (!employee.reportingManagerId && !deptNorm.includes('operat') && !deptNorm.includes('tech')) {
              isApplicable = false;
              exclusionReason = 'Not Required — Independent role with no active handover tasks';
            }
            break;

          case 'EXIT_TYPE_INVOLUNTARY':
            if (!['TERMINATION', 'ABSCONDING', 'LAYOFF', 'LAYOFF_REDUNDANCY'].includes(exitType)) {
              isApplicable = false;
              exclusionReason = 'Only applies to involuntary terminations';
            }
            break;

          case 'EXIT_TYPE_CONTRACT_EXPIRY':
            if (exitType !== 'CONTRACT_EXPIRY') {
              isApplicable = false;
              exclusionReason = 'Only applies to contract expiries';
            }
            break;

          default:
            break;
        }
      }

      // E. Calculate isRequired & status
      // MANDATORY: Always required if applicable -> blocks exit
      // CONDITIONAL: Required when applicable -> blocks exit
      // OPTIONAL: Never blocks exit -> isRequired = false
      const isRequired = isApplicable && (rule.mandatoryType === 'MANDATORY' || rule.mandatoryType === 'CONDITIONAL');
      const status: 'PENDING' | 'NOT_APPLICABLE' = isApplicable ? 'PENDING' : 'NOT_APPLICABLE';

      evaluatedTasks.push({
        ruleKey: rule.ruleKey,
        itemKey: rule.ruleKey.toLowerCase(),
        itemLabel: rule.itemLabel,
        department: rule.department,
        taskCategory: rule.taskCategory,
        mandatoryType: rule.mandatoryType,
        isApplicable,
        isRequired,
        status,
        exclusionReason,
      });
    }

    return evaluatedTasks;
  }
}
