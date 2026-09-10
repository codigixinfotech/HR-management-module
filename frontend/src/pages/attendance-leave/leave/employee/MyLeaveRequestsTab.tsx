import { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Trash2,
  X,
  PlusCircle,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import type { LeaveRequest } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MyLeaveRequestDetailModal } from './MyLeaveRequestDetailModal';

interface MyLeaveRequestsTabProps {
  requests: LeaveRequest[];
  onApplyLeaveClick: () => void;
  onCancelRequest: (id: string) => void;
  isCancelling?: boolean;
}

export function MyLeaveRequestsTab({
  requests,
  onApplyLeaveClick,
  onCancelRequest,
  isCancelling = false,
}: MyLeaveRequestsTabProps) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

  // Filter requests
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const typeName = (r.leaveType?.name || '').toLowerCase();
        const typeCode = (r.leaveType?.code || '').toLowerCase();
        const reason = (r.reason || '').toLowerCase();
        const id = r.id.toLowerCase();
        if (
          !typeName.includes(q) &&
          !typeCode.includes(q) &&
          !reason.includes(q) &&
          !id.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [requests, statusFilter, searchQuery]);

  return (
    <div className="space-y-4 font-sans">
      {/* 1. Header Toolbar & Filters */}
      <div className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-600" />
              <span>My Leave Applications</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Track status, review manager remarks, or withdraw pending and future requests.
            </p>
          </div>

          <Button
            size="sm"
            onClick={onApplyLeaveClick}
            className="h-8 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Apply Leave</span>
          </Button>
        </div>

        {/* Filter Pills & Search */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  statusFilter === s
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s === 'ALL'
                  ? 'All Requests'
                  : s === 'PENDING'
                  ? 'Pending'
                  : s === 'APPROVED'
                  ? 'Approved'
                  : s === 'REJECTED'
                  ? 'Rejected'
                  : 'Cancelled'}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search request or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs bg-slate-50/60 border-slate-200 rounded-xl"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Requests Table */}
      <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-3">
            <FileText className="h-10 w-10 mx-auto text-slate-300" />
            <div className="font-semibold text-slate-700 text-sm">No Leave Requests Found</div>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              {statusFilter !== 'ALL'
                ? `No leave applications with status "${statusFilter}".`
                : "You haven't submitted any leave requests yet."}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={onApplyLeaveClick}
              className="rounded-xl text-xs"
            >
              Apply for Leave Now
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Request ID</th>
                  <th className="py-3 px-4">Leave Type</th>
                  <th className="py-3 px-3">Date Range</th>
                  <th className="py-3 px-3 text-center">Days</th>
                  <th className="py-3 px-3">Applied On</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3">Approver</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((r) => {
                  const code = r.leaveType?.code || 'LV';
                  const isPending = r.status === 'PENDING';
                  const isApproved = r.status === 'APPROVED';
                  const isFuture = new Date(r.startDate) > new Date();
                  const canCancel = (isPending || (isApproved && isFuture)) && r.status !== 'CANCELLED';

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                      onClick={() => setSelectedRequest(r)}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-[11px] text-slate-700">
                        #{r.id.slice(-8).toUpperCase()}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">
                            {r.leaveType?.name || 'Leave'}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {code}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-medium text-slate-700">
                        {new Date(r.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        {r.startDate !== r.endDate && (
                          <> – {new Date(r.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</>
                        )}
                        <span className="text-[10px] text-slate-400 block">
                          {r.duration === 'HALF_DAY' ? 'Half Day' : 'Full Day'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-slate-900">
                        {r.totalDays} {r.totalDays === 1 ? 'd' : 'd'}
                      </td>

                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <Badge
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            r.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : r.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : r.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {r.status === 'PENDING'
                            ? '⏳ Pending'
                            : r.status === 'APPROVED'
                            ? '✓ Approved'
                            : r.status === 'REJECTED'
                            ? '✕ Rejected'
                            : 'Cancelled'}
                        </Badge>
                      </td>

                      <td className="py-3 px-3 text-slate-600 text-[11px]">
                        {r.currentApproverRole || 'Reporting Manager'}
                      </td>

                      <td
                        className="py-3 px-4 text-right space-x-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedRequest(r)}
                          className="h-7 px-2 text-slate-600 hover:text-indigo-600 text-xs rounded-lg"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View
                        </Button>

                        {canCancel && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isCancelling}
                            onClick={() => onCancelRequest(r.id)}
                            className="h-7 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs rounded-lg"
                          >
                            Cancel
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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
