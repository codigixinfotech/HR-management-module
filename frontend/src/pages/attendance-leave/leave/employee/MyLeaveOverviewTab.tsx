import { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  FileText,
  Sparkles,
  Palmtree,
  ShieldCheck,
  ChevronRight,
  PieChart,
  BarChart3,
  CalendarDays,
  Check,
  Hourglass,
  Info,
} from 'lucide-react';
import type { LeaveBalance, LeaveRequest, LeaveType } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { MyLeaveRequestDetailModal } from './MyLeaveRequestDetailModal';

interface MyLeaveOverviewTabProps {
  balances: LeaveBalance[];
  requests: LeaveRequest[];
  leaveTypes: LeaveType[];
  onApplyLeaveClick: () => void;
  onViewAllRequestsClick: () => void;
  onViewBalanceClick: () => void;
  onCancelRequest: (id: string) => void;
  isCancelling?: boolean;
}

export function MyLeaveOverviewTab({
  balances,
  requests,
  leaveTypes,
  onApplyLeaveClick,
  onViewAllRequestsClick,
  onViewBalanceClick,
  onCancelRequest,
  isCancelling = false,
}: MyLeaveOverviewTabProps) {
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Compute aggregate totals
  const { totalAllocated, totalUsed, totalPending, totalAvailable, utilizationRate } = useMemo(() => {
    let allocated = 0;
    let used = 0;
    let pending = 0;

    balances.forEach((b) => {
      const defaultQuota = b.leaveType?.annualQuota || 12;
      const alloc = b.allocated > 0 ? b.allocated : defaultQuota;
      const u = b.used || 0;
      const p = (b as any).pending || 0;
      allocated += alloc;
      used += u;
      pending += p;
    });

    const available = Math.max(0, allocated - used - pending);
    const rate = allocated > 0 ? Math.min(100, Math.round(((used + pending) / allocated) * 100)) : 0;

    return {
      totalAllocated: allocated,
      totalUsed: used,
      totalPending: pending,
      totalAvailable: available,
      utilizationRate: rate,
    };
  }, [balances]);

  // SVG Donut Calculations (Circumference = 2 * PI * 40 = ~251.327)
  const donutData = useMemo(() => {
    const total = totalAllocated || 1;
    const availPct = (totalAvailable / total) * 100;
    const usedPct = (totalUsed / total) * 100;
    const pendingPct = (totalPending / total) * 100;

    const circumference = 251.327;

    // Segment lengths
    const availLength = (totalAvailable / total) * circumference;
    const usedLength = (totalUsed / total) * circumference;
    const pendingLength = (totalPending / total) * circumference;

    // Offsets for sequential rendering
    // Starting at top (-90deg), circumference dashoffset:
    const availOffset = 0;
    const usedOffset = -(availLength);
    const pendingOffset = -(availLength + usedLength);

    return {
      availPct: Math.round(availPct),
      usedPct: Math.round(usedPct),
      pendingPct: Math.round(pendingPct),
      availLength,
      usedLength,
      pendingLength,
      availOffset,
      usedOffset,
      pendingOffset,
      circumference,
    };
  }, [totalAllocated, totalAvailable, totalUsed, totalPending]);

  // Filter upcoming leaves
  const upcomingLeaves = useMemo(() => {
    return requests
      .filter((r) => {
        const end = new Date(r.endDate);
        end.setHours(23, 59, 59, 999);
        return (r.status === 'APPROVED' || r.status === 'PENDING') && end >= today;
      })
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 3);
  }, [requests, today]);

  // Recent requests
  const recentRequests = useMemo(() => {
    return requests.slice(0, 4);
  }, [requests]);

  // Leave status breakdown
  const statusStats = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let cancelled = 0;

    requests.forEach((r) => {
      if (r.status === 'PENDING') pending++;
      else if (r.status === 'APPROVED') approved++;
      else if (r.status === 'REJECTED') rejected++;
      else if (r.status === 'CANCELLED') cancelled++;
    });

    return { pending, approved, rejected, cancelled, total: requests.length };
  }, [requests]);

  return (
    <div className="space-y-4 font-sans">
      {/* ─────────────────────────────────────────────────────────────
          1. CLEAN, LIGHT ERP BANNER (Replaced harsh purple gradient)
          ───────────────────────────────────────────────────────────── */}
      <div className="p-4 rounded-xl border border-sky-200/70 bg-gradient-to-r from-sky-50/70 via-indigo-50/40 to-background shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 text-[11px] font-bold tracking-wide uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
              Self-Service Leave Engine
            </span>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Instant Online Applications & Real-time Balance Engine
            </span>
          </div>
          <h3 className="text-base font-bold text-foreground">
            Planning time off? Check your balance & apply online
          </h3>
          <p className="text-xs text-muted-foreground max-w-2xl">
            Automatic leave balance deduction, statutory weekly-off exclusions, and real-time manager approval notifications.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onViewBalanceClick}
            className="h-8 text-xs font-semibold bg-background hover:bg-muted shadow-2xs"
          >
            <FileText className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            Balance Ledger
          </Button>
          <Button
            size="sm"
            onClick={onApplyLeaveClick}
            className="h-8 text-xs font-semibold shadow-2xs gap-1.5 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Apply Leave
          </Button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. ANALYTICS & CHARTS GRID (Donut Chart & Stacked Utilization Bar)
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* CHART 1: Interactive SVG Donut Quota Breakdown (5 cols) */}
        <Card className="lg:col-span-5 rounded-xl border border-border/80 bg-card shadow-2xs">
          <CardHeader className="p-4 pb-2 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChart className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-bold">Leave Quota & Balance Health</CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px] font-semibold bg-primary/5 text-primary border-primary/20">
                FY 2026
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Real-time ratio of available, consumed, and pending leaves
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-around gap-4 pt-1">
              {/* SVG Donut Chart */}
              <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Track Circle (allocated background) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#f1f5f9"
                    strokeWidth="9"
                    fill="transparent"
                  />
                  {/* 1. Available Segment (Emerald) */}
                  {totalAvailable > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#10b981"
                      strokeWidth="9"
                      strokeDasharray={`${donutData.availLength} ${donutData.circumference}`}
                      strokeDashoffset={donutData.availOffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-700 ease-out"
                    />
                  )}
                  {/* 2. Used Segment (Blue/Indigo) */}
                  {totalUsed > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#3b82f6"
                      strokeWidth="9"
                      strokeDasharray={`${donutData.usedLength} ${donutData.circumference}`}
                      strokeDashoffset={donutData.usedOffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-700 ease-out"
                    />
                  )}
                  {/* 3. Pending Segment (Amber) */}
                  {totalPending > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#f59e0b"
                      strokeWidth="9"
                      strokeDasharray={`${donutData.pendingLength} ${donutData.circumference}`}
                      strokeDashoffset={donutData.pendingOffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-700 ease-out"
                    />
                  )}
                </svg>

                {/* Donut Center Info */}
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-foreground">{totalAvailable}</span>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                    Available
                  </span>
                  <span className="text-[9px] text-muted-foreground">of {totalAllocated} Days</span>
                </div>
              </div>

              {/* Legend & Breakdown */}
              <div className="space-y-2.5 flex-1 max-w-xs text-xs">
                {/* Available */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/50 border border-emerald-200/60">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-emerald-950">Available Balance</span>
                  </div>
                  <div className="text-right font-mono font-bold text-emerald-700">
                    {totalAvailable}d <span className="text-[10px] font-normal text-emerald-600">({donutData.availPct}%)</span>
                  </div>
                </div>

                {/* Used */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50/50 border border-blue-200/60">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="font-semibold text-blue-950">Used / Taken</span>
                  </div>
                  <div className="text-right font-mono font-bold text-blue-700">
                    {totalUsed}d <span className="text-[10px] font-normal text-blue-600">({donutData.usedPct}%)</span>
                  </div>
                </div>

                {/* Pending */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/50 border border-amber-200/60">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="font-semibold text-amber-950">Pending Approval</span>
                  </div>
                  <div className="text-right font-mono font-bold text-amber-700">
                    {totalPending}d <span className="text-[10px] font-normal text-amber-600">({donutData.pendingPct}%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Metrics Footer */}
            <div className="pt-3 border-t border-border/60 grid grid-cols-3 text-center text-xs">
              <div>
                <span className="text-[10px] text-muted-foreground block">Annual Quota</span>
                <span className="font-bold text-foreground font-mono">{totalAllocated} Days</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Consumed</span>
                <span className="font-bold text-blue-600 font-mono">{utilizationRate}%</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Approvals</span>
                <span className="font-bold text-emerald-600 font-mono">
                  {statusStats.approved}/{statusStats.total || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CHART 2: Leave by Type Stacked Progress Chart (7 cols) */}
        <Card className="lg:col-span-7 rounded-xl border border-border/80 bg-card shadow-2xs">
          <CardHeader className="p-4 pb-2 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-bold">Leave Type Utilization Graph</CardTitle>
              </div>
              <button
                type="button"
                onClick={onViewBalanceClick}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Full Ledger</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Breakdown of entitlements, approvals, and pending reviews per category
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 space-y-3.5">
            {balances.slice(0, 5).map((b) => {
              const code = b.leaveType?.code || 'LV';
              const name = b.leaveType?.name || code;
              const defaultQuota = b.leaveType?.annualQuota || 12;
              const allocated = b.allocated > 0 ? b.allocated : defaultQuota;
              const used = b.used || 0;
              const pending = (b as any).pending || 0;
              const available = Math.max(0, allocated - used - pending);

              const usedPct = allocated > 0 ? Math.min(100, (used / allocated) * 100) : 0;
              const pendingPct = allocated > 0 ? Math.min(100 - usedPct, (pending / allocated) * 100) : 0;
              const availPct = allocated > 0 ? Math.max(0, 100 - usedPct - pendingPct) : 100;

              return (
                <div key={b.id || `${b.employeeId}_${b.leaveTypeId}`} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{name}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border/80">
                        {code}
                      </span>
                    </div>
                    <div className="text-right text-[11px]">
                      <strong className="text-emerald-600 font-bold">{available}d</strong>
                      <span className="text-muted-foreground"> free / </span>
                      <span className="text-muted-foreground">{allocated}d total</span>
                    </div>
                  </div>

                  {/* Multi-Segment Horizontal Stacked Bar */}
                  <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex shadow-inner">
                    {/* Used (Blue) */}
                    {usedPct > 0 && (
                      <div
                        style={{ width: `${usedPct}%` }}
                        className="bg-blue-500 transition-all duration-500"
                        title={`Used: ${used} days`}
                      />
                    )}
                    {/* Pending (Amber) */}
                    {pendingPct > 0 && (
                      <div
                        style={{ width: `${pendingPct}%` }}
                        className="bg-amber-400 transition-all duration-500"
                        title={`Pending: ${pending} days`}
                      />
                    )}
                    {/* Available (Emerald) */}
                    {availPct > 0 && (
                      <div
                        style={{ width: `${availPct}%` }}
                        className="bg-emerald-500/80 transition-all duration-500"
                        title={`Available: ${available} days`}
                      />
                    )}
                  </div>

                  {/* Micro label */}
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground px-0.5">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-blue-600 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        Used: {used}d
                      </span>
                      {pending > 0 && (
                        <span className="flex items-center gap-1 text-amber-600 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          Pending: {pending}d
                        </span>
                      )}
                    </div>
                    <span className="text-emerald-700 font-semibold">{Math.round(availPct)}% remaining</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. INDIVIDUAL LEAVE TYPE CARDS GRID
          ───────────────────────────────────────────────────────────── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palmtree className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-bold text-foreground">Leave Quota Balances</h4>
          </div>
          <button
            type="button"
            onClick={onViewBalanceClick}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Detailed Rules & Entitlements</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {balances.map((b) => {
            const code = b.leaveType?.code || 'LV';
            const name = b.leaveType?.name || code;
            const defaultQuota = b.leaveType?.annualQuota || 12;
            const allocated = b.allocated > 0 ? b.allocated : defaultQuota;
            const used = b.used || 0;
            const pending = (b as any).pending || 0;
            const available = Math.max(0, allocated - used - pending);
            const utilization = allocated > 0 ? Math.min(100, Math.round(((used + pending) / allocated) * 100)) : 0;

            return (
              <div
                key={b.id || `${b.employeeId}_${b.leaveTypeId}`}
                className="p-3.5 rounded-xl border border-border/80 bg-card hover:border-primary/40 hover:shadow-xs transition-all space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-foreground">{name}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
                        {code}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {b.leaveType?.isPaid !== false ? 'Paid Leave' : 'Unpaid (LOP)'}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-black text-foreground font-mono">
                      {available} <span className="text-[10px] font-normal text-muted-foreground">/ {allocated}d</span>
                    </div>
                    <div className="text-[10px] text-emerald-600 font-semibold">Available</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Used: {used}d {pending > 0 && `(+${pending}d pend)`}</span>
                    <span>{utilization}% consumed</span>
                  </div>
                  <Progress value={utilization} className="h-1.5 rounded-full bg-muted" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. TWO-COLUMN ROW: UPCOMING SCHEDULE & RECENT APPLICATIONS
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Upcoming Scheduled Leave */}
        <Card className="rounded-xl border border-border/80 bg-card shadow-2xs">
          <CardHeader className="p-4 pb-2 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-bold">Upcoming Scheduled Leave</CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px] font-semibold bg-muted text-foreground">
                {upcomingLeaves.length} Scheduled
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Leaves approved or awaiting final review for upcoming dates
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4">
            {upcomingLeaves.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-muted/30 border border-border/60 text-xs text-muted-foreground space-y-2">
                <Calendar className="h-8 w-8 mx-auto text-muted-foreground/50" />
                <div className="font-semibold text-foreground">No Upcoming Leaves</div>
                <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                  You do not have any upcoming approved or pending leaves scheduled in this period.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onApplyLeaveClick}
                  className="h-7 text-xs mt-2"
                >
                  Apply Leave Now
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingLeaves.map((req) => {
                  const isApproved = req.status === 'APPROVED';
                  return (
                    <div
                      key={req.id}
                      onClick={() => setSelectedRequest(req)}
                      className="p-3 rounded-lg border border-border/70 bg-card hover:border-primary/40 hover:bg-muted/30 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-9 w-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {req.leaveType?.code || 'LV'}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-foreground">
                            {req.leaveType?.name || 'Leave'}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {new Date(req.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            {req.startDate !== req.endDate && (
                              <> – {new Date(req.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</>
                            )}
                            {' • '}{req.totalDays} {req.totalDays === 1 ? 'Day' : 'Days'} ({req.duration === 'HALF_DAY' ? 'Half Day' : 'Full Day'})
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <Badge
                          className={`text-[10px] font-bold ${
                            isApproved
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {isApproved ? '✓ Approved' : '⏳ Pending'}
                        </Badge>
                        <div className="text-[9px] text-muted-foreground mt-1 flex items-center justify-end gap-0.5">
                          <span>Details</span>
                          <ChevronRight className="h-3 w-3" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Recent Applications Feed */}
        <Card className="rounded-xl border border-border/80 bg-card shadow-2xs">
          <CardHeader className="p-4 pb-2 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-bold">Recent Applications Feed</CardTitle>
              </div>
              <button
                type="button"
                onClick={onViewAllRequestsClick}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All ({requests.length})</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Live status and review remarks from reporting managers
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4">
            {recentRequests.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-muted/30 border border-border/60 text-xs text-muted-foreground space-y-2">
                <FileText className="h-8 w-8 mx-auto text-muted-foreground/50" />
                <div className="font-semibold text-foreground">No Leave History</div>
                <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                  You haven't submitted any leave applications yet.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onApplyLeaveClick}
                  className="h-7 text-xs mt-2"
                >
                  Apply Leave Now
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentRequests.map((req) => {
                  const isApproved = req.status === 'APPROVED';
                  const isPending = req.status === 'PENDING';
                  const isRejected = req.status === 'REJECTED';

                  return (
                    <div
                      key={req.id}
                      onClick={() => setSelectedRequest(req)}
                      className="p-3 rounded-lg border border-border/70 bg-card hover:border-primary/40 hover:bg-muted/30 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-foreground">
                            {req.leaveType?.name || 'Leave'}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            #{req.id.slice(-6).toUpperCase()}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {new Date(req.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          {req.startDate !== req.endDate && (
                            <> – {new Date(req.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</>
                          )}
                          {' • '}{req.totalDays} {req.totalDays === 1 ? 'day' : 'days'}
                        </div>
                        {req.approverRemarks && (
                          <div className="text-[10px] text-muted-foreground italic mt-0.5 line-clamp-1">
                            “{req.approverRemarks}”
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <Badge
                          className={`text-[10px] font-bold ${
                            isApproved
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isPending
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : isRejected
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-muted text-muted-foreground border-border'
                          }`}
                        >
                          {isApproved
                            ? '✓ Approved'
                            : isPending
                            ? '⏳ Pending'
                            : isRejected
                            ? '✕ Rejected'
                            : 'Cancelled'}
                        </Badge>
                        <div className="text-[9px] text-muted-foreground mt-1">
                          {req.currentApproverRole || 'Reporting Manager'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Inspection Modal */}
      {selectedRequest && (
        <MyLeaveRequestDetailModal
          open={!!selectedRequest}
          onOpenChange={(open) => !open && setSelectedRequest(null)}
          request={selectedRequest}
          onCancelRequest={onCancelRequest}
          isCancelling={isCancelling}
        />
      )}
    </div>
  );
}
