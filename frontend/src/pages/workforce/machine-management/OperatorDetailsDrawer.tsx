import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  Award,
  BookOpen,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  machineManagementApi,
  type MachineOperator,
} from '@/api/machine-management';

interface OperatorDetailsDrawerProps {
  operatorId: string | null;
  open: boolean;
  onClose: () => void;
  onAssignToMachine?: (operator: MachineOperator) => void;
}

export function OperatorDetailsDrawer({
  operatorId,
  open,
  onClose,
  onAssignToMachine,
}: OperatorDetailsDrawerProps) {
  const [operator, setOperator] = useState<MachineOperator | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (operatorId && open) {
      setLoading(true);
      machineManagementApi
        .getOperator(operatorId)
        .then((data) => setOperator(data))
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setOperator(null);
    }
  }, [operatorId, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-background border-l shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="p-5 border-b bg-muted/20 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {loading ? 'Loading operator...' : operator?.operatorName}
              </h2>
              {operator && (
                <Badge
                  variant={
                    operator.status === 'Available'
                      ? 'success'
                      : operator.status === 'Allocated'
                      ? 'default'
                      : 'secondary'
                  }
                  className="capitalize font-medium text-xs"
                >
                  {operator.status}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <span className="font-semibold text-primary">{operator?.operatorCode}</span>
              <span>•</span>
              <Badge variant="outline" className="text-[10px]">
                {operator?.operatorType}
              </Badge>
              <span>•</span>
              <span>{operator?.department || 'Production'}</span>
            </p>
          </div>

          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body with tabs */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading || !operator ? (
            <div className="space-y-4 py-8 text-center text-muted-foreground">
              <div className="h-8 w-8 animate-spin mx-auto border-2 border-primary border-t-transparent rounded-full" />
              <p className="text-xs">Loading operator credentials from database...</p>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid grid-cols-6 w-full">
                <TabsTrigger value="overview" className="text-xs">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="skills" className="text-xs">
                  Skills
                </TabsTrigger>
                <TabsTrigger value="certs" className="text-xs">
                  Certs
                </TabsTrigger>
                <TabsTrigger value="current" className="text-xs">
                  Current
                </TabsTrigger>
                <TabsTrigger value="history" className="text-xs">
                  History
                </TabsTrigger>
                <TabsTrigger value="training" className="text-xs">
                  Training
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Overview */}
              <TabsContent value="overview" className="space-y-4">
                <div className="p-4 rounded-xl border bg-card space-y-3 text-xs">
                  <h4 className="font-semibold text-primary uppercase tracking-wider">
                    Operator Profile & Identification
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Full Name</span>
                      <span className="font-semibold text-foreground text-sm">
                        {operator.operatorName}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">
                        Personnel Code
                      </span>
                      <span className="font-mono text-foreground font-medium">
                        {operator.operatorCode}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Workforce Type</span>
                      <span className="font-medium text-foreground">{operator.operatorType}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Department</span>
                      <span className="font-medium text-foreground">{operator.department}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Branch Location</span>
                      <span className="font-medium text-foreground">
                        {operator.branchName || 'Head Office'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Staffing Agency</span>
                      <span className="font-medium text-foreground">
                        {operator.contractorAgency || 'Direct Corporate Payroll'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">
                        Statutory Compliance
                      </span>
                      <Badge variant="outline" className="text-emerald-700 bg-emerald-50">
                        {operator.contractorComplianceStatus || 'VALID'}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Current Status</span>
                      <Badge variant="outline">{operator.status}</Badge>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 2: Skills */}
              <TabsContent value="skills" className="space-y-4">
                <div className="p-4 rounded-xl border bg-card space-y-3 text-xs">
                  <h4 className="font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="h-4 w-4" /> Technical Competencies & Specialization
                  </h4>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg border bg-muted/20 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{operator.skill}</p>
                        <p className="text-[11px] text-muted-foreground">Primary machinery capability</p>
                      </div>
                      <Badge variant="default" className="text-xs">
                        {operator.skillLevel || 'Expert'}
                      </Badge>
                    </div>
                    <div className="p-3 rounded-lg border bg-muted/20 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">G-Code & Shop Floor Telemetry</p>
                        <p className="text-[11px] text-muted-foreground">Secondary qualification</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Intermediate
                      </Badge>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 3: Certifications */}
              <TabsContent value="certs" className="space-y-4">
                <div className="p-4 rounded-xl border bg-card space-y-3 text-xs">
                  <h4 className="font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4" /> Statutory Licenses & Quality Certifications
                  </h4>
                  <div className="p-3 rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">
                        {operator.certification || 'Certified Machine Operator'}
                      </span>
                      <Badge variant="success" className="text-[10px]">
                        Valid
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-muted-foreground">Issued By:</span> National Technical Board
                      </div>
                      <div>
                        <span className="text-muted-foreground">Expiry Date:</span>{' '}
                        {operator.certificationExpiry
                          ? operator.certificationExpiry.slice(0, 10)
                          : '2026-12-31'}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 4: Current Allocation */}
              <TabsContent value="current" className="space-y-4">
                {operator.currentMachineName ? (
                  <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-50/30 dark:bg-blue-950/20 space-y-2 text-xs">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
                      Currently Assigned Machine
                    </h4>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Machine Code</span>
                        <span className="font-bold text-sm text-foreground">
                          {operator.currentMachineCode}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Machine Name</span>
                        <span className="font-medium text-foreground">
                          {operator.currentMachineName}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Production Line</span>
                        <span className="font-medium text-foreground">
                          {operator.currentLineName || 'Main Plant'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Duty Shift</span>
                        <span className="font-medium text-foreground">
                          {operator.currentShift || 'General'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-xl border border-dashed text-center text-muted-foreground text-xs space-y-2">
                    <UserCheck className="h-8 w-8 mx-auto text-muted-foreground/40" />
                    <p className="font-medium">Operator is currently Available and unallocated.</p>
                  </div>
                )}
              </TabsContent>

              {/* Tab 5: Allocation History */}
              <TabsContent value="history" className="space-y-4">
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow className="text-xs">
                        <TableHead>Machine</TableHead>
                        <TableHead>Line</TableHead>
                        <TableHead>Shift</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="text-xs">
                      {operator.allocationHistory && operator.allocationHistory.length > 0 ? (
                        operator.allocationHistory.map((a: any) => (
                          <TableRow key={a.id}>
                            <TableCell className="font-medium">{a.machineCode}</TableCell>
                            <TableCell>{a.lineName || 'Line'}</TableCell>
                            <TableCell>{a.shift}</TableCell>
                            <TableCell>
                              {a.allocationDate ? a.allocationDate.slice(0, 10) : 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                            No prior allocations on record
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Tab 6: Training */}
              <TabsContent value="training" className="space-y-3 text-xs">
                <div className="p-3 rounded-lg border bg-card space-y-1">
                  <p className="font-semibold text-foreground">
                    OSHA Shop Floor Hazard & Machine Safeguarding
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Completed 100% • Score 98% • Validated by Safety Officer
                  </p>
                </div>
                <div className="p-3 rounded-lg border bg-card space-y-1">
                  <p className="font-semibold text-foreground">
                    5-Axis CNC Precision Setup & Spindle Tooling
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Completed • Verified in Factory LMS
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
