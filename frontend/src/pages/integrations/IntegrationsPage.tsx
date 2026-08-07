import { useSearchParams } from 'react-router-dom';
import { Network, Database, MessageSquare, Key, RefreshCw, Layers, Factory, Webhook, Send } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';

const CONNECTORS = [
  { id: 'INT-01', name: 'SAP S/4HANA ERP Connector', type: 'ERP', status: 'CONNECTED', lastSync: '10 mins ago', latency: '45ms' },
  { id: 'INT-02', name: 'Tally Prime Financial Voucher Sync', type: 'Finance', status: 'CONNECTED', lastSync: '1 hr ago', latency: '12ms' },
  { id: 'INT-03', name: 'WhatsApp Business API (Meta)', type: 'Messaging', status: 'CONNECTED', lastSync: 'Real-time', latency: '28ms' },
  { id: 'INT-04', name: 'Salesforce CRM Employee Sync', type: 'CRM', status: 'PAUSED', lastSync: '2 days ago', latency: '-' },
];

const FINANCE_CONNECTORS = [
  { name: 'Tally Prime Financial Voucher Sync', status: 'CONNECTED', lastSync: '1 hr ago', direction: 'Bi-directional' },
  { name: 'Zoho Books Ledger Sync', status: 'CONNECTED', lastSync: '3 hrs ago', direction: 'Outbound Only' },
  { name: 'ICICI Bank Corporate Payout Gateway', status: 'CONNECTED', lastSync: '30 mins ago', direction: 'Outbound Only' },
];

const API_KEYS = [
  { name: 'Mobile App - Production', scope: 'Read + Write', created: '12 Jan 2026', lastUsed: '5 mins ago', status: 'ACTIVE' },
  { name: 'Reporting BI Connector', scope: 'Read Only', created: '03 Mar 2026', lastUsed: '2 hrs ago', status: 'ACTIVE' },
  { name: 'Legacy Payroll Migration Key', scope: 'Read Only', created: '20 Sep 2025', lastUsed: '90 days ago', status: 'INACTIVE' },
];

export default function IntegrationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'erp';

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Network}
        title="Enterprise Integrations & Webhook Hub"
        description="Connect SAP/Oracle ERP, Tally/Zoho Finance, WhatsApp Business API, REST endpoints & outbound webhooks"
        badge="3 / 4 API Connectors Live"
        badgeVariant="warning"
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <RefreshCw className="h-3.5 w-3.5" /> Sync All Connectors
            </Button>
            <Button size="sm" className="gap-1.5 text-xs">
              <Key className="h-3.5 w-3.5" /> Generate REST API Key
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Network} label="Active Connectors" value="3 Live" hint="Zero Sync Errors" accent="success" />
        <StatCard icon={Database} label="Daily API Requests" value="48,250" hint="99.99% Uptime SLA" accent="info" />
        <StatCard icon={MessageSquare} label="WhatsApp API Messages" value="1,840 Sent" hint="Payslips & Leave Notifications" accent="success" />
        <StatCard icon={Layers} label="Active Webhook Rules" value="8 Handlers" hint="Event-Driven JSON Payload" accent="primary" />
      </div>

      <Tabs value={activeTab} onValueChange={(val) => setSearchParams({ tab: val })} className="w-full">
        <TabsList className="flex h-auto flex-wrap gap-1 bg-muted/60 p-1">
          <TabsTrigger value="erp" className="text-xs px-3 py-1.5">ERP Connectors</TabsTrigger>
          <TabsTrigger value="finance" className="text-xs px-3 py-1.5">Finance (Tally/Zoho)</TabsTrigger>
          <TabsTrigger value="production" className="text-xs px-3 py-1.5">Production / MES</TabsTrigger>
          <TabsTrigger value="whatsapp" className="text-xs px-3 py-1.5">WhatsApp API</TabsTrigger>
          <TabsTrigger value="api" className="text-xs px-3 py-1.5">REST API Keys</TabsTrigger>
          <TabsTrigger value="webhooks" className="text-xs px-3 py-1.5">Webhooks Config</TabsTrigger>
        </TabsList>

        <TabsContent value="erp" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {CONNECTORS.map((c) => (
              <Card key={c.id} className="shadow-2xs border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px]">
                      {c.type}
                    </Badge>
                    <StatusBadge status={c.status} className="text-[10px]" />
                  </div>
                  <CardTitle className="text-base font-semibold mt-1">{c.name}</CardTitle>
                  <CardDescription>Last Synced: {c.lastSync} • Latency: {c.latency}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button size="sm" variant="outline" className="w-full text-xs gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5" /> Test Connection Ping
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="finance" className="mt-4">
          <Card className="shadow-2xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Finance System Connectors</CardTitle>
              <CardDescription>Ledger, voucher and payout sync with finance & banking platforms</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Connector</TableHead>
                    <TableHead className="text-xs">Sync Direction</TableHead>
                    <TableHead className="text-xs">Last Sync</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {FINANCE_CONNECTORS.map((f) => (
                    <TableRow key={f.name}>
                      <TableCell className="text-xs font-medium">{f.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{f.direction}</TableCell>
                      <TableCell className="text-xs font-mono">{f.lastSync}</TableCell>
                      <TableCell className="text-xs">
                        <StatusBadge status={f.status} className="text-[10px]" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="production" className="mt-4">
          <EmptyState
            icon={Factory}
            title="Production / MES Integration"
            description="Connect shop-floor manufacturing execution systems for real-time labor tracking and shift output data."
            badge="Coming soon"
          />
        </TabsContent>

        <TabsContent value="whatsapp" className="mt-4">
          <Card className="shadow-2xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold">WhatsApp Business API Templates</CardTitle>
              <CardDescription>Approved message templates used for payslip and leave notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { name: 'Payslip Ready Notification', sent: '640 this month' },
                  { name: 'Leave Approved / Rejected Alert', sent: '412 this month' },
                  { name: 'Attendance Reminder (Punch In)', sent: '588 this month' },
                  { name: 'Birthday & Work Anniversary Wish', sent: '200 this month' },
                ].map((t) => (
                  <div key={t.name} className="flex items-start gap-3 rounded-lg border p-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
                      <Send className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{t.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{t.sent}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="mt-4">
          <Card className="shadow-2xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold">REST API Keys</CardTitle>
              <CardDescription>Issued API credentials for external integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Key Name</TableHead>
                    <TableHead className="text-xs">Scope</TableHead>
                    <TableHead className="text-xs">Created</TableHead>
                    <TableHead className="text-xs">Last Used</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {API_KEYS.map((k) => (
                    <TableRow key={k.name}>
                      <TableCell className="text-xs font-medium">{k.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{k.scope}</TableCell>
                      <TableCell className="text-xs font-mono">{k.created}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{k.lastUsed}</TableCell>
                      <TableCell className="text-xs">
                        <StatusBadge status={k.status} className="text-[10px]" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="mt-4">
          <EmptyState
            icon={Webhook}
            title="Webhook Configuration"
            description="Outbound event subscriptions that notify external systems on HR, payroll and attendance events."
            badge="Coming soon"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
