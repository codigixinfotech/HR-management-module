import { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Search,
  Filter,
  Eye,
  Calendar,
  Layers,
  Sparkles,
  Palmtree,
  CheckCircle2,
  XCircle,
  X,
  History,
} from 'lucide-react';
import type { LeaveRequest, LeaveType } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MyLeaveRequestDetailModal } from './MyLeaveRequestDetailModal';

interface MyLeaveHistoryTabProps {
  requests: LeaveRequest[];
  leaveTypes: LeaveType[];
}

export function MyLeaveHistoryTab({ requests, leaveTypes }: MyLeaveHistoryTabProps) {
  const [yearFilter, setYearFilter] = useState('2026');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

  // Filter history
  const filteredHistory = useMemo(() => {
    return requests.filter((r) => {
      if (yearFilter !== 'ALL') {
        const reqYear = new Date(r.startDate).getFullYear().toString();
        if (reqYear !== yearFilter) return false;
      }
      if (typeFilter !== 'ALL' && r.leaveTypeId !== typeFilter) return false;
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const typeName = (r.leaveType?.name || '').toLowerCase();
        const reason = (r.reason || '').toLowerCase();
        if (!typeName.includes(q) && !reason.includes(q)) return false;
      }
      return true;
    });
  }, [requests, yearFilter, typeFilter, statusFilter, searchQuery]);

  return (
    <div className="space-y-4 font-sans">
      {/* 1. Header Toolbar & Historical Filters */}
      <div className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-3">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <History className="h-4 w-4 text-indigo-600" />
            <span>Personal Leave History & Records</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit trail of all your approved, rejected, and cancelled time-off requests.
          </p>
        </div>

        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3">
          {/* Year Filter */}
          <div className="w-36">
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="h-8 text-xs bg-slate-50/60 border-slate-200">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">All Years</SelectItem>
                <SelectItem value="2026" className="text-xs">2026</SelectItem>
                <SelectItem value="2025" className="text-xs">2025</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Type Filter */}
          <div className="w-48">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 text-xs bg-slate-50/60 border-slate-200">
                <SelectValue placeholder="Leave Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">All Leave Types</SelectItem>
                {leaveTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id} className="text-xs">
                    {t.name} ({t.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="w-36">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 text-xs bg-slate-50/60 border-slate-200">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">All Statuses</SelectItem>
                <SelectItem value="APPROVED" className="text-xs">Approved</SelectItem>
                <SelectItem value="REJECTED" className="text-xs">Rejected</SelectItem>
                <SelectItem value="CANCELLED" className="text-xs">Cancelled</SelectItem>
                <SelectItem value="PENDING" className="text-xs">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search history by reason or type..."
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

      {/* 2. History Table */}
      <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
        {filteredHistory.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <History className="h-10 w-10 mx-auto text-slate-300" />
            <div className="font-semibold text-slate-700">No Historical Records Found</div>
            <p className="text-[11px] text-slate-400">
              No leave records match the selected year and filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Leave Type</th>
                  <th className="py-3 px-3">From</th>
                  <th className="py-3 px-3">To</th>
                  <th className="py-3 px-3 text-center">Days</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3">Approved By</th>
                  <th className="py-3 px-3">Applied On</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.map((r) => {
                  const code = r.leaveType?.code || 'LV';
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                      onClick={() => setSelectedRequest(r)}
                    >
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
                        {new Date(r.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>

                      <td className="py-3 px-3 font-medium text-slate-700">
                        {new Date(r.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-slate-900">
                        {r.totalDays} {r.totalDays === 1 ? 'd' : 'd'}
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
                          {r.status}
                        </Badge>
                      </td>

                      <td className="py-3 px-3 text-slate-600 text-[11px]">
                        {r.status === 'APPROVED'
                          ? r.approverId ? 'Reporting Manager' : 'HR Admin'
                          : r.status === 'REJECTED'
                          ? 'Manager (Rejected)'
                          : '–'}
                      </td>

                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRequest(r);
                          }}
                          className="h-7 px-2 text-slate-600 hover:text-indigo-600 text-xs rounded-lg"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Details */}
      {selectedRequest && (
        <MyLeaveRequestDetailModal
          open={!!selectedRequest}
          onOpenChange={(open) => !open && setSelectedRequest(null)}
          request={selectedRequest}
        />
      )}
    </div>
  );
}
