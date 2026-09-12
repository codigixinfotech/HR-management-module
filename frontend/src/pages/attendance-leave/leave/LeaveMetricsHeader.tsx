import { Clock, Calendar, CheckCircle2, AlertCircle, Plus, Settings2 } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';

interface LeaveMetricsHeaderProps {
  totalLeaveTypes: number;
  pendingRequestsCount: number;
  approvedCount: number;
  onLeaveTodayCount: number;
  onApplyLeaveClick: () => void;
  onConfigurePolicyClick: () => void;
}

export function LeaveMetricsHeader({
  totalLeaveTypes,
  pendingRequestsCount,
  approvedCount,
  onLeaveTodayCount,
  onApplyLeaveClick,
  onConfigurePolicyClick,
}: LeaveMetricsHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Top Controls Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/80 bg-card shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-foreground">
              Enterprise Leave Engine
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
              Keka Architecture Standard
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Accrual automation, sandwich calculations, half-day sessions & multi-tier approval chains
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={onConfigurePolicyClick}
            className="h-8 text-xs font-semibold"
          >
            <Settings2 className="h-3.5 w-3.5 mr-1.5" />
            + Configure Policy
          </Button>
          <Button
            size="sm"
            onClick={onApplyLeaveClick}
            className="h-8 text-xs font-semibold shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Apply Leave
          </Button>
        </div>
      </div>

      {/* 4 Stat Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Calendar}
          label="Configured Leave Types"
          value={`${totalLeaveTypes} Types`}
          hint="CL, SL, EL, ML, LOP, CO"
          accent="primary"
        />
        <StatCard
          icon={AlertCircle}
          label="Pending Review"
          value={`${pendingRequestsCount} Requests`}
          hint="Requires Approver Action"
          accent="warning"
        />
        <StatCard
          icon={CheckCircle2}
          label="Approved This Month"
          value={`${approvedCount} Approved`}
          hint="Synced to Attendance Muster"
          accent="success"
        />
        <StatCard
          icon={Clock}
          label="On Leave Today"
          value={`${onLeaveTodayCount} Staff`}
          hint="Roster Flagged as LV"
          accent="info"
        />
      </div>
    </div>
  );
}
