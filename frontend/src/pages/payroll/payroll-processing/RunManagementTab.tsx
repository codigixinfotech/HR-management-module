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
import type { PayrollRunItem, PayrollRunStatus, PayrollRunType } from './types';

interface RunManagementTabProps {
  runs: PayrollRunItem[];
  selectedRun: PayrollRunItem;
  onSelectRun: (run: PayrollRunItem) => void;
  onUpdateRuns: (runs: PayrollRunItem[]) => void;
  onExecuteCalculation: () => void;
  onGoToReview: () => void;
}

const STEPS: Array<{ key: PayrollRunStatus; label: string; desc: string }> = [
  { key: 'DRAFT', label: '1. Draft', desc: 'Pre-run inputs' },
  { key: 'CALCULATED', label: '2. Calculated', desc: 'Wages computed' },
  { key: 'UNDER_REVIEW', label: '3. Under Review', desc: 'Variance & checklist' },
  { key: 'APPROVED', label: '4. Approved', desc: 'Checker sign-off' },
  { key: 'LOCKED', label: '5. Locked', desc: 'Finalized ledger' },
  { key: 'PAID', label: '6. Paid', desc: 'Disbursed / Cleared' },
];

export function RunManagementTab({
  runs,
  selectedRun,
  onSelectRun,
  onUpdateRuns,
  onExecuteCalculation,
  onGoToReview,
}: RunManagementTabProps) {
  const [isNewRunModalOpen, setIsNewRunModalOpen] = useState(false);
  const [isRevertModalOpen, setIsRevertModalOpen] = useState(false);
  const [revertReason, setRevertReason] = useState('');

  // New Run Form
  const [newMonth, setNewMonth] = useState('10');
  const [newYear, setNewYear] = useState('2026');
  const [newRunType, setNewRunType] = useState<PayrollRunType>('REGULAR');
  const [newTitle, setNewTitle] = useState('Regular Monthly Payroll - October 2026');

  const currentStepIndex = STEPS.findIndex((s) => s.key === selectedRun.status);

  const handleCreateRun = () => {
    const monthNum = Number(newMonth);
    const yearNum = Number(newYear);
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
      headcount: 5,
      totalGross: 0,
      totalDeductions: 0,
      totalNet: 0,
      totalEmployerCost: 0,
    };

    onUpdateRuns([newRun, ...runs]);
    onSelectRun(newRun);
    setIsNewRunModalOpen(false);
    toast.success(`Payroll run "${newRun.title}" created in DRAFT state.`);
  };

  const handleAdvanceStatus = (nextStatus: PayrollRunStatus) => {
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
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                Code: {selectedRun.runCode} • Period: {selectedRun.monthName} {selectedRun.year} • Headcount: {selectedRun.headcount} Staff
              </p>
            </div>

            {/* Stepper Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {selectedRun.status === 'DRAFT' && (
                <Button
                  onClick={onExecuteCalculation}
                  className="h-8 text-xs font-semibold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Play className="h-3.5 w-3.5 fill-current" /> Calculate Payroll
                </Button>
              )}

              {selectedRun.status === 'CALCULATED' && (
                <>
                  <Button
                    onClick={onGoToReview}
                    variant="outline"
                    className="h-8 text-xs font-semibold gap-1.5 border-indigo-300 text-indigo-600"
                  >
                    Review Variance
                  </Button>
                  <Button
                    onClick={() => handleAdvanceStatus('UNDER_REVIEW')}
                    className="h-8 text-xs font-semibold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Submit for Approval
                  </Button>
                </>
              )}

              {selectedRun.status === 'UNDER_REVIEW' && (
                <>
                  <Button
                    onClick={() => setIsRevertModalOpen(true)}
                    variant="outline"
                    className="h-8 text-xs font-semibold text-rose-600 border-rose-300 hover:bg-rose-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Revert
                  </Button>
                  <Button
                    onClick={() => handleAdvanceStatus('APPROVED')}
                    className="h-8 text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" /> Maker-Checker Approve
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
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-1">
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

          <Button
            size="sm"
            onClick={() => setIsNewRunModalOpen(true)}
            className="h-8 text-xs font-semibold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="h-3.5 w-3.5" /> Initialize New Run
          </Button>
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
                <TableHead className="text-right text-xs font-bold pr-6">Action</TableHead>
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
                      <div className="text-[10px] text-muted-foreground">{r.monthName} {r.year}</div>
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

                    <TableCell className="text-right pr-6">
                      <Button
                        size="sm"
                        variant={isSelected ? 'default' : 'ghost'}
                        className={`h-7 text-xs ${isSelected ? 'bg-indigo-600 text-white' : 'text-muted-foreground'}`}
                      >
                        {isSelected ? 'Viewing' : 'Select'}
                      </Button>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-600" /> Initialize Payroll Run
            </DialogTitle>
            <DialogDescription className="text-xs">
              Create a new draft run to process regular salary, off-cycle bonuses, or F&F settlement.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Run Title</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Month</Label>
                <Select value={newMonth} onValueChange={setNewMonth}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((m) => (
                      <SelectItem key={m} value={m}>
                        Month {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Year</Label>
                <Input
                  type="number"
                  value={newYear}
                  onChange={(e) => setNewYear(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Run Type</Label>
              <Select value={newRunType} onValueChange={(val: any) => setNewRunType(val)}>
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
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsNewRunModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateRun} className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white">
              Create Run
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
    </div>
  );
}
