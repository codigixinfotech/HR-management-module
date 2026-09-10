import { useState } from 'react';
import {
  FileSpreadsheet,
  PlusCircle,
  HelpCircle,
  TrendingUp,
  Info,
  ShieldCheck,
  Palmtree,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import type { LeaveBalance, LeaveType } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface MyLeaveBalanceTabProps {
  balances: LeaveBalance[];
  leaveTypes: LeaveType[];
  onApplyForType: (typeId: string) => void;
}

export function MyLeaveBalanceTab({
  balances,
  leaveTypes,
  onApplyForType,
}: MyLeaveBalanceTabProps) {
  const currentYear = new Date().getFullYear();

  // Compute totals
  const totals = balances.reduce(
    (acc, b) => {
      const defaultQuota = b.leaveType?.annualQuota || 12;
      const allocated = b.allocated > 0 ? b.allocated : defaultQuota;
      const used = b.used || 0;
      const pending = (b as any).pending || 0;
      const available = Math.max(0, allocated - used - pending);
      return {
        allocated: acc.allocated + allocated,
        used: acc.used + used,
        pending: acc.pending + pending,
        available: acc.available + available,
      };
    },
    { allocated: 0, used: 0, pending: 0, available: 0 }
  );

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Header & Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Allocated
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {totals.allocated} <span className="text-xs font-medium text-slate-400">Days</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            Calendar Year {currentYear}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/40 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            Total Available
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-1">
            {totals.available} <span className="text-xs font-medium text-emerald-600">Days</span>
          </div>
          <div className="text-[11px] text-emerald-700 mt-1 font-medium">
            Ready to apply
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Leave Taken (Used)
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {totals.used} <span className="text-xs font-medium text-slate-400">Days</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            Approved & consumed
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-amber-200/80 bg-amber-50/40 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
            Pending Approval
          </div>
          <div className="text-2xl font-black text-amber-900 mt-1">
            {totals.pending} <span className="text-xs font-medium text-amber-600">Days</span>
          </div>
          <div className="text-[11px] text-amber-700 mt-1 font-medium">
            Awaiting manager signoff
          </div>
        </div>
      </div>

      {/* 2. My Leave Balance Register Table */}
      <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
              <span>Personal Leave Balance Ledger</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Breakdown of annual entitlements, utilization rates, and available balance for {currentYear}.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Leave Type</th>
                <th className="py-3 px-3 text-center">Allocated</th>
                <th className="py-3 px-3 text-center">Used</th>
                <th className="py-3 px-3 text-center">Pending</th>
                <th className="py-3 px-3 text-center">Available</th>
                <th className="py-3 px-4 w-52">Utilization</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {balances.map((b) => {
                const code = b.leaveType?.code || 'LV';
                const defaultQuota = b.leaveType?.annualQuota || 12;
                const allocated = b.allocated > 0 ? b.allocated : defaultQuota;
                const used = b.used || 0;
                const pending = (b as any).pending || 0;
                const available = Math.max(0, allocated - used - pending);
                const utilization =
                  allocated > 0
                    ? Math.min(100, Math.round(((used + pending) / allocated) * 100))
                    : 0;

                const isPaid = b.leaveType?.isPaid !== false;

                return (
                  <tr
                    key={b.id || `${b.employeeId}_${b.leaveTypeId}`}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {code}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs">
                            {b.leaveType?.name || code}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isPaid ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                            />
                            <span>{isPaid ? 'Paid Leave' : 'Unpaid (Loss of Pay)'}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-slate-900">
                      {allocated}
                    </td>

                    <td className="py-3 px-3 text-center font-semibold text-slate-700">
                      {used}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {pending > 0 ? (
                        <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          {pending}
                        </span>
                      ) : (
                        <span className="text-slate-300">0</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="font-black text-sm text-emerald-700 bg-emerald-50/80 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                        {available}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                          <span>{used} of {allocated} used</span>
                          <span className="font-bold text-slate-700">{utilization}%</span>
                        </div>
                        <Progress
                          value={utilization}
                          className="h-2 rounded-full bg-slate-100"
                        />
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onApplyForType(b.leaveTypeId)}
                        className="h-7 px-2.5 text-xs rounded-xl border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold cursor-pointer"
                      >
                        Apply
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Leave Policy Rules & Guidelines for Employee */}
      <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-3">
        <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Leave Entitlement & Policy Guidelines</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 space-y-1">
            <div className="font-bold text-slate-800">Casual Leave (CL)</div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Allocated at beginning of year. Intended for urgent personal matters. Cannot be combined with continuous leave exceeding 3 days.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 space-y-1">
            <div className="font-bold text-slate-800">Sick / Medical Leave (SL)</div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Intended for health recuperation. A medical practitioner certificate is required for medical leaves exceeding 2 consecutive days.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 space-y-1">
            <div className="font-bold text-slate-800">Earned / Privilege Leave (EL)</div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Accrued throughout service. Unused EL can be carried forward up to statutory limit as per company policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
