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
import {
  MARKETPLACE_COURSES,
  INITIAL_COMPANY_COURSES,
  INITIAL_COURSE_ENROLLMENTS,
  INITIAL_COURSE_REQUESTS,
  INITIAL_PURCHASE_HISTORY,
  type MarketplaceCourse,
  type CompanyCourse,
  type CourseEnrollment,
  type CourseRequest,
  type PurchaseHistoryRecord,
} from './mockTrainingData';
import {
  ViewCourseModal,
  PurchaseCourseModal,
  EnrollEmployeesModal,
  ReviewCourseRequestModal,
  PurchaseMoreSeatsModal,
  EmployeeRequestCourseModal,
} from './CourseCatalogModals';
import { notificationStore } from '@/utils/notificationStore';
import { useAuthStore } from '@/stores/auth-store';
import { isHrOrAdminUser } from '@/lib/modules';

export function CourseCatalogTab() {
  const user = useAuthStore((s) => s.user);
  const isHrOrAdmin = isHrOrAdminUser(user);
  // ① LocalStorage State Management
  const [marketplaceCourses] = useState<MarketplaceCourse[]>(MARKETPLACE_COURSES);

  const [companyCourses, setCompanyCourses] = useState<CompanyCourse[]>(() => {
    const saved = localStorage.getItem('ehcm_company_courses');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse company courses', e);
      }
    }
    return INITIAL_COMPANY_COURSES;
  });

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

  const [courseRequests, setCourseRequests] = useState<CourseRequest[]>(() => {
    const saved = localStorage.getItem('ehcm_course_requests');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse course requests', e);
      }
    }
    return INITIAL_COURSE_REQUESTS;
  });

  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistoryRecord[]>(() => {
    const saved = localStorage.getItem('ehcm_purchase_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse purchase history', e);
      }
    }
    return INITIAL_PURCHASE_HISTORY;
  });

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('ehcm_company_courses', JSON.stringify(companyCourses));
  }, [companyCourses]);

  useEffect(() => {
    localStorage.setItem('ehcm_course_enrollments', JSON.stringify(enrollments));
  }, [enrollments]);

  useEffect(() => {
    localStorage.setItem('ehcm_course_requests', JSON.stringify(courseRequests));
  }, [courseRequests]);

  useEffect(() => {
    localStorage.setItem('ehcm_purchase_history', JSON.stringify(purchaseHistory));
  }, [purchaseHistory]);

  // Active Modals State
  const [viewingCourse, setViewingCourse] = useState<MarketplaceCourse | null>(null);
  const [purchasingCourse, setPurchasingCourse] = useState<MarketplaceCourse | null>(null);
  const [enrollingCompanyCourse, setEnrollingCompanyCourse] = useState<CompanyCourse | null>(null);
  const [reviewingRequest, setReviewingRequest] = useState<CourseRequest | null>(null);
  const [purchasingMoreSeatsCourse, setPurchasingMoreSeatsCourse] = useState<CompanyCourse | null>(null);
  const [requestingCourse, setRequestingCourse] = useState<MarketplaceCourse | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [enrollmentCourseFilter, setEnrollmentCourseFilter] = useState('All');

  // KPI Calculations
  const totalAvailableMarketplace = marketplaceCourses.length;
  const totalCompanyCourses = companyCourses.length;
  const totalPurchasedSeats = companyCourses.reduce((acc, c) => acc + c.purchasedSeats, 0);
  const totalAvailableSeats = companyCourses.reduce((acc, c) => acc + c.availableSeats, 0);
  const totalActiveEnrollments = enrollments.filter((e) => e.status === 'In Progress' || e.status === 'Not Started').length;
  const totalCompletedCourses = enrollments.filter((e) => e.status === 'Completed').length;
  const totalPendingRequests = courseRequests.filter((r) => r.status === 'Pending').length;

  // ① Handler: Purchase New Course
  const handleConfirmPurchase = (order: PurchaseHistoryRecord, seatsCount: number) => {
    const updatedHistory = [order, ...purchaseHistory];
    setPurchaseHistory(updatedHistory);

    const existingCourse = companyCourses.find((c) => c.courseId === order.courseId);
    let updatedCompanyCourses: CompanyCourse[];

    if (existingCourse) {
      updatedCompanyCourses = companyCourses.map((c) => {
        if (c.courseId === order.courseId) {
          const newPurchased = c.purchasedSeats + seatsCount;
          const newAvailable = c.availableSeats + seatsCount;
          return {
            ...c,
            purchasedSeats: newPurchased,
            availableSeats: newAvailable,
          };
        }
        return c;
      });
    } else {
      const marketCourse = marketplaceCourses.find((m) => m.id === order.courseId);
      const newCompCourse: CompanyCourse = {
        courseId: order.courseId,
        courseCode: order.courseCode,
        title: order.courseTitle,
        provider: order.provider,
        category: marketCourse?.category || 'Technical',
        purchasedSeats: seatsCount,
        assignedSeats: 0,
        availableSeats: seatsCount,
        inProgressCount: 0,
        completedCount: 0,
        status: 'ACTIVE',
        purchasedAt: new Date().toLocaleDateString(),
      };
      updatedCompanyCourses = [newCompCourse, ...companyCourses];
    }

    setCompanyCourses(updatedCompanyCourses);
  };

  // ② Handler: Enroll Selected Employees
  const handleConfirmEnrollment = (
    courseId: string,
    enrolledEmpIds: string[],
    notifyPortal: boolean,
    notifyEmail: boolean
  ) => {
    const targetCompCourse = companyCourses.find((c) => c.courseId === courseId);
    if (!targetCompCourse) return;

    const count = enrolledEmpIds.length;

    // Update Seat math: Available = Available - count, Assigned = Assigned + count
    const updatedCompCourses = companyCourses.map((c) => {
      if (c.courseId === courseId) {
        return {
          ...c,
          assignedSeats: c.assignedSeats + count,
          availableSeats: c.availableSeats - count,
        };
      }
      return c;
    });
    setCompanyCourses(updatedCompCourses);

    // Create Enrollment records
    const newEnrollments: CourseEnrollment[] = enrolledEmpIds.map((empId, idx) => {
      const mockEmpName = `Employee ${empId}`;
      return {
        id: `ENR-${Date.now()}-${idx}`,
        employeeId: empId,
        employeeName: mockEmpName,
        department: 'Operations',
        courseId: targetCompCourse.courseId,
        courseCode: targetCompCourse.courseCode,
        courseTitle: targetCompCourse.title,
        assignedDate: new Date().toLocaleDateString(),
        progress: 0,
        status: 'Not Started',
        certificateIssued: false,
      };
    });

    setEnrollments([...newEnrollments, ...enrollments]);

    // Dispatch Notifications & Email logs
    if (notifyPortal) {
      const portalNotifs = enrolledEmpIds.map((empId) => ({
        type: 'TRAINING' as const,
        employeeId: empId,
        employeeName: `Employee ${empId}`,
        title: `New Course Assigned: ${targetCompCourse.title}`,
        message: `You have been enrolled in ${targetCompCourse.title} by EHCM HR. Log in to start your course learning.`,
        programId: targetCompCourse.courseId,
        programCode: targetCompCourse.courseCode,
        actionUrl: '/learning/course-catalog',
        sender: 'EHCM L&D Team',
      }));
      notificationStore.addNotifications(portalNotifs);
    }

    if (notifyEmail) {
      notificationStore.addEmailDispatchLog({
        programId: targetCompCourse.courseId,
        programCode: targetCompCourse.courseCode,
        programName: targetCompCourse.title,
        recipientCount: count,
        recipients: enrolledEmpIds.map((empId) => ({
          name: `Employee ${empId}`,
          email: `${empId.toLowerCase()}@codigix.com`,
        })),
        subject: `New Course Assigned – ${targetCompCourse.title}`,
        body: `You have been enrolled in ${targetCompCourse.title} by EHCM Technologies Pvt Ltd.`,
        status: 'SENT',
        senderName: 'EHCM L&D HR Team',
      });
    }
  };

  // ③ Handler: Course Request Approval (Approve & Purchase vs Approve Existing vs Reject)
  const handleApprovePurchaseRequest = (req: CourseRequest) => {
    const marketCourse = marketplaceCourses.find((m) => m.id === req.courseId);
    if (marketCourse) {
      // Update request status
      const updatedReqs = courseRequests.map((r) =>
        r.id === req.id ? { ...r, status: 'Approved' as const, approvedSeatType: 'New Purchase' as const } : r
      );
      setCourseRequests(updatedReqs);
      setReviewingRequest(null);
      // Open Purchase Modal for 1 seat
      setPurchasingCourse(marketCourse);
    }
  };

  const handleApproveExistingSeatRequest = (req: CourseRequest) => {
    const existingCompCourse = companyCourses.find((c) => c.courseId === req.courseId);

    if (!existingCompCourse || existingCompCourse.availableSeats <= 0) {
      toast.error('No available seats remaining in existing course library. Please click "Approve & Purchase" instead.');
      return;
    }

    // Decrement available seat, increment assigned seat
    const updatedCompCourses = companyCourses.map((c) => {
      if (c.courseId === req.courseId) {
        return {
          ...c,
          assignedSeats: c.assignedSeats + 1,
          availableSeats: c.availableSeats - 1,
        };
      }
      return c;
    });
    setCompanyCourses(updatedCompCourses);

    // Create Enrollment for Employee
    const newEnrollment: CourseEnrollment = {
      id: `ENR-${Date.now()}`,
      employeeId: req.employeeId,
      employeeName: req.employeeName,
      department: req.department,
      courseId: req.courseId,
      courseCode: existingCompCourse.courseCode,
      courseTitle: req.courseTitle,
      assignedDate: new Date().toLocaleDateString(),
      progress: 0,
      status: 'Not Started',
      certificateIssued: false,
    };
    setEnrollments([newEnrollment, ...enrollments]);

    // Update Request Status
    const updatedReqs = courseRequests.map((r) =>
      r.id === req.id ? { ...r, status: 'Approved' as const, approvedSeatType: 'Existing Seat' as const } : r
    );
    setCourseRequests(updatedReqs);
    setReviewingRequest(null);

    // Notify Employee
    notificationStore.addNotifications([
      {
        type: 'TRAINING',
        employeeId: req.employeeId,
        employeeName: req.employeeName,
        title: `Course Request Approved: ${req.courseTitle}`,
        message: `Your request for ${req.courseTitle} was approved using existing company seats! You can now start learning.`,
        programId: req.courseId,
        actionUrl: '/learning/course-catalog',
        sender: 'EHCM L&D Team',
      },
    ]);

    toast.success(`✓ Course Request Approved! 1 existing seat assigned to ${req.employeeName}.`);
  };

  const handleRejectRequest = (req: CourseRequest, reason: string) => {
    const updatedReqs = courseRequests.map((r) =>
      r.id === req.id ? { ...r, status: 'Rejected' as const, rejectionReason: reason } : r
    );
    setCourseRequests(updatedReqs);

    // Notify Employee of Rejection
    notificationStore.addNotifications([
      {
        type: 'TRAINING',
        employeeId: req.employeeId,
        employeeName: req.employeeName,
        title: `Course Request Update: ${req.courseTitle}`,
        message: `Your request for ${req.courseTitle} was not approved. Reason: ${reason}`,
        programId: req.courseId,
        actionUrl: '/learning/course-catalog',
        sender: 'EHCM L&D Team',
      },
    ]);

    toast.success(`Course request for ${req.employeeName} rejected.`);
  };

  // Handler: Employee Submits Course Request
  const handleEmployeeSubmitRequest = (reqData: {
    courseId: string;
    courseTitle: string;
    provider: string;
    pricePerSeat: number;
    reason: string;
    businessBenefit: string;
    priority: 'High' | 'Medium' | 'Low';
  }) => {
    const newReq: CourseRequest = {
      id: `CRQ-2026-${Math.floor(100 + Math.random() * 900)}`,
      employeeId: 'EMP-1483',
      employeeName: 'Sanika Shelke',
      department: 'Administration',
      ...reqData,
      requestedAt: new Date().toLocaleDateString(),
      status: 'Pending',
    };

    const updated = [newReq, ...courseRequests];
    setCourseRequests(updated);

    // Notify HR
    notificationStore.addNotifications([
      {
        type: 'TRAINING',
        employeeId: 'EMP-ADMIN',
        employeeName: 'HR Admin',
        title: `New Course Request: ${reqData.courseTitle}`,
        message: `Sanika Shelke requested ${reqData.courseTitle} (Priority: ${reqData.priority}). Click to review in Course Requests.`,
        programId: reqData.courseId,
        actionUrl: '/learning/course-catalog',
        sender: 'Employee Self-Service Portal',
      },
    ]);
  };

  // ④ Handler: Purchase Additional Seats
  const handleConfirmAdditionalSeats = (courseId: string, additionalSeats: number, totalAmount: number) => {
    const updatedCompCourses = companyCourses.map((c) => {
      if (c.courseId === courseId) {
        return {
          ...c,
          purchasedSeats: c.purchasedSeats + additionalSeats,
          availableSeats: c.availableSeats + additionalSeats,
        };
      }
      return c;
    });
    setCompanyCourses(updatedCompCourses);

    // Add Record to Purchase History
    const targetComp = companyCourses.find((c) => c.courseId === courseId);
    if (targetComp) {
      const newOrder: PurchaseHistoryRecord = {
        orderId: `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        courseId: targetComp.courseId,
        courseCode: targetComp.courseCode,
        courseTitle: targetComp.title,
        provider: targetComp.provider,
        seatsPurchased: additionalSeats,
        pricePerSeat: 2500,
        subtotal: additionalSeats * 2500,
        gst: Math.round(additionalSeats * 2500 * 0.18),
        totalAmount,
        billingEntity: 'EHCM Technologies Pvt Ltd',
        costCenter: 'HR-L&D',
        purchasedAt: new Date().toLocaleString(),
        status: 'PAID',
      };
      setPurchaseHistory([newOrder, ...purchaseHistory]);
    }
  };

  // ⑤ Simulator Handlers for Enrollments
  const handleSimulateProgress = (enrId: string, newProgress: number) => {
    const updated = enrollments.map((e) => {
      if (e.id === enrId) {
        const isComplete = newProgress === 100;
        return {
          ...e,
          progress: newProgress,
          status: isComplete ? ('In Progress' as const) : newProgress > 0 ? ('In Progress' as const) : ('Not Started' as const),
        };
      }
      return e;
    });
    setEnrollments(updated);
    toast.success(`Updated enrollment progress to ${newProgress}%`);
  };

  const handleSimulateAssessment = (enrId: string, score: number) => {
    const passed = score >= 60;
    const updated = enrollments.map((e) => {
      if (e.id === enrId) {
        return {
          ...e,
          progress: 100,
          assessmentScore: score,
          assessmentPassed: passed,
          status: passed ? ('Completed' as const) : ('Failed' as const),
          certificateIssued: passed,
        };
      }
      return e;
    });
    setEnrollments(updated);
    if (passed) {
      toast.success(`✓ Assessment Passed (${score}%)! Certificate generated.`);
    } else {
      toast.error(`Assessment Failed (${score}%). Retake enabled.`);
    }
  };

  const handleDirectSelfEnroll = (course: MarketplaceCourse) => {
    const targetComp = companyCourses.find((cc) => cc.courseId === course.id);
    if (!targetComp || targetComp.availableSeats <= 0) {
      toast.error('No available seats currently remaining for this course.');
      return;
    }

    const alreadyEnrolled = enrollments.some(
      (e) => (e.employeeId === user?.id || e.employeeId === 'EMP-1483') && e.courseId === course.id
    );
    if (alreadyEnrolled) {
      toast.info('You are already enrolled in this course! Check Employee Learning Hub.');
      return;
    }

    const updatedCompCourses = companyCourses.map((c) => {
      if (c.courseId === course.id) {
        return {
          ...c,
          assignedSeats: c.assignedSeats + 1,
          availableSeats: c.availableSeats - 1,
        };
      }
      return c;
    });
    setCompanyCourses(updatedCompCourses);

    const newEnrollment: CourseEnrollment = {
      id: `ENR-${Date.now()}`,
      employeeId: user?.id || 'EMP-1483',
      employeeName: user?.name || 'Sanika Shelke',
      department: user?.departmentName || 'Administration',
      courseId: course.id,
      courseCode: course.code,
      courseTitle: course.title,
      assignedDate: new Date().toLocaleDateString(),
      progress: 0,
      status: 'Not Started',
      certificateIssued: false,
    };
    setEnrollments([newEnrollment, ...enrollments]);

    notificationStore.addNotifications([
      {
        type: 'TRAINING',
        employeeId: user?.id || 'EMP-1483',
        employeeName: user?.name || 'Sanika Shelke',
        title: `Enrolled: ${course.title}`,
        message: `You have successfully enrolled in ${course.title}! Open Employee Learning Hub to start your course.`,
        programId: course.id,
        actionUrl: '/learning/employee-learning',
        sender: 'EHCM Learning System',
      },
    ]);

    toast.success(`✓ Enrolled in ${course.title}! Added to Employee Learning Hub.`);
  };

  // ─────────────────────────────────────────────────────────────
  // EMPLOYEE VIEW (When user is not HR / Admin)
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

        {/* Employee Course Catalog Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-purple-500/5 to-card border shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                Course Catalog
              </h1>
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30 font-semibold">
                Employee Marketplace
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Browse available enterprise courses, view curriculum, enroll in company-accessible courses, or request new training
            </p>
          </div>
        </div>

        {/* Filter Bar */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {marketplaceCourses
            .filter((c) => {
              if (searchQuery) {
                const q = searchQuery.toLowerCase();
                if (!c.title.toLowerCase().includes(q) && !c.code.toLowerCase().includes(q) && !c.provider.toLowerCase().includes(q)) return false;
              }
              if (categoryFilter !== 'All' && c.category !== categoryFilter) return false;
              return true;
            })
            .map((c) => {
              const matchingComp = companyCourses.find((cc) => cc.courseId === c.id);
              const hasCompanySeats = matchingComp && matchingComp.availableSeats > 0;
              const isEnrolled = enrollments.some(
                (e) => (e.employeeId === user?.id || e.employeeId === 'EMP-1483') && e.courseId === c.id
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
                          Company Access Available
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] font-mono">
                          ₹{c.pricePerSeat.toLocaleString()} / Seat
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
                      <Eye className="h-3.5 w-3.5" /> View
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

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              Enterprise Course Catalog & Seat Management
            </h1>
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
              LMS License Hub
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Company course library purchasing, seat allocation ledger, employee enrollments & course requests
          </p>
        </div>

        <Button
          onClick={() => {
            const firstMarket = marketplaceCourses[0];
            if (firstMarket) setPurchasingCourse(firstMarket);
          }}
          className="gap-1.5 text-xs bg-primary text-primary-foreground font-semibold"
        >
          <ShoppingCart className="h-4 w-4" /> Browse & Purchase Courses
        </Button>
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
                  {marketplaceCourses.map((c) => (
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
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. MY COMPANY COURSES TAB (SEAT LEDGER) */}
        <TabsContent value="company" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {companyCourses.map((cc) => (
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
                          <DropdownMenuItem className="text-xs cursor-pointer">
                            <Eye className="h-3.5 w-3.5 mr-1.5" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-xs cursor-pointer">
                            <Layers className="h-3.5 w-3.5 mr-1.5" /> Manage Seats
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-xs cursor-pointer text-destructive">
                            Archive Course
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
                    <TableHead className="text-xs font-bold text-right">Interactive Simulator</TableHead>
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
                  {courseRequests.map((req) => (
                    <TableRow key={req.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="text-xs font-semibold">
                        {req.employeeName}
                        <span className="block text-[10px] text-muted-foreground font-mono">{req.department}</span>
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="font-semibold text-foreground">{req.courseTitle}</span>
                        <span className="block text-[10px] text-muted-foreground line-clamp-1">{req.reason}</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{req.provider}</TableCell>
                      <TableCell className="text-xs font-mono font-bold">₹{req.pricePerSeat.toLocaleString()}</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant={req.priority === 'High' ? 'destructive' : 'secondary'} className="text-[10px]">
                          {req.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant={req.status === 'Approved' ? 'default' : req.status === 'Rejected' ? 'destructive' : 'outline'} className="text-[10px]">
                          {req.status} {req.approvedSeatType ? `(${req.approvedSeatType})` : ''}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        {req.status === 'Pending' ? (
                          <Button
                            size="sm"
                            onClick={() => setReviewingRequest(req)}
                            className="h-7 text-xs gap-1 bg-primary text-primary-foreground"
                          >
                            <FileText className="h-3.5 w-3.5" /> Review Request
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">Processed</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. PURCHASE HISTORY TAB (ORDER LOGS) */}
        <TabsContent value="history" className="space-y-4">
          <Card className="shadow-2xs overflow-hidden">
            <CardHeader className="py-3 px-4 border-b bg-muted/20">
              <CardTitle className="text-sm font-bold">Course Purchase & License Order Logs</CardTitle>
              <CardDescription className="text-xs">
                Audit history of all enterprise seat orders, billing entities, cost centers, and GST invoices.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0">
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
                    <TableHead className="text-xs font-bold text-right">Status</TableHead>
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
                        <Badge variant="default" className="text-[10px] bg-emerald-600">
                          {ord.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
