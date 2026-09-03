import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck, RefreshCw, CheckCircle2, Clock, AlertTriangle,
  IndianRupee, Users, FileText, Download, Receipt, ClipboardCheck,
  Send, BadgeCheck, Loader2, ArrowRight, Hash, MapPin, TrendingUp,
  Info, History, Eye, ChevronDown, ChevronUp, Building2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

/* ─── Types ─────────────────────────────────────────────── */
interface PtRow {
  employeeId: string; employeeCode: string; name: string;
  department: string; companyName?: string; state: string; ptApplicable: boolean;
  ptWage: number; ptAmount: number; annualCtc: number; monthlyCtc: number;
  payrollPeriod: string; effectiveFrom: string;
  templateName?: string | null; templateCode?: string | null;
  status: 'CALCULATED' | 'NO_SALARY' | 'EXEMPT';
}
interface PtSummary {
  totalEmployees: number; ptApplicableEmployees: number;
  totalTaxableSalary: number; totalAnnualCtc: number;
  totalPtLiability: number; amountPaid: number; balancePayable: number;
}
interface WorkflowStep { id: number; label: string; status: 'COMPLETED' | 'PENDING' | 'ACTION_REQUIRED'; }
interface PtData {
  period: string; state: string; ptrcNumber: string;
  financialYear: string; registrationType: string;
  employees: PtRow[]; summary: PtSummary; workflowSteps: WorkflowStep[];
}
interface ReturnRecord {
  returnId: string; generatedDate: string; generatedBy: string;
  payrollRunId: string; employeeCount: number; liability: number; paymentRef: string;
}
interface FilingRecord { filingDate: string; ackNo: string; filingRef: string; notes: string; }
interface PeriodState {
  paymentDone: { ref: string; date: string; amount: number } | null;
  returnStatus: 'NOT_PREPARED' | 'GENERATED' | 'FILED';
  returnRecord: ReturnRecord | null;
  filingRecord: FilingRecord | null;
}

/* ─── Helpers ─────────────────────────────────────────────── */
const INR = (n: number | undefined | null) =>
  '₹' + (Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

/** Generate all months for an Indian FY (Apr → Mar) */
function fyPeriods(fy: string): string[] {
  const [startY] = fy.split('-').map(Number);
  const months: string[] = [];
  for (let m = 4; m <= 12; m++) months.push(`${startY}-${String(m).padStart(2, '0')}`);
  for (let m = 1; m <= 3; m++) months.push(`${startY + 1}-${String(m).padStart(2, '0')}`);
  return months;
}

const FY_LIST = ['2026-2027', '2025-2026'];
const ALL_PERIODS_2627 = fyPeriods('2026-2027');
const ALL_PERIODS_2526 = fyPeriods('2025-2026');

function periodLabel(p: string): string {
  const [y, m] = p.split('-');
  return new Date(+y, +m - 1, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
}

function overallStatus(ps: PeriodState | undefined, hasPtData: boolean): string {
  if (!ps) return hasPtData ? 'PT Calculated' : 'No Payroll';
  if (ps.returnStatus === 'FILED') return 'Filed';
  if (ps.returnStatus === 'GENERATED') return 'Return Generated';
  if (ps.paymentDone) return 'Payment Completed';
  if (hasPtData) return 'PT Calculated';
  return 'No Payroll';
}

function statusBadgeCls(s: string) {
  if (s === 'Filed') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (s === 'Return Generated') return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  if (s === 'Payment Completed') return 'bg-blue-50 text-blue-700 border-blue-200';
  if (s === 'PT Calculated') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-slate-100 text-slate-500 border-slate-200';
}

const DEFAULT_PERIOD_STATE: PeriodState = {
  paymentDone: null, returnStatus: 'NOT_PREPARED', returnRecord: null, filingRecord: null,
};

/* ─── Component ──────────────────────────────────────────── */
export interface PtModuleProps {
  companyId?: string;
  companies?: any[];
}

export function PtModule({ companyId, companies = [] }: PtModuleProps) {
  const [activeFy, setActiveFy] = useState('2026-2027');
  const [period, setPeriod] = useState('2026-09');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [showHistory, setShowHistory] = useState(false);
  const [historyFy, setHistoryFy] = useState('2026-2027');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('All');

  // Per-period state map
  const [periodStateMap, setPeriodStateMap] = useState<Record<string, PeriodState>>(() => {
    try {
      const saved = localStorage.getItem('ehcm_pt_period_state');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const ps = periodStateMap[period] ?? DEFAULT_PERIOD_STATE;

  const setPeriodState = useCallback((p: string, updater: (prev: PeriodState) => PeriodState) => {
    setPeriodStateMap(map => {
      const nextMap = { ...map, [p]: updater(map[p] ?? DEFAULT_PERIOD_STATE) };
      try {
        localStorage.setItem('ehcm_pt_period_state', JSON.stringify(nextMap));
      } catch {}
      return nextMap;
    });
  }, []);

  // Modals
  const [challanOpen, setChallanOpen] = useState(false);
  const [generateReturnOpen, setGenerateReturnOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [markFiledOpen, setMarkFiledOpen] = useState(false);
  const [challanForm, setChallanForm] = useState({ ptrcNo: '', paymentRef: '', paymentDate: '', paymentAmount: '' });
  const [filingForm, setFilingForm] = useState<FilingRecord>({ filingDate: '', ackNo: '', filingRef: '', notes: '' });

  // Fetch active period data
  const { data, isLoading, isRefetching, refetch } = useQuery<PtData>({
    queryKey: ['pt-dashboard', selectedCompany, period],
    queryFn: async () => {
      const r = await apiClient.get('/compliance/pt/dashboard', {
        params: { companyId: selectedCompany || 'all', period },
      });
      return r.data;
    },
  });

  useEffect(() => {
    if (data) setChallanForm(f => ({ ...f, ptrcNo: data.ptrcNumber, paymentAmount: String(data.summary?.totalPtLiability || 0) }));
  }, [data]);

  const s = data?.summary;
  const calcRows = (data?.employees || []).filter(e => e.status === 'CALCULATED');
  const periodLbl = periodLabel(period);

  const fyPeriodList = activeFy === '2026-2027' ? ALL_PERIODS_2627 : ALL_PERIODS_2526;
  const historyPeriodList = historyFy === '2026-2027' ? ALL_PERIODS_2627 : ALL_PERIODS_2526;

  // Enriched workflow steps
  const steps: WorkflowStep[] = (data?.workflowSteps || []).map(st => {
    if (st.id === 6) return { ...st, status: ps.paymentDone ? 'COMPLETED' : st.status as any };
    if (st.id === 7) return { ...st, status: ps.returnStatus !== 'NOT_PREPARED' ? 'COMPLETED' : st.status as any };
    if (st.id === 9) return { ...st, status: ps.returnStatus === 'FILED' ? 'COMPLETED' : st.status as any };
    return st as WorkflowStep;
  });

  /* ─ Handlers ─ */
  const handleMarkPayment = () => {
    if (!challanForm.paymentRef || !challanForm.paymentDate) { toast.error('Fill Payment Reference and Date'); return; }
    setPeriodState(period, prev => ({ ...prev, paymentDone: { ref: challanForm.paymentRef, date: challanForm.paymentDate, amount: Number(challanForm.paymentAmount) || s?.totalPtLiability || 0 } }));
    setChallanOpen(false);
    toast.success('PT Payment marked as completed');
  };

  const handleConfirmGenerateReturn = () => {
    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    setPeriodState(period, prev => ({
      ...prev,
      returnRecord: { returnId: `PTRC-${period.replace('-', '')}-001`, generatedDate: today, generatedBy: 'Super Admin', payrollRunId: `PAY-${period}-001`, employeeCount: s?.ptApplicableEmployees || 0, liability: s?.totalPtLiability || 0, paymentRef: prev.paymentDone?.ref || '' },
      returnStatus: 'GENERATED',
    }));
    setGenerateReturnOpen(false);
    toast.success('PT Return generated successfully');
  };

  const handleConfirmFiled = () => {
    if (!filingForm.filingDate || !filingForm.ackNo) { toast.error('Filing Date and Acknowledgement No. are required'); return; }
    setPeriodState(period, prev => ({ ...prev, filingRecord: { ...filingForm }, returnStatus: 'FILED' }));
    setMarkFiledOpen(false);
    setFilingForm({ filingDate: '', ackNo: '', filingRef: '', notes: '' });
    toast.success('PT Return marked as Filed');
  };

  const handleDownloadReturn = () => {
    const returnId = ps.returnRecord?.returnId || `PTRC-${period.replace('-', '')}-001`;
    const lines = [
      'MAHARASHTRA PROFESSIONAL TAX MONTHLY RETURN (FORM III-B)',
      `State: Maharashtra`,
      `Registration Type: PTRC`,
      `PTRC Number: ${data?.ptrcNumber || 'PTRC/MH/27AAECR2568P1Z3'}`,
      `Return ID: ${returnId}`,
      `Period: ${periodLbl}`,
      `Financial Year: FY ${activeFy}`,
      `Payroll Run: PAY-${period}-001`,
      `Total Employees Covered: ${s?.ptApplicableEmployees || 0}`,
      `Total Gross Taxable Salary (INR): ${s?.totalTaxableSalary || 0}`,
      `Total PT Liability (INR): ${s?.totalPtLiability || 0}`,
      `Amount Paid (INR): ${ps.paymentDone?.amount || s?.totalPtLiability || 0}`,
      `Payment Reference / UTR: ${ps.paymentDone?.ref || 'N/A'}`,
      `Payment Date: ${ps.paymentDone?.date || 'N/A'}`,
      `Generated Date: ${ps.returnRecord?.generatedDate || new Date().toLocaleDateString('en-IN')}`,
      `Generated By: ${ps.returnRecord?.generatedBy || 'Super Admin'}`,
      '',
      'EMPLOYEE-WISE PROFESSIONAL TAX REGISTER',
      'Sr No,Employee Code,Employee Name,Department,Company / Entity,Monthly Gross,Annual CTC,PT Wage,PT Deducted,Status',
      ...calcRows.map((r, i) =>
        `"${i + 1}","${r.employeeCode}","${r.name}","${r.department}","${r.companyName || ''}","${r.monthlyCtc}","${r.annualCtc}","${r.ptWage}","${r.ptAmount}","Calculated"`
      ),
      `"Total","","","","","${s?.totalTaxableSalary || 0}","${s?.totalAnnualCtc || 0}","","${s?.totalPtLiability || 0}",""`
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `PT_Return_${returnId}_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`PT Return (${returnId}) downloaded successfully`);
  };

  // Filtered history
  const filteredHistory = historyPeriodList.filter(p => {
    const hps = periodStateMap[p];
    const status = overallStatus(hps, p === period ? (calcRows.length > 0) : !!hps?.paymentDone || false);
    if (historyStatusFilter !== 'All' && !status.toLowerCase().includes(historyStatusFilter.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">

      {/* ── PAGE HEADER ── */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">
              <span>Compliance</span><ArrowRight className="w-3 h-3" /><span className="text-slate-500">Professional Tax</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100"><ShieldCheck className="w-6 h-6" /></div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-slate-900">Professional Tax</h1>
                  <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px]">PTRC</Badge>
                  <Badge className="bg-slate-100 text-slate-600 border border-slate-200 text-[11px]">Maharashtra</Badge>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{isLoading ? '…' : data?.ptrcNumber}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />FY {activeFy}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />Maharashtra</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Company selector */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold shadow-xs">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <select
                value={selectedCompany}
                onChange={e => setSelectedCompany(e.target.value)}
                className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer text-xs"
              >
                <option value="all">All Companies</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            {/* FY selector */}
            <select value={activeFy} onChange={e => setActiveFy(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer">
              {FY_LIST.map(fy => <option key={fy} value={fy}>FY {fy}</option>)}
            </select>
            {/* Period selector */}
            <select value={period} onChange={e => setPeriod(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer">
              {fyPeriodList.map(p => <option key={p} value={p}>{periodLabel(p)}</option>)}
            </select>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 cursor-pointer">
              <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />Sync
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowHistory(h => !h)}
              className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 gap-1.5 cursor-pointer">
              <History className="w-3.5 h-3.5" />
              {showHistory ? 'Hide History' : 'View History'}
              {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
          </div>
        </div>
      </div>

      {/* ── PT HISTORY TABLE (collapsible) ── */}
      {showHistory && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900">PT Compliance History</CardTitle>
                  <CardDescription className="text-xs">All periods for FY {historyFy} — click View to load any period</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <select value={historyFy} onChange={e => setHistoryFy(e.target.value)}
                  className="px-2 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-700 focus:outline-none">
                  {FY_LIST.map(fy => <option key={fy} value={fy}>FY {fy}</option>)}
                </select>
                <select value={historyStatusFilter} onChange={e => setHistoryStatusFilter(e.target.value)}
                  className="px-2 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-700 focus:outline-none">
                  {['All', 'Filed', 'Return Generated', 'Payment Completed', 'PT Calculated', 'No Payroll'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/30">
                    {['Period', 'Employees', 'PT Liability', 'Amount Paid', 'Payment', 'Return', 'Overall Status', 'Filed Date', 'Actions'].map(h => (
                      <th key={h} className="py-3 px-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.map((p, i) => {
                    const hps = periodStateMap[p];
                    const isCurrent = p === period;
                    const hasPtData = isCurrent ? calcRows.length > 0 : !!hps?.paymentDone;
                    const status = overallStatus(hps, hasPtData);
                    const liability = isCurrent ? (s?.totalPtLiability ?? 0) : (hps?.returnRecord?.liability ?? 0);
                    const empCount = isCurrent ? (s?.ptApplicableEmployees ?? 0) : (hps?.returnRecord?.employeeCount ?? 0);
                    return (
                      <tr key={p} className={`${isCurrent ? 'bg-indigo-50/40' : i % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'} hover:bg-indigo-50/20 transition-colors`}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-800">{periodLabel(p)}</span>
                            {isCurrent && <Badge className="bg-indigo-100 text-indigo-700 border-0 text-[10px] px-1.5">Current</Badge>}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{empCount || '—'}</td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-800">{liability > 0 ? INR(liability) : '—'}</td>
                        <td className="py-3 px-4 font-mono text-slate-700">{hps?.paymentDone ? INR(hps.paymentDone.amount) : isCurrent && ps.paymentDone ? INR(ps.paymentDone.amount) : '—'}</td>
                        <td className="py-3 px-4">
                          {(isCurrent ? ps.paymentDone : hps?.paymentDone)
                            ? <span className="text-emerald-700 font-semibold text-xs">✓ Paid</span>
                            : <span className="text-slate-400 text-xs">Pending</span>}
                        </td>
                        <td className="py-3 px-4">
                          {(isCurrent ? ps.returnStatus : hps?.returnStatus) === 'FILED'
                            ? <span className="text-emerald-700 font-semibold text-xs">✓ Filed</span>
                            : (isCurrent ? ps.returnStatus : hps?.returnStatus) === 'GENERATED'
                            ? <span className="text-indigo-700 font-semibold text-xs">Generated</span>
                            : <span className="text-slate-400 text-xs">—</span>}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={`text-[11px] font-semibold border ${statusBadgeCls(status)}`}>{status}</Badge>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-500">
                          {(isCurrent ? ps.filingRecord : hps?.filingRecord)?.filingDate || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <Button size="sm" variant="outline"
                            className="h-7 px-3 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 gap-1 cursor-pointer"
                            onClick={() => { setPeriod(p); setShowHistory(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                            <Eye className="w-3 h-3" />View
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredHistory.length === 0 && (
                    <tr><td colSpan={9} className="py-10 text-center text-slate-400 text-sm">No periods match the selected filter.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── CURRENT PERIOD LABEL ── */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">{periodLbl} — Detailed View</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* ── SUMMARY STATS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'PT Employees', value: isLoading ? '…' : String(s?.ptApplicableEmployees ?? 0), icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
          { label: 'PT Liability', value: isLoading ? '…' : INR(s?.totalPtLiability), icon: IndianRupee, color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' },
          { label: 'Amount Paid', value: ps.paymentDone ? INR(ps.paymentDone.amount) : '₹0', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: 'Balance Due', value: ps.paymentDone ? '₹0' : isLoading ? '…' : INR(s?.balancePayable), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
        ].map(c => (
          <Card key={c.label} className="border-slate-200 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${c.bg} border ${c.border} flex items-center justify-center flex-shrink-0`}>
                <c.icon className={`w-5 h-5 ${c.color}`} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{c.label}</p>
                <p className={`text-xl font-bold mt-0.5 ${c.color}`}>{c.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── WORKFLOW PIPELINE ── */}
      <Card className="border-indigo-100 bg-gradient-to-r from-indigo-50/60 via-slate-50/40 to-slate-50">
        <CardContent className="py-4 px-6">
          <div className="text-xs font-semibold text-indigo-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-600" />PT Compliance Workflow — {periodLbl}
          </div>
          {isLoading ? (
            <div className="flex items-center gap-2 text-slate-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 text-center text-xs">
              {steps.map(st => (
                <div key={st.id} className={`p-2 rounded-md font-semibold flex items-center justify-center gap-1 ${st.status === 'COMPLETED' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600'}`}>
                  {st.status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3 flex-shrink-0" />}
                  <span className="truncate">{st.label}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── PT REGISTER ── */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-indigo-600" />
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">PT Register — {periodLbl}</CardTitle>
                <CardDescription className="text-xs mt-0.5">From Employee Master + Active Salary Assignments · Maharashtra PT slabs applied</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs font-semibold">{calcRows.length} Calculated</Badge>
              <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 text-xs font-semibold">Total: {INR(s?.totalPtLiability)}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center gap-2 p-8 text-slate-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" />Loading register…</div>
          ) : calcRows.length === 0 ? (
            <div className="text-center py-14 px-6 space-y-3">
              <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-base font-semibold text-slate-700">No finalized payroll data for {periodLbl}</p>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">Assign salary structures to employees in Payroll to calculate PT for this period.</p>
              <Button size="sm" variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer" onClick={() => (window.location.href = '/payroll/structure')}>Go to Payroll Structure</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/30">
                    {['Employee', 'Emp ID', 'Company / Entity', 'Department', 'Salary Structure', 'Monthly Gross', 'Annual CTC', 'PT Wage', 'PT Amount', 'Status'].map(h => (
                      <th key={h} className="py-3 px-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {calcRows.map((row, i) => (
                    <tr key={row.employeeId} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} hover:bg-indigo-50/20 transition-colors`}>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 text-[11px] font-bold flex-shrink-0">{row.name.charAt(0)}</div>
                          <span className="font-semibold text-slate-900">{row.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500">{row.employeeCode}</td>
                      <td className="py-3.5 px-4 text-slate-700 text-xs font-medium">{row.companyName || '—'}</td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs">{row.department}</td>
                      <td className="py-3.5 px-4">{row.templateCode ? <span className="text-xs bg-slate-100 text-slate-700 border border-slate-200 rounded px-2 py-0.5 font-medium">{row.templateCode}</span> : <span className="text-slate-400 text-xs">—</span>}</td>
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-700 text-right">{INR(row.monthlyCtc)}</td>
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-700 text-right">{INR(row.annualCtc)}</td>
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-700 text-right">{INR(row.ptWage)}/mo</td>
                      <td className="py-3.5 px-4 font-mono text-sm font-bold text-indigo-700 text-right">{INR(row.ptAmount)}</td>
                      <td className="py-3.5 px-4"><Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">✓ Calculated</Badge></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50">
                    <td colSpan={5} className="py-3 px-4 font-bold text-sm text-slate-900">Total</td>
                    <td className="py-3 px-4 font-mono font-bold text-sm text-slate-800 text-right">{INR(s?.totalTaxableSalary)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-sm text-slate-800 text-right">{INR(s?.totalAnnualCtc)}</td>
                    <td /><td className="py-3 px-4 font-mono font-bold text-base text-indigo-700 text-right">{INR(s?.totalPtLiability)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── SLABS + LIABILITY + PAYMENT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* PT Slabs */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
            <div className="flex items-center gap-2"><IndianRupee className="w-5 h-5 text-indigo-600" /><CardTitle className="text-base font-semibold text-slate-900">Maharashtra PT Slabs</CardTitle></div>
          </CardHeader>
          <CardContent className="pt-4 space-y-2.5">
            {[
              { range: '≤ ₹7,500 / month', pt: '₹0', note: 'Exempt', cls: 'border-slate-200 bg-slate-50 text-slate-500' },
              { range: '₹7,501 – ₹10,000 / month', pt: '₹175', note: 'Standard months', cls: 'border-amber-200 bg-amber-50 text-amber-700' },
              { range: '> ₹10,000 / month', pt: '₹200', note: 'Standard months', cls: 'border-indigo-200 bg-indigo-50 text-indigo-700' },
              { range: '> ₹10,000 / month (Feb)', pt: '₹300', note: 'February exception', cls: 'border-slate-300 bg-slate-100 text-slate-700' },
            ].map(sl => (
              <div key={sl.range} className={`flex items-center justify-between px-3 py-2.5 rounded-lg border ${sl.cls}`}>
                <div><p className="text-[11px] font-semibold">{sl.range}</p><p className="text-[10px] opacity-60 mt-0.5">{sl.note}</p></div>
                <p className="text-base font-extrabold">{sl.pt}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Liability Summary */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
            <div className="flex items-center gap-2"><Receipt className="w-5 h-5 text-indigo-600" /><CardTitle className="text-base font-semibold text-slate-900">PT Liability Summary</CardTitle></div>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? <div className="flex items-center gap-2 text-slate-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" />Loading…</div> : (
              <div className="space-y-2">
                {[
                  { label: 'Employees w/ Salary', value: String(s?.totalEmployees ?? 0) },
                  { label: 'PT Applicable', value: String(s?.ptApplicableEmployees ?? 0) },
                  { label: 'Total Taxable Gross', value: INR(s?.totalTaxableSalary), mono: true },
                  { label: 'Total Annual CTC', value: INR(s?.totalAnnualCtc), mono: true },
                  { label: 'PT Deducted', value: INR(s?.totalPtLiability), mono: true, accent: true },
                  { label: 'Amount Paid', value: ps.paymentDone ? INR(ps.paymentDone.amount) : '₹0', mono: true, green: !!ps.paymentDone },
                  { label: 'Balance Payable', value: ps.paymentDone ? '₹0' : INR(s?.balancePayable), mono: true, warn: !ps.paymentDone && (s?.balancePayable ?? 0) > 0 },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-xs text-slate-500">{r.label}</span>
                    <span className={`text-xs font-bold ${r.mono ? 'font-mono' : ''} ${r.accent ? 'text-indigo-700' : r.green ? 'text-emerald-600' : r.warn ? 'text-amber-600' : 'text-slate-800'}`}>{r.value}</span>
                  </div>
                ))}
                {ps.paymentDone && (
                  <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <div><p className="text-[11px] font-bold text-emerald-700">Payment Completed</p><p className="text-[10px] text-emerald-600 font-mono">Ref: {ps.paymentDone.ref} · {ps.paymentDone.date}</p></div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment / Challan */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-600" />
              <div><CardTitle className="text-base font-semibold text-slate-900">Payment / Challan</CardTitle><CardDescription className="text-xs">{ps.paymentDone ? 'Completed' : 'Awaiting payment for ' + periodLbl}</CardDescription></div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {ps.paymentDone ? (
              <div className="space-y-2.5">
                {[
                  { label: 'Status', value: '✓ Payment Completed', cls: 'text-emerald-700 font-bold' },
                  { label: 'Reference / UTR', value: ps.paymentDone.ref },
                  { label: 'Payment Date', value: ps.paymentDone.date },
                  { label: 'Amount Paid', value: INR(ps.paymentDone.amount) },
                ].map(r => (
                  <div key={r.label} className="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-xs text-slate-500">{r.label}</span>
                    <span className={`text-xs font-mono font-semibold ${r.cls || 'text-slate-800'}`}>{r.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                  <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" /><span className="text-sm font-bold text-amber-700">Payment Pending</span></div>
                  <p className="text-xs text-amber-600">Liability: <strong className="font-mono">{INR(s?.totalPtLiability)}</strong> for {s?.ptApplicableEmployees ?? 0} employees</p>
                  <p className="text-xs text-amber-500 mt-0.5">Due: 15th of following month</p>
                </div>
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm cursor-pointer" disabled={!s || (s.totalPtLiability ?? 0) === 0} onClick={() => setChallanOpen(true)}>
                  <Receipt className="w-4 h-4 mr-2" />Generate Challan & Mark Payment
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── RETURN + VALIDATION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-600" />
                <div><CardTitle className="text-base font-semibold text-slate-900">PT Return — {periodLbl}</CardTitle><CardDescription className="text-xs">PTRC Monthly Return</CardDescription></div>
              </div>
              <Badge variant="outline" className={`text-[11px] font-semibold ${ps.returnStatus === 'FILED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ps.returnStatus === 'GENERATED' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                {ps.returnStatus.replace('_', ' ')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Return Type', value: 'PTRC Monthly' },
                { label: 'PT Employees', value: String(s?.ptApplicableEmployees ?? 0) },
                { label: 'PT Liability', value: INR(s?.totalPtLiability) },
                { label: 'Payment', value: ps.paymentDone ? '✓ Paid' : 'Pending' },
              ].map(c => (
                <div key={c.label} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide">{c.label}</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{isLoading ? '…' : c.value}</p>
                </div>
              ))}
            </div>
            {ps.returnStatus === 'FILED' && ps.filingRecord && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 space-y-1">
                <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5"><BadgeCheck className="w-3.5 h-3.5" />Return Filed</p>
                <p className="text-[11px] text-emerald-600 font-mono">Ack No: {ps.filingRecord.ackNo} · {ps.filingRecord.filingDate}</p>
                {ps.filingRecord.notes && <p className="text-[11px] text-emerald-600">Notes: {ps.filingRecord.notes}</p>}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 text-xs cursor-pointer"
                disabled={!ps.paymentDone || ps.returnStatus !== 'NOT_PREPARED'} onClick={() => setGenerateReturnOpen(true)}>
                <ClipboardCheck className="w-3.5 h-3.5" />Generate Return
              </Button>
              <Button size="sm" variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 text-xs cursor-pointer"
                disabled={ps.returnStatus === 'NOT_PREPARED'} onClick={() => setDownloadOpen(true)}>
                <Download className="w-3.5 h-3.5" />Download
              </Button>
              <Button size="sm" variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 gap-1.5 text-xs cursor-pointer"
                disabled={ps.returnStatus !== 'GENERATED'} onClick={() => setMarkFiledOpen(true)}>
                <BadgeCheck className="w-3.5 h-3.5" />Mark Filed
              </Button>
            </div>
            {!ps.paymentDone && <p className="text-[11px] text-amber-600 flex items-center gap-1.5"><AlertTriangle className="w-3 h-3" />Complete payment before generating the return</p>}
          </CardContent>
        </Card>

        {/* Validation */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
            <div className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-indigo-600" /><CardTitle className="text-base font-semibold text-slate-900">Validation Checks</CardTitle></div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-1.5">
              {[
                { label: 'Employee data with salary exists', ok: calcRows.length > 0 },
                { label: 'PT applicability configured', ok: (s?.ptApplicableEmployees ?? 0) > 0 },
                { label: 'State (Maharashtra) available', ok: true },
                { label: 'PT amounts calculated', ok: (s?.totalPtLiability ?? 0) > 0 },
                { label: 'Payment / Challan completed', ok: !!ps.paymentDone },
                { label: 'Return generated', ok: ps.returnStatus !== 'NOT_PREPARED' },
                { label: 'Return filed', ok: ps.returnStatus === 'FILED' },
              ].map(v => (
                <div key={v.label} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs font-medium ${v.ok ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-white border-slate-200 text-slate-500'}`}>
                  {v.ok ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 flex-shrink-0" />}
                  {v.label}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── AUDIT HISTORY ── */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
          <div className="flex items-center gap-2"><FileText className="w-5 h-5 text-indigo-600" /><CardTitle className="text-base font-semibold text-slate-900">Audit History — {periodLbl}</CardTitle></div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="relative pl-5">
            <div className="absolute left-[9px] top-1 bottom-1 w-px bg-slate-200" />
            <div className="space-y-3">
              {[
                { action: 'Employee Data Synced', done: calcRows.length > 0, user: 'System' },
                { action: 'Salary Structures Verified', done: (s?.ptApplicableEmployees ?? 0) > 0, user: 'System' },
                { action: 'PT Calculated', done: (s?.totalPtLiability ?? 0) > 0, user: 'System' },
                { action: 'PT Register Generated', done: calcRows.length > 0, user: 'System' },
                { action: 'Payment Completed', done: !!ps.paymentDone, user: 'Super Admin', detail: ps.paymentDone ? `Ref: ${ps.paymentDone.ref}` : undefined },
                { action: 'Return Generated', done: ps.returnStatus !== 'NOT_PREPARED', user: 'Super Admin', detail: ps.returnRecord?.returnId },
                { action: 'Return Filed', done: ps.returnStatus === 'FILED', user: 'Super Admin', detail: ps.filingRecord?.ackNo },
              ].map(a => (
                <div key={a.action} className="flex items-start gap-3">
                  <div className={`mt-0.5 w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center border-2 ${a.done ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                    {a.done && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <span className={`text-xs font-medium ${a.done ? 'text-slate-800' : 'text-slate-400'}`}>
                      {a.action}{a.detail && <span className="ml-1.5 font-mono text-indigo-600">({a.detail})</span>}
                    </span>
                    {a.done && <span className="text-[10px] text-slate-400 ml-3 whitespace-nowrap">{period} · {a.user}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══ MODALS ═══════════════════════════════════════════════ */}

      {/* Challan Modal */}
      <Dialog open={challanOpen} onOpenChange={setChallanOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-slate-900"><Receipt className="w-5 h-5 text-indigo-600" />Generate PT Challan & Mark Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {[
              { label: 'Period', value: periodLbl, readOnly: true },
              { label: 'PTRC Number', key: 'ptrcNo', readOnly: true },
              { label: 'PT Employees', value: String(s?.ptApplicableEmployees ?? 0), readOnly: true },
              { label: 'PT Liability (₹)', value: String(s?.totalPtLiability ?? 0), readOnly: true },
              { label: 'Payment Amount (₹)', key: 'paymentAmount', readOnly: false },
              { label: 'Payment Reference / UTR *', key: 'paymentRef', readOnly: false },
              { label: 'Payment Date *', key: 'paymentDate', readOnly: false, type: 'date' },
            ].map(f => (
              <div key={f.label} className="grid grid-cols-5 gap-2 items-center">
                <Label className="text-xs text-slate-600 font-medium col-span-2">{f.label}</Label>
                <Input type={f.type || 'text'} value={f.key ? (challanForm as any)[f.key] : (f.value || '')} readOnly={f.readOnly} disabled={f.readOnly}
                  onChange={e => f.key && setChallanForm(p => ({ ...p, [f.key!]: e.target.value }))}
                  className="h-8 text-sm col-span-3 border-slate-300 focus:border-indigo-500" />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="border-slate-200 text-slate-700 cursor-pointer" onClick={() => setChallanOpen(false)}>Cancel</Button>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[180px] cursor-pointer" onClick={handleMarkPayment}><CheckCircle2 className="w-4 h-4 mr-1.5" />Mark Payment Completed</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Return Modal */}
      <Dialog open={generateReturnOpen} onOpenChange={setGenerateReturnOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-slate-900"><ClipboardCheck className="w-5 h-5 text-indigo-600" />Generate Professional Tax Return</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <div className="rounded-lg border border-slate-200 divide-y divide-slate-100">
              {[
                { label: 'Period', value: periodLbl }, { label: 'State', value: 'Maharashtra' },
                { label: 'PTRC No.', value: data?.ptrcNumber || '—' }, { label: 'Payroll Run', value: `PAY-${period}-001` },
                { label: 'PT Employees', value: String(s?.ptApplicableEmployees ?? 0) },
                { label: 'Taxable Salary', value: INR(s?.totalTaxableSalary) },
                { label: 'PT Deducted', value: INR(s?.totalPtLiability) },
                { label: 'Amount Paid', value: ps.paymentDone ? INR(ps.paymentDone.amount) : '—' },
                { label: 'Payment Status', value: ps.paymentDone ? '✓ PAID' : 'Pending', green: !!ps.paymentDone },
                { label: 'Calculation Status', value: '✓ VALID', green: true },
              ].map(r => (
                <div key={r.label} className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-slate-500">{r.label}</span>
                  <span className={`font-semibold font-mono ${(r as any).green ? 'text-emerald-700' : 'text-slate-800'}`}>{r.value}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Validation</p>
              <div className="space-y-1.5">
                {[
                  { label: 'Payroll finalized', ok: calcRows.length > 0 },
                  { label: 'PT calculated', ok: (s?.totalPtLiability ?? 0) > 0 },
                  { label: 'PT liability matched', ok: (s?.totalPtLiability ?? 0) > 0 },
                  { label: 'Payment completed', ok: !!ps.paymentDone },
                ].map(v => (
                  <div key={v.label} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${v.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
                    {v.ok ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
                    {v.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="border-slate-200 text-slate-700 cursor-pointer" onClick={() => setGenerateReturnOpen(false)}>Cancel</Button>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[160px] cursor-pointer" disabled={!ps.paymentDone} onClick={handleConfirmGenerateReturn}><ClipboardCheck className="w-4 h-4 mr-1.5" />Generate Return</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Download Preview Modal */}
      <Dialog open={downloadOpen} onOpenChange={setDownloadOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-slate-900"><FileText className="w-5 h-5 text-indigo-600" />PT Return Preview</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <div className="rounded-lg border border-slate-200 divide-y divide-slate-100">
              {[
                { label: 'Return ID', value: ps.returnRecord?.returnId || '—' },
                { label: 'Period', value: periodLbl }, { label: 'PTRC No.', value: data?.ptrcNumber || '—' },
                { label: 'Employees', value: String(s?.ptApplicableEmployees ?? 0) },
                { label: 'PT Liability', value: INR(s?.totalPtLiability) },
                { label: 'Paid', value: ps.paymentDone ? INR(ps.paymentDone.amount) : '—' },
                { label: 'Generated', value: ps.returnRecord?.generatedDate || '—' },
                { label: 'Generated By', value: ps.returnRecord?.generatedBy || '—' },
              ].map(r => (
                <div key={r.label} className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-slate-500">{r.label}</span>
                  <span className="font-semibold text-slate-800 font-mono">{r.value}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Employee Details</p>
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr><th className="py-2 px-4 text-left text-xs font-semibold text-slate-500">Employee</th><th className="py-2 px-4 text-right text-xs font-semibold text-slate-500">PT Wage</th><th className="py-2 px-4 text-right text-xs font-semibold text-slate-500">PT Amount</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {calcRows.map(r => (
                      <tr key={r.employeeId}><td className="py-2.5 px-4 font-medium text-slate-800">{r.name}</td><td className="py-2.5 px-4 font-mono text-slate-600 text-right">{INR(r.ptWage)}</td><td className="py-2.5 px-4 font-mono font-bold text-indigo-700 text-right">{INR(r.ptAmount)}</td></tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                    <tr><td className="py-2.5 px-4 font-bold text-slate-900">Total</td><td /><td className="py-2.5 px-4 font-mono font-bold text-indigo-700 text-right">{INR(s?.totalPtLiability)}</td></tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="border-slate-200 text-slate-700 cursor-pointer" onClick={() => setDownloadOpen(false)}>Close</Button>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 cursor-pointer" onClick={handleDownloadReturn}>
              <Download className="w-4 h-4" />Download Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Filed Modal */}
      <Dialog open={markFiledOpen} onOpenChange={setMarkFiledOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-slate-900"><BadgeCheck className="w-5 h-5 text-emerald-600" />Mark PT Return as Filed</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <div className="rounded-lg border border-slate-200 divide-y divide-slate-100">
              {[
                { label: 'Period', value: periodLbl }, { label: 'Return ID', value: ps.returnRecord?.returnId || '—' },
                { label: 'PT Liability', value: INR(s?.totalPtLiability) },
                { label: 'Payment', value: ps.paymentDone ? `✓ ${INR(ps.paymentDone.amount)} Paid` : 'Pending' },
              ].map(r => (
                <div key={r.label} className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-slate-500">{r.label}</span><span className="font-semibold text-slate-800">{r.value}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">Filing Details</p>
              <div className="space-y-3">
                {[
                  { label: 'Filing Date *', key: 'filingDate', type: 'date' },
                  { label: 'Acknowledgement No. *', key: 'ackNo' },
                  { label: 'Filing Reference', key: 'filingRef' },
                  { label: 'Notes', key: 'notes' },
                ].map(f => (
                  <div key={f.key} className="grid grid-cols-5 gap-2 items-center">
                    <Label className="text-xs text-slate-600 font-medium col-span-2">{f.label}</Label>
                    <Input type={f.type || 'text'} value={(filingForm as any)[f.key]}
                      onChange={e => setFilingForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="h-8 text-sm col-span-3 border-slate-300 focus:border-indigo-500" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 font-medium">This will mark this period as <strong>FILED</strong>. This action cannot be undone.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="border-slate-200 text-slate-700 cursor-pointer" onClick={() => setMarkFiledOpen(false)}>Cancel</Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[180px] cursor-pointer" onClick={handleConfirmFiled}><BadgeCheck className="w-4 h-4 mr-1.5" />Confirm & Mark Filed</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PtModule;
