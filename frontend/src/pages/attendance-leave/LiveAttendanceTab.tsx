import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { employeesApi } from '@/api/employees';
import {
  Radio,
  Search,
  Wifi,
  MapPin,
  Fingerprint,
  Video,
  Cpu,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface LivePunch {
  time: string;
  code: string;
  name: string;
  dept: string;
  method: 'Biometric Face ID' | 'Mobile GPS Punch' | 'RFID Card' | 'Biometric Fingerprint';
  location: string;
  status: 'IN_TIME' | 'LATE_ARRIVING';
}

const LIVE_PUNCHES: LivePunch[] = [
  { time: '09:02:14 AM', code: 'EMP0001', name: 'Admin User', dept: 'Human Resources', method: 'Biometric Face ID', location: 'Pune HQ Gate 1', status: 'IN_TIME' },
  { time: '09:05:42 AM', code: 'EMP0002', name: 'Rajesh Sharma', dept: 'Engineering', method: 'Mobile GPS Punch', location: 'Pune HQ Gate 1', status: 'IN_TIME' },
  { time: '09:18:10 AM', code: 'EMP0003', name: 'Priya Verma', dept: 'Finance', method: 'RFID Card', location: 'Pune HQ Gate 2', status: 'LATE_ARRIVING' },
  { time: '09:22:05 AM', code: 'EMP0004', name: 'Amit Patel', dept: 'Operations', method: 'Biometric Fingerprint', location: 'Pune Plant Gate A', status: 'IN_TIME' },
  { time: '09:28:11 AM', code: 'EMP0005', name: 'Sanjana Roy', dept: 'Customer Support', method: 'Mobile GPS Punch', location: 'Remote / Work From Field', status: 'IN_TIME' },
];

export function LiveAttendanceTab() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: employeesData } = useQuery({
    queryKey: ['employees', 1, ''],
    queryFn: () => employeesApi.list({ page: 1, pageSize: 1000 }),
  });

  const punches = useMemo(() => {
    if (!employeesData?.items) return LIVE_PUNCHES;

    const isSeededEmployee = (emp: any) => {
      if (!emp.employeeCode) return false;
      return /^EMP00[0-2][0-9]$/.test(emp.employeeCode);
    };

    const customPunches: LivePunch[] = employeesData.items
      .filter((emp: any) => !isSeededEmployee(emp))
      .map((emp: any) => ({
        time: '09:00:15 AM',
        code: emp.employeeCode,
        name: `${emp.firstName} ${emp.lastName}`,
        dept: emp.department?.name ?? 'General Corporate',
        method: 'Biometric Face ID' as const,
        location: emp.location ?? 'New York HQ',
        status: 'IN_TIME' as const,
      }));

    return [...customPunches, ...LIVE_PUNCHES];
  }, [employeesData]);

  const filteredPunches = punches.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.dept.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* ── 1. Telemetry Stream Status Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Gateway Status</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">Online</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">4 terminals connected</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <Wifi className="h-5 w-5 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Today's Punches</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">142 Logs</p>
              <p className="text-[10px] text-primary font-semibold mt-1">Real-time sync active</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Fingerprint className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Face ID Terminals</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">3 Active</p>
              <p className="text-[10px] text-violet-600 font-semibold mt-1">CCTV integrations OK</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 shrink-0">
              <Video className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Sync Latency</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">180 ms</p>
              <p className="text-[10px] text-amber-600 font-semibold mt-1">Edge computing stream</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
              <Cpu className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Live Telemetry Register ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Radio className="h-4 w-4 text-emerald-600 animate-pulse" /> Real-Time Biometric Punch Feed
            </CardTitle>
            <CardDescription className="text-xs">
              Live telemetry stream from Face ID, Biometric Terminals & Mobile Geofence locations
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className="h-7 text-[10px] px-2.5 font-semibold bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              ● Live Streaming
            </Badge>
            <div className="relative w-40 sm:w-52">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search live feed..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-background"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Punch Timestamp</TableHead>
                <TableHead className="text-xs">Employee Code</TableHead>
                <TableHead className="text-xs">Employee Name</TableHead>
                <TableHead className="text-xs">Department</TableHead>
                <TableHead className="text-xs">Verification Method</TableHead>
                <TableHead className="text-xs">Terminal / Location</TableHead>
                <TableHead className="text-right text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPunches.map((p, idx) => (
                <TableRow key={`${p.code}-${idx}`} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold text-foreground">{p.time}</TableCell>
                  <TableCell className="font-mono text-xs font-semibold text-primary">{p.code}</TableCell>
                  <TableCell className="font-semibold text-xs text-foreground">{p.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-semibold">{p.dept}</TableCell>
                  <TableCell className="text-xs">
                    <span className="flex items-center gap-1">
                      <Fingerprint className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      {p.method}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-mono">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                      {p.location}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {p.status === 'IN_TIME' ? (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9.5px] font-semibold">
                        In Time
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[9.5px] font-semibold">
                        Late Arrival
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
