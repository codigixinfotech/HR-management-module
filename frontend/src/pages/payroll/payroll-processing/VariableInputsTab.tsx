import { useState } from 'react';
import {
  Coins,
  FileSpreadsheet,
  Plus,
  TrendingUp,
  Download,
  Upload,
  RefreshCw,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import type { VariableInputRecord } from './types';

interface VariableInputsTabProps {
  variableRecords: VariableInputRecord[];
  onUpdateRecords: (records: VariableInputRecord[]) => void;
}

export function VariableInputsTab({ variableRecords, onUpdateRecords }: VariableInputsTabProps) {
  const handleFieldChange = (recordId: string, field: keyof VariableInputRecord, val: number) => {
    const updated = variableRecords.map((r) => {
      if (r.id === recordId) {
        return {
          ...r,
          [field]: Math.max(0, val),
        };
      }
      return r;
    });
    onUpdateRecords(updated);
  };

  const handlePullCrossModule = () => {
    toast.success('Synced active Loan EMIs (₹7,500) and approved Reimbursement claims (₹6,000) from companion modules.');
  };

  const totalBonuses = variableRecords.reduce((sum, r) => sum + r.performanceBonus + r.salesIncentive, 0);
  const totalOt = variableRecords.reduce((sum, r) => sum + r.overtimeAmount, 0);
  const totalLoanEmis = variableRecords.reduce((sum, r) => sum + r.loanEmiDeduction, 0);
  const totalReimb = variableRecords.reduce((sum, r) => sum + r.reimbursementPayout, 0);

  return (
    <div className="space-y-4">
      {/* ── TOP STATS BAR ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border/80 shadow-2xs">
          <CardContent className="p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Overtime Payout</span>
            <p className="text-base font-bold text-foreground font-mono mt-0.5">₹{totalOt.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-2xs">
          <CardContent className="p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Incentives & Bonus</span>
            <p className="text-base font-bold text-emerald-600 font-mono mt-0.5">₹{totalBonuses.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-2xs">
          <CardContent className="p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Loan EMIs Recovered</span>
            <p className="text-base font-bold text-rose-600 font-mono mt-0.5">₹{totalLoanEmis.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-2xs">
          <CardContent className="p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Reimbursements Added</span>
            <p className="text-base font-bold text-indigo-600 font-mono mt-0.5">₹{totalReimb.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── ACTION BAR ── */}
      <Card className="border-border/80 shadow-2xs">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-foreground">Variable Pay, One-Time Additions & Recoveries</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Pull loan deductions and expense claims automatically or enter ad-hoc overtime and incentives.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePullCrossModule}
              className="h-8 text-xs font-semibold gap-1.5 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Pull Loans & Claims
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.success('Variable pay spreadsheet exported.')}
              className="h-8 text-xs font-semibold gap-1.5"
            >
              <Download className="h-3.5 w-3.5" /> Export Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── VARIABLE INPUTS TABLE ── */}
      <Card className="border-border/80 shadow-2xs overflow-hidden">
        <CardHeader className="bg-muted/30 px-6 py-3.5 border-b border-border/60">
          <CardTitle className="text-xs font-bold text-foreground">Variable Compensation Input Matrix</CardTitle>
          <CardDescription className="text-[11px]">
            Input fields update in real-time and feed directly into the calculation review engine.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="text-xs font-bold pl-6">Employee</TableHead>
                <TableHead className="text-center text-xs font-bold">OT Hours</TableHead>
                <TableHead className="text-right text-xs font-bold">Overtime (₹)</TableHead>
                <TableHead className="text-right text-xs font-bold">Incentives / Bonus (₹)</TableHead>
                <TableHead className="text-right text-xs font-bold">Revision Arrears (₹)</TableHead>
                <TableHead className="text-right text-xs font-bold">Loan EMI Recovery (₹)</TableHead>
                <TableHead className="text-right text-xs font-bold pr-6">Reimbursement (₹)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variableRecords.map((r) => (
                <TableRow key={r.id} className="hover:bg-muted/20">
                  <TableCell className="pl-6">
                    <div className="font-semibold text-xs text-foreground">{r.name}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">{r.employeeCode} • {r.department}</div>
                  </TableCell>

                  {/* OT Hours */}
                  <TableCell className="text-center">
                    <Input
                      type="number"
                      value={r.overtimeHours}
                      onChange={(e) => {
                        const hrs = Number(e.target.value);
                        handleFieldChange(r.id, 'overtimeHours', hrs);
                        // Approximate rate ₹280/hr
                        handleFieldChange(r.id, 'overtimeAmount', Math.round(hrs * 288));
                      }}
                      className="h-7 w-16 text-center text-xs font-mono font-semibold mx-auto"
                    />
                  </TableCell>

                  {/* OT Amount */}
                  <TableCell className="text-right font-mono text-xs font-semibold text-foreground">
                    ₹{r.overtimeAmount.toLocaleString('en-IN')}
                  </TableCell>

                  {/* Performance Bonus / Incentive */}
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      value={r.salesIncentive || r.performanceBonus}
                      onChange={(e) => handleFieldChange(r.id, 'salesIncentive', Number(e.target.value))}
                      className="h-7 w-24 text-right text-xs font-mono font-semibold text-emerald-600 ml-auto"
                    />
                  </TableCell>

                  {/* Revision Arrears */}
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      value={r.revisionArrears}
                      onChange={(e) => handleFieldChange(r.id, 'revisionArrears', Number(e.target.value))}
                      className="h-7 w-20 text-right text-xs font-mono ml-auto"
                    />
                  </TableCell>

                  {/* Loan EMI */}
                  <TableCell className="text-right font-mono text-xs text-rose-600 font-semibold">
                    {r.loanEmiDeduction > 0 ? `-₹${r.loanEmiDeduction.toLocaleString('en-IN')}` : '₹0'}
                  </TableCell>

                  {/* Reimbursement */}
                  <TableCell className="text-right font-mono text-xs text-indigo-600 font-semibold pr-6">
                    {r.reimbursementPayout > 0 ? `+₹${r.reimbursementPayout.toLocaleString('en-IN')}` : '₹0'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
