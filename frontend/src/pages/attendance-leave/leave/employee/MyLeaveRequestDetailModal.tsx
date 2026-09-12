import { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  UserCheck,
  ShieldCheck,
  Building,
  ArrowRight,
  TrendingDown,
  Layers,
  ChevronRight,
  X,
  ExternalLink,
} from 'lucide-react';
import type { LeaveRequest } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface MyLeaveRequestDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: LeaveRequest | null;
  onCancelRequest?: (id: string) => void;
  isCancelling?: boolean;
}

export function MyLeaveRequestDetailModal({
  open,
  onOpenChange,
  request,
  onCancelRequest,
  isCancelling = false,
}: MyLeaveRequestDetailModalProps) {
  const [cancelConfirm, setCancelConfirm] = useState(false);

  if (!request) return null;

  const code = request.leaveType?.code || 'LV';
  const isPending = request.status === 'PENDING';
  const isApproved = request.status === 'APPROVED';
  const isRejected = request.status === 'REJECTED';
  const isCancelled = request.status === 'CANCELLED';

  const startDateStr = new Date(request.startDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const endDateStr = new Date(request.endDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const isFuture = new Date(request.startDate) > new Date();
  const canCancel = (isPending || (isApproved && isFuture)) && !isCancelled;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl rounded-2xl bg-white border-slate-200 p-0 overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-indigo-50/80 via-slate-50 to-white border-b border-slate-100">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>Leave Request Details</span>
                    <span className="font-mono text-xs text-slate-400 font-normal">
                      #{request.id.slice(-8).toUpperCase()}
                    </span>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Applied on {new Date(request.createdAt).toLocaleDateString()}
                  </DialogDescription>
                </div>
              </div>

              {/* Status Badge */}
              <div>
                {isPending && (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-bold text-xs px-2.5 py-0.5">
                    ⏳ Pending Approval
                  </Badge>
                )}
                {isApproved && (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-xs px-2.5 py-0.5">
                    ✓ Approved
                  </Badge>
                )}
                {isRejected && (
                  <Badge className="bg-rose-100 text-rose-800 border-rose-300 font-bold text-xs px-2.5 py-0.5">
                    ✕ Rejected
                  </Badge>
                )}
                {isCancelled && (
                  <Badge className="bg-slate-100 text-slate-700 border-slate-300 font-bold text-xs px-2.5 py-0.5">
                    Cancelled / Withdrawn
                  </Badge>
                )}
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* 1. Request Summary Card */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Leave Type</div>
              <div className="font-bold text-slate-900 text-sm mt-0.5">
                {request.leaveType?.name || 'Leave'}
              </div>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200 mt-1 inline-block">
                {code}
              </span>
            </div>

            <div>
              <div className="text-[11px] text-slate-400 font-medium">Duration</div>
              <div className="font-bold text-slate-900 text-sm mt-0.5">
                {request.totalDays} {request.totalDays === 1 ? 'Day' : 'Days'}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                {request.duration === 'HALF_DAY' ? 'Half Day' : 'Full Day'}
              </span>
            </div>

            <div>
              <div className="text-[11px] text-slate-400 font-medium">Start Date</div>
              <div className="font-bold text-slate-900 text-sm mt-0.5">{startDateStr}</div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                {new Date(request.startDate).toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
            </div>

            <div>
              <div className="text-[11px] text-slate-400 font-medium">End Date</div>
              <div className="font-bold text-slate-900 text-sm mt-0.5">{endDateStr}</div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                {new Date(request.endDate).toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
            </div>
          </div>

          {/* 2. Reason & Attachment */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-700">Reason for Leave</div>
            <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 leading-relaxed italic">
              "{request.reason || 'No specific reason provided'}"
            </div>

            {request.attachmentUrl && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="font-medium text-slate-700 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-indigo-600" />
                  Supporting Attachment
                </span>
                <a
                  href={request.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:text-indigo-700 font-semibold text-xs flex items-center gap-1"
                >
                  <span>View File</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>

          {/* 3. Balance Impact Breakdown */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5 text-indigo-600" />
              <span>Leave Balance Impact</span>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <div className="text-[10px] text-slate-400 font-medium uppercase">Requested Days</div>
                <div className="text-base font-black text-slate-900 mt-0.5">
                  {request.totalDays}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-amber-50/70 border border-amber-200">
                <div className="text-[10px] text-amber-700 font-medium uppercase">Deduction Status</div>
                <div className="text-xs font-bold text-amber-800 mt-1">
                  {isApproved ? 'Deducted' : isPending ? 'Pending Approval' : 'No Deduction'}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-200">
                <div className="text-[10px] text-emerald-700 font-medium uppercase">Payroll Impact</div>
                <div className="text-xs font-bold text-emerald-800 mt-1">
                  {request.leaveType?.isPaid !== false ? 'Paid Leave' : 'Unpaid (LOP)'}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Approval Timeline */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-700">Approval Workflow Timeline</div>
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-3">
              {/* Step 1: Submission */}
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  ✓
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-800">Application Submitted</div>
                  <div className="text-[11px] text-slate-400">
                    {new Date(request.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Step 2: Manager Review */}
              <div className="flex items-start gap-3">
                <div
                  className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                    isApproved
                      ? 'bg-emerald-100 text-emerald-700'
                      : isRejected
                      ? 'bg-rose-100 text-rose-700'
                      : isCancelled
                      ? 'bg-slate-100 text-slate-500'
                      : 'bg-amber-100 text-amber-700 animate-pulse'
                  }`}
                >
                  {isApproved ? '✓' : isRejected ? '✕' : isCancelled ? '–' : '⏳'}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>
                      {request.currentApproverRole || 'Reporting Manager Approval'}
                    </span>
                    {request.decidedAt && (
                      <span className="text-[10px] text-slate-400 font-normal">
                        {new Date(request.decidedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {isApproved
                      ? `Approved by ${request.approverId ? 'Manager' : 'System'}`
                      : isRejected
                      ? 'Rejected'
                      : isCancelled
                      ? 'Cancelled by employee'
                      : 'Awaiting manager review and signoff'}
                  </div>

                  {request.approverRemarks && (
                    <div className="mt-1.5 p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600">
                      <span className="font-semibold text-slate-700">Remarks: </span>
                      {request.approverRemarks}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 5. Attendance & Roster Impact Indicator */}
          <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-200/70 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-indigo-600" />
              <div>
                <span className="font-bold text-indigo-950">Roster & Attendance Sync: </span>
                <span className="text-indigo-800">
                  {isApproved
                    ? 'Roster status set to LEAVE, Attendance marked ON_LEAVE'
                    : isPending
                    ? 'Standard Shift Active until approval'
                    : 'Standard Shift Active'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div>
            {canCancel && !cancelConfirm && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCancelConfirm(true)}
                className="text-rose-600 border-rose-200 hover:bg-rose-50 text-xs rounded-xl"
              >
                Cancel / Withdraw Request
              </Button>
            )}

            {cancelConfirm && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-600 font-medium">Are you sure?</span>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  disabled={isCancelling}
                  onClick={() => {
                    onCancelRequest?.(request.id);
                    setCancelConfirm(false);
                  }}
                  className="text-xs rounded-xl"
                >
                  {isCancelling ? 'Cancelling...' : 'Yes, Cancel Request'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setCancelConfirm(false)}
                  className="text-xs rounded-xl"
                >
                  No
                </Button>
              </div>
            )}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
