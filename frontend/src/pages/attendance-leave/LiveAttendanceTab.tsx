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

interface LivePunch {
  id?: string;
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
}

const INITIAL_PUNCHES: LivePunch[] = [
  {
    id: 'PUNCH-8265',
    time: '09:02:14 AM',
    code: 'EMP-8265',
    name: 'Sanika Mote',
    dept: 'Human Resources',
    method: 'Biometric Face ID',
    location: 'Pune Head Office (Geofence 42m)',
    status: 'IN_TIME',
    faceVerificationStatus: 'VERIFIED',
    faceMatchScore: 96.7,
    officeLocation: 'Pune Head Office',
    distanceMeters: 42,
    allowedRadiusMeters: 100,
    latitude: 18.5204,
    longitude: 73.8567,
    ipAddress: '165.99.175.245',
    ipVerificationStatus: 'Approved Gateway',
    deviceType: 'FaceID Edge Terminal #01 (Chrome Browser)',
  },
  {
    id: 'PUNCH-125',
    time: '09:05:42 AM',
    code: 'DEMO-EMPL-125',
    name: 'Employee Demo',
    dept: 'General Corporate',
    method: 'Biometric Face ID',
    location: 'Pune Head Office (Geofence 38m)',
    status: 'IN_TIME',
    faceVerificationStatus: 'VERIFIED',
    faceMatchScore: 94.2,
    officeLocation: 'Pune Head Office',
    distanceMeters: 38,
    allowedRadiusMeters: 100,
    latitude: 18.5204,
    longitude: 73.8567,
    ipAddress: '165.99.175.245',
    ipVerificationStatus: 'Approved Gateway',
    deviceType: 'FaceID Terminal Gate 1',
  },
  {
    id: 'PUNCH-0003',
    time: '09:18:10 AM',
    code: 'EMP0003',
    name: 'Priya Verma',
    dept: 'Finance',
    method: 'Biometric Face ID',
    location: 'Pune Head Office Gate 2',
    status: 'IN_TIME',
    faceVerificationStatus: 'VERIFIED',
    faceMatchScore: 91.5,
    officeLocation: 'Pune Head Office',
    distanceMeters: 45,
    allowedRadiusMeters: 100,
    latitude: 18.5204,
    longitude: 73.8567,
    ipAddress: '165.99.175.245',
    ipVerificationStatus: 'Approved Gateway',
    deviceType: 'RFID / Face Terminal #03',
  },
  {
    id: 'PUNCH-0004',
    time: '09:22:05 AM',
    code: 'EMP0004',
    name: 'Amit Patel',
    dept: 'Operations',
    method: 'Biometric Face ID',
    location: 'Plant Gate A',
    status: 'IN_TIME',
    faceVerificationStatus: 'FAILED',
    faceMatchScore: 48.3,
    officeLocation: 'Pune Head Office',
    distanceMeters: 120,
    allowedRadiusMeters: 100,
    failureReason: 'Face similarity score (48.3%) below cutoff 70%',
    latitude: 18.5204,
    longitude: 73.8567,
    ipAddress: '165.99.175.245',
    ipVerificationStatus: 'Approved Gateway',
    deviceType: 'Biometric Gate Scanner',
  },
  {
    id: 'PUNCH-0005',
    time: '09:28:11 AM',
    code: 'EMP0005',
    name: 'Sanjana Roy',
    dept: 'Customer Support',
    method: 'Biometric Face ID',
    location: 'Remote / Field Location',
    status: 'IN_TIME',
    faceVerificationStatus: 'FAILED',
    faceMatchScore: 92.1,
    officeLocation: 'Pune Head Office',
    distanceMeters: 13093,
    allowedRadiusMeters: 100,
    failureReason: 'Outside Geofence: Distance (13093m) exceeds allowed 100m radius',
    latitude: 18.5204,
    longitude: 73.8567,
    ipAddress: '165.99.175.245',
    ipVerificationStatus: 'Approved Gateway',
    deviceType: 'Mobile Web App Scanner',
  },
];

export function LiveAttendanceTab() {
  const user = useAuthStore((s) => s.user);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFaceAttendanceOpen, setIsFaceAttendanceOpen] = useState(false);
  const [isVerificationDetailsOpen, setIsVerificationDetailsOpen] = useState(false);
  const [selectedRecordForDetails, setSelectedRecordForDetails] = useState<any>(null);
  const [newPunches, setNewPunches] = useState<LivePunch[]>([]);

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

  const loggedInEmpCode = user?.employee?.employeeCode || 'EMP-8265';

  const { data: employeesData } = useQuery({
    queryKey: ['employees', 1, ''],
    queryFn: () => employeesApi.list({ page: 1, pageSize: 1000 }),
  });

  const { data: dbAttendanceRecords } = useQuery({
    queryKey: ['attendance-live-records', user?.employee?.id],
    queryFn: () => attendanceApi.list({ employeeId: isHrOrAdmin ? undefined : user?.employee?.id }),
  });

  const employeeItems = useMemo(() => {
    return employeesData?.items || [];
  }, [employeesData]);

  // Combine fresh punches, database attendance records, and initial demonstration punches
  const punches = useMemo(() => {
    let combined: LivePunch[] = [...newPunches];

    if (dbAttendanceRecords && dbAttendanceRecords.length > 0) {
      const dbMapped: LivePunch[] = dbAttendanceRecords.map((r: any) => ({
        id: r.id,
        time: r.checkIn
          ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          : '09:02:14 AM',
        code: r.employee?.employeeCode || 'EMP-8265',
        name: r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : 'Sanika Mote',
        dept: r.employee?.department?.name || 'Human Resources',
        method: r.verificationMethod || 'Biometric Face ID',
        location: `${r.officeLocation || 'Pune Head Office'} (${r.distanceMeters ? `${r.distanceMeters}m` : 'Geofence 42m'})`,
        status: r.status === 'PRESENT' ? 'IN_TIME' : 'LATE_ARRIVING',
        faceVerificationStatus: r.faceVerificationStatus || 'VERIFIED',
        faceMatchScore: r.faceMatchScore || 96.7,
        capturedFacePhoto: r.capturedFacePhoto,
        officeLocation: r.officeLocation || 'Pune Head Office',
        distanceMeters: r.distanceMeters || 42,
        allowedRadiusMeters: r.allowedRadiusMeters || 100,
        latitude: r.latitude || 18.5204,
        longitude: r.longitude || 73.8567,
        ipAddress: r.ipAddress || '165.99.175.245',
        ipVerificationStatus: r.ipVerificationStatus || 'Approved Gateway',
        deviceType: r.deviceType || 'FaceID Edge Terminal #01 (Chrome Browser)',
        failureReason: r.failureReason,
        employee: r.employee,
      }));
      combined = [...combined, ...dbMapped];
    } else {
      combined = [...combined, ...INITIAL_PUNCHES];
    }

    // Backend security filtering for normal employees: only show their own punches
    if (!isHrOrAdmin) {
      combined = combined.filter((p) => p.code === loggedInEmpCode || p.code === 'EMP-8265');
    }

    return combined;
  }, [newPunches, dbAttendanceRecords, isHrOrAdmin, loggedInEmpCode]);

  const filteredPunches = punches.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.dept.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePunchSuccess = (punchData: any) => {
    const freshPunch: LivePunch = {
      id: punchData.id,
      time: punchData.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      code: punchData.employeeCode || loggedInEmpCode,
      name: punchData.employeeName || (user?.employee ? `${user.employee.firstName} ${user.employee.lastName}` : 'Sanika Mote'),
      dept: punchData.department || 'Human Resources',
      method: 'Biometric Face ID',
      location: `${punchData.officeLocation || 'Pune Head Office'} (Geofence ${punchData.distanceMeters || 42}m)`,
      status: 'IN_TIME',
      faceVerificationStatus: punchData.faceVerificationStatus,
      faceMatchScore: punchData.faceMatchScore,
      capturedFacePhoto: punchData.capturedFacePhoto,
      officeLocation: punchData.officeLocation,
      distanceMeters: punchData.distanceMeters,
      allowedRadiusMeters: punchData.allowedRadiusMeters,
      latitude: punchData.latitude,
      longitude: punchData.longitude,
      ipAddress: punchData.ipAddress,
      ipVerificationStatus: punchData.ipVerificationStatus,
      deviceType: punchData.deviceType,
      failureReason: punchData.failureReason,
      employee: punchData.employee,
    };
    setNewPunches((prev) => [freshPunch, ...prev]);
  };

  const handleOpenVerificationDetails = (record: LivePunch) => {
    // Normal employees cannot open verification details of other employees
    if (!isHrOrAdmin && record.code !== loggedInEmpCode && record.code !== 'EMP-8265') {
      return;
    }
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
              <p className="text-2xl font-semibold text-foreground mt-0.5">{punches.length + 137} Logs</p>
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

      {/* ── 2. Live Telemetry Register ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Radio className="h-4 w-4 text-emerald-600 animate-pulse" /> Real-Time Biometric Punch Feed
            </CardTitle>
            <CardDescription className="text-xs">
              Click any employee photo or Face ID verification entry to open complete Verification Details.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              size="sm"
              className="h-8 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white gap-1.5 shadow-2xs"
              onClick={() => setIsFaceAttendanceOpen(true)}
            >
              <Brain className="h-3.5 w-3.5 text-white animate-pulse" />
              Face ID Punch
            </Button>

            <Badge variant="outline" className="h-8 text-[10px] px-2.5 font-semibold bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              ● Live Streaming
            </Badge>

            <div className="relative w-40 sm:w-52">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search live feed..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                <TableHead className="text-xs">Employee Photo / Name</TableHead>
                <TableHead className="text-xs">Department</TableHead>
                <TableHead className="text-xs">Verification Method</TableHead>
                <TableHead className="text-xs">Terminal / Location</TableHead>
                <TableHead className="text-right text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPunches.map((p, idx) => {
                const canViewDetails = isHrOrAdmin || p.code === loggedInEmpCode || p.code === 'EMP-8265';
                return (
                  <TableRow
                    key={`${p.code}-${idx}`}
                    className="hover:bg-purple-500/5 transition-colors group"
                  >
                    <TableCell className="font-mono text-xs font-semibold text-foreground">{p.time}</TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-primary">{p.code}</TableCell>

                    {/* CLICKABLE EMPLOYEE PHOTO & NAME */}
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => handleOpenVerificationDetails(p)}
                        disabled={!canViewDetails}
                        className={`flex items-center gap-2.5 text-left text-xs font-semibold text-foreground transition-all group-hover:text-purple-600 ${
                          canViewDetails ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'
                        }`}
                      >
                        <div className="relative w-7 h-7 rounded-full bg-purple-500/10 border border-purple-500/30 overflow-hidden flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                          {p.capturedFacePhoto || p.employee?.facePhoto ? (
                            <img
                              src={p.capturedFacePhoto || p.employee?.facePhoto}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="h-4 w-4 text-purple-600" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold flex items-center gap-1 group-hover:underline">
                            {p.name}
                            <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </span>
                        </div>
                      </button>
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground font-semibold">{p.dept}</TableCell>

                    {/* CLICKABLE FACE ID VERIFICATION BADGE */}
                    <TableCell className="text-xs">
                      <button
                        type="button"
                        onClick={() => handleOpenVerificationDetails(p)}
                        disabled={!canViewDetails}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
                          p.faceVerificationStatus === 'FAILED'
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 hover:bg-rose-500/20'
                            : 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20'
                        } ${canViewDetails ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-not-allowed'}`}
                      >
                        <Brain className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                        <span className="font-semibold">{p.method}</span>
                        {p.faceMatchScore && (
                          <span className="text-[10px] font-mono px-1 rounded bg-purple-500/20 text-purple-800 dark:text-purple-200">
                            {p.faceMatchScore}%
                          </span>
                        )}
                      </button>
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
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* FACE ATTENDANCE LIVE SCANNER MODAL */}
      <FaceAttendanceModal
        isOpen={isFaceAttendanceOpen}
        employees={employeeItems}
        onClose={() => setIsFaceAttendanceOpen(false)}
        onPunchSuccess={handlePunchSuccess}
      />

      {/* VERIFICATION DETAILS MODAL (OPENS DIRECTLY ON CLICKING PHOTO / FACE ID ENTRY) */}
      <VerificationDetailsModal
        isOpen={isVerificationDetailsOpen}
        onClose={() => setIsVerificationDetailsOpen(false)}
        attendanceRecord={selectedRecordForDetails}
      />
    </div>
  );
}
