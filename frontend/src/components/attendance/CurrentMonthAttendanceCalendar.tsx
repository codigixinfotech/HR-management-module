import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Check, Clock, ShieldCheck, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface AttendanceDayData {
  date: string; // YYYY-MM-DD
  dayNumber: number;
  dayName: string; // SUN, MON, etc.
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'HALF_DAY' | 'ON_LEAVE' | 'WEEKLY_OFF' | 'HOLIDAY' | 'UPCOMING';
  checkIn?: string;
  checkOut?: string;
  workHours?: string;
  holidayName?: string;
  hasFaceId?: boolean;
  hasGps?: boolean;
  faceMatchScore?: number;
  distanceMeters?: number;
}

interface CurrentMonthAttendanceCalendarProps {
  selectedDate: string;
  onSelectDate: (dateStr: string, dayData?: AttendanceDayData) => void;
  employeeId?: string;
}

export function CurrentMonthAttendanceCalendar({
  selectedDate,
  onSelectDate,
}: CurrentMonthAttendanceCalendarProps) {
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(7); // 0-indexed (7 = August)

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Helper to format date string YYYY-MM-DD
  const formatDateString = (year: number, month: number, day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  // Generate calendar days for the current month
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

    const days: AttendanceDayData[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDateString(currentYear, currentMonth, day);
      const dateObj = new Date(currentYear, currentMonth, day);
      const dayOfWeek = dateObj.getDay();

      let status: AttendanceDayData['status'] = 'PRESENT';
      let checkIn = '09:02 AM';
      let checkOut = '06:41 PM';
      let workHours = '9h 39m';
      let holidayName: string | undefined = undefined;
      let hasFaceId = true;
      let hasGps = true;

      if (dayOfWeek === 0 || dayOfWeek === 6) {
        status = 'WEEKLY_OFF';
        checkIn = undefined;
        checkOut = undefined;
        workHours = undefined;
        hasFaceId = false;
        hasGps = false;
      } else if (day === 15) {
        status = 'HOLIDAY';
        holidayName = 'Independence Day';
        checkIn = undefined;
        checkOut = undefined;
        workHours = undefined;
        hasFaceId = false;
        hasGps = false;
      } else if (day === 19) {
        status = 'ON_LEAVE';
        checkIn = undefined;
        checkOut = undefined;
        workHours = undefined;
        hasFaceId = false;
        hasGps = false;
      } else if (day === 7) {
        status = 'LATE';
        checkIn = '09:42 AM';
        checkOut = '06:45 PM';
        workHours = '9h 03m';
      } else if (day > 21) {
        status = 'UPCOMING';
        checkIn = undefined;
        checkOut = undefined;
        workHours = undefined;
        hasFaceId = false;
        hasGps = false;
      }

      days.push({
        date: dateStr,
        dayNumber: day,
        dayName: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][dayOfWeek],
        status,
        checkIn,
        checkOut,
        workHours,
        holidayName,
        hasFaceId,
        hasGps,
        faceMatchScore: status === 'PRESENT' ? 96.7 : status === 'LATE' ? 91.5 : undefined,
        distanceMeters: 42,
      });
    }

    return { firstDayIndex, days };
  }, [currentYear, currentMonth]);

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

  const handleTodayClick = () => {
    setCurrentYear(2026);
    setCurrentMonth(7);
    onSelectDate('2026-08-21');
  };

  return (
    <Card className="shadow-xs border-border/80 h-full">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CalendarIcon className="h-4.5 w-4.5 text-primary" /> Current Month Attendance Calendar
            </CardTitle>
            <CardDescription className="text-xs">
              Click on any date to view attendance and verification details.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center rounded-lg border border-border/80 p-0.5 bg-muted/20">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-bold px-2 font-mono">
                {monthNames[currentMonth]} {currentYear}
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-semibold"
              onClick={handleTodayClick}
            >
              Today
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-4">
        {/* Days Header */}
        <div className="grid grid-cols-7 text-center mb-2 text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider">
          <div className="py-1">SUN</div>
          <div className="py-1">MON</div>
          <div className="py-1">TUE</div>
          <div className="py-1">WED</div>
          <div className="py-1">THU</div>
          <div className="py-1">FRI</div>
          <div className="py-1">SAT</div>
        </div>

        {/* Month Days Grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {/* Empty cells before month start */}
          {Array.from({ length: calendarDays.firstDayIndex }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-20 sm:h-24 rounded-xl border border-transparent bg-muted/5" />
          ))}

          {/* Actual days */}
          {calendarDays.days.map((dayData) => {
            const isSelected = selectedDate === dayData.date;
            const isToday = dayData.date === '2026-08-21';

            let cellBg = 'bg-card border-border/60 hover:border-primary/50';
            let badgeBg = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20';

            if (dayData.status === 'WEEKLY_OFF') {
              cellBg = 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-500';
              badgeBg = 'bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300/40';
            } else if (dayData.status === 'HOLIDAY') {
              cellBg = 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/40';
              badgeBg = 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/25';
            } else if (dayData.status === 'ON_LEAVE') {
              cellBg = 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40';
              badgeBg = 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25';
            } else if (dayData.status === 'LATE') {
              cellBg = 'bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800/40';
              badgeBg = 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/25';
            } else if (dayData.status === 'PRESENT') {
              cellBg = 'bg-emerald-50/40 dark:bg-emerald-950/15 border-emerald-200/70 dark:border-emerald-800/30';
              badgeBg = 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25';
            } else if (dayData.status === 'UPCOMING') {
              cellBg = 'bg-slate-50/50 dark:bg-slate-900/20 border-slate-200/50 dark:border-slate-800/40 text-slate-400';
              badgeBg = 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200';
            }

            return (
              <div
                key={dayData.date}
                onClick={() => onSelectDate(dayData.date, dayData)}
                className={`relative flex flex-col justify-between p-1.5 sm:p-2 h-20 sm:h-24 rounded-xl border transition-all cursor-pointer shadow-2xs ${cellBg} ${
                  isSelected ? 'ring-2 ring-primary border-primary shadow-md scale-[1.02] z-10' : ''
                } ${isToday ? 'border-primary ring-1 ring-primary/40' : ''}`}
              >
                {/* Day Number Header */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold font-mono ${isToday ? 'text-primary' : ''}`}>
                    {dayData.dayNumber}
                  </span>

                  {isToday && (
                    <Badge className="text-[9px] px-1 py-0 h-3.5 bg-primary text-primary-foreground font-semibold">
                      Today
                    </Badge>
                  )}
                </div>

                {/* Status Badges */}
                <div className="space-y-1 my-auto">
                  <div className="flex items-center justify-center">
                    <Badge
                      variant="outline"
                      className={`text-[9.5px] px-1.5 py-0 h-4 font-semibold w-full justify-center truncate border ${badgeBg}`}
                    >
                      {dayData.holidayName ? dayData.holidayName : dayData.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  {/* Face & GPS Pills */}
                  {dayData.hasFaceId && (
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-[8.5px] font-semibold px-1 py-0.2 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                        Face
                      </span>
                      <span className="text-[8.5px] font-semibold px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                        GPS
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
