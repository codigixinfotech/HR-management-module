import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Sparkles, Clock, Scale } from 'lucide-react';
import { machineManagementApi, type ProductionLine } from '@/api/machine-management';
import { branchesApi, departmentsApi } from '@/api/organization';
import { employeesApi } from '@/api/employees';
import { shiftTypesApi } from '@/api/workforce';
import type { Company, Branch, Department, Employee } from '@/api/types';
import { CapacityUomMasterModal } from './CapacityUomMasterModal';
import { capacityUomApi, type CapacityUomItem } from '@/api/machine-management';
import {
  formatTime24,
  formatTime12,
  isCrossMidnight,
  calculateShiftDurationHours,
  formatShiftTimingLabel,
  normalizeShiftName,
} from './shiftTimeUtils';

interface ShiftItem {
  id: string;
  name: string;
  code?: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  isNightShift: boolean;
}

const DEFAULT_SHIFTS: ShiftItem[] = [
  { id: 'shift-morn', name: 'Morning Shift', code: 'MS', startTime: '07:00', endTime: '15:00', durationHours: 8, isNightShift: false },
  { id: 'shift-eve', name: 'Evening Shift', code: 'ES', startTime: '15:00', endTime: '23:00', durationHours: 8, isNightShift: false },
  { id: 'shift-night', name: 'Night Shift', code: 'NS', startTime: '23:00', endTime: '07:00', durationHours: 8, isNightShift: true },
];

export function isShiftSelected(shift: ShiftItem, selected: string[]): boolean {
  return selected.some((s) => {
    if (s === shift.id) return true;
    const lowerS = s.toLowerCase();
    const lowerName = shift.name.toLowerCase();
    if (lowerS === lowerName) return true;
    if (lowerS.includes('morning') && lowerName.includes('morning')) return true;
    if (lowerS.includes('evening') && lowerName.includes('evening')) return true;
    if (lowerS.includes('night') && lowerName.includes('night')) return true;
    if (shift.code && lowerS === shift.code.toLowerCase()) return true;
    return false;
  });
}

interface AddEditLineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  line?: ProductionLine | null;
  productionLines?: ProductionLine[];
  companies: Company[];
  branches?: Branch[];
  departments?: Department[];
  employees?: Employee[];
  activeCompanyId?: string;
  activeBranchId?: string;
  onSuccess: () => void;
}

export function AddEditLineModal({
  open,
  onOpenChange,
  line,
  productionLines,
  companies,
  branches: initialBranches,
  departments: initialDepartments,
  employees: initialEmployees,
  activeCompanyId,
  activeBranchId,
  onSuccess,
}: AddEditLineModalProps) {
  const [submitting, setSubmitting] = useState(false);

  // Dynamic lists based on cascading selections
  const [dynamicBranches, setDynamicBranches] = useState<Branch[]>(initialBranches || []);
  const [dynamicDepartments, setDynamicDepartments] = useState<Department[]>(initialDepartments || []);
  const [dynamicEmployees, setDynamicEmployees] = useState<Employee[]>(initialEmployees || []);
  const [availableShifts, setAvailableShifts] = useState<ShiftItem[]>(DEFAULT_SHIFTS);
  const [selectedShifts, setSelectedShifts] = useState<string[]>(['Morning', 'Evening']);

  const [openUomMaster, setOpenUomMaster] = useState(false);
  const [uomItems, setUomItems] = useState<CapacityUomItem[]>([]);

  const loadUoms = useCallback(async () => {
    try {
      const data = await capacityUomApi.list();
      setUomItems(data || []);
    } catch (e) {
      console.error('Failed to load UOMs for form', e);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadUoms();
    }
  }, [open, loadUoms]);

  useEffect(() => {
    const handleUomUpdate = () => {
      loadUoms();
    };
    window.addEventListener('fhcm_uom_master_updated', handleUomUpdate);
    return () => window.removeEventListener('fhcm_uom_master_updated', handleUomUpdate);
  }, [loadUoms]);

  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  const [formData, setFormData] = useState({
    companyId: '',
    branchId: '',
    departmentId: '',
    lineCode: '',
    lineName: '',
    lineType: 'Operational Unit',
    location: '',
    supervisorId: '',
    supervisorName: '',
    productionCapacity: 50,
    capacityUom: 'Units / Day',
    workingHours: 16,
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE',
    description: '',
  });

  // Fetch branches for a specific company
  const loadBranchesForCompany = useCallback(async (compId: string) => {
    if (!compId) {
      setDynamicBranches([]);
      return [];
    }
    setLoadingBranches(true);
    try {
      const list = await branchesApi.list(compId);
      const res = list || [];
      setDynamicBranches(res);
      return res;
    } catch (err) {
      console.error('Failed to load branches for company', err);
      setDynamicBranches([]);
      return [];
    } finally {
      setLoadingBranches(false);
    }
  }, []);

  // Fetch departments for a specific company and optional branch
  const loadDepartmentsForScope = useCallback(async (compId: string, brId?: string) => {
    if (!compId) {
      setDynamicDepartments([]);
      return [];
    }
    setLoadingDepartments(true);
    try {
      const targetBranch = brId && brId !== 'none' && brId !== 'ALL' ? brId : undefined;
      const list = await departmentsApi.list(compId, targetBranch);
      const res = list || [];
      setDynamicDepartments(res);
      return res;
    } catch (err) {
      console.error('Failed to load departments', err);
      setDynamicDepartments([]);
      return [];
    } finally {
      setLoadingDepartments(false);
    }
  }, []);

  // Fetch employees for a specific company
  const loadEmployeesForCompany = useCallback(async (compId: string) => {
    if (!compId) {
      setDynamicEmployees([]);
      return [];
    }
    setLoadingEmployees(true);
    try {
      const res = await employeesApi.list({ companyId: compId, pageSize: 500 });
      const items = (res as any)?.items || [];
      setDynamicEmployees(items);
      return items;
    } catch (err) {
      console.error('Failed to load employees for company', err);
      setDynamicEmployees([]);
      return [];
    } finally {
      setLoadingEmployees(false);
    }
  }, []);

  // Fetch shifts from Shift Master for the company and standardize timings
  const loadShiftsForCompany = useCallback(async (compId: string) => {
    if (!compId) {
      setAvailableShifts(DEFAULT_SHIFTS);
      return DEFAULT_SHIFTS;
    }
    try {
      const list = await shiftTypesApi.list(compId);
      if (list && list.length > 0) {
        const mapped: ShiftItem[] = list.map((s) => {
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
        return mapped;
      } else {
        setAvailableShifts(DEFAULT_SHIFTS);
        return DEFAULT_SHIFTS;
      }
    } catch {
      setAvailableShifts(DEFAULT_SHIFTS);
      return DEFAULT_SHIFTS;
    }
  }, []);

  // Compute dynamic total hours from selected shifts
  const computedTotalHours = useMemo(() => {
    return availableShifts.reduce((acc, s) => {
      return isShiftSelected(s, selectedShifts) ? acc + s.durationHours : acc;
    }, 0);
  }, [availableShifts, selectedShifts]);

  const activeShiftCount = useMemo(() => {
    return availableShifts.filter((s) => isShiftSelected(s, selectedShifts)).length;
  }, [availableShifts, selectedShifts]);

  // Auto-generation helper for next sequential code (e.g. OU-001, OU-006...)
  const getNextCode = useCallback(
    (targetCompanyId?: string) => {
      const relevant = (productionLines || []).filter(
        (l) => !targetCompanyId || l.companyId === targetCompanyId
      );
      let maxNum = 0;
      for (const item of relevant) {
        if (!item.lineCode) continue;
        const match = item.lineCode.match(/\d+/);
        if (match) {
          const num = parseInt(match[0], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
      return `OU-${String(maxNum + 1).padStart(3, '0')}`;
    },
    [productionLines]
  );

  const handleRegenerateCode = () => {
    const nextCode = getNextCode(formData.companyId);
    setFormData((prev) => ({ ...prev, lineCode: nextCode }));
    toast.success(`Unit Code auto-generated: ${nextCode}`);
  };

  // Toggle shift selection & dynamically compute exact sum of operating hours
  const toggleShift = (shift: ShiftItem) => {
    setSelectedShifts((prev) => {
      const alreadySelected = isShiftSelected(shift, prev);
      let updated: string[];
      if (alreadySelected) {
        updated = prev.filter((val) => {
          if (val === shift.id) return false;
          const lowerVal = val.toLowerCase();
          const lowerName = shift.name.toLowerCase();
          if (lowerVal === lowerName) return false;
          if (lowerVal.includes('morning') && lowerName.includes('morning')) return false;
          if (lowerVal.includes('evening') && lowerName.includes('evening')) return false;
          if (lowerVal.includes('night') && lowerName.includes('night')) return false;
          if (shift.code && lowerVal === shift.code.toLowerCase()) return false;
          return true;
        });
      } else {
        updated = [...prev, shift.name];
      }

      // Sum exact hours from Shift Master for all selected shifts
      const totalHours = availableShifts.reduce((acc, s) => {
        return isShiftSelected(s, updated) ? acc + s.durationHours : acc;
      }, 0);

      setFormData((f) => ({
        ...f,
        workingHours: totalHours,
      }));
      return updated;
    });
  };

  // Initialize form when modal opens or target line changes
  useEffect(() => {
    if (!open) return;

    if (line) {
      const targetComp = line.companyId || activeCompanyId || (companies[0]?.id ?? '');
      const targetBranch = line.branchId || 'HEAD_OFFICE';
      const targetDept = line.departmentId || '';

      // Initialize selected shifts based on line shift count
      const shiftCount = Number(line.numberOfShifts) || 2;
      const initialShifts =
        shiftCount === 3
          ? ['Morning Shift', 'Evening Shift', 'Night Shift']
          : shiftCount === 1
          ? ['Morning Shift']
          : shiftCount === 0
          ? []
          : ['Morning Shift', 'Evening Shift'];
      setSelectedShifts(initialShifts);

      // Normalize capacityUom
      let uom = line.capacityUom || 'Units / Day';
      if (uom === 'Units/Day') uom = 'Units / Day';
      if (uom === 'Units/Hour') uom = 'Units / Hour';
      if (uom === 'Cycles/Min') uom = 'Cycles / Min';
      if (uom === 'Kg/Day') uom = 'Kg / Day';

      setFormData({
        companyId: targetComp,
        branchId: targetBranch,
        departmentId: targetDept,
        lineCode: line.lineCode || '',
        lineName: line.lineName || '',
        lineType: line.lineType || 'Operational Unit',
        location: line.location || '',
        supervisorId: line.supervisorId || '',
        supervisorName: line.supervisorName || '',
        productionCapacity: Number(line.productionCapacity) || 50,
        capacityUom: uom,
        workingHours: Number(line.workingHours) || (shiftCount === 3 ? 24 : shiftCount * 8),
        status: (line.status as any) || 'ACTIVE',
        description: line.description || '',
      });

      if (targetComp) {
        loadBranchesForCompany(targetComp);
        loadDepartmentsForScope(targetComp, targetBranch);
        loadEmployeesForCompany(targetComp);
        loadShiftsForCompany(targetComp);
      }
    } else {
      // Auto-fetch company from upward details
      const initialComp = activeCompanyId || (companies[0]?.id ?? '');
      const autoCode = getNextCode(initialComp);

      // Check if upward branch is a real branch ID (not HEAD_OFFICE / ALL)
      const isRealBranchId =
        activeBranchId &&
        activeBranchId !== 'HEAD_OFFICE' &&
        activeBranchId !== 'ALL' &&
        activeBranchId !== 'NONE';

      const initialBranch = isRealBranchId
        ? activeBranchId
        : (activeBranchId === 'HEAD_OFFICE' || !activeBranchId ? 'HEAD_OFFICE' : '');

      setSelectedShifts(['Morning Shift', 'Evening Shift']);

      setFormData({
        companyId: initialComp,
        branchId: initialBranch,
        departmentId: '',
        lineCode: autoCode,
        lineName: '',
        lineType: 'Operational Unit',
        location: '',
        supervisorId: '',
        supervisorName: '',
        productionCapacity: 50,
        capacityUom: 'Units / Day',
        workingHours: 16,
        status: 'ACTIVE',
        description: '',
      });

      if (initialComp) {
        loadBranchesForCompany(initialComp);
        loadDepartmentsForScope(initialComp, initialBranch);
        loadEmployeesForCompany(initialComp);
        loadShiftsForCompany(initialComp);
      }
    }
  }, [
    open,
    line,
    activeCompanyId,
    activeBranchId,
    companies,
    getNextCode,
    loadBranchesForCompany,
    loadDepartmentsForScope,
    loadEmployeesForCompany,
    loadShiftsForCompany,
  ]);

  // Handle Company change -> resets Branch, Department, Supervisor, Shifts and regenerates Code
  const handleCompanyChange = async (compId: string) => {
    const nextCode = getNextCode(compId);
    setFormData((prev) => ({
      ...prev,
      companyId: compId,
      lineCode: prev.lineCode.startsWith('OU-') || !prev.lineCode ? nextCode : prev.lineCode,
      branchId: 'HEAD_OFFICE',
      departmentId: '',
      supervisorId: '',
      supervisorName: '',
    }));
    await Promise.all([
      loadBranchesForCompany(compId),
      loadDepartmentsForScope(compId, 'HEAD_OFFICE'),
      loadEmployeesForCompany(compId),
      loadShiftsForCompany(compId),
    ]);
  };

  // Handle Branch change -> resets Department, Supervisor
  const handleBranchChange = async (val: string) => {
    const brId = val === 'none' ? '' : val;
    setFormData((prev) => ({
      ...prev,
      branchId: brId,
      departmentId: '',
      supervisorId: '',
      supervisorName: '',
    }));
    await loadDepartmentsForScope(formData.companyId, brId);
  };

  // Handle Department change -> resets Supervisor
  const handleDepartmentChange = (val: string) => {
    const deptId = val === 'none' ? '' : val;
    setFormData((prev) => ({
      ...prev,
      departmentId: deptId,
      supervisorId: '',
      supervisorName: '',
    }));
  };

  // Filter employees strictly by selected department
  const departmentEmployees = useMemo(() => {
    if (!formData.departmentId || formData.departmentId === 'none') {
      return [];
    }
    return dynamicEmployees.filter((emp) => emp.departmentId === formData.departmentId);
  }, [dynamicEmployees, formData.departmentId]);

  const handleSupervisorChange = (empId: string) => {
    if (empId === 'none' || !empId) {
      setFormData((prev) => ({ ...prev, supervisorId: '', supervisorName: '' }));
      return;
    }
    const emp = dynamicEmployees.find((e) => e.id === empId);
    const name = emp ? `${emp.firstName} ${emp.lastName}` : '';
    setFormData((prev) => ({ ...prev, supervisorId: empId, supervisorName: name }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lineCode.trim()) {
      toast.error('Unit Code is required');
      return;
    }
    if (!formData.lineName.trim()) {
      toast.error('Unit Name is required');
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
        branchId: formData.branchId && formData.branchId !== 'none' && formData.branchId !== 'HEAD_OFFICE' ? formData.branchId : null,
        departmentId: formData.departmentId && formData.departmentId !== 'none' ? formData.departmentId : null,
        lineCode: formData.lineCode.trim(),
        lineName: formData.lineName.trim(),
        lineType: formData.lineType || 'Operational Unit',
        location: formData.location.trim() || undefined,
        supervisorId: formData.supervisorId && formData.supervisorId !== 'none' ? formData.supervisorId : null,
        supervisorName: formData.supervisorName || null,
        productionCapacity: Number(formData.productionCapacity),
        capacityUom: formData.capacityUom,
        workingHours: Number(formData.workingHours),
        numberOfShifts: selectedShifts.length,
        status: formData.status,
        description: formData.description.trim() || undefined,
      };

      if (line) {
        await machineManagementApi.updateProductionLine(line.id, payload);
        toast.success(`Operational Unit ${payload.lineCode} updated successfully`);
      } else {
        await machineManagementApi.createProductionLine(payload);
        toast.success(`Operational Unit ${payload.lineCode} created successfully`);
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save operational unit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {line ? `Edit Operational Unit: ${line.lineCode}` : 'Add New Operational Unit'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Unit Code (Auto-generated & editable) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="pl-code">Unit Code *</Label>
                <button
                  type="button"
                  onClick={handleRegenerateCode}
                  className="text-[11px] text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-primary/10"
                  title="Generate next sequential Unit Code"
                >
                  <Sparkles className="h-3 w-3" />
                  Auto-Generate
                </button>
              </div>
              <Input
                id="pl-code"
                placeholder="e.g. OU-001"
                value={formData.lineCode}
                onChange={(e) => setFormData({ ...formData, lineCode: e.target.value })}
                required
              />
              <span className="text-[10px] text-muted-foreground block">
                Auto-assigned sequential code (editable)
              </span>
            </div>

            {/* 2. Unit Name */}
            <div className="space-y-1.5">
              <Label htmlFor="pl-name">Unit Name *</Label>
              <Input
                id="pl-name"
                placeholder="e.g. Intensive Care Unit, CNC Line 1, Outpatient Dept"
                value={formData.lineName}
                onChange={(e) => setFormData({ ...formData, lineName: e.target.value })}
                required
              />
            </div>

            {/* 3. Company */}
            <div className="space-y-1.5">
              <Label htmlFor="pl-company">Company *</Label>
              <Select
                value={formData.companyId}
                onValueChange={handleCompanyChange}
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

            {/* 4. Branch (Strictly filtered by selected Company) */}
            <div className="space-y-1.5">
              <Label htmlFor="pl-branch">Branch</Label>
              <Select
                value={formData.branchId || 'HEAD_OFFICE'}
                onValueChange={handleBranchChange}
                disabled={loadingBranches}
              >
                <SelectTrigger id="pl-branch">
                  <SelectValue
                    placeholder={
                      loadingBranches ? 'Loading branches...' : 'Select Branch'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HEAD_OFFICE">Head Office</SelectItem>
                  {dynamicBranches
                    .filter((b) => !b.name?.toLowerCase().includes('head office'))
                    .map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* 5. Department (Strictly filtered by selected Branch) */}
            <div className="space-y-1.5">
              <Label htmlFor="pl-dept">Department</Label>
              <Select
                value={formData.departmentId || 'none'}
                onValueChange={handleDepartmentChange}
                disabled={loadingDepartments}
              >
                <SelectTrigger id="pl-dept">
                  <SelectValue
                    placeholder={
                      loadingDepartments ? 'Loading departments...' : 'Select Department'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Select Department --</SelectItem>
                  {dynamicDepartments.length === 0 ? (
                    <div className="py-2 px-3 text-xs text-muted-foreground text-center">
                      No departments available
                    </div>
                  ) : (
                    dynamicDepartments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* 6. Supervisor / Unit Head (Strictly filtered by selected Department) */}
            <div className="space-y-1.5">
              <Label htmlFor="pl-supervisor">Supervisor / Unit Head (Employee Master)</Label>
              <Select
                value={formData.supervisorId || 'none'}
                onValueChange={handleSupervisorChange}
                disabled={!formData.departmentId || loadingEmployees}
              >
                <SelectTrigger id="pl-supervisor">
                  <SelectValue
                    placeholder={
                      !formData.departmentId
                        ? 'Select Department First'
                        : loadingEmployees
                        ? 'Loading employees...'
                        : 'Select Supervisor / Unit Head'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Unassigned Supervisor --</SelectItem>
                  {departmentEmployees.length === 0 ? (
                    <div className="py-2 px-3 text-xs text-muted-foreground text-center">
                      No employees found in this department
                    </div>
                  ) : (
                    departmentEmployees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeCode})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* 7. Location / Area */}
            <div className="space-y-1.5">
              <Label htmlFor="pl-location">Location / Area</Label>
              <Input
                id="pl-location"
                placeholder="e.g. 2nd Floor ICU, Bay A Machining, OPD Wing"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            {/* 8. Status */}
            <div className="space-y-1.5">
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

            {/* 9. Capacity */}
            <div className="space-y-1.5">
              <Label htmlFor="pl-capacity">Capacity</Label>
              <Input
                id="pl-capacity"
                type="number"
                placeholder="e.g. 50 (Beds) or 500 (Units)"
                value={formData.productionCapacity}
                onChange={(e) =>
                  setFormData({ ...formData, productionCapacity: Number(e.target.value) })
                }
              />
            </div>

            {/* 10. Capacity UOM (Universal Master) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="pl-capacity-uom">Capacity UOM</Label>
                <button
                  type="button"
                  onClick={() => setOpenUomMaster(true)}
                  className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium cursor-pointer"
                  title="Open Capacity UOM Master to add or manage units"
                >
                  <Scale className="h-3 w-3" />
                  UOM Master
                </button>
              </div>
              <Select
                value={formData.capacityUom}
                onValueChange={(val) => {
                  if (val === '__MANAGE_MASTER__') {
                    setOpenUomMaster(true);
                  } else {
                    setFormData({ ...formData, capacityUom: val });
                  }
                }}
              >
                <SelectTrigger id="pl-capacity-uom">
                  <SelectValue placeholder="Select Capacity UOM" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {uomItems.length === 0 ? (
                    <div className="p-2.5 text-center text-xs text-muted-foreground">
                      No UOMs in Master yet.
                    </div>
                  ) : (
                    uomItems.map((item) => (
                      <SelectItem key={item.id} value={item.name}>
                        {item.name}
                      </SelectItem>
                    ))
                  )}

                  {Boolean(formData.capacityUom && !uomItems.some((i) => i.name === formData.capacityUom)) && (
                    <SelectItem value={formData.capacityUom}>
                      {formData.capacityUom}
                    </SelectItem>
                  )}

                  <div className="p-1 border-t mt-1">
                    <SelectItem
                      value="__MANAGE_MASTER__"
                      className="text-primary font-medium focus:text-primary cursor-pointer text-xs"
                    >
                      + Manage / Add Custom UOM Master...
                    </SelectItem>
                  </div>
                </SelectContent>
              </Select>
            </div>

            {/* 11. Operating Hours / Day */}
            <div className="space-y-1.5 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="pl-hours">Operating Hours / Day</Label>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {activeShiftCount > 0
                    ? `Auto-synced with ${activeShiftCount} active ${activeShiftCount === 1 ? 'shift' : 'shifts'} (${computedTotalHours} hrs/day)`
                    : 'Manual input (0 hrs)'}
                </span>
              </div>
              <Input
                id="pl-hours"
                type="number"
                placeholder="e.g. 24 for ICU, 16 for 2-shift plant, 8 for Single Shift"
                value={formData.workingHours}
                onChange={(e) =>
                  setFormData({ ...formData, workingHours: Number(e.target.value) })
                }
              />
            </div>

            {/* 12. Assigned Shifts (Shift Master Selection -> Calculates Active Shifts) */}
            <div className="space-y-2 md:col-span-2 p-3.5 rounded-lg border bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    Assigned Shifts (Shift Master)
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Assign operating shifts to this unit. Working hours and active shift count are auto-calculated from Shift Master.
                  </p>
                </div>
                <Badge
                  variant={activeShiftCount > 0 ? 'default' : 'secondary'}
                  className="text-xs px-2.5 py-0.5 font-medium shrink-0"
                >
                  {activeShiftCount} {activeShiftCount === 1 ? 'Active Shift' : 'Active Shifts'} · {computedTotalHours} hrs
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1.5">
                {availableShifts.map((shift) => {
                  const isChecked = isShiftSelected(shift, selectedShifts);
                  return (
                    <button
                      key={shift.id || shift.name}
                      type="button"
                      onClick={() => toggleShift(shift)}
                      className={`flex items-start gap-2.5 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                        isChecked
                          ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30'
                          : 'border-border/70 bg-background hover:bg-muted/40'
                      }`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleShift(shift)}
                        className="mt-0.5 pointer-events-none"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-foreground truncate">
                            {shift.name}
                          </p>
                          <Badge variant="outline" className="text-[10px] py-0 px-1 font-mono font-medium shrink-0">
                            {shift.durationHours} hrs
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {formatTime24(shift.startTime)} – {formatTime24(shift.endTime)}
                          <span className="text-[10px] text-muted-foreground/80 block">
                            ({formatTime12(shift.startTime)} – {formatTime12(shift.endTime)})
                          </span>
                        </p>
                        {shift.isNightShift && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900/50 mt-0.5">
                            🌙 +1 Day (Cross Midnight)
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 13. Description */}
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="pl-desc">Description</Label>
              <Textarea
                id="pl-desc"
                rows={3}
                placeholder="Provide notes on machinery cells, clinical care capabilities, beds, or procedures..."
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
              {submitting ? 'Saving...' : line ? 'Save Changes' : 'Save Operational Unit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <CapacityUomMasterModal
      open={openUomMaster}
      onOpenChange={setOpenUomMaster}
      selectedUom={formData.capacityUom}
      onSelectUom={(name) => {
        setFormData((prev) => ({ ...prev, capacityUom: name }));
      }}
    />
  </>
  );
}
