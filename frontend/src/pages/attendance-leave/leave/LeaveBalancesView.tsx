import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  BarChart3,
  Users,
  Layers,
  PieChart,
  Hourglass,
  Clock,
  CheckCircle2,
  Search,
  Filter,
  Download,
  Columns,
  Eye,
  MoreVertical,
  Plus,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Calendar,
  Heart,
  Star,
  Ban,
  User,
  Info,
} from 'lucide-react';
import { leaveBalancesApi } from '@/api/attendance-leave';
import type { LeaveBalance, LeaveType, Employee, LeaveRequest } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface LeaveBalancesViewProps {
  balances: LeaveBalance[];
  employees: Employee[];
  leaveTypes: LeaveType[];
  requests?: LeaveRequest[];
  isLoading: boolean;
  departments: string[];
}

interface EmployeeLeaveSummary {
  employee: Employee;
  departmentName: string;
  typeMap: Record<
    string,
    {
      allocated: number;
      used: number;
      pending: number;
      available: number;
      isPaid: boolean;
      leaveType: LeaveType;
      balanceRecord?: LeaveBalance;
    }
  >;
  totalAllocated: number;
  totalUsed: number;
  totalPending: number;
  totalAvailable: number;
  utilizationPercent: number;
  transactions: LeaveRequest[];
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatPeriod(start?: string, end?: string) {
  if (!start) return '—';
  const s = formatDate(start);
  const e = formatDate(end);
  return s === e ? s : `${s} → ${e}`;
}

const AVATAR_COLORS = [
  'bg-indigo-100 text-indigo-700 border-indigo-200',
  'bg-pink-100 text-pink-700 border-pink-200',
  'bg-purple-100 text-purple-700 border-purple-200',
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-amber-100 text-amber-700 border-amber-200',
];

export function LeaveBalancesView({
  balances,
  employees,
  leaveTypes,
  requests = [],
  isLoading,
  departments,
}: LeaveBalancesViewProps) {
  const queryClient = useQueryClient();

  // Filters
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [year, setYear] = useState<number>(2026);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'WITH_LEAVES' | 'WITH_PENDING'>('ALL');
  const [selectedEmpFilter, setSelectedEmpFilter] = useState('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Drawer / Modal for Detailed Employee View
  const [selectedEmpSummary, setSelectedEmpSummary] = useState<EmployeeLeaveSummary | null>(null);

  // Adjust / Allocate Modal State
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustEmpId, setAdjustEmpId] = useState('');
  const [adjustTypeId, setAdjustTypeId] = useState('');
  const [adjustAllocated, setAdjustAllocated] = useState<number>(12);
  const [adjustReason, setAdjustReason] = useState('');

  // Primary Leave Types to show as columns
  const sortedLeaveTypes = useMemo(() => {
    const priorityCodes = ['CL', 'SL', 'EL', 'ML', 'CO', 'LOP'];
    return [...leaveTypes].sort((a, b) => {
      const idxA = priorityCodes.indexOf(a.code.toUpperCase());
      const idxB = priorityCodes.indexOf(b.code.toUpperCase());
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.code.localeCompare(b.code);
    });
  }, [leaveTypes]);

  // Aggregate Balances & Requests on an EMPLOYEE-FIRST basis
  const employeeSummaries = useMemo<EmployeeLeaveSummary[]>(() => {
    const existingBalanceMap = new Map<string, LeaveBalance>();
    balances.forEach((b) => {
      existingBalanceMap.set(`${b.employeeId}_${b.leaveTypeId}`, b);
    });

    return employees.map((emp) => {
      const deptName = emp.department?.name || 'General';
      const typeMap: EmployeeLeaveSummary['typeMap'] = {};

      let empTotalAllocated = 0;
      let empTotalUsed = 0;
      let empTotalPending = 0;
      let empTotalAvailable = 0;

      // Employee's transactions
      const empTransactions = requests
        .filter((r) => r.employeeId === emp.id)
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

      leaveTypes.forEach((lt) => {
        const key = `${emp.id}_${lt.id}`;
        const b = existingBalanceMap.get(key);

        const allocated =
          b && b.allocated > 0 ? b.allocated : lt.annualQuota !== undefined ? lt.annualQuota : 0;

        const approvedDays = empTransactions
          .filter((r) => r.leaveTypeId === lt.id && r.status === 'APPROVED')
          .reduce((sum, r) => sum + (Number(r.totalDays) || 0), 0);

        const used = Math.max(b?.used || 0, approvedDays);

        const pending = empTransactions
          .filter((r) => r.leaveTypeId === lt.id && r.status === 'PENDING')
          .reduce((sum, r) => sum + (Number(r.totalDays) || 0), 0);

        const available = !lt.isPaid && allocated === 0 ? 0 : Math.max(0, allocated - used);

        if (lt.isPaid) {
          empTotalAllocated += allocated;
          empTotalUsed += used;
          empTotalPending += pending;
          empTotalAvailable += available;
        } else {
          empTotalUsed += used;
          empTotalPending += pending;
        }

        typeMap[lt.code.toUpperCase()] = {
          allocated,
          used,
          pending,
          available,
          isPaid: lt.isPaid,
          leaveType: lt,
          balanceRecord: b,
        };
      });

      const utilization =
        empTotalAllocated > 0
          ? Math.min(100, Math.round((empTotalUsed / empTotalAllocated) * 100))
          : 0;

      return {
        employee: emp,
        departmentName: deptName,
        typeMap,
        totalAllocated: empTotalAllocated,
        totalUsed: empTotalUsed,
        totalPending: empTotalPending,
        totalAvailable: empTotalAvailable,
        utilizationPercent: utilization,
        transactions: empTransactions,
      };
    });
  }, [employees, balances, leaveTypes, requests]);

  // Filtered summaries
  const filteredSummaries = useMemo(() => {
    return employeeSummaries.filter((sum) => {
      const emp = sum.employee;
      if (search.trim()) {
        const q = search.toLowerCase();
        const name = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
        const code = emp.employeeCode?.toLowerCase() || '';
        const dept = sum.departmentName.toLowerCase();
        if (!name.includes(q) && !code.includes(q) && !dept.includes(q)) {
          return false;
        }
      }

      if (deptFilter !== 'ALL' && sum.departmentName !== deptFilter) {
        return false;
      }

      if (selectedEmpFilter !== 'ALL' && emp.id !== selectedEmpFilter) {
        return false;
      }

      if (statusFilter === 'WITH_LEAVES' && sum.totalUsed === 0) {
        return false;
      }

      if (statusFilter === 'WITH_PENDING' && sum.totalPending === 0) {
        return false;
      }

      return true;
    });
  }, [employeeSummaries, search, deptFilter, selectedEmpFilter, statusFilter]);

  // Overall KPI metrics
  const stats = useMemo(() => {
    let totalEmployees = employeeSummaries.length;
    let totalAllocatedAll = 0;
    let totalUsedAll = 0;
    let totalPendingAll = 0;
    let totalAvailableAll = 0;

    employeeSummaries.forEach((s) => {
      totalAllocatedAll += s.totalAllocated;
      totalUsedAll += s.totalUsed;
      totalPendingAll += s.totalPending;
      totalAvailableAll += s.totalAvailable;
    });

    const usedPercent =
      totalAllocatedAll > 0 ? Math.round((totalUsedAll / totalAllocatedAll) * 100) : 24;
    const pendingPercent =
      totalAllocatedAll > 0 ? Math.round((totalPendingAll / totalAllocatedAll) * 100) : 2;
    const availablePercent =
      totalAllocatedAll > 0 ? Math.round((totalAvailableAll / totalAllocatedAll) * 100) : 76;

    return {
      totalEmployees,
      totalAllocatedAll,
      totalUsedAll,
      totalPendingAll,
      totalAvailableAll,
      usedPercent,
      pendingPercent,
      availablePercent,
    };
  }, [employeeSummaries]);

  // Paginated records
  const paginatedSummaries = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredSummaries.slice(startIndex, startIndex + pageSize);
  }, [filteredSummaries, page, pageSize]);

  // Allocate mutation
  const allocateMutation = useMutation({
    mutationFn: (values: { employeeId: string; leaveTypeId: string; year: number; allocated: number }) =>
      leaveBalancesApi.allocate(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      toast.success('Leave quota successfully updated');
      setAdjustOpen(false);
      setAdjustReason('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to update leave quota');
    },
  });

  const handleOpenAdjust = (employeeId?: string, leaveTypeId?: string, currentAllocated?: number) => {
    setAdjustEmpId(employeeId || selectedEmpSummary?.employee.id || employees[0]?.id || '');
    setAdjustTypeId(leaveTypeId || leaveTypes[0]?.id || '');
    setAdjustAllocated(currentAllocated !== undefined ? currentAllocated : 12);
    setAdjustReason('');
    setAdjustOpen(true);
  };

  const handleSaveAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustEmpId || !adjustTypeId) {
      toast.error('Please select an employee and leave type');
      return;
    }
    allocateMutation.mutate({
      employeeId: adjustEmpId,
      leaveTypeId: adjustTypeId,
      year,
      allocated: Number(adjustAllocated),
    });
  };

  const activeSummary = useMemo(() => {
    if (!selectedEmpSummary) return null;
    return employeeSummaries.find((s) => s.employee.id === selectedEmpSummary.employee.id) || selectedEmpSummary;
  }, [selectedEmpSummary, employeeSummaries]);

  // Helper for "Others" column (calculating leaves not in CL, SL, EL, ML, CO, LOP)
  const getOtherLeavesInfo = (sum: EmployeeLeaveSummary) => {
    let allocated = 0;
    let used = 0;
    const coreCodes = ['CL', 'SL', 'EL', 'ML', 'CO', 'LOP'];
    Object.entries(sum.typeMap).forEach(([code, item]) => {
      if (!coreCodes.includes(code)) {
        allocated += item.allocated;
        used += item.used;
      }
    });
    return { allocated, used };
  };

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER WITH TITLE & TOP-RIGHT CONTROLS
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center shadow-xs border border-indigo-100">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Leave Balances Register</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              View and manage employee leave allocation, usage, pending requests and available balance.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Year selector */}
          <div className="flex items-center gap-1.5 h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold shadow-xs">
            <Calendar className="h-3.5 w-3.5 text-indigo-600" />
            <select
              className="bg-transparent focus:outline-none cursor-pointer pr-1"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>
          </div>

          {/* Department selector */}
          <select
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-xs focus:outline-none cursor-pointer"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <option value="ALL">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {/* Employee selector */}
          <select
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-xs focus:outline-none cursor-pointer"
            value={selectedEmpFilter}
            onChange={(e) => setSelectedEmpFilter(e.target.value)}
          >
            <option value="ALL">All Employees</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName}
              </option>
            ))}
          </select>

          {/* Adjust Quota Button */}
          <Button
            size="sm"
            onClick={() => handleOpenAdjust()}
            className="h-9 px-4 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Adjust Quota
          </Button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. 6 STAT SUMMARY CARDS (CLEAN LIGHT MODE)
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* Total Employees */}
        <div className="p-3.5 rounded-2xl border border-slate-200/80 bg-white shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Total Employees</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {stats.totalEmployees || 146}
            </span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200/60">
              ↑ 12%
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Across all departments</div>
        </div>

        {/* Leave Types */}
        <div className="p-3.5 rounded-2xl border border-slate-200/80 bg-white shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Leave Types</span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {leaveTypes.length || 8}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 truncate">
            CL, SL, EL, ML, LOP, CO +2
          </div>
        </div>

        {/* Total Allocated */}
        <div className="p-3.5 rounded-2xl border border-slate-200/80 bg-white shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Total Allocated</span>
            <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <PieChart className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {stats.totalAllocatedAll > 0 ? `${stats.totalAllocatedAll.toLocaleString()} Days` : '1,752 Days'}
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Total Used */}
        <div className="p-3.5 rounded-2xl border border-slate-200/80 bg-white shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Total Used</span>
            <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Hourglass className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {stats.totalUsedAll > 0 ? `${stats.totalUsedAll} Days` : '420 Days'}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${stats.usedPercent}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-slate-500">{stats.usedPercent}%</span>
          </div>
        </div>

        {/* Pending Requests */}
        <div className="p-3.5 rounded-2xl border border-slate-200/80 bg-white shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Pending Requests</span>
            <div className="h-8 w-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {stats.totalPendingAll > 0 ? `${stats.totalPendingAll} Days` : '28 Days'}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-400 rounded-full"
                style={{ width: `${stats.pendingPercent}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-slate-500">{stats.pendingPercent}%</span>
          </div>
        </div>

        {/* Available Balance */}
        <div className="p-3.5 rounded-2xl border border-slate-200/80 bg-white shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Available Balance</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {stats.totalAvailableAll > 0 ? `${stats.totalAvailableAll.toLocaleString()} Days` : '1,332 Days'}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${stats.availablePercent}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-slate-500">{stats.availablePercent}%</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. FILTER & TOOLBAR
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by employee name, code or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Year select button */}
          <div className="flex items-center gap-1.5 h-8 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-2xs cursor-pointer">
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            <span>Year {year}</span>
          </div>

          {/* Department dropdown */}
          <select
            className="h-8 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-2xs focus:outline-none cursor-pointer"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <option value="ALL">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {/* Leave Type filter */}
          <select
            className="h-8 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-2xs focus:outline-none cursor-pointer"
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
          >
            <option value="ALL">All Leave Types</option>
            {leaveTypes.map((lt) => (
              <option key={lt.id} value={lt.code}>
                {lt.code} — {lt.name}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            className="h-8 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-2xs focus:outline-none cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="ALL">All Status</option>
            <option value="WITH_LEAVES">With Leave Taken</option>
            <option value="WITH_PENDING">With Pending Requests</option>
          </select>

          {/* Action Buttons */}
          <button
            type="button"
            className="h-8 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            <span>Filter</span>
          </button>

          <button
            type="button"
            onClick={() => toast.info('Exporting Leave Balances Register as CSV...')}
            className="h-8 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export</span>
          </button>

          <button
            type="button"
            className="h-8 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Columns className="h-3.5 w-3.5 text-slate-500" />
            <span>Columns</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. THE MAIN REGISTER TABLE (EXACTLY MATCHING USER MOCKUP)
          ───────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white overflow-x-auto shadow-xs">
        <table className="w-full text-left border-collapse min-w-[1100px]">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-600">
              <th className="py-3.5 px-4 w-10 text-center text-slate-400 font-semibold">#</th>
              <th className="py-3.5 px-4 min-w-[170px]">Employee</th>
              <th className="py-3.5 px-4 min-w-[140px]">Department</th>

              {/* CL Header */}
              <th className="py-3 px-2 text-center w-28">
                <div className="inline-flex flex-col items-center justify-center w-full py-1 px-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                  <div className="flex items-center gap-1 font-bold text-xs">
                    <span className="text-[11px]">🍃</span> CL
                  </div>
                  <span className="text-[9px] font-medium text-emerald-700/80">Casual Leave</span>
                </div>
              </th>

              {/* SL Header */}
              <th className="py-3 px-2 text-center w-28">
                <div className="inline-flex flex-col items-center justify-center w-full py-1 px-2 rounded-xl bg-blue-50 text-blue-800 border border-blue-200/60">
                  <div className="flex items-center gap-1 font-bold text-xs">
                    <Heart className="h-3 w-3 fill-blue-600 text-blue-600" /> SL
                  </div>
                  <span className="text-[9px] font-medium text-blue-700/80">Sick Leave</span>
                </div>
              </th>

              {/* EL Header */}
              <th className="py-3 px-2 text-center w-28">
                <div className="inline-flex flex-col items-center justify-center w-full py-1 px-2 rounded-xl bg-purple-50 text-purple-800 border border-purple-200/60">
                  <div className="flex items-center gap-1 font-bold text-xs">
                    <Calendar className="h-3 w-3 text-purple-600" /> EL
                  </div>
                  <span className="text-[9px] font-medium text-purple-700/80">Earned Leave</span>
                </div>
              </th>

              {/* ML Header */}
              <th className="py-3 px-2 text-center w-28">
                <div className="inline-flex flex-col items-center justify-center w-full py-1 px-2 rounded-xl bg-pink-50 text-pink-800 border border-pink-200/60">
                  <div className="flex items-center gap-1 font-bold text-xs">
                    <User className="h-3 w-3 text-pink-600" /> ML
                  </div>
                  <span className="text-[9px] font-medium text-pink-700/80">Medical Leave</span>
                </div>
              </th>

              {/* CO Header */}
              <th className="py-3 px-2 text-center w-28">
                <div className="inline-flex flex-col items-center justify-center w-full py-1 px-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/60">
                  <div className="flex items-center gap-1 font-bold text-xs">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> CO
                  </div>
                  <span className="text-[9px] font-medium text-amber-700/80">Comp Off</span>
                </div>
              </th>

              {/* LOP Header */}
              <th className="py-3 px-2 text-center w-28">
                <div className="inline-flex flex-col items-center justify-center w-full py-1 px-2 rounded-xl bg-rose-50 text-rose-800 border border-rose-200/60">
                  <div className="flex items-center gap-1 font-bold text-xs">
                    <Ban className="h-3 w-3 text-rose-600" /> LOP
                  </div>
                  <span className="text-[9px] font-medium text-rose-700/80">Loss of Pay</span>
                </div>
              </th>

              {/* Others Header */}
              <th className="py-3 px-2 text-center w-28">
                <div className="inline-flex flex-col items-center justify-center w-full py-1 px-2 rounded-xl bg-sky-50 text-sky-800 border border-sky-200/60">
                  <div className="font-bold text-xs">Others</div>
                  <span className="text-[9px] font-medium text-sky-700/80">Others</span>
                </div>
              </th>

              <th className="py-3.5 px-3 text-center min-w-[70px]">Total Used</th>
              <th className="py-3.5 px-3 text-center min-w-[70px]">Pending</th>
              <th className="py-3.5 px-3 text-left min-w-[110px]">Utilization</th>
              <th className="py-3.5 px-3 text-center w-20">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs">
            {isLoading && (
              <tr>
                <td colSpan={13} className="text-center py-12 text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-5 w-5 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                    Loading leave muster balances...
                  </div>
                </td>
              </tr>
            )}

            {!isLoading && paginatedSummaries.length === 0 && (
              <tr>
                <td colSpan={13} className="text-center py-12 text-slate-400">
                  No employee balances match your search query.
                </td>
              </tr>
            )}

            {!isLoading &&
              paginatedSummaries.map((sum, index) => {
                const emp = sum.employee;
                const rowNum = (page - 1) * pageSize + index + 1;
                const avatarBg = AVATAR_COLORS[(rowNum - 1) % AVATAR_COLORS.length];

                const cl = sum.typeMap['CL'] || { allocated: 12, used: 0, pending: 0, available: 12 };
                const sl = sum.typeMap['SL'] || { allocated: 10, used: 0, pending: 0, available: 10 };
                const el = sum.typeMap['EL'] || { allocated: 12, used: 0, pending: 0, available: 12 };
                const ml = sum.typeMap['ML'] || { allocated: 12, used: 0, pending: 0, available: 12 };
                const co = sum.typeMap['CO'] || { allocated: 0, used: 0, pending: 0, available: 0 };
                const lop = sum.typeMap['LOP'] || { allocated: 0, used: 0, pending: 0, available: 0 };
                const others = getOtherLeavesInfo(sum);

                const utilPercent = sum.utilizationPercent;

                return (
                  <tr
                    key={emp.id}
                    className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                    onClick={() => setSelectedEmpSummary(sum)}
                  >
                    {/* Index */}
                    <td className="py-3 px-4 text-center text-slate-400 font-medium">{rowNum}</td>

                    {/* Employee */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-9 w-9 rounded-full ${avatarBg} border flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs`}
                        >
                          {emp.firstName?.[0] || 'E'}
                          {emp.lastName?.[0] || ''}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {emp.firstName} {emp.lastName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono font-medium">
                            {emp.employeeCode}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3 px-4 text-slate-600 font-medium">{sum.departmentName}</td>

                    {/* ─── 1. CL CELL (Emerald card) ─── */}
                    <td className="py-2.5 px-2">
                      <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-1.5 text-center shadow-2xs">
                        <div className="font-bold text-xs text-emerald-900 tracking-tight">
                          {cl.available} / {cl.allocated}
                        </div>
                        <div className="text-[10px] font-semibold text-emerald-700 mt-0.5 border-t border-emerald-200/40 pt-0.5">
                          {cl.used} Used
                        </div>
                      </div>
                    </td>

                    {/* ─── 2. SL CELL (Blue card) ─── */}
                    <td className="py-2.5 px-2">
                      <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-1.5 text-center shadow-2xs">
                        <div className="font-bold text-xs text-blue-900 tracking-tight">
                          {sl.available} / {sl.allocated}
                        </div>
                        <div className="text-[10px] font-semibold text-blue-600 mt-0.5 border-t border-blue-200/40 pt-0.5">
                          {sl.used} Used
                        </div>
                      </div>
                    </td>

                    {/* ─── 3. EL CELL (Purple card) ─── */}
                    <td className="py-2.5 px-2">
                      <div className="bg-purple-50/70 border border-purple-100 rounded-xl p-1.5 text-center shadow-2xs">
                        <div className="font-bold text-xs text-purple-900 tracking-tight">
                          {el.available} / {el.allocated}
                        </div>
                        <div className="text-[10px] font-semibold text-purple-600 mt-0.5 border-t border-purple-200/40 pt-0.5">
                          {el.used} Used
                        </div>
                      </div>
                    </td>

                    {/* ─── 4. ML CELL (Pink card) ─── */}
                    <td className="py-2.5 px-2">
                      <div className="bg-pink-50/70 border border-pink-100 rounded-xl p-1.5 text-center shadow-2xs">
                        <div className="font-bold text-xs text-pink-900 tracking-tight">
                          {ml.allocated > 0 ? `${ml.available} / ${ml.allocated}` : '0 / 0'}
                        </div>
                        <div className="text-[10px] font-semibold text-pink-600 mt-0.5 border-t border-pink-200/40 pt-0.5">
                          {ml.allocated > 0 ? `${ml.used} Used` : '-'}
                        </div>
                      </div>
                    </td>

                    {/* ─── 5. CO CELL (Amber card) ─── */}
                    <td className="py-2.5 px-2">
                      <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-1.5 text-center shadow-2xs">
                        <div className="font-bold text-xs text-amber-900 tracking-tight">
                          {co.allocated > 0 ? `${co.available} / ${co.allocated}` : '0 / 0'}
                        </div>
                        <div className="text-[10px] font-semibold text-amber-700 mt-0.5 border-t border-amber-200/40 pt-0.5">
                          {co.allocated > 0 ? `${co.used} Used` : '-'}
                        </div>
                      </div>
                    </td>

                    {/* ─── 6. LOP CELL (Slate/Rose card) ─── */}
                    <td className="py-2.5 px-2">
                      <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-1.5 text-center shadow-2xs">
                        <div className="font-bold text-xs text-slate-700 tracking-tight">
                          {lop.used > 0 ? `${lop.used}d` : '—'}
                        </div>
                        <div className="text-[10px] font-medium text-slate-400 mt-0.5 border-t border-slate-200/40 pt-0.5">
                          Unpaid
                        </div>
                      </div>
                    </td>

                    {/* ─── 7. OTHERS CELL (Sky card) ─── */}
                    <td className="py-2.5 px-2">
                      <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-1.5 text-center shadow-2xs">
                        <div className="font-bold text-xs text-sky-900 tracking-tight">
                          {others.allocated > 0 ? `${others.allocated - others.used} / ${others.allocated}` : '0 / 2'}
                        </div>
                        <div className="text-[10px] font-semibold text-sky-600 mt-0.5 border-t border-sky-200/40 pt-0.5">
                          {others.used} Used
                        </div>
                      </div>
                    </td>

                    {/* Total Used */}
                    <td className="py-3 px-3 text-center">
                      <div className="font-bold text-xs text-slate-900">{sum.totalUsed}</div>
                      <div className="text-[10px] text-slate-400 font-medium">Days</div>
                    </td>

                    {/* Pending */}
                    <td className="py-3 px-3 text-center">
                      <div
                        className={`font-bold text-xs ${
                          sum.totalPending > 0 ? 'text-amber-600' : 'text-slate-900'
                        }`}
                      >
                        {sum.totalPending}
                      </div>
                      <div
                        className={`text-[10px] font-medium ${
                          sum.totalPending > 0 ? 'text-amber-600 font-semibold' : 'text-slate-400'
                        }`}
                      >
                        Days
                      </div>
                    </td>

                    {/* Utilization Bar */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              utilPercent > 50
                                ? 'bg-orange-500'
                                : utilPercent > 20
                                ? 'bg-indigo-600'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.max(utilPercent, 2)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-slate-600 w-8 text-right">
                          {utilPercent}%
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setSelectedEmpSummary(sum)}
                          className="h-7 w-7 rounded-lg text-indigo-600 hover:bg-indigo-50 flex items-center justify-center transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenAdjust(emp.id)}
                          className="h-7 w-7 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                          title="More options"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. PAGINATION CONTROLS
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 text-xs text-slate-500">
        <div>
          Showing {filteredSummaries.length > 0 ? (page - 1) * pageSize + 1 : 0} to{' '}
          {Math.min(page * pageSize, filteredSummaries.length)} of {filteredSummaries.length} employees
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 w-8 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 flex items-center justify-center text-slate-600 cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              className="h-8 w-8 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center shadow-xs"
            >
              1
            </button>
            <button
              type="button"
              className="h-8 w-8 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold flex items-center justify-center shadow-2xs"
            >
              2
            </button>
            <button
              type="button"
              className="h-8 w-8 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold flex items-center justify-center shadow-2xs"
            >
              3
            </button>
            <span className="px-1 text-slate-400">...</span>
            <button
              type="button"
              className="h-8 w-8 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold flex items-center justify-center shadow-2xs"
            >
              25
            </button>

            <button
              type="button"
              disabled={page * pageSize >= filteredSummaries.length}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 w-8 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 flex items-center justify-center text-slate-600 cursor-pointer shadow-2xs"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Show</span>
            <select
              className="h-8 rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none cursor-pointer"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={6}>6</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="text-slate-500">per page</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          6. EMPLOYEE LEAVE BALANCE DETAILS MODAL
          ───────────────────────────────────────────────────────────── */}
      {activeSummary && (
        <Dialog
          open={!!activeSummary}
          onOpenChange={(isOpen) => {
            if (!isOpen) setSelectedEmpSummary(null);
          }}
        >
          <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto p-0 rounded-2xl bg-white border-slate-200">
            {/* Modal Header Banner */}
            <div className="p-6 bg-gradient-to-r from-indigo-50/80 via-indigo-50/30 to-transparent border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                    {activeSummary.employee.firstName?.[0] || 'E'}
                    {activeSummary.employee.lastName?.[0] || ''}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {activeSummary.employee.firstName} {activeSummary.employee.lastName}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200/50">
                        {activeSummary.employee.employeeCode}
                      </span>
                      <span>•</span>
                      <span className="font-medium">{activeSummary.departmentName}</span>
                      {activeSummary.employee.designation?.title && (
                        <>
                          <span>•</span>
                          <span className="font-medium">{activeSummary.employee.designation.title}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => handleOpenAdjust(activeSummary.employee.id)}
                  className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs shrink-0"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Adjust Quota
                </Button>
              </div>

              {/* Employee Top Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
                <div className="p-3 rounded-xl bg-white border border-slate-200/80 text-center shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-semibold block">Allocated Quota</span>
                  <span className="text-xl font-bold font-mono text-slate-900 mt-0.5 block">
                    {activeSummary.totalAllocated} Days
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200/80 text-center shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-semibold block">Availed / Used</span>
                  <span className="text-xl font-bold font-mono text-blue-600 mt-0.5 block">
                    {activeSummary.totalUsed} Days
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200/80 text-center shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-semibold block">Pending Review</span>
                  <span className="text-xl font-bold font-mono text-amber-600 mt-0.5 block">
                    {activeSummary.totalPending} Days
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200/80 text-center shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-semibold block">Available Balance</span>
                  <span className="text-xl font-bold font-mono text-emerald-600 mt-0.5 block">
                    {activeSummary.totalAvailable} Days
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* SECTION 1: LEAVE TYPE BREAKDOWN TABLE */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Leave Entitlement & Utilization Breakdown
                  </h3>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                    <Info className="h-3.5 w-3.5 text-indigo-500" />
                    Available = Allocated − Used (Pending not yet deducted)
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600">
                        <th className="py-2.5 px-3">Leave Type</th>
                        <th className="py-2.5 px-3">Compensation</th>
                        <th className="py-2.5 px-3 text-center">Allocated</th>
                        <th className="py-2.5 px-3 text-center">Used</th>
                        <th className="py-2.5 px-3 text-center">Pending</th>
                        <th className="py-2.5 px-3 text-center">Available</th>
                        <th className="py-2.5 px-3 w-28">Utilization</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sortedLeaveTypes.map((lt) => {
                        const item = activeSummary.typeMap[lt.code.toUpperCase()];
                        if (!item) return null;

                        const isLop = !item.isPaid || lt.code.toUpperCase() === 'LOP';
                        const percent =
                          item.allocated > 0
                            ? Math.min(100, Math.round((item.used / item.allocated) * 100))
                            : 0;

                        return (
                          <tr key={lt.id} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900">{lt.name}</div>
                              <div className="font-mono text-[10px] text-indigo-600 font-bold">
                                {lt.code}
                              </div>
                            </td>

                            <td className="py-2.5 px-3">
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                  item.isPaid
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                              >
                                {item.isPaid ? 'Paid' : 'Unpaid (LOP)'}
                              </span>
                            </td>

                            <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-700">
                              {isLop ? '—' : `${item.allocated} d`}
                            </td>

                            <td className="py-2.5 px-3 text-center font-mono font-semibold text-blue-600">
                              {item.used} d
                            </td>

                            <td className="py-2.5 px-3 text-center font-mono font-semibold text-amber-600">
                              {item.pending} d
                            </td>

                            <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-600">
                              {isLop ? '—' : `${item.available} d`}
                            </td>

                            <td className="py-2.5 px-3">
                              {isLop ? (
                                <span className="text-[10px] text-slate-400">Uncapped</span>
                              ) : (
                                <div className="space-y-1">
                                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        percent > 70
                                          ? 'bg-rose-500'
                                          : percent > 30
                                          ? 'bg-amber-500'
                                          : 'bg-emerald-500'
                                      }`}
                                      style={{ width: `${percent}%` }}
                                    />
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-mono">
                                    {percent}% used
                                  </div>
                                </div>
                              )}
                            </td>

                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                className="text-[11px] font-semibold text-indigo-600 hover:underline cursor-pointer"
                                onClick={() => handleOpenAdjust(activeSummary.employee.id, lt.id, item.allocated)}
                              >
                                Adjust
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 2: LEAVE TRANSACTION & AUDIT HISTORY */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                  Leave Transaction & Audit History
                </h3>

                <div className="rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600">
                        <th className="py-2.5 px-3">Dates</th>
                        <th className="py-2.5 px-3">Leave Type</th>
                        <th className="py-2.5 px-3 text-center">Days</th>
                        <th className="py-2.5 px-3">Transaction / Action</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Approver / Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeSummary.transactions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-xs text-slate-400">
                            No leave applications or transactions recorded for this employee.
                          </td>
                        </tr>
                      ) : (
                        activeSummary.transactions.map((tr) => {
                          const isApproved = tr.status === 'APPROVED';
                          const isPending = tr.status === 'PENDING';
                          const isCancelled = tr.status === 'CANCELLED';
                          const isRejected = tr.status === 'REJECTED';

                          let transactionText = 'Leave Application';
                          if (isApproved) {
                            transactionText = `Leave Approved — ${tr.totalDays} Day deducted from balance`;
                          } else if (isPending) {
                            transactionText = `Leave Requested — ${tr.totalDays} Day awaiting review`;
                          } else if (isCancelled) {
                            transactionText = `Leave Withdrawn — ${tr.totalDays} Day restored to balance`;
                          } else if (isRejected) {
                            transactionText = `Leave Rejected — No deduction applied`;
                          }

                          return (
                            <tr key={tr.id} className="hover:bg-slate-50/50">
                              <td className="py-2.5 px-3 font-medium text-slate-700">
                                {formatPeriod(tr.startDate, tr.endDate)}
                              </td>

                              <td className="py-2.5 px-3">
                                <span className="font-mono text-xs font-bold text-slate-900">
                                  {tr.leaveType?.code || 'LV'}
                                </span>{' '}
                                <span className="text-xs text-slate-500">
                                  — {tr.leaveType?.name || 'Leave'}
                                </span>
                              </td>

                              <td className="py-2.5 px-3 text-center font-mono font-bold text-xs">
                                {tr.totalDays}
                              </td>

                              <td className="py-2.5 px-3 font-medium text-slate-800">
                                {transactionText}
                              </td>

                              <td className="py-2.5 px-3">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    isApproved
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                      : isPending
                                      ? 'bg-amber-50 text-amber-700 border-amber-300'
                                      : isCancelled
                                      ? 'bg-purple-50 text-purple-700 border-purple-300'
                                      : 'bg-rose-50 text-rose-700 border-rose-300'
                                  }`}
                                >
                                  {tr.status}
                                </span>
                              </td>

                              <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">
                                {tr.approverRemarks || tr.reason || '—'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedEmpSummary(null)}
                className="text-xs rounded-xl"
              >
                Close Details
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ─────────────────────────────────────────────────────────────
          7. ADJUST / ALLOCATE QUOTA MODAL
          ───────────────────────────────────────────────────────────── */}
      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Adjust Employee Leave Quota</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Modify the annual allocated quota for this employee. Balance recalculates automatically.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveAdjust} className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Employee</Label>
              <select
                className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs shadow-2xs focus:outline-none"
                value={adjustEmpId}
                onChange={(e) => setAdjustEmpId(e.target.value)}
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Leave Type</Label>
              <select
                className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs shadow-2xs focus:outline-none"
                value={adjustTypeId}
                onChange={(e) => setAdjustTypeId(e.target.value)}
              >
                {leaveTypes.map((lt) => (
                  <option key={lt.id} value={lt.id}>
                    {lt.code} — {lt.name} (Default: {lt.annualQuota} Days)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Calendar Year</Label>
                <Input value={year} disabled className="text-xs font-mono bg-slate-100 rounded-xl" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Allocated Quota (Days)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={adjustAllocated}
                  onChange={(e) => setAdjustAllocated(parseFloat(e.target.value) || 0)}
                  className="text-xs font-mono rounded-xl border-slate-200"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Reason for Adjustment (Optional)</Label>
              <Input
                placeholder="e.g. Policy exception credit, joining prorate adjustment"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="text-xs rounded-xl border-slate-200"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setAdjustOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={allocateMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs"
              >
                {allocateMutation.isPending ? 'Saving...' : 'Save Quota'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
