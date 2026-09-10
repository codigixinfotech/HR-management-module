import { useState, useMemo, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Clock,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Moon,
  Sun,
  Trash2,
  Pencil,
  Check,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { isManagerOrHrOrAdmin } from '@/lib/modules';
import { useShiftRosterStore } from './shiftRosterStore';
import type { ShiftMasterItem, ShiftRuleConfig } from './shiftRosterStore';

// --- Time formatting & conversion helpers ---
function time12To24(timeStr?: string): string {
  if (!timeStr) return '';
  const trimmed = timeStr.trim();
  if (/^\d{2}:\d{2}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return '';
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = match[3]?.toUpperCase();
  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

function time24To12(time24?: string): string {
  if (!time24) return '';
  const trimmed = time24.trim();
  if (/AM|PM/i.test(trimmed)) return trimmed;
  const parts = trimmed.split(':');
  if (parts.length < 2) return trimmed;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1].slice(0, 2);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
}

function parseTimeToMinutes(t?: string): number | null {
  if (!t) return null;
  const match = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3]?.toUpperCase();
  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function calculateWorkingHours(
  start24: string,
  end24: string,
  breakMin: number,
  isCrossMidnight: boolean
): number | null {
  const startMin = parseTimeToMinutes(start24);
  const endMin = parseTimeToMinutes(end24);
  if (startMin === null || endMin === null) return null;

  let diffMinutes = 0;
  // Use ONLY the explicit isCrossMidnight flag — never auto-infer from time values
  if (isCrossMidnight) {
    diffMinutes = 24 * 60 - startMin + endMin;
  } else {
    diffMinutes = Math.max(0, endMin - startMin);
  }

  const netMinutes = Math.max(0, diffMinutes - (Number(breakMin) || 0));
  return Math.round((netMinutes / 60) * 10) / 10;
}

// --- Custom 12-hour AM/PM 3-Column Time Picker (Hour | Minute | Period) ---
interface TimePicker12hProps {
  value: string; // 24h format "HH:MM" or ""
  onChange: (val24: string) => void; // always emits 24h format "HH:MM"
  placeholder?: string;
  disabled?: boolean;
}

const HOURS_LIST = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
const MINUTES_LIST = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const QUICK_MINUTES = ['00', '15', '30', '45'];

function TimePicker12h({ value, onChange, placeholder = 'Select time', disabled = false }: TimePicker12hProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hourContainerRef = useRef<HTMLDivElement>(null);
  const minuteContainerRef = useRef<HTMLDivElement>(null);

  const parsed = useMemo(() => {
    if (!value) return { hour: '09', minute: '00', period: 'AM' as 'AM' | 'PM' };
    const parts = value.split(':');
    let h24 = parseInt(parts[0] || '9', 10);
    const m = (parts[1] || '00').slice(0, 2).padStart(2, '0');
    const period: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM';
    let h = h24 % 12;
    if (h === 0) h = 12;
    return { hour: h.toString().padStart(2, '0'), minute: m, period };
  }, [value]);

  const [selectedHour, setSelectedHour] = useState(parsed.hour);
  const [selectedMinute, setSelectedMinute] = useState(parsed.minute);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>(parsed.period);

  useEffect(() => {
    setSelectedHour(parsed.hour);
    setSelectedMinute(parsed.minute);
    setSelectedPeriod(parsed.period);
  }, [parsed]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (hourContainerRef.current) {
          const selectedH = hourContainerRef.current.querySelector('[data-selected="true"]');
          if (selectedH) selectedH.scrollIntoView({ block: 'nearest' });
        }
        if (minuteContainerRef.current) {
          const selectedM = minuteContainerRef.current.querySelector('[data-selected="true"]');
          if (selectedM) selectedM.scrollIntoView({ block: 'nearest' });
        }
      }, 50);
    }
  }, [isOpen]);

  const emitChange = (h: string, m: string, p: 'AM' | 'PM') => {
    let h24 = parseInt(h, 10);
    if (p === 'PM' && h24 < 12) h24 += 12;
    if (p === 'AM' && h24 === 12) h24 = 0;
    const time24 = `${h24.toString().padStart(2, '0')}:${m.padStart(2, '0')}`;
    onChange(time24);
  };

  const handleSelectHour = (h: string) => {
    setSelectedHour(h);
    emitChange(h, selectedMinute, selectedPeriod);
  };

  const handleSelectMinute = (m: string) => {
    setSelectedMinute(m);
    emitChange(selectedHour, m, selectedPeriod);
  };

  const handleSelectPeriod = (p: 'AM' | 'PM') => {
    setSelectedPeriod(p);
    emitChange(selectedHour, selectedMinute, p);
  };

  const formattedDisplay = value ? time24To12(value) : '';

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'h-8 w-full justify-between text-left font-mono text-xs px-2.5 bg-background border-input hover:bg-accent/40 focus:ring-2 focus:ring-ring focus:ring-offset-0 transition-colors',
            !value && 'text-muted-foreground font-normal'
          )}
        >
          <div className="flex items-center gap-1.5 truncate">
            <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className={cn(value ? 'font-semibold text-foreground' : '')}>
              {formattedDisplay || placeholder}
            </span>
          </div>
          <span className="text-[9px] text-muted-foreground font-sans">▼</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="z-[100] w-auto p-3 bg-popover border border-border shadow-2xl rounded-xl"
        align="start"
      >
        {/* Header: Hour | Minute | Period */}
        <div className="flex items-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/70 justify-between px-1">
          <span className="w-16 text-center">Hour</span>
          <span className="w-16 text-center">Minute</span>
          <span className="w-16 text-center">Period</span>
        </div>

        {/* 3-Column Selectors */}
        <div className="flex h-52 gap-1.5 pt-2">
          {/* Column 1: Hour (01 - 12) */}
          <div ref={hourContainerRef} className="w-16 overflow-y-auto pr-1 space-y-1">
            {HOURS_LIST.map((h) => {
              const isSelected = selectedHour === h;
              return (
                <button
                  key={`hour-${h}`}
                  type="button"
                  data-selected={isSelected}
                  onClick={() => handleSelectHour(h)}
                  className={cn(
                    'w-full text-center py-1.5 px-2 rounded-md text-xs font-mono font-medium transition-colors flex items-center justify-between cursor-pointer',
                    isSelected
                      ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                      : 'hover:bg-accent text-foreground'
                  )}
                >
                  <span>{h}</span>
                  {isSelected && <Check className="h-3 w-3 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="w-px bg-border/60 h-full" />

          {/* Column 2: Minute (00 - 59 with quick highlights) */}
          <div ref={minuteContainerRef} className="w-16 overflow-y-auto pr-1 space-y-1">
            {MINUTES_LIST.map((m) => {
              const isSelected = selectedMinute === m;
              const isQuarter = QUICK_MINUTES.includes(m);
              return (
                <button
                  key={`min-${m}`}
                  type="button"
                  data-selected={isSelected}
                  onClick={() => handleSelectMinute(m)}
                  className={cn(
                    'w-full text-center py-1.5 px-2 rounded-md text-xs font-mono font-medium transition-colors flex items-center justify-between cursor-pointer',
                    isSelected
                      ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                      : isQuarter
                      ? 'hover:bg-accent font-semibold text-foreground bg-muted/40'
                      : 'hover:bg-accent text-muted-foreground'
                  )}
                >
                  <span>{m}</span>
                  {isSelected && <Check className="h-3 w-3 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="w-px bg-border/60 h-full" />

          {/* Column 3: Period (AM / PM) */}
          <div className="w-16 flex flex-col justify-start gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleSelectPeriod('AM')}
              className={cn(
                'w-full py-2.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border',
                selectedPeriod === 'AM'
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : 'hover:bg-accent text-foreground border-transparent'
              )}
            >
              <Sun className="h-3.5 w-3.5" />
              <span>AM</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPeriod('PM')}
              className={cn(
                'w-full py-2.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border',
                selectedPeriod === 'PM'
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                  : 'hover:bg-accent text-foreground border-transparent'
              )}
            >
              <Moon className="h-3.5 w-3.5" />
              <span>PM</span>
            </button>
          </div>
        </div>

        {/* Quick Minute Presets & Footer info */}
        <div className="mt-2.5 pt-2 border-t border-border/70 flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground font-medium mr-0.5">Quick:</span>
            {QUICK_MINUTES.map((qm) => (
              <button
                key={qm}
                type="button"
                onClick={() => handleSelectMinute(qm)}
                className={cn(
                  'px-1.5 py-0.5 rounded text-[10px] font-mono border transition-colors cursor-pointer',
                  selectedMinute === qm
                    ? 'bg-primary/15 border-primary/40 text-primary font-bold'
                    : 'bg-muted/60 border-border/80 text-muted-foreground hover:text-foreground'
                )}
              >
                :{qm}
              </button>
            ))}
          </div>

          <Button
            type="button"
            size="sm"
            className="h-6 px-2.5 text-[11px] font-semibold"
            onClick={() => setIsOpen(false)}
          >
            Done
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// --- Auto-generate Shift Code from Shift Name ---
function generateShiftCode(shiftName: string): string {
  const words = shiftName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  // Take first letter of each word, uppercase, max 4 chars
  return words.map((w) => w[0].toUpperCase()).join('').slice(0, 4);
}

export function ShiftMasterTab() {
  const user = useAuthStore((s) => s.user);
  const canManageShifts = isManagerOrHrOrAdmin(user);
  const { shifts, addShift, updateShift, deleteShift } = useShiftRosterStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShiftForRules, setSelectedShiftForRules] = useState<ShiftMasterItem | null>(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);

  // Tracks whether the user has manually overridden the auto-generated code
  const isCodeManuallyEdited = useRef(false);

  // Form State (empty by default on creation)
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [startTime24, setStartTime24] = useState('');
  const [endTime24, setEndTime24] = useState('');
  const [breakMinutes, setBreakMinutes] = useState<number | ''>(60);
  const [crossMidnight, setCrossMidnight] = useState(false);
  const [colorTag, setColorTag] = useState('blue');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [effectiveFrom, setEffectiveFrom] = useState('');

  // Shift Rules & Attendance Thresholds (shift-specific)
  const [lateGrace, setLateGrace] = useState(10);
  const [earlyGrace, setEarlyGrace] = useState(10);
  const [halfDayHours, setHalfDayHours] = useState(4.5);
  const [otEligible, setOtEligible] = useState(true);
  const [otStartsAfter, setOtStartsAfter] = useState(30);

  // Auto-calculated Working Hours
  const calculatedWorkingHours = useMemo(() => {
    return calculateWorkingHours(
      startTime24,
      endTime24,
      breakMinutes === '' ? 0 : breakMinutes,
      crossMidnight
    );
  }, [startTime24, endTime24, breakMinutes, crossMidnight]);

  // Auto-detect Cross Midnight: ON when end < start, OFF when end >= start
  const handleEndTimeChange = (val: string) => {
    setEndTime24(val);
    if (startTime24 && val) {
      const sMin = parseTimeToMinutes(startTime24);
      const eMin = parseTimeToMinutes(val);
      if (sMin !== null && eMin !== null) {
        setCrossMidnight(eMin < sMin);
      }
    }
  };

  const handleStartTimeChange = (val: string) => {
    setStartTime24(val);
    if (val && endTime24) {
      const sMin = parseTimeToMinutes(val);
      const eMin = parseTimeToMinutes(endTime24);
      if (sMin !== null && eMin !== null) {
        setCrossMidnight(eMin < sMin);
      }
    }
  };

  const resetForm = () => {
    setEditingShiftId(null);
    setName('');
    setCode('');
    isCodeManuallyEdited.current = false;
    setStartTime24('');
    setEndTime24('');
    setBreakMinutes(60);
    setCrossMidnight(false);
    setColorTag('blue');
    setStatus('Active');
    setEffectiveFrom(new Date().toISOString().split('T')[0]);
    setLateGrace(10);
    setEarlyGrace(10);
    setHalfDayHours(4.5);
    setOtEligible(true);
    setOtStartsAfter(30);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const handleEditShift = (shift: ShiftMasterItem) => {
    setEditingShiftId(shift.id);
    setName(shift.name);
    setCode(shift.code);
    // When editing an existing shift the code is already set — treat as manually edited
    isCodeManuallyEdited.current = true;
    setStartTime24(time12To24(shift.startTime));
    setEndTime24(time12To24(shift.endTime));
    setBreakMinutes(shift.breakMinutes ?? 60);
    setCrossMidnight(Boolean(shift.crossMidnight));
    setColorTag(shift.colorTag || 'blue');
    setStatus(shift.status || 'Active');
    setEffectiveFrom(shift.effectiveFrom || '');
    setLateGrace(shift.rules?.lateGraceMinutes ?? 10);
    setEarlyGrace(shift.rules?.earlyExitGraceMinutes ?? 10);
    setHalfDayHours(shift.rules?.halfDayThresholdHours ?? 4.5);
    setOtEligible(shift.rules?.otEligible ?? true);
    setOtStartsAfter(shift.rules?.otStartsAfterMinutes ?? 30);
    setIsCreateModalOpen(true);
  };

  const handleOpenRules = (shift: ShiftMasterItem) => {
    setSelectedShiftForRules(shift);
    setIsRulesModalOpen(true);
  };

  const handleSubmitShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !startTime24 || !endTime24) {
      toast.error('Please complete Shift Name, Code, Start Time, and End Time');
      return;
    }

    const workingHrs = calculatedWorkingHours ?? 7.5;

    const rules: ShiftRuleConfig = {
      lateGraceMinutes: Number(lateGrace),
      earlyExitGraceMinutes: Number(earlyGrace),
      halfDayThresholdHours: Number(halfDayHours),
      fullDayThresholdHours: Number(workingHrs),
      otEligible,
      otStartsAfterMinutes: Number(otStartsAfter),
    };

    if (editingShiftId) {
      await updateShift(editingShiftId, {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        startTime: startTime24,
        endTime: endTime24,
        breakMinutes: Number(breakMinutes) || 0,
        workingHours: workingHrs,
        crossMidnight,
        colorTag,
        status,
        effectiveFrom: effectiveFrom || undefined,
        rules,
      });
      toast.success(`Shift "${name} (${code.toUpperCase()})" updated successfully`);
    } else {
      await addShift({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        startTime: startTime24,
        endTime: endTime24,
        breakMinutes: Number(breakMinutes) || 0,
        workingHours: workingHrs,
        crossMidnight,
        status,
        colorTag,
        effectiveFrom: effectiveFrom || undefined,
        rules,
      });
    }

    setIsCreateModalOpen(false);
    resetForm();
  };

  const filteredShifts = shifts.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Informational Guidance Callout */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary mt-0.5">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Shift Master & Rules Engine (Create Once, Reuse Everywhere)</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Defines foundational shift timings, grace thresholds, working hours & overtime eligibility. Attendance and Face ID verify against these published rules automatically.
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs bg-background shrink-0 font-medium">
          {shifts.length} Standard Shift Definitions
        </Badge>
      </div>

      {/* Main Shift Master Registry Card */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Shift Master Catalog
            </CardTitle>
            <CardDescription className="text-xs">
              Primary shift patterns, schedule boundaries, grace margins and overtime rules
            </CardDescription>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="relative w-44 sm:w-56">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search shift or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-background"
              />
            </div>

            {/* Create Shift Dialog */}
            {canManageShifts && (
              <Dialog open={isCreateModalOpen} onOpenChange={(open) => {
                setIsCreateModalOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 text-xs gap-1.5" onClick={handleOpenCreateModal}>
                    <Plus className="h-3.5 w-3.5" /> Create Shift
                  </Button>
                </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-base font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    {editingShiftId ? `Edit Shift: ${name || 'Shift Master'}` : 'Create Shift Master & Rules'}
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Define shift schedule, time picker clock controls, midnight crossover and attendance calculation rules.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmitShift} className="space-y-4 pt-1">
                  {/* Section 1: Basic Definition */}
                  <div className="border rounded-lg p-3 bg-muted/20 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-primary" /> 1. Core Shift Parameters
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-xs">Shift Name *</Label>
                        <Input
                          placeholder="e.g. Morning Shift"
                          value={name}
                          onChange={(e) => {
                            const newName = e.target.value;
                            setName(newName);
                            // Auto-generate code only when not manually edited and not editing an existing shift
                            if (!isCodeManuallyEdited.current && !editingShiftId) {
                              setCode(generateShiftCode(newName));
                            }
                          }}
                          className="h-8 text-xs bg-background"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs flex items-center justify-between">
                          <span>Shift Code *</span>
                          {!isCodeManuallyEdited.current && !editingShiftId && code && (
                            <span className="text-[9px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                              Auto
                            </span>
                          )}
                        </Label>
                        <Input
                          placeholder="e.g. MS"
                          maxLength={4}
                          value={code}
                          onChange={(e) => {
                            isCodeManuallyEdited.current = true;
                            setCode(e.target.value);
                          }}
                          className="h-8 text-xs font-mono uppercase bg-background"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* Start Time — 12h AM/PM Picker */}
                      <div className="space-y-1">
                        <Label className="text-xs">Start Time *</Label>
                        <TimePicker12h
                          value={startTime24}
                          onChange={handleStartTimeChange}
                          required
                        />
                      </div>

                      {/* End Time — 12h AM/PM Picker */}
                      <div className="space-y-1">
                        <Label className="text-xs">End Time *</Label>
                        <TimePicker12h
                          value={endTime24}
                          onChange={handleEndTimeChange}
                          required
                        />
                      </div>

                      {/* Break (min) */}
                      <div className="space-y-1">
                        <Label className="text-xs">Break (min)</Label>
                        <Input
                          type="number"
                          min={0}
                          value={breakMinutes}
                          onChange={(e) => setBreakMinutes(e.target.value === '' ? '' : Number(e.target.value))}
                          className="h-8 text-xs font-mono bg-background"
                          placeholder="60"
                        />
                      </div>

                      {/* Working Hours (Auto-calculated) */}
                      <div className="space-y-1">
                        <Label className="text-xs flex items-center justify-between">
                          <span>Working Hours</span>
                          <span className="text-[9px] text-muted-foreground uppercase">Auto</span>
                        </Label>
                        <Input
                          type="text"
                          readOnly
                          disabled
                          value={calculatedWorkingHours !== null ? `${calculatedWorkingHours} hrs` : 'Auto calculated'}
                          className="h-8 text-xs font-mono bg-muted/60 text-foreground font-semibold cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 items-start">
                      {/* Cross Midnight Shift */}
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 pt-1.5">
                          <Switch id="cross-mid" checked={crossMidnight} onCheckedChange={setCrossMidnight} />
                          <Label htmlFor="cross-mid" className="text-xs font-medium cursor-pointer">
                            Cross Midnight Shift
                          </Label>
                        </div>
                        {crossMidnight && (
                          <p className="text-[10px] text-violet-600 dark:text-violet-400 font-medium">
                            📅 Next day: End time occurs on following day.
                          </p>
                        )}
                      </div>

                      {/* Color Pill */}
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Color Pill</Label>
                        <Select value={colorTag} onValueChange={setColorTag}>
                          <SelectTrigger className="h-8 text-xs bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="emerald" className="text-xs">Emerald</SelectItem>
                            <SelectItem value="blue" className="text-xs">Blue</SelectItem>
                            <SelectItem value="violet" className="text-xs">Violet</SelectItem>
                            <SelectItem value="indigo" className="text-xs">Indigo</SelectItem>
                            <SelectItem value="amber" className="text-xs">Amber</SelectItem>
                            <SelectItem value="rose" className="text-xs">Rose</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Status & Effective From */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Status</Label>
                          <Select value={status} onValueChange={(v: 'Active' | 'Inactive') => setStatus(v)}>
                            <SelectTrigger className="h-8 text-xs bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Active" className="text-xs font-semibold text-emerald-600">Active</SelectItem>
                              <SelectItem value="Inactive" className="text-xs text-muted-foreground">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Effective From</Label>
                          <Input
                            type="date"
                            value={effectiveFrom}
                            onChange={(e) => setEffectiveFrom(e.target.value)}
                            className="h-8 text-xs font-mono bg-background"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Shift Rules & Attendance Thresholds */}
                  <div className="border rounded-lg p-3 bg-muted/20 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <SlidersHorizontal className="h-3.5 w-3.5 text-primary" /> 2. Shift Rules & Attendance Thresholds
                    </p>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Late Grace (min)</Label>
                        <Input
                          type="number"
                          min={0}
                          value={lateGrace}
                          onChange={(e) => setLateGrace(Number(e.target.value))}
                          className="h-8 text-xs font-mono bg-background"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Early Exit Grace (min)</Label>
                        <Input
                          type="number"
                          min={0}
                          value={earlyGrace}
                          onChange={(e) => setEarlyGrace(Number(e.target.value))}
                          className="h-8 text-xs font-mono bg-background"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Half Day After (hrs)</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.5"
                          value={halfDayHours}
                          onChange={(e) => setHalfDayHours(Number(e.target.value))}
                          className="h-8 text-xs font-mono bg-background"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="p-2.5 rounded-md border bg-background flex items-center justify-between">
                        <div>
                          <Label className="text-xs font-medium">Overtime (OT) Eligible</Label>
                          <p className="text-[10px] text-muted-foreground">Enables OT calculations beyond shift end</p>
                        </div>
                        <Switch checked={otEligible} onCheckedChange={setOtEligible} />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">OT Starts After (min)</Label>
                        <Input
                          type="number"
                          min={0}
                          disabled={!otEligible}
                          value={otStartsAfter}
                          onChange={(e) => setOtStartsAfter(Number(e.target.value))}
                          className="h-8 text-xs font-mono bg-background"
                        />
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="pt-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" className="gap-1.5">
                      <Plus className="h-3.5 w-3.5" /> {editingShiftId ? 'Save Changes' : 'Save Shift Master'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5">
          {filteredShifts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-3 border border-primary/20">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">No Shift Definitions Found</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                There are no shift definitions configured for this company yet. Click &quot;Create Shift&quot; to set up your shift schedule, break durations, and automated rules.
              </p>
              {canManageShifts && (
                <Button
                  size="sm"
                  className="mt-4 h-8 text-xs gap-1.5"
                  onClick={handleOpenCreateModal}
                >
                  <Plus className="h-3.5 w-3.5" /> Create Shift
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border border-border/80 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs font-semibold w-24">Shift Code</TableHead>
                    <TableHead className="text-xs font-semibold">Shift Name</TableHead>
                    <TableHead className="text-xs font-semibold">Timings (Start - End)</TableHead>
                    <TableHead className="text-xs font-semibold">Break</TableHead>
                    <TableHead className="text-xs font-semibold">Working Hrs</TableHead>
                    <TableHead className="text-xs font-semibold">Grace (In / Out)</TableHead>
                    <TableHead className="text-xs font-semibold">OT Eligible</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-right text-xs font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShifts.map((shift) => (
                    <TableRow key={shift.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <span className="inline-flex items-center justify-center h-7 w-7 rounded-lg font-mono text-xs font-bold border border-border/80 bg-muted/60 text-foreground">
                          {shift.code}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-foreground">{shift.name}</span>
                          {shift.crossMidnight ? (
                            <Badge variant="outline" className="text-[10px] gap-1 text-violet-600 border-violet-200 bg-violet-50 dark:bg-violet-950/40">
                              <Moon className="h-2.5 w-2.5" /> Cross Midnight
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] gap-1 text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/40">
                              <Sun className="h-2.5 w-2.5" /> Day
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-medium text-foreground">
                        {time24To12(shift.startTime)} – {time24To12(shift.endTime)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {shift.breakMinutes} min
                      </TableCell>
                      <TableCell className="text-xs font-mono font-semibold text-foreground">
                        {shift.workingHours} hrs
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {shift.rules?.lateGraceMinutes ?? 10}m / {shift.rules?.earlyExitGraceMinutes ?? 10}m
                      </TableCell>
                      <TableCell>
                        {shift.rules?.otEligible ? (
                          <Badge variant="outline" className="text-[10px] font-semibold text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40">
                            Yes (+{shift.rules.otStartsAfterMinutes}m)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            No
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <Badge variant="outline" className={cn(
                            "text-[10px] font-semibold",
                            shift.status === 'Active'
                              ? "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30"
                              : "text-muted-foreground bg-muted/60 border-border"
                          )}>
                            {shift.status || 'Active'}
                          </Badge>
                          {shift.effectiveFrom && (
                            <p className="text-[10px] text-muted-foreground font-mono">
                              From: {shift.effectiveFrom}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-2.5 gap-1 text-primary hover:text-primary"
                            onClick={() => handleOpenRules(shift)}
                          >
                            <SlidersHorizontal className="h-3 w-3" /> View Rules
                          </Button>
                          {canManageShifts && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                                title="Edit Shift"
                                onClick={() => handleEditShift(shift)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                title="Delete Shift"
                                onClick={() => deleteShift(shift.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Shift Rules Modal */}
      <Dialog open={isRulesModalOpen} onOpenChange={setIsRulesModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" /> Shift Rules: {selectedShiftForRules?.name} ({selectedShiftForRules?.code})
            </DialogTitle>
            <DialogDescription className="text-xs">
              These rules are automatically consumed by the Attendance Register & Face ID Punch Engine.
            </DialogDescription>
          </DialogHeader>

          {selectedShiftForRules && (
            <div className="space-y-3 py-2">
              <div className="rounded-lg border bg-muted/30 p-3 space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-border/50">
                  <span className="text-muted-foreground font-medium">Late Grace Period:</span>
                  <span className="font-mono font-semibold text-foreground">{selectedShiftForRules.rules.lateGraceMinutes} minutes</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-border/50">
                  <span className="text-muted-foreground font-medium">Early Exit Grace:</span>
                  <span className="font-mono font-semibold text-foreground">{selectedShiftForRules.rules.earlyExitGraceMinutes} minutes</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-border/50">
                  <span className="text-muted-foreground font-medium">Half Day Threshold:</span>
                  <span className="font-mono font-semibold text-foreground">After {selectedShiftForRules.rules.halfDayThresholdHours} hrs</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-border/50">
                  <span className="text-muted-foreground font-medium">Full Day Minimum:</span>
                  <span className="font-mono font-semibold text-foreground">{selectedShiftForRules.rules.fullDayThresholdHours} hrs</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground font-medium">Overtime (OT) Eligible:</span>
                  <span className="font-semibold text-foreground">
                    {selectedShiftForRules.rules.otEligible ? `Yes (after +${selectedShiftForRules.rules.otStartsAfterMinutes} min)` : 'No'}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-[11px] text-emerald-800 dark:text-emerald-300">
                Automatic enforcement active: Daily punches calculate late arrivals, half days, and overtime in real-time according to these thresholds.
              </div>
            </div>
          )}

          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setIsRulesModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
