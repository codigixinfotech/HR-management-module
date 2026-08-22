import React, { useState, useEffect, useRef } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Clock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DualColumnTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const HOURS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const PERIODS = ['AM', 'PM'];

export function parseTimeString(timeStr: string) {
  if (!timeStr || timeStr === '—') {
    return { hour: '09', minute: '00', period: 'AM' };
  }

  try {
    const isPm = timeStr.toUpperCase().includes('PM');
    const isAm = timeStr.toUpperCase().includes('AM');
    const clean = timeStr.replace(/(AM|PM)/i, '').trim();
    const parts = clean.split(':').map(Number);

    let h = parts[0];
    const m = isNaN(parts[1]) ? 0 : parts[1];

    if (isNaN(h)) h = 9;

    let period = 'AM';
    if (isPm) {
      period = 'PM';
    } else if (isAm) {
      period = 'AM';
    } else if (h >= 12) {
      period = 'PM';
    }

    let displayH = h % 12;
    if (displayH === 0) displayH = 12;

    const validM = Math.min(59, Math.max(0, m));
    const hourStr = String(displayH).padStart(2, '0');
    const minStr = String(validM).padStart(2, '0');

    return { hour: hourStr, minute: minStr, period };
  } catch {
    return { hour: '09', minute: '00', period: 'AM' };
  }
}

export function DualColumnTimePicker({
  value,
  onChange,
  placeholder = 'Select Time',
  className = '',
  disabled = false,
}: DualColumnTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const parsed = parseTimeString(value);

  const [selectedHour, setSelectedHour] = useState(parsed.hour);
  const [selectedMinute, setSelectedMinute] = useState(parsed.minute);
  const [selectedPeriod, setSelectedPeriod] = useState(parsed.period);

  const minuteContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = parseTimeString(value);
    setSelectedHour(p.hour);
    setSelectedMinute(p.minute);
    setSelectedPeriod(p.period);
  }, [value]);

  useEffect(() => {
    if (isOpen && minuteContainerRef.current) {
      const selectedBtn = minuteContainerRef.current.querySelector('[data-selected="true"]');
      if (selectedBtn) {
        selectedBtn.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [isOpen]);

  const handleSelectHour = (h: string) => {
    setSelectedHour(h);
    const newTime = `${h}:${selectedMinute} ${selectedPeriod}`;
    onChange(newTime);
  };

  const handleSelectMinute = (m: string) => {
    setSelectedMinute(m);
    const newTime = `${selectedHour}:${m} ${selectedPeriod}`;
    onChange(newTime);
  };

  const handleSelectPeriod = (p: string) => {
    setSelectedPeriod(p);
    const newTime = `${selectedHour}:${selectedMinute} ${p}`;
    onChange(newTime);
  };

  const displayTime = value && value !== '—' ? value : '—';

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'h-9 w-full justify-start text-left font-mono text-xs font-semibold px-3 gap-2 border-input bg-background hover:bg-accent/50',
            className
          )}
        >
          <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>{displayTime !== '—' ? displayTime : placeholder}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-auto p-2 bg-popover border border-border shadow-md rounded-xl" align="start">
        <div className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground pb-2 border-b border-border/60 px-2 justify-between">
          <span className="w-16 text-center">Hour</span>
          <span className="w-16 text-center">Minute</span>
          <span className="w-14 text-center">Period</span>
        </div>

        <div className="flex h-56 gap-1 pt-1">
          {/* Hour Column */}
          <div className="w-16 overflow-y-auto pr-1 space-y-0.5 scrollbar-thin">
            {HOURS.map((h) => {
              const isSelected = selectedHour === h;
              return (
                <button
                  key={`h-${h}`}
                  type="button"
                  onClick={() => handleSelectHour(h)}
                  className={cn(
                    'w-full text-center py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer',
                    isSelected
                      ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                      : 'hover:bg-accent text-foreground'
                  )}
                >
                  {h}
                  {isSelected && <Check className="h-3 w-3 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="w-[1px] bg-border/60 h-full" />

          {/* Minute Column (00 to 59 1-minute increments) */}
          <div ref={minuteContainerRef} className="w-16 overflow-y-auto pr-1 space-y-0.5 scrollbar-thin">
            {MINUTES.map((m) => {
              const isSelected = selectedMinute === m;
              return (
                <button
                  key={`m-${m}`}
                  type="button"
                  data-selected={isSelected}
                  onClick={() => handleSelectMinute(m)}
                  className={cn(
                    'w-full text-center py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer',
                    isSelected
                      ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                      : 'hover:bg-accent text-foreground'
                  )}
                >
                  {m}
                  {isSelected && <Check className="h-3 w-3 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="w-[1px] bg-border/60 h-full" />

          {/* Period Column */}
          <div className="w-14 space-y-1 pt-1">
            {PERIODS.map((p) => {
              const isSelected = selectedPeriod === p;
              return (
                <button
                  key={`p-${p}`}
                  type="button"
                  onClick={() => handleSelectPeriod(p)}
                  className={cn(
                    'w-full text-center py-2 rounded-lg text-xs font-mono font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer',
                    isSelected
                      ? 'bg-purple-600 text-white font-bold shadow-xs'
                      : 'hover:bg-accent text-foreground'
                  )}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
