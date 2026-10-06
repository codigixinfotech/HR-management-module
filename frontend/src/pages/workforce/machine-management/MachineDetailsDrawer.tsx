import React, { useState, useEffect } from 'react';
import {
  X,
  Cpu,
  UserCheck,
  Wrench,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
  Layers,
  Zap,
  Building,
  MapPin,
  Calendar,
  QrCode,
  AlertCircle,
  CalendarClock,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  machineManagementApi,
  type Machine,
  type MachineAllocation,
  type MachineMaintenance,
} from '@/api/machine-management';
import { MachineQrModal } from './MachineQrModal';

interface MachineDetailsDrawerProps {
  machineId: string | null;
  open: boolean;
  onClose: () => void;
  onAssignOperator: (machine: Machine) => void;
  onStartMaintenance: (machine: Machine) => void;
  onMachineUpdated?: (machine: Machine) => void;
}

export function MachineDetailsDrawer({
  machineId,
  open,
  onClose,
  onAssignOperator,
  onStartMaintenance,
  onMachineUpdated,
}: MachineDetailsDrawerProps) {
  const [machine, setMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    if (machineId && open) {
      setLoading(true);
      machineManagementApi
        .getMachine(machineId)
        .then((data) => {
          setMachine(data);
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => setLoading(false));
    } else {
      setMachine(null);
    }
  }, [machineId, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-background border-l shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-250">
        {/* Drawer Header */}
        <div className="p-5 border-b bg-muted/20 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {loading ? 'Loading machine...' : machine?.machineName}
              </h2>
              {machine && (
                <Badge
                  variant={
                    machine.status === 'ACTIVE'
                      ? 'success'
                      : machine.status === 'UNDER_MAINTENANCE'
                      ? 'warning'
                      : 'secondary'
                  }
                  className="capitalize font-medium text-xs"
                >
                  ● {machine.status.replace(/_/g, ' ')}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <span className="font-semibold text-primary">{machine?.machineCode}</span>
              <span>•</span>
              <span>{machine?.machineType}</span>
              <span>•</span>
              <span>{machine?.productionLineName || 'Unassigned Line'}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {machine && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs shadow-2xs font-medium"
                onClick={() => setShowQrModal(true)}
              >
                <QrCode className="h-3.5 w-3.5 text-primary" />
                Asset QR
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Action Header bar */}
        {machine && (
          <div className="px-5 py-3 border-b bg-muted/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Current Operator:</span>
              <span className="font-semibold text-foreground">
                {machine.currentOperatorName || 'None Assigned'}
              </span>
              {machine.currentShift && (
                <Badge variant="outline" className="text-[10px] py-0 h-4">
                  {machine.currentShift}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1.5"
                onClick={() => {
                  onAssignOperator(machine);
                }}
              >
                <UserCheck className="h-3.5 w-3.5" />
                Assign Operator
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-8 text-xs gap-1.5"
                onClick={() => {
                  onStartMaintenance(machine);
                }}
              >
                <Wrench className="h-3.5 w-3.5" />
                Maintenance
              </Button>
            </div>
          </div>
        )}

        {/* Drawer Body with Tabs */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading || !machine ? (
            <div className="space-y-4 py-8 text-center text-muted-foreground">
              <div className="h-8 w-8 animate-spin mx-auto border-2 border-primary border-t-transparent rounded-full" />
              <p className="text-xs">Loading machine details from database...</p>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="overview" className="text-xs">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="allocation" className="text-xs">
                  Allocation
                </TabsTrigger>
                <TabsTrigger value="maintenance" className="text-xs">
                  Maintenance
                </TabsTrigger>
                <TabsTrigger value="documents" className="text-xs">
                  Documents
                </TabsTrigger>
                <TabsTrigger value="history" className="text-xs">
                  History
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Overview */}
              <TabsContent value="overview" className="space-y-4">
                {/* Shop Floor Status Card (Answers 5 Scan Questions) */}
                <div className="p-4 rounded-xl border bg-muted/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-primary" /> Live Operational Assessment
                    </h4>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      Tag: {machine.machineCode}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {/* Q1: Availability */}
                    <div className="p-2.5 rounded-lg border bg-background space-y-1">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                        Availability
                      </span>
                      <Badge
                        variant={
                          machine.status === 'ACTIVE'
                            ? 'success'
                            : machine.status === 'UNDER_MAINTENANCE'
                            ? 'warning'
                            : 'secondary'
                        }
                        className="text-[10px] font-medium"
                      >
                        {machine.status === 'UNDER_MAINTENANCE' ? 'In Maintenance' : machine.status}
                      </Badge>
                    </div>

                    {/* Q2: Current Operator */}
                    <div className="p-2.5 rounded-lg border bg-background space-y-1">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                        Active Operator
                      </span>
                      <span className="font-semibold text-xs text-foreground truncate block">
                        {machine.currentOperatorName || 'Unassigned'}
                      </span>
                    </div>

                    {/* Q3: Shift */}
                    <div className="p-2.5 rounded-lg border bg-background space-y-1">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                        Running Shift
                      </span>
                      <span className="font-medium text-xs text-foreground block">
                        {machine.currentShift || 'None'}
                      </span>
                    </div>

                    {/* Q4: Maintenance Due */}
                    <div className="p-2.5 rounded-lg border bg-background space-y-1">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                        Preventive Health
                      </span>
                      <Badge
                        variant={
                          machine.maintenanceDueStatus === 'OVERDUE'
                            ? 'destructive'
                            : machine.maintenanceDueStatus === 'DUE_TODAY'
                            ? 'warning'
                            : machine.maintenanceDueStatus === 'UPCOMING'
                            ? 'outline'
                            : 'secondary'
                        }
                        className="text-[10px] font-medium"
                      >
                        {machine.maintenanceDueLabel || 'Healthy'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Specs Card */}
                <div className="p-4 rounded-xl border bg-card space-y-3">
                  <h4 className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Cpu className="h-4 w-4" /> Technical Specifications & Identity
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Machine Code</span>
                      <span className="font-semibold text-foreground">{machine.machineCode}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Manufacturer</span>
                      <span className="font-medium text-foreground">
                        {machine.manufacturer || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Model</span>
                      <span className="font-medium text-foreground">{machine.model || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Serial Number</span>
                      <span className="font-mono text-foreground font-medium">
                        {machine.serialNumber || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Asset Tag</span>
                      <span className="font-mono text-foreground">
                        {machine.assetNumber || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Status</span>
                      <Badge variant="outline" className="text-[11px]">
                        {machine.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Organization Card */}
                <div className="p-4 rounded-xl border bg-card space-y-3">
                  <h4 className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Building className="h-4 w-4" /> Shop Floor & Organization
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Company</span>
                      <span className="font-medium text-foreground">
                        {machine.companyName || 'Corporate Master'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Branch Plant</span>
                      <span className="font-medium text-foreground">
                        {machine.branchName || 'Head Office'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Department</span>
                      <span className="font-medium text-foreground">
                        {machine.departmentName || 'Production'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Operational Unit</span>
                      <span className="font-semibold text-foreground">
                        {machine.productionLineName || 'Unassigned Unit'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Workstation</span>
                      <span className="font-medium text-foreground">
                        {machine.workstation || 'General Floor'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Bay / Location</span>
                      <span className="font-medium text-foreground">
                        {machine.location || 'Standard Machinery Cell'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Capacity & Power */}
                <div className="p-4 rounded-xl border bg-card space-y-3">
                  <h4 className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="h-4 w-4" /> Capacity & Power
                  </h4>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Max Capacity</span>
                      <span className="font-bold text-foreground text-sm">
                        {machine.capacity || 100} {machine.capacityUom || 'Units/Hr'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Operating Hours</span>
                      <span className="font-bold text-foreground text-sm">
                        {machine.operatingHours || 8} hrs/day
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Power Rating</span>
                      <span className="font-bold text-foreground text-sm">
                        {machine.powerRating || 25} {machine.powerUom || 'kW'}
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 2: Allocation */}
              <TabsContent value="allocation" className="space-y-4">
                {machine.currentOperatorName ? (
                  <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                        Active Shift Assignment
                      </span>
                      <Badge variant="success" className="text-xs">
                        Active
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground block">Assigned Operator</span>
                        <span className="font-semibold text-sm text-foreground">
                          {machine.currentOperatorName}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Current Shift</span>
                        <span className="font-medium text-sm text-foreground">
                          {machine.currentShift || 'General'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Recorded Efficiency</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">
                          {machine.currentEfficiency || '98.5%'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Operational Unit</span>
                        <span className="font-medium">{machine.productionLineName}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed text-center text-muted-foreground text-xs py-6">
                    <UserCheck className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p className="font-medium">No operator currently assigned to this machine</p>
                    <Button
                      size="sm"
                      className="mt-3 text-xs"
                      onClick={() => onAssignOperator(machine)}
                    >
                      Assign Operator Now
                    </Button>
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Allocation History
                  </h4>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow className="text-xs">
                          <TableHead>Operator</TableHead>
                          <TableHead>Shift</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="text-xs">
                        {machine.allocations && machine.allocations.length > 0 ? (
                          machine.allocations.map((a: any) => (
                            <TableRow key={a.id}>
                              <TableCell className="font-medium">{a.operatorName}</TableCell>
                              <TableCell>{a.shift}</TableCell>
                              <TableCell>
                                {a.allocationDate ? a.allocationDate.slice(0, 10) : 'N/A'}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-[10px]">
                                  {a.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                              No previous allocations recorded
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 3: Maintenance */}
              <TabsContent value="maintenance" className="space-y-4">
                {/* Preventive Maintenance Alert Banner */}
                {machine.maintenanceDueStatus && machine.maintenanceDueStatus !== 'NORMAL' && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                      machine.maintenanceDueStatus === 'OVERDUE'
                        ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-300'
                        : machine.maintenanceDueStatus === 'DUE_TODAY'
                        ? 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-300'
                        : 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950/30 dark:border-yellow-900 dark:text-yellow-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <div>
                        <span className="font-semibold block">
                          {machine.maintenanceDueStatus === 'OVERDUE'
                            ? `Preventive Maintenance Overdue (${machine.maintenanceDueLabel})`
                            : machine.maintenanceDueStatus === 'DUE_TODAY'
                            ? 'Preventive Maintenance Due Today'
                            : `Upcoming Preventive Maintenance (${machine.maintenanceDueLabel})`}
                        </span>
                        <span className="text-[11px] opacity-90">
                          Scheduled Due Date: {machine.nextMaintenanceDate ? machine.nextMaintenanceDate.slice(0, 10) : 'Not scheduled'}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="text-xs h-7 gap-1 shadow-2xs shrink-0"
                      onClick={() => onStartMaintenance(machine)}
                    >
                      <Wrench className="h-3 w-3" />
                      Start Service
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-3 rounded-lg border bg-muted/20">
                    <span className="text-muted-foreground block text-[11px]">
                      Service Frequency
                    </span>
                    <span className="font-bold text-foreground text-sm">
                      Every {machine.maintenanceFrequencyDays || 30} Days
                    </span>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/20">
                    <span className="text-muted-foreground block text-[11px]">
                      Reminder Window
                    </span>
                    <span className="font-bold text-foreground text-sm">
                      {machine.maintenanceReminderDays || 7} Days Before
                    </span>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/20">
                    <span className="text-muted-foreground block text-[11px]">
                      Last Maintained
                    </span>
                    <span className="font-bold text-foreground text-sm">
                      {machine.lastMaintenanceDate
                        ? machine.lastMaintenanceDate.slice(0, 10)
                        : 'None Logged'}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/20">
                    <span className="text-muted-foreground block text-[11px]">
                      Next Scheduled Due
                    </span>
                    <span className="font-bold text-foreground text-sm">
                      {machine.nextMaintenanceDate
                        ? machine.nextMaintenanceDate.slice(0, 10)
                        : 'Calculated upon service'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Service & Maintenance Logs
                  </h4>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow className="text-xs">
                          <TableHead>Type</TableHead>
                          <TableHead>Technician</TableHead>
                          <TableHead>Start Date</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="text-xs">
                        {machine.maintenances && machine.maintenances.length > 0 ? (
                          machine.maintenances.map((m: any) => (
                            <TableRow key={m.id}>
                              <TableCell className="font-medium">{m.maintenanceType}</TableCell>
                              <TableCell>{m.technicianName}</TableCell>
                              <TableCell>
                                {m.startDate ? m.startDate.slice(0, 10) : 'N/A'}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={m.status === 'Completed' ? 'success' : 'warning'}
                                  className="text-[10px]"
                                >
                                  {m.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                              No maintenance records found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 4: Documents */}
              <TabsContent value="documents" className="space-y-3">
                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    { title: 'Standard Operating Procedure (SOP) & Manual', tag: 'PDF Manual' },
                    { title: 'Manufacturer OEM Warranty Certificate', tag: 'Warranty v2.1' },
                    { title: 'Factory Calibration & Tolerance Certification', tag: 'Quality Passed' },
                    { title: 'Occupational Health & Electrical Safety Sheet', tag: 'OSHA / EHS' },
                  ].map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border bg-card flex items-center justify-between hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-xs font-semibold">{doc.title}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {machine.machineCode}_DOC_{idx + 1}.pdf
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {doc.tag}
                      </Badge>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Tab 5: History */}
              <TabsContent value="history" className="space-y-3">
                <div className="p-4 rounded-xl border bg-muted/20 space-y-3 text-xs">
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <History className="h-4 w-4 text-primary" />
                    <span>Machine Lifecycle Timeline</span>
                  </div>
                  <div className="space-y-2 border-l-2 border-primary/30 pl-3">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-foreground">Machine Registered & Commissioned</p>
                      <p className="text-[11px] text-muted-foreground">
                        {machine.createdAt ? machine.createdAt.slice(0, 10) : '2026-09-01'}
                      </p>
                    </div>
                    <div className="space-y-0.5 pt-2">
                      <p className="font-semibold text-foreground">Assigned to {machine.productionLineName}</p>
                      <p className="text-[11px] text-muted-foreground">Operational Unit Cell Configured</p>
                    </div>
                    <div className="space-y-0.5 pt-2">
                      <p className="font-semibold text-foreground">
                        {machine.status === 'UNDER_MAINTENANCE'
                          ? 'Preventive Maintenance In Progress'
                          : 'Operational & Running Active Batches'}
                      </p>
                      <p className="text-[11px] text-muted-foreground">Real-time status</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      <MachineQrModal
        machine={machine}
        open={showQrModal}
        onOpenChange={setShowQrModal}
        onMachineUpdated={(updated) => {
          setMachine(updated);
          if (onMachineUpdated) onMachineUpdated(updated);
        }}
      />
    </div>
  );
}
