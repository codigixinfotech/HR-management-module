import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  MoreVertical,
  Plus,
  CheckCircle2,
  XCircle,
  Wrench,
  RotateCcw,
  Gauge,
  Calendar,
} from 'lucide-react';
import type {
  MachineAllocation,
  ProductionLine,
  Machine,
  MachineOperator,
} from '@/api/machine-management';
import type { Branch } from '@/api/types';
import { toast } from 'sonner';

interface AllocationsTabProps {
  allocations: MachineAllocation[];
  productionLines: ProductionLine[];
  machines: Machine[];
  operators: MachineOperator[];
  branches: Branch[];
  loading: boolean;
  onAssignOperator: () => void;
  onCompleteAllocation: (allocation: MachineAllocation) => void;
  onCancelAllocation: (allocation: MachineAllocation) => void;
  onStartMaintenance: (machineId: string) => void;
  onViewMachine: (machineId: string) => void;
}

export function AllocationsTab({
  allocations,
  productionLines,
  machines,
  operators,
  branches,
  loading,
  onAssignOperator,
  onCompleteAllocation,
  onCancelAllocation,
  onStartMaintenance,
  onViewMachine,
}: AllocationsTabProps) {
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [lineFilter, setLineFilter] = useState('ALL');
  const [shiftFilter, setShiftFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const handleReset = () => {
    setSearch('');
    setBranchFilter('ALL');
    setLineFilter('ALL');
    setShiftFilter('ALL');
    setStatusFilter('ALL');
  };

  const filteredAllocations = allocations.filter((a) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (a.lineName && a.lineName.toLowerCase().includes(q)) ||
      (a.machineName && a.machineName.toLowerCase().includes(q)) ||
      (a.machineCode && a.machineCode.toLowerCase().includes(q)) ||
      (a.operatorName && a.operatorName.toLowerCase().includes(q)) ||
      (a.workOrder && a.workOrder.toLowerCase().includes(q));

    const matchesBranch =
      branchFilter === 'ALL' ||
      (branchFilter === 'HEAD_OFFICE' && (!a.branchId || a.branchId === 'HEAD_OFFICE')) ||
      a.branchId === branchFilter;

    const matchesLine = lineFilter === 'ALL' || a.productionLineId === lineFilter;
    const matchesShift = shiftFilter === 'ALL' || a.shift === shiftFilter;
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;

    return matchesSearch && matchesBranch && matchesLine && matchesShift && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <Card className="shadow-2xs">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search line, machine, operator, work order..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger className="w-[140px] h-9 text-xs">
                  <SelectValue placeholder="Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Branches</SelectItem>
                  <SelectItem value="HEAD_OFFICE">Head Office</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={lineFilter} onValueChange={setLineFilter}>
                <SelectTrigger className="w-[150px] h-9 text-xs">
                  <SelectValue placeholder="Line" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Lines</SelectItem>
                  {productionLines.map((pl) => (
                    <SelectItem key={pl.id} value={pl.id}>
                      {pl.lineCode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={shiftFilter} onValueChange={setShiftFilter}>
                <SelectTrigger className="w-[130px] h-9 text-xs">
                  <SelectValue placeholder="Shift" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Shifts</SelectItem>
                  <SelectItem value="Morning (A)">Morning (A)</SelectItem>
                  <SelectItem value="Evening (B)">Evening (B)</SelectItem>
                  <SelectItem value="Night (C)">Night (C)</SelectItem>
                  <SelectItem value="General (G)">General (G)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px] h-9 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="INTERRUPTED">Interrupted</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                className="h-9 px-2.5 text-xs text-muted-foreground"
                onClick={handleReset}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Reset
              </Button>

              <Button size="sm" className="h-9 gap-1.5 text-xs" onClick={onAssignOperator}>
                <Plus className="h-3.5 w-3.5" />
                Assign Line Operator
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Allocations Table */}
      <Card className="shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="text-xs">
                <TableHead className="font-semibold text-foreground">Production Line</TableHead>
                <TableHead className="font-semibold text-foreground">Machine Equipment</TableHead>
                <TableHead className="font-semibold text-foreground">Assigned Operator</TableHead>
                <TableHead className="font-semibold text-foreground">Type</TableHead>
                <TableHead className="font-semibold text-foreground">Shift Duty</TableHead>
                <TableHead className="font-semibold text-foreground">Line Efficiency</TableHead>
                <TableHead className="font-semibold text-foreground">Status</TableHead>
                <TableHead className="text-right font-semibold text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8} className="py-4 text-center">
                      <div className="h-5 bg-muted animate-pulse rounded w-3/4 mx-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredAllocations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    <p className="font-medium text-sm">No machine allocations found</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 gap-1.5"
                      onClick={onAssignOperator}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Assign Operator
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAllocations.map((a) => (
                  <TableRow key={a.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <span className="font-medium text-foreground">
                        {a.lineName || 'Main Factory Line'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-semibold text-primary">{a.machineCode}</span>
                        <span className="text-foreground ml-1.5 font-medium">{a.machineName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-foreground">{a.operatorName}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {a.operatorType || 'Employee'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">
                        {a.shift}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {a.efficiency ? `${Number(a.efficiency).toFixed(1)}%` : '96.2%'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          a.status === 'ACTIVE'
                            ? 'success'
                            : a.status === 'COMPLETED'
                            ? 'secondary'
                            : a.status === 'INTERRUPTED'
                            ? 'warning'
                            : 'outline'
                        }
                        className="text-[11px] capitalize"
                      >
                        ● {a.status.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {a.status === 'ACTIVE' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-amber-600 border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 gap-1"
                              onClick={() => onStartMaintenance(a.machineId)}
                            >
                              <Wrench className="h-3 w-3" />
                              Mark Maint.
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 gap-1"
                              onClick={() => onCompleteAllocation(a)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Complete
                            </Button>
                          </>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36 text-xs">
                            <DropdownMenuItem onClick={() => onViewMachine(a.machineId)}>
                              View Machine
                            </DropdownMenuItem>
                            {a.status === 'ACTIVE' && (
                              <>
                                <DropdownMenuItem onClick={() => onCompleteAllocation(a)}>
                                  Mark Complete
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => onCancelAllocation(a)}
                                  className="text-rose-600"
                                >
                                  Cancel Assignment
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
