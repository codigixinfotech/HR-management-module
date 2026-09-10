import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Clock,
  Users,
  UserCheck,
  RefreshCw,
  Layers,
  Calendar,
  CalendarDays,
  GitPullRequest,
  ArrowLeftRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useShiftRosterStore } from './shift-roster/shiftRosterStore';
import { useWeeklyOffPolicyStore } from './shift-roster/weeklyOffPolicyStore';

// Subpage Tabs
import { ShiftMasterTab } from './shift-roster/ShiftMasterTab';
import { WeeklyOffPolicyTab } from './shift-roster/WeeklyOffPolicyTab';
import { ShiftAssignmentsTab } from './shift-roster/ShiftAssignmentsTab';
import { RosterPlannerTab } from './shift-roster/RosterPlannerTab';
import { ShiftRotationTab } from './shift-roster/ShiftRotationTab';
import { ShiftChangesTab } from './shift-roster/ShiftChangesTab';
import { ShiftSwapsTab } from './shift-roster/ShiftSwapsTab';
import { ShiftApprovalsTab } from './shift-roster/ShiftApprovalsTab';

type RosterSubTab =
  | 'master'
  | 'weekly-off'
  | 'assignments'
  | 'roster'
  | 'rotation'
  | 'changes'
  | 'swaps'
  | 'approvals';

interface ShiftRosterTabProps {
  companyId?: string;
}

export function ShiftRosterTab({ companyId }: ShiftRosterTabProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSubTab = (searchParams.get('subtab') as RosterSubTab) || 'master';
  const [activeSubTab, setActiveSubTab] = useState<RosterSubTab>(initialSubTab);

  const {
    shifts,
    assignments,
    rotations,
    rosterEmployees,
    pendingApprovalsCount,
    fetchData,
  } = useShiftRosterStore();

  const { policies: weeklyOffPolicies } = useWeeklyOffPolicyStore();

  useEffect(() => {
    fetchData(companyId);
  }, [companyId, fetchData]);

  const handleTabChange = (tab: RosterSubTab) => {
    setActiveSubTab(tab);
    setSearchParams((prev) => {
      prev.set('subtab', tab);
      return prev;
    });
  };

  // Compute telemetry metrics dynamically (distinct scheduled personnel without multi-tier duplication)
  const activeShiftCycles = shifts.filter((s) => s.status === 'Active').length;

  const totalStaffScheduled = useMemo(() => {
    // 1. If rosterEmployees has records, count distinct staff
    if (rosterEmployees && rosterEmployees.length > 0) {
      const distinctRoster = new Set(
        rosterEmployees.map((e) => e.employeeId || e.employeeCode).filter(Boolean)
      );
      if (distinctRoster.size > 0) return distinctRoster.size;
    }

    // 2. Count distinct personnel across assignments (avoiding double-counting employee vs department tiers)
    const distinctEmpIds = new Set<string>();
    assignments.forEach((a) => {
      if (a.employeeId) distinctEmpIds.add(a.employeeId);
      else if (a.employeeCode) distinctEmpIds.add(a.employeeCode);
    });
    if (distinctEmpIds.size > 0) return distinctEmpIds.size;

    // 3. Fallback to active rotation covered headcount
    if (rotations.length > 0 && rotations[0].headcountCovered) {
      return rotations[0].headcountCovered;
    }

    return 1;
  }, [rosterEmployees, assignments, rotations]);

  const uniqueSupervisors = rotations.filter((r) => r.status === 'Active' || (r.status as string) === 'Scheduled').length;
  const rotationPattern = rotations.length > 0 ? rotations[0].frequency : 'None';

  return (
    <div className="space-y-6">
      {/* ── 1. Top Telemetry Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Active Shifts */}
        <Card className="shadow-2xs border-border/80 hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Active Shifts</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">{activeShiftCycles} Cycles</p>
              <p className="text-[10px] text-primary font-semibold mt-1">
                {activeShiftCycles > 0 ? `${activeShiftCycles} patterns configured` : 'No shifts configured'}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Staff Scheduled */}
        <Card className="shadow-2xs border-border/80 hover:border-emerald-500/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Staff Scheduled</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">{totalStaffScheduled} Personnel</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">
                {totalStaffScheduled > 0 ? 'Assigned headcount coverage' : 'No personnel scheduled'}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Supervisors */}
        <Card className="shadow-2xs border-border/80 hover:border-violet-500/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Roster Supervisors</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">{uniqueSupervisors} Leads</p>
              <p className="text-[10px] text-violet-600 font-semibold mt-1">
                {uniqueSupervisors > 0 ? 'Active rotation leads' : 'No active rotation leads'}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 shrink-0">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Rotation Pattern */}
        <Card className="shadow-2xs border-border/80 hover:border-amber-500/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Rotation Pattern</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">{rotationPattern}</p>
              <p className="text-[10px] text-amber-600 font-semibold mt-1">
                {rotations.length > 0 ? (rotations[0].nextRotationDate ? `Next: ${rotations[0].nextRotationDate}` : 'Rule configured') : 'No rotation active'}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
              <RefreshCw className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Tab Navigation Bar (All 7 Lifecycle Tabs) ── */}
      <div className="border-b border-border/70 overflow-x-auto scrollbar-none">
        <div className="flex items-center space-x-1 min-w-max pb-1">
          {/* Shift Master */}
          <button
            type="button"
            onClick={() => handleTabChange('master')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeSubTab === 'master'
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            Shift Master
            <Badge variant="secondary" className="ml-0.5 h-4 px-1.5 text-[9px] font-mono">
              {shifts.length}
            </Badge>
          </button>

          {/* Weekly Off Policy */}
          <button
            type="button"
            onClick={() => handleTabChange('weekly-off')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeSubTab === 'weekly-off'
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Weekly Off
            <Badge variant="secondary" className="ml-0.5 h-4 px-1.5 text-[9px] font-mono">
              {weeklyOffPolicies.length}
            </Badge>
          </button>

          {/* Assignments */}
          <button
            type="button"
            onClick={() => handleTabChange('assignments')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeSubTab === 'assignments'
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Assignments
            <Badge variant="secondary" className="ml-0.5 h-4 px-1.5 text-[9px] font-mono">
              {assignments.length}
            </Badge>
          </button>

          {/* Roster */}
          <button
            type="button"
            onClick={() => handleTabChange('roster')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeSubTab === 'roster'
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            Roster Planner
          </button>

          {/* Rotation */}
          <button
            type="button"
            onClick={() => handleTabChange('rotation')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeSubTab === 'rotation'
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Rotation
            <Badge variant="secondary" className="ml-0.5 h-4 px-1.5 text-[9px] font-mono">
              {rotations.length}
            </Badge>
          </button>

          {/* Shift Changes */}
          <button
            type="button"
            onClick={() => handleTabChange('changes')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeSubTab === 'changes'
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <GitPullRequest className="h-3.5 w-3.5" />
            Shift Changes
          </button>

          {/* Shift Swaps */}
          <button
            type="button"
            onClick={() => handleTabChange('swaps')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeSubTab === 'swaps'
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
            Shift Swaps
          </button>

          {/* Approvals */}
          <button
            type="button"
            onClick={() => handleTabChange('approvals')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeSubTab === 'approvals'
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Approvals
            {pendingApprovalsCount > 0 && (
              <Badge className="ml-0.5 h-4 px-1.5 text-[9px] bg-amber-500 hover:bg-amber-600 text-white font-bold">
                {pendingApprovalsCount}
              </Badge>
            )}
          </button>
        </div>
      </div>

      {/* ── 3. Active Subpage Tab Content ── */}
      <div>
        {activeSubTab === 'master' && <ShiftMasterTab />}
        {activeSubTab === 'weekly-off' && <WeeklyOffPolicyTab />}
        {activeSubTab === 'assignments' && <ShiftAssignmentsTab />}
        {activeSubTab === 'roster' && <RosterPlannerTab />}
        {activeSubTab === 'rotation' && <ShiftRotationTab />}
        {activeSubTab === 'changes' && <ShiftChangesTab />}
        {activeSubTab === 'swaps' && <ShiftSwapsTab />}
        {activeSubTab === 'approvals' && <ShiftApprovalsTab />}
      </div>
    </div>
  );
}
export default ShiftRosterTab;
