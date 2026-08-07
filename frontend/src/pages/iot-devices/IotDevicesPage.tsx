import { useSearchParams } from 'react-router-dom';
import { Radio, Cpu, Activity, ShieldCheck, RefreshCw, Fingerprint, ScanFace, DoorOpen, ListChecks } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';

const DEVICES = [
  { id: 'IOT-101', name: 'ZKTeco BioStation 3 - Gate A', type: 'Face Recognition', ip: '192.168.1.110', location: 'Pune Head Office Main Entrance', status: 'ONLINE', ping: '12ms' },
  { id: 'IOT-102', name: 'Anviz VF30 Pro Biometric', type: 'Fingerprint & RFID', ip: '192.168.1.112', location: 'Pune Plant Factory Turnstile 1', status: 'ONLINE', ping: '18ms' },
  { id: 'IOT-103', name: 'Hikvision Access Control Gate B', type: 'RFID Flap Barrier', ip: '192.168.1.115', location: 'Pune Plant Factory Turnstile 2', status: 'ONLINE', ping: '15ms' },
  { id: 'IOT-104', name: 'ZKTeco SpeedFace V5L', type: 'Face & Thermal Scanner', ip: '192.168.2.105', location: 'Mumbai Branch Reception', status: 'OFFLINE', ping: 'Timeout' },
];

const MAINTENANCE = [
  { device: 'ZKTeco BioStation 3 - Gate A', firmware: 'v6.60.10', lastService: '15 Jun 2026', nextDue: '15 Dec 2026', status: 'OPERATIONAL' },
  { device: 'Anviz VF30 Pro Biometric', firmware: 'v3.2.1', lastService: '02 Jul 2026', nextDue: '02 Jan 2027', status: 'OPERATIONAL' },
  { device: 'Hikvision Access Control Gate B', firmware: 'v5.1.4', lastService: '20 May 2026', nextDue: '20 Aug 2026', status: 'DUE' },
  { device: 'ZKTeco SpeedFace V5L', firmware: 'v2.9.0', lastService: '10 Mar 2026', nextDue: 'Overdue', status: 'OVERDUE' },
];

const ENROLLMENT = [
  { location: 'Pune Head Office', enrolled: 86, pending: 2, lastSync: '2 mins ago' },
  { location: 'Pune Plant Factory', enrolled: 132, pending: 5, lastSync: '5 mins ago' },
  { location: 'Mumbai Branch', enrolled: 24, pending: 6, lastSync: '1 hr ago' },
];

const ACCESS_RULES = [
  { gate: 'Gate A - Main Entrance', zone: 'General Access', level: 'All Employees', hours: '06:00 - 22:00', status: 'ACTIVE' },
  { gate: 'Turnstile 1 - Factory Floor', zone: 'Restricted / Shopfloor', level: 'Plant Staff Only', hours: '24 x 7 Shift Based', status: 'ACTIVE' },
  { gate: 'Server Room Door', zone: 'High Security', level: 'IT Admins Only', hours: '24 x 7', status: 'ACTIVE' },
  { gate: 'Mumbai Reception', zone: 'General Access', level: 'All Employees', hours: '08:00 - 20:00', status: 'INACTIVE' },
];

export default function IotDevicesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Radio}
        title="IoT Telemetry & Smart Biometric Gateways"
        description="Manage physical biometric machines, AI face terminals, RFID turnstiles & real-time MQTT/OPC-UA event logs"
        badge="3 / 4 Terminals Active"
        badgeVariant="warning"
        actions={
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Ping All Terminals
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Radio} label="Active Gateways" value="3 Online" hint="MQTT Telemetry Active" accent="success" />
        <StatCard icon={Cpu} label="Daily Biometric Scans" value="1,248 Pings" hint="Real-time DB Sync" accent="info" />
        <StatCard icon={Activity} label="Face Match Speed" value="0.2 Seconds" hint="99.8% Accuracy Score" accent="primary" />
        <StatCard icon={ShieldCheck} label="Access Gate Security" value="Secure" hint="Zero Unauthorized Passes" accent="warning" />
      </div>

      <Tabs value={activeTab} onValueChange={(val) => setSearchParams({ tab: val })} className="w-full">
        <TabsList className="flex h-auto flex-wrap gap-1 bg-muted/60 p-1">
          <TabsTrigger value="dashboard" className="text-xs px-3 py-1.5">Dashboard</TabsTrigger>
          <TabsTrigger value="devices" className="text-xs px-3 py-1.5">Devices Directory</TabsTrigger>
          <TabsTrigger value="biometric" className="text-xs px-3 py-1.5">Biometric Machines</TabsTrigger>
          <TabsTrigger value="face-recognition" className="text-xs px-3 py-1.5">Face Recognition</TabsTrigger>
          <TabsTrigger value="access-control" className="text-xs px-3 py-1.5">Access Control Gates</TabsTrigger>
          <TabsTrigger value="logs" className="text-xs px-3 py-1.5">Telemetry Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4">
          <Card className="shadow-2xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Biometric Terminal Inventory & Network Status</CardTitle>
              <CardDescription>Live heartbeat monitoring of physical attendance devices across branches</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Device ID</TableHead>
                    <TableHead className="text-xs">Terminal Name</TableHead>
                    <TableHead className="text-xs">Device Type</TableHead>
                    <TableHead className="text-xs">IP Address</TableHead>
                    <TableHead className="text-xs">Location</TableHead>
                    <TableHead className="text-xs">Ping Latency</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DEVICES.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-xs font-semibold">{d.id}</TableCell>
                      <TableCell className="font-medium text-xs">{d.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{d.type}</TableCell>
                      <TableCell className="text-xs font-mono">{d.ip}</TableCell>
                      <TableCell className="text-xs">{d.location}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{d.ping}</TableCell>
                      <TableCell className="text-xs">
                        {d.status === 'ONLINE' ? (
                          <StatusBadge status="ONLINE" label="Online" className="text-[10px]" />
                        ) : (
                          <StatusBadge status="OFFLINE" label="Offline" className="text-[10px]" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="mt-4">
          <Card className="shadow-2xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Firmware & Maintenance Schedule</CardTitle>
              <CardDescription>Track firmware versions and preventive maintenance windows per terminal</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Device</TableHead>
                    <TableHead className="text-xs">Firmware Version</TableHead>
                    <TableHead className="text-xs">Last Serviced</TableHead>
                    <TableHead className="text-xs">Next Due</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MAINTENANCE.map((m) => (
                    <TableRow key={m.device}>
                      <TableCell className="text-xs font-medium">{m.device}</TableCell>
                      <TableCell className="text-xs font-mono">{m.firmware}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{m.lastService}</TableCell>
                      <TableCell className="text-xs font-mono">{m.nextDue}</TableCell>
                      <TableCell className="text-xs">
                        <StatusBadge status={m.status} className="text-[10px]" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="biometric" className="mt-4">
          <Card className="shadow-2xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Biometric Enrollment Coverage</CardTitle>
              <CardDescription>Fingerprint & face template enrollment status by location</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Location</TableHead>
                    <TableHead className="text-xs">Enrolled Employees</TableHead>
                    <TableHead className="text-xs">Pending Enrollment</TableHead>
                    <TableHead className="text-xs">Last Sync</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ENROLLMENT.map((e) => (
                    <TableRow key={e.location}>
                      <TableCell className="text-xs font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          <Fingerprint className="h-3.5 w-3.5 text-muted-foreground" /> {e.location}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{e.enrolled}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{e.pending}</TableCell>
                      <TableCell className="text-xs">{e.lastSync}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="face-recognition" className="mt-4">
          <EmptyState
            icon={ScanFace}
            title="Face Recognition Analytics"
            description="Live match accuracy, false-reject rate and camera health diagnostics for AI face terminals."
            badge="Coming soon"
          />
        </TabsContent>

        <TabsContent value="access-control" className="mt-4">
          <Card className="shadow-2xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Access Control Gate Rules</CardTitle>
              <CardDescription>Zone-based access levels and permitted entry hours per gate</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Gate</TableHead>
                    <TableHead className="text-xs">Zone</TableHead>
                    <TableHead className="text-xs">Access Level</TableHead>
                    <TableHead className="text-xs">Permitted Hours</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ACCESS_RULES.map((r) => (
                    <TableRow key={r.gate}>
                      <TableCell className="text-xs font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          <DoorOpen className="h-3.5 w-3.5 text-muted-foreground" /> {r.gate}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.zone}</TableCell>
                      <TableCell className="text-xs">{r.level}</TableCell>
                      <TableCell className="text-xs font-mono">{r.hours}</TableCell>
                      <TableCell className="text-xs">
                        <StatusBadge status={r.status} className="text-[10px]" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <EmptyState
            icon={ListChecks}
            title="Telemetry Event Logs"
            description="Raw MQTT / OPC-UA event stream from connected devices, including heartbeats and access events."
            badge="Coming soon"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
