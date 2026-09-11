import {
  FileSpreadsheet,
  PlusCircle,
  ShieldCheck,
  Palmtree,
  CheckCircle2,
  Clock,
  Info,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import type { LeaveBalance, LeaveType } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

  return (
    <div className="space-y-4 font-sans">
      {/* ─────────────────────────────────────────────────────────────
          1. LEAVE CATEGORY QUOTA CARDS GRID
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {balances.map((b) => {
          const code = b.leaveType?.code || 'LV';
          const name = b.leaveType?.name || code;
          const defaultQuota = b.leaveType?.annualQuota || 12;
          const allocated = b.allocated > 0 ? b.allocated : defaultQuota;
          const used = b.used || 0;
          const pending = (b as any).pending || 0;
          const available = Math.max(0, allocated - used - pending);
          const utilization =
            allocated > 0 ? Math.min(100, Math.round(((used + pending) / allocated) * 100)) : 0;
          const isPaid = b.leaveType?.isPaid !== false;

          return (
            <Card
              key={b.id || `${b.employeeId}_${b.leaveTypeId}`}
              className="rounded-xl border border-border/80 bg-card shadow-2xs hover:border-primary/40 transition-all"
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-foreground">{name}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
                        {code}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {isPaid ? 'Paid Leave' : 'Unpaid (Loss of Pay)'}
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold ${
                      available > 0
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    {available}d Free
                  </Badge>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <div className="text-2xl font-black text-foreground font-mono">
                      {available}
                    </div>
                    <span className="text-[10px] text-emerald-600 font-semibold">
                      Available Balance
                    </span>
                  </div>
                  <div className="text-right text-xs">
                    <span className="font-mono text-muted-foreground">
                      {used} used / {allocated} total
                    </span>
                    {pending > 0 && (
                      <span className="text-[10px] text-amber-600 font-medium block">
                        +{pending}d pending review
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{utilization}% consumed</span>
                    <span>{allocated - used - pending}d left</span>
                  </div>
                  <Progress value={utilization} className="h-1.5 rounded-full bg-muted" />
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onApplyForType(b.leaveTypeId)}
                  className="w-full h-7 text-xs font-semibold gap-1.5 cursor-pointer hover:bg-primary/5 hover:text-primary hover:border-primary/40"
                >
                  <PlusCircle className="h-3 w-3" />
                  Apply {code}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. PERSONAL LEAVE BALANCE LEDGER TABLE
          ───────────────────────────────────────────────────────────── */}
      <Card className="rounded-xl border border-border/80 bg-card shadow-2xs overflow-hidden">
        <CardHeader className="p-4 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-bold">Personal Leave Balance Ledger</CardTitle>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Detailed breakdown of annual quotas, consumption rate, pending reviews, and available days for {currentYear}.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-bold tracking-wider border-b border-border/60">
              <tr>
                <th className="py-3 px-4">Leave Type</th>
                <th className="py-3 px-3 text-center">Allocated Quota</th>
                <th className="py-3 px-3 text-center">Approved / Used</th>
                <th className="py-3 px-3 text-center">Pending Review</th>
                <th className="py-3 px-3 text-center">Available Balance</th>
                <th className="py-3 px-4 w-48">Utilization Meter</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {balances.map((b) => {
                const code = b.leaveType?.code || 'LV';
                const defaultQuota = b.leaveType?.annualQuota || 12;
                const allocated = b.allocated > 0 ? b.allocated : defaultQuota;
                const used = b.used || 0;
                const pending = (b as any).pending || 0;
                const available = Math.max(0, allocated - used - pending);
                const utilization =
                  allocated > 0 ? Math.min(100, Math.round(((used + pending) / allocated) * 100)) : 0;
                const isPaid = b.leaveType?.isPaid !== false;

                return (
                  <tr key={b.id || `${b.employeeId}_${b.leaveTypeId}`} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0">
                          {code}
                        </div>
                        <div>
                          <div className="font-bold text-foreground text-xs">
                            {b.leaveType?.name || code}
                          </div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
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

                    <td className="py-3 px-3 text-center font-bold text-foreground font-mono">
                      {allocated} d
                    </td>

                    <td className="py-3 px-3 text-center font-semibold text-foreground font-mono">
                      {used} d
                    </td>

                    <td className="py-3 px-3 text-center">
                      {pending > 0 ? (
                        <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-mono text-[11px]">
                          {pending} d
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40 font-mono">0</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="font-black text-xs text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 font-mono">
                        {available} Days
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>{used} of {allocated}d used</span>
                          <span className="font-bold text-foreground">{utilization}%</span>
                        </div>
                        <Progress value={utilization} className="h-1.5 rounded-full bg-muted" />
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onApplyForType(b.leaveTypeId)}
                        className="h-7 px-2.5 text-xs font-semibold gap-1 cursor-pointer hover:bg-primary/5 hover:text-primary hover:border-primary/40"
                      >
                        <PlusCircle className="h-3 w-3" />
                        Apply
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ─────────────────────────────────────────────────────────────
          3. LEAVE POLICY RULES & STATUTORY GUIDELINES
          ───────────────────────────────────────────────────────────── */}
      <Card className="rounded-xl border border-border/80 bg-card shadow-2xs">
        <CardHeader className="p-4 pb-2 border-b border-border/40">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <CardTitle className="text-xs font-bold">Leave Entitlement & Policy Guidelines</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-muted-foreground">
            <div className="p-3 rounded-lg bg-muted/30 border border-border/60 space-y-1">
              <div className="font-bold text-foreground">Casual Leave (CL)</div>
              <p className="text-[11px] leading-relaxed">
                Allocated at the beginning of the calendar year. Intended for urgent personal matters. Cannot exceed 3 consecutive days.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-muted/30 border border-border/60 space-y-1">
              <div className="font-bold text-foreground">Sick / Medical Leave (SL)</div>
              <p className="text-[11px] leading-relaxed">
                Intended for illness and medical recuperation. A registered medical practitioner certificate is required for leaves exceeding 2 days.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-muted/30 border border-border/60 space-y-1">
              <div className="font-bold text-foreground">Earned / Privilege Leave (EL)</div>
              <p className="text-[11px] leading-relaxed">
                Accrued proportionally during service. Unused EL can be carried forward up to the statutory limit as per company HR policy.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
