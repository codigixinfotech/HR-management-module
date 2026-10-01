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
import { useWorkforceBranch } from '@/pages/workforce/WorkforceBranchContext';

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
  selectedBranch?: string;
  branches?: any[];
}

export function ShiftRosterTab({ companyId, selectedBranch, branches }: ShiftRosterTabProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSubTab = (searchParams.get('subtab') as RosterSubTab) || 'master';
  const [activeSubTab, setActiveSubTab] = useState<RosterSubTab>(initialSubTab);

  const {
    shifts,
    assignments,
    rotations,
    rosterEmployees,
    shiftChanges,
    shiftSwaps,
    batchApprovals,
    pendingApprovalsCount,
    fetchData,
  } = useShiftRosterStore();

  const { policies: weeklyOffPolicies, fetchPolicies } = useWeeklyOffPolicyStore();

  const workforceBranch = useWorkforceBranch();
  const effectiveBranch = selectedBranch || workforceBranch.selectedBranch || 'HEAD_OFFICE';
  const branchList = branches && branches.length > 0 ? branches : workforceBranch.branches;
  const matchBranch = workforceBranch.matchBranch;

  useEffect(() => {
    // When effectiveBranch is 'ALL', no branch filter is passed to backend.
    // For 'HEAD_OFFICE' or specific branch IDs, pass it directly.
    const apiBranchId = effectiveBranch === 'ALL' ? undefined : effectiveBranch;
    fetchData(companyId, apiBranchId);
    fetchPolicies(companyId, apiBranchId);
  }, [companyId, effectiveBranch, fetchData, fetchPolicies]);

  const handleTabChange = (tab: RosterSubTab) => {
    setActiveSubTab(tab);
    setSearchParams((prev) => {
      prev.set('subtab', tab);
      return prev;
    });
  };

  // ── 1. Branch-Filtered Shift Definitions ──
  const filteredShifts = useMemo(() => {
    return shifts.filter((s) => {
      return matchBranch({
        branchId: s.branchId,
        branchName: s.branchName,
      });
    });
  }, [shifts, matchBranch]);

  // ── 2. Branch-Filtered Scheduled Staff ──
  const filteredRosterEmployees = useMemo(() => {
    return rosterEmployees.filter((emp) =>
      matchBranch({
        branchName: emp.branch,
        location: emp.branch,
      })
    );
  }, [rosterEmployees, matchBranch]);

  // ── 3. Branch-Filtered Shift Assignments ──
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      if (a.tier === 'COMPANY') {
        return effectiveBranch === 'ALL' || effectiveBranch === 'HEAD_OFFICE';
      }
      return matchBranch({
        branchName: a.branchName,
        location: a.branchName,
      });
    });
  }, [assignments, effectiveBranch, matchBranch]);

  // ── 4. Branch-Filtered Rotation Cycles ──
  const filteredRotations = useMemo(() => {
    return rotations.filter((r) =>
      matchBranch({
        branchName: (r as any).branchName || r.applicableScope || r.department,
        location: (r as any).location || r.applicableScope,
      })
    );
  }, [rotations, matchBranch]);

  // ── 5. Branch-Filtered Weekly Off Policies ──
  const filteredWeeklyOffPolicies = useMemo(() => {
    return weeklyOffPolicies.filter((p) => {
      if (effectiveBranch === 'ALL') return true;
      if (effectiveBranch === 'HEAD_OFFICE') {
        const target = (p.applicableTarget || '').toLowerCase();
        return (
          p.applicableTo === 'Entire Company' ||
          p.applicableTo === 'Employee Group' ||
          !target ||
          target.includes('head office') ||
          target.includes('corporate') ||
          target.includes('main') ||
          target.includes('hq')
        );
      }
      const branchObj = branchList.find((b: any) => b.id === effectiveBranch);
      const bName = (branchObj?.name || '').toLowerCase();
      const target = (p.applicableTarget || '').toLowerCase();
      return (
        p.applicableTo === 'Entire Company' ||
        (bName && target.includes(bName.slice(0, 4))) ||
        target.includes(effectiveBranch.toLowerCase())
      );
    });
  }, [weeklyOffPolicies, effectiveBranch, branchList]);

  // ── 6. Branch-Filtered Shift Changes & Swaps ──
  const filteredShiftChanges = useMemo(() => {
    return shiftChanges.filter((sc) => {
      const emp = rosterEmployees.find((e) => e.employeeCode === sc.employeeCode);
      return matchBranch({
        branchName: emp?.branch || (sc as any).branchName || sc.department,
        location: emp?.branch,
      });
    });
  }, [shiftChanges, rosterEmployees, matchBranch]);

  const filteredShiftSwaps = useMemo(() => {
    return shiftSwaps.filter((sw) =>
      matchBranch({
        branchName: sw.requesterBranch || sw.targetBranch,
        location: sw.requesterBranch || sw.targetBranch,
      })
    );
  }, [shiftSwaps, matchBranch]);

  // ── 7. Branch-Filtered Pending Approvals Count ──
  const filteredPendingApprovalsCount = useMemo(() => {
    const pendingBatches = batchApprovals.filter(
      (b) =>
        (b.status === 'Manager Review' || b.status === 'Draft') &&
        matchBranch({ branchName: b.department, location: b.department })
    ).length;

    const pendingChanges = filteredShiftChanges.filter(
      (c) =>
        c.status === 'Pending Review' ||
        c.status === 'Pending Approval' ||
        c.status === 'Manager Review'
    ).length;

    const pendingSwaps = filteredShiftSwaps.filter(
      (s) => s.status === 'Pending Manager Approval'
    ).length;

    return pendingBatches + pendingChanges + pendingSwaps;
  }, [batchApprovals, filteredShiftChanges, filteredShiftSwaps, matchBranch]);

  // Compute telemetry metrics dynamically strictly from branch-filtered data
  const activeShiftCycles = useMemo(
    () => filteredShifts.filter((s) => s.status === 'Active').length,
    [filteredShifts]
  );

  const totalStaffScheduled = useMemo(() => {
    // 1. If filtered roster has records, count distinct staff
    if (filteredRosterEmployees && filteredRosterEmployees.length > 0) {
      const distinctRoster = new Set(
        filteredRosterEmployees.map((e) => e.employeeId || e.employeeCode).filter(Boolean)
      );
      if (distinctRoster.size > 0) return distinctRoster.size;
    }

    // 2. Count distinct personnel across filtered assignments
    const distinctEmpIds = new Set<string>();
    filteredAssignments.forEach((a) => {
      if (a.employeeId) distinctEmpIds.add(a.employeeId);
      else if (a.employeeCode) distinctEmpIds.add(a.employeeCode);
    });
    if (distinctEmpIds.size > 0) return distinctEmpIds.size;

    // 3. Fallback to active rotation covered headcount for this branch
    if (filteredRotations.length > 0 && filteredRotations[0].headcountCovered) {
      return filteredRotations[0].headcountCovered;
    }

    return 0;
  }, [filteredRosterEmployees, filteredAssignments, filteredRotations]);

  const uniqueSupervisors = useMemo(
    () =>
      filteredRotations.filter(
        (r) => r.status === 'Active' || (r.status as string) === 'Scheduled'
      ).length,
    [filteredRotations]
  );

  const rotationPattern = filteredRotations.length > 0 ? filteredRotations[0].frequency : 'None';

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
                {activeShiftCycles > 0
                  ? `${activeShiftCycles} pattern${activeShiftCycles > 1 ? 's' : ''} configured`
                  : 'No shifts configured'}
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
                {filteredRotations.length > 0
                  ? (filteredRotations[0].nextRotationDate
                      ? `Next: ${filteredRotations[0].nextRotationDate}`
                      : 'Rule configured')
                  : 'No rotation active'}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
              <RefreshCw className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Tab Navigation Bar (All 8 Lifecycle Tabs) ── */}
      <div className="border-b border-border/70 pb-1.5 w-full overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1 min-w-max pr-4">
          {/* Shift Master */}
          <button
            type="button"
            onClick={() => handleTabChange('master')}
            className={`inline-flex items-center gap-1 px-2 py-1 text-[10.5px] font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
              activeSubTab === 'master'
                ? 'bg-primary/10 text-primary border border-primary/25 font-semibold shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent'
            }`}
          >
            <Clock className="h-3 w-3 shrink-0" />
            Shift Master
            <Badge variant="secondary" className="h-3.5 px-1 min-w-[14px] text-[8px] font-mono inline-flex items-center justify-center rounded-full font-semibold">
              {filteredShifts.length}
            </Badge>
          </button>

          {/* Weekly Off Policy */}
          <button
            type="button"
            onClick={() => handleTabChange('weekly-off')}
            className={`inline-flex items-center gap-1 px-2 py-1 text-[10.5px] font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
              activeSubTab === 'weekly-off'
                ? 'bg-primary/10 text-primary border border-primary/25 font-semibold shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent'
            }`}
          >
            <CalendarDays className="h-3 w-3 shrink-0" />
            Weekly Off
            <Badge variant="secondary" className="h-3.5 px-1 min-w-[14px] text-[8px] font-mono inline-flex items-center justify-center rounded-full font-semibold">
              {filteredWeeklyOffPolicies.length}
            </Badge>
          </button>

          {/* Assignments */}
          <button
            type="button"
            onClick={() => handleTabChange('assignments')}
            className={`inline-flex items-center gap-1 px-2 py-1 text-[10.5px] font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
              activeSubTab === 'assignments'
                ? 'bg-primary/10 text-primary border border-primary/25 font-semibold shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent'
            }`}
          >
            <Layers className="h-3 w-3 shrink-0" />
            Assignments
            <Badge variant="secondary" className="h-3.5 px-1 min-w-[14px] text-[8px] font-mono inline-flex items-center justify-center rounded-full font-semibold">
              {filteredAssignments.length}
            </Badge>
          </button>

          {/* Roster */}
          <button
            type="button"
            onClick={() => handleTabChange('roster')}
            className={`inline-flex items-center gap-1 px-2 py-1 text-[10.5px] font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
              activeSubTab === 'roster'
                ? 'bg-primary/10 text-primary border border-primary/25 font-semibold shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent'
            }`}
          >
            <Calendar className="h-3 w-3 shrink-0" />
            Roster Planner
            {filteredRosterEmployees.length > 0 && (
              <Badge variant="secondary" className="h-3.5 px-1 min-w-[14px] text-[8px] font-mono inline-flex items-center justify-center rounded-full font-semibold">
                {filteredRosterEmployees.length}
              </Badge>
            )}
          </button>

          {/* Rotation */}
          <button
            type="button"
            onClick={() => handleTabChange('rotation')}
            className={`inline-flex items-center gap-1 px-2 py-1 text-[10.5px] font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
              activeSubTab === 'rotation'
                ? 'bg-primary/10 text-primary border border-primary/25 font-semibold shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent'
            }`}
          >
            <RefreshCw className="h-3 w-3 shrink-0" />
            Rotation
            <Badge variant="secondary" className="h-3.5 px-1 min-w-[14px] text-[8px] font-mono inline-flex items-center justify-center rounded-full font-semibold">
              {filteredRotations.length}
            </Badge>
          </button>

          {/* Shift Changes */}
          <button
            type="button"
            onClick={() => handleTabChange('changes')}
            className={`inline-flex items-center gap-1 px-2 py-1 text-[10.5px] font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
              activeSubTab === 'changes'
                ? 'bg-primary/10 text-primary border border-primary/25 font-semibold shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent'
            }`}
          >
            <GitPullRequest className="h-3 w-3 shrink-0" />
            Shift Changes
            {filteredShiftChanges.length > 0 && (
              <Badge variant="secondary" className="h-3.5 px-1 min-w-[14px] text-[8px] font-mono inline-flex items-center justify-center rounded-full font-semibold">
                {filteredShiftChanges.length}
              </Badge>
            )}
          </button>

          {/* Shift Swaps */}
          <button
            type="button"
            onClick={() => handleTabChange('swaps')}
            className={`inline-flex items-center gap-1 px-2 py-1 text-[10.5px] font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
              activeSubTab === 'swaps'
                ? 'bg-primary/10 text-primary border border-primary/25 font-semibold shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent'
            }`}
          >
            <ArrowLeftRight className="h-3 w-3 shrink-0" />
            Shift Swaps
            {filteredShiftSwaps.length > 0 && (
              <Badge variant="secondary" className="h-3.5 px-1 min-w-[14px] text-[8px] font-mono inline-flex items-center justify-center rounded-full font-semibold">
                {filteredShiftSwaps.length}
              </Badge>
            )}
          </button>

          {/* Approvals */}
          <button
            type="button"
            onClick={() => handleTabChange('approvals')}
            className={`inline-flex items-center gap-1 px-2 py-1 text-[10.5px] font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
              activeSubTab === 'approvals'
                ? 'bg-primary/10 text-primary border border-primary/25 font-semibold shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent'
            }`}
          >
            <ShieldCheck className="h-3 w-3 shrink-0" />
            Approvals
            {filteredPendingApprovalsCount > 0 && (
              <Badge className="h-3.5 px-1 min-w-[14px] text-[8px] bg-amber-500 hover:bg-amber-600 text-white font-bold inline-flex items-center justify-center rounded-full">
                {filteredPendingApprovalsCount}
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
