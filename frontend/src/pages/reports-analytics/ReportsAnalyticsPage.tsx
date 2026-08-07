import { useSearchParams } from 'react-router-dom';
import { BarChart3, TrendingUp, Download, PieChart, LineChart, Sparkles, FileSpreadsheet, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';

const REPORTS = [
  { title: 'Executive Headcount & Turn Over Summary', cat: 'Executive', freq: 'Monthly', format: 'PDF / XLSX', lastRun: '01 Aug 2026' },
  { title: 'Statutory PF & ESIC Contribution Master Report', cat: 'Compliance', freq: 'Monthly', format: 'ECR TXT / CSV', lastRun: '01 Aug 2026' },
  { title: 'Payroll Variance & Cost Center Allocation', cat: 'Payroll', freq: 'Monthly', format: 'XLSX / BI', lastRun: '01 Aug 2026' },
  { title: 'Shift Utilization & Overtime Excess Hours Report', cat: 'Workforce', freq: 'Weekly', format: 'CSV', lastRun: '04 Aug 2026' },
];

const HR_REPORTS = [
  { title: 'New Hires & Exits Trend Report', freq: 'Monthly', format: 'PDF', lastRun: '01 Aug 2026' },
  { title: 'Leave Balance & Utilization Summary', freq: 'Monthly', format: 'XLSX', lastRun: '01 Aug 2026' },
  { title: 'Employee Demographics & Diversity Report', freq: 'Quarterly', format: 'PDF / XLSX', lastRun: '01 Jul 2026' },
];

const PAYROLL_REPORTS = [
  { title: 'Monthly Payroll Register', freq: 'Monthly', format: 'XLSX', lastRun: '01 Aug 2026' },
  { title: 'CTC Break-up & Salary Structure Report', freq: 'Monthly', format: 'PDF', lastRun: '01 Aug 2026' },
  { title: 'Bonus & Incentive Disbursement Summary', freq: 'Quarterly', format: 'XLSX', lastRun: '01 Jul 2026' },
];

export default function ReportsAnalyticsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'executive';

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BarChart3}
        title="Reports & Advanced Analytics"
        description="Executive HR dashboards, statutory payroll exports, workforce analytics & custom report builder"
        badge="PowerBI / Tableau API Synced"
        badgeVariant="info"
        actions={
          <Button size="sm" className="gap-1.5 text-xs">
            <Sparkles className="h-3.5 w-3.5" /> Build Custom Report
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={BarChart3} label="Total Headcount" value="148 Active" hint="+3.2% Growth YTD" accent="primary" />
        <StatCard icon={TrendingUp} label="Annual Attrition Rate" value="4.1%" hint="Industry Avg: 12.5%" accent="success" />
        <StatCard icon={PieChart} label="Gender Diversity Ratio" value="42% Female" hint="ESG Compliant Score" accent="info" />
        <StatCard icon={LineChart} label="Scheduled Automated Reports" value="12 Active" hint="Email PDF Dispatch Active" accent="warning" />
      </div>

      <Tabs value={activeTab} onValueChange={(val) => setSearchParams({ tab: val })} className="w-full">
        <TabsList className="flex h-auto flex-wrap gap-1 bg-muted/60 p-1">
          <TabsTrigger value="executive" className="text-xs px-3 py-1.5">Executive Dashboard</TabsTrigger>
          <TabsTrigger value="hr-reports" className="text-xs px-3 py-1.5">HR Reports</TabsTrigger>
          <TabsTrigger value="payroll-reports" className="text-xs px-3 py-1.5">Payroll Reports</TabsTrigger>
          <TabsTrigger value="compliance-reports" className="text-xs px-3 py-1.5">Compliance Reports</TabsTrigger>
          <TabsTrigger value="workforce-analytics" className="text-xs px-3 py-1.5">Workforce Analytics</TabsTrigger>
          <TabsTrigger value="ai-insights" className="text-xs px-3 py-1.5">AI Insights</TabsTrigger>
          <TabsTrigger value="custom-reports" className="text-xs px-3 py-1.5">Custom Builder</TabsTrigger>
        </TabsList>

        <TabsContent value="executive" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {REPORTS.map((r, i) => (
              <Card key={i} className="shadow-2xs border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px]">
                      {r.cat}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">Last Run: {r.lastRun}</span>
                  </div>
                  <CardTitle className="text-base font-semibold mt-1">{r.title}</CardTitle>
                  <CardDescription>Frequency: {r.freq} • Formats: {r.format}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button size="sm" variant="outline" className="w-full text-xs gap-1.5">
                    <Download className="h-3.5 w-3.5" /> Export Data Report
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="hr-reports" className="mt-4">
          <Card className="shadow-2xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Core HR Reports</CardTitle>
              <CardDescription>Headcount movement, leave utilization and workforce demographics</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Report Name</TableHead>
                    <TableHead className="text-xs">Frequency</TableHead>
                    <TableHead className="text-xs">Format</TableHead>
                    <TableHead className="text-xs">Last Run</TableHead>
                    <TableHead className="text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {HR_REPORTS.map((r) => (
                    <TableRow key={r.title}>
                      <TableCell className="text-xs font-medium">{r.title}</TableCell>
                      <TableCell className="text-xs">{r.freq}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{r.format}</TableCell>
                      <TableCell className="text-xs font-mono">{r.lastRun}</TableCell>
                      <TableCell className="text-xs">
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                          <Download className="h-3 w-3" /> Export
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll-reports" className="mt-4">
          <Card className="shadow-2xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Payroll Reports</CardTitle>
              <CardDescription>Payroll registers, CTC breakdowns and incentive disbursement summaries</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Report Name</TableHead>
                    <TableHead className="text-xs">Frequency</TableHead>
                    <TableHead className="text-xs">Format</TableHead>
                    <TableHead className="text-xs">Last Run</TableHead>
                    <TableHead className="text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PAYROLL_REPORTS.map((r) => (
                    <TableRow key={r.title}>
                      <TableCell className="text-xs font-medium">{r.title}</TableCell>
                      <TableCell className="text-xs">{r.freq}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{r.format}</TableCell>
                      <TableCell className="text-xs font-mono">{r.lastRun}</TableCell>
                      <TableCell className="text-xs">
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                          <Download className="h-3 w-3" /> Export
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance-reports" className="mt-4">
          <EmptyState
            icon={ShieldCheck}
            title="Compliance Report Library"
            description="Statutory PF, ESIC, PT and labour welfare fund filing reports, ready for government portal upload."
            badge="Coming soon"
          />
        </TabsContent>

        <TabsContent value="workforce-analytics" className="mt-4">
          <EmptyState
            icon={LineChart}
            title="Workforce Analytics Charts"
            description="Attrition trend lines, diversity ratios and headcount forecasting visualizations."
            badge="Coming soon"
          />
        </TabsContent>

        <TabsContent value="ai-insights" className="mt-4">
          <EmptyState
            icon={Sparkles}
            title="AI-Generated Insights"
            description="Natural language summaries that surface key HR metric changes and recommended actions."
            badge="Coming soon"
          />
        </TabsContent>

        <TabsContent value="custom-reports" className="mt-4">
          <EmptyState
            icon={FileSpreadsheet}
            title="Custom Report Builder"
            description="Drag-and-drop report designer with saved templates and scheduled email delivery."
            badge="Coming soon"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
