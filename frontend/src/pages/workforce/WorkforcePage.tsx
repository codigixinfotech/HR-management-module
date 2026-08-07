import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { companiesApi } from '@/api/organization';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/layout/PageHeader';
import { ShiftTypesTab } from './ShiftTypesTab';
import { ShiftRosterTab } from './ShiftRosterTab';
import { Wrench, Users, ShieldCheck, Plus, Factory, HardHat } from 'lucide-react';

const MOCK_LINE_ALLOCATIONS = [
  { line: 'Pune Plant Line 1', machine: 'CNC Automated Lathe #04', operator: 'Amit Patel', shift: 'Morning (A)', status: 'OPERATIONAL', efficiency: '98.5%' },
  { line: 'Pune Plant Line 2', machine: 'Robotic Welding Arm #02', operator: 'Rajesh Sharma', shift: 'General (G)', status: 'OPERATIONAL', efficiency: '96.2%' },
  { line: 'Pune Plant Line 3', machine: 'Conveyor Packaging System', operator: 'Contractor Group B', shift: 'Evening (B)', status: 'MAINTENANCE', efficiency: '84.0%' },
];

const MOCK_CONTRACTORS = [
  { vendor: 'TeamLease Manpower Services', type: 'Assembly Skilled Labour', headcount: '32 Workers', contact: 'Ramesh K.', status: 'ACTIVE', contractExpiry: '31 Dec 2026' },
  { vendor: 'Quess Corp Facility Staffing', type: 'Housekeeping & Sanitation', headcount: '14 Workers', contact: 'Sanjay M.', status: 'ACTIVE', contractExpiry: '15 Nov 2026' },
  { vendor: 'SIS Security Guard Agency', type: 'Industrial Security', headcount: '18 Guards', contact: 'Col. Jaswant', status: 'ACTIVE', contractExpiry: '31 Mar 2027' },
];

export default function WorkforcePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'shift-types';
  const { data: companies } = useQuery({ queryKey: ['companies'], queryFn: companiesApi.list });
  const [companyId, setCompanyId] = useState<string | undefined>(undefined);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Factory}
        title="Industrial Workforce & Shop Floor Operations"
        description="Shift demand planning, machine operator line allocations, contractor vendor management & blue-collar labour"
        badge="Plant Line Efficiency: 96.2%"
        badgeVariant="warning"
        actions={
          companies &&
          companies.length > 0 && (
            <div className="w-56">
              <Select value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All companies" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Factory} label="Total Plant Workforce" value="128 Workers" hint="64 Contractual / 64 Permanent" accent="warning" />
        <StatCard icon={Wrench} label="Machine Line Utilization" value="96.2%" hint="3 Production Lines Active" accent="success" />
        <StatCard icon={Users} label="Active Staffing Vendors" value="3 Agencies" hint="64 Sub-contracted Staff" accent="info" />
        <StatCard icon={ShieldCheck} label="Compliance SLA Score" value="100% Verified" hint="CLRA License Active" accent="primary" />
      </div>

      <Tabs value={activeTab} onValueChange={(val) => setSearchParams({ tab: val })} className="w-full">
        <TabsList className="flex h-auto flex-wrap gap-1 bg-muted/60 p-1">
          <TabsTrigger value="shift-types" className="text-xs px-3 py-1.5">Shift Types</TabsTrigger>
          <TabsTrigger value="shift-roster" className="text-xs px-3 py-1.5">Shift Roster</TabsTrigger>
          <TabsTrigger value="machine-allocation" className="text-xs px-3 py-1.5">Machine Line Allocation</TabsTrigger>
          <TabsTrigger value="contractors" className="text-xs px-3 py-1.5">Contractor Management</TabsTrigger>
          <TabsTrigger value="labour" className="text-xs px-3 py-1.5">Labour Management</TabsTrigger>
        </TabsList>

        <TabsContent value="shift-types" className="mt-4">
          <ShiftTypesTab companyId={companyId} companies={companies ?? []} />
        </TabsContent>

        <TabsContent value="shift-roster" className="mt-4">
          <ShiftRosterTab companyId={companyId} companies={companies ?? []} />
        </TabsContent>

        <TabsContent value="machine-allocation" className="mt-4">
          <Card className="shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Assembly Line & Machine Operator Allocation</CardTitle>
                <CardDescription>Assign certified operators and supervisors to factory floor machinery</CardDescription>
              </div>
              <Button size="sm" className="gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" /> Assign Line Operator
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Production Line</TableHead>
                    <TableHead className="text-xs">Machine Equipment</TableHead>
                    <TableHead className="text-xs">Assigned Operator</TableHead>
                    <TableHead className="text-xs">Shift Duty</TableHead>
                    <TableHead className="text-xs">Line Efficiency</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_LINE_ALLOCATIONS.map((l, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-semibold text-xs">{l.line}</TableCell>
                      <TableCell className="font-medium text-xs">{l.machine}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{l.operator}</TableCell>
                      <TableCell className="text-xs font-mono">{l.shift}</TableCell>
                      <TableCell className="text-xs font-semibold text-success">{l.efficiency}</TableCell>
                      <TableCell className="text-xs">
                        <StatusBadge
                          status={l.status === 'OPERATIONAL' ? 'OPERATIONAL' : 'ON_HOLD'}
                          label={l.status === 'OPERATIONAL' ? 'Operational' : 'Maintenance'}
                          className="text-[10px]"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contractors" className="mt-4">
          <Card className="shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Contract Labour Staffing Vendors</CardTitle>
                <CardDescription>Manpower supply agency contracts, deployed headcount & statutory CLRA compliance</CardDescription>
              </div>
              <Button size="sm" className="gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" /> Add Staffing Vendor
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Vendor Agency</TableHead>
                    <TableHead className="text-xs">Deployment Scope</TableHead>
                    <TableHead className="text-xs">Deployed Headcount</TableHead>
                    <TableHead className="text-xs">Vendor Contact</TableHead>
                    <TableHead className="text-xs">Contract Expiry</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_CONTRACTORS.map((c, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-semibold text-xs">{c.vendor}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{c.type}</TableCell>
                      <TableCell className="text-xs font-mono font-semibold">{c.headcount}</TableCell>
                      <TableCell className="text-xs">{c.contact}</TableCell>
                      <TableCell className="text-xs font-mono">{c.contractExpiry}</TableCell>
                      <TableCell className="text-xs">
                        <StatusBadge status={c.status} className="text-[10px]" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="labour" className="mt-4">
          <EmptyState
            icon={HardHat}
            title="Labour Management"
            description="Blue-collar workforce attendance, wage compliance and statutory labour records."
            badge="Coming soon"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
