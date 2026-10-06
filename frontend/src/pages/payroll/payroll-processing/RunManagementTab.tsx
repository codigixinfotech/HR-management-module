import { useState } from 'react';
import {
  Calendar,
  Play,
  CheckCircle2,
  Lock,
  RotateCcw,
  Plus,
  FileSpreadsheet,
  Banknote,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Clock,
  Check,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Pencil,
  Trash2,
  RefreshCw,
  Eye,
  AlertTriangle,
  Settings2,
  CalendarRange,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { PayrollRunItem, PayrollRunStatus, PayrollRunType, SalaryCycleConfig } from './types';
import {
  getCompanyCycleConfig,
  saveCompanyCycleConfig,
  computeCycleDates,
  formatPrettyDate,
  getDayOrdinal,
} from './cycle-utils';

interface RunManagementTabProps {
  runs: PayrollRunItem[];
  selectedRun: PayrollRunItem;
  onSelectRun: (run: PayrollRunItem) => void;
  onUpdateRuns: (runs: PayrollRunItem[]) => void;
  onExecuteCalculation: () => void;
  onExecuteCalculationForRun?: (run: PayrollRunItem) => Promise<void>;
  onDeleteRun?: (runId: string) => Promise<void>;
  onUpdateRun?: (updatedRun: PayrollRunItem) => void;
  onGoToReview: () => void;
  onNavigateTab?: (tabKey: string) => void;
  onCreateRun?: (
    month: number,
    year: number,
    runType: PayrollRunType,
    title: string,
    cycleData?: { startDate: string; endDate: string; payDate: string; totalCycleDays: number }
  ) => Promise<void>;
  onAdvanceStatus?: (nextStatus: PayrollRunStatus) => Promise<void>;
  onOpenWizard?: (run: PayrollRunItem, initialStep?: number) => void;
}

const STEPS: Array<{ key: PayrollRunStatus; label: string; desc: string }> = [
  { key: 'DRAFT', label: '1. Draft', desc: 'Pre-run inputs' },
  { key: 'CALCULATED', label: '2. Calculated', desc: 'Wages computed' },
  { key: 'APPROVED', label: '3. Approved', desc: 'Payroll sign-off' },
  { key: 'LOCKED', label: '4. Locked', desc: 'Finalized ledger' },
  { key: 'PAID', label: '5. Paid', desc: 'Disbursed / Cleared' },
];

const MONTH_NAMES = [
  { value: '1', label: 'January', shortLabel: 'Jan', quarter: 'Q4 FY' },
  { value: '2', label: 'February', shortLabel: 'Feb', quarter: 'Q4 FY' },
  { value: '3', label: 'March', shortLabel: 'Mar', quarter: 'Q4 FY' },
  { value: '4', label: 'April', shortLabel: 'Apr', quarter: 'Q1 FY' },
  { value: '5', label: 'May', shortLabel: 'May', quarter: 'Q1 FY' },
  { value: '6', label: 'June', shortLabel: 'Jun', quarter: 'Q1 FY' },
  { value: '7', label: 'July', shortLabel: 'Jul', quarter: 'Q2 FY' },
  { value: '8', label: 'August', shortLabel: 'Aug', quarter: 'Q2 FY' },
  { value: '9', label: 'September', shortLabel: 'Sep', quarter: 'Q2 FY' },
  { value: '10', label: 'October', shortLabel: 'Oct', quarter: 'Q3 FY' },
  { value: '11', label: 'November', shortLabel: 'Nov', quarter: 'Q3 FY' },
  { value: '12', label: 'December', shortLabel: 'Dec', quarter: 'Q3 FY' },
];

const formatRunTitle = (monthVal: string, yearVal: string, runTypeVal: PayrollRunType) => {
  const m = MONTH_NAMES.find((item) => item.value === monthVal)?.label || 'Month';
  if (runTypeVal === 'OFF_CYCLE') {
    return `Off-Cycle Payroll - ${m} ${yearVal}`;
  }
  if (runTypeVal === 'FNF') {
    return `Full & Final Settlement - ${m} ${yearVal}`;
  }
  return `Regular Monthly Payroll - ${m} ${yearVal}`;
};

export function RunManagementTab({
  runs,
  selectedRun,
  onSelectRun,
  onUpdateRuns,
  onExecuteCalculation,
  onExecuteCalculationForRun,
  onDeleteRun,
  onUpdateRun,
  onGoToReview,
  onNavigateTab,
  onCreateRun,
  onAdvanceStatus,
  onOpenWizard,
}: RunManagementTabProps) {
  const [isNewRunModalOpen, setIsNewRunModalOpen] = useState(false);
  const [isRevertModalOpen, setIsRevertModalOpen] = useState(false);
  const [revertReason, setRevertReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Row-level actions state
  const [isCalculatingRunId, setIsCalculatingRunId] = useState<string | null>(null);
  const [editingRun, setEditingRun] = useState<PayrollRunItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editRunType, setEditRunType] = useState<PayrollRunType>('REGULAR');
  const [runToDelete, setRunToDelete] = useState<PayrollRunItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [verifyingRun, setVerifyingRun] = useState<PayrollRunItem | null>(null);

  // Salary Cycle Policy & Selection State
  const [isCyclePolicyModalOpen, setIsCyclePolicyModalOpen] = useState(false);
  const [companyCycleConfig, setCompanyCycleConfig] = useState<SalaryCycleConfig>(() => getCompanyCycleConfig());

  // Policy Modal direct day selection state
  const [policyStartDay, setPolicyStartDay] = useState(companyCycleConfig.startDay);
  const [policyStartMonthOffset, setPolicyStartMonthOffset] = useState<SalaryCycleConfig['startMonthOffset']>(companyCycleConfig.startMonthOffset);
  const [policyEndDay, setPolicyEndDay] = useState(companyCycleConfig.endDay);
  const [policyPayDay, setPolicyPayDay] = useState(companyCycleConfig.payDay);
  const [policyPayMonthOffset, setPolicyPayMonthOffset] = useState<SalaryCycleConfig['payMonthOffset']>(companyCycleConfig.payMonthOffset);

  // New Run Form
  const [newMonth, setNewMonth] = useState('11');
  const [newYear, setNewYear] = useState('2026');
  const [newRunType, setNewRunType] = useState<PayrollRunType>('REGULAR');
  const [newTitle, setNewTitle] = useState('Regular Monthly Payroll - November 2026');

  const initialCycle = computeCycleDates(11, 2026, companyCycleConfig);
  const [cycleStartDate, setCycleStartDate] = useState(initialCycle.startDate);
  const [cycleEndDate, setCycleEndDate] = useState(initialCycle.endDate);
  const [cyclePayDate, setCyclePayDate] = useState(initialCycle.payDate);
  const [cycleDays, setCycleDays] = useState(initialCycle.totalDays);

  const updateCycleDates = (mVal: string, yVal: string, cfg: SalaryCycleConfig = companyCycleConfig) => {
    const computed = computeCycleDates(Number(mVal), Number(yVal), cfg);
    setCycleStartDate(computed.startDate);
    setCycleEndDate(computed.endDate);
    setCyclePayDate(computed.payDate);
    setCycleDays(computed.totalDays);
  };

  const handleSelectPeriod = (monthVal: string, yearVal: string) => {
    setNewMonth(monthVal);
    setNewYear(yearVal);
    setNewTitle(formatRunTitle(monthVal, yearVal, newRunType));
    updateCycleDates(monthVal, yearVal, companyCycleConfig);
  };

  const handleYearStep = (delta: number) => {
    const nextYear = String(Math.max(2020, Math.min(2035, Number(newYear) + delta)));
    setNewYear(nextYear);
    setNewTitle(formatRunTitle(newMonth, nextYear, newRunType));
    updateCycleDates(newMonth, nextYear, companyCycleConfig);
  };

  const handleRunTypeChange = (typeVal: PayrollRunType) => {
    setNewRunType(typeVal);
    setNewTitle(formatRunTitle(newMonth, newYear, typeVal));
  };

  const handleCustomDateChange = (field: 'start' | 'end' | 'pay', val: string) => {
    const s = field === 'start' ? val : cycleStartDate;
    const e = field === 'end' ? val : cycleEndDate;
    if (field === 'start') setCycleStartDate(val);
    if (field === 'end') setCycleEndDate(val);
    if (field === 'pay') setCyclePayDate(val);
    if (s && e) {
      const sD = new Date(s);
      const eD = new Date(e);
      const diff = Math.abs(eD.getTime() - sD.getTime());
      setCycleDays(Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
    }
  };

  const handleSaveCompanyCyclePolicy = () => {
    const updatedPolicy: SalaryCycleConfig = {
      startDay: Number(policyStartDay),
      startMonthOffset: policyStartMonthOffset,
      endDay: Number(policyEndDay),
      payDay: Number(policyPayDay),
      payMonthOffset: policyPayMonthOffset,
    };
    saveCompanyCycleConfig(updatedPolicy);
    setCompanyCycleConfig(updatedPolicy);
    updateCycleDates(newMonth, newYear, updatedPolicy);
    toast.success('Company salary cycle policy updated successfully.');
    setIsCyclePolicyModalOpen(false);
  };

  const applyQuickPreset = (
    start: number,
    startOffset: 'PREVIOUS_MONTH' | 'SAME_MONTH',
    end: number,
    pay: number,
    payOffset: 'SAME_MONTH' | 'NEXT_MONTH'
  ) => {
    setPolicyStartDay(start);
    setPolicyStartMonthOffset(startOffset);
    setPolicyEndDay(end);
    setPolicyPayDay(pay);
    setPolicyPayMonthOffset(payOffset);
  };

  const policyPreview = computeCycleDates(11, 2026, {
    startDay: Number(policyStartDay),
    startMonthOffset: policyStartMonthOffset,
    endDay: Number(policyEndDay),
    payDay: Number(policyPayDay),
    payMonthOffset: policyPayMonthOffset,
  });

  const selectedMonthObj = MONTH_NAMES.find((m) => m.value === newMonth) || MONTH_NAMES[10];

  const normalizedStatus = selectedRun.status === 'UNDER_REVIEW' ? 'CALCULATED' : selectedRun.status;
  const currentStepIndex = STEPS.findIndex((s) => s.key === normalizedStatus);

  const handleCreateRun = async () => {
    const monthNum = Number(newMonth);
    const yearNum = Number(newYear);

    const cycleData = {
      startDate: cycleStartDate,
      endDate: cycleEndDate,
      payDate: cyclePayDate,
      totalCycleDays: cycleDays,
    };

    if (onCreateRun) {
      setIsSubmitting(true);
      try {
        await onCreateRun(monthNum, yearNum, newRunType, newTitle, cycleData);
        setIsNewRunModalOpen(false);
      } catch (err: any) {
        toast.error(err?.message || 'Failed to create payroll run');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const newRun: PayrollRunItem = {
      id: `run-${Date.now()}`,
      runCode: `PR-${yearNum}-${String(monthNum).padStart(2, '0')}`,
      month: monthNum,
      monthName: months[monthNum - 1] || 'Current Month',
      year: yearNum,
      runType: newRunType,
      title: newTitle,
      status: 'DRAFT',
      headcount: 0,
      totalGross: 0,
      totalDeductions: 0,
      totalNet: 0,
      totalEmployerCost: 0,
      ...cycleData,
    };

    onUpdateRuns([newRun, ...runs]);
    onSelectRun(newRun);
    setIsNewRunModalOpen(false);
    toast.success(`Payroll run "${newRun.title}" created with cycle ${cycleStartDate} to ${cycleEndDate}.`);
  };

  const handleAdvanceStatus = async (nextStatus: PayrollRunStatus) => {
    if (onAdvanceStatus) {
      await onAdvanceStatus(nextStatus);
    }

    const updated = runs.map((r) => {
      if (r.id === selectedRun.id) {
        const item: PayrollRunItem = { ...r, status: nextStatus };
        if (nextStatus === 'APPROVED') {
          item.approvedAt = new Date().toISOString();
          item.approvedBy = 'Finance Controller (Checker)';
        } else if (nextStatus === 'LOCKED') {
          item.lockedAt = new Date().toISOString();
          item.lockedBy = 'Payroll Admin';
        } else if (nextStatus === 'PAID') {
          item.paidAt = new Date().toISOString();
          item.paidBy = 'Direct Bank Transfer / Manual Mark';
          item.isBankTransferDone = true;
        }
        return item;
      }
      return r;
    });

    onUpdateRuns(updated);
    const current = updated.find((r) => r.id === selectedRun.id);
    if (current) onSelectRun(current);
    toast.success(`Payroll run status advanced to ${nextStatus}.`);
  };

  const handleRevert = () => {
    if (!revertReason.trim()) {
      toast.error('Please specify a reason for reverting this payroll run.');
      return;
    }

    const updated = runs.map((r) => {
      if (r.id === selectedRun.id) {
        return {
          ...r,
          status: 'DRAFT' as PayrollRunStatus,
        };
      }
      return r;
    });

    onUpdateRuns(updated);
    const current = updated.find((r) => r.id === selectedRun.id);
    if (current) onSelectRun(current);
    setIsRevertModalOpen(false);
    toast.warning(`Payroll run reverted to DRAFT. Reason: ${revertReason}`);
    setRevertReason('');
  };

  const handleExportSalaryRegister = () => {
    toast.success(`Salary Register exported for ${selectedRun.title} (.xlsx)`);
  };

  const handleCalculateRow = (run: PayrollRunItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (run.status === 'PAID') {
      toast.error('This payroll run is already paid and locked against modifications.');
      return;
    }
    onSelectRun(run);
    if (onOpenWizard) {
      onOpenWizard(run, 1);
    } else {
      setVerifyingRun(run);
    }
  };

  const handleConfirmCalculate = async () => {
    if (!verifyingRun) return;
    const run = verifyingRun;
    setIsCalculatingRunId(run.id);
    try {
      if (onExecuteCalculationForRun) {
        await onExecuteCalculationForRun(run);
      } else {
        onSelectRun(run);
        onExecuteCalculation();
      }
      setVerifyingRun(null);
    } catch (err: any) {
      toast.error(err?.message || 'Calculation engine failed');
    } finally {
      setIsCalculatingRunId(null);
    }
  };

  const openEditModal = (run: PayrollRunItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (run.status === 'PAID') {
      toast.error('Audited & Paid payroll runs cannot be edited.');
      return;
    }
    setEditingRun(run);
    setEditTitle(run.title);
    setEditRunType(run.runType);
  };

  const handleSaveEdit = () => {
    if (!editingRun) return;
    if (!editTitle.trim()) {
      toast.error('Run title cannot be empty.');
      return;
    }
    const updated: PayrollRunItem = {
      ...editingRun,
      title: editTitle.trim(),
      runType: editRunType,
    };
    if (onUpdateRun) {
      onUpdateRun(updated);
    } else {
      const nextRuns = runs.map((r) => (r.id === updated.id ? updated : r));
      onUpdateRuns(nextRuns);
      if (selectedRun.id === updated.id) {
        onSelectRun(updated);
      }
    }
    toast.success(`Payroll run "${updated.title}" updated successfully.`);
    setEditingRun(null);
  };

  const openDeleteModal = (run: PayrollRunItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (run.status === 'PAID') {
      toast.error('Audited & Paid payroll runs cannot be deleted.');
      return;
    }
    setRunToDelete(run);
  };

  const handleConfirmDelete = async () => {
    if (!runToDelete) return;
    setIsDeleting(true);
    try {
      if (onDeleteRun) {
        await onDeleteRun(runToDelete.id);
      } else {
        const remaining = runs.filter((r) => r.id !== runToDelete.id);
        onUpdateRuns(remaining);
        if (selectedRun.id === runToDelete.id && remaining.length > 0) {
          onSelectRun(remaining[0]);
        }
        toast.success(`Payroll run "${runToDelete.title}" deleted.`);
      }
      setRunToDelete(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete payroll run');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── ACTIVE RUN STATUS LIFECYCLE STEPPER ── */}
      <Card className="border-indigo-200 dark:border-indigo-900/60 shadow-sm bg-gradient-to-r from-card via-indigo-50/20 to-card">
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">{selectedRun.title}</h3>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-bold ${
                    selectedRun.status === 'PAID'
                      ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                      : selectedRun.status === 'LOCKED'
                        ? 'border-purple-300 text-purple-700 bg-purple-50'
                        : selectedRun.status === 'APPROVED'
                          ? 'border-blue-300 text-blue-700 bg-blue-50'
                          : 'border-amber-300 text-amber-700 bg-amber-50'
                  }`}
                >
                  {selectedRun.status}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground mt-1">
                <span className="font-mono font-bold text-foreground">{selectedRun.runCode}</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-indigo-700 dark:text-indigo-300 font-semibold bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                  <CalendarRange className="h-3 w-3" />
                  Cycle: {selectedRun.startDate ? formatPrettyDate(selectedRun.startDate) : `${selectedRun.monthName} 1`} – {selectedRun.endDate ? formatPrettyDate(selectedRun.endDate) : `${selectedRun.monthName} 30`}
                  <span className="text-[10px] text-muted-foreground font-mono">({selectedRun.totalCycleDays || 30} Days)</span>
                </span>
                <span>•</span>
                <span>Payout: <strong>{selectedRun.payDate ? formatPrettyDate(selectedRun.payDate) : 'End of Month'}</strong></span>
                <span>•</span>
                <span>Headcount: <strong>{selectedRun.headcount} Staff</strong></span>
              </div>
            </div>

            {/* Stepper Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {selectedRun.status === 'DRAFT' && (
                <Button
                  onClick={() => {
                    if (onOpenWizard) {
                      onOpenWizard(selectedRun, 1);
                    } else {
                      setVerifyingRun(selectedRun);
                    }
                  }}
                  className="h-8 text-xs font-semibold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5 fill-current" /> Calculate Payroll
                </Button>
              )}

              {selectedRun.status === 'CALCULATED' && (
                <>
                  <Button
                    onClick={() => {
                      if (onOpenWizard) {
                        onOpenWizard(selectedRun, 1);
                      } else {
                        onGoToReview();
                      }
                    }}
                    variant="outline"
                    className="h-8 text-xs font-semibold gap-1.5 border-indigo-300 text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" /> View Process (Workflow)
                  </Button>
                  <Button
                    onClick={() => handleAdvanceStatus('APPROVED')}
                    className="h-8 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" /> Approve Payroll
                  </Button>
                </>
              )}

              {selectedRun.status === 'UNDER_REVIEW' && (
                <>
                  <Button
                    onClick={() => setIsRevertModalOpen(true)}
                    variant="outline"
                    className="h-8 text-xs font-semibold text-rose-600 border-rose-300 hover:bg-rose-50 cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Revert
                  </Button>
                  <Button
                    onClick={() => handleAdvanceStatus('APPROVED')}
                    className="h-8 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" /> Approve Payroll
                  </Button>
                </>
              )}

              {selectedRun.status === 'APPROVED' && (
                <Button
                  onClick={() => handleAdvanceStatus('LOCKED')}
                  className="h-8 text-xs font-semibold gap-1.5 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Lock className="h-3.5 w-3.5" /> Lock Payroll Run
                </Button>
              )}

              {selectedRun.status === 'LOCKED' && (
                <Button
                  onClick={() => handleAdvanceStatus('PAID')}
                  className="h-8 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Banknote className="h-3.5 w-3.5" /> Mark as Paid (Bypass Bank File)
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportSalaryRegister}
                className="h-8 text-xs font-semibold gap-1.5"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" /> Export Register
              </Button>
            </div>
          </div>

          {/* Visual Step Pipeline */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
            {STEPS.map((s, idx) => {
              const isPast = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return (
                <div
                  key={s.key}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    isCurrent
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40'
                      : isPast
                        ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/20 text-muted-foreground'
                        : 'border-border/60 bg-muted/20 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1">
                      {isPast ? <Check className="h-3 w-3 text-emerald-600" /> : null}
                      {s.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── ALL PAYROLL RUNS DIRECTORY ── */}
      <Card className="border-border/80 shadow-2xs overflow-hidden">
        <CardHeader className="bg-muted/30 px-6 py-3.5 border-b border-border/60 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xs font-bold text-foreground">Payroll Runs Directory</CardTitle>
            <CardDescription className="text-[11px]">
              Historical and active regular, off-cycle, and full & final runs.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setPolicyStartDay(companyCycleConfig.startDay);
                setPolicyStartMonthOffset(companyCycleConfig.startMonthOffset);
                setPolicyEndDay(companyCycleConfig.endDay);
                setPolicyPayDay(companyCycleConfig.payDay);
                setPolicyPayMonthOffset(companyCycleConfig.payMonthOffset);
                setIsCyclePolicyModalOpen(true);
              }}
              className="h-8 text-xs font-semibold gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50 cursor-pointer"
              title="Configure Company Salary Cycle Policy"
            >
              <Settings2 className="h-3.5 w-3.5" /> Pay Cycle Policy
            </Button>

            <Button
              size="sm"
              onClick={() => setIsNewRunModalOpen(true)}
              className="h-8 text-xs font-semibold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Initialize New Run
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="text-xs font-bold pl-6">Run Code</TableHead>
                <TableHead className="text-xs font-bold">Payroll Period</TableHead>
                <TableHead className="text-xs font-bold">Type</TableHead>
                <TableHead className="text-right text-xs font-bold">Headcount</TableHead>
                <TableHead className="text-right text-xs font-bold">Gross Wages</TableHead>
                <TableHead className="text-right text-xs font-bold">Deductions</TableHead>
                <TableHead className="text-right text-xs font-bold">Net Payout</TableHead>
                <TableHead className="text-xs font-bold">Status</TableHead>
                <TableHead className="text-right text-xs font-bold pr-6 min-w-[280px]">Actions & Operations</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((r) => {
                const isSelected = r.id === selectedRun.id;
                return (
                  <TableRow
                    key={r.id}
                    onClick={() => onSelectRun(r)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-50/50 dark:bg-indigo-950/30 font-medium' : 'hover:bg-muted/20'
                    }`}
                  >
                    <TableCell className="pl-6 font-mono text-xs font-bold text-foreground">
                      {r.runCode}
                    </TableCell>

                    <TableCell>
                      <div className="font-semibold text-xs text-foreground">{r.title}</div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <CalendarRange className="h-3 w-3 text-indigo-500 shrink-0" />
                        <span>
                          {r.startDate && r.endDate
                            ? `${formatPrettyDate(r.startDate)} – ${formatPrettyDate(r.endDate)} (${r.totalCycleDays || 30}d)`
                            : `${r.monthName} ${r.year}`}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-semibold">
                        {r.runType === 'REGULAR' && 'Regular Monthly'}
                        {r.runType === 'OFF_CYCLE' && 'Off-Cycle Bonus'}
                        {r.runType === 'FNF' && 'Full & Final (FNF)'}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right font-mono text-xs">
                      {r.headcount}
                    </TableCell>

                    <TableCell className="text-right font-mono text-xs font-semibold">
                      ₹{r.totalGross.toLocaleString('en-IN')}
                    </TableCell>

                    <TableCell className="text-right font-mono text-xs text-rose-600">
                      -₹{r.totalDeductions.toLocaleString('en-IN')}
                    </TableCell>

                    <TableCell className="text-right font-mono text-xs font-bold text-emerald-600">
                      ₹{r.totalNet.toLocaleString('en-IN')}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${
                          r.status === 'PAID'
                            ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                            : r.status === 'LOCKED'
                              ? 'border-purple-300 text-purple-700 bg-purple-50'
                              : r.status === 'APPROVED'
                                ? 'border-blue-300 text-blue-700 bg-blue-50'
                                : 'border-amber-300 text-amber-700 bg-amber-50'
                        }`}
                      >
                        {r.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {/* 1. Calculate / Recalculate button */}
                        {r.status === 'DRAFT' && (
                          <Button
                            size="sm"
                            disabled={isCalculatingRunId === r.id}
                            onClick={(e) => handleCalculateRow(r, e)}
                            className="h-7 px-2.5 text-xs font-semibold gap-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs cursor-pointer"
                            title="Execute salary calculation engine for this run"
                          >
                            {isCalculatingRunId === r.id ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <Play className="h-3 w-3 fill-current" />
                            )}
                            Calculate Salary
                          </Button>
                        )}

                        {['CALCULATED', 'UNDER_REVIEW', 'APPROVED'].includes(r.status) && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isCalculatingRunId === r.id}
                            onClick={(e) => handleCalculateRow(r, e)}
                            className="h-7 px-2 text-xs font-semibold gap-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50 cursor-pointer"
                            title="Recalculate pro-rata earnings and statutory deductions"
                          >
                            {isCalculatingRunId === r.id ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <RotateCcw className="h-3 w-3" />
                            )}
                            Recalculate
                          </Button>
                        )}

                        {r.status === 'PAID' && (
                          <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 px-1">
                            <CheckCircle2 className="h-3 w-3" /> Paid & Locked
                          </span>
                        )}

                        {/* 2. Edit button */}
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={r.status === 'PAID'}
                          onClick={(e) => openEditModal(r, e)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer disabled:opacity-30"
                          title={r.status === 'PAID' ? 'Cannot edit paid runs' : 'Edit run title and type'}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>

                        {/* 3. Delete button */}
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={r.status === 'PAID'}
                          onClick={(e) => openDeleteModal(r, e)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 cursor-pointer disabled:opacity-30"
                          title={r.status === 'PAID' ? 'Cannot delete finalized runs' : 'Delete payroll run'}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>

                        {/* 4. Select / Viewing indicator button */}
                        <Button
                          size="sm"
                          variant={isSelected ? 'default' : 'outline'}
                          onClick={() => {
                            onSelectRun(r);
                            if (onOpenWizard) {
                              onOpenWizard(r, r.status === 'DRAFT' ? 1 : 4);
                            }
                          }}
                          className={`h-7 px-2.5 text-xs gap-1 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold shadow-2xs'
                              : 'border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/40'
                          }`}
                          title="View step-by-step attendance, checklist, variable pay, and wages in modal"
                        >
                          <Eye className="h-3 w-3" />
                          {isSelected ? 'View Process' : 'Select & View'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── CREATE NEW PAYROLL RUN MODAL ── */}
      <Dialog open={isNewRunModalOpen} onOpenChange={setIsNewRunModalOpen}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-600" /> Initialize Payroll Run
            </DialogTitle>
            <DialogDescription className="text-xs">
              Select payroll month, year, and execution type to initialize a new processing ledger.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-1 text-xs">
            {/* Run Title */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Run Title</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="h-8 text-xs font-medium"
              />
            </div>

            {/* ── INTERACTIVE CALENDAR PERIOD PICKER ── */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-indigo-600" /> Payroll Period Calendar
                </Label>
                <Badge variant="outline" className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200">
                  {selectedMonthObj?.label} {newYear}
                </Badge>
              </div>

              <div className="rounded-xl border border-border/80 bg-muted/20 p-3 space-y-2.5 shadow-2xs">
                {/* Year Controller with Left/Right and Year Display */}
                <div className="flex items-center justify-between px-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleYearStep(-1)}
                    className="h-7 w-7 p-0 rounded-lg hover:bg-muted"
                    title="Previous Year"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-indigo-600" />
                    <span className="text-sm font-bold font-mono tracking-wide text-foreground">
                      {newYear}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">Calendar Year</span>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleYearStep(1)}
                    className="h-7 w-7 p-0 rounded-lg hover:bg-muted"
                    title="Next Year"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* 12-Month Calendar Grid */}
                <div className="grid grid-cols-4 gap-1.5">
                  {MONTH_NAMES.map((m) => {
                    const isSelected = newMonth === m.value;
                    return (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => handleSelectPeriod(m.value, newYear)}
                        className={`py-2 px-1 rounded-lg text-xs transition-all text-center border cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-600 text-white font-bold shadow-xs ring-2 ring-indigo-300 dark:ring-indigo-800'
                            : 'bg-background hover:bg-muted/80 border-border/60 text-foreground hover:border-indigo-300'
                        }`}
                      >
                        <div className="text-[11px] font-semibold">{m.shortLabel}</div>
                        <div className={`text-[9px] ${isSelected ? 'text-indigo-100' : 'text-muted-foreground'}`}>
                          {m.quarter}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Quick Selection Shortcuts */}
                <div className="pt-1.5 flex items-center justify-between border-t border-border/50 text-[10px]">
                  <span className="text-muted-foreground">Quick Switch:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleSelectPeriod('10', '2026')}
                      className={`px-2 py-0.5 rounded font-medium cursor-pointer ${
                        newMonth === '10' && newYear === '2026'
                          ? 'bg-indigo-100 text-indigo-700 font-bold'
                          : 'text-indigo-600 hover:bg-indigo-50'
                      }`}
                    >
                      Oct 2026
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPeriod('11', '2026')}
                      className={`px-2 py-0.5 rounded font-medium cursor-pointer ${
                        newMonth === '11' && newYear === '2026'
                          ? 'bg-indigo-100 text-indigo-700 font-bold'
                          : 'text-indigo-600 hover:bg-indigo-50'
                      }`}
                    >
                      Nov 2026
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPeriod('12', '2026')}
                      className={`px-2 py-0.5 rounded font-medium cursor-pointer ${
                        newMonth === '12' && newYear === '2026'
                          ? 'bg-indigo-100 text-indigo-700 font-bold'
                          : 'text-indigo-600 hover:bg-indigo-50'
                      }`}
                    >
                      Dec 2026
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Run Type */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Run Type</Label>
              <Select value={newRunType} onValueChange={(val: any) => handleRunTypeChange(val)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REGULAR">Regular Monthly Run</SelectItem>
                  <SelectItem value="OFF_CYCLE">Off-Cycle (Incentives / Correction)</SelectItem>
                  <SelectItem value="FNF">Full & Final (FNF Settlement)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ── SALARY CYCLE & ATTENDANCE CUT-OFF CONFIGURATION ── */}
            <div className="space-y-2.5 rounded-xl border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 p-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <CalendarRange className="h-3.5 w-3.5 text-indigo-600" /> Salary Cycle & Attendance Cut-off Dates
                </Label>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-100/70 dark:bg-indigo-900/60 border-indigo-300">
                    {cycleDays} Days in Cycle
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] px-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100/50"
                    onClick={() => updateCycleDates(newMonth, newYear, companyCycleConfig)}
                    title="Reset dates to organization cycle policy default"
                  >
                    Reset to Policy
                  </Button>
                </div>
              </div>

              {/* Date Inputs: Start Date, End Date, Pay Date */}
              <div className="grid grid-cols-3 gap-2 pt-0.5">
                <div className="space-y-1">
                  <Label className="text-[10px] font-medium text-muted-foreground">Attendance Start</Label>
                  <Input
                    type="date"
                    value={cycleStartDate}
                    onChange={(e) => handleCustomDateChange('start', e.target.value)}
                    className="h-7 text-xs font-mono bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-medium text-muted-foreground">Attendance End</Label>
                  <Input
                    type="date"
                    value={cycleEndDate}
                    onChange={(e) => handleCustomDateChange('end', e.target.value)}
                    className="h-7 text-xs font-mono bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-medium text-muted-foreground">Payout Date</Label>
                  <Input
                    type="date"
                    value={cyclePayDate}
                    onChange={(e) => handleCustomDateChange('pay', e.target.value)}
                    className="h-7 text-xs font-mono bg-background"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5 leading-tight">
                <span>
                  Attendance & LOP will be fetched between <strong>{cycleStartDate || '—'}</strong> and <strong>{cycleEndDate || '—'}</strong>.
                </span>
                <span className="text-indigo-600 font-medium">
                  Policy: {getDayOrdinal(companyCycleConfig.startDay)} to {getDayOrdinal(companyCycleConfig.endDay)}
                </span>
              </div>
            </div>

            <div className="rounded-md border border-amber-200 bg-amber-50/60 p-2 text-[11px] text-amber-800 leading-relaxed">
              <strong>Note:</strong> Initializing creates a <strong>DRAFT</strong> container with ₹0 computed. You can inspect attendance, review LOP/bonuses, and click <strong>"Calculate Payroll"</strong> to calculate wages and generate payslips.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsNewRunModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isSubmitting}
              onClick={handleCreateRun}
              className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isSubmitting ? 'Creating...' : 'Create Run'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── REVERT RUN MODAL ── */}
      <Dialog open={isRevertModalOpen} onOpenChange={setIsRevertModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-rose-600 flex items-center gap-2">
              <RotateCcw className="h-4 w-4" /> Revert Payroll Run
            </DialogTitle>
            <DialogDescription className="text-xs">
              Reverting will reset the status to DRAFT, enabling changes to attendance, deductions, and variable pay.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <Label className="text-xs font-semibold">Reason for Revert (Audit Mandated) *</Label>
            <Input
              value={revertReason}
              onChange={(e) => setRevertReason(e.target.value)}
              placeholder="e.g. Correcting missing overtime hours for manufacturing staff"
              className="h-8 text-xs"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsRevertModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleRevert} className="text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white">
              Confirm Revert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── EDIT PAYROLL RUN MODAL ── */}
      <Dialog open={Boolean(editingRun)} onOpenChange={(open) => !open && setEditingRun(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Pencil className="h-4 w-4 text-indigo-600" /> Edit Payroll Run
            </DialogTitle>
            <DialogDescription className="text-xs">
              Update the title or run category for {editingRun?.runCode}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Run Code (Identifier)</Label>
              <Input
                value={editingRun?.runCode || ''}
                disabled
                className="h-8 text-xs font-mono bg-muted/40 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Run Title *</Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="e.g. Regular Monthly Payroll - October 2026"
                className="h-8 text-xs font-medium"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Run Type</Label>
              <Select value={editRunType} onValueChange={(val: any) => setEditRunType(val)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REGULAR">Regular Monthly Run</SelectItem>
                  <SelectItem value="OFF_CYCLE">Off-Cycle (Incentives / Correction)</SelectItem>
                  <SelectItem value="FNF">Full & Final (FNF Settlement)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-[11px] text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border/60">
              Period: <strong>{editingRun?.monthName} {editingRun?.year}</strong> • Status: <strong>{editingRun?.status}</strong> • Headcount: <strong>{editingRun?.headcount} Staff</strong>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditingRun(null)} className="text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveEdit}
              className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DELETE PAYROLL RUN CONFIRMATION MODAL ── */}
      <Dialog open={Boolean(runToDelete)} onOpenChange={(open) => !open && !isDeleting && setRunToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-rose-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Delete Payroll Run
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to delete this payroll run? This will remove all associated draft payslips and diagnostic records for this period.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-2">
            <div className="rounded-lg border border-rose-200 bg-rose-50/70 dark:bg-rose-950/30 p-3 text-xs text-rose-900 dark:text-rose-200 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <Trash2 className="h-3.5 w-3.5 text-rose-600" /> {runToDelete?.title}
              </p>
              <p className="text-[11px] text-rose-700 dark:text-rose-300">
                Run Code: <strong>{runToDelete?.runCode}</strong> • Period: <strong>{runToDelete?.monthName} {runToDelete?.year}</strong>
              </p>
              <p className="text-[11px] text-rose-700 dark:text-rose-300">
                Headcount: <strong>{runToDelete?.headcount || 0} employees</strong> • Net Payout: <strong>₹{(runToDelete?.totalNet || 0).toLocaleString('en-IN')}</strong>
              </p>
            </div>
            <p className="text-[11px] text-muted-foreground italic">
              * Note: Audited and Paid runs cannot be deleted. Any deleted draft period can be re-initialized at any time.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => setRunToDelete(null)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white gap-1.5 cursor-pointer"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" /> Delete Run
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── PRE-CALCULATION VERIFICATION & CHECKOUT MODAL ── */}
      <Dialog open={Boolean(verifyingRun)} onOpenChange={(open) => !open && setVerifyingRun(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
              <Sparkles className="h-4 w-4 text-indigo-600" /> Pre-Calculation Input Verification
            </DialogTitle>
            <DialogDescription className="text-xs">
              Before computing pro-rata earnings and statutory deductions for <strong>{verifyingRun?.title}</strong>, review these operational prerequisites.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1 text-xs">
            {/* 1. Attendance & Working Days Checkout */}
            <div className="rounded-lg border border-border/80 p-3 bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-600" />
                  <span className="font-bold text-foreground">1. Attendance, Working Days & LOP</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (verifyingRun) onSelectRun(verifyingRun);
                    setVerifyingRun(null);
                    onNavigateTab?.('attendance');
                  }}
                  className="h-6 text-[11px] gap-1 px-2.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50 font-semibold cursor-pointer"
                >
                  Review Attendance <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Verifies biometric attendance from <strong>{verifyingRun?.startDate ? formatPrettyDate(verifyingRun.startDate) : 'Start Date'}</strong> to <strong>{verifyingRun?.endDate ? formatPrettyDate(verifyingRun.endDate) : 'End Date'}</strong> ({verifyingRun?.totalCycleDays || 30} days in cut-off cycle), present days, and Loss of Pay (LOP) unpaid leave adjustments.
              </p>
            </div>

            {/* 2. Diagnostic Checklist */}
            <div className="rounded-lg border border-border/80 p-3 bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span className="font-bold text-foreground">2. Pre-Run Diagnostic Checklist</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (verifyingRun) onSelectRun(verifyingRun);
                    setVerifyingRun(null);
                    onNavigateTab?.('checklist');
                  }}
                  className="h-6 text-[11px] gap-1 px-2.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50 font-semibold cursor-pointer"
                >
                  Review Checklist <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Ensures all staff have assigned salary structures, valid PAN tax status, and bank account numbers for disbursement.
              </p>
            </div>

            {/* 3. Variable Pay & Claims */}
            <div className="rounded-lg border border-border/80 p-3 bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-purple-600" />
                  <span className="font-bold text-foreground">3. Variable Pay, Bonuses & Deductions</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (verifyingRun) onSelectRun(verifyingRun);
                    setVerifyingRun(null);
                    onNavigateTab?.('variable');
                  }}
                  className="h-6 text-[11px] gap-1 px-2.5 text-purple-600 border-purple-200 hover:bg-purple-50 font-semibold cursor-pointer"
                >
                  Review Variable Pay <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Applies performance incentives, overtime hours, expense reimbursements, or loan EMI deductions.
              </p>
            </div>

            <div className="rounded-md border border-indigo-200 bg-indigo-50/60 dark:bg-indigo-950/30 p-2.5 text-[11px] text-indigo-900 dark:text-indigo-200">
              💡 <strong>Ready:</strong> If attendance and working days are already reviewed, click <strong>"Confirm & Calculate Salary"</strong> to execute computations.
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (verifyingRun) onSelectRun(verifyingRun);
                setVerifyingRun(null);
                onNavigateTab?.('attendance');
              }}
              className="text-xs cursor-pointer"
            >
              Go Check Attendance First
            </Button>
            <Button
              size="sm"
              disabled={isCalculatingRunId === verifyingRun?.id}
              onClick={handleConfirmCalculate}
              className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 cursor-pointer shadow-xs"
            >
              {isCalculatingRunId === verifyingRun?.id ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Calculating Wages...
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" /> Confirm & Calculate Salary
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── COMPANY SALARY CYCLE POLICY MODAL ── */}
      <Dialog open={isCyclePolicyModalOpen} onOpenChange={setIsCyclePolicyModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-indigo-600" /> Company Salary Cycle Policy
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure the organization's standard attendance cut-off dates and payroll disbursement schedule.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1 text-xs">
            {/* Quick Presets */}
            <div className="space-y-1.5 bg-muted/30 p-2.5 rounded-lg border border-border/60">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Quick Preset Shortcuts (Optional)
              </Label>
              <div className="flex flex-wrap gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-6 text-[10px] px-2 border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                  onClick={() => applyQuickPreset(26, 'PREVIOUS_MONTH', 25, 0, 'SAME_MONTH')}
                >
                  26th → 25th (IT Standard)
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-6 text-[10px] px-2 border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                  onClick={() => applyQuickPreset(21, 'PREVIOUS_MONTH', 20, 0, 'SAME_MONTH')}
                >
                  21st → 20th
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-6 text-[10px] px-2 border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                  onClick={() => applyQuickPreset(1, 'SAME_MONTH', 0, 0, 'SAME_MONTH')}
                >
                  1st → End of Month (Calendar)
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-6 text-[10px] px-2 border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                  onClick={() => applyQuickPreset(16, 'PREVIOUS_MONTH', 15, 0, 'SAME_MONTH')}
                >
                  16th → 15th
                </Button>
              </div>
            </div>

            {/* Attendance Cycle Start Day & Month */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center justify-between">
                <span>1. Attendance Cycle Starts On</span>
                <span className="text-[10px] text-muted-foreground font-normal">Cut-off commencement</span>
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Select Day</Label>
                  <Select
                    value={String(policyStartDay)}
                    onValueChange={(val) => setPolicyStartDay(Number(val))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <SelectItem key={d} value={String(d)}>
                          {getDayOrdinal(d)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Month Reference</Label>
                  <Select
                    value={policyStartMonthOffset}
                    onValueChange={(val: any) => setPolicyStartMonthOffset(val)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PREVIOUS_MONTH">of Previous Month</SelectItem>
                      <SelectItem value="SAME_MONTH">of Same (Current) Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Attendance Cycle End Day */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center justify-between">
                <span>2. Attendance Cycle Ends On</span>
                <span className="text-[10px] text-muted-foreground font-normal">Cut-off conclusion</span>
              </Label>
              <div>
                <Label className="text-[10px] text-muted-foreground">Select Day (Current Month)</Label>
                <Select
                  value={String(policyEndDay)}
                  onValueChange={(val) => setPolicyEndDay(Number(val))}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    <SelectItem value="0">Last Day of Month (28th/29th/30th/31st)</SelectItem>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <SelectItem key={d} value={String(d)}>
                        {getDayOrdinal(d)} of Current Month
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Default Salary Disbursement (Pay Day) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center justify-between">
                <span>3. Salary Payout (Disbursement) Day</span>
                <span className="text-[10px] text-muted-foreground font-normal">Bank release schedule</span>
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Select Day</Label>
                  <Select
                    value={String(policyPayDay)}
                    onValueChange={(val) => setPolicyPayDay(Number(val))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      <SelectItem value="0">Last Day of Month</SelectItem>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <SelectItem key={d} value={String(d)}>
                          {getDayOrdinal(d)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Payout Timing</Label>
                  <Select
                    value={policyPayMonthOffset}
                    onValueChange={(val: any) => setPolicyPayMonthOffset(val)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SAME_MONTH">of Same Month</SelectItem>
                      <SelectItem value="NEXT_MONTH">of Following Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Live Policy Preview Box */}
            <div className="rounded-xl border border-indigo-200/90 dark:border-indigo-900 bg-indigo-50/60 dark:bg-indigo-950/30 p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                  <CalendarRange className="h-3.5 w-3.5 text-indigo-600" /> Live Policy Calculation Preview
                </span>
                <Badge variant="outline" className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-100 dark:bg-indigo-900 border-indigo-300">
                  {policyPreview.totalDays} Days in Cycle
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Attendance Cut-off Period:</span>
                  <span className="font-semibold text-foreground">{policyPreview.formattedCycle}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Salary Payout Date:</span>
                  <span className="font-semibold text-foreground">{formatPrettyDate(policyPreview.payDate)}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsCyclePolicyModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveCompanyCyclePolicy}
              className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
            >
              Save Policy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
