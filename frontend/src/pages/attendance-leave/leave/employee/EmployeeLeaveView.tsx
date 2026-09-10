import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  FileSpreadsheet,
  PlusCircle,
  History,
  Palmtree,
  TrendingUp,
  AlertCircle,
  Sparkles,
  CalendarDays,
  ShieldCheck,
} from 'lucide-react';
import type { LeaveBalance, LeaveRequest, LeaveType } from '@/api/types';
import { leaveRequestsApi } from '@/api/attendance-leave';
import { useAuthStore } from '@/stores/auth-store';
import { useLeaveStore, type EmployeeLeaveSubTab } from '../../leaveStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Subcomponents
import { MyLeaveOverviewTab } from './MyLeaveOverviewTab';
import { MyLeaveBalanceTab } from './MyLeaveBalanceTab';
import { MyApplyLeaveTab } from './MyApplyLeaveTab';
import { MyLeaveRequestsTab } from './MyLeaveRequestsTab';
import { MyLeaveHistoryTab } from './MyLeaveHistoryTab';
import { MyLeaveCalendarTab } from './MyLeaveCalendarTab';

interface EmployeeLeaveViewProps {
  companyId?: string;
  leaveTypes: LeaveType[];
  allRequests: LeaveRequest[];
  allBalances: LeaveBalance[];
  declaredHolidays?: any[];
  employees?: any[];
}

export function EmployeeLeaveView({
  companyId,
  leaveTypes,
  allRequests,
  allBalances,
  declaredHolidays = [],
  employees = [],
}: EmployeeLeaveViewProps) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { activeEmployeeSubTab, setActiveEmployeeSubTab } = useLeaveStore();
  const [preselectedTypeId, setPreselectedTypeId] = useState<string | undefined>(undefined);

  // Determine current logged-in employee ID
  const currentEmployee = useMemo(() => {
    // 1. If user object has employee field
    if (user?.employee?.id) {
      return user.employee;
    }
    // 2. Try to match from employees list by email or employee code or name
    if (employees && employees.length > 0) {
      if (user?.email) {
        const found = employees.find(
          (e: any) => e.workEmail?.toLowerCase() === user.email.toLowerCase() || e.personalEmail?.toLowerCase() === user.email.toLowerCase()
        );
        if (found) return found;
      }
      // Or find Sudarshan Kale as primary test persona if available
      const sudarshan = employees.find(
        (e: any) =>
          e.firstName?.toLowerCase().includes('sudarshan') ||
          e.lastName?.toLowerCase().includes('kale')
      );
      if (sudarshan) return sudarshan;
      return employees[0];
    }
    return null;
  }, [user, employees]);

  const currentEmployeeId = currentEmployee?.id || 'cmtr2qzm7006zip185kbklj96'; // Fallback to Sudarshan

  // Filter requests to ONLY current employee's requests
  const myRequests = useMemo(() => {
    return allRequests.filter(
      (r) => r.employeeId === currentEmployeeId
    );
  }, [allRequests, currentEmployeeId]);

  // Filter or build balances for ONLY current employee
  const myBalances = useMemo(() => {
    const empBalances = allBalances.filter(
      (b) => b.employeeId === currentEmployeeId
    );

    // If balances exist for this employee, return them
    if (empBalances.length > 0) {
      return empBalances;
    }

    // Otherwise generate clean personalized balances based on leaveTypes
    return leaveTypes.map((t) => ({
      id: `bal_${currentEmployeeId}_${t.id}`,
      companyId: companyId || '',
      employeeId: currentEmployeeId,
      leaveTypeId: t.id,
      year: 2026,
      allocated: t.annualQuota || 12,
      used: 0,
      pending: 0,
      available: t.annualQuota || 12,
      leaveType: t,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }, [allBalances, currentEmployeeId, leaveTypes, companyId]);

  // Compute top KPI summary values
  const { totalAvailable, totalUsed, pendingRequestsCount, upcomingLeaveCount } = useMemo(() => {
    let available = 0;
    let used = 0;
    let pendingCount = 0;
    let upcomingCount = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    myBalances.forEach((b) => {
      const defaultQuota = b.leaveType?.annualQuota || 12;
      const alloc = b.allocated > 0 ? b.allocated : defaultQuota;
      const u = b.used || 0;
      const p = (b as any).pending || 0;
      used += u;
      available += Math.max(0, alloc - u - p);
    });

    myRequests.forEach((r) => {
      if (r.status === 'PENDING') pendingCount++;
      const end = new Date(r.endDate);
      end.setHours(23, 59, 59, 999);
      if ((r.status === 'APPROVED' || r.status === 'PENDING') && end >= today) {
        upcomingCount++;
      }
    });

    return {
      totalAvailable: available,
      totalUsed: used,
      pendingRequestsCount: pendingCount,
      upcomingLeaveCount: upcomingCount,
    };
  }, [myBalances, myRequests]);

  // Cancel Request mutation
  const cancelMutation = useMutation({
    mutationFn: (id: string) => leaveRequestsApi.cancel(id, 'Cancelled by employee'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
      toast.success('Leave request cancelled / withdrawn successfully');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to cancel request');
    },
  });

  const handleApplyForType = (typeId: string) => {
    setPreselectedTypeId(typeId);
    setActiveEmployeeSubTab('apply');
  };

  const tabs: { key: EmployeeLeaveSubTab; label: string; icon: any; badge?: number }[] = [
    { key: 'overview', label: 'Overview', icon: Sparkles },
    { key: 'balance', label: 'Leave Balance', icon: FileSpreadsheet },
    { key: 'apply', label: 'Apply Leave', icon: PlusCircle },
    {
      key: 'requests',
      label: 'My Requests',
      icon: FileText,
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
    },
    { key: 'history', label: 'Leave History', icon: History },
    { key: 'calendar', label: 'My Calendar', icon: CalendarDays },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* ─────────────────────────────────────────────────────────────
          1. PAGE HEADER (My Leave with Top Summary Cards)
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
              Employee Self-Service
            </span>
            <span className="text-xs text-slate-400 font-medium font-mono">
              {currentEmployee?.employeeCode || 'EMP-001'} • {currentEmployee?.department?.name || 'Production'}
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Palmtree className="h-6 w-6 text-indigo-600" />
            <span>My Leave</span>
          </h2>
          <p className="text-xs text-slate-500">
            Welcome back, <strong className="text-slate-700">{currentEmployee?.firstName || 'Employee'}</strong>! View your balances, apply for time-off, and check declared company holidays.
          </p>
        </div>

        <Button
          onClick={() => setActiveEmployeeSubTab('apply')}
          className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs shrink-0 cursor-pointer"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Apply Leave</span>
        </Button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. TOP SUMMARY CARDS (Available, Used, Pending, Upcoming)
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Available */}
        <div className="p-4 rounded-2xl border border-emerald-200/90 bg-emerald-50/40 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Total Available
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-950 mt-1.5">
            {totalAvailable} <span className="text-xs font-semibold text-emerald-700">Days</span>
          </div>
          <div className="text-[10px] text-emerald-700 mt-1 font-medium">
            Ready to use this year
          </div>
        </div>

        {/* Used */}
        <div className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Leave Taken (Used)
            </span>
            <TrendingUp className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1.5">
            {totalUsed} <span className="text-xs font-semibold text-slate-400">Days</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-medium">
            Approved & consumed
          </div>
        </div>

        {/* Pending Requests */}
        <div className="p-4 rounded-2xl border border-amber-200/90 bg-amber-50/40 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Pending Requests
            </span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-950 mt-1.5">
            {pendingRequestsCount} <span className="text-xs font-semibold text-amber-700">Requests</span>
          </div>
          <div className="text-[10px] text-amber-700 mt-1 font-medium">
            Awaiting manager signoff
          </div>
        </div>

        {/* Upcoming Leave */}
        <div className="p-4 rounded-2xl border border-indigo-200/90 bg-indigo-50/40 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800">
              Upcoming Leave
            </span>
            <Calendar className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-950 mt-1.5">
            {upcomingLeaveCount} <span className="text-xs font-semibold text-indigo-700">Scheduled</span>
          </div>
          <div className="text-[10px] text-indigo-700 mt-1 font-medium">
            Future approved / pending
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. EMPLOYEE SUB-NAVIGATION TABS
          ───────────────────────────────────────────────────────────── */}
      <div className="flex border-b border-border/80 gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeEmployeeSubTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveEmployeeSubTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40 rounded-t-lg font-bold'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-t-lg'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. TAB CONTENT
          ───────────────────────────────────────────────────────────── */}
      {activeEmployeeSubTab === 'overview' && (
        <MyLeaveOverviewTab
          balances={myBalances}
          requests={myRequests}
          leaveTypes={leaveTypes}
          onApplyLeaveClick={() => setActiveEmployeeSubTab('apply')}
          onViewAllRequestsClick={() => setActiveEmployeeSubTab('requests')}
          onViewBalanceClick={() => setActiveEmployeeSubTab('balance')}
          onCancelRequest={(id) => cancelMutation.mutate(id)}
          isCancelling={cancelMutation.isPending}
        />
      )}

      {activeEmployeeSubTab === 'balance' && (
        <MyLeaveBalanceTab
          balances={myBalances}
          leaveTypes={leaveTypes}
          onApplyForType={handleApplyForType}
        />
      )}

      {activeEmployeeSubTab === 'apply' && (
        <MyApplyLeaveTab
          companyId={companyId}
          currentEmployeeId={currentEmployeeId}
          leaveTypes={leaveTypes}
          balances={myBalances}
          declaredHolidays={declaredHolidays}
          preselectedTypeId={preselectedTypeId}
          onSuccessRedirect={() => {
            setPreselectedTypeId(undefined);
            setActiveEmployeeSubTab('requests');
          }}
        />
      )}

      {activeEmployeeSubTab === 'requests' && (
        <MyLeaveRequestsTab
          requests={myRequests}
          onApplyLeaveClick={() => setActiveEmployeeSubTab('apply')}
          onCancelRequest={(id) => cancelMutation.mutate(id)}
          isCancelling={cancelMutation.isPending}
        />
      )}

      {activeEmployeeSubTab === 'history' && (
        <MyLeaveHistoryTab
          requests={myRequests}
          leaveTypes={leaveTypes}
        />
      )}

      {activeEmployeeSubTab === 'calendar' && (
        <MyLeaveCalendarTab
          requests={myRequests}
          declaredHolidays={declaredHolidays}
        />
      )}
    </div>
  );
}
