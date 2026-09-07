import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  LogOut,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  DollarSign,
  Calendar,
  AlertCircle,
  FileText,
  MessageSquare,
  CheckSquare,
  History,
  Check,
  Printer,
  X,
  UserCheck,
  Laptop,
  CreditCard,
  Building2,
  Briefcase,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { employeesApi } from '@/api/employees';
import { exitsApi, type EmployeeExit, type ExitClearanceItem } from '@/api/exits';
import { assetsApi } from '@/api/asset-management';
import { StatusBadge } from '@/components/ui/status-badge';

// ── Universal Exit Types & Contextual Dependent Reasons ──
const EXIT_TYPE_OPTIONS = [
  { id: 'RESIGNATION', label: 'Resignation (Voluntary)' },
  { id: 'TERMINATION', label: 'Termination (Involuntary)' },
  { id: 'RETIREMENT', label: 'Retirement / Superannuation' },
  { id: 'CONTRACT_EXPIRY', label: 'Contract Expiry' },
  { id: 'ABSCONDING', label: 'Absconding / Job Abandonment' },
  { id: 'DEATH', label: 'Death (In-Service Demise)' },
  { id: 'LAYOFF', label: 'Layoff / Role Redundancy' },
  { id: 'MUTUAL_SEPARATION', label: 'Mutual Separation' },
  { id: 'TRANSFER', label: 'Transfer to Another Entity' },
];

const EXIT_REASONS_MAP: Record<string, string[]> = {
  RESIGNATION: [
    'Career Growth / Better Opportunity',
    'Higher Studies',
    'Relocation / Moving Cities',
    'Personal Reasons',
    'Compensation & Benefits',
    'Work Environment / Culture',
    'Health / Family Reasons',
    'Other Voluntary Reason',
  ],
  TERMINATION: [
    'Performance Issues',
    'Misconduct',
    'Policy Violation / Code of Conduct',
    'Disciplinary Action',
    'Role Redundancy',
    'Chronic Absenteeism',
    'Other Disciplinary Grounds',
  ],
  CONTRACT_EXPIRY: [
    'Contract Period Completed',
    'Contract Not Renewed by Organization',
    'Contract Not Renewed by Employee',
    'Project Assignment Concluded',
    'End of Client SOW',
  ],
  RETIREMENT: [
    'Normal Superannuation (Attained Age)',
    'Voluntary Retirement Scheme (VRS)',
    'Medical Ground Retirement',
    'Early Retirement Request',
  ],
  ABSCONDING: [
    'Job Abandonment without Notice',
    'Unannounced Absence > 15 Days',
    'Untraceable / No Response to Show Cause',
    'Disciplinary Absconding Record',
  ],
  DEATH: [
    'In-Service Demise (Natural Causes)',
    'Accidental Demise',
    'Occupational Hazard Incident',
    'Terminal Illness Demise',
  ],
  LAYOFF: [
    'Downsizing & Cost Rationalization',
    'Organizational Restructuring',
    'Branch or Plant Closure',
    'Technology Automation Phase-Out',
  ],
  MUTUAL_SEPARATION: [
    'Negotiated Mutual Separation',
    'Mutual Executive Agreement',
    'Severance Package Accepted',
  ],
  TRANSFER: [
    'Group Company / Entity Transfer',
    'Deputation to Sister Subsidiary',
    'International Entity Relocation',
  ],
};

const LIFECYCLE_STAGES = [
  { id: 'INITIATED', label: '1. Initiated' },
  { id: 'HR_REVIEW', label: '2. HR Review' },
  { id: 'MANAGER_APPROVAL', label: '3. Manager Approval' },
  { id: 'NOTICE_PERIOD', label: '4. Notice Period' },
  { id: 'CLEARANCE_PENDING', label: '5. Clearance' },
  { id: 'CLEARANCE_COMPLETED', label: '6. Cleared' },
  { id: 'EXIT_INTERVIEW', label: '7. Interview' },
  { id: 'FNF_PENDING', label: '8. F&F Pending' },
  { id: 'FNF_COMPLETED', label: '9. F&F Approved' },
  { id: 'FINAL_APPROVAL', label: '10. Final Signoff' },
  { id: 'EXITED', label: '11. Separated' },
  { id: 'OFFBOARDING_COMPLETED', label: '12. Completed' },
];

export function ExitManagementTab() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedExitId, setSelectedExitId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<'clearance' | 'assets' | 'interview' | 'attendance' | 'fnf' | 'final'>('clearance');

  // Document Viewer Modal State
  const [docModalType, setDocModalType] = useState<'relieving' | 'experience' | 'fnf' | null>(null);

  // Add Form State (Universal Dynamic Initiation)
  const [formEmpId, setFormEmpId] = useState('');
  const [formExitType, setFormExitType] = useState('RESIGNATION');
  const [formReason, setFormReason] = useState('Career Growth / Better Opportunity');
  const [formResignDate, setFormResignDate] = useState(new Date().toISOString().split('T')[0]);
  const [formNoticeDays, setFormNoticeDays] = useState(90);
  const [formRequestedLwd, setFormRequestedLwd] = useState('');
  const [formNoticeWaivedDays, setFormNoticeWaivedDays] = useState(0);
  const [formNoticeBuyout, setFormNoticeBuyout] = useState(0);
  const [formLwd, setFormLwd] = useState('');
  const [formRemarks, setFormRemarks] = useState('');

  // Clearance Filter State
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');

  // Asset Return State (Dynamic sync with Asset Allocation module)
  const [assetItemsState, setAssetItemsState] = useState<Record<string, { status: string; condition: string; recoveryCost: number }>>({});

  // Exit Interview Form State (Conditional & Waivable)
  const [interviewRequired, setInterviewRequired] = useState(true);
  const [interviewWaiverReason, setInterviewWaiverReason] = useState('');
  const [interviewPrimaryReason, setInterviewPrimaryReason] = useState('Career Growth');
  const [interviewSecondaryReason, setInterviewSecondaryReason] = useState('');
  const [interviewEmpFeedback, setInterviewEmpFeedback] = useState('');
  const [interviewMgrFeedback, setInterviewMgrFeedback] = useState('');
  const [interviewWorkRating, setInterviewWorkRating] = useState(5);
  const [interviewCompRating, setInterviewCompRating] = useState(4);
  const [interviewRecommend, setInterviewRecommend] = useState(true);
  const [interviewRehire, setInterviewRehire] = useState(true);
  const [interviewHrRemarks, setInterviewHrRemarks] = useState('');

  // Attendance & Leave Closure State
  const [attendanceClosed, setAttendanceClosed] = useState(true);
  const [unavailedLeaveDays, setUnavailedLeaveDays] = useState(12);

  // F&F Form State (Comprehensive Formula Engine)
  const [fnfSalaryPayable, setFnfSalaryPayable] = useState(0);
  const [fnfLeaveEncashment, setFnfLeaveEncashment] = useState(0);
  const [fnfIncentives, setFnfIncentives] = useState(0);
  const [fnfReimbursements, setFnfReimbursements] = useState(0);
  const [fnfGratuity, setFnfGratuity] = useState(0);
  const [fnfNoticeRecovery, setFnfNoticeRecovery] = useState(0);
  const [fnfLoanRecovery, setFnfLoanRecovery] = useState(0);
  const [fnfAssetRecovery, setFnfAssetRecovery] = useState(0);
  const [fnfOtherDeductions, setFnfOtherDeductions] = useState(0);
  const [fnfStatus, setFnfStatus] = useState('PENDING');

  // LWD Adjust Form State
  const [adjustLwdDate, setAdjustLwdDate] = useState('');
  const [adjustLwdReason, setAdjustLwdReason] = useState('');

  // ── Queries ──
  const { data: employeesData } = useQuery({
    queryKey: ['employees-list-exit'],
    queryFn: () => employeesApi.list({ page: 1, pageSize: 1000 }),
  });
  const employees = employeesData?.items ?? [];

  const { data: exits = [], isLoading: isExitsLoading } = useQuery({
    queryKey: ['exits', searchQuery, selectedStatus],
    queryFn: () => exitsApi.list({ search: searchQuery, status: selectedStatus }),
  });

  const { data: kpis } = useQuery({
    queryKey: ['exits-kpis'],
    queryFn: () => exitsApi.getKpis(),
  });

  const { data: activeExitDetail } = useQuery({
    queryKey: ['exit-detail', selectedExitId],
    queryFn: () => (selectedExitId ? exitsApi.get(selectedExitId) : null),
    enabled: !!selectedExitId,
  });

  // Query live assets from Asset Allocation module
  const { data: allAssets = [] } = useQuery({
    queryKey: ['assets-for-exit'],
    queryFn: () => assetsApi.list(),
  });

  // Dynamically resolve active allocations for selected exit employee
  const activeAssignedAssets = useMemo(() => {
    if (!activeExitDetail?.employee?.id) return [];
    return allAssets.filter(
      (a) => a.currentEmployeeId === activeExitDetail.employee?.id && a.status === 'ALLOCATED',
    );
  }, [allAssets, activeExitDetail?.employee?.id]);

  // Selected Employee Helper
  const selectedEmpForAdd = useMemo(() => {
    return employees.find((e) => e.id === formEmpId);
  }, [formEmpId, employees]);

  // Auto-calculate Expected LWD based on notice period
  const calculatedExpectedLwd = useMemo(() => {
    if (!formResignDate) return '';
    const date = new Date(formResignDate);
    date.setDate(date.getDate() + (Number(formNoticeDays) || 90));
    return date.toISOString().split('T')[0];
  }, [formResignDate, formNoticeDays]);

  // Dynamic Departments in Clearance Items (No Hardcoded 6 Departments)
  const availableClearanceDepts = useMemo(() => {
    if (!activeExitDetail?.clearanceItems) return ['all'];
    const depts = Array.from(new Set(activeExitDetail.clearanceItems.map((i) => i.department)));
    return ['all', ...depts];
  }, [activeExitDetail?.clearanceItems]);

  // Handle Exit Type change and auto-populate contextual reason
  const handleExitTypeChange = (type: string) => {
    setFormExitType(type);
    const availableReasons = EXIT_REASONS_MAP[type] || [];
    setFormReason(availableReasons[0] || 'Other');
  };

  // ── Mutations ──
  const createExitMutation = useMutation({
    mutationFn: (payload: Partial<EmployeeExit>) => exitsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exits'] });
      queryClient.invalidateQueries({ queryKey: ['exits-kpis'] });
      toast.success('Universal exit workflow initiated. Clearance template configured!');
      setIsAddOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to initiate exit');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, remarks }: { id: string; status: string; remarks?: string }) =>
      exitsApi.updateStatus(id, { status, remarks }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exits'] });
      queryClient.invalidateQueries({ queryKey: ['exits-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['exit-detail', selectedExitId] });
      toast.success('Exit workflow stage updated');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to update status');
    },
  });

  const updateClearanceMutation = useMutation({
    mutationFn: ({ itemId, status, remarks }: { itemId: string; status: string; remarks?: string }) =>
      exitsApi.updateClearanceItem(itemId, { status, remarks }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exit-detail', selectedExitId] });
      queryClient.invalidateQueries({ queryKey: ['exits'] });
      toast.success('Clearance item status updated');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to update clearance');
    },
  });

  const saveInterviewMutation = useMutation({
    mutationFn: (payload: any) =>
      selectedExitId ? exitsApi.saveExitInterview(selectedExitId, payload) : Promise.reject('No exit ID'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exit-detail', selectedExitId] });
      queryClient.invalidateQueries({ queryKey: ['exits'] });
      toast.success('Exit interview assessment recorded successfully');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to save exit interview');
    },
  });

  const saveFnfMutation = useMutation({
    mutationFn: (payload: any) =>
      selectedExitId ? exitsApi.saveFnfSettlement(selectedExitId, payload) : Promise.reject('No exit ID'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exit-detail', selectedExitId] });
      queryClient.invalidateQueries({ queryKey: ['exits'] });
      queryClient.invalidateQueries({ queryKey: ['exits-kpis'] });
      toast.success('F&F Settlement calculations saved successfully');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to save F&F settlement');
    },
  });

  const adjustLwdMutation = useMutation({
    mutationFn: (payload: { adjustedLwd: string; reason: string }) =>
      selectedExitId ? exitsApi.adjustLwd(selectedExitId, payload) : Promise.reject('No exit ID'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exit-detail', selectedExitId] });
      queryClient.invalidateQueries({ queryKey: ['exits'] });
      toast.success('Last Working Day & audit record updated');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to adjust LWD');
    },
  });

  const completeExitMutation = useMutation({
    mutationFn: (id: string) => exitsApi.completeExit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exits'] });
      queryClient.invalidateQueries({ queryKey: ['exits-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['exit-detail', selectedExitId] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Final Exit Signoff Executed! Employee status updated to SEPARATED.');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to complete exit');
    },
  });

  // Modal Open Handlers
  const openAddModal = () => {
    setFormEmpId(employees[0]?.id || '');
    setFormExitType('RESIGNATION');
    setFormReason(EXIT_REASONS_MAP['RESIGNATION'][0]);
    setFormResignDate(new Date().toISOString().split('T')[0]);
    setFormNoticeDays(90);
    setFormRequestedLwd('');
    setFormNoticeWaivedDays(0);
    setFormNoticeBuyout(0);
    setFormLwd('');
    setFormRemarks('');
    setIsAddOpen(true);
  };

  const openDetailModal = (exit: EmployeeExit) => {
    setSelectedExitId(exit.id);
    setDetailTab('clearance');
    setSelectedDeptFilter('all');

    // Populate Interview state
    const isWaivedExitType = ['ABSCONDING', 'DEATH'].includes(exit.exitType);
    setInterviewRequired(!isWaivedExitType && exit.exitInterviewStatus !== 'WAIVED');
    if (exit.exitInterview) {
      setInterviewPrimaryReason(exit.exitInterview.primaryReason || 'Career Growth');
      setInterviewSecondaryReason(exit.exitInterview.secondaryReason || '');
      setInterviewEmpFeedback(exit.exitInterview.employeeFeedback || '');
      setInterviewMgrFeedback(exit.exitInterview.managerFeedback || '');
      setInterviewWorkRating(exit.exitInterview.workEnvironmentRating || 5);
      setInterviewCompRating(exit.exitInterview.compensationRating || 5);
      setInterviewRecommend(exit.exitInterview.recommendCompany ?? true);
      setInterviewRehire(exit.exitInterview.rehireEligible ?? true);
      setInterviewHrRemarks(exit.exitInterview.hrRemarks || '');
      if (exit.exitInterview.isWaived || exit.exitInterviewStatus === 'WAIVED') {
        setInterviewRequired(false);
        setInterviewWaiverReason(exit.exitInterview.waiverReason || 'Waived by corporate policy');
      }
    }

    // Populate F&F state
    if (exit.fnfSettlement) {
      setFnfSalaryPayable(exit.fnfSettlement.salaryPayable || 0);
      setFnfLeaveEncashment(exit.fnfSettlement.leaveEncashment || 0);
      setFnfIncentives(exit.fnfSettlement.incentives || 0);
      setFnfReimbursements(exit.fnfSettlement.reimbursements || 0);
      setFnfGratuity(exit.fnfSettlement.gratuity || 0);
      setFnfNoticeRecovery(exit.fnfSettlement.noticeRecovery || 0);
      setFnfLoanRecovery(exit.fnfSettlement.loanAdvanceRecovery || 0);
      setFnfAssetRecovery(exit.fnfSettlement.assetRecovery || 0);
      setFnfOtherDeductions(exit.fnfSettlement.otherDeductions || 0);
      setFnfStatus(exit.fnfSettlement.status || 'PENDING');
    }

    setIsDetailOpen(true);
  };

  const handleCreateExit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmpId) {
      toast.error('Please select an employee');
      return;
    }
    if (!formReason) {
      toast.error('Exit reason is required');
      return;
    }

    createExitMutation.mutate({
      employeeId: formEmpId,
      resignationDate: formResignDate,
      noticePeriodDays: Number(formNoticeDays) || 90,
      lastWorkingDay: formLwd || calculatedExpectedLwd,
      exitType: formExitType,
      exitReason: formReason,
      remarks: formRemarks,
    });
  };

  const returnAssetMutation = useMutation({
    mutationFn: ({ assetId, condition, remarks }: { assetId: string; condition: string; remarks?: string }) =>
      assetsApi.returnAsset(assetId, {
        returnReason: 'Exit Clearance & Separation',
        condition: condition || 'Good',
        remarks,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets-for-exit'] });
      queryClient.invalidateQueries({ queryKey: ['exit-detail', selectedExitId] });
      toast.success('Asset returned successfully! Master status updated to IN_STOCK (Available).');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to return asset');
    },
  });

  // Asset return damage calculation & sync to F&F
  const totalAssetRecovery = useMemo(() => {
    return activeAssignedAssets.reduce((sum, asset) => {
      const state = assetItemsState[asset.id];
      return sum + (state?.recoveryCost || 0);
    }, 0);
  }, [activeAssignedAssets, assetItemsState]);

  const syncAssetRecoveryToFnf = () => {
    setFnfAssetRecovery(totalAssetRecovery);
    toast.success(`Asset Recovery fee ₹${totalAssetRecovery.toLocaleString('en-IN')} synced to F&F Settlement!`);
  };

  // Financial calculations for F&F
  const grossFnfPayable = fnfSalaryPayable + fnfLeaveEncashment + fnfIncentives + fnfReimbursements + fnfGratuity;
  const totalFnfDeductions = fnfNoticeRecovery + fnfLoanRecovery + fnfAssetRecovery + fnfOtherDeductions;
  const netFnfPayable = grossFnfPayable - totalFnfDeductions;

  return (
    <div className="space-y-6">
      {/* ── 1. Top Exit Offboarding Stats Cards (Universal Metrics) ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Active Exits</p>
              <p className="text-xl font-semibold text-foreground mt-0.5">{kpis?.activeExits ?? 0} Staff</p>
              <p className="text-[10px] text-primary font-semibold mt-1">In Offboarding Flow</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <LogOut className="h-4.5 w-4.5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pending Approvals</p>
              <p className="text-xl font-semibold text-foreground mt-0.5">{kpis?.pendingApprovals ?? 0} Exits</p>
              <p className="text-[10px] text-amber-600 font-semibold mt-1">Matrix Signoff</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
              <Clock className="h-4.5 w-4.5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Clearance Pending</p>
              <p className="text-xl font-semibold text-foreground mt-0.5">{kpis?.clearancePending ?? 0} Staff</p>
              <p className="text-[10px] text-violet-600 font-semibold mt-1">Dynamic Depts</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 shrink-0">
              <CheckSquare className="h-4.5 w-4.5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">F&F Pending</p>
              <p className="text-xl font-semibold text-foreground mt-0.5">{kpis?.fnfPending ?? 0} Settlements</p>
              <p className="text-[10px] text-cyan-600 font-semibold mt-1">Finance Review</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 shrink-0">
              <DollarSign className="h-4.5 w-4.5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Exits This Month</p>
              <p className="text-xl font-semibold text-foreground mt-0.5">{kpis?.exitsThisMonth ?? 0} Staff</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">Separated</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <CheckCircle2 className="h-4.5 w-4.5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Avg Notice Days</p>
              <p className="text-xl font-semibold text-foreground mt-0.5">{kpis?.avgExitDays ?? 90} Days</p>
              <p className="text-[10px] text-rose-600 font-semibold mt-1">Expected LWD</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 shrink-0">
              <Calendar className="h-4.5 w-4.5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Exit Offboarding Directory & Register Panel ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <LogOut className="h-4 w-4 text-primary" /> Universal Exit & Separation Management Engine
              </CardTitle>
              <CardDescription className="text-xs">
                End-to-end offboarding engine across IT, Manufacturing, Healthcare & Corporate: Exit types, dynamic clearances, asset return, conditional interviews & F&F settlement
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Status Filter Pills */}
              <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
                {[
                  { id: 'all', label: 'All Cases' },
                  { id: 'notice_period', label: 'Notice Period' },
                  { id: 'clearance_pending', label: 'Clearance' },
                  { id: 'fnf_pending', label: 'F&F Pending' },
                  { id: 'offboarding_completed', label: 'Separated' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedStatus(tab.id)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                      selectedStatus === tab.id
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative w-48 sm:w-60">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search code, name, dept..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs rounded-xl"
                />
              </div>

              <Button size="sm" className="h-8 text-xs gap-1.5 rounded-xl shadow-xs" onClick={openAddModal}>
                <Plus className="h-3.5 w-3.5" /> Initiate Exit Case
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-xs font-semibold">Exit Code & Type</TableHead>
                  <TableHead className="text-xs font-semibold">Employee Details</TableHead>
                  <TableHead className="text-xs font-semibold">Notice & LWD</TableHead>
                  <TableHead className="text-xs font-semibold">Clearance Status</TableHead>
                  <TableHead className="text-xs font-semibold">F&F Settlement</TableHead>
                  <TableHead className="text-xs font-semibold">Lifecycle Stage</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isExitsLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                      Loading offboarding records...
                    </TableCell>
                  </TableRow>
                ) : exits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                      No exit offboarding records found. Click "Initiate Exit Case" to begin.
                    </TableCell>
                  </TableRow>
                ) : (
                  exits.map((exit) => {
                    const isSeparated = exit.status === 'EXITED' || exit.status === 'OFFBOARDING_COMPLETED';
                    const exitTypeLabel = EXIT_TYPE_OPTIONS.find((t) => t.id === exit.exitType)?.label || exit.exitType;

                    return (
                      <TableRow key={exit.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div className="space-y-0.5">
                            <span className="font-mono text-xs font-semibold text-primary block">{exit.exitCode}</span>
                            <Badge variant="outline" className="text-[10px] font-medium">
                              {exitTypeLabel.split(' ')[0]}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <span className="font-semibold text-xs text-foreground block">
                              {exit.employee?.firstName} {exit.employee?.lastName}
                            </span>
                            <span className="text-[11px] text-muted-foreground block">
                              {exit.employee?.designation?.title || 'Staff'} • {exit.employee?.department?.name || 'General'}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {exit.employee?.employeeCode}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5 text-xs">
                            <span className="text-muted-foreground text-[11px] block">
                              Notice: <strong>{exit.noticePeriodDays} Days</strong>
                            </span>
                            <span className="font-mono text-[11px] font-semibold text-foreground block">
                              LWD: {new Date(exit.adjustedLwd || exit.lastWorkingDay).toLocaleDateString()}
                            </span>
                            {exit.adjustedLwd && (
                              <Badge variant="secondary" className="text-[9px] text-amber-600 bg-amber-50">
                                Adjusted LWD
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge
                              variant={exit.clearanceStatus === 'COMPLETED' ? 'default' : 'outline'}
                              className="text-[10px]"
                            >
                              {exit.clearanceStatus === 'COMPLETED' ? '100% Cleared' : 'Clearance Pending'}
                            </Badge>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              {exit.clearanceItems?.filter((i) => i.status === 'CLEARED' || i.status === 'WAIVED').length || 0} /{' '}
                              {exit.clearanceItems?.length || 0} Tasks
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <span className="font-mono text-xs font-semibold text-foreground block">
                              ₹{(exit.fnfSettlement?.netPayable || 0).toLocaleString('en-IN')}
                            </span>
                            <Badge
                              variant={exit.fnfStatus === 'COMPLETED' ? 'default' : 'secondary'}
                              className="text-[9.5px]"
                            >
                              {exit.fnfStatus === 'COMPLETED' ? 'Finance Approved' : 'F&F Pending'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={exit.status} />
                          {isSeparated && (
                            <span className="block text-[10px] font-semibold text-emerald-600 mt-0.5">
                              Master: SEPARATED
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs gap-1 hover:text-primary"
                            onClick={() => openDetailModal(exit)}
                          >
                            Manage Lifecycle <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── 3. Universal Exit Initiation Modal (Dynamic Type & Contextual Reasons) ── */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="h-4 w-4 text-primary" /> Initiate Employee Exit / Separation Case
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleCreateExit}>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Select Employee *</Label>
              <Select value={formEmpId} onValueChange={setFormEmpId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Choose employee submitting separation..." />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id} className="text-xs">
                      {emp.firstName} {emp.lastName} ({emp.employeeCode}) • {emp.department?.name || 'General'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedEmpForAdd && (
              <div className="p-3 bg-muted/40 rounded-xl border border-border/80 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Department:</span>
                  <span className="font-semibold text-foreground">{selectedEmpForAdd.department?.name || 'General'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Designation:</span>
                  <span className="font-semibold text-foreground">{selectedEmpForAdd.designation?.title || 'Staff'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reporting Manager:</span>
                  <span className="font-semibold text-foreground">
                    {selectedEmpForAdd.reportingManager
                      ? `${selectedEmpForAdd.reportingManager.firstName} ${selectedEmpForAdd.reportingManager.lastName}`
                      : 'Unassigned'}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t text-[11px]">
                  <span className="text-muted-foreground">Clearance Template:</span>
                  <span className="font-semibold text-primary">
                    Auto-configured for {selectedEmpForAdd.department?.name || 'Corporate'}
                  </span>
                </div>
              </div>
            )}

            {/* Exit Type & Dynamic Reason */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Exit Type *</Label>
                <Select value={formExitType} onValueChange={handleExitTypeChange}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select Exit Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXIT_TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t.id} value={t.id} className="text-xs">
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Contextual Exit Reason *</Label>
                <Select value={formReason} onValueChange={setFormReason}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select Reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {(EXIT_REASONS_MAP[formExitType] || ['Other']).map((r) => (
                      <SelectItem key={r} value={r} className="text-xs">
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notice Period & Expected LWD Calculator */}
            <div className="p-3 bg-muted/30 rounded-xl border border-border/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" /> Notice Period & LWD Engine
                </span>
                <span className="text-[10px] text-muted-foreground">Auto-calculates Expected LWD</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium">Notice Start / Resignation Date</Label>
                  <Input
                    type="date"
                    value={formResignDate}
                    onChange={(e) => setFormResignDate(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium">Contract Notice (Days)</Label>
                  <Input
                    type="number"
                    value={formNoticeDays}
                    onChange={(e) => setFormNoticeDays(Number(e.target.value))}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium">Expected Last Working Day (Auto)</Label>
                  <Input
                    type="date"
                    value={formLwd || calculatedExpectedLwd}
                    onChange={(e) => setFormLwd(e.target.value)}
                    className="h-8 text-xs font-mono font-semibold text-primary bg-primary/5"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium">Requested LWD (Early Release)</Label>
                  <Input
                    type="date"
                    value={formRequestedLwd}
                    onChange={(e) => setFormRequestedLwd(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium">Notice Waived (Days)</Label>
                  <Input
                    type="number"
                    value={formNoticeWaivedDays}
                    onChange={(e) => setFormNoticeWaivedDays(Number(e.target.value))}
                    className="h-8 text-xs font-mono"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium">Notice Buyout Amount (₹)</Label>
                  <Input
                    type="number"
                    value={formNoticeBuyout}
                    onChange={(e) => setFormNoticeBuyout(Number(e.target.value))}
                    className="h-8 text-xs font-mono"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">HR Remarks & Handover Notes</Label>
              <Input
                placeholder="Internal HR & Manager notes regarding separation..."
                value={formRemarks}
                onChange={(e) => setFormRemarks(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs" disabled={createExitMutation.isPending}>
                {createExitMutation.isPending ? 'Initiating...' : 'Initialize Universal Workflow'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── 4. Comprehensive Universal Offboarding Lifecycle Drawer / Modal ── */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto">
          {activeExitDetail && (
            <div className="space-y-5 text-xs">
              {(() => {
                const isClearanceDone = activeExitDetail.clearanceStatus === 'COMPLETED';
                const isInterviewDone =
                  activeExitDetail.exitInterviewStatus === 'COMPLETED' ||
                  activeExitDetail.exitInterviewStatus === 'WAIVED' ||
                  !interviewRequired;
                const isFnfDone = activeExitDetail.fnfStatus === 'COMPLETED';
                const isEligibleForFinalSignoff = isClearanceDone && isInterviewDone && isFnfDone;
                const isAlreadySeparated =
                  activeExitDetail.status === 'EXITED' || activeExitDetail.status === 'OFFBOARDING_COMPLETED';

                return (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-muted/40 rounded-xl border border-border/80 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono font-bold text-xs bg-background">
                          {activeExitDetail.exitCode}
                        </Badge>
                        <h2 className="text-sm font-bold text-foreground">
                          {activeExitDetail.employee?.firstName} {activeExitDetail.employee?.lastName}
                        </h2>
                        <Badge className="text-[10px]">
                          {isAlreadySeparated ? 'SEPARATED' : activeExitDetail.status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Dept: <strong>{activeExitDetail.employee?.department?.name || 'General'}</strong> • Title:{' '}
                        <strong>{activeExitDetail.employee?.designation?.title || 'Staff'}</strong> • Code:{' '}
                        <strong className="font-mono">{activeExitDetail.employee?.employeeCode}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant={isAlreadySeparated ? 'default' : 'outline'}
                        className={`text-xs gap-1.5 ${isAlreadySeparated ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                        onClick={() => setDetailTab('final')}
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {isAlreadySeparated ? 'Separation Completed' : 'Final Exit Approval Gate'}
                      </Button>
                    </div>
                  </div>
                );
              })()}

              {/* Universal Offboarding Lifecycle Stage Stepper */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  Offboarding Workflow Stage Progress
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {LIFECYCLE_STAGES.map((stg) => {
                    const isActive = activeExitDetail.status === stg.id;
                    return (
                      <button
                        key={stg.id}
                        onClick={() => {
                          updateStatusMutation.mutate({ id: activeExitDetail.id, status: stg.id });
                        }}
                        className={`px-2.5 py-1 text-[10.5px] font-mono font-semibold rounded-lg shrink-0 transition-all ${
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-xs'
                            : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {stg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab Navigation - 6 Universal Workflow Tabs */}
              <div className="w-full overflow-x-auto border-b border-border">
                <div className="grid grid-cols-6 min-w-[750px] w-full gap-1">
                  {[
                    { id: 'clearance', label: '1. Department Clearance', icon: CheckSquare },
                    { id: 'assets', label: '2. Asset Return & Recovery', icon: ShieldCheck },
                    { id: 'interview', label: '3. Exit Interview', icon: MessageSquare },
                    { id: 'attendance', label: '4. Attendance & LWD', icon: Calendar },
                    { id: 'fnf', label: '5. Full & Final Settlement', icon: DollarSign },
                    { id: 'final', label: '6. Final Signoff & Separation', icon: UserCheck },
                  ].map((t) => {
                    const Icon = t.icon;
                    const isActive = detailTab === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setDetailTab(t.id as any)}
                        className={`flex items-center justify-center gap-1.5 px-2 py-2 text-[11px] font-semibold border-b-2 transition-all truncate text-center ${
                          isActive
                            ? 'border-primary text-primary bg-primary/5 font-bold'
                            : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── TAB 1: Dynamic Department Clearances ── */}
              {detailTab === 'clearance' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-foreground text-xs">Department Clearance Matrix</h3>
                      <p className="text-[11px] text-muted-foreground">
                        Clearance tasks generated based on employee's department & operational profile
                      </p>
                    </div>
                    {/* Dynamic Department Filter Tabs (No Hardcoded 6 Departments) */}
                    <div className="flex flex-wrap items-center bg-muted/40 p-1 rounded-xl border border-border gap-1">
                      {availableClearanceDepts.map((dept) => (
                        <button
                          key={dept}
                          onClick={() => setSelectedDeptFilter(dept)}
                          className={`px-2 py-0.5 text-[10.5px] font-semibold rounded-lg capitalize transition-all ${
                            selectedDeptFilter === dept
                              ? 'bg-background text-foreground shadow-xs'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {dept}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(activeExitDetail.clearanceItems || [])
                      .filter((i) => selectedDeptFilter === 'all' || i.department === selectedDeptFilter)
                      .map((item: ExitClearanceItem) => (
                        <div
                          key={item.id}
                          className="flex items-start justify-between p-3 rounded-xl border border-border/80 bg-card hover:bg-muted/20 transition-colors"
                        >
                          <div className="space-y-1 pr-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[9.5px] font-mono">
                                {item.department}
                              </Badge>
                              <span className="font-semibold text-foreground text-xs">{item.itemLabel}</span>
                            </div>
                            {item.verifiedBy && (
                              <p className="text-[10px] text-muted-foreground">
                                Verified by <strong className="text-foreground">{item.verifiedBy}</strong> on{' '}
                                {new Date(item.verifiedAt || '').toLocaleDateString()}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {['PENDING', 'CLEARED', 'WAIVED'].map((st) => (
                              <button
                                key={st}
                                onClick={() =>
                                  updateClearanceMutation.mutate({
                                    itemId: item.id,
                                    status: st,
                                    remarks: `Status set to ${st}`,
                                  })
                                }
                                className={`px-2 py-1 text-[10px] font-mono font-semibold rounded-md transition-all ${
                                  item.status === st
                                    ? st === 'CLEARED'
                                      ? 'bg-emerald-600 text-white'
                                      : st === 'WAIVED'
                                      ? 'bg-amber-600 text-white'
                                      : 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground hover:text-foreground'
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* ── TAB 2: Asset Return & Recovery Checklist ── */}
              {detailTab === 'assets' && (
                <div className="space-y-4 p-4 border rounded-xl bg-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground text-xs">
                        Assigned Asset Return & Physical Condition Audit
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Live query from Asset Allocation register for{' '}
                        <strong>
                          {activeExitDetail.employee?.firstName} {activeExitDetail.employee?.lastName}
                        </strong>{' '}
                        ({activeExitDetail.employee?.employeeCode})
                      </p>
                    </div>
                    {activeAssignedAssets.length > 0 && (
                      <Button size="sm" variant="outline" className="text-xs gap-1" onClick={syncAssetRecoveryToFnf}>
                        <DollarSign className="h-3.5 w-3.5 text-rose-600" /> Sync ₹{totalAssetRecovery} to F&F
                      </Button>
                    )}
                  </div>

                  {activeAssignedAssets.length === 0 ? (
                    <div className="p-8 bg-muted/20 rounded-xl border border-dashed text-center space-y-2.5 my-2">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Laptop className="h-5 w-5" />
                      </div>
                      <h4 className="font-semibold text-xs text-foreground">
                        No assets are currently assigned to this employee.
                      </h4>
                      <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
                        This employee has 0 active device or hardware allocations in the Asset Allocation register.
                        Asset clearance is automatically marked as{' '}
                        <strong className="text-emerald-600 font-semibold">NOT REQUIRED</strong>.
                      </p>
                      <div className="pt-2">
                        <Badge
                          variant="outline"
                          className="text-[10.5px] text-emerald-600 bg-emerald-500/10 border-emerald-500/30 font-semibold"
                        >
                          ✓ Asset Clearance: Automatically Cleared (Not Required)
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="border rounded-xl overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/40">
                              <TableHead className="text-xs">Asset Item</TableHead>
                              <TableHead className="text-xs">Tag / Serial</TableHead>
                              <TableHead className="text-xs">Return Status</TableHead>
                              <TableHead className="text-xs">Physical Condition</TableHead>
                              <TableHead className="text-xs text-right">Recovery Fee (₹)</TableHead>
                              <TableHead className="text-xs text-right">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {activeAssignedAssets.map((asset) => {
                              const state = assetItemsState[asset.id] || {
                                status: 'PENDING',
                                condition: 'GOOD',
                                recoveryCost: 0,
                              };
                              const isReturned = state.status === 'RETURNED';

                              return (
                                <TableRow key={asset.id}>
                                  <TableCell className="font-semibold text-xs text-foreground flex items-center gap-2">
                                    <Laptop className="h-3.5 w-3.5 text-muted-foreground" /> {asset.name}
                                  </TableCell>
                                  <TableCell className="font-mono text-xs">
                                    {asset.assetTag}
                                    {asset.serialNumber && (
                                      <span className="block text-[10px] text-muted-foreground font-sans">
                                        S/N: {asset.serialNumber}
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Select
                                      value={state.status}
                                      onValueChange={(val) => {
                                        setAssetItemsState((prev) => ({
                                          ...prev,
                                          [asset.id]: {
                                            ...state,
                                            status: val,
                                          },
                                        }));
                                      }}
                                    >
                                      <SelectTrigger className="h-7 text-[11px] w-28">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="PENDING">Pending Return</SelectItem>
                                        <SelectItem value="RETURNED">Returned</SelectItem>
                                        <SelectItem value="DAMAGED">Damaged</SelectItem>
                                        <SelectItem value="LOST">Lost / Missing</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell>
                                    <Select
                                      value={state.condition}
                                      onValueChange={(val) => {
                                        let recFee = state.recoveryCost;
                                        if (val === 'DAMAGED' && recFee === 0) recFee = 2500;
                                        if (val === 'LOST' && recFee === 0) recFee = 15000;
                                        setAssetItemsState((prev) => ({
                                          ...prev,
                                          [asset.id]: {
                                            ...state,
                                            condition: val,
                                            recoveryCost: recFee,
                                          },
                                        }));
                                      }}
                                    >
                                      <SelectTrigger className="h-7 text-[11px] w-28">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="GOOD">Good / Intact</SelectItem>
                                        <SelectItem value="DAMAGED">Damaged</SelectItem>
                                        <SelectItem value="LOST">Lost / Missing</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Input
                                      type="number"
                                      value={state.recoveryCost}
                                      onChange={(e) => {
                                        const fee = Number(e.target.value) || 0;
                                        setAssetItemsState((prev) => ({
                                          ...prev,
                                          [asset.id]: {
                                            ...state,
                                            recoveryCost: fee,
                                          },
                                        }));
                                      }}
                                      className="h-7 w-24 text-xs font-mono text-right inline-block"
                                    />
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      size="sm"
                                      variant={isReturned ? 'outline' : 'default'}
                                      className={`h-7 text-[10.5px] ${isReturned ? 'text-emerald-600' : 'bg-primary'}`}
                                      onClick={() => {
                                        returnAssetMutation.mutate({
                                          assetId: asset.id,
                                          condition: state.condition,
                                        });
                                        setAssetItemsState((prev) => ({
                                          ...prev,
                                          [asset.id]: { ...state, status: 'RETURNED' },
                                        }));
                                      }}
                                      disabled={returnAssetMutation.isPending}
                                    >
                                      {isReturned ? 'Returned to Stock' : 'Mark Returned'}
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border">
                        <span className="text-xs font-semibold text-muted-foreground">
                          Total Asset Damage / Loss Recovery Fee:
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold font-mono text-rose-600">
                            ₹{totalAssetRecovery.toLocaleString('en-IN')}
                          </span>
                          <Button
                            size="sm"
                            className="h-7 text-[11px] bg-rose-600 hover:bg-rose-700 text-white"
                            onClick={syncAssetRecoveryToFnf}
                          >
                            Apply to F&F Deductions
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── TAB 3: Exit Interview Questionnaire (Conditional) ── */}
              {detailTab === 'interview' && (
                <div className="space-y-4 p-4 border rounded-xl bg-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground text-xs">Exit Interview Feedback & Assessment</h3>
                      <p className="text-[11px] text-muted-foreground">
                        Conditional questionnaire. Can be waived for absconding, demise, or summary terminations.
                      </p>
                    </div>
                    {/* Waiver Toggle */}
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                        <input
                          type="checkbox"
                          checked={!interviewRequired}
                          onChange={(e) => setInterviewRequired(!e.target.checked)}
                          className="rounded"
                        />
                        <span>Waive Exit Interview</span>
                      </label>
                    </div>
                  </div>

                  {!interviewRequired ? (
                    <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/30 space-y-3">
                      <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs">
                        <Info className="h-4 w-4 text-amber-600" />
                        Exit Interview Formality Waived
                      </div>
                      <p className="text-[11px] text-amber-800">
                        This separation type or corporate policy has waived the exit questionnaire. This formality will not block the Final Exit Signoff.
                      </p>
                      <div className="space-y-1">
                        <Label className="text-xs">Reason for Waiver</Label>
                        <Input
                          placeholder="e.g. Absconding employee untraceable / Mutual separation agreement..."
                          value={interviewWaiverReason}
                          onChange={(e) => setInterviewWaiverReason(e.target.value)}
                          className="h-8 text-xs bg-background"
                        />
                      </div>
                      <Button
                        size="sm"
                        className="text-xs bg-amber-600 hover:bg-amber-700 text-white"
                        onClick={() =>
                          saveInterviewMutation.mutate({
                            isWaived: true,
                            waiverReason: interviewWaiverReason || 'Waived by corporate policy',
                            primaryReason: 'WAIVED',
                          })
                        }
                        disabled={saveInterviewMutation.isPending}
                      >
                        Confirm Interview Waiver
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Primary Exit Reason *</Label>
                          <Input
                            value={interviewPrimaryReason}
                            onChange={(e) => setInterviewPrimaryReason(e.target.value)}
                            className="h-9 text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Secondary Exit Reason</Label>
                          <Input
                            value={interviewSecondaryReason}
                            onChange={(e) => setInterviewSecondaryReason(e.target.value)}
                            className="h-9 text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Employee Feedback / Suggestions</Label>
                          <Input
                            value={interviewEmpFeedback}
                            onChange={(e) => setInterviewEmpFeedback(e.target.value)}
                            className="h-9 text-xs"
                            placeholder="Employee's stated feedback..."
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Manager / HR Feedback</Label>
                          <Input
                            value={interviewMgrFeedback}
                            onChange={(e) => setInterviewMgrFeedback(e.target.value)}
                            className="h-9 text-xs"
                            placeholder="Manager comments..."
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-xl">
                        <div className="space-y-1">
                          <Label className="text-xs">Work Environment Rating (1-5)</Label>
                          <Select
                            value={String(interviewWorkRating)}
                            onValueChange={(v) => setInterviewWorkRating(Number(v))}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5 - Excellent</SelectItem>
                              <SelectItem value="4">4 - Good</SelectItem>
                              <SelectItem value="3">3 - Average</SelectItem>
                              <SelectItem value="2">2 - Needs Improvement</SelectItem>
                              <SelectItem value="1">1 - Poor</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Compensation & Benefits Rating (1-5)</Label>
                          <Select
                            value={String(interviewCompRating)}
                            onValueChange={(v) => setInterviewCompRating(Number(v))}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5 - Highly Competitive</SelectItem>
                              <SelectItem value="4">4 - Fair / Good</SelectItem>
                              <SelectItem value="3">3 - Market Average</SelectItem>
                              <SelectItem value="2">2 - Below Expectations</SelectItem>
                              <SelectItem value="1">1 - Poor</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 pt-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={interviewRecommend}
                            onChange={(e) => setInterviewRecommend(e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-xs font-medium">Would recommend company to others</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={interviewRehire}
                            onChange={(e) => setInterviewRehire(e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-xs font-medium text-emerald-600 font-semibold">
                            Eligible for Rehire in future
                          </span>
                        </label>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">HR Interview Remarks</Label>
                        <Input
                          value={interviewHrRemarks}
                          onChange={(e) => setInterviewHrRemarks(e.target.value)}
                          className="h-9 text-xs"
                          placeholder="Final HR observations..."
                        />
                      </div>

                      <Button
                        size="sm"
                        className="text-xs gap-1"
                        onClick={() =>
                          saveInterviewMutation.mutate({
                            isWaived: false,
                            primaryReason: interviewPrimaryReason,
                            secondaryReason: interviewSecondaryReason,
                            employeeFeedback: interviewEmpFeedback,
                            managerFeedback: interviewMgrFeedback,
                            workEnvironmentRating: interviewWorkRating,
                            compensationRating: interviewCompRating,
                            recommendCompany: interviewRecommend,
                            rehireEligible: interviewRehire,
                            hrRemarks: interviewHrRemarks,
                          })
                        }
                        disabled={saveInterviewMutation.isPending}
                      >
                        <Check className="h-3.5 w-3.5" /> Save Exit Interview Feedback
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* ── TAB 4: Attendance & Leave Closure + LWD Validation ── */}
              {detailTab === 'attendance' && (
                <div className="space-y-4">
                  {/* Attendance Closure Box */}
                  <div className="p-4 bg-muted/40 rounded-xl border border-border/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h3 className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Attendance & Leave Register Closure
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          Reconcile unavailed paid leaves and finalize attendance records up to Last Working Day (LWD)
                        </p>
                      </div>
                      <Badge variant={attendanceClosed ? 'default' : 'outline'} className="text-[10px]">
                        {attendanceClosed ? 'ATTENDANCE CLOSED' : 'AUDIT PENDING'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-3 p-3 bg-background rounded-lg border text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Working Days in Month:</span>
                        <strong className="text-foreground text-sm font-mono">22 Days</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Present Days up to LWD:</span>
                        <strong className="text-emerald-600 text-sm font-mono">19 Days</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Unavailed Leave Balance:</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <strong className="text-primary text-sm font-mono">{unavailedLeaveDays} Days</strong>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-[10px] text-primary px-1.5"
                            onClick={() => {
                              const calc = Math.round(((50000 / 30) * unavailedLeaveDays));
                              setFnfLeaveEncashment(calc);
                              toast.success(`Leave encashment ₹${calc.toLocaleString('en-IN')} synced to F&F!`);
                            }}
                          >
                            Sync to F&F
                          </Button>
                        </div>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={attendanceClosed}
                        onChange={(e) => setAttendanceClosed(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-xs font-semibold text-foreground">
                        Confirm Attendance & Biometric punches closed up to LWD
                      </span>
                    </label>
                  </div>

                  {/* LWD Adjust & Early Release Tool */}
                  <div className="p-3 bg-muted/40 rounded-xl border border-border/80 space-y-3">
                    <h3 className="font-semibold text-foreground text-xs">Confirm / Adjust Last Working Day (LWD)</h3>
                    <div className="flex items-center gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px]">Adjusted LWD</Label>
                        <Input
                          type="date"
                          value={adjustLwdDate || activeExitDetail.lastWorkingDay.split('T')[0]}
                          onChange={(e) => setAdjustLwdDate(e.target.value)}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1 flex-1">
                        <Label className="text-[11px]">Reason for Early Release / Waiver</Label>
                        <Input
                          placeholder="e.g. Notice buyout approved by management..."
                          value={adjustLwdReason}
                          onChange={(e) => setAdjustLwdReason(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <Button
                        size="sm"
                        className="h-8 text-xs mt-4"
                        onClick={() =>
                          adjustLwdMutation.mutate({
                            adjustedLwd: adjustLwdDate || activeExitDetail.lastWorkingDay.split('T')[0],
                            reason: adjustLwdReason || 'Adjusted by HR',
                          })
                        }
                      >
                        Update LWD
                      </Button>
                    </div>
                  </div>

                  {/* Chronological Audit Log */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground text-xs">Chronological Separation Audit Trail</h3>
                    <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                      {(activeExitDetail.auditLogs || []).map((log) => (
                        <div key={log.id} className="flex items-start justify-between p-2 rounded-lg border bg-card text-[11px]">
                          <div className="space-y-0.5">
                            <span className="font-mono font-semibold text-primary">{log.action}</span>
                            {log.remarks && <p className="text-muted-foreground">{log.remarks}</p>}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-semibold text-foreground block">{log.performedBy}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 5: Full & Final Settlement (F&F) ── */}
              {detailTab === 'fnf' && (
                <div className="space-y-4 p-4 border rounded-xl bg-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground text-xs">Full & Final (F&F) Settlement Engine</h3>
                      <p className="text-[11px] text-muted-foreground">
                        Salary Due + Leave Encashment + Bonus + Gratuity - Recoveries = Net Settlement Amount
                      </p>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs font-semibold">
                      F&F Status: {fnfStatus}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Gross Earnings */}
                    <div className="space-y-3 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                      <span className="font-semibold text-emerald-700 text-xs block">Gross Earnings Payable (+)</span>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span>Earned Salary Dues</span>
                          <Input
                            type="number"
                            value={fnfSalaryPayable}
                            onChange={(e) => setFnfSalaryPayable(Number(e.target.value))}
                            className="h-7 w-28 text-xs font-mono text-right"
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span>Leave Encashment Dues</span>
                          <Input
                            type="number"
                            value={fnfLeaveEncashment}
                            onChange={(e) => setFnfLeaveEncashment(Number(e.target.value))}
                            className="h-7 w-28 text-xs font-mono text-right"
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span>Pending Performance Incentives</span>
                          <Input
                            type="number"
                            value={fnfIncentives}
                            onChange={(e) => setFnfIncentives(Number(e.target.value))}
                            className="h-7 w-28 text-xs font-mono text-right"
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span>Expense Reimbursements</span>
                          <Input
                            type="number"
                            value={fnfReimbursements}
                            onChange={(e) => setFnfReimbursements(Number(e.target.value))}
                            className="h-7 w-28 text-xs font-mono text-right"
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span>Gratuity (Tenure {'>='} 5 Yrs)</span>
                          <Input
                            type="number"
                            value={fnfGratuity}
                            onChange={(e) => setFnfGratuity(Number(e.target.value))}
                            className="h-7 w-28 text-xs font-mono text-right"
                          />
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t font-semibold text-xs">
                          <span>Gross Total Earnings</span>
                          <span className="font-mono text-emerald-600">₹{grossFnfPayable.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Total Deductions */}
                    <div className="space-y-3 p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">
                      <span className="font-semibold text-rose-700 text-xs block">Recoveries & Deductions (-)</span>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span>Notice Shortfall / Buyout</span>
                          <Input
                            type="number"
                            value={fnfNoticeRecovery}
                            onChange={(e) => setFnfNoticeRecovery(Number(e.target.value))}
                            className="h-7 w-28 text-xs font-mono text-right"
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span>Loan / Advance Balance</span>
                          <Input
                            type="number"
                            value={fnfLoanRecovery}
                            onChange={(e) => setFnfLoanRecovery(Number(e.target.value))}
                            className="h-7 w-28 text-xs font-mono text-right"
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span>Unreturned Asset / Damage</span>
                          <Input
                            type="number"
                            value={fnfAssetRecovery}
                            onChange={(e) => setFnfAssetRecovery(Number(e.target.value))}
                            className="h-7 w-28 text-xs font-mono text-right"
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span>Other Misc Deductions</span>
                          <Input
                            type="number"
                            value={fnfOtherDeductions}
                            onChange={(e) => setFnfOtherDeductions(Number(e.target.value))}
                            className="h-7 w-28 text-xs font-mono text-right"
                          />
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t font-semibold text-xs">
                          <span>Total Deductions</span>
                          <span className="font-mono text-rose-600">₹{totalFnfDeductions.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Net Summary Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-muted rounded-xl border gap-3">
                    <div>
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                        NET FULL & FINAL SETTLEMENT AMOUNT
                      </span>
                      <p className="text-2xl font-bold text-primary font-mono mt-0.5">
                        ₹{netFnfPayable.toLocaleString('en-IN')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() =>
                          saveFnfMutation.mutate({
                            salaryPayable: fnfSalaryPayable,
                            leaveEncashment: fnfLeaveEncashment,
                            incentives: fnfIncentives,
                            reimbursements: fnfReimbursements,
                            gratuity: fnfGratuity,
                            noticeRecovery: fnfNoticeRecovery,
                            loanAdvanceRecovery: fnfLoanRecovery,
                            assetRecovery: fnfAssetRecovery,
                            otherDeductions: fnfOtherDeductions,
                            status: 'REVIEWED',
                          })
                        }
                      >
                        Save Draft F&F (HR)
                      </Button>
                      <Button
                        size="sm"
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() =>
                          saveFnfMutation.mutate({
                            salaryPayable: fnfSalaryPayable,
                            leaveEncashment: fnfLeaveEncashment,
                            incentives: fnfIncentives,
                            reimbursements: fnfReimbursements,
                            gratuity: fnfGratuity,
                            noticeRecovery: fnfNoticeRecovery,
                            loanAdvanceRecovery: fnfLoanRecovery,
                            assetRecovery: fnfAssetRecovery,
                            otherDeductions: fnfOtherDeductions,
                            status: 'APPROVED',
                            approvedBy: 'Finance Head',
                          })
                        }
                      >
                        <Check className="h-3.5 w-3.5 mr-1" /> Approve F&F (Finance Head)
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 6: Final Exit Signoff & Separation Gate ── */}
              {detailTab === 'final' && (
                (() => {
                  const isClearanceDone = activeExitDetail.clearanceStatus === 'COMPLETED';
                  const isAssetDone =
                    activeAssignedAssets.length === 0 ||
                    ((totalAssetRecovery === 0 || fnfAssetRecovery === totalAssetRecovery) &&
                      activeAssignedAssets.every(
                        (a) => assetItemsState[a.id]?.status === 'RETURNED' || assetItemsState[a.id]?.status === 'WAIVED',
                      ));
                  const isInterviewDone =
                    activeExitDetail.exitInterviewStatus === 'COMPLETED' ||
                    activeExitDetail.exitInterviewStatus === 'WAIVED' ||
                    !interviewRequired;
                  const isAttendanceDone = attendanceClosed;
                  const isFnfDone = activeExitDetail.fnfStatus === 'COMPLETED';
                  const isLwdDone = !!(activeExitDetail.adjustedLwd || activeExitDetail.lastWorkingDay);
                  const isMatrixDone = activeExitDetail.status !== 'REJECTED';

                  const isEligibleForFinalSignoff =
                    isClearanceDone && isAssetDone && isInterviewDone && isAttendanceDone && isFnfDone && isLwdDone;
                  const isAlreadySeparated =
                    activeExitDetail.status === 'EXITED' || activeExitDetail.status === 'OFFBOARDING_COMPLETED';

                  return (
                    <div className="space-y-4 p-4 border rounded-xl bg-card">
                      <div>
                        <h3 className="font-semibold text-foreground text-xs">Final Offboarding Approval Checklist & Signoff Gate</h3>
                        <p className="text-[11px] text-muted-foreground">
                          All 7 prerequisite gates must be verified before granting final separation signoff.
                        </p>
                      </div>

                      {/* 7-Gate Prerequisite Checklist */}
                      <div className="space-y-2">
                        {/* Gate 1: Exit Matrix Approval */}
                        <div className={`flex items-center justify-between p-2.5 rounded-lg border ${isMatrixDone ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                          <div className="flex items-center gap-2">
                            {isMatrixDone ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-rose-600" />}
                            <span className="font-semibold text-xs">1. Exit Initiation & Approval Matrix</span>
                          </div>
                          <Badge variant={isMatrixDone ? 'default' : 'destructive'} className="text-[10px]">
                            {isMatrixDone ? 'VERIFIED' : 'PENDING'}
                          </Badge>
                        </div>

                        {/* Gate 2: Notice Period & LWD Validation */}
                        <div className={`flex items-center justify-between p-2.5 rounded-lg border ${isLwdDone ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                          <div className="flex items-center gap-2">
                            {isLwdDone ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-rose-600" />}
                            <span className="font-semibold text-xs">2. Notice Period & LWD Validation</span>
                          </div>
                          <Badge variant={isLwdDone ? 'default' : 'destructive'} className="text-[10px]">
                            {isLwdDone ? 'LWD CONFIRMED' : 'PENDING'}
                          </Badge>
                        </div>

                        {/* Gate 3: Department Clearances */}
                        <div className={`flex items-center justify-between p-2.5 rounded-lg border ${isClearanceDone ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                          <div className="flex items-center gap-2">
                            {isClearanceDone ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-rose-600" />}
                            <span className="font-semibold text-xs">3. Department Clearances ({availableClearanceDepts.length - 1} Configured Depts)</span>
                          </div>
                          <Badge variant={isClearanceDone ? 'default' : 'destructive'} className="text-[10px]">
                            {isClearanceDone ? '100% CLEARED' : 'CLEARANCE PENDING'}
                          </Badge>
                        </div>

                        {/* Gate 4: Asset Return Clearance */}
                        <div className={`flex items-center justify-between p-2.5 rounded-lg border ${isAssetDone ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                          <div className="flex items-center gap-2">
                            {isAssetDone ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-rose-600" />}
                            <span className="font-semibold text-xs">4. Asset Return & Recovery Fee Reconciliation</span>
                          </div>
                          <Badge variant={isAssetDone ? 'default' : 'destructive'} className="text-[10px]">
                            {activeAssignedAssets.length === 0
                              ? 'NOT REQUIRED (CLEARED)'
                              : isAssetDone
                              ? 'ASSETS RETURNED'
                              : 'PENDING RETURN'}
                          </Badge>
                        </div>

                        {/* Gate 5: Exit Interview (Conditional) */}
                        <div className={`flex items-center justify-between p-2.5 rounded-lg border ${isInterviewDone ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                          <div className="flex items-center gap-2">
                            {isInterviewDone ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-rose-600" />}
                            <span className="font-semibold text-xs">5. Exit Interview Questionnaire</span>
                          </div>
                          <Badge variant={isInterviewDone ? 'default' : 'destructive'} className="text-[10px]">
                            {activeExitDetail.exitInterviewStatus === 'WAIVED' || !interviewRequired
                              ? 'WAIVED'
                              : isInterviewDone
                              ? 'COMPLETED'
                              : 'INTERVIEW PENDING'}
                          </Badge>
                        </div>

                        {/* Gate 6: Attendance & Leave Closure */}
                        <div className={`flex items-center justify-between p-2.5 rounded-lg border ${isAttendanceDone ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                          <div className="flex items-center gap-2">
                            {isAttendanceDone ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-rose-600" />}
                            <span className="font-semibold text-xs">6. Attendance & Leave Register Closure</span>
                          </div>
                          <Badge variant={isAttendanceDone ? 'default' : 'destructive'} className="text-[10px]">
                            {isAttendanceDone ? 'CLOSED' : 'PENDING'}
                          </Badge>
                        </div>

                        {/* Gate 7: F&F Settlement Approval */}
                        <div className={`flex items-center justify-between p-2.5 rounded-lg border ${isFnfDone ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                          <div className="flex items-center gap-2">
                            {isFnfDone ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-rose-600" />}
                            <span className="font-semibold text-xs">7. Full & Final Settlement (F&F) Finance Approval</span>
                          </div>
                          <Badge variant={isFnfDone ? 'default' : 'destructive'} className="text-[10px]">
                            {isFnfDone ? 'FINANCE APPROVED' : 'APPROVAL PENDING'}
                          </Badge>
                        </div>
                      </div>

                      {!isEligibleForFinalSignoff ? (
                        <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30 text-[11px] text-amber-800 space-y-1">
                          <p className="font-semibold flex items-center gap-1.5 text-amber-900">
                            <AlertCircle className="h-3.5 w-3.5 text-amber-600" /> Final Exit Approval Locked:
                          </p>
                          <p>
                            Final Signoff cannot be executed while prerequisites are pending. Please complete all pending gates above to unlock final separation.
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30 text-[11px] text-emerald-800 space-y-1">
                          <p className="font-semibold flex items-center gap-1.5 text-emerald-900">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> All 7 Prerequisites Verified:
                          </p>
                          <p>
                            Executing Final Exit Approval will transition employee master status from <strong>ACTIVE</strong> to{' '}
                            <strong>SEPARATED</strong> as of LWD{' '}
                            {new Date(activeExitDetail.adjustedLwd || activeExitDetail.lastWorkingDay).toLocaleDateString()}.
                          </p>
                        </div>
                      )}

                      <Button
                        size="sm"
                        className="w-full h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => completeExitMutation.mutate(activeExitDetail.id)}
                        disabled={completeExitMutation.isPending || isAlreadySeparated || !isEligibleForFinalSignoff}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {isAlreadySeparated
                          ? 'Employee Status: SEPARATED (Offboarding Completed)'
                          : !isEligibleForFinalSignoff
                          ? 'Final Exit Approval Disabled (Prerequisites Pending)'
                          : 'Grant Final Exit Approval & Transition to SEPARATED'}
                      </Button>

                      {/* ── Exit Documents & Relieving Records ── */}
                      <div className="pt-3 border-t space-y-2">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase block">
                          Exit Records & Formal Separation Documents
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs gap-1.5 justify-start"
                            onClick={() => setDocModalType('relieving')}
                          >
                            <FileText className="h-3.5 w-3.5 text-primary" /> Relieving Letter
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs gap-1.5 justify-start"
                            onClick={() => setDocModalType('experience')}
                          >
                            <Briefcase className="h-3.5 w-3.5 text-emerald-600" /> Experience Certificate
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs gap-1.5 justify-start"
                            onClick={() => setDocModalType('fnf')}
                          >
                            <DollarSign className="h-3.5 w-3.5 text-cyan-600" /> F&F Statement
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          )}

          <DialogFooter>
            <Button size="sm" variant="outline" className="text-xs" onClick={() => setIsDetailOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 5. Enterprise Separation Document Generation Preview Modal ── */}
      <Dialog open={!!docModalType} onOpenChange={(open) => !open && setDocModalType(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {activeExitDetail && (
            <div className="space-y-4 p-4 text-xs font-sans">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <div>
                    <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                      Enterprise Human Capital Management
                    </h2>
                    <p className="text-[10px] text-muted-foreground">Offboarding Records & Separation Certification</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => window.print()}>
                  <Printer className="h-3.5 w-3.5" /> Print Document
                </Button>
              </div>

              {/* Relieving Letter Template */}
              {docModalType === 'relieving' && (
                <div className="space-y-4 p-4 bg-muted/20 rounded-xl border leading-relaxed">
                  <div className="text-right text-[11px] text-muted-foreground">
                    Date: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                  <div className="font-semibold text-foreground">
                    To Whom It May Concern,
                  </div>
                  <div className="text-center font-bold text-sm tracking-wide underline uppercase">
                    RELIEVING LETTER & SERVICE CLEARANCE
                  </div>
                  <p>
                    This is to certify that <strong>{activeExitDetail.employee?.firstName} {activeExitDetail.employee?.lastName}</strong> (Employee Code: <span className="font-mono font-semibold">{activeExitDetail.employee?.employeeCode}</span>) was employed with us in the <strong>{activeExitDetail.employee?.department?.name || 'Operations'}</strong> department as a <strong>{activeExitDetail.employee?.designation?.title || 'Staff Member'}</strong>.
                  </p>
                  <p>
                    Their resignation has been formally accepted, and they have been relieved of their duties at the close of business on <strong>{new Date(activeExitDetail.adjustedLwd || activeExitDetail.lastWorkingDay).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>.
                  </p>
                  <p>
                    All departmental clearances, company assets handover, and full & final financial settlements have been satisfactorily concluded. We confirm that there are no outstanding liabilities against them.
                  </p>
                  <p>We wish them every success in their future career endeavors.</p>
                  <div className="pt-8 flex justify-between">
                    <div>
                      <p className="font-bold">Authorized Signatory</p>
                      <p className="text-[11px] text-muted-foreground">Human Resources Directorate</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">Official Seal</p>
                      <p className="text-[11px] text-muted-foreground font-mono">EHCM-VERIFIED</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Experience Certificate Template */}
              {docModalType === 'experience' && (
                <div className="space-y-4 p-4 bg-muted/20 rounded-xl border leading-relaxed">
                  <div className="text-right text-[11px] text-muted-foreground">
                    Date: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                  <div className="text-center font-bold text-sm tracking-wide underline uppercase">
                    EXPERIENCE CERTIFICATE
                  </div>
                  <p>
                    This is to certify that <strong>{activeExitDetail.employee?.firstName} {activeExitDetail.employee?.lastName}</strong> was employed with our organization from their official date of joining until their separation on <strong>{new Date(activeExitDetail.adjustedLwd || activeExitDetail.lastWorkingDay).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>.
                  </p>
                  <p>
                    During their tenure, they served with distinction as <strong>{activeExitDetail.employee?.designation?.title || 'Professional'}</strong> in the <strong>{activeExitDetail.employee?.department?.name || 'Corporate Operations'}</strong> department.
                  </p>
                  <p>
                    During their tenure of employment, we found them to be diligent, dedicated, and professional in handling their responsibilities. Their conduct and character were exemplary throughout their service.
                  </p>
                  <div className="pt-8 flex justify-between">
                    <div>
                      <p className="font-bold">Director of Human Resources</p>
                      <p className="text-[11px] text-muted-foreground">Enterprise Human Capital Management</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">Company Seal</p>
                      <p className="text-[11px] text-muted-foreground font-mono">SEAL-2026-EXP</p>
                    </div>
                  </div>
                </div>
              )}

              {/* F&F Settlement Statement Template */}
              {docModalType === 'fnf' && (
                <div className="space-y-4 p-4 bg-muted/20 rounded-xl border leading-relaxed">
                  <div className="text-center font-bold text-sm tracking-wide underline uppercase">
                    FULL & FINAL (F&F) SETTLEMENT STATEMENT
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] p-2 bg-muted/40 rounded-lg">
                    <div>Employee: <strong>{activeExitDetail.employee?.firstName} {activeExitDetail.employee?.lastName}</strong></div>
                    <div>Employee Code: <strong className="font-mono">{activeExitDetail.employee?.employeeCode}</strong></div>
                    <div>Department: <strong>{activeExitDetail.employee?.department?.name || 'General'}</strong></div>
                    <div>LWD: <strong>{new Date(activeExitDetail.adjustedLwd || activeExitDetail.lastWorkingDay).toLocaleDateString()}</strong></div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20 space-y-1">
                      <span className="font-bold text-emerald-800 block">Gross Earnings:</span>
                      <div className="flex justify-between"><span>Earned Salary:</span> <span className="font-mono">₹{fnfSalaryPayable.toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between"><span>Leave Encashment:</span> <span className="font-mono">₹{fnfLeaveEncashment.toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between"><span>Incentives:</span> <span className="font-mono">₹{fnfIncentives.toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between"><span>Reimbursements:</span> <span className="font-mono">₹{fnfReimbursements.toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between"><span>Gratuity:</span> <span className="font-mono">₹{fnfGratuity.toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between font-bold pt-1 border-t"><span>Total Gross:</span> <span className="font-mono text-emerald-700">₹{grossFnfPayable.toLocaleString('en-IN')}</span></div>
                    </div>

                    <div className="p-3 bg-rose-500/10 rounded-lg border border-rose-500/20 space-y-1">
                      <span className="font-bold text-rose-800 block">Deductions & Recoveries:</span>
                      <div className="flex justify-between"><span>Notice Shortfall:</span> <span className="font-mono">₹{fnfNoticeRecovery.toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between"><span>Loan Balance:</span> <span className="font-mono">₹{fnfLoanRecovery.toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between"><span>Asset Recovery:</span> <span className="font-mono">₹{fnfAssetRecovery.toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between"><span>Other Misc:</span> <span className="font-mono">₹{fnfOtherDeductions.toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between font-bold pt-1 border-t"><span>Total Deductions:</span> <span className="font-mono text-rose-700">₹{totalFnfDeductions.toLocaleString('en-IN')}</span></div>
                    </div>
                  </div>

                  <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 flex justify-between items-center text-sm font-bold">
                    <span>NET PAYABLE DISBURSEMENT:</span>
                    <span className="font-mono text-primary text-base">₹{netFnfPayable.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="pt-4 flex justify-between text-[11px]">
                    <div>
                      <p className="font-bold">Prepared by: HR Operations</p>
                      <p className="text-muted-foreground">Status: Approved</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">Approved by: Finance Directorate</p>
                      <p className="text-muted-foreground">Disbursement: Verified</p>
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button size="sm" variant="outline" className="text-xs" onClick={() => setDocModalType(null)}>
                  Close Preview
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
