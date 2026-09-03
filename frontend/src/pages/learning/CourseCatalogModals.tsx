import { useState } from 'react';
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
import {
  MOCK_EMPLOYEES,
  type MarketplaceCourse,
  type CompanyCourse,
  type CourseRequest,
  type PurchaseHistoryRecord,
} from './mockTrainingData';
import { notificationStore } from '@/utils/notificationStore';

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
              <Layers className="h-3.5 w-3.5 text-primary" /> Modules & Curriculum Outline ({course.modules.length})
            </Label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto p-2 bg-background border rounded-lg">
              {course.modules.map((m, idx) => (
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
  const [seats, setSeats] = useState<number>(25);
  const [billingEntity, setBillingEntity] = useState<string>('EHCM Technologies Pvt Ltd');
  const [costCenter, setCostCenter] = useState<string>('HR-L&D');
  const [purchaseReason, setPurchaseReason] = useState<string>('Employee skill development & workforce training');

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
  onConfirmEnrollment,
}: EnrollEmployeesModalProps) {
  const [selectedDept, setSelectedDept] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [notifyPortal, setNotifyPortal] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);

  if (!companyCourse) return null;

  const availableSeats = companyCourse.availableSeats;

  const filteredEmployees = MOCK_EMPLOYEES.filter((emp) => {
    if (selectedDept !== 'All' && emp.department !== selectedDept) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return emp.name.toLowerCase().includes(q) || emp.id.toLowerCase().includes(q) || emp.department.toLowerCase().includes(q);
    }
    return true;
  });

  const handleToggleEmployee = (id: string) => {
    if (selectedEmpIds.includes(id)) {
      setSelectedEmpIds(selectedEmpIds.filter((e) => e !== id));
    } else {
      if (selectedEmpIds.length >= availableSeats) {
        toast.error(`Cannot select more than ${availableSeats} available seats.`);
        return;
      }
      setSelectedEmpIds([...selectedEmpIds, id]);
    }
  };

  const handleEnrollSubmit = () => {
    if (selectedEmpIds.length === 0) {
      toast.error('Please select at least one employee.');
      return;
    }

    onConfirmEnrollment(companyCourse.courseId, selectedEmpIds, notifyPortal, notifyEmail);
    toast.success(`✓ ${selectedEmpIds.length} Employees Enrolled! Portal notifications & emails dispatched.`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> ENROLL EMPLOYEES
            </DialogTitle>
            <Badge variant="default" className="text-xs bg-primary text-primary-foreground">
              Available Seats: {availableSeats}
            </Badge>
          </div>
          <DialogDescription className="text-xs">
            Course: <strong>{companyCourse.title}</strong> ({companyCourse.provider})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Seat Math Alert */}
          <div className="p-3 rounded-lg border bg-muted/30 flex items-center justify-between">
            <span>Seats Selected: <strong className="text-foreground">{selectedEmpIds.length}</strong></span>
            <span>Available Seats: <strong className="text-foreground">{availableSeats}</strong></span>
            <span>Remaining Seats: <strong className="text-emerald-600 font-bold">{availableSeats - selectedEmpIds.length}</strong></span>
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
                <SelectItem value="Operations">Operations</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="HR">HR</SelectItem>
                <SelectItem value="QA">QA</SelectItem>
                <SelectItem value="IT">IT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Employee Master Checklist */}
          <div className="border rounded-lg max-h-52 overflow-y-auto divide-y">
            {filteredEmployees.map((emp) => {
              const isChecked = selectedEmpIds.includes(emp.id);
              return (
                <div
                  key={emp.id}
                  onClick={() => handleToggleEmployee(emp.id)}
                  className={`flex items-center justify-between p-2.5 text-xs cursor-pointer hover:bg-muted/40 transition-colors ${
                    isChecked ? 'bg-primary/5 font-semibold' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Checkbox checked={isChecked} onCheckedChange={() => handleToggleEmployee(emp.id)} />
                    <div>
                      <span className="font-semibold text-foreground">{emp.name}</span>
                      <span className="text-[10px] text-muted-foreground font-mono ml-2">({emp.id})</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <Badge variant="outline">{emp.department}</Badge>
                    <span className="text-muted-foreground">{emp.designation}</span>
                  </div>
                </div>
              );
            })}
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
        </div>

        <DialogFooter className="border-t pt-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button size="sm" onClick={handleEnrollSubmit} className="gap-1.5 text-xs bg-primary text-primary-foreground">
            <Users className="h-4 w-4" /> Enroll Selected ({selectedEmpIds.length})
          </Button>
        </DialogFooter>
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
          <div className="p-3 rounded-lg bg-muted/30 border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground text-sm">{request.courseTitle}</span>
              <Badge variant="outline" className="font-mono text-[10px]">₹{request.pricePerSeat.toLocaleString()} / Seat</Badge>
            </div>
            <p className="text-muted-foreground">Provider: <strong>{request.provider}</strong></p>
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
  const [additionalSeats, setAdditionalSeats] = useState<number>(5);

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
  course: MarketplaceCourse | null;
  onSubmitRequest: (reqData: {
    courseId: string;
    courseTitle: string;
    provider: string;
    pricePerSeat: number;
    reason: string;
    businessBenefit: string;
    priority: 'High' | 'Medium' | 'Low';
  }) => void;
}

export function EmployeeRequestCourseModal({
  isOpen,
  onClose,
  course,
  onSubmitRequest,
}: EmployeeRequestCourseModalProps) {
  const [reason, setReason] = useState('');
  const [businessBenefit, setBusinessBenefit] = useState('');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('High');

  if (!course) return null;

  const handleSubmit = () => {
    if (!reason.trim()) {
      toast.error('Please enter a reason for requesting this course.');
      return;
    }

    onSubmitRequest({
      courseId: course.id,
      courseTitle: course.title,
      provider: course.provider,
      pricePerSeat: course.pricePerSeat,
      reason: reason.trim(),
      businessBenefit: businessBenefit.trim() || 'Skill enhancement for department projects.',
      priority,
    });

    toast.success(`✓ Course Request Submitted for ${course.title}! Sent to HR Course Requests.`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> REQUEST COURSE
          </DialogTitle>
          <DialogDescription className="text-xs">
            Submit a formal training course request to HR for approval and seat purchasing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Course Summary Card */}
          <div className="p-3 rounded-lg bg-muted/40 border space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground">{course.title}</span>
              <Badge variant="outline" className="font-mono text-[10px]">{course.code}</Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Provider: <strong>{course.provider}</strong> • Price per Seat: <strong>₹{course.pricePerSeat.toLocaleString()}</strong>
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Why do you need this course? *</Label>
            <Textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Required for upcoming enterprise AWS migration project..."
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Business Benefit</Label>
            <Textarea
              rows={2}
              value={businessBenefit}
              onChange={(e) => setBusinessBenefit(e.target.value)}
              placeholder="e.g. Improve cloud architecture skills and ensure zero downtime..."
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Priority Level *</Label>
            <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="High">High Priority</SelectItem>
                <SelectItem value="Medium">Medium Priority</SelectItem>
                <SelectItem value="Low">Low Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="border-t pt-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} className="gap-1.5 text-xs bg-primary text-primary-foreground">
            <Send className="h-3.5 w-3.5" /> Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

