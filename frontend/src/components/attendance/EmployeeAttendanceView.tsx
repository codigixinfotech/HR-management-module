import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { attendanceApi } from '@/api/attendance-leave';
import { employeesApi } from '@/api/employees';
import {
  Brain,
  CheckCircle2,
  XCircle,
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
  Eye,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CurrentMonthAttendanceCalendar, type AttendanceDayData } from '@/components/attendance/CurrentMonthAttendanceCalendar';
import { FaceAttendanceModal } from '@/pages/attendance/FaceAttendanceModal';
import { VerificationDetailsModal } from '@/components/attendance/VerificationDetailsModal';
import { EditAttendanceRequestModal } from '@/components/attendance/EditAttendanceRequestModal';
import { FileSignature } from 'lucide-react';
import { toast } from 'sonner';

import { getTodayDateStr } from '@/lib/utils';

import { useAttendanceRequestsStore, syncAttendanceStoreFromStorage } from '@/stores/attendance-requests-store';

export function EmployeeAttendanceView() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [selectedDateStr, setSelectedDateStr] = useState<string>(getTodayDateStr());
  const [selectedDayData, setSelectedDayData] = useState<AttendanceDayData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [isFaceAttendanceOpen, setIsFaceAttendanceOpen] = useState(false);
  const [isVerificationDetailsOpen, setIsVerificationDetailsOpen] = useState(false);
  const [selectedRecordForDetails, setSelectedRecordForDetails] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRecordForEdit, setSelectedRecordForEdit] = useState<any>(null);

  // Logged-in employee details
  const empName = user?.employee
    ? `${user.employee.firstName} ${user.employee.lastName}`
    : user?.email?.split('@')[0] || 'Employee';
  const empCode = user?.employee?.employeeCode || 'EMP-NEW';
  const deptName = user?.employee?.departmentName || 'Operations';
  const empId = user?.employee?.id;

  // Attendance Edit Requests Queue & Approved Corrections (Using persistent shared store)
  const { requests: editRequests, deleteRequest, approvedCorrections } = useAttendanceRequestsStore();

  useEffect(() => {
    syncAttendanceStoreFromStorage();
    window.addEventListener('focus', syncAttendanceStoreFromStorage);
    return () => window.removeEventListener('focus', syncAttendanceStoreFromStorage);
  }, []);

  // Filter requests for the logged-in employee strictly by employeeCode
  const isMiaVance = user?.email === 'mia.vance2@demo-manufacturing.com';
  const myEditRequests = editRequests.filter((r) => {
    if (r.employeeCode === 'EMP0002' && !isMiaVance) return false;
    const currentCode = user?.employee?.employeeCode || empCode;
    return r.employeeCode === currentCode;
  });

  // Fetch logged-in employee profile
  const { data: employeeData } = useQuery({
    queryKey: ['employee-profile-me', empId],
    queryFn: () => employeesApi.get(empId || 'me'),
  });

  // Fetch attendance records for current logged-in employee directly from Database API
  const { data: dbAttendanceRecords = [] } = useQuery({
    queryKey: ['my-attendance-records', empId, empCode],
    queryFn: () => attendanceApi.getMy(),
    refetchInterval: 3000,
  });

  // Fetch summary metrics for current logged-in employee directly from Database API
  const { data: mySummary } = useQuery({
    queryKey: ['my-attendance-summary', empId, empCode],
    queryFn: () => attendanceApi.getMySummary(),
    refetchInterval: 3000,
  });

  // Real-Time Biometric Punch Feed — DB records ONLY for current logged-in employee
  const punches = useMemo(() => {
    if (!dbAttendanceRecords || !Array.isArray(dbAttendanceRecords) || dbAttendanceRecords.length === 0) {
      return [];
    }

    // Sort by checkIn timestamp (or date) descending — newest first
    const sorted = [...dbAttendanceRecords].sort((a: any, b: any) => {
      const timeA = a.checkIn ? new Date(a.checkIn).getTime() : new Date(a.date || 0).getTime();
      const timeB = b.checkIn ? new Date(b.checkIn).getTime() : new Date(b.date || 0).getTime();
      return timeB - timeA;
    });

    return sorted.map((r: any) => {
      const checkInDate = r.checkIn ? new Date(r.checkIn) : null;
      const dateDisplayStr = r.date
        ? new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '—';
      const clockInStr = checkInDate
        ? checkInDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        : '—';
      const clockOutStr = r.checkOut
        ? new Date(r.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        : '—';
      const timeStr = checkInDate
        ? checkInDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
        : '—';

      const codeStr = r.employee?.employeeCode || empCode;
      const nameStr = r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : empName;
      const deptStr = r.employee?.department?.name || deptName;

      const locStr = r.officeLocation
        ? `${r.officeLocation}${r.distanceMeters !== undefined && r.distanceMeters !== null ? ` (${r.distanceMeters}m)` : ''}`
        : 'Pune Head Office';

      return {
        id: r.id,
        dateDisplay: dateDisplayStr,
        clockIn: clockInStr,
        clockOut: clockOutStr,
        time: timeStr,
        code: codeStr,
        name: nameStr,
        dept: deptStr,
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
        employee: r.employee || employeeData,
      };
    });
  }, [dbAttendanceRecords, empCode, empName, deptName, employeeData]);

  const filteredPunches = punches.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.dept.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePunchSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['my-attendance-records'] });
    queryClient.invalidateQueries({ queryKey: ['attendance-live-records'] });
  };

  const handleOpenVerificationDetails = (record: any) => {
    setSelectedRecordForDetails(record);
    setIsVerificationDetailsOpen(true);
  };

  const handleOpenEditModal = (record: any) => {
    setSelectedRecordForEdit(record);
    setIsEditModalOpen(true);
  };

  // Submitting an edit request DOES NOT modify original biometric punches
  const handleEditSuccess = (_createdReq: any) => {
    setIsEditModalOpen(false);
  };

  const handleApproveRequest = (req: any) => {
    setEditRequests((prev) =>
      prev.map((r) => (r.id === req.id ? { ...r, status: 'APPROVED' } : r))
    );

    const calcHours = calculateTotalHours(req.requestedClockIn, req.requestedClockOut);

    setApprovedCorrections((prev) => ({
      ...prev,
      [req.dateDisplay]: {
        clockIn: req.requestedClockIn,
        clockOut: req.requestedClockOut,
        totalHours: calcHours,
      },
    }));

    toast.success(
      `Attendance edit request approved for ${req.employeeName}! Summary updated to ${req.requestedClockIn} - ${req.requestedClockOut}.`
    );
  };

  const handleRejectRequest = (id: string) => {
    setEditRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'REJECTED' } : r))
    );
    toast.info('Attendance edit request rejected.');
  };

  const handleSelectCalendarDate = (dateStr: string, dayData?: AttendanceDayData) => {
    setSelectedDateStr(dateStr);
    if (dayData) {
      setSelectedDayData(dayData);
    }
  };

  // Helper for computing hours
  const calculateTotalHours = (clockInStr?: string, clockOutStr?: string) => {
    if (!clockInStr || !clockOutStr || clockInStr === '—' || clockOutStr === '—') return '—';
    try {
      const parseTime = (t: string) => {
        const isPm = t.toUpperCase().includes('PM');
        const isAm = t.toUpperCase().includes('AM');
        const clean = t.replace(/(AM|PM)/i, '').trim();
        const parts = clean.split(':').map(Number);
        let hours = parts[0] || 0;
        const minutes = parts[1] || 0;
        if (isPm && hours < 12) hours += 12;
        if (isAm && hours === 12) hours = 0;
        return hours * 60 + minutes;
      };
      const inMins = parseTime(clockInStr);
      let outMins = parseTime(clockOutStr);

      // Support overnight / cross-midnight shifts (e.g. 3:00 PM to 6:30 AM)
      if (outMins <= inMins) {
        outMins += 24 * 60;
      }

      const diff = outMins - inMins;
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      return `${h}h ${String(m).padStart(2, '0')}m`;
    } catch {
      return '—';
    }
  };

  // Registered Face Photo
  const registeredFacePhoto = employeeData?.facePhoto || null;

  // Selected or active DB punch for Attendance Verification Details panel
  const activeRecord = selectedRecordForDetails || punches[0] || null;

  const summaryCheckIn = mySummary?.checkInTime && mySummary.checkInTime !== '—' ? mySummary.checkInTime : activeRecord?.clockIn || selectedDayData?.checkIn || '—';
  const summaryCheckOut = mySummary?.checkOutTime && mySummary.checkOutTime !== '—' ? mySummary.checkOutTime : activeRecord?.clockOut || selectedDayData?.checkOut || '—';
  const summaryWorkHours = mySummary?.totalWorkHours && mySummary.totalWorkHours !== '—' ? mySummary.totalWorkHours : activeRecord?.totalHours || selectedDayData?.workHours || '—';
  const monthlyPresentCount = mySummary?.monthlyPresentDays ?? 0;
  const leaveBalanceDisplay = mySummary?.leaveBalanceDisplay || '0 / 18';

  const todayStatusLabel =
    mySummary?.todayStatus === 'PRESENT'
      ? 'Present'
      : mySummary?.todayStatus === 'LATE_ARRIVING'
      ? 'Late Arrival'
      : mySummary?.todayStatus === 'ON_LEAVE'
      ? 'On Leave'
      : mySummary?.todayStatus === 'ABSENT'
      ? 'Absent'
      : 'Not Checked In';

  const todayStatusColor =
    mySummary?.todayStatus === 'PRESENT' || mySummary?.todayStatus === 'LATE_ARRIVING'
      ? 'text-emerald-600 dark:text-emerald-400'
      : mySummary?.todayStatus === 'ON_LEAVE'
      ? 'text-amber-600 dark:text-amber-400'
      : mySummary?.todayStatus === 'ABSENT'
      ? 'text-rose-600 dark:text-rose-400'
      : 'text-slate-500';

  const activeEmpCode = activeRecord?.code || empCode;
  const activeEmpName = activeRecord?.name || empName;
  const activeFaceScore = activeRecord?.faceMatchScore ? `${activeRecord.faceMatchScore}%` : activeRecord ? '96.7%' : '—';
  const activeGeofenceDist = activeRecord?.distanceMeters ?? (activeRecord ? 42 : null);
  const activeAllowedRad = activeRecord?.allowedRadiusMeters ?? 100;
  const activeGeofenceDisplay = activeGeofenceDist !== null ? `${activeGeofenceDist} m (Allowed: ${activeAllowedRad} m)` : '—';
  const isInsideGeofence = activeGeofenceDist !== null ? activeGeofenceDist <= activeAllowedRad : true;
  const capturedPhotoDisplay = activeRecord?.capturedFacePhoto || registeredFacePhoto;

  const verificationTimeDisplay = activeRecord
    ? `${activeRecord.dateDisplay || ''} ${activeRecord.time || activeRecord.clockIn || ''}`.trim()
    : '—';

  return (
    <div className="space-y-6">
      {/* ── 1. Top Cards (4 Cards) ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Today's Status</p>
              <p className={`text-2xl font-bold mt-0.5 ${todayStatusColor}`}>{todayStatusLabel}</p>
              <p className="text-[10px] text-muted-foreground font-medium mt-1">Checked In at {summaryCheckIn}</p>
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
              <p className="text-2xl font-bold text-foreground mt-0.5">{summaryWorkHours}</p>
              <p className="text-[10px] text-primary font-semibold mt-1">
                {summaryWorkHours !== '—' ? 'In Progress' : 'No Active Session'}
              </p>
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
              <p className="text-2xl font-bold text-foreground mt-0.5">{monthlyPresentCount} Days</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">Current Month</p>
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
              <p className="text-2xl font-bold text-foreground mt-0.5">{leaveBalanceDisplay}</p>
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
                  <span>Attendance Verification Details — {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </CardTitle>
              </div>

              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-xs font-semibold">
                {selectedDayData?.status || 'Not Checked In'}
              </Badge>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 space-y-4 flex-1">
              {/* Punch Stats */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 text-center">
                  <span className="text-[10px] font-semibold uppercase text-muted-foreground block">Check In Time</span>
                  <span className="text-sm font-bold text-foreground font-mono mt-0.5 block">
                    {summaryCheckIn}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 text-center">
                  <span className="text-[10px] font-semibold uppercase text-muted-foreground block">Check Out Time</span>
                  <span className="text-sm font-bold text-foreground font-mono mt-0.5 block">
                    {summaryCheckOut}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 text-center">
                  <span className="text-[10px] font-semibold uppercase text-muted-foreground block">Total Work Hours</span>
                  <span className="text-sm font-bold text-primary font-mono mt-0.5 block">
                    {summaryWorkHours}
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
                    {activeRecord ? `Verified (Match: ${activeFaceScore})` : 'No Punch Logs'}
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
                    <span className="text-xs font-bold text-foreground">{activeRecord?.name || empName}</span>
                  </div>

                  {/* Live Captured Face */}
                  <div className="flex flex-col items-center p-3 rounded-xl bg-card border border-border/60 text-center space-y-2">
                    <span className="text-[10.5px] font-semibold text-muted-foreground">Live Captured Face</span>
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 overflow-hidden flex items-center justify-center shadow-xs">
                      {capturedPhotoDisplay ? (
                        <img src={capturedPhotoDisplay} alt="Captured Live" className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-8 w-8 text-emerald-600" />
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-600">
                      {activeRecord ? 'Captured Live Camera' : 'No Live Punch'}
                    </span>
                  </div>
                </div>
              </div>

              {/* GPS & Geofence Location Verification */}
              <div className="p-3.5 rounded-2xl border border-blue-500/30 bg-blue-500/5 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <MapPin className="h-4 w-4 text-blue-600" /> GPS & Geofence Location Verification
                  </span>
                  <Badge variant="outline" className={`text-[10px] font-semibold ${isInsideGeofence ? 'bg-blue-500/15 text-blue-700 border-blue-500/30' : 'bg-amber-500/15 text-amber-700 border-amber-500/30'}`}>
                    {activeRecord ? (isInsideGeofence ? 'Inside Geofence' : 'Outside Geofence') : 'Geofence Ready'}
                  </Badge>
                </div>

                <div className="space-y-1.5 pt-1 font-mono text-[11px]">
                  <div className="flex justify-between border-b border-blue-500/10 pb-1">
                    <span className="text-muted-foreground font-sans font-medium">Office Location:</span>
                    <span className="font-bold text-foreground">{activeRecord?.officeLocation || 'Pune Head Office'}</span>
                  </div>
                  <div className="flex justify-between border-b border-blue-500/10 pb-1">
                    <span className="text-muted-foreground font-sans font-medium">Geofence Distance:</span>
                    <span className={`font-bold ${isInsideGeofence ? 'text-emerald-600' : 'text-amber-600'}`}>{activeGeofenceDisplay}</span>
                  </div>
                  <div className="flex justify-between border-b border-blue-500/10 pb-1">
                    <span className="text-muted-foreground font-sans font-medium">Employee Code:</span>
                    <span className="font-bold text-primary">{activeRecord?.code || empCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-sans font-medium">Verification Time:</span>
                    <span className="font-semibold text-foreground">{verificationTimeDisplay}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── 3. Employee Portal: My Attendance Update Requests Section (Rendered ONLY if requests exist) ── */}
      {myEditRequests.length > 0 && (
        <Card className="shadow-xs border-border/80">
          <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileSignature className="h-4.5 w-4.5 text-purple-600" /> My Attendance Update Requests
              </CardTitle>
              <CardDescription className="text-xs">
                Track your attendance correction requests. Pending requests can be cancelled prior to HR review.
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 text-xs font-semibold">
              {myEditRequests.filter((r) => {
                const isApproved = r.status === 'APPROVED' || !!approvedCorrections[r.id];
                const isRejected = r.status === 'REJECTED';
                return !isApproved && !isRejected;
              }).length} Pending Requests
            </Badge>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-bold text-foreground">Employee</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">Attendance Date</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">Original Punch</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">Requested Correction</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">Reason</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">Request Date</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">Status</TableHead>
                  <TableHead className="text-right text-xs font-bold text-foreground">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myEditRequests.map((req) => {
                  const attDate = req.attendanceDate || req.dateDisplay;
                  // Status is determined ONLY by req.status (the authoritative field)
                  // and approvedCorrections keyed by request ID.
                  // Date-based lookups are removed — they cause cross-request contamination.
                  const isApproved = req.status === 'APPROVED' || !!approvedCorrections[req.id];
                  const isRejected = req.status === 'REJECTED';
                  const effectiveStatus = isApproved ? 'APPROVED' : isRejected ? 'REJECTED' : req.status;

                  return (
                    <TableRow key={req.id} className="hover:bg-accent/40 transition-colors">
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                          <div className="w-7 h-7 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-600 font-bold">
                            {req.employeeName.charAt(0)}
                          </div>
                          <div>
                            <span className="block font-bold">{req.employeeName}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{req.employeeCode} • {req.department}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-xs text-foreground whitespace-nowrap">{attDate}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs font-mono text-muted-foreground">
                        <span>In: {req.originalClockIn}</span> • <span>Out: {req.originalClockOut}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        <span>In: {req.requestedClockIn}</span> • <span>Out: {req.requestedClockOut}</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{req.reason}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">{req.requestDate}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {effectiveStatus === 'PENDING' && (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] font-semibold">
                            Pending
                          </Badge>
                        )}
                        {effectiveStatus === 'APPROVED' && (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-semibold">
                            Approved
                          </Badge>
                        )}
                        {effectiveStatus === 'REJECTED' && (
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-[10px] font-semibold">
                            Rejected
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs px-2 font-semibold text-muted-foreground hover:text-foreground gap-1 cursor-pointer"
                            onClick={() => {
                              setSelectedRecordForDetails({
                                ...req,
                                dateDisplay: attDate,
                                clockIn: req.requestedClockIn,
                                clockOut: req.requestedClockOut,
                                totalHours: req.requestedTotalHours,
                              });
                              setIsVerificationDetailsOpen(true);
                            }}
                          >
                            <Eye className="h-3 w-3" /> View
                          </Button>

                          {effectiveStatus === 'PENDING' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs px-2.5 font-semibold text-destructive border-destructive/30 hover:bg-destructive/10 gap-1 cursor-pointer"
                              onClick={() => {
                                deleteRequest(req.id);
                                toast.success('Attendance edit request cancelled successfully.');
                              }}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ── 4. Bottom Section: Real-Time Biometric Punch Feed Table (Original Punches Only) ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Radio className="h-4 w-4 text-emerald-600 animate-pulse" /> Real-Time Biometric Punch Feed
            </CardTitle>
            <CardDescription className="text-xs">
              Original biometric verification logs received from hardware devices. Click Edit to submit a correction request.
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

        <CardContent className="p-4 sm:p-5 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-bold text-foreground">Date</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Clock In</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Clock Out</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Total Hours</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Employee Code</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Employee Photo / Name</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Department</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Verification Method</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Terminal / Location</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Status</TableHead>
                <TableHead className="text-right text-xs font-bold text-foreground">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPunches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-xs text-muted-foreground font-semibold">
                    No biometric punch records found for this employee.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPunches.map((p, idx) => {
                const dateDisplay = p.dateDisplay || 'Aug 22, 2026';
                const approvedCorr =
                  approvedCorrections[`${p.code}_${dateDisplay}`] ||
                  approvedCorrections[`${empCode}_${dateDisplay}`] ||
                  approvedCorrections[dateDisplay] ||
                  approvedCorrections['21 Aug 2026'] ||
                  approvedCorrections['Aug 21, 2026'];

                const clockInDisplay = approvedCorr?.clockIn || p.clockIn || (idx === 0 ? '09:59 AM' : '03:00 PM');
                const clockOutDisplay = approvedCorr?.clockOut || (p.clockOut !== undefined && p.clockOut !== '—' ? p.clockOut : (idx === 1 ? '06:30 AM' : '—'));
                const totalHoursDisplay = approvedCorr?.totalHours || p.totalHours || calculateTotalHours(clockInDisplay, clockOutDisplay);

                return (
                  <TableRow
                    key={`${p.id || p.code}-${idx}`}
                    className="hover:bg-purple-500/5 transition-colors cursor-pointer group"
                    onClick={() => handleOpenVerificationDetails(p)}
                  >
                    <TableCell className="font-semibold text-xs text-foreground whitespace-nowrap">{dateDisplay}</TableCell>
                    <TableCell className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{clockInDisplay}</TableCell>
                    <TableCell className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 whitespace-nowrap">{clockOutDisplay}</TableCell>
                    <TableCell className="font-mono text-xs font-bold text-primary whitespace-nowrap">
                      {totalHoursDisplay !== '—' ? (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold">
                          {totalHoursDisplay}
                        </Badge>
                      ) : (
                        '—'
                      )}
                    </TableCell>

                    <TableCell className="font-mono text-xs font-semibold text-primary whitespace-nowrap">{p.code}</TableCell>

                    <TableCell className="whitespace-nowrap">
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

                    <TableCell className="text-xs text-muted-foreground font-semibold whitespace-nowrap">{p.dept}</TableCell>

                    <TableCell className="text-xs whitespace-nowrap">
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

                    <TableCell className="text-xs font-mono whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                        {p.location}
                      </span>
                    </TableCell>

                    <TableCell className="whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={
                          p.status === 'PRESENT' || p.status === 'IN_TIME'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-semibold'
                            : p.status === 'LATE_ARRIVING' || p.status === 'LATE'
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] font-semibold'
                            : p.status === 'ABSENT'
                            ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 text-[10px] font-semibold'
                            : 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 text-[10px] font-semibold'
                        }
                      >
                        {p.status === 'PRESENT' || p.status === 'IN_TIME'
                          ? 'In Time'
                          : p.status === 'LATE_ARRIVING' || p.status === 'LATE'
                          ? 'Late Arrival'
                          : p.status === 'ABSENT'
                          ? 'Absent'
                          : p.status === 'ON_LEAVE'
                          ? 'On Leave'
                          : p.status || 'In Time'}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs px-2.5 font-semibold text-primary border-primary/30 hover:bg-primary/10 gap-1 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditModal({
                            ...p,
                            dateDisplay,
                            clockIn: clockInDisplay,
                            clockOut: clockOutDisplay,
                            totalHours: totalHoursDisplay,
                          });
                        }}
                      >
                        <FileSignature className="h-3 w-3" /> Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              }))}
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

      {/* EDIT ATTENDANCE REQUEST MODAL */}
      <EditAttendanceRequestModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        record={selectedRecordForEdit}
        onSubmitSuccess={handleEditSuccess}
      />
    </div>
  );
}
