import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Briefcase,
  Sparkles,
  ShieldCheck,
  Calendar,
  Zap,
  Plus,
  ChevronRight,
  UserPlus,
  Cake,
  Award,
  Layers,
  Activity,
} from 'lucide-react';
import { dashboardApi } from '@/api/dashboard';
import { HCM_MODULES } from '@/lib/modules';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { RealTimeMetricsView } from './dashboard/RealTimeMetricsView';

const DEPT_COLORS = ['bg-primary', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500', 'bg-cyan-500', 'bg-rose-500', 'bg-blue-500', 'bg-lime-500'];

const PIPELINE_COLORS: Record<string, string> = {
  APPLIED: 'bg-blue-500',
  SCREENING: 'bg-amber-500',
  INTERVIEW: 'bg-violet-500',
  OFFERED: 'bg-emerald-500',
  HIRED: 'bg-primary',
};

const PIPELINE_LABELS: Record<string, string> = {
  APPLIED: 'Applied',
  SCREENING: 'Screening',
  INTERVIEW: 'Interview',
  OFFERED: 'Offered',
  HIRED: 'Hired',
};

const EVENT_STYLES: Record<string, { icon: typeof UserPlus; color: string }> = {
  onboarding: { icon: UserPlus, color: 'text-primary bg-primary/10' },
  anniversary: { icon: Award, color: 'text-amber-600 bg-amber-100 dark:bg-amber-950/40' },
  birthday: { icon: Cake, color: 'text-rose-600 bg-rose-100 dark:bg-rose-950/40' },
  holiday: { icon: Calendar, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950/40' },
};

function formatEventDate(dateIso: string, daysAway: number): string {
  if (daysAway === 0) return 'Today';
  if (daysAway === 1) return 'Tomorrow';
  return new Date(dateIso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { tab: routeTab } = useParams();
  const [searchParams] = useSearchParams();
  const activeTab = routeTab || searchParams.get('tab') || 'overview';
  const [selectedModuleCategory, setSelectedModuleCategory] = useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => dashboardApi.summary(),
  });

  const totalEmp = data?.counts?.totalEmployees ?? 0;
  const activeEmp = data?.counts?.activeEmployees ?? 0;
  const onLeaveEmp = data?.counts?.onLeaveEmployees ?? 0;
  const openJobs = data?.counts?.openJobOpenings ?? 0;
  const pendingTasks = data?.counts?.pendingOnboardingTasks ?? 0;

  const departmentDistribution = data?.departmentDistribution ?? [];
  const recruitmentPipeline = data?.recruitmentPipeline ?? [];
  const upcomingEvents = data?.upcomingEvents ?? [];
  const recentActivity = data?.recentActivity ?? [];
  const attendanceToday = data?.attendanceToday;
  const compliance = data?.compliance;
  const totalCandidates = recruitmentPipeline.reduce((sum, p) => sum + p.count, 0);
  const offeredCount = recruitmentPipeline.find((p) => p.stage === 'OFFERED')?.count ?? 0;
  const nextPayroll = compliance?.latestPayrollRun
    ? new Date(compliance.latestPayrollRun.year, compliance.latestPayrollRun.month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Not scheduled';

  // Filter modules by category
  const filteredModules = HCM_MODULES.filter((mod) => {
    if (selectedModuleCategory === 'all') return true;
    if (selectedModuleCategory === 'core') return ['organization', 'employees', 'attendance-leave', 'workforce'].includes(mod.key);
    if (selectedModuleCategory === 'payroll') return ['payroll', 'compliance', 'compensation-benefits', 'asset-management'].includes(mod.key);
    if (selectedModuleCategory === 'talent') return ['recruitment', 'performance', 'learning', 'employee-experience'].includes(mod.key);
    if (selectedModuleCategory === 'intelligence') return ['ai-intelligence', 'iot-devices', 'reports-analytics', 'workflow-automation'].includes(mod.key);
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ── 1. Page Header & View Switcher ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-3">
        <PageHeader
          icon={LayoutDashboard}
          title={activeTab === 'metrics' ? 'Real-Time Metrics' : 'Executive Dashboard'}
          description={activeTab === 'metrics' ? 'Real-time workforce telemetry and operational metrics' : 'Enterprise Human Capital Management overview'}
          badge={activeTab === 'metrics' ? 'Live Telemetry' : 'Executive Overview'}
        />

        {/* View Switcher: Executive Overview vs Real-Time Metrics */}
        <div className="flex items-center gap-1.5 bg-muted/40 p-1.5 rounded-2xl border border-border shrink-0">
          <button
            onClick={() => navigate('/dashboard')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${activeTab !== 'metrics'
              ? 'bg-background text-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Executive Overview
          </button>
          <button
            onClick={() => navigate('/dashboard/metrics')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${activeTab === 'metrics'
              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25 font-semibold'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <Activity className="h-3.5 w-3.5" />
            Real-time Metrics
          </button>
        </div>
      </div>

      {/* ── 2. Render View Based on Tab ── */}
      {activeTab === 'metrics' ? (
        <RealTimeMetricsView />
      ) : (
        <>
          {/* Hero Welcome Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-card p-6 shadow-sm">
            <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                    Executive Portal • EHCM Suite
                  </span>
                </div>
                <h1 className=" text-2xl font-semibold  text-foreground sm:text-3xl">
                  Welcome back, Executive Team 👋
                </h1>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Today is{' '}
                  <span className="font-semibold text-foreground">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                  . All 20 enterprise modules are active and synced.
                </p>
              </div>

              {/* Quick Launcher Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => navigate('/employees?tab=master')}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-all hover:bg-primary/90 active:scale-95"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Add Employee
                </button>
                <button
                  onClick={() => navigate('/recruitment?tab=requisitions')}
                  className="flex items-center gap-1.5 rounded-xl bg-card border border-border px-3.5 py-2 text-xs font-semibold text-foreground shadow-xs hover:bg-accent active:scale-95 transition-all"
                >
                  <Plus className="h-3.5 w-3.5 text-primary" />
                  Post Job
                </button>
                <button
                  onClick={() => navigate('/payroll?tab=processing')}
                  className="flex items-center gap-1.5 rounded-xl bg-card border border-border px-3.5 py-2 text-xs font-semibold text-foreground shadow-xs hover:bg-accent active:scale-95 transition-all"
                >
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                  Run Payroll
                </button>
                <button
                  onClick={() => navigate('/ai-intelligence')}
                  className="flex items-center gap-1.5 rounded-xl bg-primary/10 border border-primary/20 px-3.5 py-2 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground active:scale-95 transition-all"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  AI Assistant
                </button>
              </div>
            </div>
          </div>

          {/* Executive KPI Metric Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="relative overflow-hidden transition-all hover:shadow-md border-border/80">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Total Headcount
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className=" text-3xl font-semibold  text-foreground">
                    {isLoading ? '...' : totalEmp}
                  </span>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-semibold">
                    +4.2% vs last mo
                  </Badge>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/50 pt-2">
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Active: <strong className="text-foreground">{activeEmp}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    On Leave: <strong className="text-foreground">{onLeaveEmp}</strong>
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden transition-all hover:shadow-md border-border/80">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Attendance Rate Today
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                    <UserCheck className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className=" text-3xl font-semibold  text-foreground">
                    {isLoading ? '...' : `${attendanceToday?.rate ?? 0}%`}
                  </span>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-semibold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Sync
                  </Badge>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/50 pt-2">
                  <span>Present: <strong className="text-foreground">{attendanceToday?.present ?? 0}</strong></span>
                  <span>Absent: <strong className="text-foreground">{attendanceToday?.absent ?? 0}</strong></span>
                  <span>On Leave: <strong className="text-foreground">{attendanceToday?.onLeave ?? 0}</strong></span>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden transition-all hover:shadow-md border-border/80">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Talent Requisitions
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
                    <Briefcase className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className=" text-3xl font-semibold  text-foreground">
                    {isLoading ? '...' : openJobs}
                  </span>
                  <Badge className="bg-violet-500/10 text-violet-600 border-violet-500/20 text-[10px] font-semibold">
                    {totalCandidates} Candidates
                  </Badge>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/50 pt-2">
                  <span>Pending Tasks: <strong className="text-foreground">{pendingTasks}</strong></span>
                  <span className="text-primary font-semibold">{offeredCount} Offers Sent</span>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden transition-all hover:shadow-md border-border/80">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Compliance & Payroll
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className=" text-3xl font-semibold  text-foreground">
                    {isLoading ? '...' : `${compliance?.filedRate ?? 100}%`}
                  </span>
                  <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] font-semibold">
                    {compliance?.filedTasks ?? 0}/{compliance?.totalTasks ?? 0} Filed
                  </Badge>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/50 pt-2">
                  <span>Next Payroll: <strong className="text-foreground">{nextPayroll}</strong></span>
                  <span className="text-emerald-600 font-semibold">
                    {compliance?.latestPayrollRun?.status ?? 'Pending'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Data Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card className="shadow-xs">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-base font-semibold">Department Headcount Distribution</CardTitle>
                    <CardDescription className="text-xs">Workforce division across business units</CardDescription>
                  </div>
                  <button
                    onClick={() => navigate('/organization?tab=departments')}
                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    Manage Depts <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {departmentDistribution.length === 0 && !isLoading && (
                    <p className="text-xs text-muted-foreground py-4 text-center">No employees assigned to departments yet.</p>
                  )}
                  {departmentDistribution.map((dept, idx) => (
                    <div key={dept.departmentId} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-foreground font-semibold">{dept.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{dept.count} Employees</span>
                          <span className="font-mono text-xs font-semibold text-foreground">{dept.percentage}%</span>
                        </div>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${DEPT_COLORS[idx % DEPT_COLORS.length]}`}
                          style={{ width: `${dept.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="shadow-xs">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-base font-semibold">Recruitment Pipeline Funnel</CardTitle>
                    <CardDescription className="text-xs">Candidate conversion across hiring stages</CardDescription>
                  </div>
                  <button
                    onClick={() => navigate('/recruitment?tab=candidates')}
                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    View Candidates <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {recruitmentPipeline.map((pipe) => (
                      <div
                        key={pipe.stage}
                        className="flex flex-col items-center rounded-xl bg-muted/40 p-3 text-center border border-border/50 transition-all hover:bg-muted/70"
                      >
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {PIPELINE_LABELS[pipe.stage]}
                        </span>
                        <span className="mt-1.5  text-2xl font-semibold text-foreground">
                          {pipe.count}
                        </span>
                        <div className={`mt-2 h-1 w-full rounded-full ${PIPELINE_COLORS[pipe.stage]}`} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center justify-between">
                    <span>Milestones & Events</span>
                    <Badge variant="outline" className="text-[10px] font-mono">Next 14 Days</Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">Birthdays, anniversaries & onboarding</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {upcomingEvents.length === 0 && !isLoading && (
                    <p className="text-xs text-muted-foreground py-4 text-center">No upcoming milestones in the next 14 days.</p>
                  )}
                  {upcomingEvents.map((event) => {
                    const style = EVENT_STYLES[event.type];
                    const Icon = style.icon;
                    return (
                      <div
                        key={event.id}
                        className="flex items-center justify-between rounded-xl bg-muted/30 p-2.5 border border-border/40 transition-colors hover:bg-muted/60"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${style.color} shrink-0`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-semibold text-foreground truncate">{event.title}</p>
                            <p className="text-[10px] text-muted-foreground">{formatEventDate(event.date, event.daysAway)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center justify-between">
                    <span>Recent System Activity</span>
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  </CardTitle>
                  <CardDescription className="text-xs">Live activity across modules</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentActivity.length === 0 && !isLoading && (
                    <p className="text-xs text-muted-foreground py-4 text-center">No recent activity yet.</p>
                  )}
                  {recentActivity.map((act) => (
                    <div key={act.id} className="flex items-start gap-2.5 text-xs border-b border-border/40 pb-2.5 last:border-none last:pb-0">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <div className="flex-1 space-y-0.5">
                        <p className="text-foreground text-xs leading-snug">{act.text}</p>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>{timeAgo(act.at)}</span>
                          <Badge variant="outline" className="text-[9px] py-0 px-1 font-mono">
                            {act.tag}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Enterprise Modules Hub */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className=" text-lg font-semibold  text-foreground flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" /> Enterprise Modules Hub ({HCM_MODULES.length})
                </h2>
                <p className="text-xs text-muted-foreground">Direct access to core human capital management modules</p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 bg-muted/40 p-1 rounded-xl border border-border">
                {[
                  { id: 'all', label: 'All Modules' },
                  { id: 'core', label: 'Core HR' },
                  { id: 'payroll', label: 'Payroll & Assets' },
                  { id: 'talent', label: 'Talent & LMS' },
                  { id: 'intelligence', label: 'AI & Analytics' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedModuleCategory(tab.id)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${selectedModuleCategory === tab.id
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredModules.map((mod) => {
                const Icon = mod.icon;
                return (
                  <Link key={mod.key} to={mod.path}>
                    <Card className="h-full transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md group">
                      <CardContent className="flex flex-col justify-between h-full p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground shadow-xs">
                            <Icon className="h-5 w-5" />
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0.5" />
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                            {mod.label}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {mod.subItems ? `${mod.subItems.length} submodules` : 'Active Hub'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
