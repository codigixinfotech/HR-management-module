import { useNavigate } from 'react-router-dom';
import { WorkforcePageLayout } from './WorkforcePageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  CalendarClock,
  Clock,
  Wrench,
  Users,
  HardHat,
  BarChart3,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

const SHIFT_CAPACITY = [
  { shift: 'General Day Shift (HQ)', timing: '09:00 - 18:00', target: 20, assigned: 19, utilization: '95%', status: 'OPTIMAL', branch: 'Head Office' },
  { shift: 'IT Support Shift (HQ)', timing: '08:00 - 17:00', target: 8, assigned: 8, utilization: '100%', status: 'OPTIMAL', branch: 'Head Office' },
  { shift: 'Morning Shift (A)', timing: '06:00 - 14:00', target: 50, assigned: 48, utilization: '96%', status: 'OPTIMAL', branch: 'Pune Manufacturing Plant' },
  { shift: 'Evening Shift (B)', timing: '14:00 - 22:00', target: 45, assigned: 42, utilization: '93%', status: 'OPTIMAL', branch: 'Pune Manufacturing Plant' },
  { shift: 'Night Shift (C)', timing: '22:00 - 06:00', target: 25, assigned: 24, utilization: '96%', status: 'OPTIMAL', branch: 'Pune Manufacturing Plant' },
  { shift: 'General Shift (G)', timing: '09:00 - 18:00', target: 15, assigned: 14, utilization: '93%', status: 'OPTIMAL', branch: 'Pune Manufacturing Plant' },
];

const QUICK_LINE_STATUS = [
  { line: 'Head Office Central Lab Rig 1', machine: 'QC Telemetry Scanner #01', operator: 'Pooja Hegde', shift: 'General (G)', efficiency: '99.1%', status: 'OPERATIONAL', branch: 'Head Office' },
  { line: 'Head Office Server & BMS Unit', machine: 'HVAC & Facility Controller #01', operator: 'Manoj Tiwari', shift: 'General (G)', efficiency: '97.8%', status: 'OPERATIONAL', branch: 'Head Office' },
  { line: 'Pune Plant Line 1', machine: 'CNC Automated Lathe #04', operator: 'Amit Patel', shift: 'Morning (A)', efficiency: '98.5%', status: 'OPERATIONAL', branch: 'Pune Manufacturing Plant' },
  { line: 'Pune Plant Line 2', machine: 'Robotic Welding Arm #02', operator: 'Rajesh Sharma', shift: 'General (G)', efficiency: '96.2%', status: 'OPERATIONAL', branch: 'Pune Manufacturing Plant' },
  { line: 'Pune Plant Line 3', machine: 'Conveyor Packaging System', operator: 'Contractor Group B', shift: 'Evening (B)', efficiency: '84.0%', status: 'MAINTENANCE', branch: 'Pune Manufacturing Plant' },
];

const QUICK_CONTRACTORS = [
  { vendor: 'CBRE Head Office Corporate Facility Mgmt', type: 'Executive Facility Staffing & Concierge', headcount: '8 Staff', expiry: '31 Dec 2026', status: 'ACTIVE', branch: 'Head Office' },
  { vendor: 'G4S Corporate Secure Logistics', type: 'HQ Executive Security & Access Control', headcount: '10 Guards', expiry: '30 Jun 2027', status: 'ACTIVE', branch: 'Head Office' },
  { vendor: 'TeamLease Manpower Services', type: 'Assembly Skilled Labour', headcount: '32 Workers', expiry: '31 Dec 2026', status: 'ACTIVE', branch: 'Pune Manufacturing Plant' },
  { vendor: 'Quess Corp Facility Staffing', type: 'Housekeeping & Sanitation', headcount: '14 Workers', expiry: '15 Nov 2026', status: 'ACTIVE', branch: 'Pune Manufacturing Plant' },
  { vendor: 'SIS Security Guard Agency', type: 'Industrial Security', headcount: '18 Guards', expiry: '31 Mar 2027', status: 'ACTIVE', branch: 'Pune Manufacturing Plant' },
];

export default function WorkforcePlanningPage() {
  const navigate = useNavigate();

  return (
    <WorkforcePageLayout
      title="Industrial Workforce & Shop Floor Operations"
      description="Shift demand planning, machine operator line allocations, contractor vendor management & blue-collar labour"
      badge="Plant Line Efficiency: 96.2%"
      badgeVariant="warning"
    >
      {({ matchBranch }) => {
        const filteredLines = QUICK_LINE_STATUS.filter((l) =>
          matchBranch({ branchName: l.branch, location: l.line })
        );
        const filteredContractors = QUICK_CONTRACTORS.filter((c) =>
          matchBranch({ branchName: c.branch, location: c.vendor })
        );
        const filteredCapacity = SHIFT_CAPACITY.filter((s) =>
          matchBranch({ branchName: s.branch, location: s.shift })
        );

        return (
        <div className="space-y-6">
          {/* 1. Quick Navigation Hub to Dedicated Subpages */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Operational Modules</h3>
                <p className="text-xs text-muted-foreground">Direct access to dedicated workforce administration pages</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Card 1: Shift Planning & Roster */}
              <Card
                onClick={() => navigate('/workforce/shift-planning')}
                className="group cursor-pointer hover:border-primary/50 hover:shadow-md transition-all duration-200"
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform shrink-0">
                    <CalendarClock className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        Shift Planning & Roster
                      </p>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Shift patterns, weekly off rules, employee rosters, rotations & approvals
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3: Machine Allocation */}
              <Card
                onClick={() => navigate('/workforce/machine-allocation')}
                className="group cursor-pointer hover:border-primary/50 hover:shadow-md transition-all duration-200"
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 group-hover:scale-105 transition-transform shrink-0">
                    <Wrench className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground group-hover:text-emerald-600 transition-colors">
                        Machine Allocation
                      </p>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Assembly lines, CNC stations & operator assignments
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Card 4: Contractor Management */}
              <Card
                onClick={() => navigate('/workforce/contractors')}
                className="group cursor-pointer hover:border-primary/50 hover:shadow-md transition-all duration-200"
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 group-hover:scale-105 transition-transform shrink-0">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground group-hover:text-amber-600 transition-colors">
                        Contractor Management
                      </p>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Staffing vendor contracts, headcount & CLRA compliance
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Card 5: Labour & Statutory Compliance */}
              <Card
                onClick={() => navigate('/workforce/contractors?tab=compliance')}
                className="group cursor-pointer hover:border-primary/50 hover:shadow-md transition-all duration-200"
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 group-hover:scale-105 transition-transform shrink-0">
                    <HardHat className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground group-hover:text-rose-600 transition-colors">
                        Labour & Statutory Compliance
                      </p>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Statutory muster rolls, wage registers, CLRA & compliance returns
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Card 6: Workforce Reports */}
              <Card
                onClick={() => navigate('/workforce/reports')}
                className="group cursor-pointer hover:border-primary/50 hover:shadow-md transition-all duration-200"
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 group-hover:scale-105 transition-transform shrink-0">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground group-hover:text-cyan-600 transition-colors">
                        Workforce Reports
                      </p>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Shift analytics, overtime audits & line efficiency logs
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 2. Shift Demand & Capacity Planning Snapshot */}
          <Card className="shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Plant Shift Demand & Headcount Capacity Fulfillment
                </CardTitle>
                <CardDescription>
                  Real-time shop floor workforce demand vs active scheduled headcount across all active shift rotations
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/workforce/shift-planning')}
                className="text-xs gap-1.5"
              >
                Manage Shift & Roster <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Shift Code & Name</TableHead>
                      <TableHead className="text-xs">Operating Hours</TableHead>
                      <TableHead className="text-xs">Target Headcount</TableHead>
                      <TableHead className="text-xs">Currently Assigned</TableHead>
                      <TableHead className="text-xs">Capacity Fill</TableHead>
                      <TableHead className="text-xs text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCapacity.map((sc, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-semibold text-xs text-foreground">{sc.shift}</TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">{sc.timing}</TableCell>
                        <TableCell className="text-xs font-medium">{sc.target} Workers</TableCell>
                        <TableCell className="text-xs font-semibold text-foreground">{sc.assigned} Workers</TableCell>
                        <TableCell className="text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: sc.utilization }}
                              />
                            </div>
                            <span className="font-mono font-medium text-[11px] text-emerald-600">{sc.utilization}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 text-[10px] border-none font-semibold">
                            {sc.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* 3. Shop Floor Line Allocations & Vendor Staffing Snapshot */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Machine Lines */}
            <Card className="shadow-2xs">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-emerald-600" />
                    Production Line Status
                  </CardTitle>
                  <CardDescription className="text-xs">Active machine stations & certified operators</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/workforce/machine-allocation')}
                  className="text-xs text-primary gap-1"
                >
                  View All <ArrowRight className="h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Line / Equipment</TableHead>
                        <TableHead className="text-xs">Operator</TableHead>
                        <TableHead className="text-xs">Efficiency</TableHead>
                        <TableHead className="text-xs text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLines.map((l, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs">
                            <p className="font-semibold text-foreground">{l.line}</p>
                            <p className="text-[11px] text-muted-foreground">{l.machine}</p>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{l.operator}</TableCell>
                          <TableCell className="text-xs font-semibold text-emerald-600">{l.efficiency}</TableCell>
                          <TableCell className="text-xs text-right">
                            <StatusBadge
                              status={l.status === 'OPERATIONAL' ? 'OPERATIONAL' : 'ON_HOLD'}
                              label={l.status === 'OPERATIONAL' ? 'Active' : 'Maint.'}
                              className="text-[9px]"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Contractor Agencies */}
            <Card className="shadow-2xs">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4 text-amber-600" />
                    Contract Staffing Agencies
                  </CardTitle>
                  <CardDescription className="text-xs">Deployed vendor manpower & contracts</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/workforce/contractors')}
                  className="text-xs text-primary gap-1"
                >
                  View All <ArrowRight className="h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Staffing Vendor</TableHead>
                        <TableHead className="text-xs">Headcount</TableHead>
                        <TableHead className="text-xs">Valid Until</TableHead>
                        <TableHead className="text-xs text-right">CLRA</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContractors.map((c, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs">
                            <p className="font-semibold text-foreground">{c.vendor}</p>
                            <p className="text-[11px] text-muted-foreground">{c.type}</p>
                          </TableCell>
                          <TableCell className="text-xs font-semibold font-mono">{c.headcount}</TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">{c.expiry}</TableCell>
                          <TableCell className="text-xs text-right">
                            <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 text-[9px] border-none font-semibold">
                              Verified
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        );
      }}
    </WorkforcePageLayout>
  );
}
