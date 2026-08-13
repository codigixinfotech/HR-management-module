import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  LogOut,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  HelpCircle,
  ShieldCheck,
  DollarSign,
  FileCheck,
  UserCheck,
  Calendar,
  Building,
  Briefcase,
  AlertCircle,
  FileText,
  MessageSquare,
  CheckSquare,
  History,
  Check,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { employeesApi } from '@/api/employees';
import { exitsApi, type EmployeeExit, type ExitClearanceItem } from '@/api/exits';

const LIFECYCLE_STAGES = [
  { id: 'INITIATED', label: '1. Initiated' },
  { id: 'HR_REVIEW', label: '2. HR Review' },
  { id: 'MANAGER_APPROVAL', label: '3. Manager Approval' },
  { id: 'NOTICE_PERIOD', label: '4. Notice Period' },
  { id: 'CLEARANCE_PENDING', label: '5. Clearance' },
  { id: 'CLEARANCE_COMPLETED', label: '6. Cleared' },
  { id: 'EXIT_INTERVIEW', label: '7. Interview' },
  { id: 'FNF_PENDING', label: '8. F&F Pending' },
  { id: 'FNF_COMPLETED', label: '9. F&F Done' },
  { id: 'FINAL_APPROVAL', label: '10. Final Signoff' },
  { id: 'EXITED', label: '11. Exited' },
  { id: 'OFFBOARDING_COMPLETED', label: '12. Offboarded' },
];

function getTabForStage(stageId: string): 'clearance' | 'interview' | 'fnf' | 'lwd' | 'final' {
  switch (stageId) {
    case 'CLEARANCE_PENDING':
    case 'CLEARANCE_COMPLETED':
      return 'clearance';
    case 'EXIT_INTERVIEW':
      return 'interview';
    case 'FNF_PENDING':
    case 'FNF_COMPLETED':
      return 'fnf';
    case 'FINAL_APPROVAL':
    case 'EXITED':
    case 'OFFBOARDING_COMPLETED':
      return 'final';
    case 'INITIATED':
    case 'HR_REVIEW':
    case 'MANAGER_APPROVAL':
    case 'NOTICE_PERIOD':
    default:
      return 'lwd';
  }
}

export function ExitManagementTab() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedExitId, setSelectedExitId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<'clearance' | 'interview' | 'fnf' | 'lwd' | 'final'>('clearance');

  // Add Form State
  const [formEmpId, setFormEmpId] = useState('');
  const [formResignDate, setFormResignDate] = useState(new Date().toISOString().split('T')[0]);
  const [formNoticeDays, setFormNoticeDays] = useState(90);
  const [formLwd, setFormLwd] = useState('');
  const [formExitType, setFormExitType] = useState('RESIGNATION');
  const [formReason, setFormReason] = useState('Better Career Opportunity');
  const [formRemarks, setFormRemarks] = useState('');

  // Clearance Filter State
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');

  // Exit Interview Form State
  const [interviewPrimaryReason, setInterviewPrimaryReason] = useState('Career Growth');
  const [interviewSecondaryReason, setInterviewSecondaryReason] = useState('');
  const [interviewEmpFeedback, setInterviewEmpFeedback] = useState('');
  const [interviewMgrFeedback, setInterviewMgrFeedback] = useState('');
  const [interviewWorkRating, setInterviewWorkRating] = useState(5);
  const [interviewCompRating, setInterviewCompRating] = useState(4);
  const [interviewRecommend, setInterviewRecommend] = useState(true);
  const [interviewRehire, setInterviewRehire] = useState(true);
  const [interviewHrRemarks, setInterviewHrRemarks] = useState('');

  // F&F Form State
  const [fnfSalaryPayable, setFnfSalaryPayable] = useState(0);
  const [fnfLeaveEncashment, setFnfLeaveEncashment] = useState(0);
  const [fnfIncentives, setFnfIncentives] = useState(0);
  const [fnfReimbursements, setFnfReimbursements] = useState(0);
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

  // Selected Employee Helper
  const selectedEmpForAdd = useMemo(() => {
    return employees.find((e) => e.id === formEmpId);
  }, [formEmpId, employees]);

  // Auto-calculate LWD when resignation date or notice days change
  const calculatedLwd = useMemo(() => {
    if (!formResignDate) return '';
    const date = new Date(formResignDate);
    date.setDate(date.getDate() + (Number(formNoticeDays) || 90));
    return date.toISOString().split('T')[0];
  }, [formResignDate, formNoticeDays]);

  // ── Mutations ──
  const createExitMutation = useMutation({
    mutationFn: (payload: Partial<EmployeeExit>) => exitsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exits'] });
      queryClient.invalidateQueries({ queryKey: ['exits-kpis'] });
      toast.success('Resignation initiated. Offboarding clearance checklist generated!');
      setIsAddOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to initiate resignation');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, remarks }: { id: string; status: string; remarks?: string }) =>
      exitsApi.updateStatus(id, { status, remarks }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exits'] });
      queryClient.invalidateQueries({ queryKey: ['exits-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['exit-detail', selectedExitId] });
      toast.success('Offboarding workflow stage updated successfully');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to update stage');
    },
  });

  const updateClearanceMutation = useMutation({
    mutationFn: ({ itemId, status, remarks }: { itemId: string; status: string; remarks?: string }) =>
      exitsApi.updateClearanceItem(itemId, { status, remarks }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exits'] });
      queryClient.invalidateQueries({ queryKey: ['exits-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['exit-detail', selectedExitId] });
      toast.success('Clearance item updated');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to update clearance');
    },
  });

  const saveInterviewMutation = useMutation({
    mutationFn: (payload: any) => exitsApi.saveExitInterview(selectedExitId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exits'] });
      queryClient.invalidateQueries({ queryKey: ['exit-detail', selectedExitId] });
      toast.success('Exit interview feedback recorded. Automatically switching to F&F Settlement tab.');
      setDetailTab('fnf');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to save exit interview');
    },
  });

  const saveFnfMutation = useMutation({
    mutationFn: (payload: any) => exitsApi.saveFnfSettlement(selectedExitId!, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['exits'] });
      queryClient.invalidateQueries({ queryKey: ['exits-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['exit-detail', selectedExitId] });
      toast.success('Full & Final Settlement saved & updated!');
      if (variables?.status === 'APPROVED') {
        setDetailTab('final');
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to save F&F settlement');
    },
  });

  const adjustLwdMutation = useMutation({
    mutationFn: (payload: { adjustedLwd: string; reason: string }) =>
      exitsApi.adjustLwd(selectedExitId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exits'] });
      queryClient.invalidateQueries({ queryKey: ['exit-detail', selectedExitId] });
      toast.success('Last Working Day adjusted with audit record');
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
      toast.success('Final Exit Approval Granted! Employee status set to EXITED in Employee Master.');
      setIsDetailOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to complete exit');
    },
  });

  // Modal Handlers
  const openAddModal = () => {
    setFormEmpId(employees[0]?.id || '');
    setFormResignDate(new Date().toISOString().split('T')[0]);
    setFormNoticeDays(90);
    setFormLwd('');
    setFormExitType('RESIGNATION');
    setFormReason('Better Career Opportunity');
    setFormRemarks('');
    setIsAddOpen(true);
  };

  const openDetailModal = (exit: EmployeeExit) => {
    setSelectedExitId(exit.id);
    setDetailTab('clearance');

    // Populate Interview state if exists
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
    }

    // Populate F&F state if exists
    if (exit.fnfSettlement) {
      setFnfSalaryPayable(exit.fnfSettlement.salaryPayable || 0);
      setFnfLeaveEncashment(exit.fnfSettlement.leaveEncashment || 0);
      setFnfIncentives(exit.fnfSettlement.incentives || 0);
      setFnfReimbursements(exit.fnfSettlement.reimbursements || 0);
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
      lastWorkingDay: formLwd || calculatedLwd,
      exitType: formExitType,
      exitReason: formReason,
      remarks: formRemarks,
    });
  };

  const grossFnfPayable = fnfSalaryPayable + fnfLeaveEncashment + fnfIncentives + fnfReimbursements;
  const totalFnfDeductions = fnfNoticeRecovery + fnfLoanRecovery + fnfAssetRecovery + fnfOtherDeductions;
  const netFnfPayable = grossFnfPayable - totalFnfDeductions;

  return (
    <div className="space-y-6">
      {/* ── 1. Top Exit Offboarding Stats Cards (Backend Driven) ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Active Exits</p>
              <p className="text-xl font-semibold text-foreground mt-0.5">{kpis?.activeExits ?? 0} Staff</p>
              <p className="text-[10px] text-primary font-semibold mt-1">Serving Notice</p>
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
              <p className="text-[10px] text-amber-600 font-semibold mt-1">HR / Mgr Review</p>
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
              <p className="text-[10px] text-violet-600 font-semibold mt-1">Checklists Active</p>
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
              <p className="text-xl font-semibold text-foreground mt-0.5">{kpis?.exitsThisMonth ?? 0} Completed</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">Offboarded</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <CheckCircle2 className="h-4.5 w-4.5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Avg Exit Days</p>
              <p className="text-xl font-semibold text-foreground mt-0.5">{kpis?.avgExitDays ?? 90} Days</p>
              <p className="text-[10px] text-rose-600 font-semibold mt-1">Standard Notice</p>
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
                <LogOut className="h-4 w-4 text-primary" /> Corporate Exit Management & Offboarding Register
              </CardTitle>
              <CardDescription className="text-xs">
                Manage employee resignations, notice period timelines, department clearances, exit interviews & Full & Final (F&F) settlements
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Status Filter Pills */}
              <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
                {[
                  { id: 'all', label: 'All Exits' },
                  { id: 'notice_period', label: 'Notice Period' },
                  { id: 'clearance_pending', label: 'Clearance' },
                  { id: 'fnf_pending', label: 'F&F Pending' },
                  { id: 'offboarding_completed', label: 'Completed' },
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

              {/* Search Bar */}
              <div className="relative w-40 sm:w-52">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search exit ID, employee..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-background"
                />
              </div>

              {/* Process Resignation Button */}
              <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openAddModal}>
                <Plus className="h-3.5 w-3.5" /> Process Resignation
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isExitsLoading ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              Loading exit offboarding records from database...
            </div>
          ) : exits.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <LogOut className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-semibold text-foreground">No Exit Records Found</p>
              <p className="text-xs text-muted-foreground">There are no active employee resignations matching your search filter.</p>
              <Button size="sm" variant="outline" className="text-xs mt-2" onClick={openAddModal}>
                Initiate First Resignation
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-xs">Exit ID</TableHead>
                  <TableHead className="text-xs">Employee Name</TableHead>
                  <TableHead className="text-xs">Department & Designation</TableHead>
                  <TableHead className="text-xs">Resignation Date</TableHead>
                  <TableHead className="text-xs">Last Working Day (LWD)</TableHead>
                  <TableHead className="text-xs">Clearance Status</TableHead>
                  <TableHead className="text-xs">F&F Status</TableHead>
                  <TableHead className="text-xs">Overall Lifecycle Status</TableHead>
                  <TableHead className="text-right text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exits.map((e) => {
                  const empName = e.employee
                    ? `${e.employee.firstName} ${e.employee.lastName}`
                    : 'Unknown Employee';
                  const deptName = e.employee?.department?.name || 'General';
                  const desgTitle = e.employee?.designation?.title || 'Employee';
                  const isEmpActive = e.employee?.status === 'ACTIVE';

                  const resDate = new Date(e.resignationDate).toLocaleDateString(undefined, {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });
                  const lwdDate = new Date(e.adjustedLwd || e.lastWorkingDay).toLocaleDateString(undefined, {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <TableRow key={e.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono text-xs font-semibold text-primary">{e.exitCode}</TableCell>
                      <TableCell className="font-semibold text-xs text-foreground">
                        <div>
                          <span>{empName}</span>
                          <span className="block text-[10.5px] text-muted-foreground font-mono font-normal">
                            {e.employee?.employeeCode || e.employeeId}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div>
                          <span className="font-medium text-foreground">{deptName}</span>
                          <span className="block text-[10.5px] text-muted-foreground">{desgTitle}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{resDate}</TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-foreground">
                        <div>
                          <span>{lwdDate}</span>
                          {e.adjustedLwd && (
                            <Badge variant="outline" className="ml-1 text-[9.5px] font-mono text-amber-600 border-amber-500/30">
                              Adjusted
                            </Badge>
                          )}
                          <span className="block text-[10px] text-emerald-600 font-semibold font-sans">
                            {isEmpActive ? '● SERVING NOTICE (ACTIVE)' : '○ EXITED'}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs">
                        <StatusBadge
                          status={e.clearanceStatus === 'COMPLETED' ? 'ACTIVE' : 'PENDING'}
                          label={e.clearanceStatus}
                          className="text-[10px]"
                        />
                      </TableCell>

                      <TableCell className="text-xs">
                        <StatusBadge
                          status={e.fnfStatus === 'COMPLETED' ? 'ACTIVE' : 'PENDING'}
                          label={e.fnfStatus}
                          className="text-[10px]"
                        />
                      </TableCell>

                      <TableCell className="text-xs">
                        <Badge
                          variant={e.status === 'OFFBOARDING_COMPLETED' || e.status === 'EXITED' ? 'default' : 'outline'}
                          className="font-mono text-[10.5px] font-semibold"
                        >
                          {e.status}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] gap-1 text-primary hover:bg-primary/10 border-primary/30"
                          onClick={() => openDetailModal(e)}
                        >
                          <ChevronRight className="h-3.5 w-3.5" /> Manage Lifecycle
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── 3. Resignation Initiation Modal ── */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="h-4 w-4 text-primary" /> Process Employee Resignation
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleCreateExit}>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Select Employee *</Label>
              <Select value={formEmpId} onValueChange={setFormEmpId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Choose employee submitting resignation..." />
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
              <div className="p-3 bg-muted/40 rounded-xl border border-border/80 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Department:</span>
                  <span className="font-semibold text-foreground">{selectedEmpForAdd.department?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Designation:</span>
                  <span className="font-semibold text-foreground">{selectedEmpForAdd.designation?.title || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reporting Manager:</span>
                  <span className="font-semibold text-foreground">
                    {selectedEmpForAdd.reportingManager
                      ? `${selectedEmpForAdd.reportingManager.firstName} ${selectedEmpForAdd.reportingManager.lastName}`
                      : 'Unassigned'}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t">
                  <span className="text-muted-foreground">Master Employee Status:</span>
                  <span className="font-semibold text-emerald-600">● ACTIVE (Will remain Active during notice)</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Resignation Date *</Label>
                <Input
                  type="date"
                  value={formResignDate}
                  onChange={(e) => setFormResignDate(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Notice Period (Days)</Label>
                <Input
                  type="number"
                  value={formNoticeDays}
                  onChange={(e) => setFormNoticeDays(Number(e.target.value))}
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Last Working Day (LWD) *</Label>
              <Input
                type="date"
                value={formLwd || calculatedLwd}
                onChange={(e) => setFormLwd(e.target.value)}
                className="h-9 text-xs font-mono font-semibold text-primary"
              />
              <p className="text-[10px] text-muted-foreground">
                Auto-calculated based on {formNoticeDays} days notice period. Adjustable by HR.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Exit Type</Label>
                <Select value={formExitType} onValueChange={setFormExitType}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RESIGNATION" className="text-xs">Voluntary Resignation</SelectItem>
                    <SelectItem value="RETIREMENT" className="text-xs">Superannuation / Retirement</SelectItem>
                    <SelectItem value="TERMINATION" className="text-xs">Involuntary Termination</SelectItem>
                    <SelectItem value="MUTUAL_SEPARATION" className="text-xs">Mutual Separation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Exit Reason *</Label>
                <Select value={formReason} onValueChange={setFormReason}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Better Career Opportunity" className="text-xs">Better Career Opportunity</SelectItem>
                    <SelectItem value="Higher Education" className="text-xs">Higher Education</SelectItem>
                    <SelectItem value="Personal Reasons / Relocation" className="text-xs">Personal Reasons / Relocation</SelectItem>
                    <SelectItem value="Health / Medical Reasons" className="text-xs">Health / Medical Reasons</SelectItem>
                    <SelectItem value="Compensation & Benefits" className="text-xs">Compensation & Benefits</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Remarks / Comments</Label>
              <Input
                placeholder="Internal HR & Manager notes regarding resignation initiation..."
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
                {createExitMutation.isPending ? 'Initiating...' : 'Initiate Offboarding Checklist'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── 4. Comprehensive Offboarding Lifecycle Manager Drawer / Modal ── */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          {activeExitDetail && (
            <div className="space-y-5 text-xs">
              {(() => {
                const isClearanceDone = activeExitDetail.clearanceStatus === 'COMPLETED';
                const isInterviewDone = activeExitDetail.exitInterviewStatus === 'COMPLETED';
                const isFnfDone = activeExitDetail.fnfStatus === 'COMPLETED';
                const isEligibleForFinalSignoff = isClearanceDone && isInterviewDone && isFnfDone;
                const isAlreadyExited = activeExitDetail.status === 'EXITED' || activeExitDetail.status === 'OFFBOARDING_COMPLETED';

                return (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-muted/40 rounded-xl border border-border/80 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs font-semibold">{activeExitDetail.exitCode}</Badge>
                        <h2 className="text-base font-semibold text-foreground">
                          {activeExitDetail.employee?.firstName} {activeExitDetail.employee?.lastName}
                        </h2>
                        <Badge className="font-mono text-[10.5px]">{activeExitDetail.status}</Badge>
                      </div>
                      <p className="text-muted-foreground text-[11px] flex items-center gap-3">
                        <span>Dept: <strong className="text-foreground">{activeExitDetail.employee?.department?.name || 'General'}</strong></span>
                        <span>•</span>
                        <span>Title: <strong className="text-foreground">{activeExitDetail.employee?.designation?.title || 'Staff'}</strong></span>
                        <span>•</span>
                        <span>Code: <strong className="text-foreground font-mono">{activeExitDetail.employee?.employeeCode}</strong></span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        className={`h-8 text-xs gap-1 ${
                          isAlreadyExited
                            ? 'bg-muted text-muted-foreground'
                            : isEligibleForFinalSignoff
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-muted/60 text-muted-foreground border-border cursor-not-allowed opacity-60'
                        }`}
                        onClick={() => {
                          if (!isEligibleForFinalSignoff) {
                            toast.error('Cannot grant Final Exit Approval: Department Clearances, Exit Interview, and F&F Settlement must all be COMPLETED first.');
                            setDetailTab('final');
                            return;
                          }
                          completeExitMutation.mutate(activeExitDetail.id);
                        }}
                        disabled={completeExitMutation.isPending || isAlreadyExited || !isEligibleForFinalSignoff}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {isAlreadyExited ? 'Employee Exited' : 'Final Exit Approval'}
                      </Button>
                    </div>
                  </div>
                );
              })()}

              {/* 12-Stage Visual Lifecycle Stepper Bar */}
              <div className="p-3 bg-card rounded-xl border border-border/80 space-y-2">
                <span className="font-semibold text-foreground text-[11px] uppercase tracking-wider block">
                  Offboarding Workflow Stage Progress
                </span>
                <div className="flex items-center overflow-x-auto pb-1 gap-1">
                  {LIFECYCLE_STAGES.map((stg) => {
                    const isActive = activeExitDetail.status === stg.id;
                    return (
                      <button
                        key={stg.id}
                        onClick={() => {
                          setDetailTab(getTabForStage(stg.id));
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

              {/* Tab Navigation - Single Horizontal Row (Equal Width 5 Items) */}
              <div className="w-full overflow-x-auto border-b border-border">
                <div className="grid grid-cols-5 min-w-[650px] w-full gap-1">
                  {[
                    { id: 'clearance', label: '1. Department Clearance', icon: CheckSquare },
                    { id: 'interview', label: '2. Exit Interview', icon: MessageSquare },
                    { id: 'fnf', label: '3. Full & Final Settlement (F&F)', icon: DollarSign },
                    { id: 'lwd', label: '4. LWD & Audit', icon: History },
                    { id: 'final', label: '5. Final Exit Signoff', icon: ShieldCheck },
                  ].map((t) => {
                    const Icon = t.icon;
                    const isActive = detailTab === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setDetailTab(t.id as any)}
                        className={`flex items-center justify-center gap-1.5 px-2 py-2 text-[11.5px] font-semibold border-b-2 transition-all truncate text-center ${
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

              {/* ── TAB 1: Department Clearance Matrix ── */}
              {detailTab === 'clearance' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground text-xs">Multi-Department Offboarding Clearances</h3>
                      <p className="text-[11px] text-muted-foreground">
                        Clearance items auto-generated for Reporting Manager, IT, Admin, Finance, HR & Assets
                      </p>
                    </div>
                    <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
                      {['all', 'Reporting Manager', 'IT', 'Admin', 'Finance', 'HR', 'Assets'].map((dept) => (
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
                            {['PENDING', 'SUBMITTED', 'CLEARED'].map((st) => (
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

              {/* ── TAB 2: Exit Interview Questionnaire ── */}
              {detailTab === 'interview' && (
                <div className="space-y-4 p-4 border rounded-xl bg-card">
                  <div>
                    <h3 className="font-semibold text-foreground text-xs">Exit Interview Feedback & Assessment</h3>
                    <p className="text-[11px] text-muted-foreground">Record primary resignation reasons and employee feedback</p>
                  </div>

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
                      <span className="text-xs font-medium text-emerald-600 font-semibold">Eligible for Rehire in future</span>
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

              {/* ── TAB 3: Full & Final Settlement (F&F) ── */}
              {detailTab === 'fnf' && (
                <div className="space-y-4 p-4 border rounded-xl bg-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground text-xs">Full & Final (F&F) Financial Settlement</h3>
                      <p className="text-[11px] text-muted-foreground">Calculates Gross Earnings vs Deductions = Net Payable</p>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs font-semibold">
                      F&F Status: {fnfStatus}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Gross Payable */}
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
                          <span>Notice Shortfall Recovery</span>
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
                          <span>Unreturned Asset Recovery</span>
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
                  <div className="flex items-center justify-between p-4 bg-muted rounded-xl border">
                    <div>
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase">NET F&F SETTLEMENT AMOUNT</span>
                      <p className="text-2xl font-semibold text-primary font-mono mt-0.5">
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
                            noticeRecovery: fnfNoticeRecovery,
                            loanAdvanceRecovery: fnfLoanRecovery,
                            assetRecovery: fnfAssetRecovery,
                            otherDeductions: fnfOtherDeductions,
                            status: 'REVIEWED',
                          })
                        }
                      >
                        Save Draft F&F
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
                            noticeRecovery: fnfNoticeRecovery,
                            loanAdvanceRecovery: fnfLoanRecovery,
                            assetRecovery: fnfAssetRecovery,
                            otherDeductions: fnfOtherDeductions,
                            status: 'APPROVED',
                            approvedBy: 'Finance Head',
                          })
                        }
                      >
                        Approve F&F Settlement
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 4: LWD Adjustment & Audit Log ── */}
              {detailTab === 'lwd' && (
                <div className="space-y-4">
                  {/* LWD Adjust Tool */}
                  <div className="p-3 bg-muted/40 rounded-xl border border-border/80 space-y-3">
                    <h3 className="font-semibold text-foreground text-xs">Adjust Last Working Day (LWD)</h3>
                    <div className="flex items-center gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px]">Adjusted Date</Label>
                        <Input
                          type="date"
                          value={adjustLwdDate || activeExitDetail.lastWorkingDay.split('T')[0]}
                          onChange={(e) => setAdjustLwdDate(e.target.value)}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1 flex-1">
                        <Label className="text-[11px]">Reason for LWD Adjustment</Label>
                        <Input
                          placeholder="e.g. Notice period buyout approved by management..."
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

                  {/* Audit Trail Log */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground text-xs">Chronological Audit Log</h3>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {(activeExitDetail.auditLogs || []).map((log) => (
                        <div key={log.id} className="flex items-start justify-between p-2.5 rounded-lg border bg-card text-[11px]">
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

              {/* ── TAB 5: Final Exit Signoff ── */}
              {detailTab === 'final' && (
                (() => {
                  const isClearanceDone = activeExitDetail.clearanceStatus === 'COMPLETED';
                  const isInterviewDone = activeExitDetail.exitInterviewStatus === 'COMPLETED';
                  const isFnfDone = activeExitDetail.fnfStatus === 'COMPLETED';
                  const isEligibleForFinalSignoff = isClearanceDone && isInterviewDone && isFnfDone;
                  const isAlreadyExited = activeExitDetail.status === 'EXITED' || activeExitDetail.status === 'OFFBOARDING_COMPLETED';

                  return (
                    <div className="space-y-4 p-4 border rounded-xl bg-card">
                      <div>
                        <h3 className="font-semibold text-foreground text-xs">Final Offboarding Approval Checklist & Signoff</h3>
                        <p className="text-[11px] text-muted-foreground">All 3 prerequisite stages must be completed before granting final exit signoff.</p>
                      </div>

                      <div className="space-y-2">
                        <div className={`flex items-center justify-between p-3 rounded-lg border ${isClearanceDone ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                          <div className="flex items-center gap-2">
                            {isClearanceDone ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-rose-600" />}
                            <span className="font-semibold text-xs">1. Department Clearances (6 Departments)</span>
                          </div>
                          <Badge variant={isClearanceDone ? 'default' : 'destructive'} className="text-[10px]">
                            {isClearanceDone ? '100% CLEARED' : 'CLEARANCE PENDING'}
                          </Badge>
                        </div>

                        <div className={`flex items-center justify-between p-3 rounded-lg border ${isInterviewDone ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                          <div className="flex items-center gap-2">
                            {isInterviewDone ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-rose-600" />}
                            <span className="font-semibold text-xs">2. Exit Interview Questionnaire</span>
                          </div>
                          <Badge variant={isInterviewDone ? 'default' : 'destructive'} className="text-[10px]">
                            {isInterviewDone ? 'COMPLETED' : 'INTERVIEW PENDING'}
                          </Badge>
                        </div>

                        <div className={`flex items-center justify-between p-3 rounded-lg border ${isFnfDone ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                          <div className="flex items-center gap-2">
                            {isFnfDone ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-rose-600" />}
                            <span className="font-semibold text-xs">3. Full & Final Settlement (F&F)</span>
                          </div>
                          <Badge variant={isFnfDone ? 'default' : 'destructive'} className="text-[10px]">
                            {isFnfDone ? 'FINANCE APPROVED' : 'SETTLEMENT PENDING'}
                          </Badge>
                        </div>
                      </div>

                      {!isEligibleForFinalSignoff ? (
                        <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30 text-[11px] text-amber-800 space-y-1">
                          <p className="font-semibold flex items-center gap-1.5 text-amber-900">
                            <AlertCircle className="h-3.5 w-3.5 text-amber-600" /> Final Exit Approval Locked:
                          </p>
                          <p>
                            Final Signoff cannot be executed while prerequisites are pending. Please complete Department Clearances, submit the Exit Interview, and obtain Finance Approval on the F&F Settlement first.
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30 text-[11px] text-emerald-800 space-y-1">
                          <p className="font-semibold flex items-center gap-1.5 text-emerald-900">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> All Prerequisites Completed:
                          </p>
                          <p>
                            Executing Final Exit Approval will transition employee status to <strong>EXITED</strong> in Employee Master and record LWD {new Date(activeExitDetail.adjustedLwd || activeExitDetail.lastWorkingDay).toLocaleDateString()}.
                          </p>
                        </div>
                      )}

                      <Button
                        size="sm"
                        className="w-full h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => completeExitMutation.mutate(activeExitDetail.id)}
                        disabled={completeExitMutation.isPending || isAlreadyExited || !isEligibleForFinalSignoff}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {isAlreadyExited
                          ? 'Employee Status: EXITED (Offboarding Completed)'
                          : !isEligibleForFinalSignoff
                          ? 'Final Exit Approval Disabled (Prerequisites Pending)'
                          : 'Execute Final Exit Approval & Deactivate Employee'}
                      </Button>
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
    </div>
  );
}
