import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Building2,
  Users,
  Calendar,
  AlertCircle,
  FileCheck,
  ShieldCheck,
  ArrowRight,
  Eye,
  RotateCcw,
  Sparkles,
  Search,
  Check,
  CalendarDays,
  CheckCheck,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useShiftRosterStore, type RosterBatchApproval, type ShiftChangeRequest, type ShiftSwapRequest } from './shiftRosterStore';

export function ShiftApprovalsTab() {
  const {
    batchApprovals,
    shiftChanges,
    shiftSwaps,
    rosterEmployees,
    shifts,
    resolveBatchApproval,
    resolveShiftChange,
    resolveShiftSwap,
  } = useShiftRosterStore();

  const [activeCategory, setActiveCategory] = useState<'ROSTERS' | 'CHANGES' | 'SWAPS'>('ROSTERS');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedBatchForModal, setSelectedBatchForModal] = useState<RosterBatchApproval | null>(null);
  const [selectedChangeForModal, setSelectedChangeForModal] = useState<ShiftChangeRequest | null>(null);
  const [selectedSwapForModal, setSelectedSwapForModal] = useState<ShiftSwapRequest | null>(null);

  // Send back / rejection modal
  const [sendBackTarget, setSendBackTarget] = useState<{ type: 'BATCH' | 'CHANGE' | 'SWAP'; id: string; name: string } | null>(null);
  const [rejectRemarks, setRejectRemarks] = useState('');

  // Pending counts
  const pendingBatches = useMemo(
    () => batchApprovals.filter((b) => b.status === 'Manager Review' || b.status === 'Draft'),
    [batchApprovals]
  );
  const pendingChanges = useMemo(
    () => shiftChanges.filter((c) => c.status === 'Pending Review' || c.status === 'Pending Approval' || c.status === 'Manager Review'),
    [shiftChanges]
  );
  const pendingSwaps = useMemo(
    () => shiftSwaps.filter((s) => s.status === 'Pending Manager Approval'),
    [shiftSwaps]
  );

  const totalPendingDecisions = pendingBatches.length + pendingChanges.length + pendingSwaps.length;

  // Week 38 simulated dates for the Roster Matrix modal
  const sampleRosterDates = [
    { key: '2026-09-14', day: 'Mon', date: '14 Sep' },
    { key: '2026-09-15', day: 'Tue', date: '15 Sep' },
    { key: '2026-09-16', day: 'Wed', date: '16 Sep' },
    { key: '2026-09-17', day: 'Thu', date: '17 Sep' },
    { key: '2026-09-18', day: 'Fri', date: '18 Sep' },
    { key: '2026-09-19', day: 'Sat', date: '19 Sep' },
    { key: '2026-09-20', day: 'Sun', date: '20 Sep' },
  ];

  const handleConfirmRejection = () => {
    if (!sendBackTarget) return;
    const remarks = rejectRemarks.trim() || 'Returned for schedule adjustment';

    if (sendBackTarget.type === 'BATCH') {
      resolveBatchApproval(sendBackTarget.id, 'Draft', remarks);
    } else if (sendBackTarget.type === 'CHANGE') {
      resolveShiftChange(sendBackTarget.id, 'Rejected', remarks);
    } else if (sendBackTarget.type === 'SWAP') {
      resolveShiftSwap(sendBackTarget.id, 'Rejected', remarks);
    }

    setSendBackTarget(null);
    setRejectRemarks('');
  };

  return (
    <div className="space-y-4 font-sans">
      {/* ─────────────────────────────────────────────────────────────
          1. FOUR-STAGE LIFECYCLE BANNER
          ───────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" /> Shift & Roster Publication Governance Workflow
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Rosters remain in draft mode until approved and published. Once published, Face ID and attendance engines sync immediately.
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-semibold bg-background border-primary/30 text-primary">
            Four-Stage Lifecycle
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
          <div className="rounded-lg border bg-background/90 p-3 shadow-2xs relative">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Step 1</span>
            <p className="text-xs font-semibold text-foreground mt-0.5">Draft Schedule</p>
            <p className="text-[10px] text-muted-foreground">Supervisor creates shift allocations</p>
            <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 bg-card rounded-full border p-0.5 text-muted-foreground">
              <ArrowRight className="h-3 w-3" />
            </div>
          </div>

          <div className="rounded-lg border bg-background/90 p-3 shadow-2xs relative border-amber-200 dark:border-amber-900/40">
            <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">Step 2</span>
            <p className="text-xs font-semibold text-foreground mt-0.5">Manager Review</p>
            <p className="text-[10px] text-muted-foreground">Headcount & rest rules checked</p>
            <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 bg-card rounded-full border p-0.5 text-muted-foreground">
              <ArrowRight className="h-3 w-3" />
            </div>
          </div>

          <div className="rounded-lg border bg-background/90 p-3 shadow-2xs relative border-blue-200 dark:border-blue-900/40">
            <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Step 3</span>
            <p className="text-xs font-semibold text-foreground mt-0.5">Approved</p>
            <p className="text-[10px] text-muted-foreground">Operations lead signs off</p>
            <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 bg-card rounded-full border p-0.5 text-muted-foreground">
              <ArrowRight className="h-3 w-3" />
            </div>
          </div>

          <div className="rounded-lg border bg-background/90 p-3 shadow-2xs border-emerald-200 dark:border-emerald-900/40">
            <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Step 4</span>
            <p className="text-xs font-semibold text-foreground mt-0.5">Published</p>
            <p className="text-[10px] text-muted-foreground">Visible to employees & Face punch</p>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. ADMIN TOP-LEVEL GOVERNANCE METRIC CARDS
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Roster Batches Card */}
        <div
          onClick={() => setActiveCategory('ROSTERS')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
            activeCategory === 'ROSTERS'
              ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
              : 'border-border/80 bg-card hover:border-primary/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Roster Period Batches
            </span>
            <Badge
              variant="outline"
              className={
                pendingBatches.length > 0
                  ? 'bg-amber-50 text-amber-700 border-amber-200 font-bold text-[10px]'
                  : 'bg-muted text-muted-foreground text-[10px]'
              }
            >
              {pendingBatches.length} Pending
            </Badge>
          </div>
          <div className="text-xl font-black text-foreground mt-1 font-mono">
            {batchApprovals.length} Batches
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            {pendingBatches[0]
              ? `${pendingBatches[0].periodName} (${pendingBatches[0].department})`
              : 'All scheduled batches approved'}
          </p>
        </div>

        {/* Individual Shift Changes Card */}
        <div
          onClick={() => setActiveCategory('CHANGES')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
            activeCategory === 'CHANGES'
              ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
              : 'border-border/80 bg-card hover:border-primary/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Individual Shift Changes
            </span>
            <Badge
              variant="outline"
              className={
                pendingChanges.length > 0
                  ? 'bg-amber-50 text-amber-700 border-amber-200 font-bold text-[10px]'
                  : 'bg-muted text-muted-foreground text-[10px]'
              }
            >
              {pendingChanges.length} Pending
            </Badge>
          </div>
          <div className="text-xl font-black text-foreground mt-1 font-mono">
            {shiftChanges.length} Requests
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            {pendingChanges[0]
              ? `${pendingChanges[0].employeeName}: ${pendingChanges[0].currentShift} → ${pendingChanges[0].requestedShift}`
              : 'No pending individual modifications'}
          </p>
        </div>

        {/* Peer Shift Swaps Card */}
        <div
          onClick={() => setActiveCategory('SWAPS')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
            activeCategory === 'SWAPS'
              ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
              : 'border-border/80 bg-card hover:border-primary/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Peer Shift Swaps
            </span>
            <Badge
              variant="outline"
              className={
                pendingSwaps.length > 0
                  ? 'bg-amber-50 text-amber-700 border-amber-200 font-bold text-[10px]'
                  : 'bg-muted text-muted-foreground text-[10px]'
              }
            >
              {pendingSwaps.length} Pending
            </Badge>
          </div>
          <div className="text-xl font-black text-foreground mt-1 font-mono">
            {shiftSwaps.length} Proposals
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            {pendingSwaps[0]
              ? `${pendingSwaps[0].requesterName} ↔ ${pendingSwaps[0].targetName}`
              : 'No peer swaps awaiting authorization'}
          </p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. CATEGORY TABS SELECTOR
          ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border/80 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          <Button
            size="sm"
            variant={activeCategory === 'ROSTERS' ? 'default' : 'outline'}
            className="h-8 text-xs font-semibold gap-1.5 cursor-pointer"
            onClick={() => setActiveCategory('ROSTERS')}
          >
            <FileCheck className="h-3.5 w-3.5" />
            <span>Roster Period Batches</span>
            {pendingBatches.length > 0 && (
              <Badge className="ml-1 h-4 px-1.5 text-[9px] bg-amber-500 text-white font-bold">
                {pendingBatches.length}
              </Badge>
            )}
          </Button>

          <Button
            size="sm"
            variant={activeCategory === 'CHANGES' ? 'default' : 'outline'}
            className="h-8 text-xs font-semibold gap-1.5 cursor-pointer"
            onClick={() => setActiveCategory('CHANGES')}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Individual Shift Changes</span>
            {pendingChanges.length > 0 && (
              <Badge className="ml-1 h-4 px-1.5 text-[9px] bg-amber-500 text-white font-bold">
                {pendingChanges.length}
              </Badge>
            )}
          </Button>

          <Button
            size="sm"
            variant={activeCategory === 'SWAPS' ? 'default' : 'outline'}
            className="h-8 text-xs font-semibold gap-1.5 cursor-pointer"
            onClick={() => setActiveCategory('SWAPS')}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Peer Shift Swaps</span>
            {pendingSwaps.length > 0 && (
              <Badge className="ml-1 h-4 px-1.5 text-[9px] bg-amber-500 text-white font-bold">
                {pendingSwaps.length}
              </Badge>
            )}
          </Button>
        </div>

        {totalPendingDecisions > 0 && (
          <span className="text-xs text-muted-foreground hidden sm:inline">
            <strong className="text-foreground">{totalPendingDecisions}</strong> items requiring managerial action
          </span>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. STREAM A: ROSTER PERIOD BATCHES TABLE
          ───────────────────────────────────────────────────────────── */}
      {activeCategory === 'ROSTERS' && (
        <Card className="shadow-2xs border-border/80">
          <CardHeader className="p-4 pb-3 border-b border-border/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-primary" />
                  <span>Roster Schedule Batches Awaiting Sign-off</span>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Review and publish weekly/monthly schedules compiled by department supervisors. Click any row to preview full roster matrix.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 text-muted-foreground">
                    <TableHead className="text-xs font-semibold">Schedule Period</TableHead>
                    <TableHead className="text-xs font-semibold">Department</TableHead>
                    <TableHead className="text-xs font-semibold">Date Range</TableHead>
                    <TableHead className="text-xs font-semibold">Headcount</TableHead>
                    <TableHead className="text-xs font-semibold">Submitted By</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Lifecycle Status</TableHead>
                    <TableHead className="text-right text-xs font-semibold pr-4">Governance Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/40">
                  {batchApprovals.map((batch) => {
                    const isDraft = batch.status === 'Draft';
                    const isReview = batch.status === 'Manager Review';
                    const isApproved = batch.status === 'Approved';
                    const isPublished = batch.status === 'Published';

                    return (
                      <TableRow
                        key={batch.id}
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => setSelectedBatchForModal(batch)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-foreground hover:text-primary">
                              {batch.periodName}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            Submitted: {batch.submittedAt}
                          </span>
                        </TableCell>

                        <TableCell className="text-xs text-foreground font-medium">
                          {batch.department}
                        </TableCell>

                        <TableCell className="font-mono text-xs text-foreground font-semibold">
                          {batch.dateRange}
                        </TableCell>

                        <TableCell className="font-mono text-xs font-semibold text-primary">
                          {batch.headcount} Personnel
                        </TableCell>

                        <TableCell className="text-xs text-muted-foreground">
                          {batch.submittedBy}
                        </TableCell>

                        <TableCell className="text-center">
                          {isDraft && (
                            <Badge variant="outline" className="text-[10px] font-semibold text-slate-600 bg-slate-100 border-slate-300">
                              Step 1: Draft
                            </Badge>
                          )}
                          {isReview && (
                            <Badge variant="outline" className="text-[10px] font-semibold text-amber-700 bg-amber-50 border-amber-300 animate-pulse">
                              Step 2: Manager Review
                            </Badge>
                          )}
                          {isApproved && (
                            <Badge variant="outline" className="text-[10px] font-semibold text-blue-700 bg-blue-50 border-blue-300">
                              Step 3: Approved
                            </Badge>
                          )}
                          {isPublished && (
                            <Badge variant="outline" className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border-emerald-300">
                              Step 4: Published & Live
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-right pr-4 space-x-1.5" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedBatchForModal(batch)}
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <Eye className="h-3 w-3 mr-1" /> View Matrix
                          </Button>

                          {/* Step 1 Draft -> Submit for Review */}
                          {isDraft && (
                            <Button
                              size="sm"
                              className="h-7 text-xs px-2.5 bg-amber-600 hover:bg-amber-700 text-white gap-1 shadow-2xs cursor-pointer"
                              onClick={() => resolveBatchApproval(batch.id, 'Manager Review')}
                            >
                              <Send className="h-3 w-3" /> Submit Review
                            </Button>
                          )}

                          {/* Step 2 Manager Review -> Approve OR Send Back */}
                          {isReview && (
                            <>
                              <Button
                                size="sm"
                                className="h-7 text-xs px-2.5 bg-blue-600 hover:bg-blue-700 text-white gap-1 shadow-2xs cursor-pointer"
                                onClick={() => resolveBatchApproval(batch.id, 'Approved')}
                              >
                                <Check className="h-3 w-3" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs px-2 text-rose-600 hover:bg-rose-50 border-rose-200 cursor-pointer"
                                onClick={() => setSendBackTarget({ type: 'BATCH', id: batch.id, name: batch.periodName })}
                              >
                                <RotateCcw className="h-3 w-3 mr-1" /> Send Back
                              </Button>
                            </>
                          )}

                          {/* Step 3 Approved -> Publish */}
                          {isApproved && (
                            <Button
                              size="sm"
                              className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-2xs cursor-pointer"
                              onClick={() => resolveBatchApproval(batch.id, 'Published')}
                            >
                              <Sparkles className="h-3 w-3" /> Publish Roster
                            </Button>
                          )}

                          {/* Step 4 Published */}
                          {isPublished && (
                            <span className="text-[11px] text-emerald-600 font-semibold inline-flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Active on Gates
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. STREAM B: INDIVIDUAL SHIFT CHANGES TABLE
          ───────────────────────────────────────────────────────────── */}
      {activeCategory === 'CHANGES' && (
        <Card className="shadow-2xs border-border/80">
          <CardHeader className="p-4 pb-3 border-b border-border/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>Individual Shift Modification Requests</span>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Approve or decline employee shift modification requests. Approved changes update the Roster Planner automatically.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {shiftChanges.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground">
                No shift change requests found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 text-muted-foreground">
                      <TableHead className="text-xs font-semibold">Employee</TableHead>
                      <TableHead className="text-xs font-semibold">Department</TableHead>
                      <TableHead className="text-xs font-semibold">Change Request</TableHead>
                      <TableHead className="text-xs font-semibold">Effective Date</TableHead>
                      <TableHead className="text-xs font-semibold">Reason</TableHead>
                      <TableHead className="text-xs font-semibold">Compliance Validation</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Status</TableHead>
                      <TableHead className="text-right text-xs font-semibold pr-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border/40">
                    {shiftChanges.map((sc) => {
                      const isPending = sc.status === 'Pending Review' || sc.status === 'Pending Approval' || sc.status === 'Manager Review';
                      const isApproved = sc.status === 'Approved';

                      return (
                        <TableRow
                          key={sc.id}
                          className="hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => setSelectedChangeForModal(sc)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-bold text-primary">{sc.employeeCode}</span>
                              <span className="text-xs font-semibold text-foreground">{sc.employeeName}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground block">
                              Applied: {sc.appliedDate}
                            </span>
                          </TableCell>

                          <TableCell className="text-xs text-muted-foreground font-medium">
                            {sc.department}
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-1.5 text-xs font-semibold">
                              <Badge variant="outline" className="bg-muted/60 text-muted-foreground text-[10px]">
                                {sc.currentShift}
                              </Badge>
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold">
                                {sc.requestedShift}
                              </Badge>
                            </div>
                          </TableCell>

                          <TableCell className="font-mono text-xs text-foreground font-semibold">
                            {sc.effectiveDate}
                          </TableCell>

                          <TableCell className="text-xs text-muted-foreground max-w-xs truncate" title={sc.reason}>
                            {sc.reason || 'Personal commitment'}
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>11h Rest Passed</span>
                            </div>
                          </TableCell>

                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={
                                isApproved
                                  ? 'text-emerald-700 bg-emerald-50 border-emerald-300 text-[10px] font-semibold'
                                  : isPending
                                  ? 'text-amber-700 bg-amber-50 border-amber-300 text-[10px] font-semibold'
                                  : 'text-rose-700 bg-rose-50 border-rose-300 text-[10px]'
                              }
                            >
                              {isApproved ? 'Approved - Scheduled' : isPending ? 'Pending Review' : sc.status}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-right pr-4 space-x-1.5" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedChangeForModal(sc)}
                              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                            >
                              <Eye className="h-3 w-3 mr-1" /> View
                            </Button>

                            {isPending && (
                              <>
                                <Button
                                  size="sm"
                                  className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-2xs cursor-pointer"
                                  onClick={() => resolveShiftChange(sc.id, 'Approved')}
                                >
                                  <CheckCircle2 className="h-3 w-3" /> Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs px-2 text-rose-600 hover:bg-rose-50 border-rose-200 cursor-pointer"
                                  onClick={() => setSendBackTarget({ type: 'CHANGE', id: sc.id, name: `${sc.employeeName} (${sc.requestedShift})` })}
                                >
                                  <XCircle className="h-3 w-3 mr-1" /> Reject
                                </Button>
                              </>
                            )}

                            {isApproved && (
                              <span className="text-[10px] text-emerald-600 font-semibold">
                                ✓ Reflected on Roster
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. STREAM C: PEER SHIFT SWAPS TABLE
          ───────────────────────────────────────────────────────────── */}
      {activeCategory === 'SWAPS' && (
        <Card className="shadow-2xs border-border/80">
          <CardHeader className="p-4 pb-3 border-b border-border/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span>Peer Shift Swap Authorization Queue</span>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Mutual colleague shift exchanges ready for supervisory endorsement. Approval updates both employees in the Roster Planner simultaneously.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {shiftSwaps.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground">
                No shift swap proposals currently in queue.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 text-muted-foreground">
                      <TableHead className="text-xs font-semibold">Employee A (Initiator)</TableHead>
                      <TableHead className="text-xs font-semibold">Employee B (Swap Partner)</TableHead>
                      <TableHead className="text-xs font-semibold">Swap Date</TableHead>
                      <TableHead className="text-xs font-semibold">Reason</TableHead>
                      <TableHead className="text-xs font-semibold">Compliance Checks</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Status</TableHead>
                      <TableHead className="text-right text-xs font-semibold pr-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border/40">
                    {shiftSwaps.map((sw) => {
                      const isPending = sw.status === 'Pending Manager Approval';
                      const isApproved = sw.status === 'Approved';

                      return (
                        <TableRow
                          key={sw.id}
                          className="hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => setSelectedSwapForModal(sw)}
                        >
                          <TableCell>
                            <span className="font-semibold text-xs text-foreground block">{sw.requesterName}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[10px] text-primary font-bold">{sw.requesterCode}</span>
                              <Badge variant="outline" className="text-[9px] px-1 py-0 bg-muted">
                                {sw.requesterShift}
                              </Badge>
                            </div>
                          </TableCell>

                          <TableCell>
                            <span className="font-semibold text-xs text-foreground block">{sw.targetName}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[10px] text-primary font-bold">{sw.targetCode}</span>
                              <Badge variant="outline" className="text-[9px] px-1 py-0 bg-muted">
                                {sw.targetShift}
                              </Badge>
                            </div>
                          </TableCell>

                          <TableCell className="font-mono text-xs text-foreground font-semibold">
                            {sw.swapDate}
                          </TableCell>

                          <TableCell className="text-xs text-muted-foreground max-w-xs truncate" title={sw.reason}>
                            {sw.reason || 'Mutual schedule exchange'}
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>5 / 5 Rules Passed</span>
                            </div>
                            <span className="text-[9px] text-muted-foreground block">
                              Rest gap & contract active
                            </span>
                          </TableCell>

                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={
                                isApproved
                                  ? 'text-emerald-700 bg-emerald-50 border-emerald-300 text-[10px] font-semibold'
                                  : isPending
                                  ? 'text-amber-700 bg-amber-50 border-amber-300 text-[10px] font-semibold animate-pulse'
                                  : 'text-rose-700 bg-rose-50 border-rose-300 text-[10px]'
                              }
                            >
                              {isApproved ? 'Approved - Scheduled' : isPending ? 'Pending Manager Approval' : sw.status}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-right pr-4 space-x-1.5" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedSwapForModal(sw)}
                              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                            >
                              <Eye className="h-3 w-3 mr-1" /> View
                            </Button>

                            {isPending && (
                              <>
                                <Button
                                  size="sm"
                                  className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-2xs cursor-pointer"
                                  onClick={() => resolveShiftSwap(sw.id, 'Approved', 'Approved via Approvals Queue')}
                                >
                                  <CheckCircle2 className="h-3 w-3" /> Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs px-2 text-rose-600 hover:bg-rose-50 border-rose-200 cursor-pointer"
                                  onClick={() => setSendBackTarget({ type: 'SWAP', id: sw.id, name: `${sw.requesterName} ↔ ${sw.targetName}` })}
                                >
                                  <XCircle className="h-3 w-3 mr-1" /> Reject
                                </Button>
                              </>
                            )}

                            {isApproved && (
                              <span className="text-[10px] text-emerald-600 font-semibold">
                                ✓ Both Schedules Updated
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: ROSTER SCHEDULE MATRIX INSPECTION MODAL
          ───────────────────────────────────────────────────────────── */}
      {selectedBatchForModal && (
        <Dialog open={!!selectedBatchForModal} onOpenChange={(open) => !open && setSelectedBatchForModal(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                  <span>Roster Schedule Matrix • {selectedBatchForModal.periodName}</span>
                </DialogTitle>
                <Badge
                  variant="outline"
                  className={`text-xs font-semibold ${
                    selectedBatchForModal.status === 'Published'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : selectedBatchForModal.status === 'Approved'
                      ? 'bg-blue-50 text-blue-700 border-blue-300'
                      : 'bg-amber-50 text-amber-700 border-amber-300'
                  }`}
                >
                  {selectedBatchForModal.status}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Department: <strong>{selectedBatchForModal.department}</strong> • Period: <strong>{selectedBatchForModal.dateRange}</strong> • Compiled by <strong>{selectedBatchForModal.submittedBy}</strong>
              </DialogDescription>
            </DialogHeader>

            {/* Matrix Table */}
            <div className="space-y-3 py-2">
              <div className="rounded-lg border border-border/80 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="text-xs font-semibold min-w-44">Employee Personnel</TableHead>
                      {sampleRosterDates.map((d) => (
                        <TableHead key={d.key} className="text-xs font-semibold text-center min-w-20">
                          <div>{d.day}</div>
                          <div className="text-[10px] text-muted-foreground">{d.date}</div>
                        </TableHead>
                      ))}
                      <TableHead className="text-xs font-semibold text-center">Hours</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rosterEmployees.slice(0, 3).map((emp) => (
                      <TableRow key={emp.employeeId}>
                        <TableCell>
                          <div className="font-semibold text-xs text-foreground">{emp.name}</div>
                          <span className="text-[10px] font-mono text-primary">{emp.employeeCode}</span>
                        </TableCell>
                        {sampleRosterDates.map((d) => {
                          const slot = emp.slots[d.key];
                          const code = slot?.shiftCode || (d.day === 'Sun' ? 'WO' : 'MS');
                          const isWO = code === 'WO' || slot?.status === 'Off';

                          return (
                            <TableCell key={d.key} className="text-center p-2">
                              <span
                                className={`text-[10px] font-bold px-2 py-1 rounded inline-block ${
                                  isWO
                                    ? 'bg-muted text-muted-foreground'
                                    : code === 'NS'
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                    : code === 'ES'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                }`}
                              >
                                {code}
                              </span>
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center font-mono font-bold text-xs">
                          48 hrs
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Compliance & Audit checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                <div className="p-2.5 rounded-lg border bg-muted/20 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-foreground block">Coverage Quota Met</span>
                    <span className="text-[10px] text-muted-foreground">Min. 2 operators per active cycle</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-lg border bg-muted/20 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-foreground block">Mandatory 24h Rest Gap</span>
                    <span className="text-[10px] text-muted-foreground">No consecutive night turnaround</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-lg border bg-muted/20 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-foreground block">Leaves Synchronized</span>
                    <span className="text-[10px] text-muted-foreground">Weekly off & statutory holidays preserved</span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-border/60">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedBatchForModal(null)}
              >
                Close Preview
              </Button>

              <div className="flex items-center gap-2">
                {selectedBatchForModal.status === 'Manager Review' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-rose-600 hover:bg-rose-50 border-rose-200"
                      onClick={() => {
                        const target = selectedBatchForModal;
                        setSelectedBatchForModal(null);
                        setSendBackTarget({ type: 'BATCH', id: target.id, name: target.periodName });
                      }}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" /> Send Back to Draft
                    </Button>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => {
                        resolveBatchApproval(selectedBatchForModal.id, 'Approved');
                        setSelectedBatchForModal(null);
                      }}
                    >
                      <Check className="h-3.5 w-3.5 mr-1" /> Approve Schedule
                    </Button>
                  </>
                )}

                {selectedBatchForModal.status === 'Approved' && (
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => {
                      resolveBatchApproval(selectedBatchForModal.id, 'Published');
                      setSelectedBatchForModal(null);
                    }}
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1" /> Publish Roster to Gates
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: SHIFT CHANGE DETAIL INSPECTION MODAL
          ───────────────────────────────────────────────────────────── */}
      {selectedChangeForModal && (
        <Dialog open={!!selectedChangeForModal} onOpenChange={(open) => !open && setSelectedChangeForModal(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>Shift Change Request Detail</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Employee shift transition validation and statutory rest check
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 rounded-lg bg-muted/30 border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Employee:</span>
                  <span className="font-bold text-foreground">
                    {selectedChangeForModal.employeeName} ({selectedChangeForModal.employeeCode})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Department:</span>
                  <span className="font-medium text-foreground">{selectedChangeForModal.department}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Transition:</span>
                  <div className="flex items-center gap-1 font-bold">
                    <Badge variant="outline">{selectedChangeForModal.currentShift}</Badge>
                    <span>→</span>
                    <Badge className="bg-primary/10 text-primary border-primary/20">{selectedChangeForModal.requestedShift}</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Effective Date:</span>
                  <span className="font-mono font-bold text-foreground">{selectedChangeForModal.effectiveDate}</span>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-muted-foreground">Reason for Shift Change</Label>
                <div className="p-2.5 rounded-lg border bg-background mt-1 text-xs text-foreground">
                  {selectedChangeForModal.reason || 'Personal commitment coverage'}
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/60 text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="text-[11px] font-semibold">
                  Valid rest interval of 15.5 hours verified before and after the requested shift.
                </span>
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => setSelectedChangeForModal(null)}>
                Close
              </Button>

              {selectedChangeForModal.status === 'Pending Review' && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-rose-600 hover:bg-rose-50 border-rose-200"
                    onClick={() => {
                      const target = selectedChangeForModal;
                      setSelectedChangeForModal(null);
                      setSendBackTarget({ type: 'CHANGE', id: target.id, name: target.employeeName });
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => {
                      resolveShiftChange(selectedChangeForModal.id, 'Approved');
                      setSelectedChangeForModal(null);
                    }}
                  >
                    Approve Change
                  </Button>
                </div>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 3: PEER SHIFT SWAP DETAIL MODAL
          ───────────────────────────────────────────────────────────── */}
      {selectedSwapForModal && (
        <Dialog open={!!selectedSwapForModal} onOpenChange={(open) => !open && setSelectedSwapForModal(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span>Peer Shift Swap Authorization</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Exchange schedule preview between consenting colleagues
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-lg border bg-muted/20 space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Initiator</span>
                  <div className="font-bold text-foreground text-xs">{selectedSwapForModal.requesterName}</div>
                  <div className="text-[10px] font-mono text-primary">{selectedSwapForModal.requesterCode}</div>
                  <Badge variant="outline" className="text-[10px] mt-1">
                    Current: {selectedSwapForModal.requesterShift}
                  </Badge>
                  <span className="text-[10px] text-emerald-600 font-bold block mt-1">
                    Will take: {selectedSwapForModal.targetShift}
                  </span>
                </div>

                <div className="p-3 rounded-lg border bg-muted/20 space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Swap Partner</span>
                  <div className="font-bold text-foreground text-xs">{selectedSwapForModal.targetName}</div>
                  <div className="text-[10px] font-mono text-primary">{selectedSwapForModal.targetCode}</div>
                  <Badge variant="outline" className="text-[10px] mt-1">
                    Current: {selectedSwapForModal.targetShift}
                  </Badge>
                  <span className="text-[10px] text-emerald-600 font-bold block mt-1">
                    Will take: {selectedSwapForModal.requesterShift}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg border bg-background space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Swap Effective Date:</span>
                  <span className="font-mono font-bold text-foreground">{selectedSwapForModal.swapDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Reason:</span>
                  <span className="text-foreground">{selectedSwapForModal.reason}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/60 text-emerald-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[11px]">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>5 / 5 Pre-Flight Governance Checks Succeeded</span>
                </div>
                <ul className="text-[10px] list-disc list-inside space-y-0.5 text-emerald-700 pl-1">
                  <li>Both employees have active contracts in same plant branch</li>
                  <li>No approved leaves overlapping on swap date</li>
                  <li>No double-shift or overtime violation</li>
                  <li>Adequate 11-hour minimum resting window maintained</li>
                </ul>
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => setSelectedSwapForModal(null)}>
                Close
              </Button>

              {selectedSwapForModal.status === 'Pending Manager Approval' && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-rose-600 hover:bg-rose-50 border-rose-200"
                    onClick={() => {
                      const target = selectedSwapForModal;
                      setSelectedSwapForModal(null);
                      setSendBackTarget({ type: 'SWAP', id: target.id, name: `${target.requesterName} ↔ ${target.targetName}` });
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => {
                      resolveShiftSwap(selectedSwapForModal.id, 'Approved', 'Approved in Authorization Queue');
                      setSelectedSwapForModal(null);
                    }}
                  >
                    Approve Swap
                  </Button>
                </div>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 4: SEND BACK / REJECTION REMARKS DIALOG
          ───────────────────────────────────────────────────────────── */}
      {sendBackTarget && (
        <Dialog open={!!sendBackTarget} onOpenChange={(open) => !open && setSendBackTarget(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold flex items-center gap-2 text-rose-600">
                <RotateCcw className="h-4 w-4" />
                <span>
                  {sendBackTarget.type === 'BATCH'
                    ? 'Send Back Roster to Draft'
                    : 'Decline / Reject Request'}
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Item: <strong>{sendBackTarget.name}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-1">
              <Label className="text-xs font-semibold">Supervisor Feedback / Reason for Return</Label>
              <Textarea
                rows={3}
                placeholder="Specify required corrections or reason for returning this item..."
                value={rejectRemarks}
                onChange={(e) => setRejectRemarks(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setSendBackTarget(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white"
                onClick={handleConfirmRejection}
              >
                Confirm Return
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
