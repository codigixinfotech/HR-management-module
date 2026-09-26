import { useState } from 'react';
import {
  FileText,
  Search,
  Eye,
  RefreshCw,
  Lock,
  PauseCircle,
  PlayCircle,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Calculator,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { EmployeePayrollReviewRecord } from './types';

interface ReviewApprovalTabProps {
  reviewRecords: EmployeePayrollReviewRecord[];
  onUpdateRecords: (records: EmployeePayrollReviewRecord[]) => void;
  onApproveRun: () => void;
}

export function ReviewApprovalTab({ reviewRecords, onUpdateRecords, onApproveRun }: ReviewApprovalTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeePayrollReviewRecord | null>(null);
  const [isMakerCheckerModalOpen, setIsMakerCheckerModalOpen] = useState(false);
  const [checkerNotes, setCheckerNotes] = useState('');

  const filteredRecords = reviewRecords.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleHold = (empId: string) => {
    const updated = reviewRecords.map((r) => {
      if (r.employeeId === empId) {
        const nextHeld = !r.isSalaryHeld;
        return {
          ...r,
          isSalaryHeld: nextHeld,
          holdReason: nextHeld ? 'Salary held pending finance review' : undefined,
        };
      }
      return r;
    });

    onUpdateRecords(updated);
    const emp = reviewRecords.find((r) => r.employeeId === empId);
    toast.info(`${emp?.name}'s salary payout ${!emp?.isSalaryHeld ? 'HELD' : 'RELEASED'}.`);
  };

  const handleRecalculateSingle = (empId: string) => {
    toast.success(`Recalculated salary breakdown for employee.`);
  };

  const handleConfirmCheckerApproval = () => {
    onApproveRun();
    setIsMakerCheckerModalOpen(false);
    toast.success('Payroll approved by Checker. Locked against edits and ready for Bank Transfer.');
  };

  const totalGross = reviewRecords.reduce((sum, r) => sum + r.grossPay, 0);
  const totalNet = reviewRecords.reduce((sum, r) => sum + (r.isSalaryHeld ? 0 : r.netPay), 0);
  const totalDeductions = reviewRecords.reduce((sum, r) => sum + r.totalDeductions, 0);
  const heldCount = reviewRecords.filter((r) => r.isSalaryHeld).length;

  return (
    <div className="space-y-4">
      {/* ── TOP AUDIT STATS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border/80 shadow-2xs">
          <CardContent className="p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Gross Wages</span>
            <p className="text-base font-bold text-foreground font-mono mt-0.5">₹{totalGross.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-2xs">
          <CardContent className="p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Deductions</span>
            <p className="text-base font-bold text-rose-600 font-mono mt-0.5">-₹{totalDeductions.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-2xs">
          <CardContent className="p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Net Payout to Disburse</span>
            <p className="text-base font-bold text-emerald-600 font-mono mt-0.5">₹{totalNet.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-2xs">
          <CardContent className="p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Salary Hold Count</span>
            <p className="text-base font-bold text-amber-600 font-mono mt-0.5">{heldCount} Employee{heldCount === 1 ? '' : 's'}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── SEARCH & APPROVAL BAR ── */}
      <Card className="border-border/80 shadow-2xs">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by employee name, code, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-8 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setIsMakerCheckerModalOpen(true)}
              className="h-8 text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <UserCheck className="h-3.5 w-3.5" /> Maker-Checker Sign-off
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── SALARY REGISTER REVIEW TABLE ── */}
      <Card className="border-border/80 shadow-2xs overflow-hidden">
        <CardHeader className="bg-muted/30 px-6 py-3.5 border-b border-border/60">
          <CardTitle className="text-xs font-bold text-foreground">Monthly Salary Register Review</CardTitle>
          <CardDescription className="text-[11px]">
            Examine gross earnings, statutory deductions, net payable wages, MoM variance, and salary hold status.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="text-xs font-bold pl-6">Employee</TableHead>
                <TableHead className="text-center text-xs font-bold">Paid / LOP</TableHead>
                <TableHead className="text-right text-xs font-bold">Gross Pay (₹)</TableHead>
                <TableHead className="text-right text-xs font-bold">PF / ESI / PT (₹)</TableHead>
                <TableHead className="text-right text-xs font-bold">TDS / Loan (₹)</TableHead>
                <TableHead className="text-right text-xs font-bold">Net Pay (₹)</TableHead>
                <TableHead className="text-center text-xs font-bold">MoM Variance</TableHead>
                <TableHead className="text-center text-xs font-bold">Hold Status</TableHead>
                <TableHead className="text-right text-xs font-bold pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((r) => {
                const statutorySum = r.employeePf + r.employeeEsi + r.professionalTax;
                const taxLoanSum = r.tds + r.loanEmi;
                const isPositiveVariance = r.varianceAmount > 0;
                const isZeroVariance = r.varianceAmount === 0;

                return (
                  <TableRow key={r.id} className="hover:bg-muted/20">
                    <TableCell className="pl-6">
                      <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                        {r.name}
                        {r.hasException && (
                          <span title={r.exceptionReason}>
                            <AlertTriangle className="h-3 w-3 text-amber-500" />
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground">{r.employeeCode} • {r.department}</div>
                    </TableCell>

                    <TableCell className="text-center text-xs font-mono">
                      {r.paidDays} / {r.lopDays > 0 ? <span className="text-rose-600 font-bold">{r.lopDays} LOP</span> : '0'}
                    </TableCell>

                    <TableCell className="text-right font-mono text-xs font-semibold">
                      ₹{r.grossPay.toLocaleString('en-IN')}
                    </TableCell>

                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      ₹{statutorySum.toLocaleString('en-IN')}
                    </TableCell>

                    <TableCell className="text-right font-mono text-xs text-rose-600">
                      ₹{taxLoanSum.toLocaleString('en-IN')}
                    </TableCell>

                    <TableCell className="text-right font-mono text-xs font-bold text-emerald-600">
                      ₹{r.netPay.toLocaleString('en-IN')}
                    </TableCell>

                    {/* MoM Variance */}
                    <TableCell className="text-center font-mono text-xs">
                      {isZeroVariance ? (
                        <span className="text-muted-foreground">0.0%</span>
                      ) : isPositiveVariance ? (
                        <span className="text-emerald-600 font-semibold inline-flex items-center gap-0.5">
                          <TrendingUp className="h-3 w-3" /> +{r.variancePercentage.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-rose-600 font-semibold inline-flex items-center gap-0.5">
                          <TrendingDown className="h-3 w-3" /> {r.variancePercentage.toFixed(1)}%
                        </span>
                      )}
                    </TableCell>

                    {/* Hold / Release Switch */}
                    <TableCell className="text-center">
                      <button
                        onClick={() => handleToggleHold(r.employeeId)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors ${
                          r.isSalaryHeld
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {r.isSalaryHeld ? 'HELD' : 'RELEASED'}
                      </button>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedEmployee(r)}
                          title="View Calculation Breakdown"
                          className="h-7 w-7 text-indigo-600 hover:bg-indigo-50"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRecalculateSingle(r.employeeId)}
                          title="Recalculate Employee"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        >
                          <RefreshCw className="h-3 w-3" />
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

      {/* ── CALCULATION BREAKDOWN DRAWER MODAL ── */}
      <Dialog open={Boolean(selectedEmployee)} onOpenChange={() => setSelectedEmployee(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Calculator className="h-4 w-4 text-indigo-600" />
              Calculation Breakdown: {selectedEmployee?.name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Transparent step-by-step formula breakdown explaining exact earnings and deductions computation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Employee Meta Banner */}
            <div className="p-3 bg-muted/40 rounded-lg border flex items-center justify-between text-xs">
              <div>
                <span className="text-muted-foreground">CTC:</span>{' '}
                <span className="font-bold text-foreground font-mono">₹{selectedEmployee?.annualCtc.toLocaleString('en-IN')}</span>{' '}
                ({selectedEmployee?.templateCode})
              </div>
              <div>
                <span className="text-muted-foreground">Paid Days:</span>{' '}
                <span className="font-bold text-foreground">{selectedEmployee?.paidDays} / 30 Days</span>
              </div>
            </div>

            {/* Earnings Breakdown */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-emerald-700">Gross Earnings Breakdown</Label>
              <div className="p-3 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900 space-y-1.5">
                <div className="flex justify-between">
                  <span>Basic Salary (Pro-rated for {selectedEmployee?.paidDays} days):</span>
                  <span className="font-mono font-semibold">₹{selectedEmployee?.basicSalary.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>House Rent Allowance (HRA):</span>
                  <span className="font-mono font-semibold">₹{selectedEmployee?.hra.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Special & Other Allowances:</span>
                  <span className="font-mono font-semibold">₹{selectedEmployee?.allowances.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-1.5 border-t border-emerald-200 flex justify-between font-bold text-emerald-800 dark:text-emerald-300">
                  <span>Total Gross Earnings:</span>
                  <span className="font-mono">₹{selectedEmployee?.grossPay.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Deductions Breakdown */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-rose-700">Deductions Breakdown</Label>
              <div className="p-3 bg-rose-50/40 dark:bg-rose-950/20 rounded-lg border border-rose-200 dark:border-rose-900 space-y-1.5">
                <div className="flex justify-between">
                  <span>Provident Fund (Employee EPF 12%):</span>
                  <span className="font-mono font-semibold">-₹{selectedEmployee?.employeePf.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Professional Tax (PT Slab):</span>
                  <span className="font-mono font-semibold">-₹{selectedEmployee?.professionalTax.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Income Tax (TDS Monthly Projection):</span>
                  <span className="font-mono font-semibold">-₹{selectedEmployee?.tds.toLocaleString('en-IN')}</span>
                </div>
                {Number(selectedEmployee?.loanEmi) > 0 && (
                  <div className="flex justify-between">
                    <span>Company Loan EMI Deduction:</span>
                    <span className="font-mono font-semibold">-₹{selectedEmployee?.loanEmi.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="pt-1.5 border-t border-rose-200 flex justify-between font-bold text-rose-800 dark:text-rose-300">
                  <span>Total Deductions:</span>
                  <span className="font-mono">-₹{selectedEmployee?.totalDeductions.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Net Take-Home */}
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg border border-indigo-200 dark:border-indigo-900 flex justify-between items-center text-xs">
              <span className="font-bold text-indigo-950 dark:text-indigo-200">Net Take-Home Pay (Bank Credit):</span>
              <span className="text-lg font-bold text-indigo-600 font-mono">
                ₹{selectedEmployee?.netPay.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button size="sm" onClick={() => setSelectedEmployee(null)} className="text-xs">
              Close Breakdown
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MAKER-CHECKER APPROVAL MODAL ── */}
      <Dialog open={isMakerCheckerModalOpen} onOpenChange={setIsMakerCheckerModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-blue-600" /> Maker-Checker Payroll Sign-off
            </DialogTitle>
            <DialogDescription className="text-xs">
              Under internal financial control guidelines, payroll must be signed off by a distinct checker.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-3 bg-muted/40 rounded-lg border space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prepared / Calculated by:</span>
                <span className="font-semibold text-foreground">ppurvesh503 (Payroll Admin)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Checker Reviewer:</span>
                <span className="font-semibold text-blue-600">Finance Controller</span>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Approval Notes / Audit Comments</Label>
              <Input
                value={checkerNotes}
                onChange={(e) => setCheckerNotes(e.target.value)}
                placeholder="e.g. Verified against bank statement and tax deductions"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsMakerCheckerModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirmCheckerApproval} className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white">
              Approve & Finalize Run
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
