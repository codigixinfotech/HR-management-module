import { useSearchParams } from 'react-router-dom';
import { TrendingUp, Target, Award, Users, Plus, Download, Network, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';

const MOCK_GOALS = [
  { id: 'OKR-101', title: 'Automate Payroll Engine to 99.9% accuracy', owner: 'Admin User', progress: 85, weight: '30%', status: 'ON_TRACK' },
  { id: 'OKR-102', title: 'Reduce Hiring Time-to-Fill from 45 to 25 Days', owner: 'Priya Verma', progress: 60, weight: '25%', status: 'NEEDS_ATTENTION' },
  { id: 'OKR-103', title: 'Achieve 95% ESS Portal Adoption', owner: 'Rajesh Sharma', progress: 92, weight: '20%', status: 'EXCEEDED' },
];

const MOCK_APPRAISALS = [
  { id: 'APR-001', employee: 'Priya Verma', reviewer: 'Admin User', cycle: 'Q3 2026', dueDate: '15 Sep 2026', status: 'IN_PROGRESS' },
  { id: 'APR-002', employee: 'Rajesh Sharma', reviewer: 'Admin User', cycle: 'Q3 2026', dueDate: '15 Sep 2026', status: 'COMPLETED' },
  { id: 'APR-003', employee: 'Amit Patel', reviewer: 'Priya Verma', cycle: 'Q3 2026', dueDate: '15 Sep 2026', status: 'PENDING' },
  { id: 'APR-004', employee: 'Sunita Rao', reviewer: 'Rajesh Sharma', cycle: 'Q3 2026', dueDate: '15 Sep 2026', status: 'PENDING' },
];

export default function PerformancePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Target}
        title="Performance Management & OKRs"
        description="Align OKRs, KRAs, 360-degree feedback appraisals, competency evaluation & succession grids"
        badge="Q3 Appraisal Cycle Open"
        badgeVariant="info"
        actions={
          <Button size="sm" className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" /> Create Goal / OKR
          </Button>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Target} label="Company OKR Completion" value="78.5%" hint="+12% Target Progress" accent="primary" />
        <StatCard icon={Award} label="Appraisals Submitted" value="42 / 48" hint="87% Manager Review Done" accent="success" />
        <StatCard icon={TrendingUp} label="Average Rating" value="4.2 / 5.0" hint="High Performing Team" accent="info" />
        <StatCard icon={Users} label="High-Potential Talent (HIPO)" value="8 Leaders" hint="9-Box Top Right Quadrant" accent="warning" />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => setSearchParams({ tab: val })} className="w-full">
        <TabsList className="flex h-auto flex-wrap gap-1 bg-muted/60 p-1">
          <TabsTrigger value="dashboard" className="text-xs px-3 py-1.5">Overview</TabsTrigger>
          <TabsTrigger value="goals" className="text-xs px-3 py-1.5">Goals (KPI / OKR)</TabsTrigger>
          <TabsTrigger value="appraisals" className="text-xs px-3 py-1.5">Appraisals & Reviews</TabsTrigger>
          <TabsTrigger value="competencies" className="text-xs px-3 py-1.5">Competencies</TabsTrigger>
          <TabsTrigger value="succession" className="text-xs px-3 py-1.5">Succession 9-Box Grid</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4">
          <Card className="shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Strategic OKR Status Tracker</CardTitle>
                <CardDescription>Real-time alignment of organizational key results and department targets</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Download className="h-3.5 w-3.5" /> Export OKR Report
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Goal Title</TableHead>
                    <TableHead className="text-xs">Owner</TableHead>
                    <TableHead className="text-xs">Weightage</TableHead>
                    <TableHead className="text-xs">Progress</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_GOALS.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell className="font-medium text-xs">
                        {g.title}
                        <span className="block text-[10px] text-muted-foreground">{g.id}</span>
                      </TableCell>
                      <TableCell className="text-xs">{g.owner}</TableCell>
                      <TableCell className="text-xs font-mono">{g.weight}</TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${g.progress}%` }} />
                          </div>
                          <span className="font-mono text-[11px]">{g.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <StatusBadge status={g.status} className="text-[10px]" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="mt-4">
          <EmptyState
            icon={Target}
            title="Goal Cascading & Check-ins"
            description="Department and individual OKR cascading with weekly check-ins is being finalized. A live summary of active OKRs is available on the Overview tab."
            badge="Coming soon"
          />
        </TabsContent>

        <TabsContent value="appraisals" className="mt-4">
          <Card className="shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Q3 2026 Appraisal Cycle</CardTitle>
                <CardDescription>360-degree performance reviews in progress across reporting managers</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Download className="h-3.5 w-3.5" /> Export Cycle Report
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Appraisal ID</TableHead>
                    <TableHead className="text-xs">Employee</TableHead>
                    <TableHead className="text-xs">Reviewer</TableHead>
                    <TableHead className="text-xs">Cycle</TableHead>
                    <TableHead className="text-xs">Due Date</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_APPRAISALS.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono text-xs font-semibold">{a.id}</TableCell>
                      <TableCell className="text-xs font-medium">{a.employee}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{a.reviewer}</TableCell>
                      <TableCell className="text-xs">{a.cycle}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{a.dueDate}</TableCell>
                      <TableCell className="text-xs">
                        <StatusBadge status={a.status} className="text-[10px]" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competencies" className="mt-4">
          <EmptyState
            icon={Sparkles}
            title="Competency Framework"
            description="Skill and behavioral competency scoring against role benchmarks is being configured."
            badge="Coming soon"
          />
        </TabsContent>

        <TabsContent value="succession" className="mt-4">
          <EmptyState
            icon={Network}
            title="Succession 9-Box Grid"
            description="Talent review board mapping performance against potential across the leadership pipeline."
            badge="Coming soon"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
