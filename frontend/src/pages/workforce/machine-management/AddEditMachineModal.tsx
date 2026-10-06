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
import type { Company, Branch, Department } from '@/api/types';
import { UploadCloud, FileText, CheckCircle2 } from 'lucide-react';

interface AddEditMachineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machine?: Machine | null;
  companies: Company[];
  branches: Branch[];
  departments: Department[];
  productionLines: ProductionLine[];
  activeCompanyId?: string;
  activeBranchId?: string;
  onSuccess: () => void;
}

const MACHINE_TYPES = [
  'CNC',
  'Welding',
  'Packaging',
  'Injection Molding',
  'Stamping Press',
  'Laser Cutting',
  'Assembly Rig',
  'Quality Scanner',
  'Surface Grinder',
  'Hydraulic Press',
  'Other',
];

const MACHINE_CATEGORIES = [
  'Production Machine',
  'Assembly Machine',
  'Packaging System',
  'QC / Telemetry',
  'Tooling & Die',
  'Auxiliary Equipment',
];

const CAPACITY_UOMS = [
  'Units / Hour',
  'Units / Day',
  'Cycles / Min',
  'Kg / Hour',
  'Parts / Shift',
  'Meters / Min',
];

export function AddEditMachineModal({
  open,
  onOpenChange,
  machine,
  companies,
  branches,
  departments,
  productionLines,
  activeCompanyId,
  activeBranchId,
  onSuccess,
}: AddEditMachineModalProps) {
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    companyId: '',
    branchId: '',
    departmentId: '',
    productionLineId: '',
    machineCode: '',
    machineName: '',
    machineType: 'CNC',
    machineCategory: 'Production Machine',
    manufacturer: '',
    model: '',
    serialNumber: '',
    assetNumber: '',
    workstation: '',
    location: '',
    capacity: 100,
    capacityUom: 'Units / Hour',
    operatingHours: 8,
    powerRating: 25,
    powerUom: 'kW',
    maintenanceFrequencyDays: 30,
    maintenanceReminderDays: 7,
    lastMaintenanceDate: '',
    nextMaintenanceDate: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'UNDER_MAINTENANCE' | 'RETIRED',
  });

  const [uploadedDocs, setUploadedDocs] = useState<{ [key: string]: string }>({
    manual: '',
    warranty: '',
    certificate: '',
    other: '',
  });

  useEffect(() => {
    if (machine) {
      setFormData({
        companyId: machine.companyId || activeCompanyId || '',
        branchId: machine.branchId || (activeBranchId && activeBranchId !== 'HEAD_OFFICE' ? activeBranchId : '') || '',
        departmentId: machine.departmentId || '',
        productionLineId: machine.productionLineId || '',
        machineCode: machine.machineCode || '',
        machineName: machine.machineName || '',
        machineType: machine.machineType || 'CNC',
        machineCategory: machine.machineCategory || 'Production Machine',
        manufacturer: machine.manufacturer || '',
        model: machine.model || '',
        serialNumber: machine.serialNumber || '',
        assetNumber: machine.assetNumber || '',
        workstation: machine.workstation || '',
        location: machine.location || '',
        capacity: Number(machine.capacity) || 100,
        capacityUom: machine.capacityUom || 'Units / Hour',
        operatingHours: Number(machine.operatingHours) || 8,
        powerRating: Number(machine.powerRating) || 25,
        powerUom: machine.powerUom || 'kW',
        maintenanceFrequencyDays: Number(machine.maintenanceFrequencyDays) || 30,
        maintenanceReminderDays: Number(machine.maintenanceReminderDays) || 7,
        lastMaintenanceDate: machine.lastMaintenanceDate ? machine.lastMaintenanceDate.slice(0, 10) : '',
        nextMaintenanceDate: machine.nextMaintenanceDate ? machine.nextMaintenanceDate.slice(0, 10) : '',
        status: machine.status || 'ACTIVE',
      });
    } else {
      setFormData({
        companyId: activeCompanyId || (companies[0]?.id ?? ''),
        branchId: activeBranchId && activeBranchId !== 'HEAD_OFFICE' && activeBranchId !== 'ALL' ? activeBranchId : '',
        departmentId: departments[0]?.id ?? '',
        productionLineId: productionLines[0]?.id ?? '',
        machineCode: '',
        machineName: '',
        machineType: 'CNC',
        machineCategory: 'Production Machine',
        manufacturer: '',
        model: '',
        serialNumber: '',
        assetNumber: '',
        workstation: '',
        location: '',
        capacity: 100,
        capacityUom: 'Units / Hour',
        operatingHours: 8,
        powerRating: 25,
        powerUom: 'kW',
        maintenanceFrequencyDays: 30,
        lastMaintenanceDate: '',
        nextMaintenanceDate: '',
        status: 'ACTIVE',
      });
    }
  }, [machine, open, activeCompanyId, activeBranchId, companies, departments, productionLines]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.machineCode.trim()) {
      toast.error('Machine Code is required');
      return;
    }
    if (!formData.machineName.trim()) {
      toast.error('Machine Name is required');
      return;
    }
    if (!formData.companyId) {
      toast.error('Company is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<Machine> = {
        companyId: formData.companyId,
        branchId: formData.branchId || null,
        departmentId: formData.departmentId || null,
        productionLineId: formData.productionLineId || null,
        machineCode: formData.machineCode.trim(),
        machineName: formData.machineName.trim(),
        machineType: formData.machineType,
        machineCategory: formData.machineCategory,
        manufacturer: formData.manufacturer.trim() || undefined,
        model: formData.model.trim() || undefined,
        serialNumber: formData.serialNumber.trim() || undefined,
        assetNumber: formData.assetNumber.trim() || undefined,
        workstation: formData.workstation.trim() || undefined,
        location: formData.location.trim() || undefined,
        capacity: Number(formData.capacity),
        capacityUom: formData.capacityUom,
        operatingHours: Number(formData.operatingHours),
        powerRating: Number(formData.powerRating),
        powerUom: formData.powerUom,
        maintenanceFrequencyDays: Number(formData.maintenanceFrequencyDays),
        lastMaintenanceDate: formData.lastMaintenanceDate || undefined,
        nextMaintenanceDate: formData.nextMaintenanceDate || undefined,
        status: formData.status,
      };

      if (machine) {
        await machineManagementApi.updateMachine(machine.id, payload);
        toast.success(`Machine ${payload.machineCode} updated successfully`);
      } else {
        await machineManagementApi.createMachine(payload);
        toast.success(`Machine ${payload.machineCode} created successfully`);
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save machine');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSimulateUpload = (type: string) => {
    const filename = `${formData.machineCode || 'MCH'}_${type.toUpperCase()}_v1.pdf`;
    setUploadedDocs((prev) => ({ ...prev, [type]: filename }));
    toast.success(`${type} document uploaded: ${filename}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            {machine ? `Edit Machine: ${machine.machineCode}` : 'Add New Machine'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* 1. Basic Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider border-b pb-1">
              1. Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="m-code">Machine Code *</Label>
                <Input
                  id="m-code"
                  placeholder="e.g. CNC-001"
                  value={formData.machineCode}
                  onChange={(e) => setFormData({ ...formData, machineCode: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="m-name">Machine Name *</Label>
                <Input
                  id="m-name"
                  placeholder="e.g. CNC Automated Lathe #01"
                  value={formData.machineName}
                  onChange={(e) => setFormData({ ...formData, machineName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="m-manufacturer">Manufacturer</Label>
                <Input
                  id="m-manufacturer"
                  placeholder="e.g. Mazak, Fanuc, Haas"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="m-model">Model</Label>
                <Input
                  id="m-model"
                  placeholder="e.g. Integrex i-200S"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="m-serial">Serial Number</Label>
                <Input
                  id="m-serial"
                  placeholder="e.g. SN-00125-MZK"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="m-asset">Asset Number</Label>
                <Input
                  id="m-asset"
                  placeholder="e.g. AST-MCH-001"
                  value={formData.assetNumber}
                  onChange={(e) => setFormData({ ...formData, assetNumber: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* 2. Organization */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider border-b pb-1">
              2. Organization & Placement
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="m-company">Company *</Label>
                <Select
                  value={formData.companyId}
                  onValueChange={(val) => setFormData({ ...formData, companyId: val })}
                >
                  <SelectTrigger id="m-company">
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
                <Label htmlFor="m-branch">Branch</Label>
                <Select
                  value={formData.branchId || 'HEAD_OFFICE'}
                  onValueChange={(val) =>
                    setFormData({ ...formData, branchId: val === 'HEAD_OFFICE' ? '' : val })
                  }
                >
                  <SelectTrigger id="m-branch">
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
                <Label htmlFor="m-dept">Department</Label>
                <Select
                  value={formData.departmentId || 'none'}
                  onValueChange={(val) =>
                    setFormData({ ...formData, departmentId: val === 'none' ? '' : val })
                  }
                >
                  <SelectTrigger id="m-dept">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- None / General --</SelectItem>
                    {departments
                      .filter((d) => !formData.companyId || d.companyId === formData.companyId)
                      .map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="m-line">Operational Unit</Label>
                <Select
                  value={formData.productionLineId || 'none'}
                  onValueChange={(val) =>
                    setFormData({ ...formData, productionLineId: val === 'none' ? '' : val })
                  }
                >
                  <SelectTrigger id="m-line">
                    <SelectValue placeholder="Select Operational Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Unassigned Unit --</SelectItem>
                    {productionLines
                      .filter((pl) => !formData.companyId || (pl as any).companyId === formData.companyId)
                      .map((pl) => (
                        <SelectItem key={pl.id} value={pl.id}>
                          {pl.lineCode} - {pl.lineName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="m-workstation">Workstation</Label>
                <Input
                  id="m-workstation"
                  placeholder="e.g. WS-01 Turning Cell"
                  value={formData.workstation}
                  onChange={(e) => setFormData({ ...formData, workstation: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="m-location">Location / Floor Bay</Label>
                <Input
                  id="m-location"
                  placeholder="e.g. Bay A, Heavy Machine Shop"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* 3. Capacity & Specifications */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider border-b pb-1">
              3. Capacity & Power Rating
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="m-capacity">Capacity</Label>
                <Input
                  id="m-capacity"
                  type="number"
                  placeholder="100"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="m-capacity-uom">Capacity UOM</Label>
                <Select
                  value={formData.capacityUom}
                  onValueChange={(val) => setFormData({ ...formData, capacityUom: val })}
                >
                  <SelectTrigger id="m-capacity-uom">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CAPACITY_UOMS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="m-op-hours">Operating Hours/Day</Label>
                <Input
                  id="m-op-hours"
                  type="number"
                  placeholder="8"
                  value={formData.operatingHours}
                  onChange={(e) =>
                    setFormData({ ...formData, operatingHours: Number(e.target.value) })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="m-power">Power Rating</Label>
                <Input
                  id="m-power"
                  type="number"
                  placeholder="25"
                  value={formData.powerRating}
                  onChange={(e) =>
                    setFormData({ ...formData, powerRating: Number(e.target.value) })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="m-power-uom">Power UOM</Label>
                <Select
                  value={formData.powerUom}
                  onValueChange={(val) => setFormData({ ...formData, powerUom: val })}
                >
                  <SelectTrigger id="m-power-uom">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kW">kW (Kilowatts)</SelectItem>
                    <SelectItem value="HP">HP (Horsepower)</SelectItem>
                    <SelectItem value="kVA">kVA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* 4. Maintenance Frequency */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider border-b pb-1">
              4. Maintenance Planning
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="m-freq">Frequency (Days)</Label>
                <Input
                  id="m-freq"
                  type="number"
                  placeholder="30"
                  value={formData.maintenanceFrequencyDays}
                  onChange={(e) =>
                    setFormData({ ...formData, maintenanceFrequencyDays: Number(e.target.value) })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="m-reminder-days">Reminder Lead (Days)</Label>
                <Input
                  id="m-reminder-days"
                  type="number"
                  placeholder="7"
                  value={formData.maintenanceReminderDays}
                  onChange={(e) =>
                    setFormData({ ...formData, maintenanceReminderDays: Number(e.target.value) })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="m-last-maint">Last Maintenance Date</Label>
                <Input
                  id="m-last-maint"
                  type="date"
                  value={formData.lastMaintenanceDate}
                  onChange={(e) =>
                    setFormData({ ...formData, lastMaintenanceDate: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="m-next-maint">Next Due Date</Label>
                <Input
                  id="m-next-maint"
                  type="date"
                  value={formData.nextMaintenanceDate}
                  onChange={(e) =>
                    setFormData({ ...formData, nextMaintenanceDate: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* 5. Status */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider border-b pb-1">
              5. Machine Status
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { val: 'ACTIVE', label: 'Active', desc: 'Ready for allocation' },
                { val: 'INACTIVE', label: 'Inactive', desc: 'Temporarily paused' },
                { val: 'UNDER_MAINTENANCE', label: 'Under Maintenance', desc: 'In repair' },
                { val: 'RETIRED', label: 'Retired', desc: 'Decommissioned' },
              ].map((s) => (
                <label
                  key={s.val}
                  className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-all ${
                    formData.status === s.val
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs">{s.label}</span>
                    <input
                      type="radio"
                      name="machine-status"
                      value={s.val}
                      checked={formData.status === s.val}
                      onChange={() => setFormData({ ...formData, status: s.val as any })}
                      className="sr-only"
                    />
                    {formData.status === s.val && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-1">{s.desc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 6. Documents */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider border-b pb-1">
              6. Machine Documentation
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: 'manual', label: 'Machine Manual' },
                { key: 'warranty', label: 'Warranty Document' },
                { key: 'certificate', label: 'Calibration Certificate' },
                { key: 'other', label: 'Safety Guidelines / Other' },
              ].map((doc) => (
                <div
                  key={doc.key}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/20"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-medium">{doc.label}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {uploadedDocs[doc.key] || 'No file attached'}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 shrink-0"
                    onClick={() => handleSimulateUpload(doc.key)}
                  >
                    <UploadCloud className="h-3.5 w-3.5" />
                    {uploadedDocs[doc.key] ? 'Replace' : 'Upload'}
                  </Button>
                </div>
              ))}
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
              {submitting ? 'Saving...' : machine ? 'Save Changes' : 'Save Machine'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
