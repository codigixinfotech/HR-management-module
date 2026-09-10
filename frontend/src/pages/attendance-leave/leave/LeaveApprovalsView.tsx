import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  CheckCheck,
  XCircle,
  Check,
  X,
  Search,
  Calendar,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { leaveRequestsApi } from '@/api/attendance-leave';
import type { LeaveRequest } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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

interface LeaveApprovalsViewProps {
  requests: LeaveRequest[];
  isLoading: boolean;
}

function formatDateDisplay(start: string, end: string): string {
  const s = new Date(start).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const e = new Date(end).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  return s === e ? s : `${s} → ${e}`;
}

export function LeaveApprovalsView({ requests, isLoading }: LeaveApprovalsViewProps) {
  const queryClient = useQueryClient();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  // Bulk actions state
  const [remarks, setRemarks] = useState('');
  const [bulkAction, setBulkAction] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  // 1. Single Approve Popup State
  const [approveTarget, setApproveTarget] = useState<LeaveRequest | null>(null);
  const [approveComment, setApproveComment] = useState('Approved. Please complete handover before leave.');

  // 2. Single Reject Popup State
  const [rejectTarget, setRejectTarget] = useState<LeaveRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('Production manpower shortage. Please choose another date.');

  // Filter only pending requests
  const pendingRequests = useMemo(() => {
    return requests.filter((r) => {
      if (r.status !== 'PENDING') return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const empName = `${r.employee?.firstName || ''} ${r.employee?.lastName || ''}`.toLowerCase();
        const empCode = r.employee?.employeeCode?.toLowerCase() || '';
        const typeName = r.leaveType?.name?.toLowerCase() || '';
        if (!empName.includes(q) && !empCode.includes(q) && !typeName.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [requests, search]);

  // Bulk mutation
  const bulkMutation = useMutation({
    mutationFn: ({ ids, status, remarks }: { ids: string[]; status: 'APPROVED' | 'REJECTED'; remarks?: string }) =>
      leaveRequestsApi.bulkStatus({
        ids,
        status,
        approverRemarks: remarks,
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
      toast.success(
        `Successfully ${variables.status.toLowerCase()} ${variables.ids.length} leave application${variables.ids.length > 1 ? 's' : ''}`
      );
      setSelectedIds([]);
      setBulkModalOpen(false);
      setRemarks('');
      setBulkAction(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to process bulk approvals');
    },
  });

  // Single action mutation
  const singleActionMutation = useMutation({
    mutationFn: ({ id, status, approverRemarks }: { id: string; status: 'APPROVED' | 'REJECTED'; approverRemarks?: string }) =>
      leaveRequestsApi.updateStatus(id, { status, approverRemarks }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
      toast.success(`Leave request ${variables.status.toLowerCase()} successfully`);
      setSelectedIds((prev) => prev.filter((i) => i !== variables.id));
      setApproveTarget(null);
      setRejectTarget(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to update leave request');
    },
  });

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(pendingRequests.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleTriggerBulk = (status: 'APPROVED' | 'REJECTED') => {
    setBulkAction(status);
    setRemarks('');
    setBulkModalOpen(true);
  };

  const confirmBulkAction = () => {
    if (!bulkAction || selectedIds.length === 0) return;
    bulkMutation.mutate({
      ids: selectedIds,
      status: bulkAction,
      remarks: remarks.trim() || undefined,
    });
  };

  const confirmSingleApprove = () => {
    if (!approveTarget) return;
    singleActionMutation.mutate({
      id: approveTarget.id,
      status: 'APPROVED',
      approverRemarks: approveComment.trim() || 'Approved. Please complete handover before leave.',
    });
  };

  const confirmSingleReject = () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      toast.error('Rejection reason is mandatory.');
      return;
    }
    singleActionMutation.mutate({
      id: rejectTarget.id,
      status: 'REJECTED',
      approverRemarks: rejectReason.trim(),
    });
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border/80 bg-card shadow-2xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search pending requests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-background"
          />
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <span className="text-xs font-semibold text-primary px-2 py-1 rounded bg-primary/10 border border-primary/20">
              {selectedIds.length} Selected
            </span>
          )}

          <Button
            size="sm"
            variant="default"
            disabled={selectedIds.length === 0}
            onClick={() => handleTriggerBulk('APPROVED')}
            className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
            Approve Selected ({selectedIds.length})
          </Button>

          <Button
            size="sm"
            variant="destructive"
            disabled={selectedIds.length === 0}
            onClick={() => handleTriggerBulk('REJECTED')}
            className="h-8 text-xs font-semibold"
          >
            <XCircle className="h-3.5 w-3.5 mr-1.5" />
            Reject Selected ({selectedIds.length})
          </Button>
        </div>
      </div>

      {/* Pending Table */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-10 text-center">
                <input
                  type="checkbox"
                  checked={
                    pendingRequests.length > 0 &&
                    selectedIds.length === pendingRequests.length
                  }
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-4 w-4 rounded text-primary"
                />
              </TableHead>
              <TableHead className="text-xs font-semibold">Employee</TableHead>
              <TableHead className="text-xs font-semibold">Leave Type</TableHead>
              <TableHead className="text-xs font-semibold">Applied Dates</TableHead>
              <TableHead className="text-xs font-semibold text-center">Days</TableHead>
              <TableHead className="text-xs font-semibold">Reason</TableHead>
              <TableHead className="text-xs font-semibold">Approval Level</TableHead>
              <TableHead className="text-xs font-semibold text-right">Quick Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-xs text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    Loading approval queue...
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isLoading && pendingRequests.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500/60" />
                  All caught up! There are no pending leave requests awaiting approval.
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              pendingRequests.map((req) => {
                const isSelected = selectedIds.includes(req.id);
                const isHalf = req.duration === 'HALF_DAY';
                const sessionText =
                  req.halfDaySession === 'FIRST_HALF'
                    ? 'First Half (Morning)'
                    : req.halfDaySession === 'SECOND_HALF'
                    ? 'Second Half (Afternoon)'
                    : '';

                const dateDisplay = formatDateDisplay(req.startDate, req.endDate);

                return (
                  <TableRow
                    key={req.id}
                    className={`hover:bg-muted/30 ${isSelected ? 'bg-primary/5' : ''}`}
                  >
                    <TableCell className="text-center py-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(req.id)}
                        className="h-4 w-4 rounded text-primary"
                      />
                    </TableCell>

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
                      {isHalf && (
                        <div className="text-[10px] text-amber-700 dark:text-amber-300 font-medium mt-0.5">
                          Half Day • {sessionText}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="py-2.5 text-xs font-medium">
                      {dateDisplay}
                    </TableCell>

                    <TableCell className="py-2.5 text-center">
                      <span className="font-mono font-bold text-xs bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-300/50">
                        {req.totalDays}
                      </span>
                    </TableCell>

                    <TableCell className="py-2.5 text-xs text-muted-foreground max-w-xs truncate">
                      {req.reason || 'No comment provided'}
                    </TableCell>

                    <TableCell className="py-2.5">
                      <div className="text-xs font-semibold text-foreground">
                        {req.currentApproverRole || 'Reporting Manager'}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Level {req.approvalLevel || 1}</div>
                    </TableCell>

                    <TableCell className="py-2.5 text-right space-x-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-300"
                        onClick={() => {
                          setApproveTarget(req);
                          setApproveComment('Approved. Please complete handover before leave.');
                        }}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Approve
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-xs font-semibold text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                        onClick={() => {
                          setRejectTarget(req);
                          setRejectReason('Production manpower shortage. Please choose another date.');
                        }}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          1. SINGLE APPROVE POPUP (Keka Standard)
          ───────────────────────────────────────────────────────────── */}
      {approveTarget && (
        <Dialog open={!!approveTarget} onOpenChange={(open) => { if (!open) setApproveTarget(null); }}>
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
                disabled={singleActionMutation.isPending}
                onClick={confirmSingleApprove}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {singleActionMutation.isPending ? 'Approving...' : 'Confirm Approval'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. SINGLE REJECT POPUP (Keka Standard)
          ───────────────────────────────────────────────────────────── */}
      {rejectTarget && (
        <Dialog open={!!rejectTarget} onOpenChange={(open) => { if (!open) setRejectTarget(null); }}>
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
                disabled={singleActionMutation.isPending}
                onClick={confirmSingleReject}
                className="font-semibold"
              >
                {singleActionMutation.isPending ? 'Rejecting...' : 'Confirm Reject'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. BULK ACTION CONFIRMATION DIALOG
          ───────────────────────────────────────────────────────────── */}
      {bulkModalOpen && bulkAction && (
        <Dialog open={bulkModalOpen} onOpenChange={setBulkModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {bulkAction === 'APPROVED'
                  ? `Approve ${selectedIds.length} Selected Requests`
                  : `Reject ${selectedIds.length} Selected Requests`}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                This action will update the status of all {selectedIds.length} selected employee leave applications.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Approver Remarks / Note (Optional)</Label>
                <Input
                  placeholder="e.g. Approved during departmental review"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <DialogFooter>
              <Button size="sm" variant="outline" onClick={() => setBulkModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant={bulkAction === 'APPROVED' ? 'default' : 'destructive'}
                disabled={bulkMutation.isPending}
                onClick={confirmBulkAction}
                className={bulkAction === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              >
                {bulkMutation.isPending ? 'Processing...' : `Confirm Bulk ${bulkAction}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
