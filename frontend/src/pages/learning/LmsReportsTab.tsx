import { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  BarChart3,
  CheckCircle2,
  TrendingUp,
  Award,
  Users,
  Building2,
  DollarSign,
  Briefcase,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { lmsApi } from '@/services/lmsApi';

interface ReportsSummary {
  totalCatalogCourses: number;
  totalCompanyCourses: number;
  purchasedSeats: number;
  assignedSeats: number;
  availableSeats: number;
  seatUtilization: number;
  totalEnrollments: number;
  activeLearners: number;
  completedLearners: number;
  completionRate: number;
  certificatesIssued: number;
  reimbursementsCount: number;
  totalReimbursementPaid: number;
  departmentBreakdown: Array<{
    department: string;
    enrolledCount: number;
    completedCount: number;
    completionRate: number;
  }>;
  trainingHoursDelivered: number;
}

export function LmsReportsTab() {
  const [summary, setSummary] = useState<ReportsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const data = await lmsApi.getReportsSummary();
      setSummary(data);
    } catch (err) {
      console.warn('Failed to load reports summary:', err);
      toast.error('Failed to load LMS reports analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleExportCompletions = async () => {
    setExporting('completions');
    try {
      await lmsApi.exportCompletionsCsv();
      toast.success('Course completions CSV report downloaded successfully');
    } catch {
      toast.error('Failed to export completions report');
    } finally {
      setExporting(null);
    }
  };

  const handleExportCertificates = async () => {
    setExporting('certificates');
    try {
      await lmsApi.exportCertificatesCsv();
      toast.success('Certificates ledger CSV report downloaded successfully');
    } catch {
      toast.error('Failed to export certificates report');
    } finally {
      setExporting(null);
    }
  };

  const handleExportReimbursements = async () => {
    setExporting('reimbursements');
    try {
      await lmsApi.exportReimbursementsCsv();
      toast.success('Learning reimbursements CSV report downloaded successfully');
    } catch {
      toast.error('Failed to export reimbursements report');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" /> LMS Reports & Executive Analytics
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time MySQL aggregated metrics, company seat utilization, completion rates, and CSV audit exports
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSummary}
            disabled={loading}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleExportCompletions}
            disabled={!!exporting}
            className="gap-1.5 text-xs bg-primary text-primary-foreground"
          >
            <Download className="h-3.5 w-3.5" /> Export Completions CSV
          </Button>
        </div>
      </div>

      {/* KPI Dashboard Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="shadow-2xs">
          <CardContent className="p-4 text-center space-y-1">
            <span className="text-xs text-muted-foreground font-medium block">Total Courses</span>
            <span className="text-2xl font-extrabold text-foreground">
              {summary ? summary.totalCatalogCourses + summary.totalCompanyCourses : 0}
            </span>
            <span className="text-[10px] text-muted-foreground block">
              {summary?.totalCatalogCourses || 0} Catalog • {summary?.totalCompanyCourses || 0} Company
            </span>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-4 text-center space-y-1">
            <span className="text-xs text-blue-700 dark:text-blue-400 font-medium block">Company Seats</span>
            <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-300">
              {summary?.assignedSeats || 0} / {summary?.purchasedSeats || 0}
            </span>
            <span className="text-[10px] text-blue-600/80 dark:text-blue-400/80 block">
              {summary?.availableSeats || 0} available ({summary?.seatUtilization || 0}% used)
            </span>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-4 text-center space-y-1">
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium block">Completion Rate</span>
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-300">
              {summary?.completionRate || 0}%
            </span>
            <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 block">
              {summary?.completedLearners || 0} of {summary?.totalEnrollments || 0} completed
            </span>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-4 text-center space-y-1">
            <span className="text-xs text-amber-700 dark:text-amber-400 font-medium block">Certificates Issued</span>
            <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-300">
              {summary?.certificatesIssued || 0}
            </span>
            <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 block">
              {summary?.reimbursementsCount || 0} reimbursements (₹{(summary?.totalReimbursementPaid || 0).toLocaleString()})
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Breakdown Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Overall Completion */}
        <Card className="shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span>Overall Course Completion</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                {summary?.completionRate || 0}%
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={summary?.completionRate || 0} className="h-3 bg-muted" />
            <p className="text-[11px] text-muted-foreground">
              {summary?.completedLearners || 0} out of {summary?.totalEnrollments || 0} total enrolled employees have completed all course modules and assessments.
            </p>
            <div className="pt-2 border-t flex justify-between text-xs text-muted-foreground">
              <span>Active in Progress:</span>
              <span className="font-semibold text-foreground">{summary?.activeLearners || 0}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Training Hours Delivered:</span>
              <span className="font-semibold text-foreground">~{summary?.trainingHoursDelivered || 0} hrs</span>
            </div>
          </CardContent>
        </Card>

        {/* Department Performance */}
        <Card className="shadow-2xs md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Department Completion Rates</CardTitle>
            <CardDescription className="text-xs">Aggregate completion rates aggregated from MySQL employee enrollment records</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {!summary?.departmentBreakdown || summary.departmentBreakdown.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No department enrollment records found. As employees enroll and complete courses, departmental statistics will appear here.
              </p>
            ) : (
              summary.departmentBreakdown.map((dept, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between font-medium">
                    <span>{dept.department} ({dept.completedCount}/{dept.enrolledCount} learners)</span>
                    <span className="font-mono">{dept.completionRate}%</span>
                  </div>
                  <Progress value={dept.completionRate} className="h-2" />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Downloadable Real CSV Exports */}
      <Card className="shadow-2xs">
        <CardHeader>
          <CardTitle className="text-sm font-bold">Verified LMS Database Exports</CardTitle>
          <CardDescription className="text-xs">Download live database records generated directly from MySQL</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex flex-col justify-between p-4 border rounded-xl bg-card text-xs hover:border-primary/40 transition-colors space-y-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <p className="font-semibold text-foreground">Completions & Enrollments</p>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Complete ledger of all employee course enrollments, module completion status, scores, and dates.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCompletions}
                disabled={exporting === 'completions'}
                className="w-full text-xs gap-1.5"
              >
                <Download className="h-3.5 w-3.5" /> Download CSV
              </Button>
            </div>

            <div className="flex flex-col justify-between p-4 border rounded-xl bg-card text-xs hover:border-primary/40 transition-colors space-y-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-500" />
                  <p className="font-semibold text-foreground">Certificates Register</p>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Verifiable credential ledger with certificate numbers, recipient IDs, issue dates, and validation codes.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCertificates}
                disabled={exporting === 'certificates'}
                className="w-full text-xs gap-1.5"
              >
                <Download className="h-3.5 w-3.5" /> Download CSV
              </Button>
            </div>

            <div className="flex flex-col justify-between p-4 border rounded-xl bg-card text-xs hover:border-primary/40 transition-colors space-y-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                  <p className="font-semibold text-foreground">Reimbursements Register</p>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Employee course reimbursement claims, invoice references, HR approval audit, and payment transaction IDs.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportReimbursements}
                disabled={exporting === 'reimbursements'}
                className="w-full text-xs gap-1.5"
              >
                <Download className="h-3.5 w-3.5" /> Download CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
