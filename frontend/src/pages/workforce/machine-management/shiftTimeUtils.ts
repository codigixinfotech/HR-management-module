/**
 * Universal Shift Time & Cross-Midnight Calculation Utility
 * Standardizes 24-hour time handling, duration calculation, and user-friendly 12-hour AM/PM displays.
 */

/**
 * Normalizes any time string (e.g. "07:00", "07:00:00", "07:00 AM", "3:00 PM", "15:00", "23:00")
 * into total minutes from midnight (0..1439).
 */
export function parseTimeToMinutes(timeStr?: string | null): number {
  if (!timeStr) return 0;
  const str = String(timeStr).trim();

  // 12-hour AM/PM regex: e.g. "07:00 AM", "3:00 PM", "11:00 PM"
  const ampmMatch = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (ampmMatch && ampmMatch[3]) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = parseInt(ampmMatch[2], 10);
    const period = ampmMatch[3].toUpperCase();

    if (period === 'PM' && hours < 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    return hours * 60 + minutes;
  }

  // 24-hour time format: e.g. "07:00", "15:00", "23:00:00"
  const parts = str.split(':');
  if (parts.length >= 2) {
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours * 60 + minutes;
  }

  return 0;
}

/**
 * Normalizes time string to standard 24-hour format: "HH:mm" (e.g. "07:00", "15:00", "23:00").
 */
export function formatTime24(timeStr?: string | null): string {
  if (!timeStr) return '00:00';
  const totalMin = parseTimeToMinutes(timeStr);
  const h = Math.floor(totalMin / 60) % 24;
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Formats time string to user-friendly 12-hour AM/PM format (e.g. "07:00 AM", "03:00 PM", "11:00 PM").
 */
export function formatTime12(timeStr?: string | null): string {
  if (!timeStr) return '';
  const totalMin = parseTimeToMinutes(timeStr);
  const h = Math.floor(totalMin / 60) % 24;
  const m = totalMin % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

/**
 * Detects whether a shift crosses midnight (+1 day)
 * e.g. 23:00 -> 07:00 returns true.
 * e.g. 15:00 -> 23:00 returns false.
 */
export function isCrossMidnight(startTime?: string | null, endTime?: string | null): boolean {
  if (!startTime || !endTime) return false;
  const startMin = parseTimeToMinutes(startTime);
  const endMin = parseTimeToMinutes(endTime);
  return endMin <= startMin;
}

/**
 * Calculates accurate gross working duration in hours between start time and end time.
 * If shift crosses midnight (end <= start), accurately calculates across 24h boundary (+1440 min).
 * Example:
 *  - 07:00 to 15:00 -> 8.0 hrs
 *  - 15:00 to 23:00 -> 8.0 hrs
 *  - 23:00 to 07:00 -> 8.0 hrs (Crosses midnight: (420 - 1380 + 1440) / 60 = 8 hrs)
 */
export function calculateShiftDurationHours(
  startTime?: string | null,
  endTime?: string | null,
  fallbackHours = 8
): number {
  if (!startTime || !endTime) return fallbackHours;
  const startMin = parseTimeToMinutes(startTime);
  const endMin = parseTimeToMinutes(endTime);

  let diffMin = endMin - startMin;
  if (diffMin <= 0) {
    diffMin += 24 * 60; // Add 24 hours (1440 minutes) for cross-midnight (+1 day)
  }

  const hours = diffMin / 60;
  // Round cleanly (e.g. 8.0, 7.5)
  return Math.round(hours * 10) / 10;
}

/**
 * Returns formatted dual-format timing label:
 * e.g. "07:00 – 15:00 (07:00 AM – 03:00 PM)"
 */
export function formatShiftTimingLabel(startTime?: string | null, endTime?: string | null): string {
  if (!startTime || !endTime) return '';
  const t24 = `${formatTime24(startTime)} – ${formatTime24(endTime)}`;
  const t12 = `${formatTime12(startTime)} – ${formatTime12(endTime)}`;
  return `${t24} (${t12})`;
}

/**
 * Consistent naming standardizer
 */
export function normalizeShiftName(rawName?: string | null): string {
  if (!rawName) return 'Standard Shift';
  const trimmed = rawName.trim();
  const lower = trimmed.toLowerCase();
  if (lower === 'morning' || lower === 'morning shift') return 'Morning Shift';
  if (lower === 'evening' || lower === 'evening shift') return 'Evening Shift';
  if (lower === 'night' || lower === 'night shift') return 'Night Shift';
  if (lower === 'general' || lower === 'general shift') return 'General Shift';
  return trimmed;
}
