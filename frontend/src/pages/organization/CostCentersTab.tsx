import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  DollarSign,
  Users,
  Search,
  Grid,
  List,
  CheckCircle2,
  Award,
  Building2,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { companiesApi, branchesApi, departmentsApi } from '@/api/organization';
import { employeesApi } from '@/api/employees';
import { costCentersApi, payGradesApi, type CostCenter, type PayGrade } from '@/api/cost-grades';



import { useCompany } from '@/context/CompanyContext';

export function CostCentersTab({ companyId: propCompanyId }: { companyId?: string }) {
  const { activeCompanyId: ctxCompanyId } = useCompany();
  const activeCompanyId = propCompanyId || ctxCompanyId;
  const queryClient = useQueryClient();
  const [searchCcQuery, setSearchCcQuery] = useState('');
  const [searchGradeQuery, setSearchGradeQuery] = useState('');
  const [displayMode, setDisplayMode] = useState<'grid' | 'table'>('grid');

  // ── Real API queries ──
  const { data: companies } = useQuery({ queryKey: ['companies'], queryFn: companiesApi.list });
  const companyIdForLists = (activeCompanyId || companies?.[0]?.id) ?? '';

  const { data: employees } = useQuery({ queryKey: ['employees', companyIdForLists], queryFn: () => employeesApi.list({ page: 1, pageSize: 500, companyId: companyIdForLists }) });

  const { data: branches } = useQuery({
    queryKey: ['branches', companyIdForLists],
    queryFn: () => branchesApi.list(companyIdForLists),
    enabled: !!companyIdForLists,
  });
  const { data: departments } = useQuery({
    queryKey: ['departments', companyIdForLists],
    queryFn: () => departmentsApi.list(companyIdForLists),
    enabled: !!companyIdForLists,
  });

  // Real cost centers and pay grades from DB
  const { data: costCenters = [] } = useQuery({
    queryKey: ['cost-centers', companyIdForLists],
    queryFn: () => costCentersApi.list(companyIdForLists),
    enabled: !!companyIdForLists,
  });
  const { data: payGrades = [] } = useQuery({
    queryKey: ['pay-grades', companyIdForLists],
    queryFn: () => payGradesApi.list(companyIdForLists),
    enabled: !!companyIdForLists,
  });

  // ── Mutations ──
  const ccUpsertMutation = useMutation({
    mutationFn: (payload: { id?: string; data: Partial<CostCenter> }) =>
      payload.id ? costCentersApi.update(payload.id, payload.data) : costCentersApi.create(payload.data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['cost-centers'] });
      toast.success(vars.id ? 'Cost Center updated' : 'Cost Center created');
      setIsCcOpen(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to save Cost Center'),
  });

  const ccDeleteMutation = useMutation({
    mutationFn: (id: string) => costCentersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-centers'] });
      toast.success('Cost Center deleted permanently');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to delete Cost Center'),
  });

  const gradeUpsertMutation = useMutation({
    mutationFn: (payload: { id?: string; data: Partial<PayGrade> }) =>
      payload.id ? payGradesApi.update(payload.id, payload.data) : payGradesApi.create(payload.data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['pay-grades'] });
      toast.success(vars.id ? 'Pay Grade updated' : 'Pay Grade created');
      setIsGradeOpen(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to save Pay Grade'),
  });

  const gradeDeleteMutation = useMutation({
    mutationFn: (id: string) => payGradesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pay-grades'] });
      toast.success('Pay Grade deleted permanently');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to delete Pay Grade'),
  });

  // Headcount calculation dynamically mapped from real Employee Master list
  const headcountMap = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!employees?.items) return counts;
    employees.items.forEach((emp: any) => {
      if (emp.costCenter) {
        counts[emp.costCenter] = (counts[emp.costCenter] || 0) + 1;
      }
    });
    return counts;
  }, [employees]);

  // Employee count matching job grades dynamically
  const gradeCountMap = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!employees?.items) return counts;
    employees.items.forEach((emp: any) => {
      if (emp.grade) {
        counts[emp.grade] = (counts[emp.grade] || 0) + 1;
      }
    });
    return counts;
  }, [employees]);

  // Cost Center Dialog Form State
  const [isCcOpen, setIsCcOpen] = useState(false);
  const [editingCc, setEditingCc] = useState<CostCenter | null>(null);

  const [ccCompanyId, setCcCompanyId] = useState('');
  const [ccCode, setCcCode] = useState('');
  const [ccName, setCcName] = useState('');
  const [ccType, setCcType] = useState('Department');
  const [ccDeptId, setCcDeptId] = useState('');
  const [ccBranchId, setCcBranchId] = useState('');
  const [ccManagerId, setCcManagerId] = useState('');
  const [ccManagerName, setCcManagerName] = useState('');
  const [ccBudget, setCcBudget] = useState(25000000);
  const [ccCapacity, setCcCapacity] = useState(15);
  const [ccEffectiveFrom, setCcEffectiveFrom] = useState('');
  const [ccStatus, setCcStatus] = useState<'Active' | 'Inactive'>('Active');
  const [ccDescription, setCcDescription] = useState('');

  // Grade Dialog Form State
  const [isGradeOpen, setIsGradeOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<PayGrade | null>(null);

  const [gradeCompanyId, setGradeCompanyId] = useState('');
  const [gradeBusinessUnit, setGradeBusinessUnit] = useState('');
  const [gradeCode, setGradeCode] = useState('');
  const [gradeName, setGradeName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('L1');
  const [gradeCategory, setGradeCategory] = useState('Professional');
  const [gradeJobFamily, setGradeJobFamily] = useState('');
  const [gradeDepartmentId, setGradeDepartmentId] = useState('');
  const [gradeMinSalary, setGradeMinSalary] = useState(30000);
  const [gradeMaxSalary, setGradeMaxSalary] = useState(60000);
  const [gradeCurrency, setGradeCurrency] = useState('INR');
  const [gradeEffectiveFrom, setGradeEffectiveFrom] = useState('');
  const [gradeStatus, setGradeStatus] = useState<'Active' | 'Inactive'>('Active');
  const [gradeDescription, setGradeDescription] = useState('');

  // Currency Formatter
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Salary scale formatting (e.g. ₹25K–₹40K)
  const formatSalaryRange = (min: number, max: number) => {
    const formatK = (val: number) => {
      if (val >= 100000) {
        return `₹${(val / 100000).toFixed(0)}L`;
      }
      if (val >= 1000) {
        return `₹${(val / 1000).toFixed(0)}K`;
      }
      return `₹${val}`;
    };
    return `${formatK(min)}–${formatK(max)}`;
  };

  // Fetch all cost centers across companies for global code uniqueness
  const { data: allCostCentersForCodes = [] } = useQuery({
    queryKey: ['cost-centers-all-codes'],
    queryFn: () => costCentersApi.list(),
  });

  const generateUniqueCcCode = () => {
    const existingCodes = new Set(allCostCentersForCodes.map((cc) => cc.code));
    let count = allCostCentersForCodes.length + 101;
    let code = `CC-${count}`;
    while (existingCodes.has(code)) {
      count++;
      code = `CC-${count}`;
    }
    return code;
  };

  const generateUniqueGradeCode = () => {
    const existingCodes = new Set(payGrades.map((g) => g.gradeCode));
    let count = payGrades.length + 1;
    let code = `GR-${String(count).padStart(2, '0')}`;
    while (existingCodes.has(code)) {
      count++;
      code = `GR-${String(count).padStart(2, '0')}`;
    }
    return code;
  };

  // Cost Center Actions
  const openAddCc = () => {
    setEditingCc(null);
    setCcCompanyId(companyIdForLists);
    setCcCode(generateUniqueCcCode());
    setCcName('');
    setCcType('Department');
    setCcDeptId(departments?.[0]?.id ?? '');
    setCcBranchId(branches?.[0]?.id ?? '');
    setCcManagerId('');
    setCcManagerName('');
    setCcBudget(25000000);
    setCcCapacity(15);
    setCcEffectiveFrom(new Date().toISOString().split('T')[0]);
    setCcStatus('Active');
    setCcDescription('');
    setIsCcOpen(true);
  };

  const openEditCc = (item: CostCenter) => {
    setEditingCc(item);
    setCcCompanyId(item.companyId);
    setCcCode(item.code);
    setCcName(item.name);
    setCcType(item.type);
    setCcDeptId(item.departmentId ?? '');
    setCcBranchId(item.branchId ?? '');
    setCcManagerId(item.managerId ?? '');
    setCcManagerName(item.managerName ?? '');
    setCcBudget(Number(item.budget));
    setCcCapacity(item.headcountCapacity);
    setCcEffectiveFrom(item.effectiveFrom?.split('T')[0] ?? '');
    setCcStatus(item.isActive ? 'Active' : 'Inactive');
    setCcDescription(item.description ?? '');
    setIsCcOpen(true);
  };

  const handleSaveCc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ccName) { toast.error('Cost Center Name is required'); return; }
    const managerEmployee = employees?.items?.find((emp: any) => emp.id === ccManagerId);
    
    const payloadData: any = {
      name:              ccName,
      type:              ccType,
      branchId:          ccBranchId || undefined,
      departmentId:      ccDeptId || undefined,
      managerId:         ccManagerId || undefined,
      managerName:       managerEmployee ? `${managerEmployee.firstName} ${managerEmployee.lastName}` : ccManagerName || undefined,
      budget:            Number(ccBudget),
      headcountCapacity: Number(ccCapacity),
      effectiveFrom:     ccEffectiveFrom || new Date().toISOString().split('T')[0],
      description:       ccDescription,
      isActive:          ccStatus === 'Active',
    };

    if (!editingCc?.id) {
      payloadData.companyId = ccCompanyId || companyIdForLists;
      payloadData.code = ccCode || generateUniqueCcCode();
    }

    ccUpsertMutation.mutate({
      id: editingCc?.id,
      data: payloadData,
    });
  };

  const handleDeleteCc = (id: string) => {
    if (window.confirm('Permanently delete this Cost Center?')) {
      ccDeleteMutation.mutate(id);
    }
  };

  // Grade Actions
  const openAddGrade = () => {
    setEditingGrade(null);
    setGradeCompanyId(companyIdForLists);
    setGradeBusinessUnit(companies?.[0]?.businessUnit ?? '');
    setGradeCode(generateUniqueGradeCode());
    setGradeName('');
    setGradeLevel('L1');
    setGradeCategory('Professional');
    setGradeJobFamily('Engineering');
    setGradeDepartmentId(departments?.[0]?.id ?? '');
    setGradeMinSalary(30000);
    setGradeMaxSalary(60000);
    setGradeCurrency(companies?.[0]?.currency ?? 'INR');
    setGradeEffectiveFrom(new Date().toISOString().split('T')[0]);
    setGradeStatus('Active');
    setGradeDescription('');
    setIsGradeOpen(true);
  };

  const openEditGrade = (item: PayGrade) => {
    setEditingGrade(item);
    setGradeCompanyId(item.companyId);
    setGradeBusinessUnit(item.businessUnit ?? '');
    setGradeCode(item.gradeCode);
    setGradeName(item.gradeName);
    setGradeLevel(item.level);
    setGradeCategory(item.category ?? 'Professional');
    setGradeJobFamily(item.jobFamily ?? '');
    setGradeDepartmentId(item.departmentId ?? '');
    setGradeMinSalary(Number(item.minSalary));
    setGradeMaxSalary(Number(item.maxSalary));
    setGradeCurrency(item.currency ?? 'INR');
    setGradeEffectiveFrom(item.effectiveFrom?.split('T')[0] ?? '');
    setGradeStatus(item.isActive ? 'Active' : 'Inactive');
    setGradeDescription(item.description ?? '');
    setIsGradeOpen(true);
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeCode || !gradeName) { toast.error('Grade Code and Grade Name are required'); return; }
    
    // Automatically match L1/E2 etc. if E2 is L2, otherwise maintain consistency
    let finalLevel = gradeLevel;
    if (gradeCode.toUpperCase().startsWith('E2') && gradeLevel === 'L1') {
      finalLevel = 'L2';
    }

    const payloadData: any = {
      businessUnit:  gradeBusinessUnit || undefined,
      gradeName,
      level:         finalLevel,
      category:      gradeCategory,
      jobFamily:     gradeJobFamily || undefined,
      departmentId:  gradeDepartmentId || undefined,
      minSalary:     Number(gradeMinSalary),
      maxSalary:     Number(gradeMaxSalary),
      currency:      gradeCurrency,
      effectiveFrom: gradeEffectiveFrom || new Date().toISOString().split('T')[0],
      description:   gradeDescription,
      isActive:      gradeStatus === 'Active',
    };

    if (!editingGrade?.id) {
      payloadData.companyId = gradeCompanyId;
      payloadData.gradeCode = gradeCode;
    }

    gradeUpsertMutation.mutate({
      id: editingGrade?.id,
      data: payloadData,
    });
  };

  const handleDeleteGrade = (id: string) => {
    if (window.confirm('Permanently delete this Pay Grade?')) {
      gradeDeleteMutation.mutate(id);
    }
  };

  // Search/Filter calculations
  const filteredCostCenters = useMemo(() => {
    if (!searchCcQuery.trim()) return costCenters;
    const q = searchCcQuery.toLowerCase();
    return costCenters.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q)
    );
  }, [costCenters, searchCcQuery]);

  const filteredPayGrades = useMemo(() => {
    if (!searchGradeQuery.trim()) return payGrades;
    const q = searchGradeQuery.toLowerCase();
    return payGrades.filter(
      g =>
        g.gradeName.toLowerCase().includes(q) ||
        g.gradeCode.toLowerCase().includes(q) ||
        g.level.toLowerCase().includes(q) ||
        (g.jobFamily?.toLowerCase() ?? '').includes(q) ||
        (g.category?.toLowerCase() ?? '').includes(q)
    );
  }, [payGrades, searchGradeQuery]);

  // Dashboard Stats Calculations
  const totalBudget = useMemo(() => {
    return costCenters.reduce((sum, c) => sum + (Number(c.budget) || 0), 0);
  }, [costCenters]);

  const formattedTotalBudget = useMemo(() => {
    const budgetInLakh = totalBudget / 100000;
    return `₹${budgetInLakh.toFixed(2)} Lakh`;
  }, [totalBudget]);

  return (
    <div className="space-y-6">
      {/* ── Top Performance & Financial KPI Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Cost Centers</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">{costCenters.length} Accounts</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">100% Fully Allocated</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Annual Budget</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">{formattedTotalBudget}</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">Approved & Verified</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Active Grade Bands</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">{payGrades.length} Tiers</p>
              <p className="text-[10px] text-violet-600 font-semibold mt-1">E1 - L4 Levels Configured</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 shrink-0">
              <Award className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Budget Variance</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">-2.8%</p>
              <p className="text-[10px] text-amber-600 font-semibold mt-1">Under Operating Budget</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 1. Cost Centers Management Panel ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Corporate Financial Cost Centers
              </CardTitle>
              <CardDescription className="text-xs">
                Allocate departmental budgets, cost center managers, headcount limits and financial accountability
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
                <button
                  onClick={() => setDisplayMode('grid')}
                  className={`p-1.5 rounded-lg text-xs transition-all ${displayMode === 'grid' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                  title="Grid View"
                >
                  <Grid className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setDisplayMode('table')}
                  className={`p-1.5 rounded-lg text-xs transition-all ${displayMode === 'table' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                  title="Table View"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative w-48 sm:w-60">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filter cost centers..."
                  value={searchCcQuery}
                  onChange={e => setSearchCcQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-background"
                />
              </div>

              {/* Add Cost Center Dialog */}
              <Dialog open={isCcOpen} onOpenChange={setIsCcOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openAddCc}>
                    <Plus className="h-3.5 w-3.5" /> Add Cost Center
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingCc ? 'Edit Cost Center' : 'Create New Cost Center'}</DialogTitle>
                  </DialogHeader>
                  <form className="space-y-4 text-xs" onSubmit={handleSaveCc}>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold">Company Entity *</Label>
                        <Select value={ccCompanyId} onValueChange={setCcCompanyId}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select Company" />
                          </SelectTrigger>
                          <SelectContent>
                            {companies?.map((c: any) => (
                              <SelectItem key={c.id} value={c.id} className="text-xs">
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold">Cost Center Code (Auto Generated) *</Label>
                        <Input
                          placeholder="e.g. CC-105"
                          value={ccCode}
                          onChange={e => setCcCode(e.target.value)}
                          className="h-9 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold">Cost Center Name *</Label>
                        <Input
                          placeholder="e.g. R&D Infrastructure"
                          value={ccName}
                          onChange={e => setCcName(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold">Cost Center Type *</Label>
                        <Select value={ccType} onValueChange={setCcType}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Department" className="text-xs">Department</SelectItem>
                            <SelectItem value="Project" className="text-xs">Project</SelectItem>
                            <SelectItem value="Production" className="text-xs">Production</SelectItem>
                            <SelectItem value="Support" className="text-xs">Support</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold">Mapped Department *</Label>
                        <Select value={ccDeptId} onValueChange={setCcDeptId}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select Department" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments?.map((d: any) => (
                              <SelectItem key={d.id} value={d.id} className="text-xs">
                                {d.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold">Branch / Location *</Label>
                        <Select value={ccBranchId} onValueChange={setCcBranchId}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select Location" />
                          </SelectTrigger>
                          <SelectContent>
                            {branches?.map((b: any) => (
                              <SelectItem key={b.id} value={b.id} className="text-xs">
                                {b.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold">Cost Center Head *</Label>
                        <Select value={ccManagerId} onValueChange={setCcManagerId}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select Responsible Head" />
                          </SelectTrigger>
                          <SelectContent>
                            {employees?.items?.map((emp: any) => (
                              <SelectItem key={emp.id} value={emp.id} className="text-xs">
                                {emp.firstName} {emp.lastName} ({emp.designation?.title ?? 'Personnel'})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold">Annual Allocation Budget (INR) *</Label>
                        <Input
                          type="number"
                          value={ccBudget}
                          onChange={e => setCcBudget(Number(e.target.value))}
                          className="h-9 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold">Headcount Capacity Limit *</Label>
                        <Input
                          type="number"
                          value={ccCapacity}
                          onChange={e => setCcCapacity(Number(e.target.value))}
                          className="h-9 text-xs font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold">Effective From Date *</Label>
                        <Input
                          type="date"
                          value={ccEffectiveFrom}
                          onChange={e => setCcEffectiveFrom(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Status *</Label>
                      <Select value={ccStatus} onValueChange={(v: any) => setCcStatus(v)}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active" className="text-xs">Active</SelectItem>
                          <SelectItem value="Inactive" className="text-xs">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Description / Notes</Label>
                      <textarea
                        rows={2}
                        value={ccDescription}
                        onChange={e => setCcDescription(e.target.value)}
                        placeholder="Provide details about the budget scope..."
                        className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>

                    <DialogFooter>
                      <Button type="submit" size="sm" className="text-xs">
                        {editingCc ? 'Save Changes' : 'Create Cost Center'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {displayMode === 'grid' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
              {filteredCostCenters.map(cc => {
                const currentStaffCount = headcountMap[cc.code || ''] || 0;
                const percentage = cc.headcountCapacity > 0 ? Math.round((currentStaffCount / cc.headcountCapacity) * 100) : 0;
                
                // Mapped department name
                const deptName = departments?.find((d: any) => d.id === cc.departmentId)?.name ?? cc.type;
                // Mapped manager name
                const head = employees?.items?.find((e: any) => e.id === cc.managerId);
                const headName = head ? `${head.firstName} ${head.lastName}` : 'Unassigned';

                return (
                  <div
                    key={cc.id}
                    className="flex flex-col justify-between rounded-xl border border-border/80 bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${cc.isActive ? 'bg-primary' : 'bg-muted-foreground'}`} />
                          <span className="font-mono text-xs font-semibold text-primary">{cc.code}</span>
                          <Badge variant="outline" className="text-[10px] font-semibold">
                            {deptName}
                          </Badge>
                          {!cc.isActive && (
                            <Badge variant="destructive" className="text-[9px] h-4 py-0 font-medium">Inactive</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => openEditCc(cc)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteCc(cc.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      <h3 className="text-base font-semibold text-foreground mt-2 group-hover:text-primary transition-colors">
                        {cc.name}
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-2 mt-2 text-[11px] text-muted-foreground">
                        <p className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>Head: <strong className="text-foreground">{headName}</strong></span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>Effective: <strong className="text-foreground">{cc.effectiveFrom?.split('T')[0]}</strong></span>
                        </p>
                      </div>
                      
                      {cc.description && (
                        <p className="text-[11px] text-muted-foreground bg-muted/40 rounded-lg p-2 mt-2.5 italic">
                          {cc.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 space-y-3 border-t border-border/50 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Annual Allocation</span>
                        <span className="font-mono font-semibold text-sm text-foreground">{formatCurrency(cc.budget)}</span>
                      </div>

                      {/* Headcount Consumption Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground font-medium flex items-center gap-1">
                            <Users className="h-3 w-3" /> Staff Allocation
                          </span>
                          <span className="font-mono font-semibold text-foreground">
                            {currentStaffCount} / {cc.headcountCapacity} Staff ({percentage}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(percentage, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {displayMode === 'table' && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">CC Code</TableHead>
                  <TableHead className="text-xs">Cost Center Name</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Mapped Department</TableHead>
                  <TableHead className="text-xs">Annual Budget</TableHead>
                  <TableHead className="text-xs">Responsible Head</TableHead>
                  <TableHead className="text-xs">Headcount</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-right text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCostCenters.map(cc => {
                  const currentStaffCount = headcountMap[cc.code || ''] || 0;
                  const deptName = departments?.find((d: any) => d.id === cc.departmentId)?.name ?? cc.type;
                  const head = employees?.items?.find((e: any) => e.id === cc.managerId);
                  const headName = head ? `${head.firstName} ${head.lastName}` : 'Unassigned';

                  return (
                    <TableRow key={cc.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono text-xs font-semibold text-primary">{cc.code}</TableCell>
                      <TableCell className="font-semibold text-xs text-foreground">{cc.name}</TableCell>
                      <TableCell className="text-xs font-medium text-muted-foreground">{cc.type}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{deptName}</TableCell>
                      <TableCell className="text-xs font-mono font-semibold text-foreground">{formatCurrency(cc.budget)}</TableCell>
                      <TableCell className="text-xs font-medium">{headName}</TableCell>
                      <TableCell className="text-xs font-mono">{currentStaffCount} / {cc.headcountCapacity} Staff</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant={cc.isActive ? 'default' : 'secondary'} className="text-[10px] font-semibold py-0.5">
                          {cc.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditCc(cc)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteCc(cc.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* ── 2. Job Grades & Level Bands Section ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Award className="h-4 w-4 text-violet-500" /> Job Grades & Level Bands
              </CardTitle>
              <CardDescription className="text-xs">
                Standardized salary Scale CTC bands, job level hierarchies, and reporting category assignments
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative w-48 sm:w-60">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filter grades..."
                  value={searchGradeQuery}
                  onChange={e => setSearchGradeQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-background"
                />
              </div>

              {/* Add Grade Dialog */}
              <Dialog open={isGradeOpen} onOpenChange={setIsGradeOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openAddGrade}>
                    <Plus className="h-3.5 w-3.5" /> Add Job Grade
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingGrade ? 'Edit Job Grade' : 'Create New Job Grade'}</DialogTitle>
                  </DialogHeader>
                  <form className="space-y-4 text-xs" onSubmit={handleSaveGrade}>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold">Company Entity *</Label>
                        <Select value={gradeCompanyId} onValueChange={(val) => {
                          setGradeCompanyId(val);
                          const comp = companies?.find(c => c.id === val);
                          if (comp) {
                            setGradeBusinessUnit(comp.businessUnit ?? '');
                            setGradeCurrency(comp.currency ?? 'INR');
                          }
                        }}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select Company" />
                          </SelectTrigger>
                          <SelectContent>
                            {companies?.map((c: any) => (
                              <SelectItem key={c.id} value={c.id} className="text-xs">
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold">Business Unit</Label>
                        <Input
                          placeholder="e.g. Technology Services"
                          value={gradeBusinessUnit}
                          onChange={e => setGradeBusinessUnit(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold">Grade Code *</Label>
                        <Input
                          placeholder="e.g. E2"
                          value={gradeCode}
                          onChange={e => setGradeCode(e.target.value)}
                          className="h-9 text-xs font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold">Grade Name *</Label>
                        <Input
                          placeholder="e.g. Executive E2"
                          value={gradeName}
                          onChange={e => setGradeName(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold">Job Level *</Label>
                        <Select value={gradeLevel} onValueChange={setGradeLevel}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select Level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="L1" className="text-xs font-semibold">Level 1 (L1)</SelectItem>
                            <SelectItem value="L2" className="text-xs font-semibold">Level 2 (L2)</SelectItem>
                            <SelectItem value="L3" className="text-xs font-semibold">Level 3 (L3)</SelectItem>
                            <SelectItem value="L4" className="text-xs font-semibold">Level 4 (L4)</SelectItem>
                            <SelectItem value="L5" className="text-xs font-semibold">Level 5 (L5)</SelectItem>
                            <SelectItem value="L6" className="text-xs font-semibold">Level 6 (L6)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold">Grade Category *</Label>
                        <Select value={gradeCategory} onValueChange={setGradeCategory}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Executive" className="text-xs">Executive</SelectItem>
                            <SelectItem value="Management" className="text-xs">Management</SelectItem>
                            <SelectItem value="Professional" className="text-xs">Professional</SelectItem>
                            <SelectItem value="Staff" className="text-xs">Staff</SelectItem>
                            <SelectItem value="Worker" className="text-xs">Worker</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold">Job Family</Label>
                        <Input
                          placeholder="e.g. Engineering / HR"
                          value={gradeJobFamily}
                          onChange={e => setGradeJobFamily(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold">Department Mapping</Label>
                        <Select value={gradeDepartmentId} onValueChange={setGradeDepartmentId}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select Department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__" className="text-xs text-muted-foreground italic">None (Global)</SelectItem>
                            {departments?.map((d: any) => (
                              <SelectItem key={d.id} value={d.id} className="text-xs">
                                {d.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1 col-span-1">
                        <Label className="text-[11px] font-semibold">Currency</Label>
                        <Input
                          readOnly
                          value={gradeCurrency}
                          className="h-9 text-xs font-mono bg-muted/40 cursor-not-allowed text-muted-foreground"
                        />
                      </div>

                      <div className="space-y-1 col-span-1">
                        <Label className="text-[11px] font-semibold">Min Salary (CTC) *</Label>
                        <Input
                          type="number"
                          value={gradeMinSalary}
                          onChange={e => setGradeMinSalary(Number(e.target.value))}
                          className="h-9 text-xs font-mono"
                        />
                      </div>

                      <div className="space-y-1 col-span-1">
                        <Label className="text-[11px] font-semibold">Max Salary (CTC) *</Label>
                        <Input
                          type="number"
                          value={gradeMaxSalary}
                          onChange={e => setGradeMaxSalary(Number(e.target.value))}
                          className="h-9 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold">Effective From *</Label>
                        <Input
                          type="date"
                          value={gradeEffectiveFrom}
                          onChange={e => setGradeEffectiveFrom(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold">Status *</Label>
                        <Select value={gradeStatus} onValueChange={(v: any) => setGradeStatus(v)}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Active" className="text-xs">Active</SelectItem>
                            <SelectItem value="Inactive" className="text-xs">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Description</Label>
                      <textarea
                        rows={2}
                        value={gradeDescription}
                        onChange={e => setGradeDescription(e.target.value)}
                        placeholder="Write description about compensation parameters..."
                        className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>

                    <DialogFooter>
                      <Button type="submit" size="sm" className="text-xs">
                        {editingGrade ? 'Save Changes' : 'Create Job Grade'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Grade Code</TableHead>
                <TableHead className="text-xs">Grade Name</TableHead>
                <TableHead className="text-xs">Level</TableHead>
                <TableHead className="text-xs">Category</TableHead>
                <TableHead className="text-xs">Job Family</TableHead>
                <TableHead className="text-xs">Mapped Dept</TableHead>
                <TableHead className="text-xs">Salary CTC Range</TableHead>
                <TableHead className="text-xs text-center">Active Employees</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-right text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayGrades.map(g => {
                const count = gradeCountMap[g.gradeCode] || 0;
                return (
                  <TableRow key={g.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono text-xs font-bold text-violet-600">{g.gradeCode}</TableCell>
                    <TableCell className="font-semibold text-xs text-foreground">{g.gradeName}</TableCell>
                    <TableCell className="text-xs font-semibold text-muted-foreground">{g.level}</TableCell>
                    <TableCell className="text-xs font-medium">{g.category ?? '—'}</TableCell>
                    <TableCell className="text-xs font-semibold text-muted-foreground">{g.jobFamily ?? '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {departments?.find((d: any) => d.id === g.departmentId)?.name ?? 'Global'}
                    </TableCell>
                    <TableCell className="text-xs font-mono font-semibold text-primary">{formatSalaryRange(g.minSalary, g.maxSalary)}</TableCell>
                    <TableCell className="text-xs font-mono font-semibold text-center text-muted-foreground">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] text-foreground font-semibold">
                        {count}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge variant={g.isActive ? 'default' : 'secondary'} className="text-[10px] font-semibold py-0.5">
                        {g.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => openEditGrade(g)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteGrade(g.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
