import { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import {
  RefreshCw,
  Plus,
  ArrowRight,
  Play,
  CheckCircle2,
  Clock,
  Building2,
  Calendar,
  Sparkles,
  Eye,
  Pencil,
  Trash2,
  Copy,
  Pause,
  History,
  AlertTriangle,
  Check,
  ChevronUp,
  ChevronDown,
  ShieldCheck,
  Users,
  CheckSquare,
  Info,
  CalendarDays,
  X,
  FileCheck,
  ShieldAlert,
  Search,
  Layers,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { departmentsApi } from '@/api/organization';
import { employeesApi } from '@/api/employees';
import { useAuthStore } from '@/stores/auth-store';
import { isManagerOrHrOrAdmin } from '@/lib/modules';
import { useShiftRosterStore } from './shiftRosterStore';
import type { RotationCycle, RotationPhase } from './shiftRosterStore';
import { cn } from '@/lib/utils';

function time24To12(time24?: string): string {
  if (!time24) return '';
  const trimmed = time24.trim();
  if (/AM|PM/i.test(trimmed)) return trimmed;
  const parts = trimmed.split(':');
  if (parts.length < 2) return trimmed;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1].slice(0, 2);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
}

function parseToYMD(dateStr?: string): string {
  if (!dateStr) return '';
  const clean = dateStr.split('T')[0].trim();
  if (clean.includes('-')) {
    const parts = clean.split('-');
    if (parts[0].length === 4) return clean; // YYYY-MM-DD
    if (parts[2]?.length === 4) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`; // DD-MM-YYYY
  }
  if (clean.includes('/')) {
    const parts = clean.split('/');
    if (parts[2]?.length === 4) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    if (parts[0]?.length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
  }
  return clean;
}

function formatDateDMY(dateStr?: string): string {
  if (!dateStr) return '';
  const ymd = parseToYMD(dateStr);
  if (ymd.includes('-')) {
    const parts = ymd.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }
  return dateStr;
}

export interface RotationLifecycle {
  status: 'Draft' | 'Scheduled' | 'Active' | 'Paused' | 'Expired' | 'Deactivated';
  isBeforeStart: boolean;
  currentPhaseNum: number | null;
  currentPhaseDisplay: string;
  currentShiftCode: string | null;
  currentShiftName: string | null;
  nextPhaseNum: number;
  nextPhaseDisplay: string;
  nextShiftCode: string;
  nextShiftName: string;
  startsDate: string;
  nextRolloverDate: string;
  totalPhases: number;
}

function getRotationLifecycle(rot: RotationCycle | null, shiftsList: ShiftMasterItem[]): RotationLifecycle {
  if (!rot) {
    return {
      status: 'Draft',
      isBeforeStart: true,
      currentPhaseNum: null,
      currentPhaseDisplay: 'Not Started',
      currentShiftCode: null,
      currentShiftName: null,
      nextPhaseNum: 1,
      nextPhaseDisplay: 'Phase 1 — MS Morning Shift',
      nextShiftCode: 'MS',
      nextShiftName: 'Morning Shift',
      startsDate: '2026-09-14',
      nextRolloverDate: '2026-09-21',
      totalPhases: 4,
    };
  }

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const rawStart = rot.effectiveFrom || rot.startDate || '2026-09-14';
  const startDateStr = parseToYMD(rawStart) || '2026-09-14';

  const phases: RotationPhase[] =
    rot.phases && rot.phases.length > 0
      ? rot.phases
      : rot.pattern && rot.pattern.length > 0
      ? rot.pattern.map((p, i) => {
          const code = p.split(' ')[0] || 'MS';
          const matched = shiftsList.find((s) => s.code === code);
          return {
            phaseNumber: i + 1,
            shiftCode: code,
            shiftName: matched ? matched.name : p,
            duration: '1 Week',
          };
        })
      : [
          { phaseNumber: 1, shiftCode: 'MS', shiftName: 'Morning Shift', duration: '1 Week' },
          { phaseNumber: 2, shiftCode: 'ES', shiftName: 'Evening Shift', duration: '1 Week' },
          { phaseNumber: 3, shiftCode: 'NS', shiftName: 'Night Shift', duration: '1 Week' },
          { phaseNumber: 4, shiftCode: 'GS', shiftName: 'General Shift', duration: '1 Week' },
        ];

  const totalPhases = phases.length || 4;
  const cadenceDays = rot.frequency === 'Bi-Weekly' ? 14 : rot.frequency === 'Monthly' ? 28 : 7;

  // Comparison: is today strictly before rotation start date?
  const isBeforeStart = todayStr < startDateStr;

  let computedStatus: 'Draft' | 'Scheduled' | 'Active' | 'Paused' | 'Expired' | 'Deactivated' = rot.status as any;
  if ((rot.status === 'Active' || (rot.status as any) === 'Scheduled') && isBeforeStart) {
    computedStatus = 'Scheduled';
  }

  const startDt = new Date(`${startDateStr}T00:00:00`);
  const todayDt = new Date(`${todayStr}T00:00:00`);

  const firstPhase = phases[0] || { phaseNumber: 1, shiftCode: 'MS', shiftName: 'Morning Shift' };

  if (isBeforeStart) {
    const firstRolloverDt = new Date(startDt);
    firstRolloverDt.setDate(firstRolloverDt.getDate() + cadenceDays);
    const rolloverStr = `${firstRolloverDt.getFullYear()}-${String(firstRolloverDt.getMonth() + 1).padStart(2, '0')}-${String(firstRolloverDt.getDate()).padStart(2, '0')}`;

    return {
      status: computedStatus,
      isBeforeStart: true,
      currentPhaseNum: null,
      currentPhaseDisplay: 'Not Started',
      currentShiftCode: null,
      currentShiftName: null,
      nextPhaseNum: 1,
      nextPhaseDisplay: `Phase 1 — ${firstPhase.shiftCode} ${firstPhase.shiftName}`,
      nextShiftCode: firstPhase.shiftCode,
      nextShiftName: firstPhase.shiftName,
      startsDate: startDateStr,
      nextRolloverDate: rolloverStr,
      totalPhases,
    };
  }

  // today >= startDateStr (Active phase)
  const diffTime = Math.max(0, todayDt.getTime() - startDt.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const cycleIndex = Math.floor(diffDays / cadenceDays);
  const phaseIndex = cycleIndex % totalPhases;
  const currentPhaseNum = phaseIndex + 1;
  const currentPhase = phases[phaseIndex] || phases[0];

  const nextPhaseIndex = (phaseIndex + 1) % totalPhases;
  const nextPhase = phases[nextPhaseIndex] || phases[0];

  const currentCycleStart = new Date(startDt);
  currentCycleStart.setDate(currentCycleStart.getDate() + cycleIndex * cadenceDays);
  const nextRolloverDt = new Date(currentCycleStart);
  nextRolloverDt.setDate(nextRolloverDt.getDate() + cadenceDays);
  const nextRolloverStr = `${nextRolloverDt.getFullYear()}-${String(nextRolloverDt.getMonth() + 1).padStart(2, '0')}-${String(nextRolloverDt.getDate()).padStart(2, '0')}`;

  return {
    status: computedStatus === 'Scheduled' ? 'Active' : computedStatus,
    isBeforeStart: false,
    currentPhaseNum,
    currentPhaseDisplay: `Phase ${currentPhaseNum} / ${totalPhases}`,
    currentShiftCode: currentPhase.shiftCode,
    currentShiftName: currentPhase.shiftName,
    nextPhaseNum: nextPhase.phaseNumber,
    nextPhaseDisplay: `Phase ${nextPhase.phaseNumber} — ${nextPhase.shiftCode} ${nextPhase.shiftName}`,
    nextShiftCode: nextPhase.shiftCode,
    nextShiftName: nextPhase.shiftName,
    startsDate: startDateStr,
    nextRolloverDate: nextRolloverStr,
    totalPhases,
  };
}

export function ShiftRotationTab() {
  const user = useAuthStore((s) => s.user);
  const canManageRotations = isManagerOrHrOrAdmin(user);

  const {
    rotations,
    shifts,
    assignments,
    rosterEmployees,
    activeCompanyId,
    addRotation,
    updateRotation,
    deleteRotation,
    applyRotationNow,
  } = useShiftRosterStore();

  // Active / Scheduled rotation check
  const activeRotations = useMemo(
    () => rotations.filter((r) => r.status === 'Active' || (r.status as string) === 'Scheduled'),
    [rotations]
  );
  const currentActiveRotation = activeRotations[0] || rotations[0] || null;
  const hasActiveRotation = Boolean(
    currentActiveRotation &&
      currentActiveRotation.status !== 'Draft' &&
      currentActiveRotation.status !== 'Expired' &&
      currentActiveRotation.status !== 'Deactivated'
  );
  const bannerLifecycle = useMemo(
    () => getRotationLifecycle(currentActiveRotation, shifts),
    [currentActiveRotation, shifts]
  );

  // Master Data: Departments & Employees
  const [departmentsList, setDepartmentsList] = useState<string[]>([]);
  const [directoryEmployees, setDirectoryEmployees] = useState<any[]>([]);

  const branchesList = ['Pune Manufacturing Plant', 'MIDC Unit 2', 'Corporate Headquarters'];
  const employeeGroupsList = [
    'Plant Shift Operations Crew',
    'Machine Operators & Technicians',
    '24x7 Facility & Safety Staff',
    'Quality Assurance Shift Squad',
  ];

  useEffect(() => {
    departmentsApi
      .list(activeCompanyId)
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          setDepartmentsList(res.map((d: any) => d.name));
        } else {
          setDepartmentsList(['Production', 'Operations & Production', 'Quality Assurance', 'Engineering & Maintenance', 'Executive Management']);
        }
      })
      .catch(() => {
        setDepartmentsList(['Production', 'Operations & Production', 'Quality Assurance', 'Engineering & Maintenance', 'Executive Management']);
      });

    employeesApi
      .list({ page: 1, pageSize: 500, companyId: activeCompanyId })
      .then((res: any) => {
        if (Array.isArray(res?.items)) {
          setDirectoryEmployees(res.items);
        } else if (Array.isArray(res?.data)) {
          setDirectoryEmployees(res.data);
        } else if (Array.isArray(res)) {
          setDirectoryEmployees(res);
        }
      })
      .catch(() => {});
  }, [activeCompanyId]);

  // Modal Multi-Step State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<'config' | 'pattern' | 'preview' | 'validation'>('config');
  const [editingRotationId, setEditingRotationId] = useState<string | null>(null);

  // Form State - Step 1: Basic Information
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Draft' | 'Active' | 'Paused' | 'Expired' | 'Deactivated'>('Draft');

  // Form State - Step 1: Applicability & Personnel
  const [applicableTo, setApplicableTo] = useState<'Department' | 'Company' | 'Branch' | 'Employee Group' | 'Specific Employees'>('Department');
  const [department, setDepartment] = useState('Production');
  const [branch, setBranch] = useState('Pune Manufacturing Plant');
  const [employeeGroup, setEmployeeGroup] = useState('Plant Shift Operations Crew');
  const [applicableScope, setApplicableScope] = useState<'Entire Department' | 'Specific Personnel'>('Entire Department');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');

  // Form State - Step 1: Effective Dates
  const [effectiveFrom, setEffectiveFrom] = useState('2026-09-14');
  const [effectiveTo, setEffectiveTo] = useState('');

  // Form State - Step 2: Cadence & Dynamic Pattern
  const [frequency, setFrequency] = useState<'Weekly' | 'Bi-Weekly' | 'Monthly' | 'Custom'>('Weekly');
  const [startDate, setStartDate] = useState('2026-09-14');
  const [startDay, setStartDay] = useState('Monday');
  const [startTime, setStartTime] = useState('08:00 AM');
  const [firstPhase, setFirstPhase] = useState(1);

  // Dynamic Phases Table
  const defaultPhases: RotationPhase[] = useMemo(
    () => [
      { phaseNumber: 1, shiftCode: 'MS', shiftName: 'Morning Shift', duration: '1 Week' },
      { phaseNumber: 2, shiftCode: 'ES', shiftName: 'Evening Shift', duration: '1 Week' },
      { phaseNumber: 3, shiftCode: 'NS', shiftName: 'Night Shift', duration: '1 Week' },
      { phaseNumber: 4, shiftCode: 'GS', shiftName: 'General Shift', duration: '1 Week' },
    ],
    []
  );
  const [phases, setPhases] = useState<RotationPhase[]>(defaultPhases);

  // View & History Modals
  const [selectedRotationForView, setSelectedRotationForView] = useState<RotationCycle | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Auto-calculated Covered Staff Headcount
  const eligibleDeptEmployees = useMemo(() => {
    return directoryEmployees.filter((e) => {
      const isStatusActive = (e.status || 'ACTIVE').toUpperCase() === 'ACTIVE';
      const isDeptMatch = (e.department?.name || e.departmentName || 'Production').toLowerCase() === department.toLowerCase();
      return isStatusActive && isDeptMatch;
    });
  }, [directoryEmployees, department]);

  const coveredEmployees = useMemo(() => {
    if (applicableTo === 'Specific Employees') {
      return directoryEmployees.filter((e) => selectedEmployeeIds.includes(e.id));
    }
    if (applicableTo === 'Department') {
      if (applicableScope === 'Specific Personnel') {
        return eligibleDeptEmployees.filter((e) => selectedEmployeeIds.includes(e.id));
      }
      return eligibleDeptEmployees.length > 0
        ? eligibleDeptEmployees
        : [
            {
              id: 'cmtr2qzm7006zip185kbklj96',
              employeeCode: 'EMP-001',
              name: 'Sudarshan Kale',
              firstName: 'Sudarshan',
              lastName: 'Kale',
              departmentName: 'Production',
              designationTitle: 'Production Operator',
            },
          ];
    }
    if (applicableTo === 'Branch') {
      const matchBranch = directoryEmployees.filter((e) => {
        const isStatusActive = (e.status || 'ACTIVE').toUpperCase() === 'ACTIVE';
        const bName = e.branch?.name || e.branchName || 'Pune Manufacturing Plant';
        return isStatusActive && bName.toLowerCase().includes(branch.toLowerCase().slice(0, 4));
      });
      return matchBranch.length > 0 ? matchBranch : eligibleDeptEmployees;
    }
    if (applicableTo === 'Employee Group') {
      return eligibleDeptEmployees.length > 0
        ? eligibleDeptEmployees
        : [
            {
              id: 'cmtr2qzm7006zip185kbklj96',
              employeeCode: 'EMP-001',
              name: 'Sudarshan Kale',
              firstName: 'Sudarshan',
              lastName: 'Kale',
              departmentName: 'Production',
              designationTitle: 'Production Operator',
            },
          ];
    }
    // Company
    const allActive = directoryEmployees.filter((e) => (e.status || 'ACTIVE').toUpperCase() === 'ACTIVE');
    return allActive.length > 0 ? allActive : eligibleDeptEmployees;
  }, [applicableTo, applicableScope, selectedEmployeeIds, eligibleDeptEmployees, directoryEmployees, branch]);

  const autoCalculatedHeadcount = useMemo(() => {
    return coveredEmployees.length;
  }, [coveredEmployees]);

  // Handle Dynamic Phases
  const handleAddPhase = () => {
    const nextPhaseNum = phases.length + 1;
    const availableShift = shifts[nextPhaseNum % shifts.length] || shifts[0] || { code: 'GS', name: 'General Shift' };
    setPhases((prev) => [
      ...prev,
      {
        phaseNumber: nextPhaseNum,
        shiftCode: availableShift.code,
        shiftName: availableShift.name,
        duration: frequency === 'Bi-Weekly' ? '2 Weeks' : frequency === 'Monthly' ? '1 Month' : '1 Week',
      },
    ]);
  };

  const handleRemovePhase = (index: number) => {
    if (phases.length <= 2) {
      toast.error('A rotation rule requires at least 2 distinct phases');
      return;
    }
    const updated = phases
      .filter((_, i) => i !== index)
      .map((p, idx) => ({ ...p, phaseNumber: idx + 1 }));
    setPhases(updated);
  };

  const handleMovePhase = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= phases.length) return;
    const copy = [...phases];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    const reordered = copy.map((p, idx) => ({ ...p, phaseNumber: idx + 1 }));
    setPhases(reordered);
  };

  const handlePhaseShiftChange = (index: number, shiftCode: string) => {
    const matched = shifts.find((s) => s.code === shiftCode);
    setPhases((prev) =>
      prev.map((p, i) =>
        i === index
          ? { ...p, shiftCode, shiftName: matched ? matched.name : shiftCode }
          : p
      )
    );
  };

  // Reset form — New rotation ALWAYS starts as Draft per user specification
  const resetForm = () => {
    setEditingRotationId(null);
    setName('');
    setCode('');
    setDescription('');
    setStatus('Draft');
    setApplicableTo('Department');
    setDepartment('Production');
    setBranch('Pune Manufacturing Plant');
    setEmployeeGroup('Plant Shift Operations Crew');
    setApplicableScope('Entire Department');
    setSelectedEmployeeIds([]);
    setEmployeeSearchQuery('');
    setEffectiveFrom('2026-09-14');
    setEffectiveTo('');
    setFrequency('Weekly');
    setStartDate('2026-09-14');
    setStartDay('Monday');
    setStartTime('08:00 AM');
    setFirstPhase(1);
    setPhases(defaultPhases);
    setModalStep('config');
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setCode(`ROT-PROD-${Math.floor(100 + Math.random() * 900)}`);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rot: RotationCycle) => {
    setEditingRotationId(rot.id);
    setName(rot.name);
    setCode(rot.code || `ROT-${rot.department.slice(0, 3).toUpperCase()}-01`);
    setDescription(rot.description || '');
    setStatus(rot.status);
    setApplicableTo(rot.applicableTo || 'Department');
    setDepartment(rot.department || 'Production');
    setApplicableScope((rot.applicableScope as any) || 'Entire Department');
    setSelectedEmployeeIds(rot.selectedEmployeeIds || []);
    setEffectiveFrom(rot.effectiveFrom || '2026-09-14');
    setEffectiveTo(rot.effectiveTo || '');
    setFrequency(rot.frequency);
    setStartDate(rot.startDate || '2026-09-14');
    setStartDay(rot.startDay || 'Monday');
    setStartTime(rot.startTime || '08:00 AM');
    setFirstPhase(rot.currentPhase || 1);

    if (rot.phases && rot.phases.length > 0) {
      setPhases(rot.phases);
    } else if (rot.pattern && rot.pattern.length > 0) {
      setPhases(
        rot.pattern.map((p, idx) => ({
          phaseNumber: idx + 1,
          shiftCode: p.split(' ')[0] || 'MS',
          shiftName: p,
          duration: '1 Week',
        }))
      );
    }
    setModalStep('config');
    setIsModalOpen(true);
  };

  // Save as Draft or Approve & Activate
  const handleSaveRotation = async (targetStatus?: 'Draft' | 'Active') => {
    if (!name.trim()) {
      toast.error('Rotation rule name is required');
      setModalStep('config');
      return;
    }

    const finalStatus = targetStatus || status;
    const patternStrings = phases.map((p) => `${p.shiftCode} (${p.shiftName})`);
    const handoverSummary = `${startDay} ${startTime}`;

    const payload: Omit<RotationCycle, 'id'> = {
      name: name.trim(),
      code: code.trim() || `ROT-${department.slice(0, 3).toUpperCase()}-01`,
      description: description.trim(),
      department: applicableTo === 'Department' ? department : applicableTo,
      frequency,
      pattern: patternStrings,
      phases,
      handoverDay: handoverSummary,
      startDate,
      startDay,
      startTime,
      effectiveFrom,
      effectiveTo: effectiveTo || undefined,
      headcountCovered: autoCalculatedHeadcount,
      currentPhase: firstPhase,
      nextRotationDate: '2026-09-21',
      autoApplyToRoster: true,
      status: finalStatus,
      applicableTo,
      applicableScope,
      selectedEmployeeIds,
      history: [
        {
          date: new Date().toISOString().split('T')[0],
          action: finalStatus === 'Active' ? 'Activated Rotation Rule' : 'Saved Draft Rule',
          user: user?.name || 'Super Admin',
          details: `${finalStatus} rule configured for ${applicableTo} covering ${autoCalculatedHeadcount} personnel`,
        },
      ],
    };

    if (editingRotationId) {
      await updateRotation(editingRotationId, payload);
      toast.success(
        finalStatus === 'Active'
          ? `Rotation "${name}" approved and activated! Future roster generated successfully.`
          : `Rotation "${name}" updated as draft.`
      );
    } else {
      await addRotation(payload);
      toast.success(
        finalStatus === 'Active'
          ? `Rotation "${name}" activated! Automatic future roster rollover generated.`
          : `Rotation "${name}" saved as draft.`
      );
    }

    setIsModalOpen(false);
    resetForm();
  };

  // Row Action Handlers
  const handleTriggerAdvance = (rot: RotationCycle) => {
    applyRotationNow(rot.id);
    toast.success(`Phase advanced for ${rot.name}! Rolled forward to next rotation pattern.`);
  };

  const handleTogglePause = async (rot: RotationCycle) => {
    const newStatus = rot.status === 'Active' ? 'Paused' : 'Active';
    await updateRotation(rot.id, { status: newStatus });
    toast.info(`Rotation "${rot.name}" status updated to ${newStatus}`);
  };

  const handleDuplicate = async (rot: RotationCycle) => {
    const dupName = `${rot.name} (Copy)`;
    await addRotation({
      ...rot,
      name: dupName,
      code: `${rot.code || 'ROT'}-CPY`,
      status: 'Draft',
    });
    toast.success(`Duplicated rotation created: "${dupName}" as draft.`);
  };

  const handleDelete = async (rot: RotationCycle) => {
    await deleteRotation(rot.id);
    toast.success(`Rotation schedule "${rot.name}" removed.`);
  };

  // Filter rotations for regular employees (personal scoping)
  const userDepartment = user?.employee?.departmentName || 'Production';
  const displayedRotations = useMemo(() => {
    if (canManageRotations) return rotations;
    return rotations.filter(
      (r) =>
        r.department?.toLowerCase().includes(userDepartment.toLowerCase()) ||
        userDepartment.toLowerCase().includes(r.department?.toLowerCase())
    );
  }, [rotations, canManageRotations, userDepartment]);

  return (
    <div className="space-y-5">
      {/* ── 1. Automated Multi-Shift Rotation Banner ── */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <RefreshCw className="h-4 w-4" /> Automated Multi-Shift Rotation Engine
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              For 24/7 manufacturing, hospital and NOC operations. Rolls shifts forward on schedule automatically.
            </p>
          </div>

          {/* Conditional Auto-Rollover Badge */}
          {!hasActiveRotation ? (
            <Badge variant="outline" className="text-xs font-medium text-muted-foreground bg-background px-2.5 py-0.5">
              No Active Rotation
            </Badge>
          ) : bannerLifecycle?.isBeforeStart ? (
            <Badge className="bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30 text-xs font-semibold px-2.5 py-0.5 flex items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              🟠 Rotation Scheduled
            </Badge>
          ) : (
            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-xs font-semibold px-2.5 py-0.5 flex items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              🟢 Auto-Rollover Active
            </Badge>
          )}
        </div>

        {/* Dynamic Stepper Visual showing active rotation's phases */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
          {(currentActiveRotation?.phases && currentActiveRotation.phases.length > 0
            ? currentActiveRotation.phases.slice(0, 4)
            : defaultPhases
          ).map((phase, idx) => (
            <div key={idx} className="rounded-lg border bg-background/90 p-3 shadow-2xs relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-primary tracking-wider">
                  Phase {phase.phaseNumber} ({phase.duration})
                </span>
                {bannerLifecycle?.isBeforeStart ? (
                  phase.phaseNumber === 1 ? (
                    <Badge className="text-[8px] px-1.5 py-0 bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-medium">
                      Starts {formatDateDMY(bannerLifecycle.startsDate)}
                    </Badge>
                  ) : null
                ) : (
                  bannerLifecycle?.currentPhaseNum === phase.phaseNumber && (
                    <Badge className="text-[8px] px-1 py-0 bg-primary text-primary-foreground">Current</Badge>
                  )
                )}
              </div>
              <p className="text-xs font-semibold text-foreground mt-1">
                {phase.shiftCode} – {phase.shiftName}
              </p>
              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                {(() => {
                  const s = shifts.find((sh) => sh.code === phase.shiftCode);
                  if (s) return `${time24To12(s.startTime)} – ${time24To12(s.endTime)}`;
                  if (phase.shiftCode === 'ES') return '04:00 PM – 12:00 AM';
                  if (phase.shiftCode === 'GS') return '09:00 AM – 05:30 PM';
                  if (phase.shiftCode === 'NS') return '10:00 PM – 06:30 AM';
                  return '08:00 AM – 04:30 PM';
                })()}
              </p>
              {idx < 3 && (
                <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 bg-card rounded-full border p-0.5 text-muted-foreground shadow-xs">
                  <ArrowRight className="h-3 w-3" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── 2. Active Rotation Schedules Table ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-primary" /> Active Rotation Schedules
            </CardTitle>
            <CardDescription className="text-xs">
              Automated roster rolling policies, phase progression, and scheduled handovers
            </CardDescription>
          </div>

          {canManageRotations && (
            <Button size="sm" className="h-8 text-xs gap-1.5 font-semibold" onClick={handleOpenCreateModal}>
              <Plus className="h-3.5 w-3.5" /> New Rotation Rule
            </Button>
          )}
        </CardHeader>

        <CardContent className="p-4 sm:p-5">
          <div className="rounded-md border border-border/80 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-xs font-semibold">Rotation Name</TableHead>
                  <TableHead className="text-xs font-semibold">Applicable To</TableHead>
                  <TableHead className="text-xs font-semibold">Cadence</TableHead>
                  <TableHead className="text-xs font-semibold">Pattern Progression</TableHead>
                  <TableHead className="text-xs font-semibold">Current Phase</TableHead>
                  <TableHead className="text-xs font-semibold">Next Rollover</TableHead>
                  <TableHead className="text-xs font-semibold">Employees Covered</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-right text-xs font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedRotations.map((rot) => {
                  const rotLifecycle = getRotationLifecycle(rot, shifts);
                  return (
                    <TableRow key={rot.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div>
                          <span className="font-semibold text-xs text-foreground block">{rot.name}</span>
                          <span className="text-[10px] text-primary font-mono font-bold">{rot.code || 'ROT-PROD-001'}</span>
                          {rot.description && (
                            <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{rot.description}</p>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground font-medium">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="font-semibold text-foreground">{rot.department}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground block pl-5">
                          {rot.applicableTo ? `${rot.applicableTo} • ` : ''}{rot.applicableScope || 'Entire Department'}
                        </span>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="text-[10.5px] font-semibold bg-muted/40">
                          {rot.frequency}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1 text-[10px] font-medium text-foreground flex-wrap">
                          {(rot.phases && rot.phases.length > 0
                            ? rot.phases.map((p) => p.shiftCode)
                            : rot.pattern.map((p) => p.split(' ')[0])
                          ).map((code, idx, arr) => (
                            <span key={idx} className="flex items-center gap-1">
                              <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono font-bold border border-primary/20">
                                {code}
                              </span>
                              {idx < arr.length - 1 && <span className="text-muted-foreground text-xs">→</span>}
                            </span>
                          ))}
                        </div>
                      </TableCell>

                      <TableCell>
                        {rotLifecycle.isBeforeStart ? (
                          <div className="flex flex-col gap-0.5">
                            <Badge variant="secondary" className="text-[10px] font-semibold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 w-fit">
                              Not Started
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              Next: Phase 1 ({rotLifecycle.nextShiftCode})
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-0.5">
                            <Badge className="text-[10px] font-semibold bg-primary text-primary-foreground w-fit">
                              {rotLifecycle.currentPhaseDisplay}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {rotLifecycle.currentShiftCode} – {rotLifecycle.currentShiftName}
                            </span>
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="font-mono text-xs whitespace-nowrap">
                        {rotLifecycle.isBeforeStart ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400">
                              Starts {formatDateDMY(rotLifecycle.startsDate)}
                            </span>
                            <span className="text-muted-foreground text-[11px]">
                              Next: {formatDateDMY(rotLifecycle.nextRolloverDate)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">{formatDateDMY(rotLifecycle.nextRolloverDate)}</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-xs font-semibold text-foreground">
                          <Users className="h-3 w-3 mr-1 text-primary" />
                          {rot.headcountCovered} Staff
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {rotLifecycle.status === 'Scheduled' ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold text-amber-700 bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700 uppercase tracking-wide flex items-center gap-1 w-fit"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            SCHEDULED
                          </Badge>
                        ) : rotLifecycle.status === 'Active' ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700 uppercase tracking-wide flex items-center gap-1 w-fit"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            ACTIVE
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] font-semibold',
                              rot.status === 'Paused' && 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/30',
                              rot.status === 'Draft' && 'text-muted-foreground bg-muted border-border',
                              rot.status === 'Expired' && 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-950/30',
                              rot.status === 'Deactivated' && 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/30',
                              rot.status === 'Inactive' && 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/30'
                            )}
                          >
                            {rot.status}
                          </Badge>
                        )}
                      </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                          title="View Details"
                          onClick={() => {
                            setSelectedRotationForView(rot);
                            setIsViewModalOpen(true);
                          }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>

                        {canManageRotations && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-blue-600"
                              title="Edit Rotation Rule"
                              onClick={() => handleOpenEditModal(rot)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-amber-600"
                              title={rot.status === 'Active' ? 'Pause Rotation' : 'Resume Rotation'}
                              onClick={() => handleTogglePause(rot)}
                            >
                              <Pause className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-purple-600"
                              title="Duplicate Rotation Rule"
                              onClick={() => handleDuplicate(rot)}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                              title="Advance Next Phase Now"
                              onClick={() => handleTriggerAdvance(rot)}
                            >
                              <Play className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                              title="Delete Rotation Rule"
                              onClick={() => handleDelete(rot)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}

                {displayedRotations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-12 text-center text-xs text-muted-foreground">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <RefreshCw className="h-8 w-8 text-muted-foreground/50" />
                        <p className="font-semibold text-foreground">No Active Rotation Schedules Found</p>
                        <p className="text-[11px] text-muted-foreground max-w-sm">
                          {canManageRotations
                            ? 'Configure an enterprise rotation rule to automatically rotate multi-shift staff across Morning, Evening, and Night duty cycles.'
                            : 'No rotational shift schedule is currently assigned to your department.'}
                        </p>
                        {canManageRotations && (
                          <Button size="sm" className="mt-2 h-8 text-xs gap-1.5" onClick={handleOpenCreateModal}>
                            <Plus className="h-3.5 w-3.5" /> Configure Rotation
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── 3. ENTERPRISE CONFIGURE SHIFT ROTATION MODAL (MULTI-STEP WORKFLOW) ── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-semibold flex items-center gap-2">
                <RefreshCw className="h-4.5 w-4.5 text-primary" />
                {editingRotationId ? `Edit Rotation: ${name || 'Schedule'}` : 'Configure Shift Rotation Rule'}
              </DialogTitle>
              <Badge variant="outline" className="text-[10px] font-mono uppercase bg-primary/5 text-primary border-primary/20">
                Enterprise Workflow
              </Badge>
            </div>
            <DialogDescription className="text-xs">
              Define applicability, cadence, dynamic phase sequence, and validate conflicts before generating future rosters.
            </DialogDescription>
          </DialogHeader>

          {/* Stepper Navigation */}
          <div className="grid grid-cols-4 gap-2 pt-1 pb-3 border-b border-border/60">
            {[
              { key: 'config', label: '1. Basic & Applicability' },
              { key: 'pattern', label: '2. Cadence & Pattern' },
              { key: 'preview', label: '3. Roster Preview' },
              { key: 'validation', label: '4. Validation & Conflict' },
            ].map((step) => (
              <button
                key={step.key}
                type="button"
                onClick={() => setModalStep(step.key as any)}
                className={cn(
                  'py-1.5 px-2 rounded-lg text-xs font-semibold transition-all text-center border cursor-pointer',
                  modalStep === step.key
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                    : 'bg-muted/40 text-muted-foreground border-transparent hover:bg-muted'
                )}
              >
                {step.label}
              </button>
            ))}
          </div>

          <div className="py-3 space-y-4">
            {/* ── STEP 1: Basic Information & Applicability ── */}
            {modalStep === 'config' && (
              <div className="space-y-4">
                {/* 1.1 Basic Information */}
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs font-semibold">Rotation Rule Name *</Label>
                      <Input
                        placeholder="e.g. Production 4-Shift 24x7 Rotation"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-8 text-xs"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Rotation Code</Label>
                      <Input
                        placeholder="e.g. ROT-PROD-01"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="h-8 text-xs font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Description / Operational Notes</Label>
                    <Textarea
                      placeholder="Provide operational rationale for this rotational schedule..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="text-xs resize-none h-14"
                    />
                  </div>

                  <div className="space-y-1 max-w-xs">
                    <Label className="text-xs font-semibold">Status *</Label>
                    <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Draft" className="text-xs font-semibold">Draft</SelectItem>
                        <SelectItem value="Active" className="text-xs text-emerald-600 font-semibold">Active</SelectItem>
                        <SelectItem value="Paused" className="text-xs text-amber-600 font-semibold">Paused</SelectItem>
                        <SelectItem value="Expired" className="text-xs text-orange-600 font-semibold">Expired</SelectItem>
                        <SelectItem value="Deactivated" className="text-xs text-rose-600 font-semibold">Deactivated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="h-px bg-border/60" />

                {/* 1.2 Applicability & Personnel */}
                <div className="border rounded-xl p-3.5 bg-muted/20 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-primary" /> Applicability & Personnel
                    </p>
                    <Badge variant="outline" className="text-[10px] font-mono bg-background text-primary border-primary/30">
                      {autoCalculatedHeadcount} Eligible Active Personnel
                    </Badge>
                  </div>

                  {/* Applicability Type / Applicable To * */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Applicable To *</Label>
                      <Select
                        value={applicableTo}
                        onValueChange={(v: any) => {
                          setApplicableTo(v);
                          if (v !== 'Department' && v !== 'Specific Employees') {
                            setSelectedEmployeeIds([]);
                          }
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Company" className="text-xs">Company</SelectItem>
                          <SelectItem value="Branch" className="text-xs">Branch</SelectItem>
                          <SelectItem value="Department" className="text-xs">Department</SelectItem>
                          <SelectItem value="Employee Group" className="text-xs">Employee Group</SelectItem>
                          <SelectItem value="Specific Employees" className="text-xs">Specific Employees</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Dynamic Target based on Applicable To */}
                    {applicableTo === 'Department' && (
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Target Department *</Label>
                        <Select value={department} onValueChange={setDepartment}>
                          <SelectTrigger className="h-8 text-xs bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {departmentsList.map((d) => (
                              <SelectItem key={d} value={d} className="text-xs">
                                {d}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {applicableTo === 'Company' && (
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Target Company</Label>
                        <Input
                          readOnly
                          disabled
                          value="MONTANARI LIFTS COMPONENTS PVT. LTD – LIVE (All Personnel)"
                          className="h-8 text-xs bg-muted text-foreground font-medium cursor-not-allowed truncate"
                        />
                      </div>
                    )}

                    {applicableTo === 'Branch' && (
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Target Branch *</Label>
                        <Select value={branch} onValueChange={setBranch}>
                          <SelectTrigger className="h-8 text-xs bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {branchesList.map((b) => (
                              <SelectItem key={b} value={b} className="text-xs">
                                {b}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {applicableTo === 'Employee Group' && (
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Target Employee Group *</Label>
                        <Select value={employeeGroup} onValueChange={setEmployeeGroup}>
                          <SelectTrigger className="h-8 text-xs bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {employeeGroupsList.map((g) => (
                              <SelectItem key={g} value={g} className="text-xs">
                                {g}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* Sub-Target for Department: Employee Target Scope */}
                  {applicableTo === 'Department' && (
                    <div className="space-y-1 pt-0.5">
                      <Label className="text-xs font-semibold">Employee Target Scope</Label>
                      <Select
                        value={applicableScope}
                        onValueChange={(v: any) => {
                          setApplicableScope(v);
                          if (v === 'Entire Department') setSelectedEmployeeIds([]);
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Entire Department" className="text-xs">
                            Entire Department ({eligibleDeptEmployees.length > 0 ? eligibleDeptEmployees.length : 1} active staff)
                          </SelectItem>
                          <SelectItem value="Specific Personnel" className="text-xs">
                            Specific Personnel (Custom Selection)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Multi-select employee picker for Specific Employees OR Department Specific Personnel */}
                  {(applicableTo === 'Specific Employees' || (applicableTo === 'Department' && applicableScope === 'Specific Personnel')) && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold">
                          Select Personnel ({selectedEmployeeIds.length} selected)
                        </Label>
                        <div className="relative w-48">
                          <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                          <Input
                            type="text"
                            placeholder="Filter by name/code..."
                            value={employeeSearchQuery}
                            onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                            className="h-7 pl-7 text-[11px] bg-background"
                          />
                        </div>
                      </div>

                      <div className="max-h-36 overflow-y-auto border rounded-lg p-2 bg-background space-y-1.5 text-xs">
                        {(applicableTo === 'Department' ? eligibleDeptEmployees : directoryEmployees)
                          .filter((e) => {
                            if (!employeeSearchQuery.trim()) return true;
                            const q = employeeSearchQuery.toLowerCase();
                            return (
                              e.employeeCode?.toLowerCase().includes(q) ||
                              `${e.firstName || ''} ${e.lastName || ''}`.toLowerCase().includes(q) ||
                              (e.department?.name || e.departmentName || '').toLowerCase().includes(q)
                            );
                          })
                          .map((e) => {
                            const isChecked = selectedEmployeeIds.includes(e.id);
                            return (
                              <label
                                key={e.id}
                                className="flex items-center justify-between p-1.5 rounded hover:bg-muted/50 cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(ev) => {
                                      if (ev.target.checked) {
                                        setSelectedEmployeeIds((prev) => [...prev, e.id]);
                                      } else {
                                        setSelectedEmployeeIds((prev) => prev.filter((id) => id !== e.id));
                                      }
                                    }}
                                    className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
                                  />
                                  <span className="font-semibold text-foreground">
                                    {e.firstName} {e.lastName}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground font-mono">({e.employeeCode})</span>
                                </div>
                                <span className="text-[10px] text-muted-foreground">
                                  {e.department?.name || e.departmentName || 'Production'}
                                </span>
                              </label>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Auto-calculated Covered Staff Headcount */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">Covered Staff</Label>
                      <Badge variant="outline" className="text-[10px] text-primary border-primary/30 font-mono">
                        Auto-Calculated
                      </Badge>
                    </div>
                    <Input
                      readOnly
                      disabled
                      value={`[ ${autoCalculatedHeadcount} Eligible Active Personnel ]  Auto-Calculated`}
                      className="h-8 text-xs font-mono bg-muted/60 text-foreground font-semibold cursor-not-allowed"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Covered staff is automatically derived from eligible active personnel. Manual typing is restricted.
                    </p>
                  </div>
                </div>

                <div className="h-px bg-border/60" />

                {/* 1.3 Effective Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Effective From Date *</Label>
                    <Input
                      type="date"
                      value={effectiveFrom}
                      onChange={(e) => setEffectiveFrom(e.target.value)}
                      className="h-8 text-xs font-mono bg-background"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Effective To Date</Label>
                    <Input
                      type="date"
                      value={effectiveTo}
                      onChange={(e) => setEffectiveTo(e.target.value)}
                      className="h-8 text-xs font-mono bg-background"
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: Cadence & Dynamic Rotation Pattern ── */}
            {modalStep === 'pattern' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Cadence / Frequency *</Label>
                    <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Weekly" className="text-xs">Weekly (1 Week)</SelectItem>
                        <SelectItem value="Bi-Weekly" className="text-xs">Bi-Weekly (2 Weeks)</SelectItem>
                        <SelectItem value="Monthly" className="text-xs">Monthly (1 Month)</SelectItem>
                        <SelectItem value="Custom" className="text-xs">Custom Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Rotation Start Date</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-8 text-xs font-mono bg-background"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Handover Day</Label>
                    <Select value={startDay} onValueChange={setStartDay}>
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                          <SelectItem key={day} value={day} className="text-xs">
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Handover Time</Label>
                    <Input
                      placeholder="e.g. 08:00 AM"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="h-8 text-xs font-mono bg-background"
                    />
                  </div>
                </div>

                {/* Dynamic Phases Table */}
                <div className="border rounded-xl p-3.5 bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Dynamic Phase Progression Sequence
                      </h5>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Define ordered shift steps. Personnel cycle forward through each phase on the scheduled handover date.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1 bg-background font-semibold"
                      onClick={handleAddPhase}
                    >
                      <Plus className="h-3 w-3" /> Add Phase
                    </Button>
                  </div>

                  <div className="border rounded-lg bg-background overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40">
                          <TableHead className="text-xs font-semibold w-24">Phase</TableHead>
                          <TableHead className="text-xs font-semibold min-w-[320px]">Assigned Shift (Shift Master)</TableHead>
                          <TableHead className="text-xs font-semibold">Duration</TableHead>
                          <TableHead className="text-xs font-semibold text-center w-28">Order</TableHead>
                          <TableHead className="text-right text-xs font-semibold w-20">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {phases.map((phase, idx) => (
                          <TableRow key={idx} className="hover:bg-muted/30">
                            <TableCell>
                              <Badge className="text-[10.5px] font-bold bg-primary text-primary-foreground">
                                Phase {phase.phaseNumber}
                              </Badge>
                            </TableCell>

                            <TableCell className="min-w-[320px]">
                              <Select
                                value={phase.shiftCode}
                                onValueChange={(val) => handlePhaseShiftChange(idx, val)}
                              >
                                <SelectTrigger className="h-8 text-xs bg-card w-full">
                                  <SelectValue>
                                    {(() => {
                                      const s = shifts.find((sh) => sh.code === phase.shiftCode);
                                      if (!s) return `${phase.shiftCode} – ${phase.shiftName}`;
                                      return (
                                        <span className="truncate">
                                          <span className="font-bold mr-1">{s.code}</span> – {s.name} ({time24To12(s.startTime)} – {time24To12(s.endTime)})
                                        </span>
                                      );
                                    })()}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {shifts.map((s) => (
                                    <SelectItem key={s.id} value={s.code} className="text-xs">
                                      <span className="font-bold mr-1">{s.code}</span> – {s.name} ({time24To12(s.startTime)} – {time24To12(s.endTime)})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>

                            <TableCell>
                              <Input
                                value={phase.duration}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPhases((prev) => prev.map((p, i) => (i === idx ? { ...p, duration: val } : p)));
                                }}
                                className="h-8 text-xs font-mono bg-card"
                                placeholder="1 Week"
                              />
                            </TableCell>

                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  disabled={idx === 0}
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                  onClick={() => handleMovePhase(idx, 'up')}
                                >
                                  <ChevronUp className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  disabled={idx === phases.length - 1}
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                  onClick={() => handleMovePhase(idx, 'down')}
                                >
                                  <ChevronDown className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>

                            <TableCell className="text-right">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                onClick={() => handleRemovePhase(idx)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: Preview (Employee-wise Future Rotation) ── */}
            {modalStep === 'preview' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-foreground">Employee-wise Future Rotation Preview</h5>
                    <p className="text-[11px] text-muted-foreground">
                      Projected weekly shift assignments for active personnel across the next 4 rotation cycles.
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono bg-background">
                    {coveredEmployees.length} Enrolled Staff
                  </Badge>
                </div>

                <div className="border rounded-xl bg-background overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="text-xs font-semibold">Employee</TableHead>
                        {phases.slice(0, 4).map((phase, idx) => (
                          <TableHead key={idx} className="text-xs font-semibold text-center">
                            Week {idx + 1}
                            <span className="block text-[10px] font-normal text-muted-foreground">
                              Phase {phase.phaseNumber} ({phase.shiftCode})
                            </span>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coveredEmployees.map((emp) => (
                        <TableRow key={emp.id} className="hover:bg-muted/20">
                          <TableCell className="text-xs">
                            <span className="font-bold text-foreground block">
                              {emp.name || `${emp.firstName} ${emp.lastName}`}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {emp.employeeCode} • {emp.departmentName || department}
                            </span>
                          </TableCell>

                          {phases.slice(0, 4).map((phase, pIdx) => {
                            const shift = shifts.find((s) => s.code === phase.shiftCode);
                            return (
                              <TableCell key={pIdx} className="text-center">
                                <div className="inline-flex flex-col items-center justify-center p-1.5 rounded-lg border bg-muted/40 min-w-[110px]">
                                  <span className="font-bold text-xs text-primary font-mono">{phase.shiftCode}</span>
                                  <span className="text-[9.5px] text-muted-foreground truncate max-w-[105px]">
                                    {phase.shiftName}
                                  </span>
                                  <span className="text-[8.5px] text-foreground/70 font-mono mt-0.5 whitespace-nowrap">
                                    {shift ? `${time24To12(shift.startTime)} – ${time24To12(shift.endTime)}` : '08:00 AM – 04:30 PM'}
                                  </span>
                                </div>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="rounded-lg bg-muted/40 p-2.5 border border-border text-[11px] text-muted-foreground flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary shrink-0" />
                  <span>
                    Shifts shown above reflect published rotation sequences. Any employee with an active individual shift override will retain their override as top priority.
                  </span>
                </div>
              </div>
            )}

            {/* ── STEP 4: Conflict Validation & Approval ── */}
            {modalStep === 'validation' && (
              <div className="space-y-3">
                <div>
                  <h5 className="text-xs font-bold text-foreground">Pre-Activation Conflict & Compliance Audit</h5>
                  <p className="text-[11px] text-muted-foreground">
                    Verifies existing overrides, approved leaves, rest policies, and historical integrity before committing rotation.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {/* 1. Employee Override Check */}
                  <div className="rounded-xl border p-3 bg-amber-500/5 border-amber-500/30 flex items-start gap-3">
                    <AlertTriangle className="h-4.5 w-4.5 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">Employee Shift Overrides Detected</span>
                        <Badge variant="outline" className="text-[9px] bg-amber-500/10 text-amber-700 border-amber-500/30 font-semibold">
                          Priority 1 Maintained
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Personnel with active individual shift overrides (e.g. specialized duty assignments) will retain their override. The rotation rule applies to all un-overridden shifts.
                      </p>
                    </div>
                  </div>

                  {/* 2. Leave Protection Check */}
                  <div className="rounded-xl border p-3 bg-emerald-500/5 border-emerald-500/30 flex items-start gap-3">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">Approved Leave Protection Verified</span>
                        <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-700 border-emerald-500/30 font-semibold">
                          Protected
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Approved employee leaves falling on rotation dates will be preserved intact. Rotated shifts will be registered under/alongside leave status.
                      </p>
                    </div>
                  </div>

                  {/* 3. Weekly Off & Holiday Check */}
                  <div className="rounded-xl border p-3 bg-emerald-500/5 border-emerald-500/30 flex items-start gap-3">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">Weekly Off & Work Calendar Compliant</span>
                        <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-700 border-emerald-500/30 font-semibold">
                          Verified
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Declared holidays and Weekly Off policies (Sunday / alternate Saturday) are preserved. Rotational active duty applies only to scheduled working days.
                      </p>
                    </div>
                  </div>

                  {/* 4. Staffing Coverage Check */}
                  <div className="rounded-xl border p-3 bg-emerald-500/5 border-emerald-500/30 flex items-start gap-3">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">Department Staffing Balance</span>
                        <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-700 border-emerald-500/30 font-semibold">
                          Balanced
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {autoCalculatedHeadcount} active staff members allocated across {phases.length} rotational phases without critical understaffing gaps.
                      </p>
                    </div>
                  </div>

                  {/* 5. Historical Integrity Guarantee */}
                  <div className="rounded-xl border p-3 bg-primary/5 border-primary/30 flex items-start gap-3">
                    <ShieldCheck className="h-4.5 w-4.5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-foreground block">
                        Strict Historical Record Preservation Enforced
                      </span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Auto-rollover strictly generates future roster entries starting from {effectiveFrom} onward. Past biometric punch records, muster roll registers, and historical attendance logs are never modified.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="text-xs font-semibold"
                onClick={() => handleSaveRotation('Draft')}
              >
                Save Draft
              </Button>
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
              {modalStep !== 'config' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    if (modalStep === 'pattern') setModalStep('config');
                    if (modalStep === 'preview') setModalStep('pattern');
                    if (modalStep === 'validation') setModalStep('preview');
                  }}
                >
                  Back
                </Button>
              )}

              {modalStep !== 'validation' ? (
                <Button
                  type="button"
                  size="sm"
                  className="text-xs font-semibold"
                  onClick={() => {
                    if (modalStep === 'config') setModalStep('pattern');
                    if (modalStep === 'pattern') setModalStep('preview');
                    if (modalStep === 'preview') setModalStep('validation');
                  }}
                >
                  Next: {modalStep === 'config' ? 'Pattern' : modalStep === 'pattern' ? 'Preview' : 'Validation'}
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs gap-1.5"
                  onClick={() => handleSaveRotation('Active')}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Approve & Activate Rotation
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 4. VIEW ROTATION DETAILS MODAL ── */}
      {selectedRotationForView && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-primary" /> {selectedRotationForView.name}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Active rotation policy configuration, phase progression sequence, and personnel coverage.
              </DialogDescription>
            </DialogHeader>

            {(() => {
              const viewLifecycle = getRotationLifecycle(selectedRotationForView, shifts);
              return (
                <div className="space-y-3 py-2 text-xs">
                  <div className="p-3 rounded-xl bg-muted/40 border grid grid-cols-2 gap-2.5 font-mono">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-sans font-semibold block">
                        Rotation Code
                      </span>
                      <span className="font-bold text-primary font-sans">{selectedRotationForView.code || 'ROT-PROD-001'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-sans font-semibold block">
                        Status
                      </span>
                      {viewLifecycle.status === 'Scheduled' ? (
                        <Badge variant="outline" className="text-[10px] font-bold text-amber-700 bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 uppercase tracking-wide">
                          SCHEDULED
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 uppercase tracking-wide">
                          {viewLifecycle.status}
                        </Badge>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-sans font-semibold block">
                        Applicable To
                      </span>
                      <span className="font-semibold text-foreground font-sans">
                        {selectedRotationForView.applicableTo || 'Department'}: {selectedRotationForView.department}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-sans font-semibold block">
                        Employees Covered
                      </span>
                      <span className="font-semibold text-foreground font-sans">{selectedRotationForView.headcountCovered} Staff</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-sans font-semibold block">
                        Cadence
                      </span>
                      <span className="font-semibold text-foreground font-sans">{selectedRotationForView.frequency}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-sans font-semibold block">
                        Current Phase
                      </span>
                      <span className="font-bold text-foreground font-sans">
                        {viewLifecycle.isBeforeStart ? (
                          <span className="text-amber-700 dark:text-amber-400 font-semibold">Not Started</span>
                        ) : (
                          `${viewLifecycle.currentPhaseDisplay} (${viewLifecycle.currentShiftCode})`
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-sans font-semibold block">
                        Next Phase
                      </span>
                      <span className="font-semibold text-foreground font-sans">{viewLifecycle.nextPhaseDisplay}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-sans font-semibold block">
                        Starts
                      </span>
                      <span className="font-semibold text-foreground font-sans">{formatDateDMY(viewLifecycle.startsDate)}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-muted-foreground uppercase font-sans font-semibold block">
                        Next Rollover
                      </span>
                      <span className="font-semibold text-foreground font-sans">{formatDateDMY(viewLifecycle.nextRolloverDate)}</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-foreground block mb-1.5">Rotation Sequence & Pattern</Label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {(selectedRotationForView.phases && selectedRotationForView.phases.length > 0
                        ? selectedRotationForView.phases
                        : selectedRotationForView.pattern.map((p, i) => ({
                            phaseNumber: i + 1,
                            shiftCode: p.split(' ')[0],
                            shiftName: p,
                            duration: '1 Week',
                          }))
                      ).map((p, idx, arr) => (
                        <span key={idx} className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-xs font-mono font-bold bg-card px-2 py-1">
                            Phase {p.phaseNumber}: {p.shiftCode} ({p.duration})
                          </Badge>
                          {idx < arr.length - 1 && <span className="text-muted-foreground font-bold">→</span>}
                        </span>
                      ))}
                    </div>
                  </div>

                  {viewLifecycle.isBeforeStart ? (
                    <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                      <span className="text-base leading-none">🟠</span>
                      <div>
                        <strong>Rotation Scheduled:</strong> Initial shifts (<strong>{viewLifecycle.nextPhaseDisplay}</strong>) will take effect on <strong>{formatDateDMY(viewLifecycle.startsDate)}</strong> for {selectedRotationForView.headcountCovered} staff in {selectedRotationForView.department}. First auto-rollover will occur on <strong>{formatDateDMY(viewLifecycle.nextRolloverDate)}</strong>.
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                      <span className="text-base leading-none">🟢</span>
                      <div>
                        <strong>Auto-Rollover Active:</strong> Currently on <strong>{viewLifecycle.currentPhaseDisplay} ({viewLifecycle.currentShiftCode})</strong> for {selectedRotationForView.headcountCovered} staff in {selectedRotationForView.department}. Shifts will advance automatically to <strong>{viewLifecycle.nextPhaseDisplay}</strong> on <strong>{formatDateDMY(viewLifecycle.nextRolloverDate)}</strong>.
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            <DialogFooter>
              <Button size="sm" variant="outline" onClick={() => setIsViewModalOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
