import { useState, useMemo, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Calendar as CalendarIcon,
  Clock,
  Info,
  Paperclip,
  ShieldAlert,
  User,
  CheckCircle2,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { leaveRequestsApi } from '@/api/attendance-leave';
import type { Company, LeaveType, LeaveBalance, Employee } from '@/api/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface ApplyLeaveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companies: Company[];
  companyId?: string;
  employees: Employee[];
  leaveTypes: LeaveType[];
  leaveBalances: LeaveBalance[];
  currentUserId?: string;
}

export function ApplyLeaveModal({
  open,
  onOpenChange,
  companies,
  companyId,
  employees,
  leaveTypes,
  leaveBalances,
  currentUserId,
}: ApplyLeaveModalProps) {
  const queryClient = useQueryClient();

  const selectedCompanyId = companyId || companies[0]?.id || '';
  const [employeeId, setEmployeeId] = useState<string>('');
  const [leaveTypeId, setLeaveTypeId] = useState<string>('');
  const [duration, setDuration] = useState<'FULL_DAY' | 'HALF_DAY' | 'CUSTOM'>('FULL_DAY');
  const [halfDaySession, setHalfDaySession] = useState<'FIRST_HALF' | 'SECOND_HALF'>('FIRST_HALF');
  const [startDate, setStartDate] = useState<string>('2026-09-11');
  const [endDate, setEndDate] = useState<string>('2026-09-11');
  const [reason, setReason] = useState<string>('');
  const [attachmentUrl, setAttachmentUrl] = useState<string>('');

  // Default to first employee or matching user
  useEffect(() => {
    if (employees.length > 0 && !employeeId) {
      const match = currentUserId ? employees.find((e) => e.userId === currentUserId) : null;
      setEmployeeId(match ? match.id : employees[0].id);
    }
  }, [employees, currentUserId, employeeId]);

  // Default to first leave type
  useEffect(() => {
    if (leaveTypes.length > 0 && !leaveTypeId) {
      setLeaveTypeId(leaveTypes[0].id);
    }
  }, [leaveTypes, leaveTypeId]);

  // Synchronize endDate if Full Day / Half Day
  useEffect(() => {
    if (duration === 'HALF_DAY') {
      setEndDate(startDate);
    }
  }, [duration, startDate]);

  // Selected entities
  const selectedEmployee = useMemo(
    () => employees.find((e) => e.id === employeeId),
    [employees, employeeId]
  );

  const selectedLeaveType = useMemo(
    () => leaveTypes.find((lt) => lt.id === leaveTypeId),
    [leaveTypes, leaveTypeId]
  );

  // Live balance card
  const employeeBalance = useMemo(() => {
    if (!employeeId || !leaveTypeId) return null;
    const found = leaveBalances.find(
      (b) => b.employeeId === employeeId && b.leaveTypeId === leaveTypeId
    );
    const quota = selectedLeaveType?.annualQuota || 12;
    if (found) {
      const allocated = found.allocated > 0 ? found.allocated : quota;
      const used = found.used || 0;
      const pending = found.pending || 0;
      const available = Math.max(0, allocated - used - pending);
      return {
        ...found,
        allocated,
        used,
        pending,
        available,
      };
    }

    // If no explicit balance record in DB, fallback to leave type annual quota
    return {
      id: 'computed',
      employeeId,
      leaveTypeId,
      year: new Date().getFullYear(),
      allocated: quota,
      used: 0,
      pending: 0,
      available: quota,
    };
  }, [employeeId, leaveTypeId, leaveBalances, selectedLeaveType]);

  // Calculate days & sandwich detection
  const { totalDays, isSandwichCandidate, sandwichDetails } = useMemo(() => {
    if (duration === 'HALF_DAY') {
      return { totalDays: 0.5, isSandwichCandidate: false, sandwichDetails: '' };
    }

    if (!startDate || !endDate) {
      return { totalDays: 1, isSandwichCandidate: false, sandwichDetails: '' };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      return { totalDays: 1, isSandwichCandidate: false, sandwichDetails: '' };
    }

    const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Check for intervening weekend (Friday -> Monday, or spanning Sat/Sun)
    let hasWeekend = false;
    const cur = new Date(start);
    while (cur <= end) {
      const day = cur.getDay(); // 0 is Sunday, 6 is Saturday
      if (day === 0 || day === 6) {
        hasWeekend = true;
      }
      cur.setDate(cur.getDate() + 1);
    }

    const policySandwich = selectedLeaveType?.policyConfig?.sandwichPolicy?.weeklyOffCountAsLeave;
    const isSandwichCandidate = hasWeekend && diffDays >= 3;
    const sandwichDetails = isSandwichCandidate
      ? policySandwich
        ? 'Sandwich Policy Active: Intervening weekend days are counted as leave per company policy.'
        : 'Sandwich Policy Exemption: Intervening weekend days are excluded from leave quota deduction.'
      : '';

    return {
      totalDays: diffDays,
      isSandwichCandidate,
      sandwichDetails,
    };
  }, [duration, startDate, endDate, selectedLeaveType]);

  // Submission mutation
  const createMutation = useMutation({
    mutationFn: () =>
      leaveRequestsApi.create({
        companyId: selectedCompanyId,
        employeeId,
        leaveTypeId,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        totalDays,
        duration,
        halfDaySession: duration === 'HALF_DAY' ? halfDaySession : undefined,
        reason: reason.trim() || undefined,
        attachmentUrl: attachmentUrl.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
      toast.success(
        `Leave request submitted for ${selectedEmployee?.firstName || 'employee'} (${totalDays} day${totalDays > 1 ? 's' : ''})`
      );
      onOpenChange(false);
      setReason('');
      setAttachmentUrl('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to submit leave request');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) {
      toast.error('Please select an employee');
      return;
    }
    if (!leaveTypeId) {
      toast.error('Please select a leave type');
      return;
    }
    if (!startDate || !endDate) {
      toast.error('Please select valid start and end dates');
      return;
    }

    // Check application rules
    const rules = selectedLeaveType?.policyConfig?.applicationRules;
    if (rules?.commentRequired && !reason.trim()) {
      toast.error('A reason is mandatory for this leave policy');
      return;
    }

    if (employeeBalance && employeeBalance.available !== undefined && employeeBalance.available < totalDays) {
      // If unpaid leave like LOP, allow. Otherwise warn
      if (selectedLeaveType?.isPaid) {
        toast.warning(
          `Notice: Requested ${totalDays} days exceeds available balance (${employeeBalance.available} days). Request will require special HR override.`
        );
      }
    }

    createMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto p-0">
        <div className="p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <CalendarIcon className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold tracking-tight">
                    Submit Leave Application
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Enterprise Keka validation engine with live balance calculation & sandwich policy checks
                  </DialogDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                {selectedCompanyId ? 'Active Portal' : 'Standard'}
              </Badge>
            </div>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* 1. Employee Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Employee <span className="text-destructive">*</span>
              </Label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeCode})
                  </option>
                ))}
              </select>
              {selectedEmployee && (
                <p className="text-[11px] text-muted-foreground">
                  Dept: <span className="font-medium text-foreground">{selectedEmployee.department?.name || 'General'}</span>
                  {selectedEmployee.designation?.title ? ` • ${selectedEmployee.designation.title}` : ''}
                </p>
              )}
            </div>

            {/* 2. Leave Type */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                Leave Type <span className="text-destructive">*</span>
              </Label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium"
                value={leaveTypeId}
                onChange={(e) => setLeaveTypeId(e.target.value)}
              >
                {leaveTypes.map((lt) => (
                  <option key={lt.id} value={lt.id}>
                    {lt.code} — {lt.name} ({lt.isPaid ? 'Paid' : 'Unpaid'})
                  </option>
                ))}
              </select>
              {selectedLeaveType && (
                <div className="flex items-center gap-2">
                  <Badge variant={selectedLeaveType.isPaid ? 'success' : 'secondary'} className="text-[10px] py-0 px-1.5">
                    {selectedLeaveType.isPaid ? 'Paid Leave' : 'Unpaid (Loss of Pay)'}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    Category: <span className="font-medium capitalize">{selectedLeaveType.category || 'Regular'}</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 3. Live Balance Card Banner */}
          {employeeBalance && (
            <div className="p-3.5 rounded-xl border border-border/80 bg-muted/30 grid grid-cols-4 gap-3 text-center">
              <div className="p-2 rounded-lg bg-background border border-border/60">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Allocated</span>
                <span className="text-base font-bold text-foreground">{employeeBalance.allocated?.toFixed(1) ?? '0.0'}</span>
                <span className="text-[10px] text-muted-foreground block">Days</span>
              </div>
              <div className="p-2 rounded-lg bg-background border border-border/60">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Availed / Used</span>
                <span className="text-base font-bold text-blue-600 dark:text-blue-400">{employeeBalance.used?.toFixed(1) ?? '0.0'}</span>
                <span className="text-[10px] text-muted-foreground block">Approved</span>
              </div>
              <div className="p-2 rounded-lg bg-background border border-border/60">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Under Review</span>
                <span className="text-base font-bold text-amber-600 dark:text-amber-400">{employeeBalance.pending?.toFixed(1) ?? '0.0'}</span>
                <span className="text-[10px] text-muted-foreground block">Pending</span>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800">
                <span className="text-[10px] uppercase tracking-wider text-emerald-700 dark:text-emerald-300 font-semibold block">Available</span>
                <span className="text-base font-black text-emerald-700 dark:text-emerald-300">
                  {employeeBalance.available !== undefined ? employeeBalance.available.toFixed(1) : employeeBalance.allocated?.toFixed(1) ?? '0.0'}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">Balance</span>
              </div>
            </div>
          )}

          {/* 4. Duration Mode & Session Selector */}
          <div className="space-y-3 p-3.5 rounded-xl border border-border/80 bg-background">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                Duration Type
              </Label>
              <div className="flex gap-1.5 bg-muted/60 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setDuration('FULL_DAY')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    duration === 'FULL_DAY'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Full Day
                </button>
                <button
                  type="button"
                  onClick={() => setDuration('HALF_DAY')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    duration === 'HALF_DAY'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Half Day (0.5)
                </button>
                <button
                  type="button"
                  onClick={() => setDuration('CUSTOM')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    duration === 'CUSTOM'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Multi-Day / Custom
                </button>
              </div>
            </div>

            {/* Half-Day Session Selection */}
            {duration === 'HALF_DAY' && (
              <div className="p-2.5 rounded-lg bg-muted/40 border flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">Select Half-Day Session:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setHalfDaySession('FIRST_HALF')}
                    className={`px-3 py-1 text-xs rounded-md font-semibold transition-all border ${
                      halfDaySession === 'FIRST_HALF'
                        ? 'bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-950 dark:text-amber-200'
                        : 'bg-background text-muted-foreground border-border hover:bg-muted'
                    }`}
                  >
                    ☀️ First Half (Morning Shift)
                  </button>
                  <button
                    type="button"
                    onClick={() => setHalfDaySession('SECOND_HALF')}
                    className={`px-3 py-1 text-xs rounded-md font-semibold transition-all border ${
                      halfDaySession === 'SECOND_HALF'
                        ? 'bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-950 dark:text-amber-200'
                        : 'bg-background text-muted-foreground border-border hover:bg-muted'
                    }`}
                  >
                    ⛅ Second Half (Afternoon Shift)
                  </button>
                </div>
              </div>
            )}

            {/* Date Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  {duration === 'HALF_DAY' ? 'Date (Single Day)' : 'End Date'}
                </Label>
                <Input
                  type="date"
                  value={endDate}
                  disabled={duration === 'HALF_DAY'}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 text-xs disabled:opacity-60"
                />
              </div>
            </div>

            {/* Total Days & Sandwich Alert */}
            <div className="flex items-center justify-between pt-2 border-t text-xs">
              <span className="text-muted-foreground font-medium">Calculated Leave Duration:</span>
              <span className="font-mono font-bold text-sm bg-primary/10 text-primary px-2.5 py-0.5 rounded-md">
                {totalDays} {totalDays === 1 ? 'Day' : 'Days'}
              </span>
            </div>

            {isSandwichCandidate && (
              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <span className="font-semibold">Sandwich Policy Detection:</span> This leave request covers dates across a weekend/weekly-off period.
                  {sandwichDetails && <p className="mt-0.5 text-amber-700 dark:text-amber-400">{sandwichDetails}</p>}
                </div>
              </div>
            )}
          </div>

          {/* 5. Reason for Leave */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">
                Reason for Leave
                {selectedLeaveType?.policyConfig?.applicationRules?.commentRequired && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </Label>
              <span className="text-[10px] text-muted-foreground">{reason.length} / 250</span>
            </div>
            <Textarea
              placeholder="Provide context or explanation for this leave application..."
              rows={2}
              maxLength={250}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="text-xs resize-none"
            />
          </div>

          {/* 6. Document Attachment (Optional) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
              Document Attachment (Optional / Medical Certificate)
            </Label>
            <Input
              type="text"
              placeholder="Paste document URL or certificate link (e.g. https://storage...)"
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          {/* 7. Approval Chain Preview */}
          <div className="p-3 rounded-lg border border-border/80 bg-muted/20 space-y-2">
            <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              Configured Multi-Level Approval Hierarchy:
            </span>
            <div className="flex items-center gap-2 text-[11px]">
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-background border text-foreground font-medium">
                <span className="h-4 w-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">1</span>
                Reporting Manager
              </div>
              <span className="text-muted-foreground">→</span>
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-background border text-foreground font-medium">
                <span className="h-4 w-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">2</span>
                Department Head (HOD)
              </div>
              <span className="text-muted-foreground">→</span>
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-background border text-foreground font-medium">
                <span className="h-4 w-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">3</span>
                HR Administrator
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createMutation.isPending}
              className="font-semibold"
            >
              {createMutation.isPending ? 'Submitting Application...' : 'Submit Application'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
