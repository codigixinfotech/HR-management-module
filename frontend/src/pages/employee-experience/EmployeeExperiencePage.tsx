import { useSearchParams } from 'react-router-dom';
import {
  Smile,
  Award,
  LifeBuoy,
  Megaphone,
  Plus,
  Wallet,
  FileText,
  ClipboardCheck,
  Ticket,
  Gift,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';

const TICKETS = [
  { id: 'TKT-1002', subject: 'Tax Declaration Form 12BB Query', category: 'Payroll / Tax', requester: 'Rajesh Sharma', status: 'OPEN', priority: 'HIGH' },
  { id: 'TKT-1003', subject: 'Request for Ergonomic Chair at Pune HO', category: 'Facilities / Asset', requester: 'Priya Verma', status: 'IN_PROGRESS', priority: 'MEDIUM' },
  { id: 'TKT-1004', subject: 'Name Change Correction in ESIC Card', category: 'Compliance', requester: 'Amit Patel', status: 'RESOLVED', priority: 'LOW' },
];

const ESS_ACTIONS = [
  { icon: ClipboardCheck, label: 'Apply Leave', desc: 'Submit and track leave requests' },
  { icon: Wallet, label: 'View Payslip', desc: 'Download latest & past payslips' },
  { icon: FileText, label: 'Update KYC Details', desc: 'Bank, PAN & address updates' },
  { icon: FileText, label: 'Download Form 16', desc: 'Annual tax certificate' },
  { icon: Wallet, label: 'Submit Expense Claim', desc: 'File travel & reimbursement claims' },
  { icon: Ticket, label: 'Raise Support Ticket', desc: 'Get help from HR & IT desk' },
];

const APPROVALS = [
  { id: 'APR-401', employee: 'Sneha Iyer', type: 'Leave Request', submitted: '03 Aug 2026', status: 'PENDING' },
  { id: 'APR-402', employee: 'Vikram Singh', type: 'Timesheet Correction', submitted: '02 Aug 2026', status: 'PENDING' },
  { id: 'APR-403', employee: 'Neha Kapoor', type: 'Expense Claim', submitted: '01 Aug 2026', status: 'APPROVED' },
  { id: 'APR-404', employee: 'Arjun Rao', type: 'Work From Home Request', submitted: '31 Jul 2026', status: 'PENDING' },
];

const SURVEYS = [
  { title: 'Q3 Engagement Pulse Check', launched: '15 Jul 2026', responses: '186 / 210', score: '4.6 / 5.0', status: 'COMPLETED' },
  { title: 'Manager Effectiveness Feedback', launched: '25 Jul 2026', responses: '142 / 210', score: '4.2 / 5.0', status: 'IN_PROGRESS' },
  { title: 'Hybrid Work Policy Sentiment', launched: '01 Aug 2026', responses: '58 / 210', score: 'Pending', status: 'OPEN' },
];

const KUDOS = [
  { from: 'Priya Verma', to: 'Rajesh Sharma', badge: 'Team Player', message: 'Went above and beyond on the client migration.', date: '04 Aug 2026' },
  { from: 'Amit Patel', to: 'Sneha Iyer', badge: 'Innovation Star', message: 'Automated the shift reconciliation report.', date: '03 Aug 2026' },
  { from: 'Admin User', to: 'Vikram Singh', badge: 'Customer First', message: 'Excellent handling of the escalation call.', date: '01 Aug 2026' },
];

export default function EmployeeExperiencePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Smile}
        title="Employee Experience & Engagement Hub"
        description="Self-service portals (ESS/MSS), engagement pulse surveys, peer-to-peer recognition & SLA helpdesk"
        badge="eNPS Score: +48"
        badgeVariant="success"
        actions={
          <Button size="sm" className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" /> New Announcement / Survey
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Smile} label="Employee Satisfaction Index" value="4.7 / 5.0" hint="94% Survey Participation" accent="success" />
        <StatCard icon={LifeBuoy} label="Help Desk SLA Compliance" value="98.2%" hint="Avg Resolution: 3.4 Hrs" accent="info" />
        <StatCard icon={Award} label="Kudos & Rewards Given" value="128 Badges" hint="Spot Recognition Active" accent="warning" />
        <StatCard icon={Megaphone} label="Active Announcements" value="3 Broadcasts" hint="Townhall Update Posted" accent="primary" />
      </div>

      <Tabs value={activeTab} onValueChange={(val) => setSearchParams({ tab: val })} className="w-full">
        <TabsList className="flex h-auto flex-wrap gap-1 bg-muted/60 p-1">
          <TabsTrigger value="dashboard" className="text-xs px-3 py-1.5">Overview</TabsTrigger>
          <TabsTrigger value="ess" className="text-xs px-3 py-1.5">Employee Self Service (ESS)</TabsTrigger>
          <TabsTrigger value="mss" className="text-xs px-3 py-1.5">Manager Self Service (MSS)</TabsTrigger>
          <TabsTrigger value="surveys" className="text-xs px-3 py-1.5">Pulse Surveys</TabsTrigger>
          <TabsTrigger value="rewards" className="text-xs px-3 py-1.5">Rewards & Recognition</TabsTrigger>
          <TabsTrigger value="helpdesk" className="text-xs px-3 py-1.5">Help Desk Tickets</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4">
          <Card className="shadow-2xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Active HR Help Desk Service Tickets</CardTitle>
              <CardDescription>Monitor employee inquiry tickets across HR, Payroll, IT and Facilities</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Ticket ID</TableHead>
                    <TableHead className="text-xs">Subject</TableHead>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs">Requester</TableHead>
                    <TableHead className="text-xs">Priority</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {TICKETS.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs font-semibold">{t.id}</TableCell>
                      <TableCell className="font-medium text-xs">{t.subject}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{t.category}</TableCell>
                      <TableCell className="text-xs">{t.requester}</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="text-[10px]">
                          {t.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <StatusBadge status={t.status} className="text-[10px]" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ess" className="mt-4">
          <Card className="shadow-2xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Employee Self Service Quick Actions</CardTitle>
              <CardDescription>Common self-service tasks available to every employee</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {ESS_ACTIONS.map((action) => (
                  <div key={action.label} className="flex items-start gap-3 rounded-lg border p-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <action.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{action.label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{action.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mss" className="mt-4">
          <Card className="shadow-2xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Pending Team Approvals</CardTitle>
              <CardDescription>Requests from direct reports awaiting manager action</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Request ID</TableHead>
                    <TableHead className="text-xs">Employee</TableHead>
                    <TableHead className="text-xs">Request Type</TableHead>
                    <TableHead className="text-xs">Submitted</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {APPROVALS.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono text-xs font-semibold">{a.id}</TableCell>
                      <TableCell className="text-xs font-medium">{a.employee}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{a.type}</TableCell>
                      <TableCell className="text-xs font-mono">{a.submitted}</TableCell>
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

        <TabsContent value="surveys" className="mt-4">
          <Card className="shadow-2xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Pulse Survey Campaigns</CardTitle>
              <CardDescription>Engagement, sentiment & policy feedback surveys</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Survey Title</TableHead>
                    <TableHead className="text-xs">Launched</TableHead>
                    <TableHead className="text-xs">Responses</TableHead>
                    <TableHead className="text-xs">Score</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {SURVEYS.map((s) => (
                    <TableRow key={s.title}>
                      <TableCell className="text-xs font-medium">{s.title}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{s.launched}</TableCell>
                      <TableCell className="text-xs font-mono">{s.responses}</TableCell>
                      <TableCell className="text-xs font-semibold">{s.score}</TableCell>
                      <TableCell className="text-xs">
                        <StatusBadge status={s.status} className="text-[10px]" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="mt-4">
          <Card className="shadow-2xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Recognition & Kudos Feed</CardTitle>
              <CardDescription>Peer-to-peer shoutouts and spot recognition badges</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">From</TableHead>
                    <TableHead className="text-xs">To</TableHead>
                    <TableHead className="text-xs">Badge</TableHead>
                    <TableHead className="text-xs">Message</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {KUDOS.map((k, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs">{k.from}</TableCell>
                      <TableCell className="text-xs font-medium">{k.to}</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="warning" className="text-[10px]">
                          <Gift className="h-3 w-3" /> {k.badge}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{k.message}</TableCell>
                      <TableCell className="text-xs font-mono">{k.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="helpdesk" className="mt-4">
          <EmptyState
            icon={BarChart3}
            title="Full Help Desk Console"
            description="Detailed ticket queues, SLA breach alerts and category-wise escalation workflows. See the Overview tab for the live ticket list."
            badge="Coming soon"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
