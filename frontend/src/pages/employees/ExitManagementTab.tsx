import { useState, useMemo, useEffect } from 'react';
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
  RotateCcw,
  Settings2,
  Loader2,
  GitFork,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { employeesApi } from '@/api/employees';
import { exitsApi, type EmployeeExit, type ExitClearanceItem } from '@/api/exits';
import { assetsApi } from '@/api/asset-management';
import { branchesApi } from '@/api/organization';
import { useCompany } from '@/context/CompanyContext';
import { StatusBadge } from '@/components/ui/status-badge';
import { ExitClearanceMasterModal } from './ExitClearanceMasterModal';

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

const WIZARD_STEPS = [
  { id: 1, label: '1. Initiated', shortLabel: 'Initiated', icon: LogOut, stageKey: 'INITIATED' },
  { id: 2, label: '2. HR Review', shortLabel: 'HR Review', icon: FileText, stageKey: 'HR_REVIEW' },
  { id: 3, label: '3. Manager Approval', shortLabel: 'Manager', icon: UserCheck, stageKey: 'MANAGER_APPROVAL' },
  { id: 4, label: '4. Notice Period', shortLabel: 'Notice Period', icon: Calendar, stageKey: 'NOTICE_PERIOD' },
  { id: 5, label: '5. Clearance & Assets', shortLabel: 'Clearance', icon: CheckSquare, stageKey: 'CLEARANCE_PENDING' },
  { id: 6, label: '6. Exit Interview', shortLabel: 'Interview', icon: MessageSquare, stageKey: 'EXIT_INTERVIEW' },
  { id: 7, label: '7. F&F Settlement', shortLabel: 'F&F', icon: DollarSign, stageKey: 'FNF_PENDING' },
  { id: 8, label: '8. Finalize Exit', shortLabel: 'Finalize', icon: ShieldCheck, stageKey: 'EXITED' },
];

const getInitialStepForExit = (exit: EmployeeExit): number => {
  switch (exit.status) {
    case 'INITIATED': return 1;
    case 'HR_REVIEW': return 2;
    case 'MANAGER_APPROVAL': return 3;
    case 'NOTICE_PERIOD': return 4;
    case 'CLEARANCE_PENDING':
    case 'CLEARANCE_COMPLETED': return 5;
    case 'EXIT_INTERVIEW': return 6;
    case 'FNF_PENDING': return 7;
    case 'EXITED':
    case 'OFFBOARDING_COMPLETED': return 8;
    default: return 5;
  }
};

export function ExitManagementTab() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isClearanceMasterOpen, setIsClearanceMasterOpen] = useState(false);
  const [selectedExitId, setSelectedExitId] = useState<string | null>(null);
  const [selectedExitFallback, setSelectedExitFallback] = useState<EmployeeExit | null>(null);
  const [wizardStep, setWizardStep] = useState<number>(1);

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

  // Organization Tenant Context
  const { activeCompanyId, activeCompany } = useCompany();
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');

  // Reset branch selection and details when active company changes
  useEffect(() => {
    setSelectedBranchId('ALL');
    setSelectedExitId(null);
    setSelectedExitFallback(null);
  }, [activeCompanyId]);

  // Fetch branches for the active company
  const { data: rawBranches = [] } = useQuery({
    queryKey: ['branches', activeCompanyId],
    queryFn: () => (activeCompanyId ? branchesApi.list(activeCompanyId) : branchesApi.list()),
    enabled: !!activeCompanyId,
  });

  const filteredBranches = useMemo(() => {
    if (!activeCompanyId) return rawBranches;
    return rawBranches.filter((b: any) => b.companyId === activeCompanyId);
  }, [rawBranches, activeCompanyId]);

  const effectiveBranchId = selectedBranchId !== 'ALL' ? selectedBranchId : undefined;

  // ── Queries ──
  const { data: employeesData } = useQuery({
    queryKey: ['employees-list-exit', activeCompanyId, effectiveBranchId],
    queryFn: () => employeesApi.list({ page: 1, pageSize: 1000, companyId: activeCompanyId, branchId: effectiveBranchId }),
  });
  const employees = employeesData?.items ?? [];

  const { data: exits = [], isLoading: isExitsLoading } = useQuery({
    queryKey: ['exits', activeCompanyId, effectiveBranchId, searchQuery, selectedStatus],
    queryFn: () => exitsApi.list({ search: searchQuery, status: selectedStatus, companyId: activeCompanyId, branchId: effectiveBranchId }),
  });

  const { data: kpis } = useQuery({
    queryKey: ['exits-kpis', activeCompanyId, effectiveBranchId],
    queryFn: () => exitsApi.getKpis(activeCompanyId, effectiveBranchId),
  });

  const { data: activeExitDetail } = useQuery({
    queryKey: ['exit-detail', selectedExitId, activeCompanyId],
    queryFn: () => (selectedExitId ? exitsApi.get(selectedExitId, activeCompanyId) : null),
    enabled: !!selectedExitId,
  });

  // Fallback to table row data immediately so modal renders with zero delay/blank state
  const currentExit = activeExitDetail || selectedExitFallback;

  // Query live assets from Asset Allocation module
  const { data: allAssets = [] } = useQuery({
    queryKey: ['assets-for-exit'],
    queryFn: () => assetsApi.list(),
  });

  // Dynamically resolve active allocations for selected exit employee
  const activeAssignedAssets = useMemo(() => {
    if (!currentExit?.employee?.id) return [];
    return allAssets.filter(
      (a) => a.currentEmployeeId === currentExit.employee?.id && a.status === 'ALLOCATED',
    );
  }, [allAssets, currentExit?.employee?.id]);

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
    if (!currentExit?.clearanceItems) return ['all'];
    const depts = Array.from(new Set(currentExit.clearanceItems.map((i) => i.department)));
    return ['all', ...depts];
  }, [currentExit?.clearanceItems]);

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
    onMutate: async ({ itemId, status }) => {
      setSelectedExitFallback((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          clearanceItems: (prev.clearanceItems || []).map((ci) =>
            ci.id === itemId
              ? {
                  ...ci,
                  status,
                  verifiedBy: status === 'PENDING' ? undefined : 'HR Lead',
                  verifiedAt: status === 'PENDING' ? undefined : new Date().toISOString(),
                }
              : ci,
          ),
        };
      });
    },
    onSuccess: (updatedItem) => {
      queryClient.invalidateQueries({ queryKey: ['exit-detail', selectedExitId] });
      queryClient.invalidateQueries({ queryKey: ['exits'] });
      queryClient.invalidateQueries({ queryKey: ['exits-kpis'] });
      setSelectedExitFallback((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          clearanceItems: (prev.clearanceItems || []).map((ci) =>
            ci.id === updatedItem.id ? updatedItem : ci,
          ),
        };
      });
      toast.success(`Clearance item marked as ${updatedItem.status}`);
    },
    onError: (err: any) => {
      queryClient.invalidateQueries({ queryKey: ['exit-detail', selectedExitId] });
      toast.error(err?.response?.data?.message ?? 'Failed to update clearance');
    },
  });
  const updateClearanceItemMutation = updateClearanceMutation;

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

  const recalculateMutation = useMutation({
    mutationFn: (exitId: string) => exitsApi.recalculateClearance(exitId, 'HR Admin'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exits'] });
      queryClient.invalidateQueries({ queryKey: ['exit-detail', selectedExitId] });
      toast.success('Clearance rules successfully re-evaluated against Company Master! Completed history preserved.');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to re-evaluate clearance rules');
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
    setSelectedExitFallback(exit);
    setSelectedExitId(exit.id);
    setWizardStep(getInitialStepForExit(exit));
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
      companyId: activeCompanyId,
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
        <CardHeader className="pb-3.5 border-b border-border/60 space-y-3">
          {/* Header Title & Subtitle Row (Full Width - Always One Line) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2 whitespace-nowrap">
                <LogOut className="h-4.5 w-4.5 text-primary" /> Universal Exit & Separation Management Engine
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                End-to-end offboarding engine across IT, Manufacturing, Healthcare & Corporate: Exit types, dynamic clearances, asset return, conditional interviews & F&F settlement
              </CardDescription>
            </div>
          </div>

          {/* Action Toolbar Row: Status Filter Pills + Search + Action Buttons */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pt-1">
            {/* Status Filter Pills */}
            <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border w-fit overflow-x-auto">
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

            {/* Right Controls: Search + Master Config + Initiate Button */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-48 sm:w-60">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search code, name, dept..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs rounded-xl"
                />
              </div>

              {/* Branch Filter Dropdown */}
              <div className="w-44 sm:w-52">
                <Select
                  value={selectedBranchId}
                  onValueChange={setSelectedBranchId}
                >
                  <SelectTrigger className="h-8 text-xs rounded-xl bg-background border-border/80 font-medium">
                    <div className="flex items-center gap-1.5 truncate">
                      <GitFork className="h-3.5 w-3.5 text-primary shrink-0" />
                      <SelectValue placeholder="All Branches & Offices">
                        {selectedBranchId === 'ALL'
                          ? 'All Branches & Offices'
                          : filteredBranches.find((b: any) => b.id === selectedBranchId)?.name || 'Selected Branch'}
                      </SelectValue>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL" className="text-xs font-semibold">
                      All Branches &amp; Offices
                    </SelectItem>
                    {filteredBranches.map((br: any) => (
                      <SelectItem key={br.id} value={br.id} className="text-xs">
                        <div className="flex items-center justify-between w-full gap-2">
                          <span className="truncate">{br.name}</span>
                          {br.code && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {br.code}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1.5 rounded-xl shadow-xs"
                onClick={() => setIsClearanceMasterOpen(true)}
              >
                <Settings2 className="h-3.5 w-3.5" /> Clearance Master Config
              </Button>

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
          {!currentExit ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground font-medium">Loading offboarding lifecycle details...</p>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              {(() => {
                const pendingMandatoryClearance = (currentExit.clearanceItems || []).filter(
                  (i) => i.status === 'PENDING' && !i.remarks?.includes('[OPTIONAL]'),
                );
                const isClearanceDone = pendingMandatoryClearance.length === 0;
                const isAssetDone =
                  activeAssignedAssets.length === 0 ||
                  activeAssignedAssets.every((a) => assetItemsState[a.id]?.status === 'RETURNED');
                const isAttendanceDone = attendanceClosed;
                const isInterviewDone =
                  currentExit.exitInterviewStatus === 'COMPLETED' ||
                  currentExit.exitInterviewStatus === 'WAIVED' ||
                  !interviewRequired;
                const isFnfDone = currentExit.fnfStatus === 'COMPLETED';
                const isLwdDone = !!(currentExit.adjustedLwd || currentExit.lastWorkingDay);
                const isMatrixDone = currentExit.status !== 'REJECTED';
                const isEligibleForFinalSignoff =
                  isClearanceDone && isAssetDone && isAttendanceDone && isInterviewDone && isFnfDone && isLwdDone && isMatrixDone;
                const isAlreadySeparated =
                  currentExit.status === 'EXITED' || currentExit.status === 'OFFBOARDING_COMPLETED';

                return (
                  <div className="space-y-4">
                    {/* Top Case Summary Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 bg-muted/40 rounded-xl border border-border/80 gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="font-mono font-bold text-xs bg-background">
                            {currentExit.exitCode}
                          </Badge>
                          <h2 className="text-sm font-bold text-foreground">
                            {currentExit.employee?.firstName} {currentExit.employee?.lastName}
                          </h2>
                          <Badge className="text-[10px]">
                            {isAlreadySeparated ? 'SEPARATED' : currentExit.status}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] font-mono">
                            {currentExit.exitType}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Dept: <strong>{currentExit.employee?.department?.name || 'General'}</strong> • Title:{' '}
                          <strong>{currentExit.employee?.designation?.title || 'Staff'}</strong> • Code:{' '}
                          <strong className="font-mono">{currentExit.employee?.employeeCode}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant={isAlreadySeparated ? 'default' : 'outline'}
                          className={`text-xs gap-1.5 ${isAlreadySeparated ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                          onClick={() => setWizardStep(8)}
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          {isAlreadySeparated ? 'Separation Completed' : 'Final Exit Approval Gate'}
                        </Button>
                      </div>
                    </div>

                    {/* ── Enterprise 8-Step Unified Workflow Wizard Stepper ── */}
                    <div className="space-y-2 p-3 bg-muted/20 rounded-xl border border-border/80">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5 text-primary" /> Lifecycle Workflow Wizard
                        </span>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          Step <strong>{wizardStep}</strong> of 8: <strong className="text-primary">{WIZARD_STEPS.find((s) => s.id === wizardStep)?.label}</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 pt-0.5">
                        {WIZARD_STEPS.map((step) => {
                          const isActive = wizardStep === step.id;
                          const Icon = step.icon;

                          const isStepComplete =
                            step.id === 1 ? true :
                            step.id === 2 ? currentExit.status !== 'INITIATED' :
                            step.id === 3 ? !['INITIATED', 'HR_REVIEW'].includes(currentExit.status) :
                            step.id === 4 ? !['INITIATED', 'HR_REVIEW', 'MANAGER_APPROVAL'].includes(currentExit.status) :
                            step.id === 5 ? (isClearanceDone && isAssetDone) :
                            step.id === 6 ? isInterviewDone :
                            step.id === 7 ? isFnfDone :
                            isAlreadySeparated;

                          return (
                            <button
                              key={step.id}
                              type="button"
                              onClick={() => setWizardStep(step.id)}
                              className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center group cursor-pointer ${
                                isActive
                                  ? 'bg-primary text-primary-foreground border-primary shadow-xs font-bold'
                                  : isStepComplete
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 hover:bg-emerald-500/20'
                                  : 'bg-background border-border/70 text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                              }`}
                            >
                              <div className="flex items-center gap-1 mb-1">
                                {isStepComplete && !isActive ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                ) : (
                                  <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                                )}
                                <span className="font-mono text-[9.5px] opacity-80">#{step.id}</span>
                              </div>
                              <span className="text-[10px] truncate max-w-full font-semibold leading-tight">
                                {step.shortLabel}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* ── STEP 1: INITIATED ── */}
                    {wizardStep === 1 && (
                      <div className="space-y-4 p-4 border rounded-xl bg-card">
                        <div className="flex items-center justify-between border-b pb-3">
                          <div>
                            <h3 className="font-semibold text-foreground text-xs flex items-center gap-2">
                              <LogOut className="h-4 w-4 text-primary" /> Step 1: Separation Case Initiation
                            </h3>
                            <p className="text-[11px] text-muted-foreground">
                              Initial resignation submission parameters and employee baseline record
                            </p>
                          </div>
                          <Badge variant="outline" className="font-mono text-[10.5px]">
                            {currentExit.exitCode}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Employee Information */}
                          <div className="p-3.5 bg-muted/30 rounded-xl border space-y-2 text-xs">
                            <span className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider block">
                              Employee Information
                            </span>
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div>
                                <span className="text-muted-foreground block text-[10px]">Full Name</span>
                                <strong className="text-foreground">{currentExit.employee?.firstName} {currentExit.employee?.lastName}</strong>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-[10px]">Employee Code</span>
                                <strong className="font-mono text-foreground">{currentExit.employee?.employeeCode}</strong>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-[10px]">Department</span>
                                <strong className="text-foreground">{currentExit.employee?.department?.name || 'General'}</strong>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-[10px]">Designation</span>
                                <strong className="text-foreground">{currentExit.employee?.designation?.title || 'Staff'}</strong>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-[10px]">Work Email</span>
                                <span className="text-foreground">{currentExit.employee?.workEmail || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-[10px]">Phone</span>
                                <span className="text-foreground">{currentExit.employee?.phone || 'N/A'}</span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-muted-foreground block text-[10px]">Reporting Manager</span>
                                <strong className="text-foreground">
                                  {currentExit.employee?.reportingManager
                                    ? `${currentExit.employee.reportingManager.firstName} ${currentExit.employee.reportingManager.lastName}`
                                    : 'Unassigned'}
                                </strong>
                              </div>
                            </div>
                          </div>

                          {/* Separation Parameters */}
                          <div className="p-3.5 bg-muted/30 rounded-xl border space-y-2 text-xs">
                            <span className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider block">
                              Separation Parameters
                            </span>
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div>
                                <span className="text-muted-foreground block text-[10px]">Exit Type</span>
                                <Badge variant="secondary" className="font-semibold text-[10px]">
                                  {currentExit.exitType}
                                </Badge>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-[10px]">Current Status</span>
                                <Badge className="text-[10px]">{currentExit.status}</Badge>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-[10px]">Resignation Date</span>
                                <strong className="font-mono text-foreground">
                                  {new Date(currentExit.resignationDate).toLocaleDateString()}
                                </strong>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-[10px]">Contract Notice</span>
                                <strong className="font-mono text-foreground">{currentExit.noticePeriodDays} Days</strong>
                              </div>
                              <div className="col-span-2">
                                <span className="text-muted-foreground block text-[10px]">Expected Last Working Day (LWD)</span>
                                <strong className="font-mono text-primary">
                                  {new Date(currentExit.lastWorkingDay).toLocaleDateString()}
                                </strong>
                              </div>
                              <div className="col-span-2">
                                <span className="text-muted-foreground block text-[10px]">Primary Reason for Leaving</span>
                                <p className="text-foreground font-medium">{currentExit.exitReason}</p>
                              </div>
                              {currentExit.remarks && (
                                <div className="col-span-2">
                                  <span className="text-muted-foreground block text-[10px]">Remarks / Notes</span>
                                  <p className="text-muted-foreground italic">{currentExit.remarks}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t">
                          <span className="text-[11px] text-muted-foreground">
                            Case initiated. Advance to HR Review to verify contractual terms and service obligations.
                          </span>
                          <div className="flex items-center gap-2">
                            {currentExit.status === 'INITIATED' && (
                              <Button
                                size="sm"
                                className="text-xs"
                                onClick={() => {
                                  updateStatusMutation.mutate({ id: currentExit.id, status: 'HR_REVIEW' });
                                  setWizardStep(2);
                                }}
                              >
                                Mark HR Review in Progress →
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs gap-1"
                              onClick={() => setWizardStep(2)}
                            >
                              Next: HR Review <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── STEP 2: HR REVIEW ── */}
                    {wizardStep === 2 && (
                      <div className="space-y-4 p-4 border rounded-xl bg-card">
                        <div className="flex items-center justify-between border-b pb-3">
                          <div>
                            <h3 className="font-semibold text-foreground text-xs flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary" /> Step 2: HR Review & Contractual Obligations Audit
                            </h3>
                            <p className="text-[11px] text-muted-foreground">
                              Audit notice period compliance, employment agreements, training bonds, and non-disclosure obligations
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[10px]">HR Review</Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="p-3 bg-muted/30 rounded-xl border space-y-1">
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Contract Notice</span>
                            <strong className="text-sm font-mono text-foreground">{currentExit.noticePeriodDays} Days</strong>
                            <p className="text-[10px] text-muted-foreground">Per appointment contract</p>
                          </div>
                          <div className="p-3 bg-muted/30 rounded-xl border space-y-1">
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Service Bond Check</span>
                            <strong className="text-sm font-semibold text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Cleared (0 Default)
                            </strong>
                            <p className="text-[10px] text-muted-foreground">No active training liability</p>
                          </div>
                          <div className="p-3 bg-muted/30 rounded-xl border space-y-1">
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold block">NDA / Confidentiality</span>
                            <strong className="text-sm font-semibold text-primary flex items-center gap-1">
                              <ShieldCheck className="h-3.5 w-3.5" /> Active in Force
                            </strong>
                            <p className="text-[10px] text-muted-foreground">Post-employment terms apply</p>
                          </div>
                        </div>

                        <div className="p-3.5 bg-muted/40 rounded-xl border space-y-2">
                          <Label className="text-xs font-semibold">HR Verification Notes & Policy Compliance Remarks</Label>
                          <Input
                            placeholder="e.g. Resignation acknowledged by HR. Notice period terms and standard handover requirements confirmed."
                            className="h-9 text-xs"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs"
                            onClick={() => setWizardStep(1)}
                          >
                            ← Back to Initiated
                          </Button>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                updateStatusMutation.mutate({ id: currentExit.id, status: 'MANAGER_APPROVAL' });
                                setWizardStep(3);
                              }}
                            >
                              Approve HR Review & Advance →
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs gap-1"
                              onClick={() => setWizardStep(3)}
                            >
                              Next: Manager Approval <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── STEP 3: MANAGER APPROVAL ── */}
                    {wizardStep === 3 && (
                      <div className="space-y-4 p-4 border rounded-xl bg-card">
                        <div className="flex items-center justify-between border-b pb-3">
                          <div>
                            <h3 className="font-semibold text-foreground text-xs flex items-center gap-2">
                              <UserCheck className="h-4 w-4 text-primary" /> Step 3: Reporting Manager Approval & Knowledge Transfer
                            </h3>
                            <p className="text-[11px] text-muted-foreground">
                              Departmental project handover, task transition, and manager separation signoff
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[10px]">Manager Gate</Badge>
                        </div>

                        <div className="p-3.5 bg-muted/30 rounded-xl border space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[10.5px] text-muted-foreground uppercase font-semibold block">Designated Manager</span>
                              <strong className="text-xs text-foreground">
                                {currentExit.employee?.reportingManager
                                  ? `${currentExit.employee.reportingManager.firstName} ${currentExit.employee.reportingManager.lastName}`
                                  : 'Unassigned (Department Head Signoff)'}
                              </strong>
                            </div>
                            <Badge variant="secondary" className="text-[10px]">
                              {currentExit.employee?.department?.name || 'General Department'}
                            </Badge>
                          </div>

                          <div className="space-y-2 pt-2 border-t text-xs">
                            <span className="text-[11px] font-semibold text-foreground block">Transition & Handover Checklist:</span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <label className="flex items-center gap-2 p-2.5 rounded-lg border bg-background text-[11px] cursor-pointer">
                                <input type="checkbox" defaultChecked className="rounded border-muted-foreground/40 text-primary" />
                                <span>Knowledge Transfer (KT) Documents</span>
                              </label>
                              <label className="flex items-center gap-2 p-2.5 rounded-lg border bg-background text-[11px] cursor-pointer">
                                <input type="checkbox" defaultChecked className="rounded border-muted-foreground/40 text-primary" />
                                <span>Ongoing Deliverables Handed Over</span>
                              </label>
                              <label className="flex items-center gap-2 p-2.5 rounded-lg border bg-background text-[11px] cursor-pointer">
                                <input type="checkbox" defaultChecked className="rounded border-muted-foreground/40 text-primary" />
                                <span>Workstation & Tools Cleared</span>
                              </label>
                            </div>
                          </div>

                          <div className="space-y-1.5 pt-2">
                            <Label className="text-[11px] font-medium">Manager Handover Comments</Label>
                            <Input
                              placeholder="e.g. Responsibilities successfully reassigned to senior team members. Clearance approved."
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs"
                            onClick={() => setWizardStep(2)}
                          >
                            ← Back to HR Review
                          </Button>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                updateStatusMutation.mutate({ id: currentExit.id, status: 'NOTICE_PERIOD' });
                                setWizardStep(4);
                              }}
                            >
                              Sign off Manager Approval →
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs gap-1"
                              onClick={() => setWizardStep(4)}
                            >
                              Next: Notice Period <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── STEP 4: NOTICE PERIOD & LWD ── */}
                    {wizardStep === 4 && (
                      <div className="space-y-4 p-4 border rounded-xl bg-card">
                        <div className="flex items-center justify-between border-b pb-3">
                          <div>
                            <h3 className="font-semibold text-foreground text-xs flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-primary" /> Step 4: Notice Period Tracking & Last Working Day (LWD)
                            </h3>
                            <p className="text-[11px] text-muted-foreground">
                              Monitor notice duration served, evaluate early release requests, and adjust official separation date
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[10px]">Notice Period</Badge>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div className="p-3 bg-muted/30 rounded-xl border">
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Resignation Date</span>
                            <strong className="text-sm font-mono text-foreground">
                              {new Date(currentExit.resignationDate).toLocaleDateString()}
                            </strong>
                          </div>
                          <div className="p-3 bg-muted/30 rounded-xl border">
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Contract Notice</span>
                            <strong className="text-sm font-mono text-foreground">{currentExit.noticePeriodDays} Days</strong>
                          </div>
                          <div className="p-3 bg-muted/30 rounded-xl border">
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Expected LWD</span>
                            <strong className="text-sm font-mono text-foreground">
                              {new Date(currentExit.lastWorkingDay).toLocaleDateString()}
                            </strong>
                          </div>
                          <div className="p-3 bg-muted/30 rounded-xl border">
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Effective / Adjusted LWD</span>
                            <strong className="text-sm font-mono text-primary">
                              {new Date(currentExit.adjustedLwd || currentExit.lastWorkingDay).toLocaleDateString()}
                            </strong>
                          </div>
                        </div>

                        {/* Confirm / Adjust LWD Card */}
                        <div className="p-3.5 bg-muted/40 rounded-xl border border-border/80 space-y-3">
                          <h3 className="font-semibold text-foreground text-xs">Confirm / Adjust Last Working Day (LWD)</h3>
                          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                            <div className="space-y-1">
                              <Label className="text-[11px]">Adjusted LWD</Label>
                              <Input
                                type="date"
                                value={adjustLwdDate || (currentExit.lastWorkingDay ? currentExit.lastWorkingDay.split('T')[0] : '')}
                                onChange={(e) => setAdjustLwdDate(e.target.value)}
                                className="h-8 text-xs font-mono"
                              />
                            </div>
                            <div className="space-y-1 flex-1 min-w-[200px]">
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
                                  adjustedLwd: adjustLwdDate || (currentExit.lastWorkingDay ? currentExit.lastWorkingDay.split('T')[0] : ''),
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
                          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                            {(currentExit.auditLogs || []).map((log) => (
                              <div key={log.id} className="flex items-start justify-between p-2 rounded-lg border bg-card text-[11px]">
                                <div className="space-y-0.5">
                                  <span className="font-mono font-semibold text-primary">{log.action}</span>
                                  {log.remarks && <p className="text-muted-foreground">{log.remarks}</p>}
                                </div>
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString()}
                                </span>
                              </div>
                            ))}
                            {(currentExit.auditLogs || []).length === 0 && (
                              <p className="text-muted-foreground text-xs italic py-2">No audit log entries recorded yet.</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs"
                            onClick={() => setWizardStep(3)}
                          >
                            ← Back to Manager
                          </Button>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                updateStatusMutation.mutate({ id: currentExit.id, status: 'CLEARANCE_PENDING' });
                                setWizardStep(5);
                              }}
                            >
                              Advance to Clearance & Assets →
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs gap-1"
                              onClick={() => setWizardStep(5)}
                            >
                              Next: Clearance <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── STEP 5: CLEARANCE & ASSETS (UNIFIED) ── */}
                    {wizardStep === 5 && (
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-foreground text-xs flex items-center gap-2">
                              Department Clearance & Asset Return Matrix
                              <Badge variant="outline" className="text-[10px] font-mono uppercase bg-primary/5 text-primary border-primary/20">
                                Intelligent Dynamic Engine
                              </Badge>
                            </h3>
                            <p className="text-[11px] text-muted-foreground">
                              Clearance tasks evaluated from Company Clearance Master based on employee's role, personal assets & exit type
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/5 font-semibold"
                              onClick={() => recalculateMutation.mutate(currentExit.id)}
                              disabled={recalculateMutation.isPending}
                            >
                              <RotateCcw className={`h-3.5 w-3.5 ${recalculateMutation.isPending ? 'animate-spin' : ''}`} />
                              {recalculateMutation.isPending ? 'Evaluating Rules...' : 'Re-evaluate Clearance Rules'}
                            </Button>
                          </div>
                        </div>

                        {/* Summary Metric Strip */}
                        {(() => {
                          const items = currentExit.clearanceItems || [];
                          const mandatoryPending = items.filter(
                            (i) => i.status === 'PENDING' && !i.remarks?.includes('[OPTIONAL]'),
                          ).length;
                          const clearedCount = items.filter(
                            (i) => i.status === 'CLEARED' || i.status === 'WAIVED',
                          ).length;
                          const notApplicableCount = items.filter(
                            (i) => i.status === 'NOT_APPLICABLE',
                          ).length;

                          return (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                              <div className="p-2.5 rounded-xl border bg-card shadow-2xs">
                                <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                                  Configured Tasks
                                </span>
                                <span className="text-base font-bold font-mono text-foreground">{items.length} Total</span>
                              </div>
                              <div className="p-2.5 rounded-xl border bg-rose-500/10 border-rose-500/20 shadow-2xs">
                                <span className="text-[10px] text-rose-700 uppercase font-semibold block">
                                  Mandatory Pending (Blocks Exit)
                                </span>
                                <span className="text-base font-bold font-mono text-rose-700">{mandatoryPending}</span>
                              </div>
                              <div className="p-2.5 rounded-xl border bg-emerald-500/10 border-emerald-500/20 shadow-2xs">
                                <span className="text-[10px] text-emerald-700 uppercase font-semibold block">
                                  Cleared / Waived
                                </span>
                                <span className="text-base font-bold font-mono text-emerald-700">{clearedCount}</span>
                              </div>
                              <div className="p-2.5 rounded-xl border bg-muted/40 border-border shadow-2xs">
                                <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                                  Not Applicable (Auto-Excluded)
                                </span>
                                <span className="text-base font-bold font-mono text-muted-foreground">{notApplicableCount}</span>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Dynamic Department & Asset Filter Pills */}
                        <div className="flex flex-wrap items-center bg-muted/40 p-1 rounded-xl border border-border gap-1">
                          {availableClearanceDepts.map((dept) => {
                            const count =
                              dept === 'all'
                                ? (currentExit.clearanceItems || []).length
                                : (currentExit.clearanceItems || []).filter((i) => i.department === dept).length;
                            return (
                              <button
                                key={dept}
                                type="button"
                                onClick={() => setSelectedDeptFilter(dept)}
                                className={`px-2.5 py-1 text-[10.5px] font-semibold rounded-lg capitalize transition-all ${
                                  selectedDeptFilter === dept
                                    ? 'bg-background text-foreground shadow-xs'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                              >
                                {dept === 'all' ? `All Tasks (${count})` : `${dept} (${count})`}
                              </button>
                            );
                          })}
                          <button
                            type="button"
                            onClick={() => setSelectedDeptFilter('assets')}
                            className={`px-2.5 py-1 text-[10.5px] font-semibold rounded-lg capitalize transition-all ${
                              selectedDeptFilter === 'assets'
                                ? 'bg-background text-foreground shadow-xs'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            Company Assets ({activeAssignedAssets.length})
                          </button>
                        </div>

                        {/* Clearance Task Cards Matrix (Shown unless 'assets' filter selected) */}
                        {selectedDeptFilter !== 'assets' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {(currentExit.clearanceItems || [])
                              .filter((i) => selectedDeptFilter === 'all' || i.department === selectedDeptFilter)
                              .map((item: ExitClearanceItem) => {
                                const isMandatory = item.remarks?.includes('[MANDATORY]');
                                const isConditional = item.remarks?.includes('[CONDITIONAL]');
                                const isOptional = item.remarks?.includes('[OPTIONAL]');
                                const isNotApplicable = item.status === 'NOT_APPLICABLE';
                                const reasonText = item.remarks?.replace(/^\[.*?\]\s*/, '');

                                return (
                                  <div
                                    key={item.id}
                                    className={`flex flex-col justify-between p-3.5 rounded-xl border transition-all ${
                                      isNotApplicable
                                        ? 'border-dashed border-border/80 bg-muted/30 opacity-75'
                                        : item.status === 'CLEARED'
                                        ? 'border-emerald-500/30 bg-emerald-500/5'
                                        : item.status === 'WAIVED'
                                        ? 'border-amber-500/30 bg-amber-500/5'
                                        : 'border-border/80 bg-card hover:bg-muted/20'
                                    }`}
                                  >
                                    <div className="space-y-1.5">
                                      <div className="flex items-center gap-1.5 flex-wrap justify-between">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <Badge variant="outline" className="text-[9.5px] font-mono bg-background">
                                            {item.department}
                                          </Badge>

                                          {isMandatory && (
                                            <Badge className="bg-rose-600/15 text-rose-700 hover:bg-rose-600/25 border-rose-300 text-[9px] font-mono">
                                              MANDATORY
                                            </Badge>
                                          )}
                                          {isConditional && (
                                            <Badge className="bg-blue-600/15 text-blue-700 hover:bg-blue-600/25 border-blue-300 text-[9px] font-mono">
                                              CONDITIONAL
                                            </Badge>
                                          )}
                                          {isOptional && (
                                            <Badge className="bg-slate-600/15 text-slate-700 hover:bg-slate-600/25 border-slate-300 text-[9px] font-mono">
                                              OPTIONAL
                                            </Badge>
                                          )}
                                        </div>

                                        {isNotApplicable && (
                                          <Badge variant="secondary" className="text-[9.5px] font-mono bg-muted text-muted-foreground">
                                            NOT REQUIRED
                                          </Badge>
                                        )}
                                      </div>

                                      <span className="font-semibold text-foreground text-xs block">
                                        {item.itemLabel}
                                      </span>

                                      {isNotApplicable ? (
                                        <p className="text-[10.5px] text-muted-foreground italic flex items-center gap-1">
                                          <Info className="h-3 w-3 shrink-0 text-muted-foreground" />
                                          {reasonText || 'Not required for employee profile'}
                                        </p>
                                      ) : item.verifiedBy ? (
                                        <p className="text-[10px] text-muted-foreground">
                                          Verified by <strong className="text-foreground">{item.verifiedBy}</strong> on{' '}
                                          {new Date(item.verifiedAt || '').toLocaleDateString()}
                                          {item.remarks && !item.remarks.startsWith('[') ? ` • "${item.remarks}"` : ''}
                                        </p>
                                      ) : (
                                        <p className="text-[10px] text-muted-foreground">
                                          {isOptional ? 'Optional task (does not block exit signoff)' : 'Mandatory signoff required before exit'}
                                        </p>
                                      )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-border/60">
                                      <span className="text-[10px] font-mono text-muted-foreground uppercase">
                                        Status: <strong>{item.status}</strong>
                                      </span>

                                      <div className="flex items-center gap-1">
                                        {['PENDING', 'CLEARED', 'WAIVED'].map((st) => (
                                          <button
                                            key={st}
                                            type="button"
                                            disabled={updateClearanceMutation.isPending}
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              updateClearanceMutation.mutate({
                                                itemId: item.id,
                                                status: st,
                                                remarks: `Status updated to ${st} by Department Lead`,
                                              });
                                            }}
                                            className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-md transition-all cursor-pointer ${
                                              item.status === st
                                                ? st === 'CLEARED'
                                                  ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                                                  : st === 'WAIVED'
                                                  ? 'bg-amber-600 text-white shadow-xs hover:bg-amber-700'
                                                  : 'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90'
                                                : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground border border-border/70'
                                            }`}
                                          >
                                            {st}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        )}

                        {/* Assigned Company Assets Return Checklist (Shown on 'assets' filter OR at bottom of 'all') */}
                        {(selectedDeptFilter === 'assets' || selectedDeptFilter === 'all') && (
                          <div className="space-y-4 p-4 border rounded-xl bg-card">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                                  <Laptop className="h-4 w-4 text-primary" /> Assigned Asset Return & Physical Condition Audit
                                </h3>
                                <p className="text-[11px] text-muted-foreground">
                                  Live query from Asset Allocation register for{' '}
                                  <strong>
                                    {currentExit.employee?.firstName} {currentExit.employee?.lastName}
                                  </strong>{' '}
                                  ({currentExit.employee?.employeeCode})
                                </p>
                              </div>
                              {activeAssignedAssets.length > 0 && (
                                <Button size="sm" variant="outline" className="text-xs gap-1" onClick={syncAssetRecoveryToFnf}>
                                  <DollarSign className="h-3.5 w-3.5 text-rose-600" /> Sync ₹{totalAssetRecovery} to F&F
                                </Button>
                              )}
                            </div>

                            {activeAssignedAssets.length === 0 ? (
                              <div className="p-6 bg-muted/20 rounded-xl border border-dashed text-center space-y-2 my-1">
                                <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                  <Laptop className="h-4 w-4" />
                                </div>
                                <h4 className="font-semibold text-xs text-foreground">
                                  No assets are currently assigned to this employee.
                                </h4>
                                <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
                                  This employee has 0 active device or hardware allocations. Asset clearance is automatically marked as{' '}
                                  <strong className="text-emerald-600 font-semibold">NOT REQUIRED (CLEARED)</strong>.
                                </p>
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

              {/* Step 5 Navigation Bar */}
              <div className="flex items-center justify-between pt-3 border-t">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs"
                  onClick={() => setWizardStep(4)}
                >
                  ← Back to Notice Period
                </Button>
                <Button
                  size="sm"
                  className="text-xs gap-1"
                  onClick={() => setWizardStep(6)}
                >
                  Next: Exit Interview <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 6: EXIT INTERVIEW (CONDITIONAL) ── */}
          {wizardStep === 6 && (
            <div className="space-y-4 p-4 border rounded-xl bg-card">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4 text-primary" /> Exit Interview Feedback & Assessment
                  </h3>
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
                      <Textarea
                        value={interviewEmpFeedback}
                        onChange={(e) => setInterviewEmpFeedback(e.target.value)}
                        className="text-xs resize-none"
                        rows={3}
                        placeholder="Employee's perspective on team, management, working culture..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Manager Observations / Retrospective</Label>
                      <Textarea
                        value={interviewMgrFeedback}
                        onChange={(e) => setInterviewMgrFeedback(e.target.value)}
                        className="text-xs resize-none"
                        rows={3}
                        placeholder="Manager's notes on performance, conduct, transition..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Work Environment Rating (1-5)</Label>
                      <Select
                        value={String(interviewWorkRating)}
                        onValueChange={(v) => setInterviewWorkRating(Number(v))}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 - Excellent Workplace Culture</SelectItem>
                          <SelectItem value="4">4 - Good / Satisfactory</SelectItem>
                          <SelectItem value="3">3 - Average</SelectItem>
                          <SelectItem value="2">2 - Needs Improvement</SelectItem>
                          <SelectItem value="1">1 - Poor / Toxic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
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

              {/* Step 6 Navigation Bar */}
              <div className="flex items-center justify-between pt-3 border-t">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs"
                  onClick={() => setWizardStep(5)}
                >
                  ← Back to Clearance & Assets
                </Button>
                <Button
                  size="sm"
                  className="text-xs gap-1"
                  onClick={() => setWizardStep(7)}
                >
                  Next: F&F Settlement <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 7: FULL & FINAL SETTLEMENT (F&F) & ATTENDANCE ── */}
          {wizardStep === 7 && (
            <div className="space-y-4">
              {/* Attendance Closure Sub-Card */}
              <div className="p-4 bg-muted/40 rounded-xl border border-border/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-primary" /> Attendance & Leave Register Closure
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
                          const calc = Math.round((50000 / 30) * unavailedLeaveDays);
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

              {/* F&F Settlement Engine */}
              <div className="space-y-4 p-4 border rounded-xl bg-card">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4 text-emerald-600" /> Full & Final (F&F) Settlement Engine
                    </h3>
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

                  {/* Deductions & Recoveries */}
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
                        <span className="flex items-center gap-1">
                          Unreturned Asset / Damage
                          {totalAssetRecovery > 0 && (
                            <Badge variant="outline" className="text-[9px] text-rose-600 font-mono">
                              ₹{totalAssetRecovery}
                            </Badge>
                          )}
                        </span>
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

              {/* Step 7 Navigation Bar */}
              <div className="flex items-center justify-between pt-3 border-t">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs"
                  onClick={() => setWizardStep(6)}
                >
                  ← Back to Exit Interview
                </Button>
                <Button
                  size="sm"
                  className="text-xs gap-1"
                  onClick={() => setWizardStep(8)}
                >
                  Next: Final Exit Approval <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 8: FINALIZE EXIT & SEPARATION GATE ── */}
          {wizardStep === 8 && (
            <div className="space-y-4 p-4 border rounded-xl bg-card">
              <div>
                <h3 className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Final Offboarding Approval Checklist & Signoff Gate
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  All prerequisite gates must be verified before granting final separation signoff.
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
                    <span className="font-semibold text-xs">
                      3. Mandatory Department Clearances ({pendingMandatoryClearance.length === 0 ? 'All Completed' : `${pendingMandatoryClearance.length} Pending`})
                    </span>
                  </div>
                  <Badge variant={isClearanceDone ? 'default' : 'destructive'} className="text-[10px]">
                    {isClearanceDone ? '100% CLEARED' : `${pendingMandatoryClearance.length} PENDING`}
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
                    {currentExit.exitInterviewStatus === 'WAIVED' || !interviewRequired
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
                <div className="p-3.5 bg-rose-500/10 rounded-xl border border-rose-500/30 text-[11px] text-rose-900 space-y-2">
                  <p className="font-bold flex items-center gap-1.5 text-xs text-rose-900">
                    <AlertCircle className="h-4 w-4 text-rose-600" /> FINAL SIGNOFF BLOCKED:
                  </p>

                  {pendingMandatoryClearance.length > 0 && (
                    <div className="space-y-1">
                      <span className="font-semibold text-rose-800">
                        {pendingMandatoryClearance.length} mandatory clearance item(s) pending:
                      </span>
                      <ul className="list-disc list-inside pl-1 space-y-0.5 text-rose-700">
                        {pendingMandatoryClearance.map((item) => (
                          <li key={item.id}>
                            <strong>{item.itemLabel}</strong> — {item.department}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {!isFnfDone && (
                    <p className="text-rose-800 font-medium">
                      • Full & Final Settlement (F&F) is pending Finance approval.
                    </p>
                  )}
                  {!isInterviewDone && (
                    <p className="text-rose-800 font-medium">
                      • Exit Interview questionnaire has not been completed or waived.
                    </p>
                  )}
                  {!isAttendanceDone && (
                    <p className="text-rose-800 font-medium">
                      • Attendance & Leave Register closure audit has not been confirmed.
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-3.5 bg-emerald-500/10 rounded-xl border border-emerald-500/30 text-[11px] text-emerald-800 space-y-1">
                  <p className="font-semibold flex items-center gap-1.5 text-emerald-900">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> All Prerequisites Verified:
                  </p>
                  <p>
                    • Employee last working day is officially recorded as{' '}
                    {new Date(currentExit.adjustedLwd || currentExit.lastWorkingDay).toLocaleDateString()}.
                  </p>
                </div>
              )}

              <Button
                size="sm"
                className="w-full h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => completeExitMutation.mutate(currentExit.id)}
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

              {/* Step 8 Navigation Bar */}
              <div className="flex items-center justify-between pt-3 border-t">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs"
                  onClick={() => setWizardStep(7)}
                >
                  ← Back to F&F Settlement
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => setIsDetailOpen(false)}
                >
                  Complete & Close Modal
                </Button>
              </div>
            </div>
          )}

                  </div>
                );
              })()}
            </div>
          )}

          <DialogFooter className="flex items-center justify-between sm:justify-between border-t pt-3">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs gap-1"
                disabled={wizardStep === 1}
                onClick={() => setWizardStep((prev) => Math.max(1, prev - 1))}
              >
                ← Previous Step
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs gap-1"
                disabled={wizardStep === 8}
                onClick={() => setWizardStep((prev) => Math.min(8, prev + 1))}
              >
                Next Step →
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                Step <strong>{wizardStep}</strong> of 8: <strong className="text-primary">{WIZARD_STEPS.find((s) => s.id === wizardStep)?.label}</strong>
              </span>
              <Button size="sm" variant="default" className="text-xs" onClick={() => setIsDetailOpen(false)}>
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!docModalType} onOpenChange={(open) => !open && setDocModalType(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {currentExit && (
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
                    This is to certify that <strong>{currentExit.employee?.firstName} {currentExit.employee?.lastName}</strong> (Employee Code: <span className="font-mono font-semibold">{currentExit.employee?.employeeCode}</span>) was employed with us in the <strong>{currentExit.employee?.department?.name || 'Operations'}</strong> department as a <strong>{currentExit.employee?.designation?.title || 'Staff Member'}</strong>.
                  </p>
                  <p>
                    Their resignation has been formally accepted, and they have been relieved of their duties at the close of business on <strong>{new Date(currentExit.adjustedLwd || currentExit.lastWorkingDay).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>.
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
                    This is to certify that <strong>{currentExit.employee?.firstName} {currentExit.employee?.lastName}</strong> was employed with our organization from their official date of joining until their separation on <strong>{new Date(currentExit.adjustedLwd || currentExit.lastWorkingDay).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>.
                  </p>
                  <p>
                    During their tenure, they served with distinction as <strong>{currentExit.employee?.designation?.title || 'Professional'}</strong> in the <strong>{currentExit.employee?.department?.name || 'Corporate Operations'}</strong> department.
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
                    <div>Employee: <strong>{currentExit.employee?.firstName} {currentExit.employee?.lastName}</strong></div>
                    <div>Employee Code: <strong className="font-mono">{currentExit.employee?.employeeCode}</strong></div>
                    <div>Department: <strong>{currentExit.employee?.department?.name || 'General'}</strong></div>
                    <div>LWD: <strong>{new Date(currentExit.adjustedLwd || currentExit.lastWorkingDay).toLocaleDateString()}</strong></div>
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

      {/* ── 6. Company Exit Clearance Master Configuration Modal ── */}
      <ExitClearanceMasterModal
        open={isClearanceMasterOpen}
        onOpenChange={setIsClearanceMasterOpen}
        companyId={activeCompanyId || currentExit?.companyId || exits[0]?.companyId}
      />
    </div>
  );
}
