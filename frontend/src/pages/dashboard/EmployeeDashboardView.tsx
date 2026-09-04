import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { useAttendanceRequestsStore } from '@/stores/attendance-requests-store';
import { attendanceApi } from '@/api/attendance-leave';
import { employeesApi } from '@/api/employees';
import { tasksApi } from '@/api/tasks';
import {
  Brain,
  CheckCircle2,
  Clock,
  MapPin,
  CalendarClock,
  CheckSquare,
  User,
  Building2,
  ShieldCheck,
  ChevronRight,
  Plus,
  ExternalLink,
  Zap,
  GraduationCap,
} from 'lucide-react';
import { notificationStore } from '@/utils/notificationStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FaceAttendanceModal } from '@/pages/attendance/FaceAttendanceModal';
import { VerificationDetailsModal } from '@/components/attendance/VerificationDetailsModal';
import { FileSignature } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export function EmployeeDashboardView() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [selectedRecordForEdit, setSelectedRecordForEdit] = useState<any>(null);

  const empName = user?.employee ? `${user.employee.firstName} ${user.employee.lastName}` : 'Sanika Mote';
  const empCode = user?.employee?.employeeCode || 'EMP-8265';
  const deptName = user?.employee?.departmentName || 'Human Resources';
  const designation = user?.employee?.designationTitle || 'Employee';

  // Shared store for attendance requests
  const requests = useAttendanceRequestsStore((s) => s.requests);
  const approvedCorrections = useAttendanceRequestsStore((s) => s.approvedCorrections);
  const deleteRequest = useAttendanceRequestsStore((s) => s.deleteRequest);

  useEffect(() => {
    useAttendanceRequestsStore.persist.rehydrate();
    const handleFocus = () => useAttendanceRequestsStore.persist.rehydrate();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const myEditRequests = useMemo(() => {
    return requests.filter(
      (r) => r.employeeCode === empCode || r.requestedBy === empName
    );
  }, [requests, empCode, empName]);

  // Fetch logged-in employee profile
  const { data: employeeData } = useQuery({
    queryKey: ['employee-profile-me', user?.employee?.id],
    queryFn: () => employeesApi.get(user?.employee?.id || 'EMP-8265'),
  });

  // Fetch logged-in employee attendance records
  const { data: attendanceRecords = [] } = useQuery({
    queryKey: ['my-attendance-records', user?.employee?.id],
    queryFn: () => attendanceApi.list({ employeeId: user?.employee?.id }),
  });

  // Fetch assigned tasks
  const { data: tasksData } = useQuery({
    queryKey: ['my-assigned-tasks', user?.employee?.id],
    queryFn: () => tasksApi.myTasks({ employeeId: user?.employee?.id }),
  });

  const assignedTasks = tasksData?.items || [
    {
      id: 'TASK-101',
      taskCode: 'TSK-802',
      title: 'Review Biometric Face Verification Policy',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      dueDate: '2026-08-25',
    },
    {
      id: 'TASK-102',
      taskCode: 'TSK-805',
      title: 'Submit Q3 Leave & Attendance Summary',
      priority: 'MEDIUM',
      status: 'ASSIGNED',
      dueDate: '2026-08-28',
    },
  ];

  // Latest today's punch record
  const todayRecord = useMemo(() => {
    if (attendanceRecords.length > 0) return attendanceRecords[0];
    return {
      id: 'PUNCH-TODAY',
      date: new Date().toISOString().split('T')[0],
      time: '09:02:14 AM',
      checkIn: '2026-08-21T09:02:14.000Z',
      checkOut: null,
      status: 'PRESENT',
      faceVerificationStatus: 'VERIFIED',
      faceMatchScore: 96.7,
      capturedFacePhoto: null,
      locationVerificationStatus: 'INSIDE_GEOFENCE',
      officeLocation: 'Pune Head Office',
      distanceMeters: 42,
      allowedRadiusMeters: 100,
      latitude: 18.5204,
      longitude: 73.8567,
      ipAddress: '165.99.175.245',
      ipVerificationStatus: 'Approved Gateway',
      verificationMethod: 'Biometric Face ID',
      deviceType: 'FaceID Edge Terminal #01 (Chrome Browser)',
    };
  }, [attendanceRecords]);

  const historyRecords = useMemo(() => {
    if (attendanceRecords.length > 0) return attendanceRecords.slice(0, 5);
    return [
      {
        id: 'PUNCH-8265',
        date: '2026-08-21',
        time: '09:02:14 AM',
        checkIn: '2026-08-21T09:02:14.000Z',
        checkOut: null,
        status: 'PRESENT',
        faceVerificationStatus: 'VERIFIED',
        faceMatchScore: 96.7,
        officeLocation: 'Pune Head Office',
        distanceMeters: 42,
        allowedRadiusMeters: 100,
      },
      {
        id: 'PUNCH-8264',
        date: '2026-08-20',
        time: '09:05:10 AM',
        checkIn: '2026-08-20T09:05:10.000Z',
        checkOut: '2026-08-20T18:12:00.000Z',
        status: 'PRESENT',
        faceVerificationStatus: 'VERIFIED',
        faceMatchScore: 95.4,
        officeLocation: 'Pune Head Office',
        distanceMeters: 38,
        allowedRadiusMeters: 100,
      },
      {
        id: 'PUNCH-8263',
        date: '2026-08-19',
        time: '09:01:45 AM',
        checkIn: '2026-08-19T09:01:45.000Z',
        checkOut: '2026-08-19T18:08:30.000Z',
        status: 'PRESENT',
        faceVerificationStatus: 'VERIFIED',
        faceMatchScore: 97.1,
        officeLocation: 'Pune Head Office',
        distanceMeters: 40,
        allowedRadiusMeters: 100,
      },
    ];
  }, [attendanceRecords]);

  const handleOpenDetails = (record: any) => {
    setSelectedRecord(record);
    setIsDetailsModalOpen(true);
  };

  const [assignedCourse, setAssignedCourse] = useState<any>(null);

  useEffect(() => {
    const syncAssignedCourse = () => {
      apiClient
        .get<any[]>('/learning/my-learning')
        .then((res) => {
          const list = Array.isArray(res) ? res : (res as any)?.data || [];
          if (list.length > 0) {
            const myLatest = list.find(
              (e: any) => e.status === 'Not Started' || e.status === 'In Progress'
            ) || list[0];
            setAssignedCourse(myLatest);
          }
        })
        .catch(() => {});
    };

    syncAssignedCourse();
    window.addEventListener('storage', syncAssignedCourse);
    window.addEventListener('focus', syncAssignedCourse);
    window.addEventListener('ehcm_enrollments_updated', syncAssignedCourse);
    return () => {
      window.removeEventListener('storage', syncAssignedCourse);
      window.removeEventListener('focus', syncAssignedCourse);
      window.removeEventListener('ehcm_enrollments_updated', syncAssignedCourse);
    };
  }, [user]);

  return (
    <div className="space-y-6">
      {/* ── 1. Welcome Header Banner ── */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-purple-500/5 to-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Employee Self-Service Portal
              </span>
            </div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              Welcome back, {empName} 👋
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm flex items-center gap-2">
              <span>{empCode}</span> &middot; <span>{designation}</span> &middot; <span>{deptName}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold gap-1.5 shadow-md shadow-purple-600/20"
              onClick={() => setIsFaceModalOpen(true)}
            >
              <Brain className="h-4 w-4 animate-pulse" />
              Face ID Check In / Out
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="font-semibold text-xs gap-1"
            >
              <Link to="/attendance-leave/leave?tab=apply">
                <Plus className="h-3.5 w-3.5 text-primary" /> Apply Leave
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* ── 🔔 New Training Assigned Banner ── */}
      {assignedCourse && (
        <Card className="border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-card shadow-sm">
          <CardHeader className="py-3 px-4 border-b border-indigo-500/20 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-indigo-600 animate-ping" />
              <CardTitle className="text-xs uppercase tracking-wider font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4 text-indigo-600" /> 🔔 New Training Assigned
              </CardTitle>
            </div>
            <Badge className="bg-indigo-600 text-white text-[10px] font-bold">
              {assignedCourse.status}
            </Badge>
          </CardHeader>
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">
                {assignedCourse.courseTitle}
              </h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>Assigned by: <strong className="text-foreground">HR / Learning & Development</strong></span>
                <span>Assigned Date: <strong className="text-foreground">{assignedCourse.assignedDate || '03-Sep-2026'}</strong></span>
                <span>Status: <strong className="text-amber-600 font-semibold">{assignedCourse.status}</strong></span>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => navigate('/learning?tab=employee-learning')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs gap-1.5 shadow-sm shrink-0"
            >
              <GraduationCap className="h-4 w-4" /> View Course
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── 2. Today's Attendance & Verification Telemetry ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Today's Punch Card */}
        <Card className="border-border/80 shadow-2xs">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-600" /> Today's Attendance Status
              </CardTitle>
              <Badge className="bg-emerald-600 text-white font-bold text-[10px]">
                {todayRecord?.status || 'PRESENT'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[10.5px] font-semibold text-muted-foreground uppercase">Check In</span>
                <p className="text-base font-mono font-bold text-emerald-600 mt-0.5">
                  {todayRecord?.time || '09:02 AM'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-muted/30 border border-border/60">
                <span className="text-[10.5px] font-semibold text-muted-foreground uppercase">Check Out</span>
                <p className="text-base font-mono font-bold text-muted-foreground mt-0.5">
                  {todayRecord?.checkOut ? new Date(todayRecord.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenDetails(todayRecord)}
              className="w-full text-xs font-semibold gap-1.5 text-purple-700 dark:text-purple-400 border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-purple-600" /> View Today's Verification Details
            </Button>
          </CardContent>
        </Card>

        {/* Face Verification Telemetry */}
        <Card className="border-border/80 shadow-2xs">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-600" /> Face ID Verification
              </CardTitle>
              <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30 text-[10px] font-mono font-semibold">
                Match: {todayRecord?.faceMatchScore || 96.7}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs">
              <div className="h-10 w-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                ✓
              </div>
              <div>
                <p className="font-bold text-purple-700 dark:text-purple-300">✓ Face Verified</p>
                <p className="text-[11px] text-muted-foreground">128-D Landmark HOG Descriptor Matched</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-lg bg-muted/20 border border-border/60 flex justify-between items-center">
                <span className="text-muted-foreground">Registered Face:</span>
                <span className="font-semibold text-emerald-600">Stored ✓</span>
              </div>
              <div className="p-2 rounded-lg bg-muted/20 border border-border/60 flex justify-between items-center">
                <span className="text-muted-foreground">Live Captured:</span>
                <span className="font-semibold text-purple-600">Captured ✓</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GPS Geofence Telemetry */}
        <Card className="border-border/80 shadow-2xs">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-600" /> GPS Geofence Verification
              </CardTitle>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] font-semibold">
                Inside Geofence
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 space-y-1">
              <div className="flex items-center justify-between font-bold">
                <span>✓ Verified Location</span>
                <span>{todayRecord?.distanceMeters || 42} m</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Office: <strong className="text-foreground">{todayRecord?.officeLocation || 'Codigix HQ - Brahma Sky Uzuri'}</strong> (Radius: {todayRecord?.allowedRadiusMeters || 100} m)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-lg bg-muted/20 border border-border/60 flex justify-between items-center">
                <span className="text-muted-foreground">Coordinates:</span>
                <span className="font-mono font-semibold">18.6268°, 73.8044°</span>
              </div>
              <div className="p-2 rounded-lg bg-muted/20 border border-border/60 flex justify-between items-center">
                <span className="text-muted-foreground">Network IP:</span>
                <span className="font-mono font-semibold text-purple-600">{todayRecord?.ipAddress || '165.99.175.245'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 3. My Tasks & My Leave Summary ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* My Tasks */}
        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/60">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-primary" /> Today's Work & Assigned Tasks
              </CardTitle>
              <CardDescription className="text-xs">Tasks assigned to you for current period</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs font-semibold text-primary gap-1">
              <Link to="/tasks/my-tasks">
                View All <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {/* Assigned Training Activities from notificationStore */}
            {notificationStore.getNotificationsForUser(user?.id).filter((n) => n.type === 'TRAINING').slice(0, 2).map((n) => (
              <div
                key={n.id}
                className="p-3 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-between text-xs transition-colors hover:bg-primary/10"
              >
                <div className="space-y-1 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-primary px-1.5 py-0.5 rounded bg-primary/20 flex items-center gap-1">
                      <GraduationCap className="h-3 w-3" /> TRAINING
                    </span>
                    <h4 className="font-bold text-foreground text-xs">{n.title}</h4>
                  </div>
                  <p className="text-[10.5px] text-muted-foreground line-clamp-1">{n.message}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => navigate(n.actionUrl || '/learning/training-programs')}
                  className="h-7 text-[10px] gap-1 bg-primary text-primary-foreground shrink-0 font-semibold"
                >
                  View Training
                </Button>
              </div>
            ))}

            {assignedTasks.map((t: any) => (
              <div
                key={t.id}
                className="p-3 rounded-xl border border-border/60 bg-muted/20 flex items-center justify-between text-xs transition-colors hover:bg-muted/40"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10">
                      {t.taskCode}
                    </span>
                    <h4 className="font-bold text-foreground text-xs">{t.title}</h4>
                  </div>
                  <p className="text-[10.5px] text-muted-foreground">Due Date: {t.dueDate}</p>
                </div>
                <Badge className={t.priority === 'HIGH' ? 'bg-rose-600 text-white font-semibold text-[10px]' : 'bg-primary text-white font-semibold text-[10px]'}>
                  {t.priority}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* My Leave Summary */}
        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/60">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-emerald-600" /> My Leave Quotas & Balances
              </CardTitle>
              <CardDescription className="text-xs">Annual leave allocations for current year</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild className="text-xs font-semibold gap-1">
              <Link to="/attendance-leave/leave?tab=apply">
                <Plus className="h-3.5 w-3.5 text-primary" /> Apply Leave
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-3 gap-3 text-xs text-center">
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Casual Leave</span>
                <p className="text-xl font-bold text-purple-700 dark:text-purple-300 mt-1">6 / 12</p>
                <span className="text-[9.5px] text-muted-foreground">Days Remaining</span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Sick Leave</span>
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">8 / 10</p>
                <span className="text-[9.5px] text-muted-foreground">Days Remaining</span>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Earned Leave</span>
                <p className="text-xl font-bold text-blue-700 dark:text-blue-300 mt-1">15 / 18</p>
                <span className="text-[9.5px] text-muted-foreground">Days Remaining</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 4. Recent Attendance History Table ── */}
      <Card className="shadow-2xs">
        <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-600" /> Recent Attendance History
            </CardTitle>
            <CardDescription className="text-xs">Your recent attendance check-in and check-out logs</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild className="text-xs font-semibold text-primary gap-1">
            <Link to="/attendance-leave/register">
              View History <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Check In</TableHead>
                <TableHead className="text-xs">Check Out</TableHead>
                <TableHead className="text-xs">Face & GPS Status</TableHead>
                <TableHead className="text-xs">Location</TableHead>
                <TableHead className="text-right text-xs">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyRecords.map((r, idx) => (
                <TableRow key={`${r.date}-${idx}`} className="hover:bg-purple-500/5 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold text-foreground">{r.date}</TableCell>
                  <TableCell className="font-mono text-xs font-semibold text-emerald-600">{r.time || '09:02 AM'}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}</TableCell>
                  <TableCell className="text-xs">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                      <Brain className="h-3 w-3 text-purple-600" />
                      Face & GPS Verified ({r.faceMatchScore || 96.7}%)
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">{r.officeLocation || 'Pune Head Office'}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedRecordForEdit({
                            ...r,
                            dateDisplay: r.date,
                            clockIn: r.time || '09:02 AM',
                            clockOut: r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
                            code: empCode,
                            name: empName,
                          });
                          setIsEditModalOpen(true);
                        }}
                        className="h-7 text-xs font-semibold text-primary hover:bg-primary/10 gap-1 cursor-pointer"
                      >
                        <FileSignature className="h-3 w-3" /> Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDetails(r)}
                        className="h-7 text-xs font-semibold text-purple-600 hover:text-purple-700 hover:bg-purple-500/10 gap-1 cursor-pointer"
                      >
                        <ExternalLink className="h-3 w-3" /> Details
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Live Scanner Modal */}
      <FaceAttendanceModal
        isOpen={isFaceModalOpen}
        employees={employeeData ? [employeeData] : []}
        onClose={() => setIsFaceModalOpen(false)}
      />

      {/* Verification Details Modal */}
      <VerificationDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        attendanceRecord={selectedRecord}
      />

      {/* Edit Attendance Request Modal */}
      <EditAttendanceRequestModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        record={selectedRecordForEdit}
      />
    </div>
  );
}
