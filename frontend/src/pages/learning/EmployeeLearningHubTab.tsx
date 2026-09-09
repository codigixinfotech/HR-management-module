import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Clock,
  Play,
  Award,
  Download,
  Bell,
  Check,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  FileText,
  Video,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import type { CourseEnrollment } from './types';

export function EmployeeLearningHubTab() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  // Active state machine for enrollment flow
  const [selectedEnrollment, setSelectedEnrollment] = useState<CourseEnrollment | null>(null);
  const [isCourseDetailsOpen, setIsCourseDetailsOpen] = useState(false);
  const [isModuleViewerOpen, setIsModuleViewerOpen] = useState(false);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(1);

  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);

  const fetchMyLearning = () => {
    apiClient
      .get<any[]>('/learning/my-learning')
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.data || [];
        setEnrollments(list);
      })
      .catch((err) => console.warn('Failed to load my-learning from backend:', err));
  };

  useEffect(() => {
    fetchMyLearning();
    window.addEventListener('focus', fetchMyLearning);
    window.addEventListener('ehcm_enrollments_updated', fetchMyLearning);
    return () => {
      window.removeEventListener('focus', fetchMyLearning);
      window.removeEventListener('ehcm_enrollments_updated', fetchMyLearning);
    };
  }, []);

  const myEnrollments = enrollments;

  const newAssignedCourses = myEnrollments.filter((e) => e.status === 'Not Started');
  const totalEnrolled = myEnrollments.length;
  const inProgressCount = myEnrollments.filter((e) => e.status === 'In Progress').length;
  const completedCount = myEnrollments.filter((e) => e.status === 'Completed').length;
  const certificatesCount = myEnrollments.filter((e) => e.certificateIssued).length;

  // Handler: Click [Start Course]
  const handleStartCourse = (enrollment: CourseEnrollment) => {
    setSelectedEnrollment(enrollment);
    setIsCourseDetailsOpen(true);
  };

  // Handler: Click [Start Learning] inside Course Details Modal
  const handleStartLearning = () => {
    if (!selectedEnrollment) return;

    const newProgress = selectedEnrollment.progress > 0 ? selectedEnrollment.progress : 20;
    const newStatus = newProgress >= 100 ? 'Completed' : 'In Progress';

    lmsApi
      .startEnrollment(selectedEnrollment.id)
      .then(() => lmsApi.updateEnrollmentProgress(selectedEnrollment.id, { progress: newProgress, status: newStatus }))
      .then(() => fetchMyLearning())
      .catch(() => {});

    setEnrollments(
      enrollments.map((e) =>
        e.id === selectedEnrollment.id ? { ...e, status: newStatus as any, progress: newProgress } : e
      )
    );

    setSelectedEnrollment({
      ...selectedEnrollment,
      status: newStatus as any,
      progress: newProgress,
    });
    setIsCourseDetailsOpen(false);
    setIsModuleViewerOpen(true);
    setCurrentModuleIndex(1);

    toast.success(`✓ Learning Started! Course status updated to In Progress (${newProgress}%).`);
  };

  // Handler: Complete current module in viewer
  const handleAdvanceCurrentModule = () => {
    if (!selectedEnrollment) return;

    const newProgress = Math.min(100, (selectedEnrollment.progress || 0) + 20);
    const newStatus = newProgress === 100 ? 'Completed' : 'In Progress';
    const isCertIssued = newProgress === 100 ? true : selectedEnrollment.certificateIssued;

    lmsApi
      .updateEnrollmentProgress(selectedEnrollment.id, {
        progress: newProgress,
        status: newStatus,
      })
      .then(() => fetchMyLearning())
      .catch(() => {});

    setEnrollments(
      enrollments.map((e) =>
        e.id === selectedEnrollment.id
          ? { ...e, status: newStatus as any, progress: newProgress, certificateIssued: isCertIssued }
          : e
      )
    );

    setSelectedEnrollment({
      ...selectedEnrollment,
      status: newStatus as any,
      progress: newProgress,
      certificateIssued: isCertIssued,
    });

    if (newProgress === 100) {
      toast.success(`🎉 Course Completed! Certificate issued in database for ${selectedEnrollment.courseTitle}.`);
      setIsModuleViewerOpen(false);
    } else {
      setCurrentModuleIndex((prev) => Math.min(5, prev + 1));
      toast.success(`✓ Module completed! Progress updated to ${newProgress}%.`);
    }
  };

  const handleDownloadCertificate = (courseTitle: string) => {
    const awardee = user?.name || (user?.employee ? `${user.employee.firstName} ${user.employee.lastName}`.trim() : 'Employee');
    const content = `EHCM PLATFORM ENTERPRISE LMS\n=========================================\nOFFICIAL CERTIFICATE OF COMPLETION\n\nAwarded to: ${awardee}\nCourse: ${courseTitle}\nCompletion Date: ${new Date().toLocaleDateString()}\nVerification ID: CRT-2026-EHCM-${Math.floor(1000 + Math.random() * 9000)}\nStatus: VERIFIED ACCREDITED`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `Certificate_${courseTitle.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
    toast.success(`✓ Certificate downloaded for ${courseTitle}!`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. EMPLOYEE DASHBOARD: NEW TRAINING ASSIGNED NOTIFICATION BANNER */}
      {newAssignedCourses.length > 0 && (
        <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-700 dark:text-indigo-300">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                  🔔 New Training Assigned ({newAssignedCourses.length})
                </h3>
                <p className="text-xs text-muted-foreground">
                  You have been assigned mandatory enterprise learning by HR / Learning & Development
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-indigo-600 text-white font-bold font-mono text-xs">
              Action Required
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {newAssignedCourses.map((c) => (
              <div key={c.id} className="p-3.5 rounded-xl border bg-card flex items-center justify-between gap-3 shadow-2xs">
                <div className="space-y-1">
                  <span className="font-bold text-sm text-foreground block">{c.courseTitle}</span>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <div>Assigned by: <strong className="text-foreground">HR / Learning & Development</strong></div>
                    <div>Assigned Date: <strong className="text-foreground">{c.assignedDate || '03-Sep-2026'}</strong></div>
                  </div>
                  <Badge variant="outline" className="text-[10px] mt-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 font-semibold">
                    Status: {c.status}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleStartCourse(c)}
                  className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shrink-0 gap-1.5 shadow-sm"
                >
                  <Play className="h-3.5 w-3.5 fill-current" /> Start Course
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. EMPLOYEE LEARNING HUB HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-card to-card border shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              MY LEARNING
            </h1>
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30 font-semibold">
              Employee Portal
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Track your assigned courses, monitor module completion progress, and view verified certificates.
          </p>
        </div>
      </div>

      {/* KPI STATS SUMMARY */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="shadow-2xs border-l-4 border-l-primary bg-card">
          <CardContent className="p-4 text-center space-y-1">
            <span className="text-xs text-muted-foreground font-semibold uppercase block">Total Enrolled</span>
            <span className="text-2xl font-extrabold text-foreground">{totalEnrolled}</span>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-l-4 border-l-amber-500 bg-amber-500/5">
          <CardContent className="p-4 text-center space-y-1">
            <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold uppercase block">In Progress</span>
            <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-300">{inProgressCount}</span>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-l-4 border-l-emerald-500 bg-emerald-500/5">
          <CardContent className="p-4 text-center space-y-1">
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold uppercase block">Completed</span>
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-300">{completedCount}</span>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-l-4 border-l-purple-500 bg-purple-500/5">
          <CardContent className="p-4 text-center space-y-1">
            <span className="text-xs text-purple-700 dark:text-purple-400 font-semibold uppercase block">Certificates Issued</span>
            <span className="text-2xl font-extrabold text-purple-600 dark:text-purple-300">{certificatesCount}</span>
          </CardContent>
        </Card>
      </div>

      {/* MY LEARNING COURSES GRID */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> My Assigned Courses ({myEnrollments.length})
          </h3>
        </div>

        {myEnrollments.length === 0 ? (
          <Card className="shadow-2xs border-dashed">
            <CardContent className="p-8 text-center text-xs text-muted-foreground space-y-2">
              <BookOpen className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="font-semibold text-foreground">No active course enrollments assigned to you yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {myEnrollments.map((enr) => (
              <Card key={enr.id} className="border shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-primary/5 via-card to-card border-b space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="font-mono text-[10px] bg-background">
                      {enr.courseCode || 'CRS-LMS'}
                    </Badge>
                    <StatusBadge status={enr.status === 'Completed' ? 'ACTIVE' : enr.status} className="text-[10px]" />
                  </div>
                  <h4 className="font-bold text-sm text-foreground line-clamp-2">{enr.courseTitle}</h4>
                  <p className="text-[11px] text-muted-foreground">Coursera for Business</p>
                </div>

                <CardContent className="p-4 space-y-4 text-xs flex-grow">
                  {/* Progress Section */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-muted-foreground font-sans">Progress</span>
                      <span className="font-bold text-primary">{enr.progress}%</span>
                    </div>
                    <Progress value={enr.progress} className="h-2.5 bg-muted" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground p-2.5 rounded-lg border bg-muted/20">
                    <div>Status: <strong className="text-foreground">{enr.status}</strong></div>
                    <div>Assigned: <strong className="text-foreground">{enr.assignedDate || '03-Sep-2026'}</strong></div>
                  </div>

                  {enr.certificateIssued && (
                    <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 flex items-center gap-2 text-[11px]">
                      <Award className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Official Certificate Verification Issued</span>
                    </div>
                  )}
                </CardContent>

                {/* Footer Action Button */}
                <div className="p-3 bg-muted/20 border-t flex items-center justify-between gap-2">
                  {enr.status === 'Completed' ? (
                    <Button
                      size="sm"
                      onClick={() => handleDownloadCertificate(enr.courseTitle)}
                      className="w-full gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                    >
                      <Download className="h-3.5 w-3.5" /> Download Certificate
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleStartCourse(enr)}
                      className="w-full gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs cursor-pointer"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" /> {enr.progress > 0 ? 'Continue Course' : 'Start Course'}
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 3. COURSE DETAILS MODAL */}
      {selectedEnrollment && isCourseDetailsOpen && (
        <Dialog open={isCourseDetailsOpen} onOpenChange={setIsCourseDetailsOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader className="border-b pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="font-mono text-xs">
                  {selectedEnrollment.courseCode || 'CRS-LMS'}
                </Badge>
                <Badge variant="default" className="text-xs bg-emerald-600">
                  {selectedEnrollment.status}
                </Badge>
              </div>
              <DialogTitle className="text-lg font-bold text-foreground mt-2">
                {selectedEnrollment.courseTitle}
              </DialogTitle>
              <DialogDescription className="text-xs space-y-1">
                <div>Course Code: <strong className="font-mono">{selectedEnrollment.courseCode}</strong></div>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-card border">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Assigned By:</span>
                  <strong className="text-foreground">HR / Learning & Development</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Assigned Date:</span>
                  <strong className="text-foreground">
                    {selectedEnrollment.assignedDate ? selectedEnrollment.assignedDate.split('T')[0] : 'Today'}
                  </strong>
                </div>
              </div>

              {/* COURSE ACCESS DETAILS */}
              {selectedEnrollment.courseAccess && (
                <div className="p-3.5 rounded-xl border bg-muted/20 space-y-2.5">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4" /> COURSE ACCESS & PROVIDER LOGIN
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Provider:</span>
                      <strong className="text-foreground">{selectedEnrollment.courseAccess.provider}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Subscription:</span>
                      <Badge variant="outline" className="text-[10px]">{selectedEnrollment.courseAccess.subscriptionType || 'Company Sponsored'}</Badge>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-muted-foreground block">Course URL:</span>
                      <a
                        href={selectedEnrollment.courseAccess.courseUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline font-mono text-[11px] flex items-center gap-1 break-all"
                      >
                        {selectedEnrollment.courseAccess.courseUrl} <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Username:</span>
                      <code className="bg-background px-1.5 py-0.5 rounded border text-[11px] font-mono block truncate">
                        {selectedEnrollment.courseAccess.accessUsername || 'Your Company Account'}
                      </code>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Password:</span>
                      <code className="bg-background px-1.5 py-0.5 rounded border text-[11px] font-mono block">
                        {selectedEnrollment.courseAccess.accessPassword || '••••••••'}
                      </code>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      className="text-xs h-7 gap-1"
                      onClick={() => {
                        const un = selectedEnrollment.courseAccess?.accessUsername || '';
                        const pw = selectedEnrollment.courseAccess?.accessPassword || '';
                        navigator.clipboard.writeText(`Username: ${un}\nPassword: ${pw}`);
                        toast.success('Course credentials copied to clipboard');
                      }}
                    >
                      Copy Login
                    </Button>
                    <Button size="sm" type="button" className="text-xs h-7 gap-1 bg-primary text-primary-foreground" asChild>
                      <a href={selectedEnrollment.courseAccess.courseUrl} target="_blank" rel="noreferrer">
                        Open Course <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </div>
              )}

              {/* Course Progress */}
              <div className="space-y-1.5 p-3.5 rounded-xl border bg-muted/20">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-muted-foreground font-sans font-semibold">Course Progress</span>
                  <span className="font-extrabold text-base text-primary">{selectedEnrollment.progress}%</span>
                </div>
                <Progress value={selectedEnrollment.progress} className="h-3 bg-muted" />
              </div>

              {/* Course Modules */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                  COURSE MODULES
                </h4>

                <div className="border rounded-xl divide-y bg-card">
                  {[
                    { title: 'Cybersecurity Fundamentals', type: 'Video (45 mins)', threshold: 20 },
                    { title: 'Threat Detection', type: 'PDF Document (60 mins)', threshold: 40 },
                    { title: 'Incident Response', type: 'Interactive Lab (90 mins)', threshold: 60 },
                    { title: 'Security Risk Management', type: 'Video (45 mins)', threshold: 80 },
                    { title: 'Final Assessment', type: 'Final Quiz (30 mins)', threshold: 100 },
                  ].map((mod, idx) => {
                    const isDone = selectedEnrollment.progress >= mod.threshold;

                    return (
                      <div
                        key={idx}
                        className={`p-3 flex items-center justify-between gap-3 text-xs ${
                          isDone ? 'bg-emerald-500/5 font-medium' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                            isDone ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground font-semibold'
                          }`}>
                            {isDone ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                          </div>
                          <div>
                            <strong className="text-foreground block">{mod.title}</strong>
                            <span className="text-[10px] text-muted-foreground">{mod.type}</span>
                          </div>
                        </div>

                        {isDone ? (
                          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                            ✓ Completed
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">○ Pending</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <DialogFooter className="border-t pt-3 flex flex-col sm:flex-row gap-2 justify-end">
              <Button
                size="sm"
                onClick={handleStartLearning}
                className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-1.5 shadow-sm"
              >
                <Play className="h-3.5 w-3.5 fill-current" /> Start Learning
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 4. INTERACTIVE MODULE VIEWER MODAL */}
      {selectedEnrollment && isModuleViewerOpen && (
        <Dialog open={isModuleViewerOpen} onOpenChange={setIsModuleViewerOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="font-mono text-xs">
                  MODULE {currentModuleIndex} OF 5
                </Badge>
                <Badge className="bg-amber-600 text-white text-xs">
                  In Progress ({selectedEnrollment.progress}%)
                </Badge>
              </div>
              <DialogTitle className="text-lg font-bold text-foreground mt-2">
                {selectedEnrollment.courseTitle}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Active Interactive Learning Session &middot; Coursera for Business
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 via-card to-card border space-y-2">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Video className="h-4 w-4 text-primary" /> Module {currentModuleIndex}: {[
                    'Cybersecurity Fundamentals',
                    'Threat Detection',
                    'Incident Response',
                    'Security Risk Management',
                    'Final Assessment',
                  ][currentModuleIndex - 1]}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Complete this interactive session to master enterprise security practices and update your course progress.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-muted/30 border border-dashed text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <FileText className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-foreground">Interactive Module Content Loaded</h4>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Review the learning materials, complete the knowledge check, and click below to complete module.
                </p>
              </div>

              <div className="space-y-1.5 p-3.5 rounded-xl border bg-muted/20">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-muted-foreground font-sans font-semibold">Course Progress</span>
                  <span className="font-extrabold text-base text-primary">{selectedEnrollment.progress}%</span>
                </div>
                <Progress value={selectedEnrollment.progress} className="h-3 bg-muted" />
              </div>
            </div>

            <DialogFooter className="border-t pt-3 flex items-center justify-between gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsModuleViewerOpen(false)} className="text-xs">
                Exit Session
              </Button>
              <Button
                size="sm"
                onClick={handleAdvanceCurrentModule}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" /> Complete Module (+20%)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
