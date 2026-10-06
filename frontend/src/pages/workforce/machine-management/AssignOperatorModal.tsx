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
  type MachineOperator,
} from '@/api/machine-management';
import type { Company, Branch, Department, Employee } from '@/api/types';
import { shiftTypesApi } from '@/api/workforce';
import { CheckCircle2, AlertCircle, XCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  formatTime24,
  formatTime12,
  isCrossMidnight,
  calculateShiftDurationHours,
  normalizeShiftName,
} from './shiftTimeUtils';

interface AssignOperatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedMachine?: Machine | null;
  machines: Machine[];
  productionLines: ProductionLine[];
  operators: MachineOperator[];
  employees: Employee[];
  companies: Company[];
  branches: Branch[];
  departments: Department[];
  activeCompanyId?: string;
  activeBranchId?: string;
  onSuccess: () => void;
}

export function AssignOperatorModal({
  open,
  onOpenChange,
  preselectedMachine,
  machines,
  productionLines,
  operators,
  employees,
  companies,
  branches,
  departments,
  activeCompanyId,
  activeBranchId,
  onSuccess,
}: AssignOperatorModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [availableShifts, setAvailableShifts] = useState<{
    id: string;
    name: string;
    code?: string;
    startTime: string;
    endTime: string;
    durationHours: number;
    isNightShift: boolean;
  }[]>([]);

  const [formData, setFormData] = useState({
    companyId: '',
    branchId: '',
    departmentId: '',
    productionLineId: '',
    machineId: '',
    operatorType: 'Employee' as 'Employee' | 'Contractor',
    operatorId: '',
    supervisorId: '',
    supervisorName: '',
    shift: 'Morning Shift',
    allocationDate: new Date().toISOString().slice(0, 10),
    startTime: '07:00',
    endTime: '15:00',
    workOrder: '',
    operation: '',
    remarks: '',
  });

  // Load Shift Master definitions dynamically
  useEffect(() => {
    if (!open) return;
    const targetMachine = preselectedMachine || machines[0];
    const compId = targetMachine?.companyId || activeCompanyId || (companies[0]?.id ?? '');

    if (compId) {
      shiftTypesApi
        .list(compId)
        .then((list) => {
          if (list && list.length > 0) {
            const mapped = list.map((s) => {
              const sTime = formatTime24(s.startTime || '07:00');
              const eTime = formatTime24(s.endTime || '15:00');
              const duration = calculateShiftDurationHours(sTime, eTime);
              const isNight = Boolean(s.isNightShift) || isCrossMidnight(sTime, eTime);
              return {
                id: s.id,
                name: normalizeShiftName(s.name),
                code: s.code,
                startTime: sTime,
                endTime: eTime,
                durationHours: duration,
                isNightShift: isNight,
              };
            });
            setAvailableShifts(mapped);

            // Auto-populate shift time from first shift if current shift is default or not in list
            if (mapped.length > 0) {
              setFormData((prev) => {
                const found = mapped.find(
                  (m) => m.name.toLowerCase() === prev.shift.toLowerCase() || m.id === prev.shift
                ) || mapped[0];
                return {
                  ...prev,
                  shift: found.name,
                  startTime: found.startTime,
                  endTime: found.endTime,
                };
              });
            }
          } else {
            const defaults = [
              { id: 'st-m', name: 'Morning Shift', code: 'MS', startTime: '07:00', endTime: '15:00', durationHours: 8, isNightShift: false },
              { id: 'st-e', name: 'Evening Shift', code: 'ES', startTime: '15:00', endTime: '23:00', durationHours: 8, isNightShift: false },
              { id: 'st-n', name: 'Night Shift', code: 'NS', startTime: '23:00', endTime: '07:00', durationHours: 8, isNightShift: true },
            ];
            setAvailableShifts(defaults);
          }
        })
        .catch(() => {
          const defaults = [
            { id: 'st-m', name: 'Morning Shift', code: 'MS', startTime: '07:00', endTime: '15:00', durationHours: 8, isNightShift: false },
            { id: 'st-e', name: 'Evening Shift', code: 'ES', startTime: '15:00', endTime: '23:00', durationHours: 8, isNightShift: false },
            { id: 'st-n', name: 'Night Shift', code: 'NS', startTime: '23:00', endTime: '07:00', durationHours: 8, isNightShift: true },
          ];
          setAvailableShifts(defaults);
        });
    }
  }, [open, preselectedMachine, machines, activeCompanyId, companies]);

  useEffect(() => {
    if (open) {
      const targetMachine = preselectedMachine || machines[0];
      setFormData((prev) => ({
        ...prev,
        companyId: targetMachine?.companyId || activeCompanyId || (companies[0]?.id ?? ''),
        branchId: targetMachine?.branchId || (activeBranchId && activeBranchId !== 'HEAD_OFFICE' ? activeBranchId : '') || '',
        departmentId: targetMachine?.departmentId || '',
        productionLineId: targetMachine?.productionLineId || productionLines[0]?.id || '',
        machineId: targetMachine?.id || '',
        operatorType: 'Employee',
        operatorId: operators.find((o) => o.status === 'Available')?.id || operators[0]?.id || '',
        supervisorId: employees[0]?.id || '',
        supervisorName: employees[0] ? `${employees[0].firstName} ${employees[0].lastName}` : '',
        allocationDate: new Date().toISOString().slice(0, 10),
        workOrder: '',
        operation: '',
        remarks: '',
      }));
    }
  }, [open, preselectedMachine, machines, productionLines, operators, employees, activeCompanyId, activeBranchId, companies]);

  const handleShiftSelect = (shiftNameOrId: string) => {
    const found = availableShifts.find(
      (s) => s.name === shiftNameOrId || s.id === shiftNameOrId
    );
    if (found) {
      setFormData((prev) => ({
        ...prev,
        shift: found.name,
        startTime: found.startTime,
        endTime: found.endTime,
      }));
    } else {
      setFormData((prev) => ({ ...prev, shift: shiftNameOrId }));
    }
  };

  const selectedMachine = machines.find((m) => m.id === formData.machineId);
  const selectedOperator = operators.find((o) => o.id === formData.operatorId);

  // Pre-validation checks
  const isMachineActive = selectedMachine ? selectedMachine.status === 'ACTIVE' : false;
  const isMachineAvailable = selectedMachine
    ? selectedMachine.status !== 'UNDER_MAINTENANCE' && selectedMachine.status !== 'RETIRED'
    : false;
  const isOperatorActive = selectedOperator ? selectedOperator.status !== 'Inactive' : false;
  const isOperatorAvailable = selectedOperator
    ? selectedOperator.status === 'Available' || selectedOperator.status === 'Allocated'
    : false;
  const isShiftAvailable = Boolean(formData.shift && formData.allocationDate);
  const isComplianceValid = selectedOperator
    ? selectedOperator.contractorComplianceStatus !== 'EXPIRED'
    : true;
  const hasNoConflict = isMachineActive && isComplianceValid;

  const handleMachineChange = (mId: string) => {
    const m = machines.find((item) => item.id === mId);
    setFormData((prev) => ({
      ...prev,
      machineId: mId,
      productionLineId: m?.productionLineId || prev.productionLineId,
      departmentId: m?.departmentId || prev.departmentId,
      branchId: m?.branchId || prev.branchId,
      companyId: m?.companyId || prev.companyId,
    }));
  };

  const handleSupervisorChange = (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    const name = emp ? `${emp.firstName} ${emp.lastName}` : '';
    setFormData((prev) => ({ ...prev, supervisorId: empId, supervisorName: name }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.machineId) {
      toast.error('Please select a machine');
      return;
    }
    if (!formData.operatorId) {
      toast.error('Please select an operator');
      return;
    }
    if (!formData.productionLineId) {
      toast.error('Please select an operational unit');
      return;
    }

    if (!isMachineActive) {
      toast.error(`Machine is ${selectedMachine?.status}. Only ACTIVE machines can be allocated.`);
      return;
    }

    setSubmitting(true);
    try {
      await machineManagementApi.createAllocation({
        companyId: formData.companyId,
        branchId: formData.branchId || null,
        productionLineId: formData.productionLineId,
        machineId: formData.machineId,
        operatorId: formData.operatorId,
        operatorType: formData.operatorType,
        supervisorId: formData.supervisorId || null,
        supervisorName: formData.supervisorName || null,
        shift: formData.shift,
        allocationDate: formData.allocationDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        workOrder: formData.workOrder.trim() || undefined,
        operation: formData.operation.trim() || undefined,
        remarks: formData.remarks.trim() || undefined,
      });

      toast.success('Machine operator assigned successfully');
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to assign operator');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredOperators = operators.filter((o) => {
    if (formData.operatorType === 'Employee') return o.operatorType === 'Employee';
    return o.operatorType === 'Contractor';
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Assign Machine Operator</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* Machine Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider border-b pb-1">
              1. Machine & Workstation Selection
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="alloc-company">Company *</Label>
                <Select
                  value={formData.companyId}
                  onValueChange={(val) => setFormData({ ...formData, companyId: val })}
                >
                  <SelectTrigger id="alloc-company">
                    <SelectValue placeholder="Select Company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="alloc-branch">Branch</Label>
                <Select
                  value={formData.branchId || 'HEAD_OFFICE'}
                  onValueChange={(val) =>
                    setFormData({ ...formData, branchId: val === 'HEAD_OFFICE' ? '' : val })
                  }
                >
                  <SelectTrigger id="alloc-branch">
                    <SelectValue placeholder="Select Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HEAD_OFFICE">Head Office</SelectItem>
                    {branches
                      .filter((b) => !formData.companyId || b.companyId === formData.companyId)
                      .filter((b) => !b.name?.toLowerCase().includes('head office'))
                      .map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="alloc-line">Operational Unit *</Label>
                <Select
                  value={formData.productionLineId}
                  onValueChange={(val) => setFormData({ ...formData, productionLineId: val })}
                >
                  <SelectTrigger id="alloc-line">
                    <SelectValue placeholder="Select Operational Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {productionLines.map((pl) => (
                      <SelectItem key={pl.id} value={pl.id}>
                        {pl.lineCode} - {pl.lineName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="alloc-machine">Machine *</Label>
                <Select value={formData.machineId} onValueChange={handleMachineChange}>
                  <SelectTrigger id="alloc-machine">
                    <SelectValue placeholder="Select Machine" />
                  </SelectTrigger>
                  <SelectContent>
                    {machines.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.machineCode} — {m.machineName} ({m.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Operator Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider border-b pb-1">
              2. Operator & Supervisor
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-6">
                <Label className="text-xs uppercase text-muted-foreground font-semibold">
                  Operator Cadre *
                </Label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="op-type"
                      checked={formData.operatorType === 'Employee'}
                      onChange={() => setFormData({ ...formData, operatorType: 'Employee', operatorId: '' })}
                      className="accent-primary"
                    />
                    <span>Permanent Employee</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="op-type"
                      checked={formData.operatorType === 'Contractor'}
                      onChange={() => setFormData({ ...formData, operatorType: 'Contractor', operatorId: '' })}
                      className="accent-primary"
                    />
                    <span>Contractor Worker</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="alloc-operator">Operator *</Label>
                  <Select
                    value={formData.operatorId}
                    onValueChange={(val) => setFormData({ ...formData, operatorId: val })}
                  >
                    <SelectTrigger id="alloc-operator">
                      <SelectValue placeholder="Select Eligible Operator" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredOperators.map((op) => (
                        <SelectItem key={op.id} value={op.id}>
                          {op.operatorName} ({op.operatorCode}) — {op.skill} [{op.status}]
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="alloc-supervisor">Supervisor</Label>
                  <Select
                    value={formData.supervisorId}
                    onValueChange={handleSupervisorChange}
                  >
                    <SelectTrigger id="alloc-supervisor">
                      <SelectValue placeholder="Select Supervisor" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName} ({emp.employeeCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Shift Section (Unified Shift Master as Single Source of Truth) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-1">
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                3. Shift Schedule (Shift Master)
              </h3>
              {Boolean(formData.startTime && formData.endTime) && (
                <div className="flex items-center gap-1.5 text-xs">
                  <Badge variant="outline" className="font-mono text-xs">
                    {calculateShiftDurationHours(formData.startTime, formData.endTime)} hrs duration
                  </Badge>
                  {isCrossMidnight(formData.startTime, formData.endTime) && (
                    <Badge variant="secondary" className="text-amber-700 bg-amber-50 border border-amber-300 text-[10px]">
                      🌙 +1 Day (Cross Midnight)
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1.5 md:col-span-1">
                <Label htmlFor="alloc-shift">Shift Pattern *</Label>
                <Select
                  value={formData.shift}
                  onValueChange={handleShiftSelect}
                >
                  <SelectTrigger id="alloc-shift">
                    <SelectValue placeholder="Select Shift from Master" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableShifts.map((s) => (
                      <SelectItem key={s.id} value={s.name}>
                        {s.name} ({formatTime24(s.startTime)} – {formatTime24(s.endTime)}) — {s.durationHours}h
                        {s.isNightShift ? ' · 🌙 Cross Midnight' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="alloc-date">Allocation Date *</Label>
                <Input
                  id="alloc-date"
                  type="date"
                  value={formData.allocationDate}
                  onChange={(e) => setFormData({ ...formData, allocationDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="alloc-start">Start Time (24h)</Label>
                  <span className="text-[10px] text-muted-foreground">{formatTime12(formData.startTime)}</span>
                </div>
                <Input
                  id="alloc-start"
                  type="time"
                  value={formatTime24(formData.startTime)}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="alloc-end">End Time (24h)</Label>
                  <span className="text-[10px] text-muted-foreground">{formatTime12(formData.endTime)}</span>
                </div>
                <Input
                  id="alloc-end"
                  type="time"
                  value={formatTime24(formData.endTime)}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>

            {/* Shift Timing Details Alert / Pill */}
            {Boolean(formData.startTime && formData.endTime) && (
              <div className="p-2.5 rounded-lg bg-muted/30 border text-xs flex flex-wrap items-center justify-between gap-2">
                <span className="text-muted-foreground">
                  <strong className="text-foreground">{formData.shift}</strong>: {formatTime24(formData.startTime)} to {formatTime24(formData.endTime)} ({formatTime12(formData.startTime)} to {formatTime12(formData.endTime)})
                </span>
                <span className="font-medium text-foreground">
                  Working Hours: {calculateShiftDurationHours(formData.startTime, formData.endTime)} hrs
                  {isCrossMidnight(formData.startTime, formData.endTime) && (
                    <span className="text-amber-600 font-semibold ml-1">
                      (finishes next morning at {formatTime12(formData.endTime)})
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Production & Remarks */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider border-b pb-1">
              4. Production Work Order & Notes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="alloc-wo">Work Order #</Label>
                <Input
                  id="alloc-wo"
                  placeholder="e.g. WO-2026-1044"
                  value={formData.workOrder}
                  onChange={(e) => setFormData({ ...formData, workOrder: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="alloc-op-step">Operation / Production Step</Label>
                <Input
                  id="alloc-op-step"
                  placeholder="e.g. Rotor Shaft Roughing & Finishing"
                  value={formData.operation}
                  onChange={(e) => setFormData({ ...formData, operation: e.target.value })}
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="alloc-remarks">Remarks</Label>
                <Textarea
                  id="alloc-remarks"
                  rows={2}
                  placeholder="Safety goggles required, batch lot verification, tolerance constraints..."
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Real-time Pre-validation Display */}
          <div className="p-4 rounded-xl border bg-muted/30 space-y-2.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Automatic Operational Validation Checklist
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                {isMachineActive ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                )}
                <span>Machine Active</span>
              </div>
              <div className="flex items-center gap-1.5">
                {isMachineAvailable ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                )}
                <span>Machine Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                {isOperatorActive ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                )}
                <span>Operator Active</span>
              </div>
              <div className="flex items-center gap-1.5">
                {isOperatorAvailable ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                )}
                <span>Operator Eligible</span>
              </div>
              <div className="flex items-center gap-1.5">
                {isShiftAvailable ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                )}
                <span>Shift Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                {hasNoConflict ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                )}
                <span>No Conflicts</span>
              </div>
              <div className="flex items-center gap-1.5 col-span-2">
                {isComplianceValid ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                )}
                <span>Contractor Compliance Valid</span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Assigning...' : 'Assign Operator'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
