import { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Star,
  Download,
  CheckCircle2,
  Clock,
  Layers,
  Award,
  ShoppingCart,
  Users,
  Building2,
  FileText,
  DollarSign,
  RotateCcw,
  Eye,
  MoreVertical,
  Check,
  X,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Mail,
  Bell,
  CheckSquare,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import type {
  MarketplaceCourse,
  CompanyCourse,
  CourseEnrollment,
  CourseRequest,
  PurchaseHistoryRecord,
} from './types';
import {
  ViewCourseModal,
  PurchaseCourseModal,
  EnrollEmployeesModal,
  ReviewCourseRequestModal,
  PurchaseMoreSeatsModal,
  EmployeeRequestCourseModal,
  AddCompanyCourseModal,
  EnrollSuccessModal,
  ViewCompanyCourseModal,
  ManageCompanySeatsModal,
  DeleteCompanyCourseModal,
} from './CourseCatalogModals';
import { notificationStore } from '@/utils/notificationStore';
import { useAuthStore } from '@/stores/auth-store';
import { isHrOrAdminUser } from '@/lib/modules';
import { apiClient } from '@/lib/api-client';
import { employeesApi } from '@/api/employees';
import { lmsApi } from '@/services/lmsApi';

export function CourseCatalogTab() {
  const user = useAuthStore((s) => s.user);
  const isHrOrAdmin = isHrOrAdminUser(user);
  const [marketplaceCourses, setMarketplaceCourses] = useState<MarketplaceCourse[]>([]);
  const [companyCourses, setCompanyCourses] = useState<CompanyCourse[]>([]);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [courseRequests, setCourseRequests] = useState<CourseRequest[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistoryRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'available' | 'company' | 'enrollments' | 'requests' | 'history'>('company');


  // Fetch & Sync with Backend MySQL Database
  const fetchBackendDbData = async () => {
    try {
      const [catRes, compRes, enrRes, reqRes, histRes] = await Promise.all([
        lmsApi.getCatalogCourses().catch(() => []),
        lmsApi.getCompanyCourses().catch(() => []),
        lmsApi.getEnrollments().catch(() => []),
        lmsApi.getCourseRequests().catch(() => []),
        lmsApi.getPurchaseHistory().catch(() => []),
      ]);

      setMarketplaceCourses(Array.isArray(catRes) ? catRes : []);
      setCompanyCourses(Array.isArray(compRes) ? compRes : []);
      setEnrollments(Array.isArray(enrRes) ? enrRes : []);
      setCourseRequests(Array.isArray(reqRes) ? reqRes : []);
      setPurchaseHistory(Array.isArray(histRes) ? histRes : []);
    } catch (err) {
      console.warn('Backend DB sync error:', err);
    }
  };

  useEffect(() => {
    fetchBackendDbData();
  }, [activeTab]);

  const [dbEmployees, setDbEmployees] = useState<
    Array<{ id: string; employeeCode?: string; name: string; department: string; designation?: string }>
  >([]);

  useEffect(() => {
    employeesApi.list({ pageSize: 1000 }).then((res: any) => {
      const rawList: any[] = Array.isArray(res)
        ? res
        : Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.items)
        ? res.data.items
        : [];

      if (rawList.length > 0) {
        const mapped = rawList.map((e: any) => ({
          id: e.id,
          employeeCode: e.employeeCode || e.id,
          name: `${e.firstName || ''} ${e.lastName || ''}`.trim() || e.name || e.employeeCode || 'Employee',
          department: typeof e.department === 'string' ? e.department : e.department?.name || 'Operations',
          designation: typeof e.designation === 'string' ? e.designation : e.designation?.title || 'Staff',
        }));
        setDbEmployees(mapped);
      }
    }).catch((err) => console.warn('Failed to load DB employees in CourseCatalogTab:', err));
  }, []);

  // Active Modals State
  const [viewingCourse, setViewingCourse] = useState<MarketplaceCourse | null>(null);
  const [purchasingCourse, setPurchasingCourse] = useState<MarketplaceCourse | null>(null);
  const [enrollingCompanyCourse, setEnrollingCompanyCourse] = useState<CompanyCourse | null>(null);
  const [reviewingRequest, setReviewingRequest] = useState<CourseRequest | null>(null);
  const [purchasingMoreSeatsCourse, setPurchasingMoreSeatsCourse] = useState<CompanyCourse | null>(null);
  const [requestingCourse, setRequestingCourse] = useState<MarketplaceCourse | null>(null);
  const [isAddCompanyCourseOpen, setIsAddCompanyCourseOpen] = useState(false);
  const [requestForPurchase, setRequestForPurchase] = useState<CourseRequest | null>(null);

  const [enrollSuccessData, setEnrollSuccessData] = useState<{
    courseTitle: string;
    enrolledCount: number;
    seatsRemaining: number;
    portalNotifSent: number;
    emailSent: number;
  } | null>(null);

  const [viewingCompanyCourse, setViewingCompanyCourse] = useState<CompanyCourse | null>(null);
  const [managingSeatsCompanyCourse, setManagingSeatsCompanyCourse] = useState<CompanyCourse | null>(null);
  const [deletingCompanyCourse, setDeletingCompanyCourse] = useState<CompanyCourse | null>(null);

  const handleAddCompanyCourse = async (newCompCourse: CompanyCourse, newOrderRecord: PurchaseHistoryRecord) => {
    try {
      await lmsApi.addCompanyCourse({
        title: newCompCourse.title,
        courseCode: newCompCourse.courseCode,
        provider: newCompCourse.provider,
        category: newCompCourse.category,
        seatsPurchased: newCompCourse.purchasedSeats,
        pricePerSeat: newOrderRecord.pricePerSeat,
      });
      await fetchBackendDbData();
      setIsAddCompanyCourseOpen(false);
      toast.success(`✓ Added ${newCompCourse.title} to company courses library in MySQL.`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to add company course');
    }
  };

  const handleReleaseSeat = async (enrId: string) => {
    const targetEnr = enrollments.find((e) => e.id === enrId);
    if (!targetEnr) return;

    if (targetEnr.progress > 0 || targetEnr.status !== 'Not Started') {
      toast.error('⚠ Seat cannot be released because the employee has already started the course.');
      return;
    }

    try {
      await lmsApi.releaseSeat(enrId);
      await fetchBackendDbData();
      window.dispatchEvent(new Event('ehcm_enrollments_updated'));
      toast.success(`✓ Released 1 seat from ${targetEnr.employeeName}. Available seats restored in MySQL.`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to release seat');
    }
  };

  const handleConfirmDeleteCompanyCourse = async (courseId: string) => {
    const target = companyCourses.find((c) => c.courseId === courseId || c.id === courseId);
    try {
      await lmsApi.deleteCompanyCourse(courseId);
      await fetchBackendDbData();
      toast.success(`Deleted ${target?.title || 'company course entry'} from MySQL database.`);
    } catch (err: any) {
      toast.error('Failed to delete course');
    } finally {
      setDeletingCompanyCourse(null);
    }
  };

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [enrollmentCourseFilter, setEnrollmentCourseFilter] = useState('All');

  // Dynamic Seat Ledger Calculation (Single Source of Truth derived from actual Enrollments)
  const effectiveCompanyCourses = useMemo(() => {
    return companyCourses.map((cc) => {
      const courseEnrCount = enrollments.filter(
        (e) => e.courseId === cc.courseId || e.courseTitle === cc.title
      ).length;
      const assignedSeats = Math.min(cc.purchasedSeats, courseEnrCount);
      const availableSeats = Math.max(0, cc.purchasedSeats - assignedSeats);
      return {
        ...cc,
        assignedSeats,
        availableSeats,
      };
    });
  }, [companyCourses, enrollments]);

  // KPI Calculations
  const totalAvailableMarketplace = marketplaceCourses.length;
  const totalCompanyCourses = effectiveCompanyCourses.length;
  const totalPurchasedSeats = effectiveCompanyCourses.reduce((acc, c) => acc + c.purchasedSeats, 0);
  const totalAvailableSeats = effectiveCompanyCourses.reduce((acc, c) => acc + c.availableSeats, 0);
  const totalActiveEnrollments = enrollments.filter((e) => e.status === 'In Progress' || e.status === 'Not Started').length;
  const totalCompletedCourses = enrollments.filter((e) => e.status === 'Completed').length;
  const totalPendingRequests = courseRequests.filter((r) => r.status?.toLowerCase() === 'pending').length;

  // ① Handler: Purchase New Course
  const handleConfirmPurchase = async (order: PurchaseHistoryRecord, seatsCount: number) => {
    try {
      const marketCourse = marketplaceCourses.find((m) => m.id === order.courseId);
      await lmsApi.addCompanyCourse({
        title: order.courseTitle,
        courseCode: order.courseCode,
        provider: order.provider,
        category: marketCourse?.category || 'Technical',
        seatsPurchased: seatsCount,
        pricePerSeat: order.pricePerSeat,
      });
      await fetchBackendDbData();
      toast.success(`✓ Successfully purchased ${seatsCount} seats for ${order.courseTitle}! Saved in MySQL.`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to complete purchase');
    }
  };

  // ② Handler: Enroll Selected Employees
  const handleConfirmEnrollment = async (
    companyCourseId: string,
    enrolledEmpIds: string[],
    notifyPortal: boolean,
    notifyEmail: boolean
  ) => {
    let targetCompCourse = companyCourses.find(
      (c) => c.courseId === companyCourseId || c.id === companyCourseId || c.courseId === enrollingCompanyCourse?.courseId
    );
    if (!targetCompCourse && enrollingCompanyCourse) {
      targetCompCourse = enrollingCompanyCourse;
    } else if (!targetCompCourse && companyCourses.length > 0) {
      targetCompCourse = companyCourses[0];
    }

    if (!targetCompCourse) {
      toast.error('Could not find company course for enrollment.');
      return;
    }

    try {
      const targetId = targetCompCourse.id || targetCompCourse.courseId;
      const res: any = await lmsApi.enrollEmployees(targetId, enrolledEmpIds);
      await fetchBackendDbData();
      window.dispatchEvent(new Event('ehcm_enrollments_updated'));

      const count = enrolledEmpIds.length;
      if (notifyPortal) {
        const portalNotifs = enrolledEmpIds.map((empId) => {
          const foundEmp = dbEmployees.find((e) => e.id === empId);
          return {
            type: 'TRAINING' as const,
            employeeId: empId,
            employeeName: foundEmp?.name || `Employee ${empId}`,
            title: `🎓 New Course Assigned: ${targetCompCourse!.title}`,
            message: `You have been enrolled in ${targetCompCourse!.title} by EHCM HR. Start Date: ${new Date().toLocaleDateString()}. Click to start course in My Learning.`,
            programId: targetCompCourse!.courseId,
            programCode: targetCompCourse!.courseCode,
            actionUrl: '/learning/employee-learning',
            sender: 'EHCM L&D HR Team',
          };
        });
        notificationStore.addNotifications(portalNotifs);
      }

      if (notifyEmail) {
        notificationStore.addEmailDispatchLog({
          programId: targetCompCourse.courseId,
          programCode: targetCompCourse.courseCode,
          programName: targetCompCourse.title,
          recipientCount: count,
          recipients: enrolledEmpIds.map((empId) => {
            const foundEmp = dbEmployees.find((e) => e.id === empId);
            return {
              name: foundEmp?.name || `Employee ${empId}`,
              email: `${(foundEmp?.name || empId).toLowerCase().replace(/\s+/g, '.')}@codigix.com`,
            };
          }),
          subject: `New Course Assigned – ${targetCompCourse.title}`,
          body: `You have been enrolled in ${targetCompCourse.title} by EHCM Technologies Pvt Ltd. Please log in to Employee Learning Hub to start your course.`,
          status: 'SENT',
          senderName: 'EHCM L&D HR Team',
        });
      }

      setEnrollingCompanyCourse(null);
      setEnrollSuccessData({
        courseTitle: targetCompCourse.title,
        enrolledCount: count,
        seatsRemaining: res?.availableSeats ?? Math.max(0, targetCompCourse.availableSeats - count),
        portalNotifSent: notifyPortal ? count : 0,
        emailSent: notifyEmail ? count : 0,
      });
      toast.success(`✓ Successfully enrolled ${count} employees into ${targetCompCourse.title}!`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Enrollment failed');
    }
  };

  // ③ Handler: Course Request Approval (Approve & Purchase vs Approve Existing vs Reject)
  const handleApprovePurchaseRequest = (req: CourseRequest) => {
    setReviewingRequest(null);
    setRequestForPurchase(req);
    setIsAddCompanyCourseOpen(true);
  };

  const handleConfirmApproveAndPurchase = async (req: CourseRequest, purchaseData: any) => {
    try {
      await lmsApi.approvePurchaseCourseRequest(req.id, purchaseData);
      await fetchBackendDbData();
      setIsAddCompanyCourseOpen(false);
      setRequestForPurchase(null);
      window.dispatchEvent(new Event('ehcm_enrollments_updated'));
      toast.success(`✓ Approved request & purchased 1 seat for ${req.employeeName}! Seat allocated and enrolled in MySQL.`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to complete approval and purchase');
    }
  };

  const handleApproveExistingSeatRequest = async (req: CourseRequest) => {
    const existingCompCourse = companyCourses.find((c) => c.courseId === req.courseId || c.title === req.courseTitle);
    if (!existingCompCourse || existingCompCourse.availableSeats <= 0) {
      toast.error('No available seats remaining in existing course library. Please click "Approve & Purchase" instead.');
      return;
    }

    try {
      await lmsApi.approveExistingSeatCourseRequest(req.id, { companyCourseId: existingCompCourse.id || existingCompCourse.courseId });
      await fetchBackendDbData();
      window.dispatchEvent(new Event('ehcm_enrollments_updated'));
      setReviewingRequest(null);
      toast.success(`✓ Course Request Approved! 1 existing seat assigned to ${req.employeeName}.`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to approve request');
    }
  };

  const handleRejectRequest = async (req: CourseRequest, reason: string) => {
    try {
      await lmsApi.rejectCourseRequest(req.id, reason);
      await fetchBackendDbData();
      setReviewingRequest(null);
      toast.success(`Course request for ${req.employeeName} rejected.`);
    } catch (err: any) {
      toast.error('Failed to reject request');
    }
  };

  // Handler: Employee Submits Course Request
  const handleEmployeeSubmitRequest = async (reqData: any) => {
    const empId = user?.employee?.id || user?.id || '';
    const empName = user?.employee ? `${user.employee.firstName} ${user.employee.lastName}`.trim() : (user as any)?.name || 'Employee';
    const dept = user?.employee?.department?.name || 'Operations';

    try {
      await lmsApi.submitCourseRequest({
        employeeId: empId,
        employeeName: empName,
        department: dept,
        ...reqData,
      });
      await fetchBackendDbData();
      toast.success('✓ Course Request Submitted to HR!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit course request');
    }
  };

  // ④ Handler: Purchase Additional Seats
  const handleConfirmAdditionalSeats = async (courseId: string, additionalSeats: number, totalAmount: number) => {
    try {
      await lmsApi.purchaseAdditionalSeats(courseId, { additionalSeats, pricePerSeat: 2500 });
      await fetchBackendDbData();
      toast.success(`✓ Successfully purchased ${additionalSeats} additional seats.`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to purchase additional seats');
    }
  };

  // ⑤ Simulator Handlers for Enrollments
  const handleSimulateProgress = async (enrId: string, newProgress: number) => {
    try {
      await lmsApi.updateEnrollmentProgress(enrId, { progress: newProgress });
      await fetchBackendDbData();
      window.dispatchEvent(new Event('ehcm_enrollments_updated'));
      toast.success(`Updated enrollment progress to ${newProgress}% in MySQL database.`);
    } catch (err: any) {
      toast.error('Failed to update progress');
    }
  };

  const handleSimulateAssessment = async (enrId: string, score: number) => {
    const passed = score >= 60;
    try {
      await lmsApi.updateEnrollmentProgress(enrId, {
        progress: 100,
        assessmentScore: score,
        assessmentPassed: passed,
        status: passed ? 'Completed' : 'Failed',
      });
      await fetchBackendDbData();
      window.dispatchEvent(new Event('ehcm_enrollments_updated'));
      if (passed) {
        toast.success(`✓ Assessment Passed (${score}%)! Certificate stored in MySQL.`);
      } else {
        toast.error(`Assessment Failed (${score}%). Retake enabled.`);
      }
    } catch (err: any) {
      toast.error('Failed to record assessment');
    }
  };

  // Delete Handlers for All 5 Tabs (with Database Persistence)
  const handleDeleteMarketplaceCourse = async (courseId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this course from the database catalog?')) {
      return;
    }
    try {
      await apiClient.delete(`/learning/catalog-courses/${courseId}`);
      await fetchBackendDbData();
      toast.success('Course entry permanently deleted from catalog.');
    } catch (err: any) {
      console.error('Failed to delete catalog course:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete course from database');
    }
  };

  const handleDeleteCompanyCourse = async (courseId: string) => {
    if (!window.confirm('Are you sure you want to delete this company course entry?')) {
      return;
    }
    try {
      await apiClient.delete(`/learning/company-courses/${courseId}`);
      await fetchBackendDbData();
      toast.success('Company course entry deleted from database.');
    } catch (err: any) {
      console.error('Failed to delete company course:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete company course');
    }
  };

  const handleDeleteEnrollment = async (enrId: string) => {
    if (!window.confirm('Are you sure you want to delete this enrollment record?')) {
      return;
    }
    try {
      await apiClient.delete(`/learning/enrollments/${enrId}`);
      await fetchBackendDbData();
      window.dispatchEvent(new Event('ehcm_enrollments_updated'));
      toast.success('Enrollment record deleted from database.');
    } catch (err: any) {
      console.error('Failed to delete enrollment:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete enrollment');
    }
  };

  const handleDeleteCourseRequest = async (reqId: string) => {
    if (!window.confirm('Are you sure you want to delete this course request entry?')) {
      return;
    }
    try {
      await apiClient.delete(`/learning/course-requests/${reqId}`);
      await fetchBackendDbData();
      toast.success('Course request entry deleted from database.');
    } catch (err: any) {
      console.error('Failed to delete course request:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete course request');
    }
  };

  const handleDeletePurchaseRecord = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to delete this purchase order log?')) {
      return;
    }
    try {
      await apiClient.delete(`/learning/purchase-history/${orderId}`);
      await fetchBackendDbData();
      toast.success('Purchase order log deleted from database.');
    } catch (err: any) {
      console.error('Failed to delete purchase record:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete purchase log');
    }
  };

  const handleDirectSelfEnroll = async (course: MarketplaceCourse) => {
    const targetComp = companyCourses.find((cc) => cc.courseId === course.id || cc.title === course.title);
    if (!targetComp || targetComp.availableSeats <= 0) {
      toast.error('No available seats currently remaining for this course.');
      return;
    }

    const currentEmpId = user?.employee?.id || user?.id || '';
    const alreadyEnrolled = enrollments.some(
      (e) => (e.employeeId === currentEmpId) && (e.courseId === course.id || e.courseCode === course.code)
    );
    if (alreadyEnrolled) {
      toast.info('You are already enrolled in this course! Check Employee Learning Hub.');
      return;
    }

    try {
      await lmsApi.enrollEmployees(targetComp.id || targetComp.courseId, [currentEmpId]);
      await fetchBackendDbData();
      window.dispatchEvent(new Event('ehcm_enrollments_updated'));
      toast.success(`✓ Enrolled in ${course.title}! Added to Employee Learning Hub.`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to self-enroll');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // EMPLOYEE VIEW (When user is a standard Employee)
  // ─────────────────────────────────────────────────────────────
  if (!isHrOrAdmin) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {viewingCourse && (
          <ViewCourseModal
            isOpen={!!viewingCourse}
            onClose={() => setViewingCourse(null)}
            course={viewingCourse}
            onPurchaseSeats={(c) => setRequestingCourse(c)}
          />
        )}

        {requestingCourse && (
          <EmployeeRequestCourseModal
            isOpen={!!requestingCourse}
            onClose={() => setRequestingCourse(null)}
            course={requestingCourse}
            onSubmitRequest={handleEmployeeSubmitRequest}
          />
        )}

        {/* Employee Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-purple-500/5 to-card border shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                Course Catalog
              </h1>
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30 font-semibold">
                Available Courses
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Browse available courses through your organization, view curriculum, enroll if accessible, or request new training
            </p>
          </div>

          <Button
            onClick={() => {
              const firstMarket = marketplaceCourses[0];
              if (firstMarket) setRequestingCourse(firstMarket);
            }}
            className="gap-1.5 text-xs bg-primary text-primary-foreground font-semibold shadow-xs"
          >
            <Plus className="h-4 w-4" /> Request New Course
          </Button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-card rounded-xl border shadow-2xs">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search course title, code, provider..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-8 bg-background"
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="text-xs h-8 w-[140px] bg-background">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              <SelectItem value="Safety">Safety</SelectItem>
              <SelectItem value="Technical">Technical</SelectItem>
              <SelectItem value="Leadership">Leadership</SelectItem>
              <SelectItem value="Compliance">Compliance</SelectItem>
              <SelectItem value="Operations">Operations</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Employee Course Cards Grid */}
        {(() => {
          const filtered = marketplaceCourses.filter((c) => {
            if (searchQuery) {
              const q = searchQuery.toLowerCase();
              if (!c.title.toLowerCase().includes(q) && !c.code.toLowerCase().includes(q) && !c.provider.toLowerCase().includes(q)) return false;
            }
            if (categoryFilter !== 'All' && c.category !== categoryFilter) return false;
            return true;
          });

          if (filtered.length === 0) {
            return (
              <div className="p-12 text-center border rounded-2xl bg-card space-y-3 shadow-2xs">
                <BookOpen className="h-10 w-10 text-muted-foreground mx-auto" />
                <h3 className="text-base font-bold text-foreground">No courses match your search</h3>
                <p className="text-xs text-muted-foreground">Try clearing search filters or selecting All Categories.</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setCategoryFilter('All');
                  }}
                  className="text-xs font-semibold"
                >
                  Reset All Filters
                </Button>
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((c) => {
                const matchingComp = companyCourses.find((cc) => cc.courseId === c.id);
                const hasCompanySeats = matchingComp && matchingComp.availableSeats > 0;
                const isEnrolled = enrollments.some(
                  (e) => (e.employeeId === (user?.employee?.id || user?.id)) && (e.courseId === c.id || e.courseCode === c.code)
                );

                return (
                  <Card key={c.id} className="border shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group">
                    <div className="p-4 bg-gradient-to-r from-primary/10 via-card to-card border-b space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="font-mono text-[10px] bg-background">
                          {c.code}
                        </Badge>
                        {hasCompanySeats ? (
                          <Badge variant="default" className="text-[9px] bg-emerald-600">
                            Company Access: Available
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[9px]">
                            Company Access: Not Available
                          </Badge>
                        )}
                      </div>

                      <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {c.title}
                      </h3>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">
                        {c.description}
                      </p>
                    </div>

                    <CardContent className="p-4 space-y-3 text-xs flex-grow">
                      <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-muted/30 border text-[11px]">
                        <div>
                          <span className="text-muted-foreground block text-[10px]">Provider:</span>
                          <span className="font-semibold text-foreground line-clamp-1">{c.provider}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px]">Duration:</span>
                          <span className="font-semibold text-foreground">{c.durationHours} Hours</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Level: <strong className="text-foreground">{c.difficulty}</strong></span>
                        <span>Certificate: <strong className="text-emerald-600">Included ✓</strong></span>
                      </div>
                    </CardContent>

                    <div className="p-3 bg-muted/20 border-t flex items-center justify-between gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingCourse(c)}
                        className="h-8 text-xs gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" /> View Details
                      </Button>

                      {isEnrolled ? (
                        <Badge variant="default" className="h-8 px-3 text-xs bg-emerald-600">
                          Enrolled ✓
                        </Badge>
                      ) : hasCompanySeats ? (
                        <Button
                          size="sm"
                          onClick={() => handleDirectSelfEnroll(c)}
                          className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Enroll Now
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => setRequestingCourse(c)}
                          className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground font-semibold"
                        >
                          <FileText className="h-3.5 w-3.5" /> Request Course
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          );
        })()}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // HR / ADMIN VIEW (Full Seat Ledger, Purchasing & Approvals)
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Active Modals */}
      {viewingCourse && (
        <ViewCourseModal
          isOpen={!!viewingCourse}
          onClose={() => setViewingCourse(null)}
          course={viewingCourse}
          onPurchaseSeats={(c) => setPurchasingCourse(c)}
        />
      )}

      {purchasingCourse && (
        <PurchaseCourseModal
          isOpen={!!purchasingCourse}
          onClose={() => setPurchasingCourse(null)}
          course={purchasingCourse}
          onConfirmPurchase={handleConfirmPurchase}
        />
      )}

      {enrollingCompanyCourse && (
        <EnrollEmployeesModal
          isOpen={!!enrollingCompanyCourse}
          onClose={() => setEnrollingCompanyCourse(null)}
          companyCourse={enrollingCompanyCourse}
          existingEnrollments={enrollments}
          allEmployees={dbEmployees}
          onConfirmEnrollment={handleConfirmEnrollment}
        />
      )}

      {reviewingRequest && (
        <ReviewCourseRequestModal
          isOpen={!!reviewingRequest}
          onClose={() => setReviewingRequest(null)}
          request={reviewingRequest}
          onApprovePurchase={handleApprovePurchaseRequest}
          onApproveExistingSeat={handleApproveExistingSeatRequest}
          onRejectRequest={handleRejectRequest}
        />
      )}

      {purchasingMoreSeatsCourse && (
        <PurchaseMoreSeatsModal
          isOpen={!!purchasingMoreSeatsCourse}
          onClose={() => setPurchasingMoreSeatsCourse(null)}
          course={purchasingMoreSeatsCourse}
          unitPrice={2500}
          onConfirmAdditionalSeats={handleConfirmAdditionalSeats}
        />
      )}

      {requestingCourse && (
        <EmployeeRequestCourseModal
          isOpen={!!requestingCourse}
          onClose={() => setRequestingCourse(null)}
          course={requestingCourse}
          onSubmitRequest={handleEmployeeSubmitRequest}
        />
      )}

      <AddCompanyCourseModal
        isOpen={isAddCompanyCourseOpen}
        onClose={() => {
          setIsAddCompanyCourseOpen(false);
          setRequestForPurchase(null);
        }}
        catalogCourses={marketplaceCourses}
        onAddCompanyCourse={handleAddCompanyCourse}
        initialCourseRequest={requestForPurchase}
        onApprovePurchaseRequest={handleConfirmApproveAndPurchase}
      />

      <EnrollSuccessModal
        isOpen={!!enrollSuccessData}
        onClose={() => setEnrollSuccessData(null)}
        data={enrollSuccessData}
        onViewEnrollments={() => setActiveTab('enrollments')}
        onViewNotifications={() => toast.info('Navigating to Notifications Center')}
      />

      <ViewCompanyCourseModal
        isOpen={!!viewingCompanyCourse}
        onClose={() => setViewingCompanyCourse(null)}
        companyCourse={viewingCompanyCourse}
        onViewEnrollments={() => setActiveTab('enrollments')}
      />

      <ManageCompanySeatsModal
        isOpen={!!managingSeatsCompanyCourse}
        onClose={() => setManagingSeatsCompanyCourse(null)}
        companyCourse={managingSeatsCompanyCourse}
        enrollments={enrollments}
        onReleaseSeat={handleReleaseSeat}
        onAssignEmployees={(cc) => setEnrollingCompanyCourse(cc)}
        onPurchaseMoreSeats={(cc) => setPurchasingMoreSeatsCourse(cc)}
      />

      <DeleteCompanyCourseModal
        isOpen={!!deletingCompanyCourse}
        onClose={() => setDeletingCompanyCourse(null)}
        companyCourse={deletingCompanyCourse}
        activeEnrollmentCount={enrollments.filter((e) => e.courseId === deletingCompanyCourse?.courseId).length}
        onConfirmDelete={handleConfirmDeleteCompanyCourse}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              Enterprise Course Catalog & Seat Management
            </h1>
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30 font-semibold">
              LMS License Hub
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Company course library purchasing, seat allocation ledger, employee enrollments & course requests
          </p>
        </div>

        <div className="flex items-center gap-2">

          <Button
            onClick={() => setIsAddCompanyCourseOpen(true)}
            variant="outline"
            className="gap-1.5 text-xs font-semibold border-primary/30 text-primary hover:bg-primary/10"
          >
            <Plus className="h-4 w-4" /> Add Company Course
          </Button>

          <Button
            onClick={() => {
              const firstMarket = marketplaceCourses[0];
              if (firstMarket) setPurchasingCourse(firstMarket);
            }}
            className="gap-1.5 text-xs bg-primary text-primary-foreground font-semibold shadow-xs"
          >
            <ShoppingCart className="h-4 w-4" /> Browse & Purchase Courses
          </Button>
        </div>
      </div>

      {/* KPI Cards Summary Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card className="shadow-2xs border-l-4 border-l-primary bg-card">
          <CardContent className="p-3 text-center space-y-1">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Available Courses</span>
            <span className="text-xl font-extrabold text-foreground">{totalAvailableMarketplace}</span>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-l-4 border-l-indigo-500 bg-indigo-500/5">
          <CardContent className="p-3 text-center space-y-1">
            <span className="text-[10px] text-indigo-700 dark:text-indigo-400 font-semibold uppercase block">Company Courses</span>
            <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-300">{totalCompanyCourses}</span>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-l-4 border-l-purple-500 bg-purple-500/5">
          <CardContent className="p-3 text-center space-y-1">
            <span className="text-[10px] text-purple-700 dark:text-purple-400 font-semibold uppercase block">Purchased Seats</span>
            <span className="text-xl font-extrabold text-purple-600 dark:text-purple-300">{totalPurchasedSeats}</span>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-l-4 border-l-emerald-500 bg-emerald-500/5">
          <CardContent className="p-3 text-center space-y-1">
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold uppercase block">Available Seats</span>
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-300">{totalAvailableSeats}</span>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-l-4 border-l-blue-500 bg-blue-500/5">
          <CardContent className="p-3 text-center space-y-1">
            <span className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold uppercase block">Active Enrollments</span>
            <span className="text-xl font-extrabold text-blue-600 dark:text-blue-300">{totalActiveEnrollments}</span>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-l-4 border-l-emerald-600 bg-emerald-600/5">
          <CardContent className="p-3 text-center space-y-1">
            <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-semibold uppercase block">Completed</span>
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-300">{totalCompletedCourses}</span>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-l-4 border-l-amber-500 bg-amber-500/5">
          <CardContent className="p-3 text-center space-y-1">
            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold uppercase block">Pending Requests</span>
            <span className="text-xl font-extrabold text-amber-600 dark:text-amber-300">{totalPendingRequests}</span>
          </CardContent>
        </Card>
      </div>

      {/* Main LMS Workflow Sub-tabs */}
      <Tabs defaultValue="available" className="space-y-4">
        <TabsList className="bg-muted/60 p-1 flex-wrap h-auto">
          <TabsTrigger value="available" className="text-xs px-3 py-1.5 font-semibold">
            Available Courses ({marketplaceCourses.length})
          </TabsTrigger>
          <TabsTrigger value="company" className="text-xs px-3 py-1.5 font-semibold flex items-center gap-1">
            My Company Courses ({companyCourses.length})
          </TabsTrigger>
          <TabsTrigger value="enrollments" className="text-xs px-3 py-1.5 font-semibold">
            Enrollments ({enrollments.length})
          </TabsTrigger>
          <TabsTrigger value="requests" className="text-xs px-3 py-1.5 font-semibold flex items-center gap-1">
            Course Requests
            {totalPendingRequests > 0 && (
              <Badge className="bg-amber-500 text-white text-[9px] px-1.5 py-0.2 ml-1">
                {totalPendingRequests}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs px-3 py-1.5 font-semibold">
            Purchase History ({purchaseHistory.length})
          </TabsTrigger>
        </TabsList>

        {/* 1. AVAILABLE COURSES TAB (MARKETPLACE) */}
        <TabsContent value="available" className="space-y-4">
          <Card className="shadow-2xs overflow-hidden">
            <CardHeader className="py-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b bg-muted/20">
              <div>
                <CardTitle className="text-sm font-bold">Course Marketplace</CardTitle>
                <CardDescription className="text-xs">
                  Browse external & internal catalog courses. HR can view curriculum details and purchase company seats.
                </CardDescription>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search course title or code..."
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
                    <TableHead className="text-xs font-bold">Course Code</TableHead>
                    <TableHead className="text-xs font-bold">Course Title</TableHead>
                    <TableHead className="text-xs font-bold">Provider</TableHead>
                    <TableHead className="text-xs font-bold">Category</TableHead>
                    <TableHead className="text-xs font-bold">Duration</TableHead>
                    <TableHead className="text-xs font-bold">Price / Seat</TableHead>
                    <TableHead className="text-xs font-bold">Certificate</TableHead>
                    <TableHead className="text-xs font-bold text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {marketplaceCourses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-xs text-muted-foreground">
                        No courses available in catalog.
                      </TableCell>
                    </TableRow>
                  ) : (
                    marketplaceCourses.map((c) => (
                      <TableRow key={c.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="text-xs font-mono font-bold text-primary">{c.code}</TableCell>
                        <TableCell className="text-xs">
                          <div>
                            <span className="font-semibold text-foreground">{c.title}</span>
                            <span className="block text-[10px] text-muted-foreground">Instructor: {c.instructor}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-medium">{c.provider}</TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="outline" className="text-[10px]">{c.category}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">{c.durationHours} Hours</TableCell>
                        <TableCell className="text-xs font-mono font-bold text-foreground">
                          {companyCourses.some((cc) => cc.courseId === c.id && cc.availableSeats > 0) ? (
                            <Badge variant="default" className="text-[9px] bg-emerald-600">Company Access Available</Badge>
                          ) : (
                            `₹${c.pricePerSeat.toLocaleString()}`
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                            Included ✓
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setViewingCourse(c)}
                              className="h-7 text-xs gap-1"
                            >
                              <Eye className="h-3.5 w-3.5" /> View
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRequestingCourse(c)}
                              className="h-7 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10 font-semibold"
                            >
                              <FileText className="h-3.5 w-3.5" /> Request Course
                            </Button>

                            <Button
                              size="sm"
                              onClick={() => setPurchasingCourse(c)}
                              className="h-7 text-xs gap-1 bg-primary text-primary-foreground font-semibold"
                            >
                              <ShoppingCart className="h-3.5 w-3.5" /> Purchase
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteMarketplaceCourse(c.id)}
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              title="Delete Course Entry"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. MY COMPANY COURSES TAB (SEAT LEDGER) */}
        <TabsContent value="company" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-card rounded-xl border shadow-2xs">
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" /> Company Licensed Course Library
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Manage purchased enterprise licenses, allocate seats to employees, and monitor completion progress
              </p>
            </div>
            <Button
              onClick={() => setIsAddCompanyCourseOpen(true)}
              className="gap-1.5 text-xs bg-primary text-primary-foreground font-semibold shadow-xs"
            >
              <Plus className="h-4 w-4" /> Add Company Course
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {effectiveCompanyCourses.map((cc) => (
              <Card key={cc.courseId} className="border shadow-2xs hover:shadow-sm transition-all">
                <CardHeader className="py-3 px-4 border-b bg-muted/20 flex flex-row items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{cc.title}</span>
                      <Badge variant="outline" className="font-mono text-[10px]">{cc.courseCode}</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Provider: {cc.provider}</p>
                  </div>
                  <Badge variant="default" className="text-[10px] bg-emerald-600">
                    {cc.status}
                  </Badge>
                </CardHeader>

                <CardContent className="p-4 space-y-4 text-xs">
                  {/* Seat Ledger Rule Display */}
                  <div className="grid grid-cols-5 gap-1 text-center p-3 rounded-xl bg-muted/30 border font-mono">
                    <div>
                      <span className="text-[9px] text-muted-foreground block font-sans">Purchased</span>
                      <strong className="text-sm font-extrabold text-foreground">{cc.purchasedSeats}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-muted-foreground block font-sans">Assigned</span>
                      <strong className="text-sm font-extrabold text-primary">{cc.assignedSeats}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-muted-foreground block font-sans">Available</span>
                      <strong className="text-sm font-extrabold text-emerald-600">{cc.availableSeats}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-muted-foreground block font-sans">In Progress</span>
                      <strong className="text-sm font-extrabold text-amber-600">{cc.inProgressCount}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-muted-foreground block font-sans">Completed</span>
                      <strong className="text-sm font-extrabold text-indigo-600">{cc.completedCount}</strong>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground font-mono">
                    Rule Math: Purchased ({cc.purchasedSeats}) = Assigned ({cc.assignedSeats}) + Available ({cc.availableSeats})
                  </p>

                  {/* Actions Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                    <Button
                      size="sm"
                      onClick={() => setEnrollingCompanyCourse(cc)}
                      className="gap-1.5 text-xs bg-primary text-primary-foreground font-semibold"
                    >
                      <Users className="h-3.5 w-3.5" /> Enroll Employees
                    </Button>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPurchasingMoreSeatsCourse(cc)}
                        className="gap-1 text-xs text-primary border-primary/30"
                      >
                        <Plus className="h-3.5 w-3.5" /> Purchase More Seats
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewingCompanyCourse(cc)} className="text-xs cursor-pointer">
                            <Eye className="h-3.5 w-3.5 mr-1.5" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setManagingSeatsCompanyCourse(cc)} className="text-xs cursor-pointer">
                            <Layers className="h-3.5 w-3.5 mr-1.5" /> Manage Seats
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeletingCompanyCourse(cc)}
                            className="text-xs cursor-pointer text-destructive font-semibold"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete Course Entry
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 3. ENROLLMENTS TAB (PROGRESS & ASSESSMENT TRACKER) */}
        <TabsContent value="enrollments" className="space-y-4">
          <Card className="shadow-2xs overflow-hidden">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b bg-muted/20">
              <div>
                <CardTitle className="text-sm font-bold">Active Employee Enrollments ({enrollments.length})</CardTitle>
                <CardDescription className="text-xs">
                  Track student course progress %, assessment scores, pass/fail status, and certificate issuance.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="text-xs font-bold">Employee</TableHead>
                    <TableHead className="text-xs font-bold">Course Title</TableHead>
                    <TableHead className="text-xs font-bold">Assigned Date</TableHead>
                    <TableHead className="text-xs font-bold">Progress %</TableHead>
                    <TableHead className="text-xs font-bold">Score</TableHead>
                    <TableHead className="text-xs font-bold">Status</TableHead>
                    <TableHead className="text-xs font-bold text-right">Actions & Simulator</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((enr) => (
                    <TableRow key={enr.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="text-xs font-semibold">
                        {enr.employeeName}
                        <span className="block text-[10px] text-muted-foreground font-mono">{enr.employeeId} • {enr.department}</span>
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="font-semibold text-foreground">{enr.courseTitle}</span>
                        <span className="block text-[10px] text-muted-foreground font-mono">{enr.courseCode}</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">{enr.assignedDate}</TableCell>
                      <TableCell className="text-xs w-36">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span>{enr.progress}%</span>
                          </div>
                          <Progress value={enr.progress} className="h-1.5 bg-muted" />
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {enr.assessmentScore !== undefined ? (
                          <Badge variant={enr.assessmentPassed ? 'default' : 'destructive'} className="text-[10px]">
                            {enr.assessmentScore}% ({enr.assessmentPassed ? 'Passed' : 'Failed'})
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">Not Attempted</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        <StatusBadge status={enr.status === 'Completed' ? 'ACTIVE' : enr.status} className="text-[10px]" />
                      </TableCell>
                      <TableCell className="text-xs text-right space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSimulateProgress(enr.id, 100)}
                          className="h-6 text-[10px]"
                        >
                          100% Complete
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSimulateAssessment(enr.id, 86)}
                          className="h-6 text-[10px] text-emerald-600"
                        >
                          Pass (86%)
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSimulateAssessment(enr.id, 48)}
                          className="h-6 text-[10px] text-destructive"
                        >
                          Fail (48%)
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteEnrollment(enr.id)}
                          className="h-6 w-6 text-destructive hover:bg-destructive/10 inline-flex"
                          title="Delete Enrollment Entry"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. COURSE REQUESTS TAB (EMPLOYEE REQUEST WORKFLOW) */}
        <TabsContent value="requests" className="space-y-4">
          <Card className="shadow-2xs overflow-hidden">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b bg-muted/20">
              <div>
                <CardTitle className="text-sm font-bold">Employee Course Requests</CardTitle>
                <CardDescription className="text-xs">
                  Review employee training requests. Approve using existing company seats or purchase new seats.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="text-xs font-bold">Employee</TableHead>
                    <TableHead className="text-xs font-bold">Requested Course</TableHead>
                    <TableHead className="text-xs font-bold">Provider</TableHead>
                    <TableHead className="text-xs font-bold">Price / Seat</TableHead>
                    <TableHead className="text-xs font-bold">Priority</TableHead>
                    <TableHead className="text-xs font-bold">Status</TableHead>
                    <TableHead className="text-xs font-bold text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courseRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-xs text-muted-foreground">
                        <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                        <p className="font-semibold text-foreground">No course requests found.</p>
                        <p className="text-[11px]">Employee course requests submitted for approval will appear here.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    courseRequests.map((req) => {
                      const isPending = req.status?.toLowerCase() === 'pending';
                      const isApproved = req.status?.toLowerCase() === 'approved';
                      const isRejected = req.status?.toLowerCase() === 'rejected';
                      const empName = req.employeeName || (req.employee ? `${req.employee.firstName} ${req.employee.lastName}`.trim() : 'Employee');
                      const empDept = req.department || req.employee?.department || 'Operations';
                      const title = req.courseTitle || (req as any).requestedCourseTitle || 'Course';
                      const price = req.pricePerSeat ?? (req as any).requestedPrice ?? 0;

                      return (
                        <TableRow key={req.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="text-xs font-semibold">
                            {empName}
                            <span className="block text-[10px] text-muted-foreground font-mono">{empDept}</span>
                          </TableCell>
                          <TableCell className="text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-foreground">{title}</span>
                              {req.courseUrl || req.url ? (
                                <a
                                  href={(() => {
                                    const u = req.courseUrl || req.url || '';
                                    return u.startsWith('http://') || u.startsWith('https://') ? u : `https://${u}`;
                                  })()}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:text-primary/70 shrink-0 inline-flex items-center"
                                  title={req.courseUrl || req.url}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              ) : null}
                            </div>
                            <span className="block text-[10px] text-muted-foreground line-clamp-1">{req.reason}</span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{req.provider}</TableCell>
                          <TableCell className="text-xs font-mono font-bold">₹{Number(price).toLocaleString()}</TableCell>
                          <TableCell className="text-xs">
                            <Badge variant={req.priority === 'High' ? 'destructive' : 'secondary'} className="text-[10px]">
                              {req.priority}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            <Badge
                              variant={isApproved ? 'default' : isRejected ? 'destructive' : 'outline'}
                              className={`text-[10px] ${isPending ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' : ''}`}
                            >
                              {isPending ? 'Pending HR Approval' : isApproved ? 'Approved' : isRejected ? 'Rejected' : req.status} {req.approvedSeatType ? `(${req.approvedSeatType})` : ''}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isPending ? (
                                <Button
                                  size="sm"
                                  onClick={() => setReviewingRequest(req)}
                                  className="h-7 text-xs gap-1 bg-primary text-primary-foreground font-semibold"
                                >
                                  <FileText className="h-3.5 w-3.5" /> Review
                                </Button>
                              ) : (
                                <span className="text-muted-foreground text-[11px]">Processed</span>
                              )}

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteCourseRequest(req.id)}
                                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                title="Delete Request Entry"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. PURCHASE HISTORY TAB (ORDER LOGS) */}
        <TabsContent value="history" className="space-y-4">
          <Card className="shadow-2xs overflow-hidden">
            <CardHeader className="py-3 px-4 border-b bg-muted/20">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <span>Course Purchase & License Order Logs</span>
                <Badge variant="outline" className="font-mono text-xs font-bold">
                  {purchaseHistory.length}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Audit history of all enterprise seat orders, billing entities, cost centers, and GST invoices.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0">
              {purchaseHistory.length === 0 ? (
                <div className="p-12 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    <ShoppingCart className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-foreground">No Purchase History</h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Course purchases and license orders will appear here after a company course is purchased.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      const firstMarket = marketplaceCourses[0];
                      if (firstMarket) setPurchasingCourse(firstMarket);
                    }}
                    className="gap-1.5 text-xs bg-primary text-primary-foreground font-semibold shadow-xs"
                  >
                    <ShoppingCart className="h-4 w-4" /> Browse & Purchase Courses
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="text-xs font-bold">Order ID</TableHead>
                      <TableHead className="text-xs font-bold">Course Title</TableHead>
                      <TableHead className="text-xs font-bold">Seats</TableHead>
                      <TableHead className="text-xs font-bold">Unit Price</TableHead>
                      <TableHead className="text-xs font-bold">Subtotal</TableHead>
                      <TableHead className="text-xs font-bold">GST (18%)</TableHead>
                      <TableHead className="text-xs font-bold">Total Paid</TableHead>
                      <TableHead className="text-xs font-bold">Billing Entity</TableHead>
                      <TableHead className="text-xs font-bold">Date & Time</TableHead>
                      <TableHead className="text-xs font-bold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseHistory.map((ord) => (
                      <TableRow key={ord.orderId} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="text-xs font-mono font-bold text-primary">{ord.orderId}</TableCell>
                        <TableCell className="text-xs font-semibold">{ord.courseTitle}</TableCell>
                        <TableCell className="text-xs font-mono font-bold">{ord.seatsPurchased} Seats</TableCell>
                        <TableCell className="text-xs font-mono">₹{ord.pricePerSeat.toLocaleString()}</TableCell>
                        <TableCell className="text-xs font-mono">₹{ord.subtotal.toLocaleString()}</TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">₹{ord.gst.toLocaleString()}</TableCell>
                        <TableCell className="text-xs font-mono font-bold text-primary">₹{ord.totalAmount.toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{ord.billingEntity} ({ord.costCenter})</TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">{ord.purchasedAt}</TableCell>
                        <TableCell className="text-xs text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Badge variant="default" className="text-[10px] bg-emerald-600">
                              {ord.status}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toast.success(`✓ Downloaded Invoice Receipt for Order ${ord.orderId} (₹${ord.totalAmount.toLocaleString()})`)}
                              className="h-6 text-[10px] gap-1 border-primary/30 text-primary hover:bg-primary/10"
                            >
                              <Download className="h-3 w-3" /> Invoice
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeletePurchaseRecord(ord.orderId)}
                              className="h-6 w-6 text-destructive hover:bg-destructive/10"
                              title="Delete Order Log"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
