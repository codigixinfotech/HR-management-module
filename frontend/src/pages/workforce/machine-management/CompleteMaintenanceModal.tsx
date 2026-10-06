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
import { toast } from 'sonner';
import {
  machineManagementApi,
  type MachineMaintenance,
} from '@/api/machine-management';
import { CheckCircle2, Wrench } from 'lucide-react';

interface CompleteMaintenanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maintenance?: MachineMaintenance | null;
  onSuccess: () => void;
}

export function CompleteMaintenanceModal({
  open,
  onOpenChange,
  maintenance,
  onSuccess,
}: CompleteMaintenanceModalProps) {
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    actualCompletionDate: new Date().toISOString().slice(0, 10),
    technicianName: '',
    result: 'Completed Successfully',
    partsReplaced: '',
    remarks: '',
  });

  useEffect(() => {
    if (maintenance) {
      setFormData({
        actualCompletionDate: new Date().toISOString().slice(0, 10),
        technicianName: maintenance.technicianName || '',
        result: 'Completed Successfully',
        partsReplaced: maintenance.partsReplaced || '',
        remarks: maintenance.remarks || '',
      });
    }
  }, [maintenance, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintenance) return;

    if (!formData.actualCompletionDate) {
      toast.error('Actual completion date is required');
      return;
    }
    if (!formData.technicianName.trim()) {
      toast.error('Technician name is required');
      return;
    }

    setSubmitting(true);
    try {
      await machineManagementApi.completeMaintenance(maintenance.id, {
        actualCompletionDate: formData.actualCompletionDate,
        technicianName: formData.technicianName.trim(),
        result: formData.result,
        partsReplaced: formData.partsReplaced.trim() || undefined,
        remarks: formData.remarks.trim() || undefined,
      });

      toast.success(
        `Maintenance for ${maintenance.machineCode || 'Machine'} completed. Machine status restored to ACTIVE.`
      );
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to complete maintenance');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            Complete Maintenance & Restore Machine
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Machine summary banner */}
          <div className="p-3.5 rounded-xl border bg-muted/30 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px] uppercase tracking-wider">
                Machine
              </span>
              <span className="font-semibold text-foreground text-sm">
                {maintenance?.machineCode} — {maintenance?.machineName}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px] uppercase tracking-wider">
                Maintenance Type
              </span>
              <span className="font-semibold text-foreground text-sm">
                {maintenance?.maintenanceType}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px] uppercase tracking-wider">
                Service Started
              </span>
              <span className="font-medium">
                {maintenance?.startDate ? maintenance.startDate.slice(0, 10) : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px] uppercase tracking-wider">
                Operational Unit
              </span>
              <span className="font-medium">
                {maintenance?.lineName || 'Main Shop Floor'}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cm-comp-date">Actual Completion Date *</Label>
              <Input
                id="cm-comp-date"
                type="date"
                value={formData.actualCompletionDate}
                onChange={(e) =>
                  setFormData({ ...formData, actualCompletionDate: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cm-tech">Lead Technician / Certifying Engineer *</Label>
              <Input
                id="cm-tech"
                value={formData.technicianName}
                onChange={(e) => setFormData({ ...formData, technicianName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cm-result">Result / Service Outcome *</Label>
              <Select
                value={formData.result}
                onValueChange={(val) => setFormData({ ...formData, result: val })}
              >
                <SelectTrigger id="cm-result">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Completed Successfully">
                    Completed Successfully (100% Operational)
                  </SelectItem>
                  <SelectItem value="Repaired with Observation">
                    Repaired with Observation (Requires Monitoring)
                  </SelectItem>
                  <SelectItem value="Temporary Fix">Temporary Fix (Follow-up Needed)</SelectItem>
                  <SelectItem value="Pending Secondary Parts">
                    Parts Installed & Calibration Passed
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cm-parts">Parts Replaced</Label>
              <Textarea
                id="cm-parts"
                rows={2}
                placeholder="e.g. Hydraulic filter element (P/N MZ-8820), 10L Spindle Coolant synthetic oil..."
                value={formData.partsReplaced}
                onChange={(e) => setFormData({ ...formData, partsReplaced: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cm-remarks">Remarks & Post-Service Test Notes</Label>
              <Textarea
                id="cm-remarks"
                rows={2}
                placeholder="Spindle runout verified < 0.002mm, test cut passed, safety interlocks verified..."
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-1.5"
              disabled={submitting}
            >
              <CheckCircle2 className="h-4 w-4" />
              {submitting ? 'Completing...' : 'Complete Maintenance & Set Active'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
