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
  type Machine,
  type ProductionLine,
} from '@/api/machine-management';
import { AlertTriangle, Wrench } from 'lucide-react';

interface StartMaintenanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedMachine?: Machine | null;
  machines: Machine[];
  productionLines: ProductionLine[];
  onSuccess: () => void;
}

export function StartMaintenanceModal({
  open,
  onOpenChange,
  preselectedMachine,
  machines,
  productionLines,
  onSuccess,
}: StartMaintenanceModalProps) {
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    machineId: '',
    productionLineId: '',
    maintenanceType: 'Preventive',
    priority: 'Medium',
    reason: '',
    startDate: new Date().toISOString().slice(0, 10),
    expectedCompletionDate: '',
    technicianName: '',
    remarks: '',
  });

  useEffect(() => {
    if (open) {
      const targetMachine = preselectedMachine || machines[0];
      setFormData({
        machineId: targetMachine?.id || '',
        productionLineId: targetMachine?.productionLineId || '',
        maintenanceType: 'Preventive',
        priority: 'Medium',
        reason: '',
        startDate: new Date().toISOString().slice(0, 10),
        expectedCompletionDate: '',
        technicianName: 'Internal Maintenance Team',
        remarks: '',
      });
    }
  }, [open, preselectedMachine, machines]);

  const selectedMachine = machines.find((m) => m.id === formData.machineId);
  const activeOperator = selectedMachine?.currentOperatorName;
  const activeShift = selectedMachine?.currentShift;

  const handleMachineChange = (mId: string) => {
    const m = machines.find((item) => item.id === mId);
    setFormData((prev) => ({
      ...prev,
      machineId: mId,
      productionLineId: m?.productionLineId || prev.productionLineId,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.machineId) {
      toast.error('Please select a machine');
      return;
    }
    if (!formData.reason.trim()) {
      toast.error('Please enter the maintenance reason or issue description');
      return;
    }
    if (!formData.technicianName.trim()) {
      toast.error('Please enter technician or service engineer name');
      return;
    }

    setSubmitting(true);
    try {
      await machineManagementApi.startMaintenance({
        companyId: selectedMachine?.companyId,
        branchId: selectedMachine?.branchId || null,
        machineId: formData.machineId,
        productionLineId: formData.productionLineId || undefined,
        maintenanceType: formData.maintenanceType,
        priority: formData.priority,
        reason: formData.reason.trim(),
        startDate: formData.startDate,
        expectedCompletionDate: formData.expectedCompletionDate || undefined,
        technicianName: formData.technicianName.trim(),
        remarks: formData.remarks.trim() || undefined,
      });

      toast.success(
        `Maintenance started for ${selectedMachine?.machineCode}. Machine status set to UNDER_MAINTENANCE.`
      );
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to start maintenance');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Wrench className="h-5 w-5 text-amber-600" />
            Start Machine Maintenance
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Warning Banner if active operator */}
          {activeOperator && (
            <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/30 flex gap-3 text-amber-900 dark:text-amber-200">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
              <div className="text-xs space-y-1">
                <p className="font-semibold">
                  This machine currently has an active operator allocation.
                </p>
                <p>
                  <strong>Operator:</strong> {activeOperator} &nbsp;|&nbsp; <strong>Shift:</strong>{' '}
                  {activeShift || 'Active'}
                </p>
                <p className="text-amber-700 dark:text-amber-400">
                  Starting maintenance will automatically interrupt the allocation and release the
                  operator back to available status.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="maint-machine">Machine *</Label>
              <Select value={formData.machineId} onValueChange={handleMachineChange}>
                <SelectTrigger id="maint-machine">
                  <SelectValue placeholder="Select Machine" />
                </SelectTrigger>
                <SelectContent>
                  {machines.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.machineCode} — {m.machineName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="maint-line">Operational Unit</Label>
              <Select
                value={formData.productionLineId || 'none'}
                onValueChange={(val) =>
                  setFormData({ ...formData, productionLineId: val === 'none' ? '' : val })
                }
              >
                <SelectTrigger id="maint-line">
                  <SelectValue placeholder="Select Operational Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Unassigned Unit --</SelectItem>
                  {productionLines.map((pl) => (
                    <SelectItem key={pl.id} value={pl.id}>
                      {pl.lineCode} - {pl.lineName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="maint-type">Maintenance Type *</Label>
              <Select
                value={formData.maintenanceType}
                onValueChange={(val) => setFormData({ ...formData, maintenanceType: val })}
              >
                <SelectTrigger id="maint-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Preventive">Preventive</SelectItem>
                  <SelectItem value="Corrective">Corrective</SelectItem>
                  <SelectItem value="Emergency">Emergency</SelectItem>
                  <SelectItem value="Breakdown">Breakdown</SelectItem>
                  <SelectItem value="Calibration">Calibration</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="maint-priority">Priority *</Label>
              <Select
                value={formData.priority}
                onValueChange={(val) => setFormData({ ...formData, priority: val })}
              >
                <SelectTrigger id="maint-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="maint-start-date">Start Date *</Label>
              <Input
                id="maint-start-date"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="maint-expected">Expected Completion Date</Label>
              <Input
                id="maint-expected"
                type="date"
                value={formData.expectedCompletionDate}
                onChange={(e) =>
                  setFormData({ ...formData, expectedCompletionDate: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="maint-tech">Technician / Field Service Engineer *</Label>
              <Input
                id="maint-tech"
                placeholder="e.g. Suresh Patil, Mazak Authorized Field Service"
                value={formData.technicianName}
                onChange={(e) => setFormData({ ...formData, technicianName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="maint-reason">Reason / Failure Description *</Label>
              <Textarea
                id="maint-reason"
                rows={2}
                placeholder="Describe fault telemetry, wear and tear, scheduled oil filter replacement, or breakdown symptoms..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="maint-remarks">Remarks</Label>
              <Textarea
                id="maint-remarks"
                rows={2}
                placeholder="Any special tooling or PPE safety lockdown instructions..."
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
            <Button type="submit" variant="destructive" disabled={submitting}>
              {submitting ? 'Starting...' : 'Start Maintenance'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
