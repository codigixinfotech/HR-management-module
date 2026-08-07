import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  Download,
  RefreshCw,
  Zap,
  ShieldCheck,
  Briefcase,
  DollarSign,
  Building2,
  BarChart2,
} from 'lucide-react';
import { dashboardApi } from '@/api/dashboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const LOCATION_ATTENDANCE = [
  { location: 'New York Headquarters (NYC)', total: 120, present: 116, rate: 96.6, color: 'bg-primary' },
  { location: 'Boston Distribution Hub (BOS)', total: 64, present: 61, rate: 95.3, color: 'bg-emerald-500' },
  { location: 'Chicago Regional Office (CHI)', total: 40, present: 37, rate: 92.5, color: 'bg-amber-500' },
  { location: 'Remote / Field Workforce', total: 24, present: 22, rate: 91.6, color: 'bg-violet-500' },
];

const STAGE_VELOCITY = [
  { stage: 'Sourcing & Screening', avgDays: 4.2, targetDays: 5.0, status: 'faster', color: 'bg-emerald-500' },
  { stage: 'Technical Assessment', avgDays: 5.1, targetDays: 5.0, status: 'normal', color: 'bg-primary' },
  { stage: 'Department Interview', avgDays: 5.8, targetDays: 7.0, status: 'faster', color: 'bg-violet-500' },
  { stage: 'Offer & Background Check', avgDays: 3.3, targetDays: 4.0, status: 'faster', color: 'bg-amber-500' },
];

const CANDIDATE_SOURCES = [
  { source: 'LinkedIn Talent Solutions', percentage: 42, candidates: 60, color: 'bg-blue-600' },
  { source: 'Employee Referral Program', percentage: 28, candidates: 40, color: 'bg-emerald-500' },
  { source: 'Direct Career Portal', percentage: 18, candidates: 25, color: 'bg-violet-500' },
  { source: 'Recruitment Agencies', percentage: 12, candidates: 17, color: 'bg-amber-500' },
];

const COMPLIANCE_METRICS = [
  { title: 'Statutory EPF & ESI Return Filing', status: 'Compliant', score: 100, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950/40' },
  { title: 'Mandatory Safety & EHS Certifications', status: '96.4% Complete', score: 96.4, color: 'text-primary bg-primary/10' },
  { title: 'Employee Document Verification', status: '98.1% Verified', score: 98.1, color: 'text-violet-600 bg-violet-100 dark:bg-violet-950/40' },
  { title: 'Form 16 Tax Declaration Audit', status: 'On Schedule', score: 95.0, color: 'text-amber-600 bg-amber-100 dark:bg-amber-950/40' },
];

export function RealTimeMetricsView() {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'ytd'>('month');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, refetch } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => dashboardApi.summary(),
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="space-y-6">
      {/* ── 1. Controls & Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-mono text-[10px] uppercase font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Telemetry
            </Badge>
            <span className="text-xs text-muted-foreground">Updated just now</span>
          </div>
          <h2 className=" text-xl font-semibold text-foreground  mt-1">
            Real-Time Workforce Analytics & Operational Metrics
          </h2>
          <p className="text-xs text-muted-foreground">
            Deep-dive metrics across attendance, hiring velocity, labor costs, and compliance risks.
          </p>
        </div>

        {/* Time-range & Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
            {(['today', 'week', 'month', 'ytd'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${timeRange === range
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                {range}
              </button>
            ))}
          </div>

          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent active:scale-95 transition-all"
            title="Refresh metrics"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
            Refresh
          </button>

          <button
            onClick={() => alert('Exporting Real-time Operational Report CSV...')}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 active:scale-95 transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            Export Report
          </button>
        </div>
      </div>

      {/* ── 2. Top Metric KPI Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Time to Hire */}
        <Card className="shadow-xs transition-all hover:shadow-md border-border/80">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Hiring Velocity (Time-to-Hire)
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className=" text-3xl font-semibold  text-foreground">
                18.4 Days
              </span>
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-semibold">
                3.2 Days Faster
              </Badge>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Target: <strong className="text-foreground">22.0 Days</strong> • Industry Benchmark: 28 Days
            </p>
          </CardContent>
        </Card>

        {/* Metric 2: Employee Flight / Churn Risk */}
        <Card className="shadow-xs transition-all hover:shadow-md border-border/80">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Attrition Risk Index
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className=" text-3xl font-semibold  text-foreground">
                2.1%
              </span>
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-semibold">
                Low Risk Level
              </Badge>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              High Performer Retention: <strong className="text-emerald-600">98.2%</strong>
            </p>
          </CardContent>
        </Card>

        {/* Metric 3: Overtime & Labor Cost Variance */}
        <Card className="shadow-xs transition-all hover:shadow-md border-border/80">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Labor Cost Variance
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className=" text-3xl font-semibold  text-foreground">
                -2.8%
              </span>
              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] font-semibold">
                Under Budget
              </Badge>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Overtime Hours Logged: <strong className="text-foreground">142 hrs</strong> this month
            </p>
          </CardContent>
        </Card>

        {/* Metric 4: Workforce Productivity Index */}
        <Card className="shadow-xs transition-all hover:shadow-md border-border/80">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Workforce Efficiency Index
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
                <Zap className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className=" text-3xl font-semibold  text-foreground">
                94.8 Score
              </span>
              <Badge className="bg-violet-500/10 text-violet-600 border-violet-500/20 text-[10px] font-semibold">
                +3.4 pts
              </Badge>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Task Completion Rate: <strong className="text-foreground">96.5%</strong>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── 3. Operational Telemetry Grid ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Location Attendance Telemetry */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" /> Location Attendance Telemetry
                </CardTitle>
                <CardDescription className="text-xs">Real-time check-in rate by facility</CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-[10px]">
                {data?.counts?.totalEmployees ?? 248} Total Staff
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {LOCATION_ATTENDANCE.map((item) => (
              <div key={item.location} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-foreground font-semibold">{item.location}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{item.present} / {item.total} Present</span>
                    <span className="font-mono font-semibold text-foreground">{item.rate}%</span>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                    style={{ width: `${item.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recruitment Stage Velocity & Conversion */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" /> Hiring Stage Days (Velocity)
                </CardTitle>
                <CardDescription className="text-xs">Average days required per candidate stage</CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-[10px]">Target: 22 Days</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {STAGE_VELOCITY.map((stage) => (
              <div key={stage.stage} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-foreground font-semibold">{stage.stage}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Target: {stage.targetDays}d</span>
                    <span className="font-mono font-semibold text-primary">{stage.avgDays} days</span>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${stage.color}`}
                    style={{ width: `${(stage.avgDays / stage.targetDays) * 80}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── 4. Candidate Sourcing Channels & Compliance Verification Scoreboard ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Candidate Sourcing Channels */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-primary" /> Candidate Sourcing Distribution
            </CardTitle>
            <CardDescription className="text-xs">Active hiring channels and candidate acquisition share</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {CANDIDATE_SOURCES.map((src) => (
              <div key={src.source} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border/40">
                <div className="flex items-center gap-3">
                  <span className={`h-3 w-3 rounded-full ${src.color}`} />
                  <span className="text-xs font-semibold text-foreground">{src.source}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-muted-foreground">{src.candidates} candidates</span>
                  <Badge className="font-mono text-[10px] font-semibold bg-primary/10 text-primary">
                    {src.percentage}%
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Compliance & Audit Scoreboard */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Compliance Audit Scoreboard
            </CardTitle>
            <CardDescription className="text-xs">Statutory health, EPF, ESIC & tax filings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {COMPLIANCE_METRICS.map((comp) => (
              <div key={comp.title} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border/40">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="text-xs font-semibold text-foreground">{comp.title}</span>
                </div>
                <Badge className={`text-[10px] font-semibold ${comp.color}`}>
                  {comp.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
