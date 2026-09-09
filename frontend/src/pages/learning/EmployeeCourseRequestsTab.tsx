import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  BookOpen,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuthStore } from '@/stores/auth-store';
import { isHrOrAdminUser } from '@/lib/modules';
import type { CourseRequest } from './types';
import { EmployeeRequestCourseModal } from './CourseCatalogModals';
import { notificationStore } from '@/utils/notificationStore';
import { toast } from 'sonner';
import { lmsApi } from '@/services/lmsApi';

export function EmployeeCourseRequestsTab() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isHrOrAdmin = isHrOrAdminUser(user);

  const [courseRequests, setCourseRequests] = useState<CourseRequest[]>([]);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const fetchRequests = async () => {
    try {
      const data = isHrOrAdmin
        ? await lmsApi.getCourseRequests()
        : await lmsApi.getMyCourseRequests();
      setCourseRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to fetch course requests:', err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [isHrOrAdmin]);

  const [searchQuery, setSearchQuery] = useState('');

  const empId = user?.employee?.id || user?.id || '';
  const myRequests = isHrOrAdmin
    ? courseRequests
    : courseRequests.filter(
        (r) =>
          !r.employeeId ||
          r.employeeId === empId ||
          (r.employeeName && user?.name && r.employeeName.toLowerCase().includes(user.name.toLowerCase()))
      );

  const pendingCount = myRequests.filter((r) => r.status?.toLowerCase() === 'pending').length;
  const approvedCount = myRequests.filter((r) => r.status?.toLowerCase() === 'approved').length;
  const rejectedCount = myRequests.filter((r) => r.status?.toLowerCase() === 'rejected').length;

  const filteredRequests = myRequests.filter((r) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return r.courseTitle.toLowerCase().includes(q) || r.provider.toLowerCase().includes(q);
    }
    return true;
  });

  const handleAddNewRequest = async (reqData: any) => {
    const employeeId = user?.employee?.id || user?.id || '';
    const employeeName = user?.employee ? `${user.employee.firstName} ${user.employee.lastName}`.trim() : (user as any)?.name || 'Employee';
    const department = user?.employee?.department?.name || 'Operations';

    try {
      await lmsApi.submitCourseRequest({
        employeeId,
        employeeName,
        department,
        ...reqData,
      });
      await fetchRequests();
      setIsRequestModalOpen(false);
      toast.success('✓ Course Request Submitted to HR and stored in MySQL!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit course request');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Request Course Modal */}
      <EmployeeRequestCourseModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSubmitRequest={handleAddNewRequest}
      />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-purple-500/5 to-card border shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              Course Requests
            </h1>
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30 font-semibold">
              Approval Tracker
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Track submitted training course requests, HR review approvals, seat allocation, and rejection reasons
          </p>
        </div>

        <Button
          onClick={() => setIsRequestModalOpen(true)}
          className="gap-1.5 text-xs bg-primary text-primary-foreground font-semibold shadow-xs"
        >
          <Plus className="h-4 w-4" /> Request New Course
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="shadow-2xs border-l-4 border-l-primary bg-card">
          <CardContent className="p-4 text-center space-y-1">
            <span className="text-xs text-muted-foreground font-semibold uppercase block">Total Requests</span>
            <span className="text-2xl font-extrabold text-foreground">{myRequests.length}</span>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-l-4 border-l-amber-500 bg-amber-500/5">
          <CardContent className="p-4 text-center space-y-1">
            <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold uppercase block">Pending HR Review</span>
            <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-300">{pendingCount}</span>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-l-4 border-l-emerald-500 bg-emerald-500/5">
          <CardContent className="p-4 text-center space-y-1">
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold uppercase block">Approved</span>
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-300">{approvedCount}</span>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-l-4 border-l-rose-500 bg-rose-500/5">
          <CardContent className="p-4 text-center space-y-1">
            <span className="text-xs text-rose-700 dark:text-rose-400 font-semibold uppercase block">Rejected</span>
            <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-300">{rejectedCount}</span>
          </CardContent>
        </Card>
      </div>

      {/* Course Requests Table Card */}
      <Card className="shadow-2xs overflow-hidden">
        <CardHeader className="py-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b bg-muted/20">
          <div>
            <CardTitle className="text-sm font-bold">My Submitted Course Requests</CardTitle>
            <CardDescription className="text-xs">
              Status updates automatically sync with HR Course Catalog approval decisions.
            </CardDescription>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search requested course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-8 bg-background"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="text-xs font-bold">Requested Course</TableHead>
                <TableHead className="text-xs font-bold">Provider</TableHead>
                <TableHead className="text-xs font-bold">Price / Seat</TableHead>
                <TableHead className="text-xs font-bold">Priority</TableHead>
                <TableHead className="text-xs font-bold">Requested On</TableHead>
                <TableHead className="text-xs font-bold">Status & HR Feedback</TableHead>
                <TableHead className="text-xs font-bold text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-xs text-muted-foreground">
                    No course requests found. Click "Request New Course" to submit a course request.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((req) => (
                  <TableRow key={req.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="text-xs">
                      <div>
                        <span className="font-semibold text-foreground">{req.courseTitle}</span>
                        <span className="block text-[10px] text-muted-foreground line-clamp-1">Reason: {req.reason}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{req.provider}</TableCell>
                    <TableCell className="text-xs font-mono font-bold">₹{req.pricePerSeat.toLocaleString()}</TableCell>
                    <TableCell className="text-xs">
                      <Badge variant={req.priority === 'High' ? 'destructive' : 'secondary'} className="text-[10px]">
                        {req.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{req.requestedAt}</TableCell>
                    <TableCell className="text-xs">
                      <div className="space-y-0.5">
                        <Badge
                          variant={req.status === 'Approved' ? 'default' : req.status === 'Rejected' ? 'destructive' : 'outline'}
                          className={`text-[10px] ${req.status === 'Approved' ? 'bg-emerald-600 text-white' : ''}`}
                        >
                          {req.status === 'Pending' ? 'Pending HR Approval' : req.status === 'Approved' ? 'Approved & Seat Allocated' : 'Rejected'}
                        </Badge>

                        {req.rejectionReason && (
                          <p className="text-[10.5px] text-destructive italic">
                            Reason: {req.rejectionReason}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-right">
                      {req.status === 'Approved' ? (
                        <Button
                          size="sm"
                          onClick={() => navigate('/learning/employee-learning')}
                          className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                        >
                          <BookOpen className="h-3.5 w-3.5" /> Start Course
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">In Review</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
