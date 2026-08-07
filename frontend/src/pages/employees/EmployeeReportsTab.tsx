import { useState } from 'react';
import { toast } from 'sonner';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Users,
  FileDown,
  PieChart,
  Target,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface AgeDistribution {
  range: string;
  count: number;
  percentage: string;
}

interface TenureMetrics {
  bracket: string;
  count: number;
  percentage: string;
}

const AGE_DISTRIBUTION: AgeDistribution[] = [
  { range: '21 - 25 years', count: 8, percentage: '19.0%' },
  { range: '26 - 30 years', count: 18, percentage: '42.8%' },
  { range: '31 - 35 years', count: 12, percentage: '28.5%' },
  { range: '36 - 40 years', count: 4, percentage: '9.5%' },
];

const TENURE_METRICS: TenureMetrics[] = [
  { bracket: '< 1 year', count: 12, percentage: '28.5%' },
  { bracket: '1 - 2 years', count: 18, percentage: '42.8%' },
  { bracket: '2 - 3 years', count: 10, percentage: '23.8%' },
  { bracket: '> 3 years', count: 2, percentage: '4.7%' },
];

export function EmployeeReportsTab() {
  const [ages] = useState<AgeDistribution[]>(AGE_DISTRIBUTION);
  const [tenures] = useState<TenureMetrics[]>(TENURE_METRICS);

  const handleExportPDF = () => {
    toast.success('Compiling employee demographics... Downloading PDF report...');
  };

  const handleExportCSV = () => {
    toast.success('Employee age and tenure statistics exported to CSV');
  };

  return (
    <div className="space-y-6">
      {/* ── 1. Top Demographics Telemetry Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Average Tenure</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">2.4 Years</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">High retention stability</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Average Age</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">28.5 Years</p>
              <p className="text-[10px] text-primary font-semibold mt-1">Young dynamic workforce</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Diversity Ratio</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">42:58</p>
              <p className="text-[10px] text-violet-600 font-semibold mt-1">Gender split balance</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 shrink-0">
              <Target className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Attrition Index</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">3.8% YTD</p>
              <p className="text-[10px] text-amber-600 font-semibold mt-1">Under corporate cap (8.0%)</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Visual Demographic Distributions ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Age Demographics Card */}
        <Card className="shadow-xs border-border/80">
          <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <PieChart className="h-4 w-4 text-primary" /> Age Demographics Distribution
              </CardTitle>
              <CardDescription className="text-xs">
                Workforce age segments mapping active headcount splits
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={handleExportCSV}>
                <FileDown className="h-3 w-3" /> Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Age Range Bracket</TableHead>
                  <TableHead className="text-xs">Active Headcount</TableHead>
                  <TableHead className="text-right text-xs">Workforce Split Ratio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ages.map(a => (
                  <TableRow key={a.range} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="text-xs font-semibold text-foreground">{a.range}</TableCell>
                    <TableCell className="text-xs font-mono font-medium">{a.count} Employees</TableCell>
                    <TableCell className="text-right text-xs font-mono font-semibold text-primary">{a.percentage}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Tenure Bracket Metrics */}
        <Card className="shadow-xs border-border/80">
          <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-600" /> Tenure Service Bracket Metrics
              </CardTitle>
              <CardDescription className="text-xs">
                Monitor duration profiles of workforce cohorts active in the firm
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={handleExportPDF}>
                <FileDown className="h-3 w-3" /> PDF Report
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Tenure Bracket</TableHead>
                  <TableHead className="text-xs">Active Headcount</TableHead>
                  <TableHead className="text-right text-xs">Workforce Split Ratio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenures.map(t => (
                  <TableRow key={t.bracket} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="text-xs font-semibold text-foreground">{t.bracket}</TableCell>
                    <TableCell className="text-xs font-mono font-medium">{t.count} Employees</TableCell>
                    <TableCell className="text-right text-xs font-mono font-semibold text-primary">{t.percentage}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
