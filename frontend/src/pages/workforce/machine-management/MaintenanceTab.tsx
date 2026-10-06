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
  Wrench,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Plus,
  Calendar,
  MoreVertical,
  Eye,
  Trash2,
} from 'lucide-react';
import type {
  MachineMaintenance,
  Machine,
} from '@/api/machine-management';
import type { Branch } from '@/api/types';

interface MaintenanceTabProps {
  maintenances: MachineMaintenance[];
  machines: Machine[];
  branches: Branch[];
  loading: boolean;
  onStartMaintenance: () => void;
  onCompleteMaintenance: (maintenance: MachineMaintenance) => void;
  onViewMachine: (machineId: string) => void;
  onDeleteMaintenance: (maintenance: MachineMaintenance) => void;
}

export function MaintenanceTab({
  maintenances,
  machines,
  branches,
  loading,
  onStartMaintenance,
  onCompleteMaintenance,
  onViewMachine,
  onDeleteMaintenance,
}: MaintenanceTabProps) {
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [machineFilter, setMachineFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const handleReset = () => {
    setSearch('');
    setBranchFilter('ALL');
    setMachineFilter('ALL');
    setStatusFilter('ALL');
  };

  const filteredMaintenances = maintenances.filter((m) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (m.machineName && m.machineName.toLowerCase().includes(q)) ||
      (m.machineCode && m.machineCode.toLowerCase().includes(q)) ||
      (m.technicianName && m.technicianName.toLowerCase().includes(q)) ||
      (m.reason && m.reason.toLowerCase().includes(q));

    const matchesBranch =
      branchFilter === 'ALL' ||
      (branchFilter === 'HEAD_OFFICE' && (!m.branchId || m.branchId === 'HEAD_OFFICE')) ||
      m.branchId === branchFilter;

    const matchesMachine = machineFilter === 'ALL' || m.machineId === machineFilter;
    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;

    return matchesSearch && matchesBranch && matchesMachine && matchesStatus;
  });

  const overdueMachines = machines.filter((m) => m.maintenanceDueStatus === 'OVERDUE');
  const dueTodayMachines = machines.filter((m) => m.maintenanceDueStatus === 'DUE_TODAY');

  return (
    <div className="space-y-4">
      {/* Preventive Maintenance Alert Callout */}
      {(overdueMachines.length > 0 || dueTodayMachines.length > 0) && (
        <Card className="border-rose-200 bg-rose-50/70 dark:bg-rose-950/20 dark:border-rose-900/50 shadow-xs">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-rose-900 dark:text-rose-200 flex items-center gap-2">
                  <span>Preventive Maintenance Attention Required</span>
                  <Badge variant="destructive" className="text-[10px] py-0 h-4">
                    {overdueMachines.length} Overdue
                  </Badge>
                  {dueTodayMachines.length > 0 && (
                    <Badge variant="warning" className="text-[10px] py-0 h-4">
                      {dueTodayMachines.length} Due Today
                    </Badge>
                  )}
                </h4>
                <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">
                  The following machinery has reached or exceeded scheduled service intervals:
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[...overdueMachines, ...dueTodayMachines].slice(0, 6).map((m) => (
                    <Badge
                      key={m.id}
                      variant="outline"
                      className="text-[11px] bg-background/80 cursor-pointer hover:bg-background"
                      onClick={() => onViewMachine(m.id)}
                    >
                      {m.machineCode} ({m.maintenanceDueLabel})
                    </Badge>
                  ))}
                  {[...overdueMachines, ...dueTodayMachines].length > 6 && (
                    <span className="text-[11px] text-rose-600 font-medium self-center">
                      +{ [...overdueMachines, ...dueTodayMachines].length - 6 } more
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="text-xs gap-1.5 shrink-0 shadow-2xs self-end sm:self-center font-medium"
              onClick={onStartMaintenance}
            >
              <Wrench className="h-3.5 w-3.5" />
              Schedule Maintenance
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Search & Filters */}
      <Card className="shadow-2xs">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search machine, technician, fault symptom..."
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

              <Select value={machineFilter} onValueChange={setMachineFilter}>
                <SelectTrigger className="w-[150px] h-9 text-xs">
                  <SelectValue placeholder="Machine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Machines</SelectItem>
                  {machines.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.machineCode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-9 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
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

              <Button
                size="sm"
                variant="destructive"
                className="h-9 gap-1.5 text-xs"
                onClick={onStartMaintenance}
              >
                <Wrench className="h-3.5 w-3.5" />
                Start Maintenance
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Table */}
      <Card className="shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="text-xs">
                <TableHead className="font-semibold text-foreground">Machine Equipment</TableHead>
                <TableHead className="font-semibold text-foreground">Operational Unit</TableHead>
                <TableHead className="font-semibold text-foreground">Maintenance Type</TableHead>
                <TableHead className="font-semibold text-foreground">Started</TableHead>
                <TableHead className="font-semibold text-foreground">Expected Completion</TableHead>
                <TableHead className="font-semibold text-foreground">Lead Technician</TableHead>
                <TableHead className="font-semibold text-foreground">Status</TableHead>
                <TableHead className="text-right font-semibold text-foreground">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8} className="py-4 text-center">
                      <div className="h-5 bg-muted animate-pulse rounded w-3/4 mx-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredMaintenances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    <p className="font-medium text-sm">No maintenance records found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      All factory machinery is operating smoothly with 0 active breakdowns.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 gap-1.5"
                      onClick={onStartMaintenance}
                    >
                      <Wrench className="h-3.5 w-3.5" />
                      Log Machine Maintenance
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMaintenances.map((m) => (
                  <TableRow key={m.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div>
                        <span className="font-mono font-semibold text-primary">
                          {m.machineCode}
                        </span>
                        <span className="text-foreground ml-1.5 font-medium">{m.machineName}</span>
                        <p className="text-[11px] text-muted-foreground truncate max-w-[200px]" title={m.reason}>
                          {m.reason}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-foreground">
                        {m.lineName || 'Main Facility'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          m.maintenanceType === 'Breakdown' || m.maintenanceType === 'Emergency'
                            ? 'destructive'
                            : 'secondary'
                        }
                        className="text-[10px]"
                      >
                        {m.maintenanceType}
                      </Badge>
                    </TableCell>
                    <TableCell>{m.startDate ? m.startDate.slice(0, 10) : 'N/A'}</TableCell>
                    <TableCell>
                      {m.actualCompletionDate ? (
                        <span className="text-emerald-600 font-medium">
                          {m.actualCompletionDate.slice(0, 10)} (Done)
                        </span>
                      ) : m.expectedCompletionDate ? (
                        <span>{m.expectedCompletionDate.slice(0, 10)}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-foreground">{m.technicianName}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          m.status === 'Completed'
                            ? 'success'
                            : m.status === 'In Progress'
                            ? 'warning'
                            : 'secondary'
                        }
                        className="text-[11px]"
                      >
                        {m.status === 'In Progress' && (
                          <span className="mr-1 h-1.5 w-1.5 rounded-full bg-amber-500 inline-block animate-ping" />
                        )}
                        {m.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {m.status === 'In Progress' && (
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                            onClick={() => onCompleteMaintenance(m)}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Complete
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36 text-xs">
                            <DropdownMenuItem onClick={() => onViewMachine(m.machineId)}>
                              <Eye className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                              View Machine
                            </DropdownMenuItem>
                            {m.status === 'In Progress' && (
                              <DropdownMenuItem onClick={() => onCompleteMaintenance(m)}>
                                <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                                Mark Complete
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDeleteMaintenance(m)}
                              className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" />
                              Delete Record
                            </DropdownMenuItem>
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
