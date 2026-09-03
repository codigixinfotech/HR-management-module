import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck, RefreshCw, CheckCircle2, Clock, AlertTriangle,
  IndianRupee, Users, FileText, Download, Receipt, ClipboardCheck,
  Send, BadgeCheck, Loader2, ArrowRight, Hash, MapPin, TrendingUp,
  Info, History, Eye, ChevronDown, ChevronUp, Building2, CreditCard,
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
interface EsicRow {
  employeeId: string;
  employeeCode: string;
  name: string;
  ipNumber: string;
  department: string;
  companyName?: string;
  state: string;
  esicApplicable: boolean;
  esicWage: number;
  employeeShare: number;
  employerShare: number;
  totalContribution: number;
  annualCtc: number;
  monthlyCtc: number;
  payrollPeriod: string;
  effectiveFrom: string;
  templateName?: string | null;
  templateCode?: string | null;
  status: 'CALCULATED' | 'EXEMPT';
}

interface EsicSummary {
  totalEmployees: number;
  esicApplicableEmployees: number;
  totalEsicWage: number;
  totalEmployeeShare: number;
  totalEmployerShare: number;
  totalContribution: number;
  amountPaid: number;
  balancePayable: number;
}

interface WorkflowStep {
  id: number;
  label: string;
  status: 'COMPLETED' | 'PENDING' | 'ACTION_REQUIRED';
}

interface EsicData {
  period: string;
  employerCode: string;
  financialYear: string;
  dueDate: string;
  employees: EsicRow[];
  summary: EsicSummary;
  workflowSteps: WorkflowStep[];
}

interface ContributionRecord {
  contributionId: string;
  generatedDate: string;
  generatedBy: string;
  payrollRunId: string;
  employeeCount: number;
  totalWage: number;
  employeeShare: number;
  employerShare: number;
  totalContribution: number;
}

interface ChallanRecord {
  challanNo: string;
  generatedDate: string;
  dueDate: string;
  payableAmount: number;
}

interface PaymentRecord {
  paymentRef: string;
  paymentDate: string;
  bankMode: string;
  challanNo: string;
  amount: number;
}

interface SubmissionRecord {
  submissionRef: string;
  ackNo: string;
  submissionDate: string;
  notes: string;
}

interface EsicPeriodState {
  lifecycleStatus: 'CALCULATED' | 'CONTRIBUTION_GENERATED' | 'CHALLAN_GENERATED' | 'PAID' | 'SUBMITTED';
  contributionRecord: ContributionRecord | null;
  challanRecord: ChallanRecord | null;
  paymentRecord: PaymentRecord | null;
  submissionRecord: SubmissionRecord | null;
}

/* ─── Helpers ─────────────────────────────────────────────── */
const INR = (n: number | undefined | null) =>
  '₹' + (Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

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

function getOverallStatus(ps: EsicPeriodState | undefined, hasData: boolean): string {
  if (!ps) return hasData ? 'Calculated' : 'No Payroll';
  switch (ps.lifecycleStatus) {
    case 'SUBMITTED': return 'Submitted / Completed';
    case 'PAID': return 'Payment Completed';
    case 'CHALLAN_GENERATED': return 'Challan Generated';
    case 'CONTRIBUTION_GENERATED': return 'Contribution Generated';
    default: return hasData ? 'Calculated' : 'No Payroll';
  }
}

function statusBadgeCls(s: string) {
  if (s.includes('Submitted') || s.includes('Completed')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (s.includes('Payment')) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (s.includes('Challan')) return 'bg-purple-50 text-purple-700 border-purple-200';
  if (s.includes('Contribution')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  if (s.includes('Calculated')) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-slate-100 text-slate-500 border-slate-200';
}

const DEFAULT_ESIC_PERIOD_STATE: EsicPeriodState = {
  lifecycleStatus: 'CALCULATED',
  contributionRecord: null,
  challanRecord: null,
  paymentRecord: null,
  submissionRecord: null,
};

/* ─── Component ──────────────────────────────────────────── */
export interface EsicModuleProps {
  companyId?: string;
  companies?: any[];
}

export function EsicModule({ companyId, companies = [] }: EsicModuleProps) {
  const [activeFy, setActiveFy] = useState('2026-2027');
  const [period, setPeriod] = useState('2026-09');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [showHistory, setShowHistory] = useState(false);
  const [historyFy, setHistoryFy] = useState('2026-2027');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('All');

  // Per-period state map
  const [periodStateMap, setPeriodStateMap] = useState<Record<string, EsicPeriodState>>(() => {
    try {
      const saved = localStorage.getItem('ehcm_esic_period_state');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const ps = periodStateMap[period] ?? DEFAULT_ESIC_PERIOD_STATE;

  const setPeriodState = useCallback((p: string, updater: (prev: EsicPeriodState) => EsicPeriodState) => {
    setPeriodStateMap(map => {
      const nextMap = { ...map, [p]: updater(map[p] ?? DEFAULT_ESIC_PERIOD_STATE) };
      try {
        localStorage.setItem('ehcm_esic_period_state', JSON.stringify(nextMap));
      } catch {}
      return nextMap;
    });
  }, []);

  // Modals
  const [contributionModalOpen, setContributionModalOpen] = useState(false);
  const [challanModalOpen, setChallanModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false);

  // Forms
  const [paymentForm, setPaymentForm] = useState({
    paymentRef: '',
    paymentDate: '',
    bankMode: 'HDFC NetBanking (Corporate)',
    challanNo: '',
    amount: '',
  });

  const [submissionForm, setSubmissionForm] = useState({
    submissionRef: '',
    ackNo: '',
    submissionDate: '',
    notes: '',
  });

  // Fetch active period data
  const { data, isLoading, isRefetching, refetch } = useQuery<EsicData>({
    queryKey: ['esic-dashboard', selectedCompany, period],
    queryFn: async () => {
      const r = await apiClient.get('/compliance/esic/dashboard', {
        params: { companyId: selectedCompany || 'all', period },
      });
      return r.data;
    },
  });

  const s = data?.summary;
  const calcRows = (data?.employees || []).filter(e => e.status === 'CALCULATED');
  const periodLbl = periodLabel(period);

  const fyPeriodList = activeFy === '2026-2027' ? ALL_PERIODS_2627 : ALL_PERIODS_2526;
  const historyPeriodList = historyFy === '2026-2027' ? ALL_PERIODS_2627 : ALL_PERIODS_2526;

  // Enriched workflow steps
  const steps: WorkflowStep[] = (data?.workflowSteps || []).map(st => {
    if (st.id === 6) return { ...st, status: ps.contributionRecord ? 'COMPLETED' : st.status as any };
    if (st.id === 7) return { ...st, status: ps.challanRecord ? 'COMPLETED' : st.status as any };
    if (st.id === 8) return { ...st, status: ps.paymentRecord ? 'COMPLETED' : st.status as any };
    if (st.id === 9) return { ...st, status: ps.submissionRecord ? 'COMPLETED' : st.status as any };
    return st as WorkflowStep;
  });

  /* ─ Handlers ─ */
  const handleConfirmGenerateContribution = () => {
    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    setPeriodState(period, prev => ({
      ...prev,
      lifecycleStatus: 'CONTRIBUTION_GENERATED',
      contributionRecord: {
        contributionId: `ESIC-CONTRIB-${period.replace('-', '')}-001`,
        generatedDate: today,
        generatedBy: 'Super Admin',
        payrollRunId: `PAY-${period}-001`,
        employeeCount: s?.esicApplicableEmployees || 0,
        totalWage: s?.totalEsicWage || 0,
        employeeShare: s?.totalEmployeeShare || 0,
        employerShare: s?.totalEmployerShare || 0,
        totalContribution: s?.totalContribution || 0,
      },
    }));
    setContributionModalOpen(false);
    toast.success('ESIC Monthly Contribution record generated successfully');
  };

  const handleConfirmGenerateChallan = () => {
    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const challanNumber = `ESIC-CHAL-${period.replace('-', '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    setPeriodState(period, prev => ({
      ...prev,
      lifecycleStatus: 'CHALLAN_GENERATED',
      challanRecord: {
        challanNo: challanNumber,
        generatedDate: today,
        dueDate: data?.dueDate || '2026-10-15',
        payableAmount: s?.totalContribution || 0,
      },
    }));
    setPaymentForm(f => ({
      ...f,
      challanNo: challanNumber,
      amount: String(s?.totalContribution || 0),
      paymentDate: new Date().toISOString().split('T')[0],
    }));
    setChallanModalOpen(false);
    toast.success(`ESIC Challan ${challanNumber} generated successfully`);
  };

  const handleConfirmPayment = () => {
    if (!paymentForm.paymentRef || !paymentForm.paymentDate) {
      toast.error('Payment Reference (UTR) and Date are required');
      return;
    }
    setPeriodState(period, prev => ({
      ...prev,
      lifecycleStatus: 'PAID',
      paymentRecord: {
        paymentRef: paymentForm.paymentRef,
        paymentDate: paymentForm.paymentDate,
        bankMode: paymentForm.bankMode,
        challanNo: paymentForm.challanNo || prev.challanRecord?.challanNo || `ESIC-CHAL-${period.replace('-', '')}-001`,
        amount: Number(paymentForm.amount) || s?.totalContribution || 0,
      },
    }));
    setSubmissionForm(f => ({
      ...f,
      submissionRef: `ESIC-SUB-${period.replace('-', '')}-001`,
      submissionDate: new Date().toISOString().split('T')[0],
      ackNo: `ACK${Math.floor(10000000 + Math.random() * 90000000)}`,
    }));
    setPaymentModalOpen(false);
    toast.success('ESIC Payment marked as completed');
  };

  const handleConfirmSubmission = () => {
    if (!submissionForm.ackNo || !submissionForm.submissionDate) {
      toast.error('Acknowledgement No. and Submission Date are required');
      return;
    }
    setPeriodState(period, prev => ({
      ...prev,
      lifecycleStatus: 'SUBMITTED',
      submissionRecord: { ...submissionForm },
    }));
    setSubmissionModalOpen(false);
    toast.success('ESIC Monthly Contribution marked as Submitted & Filed');
  };

  const handleDownloadContributionCsv = () => {
    const lines = [
      'EMPLOYEES STATE INSURANCE CORPORATION (ESIC)',
      'MONTHLY CONTRIBUTION STATEMENT (FORM 5 / MONTHLY RETURN)',
      `Employer Code: ${data?.employerCode || 'ESIC-MH-31000256890001001'}`,
      `Period: ${periodLbl}`,
      `Financial Year: FY ${activeFy}`,
      `Payroll Run ID: PAY-${period}-001`,
      `Challan No: ${ps.challanRecord?.challanNo || 'N/A'}`,
      `Payment UTR: ${ps.paymentRecord?.paymentRef || 'N/A'}`,
      `Payment Date: ${ps.paymentRecord?.paymentDate || 'N/A'}`,
      `Total Insured Persons: ${s?.esicApplicableEmployees || 0}`,
      `Total Wages (INR): ${s?.totalEsicWage || 0}`,
      `Employee Share 0.75% (INR): ${s?.totalEmployeeShare || 0}`,
      `Employer Share 3.25% (INR): ${s?.totalEmployerShare || 0}`,
      `Total ESIC Contribution 4.00% (INR): ${s?.totalContribution || 0}`,
      '',
      'EMPLOYEE-WISE ESIC CONTRIBUTION REGISTER',
      'Sr No,Employee Code,IP Number,Employee Name,Department,Company / Entity,Monthly Gross,ESIC Wage,Employee Share (0.75%),Employer Share (3.25%),Total (4.00%),Status',
      ...calcRows.map((r, i) =>
        `"${i + 1}","${r.employeeCode}","${r.ipNumber}","${r.name}","${r.department}","${r.companyName || ''}","${r.monthlyCtc}","${r.esicWage}","${r.employeeShare}","${r.employerShare}","${r.totalContribution}","Calculated"`
      ),
      `"Total","","","","","","${s?.totalEsicWage || 0}","${s?.totalEsicWage || 0}","${s?.totalEmployeeShare || 0}","${s?.totalEmployerShare || 0}","${s?.totalContribution || 0}",""`
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ESIC_Contribution_${period}_${data?.employerCode || 'ESIC'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('ESIC Monthly Contribution file downloaded successfully');
  };

  // Filtered history
  const filteredHistory = historyPeriodList.filter(p => {
    const hps = periodStateMap[p];
    const status = getOverallStatus(hps, p === period ? (calcRows.length > 0) : !!hps?.paymentRecord);
    if (historyStatusFilter !== 'All' && !status.toLowerCase().includes(historyStatusFilter.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">

      {/* ── BREADCRUMB + PAGE HEADER ── */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">
              <span>Compliance</span><ArrowRight className="w-3 h-3" /><span className="text-slate-500">ESIC</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-slate-900">Employees&apos; State Insurance (ESIC)</h1>
                  <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-semibold">
                    ESI Act 1948
                  </Badge>
                  <Badge className="bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-semibold">
                    Maharashtra
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{isLoading ? '…' : data?.employerCode}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />FY {activeFy}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Due Date: {data?.dueDate || '15th of next month'}</span>
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
            <select
              value={activeFy}
              onChange={e => setActiveFy(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              {FY_LIST.map(fy => <option key={fy} value={fy}>FY {fy}</option>)}
            </select>
            {/* Period selector */}
            <select
              value={period}
              onChange={e => setPeriod(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              {fyPeriodList.map(p => <option key={p} value={p}>{periodLabel(p)}</option>)}
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />Sync
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(h => !h)}
              className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 gap-1.5 cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              {showHistory ? 'Hide History' : 'View History'}
              {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
          </div>
        </div>
      </div>

      {/* ── ESIC HISTORY TABLE (collapsible) ── */}
      {showHistory && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900">ESIC Compliance History</CardTitle>
                  <CardDescription className="text-xs">All periods for FY {historyFy} — click View to load any period</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={historyFy}
                  onChange={e => setHistoryFy(e.target.value)}
                  className="px-2 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-700 focus:outline-none"
                >
                  {FY_LIST.map(fy => <option key={fy} value={fy}>FY {fy}</option>)}
                </select>
                <select
                  value={historyStatusFilter}
                  onChange={e => setHistoryStatusFilter(e.target.value)}
                  className="px-2 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-700 focus:outline-none"
                >
                  {['All', 'Submitted', 'Payment Completed', 'Challan Generated', 'Contribution Generated', 'Calculated', 'No Payroll'].map(s => (
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
                    {['Period', 'Employees', 'ESIC Wage', 'Employee (0.75%)', 'Employer (3.25%)', 'Total (4%)', 'Payment', 'Challan', 'Overall Status', 'Actions'].map(h => (
                      <th key={h} className="py-3 px-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.map((p, i) => {
                    const hps = periodStateMap[p];
                    const isCurrent = p === period;
                    const hasData = isCurrent ? calcRows.length > 0 : !!hps?.contributionRecord;
                    const status = getOverallStatus(hps, hasData);
                    const wage = isCurrent ? (s?.totalEsicWage ?? 0) : (hps?.contributionRecord?.totalWage ?? 0);
                    const empShare = isCurrent ? (s?.totalEmployeeShare ?? 0) : (hps?.contributionRecord?.employeeShare ?? 0);
                    const emplyrShare = isCurrent ? (s?.totalEmployerShare ?? 0) : (hps?.contributionRecord?.employerShare ?? 0);
                    const totalCont = isCurrent ? (s?.totalContribution ?? 0) : (hps?.contributionRecord?.totalContribution ?? 0);
                    const empCount = isCurrent ? (s?.esicApplicableEmployees ?? 0) : (hps?.contributionRecord?.employeeCount ?? 0);

                    return (
                      <tr key={p} className={`${isCurrent ? 'bg-indigo-50/40' : i % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'} hover:bg-indigo-50/20 transition-colors`}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-800">{periodLabel(p)}</span>
                            {isCurrent && <Badge className="bg-indigo-100 text-indigo-700 border-0 text-[10px] px-1.5">Current</Badge>}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{empCount || '—'}</td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-800">{wage > 0 ? INR(wage) : '—'}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{empShare > 0 ? INR(empShare) : '—'}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{emplyrShare > 0 ? INR(emplyrShare) : '—'}</td>
                        <td className="py-3 px-4 font-mono font-bold text-indigo-700">{totalCont > 0 ? INR(totalCont) : '—'}</td>
                        <td className="py-3 px-4">
                          {(isCurrent ? ps.paymentRecord : hps?.paymentRecord)
                            ? <span className="text-emerald-700 font-semibold text-xs">✓ Paid</span>
                            : <span className="text-slate-400 text-xs">Pending</span>}
                        </td>
                        <td className="py-3 px-4">
                          {(isCurrent ? ps.challanRecord : hps?.challanRecord)
                            ? <span className="text-indigo-700 font-semibold text-xs">✓ Generated</span>
                            : <span className="text-slate-400 text-xs">—</span>}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={`text-[11px] font-semibold border ${statusBadgeCls(status)}`}>{status}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-3 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 gap-1 cursor-pointer"
                            onClick={() => { setPeriod(p); setShowHistory(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          >
                            <Eye className="w-3 h-3" />View
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredHistory.length === 0 && (
                    <tr><td colSpan={10} className="py-10 text-center text-slate-400 text-sm">No periods match the selected filter.</td></tr>
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
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">{periodLbl} — Detailed ESIC Operations</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* ── SUMMARY STATS (4 CARDS) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'ESIC Employees', value: isLoading ? '…' : String(s?.esicApplicableEmployees ?? 0), icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
          { label: 'ESIC Liability (4%)', value: isLoading ? '…' : INR(s?.totalContribution), icon: IndianRupee, color: 'text-slate-800', bg: 'bg-slate-50', border: 'border-slate-200' },
          { label: 'Amount Paid', value: ps.paymentRecord ? INR(ps.paymentRecord.amount) : '₹0', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: 'Balance Due', value: ps.paymentRecord ? '₹0' : isLoading ? '…' : INR(s?.balancePayable), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
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
            <Info className="w-3.5 h-3.5 text-indigo-600" />ESIC Compliance Workflow — {periodLbl}
          </div>
          {isLoading ? (
            <div className="flex items-center gap-2 text-slate-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 text-center text-xs">
              {steps.map(st => (
                <div
                  key={st.id}
                  className={`p-2 rounded-md font-semibold flex items-center justify-center gap-1 ${
                    st.status === 'COMPLETED'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600'
                  }`}
                >
                  {st.status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3 flex-shrink-0" />}
                  <span className="truncate">{st.label}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── ESIC REGISTER TABLE ── */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-indigo-600" />
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">ESIC Register — {periodLbl}</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Monthly Contribution calculation: Employee 0.75% + Employer 3.25% on applicable ESIC wages
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs font-semibold">
                {calcRows.length} Calculated
              </Badge>
              <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 text-xs font-semibold">
                Total Liability: {INR(s?.totalContribution)}
              </Badge>
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
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Assign salary structures in Payroll to automatically calculate ESIC for this period.
              </p>
              <Button size="sm" variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer" onClick={() => (window.location.href = '/payroll/structure')}>
                Go to Payroll Structure
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/30">
                    {['Employee', 'IP Number', 'Company / Entity', 'Department', 'ESIC Applicable', 'ESIC Wage', 'Employee (0.75%)', 'Employer (3.25%)', 'Total (4%)', 'Status'].map(h => (
                      <th key={h} className="py-3 px-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {calcRows.map((row, i) => (
                    <tr key={row.employeeId} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} hover:bg-indigo-50/20 transition-colors`}>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 text-[11px] font-bold flex-shrink-0">
                            {row.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block">{row.name}</span>
                            <span className="text-[10.5px] font-mono text-slate-400">{row.employeeCode}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-700">{row.ipNumber}</td>
                      <td className="py-3.5 px-4 text-slate-700 text-xs font-medium">{row.companyName || '—'}</td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs">{row.department}</td>
                      <td className="py-3.5 px-4">
                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10.5px]">Yes</Badge>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-700 text-right">{INR(row.esicWage)}</td>
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-700 text-right">{INR(row.employeeShare)}</td>
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-700 text-right">{INR(row.employerShare)}</td>
                      <td className="py-3.5 px-4 font-mono text-sm font-bold text-indigo-700 text-right">{INR(row.totalContribution)}</td>
                      <td className="py-3.5 px-4">
                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                          ✓ Calculated
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50">
                    <td colSpan={5} className="py-3 px-4 font-bold text-sm text-slate-900">Total</td>
                    <td className="py-3 px-4 font-mono font-bold text-sm text-slate-800 text-right">{INR(s?.totalEsicWage)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-sm text-slate-800 text-right">{INR(s?.totalEmployeeShare)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-sm text-slate-800 text-right">{INR(s?.totalEmployerShare)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-base text-indigo-700 text-right">{INR(s?.totalContribution)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 3-COLUMN OPERATIONAL SECTION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* 1. ESIC Statutory Rates & Rules */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
            <div className="flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-indigo-600" />
              <CardTitle className="text-base font-semibold text-slate-900">ESIC Statutory Rates</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-2.5">
            {[
              { label: 'Employee Share', rate: '0.75%', desc: 'Deducted from employee gross salary', cls: 'border-indigo-100 bg-indigo-50/50 text-indigo-800' },
              { label: 'Employer Share', rate: '3.25%', desc: 'Contributed by the legal establishment', cls: 'border-blue-100 bg-blue-50/50 text-blue-800' },
              { label: 'Total Contribution', rate: '4.00%', desc: 'Total monthly remittance payable to ESIC', cls: 'border-emerald-100 bg-emerald-50/50 text-emerald-800' },
              { label: 'Filing Due Date', rate: '15th', desc: '15th of the month following wage period', cls: 'border-amber-100 bg-amber-50/50 text-amber-800' },
            ].map(sl => (
              <div key={sl.label} className={`flex items-center justify-between px-3 py-2.5 rounded-lg border ${sl.cls}`}>
                <div>
                  <p className="text-xs font-semibold">{sl.label}</p>
                  <p className="text-[10px] opacity-75 mt-0.5">{sl.desc}</p>
                </div>
                <p className="text-base font-extrabold">{sl.rate}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 2. ESIC Liability Summary */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-indigo-600" />
              <CardTitle className="text-base font-semibold text-slate-900">ESIC Liability — {periodLbl}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? <div className="flex items-center gap-2 text-slate-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" />Loading…</div> : (
              <div className="space-y-2">
                {[
                  { label: 'ESIC Insured Persons (IPs)', value: String(s?.esicApplicableEmployees ?? 0) },
                  { label: 'Total Gross / ESIC Wage', value: INR(s?.totalEsicWage), mono: true },
                  { label: 'Employee Contribution (0.75%)', value: INR(s?.totalEmployeeShare), mono: true },
                  { label: 'Employer Contribution (3.25%)', value: INR(s?.totalEmployerShare), mono: true },
                  { label: 'Total ESIC Payable (4.00%)', value: INR(s?.totalContribution), mono: true, accent: true },
                  { label: 'Amount Paid', value: ps.paymentRecord ? INR(ps.paymentRecord.amount) : '₹0', mono: true, green: !!ps.paymentRecord },
                  { label: 'Balance Due', value: ps.paymentRecord ? '₹0' : INR(s?.balancePayable), mono: true, warn: !ps.paymentRecord && (s?.balancePayable ?? 0) > 0 },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-xs text-slate-500">{r.label}</span>
                    <span className={`text-xs font-bold ${r.mono ? 'font-mono' : ''} ${r.accent ? 'text-indigo-700' : r.green ? 'text-emerald-600' : r.warn ? 'text-amber-600' : 'text-slate-800'}`}>
                      {r.value}
                    </span>
                  </div>
                ))}
                {ps.paymentRecord && (
                  <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-[11px] font-bold text-emerald-700">Payment Completed</p>
                      <p className="text-[10px] text-emerald-600 font-mono">UTR: {ps.paymentRecord.paymentRef} · {ps.paymentRecord.paymentDate}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3. Challan & Payment Lifecycle Status */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">Challan & Payment</CardTitle>
                <CardDescription className="text-xs">
                  {ps.paymentRecord ? 'Payment Completed' : ps.challanRecord ? 'Challan Generated — Awaiting Payment' : 'Contribution & Challan Pending'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {ps.paymentRecord ? (
              <div className="space-y-2.5">
                {[
                  { label: 'Status', value: '✓ Payment Completed', cls: 'text-emerald-700 font-bold' },
                  { label: 'Challan Number', value: ps.paymentRecord.challanNo },
                  { label: 'Payment UTR', value: ps.paymentRecord.paymentRef },
                  { label: 'Payment Date', value: ps.paymentRecord.paymentDate },
                  { label: 'Amount Paid', value: INR(ps.paymentRecord.amount) },
                ].map(r => (
                  <div key={r.label} className="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-xs text-slate-500">{r.label}</span>
                    <span className={`text-xs font-mono font-semibold ${r.cls || 'text-slate-800'}`}>{r.value}</span>
                  </div>
                ))}
              </div>
            ) : ps.challanRecord ? (
              <div className="space-y-3">
                <div className="rounded-lg bg-indigo-50 border border-indigo-200 px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Receipt className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <span className="text-sm font-bold text-indigo-800">Challan: {ps.challanRecord.challanNo}</span>
                  </div>
                  <p className="text-xs text-indigo-700">
                    Payable Amount: <strong className="font-mono">{INR(ps.challanRecord.payableAmount)}</strong>
                  </p>
                  <p className="text-xs text-indigo-600 mt-0.5">Due Date: {ps.challanRecord.dueDate}</p>
                </div>
                <Button
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm cursor-pointer"
                  onClick={() => setPaymentModalOpen(true)}
                >
                  <CreditCard className="w-4 h-4 mr-2" />Record Payment (UTR)
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span className="text-sm font-bold text-amber-700">Challan Pending</span>
                  </div>
                  <p className="text-xs text-amber-600">
                    Liability: <strong className="font-mono">{INR(s?.totalContribution)}</strong> for {s?.esicApplicableEmployees ?? 0} employees
                  </p>
                  <p className="text-xs text-amber-500 mt-0.5">Due: {data?.dueDate || '15th of following month'}</p>
                </div>
                <Button
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm cursor-pointer"
                  disabled={!ps.contributionRecord}
                  onClick={() => setChallanModalOpen(true)}
                >
                  <Receipt className="w-4 h-4 mr-2" />Generate Challan
                </Button>
                {!ps.contributionRecord && (
                  <p className="text-[11px] text-slate-500 text-center">
                    Generate monthly contribution first to create challan.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── 2-COLUMN ACTION & VALIDATION ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Monthly Contribution Filing & Submission Card */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-600" />
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900">Monthly Contribution & Return</CardTitle>
                  <CardDescription className="text-xs">ESIC Monthly Filing & Portal Submission</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className={`text-[11px] font-semibold ${statusBadgeCls(ps.lifecycleStatus)}`}>
                {ps.lifecycleStatus.replace('_', ' ')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Employer Code', value: data?.employerCode || '—' },
                { label: 'Insured Employees', value: String(s?.esicApplicableEmployees ?? 0) },
                { label: 'Total Contribution', value: INR(s?.totalContribution) },
                { label: 'Payment Status', value: ps.paymentRecord ? '✓ Paid' : 'Pending' },
              ].map(c => (
                <div key={c.label} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide">{c.label}</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{isLoading ? '…' : c.value}</p>
                </div>
              ))}
            </div>

            {ps.submissionRecord && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 space-y-1">
                <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5"><BadgeCheck className="w-3.5 h-3.5" />ESIC Return Submitted</p>
                <p className="text-[11px] text-emerald-600 font-mono">Ack No: {ps.submissionRecord.ackNo} · {ps.submissionRecord.submissionDate}</p>
                {ps.submissionRecord.notes && <p className="text-[11px] text-emerald-600">Notes: {ps.submissionRecord.notes}</p>}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 text-xs cursor-pointer"
                disabled={calcRows.length === 0 || ps.lifecycleStatus !== 'CALCULATED'}
                onClick={() => setContributionModalOpen(true)}
              >
                <ClipboardCheck className="w-3.5 h-3.5" />1. Generate Contribution
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 text-xs cursor-pointer"
                disabled={!ps.contributionRecord || !!ps.challanRecord}
                onClick={() => setChallanModalOpen(true)}
              >
                <Receipt className="w-3.5 h-3.5" />2. Generate Challan
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 text-xs cursor-pointer"
                disabled={!ps.contributionRecord}
                onClick={() => setPreviewModalOpen(true)}
              >
                <Download className="w-3.5 h-3.5" />Download Return
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 gap-1.5 text-xs cursor-pointer"
                disabled={!ps.paymentRecord || ps.lifecycleStatus === 'SUBMITTED'}
                onClick={() => setSubmissionModalOpen(true)}
              >
                <BadgeCheck className="w-3.5 h-3.5" />Mark Submitted
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Validation Checks */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <CardTitle className="text-base font-semibold text-slate-900">Validation Checks</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-1.5">
              {[
                { label: 'Employee data with salary structure exists', ok: calcRows.length > 0 },
                { label: 'ESIC applicability verified (ESI Act)', ok: (s?.esicApplicableEmployees ?? 0) > 0 },
                { label: 'Insured Person (IP) numbers mapped', ok: calcRows.every(r => !!r.ipNumber) },
                { label: '0.75% Employee & 3.25% Employer shares calculated', ok: (s?.totalContribution ?? 0) > 0 },
                { label: 'Monthly contribution record generated', ok: !!ps.contributionRecord },
                { label: 'ESIC Challan generated', ok: !!ps.challanRecord },
                { label: 'Payment / Challan completed with UTR', ok: !!ps.paymentRecord },
                { label: 'Submitted to ESIC Portal', ok: !!ps.submissionRecord },
              ].map(v => (
                <div
                  key={v.label}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs font-medium ${
                    v.ok ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-white border-slate-200 text-slate-500'
                  }`}
                >
                  {v.ok ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 flex-shrink-0" />
                  )}
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
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <CardTitle className="text-base font-semibold text-slate-900">Audit History — {periodLbl}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="relative pl-5">
            <div className="absolute left-[9px] top-1 bottom-1 w-px bg-slate-200" />
            <div className="space-y-3">
              {[
                { action: 'Employee Master & IP Synced', done: calcRows.length > 0, user: 'System' },
                { action: 'Salary Structures Verified', done: (s?.esicApplicableEmployees ?? 0) > 0, user: 'System' },
                { action: 'ESIC Contributions Calculated (0.75% + 3.25%)', done: (s?.totalContribution ?? 0) > 0, user: 'System' },
                { action: 'Monthly Contribution Record Generated', done: !!ps.contributionRecord, user: 'Super Admin', detail: ps.contributionRecord?.contributionId },
                { action: 'ESIC Challan Created', done: !!ps.challanRecord, user: 'Super Admin', detail: ps.challanRecord?.challanNo },
                { action: 'Payment Completed', done: !!ps.paymentRecord, user: 'Super Admin', detail: ps.paymentRecord ? `UTR: ${ps.paymentRecord.paymentRef}` : undefined },
                { action: 'Submitted to ESIC Portal', done: !!ps.submissionRecord, user: 'Super Admin', detail: ps.submissionRecord?.ackNo },
              ].map(a => (
                <div key={a.action} className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center border-2 ${
                      a.done ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'
                    }`}
                  >
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

      {/* ═══ INTERACTIVE MODALS ═════════════════════════════════════ */}

      {/* 1. Generate Contribution Modal */}
      <Dialog open={contributionModalOpen} onOpenChange={setContributionModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-slate-900">
              <ClipboardCheck className="w-5 h-5 text-indigo-600" />
              Generate ESIC Monthly Contribution
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <div className="rounded-lg border border-slate-200 divide-y divide-slate-100">
              {[
                { label: 'Period', value: periodLbl },
                { label: 'Employer / ESIC Code', value: data?.employerCode || '—' },
                { label: 'Employee Count', value: String(s?.esicApplicableEmployees ?? 0) },
                { label: 'Total ESIC Wages', value: INR(s?.totalEsicWage) },
                { label: 'Employee Contribution (0.75%)', value: INR(s?.totalEmployeeShare) },
                { label: 'Employer Contribution (3.25%)', value: INR(s?.totalEmployerShare) },
                { label: 'Total Contribution (4.00%)', value: INR(s?.totalContribution), bold: true },
              ].map(r => (
                <div key={r.label} className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-slate-500">{r.label}</span>
                  <span className={`font-semibold font-mono ${r.bold ? 'text-indigo-700 text-base' : 'text-slate-800'}`}>{r.value}</span>
                </div>
              ))}
            </div>

            {/* Employee-wise contribution breakdown table */}
            <div>
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Employee-Wise Contribution Breakdown</p>
              <div className="rounded-lg border border-slate-200 overflow-hidden max-h-44 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-2 px-3 text-left font-semibold text-slate-500">Employee</th>
                      <th className="py-2 px-3 text-left font-semibold text-slate-500">IP Number</th>
                      <th className="py-2 px-3 text-right font-semibold text-slate-500">Wage</th>
                      <th className="py-2 px-3 text-right font-semibold text-slate-500">0.75%</th>
                      <th className="py-2 px-3 text-right font-semibold text-slate-500">3.25%</th>
                      <th className="py-2 px-3 text-right font-semibold text-slate-500">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {calcRows.map(r => (
                      <tr key={r.employeeId}>
                        <td className="py-2 px-3 font-medium text-slate-800">{r.name}</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{r.ipNumber}</td>
                        <td className="py-2 px-3 font-mono text-slate-600 text-right">{INR(r.esicWage)}</td>
                        <td className="py-2 px-3 font-mono text-slate-600 text-right">{INR(r.employeeShare)}</td>
                        <td className="py-2 px-3 font-mono text-slate-600 text-right">{INR(r.employerShare)}</td>
                        <td className="py-2 px-3 font-mono font-bold text-indigo-700 text-right">{INR(r.totalContribution)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t font-bold">
                    <tr>
                      <td colSpan={2} className="py-2 px-3 text-slate-900">Total</td>
                      <td className="py-2 px-3 font-mono text-right">{INR(s?.totalEsicWage)}</td>
                      <td className="py-2 px-3 font-mono text-right">{INR(s?.totalEmployeeShare)}</td>
                      <td className="py-2 px-3 font-mono text-right">{INR(s?.totalEmployerShare)}</td>
                      <td className="py-2 px-3 font-mono text-indigo-700 text-right">{INR(s?.totalContribution)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Validation checks */}
            <div>
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Validation Checks</p>
              <div className="space-y-1.5">
                {[
                  { label: 'Payroll finalized for active assignments', ok: calcRows.length > 0 },
                  { label: 'ESIC applicability verified', ok: (s?.esicApplicableEmployees ?? 0) > 0 },
                  { label: 'Employee IP details available', ok: calcRows.every(r => !!r.ipNumber) },
                  { label: 'Contribution calculated (0.75% + 3.25% = 4.00%)', ok: (s?.totalContribution ?? 0) > 0 },
                ].map(v => (
                  <div key={v.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${v.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
                    {v.ok ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
                    {v.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="border-slate-200 text-slate-700 cursor-pointer" onClick={() => setContributionModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[170px] cursor-pointer" onClick={handleConfirmGenerateContribution}>
              <ClipboardCheck className="w-4 h-4 mr-1.5" />Generate Contribution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Generate Challan Modal */}
      <Dialog open={challanModalOpen} onOpenChange={setChallanModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-slate-900">
              <Receipt className="w-5 h-5 text-indigo-600" />
              Generate ESIC Challan
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <div className="rounded-lg border border-slate-200 divide-y divide-slate-100">
              {[
                { label: 'Period', value: periodLbl },
                { label: 'Employer Code', value: data?.employerCode || '—' },
                { label: 'Contribution Reference', value: ps.contributionRecord?.contributionId || `ESIC-CONTRIB-${period.replace('-', '')}-001` },
                { label: 'Employee Count', value: String(s?.esicApplicableEmployees ?? 0) },
                { label: 'Employee Share (0.75%)', value: INR(s?.totalEmployeeShare) },
                { label: 'Employer Share (3.25%)', value: INR(s?.totalEmployerShare) },
                { label: 'Total Payable', value: INR(s?.totalContribution), bold: true },
                { label: 'Statutory Due Date', value: data?.dueDate || '15th of next month' },
              ].map(r => (
                <div key={r.label} className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-slate-500">{r.label}</span>
                  <span className={`font-semibold font-mono ${r.bold ? 'text-indigo-700 text-base' : 'text-slate-800'}`}>{r.value}</span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-800">Validation Status: Ready for Challan</p>
                <p className="text-[11px] text-emerald-700">Monthly contribution has been verified against employee master wages.</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="border-slate-200 text-slate-700 cursor-pointer" onClick={() => setChallanModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[160px] cursor-pointer" onClick={handleConfirmGenerateChallan}>
              <Receipt className="w-4 h-4 mr-1.5" />Generate Challan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. Record Payment Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-slate-900">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              Record ESIC Payment & UTR
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {[
              { label: 'Period', value: periodLbl, readOnly: true },
              { label: 'Challan Number', key: 'challanNo', readOnly: true },
              { label: 'Payable Amount (₹)', key: 'amount', readOnly: true },
              { label: 'Payment Mode / Bank', key: 'bankMode', readOnly: false },
              { label: 'Payment Reference / UTR *', key: 'paymentRef', readOnly: false },
              { label: 'Payment Date *', key: 'paymentDate', readOnly: false, type: 'date' },
            ].map(f => (
              <div key={f.label} className="grid grid-cols-5 gap-2 items-center">
                <Label className="text-xs text-slate-600 font-medium col-span-2">{f.label}</Label>
                <Input
                  type={f.type || 'text'}
                  value={f.key ? (paymentForm as any)[f.key] : (f.value || '')}
                  readOnly={f.readOnly}
                  disabled={f.readOnly}
                  onChange={e => f.key && setPaymentForm(p => ({ ...p, [f.key!]: e.target.value }))}
                  className="h-8 text-sm col-span-3 border-slate-300 focus:border-indigo-500"
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="border-slate-200 text-slate-700 cursor-pointer" onClick={() => setPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[180px] cursor-pointer" onClick={handleConfirmPayment}>
              <CheckCircle2 className="w-4 h-4 mr-1.5" />Mark Payment Completed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. Preview & Download Modal */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-slate-900">
              <FileText className="w-5 h-5 text-indigo-600" />
              ESIC Return Preview
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <div className="rounded-lg border border-slate-200 divide-y divide-slate-100">
              {[
                { label: 'Return Period', value: periodLbl },
                { label: 'Employer Details', value: `${data?.employerCode || 'ESIC'} (Maharashtra)` },
                { label: 'Employee Count', value: String(s?.esicApplicableEmployees ?? 0) },
                { label: 'Total ESIC Wage', value: INR(s?.totalEsicWage) },
                { label: 'Employee Contribution', value: INR(s?.totalEmployeeShare) },
                { label: 'Employer Contribution', value: INR(s?.totalEmployerShare) },
                { label: 'Total Contribution', value: INR(s?.totalContribution), bold: true },
                { label: 'Challan Number / Reference', value: ps.challanRecord?.challanNo || 'Pending' },
                { label: 'Submission Status', value: ps.lifecycleStatus.replace('_', ' ') },
              ].map(r => (
                <div key={r.label} className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-slate-500">{r.label}</span>
                  <span className={`font-semibold font-mono ${r.bold ? 'text-indigo-700 text-base' : 'text-slate-800'}`}>{r.value}</span>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Employee-Wise Records</p>
              <div className="rounded-lg border border-slate-200 overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-2 px-3 text-left font-semibold text-slate-500">Employee</th>
                      <th className="py-2 px-3 text-left font-semibold text-slate-500">IP Number</th>
                      <th className="py-2 px-3 text-right font-semibold text-slate-500">Wage</th>
                      <th className="py-2 px-3 text-right font-semibold text-slate-500">0.75%</th>
                      <th className="py-2 px-3 text-right font-semibold text-slate-500">3.25%</th>
                      <th className="py-2 px-3 text-right font-semibold text-slate-500">Total (4%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {calcRows.map(r => (
                      <tr key={r.employeeId}>
                        <td className="py-2 px-3 font-medium text-slate-800">{r.name}</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{r.ipNumber}</td>
                        <td className="py-2 px-3 font-mono text-slate-600 text-right">{INR(r.esicWage)}</td>
                        <td className="py-2 px-3 font-mono text-slate-600 text-right">{INR(r.employeeShare)}</td>
                        <td className="py-2 px-3 font-mono text-slate-600 text-right">{INR(r.employerShare)}</td>
                        <td className="py-2 px-3 font-mono font-bold text-indigo-700 text-right">{INR(r.totalContribution)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t font-bold">
                    <tr>
                      <td colSpan={2} className="py-2 px-3 text-slate-900">Total</td>
                      <td className="py-2 px-3 font-mono text-slate-900 text-right">{INR(s?.totalEsicWage)}</td>
                      <td className="py-2 px-3 font-mono text-slate-900 text-right">{INR(s?.totalEmployeeShare)}</td>
                      <td className="py-2 px-3 font-mono text-slate-900 text-right">{INR(s?.totalEmployerShare)}</td>
                      <td className="py-2 px-3 font-mono text-indigo-700 text-right">{INR(s?.totalContribution)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="border-slate-200 text-slate-700 cursor-pointer" onClick={() => setPreviewModalOpen(false)}>
              Close
            </Button>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 cursor-pointer" onClick={handleDownloadContributionCsv}>
              <Download className="w-4 h-4" />Download Return (CSV)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 5. Mark Submitted Modal */}
      <Dialog open={submissionModalOpen} onOpenChange={setSubmissionModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-slate-900">
              <BadgeCheck className="w-5 h-5 text-emerald-600" />
              Mark ESIC Submitted
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <div className="rounded-lg border border-slate-200 divide-y divide-slate-100">
              {[
                { label: 'Period', value: periodLbl },
                { label: 'Employer Code', value: data?.employerCode || '—' },
                { label: 'Contribution Reference', value: ps.contributionRecord?.contributionId || `ESIC-CONTRIB-${period.replace('-', '')}-001` },
                { label: 'Challan Number', value: ps.challanRecord?.challanNo || '—' },
                { label: 'Total Contribution', value: INR(s?.totalContribution) },
                { label: 'Payment Reference / UTR', value: ps.paymentRecord?.paymentRef || 'Pending' },
                { label: 'Payment Date', value: ps.paymentRecord?.paymentDate || '—' },
              ].map(r => (
                <div key={r.label} className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-slate-500">{r.label}</span>
                  <span className="font-semibold text-slate-800">{r.value}</span>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">Filing & Acknowledgement Details</p>
              <div className="space-y-3">
                <div className="grid grid-cols-5 gap-2 items-center">
                  <Label className="text-xs text-slate-600 font-medium col-span-2">Submission Date *</Label>
                  <Input
                    type="date"
                    value={submissionForm.submissionDate}
                    onChange={e => setSubmissionForm(p => ({ ...p, submissionDate: e.target.value }))}
                    className="h-8 text-sm col-span-3 border-slate-300 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-5 gap-2 items-center">
                  <Label className="text-xs text-slate-600 font-medium col-span-2">Acknowledgement No. *</Label>
                  <Input
                    type="text"
                    value={submissionForm.ackNo}
                    placeholder="e.g. ACK92837482"
                    onChange={e => setSubmissionForm(p => ({ ...p, ackNo: e.target.value }))}
                    className="h-8 text-sm col-span-3 border-slate-300 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-5 gap-2 items-center">
                  <Label className="text-xs text-slate-600 font-medium col-span-2">Filing / Submission Ref</Label>
                  <Input
                    type="text"
                    value={submissionForm.submissionRef}
                    placeholder="e.g. ESIC-SUB-202609-001"
                    onChange={e => setSubmissionForm(p => ({ ...p, submissionRef: e.target.value }))}
                    className="h-8 text-sm col-span-3 border-slate-300 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-5 gap-2 items-center">
                  <Label className="text-xs text-slate-600 font-medium col-span-2">Upload Ack. Receipt</Label>
                  <Input
                    type="file"
                    className="h-8 text-xs col-span-3 border-slate-300 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-indigo-50 file:text-indigo-700"
                  />
                </div>

                <div className="grid grid-cols-5 gap-2 items-center">
                  <Label className="text-xs text-slate-600 font-medium col-span-2">Notes</Label>
                  <Input
                    type="text"
                    value={submissionForm.notes}
                    placeholder="Optional filing remarks..."
                    onChange={e => setSubmissionForm(p => ({ ...p, notes: e.target.value }))}
                    className="h-8 text-sm col-span-3 border-slate-300 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 font-medium">This will mark ESIC monthly compliance for {periodLbl} as <strong>SUBMITTED / COMPLETED</strong>.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="border-slate-200 text-slate-700 cursor-pointer" onClick={() => setSubmissionModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[180px] cursor-pointer" onClick={handleConfirmSubmission}>
              <BadgeCheck className="w-4 h-4 mr-1.5" />Confirm Submission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default EsicModule;
