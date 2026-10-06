// ============================================================================
// EHCM Payroll Module - Formula Engine & Salary Calculator
// ============================================================================

export interface ComponentCalculationContext {
  ctc: number;
  basic?: number;
  da?: number;
  hra?: number;
  gross?: number;
  lopDays?: number;
  workDays?: number;
  [key: string]: number | undefined;
}

/**
 * Safely evaluates mathematical expressions for salary formulas.
 * Supports +, -, *, /, (, ), MIN, MAX, ROUND, and variables.
 */
export function evaluateFormula(formula: string, context: ComponentCalculationContext): { result: number; error?: string } {
  try {
    if (!formula || !formula.trim()) return { result: 0 };

    let sanitized = formula.trim();

    // Replace variable names with their values from context (case-insensitive)
    const sortedKeys = Object.keys(context).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
      const val = context[key] ?? 0;
      const regex = new RegExp(`\\b${key}\\b`, 'gi');
      sanitized = sanitized.replace(regex, `(${val})`);
    }

    // Replace math functions
    sanitized = sanitized
      .replace(/\bMIN\s*\(/gi, 'Math.min(')
      .replace(/\bMAX\s*\(/gi, 'Math.max(')
      .replace(/\bROUND\s*\(/gi, 'Math.round(')
      .replace(/\bFLOOR\s*\(/gi, 'Math.floor(')
      .replace(/\bCEIL\s*\(/gi, 'Math.ceil(');

    // Security check: only allow numbers, math operators, parens, Math methods, and spaces
    if (/[^0-9+\-*/().,Mathminmaxroundfloorceil\s]/.test(sanitized)) {
      return { result: 0, error: 'Formula contains unsupported characters or unresolved variables' };
    }

    // Evaluate safe expression
    // eslint-disable-next-line no-new-func
    const evalFn = new Function(`return (${sanitized});`);
    const val = Number(evalFn());

    if (isNaN(val) || !isFinite(val)) {
      return { result: 0, error: 'Formula evaluated to invalid number (NaN or Infinity)' };
    }

    return { result: Math.round(val * 100) / 100 };
  } catch (err: any) {
    return { result: 0, error: err.message || 'Syntax error in formula' };
  }
}

/**
 * Calculates a complete salary structure breakdown for a given Annual CTC
 * and a list of template items.
 */
export function calculateSalaryBreakdown({
  annualCtc,
  templateItems,
  ptState = 'MH',
  restrictPfToCeiling = true,
}: {
  annualCtc: number;
  templateItems: any[];
  ptState?: string;
  restrictPfToCeiling?: boolean;
}) {
  if (!annualCtc || annualCtc <= 0) {
    return {
      annualCtc: 0,
      monthlyCtc: 0,
      grossEarnings: 0,
      annualGross: 0,
      employeeDeductions: 0,
      totalDeductions: 0,
      annualDeductions: 0,
      netTakeHome: 0,
      annualNet: 0,
      employerCost: 0,
      employerContributions: 0,
      items: (templateItems || []).map((item) => ({
        id: item.componentId || item.id,
        componentId: item.componentId || item.id,
        componentCode: item.componentCode,
        componentName: item.componentName,
        type: item.type,
        category: item.category || 'General',
        calculationType: item.calculationType,
        calculationValue: item.calculationValue,
        monthlyAmount: 0,
        annualAmount: 0,
        isBalancing: !!item.isBalancing,
      })),
      compliance: {
        is50PercentWageRuleCompliant: true,
        actualWagePercentage: 50,
        wageRuleRatio: 50,
        isMinimumWageCompliant: true,
        isBalancingNegative: false,
        balancingAmount: 0,
      },
    };
  }

  const monthlyCtc = Math.round(annualCtc / 12);
  let basicMonthly = 0;
  let daMonthly = 0;

  // First pass: identify BASIC and DA
  const basicItem = templateItems.find(
    (item) => item.componentCode === 'BASIC' || item.componentName?.toLowerCase().includes('basic')
  );
  if (basicItem) {
    if (basicItem.calculationType === 'PERCENTAGE' && basicItem.calculationBase === 'CTC') {
      basicMonthly = Math.round((monthlyCtc * (basicItem.calculationValue || 50)) / 100);
    } else if (basicItem.calculationType === 'FIXED') {
      basicMonthly = basicItem.monthlyAmount || Math.round(monthlyCtc * 0.5);
    } else {
      basicMonthly = Math.round(monthlyCtc * 0.5);
    }
  } else {
    basicMonthly = Math.round(monthlyCtc * 0.5); // Fallback standard 50%
  }

  const daItem = templateItems.find((item) => item.componentCode === 'DA');
  if (daItem) {
    if (daItem.calculationType === 'PERCENTAGE') {
      daMonthly = Math.round((basicMonthly * (daItem.calculationValue || 10)) / 100);
    } else {
      daMonthly = daItem.monthlyAmount || 0;
    }
  }

  const context: ComponentCalculationContext = {
    ctc: monthlyCtc,
    annual_ctc: annualCtc,
    basic: basicMonthly,
    da: daMonthly,
  };

  const calculatedItems: Array<{
    id?: string;
    componentId: string;
    componentCode: string;
    componentName: string;
    type: 'EARNING' | 'DEDUCTION' | 'EMPLOYER_CONTRIBUTION' | 'REIMBURSEMENT';
    category: string;
    calculationType: string;
    calculationValue?: number;
    monthlyAmount: number;
    annualAmount: number;
    isBalancing?: boolean;
  }> = [];

  let totalNonBalancingEarnings = 0;
  let totalEmployerCost = 0;
  let balancingItem: any = null;

  // Second pass: Calculate non-balancing items
  for (const item of templateItems) {
    if (
      item.isBalancing ||
      item.calculationType === 'BALANCING' ||
      item.componentCode === 'SPECIAL_ALLOW' ||
      item.componentCode === 'SPECIAL'
    ) {
      balancingItem = item;
      continue;
    }

    let monthly = 0;

    if (item.componentCode === 'BASIC') {
      monthly = basicMonthly;
    } else if (item.componentCode === 'DA') {
      monthly = daMonthly;
    } else if (item.calculationType === 'PERCENTAGE') {
      const baseVal =
        item.calculationBase === 'BASIC'
          ? basicMonthly
          : item.calculationBase === 'BASIC_DA'
            ? basicMonthly + daMonthly
            : item.calculationBase === 'CTC'
              ? monthlyCtc
              : basicMonthly;
      monthly = Math.round((baseVal * (item.calculationValue || 0)) / 100);
    } else if (item.calculationType === 'FORMULA' && item.formula) {
      const evalRes = evaluateFormula(item.formula, context);
      monthly = Math.round(evalRes.result);
      monthly = Number(item.calculationValue ?? item.monthlyAmount ?? 0);
    } else if (item.componentCode === 'PF_EE' || item.componentCode === 'PF') {
      // Dynamic statutory settings or defaults
      let pfCeiling = 15000;
      let pfEeRate = 0.12;
      let isPfActive = true;
      let restrictCeiling = restrictPfToCeiling;
      try {
        const savedStat = localStorage.getItem('company_statutory_settings');
        if (savedStat) {
          const parsed = JSON.parse(savedStat);
          if (parsed?.pf) {
            pfCeiling = Number(parsed.pf.wageCeiling) || 15000;
            pfEeRate = (Number(parsed.pf.employeeRate) || 12) / 100;
            isPfActive = parsed.pf.enabled !== false;
            if (parsed.pf.restrictToWageCeiling !== undefined) {
              restrictCeiling = Boolean(parsed.pf.restrictToWageCeiling);
            }
          }
        }
      } catch {}

      if (!isPfActive) {
        monthly = 0;
      } else {
        const pfWage = basicMonthly + daMonthly;
        const effectiveWage = restrictCeiling ? Math.min(pfWage, pfCeiling) : pfWage;
        monthly = Math.round(effectiveWage * pfEeRate);
      }
    } else if (item.componentCode === 'PF_ER') {
      // Employer PF (3.67% EPF + 8.33% EPS = 12%)
      let pfCeiling = 15000;
      let pfErRate = 0.12;
      let isPfActive = true;
      let restrictCeiling = restrictPfToCeiling;
      try {
        const savedStat = localStorage.getItem('company_statutory_settings');
        if (savedStat) {
          const parsed = JSON.parse(savedStat);
          if (parsed?.pf) {
            pfCeiling = Number(parsed.pf.wageCeiling) || 15000;
            const epf = Number(parsed.pf.employerEpfRate) || 3.67;
            const eps = Number(parsed.pf.employerEpsRate) || 8.33;
            pfErRate = (epf + eps) / 100;
            isPfActive = parsed.pf.enabled !== false;
            if (parsed.pf.restrictToWageCeiling !== undefined) {
              restrictCeiling = Boolean(parsed.pf.restrictToWageCeiling);
            }
          }
        }
      } catch {}

      if (!isPfActive) {
        monthly = 0;
      } else {
        const pfWage = basicMonthly + daMonthly;
        const effectiveWage = restrictCeiling ? Math.min(pfWage, pfCeiling) : pfWage;
        monthly = Math.round(effectiveWage * pfErRate);
      }
    } else if (item.componentCode === 'ESI_EE' || item.componentCode === 'ESI') {
      monthly = 0; // Updated in third pass once gross is estimated
    } else if (item.componentCode === 'ESI_ER') {
      monthly = 0;
    } else if (item.componentCode === 'PT' || item.componentCode === 'PROF_TAX') {
      monthly = Number(item.calculationValue || 200);
    } else if (item.componentCode === 'GRATUITY') {
      monthly = Math.round((basicMonthly * 15) / 26 / 12);
    } else {
      monthly = Number(item.calculationValue || item.monthlyAmount || 0);
    }

    if (item.type === 'EARNING') {
      totalNonBalancingEarnings += monthly;
    } else if (item.type === 'EMPLOYER_CONTRIBUTION') {
      totalEmployerCost += monthly;
    }

    context[item.componentCode?.toLowerCase()] = monthly;

    calculatedItems.push({
      id: item.id,
      componentId: item.componentId || item.id,
      componentCode: item.componentCode,
      componentName: item.componentName,
      type: item.type,
      category: item.category || 'General',
      calculationType: item.calculationType,
      calculationValue: item.calculationValue,
      monthlyAmount: monthly,
      annualAmount: monthly * 12,
    });
  }

  // Third pass: Balancing Figure (e.g. Special Allowance)
  // Monthly CTC = Gross Earnings + Employer Contributions
  // Balancing Earnings = Monthly CTC - totalNonBalancingEarnings - totalEmployerCost
  const residualEarning = Math.max(0, monthlyCtc - totalNonBalancingEarnings - totalEmployerCost);

  if (balancingItem) {
    calculatedItems.push({
      id: balancingItem.id,
      componentId: balancingItem.componentId || balancingItem.id,
      componentCode: balancingItem.componentCode || 'SPECIAL_ALLOW',
      componentName: balancingItem.componentName || 'Special Allowance',
      type: 'EARNING',
      category: 'Balancing Allowance',
      calculationType: 'BALANCING',
      monthlyAmount: residualEarning,
      annualAmount: residualEarning * 12,
      isBalancing: true,
    });
  }

  // Calculate Gross Earnings
  const grossEarnings = calculatedItems
    .filter((i) => i.type === 'EARNING')
    .reduce((sum, i) => sum + i.monthlyAmount, 0);

  // Re-check ESIC applicability (Gross <= 21,000)
  for (const item of calculatedItems) {
    if (item.componentCode === 'ESI_EE' || item.componentCode === 'ESI') {
      item.monthlyAmount = grossEarnings <= 21000 ? Math.round(grossEarnings * 0.0075) : 0;
      item.annualAmount = item.monthlyAmount * 12;
    } else if (item.componentCode === 'ESI_ER') {
      item.monthlyAmount = grossEarnings <= 21000 ? Math.round(grossEarnings * 0.0325) : 0;
      item.annualAmount = item.monthlyAmount * 12;
    }
  }

  // Employee Deductions total
  const employeeDeductions = calculatedItems
    .filter((i) => i.type === 'DEDUCTION')
    .reduce((sum, i) => sum + i.monthlyAmount, 0);

  // Net Pay = Gross Earnings - Employee Deductions
  const netTakeHome = Math.max(0, grossEarnings - employeeDeductions);

  // Indian Labour Code 50% Rule: (Basic + DA) / Gross >= 50%
  const wageRuleRatio = grossEarnings > 0 ? (basicMonthly + daMonthly) / grossEarnings : 1;
  const is50PercentWageRuleCompliant = wageRuleRatio >= 0.5;

  // Balancing Negative Check
  const isBalancingNegative = monthlyCtc - totalNonBalancingEarnings - totalEmployerCost < 0;

  return {
    annualCtc,
    monthlyCtc,
    grossEarnings,
    annualGross: grossEarnings * 12,
    employeeDeductions,
    totalDeductions: employeeDeductions,
    annualDeductions: employeeDeductions * 12,
    netTakeHome,
    annualNet: netTakeHome * 12,
    employerCost: totalEmployerCost,
    employerContributions: totalEmployerCost,
    items: calculatedItems,
    compliance: {
      is50PercentWageRuleCompliant,
      wageRuleRatio: Math.round(wageRuleRatio * 100),
      isBalancingNegative,
      balancingAmount: residualEarning,
    },
  };
}

/**
 * Solves backwards for Annual CTC given a target Net Monthly Take-Home Pay.
 * Uses binary search / iterative convergence.
 */
export function reverseCalculateCtcFromNet({
  targetMonthlyNet,
  templateItems,
  ptState = 'MH',
}: {
  targetMonthlyNet: number;
  templateItems: any[];
  ptState?: string;
}): { annualCtc: number; monthlyCtc: number; breakdown: any } {
  if (targetMonthlyNet <= 0) {
    const emptyBreakdown = calculateSalaryBreakdown({ annualCtc: 0, templateItems, ptState });
    return { annualCtc: 0, monthlyCtc: 0, breakdown: emptyBreakdown };
  }

  let low = targetMonthlyNet * 12;
  let high = targetMonthlyNet * 12 * 2.5; // Upper bound accounting for taxes and deductions
  let bestCtc = low;
  let bestDiff = Infinity;
  let bestBreakdown: any = null;

  for (let i = 0; i < 25; i++) {
    const mid = (low + high) / 2;
    const breakdown = calculateSalaryBreakdown({ annualCtc: mid, templateItems, ptState });
    const diff = breakdown.netTakeHome - targetMonthlyNet;

    if (Math.abs(diff) < Math.abs(bestDiff)) {
      bestDiff = diff;
      bestCtc = mid;
      bestBreakdown = breakdown;
    }

    if (Math.abs(diff) <= 1) break; // Close enough to 1 rupee

    if (diff < 0) {
      low = mid;
    } else {
      high = mid;
    }
  }

  const roundedAnnualCtc = Math.round(bestCtc / 100) * 100;
  const finalBreakdown = calculateSalaryBreakdown({ annualCtc: roundedAnnualCtc, templateItems, ptState });

  return {
    annualCtc: roundedAnnualCtc,
    monthlyCtc: Math.round(roundedAnnualCtc / 12),
    breakdown: finalBreakdown,
  };
}
