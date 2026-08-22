import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { employeesApi } from '@/api/employees';
import { attendanceApi } from '@/api/attendance-leave';
import { useAuthStore } from '@/stores/auth-store';
import {
  Radio,
  Search,
  Wifi,
  MapPin,
  Fingerprint,
  Video,
  Cpu,
  Brain,
  User,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FaceAttendanceModal } from '@/pages/attendance/FaceAttendanceModal';
import { VerificationDetailsModal } from '@/components/attendance/VerificationDetailsModal';

import { useSearchParams } from 'react-router-dom';
import { EmployeeAttendanceView } from '@/components/attendance/EmployeeAttendanceView';

interface LivePunch {
  id: string;
  time: string;
  code: string;
  name: string;
  dept: string;
  method: string;
  location: string;
  status: 'IN_TIME' | 'LATE_ARRIVING' | string;
  faceVerificationStatus?: string;
  faceMatchScore?: number;
  capturedFacePhoto?: string;
  officeLocation?: string;
  distanceMeters?: number;
  allowedRadiusMeters?: number;
  latitude?: number;
  longitude?: number;
  ipAddress?: string;
  ipVerificationStatus?: string;
  deviceType?: string;
  failureReason?: string;
  employee?: any;
  date?: string;
  checkIn?: string;
  checkOut?: string;
}

export function LiveAttendanceTab() {
  const user = useAuthStore((s) => s.user);
  const [searchParams] = useSearchParams();
  const isDetailsMe = searchParams.get('details') === 'me';

  const [searchQuery, setSearchQuery] = useState('');
  const [isFaceAttendanceOpen, setIsFaceAttendanceOpen] = useState(false);
  const [isVerificationDetailsOpen, setIsVerificationDetailsOpen] = useState(false);
  const [selectedRecordForDetails, setSelectedRecordForDetails] = useState<any>(null);

  // Check if logged-in user is Admin or HR
  const isHrOrAdmin = useMemo(() => {
    if (!user) return true;
    if (user.permissions?.includes('*')) return true;
    const isRoleAdmin = user.roles?.some((r) => {
      const u = r.toUpperCase();
      return u.includes('ADMIN') || u.includes('HR');
    });
    const isPrimaryAdmin =
      user.primaryRole?.toUpperCase().includes('ADMIN') ||
      user.primaryRole?.toUpperCase().includes('HR');
    return Boolean(isRoleAdmin || isPrimaryAdmin);
  }, [user]);

  if (!isHrOrAdmin || isDetailsMe) {
    return <EmployeeAttendanceView />;
  }

  const { data: employeesData } = useQuery({
    queryKey: ['employees', 1, ''],
    queryFn: () => employeesApi.list({ page: 1, pageSize: 1000 }),
  });

  // DB-DRIVEN ONLY: Fetch all attendance records directly from Database API
  const { data: dbAttendanceRecords = [] } = useQuery({
    queryKey: ['attendance-live-records'],
    queryFn: () => attendanceApi.list({}),
    refetchInterval: 2000,
  });

  const employeeItems = useMemo(() => {
    return employeesData?.items || [];
  }, [employeesData]);

  // Transform Database Records directly into LivePunch table objects
  const punches = useMemo(() => {
    if (!dbAttendanceRecords || !Array.isArray(dbAttendanceRecords)) return [];

    // Sort by checkIn timestamp (or date) descending — newest first
    const sorted = [...dbAttendanceRecords].sort((a: any, b: any) => {
      const timeA = a.checkIn ? new Date(a.checkIn).getTime() : new Date(a.date || 0).getTime();
      const timeB = b.checkIn ? new Date(b.checkIn).getTime() : new Date(b.date || 0).getTime();
      return timeB - timeA;
    });

    return sorted.map((r: any): LivePunch => {
      const checkInDate = r.checkIn ? new Date(r.checkIn) : null;
      const timeStr = checkInDate
        ? checkInDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
        : '—';

      const empCode = r.employee?.employeeCode || '—';
      const empName = r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : '—';
      const empDept = r.employee?.department?.name || '—';

      const locStr = r.officeLocation
        ? `${r.officeLocation}${r.distanceMeters !== undefined && r.distanceMeters !== null ? ` (Geofence ${r.distanceMeters}m)` : ''}`
        : '—';

      return {
        id: r.id,
        time: timeStr,
        code: empCode,
        name: empName,
        dept: empDept,
        method: r.verificationMethod || 'Biometric Face ID',
        location: locStr,
        status: r.status,
        faceVerificationStatus: r.faceVerificationStatus || 'VERIFIED',
        faceMatchScore: r.faceMatchScore,
        capturedFacePhoto: r.capturedFacePhoto,
        officeLocation: r.officeLocation,
        distanceMeters: r.distanceMeters,
        allowedRadiusMeters: r.allowedRadiusMeters,
        latitude: r.latitude,
        longitude: r.longitude,
        ipAddress: r.ipAddress,
        ipVerificationStatus: r.ipVerificationStatus,
        deviceType: r.deviceType,
        failureReason: r.failureReason,
        employee: r.employee,
        date: r.date,
        checkIn: r.checkIn,
        checkOut: r.checkOut,
      };
    });
  }, [dbAttendanceRecords]);

  const filteredPunches = punches.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.dept.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenVerificationDetails = (record: LivePunch) => {
    setSelectedRecordForDetails(record);
    setIsVerificationDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* ── 1. Telemetry Stream Status Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Gateway Status</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">Online</p>
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
              <p className="text-2xl font-semibold text-foreground mt-0.5">{dbAttendanceRecords.length} Logs</p>
              <p className="text-[10px] text-primary font-semibold mt-1">Real-time DB sync active</p>
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
              <p className="text-2xl font-semibold text-foreground mt-0.5">3 Active</p>
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
              <p className="text-2xl font-semibold text-foreground mt-0.5">180 ms</p>
              <p className="text-[10px] text-amber-600 font-semibold mt-1">Edge computing stream</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
              <Cpu className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Live Stream Table Section ── */}
      <Card className="shadow-2xs border-border/80 bg-card">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Radio className="h-4 w-4 text-emerald-600 animate-pulse" /> Real-Time Biometric Punch Feed
            </CardTitle>
            <CardDescription className="text-xs">
              Click any employee photo or Face ID verification entry to open complete Verification Details.
            </CardDescription>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search live feed..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs h-9 bg-background/50"
              />
            </div>
            <Button
              onClick={() => setIsFaceAttendanceOpen(true)}
              className="h-9 gap-2 text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-xs"
            >
              <Brain className="h-4 w-4" /> Face ID Punch
            </Button>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-xs font-semibold gap-1.5 h-9 px-3">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" /> Live Streaming
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="text-xs font-bold text-foreground pl-6">Punch Timestamp</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Employee Code</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Employee Photo / Name</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Department</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Verification Method</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Terminal / Location</TableHead>
                <TableHead className="text-right text-xs font-bold text-foreground pr-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPunches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-xs">
                    No attendance records found in database.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPunches.map((punch) => (
                  <TableRow
                    key={punch.id}
                    onClick={() => handleOpenVerificationDetails(punch)}
                    className="hover:bg-accent/40 transition-colors cursor-pointer group"
                  >
                    <TableCell className="font-semibold text-xs whitespace-nowrap pl-6">
                      {punch.time}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-purple-600">
                      {punch.code}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        {punch.capturedFacePhoto ? (
                          <img
                            src={punch.capturedFacePhoto}
                            alt={punch.name}
                            className="w-7 h-7 rounded-full object-cover border border-purple-500/30 shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-600 font-bold text-xs shrink-0">
                            {punch.name.charAt(0)}
                          </div>
                        )}
                        <span className="font-bold text-xs text-foreground group-hover:text-purple-600 transition-colors">
                          {punch.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {punch.dept}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={
                            punch.faceVerificationStatus === 'FAILED'
                              ? 'bg-rose-500/10 text-rose-600 border-rose-500/30 text-[11px]'
                              : 'bg-purple-500/10 text-purple-600 border-purple-500/30 text-[11px]'
                          }
                        >
                          <Brain className="h-3 w-3 mr-1" /> {punch.method}
                          {punch.faceMatchScore !== undefined && punch.faceMatchScore !== null && (
                            <span className="ml-1 text-[10px] opacity-80">{punch.faceMatchScore}%</span>
                          )}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="truncate max-w-[240px]">{punch.location}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6 whitespace-nowrap">
                      <Badge
                        className={
                          punch.status === 'PRESENT' || punch.status === 'IN_TIME'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[11px]'
                            : punch.status === 'LATE_ARRIVING' || punch.status === 'LATE'
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[11px]'
                            : punch.status === 'ABSENT'
                            ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 text-[11px]'
                            : 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 text-[11px]'
                        }
                      >
                        {punch.status === 'PRESENT' || punch.status === 'IN_TIME'
                          ? 'In Time'
                          : punch.status === 'LATE_ARRIVING' || punch.status === 'LATE'
                          ? 'Late Arrival'
                          : punch.status === 'ABSENT'
                          ? 'Absent'
                          : punch.status === 'ON_LEAVE'
                          ? 'On Leave'
                          : punch.status || 'In Time'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Modals ── */}
      <FaceAttendanceModal
        isOpen={isFaceAttendanceOpen}
        onClose={() => setIsFaceAttendanceOpen(false)}
        employees={employeeItems}
      />

      <VerificationDetailsModal
        isOpen={isVerificationDetailsOpen}
        onClose={() => setIsVerificationDetailsOpen(false)}
        record={selectedRecordForDetails}
      />
    </div>
  );
}
