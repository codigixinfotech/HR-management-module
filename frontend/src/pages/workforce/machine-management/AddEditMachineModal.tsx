import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  machineManagementApi,
  capacityUomApi,
  type Machine,
  type ProductionLine,
  type CapacityUomItem,
} from '@/api/machine-management';
import { shiftTypesApi } from '@/api/workforce';
import type { Company, Branch, Department, Employee } from '@/api/types';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  Clock,
  Camera,
  RotateCcw,
  Plus,
  Trash2,
  Sparkles,
  Settings,
  Building2,
  BarChart3,
  Wrench,
  Power,
  Image as ImageIcon,
  HelpCircle,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Info,
  ShieldCheck,
  Award,
  BookOpen,
} from 'lucide-react';
import { CapacityUomMasterModal } from './CapacityUomMasterModal';
import { Machine360ViewerModal } from './Machine360ViewerModal';
import {
  formatTime12,
  calculateShiftDurationHours,
} from './shiftTimeUtils';

interface AddEditMachineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machine?: Machine | null;
  companies: Company[];
  branches: Branch[];
  departments: Department[];
  productionLines: ProductionLine[];
  employees?: Employee[];
  activeCompanyId?: string;
  activeBranchId?: string;
  onSuccess: () => void;
}

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

function isShiftSelected(shift: ShiftItem, selected: string[]): boolean {
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

const UNIVERSAL_FALLBACK_UOMS = [
  'Patients / Day',
  'Tests / Day',
  'Beds',
  'Procedures / Day',
  'Sessions / Day',
  'Units / Day',
  'Units / Hour',
  'Cycles / Min',
  'Kg / Day',
  'Hours / Day',
  'Rooms',
];

const STANDARD_MACHINE_TYPES = [
  'MRI',
  'CT Scanner',
  'X-Ray',
  'Ultrasound',
  'Ventilator',
  'Dialysis Unit',
  'Defibrillator',
  'Patient Monitor',
  'Anesthesia Machine',
  'ECG Machine',
  'Laboratory Analyzer',
  'Surgical Table',
  'Endoscopy Tower',
  'Autoclave / Sterilizer',
  'General Equipment',
];

const POWER_UOM_OPTIONS = [
  'kW (Kilowatts)',
  'kVA',
  'HP',
  'Watts',
  'kWh',
];

const STANDARD_ANGLES = ['Front', 'Back', 'Left', 'Right', 'Top'];

// Realistic sample medical equipment image set for instant demo/testing
const SAMPLE_MEDICAL_IMAGES = {
  main: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
  front: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
  back: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
  left: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
  right: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
  top: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=80',
};

export function AddEditMachineModal({
  open,
  onOpenChange,
  machine,
  companies,
  branches,
  departments,
  productionLines,
  employees = [],
  activeCompanyId,
  activeBranchId,
  onSuccess,
}: AddEditMachineModalProps) {
  const [submitting, setSubmitting] = useState(false);

  // Hidden File Inputs Refs
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);
  const [targetAngleForUpload, setTargetAngleForUpload] = useState<string>('Front');
  const [targetDocKeyForUpload, setTargetDocKeyForUpload] = useState<string>('manual');

  // Drag-to-rotate state for 360 viewer
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);

  // Capacity UOM Master State
  const [openUomMaster, setOpenUomMaster] = useState(false);
  const [uomItems, setUomItems] = useState<CapacityUomItem[]>([]);

  // Shift Master State
  const [availableShifts, setAvailableShifts] = useState<ShiftItem[]>(DEFAULT_SHIFTS);
  const [selectedShifts, setSelectedShifts] = useState<string[]>(['Morning Shift', 'Evening Shift']);

  // Images & 360 Viewer State
  const [mainPhoto, setMainPhoto] = useState<string>('');
  const [angleImages, setAngleImages] = useState<{ [angle: string]: string }>({});
  const [activeAngleTab, setActiveAngleTab] = useState<string>('Front');
  const [customAngles, setCustomAngles] = useState<string[]>([]);
  const [open360Modal, setOpen360Modal] = useState(false);

  // Form Data State
  const [formData, setFormData] = useState({
    companyId: '',
    branchId: '',
    departmentId: '',
    productionLineId: '',
    machineCode: '',
    machineName: '',
    machineType: 'MRI',
    manufacturer: '',
    model: '',
    serialNumber: '',
    assetNumber: '',
    location: '', // Room / Installation Area
    workstation: '', // Workstation / Location
    responsibleEmployeeId: '',
    capacity: 20,
    capacityUom: 'Patients / Day',
    operatingHours: 16,
    powerRating: 75,
    powerUom: 'kW (Kilowatts)',
    maintenanceFrequencyDays: 180,
    maintenanceReminderDays: 15,
    lastMaintenanceDate: '',
    nextMaintenanceDate: '',
    calibrationFrequencyDays: 365,
    lastCalibrationDate: '',
    nextCalibrationDate: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'UNDER_MAINTENANCE' | 'RETIRED',
  });

  // Attached Documentation State
  const [uploadedDocs, setUploadedDocs] = useState<{ [key: string]: string }>({
    manual: '',
    warranty: '',
    certificate: '',
    other: '',
  });

  // Load Capacity UOMs
  const loadUoms = useCallback(async () => {
    try {
      const data = await capacityUomApi.getAll({ activeOnly: true });
      if (Array.isArray(data) && data.length > 0) {
        setUomItems(data);
      }
    } catch {
      // Keep fallbacks
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadUoms();
    }
  }, [open, loadUoms]);

  // Load shifts for selected company
  const loadShiftsForCompany = useCallback(async (compId?: string) => {
    if (!compId) return;
    try {
      const data = await shiftTypesApi.getAll({ companyId: compId });
      if (Array.isArray(data) && data.length > 0) {
        const mapped: ShiftItem[] = data.map((s: any) => {
          const sTime = s.startTime || '07:00';
          const eTime = s.endTime || '15:00';
          const dur = calculateShiftDurationHours(sTime, eTime);
          const isNight = Boolean(s.isNightShift) || (dur > 0 && sTime > eTime);
          return {
            id: s.id,
            name: s.name,
            code: s.code,
            startTime: sTime,
            endTime: eTime,
            durationHours: dur,
            isNightShift: isNight,
          };
        });
        setAvailableShifts(mapped);
      } else {
        setAvailableShifts(DEFAULT_SHIFTS);
      }
    } catch {
      setAvailableShifts(DEFAULT_SHIFTS);
    }
  }, []);

  const activeShiftsList = availableShifts.filter((s) => isShiftSelected(s, selectedShifts));
  const activeShiftCount = activeShiftsList.length;
  const computedTotalHours = activeShiftsList.reduce((acc, s) => acc + (s.durationHours || 8), 0);

  // Sync computed working hours into formData whenever selectedShifts change
  useEffect(() => {
    if (activeShiftCount > 0) {
      setFormData((prev) => ({ ...prev, operatingHours: computedTotalHours }));
    }
  }, [activeShiftCount, computedTotalHours]);

  const toggleShift = (shift: ShiftItem) => {
    setSelectedShifts((prev) => {
      const isAlready = isShiftSelected(shift, prev);
      if (isAlready) {
        return prev.filter((s) => {
          if (s === shift.id) return false;
          if (s.toLowerCase() === shift.name.toLowerCase()) return false;
          if (s.toLowerCase().includes('morning') && shift.name.toLowerCase().includes('morning')) return false;
          if (s.toLowerCase().includes('evening') && shift.name.toLowerCase().includes('evening')) return false;
          if (s.toLowerCase().includes('night') && shift.name.toLowerCase().includes('night')) return false;
          return true;
        });
      } else {
        return [...prev, shift.name];
      }
    });
  };

  // Populate form on open or machine change
  useEffect(() => {
    const compId = machine?.companyId || activeCompanyId || (companies[0]?.id ?? '');
    loadShiftsForCompany(compId);

    if (machine) {
      let parsedDocs: any = {};
      try {
        if (typeof machine.documentsJson === 'string') {
          parsedDocs = JSON.parse(machine.documentsJson);
        } else if (machine.documentsJson && typeof machine.documentsJson === 'object') {
          parsedDocs = machine.documentsJson;
        }
      } catch {
        parsedDocs = {};
      }

      setFormData({
        companyId: machine.companyId || activeCompanyId || '',
        branchId: machine.branchId || (activeBranchId && activeBranchId !== 'HEAD_OFFICE' ? activeBranchId : '') || '',
        departmentId: machine.departmentId || '',
        productionLineId: machine.productionLineId || '',
        machineCode: machine.machineCode || '',
        machineName: machine.machineName || '',
        machineType: machine.machineType || 'MRI',
        manufacturer: machine.manufacturer || '',
        model: machine.model || '',
        serialNumber: machine.serialNumber || '',
        assetNumber: machine.assetNumber || '',
        location: machine.location || '',
        workstation: machine.workstation || '',
        responsibleEmployeeId: parsedDocs?.responsibleEmployeeId || '',
        capacity: Number(machine.capacity) || 20,
        capacityUom: machine.capacityUom || 'Patients / Day',
        operatingHours: Number(machine.operatingHours) || 16,
        powerRating: Number(machine.powerRating) || 75,
        powerUom: machine.powerUom || 'kW (Kilowatts)',
        maintenanceFrequencyDays: Number(machine.maintenanceFrequencyDays) || 180,
        maintenanceReminderDays: Number(machine.maintenanceReminderDays) || 15,
        lastMaintenanceDate: machine.lastMaintenanceDate ? machine.lastMaintenanceDate.slice(0, 10) : '',
        nextMaintenanceDate: machine.nextMaintenanceDate ? machine.nextMaintenanceDate.slice(0, 10) : '',
        calibrationFrequencyDays: parsedDocs?.calibration?.frequencyDays || 365,
        lastCalibrationDate: parsedDocs?.calibration?.lastDate || '',
        nextCalibrationDate: parsedDocs?.calibration?.nextDueDate || '',
        status: machine.status || 'ACTIVE',
      });

      if (parsedDocs?.docs) {
        setUploadedDocs(parsedDocs.docs);
      }
      if (parsedDocs?.images?.mainPhoto) {
        setMainPhoto(parsedDocs.images.mainPhoto);
      } else if (machine.mainPhoto) {
        setMainPhoto(machine.mainPhoto);
      } else {
        setMainPhoto('');
      }

      if (parsedDocs?.images?.angles) {
        setAngleImages(parsedDocs.images.angles);
      } else if (machine.angleImages) {
        setAngleImages(machine.angleImages);
      } else {
        setAngleImages({});
      }

      if (parsedDocs?.assignedShifts && Array.isArray(parsedDocs.assignedShifts)) {
        setSelectedShifts(parsedDocs.assignedShifts);
      } else if (machine.currentShift) {
        setSelectedShifts([machine.currentShift]);
      }
    } else {
      setFormData({
        companyId: activeCompanyId || (companies[0]?.id ?? ''),
        branchId: activeBranchId && activeBranchId !== 'HEAD_OFFICE' && activeBranchId !== 'ALL' ? activeBranchId : '',
        departmentId: departments[0]?.id ?? '',
        productionLineId: productionLines[0]?.id ?? '',
        machineCode: '',
        machineName: '',
        machineType: 'MRI',
        manufacturer: '',
        model: '',
        serialNumber: '',
        assetNumber: '',
        location: '',
        workstation: '',
        responsibleEmployeeId: employees[0]?.id || '',
        capacity: 20,
        capacityUom: 'Patients / Day',
        operatingHours: 16,
        powerRating: 75,
        powerUom: 'kW (Kilowatts)',
        maintenanceFrequencyDays: 180,
        maintenanceReminderDays: 15,
        lastMaintenanceDate: '',
        nextMaintenanceDate: '',
        calibrationFrequencyDays: 365,
        lastCalibrationDate: '',
        nextCalibrationDate: '',
        status: 'ACTIVE',
      });
      setSelectedShifts(['Morning Shift', 'Evening Shift']);
      setMainPhoto('');
      setAngleImages({});
      setUploadedDocs({ manual: '', warranty: '', certificate: '', other: '' });
    }
  }, [machine, open, activeCompanyId, activeBranchId, companies, departments, productionLines, employees, loadShiftsForCompany]);

  // Handle Maintenance Date change & auto-calculate next due date
  const handleLastMaintenanceChange = (dateVal: string) => {
    let nextVal = formData.nextMaintenanceDate;
    if (dateVal) {
      const base = new Date(dateVal);
      const freq = Number(formData.maintenanceFrequencyDays) || 180;
      nextVal = new Date(base.getTime() + freq * 86400000).toISOString().slice(0, 10);
    }
    setFormData((prev) => ({
      ...prev,
      lastMaintenanceDate: dateVal,
      nextMaintenanceDate: nextVal,
    }));
  };

  // Handle Calibration Date change & auto-calculate next due date
  const handleLastCalibrationChange = (dateVal: string) => {
    let nextVal = formData.nextCalibrationDate;
    if (dateVal) {
      const base = new Date(dateVal);
      const freq = Number(formData.calibrationFrequencyDays) || 365;
      nextVal = new Date(base.getTime() + freq * 86400000).toISOString().slice(0, 10);
    }
    setFormData((prev) => ({
      ...prev,
      lastCalibrationDate: dateVal,
      nextCalibrationDate: nextVal,
    }));
  };

  // Trigger Image Picker reliably via useRef
  const triggerImageUpload = (angleName: string) => {
    setTargetAngleForUpload(angleName);
    if (imageFileInputRef.current) {
      imageFileInputRef.current.value = '';
      imageFileInputRef.current.click();
    }
  };

  // Handle Image File selection via FileReader
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a valid image file (PNG, JPG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) return;
      const angleKey = targetAngleForUpload.toLowerCase();
      setAngleImages((prev) => ({ ...prev, [angleKey]: result }));
      if (angleKey === 'front' || !mainPhoto) {
        setMainPhoto(result);
      }
      setActiveAngleTab(targetAngleForUpload);
      toast.success(`${targetAngleForUpload} angle image uploaded successfully!`);
    };
    reader.onerror = () => {
      toast.error('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  // Trigger Doc Picker reliably via useRef
  const triggerDocUpload = (docKey: string) => {
    setTargetDocKeyForUpload(docKey);
    if (docFileInputRef.current) {
      docFileInputRef.current.value = '';
      docFileInputRef.current.click();
    }
  };

  // Handle Doc File selection
  const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedDocs((prev) => ({ ...prev, [targetDocKeyForUpload]: file.name }));
    toast.success(`${file.name} attached!`);
  };

  // Load Sample Medical Photos (Quick Preview & Test)
  const handleLoadSampleMedicalPhotos = () => {
    setMainPhoto(SAMPLE_MEDICAL_IMAGES.main);
    setAngleImages({
      front: SAMPLE_MEDICAL_IMAGES.front,
      back: SAMPLE_MEDICAL_IMAGES.back,
      left: SAMPLE_MEDICAL_IMAGES.left,
      right: SAMPLE_MEDICAL_IMAGES.right,
      top: SAMPLE_MEDICAL_IMAGES.top,
    });
    toast.success('Loaded sample equipment photos (Main + 5 Angles)');
  };

  // All Angle Tabs (Standard + Custom)
  const allAngleTabs = [...STANDARD_ANGLES, ...customAngles];

  // Navigate angle by step (+1 or -1)
  const stepAngle = (delta: number) => {
    const currentIndex = allAngleTabs.findIndex(
      (a) => a.toLowerCase() === activeAngleTab.toLowerCase()
    );
    const validIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex = (validIndex + delta + allAngleTabs.length) % allAngleTabs.length;
    setActiveAngleTab(allAngleTabs[nextIndex]);
  };

  // Drag interaction handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const diff = e.clientX - dragStartX;
    if (Math.abs(diff) > 45) {
      if (diff > 0) {
        stepAngle(1);
      } else {
        stepAngle(-1);
      }
      setDragStartX(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add Custom Angle
  const handleAddCustomAngle = () => {
    const name = prompt('Enter name for additional angle (e.g. Isometric, Console, Top-Interior):');
    if (name && name.trim()) {
      const trimmed = name.trim();
      if (!customAngles.includes(trimmed) && !STANDARD_ANGLES.includes(trimmed)) {
        setCustomAngles((prev) => [...prev, trimmed]);
        setActiveAngleTab(trimmed);
        triggerImageUpload(trimmed);
      }
    }
  };

  // Submit Handler
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
      const documentsPayload = {
        docs: uploadedDocs,
        images: {
          mainPhoto: mainPhoto || angleImages.front || undefined,
          angles: angleImages,
        },
        assignedShifts: selectedShifts,
        responsibleEmployeeId: formData.responsibleEmployeeId || undefined,
        calibration: {
          frequencyDays: Number(formData.calibrationFrequencyDays),
          lastDate: formData.lastCalibrationDate || undefined,
          nextDueDate: formData.nextCalibrationDate || undefined,
        },
      };

      const payload: Partial<Machine> = {
        companyId: formData.companyId,
        branchId: formData.branchId || null,
        departmentId: formData.departmentId || null,
        productionLineId: formData.productionLineId || null,
        machineCode: formData.machineCode.trim(),
        machineName: formData.machineName.trim(),
        machineType: formData.machineType || 'MRI',
        manufacturer: formData.manufacturer.trim() || undefined,
        model: formData.model.trim() || undefined,
        serialNumber: formData.serialNumber.trim() || undefined,
        assetNumber: formData.assetNumber.trim() || undefined,
        location: formData.location.trim() || undefined,
        workstation: formData.workstation.trim() || undefined,
        capacity: Number(formData.capacity),
        capacityUom: formData.capacityUom,
        operatingHours: Number(formData.operatingHours),
        powerRating: Number(formData.powerRating),
        powerUom: formData.powerUom,
        maintenanceFrequencyDays: Number(formData.maintenanceFrequencyDays),
        maintenanceReminderDays: Number(formData.maintenanceReminderDays),
        lastMaintenanceDate: formData.lastMaintenanceDate || undefined,
        nextMaintenanceDate: formData.nextMaintenanceDate || undefined,
        status: formData.status,
        documentsJson: documentsPayload,
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

  // Get active photo to display in 360 viewer
  const currentAngleKey = activeAngleTab.toLowerCase();
  const currentDisplayedPhoto = angleImages[currentAngleKey] || (currentAngleKey === 'front' ? mainPhoto : '') || '';

  return (
    <>
      {/* Invisible Native File Inputs */}
      <input
        ref={imageFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFileChange}
      />
      <input
        ref={docFileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={handleDocFileChange}
      />

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[94vh] overflow-y-auto p-6 sm:p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
          {/* Header */}
          <DialogHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {machine ? `Edit Machine / Equipment: ${machine.machineCode}` : 'Add New Machine / Equipment'}
                </DialogTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Register medical / hospital equipment, assign to department & operational unit
                </p>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 pt-2">
            {/* 2-Column Responsive Grid matching reference */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
              {/* LEFT COLUMN: Sections 1 through 6 */}
              <div className="lg:col-span-7 space-y-6">
                {/* 1. BASIC INFORMATION */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>1. Basic Information</span>
                  </h3>

                  {/* Row 1: Machine Code, Machine Name, Machine Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="m-code" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Machine Code <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        id="m-code"
                        placeholder="MRI-001"
                        value={formData.machineCode}
                        onChange={(e) => setFormData({ ...formData, machineCode: e.target.value })}
                        required
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="m-name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Machine Name <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        id="m-name"
                        placeholder="MRI Machine"
                        value={formData.machineName}
                        onChange={(e) => setFormData({ ...formData, machineName: e.target.value })}
                        required
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="m-type" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Machine Type <span className="text-rose-500">*</span>
                      </Label>
                      <Select
                        value={formData.machineType}
                        onValueChange={(val) => setFormData({ ...formData, machineType: val })}
                      >
                        <SelectTrigger id="m-type" className="h-9 text-xs">
                          <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {STANDARD_MACHINE_TYPES.map((t) => (
                            <SelectItem key={t} value={t} className="text-xs">
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Row 2: Manufacturer, Model, Serial Number, Asset Number */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="m-mfg" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Manufacturer</Label>
                      <Input
                        id="m-mfg"
                        placeholder="Siemens"
                        value={formData.manufacturer}
                        onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="m-model" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Model</Label>
                      <Input
                        id="m-model"
                        placeholder="Magnetom Sola"
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="m-serial" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Serial Number</Label>
                      <Input
                        id="m-serial"
                        placeholder="SN-MRI-123456"
                        value={formData.serialNumber}
                        onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="m-asset" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Asset Number</Label>
                      <Input
                        id="m-asset"
                        placeholder="AST-HOS-001"
                        value={formData.assetNumber}
                        onChange={(e) => setFormData({ ...formData, assetNumber: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. ORGANIZATION & PLACEMENT */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>2. Organization & Placement</span>
                  </h3>

                  {/* Row 1: Company, Branch / Hospital, Department, Operational Unit */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="m-comp" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Company <span className="text-rose-500">*</span>
                      </Label>
                      <Select
                        value={formData.companyId}
                        onValueChange={(val) => {
                          setFormData({ ...formData, companyId: val });
                          loadShiftsForCompany(val);
                        }}
                      >
                        <SelectTrigger id="m-comp" className="h-9 text-xs">
                          <SelectValue placeholder="Select Company" />
                        </SelectTrigger>
                        <SelectContent>
                          {companies.map((c) => (
                            <SelectItem key={c.id} value={c.id} className="text-xs">
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="m-branch" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Branch / Hospital <span className="text-rose-500">*</span>
                      </Label>
                      <Select
                        value={formData.branchId}
                        onValueChange={(val) => setFormData({ ...formData, branchId: val })}
                      >
                        <SelectTrigger id="m-branch" className="h-9 text-xs">
                          <SelectValue placeholder="Main Hospital" />
                        </SelectTrigger>
                        <SelectContent>
                          {branches.map((b) => (
                            <SelectItem key={b.id} value={b.id} className="text-xs">
                              {b.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="m-dept" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Department</Label>
                      <Select
                        value={formData.departmentId}
                        onValueChange={(val) => setFormData({ ...formData, departmentId: val })}
                      >
                        <SelectTrigger id="m-dept" className="h-9 text-xs">
                          <SelectValue placeholder="Radiology" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((d) => (
                            <SelectItem key={d.id} value={d.id} className="text-xs">
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="m-unit" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Operational Unit</Label>
                      <Select
                        value={formData.productionLineId}
                        onValueChange={(val) => setFormData({ ...formData, productionLineId: val })}
                      >
                        <SelectTrigger id="m-unit" className="h-9 text-xs">
                          <SelectValue placeholder="Radiology & Imaging" />
                        </SelectTrigger>
                        <SelectContent>
                          {productionLines.map((l) => (
                            <SelectItem key={l.id} value={l.id} className="text-xs">
                              {l.lineName} {l.lineCode ? `(${l.lineCode})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Row 2: Room / Installation Area (spans 2), Workstation / Location, Responsible Employee / Operator */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="m-loc" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Room / Installation Area <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        id="m-loc"
                        placeholder="Radiology Block - 1st Floor - Room 102"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        required
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="m-ws" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Workstation / Location</Label>
                      <Input
                        id="m-ws"
                        placeholder="MRI Room"
                        value={formData.workstation}
                        onChange={(e) => setFormData({ ...formData, workstation: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="m-emp" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Responsible Employee / Operator</Label>
                      <Select
                        value={formData.responsibleEmployeeId}
                        onValueChange={(val) => setFormData({ ...formData, responsibleEmployeeId: val })}
                      >
                        <SelectTrigger id="m-emp" className="h-9 text-xs">
                          <SelectValue placeholder="Select Responsible Employee" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {employees.length > 0 ? (
                            employees.map((emp) => (
                              <SelectItem key={emp.id} value={emp.id} className="text-xs">
                                {emp.firstName} {emp.lastName} {emp.employeeCode ? `(${emp.employeeCode})` : ''}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="emp-default" className="text-xs">
                              Rohit Patil (EMP-021)
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* 3. CAPACITY & POWER RATING */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>3. Capacity & Power Rating</span>
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="m-cap" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Capacity</Label>
                      <Input
                        id="m-cap"
                        type="number"
                        placeholder="20"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="m-uom" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Capacity UOM <span className="text-rose-500">*</span>
                      </Label>
                      <Select
                        value={formData.capacityUom}
                        onValueChange={(val) => {
                          if (val === '__ADD_NEW__') {
                            setOpenUomMaster(true);
                          } else {
                            setFormData({ ...formData, capacityUom: val });
                          }
                        }}
                      >
                        <SelectTrigger id="m-uom" className="h-9 text-xs">
                          <SelectValue placeholder="Patients / Day" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {(uomItems.length > 0 ? uomItems.map((u) => u.name) : UNIVERSAL_FALLBACK_UOMS).map((uomName) => (
                            <SelectItem key={uomName} value={uomName} className="text-xs">
                              {uomName}
                            </SelectItem>
                          ))}
                          <SelectItem value="__ADD_NEW__" className="text-xs font-semibold text-indigo-600 border-t mt-1">
                            + Manage UOM Master...
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="m-hrs" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Operating Hours / Day</Label>
                      <Input
                        id="m-hrs"
                        type="number"
                        placeholder="16"
                        value={formData.operatingHours}
                        onChange={(e) => setFormData({ ...formData, operatingHours: Number(e.target.value) })}
                        className="h-9 text-xs"
                      />
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                        Auto-calculated from assigned shifts
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="m-pwr" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Power Rating</Label>
                      <Input
                        id="m-pwr"
                        type="number"
                        placeholder="75"
                        value={formData.powerRating}
                        onChange={(e) => setFormData({ ...formData, powerRating: Number(e.target.value) })}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="m-pwr-uom" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Power UOM</Label>
                      <Select
                        value={formData.powerUom}
                        onValueChange={(val) => setFormData({ ...formData, powerUom: val })}
                      >
                        <SelectTrigger id="m-pwr-uom" className="h-9 text-xs">
                          <SelectValue placeholder="kW (Kilowatts)" />
                        </SelectTrigger>
                        <SelectContent>
                          {POWER_UOM_OPTIONS.map((p) => (
                            <SelectItem key={p} value={p} className="text-xs">
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* 4. SHIFT & WORKING PERIOD */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>4. Shift & Working Period</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 -mt-1.5">
                    Assign Applicable Shifts (from Shift Master)
                  </p>

                  <div className="flex flex-col sm:flex-row items-stretch gap-3">
                    {/* Shift Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1">
                      {availableShifts.map((shift) => {
                        const checked = isShiftSelected(shift, selectedShifts);
                        return (
                          <div
                            key={shift.id}
                            onClick={() => toggleShift(shift)}
                            className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer select-none transition-all ${
                              checked
                                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-1 ring-indigo-500 shadow-2xs'
                                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            }`}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleShift(shift)}
                              className="h-4 w-4 rounded data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                            />
                            <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{shift.name}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                {formatTime12(shift.startTime)} – {formatTime12(shift.endTime)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Total Operating Hours Summary Pill */}
                    <div className="p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20 flex flex-col justify-center items-center text-center shrink-0 min-w-[140px]">
                      <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Total Operating Hours</p>
                      <p className="text-lg font-bold text-indigo-700 dark:text-indigo-400 tracking-tight my-0.5">
                        {computedTotalHours} hrs/day
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        ({activeShiftCount} Active Shift{activeShiftCount !== 1 ? 's' : ''})
                      </p>
                    </div>
                  </div>
                </div>

                {/* 5. MAINTENANCE PLANNING */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    <span>5. Maintenance Planning</span>
                  </h3>

                  {/* Row 1: Maintenance Frequency, Reminder Lead, Last Maintenance, Next Due */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="m-freq" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Maintenance Frequency (Days)
                      </Label>
                      <Input
                        id="m-freq"
                        type="number"
                        placeholder="180"
                        value={formData.maintenanceFrequencyDays}
                        onChange={(e) => setFormData({ ...formData, maintenanceFrequencyDays: Number(e.target.value) })}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="m-lead" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Reminder Lead (Days)
                      </Label>
                      <Input
                        id="m-lead"
                        type="number"
                        placeholder="15"
                        value={formData.maintenanceReminderDays}
                        onChange={(e) => setFormData({ ...formData, maintenanceReminderDays: Number(e.target.value) })}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="m-last-maint" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Last Maintenance Date
                      </Label>
                      <Input
                        id="m-last-maint"
                        type="date"
                        value={formData.lastMaintenanceDate}
                        onChange={(e) => handleLastMaintenanceChange(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="m-next-maint" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Next Due Date
                      </Label>
                      <Input
                        id="m-next-maint"
                        type="date"
                        value={formData.nextMaintenanceDate}
                        onChange={(e) => setFormData({ ...formData, nextMaintenanceDate: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  {/* Row 2: Calibration Frequency, Last Calibration, Next Due */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="m-cal-freq" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Calibration Frequency (Days)
                      </Label>
                      <Input
                        id="m-cal-freq"
                        type="number"
                        placeholder="365"
                        value={formData.calibrationFrequencyDays}
                        onChange={(e) => setFormData({ ...formData, calibrationFrequencyDays: Number(e.target.value) })}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="m-last-cal" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Last Calibration Date
                      </Label>
                      <Input
                        id="m-last-cal"
                        type="date"
                        value={formData.lastCalibrationDate}
                        onChange={(e) => handleLastCalibrationChange(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="m-next-cal" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Next Calibration Due
                      </Label>
                      <Input
                        id="m-next-cal"
                        type="date"
                        value={formData.nextCalibrationDate}
                        onChange={(e) => setFormData({ ...formData, nextCalibrationDate: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* 6. MACHINE STATUS */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                    <Power className="h-4 w-4" />
                    <span>6. Machine Status</span>
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { val: 'ACTIVE', label: 'Active', desc: 'Ready for operation', dot: 'bg-emerald-500' },
                      { val: 'INACTIVE', label: 'Inactive', desc: 'Temporarily unavailable', dot: 'bg-slate-400' },
                      { val: 'UNDER_MAINTENANCE', label: 'Under Maintenance', desc: 'Currently being serviced', dot: 'bg-amber-500' },
                      { val: 'RETIRED', label: 'Retired', desc: 'Decommissioned', dot: 'bg-rose-500' },
                    ].map((s) => {
                      const isSelected = formData.status === s.val;
                      return (
                        <div
                          key={s.val}
                          onClick={() => setFormData({ ...formData, status: s.val as any })}
                          className={`p-3 rounded-xl border cursor-pointer select-none transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 ring-1 ring-indigo-500'
                              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{s.label}</span>
                            </div>
                            {isSelected && <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />}
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">{s.desc}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Sections 7 (360° Images) & 8 (Documentation) */}
              <div className="lg:col-span-5 space-y-6">
                {/* 7. MACHINE IMAGES (360° VIEW) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="h-4 w-4" />
                      <span>7. Machine Images (360° View)</span>
                      <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                    </h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-slate-500 hover:text-indigo-600 gap-1"
                      onClick={handleLoadSampleMedicalPhotos}
                    >
                      <Sparkles className="h-3 w-3 text-amber-500" />
                      Sample Photos
                    </Button>
                  </div>

                  {/* Main Large 360° Viewer Container */}
                  <div
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    className="relative h-64 sm:h-72 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 overflow-hidden flex items-center justify-center select-none group shadow-inner"
                  >
                    {/* Top Right Fullscreen Button */}
                    <button
                      type="button"
                      onClick={() => setOpen360Modal(true)}
                      className="absolute top-3 right-3 z-10 h-7 w-7 rounded-lg bg-black/40 hover:bg-black/70 backdrop-blur-xs text-white flex items-center justify-center transition-all"
                      title="Open full interactive 360 viewer"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                    </button>

                    {/* Navigation Arrow Left */}
                    <button
                      type="button"
                      onClick={() => stepAngle(-1)}
                      className="absolute left-3 z-10 h-9 w-9 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center transition-all shadow-md"
                      title="Previous angle"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    {/* Navigation Arrow Right */}
                    <button
                      type="button"
                      onClick={() => stepAngle(1)}
                      className="absolute right-3 z-10 h-9 w-9 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center transition-all shadow-md"
                      title="Next angle"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>

                    {/* Image or Upload Placeholder */}
                    {currentDisplayedPhoto ? (
                      <div className="relative h-full w-full flex items-center justify-center p-3">
                        <img
                          src={currentDisplayedPhoto}
                          alt={`${activeAngleTab} view`}
                          className="max-h-full max-w-full object-contain pointer-events-none drop-shadow-md"
                        />
                        {/* 360 Indicator Badge in Center */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none bg-slate-950/70 backdrop-blur-xs border border-white/20 text-white rounded-full px-3 py-1 flex items-center gap-1.5 shadow-xl">
                          <RotateCcw className="h-3.5 w-3.5 animate-spin-slow" />
                          <span className="text-xs font-bold tracking-wider">360°</span>
                        </div>

                        {/* Hover Overlay with Replace / Upload action */}
                        <div
                          onClick={() => triggerImageUpload(activeAngleTab)}
                          className="absolute inset-0 bg-black/40 backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white"
                        >
                          <Camera className="h-7 w-7 mb-1.5" />
                          <span className="text-xs font-semibold">Click to Replace {activeAngleTab} Image</span>
                          <span className="text-[10px] text-white/80 mt-0.5">Drag left or right to rotate angles</span>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => triggerImageUpload(activeAngleTab)}
                        className="cursor-pointer flex flex-col items-center justify-center text-center p-6 h-full w-full hover:bg-indigo-50/20 transition-all"
                      >
                        <div className="h-12 w-12 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2 shadow-2xs">
                          <Camera className="h-6 w-6" />
                        </div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Upload {activeAngleTab} Angle Photo
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-[200px]">
                          Click anywhere in this box to browse and attach photo
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-3 h-7 text-xs gap-1 border-indigo-200 text-indigo-600"
                        >
                          <UploadCloud className="h-3.5 w-3.5" />
                          Select File
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Horizontal Angle Thumbnails Row */}
                  <div className="grid grid-cols-6 gap-2">
                    {allAngleTabs.map((angle) => {
                      const angleKey = angle.toLowerCase();
                      const photo = angleImages[angleKey] || (angleKey === 'front' ? mainPhoto : '');
                      const isSelected = activeAngleTab.toLowerCase() === angleKey;

                      return (
                        <div
                          key={angle}
                          onClick={() => {
                            if (isSelected && !photo) {
                              triggerImageUpload(angle);
                            } else {
                              setActiveAngleTab(angle);
                            }
                          }}
                          className="flex flex-col items-center cursor-pointer group/thumb"
                        >
                          <div
                            className={`h-14 w-full rounded-xl border flex items-center justify-center overflow-hidden transition-all bg-white dark:bg-slate-900 ${
                              isSelected
                                ? 'border-indigo-600 ring-2 ring-indigo-500 shadow-sm'
                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                            }`}
                          >
                            {photo ? (
                              <img
                                src={photo}
                                alt={angle}
                                className="h-full w-full object-contain p-0.5"
                              />
                            ) : (
                              <Camera className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                            )}
                          </div>
                          <span
                            className={`text-[11px] mt-1 text-center font-medium truncate max-w-full ${
                              isSelected
                                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                                : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {angle}
                          </span>
                        </div>
                      );
                    })}

                    {/* Add Angle Button */}
                    <div
                      onClick={handleAddCustomAngle}
                      className="flex flex-col items-center cursor-pointer"
                    >
                      <div className="h-14 w-full rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-600 transition-all bg-slate-50/50 dark:bg-slate-900/50">
                        <Plus className="h-4 w-4" />
                      </div>
                      <span className="text-[11px] mt-1 text-center text-slate-500 font-medium">
                        + Add Angle
                      </span>
                    </div>
                  </div>

                  {/* Information Banner */}
                  <div className="p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/30 dark:bg-indigo-950/20 flex items-center gap-2">
                    <Info className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Upload multiple angle images to enable 360° view. Drag to rotate.
                    </p>
                  </div>
                </div>

                {/* 8. MACHINE DOCUMENTATION */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4" />
                    <span>8. Machine Documentation</span>
                  </h3>

                  <div className="space-y-2">
                    {[
                      {
                        key: 'manual',
                        label: 'Machine Manual',
                        sub: 'PDF, DOC, DOCX (Max 10 MB)',
                        icon: BookOpen,
                        color: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900/50',
                      },
                      {
                        key: 'warranty',
                        label: 'Warranty Document',
                        sub: 'PDF, DOC, DOCX (Max 10 MB)',
                        icon: ShieldCheck,
                        color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-900/50',
                      },
                      {
                        key: 'certificate',
                        label: 'Calibration Certificate',
                        sub: 'PDF, DOC, DOCX (Max 10 MB)',
                        icon: Award,
                        color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50',
                      },
                      {
                        key: 'other',
                        label: 'Safety Guidelines / Other',
                        sub: 'PDF, DOC, DOCX (Max 10 MB)',
                        icon: FileText,
                        color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/50',
                      },
                    ].map((doc) => {
                      const IconComponent = doc.icon;
                      const attachedFile = uploadedDocs[doc.key];

                      return (
                        <div
                          key={doc.key}
                          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex items-center justify-between gap-3 shadow-2xs hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`h-8 w-8 rounded-lg border flex items-center justify-center shrink-0 ${doc.color}`}>
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{doc.label}</p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {attachedFile || doc.sub}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {attachedFile && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                onClick={() => setUploadedDocs((prev) => ({ ...prev, [doc.key]: '' }))}
                                title="Remove document"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                              onClick={() => triggerDocUpload(doc.key)}
                            >
                              <UploadCloud className="h-3 w-3" />
                              {attachedFile ? 'Replace' : 'Upload'}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                className="h-9 px-5 text-xs font-semibold rounded-xl"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9 px-6 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
                disabled={submitting}
              >
                {submitting ? 'Saving Machine...' : 'Save Machine'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Standalone Fullscreen 360 Viewer Modal */}
      <Machine360ViewerModal
        open={open360Modal}
        onOpenChange={setOpen360Modal}
        machineName={formData.machineName || 'Medical Equipment'}
        machineCode={formData.machineCode || 'MCH-001'}
        mainPhoto={mainPhoto}
        angleImages={angleImages}
      />

      {/* Capacity UOM Master Management Modal */}
      <CapacityUomMasterModal
        open={openUomMaster}
        onOpenChange={setOpenUomMaster}
        onUomsUpdated={loadUoms}
      />
    </>
  );
}
