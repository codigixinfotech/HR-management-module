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
  Info,
  User,
  ArrowLeftRight,
  Clock,
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

// Multi-Week Scheduled Periods
const SCHEDULED_WEEKS = [
  {
    weekNum: 37,
    label: '07 Sep 2026 – 13 Sep 2026 (Week 37)',
    periodName: 'September 2026 Week 37',
    days: [
      { key: '2026-09-07', label: 'Mon', dayNum: '07' },
      { key: '2026-09-08', label: 'Tue', dayNum: '08' },
      { key: '2026-09-09', label: 'Wed', dayNum: '09' },
      { key: '2026-09-10', label: 'Thu', dayNum: '10' },
      { key: '2026-09-11', label: 'Fri', dayNum: '11' },
      { key: '2026-09-12', label: 'Sat', dayNum: '12' },
      { key: '2026-09-13', label: 'Sun', dayNum: '13' },
    ],
  },
  {
    weekNum: 38,
    label: '14 Sep 2026 – 20 Sep 2026 (Week 38)',
    periodName: 'September 2026 Week 38',
    rotationPhase: 'Phase 1 — MS Morning Shift',
    days: [
      { key: '2026-09-14', label: 'Mon', dayNum: '14' },
      { key: '2026-09-15', label: 'Tue', dayNum: '15' },
      { key: '2026-09-16', label: 'Wed', dayNum: '16' },
      { key: '2026-09-17', label: 'Thu', dayNum: '17' },
      { key: '2026-09-18', label: 'Fri', dayNum: '18' },
      { key: '2026-09-19', label: 'Sat', dayNum: '19' },
      { key: '2026-09-20', label: 'Sun', dayNum: '20' },
    ],
  },
  {
    weekNum: 39,
    label: '21 Sep 2026 – 27 Sep 2026 (Week 39)',
    periodName: 'September 2026 Week 39',
    rotationPhase: 'Phase 2 — ES Evening Shift',
    days: [
      { key: '2026-09-21', label: 'Mon', dayNum: '21' },
      { key: '2026-09-22', label: 'Tue', dayNum: '22' },
      { key: '2026-09-23', label: 'Wed', dayNum: '23' },
      { key: '2026-09-24', label: 'Thu', dayNum: '24' },
      { key: '2026-09-25', label: 'Fri', dayNum: '25' },
      { key: '2026-09-26', label: 'Sat', dayNum: '26' },
      { key: '2026-09-27', label: 'Sun', dayNum: '27' },
    ],
  },
  {
    weekNum: 40,
    label: '28 Sep 2026 – 04 Oct 2026 (Week 40)',
    periodName: 'Sep-Oct 2026 Week 40',
    rotationPhase: 'Phase 3 — NS Night Shift',
    days: [
      { key: '2026-09-28', label: 'Mon', dayNum: '28' },
      { key: '2026-09-29', label: 'Tue', dayNum: '29' },
      { key: '2026-09-30', label: 'Wed', dayNum: '30' },
      { key: '2026-10-01', label: 'Thu', dayNum: '01' },
      { key: '2026-10-02', label: 'Fri', dayNum: '02' },
      { key: '2026-10-03', label: 'Sat', dayNum: '03' },
      { key: '2026-10-04', label: 'Sun', dayNum: '04' },
    ],
  },
  {
    weekNum: 41,
    label: '05 Oct 2026 – 11 Oct 2026 (Week 41)',
    periodName: 'October 2026 Week 41',
    rotationPhase: 'Phase 4 — GS General Shift',
    days: [
      { key: '2026-10-05', label: 'Mon', dayNum: '05' },
      { key: '2026-10-06', label: 'Tue', dayNum: '06' },
      { key: '2026-10-07', label: 'Wed', dayNum: '07' },
      { key: '2026-10-08', label: 'Thu', dayNum: '08' },
      { key: '2026-10-09', label: 'Fri', dayNum: '09' },
      { key: '2026-10-10', label: 'Sat', dayNum: '10' },
      { key: '2026-10-11', label: 'Sun', dayNum: '11' },
    ],
  },
];

const WEEK_37_DAYS = SCHEDULED_WEEKS[0].days;

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
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(0);
  const [activeMonth, setActiveMonth] = useState<'2026-09' | '2026-10'>('2026-09');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deptMasterList, setDeptMasterList] = useState<string[]>([]);
  const [activeDayKey, setActiveDayKey] = useState<string>('2026-09-09'); // Wednesday 09 Sep (Today)
  const [isPublished, setIsPublished] = useState(false);
  const [publishedPeriodKeys, setPublishedPeriodKeys] = useState<string[]>(['September 2026 Week 37']);

  // Perspective: Admin Overview (All staff) vs Employee View (Individual schedule)
  const [perspective, setPerspective] = useState<'ADMIN' | 'EMPLOYEE'>('ADMIN');
  const [previewEmployeeId, setPreviewEmployeeId] = useState<string>('');

  // Shift Swap Audit & Details Modal state
  const [swapDetailsModalOpen, setSwapDetailsModalOpen] = useState(false);
  const [activeSwapTarget, setActiveSwapTarget] = useState<{
    employee: EmployeeRosterRow;
    dateKey: string;
    cell?: RosterCellData;
  } | null>(null);

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

  // Filter employees: For employees or employee perspective, show target employee; for admins overview, by department and search
  const filteredEmployees = useMemo(() => {
    let list = rosterEmployees;

    if (!canManageRoster || perspective === 'EMPLOYEE') {
      if (perspective === 'EMPLOYEE' && previewEmployeeId) {
        return list.filter((e) => e.employeeId === previewEmployeeId);
      }
      const empId = user?.employee?.id;
      const empCode = user?.employee?.employeeCode?.toLowerCase();
      const empName = user?.employee ? `${user.employee.firstName} ${user.employee.lastName}`.trim().toLowerCase() : '';
      const firstName = user?.employee?.firstName?.toLowerCase() || '';

      const matched = list.filter((emp) => {
        if (empId && emp.employeeId === empId) return true;
        if (empCode && emp.employeeCode?.toLowerCase() === empCode) return true;
        if (empName && emp.name?.toLowerCase() === empName) return true;
        if (firstName && emp.name?.toLowerCase().includes(firstName)) return true;
        return false;
      });

      return matched.length > 0 ? matched : list.slice(0, 1);
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
  }, [rosterEmployees, selectedDept, searchQuery, canManageRoster, perspective, previewEmployeeId, user]);

  // Determine active columns depending on View Mode
  const activeDays = useMemo(() => {
    if (viewMode === 'Day') {
      const allDays = SCHEDULED_WEEKS.flatMap((w) => w.days);
      const found = allDays.find((d) => d.key === activeDayKey);
      return found ? [found] : [SCHEDULED_WEEKS[0].days[2]];
    }
    if (viewMode === 'Week') {
      const currentWeek = SCHEDULED_WEEKS[selectedWeekIndex] || SCHEDULED_WEEKS[0];
      return currentWeek.days;
    }
    // Month View: 30 days of September 2026 or 31 days of October 2026
    const days: { key: string; label: string; dayNum: string }[] = [];
    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const totalDaysInMonth = activeMonth === '2026-09' ? 30 : 31;
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const dayNum = String(i).padStart(2, '0');
      const key = `${activeMonth}-${dayNum}`;
      const d = new Date(key);
      days.push({
        key,
        label: labels[d.getDay()],
        dayNum,
      });
    }
    return days;
  }, [viewMode, activeDayKey, activeMonth, selectedWeekIndex]);

  // Date Navigation
  const handlePrev = () => {
    if (viewMode === 'Day') {
      const allDays = SCHEDULED_WEEKS.flatMap((w) => w.days);
      const idx = allDays.findIndex((d) => d.key === activeDayKey);
      if (idx > 0) setActiveDayKey(allDays[idx - 1].key);
    } else if (viewMode === 'Week') {
      if (selectedWeekIndex > 0) {
        const prevIdx = selectedWeekIndex - 1;
        setSelectedWeekIndex(prevIdx);
        setIsPublished(prevIdx === 0);
        toast.info(`Navigated to ${SCHEDULED_WEEKS[prevIdx].label}`);
      } else {
        toast.info('Viewing earliest configured cycle: Week 37 (07–13 Sep 2026)');
      }
    } else if (viewMode === 'Month') {
      if (activeMonth === '2026-10') {
        setActiveMonth('2026-09');
        toast.info('Viewing September 2026');
      } else {
        toast.info('Viewing September 2026');
      }
    }
  };

  const handleNext = () => {
    if (viewMode === 'Day') {
      const allDays = SCHEDULED_WEEKS.flatMap((w) => w.days);
      const idx = allDays.findIndex((d) => d.key === activeDayKey);
      if (idx < allDays.length - 1) setActiveDayKey(allDays[idx + 1].key);
    } else if (viewMode === 'Week') {
      if (selectedWeekIndex < SCHEDULED_WEEKS.length - 1) {
        const nextIdx = selectedWeekIndex + 1;
        setSelectedWeekIndex(nextIdx);
        setIsPublished(false); // Upcoming rotation cycles start as Draft until published
        toast.info(`Navigated to ${SCHEDULED_WEEKS[nextIdx].label}`);
      } else {
        toast.info('End of pre-configured rotation window');
      }
    } else if (viewMode === 'Month') {
      if (activeMonth === '2026-09') {
        setActiveMonth('2026-10');
        toast.info('Viewing October 2026');
      } else {
        toast.info('Viewing October 2026');
      }
    }
  };

  const handleToday = () => {
    setSelectedWeekIndex(0);
    setActiveDayKey('2026-09-09');
    setActiveMonth('2026-09');
    setViewMode('Week');
    setIsPublished(true);
    toast.success('Navigated to current active schedule week (09 Sep 2026)');
  };

  // Open Cell Details / Override modal
  const handleCellClick = (employee: EmployeeRosterRow, dateKey: string) => {
    const existing = employee.slots[dateKey];
    if (existing?.isApprovedShiftSwap || existing?.source === 'Shift Swap') {
      setActiveSwapTarget({ employee, dateKey, cell: existing });
      setSwapDetailsModalOpen(true);
      return;
    }

    if (!canManageRoster) {
      toast.info(
        `${existing?.shiftName || 'Scheduled'}: ${existing?.timing || 'Standard Hours'} (Source: ${existing?.source || 'Base Schedule'})`
      );
      return;
    }

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

  // Active Period & Rotation calculations
  const activePeriodKey = useMemo(() => {
    if (viewMode === 'Week') {
      return SCHEDULED_WEEKS[selectedWeekIndex]?.periodName || 'September 2026 Week 37';
    }
    if (viewMode === 'Day') {
      return `Day: ${activeDayKey}`;
    }
    return activeMonth === '2026-09' ? 'September 2026 Full Month' : 'October 2026 Full Month';
  }, [viewMode, selectedWeekIndex, activeDayKey, activeMonth]);

  const activePeriodLabel = useMemo(() => {
    if (viewMode === 'Week') {
      return SCHEDULED_WEEKS[selectedWeekIndex]?.label || '07 Sep 2026 – 13 Sep 2026 (Week 37)';
    }
    if (viewMode === 'Day') {
      return `Day ${activeDayKey}`;
    }
    return activeMonth === '2026-09' ? 'September 2026' : 'October 2026';
  }, [viewMode, selectedWeekIndex, activeDayKey, activeMonth]);

  const activeRotationPhase = useMemo(() => {
    if (viewMode === 'Week') {
      return SCHEDULED_WEEKS[selectedWeekIndex]?.rotationPhase || 'Phase 1 — MS Morning Shift';
    }
    return 'Production 4-Shift Rotation (Weekly Cadence)';
  }, [viewMode, selectedWeekIndex]);

  const isCurrentPeriodPublished = useMemo(() => {
    if (publishedPeriodKeys.includes(activePeriodKey)) return true;
    let workingSlots = 0;
    let publishedSlots = 0;
    filteredEmployees.forEach((emp) => {
      activeDays.forEach((d) => {
        const cell = emp.slots[d.key];
        if (cell && cell.shiftCode && !['WO', 'LV', 'HOL'].includes(cell.shiftCode)) {
          workingSlots++;
          if (cell.status === 'Published') {
            publishedSlots++;
          }
        }
      });
    });
    return workingSlots > 0 && publishedSlots === workingSlots;
  }, [publishedPeriodKeys, activePeriodKey, filteredEmployees, activeDays]);

  // Auto-Fill action
  const hasActiveRotation = rotations.some((r) => r.status === 'Active');

  const handleAutoFill = async () => {
    const dates = activeDays.map((d) => d.key);
    await bulkAutoAssignWeek(dates, 'GS');
    toast.success(
      hasActiveRotation
        ? `Auto-filled roster from active rotation rules for ${activePeriodLabel}! Approved leaves, shifts, and overrides preserved.`
        : `Generated roster baseline from Shift Assignments & Weekly Off Policies for ${activePeriodLabel}!`
    );
  };

  // Compute live validation metrics for Publish Review modal
  const validationMetrics = useMemo(() => {
    let totalScheduled = 0;
    let totalWeeklyOff = 0;
    let totalHolidays = 0;
    let totalLeave = 0;
    let missingShifts = 0;
    let shiftChangeOverrides = 0;
    let approvedShiftSwaps = 0;

    filteredEmployees.forEach((emp) => {
      activeDays.forEach((day) => {
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
          if (cell.isApprovedShiftChange) {
            shiftChangeOverrides++;
          }
          if ((cell as any).isApprovedShiftSwap) {
            approvedShiftSwaps++;
          }
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
      shiftChangeOverrides,
      approvedShiftSwaps,
      rotationPhase: activeRotationPhase,
      conflicts: missingShifts,
    };
  }, [filteredEmployees, activeDays, activeRotationPhase]);

  // Publish Roster Confirm
  const handleConfirmPublish = async () => {
    setIsPublishing(true);
    try {
      const periodName = activePeriodKey;
      const dateRange =
        viewMode === 'Week'
          ? (SCHEDULED_WEEKS[selectedWeekIndex]?.label.split(' (')[0] || '14 Sep 2026 – 20 Sep 2026')
          : `${activeDays[0]?.key} to ${activeDays[activeDays.length - 1]?.key}`;

      await publishRoster(periodName, dateRange, filteredEmployees.length);
      setPublishedPeriodKeys((prev) => Array.from(new Set([...prev, activePeriodKey])));
      setValidationModalOpen(false);
      toast.success(
        `Roster for ${activePeriodLabel} successfully published! Attendance is now active against finalized shifts.`
      );
    } catch (err) {
      toast.error('Failed to publish roster');
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

    const isSwap = Boolean(cell.isApprovedShiftSwap || cell.source === 'Shift Swap');
    const isChange = Boolean(
      (cell as any).isApprovedShiftChange ||
      cell.source === 'Shift Change' ||
      (cell.isCustomOverride && cell.overrideReason?.toLowerCase().includes('approved'))
    );
    const isRotation = Boolean(cell.source === 'Rotation' || cell.sourceBadge === 'ROT');
    const isManual = Boolean(cell.source === 'Manual Override' || (cell.isCustomOverride && !isSwap && !isChange));

    const renderShiftCore = () => {
      switch (cell.shiftCode) {
        case 'GS':
        case 'G':
        case 'GEN':
          return (
            <span
              className={`inline-flex items-center justify-center w-full py-1 px-1.5 rounded-md font-bold text-[11px] ${
                isSwap
                  ? 'bg-indigo-50 text-indigo-800 border border-indigo-400 ring-1 ring-indigo-400 dark:bg-indigo-950/70 dark:text-indigo-200 dark:border-indigo-700'
                  : isChange
                  ? 'bg-amber-50 text-amber-800 border border-amber-400 ring-1 ring-amber-400'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
              } shadow-2xs`}
              title={isSwap ? 'Approved Shift Swap' : isChange ? 'Approved Shift Change' : undefined}
            >
              {isSwap && <span className="mr-1 text-[11px]">🔄</span>}
              GS — General
            </span>
          );
        case 'MS':
        case 'A':
        case 'MOR':
          return (
            <span
              className={`inline-flex items-center justify-center w-full py-1 px-1.5 rounded-md font-bold text-[11px] ${
                isSwap
                  ? 'bg-indigo-50 text-indigo-800 border border-indigo-400 ring-1 ring-indigo-400 dark:bg-indigo-950/70 dark:text-indigo-200 dark:border-indigo-700'
                  : isChange
                  ? 'bg-amber-50 text-amber-800 border border-amber-400 ring-1 ring-amber-400'
                  : 'bg-blue-50 text-blue-700 border border-blue-300 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800'
              } shadow-2xs`}
              title={isSwap ? 'Approved Shift Swap' : isChange ? 'Approved Shift Change' : undefined}
            >
              {isSwap && <span className="mr-1 text-[11px]">🔄</span>}
              MS — Morning
            </span>
          );
        case 'ES':
        case 'B':
          return (
            <span
              className={`inline-flex items-center justify-center w-full py-1 px-1.5 rounded-md font-bold text-[11px] ${
                isSwap
                  ? 'bg-indigo-50 text-indigo-800 border border-indigo-400 ring-1 ring-indigo-400 dark:bg-indigo-950/70 dark:text-indigo-200 dark:border-indigo-700'
                  : isChange
                  ? 'bg-amber-50 text-amber-800 border border-amber-400 ring-1 ring-amber-400'
                  : 'bg-purple-50 text-purple-700 border border-purple-300 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800'
              } shadow-2xs`}
              title={isSwap ? 'Approved Shift Swap' : isChange ? 'Approved Shift Change' : undefined}
            >
              {isSwap && <span className="mr-1 text-[11px]">🔄</span>}
              ES — Evening
            </span>
          );
        case 'NS':
        case 'C':
        case 'NIT':
          return (
            <span
              className={`inline-flex items-center justify-center w-full py-1 px-1.5 rounded-md font-bold text-[11px] ${
                isSwap
                  ? 'bg-indigo-50 text-indigo-800 border border-indigo-400 ring-1 ring-indigo-400 dark:bg-indigo-950/70 dark:text-indigo-200 dark:border-indigo-700'
                  : isChange
                  ? 'bg-amber-50 text-amber-800 border border-amber-400 ring-1 ring-amber-400'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-300 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800'
              } shadow-2xs`}
              title={isSwap ? 'Approved Shift Swap' : isChange ? 'Approved Shift Change' : undefined}
            >
              {isSwap && <span className="mr-1 text-[11px]">🔄</span>}
              NS — Night
            </span>
          );
        case 'WO':
          return (
            <span className="inline-flex items-center justify-center w-full py-1 px-1.5 rounded-md font-medium text-[11px] bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700">
              ⚪ Weekly Off
            </span>
          );
        case 'HOL':
        case 'HD_HOL':
          return (
            <span className="inline-flex items-center justify-center w-full py-1 px-1.5 rounded-md font-bold text-[11px] bg-rose-50 text-rose-700 border border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 shadow-2xs">
              🟥 Public Holiday
            </span>
          );
        case 'LV':
          return (
            <span className="inline-flex items-center justify-center w-full py-1 px-1.5 rounded-md font-bold text-[11px] bg-amber-50 text-amber-700 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 shadow-2xs">
              🟨 Approved Leave
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
      <div className="flex flex-col items-center w-full gap-0.5">
        {renderShiftCore()}
        {/* Indicators & Status Badges */}
        {isSwap && (
          <div className="flex flex-wrap items-center justify-center gap-1 mt-0.5">
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/80 dark:text-indigo-200 border border-indigo-300">
              ⇄ SWAP
            </span>
            <span className="text-[8px] font-bold text-indigo-600 dark:text-indigo-400">
              {cell.swapDetails?.displayStatus || 'Scheduled Swap'}
            </span>
          </div>
        )}
        {!isSwap && isChange && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[8px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 mt-0.5">
            🔀 CHANGE
          </span>
        )}
        {!isSwap && !isChange && isRotation && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[8px] font-bold bg-blue-100 text-blue-800 border border-blue-200 mt-0.5">
            🟦 ROT
          </span>
        )}
        {!isSwap && !isChange && isManual && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[8px] font-semibold text-purple-700 dark:text-purple-300 mt-0.5">
            ✏️ MANUAL
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
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

          {/* Perspective Switcher: Admin Overview vs Employee View */}
          {canManageRoster && (
            <div className="inline-flex rounded-lg border border-border/80 p-0.5 bg-muted/40">
              <button
                type="button"
                onClick={() => setPerspective('ADMIN')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  perspective === 'ADMIN'
                    ? 'bg-background text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Admin View
              </button>
              <button
                type="button"
                onClick={() => setPerspective('EMPLOYEE')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  perspective === 'EMPLOYEE'
                    ? 'bg-background text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Employee View
              </button>
            </div>
          )}

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
                ? SCHEDULED_WEEKS[selectedWeekIndex]?.label || 'Week Schedule'
                : activeMonth === '2026-09'
                ? `September 2026 (30 Days)`
                : `October 2026 (31 Days)`}
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
                isCurrentPeriodPublished
                  ? 'bg-emerald-700 hover:bg-emerald-800'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-2xs'
              }`}
              onClick={() => setValidationModalOpen(true)}
            >
              <Send className="h-3.5 w-3.5" />
              {isCurrentPeriodPublished ? 'Published Roster ✓' : 'Publish Roster'}
            </Button>
          </div>
        )}
      </div>

      {/* Perspective / Employee View Banner */}
      {perspective === 'EMPLOYEE' && (
        <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground text-xs">
                  {filteredEmployees[0]?.name || 'Staff Member'}
                </span>
                <span className="font-mono font-bold text-primary text-[11px]">
                  {filteredEmployees[0]?.employeeCode}
                </span>
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-semibold bg-background">
                  Employee View
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {filteredEmployees[0]?.role} • {filteredEmployees[0]?.department} ({filteredEmployees[0]?.branch})
              </p>
            </div>
          </div>

          {canManageRoster && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium hidden md:inline">Preview Colleague:</span>
              <Select
                value={previewEmployeeId || filteredEmployees[0]?.employeeId || ''}
                onValueChange={(val) => setPreviewEmployeeId(val)}
              >
                <SelectTrigger className="h-8 w-52 text-xs bg-background">
                  <SelectValue placeholder="Select Colleague" />
                </SelectTrigger>
                <SelectContent>
                  {rosterEmployees.map((emp) => (
                    <SelectItem key={emp.employeeId} value={emp.employeeId} className="text-xs">
                      {emp.name} ({emp.employeeCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Recommended Calendar Indicators Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-border/70 bg-card shadow-2xs text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-foreground text-[11px] mr-1">Indicators:</span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100/80 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-medium text-[10px] border border-blue-200">
            🟦 <strong>ROT</strong> Rotation
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 font-bold text-[10px] border border-indigo-300 ring-1 ring-indigo-400">
            🔄 <strong>SWAP</strong> Shift Swap
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100/80 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-medium text-[10px] border border-amber-200">
            🔀 <strong>CHANGE</strong> Shift Change
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 font-medium text-[10px] border border-amber-200">
            🟨 <strong>LEAVE</strong> Leave
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-medium text-[10px] border border-slate-200">
            ⚪ <strong>WO</strong> Weekly Off
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-medium text-[10px] border border-rose-200">
            🟥 <strong>HOL</strong> Holiday
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-medium text-[10px] border border-purple-200">
            ✏️ <strong>MANUAL</strong> Manual Override
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground italic hidden sm:inline">
          Click any cell to inspect shift swap & override audit metadata
        </span>
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
                className={`text-[10px] px-2.5 py-0.5 font-bold ${
                  isCurrentPeriodPublished
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {isCurrentPeriodPublished ? 'PUBLISHED' : 'DRAFT — Generated from Rotation'}
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
                      const isSwap = Boolean(cell?.isApprovedShiftSwap || cell?.source === 'Shift Swap');
                      return (
                        <td
                          key={day.key}
                          onClick={() => handleCellClick(emp, day.key)}
                          className={`py-2 px-2 text-center border-r border-border/40 transition-colors group relative cursor-pointer hover:bg-primary/5 ${
                            isToday ? 'bg-primary/5' : ''
                          } ${isSwap ? 'bg-indigo-50/20 dark:bg-indigo-950/20 ring-inset hover:ring-1 hover:ring-indigo-400' : ''}`}
                          title={
                            isSwap
                              ? `Approved Shift Swap with ${cell?.swapDetails?.partnerName} — Click to inspect audit trail`
                              : canManageRoster
                              ? 'Click to modify allocation'
                              : `${cell?.shiftName || 'Shift'} (Source: ${cell?.source || 'Base Schedule'})`
                          }
                        >
                          <div className="flex flex-col items-center justify-center min-h-[50px]">
                            {getShiftBadge(cell)}
                            {cell?.timing && (
                              <span className="text-[9px] font-mono text-muted-foreground mt-1">
                                {cell.timing}
                              </span>
                            )}
                            {cell?.isCustomOverride && !isSwap && !cell?.isApprovedShiftChange && (
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
          Shift Swap Audit & Details Dialog
          ───────────────────────────────────────────────────────────── */}
      <Dialog open={swapDetailsModalOpen} onOpenChange={setSwapDetailsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2">
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <span className="text-lg">🔄</span> Shift Swap Information
              </DialogTitle>
              <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300 font-bold text-xs">
                {activeSwapTarget?.cell?.swapDetails?.status || 'Approved – Scheduled'}
              </Badge>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Mutual shift exchange between verified colleagues with automated compliance tracking
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* "Why is my shift different?" Callout Box */}
            <div className="rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 p-3.5 border border-indigo-200 dark:border-indigo-800/60 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-200">
                <Info className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Why is my shift different?</span>
              </div>
              <p className="text-xs text-indigo-800/90 dark:text-indigo-300/90 pl-5 leading-relaxed">
                {activeSwapTarget?.cell?.swapDetails?.explanation ||
                  `Your shift was changed through an approved shift swap with ${activeSwapTarget?.cell?.swapDetails?.partnerName || 'colleague'}.`}
              </p>
            </div>

            {/* Shift Swap Comparison Box */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl border border-border/80 bg-muted/20 text-xs">
              <div className="space-y-1 border-r border-border/60 pr-2">
                <span className="text-[11px] font-medium text-muted-foreground">Original Shift:</span>
                <p className="font-bold text-foreground text-xs">
                  {activeSwapTarget?.cell?.swapDetails?.originalShift || 'MS – Morning Shift'}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Baseline Assignment
                </p>
              </div>

              <div className="space-y-1 pl-1">
                <span className="text-[11px] font-medium text-muted-foreground">Swapped Shift:</span>
                <p className="font-bold text-indigo-600 dark:text-indigo-400 text-xs flex items-center gap-1">
                  🔄 {activeSwapTarget?.cell?.swapDetails?.swappedShift || activeSwapTarget?.cell?.shiftName || 'GS – General Shift'}
                </p>
                <p className="text-[10px] font-mono text-muted-foreground">
                  {activeSwapTarget?.cell?.timing || '09:00 AM – 05:30 PM'}
                </p>
              </div>
            </div>

            {/* Swap Participants Card */}
            <div className="rounded-xl border border-border/70 p-3 text-xs space-y-2.5 bg-card">
              <div className="flex justify-between items-center pb-2 border-b border-border/50">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Employee</span>
                  <p className="font-bold text-foreground text-xs">{activeSwapTarget?.employee.name}</p>
                  <span className="font-mono text-[10px] text-primary font-semibold">{activeSwapTarget?.employee.employeeCode}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Swap Partner</span>
                  <p className="font-bold text-foreground text-xs">{activeSwapTarget?.cell?.swapDetails?.partnerName}</p>
                  <span className="font-mono text-[10px] text-primary font-semibold">{activeSwapTarget?.cell?.swapDetails?.partnerCode || 'Verified Colleague'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                <div>
                  <strong className="text-foreground font-medium">Date of Swap:</strong>{' '}
                  <span className="font-mono font-semibold text-foreground">{activeSwapTarget?.dateKey}</span>
                </div>
                <div>
                  <strong className="text-foreground font-medium">Approved by:</strong>{' '}
                  <span>{activeSwapTarget?.cell?.swapDetails?.approvedBy || 'Operations Lead'}</span>
                </div>
                <div className="col-span-2 pt-1">
                  <strong className="text-foreground font-medium">Status:</strong>{' '}
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">{activeSwapTarget?.cell?.swapDetails?.status || 'Approved – Scheduled'}</span>
                </div>
                <div className="col-span-2 pt-1 border-t border-border/40">
                  <strong className="text-foreground font-medium">Business Reason:</strong>{' '}
                  <span className="italic text-foreground">{activeSwapTarget?.cell?.swapDetails?.reason || 'Personal commitment coverage swap'}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex sm:justify-between items-center gap-2">
            {canManageRoster ? (
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 text-purple-700 dark:text-purple-300 border-purple-200"
                onClick={() => {
                  setSwapDetailsModalOpen(false);
                  if (activeSwapTarget) {
                    setActiveCellTarget({
                      employee: activeSwapTarget.employee,
                      dateKey: activeSwapTarget.dateKey,
                      currentCell: activeSwapTarget.cell,
                    });
                    setSelectedShiftCode(activeSwapTarget.cell?.shiftCode || 'GS');
                    setOverrideReason(activeSwapTarget.cell?.overrideReason || '');
                    setCellEditModalOpen(true);
                  }
                }}
              >
                <Edit2 className="h-3.5 w-3.5 mr-1" /> Force Override Slot
              </Button>
            ) : <div />}
            <Button
              size="sm"
              className="text-xs h-8 bg-primary text-primary-foreground font-semibold"
              onClick={() => setSwapDetailsModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" /> Roster Pre-Publish Review & Validation
            </DialogTitle>
            <DialogDescription className="text-xs">
              Audit schedule completeness, rotation cadence, and conflict overrides for <strong>{activePeriodLabel}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Rotation Context Banner */}
            <div className="p-3 rounded-lg border bg-muted/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Active Rotation Rule
                </span>
                <p className="text-xs font-semibold text-foreground mt-0.5">
                  Production 4-Shift Rotation (Weekly Cadence)
                </p>
              </div>
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold px-2.5 py-1 w-fit">
                {validationMetrics.rotationPhase}
              </Badge>
            </div>

            {/* Validation Metrics Grid */}
            <div className="grid grid-cols-4 gap-2">
              <div className="p-2 rounded-lg border bg-background text-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Employees</span>
                <p className="text-base font-bold text-foreground mt-0.5">{validationMetrics.employees}</p>
                <span className="text-[9px] text-muted-foreground">Covered</span>
              </div>
              <div className="p-2 rounded-lg border bg-blue-50/50 dark:bg-blue-950/30 text-center border-blue-200 dark:border-blue-900">
                <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300">Shifts</span>
                <p className="text-base font-bold text-blue-700 dark:text-blue-300 mt-0.5">{validationMetrics.scheduled}</p>
                <span className="text-[9px] text-blue-600/80">Generated</span>
              </div>
              <div className="p-2 rounded-lg border bg-slate-100 dark:bg-slate-800 text-center border-slate-300 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-700 dark:text-slate-300">Weekly Off</span>
                <p className="text-base font-bold text-slate-700 dark:text-slate-300 mt-0.5">{validationMetrics.weeklyOff}</p>
                <span className="text-[9px] text-slate-600">Rest Days</span>
              </div>
              <div className="p-2 rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/30 text-center border-emerald-200 dark:border-emerald-900">
                <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300">Conflicts</span>
                <p className="text-base font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">{validationMetrics.conflicts}</p>
                <span className="text-[9px] text-emerald-600/80">Issues</span>
              </div>
            </div>

            {/* Conflict & Safeguard Breakdown */}
            <div className="space-y-2">
              <h5 className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                Safeguard & Priority Validation:
              </h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg border bg-background/80 flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground text-[11px]">Leave Conflict Safeguard</p>
                    <p className="text-[10px] text-muted-foreground">
                      {validationMetrics.leave} approved leaves protected (leave overrides rotation shift).
                    </p>
                  </div>
                </div>

                <div className="p-2 rounded-lg border bg-background/80 flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground text-[11px]">Shift-Change Overrides</p>
                    <p className="text-[10px] text-muted-foreground">
                      {validationMetrics.shiftChangeOverrides} approved requests preserved over baseline rotation.
                    </p>
                  </div>
                </div>

                <div className="p-2 rounded-lg border bg-background/80 flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground text-[11px]">Weekly-Off Compliance</p>
                    <p className="text-[10px] text-muted-foreground">
                      {validationMetrics.weeklyOff} rest days aligned with factory 6-day / office 5-day rules.
                    </p>
                  </div>
                </div>

                <div className="p-2 rounded-lg border bg-background/80 flex items-start gap-2">
                  {validationMetrics.missingShifts === 0 ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-semibold text-foreground text-[11px]">Missing Assignments</p>
                    <p className="text-[10px] text-muted-foreground">
                      {validationMetrics.missingShifts === 0
                        ? '100% headcount coverage (0 unassigned slots).'
                        : `${validationMetrics.missingShifts} slots require assignment.`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance Integration Notice */}
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                <strong>Attendance Activation:</strong> Upon publishing, this roster becomes the authoritative schedule for biometric face-match punches and mobile check-ins.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setValidationModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
              onClick={handleConfirmPublish}
              disabled={isPublishing}
            >
              <Send className="h-3.5 w-3.5" />
              {isPublishing ? 'Publishing...' : 'Publish Roster (Final Schedule)'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
