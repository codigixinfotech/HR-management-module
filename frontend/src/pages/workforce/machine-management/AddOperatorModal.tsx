import React, { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { machineManagementApi, type MachineOperator } from '@/api/machine-management';
import type { Company, Branch, Employee } from '@/api/types';

interface AddOperatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  companies: Company[];
  branches: Branch[];
  activeCompanyId?: string;
  activeBranchId?: string;
  onSuccess: () => void;
}

export function AddOperatorModal({
  open,
  onOpenChange,
  employees,
  companies,
  branches,
  activeCompanyId,
  activeBranchId,
  onSuccess,
}: AddOperatorModalProps) {
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    operatorType: 'Employee' as 'Employee' | 'Contractor',
    employeeId: '',
    operatorName: '',
    operatorCode: '',
    department: 'Production',
    skill: 'CNC Machining & G-Code Programming',
    skillLevel: 'Expert',
    certification: 'Certified Machine Operator',
    certificationExpiry: '2026-12-31',
    contractorAgency: '',
    companyId: activeCompanyId || (companies[0]?.id ?? ''),
    branchId: activeBranchId && activeBranchId !== 'HEAD_OFFICE' && activeBranchId !== 'ALL' ? activeBranchId : '',
  });

  const handleEmployeeSelect = (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    if (!emp) return;
    setFormData((prev) => ({
      ...prev,
      employeeId: emp.id,
      operatorName: `${emp.firstName} ${emp.lastName}`,
      operatorCode: emp.employeeCode || `OP-${emp.id.slice(-4)}`,
      department: (emp.department as any)?.name || 'Production',
      companyId: emp.companyId || prev.companyId,
      branchId: emp.branchId || prev.branchId,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.operatorName.trim()) {
      toast.error('Operator Name is required');
      return;
    }
    if (!formData.skill.trim()) {
      toast.error('Skill is required');
      return;
    }

    setSubmitting(true);
    try {
      await machineManagementApi.createOperator({
        companyId: formData.companyId,
        branchId: formData.branchId || null,
        employeeId: formData.operatorType === 'Employee' ? formData.employeeId || null : null,
        operatorType: formData.operatorType,
        operatorName: formData.operatorName.trim(),
        operatorCode: formData.operatorCode.trim() || `OP-${Date.now().toString().slice(-4)}`,
        department: formData.department,
        skill: formData.skill.trim(),
        skillLevel: formData.skillLevel,
        certification: formData.certification.trim() || undefined,
        certificationExpiry: formData.certificationExpiry || undefined,
        contractorAgency:
          formData.operatorType === 'Contractor'
            ? formData.contractorAgency.trim() || 'Apex Manpower Services'
            : undefined,
        status: 'Available',
      });

      toast.success(`Operator ${formData.operatorName} added to eligible roster`);
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to add operator');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Add Eligible Machine Operator
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-3">
            <div className="flex items-center gap-6">
              <Label className="text-xs uppercase text-muted-foreground font-semibold">
                Personnel Source *
              </Label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="modal-op-type"
                    checked={formData.operatorType === 'Employee'}
                    onChange={() =>
                      setFormData({
                        ...formData,
                        operatorType: 'Employee',
                        operatorName: '',
                        operatorCode: '',
                      })
                    }
                    className="accent-primary"
                  />
                  <span>Select from Employee Master</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="modal-op-type"
                    checked={formData.operatorType === 'Contractor'}
                    onChange={() =>
                      setFormData({
                        ...formData,
                        operatorType: 'Contractor',
                        employeeId: '',
                        operatorCode: 'CW-001',
                      })
                    }
                    className="accent-primary"
                  />
                  <span>Contract Manpower Staff</span>
                </label>
              </div>
            </div>

            {formData.operatorType === 'Employee' ? (
              <div className="space-y-1.5">
                <Label htmlFor="add-emp-select">Select Employee *</Label>
                <Select value={formData.employeeId} onValueChange={handleEmployeeSelect}>
                  <SelectTrigger id="add-emp-select">
                    <SelectValue placeholder="Search employee..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeCode}) —{' '}
                        {(emp.department as any)?.name || 'General'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cw-name">Contract Worker Name *</Label>
                  <Input
                    id="cw-name"
                    placeholder="e.g. Ramesh Kulkarni"
                    value={formData.operatorName}
                    onChange={(e) => setFormData({ ...formData, operatorName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cw-code">Contractor Personnel Code</Label>
                  <Input
                    id="cw-code"
                    placeholder="e.g. CW-035"
                    value={formData.operatorCode}
                    onChange={(e) => setFormData({ ...formData, operatorCode: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="cw-agency">Staffing Vendor / Agency</Label>
                  <Input
                    id="cw-agency"
                    placeholder="e.g. Apex Industrial Manpower Services"
                    value={formData.contractorAgency}
                    onChange={(e) =>
                      setFormData({ ...formData, contractorAgency: e.target.value })
                    }
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="op-skill">Machine Skill / Specialization *</Label>
                <Input
                  id="op-skill"
                  placeholder="e.g. CNC Turning, Robotic Welding, Stamping"
                  value={formData.skill}
                  onChange={(e) => setFormData({ ...formData, skill: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="op-level">Skill Level</Label>
                <Select
                  value={formData.skillLevel}
                  onValueChange={(val) => setFormData({ ...formData, skillLevel: val })}
                >
                  <SelectTrigger id="op-level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner / Trainee</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Expert">Expert</SelectItem>
                    <SelectItem value="Specialist">Specialist / Master</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="op-cert">Certification / License</Label>
                <Input
                  id="op-cert"
                  placeholder="e.g. Master CNC Machinist Level IV"
                  value={formData.certification}
                  onChange={(e) => setFormData({ ...formData, certification: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="op-cert-exp">Certification Expiry</Label>
                <Input
                  id="op-cert-exp"
                  type="date"
                  value={formData.certificationExpiry}
                  onChange={(e) =>
                    setFormData({ ...formData, certificationExpiry: e.target.value })
                  }
                />
              </div>
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
              {submitting ? 'Adding...' : 'Mark as Eligible Operator'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
