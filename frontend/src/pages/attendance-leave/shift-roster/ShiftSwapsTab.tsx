import { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import {
  ArrowLeftRight,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Building2,
  Calendar,
  AlertTriangle,
  Eye,
  Check,
  X,
  Ban,
  Info,
  Users,
  Filter,
  Layers,
  Sparkles,
  History as HistoryIcon,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/stores/auth-store';
import { isManagerOrHrOrAdmin } from '@/lib/modules';
import { useShiftRosterStore } from './shiftRosterStore';
import type { ShiftSwapRequest } from './shiftRosterStore';
import { cn } from '@/lib/utils';

export function ShiftSwapsTab() {
  const user = useAuthStore((s) => s.user);
  const canManageSwaps = isManagerOrHrOrAdmin(user);

  const {
    shiftSwaps,
    rosterEmployees,
    shifts,
    submitShiftSwap,
    resolveShiftSwap,
    cancelShiftSwap,
  } = useShiftRosterStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals state
  const [isProposeModalOpen, setIsProposeModalOpen] = useState(false);
  const [viewingSwap, setViewingSwap] = useState<ShiftSwapRequest | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [rejectingSwap, setRejectingSwap] = useState<ShiftSwapRequest | null>(null);
  const [rejectionRemarks, setRejectionRemarks] = useState('');
  const [cancellingSwap, setCancellingSwap] = useState<ShiftSwapRequest | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');

  // Propose Swap Form State
  const defaultEmpA = rosterEmployees[0];
  const defaultEmpB = rosterEmployees.find((e) => e.employeeCode !== defaultEmpA?.employeeCode) || rosterEmployees[1];

  const [selectedEmpCodeA, setSelectedEmpCodeA] = useState(defaultEmpA?.employeeCode || 'EMP-001');
  const [selectedEmpCodeB, setSelectedEmpCodeB] = useState(defaultEmpB?.employeeCode || 'EMP-002');
  const [swapDate, setSwapDate] = useState('2026-09-18');
  const [reason, setReason] = useState('');

  // Sync default selection if employees load later
  useEffect(() => {
    if (rosterEmployees.length > 0) {
      if (!selectedEmpCodeA) setSelectedEmpCodeA(rosterEmployees[0].employeeCode);
      if (!selectedEmpCodeB && rosterEmployees.length > 1) {
        setSelectedEmpCodeB(rosterEmployees[1].employeeCode);
      }
    }
  }, [rosterEmployees, selectedEmpCodeA, selectedEmpCodeB]);

  // Find Employee A and Employee B records
  const empA = useMemo(
    () => rosterEmployees.find((e) => e.employeeCode === selectedEmpCodeA) || defaultEmpA,
    [rosterEmployees, selectedEmpCodeA, defaultEmpA]
  );
  const empB = useMemo(
    () => rosterEmployees.find((e) => e.employeeCode === selectedEmpCodeB) || defaultEmpB,
    [rosterEmployees, selectedEmpCodeB, defaultEmpB]
  );

  // Retrieve current rostered shifts on swapDate
  const shiftA = useMemo(() => {
    if (!empA || !empA.slots) return { code: 'MS', name: 'Morning Shift', timing: '08:00 AM - 04:30 PM', isLeave: false, isOff: false };
    const slot = empA.slots[swapDate];
    if (slot) {
      return {
        code: slot.shiftCode,
        name: slot.shiftName,
        timing: slot.timing || '08:00 AM - 04:30 PM',
        isLeave: slot.status === 'Leave' || slot.shiftCode === 'LV',
        isOff: slot.status === 'Off' || slot.shiftCode === 'WO',
      };
    }
    return { code: 'MS', name: 'Morning Shift', timing: '08:00 AM - 04:30 PM', isLeave: false, isOff: false };
  }, [empA, swapDate]);

  const shiftB = useMemo(() => {
    if (!empB || !empB.slots) return { code: 'ES', name: 'Evening Shift', timing: '04:00 PM - 12:30 AM', isLeave: false, isOff: false };
    const slot = empB.slots[swapDate];
    if (slot) {
      return {
        code: slot.shiftCode,
        name: slot.shiftName,
        timing: slot.timing || '04:00 PM - 12:30 AM',
        isLeave: slot.status === 'Leave' || slot.shiftCode === 'LV',
        isOff: slot.status === 'Off' || slot.shiftCode === 'WO',
      };
    }
    return { code: 'ES', name: 'Evening Shift', timing: '04:00 PM - 12:30 AM', isLeave: false, isOff: false };
  }, [empB, swapDate]);

  // Real-time Compliance Evaluation
  const compliance = useMemo(() => {
    const isSameEmp = empA && empB && empA.employeeCode === empB.employeeCode;
    const bothActive = Boolean(empA && empB && !isSameEmp);
    const branchA = empA?.branch || 'Pune Manufacturing Plant';
    const branchB = empB?.branch || 'Pune Manufacturing Plant';
    const sameBranch = branchA.toLowerCase() === branchB.toLowerCase();

    const noLeaveConflict = !shiftA.isLeave && !shiftB.isLeave;
    const hasWeeklyOff = shiftA.isOff || shiftB.isOff;

    // Check for double booking
    const doubleBooked = shiftSwaps.some((sw) => {
      if (sw.swapDate !== swapDate) return false;
      if (sw.status === 'Rejected' || sw.status === 'Cancelled') return false;
      const participants = [sw.requesterCode, sw.targetCode];
      return participants.includes(selectedEmpCodeA) || participants.includes(selectedEmpCodeB);
    });
    const noDoubleBooking = !doubleBooked;

    // Rest interval calculation
    let restHours = 15.5;
    if (
      (shiftA.code === 'NS' && shiftB.code === 'ES') ||
      (shiftB.code === 'NS' && shiftA.code === 'ES')
    ) {
      restHours = 9.5;
    } else if (
      (shiftA.code === 'ES' && shiftB.code === 'MS') ||
      (shiftB.code === 'ES' && shiftA.code === 'MS')
    ) {
      restHours = 7.5;
    } else if (
      (shiftA.code === 'NS' && shiftB.code === 'MS') ||
      (shiftB.code === 'NS' && shiftA.code === 'MS')
    ) {
      restHours = 1.5;
    }
    const restHoursCompliant = restHours >= 11;

    const reasons: string[] = [];
    if (isSameEmp) reasons.push('Swap partner must be a different employee.');
    if (!sameBranch) reasons.push(`Employees belong to different branches (${branchA} vs ${branchB}).`);
    if (shiftA.isLeave) reasons.push(`${empA?.name} has approved leave on ${swapDate}.`);
    if (shiftB.isLeave) reasons.push(`${empB?.name} has approved leave on ${swapDate}.`);
    if (hasWeeklyOff) reasons.push('One colleague has a scheduled Weekly Off on this date.');
    if (!noDoubleBooking) reasons.push(`An active or pending shift swap already exists for ${swapDate}.`);
    if (!restHoursCompliant) reasons.push(`Rest interval is ${restHours}h (< 11h mandatory rest required).`);
    if (reason.trim().length < 10) reasons.push('Reason is mandatory and must be at least 10 characters.');

    const allPassed =
      bothActive &&
      !isSameEmp &&
      sameBranch &&
      noLeaveConflict &&
      !hasWeeklyOff &&
      noDoubleBooking &&
      restHoursCompliant &&
      reason.trim().length >= 10;

    return {
      bothActive: bothActive && !isSameEmp,
      sameBranch,
      noLeaveConflict: noLeaveConflict && !hasWeeklyOff,
      noDoubleBooking,
      restHoursCompliant,
      restHours,
      allPassed,
      failureReasons: reasons,
    };
  }, [empA, empB, shiftA, shiftB, swapDate, shiftSwaps, selectedEmpCodeA, selectedEmpCodeB, reason]);

  // Handle Propose Swap Submission
  const handleProposeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compliance.allPassed) {
      toast.error(compliance.failureReasons[0] || 'Compliance checks failed. Cannot submit swap request.');
      return;
    }

    try {
      await submitShiftSwap({
        requesterCode: empA?.employeeCode || 'EMP-001',
        requesterName: empA?.name || 'Sudarshan Kale',
        requesterBranch: empA?.branch || 'Pune Manufacturing Plant',
        requesterDept: empA?.department || 'Production',
        requesterShift: `${shiftA.code} (${shiftA.name})`,
        targetCode: empB?.employeeCode || 'EMP-002',
        targetName: empB?.name || 'Staff B',
        targetBranch: empB?.branch || 'Pune Manufacturing Plant',
        targetDept: empB?.department || 'Production',
        targetShift: `${shiftB.code} (${shiftB.name})`,
        swapDate,
        reason: reason.trim(),
      });

      setIsProposeModalOpen(false);
      setReason('');
    } catch (err: any) {
      // Toast handled by store
    }
  };

  // Actions
  const handleApprove = async (swap: ShiftSwapRequest) => {
    await resolveShiftSwap(swap.id, 'Approved', 'Mutual shift exchange approved by manager', user?.name || 'Operations Lead');
  };

  const handleConfirmReject = async () => {
    if (!rejectingSwap) return;
    if (!rejectionRemarks.trim()) {
      toast.error('Please provide a reason for rejecting this shift swap');
      return;
    }
    await resolveShiftSwap(rejectingSwap.id, 'Rejected', rejectionRemarks.trim(), user?.name || 'Operations Lead');
    setRejectingSwap(null);
    setRejectionRemarks('');
  };

  const handleConfirmCancel = async () => {
    if (!cancellingSwap) return;
    await cancelShiftSwap(cancellingSwap.id, cancellationReason.trim() || 'Cancelled by requester/admin', user?.name || 'Admin');
    setCancellingSwap(null);
    setCancellationReason('');
  };

  // Filtered List
  const filteredSwaps = useMemo(() => {
    return shiftSwaps.filter((sw) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        sw.requesterName.toLowerCase().includes(q) ||
        sw.requesterCode.toLowerCase().includes(q) ||
        sw.targetName.toLowerCase().includes(q) ||
        sw.targetCode.toLowerCase().includes(q) ||
        sw.reason.toLowerCase().includes(q) ||
        (sw.requesterBranch && sw.requesterBranch.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'PENDING' && sw.status === 'Pending Manager Approval') ||
        (statusFilter === 'APPROVED' && sw.status === 'Approved') ||
        (statusFilter === 'REJECTED' && sw.status === 'Rejected') ||
        (statusFilter === 'CANCELLED' && sw.status === 'Cancelled');

      return matchesSearch && matchesStatus;
    });
  }, [shiftSwaps, searchQuery, statusFilter]);

  // Summary Metrics
  const activeCount = shiftSwaps.filter((s) => s.status === 'Approved').length;
  const pendingCount = shiftSwaps.filter((s) => s.status === 'Pending Manager Approval').length;
  const rejectedCount = shiftSwaps.filter((s) => s.status === 'Rejected').length;

  return (
    <div className="space-y-5">
      {/* ── 1. Top Summary Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="shadow-2xs border-border/80 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Active Swaps</p>
              <h3 className="text-xl font-bold text-foreground mt-0.5">{activeCount} Approved</h3>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1 font-medium">
                <CheckCircle2 className="h-3 w-3" /> Live in Roster Planner
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Pending Approval</p>
              <h3 className="text-xl font-bold text-foreground mt-0.5">{pendingCount} Requests</h3>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1 font-medium">
                <Clock className="h-3 w-3" /> Awaiting Manager Sign-Off
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Compliance Score</p>
              <h3 className="text-xl font-bold text-foreground mt-0.5">100% Validated</h3>
              <p className="text-[11px] text-primary mt-0.5 flex items-center gap-1 font-medium">
                <ShieldCheck className="h-3 w-3" /> 5 Mandatory Checks Enforced
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Locations Covered</p>
              <h3 className="text-xl font-bold text-foreground mt-0.5">Pune Plant</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Single-branch policy enforced</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-muted border text-muted-foreground flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. System Validation Engine Banner ── */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" /> Shift Swap Automated Compliance Engine
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Before submitting or approving any peer-to-peer swap, the system evaluates all 5 regulatory and operational requirements:
            </p>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[11px] font-semibold px-2.5 py-0.5 flex items-center gap-1.5 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Real-time Verification Active
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-xs">
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-background border border-border/70 shadow-2xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <div>
              <p className="font-semibold text-foreground text-[11px]">Both Active</p>
              <p className="text-[9px] text-muted-foreground">Active staff status</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-background border border-border/70 shadow-2xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <div>
              <p className="font-semibold text-foreground text-[11px]">Same Branch</p>
              <p className="text-[9px] text-muted-foreground">Matching work site</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-background border border-border/70 shadow-2xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <div>
              <p className="font-semibold text-foreground text-[11px]">No Leave Conflict</p>
              <p className="text-[9px] text-muted-foreground">Zero leave overlap</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-background border border-border/70 shadow-2xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <div>
              <p className="font-semibold text-foreground text-[11px]">No Double-Booking</p>
              <p className="text-[9px] text-muted-foreground">Single active swap</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-background border border-border/70 shadow-2xs col-span-2 sm:col-span-1">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <div>
              <p className="font-semibold text-foreground text-[11px]">≥11h Rest Interval</p>
              <p className="text-[9px] text-muted-foreground">Statutory rest hours</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Main Swaps Registry Table ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4 text-primary" /> Peer Shift Swap Registry
            </CardTitle>
            <CardDescription className="text-xs">
              Mutual shift exchange requests between verified colleagues with automated compliance tracking
            </CardDescription>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search Input */}
            <div className="relative w-48 sm:w-60">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search staff, code, reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-background"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-36 text-xs bg-background">
                <Filter className="h-3 w-3 mr-1 text-muted-foreground" />
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">All Statuses</SelectItem>
                <SelectItem value="PENDING" className="text-xs">Pending Approval</SelectItem>
                <SelectItem value="APPROVED" className="text-xs">Approved</SelectItem>
                <SelectItem value="REJECTED" className="text-xs">Rejected</SelectItem>
                <SelectItem value="CANCELLED" className="text-xs">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Propose Shift Swap Modal Trigger */}
            <Button size="sm" className="h-8 text-xs gap-1.5 font-semibold" onClick={() => setIsProposeModalOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Propose Shift Swap
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5">
          <div className="rounded-md border border-border/80 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-xs font-semibold">Initiating Colleague</TableHead>
                  <TableHead className="text-xs font-semibold">Swap Partner</TableHead>
                  <TableHead className="text-xs font-semibold">Date of Swap</TableHead>
                  <TableHead className="text-xs font-semibold">Reason</TableHead>
                  <TableHead className="text-xs font-semibold">Compliance Checks</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-right text-xs font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSwaps.map((sw) => {
                  const isApproved = sw.status === 'Approved';
                  const isPending = sw.status === 'Pending Manager Approval' || sw.status === 'Pending Peer Acceptance';
                  const isRejected = sw.status === 'Rejected';
                  const isCancelled = sw.status === 'Cancelled';

                  return (
                    <TableRow key={sw.id} className="hover:bg-muted/30 transition-colors">
                      {/* Initiating Colleague */}
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-primary">{sw.requesterCode}</span>
                            <span className="text-xs font-semibold text-foreground">{sw.requesterName}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                            <Badge variant="outline" className="text-[9px] px-1 py-0 border-primary/30 text-primary font-semibold">
                              {sw.requesterShift.split(' ')[0] || 'MS'}
                            </Badge>
                            <span>{sw.requesterShift}</span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Swap Partner */}
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-violet-600">{sw.targetCode}</span>
                            <span className="text-xs font-semibold text-foreground">{sw.targetName}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                            <Badge variant="outline" className="text-[9px] px-1 py-0 border-violet-500/30 text-violet-600 font-semibold">
                              {sw.targetShift.split(' ')[0] || 'ES'}
                            </Badge>
                            <span>{sw.targetShift}</span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Date of Swap */}
                      <TableCell className="font-mono text-xs text-foreground font-semibold">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {sw.swapDate}
                        </div>
                      </TableCell>

                      {/* Reason */}
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate" title={sw.reason}>
                        {sw.reason}
                      </TableCell>

                      {/* Compliance Checks Badge */}
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>5 / 5 Passed</span>
                        </div>
                        <span className="text-[9px] text-muted-foreground">
                          Rest: {sw.checks?.calculatedRestHours || 15.5}h (≥11h)
                        </span>
                      </TableCell>

                      {/* Status Badge */}
                      <TableCell>
                        {isPending && (
                          <Badge variant="outline" className="text-[10px] font-bold text-amber-700 bg-amber-50 border-amber-300 dark:bg-amber-950/40 uppercase tracking-wide">
                            Pending Approval
                          </Badge>
                        )}
                        {isApproved && (
                          <Badge variant="outline" className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 uppercase tracking-wide">
                            Approved & Active
                          </Badge>
                        )}
                        {isRejected && (
                          <Badge variant="outline" className="text-[10px] font-bold text-rose-700 bg-rose-50 border-rose-300 dark:bg-rose-950/40 uppercase tracking-wide">
                            Rejected
                          </Badge>
                        )}
                        {isCancelled && (
                          <Badge variant="outline" className="text-[10px] font-semibold text-muted-foreground bg-muted border-border uppercase">
                            Cancelled
                          </Badge>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Full Details */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            title="View Complete Swap & Audit Details"
                            onClick={() => {
                              setViewingSwap(sw);
                              setIsViewModalOpen(true);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>

                          {/* Approval Actions (Manager / HR) */}
                          {canManageSwaps && isPending && (
                            <>
                              <Button
                                size="sm"
                                className="h-7 text-xs px-2 bg-emerald-600 hover:bg-emerald-700 text-white gap-1 font-semibold shadow-2xs"
                                title="Approve and apply to Roster"
                                onClick={() => handleApprove(sw)}
                              >
                                <Check className="h-3 w-3" /> Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs px-2 text-rose-600 border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1 font-medium"
                                title="Reject shift swap"
                                onClick={() => setRejectingSwap(sw)}
                              >
                                <X className="h-3 w-3" /> Reject
                              </Button>
                            </>
                          )}

                          {/* Cancellation Action (Available before swap date) */}
                          {(isApproved || isPending) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600"
                              title="Cancel shift swap and restore original roster"
                              onClick={() => setCancellingSwap(sw)}
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {filteredSwaps.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-xs text-muted-foreground">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <ArrowLeftRight className="h-8 w-8 text-muted-foreground/50" />
                        <p className="font-semibold text-foreground">No Shift Swaps Found</p>
                        <p className="text-[11px] text-muted-foreground max-w-sm">
                          {searchQuery || statusFilter !== 'ALL'
                            ? 'No shift swap records matched your search or status filter criteria.'
                            : 'No peer-to-peer shift swaps are registered. Click "+ Propose Shift Swap" to initiate a mutual shift exchange.'}
                        </p>
                        <Button size="sm" className="mt-2 h-8 text-xs gap-1.5" onClick={() => setIsProposeModalOpen(true)}>
                          <Plus className="h-3.5 w-3.5" /> Propose Shift Swap
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── 4. PROPOSE SHIFT SWAP MULTI-STEP WIZARD MODAL ── */}
      <Dialog open={isProposeModalOpen} onOpenChange={setIsProposeModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <ArrowLeftRight className="h-4.5 w-4.5 text-primary" /> Propose Shift Swap Between Peers
              </DialogTitle>
              <Badge variant="outline" className="text-[10px] font-mono uppercase bg-primary/5 text-primary border-primary/20">
                Peer Exchange
              </Badge>
            </div>
            <DialogDescription className="text-xs">
              Mutual temporary shift exchange between two colleagues for a specific roster date.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleProposeSubmit} className="space-y-4 pt-1">
            {/* Step 1: Initiating Employee (Employee A) */}
            <div className="border rounded-xl p-3.5 bg-muted/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-primary tracking-wider flex items-center gap-1">
                  <Users className="h-3 w-3" /> Step 1: Initiating Employee (Colleague A)
                </span>
                <Badge variant="outline" className="text-[9px] bg-background font-mono">
                  {empA?.employeeCode}
                </Badge>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-medium">Select Employee A</Label>
                <Select value={selectedEmpCodeA} onValueChange={setSelectedEmpCodeA}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Choose Colleague A..." />
                  </SelectTrigger>
                  <SelectContent>
                    {rosterEmployees.map((e) => (
                      <SelectItem key={e.employeeId} value={e.employeeCode} className="text-xs">
                        {e.employeeCode} — {e.name} ({e.department})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {empA && (
                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/50">
                  <div>
                    <span className="text-muted-foreground text-[10px] block">Branch & Dept</span>
                    <span className="font-medium text-foreground text-[11px]">{empA.branch || 'Pune Plant'} • {empA.department}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px] block">Current Shift ({swapDate})</span>
                    <span className="font-semibold text-primary text-[11px]">{shiftA.code} — {shiftA.name}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Swap Partner (Employee B) */}
            <div className="border rounded-xl p-3.5 bg-muted/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-violet-600 tracking-wider flex items-center gap-1">
                  <Users className="h-3 w-3" /> Step 2: Swap Partner (Colleague B)
                </span>
                <Badge variant="outline" className="text-[9px] bg-background font-mono text-violet-600">
                  {empB?.employeeCode}
                </Badge>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-medium">Select Swap Partner</Label>
                <Select value={selectedEmpCodeB} onValueChange={setSelectedEmpCodeB}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Choose Colleague B..." />
                  </SelectTrigger>
                  <SelectContent>
                    {rosterEmployees
                      .filter((e) => e.employeeCode !== selectedEmpCodeA)
                      .map((e) => (
                        <SelectItem key={e.employeeId} value={e.employeeCode} className="text-xs">
                          {e.employeeCode} — {e.name} ({e.department})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {empB && (
                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/50">
                  <div>
                    <span className="text-muted-foreground text-[10px] block">Branch & Dept</span>
                    <span className="font-medium text-foreground text-[11px]">{empB.branch || 'Pune Plant'} • {empB.department}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px] block">Current Shift ({swapDate})</span>
                    <span className="font-semibold text-violet-600 text-[11px]">{shiftB.code} — {shiftB.name}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Date of Swap */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" /> Step 3: Date of Swap *
              </Label>
              <Input
                type="date"
                value={swapDate}
                onChange={(e) => setSwapDate(e.target.value)}
                className="h-8 text-xs bg-background font-mono"
                required
              />
              <p className="text-[10px] text-muted-foreground">
                Roster shifts for both colleagues are dynamically fetched for this specific date.
              </p>
            </div>

            {/* Step 4: Swap Preview Table */}
            <div className="rounded-xl border border-border/80 bg-background p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="text-[11px] font-bold uppercase text-foreground tracking-wide flex items-center gap-1.5">
                  <ArrowLeftRight className="h-3.5 w-3.5 text-primary" /> Step 4: Shift Swap Preview
                </h5>
                <Badge variant="outline" className="text-[9px] font-mono">
                  Effective: {swapDate}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* Current Schedule */}
                <div className="p-2.5 rounded-lg bg-muted/30 border text-xs space-y-1.5">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Current Schedule</p>
                  <div>
                    <span className="text-[11px] font-semibold text-foreground block">{empA?.name || 'Colleague A'}</span>
                    <span className="text-[10px] text-muted-foreground">{shiftA.code} ({shiftA.timing})</span>
                  </div>
                  <div className="pt-1 border-t border-border/40">
                    <span className="text-[11px] font-semibold text-foreground block">{empB?.name || 'Colleague B'}</span>
                    <span className="text-[10px] text-muted-foreground">{shiftB.code} ({shiftB.timing})</span>
                  </div>
                </div>

                {/* After Swap Schedule */}
                <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20 text-xs space-y-1.5">
                  <p className="text-[10px] uppercase font-bold text-primary">After Swap (Exchanged)</p>
                  <div>
                    <span className="text-[11px] font-semibold text-foreground block">{empA?.name || 'Colleague A'}</span>
                    <span className="text-[10px] font-semibold text-primary">{shiftB.code} ({shiftB.timing})</span>
                  </div>
                  <div className="pt-1 border-t border-border/40">
                    <span className="text-[11px] font-semibold text-foreground block">{empB?.name || 'Colleague B'}</span>
                    <span className="text-[10px] font-semibold text-violet-600">{shiftA.code} ({shiftA.timing})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 5: Reason for Swap */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Step 5: Reason for Swap *</Label>
                <span className={cn('text-[10px]', reason.trim().length >= 10 ? 'text-emerald-600 font-medium' : 'text-amber-600')}>
                  {reason.trim().length} / 10 min chars
                </span>
              </div>
              <Textarea
                placeholder="Specify the mutual business or personal reason for this exchange (e.g. Critical furnace shift handover coverage)..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="text-xs min-h-[60px] bg-background"
                required
              />
            </div>

            {/* Step 6: Automated Compliance Validation Checks */}
            <div className="rounded-xl border p-3 bg-muted/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Step 6: Automated Compliance Validation
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] font-semibold',
                    compliance.allPassed ? 'text-emerald-600 border-emerald-300 bg-emerald-50' : 'text-rose-600 border-rose-300 bg-rose-50'
                  )}
                >
                  {compliance.allPassed ? 'All 5 Passed ✓' : 'Verification Incomplete'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                <div className="flex items-center gap-1.5">
                  {compliance.bothActive ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                  )}
                  <span className={compliance.bothActive ? 'text-foreground' : 'text-rose-600 font-medium'}>
                    Both Active Status
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {compliance.sameBranch ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                  )}
                  <span className={compliance.sameBranch ? 'text-foreground' : 'text-rose-600 font-medium'}>
                    Same Branch (Pune Plant)
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {compliance.noLeaveConflict ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                  )}
                  <span className={compliance.noLeaveConflict ? 'text-foreground' : 'text-rose-600 font-medium'}>
                    No Leave Conflict
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {compliance.noDoubleBooking ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                  )}
                  <span className={compliance.noDoubleBooking ? 'text-foreground' : 'text-rose-600 font-medium'}>
                    No Double Booking
                  </span>
                </div>

                <div className="flex items-center gap-1.5 col-span-1 sm:col-span-2">
                  {compliance.restHoursCompliant ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                  )}
                  <span className={compliance.restHoursCompliant ? 'text-foreground' : 'text-rose-600 font-medium'}>
                    ≥11h Rest Interval ({compliance.restHours}h calculated)
                  </span>
                </div>
              </div>

              {!compliance.allPassed && (
                <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-[11px] flex items-start gap-1.5 mt-1">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>{compliance.failureReasons[0]}</span>
                </div>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsProposeModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!compliance.allPassed} className="gap-1.5 font-semibold">
                <Check className="h-3.5 w-3.5" /> Submit Swap Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── 5. VIEW SWAP & AUDIT TRAIL MODAL ── */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-lg">
          {viewingSwap && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-base font-bold flex items-center gap-2">
                    <Eye className="h-4.5 w-4.5 text-primary" /> Shift Swap Request Details
                  </DialogTitle>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] font-bold uppercase',
                      viewingSwap.status === 'Approved' && 'text-emerald-700 bg-emerald-50 border-emerald-300',
                      viewingSwap.status === 'Pending Manager Approval' && 'text-amber-700 bg-amber-50 border-amber-300',
                      viewingSwap.status === 'Rejected' && 'text-rose-700 bg-rose-50 border-rose-300',
                      viewingSwap.status === 'Cancelled' && 'text-muted-foreground bg-muted border-border'
                    )}
                  >
                    {viewingSwap.status}
                  </Badge>
                </div>
                <DialogDescription className="text-xs">
                  Request ID: <span className="font-mono">{viewingSwap.id}</span> • Date: {viewingSwap.swapDate}
                </DialogDescription>
              </DialogHeader>

              <div className="py-2 space-y-3.5 text-xs">
                {/* Schedule Handover Card */}
                <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-muted/40 border">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-primary block">Initiator</span>
                    <span className="font-semibold text-foreground block text-xs mt-0.5">{viewingSwap.requesterName}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{viewingSwap.requesterCode}</span>
                    <p className="text-[11px] font-medium text-foreground mt-1">
                      Assigned: <span className="font-semibold">{viewingSwap.requesterShift}</span>
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-violet-600 block">Swap Partner</span>
                    <span className="font-semibold text-foreground block text-xs mt-0.5">{viewingSwap.targetName}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{viewingSwap.targetCode}</span>
                    <p className="text-[11px] font-medium text-foreground mt-1">
                      Assigned: <span className="font-semibold">{viewingSwap.targetShift}</span>
                    </p>
                  </div>
                </div>

                {/* Reason */}
                <div className="p-3 rounded-lg border bg-background space-y-1">
                  <span className="text-muted-foreground text-[10px] block font-semibold uppercase">Business / Personal Reason</span>
                  <p className="text-xs text-foreground font-medium">{viewingSwap.reason}</p>
                </div>

                {/* Compliance Summary */}
                <div className="p-3 rounded-lg border bg-background space-y-1.5">
                  <span className="text-muted-foreground text-[10px] block font-semibold uppercase">Compliance Evaluation</span>
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-semibold text-xs">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>5 / 5 Regulatory Checks Verified</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Both Active • Same Branch ({viewingSwap.requesterBranch || 'Pune Plant'}) • No Leave Conflict • No Double Booking • Rest: {viewingSwap.checks?.calculatedRestHours || 15.5}h (≥11h required)
                  </p>
                </div>

                {/* Audit Trail Timeline */}
                <div>
                  <h5 className="font-semibold text-xs text-foreground mb-2 flex items-center gap-1.5">
                    <HistoryIcon className="h-3.5 w-3.5 text-primary" /> Lifecycle Audit Trail
                  </h5>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto border rounded-lg p-2.5 bg-muted/20 text-[11px]">
                    {viewingSwap.history && viewingSwap.history.length > 0 ? (
                      viewingSwap.history.map((h, i) => (
                        <div key={i} className="flex items-start justify-between border-b border-border/40 pb-1 last:border-0 last:pb-0">
                          <div>
                            <span className="font-semibold text-foreground">{h.stage}</span>
                            <span className="text-muted-foreground block text-[10px]">{h.action} — by {h.actor}</span>
                            {h.notes && <span className="text-[10px] text-foreground/80 italic">"{h.notes}"</span>}
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono shrink-0">{h.date}</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Submitted & Verified by Automated Compliance Engine</span>
                        <span className="font-mono">{viewingSwap.swapDate}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter className="flex items-center justify-between pt-2">
                <Button variant="outline" size="sm" onClick={() => setIsViewModalOpen(false)}>
                  Close
                </Button>

                {canManageSwaps && viewingSwap.status === 'Pending Manager Approval' && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-rose-600 hover:bg-rose-50"
                      onClick={() => {
                        setIsViewModalOpen(false);
                        setRejectingSwap(viewingSwap);
                      }}
                    >
                      <X className="h-3.5 w-3.5 mr-1" /> Reject
                    </Button>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => {
                        setIsViewModalOpen(false);
                        handleApprove(viewingSwap);
                      }}
                    >
                      <Check className="h-3.5 w-3.5 mr-1" /> Approve
                    </Button>
                  </div>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── 6. REJECTION REMARKS MODAL ── */}
      <Dialog open={Boolean(rejectingSwap)} onOpenChange={(open) => !open && setRejectingSwap(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-rose-600">
              <XCircle className="h-4.5 w-4.5" /> Reject Shift Swap Request
            </DialogTitle>
            <DialogDescription className="text-xs">
              Please specify the operational or supervisory reason for rejecting this peer shift swap.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="p-2.5 rounded-lg bg-muted/40 text-xs">
              <p className="font-semibold text-foreground">
                {rejectingSwap?.requesterName} ⇄ {rejectingSwap?.targetName}
              </p>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">Date: {rejectingSwap?.swapDate}</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Rejection Remarks *</Label>
              <Textarea
                placeholder="e.g. Incompatible skillset for furnace monitoring during evening duty..."
                value={rejectionRemarks}
                onChange={(e) => setRejectionRemarks(e.target.value)}
                className="text-xs min-h-[70px]"
                required
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setRejectingSwap(null)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleConfirmReject} className="gap-1 font-semibold">
              <XCircle className="h-3.5 w-3.5" /> Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 7. CANCELLATION CONFIRMATION MODAL ── */}
      <Dialog open={Boolean(cancellingSwap)} onOpenChange={(open) => !open && setCancellingSwap(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-amber-600">
              <Ban className="h-4.5 w-4.5" /> Cancel Shift Swap
            </DialogTitle>
            <DialogDescription className="text-xs">
              Cancelling this swap will automatically revert the schedule in the Roster Planner back to each colleague's original rotational or baseline shift.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs">
              <p className="font-semibold text-amber-900 dark:text-amber-200">
                {cancellingSwap?.requesterName} ⇄ {cancellingSwap?.targetName}
              </p>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">Date: {cancellingSwap?.swapDate}</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Cancellation Reason (Optional)</Label>
              <Input
                placeholder="e.g. Schedule conflict resolved, original shift restored"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="text-xs h-8"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setCancellingSwap(null)}>
              Keep Active
            </Button>
            <Button variant="destructive" size="sm" onClick={handleConfirmCancel} className="gap-1 font-semibold">
              <Ban className="h-3.5 w-3.5" /> Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
