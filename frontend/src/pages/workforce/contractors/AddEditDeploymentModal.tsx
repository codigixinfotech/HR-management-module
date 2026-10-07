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
  contractorApi,
  type WorkerDeployment,
  type ContractorWorker,
  type ContractorVendor,
  type ContractorContract
} from '@/api/contractor-management';
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

const DEPLOYMENT_TYPES = [
  { value: 'PLANT_FLOOR', label: 'Plant Floor Production' },
  { value: 'MAINTENANCE', label: 'Maintenance & Utility' },
  { value: 'WAREHOUSE', label: 'Warehouse & Logistics' },
  { value: 'SECURITY', label: 'Facility Security' },
  { value: 'HOUSEKEEPING', label: 'Sanitation & Housekeeping' },
  { value: 'TECHNICAL', label: 'Technical & Tool Room' },
];

const SHIFT_OPTIONS = [
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
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    workerId: '',
    vendorId: '',
    contractId: '',
    branchId: '',
    productionLineName: 'Assembly Line 1',
    machineName: 'CNC Milling Unit 01',
    shiftName: 'General Shift',
    deploymentType: 'PLANT_FLOOR',
    startDate: '',
    endDate: '',
    designation: 'Machine Operator',
    status: 'ACTIVE',
    remarks: '',
  });

  useEffect(() => {
    if (deployment) {
      setFormData({
        workerId: deployment.worker_id || '',
        vendorId: deployment.vendor_id || '',
        contractId: deployment.contract_id || '',
        branchId: deployment.branch_id || '',
        productionLineName: deployment.line_name || 'Assembly Line 1',
        machineName: deployment.machine_name || 'CNC Milling Unit 01',
        shiftName: deployment.shift_name || 'General Shift',
        deploymentType: deployment.deployment_type || 'PLANT_FLOOR',
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
        productionLineName: 'Assembly Line 1',
        machineName: 'CNC Milling Unit 01',
        shiftName: 'General Shift',
        deploymentType: 'PLANT_FLOOR',
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
        branchId: formData.branchId || null,
        productionLineId: null,
        machineId: null,
        shiftId: null,
        deploymentType: formData.deploymentType,
        designation: formData.designation,
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        status: formData.status,
        remarks: formData.remarks || `Assigned to ${formData.productionLineName} / ${formData.machineName} (${formData.shiftName})`,
        companyId,
      };

      if (deployment?.id) {
        await contractorApi.updateDeployment(deployment.id, payload);
        toast.success('Deployment updated successfully');
      } else {
        await contractorApi.createDeployment(payload);
        toast.success('Worker deployed successfully');
      }
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
          <DialogTitle>{deployment ? 'Edit Worker Deployment' : 'Deploy Worker to Plant Floor'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Worker Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium">Worker *</Label>
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
              <Label className="text-xs font-medium">Branch Location</Label>
              <Select
                value={formData.branchId || 'HEAD_OFFICE'}
                onValueChange={(val) => setFormData({ ...formData, branchId: val === 'HEAD_OFFICE' ? '' : val })}
              >
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HEAD_OFFICE" className="text-xs">All Branches / Head Office</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id} className="text-xs">{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Plant Floor Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium">Production Line</Label>
              <Input
                className="h-8 text-xs mt-1"
                placeholder="e.g. Line 1 - Sub Assembly"
                value={formData.productionLineName}
                onChange={(e) => setFormData({ ...formData, productionLineName: e.target.value })}
              />
            </div>

            <div>
              <Label className="text-xs font-medium">Assigned Machine</Label>
              <Input
                className="h-8 text-xs mt-1"
                placeholder="e.g. CNC Lathe 02, Press Machine"
                value={formData.machineName}
                onChange={(e) => setFormData({ ...formData, machineName: e.target.value })}
              />
            </div>
          </div>

          {/* Shift & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium">Shift Schedule</Label>
              <Select
                value={formData.shiftName}
                onValueChange={(val) => setFormData({ ...formData, shiftName: val })}
              >
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHIFT_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium">Deployment Type</Label>
              <Select
                value={formData.deploymentType}
                onValueChange={(val) => setFormData({ ...formData, deploymentType: val })}
              >
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPLOYMENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates & Status */}
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
              <Label className="text-xs font-medium">End Date</Label>
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
                  <SelectItem value="ACTIVE" className="text-xs">Active</SelectItem>
                  <SelectItem value="SCHEDULED" className="text-xs">Scheduled</SelectItem>
                  <SelectItem value="COMPLETED" className="text-xs">Completed</SelectItem>
                  <SelectItem value="TRANSFERRED" className="text-xs">Transferred</SelectItem>
                  <SelectItem value="CANCELLED" className="text-xs">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium">Operational Remarks / Work Order</Label>
            <Textarea
              className="text-xs mt-1 min-h-[60px]"
              placeholder="Operational notes, shift supervisor instructions..."
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? 'Saving...' : deployment ? 'Update Deployment' : 'Deploy Worker'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
