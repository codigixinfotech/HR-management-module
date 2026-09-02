import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  IndianRupee,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Calculator,
  FileSpreadsheet,
  CreditCard,
  RefreshCw,
  Eye,
  FileCheck,
  Lock,
  Scale,
  Sliders,
} from 'lucide-react';
import type { PfTabType } from './PfSubNav';
import { apiClient } from '@/lib/api-client';

export interface PfDashboardTabProps {
  selectedPeriod: string;
  selectedCompany?: string;
  onNavigateTab: (tab: PfTabType) => void;
}

export function PfDashboardTab({ selectedPeriod, selectedCompany, onNavigateTab }: PfDashboardTabProps) {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);

  const fetchDashboard = async () => {
    setIsRefreshing(true);
    try {
      const res = await apiClient.get('/compliance/pf/dashboard', {
        params: { period: selectedPeriod, companyId: selectedCompany || '' },
      });
      setDashboardData(res.data);
    } catch (e) {
      console.warn('Backend API unavailable, using fallback metrics', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [selectedPeriod, selectedCompany]);

  const handleRefresh = () => {
    fetchDashboard();
  };

  const runMetrics = dashboardData?.run || {};
  const eligibleStaff = runMetrics.eligibleStaffCount !== undefined ? runMetrics.eligibleStaffCount : 11;
  const totalPfWage = runMetrics.totalPfWage !== undefined ? runMetrics.totalPfWage : 164500;
  const totalEePf = runMetrics.totalEePf !== undefined ? runMetrics.totalEePf : 19740;
  const totalErEpf = runMetrics.totalErEpf !== undefined ? runMetrics.totalErEpf : 5980;
  const totalErEps = runMetrics.totalErEps !== undefined ? runMetrics.totalErEps : 13760;
  const totalErPf =
    runMetrics.totalEmployerPf !== undefined
      ? runMetrics.totalEmployerPf
      : totalErEpf + totalErEps;
  const totalEdli = runMetrics.totalEdli !== undefined ? runMetrics.totalEdli : 822.5;
  const totalAdminCharge = runMetrics.totalAdminCharge !== undefined ? runMetrics.totalAdminCharge : 822.5;
  const totalLiability = runMetrics.totalLiability !== undefined ? runMetrics.totalLiability : (totalEePf + totalErPf + totalEdli + totalAdminCharge);

  const monthlyHistory = [
    {
      period: selectedPeriod === '2026-09' ? 'Sep 2026' : selectedPeriod,
      employees: eligibleStaff,
      pfWage: totalPfWage,
      employeePf: totalEePf,
      employerEpf: totalErEpf,
      employerEps: totalErEps,
      edli: Math.round(totalEdli),
      adminCharges: Math.round(totalAdminCharge),
      totalLiability: Math.round(totalLiability),
      ecrStatus: 'Ready for ECR',
      challanStatus: 'Pending',
      paymentStatus: 'Pending',
      reconcileStatus: 'Pending',
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── KPI METRICS CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5">
        <Card className="border-border/80 shadow-2xs bg-card">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">PF Eligible Employees</span>
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-xl font-extrabold text-foreground font-mono">{eligibleStaff}</div>
            <p className="text-[10px] text-muted-foreground font-medium">PF Applicable Employees</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-2xs bg-card">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">PF Wage</span>
              <IndianRupee className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl font-extrabold text-foreground font-mono">₹{totalPfWage.toLocaleString('en-IN')}</div>
            <p className="text-[10px] text-muted-foreground font-medium">Eligible Basic + DA Wage</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-2xs bg-card">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Employee Contribution</span>
              <IndianRupee className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
              ₹{totalEePf.toLocaleString('en-IN')}
            </div>
            <p className="text-[10px] text-muted-foreground font-medium">12% Employee Deduction</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-2xs bg-card">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Employer Contribution</span>
              <IndianRupee className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              ₹{totalErPf.toLocaleString('en-IN')}
            </div>
            <p className="text-[10px] text-muted-foreground font-medium">3.67% EPF + 8.33% EPS</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-2xs bg-card">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Total Liability</span>
              <IndianRupee className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
              ₹{totalLiability.toLocaleString('en-IN')}
            </div>
            <p className="text-[10px] text-muted-foreground font-medium">EE + ER + EDLI + Admin</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/30 bg-emerald-500/5 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-emerald-600">
              <span className="text-[11px] font-bold uppercase tracking-wider">Compliance Status</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              Paid &amp; Reconciled
            </div>
            <p className="text-[10px] text-muted-foreground font-medium">Period: {selectedPeriod}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── 7-STEP MONTHLY PF WORKFLOW PIPELINE ── HIDDEN ── */}
      {false && <Card className="border-border/80 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-purple-600" /> Monthly PF Compliance Workflow Pipeline
              </CardTitle>
              <CardDescription className="text-xs">
                Sequential statutory operational pipeline for {selectedPeriod} payroll run
              </CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={handleRefresh} className="h-8 gap-1.5 text-xs font-semibold">
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh Pipeline
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {/* Step 1: Upstream Payroll Status */}
            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <span>1. Payroll Locked</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-xs font-mono font-extrabold text-foreground mt-1">✓ Ready</p>
                <p className="text-[10.5px] text-muted-foreground mt-0.5">September payroll locked upstream</p>
              </div>
              <Badge variant="outline" className="w-full text-center justify-center bg-emerald-100 text-emerald-800 text-[10px] border-emerald-200">
                Upstream Source
              </Badge>
            </div>

            {/* Step 2: PF Calculation */}
            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <span>2. PF Calculation</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-xs font-mono font-extrabold text-foreground mt-1">✓ Completed</p>
                <p className="text-[10.5px] text-muted-foreground mt-0.5">{eligibleStaff} Employees computed</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onNavigateTab('calculation')}
                className="w-full h-7 text-[11px] font-bold border-emerald-300 text-emerald-800 bg-white hover:bg-emerald-50 cursor-pointer"
              >
                View Calculation
              </Button>
            </div>

            {/* Step 3: PF Validation */}
            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <span>3. PF Validation</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-xs font-mono font-extrabold text-foreground mt-1">✓ Passed</p>
                <p className="text-[10.5px] text-muted-foreground mt-0.5">UAN &amp; limits verified</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onNavigateTab('calculation')}
                className="w-full h-7 text-[11px] font-bold border-emerald-300 text-emerald-800 bg-white hover:bg-emerald-50 cursor-pointer"
              >
                View Validation
              </Button>
            </div>

            {/* Step 4: ECR Preparation */}
            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <span>4. ECR Return</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-xs font-mono font-extrabold text-foreground mt-1">✓ Submitted</p>
                <p className="text-[10.5px] text-muted-foreground mt-0.5">EPFO file generated &amp; saved</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onNavigateTab('ecr')}
                className="w-full h-7 text-[11px] font-bold border-emerald-300 text-emerald-800 bg-white hover:bg-emerald-50 cursor-pointer"
              >
                View ECR Return
              </Button>
            </div>

            {/* Step 5: Challan Generation */}
            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <span>5. Challan</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-xs font-mono font-extrabold text-foreground mt-1">✓ TRRN Issued</p>
                <p className="text-[10.5px] text-muted-foreground mt-0.5">TRRN: 1012409123456</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onNavigateTab('challan')}
                className="w-full h-7 text-[11px] font-bold border-emerald-300 text-emerald-800 bg-white hover:bg-emerald-50 cursor-pointer"
              >
                View Challan
              </Button>
            </div>

            {/* Step 6: Payment */}
            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <span>6. Payment</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-xs font-mono font-extrabold text-foreground mt-1">✓ Paid</p>
                <p className="text-[10.5px] text-muted-foreground mt-0.5">UTR: HDFCN26245123456</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onNavigateTab('challan')}
                className="w-full h-7 text-[11px] font-bold border-emerald-300 text-emerald-800 bg-white hover:bg-emerald-50 cursor-pointer"
              >
                View Payment
              </Button>
            </div>

            {/* Step 7: Reconciliation */}
            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <span>7. Reconciliation</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-xs font-mono font-extrabold text-foreground mt-1">✓ Reconciled</p>
                <p className="text-[10.5px] text-muted-foreground mt-0.5">5-Way matching passed</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onNavigateTab('reconciliation')}
                className="w-full h-7 text-[11px] font-bold border-emerald-300 text-emerald-800 bg-white hover:bg-emerald-50 cursor-pointer"
              >
                View Audit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>}

      {/* ── HISTORICAL PF FILINGS TABLE ── */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Monthly Provident Fund Statement History</CardTitle>
              <CardDescription className="text-xs">
                Historical record of PF wage calculations, statutory breakdown, and operational statuses
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onNavigateTab('calculation')}
                className="h-8 text-xs font-bold gap-1 cursor-pointer"
              >
                <Calculator className="w-3.5 h-3.5 text-purple-600" /> Recalculate Period
              </Button>
              <Button
                size="sm"
                onClick={() => onNavigateTab('employees')}
                className="h-8 text-xs font-bold bg-primary hover:bg-primary/90 text-white gap-1 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" /> View Employees
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground font-semibold uppercase tracking-wider text-[10.5px]">
                <tr>
                  <th className="py-3.5 px-4">Period</th>
                  <th className="py-3.5 px-3 text-right">Eligible Staff</th>
                  <th className="py-3.5 px-3 text-right">PF Wage</th>
                  <th className="py-3.5 px-3 text-right">Employee PF (12%)</th>
                  <th className="py-3.5 px-3 text-right">Employer EPF (3.67%)</th>
                  <th className="py-3.5 px-3 text-right">Employer EPS (8.33%)</th>
                  <th className="py-3.5 px-3 text-right">EDLI (0.5%)</th>
                  <th className="py-3.5 px-3 text-right">Admin Charges</th>
                  <th className="py-3.5 px-3 text-right">Total Liability</th>
                  <th className="py-3.5 px-3 text-center">ECR Status</th>
                  <th className="py-3.5 px-3 text-center">Challan Status</th>
                  <th className="py-3.5 px-3 text-center">Payment Status</th>
                  <th className="py-3.5 px-3 text-center">Reconciliation</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-medium">
                {monthlyHistory.map((row, idx) => (
                  <tr key={idx} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-foreground font-mono">{row.period}</td>
                    <td className="py-3.5 px-3 text-right font-mono font-semibold">{row.employees}</td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-foreground">
                      ₹{row.pfWage.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      ₹{row.employeePf.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      ₹{row.employerEpf.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-semibold text-purple-600 dark:text-purple-400">
                      ₹{row.employerEps.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-slate-600">
                      ₹{row.edli.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-slate-600">
                      ₹{row.adminCharges.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-extrabold text-foreground">
                      ₹{row.totalLiability.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <Badge
                        variant="outline"
                        className={
                          row.ecrStatus === 'Ready for ECR'
                            ? 'bg-purple-500/10 text-purple-600 border-purple-500/30 text-[10px]'
                            : 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 text-[10px]'
                        }
                      >
                        {row.ecrStatus}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <Badge variant="outline" className="text-[10px]">
                        {row.challanStatus}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <Badge
                        variant="outline"
                        className={
                          row.paymentStatus === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800 text-[10px]'
                            : 'bg-amber-50 text-amber-700 text-[10px]'
                        }
                      >
                        {row.paymentStatus}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <Badge
                        variant="outline"
                        className={
                          row.reconcileStatus === 'Reconciled'
                            ? 'bg-blue-100 text-blue-800 text-[10px]'
                            : 'bg-slate-100 text-slate-600 text-[10px]'
                        }
                      >
                        {row.reconcileStatus}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onNavigateTab('calculation')}
                          className="h-7 px-2 text-[11px] font-semibold hover:bg-purple-50 hover:text-purple-600 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> View Details
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onNavigateTab('employees')}
                          className="h-7 px-2 text-[11px] font-semibold hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5 mr-1" /> Employees
                        </Button>
                      </div>
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

export default PfDashboardTab;
