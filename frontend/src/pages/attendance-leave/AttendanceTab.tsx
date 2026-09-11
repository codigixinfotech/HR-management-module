import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Plus,
  CalendarCheck,
  FileSignature,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  User,
  ShieldCheck,
  FileText,
  Edit,
} from 'lucide-react';
import { attendanceApi } from '@/api/attendance-leave';
import { employeesApi } from '@/api/employees';
import type { AttendanceStatus, Company } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useAttendanceRequestsStore, syncAttendanceStoreFromStorage, type AttendanceEditRequest } from '@/stores/attendance-requests-store';
import { EditAttendanceRequestModal } from '@/components/attendance/EditAttendanceRequestModal';
import { useAuthStore } from '@/stores/auth-store';
import { isManagerOrHrOrAdmin } from '@/lib/modules';
import { useShiftRosterStore } from './shift-roster/shiftRosterStore';
import { resolveApplicableShift, formatShiftTime, type ResolvedShift } from '@/lib/shift-resolver';
import { cn } from '@/lib/utils';

const attendanceSchema = z.object({
  companyId: z.string().min(1, 'Company is required'),
  employeeId: z.string().min(1, 'Employee is required'),
  date: z.string().min(1, 'Date is required'),
  status: z.enum(['PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY', 'WEEK_OFF']),
});

type AttendanceFormValues = z.infer<typeof attendanceSchema>;

function formatMinutesToHours(mins: number): string {
  if (mins <= 0) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function parseTimeToMins(t?: string | null): number | null {
  if (!t || t === '—' || t === '-') return null;
  const clean = t.trim();
  const isPm = clean.toUpperCase().includes('PM');
  const isAm = clean.toUpperCase().includes('AM');
  const timeOnly = clean.replace(/(AM|PM)/i, '').trim();
  const parts = timeOnly.split(':').map(Number);
  let h = parts[0] || 0;
  const m = parts[1] || 0;
  if (isPm && h < 12) h += 12;
  if (isAm && h === 12) h = 0;
  return h * 60 + m;
}

function computeMetrics(checkIn?: string | null, checkOut?: string | null, shift?: ResolvedShift) {
  if (!checkIn) {
    return { worked: '—', late: '—', early: '—', ot: '—' };
  }

  const inDate = new Date(checkIn);
  const inMins = !isNaN(inDate.getTime()) ? inDate.getHours() * 60 + inDate.getMinutes() : parseTimeToMins(checkIn);

  let outMins: number | null = null;
  if (checkOut) {
    const outDate = new Date(checkOut);
    outMins = !isNaN(outDate.getTime()) ? outDate.getHours() * 60 + outDate.getMinutes() : parseTimeToMins(checkOut);
  }

  // Worked hours
  let worked = '—';
  let workedMins = 0;
  if (inMins !== null && outMins !== null) {
    let diff = outMins - inMins;
    if (diff < 0) diff += 24 * 60;
    workedMins = diff;
    worked = formatMinutesToHours(diff);
  }

  // Shift start & end in mins
  const shiftStartMins = parseTimeToMins(shift?.startTime) ?? 8 * 60; // default 08:00 AM
  const shiftEndMins = parseTimeToMins(shift?.endTime) ?? 16 * 60 + 30; // default 04:30 PM

  // Late calculation (grace 10 mins)
  let late = '—';
  if (inMins !== null && inMins > shiftStartMins + 10) {
    const lateMins = inMins - shiftStartMins;
    late = `${lateMins}m Late`;
  }

  // Early out calculation (grace 10 mins)
  let early = '—';
  if (outMins !== null && outMins < shiftEndMins - 10) {
    const earlyMins = shiftEndMins - outMins;
    early = `${earlyMins}m Early`;
  }

  // Overtime calculation: Statutory 9-hour daily threshold (540 mins) per Factories Act Section 59
  let ot = '—';
  const dailyThresholdMins = 9 * 60; // 9 hours
  if (workedMins > dailyThresholdMins) {
    const otMins = workedMins - dailyThresholdMins;
    ot = `${formatMinutesToHours(otMins)} OT`;
  }

  return { worked, late, early, ot };
}

export function AttendanceTab({ companyId, companies }: { companyId?: string; companies: Company[] }) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isManagerOrAdmin = isManagerOrHrOrAdmin(user);

  // Fetch shift roster data for hierarchical shift resolution
  const { shifts, assignments, rosterEmployees, fetchData: fetchShiftData } = useShiftRosterStore();

  useEffect(() => {
    fetchShiftData(companyId);
  }, [companyId, fetchShiftData]);

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab = isManagerOrAdmin && tabParam === 'requests' ? 'requests' : 'register';

  const handleTabChange = (val: string) => {
    if (!isManagerOrAdmin) return;
    if (val === 'requests') {
      setSearchParams((prev) => {
        const p = new URLSearchParams(prev);
        p.set('tab', 'requests');
        return p;
      });
    } else {
      setSearchParams((prev) => {
        const p = new URLSearchParams(prev);
        p.delete('tab');
        return p;
      });
    }
  };

  const [open, setOpen] = useState(false);

  // Persistent shared store for attendance edit requests
  const { requests: updateRequests, approveRequest, rejectRequest } = useAttendanceRequestsStore();

  useEffect(() => {
    // Sync immediately on mount from localStorage
    syncAttendanceStoreFromStorage();

    // Poll every 2 seconds — guarantees Admin always sees freshest employee requests
    const pollInterval = setInterval(syncAttendanceStoreFromStorage, 2000);

    // Sync on tab focus
    window.addEventListener('focus', syncAttendanceStoreFromStorage);

    // Sync on cross-tab storage event
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'attendance-requests-store') syncAttendanceStoreFromStorage();
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('focus', syncAttendanceStoreFromStorage);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // View Details Modal State
  const [selectedRequest, setSelectedRequest] = useState<AttendanceEditRequest | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Filter Sub-Tab State for Admin Requests (Pending Queue vs Audit History)
  const [requestSubTab, setRequestSubTab] = useState<'pending' | 'history'>('pending');

  // Admin Edit Request Modal State
  const [isAdminEditModalOpen, setIsAdminEditModalOpen] = useState(false);
  const [selectedRecordForAdminEdit, setSelectedRecordForAdminEdit] = useState<any>(null);

  const handleOpenAdminEditModal = (rec: any, resolvedShift?: ResolvedShift) => {
    const empName = rec.employee
      ? `${rec.employee.firstName} ${rec.employee.lastName}`
      : user?.employee
      ? `${user.employee.firstName} ${user.employee.lastName}`
      : user?.email?.split('@')[0] || 'Employee';
    const empCode = rec.employee?.employeeCode || user?.employee?.employeeCode || 'EMP-001';
    const dept = rec.employee?.department?.name || rec.employee?.departmentName || user?.employee?.departmentName || 'Production';
    const dateStr = new Date(rec.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const clockInStr = rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (resolvedShift?.startTime || '08:00 AM');
    const clockOutStr = rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (resolvedShift?.endTime || '04:30 PM');

    setSelectedRecordForAdminEdit({
      id: rec.id,
      dateDisplay: dateStr,
      attendanceDate: dateStr,
      clockIn: clockInStr,
      clockOut: clockOutStr,
      code: empCode,
      name: empName,
      dept: dept,
      shiftName: resolvedShift?.name || 'Morning Shift',
      shiftCode: resolvedShift?.code || 'MS',
    });
    setIsAdminEditModalOpen(true);
  };

  const { data: records, isLoading } = useQuery({
    queryKey: ['attendance', companyId],
    queryFn: () => attendanceApi.list({ companyId }),
  });

  const displayRecords = useMemo(() => {
    if (!records) return [];
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Filter out future dates from daily past attendance muster roll
    let list = records.filter((r) => {
      const d = new Date(r.date);
      return !isNaN(d.getTime()) && d <= today;
    });

    if (!isManagerOrAdmin) {
      const empId = user?.employee?.id;
      const empCode = user?.employee?.employeeCode;
      const userEmail = user?.email?.toLowerCase();
      list = list.filter((r) => {
        if (empId && (r.employeeId === empId || r.employee?.id === empId)) return true;
        if (empCode && r.employee?.employeeCode === empCode) return true;
        if (userEmail && r.employee?.email?.toLowerCase() === userEmail) return true;
        return false;
      });
    }

    // Sort descending by date (most recent first)
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, isManagerOrAdmin, user]);

  const { data: employeesPage } = useQuery({
    queryKey: ['employees', 'attendance-picker', companyId],
    queryFn: () => employeesApi.list({ page: 1, pageSize: 100, companyId }),
  });

  const form = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      companyId: companyId ?? companies[0]?.id ?? '',
      employeeId: '',
      date: new Date().toISOString().slice(0, 10),
      status: 'PRESENT',
    },
  });

  const markMutation = useMutation({
    mutationFn: (values: AttendanceFormValues) => attendanceApi.mark(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Attendance marked');
      setOpen(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  // Admin Approval Handlers
  const handleApprove = (req: AttendanceEditRequest) => {
    approveRequest(req.id, 'Admin/HR');
    queryClient.invalidateQueries({ queryKey: ['attendance'] });
    toast.success(
      `Attendance Update Request Approved: Your attendance correction request for ${req.attendanceDate} has been approved by HR. Your attendance record has been updated successfully.`,
      { duration: 6000 }
    );
  };

  const handleReject = (req: AttendanceEditRequest) => {
    rejectRequest(req.id);
    toast.info(
      `Attendance Update Request Rejected: Your attendance correction request for ${req.attendanceDate} was rejected by HR.`,
      { duration: 6000 }
    );
  };

  const handleView = (req: AttendanceEditRequest) => {
    setSelectedRequest(req);
    setIsViewModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* ── 2 Tabs Navigation ── */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="bg-muted/60 p-1 border border-border/60">
          <TabsTrigger value="register" className="text-xs font-semibold px-4 py-1.5 gap-2">
            <CalendarCheck className="h-3.5 w-3.5 text-primary" /> {isManagerOrAdmin ? 'Attendance Register' : 'My Attendance Register'}
          </TabsTrigger>
          {isManagerOrAdmin && (
            <TabsTrigger value="requests" className="text-xs font-semibold px-4 py-1.5 gap-2">
              <FileSignature className="h-3.5 w-3.5 text-purple-600" /> Attendance Update Requests
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 bg-purple-500/10 text-purple-700 dark:text-purple-300 font-bold">
                {updateRequests.filter((r) => r.status === 'PENDING').length}
              </Badge>
            </TabsTrigger>
          )}
        </TabsList>

        {/* ── TAB 1: ATTENDANCE REGISTER ── */}
        <TabsContent value="register" className="m-0">
          <Card className="shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  {isManagerOrAdmin ? 'Daily Attendance Register' : 'My Attendance Register'}
                </CardTitle>
                <CardDescription>
                  {isManagerOrAdmin
                    ? 'Muster roll of employee attendance status marked per working day'
                    : 'Personal attendance muster roll and monthly status record'}
                </CardDescription>
              </div>
              {isManagerOrAdmin && (
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" disabled={companies.length === 0}>
                      <Plus className="mr-1.5 h-4 w-4" /> Mark Attendance
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Mark Attendance</DialogTitle>
                    </DialogHeader>
                    <form className="space-y-4" onSubmit={form.handleSubmit((values) => markMutation.mutate(values))}>
                      <div className="space-y-1.5">
                        <Label>Employee</Label>
                        <Select value={form.watch('employeeId')} onValueChange={(v) => form.setValue('employeeId', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select employee" />
                          </SelectTrigger>
                          <SelectContent>
                            {employeesPage?.items.map((e) => (
                              <SelectItem key={e.id} value={e.id}>
                                {e.firstName} {e.lastName} ({e.employeeCode})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label>Date</Label>
                          <Input type="date" {...form.register('date')} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Status</Label>
                          <Select value={form.watch('status')} onValueChange={(v) => form.setValue('status', v as AttendanceStatus)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(['PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY', 'WEEK_OFF'] as const).map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s.replace('_', ' ')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={markMutation.isPending}>
                          Save attendance
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent className="p-0 sm:p-6 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-bold text-foreground">Employee</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">Date</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">Status</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">Shift</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">Clock In</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">Clock Out</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">Worked Hours</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">Late</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">Early Out</TableHead>
                    <TableHead className="text-xs font-bold text-foreground">Overtime</TableHead>
                    <TableHead className="text-right text-xs font-bold text-foreground">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center text-xs text-muted-foreground py-8">
                        Loading attendance muster roll...
                      </TableCell>
                    </TableRow>
                  )}
                  {displayRecords?.map((record) => {
                    const empName = record.employee
                      ? `${record.employee.firstName} ${record.employee.lastName}`
                      : (!isManagerOrAdmin && user?.employee
                          ? `${user.employee.firstName} ${user.employee.lastName}`
                          : 'Sudarshan Kale');
                    const empCode = record.employee?.employeeCode || user?.employee?.employeeCode || 'EMP-001';
                    const deptId = record.employee?.department?.id || record.employee?.departmentId || user?.employee?.departmentId;
                    const deptName = record.employee?.department?.name || record.employee?.departmentName || user?.employee?.departmentName || 'Production';

                    // Resolve applicable shift according to 4-tier hierarchy:
                    // 1. Published Roster for date -> 2. Employee Override -> 3. Dept Assignment -> 4. Company Default
                    const resolvedShift = resolveApplicableShift({
                      employeeId: record.employeeId || record.employee?.id || user?.employee?.id,
                      employeeCode: empCode,
                      departmentId: deptId,
                      departmentName: deptName,
                      companyId: record.companyId || companyId,
                      dateStr: record.date,
                      shifts,
                      assignments,
                      rosterEmployees,
                      recordShiftType: record.shiftType,
                    });

                    const metrics = computeMetrics(record.checkIn, record.checkOut, resolvedShift);

                    const clockInDisplay = record.checkIn
                      ? formatShiftTime(new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
                      : '—';
                    const clockOutDisplay = record.checkOut
                      ? formatShiftTime(new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
                      : '—';

                    return (
                      <TableRow key={record.id} className="hover:bg-accent/40 transition-colors">
                        <TableCell className="text-xs font-medium whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                              {empName.charAt(0)}
                            </div>
                            <div>
                              <span className="font-semibold text-xs text-foreground block">{empName}</span>
                              <span className="text-[10px] text-muted-foreground font-mono">{empCode}</span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-xs whitespace-nowrap font-medium text-foreground">
                          {new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </TableCell>

                        <TableCell className="text-xs whitespace-nowrap">
                          <StatusBadge status={record.status} className="text-[10px] font-bold" />
                        </TableCell>

                        {/* Resolved Shift with name, code, timing */}
                        <TableCell className="text-xs whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                              {resolvedShift.name}
                              <Badge variant="outline" className="text-[10px] px-1 py-0 font-bold bg-muted/60 text-muted-foreground border-border/80">
                                {resolvedShift.code}
                              </Badge>
                            </span>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {resolvedShift.timing}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {clockInDisplay}
                        </TableCell>

                        <TableCell className="text-xs font-mono font-semibold text-purple-600 dark:text-purple-400 whitespace-nowrap">
                          {clockOutDisplay}
                        </TableCell>

                        <TableCell className="text-xs font-mono whitespace-nowrap">
                          {metrics.worked !== '—' ? (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold">
                              {metrics.worked}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        <TableCell className="text-xs font-mono whitespace-nowrap">
                          {metrics.late !== '—' ? (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] font-bold">
                              {metrics.late}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        <TableCell className="text-xs font-mono whitespace-nowrap">
                          {metrics.early !== '—' ? (
                            <Badge variant="outline" className="bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 text-[10px] font-bold">
                              {metrics.early}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        <TableCell className="text-xs font-mono whitespace-nowrap">
                          {metrics.ot !== '—' ? (
                            <Badge variant="outline" className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 text-[10px] font-bold">
                              {metrics.ot}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        <TableCell className="text-right whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenAdminEditModal(record, resolvedShift)}
                            className="h-7 px-2 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 flex items-center gap-1 ml-auto font-semibold cursor-pointer"
                          >
                            <Edit className="h-3.5 w-3.5" /> Request Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {displayRecords && displayRecords.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center text-xs text-muted-foreground py-8">
                        No attendance records yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 2: ATTENDANCE UPDATE REQUESTS (MANAGER / HR / ADMIN ONLY) ── */}
        {isManagerOrAdmin && (
          <TabsContent value="requests" className="m-0 space-y-4">
          <Card className="shadow-2xs border-border/80">
            <CardHeader className="pb-3 border-b border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FileSignature className="h-4.5 w-4.5 text-purple-600" /> Attendance Update Requests
                </CardTitle>
                <CardDescription className="text-xs">
                  Review and approve employee attendance correction requests submitted from the Employee Portal
                </CardDescription>
              </div>

              {/* Sub-Tab Queue Selector */}
              <div className="flex items-center gap-2">
                <div className="flex bg-muted p-1 rounded-lg border border-border/60 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setRequestSubTab('pending')}
                    className={cn(
                      'px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5',
                      requestSubTab === 'pending'
                        ? 'bg-background text-foreground shadow-xs font-bold'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span>Pending Queue</span>
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-mono">
                      {updateRequests.filter((r) => r.status === 'PENDING').length}
                    </Badge>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequestSubTab('history')}
                    className={cn(
                      'px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5',
                      requestSubTab === 'history'
                        ? 'bg-background text-foreground shadow-xs font-bold'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span>Resolved History</span>
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-mono">
                      {updateRequests.filter((r) => r.status !== 'PENDING').length}
                    </Badge>
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 overflow-x-auto">
              {(() => {
                const pendingRequests = updateRequests.filter((r) => r.status === 'PENDING');
                const resolvedRequests = updateRequests.filter((r) => r.status !== 'PENDING');
                const displayedRequests = requestSubTab === 'pending' ? pendingRequests : resolvedRequests;

                if (displayedRequests.length === 0) {
                  return (
                    <div className="text-center py-10 space-y-2">
                      <ShieldCheck className="h-8 w-8 text-muted-foreground mx-auto opacity-50" />
                      <p className="text-xs font-semibold text-muted-foreground">
                        {requestSubTab === 'pending'
                          ? 'No pending attendance update requests awaiting HR review.'
                          : 'No resolved attendance update request history.'}
                      </p>
                    </div>
                  );
                }

                return (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-bold text-foreground">Employee</TableHead>
                        <TableHead className="text-xs font-bold text-foreground">Attendance Date</TableHead>
                        <TableHead className="text-xs font-bold text-foreground">Original Clock In</TableHead>
                        <TableHead className="text-xs font-bold text-foreground">Original Clock Out</TableHead>
                        <TableHead className="text-xs font-bold text-foreground">Requested Clock In</TableHead>
                        <TableHead className="text-xs font-bold text-foreground">Requested Clock Out</TableHead>
                        <TableHead className="text-xs font-bold text-foreground">Original Hours</TableHead>
                        <TableHead className="text-xs font-bold text-foreground">Requested Hours</TableHead>
                        <TableHead className="text-xs font-bold text-foreground">Reason</TableHead>
                        <TableHead className="text-xs font-bold text-foreground">Requested By</TableHead>
                        <TableHead className="text-xs font-bold text-foreground">Request Date</TableHead>
                        <TableHead className="text-xs font-bold text-foreground">Status</TableHead>
                        <TableHead className="text-right text-xs font-bold text-foreground">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedRequests.map((req) => (
                    <TableRow key={req.id} className="hover:bg-accent/40 transition-colors">
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                          <div className="w-7 h-7 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-600 font-bold shrink-0">
                            {req.employeeName.charAt(0)}
                          </div>
                          <div>
                            <span className="block font-bold">{req.employeeName}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{req.employeeCode} • {req.department}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-xs text-foreground whitespace-nowrap">{req.attendanceDate}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">{req.originalClockIn}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">{req.originalClockOut}</TableCell>
                      <TableCell className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{req.requestedClockIn}</TableCell>
                      <TableCell className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 whitespace-nowrap">{req.requestedClockOut}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">{req.originalTotalHours}</TableCell>
                      <TableCell className="font-mono text-xs font-bold text-primary whitespace-nowrap">
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold">
                          {req.requestedTotalHours}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{req.reason}</TableCell>
                      <TableCell className="text-xs font-semibold text-foreground whitespace-nowrap">{req.requestedBy}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">{req.requestDate}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {req.status === 'PENDING' && (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] font-semibold">
                            Pending
                          </Badge>
                        )}
                        {req.status === 'APPROVED' && (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-semibold">
                            Approved
                          </Badge>
                        )}
                        {req.status === 'REJECTED' && (
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-[10px] font-semibold">
                            Rejected
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs px-2 font-semibold text-muted-foreground hover:text-foreground gap-1 cursor-pointer"
                            onClick={() => handleView(req)}
                          >
                            <Eye className="h-3 w-3" /> View
                          </Button>

                          {req.status === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                className="h-7 text-xs px-2.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-2xs cursor-pointer"
                                onClick={() => handleApprove(req)}
                              >
                                <CheckCircle2 className="h-3 w-3" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs px-2.5 font-semibold text-destructive border-destructive/30 hover:bg-destructive/10 gap-1 cursor-pointer"
                                onClick={() => handleReject(req)}
                              >
                                <XCircle className="h-3 w-3" /> Reject
                              </Button>
                            </>
                          )}
                          {req.status === 'APPROVED' && (
                            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                              Approved by {req.approvedBy || 'Admin/HR'}
                            </span>
                          )}
                          {req.status === 'REJECTED' && (
                            <span className="text-[11px] text-destructive font-semibold flex items-center gap-1">
                              <XCircle className="h-3.5 w-3.5 shrink-0" />
                              Rejected by {req.approvedBy || 'Admin/HR'}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              );
            })()}
            </CardContent>
          </Card>
        </TabsContent>
        )}
      </Tabs>

      {/* ── View Request Detail Dialog ── */}
      {selectedRequest && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" /> Attendance Request Audit
                </DialogTitle>
                <Badge variant="outline" className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 text-[10px] font-semibold">
                  <ShieldCheck className="h-3 w-3 mr-1" /> Audit Trail Verified
                </Badge>
              </div>
              <DialogDescription className="text-xs">
                Detailed record of attendance time adjustment request for audit compliance.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60 grid grid-cols-2 gap-2 font-mono">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase block font-sans font-semibold">Employee</span>
                  <span className="font-bold text-foreground font-sans">{selectedRequest.employeeName}</span>
                  <span className="text-[10.5px] text-primary block">{selectedRequest.employeeCode} • {selectedRequest.department}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase block font-sans font-semibold">Attendance Date</span>
                  <span className="font-bold text-foreground font-sans">{selectedRequest.attendanceDate}</span>
                  <span className="text-[10.5px] text-muted-foreground block">Submitted: {selectedRequest.requestDate}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl border border-border/60 bg-card">
                <div className="space-y-1 border-r border-border/60 pr-2">
                  <span className="font-bold text-muted-foreground block uppercase text-[10px]">Original Biometric Record</span>
                  <div className="font-mono text-xs">
                    <div>Clock In: <strong className="text-foreground">{selectedRequest.originalClockIn}</strong></div>
                    <div>Clock Out: <strong className="text-foreground">{selectedRequest.originalClockOut}</strong></div>
                    <div>Total: <strong className="text-foreground">{selectedRequest.originalTotalHours}</strong></div>
                  </div>
                </div>

                <div className="space-y-1 pl-1">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 block uppercase text-[10px]">Requested Correction</span>
                  <div className="font-mono text-xs">
                    <div>Clock In: <strong className="text-emerald-600 dark:text-emerald-400">{selectedRequest.requestedClockIn}</strong></div>
                    <div>Clock Out: <strong className="text-purple-600 dark:text-purple-400">{selectedRequest.requestedClockOut}</strong></div>
                    <div>Total: <strong className="text-primary">{selectedRequest.requestedTotalHours}</strong></div>
                  </div>
                </div>
              </div>

              <div className="space-y-1 p-3 rounded-xl bg-muted/30 border border-border/60">
                <span className="font-semibold text-muted-foreground block text-[10.5px]">Reason Provided by Employee:</span>
                <p className="text-foreground font-medium italic">{selectedRequest.reason}</p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="font-semibold text-muted-foreground text-[11px]">Request Status:</span>
                <Badge variant="outline" className="font-bold text-xs">
                  {selectedRequest.status}
                </Badge>
              </div>
            </div>

            <DialogFooter>
              <Button size="sm" variant="outline" onClick={() => setIsViewModalOpen(false)}>
                Close Audit View
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Attendance Request Modal (Employee and Manager/Admin) */}
      <EditAttendanceRequestModal
        isOpen={isAdminEditModalOpen}
        onClose={() => setIsAdminEditModalOpen(false)}
        record={selectedRecordForAdminEdit}
      />
    </div>
  );
}
