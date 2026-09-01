import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  FileCheck,
  Building2,
  CreditCard,
  IndianRupee,
  FileSpreadsheet,
} from 'lucide-react';
import type { PfTabType } from './PfSubNav';

export interface PfReconciliationTabProps {
  selectedPeriod: string;
  onNavigateTab: (tab: PfTabType) => void;
}

export function PfReconciliationTab({ selectedPeriod, onNavigateTab }: PfReconciliationTabProps) {
  const [isReconciling, setIsReconciling] = useState(false);
  const [isReconciled, setIsReconciled] = useState(true);

  const handleRunReconciliation = () => {
    setIsReconciling(true);
    setTimeout(() => {
      setIsReconciling(false);
      setIsReconciled(true);
    }, 600);
  };

  const reconciliationData = {
    payrollLiability: 460800,
    pfCalculation: 460800,
    ecrAmount: 460800,
    challanAmount: 460800,
    actualPayment: 460800,
    variance: 0,
  };

  const reconciliationHistory = [
    { period: 'Sep 2026', payroll: 460800, calculation: 460800, ecr: 460800, challan: 460800, payment: 460800, variance: 0, status: 'RECONCILED' },
    { period: 'Aug 2026', payroll: 450000, calculation: 450000, ecr: 450000, challan: 450000, payment: 450000, variance: 0, status: 'RECONCILED' },
    { period: 'Jul 2026', payroll: 439200, calculation: 439200, ecr: 439200, challan: 439200, payment: 439200, variance: 0, status: 'RECONCILED' },
    { period: 'Jun 2026', payroll: 432000, calculation: 432000, ecr: 432000, challan: 432000, payment: 432000, variance: 0, status: 'RECONCILED' },
  ];

  return (
    <div className="space-y-6">
      {/* ── TOP CONTROL BAR ── */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Scale className="w-5 h-5 text-indigo-600" /> PF 5-Way Compliance Reconciliation Engine
              </CardTitle>
              <CardDescription className="text-xs">
                Audit & compare Payroll Liability ↔ PF Calculation ↔ ECR Return ↔ Official TRRN Challan ↔ Actual Bank Payment UTR
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onNavigateTab('reports')}
                className="h-8 text-xs font-bold gap-1 cursor-pointer"
              >
                PF Reports →
              </Button>

              <Button
                size="sm"
                onClick={handleRunReconciliation}
                disabled={isReconciling}
                className="h-8 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 cursor-pointer shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isReconciling ? 'animate-spin' : ''}`} />
                {isReconciling ? 'Reconciling Accounts...' : 'Run 5-Way Audit'}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* 5-Way Comparison Stepper Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-1">
              <span className="text-[10.5px] font-semibold text-muted-foreground uppercase">1. Payroll PF Liability</span>
              <div className="font-mono font-extrabold text-sm text-foreground">
                ₹{reconciliationData.payrollLiability.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold block">✓ Locked Payroll</span>
            </div>

            <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-1">
              <span className="text-[10.5px] font-semibold text-muted-foreground uppercase">2. PF Calculation</span>
              <div className="font-mono font-extrabold text-sm text-purple-600 dark:text-purple-400">
                ₹{reconciliationData.pfCalculation.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-purple-600 font-semibold block">✓ Rules Applied</span>
            </div>

            <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-1">
              <span className="text-[10.5px] font-semibold text-muted-foreground uppercase">3. ECR Return (ECR-2026-09-001)</span>
              <div className="font-mono font-extrabold text-sm text-foreground">
                ₹{reconciliationData.ecrAmount.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-blue-600 font-semibold block">✓ EPFO Text Verified</span>
            </div>

            <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-1">
              <span className="text-[10.5px] font-semibold text-muted-foreground uppercase">4. Official TRRN Challan</span>
              <div className="font-mono font-extrabold text-sm text-foreground">
                ₹{reconciliationData.challanAmount.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-amber-600 font-semibold block">✓ TRRN: 1012409123456</span>
            </div>

            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-1">
              <span className="text-[10.5px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">5. Actual Bank Payment</span>
              <div className="font-mono font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                ₹{reconciliationData.actualPayment.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-emerald-600 font-extrabold block">✓ UTR: HDFCN26245123456</span>
            </div>
          </div>

          {/* Reconciliation Status Highlight Box */}
          <div className="p-5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-md">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-emerald-900 dark:text-emerald-200">100% Reconciled Across All 5 Registers</h3>
                  <Badge className="bg-emerald-600 text-white font-extrabold text-xs">✓ Zero Variance</Badge>
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5 font-medium">
                  Payroll Liability (₹4,60,800) = PF Calc (₹4,60,800) = ECR (₹4,60,800) = TRRN Challan (₹4,60,800) = Bank UTR (₹4,60,800)
                </p>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => onNavigateTab('reports')}
              className="h-9 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer shadow-md shrink-0"
            >
              Generate Compliance Audit Reports <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── HISTORICAL RECONCILIATION AUDIT REGISTER ── */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/60">
          <CardTitle className="text-base font-bold">5-Way Reconciliation Audit Register</CardTitle>
          <CardDescription className="text-xs">
            Historical record of period audits, register balances, and variance flags
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground font-semibold uppercase tracking-wider text-[10.5px]">
                <tr>
                  <th className="py-3.5 px-4">Period</th>
                  <th className="py-3.5 px-4 text-right">1. Payroll GL</th>
                  <th className="py-3.5 px-4 text-right">2. PF Calc Engine</th>
                  <th className="py-3.5 px-4 text-right">3. ECR Return</th>
                  <th className="py-3.5 px-4 text-right">4. TRRN Challan</th>
                  <th className="py-3.5 px-4 text-right">5. Bank Payment</th>
                  <th className="py-3.5 px-4 text-right">Variance</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-medium">
                {reconciliationHistory.map((row, idx) => (
                  <tr key={idx} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-foreground font-mono">{row.period}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold">₹{row.payroll.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-purple-600 dark:text-purple-400">₹{row.calculation.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold">₹{row.ecr.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-amber-600 dark:text-amber-400">₹{row.challan.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">₹{row.payment.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-extrabold text-foreground">₹{row.variance}</td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-bold text-[10.5px]">
                        ✓ Reconciled
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
