import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Clock,
  ClipboardCheck,
  Coins,
  FileText,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Play,
  RefreshCw,
  CalendarRange,
  Banknote,
  Sparkles,
  ShieldCheck,
  Check,
  Search,
  PauseCircle,
  PlayCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { toast } from 'sonner';
import type {
  PayrollRunItem,
  AttendanceLopRecord,
  PreRunCheckItem,
  VariableInputRecord,
  EmployeePayrollReviewRecord,
} from './types';
import { formatPrettyDate } from './cycle-utils';

interface PayrollRunWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  run: PayrollRunItem | null;
  initialStep?: number;
  attendanceRecords: AttendanceLopRecord[];
  onUpdateAttendance: (records: AttendanceLopRecord[]) => void;
  checklist: PreRunCheckItem[];
  onResolveCheck: (checkId: string) => void;
  onGoToStructure?: () => void;
  variableRecords: VariableInputRecord[];
  onUpdateVariable: (records: VariableInputRecord[]) => void;
  reviewRecords: EmployeePayrollReviewRecord[];
  onUpdateReview: (records: EmployeePayrollReviewRecord[]) => void;
  onExecuteCalculation: () => Promise<void>;
  onApproveRun?: () => Promise<void>;
  isCalculating?: boolean;
}

const WIZARD_STEPS = [
  { step: 1, label: 'Attendance & LOP', shortDesc: 'Working days & unpaid leaves', icon: Clock },
  { step: 2, label: 'Pre-Run Checklist', shortDesc: 'Master data diagnostics', icon: ClipboardCheck },
  { step: 3, label: 'Variable Inputs', shortDesc: 'Incentives, OT & deductions', icon: Coins },
  { step: 4, label: 'Calculate & Review', shortDesc: 'Wages computed & ledger', icon: FileText },
];

export function PayrollRunWizardModal({
  isOpen,
  onClose,
  run,
  initialStep = 1,
  attendanceRecords,
  onUpdateAttendance,
  checklist,
  onResolveCheck,
  onGoToStructure,
  variableRecords,
  onUpdateVariable,
  reviewRecords,
  onUpdateReview,
  onExecuteCalculation,
  onApproveRun,
  isCalculating = false,
}: PayrollRunWizardModalProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isSyncingAttendance, setIsSyncingAttendance] = useState(false);
  const [reviewSearch, setReviewSearch] = useState('');
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [variableSearch, setVariableSearch] = useState('');
  const [localHeldIds, setLocalHeldIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    attendanceRecords.forEach((r) => { if (r.isHeld) initial.add(r.employeeId); });
    reviewRecords.forEach((r) => { if (r.isSalaryHeld) initial.add(r.employeeId); });
    return initial;
  });

  // Reset to initialStep whenever modal opens for a new run
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(initialStep || 1);
      const initial = new Set<string>();
      attendanceRecords.forEach((r) => { if (r.isHeld) initial.add(r.employeeId); });
      reviewRecords.forEach((r) => { if (r.isSalaryHeld) initial.add(r.employeeId); });
      setLocalHeldIds(initial);
    }
  }, [isOpen, initialStep, run?.id]);

  if (!run) return null;

  const isEmpOnHold = (empId: string) => {
    if (localHeldIds.has(empId)) return true;
    const fromAtt = attendanceRecords.find((r) => r.employeeId === empId)?.isHeld;
    const fromRev = reviewRecords.find((r) => r.employeeId === empId)?.isSalaryHeld;
    return Boolean(fromAtt || fromRev);
  };

  // ── STEP 1: ATTENDANCE & LOP HANDLERS ──
  const handleLopChange = (recordId: string, newLop: number) => {
    const updated = attendanceRecords.map((r) => {
      if (r.id === recordId) {
        const lop = Math.max(0, Math.min(r.totalCalendarDays, newLop));
        const payableDays = Math.max(0, r.totalCalendarDays - lop);
        const proRataFactor = Math.round((payableDays / r.totalCalendarDays) * 1000) / 1000;
        return {
          ...r,
          lopDays: lop,
          payableDays,
          proRataFactor,
        };
      }
      return r;
    });
    onUpdateAttendance(updated);
    toast.success('LOP days updated. Pro-rata factor recalculated.');
  };

  const handleSyncAttendance = () => {
    setIsSyncingAttendance(true);
    setTimeout(() => {
      setIsSyncingAttendance(false);
      toast.success(`Synced live biometric attendance and leaves for ${run.monthName} ${run.year}.`);
    }, 600);
  };

  const totalLopDays = attendanceRecords.reduce((sum, r) => sum + r.lopDays, 0);

  // ── STEP 2: CHECKLIST ISSUES ──
  const criticalIssues = checklist.filter((c) => c.severity === 'CRITICAL' && !c.isResolved);
  const warningIssues = checklist.filter((c) => c.severity === 'WARNING' && !c.isResolved);
  const isChecklistReady = criticalIssues.length === 0;

  // ── STEP 3: VARIABLE INPUTS HANDLERS ──
  const handleVariableChange = (recordId: string, field: keyof VariableInputRecord, val: number) => {
    const updated = variableRecords.map((r) => {
      if (r.id === recordId) {
        return {
          ...r,
          [field]: Math.max(0, val),
        };
      }
      return r;
    });
    onUpdateVariable(updated);
  };

  const totalOt = variableRecords.reduce((sum, r) => sum + r.overtimeAmount, 0);
  const totalBonuses = variableRecords.reduce((sum, r) => sum + r.performanceBonus + r.salesIncentive, 0);
  const totalEmis = variableRecords.reduce((sum, r) => sum + r.loanEmiDeduction, 0);

  // ── STEP 4 & STEP 1 TWO-WAY SALARY HOLD HANDLER ──
  const handleToggleHold = (empId: string) => {
    const currentlyHeld = isEmpOnHold(empId);
    const nextHeld = !currentlyHeld;
    let empName = 'Employee';

    // Immediate reactive local state update
    setLocalHeldIds((prev) => {
      const next = new Set(prev);
      if (nextHeld) {
        next.add(empId);
      } else {
        next.delete(empId);
      }
      return next;
    });

    // 1. Update attendanceRecords (for Step 1)
    const updatedAttendance = attendanceRecords.map((r) => {
      if (r.employeeId === empId) {
        empName = r.name;
        return {
          ...r,
          isHeld: nextHeld,
        };
      }
      return r;
    });
    onUpdateAttendance(updatedAttendance);

    // 2. Update reviewRecords (for Step 4)
    const updatedReview = reviewRecords.map((r) => {
      if (r.employeeId === empId) {
        empName = r.name;
        return {
          ...r,
          isSalaryHeld: nextHeld,
          holdReason: nextHeld ? 'Salary held pending administrative/finance review' : undefined,
        };
      }
      return r;
    });
    onUpdateReview(updatedReview);

    if (nextHeld) {
      toast.warning(`Salary for ${empName} placed ON HOLD.`);
    } else {
      toast.success(`Salary for ${empName} RELEASED from hold.`);
    }
  };

  const heldRecords = reviewRecords.filter((r) => isEmpOnHold(r.employeeId));
  const totalHeldAmount = heldRecords.reduce((sum, r) => sum + r.netPay, 0);
  const actualDisbursementNet = Math.max(0, run.totalNet - totalHeldAmount);
  const totalHeldCount = attendanceRecords.filter((r) => isEmpOnHold(r.employeeId)).length || localHeldIds.size;

  const filteredAttendanceRecords = attendanceRecords.filter(
    (r) =>
      r.name.toLowerCase().includes(attendanceSearch.toLowerCase()) ||
      r.employeeCode.toLowerCase().includes(attendanceSearch.toLowerCase()) ||
      r.department.toLowerCase().includes(attendanceSearch.toLowerCase())
  );

  const filteredVariableRecords = variableRecords.filter(
    (r) =>
      r.name.toLowerCase().includes(variableSearch.toLowerCase()) ||
      r.employeeCode.toLowerCase().includes(variableSearch.toLowerCase()) ||
      r.department.toLowerCase().includes(variableSearch.toLowerCase())
  );

  const filteredReviewRecords = reviewRecords.filter(
    (r) =>
      r.name.toLowerCase().includes(reviewSearch.toLowerCase()) ||
      r.employeeCode.toLowerCase().includes(reviewSearch.toLowerCase()) ||
      r.department.toLowerCase().includes(reviewSearch.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl! w-[95vw]! max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-background">
        {/* ── MODAL HEADER WITH RUN IDENTIFIERS ── */}
        <DialogHeader className="px-6 py-4 border-b border-border/80 bg-muted/20 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-base font-bold text-foreground">
                  {run.title}
                </DialogTitle>
                <Badge
                  variant={run.status === 'DRAFT' ? 'outline' : 'default'}
                  className={`text-[10px] font-bold ${
                    run.status === 'DRAFT'
                      ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200'
                      : run.status === 'CALCULATED'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {run.status}
                </Badge>
                <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                  {run.runCode}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  <CalendarRange className="h-3.5 w-3.5 text-indigo-600" />
                  Cycle: {formatPrettyDate(run.startDate)} – {formatPrettyDate(run.endDate)} ({run.totalCycleDays || 30} Days)
                </span>
                <span>•</span>
                <span>Payout Date: <strong>{formatPrettyDate(run.payDate)}</strong></span>
                <span>•</span>
                <span>Headcount: <strong>{run.headcount || attendanceRecords.length} Staff</strong></span>
              </DialogDescription>
            </div>
          </div>

          {/* ── 4-STEP WIZARD PROGRESS BAR ── */}
          <div className="grid grid-cols-4 gap-2 pt-3">
            {WIZARD_STEPS.map((st) => {
              const Icon = st.icon;
              const isActive = currentStep === st.step;
              const isPast = currentStep > st.step;

              return (
                <button
                  key={st.step}
                  type="button"
                  onClick={() => setCurrentStep(st.step)}
                  className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all border text-xs cursor-pointer ${
                    isActive
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 shadow-2xs'
                      : isPast
                      ? 'bg-muted/40 border-border text-foreground hover:bg-muted/60'
                      : 'bg-muted/20 border-border/40 text-muted-foreground hover:bg-muted/40'
                  }`}
                >
                  <div
                    className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive
                        ? 'bg-indigo-600 text-white font-bold'
                        : isPast
                        ? 'bg-emerald-500/20 text-emerald-600'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isPast ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className={`font-bold truncate text-[11px] ${isActive ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>
                      {st.step}. {st.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate hidden md:block">
                      {st.shortDesc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </DialogHeader>

        {/* ── STEP CONTENT AREA ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* ═════════ STEP 1: ATTENDANCE & LOP ═════════ */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-indigo-50/50 dark:bg-indigo-950/20 p-3.5 rounded-xl border border-indigo-200/80 dark:border-indigo-900/60">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-600 text-white">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">
                      {run.monthName} {run.year} Attendance & Working Days Register
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Attendance cut-off: <strong>{formatPrettyDate(run.startDate)}</strong> to <strong>{formatPrettyDate(run.endDate)}</strong>. Edit LOP days directly in the table below to adjust pro-rata salaries.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSyncAttendance}
                    disabled={isSyncingAttendance}
                    className="h-8 text-xs font-semibold gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isSyncingAttendance ? 'animate-spin' : ''}`} />
                    Sync Biometrics
                  </Button>
                  <Badge variant="outline" className="h-8 px-2.5 text-xs font-mono font-bold bg-background">
                    Total LOP: {totalLopDays} Days
                  </Badge>
                </div>
              </div>

              {/* Search & Hold Filter Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="relative w-72">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search employee by name, code, dept..."
                    value={attendanceSearch}
                    onChange={(e) => setAttendanceSearch(e.target.value)}
                    className="pl-8 h-8 text-xs bg-background"
                  />
                </div>

                <div className="flex items-center gap-2">
                  {totalHeldCount > 0 && (
                    <Badge variant="outline" className="h-7 px-2.5 text-xs bg-amber-50 text-amber-800 border-amber-300 font-bold flex items-center gap-1.5 shadow-2xs">
                      <PauseCircle className="h-3.5 w-3.5 text-amber-600" />
                      {totalHeldCount} Salary on Hold
                    </Badge>
                  )}
                  <span className="text-[11px] text-muted-foreground">
                    Showing {filteredAttendanceRecords.length} of {attendanceRecords.length} Employees
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-border/80 overflow-hidden shadow-2xs">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="text-xs font-bold pl-4">Employee</TableHead>
                      <TableHead className="text-xs font-bold">Department</TableHead>
                      <TableHead className="text-center text-xs font-bold">Cycle Days</TableHead>
                      <TableHead className="text-center text-xs font-bold">Present</TableHead>
                      <TableHead className="text-center text-xs font-bold">Paid Leave</TableHead>
                      <TableHead className="text-center text-xs font-bold text-rose-600">Loss of Pay (LOP)</TableHead>
                      <TableHead className="text-center text-xs font-bold text-indigo-600">Payable Days</TableHead>
                      <TableHead className="text-center text-xs font-bold">Pro-Rata %</TableHead>
                      <TableHead className="text-center text-xs font-bold">Status</TableHead>
                      <TableHead className="text-center text-xs font-bold pr-4">Hold Salary</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAttendanceRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground text-xs">
                          {attendanceSearch
                            ? `No employee records match "${attendanceSearch}".`
                            : 'No attendance records loaded for this cycle. Click "Sync Biometrics" to fetch punch logs.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAttendanceRecords.map((r) => {
                        const isHeld = isEmpOnHold(r.employeeId);
                        return (
                          <TableRow key={r.id} className={isHeld ? 'bg-amber-500/10 hover:bg-amber-500/15' : 'hover:bg-muted/20'}>
                            <TableCell className="pl-4 py-2.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-xs text-foreground block">{r.name}</span>
                                {isHeld && (
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 bg-amber-100 text-amber-800 border-amber-300 font-bold">
                                    HELD
                                  </Badge>
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground font-mono">{r.employeeCode}</span>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground py-2.5">{r.department}</TableCell>
                            <TableCell className="text-center text-xs font-mono py-2.5">{r.totalCalendarDays}</TableCell>
                            <TableCell className="text-center text-xs font-mono py-2.5 text-emerald-600 font-semibold">
                              {r.presentDays}
                            </TableCell>
                            <TableCell className="text-center text-xs font-mono py-2.5 text-blue-600">
                              {r.paidLeaveDays}
                            </TableCell>
                            <TableCell className="text-center py-2.5">
                              <div className="flex items-center justify-center">
                                <Input
                                  type="number"
                                  min={0}
                                  max={r.totalCalendarDays}
                                  value={r.lopDays}
                                  onChange={(e) => handleLopChange(r.id, Number(e.target.value))}
                                  className="w-14 h-7 text-xs font-mono text-center font-bold bg-background text-rose-600 border-rose-200 focus-visible:ring-rose-400"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-center text-xs font-mono font-bold text-indigo-600 py-2.5">
                              {r.payableDays}
                            </TableCell>
                            <TableCell className="text-center text-xs font-mono py-2.5">
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-mono ${
                                  r.proRataFactor === 1
                                    ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200'
                                    : 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 border-amber-200'
                                }`}
                              >
                                {(r.proRataFactor * 100).toFixed(1)}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center text-xs py-2.5">
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  isHeld
                                    ? 'bg-amber-100 text-amber-800 border-amber-300 font-bold'
                                    : 'border-border text-muted-foreground'
                                }`}
                              >
                                {isHeld ? 'ON HOLD' : 'Active'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center py-2.5 pr-4">
                              <Button
                                size="sm"
                                variant={isHeld ? 'default' : 'outline'}
                                onClick={() => handleToggleHold(r.employeeId)}
                                className={`h-6 text-[10px] px-2 font-semibold cursor-pointer ${
                                  isHeld
                                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                    : 'text-muted-foreground hover:text-amber-700 hover:border-amber-300'
                                }`}
                                title={isHeld ? 'Click to release salary for bank disbursement' : 'Click to hold salary from bank disbursement'}
                              >
                                {isHeld ? (
                                  <>
                                    <PlayCircle className="h-3 w-3 mr-1 inline" /> Release
                                  </>
                                ) : (
                                  <>
                                    <PauseCircle className="h-3 w-3 mr-1 inline" /> Hold
                                  </>
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* ═════════ STEP 2: PRE-RUN CHECKLIST ═════════ */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                  isChecklistReady
                    ? 'border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200'
                    : 'border-rose-200 bg-rose-50/60 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isChecklistReady ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                    }`}
                  >
                    {isChecklistReady ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">
                      {isChecklistReady
                        ? 'All Pre-Run Diagnostics Passed'
                        : `${criticalIssues.length} Critical Issue(s) Require Attention`}
                    </h4>
                    <p className="text-[11px] opacity-90">
                      {isChecklistReady
                        ? 'Master salary structures, bank records, and statutory details are validated for calculation.'
                        : 'Resolve missing salary templates or invalid bank accounts before triggering computation.'}
                    </p>
                  </div>
                </div>

                {onGoToStructure && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onGoToStructure}
                    className="h-7 text-xs font-semibold shrink-0 bg-background"
                  >
                    Open Salary Structures
                  </Button>
                )}
              </div>

              <div className="rounded-xl border border-border/80 overflow-hidden shadow-2xs">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="text-xs font-bold pl-4">Severity</TableHead>
                      <TableHead className="text-xs font-bold">Category</TableHead>
                      <TableHead className="text-xs font-bold">Diagnostic Item</TableHead>
                      <TableHead className="text-center text-xs font-bold">Affected</TableHead>
                      <TableHead className="text-center text-xs font-bold">Status</TableHead>
                      <TableHead className="text-right text-xs font-bold pr-4">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {checklist.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/20">
                        <TableCell className="pl-4 py-3">
                          <Badge
                            variant={item.severity === 'CRITICAL' ? 'destructive' : 'secondary'}
                            className="text-[10px] font-bold"
                          >
                            {item.severity}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-muted-foreground py-3">
                          {item.category}
                        </TableCell>
                        <TableCell className="py-3">
                          <span className="font-semibold text-xs text-foreground block">{item.name}</span>
                          <span className="text-[11px] text-muted-foreground leading-tight block">
                            {item.description}
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-xs font-mono font-semibold py-3">
                          {item.affectedCount} Employees
                        </TableCell>
                        <TableCell className="text-center py-3">
                          {item.isResolved ? (
                            <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300 bg-emerald-50">
                              Resolved
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 bg-amber-50">
                              Action Needed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right py-3 pr-4">
                          {!item.isResolved ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                onResolveCheck(item.id);
                                toast.success(`Resolved diagnostic: ${item.name}`);
                              }}
                              className="h-6 text-[11px] px-2 font-semibold text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                            >
                              Resolve
                            </Button>
                          ) : (
                            <span className="text-xs text-emerald-600 font-medium">✓ Done</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* ═════════ STEP 3: VARIABLE PAY & CLAIMS ═════════ */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Card className="border-border/80 shadow-2xs">
                  <CardContent className="p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Overtime Payout
                    </span>
                    <p className="text-base font-bold text-foreground font-mono mt-0.5">
                      ₹{totalOt.toLocaleString('en-IN')}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border/80 shadow-2xs">
                  <CardContent className="p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Bonuses & Incentives
                    </span>
                    <p className="text-base font-bold text-purple-600 font-mono mt-0.5">
                      ₹{totalBonuses.toLocaleString('en-IN')}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border/80 shadow-2xs">
                  <CardContent className="p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Active Loan EMIs
                    </span>
                    <p className="text-base font-bold text-rose-600 font-mono mt-0.5">
                      ₹{totalEmis.toLocaleString('en-IN')}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Search Variable Records */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="relative w-72">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search employee for bonus, OT, EMI..."
                    value={variableSearch}
                    onChange={(e) => setVariableSearch(e.target.value)}
                    className="pl-8 h-8 text-xs bg-background"
                  />
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Showing {filteredVariableRecords.length} of {variableRecords.length} Staff
                </span>
              </div>

              <div className="rounded-xl border border-border/80 overflow-hidden shadow-2xs">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="text-xs font-bold pl-4">Employee</TableHead>
                      <TableHead className="text-xs font-bold">Department</TableHead>
                      <TableHead className="text-center text-xs font-bold">OT Amount (₹)</TableHead>
                      <TableHead className="text-center text-xs font-bold">Bonus (₹)</TableHead>
                      <TableHead className="text-center text-xs font-bold">Sales Incentive (₹)</TableHead>
                      <TableHead className="text-center text-xs font-bold text-rose-600">Loan EMI (₹)</TableHead>
                      <TableHead className="text-center text-xs font-bold pr-4">Reimbursements (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVariableRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-xs">
                          {variableSearch ? `No staff records match "${variableSearch}".` : 'No variable pay records found.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredVariableRecords.map((r) => (
                        <TableRow key={r.id} className="hover:bg-muted/20">
                          <TableCell className="pl-4 py-2.5">
                            <span className="font-semibold text-xs text-foreground block">{r.name}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{r.employeeCode}</span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground py-2.5">{r.department}</TableCell>
                          <TableCell className="text-center py-2.5">
                            <Input
                              type="number"
                              min={0}
                              value={r.overtimeAmount}
                              onChange={(e) => handleVariableChange(r.id, 'overtimeAmount', Number(e.target.value))}
                              className="w-20 h-7 text-xs font-mono text-center mx-auto bg-background"
                            />
                          </TableCell>
                          <TableCell className="text-center py-2.5">
                            <Input
                              type="number"
                              min={0}
                              value={r.performanceBonus}
                              onChange={(e) => handleVariableChange(r.id, 'performanceBonus', Number(e.target.value))}
                              className="w-20 h-7 text-xs font-mono text-center mx-auto bg-background"
                            />
                          </TableCell>
                          <TableCell className="text-center py-2.5">
                            <Input
                              type="number"
                              min={0}
                              value={r.salesIncentive}
                              onChange={(e) => handleVariableChange(r.id, 'salesIncentive', Number(e.target.value))}
                              className="w-20 h-7 text-xs font-mono text-center mx-auto bg-background"
                            />
                          </TableCell>
                          <TableCell className="text-center py-2.5">
                            <Input
                              type="number"
                              min={0}
                              value={r.loanEmiDeduction}
                              onChange={(e) => handleVariableChange(r.id, 'loanEmiDeduction', Number(e.target.value))}
                              className="w-20 h-7 text-xs font-mono text-center mx-auto text-rose-600 bg-background"
                            />
                          </TableCell>
                          <TableCell className="text-center py-2.5 pr-4">
                            <Input
                              type="number"
                              min={0}
                              value={r.reimbursementPayout}
                              onChange={(e) => handleVariableChange(r.id, 'reimbursementPayout', Number(e.target.value))}
                              className="w-20 h-7 text-xs font-mono text-center mx-auto text-emerald-600 bg-background"
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* ═════════ STEP 4: CALCULATE & REVIEW ═════════ */}
          {currentStep === 4 && (
            <div className="space-y-4">
              {/* Financial KPI Banner */}
              <div className="grid grid-cols-3 gap-3">
                <Card className="border-border/80 shadow-2xs">
                  <CardContent className="p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Gross Wages
                    </span>
                    <p className="text-xl font-bold text-foreground font-mono mt-0.5">
                      ₹{(run.totalGross ?? 0).toLocaleString('en-IN')}
                    </p>
                    <span className="text-[10px] text-muted-foreground">Headcount: {run.headcount} Staff</span>
                  </CardContent>
                </Card>

                <Card className="border-border/80 shadow-2xs">
                  <CardContent className="p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Total Deductions
                    </span>
                    <p className="text-xl font-bold text-rose-600 font-mono mt-0.5">
                      -₹{(run.totalDeductions ?? 0).toLocaleString('en-IN')}
                    </p>
                    <span className="text-[10px] text-rose-600 font-medium">PF, ESIC, PT, TDS</span>
                  </CardContent>
                </Card>

                <Card className={`border-border/80 shadow-2xs ${heldRecords.length > 0 ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200' : 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900'}`}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Disbursement Net
                      </span>
                      {heldRecords.length > 0 && (
                        <Badge variant="outline" className="text-[10px] bg-amber-100 text-amber-800 border-amber-300 font-bold">
                          {heldRecords.length} on Hold
                        </Badge>
                      )}
                    </div>
                    <p className="text-xl font-bold text-emerald-600 font-mono mt-0.5">
                      ₹{(actualDisbursementNet ?? 0).toLocaleString('en-IN')}
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      {heldRecords.length > 0
                        ? `₹${(totalHeldAmount ?? 0).toLocaleString('en-IN')} withheld from bank batch`
                        : 'Ready for Bank Transfer'}
                    </span>
                  </CardContent>
                </Card>
              </div>

              {/* Search & Actions Bar */}
              <div className="flex items-center justify-between gap-3">
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search employee or code..."
                    value={reviewSearch}
                    onChange={(e) => setReviewSearch(e.target.value)}
                    className="pl-8 h-8 text-xs bg-background"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    disabled={isCalculating}
                    onClick={onExecuteCalculation}
                    className="h-8 text-xs font-semibold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-xs"
                  >
                    {isCalculating ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Calculating Wages...
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 fill-current" />
                        {run.status === 'DRAFT' ? 'Confirm & Calculate Salary' : 'Recalculate Salary'}
                      </>
                    )}
                  </Button>

                  {run.status === 'CALCULATED' && onApproveRun && (
                    <Button
                      size="sm"
                      onClick={onApproveRun}
                      className="h-8 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" /> Approve Payroll
                    </Button>
                  )}
                </div>
              </div>

              {/* Employee Wages Review Table */}
              <div className="rounded-xl border border-border/80 overflow-hidden shadow-2xs">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="text-xs font-bold pl-4">Employee</TableHead>
                      <TableHead className="text-xs font-bold">Department</TableHead>
                      <TableHead className="text-center text-xs font-bold">Paid Days</TableHead>
                      <TableHead className="text-right text-xs font-bold">Basic</TableHead>
                      <TableHead className="text-right text-xs font-bold">Gross</TableHead>
                      <TableHead className="text-right text-xs font-bold text-rose-600">Deductions</TableHead>
                      <TableHead className="text-right text-xs font-bold text-emerald-600">Net Pay</TableHead>
                      <TableHead className="text-center text-xs font-bold pr-4">Hold Salary</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReviewRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-xs">
                          {run.status === 'DRAFT'
                            ? 'Run is in DRAFT mode (₹0 wages). Click "Confirm & Calculate Salary" above to calculate employee wages.'
                            : 'No employee review records match your query.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReviewRecords.map((r) => {
                        const isHeld = isEmpOnHold(r.employeeId);
                        return (
                          <TableRow key={r.id} className={isHeld ? 'bg-amber-500/10' : 'hover:bg-muted/20'}>
                            <TableCell className="pl-4 py-2.5">
                              <span className="font-semibold text-xs text-foreground block">{r.name}</span>
                              <span className="text-[10px] text-muted-foreground font-mono">{r.employeeCode}</span>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground py-2.5">{r.department}</TableCell>
                            <TableCell className="text-center text-xs font-mono py-2.5">{r.paidDays}</TableCell>
                            <TableCell className="text-right text-xs font-mono py-2.5">
                              ₹{(r.basicSalary ?? 0).toLocaleString('en-IN')}
                            </TableCell>
                            <TableCell className="text-right text-xs font-mono font-semibold py-2.5">
                              ₹{(r.grossPay ?? (r as any).grossSalary ?? 0).toLocaleString('en-IN')}
                            </TableCell>
                            <TableCell className="text-right text-xs font-mono text-rose-600 py-2.5">
                              -₹{(r.totalDeductions ?? 0).toLocaleString('en-IN')}
                            </TableCell>
                            <TableCell className="text-right text-xs font-mono font-bold text-emerald-600 py-2.5">
                              <div className="flex items-center justify-end gap-1.5">
                                {isHeld && (
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 bg-amber-100 text-amber-800 border-amber-300 font-bold">
                                    HELD
                                  </Badge>
                                )}
                                <span>₹{(r.netPay ?? 0).toLocaleString('en-IN')}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center py-2.5 pr-4">
                              <Button
                                size="sm"
                                variant={isHeld ? 'default' : 'outline'}
                                onClick={() => handleToggleHold(r.employeeId)}
                                className={`h-6 text-[10px] px-2 font-semibold cursor-pointer ${
                                  isHeld
                                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                    : 'text-muted-foreground hover:text-amber-700 hover:border-amber-300'
                                }`}
                                title={isHeld ? 'Click to release salary for bank disbursement' : 'Click to hold salary from bank disbursement'}
                              >
                                {isHeld ? (
                                  <>
                                    <PlayCircle className="h-3 w-3 mr-1 inline" /> Release
                                  </>
                                ) : (
                                  <>
                                    <PauseCircle className="h-3 w-3 mr-1 inline" /> Hold
                                  </>
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        {/* ── MODAL FOOTER WITH PREV / NEXT NAVIGATION ── */}
        <DialogFooter className="px-6 py-3.5 border-t border-border/80 bg-muted/20 shrink-0 flex items-center justify-between sm:justify-between w-full">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs cursor-pointer">
            Close
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentStep === 1}
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              className="text-xs gap-1 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Previous
            </Button>

            {currentStep < 4 ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setCurrentStep((prev) => Math.min(4, prev + 1))}
                className="text-xs font-semibold gap-1 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
              >
                Next Step <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                disabled={isCalculating}
                onClick={onExecuteCalculation}
                className="text-xs font-semibold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
              >
                {isCalculating ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Calculating...
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" />
                    {run.status === 'DRAFT' ? 'Confirm & Calculate Payroll' : 'Recalculate Payroll'}
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
