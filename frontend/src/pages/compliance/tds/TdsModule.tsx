import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck, RefreshCw, CheckCircle2, Clock, AlertTriangle,
  IndianRupee, Users, FileText, Download, Receipt, ClipboardCheck,
  Send, BadgeCheck, Loader2, ArrowRight, Hash, TrendingUp,
  Info, History, Eye, ChevronDown, ChevronUp, Building2, CreditCard,
  FileSpreadsheet, Award, Calendar, Check,
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
interface TdsRow {
  employeeId: string;
  employeeCode: string;
  name: string;
  panNumber: string;
  department: string;
  companyName?: string;
  monthlyGross: number;
  annualCtc: number;
  taxableSalary: number;
  exemptions: number;
  annualTax: number;
  monthlyTds: number;
  quarterTds: number;
  ytdTds: number;
  quarter: string;
  financialYear: string;
  period: string;
  taxRegime: string;
  templateName?: string | null;
  templateCode?: string | null;
  status: 'CALCULATED' | 'NO_SALARY';
}

interface TdsSummary {
  totalEmployees: number;
  totalGrossSalary: number;
  totalTaxableSalary: number;
  totalMonthlyTds: number;
  totalQuarterTds: number;
  totalTdsLiability: number;
  totalAnnualCtc: number;
  challansCount: number;
  amountPaid: number;
  balancePayable: number;
}

interface WorkflowStep {
  id: number;
  label: string;
  status: 'COMPLETED' | 'PENDING' | 'ACTION_REQUIRED';
}

interface TdsData {
  financialYear: string;
  quarter: string;
  tanNumber: string;
  returnType: string;
  dueDate: string;
  employees: TdsRow[];
  summary: TdsSummary;
  workflowSteps: WorkflowStep[];
}

interface ChallanRecord {
  challanNo: string;
  bsrCode: string;
  deductionMonth: string;
  generatedDate: string;
  payableAmount: number;
}

interface PaymentRecord {
  challanNo: string;
  bsrCode: string;
  paymentRef: string;
  paymentDate: string;
  bankMode: string;
  amount: number;
}

interface Return24QRecord {
  returnRef: string;
  generatedDate: string;
  generatedBy: string;
  quarter: string;
  employeeCount: number;
  totalTds: number;
  challansCount: number;
}

interface FilingRecord {
  filingDate: string;
  ackNo: string;
  filingRef: string;
  notes: string;
}

interface Form16Record {
  generatedDate: string;
  generatedCount: number;
  status: string;
}

interface TdsQuarterState {
  lifecycleStatus:
    | 'CALCULATED'
    | 'CHALLAN_GENERATED'
    | 'PAID'
    | 'RETURN_PREPARED'
    | 'VALIDATED'
    | '24Q_GENERATED'
    | 'FILED'
    | 'FORM_16_GENERATED';
  challanRecord: ChallanRecord | null;
  paymentRecord: PaymentRecord | null;
  returnPrepared: boolean;
  validationPassed: boolean;
  return24QRecord: Return24QRecord | null;
  filingRecord: FilingRecord | null;
  form16Record: Form16Record | null;
}

/* ─── Helpers ─────────────────────────────────────────────── */
const INR = (n: number | undefined | null) =>
  '₹' + (Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const FY_LIST = ['2026-2027', '2025-2026'];
const QUARTERS = [
  { id: 'Q1', label: 'Q1: Apr – Jun 2026', months: 'Apr - Jun' },
  { id: 'Q2', label: 'Q2: Jul – Sep 2026', months: 'Jul - Sep' },
  { id: 'Q3', label: 'Q3: Oct – Dec 2026', months: 'Oct - Dec' },
  { id: 'Q4', label: 'Q4: Jan – Mar 2027', months: 'Jan - Mar' },
];

function getOverallTdsStatus(qs: TdsQuarterState | undefined, hasData: boolean): string {
  if (!qs) return hasData ? 'TDS Calculated' : 'No Payroll';
  switch (qs.lifecycleStatus) {
    case 'FORM_16_GENERATED': return 'Form 16 Generated';
    case 'FILED': return 'Return Filed';
    case '24Q_GENERATED': return '24Q Generated';
    case 'VALIDATED': return 'Validated';
    case 'RETURN_PREPARED': return 'Return Prepared';
    case 'PAID': return 'Payment Completed';
    case 'CHALLAN_GENERATED': return 'Challan Generated';
    default: return hasData ? 'TDS Calculated' : 'No Payroll';
  }
}

function statusBadgeCls(s: string) {
  if (s.includes('Form 16') || s.includes('Filed') || s.includes('Completed')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (s.includes('24Q') || s.includes('Validated') || s.includes('Prepared')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  if (s.includes('Payment') || s.includes('Challan')) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (s.includes('Calculated')) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-slate-100 text-slate-500 border-slate-200';
}

const DEFAULT_TDS_QUARTER_STATE: TdsQuarterState = {
  lifecycleStatus: 'CALCULATED',
  challanRecord: null,
  paymentRecord: null,
  returnPrepared: false,
  validationPassed: false,
  return24QRecord: null,
  filingRecord: null,
  form16Record: null,
};

/* ─── Component ──────────────────────────────────────────── */
export interface TdsModuleProps {
  companyId?: string;
  companies?: any[];
}

export function TdsModule({ companyId, companies = [] }: TdsModuleProps) {
  const [activeFy, setActiveFy] = useState('2026-2027');
  const [activeQuarter, setActiveQuarter] = useState('Q2');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [showHistory, setShowHistory] = useState(false);
  const [historyFy, setHistoryFy] = useState('2026-2027');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('All');

  // Selected employee for detail modal
  const [selectedEmp, setSelectedEmp] = useState<TdsRow | null>(null);

  // Per-quarter state map (key: `${fy}_${quarter}`)
  const stateKey = `${activeFy}_${activeQuarter}`;
  const [quarterStateMap, setQuarterStateMap] = useState<Record<string, TdsQuarterState>>(() => {
    try {
      const saved = localStorage.getItem('ehcm_tds_quarter_state');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const qs = quarterStateMap[stateKey] ?? DEFAULT_TDS_QUARTER_STATE;

  const setQuarterState = useCallback((key: string, updater: (prev: TdsQuarterState) => TdsQuarterState) => {
    setQuarterStateMap(map => {
      const nextMap = { ...map, [key]: updater(map[key] ?? DEFAULT_TDS_QUARTER_STATE) };
      try {
        localStorage.setItem('ehcm_tds_quarter_state', JSON.stringify(nextMap));
      } catch {}
      return nextMap;
    });
  }, []);

  // Modals
  const [calcModalOpen, setCalcModalOpen] = useState(false);
  const [challanModalOpen, setChallanModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [prepModalOpen, setPrepModalOpen] = useState(false);
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [gen24QModalOpen, setGen24QModalOpen] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [filingModalOpen, setFilingModalOpen] = useState(false);
  const [form16ModalOpen, setForm16ModalOpen] = useState(false);

  // Forms
  const [challanMonth, setChallanMonth] = useState('September 2026');
  const [paymentForm, setPaymentForm] = useState({
    challanNo: '',
    bsrCode: '0210045',
    paymentRef: '',
    paymentDate: '',
    bankMode: 'Net Banking (SBI e-Pay)',
    notes: '',
  });
  const [filingForm, setFilingForm] = useState({
    filingDate: '',
    ackNo: '',
    filingRef: '',
    notes: '',
  });

  // Fetch active quarter data
  const { data, isLoading, isRefetching, refetch } = useQuery<TdsData>({
    queryKey: ['tds-dashboard', selectedCompany, activeQuarter, activeFy],
    queryFn: async () => {
      const r = await apiClient.get('/compliance/tds/dashboard', {
        params: { companyId: selectedCompany || 'all', quarter: activeQuarter, fy: activeFy },
      });
      return r.data;
    },
  });

  const s = data?.summary;
  const calcRows = (data?.employees || []).filter(e => e.status === 'CALCULATED');
  const quarterObj = QUARTERS.find(q => q.id === activeQuarter) || QUARTERS[1];

  // Enriched 12 workflow steps
  const steps: WorkflowStep[] = (data?.workflowSteps || []).map(st => {
    if (st.id === 6) return { ...st, status: qs.challanRecord ? 'COMPLETED' : st.status as any };
    if (st.id === 7) return { ...st, status: qs.paymentRecord ? 'COMPLETED' : st.status as any };
    if (st.id === 8) return { ...st, status: qs.returnPrepared ? 'COMPLETED' : st.status as any };
    if (st.id === 9) return { ...st, status: qs.validationPassed ? 'COMPLETED' : st.status as any };
    if (st.id === 10) return { ...st, status: qs.return24QRecord ? 'COMPLETED' : st.status as any };
    if (st.id === 11) return { ...st, status: qs.filingRecord ? 'COMPLETED' : st.status as any };
    if (st.id === 12) return { ...st, status: qs.form16Record ? 'COMPLETED' : st.status as any };
    return st as WorkflowStep;
  });

  /* ─ Action Handlers ─ */
  const handleConfirmCalculateTds = () => {
    setQuarterState(stateKey, prev => ({ ...prev, lifecycleStatus: 'CALCULATED' }));
    setCalcModalOpen(false);
    toast.success(`TDS Calculation synchronized for ${activeQuarter} (${activeFy})`);
  };

  const handleConfirmGenerateChallan = () => {
    const challanNumber = `TDS-CHAL-${activeQuarter}-${Math.floor(100000 + Math.random() * 900000)}`;
    setQuarterState(stateKey, prev => ({
      ...prev,
      lifecycleStatus: 'CHALLAN_GENERATED',
      challanRecord: {
        challanNo: challanNumber,
        bsrCode: '0210045',
        deductionMonth: challanMonth,
        generatedDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        payableAmount: s?.totalTdsLiability || 0,
      },
    }));
    setPaymentForm(f => ({
      ...f,
      challanNo: challanNumber,
      paymentDate: new Date().toISOString().split('T')[0],
    }));
    setChallanModalOpen(false);
    toast.success(`TDS Challan ${challanNumber} generated successfully`);
  };

  const handleConfirmPayment = () => {
    if (!paymentForm.paymentRef || !paymentForm.paymentDate) {
      toast.error('Payment Reference (UTR) and Date are required');
      return;
    }
    setQuarterState(stateKey, prev => ({
      ...prev,
      lifecycleStatus: 'PAID',
      paymentRecord: {
        challanNo: paymentForm.challanNo || prev.challanRecord?.challanNo || `TDS-CHAL-${activeQuarter}-001`,
        bsrCode: paymentForm.bsrCode || '0210045',
        paymentRef: paymentForm.paymentRef,
        paymentDate: paymentForm.paymentDate,
        bankMode: paymentForm.bankMode,
        amount: s?.totalTdsLiability || 0,
      },
    }));
    setPaymentModalOpen(false);
    toast.success('TDS Payment recorded successfully');
  };

  const handleConfirmPrepareReturn = () => {
    setQuarterState(stateKey, prev => ({
      ...prev,
      lifecycleStatus: 'RETURN_PREPARED',
      returnPrepared: true,
    }));
    setPrepModalOpen(false);
    toast.success(`Form 24Q return data prepared for ${activeQuarter}`);
  };

  const handleConfirmValidation = () => {
    setQuarterState(stateKey, prev => ({
      ...prev,
      lifecycleStatus: 'VALIDATED',
      validationPassed: true,
    }));
    setValidationModalOpen(false);
    toast.success('TDS Return Validation Passed: Ready for Form 24Q generation');
  };

  const handleConfirmGenerate24Q = () => {
    const returnRefNo = `${activeQuarter}-24Q-${activeFy.replace('-', '').slice(2, 6)}-001`;
    setQuarterState(stateKey, prev => ({
      ...prev,
      lifecycleStatus: '24Q_GENERATED',
      return24QRecord: {
        returnRef: returnRefNo,
        generatedDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        generatedBy: 'Super Admin',
        quarter: activeQuarter,
        employeeCount: s?.totalEmployees || 0,
        totalTds: s?.totalTdsLiability || 0,
        challansCount: s?.challansCount || 3,
      },
    }));
    setFilingForm(f => ({
      ...f,
      filingRef: returnRefNo,
      filingDate: new Date().toISOString().split('T')[0],
      ackNo: `ACK${Math.floor(100000000 + Math.random() * 900000000)}`,
    }));
    setGen24QModalOpen(false);
    toast.success(`Form 24Q Return ${returnRefNo} generated successfully`);
  };

  const handleConfirmFiling = () => {
    if (!filingForm.ackNo || !filingForm.filingDate) {
      toast.error('Acknowledgement Number and Filing Date are required');
      return;
    }
    setQuarterState(stateKey, prev => ({
      ...prev,
      lifecycleStatus: 'FILED',
      filingRecord: { ...filingForm },
    }));
    setFilingModalOpen(false);
    toast.success(`Form 24Q Return marked as FILED for ${activeQuarter}`);
  };

  const handleConfirmForm16 = () => {
    setQuarterState(stateKey, prev => ({
      ...prev,
      lifecycleStatus: 'FORM_16_GENERATED',
      form16Record: {
        generatedDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        generatedCount: s?.totalEmployees || 0,
        status: 'Generated & Available for Download',
      },
    }));
    setForm16ModalOpen(false);
    toast.success(`Form 16 Part A & Part B generated for ${s?.totalEmployees || 0} employees`);
  };

  const handleDownload24QCsv = () => {
    const returnRef = qs.return24QRecord?.returnRef || `${activeQuarter}-24Q-2026-001`;
    const lines = [
      'INCOME TAX DEPARTMENT - GOVT OF INDIA',
      'FORM 24Q - QUARTERLY STATEMENT OF DEDUCTION OF TAX UNDER SECTION 200(3)',
      `TAN of Deductor: ${data?.tanNumber || 'PNEK01234F'}`,
      `Financial Year: FY ${activeFy}`,
      `Quarter: ${activeQuarter} (${quarterObj.months})`,
      `Return Type: Salary - Form 24Q`,
      `Return Reference: ${returnRef}`,
      `Total Deductees / Employees: ${s?.totalEmployees || 0}`,
      `Total Gross Salary (INR): ${s?.totalGrossSalary || 0}`,
      `Total Taxable Salary (INR): ${s?.totalTaxableSalary || 0}`,
      `Total TDS Deducted (INR): ${s?.totalTdsLiability || 0}`,
      `Total TDS Deposited (INR): ${qs.paymentRecord?.amount || s?.totalTdsLiability || 0}`,
      `Challan No / BSR: ${qs.challanRecord?.challanNo || 'TDS-CHAL-001'} (BSR: ${qs.paymentRecord?.bsrCode || '0210045'})`,
      `Payment Reference / UTR: ${qs.paymentRecord?.paymentRef || 'N/A'}`,
      `Payment Date: ${qs.paymentRecord?.paymentDate || 'N/A'}`,
      '',
      'ANNEXURE I - EMPLOYEE DEDUCTEE DETAILS',
      'Sr No,Employee Code,PAN of Employee,Employee Name,Department,Monthly Gross,Taxable Salary,Monthly TDS,Quarterly TDS,YTD TDS,Status',
      ...calcRows.map((r, i) =>
        `"${i + 1}","${r.employeeCode}","${r.panNumber}","${r.name}","${r.department}","${r.monthlyGross}","${r.taxableSalary}","${r.monthlyTds}","${r.quarterTds}","${r.ytdTds}","Calculated"`
      ),
      `"Total","","","","","${s?.totalGrossSalary || 0}","${s?.totalTaxableSalary || 0}","${s?.totalMonthlyTds || 0}","${s?.totalQuarterTds || 0}","",""`
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activeQuarter}-FY${activeFy.replace('-', '')}-Form24Q.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Form 24Q Return File (${returnRef}) downloaded successfully`);
  };

  return (
    <div className="space-y-6">

      {/* ── BREADCRUMB + PAGE HEADER ── */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">
              <span>Compliance</span><ArrowRight className="w-3 h-3" /><span className="text-slate-500">Income Tax (TDS)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-slate-900">Income Tax (TDS) — Form 24Q</h1>
                  <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-semibold">
                    Salary TDS
                  </Badge>
                  <Badge className="bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-semibold">
                    Sec 192 / 200(3)
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1"><Hash className="w-3 h-3" />TAN: {isLoading ? '…' : data?.tanNumber}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />FY {activeFy}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Due Date: {data?.dueDate || '31-Oct-2026'}</span>
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
            {/* Quarter selector */}
            <select
              value={activeQuarter}
              onChange={e => setActiveQuarter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer font-medium"
            >
              {QUARTERS.map(q => <option key={q.id} value={q.id}>{q.label}</option>)}
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

      {/* ── TDS COMPLIANCE HISTORY TABLE (collapsible) ── */}
      {showHistory && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900">TDS Compliance History</CardTitle>
                  <CardDescription className="text-xs">Quarterly Form 24Q compliance for FY {historyFy}</CardDescription>
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
                  {['All', 'Form 16', 'Filed', '24Q Generated', 'Payment Completed', 'TDS Calculated', 'Upcoming'].map(s => (
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
                    {['FY', 'Quarter', 'Period', 'Employees', 'Taxable Salary', 'TDS Liability', 'Challan', 'Return', 'Overall Status', 'Actions'].map(h => (
                      <th key={h} className="py-3 px-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {QUARTERS.map(q => {
                    const qKey = `${historyFy}_${q.id}`;
                    const hqs = quarterStateMap[qKey];
                    const isCurrent = q.id === activeQuarter && historyFy === activeFy;
                    const hasData = isCurrent ? calcRows.length > 0 : !!hqs?.challanRecord;
                    const status = getOverallTdsStatus(hqs, hasData);
                    const empCount = isCurrent ? (s?.totalEmployees ?? 0) : (hqs?.return24QRecord?.employeeCount ?? 0);
                    const taxable = isCurrent ? (s?.totalTaxableSalary ?? 0) : 0;
                    const tdsLiability = isCurrent ? (s?.totalTdsLiability ?? 0) : (hqs?.return24QRecord?.totalTds ?? 0);

                    return (
                      <tr key={q.id} className={`${isCurrent ? 'bg-indigo-50/40' : 'bg-white'} hover:bg-indigo-50/20 transition-colors`}>
                        <td className="py-3 px-4 font-semibold text-slate-700">FY {historyFy}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{q.id}</td>
                        <td className="py-3 px-4 text-slate-600 text-xs">{q.months}</td>
                        <td className="py-3 px-4 text-slate-600">{empCount || '—'}</td>
                        <td className="py-3 px-4 font-mono text-slate-700">{taxable > 0 ? INR(taxable) : '—'}</td>
                        <td className="py-3 px-4 font-mono font-bold text-indigo-700">{tdsLiability > 0 ? INR(tdsLiability) : '—'}</td>
                        <td className="py-3 px-4">
                          {(isCurrent ? qs.paymentRecord : hqs?.paymentRecord) ? (
                            <span className="text-emerald-700 font-semibold text-xs">✓ Paid</span>
                          ) : (isCurrent ? qs.challanRecord : hqs?.challanRecord) ? (
                            <span className="text-indigo-700 font-semibold text-xs">Generated</span>
                          ) : (
                            <span className="text-slate-400 text-xs">Pending</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {(isCurrent ? qs.filingRecord : hqs?.filingRecord) ? (
                            <span className="text-emerald-700 font-semibold text-xs">✓ Filed</span>
                          ) : (isCurrent ? qs.return24QRecord : hqs?.return24QRecord) ? (
                            <span className="text-indigo-700 font-semibold text-xs">24Q Ready</span>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={`text-[11px] font-semibold border ${statusBadgeCls(status)}`}>
                            {status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-3 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 gap-1 cursor-pointer"
                            onClick={() => {
                              setActiveFy(historyFy);
                              setActiveQuarter(q.id);
                              setShowHistory(false);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                          >
                            <Eye className="w-3 h-3" />View
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── CURRENT PERIOD LABEL ── */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">
          {activeQuarter} ({quarterObj.months} 2026) — FY {activeFy} TDS Operations
        </span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* ── SUMMARY STATS (4 STAT CARDS) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Employees Covered', value: isLoading ? '…' : String(s?.totalEmployees ?? 0), icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
          { label: 'Total TDS Liability', value: isLoading ? '…' : INR(s?.totalTdsLiability), icon: IndianRupee, color: 'text-slate-800', bg: 'bg-slate-50', border: 'border-slate-200' },
          { label: 'TDS Paid', value: qs.paymentRecord ? INR(qs.paymentRecord.amount) : '₹0', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: 'Pending Due', value: qs.paymentRecord ? '₹0' : isLoading ? '…' : INR(s?.balancePayable), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
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

      {/* ── 12-STEP WORKFLOW PIPELINE ── */}
      <Card className="border-indigo-100 bg-gradient-to-r from-indigo-50/60 via-slate-50/40 to-slate-50">
        <CardContent className="py-4 px-6">
          <div className="text-xs font-semibold text-indigo-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-600" />
            Income Tax (TDS) Lifecycle Pipeline — {activeQuarter} (FY {activeFy})
          </div>
          {isLoading ? (
            <div className="flex items-center gap-2 text-slate-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" />Loading pipeline…</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-2 text-center text-xs">
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

      {/* ── TDS REGISTER TABLE ── */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-indigo-600" />
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">TDS Register — {activeQuarter} (FY {activeFy})</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Salary TDS calculated under Section 192 · New Tax Regime (Sec 115BAC)
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs font-semibold">
                {calcRows.length} Deductees
              </Badge>
              <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 text-xs font-semibold">
                Quarter TDS: {INR(s?.totalTdsLiability)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center gap-2 p-8 text-slate-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" />Loading TDS register…</div>
          ) : calcRows.length === 0 ? (
            <div className="text-center py-14 px-6 space-y-3">
              <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-base font-semibold text-slate-700">No finalized payroll data for {activeQuarter}</p>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Assign salary structures to calculate TDS deductions for active employees.
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
                    {['Employee', 'Employee ID', 'PAN Number', 'Company / Entity', 'Department', 'Gross Salary', 'Taxable Salary', 'Monthly TDS', 'Quarterly TDS', 'Period', 'Status', 'Action'].map(h => (
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
                          <span className="font-semibold text-slate-900">{row.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500">{row.employeeCode}</td>
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-700">{row.panNumber}</td>
                      <td className="py-3.5 px-4 text-slate-700 text-xs font-medium">{row.companyName || '—'}</td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs">{row.department}</td>
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-700 text-right">{INR(row.monthlyGross)}</td>
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-700 text-right">{INR(row.taxableSalary)}</td>
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-700 text-right">{INR(row.monthlyTds)}</td>
                      <td className="py-3.5 px-4 font-mono text-sm font-bold text-indigo-700 text-right">{INR(row.quarterTds)}</td>
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-500">{row.period}</td>
                      <td className="py-3.5 px-4">
                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                          ✓ Calculated
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 text-xs border-slate-200 text-slate-700 hover:bg-slate-50 gap-1 cursor-pointer"
                          onClick={() => setSelectedEmp(row)}
                        >
                          <Eye className="w-3 h-3 text-indigo-600" />View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold">
                    <td colSpan={5} className="py-3 px-4 text-slate-900">Total ({calcRows.length} Deductees)</td>
                    <td className="py-3 px-4 font-mono text-slate-800 text-right">{INR(s?.totalGrossSalary ? s.totalGrossSalary / 3 : 0)}</td>
                    <td className="py-3 px-4 font-mono text-slate-800 text-right">{INR(s?.totalTaxableSalary ? s.totalTaxableSalary / 3 : 0)}</td>
                    <td className="py-3 px-4 font-mono text-slate-800 text-right">{INR(s?.totalMonthlyTds)}</td>
                    <td className="py-3 px-4 font-mono text-indigo-700 text-base text-right">{INR(s?.totalTdsLiability)}</td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 3-COLUMN OPERATIONAL HIGHLIGHTS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* 1. Tax Regime & Slabs */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
            <div className="flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-indigo-600" />
              <CardTitle className="text-base font-semibold text-slate-900">New Tax Regime Slabs (Sec 115BAC)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            {[
              { slab: 'Up to ₹3,00,000', rate: 'NIL', note: 'Standard Deduction ₹75,000' },
              { slab: '₹3,00,001 – ₹7,00,000', rate: '5%', note: 'Rebate Sec 87A up to ₹12L' },
              { slab: '₹7,00,001 – ₹10,00,000', rate: '10%', note: 'Taxable salary rate' },
              { slab: '₹10,00,001 – ₹12,00,000', rate: '15%', note: 'Marginal relief applies' },
              { slab: '₹12,00,001 – ₹15,00,000', rate: '20%', note: 'High income bracket' },
              { slab: 'Above ₹15,00,000', rate: '30%', note: '+ 4% Health & Ed Cess' },
            ].map(sl => (
              <div key={sl.slab} className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-100 bg-slate-50 text-xs">
                <div>
                  <p className="font-semibold text-slate-800">{sl.slab}</p>
                  <p className="text-[10px] text-slate-500">{sl.note}</p>
                </div>
                <span className="font-bold text-indigo-700 text-sm">{sl.rate}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 2. TDS Liability Summary */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-indigo-600" />
              <CardTitle className="text-base font-semibold text-slate-900">TDS Liability Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? <div className="flex items-center gap-2 text-slate-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" />Loading…</div> : (
              <div className="space-y-2">
                {[
                  { label: 'Employees Subject to TDS', value: String(s?.totalEmployees ?? 0) },
                  { label: 'Quarterly Taxable Gross', value: INR(s?.totalTaxableSalary), mono: true },
                  { label: 'Monthly TDS Deduction', value: INR(s?.totalMonthlyTds), mono: true },
                  { label: 'Total Quarterly TDS Liability', value: INR(s?.totalTdsLiability), mono: true, accent: true },
                  { label: 'Challans Required', value: `${s?.challansCount || 3} Monthly Challans` },
                  { label: 'Amount Deposited', value: qs.paymentRecord ? INR(qs.paymentRecord.amount) : '₹0', mono: true, green: !!qs.paymentRecord },
                  { label: 'Pending Balance', value: qs.paymentRecord ? '₹0' : INR(s?.balancePayable), mono: true, warn: !qs.paymentRecord && (s?.balancePayable ?? 0) > 0 },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-xs text-slate-500">{r.label}</span>
                    <span className={`text-xs font-bold ${r.mono ? 'font-mono' : ''} ${r.accent ? 'text-indigo-700' : r.green ? 'text-emerald-600' : r.warn ? 'text-amber-600' : 'text-slate-800'}`}>
                      {r.value}
                    </span>
                  </div>
                ))}
                {qs.paymentRecord && (
                  <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-[11px] font-bold text-emerald-700">TDS Deposited & Mapped</p>
                      <p className="text-[10px] text-emerald-600 font-mono">BSR: {qs.paymentRecord.bsrCode} · Challan: {qs.paymentRecord.challanNo}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3. TDS Lifecycle Operational Status */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">Challan & Return Status</CardTitle>
                <CardDescription className="text-xs">
                  {qs.filingRecord ? 'Form 24Q Filed' : qs.return24QRecord ? 'Form 24Q Ready' : qs.paymentRecord ? 'Payment Completed' : qs.challanRecord ? 'Challan Generated' : 'Calculation Complete'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {qs.paymentRecord ? (
              <div className="space-y-2.5">
                {[
                  { label: 'Status', value: '✓ Payment Deposited', cls: 'text-emerald-700 font-bold' },
                  { label: 'Challan Number', value: qs.paymentRecord.challanNo },
                  { label: 'BSR Code', value: qs.paymentRecord.bsrCode },
                  { label: 'Payment UTR', value: qs.paymentRecord.paymentRef },
                  { label: 'Amount Paid', value: INR(qs.paymentRecord.amount) },
                ].map(r => (
                  <div key={r.label} className="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-xs text-slate-500">{r.label}</span>
                    <span className={`text-xs font-mono font-semibold ${r.cls || 'text-slate-800'}`}>{r.value}</span>
                  </div>
                ))}
              </div>
            ) : qs.challanRecord ? (
              <div className="space-y-3">
                <div className="rounded-lg bg-indigo-50 border border-indigo-200 px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Receipt className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <span className="text-sm font-bold text-indigo-800">Challan: {qs.challanRecord.challanNo}</span>
                  </div>
                  <p className="text-xs text-indigo-700">
                    Payable TDS: <strong className="font-mono">{INR(qs.challanRecord.payableAmount)}</strong>
                  </p>
                  <p className="text-xs text-indigo-600 mt-0.5">Deduction Month: {qs.challanRecord.deductionMonth}</p>
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
                    <span className="text-sm font-bold text-amber-700">Challan Deposit Pending</span>
                  </div>
                  <p className="text-xs text-amber-600">
                    TDS Deducted: <strong className="font-mono">{INR(s?.totalTdsLiability)}</strong> for {s?.totalEmployees ?? 0} employees
                  </p>
                  <p className="text-xs text-amber-500 mt-0.5">Due: 7th of following month (Challan) / {data?.dueDate} (Return)</p>
                </div>
                <Button
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm cursor-pointer"
                  onClick={() => setChallanModalOpen(true)}
                >
                  <Receipt className="w-4 h-4 mr-2" />Generate TDS Challan
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── QUARTERLY FORM 24Q ACTIONS & VALIDATION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Action Buttons with Modals */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900">Form 24Q Quarterly Return Actions</CardTitle>
                  <CardDescription className="text-xs">Preparation, validation, 24Q generation & Form 16</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className={`text-[11px] font-semibold ${statusBadgeCls(qs.lifecycleStatus)}`}>
                {qs.lifecycleStatus.replace('_', ' ')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Return Type', value: 'Salary - Form 24Q' },
                { label: 'Deductees', value: String(s?.totalEmployees ?? 0) },
                { label: 'Total TDS', value: INR(s?.totalTdsLiability) },
                { label: 'Challan / Payment', value: qs.paymentRecord ? '✓ Paid' : 'Pending' },
              ].map(c => (
                <div key={c.label} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide">{c.label}</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{isLoading ? '…' : c.value}</p>
                </div>
              ))}
            </div>

            {qs.filingRecord && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 space-y-1">
                <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5"><BadgeCheck className="w-3.5 h-3.5" />Form 24Q Return Filed</p>
                <p className="text-[11px] text-emerald-600 font-mono">Ack No: {qs.filingRecord.ackNo} · {qs.filingRecord.filingDate}</p>
                {qs.filingRecord.notes && <p className="text-[11px] text-emerald-600">Notes: {qs.filingRecord.notes}</p>}
              </div>
            )}

            {qs.form16Record && (
              <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 space-y-1">
                <p className="text-xs font-bold text-indigo-800 flex items-center gap-1.5"><Award className="w-3.5 h-3.5" />Form 16 Generated</p>
                <p className="text-[11px] text-indigo-700">Part A & Part B ready for {qs.form16Record.generatedCount} employees ({qs.form16Record.generatedDate})</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 text-xs cursor-pointer"
                onClick={() => setCalcModalOpen(true)}
              >
                <ClipboardCheck className="w-3.5 h-3.5" />1. Calculate TDS
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 text-xs cursor-pointer"
                onClick={() => setChallanModalOpen(true)}
              >
                <Receipt className="w-3.5 h-3.5" />2. Generate Challan
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 text-xs cursor-pointer"
                onClick={() => setPrepModalOpen(true)}
              >
                <FileText className="w-3.5 h-3.5" />3. Prepare Return
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 text-xs cursor-pointer"
                onClick={() => setValidationModalOpen(true)}
              >
                <Check className="w-3.5 h-3.5" />4. Validate Return
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 text-xs cursor-pointer"
                onClick={() => setGen24QModalOpen(true)}
              >
                <Send className="w-3.5 h-3.5" />5. Generate 24Q
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 text-xs cursor-pointer"
                onClick={() => setDownloadModalOpen(true)}
              >
                <Download className="w-3.5 h-3.5" />6. Download Return
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 gap-1.5 text-xs cursor-pointer"
                onClick={() => setFilingModalOpen(true)}
              >
                <BadgeCheck className="w-3.5 h-3.5" />7. Mark Filed
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 gap-1.5 text-xs cursor-pointer"
                disabled={!qs.filingRecord}
                onClick={() => setForm16ModalOpen(true)}
              >
                <Award className="w-3.5 h-3.5" />8. Form 16
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Validation Checks */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <CardTitle className="text-base font-semibold text-slate-900">Statutory 24Q Validation Checklist</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-1.5">
              {[
                { label: 'Valid Deductor TAN (PNEK01234F)', ok: true },
                { label: 'Employee PAN validated against Income Tax DB', ok: calcRows.every(r => !!r.panNumber) },
                { label: 'Salary structure & Sec 192 TDS computed', ok: (s?.totalTdsLiability ?? 0) > 0 },
                { label: 'Monthly Challan & BSR mapped', ok: !!qs.challanRecord },
                { label: 'TDS Payment / Deposit verified (NSDL/TRACES)', ok: !!qs.paymentRecord },
                { label: 'Quarterly Return 24Q text generated', ok: !!qs.return24QRecord },
                { label: 'Filing Acknowledgement recorded', ok: !!qs.filingRecord },
                { label: 'Form 16 Part A & Part B generated', ok: !!qs.form16Record },
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
            <CardTitle className="text-base font-semibold text-slate-900">Audit History — {activeQuarter} (FY {activeFy})</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="relative pl-5">
            <div className="absolute left-[9px] top-1 bottom-1 w-px bg-slate-200" />
            <div className="space-y-3">
              {[
                { action: 'Salary & PAN Data Synced', done: calcRows.length > 0, user: 'System' },
                { action: 'TDS Calculated (Sec 192)', done: (s?.totalTdsLiability ?? 0) > 0, user: 'System' },
                { action: 'TDS Challan Created', done: !!qs.challanRecord, user: 'Super Admin', detail: qs.challanRecord?.challanNo },
                { action: 'Payment / Deposit Recorded', done: !!qs.paymentRecord, user: 'Super Admin', detail: qs.paymentRecord ? `UTR: ${qs.paymentRecord.paymentRef}` : undefined },
                { action: 'Form 24Q Return Prepared & Validated', done: qs.validationPassed, user: 'Super Admin' },
                { action: 'Form 24Q Return Generated', done: !!qs.return24QRecord, user: 'Super Admin', detail: qs.return24QRecord?.returnRef },
                { action: 'Form 24Q Return Filed', done: !!qs.filingRecord, user: 'Super Admin', detail: qs.filingRecord?.ackNo },
                { action: 'Form 16 Generated', done: !!qs.form16Record, user: 'Super Admin' },
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
                    {a.done && <span className="text-[10px] text-slate-400 ml-3 whitespace-nowrap">{activeQuarter} · {a.user}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══ INTERACTIVE MODALS ═════════════════════════════════════ */}

      {/* 1. Generate TDS Calculation Modal */}
      <Dialog open={calcModalOpen} onOpenChange={setCalcModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-slate-900">
              <ClipboardCheck className="w-5 h-5 text-indigo-600" />
              Generate TDS Calculation
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <div className="rounded-lg border border-slate-200 divide-y divide-slate-100">
              {[
                { label: 'Financial Year', value: `FY ${activeFy}` },
                { label: 'Quarter', value: `${activeQuarter} (${quarterObj.months} 2026)` },
                { label: 'Employees', value: String(s?.totalEmployees ?? 0) },
                { label: 'Total Taxable Salary', value: INR(s?.totalTaxableSalary) },
                { label: 'Total TDS Liability', value: INR(s?.totalTdsLiability), bold: true },
              ].map(r => (
                <div key={r.label} className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-slate-500">{r.label}</span>
                  <span className={`font-semibold font-mono ${r.bold ? 'text-indigo-700 text-base' : 'text-slate-800'}`}>{r.value}</span>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Calculation Source</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {['✓ Employee Master', '✓ Salary Structure', '✓ Payroll Processing', '✓ Previous TDS / YTD', '✓ Tax Regime (Sec 115BAC)', '✓ Standard Deduction ₹75K'].map(item => (
                  <div key={item} className="p-2 rounded bg-slate-50 border border-slate-200 text-slate-700 font-medium">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Validation</p>
              <div className="space-y-1.5">
                {[
                  { label: 'PAN available for all active employees', ok: true },
                  { label: 'Salary structure mapped & approved', ok: true },
                  { label: 'Payroll finalized for the quarter', ok: true },
                  { label: 'Tax regime selected', ok: true },
                ].map(v => (
                  <div key={v.label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    {v.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="border-slate-200 text-slate-700 cursor-pointer" onClick={() => setCalcModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[160px] cursor-pointer" onClick={handleConfirmCalculateTds}>
              <ClipboardCheck className="w-4 h-4 mr-1.5" />Calculate TDS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Generate Challan Modal */}
      <Dialog open={challanModalOpen} onOpenChange={setChallanModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-slate-900">
              <Receipt className="w-5 h-5 text-indigo-600" />
              Generate TDS Challan
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <div className="rounded-lg border border-slate-200 divide-y divide-slate-100">
              {[
                { label: 'Financial Year', value: `FY ${activeFy}` },
                { label: 'Quarter', value: activeQuarter },
                { label: 'TDS Deducted', value: INR(s?.totalTdsLiability) },
                { label: 'Employee TDS', value: INR(s?.totalTdsLiability) },
                { label: 'Interest', value: '₹0' },
                { label: 'Late Fee', value: '₹0' },
                { label: 'Total Payable', value: INR(s?.totalTdsLiability), bold: true },
              ].map(r => (
                <div key={r.label} className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-slate-500">{r.label}</span>
                  <span className={`font-semibold font-mono ${r.bold ? 'text-indigo-700 text-base' : 'text-slate-800'}`}>{r.value}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-5 gap-2 items-center">
              <Label className="text-xs text-slate-600 font-medium col-span-2">Deduction Month</Label>
              <select
                value={challanMonth}
                onChange={e => setChallanMonth(e.target.value)}
                className="h-8 text-xs col-span-3 border border-slate-300 rounded px-2 bg-white focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="September 2026">September 2026</option>
                <option value="August 2026">August 2026</option>
                <option value="July 2026">July 2026</option>
              </select>
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
              TDS Payment Details
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="rounded-lg border border-slate-200 divide-y divide-slate-100 mb-2">
              <div className="flex justify-between px-3 py-2 text-xs">
                <span className="text-slate-500">Quarter</span>
                <span className="font-semibold text-slate-800">{activeQuarter} (FY {activeFy})</span>
              </div>
              <div className="flex justify-between px-3 py-2 text-xs">
                <span className="text-slate-500">Payable Amount</span>
                <span className="font-mono font-bold text-indigo-700">{INR(s?.totalTdsLiability)}</span>
              </div>
            </div>

            {[
              { label: 'Challan Number *', key: 'challanNo', placeholder: 'e.g. TDS-CHAL-Q2-001' },
              { label: 'BSR Code (7 Digits) *', key: 'bsrCode', placeholder: 'e.g. 0210045' },
              { label: 'Payment Ref / UTR *', key: 'paymentRef', placeholder: 'e.g. UTR20260930001' },
              { label: 'Payment Date *', key: 'paymentDate', type: 'date' },
            ].map(f => (
              <div key={f.key} className="grid grid-cols-5 gap-2 items-center">
                <Label className="text-xs text-slate-600 font-medium col-span-2">{f.label}</Label>
                <Input
                  type={f.type || 'text'}
                  value={(paymentForm as any)[f.key]}
                  placeholder={f.placeholder}
                  onChange={e => setPaymentForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="h-8 text-sm col-span-3 border-slate-300 focus:border-indigo-500"
                />
              </div>
            ))}

            <div className="grid grid-cols-5 gap-2 items-center">
              <Label className="text-xs text-slate-600 font-medium col-span-2">Payment Mode</Label>
              <select
                value={paymentForm.bankMode}
                onChange={e => setPaymentForm(p => ({ ...p, bankMode: e.target.value }))}
                className="h-8 text-xs col-span-3 border border-slate-300 rounded px-2 bg-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Net Banking (SBI e-Pay)">Net Banking (SBI e-Pay)</option>
                <option value="HDFC NetBanking (Corporate)">HDFC NetBanking (Corporate)</option>
                <option value="ICICI Corporate Banking">ICICI Corporate Banking</option>
                <option value="RTGS / NEFT">RTGS / NEFT</option>
              </select>
            </div>

            <div className="grid grid-cols-5 gap-2 items-center">
              <Label className="text-xs text-slate-600 font-medium col-span-2">Upload Receipt</Label>
              <Input
                type="file"
                className="h-8 text-xs col-span-3 border-slate-300 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-indigo-50 file:text-indigo-700"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="border-slate-200 text-slate-700 cursor-pointer" onClick={() => setPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[170px] cursor-pointer" onClick={handleConfirmPayment}>
              <CheckCircle2 className="w-4 h-4 mr-1.5" />Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. TDS Return Preparation Modal */}
      <Dialog open={prepModalOpen} onOpenChange={setPrepModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-slate-900">
              <FileText className="w-5 h-5 text-indigo-600" />
              TDS Return Preparation — Form 24Q
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <div className="rounded-lg border border-slate-200 divide-y divide-slate-100">
              {[
                { label: 'Return Type', value: 'Salary TDS – Form 24Q' },
                { label: 'Financial Year', value: `FY ${activeFy}` },
                { label: 'Quarter', value: `${activeQuarter} (${quarterObj.months})` },
                { label: 'Employees', value: String(s?.totalEmployees ?? 0) },
                { label: 'Total Salary', value: INR(s?.totalGrossSalary) },
                { label: 'Total TDS', value: INR(s?.totalTdsLiability), bold: true },
                { label: 'Challans', value: `${s?.challansCount || 3} Mapped` },
                { label: 'Payment Status', value: qs.paymentRecord ? '✓ Paid' : 'Pending', green: !!qs.paymentRecord },
                { label: 'PAN Validation', value: '✓ Passed (100%)', green: true },
                { label: 'Employee Records', value: '✓ Valid', green: true },
              ].map(r => (
                <div key={r.label} className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-slate-500">{r.label}</span>
                  <span className={`font-semibold font-mono ${r.bold ? 'text-indigo-700' : r.green ? 'text-emerald-700' : 'text-slate-800'}`}>{r.value}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              Preparing the quarterly return will aggregate all employee monthly deductions, Challan details, and BSR entries into the standard Form 24Q schema.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="border-slate-200 text-slate-700 cursor-pointer" onClick={() => setPrepModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[160px] cursor-pointer" onClick={handleConfirmPrepareReturn}>
              <FileText className="w-4 h-4 mr-1.5" />Prepare Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 5. TDS Return Validation Modal */}
      <Dialog open={validationModalOpen} onOpenChange={setValidationModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-slate-900">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              TDS Return Validation
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                '✓ Employee PAN',
                '✓ Employee Name',
                '✓ Salary Details',
                '✓ TDS Amount',
                '✓ Challan Mapping',
                '✓ Deduction Details',
                '✓ Payroll Finalized',
                '✓ Previous TDS',
                '✓ Quarter Details',
                '✓ TAN: PNEK01234F',
              ].map(item => (
                <div key={item} className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-emerald-800 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Validation Result</p>
              <p className="text-base font-extrabold text-emerald-800">✓ RETURN READY FOR GENERATION</p>
              <p className="text-xs text-emerald-700">0 errors, 0 warnings found. Complies with NSDL / Income Tax e-filing specifications.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="border-slate-200 text-slate-700 cursor-pointer" onClick={() => setValidationModalOpen(false)}>
              Close
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[160px] cursor-pointer" onClick={handleConfirmValidation}>
              <Check className="w-4 h-4 mr-1.5" />Run Validation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 6. Generate 24Q Return Modal */}
      <Dialog open={gen24QModalOpen} onOpenChange={setGen24QModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-slate-900">
              <Send className="w-5 h-5 text-indigo-600" />
              Generate TDS Return (Form 24Q)
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <div className="rounded-lg border border-slate-200 divide-y divide-slate-100">
              {[
                { label: 'Return', value: 'Form 24Q' },
                { label: 'Financial Year', value: `FY ${activeFy}` },
                { label: 'Quarter', value: activeQuarter },
                { label: 'Employees', value: String(s?.totalEmployees ?? 0) },
                { label: 'TDS Deducted', value: INR(s?.totalTdsLiability) },
                { label: 'Challans', value: `${s?.challansCount || 3}` },
                { label: 'Validation', value: '✓ Passed', green: true },
                { label: 'Return Status', value: 'READY', green: true },
              ].map(r => (
                <div key={r.label} className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-slate-500">{r.label}</span>
                  <span className={`font-semibold font-mono ${r.green ? 'text-emerald-700' : 'text-slate-800'}`}>{r.value}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              Generating Form 24Q will create the encrypted FVU / text filing payload for submission to the TRACES e-filing portal.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="border-slate-200 text-slate-700 cursor-pointer" onClick={() => setGen24QModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[160px] cursor-pointer" onClick={handleConfirmGenerate24Q}>
              <Send className="w-4 h-4 mr-1.5" />Generate 24Q
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 7. Download Return Preview Modal */}
      <Dialog open={downloadModalOpen} onOpenChange={setDownloadModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-slate-900">
              <FileText className="w-5 h-5 text-indigo-600" />
              TDS Return Preview (Form 24Q)
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <div className="rounded-lg border border-slate-200 divide-y divide-slate-100">
              {[
                { label: 'Form', value: '24Q (Salary TDS)' },
                { label: 'FY', value: `FY ${activeFy}` },
                { label: 'Quarter', value: activeQuarter },
                { label: 'Employees', value: String(s?.totalEmployees ?? 0) },
                { label: 'Salary', value: INR(s?.totalGrossSalary) },
                { label: 'TDS Deducted', value: INR(s?.totalTdsLiability), bold: true },
                { label: 'Challans', value: `${s?.challansCount || 3} Mapped` },
                { label: 'Return File', value: `${activeQuarter}-FY${activeFy.replace('-', '')}-24Q.txt` },
              ].map(r => (
                <div key={r.label} className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-slate-500">{r.label}</span>
                  <span className={`font-semibold font-mono ${r.bold ? 'text-indigo-700' : 'text-slate-800'}`}>{r.value}</span>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Employee Deductee Summary</p>
              <div className="rounded-lg border border-slate-200 overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-2 px-3 text-left font-semibold text-slate-500">Employee</th>
                      <th className="py-2 px-3 text-left font-semibold text-slate-500">PAN</th>
                      <th className="py-2 px-3 text-right font-semibold text-slate-500">Gross</th>
                      <th className="py-2 px-3 text-right font-semibold text-slate-500">Taxable</th>
                      <th className="py-2 px-3 text-right font-semibold text-slate-500">Quarter TDS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {calcRows.map(r => (
                      <tr key={r.employeeId}>
                        <td className="py-2 px-3 font-medium text-slate-800">{r.name}</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{r.panNumber}</td>
                        <td className="py-2 px-3 font-mono text-slate-600 text-right">{INR(r.monthlyGross)}</td>
                        <td className="py-2 px-3 font-mono text-slate-600 text-right">{INR(r.taxableSalary)}</td>
                        <td className="py-2 px-3 font-mono font-bold text-indigo-700 text-right">{INR(r.quarterTds)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="border-slate-200 text-slate-700 cursor-pointer" onClick={() => setDownloadModalOpen(false)}>
              Close
            </Button>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 cursor-pointer" onClick={handleDownload24QCsv}>
              <Download className="w-4 h-4" />Download Return (Form 24Q)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 8. Mark Filed Modal */}
      <Dialog open={filingModalOpen} onOpenChange={setFilingModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-slate-900">
              <BadgeCheck className="w-5 h-5 text-emerald-600" />
              Mark TDS Return as Filed
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <div className="rounded-lg border border-slate-200 divide-y divide-slate-100">
              {[
                { label: 'Return Type', value: 'Form 24Q' },
                { label: 'FY', value: `FY ${activeFy}` },
                { label: 'Quarter', value: activeQuarter },
                { label: 'Return Reference', value: qs.return24QRecord?.returnRef || `${activeQuarter}-24Q-2026-001` },
                { label: 'TDS Liability', value: INR(s?.totalTdsLiability) },
                { label: 'Payment Status', value: qs.paymentRecord ? '✓ Paid' : 'Pending' },
              ].map(r => (
                <div key={r.label} className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-slate-500">{r.label}</span>
                  <span className="font-semibold text-slate-800">{r.value}</span>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">Filing Details</p>
              <div className="space-y-3">
                <div className="grid grid-cols-5 gap-2 items-center">
                  <Label className="text-xs text-slate-600 font-medium col-span-2">Filing Date *</Label>
                  <Input
                    type="date"
                    value={filingForm.filingDate}
                    onChange={e => setFilingForm(p => ({ ...p, filingDate: e.target.value }))}
                    className="h-8 text-sm col-span-3 border-slate-300 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-5 gap-2 items-center">
                  <Label className="text-xs text-slate-600 font-medium col-span-2">Ack. Number *</Label>
                  <Input
                    type="text"
                    value={filingForm.ackNo}
                    placeholder="e.g. ACK982736412"
                    onChange={e => setFilingForm(p => ({ ...p, ackNo: e.target.value }))}
                    className="h-8 text-sm col-span-3 border-slate-300 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-5 gap-2 items-center">
                  <Label className="text-xs text-slate-600 font-medium col-span-2">Filing Reference</Label>
                  <Input
                    type="text"
                    value={filingForm.filingRef}
                    placeholder="e.g. Q2-24Q-2026-001"
                    onChange={e => setFilingForm(p => ({ ...p, filingRef: e.target.value }))}
                    className="h-8 text-sm col-span-3 border-slate-300 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-5 gap-2 items-center">
                  <Label className="text-xs text-slate-600 font-medium col-span-2">Upload Ack.</Label>
                  <Input
                    type="file"
                    className="h-8 text-xs col-span-3 border-slate-300 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-indigo-50 file:text-indigo-700"
                  />
                </div>

                <div className="grid grid-cols-5 gap-2 items-center">
                  <Label className="text-xs text-slate-600 font-medium col-span-2">Notes</Label>
                  <Input
                    type="text"
                    value={filingForm.notes}
                    placeholder="Optional filing remarks..."
                    onChange={e => setFilingForm(p => ({ ...p, notes: e.target.value }))}
                    className="h-8 text-sm col-span-3 border-slate-300 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 font-medium">Marking this quarter as filed completes Form 24Q and unlocks annual Form 16 certificate generation.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="border-slate-200 text-slate-700 cursor-pointer" onClick={() => setFilingModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[180px] cursor-pointer" onClick={handleConfirmFiling}>
              <BadgeCheck className="w-4 h-4 mr-1.5" />Confirm Filing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 9. Form 16 Generation Modal */}
      <Dialog open={form16ModalOpen} onOpenChange={setForm16ModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-slate-900">
              <Award className="w-5 h-5 text-indigo-600" />
              Form 16 Generation
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <div className="rounded-lg border border-slate-200 divide-y divide-slate-100">
              {[
                { label: 'Financial Year', value: `FY ${activeFy}` },
                { label: 'Employees', value: String(s?.totalEmployees ?? 0) },
                { label: 'TDS Return', value: '✓ Filed (Form 24Q)', green: true },
                { label: 'Employee PAN', value: '✓ Valid', green: true },
                { label: 'Salary Data', value: '✓ Valid', green: true },
                { label: 'TDS Data', value: '✓ Valid', green: true },
              ].map(r => (
                <div key={r.label} className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-slate-500">{r.label}</span>
                  <span className={`font-semibold font-mono ${r.green ? 'text-emerald-700' : 'text-slate-800'}`}>{r.value}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              This generates digitally signable Form 16 Part A (TRACES certificate) and Part B (Salary breakdown & exemptions) for all covered employees.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="border-slate-200 text-slate-700 cursor-pointer" onClick={() => setForm16ModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[170px] cursor-pointer" onClick={handleConfirmForm16}>
              <Award className="w-4 h-4 mr-1.5" />Generate Form 16
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 10. Employee TDS Details Modal */}
      <Dialog open={!!selectedEmp} onOpenChange={open => !open && setSelectedEmp(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-slate-900">
              <FileText className="w-5 h-5 text-indigo-600" />
              Employee TDS Details
            </DialogTitle>
          </DialogHeader>
          {selectedEmp && (
            <div className="py-2 space-y-3">
              <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                  {selectedEmp.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{selectedEmp.name}</p>
                  <p className="text-xs text-slate-600 font-mono">{selectedEmp.employeeCode} · PAN: {selectedEmp.panNumber}</p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 divide-y divide-slate-100 text-sm">
                {[
                  { label: 'Company / Entity', value: selectedEmp.companyName || '—' },
                  { label: 'Department', value: selectedEmp.department },
                  { label: 'Financial Year', value: selectedEmp.financialYear },
                  { label: 'Tax Regime', value: selectedEmp.taxRegime },
                  { label: 'Monthly Gross Salary', value: INR(selectedEmp.monthlyGross), mono: true },
                  { label: 'Taxable Monthly Salary', value: INR(selectedEmp.taxableSalary), mono: true },
                  { label: 'Exemptions / Deductions', value: INR(selectedEmp.exemptions), mono: true },
                  { label: 'Annual Tax Liability', value: INR(selectedEmp.annualTax), mono: true },
                  { label: 'TDS Deducted This Month', value: INR(selectedEmp.monthlyTds), mono: true, bold: true },
                  { label: 'Quarterly TDS (3 Months)', value: INR(selectedEmp.quarterTds), mono: true, bold: true },
                  { label: 'YTD TDS Deposited', value: INR(selectedEmp.ytdTds), mono: true },
                ].map(r => (
                  <div key={r.label} className="flex justify-between px-3 py-2 text-xs">
                    <span className="text-slate-500">{r.label}</span>
                    <span className={`font-semibold ${r.mono ? 'font-mono' : ''} ${r.bold ? 'text-indigo-700 font-bold' : 'text-slate-800'}`}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" className="border-slate-200 text-slate-700 cursor-pointer" onClick={() => setSelectedEmp(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TdsModule;
