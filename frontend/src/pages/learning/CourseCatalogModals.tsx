import { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  Users,
  Building2,
  DollarSign,
  FileText,
  Star,
  Clock,
  Award,
  Layers,
  Sparkles,
  CheckSquare,
  Search,
  Check,
  X,
  CreditCard,
  ShieldCheck,
  Send,
  Bell,
  Mail,
  Plus,
  RefreshCw,
  Trash2,
  Loader2,
  ExternalLink,
  Globe,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { notificationStore } from '@/utils/notificationStore';
import { employeesApi } from '@/api/employees';
import { useAuthStore } from '@/stores/auth-store';
import type {
  MarketplaceCourse,
  CompanyCourse,
  CourseRequest,
  PurchaseHistoryRecord,
} from './types';

// ① View Course Details Modal
interface ViewCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: MarketplaceCourse | null;
  onPurchaseSeats: (course: MarketplaceCourse) => void;
}

export function ViewCourseModal({
  isOpen,
  onClose,
  course,
  onPurchaseSeats,
}: ViewCourseModalProps) {
  if (!course) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <DialogTitle className="text-base font-bold">{course.title}</DialogTitle>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {course.code}
            </Badge>
          </div>
          <DialogDescription className="text-xs">
            Provider: <strong>{course.provider}</strong> • Instructor: <strong>{course.instructor}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Key Course Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-primary/5 border border-primary/20 text-center">
            <div>
              <span className="text-[10px] text-muted-foreground block font-medium">Price per Seat</span>
              <strong className="text-sm font-extrabold text-primary">₹{course.pricePerSeat.toLocaleString()}</strong>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block font-medium">Duration</span>
              <strong className="text-foreground text-xs">{course.durationHours} Hours</strong>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block font-medium">Rating</span>
              <strong className="text-amber-600 dark:text-amber-400 text-xs flex items-center justify-center gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {course.rating} / 5
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block font-medium">Level</span>
              <strong className="text-foreground text-xs">{course.difficulty}</strong>
            </div>
          </div>

          {/* Description */}
          <div className="p-3 rounded-lg bg-muted/30 border space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground block">Course Description:</span>
            <p className="text-foreground leading-relaxed">{course.description}</p>
          </div>

          {/* Modules Outline */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-muted-foreground">
              <Layers className="h-3.5 w-3.5 text-primary" /> Modules & Curriculum Outline ({course.modules?.length || 0})
            </Label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto p-2 bg-background border rounded-lg">
              {(course.modules || []).map((m, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded bg-muted/40 text-xs">
                  <span className="font-semibold text-foreground">{m.title}</span>
                  <Badge variant="secondary" className="text-[10px] font-mono">{m.duration}</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Certificate & Assessment Tags */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 text-xs text-muted-foreground">
            <span>Assessment: <strong className="text-foreground">{course.assessmentIncluded ? 'Included (Passing Score: 60%)' : 'None'}</strong></span>
            <span>Certificate: <strong className="text-foreground">{course.certificateIncluded ? 'Included' : 'None'}</strong></span>
          </div>
        </div>

        <DialogFooter className="border-t pt-3 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Back to Catalog
          </Button>

          <Button
            size="sm"
            onClick={() => {
              onClose();
              onPurchaseSeats(course);
            }}
            className="gap-1.5 text-xs bg-primary text-primary-foreground font-semibold"
          >
            <ShoppingCart className="h-4 w-4" /> Purchase Seats
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ② Purchase Course & Seats Modal
interface PurchaseCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: MarketplaceCourse | null;
  onConfirmPurchase: (order: PurchaseHistoryRecord, seats: number) => void;
}

export function PurchaseCourseModal({
  isOpen,
  onClose,
  course,
  onConfirmPurchase,
}: PurchaseCourseModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [seats, setSeats] = useState<number>(1);
  const [billingEntity, setBillingEntity] = useState<string>('EHCM Enterprise Corp');
  const [costCenter, setCostCenter] = useState<string>('L&D');
  const [purchaseReason, setPurchaseReason] = useState<string>('');

  if (!course) return null;

  const unitPrice = course.pricePerSeat;
  const subtotal = seats * unitPrice;
  const gst = Math.round(subtotal * 0.18);
  const totalAmount = subtotal + gst;

  const orderId = `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  const handleProceed = () => {
    if (seats <= 0) {
      toast.error('Please enter at least 1 seat.');
      return;
    }
    setStep(2);
  };

  const handleFinalize = () => {
    const newOrder: PurchaseHistoryRecord = {
      orderId,
      courseId: course.id,
      courseCode: course.code,
      courseTitle: course.title,
      provider: course.provider,
      seatsPurchased: seats,
      pricePerSeat: unitPrice,
      subtotal,
      gst,
      totalAmount,
      billingEntity,
      costCenter,
      purchasedAt: new Date().toLocaleString(),
      status: 'PAID',
    };

    onConfirmPurchase(newOrder, seats);
    setStep(3);
  };

  const handleCloseAll = () => {
    setStep(1);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseAll}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            {step === 1 ? 'PURCHASE COURSE SEATS' : step === 2 ? 'CONFIRM PURCHASE' : '✓ PURCHASE SUCCESSFUL'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {step === 3
              ? `Order ${orderId} confirmed and seats added to company library.`
              : `Purchase company seats for ${course.title} (${course.code}).`}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 py-2 text-xs">
            {/* Course Summary Header */}
            <div className="p-3 rounded-lg bg-muted/40 border space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">{course.title}</span>
                <Badge variant="outline" className="font-mono text-[10px]">{course.code}</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Provider: <strong>{course.provider}</strong> • Price per Seat: <strong>₹{unitPrice.toLocaleString()}</strong>
              </p>
            </div>

            {/* Seats Input & Calculation */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Number of Seats *</Label>
                <Input
                  type="number"
                  min={1}
                  value={seats}
                  onChange={(e) => setSeats(Math.max(1, Number(e.target.value)))}
                  className="text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Billing Entity *</Label>
                <Select value={billingEntity} onValueChange={setBillingEntity}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EHCM Technologies Pvt Ltd">EHCM Technologies Pvt Ltd</SelectItem>
                    <SelectItem value="Codigix Infotech Pvt Ltd">Codigix Infotech Pvt Ltd</SelectItem>
                    <SelectItem value="Codigix Manufacturing Ltd">Codigix Manufacturing Ltd</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Cost Center *</Label>
                <Select value={costCenter} onValueChange={setCostCenter}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HR-L&D">HR-L&D</SelectItem>
                    <SelectItem value="IT-Operations">IT-Operations</SelectItem>
                    <SelectItem value="Manufacturing-EHS">Manufacturing-EHS</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Purchase Reason</Label>
                <Input
                  value={purchaseReason}
                  onChange={(e) => setPurchaseReason(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            {/* Price Math Breakdown */}
            <div className="p-4 rounded-xl border bg-primary/5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Subtotal ({seats} seats @ ₹{unitPrice.toLocaleString()}):</span>
                <span className="font-mono font-bold text-foreground">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">GST (18%):</span>
                <span className="font-mono font-bold text-foreground">₹{gst.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-2 border-t text-primary">
                <span>Total Amount Payable:</span>
                <span className="font-mono">₹{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 py-2 text-xs">
            <div className="p-4 rounded-xl border border-primary/30 bg-card space-y-3 shadow-2xs">
              <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground border-b pb-2">
                Order Summary Review
              </h4>
              <div className="space-y-1.5">
                <p className="text-sm font-bold text-foreground">{course.title}</p>
                <p className="text-muted-foreground">Provider: {course.provider}</p>
                <p className="text-muted-foreground">Seats Selected: <strong className="text-foreground">{seats} Seats</strong></p>
                <p className="text-muted-foreground">Billing Entity: {billingEntity} ({costCenter})</p>
              </div>

              <div className="p-3 rounded-lg bg-muted/40 space-y-1 font-mono text-xs border">
                <div className="flex justify-between"><span>Subtotal:</span> <span>₹{subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>GST (18%):</span> <span>₹{gst.toLocaleString()}</span></div>
                <div className="flex justify-between font-bold text-primary pt-1 border-t text-sm">
                  <span>Total Amount:</span> <span>₹{totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 py-3 text-xs text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-foreground">Course Purchased Successfully!</h3>
              <p className="text-muted-foreground mt-1">
                Order ID: <strong className="font-mono text-foreground">{orderId}</strong>
              </p>
            </div>

            <div className="p-3 rounded-xl border bg-muted/30 text-left space-y-1 font-mono text-xs">
              <p>Seats Purchased: <strong>{seats} Seats</strong></p>
              <p>Total Paid: <strong>₹{totalAmount.toLocaleString()}</strong></p>
              <p>Status: <span className="text-emerald-600 font-bold">PAID</span></p>
            </div>
          </div>
        )}

        <DialogFooter className="border-t pt-3 flex items-center justify-between">
          {step === 1 && (
            <>
              <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
                Cancel
              </Button>
              <Button size="sm" onClick={handleProceed} className="gap-1.5 text-xs bg-primary text-primary-foreground">
                Proceed to Purchase →
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <Button variant="outline" size="sm" onClick={() => setStep(1)} className="text-xs">
                Back
              </Button>
              <Button size="sm" onClick={handleFinalize} className="gap-1.5 text-xs bg-emerald-600 text-white hover:bg-emerald-700">
                <CreditCard className="h-4 w-4" /> Confirm Purchase (₹{totalAmount.toLocaleString()})
              </Button>
            </>
          )}

          {step === 3 && (
            <Button size="sm" onClick={handleCloseAll} className="w-full text-xs bg-primary text-primary-foreground">
              Close & View Company Courses
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ③ Enroll Employees Modal
interface EnrollEmployeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyCourse: CompanyCourse | null;
  existingEnrollments?: CourseEnrollment[];
  allEmployees?: Array<{ id: string; employeeCode?: string; name: string; department: string; designation?: string }>;
  onConfirmEnrollment: (
    courseId: string,
    enrolledEmpIds: string[],
    notifyPortal: boolean,
    notifyEmail: boolean
  ) => void;
}

export function EnrollEmployeesModal({
  isOpen,
  onClose,
  companyCourse,
  existingEnrollments = [],
  allEmployees,
  onConfirmEnrollment,
}: EnrollEmployeesModalProps) {
  const [selectedDept, setSelectedDept] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [notifyPortal, setNotifyPortal] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [isConfirmingStep, setIsConfirmingStep] = useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedEmpIds([]);
      setIsConfirmingStep(false);
      setSearchQuery('');
      setSelectedDept('All');
    }
  }, [isOpen, companyCourse?.id, companyCourse?.courseId]);

  if (!companyCourse) return null;

  const totalPurchased = companyCourse.purchasedSeats > 0 ? companyCourse.purchasedSeats : 25;
  const safeAssigned = Math.min(totalPurchased, Math.max(0, companyCourse.assignedSeats || 0));
  const availableSeats = Math.max(0, totalPurchased - safeAssigned);

  // Set of employee IDs already enrolled in this course
  const enrolledEmpIdsForThisCourse = new Set(
    existingEnrollments
      .filter((e) => e.courseId === companyCourse.courseId || e.courseTitle === companyCourse.title)
      .map((e) => e.employeeId)
  );

  const [dbEmployees, setDbEmployees] = useState<Array<{ id: string; employeeCode?: string; name: string; department: string; designation: string }>>([]);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingEmployees(true);
    employeesApi.list({ pageSize: 1000 })
      .then((res: any) => {
        if (!isMounted) return;
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
          const mapped = rawList.map((e: any) => {
            const firstName = e.firstName || '';
            const lastName = e.lastName || '';
            const fullName = `${firstName} ${lastName}`.trim() || e.name || e.employeeCode || 'Employee';
            const deptName = typeof e.department === 'string' ? e.department : e.department?.name || 'Operations';
            const desigTitle = typeof e.designation === 'string' ? e.designation : e.designation?.title || 'Staff';
            return {
              id: e.id,
              employeeCode: e.employeeCode || e.id,
              name: fullName,
              department: deptName,
              designation: desigTitle,
            };
          });
          setDbEmployees(mapped);
        }
      })
      .catch((err) => {
        console.warn('Failed to load DB employees:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingEmployees(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const employeeList = allEmployees && allEmployees.length > 0 ? allEmployees : dbEmployees;

  // Dynamically extract all unique departments from loaded employees
  const dynamicDepartments = useMemo(() => {
    const depts = new Set<string>();
    employeeList.forEach((emp) => {
      if (emp.department && emp.department.trim()) {
        depts.add(emp.department.trim());
      }
    });
    return Array.from(depts).sort();
  }, [employeeList]);

  const filteredEmployees = employeeList.filter((emp) => {
    if (selectedDept !== 'All' && emp.department !== selectedDept) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      const codeMatch = emp.employeeCode ? emp.employeeCode.toLowerCase().includes(q) : false;
      const desigMatch = emp.designation ? emp.designation.toLowerCase().includes(q) : false;
      return (
        emp.name.toLowerCase().includes(q) ||
        emp.id.toLowerCase().includes(q) ||
        codeMatch ||
        emp.department.toLowerCase().includes(q) ||
        desigMatch
      );
    }
    return true;
  });

  const eligibleEmployees = filteredEmployees.filter(
    (emp) => !enrolledEmpIdsForThisCourse.has(emp.id) && !(emp.employeeCode && enrolledEmpIdsForThisCourse.has(emp.employeeCode))
  );

  const isAllEligibleSelected =
    eligibleEmployees.length > 0 && eligibleEmployees.every((emp) => selectedEmpIds.includes(emp.id));

  const handleToggleSelectAll = () => {
    if (isAllEligibleSelected) {
      const eligibleSet = new Set(eligibleEmployees.map((e) => e.id));
      setSelectedEmpIds((prev) => prev.filter((id) => !eligibleSet.has(id)));
    } else {
      const maxToSelect = availableSeats;
      const toSelect = eligibleEmployees.slice(0, maxToSelect).map((e) => e.id);
      if (eligibleEmployees.length > maxToSelect) {
        toast.info(`Selected ${maxToSelect} eligible employees based on available seats.`);
      }
      setSelectedEmpIds((prev) => Array.from(new Set([...prev, ...toSelect])));
    }
  };

  const handleToggleEmployee = (id: string) => {
    if (enrolledEmpIdsForThisCourse.has(id)) return;

    if (selectedEmpIds.includes(id)) {
      setSelectedEmpIds((prev) => prev.filter((e) => e !== id));
    } else {
      if (selectedEmpIds.length >= availableSeats) {
        toast.error(`Cannot select more than ${availableSeats} available seats.`);
        return;
      }
      setSelectedEmpIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    }
  };

  const isConfirmDisabled = selectedEmpIds.length === 0 || selectedEmpIds.length > availableSeats;

  const handleOpenConfirmation = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (selectedEmpIds.length === 0) {
      toast.error('Please select at least one employee.');
      return;
    }
    if (selectedEmpIds.length > availableSeats) {
      toast.error(`Cannot enroll ${selectedEmpIds.length} employees: only ${availableSeats} seat(s) available.`);
      return;
    }
    setIsConfirmingStep(true);
  };

  const handleFinalConfirmEnrollment = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isConfirmDisabled) {
      if (selectedEmpIds.length === 0) {
        toast.error('Please select at least one employee.');
      } else if (selectedEmpIds.length > availableSeats) {
        toast.error('Insufficient available seats.');
      }
      return;
    }
    onConfirmEnrollment(companyCourse.courseId, selectedEmpIds, notifyPortal, notifyEmail);
    setIsConfirmingStep(false);
    onClose();
  };

  const selectedEmployeeObjects = employeeList.filter((emp) => selectedEmpIds.includes(emp.id));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> {isConfirmingStep ? 'CONFIRM ENROLLMENT' : 'ENROLL EMPLOYEES'}
            </DialogTitle>
            <Badge variant="default" className="text-xs bg-primary text-primary-foreground font-mono">
              Available Seats: {availableSeats}
            </Badge>
          </div>
          <DialogDescription className="text-xs">
            Course: <strong>{companyCourse.title}</strong> ({companyCourse.provider})
          </DialogDescription>
        </DialogHeader>

        {isConfirmingStep ? (
          /* STEP 2: CONFIRMATION PREVIEW */
          <div className="space-y-4 py-2 text-xs">
            <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 space-y-1.5">
              <h4 className="font-bold text-xs text-primary uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Ready to Allocate {selectedEmpIds.length} License {selectedEmpIds.length === 1 ? 'Seat' : 'Seats'}
              </h4>
              <p className="text-muted-foreground text-[11px]">
                Please review the seat allocation breakdown and selected employees before confirming.
              </p>
            </div>

            {selectedEmpIds.length > availableSeats && (
              <div className="p-2.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" /> ⚠ Insufficient seats available for this allocation ({selectedEmpIds.length} selected, {availableSeats} available).
              </div>
            )}

            {/* Selected Roster Summary */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                Selected Employee Roster ({selectedEmployeeObjects.length})
              </h4>
              <div className="border rounded-xl p-3 bg-card space-y-2 max-h-40 overflow-y-auto">
                {selectedEmployeeObjects.map((emp) => (
                  <div key={emp.id} className="flex items-center justify-between border-b pb-1.5 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <strong className="text-foreground">{emp.name}</strong>
                      <span className="text-[10px] font-mono text-muted-foreground">({emp.id})</span>
                    </div>
                    <Badge variant="outline" className="text-[9px]">{emp.department}</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Seat Ledger Math Card */}
            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-card border text-center font-mono">
              <div className="p-2 rounded-lg bg-muted/40">
                <span className="text-[10px] text-muted-foreground block font-sans">Available Before</span>
                <strong className="text-sm font-bold text-foreground">{availableSeats}</strong>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <span className="text-[10px] text-muted-foreground block font-sans">Allocating</span>
                <strong className="text-sm font-extrabold text-primary">{selectedEmpIds.length}</strong>
              </div>
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[10px] text-muted-foreground block font-sans">Remaining After</span>
                <strong className={`text-sm font-extrabold ${availableSeats - selectedEmpIds.length < 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                  {availableSeats - selectedEmpIds.length}
                </strong>
              </div>
            </div>

            {/* Notifications Preferences */}
            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl border bg-muted/20 text-[11px]">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <span>Portal Notification: <strong>{notifyPortal ? '✓ Enabled' : 'Disabled'}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>Email Dispatch: <strong>{notifyEmail ? '✓ Enabled' : 'Disabled'}</strong></span>
              </div>
            </div>

            <DialogFooter className="border-t pt-3 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsConfirmingStep(false)}
                className="text-xs"
              >
                Back to Selection
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isConfirmDisabled}
                onClick={(e) => handleFinalConfirmEnrollment(e)}
                className="gap-1.5 text-xs bg-primary text-primary-foreground font-semibold px-5 shadow-xs cursor-pointer hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="h-4 w-4" /> Confirm Enrollment ({selectedEmpIds.length})
              </Button>
            </DialogFooter>
          </div>
        ) : (
          /* STEP 1: EMPLOYEE SELECTION */
          <div className="space-y-4 py-2 text-xs">
            {/* Seat Math Alert */}
            <div className="p-3 rounded-lg border bg-muted/30 flex items-center justify-between font-mono">
              <span className="font-sans">Seats Selected: <strong className="text-foreground text-sm font-extrabold">{selectedEmpIds.length}</strong></span>
              <span className="font-sans">Available Seats: <strong className="text-foreground text-sm font-extrabold">{availableSeats}</strong></span>
              <span className="font-sans">Remaining Seats: <strong className="text-emerald-600 font-extrabold text-sm">{availableSeats - selectedEmpIds.length}</strong></span>
            </div>

            {/* Search & Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search employee name, code, department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 text-xs h-8"
                />
              </div>
              <Select value={selectedDept} onValueChange={setSelectedDept}>
                <SelectTrigger className="text-xs h-8">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Departments</SelectItem>
                  {dynamicDepartments.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Select All Checkbox Header */}
            <div className="p-2.5 bg-muted/40 rounded-lg flex items-center justify-between border">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                <Checkbox
                  checked={isAllEligibleSelected}
                  onCheckedChange={handleToggleSelectAll}
                />
                <span>Select All Eligible Employees ({eligibleEmployees.length})</span>
              </label>
              <span className="text-[10px] text-muted-foreground font-mono">
                {selectedEmpIds.length} of {availableSeats} max seats
              </span>
            </div>

            {/* Employee Master Checklist */}
            <div className="border rounded-lg max-h-52 overflow-y-auto divide-y">
              {isLoadingEmployees && employeeList.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" /> Loading live employees from database...
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No employees found matching the current criteria.
                </div>
              ) : (
                filteredEmployees.map((emp) => {
                  const isAlreadyEnrolled =
                    enrolledEmpIdsForThisCourse.has(emp.id) ||
                    (emp.employeeCode ? enrolledEmpIdsForThisCourse.has(emp.employeeCode) : false);
                  const isChecked = selectedEmpIds.includes(emp.id);

                  return (
                    <div
                      key={emp.id}
                      onClick={() => !isAlreadyEnrolled && handleToggleEmployee(emp.id)}
                      className={`flex items-center justify-between p-2.5 text-xs transition-colors ${
                        isAlreadyEnrolled
                          ? 'opacity-60 bg-muted/20 cursor-not-allowed'
                          : isChecked
                          ? 'bg-primary/5 font-semibold cursor-pointer'
                          : 'cursor-pointer hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isChecked}
                          disabled={isAlreadyEnrolled}
                          onCheckedChange={() => !isAlreadyEnrolled && handleToggleEmployee(emp.id)}
                        />
                        <div
                          onClick={() => !isAlreadyEnrolled && handleToggleEmployee(emp.id)}
                          className={isAlreadyEnrolled ? 'cursor-not-allowed' : 'cursor-pointer'}
                        >
                          <span className="font-semibold text-foreground">{emp.name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono ml-2">
                            ({emp.employeeCode || emp.id})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-[10px]">
                        {isAlreadyEnrolled ? (
                          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                            ✓ Already Enrolled
                          </Badge>
                        ) : (
                          <>
                            <Badge variant="outline">{emp.department}</Badge>
                            <span className="text-muted-foreground">{emp.designation}</span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Notification & Email Toggles */}
            <div className="p-3 rounded-lg border bg-muted/20 space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="portalNotif" checked={notifyPortal} onCheckedChange={(c) => setNotifyPortal(!!c)} />
                <Label htmlFor="portalNotif" className="text-xs cursor-pointer flex items-center gap-1.5 font-semibold">
                  <Bell className="h-3.5 w-3.5 text-primary" /> Send Portal Notification
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="emailNotif" checked={notifyEmail} onCheckedChange={(c) => setNotifyEmail(!!c)} />
                <Label htmlFor="emailNotif" className="text-xs cursor-pointer flex items-center gap-1.5 font-semibold">
                  <Mail className="h-3.5 w-3.5 text-primary" /> Send Email Dispatch
                </Label>
              </div>
            </div>

            <DialogFooter className="border-t pt-3 flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={selectedEmpIds.length === 0}
                onClick={handleOpenConfirmation}
                className="gap-1.5 text-xs bg-primary text-primary-foreground font-semibold px-4 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Users className="h-4 w-4" /> Enroll Selected ({selectedEmpIds.length})
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ④ Course Request Review Modal (Approve & Purchase / Approve Existing / Reject)
interface ReviewCourseRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: CourseRequest | null;
  onApprovePurchase: (req: CourseRequest) => void;
  onApproveExistingSeat: (req: CourseRequest) => void;
  onRejectRequest: (req: CourseRequest, reason: string) => void;
}

export function ReviewCourseRequestModal({
  isOpen,
  onClose,
  request,
  onApprovePurchase,
  onApproveExistingSeat,
  onRejectRequest,
}: ReviewCourseRequestModalProps) {
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  if (!request) return null;

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      toast.error('Please enter a rejection reason.');
      return;
    }
    onRejectRequest(request, rejectReason.trim());
    setIsRejecting(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> REVIEW COURSE REQUEST
          </DialogTitle>
          <DialogDescription className="text-xs">
            Requested by: <strong>{request.employeeName}</strong> ({request.department})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <div className="p-3 rounded-lg bg-muted/30 border space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground text-sm">{request.courseTitle}</span>
              <Badge variant="outline" className="font-mono text-[10px]">₹{request.pricePerSeat.toLocaleString()} / Seat</Badge>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">Provider: <strong className="text-foreground">{request.provider}</strong></p>
              <Badge variant="secondary" className="text-[10px] font-mono">
                Priority: {request.priority || 'Medium'}
              </Badge>
            </div>

            {/* Course Link Section */}
            <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5 shrink-0">
                <Globe className="h-3.5 w-3.5 text-primary" /> Course Link:
              </span>
              {request.courseUrl || request.url ? (
                <a
                  href={(() => {
                    const u = request.courseUrl || request.url || '';
                    return u.startsWith('http://') || u.startsWith('https://') ? u : `https://${u}`;
                  })()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-primary hover:underline hover:text-primary/80 truncate max-w-[240px] text-xs"
                  title={request.courseUrl || request.url}
                >
                  <span className="truncate">{request.courseUrl || request.url}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              ) : (
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(`${request.courseTitle} ${request.provider} course`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-primary hover:underline text-xs"
                  title="Search course on Google"
                >
                  <span>Open Course on Web ({request.provider})</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              )}
            </div>
          </div>

          <div className="p-3 rounded-lg border bg-card space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground block">Employee Justification:</span>
            <p className="text-foreground leading-relaxed">{request.reason}</p>
            <p className="text-muted-foreground pt-1">Business Benefit: <strong>{request.businessBenefit}</strong></p>
          </div>

          {isRejecting && (
            <div className="space-y-1.5 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
              <Label className="text-xs font-bold text-destructive">Rejection Reason *</Label>
              <Textarea
                rows={2}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Specify why course request was not approved..."
                className="text-xs bg-background"
              />
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-3 flex flex-wrap items-center justify-between gap-2">
          {isRejecting ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => setIsRejecting(false)} className="text-xs">
                Cancel
              </Button>
              <Button size="sm" variant="destructive" onClick={handleConfirmReject} className="text-xs">
                Confirm Rejection
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsRejecting(true)} className="text-xs text-destructive hover:bg-destructive/10">
                Reject
              </Button>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => onApproveExistingSeat(request)} className="text-xs gap-1 text-primary border-primary/40">
                  Approve (Use Existing Seat)
                </Button>
                <Button size="sm" onClick={() => onApprovePurchase(request)} className="text-xs bg-primary text-primary-foreground gap-1">
                  Approve & Purchase
                </Button>
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ⑤ Purchase Additional Seats Modal
interface PurchaseMoreSeatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: CompanyCourse | null;
  unitPrice: number;
  onConfirmAdditionalSeats: (courseId: string, additionalSeats: number, total: number) => void;
}

export function PurchaseMoreSeatsModal({
  isOpen,
  onClose,
  course,
  unitPrice = 2500,
  onConfirmAdditionalSeats,
}: PurchaseMoreSeatsModalProps) {
  const [additionalSeats, setAdditionalSeats] = useState<number>(1);

  if (!course) return null;

  const subtotal = additionalSeats * unitPrice;
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + gst;

  const handleConfirm = () => {
    onConfirmAdditionalSeats(course.courseId, additionalSeats, total);
    toast.success(`✓ Purchased ${additionalSeats} Additional Seats for ${course.title}!`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" /> PURCHASE ADDITIONAL SEATS
          </DialogTitle>
          <DialogDescription className="text-xs">
            Add seats to existing company course: <strong>{course.title}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          <div className="grid grid-cols-2 gap-3 text-center p-3 rounded-lg bg-muted/30 border">
            <div>
              <span className="text-[10px] text-muted-foreground block font-medium">Existing Seats</span>
              <strong className="text-sm text-foreground font-bold">{course.purchasedSeats} Seats</strong>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block font-medium">Currently Available</span>
              <strong className="text-sm text-emerald-600 font-bold">{course.availableSeats} Seats</strong>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Additional Seats Required *</Label>
            <Input
              type="number"
              min={1}
              value={additionalSeats}
              onChange={(e) => setAdditionalSeats(Math.max(1, Number(e.target.value)))}
              className="text-xs font-mono font-bold"
            />
          </div>

          <div className="p-3 rounded-lg border bg-primary/5 space-y-1.5 font-mono text-xs">
            <div className="flex justify-between"><span>Subtotal ({additionalSeats} @ ₹{unitPrice}):</span> <span>₹{subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>GST (18%):</span> <span>₹{gst.toLocaleString()}</span></div>
            <div className="flex justify-between font-bold text-primary pt-1 border-t text-sm">
              <span>Total Payable:</span> <span>₹{total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button size="sm" onClick={handleConfirm} className="gap-1.5 text-xs bg-primary text-primary-foreground">
            Purchase Additional Seats (₹{total.toLocaleString()})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ⑥ Employee Request Course Modal
interface EmployeeRequestCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  course?: MarketplaceCourse | null;
  onSubmitRequest: (reqData: {
    courseId: string;
    courseTitle: string;
    provider: string;
    pricePerSeat: number;
    reason: string;
    businessBenefit: string;
    priority: 'High' | 'Medium' | 'Low' | 'Critical';
    url?: string;
    category?: string;
    level?: string;
    duration?: string;
    certificationIncluded?: boolean;
    attachmentName?: string;
  }) => void;
}

export function EmployeeRequestCourseModal({
  isOpen,
  onClose,
  course,
  onSubmitRequest,
}: EmployeeRequestCourseModalProps) {
  const user = useAuthStore((s) => s.user);
  const empName = user?.employee ? `${user.employee.firstName} ${user.employee.lastName}`.trim() : (user as any)?.name || 'Employee';
  const empCode = user?.employee?.employeeCode || user?.employee?.id || user?.id || '';
  const empDept = user?.employee?.department?.name || 'Operations';

  // Form State - start clean and empty
  const [courseName, setCourseName] = useState('');
  const [provider, setProvider] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('Technical');
  const [level, setLevel] = useState('Intermediate');
  const [durationNumber, setDurationNumber] = useState('');
  const [durationUnit, setDurationUnit] = useState('Hours');
  const [certificationIncluded, setCertificationIncluded] = useState('No');
  const [pricePerSeat, setPricePerSeat] = useState('');

  const [reason, setReason] = useState('');
  const [businessBenefit, setBusinessBenefit] = useState('');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low' | 'Critical'>('Medium');
  const [attachmentName, setAttachmentName] = useState<string>('');

  // Reset form to clean state when opened, or fill course info if a catalog course was selected
  useEffect(() => {
    if (course) {
      setCourseName(course.title || '');
      setProvider(course.provider || '');
      setCategory(course.category || 'Technical');
      setLevel(course.difficulty || 'Intermediate');
      setDurationNumber(course.durationHours ? String(course.durationHours) : '');
      setPricePerSeat(course.pricePerSeat ? String(course.pricePerSeat) : '');
      setUrl('');
      setReason('');
      setBusinessBenefit('');
      setPriority('Medium');
      setAttachmentName('');
    } else {
      setCourseName('');
      setProvider('');
      setUrl('');
      setCategory('Technical');
      setLevel('Intermediate');
      setDurationNumber('');
      setDurationUnit('Hours');
      setCertificationIncluded('No');
      setPricePerSeat('');
      setReason('');
      setBusinessBenefit('');
      setPriority('Medium');
      setAttachmentName('');
    }
  }, [course, isOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentName(file.name);
      toast.success(`Attached file: ${file.name}`);
    }
  };

  const handleSubmit = () => {
    if (!courseName.trim()) {
      toast.error('Please enter the Course Name.');
      return;
    }
    if (!provider.trim()) {
      toast.error('Please enter the Provider / Platform.');
      return;
    }
    if (!reason.trim()) {
      toast.error('Please specify why you need this course.');
      return;
    }
    if (!businessBenefit.trim()) {
      toast.error('Please specify how this will help your work.');
      return;
    }

    const numericPrice = parseFloat(pricePerSeat) || 0;

    onSubmitRequest({
      courseId: course?.id || `CRS-REQ-${Date.now()}`,
      courseTitle: courseName.trim(),
      provider: provider.trim(),
      pricePerSeat: numericPrice,
      reason: reason.trim(),
      businessBenefit: businessBenefit.trim(),
      priority,
      url: url.trim(),
      category,
      level,
      duration: `${durationNumber} ${durationUnit}`,
      certificationIncluded: certificationIncluded === 'Yes',
      attachmentName,
    });

    toast.success(`✓ Course Request Submitted for ${courseName}! Sent to HR for approval.`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
            <FileText className="h-5 w-5 text-primary" /> Request New Course
          </DialogTitle>
          <DialogDescription className="text-xs">
            Request a training course that is not currently available in the company course catalog.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-3 text-xs">
          {/* SECTION 1: COURSE INFORMATION */}
          <div className="space-y-3 p-4 rounded-xl border bg-muted/20">
            <h3 className="font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" /> 1. Course Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Course Name *</Label>
                <Input
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="e.g. AWS Solutions Architect Associate"
                  className="text-xs bg-background"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Provider / Platform *</Label>
                <Input
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  placeholder="e.g. Cloud Academy, Coursera, Udemy"
                  className="text-xs bg-background"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Course URL</Label>
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/aws-course"
                className="text-xs bg-background font-mono"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cloud & DevOps">Cloud & DevOps</SelectItem>
                    <SelectItem value="Technical & Software">Technical & Software</SelectItem>
                    <SelectItem value="Leadership & Management">Leadership & Management</SelectItem>
                    <SelectItem value="Safety & Compliance">Safety & Compliance</SelectItem>
                    <SelectItem value="Data & Analytics">Data & Analytics</SelectItem>
                    <SelectItem value="Operations & Logistics">Operations & Logistics</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Level *</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger className="text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                    <SelectItem value="Expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Duration</Label>
                <div className="flex gap-1">
                  <Input
                    type="number"
                    value={durationNumber}
                    onChange={(e) => setDurationNumber(e.target.value)}
                    className="text-xs bg-background w-16"
                  />
                  <Select value={durationUnit} onValueChange={setDurationUnit}>
                    <SelectTrigger className="text-xs bg-background flex-grow">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hours">Hours</SelectItem>
                      <SelectItem value="Days">Days</SelectItem>
                      <SelectItem value="Weeks">Weeks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Certification Included</Label>
                <Select value={certificationIncluded} onValueChange={setCertificationIncluded}>
                  <SelectTrigger className="text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* SECTION 2: COURSE COST */}
          <div className="space-y-3 p-4 rounded-xl border bg-muted/20">
            <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <DollarSign className="h-4 w-4" /> 2. Course Cost
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Estimated Price / Seat * (₹)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-muted-foreground">₹</span>
                  <Input
                    type="number"
                    value={pricePerSeat}
                    onChange={(e) => setPricePerSeat(e.target.value)}
                    className="pl-7 text-xs bg-background font-mono font-bold"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg border bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold">Payment Type:</span>
                  <Badge variant="default" className="bg-emerald-600 text-white text-[10px]">
                    Company Sponsored
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Employee does not pay. HR will review estimated cost upon approval.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 3: BUSINESS JUSTIFICATION */}
          <div className="space-y-3 p-4 rounded-xl border bg-muted/20">
            <h3 className="font-bold text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <FileText className="h-4 w-4" /> 3. Business Justification
            </h3>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Why do you need this course? *</Label>
              <Textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Required for upcoming enterprise AWS cloud migration project and cloud governance activities."
                className="text-xs bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">How will this help your work? *</Label>
              <Textarea
                rows={2}
                value={businessBenefit}
                onChange={(e) => setBusinessBenefit(e.target.value)}
                placeholder="Will improve cloud architecture and AWS governance skills required for my current role."
                className="text-xs bg-background"
              />
            </div>
          </div>

          {/* SECTION 4: REQUEST PRIORITY */}
          <div className="space-y-3 p-4 rounded-xl border bg-muted/20">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" /> 4. Request Priority *
              </h3>
              <span className="text-[10px] text-muted-foreground italic">
                Use High/Critical for active project requirements
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {(['Low', 'Medium', 'High', 'Critical'] as const).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPriority(p)}
                  className={cn(
                    'p-2.5 rounded-lg border text-center font-semibold transition-all text-xs flex flex-col items-center gap-1',
                    priority === p
                      ? p === 'Critical'
                        ? 'border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500'
                        : p === 'High'
                        ? 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500'
                        : p === 'Medium'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500'
                        : 'border-slate-500 bg-slate-500/10 text-slate-700 dark:text-slate-300 ring-1 ring-slate-500'
                      : 'bg-card border-border hover:bg-muted text-muted-foreground'
                  )}
                >
                  <span className="text-xs">{p === 'Critical' ? '🚨' : p === 'High' ? '🔥' : p === 'Medium' ? '⚡' : '🌱'}</span>
                  <span>{p}</span>
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 5: MANAGER / DEPARTMENT INFORMATION */}
          <div className="space-y-3 p-4 rounded-xl border bg-muted/20">
            <h3 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Users className="h-4 w-4 text-primary" /> 5. Employee / Manager Information (Auto-Filled)
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-lg bg-card border text-xs">
              <div>
                <span className="text-[10px] text-muted-foreground block">Employee:</span>
                <strong className="text-foreground">{empName}</strong>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Employee ID:</span>
                <strong className="font-mono text-primary">{empCode}</strong>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Department / Role:</span>
                <strong className="text-foreground">{empDept}</strong>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Reporting Manager:</span>
                <strong className="text-foreground">Reporting Head</strong>
              </div>
            </div>
          </div>

          {/* SECTION 6: ATTACHMENTS */}
          <div className="space-y-3 p-4 rounded-xl border bg-muted/20">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-primary" /> 6. Supporting Documents (Optional)
              </h3>
              <span className="text-[10px] text-muted-foreground">Brochure, Manager Recommendation, Quotation</span>
            </div>

            <div className="flex items-center gap-3">
              <label className="cursor-pointer">
                <input type="file" className="hidden" onChange={handleFileUpload} />
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-background hover:bg-muted text-xs font-medium text-foreground transition-colors shadow-2xs">
                  <Plus className="h-3.5 w-3.5 text-primary" /> Upload Document
                </span>
              </label>

              {attachmentName ? (
                <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 gap-1">
                  <CheckCircle2 className="h-3 w-3" /> {attachmentName}
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground italic">No document attached</span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} className="gap-1.5 text-xs bg-primary text-primary-foreground font-semibold px-5 shadow-xs">
            <Send className="h-3.5 w-3.5" /> Submit Course Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper: Auto-generate realistic, formatted course codes
export function generateCourseCode(title: string, category?: string): string {
  const year = new Date().getFullYear();
  if (!title || !title.trim()) {
    const catCode = category ? category.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() : 'EXT';
    return `CRS-${catCode}-${year}-001`;
  }

  const clean = title.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const stopWords = new Set(['for', 'and', 'the', 'in', 'on', 'with', 'to', 'of', 'a', 'an', 'at', 'by', 'from', 'its', 'their']);
  const words = clean.split(/\s+/).filter((w) => w.length > 0 && !stopWords.has(w.toLowerCase()));

  let acronym = '';
  if (/power\s*bi/i.test(title)) {
    acronym = 'PBI';
  } else if (/excel/i.test(title)) {
    acronym = 'EXC';
  } else if (/python/i.test(title)) {
    acronym = 'PY';
  } else if (/react/i.test(title)) {
    acronym = 'RCT';
  } else if (/aws/i.test(title)) {
    acronym = 'AWS';
  } else if (/scrum/i.test(title)) {
    acronym = 'CSM';
  } else if (/sql/i.test(title)) {
    acronym = 'SQL';
  } else if (/safety/i.test(title)) {
    acronym = 'SFT';
  } else if (/cyber/i.test(title)) {
    acronym = 'CYB';
  } else if (words.length === 1) {
    acronym = words[0].slice(0, 3).toUpperCase();
  } else if (words.length === 2) {
    acronym = (words[0].slice(0, 2) + words[1].slice(0, 2)).toUpperCase();
  } else {
    acronym = words.map((w) => w[0]).join('').slice(0, 4).toUpperCase();
  }

  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash * 31 + title.charCodeAt(i)) % 90;
  }
  const seq = String(Math.abs(hash) + 10).padStart(3, '0');
  return `CRS-${acronym || 'GEN'}-${year}-${seq}`;
}

// ⑦ ADD COMPANY COURSE MODAL (HR Purchased/Licensed Library Form)
interface AddCompanyCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalogCourses?: MarketplaceCourse[];
  onAddCompanyCourse: (newCompCourse: CompanyCourse, newOrderRecord: PurchaseHistoryRecord) => void;
  initialCourseRequest?: CourseRequest | null;
  onApprovePurchaseRequest?: (req: CourseRequest, purchaseData: any) => Promise<void>;
}

export function AddCompanyCourseModal({
  isOpen,
  onClose,
  catalogCourses = [],
  onAddCompanyCourse,
  initialCourseRequest = null,
  onApprovePurchaseRequest,
}: AddCompanyCourseModalProps) {
  const effectiveCatalogCourses = catalogCourses || [];

  const [courseSource, setCourseSource] = useState<'catalog' | 'custom'>(
    initialCourseRequest ? 'custom' : effectiveCatalogCourses.length > 0 ? 'catalog' : 'custom'
  );
  const [selectedCourseId, setSelectedCourseId] = useState(effectiveCatalogCourses[0]?.id || '');

  useEffect(() => {
    if (effectiveCatalogCourses.length > 0 && !selectedCourseId && !initialCourseRequest) {
      setSelectedCourseId(effectiveCatalogCourses[0].id);
    }
  }, [effectiveCatalogCourses, selectedCourseId, initialCourseRequest]);

  // Custom Course Fields (defaults for external course entry)
  const [customTitle, setCustomTitle] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [isCodeUserEdited, setIsCodeUserEdited] = useState(false);
  const [customProvider, setCustomProvider] = useState('');
  const [externalCourseId, setExternalCourseId] = useState('');
  const [courseUrl, setCourseUrl] = useState('');
  const [customCategory, setCustomCategory] = useState('Technical');
  const [customDifficulty, setCustomDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [durationHours, setDurationHours] = useState<number | ''>('');
  const [customCertificate, setCustomCertificate] = useState(true);
  const [customAssessment, setCustomAssessment] = useState(true);
  const [customDescription, setCustomDescription] = useState('');
  const [customDeliveryMode, setCustomDeliveryMode] = useState('Online Self-Paced');

  // Purchase Details
  const [purchaseType, setPurchaseType] = useState<'Company License' | 'Subscription' | 'Individual Seats'>('Company License');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [orderId, setOrderId] = useState(`ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [seatsPurchased, setSeatsPurchased] = useState<number | ''>('');
  const [pricePerSeat, setPricePerSeat] = useState<number | ''>('');

  // Access Period
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [noExpiry, setNoExpiry] = useState(false);
  const [certificateAvailable, setCertificateAvailable] = useState(true);
  const [employeesCanAccess, setEmployeesCanAccess] = useState(true);

  // Assignment Settings
  const [assignmentScope, setAssignmentScope] = useState<'Selected Employees' | 'Department' | 'Designation' | 'All Employees'>('Selected Employees');
  const [seatAllocationMode, setSeatAllocationMode] = useState<'Manual' | 'Auto'>('Manual');
  const [allowEmployeeRequest, setAllowEmployeeRequest] = useState(true);
  const [managerApprovalRequired, setManagerApprovalRequired] = useState(true);

  // Notifications
  const [notifyPortal, setNotifyPortal] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);

  // Selected catalog course details from MySQL database
  const activeCatalogCourse = effectiveCatalogCourses.find((c) => c.id === selectedCourseId) || effectiveCatalogCourses[0];

  useEffect(() => {
    if (activeCatalogCourse && courseSource === 'catalog') {
      if (activeCatalogCourse.pricePerSeat !== undefined) {
        setPricePerSeat(activeCatalogCourse.pricePerSeat);
      }
    }
  }, [selectedCourseId, courseSource, activeCatalogCourse]);

  // Pre-fill from initial employee course request when approving request
  useEffect(() => {
    if (initialCourseRequest && isOpen) {
      setCourseSource('custom');
      setCustomTitle(initialCourseRequest.courseTitle || '');
      setCustomProvider(initialCourseRequest.provider || '');
      setCourseUrl(initialCourseRequest.courseUrl || initialCourseRequest.url || '');
      setSeatsPurchased(1);
      setPricePerSeat(initialCourseRequest.pricePerSeat || 2500);
      setPurchaseType('Individual Seats');
      setCustomCategory('Technical');
      const genCode = generateCourseCode(initialCourseRequest.courseTitle || 'CRS', 'Technical');
      setCustomCode(genCode);
      setIsCodeUserEdited(false);
      setCustomDescription(`Employee course request for ${initialCourseRequest.employeeName} (${initialCourseRequest.department}). Reason: ${initialCourseRequest.reason}`);
    }
  }, [initialCourseRequest, isOpen]);

  const catalogTopics = useMemo(() => {
    if (courseSource === 'catalog' && activeCatalogCourse) {
      if (Array.isArray(activeCatalogCourse.modules) && activeCatalogCourse.modules.length > 0) {
        return activeCatalogCourse.modules.map((m: any) => (typeof m === 'string' ? m : m.title));
      }
      if ((activeCatalogCourse as any).modulesJson) {
        try {
          const parsed =
            typeof (activeCatalogCourse as any).modulesJson === 'string'
              ? JSON.parse((activeCatalogCourse as any).modulesJson)
              : (activeCatalogCourse as any).modulesJson;
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((m: any) => (typeof m === 'string' ? m : m.title || m.name || String(m)));
          }
        } catch (e) {}
      }
      return [
        `${activeCatalogCourse.title} - Core Fundamentals & Concepts`,
        `${activeCatalogCourse.title} - Applied Workflows & Real-World Scenarios`,
        `${activeCatalogCourse.title} - Advanced Techniques & Case Studies`,
        `${activeCatalogCourse.title} - Final Practical Evaluation`,
      ];
    }
    const title = customTitle.trim() || 'Custom Course';
    return [
      `${title} - Module 1: Overview & Environment Setup`,
      `${title} - Module 2: Core Methodologies & Practice`,
      `${title} - Module 3: Applied Enterprise Workflows`,
      `${title} - Module 4: Final Practical Assessment`,
    ];
  }, [courseSource, activeCatalogCourse, customTitle]);

  const totalCost = (Number(seatsPurchased) || 0) * (Number(pricePerSeat) || 0);

  const handleSubmit = () => {
    let courseTitle = '';
    let courseCode = '';
    let provider = '';
    let category = '';
    let targetCourseId = '';

    if (courseSource === 'catalog') {
      if (!activeCatalogCourse) {
        toast.error('Please select a course from the database catalog.');
        return;
      }
      courseTitle = activeCatalogCourse.title;
      courseCode = activeCatalogCourse.code;
      provider = activeCatalogCourse.provider;
      category = activeCatalogCourse.category;
      targetCourseId = activeCatalogCourse.id;
    } else {
      if (!customTitle.trim()) {
        toast.error('Please enter a course title.');
        return;
      }
      courseTitle = customTitle.trim();
      courseCode = customCode.trim() || generateCourseCode(courseTitle, customCategory);
      if (!customCode.trim()) {
        setCustomCode(courseCode);
      }
      provider = customProvider.trim();
      category = customCategory;
      targetCourseId = `CC-2026-${Date.now().toString().slice(-5)}`;
    }

    if (!seatsPurchased || seatsPurchased <= 0) {
      toast.error('Please specify a valid number of seats.');
      return;
    }

    const newCompCourse: CompanyCourse = {
      courseId: targetCourseId,
      courseCode,
      title: courseTitle,
      provider,
      category,
      purchasedSeats: Number(seatsPurchased),
      assignedSeats: 0,
      availableSeats: Number(seatsPurchased),
      inProgressCount: 0,
      completedCount: 0,
      status: 'ACTIVE',
      purchasedAt: purchaseDate,
    };

    const subtotal = totalCost;
    const gst = Math.round(subtotal * 0.18);
    const totalAmount = subtotal + gst;

    const newOrder: PurchaseHistoryRecord = {
      orderId,
      courseId: targetCourseId,
      courseCode,
      courseTitle,
      provider,
      seatsPurchased: Number(seatsPurchased),
      pricePerSeat: Number(pricePerSeat),
      subtotal,
      gst,
      totalAmount,
      billingEntity: 'EHCM Enterprise Corp',
      costCenter: 'CC-LEARNING-2026',
      purchasedAt: purchaseDate,
      status: 'PAID',
    };

    if (initialCourseRequest && onApprovePurchaseRequest) {
      onApprovePurchaseRequest(initialCourseRequest, {
        courseId: targetCourseId,
        courseCode,
        title: courseTitle,
        provider,
        category,
        seatsPurchased: Number(seatsPurchased) || 1,
        pricePerSeat: Number(pricePerSeat) || 2500,
        courseUrl: courseSource === 'catalog' ? (activeCatalogCourse?.courseUrl || '') : courseUrl,
        subscriptionType: purchaseType,
        startDate,
        expiryDate: noExpiry ? null : expiryDate,
        accessInstructions: `Access granted for ${initialCourseRequest.employeeName}. Login via provider portal.`,
        orderId,
        billingEntity: 'EHCM Enterprise Corp',
        costCenter: 'HR-L&D',
      });
      onClose();
      return;
    }

    onAddCompanyCourse(newCompCourse, newOrder);

    // Notifications
    if (notifyPortal || notifyEmail) {
      notificationStore.addNotifications([
        {
          type: 'TRAINING',
          employeeId: 'ALL-EMPLOYEES',
          employeeName: 'All Employees',
          title: `New Company Course Added: ${courseTitle}`,
          message: `New licensed company course ${courseTitle} (${seatsPurchased} seats) is now available in your Course Catalog!`,
          programId: targetCourseId,
          actionUrl: '/learning/course-catalog',
          sender: 'HR Learning & Development Team',
        },
      ]);
    }

    toast.success(`✓ Added ${courseTitle} (${seatsPurchased} seats) to Company Library! Total: ₹${totalCost.toLocaleString()}`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <DialogTitle className="text-base font-bold">ADD COMPANY COURSE</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Add a purchased/licensed course to your company library and allocate seats.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2 text-xs">
          {initialCourseRequest && (
            <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-primary flex items-center gap-1.5 text-xs">
                  <Sparkles className="h-4 w-4 text-amber-500" /> EMPLOYEE REQUEST APPROVAL & PURCHASE
                </span>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px] font-mono">
                  Ref: {initialCourseRequest.id.slice(-8)}
                </Badge>
              </div>
              <p className="text-xs text-foreground">
                Requested by: <strong>{initialCourseRequest.employeeName}</strong> ({initialCourseRequest.department})
              </p>
              <p className="text-[11px] text-muted-foreground">
                Confirming this company purchase will buy <strong>1 seat</strong>, automatically allocate it to {initialCourseRequest.employeeName}, and enroll the employee with immediate access.
              </p>
            </div>
          )}

          {/* SECTION 1: COURSE SOURCE & SELECTION */}
          <div className="space-y-4 p-4 rounded-xl border bg-muted/20">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" /> 1. Course Source & Selection
              </h3>
              <Badge variant="outline" className="text-[10px]">
                {courseSource === 'catalog' ? 'Catalog Selection' : 'Custom Course Entry'}
              </Badge>
            </div>

            {/* Interactive Tab Buttons */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Course Source *</Label>
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-muted/50 rounded-xl border">
                <button
                  type="button"
                  onClick={() => setCourseSource('catalog')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    courseSource === 'catalog'
                      ? 'bg-background text-primary shadow-xs border border-primary/20 font-bold ring-1 ring-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  }`}
                >
                  <span className={`h-3.5 w-3.5 rounded-full border flex items-center justify-center ${courseSource === 'catalog' ? 'border-primary' : 'border-muted-foreground'}`}>
                    {courseSource === 'catalog' && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                  </span>
                  Existing Catalog Course
                </button>

                <button
                  type="button"
                  onClick={() => setCourseSource('custom')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    courseSource === 'custom'
                      ? 'bg-background text-primary shadow-xs border border-primary/20 font-bold ring-1 ring-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  }`}
                >
                  <span className={`h-3.5 w-3.5 rounded-full border flex items-center justify-center ${courseSource === 'custom' ? 'border-primary' : 'border-muted-foreground'}`}>
                    {courseSource === 'custom' && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                  </span>
                  External / Custom Course
                </button>
              </div>
            </div>

            {courseSource === 'catalog' ? (
              /* EXISTING CATALOG COURSE SELECTION */
              <div className="space-y-3 pt-1">
                <Label className="text-xs font-semibold">Select Course from Database Catalog *</Label>
                {effectiveCatalogCourses.length === 0 ? (
                  <div className="p-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs space-y-1">
                    <p className="font-semibold">No catalog courses currently available in database.</p>
                    <p className="text-[11px]">
                      Click the <strong>External / Custom Course</strong> tab above to enter your custom course details.
                    </p>
                  </div>
                ) : (
                  <>
                    <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                      <SelectTrigger className="text-xs h-9 bg-background">
                        <SelectValue placeholder="Select course from catalog" />
                      </SelectTrigger>
                      <SelectContent>
                        {effectiveCatalogCourses.map((c) => (
                          <SelectItem key={c.id} value={c.id} className="text-xs">
                            {c.title} ({c.code}) • {c.provider}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {activeCatalogCourse && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 p-3 rounded-lg bg-card border font-mono text-[11px] mt-2">
                        <div>
                          <span className="text-muted-foreground block text-[10px] font-sans">Course Code:</span>
                          <strong className="text-primary">{activeCatalogCourse.code}</strong>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px] font-sans">Provider:</span>
                          <strong className="text-foreground">{activeCatalogCourse.provider}</strong>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px] font-sans">Category:</span>
                          <strong className="text-foreground">{activeCatalogCourse.category}</strong>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px] font-sans">Level:</span>
                          <strong className="text-emerald-600">{activeCatalogCourse.difficulty}</strong>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              /* EXTERNAL / CUSTOM COURSE FIELDS (SHOWN RIGHT HERE IN SECTION 1) */
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[11px] font-semibold">Course Title *</Label>
                    <Input
                      value={customTitle}
                      onChange={(e) => {
                        const newTitle = e.target.value;
                        setCustomTitle(newTitle);
                        if (!isCodeUserEdited || !customCode.trim()) {
                          setCustomCode(generateCourseCode(newTitle, customCategory));
                        }
                      }}
                      placeholder="e.g. Advanced Excel for Business"
                      className="h-8 text-xs bg-background mt-1"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-semibold">Course Code *</Label>
                      <button
                        type="button"
                        onClick={() => {
                          const code = generateCourseCode(customTitle, customCategory);
                          setCustomCode(code);
                          setIsCodeUserEdited(false);
                          toast.success(`⚡ Auto-generated Code: ${code}`);
                        }}
                        className="text-[10px] text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Click to auto-generate course code"
                      >
                        <Sparkles className="h-3 w-3 text-amber-500 animate-pulse" />
                        Auto-Generate
                      </button>
                    </div>
                    <div className="relative mt-1">
                      <Input
                        value={customCode}
                        onChange={(e) => {
                          setCustomCode(e.target.value.toUpperCase());
                          setIsCodeUserEdited(true);
                        }}
                        placeholder="e.g. CRS-EXC-2026-014"
                        className="h-8 text-xs bg-background mt-1 font-mono uppercase tracking-wider pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const code = generateCourseCode(customTitle, customCategory);
                          setCustomCode(code);
                          setIsCodeUserEdited(false);
                          toast.success(`⚡ Regenerated: ${code}`);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                        title="Regenerate course code"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-[11px] font-semibold">Provider *</Label>
                    <Input
                      value={customProvider}
                      onChange={(e) => setCustomProvider(e.target.value)}
                      placeholder="e.g. Udemy Business, Coursera"
                      className="h-8 text-xs bg-background mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">External Course ID</Label>
                    <Input
                      value={externalCourseId}
                      onChange={(e) => setExternalCourseId(e.target.value)}
                      placeholder="e.g. UDEMY-PBI-014"
                      className="h-8 text-xs bg-background mt-1 font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">Course URL</Label>
                    <Input
                      value={courseUrl}
                      onChange={(e) => setCourseUrl(e.target.value)}
                      placeholder="https://www.udemy.com/..."
                      className="h-8 text-xs bg-background mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-[11px] font-semibold">Category *</Label>
                    <Select value={customCategory} onValueChange={setCustomCategory}>
                      <SelectTrigger className="h-8 text-xs bg-background mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Data & Analytics">Data & Analytics</SelectItem>
                        <SelectItem value="Technical">Technical</SelectItem>
                        <SelectItem value="Business & Productivity">Business & Productivity</SelectItem>
                        <SelectItem value="Safety">Safety</SelectItem>
                        <SelectItem value="Leadership">Leadership</SelectItem>
                        <SelectItem value="Compliance">Compliance</SelectItem>
                        <SelectItem value="Operations">Operations</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-[11px] font-semibold">Level *</Label>
                    <Select value={customDifficulty} onValueChange={(v: any) => setCustomDifficulty(v)}>
                      <SelectTrigger className="h-8 text-xs bg-background mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-[11px] font-semibold">Duration (Hours) *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={durationHours}
                      onChange={(e) => setDurationHours(Number(e.target.value) || 0)}
                      className="h-8 text-xs bg-background mt-1 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <Checkbox checked={customCertificate} onCheckedChange={(c) => setCustomCertificate(!!c)} />
                    ☑ Certificate Included Upon Completion
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: COURSE DETAILS */}
          <div className="space-y-3 p-4 rounded-xl border bg-muted/20">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" /> 2. Course Details & Curriculum
              </h3>
              <Badge variant={courseSource === 'catalog' ? 'secondary' : 'outline'} className="text-[10px]">
                {courseSource === 'catalog' ? '🔒 Database Catalog (Read-Only)' : 'Custom Course Specifications'}
              </Badge>
            </div>

            <p className="text-[11px] text-muted-foreground">
              {courseSource === 'catalog'
                ? 'Course information and curriculum specifications automatically loaded from the selected catalog course in MySQL.'
                : 'Custom course description, curriculum modules, and syllabus specifications for your company library.'}
            </p>

            <div className="space-y-3 pt-1">
              <div>
                <Label className="text-[11px] font-semibold">Course Title *</Label>
                <Input
                  value={courseSource === 'catalog' ? (activeCatalogCourse?.title || '') : customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  readOnly={courseSource === 'catalog'}
                  placeholder="e.g. Advanced Business Analytics with Power BI"
                  className={`h-8 text-xs mt-1 ${
                    courseSource === 'catalog'
                      ? 'bg-muted/50 font-semibold cursor-not-allowed select-none'
                      : 'bg-background'
                  }`}
                />
              </div>

              <div>
                <Label className="text-[11px] font-semibold">Description *</Label>
                <Textarea
                  rows={2}
                  value={courseSource === 'catalog' ? (activeCatalogCourse?.description || 'No description provided in catalog.') : customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  readOnly={courseSource === 'catalog'}
                  placeholder="Enter course curriculum overview, topics covered, and learning objectives..."
                  className={`text-xs mt-1 ${
                    courseSource === 'catalog'
                      ? 'bg-muted/50 cursor-not-allowed select-none'
                      : 'bg-background'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] font-semibold">Duration *</Label>
                  <Input
                    value={courseSource === 'catalog' ? `${activeCatalogCourse?.durationHours || 10} Hours` : `${durationHours} Hours`}
                    readOnly={courseSource === 'catalog'}
                    onChange={(e) => {
                      const num = parseInt(e.target.value) || 0;
                      setDurationHours(num);
                    }}
                    className={`h-8 text-xs mt-1 font-mono ${
                      courseSource === 'catalog' ? 'bg-muted/50 font-semibold cursor-not-allowed' : 'bg-background'
                    }`}
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold">Delivery Mode *</Label>
                  <Input
                    value={courseSource === 'catalog' ? 'Online Self-Paced' : customDeliveryMode}
                    onChange={(e) => setCustomDeliveryMode(e.target.value)}
                    readOnly={courseSource === 'catalog'}
                    className={`h-8 text-xs mt-1 ${
                      courseSource === 'catalog' ? 'bg-muted/50 font-semibold cursor-not-allowed' : 'bg-background'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] font-semibold">Level</Label>
                  <Input
                    value={courseSource === 'catalog' ? (activeCatalogCourse?.difficulty || 'Intermediate') : customDifficulty}
                    readOnly
                    className="h-8 text-xs mt-1 bg-muted/50 text-emerald-600 font-bold cursor-not-allowed"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold">Category</Label>
                  <Input
                    value={courseSource === 'catalog' ? (activeCatalogCourse?.category || 'Technical') : customCategory}
                    readOnly
                    className="h-8 text-xs mt-1 bg-muted/50 font-semibold cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Course Topics */}
              <div className="space-y-1.5 pt-1">
                <Label className="text-[11px] font-semibold text-foreground">
                  Course Topics ({catalogTopics.length} modules)
                </Label>
                <div className="p-3 rounded-lg border bg-card grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  {catalogTopics.map((topic, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-foreground">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span className="truncate">{topic}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Completion Requirements */}
              <div className="space-y-1 pt-1">
                <Label className="text-[11px] font-semibold text-foreground">Completion Requirements</Label>
                <div className="p-3 rounded-lg border bg-card text-[11px] text-muted-foreground space-y-1">
                  <div className="flex items-center gap-2 text-foreground">
                    <span>• Complete all {catalogTopics.length} modules</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <span>
                      • Assessment:{' '}
                      <strong>
                        {courseSource === 'catalog'
                          ? (activeCatalogCourse?.assessmentIncluded ? 'Included (70% Passing Threshold)' : 'Not Required')
                          : (customAssessment ? 'Included (70% Passing Threshold)' : 'Not Required')}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <span>
                      • Certificate issued after completion:{' '}
                      <strong>
                        {courseSource === 'catalog'
                          ? (activeCatalogCourse?.certificateIncluded ? 'Yes' : 'No')
                          : (customCertificate ? 'Yes' : 'No')}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: LICENSE & PURCHASE DETAILS */}
          <div className="space-y-3 p-4 rounded-xl border bg-muted/20">
            <h3 className="font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-1.5">
              <ShoppingCart className="h-4 w-4" /> 3. License & Purchase Details
            </h3>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Purchase Type *</Label>
              <div className="flex flex-wrap items-center gap-4">
                {(['Company License', 'Subscription', 'Individual Seats'] as const).map((type) => (
                  <label key={type} className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="purchaseType"
                      checked={purchaseType === type}
                      onChange={() => setPurchaseType(type)}
                      className="accent-primary"
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px]">Purchase Date *</Label>
                <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="h-8 text-xs bg-background mt-1" />
              </div>
              <div>
                <Label className="text-[11px]">License / Order ID *</Label>
                <Input value={orderId} onChange={(e) => setOrderId(e.target.value)} className="h-8 text-xs bg-background mt-1 font-mono" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px]">Number of Seats *</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="e.g. 25"
                  value={seatsPurchased}
                  onChange={(e) => setSeatsPurchased(e.target.value === '' ? '' : Number(e.target.value))}
                  className="h-8 text-xs bg-background mt-1 font-mono"
                />
              </div>
              <div>
                <Label className="text-[11px]">Price per Seat (₹) *</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="e.g. 2500"
                  value={pricePerSeat}
                  onChange={(e) => setPricePerSeat(e.target.value === '' ? '' : Number(e.target.value))}
                  className="h-8 text-xs bg-background mt-1 font-mono"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-between">
              <span className="font-semibold text-xs text-foreground">Total Cost:</span>
              <strong className="text-base font-extrabold text-primary font-mono">₹{totalCost.toLocaleString()}</strong>
            </div>
          </div>

          {/* SECTION 4: COURSE ACCESS PERIOD */}
          <div className="space-y-3 p-4 rounded-xl border bg-muted/20">
            <h3 className="font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> 4. Course Access Period
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px]">Access Start Date *</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-8 text-xs bg-background mt-1" />
              </div>
              <div>
                <Label className="text-[11px]">Access Expiry Date</Label>
                <Input type="date" disabled={noExpiry} value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="h-8 text-xs bg-background mt-1" />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-5 pt-1">
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <Checkbox checked={noExpiry} onCheckedChange={(c) => setNoExpiry(!!c)} />
                No Expiry (Lifetime Access)
              </label>

              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <Checkbox checked={certificateAvailable} onCheckedChange={(c) => setCertificateAvailable(!!c)} />
                ☑ Certificate Available
              </label>

              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <Checkbox checked={employeesCanAccess} onCheckedChange={(c) => setEmployeesCanAccess(!!c)} />
                ☑ Employees Can Access Course
              </label>
            </div>
          </div>

          {/* SECTION 5: COMPANY USAGE RULES */}
          <div className="space-y-3 p-4 rounded-xl border bg-muted/20">
            <h3 className="font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Users className="h-4 w-4" /> 5. Assignment Settings & Usage Rules
            </h3>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Who can use this course?</Label>
              <div className="flex flex-wrap items-center gap-4">
                {(['Selected Employees', 'Department', 'Designation', 'All Employees'] as const).map((scope) => (
                  <label key={scope} className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="assignmentScope"
                      checked={assignmentScope === scope}
                      onChange={() => setAssignmentScope(scope)}
                      className="accent-primary"
                    />
                    {scope}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Seat Allocation Mode</Label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                  <input
                    type="radio"
                    name="seatAllocationMode"
                    checked={seatAllocationMode === 'Manual'}
                    onChange={() => setSeatAllocationMode('Manual')}
                    className="accent-primary"
                  />
                  ● Assign seats manually
                </label>
                <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                  <input
                    type="radio"
                    name="seatAllocationMode"
                    checked={seatAllocationMode === 'Auto'}
                    onChange={() => setSeatAllocationMode('Auto')}
                    className="accent-primary"
                  />
                  ○ Auto-assign when requested
                </label>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-5 pt-1">
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <Checkbox checked={allowEmployeeRequest} onCheckedChange={(c) => setAllowEmployeeRequest(!!c)} />
                ☑ Allow employees to request this course
              </label>

              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <Checkbox checked={managerApprovalRequired} onCheckedChange={(c) => setManagerApprovalRequired(!!c)} />
                ☑ Manager approval required
              </label>
            </div>
          </div>

          {/* SECTION 5: NOTIFICATIONS */}
          <div className="space-y-3 p-4 rounded-xl border bg-muted/20">
            <h3 className="font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Bell className="h-4 w-4" /> 5. Notifications
            </h3>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <Checkbox checked={notifyPortal} onCheckedChange={(c) => setNotifyPortal(!!c)} />
                ☑ Portal Notification
              </label>

              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <Checkbox checked={notifyEmail} onCheckedChange={(c) => setNotifyEmail(!!c)} />
                ☑ Email Notification
              </label>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} className="gap-1.5 text-xs bg-primary text-primary-foreground font-semibold px-5 shadow-xs">
            <Plus className="h-4 w-4" /> {initialCourseRequest ? 'Approve & Confirm Purchase (1 Seat)' : 'Add to Company Courses'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ⑧ ENROLLMENT SUCCESS RESULT MODAL
interface EnrollSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    courseTitle: string;
    enrolledCount: number;
    seatsRemaining: number;
    portalNotifSent: number;
    emailSent: number;
  } | null;
  onViewEnrollments: () => void;
  onViewNotifications: () => void;
}

export function EnrollSuccessModal({
  isOpen,
  onClose,
  data,
  onViewEnrollments,
  onViewNotifications,
}: EnrollSuccessModalProps) {
  if (!data) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader className="border-b pb-3 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <DialogTitle className="text-lg font-extrabold text-foreground">
            ✓ {data.enrolledCount} Employees Enrolled Successfully
          </DialogTitle>
          <DialogDescription className="text-xs font-semibold text-primary">
            {data.courseTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-3 text-xs">
          <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-card border font-mono">
            <div className="p-2 rounded-lg bg-primary/5 border border-primary/20">
              <span className="text-[10px] text-muted-foreground block font-sans">Seats Allocated</span>
              <strong className="text-base font-extrabold text-primary">{data.enrolledCount}</strong>
            </div>
            <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <span className="text-[10px] text-muted-foreground block font-sans">Seats Remaining</span>
              <strong className="text-base font-extrabold text-emerald-600">{data.seatsRemaining}</strong>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-muted/30 border text-left">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <div>
                <span className="text-[10px] text-muted-foreground block">Portal Notifications:</span>
                <strong className="font-bold text-foreground">{data.portalNotifSent} Sent</strong>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <div>
                <span className="text-[10px] text-muted-foreground block">Email Dispatches:</span>
                <strong className="font-bold text-foreground">{data.emailSent} Sent</strong>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-3 flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onClose();
              onViewEnrollments();
            }}
            className="text-xs font-semibold"
          >
            View Enrollments
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onClose();
              onViewNotifications();
            }}
            className="text-xs font-semibold"
          >
            View Notifications
          </Button>
          <Button size="sm" onClick={onClose} className="text-xs bg-primary text-primary-foreground font-semibold">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ⑨ VIEW COMPANY COURSE MODAL (Read-Only License Info)
interface ViewCompanyCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyCourse: CompanyCourse | null;
  onViewEnrollments: () => void;
}

export function ViewCompanyCourseModal({
  isOpen,
  onClose,
  companyCourse,
  onViewEnrollments,
}: ViewCompanyCourseModalProps) {
  if (!companyCourse) return null;

  const totalCost = companyCourse.purchasedSeats * 2500;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <DialogTitle className="text-base font-bold">{companyCourse.title}</DialogTitle>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {companyCourse.courseCode}
            </Badge>
          </div>
          <DialogDescription className="text-xs">
            Provider: <strong>{companyCourse.provider}</strong> • Status: <strong className="text-emerald-600">ACTIVE</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Seat Math Cards */}
          <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-card border font-mono text-center">
            <div className="p-2 rounded-lg bg-primary/5 border border-primary/20">
              <span className="text-[10px] text-muted-foreground block font-sans">Purchased Seats</span>
              <strong className="text-base font-extrabold text-foreground">{companyCourse.purchasedSeats}</strong>
            </div>
            <div className="p-2 rounded-lg bg-indigo-500/5 border border-indigo-500/20">
              <span className="text-[10px] text-muted-foreground block font-sans">Assigned Seats</span>
              <strong className="text-base font-extrabold text-primary">{companyCourse.assignedSeats}</strong>
            </div>
            <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <span className="text-[10px] text-muted-foreground block font-sans">Available Seats</span>
              <strong className="text-base font-extrabold text-emerald-600">{companyCourse.availableSeats}</strong>
            </div>
          </div>

          <div className="space-y-2 p-3.5 rounded-xl border bg-muted/20">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">License & Financial Details</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-muted-foreground">Purchase Date:</span> <strong>{companyCourse.purchasedAt || '03-Sep-2026'}</strong></div>
              <div><span className="text-muted-foreground">Category:</span> <strong>{companyCourse.category}</strong></div>
              <div><span className="text-muted-foreground">Price per Seat:</span> <strong className="font-mono">₹2,500</strong></div>
              <div><span className="text-muted-foreground">Total Value:</span> <strong className="font-mono text-primary">₹{totalCost.toLocaleString()}</strong></div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-card border text-center text-[11px]">
            <div><span className="text-muted-foreground block">Active Enrollments:</span> <strong>{companyCourse.assignedSeats}</strong></div>
            <div><span className="text-muted-foreground block">In Progress:</span> <strong>{companyCourse.inProgressCount}</strong></div>
            <div><span className="text-muted-foreground block">Completed:</span> <strong>{companyCourse.completedCount}</strong></div>
          </div>
        </div>

        <DialogFooter className="border-t pt-3 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onClose();
              onViewEnrollments();
            }}
            className="text-xs"
          >
            View Enrollments
          </Button>
          <Button size="sm" onClick={onClose} className="text-xs bg-primary text-primary-foreground">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ⑩ MANAGE COMPANY SEATS MODAL (Seat Allocation & Release Roster)
interface ManageCompanySeatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyCourse: CompanyCourse | null;
  enrollments: CourseEnrollment[];
  onReleaseSeat: (enrollmentId: string) => void;
  onAssignEmployees: (cc: CompanyCourse) => void;
  onPurchaseMoreSeats: (cc: CompanyCourse) => void;
}

export function ManageCompanySeatsModal({
  isOpen,
  onClose,
  companyCourse,
  enrollments,
  onReleaseSeat,
  onAssignEmployees,
  onPurchaseMoreSeats,
}: ManageCompanySeatsModalProps) {
  if (!companyCourse) return null;

  const courseEnrollments = enrollments.filter((e) => e.courseId === companyCourse.courseId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              <DialogTitle className="text-base font-bold">MANAGE SEATS</DialogTitle>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {companyCourse.courseCode}
            </Badge>
          </div>
          <DialogDescription className="text-xs">
            Course: <strong>{companyCourse.title}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Seat Math Banner */}
          <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-card border text-center font-mono">
            <div>
              <span className="text-[10px] text-muted-foreground block font-sans">Purchased</span>
              <strong className="text-base font-extrabold text-foreground">{companyCourse.purchasedSeats}</strong>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block font-sans">Assigned</span>
              <strong className="text-base font-extrabold text-primary">{companyCourse.assignedSeats}</strong>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block font-sans">Available</span>
              <strong className="text-base font-extrabold text-emerald-600">{companyCourse.availableSeats}</strong>
            </div>
          </div>

          {/* Seat Allocation Roster */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Seat Allocation Roster ({courseEnrollments.length})</span>
              <span className="text-[10px] font-normal italic">Only unstarted seats can be released</span>
            </h4>

            {courseEnrollments.length === 0 ? (
              <div className="p-6 text-center border rounded-xl bg-muted/20 text-muted-foreground">
                No seats currently assigned to employees.
              </div>
            ) : (
              <div className="border rounded-xl divide-y max-h-60 overflow-y-auto">
                {courseEnrollments.map((enr) => {
                  const canRelease = enr.progress === 0 && enr.status === 'Not Started';

                  return (
                    <div key={enr.id} className="p-3 flex items-center justify-between gap-3 bg-card hover:bg-muted/10 transition-colors">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <strong className="text-foreground text-xs">{enr.employeeName}</strong>
                          <Badge variant="outline" className="text-[9px] font-mono">{enr.employeeId}</Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Department: {enr.department} • Assigned: {enr.assignedDate} • Progress: {enr.progress}%
                        </p>
                      </div>

                      {canRelease ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onReleaseSeat(enr.id)}
                          className="h-7 text-[11px] text-destructive border-destructive/30 hover:bg-destructive/10"
                        >
                          Release Seat
                        </Button>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30">
                          In Use ({enr.progress}%)
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t pt-3 flex flex-col sm:flex-row gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                onClose();
                onAssignEmployees(companyCourse);
              }}
              className="text-xs bg-primary text-primary-foreground font-semibold gap-1.5"
            >
              <Users className="h-3.5 w-3.5" /> Assign Employees
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onPurchaseMoreSeats(companyCourse);
              }}
              className="text-xs border-primary/30 text-primary hover:bg-primary/10 gap-1.5 font-semibold"
            >
              <Plus className="h-3.5 w-3.5" /> Purchase More Seats
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ⑪ DELETE COMPANY COURSE MODAL (Safety Protection against Active Enrollments)
interface DeleteCompanyCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyCourse: CompanyCourse | null;
  activeEnrollmentCount: number;
  onConfirmDelete: (courseId: string) => void;
}

export function DeleteCompanyCourseModal({
  isOpen,
  onClose,
  companyCourse,
  activeEnrollmentCount,
  onConfirmDelete,
}: DeleteCompanyCourseModalProps) {
  if (!companyCourse) return null;

  const hasActiveEnrollments = activeEnrollmentCount > 0 || companyCourse.assignedSeats > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center gap-2">
            <AlertCircle className={`h-5 w-5 ${hasActiveEnrollments ? 'text-amber-500' : 'text-destructive'}`} />
            <DialogTitle className="text-base font-bold">
              {hasActiveEnrollments ? 'CANNOT DELETE COMPANY COURSE' : 'DELETE COMPANY COURSE ENTRY'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs font-semibold text-foreground">
            {companyCourse.title} ({companyCourse.courseCode})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {hasActiveEnrollments ? (
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-2">
              <h4 className="font-bold text-xs text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" /> Active Employee Enrollments Exist ({activeEnrollmentCount || companyCourse.assignedSeats})
              </h4>
              <p className="text-amber-700 dark:text-amber-400">
                You cannot delete this company course entry while active employee enrollments exist.
              </p>
              <p className="text-muted-foreground text-[11px]">
                Please release or complete employee seat enrollments before removing this course from the company library.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border bg-muted/20 space-y-1">
                <p className="font-medium text-foreground">
                  Are you sure you want to delete this company course entry from your library?
                </p>
                <p className="text-muted-foreground text-[11px]">
                  This will remove the company course entry and its unused seat allocation ledger. The Master Course will remain available in the Course Catalog.
                </p>
              </div>

              <div className="p-3 rounded-lg border bg-card text-center font-mono">
                <span className="text-[10px] text-muted-foreground block font-sans">Unused Seats Removed:</span>
                <strong className="text-sm font-bold text-destructive">{companyCourse.availableSeats} Available Seats</strong>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            {hasActiveEnrollments ? 'Close' : 'Cancel'}
          </Button>

          {!hasActiveEnrollments && (
            <Button
              size="sm"
              onClick={() => {
                onConfirmDelete(companyCourse.courseId);
                onClose();
              }}
              className="text-xs bg-destructive hover:bg-destructive/90 text-white font-semibold gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete Course Entry
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

