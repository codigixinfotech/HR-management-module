import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Filter, Search, BarChart3, Clock, Factory, Users, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import type { Company } from '@/api/types';
import { useWorkforceBranch } from '@/pages/workforce/WorkforceBranchContext';
import { WorkforceBranchFilter } from '@/pages/workforce/WorkforceBranchFilter';

interface WorkforceReportItem {
  id: string;
  title: string;
  category: string;
  frequency: string;
  format: 'CSV' | 'PDF' | 'XLSX';
  lastRun: string;
  description: string;
  recordsCount: string;
  branch?: string;
}

const WORKFORCE_REPORTS: WorkforceReportItem[] = [
  {
    id: 'rep-ho-1',
    title: 'Corporate Head Office Shift & Duty Roster Summary',
    category: 'Shift Analytics',
    frequency: 'Monthly',
    format: 'PDF',
    lastRun: '30 Sep 2026',
    description: 'Consolidated overview of corporate headquarters staff shift compliance, flexi-time logs and attendance.',
    recordsCount: '128 Personnel',
    branch: 'Head Office',
  },
  {
    id: 'rep-ho-2',
    title: 'Headquarter Facilities SLA & Vendor Audit Log',
    category: 'Vendor Compliance',
    frequency: 'Monthly',
    format: 'PDF',
    lastRun: '28 Sep 2026',
    description: 'Statutory compliance verification and service level agreement audits for corporate vendors.',
    recordsCount: '2 Agencies',
    branch: 'Head Office',
  },
  {
    id: 'rep-1',
    title: 'Shift Utilization & Overtime Excess Hours Report',
    category: 'Shift Analytics',
    frequency: 'Weekly',
    format: 'CSV',
    lastRun: '28 Sep 2026',
    description: 'Detailed analysis of scheduled vs actual shift hours worked, overtime excess and night shift distribution.',
    recordsCount: '128 Employees',
  },
  {
    id: 'rep-2',
    title: 'Machine Operator Line Efficiency & Downtime Audit',
    category: 'Shop Floor Operations',
    frequency: 'Daily',
    format: 'XLSX',
    lastRun: '30 Sep 2026',
    description: 'Line-by-line machine productivity metrics, operator assignments and unexpected maintenance downtime records.',
    recordsCount: '5 Production Lines',
  },
  {
    id: 'rep-3',
    title: 'Contractor Vendor SLA & Staffing Headcount Ledger',
    category: 'Vendor Compliance',
    frequency: 'Monthly',
    format: 'PDF',
    lastRun: '25 Sep 2026',
    description: 'Agency deployed headcounts vs approved quotas, CLRA statutory renewals and hourly billing reconciliation.',
    recordsCount: '4 Vendor Agencies',
  },
  {
    id: 'rep-4',
    title: 'Statutory Blue-Collar Muster Roll & Form XVI',
    category: 'Labour Compliance',
    frequency: 'Monthly',
    format: 'PDF',
    lastRun: '01 Sep 2026',
    description: 'Official government inspection muster roll format recording daily attendance, wages and statutory deductions.',
    recordsCount: '64 Contractual',
  },
  {
    id: 'rep-5',
    title: 'Night Shift Differential & Hazardous Area Allowance Report',
    category: 'Payroll Telemetry',
    frequency: 'Bi-Weekly',
    format: 'CSV',
    lastRun: '15 Sep 2026',
    description: 'Automated shift allowance computation for Night (C) duty and specialised high-temperature assembly machinery.',
    recordsCount: '24 Operators',
    branch: 'Pune Manufacturing Plant',
  },
];

export function WorkforceReportsTab({ companyId, companies }: { companyId?: string; companies?: Company[] }) {
  const {
    selectedBranch,
    setSelectedBranch,
    branches,
    isBranchAdmin,
    isSuperOrCompanyAdmin,
    assignedBranchName,
    matchBranch,
  } = useWorkforceBranch();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const filtered = WORKFORCE_REPORTS.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || r.category === selectedCategory;
    const matchesBranch = matchBranch({
      branchName: r.branch || r.title,
      location: r.branch,
    });
    return matchesSearch && matchesCat && matchesBranch;
  });

  const handleExport = (report: WorkforceReportItem) => {
    toast.success(`Generating and downloading: ${report.title} (${report.format})`);
  };

  return (
    <div className="space-y-6">
      {/* Top Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-2xs">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Shift Roster Sync</p>
                <p className="text-xl font-bold text-foreground">100% On-Time</p>
                <p className="text-[10px] text-muted-foreground">Updated for all shifts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-success/10 text-success">
                <Factory className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Line Efficiency</p>
                <p className="text-xl font-bold text-foreground">96.2% Avg</p>
                <p className="text-[10px] text-success font-medium">+1.4% from last week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-info/10 text-info">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Vendor Quota Fill</p>
                <p className="text-xl font-bold text-foreground">64 / 64 Staff</p>
                <p className="text-[10px] text-muted-foreground">3 Staffing partners active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-warning/10 text-warning">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Statutory Audit</p>
                <p className="text-xl font-bold text-foreground">Verified</p>
                <p className="text-[10px] text-muted-foreground">CLRA Form XVI Compliant</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Directory Card */}
      <Card className="shadow-2xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-semibold">Workforce Reports & Compliance Exports</CardTitle>
            </div>
            <CardDescription>
              Download factory floor operations, shift analytics, overtime logs and statutory blue-collar returns
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-56">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search reports..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>

            {/* Branch Filter (Matching Employee Master Page) */}
            <WorkforceBranchFilter
              isSuperOrCompanyAdmin={isSuperOrCompanyAdmin}
              isBranchAdmin={isBranchAdmin}
              selectedBranch={selectedBranch}
              onBranchChange={setSelectedBranch}
              branches={branches}
              assignedBranchName={assignedBranchName}
            />

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-8 w-44 text-xs">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">All Categories</SelectItem>
                <SelectItem value="Shift Analytics" className="text-xs">Shift Analytics</SelectItem>
                <SelectItem value="Shop Floor Operations" className="text-xs">Shop Floor Operations</SelectItem>
                <SelectItem value="Vendor Compliance" className="text-xs">Vendor Compliance</SelectItem>
                <SelectItem value="Labour Compliance" className="text-xs">Labour Compliance</SelectItem>
                <SelectItem value="Payroll Telemetry" className="text-xs">Payroll Telemetry</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Report Title</TableHead>
                  <TableHead className="text-xs">Category</TableHead>
                  <TableHead className="text-xs">Frequency</TableHead>
                  <TableHead className="text-xs">Records Scope</TableHead>
                  <TableHead className="text-xs">Last Generated</TableHead>
                  <TableHead className="text-xs">File Format</TableHead>
                  <TableHead className="text-xs text-right">Download</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-xs text-muted-foreground">
                      No reports found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((rep) => (
                    <TableRow key={rep.id}>
                      <TableCell className="text-xs">
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          {rep.title}
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">{rep.description}</p>
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="text-[10px]">
                          {rep.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{rep.frequency}</TableCell>
                      <TableCell className="text-xs font-medium">{rep.recordsCount}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">{rep.lastRun}</TableCell>
                      <TableCell className="text-xs">
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-mono font-semibold"
                        >
                          {rep.format}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExport(rep)}
                          className="h-7 text-xs gap-1.5"
                        >
                          <Download className="h-3 w-3" /> Export
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
