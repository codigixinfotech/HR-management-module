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
