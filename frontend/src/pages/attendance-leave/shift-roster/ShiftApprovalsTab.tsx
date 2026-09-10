import { useState } from 'react';
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
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useShiftRosterStore } from './shiftRosterStore';

export function ShiftApprovalsTab() {
  const {
    batchApprovals,
    shiftChanges,
    shiftSwaps,
    resolveBatchApproval,
    resolveShiftChange,
    resolveShiftSwap,
  } = useShiftRosterStore();

  const [activeCategory, setActiveCategory] = useState<'ROSTERS' | 'CHANGES' | 'SWAPS'>('ROSTERS');

  const pendingBatches = batchApprovals.filter((b) => b.status === 'Manager Review' || b.status === 'Draft');
  const pendingChanges = shiftChanges.filter((c) => c.status === 'Pending Review');
  const pendingSwaps = shiftSwaps.filter((s) => s.status === 'Pending Manager Approval');

  return (
    <div className="space-y-5">
      {/* 4-Step Approval & Publishing Lifecycle Visualizer */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" /> Shift & Roster Publication Governance Workflow
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Rosters remain in draft mode until approved and published. Once published, Face ID and attendance engines sync immediately.
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-semibold bg-background">
            Four-Stage Lifecycle
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
          <div className="rounded-lg border bg-background/80 p-3 shadow-2xs relative">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Step 1</span>
            <p className="text-xs font-semibold text-foreground mt-0.5">Draft Schedule</p>
            <p className="text-[10px] text-muted-foreground">Supervisor creates shift allocations</p>
            <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 bg-card rounded-full border p-0.5 text-muted-foreground">
              <ArrowRight className="h-3 w-3" />
            </div>
          </div>

          <div className="rounded-lg border bg-background/80 p-3 shadow-2xs relative">
            <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">Step 2</span>
            <p className="text-xs font-semibold text-foreground mt-0.5">Manager Review</p>
            <p className="text-[10px] text-muted-foreground">Headcount & rest rules checked</p>
            <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 bg-card rounded-full border p-0.5 text-muted-foreground">
              <ArrowRight className="h-3 w-3" />
            </div>
          </div>

          <div className="rounded-lg border bg-background/80 p-3 shadow-2xs relative">
            <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Step 3</span>
            <p className="text-xs font-semibold text-foreground mt-0.5">Approved</p>
            <p className="text-[10px] text-muted-foreground">Operations lead signs off</p>
            <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 bg-card rounded-full border p-0.5 text-muted-foreground">
              <ArrowRight className="h-3 w-3" />
            </div>
          </div>

          <div className="rounded-lg border bg-background/80 p-3 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Step 4</span>
            <p className="text-xs font-semibold text-foreground mt-0.5">Published</p>
            <p className="text-[10px] text-muted-foreground">Visible to employees & Face punch</p>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-2">
        <Button
          size="sm"
          variant={activeCategory === 'ROSTERS' ? 'default' : 'outline'}
          className="h-8 text-xs gap-1.5"
          onClick={() => setActiveCategory('ROSTERS')}
        >
          <FileCheck className="h-3.5 w-3.5" />
          Roster Period Batches
          {pendingBatches.length > 0 && (
            <Badge className="ml-1 h-4 px-1 text-[9px] bg-amber-500 text-white font-bold">
              {pendingBatches.length}
            </Badge>
          )}
        </Button>

        <Button
          size="sm"
          variant={activeCategory === 'CHANGES' ? 'default' : 'outline'}
          className="h-8 text-xs gap-1.5"
          onClick={() => setActiveCategory('CHANGES')}
        >
          <Clock className="h-3.5 w-3.5" />
          Individual Shift Changes
          {pendingChanges.length > 0 && (
            <Badge className="ml-1 h-4 px-1 text-[9px] bg-amber-500 text-white font-bold">
              {pendingChanges.length}
            </Badge>
          )}
        </Button>

        <Button
          size="sm"
          variant={activeCategory === 'SWAPS' ? 'default' : 'outline'}
          className="h-8 text-xs gap-1.5"
          onClick={() => setActiveCategory('SWAPS')}
        >
          <Users className="h-3.5 w-3.5" />
          Peer Shift Swaps
          {pendingSwaps.length > 0 && (
            <Badge className="ml-1 h-4 px-1 text-[9px] bg-amber-500 text-white font-bold">
              {pendingSwaps.length}
            </Badge>
          )}
        </Button>
      </div>

      {/* Roster Batches Section */}
      {activeCategory === 'ROSTERS' && (
        <Card className="shadow-xs border-border/80">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-primary" /> Roster Schedule Batches Awaiting Sign-off
            </CardTitle>
            <CardDescription className="text-xs">
              Review and publish weekly/monthly schedules compiled by department supervisors
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <div className="rounded-md border border-border/80 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs font-semibold">Schedule Period</TableHead>
                    <TableHead className="text-xs font-semibold">Department</TableHead>
                    <TableHead className="text-xs font-semibold">Date Range</TableHead>
                    <TableHead className="text-xs font-semibold">Headcount</TableHead>
                    <TableHead className="text-xs font-semibold">Submitted By</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-right text-xs font-semibold">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batchApprovals.map((batch) => (
                    <TableRow key={batch.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <span className="font-semibold text-xs text-foreground">{batch.periodName}</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-medium">
                        {batch.department}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-foreground">
                        {batch.dateRange}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-primary">
                        {batch.headcount} Personnel
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {batch.submittedBy}
                      </TableCell>
                      <TableCell>
                        {batch.status === 'Draft' && (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            Draft
                          </Badge>
                        )}
                        {batch.status === 'Manager Review' && (
                          <Badge variant="outline" className="text-[10px] font-semibold text-amber-600 bg-amber-50 border-amber-300 dark:bg-amber-950/40">
                            Manager Review
                          </Badge>
                        )}
                        {batch.status === 'Approved' && (
                          <Badge variant="outline" className="text-[10px] font-semibold text-blue-600 bg-blue-50 border-blue-300 dark:bg-blue-950/40">
                            Approved
                          </Badge>
                        )}
                        {batch.status === 'Published' && (
                          <Badge variant="outline" className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40">
                            Published & Live
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {batch.status !== 'Published' ? (
                          <Button
                            size="sm"
                            className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                            onClick={() => {
                              resolveBatchApproval(batch.id, 'Published');
                              toast.success(`Schedule batch "${batch.periodName}" published! Live on employee attendance terminals.`);
                            }}
                          >
                            <Send className="h-3 w-3" /> Approve & Publish
                          </Button>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-medium">Active on Gates</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shift Changes Section */}
      {activeCategory === 'CHANGES' && (
        <Card className="shadow-xs border-border/80">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Shift Modification Requests
            </CardTitle>
            <CardDescription className="text-xs">
              Approve employee requests to transition between morning, evening, or night shifts
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <div className="rounded-md border border-border/80 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs font-semibold">Employee</TableHead>
                    <TableHead className="text-xs font-semibold">Department</TableHead>
                    <TableHead className="text-xs font-semibold">Change Request</TableHead>
                    <TableHead className="text-xs font-semibold">Effective Date</TableHead>
                    <TableHead className="text-xs font-semibold">Reason</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-right text-xs font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shiftChanges.map((sc) => (
                    <TableRow key={sc.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-primary">{sc.employeeCode}</span>
                          <span className="text-xs font-semibold text-foreground">{sc.employeeName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-medium">
                        {sc.department}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-semibold text-foreground">{sc.currentShift} → {sc.requestedShift}</span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-foreground font-medium">
                        {sc.effectiveDate}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                        {sc.reason}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-semibold">
                          {sc.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {sc.status === 'Pending Review' ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                              onClick={() => {
                                resolveShiftChange(sc.id, 'Approved');
                                toast.success(`Approved shift change for ${sc.employeeName}`);
                              }}
                            >
                              <CheckCircle2 className="h-3 w-3" /> Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              onClick={() => {
                                resolveShiftChange(sc.id, 'Rejected');
                                toast.info('Shift change rejected');
                              }}
                            >
                              <XCircle className="h-3 w-3" /> Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">Processed</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shift Swaps Section */}
      {activeCategory === 'SWAPS' && (
        <Card className="shadow-xs border-border/80">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Peer Shift Swap Approval Queue
            </CardTitle>
            <CardDescription className="text-xs">
              Mutual colleague shift exchanges ready for supervisory endorsement
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <div className="rounded-md border border-border/80 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs font-semibold">Initiator</TableHead>
                    <TableHead className="text-xs font-semibold">Swap Partner</TableHead>
                    <TableHead className="text-xs font-semibold">Date</TableHead>
                    <TableHead className="text-xs font-semibold">Reason</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-right text-xs font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shiftSwaps.map((sw) => (
                    <TableRow key={sw.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <span className="font-semibold text-xs text-foreground">{sw.requesterName}</span>
                        <p className="text-[10px] text-muted-foreground">{sw.requesterShift}</p>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-xs text-foreground">{sw.targetName}</span>
                        <p className="text-[10px] text-muted-foreground">{sw.targetShift}</p>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-foreground">
                        {sw.swapDate}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                        {sw.reason}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-semibold">
                          {sw.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {sw.status === 'Pending Manager Approval' ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                              onClick={() => {
                                resolveShiftSwap(sw.id, 'Approved');
                                toast.success(`Approved swap between ${sw.requesterName} and ${sw.targetName}`);
                              }}
                            >
                              <CheckCircle2 className="h-3 w-3" /> Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              onClick={() => {
                                resolveShiftSwap(sw.id, 'Rejected');
                                toast.info('Swap rejected');
                              }}
                            >
                              <XCircle className="h-3 w-3" /> Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">Processed</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
