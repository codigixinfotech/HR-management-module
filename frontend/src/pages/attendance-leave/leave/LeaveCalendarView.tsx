import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { holidaysApi } from '@/api/attendance-leave';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Users,
  Clock,
  CheckCircle2,
  Sparkles,
  Info,
  Layers,
  Search,
  Filter,
  Palmtree,
  Coffee,
  PartyPopper,
  Flame,
  ArrowRight,
  Building2,
  MapPin,
  Briefcase,
  X,
  RotateCcw,
} from 'lucide-react';
import type { LeaveRequest, LeaveType } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface LeaveCalendarViewProps {
  requests: LeaveRequest[];
  leaveTypes: LeaveType[];
  companyId?: string;
  departments?: string[];
  branches?: any[];
  employees?: any[];
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Fallback statutory holidays if database is empty/loading
const INITIAL_HOLIDAYS: any[] = [
  {
    name: 'Republic Day',
    date: '2026-01-26',
    type: 'Mandatory',
    category: 'National',
    scope: 'Company',
    applicableLocations: ['All Company Entities'],
    isPaid: true,
    isOptional: false,
    attendanceOverride: true,
    payrollImpact: 'Paid Holiday',
    description: 'National statutory holiday celebrating Constitution of India.',
    duration: 'Full Day',
    applicableTo: 'Company',
    applicableTarget: 'All Company Entities',
  },
  {
    name: 'Ambedkar Jayanti',
    date: '2026-04-14',
    type: 'Regional',
    category: 'Regional',
    scope: 'Branch',
    applicableLocations: ['Pune Manufacturing Plant', 'Mumbai Office'],
    isPaid: true,
    isOptional: false,
    attendanceOverride: true,
    payrollImpact: 'Paid Holiday',
    description: 'Birth anniversary of Dr. B. R. Ambedkar.',
    duration: 'Full Day',
    applicableTo: 'Branch',
    applicableTarget: 'Pune Manufacturing Plant',
  },
  {
    name: 'Maharashtra Day',
    date: '2026-05-01',
    type: 'Regional',
    category: 'Regional',
    scope: 'Branch',
    applicableLocations: ['Pune Manufacturing Plant', 'Mumbai Office'],
    isPaid: true,
    isOptional: false,
    attendanceOverride: true,
    payrollImpact: 'Paid Holiday',
    description: 'Statehood day celebrating Maharashtra state formation.',
    duration: 'Full Day',
    applicableTo: 'Branch',
    applicableTarget: 'Pune Manufacturing Plant',
  },
  {
    name: 'Independence Day',
    date: '2026-08-15',
    type: 'Mandatory',
    category: 'National',
    scope: 'Company',
    applicableLocations: ['All Company Entities'],
    isPaid: true,
    isOptional: false,
    attendanceOverride: true,
    payrollImpact: 'Paid Holiday',
    description: 'National statutory holiday celebrating Indian Independence.',
    duration: 'Full Day',
    applicableTo: 'Company',
    applicableTarget: 'All Company Entities',
  },
  {
    name: 'Ganesh Chaturthi',
    date: '2026-09-19',
    type: 'Regional',
    category: 'Festival',
    scope: 'Company',
    applicableLocations: ['All Company Entities'],
    isPaid: true,
    isOptional: false,
    attendanceOverride: true,
    payrollImpact: 'Paid Holiday',
    description: 'Auspicious festival celebrating Lord Ganesha.',
    duration: 'Full Day',
    applicableTo: 'Company',
    applicableTarget: 'All Company Entities',
  },
  {
    name: 'hoilday',
    date: '2026-09-22',
    type: 'Mandatory',
    category: 'National',
    scope: 'Company',
    applicableLocations: ['All Company Entities'],
    isPaid: true,
    isOptional: false,
    attendanceOverride: true,
    payrollImpact: 'Paid Holiday',
    description: 'Company-declared holiday.',
    duration: 'Full Day',
    applicableTo: 'Company',
    applicableTarget: 'All Company Entities',
  },
  {
    name: 'Anant Chaturdashi',
    date: '2026-09-28',
    type: 'Regional',
    category: 'Festival',
    scope: 'Branch',
    applicableLocations: ['Pune Manufacturing Plant'],
    isPaid: true,
    isOptional: false,
    attendanceOverride: true,
    payrollImpact: 'Paid Holiday',
    description: 'Festival culmination and visarjan holiday.',
    duration: 'Full Day',
    applicableTo: 'Branch',
    applicableTarget: 'Pune Manufacturing Plant',
  },
  {
    name: 'Gandhi Jayanti',
    date: '2026-10-02',
    type: 'Mandatory',
    category: 'National',
    scope: 'Company',
    applicableLocations: ['All Company Entities'],
    isPaid: true,
    isOptional: false,
    attendanceOverride: true,
    payrollImpact: 'Paid Holiday',
    description: 'Birth anniversary of Mahatma Gandhi.',
    duration: 'Full Day',
    applicableTo: 'Company',
    applicableTarget: 'All Company Entities',
  },
  {
    name: 'Dussehra (Vijayadashami)',
    date: '2026-10-20',
    type: 'Restricted / Optional',
    category: 'Festival',
    scope: 'Branch',
    applicableLocations: ['Pune Manufacturing Plant'],
    isPaid: true,
    isOptional: true,
    attendanceOverride: true,
    payrollImpact: 'Paid Holiday',
    description: 'Restricted festival holiday selectable by employees.',
    duration: 'Full Day',
    applicableTo: 'Branch',
    applicableTarget: 'Pune Manufacturing Plant',
  },
  {
    name: 'Diwali (Laxmi Pujan)',
    date: '2026-11-08',
    type: 'Mandatory',
    category: 'Festival',
    scope: 'Company',
    applicableLocations: ['All Company Entities'],
    isPaid: true,
    isOptional: false,
    attendanceOverride: true,
    payrollImpact: 'Paid Holiday',
    description: 'Major national festival of lights.',
    duration: 'Full Day',
    applicableTo: 'Company',
    applicableTarget: 'All Company Entities',
  },
  {
    name: 'Christmas Day',
    date: '2026-12-25',
    type: 'Mandatory',
    category: 'Festival',
    scope: 'Company',
    applicableLocations: ['All Company Entities'],
    isPaid: true,
    isOptional: false,
    attendanceOverride: true,
    payrollImpact: 'Paid Holiday',
    description: 'Annual festival celebrating Christmas across all branches.',
    duration: 'Full Day',
    applicableTo: 'Company',
    applicableTarget: 'All Company Entities',
  },
];

function getLeaveBadgeStyle(code: string) {
  switch (code.toUpperCase()) {
    case 'CL':
      return {
        bg: 'bg-emerald-50 hover:bg-emerald-100/80',
        text: 'text-emerald-900',
        border: 'border-emerald-200/90',
        dot: 'bg-emerald-500',
        avatarBg: 'bg-emerald-200 text-emerald-800',
      };
    case 'SL':
      return {
        bg: 'bg-blue-50 hover:bg-blue-100/80',
        text: 'text-blue-900',
        border: 'border-blue-200/90',
        dot: 'bg-blue-500',
        avatarBg: 'bg-blue-200 text-blue-800',
      };
    case 'EL':
      return {
        bg: 'bg-teal-50 hover:bg-teal-100/80',
        text: 'text-teal-900',
        border: 'border-teal-200/90',
        dot: 'bg-teal-500',
        avatarBg: 'bg-teal-200 text-teal-800',
      };
    case 'ML':
      return {
        bg: 'bg-pink-50 hover:bg-pink-100/80',
        text: 'text-pink-900',
        border: 'border-pink-200/90',
        dot: 'bg-pink-500',
        avatarBg: 'bg-pink-200 text-pink-800',
      };
    case 'CO':
      return {
        bg: 'bg-amber-50 hover:bg-amber-100/80',
        text: 'text-amber-900',
        border: 'border-amber-200/90',
        dot: 'bg-amber-500',
        avatarBg: 'bg-amber-200 text-amber-800',
      };
    case 'LOP':
      return {
        bg: 'bg-rose-50 hover:bg-rose-100/80',
        text: 'text-rose-900',
        border: 'border-rose-200/90',
        dot: 'bg-rose-500',
        avatarBg: 'bg-rose-200 text-rose-800',
      };
    default:
      return {
        bg: 'bg-indigo-50 hover:bg-indigo-100/80',
        text: 'text-indigo-900',
        border: 'border-indigo-200/90',
        dot: 'bg-indigo-500',
        avatarBg: 'bg-indigo-200 text-indigo-800',
      };
  }
}

export function LeaveCalendarView({
  requests,
  leaveTypes,
  companyId,
  departments = [],
  branches = [],
  employees = [],
}: LeaveCalendarViewProps) {
  // Calendar month state - defaults to September 2026
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(8); // 8 is September (0-indexed)

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('ALL');
  const [searchEmp, setSearchEmp] = useState('');

  // 1. Fetch declared holidays from database (sharing exact queryKey with Work Calendar)
  const { data: dbHolidays = [] } = useQuery({
    queryKey: ['holidays', companyId],
    queryFn: () => holidaysApi.list(companyId),
    enabled: !!companyId,
  });

  // 2. Build common declared holiday map indexed by YYYY-MM-DD
  const holidayMap = useMemo(() => {
    const map: Record<string, any> = {};

    // Initial default statutory holidays
    INITIAL_HOLIDAYS.forEach((h: any) => {
      if (h.date) {
        const dStr = typeof h.date === 'string' ? h.date.slice(0, 10) : h.date;
        map[dStr] = { ...h, date: dStr };
      }
    });

    // Overwrite and extend with live database declared holidays
    (dbHolidays as any[]).forEach((h: any) => {
      if (h.date) {
        const dStr = typeof h.date === 'string' ? h.date.slice(0, 10) : h.date;
        map[dStr] = {
          ...h,
          date: dStr,
          isOptional:
            h.isOptional === true ||
            h.type?.toLowerCase().includes('optional') ||
            h.type?.toLowerCase().includes('restricted'),
        };
      }
    });

    return map;
  }, [dbHolidays]);

  // 3. Holiday Applicability Checker: Company -> Branch -> Department -> Employee Group
  const isHolidayApplicable = useMemo(() => {
    return (h: any) => {
      if (!h) return false;
      const scope = (h.scope || h.applicableTo || 'Company').toLowerCase();
      const target = (h.applicableTarget || '').trim().toLowerCase();
      const locs: string[] = (h.applicableLocations || []).map((l: any) =>
        typeof l === 'string' ? l.trim().toLowerCase() : ''
      );

      // A. Company-level holidays apply organization-wide
      if (
        scope === 'company' ||
        target === 'all company entities' ||
        locs.includes('all company entities') ||
        locs.length === 0
      ) {
        return true;
      }

      // B. If an employee search query is active, check against the matching employee's branch/department
      if (searchEmp.trim()) {
        const q = searchEmp.toLowerCase();
        const matchedEmp = employees.find((e: any) => {
          const name = `${e.firstName || ''} ${e.lastName || ''}`.toLowerCase();
          const code = (e.employeeCode || '').toLowerCase();
          return name.includes(q) || code.includes(q);
        });

        if (matchedEmp) {
          if (scope === 'branch') {
            const empBranch = (matchedEmp.branch?.name || matchedEmp.location || '').trim().toLowerCase();
            return target === empBranch || locs.some((l) => l.includes(empBranch) || empBranch.includes(l));
          }
          if (scope === 'department') {
            const empDept = (matchedEmp.department?.name || '').trim().toLowerCase();
            return target === empDept || locs.some((l) => l.includes(empDept) || empDept.includes(l));
          }
        }
      }

      // C. Branch filter check
      if (branchFilter !== 'ALL') {
        if (scope === 'branch') {
          const b = branchFilter.trim().toLowerCase();
          return target === b || locs.some((l) => l.includes(b) || b.includes(l));
        }
      }

      // D. Department filter check
      if (departmentFilter !== 'ALL') {
        if (scope === 'department') {
          const d = departmentFilter.trim().toLowerCase();
          return target === d || locs.some((l) => l.includes(d) || d.includes(l));
        }
      }

      // When 'ALL' filters are selected in company view, show all company and branch holidays
      return true;
    };
  }, [branchFilter, departmentFilter, searchEmp, employees]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // 4. Filter approved leave requests
  const approvedRequests = useMemo(() => {
    return requests.filter((r) => {
      if (r.status !== 'APPROVED') return false;
      if (leaveTypeFilter !== 'ALL' && r.leaveTypeId !== leaveTypeFilter) return false;
      if (departmentFilter !== 'ALL' && r.employee?.department?.name !== departmentFilter) {
        return false;
      }
      if (branchFilter !== 'ALL') {
        const empBranch = r.employee?.branch?.name || (r.employee as any)?.location;
        if (empBranch && !empBranch.toLowerCase().includes(branchFilter.toLowerCase())) {
          return false;
        }
      }
      if (searchEmp.trim()) {
        const q = searchEmp.toLowerCase();
        const empName = `${r.employee?.firstName || ''} ${r.employee?.lastName || ''}`.toLowerCase();
        const empCode = r.employee?.employeeCode?.toLowerCase() || '';
        if (!empName.includes(q) && !empCode.includes(q)) return false;
      }
      return true;
    });
  }, [requests, leaveTypeFilter, departmentFilter, branchFilter, searchEmp]);

  // 5. Build combined grid days: Holiday Calendar + Approved Leave + Weekly Off
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const days = [];

    // Preceding blanks
    for (let i = 0; i < firstDay; i++) {
      days.push({ dayNumber: null, dateKey: null });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const monthStr = String(currentMonth + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateKey = `${currentYear}-${monthStr}-${dayStr}`;
      const dayOfWeek = new Date(currentYear, currentMonth, d).getDay();
      const weekdayName = WEEKDAY_NAMES[dayOfWeek];

      // Find approved leaves covering this date
      const dateObj = new Date(currentYear, currentMonth, d);
      const activeLeaves = approvedRequests.filter((r) => {
        const s = new Date(r.startDate);
        const e = new Date(r.endDate);
        s.setHours(0, 0, 0, 0);
        e.setHours(23, 59, 59, 999);
        return dateObj >= s && dateObj <= e;
      });

      const holidayObj = holidayMap[dateKey];
      const isHoliday = !!holidayObj && isHolidayApplicable(holidayObj);
      const isOptionalHoliday =
        isHoliday &&
        (holidayObj.isOptional === true ||
          holidayObj.type?.toLowerCase().includes('optional') ||
          holidayObj.type?.toLowerCase().includes('restricted'));

      const isSunday = dayOfWeek === 0;
      const isSaturday = dayOfWeek === 6;

      const isToday = currentYear === 2026 && currentMonth === 8 && d === 10; // 10 Sep 2026 simulation

      days.push({
        dayNumber: d,
        dateKey,
        dayOfWeek,
        weekdayName,
        isSunday,
        isSaturday,
        isHoliday,
        holiday: isHoliday ? holidayObj : null,
        holidayName: isHoliday ? holidayObj.name : '',
        isOptionalHoliday,
        isToday,
        leaves: activeLeaves,
      });
    }

    return days;
  }, [
    currentYear,
    currentMonth,
    approvedRequests,
    holidayMap,
    isHolidayApplicable,
  ]);

  // Month Statistics
  const monthStats = useMemo(() => {
    let leavesCount = 0;
    let holidaysCount = 0;
    let optionalCount = 0;
    let weeklyOffCount = 0;

    calendarDays.forEach((d: any) => {
      if (!d.dayNumber) return;
      if (d.leaves && d.leaves.length > 0) {
        leavesCount += d.leaves.length;
      }
      if (d.isHoliday) {
        if (d.isOptionalHoliday) optionalCount++;
        else holidaysCount++;
      }
      if (d.isSunday) weeklyOffCount++;
    });

    return {
      leavesCount,
      holidaysCount,
      optionalCount,
      weeklyOffCount,
    };
  }, [calendarDays]);

  // Selected date details
  const selectedDateInfo = useMemo(() => {
    if (!selectedDate) return null;
    const day = calendarDays.find((d: any) => d.dateKey === selectedDate);
    return day || null;
  }, [selectedDate, calendarDays]);

  const hasActiveFilters =
    branchFilter !== 'ALL' ||
    departmentFilter !== 'ALL' ||
    leaveTypeFilter !== 'ALL' ||
    searchEmp.trim() !== '';

  const resetFilters = () => {
    setBranchFilter('ALL');
    setDepartmentFilter('ALL');
    setLeaveTypeFilter('ALL');
    setSearchEmp('');
  };

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & LEGEND SECTION
          ───────────────────────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Calendar Title & Month Navigation */}
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Attendance & Leave Management
              </div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-indigo-600" />
                <span>LEAVE CALENDAR</span>
              </h2>
            </div>

            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/80 shadow-2xs ml-0 sm:ml-4">
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Previous Month"
                className="h-8 w-8 rounded-lg bg-white hover:bg-slate-100 flex items-center justify-center text-slate-700 shadow-2xs transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="px-3.5 py-1 text-sm font-bold text-slate-900 min-w-[150px] text-center">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </div>
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Next Month"
                className="h-8 w-8 rounded-lg bg-white hover:bg-slate-100 flex items-center justify-center text-slate-700 shadow-2xs transition-colors cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setCurrentYear(2026);
                setCurrentMonth(8);
              }}
              className="h-9 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              <span>Today (Sep 2026)</span>
            </button>
          </div>

          {/* Exact User Specification Legend */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs bg-slate-50/80 p-2 rounded-xl border border-slate-200/70">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
              Legend:
            </span>

            {/* 🟢 Approved Leave */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200/80 shadow-2xs font-semibold text-[11px]">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0 ring-2 ring-emerald-200" />
              <span>🟢 Approved Leave</span>
            </div>

            {/* 🔴 Public Holiday */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-900 border border-rose-200/80 shadow-2xs font-semibold text-[11px]">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-600 shrink-0 ring-2 ring-rose-200" />
              <span>🔴 Public Holiday</span>
            </div>

            {/* ⚪ Weekly Off */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-300/80 shadow-2xs font-semibold text-[11px]">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-400 shrink-0 ring-2 ring-slate-200" />
              <span>⚪ Weekly Off</span>
            </div>

            {/* 🟣 Optional / Restricted Holiday */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-900 border border-purple-200/80 shadow-2xs font-semibold text-[11px]">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-600 shrink-0 ring-2 ring-purple-200" />
              <span>🟣 Optional / Restricted Holiday</span>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            2. INTERACTIVE APPLICABILITY FILTERS TOOLBAR
            ───────────────────────────────────────────────────────────── */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
          {/* Branch Filter */}
          <div className="w-48">
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="h-8 text-xs bg-slate-50/60 border-slate-200">
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {branchFilter === 'ALL' ? 'All Branches' : branchFilter}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">
                  All Branches (Organization)
                </SelectItem>
                {branches && branches.length > 0 ? (
                  branches.map((b: any) => (
                    <SelectItem key={b.id || b.name} value={b.name} className="text-xs">
                      {b.name}
                    </SelectItem>
                  ))
                ) : (
                  <>
                    <SelectItem value="Pune Manufacturing Plant" className="text-xs">
                      Pune Manufacturing Plant
                    </SelectItem>
                    <SelectItem value="Mumbai Office" className="text-xs">
                      Mumbai Office
                    </SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Department Filter */}
          <div className="w-48">
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="h-8 text-xs bg-slate-50/60 border-slate-200">
                <div className="flex items-center gap-1.5 truncate">
                  <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {departmentFilter === 'ALL' ? 'All Departments' : departmentFilter}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">
                  All Departments
                </SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept} className="text-xs">
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Leave Type Filter */}
          <div className="w-48">
            <Select value={leaveTypeFilter} onValueChange={setLeaveTypeFilter}>
              <SelectTrigger className="h-8 text-xs bg-slate-50/60 border-slate-200">
                <div className="flex items-center gap-1.5 truncate">
                  <Palmtree className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {leaveTypeFilter === 'ALL'
                      ? 'All Leave Types'
                      : leaveTypes.find((t) => t.id === leaveTypeFilter)?.name || 'Leave Type'}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">
                  All Leave Types
                </SelectItem>
                {leaveTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id} className="text-xs">
                    {type.name} ({type.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search Employee */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search employee by name or code..."
              value={searchEmp}
              onChange={(e) => setSearchEmp(e.target.value)}
              className="h-8 pl-8 text-xs bg-slate-50/60 border-slate-200 rounded-lg"
            />
            {searchEmp && (
              <button
                type="button"
                onClick={() => setSearchEmp('')}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <Button
              size="sm"
              variant="ghost"
              onClick={resetFilters}
              className="h-8 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Filters</span>
            </Button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. MONTH SUMMARY CARDS
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-2xl border border-slate-200/80 bg-white shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">
              {new Date(currentYear, currentMonth + 1, 0).getDate()} Days
            </div>
            <div className="text-[11px] text-slate-400 font-medium">Calendar Duration</div>
          </div>
        </div>

        <div className="p-3 rounded-2xl border border-slate-200/80 bg-white shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Palmtree className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-emerald-600">
              {monthStats.leavesCount} Leaves
            </div>
            <div className="text-[11px] text-slate-400 font-medium">Approved Employee Leaves</div>
          </div>
        </div>

        <div className="p-3 rounded-2xl border border-slate-200/80 bg-white shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <PartyPopper className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-rose-600">
              {monthStats.holidaysCount + monthStats.optionalCount} Declared Holidays
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              {monthStats.holidaysCount} Public • {monthStats.optionalCount} Optional
            </div>
          </div>
        </div>

        <div className="p-3 rounded-2xl border border-slate-200/80 bg-white shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Coffee className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-700">
              {monthStats.weeklyOffCount} Weekly Offs
            </div>
            <div className="text-[11px] text-slate-400 font-medium">Sunday Rosters Applied</div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. CALENDAR GRID: COMBINED HOLIDAYS + LEAVES + WEEKLY OFF
          ───────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 text-center text-xs font-bold text-slate-700 bg-slate-50/80">
          <div className="py-2.5 text-rose-600 bg-rose-50/40 border-r border-slate-200/60 font-black">
            Sunday
          </div>
          <div className="py-2.5 border-r border-slate-200/60">Monday</div>
          <div className="py-2.5 border-r border-slate-200/60">Tuesday</div>
          <div className="py-2.5 border-r border-slate-200/60">Wednesday</div>
          <div className="py-2.5 border-r border-slate-200/60">Thursday</div>
          <div className="py-2.5 border-r border-slate-200/60">Friday</div>
          <div className="py-2.5">Saturday</div>
        </div>

        {/* Calendar Day Cells */}
        <div className="grid grid-cols-7 min-h-[580px] divide-x divide-y divide-slate-100 text-xs">
          {calendarDays.map((item: any, idx: number) => {
            if (!item.dateKey) {
              return (
                <div
                  key={`blank-${idx}`}
                  className="bg-slate-50/30 p-2 border-r border-b border-slate-100/80"
                />
              );
            }

            const hasLeaves = item.leaves && item.leaves.length > 0;
            const isSunday = item.isSunday;

            return (
              <div
                key={item.dateKey}
                onClick={() => setSelectedDate(item.dateKey)}
                className={`p-2 min-h-[126px] transition-all cursor-pointer relative flex flex-col justify-between group border-b border-slate-100 ${
                  item.isToday
                    ? 'bg-indigo-50/30 ring-2 ring-indigo-500/40 z-10'
                    : isSunday
                    ? 'bg-slate-50/50 hover:bg-slate-100/70'
                    : item.isHoliday
                    ? item.isOptionalHoliday
                      ? 'bg-purple-50/25 hover:bg-purple-50/50'
                      : 'bg-rose-50/25 hover:bg-rose-50/50'
                    : 'bg-white hover:bg-indigo-50/20'
                }`}
              >
                {/* 1. TOP ROW: Date Number, Day Name & Status Badges */}
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs ${
                          item.isToday
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : isSunday
                            ? 'text-rose-600 font-black'
                            : 'text-slate-800 group-hover:text-indigo-600'
                        }`}
                      >
                        {item.dayNumber}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                        {item.weekdayName?.slice(0, 3)}
                      </span>
                    </div>

                    {item.isToday && (
                      <span className="text-[9px] font-bold text-indigo-600 bg-indigo-100/70 px-1.5 py-0.2 rounded-full border border-indigo-200 mt-0.5 inline-block">
                        Today
                      </span>
                    )}
                  </div>

                  {/* Top Badge: Holiday indicator */}
                  {item.isHoliday && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                        item.isOptionalHoliday
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-rose-100 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {item.isOptionalHoliday ? '🟣 Optional' : '🔴 Holiday'}
                    </span>
                  )}
                </div>

                {/* 2. BODY CONTENT: Holiday Card + Leaves List */}
                <div className="space-y-1.5 my-1.5">
                  {/* A. Declared Holiday Display (🔴 or 🟣) */}
                  {item.isHoliday && item.holiday && (
                    <div
                      className={`p-1.5 rounded-lg border text-left text-xs transition-shadow shadow-2xs ${
                        item.isOptionalHoliday
                          ? 'bg-purple-50/90 border-purple-200 text-purple-900'
                          : 'bg-rose-50/90 border-rose-200 text-rose-900'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-[11px] leading-tight">
                        <span
                          className={`h-2 w-2 rounded-full shrink-0 ${
                            item.isOptionalHoliday ? 'bg-purple-600' : 'bg-rose-600'
                          }`}
                        />
                        <span className="truncate">{item.holiday.name}</span>
                      </div>
                      <div
                        className={`text-[9px] pl-3.5 font-medium leading-none mt-0.5 ${
                          item.isOptionalHoliday ? 'text-purple-600' : 'text-rose-600'
                        }`}
                      >
                        {item.isOptionalHoliday
                          ? 'Restricted / Optional'
                          : 'Public Holiday'}
                      </div>
                    </div>
                  )}

                  {/* B. Approved Leave Display (🟢) */}
                  {item.leaves && item.leaves.length > 0 && (
                    <div className="space-y-1">
                      {item.leaves.slice(0, 2).map((leave: any) => {
                        const code = leave.leaveType?.code || 'LV';
                        return (
                          <div
                            key={leave.id}
                            className="p-1 px-1.5 rounded-lg border bg-emerald-50/90 border-emerald-200 text-emerald-900 text-[11px] font-semibold flex items-center justify-between shadow-2xs"
                            title={`${leave.employee?.firstName || ''} ${
                              leave.employee?.lastName || ''
                            } (${code}) - ${leave.leaveType?.name || 'Leave'}`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                              <span className="truncate">
                                {leave.employee?.firstName} ({code})
                              </span>
                            </div>
                            {leave.duration === 'HALF_DAY' && (
                              <span className="text-[8px] font-bold px-1 bg-white/90 rounded border border-emerald-300 shrink-0 ml-1 text-emerald-700">
                                ½d
                              </span>
                            )}
                          </div>
                        );
                      })}

                      {item.leaves.length > 2 && (
                        <div className="text-[10px] font-bold text-emerald-700 bg-emerald-100/60 rounded px-1.5 py-0.5 text-center">
                          +{item.leaves.length - 2} more on leave
                        </div>
                      )}
                    </div>
                  )}

                  {/* C. Weekly Off Display (⚪) if Sunday and no other items */}
                  {isSunday && !item.isHoliday && (!item.leaves || item.leaves.length === 0) && (
                    <div className="p-1 px-1.5 rounded-lg border bg-slate-50 border-slate-200/80 text-slate-500 text-[11px] font-medium flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-slate-400 shrink-0" />
                      <span>Weekly Off</span>
                    </div>
                  )}
                </div>

                {/* 3. BOTTOM FOOTER STATUS */}
                <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100/80">
                  {isSunday && !item.isHoliday && (!item.leaves || item.leaves.length === 0) ? (
                    <span className="text-slate-400 font-medium">⚪ Weekly Off</span>
                  ) : item.isHoliday && hasLeaves ? (
                    <span className="font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 truncate">
                      🔴 Holiday + 🟢 {item.leaves.length} Leave
                    </span>
                  ) : item.isHoliday ? (
                    <span className="text-rose-600 font-medium">🔴 Off Duty</span>
                  ) : hasLeaves ? (
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 ml-auto">
                      🟢 {item.leaves.length} on leave
                    </span>
                  ) : (
                    <span className="text-slate-300 group-hover:text-slate-400">On Duty</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. DAY INSPECTION MODAL (FULL DETAILS FOR COMBINED DATE)
          ───────────────────────────────────────────────────────────── */}
      {selectedDateInfo && (
        <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
          <DialogContent className="sm:max-w-lg rounded-2xl bg-white border-slate-200 p-0 overflow-hidden shadow-xl">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-indigo-50 via-slate-50 to-white border-b border-slate-100">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                      <CalendarIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-base font-bold text-slate-900">
                        {selectedDateInfo.dayNumber} {MONTH_NAMES[currentMonth]} {currentYear}
                      </DialogTitle>
                      <DialogDescription className="text-xs text-slate-500">
                        {selectedDateInfo.weekdayName} •{' '}
                        {selectedDateInfo.isSunday
                          ? 'Sunday Weekly Off'
                          : selectedDateInfo.isHoliday
                          ? `${selectedDateInfo.isOptionalHoliday ? 'Optional' : 'Public'} Holiday`
                          : 'Working Day'}
                      </DialogDescription>
                    </div>
                  </div>

                  {selectedDateInfo.isHoliday && (
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        selectedDateInfo.isOptionalHoliday
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {selectedDateInfo.isOptionalHoliday ? '🟣' : '🔴'}{' '}
                      {selectedDateInfo.holidayName}
                    </span>
                  )}
                </div>
              </DialogHeader>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* A. Declared Holiday Card in Modal */}
              {selectedDateInfo.isHoliday && selectedDateInfo.holiday && (
                <div
                  className={`p-4 rounded-2xl border space-y-2 ${
                    selectedDateInfo.isOptionalHoliday
                      ? 'bg-purple-50/50 border-purple-200'
                      : 'bg-rose-50/50 border-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">
                        {selectedDateInfo.isOptionalHoliday ? '🟣' : '🔴'}
                      </span>
                      <span className="font-bold text-sm text-slate-900">
                        {selectedDateInfo.holiday.name}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        selectedDateInfo.isOptionalHoliday
                          ? 'bg-purple-100 text-purple-800 border-purple-200'
                          : 'bg-rose-100 text-rose-800 border-rose-200'
                      }
                    >
                      {selectedDateInfo.holiday.type || 'Mandatory'}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-600">
                    {selectedDateInfo.holiday.description ||
                      'Declared holiday from Organization Work Calendar.'}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-rose-200/60">
                    <div>
                      <span className="text-slate-400">Applicability: </span>
                      <span className="font-semibold text-slate-700">
                        {selectedDateInfo.holiday.applicableTarget ||
                          selectedDateInfo.holiday.applicableTo ||
                          'Company-wide'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Payroll Impact: </span>
                      <span className="font-semibold text-emerald-700">
                        {selectedDateInfo.holiday.isPaid !== false ? 'Paid Holiday' : 'Unpaid'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* B. Employees On Leave Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Employees On Approved Leave ({selectedDateInfo.leaves?.length || 0})</span>
                  {selectedDateInfo.leaves?.length > 0 && (
                    <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Approved
                    </span>
                  )}
                </div>

                {!selectedDateInfo.leaves || selectedDateInfo.leaves.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-500 space-y-1.5">
                    <CheckCircle2 className="h-7 w-7 mx-auto text-emerald-500" />
                    <div className="font-bold text-slate-700">No Approved Employee Absences</div>
                    <p className="text-slate-400 text-[11px]">
                      No employee leave applications scheduled for this date.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedDateInfo.leaves.map((l: any) => {
                      const code = l.leaveType?.code || 'LV';
                      const style = getLeaveBadgeStyle(code);

                      return (
                        <div
                          key={l.id}
                          className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-200 transition-colors shadow-2xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`h-8 w-8 rounded-full ${style.avatarBg} font-bold text-xs flex items-center justify-center shadow-2xs`}
                              >
                                {l.employee?.firstName?.[0] || 'E'}
                                {l.employee?.lastName?.[0] || ''}
                              </div>
                              <div>
                                <div className="font-bold text-xs text-slate-900">
                                  {l.employee?.firstName} {l.employee?.lastName}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono">
                                  {l.employee?.employeeCode || 'EMP'} •{' '}
                                  {l.employee?.department?.name || 'General'}
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.bg} ${style.border} ${style.text}`}
                              >
                                {code} — {l.leaveType?.name || 'Leave'}
                              </span>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {l.duration === 'HALF_DAY' ? 'Half Day' : 'Full Day'}
                              </div>
                            </div>
                          </div>

                          {l.reason && (
                            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 italic">
                              "{l.reason}"
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                            <span>
                              {new Date(l.startDate).toLocaleDateString()} →{' '}
                              {new Date(l.endDate).toLocaleDateString()}
                            </span>
                            <span className="font-semibold text-emerald-600">
                              Approved
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedDate(null)}
                className="rounded-xl text-xs cursor-pointer"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
