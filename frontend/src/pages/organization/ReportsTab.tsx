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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

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
}

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
  },
];

const DEPT_DISTRIBUTION = [
  { name: 'Engineering & Tech', count: 84, percentage: 33.9, color: 'bg-primary' },
  { name: 'Operations & Manufacturing', count: 56, percentage: 22.6, color: 'bg-emerald-500' },
  { name: 'Global Sales & Marketing', count: 42, percentage: 16.9, color: 'bg-amber-500' },
  { name: 'Human Resources', count: 28, percentage: 11.3, color: 'bg-violet-500' },
  { name: 'Finance & Treasury', count: 20, percentage: 8.1, color: 'bg-cyan-500' },
  { name: 'Product & UX Design', count: 18, percentage: 7.2, color: 'bg-rose-500' },
];

import { useCompany } from '@/context/CompanyContext';

export function ReportsTab({ companyId: propCompanyId }: { companyId?: string }) {
  const { activeCompanyId: ctxCompanyId } = useCompany();
  const activeCompanyId = propCompanyId || ctxCompanyId;
  const [reports, setReports] = useState<ReportItem[]>(INITIAL_REPORTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Custom Report Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<'Headcount' | 'Turnover' | 'Compensation' | 'Compliance'>('Headcount');
  const [formFormat, setFormFormat] = useState<'PDF' | 'XLSX' | 'CSV'>('PDF');

  const openAddModal = () => {
    setFormTitle('');
    setFormCategory('Headcount');
    setFormFormat('PDF');
    setIsOpen(true);
  };

  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle) {
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
      size: '1.6 MB',
      color: 'bg-primary',
    };

    setReports(prev => [newReport, ...prev]);
    toast.success(`Generated report "${formTitle}" successfully!`);
    setIsOpen(false);
  };

  const handleExport = (title: string, format: string) => {
    toast.success(`Downloading ${format} export for "${title}"`);
  };

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchesSearch =
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'all' ? true : r.category.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [reports, searchQuery, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* ── 1. Top Analytics & Demographics Scorecards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Active Headcount</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">248 Staff</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">+12% YoY Growth</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Gender Diversity Ratio</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">42% F / 58% M</p>
              <p className="text-[10px] text-primary font-semibold mt-1">Equal Opportunity Target 45%</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 shrink-0">
              <PieChart className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Annualized Turnover</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">4.2%</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">Industry Benchmark &lt; 8%</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Report Library Items</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">{reports.length} Reports</p>
              <p className="text-[10px] text-amber-600 font-semibold mt-1">Real-time Telemetry Sync</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
              <BarChart3 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Departmental Headcount Distribution Chart ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <PieChart className="h-4 w-4 text-primary" /> Workforce Headcount Distribution by Department
          </CardTitle>
          <CardDescription className="text-xs">
            Proportional breakdown of active staff headcount across functional units
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            {DEPT_DISTRIBUTION.map(dept => (
              <div key={dept.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${dept.color}`} />
                    {dept.name}
                  </span>
                  <span className="font-mono font-semibold text-muted-foreground">
                    {dept.count} Employees ({dept.percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full ${dept.color}`} style={{ width: `${dept.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── 3. Enterprise Reports Repository Panel ── */}
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
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${selectedCategory === cat.id
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

              {/* Custom Report Generator Dialog */}
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openAddModal}>
                    <Plus className="h-3.5 w-3.5" /> Generate Custom Report
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Generate Custom Organization Report</DialogTitle>
                  </DialogHeader>
                  <form className="space-y-4" onSubmit={handleGenerateReport}>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Report Title</Label>
                      <Input
                        placeholder="e.g. Q3 Executive Headcount & Attrition Analysis"
                        value={formTitle}
                        onChange={e => setFormTitle(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Report Category</Label>
                        <Select value={formCategory} onValueChange={(v: any) => setFormCategory(v)}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Headcount" className="text-xs">Headcount & Demographics</SelectItem>
                            <SelectItem value="Turnover" className="text-xs">Turnover & Retention</SelectItem>
                            <SelectItem value="Compensation" className="text-xs">Compensation & Budget</SelectItem>
                            <SelectItem value="Compliance" className="text-xs">Compliance & POSH Audit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Export Format</Label>
                        <Select value={formFormat} onValueChange={(v: any) => setFormFormat(v)}>
                          <SelectTrigger className="h-9 text-xs font-mono">
                            <SelectValue placeholder="Select format" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PDF" className="text-xs font-mono">PDF Document</SelectItem>
                            <SelectItem value="XLSX" className="text-xs font-mono">Excel (.xlsx)</SelectItem>
                            <SelectItem value="CSV" className="text-xs font-mono">Raw Data (.csv)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" size="sm" className="text-xs">
                        Generate & Export Report
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Report Code</TableHead>
                <TableHead className="text-xs">Report Title</TableHead>
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
                  <TableCell className="font-semibold text-xs text-foreground flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {r.title}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.category}</TableCell>
                  <TableCell className="text-xs font-medium">{r.frequency}</TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">{r.lastGenerated}</TableCell>
                  <TableCell className="text-xs font-mono">
                    <Badge variant="outline" className="text-[10px] font-mono font-semibold">
                      {r.format} ({r.size})
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-primary hover:text-primary gap-1"
                      onClick={() => handleExport(r.title, r.format)}
                    >
                      <Download className="h-3.5 w-3.5" /> Download
                    </Button>
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
