import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, FileSignature, ShieldCheck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { DualColumnTimePicker } from '@/components/ui/dual-column-time-picker';

import { useAttendanceRequestsStore } from '@/stores/attendance-requests-store';

interface EditAttendanceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: any | null;
  onSubmitSuccess?: (updatedRecord: any) => void;
}

export function EditAttendanceRequestModal({
  isOpen,
  onClose,
  record,
  onSubmitSuccess,
}: EditAttendanceRequestModalProps) {
  const [clockIn, setClockIn] = useState('');
  const [clockOut, setClockOut] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addRequest = useAttendanceRequestsStore((s) => s.addRequest);

  useEffect(() => {
    if (record) {
      const rawIn = record.clockIn && record.clockIn !== '—' ? record.clockIn : record.time || '09:00 AM';
      const rawOut = record.clockOut && record.clockOut !== '—' ? record.clockOut : '—';
      setClockIn(rawIn);
      setClockOut(rawOut);
      setReason('');
    }
  }, [record]);

  // Calculate preview total hours
  const calculateHours = (inStr: string, outStr: string) => {
    if (!inStr || !outStr || inStr === '—' || outStr === '—') return '—';
    try {
      const parseTime = (t: string) => {
        const isPm = t.toUpperCase().includes('PM');
        const isAm = t.toUpperCase().includes('AM');
        const clean = t.replace(/(AM|PM)/i, '').trim();
        const parts = clean.split(':').map(Number);
        let hours = parts[0] || 0;
        const minutes = parts[1] || 0;
        if (isPm && hours < 12) hours += 12;
        if (isAm && hours === 12) hours = 0;
        return hours * 60 + minutes;
      };
      const inMins = parseTime(inStr);
      let outMins = parseTime(outStr);

      // Support overnight / cross-midnight shifts (e.g. 3:00 PM to 6:30 AM)
      if (outMins <= inMins) {
        outMins += 24 * 60;
      }

      const diff = outMins - inMins;
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      return `${h}h ${String(m).padStart(2, '0')}m`;
    } catch {
      return '—';
    }
  };

  const previewTotalHours = calculateHours(clockIn, clockOut);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      toast.error('Please provide a reason for the attendance edit request.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);

      const attDate = record?.dateDisplay || record?.date || 'Aug 22, 2026';
      const createdReq = addRequest({
        attendanceRecordId: record?.id || `REC-${attDate}`,
        employeeCode: record?.code || record?.employeeCode || 'DEMO-EMPL-125',
        employeeName: record?.name || record?.employeeName || 'Employee Demo',
        department: record?.dept || record?.department || 'Human Resources',
        attendanceDate: attDate,
        originalClockIn: record?.clockIn && record?.clockIn !== '—' ? record?.clockIn : (record?.time || '12:35:55'),
        originalClockOut: record?.clockOut && record?.clockOut !== '—' ? record?.clockOut : '—',
        requestedClockIn: clockIn,
        requestedClockOut: clockOut,
        originalTotalHours: record?.totalHours || calculateHours(record?.clockIn, record?.clockOut),
        requestedTotalHours: previewTotalHours,
        reason: reason,
        requestedBy: record?.name || record?.employeeName || 'Employee Demo',
      });

      toast.success(
        `Attendance edit request submitted for ${attDate}. Sent to HR for approval.`
      );

      if (onSubmitSuccess) {
        onSubmitSuccess(createdReq);
      }

      onClose();
    }, 600);
  };

  if (!record) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" /> Edit Attendance
            </DialogTitle>
            <Badge variant="outline" className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 text-[10px] font-semibold">
              <ShieldCheck className="h-3 w-3 mr-1" /> Audit Trail Logging
            </Badge>
          </div>
          <DialogDescription className="text-xs">
            Request changes to your attendance record for {record.dateDisplay || 'Aug 22, 2026'}. This will be sent to HR for approval.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Monthly Edit Limits Banner */}
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">Monthly Edit Request Limits</span>
            <Badge className="bg-purple-600 text-white font-mono font-bold text-xs">
              2 / 5 Approved
            </Badge>
          </div>

          {/* Record Overview Banner */}
          <div className="p-3 rounded-xl bg-muted/40 border border-border/60 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10.5px] font-semibold text-muted-foreground block flex items-center gap-1">
                <Calendar className="h-3 w-3 text-primary" /> Date
              </span>
              <span className="font-bold text-foreground mt-0.5 block">{record.dateDisplay || 'Aug 22, 2026'}</span>
            </div>
            <div>
              <span className="text-[10.5px] font-semibold text-muted-foreground block">Employee</span>
              <span className="font-bold text-foreground mt-0.5 block">{record.name} ({record.code})</span>
            </div>
          </div>

          {/* Time Select Dropdowns */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-emerald-600" /> Clock In Time
              </Label>
              <DualColumnTimePicker
                value={clockIn}
                onChange={setClockIn}
                placeholder="Select Clock In Time"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-purple-600" /> Clock Out Time
              </Label>
              <DualColumnTimePicker
                value={clockOut}
                onChange={setClockOut}
                placeholder="Select Clock Out Time"
              />
            </div>
          </div>

          {/* Computed Total Hours Preview */}
          <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between text-xs">
            <span className="font-semibold text-muted-foreground">Computed Total Work Hours:</span>
            <Badge className="bg-primary text-primary-foreground font-mono font-bold text-xs">
              {previewTotalHours}
            </Badge>
          </div>

          {/* Reason Input */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5 text-amber-600" /> Reason for Edit <span className="text-destructive">*</span>
            </Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide justification (e.g., Network delay at office biometric terminal / Forgot to punch out)..."
              rows={3}
              className="text-xs resize-none"
              required
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting Request...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
