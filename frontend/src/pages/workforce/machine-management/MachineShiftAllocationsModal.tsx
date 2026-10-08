import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Clock,
  Cpu,
  UserCheck,
  Plus,
  GitFork,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Calendar,
} from 'lucide-react';
import type { Machine, MachineAllocation } from '@/api/machine-management';

interface MachineShiftAllocationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machine: Machine | null;
  allocations: MachineAllocation[];
  onAssignNewShift?: (machine: Machine) => void;
  onViewDetails?: (machine: Machine) => void;
}

export function formatAllocationDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function isToday(dateStr?: string): boolean {
  if (!dateStr) return false;
  try {
    const d = new Date(dateStr);
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  } catch {
    return false;
  }
}

export function getShiftTiming(shiftName?: string, start?: string, end?: string): string {
  if (start && end) return `${start}–${end}`;
  const s = (shiftName || '').toLowerCase();
  if (s.includes('morning') || s.includes('shift 1') || s.includes('shift-1') || s.includes('first')) {
    return '06:00–14:00';
  }
  if (
    s.includes('evening') ||
    s.includes('afternoon') ||
    s.includes('shift 2') ||
    s.includes('shift-2') ||
    s.includes('second')
  ) {
    return '14:00–22:00';
  }
  if (s.includes('night') || s.includes('shift 3') || s.includes('shift-3') || s.includes('third')) {
    return '22:00–06:00';
  }
  if (s.includes('general')) {
    return '09:00–18:00';
  }
  return '06:00–14:00';
}

export function isCurrentShiftWindow(shiftName?: string): boolean {
  const hour = new Date().getHours();
  const s = (shiftName || '').toLowerCase();
  if (hour >= 6 && hour < 14) {
    return (
      s.includes('morning') ||
      s.includes('shift 1') ||
      s.includes('shift-1') ||
      s.includes('first') ||
      s.includes('general')
    );
  } else if (hour >= 14 && hour < 22) {
    return (
      s.includes('evening') ||
      s.includes('afternoon') ||
      s.includes('shift 2') ||
      s.includes('shift-2') ||
      s.includes('second')
    );
  } else {
    return (
      s.includes('night') ||
      s.includes('shift 3') ||
      s.includes('shift-3') ||
      s.includes('third')
    );
  }
}

export function getCurrentShiftLabel(): { name: string; timeRange: string } {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 14) {
    return { name: 'Morning Shift', timeRange: '06:00–14:00' };
  } else if (hour >= 14 && hour < 22) {
    return { name: 'Evening Shift', timeRange: '14:00–22:00' };
  } else {
    return { name: 'Night Shift', timeRange: '22:00–06:00' };
  }
}

export function MachineShiftAllocationsModal({
  open,
  onOpenChange,
  machine,
  allocations,
  onAssignNewShift,
  onViewDetails,
}: MachineShiftAllocationsModalProps) {
  if (!machine) return null;

  const currentWindow = getCurrentShiftLabel();
  const now = new Date();
  const currentTimeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Filter all allocations for this machine
  const machineAllocs = useMemo(() => {
    return allocations.filter((a) => a.machineId === machine.id);
  }, [allocations, machine.id]);

  // Sort allocations chronologically by shift: Morning -> Evening -> Night -> General
  const sortedAllocs = useMemo(() => {
    const shiftOrder: Record<string, number> = {
      morning: 1,
      first: 1,
      general: 2,
      evening: 3,
      afternoon: 3,
      second: 3,
      night: 4,
      third: 4,
    };

    const getScore = (shiftName?: string) => {
      const s = (shiftName || '').toLowerCase();
      for (const [key, score] of Object.entries(shiftOrder)) {
        if (s.includes(key)) return score;
      }
      return 5;
    };

    return [...machineAllocs].sort((a, b) => getScore(a.shift) - getScore(b.shift));
  }, [machineAllocs]);

  const activeAllocForWindow = sortedAllocs.find((a) => isCurrentShiftWindow(a.shift));
  const isBroken = machine.status === 'UNDER_MAINTENANCE';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-5 pb-4 bg-muted/30 border-b border-border/60">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <span className="font-mono text-primary">{machine.machineCode}</span>
                  <span>– Shift-wise Allocations</span>
                </DialogTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span className="font-medium text-foreground">{machine.machineName}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <GitFork className="h-3 w-3" />
                    {machine.productionLineName || 'Unassigned Unit'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {isBroken ? (
                <Badge className="text-[10px] font-bold bg-rose-600 text-white">
                  🔴 BREAKDOWN
                </Badge>
              ) : activeAllocForWindow || machine.currentOperatorName ? (
                <Badge className="text-[10px] font-bold bg-emerald-600 text-white">
                  🟢 BUSY
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] font-bold border-emerald-500 text-emerald-600">
                  🟢 AVAILABLE
                </Badge>
              )}
            </div>
          </div>

          {/* Real-time Dynamic Shift Indicator Banner with Live Date & Time */}
          <div className="mt-3.5 p-2.5 rounded-lg bg-primary/5 border border-primary/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                {now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="flex items-center gap-1 font-medium text-foreground">
                <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>{currentTimeFormatted}</span>
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                Active Window:{' '}
                <span className="font-semibold text-primary">
                  {currentWindow.name} ({currentWindow.timeRange})
                </span>
              </span>
            </div>
            {activeAllocForWindow && (
              <Badge variant="secondary" className="text-[10px] gap-1 font-semibold shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Current Operator: {activeAllocForWindow.operatorName}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Content Table */}
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {sortedAllocs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-xs space-y-3">
              <UserCheck className="h-10 w-10 mx-auto opacity-30 text-primary" />
              <div>
                <p className="font-semibold text-sm text-foreground">No shift allocations registered</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Schedule morning, evening, or night shift operators for this machine.
                </p>
              </div>
              {onAssignNewShift && (
                <Button
                  size="sm"
                  className="gap-1.5 text-xs mt-2"
                  onClick={() => {
                    onOpenChange(false);
                    onAssignNewShift(machine);
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Assign Shift Operator
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-border/80 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="text-xs">
                    <TableHead className="font-semibold text-foreground">Date</TableHead>
                    <TableHead className="font-semibold text-foreground">Shift</TableHead>
                    <TableHead className="font-semibold text-foreground">Operator</TableHead>
                    <TableHead className="font-semibold text-foreground">Type</TableHead>
                    <TableHead className="font-semibold text-foreground">Timing</TableHead>
                    <TableHead className="font-semibold text-foreground">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                  {sortedAllocs.map((alloc) => {
                    const isWindowActive = isCurrentShiftWindow(alloc.shift);
                    const timing = getShiftTiming(alloc.shift, alloc.startTime, alloc.endTime);
                    const isInterrupted = isBroken && isWindowActive;

                    return (
                      <TableRow
                        key={alloc.id}
                        className={
                          isWindowActive
                            ? 'bg-primary/5 hover:bg-primary/10 transition-colors font-medium'
                            : 'hover:bg-muted/30 transition-colors'
                        }
                      >
                        {/* Date Column */}
                        <TableCell>
                          <div className="flex items-center gap-1.5 whitespace-nowrap text-xs">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <div>
                              <span className="font-medium text-foreground block">
                                {formatAllocationDate(alloc.allocationDate)}
                              </span>
                              {isToday(alloc.allocationDate) && (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block leading-tight">
                                  Today
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Shift Column */}
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-foreground">{alloc.shift}</span>
                            {isWindowActive && (
                              <Badge className="text-[9px] px-1.5 py-0 h-4 bg-primary text-primary-foreground font-semibold">
                                Live Now
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        {/* Operator Column */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] shrink-0">
                              {alloc.operatorName ? alloc.operatorName.charAt(0) : 'O'}
                            </div>
                            <div>
                              <span className="font-medium text-foreground">
                                {alloc.operatorName || 'Unallocated'}
                              </span>
                              {alloc.operatorCode && (
                                <span className="block text-[10px] text-muted-foreground font-mono">
                                  {alloc.operatorCode}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Type Column */}
                        <TableCell>
                          {alloc.operatorType === 'Contractor' ? (
                            <Badge
                              variant="outline"
                              className="text-[9.5px] px-2 py-0 border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 font-normal"
                            >
                              Contractor
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[9.5px] px-2 py-0 border-indigo-300 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 font-normal"
                            >
                              Permanent
                            </Badge>
                          )}
                        </TableCell>

                        {/* Timing Column */}
                        <TableCell>
                          <span className="font-mono text-muted-foreground text-[11px]">
                            {timing}
                          </span>
                        </TableCell>

                        {/* Status Column */}
                        <TableCell>
                          {isInterrupted ? (
                            <Badge className="text-[10px] font-bold bg-rose-600 text-white gap-1 py-0.5">
                              <AlertCircle className="h-3 w-3" />
                              Interrupted
                            </Badge>
                          ) : isWindowActive && alloc.status === 'ACTIVE' ? (
                            <Badge className="text-[10px] font-bold bg-emerald-600 text-white gap-1 py-0.5">
                              <CheckCircle2 className="h-3 w-3" />
                              Active
                            </Badge>
                          ) : alloc.status === 'COMPLETED' ? (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">
                              Completed
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px] font-medium text-muted-foreground">
                              Scheduled
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 bg-muted/20 border-t border-border/60 flex items-center justify-between sm:justify-between">
          <div className="flex items-center gap-2">
            {onViewDetails && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs gap-1.5 text-muted-foreground"
                onClick={() => {
                  onOpenChange(false);
                  onViewDetails(machine);
                }}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View Machine Full Page
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onAssignNewShift && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs gap-1.5"
                onClick={() => {
                  onOpenChange(false);
                  onAssignNewShift(machine);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Shift Allocation
              </Button>
            )}
            <Button size="sm" onClick={() => onOpenChange(false)} className="text-xs">
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
