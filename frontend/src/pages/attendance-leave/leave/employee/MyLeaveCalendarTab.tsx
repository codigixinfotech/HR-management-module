import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Sparkles,
  Info,
  Palmtree,
  PartyPopper,
  Coffee,
  CheckCircle2,
  Clock,
  Building,
} from 'lucide-react';
import type { LeaveRequest } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface MyLeaveCalendarTabProps {
  requests: LeaveRequest[];
  declaredHolidays?: any[];
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

// Fallback statutory holidays
const INITIAL_HOLIDAYS: any[] = [
  { name: 'Republic Day', date: '2026-01-26', type: 'Mandatory', isOptional: false },
  { name: 'Ambedkar Jayanti', date: '2026-04-14', type: 'Regional', isOptional: false },
  { name: 'Maharashtra Day', date: '2026-05-01', type: 'Regional', isOptional: false },
  { name: 'Independence Day', date: '2026-08-15', type: 'Mandatory', isOptional: false },
  { name: 'Ganesh Chaturthi', date: '2026-09-19', type: 'Regional', isOptional: false },
  { name: 'hoilday', date: '2026-09-22', type: 'Mandatory', isOptional: false },
  { name: 'Anant Chaturdashi', date: '2026-09-28', type: 'Regional', isOptional: false },
  { name: 'Gandhi Jayanti', date: '2026-10-02', type: 'Mandatory', isOptional: false },
  { name: 'Dussehra (Vijayadashami)', date: '2026-10-20', type: 'Restricted / Optional', isOptional: true },
  { name: 'Diwali (Laxmi Pujan)', date: '2026-11-08', type: 'Mandatory', isOptional: false },
  { name: 'Christmas Day', date: '2026-12-25', type: 'Mandatory', isOptional: false },
];

export function MyLeaveCalendarTab({
  requests,
  declaredHolidays = [],
}: MyLeaveCalendarTabProps) {
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(8); // 8 is September (0-indexed)
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Build declared holiday map from Work Calendar
  const holidayMap = useMemo(() => {
    const map: Record<string, any> = {};

    INITIAL_HOLIDAYS.forEach((h) => {
      if (h.date) map[h.date] = h;
    });

    declaredHolidays.forEach((h: any) => {
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
  }, [declaredHolidays]);

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

  // Build grid days combining: Approved Leave + Pending Leave + Holiday + Weekly Off
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const days = [];

    // Preceding blanks
    for (let i = 0; i < firstDay; i++) {
      days.push({ dayNumber: null, dateKey: null });
    }

    // Days in month
    for (let d = 1; d <= daysInMonth; d++) {
      const monthStr = String(currentMonth + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateKey = `${currentYear}-${monthStr}-${dayStr}`;
      const dayOfWeek = new Date(currentYear, currentMonth, d).getDay();
      const weekdayName = WEEKDAY_NAMES[dayOfWeek];

      const dateObj = new Date(currentYear, currentMonth, d);

      // Find my leaves on this date
      const myLeaves = requests.filter((r) => {
        if (r.status === 'CANCELLED' || r.status === 'REJECTED') return false;
        const s = new Date(r.startDate);
        const e = new Date(r.endDate);
        s.setHours(0, 0, 0, 0);
        e.setHours(23, 59, 59, 999);
        return dateObj >= s && dateObj <= e;
      });

      const approvedLeaves = myLeaves.filter((r) => r.status === 'APPROVED');
      const pendingLeaves = myLeaves.filter((r) => r.status === 'PENDING');

      const holiday = holidayMap[dateKey] || null;
      const isHoliday = !!holiday;
      const isOptionalHoliday =
        isHoliday &&
        (holiday.isOptional === true ||
          holiday.type?.toLowerCase().includes('optional') ||
          holiday.type?.toLowerCase().includes('restricted'));

      const isSunday = dayOfWeek === 0;
      const isSaturday = dayOfWeek === 6;
      const isToday = currentYear === 2026 && currentMonth === 8 && d === 10;

      days.push({
        dayNumber: d,
        dateKey,
        dayOfWeek,
        weekdayName,
        isSunday,
        isSaturday,
        isHoliday,
        holiday,
        holidayName: holiday?.name || '',
        isOptionalHoliday,
        isToday,
        approvedLeaves,
        pendingLeaves,
        hasLeaves: myLeaves.length > 0,
      });
    }

    return days;
  }, [currentYear, currentMonth, requests, holidayMap]);

  // Selected date details
  const selectedDateInfo = useMemo(() => {
    if (!selectedDate) return null;
    return calendarDays.find((d) => d.dateKey === selectedDate) || null;
  }, [selectedDate, calendarDays]);

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* 1. Header Controls & Legend Bar */}
      <div className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Title & Month Navigation */}
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Personal Schedule
              </div>
              <h3 className="text-base font-black tracking-tight text-slate-900 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-indigo-600" />
                <span>My Leave & Holiday Calendar</span>
              </h3>
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
              <div className="px-3.5 py-1 text-sm font-bold text-slate-900 min-w-[140px] text-center">
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
              className="h-8 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="h-3 w-3 text-indigo-600" />
              <span>Today (Sep 2026)</span>
            </button>
          </div>

          {/* User Legend */}
          <div className="flex flex-wrap items-center gap-2 text-xs bg-slate-50/80 p-2 rounded-xl border border-slate-200/70">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
              Legend:
            </span>

            {/* 🟢 Approved Leave */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-2xs font-semibold text-[11px]">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>🟢 Approved Leave</span>
            </div>

            {/* 🟡 Pending Leave */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 shadow-2xs font-semibold text-[11px]">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span>🟡 Pending Leave</span>
            </div>

            {/* 🔴 Public Holiday */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-900 border border-rose-200 shadow-2xs font-semibold text-[11px]">
              <span className="h-2 w-2 rounded-full bg-rose-600" />
              <span>🔴 Public Holiday</span>
            </div>

            {/* ⚪ Weekly Off */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs font-semibold text-[11px]">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              <span>⚪ Weekly Off</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Calendar Grid */}
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

        {/* Days Grid Cells */}
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
                    : item.hasLeaves
                    ? 'bg-emerald-50/20 hover:bg-emerald-50/40'
                    : 'bg-white hover:bg-indigo-50/20'
                }`}
              >
                {/* Top Row: Date Number & Badges */}
                <div className="flex items-start justify-between gap-1">
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

                  {item.isHoliday && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        item.isOptionalHoliday
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-rose-100 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {item.isOptionalHoliday ? '🟣 Optional' : '🔴 Holiday'}
                    </span>
                  )}
                </div>

                {/* Body Content */}
                <div className="space-y-1.5 my-1.5">
                  {/* Holiday Display */}
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
                        {item.isOptionalHoliday ? 'Optional Holiday' : 'Public Holiday'}
                      </div>
                    </div>
                  )}

                  {/* My Approved Leaves (🟢) */}
                  {item.approvedLeaves && item.approvedLeaves.length > 0 && (
                    <div className="space-y-1">
                      {item.approvedLeaves.map((leave: any) => (
                        <div
                          key={leave.id}
                          className="p-1 px-1.5 rounded-lg border bg-emerald-50/90 border-emerald-200 text-emerald-900 text-[11px] font-semibold flex items-center justify-between shadow-2xs"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                            <span className="truncate">
                              {leave.leaveType?.name || 'Leave'} ({leave.leaveType?.code || 'LV'})
                            </span>
                          </div>
                          {leave.duration === 'HALF_DAY' && (
                            <span className="text-[8px] font-bold px-1 bg-white/90 rounded border border-emerald-300 shrink-0 ml-1 text-emerald-700">
                              ½d
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* My Pending Leaves (🟡) */}
                  {item.pendingLeaves && item.pendingLeaves.length > 0 && (
                    <div className="space-y-1">
                      {item.pendingLeaves.map((leave: any) => (
                        <div
                          key={leave.id}
                          className="p-1 px-1.5 rounded-lg border bg-amber-50/90 border-amber-200 text-amber-900 text-[11px] font-semibold flex items-center justify-between shadow-2xs"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                            <span className="truncate">
                              {leave.leaveType?.code || 'LV'} (Pending)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Weekly Off (⚪) */}
                  {isSunday && !item.isHoliday && (!item.hasLeaves) && (
                    <div className="p-1 px-1.5 rounded-lg border bg-slate-50 border-slate-200/80 text-slate-500 text-[11px] font-medium flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-slate-400 shrink-0" />
                      <span>Weekly Off</span>
                    </div>
                  )}
                </div>

                {/* Bottom Status */}
                <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100/80">
                  {isSunday && !item.isHoliday && !item.hasLeaves ? (
                    <span className="text-slate-400 font-medium">⚪ Weekly Off</span>
                  ) : item.isHoliday && item.hasLeaves ? (
                    <span className="font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 truncate">
                      🔴 Holiday + 🟢 Leave
                    </span>
                  ) : item.isHoliday ? (
                    <span className="text-rose-600 font-medium">🔴 Off Duty</span>
                  ) : item.hasLeaves ? (
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 ml-auto">
                      🟢 On Leave
                    </span>
                  ) : (
                    <span className="text-slate-300 group-hover:text-slate-400">Working Day</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Inspection Modal */}
      {selectedDateInfo && (
        <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
          <DialogContent className="sm:max-w-md rounded-2xl bg-white border-slate-200 p-0 overflow-hidden shadow-xl">
            <div className="p-5 bg-gradient-to-r from-indigo-50 via-slate-50 to-white border-b border-slate-100">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                      <CalendarIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <DialogTitle className="text-base font-bold text-slate-900">
                        {selectedDateInfo.dayNumber} {MONTH_NAMES[currentMonth]} {currentYear}
                      </DialogTitle>
                      <DialogDescription className="text-xs text-slate-500">
                        {selectedDateInfo.weekdayName} •{' '}
                        {selectedDateInfo.isSunday
                          ? 'Weekly Off'
                          : selectedDateInfo.isHoliday
                          ? 'Declared Holiday'
                          : 'Working Day'}
                      </DialogDescription>
                    </div>
                  </div>

                  {selectedDateInfo.isHoliday && (
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
                      🔴 {selectedDateInfo.holidayName}
                    </span>
                  )}
                </div>
              </DialogHeader>
            </div>

            <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto text-xs">
              {/* Holiday Info */}
              {selectedDateInfo.isHoliday && (
                <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 space-y-1">
                  <div className="font-bold text-rose-900 text-xs">
                    🔴 {selectedDateInfo.holiday.name}
                  </div>
                  <div className="text-[11px] text-rose-700">
                    {selectedDateInfo.holiday.description || 'Statutory Declared Holiday'}
                  </div>
                  <div className="text-[10px] text-rose-600 font-semibold pt-1">
                    Applicability: {selectedDateInfo.holiday.applicableTarget || 'Company Entities'} • Paid Holiday
                  </div>
                </div>
              )}

              {/* Leave Info */}
              {selectedDateInfo.approvedLeaves?.length > 0 && (
                <div className="space-y-1.5">
                  <div className="font-bold text-slate-700 text-xs">Approved Leave Scheduled</div>
                  {selectedDateInfo.approvedLeaves.map((l: any) => (
                    <div
                      key={l.id}
                      className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 space-y-1"
                    >
                      <div className="font-bold text-xs">
                        🟢 {l.leaveType?.name} ({l.leaveType?.code})
                      </div>
                      <div className="text-[11px] text-emerald-700">
                        Reason: "{l.reason || 'Personal Time Off'}"
                      </div>
                      <div className="text-[10px] text-emerald-600 font-semibold">
                        Status: Approved by Manager • Roster marked LEAVE
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedDateInfo.pendingLeaves?.length > 0 && (
                <div className="space-y-1.5">
                  <div className="font-bold text-slate-700 text-xs">Pending Applications</div>
                  {selectedDateInfo.pendingLeaves.map((l: any) => (
                    <div
                      key={l.id}
                      className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 space-y-1"
                    >
                      <div className="font-bold text-xs">
                        ⏳ {l.leaveType?.name} ({l.leaveType?.code})
                      </div>
                      <div className="text-[11px] text-amber-700">
                        Awaiting manager review and approval
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!selectedDateInfo.isHoliday && !selectedDateInfo.hasLeaves && (
                <div className="p-6 text-center rounded-xl bg-slate-50 border border-slate-100 text-slate-500">
                  <div className="font-bold text-slate-700">
                    {selectedDateInfo.isSunday ? 'Sunday Weekly Off' : 'Standard Working Day'}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {selectedDateInfo.isSunday
                      ? 'Scheduled weekly rest day. No punch required.'
                      : 'Regular working shift assigned. On duty.'}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedDate(null)}
                className="rounded-xl text-xs"
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
