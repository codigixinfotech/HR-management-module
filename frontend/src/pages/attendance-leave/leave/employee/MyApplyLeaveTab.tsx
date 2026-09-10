import { useState, useMemo, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Palmtree,
  ShieldCheck,
  Send,
  Sparkles,
  Info,
  CalendarCheck,
  Paperclip,
} from 'lucide-react';
import type { LeaveBalance, LeaveType } from '@/api/types';
import { leaveRequestsApi } from '@/api/attendance-leave';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MyApplyLeaveTabProps {
  companyId?: string;
  currentEmployeeId?: string;
  leaveTypes: LeaveType[];
  balances: LeaveBalance[];
  declaredHolidays?: any[];
  preselectedTypeId?: string;
  onSuccessRedirect: () => void;
}

export function MyApplyLeaveTab({
  companyId,
  currentEmployeeId,
  leaveTypes,
  balances,
  declaredHolidays = [],
  preselectedTypeId,
  onSuccessRedirect,
}: MyApplyLeaveTabProps) {
  const queryClient = useQueryClient();

  const [leaveTypeId, setLeaveTypeId] = useState(
    preselectedTypeId || leaveTypes[0]?.id || ''
  );
  const [duration, setDuration] = useState<'FULL_DAY' | 'HALF_DAY' | 'CUSTOM'>('FULL_DAY');
  const [halfDaySession, setHalfDaySession] = useState<'FIRST_HALF' | 'SECOND_HALF'>('FIRST_HALF');

  // Default dates: tomorrow or current system simulation date 2026-09-14
  const [startDate, setStartDate] = useState('2026-09-14');
  const [endDate, setEndDate] = useState('2026-09-14');
  const [reason, setReason] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  // Update selected leave type if preselectedTypeId changes
  useEffect(() => {
    if (preselectedTypeId) {
      setLeaveTypeId(preselectedTypeId);
    }
  }, [preselectedTypeId]);

  // Selected leave balance lookup
  const selectedBalance = useMemo(() => {
    return balances.find((b) => b.leaveTypeId === leaveTypeId);
  }, [balances, leaveTypeId]);

  const selectedType = useMemo(() => {
    return leaveTypes.find((t) => t.id === leaveTypeId);
  }, [leaveTypes, leaveTypeId]);

  const availableDays = useMemo(() => {
    if (!selectedBalance) return selectedType?.annualQuota || 12;
    const allocated = selectedBalance.allocated > 0 ? selectedBalance.allocated : selectedType?.annualQuota || 12;
    const used = selectedBalance.used || 0;
    const pending = (selectedBalance as any).pending || 0;
    return Math.max(0, allocated - used - pending);
  }, [selectedBalance, selectedType]);

  // Normalized declared holiday map
  const holidayDateSet = useMemo(() => {
    const set = new Set<string>();
    declaredHolidays.forEach((h) => {
      if (h.date) {
        const dStr = typeof h.date === 'string' ? h.date.slice(0, 10) : h.date;
        set.add(dStr);
      }
    });
    return set;
  }, [declaredHolidays]);

  // Auto-calculated total working days calculation
  const { totalDays, totalCalendarDays, sundayCount, holidayCount } = useMemo(() => {
    if (duration === 'HALF_DAY') {
      return {
        totalDays: 0.5,
        totalCalendarDays: 1,
        sundayCount: 0,
        holidayCount: 0,
      };
    }

    if (!startDate || !endDate) {
      return { totalDays: 0, totalCalendarDays: 0, sundayCount: 0, holidayCount: 0 };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      return { totalDays: 0, totalCalendarDays: 0, sundayCount: 0, holidayCount: 0 };
    }

    let workingDays = 0;
    let totalDaysCount = 0;
    let sundays = 0;
    let holidays = 0;

    const curr = new Date(start);
    while (curr <= end) {
      totalDaysCount++;
      const dayOfWeek = curr.getDay(); // 0 is Sunday
      const y = curr.getFullYear();
      const m = String(curr.getMonth() + 1).padStart(2, '0');
      const d = String(curr.getDate()).padStart(2, '0');
      const dStr = `${y}-${m}-${d}`;

      if (dayOfWeek === 0) {
        sundays++;
      } else if (holidayDateSet.has(dStr)) {
        holidays++;
      } else {
        workingDays++;
      }

      curr.setDate(curr.getDate() + 1);
    }

    // Default policy: exclude Sundays & Declared Holidays from deduction
    const finalDays = Math.max(1, workingDays);

    return {
      totalDays: finalDays,
      totalCalendarDays: totalDaysCount,
      sundayCount: sundays,
      holidayCount: holidays,
    };
  }, [startDate, endDate, duration, holidayDateSet]);

  // Balance insufficiency warning
  const isBalanceInsufficient = totalDays > availableDays;

  // Submit leave mutation
  const createMutation = useMutation({
    mutationFn: (payload: any) => leaveRequestsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
      toast.success('Leave application submitted successfully! Notification sent to reporting manager.');
      onSuccessRedirect();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to submit leave request');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!leaveTypeId) {
      toast.error('Please select a leave type');
      return;
    }
    if (!startDate || !endDate) {
      toast.error('Please specify valid start and end dates');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      toast.error('Start date cannot be after end date');
      return;
    }
    if (!reason.trim()) {
      toast.error('Please provide a reason for your leave request');
      return;
    }

    createMutation.mutate({
      companyId: companyId || 'cmto136wt01ibipkgbon2sw9s',
      employeeId: currentEmployeeId || 'cmtr2qzm7006zip185kbklj96', // Fallback to Sudarshan
      leaveTypeId,
      startDate,
      endDate: duration === 'HALF_DAY' ? startDate : endDate,
      totalDays,
      duration,
      halfDaySession: duration === 'HALF_DAY' ? halfDaySession : undefined,
      reason: reason.trim(),
      attachmentUrl: attachmentUrl.trim() || undefined,
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans">
      {/* Header Info */}
      <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Palmtree className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-base">Apply for Leave</h3>
            <p className="text-xs text-slate-500">
              Submit your time-off request with automatic balance deduction, weekly-off exclusion, and manager workflow.
            </p>
          </div>
        </div>
      </div>

      {/* Application Form */}
      <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-6">
        {/* 1. Leave Type Selector with Live Balance */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-slate-700">
              Leave Type <span className="text-rose-500">*</span>
            </Label>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Available: {availableDays} Days
            </span>
          </div>

          <Select value={leaveTypeId} onValueChange={setLeaveTypeId}>
            <SelectTrigger className="h-10 text-xs bg-slate-50/50 border-slate-200">
              <SelectValue placeholder="Select leave type" />
            </SelectTrigger>
            <SelectContent>
              {leaveTypes.map((type) => {
                const bal = balances.find((b) => b.leaveTypeId === type.id);
                const avail = bal
                  ? Math.max(0, (bal.allocated || type.annualQuota || 12) - (bal.used || 0) - ((bal as any).pending || 0))
                  : type.annualQuota || 12;

                return (
                  <SelectItem key={type.id} value={type.id} className="text-xs">
                    <div className="flex items-center justify-between gap-4 w-full">
                      <span className="font-semibold">
                        {type.name} ({type.code})
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        {avail} Days Available
                      </span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* 2. Duration Type Toggle */}
        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-700">Duration</Label>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setDuration('FULL_DAY')}
              className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                duration === 'FULL_DAY'
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Full Day
            </button>

            <button
              type="button"
              onClick={() => {
                setDuration('HALF_DAY');
                setEndDate(startDate);
              }}
              className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                duration === 'HALF_DAY'
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Half Day (0.5d)
            </button>

            <button
              type="button"
              onClick={() => setDuration('CUSTOM')}
              className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                duration === 'CUSTOM'
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Custom / Multi-Day
            </button>
          </div>
        </div>

        {/* 3. Half Day Session Picker (if Half Day selected) */}
        {duration === 'HALF_DAY' && (
          <div className="p-3.5 rounded-xl bg-indigo-50/40 border border-indigo-100 space-y-2">
            <Label className="text-xs font-bold text-indigo-900">Select Half Day Session</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setHalfDaySession('FIRST_HALF')}
                className={`py-1.5 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  halfDaySession === 'FIRST_HALF'
                    ? 'bg-white border-indigo-400 text-indigo-800 shadow-xs'
                    : 'bg-transparent border-slate-200 text-slate-600'
                }`}
              >
                First Half (Morning)
              </button>
              <button
                type="button"
                onClick={() => setHalfDaySession('SECOND_HALF')}
                className={`py-1.5 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  halfDaySession === 'SECOND_HALF'
                    ? 'bg-white border-indigo-400 text-indigo-800 shadow-xs'
                    : 'bg-transparent border-slate-200 text-slate-600'
                }`}
              >
                Second Half (Afternoon)
              </button>
            </div>
          </div>
        )}

        {/* 4. Date Range Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">
              From Date <span className="text-rose-500">*</span>
            </Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (duration === 'HALF_DAY') {
                  setEndDate(e.target.value);
                }
              }}
              className="h-10 text-xs bg-slate-50/50 border-slate-200 rounded-xl"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">
              To Date <span className="text-rose-500">*</span>
            </Label>
            <Input
              type="date"
              value={endDate}
              disabled={duration === 'HALF_DAY'}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-10 text-xs bg-slate-50/50 border-slate-200 rounded-xl"
              required
            />
          </div>
        </div>

        {/* 5. Auto-Calculated Total Leave Days & Exclusions Breakdown */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <CalendarCheck className="h-4 w-4 text-indigo-600" />
              <span>Calculated Leave Duration: </span>
              <span className="text-indigo-600 font-black text-sm">
                {totalDays} {totalDays === 1 ? 'Day' : 'Days'}
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              {totalCalendarDays} Calendar Days
              {sundayCount > 0 && ` • Excludes ${sundayCount} Sunday(s)`}
              {holidayCount > 0 && ` • Excludes ${holidayCount} Declared Holiday(s)`}
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[11px] font-semibold text-slate-500">Balance after approval: </span>
            <span
              className={`text-xs font-bold ${
                availableDays - totalDays < 0 ? 'text-rose-600' : 'text-emerald-700'
              }`}
            >
              {Math.max(0, availableDays - totalDays)} Days remaining
            </span>
          </div>
        </div>

        {/* Balance Warning if Insufficient */}
        {isBalanceInsufficient && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>
              Requested duration ({totalDays} days) exceeds your available balance ({availableDays} days).
              Excess days may be marked as Unpaid / Loss of Pay (LOP) per company policy.
            </span>
          </div>
        )}

        {/* 6. Reason / Comments */}
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-700">
            Reason / Comments <span className="text-rose-500">*</span>
          </Label>
          <Textarea
            placeholder="Please describe the reason for taking leave (e.g. personal family event, medical appointment, travel)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="text-xs bg-slate-50/50 border-slate-200 rounded-xl resize-none"
            required
          />
        </div>

        {/* 7. Supporting Attachment URL */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
            <Paperclip className="h-3.5 w-3.5 text-slate-400" />
            <span>Attachment Document URL (Optional)</span>
          </Label>
          <Input
            type="url"
            placeholder="https://docs.company.com/files/medical-note.pdf"
            value={attachmentUrl}
            onChange={(e) => setAttachmentUrl(e.target.value)}
            className="h-10 text-xs bg-slate-50/50 border-slate-200 rounded-xl"
          />
          <p className="text-[10px] text-slate-400">
            Upload medical certificate or supporting documents if required by policy.
          </p>
        </div>

        {/* Submit Actions */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onSuccessRedirect}
            className="h-10 px-4 text-xs rounded-xl"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="h-10 px-6 text-xs rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{createMutation.isPending ? 'Submitting Application...' : 'Submit Leave Request'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
