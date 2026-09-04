import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  Users,
  Award,
  CheckCircle2,
  Clock,
  Edit,
  Plus,
  Ban,
  ShieldCheck,
  LayoutGrid,
  FileText,
  RotateCcw,
  Sparkles,
  Download,
  MapPin,
  Mail,
  Phone,
  Paperclip,
  Trash2,
  Bell,
  Send,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { type TrainingProgram, type EmployeeProgramStatus } from './types';
import { notificationStore, type PortalNotification, type EmailDispatchLog } from '@/utils/notificationStore';

interface ProgramDetailViewProps {
  program: TrainingProgram;
  onBack: () => void;
  onUpdateProgram: (updated: TrainingProgram) => void;
  onEditProgram?: (program: TrainingProgram) => void;
  onDeleteProgram?: (programId: string) => void;
  onSendNotification?: (program: TrainingProgram) => void;
  onSendEmail?: (program: TrainingProgram) => void;
}

export function ProgramDetailView({
  program,
  onBack,
  onUpdateProgram,
  onEditProgram,
  onDeleteProgram,
  onSendNotification,
  onSendEmail,
}: ProgramDetailViewProps) {
  const [employeeList, setEmployeeList] = useState<EmployeeProgramStatus[]>(
    program.employeeStatuses || []
  );

  // Communications & Dispatch Stats
  const [notifHistory, setNotifHistory] = useState<PortalNotification[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailDispatchLog[]>([]);

  useEffect(() => {
    setNotifHistory(notificationStore.getProgramNotificationHistory(program.id));
    setEmailLogs(notificationStore.getProgramEmailLogs(program.id));
  }, [program.id]);

  const totalAssigned = employeeList.length;
  const completedCount = employeeList.filter((e) => e.status === 'Completed' || e.status === 'Certified').length;
  const inProgressCount = employeeList.filter((e) => e.status === 'In Progress' || e.status === 'Started' || e.status === 'Enrolled').length;
  const notStartedCount = employeeList.filter((e) => e.status === 'Assigned').length;

  const notifSentCount = notifHistory.length;
  const notifReadCount = notifHistory.filter((n) => n.read).length;
  const notifUnreadCount = notifSentCount - notifReadCount;

  const emailSentCount = emailLogs.reduce((acc, l) => acc + l.recipientCount, 0);

  const handleDownloadDoc = (doc: { name: string; size: string; type: string; url?: string }) => {
    if (doc.url) {
      const link = document.createElement('a');
      link.href = doc.url;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Downloading ${doc.name}...`);
    } else {
      const content = `Codigix HR Management System\nTraining Document: ${doc.name}\nSize: ${doc.size}\nType: ${doc.type}\nStatus: Verified Document\nDate: ${new Date().toLocaleDateString()}`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast.success(`Downloading ${doc.name}...`);
    }
  };

  const completionRate = Math.round((completedCount / (totalAssigned || 1)) * 100);

  // Interactive Handlers
  const handleMarkAttendance = (empId: string, newAttendance: number) => {
    const updated = employeeList.map((emp) => {
      if (emp.employeeId === empId) {
        return { ...emp, attendancePercent: newAttendance };
      }
      return emp;
    });
    setEmployeeList(updated);
    onUpdateProgram({ ...program, employeeStatuses: updated });
  };

  const handleSimulateQuiz = (empId: string, score: number) => {
    const passingBenchmark = program.passingScore || 60;
    const passed = score >= passingBenchmark;
    const updated = employeeList.map((emp) => {
      if (emp.employeeId === empId) {
        const nextStatus: EmployeeProgramStatus['status'] = passed ? 'Completed' : 'Failed';
        return {
          ...emp,
          assessmentScore: score,
          passed,
          status: nextStatus,
          certificateIssued: passed && program.certificateRequired,
        };
      }
      return emp;
    });
    setEmployeeList(updated);
    onUpdateProgram({ ...program, employeeStatuses: updated });
  };

  const handleTriggerRetake = (empId: string) => {
    const updated = employeeList.map((emp) => {
      if (emp.employeeId === empId) {
        return {
          ...emp,
          status: 'In Progress' as const,
          assessmentScore: undefined,
          passed: undefined,
        };
      }
      return emp;
    });
    setEmployeeList(updated);
    onUpdateProgram({ ...program, employeeStatuses: updated });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-1.5 text-xs">
          <ArrowLeft className="h-4 w-4" /> Back to Training Programs
        </Button>
        <span className="text-xs text-muted-foreground font-mono">http://localhost:5174/learning/training-programs</span>
      </div>

      {/* Detail Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-xl bg-card border shadow-2xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              {program.name}
            </h1>
            <Badge variant="outline" className="font-mono text-xs">
              {program.code}
            </Badge>
            <StatusBadge status={program.status === 'Active' ? 'IN PROGRESS' : program.status} className="text-xs px-2.5 py-0.5" />
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-3xl">
            {program.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onEditProgram && (
            <Button variant="outline" size="sm" onClick={() => onEditProgram(program)} className="gap-1.5 text-xs">
              <Edit className="h-3.5 w-3.5" /> Edit Program
            </Button>
          )}

          {onSendNotification && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSendNotification(program)}
              className="gap-1.5 text-xs border-primary/40 text-primary hover:bg-primary/10"
            >
              <Bell className="h-3.5 w-3.5" /> Send Notification
            </Button>
          )}

          {onSendEmail && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSendEmail(program)}
              className="gap-1.5 text-xs border-primary/40 text-primary hover:bg-primary/10"
            >
              <Mail className="h-3.5 w-3.5" /> Send Email
            </Button>
          )}

          {onDeleteProgram && (
            <Button variant="ghost" size="sm" onClick={() => onDeleteProgram(program.id)} className="gap-1.5 text-xs text-destructive hover:bg-destructive/10">
              <Trash2 className="h-3.5 w-3.5" /> Delete Program
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl border bg-card text-center space-y-1">
          <span className="text-xs text-muted-foreground font-medium block">Target Employees</span>
          <span className="text-2xl font-extrabold text-foreground">{totalAssigned}</span>
        </div>
        <div className="p-3.5 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-center space-y-1">
          <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium block">Completed</span>
          <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-300">{completedCount}</span>
        </div>
        <div className="p-3.5 rounded-xl border bg-blue-500/10 border-blue-500/30 text-center space-y-1">
          <span className="text-xs text-blue-700 dark:text-blue-400 font-medium block">In Progress</span>
          <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-300">{inProgressCount}</span>
        </div>
        <div className="p-3.5 rounded-xl border bg-muted text-center space-y-1">
          <span className="text-xs text-muted-foreground font-medium block">Not Started</span>
          <span className="text-2xl font-extrabold text-muted-foreground">{notStartedCount}</span>
        </div>
        <div className="p-3.5 rounded-xl border bg-amber-500/10 border-amber-500/30 text-center space-y-1">
          <span className="text-xs text-amber-700 dark:text-amber-400 font-medium block">Completion Rate</span>
          <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-300">{completionRate}%</span>
        </div>
      </div>

      {/* Main Detail Sub-tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-muted/60 p-1">
          <TabsTrigger value="overview" className="text-xs px-3 py-1.5">Overview & Objective</TabsTrigger>
          <TabsTrigger value="employees" className="text-xs px-3 py-1.5">Target Roster ({employeeList.length})</TabsTrigger>
          <TabsTrigger value="communications" className="text-xs px-3 py-1.5 flex items-center gap-1">
            <Bell className="h-3.5 w-3.5 text-primary" /> Notifications & Communications
          </TabsTrigger>
          <TabsTrigger value="sessions" className="text-xs px-3 py-1.5">Schedule & Batches ({program.batches?.length || 0})</TabsTrigger>
          <TabsTrigger value="attendance" className="text-xs px-3 py-1.5">Attendance Tracker</TabsTrigger>
          <TabsTrigger value="assessments" className="text-xs px-3 py-1.5">Assessments</TabsTrigger>
          <TabsTrigger value="certifications" className="text-xs px-3 py-1.5">Certifications</TabsTrigger>
          <TabsTrigger value="skills" className="text-xs px-3 py-1.5">Skill Matrix</TabsTrigger>
        </TabsList>

        {/* 1. Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardHeader className="py-3">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Program Overview & HR Objective</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-4 text-xs">
                <div className="p-3 rounded-lg bg-muted/30 border space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground block">Description:</span>
                  <p className="text-foreground leading-relaxed">{program.description}</p>
                </div>

                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1">
                  <Label className="text-[11px] font-bold text-primary uppercase">Training Objective</Label>
                  <p className="text-foreground leading-relaxed">{program.objective}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-t pt-3">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Category & Type:</span>
                    <strong className="text-foreground">{program.category} ({program.type})</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Delivery Mode:</span>
                    <strong className="text-foreground">{program.deliveryMode}</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Venue / Link:</span>
                    <strong className="text-foreground">{program.location}</strong>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trainer & Contact Card */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Trainer & Organization</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3 text-xs">
                <div className="p-3 rounded-lg border bg-muted/20 space-y-1.5">
                  <p className="font-semibold text-foreground text-sm">{program.trainer}</p>
                  <Badge variant="secondary" className="text-[10px]">
                    {program.trainerType === 'Internal' ? 'Internal Employee Master' : 'External Vendor'}
                  </Badge>
                  <p className="text-[11px] text-muted-foreground">Provider: <strong>{program.provider}</strong></p>
                </div>

                {program.contactEmail && (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 text-primary" /> {program.contactEmail}
                  </p>
                )}
                {program.contactNumber && (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 text-primary" /> {program.contactNumber}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Documents Section */}
          {program.documents && program.documents.length > 0 && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Paperclip className="h-4 w-4 text-primary" /> Attached Training Documents ({program.documents?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {program.documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/30 text-xs">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <div>
                          <p className="font-semibold">{doc.name}</p>
                          <p className="text-[10px] text-muted-foreground">{doc.size} • {doc.type}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownloadDoc(doc)}
                        className="h-7 w-7 text-primary hover:bg-primary/10"
                        title="Download Document"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 2. Target Roster Tab */}
        <TabsContent value="employees">
          <Card>
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold">Assigned Employee Roster ({totalAssigned})</CardTitle>
              <Badge variant="outline" className="text-xs">
                Criteria: {program.assignBy} ({program.targetDepartment})
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="text-xs font-bold">Employee</TableHead>
                    <TableHead className="text-xs font-bold">Department</TableHead>
                    <TableHead className="text-xs font-bold">Grade</TableHead>
                    <TableHead className="text-xs font-bold">Attendance %</TableHead>
                    <TableHead className="text-xs font-bold">Quiz / Test Result</TableHead>
                    <TableHead className="text-xs font-bold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeList.map((emp) => (
                    <TableRow key={emp.employeeId}>
                      <TableCell className="text-xs font-semibold">
                        {emp.employeeName}
                        <span className="block text-[10px] text-muted-foreground font-mono">{emp.employeeId}</span>
                      </TableCell>
                      <TableCell className="text-xs">{emp.department}</TableCell>
                      <TableCell className="text-xs font-mono">{emp.grade}</TableCell>
                      <TableCell className="text-xs font-mono font-semibold">
                        {emp.attendancePercent}%
                      </TableCell>
                      <TableCell className="text-xs">
                        {emp.assessmentScore !== undefined ? (
                          <Badge variant={emp.passed ? 'default' : 'destructive'} className="text-[10px]">
                            {emp.assessmentScore}% ({emp.passed ? 'Passed' : 'Failed'})
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">Not Attempted</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        <StatusBadge status={emp.status === 'Completed' || emp.status === 'Certified' ? 'ACTIVE' : emp.status} className="text-[10px]" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. Notifications & Communications Tab */}
        <TabsContent value="communications" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Portal Notifications Card */}
            <Card className="border shadow-2xs">
              <CardHeader className="py-3.5 px-4 flex flex-row items-center justify-between border-b bg-muted/20">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-bold">Portal Notifications</CardTitle>
                </div>
                {onSendNotification && (
                  <Button size="sm" onClick={() => onSendNotification(program)} className="h-7 text-xs gap-1">
                    <Bell className="h-3 w-3" /> Send Notification
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-lg bg-muted/30 border">
                  <div>
                    <span className="text-muted-foreground text-[10px] block font-medium">Sent:</span>
                    <strong className="text-foreground text-lg">{notifSentCount}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px] block font-medium">Read:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 text-lg">{notifReadCount}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px] block font-medium">Unread:</span>
                    <strong className="text-amber-600 dark:text-amber-400 text-lg">{notifUnreadCount}</strong>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <span className="text-muted-foreground font-semibold text-[11px] block">Portal Dispatch Log</span>
                  {notifHistory.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground text-center py-4 border border-dashed rounded-md">
                      No portal notifications dispatched yet for this training. Click "Send Notification" above.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-44 overflow-y-auto">
                      {notifHistory.map((n) => (
                        <div key={n.id} className="p-2 rounded border bg-card text-[11px] space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{n.title}</span>
                            <Badge variant={n.read ? 'outline' : 'default'} className="text-[9px]">
                              {n.read ? 'READ' : 'UNREAD'}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground line-clamp-1">{n.message}</p>
                          <span className="text-[9px] text-muted-foreground block font-mono">
                            {new Date(n.createdAt).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Email Dispatch Log Card */}
            <Card className="border shadow-2xs">
              <CardHeader className="py-3.5 px-4 flex flex-row items-center justify-between border-b bg-muted/20">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-bold">Email Dispatch Log</CardTitle>
                </div>
                {onSendEmail && (
                  <Button size="sm" onClick={() => onSendEmail(program)} className="h-7 text-xs gap-1">
                    <Mail className="h-3 w-3" /> Send Email
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2 text-center p-3 rounded-lg bg-muted/30 border">
                  <div>
                    <span className="text-muted-foreground text-[10px] block font-medium">Emails Dispatched:</span>
                    <strong className="text-foreground text-lg">{emailSentCount}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px] block font-medium">Failed / Bounced:</span>
                    <strong className="text-emerald-600 text-lg">0</strong>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <span className="text-muted-foreground font-semibold text-[11px] block">Email Dispatch History</span>
                  {emailLogs.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground text-center py-4 border border-dashed rounded-md">
                      No emails dispatched yet for this training. Click "Send Email" above.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-44 overflow-y-auto">
                      {emailLogs.map((log) => (
                        <div key={log.id} className="p-2 rounded border bg-card text-[11px] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground">{log.subject}</span>
                            <Badge variant="default" className="text-[9px] bg-emerald-600">
                              SENT
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-[10px]">
                            Sent to {log.recipientCount} employees • {new Date(log.sentAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 4. Schedule & Sessions Tab */}
        <TabsContent value="sessions">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-bold">Scheduled Batches & Sessions ({program.batches?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {program.batches?.map((b) => (
                  <div key={b.id} className="p-3.5 rounded-xl border bg-card space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="font-bold text-xs text-foreground">{b.name}</span>
                      <Badge variant="outline" className="text-[10px] font-mono">{b.id}</Badge>
                    </div>
                    <div className="text-[11px] space-y-1 text-muted-foreground">
                      <p className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-primary" /> {b.date} ({b.time})</p>
                      <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-primary" /> {b.location}</p>
                      <p className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-primary" /> Capacity: {b.capacity} Seats ({b.assignedCount} Enrolled)</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. Attendance Tracker Tab */}
        <TabsContent value="attendance">
          <Card>
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold">Interactive Attendance Tracker</CardTitle>
                <CardDescription className="text-xs">
                  Method: <strong>{program.attendanceMethod}</strong> (Min Required: {program.minAttendance}%)
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="text-xs font-bold">Employee</TableHead>
                    <TableHead className="text-xs font-bold">Attendance %</TableHead>
                    <TableHead className="text-xs font-bold">Rule Check</TableHead>
                    <TableHead className="text-xs font-bold text-right">Quick Mark Attendance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeList.map((emp) => {
                    const isAttPassed = emp.attendancePercent >= (program.minAttendance || 80);
                    return (
                      <TableRow key={emp.employeeId}>
                        <TableCell className="text-xs font-semibold">{emp.employeeName}</TableCell>
                        <TableCell className="text-xs font-mono font-bold">{emp.attendancePercent}%</TableCell>
                        <TableCell className="text-xs">
                          {isAttPassed ? (
                            <Badge variant="default" className="text-[10px] bg-emerald-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Eligible
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-[10px]">
                              Shortfall (&lt;{program.minAttendance}%)
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-right space-x-1">
                          <Button size="sm" variant="outline" onClick={() => handleMarkAttendance(emp.employeeId, 100)} className="h-6 text-[10px]">
                            100% Present
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleMarkAttendance(emp.employeeId, 85)} className="h-6 text-[10px]">
                            85% Present
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleMarkAttendance(emp.employeeId, 50)} className="h-6 text-[10px] text-destructive">
                            50% Low
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 6. Assessments Tab */}
        <TabsContent value="assessments">
          <Card>
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold">
                  {program.assessmentRequired ? (program.assessmentName || 'Program Assessment') : 'No Assessment Configured'}
                </CardTitle>
                {program.assessmentRequired && (
                  <CardDescription className="text-xs">
                    Type: {program.assessmentType} • Passing Score: {program.passingScore}% • Attempts Allowed: {program.attemptsAllowed}
                  </CardDescription>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {program.assessmentRequired ? (
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="text-xs font-bold">Employee</TableHead>
                      <TableHead className="text-xs font-bold">Score</TableHead>
                      <TableHead className="text-xs font-bold">Result</TableHead>
                      <TableHead className="text-xs font-bold text-right">Simulate / Retake Test</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeeList.map((emp) => (
                      <TableRow key={emp.employeeId}>
                        <TableCell className="text-xs font-semibold">{emp.employeeName}</TableCell>
                        <TableCell className="text-xs font-mono font-bold">
                          {emp.assessmentScore !== undefined ? `${emp.assessmentScore}%` : 'N/A'}
                        </TableCell>
                        <TableCell className="text-xs">
                          {emp.passed !== undefined ? (
                            <Badge variant={emp.passed ? 'default' : 'destructive'} className="text-[10px]">
                              {emp.passed ? 'PASSED' : 'FAILED'}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-[11px]">Pending</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-right space-x-1">
                          <Button size="sm" variant="outline" onClick={() => handleSimulateQuiz(emp.employeeId, 92)} className="h-6 text-[10px]">
                            Simulate 92% (Pass)
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleSimulateQuiz(emp.employeeId, 45)} className="h-6 text-[10px] text-destructive">
                            Simulate 45% (Fail)
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleTriggerRetake(emp.employeeId)} className="h-6 text-[10px] gap-1">
                            <RotateCcw className="h-3 w-3" /> Reset
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  Assessment is disabled for this training program.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 7. Certifications Tab */}
        <TabsContent value="certifications">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-bold">
                {program.certificateRequired ? (program.certificateType || 'Training Completion Certificate') : 'No Certificate Generation'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {program.certificateRequired ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border bg-amber-500/10 border-amber-500/30 text-xs space-y-1">
                    <p className="font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                      <Award className="h-4 w-4" /> Certificate Auto-Issuance Rules
                    </p>
                    <p className="text-muted-foreground">
                      Issued automatically when Attendance ≥ {program.minAttendance}% and Assessment Passed (≥ {program.passingScore}%).
                    </p>
                  </div>

                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="text-xs font-bold">Employee</TableHead>
                        <TableHead className="text-xs font-bold">Certificate Eligibility</TableHead>
                        <TableHead className="text-xs font-bold">Issued Credential</TableHead>
                        <TableHead className="text-xs font-bold text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employeeList.map((emp) => (
                        <TableRow key={emp.employeeId}>
                          <TableCell className="text-xs font-semibold">{emp.employeeName}</TableCell>
                          <TableCell className="text-xs">
                            {emp.certificateIssued ? (
                              <Badge variant="default" className="text-[10px] bg-emerald-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" /> ISSUED
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-[11px]">Ineligible / Pending</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {emp.certificateIssued ? `CRT-2026-${emp.employeeId.slice(-3)}` : '—'}
                          </TableCell>
                          <TableCell className="text-xs text-right">
                            {emp.certificateIssued && (
                              <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1 text-primary">
                                <Download className="h-3 w-3" /> Download PDF
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  Certificate generation is disabled for this training program.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 8. Skill Matrix Tab */}
        <TabsContent value="skills">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-bold">
                {program.updateSkillMatrix ? `Mapped Skill: ${program.skillName || program.category}` : 'No Skill Matrix Upgrade'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {program.updateSkillMatrix ? (
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-lg border bg-indigo-500/10 border-indigo-500/30 space-y-1">
                    <p className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4" /> Automatic Skill Matrix Upgrade
                    </p>
                    <p className="text-muted-foreground">
                      Target Skill Level: <strong>{program.skillLevel}</strong> (Improvement: {program.skillImprovement}) upon training completion.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  Skill matrix upgrade is disabled for this training program.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
