import { useState } from 'react';
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
} from 'lucide-react';
import type { LeaveBalance, LeaveRequest, LeaveType } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

  // Filter upcoming leaves (start date in future or covering today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingLeaves = requests
    .filter((r) => {
      const end = new Date(r.endDate);
      end.setHours(23, 59, 59, 999);
      return (
        (r.status === 'APPROVED' || r.status === 'PENDING') &&
        end >= today
      );
    })
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 3);

  // Recent requests
  const recentRequests = requests.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* 1. Quick Apply Leave Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[11px] font-bold text-white tracking-wide uppercase">
              Self-Service Portal
            </span>
            <span className="text-xs text-indigo-200">Instant Online Application</span>
          </div>
          <h3 className="text-lg font-bold">Planning time off?</h3>
          <p className="text-xs text-indigo-100 max-w-xl">
            Submit your leave application with automatic balance validation, weekly-off deduction, and real-time manager approval notifications.
          </p>
        </div>

        <Button
          onClick={onApplyLeaveClick}
          className="bg-white text-indigo-700 hover:bg-white/90 font-bold text-xs h-10 px-5 rounded-xl shadow-sm shrink-0 cursor-pointer flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Apply for Leave</span>
        </Button>
      </div>

      {/* 2. Leave Balance Summary Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palmtree className="h-4 w-4 text-indigo-600" />
            <h4 className="text-sm font-bold text-slate-900">My Leave Quota & Balances</h4>
          </div>
          <button
            type="button"
            onClick={onViewBalanceClick}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
          >
            <span>View Detailed Balance</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {balances.map((b) => {
            const code = b.leaveType?.code || 'LV';
            const defaultQuota = b.leaveType?.annualQuota || 12;
            const allocated = b.allocated > 0 ? b.allocated : defaultQuota;
            const used = b.used || 0;
            const pending = (b as any).pending || 0;
            const available = Math.max(0, allocated - used - pending);
            const utilization = allocated > 0 ? Math.min(100, Math.round(((used + pending) / allocated) * 100)) : 0;

            return (
              <div
                key={b.id || `${b.employeeId}_${b.leaveTypeId}`}
                className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-indigo-200 transition-all shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {b.leaveType?.name || code}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {code}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {b.leaveType?.isPaid !== false ? 'Paid Leave' : 'Unpaid (LOP)'}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-black text-slate-900">
                      {available} <span className="text-xs font-normal text-slate-400">/ {allocated}</span>
                    </div>
                    <div className="text-[10px] text-emerald-600 font-semibold">Available</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span>Used: {used}d {pending > 0 && `(+${pending}d pending)`}</span>
                    <span>{utilization}% consumed</span>
                  </div>
                  <Progress
                    value={utilization}
                    className="h-2 rounded-full bg-slate-100"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Two-Column Row: Upcoming Leaves & Recent Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Column: Upcoming Leave */}
        <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-600" />
              <h4 className="text-sm font-bold text-slate-900">Upcoming Leave</h4>
            </div>
            <Badge variant="outline" className="text-[10px] font-semibold">
              {upcomingLeaves.length} Scheduled
            </Badge>
          </div>

          {upcomingLeaves.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-400 space-y-2">
              <Calendar className="h-8 w-8 mx-auto text-slate-300" />
              <div className="font-semibold text-slate-600">No Upcoming Leaves</div>
              <p className="text-[11px] text-slate-400">
                You do not have any upcoming approved or pending leaves scheduled.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcomingLeaves.map((req) => {
                const isApproved = req.status === 'APPROVED';
                return (
                  <div
                    key={req.id}
                    onClick={() => setSelectedRequest(req)}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-indigo-50/20 hover:border-indigo-200 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                          isApproved
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {req.leaveType?.code || 'LV'}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900">
                          {req.leaveType?.name || 'Leave'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {new Date(req.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          {req.startDate !== req.endDate && (
                            <> – {new Date(req.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</>
                          )}
                          {' • '}{req.totalDays} {req.totalDays === 1 ? 'Day' : 'Days'}
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
                      <div className="text-[9px] text-slate-400 mt-1 flex items-center justify-end gap-0.5">
                        <span>Details</span>
                        <ChevronRight className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Recent Requests Feed */}
        <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-600" />
              <h4 className="text-sm font-bold text-slate-900">Recent Applications</h4>
            </div>
            <button
              type="button"
              onClick={onViewAllRequestsClick}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <span>View All ({requests.length})</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {recentRequests.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-400 space-y-2">
              <FileText className="h-8 w-8 mx-auto text-slate-300" />
              <div className="font-semibold text-slate-600">No Leave History</div>
              <p className="text-[11px] text-slate-400">
                You haven't submitted any leave applications yet this year.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentRequests.map((req) => (
                <div
                  key={req.id}
                  onClick={() => setSelectedRequest(req)}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50/50 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">
                        {req.leaveType?.name || 'Leave'}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 rounded bg-slate-100 text-slate-600">
                        {req.leaveType?.code || 'LV'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {new Date(req.startDate).toLocaleDateString()} • {req.totalDays} Days • Applied {new Date(req.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold ${
                        req.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : req.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : req.status === 'REJECTED'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {req.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal View Details */}
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
