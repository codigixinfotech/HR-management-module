import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertOctagon, Wrench, Clock, User, Cpu, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { machineManagementApi, type Machine } from '@/api/machine-management';

interface ReportBreakdownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machine: Machine | null;
  onSuccess: () => void;
}

const COMMON_BREAKDOWN_REASONS = [
  'Motor Overheat / Tripped',
  'Mechanical Jam / Component Seizure',
  'Sensor Malfunction / Diagnostic Error',
  'Power Supply / Electrical Surge',
  'Hydraulic / Pneumatic Pressure Loss',
  'Calibration Drift / Quality Threshold Breached',
  'Software / Controller Communication Failure',
  'Tool Wear / Spindle Breakage',
  'Emergency Stop / Safety Interlock Triggered',
  'Other Mechanical Fault',
];

export function ReportBreakdownModal({
  open,
  onOpenChange,
  machine,
  onSuccess,
}: ReportBreakdownModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [breakdownDateTime, setBreakdownDateTime] = useState('');
  const [problemReason, setProblemReason] = useState(COMMON_BREAKDOWN_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [technicianName, setTechnicianName] = useState('On-Duty Maintenance Technician');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  useEffect(() => {
    if (open) {
      // Set default breakdown datetime to local current ISO
      const now = new Date();
      const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setBreakdownDateTime(localIso);
      setProblemReason(COMMON_BREAKDOWN_REASONS[0]);
      setCustomReason('');
      setRemarks('');
      setAttachedFile(null);
    }
  }, [open]);

  if (!machine) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machine) return;

    const finalReason =
      problemReason === 'Other Mechanical Fault' && customReason.trim()
        ? customReason.trim()
        : problemReason;

    try {
      setSubmitting(true);
      await machineManagementApi.startMaintenance({
        companyId: machine.companyId,
        branchId: machine.branchId,
        machineId: machine.id,
        productionLineId: machine.productionLineId || undefined,
        maintenanceType: 'Breakdown',
        priority: 'Critical',
        reason: finalReason,
        startDate: breakdownDateTime.slice(0, 10),
        technicianName: technicianName || 'Shop Floor Maintenance Lead',
        remarks: [
          remarks.trim(),
          `Reported Date/Time: ${breakdownDateTime}`,
          machine.currentOperatorName ? `Operator on duty: ${machine.currentOperatorName}` : null,
          machine.currentShift ? `Shift: ${machine.currentShift}` : null,
          attachedFile ? `Attachment: ${attachedFile.name}` : null,
        ]
          .filter(Boolean)
          .join(' | '),
      });

      toast.error(`Machine ${machine.machineCode} marked as 🔴 BREAKDOWN. Worker allocation interrupted.`);
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to report machine breakdown');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <AlertOctagon className="h-5 w-5" />
            Report Machine Breakdown
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Logging a breakdown immediately changes machine status to{' '}
            <span className="font-semibold text-rose-600 dark:text-rose-400">🔴 BREAKDOWN</span> and
            blocks the active operator allocation until repair is completed.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 py-1">
          {/* Machine & Operator Context (Read-Only) */}
          <div className="rounded-lg border border-rose-200 bg-rose-50/50 p-3 dark:border-rose-950 dark:bg-rose-950/20 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                <Cpu className="h-3.5 w-3.5 text-rose-600" />
                Target Equipment
              </span>
              <span className="font-mono font-bold text-foreground">
                {machine.machineCode} — {machine.machineName}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                <User className="h-3.5 w-3.5 text-rose-600" />
                Current Operator
              </span>
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                {machine.currentOperatorName ? (
                  <>
                    <span>{machine.currentOperatorName}</span>
                    <Badge variant="outline" className="text-[9.5px] py-0 h-4">
                      {machine.currentOperatorType || 'Operator'}
                    </Badge>
                  </>
                ) : (
                  <span className="text-muted-foreground italic font-normal">None Assigned</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                <Clock className="h-3.5 w-3.5 text-rose-600" />
                Current Shift
              </span>
              <span className="font-semibold text-foreground">
                {machine.currentShift || '—'}
              </span>
            </div>
          </div>

          {/* Breakdown Date/Time */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">Breakdown Date & Time *</Label>
            <Input
              type="datetime-local"
              required
              value={breakdownDateTime}
              onChange={(e) => setBreakdownDateTime(e.target.value)}
              className="h-8 text-xs font-mono"
            />
          </div>

          {/* Problem / Reason */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">Problem / Failure Reason *</Label>
            <Select value={problemReason} onValueChange={setProblemReason}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select failure reason" />
              </SelectTrigger>
              <SelectContent>
                {COMMON_BREAKDOWN_REASONS.map((r) => (
                  <SelectItem key={r} value={r} className="text-xs">
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {problemReason === 'Other Mechanical Fault' && (
              <Input
                placeholder="Describe specific breakdown issue..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="h-8 text-xs mt-1.5"
                required
              />
            )}
          </div>

          {/* Technician In-Charge */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">Assigned Repair Technician / Lead *</Label>
            <Input
              value={technicianName}
              onChange={(e) => setTechnicianName(e.target.value)}
              placeholder="e.g. Ramesh Shinde (Shop Floor Maintenance)"
              className="h-8 text-xs"
              required
            />
          </div>

          {/* Remarks */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">Diagnostic Notes & Observations</Label>
            <Textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Symptoms, error codes, machine sounds, or initial checks..."
              className="text-xs"
            />
          </div>

          {/* Attach Photo / Document */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">Attach Photo / Diagnostic Document (Optional)</Label>
            <div className="flex items-center gap-2">
              <label className="flex-1 flex items-center justify-center gap-2 border border-dashed rounded-md h-9 px-3 text-xs text-muted-foreground hover:bg-muted/30 cursor-pointer transition-colors">
                <UploadCloud className="h-4 w-4" />
                <span className="truncate">
                  {attachedFile ? attachedFile.name : 'Choose file (JPG, PNG, PDF max 5MB)'}
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setAttachedFile(e.target.files[0]);
                    }
                  }}
                />
              </label>
              {attachedFile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs text-destructive"
                  onClick={() => setAttachedFile(null)}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={submitting}
              className="h-8 text-xs gap-1.5"
            >
              <AlertOctagon className="h-3.5 w-3.5" />
              {submitting ? 'Reporting...' : 'Report Breakdown'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
