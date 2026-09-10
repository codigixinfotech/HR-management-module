import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Search,
  Filter,
  Eye,
  Check,
  X,
  Clock,
  Calendar,
  User,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  FileText,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { leaveRequestsApi } from '@/api/attendance-leave';
import type { LeaveRequest, LeaveType, LeaveBalance } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface LeaveRequestsViewProps {
  requests: LeaveRequest[];
  leaveTypes: LeaveType[];
  leaveBalances?: LeaveBalance[];
  isLoading: boolean;
  departments: string[];
  isApprover?: boolean;
}

function isFutureLeave(startDateStr: string): boolean {
  const start = new Date(startDateStr);
  start.setHours(23, 59, 59, 999);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return start >= today;
}

function formatDateDisplay(start: string, end: string): string {
  const s = new Date(start).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const e = new Date(end).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  return s === e ? s : `${s} → ${e}`;
}

export function LeaveRequestsView({
  requests,
  leaveTypes,
  leaveBalances = [],
  isLoading,
  departments,
  isApprover = true,
}: LeaveRequestsViewProps) {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Modals state
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

  // 1. Approve modal state
  const [approveTarget, setApproveTarget] = useState<LeaveRequest | null>(null);
  const [approveComment, setApproveComment] = useState('Approved. Please complete handover before leave.');

  // 2. Reject modal state
  const [rejectTarget, setRejectTarget] = useState<LeaveRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // 3. Withdraw modal state
  const [withdrawTarget, setWithdrawTarget] = useState<LeaveRequest | null>(null);
  const [withdrawReason, setWithdrawReason] = useState('Leave is no longer required.');

  // Status mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status, approverRemarks }: { id: string; status: 'APPROVED' | 'REJECTED' | 'CANCELLED'; approverRemarks?: string }) =>
      leaveRequestsApi.updateStatus(id, { status, approverRemarks }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
      const actionName =
        variables.status === 'APPROVED'
          ? 'approved'
          : variables.status === 'REJECTED'
          ? 'rejected'
          : 'withdrawn / cancelled';
      toast.success(`Leave request ${actionName} successfully`);
      setApproveTarget(null);
      setRejectTarget(null);
      setWithdrawTarget(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to update leave request');
    },
  });

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const empName = `${req.employee?.firstName || ''} ${req.employee?.lastName || ''}`.toLowerCase();
        const empCode = req.employee?.employeeCode?.toLowerCase() || '';
        const typeName = req.leaveType?.name?.toLowerCase() || '';
        const reason = req.reason?.toLowerCase() || '';
        if (!empName.includes(q) && !empCode.includes(q) && !typeName.includes(q) && !reason.includes(q)) {
          return false;
        }
      }

      // Status
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'CANCELLED' && req.status === 'CANCELLED') {
          // match
        } else if (req.status !== statusFilter) {
          return false;
        }
      }

      // Department
      if (deptFilter !== 'ALL') {
        const dName = req.employee?.department?.name || 'General';
        if (dName !== deptFilter) return false;
      }

      // Type
      if (typeFilter !== 'ALL' && req.leaveTypeId !== typeFilter) {
        return false;
      }

      return true;
    });
  }, [requests, search, statusFilter, deptFilter, typeFilter]);

  // Balance calculations for withdraw preview
  const withdrawBalancePreview = useMemo(() => {
    if (!withdrawTarget) return { currentUsed: 1, afterUsed: 0, afterAvailable: 12 };
    const empBalance = leaveBalances.find(
      (b) => b.employeeId === withdrawTarget.employeeId && b.leaveTypeId === withdrawTarget.leaveTypeId
    );
    const quota = withdrawTarget.leaveType?.annualQuota || 12;
    const currentUsed = empBalance?.used || withdrawTarget.totalDays || 1;
    const afterUsed = Math.max(0, currentUsed - (withdrawTarget.totalDays || 1));
    const afterAvailable = Math.max(0, quota - afterUsed);
    return {
      currentUsed,
      afterUsed,
      afterAvailable,
    };
  }, [withdrawTarget, leaveBalances]);

  const confirmApprove = () => {
    if (!approveTarget) return;
    statusMutation.mutate({
      id: approveTarget.id,
      status: 'APPROVED',
      approverRemarks: approveComment.trim() || 'Approved. Please complete handover before leave.',
    });
  };

  const confirmReject = () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      toast.error('Rejection reason is mandatory.');
      return;
    }
    statusMutation.mutate({
      id: rejectTarget.id,
      status: 'REJECTED',
      approverRemarks: rejectReason.trim(),
    });
  };

  const confirmWithdraw = () => {
    if (!withdrawTarget) return;
    if (!withdrawReason.trim()) {
      toast.error('Withdrawal reason is mandatory.');
      return;
    }
    statusMutation.mutate({
      id: withdrawTarget.id,
      status: 'CANCELLED',
      approverRemarks: withdrawReason.trim(),
    });
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3.5 rounded-xl border border-border/80 bg-card shadow-2xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by employee, code, reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-background"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Withdrawn / Cancelled</option>
          </select>

          {/* Department Filter */}
          <select
            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1"
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

          {/* Leave Type Filter */}
          <select
            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="ALL">All Leave Types</option>
            {leaveTypes.map((lt) => (
              <option key={lt.id} value={lt.id}>
                {lt.code} — {lt.name}
              </option>
            ))}
          </select>

          {(search || statusFilter !== 'ALL' || deptFilter !== 'ALL' || typeFilter !== 'ALL') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setStatusFilter('ALL');
                setDeptFilter('ALL');
                setTypeFilter('ALL');
              }}
              className="h-8 text-xs text-muted-foreground"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Requests Table */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="text-xs font-semibold">Employee</TableHead>
              <TableHead className="text-xs font-semibold">Leave Type</TableHead>
              <TableHead className="text-xs font-semibold">Duration & Session</TableHead>
              <TableHead className="text-xs font-semibold">Dates</TableHead>
              <TableHead className="text-xs font-semibold text-center">Days</TableHead>
              <TableHead className="text-xs font-semibold">Current Approver</TableHead>
              <TableHead className="text-xs font-semibold">Status</TableHead>
              <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-xs text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    Loading enterprise leave requests...
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isLoading && filteredRequests.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-xs text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                  No leave requests found matching selected criteria.
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              filteredRequests.map((req) => {
                const isHalf = req.duration === 'HALF_DAY';
                const sessionText =
                  req.halfDaySession === 'FIRST_HALF'
                    ? 'First Half (Morning)'
                    : req.halfDaySession === 'SECOND_HALF'
                    ? 'Second Half (Afternoon)'
                    : '';

                const dateDisplay = formatDateDisplay(req.startDate, req.endDate);
                const isFuture = isFutureLeave(req.startDate);

                return (
                  <TableRow key={req.id} className="hover:bg-muted/30">
                    <TableCell className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {req.employee?.firstName?.[0] || 'E'}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-foreground">
                            {req.employee?.firstName} {req.employee?.lastName}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {req.employee?.employeeCode} • {req.employee?.department?.name || 'General'}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-foreground">
                          {req.leaveType?.code || 'LV'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          — {req.leaveType?.name || 'Leave'}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="py-2.5">
                      {isHalf ? (
                        <div className="space-y-0.5">
                          <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40">
                            Half Day (0.5)
                          </Badge>
                          {sessionText && (
                            <div className="text-[10px] text-muted-foreground">{sessionText}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-foreground">
                          {req.totalDays > 1 ? `Multi-Day (${req.totalDays} Days)` : 'Full Day'}
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="py-2.5 text-xs font-medium">
                      {dateDisplay}
                    </TableCell>

                    <TableCell className="py-2.5 text-center">
                      <span className="font-mono font-bold text-xs bg-muted/60 px-2 py-0.5 rounded">
                        {req.totalDays}
                      </span>
                    </TableCell>

                    <TableCell className="py-2.5">
                      <div className="text-xs font-medium text-foreground">
                        {req.currentApproverRole || 'Reporting Manager'}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Level {req.approvalLevel || 1}</div>
                    </TableCell>

                    <TableCell className="py-2.5">
                      <StatusBadge status={req.status} className="text-[10px]" />
                    </TableCell>

                    {/* Table action behavior per User Matrix */}
                    <TableCell className="py-2.5 text-right space-x-1 whitespace-nowrap">
                      {/* Eye: Open Details (Always available for all statuses) */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        title="Open Details"
                        onClick={() => setSelectedRequest(req)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>

                      {/* In Leave Requests tab: Eye is always available, Withdraw is available for Approved Future leaves */}

                      {/* Approved (Future): Withdraw = Yes */}
                      {req.status === 'APPROVED' && isFuture && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          title="Withdraw Approved Leave"
                          onClick={() => {
                            setWithdrawTarget(req);
                            setWithdrawReason('Leave is no longer required.');
                          }}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                      )}

                      {/* Approved (Past), Rejected, Withdrawn: No action buttons beyond Eye */}
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          1. APPROVE POPUP (Keka Standard)
          ───────────────────────────────────────────────────────────── */}
      {approveTarget && (
        <Dialog open={!!approveTarget} onOpenChange={() => setApproveTarget(null)}>
          <DialogContent className="sm:max-w-md p-0 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent border-b">
              <DialogHeader>
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <DialogTitle className="text-base font-bold">Approve Leave Request</DialogTitle>
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-1">
                  Confirm approval for this employee leave request.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/30 border">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Employee</span>
                  <span className="font-semibold text-foreground text-xs">
                    {approveTarget.employee?.firstName} {approveTarget.employee?.lastName}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Leave</span>
                  <span className="font-semibold text-foreground text-xs">
                    {approveTarget.leaveType?.name || 'Leave'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Dates</span>
                  <span className="font-semibold text-foreground text-xs">
                    {formatDateDisplay(approveTarget.startDate, approveTarget.endDate)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Days</span>
                  <span className="font-mono font-bold text-emerald-700 text-xs">
                    {approveTarget.totalDays} Day{approveTarget.totalDays > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Approval Comment</Label>
                <Input
                  placeholder="Approved. Please complete handover before leave."
                  value={approveComment}
                  onChange={(e) => setApproveComment(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <DialogFooter className="p-4 bg-muted/20 border-t flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setApproveTarget(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={statusMutation.isPending}
                onClick={confirmApprove}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {statusMutation.isPending ? 'Approving...' : 'Confirm Approval'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. REJECT POPUP (Keka Standard)
          ───────────────────────────────────────────────────────────── */}
      {rejectTarget && (
        <Dialog open={!!rejectTarget} onOpenChange={() => setRejectTarget(null)}>
          <DialogContent className="sm:max-w-md p-0 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-destructive/15 via-destructive/5 to-transparent border-b">
              <DialogHeader>
                <div className="flex items-center gap-2 text-destructive font-bold">
                  <XCircle className="h-5 w-5 text-destructive" />
                  <DialogTitle className="text-base font-bold">Reject Leave Request</DialogTitle>
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-1">
                  Reject this request with a mandatory reason.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/30 border">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Employee</span>
                  <span className="font-semibold text-foreground text-xs">
                    {rejectTarget.employee?.firstName} {rejectTarget.employee?.lastName}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Leave Type</span>
                  <span className="font-semibold text-foreground text-xs">
                    {rejectTarget.leaveType?.name || 'Leave'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Date</span>
                  <span className="font-semibold text-foreground text-xs">
                    {formatDateDisplay(rejectTarget.startDate, rejectTarget.endDate)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Days</span>
                  <span className="font-mono font-bold text-destructive text-xs">
                    {rejectTarget.totalDays} Day{rejectTarget.totalDays > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Rejection Reason <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Production manpower shortage. Please choose another date."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="text-xs"
                />
                <p className="text-[11px] text-muted-foreground">Mandatory explanation recorded in audit history.</p>
              </div>
            </div>

            <DialogFooter className="p-4 bg-muted/20 border-t flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setRejectTarget(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={statusMutation.isPending}
                onClick={confirmReject}
                className="font-semibold"
              >
                {statusMutation.isPending ? 'Rejecting...' : 'Confirm Reject'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. WITHDRAW APPROVED LEAVE POPUP (Keka Standard)
          ───────────────────────────────────────────────────────────── */}
      {withdrawTarget && (
        <Dialog open={!!withdrawTarget} onOpenChange={() => setWithdrawTarget(null)}>
          <DialogContent className="sm:max-w-md p-0 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border-b">
              <DialogHeader>
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold">
                  <RotateCcw className="h-5 w-5 text-amber-600" />
                  <DialogTitle className="text-base font-bold">Withdraw Approved Leave</DialogTitle>
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-1">
                  Withdrawal creates a request and restores balance only after approval if your company policy requires it.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/30 border">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Employee</span>
                  <span className="font-semibold text-foreground text-xs">
                    {withdrawTarget.employee?.firstName} {withdrawTarget.employee?.lastName}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Leave Type</span>
                  <span className="font-semibold text-foreground text-xs">
                    {withdrawTarget.leaveType?.name || 'Leave'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Leave Date</span>
                  <span className="font-semibold text-foreground text-xs">
                    {formatDateDisplay(withdrawTarget.startDate, withdrawTarget.endDate)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Current Status</span>
                  <Badge variant="success" className="text-[10px] py-0 px-2 mt-0.5">
                    APPROVED
                  </Badge>
                </div>
              </div>

              {/* Balance Preview Card */}
              <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
                <span className="font-bold text-amber-900 dark:text-amber-200 text-xs block">
                  Balance Preview
                </span>
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="p-2 rounded bg-background border">
                    <span className="text-[10px] text-muted-foreground block">Current Used Leave</span>
                    <span className="font-bold font-mono text-xs text-foreground">
                      {withdrawBalancePreview.currentUsed} Day{withdrawBalancePreview.currentUsed !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-background border">
                    <span className="text-[10px] text-muted-foreground block">After Withdrawal</span>
                    <span className="font-bold font-mono text-xs text-blue-600">
                      {withdrawBalancePreview.afterUsed} Day{withdrawBalancePreview.afterUsed !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300">
                    <span className="text-[10px] text-emerald-700 font-semibold block">Available Balance</span>
                    <span className="font-bold font-mono text-xs text-emerald-700">
                      {withdrawBalancePreview.afterAvailable} Days
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Withdrawal Reason <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Leave is no longer required."
                  value={withdrawReason}
                  onChange={(e) => setWithdrawReason(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <DialogFooter className="p-4 bg-muted/20 border-t flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setWithdrawTarget(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={statusMutation.isPending}
                onClick={confirmWithdraw}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
              >
                {statusMutation.isPending ? 'Processing...' : 'Submit Withdrawal'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. VIEW DETAILS MODAL (With Audit Trail)
          ───────────────────────────────────────────────────────────── */}
      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-base font-bold">Leave Application Details</DialogTitle>
                <StatusBadge status={selectedRequest.status} />
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Application reference ID: {selectedRequest.id}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="p-3 rounded-lg bg-muted/40 border space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Employee:</span>
                  <span className="font-semibold text-foreground">
                    {selectedRequest.employee?.firstName} {selectedRequest.employee?.lastName} ({selectedRequest.employee?.employeeCode})
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Department:</span>
                  <span className="font-medium text-foreground">
                    {selectedRequest.employee?.department?.name || 'General'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Leave Policy:</span>
                  <span className="font-bold text-foreground">
                    {selectedRequest.leaveType?.code} — {selectedRequest.leaveType?.name}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Duration & Days:</span>
                  <span className="font-mono font-bold text-foreground">
                    {selectedRequest.totalDays} Day{selectedRequest.totalDays > 1 ? 's' : ''} ({selectedRequest.duration || 'FULL_DAY'})
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Applied Dates:</span>
                  <span className="font-medium text-foreground">
                    {formatDateDisplay(selectedRequest.startDate, selectedRequest.endDate)}
                  </span>
                </div>
              </div>

              {selectedRequest.reason && (
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-foreground">Reason for Application:</span>
                  <div className="p-2.5 rounded-md bg-background border text-xs text-muted-foreground">
                    {selectedRequest.reason}
                  </div>
                </div>
              )}

              {selectedRequest.attachmentUrl && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-blue-50/50 border border-blue-200 text-xs">
                  <Paperclip className="h-3.5 w-3.5 text-blue-600" />
                  <span className="text-blue-700 font-medium">Attachment Provided:</span>
                  <a
                    href={selectedRequest.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline font-mono text-[11px] truncate max-w-xs"
                  >
                    {selectedRequest.attachmentUrl}
                  </a>
                </div>
              )}

              {selectedRequest.approverRemarks && (
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-foreground">Approver Decision Remarks:</span>
                  <div className="p-2.5 rounded-md bg-muted/30 border text-xs text-muted-foreground italic">
                    "{selectedRequest.approverRemarks}"
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
              {selectedRequest.status === 'APPROVED' && isFutureLeave(selectedRequest.startDate) ? (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    const req = selectedRequest;
                    setSelectedRequest(null);
                    setWithdrawTarget(req);
                    setWithdrawReason('Leave is no longer required.');
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Withdraw Application
                </Button>
              ) : (
                <div />
              )}
              <Button size="sm" variant="outline" onClick={() => setSelectedRequest(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
