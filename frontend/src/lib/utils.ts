import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getTodayDateStr(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(date);
}

export function getTodayYearAndMonth(date: Date = new Date()): { year: number; month: number } {
  const dateStr = getTodayDateStr(date);
  const [y, m] = dateStr.split('-').map(Number);
  return { year: y, month: m - 1 };
}

export function formatSalaryInLakhs(amountInRupees?: number | null): string {
  if (amountInRupees === null || amountInRupees === undefined || amountInRupees <= 0) return '₹0 Lakh';
  const lakhs = amountInRupees >= 1000 ? amountInRupees / 100000 : amountInRupees;
  const formatted = Number.isInteger(lakhs) ? lakhs.toString() : lakhs.toFixed(2).replace(/\.?0+$/, '');
  return `₹${formatted} Lakh`;
}

export function formatSalaryRangeInLakhs(minRupees?: number | null, maxRupees?: number | null): string {
  if (!minRupees && !maxRupees) return 'Not Disclosed';
  if (minRupees && !maxRupees) return `${formatSalaryInLakhs(minRupees)}+`;
  if (!minRupees && maxRupees) return `Up to ${formatSalaryInLakhs(maxRupees)}`;
  return `${formatSalaryInLakhs(minRupees)} - ${formatSalaryInLakhs(maxRupees)}`;
}

/**
 * Formats a raw INR amount (stored in full rupees) into a human-readable
 * string, automatically choosing ₹, Lakh, or Crore based on magnitude.
 *
 * Examples:
 *   25000        → "₹25,000"
 *   250000       → "₹2.50 Lakh"
 *   2500000      → "₹25 Lakh"
 *   10000000     → "₹1 Crore"
 *   280000000    → "₹28 Crore"
 *   28000000000  → "₹2,800 Crore"
 *
 * Returns null when budget is null / undefined / 0.
 */
export function formatIndianBudget(amount?: number | null): string | null {
  if (amount === undefined || amount === null || amount <= 0) return null;

  const CRORE = 10_000_000;  // 1 Crore  = ₹1,00,00,000
  const LAKH  =    100_000;  // 1 Lakh   = ₹1,00,000

  if (amount >= CRORE) {
    const val = amount / CRORE;
    const str = Number.isInteger(val) ? val.toString() : parseFloat(val.toFixed(2)).toString();
    return `₹${str} Crore`;
  }

  if (amount >= LAKH) {
    const val = amount / LAKH;
    const str = Number.isInteger(val) ? val.toString() : parseFloat(val.toFixed(2)).toString();
    return `₹${str} Lakh`;
  }

  return `₹${amount.toLocaleString('en-IN')}`;
}

