import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, RefreshCw, CheckCircle2, Clock, AlertTriangle,
  IndianRupee, Users, FileText, Download, Receipt, ClipboardCheck,
  Send, BadgeCheck, Loader2, ArrowRight, Hash, TrendingUp,
  Info, History, Eye, ChevronDown, ChevronUp, Building2, CreditCard,
  FileSpreadsheet, ExternalLink, Calendar, Check, AlertCircle,
  FileDown, BarChart3, PieChart, Layers, ArrowUpRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

/* ─── Helpers ─────────────────────────────────────────────── */
const INR = (n: number | undefined | null) =>
  '₹' + (Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const FY_LIST = ['2026-2027', '2025-2026'];

function periodLabel(p: string): string {
  const [y, m] = p.split('-');
  return new Date(+y, +m - 1, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
}

function fyMonths(fy: string): string[] {
  const [startY] = fy.split('-').map(Number);
  const months: string[] = [];
  for (let m = 4; m <= 12; m++) months.push(`${startY}-${String(m).padStart(2, '0')}`);
  for (let m = 1; m <= 3; m++) months.push(`${startY + 1}-${String(m).padStart(2, '0')}`);
  return months;
}

/* ─── Props ──────────────────────────────────────────────── */
export interface ComplianceReportsTabProps {
  companyId?: string;
  companies?: any[];
}

export function ComplianceReportsTab({ companyId, companies = [] }: ComplianceReportsTabProps) {
  const navigate = useNavigate();
  const [activeFy, setActiveFy] = useState('2026-2027');
  const [period, setPeriod] = useState('2026-09');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [trendRange, setTrendRange] = useState<'6M' | 'FY'>('6M');
  const [showHistory, setShowHistory] = useState(false);
  const [historyFy, setHistoryFy] = useState('2026-2027');
  const [exportOpen, setExportOpen] = useState(false);

  // Fetch central compliance analytics
  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['compliance-analytics', selectedCompany, period, activeFy],
    queryFn: async () => {
      const r = await apiClient.get('/compliance/reports/analytics', {
        params: { companyId: selectedCompany || 'all', period, fy: activeFy },
      });
      return r.data;
    },
  });

  const s = data?.summary;
  const categories = data?.categories || [];
  const periodMonths = useMemo(() => fyMonths(activeFy), [activeFy]);

  const filteredCategories = useMemo(() => {
    if (categoryFilter === 'ALL') return categories;
    return categories.filter((c: any) => c.id === categoryFilter.toLowerCase());
  }, [categories, categoryFilter]);

  const handleExport = (format: string) => {
    setExportOpen(false);
    toast.success(`Exporting ${format} compliance report for ${periodLabel(period)} (FY ${activeFy})...`);
    const blob = new Blob([
      `E-HCM STATUTORY COMPLIANCE & LEGAL REPORT\nFinancial Year: FY ${activeFy}\nPeriod: ${periodLabel(period)}\nTotal Tasks: ${s?.totalTasks || 42}\nCompleted: ${s?.completedTasks || 31}\nPending: ${s?.pendingTasks || 8}\nOverdue: ${s?.overdueTasks || 3}\nTotal Liability: INR ${s?.totalLiability || 37220}\nCompliance Health Score: ${s?.complianceHealthScore || 86}%\nGenerated on: ${new Date().toLocaleString('en-IN')}`
    ], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Compliance-Report-${activeFy}-${period}.${format === 'CSV' ? 'csv' : 'txt'}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const healthScore = s?.complianceHealthScore ?? 86;
  const healthOffset = 251.2 - (251.2 * healthScore) / 100;

  return (
    <div className="space-y-6">

      {/* ── BREADCRUMB + PAGE HEADER ── */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">
              <span>Compliance</span><ArrowRight className="w-3 h-3" /><span className="text-slate-500">Compliance Reports</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-slate-900">Compliance Reports & Executive Analytics</h1>
                  <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-semibold">
                    Statutory Intelligence
                  </Badge>
                  <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                    Audit Ready (92%)
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Central compliance monitoring, filing status, liabilities, audit readiness and statutory analytics
                </p>
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
              className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer font-medium"
            >
              {periodMonths.map(p => <option key={p} value={p}>{periodLabel(p)}</option>)}
            </select>
            {/* Category filter */}
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="PF">PF (Provident Fund)</option>
              <option value="ESIC">ESIC</option>
              <option value="PT">Professional Tax</option>
              <option value="TDS">Income Tax (TDS)</option>
              <option value="LABOUR">Labour Compliance</option>
              <option value="RETURNS">Government Returns</option>
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
            {/* Export Dropdown */}
            <div className="relative">
              <Button
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 cursor-pointer font-medium"
                onClick={() => setExportOpen(o => !o)}
              >
                <FileDown className="w-4 h-4" />Export Report <ChevronDown className="w-3 h-3" />
              </Button>
              {exportOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-20 text-xs">
                  {['PDF Executive Report', 'Excel Spreadsheet', 'CSV Data Register', 'Master Statutory Audit', 'Compliance Health Summary'].map(fmt => (
                    <button
                      key={fmt}
                      onClick={() => handleExport(fmt)}
                      className="w-full text-left px-3.5 py-1.5 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 flex items-center justify-between cursor-pointer"
                    >
                      <span>{fmt}</span>
                      <Download className="w-3 h-3 text-slate-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 6 EXECUTIVE KPI STAT CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {[
          { label: 'Total Tasks', value: isLoading ? '…' : String(s?.totalTasks ?? 42), sub: '↑ 12% vs last mo', icon: ClipboardCheck, color: 'text-slate-900', bg: 'bg-slate-50', border: 'border-slate-200' },
          { label: 'Completed', value: isLoading ? '…' : String(s?.completedTasks ?? 31), sub: `${s?.complianceHealthScore ?? 74}% execution rate`, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: 'Pending', value: isLoading ? '…' : String(s?.pendingTasks ?? 8), sub: 'Needs action', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
          { label: 'Overdue', value: isLoading ? '…' : String(s?.overdueTasks ?? 3), sub: '⚠ Attention req.', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
          { label: 'Total Liability', value: isLoading ? '…' : INR(s?.totalLiability ?? 37220), sub: `Paid: ${INR(s?.totalPaidLiability)}`, icon: IndianRupee, color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-100' },
          { label: 'Compliance Health', value: isLoading ? '…' : `${s?.complianceHealthScore ?? 86}%`, sub: 'Excellent grade', icon: ShieldCheck, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
        ].map(c => (
          <Card key={c.label} className="border-slate-200 shadow-sm">
            <CardContent className="p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide truncate">{c.label}</span>
                <div className={`w-7 h-7 rounded-md ${c.bg} border ${c.border} flex items-center justify-center flex-shrink-0`}>
                  <c.icon className={`w-3.5 h-3.5 ${c.color}`} />
                </div>
              </div>
              <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
              <p className="text-[10px] text-slate-500 font-medium truncate">{c.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── ROW 1: HEALTH SCORE GAUGE & DONUT STATUS BREAKDOWN ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* 1. Compliance Health Gauge (5 cols) */}
        <Card className="lg:col-span-6 border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <CardTitle className="text-base font-semibold text-slate-900">Compliance Health Score</CardTitle>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-semibold">
                Excellent Grade
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-around gap-6">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#4f46e5"
                  strokeWidth="10"
                  strokeDasharray="251.2"
                  strokeDashoffset={healthOffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-extrabold text-slate-900">{healthScore}%</span>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Health</span>
              </div>
            </div>

            <div className="space-y-3 flex-1 max-w-xs">
              <div>
                <p className="text-xs font-bold text-slate-800">Statutory Health Breakdown</p>
                <p className="text-[11px] text-slate-500">Period: {periodLabel(period)} · FY {activeFy}</p>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Filed & Verified', count: s?.completedTasks ?? 31, color: 'bg-emerald-500', text: 'text-emerald-700' },
                  { label: 'Pending Filings', count: s?.pendingTasks ?? 8, color: 'bg-amber-500', text: 'text-amber-700' },
                  { label: 'Overdue Filings', count: s?.overdueTasks ?? 3, color: 'bg-red-500', text: 'text-red-700' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                      <span className="text-slate-600">{item.label}</span>
                    </div>
                    <span className={`font-bold font-mono ${item.text}`}>{item.count} Tasks</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-slate-100 text-[10.5px] text-slate-400">
                Last Updated: 02 Sep 2026 · Realtime Sync
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Donut Status Breakdown (6 cols) */}
        <Card className="lg:col-span-6 border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-indigo-600" />
                <CardTitle className="text-base font-semibold text-slate-900">Task Completion Status</CardTitle>
              </div>
              <span className="text-xs text-slate-500 font-mono font-semibold">{s?.totalTasks ?? 42} Total Obligations</span>
            </div>
          </CardHeader>
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-around gap-6">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" stroke="#10b981" strokeWidth="12" strokeDasharray="185 238" fill="transparent" />
                <circle cx="50" cy="50" r="38" stroke="#f59e0b" strokeWidth="12" strokeDasharray="45 238" strokeDashoffset="-185" fill="transparent" />
                <circle cx="50" cy="50" r="38" stroke="#ef4444" strokeWidth="12" strokeDasharray="18 238" strokeDashoffset="-230" fill="transparent" />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-xl font-bold text-slate-900">74%</span>
                <span className="text-[9px] text-slate-400 uppercase font-semibold">Done</span>
              </div>
            </div>

            <div className="space-y-2.5 flex-1 max-w-xs text-xs">
              {[
                { label: 'Completed', count: 31, pct: '74%', dot: 'bg-emerald-500', desc: 'All statutory compliances met' },
                { label: 'Pending Action', count: 8, pct: '19%', dot: 'bg-amber-500', desc: 'Within statutory due dates' },
                { label: 'Overdue Attention', count: 3, pct: '7%', dot: 'bg-red-500', desc: 'Exceeded statutory deadlines' },
              ].map(st => (
                <div key={st.label} className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${st.dot}`} />
                    <div>
                      <span className="font-semibold text-slate-800">{st.label}</span>
                      <p className="text-[10px] text-slate-500">{st.desc}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-800">{st.count}</span>
                    <span className="text-[10px] text-slate-400 block">({st.pct})</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── ROW 2: COMPLIANCE STATUS BY CATEGORY TABLE ── */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">Compliance Status by Category</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Statutory execution, liabilities, and health rates across PF, ESIC, PT, TDS, Labour, and Returns
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs font-semibold">
                6 Statutory Domains Active
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/30">
                  {['Category / Domain', 'Code', 'Total Tasks', 'Completed', 'Pending', 'Overdue', 'Health Score', 'Statutory Liability', 'Action'].map(h => (
                    <th key={h} className="py-3 px-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCategories.map((c: any, i: number) => (
                  <tr key={c.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} hover:bg-indigo-50/20 transition-colors`}>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{c.name}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">{c.code}</td>
                    <td className="py-3.5 px-4 text-slate-700 font-mono text-xs">{c.totalTasks}</td>
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-emerald-700">{c.completed}</td>
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-amber-700">{c.pending}</td>
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-red-600">{c.overdue}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div
                            className={`h-full rounded-full ${c.health >= 90 ? 'bg-emerald-500' : c.health >= 75 ? 'bg-indigo-500' : 'bg-amber-500'}`}
                            style={{ width: `${c.health}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs font-bold text-slate-800">{c.health}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-indigo-700">
                      {c.liability > 0 ? INR(c.liability) : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-3 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 gap-1 cursor-pointer font-medium"
                        onClick={() => navigate(c.route)}
                      >
                        <Eye className="w-3 h-3" />Drill Down
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold">
                  <td colSpan={2} className="py-3 px-4 text-slate-900">Total Statutory Portfolio</td>
                  <td className="py-3 px-4 font-mono text-slate-800">{s?.totalTasks ?? 42}</td>
                  <td className="py-3 px-4 font-mono text-emerald-700">{s?.completedTasks ?? 31}</td>
                  <td className="py-3 px-4 font-mono text-amber-700">{s?.pendingTasks ?? 8}</td>
                  <td className="py-3 px-4 font-mono text-red-600">{s?.overdueTasks ?? 3}</td>
                  <td className="py-3 px-4 font-mono text-slate-900">{healthScore}% Average</td>
                  <td className="py-3 px-4 font-mono text-indigo-700 text-base">{INR(s?.totalLiability ?? 37220)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── ROW 3: MONTHLY TREND & CATEGORY COMPARISON BARS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* 1. Monthly Compliance Trend */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                <CardTitle className="text-base font-semibold text-slate-900">Monthly Compliance Trend</CardTitle>
              </div>
              <div className="flex items-center bg-white border border-slate-200 rounded p-0.5 text-xs">
                {['6M', 'FY'].map(r => (
                  <button
                    key={r}
                    onClick={() => setTrendRange(r as any)}
                    className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                      trendRange === r ? 'bg-indigo-600 text-white' : 'text-slate-600'
                    }`}
                  >
                    {r === '6M' ? 'Last 6 Months' : 'Full FY'}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-6 gap-2 text-center">
              {(data?.monthlyTrend || []).map((t: any) => (
                <div key={t.month} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                  <p className="font-bold text-xs text-slate-800">{t.month}</p>
                  <p className="text-sm font-extrabold text-indigo-600">{t.completed}/{t.total}</p>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${Math.round((t.completed / t.total) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">{Math.round((t.completed / t.total) * 100)}%</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Consistent 90%+ statutory fulfillment across Q1 and Q2 periods.
            </p>
          </CardContent>
        </Card>

        {/* 2. Category Comparison Progress Bars */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3.5">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <CardTitle className="text-base font-semibold text-slate-900">Compliance Rate by Category</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {[
              { label: 'PF (Provident Fund)', rate: 92, status: '10/12 Met', color: 'bg-indigo-600' },
              { label: 'ESIC Compliance', rate: 94, status: '7/8 Met', color: 'bg-emerald-600' },
              { label: 'Professional Tax (PT)', rate: 90, status: '5/6 Met', color: 'bg-blue-600' },
              { label: 'Income Tax (TDS)', rate: 88, status: '3/4 Met', color: 'bg-indigo-500' },
              { label: 'Labour Compliance', rate: 78, status: '8/12 Met', color: 'bg-amber-500' },
              { label: 'Government Returns', rate: 91, status: '3/4 Met', color: 'bg-emerald-500' },
            ].map(cat => (
              <div key={cat.label} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>{cat.label}</span>
                  <span className="font-mono text-slate-900">{cat.rate}% ({cat.status})</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div className={`h-full rounded-full ${cat.color}`} style={{ width: `${cat.rate}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── ROW 4: FINANCIAL LIABILITY ANALYSIS & AUDIT READINESS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* 1. Statutory Liability Breakdown */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-indigo-600" />
                <CardTitle className="text-base font-semibold text-slate-900">Statutory Financial Liability Analysis</CardTitle>
              </div>
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs font-bold font-mono">
                {INR(s?.totalLiability ?? 37220)} Total Outflow
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="space-y-2">
              {[
                { name: 'PF Statutory Remittance', amount: 7500, paid: 7500, status: 'Ready for Bank UTR' },
                { name: 'ESIC Contribution Statement', amount: 3520, paid: 3520, status: 'Paid & Challan Stamped' },
                { name: 'Professional Tax (PTRC MH)', amount: 400, paid: 400, status: 'Filed & Paid' },
                { name: 'Income Tax TDS (Form 24Q)', amount: 25800, paid: 0, status: 'Challan Due 07-Oct' },
              ].map(li => (
                <div key={li.name} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-900">{li.name}</p>
                    <p className="text-[10px] text-slate-500">{li.status}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900">{INR(li.amount)}</span>
                    <span className={`text-[10px] block font-semibold ${li.paid > 0 ? 'text-emerald-700' : 'text-amber-600'}`}>
                      {li.paid > 0 ? '✓ Deposited' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 flex justify-between items-center text-xs">
              <span className="font-bold text-indigo-900">Deposited to Government Portals:</span>
              <span className="font-mono font-extrabold text-indigo-700 text-sm">{INR(s?.totalPaidLiability ?? 11420)}</span>
            </div>
          </CardContent>
        </Card>

        {/* 2. Audit Readiness Index (92%) */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-indigo-600" />
                <CardTitle className="text-base font-semibold text-slate-900">Statutory Audit Readiness Index</CardTitle>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold">
                92% Audit Ready
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="space-y-2">
              {[
                { label: 'Statutory Documents Complete', pct: 91 },
                { label: 'Mandatory Registers Updated (Form B, D, H)', pct: 87 },
                { label: 'Government Returns Filed & Ack Verified', pct: 94 },
                { label: 'Challans & Bank UTR Receipts Available', pct: 96 },
                { label: 'Employee PAN / UAN Data Validated', pct: 98 },
              ].map(item => (
                <div key={item.label} className="space-y-1 text-xs">
                  <div className="flex justify-between font-medium text-slate-700">
                    <span>{item.label}</span>
                    <span className="font-mono font-bold text-slate-900">{item.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-2 flex justify-between items-center">
              <span className="text-xs text-slate-500">External Inspector & Internal Audit Pass Rate: 98%</span>
              <Button size="sm" variant="outline" className="h-7 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 cursor-pointer" onClick={() => navigate('/compliance/setup')}>
                View Audit Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── ROW 5: UPCOMING DEADLINES & OVERDUE EXCEPTIONS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* 1. Upcoming Deadlines */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3.5">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <CardTitle className="text-base font-semibold text-slate-900">Upcoming Statutory Deadlines</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {[
              { name: 'Professional Tax Return (Form III-B)', dueDate: '30-Sep-2026', days: 8, cat: 'PT', color: 'text-blue-700 bg-blue-50' },
              { name: 'PF Monthly ECR Return Filing', dueDate: '15-Oct-2026', days: 23, cat: 'PF', color: 'text-indigo-700 bg-indigo-50' },
              { name: 'ESIC Monthly Contribution Return', dueDate: '15-Oct-2026', days: 23, cat: 'ESIC', color: 'text-purple-700 bg-purple-50' },
              { name: 'Quarterly Form 24Q Salary TDS Return', dueDate: '31-Oct-2026', days: 39, cat: 'TDS', color: 'text-emerald-700 bg-emerald-50' },
            ].map(d => (
              <div key={d.name} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className={`px-2 py-0.5 rounded font-bold text-[10.5px] border ${d.color}`}>{d.cat}</span>
                  <div>
                    <p className="font-semibold text-slate-900">{d.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">Due: {d.dueDate}</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-white text-slate-700 border-slate-200 text-xs font-semibold">
                  {d.days} days remaining
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 2. Compliance Exceptions & Alerts */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-indigo-600" />
                <CardTitle className="text-base font-semibold text-slate-900">Compliance Exceptions & Action Items</CardTitle>
              </div>
              <Badge className="bg-red-50 text-red-700 border-red-200 text-xs font-bold">
                Action Required
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {[
              { level: 'CRITICAL', text: '3 Overdue Tasks require immediate statutory sign-off', dot: 'bg-red-500', route: '/compliance/labour' },
              { level: 'WARNING', text: '2 Statutory Payments pending bank deposit clearance', dot: 'bg-amber-500', route: '/compliance/returns' },
              { level: 'WARNING', text: '1 Government Return ready for quarterly e-filing (Form 24Q)', dot: 'bg-amber-500', route: '/compliance/itax' },
              { level: 'INFO', text: '4 Employee PAN numbers validated against Income Tax DB', dot: 'bg-blue-500', route: '/compliance/itax' },
              { level: 'INFO', text: '2 PF records verified with UAN & Member IDs', dot: 'bg-emerald-500', route: '/compliance/pf' },
            ].map((ex, idx) => (
              <div key={idx} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${ex.dot}`} />
                  <span className="text-slate-800 font-medium">{ex.text}</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-[11px] text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 gap-1 cursor-pointer"
                  onClick={() => navigate(ex.route)}
                >
                  Resolve <ArrowUpRight className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── ROW 6: AVAILABLE DETAILED REPORTS GRID ── */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3.5">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            <CardTitle className="text-base font-semibold text-slate-900">Available Statutory Detailed Reports</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { title: 'PF Compliance Register', desc: 'Monthly ECR & Remittance', route: '/compliance/pf' },
              { title: 'ESIC Contribution Report', desc: '4.00% Wage & Challan', route: '/compliance/esic' },
              { title: 'PT Liability Report', desc: 'Form III-B State Return', route: '/compliance/ptax' },
              { title: 'TDS Deduction & 24Q', desc: 'Sec 192 Quarterly Return', route: '/compliance/itax' },
              { title: 'Labour Law Register', desc: 'POSH, Wages & Muster Roll', route: '/compliance/labour' },
              { title: 'Master Statutory Audit', desc: 'Executive Annual Summary', route: '/compliance/returns' },
            ].map(rep => (
              <div key={rep.title} className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-3">
                <div>
                  <p className="font-bold text-xs text-slate-900">{rep.title}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{rep.desc}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-7 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 gap-1 cursor-pointer font-medium"
                  onClick={() => navigate(rep.route)}
                >
                  <Eye className="w-3 h-3" />View Report
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ComplianceReportsTab;
