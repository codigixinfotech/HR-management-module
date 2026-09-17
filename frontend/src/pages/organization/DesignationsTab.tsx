import { useState, useMemo, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Award, Search, Briefcase, Info, Sparkles } from 'lucide-react';
import { branchesApi, departmentsApi, designationsApi } from '@/api/organization';
import { employeesApi } from '@/api/employees';
import { payGradesApi } from '@/api/cost-grades';
import type { Branch, Company, Designation } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/auth-store';
import { isBranchAdminUser } from '@/lib/modules';

// ─── Zod Schema ─────────────────────────────────────────────────────────────
const designationSchema = z.object({
  companyId: z.string().min(1, 'Organization Entity is required'),
  branchId: z.string().optional(),
  departmentId: z.string().min(1, 'Department is required'),
  code: z.string().min(1, 'Code is required'),
  title: z.string().min(1, 'Title is required'),
  jobFamily: z.string().optional(),
  grade: z.string().min(1, 'Grade band is required'),      // gradeCode text
  gradeId: z.string().optional(),                           // FK → PayGrade
  level: z.string().optional(),                             // auto from grade
  reportingDesignationId: z.string().optional(),
  employmentType: z.string().optional(),
  minSalary: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? null : Number(val)),
    z.number().nullable()
  ).optional(),
  maxSalary: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? null : Number(val)),
    z.number().nullable()
  ).optional(),
  effectiveFrom: z.string().min(1, 'Effective date is required'),
  isActive: z.boolean().default(true),
  description: z.string().optional(),
});

type DesignationFormValues = z.infer<typeof designationSchema>;

// ─── Salary helpers ──────────────────────────────────────────────────────────
const getDesigSalaryMultiplier = (unit: string) => {
  if (unit === '₹ Crore')    return 10000000;
  if (unit === '₹ Lakh')     return 100000;
  if (unit === '₹ Thousand') return 1000;
  return 1;
};

const parseSalaryToValueAndUnit = (val?: number | null) => {
  if (!val || val <= 0) return { value: '', unit: '₹ Lakh' };
  // Monthly → annual conversion (if val < 100_000 it's monthly)
  const annualVal = val < 100000 ? val * 12 : val;
  if (annualVal >= 10000000) return { value: (annualVal / 10000000).toFixed(2).replace(/\.?0+$/, ''), unit: '₹ Crore' };
  if (annualVal >= 100000)   return { value: (annualVal / 100000).toFixed(2).replace(/\.?0+$/, ''),   unit: '₹ Lakh' };
  if (annualVal >= 1000)     return { value: (annualVal / 1000).toFixed(2).replace(/\.?0+$/, ''),     unit: '₹ Thousand' };
  return { value: annualVal.toString(), unit: '₹' };
};

const formatSalaryVal = (val: number) => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2).replace(/\.?0+$/, '')} Cr`;
  if (val >= 100000)   return `₹${(val / 100000).toFixed(2).replace(/\.?0+$/, '')} Lakh`;
  if (val >= 1000)     return `₹${(val / 1000).toFixed(0)}K`;
  return `₹${val.toLocaleString('en-IN')}`;
};

const formatSalaryRange = (min?: number | null, max?: number | null) => {
  if (!min && !max) return 'Not Specified';
  const minAnnual = min ? (min < 100000 ? min * 12 : min) : null;
  const maxAnnual = max ? (max < 100000 ? max * 12 : max) : null;
  if (minAnnual && maxAnnual) {
    if (minAnnual >= 100000 && maxAnnual >= 100000 && minAnnual < 10000000 && maxAnnual < 10000000) {
      return `₹${(minAnnual / 100000).toFixed(2).replace(/\.?0+$/, '')} – ₹${(maxAnnual / 100000).toFixed(2).replace(/\.?0+$/, '')} Lakh`;
    }
    if (minAnnual >= 10000000 && maxAnnual >= 10000000) {
      return `₹${(minAnnual / 10000000).toFixed(2).replace(/\.?0+$/, '')} – ₹${(maxAnnual / 10000000).toFixed(2).replace(/\.?0+$/, '')} Crore`;
    }
    return `${formatSalaryVal(minAnnual)} – ${formatSalaryVal(maxAnnual)}`;
  }
  if (minAnnual) return `Min: ${formatSalaryVal(minAnnual)}`;
  return `Max: ${formatSalaryVal(maxAnnual!)}`;
};

// Grade-level badge colour map (display only)
const LEVEL_BADGE: Record<string, string> = {
  'L1': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  'L2': 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  'L3': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  'L4': 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  'L5': 'bg-rose-500/10 text-rose-600 border-rose-500/20',
};

// ─── Component ───────────────────────────────────────────────────────────────
export function DesignationsTab({ companyId, companies }: { companyId?: string; companies: Company[] }) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isBranchAdmin = isBranchAdminUser(user);
  const assignedBranchId = user?.branchId || user?.employee?.branchId;

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Designation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Salary display state (Annual CTC split into value + unit)
  const [minAnnualVal, setMinAnnualVal] = useState<string>('');
  const [minAnnualUnit, setMinAnnualUnit] = useState<string>('₹ Lakh');
  const [maxAnnualVal, setMaxAnnualVal] = useState<string>('');
  const [maxAnnualUnit, setMaxAnnualUnit] = useState<string>('₹ Lakh');

  // Track whether title was manually overridden after grade auto-fill
  const [titleManuallyEdited, setTitleManuallyEdited] = useState(false);

  const form = useForm<DesignationFormValues>({
    resolver: zodResolver(designationSchema) as any,
    defaultValues: {
      companyId: companyId ?? companies[0]?.id ?? '',
      branchId: isBranchAdmin && assignedBranchId ? assignedBranchId : 'HEAD_OFFICE',
      departmentId: '',
      code: '',
      title: '',
      jobFamily: 'Engineering',
      grade: '',
      gradeId: '',
      level: '',
      reportingDesignationId: 'none',
      employmentType: 'Full Time',
      minSalary: null as any,
      maxSalary: null as any,
      effectiveFrom: new Date().toISOString().split('T')[0],
      isActive: true,
      description: '',
    },
  });

  const selectedCompanyId = form.watch('companyId') || companyId || companies[0]?.id || '';
  const selectedBranchId = form.watch('branchId') || (isBranchAdmin && assignedBranchId ? assignedBranchId : 'HEAD_OFFICE');
  const selectedDepartmentId = form.watch('departmentId') || '';
  const watchedGrade = form.watch('grade');
  const watchedTitle = form.watch('title');

  // ── Queries ─────────────────────────────────────────────────────────────────
  const { data: designations, isLoading } = useQuery({
    queryKey: ['designations', selectedCompanyId],
    queryFn: () => designationsApi.list(selectedCompanyId),
  });

  const { data: employeesData } = useQuery({
    queryKey: ['employees', 1, '', selectedCompanyId, isBranchAdmin && assignedBranchId ? assignedBranchId : 'ALL'],
    queryFn: () => employeesApi.list({
      page: 1,
      pageSize: 1000,
      companyId: selectedCompanyId,
      branchId: isBranchAdmin && assignedBranchId ? assignedBranchId : undefined,
    }),
  });

  const { data: branchesList } = useQuery({
    queryKey: ['branches', selectedCompanyId],
    queryFn: () => branchesApi.list(selectedCompanyId),
    enabled: !!selectedCompanyId,
  });

  const { data: departmentOptions } = useQuery({
    queryKey: ['departments', selectedCompanyId, selectedBranchId],
    queryFn: () => departmentsApi.list(
      selectedCompanyId,
      selectedBranchId && selectedBranchId !== 'ALL' ? selectedBranchId : undefined
    ),
    enabled: !!selectedCompanyId,
  });

  const { data: payGradesList } = useQuery({
    queryKey: ['pay-grades', selectedCompanyId, selectedBranchId, selectedDepartmentId],
    queryFn: () => payGradesApi.list(
      selectedCompanyId,
      selectedBranchId && selectedBranchId !== 'ALL' ? selectedBranchId : undefined,
      selectedDepartmentId && selectedDepartmentId !== 'none' ? selectedDepartmentId : undefined
    ),
    enabled: !!selectedCompanyId && !!selectedDepartmentId && selectedDepartmentId !== 'none',
  });

  // ── Derive selected grade object ─────────────────────────────────────────────
  const selectedGradeObj = useMemo(
    () => payGradesList?.find((g) => g.gradeCode === watchedGrade) ?? null,
    [payGradesList, watchedGrade]
  );

  // ── Auto-generate Designation Code from title ────────────────────────────────
  useEffect(() => {
    if (editing) return;
    if (!watchedTitle) {
      form.setValue('code', '');
      return;
    }
    const cleanTitle = watchedTitle
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    form.setValue('code', cleanTitle ? `DESG-${cleanTitle}` : '');
  }, [watchedTitle, form, editing]);

  // ── Hierarchy Change Handlers ───────────────────────────────────────────────
  const handleCompanyChange = (newCompanyId: string) => {
    form.setValue('companyId', newCompanyId, { shouldValidate: true, shouldDirty: true });
    form.setValue('branchId', isBranchAdmin && assignedBranchId ? assignedBranchId : 'HEAD_OFFICE', { shouldValidate: true, shouldDirty: true });
    handleDepartmentChange('');
  };

  const handleBranchChange = (newBranchId: string) => {
    form.setValue('branchId', newBranchId, { shouldValidate: true, shouldDirty: true });
    handleDepartmentChange('');
  };

  const handleDepartmentChange = (newDeptId: string) => {
    form.setValue('departmentId', newDeptId, { shouldValidate: true, shouldDirty: true });

    // When department changes, clear previous grade and all grade-dependent fields
    form.setValue('grade', '', { shouldValidate: true, shouldDirty: true });
    form.setValue('gradeId', '', { shouldValidate: true, shouldDirty: true });
    form.setValue('level', '', { shouldValidate: true, shouldDirty: true });
    form.setValue('title', '', { shouldValidate: true, shouldDirty: true });
    form.setValue('code', '', { shouldValidate: true, shouldDirty: true });
    form.setValue('minSalary', null as any, { shouldValidate: true, shouldDirty: true });
    form.setValue('maxSalary', null as any, { shouldValidate: true, shouldDirty: true });
    setMinAnnualVal('');
    setMinAnnualUnit('₹ Lakh');
    setMaxAnnualVal('');
    setMaxAnnualUnit('₹ Lakh');
    setTitleManuallyEdited(false);
  };

  // ── Grade change handler — auto-populate from Grade Master ──────────────────
  const handleGradeChange = (gradeCode: string) => {
    const g = payGradesList?.find((pg) => pg.gradeCode === gradeCode);

    // Always set gradeCode and gradeId
    form.setValue('grade', gradeCode, { shouldValidate: true, shouldDirty: true });
    form.setValue('gradeId', g?.id ?? '', { shouldValidate: true, shouldDirty: true });
    form.setValue('level', g?.level ?? '', { shouldValidate: true, shouldDirty: true });

    // Auto-populate Job Designation Title and Code from grade
    if (g?.gradeName) {
      form.setValue('title', g.gradeName, { shouldValidate: true, shouldDirty: true });
      setTitleManuallyEdited(false);

      const cleanTitle = g.gradeName
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      form.setValue('code', cleanTitle ? `DESG-${cleanTitle}` : '', { shouldValidate: true, shouldDirty: true });
    }

    // Auto-populate salary from Grade Master (source of truth)
    if (g) {
      const minSalRaw = Number(g.minSalary);
      const maxSalRaw = Number(g.maxSalary);
      form.setValue('minSalary', minSalRaw || (null as any), { shouldValidate: true, shouldDirty: true });
      form.setValue('maxSalary', maxSalRaw || (null as any), { shouldValidate: true, shouldDirty: true });

      // Annual CTC display fields
      if (minSalRaw > 0) {
        const minP = parseSalaryToValueAndUnit(minSalRaw);
        setMinAnnualVal(minP.value);
        setMinAnnualUnit(minP.unit);
      } else {
        setMinAnnualVal('');
        setMinAnnualUnit('₹ Lakh');
      }
      if (maxSalRaw > 0) {
        const maxP = parseSalaryToValueAndUnit(maxSalRaw);
        setMaxAnnualVal(maxP.value);
        setMaxAnnualUnit(maxP.unit);
      } else {
        setMaxAnnualVal('');
        setMaxAnnualUnit('₹ Lakh');
      }
    } else {
      // Grade cleared — reset dependent fields
      form.setValue('level', '', { shouldValidate: true, shouldDirty: true });
      form.setValue('gradeId', '', { shouldValidate: true, shouldDirty: true });
      setMinAnnualVal('');
      setMinAnnualUnit('₹ Lakh');
      setMaxAnnualVal('');
      setMaxAnnualUnit('₹ Lakh');
    }
  };

  // ── Mutations ────────────────────────────────────────────────────────────────
  const upsertMutation = useMutation({
    mutationFn: async (values: DesignationFormValues) => {
      // Use manual salary override if user changed the CTC fields
      const calcMin = minAnnualVal !== '' && !isNaN(Number(minAnnualVal))
        ? Number(minAnnualVal) * getDesigSalaryMultiplier(minAnnualUnit)
        : null;
      const calcMax = maxAnnualVal !== '' && !isNaN(Number(maxAnnualVal))
        ? Number(maxAnnualVal) * getDesigSalaryMultiplier(maxAnnualUnit)
        : null;

      const { branchId: _unusedBranchId, ...restValues } = values;
      const payload = {
        ...restValues,
        gradeId: values.gradeId && values.gradeId !== '' ? values.gradeId : null,
        level: values.level || null,
        departmentId: (values.departmentId && values.departmentId !== 'none') ? values.departmentId : null,
        reportingDesignationId: (values.reportingDesignationId && values.reportingDesignationId !== 'none') ? values.reportingDesignationId : null,
        minSalary: calcMin,
        maxSalary: calcMax,
        effectiveFrom: new Date(values.effectiveFrom).toISOString(),
        description: values.description || null,
      };
      return editing ? designationsApi.update(editing.id, payload) : designationsApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designations'] });
      toast.success(editing ? 'Designation updated' : 'Designation created');
      setOpen(false);
      setEditing(null);
      setTitleManuallyEdited(false);
      form.reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => designationsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designations'] });
      toast.success('Designation deleted');
    },
  });

  // ── Open form helpers ────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setTitleManuallyEdited(false);
    setMinAnnualVal('');
    setMinAnnualUnit('₹ Lakh');
    setMaxAnnualVal('');
    setMaxAnnualUnit('₹ Lakh');
    form.reset({
      companyId: companyId ?? companies[0]?.id ?? '',
      branchId: isBranchAdmin && assignedBranchId ? assignedBranchId : 'HEAD_OFFICE',
      departmentId: '',
      code: '',
      title: '',
      jobFamily: 'Engineering',
      grade: '',
      gradeId: '',
      level: '',
      reportingDesignationId: 'none',
      employmentType: 'Full Time',
      minSalary: null as any,
      maxSalary: null as any,
      effectiveFrom: new Date().toISOString().split('T')[0],
      isActive: true,
      description: '',
    });
    setOpen(true);
  };

  const openEdit = (designation: Designation) => {
    setEditing(designation);
    setTitleManuallyEdited(true); // prevent overwriting title on edit

    const minP = parseSalaryToValueAndUnit(designation.minSalary);
    setMinAnnualVal(minP.value);
    setMinAnnualUnit(minP.unit);

    const maxP = parseSalaryToValueAndUnit(designation.maxSalary);
    setMaxAnnualVal(maxP.value);
    setMaxAnnualUnit(maxP.unit);

    // Resolve branch from department or payGrade (null = Head Office)
    const rawBranchId = designation.department?.branchId || designation.payGrade?.branchId;
    const resolvedBranchId = rawBranchId ? rawBranchId : 'HEAD_OFFICE';

    form.reset({
      companyId: designation.companyId,
      branchId: resolvedBranchId,
      departmentId: designation.departmentId ?? '',
      code: designation.code,
      title: designation.title,
      jobFamily: designation.jobFamily ?? 'Engineering',
      grade: designation.grade ?? designation.payGrade?.gradeCode ?? '',
      gradeId: designation.gradeId ?? designation.payGrade?.id ?? '',
      level: designation.level ?? designation.payGrade?.level ?? '',
      reportingDesignationId: designation.reportingDesignationId ?? 'none',
      employmentType: designation.employmentType ?? 'Full Time',
      minSalary: designation.minSalary ?? (null as any),
      maxSalary: designation.maxSalary ?? (null as any),
      effectiveFrom: designation.effectiveFrom ? designation.effectiveFrom.split('T')[0] : new Date().toISOString().split('T')[0],
      isActive: designation.isActive,
      description: designation.description ?? '',
    });
    setOpen(true);
  };

  const filteredDesignations = useMemo(() => {
    if (!designations) return [];
    if (!searchQuery.trim()) return designations;
    const q = searchQuery.toLowerCase();
    return designations.filter(d =>
      d.title.toLowerCase().includes(q) ||
      d.code.toLowerCase().includes(q) ||
      (d.grade && d.grade.toLowerCase().includes(q)) ||
      (d.payGrade?.gradeName && d.payGrade.gradeName.toLowerCase().includes(q))
    );
  }, [designations, searchQuery]);

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <Card className="shadow-xs border-border/80">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" /> Career Job Designations &amp; Grade Bands
            </CardTitle>
            <CardDescription className="text-xs">
              Job titles, compensation scale bands &amp; department mappings across executive tiers
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="relative w-48 sm:w-60">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Filter designations or grade..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-background"
              />
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openCreate} disabled={companies.length === 0}>
                  <Plus className="h-3.5 w-3.5" /> Add Designation
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editing ? 'Edit Job Designation' : 'Create New Designation'}</DialogTitle>
                </DialogHeader>

                <form className="space-y-4 text-xs" onSubmit={form.handleSubmit((values) => upsertMutation.mutate(values))}>
                  {/* Row 1: Organization + Department */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Organization Entity *</Label>
                      <Select value={form.watch('companyId')} onValueChange={(v) => form.setValue('companyId', v)}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select organization" /></SelectTrigger>
                        <SelectContent>
                          {companies.map((c) => (
                            <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.companyId && <p className="text-[10px] text-destructive">{form.formState.errors.companyId.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Mapped Department *</Label>
                      <Select value={form.watch('departmentId')} onValueChange={(v) => form.setValue('departmentId', v)}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select department" /></SelectTrigger>
                        <SelectContent>
                          {departmentOptions?.map((d) => (
                            <SelectItem key={d.id} value={d.id} className="text-xs">{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.departmentId && <p className="text-[10px] text-destructive">{form.formState.errors.departmentId.message}</p>}
                    </div>
                  </div>

                  {/* Row 2: Pay Grade / Level — MAIN TRIGGER */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Pay Grade / Level *</Label>
                    <Select value={form.watch('grade')} onValueChange={handleGradeChange}>
                      <SelectTrigger className="h-9 text-xs font-mono">
                        <SelectValue placeholder="Select grade from Grade Master..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {payGradesList?.length === 0 && (
                          <SelectItem value="__none__" disabled className="text-xs text-muted-foreground">
                            No Grade Master records — add via Cost Centers &amp; Grades
                          </SelectItem>
                        )}
                        {payGradesList?.map((g) => (
                          <SelectItem key={g.id} value={g.gradeCode} className="text-xs">
                            <span className="font-mono font-semibold">{g.gradeCode}</span>
                            <span className="text-muted-foreground ml-1.5">— {g.gradeName}</span>
                            <span className="text-[10px] text-slate-400 ml-1.5">({g.level} · {g.category})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.grade && <p className="text-[10px] text-destructive">{form.formState.errors.grade.message}</p>}

                    {/* ── Grade Info Preview Panel ── */}
                    {selectedGradeObj && (
                      <div className="mt-2 p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/50 space-y-2">
                        <p className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5" />
                          Grade Master Auto-Fill — values sourced from DB
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                          <div className="bg-white dark:bg-slate-900 rounded-lg p-2 border border-indigo-100 dark:border-indigo-900/60">
                            <p className="text-[10px] text-slate-500 uppercase font-medium">Grade Code</p>
                            <p className="text-xs font-bold text-indigo-600 font-mono mt-0.5">{selectedGradeObj.gradeCode}</p>
                          </div>
                          <div className="bg-white dark:bg-slate-900 rounded-lg p-2 border border-indigo-100 dark:border-indigo-900/60">
                            <p className="text-[10px] text-slate-500 uppercase font-medium">Level</p>
                            <p className="text-xs font-bold text-indigo-600 mt-0.5">{selectedGradeObj.level}</p>
                          </div>
                          <div className="bg-white dark:bg-slate-900 rounded-lg p-2 border border-indigo-100 dark:border-indigo-900/60">
                            <p className="text-[10px] text-slate-500 uppercase font-medium">Category</p>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">{selectedGradeObj.category}</p>
                          </div>
                          <div className="bg-white dark:bg-slate-900 rounded-lg p-2 border border-indigo-100 dark:border-indigo-900/60">
                            <p className="text-[10px] text-slate-500 uppercase font-medium">Salary CTC</p>
                            <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">
                              {formatSalaryRange(Number(selectedGradeObj.minSalary), Number(selectedGradeObj.maxSalary))}
                            </p>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Info className="h-3 w-3 shrink-0" />
                          Title, level, and CTC auto-filled from Grade Master. You may override the title below.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Row 3: Code + Title */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Designation Code (Auto)</Label>
                      <Input
                        placeholder="e.g. DESG-101"
                        value={form.watch('code') || ''}
                        onChange={(e) => form.setValue('code', e.target.value, { shouldValidate: true, shouldDirty: true })}
                        className="h-9 text-xs font-mono"
                      />
                      {form.formState.errors.code && <p className="text-[10px] text-destructive">{form.formState.errors.code.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold flex items-center gap-1.5">
                        Job Designation Title *
                        {selectedGradeObj && !titleManuallyEdited && (
                          <span className="text-[10px] font-normal text-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded-full border border-indigo-200">
                            Auto from grade
                          </span>
                        )}
                      </Label>
                      <Input
                        placeholder="e.g. Senior Software Engineer"
                        value={form.watch('title') || ''}
                        onChange={(e) => {
                          form.setValue('title', e.target.value, { shouldValidate: true, shouldDirty: true });
                          if (selectedGradeObj && e.target.value !== selectedGradeObj.gradeName) {
                            setTitleManuallyEdited(true);
                          }
                        }}
                        className="h-9 text-xs font-medium"
                      />
                      {form.formState.errors.title && <p className="text-[10px] text-destructive">{form.formState.errors.title.message}</p>}
                    </div>
                  </div>

                  {/* Row 4: Level (auto-filled, editable) + Reporting Designation */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold flex items-center gap-1.5">
                        Level
                        {selectedGradeObj && (
                          <span className="text-[10px] font-normal text-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded-full border border-indigo-200">
                            Auto from grade
                          </span>
                        )}
                      </Label>
                      <Input
                        placeholder="e.g. L1"
                        value={form.watch('level') || ''}
                        onChange={(e) => form.setValue('level', e.target.value, { shouldValidate: true, shouldDirty: true })}
                        className="h-9 text-xs font-mono"
                        readOnly={!!selectedGradeObj}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Reporting Designation (Optional)</Label>
                      <Select value={form.watch('reportingDesignationId') || 'none'} onValueChange={(v) => form.setValue('reportingDesignationId', v)}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select reporting line" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" className="text-xs">None (Reports to MD/Self)</SelectItem>
                          {designations?.filter(d => d.id !== editing?.id).map((d) => (
                            <SelectItem key={d.id} value={d.id} className="text-xs">{d.title} ({d.code})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Row 5: Employment Type + Status */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Employment Type (Optional)</Label>
                      <Select value={form.watch('employmentType')} onValueChange={(v) => form.setValue('employmentType', v)}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select employment type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Full Time" className="text-xs">Full Time</SelectItem>
                          <SelectItem value="Part Time" className="text-xs">Part Time</SelectItem>
                          <SelectItem value="Contract" className="text-xs">Contract</SelectItem>
                          <SelectItem value="Intern" className="text-xs">Intern</SelectItem>
                          <SelectItem value="Consultant" className="text-xs">Consultant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Status</Label>
                      <Select
                        value={form.watch('isActive') ? 'active' : 'inactive'}
                        onValueChange={(val) => form.setValue('isActive', val === 'active')}
                      >
                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active" className="text-xs">Active</SelectItem>
                          <SelectItem value="inactive" className="text-xs">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Annual CTC Range */}
                  <div className="space-y-2 border border-border/60 rounded-lg p-3 bg-muted/20">
                    <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      Annual Package / CTC Range (Optional)
                      {selectedGradeObj && (
                        <span className="text-[10px] font-normal text-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded-full border border-indigo-200">
                          Auto from grade · editable
                        </span>
                      )}
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[11px] text-muted-foreground">Min Annual CTC</Label>
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="number"
                            step="any"
                            placeholder="e.g. 2.40"
                            value={minAnnualVal}
                            onChange={(e) => setMinAnnualVal(e.target.value)}
                            className="h-9 text-xs"
                          />
                          <Select value={minAnnualUnit} onValueChange={setMinAnnualUnit}>
                            <SelectTrigger className="h-9 w-[120px] text-xs shrink-0 font-medium"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="₹" className="text-xs">₹</SelectItem>
                              <SelectItem value="₹ Thousand" className="text-xs">₹ Thousand</SelectItem>
                              <SelectItem value="₹ Lakh" className="text-xs">₹ Lakh</SelectItem>
                              <SelectItem value="₹ Crore" className="text-xs">₹ Crore</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[11px] text-muted-foreground">Max Annual CTC</Label>
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="number"
                            step="any"
                            placeholder="e.g. 3.24"
                            value={maxAnnualVal}
                            onChange={(e) => setMaxAnnualVal(e.target.value)}
                            className="h-9 text-xs"
                          />
                          <Select value={maxAnnualUnit} onValueChange={setMaxAnnualUnit}>
                            <SelectTrigger className="h-9 w-[120px] text-xs shrink-0 font-medium"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="₹" className="text-xs">₹</SelectItem>
                              <SelectItem value="₹ Thousand" className="text-xs">₹ Thousand</SelectItem>
                              <SelectItem value="₹ Lakh" className="text-xs">₹ Lakh</SelectItem>
                              <SelectItem value="₹ Crore" className="text-xs">₹ Crore</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Effective From */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Effective From *</Label>
                      <Input
                        type="date"
                        value={form.watch('effectiveFrom') || ''}
                        onChange={(e) => form.setValue('effectiveFrom', e.target.value, { shouldValidate: true, shouldDirty: true })}
                        className="h-9 text-xs"
                      />
                      {form.formState.errors.effectiveFrom && <p className="text-[10px] text-destructive">{form.formState.errors.effectiveFrom.message}</p>}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Description (Optional)</Label>
                    <textarea
                      placeholder="Role responsibilities and department alignment..."
                      value={form.watch('description') || ''}
                      onChange={(e) => form.setValue('description', e.target.value, { shouldValidate: true, shouldDirty: true })}
                      className="flex min-h-[70px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-2xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <DialogFooter className="border-t pt-3 mt-3">
                    <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" className="text-xs font-semibold" disabled={upsertMutation.isPending}>
                      {editing ? 'Save Changes' : 'Create Designation'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      {/* ── Designation Table ── */}
      <CardContent className="p-4 sm:p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Code</TableHead>
              <TableHead className="text-xs">Designation Title</TableHead>
              <TableHead className="text-xs">Mapped Department</TableHead>
              <TableHead className="text-xs">Grade Band</TableHead>
              <TableHead className="text-xs">Level</TableHead>
              <TableHead className="text-xs">Reports To</TableHead>
              <TableHead className="text-xs">Type</TableHead>
              <TableHead className="text-xs">Salary Range</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Employees</TableHead>
              <TableHead className="text-right text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={11} className="text-center text-xs text-muted-foreground py-8">
                  Loading designations...
                </TableCell>
              </TableRow>
            )}
            {filteredDesignations.map((designation) => {
              const gradeCode = designation.grade || designation.payGrade?.gradeCode || '—';
              const gradeName = designation.payGrade?.gradeName || gradeCode;
              const level     = designation.level || designation.payGrade?.level || '—';
              const levelBadge = LEVEL_BADGE[level] || 'bg-muted text-foreground';

              return (
                <TableRow key={designation.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold text-primary">{designation.code}</TableCell>
                  <TableCell className="text-xs font-semibold text-foreground">
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      {designation.title}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-muted-foreground">
                    {designation.department?.name ?? 'General Corporate'}
                  </TableCell>
                  <TableCell className="text-xs">
                    <Badge className="text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-700 border-amber-500/20">
                      {gradeCode}
                      {gradeName !== gradeCode && <span className="font-normal text-amber-500 ml-1">· {gradeName}</span>}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    <Badge className={`text-[10px] font-semibold ${levelBadge}`}>{level}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-medium">
                    {designation.reportingDesignation?.title ?? '—'}
                  </TableCell>
                  <TableCell className="text-xs font-medium">{designation.employmentType ?? '—'}</TableCell>
                  <TableCell className="text-xs font-mono font-medium">
                    {formatSalaryRange(designation.minSalary, designation.maxSalary)}
                  </TableCell>
                  <TableCell className="text-xs">
                    <Badge variant={designation.isActive ? 'secondary' : 'outline'} className="text-[10px]">
                      {designation.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono font-semibold text-primary">
                    {(() => {
                      const count = employeesData?.items?.filter((emp: any) => {
                        if (emp.designationId !== designation.id) return false;
                        if (isBranchAdmin && assignedBranchId) return emp.branchId === assignedBranchId;
                        return true;
                      }).length ?? 0;
                      return `${count} Staff`;
                    })()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => openEdit(designation)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(designation.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredDesignations.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={11} className="text-center text-xs text-muted-foreground py-8">
                  No designations match the search query.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
