import { useState } from 'react';
import { toast } from 'sonner';
import {
  BarChart3,
  TrendingUp,
  Clock,
  DollarSign,
  Users,
  FileDown,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface ChannelMetrics {
  channel: string;
  sourced: number;
  interviewed: number;
  hired: number;
  conversion: string;
}

interface TimeToFillMetrics {
  dept: string;
  positionsFilled: number;
  avgDays: number;
  industryBenchmark: number;
}

const SOURCING_CHANNELS: ChannelMetrics[] = [
  { channel: 'LinkedIn Sourced', sourced: 560, interviewed: 32, hired: 8, conversion: '1.43%' },
  { channel: 'Careers Portal', sourced: 410, interviewed: 28, hired: 4, conversion: '0.98%' },
  { channel: 'Employee Referrals', sourced: 180, interviewed: 16, hired: 6, conversion: '3.33%' },
  { channel: 'Indeed Sourced', sourced: 98, interviewed: 8, hired: 2, conversion: '2.04%' },
];

const TIME_TO_FILL: TimeToFillMetrics[] = [
  { dept: 'Engineering', positionsFilled: 18, avgDays: 28, industryBenchmark: 35 },
  { dept: 'Product Design', positionsFilled: 6, avgDays: 24, industryBenchmark: 30 },
  { dept: 'Sales', positionsFilled: 10, avgDays: 18, industryBenchmark: 22 },
  { dept: 'Human Resources', positionsFilled: 4, avgDays: 15, industryBenchmark: 20 },
];

export function RecruitmentReportsTab() {
  const [channels] = useState<ChannelMetrics[]>(SOURCING_CHANNELS);
  const [timeToFill] = useState<TimeToFillMetrics[]>(TIME_TO_FILL);

  const handleExportPDF = () => {
    toast.success('Compiling recruitment metrics... Downloading PDF report...');
  };

  const handleExportCSV = () => {
    toast.success('Sourcing channels & pipeline statistics exported to CSV');
  };

  return (
    <div className="space-y-6">
      {/* ── 1. Top Recruitment telemetry Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Avg Time-to-Fill</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">22 Days</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">8 Days under benchmark</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Sourcing Conversion</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">12.4%</p>
              <p className="text-[10px] text-primary font-semibold mt-1">Sourced to interview ratio</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Avg Cost per Hire</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">₹18,400</p>
              <p className="text-[10px] text-violet-600 font-semibold mt-1">Agency costs optimized</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 shrink-0">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Hired (YTD)</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">38 Staff</p>
              <p className="text-[10px] text-amber-600 font-semibold mt-1">Q3 targets on track</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Visual Recruitment Funnel Analytics ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recruiting Funnel Card */}
        <Card className="shadow-xs border-border/80 lg:col-span-1">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Hiring Funnel Conversion
            </CardTitle>
            <CardDescription className="text-xs">
              Aggregate ATS step-through yields from initial profile sync to final offers signed
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-4">
            {[
              { stage: 'Sourced Candidates', count: 1248, percentage: 100, color: 'bg-primary' },
              { stage: 'Screened & Qualified', count: 340, percentage: 27, color: 'bg-indigo-500' },
              { stage: 'Interview Panels', count: 84, percentage: 6.7, color: 'bg-violet-500' },
              { stage: 'Offers Released', count: 12, percentage: 0.96, color: 'bg-amber-500' },
              { stage: 'Accepted & Hired', count: 8, percentage: 0.64, color: 'bg-emerald-500' },
            ].map(step => (
              <div key={step.stage} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">{step.stage}</span>
                  <span className="text-foreground">{step.count} ({step.percentage}%)</span>
                </div>
                <div className="h-2 w-full bg-muted/60 rounded-full overflow-hidden">
                  <div className={`h-full ${step.color}`} style={{ width: `${step.percentage === 100 ? 100 : Math.max(step.percentage * 2, 8)}%` }}></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Sourcing Channel Effectiveness */}
        <Card className="shadow-xs border-border/80 lg:col-span-2">
          <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" /> Sourcing Channel Effectiveness
              </CardTitle>
              <CardDescription className="text-xs">
                Performance matrix by applicant pipeline acquisition channels
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={handleExportCSV}>
                <FileDown className="h-3 w-3" /> Export CSV
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={handleExportPDF}>
                <FileDown className="h-3 w-3" /> PDF Report
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Acquisition Channel</TableHead>
                  <TableHead className="text-xs">Sourced Profiles</TableHead>
                  <TableHead className="text-xs">Interview Panels</TableHead>
                  <TableHead className="text-xs">Final Hired</TableHead>
                  <TableHead className="text-right text-xs">Funnel Yield (Sourced ➜ Hired)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {channels.map(c => (
                  <TableRow key={c.channel} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="text-xs font-semibold text-foreground">{c.channel}</TableCell>
                    <TableCell className="text-xs font-mono font-medium">{c.sourced} profiles</TableCell>
                    <TableCell className="text-xs font-mono font-medium">{c.interviewed} rounds</TableCell>
                    <TableCell className="text-xs font-mono font-semibold text-emerald-600">+{c.hired} Staff</TableCell>
                    <TableCell className="text-right text-xs font-mono font-semibold text-primary">{c.conversion}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* ── 3. Time-to-Fill Department Matrix ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-violet-600" /> Time-to-Fill Benchmark Matrix
          </CardTitle>
          <CardDescription className="text-xs">
            Average days taken to fill approved manpower planning positions compared against industry averages
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Department Name</TableHead>
                <TableHead className="text-xs">Target Positions Filled</TableHead>
                <TableHead className="text-xs">Average Days-to-Fill</TableHead>
                <TableHead className="text-xs">Market Industry Benchmark</TableHead>
                <TableHead className="text-right text-xs">Performance Variance Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timeToFill.map(t => {
                const variance = t.industryBenchmark - t.avgDays;
                return (
                  <TableRow key={t.dept} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="text-xs font-semibold text-foreground">{t.dept}</TableCell>
                    <TableCell className="text-xs font-mono font-semibold">{t.positionsFilled} Positions</TableCell>
                    <TableCell className="text-xs font-mono font-semibold text-foreground">{t.avgDays} Days</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{t.industryBenchmark} Days</TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-semibold">
                        -{variance} Days Faster
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
