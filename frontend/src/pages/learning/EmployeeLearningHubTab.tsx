import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Clock,
  Play,
  Award,
  FileText,
  Sparkles,
  TrendingUp,
  RotateCcw,
  ArrowRight,
  Download,
  AlertCircle,
  Star,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/ui/status-badge';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { INITIAL_COURSE_ENROLLMENTS, type CourseEnrollment } from './mockTrainingData';

export function EmployeeLearningHubTab() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  // Read persistent enrollments from localStorage or initial mock data
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>(() => {
    const saved = localStorage.getItem('ehcm_course_enrollments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse enrollments', e);
      }
    }
    return INITIAL_COURSE_ENROLLMENTS;
  });

  useEffect(() => {
    localStorage.setItem('ehcm_course_enrollments', JSON.stringify(enrollments));
  }, [enrollments]);

  // Filter enrollments for current logged-in employee (or show demo list)
  const myEnrollments = enrollments.filter(
    (e) => e.employeeId === user?.id || e.employeeId === 'EMP-1483' || user?.role === 'Super Admin'
  );

  const totalEnrolled = myEnrollments.length;
  const inProgressCount = myEnrollments.filter((e) => e.status === 'In Progress').length;
  const completedCount = myEnrollments.filter((e) => e.status === 'Completed').length;
  const certificatesCount = myEnrollments.filter((e) => e.certificateIssued).length;

  const handleContinueCourse = (enrId: string, currentProg: number) => {
    const nextProg = Math.min(100, currentProg + 25);
    const isFinished = nextProg === 100;
    const updated = enrollments.map((e) => {
      if (e.id === enrId) {
        return {
          ...e,
          progress: nextProg,
          status: isFinished ? ('In Progress' as const) : ('In Progress' as const),
        };
      }
      return e;
    });
    setEnrollments(updated);
    toast.success(`Progress updated to ${nextProg}% for course activity.`);
  };

  const handleCompleteAssessment = (enrId: string) => {
    const score = 88;
    const updated = enrollments.map((e) => {
      if (e.id === enrId) {
        return {
          ...e,
          progress: 100,
          assessmentScore: score,
          assessmentPassed: true,
          status: 'Completed' as const,
          certificateIssued: true,
        };
      }
      return e;
    });
    setEnrollments(updated);
    toast.success(`🎉 Assessment Passed (${score}%)! Course marked as Completed and Certificate generated!`);
  };

  const handleDownloadCertificate = (courseTitle: string) => {
    const content = `EHCM Platform Enterprise LMS\nOFFICIAL CERTIFICATE OF COMPLETION\nAwarded to: ${user?.name || 'Sanika Shelke'}\nCourse: ${courseTitle}\nVerification Code: CRT-2026-EHCM-88\nDate: ${new Date().toLocaleDateString()}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `Certificate_${courseTitle.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
    toast.success(`Certificate downloaded for ${courseTitle}!`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-purple-500/5 to-card border shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              Employee Learning Hub
            </h1>
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30 font-semibold">
              My Assigned Courses
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Track enrolled company courses, continue e-learning modules, complete assessments, and download certificates
          </p>
        </div>

        <Button
          onClick={() => navigate('/learning/course-catalog')}
          className="gap-1.5 text-xs bg-primary text-primary-foreground font-semibold shadow-xs"
        >
          <BookOpen className="h-4 w-4" /> Browse Course Catalog →
        </Button>
      </div>

      {/* KPI Cards Summary */}
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

      {/* Enrolled Courses Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Active Learning Roster ({myEnrollments.length})
          </h3>
          <span className="text-xs text-muted-foreground font-mono">Assigned by EHCM Enterprise HR</span>
        </div>

        {myEnrollments.length === 0 ? (
          <Card className="shadow-2xs border-dashed">
            <CardContent className="p-8 text-center text-xs text-muted-foreground space-y-2">
              <BookOpen className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="font-semibold text-foreground">No active course enrollments assigned to you yet.</p>
              <p>Explore the Course Catalog to request or enroll in company courses.</p>
              <Button size="sm" onClick={() => navigate('/learning/course-catalog')} className="mt-2 text-xs">
                Explore Course Catalog
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {myEnrollments.map((enr) => (
              <Card key={enr.id} className="border shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-primary/10 via-card to-card border-b space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="font-mono text-[10px] bg-background">
                      {enr.courseCode}
                    </Badge>
                    <StatusBadge status={enr.status === 'Completed' ? 'ACTIVE' : enr.status} className="text-[10px]" />
                  </div>
                  <h4 className="font-bold text-sm text-foreground line-clamp-1">{enr.courseTitle}</h4>
                  <p className="text-[11px] text-muted-foreground">Assigned Date: {enr.assignedDate}</p>
                </div>

                <CardContent className="p-4 space-y-4 text-xs flex-grow">
                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-muted-foreground">Course Completion</span>
                      <span className="font-bold text-primary">{enr.progress}%</span>
                    </div>
                    <Progress value={enr.progress} className="h-2 bg-muted" />
                  </div>

                  {/* Score & Certificate Status */}
                  {enr.assessmentScore !== undefined && (
                    <div className="p-2.5 rounded-lg border bg-muted/30 flex items-center justify-between text-[11px]">
                      <span>Assessment Score:</span>
                      <Badge variant={enr.assessmentPassed ? 'default' : 'destructive'} className="text-[10px]">
                        {enr.assessmentScore}% ({enr.assessmentPassed ? 'Passed' : 'Failed'})
                      </Badge>
                    </div>
                  )}

                  {enr.certificateIssued && (
                    <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 flex items-center gap-2 text-[11px]">
                      <Award className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Official Certificate Verification Issued</span>
                    </div>
                  )}
                </CardContent>

                {/* Footer Action Buttons */}
                <div className="p-3 bg-muted/20 border-t flex items-center justify-between gap-2">
                  {enr.status === 'Completed' ? (
                    <Button
                      size="sm"
                      onClick={() => handleDownloadCertificate(enr.courseTitle)}
                      className="w-full gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    >
                      <Download className="h-3.5 w-3.5" /> Download Certificate
                    </Button>
                  ) : enr.progress === 100 && !enr.assessmentPassed ? (
                    <Button
                      size="sm"
                      onClick={() => handleCompleteAssessment(enr.id)}
                      className="w-full gap-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Take Assessment
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleContinueCourse(enr.id, enr.progress)}
                      className="w-full gap-1.5 text-xs bg-primary text-primary-foreground font-semibold"
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
    </div>
  );
}
