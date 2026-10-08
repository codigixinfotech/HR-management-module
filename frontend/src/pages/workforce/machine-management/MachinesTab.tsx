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
  Edit,
  UserCheck,
  Wrench,
  History,
  Power,
  RotateCcw,
  Plus,
  GitFork,
  QrCode,
  ScanLine,
  Trash2,
  AlertOctagon,
  CalendarCheck,
} from 'lucide-react';
import type { Machine, ProductionLine, MachineAllocation } from '@/api/machine-management';
import type { Branch, Department } from '@/api/types';
import { toast } from 'sonner';
import { MachineQrModal } from './MachineQrModal';
import { ScanQrModal } from './ScanQrModal';
import { ReportBreakdownModal } from './ReportBreakdownModal';
import {
  MachineShiftAllocationsModal,
  isCurrentShiftWindow,
} from './MachineShiftAllocationsModal';

interface MachinesTabProps {
  machines: Machine[];
  productionLines: ProductionLine[];
  branches: Branch[];
  departments: Department[];
  allocations?: MachineAllocation[];
  loading: boolean;
  onViewDetails: (machine: Machine) => void;
  onEditMachine: (machine: Machine) => void;
  onAssignOperator: (machine: Machine) => void;
  onStartMaintenance: (machine: Machine) => void;
  onToggleStatus: (machine: Machine) => void;
  onDeleteMachine: (machine: Machine) => void;
  onOpenAddMachine: () => void;
  onOpen360?: (machine: Machine) => void;
  onMachineUpdated?: (machine: Machine) => void;
}

const MACHINE_TYPES = [
  'ALL',
  'CNC',
  'Welding',
  'Packaging',
  'Injection Molding',
  'Stamping Press',
  'Laser Cutting',
  'Assembly Rig',
  'Quality Scanner',
];

export function MachinesTab({
  machines,
  productionLines,
  branches,
  departments,
  allocations = [],
  loading,
  onViewDetails,
  onEditMachine,
  onAssignOperator,
  onStartMaintenance,
  onToggleStatus,
  onDeleteMachine,
  onOpenAddMachine,
  onOpen360,
  onMachineUpdated,
}: MachinesTabProps) {
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [lineFilter, setLineFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [maintFilter, setMaintFilter] = useState('ALL');

  // QR Modal States
  const [selectedQrMachine, setSelectedQrMachine] = useState<Machine | null>(null);
  const [openQrModal, setOpenQrModal] = useState(false);
  const [openScanModal, setOpenScanModal] = useState(false);

  // Breakdown Modal States
  const [selectedBreakdownMachine, setSelectedBreakdownMachine] = useState<Machine | null>(null);
  const [openBreakdownModal, setOpenBreakdownModal] = useState(false);

  // Shift-wise Allocations Modal States
  const [selectedAllocMachine, setSelectedAllocMachine] = useState<Machine | null>(null);
  const [openAllocModal, setOpenAllocModal] = useState(false);

  const handleReset = () => {
    setSearch('');
    setBranchFilter('ALL');
    setDeptFilter('ALL');
    setLineFilter('ALL');
    setTypeFilter('ALL');
    setStatusFilter('ALL');
    setMaintFilter('ALL');
  };

  const filteredMachines = machines.filter((m) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      m.machineCode.toLowerCase().includes(q) ||
      m.machineName.toLowerCase().includes(q) ||
      (m.serialNumber && m.serialNumber.toLowerCase().includes(q)) ||
      (m.productionLineName && m.productionLineName.toLowerCase().includes(q));

    const matchesBranch =
      branchFilter === 'ALL' ||
      (branchFilter === 'HEAD_OFFICE' && (!m.branchId || m.branchId === 'HEAD_OFFICE')) ||
      m.branchId === branchFilter;

    const matchesDept = deptFilter === 'ALL' || m.departmentId === deptFilter;
    const matchesLine = lineFilter === 'ALL' || m.productionLineId === lineFilter;
    const matchesType = typeFilter === 'ALL' || m.machineType === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
    const matchesMaint = maintFilter === 'ALL' || m.maintenanceDueStatus === maintFilter;

    return (
      matchesSearch &&
      matchesBranch &&
      matchesDept &&
      matchesLine &&
      matchesType &&
      matchesStatus &&
      matchesMaint
    );
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <Card className="shadow-2xs">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px] sm:min-w-[220px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search machine code, name, serial number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>

            {/* Branch Filter */}
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

            {/* Department Filter */}
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-[100px] h-8 text-xs px-2 shrink-0">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Depts</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Operational Unit Filter */}
            <Select value={lineFilter} onValueChange={setLineFilter}>
              <SelectTrigger className="w-[110px] h-8 text-xs px-2 shrink-0">
                <SelectValue placeholder="Operational Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Units</SelectItem>
                {productionLines.map((pl) => (
                  <SelectItem key={pl.id} value={pl.id}>
                    {pl.lineCode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Machine Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[100px] h-8 text-xs px-2 shrink-0">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {MACHINE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t === 'ALL' ? 'All Types' : t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[105px] h-8 text-xs px-2 shrink-0">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="UNDER_MAINTENANCE">Under Maint.</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="RETIRED">Retired</SelectItem>
              </SelectContent>
            </Select>

            {/* Maintenance Health Filter */}
            <Select value={maintFilter} onValueChange={setMaintFilter}>
              <SelectTrigger className="w-[125px] h-8 text-xs px-2 shrink-0">
                <SelectValue placeholder="Maintenance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Maintenance</SelectItem>
                <SelectItem value="OVERDUE">🔴 Overdue</SelectItem>
                <SelectItem value="DUE_TODAY">🟠 Due Today</SelectItem>
                <SelectItem value="UPCOMING">🟡 Upcoming Due</SelectItem>
                <SelectItem value="NORMAL">🟢 Healthy</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 gap-1 text-xs font-medium border-primary/30 text-primary hover:bg-primary/5 shrink-0"
              onClick={() => setOpenScanModal(true)}
            >
              <ScanLine className="h-3.5 w-3.5" />
              Scan QR
            </Button>

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

      {/* Machine Table */}
      <Card className="shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="text-xs">
                <TableHead className="font-semibold text-foreground">Machine</TableHead>
                <TableHead className="font-semibold text-foreground">Operational Unit</TableHead>
                <TableHead className="font-semibold text-foreground">Current Operator</TableHead>
                <TableHead className="font-semibold text-foreground">Current Shift</TableHead>
                <TableHead className="font-semibold text-foreground">Status</TableHead>
                <TableHead className="font-semibold text-foreground">Maintenance</TableHead>
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
              ) : filteredMachines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    <p className="font-medium text-sm">No machines found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Try adjusting filters or add a new machine to the registry.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 gap-1.5"
                      onClick={onOpenAddMachine}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Machine
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMachines.map((m) => {
                  const machineAllocs = (allocations || []).filter((a) => a.machineId === m.id);
                  const activeShiftAlloc =
                    machineAllocs.find(
                      (a) =>
                        isCurrentShiftWindow(a.shift) &&
                        (a.status === 'ACTIVE' || a.status === 'INTERRUPTED')
                    ) ||
                    machineAllocs.find((a) => isCurrentShiftWindow(a.shift)) ||
                    machineAllocs.find((a) => a.status === 'ACTIVE') ||
                    machineAllocs[0];

                  const displayOperator = activeShiftAlloc?.operatorName || m.currentOperatorName;
                  const displayType = activeShiftAlloc?.operatorType || m.currentOperatorType;
                  const displayShift = activeShiftAlloc?.shift || m.currentShift;

                  return (
                    <TableRow
                      key={m.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedAllocMachine(m);
                        setOpenAllocModal(true);
                      }}
                    >
                      {/* Machine Column */}
                      <TableCell>
                        <div className="font-mono font-semibold text-primary">{m.machineCode}</div>
                        <div className="font-medium text-foreground text-xs">{m.machineName}</div>
                        <span className="text-[10.5px] text-muted-foreground">{m.machineType}</span>
                      </TableCell>

                      {/* Operational Unit Column */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <GitFork className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="font-medium">
                            {m.productionLineName || (
                              <span className="text-muted-foreground italic">Unassigned</span>
                            )}
                          </span>
                        </div>
                        {m.productionLineCode && (
                          <span className="text-[10px] text-muted-foreground font-mono ml-4.5">
                            {m.productionLineCode}
                          </span>
                        )}
                      </TableCell>

                      {/* Current Operator Column */}
                      <TableCell>
                        {displayOperator ? (
                          <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                            <span className="font-medium text-foreground">{displayOperator}</span>
                            {displayType === 'Contractor' ? (
                              <Badge
                                variant="outline"
                                className="text-[9px] px-1 py-0 h-4 border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700 font-normal"
                              >
                                Contractor
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-[9px] px-1 py-0 h-4 border-indigo-300 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-700 font-normal"
                              >
                                Permanent
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">—</span>
                        )}
                      </TableCell>

                      {/* Current Shift Column */}
                      <TableCell>
                        {displayShift ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant="secondary" className="text-[10px] font-medium">
                              {displayShift}
                            </Badge>
                            {machineAllocs.length > 1 && (
                              <Badge
                                variant="outline"
                                className="text-[9px] font-mono cursor-pointer hover:bg-muted text-muted-foreground border-dashed"
                                title="Click to view all shift-wise allocations"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAllocMachine(m);
                                  setOpenAllocModal(true);
                                }}
                              >
                                +{machineAllocs.length} shifts
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* Status Column: BUSY / AVAILABLE / BREAKDOWN */}
                      <TableCell>
                        {m.status === 'UNDER_MAINTENANCE' ? (
                          <Badge className="text-[10px] font-bold bg-rose-600 hover:bg-rose-600 text-white gap-1 py-0.5">
                            🔴 BREAKDOWN
                          </Badge>
                        ) : displayOperator || m.currentAllocationStatus === 'ACTIVE' ? (
                          <Badge className="text-[10px] font-bold bg-emerald-600 hover:bg-emerald-600 text-white gap-1 py-0.5">
                            🟢 BUSY
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] font-bold border-emerald-500 text-emerald-600 dark:text-emerald-400 gap-1 py-0.5">
                            🟢 AVAILABLE
                          </Badge>
                        )}
                      </TableCell>

                      {/* Maintenance Column */}
                      <TableCell>
                        <Badge
                          variant={
                            m.status === 'UNDER_MAINTENANCE' || m.maintenanceDueStatus === 'OVERDUE'
                              ? 'destructive'
                              : m.maintenanceDueStatus === 'DUE_TODAY'
                              ? 'warning'
                              : m.maintenanceDueStatus === 'UPCOMING'
                              ? 'outline'
                              : 'secondary'
                          }
                          className="text-[10px] font-medium whitespace-nowrap"
                          title={`Next Scheduled: ${m.nextMaintenanceDate ? m.nextMaintenanceDate.slice(0, 10) : 'None'}`}
                        >
                          {m.status === 'UNDER_MAINTENANCE'
                            ? '🔴 Repair'
                            : m.maintenanceDueStatus === 'OVERDUE'
                            ? '🔴 Overdue'
                            : m.maintenanceDueStatus === 'DUE_TODAY'
                            ? '🟠 Due Today'
                            : m.maintenanceDueStatus === 'UPCOMING'
                            ? '🟡 Upcoming'
                            : '🟢 Healthy'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                            title="360° Equipment Interactive Viewer"
                            onClick={() => onOpen360?.(m)}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                            title="View & Print QR Asset Tag"
                            onClick={() => {
                              setSelectedQrMachine(m);
                              setOpenQrModal(true);
                            }}
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 text-xs">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedAllocMachine(m);
                                  setOpenAllocModal(true);
                                }}
                                className="font-medium cursor-pointer"
                              >
                                <CalendarCheck className="h-3.5 w-3.5 mr-2 text-indigo-600" />
                                View Allocations {machineAllocs.length > 0 ? `(${machineAllocs.length})` : ''}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onViewDetails(m)}>
                                <Eye className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onOpen360?.(m)}>
                                <RotateCcw className="h-3.5 w-3.5 mr-2 text-indigo-600" />
                                360° Interactive View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedQrMachine(m);
                                  setOpenQrModal(true);
                                }}
                              >
                                <QrCode className="h-3.5 w-3.5 mr-2 text-primary" />
                                Asset QR Tag
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onEditMachine(m)}>
                                <Edit className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                Edit Machine
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onAssignOperator(m)}>
                                <UserCheck className="h-3.5 w-3.5 mr-2 text-blue-600" />
                                Assign Operator
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onStartMaintenance(m)}>
                                <Wrench className="h-3.5 w-3.5 mr-2 text-amber-600" />
                                Start Maintenance
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedBreakdownMachine(m);
                                  setOpenBreakdownModal(true);
                                }}
                                className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40 font-medium cursor-pointer"
                              >
                                <AlertOctagon className="h-3.5 w-3.5 mr-2 text-rose-600" />
                                Report Breakdown
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => onViewDetails(m)}>
                                <History className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                Allocation History
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onViewDetails(m)}>
                                <History className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                Maintenance History
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => onToggleStatus(m)}
                                className="text-muted-foreground"
                              >
                                <Power className="h-3.5 w-3.5 mr-2" />
                                {m.status === 'ACTIVE' ? 'Deactivate' : 'Set Active'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => onDeleteMachine(m)}
                                className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                Delete Machine
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* QR Modals */}
      <MachineQrModal
        machine={selectedQrMachine}
        open={openQrModal}
        onOpenChange={setOpenQrModal}
        onMachineUpdated={(updated) => {
          setSelectedQrMachine(updated);
          if (onMachineUpdated) onMachineUpdated(updated);
        }}
      />

      <ScanQrModal
        open={openScanModal}
        onOpenChange={setOpenScanModal}
        onMachineFound={(m) => {
          if (onOpen360) {
            onOpen360(m);
          } else {
            onViewDetails(m);
          }
        }}
      />

      {/* Report Breakdown Modal */}
      <ReportBreakdownModal
        machine={selectedBreakdownMachine}
        open={openBreakdownModal}
        onOpenChange={setOpenBreakdownModal}
        onSuccess={() => {
          if (onMachineUpdated) onMachineUpdated();
        }}
      />

      {/* Shift-wise Allocations Modal */}
      <MachineShiftAllocationsModal
        machine={selectedAllocMachine}
        open={openAllocModal}
        onOpenChange={setOpenAllocModal}
        allocations={allocations || []}
        onAssignNewShift={(mach) => {
          onAssignOperator(mach);
        }}
        onViewDetails={(mach) => {
          onViewDetails(mach);
        }}
      />
    </div>
  );
}
