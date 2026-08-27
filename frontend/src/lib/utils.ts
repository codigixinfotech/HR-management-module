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
