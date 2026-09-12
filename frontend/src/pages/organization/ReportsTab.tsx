import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  Users,
  PieChart,
  TrendingUp,
  Search,
  Plus,
  Eye,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Briefcase,
  Award,
  DollarSign,
  Filter,
  Layers,
  Sparkles,
  ArrowUpRight,
  TrendingDown,
  ChevronRight,
  Activity,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useCompany } from '@/context/CompanyContext';

// ── Types ────────────────────────────────────────────────────────
interface ReportItem {
  id: string;
  code: string;
  title: string;
  category: 'Headcount' | 'Turnover' | 'Compensation' | 'Compliance';
  frequency: 'Monthly' | 'Quarterly' | 'Annual' | 'Real-Time';
  format: 'PDF' | 'XLSX' | 'CSV';
  lastGenerated: string;
  size: string;
  color: string;
  description: string;
  recordsCount: number;
}

// ── Initial Mock Reports Dataset ─────────────────────────────────
const INITIAL_REPORTS: ReportItem[] = [
  {
    id: 'r1',
    code: 'RPT-ORG-01',
    title: 'Monthly Headcount & Span of Control Analysis',
    category: 'Headcount',
    frequency: 'Monthly',
    format: 'PDF',
    lastGenerated: '01 Aug 2026',
    size: '2.4 MB',
    color: 'bg-primary',
    description: 'Detailed analysis of functional staffing levels, manager-to-staff ratios, and vacancy capacities.',
    recordsCount: 248,
  },
  {
    id: 'r2',
    code: 'RPT-ORG-02',
    title: 'Gender Diversity & Equal Opportunity Audit Report',
    category: 'Headcount',
    frequency: 'Quarterly',
    format: 'XLSX',
    lastGenerated: '15 Jul 2026',
    size: '1.8 MB',
    color: 'bg-violet-500',
    description: 'Workforce gender demographics, leadership inclusion index, and equal pay balance scorecard.',
    recordsCount: 248,
  },
  {
    id: 'r3',
    code: 'RPT-ORG-03',
    title: 'Departmental Salary Scale & Budget Variance Report',
    category: 'Compensation',
    frequency: 'Monthly',
    format: 'XLSX',
    lastGenerated: '01 Aug 2026',
    size: '3.1 MB',
    color: 'bg-emerald-500',
    description: 'Comparison of approved annual budgets versus actual payroll disbursements across cost centers.',
    recordsCount: 6,
  },
  {
    id: 'r4',
    code: 'RPT-ORG-04',
    title: 'Quarterly Turnover & Resignation Risk Scorecard',
    category: 'Turnover',
    frequency: 'Quarterly',
    format: 'PDF',
    lastGenerated: '30 Jun 2026',
    size: '1.2 MB',
    color: 'bg-rose-500',
    description: 'Voluntary vs involuntary attrition trends, tenure analysis, and flight-risk hotspots.',
    recordsCount: 11,
  },
  {
    id: 'r5',
    code: 'RPT-ORG-05',
    title: 'Biometric Facility Occupancy & Attendance Telemetry',
    category: 'Headcount',
    frequency: 'Real-Time',
    format: 'CSV',
    lastGenerated: '05 Aug 2026',
    size: '850 KB',
    color: 'bg-cyan-500',
    description: 'Floor-wise physical turnstile swipes, desk utilization, and hybrid remote presence statistics.',
    recordsCount: 248,
  },
  {
    id: 'r6',
    code: 'RPT-ORG-06',
    title: 'Statutory POSH & Policy Sign-off Compliance Audit',
    category: 'Compliance',
    frequency: 'Annual',
    format: 'PDF',
    lastGenerated: '10 Jun 2026',
    size: '4.5 MB',
    color: 'bg-amber-500',
    description: 'Formal regulatory compliance verification for POSH training, ISO 27001, and corporate handbooks.',
    recordsCount: 248,
  },
];

// ── Analytics Datasets ───────────────────────────────────────────
const DEPT_ANALYTICS = [
  { name: 'Engineering & Tech', count: 84, capacity: 90, budgetAllocated: 12.8, budgetSpent: 11.4, color: '#6366f1', mgrCount: 7, icCount: 77 },
  { name: 'Operations & Mfg', count: 56, capacity: 65, budgetAllocated: 15.4, budgetSpent: 14.1, color: '#10b981', mgrCount: 5, icCount: 51 },
  { name: 'Global Sales & Mktg', count: 42, capacity: 50, budgetAllocated: 8.2, budgetSpent: 7.9, color: '#f59e0b', mgrCount: 4, icCount: 38 },
  { name: 'Human Resources', count: 28, capacity: 30, budgetAllocated: 4.5, budgetSpent: 4.1, color: '#8b5cf6', mgrCount: 3, icCount: 25 },
  { name: 'Finance & Treasury', count: 20, capacity: 25, budgetAllocated: 3.2, budgetSpent: 2.8, color: '#06b6d4', mgrCount: 2, icCount: 18 },
  { name: 'Product & UX Design', count: 18, capacity: 20, budgetAllocated: 2.6, budgetSpent: 2.4, color: '#f43f5e', mgrCount: 2, icCount: 16 },
];

const TURNOVER_TIMELINE = [
  { month: 'Jan', rate: 4.8, benchmark: 8.0, exits: 1 },
  { month: 'Feb', rate: 4.5, benchmark: 8.0, exits: 1 },
  { month: 'Mar', rate: 4.1, benchmark: 8.0, exits: 1 },
  { month: 'Apr', rate: 5.0, benchmark: 8.0, exits: 2 },
  { month: 'May', rate: 4.6, benchmark: 8.0, exits: 1 },
  { month: 'Jun', rate: 3.9, benchmark: 8.0, exits: 1 },
  { month: 'Jul', rate: 4.3, benchmark: 8.0, exits: 2 },
  { month: 'Aug', rate: 4.2, benchmark: 8.0, exits: 2 },
];

const SENIORITY_PYRAMID = [
  { grade: 'L6 - Executive Board', title: 'C-Suite & VP', count: 8, salary: '₹45L - ₹95L', color: '#6366f1', pct: 3.2 },
  { grade: 'L5 - Senior Management', title: 'Directors & Heads', count: 18, salary: '₹28L - ₹45L', color: '#8b5cf6', pct: 7.3 },
  { grade: 'L4 - Team Leads / Arch', title: 'Principals & Leads', count: 42, salary: '₹18L - ₹28L', color: '#3b82f6', pct: 16.9 },
  { grade: 'L3 - Senior Professionals', title: 'Senior Staff', count: 74, salary: '₹12L - ₹18L', color: '#06b6d4', pct: 29.8 },
  { grade: 'L2 - Mid Professionals', title: 'Software Eng / Specialists', count: 82, salary: '₹6L - ₹12L', color: '#10b981', pct: 33.1 },
  { grade: 'L1 - Associate & Trainees', title: 'Graduates & Interns', count: 24, salary: '₹3.5L - ₹6L', color: '#f59e0b', pct: 9.7 },
];

const FACILITY_OCCUPANCY = [
  { facility: 'Pune Technology HQ', active: 142, capacity: 160, occupancy: 88.8, remote: 18, color: '#6366f1' },
  { facility: 'Mumbai Financial Hub', active: 64, capacity: 80, occupancy: 80.0, remote: 12, color: '#10b981' },
  { facility: 'Remote & Regional Field', active: 42, capacity: 50, occupancy: 84.0, remote: 42, color: '#f59e0b' },
];

export function ReportsTab({ companyId: propCompanyId }: { companyId?: string }) {
  const { activeCompanyId: ctxCompanyId } = useCompany();
  const activeCompanyId = propCompanyId || ctxCompanyId;
  const [reports, setReports] = useState<ReportItem[]>(INITIAL_REPORTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed' | 'catalog'>('overview');
  const [timeRange, setTimeRange] = useState<string>('Q3 2026');

  // Custom Report Generator Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<'Headcount' | 'Turnover' | 'Compensation' | 'Compliance'>('Headcount');
  const [formFormat, setFormFormat] = useState<'PDF' | 'XLSX' | 'CSV'>('PDF');
  const [formDescription, setFormDescription] = useState('');

  // Live Report Preview Modal State
  const [previewReport, setPreviewReport] = useState<ReportItem | null>(null);

  // Hover states for interactive SVG charts
  const [hoveredDept, setHoveredDept] = useState<any | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error('Report title is required');
      return;
    }

    const newReport: ReportItem = {
      id: `r_${Date.now()}`,
      code: `RPT-ORG-0${reports.length + 1}`,
      title: formTitle,
      category: formCategory,
      frequency: 'Real-Time',
      format: formFormat,
      lastGenerated: 'Just now',
      size: formFormat === 'PDF' ? '2.1 MB' : formFormat === 'XLSX' ? '1.5 MB' : '450 KB',
      color: formCategory === 'Compensation' ? 'bg-emerald-500' : formCategory === 'Turnover' ? 'bg-rose-500' : formCategory === 'Compliance' ? 'bg-amber-500' : 'bg-primary',
      description: formDescription || 'Custom generated enterprise telemetry report for selected organization parameters.',
      recordsCount: 248,
    };

    setReports(prev => [newReport, ...prev]);
    toast.success(`Generated report "${formTitle}" successfully!`);
    setIsCreateOpen(false);
    setFormTitle('');
    setFormDescription('');
  };

  // Real client-side export generator
  const handleExport = (report: ReportItem, formatOverride?: 'PDF' | 'XLSX' | 'CSV') => {
    const format = formatOverride || report.format;
    const dateStr = new Date().toISOString().split('T')[0];

    if (format === 'CSV') {
      const csvContent = [
        ['Report Code', 'Title', 'Category', 'Frequency', 'Headcount', 'Date'],
        [report.code, `"${report.title}"`, report.category, report.frequency, '248', dateStr],
        [],
        ['Department', 'Active Headcount', 'Headcount Capacity', 'Budget (₹ Cr)', 'Spent (₹ Cr)'],
        ...DEPT_ANALYTICS.map(d => [d.name, d.count, d.capacity, d.budgetAllocated, d.budgetSpent]),
      ].map(e => e.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${report.code}_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Exported ${report.code} as CSV!`);
    } else {
      // Simulate file download for PDF / XLSX
      const content = `ORGANIZATION REPORT DOSSIER\n\nTitle: ${report.title}\nCode: ${report.code}\nCategory: ${report.category}\nDate: ${dateStr}\n\nKey Metrics:\n- Total Active Headcount: 248 Staff\n- Diversity Index: 42% Female / 58% Male\n- Annualized Turnover: 4.2%\n- Budget Efficiency: 88.4%\n\nVerified by Antigravity HCM Engine.`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${report.code}_${dateStr}.${format.toLowerCase()}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Exported ${report.code} as ${format}!`);
    }
  };

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchesSearch =
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'all' ? true : r.category.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [reports, searchQuery, selectedCategory]);

  // Gender breakdown calculations for SVG Donut
  const totalStaff = 248;
  const femaleCount = 104; // 42%
  const maleCount = 144;   // 58%
  const donutRadius = 40;
  const circumference = 2 * Math.PI * donutRadius; // ~251.3
  const femaleLength = (femaleCount / totalStaff) * circumference;
  const maleLength = (maleCount / totalStaff) * circumference;

  return (
    <div className="space-y-6">
      {/* ── Subheader Controls & Period Switcher ────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card p-4 rounded-xl border border-border/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              Organizational Telemetry & Analytics Hub
              <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                Live Data Stream
              </Badge>
            </h2>
            <p className="text-xs text-muted-foreground">
              Real-time multi-dimensional organizational reporting, diversity ratio, headcount capacity, & budget variance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="h-8 text-xs w-36">
              <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Last 30 Days" className="text-xs">Last 30 Days</SelectItem>
              <SelectItem value="Q3 2026" className="text-xs">Q3 2026 (Current)</SelectItem>
              <SelectItem value="YTD 2026" className="text-xs">YTD 2026</SelectItem>
              <SelectItem value="FY 2025-26" className="text-xs">FY 2025-26</SelectItem>
            </SelectContent>
          </Select>

          <Button
            size="sm"
            className="h-8 text-xs gap-1.5 font-semibold"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" /> Generate Report
          </Button>
        </div>
      </div>

      {/* ── 1. Top Analytics & Demographics Scorecards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80 hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Active Headcount</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">248 Staff</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-0.5">
                <ArrowUpRight className="h-3 w-3" /> +12% YoY Growth
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80 hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Gender Diversity Ratio</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">42% F / 58% M</p>
              <p className="text-[10px] text-violet-600 font-semibold mt-1 flex items-center gap-0.5">
                <Sparkles className="h-3 w-3" /> Target 45% by Q4
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 shrink-0">
              <PieChart className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80 hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Annualized Turnover</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">4.2%</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-0.5">
                <TrendingDown className="h-3 w-3" /> Benchmark &lt; 8% (Low Risk)
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80 hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Annual Budget Variance</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">₹46.5 / 52.6 Cr</p>
              <p className="text-[10px] text-amber-600 font-semibold mt-1 flex items-center gap-0.5">
                <CheckCircle2 className="h-3 w-3" /> 88.4% Spent (₹6.1 Cr Reserve)
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── View Navigation Tabs ─────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
            activeTab === 'overview'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5" /> All Analytics & Visual Graphs
        </button>
        <button
          onClick={() => setActiveTab('detailed')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
            activeTab === 'detailed'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <Layers className="h-3.5 w-3.5" /> Seniority & Facility Telemetry
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
            activeTab === 'catalog'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <FileSpreadsheet className="h-3.5 w-3.5" /> Report Library & Downloader ({filteredReports.length})
        </button>
      </div>

      {/* ── TAB 1: ALL ANALYTICS & VISUAL GRAPHS (GRAPH SUITE) ───── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Row 1: Dual Interactive Graphs (Headcount vs Capacity + Diversity Donut) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Graph 1: Headcount & Span of Control by Department */}
            <Card className="lg:col-span-7 rounded-xl border border-border/80 shadow-xs flex flex-col justify-between">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    <span>Departmental Headcount & Capacity Utilization</span>
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    248 / 280 (88.6%)
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Active staff count vs planned headcount capacity across functional units
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 space-y-4">
                {DEPT_ANALYTICS.map(d => {
                  const pct = Math.round((d.count / d.capacity) * 100);
                  const isHovered = hoveredDept?.name === d.name;
                  return (
                    <div
                      key={d.name}
                      className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                        isHovered ? 'bg-muted/60 border-primary/50 shadow-xs' : 'bg-card border-border/60 hover:bg-muted/30'
                      }`}
                      onMouseEnter={() => setHoveredDept(d)}
                      onMouseLeave={() => setHoveredDept(null)}
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="font-semibold text-foreground">{d.name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            ({d.mgrCount} Leads, {d.icCount} ICs)
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-xs font-bold text-foreground">{d.count}</span>
                          <span className="text-xs text-muted-foreground">/ {d.capacity} Cap</span>
                          <Badge
                            variant="secondary"
                            className={`text-[9.5px] px-1.5 py-0 h-4 font-bold ${
                              pct >= 90 ? 'bg-amber-500/15 text-amber-700' : 'bg-emerald-500/15 text-emerald-700'
                            }`}
                          >
                            {pct}%
                          </Badge>
                        </div>
                      </div>

                      {/* Stacked Capacity Bar */}
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted flex relative">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: d.color }}
                        />
                      </div>
                    </div>
                  );
                })}

                {hoveredDept && (
                  <div className="p-2.5 bg-primary/5 border border-primary/20 rounded-lg text-xs flex items-center justify-between text-primary">
                    <span>
                      Selected: <strong>{hoveredDept.name}</strong> • Span of Control: 1 Lead per {Math.round(hoveredDept.icCount / hoveredDept.mgrCount)} Staff
                    </span>
                    <span className="font-mono font-bold">
                      Budget: ₹{hoveredDept.budgetSpent} Cr / ₹{hoveredDept.budgetAllocated} Cr
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Graph 2: Workforce Gender & Demographic Breakdown (Donut Chart) */}
            <Card className="lg:col-span-5 rounded-xl border border-border/80 shadow-xs flex flex-col justify-between">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <PieChart className="h-4 w-4 text-violet-600" />
                    <span>Gender & Demographic Diversity</span>
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] text-violet-600 border-violet-500/30 font-semibold">
                    Target: 45% F
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Proportionate gender split and leadership inclusion ratio
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 flex flex-col items-center justify-center space-y-4">
                {/* SVG Donut */}
                <div className="relative w-44 h-44 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle cx="50" cy="50" r={donutRadius} stroke="#f1f5f9" strokeWidth="12" fill="transparent" />

                    {/* Male segment (Primary blue) */}
                    <circle
                      cx="50"
                      cy="50"
                      r={donutRadius}
                      stroke="#4f46e5"
                      strokeWidth="12"
                      strokeDasharray={`${maleLength} ${circumference}`}
                      strokeDashoffset={0}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-700"
                    />

                    {/* Female segment (Violet) */}
                    <circle
                      cx="50"
                      cy="50"
                      r={donutRadius}
                      stroke="#8b5cf6"
                      strokeWidth="12"
                      strokeDasharray={`${femaleLength} ${circumference}`}
                      strokeDashoffset={-maleLength}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-700"
                    />
                  </svg>

                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Total</span>
                    <span className="text-xl font-bold text-foreground">248</span>
                    <span className="text-[10px] text-emerald-600 font-semibold">Staff Pool</span>
                  </div>
                </div>

                {/* Legend & Breakdown */}
                <div className="grid grid-cols-2 gap-3 w-full pt-1">
                  <div className="p-2.5 rounded-lg border border-border/80 bg-card text-center">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                      <span className="h-2 w-2 rounded-full bg-[#8b5cf6]" />
                      <span className="font-semibold">Female</span>
                    </div>
                    <p className="text-base font-bold text-foreground mt-0.5">104 (42%)</p>
                    <p className="text-[10px] text-violet-600 font-medium">38% in Leadership</p>
                  </div>

                  <div className="p-2.5 rounded-lg border border-border/80 bg-card text-center">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                      <span className="h-2 w-2 rounded-full bg-[#4f46e5]" />
                      <span className="font-semibold">Male</span>
                    </div>
                    <p className="text-base font-bold text-foreground mt-0.5">144 (58%)</p>
                    <p className="text-[10px] text-primary font-medium">62% in Leadership</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Row 2: Dual Graphs (Budget vs Actual Spend + Turnover Trend Line) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Graph 3: Departmental Annual Budget vs Actual Payroll Spend */}
            <Card className="lg:col-span-7 rounded-xl border border-border/80 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                    <span>Departmental Budget Allocated vs. Actual Run-Rate</span>
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30 font-semibold font-mono">
                    ₹6.1 Cr Favorable
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Financial envelope vs current annualized run-rate (in ₹ Crores)
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 sm:p-5">
                {/* SVG Grouped Column Chart */}
                <div className="h-56 w-full relative pt-2 pb-6">
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[9.5px] text-muted-foreground">
                    <div className="border-b border-dashed border-border/40 w-full">₹16 Cr</div>
                    <div className="border-b border-dashed border-border/40 w-full">₹12 Cr</div>
                    <div className="border-b border-dashed border-border/40 w-full">₹8 Cr</div>
                    <div className="border-b border-dashed border-border/40 w-full">₹4 Cr</div>
                    <div className="border-b border-border w-full">₹0</div>
                  </div>

                  {/* SVG Bars */}
                  <div className="absolute inset-x-8 bottom-6 top-3 flex items-end justify-between">
                    {DEPT_ANALYTICS.map(dept => {
                      const maxBudget = 16.0;
                      const allocHeight = (dept.budgetAllocated / maxBudget) * 100;
                      const spentHeight = (dept.budgetSpent / maxBudget) * 100;

                      return (
                        <div key={dept.name} className="flex flex-col items-center gap-1 group relative">
                          {/* Tooltip on hover */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 bg-foreground text-background text-[10px] rounded px-2 py-1 pointer-events-none whitespace-nowrap z-20 shadow-md font-mono">
                            Allocated: ₹{dept.budgetAllocated} Cr | Spent: ₹{dept.budgetSpent} Cr
                          </div>

                          <div className="flex items-end gap-1 h-36">
                            {/* Allocated Bar */}
                            <div
                              className="w-3.5 rounded-t bg-muted-foreground/30 transition-all hover:opacity-80"
                              style={{ height: `${allocHeight}%` }}
                              title={`Allocated: ₹${dept.budgetAllocated} Cr`}
                            />
                            {/* Spent Bar */}
                            <div
                              className="w-3.5 rounded-t bg-emerald-500 transition-all hover:opacity-80"
                              style={{ height: `${spentHeight}%` }}
                              title={`Spent: ₹${dept.budgetSpent} Cr`}
                            />
                          </div>
                          <span className="text-[9.5px] text-muted-foreground font-semibold truncate w-14 text-center">
                            {dept.name.split(' ')[0]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Chart Footer / Legend */}
                <div className="flex items-center justify-center gap-6 pt-2 border-t border-border/50 text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="h-3 w-3 rounded bg-muted-foreground/30" /> Approved Budget Envelope
                  </span>
                  <span className="flex items-center gap-1.5 text-foreground font-semibold">
                    <span className="h-3 w-3 rounded bg-emerald-500" /> Actual Payroll Disbursement
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Graph 4: Turnover Rate & Resignation Trend Spline Wave Graph */}
            <Card className="lg:col-span-5 rounded-xl border border-border/80 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-rose-500" />
                    <span>Annualized Turnover & Retention Curve</span>
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30 font-semibold">
                    Healthy &lt; 8.0%
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Monthly attrition trajectory vs statutory industry safety threshold
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 sm:p-5">
                <div className="h-56 w-full relative pt-2">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[9px] text-muted-foreground">
                    <div className="border-b border-dashed border-rose-500/40 w-full flex justify-between text-rose-500 font-mono">
                      <span>Benchmark Ceiling (8.0%)</span>
                    </div>
                    <div className="border-b border-dashed border-border/40 w-full">6.0%</div>
                    <div className="border-b border-dashed border-border/40 w-full">4.0%</div>
                    <div className="border-b border-dashed border-border/40 w-full">2.0%</div>
                    <div className="border-b border-border w-full">0.0%</div>
                  </div>

                  {/* SVG Spline Curve */}
                  <svg className="w-full h-full relative z-10" viewBox="0 0 350 160" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="turnoverGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Area fill */}
                    <path
                      d={`M 15 ${140 - (TURNOVER_TIMELINE[0].rate / 8.0) * 110} ` +
                        TURNOVER_TIMELINE.slice(1).map((pt, i) => `L ${15 + (i + 1) * 45} ${140 - (pt.rate / 8.0) * 110}`).join(' ') +
                        ` L ${15 + 7 * 45} 140 L 15 140 Z`}
                      fill="url(#turnoverGrad)"
                    />

                    {/* Line stroke */}
                    <path
                      d={`M 15 ${140 - (TURNOVER_TIMELINE[0].rate / 8.0) * 110} ` +
                        TURNOVER_TIMELINE.slice(1).map((pt, i) => `L ${15 + (i + 1) * 45} ${140 - (pt.rate / 8.0) * 110}`).join(' ')}
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Interactive Points */}
                    {TURNOVER_TIMELINE.map((pt, i) => {
                      const cx = 15 + i * 45;
                      const cy = 140 - (pt.rate / 8.0) * 110;
                      return (
                        <circle
                          key={pt.month}
                          cx={cx}
                          cy={cy}
                          r={hoveredPoint?.month === pt.month ? 5 : 3.5}
                          fill="#ffffff"
                          stroke="#f43f5e"
                          strokeWidth="2.5"
                          className="cursor-pointer transition-all hover:scale-125"
                          onMouseEnter={() => setHoveredPoint(pt)}
                        />
                      );
                    })}
                  </svg>

                  {/* X-axis labels */}
                  <div className="absolute inset-x-3 bottom-0 flex justify-between text-[10px] text-muted-foreground font-mono">
                    {TURNOVER_TIMELINE.map(pt => (
                      <span key={pt.month}>{pt.month}</span>
                    ))}
                  </div>
                </div>

                {/* Active point hover bar */}
                <div className="mt-4 p-2 bg-muted/30 rounded-lg border border-border/60 text-xs flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {hoveredPoint ? `Month: ${hoveredPoint.month} 2026` : 'Current Rolling Average'}
                  </span>
                  <span className="font-mono font-bold text-foreground">
                    Rate: {hoveredPoint ? `${hoveredPoint.rate}% (${hoveredPoint.exits} departures)` : '4.2% (11 YTD exits)'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── TAB 2: SENIORITY PYRAMID & FACILITY OCCUPANCY ───────── */}
      {activeTab === 'detailed' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Graph 5: Seniority & Pay Grade Hierarchy Pyramid */}
            <Card className="lg:col-span-7 rounded-xl border border-border/80 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" />
                    <span>Pay Grade & Seniority Band Hierarchy Pyramid</span>
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    6 Standard Bands
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Distribution of personnel by career ladder grade bands and compensation envelopes
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 space-y-3">
                {SENIORITY_PYRAMID.map((grade) => (
                  <div key={grade.grade} className="p-2.5 rounded-lg border border-border/60 bg-card hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-foreground flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: grade.color }} />
                        {grade.grade}
                        <span className="text-muted-foreground font-normal">({grade.title})</span>
                      </span>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-[11px] text-muted-foreground">{grade.salary}</span>
                        <span className="font-bold text-foreground">{grade.count} Staff ({grade.pct}%)</span>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${grade.pct * 2.8}%`, backgroundColor: grade.color }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Graph 6: Biometric Facility Occupancy & Work Mode Split */}
            <Card className="lg:col-span-5 rounded-xl border border-border/80 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-cyan-600" />
                    <span>Facility Physical Occupancy & Work Mode</span>
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] text-cyan-600 border-cyan-500/30 font-semibold font-mono">
                    206 On-Premise
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Telemetry from IoT smart turnstiles & verified remote logins
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 space-y-4">
                {FACILITY_OCCUPANCY.map(fac => (
                  <div key={fac.facility} className="p-3 rounded-lg border border-border/60 bg-card space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: fac.color }} />
                        {fac.facility}
                      </span>
                      <span className="font-mono font-bold text-foreground">
                        {fac.active} / {fac.capacity} ({fac.occupancy}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${fac.occupancy}%`, backgroundColor: fac.color }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                      <span>Physical Swipes: {fac.active}</span>
                      <span>Approved Hybrid / Remote: {fac.remote}</span>
                    </div>
                  </div>
                ))}

                {/* Statutory POSH & Compliance Mini Card */}
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-2">
                  <div className="flex items-center justify-between font-semibold text-emerald-700">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4" /> Statutory POSH &amp; ISO 27001 Status
                    </span>
                    <span>100% Compliant</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    All 248 active employees have digitally signed corporate code of conduct, anti-harassment declarations, and data protection disclosures.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── TAB 3: REPORT LIBRARY & EXPORTER ─────────────────────── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-primary" /> Enterprise Report Library & Custom Generator
              </CardTitle>
              <CardDescription className="text-xs">
                Pre-built statutory audits, diversity reports, compensation analysis & custom report exporter
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Category Filter Pills */}
              <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'headcount', label: 'Headcount' },
                  { id: 'turnover', label: 'Turnover' },
                  { id: 'compensation', label: 'Compensation' },
                  { id: 'compliance', label: 'Compliance' },
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Search Input */}
              <div className="relative w-40 sm:w-52">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filter reports..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-background"
                />
              </div>

              {/* Custom Report Generator Button */}
              <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Generate Custom Report
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Report Code</TableHead>
                <TableHead className="text-xs">Report Title & Summary</TableHead>
                <TableHead className="text-xs">Category</TableHead>
                <TableHead className="text-xs">Frequency</TableHead>
                <TableHead className="text-xs">Last Generated</TableHead>
                <TableHead className="text-xs">Format</TableHead>
                <TableHead className="text-right text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map(r => (
                <TableRow key={r.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold text-primary">{r.code}</TableCell>
                  <TableCell className="text-xs text-foreground max-w-sm">
                    <div
                      className="font-semibold cursor-pointer hover:underline text-foreground flex items-center gap-1.5 hover:text-primary transition-colors"
                      onClick={() => setPreviewReport(r)}
                    >
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      {r.title}
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                      {r.description}
                    </p>
                  </TableCell>
                  <TableCell className="text-xs">
                    <Badge variant="outline" className="text-[10px] font-medium">
                      {r.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-medium">{r.frequency}</TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">{r.lastGenerated}</TableCell>
                  <TableCell className="text-xs font-mono">
                    <Badge variant="outline" className="text-[10px] font-mono font-semibold">
                      {r.format} ({r.size})
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
                        onClick={() => setPreviewReport(r)}
                        title="View Live Analytics"
                      >
                        <Eye className="h-3.5 w-3.5" /> Preview
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-primary hover:text-primary gap-1"
                        onClick={() => handleExport(r)}
                        title={`Download ${r.format}`}
                      >
                        <Download className="h-3.5 w-3.5" /> Download
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── 4. Live Report Deep-Dive / Preview Modal ─────────────── */}
      <Dialog open={!!previewReport} onOpenChange={open => !open && setPreviewReport(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          {previewReport && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between pr-4">
                  <span className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs text-primary border-primary/30">
                      {previewReport.code}
                    </Badge>
                    <span className="text-base font-bold">{previewReport.title}</span>
                  </span>
                  <Badge className="font-mono text-[10px]">
                    {previewReport.frequency} • {previewReport.format}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 text-xs pt-1">
                {/* Meta summary card */}
                <div className="p-3 bg-muted/30 rounded-xl border border-border/60 grid grid-cols-3 gap-3">
                  <div>
                    <span className="text-muted-foreground text-[10.5px] block">Category:</span>
                    <span className="font-semibold text-foreground">{previewReport.category}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10.5px] block">Audited Records:</span>
                    <span className="font-mono font-semibold text-foreground">{previewReport.recordsCount} Staff Records</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10.5px] block">Generated Stamp:</span>
                    <span className="font-mono font-semibold text-foreground">{previewReport.lastGenerated}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-1">Executive Summary:</h4>
                  <p className="text-muted-foreground text-xs leading-relaxed p-2.5 bg-card border rounded-lg">
                    {previewReport.description}
                  </p>
                </div>

                {/* Specific Live Analytics Chart within Preview */}
                <div className="p-3 border rounded-xl bg-card space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <BarChart3 className="h-4 w-4 text-primary" /> Key Dimension Breakdown
                    </span>
                    <span className="text-[10px] text-muted-foreground">Live Telemetry Synchronized</span>
                  </div>

                  {previewReport.category === 'Compensation' ? (
                    <div className="space-y-2">
                      {DEPT_ANALYTICS.slice(0, 4).map(d => (
                        <div key={d.name} className="flex items-center justify-between text-xs p-1.5 border-b border-border/40">
                          <span className="font-medium text-foreground">{d.name}</span>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="text-muted-foreground">Allocated: ₹{d.budgetAllocated} Cr</span>
                            <span className="text-emerald-600 font-bold">Spent: ₹{d.budgetSpent} Cr</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : previewReport.category === 'Turnover' ? (
                    <div className="space-y-2">
                      {TURNOVER_TIMELINE.slice(4).map(t => (
                        <div key={t.month} className="flex items-center justify-between text-xs p-1.5 border-b border-border/40">
                          <span className="font-medium text-foreground">{t.month} 2026</span>
                          <span className="font-mono font-bold text-foreground">Turnover Rate: {t.rate}% (Benchmark 8.0%)</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {DEPT_ANALYTICS.map(d => (
                        <div key={d.name} className="flex items-center justify-between text-xs p-1.5 border-b border-border/40">
                          <span className="font-medium text-foreground">{d.name}</span>
                          <span className="font-mono font-bold text-foreground">{d.count} Staff ({d.capacity} Max Cap)</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <DialogFooter className="pt-2 flex items-center justify-between sm:justify-between w-full">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => handleExport(previewReport, 'CSV')}
                    >
                      Export CSV
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => handleExport(previewReport, 'XLSX')}
                    >
                      Export Excel
                    </Button>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="text-xs font-semibold"
                    onClick={() => handleExport(previewReport, 'PDF')}
                  >
                    <Download className="h-3.5 w-3.5 mr-1" /> Download Full PDF Report
                  </Button>
                </DialogFooter>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── 5. Custom Report Generator Dialog ───────────────────── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Custom Organization Report</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleGenerateReport}>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Report Title *</Label>
              <Input
                placeholder="Title for report"
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Report Category</Label>
                <Select value={formCategory} onValueChange={(v: any) => setFormCategory(v)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Headcount" className="text-xs">Headcount &amp; Demographics</SelectItem>
                    <SelectItem value="Turnover" className="text-xs">Turnover &amp; Retention</SelectItem>
                    <SelectItem value="Compensation" className="text-xs">Compensation &amp; Budget</SelectItem>
                    <SelectItem value="Compliance" className="text-xs">Compliance &amp; POSH Audit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Export Format</Label>
                <Select value={formFormat} onValueChange={(v: any) => setFormFormat(v)}>
                  <SelectTrigger className="h-9 text-xs font-mono">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PDF" className="text-xs font-mono">PDF Document (.pdf)</SelectItem>
                    <SelectItem value="XLSX" className="text-xs font-mono">Excel Workbook (.xlsx)</SelectItem>
                    <SelectItem value="CSV" className="text-xs font-mono">Raw Dataset (.csv)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Report Scope / Description</Label>
              <textarea
                placeholder="Describe reporting scope, filters, and target parameters..."
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                rows={3}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-2xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-[75px]"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs font-semibold">
                Generate &amp; Add to Library
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
