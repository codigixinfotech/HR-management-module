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
import { machineManagementApi, type ProductionLine } from '@/api/machine-management';
import type { Company, Branch, Department, Employee } from '@/api/types';

interface AddEditLineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  line?: ProductionLine | null;
  companies: Company[];
  branches: Branch[];
  departments: Department[];
  employees: Employee[];
  activeCompanyId?: string;
  activeBranchId?: string;
  onSuccess: () => void;
}

export function AddEditLineModal({
  open,
  onOpenChange,
  line,
  companies,
  branches,
  departments,
  employees,
  activeCompanyId,
  activeBranchId,
  onSuccess,
}: AddEditLineModalProps) {
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    companyId: '',
    branchId: '',
    departmentId: '',
    lineCode: '',
    lineName: '',
    lineType: 'Production',
    location: '',
    supervisorId: '',
    supervisorName: '',
    productionCapacity: 500,
    capacityUom: 'Units/Day',
    workingHours: 8,
    numberOfShifts: 2,
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE',
    description: '',
  });

  useEffect(() => {
    if (line) {
      setFormData({
        companyId: line.companyId || activeCompanyId || '',
        branchId: line.branchId || (activeBranchId && activeBranchId !== 'HEAD_OFFICE' ? activeBranchId : '') || '',
        departmentId: line.departmentId || '',
        lineCode: line.lineCode || '',
        lineName: line.lineName || '',
        lineType: line.lineType || 'Production',
        location: line.location || '',
        supervisorId: line.supervisorId || '',
        supervisorName: line.supervisorName || '',
        productionCapacity: Number(line.productionCapacity) || 500,
        capacityUom: line.capacityUom || 'Units/Day',
        workingHours: Number(line.workingHours) || 8,
        numberOfShifts: Number(line.numberOfShifts) || 2,
        status: (line.status as any) || 'ACTIVE',
        description: line.description || '',
      });
    } else {
      setFormData({
        companyId: activeCompanyId || (companies[0]?.id ?? ''),
        branchId: activeBranchId && activeBranchId !== 'HEAD_OFFICE' && activeBranchId !== 'ALL' ? activeBranchId : '',
        departmentId: departments[0]?.id ?? '',
        lineCode: '',
        lineName: '',
        lineType: 'Production',
        location: '',
        supervisorId: '',
        supervisorName: '',
        productionCapacity: 500,
        capacityUom: 'Units/Day',
        workingHours: 8,
        numberOfShifts: 2,
        status: 'ACTIVE',
        description: '',
      });
    }
  }, [line, open, activeCompanyId, activeBranchId, companies, departments]);

  const handleSupervisorChange = (empId: string) => {
    if (empId === 'none') {
      setFormData((prev) => ({ ...prev, supervisorId: '', supervisorName: '' }));
      return;
    }
    const emp = employees.find((e) => e.id === empId);
    const name = emp ? `${emp.firstName} ${emp.lastName}` : '';
    setFormData((prev) => ({ ...prev, supervisorId: empId, supervisorName: name }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lineCode.trim()) {
      toast.error('Line Code is required');
      return;
    }
    if (!formData.lineName.trim()) {
      toast.error('Line Name is required');
      return;
    }
    if (!formData.companyId) {
      toast.error('Company is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<ProductionLine> = {
        companyId: formData.companyId,
        branchId: formData.branchId || null,
        departmentId: formData.departmentId || null,
        lineCode: formData.lineCode.trim(),
        lineName: formData.lineName.trim(),
        lineType: formData.lineType,
        location: formData.location.trim() || undefined,
        supervisorId: formData.supervisorId || null,
        supervisorName: formData.supervisorName || null,
        productionCapacity: Number(formData.productionCapacity),
        capacityUom: formData.capacityUom,
        workingHours: Number(formData.workingHours),
        numberOfShifts: Number(formData.numberOfShifts),
        status: formData.status,
        description: formData.description.trim() || undefined,
      };

      if (line) {
        await machineManagementApi.updateProductionLine(line.id, payload);
        toast.success(`Production Line ${payload.lineCode} updated successfully`);
      } else {
        await machineManagementApi.createProductionLine(payload);
        toast.success(`Production Line ${payload.lineCode} created successfully`);
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save production line');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {line ? `Edit Production Line: ${line.lineCode}` : 'Add New Production Line'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="pl-code">Line Code *</Label>
              <Input
                id="pl-code"
                placeholder="e.g. PL-001"
                value={formData.lineCode}
                onChange={(e) => setFormData({ ...formData, lineCode: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pl-name">Line Name *</Label>
              <Input
                id="pl-name"
                placeholder="e.g. CNC Production Line 1"
                value={formData.lineName}
                onChange={(e) => setFormData({ ...formData, lineName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pl-type">Line Type *</Label>
              <Select
                value={formData.lineType}
                onValueChange={(val) => setFormData({ ...formData, lineType: val })}
              >
                <SelectTrigger id="pl-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Production">Production</SelectItem>
                  <SelectItem value="Assembly">Assembly</SelectItem>
                  <SelectItem value="Packaging">Packaging</SelectItem>
                  <SelectItem value="Testing / QC">Testing / QC</SelectItem>
                  <SelectItem value="Sub-assembly">Sub-assembly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pl-company">Company *</Label>
              <Select
                value={formData.companyId}
                onValueChange={(val) => setFormData({ ...formData, companyId: val })}
              >
                <SelectTrigger id="pl-company">
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
              <Label htmlFor="pl-branch">Branch *</Label>
              <Select
                value={formData.branchId || 'HEAD_OFFICE'}
                onValueChange={(val) =>
                  setFormData({ ...formData, branchId: val === 'HEAD_OFFICE' ? '' : val })
                }
              >
                <SelectTrigger id="pl-branch">
                  <SelectValue placeholder="Select Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HEAD_OFFICE">Head Office</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pl-dept">Department</Label>
              <Select
                value={formData.departmentId || 'none'}
                onValueChange={(val) =>
                  setFormData({ ...formData, departmentId: val === 'none' ? '' : val })
                }
              >
                <SelectTrigger id="pl-dept">
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- General Production --</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pl-location">Location / Shop Floor Area</Label>
              <Input
                id="pl-location"
                placeholder="e.g. Bay A - Heavy Machining Shop"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pl-supervisor">Supervisor (Employee Master)</Label>
              <Select
                value={formData.supervisorId || 'none'}
                onValueChange={handleSupervisorChange}
              >
                <SelectTrigger id="pl-supervisor">
                  <SelectValue placeholder="Select Supervisor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Unassigned Supervisor --</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pl-capacity">Production Capacity</Label>
              <Input
                id="pl-capacity"
                type="number"
                placeholder="500"
                value={formData.productionCapacity}
                onChange={(e) =>
                  setFormData({ ...formData, productionCapacity: Number(e.target.value) })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pl-capacity-uom">Capacity UOM</Label>
              <Select
                value={formData.capacityUom}
                onValueChange={(val) => setFormData({ ...formData, capacityUom: val })}
              >
                <SelectTrigger id="pl-capacity-uom">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Units/Day">Units / Day</SelectItem>
                  <SelectItem value="Units/Hour">Units / Hour</SelectItem>
                  <SelectItem value="Cycles/Min">Cycles / Min</SelectItem>
                  <SelectItem value="Kg/Day">Kg / Day</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pl-hours">Working Hours / Day</Label>
              <Input
                id="pl-hours"
                type="number"
                placeholder="8"
                value={formData.workingHours}
                onChange={(e) =>
                  setFormData({ ...formData, workingHours: Number(e.target.value) })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pl-shifts">Number of Shifts</Label>
              <Input
                id="pl-shifts"
                type="number"
                placeholder="2"
                value={formData.numberOfShifts}
                onChange={(e) =>
                  setFormData({ ...formData, numberOfShifts: Number(e.target.value) })
                }
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="pl-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(val) => setFormData({ ...formData, status: val as any })}
              >
                <SelectTrigger id="pl-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="pl-desc">Description</Label>
              <Textarea
                id="pl-desc"
                rows={3}
                placeholder="Provide notes on machinery cells, tooling configuration, or product lines manufactured..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : line ? 'Save Changes' : 'Save Production Line'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
