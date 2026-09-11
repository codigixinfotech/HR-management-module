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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

  // Extract unique leave types from requests for filter dropdown
  const uniqueTypes = useMemo(() => {
    const map = new Map<string, string>();
    requests.forEach((r) => {
      if (r.leaveTypeId && r.leaveType) {
        map.set(r.leaveTypeId, r.leaveType.name || r.leaveType.code || 'Leave');
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [requests]);

  // Filter requests
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (typeFilter !== 'ALL' && r.leaveTypeId !== typeFilter) return false;
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
  }, [requests, statusFilter, typeFilter, searchQuery]);

  return (
    <div className="space-y-4 font-sans">
      {/* ─────────────────────────────────────────────────────────────
          1. STANDARD ERP FILTER TOOLBAR
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3.5 rounded-xl border border-border/80 bg-card shadow-2xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by ID, type, reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs bg-background"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses ({requests.length})</option>
            <option value="PENDING">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Withdrawn / Cancelled</option>
          </select>

          {/* Leave Type Filter */}
          {uniqueTypes.length > 0 && (
            <select
              className="h-8 rounded-md border border-input bg-background px-2.5 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">All Leave Types</option>
              {uniqueTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}

          <Button
            size="sm"
            onClick={onApplyLeaveClick}
            className="h-8 text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Apply Leave
          </Button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. REQUESTS DATA TABLE
          ───────────────────────────────────────────────────────────── */}
      <Card className="rounded-xl border border-border/80 bg-card shadow-2xs overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground space-y-3">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <div className="font-semibold text-foreground text-sm">No Leave Requests Found</div>
            <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
              {statusFilter !== 'ALL' || typeFilter !== 'ALL' || searchQuery
                ? 'No applications match your active search filters.'
                : "You haven't submitted any leave requests yet."}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={onApplyLeaveClick}
              className="text-xs mt-2"
            >
              Apply for Leave Now
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-bold tracking-wider border-b border-border/60">
                <tr>
                  <th className="py-3 px-4">Request ID</th>
                  <th className="py-3 px-4">Leave Type</th>
                  <th className="py-3 px-3">Date Range</th>
                  <th className="py-3 px-3 text-center">Days</th>
                  <th className="py-3 px-3">Applied On</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3">Current Approver</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredRequests.map((r) => {
                  const code = r.leaveType?.code || 'LV';
                  const isPending = r.status === 'PENDING';
                  const isApproved = r.status === 'APPROVED';
                  const isFuture = new Date(r.startDate) > new Date();
                  const canCancel = (isPending || (isApproved && isFuture)) && r.status !== 'CANCELLED';

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedRequest(r)}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-[11px] text-foreground">
                        #{r.id.slice(-8).toUpperCase()}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-foreground">
                            {r.leaveType?.name || 'Leave'}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
                            {code}
                          </span>
                        </div>
                        {r.reason && (
                          <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                            {r.reason}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 font-medium text-foreground">
                        {new Date(r.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        {r.startDate !== r.endDate && (
                          <> – {new Date(r.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</>
                        )}
                        <span className="text-[10px] text-muted-foreground block">
                          {r.duration === 'HALF_DAY' ? 'Half Day' : 'Full Day'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-foreground font-mono">
                        {r.totalDays} {r.totalDays === 1 ? 'd' : 'd'}
                      </td>

                      <td className="py-3 px-3 text-muted-foreground text-[11px]">
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
                              : 'bg-muted text-muted-foreground border-border'
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

                      <td className="py-3 px-3 text-muted-foreground text-[11px]">
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
                          className="h-7 px-2 text-muted-foreground hover:text-foreground text-xs"
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
                            className="h-7 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs"
                          >
                            Withdraw
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
      </Card>

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
