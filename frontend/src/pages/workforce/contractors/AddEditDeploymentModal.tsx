import React, { useState, useEffect, useMemo } from 'react';
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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { departmentsApi } from '@/api/organization';
import {
  contractorApi,
  type WorkerDeployment,
  type ContractorWorker,
  type ContractorVendor,
  type ContractorContract
} from '@/api/contractor-management';
import { machineManagementApi } from '@/api/machine-management';
import { shiftTypesApi } from '@/api/workforce';
import type { Branch } from '@/api/types';

interface AddEditDeploymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deployment?: WorkerDeployment | null;
  workers: ContractorWorker[];
  vendors: ContractorVendor[];
  contracts: ContractorContract[];
  branches: Branch[];
  companyId?: string;
  onSuccess: () => void;
}

const DEFAULT_SHIFT_OPTIONS = [
  { value: 'General Shift', label: 'General Shift (08:00 - 17:00)' },
  { value: 'Morning Shift', label: 'Morning Shift (06:00 - 14:00)' },
  { value: 'Afternoon Shift', label: 'Afternoon Shift (14:00 - 22:00)' },
  { value: 'Night Shift', label: 'Night Shift (22:00 - 06:00)' },
];

export function AddEditDeploymentModal({
  open,
  onOpenChange,
  deployment,
  workers,
  vendors,
  contracts,
  branches,
  companyId,
  onSuccess,
}: AddEditDeploymentModalProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    workerId: '',
    vendorId: '',
    contractId: '',
    branchId: '',
    departmentId: '',
    productionLineId: '',
    machineId: '',
    shiftName: 'General Shift',
    startDate: '',
    endDate: '',
    designation: 'Machine Operator',
    status: 'ACTIVE',
    remarks: '',
  });

  const targetBranchForDept =
    formData.branchId && formData.branchId !== 'ALL'
      ? formData.branchId
      : undefined;

  // 1. Departments Query
  const { data: departments = [], isLoading: loadingDepartments } = useQuery({
    queryKey: ['departments', companyId, targetBranchForDept],
    queryFn: () => departmentsApi.list(companyId, targetBranchForDept),
    enabled: Boolean(companyId),
  });

  // 2. Operational Units from Machine Management
  const { data: operationalUnits = [], isLoading: loadingUnits } = useQuery({
    queryKey: ['production-lines-deployment', companyId, targetBranchForDept],
    queryFn: () =>
      machineManagementApi.listProductionLines({
        companyId,
        branchId: targetBranchForDept,
      }),
    enabled: Boolean(companyId),
  });

  // 3. Machines from Machine Master
  const { data: machines = [], isLoading: loadingMachines } = useQuery({
    queryKey: ['machines-for-deployment', companyId, targetBranchForDept, formData.productionLineId],
    queryFn: () =>
      machineManagementApi.listMachines({
        companyId,
        branchId: targetBranchForDept,
        productionLineId:
          formData.productionLineId && formData.productionLineId !== 'NONE'
            ? formData.productionLineId
            : undefined,
      }),
    enabled: Boolean(companyId),
  });

  // 4. Dynamic Shift Types
  const { data: dbShifts = [] } = useQuery({
    queryKey: ['shift-types-deployment', companyId],
    queryFn: () => shiftTypesApi.list(companyId),
    enabled: Boolean(companyId),
  });

  const shiftOptions = useMemo(() => {
    if (dbShifts && dbShifts.length > 0) {
      return dbShifts.map((s) => ({
        value: s.name,
        label: `${s.name}${s.startTime && s.endTime ? ` (${s.startTime} - ${s.endTime})` : ''}`,
      }));
    }
    return DEFAULT_SHIFT_OPTIONS;
  }, [dbShifts]);

  useEffect(() => {
    if (deployment) {
      setFormData({
        workerId: deployment.worker_id || '',
        vendorId: deployment.vendor_id || '',
        contractId: deployment.contract_id || '',
        branchId:
          deployment.branch_id ||
          (deployment.branch_name?.toLowerCase().includes('head office') ? 'HEAD_OFFICE' : ''),
        departmentId: deployment.department_id || '',
        productionLineId: deployment.production_line_id || '',
        machineId: deployment.machine_id || '',
        shiftName: deployment.shift_name || 'General Shift',
        startDate: deployment.start_date ? deployment.start_date.split('T')[0] : '',
        endDate: deployment.end_date ? deployment.end_date.split('T')[0] : '',
        designation: deployment.designation || 'Machine Operator',
        status: deployment.status || 'ACTIVE',
        remarks: deployment.remarks || '',
      });
    } else {
      const firstWorker = workers[0];
      setFormData({
        workerId: firstWorker?.id || '',
        vendorId: firstWorker?.vendor_id || vendors[0]?.id || '',
        contractId: firstWorker?.contract_id || contracts[0]?.id || '',
        branchId: '',
        departmentId: '',
        productionLineId: '',
        machineId: '',
        shiftName: 'General Shift',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        designation: firstWorker?.designation || 'Machine Operator',
        status: 'ACTIVE',
        remarks: '',
      });
    }
  }, [deployment, open, workers, vendors, contracts]);

  const handleWorkerChange = (wId: string) => {
    const sel = workers.find((w) => w.id === wId);
    setFormData((prev) => ({
      ...prev,
      workerId: wId,
      vendorId: sel?.vendor_id || prev.vendorId,
      contractId: sel?.contract_id || prev.contractId,
      designation: sel?.designation || prev.designation,
    }));
  };

  const handleOperationalUnitChange = (val: string) => {
    const newUnitId = val === 'NONE' ? '' : val;
    setFormData((prev) => {
      // If current machine doesn't match new unit, clear machine
      const curMach = machines.find((m) => m.id === prev.machineId);
      const shouldResetMach =
        newUnitId && curMach && curMach.productionLineId && curMach.productionLineId !== newUnitId;
      return {
        ...prev,
        productionLineId: newUnitId,
        machineId: shouldResetMach ? '' : prev.machineId,
      };
    });
  };

  const handleMachineChange = (mId: string) => {
    if (mId === 'NONE') {
      setFormData((prev) => ({ ...prev, machineId: '' }));
      return;
    }
    const selectedMach = machines.find((m) => m.id === mId);
    setFormData((prev) => ({
      ...prev,
      machineId: mId,
      productionLineId: selectedMach?.productionLineId || prev.productionLineId,
      departmentId: selectedMach?.departmentId || prev.departmentId,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.workerId) {
      toast.error('Please select a worker to deploy');
      return;
    }
    if (!formData.startDate) {
      toast.error('Start date is required');
      return;
    }

    try {
      setLoading(true);
      const selWorker = workers.find((w) => w.id === formData.workerId);
      const vId = formData.vendorId || selWorker?.vendor_id || vendors[0]?.id;
      const cId = formData.contractId || selWorker?.contract_id || contracts[0]?.id;

      if (!vId || !cId) {
        toast.error('Selected worker must be associated with a vendor and contract');
        setLoading(false);
        return;
      }

      const payload: any = {
        workerId: formData.workerId,
        vendorId: vId,
        contractId: cId,
        branchId: formData.branchId && formData.branchId !== 'ALL' ? formData.branchId : null,
        departmentId: formData.departmentId && formData.departmentId !== 'ALL' ? formData.departmentId : null,
        productionLineId:
          formData.productionLineId && formData.productionLineId !== 'NONE'
            ? formData.productionLineId
            : null,
        machineId: formData.machineId && formData.machineId !== 'NONE' ? formData.machineId : null,
        shiftId: null,
        shiftName: formData.shiftName,
        deploymentType: 'MACHINE_OPERATOR',
        designation: formData.designation,
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        status: formData.status,
        remarks: formData.remarks || null,
        companyId,
      };

      if (deployment?.id) {
        await contractorApi.updateDeployment(deployment.id, payload);
        toast.success('Deployment updated successfully');
      } else {
        await contractorApi.createDeployment(payload);
        toast.success('Worker deployed successfully');
      }

      // Invalidate Machine Management and Contractor queries for live refresh
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      queryClient.invalidateQueries({ queryKey: ['machine-operators'] });
      queryClient.invalidateQueries({ queryKey: ['machine-allocations'] });
      queryClient.invalidateQueries({ queryKey: ['contractor-deployments'] });
      queryClient.invalidateQueries({ queryKey: ['contractor-workers'] });

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save deployment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{deployment ? 'Edit Worker Deployment' : 'Deploy Worker'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Row 1: Worker & Branch Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium">Contract Worker *</Label>
              <Select
                value={formData.workerId}
                onValueChange={handleWorkerChange}
                disabled={!!deployment}
              >
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue placeholder="Select worker" />
                </SelectTrigger>
                <SelectContent>
                  {workers.map((w) => (
                    <SelectItem key={w.id} value={w.id} className="text-xs">
                      {[w.first_name, w.last_name].filter(Boolean).join(' ')} ({w.worker_code} - {w.skill})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium">Branch Location *</Label>
              <Select
                value={formData.branchId || 'ALL'}
                onValueChange={(val) => {
                  const newBranch = val === 'ALL' ? '' : val;
                  setFormData({
                    ...formData,
                    branchId: newBranch,
                    departmentId: 'ALL',
                    productionLineId: '',
                    machineId: '',
                  });
                }}
              >
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue placeholder="All Branches / Head Office" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs font-medium">
                    All Branches / Head Office
                  </SelectItem>
                  <SelectItem value="HEAD_OFFICE" className="text-xs font-semibold">
                    Head Office
                  </SelectItem>
                  {branches
                    .filter((b) => !b.name?.toLowerCase().includes('head office'))
                    .map((b) => (
                      <SelectItem key={b.id} value={b.id} className="text-xs">
                        {b.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Department & Operational Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Department / Function</Label>
                {loadingDepartments && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-2.5 w-2.5 animate-spin text-indigo-500" /> Loading...
                  </span>
                )}
              </div>
              <Select
                value={formData.departmentId || 'ALL'}
                onValueChange={(val) =>
                  setFormData({ ...formData, departmentId: val === 'ALL' ? '' : val })
                }
              >
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue placeholder="All Departments (General)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs font-medium">
                    All Departments (General)
                  </SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id} className="text-xs">
                      {d.name} {d.code ? `(${d.code})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Operational Unit</Label>
                {loadingUnits && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-2.5 w-2.5 animate-spin text-indigo-500" /> Loading...
                  </span>
                )}
              </div>
              <Select
                value={formData.productionLineId || 'NONE'}
                onValueChange={handleOperationalUnitChange}
              >
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue placeholder="Select Operational Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE" className="text-xs">
                    None / General Plant Floor
                  </SelectItem>
                  {operationalUnits.map((u) => (
                    <SelectItem key={u.id} value={u.id} className="text-xs">
                      {u.lineCode ? `${u.lineCode} - ` : ''}
                      {u.lineName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: Assigned Machine & Shift Schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">
                  Assigned Machine <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                {loadingMachines && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-2.5 w-2.5 animate-spin text-indigo-500" /> Loading...
                  </span>
                )}
              </div>
              <Select
                value={formData.machineId || 'NONE'}
                onValueChange={handleMachineChange}
              >
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue placeholder="Select Machine (Optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE" className="text-xs">
                    None / Not Assigned
                  </SelectItem>
                  {machines.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="text-xs">
                      {m.machineCode ? `${m.machineCode} - ` : ''}
                      {m.machineName}
                      {m.workstation ? ` (${m.workstation})` : ''}
                      {m.currentOperatorName ? ` [Current: ${m.currentOperatorName}]` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium">Shift Schedule *</Label>
              <Select
                value={formData.shiftName}
                onValueChange={(val) => setFormData({ ...formData, shiftName: val })}
              >
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {shiftOptions.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="text-xs">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 4: Dates & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs font-medium">Start Date *</Label>
              <Input
                type="date"
                className="h-8 text-xs mt-1"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>

            <div>
              <Label className="text-xs font-medium">
                End Date <span className="text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Input
                type="date"
                className="h-8 text-xs mt-1"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>

            <div>
              <Label className="text-xs font-medium">Deployment Status</Label>
              <Select
                value={formData.status}
                onValueChange={(val) => setFormData({ ...formData, status: val })}
              >
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE" className="text-xs">
                    Active
                  </SelectItem>
                  <SelectItem value="SCHEDULED" className="text-xs">
                    Scheduled
                  </SelectItem>
                  <SelectItem value="COMPLETED" className="text-xs">
                    Completed
                  </SelectItem>
                  <SelectItem value="TRANSFERRED" className="text-xs">
                    Transferred
                  </SelectItem>
                  <SelectItem value="CANCELLED" className="text-xs">
                    Cancelled
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium">Operational Remarks / Work Order</Label>
            <Textarea
              className="text-xs mt-1 min-h-[60px]"
              placeholder="Operational notes, shift supervisor instructions, work order..."
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading
                ? 'Saving...'
                : deployment
                ? 'Update Deployment'
                : 'Deploy Worker'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
