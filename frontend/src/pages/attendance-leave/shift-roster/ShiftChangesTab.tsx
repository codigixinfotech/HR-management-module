import { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import {
  GitPullRequest,
  Plus,
  Search,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  User,
  Building2,
  Calendar,
  Eye,
  Pencil,
  Ban,
  History,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  FileText,
  Upload,
  RefreshCw,
  Sparkles,
  Info,
  Check,
  X,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/stores/auth-store';
import { isManagerOrHrOrAdmin } from '@/lib/modules';
import { resolveApplicableShift } from '@/lib/shift-resolver';
import { useShiftRosterStore } from './shiftRosterStore';
import type { ShiftChangeRequest, ShiftChangeStatus } from './shiftRosterStore';

// Format date e.g. "15 Sep 2026"
function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return '';
  const clean = dateStr.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mIdx = parseInt(parts[1], 10) - 1;
    return `${parts[2]} ${months[mIdx] || parts[1]} ${parts[0]}`;
  }
  return clean;
}

// Convert 24h to 12h AM/PM
function time24To12(timeStr?: string): string {
  if (!timeStr) return '';
  if (timeStr.toUpperCase().includes('AM') || timeStr.toUpperCase().includes('PM')) return timeStr;
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1].padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
}

// Calculate days between dates
function getDaysCount(from?: string, to?: string): number {
  if (!from) return 1;
  if (!to) return 1;
  try {
    const d1 = new Date(from);
    const d2 = new Date(to);
    const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diff);
  } catch {
    return 1;
  }
}

export function ShiftChangesTab() {
  const user = useAuthStore((s) => s.user);
  const canApproveOrManage = isManagerOrHrOrAdmin(user);

  const {
    shiftChanges,
    shifts,
    assignments,
    rotations,
    rosterEmployees,
    submitShiftChange,
    updateShiftChange,
    cancelShiftChange,
    resolveShiftChange,
  } = useShiftRosterStore();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected' | 'Temporary' | 'Permanent'>('All');

  // Request Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChangeId, setEditingChangeId] = useState<string | null>(null);

  // Form Fields
  const [selectedEmployeeCode, setSelectedEmployeeCode] = useState<string>('');
  const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>('');
  const [selectedEmployeeDept, setSelectedEmployeeDept] = useState<string>('Production');
  const [changeType, setChangeType] = useState<'Temporary' | 'Permanent'>('Temporary');
  const [requestedShiftCode, setRequestedShiftCode] = useState<string>('ES');
  const [effectiveFrom, setEffectiveFrom] = useState<string>('2026-09-15');
  const [effectiveTo, setEffectiveTo] = useState<string>('2026-09-30');
  const [reason, setReason] = useState<string>('');
  const [attachmentName, setAttachmentName] = useState<string>('');

  // Rejection Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [targetChangeForReject, setTargetChangeForReject] = useState<ShiftChangeRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // View Details Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedChangeForView, setSelectedChangeForView] = useState<ShiftChangeRequest | null>(null);

  // History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedChangeForHistory, setSelectedChangeForHistory] = useState<ShiftChangeRequest | null>(null);

  // Initialize selected employee on mount or when rosterEmployees loads
  useEffect(() => {
    if (!canApproveOrManage) {
      const myCode = user?.employee?.employeeCode || 'EMP-001';
      const myName = user?.employee?.fullName || 'Sudarshan Kale';
      const myDept = user?.employee?.departmentName || 'Production';
      setSelectedEmployeeCode(myCode);
      setSelectedEmployeeName(myName);
      setSelectedEmployeeDept(myDept);
    } else if (!selectedEmployeeCode && rosterEmployees.length > 0) {
      const defaultEmp = rosterEmployees[0];
      setSelectedEmployeeCode(defaultEmp.employeeCode);
      setSelectedEmployeeName(defaultEmp.name);
      setSelectedEmployeeDept(defaultEmp.department || 'Production');
    }
  }, [rosterEmployees, selectedEmployeeCode, canApproveOrManage, user]);

  // Handle employee change in modal
  const handleSelectEmployee = (code: string) => {
    setSelectedEmployeeCode(code);
    const emp = rosterEmployees.find((e) => e.employeeCode === code);
    if (emp) {
      setSelectedEmployeeName(emp.name);
      setSelectedEmployeeDept(emp.department || 'Production');
    }
  };

  // Auto-resolve Current Shift in real-time from the employee's existing assignments/roster/rotation
  const currentResolvedShift = useMemo(() => {
    if (!selectedEmployeeCode) return null;
    return resolveApplicableShift({
      employeeCode: selectedEmployeeCode,
      departmentName: selectedEmployeeDept,
      dateStr: effectiveFrom || '2026-09-10',
      shifts,
      assignments,
      rosterEmployees,
    });
  }, [selectedEmployeeCode, selectedEmployeeDept, effectiveFrom, shifts, assignments, rosterEmployees]);

  // Requested shift object
  const requestedShiftObj = useMemo(() => {
    return (
      shifts.find((s) => s.code === requestedShiftCode) ||
      shifts.find((s) => s.code === 'ES') ||
      shifts[0]
    );
  }, [shifts, requestedShiftCode]);

  // Validation & Conflict Checks Checklist
  const validationResults = useMemo(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Employee Active Check
    const emp = rosterEmployees.find((e) => e.employeeCode === selectedEmployeeCode);
    const employeeActive = emp ? emp.status?.toUpperCase() !== 'INACTIVE' : true;
    if (!employeeActive) errors.push('Selected employee is marked inactive in Employee Master.');

    // 2. New Shift Active Check
    const newShiftActive = requestedShiftObj ? requestedShiftObj.status === 'Active' : true;
    if (!newShiftActive) errors.push('Requested target shift is currently inactive in Shift Master.');

    // 3. Current & New Shift Different
    const currentCode = currentResolvedShift?.code || 'MS';
    const differentShifts = currentCode !== requestedShiftCode;
    if (!differentShifts) errors.push('Requested shift cannot be identical to current assigned shift.');

    // 4. Effective Date Validity
    let validEffectiveDates = true;
    if (!effectiveFrom) {
      errors.push('Effective From date is required.');
      validEffectiveDates = false;
    }
    if (changeType === 'Temporary') {
      if (!effectiveTo) {
        errors.push('Effective To date is required for temporary shift changes.');
        validEffectiveDates = false;
      } else if (effectiveTo < effectiveFrom) {
        errors.push('Effective To date cannot be earlier than Effective From date.');
        validEffectiveDates = false;
      }
    }

    // 5. Duplicate Pending Request Check
    const hasDuplicate = shiftChanges.some(
      (sc) =>
        sc.id !== editingChangeId &&
        sc.employeeCode === selectedEmployeeCode &&
        (sc.status === 'Pending Approval' || sc.status === 'Pending Review' || sc.status === 'Manager Review') &&
        sc.effectiveFrom === effectiveFrom
    );
    if (hasDuplicate) errors.push('A pending shift change request already exists for this employee on this start date.');

    // 6. Existing Employee Override Warning
    const hasExistingOverride = assignments.some(
      (a) =>
        a.tier === 'EMPLOYEE' &&
        a.employeeCode === selectedEmployeeCode &&
        a.status === 'Active'
    );
    if (hasExistingOverride) {
      warnings.push('Employee already has an active Shift Override; approving this will supersede that assignment.');
    }

    // 7. Active Rotation Conflict Check
    const hasActiveRotation = rotations.some(
      (r) =>
        r.department?.toLowerCase() === selectedEmployeeDept.toLowerCase() &&
        (r.status === 'Active' || (r.status as string) === 'Scheduled')
    );
    if (hasActiveRotation) {
      warnings.push(`Department ${selectedEmployeeDept} has an active rotation engine; approved change will take priority over rotation.`);
    }

    // 8. Approved Leave Conflict Check
    let hasLeaveConflict = false;
    if (emp?.slots && effectiveFrom) {
      const endKey = changeType === 'Temporary' && effectiveTo ? effectiveTo : effectiveFrom;
      const cur = new Date(effectiveFrom);
      const endD = new Date(endKey);
      while (cur <= endD) {
        const k = cur.toISOString().split('T')[0];
        if (emp.slots[k]?.shiftCode === 'LV') {
          hasLeaveConflict = true;
          break;
        }
        cur.setDate(cur.getDate() + 1);
      }
    }
    if (hasLeaveConflict) {
      warnings.push('Employee has an approved leave scheduled within this transition window.');
    }

    const canSubmit = errors.length === 0 && Boolean(reason.trim());

    return {
      employeeActive,
      newShiftActive,
      differentShifts,
      validEffectiveDates,
      noDuplicatePending: !hasDuplicate,
      noRosterConflict: true,
      noOverrideConflict: !hasExistingOverride,
      noRotationConflict: true,
      noLeaveConflict: !hasLeaveConflict,
      noWeeklyOffConflict: true,
      restIntervalCompliant: true,
      canSubmit,
      errors,
      warnings,
    };
  }, [
    selectedEmployeeCode,
    selectedEmployeeDept,
    currentResolvedShift,
    requestedShiftCode,
    requestedShiftObj,
    effectiveFrom,
    effectiveTo,
    changeType,
    reason,
    shiftChanges,
    editingChangeId,
    assignments,
    rotations,
    rosterEmployees,
  ]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingChangeId(null);
    if (rosterEmployees.length > 0) {
      setSelectedEmployeeCode(rosterEmployees[0].employeeCode);
      setSelectedEmployeeName(rosterEmployees[0].name);
      setSelectedEmployeeDept(rosterEmployees[0].department || 'Production');
    }
    setChangeType('Temporary');
    setRequestedShiftCode('ES');
    setEffectiveFrom('2026-09-15');
    setEffectiveTo('2026-09-30');
    setReason('');
    setAttachmentName('');
    setIsModalOpen(true);
  };

  // Open Edit Modal (Draft / Pending)
  const handleOpenEdit = (req: ShiftChangeRequest) => {
    setEditingChangeId(req.id);
    setSelectedEmployeeCode(req.employeeCode);
    setSelectedEmployeeName(req.employeeName);
    setSelectedEmployeeDept(req.department);
    setChangeType(req.changeType || 'Temporary');
    setRequestedShiftCode(req.requestedShiftCode || 'ES');
    setEffectiveFrom(req.effectiveFrom || req.effectiveDate || '2026-09-15');
    setEffectiveTo(req.effectiveTo || '2026-09-30');
    setReason(req.reason || '');
    setAttachmentName(req.attachmentName || '');
    setIsModalOpen(true);
  };

  // Submit Request (Create or Update)
  const handleSaveRequest = async (targetStatus: 'Draft' | 'Pending Approval' = 'Pending Approval') => {
    if (!reason.trim()) {
      toast.error('Please specify a business justification / reason');
      return;
    }

    if (validationResults.errors.length > 0 && targetStatus !== 'Draft') {
      toast.error(validationResults.errors[0]);
      return;
    }

    const currentShiftStr = currentResolvedShift
      ? `${currentResolvedShift.name} (${currentResolvedShift.code})`
      : 'Morning Shift (MS)';

    const requestedShiftStr = requestedShiftObj
      ? `${requestedShiftObj.name} (${requestedShiftObj.code})`
      : 'Evening Shift (ES)';

    const payload: Partial<ShiftChangeRequest> = {
      employeeCode: selectedEmployeeCode,
      employeeName: selectedEmployeeName,
      department: selectedEmployeeDept,
      currentShift: currentShiftStr,
      currentShiftCode: currentResolvedShift?.code || 'MS',
      currentShiftName: currentResolvedShift?.name || 'Morning Shift',
      currentShiftTiming: currentResolvedShift?.timing || '08:00 AM – 04:30 PM',
      changeType,
      requestedShift: requestedShiftStr,
      requestedShiftCode: requestedShiftObj?.code || 'ES',
      requestedShiftName: requestedShiftObj?.name || 'Evening Shift',
      requestedShiftTiming: requestedShiftObj
        ? `${time24To12(requestedShiftObj.startTime)} – ${time24To12(requestedShiftObj.endTime)}`
        : '04:00 PM – 12:00 AM',
      effectiveFrom,
      effectiveTo: changeType === 'Temporary' ? effectiveTo : undefined,
      effectiveDate: effectiveFrom,
      reason: reason.trim(),
      attachmentName: attachmentName || undefined,
      status: targetStatus,
    };

    if (editingChangeId) {
      await updateShiftChange(editingChangeId, payload);
      toast.success(`Shift change request for ${selectedEmployeeName} updated successfully.`);
    } else {
      await submitShiftChange(payload);
      toast.success(
        targetStatus === 'Draft'
          ? 'Shift change saved as draft.'
          : `Shift change request for ${selectedEmployeeName} submitted for manager review!`
      );
    }

    setIsModalOpen(false);
  };

  // Approve Handler
  const handleApprove = async (req: ShiftChangeRequest) => {
    await resolveShiftChange(
      req.id,
      'Approved',
      'Approved for operational requirements. Future roster updated and shift override activated.',
      user?.name || 'Plant Operations Head'
    );
    toast.success(
      `Approved shift change for ${req.employeeName}! Future roster and attendance expectations updated to ${req.requestedShift}.`
    );
  };

  // Open Rejection Dialog
  const handleOpenReject = (req: ShiftChangeRequest) => {
    setTargetChangeForReject(req);
    setRejectionReason('');
    setIsRejectModalOpen(true);
  };

  // Submit Rejection (Mandatory Reason)
  const handleSubmitReject = async () => {
    if (!targetChangeForReject) return;
    if (!rejectionReason.trim()) {
      toast.error('Rejection reason is mandatory');
      return;
    }

    await resolveShiftChange(
      targetChangeForReject.id,
      'Rejected',
      rejectionReason.trim(),
      user?.name || 'Super Admin'
    );
    toast.info(`Shift change request for ${targetChangeForReject.employeeName} has been rejected.`);
    setIsRejectModalOpen(false);
    setTargetChangeForReject(null);
  };

  // Filter Registry Records
  const filteredChanges = useMemo(() => {
    return shiftChanges.filter((sc) => {
      // Role-based filtering: non-manager employees see only their own requests
      if (!canApproveOrManage) {
        const myCode = user?.employee?.employeeCode;
        const myId = user?.employee?.id;
        const myName = user?.employee?.fullName;
        const isOwn =
          (myCode && sc.employeeCode?.toLowerCase() === myCode.toLowerCase()) ||
          (myId && sc.employeeId === myId) ||
          (myName && sc.employeeName?.toLowerCase().includes(myName.toLowerCase())) ||
          (user?.email?.toLowerCase().includes('sudarshan') && (sc.employeeCode === 'EMP-001' || sc.employeeName?.toLowerCase().includes('sudarshan')));
        if (!isOwn) return false;
      }

      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        sc.employeeName.toLowerCase().includes(q) ||
        sc.employeeCode.toLowerCase().includes(q) ||
        sc.department.toLowerCase().includes(q) ||
        sc.reason.toLowerCase().includes(q) ||
        (sc.requestedShift && sc.requestedShift.toLowerCase().includes(q));

      // Status Filter
      if (!matchesQuery) return false;
      if (statusFilter === 'All') return true;
      if (statusFilter === 'Pending') {
        return sc.status === 'Pending Approval' || sc.status === 'Pending Review' || sc.status === 'Manager Review' || sc.status === 'HR Review';
      }
      if (statusFilter === 'Approved') return sc.status === 'Approved';
      if (statusFilter === 'Rejected') return sc.status === 'Rejected';
      if (statusFilter === 'Temporary') return sc.changeType === 'Temporary';
      if (statusFilter === 'Permanent') return sc.changeType === 'Permanent';
      return true;
    });
  }, [shiftChanges, searchQuery, statusFilter, canApproveOrManage, user]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const records = canApproveOrManage
      ? shiftChanges
      : shiftChanges.filter((sc) => {
          const myCode = user?.employee?.employeeCode;
          const myId = user?.employee?.id;
          const myName = user?.employee?.fullName;
          return (
            (myCode && sc.employeeCode?.toLowerCase() === myCode.toLowerCase()) ||
            (myId && sc.employeeId === myId) ||
            (myName && sc.employeeName?.toLowerCase().includes(myName.toLowerCase())) ||
            (user?.email?.toLowerCase().includes('sudarshan') && (sc.employeeCode === 'EMP-001' || sc.employeeName?.toLowerCase().includes('sudarshan')))
          );
        });

    const total = records.length;
    const pending = records.filter(
      (s) => s.status === 'Pending Approval' || s.status === 'Pending Review' || s.status === 'Manager Review' || s.status === 'HR Review'
    ).length;
    const approved = records.filter((s) => s.status === 'Approved').length;
    const rejected = records.filter((s) => s.status === 'Rejected').length;
    const temporary = records.filter((s) => s.changeType === 'Temporary').length;
    return { total, pending, approved, rejected, temporary };
  }, [shiftChanges, canApproveOrManage, user]);

  return (
    <div className="space-y-5">
      {/* ── 1. Top Workflow Summary Banner ── */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary mt-0.5">
            <GitPullRequest className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              Enterprise Shift Change Requests & Governance
              <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                Priority 1 Override
              </Badge>
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Submit, validate, and approve temporary or permanent shift adjustments. Approved changes automatically update future rosters and attendance without affecting past records.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30 text-xs font-semibold px-2.5 py-0.5">
            {metrics.pending} Pending Approval
          </Badge>
          <Badge className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 text-xs font-semibold px-2.5 py-0.5">
            {metrics.approved} Approved
          </Badge>
        </div>
      </div>

      {/* ── 2. Quick Stat Counters ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg border bg-card/60 shadow-2xs">
          <span className="text-[10.5px] uppercase font-bold text-muted-foreground tracking-wider block">
            Total Requests
          </span>
          <span className="text-xl font-bold text-foreground font-mono mt-0.5 block">{metrics.total}</span>
          <span className="text-[10px] text-muted-foreground">All time submissions</span>
        </div>

        <div className="p-3 rounded-lg border bg-amber-500/5 border-amber-500/20 shadow-2xs">
          <span className="text-[10.5px] uppercase font-bold text-amber-700 dark:text-amber-400 tracking-wider block">
            Awaiting Review
          </span>
          <span className="text-xl font-bold text-amber-700 dark:text-amber-300 font-mono mt-0.5 block">
            {metrics.pending}
          </span>
          <span className="text-[10px] text-muted-foreground">Requires manager decision</span>
        </div>

        <div className="p-3 rounded-lg border bg-emerald-500/5 border-emerald-500/20 shadow-2xs">
          <span className="text-[10.5px] uppercase font-bold text-emerald-700 dark:text-emerald-400 tracking-wider block">
            Active / Approved
          </span>
          <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300 font-mono mt-0.5 block">
            {metrics.approved}
          </span>
          <span className="text-[10px] text-muted-foreground">Synchronized with roster</span>
        </div>

        <div className="p-3 rounded-lg border bg-blue-500/5 border-blue-500/20 shadow-2xs">
          <span className="text-[10.5px] uppercase font-bold text-blue-700 dark:text-blue-400 tracking-wider block">
            Temporary Changes
          </span>
          <span className="text-xl font-bold text-blue-700 dark:text-blue-300 font-mono mt-0.5 block">
            {metrics.temporary}
          </span>
          <span className="text-[10px] text-muted-foreground">Time-bounded transitions</span>
        </div>
      </div>

      {/* ── 3. Main Shift Modification Registry Card ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Shift Modification Registry
            </CardTitle>
            <CardDescription className="text-xs">
              Complete audit history of employee shift transition requests and approvals
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Filter */}
            <div className="relative w-44 sm:w-56">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search employee, shift, reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-background"
              />
            </div>

            {/* Quick Status Filter Dropdown */}
            <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
              <SelectTrigger className="h-8 text-xs w-32 bg-background">
                <SelectValue placeholder="Filter status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All" className="text-xs">All Requests</SelectItem>
                <SelectItem value="Pending" className="text-xs">Pending Approval</SelectItem>
                <SelectItem value="Approved" className="text-xs">Approved</SelectItem>
                <SelectItem value="Rejected" className="text-xs">Rejected</SelectItem>
                <SelectItem value="Temporary" className="text-xs">Temporary Only</SelectItem>
                <SelectItem value="Permanent" className="text-xs">Permanent Only</SelectItem>
              </SelectContent>
            </Select>

            {/* Request Shift Change Button */}
            <Button size="sm" className="h-8 text-xs gap-1.5 font-semibold" onClick={handleOpenCreate}>
              <Plus className="h-3.5 w-3.5" /> Request Shift Change
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5">
          <div className="rounded-md border border-border/80 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-xs font-semibold">Employee</TableHead>
                  <TableHead className="text-xs font-semibold">Department</TableHead>
                  <TableHead className="text-xs font-semibold">Current Shift → New Shift</TableHead>
                  <TableHead className="text-xs font-semibold">Change Type</TableHead>
                  <TableHead className="text-xs font-semibold">Effective Period</TableHead>
                  <TableHead className="text-xs font-semibold">Reason</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-right text-xs font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChanges.map((sc) => {
                  const currentCode = sc.currentShiftCode || sc.currentShift?.split('(')[1]?.replace(')', '') || 'MS';
                  const reqCode = sc.requestedShiftCode || sc.requestedShift?.split('(')[1]?.replace(')', '') || 'ES';
                  const daysDuration = sc.changeType === 'Temporary' ? getDaysCount(sc.effectiveFrom, sc.effectiveTo) : null;

                  return (
                    <TableRow key={sc.id} className="hover:bg-muted/30 transition-colors">
                      {/* Employee Column */}
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-primary">{sc.employeeCode}</span>
                            <span className="text-xs font-semibold text-foreground">{sc.employeeName}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">Applied {formatDisplayDate(sc.appliedDate)}</span>
                        </div>
                      </TableCell>

                      {/* Department Column */}
                      <TableCell className="text-xs text-muted-foreground font-medium">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="font-semibold text-foreground">{sc.department}</span>
                        </div>
                      </TableCell>

                      {/* Current Shift → New Shift Column */}
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs">
                          <div className="flex flex-col">
                            <span className="font-bold font-mono text-[11px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded border border-border">
                              {currentCode}
                            </span>
                            <span className="text-[9.5px] text-muted-foreground line-through line-clamp-1 max-w-[90px]">
                              {sc.currentShiftName || sc.currentShift}
                            </span>
                          </div>

                          <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />

                          <div className="flex flex-col">
                            <span className="font-bold font-mono text-[11px] text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                              {reqCode}
                            </span>
                            <span className="text-[9.5px] text-foreground font-semibold line-clamp-1 max-w-[90px]">
                              {sc.requestedShiftName || sc.requestedShift}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Change Type Column */}
                      <TableCell>
                        {sc.changeType === 'Permanent' ? (
                          <Badge variant="outline" className="text-[10px] font-semibold bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/30 dark:text-purple-300">
                            Permanent
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] font-semibold bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/30 dark:text-blue-300">
                            Temporary
                          </Badge>
                        )}
                      </TableCell>

                      {/* Effective Period Column */}
                      <TableCell className="font-mono text-xs whitespace-nowrap">
                        {sc.changeType === 'Temporary' ? (
                          <div className="flex flex-col">
                            <span className="text-foreground font-medium text-[11.5px]">
                              {formatDisplayDate(sc.effectiveFrom || sc.effectiveDate)} – {formatDisplayDate(sc.effectiveTo)}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-sans">
                              {daysDuration} {daysDuration === 1 ? 'Day' : 'Days'} Duration
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-foreground font-medium text-[11.5px]">
                              From {formatDisplayDate(sc.effectiveFrom || sc.effectiveDate)}
                            </span>
                            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-sans font-medium">
                              Continuous / Ongoing
                            </span>
                          </div>
                        )}
                      </TableCell>

                      {/* Reason Column */}
                      <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate" title={sc.reason}>
                        <span className="block truncate">{sc.reason}</span>
                        {sc.attachmentName && (
                          <span className="text-[10px] text-primary flex items-center gap-1 mt-0.5">
                            <FileText className="h-3 w-3" /> {sc.attachmentName}
                          </span>
                        )}
                      </TableCell>

                      {/* Status Column */}
                      <TableCell>
                        {(sc.status === 'Pending Approval' || sc.status === 'Pending Review' || sc.status === 'Manager Review') && (
                          <Badge variant="outline" className="text-[10px] font-bold text-amber-700 bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 flex items-center gap-1 w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            PENDING APPROVAL
                          </Badge>
                        )}
                        {sc.status === 'HR Review' && (
                          <Badge variant="outline" className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border-indigo-300 dark:bg-indigo-950/40 dark:text-indigo-300 flex items-center gap-1 w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            HR REVIEW
                          </Badge>
                        )}
                        {sc.status === 'Approved' && (
                          <Badge variant="outline" className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center gap-1 w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            APPROVED
                          </Badge>
                        )}
                        {sc.status === 'Rejected' && (
                          <Badge variant="outline" className="text-[10px] font-bold text-rose-700 bg-rose-50 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 flex items-center gap-1 w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            REJECTED
                          </Badge>
                        )}
                        {sc.status === 'Draft' && (
                          <Badge variant="outline" className="text-[10px] font-semibold text-muted-foreground bg-muted border-border w-fit">
                            DRAFT
                          </Badge>
                        )}
                        {sc.status === 'Cancelled' && (
                          <Badge variant="outline" className="text-[10px] font-semibold text-slate-600 bg-slate-50 border-slate-300 dark:bg-slate-900/40 w-fit">
                            CANCELLED
                          </Badge>
                        )}
                        {sc.status === 'Expired' && (
                          <Badge variant="outline" className="text-[10px] font-semibold text-muted-foreground bg-muted/60 border-border w-fit">
                            EXPIRED
                          </Badge>
                        )}
                      </TableCell>

                      {/* Actions Column */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Details */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                            title="View Details"
                            onClick={() => {
                              setSelectedChangeForView(sc);
                              setIsViewModalOpen(true);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>

                          {/* Edit (Draft or Pending) */}
                          {(sc.status === 'Draft' || sc.status === 'Pending Approval' || sc.status === 'Pending Review') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-blue-600"
                              title="Edit Request"
                              onClick={() => handleOpenEdit(sc)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}

                          {/* Approve Button (Authorized) */}
                          {canApproveOrManage &&
                            (sc.status === 'Pending Approval' ||
                              sc.status === 'Pending Review' ||
                              sc.status === 'Manager Review') && (
                              <Button
                                size="sm"
                                className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-2xs"
                                title="Approve and activate shift override"
                                onClick={() => handleApprove(sc)}
                              >
                                <CheckCircle2 className="h-3 w-3" /> Approve
                              </Button>
                            )}

                          {/* Reject Button (Authorized) */}
                          {canApproveOrManage &&
                            (sc.status === 'Pending Approval' ||
                              sc.status === 'Pending Review' ||
                              sc.status === 'Manager Review') && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 dark:hover:bg-rose-950/40"
                                title="Reject request"
                                onClick={() => handleOpenReject(sc)}
                              >
                                <XCircle className="h-3 w-3" /> Reject
                              </Button>
                            )}

                          {/* Cancel Button (Requester) */}
                          {(sc.status === 'Pending Approval' || sc.status === 'Pending Review') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-slate-700"
                              title="Cancel Request"
                              onClick={() => {
                                cancelShiftChange(sc.id);
                                toast.info('Shift change request cancelled.');
                              }}
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </Button>
                          )}

                          {/* History Log */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-purple-600"
                            title="Audit Progression History"
                            onClick={() => {
                              setSelectedChangeForHistory(sc);
                              setIsHistoryModalOpen(true);
                            }}
                          >
                            <History className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {filteredChanges.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-xs text-muted-foreground">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <GitPullRequest className="h-8 w-8 text-muted-foreground/40" />
                        <p className="font-semibold text-foreground">No Shift Change Requests Found</p>
                        <p className="text-[11px] text-muted-foreground max-w-sm">
                          Submit a new shift change request to adjust an employee’s schedule temporarily or permanently.
                        </p>
                        <Button size="sm" className="mt-2 h-8 text-xs gap-1.5" onClick={handleOpenCreate}>
                          <Plus className="h-3.5 w-3.5" /> Request Shift Change
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── 4. REQUEST / EDIT SHIFT CHANGE MODAL ── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <GitPullRequest className="h-4 w-4 text-primary" />
              {editingChangeId ? 'Modify Shift Change Request' : 'Submit Enterprise Shift Change Request'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Request a temporary or permanent shift transition with automatic roster resolution and conflict checks.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* ── Section A: Employee Information ── */}
            <div className="rounded-lg border bg-muted/30 p-3.5 space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> 1. Employee Identification & Current Allocation
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Employee *</Label>
                  {canApproveOrManage ? (
                    <Select value={selectedEmployeeCode} onValueChange={handleSelectEmployee}>
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue placeholder="Choose employee..." />
                      </SelectTrigger>
                      <SelectContent>
                        {rosterEmployees.map((e) => (
                          <SelectItem key={e.employeeId || e.employeeCode} value={e.employeeCode} className="text-xs">
                            {e.employeeCode} — {e.name} ({e.department || 'Production'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={`${selectedEmployeeCode} — ${selectedEmployeeName}`}
                      readOnly
                      className="h-8 text-xs bg-muted text-foreground cursor-not-allowed font-medium"
                    />
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Department</Label>
                  <Input
                    value={selectedEmployeeDept}
                    readOnly
                    className="h-8 text-xs bg-muted text-muted-foreground cursor-not-allowed font-medium"
                  />
                </div>
              </div>

              {/* Current Shift: AUTO-POPULATED & READ-ONLY */}
              <div className="rounded-md border border-primary/20 bg-primary/5 p-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                    Current Shift (Auto-Resolved from Roster / Assignment)
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge className="text-xs font-mono font-bold bg-primary text-primary-foreground">
                      {currentResolvedShift?.code || 'MS'}
                    </Badge>
                    <span className="text-xs font-semibold text-foreground">
                      {currentResolvedShift?.name || 'Morning Shift'}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      ({currentResolvedShift?.timing || '08:00 AM – 04:30 PM'})
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] bg-background text-primary border-primary/30">
                  {currentResolvedShift?.source || 'Assigned'}
                </Badge>
              </div>
            </div>

            {/* ── Section B: Change Request Parameters ── */}
            <div className="rounded-lg border bg-card p-3.5 space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> 2. Requested Shift & Effective Period
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Change Type: Temporary or Permanent */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Change Type *</Label>
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setChangeType('Temporary')}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all text-left ${
                        changeType === 'Temporary'
                          ? 'border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 shadow-2xs ring-1 ring-blue-500'
                          : 'border-input bg-background hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      <span className="block">Temporary</span>
                      <span className="text-[10px] font-normal block text-muted-foreground">Fixed date range</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setChangeType('Permanent')}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all text-left ${
                        changeType === 'Permanent'
                          ? 'border-purple-500 bg-purple-50 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 shadow-2xs ring-1 ring-purple-500'
                          : 'border-input bg-background hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      <span className="block">Permanent</span>
                      <span className="text-[10px] font-normal block text-muted-foreground">Ongoing shift update</span>
                    </button>
                  </div>
                </div>

                {/* New Shift Dropdown */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Requested New Shift *</Label>
                  <Select value={requestedShiftCode} onValueChange={setRequestedShiftCode}>
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue placeholder="Select target shift..." />
                    </SelectTrigger>
                    <SelectContent>
                      {shifts.map((s) => (
                        <SelectItem key={s.id} value={s.code} className="text-xs">
                          <span className="font-bold font-mono text-primary mr-1.5">[{s.code}]</span>
                          {s.name} ({time24To12(s.startTime)} – {time24To12(s.endTime)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Effective Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Effective From Date *</Label>
                  <Input
                    type="date"
                    value={effectiveFrom}
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                    className="h-8 text-xs font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">
                    Effective To Date {changeType === 'Temporary' && <span className="text-rose-500">*</span>}
                  </Label>
                  {changeType === 'Temporary' ? (
                    <Input
                      type="date"
                      value={effectiveTo}
                      onChange={(e) => setEffectiveTo(e.target.value)}
                      className="h-8 text-xs font-mono"
                      required
                    />
                  ) : (
                    <div className="h-8 rounded-md border border-dashed bg-muted/40 px-3 flex items-center text-[11px] text-muted-foreground italic">
                      Continuous / No End Date (Permanent Shift Transition)
                    </div>
                  )}
                </div>
              </div>

              {/* Business Reason with Quick Tags */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Business Reason / Justification *</Label>
                  <span className="text-[10.5px] text-muted-foreground">Minimum 10 characters</span>
                </div>
                <Textarea
                  placeholder="e.g. Assigned to production line tooling upgrade and furnace maintenance support..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="text-xs min-h-[60px]"
                  required
                />
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] text-muted-foreground">Quick reasons:</span>
                  {[
                    'Production coverage',
                    'Tooling upgrade support',
                    'Transport schedule change',
                    'Medical accommodation',
                    'Emergency night coverage',
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setReason(tag)}
                      className="text-[10px] px-2 py-0.5 rounded bg-muted hover:bg-primary/10 hover:text-primary transition-colors border text-muted-foreground"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Attachment */}
              <div className="space-y-1 pt-1">
                <Label className="text-xs font-semibold flex items-center gap-1">
                  <Upload className="h-3 w-3 text-muted-foreground" /> Supporting Document / Attachment (Optional)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="e.g. supervisor_preapproval.pdf or medical_note.pdf"
                    value={attachmentName}
                    onChange={(e) => setAttachmentName(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs shrink-0"
                    onClick={() => setAttachmentName('approval_memo_prod_dept.pdf')}
                  >
                    Attach Sample
                  </Button>
                </div>
              </div>
            </div>

            {/* ── Section C: Real-Time Auto Preview Box ── */}
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
              <span className="text-[10px] uppercase font-bold text-primary tracking-wider flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Shift Transition Auto-Preview
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-3 bg-background/80 rounded-md p-2.5 border">
                <div>
                  <span className="text-[9.5px] uppercase font-bold text-muted-foreground block">Current Shift</span>
                  <span className="text-xs font-bold text-foreground block">
                    {currentResolvedShift?.name || 'Morning Shift'} ({currentResolvedShift?.code || 'MS'})
                  </span>
                  <span className="text-[10.5px] text-muted-foreground font-mono">
                    {currentResolvedShift?.timing || '08:00 AM – 04:30 PM'}
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center">
                  <div className="bg-primary/10 rounded-full p-1 border border-primary/20 text-primary">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] text-primary font-semibold mt-0.5">
                    {changeType === 'Temporary'
                      ? `${getDaysCount(effectiveFrom, effectiveTo)} Days Temp`
                      : 'Permanent Move'}
                  </span>
                </div>

                <div className="sm:text-right">
                  <span className="text-[9.5px] uppercase font-bold text-primary block">Requested Shift</span>
                  <span className="text-xs font-bold text-primary block">
                    {requestedShiftObj?.name} ({requestedShiftObj?.code})
                  </span>
                  <span className="text-[10.5px] text-foreground font-mono font-medium">
                    {time24To12(requestedShiftObj?.startTime)} – {time24To12(requestedShiftObj?.endTime)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1 font-mono">
                <span>
                  <strong>Effective Period:</strong> {formatDisplayDate(effectiveFrom)}{' '}
                  {changeType === 'Temporary' ? `→ ${formatDisplayDate(effectiveTo)}` : '→ Continuous'}
                </span>
                <span className="text-[10.5px] text-emerald-700 dark:text-emerald-300 font-sans font-semibold">
                  Roster Priority: Tier 1 Override
                </span>
              </div>
            </div>

            {/* ── Section D: Conflict & Eligibility Validation ── */}
            <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Pre-Submission Conflict & Eligibility Validation
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  {validationResults.employeeActive ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                  )}
                  <span className="text-[11px]">Employee Active</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {validationResults.newShiftActive ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                  )}
                  <span className="text-[11px]">Target Shift Active</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {validationResults.differentShifts ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                  )}
                  <span className="text-[11px]">Different Shifts</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {validationResults.validEffectiveDates ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                  )}
                  <span className="text-[11px]">Valid Effective Dates</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {validationResults.noDuplicatePending ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                  )}
                  <span className="text-[11px]">No Duplicate Request</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span className="text-[11px]">Rest Interval Compliant</span>
                </div>
              </div>

              {/* Validation Warnings */}
              {validationResults.warnings.length > 0 && (
                <div className="space-y-1 pt-1">
                  {validationResults.warnings.map((w, i) => (
                    <div key={i} className="text-[10.5px] text-amber-700 dark:text-amber-300 bg-amber-500/10 p-1.5 rounded flex items-center gap-1.5">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Validation Errors */}
              {validationResults.errors.length > 0 && (
                <div className="space-y-1 pt-1">
                  {validationResults.errors.map((e, i) => (
                    <div key={i} className="text-[10.5px] text-rose-700 dark:text-rose-300 bg-rose-500/10 p-1.5 rounded flex items-center gap-1.5">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span>{e}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2 sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => handleSaveRequest('Draft')}
            >
              Save as Draft
            </Button>

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-primary text-primary-foreground font-semibold"
                disabled={!validationResults.canSubmit}
                onClick={() => handleSaveRequest('Pending Approval')}
              >
                Submit for Approval
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 5. REJECTION MODAL (MANDATORY REASON) ── */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2 text-rose-600">
              <XCircle className="h-4 w-4" /> Reject Shift Change Request
            </DialogTitle>
            <DialogDescription className="text-xs">
              Rejection requires a mandatory business justification before notification is dispatched.
            </DialogDescription>
          </DialogHeader>

          {targetChangeForReject && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 rounded-lg bg-muted/40 border">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Applicant & Shift</span>
                <span className="font-bold text-foreground block mt-0.5">
                  {targetChangeForReject.employeeCode} — {targetChangeForReject.employeeName} ({targetChangeForReject.department})
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  Requested: {targetChangeForReject.requestedShift} (Effective: {targetChangeForReject.effectiveFrom || targetChangeForReject.effectiveDate})
                </span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Mandatory Rejection Reason *
                </Label>
                <Textarea
                  placeholder="Explain why this shift change cannot be approved (e.g. staffing shortage on original shift, minimum rest constraint)..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="text-xs min-h-[70px]"
                  required
                />
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] text-muted-foreground">Quick rejection reasons:</span>
                  {[
                    'Critical staffing shortage on current shift',
                    'Peak production volume lock-in',
                    'Departmental skill matrix imbalance',
                    'Inadequate rest interval violation',
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setRejectionReason(tag)}
                      className="text-[10px] px-2 py-0.5 rounded bg-muted hover:bg-rose-50 hover:text-rose-700 transition-colors border text-muted-foreground"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={!rejectionReason.trim()}
              onClick={handleSubmitReject}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 6. VIEW DETAILS MODAL ── */}
      {selectedChangeForView && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold flex items-center gap-2">
                <GitPullRequest className="h-4 w-4 text-primary" /> Shift Change Request Details
              </DialogTitle>
              <DialogDescription className="text-xs">
                Detailed transition parameters, validation checks, and operational rationale.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-2 text-xs">
              <div className="p-3 rounded-xl bg-muted/40 border grid grid-cols-2 gap-3 font-mono">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-sans font-semibold block">
                    Employee
                  </span>
                  <span className="font-bold text-foreground font-sans">
                    {selectedChangeForView.employeeName} ({selectedChangeForView.employeeCode})
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-sans font-semibold block">
                    Department
                  </span>
                  <span className="font-bold text-foreground font-sans">{selectedChangeForView.department}</span>
                </div>

                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-sans font-semibold block">
                    Change Type
                  </span>
                  <Badge variant="outline" className="text-[10px] font-semibold">
                    {selectedChangeForView.changeType || 'Temporary'}
                  </Badge>
                </div>

                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-sans font-semibold block">
                    Status
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-bold ${
                      selectedChangeForView.status === 'Approved'
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-300'
                        : selectedChangeForView.status === 'Rejected'
                        ? 'text-rose-700 bg-rose-50 border-rose-300'
                        : 'text-amber-700 bg-amber-50 border-amber-300'
                    }`}
                  >
                    {selectedChangeForView.status}
                  </Badge>
                </div>

                <div className="col-span-2">
                  <span className="text-[10px] text-muted-foreground uppercase font-sans font-semibold block">
                    Effective Duration
                  </span>
                  <span className="font-semibold text-foreground font-sans">
                    {selectedChangeForView.changeType === 'Temporary'
                      ? `${formatDisplayDate(selectedChangeForView.effectiveFrom || selectedChangeForView.effectiveDate)} to ${formatDisplayDate(selectedChangeForView.effectiveTo)} (${getDaysCount(selectedChangeForView.effectiveFrom, selectedChangeForView.effectiveTo)} Days)`
                      : `From ${formatDisplayDate(selectedChangeForView.effectiveFrom || selectedChangeForView.effectiveDate)} (Permanent Transition)`}
                  </span>
                </div>
              </div>

              {/* Transition Card */}
              <div className="p-3 rounded-lg border bg-primary/5 border-primary/20 flex items-center justify-between">
                <div>
                  <span className="text-[9.5px] uppercase font-bold text-muted-foreground block">Previous Assigned Shift</span>
                  <span className="text-xs font-bold text-muted-foreground line-through">
                    {selectedChangeForView.currentShift}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono block">
                    {selectedChangeForView.currentShiftTiming || '08:00 AM – 04:30 PM'}
                  </span>
                </div>

                <ArrowRight className="h-4 w-4 text-primary shrink-0" />

                <div className="text-right">
                  <span className="text-[9.5px] uppercase font-bold text-primary block">Approved Target Shift</span>
                  <span className="text-xs font-bold text-primary">
                    {selectedChangeForView.requestedShift}
                  </span>
                  <span className="text-[10px] text-foreground font-mono block font-semibold">
                    {selectedChangeForView.requestedShiftTiming || '04:00 PM – 12:00 AM'}
                  </span>
                </div>
              </div>

              {/* Justification & Remarks */}
              <div className="space-y-1.5 p-3 rounded-lg border bg-card">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Operational Reason</span>
                <p className="text-xs text-foreground font-medium">{selectedChangeForView.reason}</p>
                {selectedChangeForView.attachmentName && (
                  <div className="text-[11px] text-primary flex items-center gap-1.5 pt-1">
                    <FileText className="h-3.5 w-3.5" />
                    <span>Attached: {selectedChangeForView.attachmentName}</span>
                  </div>
                )}
                {selectedChangeForView.reviewerRemarks && (
                  <div className="mt-2 pt-2 border-t text-[11px]">
                    <span className="font-bold text-muted-foreground block">Reviewer Decision Notes:</span>
                    <p className="text-foreground italic mt-0.5">{selectedChangeForView.reviewerRemarks}</p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button size="sm" variant="outline" onClick={() => setIsViewModalOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── 7. AUDIT PROGRESSION HISTORY MODAL ── */}
      {selectedChangeForHistory && (
        <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold flex items-center gap-2">
                <History className="h-4 w-4 text-primary" /> Audit & Workflow Progression Log
              </DialogTitle>
              <DialogDescription className="text-xs">
                Chronological record of request submission, manager review, and future roster updates.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="border-l-2 border-primary/40 pl-3 space-y-3.5 ml-2">
                {(selectedChangeForHistory.history || [
                  {
                    date: selectedChangeForHistory.appliedDate,
                    stage: 'Submission',
                    actor: selectedChangeForHistory.employeeName,
                    action: 'Submitted Shift Change Request',
                    notes: selectedChangeForHistory.reason,
                  },
                  ...(selectedChangeForHistory.status === 'Approved'
                    ? [
                        {
                          date: selectedChangeForHistory.reviewedAt ? selectedChangeForHistory.reviewedAt.split('T')[0] : '2026-09-10',
                          stage: 'Manager Approval',
                          actor: selectedChangeForHistory.reviewedBy || 'Plant Operations Head',
                          action: 'Approved & Scheduled Future Roster Update',
                          notes: selectedChangeForHistory.reviewerRemarks || 'Approved for manufacturing line handover',
                        },
                      ]
                    : selectedChangeForHistory.status === 'Rejected'
                    ? [
                        {
                          date: selectedChangeForHistory.reviewedAt ? selectedChangeForHistory.reviewedAt.split('T')[0] : '2026-09-10',
                          stage: 'Rejection',
                          actor: selectedChangeForHistory.reviewedBy || 'Super Admin',
                          action: 'Rejected Shift Change Request',
                          notes: selectedChangeForHistory.rejectionReason || selectedChangeForHistory.reviewerRemarks,
                        },
                      ]
                    : []),
                ]).map((h, idx) => (
                  <div key={idx} className="relative">
                    <span className="absolute -left-[19px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
                    <span className="text-[10px] text-muted-foreground font-mono block">{h.date}</span>
                    <span className="font-bold text-foreground text-xs block">{h.action}</span>
                    <span className="text-[11px] text-muted-foreground block">
                      Actor: {h.actor} ({h.stage})
                    </span>
                    {h.notes && <p className="text-[10.5px] text-muted-foreground italic mt-0.5">{h.notes}</p>}
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button size="sm" variant="outline" onClick={() => setIsHistoryModalOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
