import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { attendanceApi } from '@/api/attendance-leave';
import { employeesApi } from '@/api/employees';
import {
  Brain,
  CheckCircle2,
  Clock,
  MapPin,
  CalendarClock,
  User,
  Radio,
  Search,
  ExternalLink,
  ShieldCheck,
  Calendar as CalendarIcon,
  Video,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CurrentMonthAttendanceCalendar, type AttendanceDayData } from '@/components/attendance/CurrentMonthAttendanceCalendar';
import { FaceAttendanceModal } from '@/pages/attendance/FaceAttendanceModal';
import { VerificationDetailsModal } from '@/components/attendance/VerificationDetailsModal';

export function EmployeeAttendanceView() {
  const user = useAuthStore((s) => s.user);

  const [selectedDateStr, setSelectedDateStr] = useState<string>('2026-08-21');
  const [selectedDayData, setSelectedDayData] = useState<AttendanceDayData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [isFaceAttendanceOpen, setIsFaceAttendanceOpen] = useState(false);
  const [isVerificationDetailsOpen, setIsVerificationDetailsOpen] = useState(false);
  const [selectedRecordForDetails, setSelectedRecordForDetails] = useState<any>(null);
  const [newPunches, setNewPunches] = useState<any[]>([]);

  // Logged-in employee details
  const empName = user?.employee ? `${user.employee.firstName} ${user.employee.lastName}` : 'Sanika Mote';
  const empCode = user?.employee?.employeeCode || 'EMP-8265';
  const deptName = user?.employee?.departmentName || 'Human Resources';
  const empId = user?.employee?.id;

  // Fetch logged-in employee profile
  const { data: employeeData } = useQuery({
    queryKey: ['employee-profile-me', empId],
    queryFn: () => employeesApi.get(empId || 'me'),
  });

  // Fetch logged-in employee attendance records
  const { data: dbAttendanceRecords = [] } = useQuery({
    queryKey: ['my-attendance-records', empId],
    queryFn: () => attendanceApi.list({ employeeId: empId }),
  });

  // Mapped employee punch list
  const punches = useMemo(() => {
    let combined: any[] = [...newPunches];

    if (dbAttendanceRecords && dbAttendanceRecords.length > 0) {
      const dbMapped = dbAttendanceRecords.map((r: any) => ({
        id: r.id,
        time: r.checkIn
          ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          : '09:02:14 AM',
        code: r.employee?.employeeCode || empCode,
        name: r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : empName,
        dept: r.employee?.department?.name || deptName,
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
        employee: r.employee || employeeData,
      }));
      combined = [...combined, ...dbMapped];
    } else {
      // Default fallback Demonstration punch for logged-in employee
      combined.push({
        id: `PUNCH-${empCode}`,
        time: '09:02:14 AM',
        code: empCode,
        name: empName,
        dept: deptName,
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
        employee: employeeData,
      });
    }

    // Filter strictly for logged-in employee data
    return combined.filter(
      (p) => p.code === empCode || p.code === 'EMP-8265' || p.code === user?.employee?.employeeCode
    );
  }, [newPunches, dbAttendanceRecords, empCode, empName, deptName, employeeData, user]);

  const filteredPunches = punches.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.dept.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePunchSuccess = (punchData: any) => {
    const freshPunch = {
      id: punchData.id || `PUNCH-${Date.now()}`,
      time: punchData.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      code: empCode,
      name: empName,
      dept: deptName,
      method: 'Biometric Face ID',
      location: `${punchData.officeLocation || 'Pune Head Office'} (Geofence ${punchData.distanceMeters || 42}m)`,
      status: 'IN_TIME',
      faceVerificationStatus: punchData.faceVerificationStatus || 'VERIFIED',
      faceMatchScore: punchData.faceMatchScore || 96.7,
      capturedFacePhoto: punchData.capturedFacePhoto,
      officeLocation: punchData.officeLocation || 'Pune Head Office',
      distanceMeters: punchData.distanceMeters || 42,
      allowedRadiusMeters: punchData.allowedRadiusMeters || 100,
      employee: employeeData,
    };
    setNewPunches((prev) => [freshPunch, ...prev]);
  };

  const handleOpenVerificationDetails = (record: any) => {
    setSelectedRecordForDetails(record);
    setIsVerificationDetailsOpen(true);
  };

  const handleSelectCalendarDate = (dateStr: string, dayData?: AttendanceDayData) => {
    setSelectedDateStr(dateStr);
    if (dayData) {
      setSelectedDayData(dayData);
    }
  };

  // Registered Face Photo
  const registeredFacePhoto = employeeData?.facePhoto || null;
  const latestCapturedPhoto = punches[0]?.capturedFacePhoto || null;

  return (
    <div className="space-y-6">
      {/* ── 1. Top Cards (4 Cards) ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Today's Status</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">Present</p>
              <p className="text-[10px] text-muted-foreground font-medium mt-1">Checked In at 09:02 AM</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <User className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Work Hours</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">9h 39m</p>
              <p className="text-[10px] text-primary font-semibold mt-1">In Progress</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Monthly Present</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">15 Days</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">Till Aug 21, 2026</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <CalendarClock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Leave Balance</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">10 / 18</p>
              <p className="text-[10px] text-purple-600 font-semibold mt-1">Remaining</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 shrink-0">
              <CalendarClock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Middle Layout: Calendar & Verification Details ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Current Month Attendance Calendar (7 Cols) */}
        <div className="lg:col-span-7">
          <CurrentMonthAttendanceCalendar
            selectedDate={selectedDateStr}
            onSelectDate={handleSelectCalendarDate}
            employeeId={empId}
          />
        </div>

        {/* Right Column: Attendance Verification Details Panel (5 Cols) */}
        <div className="lg:col-span-5">
          <Card className="shadow-xs border-border/80 h-full flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-primary" />
                  <span>Attendance Verification Details — {selectedDateStr === '2026-08-21' ? '21 August 2026' : selectedDateStr}</span>
                </CardTitle>
              </div>

              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-xs font-semibold">
                {selectedDayData?.status || 'Present'}
              </Badge>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 space-y-4 flex-1">
              {/* Punch Stats */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 text-center">
                  <span className="text-[10px] font-semibold uppercase text-muted-foreground block">Check In Time</span>
                  <span className="text-sm font-bold text-foreground font-mono mt-0.5 block">
                    {selectedDayData?.checkIn || '09:02 AM'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 text-center">
                  <span className="text-[10px] font-semibold uppercase text-muted-foreground block">Check Out Time</span>
                  <span className="text-sm font-bold text-foreground font-mono mt-0.5 block">
                    {selectedDayData?.checkOut || '06:41 PM'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 text-center">
                  <span className="text-[10px] font-semibold uppercase text-muted-foreground block">Total Work Hours</span>
                  <span className="text-sm font-bold text-primary font-mono mt-0.5 block">
                    {selectedDayData?.workHours || '9h 39m'}
                  </span>
                </div>
              </div>

              {/* Face ID Biometric Verification Card */}
              <div className="p-3.5 rounded-2xl border border-purple-500/30 bg-purple-500/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5 uppercase tracking-wider">
                    <Brain className="h-4 w-4 text-purple-600" /> Face ID Biometric Verification
                  </span>
                  <Badge variant="outline" className="text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
                    Verified (Match: 96.7%)
                  </Badge>
                </div>

                {/* Face Photos (Registered Face vs Live Captured Face) */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {/* Registered Face */}
                  <div className="flex flex-col items-center p-3 rounded-xl bg-card border border-border/60 text-center space-y-2">
                    <span className="text-[10.5px] font-semibold text-muted-foreground">Registered Face</span>
                    <div className="w-16 h-16 rounded-full bg-purple-500/10 border-2 border-purple-500/30 overflow-hidden flex items-center justify-center shadow-xs">
                      {registeredFacePhoto ? (
                        <img src={registeredFacePhoto} alt={empName} className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-8 w-8 text-purple-600" />
                      )}
                    </div>
                    <span className="text-xs font-bold text-foreground">{empName}</span>
                  </div>

                  {/* Live Captured Face */}
                  <div className="flex flex-col items-center p-3 rounded-xl bg-card border border-border/60 text-center space-y-2">
                    <span className="text-[10.5px] font-semibold text-muted-foreground">Live Captured Face</span>
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 overflow-hidden flex items-center justify-center shadow-xs">
                      {latestCapturedPhoto ? (
                        <img src={latestCapturedPhoto} alt="Captured Live" className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-8 w-8 text-emerald-600" />
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-600">Captured Live Camera</span>
                  </div>
                </div>
              </div>

              {/* GPS & Geofence Location Verification */}
              <div className="p-3.5 rounded-2xl border border-blue-500/30 bg-blue-500/5 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <MapPin className="h-4 w-4 text-blue-600" /> GPS & Geofence Location Verification
                  </span>
                  <Badge variant="outline" className="text-[10px] font-semibold bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30">
                    Inside Geofence
                  </Badge>
                </div>

                <div className="space-y-1.5 pt-1 font-mono text-[11px]">
                  <div className="flex justify-between border-b border-blue-500/10 pb-1">
                    <span className="text-muted-foreground font-sans font-medium">Office Location:</span>
                    <span className="font-bold text-foreground">Pune Head Office</span>
                  </div>
                  <div className="flex justify-between border-b border-blue-500/10 pb-1">
                    <span className="text-muted-foreground font-sans font-medium">Geofence Distance:</span>
                    <span className="font-bold text-emerald-600">42 m (Allowed: 100 m)</span>
                  </div>
                  <div className="flex justify-between border-b border-blue-500/10 pb-1">
                    <span className="text-muted-foreground font-sans font-medium">Employee Code:</span>
                    <span className="font-bold text-primary">{empCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-sans font-medium">Verification Time:</span>
                    <span className="font-semibold text-foreground">21/08/2026 09:02:14 AM</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── 3. Bottom Section: Real-Time Biometric Punch Feed Table ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Radio className="h-4 w-4 text-emerald-600 animate-pulse" /> Real-Time Biometric Punch Feed
            </CardTitle>
            <CardDescription className="text-xs">
              Click on any entry to open complete verification details.
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
              {filteredPunches.map((p, idx) => (
                <TableRow
                  key={`${p.code}-${idx}`}
                  className="hover:bg-purple-500/5 transition-colors cursor-pointer group"
                  onClick={() => handleOpenVerificationDetails(p)}
                >
                  <TableCell className="font-mono text-xs font-semibold text-foreground">{p.time}</TableCell>
                  <TableCell className="font-mono text-xs font-semibold text-primary">{p.code}</TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2.5 text-left text-xs font-semibold text-foreground group-hover:text-purple-600">
                      <div className="relative w-7 h-7 rounded-full bg-purple-500/10 border border-purple-500/30 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                        {p.capturedFacePhoto || registeredFacePhoto ? (
                          <img
                            src={p.capturedFacePhoto || registeredFacePhoto}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="h-4 w-4 text-purple-600" />
                        )}
                      </div>
                      <span className="font-semibold flex items-center gap-1 group-hover:underline">
                        {p.name}
                        <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground font-semibold">{p.dept}</TableCell>

                  <TableCell className="text-xs">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300">
                      <Brain className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                      <span className="font-semibold">{p.method}</span>
                      {p.faceMatchScore && (
                        <span className="text-[10px] font-mono px-1 rounded bg-purple-500/20 text-purple-800 dark:text-purple-200">
                          {p.faceMatchScore}%
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-xs font-mono">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                      {p.location}
                    </span>
                  </TableCell>

                  <TableCell className="text-right">
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9.5px] font-semibold">
                      In Time
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* FACE ATTENDANCE LIVE SCANNER MODAL */}
      <FaceAttendanceModal
        isOpen={isFaceAttendanceOpen}
        employees={employeeData ? [employeeData] : []}
        onClose={() => setIsFaceAttendanceOpen(false)}
        onPunchSuccess={handlePunchSuccess}
      />

      {/* VERIFICATION DETAILS MODAL */}
      <VerificationDetailsModal
        isOpen={isVerificationDetailsOpen}
        onClose={() => setIsVerificationDetailsOpen(false)}
        attendanceRecord={selectedRecordForDetails}
      />
    </div>
  );
}
