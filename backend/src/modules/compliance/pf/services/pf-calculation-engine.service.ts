import { Injectable } from '@nestjs/common';

export interface PfConfigInput {
  pfWageCeiling: number;
  epsWageCeiling: number;
  edliWageCeiling: number;
  employeePfRate: number;
  employerEpsRate: number;
  employerEpfRate: number;
  edliRate: number;
  adminRate: number;
  minAdminCharge: number;
  epsMaxCap: number;
  edliMaxCap: number;
  edliExempt: boolean;
  account22Applicable: boolean;
  account22Rate: number;
  account22Min: number;
  allowHigherWage: boolean;
  restrictEpsOver58: boolean;
  policyVersion: string;
}

export interface EmployeePfInput {
  id: string;
  name: string;
  uan?: string;
  memberId?: string;
  dateOfBirth?: Date | string | null;
  pfApplicable?: boolean;
  basicSalary?: number;
  daAllowance?: number;
  grossSalary?: number;
  vpfPercentage?: number;
  higherWageOptIn?: boolean;
  ncpDays?: number;
}

export interface PfCalculationResult {
  employeeId: string;
  employeeName: string;
  uan: string;
  memberId: string;
  grossWage: number;
  basicWage: number;
  daWage: number;
  pfWage: number;
  epsWage: number;
  edliWage: number;
  ncpDays: number;
  employeePf: number;
  vpfAmount: number;
  employerEpf: number;
  employerEps: number;
  edli: number;
  adminCharge: number;
  epsEligible: boolean;
  edliApplicable: boolean;
  higherWage: boolean;
  policyVersion: string;
}

@Injectable()
export class PfCalculationEngineService {

  /**
   * Determine whether an employee is eligible for EPS (8.33% contribution).
   * EPS is restricted for members aged >= 58 years under EPFO rules.
   */
  public isEpsEligible(dob: Date | string | null | undefined, restrictOver58: boolean): boolean {
    if (!dob) return true; // Default to eligible if DOB not provided
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return true;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return !(restrictOver58 && age >= 58);
  }

  /**
   * Calculate statutory PF, EPS, EDLI & Admin deductions for a single employee record.
   */
  public calculateRecord(employee: EmployeePfInput, config: PfConfigInput): PfCalculationResult {
    const basic = Number(employee.basicSalary || 0);
    const da = Number(employee.daAllowance || 0);
    const gross = Number(employee.grossSalary || basic + da);
    const ncp = Number(employee.ncpDays || 0);
    const vpfRate = Number(employee.vpfPercentage || 0);

    const isHigherWageOpted = Boolean(employee.higherWageOptIn);
    const pfCeiling = Number(config.pfWageCeiling || 15000);
    const epsCeiling = Number(config.epsWageCeiling || 15000);
    const edliCeiling = Number(config.edliWageCeiling || 15000);

    // 1. PF Wage Calculation (Basic + DA)
    const eligibleWage = basic + da;
    let pfWage = eligibleWage;
    if (!isHigherWageOpted && eligibleWage > pfCeiling) {
      pfWage = pfCeiling;
    }

    // 2. EPS Eligibility
    const epsEligible = this.isEpsEligible(employee.dateOfBirth, config.restrictEpsOver58);
    let epsWage = 0;
    if (epsEligible) {
      epsWage = isHigherWageOpted ? pfWage : Math.min(pfWage, epsCeiling);
    }

    // 3. EDLI Wage
    const edliApplicable = !config.edliExempt;
    let edliWage = 0;
    if (edliApplicable) {
      edliWage = Math.min(pfWage, edliCeiling);
    }

    // 4. Employee EPF (12%)
    const eeRate = Number(config.employeePfRate || 12) / 100;
    const employeePf = Math.round(pfWage * eeRate);

    // 5. Voluntary PF (VPF)
    const vpfAmount = Math.round(pfWage * (vpfRate / 100));

    // 6. Employer EPS (8.33% capped at ₹1,250)
    let employerEps = 0;
    if (epsEligible) {
      const epsRate = Number(config.employerEpsRate || 8.33) / 100;
      const rawEps = Math.round(epsWage * epsRate);
      const epsMaxCap = Number(config.epsMaxCap || 1250);
      employerEps = isHigherWageOpted ? rawEps : Math.min(rawEps, epsMaxCap);
    }

    // 7. Employer EPF (Account #1) = Total Employee Rate Equivalent (12%) minus Employer EPS
    const employerEpf = Math.max(0, employeePf - employerEps);

    // 8. EDLI Insurance (Account #21) (0.50% max ₹75)
    let edli = 0;
    if (edliApplicable) {
      const edliRate = Number(config.edliRate || 0.50) / 100;
      const rawEdli = Math.round(edliWage * edliRate);
      const edliMaxCap = Number(config.edliMaxCap || 75);
      edli = Math.min(rawEdli, edliMaxCap);
    }

    // 9. Individual Admin Charge Share (0.50%)
    const adminRate = Number(config.adminRate || 0.50) / 100;
    const adminCharge = Math.round(pfWage * adminRate);

    return {
      employeeId: employee.id,
      employeeName: employee.name,
      uan: employee.uan || 'N/A',
      memberId: employee.memberId || 'N/A',
      grossWage: Math.round(gross),
      basicWage: Math.round(basic),
      daWage: Math.round(da),
      pfWage: Math.round(pfWage),
      epsWage: Math.round(epsWage),
      edliWage: Math.round(edliWage),
      ncpDays: ncp,
      employeePf,
      vpfAmount,
      employerEpf,
      employerEps,
      edli,
      adminCharge,
      epsEligible,
      edliApplicable,
      higherWage: isHigherWageOpted,
      policyVersion: config.policyVersion || 'EPFO_2026_V1',
    };
  }

  /**
   * Calculate company-level establishment charges (Acct #2 Admin min ₹500 floor, Acct #22 EDLI inspection).
   */
  public calculateEstablishmentTotals(records: PfCalculationResult[], config: PfConfigInput) {
    let totalGrossWage = 0;
    let totalPfWage = 0;
    let totalEpsWage = 0;
    let totalEdliWage = 0;
    let totalEePf = 0;
    let totalVpf = 0;
    let totalErEpf = 0;
    let totalErEps = 0;
    let totalEdli = 0;
    let totalAdminRaw = 0;

    for (const r of records) {
      totalGrossWage += r.grossWage;
      totalPfWage += r.pfWage;
      totalEpsWage += r.epsWage;
      totalEdliWage += r.edliWage;
      totalEePf += r.employeePf;
      totalVpf += r.vpfAmount;
      totalErEpf += r.employerEpf;
      totalErEps += r.employerEps;
      totalEdli += r.edli;
      totalAdminRaw += r.adminCharge;
    }

    // Account #2 (EPF Admin Charge): Minimum ₹500/month per company establishment
    const minAdmin = Number(config.minAdminCharge || 500);
    const totalAdminCharge = Math.max(totalAdminRaw, minAdmin);

    // Account #22 (EDLI Inspection Charge for Exempted Establishments): 0.005% min ₹1
    let totalAcct22Charge = 0;
    if (config.account22Applicable) {
      const acct22Rate = Number(config.account22Rate || 0.005) / 100;
      const raw22 = Math.round(totalEdliWage * acct22Rate);
      const min22 = Number(config.account22Min || 1.00);
      totalAcct22Charge = Math.max(raw22, min22);
    }

    // Combined Employer & Employee Total Statutory Liability
    const totalLiability =
      totalEePf + totalVpf + totalErEpf + totalErEps + totalEdli + totalAdminCharge + totalAcct22Charge;

    return {
      eligibleStaffCount: records.length,
      totalGrossWage,
      totalPfWage,
      totalEpsWage,
      totalEdliWage,
      totalEePf,
      totalVpf,
      totalErEpf,
      totalErEps,
      totalEdli,
      totalAdminCharge,
      totalAcct22Charge,
      totalLiability,
    };
  }
}
