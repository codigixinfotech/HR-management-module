import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  CheckCheck,
  FileSpreadsheet,
  Settings2,
  Calendar,
} from 'lucide-react';
import { companiesApi, branchesApi } from '@/api/organization';
import { employeesApi } from '@/api/employees';
import {
  leaveTypesApi,
  leaveRequestsApi,
  leaveBalancesApi,
  holidaysApi,
} from '@/api/attendance-leave';
import { useAuthStore } from '@/stores/auth-store';
import { useLeaveStore, type LeaveSubTab } from './leaveStore';

// Subcomponents
import { LeaveMetricsHeader } from './leave/LeaveMetricsHeader';
import { LeaveRequestsView } from './leave/LeaveRequestsView';
import { LeaveApprovalsView } from './leave/LeaveApprovalsView';
import { LeaveBalancesView } from './leave/LeaveBalancesView';
import { LeavePoliciesView } from './leave/LeavePoliciesView';
import { LeaveCalendarView } from './leave/LeaveCalendarView';
import { ApplyLeaveModal } from './leave/ApplyLeaveModal';
import { LeaveTypeConfigModal } from './leave/LeaveTypeConfigModal';
import { EmployeeLeaveView } from './leave/employee/EmployeeLeaveView';
import { useCompany } from '@/context/CompanyContext';

interface LeaveManagementTabProps {
  companyId?: string;
}

export function LeaveManagementTab({ companyId }: LeaveManagementTabProps = {}) {
  const { activeCompanyId } = useCompany();
  const user = useAuthStore((s) => s.user);
  const selectedCompanyId = companyId || activeCompanyId || user?.companyId;

  const { activeSubTab, setActiveSubTab } = useLeaveStore();

  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);

  // Queries
  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: companiesApi.list,
  });

  const { data: leaveTypes = [], isLoading: isTypesLoading } = useQuery({
    queryKey: ['leave-types', selectedCompanyId],
    queryFn: () => leaveTypesApi.list(selectedCompanyId),
    enabled: !!selectedCompanyId,
  });

  const { data: requestsPage, isLoading: isRequestsLoading } = useQuery({
    queryKey: ['leave-requests', selectedCompanyId],
    queryFn: () => leaveRequestsApi.list({ page: 1, pageSize: 100, companyId: selectedCompanyId }),
    enabled: !!selectedCompanyId,
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches', selectedCompanyId],
    queryFn: () => branchesApi.list(selectedCompanyId),
    enabled: !!selectedCompanyId,
  });

  const { data: leaveBalances = [], isLoading: isBalancesLoading } = useQuery({
    queryKey: ['leave-balances', selectedCompanyId],
    queryFn: () => leaveBalancesApi.list(undefined, undefined, selectedCompanyId),
    enabled: !!selectedCompanyId,
  });

  const { data: dbHolidays = [] } = useQuery({
    queryKey: ['holidays', selectedCompanyId],
    queryFn: () => holidaysApi.list(selectedCompanyId),
    enabled: !!selectedCompanyId,
  });

  const { data: employeesPage, isLoading: isEmployeesLoading } = useQuery({
    queryKey: ['employees', 'leave-hub', selectedCompanyId],
    queryFn: () => employeesApi.list({ page: 1, pageSize: 100, companyId: selectedCompanyId }),
    enabled: !!selectedCompanyId,
  });

  const requests = useMemo(() => requestsPage?.items || [], [requestsPage]);
  const employees = useMemo(() => employeesPage?.items || [], [employeesPage]);

  const isHrOrAdmin = Boolean(
    user?.permissions?.includes('*') ||
      user?.roles?.some((r) => r.toUpperCase().includes('ADMIN') || r.toUpperCase().includes('HR')) ||
      user?.primaryRole?.toUpperCase().includes('ADMIN') ||
      user?.primaryRole?.toUpperCase().includes('HR')
  );

  const { viewMode, setViewMode } = useLeaveStore();
  const effectiveViewMode = isHrOrAdmin ? viewMode : 'employee';

  // Extract unique departments
  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      if (e.department?.name) set.add(e.department.name);
    });
    return Array.from(set);
  }, [employees]);

  // Compute live metrics
  const { pendingCount, approvedMonthCount, onLeaveTodayCount } = useMemo(() => {
    let pending = 0;
    let approvedMonth = 0;
    let onLeaveToday = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    requests.forEach((r) => {
      if (r.status === 'PENDING') pending++;
      if (r.status === 'APPROVED') {
        approvedMonth++;
        const s = new Date(r.startDate);
        const e = new Date(r.endDate);
        s.setHours(0, 0, 0, 0);
        e.setHours(23, 59, 59, 999);
        if (today >= s && today <= e) {
          onLeaveToday++;
        }
      }
    });

    return {
      pendingCount: pending,
      approvedMonthCount: approvedMonth,
      onLeaveTodayCount: onLeaveToday,
    };
  }, [requests]);

  const tabs: { key: LeaveSubTab; label: string; icon: any; badge?: number }[] = [
    { key: 'requests', label: 'Leave Requests', icon: FileText },
    {
      key: 'approvals',
      label: 'Leave Approvals',
      icon: CheckCheck,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    { key: 'balances', label: 'Leave Balances Register', icon: FileSpreadsheet },
    { key: 'policies', label: 'Leave Types & Policies', icon: Settings2 },
    { key: 'calendar', label: 'Leave Calendar', icon: Calendar },
  ];

  return (
    <div className="space-y-6">
      {/* View Mode Switcher for HR/Admins */}
      {isHrOrAdmin && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 px-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">Workspace View Mode:</span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              {effectiveViewMode === 'admin'
                ? 'Organization-wide administration (requests, approvals, quotas, policies)'
                : 'Personal employee portal (my balances, time-off applications, calendar)'}
            </span>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200/80 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('admin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                effectiveViewMode === 'admin'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🛡️ Admin Management
            </button>
            <button
              type="button"
              onClick={() => setViewMode('employee')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                effectiveViewMode === 'employee'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              👤 My Leave (Self-Service)
            </button>
          </div>
        </div>
      )}

      {effectiveViewMode === 'employee' ? (
        <EmployeeLeaveView
          companyId={selectedCompanyId}
          leaveTypes={leaveTypes}
          allRequests={requests}
          allBalances={leaveBalances}
          declaredHolidays={dbHolidays}
          employees={employees}
        />
      ) : (
        <>
          {/* 1. Header with Stats & Actions */}
          <LeaveMetricsHeader
            totalLeaveTypes={leaveTypes.length}
            pendingRequestsCount={pendingCount}
            approvedCount={approvedMonthCount}
            onLeaveTodayCount={onLeaveTodayCount}
            onApplyLeaveClick={() => setApplyModalOpen(true)}
            onConfigurePolicyClick={() => setConfigModalOpen(true)}
          />

          {/* 2. Sub-navigation Tabs */}
          <div className="flex border-b border-border/80 gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveSubTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                    isActive
                      ? 'border-primary text-primary bg-primary/5 rounded-t-lg'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-t-lg'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

      {/* 3. Sub-page View Contents */}
      {activeSubTab === 'requests' && (
        <LeaveRequestsView
          requests={requests}
          leaveTypes={leaveTypes}
          leaveBalances={leaveBalances}
          isLoading={isRequestsLoading}
          departments={departments}
        />
      )}

      {activeSubTab === 'approvals' && (
        <LeaveApprovalsView requests={requests} isLoading={isRequestsLoading} />
      )}

      {activeSubTab === 'balances' && (
        <LeaveBalancesView
          balances={leaveBalances}
          employees={employees}
          leaveTypes={leaveTypes}
          requests={requests}
          isLoading={isBalancesLoading || isEmployeesLoading}
          departments={departments}
        />
      )}

      {activeSubTab === 'policies' && (
        <LeavePoliciesView
          leaveTypes={leaveTypes}
          companies={companies}
          companyId={selectedCompanyId}
          isLoading={isTypesLoading}
        />
      )}

      {activeSubTab === 'calendar' && (
        <LeaveCalendarView
          requests={requests}
          leaveTypes={leaveTypes}
          companyId={selectedCompanyId}
          departments={departments}
          branches={branches}
          employees={employees}
        />
      )}

      {/* 4. Modals */}
      <ApplyLeaveModal
        open={applyModalOpen}
        onOpenChange={setApplyModalOpen}
        companies={companies}
        companyId={selectedCompanyId}
        employees={employees}
        leaveTypes={leaveTypes}
        leaveBalances={leaveBalances}
        currentUserId={user?.id}
      />

      <LeaveTypeConfigModal
        open={configModalOpen}
        onOpenChange={setConfigModalOpen}
        companies={companies}
        companyId={selectedCompanyId}
      />
        </>
      )}
    </div>
  );
}
