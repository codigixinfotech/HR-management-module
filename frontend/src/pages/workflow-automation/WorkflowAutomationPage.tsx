import { useSearchParams } from 'react-router-dom';
import { Workflow, GitMerge, Bell, ShieldCheck, Plus, FileText, Send } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';

const WORKFLOWS = [
  { id: 'WF-101', name: 'Leave Approval Hierarchy', trigger: 'Leave Request Submitted', steps: 'Employee -> Manager -> HR', status: 'ACTIVE' },
  { id: 'WF-102', name: 'Employee Onboarding Task Flow', trigger: 'Candidate Hired', steps: 'IT Asset -> HR Docs -> Facility Badge', status: 'ACTIVE' },
  { id: 'WF-103', name: 'Payroll Final Approval', trigger: 'Payroll Run Execution', steps: 'Payroll Specialist -> Finance Head -> MD', status: 'ACTIVE' },
  { id: 'WF-104', name: 'Overtime Excess Hours Approval', trigger: 'OT > 2 Hours Logged', steps: 'Shift Supervisor -> Plant Manager', status: 'ACTIVE' },
];

const APPROVAL_MATRIX = [
  { category: 'Expense Claims', range: 'Up to ₹10,000', l1: 'Reporting Manager', l2: '—', l3: '—' },
  { category: 'Expense Claims', range: '₹10,001 - ₹50,000', l1: 'Reporting Manager', l2: 'Finance Head', l3: '—' },
  { category: 'Travel Requests', range: 'Domestic', l1: 'Reporting Manager', l2: '—', l3: '—' },
  { category: 'Travel Requests', range: 'International', l1: 'Reporting Manager', l2: 'Department Head', l3: 'MD' },
  { category: 'Purchase Orders', range: 'Above ₹1,00,000', l1: 'Procurement Lead', l2: 'Finance Head', l3: 'MD' },
];

const NOTIFICATIONS = [
  { event: 'Leave Request Submitted', channel: 'Email + Push', recipients: 'Reporting Manager', status: 'ACTIVE' },
  { event: 'Payroll Processed', channel: 'Email + WhatsApp', recipients: 'All Employees', status: 'ACTIVE' },
  { event: 'Document Expiry (Visa/PF)', channel: 'Email', recipients: 'Employee + HR', status: 'ACTIVE' },
  { event: 'Overtime Threshold Breach', channel: 'SMS + Email', recipients: 'Shift Supervisor', status: 'PAUSED' },
];

const AUDIT_LOGS = [
  { time: '05 Aug 2026, 09:12', actor: 'Priya Verma', action: 'Approved', entity: 'Leave Request LR-2291', ip: '10.20.4.12' },
  { time: '05 Aug 2026, 08:47', actor: 'System', action: 'Auto-Escalated', entity: 'Expense Claim EXP-9003', ip: '—' },
  { time: '04 Aug 2026, 17:30', actor: 'Amit Patel', action: 'Rejected', entity: 'Purchase Order PO-118', ip: '10.20.4.44' },
  { time: '04 Aug 2026, 14:05', actor: 'Rajesh Sharma', action: 'Created', entity: 'Workflow Rule WF-104', ip: '10.20.2.09' },
];

export default function WorkflowAutomationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'designer';

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Workflow}
        title="Workflow & Approval Automation"
        description="Multi-level approval matrices, event-driven notification triggers, document templates & immutable audit logs"
        badge="4 Active Engine Rules"
        badgeVariant="success"
        actions={
          <Button size="sm" className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" /> Create Workflow Rule
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Workflow} label="Active Workflows" value="14 Rules" hint="100% Automated Execution" accent="success" />
        <StatCard icon={GitMerge} label="Approval SLA Compliance" value="99.4%" hint="< 4 Hours Avg Approval" accent="info" />
        <StatCard icon={Bell} label="Monthly Notifications Sent" value="2,840 Items" hint="Email, SMS & WhatsApp" accent="warning" />
        <StatCard icon={ShieldCheck} label="Audit Log Integrity" value="Tamper Proof" hint="Full Traceability Active" accent="primary" />
      </div>

      <Tabs value={activeTab} onValueChange={(val) => setSearchParams({ tab: val })} className="w-full">
        <TabsList className="flex h-auto flex-wrap gap-1 bg-muted/60 p-1">
          <TabsTrigger value="designer" className="text-xs px-3 py-1.5">Workflow Designer</TabsTrigger>
          <TabsTrigger value="approval-matrix" className="text-xs px-3 py-1.5">Approval Matrix</TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs px-3 py-1.5">Trigger Notifications</TabsTrigger>
          <TabsTrigger value="templates" className="text-xs px-3 py-1.5">Templates</TabsTrigger>
          <TabsTrigger value="audit-logs" className="text-xs px-3 py-1.5">Audit Trail Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="designer" className="mt-4">
          <Card className="shadow-2xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Enterprise Approval Matrix & Workflow Rules</CardTitle>
              <CardDescription>Configured approval routes based on department, cost center and amount limits</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Workflow ID</TableHead>
                    <TableHead className="text-xs">Workflow Name</TableHead>
                    <TableHead className="text-xs">Trigger Event</TableHead>
                    <TableHead className="text-xs">Approval Hierarchy</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {WORKFLOWS.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="font-mono text-xs font-semibold">{w.id}</TableCell>
                      <TableCell className="font-medium text-xs">{w.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{w.trigger}</TableCell>
                      <TableCell className="text-xs font-mono">{w.steps}</TableCell>
                      <TableCell className="text-xs">
                        <StatusBadge status={w.status} className="text-[10px]" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approval-matrix" className="mt-4">
          <Card className="shadow-2xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Approval Matrix by Category & Amount</CardTitle>
              <CardDescription>Escalation levels required based on request category and value band</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs">Amount / Range</TableHead>
                    <TableHead className="text-xs">Level 1</TableHead>
                    <TableHead className="text-xs">Level 2</TableHead>
                    <TableHead className="text-xs">Level 3</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {APPROVAL_MATRIX.map((m, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs font-medium">{m.category}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{m.range}</TableCell>
                      <TableCell className="text-xs">{m.l1}</TableCell>
                      <TableCell className="text-xs">{m.l2}</TableCell>
                      <TableCell className="text-xs">{m.l3}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card className="shadow-2xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Event-Driven Notification Triggers</CardTitle>
              <CardDescription>Automated alerts dispatched on key HR & payroll events</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Event</TableHead>
                    <TableHead className="text-xs">Channel</TableHead>
                    <TableHead className="text-xs">Recipients</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {NOTIFICATIONS.map((n) => (
                    <TableRow key={n.event}>
                      <TableCell className="text-xs font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          <Send className="h-3.5 w-3.5 text-muted-foreground" /> {n.event}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">{n.channel}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{n.recipients}</TableCell>
                      <TableCell className="text-xs">
                        <StatusBadge status={n.status} className="text-[10px]" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <EmptyState
            icon={FileText}
            title="Document & Message Templates"
            description="Reusable offer letters, relieving notices, approval emails and WhatsApp message templates."
            badge="Coming soon"
          />
        </TabsContent>

        <TabsContent value="audit-logs" className="mt-4">
          <Card className="shadow-2xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Immutable Audit Trail</CardTitle>
              <CardDescription>Every workflow action, approval and system decision, fully traceable</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Timestamp</TableHead>
                    <TableHead className="text-xs">Actor</TableHead>
                    <TableHead className="text-xs">Action</TableHead>
                    <TableHead className="text-xs">Entity</TableHead>
                    <TableHead className="text-xs">IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {AUDIT_LOGS.map((l, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs font-mono text-muted-foreground">{l.time}</TableCell>
                      <TableCell className="text-xs font-medium">{l.actor}</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="text-[10px]">
                          {l.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{l.entity}</TableCell>
                      <TableCell className="text-xs font-mono">{l.ip}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
