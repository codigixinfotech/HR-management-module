import type { SalaryCycleConfig } from './types';

export const DEFAULT_COMPANY_CYCLE_CONFIG: SalaryCycleConfig = {
  startDay: 26,
  startMonthOffset: 'PREVIOUS_MONTH',
  endDay: 25,
  payDay: 0, // 0 denotes 'Last Day of Month'
  payMonthOffset: 'SAME_MONTH',
};

export function getCompanyCycleConfig(): SalaryCycleConfig {
  try {
    const saved = localStorage.getItem('ehcm_company_salary_cycle_v2');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    // fallback
  }
  return DEFAULT_COMPANY_CYCLE_CONFIG;
}

export function saveCompanyCycleConfig(config: SalaryCycleConfig) {
  try {
    localStorage.setItem('ehcm_company_salary_cycle_v2', JSON.stringify(config));
  } catch (e) {
    // ignore
  }
}

export function getDayOrdinal(day: number): string {
  if (day === 0) return 'Last Day of Month';
  const j = day % 10;
  const k = day % 100;
  if (j === 1 && k !== 11) return `${day}st`;
  if (j === 2 && k !== 12) return `${day}nd`;
  if (j === 3 && k !== 13) return `${day}rd`;
  return `${day}th`;
}

export function computeCycleDates(
  month: number,
  year: number,
  config: SalaryCycleConfig = getCompanyCycleConfig(),
  manualStart?: string,
  manualEnd?: string,
  manualPayDate?: string
) {
  if (manualStart && manualEnd) {
    const s = new Date(manualStart);
    const e = new Date(manualEnd);
    const diff = Math.abs(e.getTime() - s.getTime());
    const totalDays = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
    return {
      startDate: manualStart,
      endDate: manualEnd,
      payDate: manualPayDate || manualEnd,
      totalDays,
      formattedCycle: `${formatPrettyDate(manualStart)} to ${formatPrettyDate(manualEnd)}`,
    };
  }

  const pad = (n: number) => String(n).padStart(2, '0');

  // 1. Calculate Start Date
  let startYear = year;
  let startMonth = month;
  if (config.startMonthOffset === 'PREVIOUS_MONTH') {
    if (month === 1) {
      startMonth = 12;
      startYear = year - 1;
    } else {
      startMonth = month - 1;
    }
  }
  const maxStartDays = new Date(startYear, startMonth, 0).getDate();
  const actualStartDay = Math.min(config.startDay || 1, maxStartDays);
  const startDate = `${startYear}-${pad(startMonth)}-${pad(actualStartDay)}`;

  // 2. Calculate End Date
  const maxEndDays = new Date(year, month, 0).getDate();
  const actualEndDay = config.endDay === 0 ? maxEndDays : Math.min(config.endDay, maxEndDays);
  const endDate = `${year}-${pad(month)}-${pad(actualEndDay)}`;

  // 3. Calculate Pay Date
  let payYear = year;
  let payMonth = month;
  if (config.payMonthOffset === 'NEXT_MONTH') {
    if (month === 12) {
      payMonth = 1;
      payYear = year + 1;
    } else {
      payMonth = month + 1;
    }
  }
  const maxPayDays = new Date(payYear, payMonth, 0).getDate();
  const actualPayDay = config.payDay === 0 ? maxPayDays : Math.min(config.payDay, maxPayDays);
  const payDate = `${payYear}-${pad(payMonth)}-${pad(actualPayDay)}`;

  let totalDays = 30;
  if (startDate && endDate) {
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diff = Math.abs(e.getTime() - s.getTime());
    totalDays = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  }

  return {
    startDate,
    endDate,
    payDate,
    totalDays,
    formattedCycle: `${formatPrettyDate(startDate)} to ${formatPrettyDate(endDate)}`,
  };
}

export function formatPrettyDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}
