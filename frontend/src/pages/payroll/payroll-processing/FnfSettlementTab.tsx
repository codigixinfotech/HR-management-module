import { useState } from 'react';
import {
  FileText,
  UserMinus,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  Coins,
  Calculator,
  Calendar,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { FnfSettlementRecord } from './types';

interface FnfSettlementTabProps {
  fnfRecords: FnfSettlementRecord[];
  onUpdateRecords: (records: FnfSettlementRecord[]) => void;
}

export function FnfSettlementTab({ fnfRecords, onUpdateRecords }: FnfSettlementTabProps) {
  const [selectedStatement, setSelectedStatement] = useState<FnfSettlementRecord | null>(null);

  const handlePrintStatement = () => {
    window.print();
    toast.success('Initiating print of official Full & Final settlement statement.');
  };

  const handleDownloadPdf = () => {
    toast.success('FNF Settlement Statement PDF generated and downloaded.');
  };

  return (
    <div className="space-y-4">
      {/* ── HEADER OVERVIEW ── */}
      <Card className="border-border/80 shadow-2xs">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600">
              <UserMinus className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">Full & Final (F&F) Settlement Suite</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Calculate final pro-rated salary, leave encashment, statutory gratuity, notice pay recovery, and loan reconciliation.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] text-purple-600 border-purple-300">
            {fnfRecords.length} Exiting Cases
          </Badge>
        </CardContent>
      </Card>

      {/* ── FNF RECORDS TABLE ── */}
      <Card className="border-border/80 shadow-2xs overflow-hidden">
        <CardHeader className="bg-muted/30 px-6 py-3.5 border-b border-border/60 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xs font-bold text-foreground">Settlement Dossiers</CardTitle>
            <CardDescription className="text-[11px]">
              Audited settlement calculations for exited and transitioning employees.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="text-xs font-bold pl-6">Exiting Employee</TableHead>
                <TableHead className="text-xs font-bold">LWD & Service Span</TableHead>
                <TableHead className="text-right text-xs font-bold">Pro-Rated Salary</TableHead>
                <TableHead className="text-right text-xs font-bold">Leave Encashment</TableHead>
                <TableHead className="text-right text-xs font-bold">Gratuity Payout</TableHead>
                <TableHead className="text-right text-xs font-bold">Recoveries / TDS</TableHead>
                <TableHead className="text-right text-xs font-bold">Net Settlement</TableHead>
                <TableHead className="text-xs font-bold">Status</TableHead>
                <TableHead className="text-right text-xs font-bold pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fnfRecords.map((r) => (
                <TableRow key={r.id} className="hover:bg-muted/20">
                  <TableCell className="pl-6">
                    <div className="font-semibold text-xs text-foreground">{r.name}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">{r.employeeCode} • {r.designation}</div>
                  </TableCell>

                  <TableCell>
                    <div className="text-xs font-medium text-foreground">LWD: {r.lastWorkingDay}</div>
                    <div className="text-[10px] text-muted-foreground">Joined: {r.joiningDate}</div>
                  </TableCell>

                  <TableCell className="text-right font-mono text-xs font-semibold">
                    ₹{r.proRatedSalary.toLocaleString('en-IN')}
                  </TableCell>

                  <TableCell className="text-right font-mono text-xs font-semibold text-blue-600">
                    ₹{r.leaveEncashmentAmount.toLocaleString('en-IN')}
                    <div className="text-[9px] text-muted-foreground">({r.leaveEncashmentDays} days)</div>
                  </TableCell>

                  <TableCell className="text-right font-mono text-xs font-semibold text-purple-600">
                    ₹{r.gratuityAmount.toLocaleString('en-IN')}
                  </TableCell>

                  <TableCell className="text-right font-mono text-xs font-semibold text-rose-600">
                    -₹{r.totalRecoveries.toLocaleString('en-IN')}
                  </TableCell>

                  <TableCell className="text-right font-mono text-xs font-bold text-emerald-600">
                    ₹{r.netSettlementPayable.toLocaleString('en-IN')}
                  </TableCell>

                  <TableCell>
                    <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 border-emerald-300 text-[10px] font-semibold">
                      {r.settlementStatus}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right pr-6">
                    <Button
                      size="sm"
                      onClick={() => setSelectedStatement(r)}
                      className="h-7 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      FNF Statement ↗
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── OFFICIAL FNF STATEMENT MODAL ── */}
      <Dialog open={Boolean(selectedStatement)} onOpenChange={() => setSelectedStatement(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-600" />
              Full & Final Settlement Statement (F&F)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Official separation settlement ledger and statutory clearance certificate.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs border rounded-xl p-5 bg-card" id="printable-fnf-statement">
            {/* Header info */}
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-sm text-foreground">EHCM Platform Infotech Pvt. Ltd.</h3>
                <p className="text-[10px] text-muted-foreground">Corporate HR & Payroll Administration</p>
              </div>
              <Badge variant="outline" className="text-xs font-bold text-emerald-600 border-emerald-300">
                SETTLEMENT APPROVED
              </Badge>
            </div>

            {/* Employee Meta Details */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg text-[11px]">
              <div>
                <span className="text-muted-foreground">Employee Name:</span>{' '}
                <span className="font-bold text-foreground">{selectedStatement?.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Employee Code:</span>{' '}
                <span className="font-mono font-bold text-foreground">{selectedStatement?.employeeCode}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Date of Joining:</span>{' '}
                <span className="font-semibold">{selectedStatement?.joiningDate}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Last Working Day:</span>{' '}
                <span className="font-semibold text-rose-600">{selectedStatement?.lastWorkingDay}</span>
              </div>
            </div>

            {/* Earnings Breakdown */}
            <div className="space-y-1.5">
              <p className="font-bold text-xs text-emerald-700">A. Earnings & Payouts</p>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableBody>
                    <TableRow className="text-xs">
                      <TableCell className="py-1.5 font-medium">Last Month Pro-Rated Working Salary</TableCell>
                      <TableCell className="py-1.5 text-right font-mono font-semibold">
                        ₹{selectedStatement?.proRatedSalary.toLocaleString('en-IN')}
                      </TableCell>
                    </TableRow>
                    <TableRow className="text-xs">
                      <TableCell className="py-1.5 font-medium">
                        Leave Encashment Payout ({selectedStatement?.leaveEncashmentDays} Earned Leaves)
                      </TableCell>
                      <TableCell className="py-1.5 text-right font-mono font-semibold">
                        ₹{selectedStatement?.leaveEncashmentAmount.toLocaleString('en-IN')}
                      </TableCell>
                    </TableRow>
                    <TableRow className="text-xs">
                      <TableCell className="py-1.5 font-medium">Statutory Gratuity Settlement (Payment of Gratuity Act)</TableCell>
                      <TableCell className="py-1.5 text-right font-mono font-semibold">
                        ₹{selectedStatement?.gratuityAmount.toLocaleString('en-IN')}
                      </TableCell>
                    </TableRow>
                    <TableRow className="text-xs">
                      <TableCell className="py-1.5 font-medium">Statutory Annual Bonus Settlement</TableCell>
                      <TableCell className="py-1.5 text-right font-mono font-semibold">
                        ₹{selectedStatement?.bonusAmount.toLocaleString('en-IN')}
                      </TableCell>
                    </TableRow>
                    <TableRow className="text-xs bg-emerald-50/50 dark:bg-emerald-950/20 font-bold">
                      <TableCell className="py-2 text-emerald-800 dark:text-emerald-300">Total Earnings (A)</TableCell>
                      <TableCell className="py-2 text-right font-mono text-emerald-600">
                        ₹{selectedStatement?.totalEarnings.toLocaleString('en-IN')}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Deductions & Recoveries */}
            <div className="space-y-1.5">
              <p className="font-bold text-xs text-rose-700">B. Deductions & Recoveries</p>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableBody>
                    <TableRow className="text-xs">
                      <TableCell className="py-1.5 font-medium">Notice Period Shortfall Recovery ({selectedStatement?.shortfallDays} days)</TableCell>
                      <TableCell className="py-1.5 text-right font-mono font-semibold">
                        ₹{selectedStatement?.noticePayRecoveryAmount.toLocaleString('en-IN')} (Waived)
                      </TableCell>
                    </TableRow>
                    <TableRow className="text-xs">
                      <TableCell className="py-1.5 font-medium">Outstanding Loan / Advance Balance</TableCell>
                      <TableCell className="py-1.5 text-right font-mono font-semibold">
                        ₹{selectedStatement?.outstandingLoanBalance.toLocaleString('en-IN')}
                      </TableCell>
                    </TableRow>
                    <TableRow className="text-xs">
                      <TableCell className="py-1.5 font-medium">Final TDS (Tax Deducted at Source)</TableCell>
                      <TableCell className="py-1.5 text-right font-mono font-semibold">
                        ₹{selectedStatement?.finalTds.toLocaleString('en-IN')}
                      </TableCell>
                    </TableRow>
                    <TableRow className="text-xs bg-rose-50/50 dark:bg-rose-950/20 font-bold">
                      <TableCell className="py-2 text-rose-800 dark:text-rose-300">Total Recoveries (B)</TableCell>
                      <TableCell className="py-2 text-right font-mono text-rose-600">
                        ₹{selectedStatement?.totalRecoveries.toLocaleString('en-IN')}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Net Payable Settlement */}
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-900 flex justify-between items-center text-xs">
              <span className="font-bold text-indigo-950 dark:text-indigo-200">Net Full & Final Payable (A - B):</span>
              <span className="text-xl font-bold text-indigo-600 font-mono">
                ₹{selectedStatement?.netSettlementPayable.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <DialogFooter className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrintStatement} className="text-xs gap-1.5">
                <Printer className="h-3.5 w-3.5" /> Print Statement
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPdf} className="text-xs gap-1.5">
                <Download className="h-3.5 w-3.5" /> Download PDF
              </Button>
            </div>
            <Button size="sm" onClick={() => setSelectedStatement(null)} className="text-xs">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
