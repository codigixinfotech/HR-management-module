import { useState, useMemo, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  Users,
  Search,
  CheckCircle2,
  TrendingUp,
  Briefcase,
  Layers,
  Sparkles,
  Calculator,
  ArrowRight,
  Send,
  Building2,
  UserCheck,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

import { manpowerPlansApi, manpowerRequisitionsApi } from '@/api/recruitment';
import { departmentsApi, designationsApi, branchesApi } from '@/api/organization';
import { costCentersApi, type CostCenter } from '@/api/cost-grades';
import { employeesApi } from '@/api/employees';
import type { ManpowerPlan, Department, Designation, Branch, ManpowerRequisition } from '@/api/types';

const HIRING_QUARTERS = [
  'Q1 2026',
  'Q2 2026',
  'Q3 2026',
  'Q4 2026',
  'Q1 2027',
  'Q2 2027',
  'Q3 2027',
  'Q4 2027',
];

export function ManpowerPlanningTab() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTableDept, setSelectedTableDept] = useState<string>('all');

  // Modal State - Forecast Plan
  const [isOpen, setIsOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ManpowerPlan | null>(null);

  // Selected Forecast Form Fields
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedCostCenterCode, setSelectedCostCenterCode] = useState<string>('');
  const [selectedDesignationId, setSelectedDesignationId] = useState<string>('');
  const [formBudgeted, setFormBudgeted] = useState<number>(5);
  const [formActive, setFormActive] = useState<number>(0);
  const [formQuarter, setFormQuarter] = useState<string>('Q3 2026');
  const [formReason, setFormReason] = useState<string>('');

  // Raise MR Modal State
  const [isMrOpen, setIsMrOpen] = useState(false);
  const [raisingPlan, setRaisingPlan] = useState<ManpowerPlan | null>(null);
  const [mrNumber, setMrNumber] = useState('MR-2026-001');
  const [mrJoiningDate, setMrJoiningDate] = useState('');
  const [mrEmploymentType, setMrEmploymentType] = useState<'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN'>('FULL_TIME');
  const [mrPriority, setMrPriority] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [mrMinSalary, setMrMinSalary] = useState<number>(800000);
  const [mrMaxSalary, setMrMaxSalary] = useState<number>(1200000);
  const [mrQualification, setMrQualification] = useState('B.Tech / M.Tech / MBA / Graduate');
  const [mrExperience, setMrExperience] = useState('3 - 5 Years');
  const [mrRequiredSkills, setMrRequiredSkills] = useState('Technical leadership, domain expertise, team coordination');
  const [mrWorkLocation, setMrWorkLocation] = useState('');
  const [mrReportingManagerId, setMrReportingManagerId] = useState('');
  const [mrReason, setMrReason] = useState('');
  const [mrComments, setMrComments] = useState('');
  const [mrRequestorName, setMrRequestorName] = useState('HR Admin');

  // 1. Fetch Real Master Data from APIs
  const { data: plans = [], isLoading: isPlansLoading } = useQuery({
    queryKey: ['manpower-plans'],
    queryFn: () => manpowerPlansApi.list(),
  });

  const { data: rawDepartments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.list(),
  });

  const { data: costCenters = [] } = useQuery({
    queryKey: ['cost-centers'],
    queryFn: () => costCentersApi.list(),
  });

  const { data: rawDesignations = [] } = useQuery({
    queryKey: ['designations'],
    queryFn: () => designationsApi.list(),
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchesApi.list(),
  });

  const { data: employeesData } = useQuery({
    queryKey: ['employees', 1, 'all-active'],
    queryFn: () => employeesApi.list({ page: 1, pageSize: 1000 }),
  });

  const activeEmployees = useMemo(() => {
    if (!employeesData?.items) return [];
    return employeesData.items.filter((emp: any) => emp.status === 'ACTIVE');
  }, [employeesData]);

  // Clean & Deduplicate Master Departments List
  const departments = useMemo(() => {
    if (!rawDepartments) return [];
    const map = new Map<string, Department>();
    rawDepartments.forEach((d) => {
      const cleanName = d.name ? d.name.trim() : '';
      const key = cleanName.toLowerCase();
      if (cleanName && !map.has(key)) {
        map.set(key, { ...d, name: cleanName });
      }
    });
    return Array.from(map.values());
  }, [rawDepartments]);

  // Clean & Deduplicate Master Cost Centers List
  const uniqueCostCenters = useMemo(() => {
    if (!costCenters) return [];
    const map = new Map<string, CostCenter>();
    costCenters.forEach((cc) => {
      const codeKey = cc.code ? cc.code.trim().toUpperCase() : '';
      if (codeKey && !map.has(codeKey)) {
        map.set(codeKey, cc);
      }
    });
    return Array.from(map.values());
  }, [costCenters]);

  // Clean & Deduplicate Master Designations List
  const designations = useMemo(() => {
    if (!rawDesignations) return [];
    const map = new Map<string, Designation>();
    rawDesignations.forEach((des) => {
      const cleanTitle = des.title ? des.title.trim() : '';
      const key = cleanTitle.toLowerCase();
      if (cleanTitle && !map.has(key)) {
        map.set(key, { ...des, title: cleanTitle });
      }
    });
    return Array.from(map.values());
  }, [rawDesignations]);

  // Active selected department object
  const currentDept = useMemo(() => {
    return departments.find((d) => d.id === selectedDeptId);
  }, [departments, selectedDeptId]);

  // Active selected designation object
  const currentDesignation = useMemo(() => {
    return designations.find((d) => d.id === selectedDesignationId);
  }, [designations, selectedDesignationId]);

  // Handle Cascading Department Change
  const handleDepartmentChange = (newDeptId: string) => {
    setSelectedDeptId(newDeptId);

    const newDeptObj = departments.find((d) => d.id === newDeptId);
    if (!newDeptObj) return;

    // Find cost center matching new department name or ID
    const matchedCC = uniqueCostCenters.find((cc) => {
      if (cc.departmentId === newDeptId) return true;
      if (cc.department?.name && cc.department.name.toLowerCase() === newDeptObj.name.toLowerCase()) return true;
      if (cc.name && cc.name.toLowerCase() === newDeptObj.name.toLowerCase()) return true;
      return false;
    });

    if (matchedCC) {
      setSelectedCostCenterCode(matchedCC.code);
    }

    // Find designation matching new department
    const matchingDeptIds = rawDepartments
      .filter((d) => d.name && d.name.trim().toLowerCase() === newDeptObj.name.toLowerCase())
      .map((d) => d.id);

    const matchedDesig = rawDesignations.find((des) => {
      if (des.departmentId && matchingDeptIds.includes(des.departmentId)) return true;
      return false;
    });

    if (matchedDesig) {
      const uniqueDesig = designations.find((d) => d.title.toLowerCase() === matchedDesig.title.toLowerCase());
      if (uniqueDesig) {
        setSelectedDesignationId(uniqueDesig.id);
      }
    }
  };

  // Dynamic Active Staff Count from Employee Management
  useEffect(() => {
    if (!activeEmployees || !selectedDeptId) {
      setFormActive(0);
      return;
    }

    const targetDeptName = currentDept?.name?.toLowerCase().trim() || '';
    const targetRoleTitle = currentDesignation?.title?.toLowerCase().trim() || '';

    const count = activeEmployees.filter((emp: any) => {
      const empDeptId = emp.departmentId;
      const empDeptName = (emp.department?.name || '').toLowerCase().trim();
      const matchesDept = empDeptId === selectedDeptId || (targetDeptName && empDeptName.includes(targetDeptName));

      if (!matchesDept) return false;
      if (!selectedDesignationId && !targetRoleTitle) return true;

      const empDesigId = emp.designationId;
      const empDesigTitle = (emp.designation?.title || '').toLowerCase().trim();
      const prevTitle = (emp.prevJobTitle || '').toLowerCase().trim();

      const matchesRole =
        empDesigId === selectedDesignationId ||
        (targetRoleTitle && (empDesigTitle.includes(targetRoleTitle) || targetRoleTitle.includes(empDesigTitle) || prevTitle.includes(targetRoleTitle)));

      return matchesRole;
    }).length;

    setFormActive(count);
  }, [activeEmployees, selectedDeptId, selectedDesignationId, currentDept, currentDesignation]);

  // Planned Hires calculation
  const plannedHiresCount = useMemo(() => {
    return Math.max(0, formBudgeted - formActive);
  }, [formBudgeted, formActive]);

  // Open Modal for Add Forecast Plan
  const openAddModal = () => {
    setEditingPlan(null);
    const initialDept = departments[0];
    const initialDeptId = initialDept?.id || '';

    setSelectedDeptId(initialDeptId);

    const initialCCList = uniqueCostCenters.filter((cc) => cc.departmentId === initialDeptId || (initialDept && cc.department?.name?.toLowerCase() === initialDept.name.toLowerCase()));
    const initialCC = initialCCList.length > 0 ? initialCCList[0] : uniqueCostCenters[0];
    setSelectedCostCenterCode(initialCC?.code || '');

    const initialDesigList = designations.filter((d) => d.departmentId === initialDeptId || !d.departmentId);
    const initialDesig = initialDesigList.length > 0 ? initialDesigList[0] : designations[0];
    setSelectedDesignationId(initialDesig?.id || '');

    setFormBudgeted(5);
    setFormQuarter('Q3 2026');
    setFormReason('');
    setIsOpen(true);
  };

  // Open Modal for Edit Forecast Plan
  const openEditModal = (plan: ManpowerPlan) => {
    setEditingPlan(plan);

    const matchedDept = departments.find((d) => d.id === plan.departmentId || d.name.toLowerCase() === plan.departmentName.toLowerCase());
    setSelectedDeptId(matchedDept?.id || departments[0]?.id || '');

    setSelectedCostCenterCode(plan.costCenter);

    const matchedDesig = designations.find((d) => d.id === plan.designationId || d.title.toLowerCase() === plan.role.toLowerCase());
    setSelectedDesignationId(matchedDesig?.id || designations[0]?.id || '');

    setFormBudgeted(plan.budgeted);
    setFormQuarter(plan.quarter);
    setFormReason(plan.reason || '');
    setIsOpen(true);
  };

  // Open Raise MR Modal (Populate all MR defaults)
  const openRaiseMrModal = async (plan: ManpowerPlan) => {
    setRaisingPlan(plan);
    try {
      const nextNum = await manpowerRequisitionsApi.getNextNumber();
      setMrNumber(nextNum || 'MR-2026-001');
    } catch {
      setMrNumber('MR-2026-001');
    }

    const defaultLoc = branches[0]?.name ? `${branches[0].name} (${branches[0].city || 'Pune'})` : 'Head Office (Pune)';
    const defaultMgr = activeEmployees[0]?.id || '';

    // Date default: 30 days from today
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    setMrJoiningDate(futureDate.toISOString().split('T')[0]);

    setMrEmploymentType('FULL_TIME');
    setMrPriority('NORMAL');
    setMrMinSalary(800000);
    setMrMaxSalary(1200000);
    setMrQualification('B.Tech / M.Tech / MBA / Graduate');
    setMrExperience('3 - 5 Years');
    setMrRequiredSkills('Technical leadership, domain expertise, team coordination');
    setMrWorkLocation(defaultLoc);
    setMrReportingManagerId(defaultMgr);
    setMrReason(plan.reason || `Approved manpower forecast hiring for ${plan.role} in ${plan.departmentName}.`);
    setMrComments('');
    setMrRequestorName('HR Admin');
    setIsMrOpen(true);
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: Partial<ManpowerPlan>) => manpowerPlansApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manpower-plans'] });
      toast.success('Forecast Plan added successfully');
      setIsOpen(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to save forecast plan'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ManpowerPlan> }) => manpowerPlansApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manpower-plans'] });
      toast.success('Manpower Forecast updated');
      setIsOpen(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to update forecast plan'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => manpowerPlansApi.remove(id),
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData(['manpower-plans'], (old: ManpowerPlan[] | undefined) =>
        old ? old.filter((p) => p.id !== deletedId) : []
      );
      queryClient.invalidateQueries({ queryKey: ['manpower-plans'] });
      toast.success('Manpower plan removed');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to remove plan'),
  });

  // Submit MR Mutation
  const submitMrMutation = useMutation({
    mutationFn: (payload: Partial<ManpowerRequisition>) => manpowerRequisitionsApi.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['manpower-plans'] });
      queryClient.invalidateQueries({ queryKey: ['manpower-requisitions'] });
      toast.success(`Manpower Requisition ${data.mrNumber} submitted successfully for approval.`);
      setIsMrOpen(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to submit Manpower Requisition'),
  });

  // Handle Form Submit (Forecast Plan)
  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDeptId || !currentDept) {
      toast.error('Please select a valid Department');
      return;
    }
    if (!selectedCostCenterCode) {
      toast.error('Please select a valid Cost Center');
      return;
    }
    if (!selectedDesignationId || !currentDesignation) {
      toast.error('Please select a valid Target Job Designation / Role');
      return;
    }
    if (formBudgeted <= 0) {
      toast.error('Budgeted Headcount must be greater than 0');
      return;
    }
    if (!formQuarter) {
      toast.error('Target Hiring Quarter is required');
      return;
    }
    if (!formReason.trim()) {
      toast.error('Hiring Reason / Justification is required');
      return;
    }

    const payload: Partial<ManpowerPlan> = {
      departmentId: currentDept.id,
      departmentName: currentDept.name,
      costCenter: selectedCostCenterCode,
      designationId: currentDesignation.id,
      role: currentDesignation.title,
      budgeted: formBudgeted,
      quarter: formQuarter,
      reason: formReason,
    };

    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // Handle Submit Manpower Requisition (MR)
  const handleSubmitMr = (e: React.FormEvent) => {
    e.preventDefault();

    if (!raisingPlan) return;

    if (!mrJoiningDate) {
      toast.error('Required Joining Date is required');
      return;
    }
    if (!mrEmploymentType) {
      toast.error('Employment Type is required');
      return;
    }
    if (!mrPriority) {
      toast.error('Priority is required');
      return;
    }
    if (!mrQualification.trim()) {
      toast.error('Qualification is required');
      return;
    }
    if (!mrExperience.trim()) {
      toast.error('Experience is required');
      return;
    }
    if (!mrWorkLocation.trim()) {
      toast.error('Work Location is required');
      return;
    }
    if (!mrReportingManagerId) {
      toast.error('Reporting Manager is required');
      return;
    }
    if (!mrReason.trim()) {
      toast.error('Hiring Reason / Justification is required');
      return;
    }

    const payload: Partial<ManpowerRequisition> = {
      mrNumber,
      manpowerPlanId: raisingPlan.id,
      departmentId: raisingPlan.departmentId || null,
      departmentName: raisingPlan.departmentName,
      costCenter: raisingPlan.costCenter,
      designationId: raisingPlan.designationId || null,
      role: raisingPlan.role,
      numOpenings: Math.max(1, Math.max(0, raisingPlan.budgeted - raisingPlan.active) || raisingPlan.plannedHires),
      joiningDate: mrJoiningDate,
      employmentType: mrEmploymentType,
      priority: mrPriority,
      minSalary: Number(mrMinSalary) || undefined,
      maxSalary: Number(mrMaxSalary) || undefined,
      qualification: mrQualification,
      experience: mrExperience,
      requiredSkills: mrRequiredSkills,
      workLocation: mrWorkLocation,
      reportingManagerId: mrReportingManagerId,
      requestorName: mrRequestorName,
      reason: mrReason,
      comments: mrComments,
      status: 'PENDING_APPROVAL',
    };

    submitMrMutation.mutate(payload);
  };

  const handleDeletePlan = (id: string, role: string) => {
    if (confirm(`Are you sure you want to remove the manpower forecast plan for "${role}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  // Filtered Table Plans
  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      const matchesSearch =
        p.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.costCenter.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept =
        selectedTableDept === 'all' ? true : p.departmentName.toLowerCase() === selectedTableDept.toLowerCase();
      return matchesSearch && matchesDept;
    });
  }, [plans, searchQuery, selectedTableDept]);

  // Aggregate KPI Stats
  const totalBudgeted = plans.reduce((acc, curr) => acc + curr.budgeted, 0);
  const totalActive = plans.reduce((acc, curr) => acc + curr.active, 0);
  const totalPlanned = plans.reduce((acc, curr) => acc + curr.plannedHires, 0);
  const remainingBudgetCap = Math.max(0, totalBudgeted - totalActive);

  return (
    <div className="space-y-6">
      {/* ── 1. Top Manpower Planning KPI Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Budgeted Roles</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">{totalBudgeted} Positions</p>
              <p className="text-[10px] text-primary font-semibold mt-1">FY 2026-27 Approved</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Active Filled Roles</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">{totalActive} Staff</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">
                {totalBudgeted > 0 ? `${Math.round((totalActive / totalBudgeted) * 100)}%` : '0%'} Occupancy Rate
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Planned Hires</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">+{totalPlanned} Openings</p>
              <p className="text-[10px] text-amber-600 font-semibold mt-1">Recruitment Forecast</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Remaining Budget Cap</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">{remainingBudgetCap} Positions</p>
              <p className="text-[10px] text-violet-600 font-semibold mt-1">Available Headcount</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 shrink-0">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Manpower Planning Master Table ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" /> Departmental Manpower Planning & Forecast
              </CardTitle>
              <CardDescription className="text-xs">
                Headcount forecasting, position budgets, cost center mapping and requisition controls
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Department Filter Pills */}
              <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
                <button
                  onClick={() => setSelectedTableDept('all')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                    selectedTableDept === 'all'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All
                </button>
                {departments.slice(0, 4).map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedTableDept(d.name)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                      selectedTableDept.toLowerCase() === d.name.toLowerCase()
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {d.name.length > 15 ? `${d.name.substring(0, 12)}...` : d.name}
                  </button>
                ))}
              </div>

              {/* Search Input */}
              <div className="relative w-40 sm:w-52">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filter forecasted roles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-background"
                />
              </div>

              {/* Add Forecast Plan Dialog */}
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openAddModal}>
                    <Plus className="h-3.5 w-3.5" /> Add Forecast Plan
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base">
                      <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                      {editingPlan ? 'Edit Headcount Forecast Plan' : 'Add Headcount Forecast Plan'}
                    </DialogTitle>
                  </DialogHeader>

                  <form className="space-y-4 text-xs pt-1" onSubmit={handleSavePlan}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Department Dropdown */}
                      <div className="space-y-1.5">
                        <Label className="font-semibold">Department *</Label>
                        <Select value={selectedDeptId} onValueChange={handleDepartmentChange}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select Department" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((d) => (
                              <SelectItem key={d.id} value={d.id} className="text-xs">
                                {d.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Cost Center Dropdown */}
                      <div className="space-y-1.5">
                        <Label className="font-semibold">Cost Center *</Label>
                        <Select value={selectedCostCenterCode} onValueChange={setSelectedCostCenterCode}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select Cost Center" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60 overflow-y-auto">
                            {uniqueCostCenters.map((cc: CostCenter) => (
                              <SelectItem key={cc.id} value={cc.code} className="text-xs">
                                {cc.code} - {cc.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Target Job Role / Designation Dropdown */}
                    <div className="space-y-1.5">
                      <Label className="font-semibold">Target Job Designation / Role *</Label>
                      <Select value={selectedDesignationId} onValueChange={setSelectedDesignationId}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select Designation / Role" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto">
                          {designations.map((des: Designation) => (
                            <SelectItem key={des.id} value={des.id} className="text-xs">
                              {des.title} {des.code ? `(${des.code})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Budgeted & Active & Planned Hires Calculation */}
                    <div className="grid grid-cols-3 gap-3 bg-muted/30 p-3 rounded-xl border border-border">
                      <div className="space-y-1">
                        <Label className="font-semibold text-[11px]">Budgeted Headcount *</Label>
                        <Input
                          type="number"
                          min={1}
                          value={formBudgeted}
                          onChange={(e) => setFormBudgeted(Math.max(1, parseInt(e.target.value) || 1))}
                          className="h-9 text-xs font-mono bg-background"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="font-semibold text-[11px] text-muted-foreground flex items-center gap-1">
                          Current Active Staff
                          <span className="text-[9px] text-primary">(Auto)</span>
                        </Label>
                        <Input
                          type="number"
                          value={formActive}
                          readOnly
                          disabled
                          className="h-9 text-xs font-mono bg-muted text-muted-foreground font-bold cursor-not-allowed"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="font-semibold text-[11px] text-primary flex items-center gap-1">
                          Planned Hires
                          <span className="text-[9px] text-primary font-bold">(Auto)</span>
                        </Label>
                        <Input
                          type="number"
                          value={plannedHiresCount}
                          readOnly
                          disabled
                          className="h-9 text-xs font-mono bg-primary/10 text-primary font-bold cursor-not-allowed border-primary/30"
                        />
                      </div>
                    </div>

                    {/* Formula helper indicator */}
                    <div className="flex items-center gap-2 text-xs bg-primary/5 p-2 rounded-lg border border-primary/20 text-primary">
                      <Calculator className="h-4 w-4 shrink-0" />
                      <span className="font-medium">
                        Planned Hires = {formBudgeted} (Budgeted) - {formActive} (Active Staff) ={' '}
                        <strong className="font-bold underline">{plannedHiresCount} Planned Hires</strong>
                      </span>
                    </div>

                    {/* Target Hiring Quarter */}
                    <div className="space-y-1.5">
                      <Label className="font-semibold">Target Hiring Quarter *</Label>
                      <Select value={formQuarter} onValueChange={setFormQuarter}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select Quarter" />
                        </SelectTrigger>
                        <SelectContent>
                          {HIRING_QUARTERS.map((q) => (
                            <SelectItem key={q} value={q} className="text-xs">
                              {q}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Hiring Reason / Justification */}
                    <div className="space-y-1.5">
                      <Label className="font-semibold">Hiring Reason / Justification *</Label>
                      <Textarea
                        placeholder="Provide detailed justification for the manpower forecast..."
                        value={formReason}
                        onChange={(e) => setFormReason(e.target.value)}
                        className="text-xs min-h-[70px]"
                        rows={3}
                      />
                    </div>

                    <DialogFooter className="pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => setIsOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        className="text-xs font-semibold"
                        disabled={createMutation.isPending || updateMutation.isPending}
                      >
                        Save Forecast Plan
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {isPlansLoading ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Loading manpower forecast plans...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">ID</TableHead>
                  <TableHead className="text-xs">Target Position Role</TableHead>
                  <TableHead className="text-xs">Department</TableHead>
                  <TableHead className="text-xs">Cost Center</TableHead>
                  <TableHead className="text-xs">Budgeted Headcount</TableHead>
                  <TableHead className="text-xs">Active Staff</TableHead>
                  <TableHead className="text-xs">Planned Hires</TableHead>
                  <TableHead className="text-xs">Hiring Quarter</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-right text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-8 text-center text-xs text-muted-foreground">
                      No manpower forecast plans found. Click "+ Add Forecast Plan" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPlans.map((p, idx) => {
                    const codeLabel = p.code || `MP-0${idx + 1}`;
                    const isUnderStaffed = p.status === 'UNDER-STAFFED' || p.plannedHires > 0;
                    const isCapReached = p.status === 'CAP-REACHED' || p.plannedHires === 0;

                    return (
                      <TableRow key={p.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="font-mono text-xs font-semibold text-primary">{codeLabel}</TableCell>
                        <TableCell className="font-semibold text-xs text-foreground flex items-center gap-2">
                          <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          {p.role}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-semibold">{p.departmentName}</TableCell>
                        <TableCell className="text-xs font-mono font-medium">{p.costCenter}</TableCell>
                        <TableCell className="text-xs font-mono font-semibold">{p.budgeted} Staff</TableCell>
                        <TableCell className="text-xs font-mono font-semibold text-emerald-600">{p.active} Staff</TableCell>
                        <TableCell className="text-xs font-mono font-semibold text-primary">
                          +{p.plannedHires} Hires
                        </TableCell>
                        <TableCell className="text-xs font-medium text-muted-foreground">{p.quarter}</TableCell>
                        <TableCell className="text-xs">
                          <Badge
                            className={`text-[10px] font-semibold ${
                              isCapReached
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                : isUnderStaffed
                                ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                            }`}
                          >
                            {isCapReached ? 'CAP-REACHED' : isUnderStaffed ? 'UNDER-STAFFED' : 'ON-TRACK'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {p.plannedHires > 0 ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[10.5px] px-2.5 text-primary border-primary/30 hover:bg-primary/10 gap-1 font-semibold"
                                onClick={() => openRaiseMrModal(p)}
                              >
                                Raise MR <ArrowRight className="h-3 w-3" />
                              </Button>
                            ) : (
                              <Badge className="bg-muted text-muted-foreground border-border text-[9.5px]">
                                CAP REACHED
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => openEditModal(p)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => handleDeletePlan(p.id, p.role)}
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
          )}
        </CardContent>
      </Card>

      {/* ── 3. Independent Raise Manpower Requisition (MR) Dialog ── */}
      <Dialog open={isMrOpen} onOpenChange={setIsMrOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="flex items-center justify-between text-base font-semibold">
              <span className="flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" /> Create Manpower Requisition (MR)
              </span>
              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">
                Status: DRAFT / PENDING APPROVAL
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {raisingPlan && (
            <form className="space-y-5 text-xs pt-2" onSubmit={handleSubmitMr}>
              {/* Section 1: Manpower Requisition Details (Read-Only Auto-Filled Card) */}
              <div className="bg-primary/5 p-3.5 rounded-xl border border-primary/20 space-y-2.5">
                <h4 className="font-semibold text-xs text-primary flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" /> 1. Manpower Requisition Details (Auto-Filled)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-[10px] text-muted-foreground font-medium">MR Number (Auto)</Label>
                    <p className="font-mono font-bold text-xs text-primary mt-0.5">{mrNumber}</p>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground font-medium">Manpower Plan Ref</Label>
                    <p className="font-mono font-bold text-xs text-foreground mt-0.5">{raisingPlan.code || 'MP-06'}</p>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground font-medium">Department</Label>
                    <p className="font-semibold text-xs text-foreground mt-0.5">{raisingPlan.departmentName}</p>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground font-medium">Cost Center</Label>
                    <p className="font-mono font-semibold text-xs text-foreground mt-0.5">{raisingPlan.costCenter}</p>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground font-medium">Designation / Role</Label>
                    <p className="font-semibold text-xs text-foreground mt-0.5">{raisingPlan.role}</p>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground font-medium">Number of Openings (Available)</Label>
                    <div className="mt-0.5">
                      <Badge className="bg-primary/10 text-primary border-primary/30 font-mono font-bold text-xs">
                        {raisingPlan.plannedHires} Openings Auto-filled
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Hiring Requirements */}
              <div className="space-y-3">
                <h4 className="font-semibold text-xs text-foreground flex items-center gap-1.5 border-b pb-1">
                  <UserCheck className="h-3.5 w-3.5 text-primary" /> 2. Hiring Requirements
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="font-semibold">Required Joining Date *</Label>
                    <Input
                      type="date"
                      value={mrJoiningDate}
                      onChange={(e) => setMrJoiningDate(e.target.value)}
                      className="h-8 text-xs bg-background"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="font-semibold">Employment Type *</Label>
                    <Select value={mrEmploymentType} onValueChange={(val: any) => setMrEmploymentType(val)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FULL_TIME" className="text-xs">Full Time</SelectItem>
                        <SelectItem value="PART_TIME" className="text-xs">Part Time</SelectItem>
                        <SelectItem value="CONTRACT" className="text-xs">Contract</SelectItem>
                        <SelectItem value="INTERN" className="text-xs">Intern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="font-semibold">Priority *</Label>
                    <Select value={mrPriority} onValueChange={(val: any) => setMrPriority(val)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW" className="text-xs">Low</SelectItem>
                        <SelectItem value="NORMAL" className="text-xs">Normal</SelectItem>
                        <SelectItem value="HIGH" className="text-xs">High</SelectItem>
                        <SelectItem value="URGENT" className="text-xs">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="font-semibold">Salary / CTC Budget Min (₹)</Label>
                    <Input
                      type="number"
                      value={mrMinSalary}
                      onChange={(e) => setMrMinSalary(Number(e.target.value))}
                      className="h-8 text-xs font-mono bg-background"
                      placeholder="e.g. 800000"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="font-semibold">Salary / CTC Budget Max (₹)</Label>
                    <Input
                      type="number"
                      value={mrMaxSalary}
                      onChange={(e) => setMrMaxSalary(Number(e.target.value))}
                      className="h-8 text-xs font-mono bg-background"
                      placeholder="e.g. 1200000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="font-semibold">Qualification *</Label>
                    <Input
                      type="text"
                      value={mrQualification}
                      onChange={(e) => setMrQualification(e.target.value)}
                      className="h-8 text-xs bg-background"
                      placeholder="e.g. B.Tech / M.Tech / MBA"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="font-semibold">Required Experience *</Label>
                    <Input
                      type="text"
                      value={mrExperience}
                      onChange={(e) => setMrExperience(e.target.value)}
                      className="h-8 text-xs bg-background"
                      placeholder="e.g. 3 - 5 Years"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="font-semibold">Required Skills</Label>
                  <Input
                    type="text"
                    value={mrRequiredSkills}
                    onChange={(e) => setMrRequiredSkills(e.target.value)}
                    className="h-8 text-xs bg-background"
                    placeholder="e.g. React, Node.js, Cloud Architecture"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="font-semibold">Work Location *</Label>
                    <Select value={mrWorkLocation} onValueChange={setMrWorkLocation}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select work location" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.length > 0 ? (
                          branches.map((b: Branch) => (
                            <SelectItem key={b.id} value={`${b.name} (${b.city || 'Location'})`} className="text-xs">
                              {b.name} ({b.city || 'Location'})
                            </SelectItem>
                          ))
                        ) : (
                          <>
                            <SelectItem value="Head Office (Pune)" className="text-xs">Head Office (Pune)</SelectItem>
                            <SelectItem value="Tech Campus (Bengaluru)" className="text-xs">Tech Campus (Bengaluru)</SelectItem>
                            <SelectItem value="Regional Office (Mumbai)" className="text-xs">Regional Office (Mumbai)</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="font-semibold">Reporting Manager *</Label>
                    <Select value={mrReportingManagerId} onValueChange={setMrReportingManagerId}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select reporting manager" />
                      </SelectTrigger>
                      <SelectContent className="max-h-48 overflow-y-auto">
                        {activeEmployees.map((emp: any) => (
                          <SelectItem key={emp.id} value={emp.id} className="text-xs">
                            {emp.firstName} {emp.lastName} ({emp.designation?.title || emp.employeeCode})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Section 3: Justification */}
              <div className="space-y-3">
                <h4 className="font-semibold text-xs text-foreground flex items-center gap-1.5 border-b pb-1">
                  <FileText className="h-3.5 w-3.5 text-primary" /> 3. Justification & Comments
                </h4>

                <div className="space-y-1">
                  <Label className="font-semibold">Hiring Reason / Justification *</Label>
                  <Textarea
                    value={mrReason}
                    onChange={(e) => setMrReason(e.target.value)}
                    className="text-xs min-h-[60px]"
                    rows={2}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="font-semibold">Additional Comments</Label>
                  <Textarea
                    value={mrComments}
                    onChange={(e) => setMrComments(e.target.value)}
                    className="text-xs min-h-[50px]"
                    rows={2}
                    placeholder="Any special instructions or hiring budget notes..."
                  />
                </div>
              </div>

              {/* Section 4: Request Information Footer */}
              <div className="bg-muted/40 p-3 rounded-xl border border-border flex items-center justify-between">
                <div>
                  <p className="text-[10.5px] text-muted-foreground">Requestor Name: <strong className="text-foreground">{mrRequestorName}</strong></p>
                  <p className="text-[10.5px] text-muted-foreground">Request Date: <strong className="text-foreground">{new Date().toISOString().split('T')[0]}</strong></p>
                </div>
                <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">
                  Target Status: PENDING_APPROVAL
                </Badge>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setIsMrOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs font-semibold gap-1.5"
                  disabled={submitMrMutation.isPending}
                >
                  <Send className="h-3.5 w-3.5" /> Submit MR
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
