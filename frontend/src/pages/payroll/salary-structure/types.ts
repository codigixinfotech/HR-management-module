// ============================================================================
// EHCM Payroll Module - Salary Structure Types
// ============================================================================

export interface SalaryComponentItem {
  id: string;
  code: string;
  name: string;
  type: 'EARNING' | 'DEDUCTION' | 'EMPLOYER_CONTRIBUTION' | 'REIMBURSEMENT';
  category: string;
  description: string;
  calculationType: 'FIXED' | 'PERCENTAGE' | 'FORMULA' | 'BALANCING' | 'MANUAL';
  calculationValue: number;
  calculationBase?: string;
  formula?: string;
  frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'ONE_TIME';
  displayOrder: number;
  roundingRule: 'NEAREST_1' | 'NEAREST_10' | 'CEIL' | 'FLOOR' | 'NONE';
  isStatutory: boolean;
  isSystem: boolean;
  isTaxable: boolean;
  includeInGross: boolean;
  includeInCtc: boolean;
  showOnPayslip: boolean;
  proRateOnLop: boolean;
  isPfApplicable: boolean;
  isEsiApplicable: boolean;
  isPtApplicable: boolean;
  isLwfApplicable: boolean;
  isGratuityApplicable: boolean;
  isTdsApplicable: boolean;
  isActive: boolean;
  effectiveFrom: string;
}

export interface StructureTemplate {
  id: string;
  name: string;
  code: string;
  gradeCode: string;
  gradeName: string;
  category: string; // Workforce section: e.g. "Corporate & Tech", "Plant & Factory Floor", "Retail & Frontline", "Clinical / Healthcare", "Contract / Daily Wage"
  industry?: string; // Optional reference tag
  description: string;
  balancingComponentCode: string;
  version: number;
  isActive: boolean;
  minCtc: number;
  maxCtc: number;
  items: Array<{
    componentCode: string;
    componentName: string;
    type: 'EARNING' | 'DEDUCTION' | 'EMPLOYER_CONTRIBUTION' | 'REIMBURSEMENT';
    calculationType: string;
    calculationValue?: number;
    calculationBase?: string;
    formula?: string;
    isBalancing?: boolean;
    order: number;
  }>;
}

export interface SampleEmployeeSalary {
  id: string;
  employeeId: string;
  employeeCode: string;
  name: string;
  avatarUrl?: string;
  department: string;
  designation: string;
  grade: string;
  templateCode: string;
  templateName: string;
  annualCtc: number;
  monthlyCtc: number;
  grossSalary: number;
  netSalary: number;
  effectiveFrom: string;
  taxRegime: 'NEW' | 'OLD';
  status: 'ACTIVE' | 'PENDING' | 'REVISED';
  hasSalaryAssigned: boolean;
  complianceRuleCompliant: boolean;
}

export interface StatutorySettingsData {
  pf: {
    enabled: boolean;
    employeeRate: number;
    employerEpfRate: number;
    employerEpsRate: number;
    edliRate: number;
    adminRate: number;
    wageCeiling: number;
    restrictToWageCeiling: boolean;
    allowVpf: boolean;
    autoEnrollOverCeiling: boolean;
  };
  esi: {
    enabled: boolean;
    employeeRate: number;
    employerRate: number;
    wageCeiling: number;
    disabilityWageCeiling: number;
  };
  professionalTax: {
    enabled: boolean;
    defaultState: string;
    states: Array<{
      code: string;
      name: string;
      slabs: Array<{ min: number; max: number; monthlyTax: number; febTax?: number }>;
    }>;
  };
  lwf: {
    enabled: boolean;
    states: Array<{
      code: string;
      name: string;
      frequency: string;
      employeeShare: number;
      employerShare: number;
    }>;
  };
  gratuity: {
    enabled: boolean;
    formulaDays: number;
    monthDenominator: number;
    statutoryCeiling: number;
    minYearsRequired: number;
  };
  minimumWages: Array<{
    state: string;
    unskilled: number;
    semiSkilled: number;
    skilled: number;
    highlySkilled: number;
    lastRevised: string;
  }>;
}

export interface TaxRegimeData {
  fy: string;
  newRegime: {
    standardDeduction: number;
    rebate87ALimit: number;
    cessRate: number;
    slabs: Array<{ min: number; max: number; rate: number }>;
  };
  oldRegime: {
    standardDeduction: number;
    rebate87ALimit: number;
    sec80CLimit: number;
    sec80DLimit: number;
    cessRate: number;
    slabs: Array<{ min: number; max: number; rate: number }>;
  };
}
