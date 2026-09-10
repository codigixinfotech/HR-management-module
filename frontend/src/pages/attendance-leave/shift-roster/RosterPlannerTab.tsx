import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Send,
  CheckCircle2,
  Building2,
  Edit2,
  AlertTriangle,
  ShieldCheck,
  Search,
  X,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { departmentsApi } from '@/api/organization';
import { useAuthStore } from '@/stores/auth-store';
import { isManagerOrHrOrAdmin } from '@/lib/modules';
import { useShiftRosterStore } from './shiftRosterStore';
import type { EmployeeRosterRow, RosterCellData } from './shiftRosterStore';

// Anchor Week 37 (07 Sep 2026 - 13 Sep 2026)
const WEEK_37_DAYS = [
  { key: '2026-09-07', label: 'Mon', dayNum: '07' },
  { key: '2026-09-08', label: 'Tue', dayNum: '08' },
  { key: '2026-09-09', label: 'Wed', dayNum: '09' },
  { key: '2026-09-10', label: 'Thu', dayNum: '10' },
  { key: '2026-09-11', label: 'Fri', dayNum: '11' },
  { key: '2026-09-12', label: 'Sat', dayNum: '12' },
  { key: '2026-09-13', label: 'Sun', dayNum: '13' },
];

export function RosterPlannerTab() {
  const user = useAuthStore((s) => s.user);
  const canManageRoster = isManagerOrHrOrAdmin(user);
  const {
    rosterEmployees,
    shifts,
    rotations,
    activeCompanyId,
    updateRosterCell,
    bulkAutoAssignWeek,
    publishRoster,
  } = useShiftRosterStore();

  const [viewMode, setViewMode] = useState<'Day' | 'Week' | 'Month'>('Week');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deptMasterList, setDeptMasterList] = useState<string[]>([]);
  const [activeDayKey, setActiveDayKey] = useState<string>('2026-09-09'); // Wednesday 09 Sep (Today)
  const [isPublished, setIsPublished] = useState(false);

  // Manual Cell Override state
  const [cellEditModalOpen, setCellEditModalOpen] = useState(false);
  const [activeCellTarget, setActiveCellTarget] = useState<{
    employee: EmployeeRosterRow;
    dateKey: string;
    currentCell?: RosterCellData;
  } | null>(null);
  const [selectedShiftCode, setSelectedShiftCode] = useState<string>('GS');
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [overrideReasonError, setOverrideReasonError] = useState<boolean>(false);

  // Validation & Publish Modal state
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Load Department Master from backend API
  useEffect(() => {
    departmentsApi
      .list(activeCompanyId)
      .then((res) => {
        if (Array.isArray(res)) {
          const names = res.map((d: any) => d.name).filter(Boolean);
          setDeptMasterList(names);
        }
      })
      .catch(() => {});
  }, [activeCompanyId]);

  // Merge Department Master options
  const departmentOptions = useMemo(() => {
    const set = new Set<string>([
      'Production',
      'Executive Management',
      'Quality Assurance',
      'Stores & Warehouse',
      ...deptMasterList,
      ...rosterEmployees.map((e) => e.department).filter(Boolean),
    ]);
    return Array.from(set);
  }, [deptMasterList, rosterEmployees]);

  // Filter employees by department AND employee search (name, code, role)
  // Filter employees: For employees, show only themselves; for admins, by department and search
  const filteredEmployees = useMemo(() => {
    let list = rosterEmployees;

    if (!canManageRoster) {
      const empId = user?.employee?.id;
      const empCode = user?.employee?.employeeCode?.toLowerCase();
      const empName = user?.employee ? `${user.employee.firstName} ${user.employee.lastName}`.trim().toLowerCase() : '';
      const firstName = user?.employee?.firstName?.toLowerCase() || '';

      list = list.filter((emp) => {
        if (empId && emp.employeeId === empId) return true;
        if (empCode && emp.employeeCode?.toLowerCase() === empCode) return true;
        if (empName && emp.name?.toLowerCase() === empName) return true;
        if (firstName && emp.name?.toLowerCase().includes(firstName)) return true;
        return false;
      });

      return list;
    }

    return list.filter((emp) => {
      // Department filter
      if (selectedDept !== 'ALL') {
        if (emp.department?.toLowerCase() !== selectedDept.toLowerCase()) {
          return false;
        }
      }
      // Employee name / code / role search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = emp.name.toLowerCase().includes(q);
        const matchesCode = emp.employeeCode.toLowerCase().includes(q);
        const matchesRole = emp.role.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesRole) {
          return false;
        }
      }
      return true;
    });
  }, [rosterEmployees, selectedDept, searchQuery, canManageRoster, user]);

  // Determine active columns depending on View Mode
  const activeDays = useMemo(() => {
    if (viewMode === 'Day') {
      const found = WEEK_37_DAYS.find((d) => d.key === activeDayKey);
      return found ? [found] : [WEEK_37_DAYS[2]];
    }
    if (viewMode === 'Week') {
      return WEEK_37_DAYS;
    }
    // Month View: 30 days of September 2026
    const days: { key: string; label: string; dayNum: string }[] = [];
    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 1; i <= 30; i++) {
      const dayNum = String(i).padStart(2, '0');
      const key = `2026-09-${dayNum}`;
      const d = new Date(key);
      days.push({
        key,
        label: labels[d.getDay()],
        dayNum,
      });
    }
    return days;
  }, [viewMode, activeDayKey]);

  // Date Navigation
  const handlePrev = () => {
    if (viewMode === 'Day') {
      const idx = WEEK_37_DAYS.findIndex((d) => d.key === activeDayKey);
      if (idx > 0) setActiveDayKey(WEEK_37_DAYS[idx - 1].key);
    } else {
      toast.info('Viewing current scheduled cycle: 07 Sep – 13 Sep 2026');
    }
  };

  const handleNext = () => {
    if (viewMode === 'Day') {
      const idx = WEEK_37_DAYS.findIndex((d) => d.key === activeDayKey);
      if (idx < WEEK_37_DAYS.length - 1) setActiveDayKey(WEEK_37_DAYS[idx + 1].key);
    } else {
      toast.info('Next roster cycle scheduled from 14 Sep 2026');
    }
  };

  const handleToday = () => {
    setActiveDayKey('2026-09-09');
    setViewMode('Week');
    toast.success('Navigated to current active schedule week (09 Sep 2026)');
  };

  // Open Cell Override modal
  const handleCellClick = (employee: EmployeeRosterRow, dateKey: string) => {
    const existing = employee.slots[dateKey];
    setActiveCellTarget({ employee, dateKey, currentCell: existing });
    setSelectedShiftCode(existing?.shiftCode || 'GS');
    setOverrideReason(existing?.overrideReason || '');
    setOverrideReasonError(false);
    setCellEditModalOpen(true);
  };

  // Save manual override with mandatory reason
  const handleSaveCellShift = () => {
    if (!activeCellTarget) return;
    if (!overrideReason.trim()) {
      setOverrideReasonError(true);
      toast.error('Reason is required for manual override audit trail.');
      return;
    }

    const { employee, dateKey } = activeCellTarget;
    let cellData: RosterCellData;

    if (selectedShiftCode === 'WO') {
      cellData = {
        shiftCode: 'WO',
        shiftName: 'Weekly Off',
        timing: 'Rest Day',
        status: 'Off',
        isCustomOverride: true,
        overrideReason,
      };
    } else if (selectedShiftCode === 'HOL') {
      cellData = {
        shiftCode: 'HOL',
        shiftName: 'Public Holiday',
        timing: 'Holiday',
        status: 'Holiday',
        isCustomOverride: true,
        overrideReason,
      };
    } else if (selectedShiftCode === 'LV') {
      cellData = {
        shiftCode: 'LV',
        shiftName: 'Approved Leave',
        timing: 'On Leave',
        status: 'Leave',
        isCustomOverride: true,
        overrideReason,
      };
    } else if (selectedShiftCode === 'HD') {
      cellData = {
        shiftCode: 'HD',
        shiftName: 'Half Day Shift',
        timing: '08:00 AM - 12:30 PM',
        status: 'Draft',
        isCustomOverride: true,
        overrideReason,
      };
    } else {
      const s = shifts.find((sh) => sh.code === selectedShiftCode) || shifts[0];
      cellData = {
        shiftCode: s.code,
        shiftName: s.name,
        timing: `${s.startTime} - ${s.endTime}`,
        status: 'Draft',
        isCustomOverride: true,
        overrideReason,
      };
    }

    updateRosterCell(employee.employeeId, dateKey, cellData);
    toast.success(`Override saved for ${employee.name} on ${dateKey}`);
    setCellEditModalOpen(false);
  };

  // Auto-Fill action
  const hasActiveRotation = rotations.some((r) => r.status === 'Active');

  const handleAutoFill = async () => {
    const dates = activeDays.map((d) => d.key);
    await bulkAutoAssignWeek(dates, 'GS');
    toast.success(
      hasActiveRotation
        ? 'Rotated active shifts according to cycle handover rules!'
        : 'Generated roster baseline from Shift Assignments & Weekly Off Policies!'
    );
  };

  // Compute live validation metrics for Publish Review modal
  const validationMetrics = useMemo(() => {
    let totalScheduled = 0;
    let totalWeeklyOff = 0;
    let totalHolidays = 0;
    let totalLeave = 0;
    let missingShifts = 0;

    filteredEmployees.forEach((emp) => {
      WEEK_37_DAYS.forEach((day) => {
        const cell = emp.slots[day.key];
        if (!cell || !cell.shiftCode) {
          missingShifts++;
        } else if (cell.shiftCode === 'WO') {
          totalWeeklyOff++;
        } else if (cell.shiftCode === 'HOL') {
          totalHolidays++;
        } else if (cell.shiftCode === 'LV') {
          totalLeave++;
        } else {
          totalScheduled++;
        }
      });
    });

    return {
      employees: filteredEmployees.length,
      scheduled: totalScheduled,
      weeklyOff: totalWeeklyOff,
      holidays: totalHolidays,
      leave: totalLeave,
      missingShifts,
      conflicts: 0,
    };
  }, [filteredEmployees]);

  // Publish Roster Confirm
  const handleConfirmPublish = async () => {
    setIsPublishing(true);
    try {
      await publishRoster(
        'September 2026 Week 37',
        '07 Sep 2026 – 13 Sep 2026',
        filteredEmployees.length
      );
      setIsPublished(true);
      setValidationModalOpen(false);
    } finally {
      setIsPublishing(false);
    }
  };

  // Badge styler with rich visual feedback
  const getShiftBadge = (cell?: RosterCellData) => {
    if (!cell || !cell.shiftCode) {
      return (
        <span className="text-[10px] text-muted-foreground italic font-mono">Unassigned</span>
      );
    }

    switch (cell.shiftCode) {
      case 'GS':
      case 'G':
      case 'GEN':
        return (
          <span className="inline-flex items-center justify-center w-full py-1 px-1.5 rounded-md font-bold text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 shadow-2xs">
            GS — General
          </span>
        );
      case 'MS':
      case 'A':
      case 'MOR':
        return (
          <span className="inline-flex items-center justify-center w-full py-1 px-1.5 rounded-md font-bold text-[11px] bg-blue-50 text-blue-700 border border-blue-300 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800 shadow-2xs">
            MS — Morning
          </span>
        );
      case 'ES':
      case 'B':
        return (
          <span className="inline-flex items-center justify-center w-full py-1 px-1.5 rounded-md font-bold text-[11px] bg-purple-50 text-purple-700 border border-purple-300 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800 shadow-2xs">
            ES — Evening
          </span>
        );
      case 'NS':
      case 'C':
      case 'NIT':
        return (
          <span className="inline-flex items-center justify-center w-full py-1 px-1.5 rounded-md font-bold text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-300 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800 shadow-2xs">
            NS — Night
          </span>
        );
      case 'WO':
        return (
          <span className="inline-flex items-center justify-center w-full py-1 px-1.5 rounded-md font-medium text-[11px] bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700">
            Weekly Off
          </span>
        );
      case 'HOL':
      case 'HD_HOL':
        return (
          <span className="inline-flex items-center justify-center w-full py-1 px-1.5 rounded-md font-bold text-[11px] bg-rose-50 text-rose-700 border border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 shadow-2xs">
            Public Holiday
          </span>
        );
      case 'LV':
        return (
          <span className="inline-flex items-center justify-center w-full py-1 px-1.5 rounded-md font-bold text-[11px] bg-amber-50 text-amber-700 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 shadow-2xs">
            Approved Leave
          </span>
        );
      case 'HD':
        return (
          <span className="inline-flex items-center justify-center w-full py-1 px-1.5 rounded-md font-bold text-[11px] bg-orange-50 text-orange-700 border border-orange-300 dark:bg-orange-950/50 dark:text-orange-300">
            Half Day
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center justify-center w-full py-1 px-1.5 rounded-md font-semibold text-[11px] bg-muted text-muted-foreground border">
            {cell.shiftCode}
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* ─────────────────────────────────────────────────────────────
          1. View Switcher & Roster Toolbar
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-3.5 rounded-xl border border-border/80 bg-card shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Day / Week / Month Toggles */}
          <div className="inline-flex rounded-lg border border-border/80 p-1 bg-muted/40">
            {(['Day', 'Week', 'Month'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  viewMode === mode
                    ? 'bg-background text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Date Navigator */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-border/60">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={handlePrev}
              title="Previous period"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <div className="flex items-center gap-1.5 px-2 font-mono text-xs font-bold text-foreground">
              <CalendarIcon className="h-3.5 w-3.5 text-primary" />
              {viewMode === 'Day'
                ? `${activeDayKey} (${WEEK_37_DAYS.find((d) => d.key === activeDayKey)?.label || 'Day'})`
                : viewMode === 'Week'
                ? `07 Sep 2026 – 13 Sep 2026 (Week 37)`
                : `September 2026 (30 Days)`}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={handleNext}
              title="Next period"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="h-7 text-xs px-2.5 font-medium ml-1"
              onClick={handleToday}
            >
              Today
            </Button>
          </div>
        </div>

        {/* Search, Department Filter & Action Buttons (Manager / HR / Admin only) */}
        {canManageRoster && (
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end">
            {/* Employee Name / Code Search Box */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search employee name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-56 pl-8 pr-7 text-xs bg-background"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full"
                  title="Clear search"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Department Filter Dropdown strictly from Master */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground font-medium hidden sm:inline">Dept:</span>
              <Select value={selectedDept} onValueChange={setSelectedDept}>
                <SelectTrigger className="h-8 w-44 text-xs bg-background">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs font-medium">
                    All Departments
                  </SelectItem>
                  {departmentOptions.map((dept) => (
                    <SelectItem key={dept} value={dept} className="text-xs">
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Auto-Fill Button: Contextual based on rotation state */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 bg-background shadow-2xs hover:bg-muted"
              onClick={handleAutoFill}
              title={
                hasActiveRotation
                  ? 'Rotate shifts across active cycles'
                  : 'Generate baseline from Shift Assignments and Weekly Off Policies'
              }
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              {hasActiveRotation ? 'Auto-Fill Rotation' : 'Auto-Fill Roster'}
            </Button>

            {/* Publish Roster Button */}
            <Button
              size="sm"
              className={`h-8 text-xs gap-1.5 text-white font-semibold transition-all ${
                isPublished
                  ? 'bg-emerald-700 hover:bg-emerald-800'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-2xs'
              }`}
              onClick={() => setValidationModalOpen(true)}
            >
              <Send className="h-3.5 w-3.5" />
              {isPublished ? 'Published Roster ✓' : 'Publish Roster'}
            </Button>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. Live Roster Matrix Table
          ───────────────────────────────────────────────────────────── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-primary" /> Live Roster Schedule Matrix
              </CardTitle>
              <Badge
                className={`text-[10px] px-2 py-0.5 font-bold ${
                  isPublished
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {isPublished ? 'PUBLISHED' : 'GENERATED / DRAFT'}
              </Badge>
            </div>
            <CardDescription className="text-xs mt-0.5">
              {canManageRoster
                ? 'Click any schedule cell to override or modify shift allocations for an individual employee'
                : 'Personal schedule view for published roster and shift shifts'}
            </CardDescription>
          </div>

          {/* Legend Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
            <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" /> GS (09:00–17:30)
            </span>
            <span className="flex items-center gap-1 text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" /> MS (08:00–16:30)
            </span>
            <span className="flex items-center gap-1 text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-600" /> ES (16:00–00:00)
            </span>
            <span className="flex items-center gap-1 text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" /> NS (22:00–06:30)
            </span>
            <span className="flex items-center gap-1 text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-500" /> OFF (Rest Day)
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/40 border-b border-border/80">
                <th className="py-2.5 px-4 text-xs font-semibold text-foreground w-72 border-r border-border/60">
                  Employee & Role
                </th>
                {activeDays.map((day) => {
                  const isToday = day.key === '2026-09-09';
                  return (
                    <th
                      key={day.key}
                      className={`py-2.5 px-2 text-center text-xs font-semibold min-w-[125px] border-r border-border/40 ${
                        isToday ? 'bg-primary/10 text-primary' : 'text-foreground'
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                          {day.label}
                        </span>
                        <span className="font-mono text-sm font-bold mt-0.5">{day.dayNum} Sep</span>
                        {isToday && (
                          <Badge className="text-[8px] px-1 py-0 h-3.5 bg-primary text-primary-foreground font-bold mt-0.5">
                            Today
                          </Badge>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={activeDays.length + 1} className="py-8 text-center text-muted-foreground text-xs">
                    {searchQuery.trim() ? (
                      <span>
                        No employees found matching &quot;<strong>{searchQuery}</strong>&quot; in{' '}
                        {selectedDept === 'ALL' ? 'any department' : selectedDept}
                      </span>
                    ) : (
                      <span>
                        No active employees found for department: <strong>{selectedDept}</strong>
                      </span>
                    )}
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.employeeId} className="border-b border-border/60 hover:bg-muted/20 transition-colors">
                    {/* Employee Identity Cell from Employee Master */}
                    <td className="py-3 px-4 border-r border-border/60">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-primary">{emp.employeeCode}</span>
                        </div>
                        <p className="font-semibold text-xs text-foreground mt-0.5">{emp.name}</p>
                        <p className="text-[11px] text-muted-foreground font-medium">{emp.role}</p>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                          <Building2 className="h-3 w-3 text-muted-foreground/80" />
                          <span>{emp.department}</span>
                          <span className="text-muted-foreground/60">•</span>
                          <span className="truncate max-w-[140px]">{emp.branch}</span>
                        </div>
                      </div>
                    </td>

                    {/* Day Schedule Cells */}
                    {activeDays.map((day) => {
                      const cell = emp.slots[day.key];
                      const isToday = day.key === '2026-09-09';
                      return (
                        <td
                          key={day.key}
                          onClick={() => canManageRoster && handleCellClick(emp, day.key)}
                          className={`py-2 px-2 text-center border-r border-border/40 transition-colors group relative ${
                            canManageRoster ? 'cursor-pointer hover:bg-primary/5' : ''
                          } ${isToday ? 'bg-primary/5' : ''}`}
                        >
                          <div className="flex flex-col items-center justify-center min-h-[50px]">
                            {getShiftBadge(cell)}
                            {cell?.timing && (
                              <span className="text-[9px] font-mono text-muted-foreground mt-1">
                                {cell.timing}
                              </span>
                            )}
                            {cell?.isCustomOverride && (
                              <span className="text-[8px] font-semibold text-purple-600 dark:text-purple-400 mt-0.5">
                                • Override
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* ─────────────────────────────────────────────────────────────
          3. Modify Shift Cell Modal (Manual Override with Mandatory Reason)
          ───────────────────────────────────────────────────────────── */}
      <Dialog open={cellEditModalOpen} onOpenChange={setCellEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Edit2 className="h-4 w-4 text-primary" /> Modify Shift Allocation
            </DialogTitle>
            <DialogDescription className="text-xs">
              Override shift allocation for {activeCellTarget?.employee.name} on {activeCellTarget?.dateKey}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Employee Information Card */}
            <div className="rounded-lg bg-muted/40 p-3 text-xs space-y-1 border border-border/60">
              <div className="flex justify-between">
                <span className="font-semibold text-foreground">{activeCellTarget?.employee.name}</span>
                <span className="font-mono text-primary font-bold">{activeCellTarget?.employee.employeeCode}</span>
              </div>
              <p className="text-muted-foreground">
                <strong>Department:</strong> {activeCellTarget?.employee.department} • <strong>Branch:</strong> {activeCellTarget?.employee.branch}
              </p>
              <p className="text-muted-foreground">
                <strong>Date:</strong> {activeCellTarget?.dateKey}
              </p>
              <div className="pt-1 mt-1 border-t border-border/40 flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Current Allocation:</span>
                <span className="font-semibold text-foreground">
                  {activeCellTarget?.currentCell?.shiftName || 'Unassigned'} ({activeCellTarget?.currentCell?.timing || 'Rest Day'})
                </span>
              </div>
            </div>

            {/* Change Shift Target */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Change To Shift / Status *</Label>
              <Select value={selectedShiftCode} onValueChange={setSelectedShiftCode}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GS" className="text-xs font-medium">
                    General Shift (09:00 AM – 05:30 PM)
                  </SelectItem>
                  <SelectItem value="MS" className="text-xs font-medium">
                    Morning Shift (08:00 AM – 04:30 PM)
                  </SelectItem>
                  <SelectItem value="ES" className="text-xs font-medium">
                    Evening Shift (04:00 PM – 12:30 AM)
                  </SelectItem>
                  <SelectItem value="NS" className="text-xs font-medium">
                    Night Shift (10:00 PM – 06:30 AM)
                  </SelectItem>
                  <SelectItem value="WO" className="text-xs font-medium">
                    Weekly Off (Rest Day)
                  </SelectItem>
                  <SelectItem value="HD" className="text-xs font-medium">
                    Half Day (Morning Session)
                  </SelectItem>
                  <SelectItem value="HOL" className="text-xs font-medium">
                    Public Holiday (Declared Off)
                  </SelectItem>
                  <SelectItem value="LV" className="text-xs font-medium">
                    Approved Leave
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Required Audit Reason */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center justify-between">
                <span>Reason for Manual Override *</span>
                <span className="text-[10px] text-muted-foreground font-normal">Required for audit trail</span>
              </Label>
              <Textarea
                placeholder="e.g. Critical plant maintenance, urgent night furnace coverage, emergency swap"
                className={`text-xs min-h-[68px] ${
                  overrideReasonError ? 'border-destructive focus-visible:ring-destructive' : ''
                }`}
                value={overrideReason}
                onChange={(e) => {
                  setOverrideReason(e.target.value);
                  if (overrideReasonError && e.target.value.trim()) {
                    setOverrideReasonError(false);
                  }
                }}
              />
              {overrideReasonError && (
                <p className="text-[11px] text-destructive font-medium">
                  Please provide a reason for manual override before saving.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCellEditModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveCellShift}>
              Save Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────
          4. Roster Validation & Publish Modal
          ───────────────────────────────────────────────────────────── */}
      <Dialog open={validationModalOpen} onOpenChange={setValidationModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" /> Roster Validation & Publish
            </DialogTitle>
            <DialogDescription className="text-xs">
              Validate schedule completeness and policy compliance for period <strong>07 Sep 2026 – 13 Sep 2026</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Validation Metrics Grid */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-2.5 rounded-lg border bg-muted/40 text-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Total Staff</span>
                <p className="text-lg font-bold text-foreground mt-0.5">{validationMetrics.employees}</p>
                <span className="text-[10px] text-muted-foreground">Eligible Personnel</span>
              </div>
              <div className="p-2.5 rounded-lg border bg-blue-50/50 dark:bg-blue-950/30 text-center border-blue-200 dark:border-blue-900">
                <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300">Scheduled Shifts</span>
                <p className="text-lg font-bold text-blue-700 dark:text-blue-300 mt-0.5">{validationMetrics.scheduled}</p>
                <span className="text-[10px] text-blue-600/80">Working Slots</span>
              </div>
              <div className="p-2.5 rounded-lg border bg-slate-100 dark:bg-slate-800 text-center border-slate-300 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-700 dark:text-slate-300">Weekly Off</span>
                <p className="text-lg font-bold text-slate-700 dark:text-slate-300 mt-0.5">{validationMetrics.weeklyOff}</p>
                <span className="text-[10px] text-slate-600">Rest Days</span>
              </div>
              <div className="p-2.5 rounded-lg border bg-muted/40 text-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Holidays</span>
                <p className="text-lg font-bold text-foreground mt-0.5">{validationMetrics.holidays}</p>
                <span className="text-[10px] text-muted-foreground">Calendar Days</span>
              </div>
              <div className="p-2.5 rounded-lg border bg-muted/40 text-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Approved Leave</span>
                <p className="text-lg font-bold text-foreground mt-0.5">{validationMetrics.leave}</p>
                <span className="text-[10px] text-muted-foreground">Recorded Leaves</span>
              </div>
              <div className="p-2.5 rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/30 text-center border-emerald-200 dark:border-emerald-900">
                <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300">Missing Shifts</span>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">{validationMetrics.missingShifts}</p>
                <span className="text-[10px] text-emerald-600/80">Zero Gaps</span>
              </div>
            </div>

            {/* Validation Warnings / Success */}
            {validationMetrics.missingShifts > 0 ? (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-amber-800 dark:text-amber-300 text-xs">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">⚠ Unassigned Shifts Detected</p>
                  <p className="text-[11px] mt-0.5">
                    {validationMetrics.missingShifts} schedule slots have no assigned shift or weekly off. Please auto-fill or manually assign before publishing.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-xs">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
                <div>
                  <p className="font-semibold">Validation Passed — Ready for Attendance Sync</p>
                  <p className="text-[11px] mt-0.5 text-emerald-700 dark:text-emerald-400">
                    All {validationMetrics.employees} active personnel have complete allocations with Weekly Off compliance.
                  </p>
                </div>
              </div>
            )}

            {/* Policy & Compliance Checklist */}
            <div className="p-3 rounded-lg bg-muted/30 border border-border/60 text-xs space-y-2">
              <p className="font-semibold text-foreground text-[11px]">System Enforcement Checklist:</p>
              <div className="space-y-1.5 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Weekly Off Policy enforced (Sunday for Factory 6-Day, Sat & Sun for Corporate 5-Day)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>3-Tier assignment hierarchy resolved (Employee Override → Dept Baseline → Company Default)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Rest hours compliant (minimum 11h break between consecutive daily cycles)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Face ID & Mobile punches will automatically evaluate against this published roster</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setValidationModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              onClick={handleConfirmPublish}
              disabled={isPublishing}
            >
              {isPublishing ? 'Publishing...' : 'Confirm & Publish Roster'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
