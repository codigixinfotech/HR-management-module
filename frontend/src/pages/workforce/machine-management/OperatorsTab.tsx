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
  Eye,
  Plus,
  UserCheck,
  Award,
  ShieldCheck,
  RotateCcw,
  Trash2,
  GitFork,
  Cpu,
} from 'lucide-react';
import type { MachineOperator, Machine, ProductionLine, MachineAllocation } from '@/api/machine-management';
import type { Branch } from '@/api/types';

interface OperatorsTabProps {
  operators: MachineOperator[];
  branches: Branch[];
  machines?: Machine[];
  productionLines?: ProductionLine[];
  allocations?: MachineAllocation[];
  loading: boolean;
  onViewOperator: (operator: MachineOperator) => void;
  onAddOperator: () => void;
  onAssignToMachine: (operator: MachineOperator) => void;
  onDeleteOperator: (operator: MachineOperator) => void;
}

export function OperatorsTab({
  operators,
  branches,
  machines = [],
  productionLines = [],
  allocations = [],
  loading,
  onViewOperator,
  onAddOperator,
  onAssignToMachine,
  onDeleteOperator,
}: OperatorsTabProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const handleReset = () => {
    setSearch('');
    setTypeFilter('ALL');
    setBranchFilter('ALL');
    setStatusFilter('ALL');
  };

  const filteredOperators = operators.filter((op) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      op.operatorName.toLowerCase().includes(q) ||
      op.operatorCode.toLowerCase().includes(q) ||
      op.skill.toLowerCase().includes(q) ||
      (op.certification && op.certification.toLowerCase().includes(q));

    const matchesType = typeFilter === 'ALL' || op.operatorType === typeFilter;
    const matchesBranch =
      branchFilter === 'ALL' ||
      (branchFilter === 'HEAD_OFFICE' && (!op.branchId || op.branchId === 'HEAD_OFFICE')) ||
      op.branchId === branchFilter;
    const matchesStatus = statusFilter === 'ALL' || op.status === statusFilter;

    return matchesSearch && matchesType && matchesBranch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <Card className="shadow-2xs">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="relative flex-1 min-w-[180px] sm:min-w-[220px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search operator name, code, skill, certification..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[115px] h-8 text-xs px-2 shrink-0">
                <SelectValue placeholder="Workforce Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="Employee">Employee</SelectItem>
                <SelectItem value="Contractor">Contractor</SelectItem>
              </SelectContent>
            </Select>

            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-[110px] h-8 text-xs px-2 shrink-0">
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

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[110px] h-8 text-xs px-2 shrink-0">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="Allocated">Allocated</SelectItem>
                <SelectItem value="On Leave">On Leave</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs text-muted-foreground shrink-0 gap-1"
              onClick={handleReset}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Operators Table */}
      <Card className="shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="text-xs">
                <TableHead className="font-semibold text-foreground">Operator</TableHead>
                <TableHead className="font-semibold text-foreground">Type</TableHead>
                <TableHead className="font-semibold text-foreground">Operational Unit</TableHead>
                <TableHead className="font-semibold text-foreground">Current Machine</TableHead>
                <TableHead className="font-semibold text-foreground">Current Shift</TableHead>
                <TableHead className="font-semibold text-foreground">Status</TableHead>
                <TableHead className="text-right font-semibold text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7} className="py-4 text-center">
                      <div className="h-5 bg-muted animate-pulse rounded w-3/4 mx-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredOperators.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    <p className="font-medium text-sm">No machine operators found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Mark employees or contract workers as eligible machine operators.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 gap-1.5"
                      onClick={onAddOperator}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Operator
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOperators.map((op) => {
                  const activeMachine = machines.find(
                    (m) => m.id === op.currentMachineId || m.currentOperatorName === op.operatorName
                  );
                  const activeAlloc = allocations.find(
                    (a) =>
                      (a.operatorId === op.id || a.operatorName === op.operatorName) &&
                      (a.status === 'ACTIVE' || a.status === 'Allocated')
                  );

                  const opUnitName =
                    op.currentLineName ||
                    activeMachine?.productionLineName ||
                    activeAlloc?.lineName ||
                    null;

                  const currentMachineCode =
                    op.currentMachineCode || activeMachine?.machineCode || activeAlloc?.machineCode || null;
                  const currentMachineName =
                    op.currentMachineName || activeMachine?.machineName || activeAlloc?.machineName || null;

                  const currentShift =
                    op.currentShift || activeMachine?.currentShift || activeAlloc?.shift || null;

                  const isMachineBreakdown =
                    activeMachine?.status === 'UNDER_MAINTENANCE' || activeAlloc?.status === 'INTERRUPTED';
                  const isWorking =
                    !isMachineBreakdown &&
                    Boolean(
                      op.status === 'Allocated' ||
                        op.currentMachineId ||
                        activeAlloc ||
                        activeMachine?.currentOperatorName === op.operatorName
                    );

                  return (
                    <TableRow
                      key={op.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => onViewOperator(op)}
                    >
                      {/* Operator Column */}
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            {op.operatorName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{op.operatorName}</p>
                            <p className="text-[11px] text-muted-foreground font-mono">
                              {op.operatorCode} {op.contractorAgency ? `• ${op.contractorAgency}` : ''}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Type Column */}
                      <TableCell>
                        {op.operatorType === 'Contractor' ? (
                          <Badge
                            variant="outline"
                            className="text-[9.5px] px-2 py-0.5 border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700 font-normal"
                          >
                            Contractor
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[9.5px] px-2 py-0.5 border-indigo-300 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-700 font-normal"
                          >
                            Permanent
                          </Badge>
                        )}
                      </TableCell>

                      {/* Operational Unit Column */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <GitFork className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="font-medium text-foreground">
                            {opUnitName || <span className="text-muted-foreground italic font-normal">—</span>}
                          </span>
                        </div>
                      </TableCell>

                      {/* Current Machine Column */}
                      <TableCell>
                        {currentMachineCode ? (
                          <div>
                            <span className="font-mono font-semibold text-primary">
                              {currentMachineCode}
                            </span>
                            {currentMachineName && (
                              <span className="block text-[10.5px] text-muted-foreground truncate max-w-[140px]">
                                {currentMachineName}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">—</span>
                        )}
                      </TableCell>

                      {/* Current Shift Column */}
                      <TableCell>
                        {currentShift ? (
                          <Badge variant="secondary" className="text-[10px] font-medium">
                            {currentShift}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* Status Column */}
                      <TableCell>
                        {isMachineBreakdown ? (
                          <Badge className="text-[10px] font-bold bg-rose-600 hover:bg-rose-600 text-white gap-1 py-0.5">
                            🔴 Blocked
                          </Badge>
                        ) : isWorking ? (
                          <Badge className="text-[10px] font-bold bg-emerald-600 hover:bg-emerald-600 text-white gap-1 py-0.5">
                            🟢 Working
                          </Badge>
                        ) : op.status === 'On Leave' ? (
                          <Badge variant="warning" className="text-[10px] font-semibold gap-1">
                            🟡 On Leave
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] font-semibold gap-1 text-muted-foreground border-muted-foreground/30">
                            ⚪ Available
                          </Badge>
                        )}
                      </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 text-xs">
                          <DropdownMenuItem onClick={() => onViewOperator(op)}>
                            <Eye className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                            View Details
                          </DropdownMenuItem>
                          {op.status === 'Available' && (
                            <DropdownMenuItem onClick={() => onAssignToMachine(op)}>
                              <UserCheck className="h-3.5 w-3.5 mr-2 text-primary" />
                              Assign Machine
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDeleteOperator(op)}
                            className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Delete Operator
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
