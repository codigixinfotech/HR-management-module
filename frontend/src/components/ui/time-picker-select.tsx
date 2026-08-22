import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock } from 'lucide-react';

export const THIRTY_MIN_INTERVALS = [
  '06:00 AM', '06:30 AM',
  '07:00 AM', '07:30 AM',
  '08:00 AM', '08:30 AM',
  '09:00 AM', '09:30 AM',
  '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM',
  '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM',
  '05:00 PM', '05:30 PM',
  '06:00 PM', '06:30 PM',
  '07:00 PM', '07:30 PM',
  '08:00 PM', '08:30 PM',
  '09:00 PM', '09:30 PM',
  '10:00 PM', '10:30 PM',
  '11:00 PM', '11:30 PM',
  '—',
] as const;

export function snapToNearest30Min(timeStr?: string | null): string {
  if (!timeStr || timeStr === '—') return '—';
  try {
    const isPm = timeStr.toUpperCase().includes('PM');
    const isAm = timeStr.toUpperCase().includes('AM');
    const clean = timeStr.replace(/(AM|PM)/i, '').trim();
    const parts = clean.split(':').map(Number);
    let hours = parts[0];
    const minutes = parts[1] || 0;
    const seconds = parts[2] || 0;

    if (isNaN(hours)) return '09:00 AM';

    if (isPm && hours < 12) hours += 12;
    if (isAm && hours === 12) hours = 0;

    const totalSecs = hours * 3600 + minutes * 60 + seconds;
    const totalMins = Math.round(totalSecs / 60);

    // Round to nearest 30 minutes
    const roundedMins = Math.round(totalMins / 30) * 30;

    let snappedHours = Math.floor(roundedMins / 60) % 24;
    let snappedMins = roundedMins % 60;
    if (snappedMins < 0) snappedMins = 0;

    const period = snappedHours >= 12 ? 'PM' : 'AM';
    let displayHours = snappedHours % 12;
    if (displayHours === 0) displayHours = 12;

    const hStr = String(displayHours).padStart(2, '0');
    const mStr = String(snappedMins).padStart(2, '0');

    return `${hStr}:${mStr} ${period}`;
  } catch {
    return '09:00 AM';
  }
}

interface TimePickerSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  iconColor?: string;
}

export function TimePickerSelect({
  value,
  onChange,
  placeholder = 'Select Time',
  className = '',
  disabled = false,
  iconColor = 'text-primary',
}: TimePickerSelectProps) {
  const currentValue = snapToNearest30Min(value);

  return (
    <Select value={currentValue} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={`h-9 text-xs font-mono font-semibold ${className}`}>
        <div className="flex items-center gap-1.5 truncate">
          <Clock className={`h-3.5 w-3.5 shrink-0 ${iconColor}`} />
          <SelectValue placeholder={placeholder} />
        </div>
      </SelectTrigger>
      <SelectContent className="max-h-56">
        {THIRTY_MIN_INTERVALS.map((t) => (
          <SelectItem key={t} value={t} className="text-xs font-mono font-semibold">
            {t}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
